(function () {
  var STILL = "";
  var SUPPLY = 512;
  var PRICE = "0xeebe0b40e8000";
  var MINT_SIG = "b77a147b";
  var NEXT_ID = "0x61b8ce8c";
  var RPCS = ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org"];
  var MODE = "open";

  var lintelWrap = document.getElementById("lintel-wrap");
  var lintel = document.getElementById("lintel");
  var note = document.getElementById("note");
  var connectBtn = document.getElementById("connect");
  var mintBtn = document.getElementById("mint");
  var priceBtn = document.getElementById("price");
  var left = document.getElementById("left");
  var gridEl = document.getElementById("grid");
  var pool = document.getElementById("pool-wrap");
  var canvas = document.getElementById("pool");
  var COL_ADDR = [
    "0x0000000000000000000000000000000000000002",
    "0x0000000000000000000000000000000000000003",
    "0x0000000000000000000000000000000000000001"
  ];
  var ROWS = [1, 256, 4096];
  var cells = [];
  var figureToken = 0;
  var key = "";
  var proofsReady = false;
  var proofsOk = false;
  var listNote = "the list did not load";
  var heldProof = null;
  var askId = 0;
  var pending = null;
  var worker = null;
  var hallStarted = false;
  var DOOR = "https://metamask.app.link/dapp/stillwtr.github.io/stillwater/art/mint.html";
  var copyTimer = null;
  var timer = null;
  var phase = 0;
  var plateMs = 0;
  var plateDue = 0;
  var platePaused = false;
  var plateBytes = null;
  var plateNonce = 0;
  var ticket = 0;

  function setNote(text) {
    note.textContent = text;
    if (text === "the chain did not answer") note.title = "nonce read failed";
    else note.removeAttribute("title");
  }

  function shortKey(text) {
    var s = (text || "").trim();
    if (s.slice(0, 2) === "0x" || s.slice(0, 2) === "0X") s = s.slice(2);
    if (s.length < 10) return "";
    return "0x" + s.slice(0, 6) + "…" + s.slice(s.length - 4);
  }

  function checksum(raw) {
    var s = (raw || "").trim();
    var bytes = new Uint8Array(40);
    var hash, i, nibble, ch, out;
    if (s.slice(0, 2) === "0x" || s.slice(0, 2) === "0X") s = s.slice(2);
    s = s.toLowerCase();
    if (s.length !== 40) return (raw || "").trim();
    for (i = 0; i < 40; i++) bytes[i] = s.charCodeAt(i);
    hash = PlateKeccak.keccak256(bytes);
    out = "0x";
    for (i = 0; i < 40; i++) {
      nibble = (i & 1) ? (hash[i >> 1] & 15) : (hash[i >> 1] >> 4);
      ch = s.charAt(i);
      out += (ch >= "a" && ch <= "f" && nibble >= 8) ? ch.toUpperCase() : ch;
    }
    return out;
  }

  function clearAddress() {
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = null;
    lintel.classList.remove("copied");
    lintel.textContent = "";
    lintel.removeAttribute("data-full");
    lintelWrap.hidden = true;
  }

  function showAddress() {
    var full;
    if (!key) {
      clearAddress();
      return;
    }
    full = checksum(key);
    lintelWrap.hidden = false;
    lintel.classList.remove("copied");
    lintel.textContent = shortKey(full);
    lintel.setAttribute("data-full", full);
  }

  function showKey(value) {
    key = value || "";
    StillDoor.write(key);
    if (key) StillDoor.off(false);
    clearAddress();
    if (!key) {
      connectBtn.textContent = "connect";
      connectBtn.setAttribute("aria-pressed", "false");
      return;
    }
    connectBtn.textContent = "disconnect";
    connectBtn.setAttribute("aria-pressed", "true");
  }

  function markCopied() {
    var full = lintel.getAttribute("data-full");
    if (!full) return;
    lintel.classList.add("copied");
    lintel.textContent = "copied";
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(function () {
      copyTimer = null;
      lintel.classList.remove("copied");
      if (lintel.getAttribute("data-full") === full) lintel.textContent = shortKey(full);
    }, 1100);
  }

  function copyFallback(text) {
    var area = document.createElement("textarea");
    var ok = false;
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.width = "2em";
    area.style.height = "2em";
    area.style.padding = "0";
    area.style.border = "none";
    area.style.outline = "none";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(area);
    try { lintel.focus({ preventScroll: true }); } catch (e2) { /* quiet */ }
    return ok;
  }

  function copyText(text) {
    var clip = null;
    var legacy = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try { clip = navigator.clipboard.writeText(text); } catch (e) { clip = null; }
    }
    legacy = copyFallback(text);
    if (legacy) markCopied();
    if (clip && typeof clip.then === "function") clip.then(function () { markCopied(); }, function () {});
  }

  function hexWord(n) {
    var s = n.toString(16);
    return "0".repeat(64 - s.length) + s;
  }

  function encodeMint(proof) {
    var body = hexWord(32) + hexWord(proof.length);
    var i;
    var word;
    for (i = 0; i < proof.length; i++) {
      word = String(proof[i]).replace(/^0x/i, "").toLowerCase();
      body += "0".repeat(64 - word.length) + word;
    }
    return "0x" + MINT_SIG + body;
  }

  function disarm() {
    if (timer) clearTimeout(timer);
    timer = null;
    phase = 0;
    platePaused = false;
    plateDue = 0;
    plateMs = 0;
    plateBytes = null;
  }

  function lipOf(el) {
    var pad = getComputedStyle(el);
    return (parseFloat(pad.paddingTop) || 0) + (parseFloat(pad.paddingBottom) || 0);
  }

  function fitPlate() {
    var court = canvas.parentElement.parentElement;
    var room = Math.min(court.clientWidth, court.clientHeight) - lipOf(canvas.parentElement);
    var mult = Math.max(1, Math.floor(room / 128));
    var px = String(mult * 128) + "px";
    canvas.style.width = px;
    canvas.style.height = px;
  }

  function fitGrid() {
    var sample = cells[0].canvas.parentElement;
    var lip = lipOf(sample);
    var gap = parseFloat(getComputedStyle(gridEl).columnGap) || 0;
    var availW = document.documentElement.clientWidth;
    var availH = window.innerHeight;
    var mult = 1;
    var size;
    var i;

    function span(m) {
      return 3 * (m * 128 + lip) + 2 * gap;
    }

    while (span(mult + 1) <= availW && span(mult + 1) <= availH) mult += 1;
    size = String(mult * 128) + "px";
    gridEl.style.gridTemplateColumns = "repeat(3, max-content)";
    for (i = 0; i < cells.length; i++) {
      cells[i].canvas.style.width = size;
      cells[i].canvas.style.height = size;
    }
  }

  function fit() {
    if (pool.hidden) fitGrid();
    else fitPlate();
  }

  function cellPace(cell) {
    var buf = new Uint8Array(24);
    var n = cell.nonce;
    var hash;
    var acc = 0;
    var i;
    buf.set(cell.bytes, 0);
    buf[20] = (n >>> 24) & 255;
    buf[21] = (n >>> 16) & 255;
    buf[22] = (n >>> 8) & 255;
    buf[23] = n & 255;
    hash = PlateKeccak.keccak256(buf);
    for (i = 0; i < 4; i++) acc = (acc * 256) + hash[i];
    return (6 + (acc % 7)) * 1000;
  }

  function buildGrid() {
    var cols = [null, null, null];
    var row;
    var pal;
    var bytes;
    var wrap;
    var cv;
    var cell;
    var i;
    for (i = 0; i < COL_ADDR.length; i++) {
      bytes = Plate.parseAddress(COL_ADDR[i]);
      cols[Plate.derive(bytes).palette] = bytes;
    }
    for (row = 0; row < ROWS.length; row++) {
      for (pal = 0; pal < 3; pal++) {
        wrap = document.createElement("div");
        wrap.className = "pool";
        cv = document.createElement("canvas");
        cv.width = 128;
        cv.height = 128;
        cv.setAttribute("data-pal", Plate.PALETTES[pal].name);
        cv.setAttribute("data-nonce", String(ROWS[row]));
        wrap.appendChild(cv);
        gridEl.appendChild(wrap);
        cell = { canvas: cv, bytes: cols[pal], nonce: ROWS[row], phase: 0 };
        cell.canvas.setAttribute("data-pace", String(cellPace(cell) / 1000));
        cells.push(cell);
      }
    }
  }

  var gridTimer = null;

  function clearGridTimer() {
    if (gridTimer) clearTimeout(gridTimer);
    gridTimer = null;
  }

  /* One paint of the step a plate has reached. Missed steps are not drawn. */
  function paintReached(cell, now) {
    var late, steps;
    if (!cell.ms || !cell.due || now < cell.due) return;
    late = now - cell.due;
    steps = Math.floor(late / cell.ms) + 1;
    cell.phase = (cell.phase + (steps % 32)) & 31;
    cell.due += steps * cell.ms;
    Plate.paint(cell.canvas, cell.bytes, cell.nonce, cell.phase);
  }

  /* A slow paint must not leave the next wake already due. */
  function parkBehind(now) {
    var i, cell;
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      if (!cell.ms || !cell.due || cell.paused) continue;
      if (cell.due <= now) cell.due = now + cell.ms;
    }
  }

  function nextGridWait(now) {
    var i, cell, best;
    best = 0;
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      if (!cell.ms || !cell.due || cell.paused) continue;
      if (!best || cell.due < best) best = cell.due;
    }
    if (!best) return 0;
    if (best <= now) return 1;
    return best - now;
  }

  function armGridWait() {
    var wait;
    clearGridTimer();
    if (document.hidden || gridEl.hidden) return;
    wait = nextGridWait(Date.now());
    if (!wait) return;
    gridTimer = setTimeout(gridWake, wait);
  }

  function gridWake() {
    var now, i;
    gridTimer = null;
    if (document.hidden || gridEl.hidden) return;
    now = Date.now();
    for (i = 0; i < cells.length; i++) {
      if (cells[i].paused) continue;
      paintReached(cells[i], now);
    }
    parkBehind(Date.now());
    armGridWait();
  }

  function plateStep() {
    timer = null;
    if (document.hidden) {
      platePaused = true;
      return;
    }
    if (!plateBytes || !Plate.crawls(MODE)) return;
    phase = (phase + 1) & 31;
    plateDue += plateMs;
    if (plateDue <= Date.now()) plateDue = Date.now() + plateMs;
    Plate.paint(canvas, plateBytes, plateNonce, phase);
    plateWait();
  }

  function plateWait() {
    var wait;
    if (timer) clearTimeout(timer);
    timer = null;
    if (!plateMs || !plateBytes || !Plate.crawls(MODE)) return;
    if (document.hidden) {
      platePaused = true;
      return;
    }
    platePaused = false;
    wait = plateDue - Date.now();
    if (wait < 1) wait = plateMs;
    timer = setTimeout(plateStep, wait);
  }

  function plateReach() {
    var now, late, steps;
    if (!platePaused || pool.hidden) return;
    platePaused = false;
    now = Date.now();
    if (plateDue && now >= plateDue) {
      late = now - plateDue;
      steps = Math.floor(late / plateMs) + 1;
      phase = (phase + (steps % 32)) & 31;
      plateDue += steps * plateMs;
      Plate.paint(canvas, plateBytes, plateNonce, phase);
    }
    plateWait();
  }

  function pauseCrawls() {
    var i;
    if (!gridEl.hidden) {
      clearGridTimer();
      for (i = 0; i < cells.length; i++) {
        if (!cells[i].ms || !cells[i].due) continue;
        cells[i].paused = true;
      }
    }
    if (!pool.hidden && plateMs && plateDue) {
      if (timer) clearTimeout(timer);
      timer = null;
      platePaused = true;
    }
  }

  function wakeCrawls() {
    var i, now;
    if (!gridEl.hidden) {
      now = Date.now();
      for (i = 0; i < cells.length; i++) {
        if (!cells[i].paused) continue;
        cells[i].paused = false;
        paintReached(cells[i], now);
      }
      parkBehind(Date.now());
      armGridWait();
    }
    plateReach();
  }

  function hideGrid() {
    var i;
    clearGridTimer();
    for (i = 0; i < cells.length; i++) {
      cells[i].paused = false;
      cells[i].due = 0;
    }
    gridEl.hidden = true;
  }

  function showGrid() {
    var i, cell, now;
    disarm();
    pool.hidden = true;
    gridEl.hidden = false;
    clearAddress();
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      Plate.paint(cell.canvas, cell.bytes, cell.nonce, cell.phase);
    }
    /* Dues start after the opening paints, so a slow first frame cannot trip the next step. */
    now = Date.now();
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      if (!cell.ms) cell.ms = Number(cell.canvas.getAttribute("data-pace")) * 1000;
      cell.due = now + cell.ms;
      cell.paused = !!document.hidden;
    }
    if (!document.hidden) armGridWait();
    fit();
  }

  function hidePlate() {
    disarm();
    pool.hidden = true;
    showGrid();
  }

  function arm(bytes, nonce) {
    var hash, n, i;
    disarm();
    if (!bytes || !Plate.crawls(MODE)) return;
    hash = PlateKeccak.keccak256(bytes);
    n = 0;
    for (i = 0; i < 4; i++) n = (n * 256) + hash[i];
    phase = 0;
    plateBytes = bytes;
    plateNonce = nonce;
    plateMs = (6 + (n % 7)) * 1000;
    plateDue = Date.now() + plateMs;
    plateWait();
  }

  function showPlate(bytes, nonce) {
    hideGrid();
    pool.hidden = false;
    showAddress();
    Plate.paint(canvas, bytes, nonce, 0);
    fit();
    arm(bytes, nonce);
  }

  function restoreFigure(el) {
    el.classList.remove("fade");
    el.removeAttribute("data-open");
    el.textContent = el.getAttribute("data-value") || "";
  }

  function showFigureName(el) {
    var label = el.getAttribute("data-name");
    var value = el.getAttribute("data-value");
    var token;
    if (!label || !value) return;
    token = ++figureToken;
    restoreFigure(priceBtn);
    restoreFigure(left);
    el.setAttribute("data-open", "1");
    el.textContent = label;
    setTimeout(function () {
      if (token !== figureToken) return;
      el.classList.add("fade");
      setTimeout(function () {
        if (token !== figureToken) return;
        restoreFigure(el);
      }, 280);
    }, 1750);
  }

  function setRemaining(n) {
    left.setAttribute("data-value", String(n));
    if (left.getAttribute("data-open") !== "1") left.textContent = String(n);
  }

  function rpc(method, params, i) {
    if (!i) i = 0;
    if (i >= RPCS.length) return Promise.reject(new Error("rpc"));
    return fetch(RPCS[i], {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: method, params: params })
    }).then(function (res) {
      if (!res.ok) throw new Error("http");
      return res.json();
    }).then(function (body) {
      if (!body || typeof body.result !== "string" || body.error) throw new Error("result");
      return body.result;
    }).catch(function () {
      return rpc(method, params, i + 1);
    });
  }

  function drawKey(addr, mine) {
    var bytes = Plate.parseAddress(addr);
    if (!bytes || Plate.checksumState(addr) === "checksum") {
      hidePlate();
      setNote("checksum");
      return;
    }
    rpc("eth_getTransactionCount", [checksum(addr), "latest"]).then(function (hex) {
      var n;
      if (mine !== ticket) return;
      n = parseInt(hex, 16);
      if (!(n >= 0)) throw new Error("nonce");
      setNote("");
      showPlate(bytes, n);
    }).catch(function () {
      if (mine !== ticket) return;
      hidePlate();
      setNote("the chain did not answer");
    });
  }

  function applyKey() {
    var mine = ++ticket;
    heldProof = null;
    hidePlate();
    if (!key) return;
    if (!proofsReady) return;
    if (!proofsOk) {
      setNote(listNote);
      return;
    }
    pending = { id: ++askId, ticket: mine, addr: key };
    worker.postMessage({ id: pending.id, addr: key.toLowerCase() });
  }

  function readLeft() {
    setRemaining(SUPPLY);
    if (!STILL) return;
    rpc("eth_call", [{ to: STILL, data: NEXT_ID }, "latest"]).then(function (hex) {
      var n = parseInt(hex, 16);
      var remain;
      if (!(n >= 0)) return;
      remain = SUPPLY - n;
      if (remain < 0) remain = 0;
      setRemaining(remain);
    }).catch(function () {});
  }

  function ensureMainnet() {
    return window.ethereum.request({ method: "eth_chainId" }).then(function (id) {
      if (id === "0x1") return;
      return window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }]
      });
    });
  }

  function openDoor() {
    window.location.assign(DOOR);
  }

  function connect() {
    if (!window.ethereum) {
      openDoor();
      return;
    }
    setNote("");
    startHall();
    window.ethereum.request({ method: "eth_requestAccounts" }).then(function (accounts) {
      showKey(accounts && accounts[0] ? accounts[0] : "");
      if (key) applyKey();
    }).catch(function (err) {
      if (err && err.code === 4001) setNote("declined");
    });
  }

  function disconnect() {
    StillDoor.off(true);
    ticket += 1;
    heldProof = null;
    pending = null;
    showKey("");
    hidePlate();
    setNote("");
  }

  function onConnect() {
    if (key) disconnect();
    else connect();
  }

  function mint() {
    if (!window.ethereum) {
      openDoor();
      return;
    }
    if (!key) {
      setNote("connect a key");
      return;
    }
    if (!proofsReady) return;
    if (!proofsOk) {
      setNote(listNote);
      return;
    }
    if (!heldProof) {
      setNote("this key is not in the hall");
      return;
    }
    if (!STILL) {
      setNote("the door is not open");
      return;
    }
    mintBtn.setAttribute("aria-pressed", "true");
    ensureMainnet().then(function () {
      return window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: key,
          to: STILL,
          value: PRICE,
          data: encodeMint(heldProof)
        }]
      });
    }).then(function () {
      mintBtn.setAttribute("aria-pressed", "false");
      setNote("sent");
      readLeft();
    }).catch(function (err) {
      mintBtn.setAttribute("aria-pressed", "false");
      if (err && err.code === 4001) setNote("declined");
      else setNote("mainnet");
    });
  }

  lintel.addEventListener("click", function () {
    var full = lintel.getAttribute("data-full");
    if (full) copyText(full);
  });
  priceBtn.addEventListener("click", function () { showFigureName(priceBtn); });
  left.addEventListener("click", function () { showFigureName(left); });
  connectBtn.addEventListener("click", onConnect);
  mintBtn.addEventListener("click", mint);
  window.addEventListener("resize", fit);

  function startHall() {
    if (hallStarted) return;
    hallStarted = true;
    worker = new Worker("hall-worker.js");
    worker.onerror = function () {
      if (proofsOk) return;
      proofsOk = false;
      proofsReady = true;
      listNote = "the list did not load";
      if (key) applyKey();
    };
    worker.onmessage = function (ev) {
      var msg = ev.data || {};
      if (msg.ready === true) {
        proofsOk = true;
        proofsReady = true;
        if (key) applyKey();
        return;
      }
      if (msg.ready === false) {
        proofsOk = false;
        proofsReady = true;
        listNote = msg.match ? "the list does not match" : "the list did not load";
        if (key) applyKey();
        return;
      }
      if (!pending || msg.id !== pending.id || pending.ticket !== ticket) return;
      if (msg.addr && key && msg.addr !== key.toLowerCase()) return;
      if (msg.miss || !msg.proof) {
        if (heldProof) return;
        heldProof = null;
        return;
      }
      heldProof = msg.proof;
      drawKey(pending.addr, pending.ticket);
    };
    worker.postMessage({ start: true });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pauseCrawls();
    else wakeCrawls();
  });

  /* The Walk and this page share one key. An empty account list does not clear it. */
  function adopt(value) {
    if (!value) {
      if (!key) return;
      ticket += 1;
      heldProof = null;
      pending = null;
      showKey("");
      hidePlate();
      setNote("");
      return;
    }
    if (key && key.toLowerCase() === String(value).toLowerCase()) {
      connectBtn.textContent = "disconnect";
      connectBtn.setAttribute("aria-pressed", "true");
      return;
    }
    setNote("");
    showKey(value);
    startHall();
    if (key) applyKey();
  }

  function pullGranted() {
    var eth = window.ethereum;
    if (!eth || !eth.request || key || StillDoor.isOff()) return;
    eth.request({ method: "eth_accounts" }).then(function (accounts) {
      if (key || StillDoor.isOff()) return;
      if (!accounts || !accounts[0]) return;
      adopt(accounts[0]);
    }).catch(function () {});
  }

  function resume() {
    var saved = StillDoor.read();
    if (saved) {
      adopt(saved);
      return;
    }
    if (StillDoor.isOff()) return;
    pullGranted();
  }

  function watchKey() {
    var eth = window.ethereum;
    if (!eth || !eth.on) return;
    eth.on("accountsChanged", function (accounts) {
      var next = accounts && accounts[0];
      if (!next) return;
      if (StillDoor.isOff() && !key) return;
      adopt(next);
    });
  }

  window.addEventListener("storage", function (ev) {
    if (!ev || ev.key !== StillDoor.name) return;
    adopt(ev.newValue || "");
  });

  window.addEventListener("pageshow", function () {
    resume();
  });

  buildGrid();
  showGrid();
  readLeft();
  resume();
  watchKey();
})();
