(function () {
  var STILL = "";
  var CHAIN = "0x1";
  var SUPPLY = 512;
  var PRICE = "0xeebe0b40e8000";
  var priceWei = PRICE;
  var MINT_SIG = "b77a147b";
  var NEXT_ID = "0x61b8ce8c";
  var MERKLE_SIG = "0x2eb4a7ab";
  var PRICE_SIG = "0xa035b1fe";
  var MAINNET_RPCS = ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org"];
  var SEPOLIA_RPCS = [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://sepolia.drpc.org",
    "https://rpc.sepolia.ethpandaops.io",
    "https://1rpc.io/sepolia",
    "https://ethereum-sepolia.publicnode.com"
  ];
  var RPCS = MAINNET_RPCS;
  var TEST_KEYS = [
    "0x08d97e624214f4ca5283b47c11030ab71bc7304d",
    "0x63dae8be19a773493a11aed1996899ec6cd55f45",
    "0xd934cc70b1b06256581527a534285f5bd6a7edc7"
  ];
  var MODE = "open";

  var lintelWrap = document.getElementById("lintel-wrap");
  var lintel = document.getElementById("lintel");
  var askEl = document.getElementById("ask");
  var note = document.getElementById("note");
  var connectBtn = document.getElementById("connect");
  var mintBtn = document.getElementById("mint");
  var walkBtn = document.getElementById("walk");
  var priceBtn = document.getElementById("price");
  var left = document.getElementById("left");
  var figGap = document.getElementById("fig-gap");
  var mintNo = document.getElementById("mint-no");
  var gridEl = document.getElementById("grid");
  var pool = document.getElementById("pool-wrap");
  var canvas = document.getElementById("pool");
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
  var walkId = 0;
  var nameLink = document.querySelector(".name a");

  function walkHref(id) {
    var chain = CHAIN === "0xaa36a7" ? "sepolia" : "mainnet";
    return "walk.html?chain=" + chain + "&contract=" + STILL + "&id=" + id + "&mode=live";
  }

  /* Bare mint.html leaves STILL empty. A contract in the URL is the hall. */
  function applyHallQuery() {
    var q = new URLSearchParams(location.search);
    var chain = (q.get("chain") || "").toLowerCase();
    var contract = q.get("contract") || "";
    if (!/^0x[0-9a-fA-F]{40}$/.test(contract)) return;
    STILL = contract;
    priceWei = null;
    if (chain === "sepolia") {
      CHAIN = "0xaa36a7";
      RPCS = SEPOLIA_RPCS;
    }
  }

  var HALL_OUT = "this key is not in the hall";

  function setNote(text) {
    note.classList.remove("fade");
    note.textContent = text;
    if (text === "the chain did not answer") note.title = "nonce read failed";
    else note.removeAttribute("title");
  }

  function showHallOut(on) {
    var current = note.textContent || "";
    if (on) {
      if (!current || current === HALL_OUT) setNote(HALL_OUT);
      return;
    }
    if (current === HALL_OUT) setNote("");
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
    hideAsk();
  }

  function hideAsk() {
    askEl.hidden = true;
    askEl.textContent = "";
  }

  function hideWalk() {
    walkId = 0;
    walkBtn.hidden = true;
    if (nameLink) nameLink.setAttribute("href", "walk.html");
  }

  function showWalk(id) {
    if (!(id >= 1) || pool.hidden) return;
    walkId = id;
    walkBtn.hidden = false;
    if (nameLink) nameLink.setAttribute("href", walkHref(id));
  }

  function padWord(hex) {
    var s = String(hex || "").replace(/^0x/i, "").toLowerCase();
    if (s.length > 64) s = s.slice(s.length - 64);
    while (s.length < 64) s = "0" + s;
    return s;
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

  function writeCopy(text, done) {
    var clip = null;
    var legacy = false;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try { clip = navigator.clipboard.writeText(text); } catch (e) { clip = null; }
    }
    legacy = copyFallback(text);
    if (legacy && done) done();
    if (clip && typeof clip.then === "function") clip.then(function () { if (done) done(); }, function () {});
  }

  function copyText(text) {
    writeCopy(text, markCopied);
  }

  function hexWord(n) {
    var s = n.toString(16);
    return "0".repeat(64 - s.length) + s;
  }

  function encodeProof(sig, proof) {
    var body = hexWord(32) + hexWord(proof.length);
    var i;
    var word;
    for (i = 0; i < proof.length; i++) {
      word = String(proof[i]).replace(/^0x/i, "").toLowerCase();
      body += "0".repeat(64 - word.length) + word;
    }
    return "0x" + sig + body;
  }

  function encodeMint(proof) {
    return encodeProof(MINT_SIG, proof);
  }

  function cmp32(a, b) {
    var i;
    for (i = 0; i < 32; i++) if (a[i] !== b[i]) return a[i] - b[i];
    return 0;
  }

  function hashPair(a, b) {
    var left = cmp32(a, b) < 0 ? a : b;
    var right = left === a ? b : a;
    var buf = new Uint8Array(64);
    buf.set(left, 0);
    buf.set(right, 32);
    return PlateKeccak.keccak256(buf);
  }

  function leafOf(addr) {
    var hex = addr.slice(2);
    var raw = new Uint8Array(32);
    var i;
    for (i = 0; i < 20; i++) raw[12 + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return PlateKeccak.keccak256(PlateKeccak.keccak256(raw));
  }

  function tinyRoot() {
    var level = TEST_KEYS.map(leafOf);
    var next;
    var i;
    var s = "";
    var h;
    while (level.length > 1) {
      next = [];
      for (i = 0; i < level.length; i += 2) {
        if (i + 1 >= level.length) next.push(level[i]);
        else next.push(hashPair(level[i], level[i + 1]));
      }
      level = next;
    }
    for (i = 0; i < level[0].length; i++) {
      h = level[0][i].toString(16);
      s += h.length === 1 ? "0" + h : h;
    }
    return "0x" + s;
  }

  function cleanAddr(raw) {
    var s = (raw || "").trim();
    if (s.slice(0, 2) === "0x" || s.slice(0, 2) === "0X") s = s.slice(2);
    if (!/^[0-9a-fA-F]{40}$/.test(s)) return "";
    return "0x" + s.toLowerCase();
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

  function chromeHeight(court) {
    var extra = 0;
    var el;
    for (el = document.body.firstElementChild; el; el = el.nextElementSibling) {
      if (el === court || el.classList.contains("spring")) continue;
      if (getComputedStyle(el).display === "none") continue;
      extra += el.offsetHeight;
    }
    return extra;
  }

  /* One plate fills the room left under the name. The grid keeps its own measure. */
  function fitPlate() {
    var court = canvas.parentElement.parentElement;
    var lip = lipOf(canvas.parentElement);
    var roomW = court.clientWidth || document.documentElement.clientWidth;
    var roomH = window.innerHeight - chromeHeight(court);
    var room = Math.min(roomW, roomH) - lip;
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
    var cell = mult * 128;
    while (cell > 16 && (3 * (cell + lip) + 2 * gap) > availW) cell -= 1;
    size = String(cell) + "px";
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

  function freshLake() {
    var bytes = new Uint8Array(20);
    var hex = "";
    var i;
    crypto.getRandomValues(bytes);
    for (i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
    return { bytes: bytes, hex: hex };
  }

  /* Three new lakes each load. One column is one lake at nonce 1, 256, and 4096. */
  function buildGrid() {
    var lakes = [freshLake(), freshLake(), freshLake()];
    var row;
    var lake;
    var wrap;
    var cv;
    var cell;
    for (row = 0; row < ROWS.length; row++) {
      for (lake = 0; lake < lakes.length; lake++) {
        wrap = document.createElement("div");
        wrap.className = "pool";
        cv = document.createElement("canvas");
        cv.width = 128;
        cv.height = 128;
        cv.setAttribute("data-lake", lakes[lake].hex);
        cv.setAttribute("data-nonce", String(ROWS[row]));
        wrap.appendChild(cv);
        gridEl.appendChild(wrap);
        cell = { canvas: cv, bytes: lakes[lake].bytes, nonce: ROWS[row], phase: 0 };
        cells.push(cell);
      }
    }
  }

  function hideGrid() {
    gridEl.hidden = true;
  }

  function showGrid() {
    var i, cell;
    disarm();
    pool.hidden = true;
    gridEl.hidden = false;
    if (checkRow) checkRow.hidden = false;
    clearAddress();
    for (i = 0; i < cells.length; i++) {
      cell = cells[i];
      cell.phase = 0;
      Plate.paint(cell.canvas, cell.bytes, cell.nonce, 0);
    }
    fit();
  }

  function showPriceLine() {
    priceBtn.hidden = false;
    figGap.hidden = false;
    left.hidden = false;
    mintNo.hidden = true;
    mintNo.textContent = "";
    mintNo.removeAttribute("data-value");
  }

  function showMintNumber(id) {
    var text = "#" + id;
    priceBtn.hidden = true;
    figGap.hidden = true;
    left.hidden = true;
    mintNo.hidden = false;
    mintNo.textContent = text;
    mintNo.setAttribute("data-value", text);
  }

  function hidePlate() {
    disarm();
    pool.hidden = true;
    hideWalk();
    showPriceLine();
    mintBtn.hidden = false;
    showGrid();
  }

  function showPlate(bytes, nonce) {
    hideGrid();
    disarm();
    pool.hidden = false;
    if (checkRow) checkRow.hidden = true;
    showAddress();
    Plate.paint(canvas, bytes, nonce, 0);
    fit();
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
    restoreFigure(mintNo);
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

  function postNode(url, method, params) {
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: method, params: params })
    }).then(function (res) {
      if (!res.ok) throw new Error("http");
      return res.json();
    });
  }

  function nonceAt(addr) {
    var params = [checksum(addr), "latest"];
    function once(url) {
      return postNode(url, "eth_getTransactionCount", params).then(function (body) {
        if (!body || body.result == null || body.error) throw new Error("nonce");
        return body.result;
      });
    }
    return once(RPCS[0]).catch(function () {
      return once(RPCS[1]);
    }).catch(function () {
      var err = new Error("nonce");
      err.nonce = true;
      throw err;
    });
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
    nonceAt(addr).then(function (hex) {
      var n;
      var err;
      if (mine !== ticket) return null;
      n = parseInt(hex, 16);
      if (!(n >= 0)) {
        err = new Error("nonce");
        err.nonce = true;
        throw err;
      }
      return rpc("eth_call", [{ to: STILL, data: "0xeb15aad2" + padWord(addr) }, "latest"]).then(function (idHex) {
        return { n: n, idHex: idHex };
      });
    }).then(function (got) {
      var id;
      if (!got || mine !== ticket) return;
      id = parseInt(got.idHex, 16);
      if (!(id >= 1)) {
        hidePlate();
        return;
      }
      setNote("");
      mintBtn.hidden = true;
      showMintNumber(id);
      showPlate(bytes, got.n);
      showWalk(id);
    }).catch(function (err) {
      if (mine !== ticket) return;
      setNote("the chain did not answer");
    });
  }

  function applyKey() {
    var mine = ++ticket;
    heldProof = null;
    if (!key || !STILL) {
      hidePlate();
      return;
    }
    mintBtn.hidden = true;
    drawKey(key, mine);
    if (!proofsReady) return;
    if (!proofsOk) {
      setNote(listNote);
      return;
    }
    pending = { id: ++askId, ticket: mine, addr: key };
    worker.postMessage({ id: pending.id, addr: key.toLowerCase() });
  }

  /* Anvil can answer the send before latest moves. Wait until that block is visible. */
  function receiptOf(hash, i) {
    if (!i) i = 0;
    if (i >= RPCS.length) return Promise.reject(new Error("pending"));
    return fetch(RPCS[i], {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [hash] })
    }).then(function (res) {
      if (!res.ok) throw new Error("http");
      return res.json();
    }).then(function (body) {
      if (!body || body.error) throw new Error("node");
      if (!body.result) throw new Error("pending");
      return body.result;
    }).catch(function (err) {
      if (err && err.message === "pending") throw err;
      return receiptOf(hash, i + 1);
    });
  }

  function settled(hash, started) {
    if (!started) started = Date.now();
    if (!hash || Date.now() - started > 180000) return Promise.reject(new Error("receipt"));
    return receiptOf(hash).then(function (receipt) {
      var status = receipt && receipt.status;
      var mined = receipt && receipt.blockNumber;
      if (!mined) throw new Error("pending");
      if (status === "0x0" || status === "0x00") return Promise.reject(new Error("revert"));
      return rpc("eth_blockNumber", []).then(function (hex) {
        if (parseInt(hex, 16) >= parseInt(mined, 16)) return;
        throw new Error("pending");
      });
    }).catch(function (err) {
      if (err && (err.message === "revert" || err.message === "receipt")) return Promise.reject(err);
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          settled(hash, started).then(resolve, reject);
        }, 400);
      });
    });
  }

  function readLeft() {
    if (!STILL) return;
    rpc("eth_call", [{ to: STILL, data: NEXT_ID }, "latest"]).then(function (hex) {
      var n = parseInt(hex, 16);
      var remain;
      if (!(n >= 0)) return;
      remain = SUPPLY - n;
      if (remain < 0) remain = 0;
      setRemaining(remain);
    }).catch(function () {
      setNote("the chain did not answer");
    });
  }

  function ensureChain() {
    return window.ethereum.request({ method: "eth_chainId" }).then(function (id) {
      if (id === CHAIN) return;
      return window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN }]
      });
    });
  }

  function readPrice() {
    if (!STILL) return;
    rpc("eth_call", [{ to: STILL, data: PRICE_SIG }, "latest"]).then(function (hex) {
      var n = BigInt(hex);
      var label = n === 0n ? "0 eth" : (n === 4200000000000000n ? "0.00420 eth" : null);
      priceWei = "0x" + n.toString(16);
      if (!label) return;
      priceBtn.setAttribute("data-value", label);
      if (priceBtn.getAttribute("data-open") !== "1") priceBtn.textContent = label;
    }).catch(function () {
      setNote("the chain did not answer");
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
    if (!STILL) {
      setNote("the door is not open");
      return;
    }
    if (priceWei == null) return;
    var mine = ticket;
    mintBtn.setAttribute("aria-pressed", "true");
    setNote("");
    ensureChain().then(function () {
      return window.ethereum.request({ method: "eth_accounts" });
    }).then(function (accounts) {
      var selected = accounts && accounts[0] ? accounts[0] : "";
      var sent;
      if (!selected || StillDoor.isOff() || mine !== ticket) throw new Error("key");
      if (!key || key.toLowerCase() !== selected.toLowerCase()) {
        adopt(selected);
        throw new Error("key");
      }
      if (!proofsReady) throw new Error("wait");
      if (!proofsOk) {
        setNote(listNote);
        throw new Error("list");
      }
      if (!heldProof) {
        setNote(HALL_OUT);
        throw new Error("proof");
      }
      sent = {
        from: selected,
        to: STILL,
        data: encodeMint(heldProof),
        chainId: CHAIN,
        value: priceWei
      };
      return window.ethereum.request({
        method: "eth_sendTransaction",
        params: [sent]
      }).then(function (hash) {
        return settled(hash);
      });
    }).then(function () {
      mintBtn.setAttribute("aria-pressed", "false");
      setNote("");
      readLeft();
      drawKey(key, ticket);
    }).catch(function (err) {
      mintBtn.setAttribute("aria-pressed", "false");
      if (err && (err.message === "key" || err.message === "wait" || err.message === "list" || err.message === "proof")) return;
      if (mine !== ticket) return;
      if (err && err.code === 4001) setNote("declined");
      else if (err && err.message === "revert") setNote("not minted");
      else setNote("the chain did not answer");
    });
  }

  lintel.addEventListener("click", function () {
    var full = lintel.getAttribute("data-full");
    if (full) copyText(full);
  });
  priceBtn.addEventListener("click", function () { showFigureName(priceBtn); });
  left.addEventListener("click", function () { showFigureName(left); });
  mintNo.addEventListener("click", function () { showFigureName(mintNo); });
  connectBtn.addEventListener("click", onConnect);
  mintBtn.addEventListener("click", mint);
  (function () {
    var forkBtn = document.getElementById("fork");
    var forkTimer = null;
    if (!forkBtn) return;
    forkBtn.addEventListener("click", function () {
      var full = forkBtn.getAttribute("data-full");
      if (!full) return;
      writeCopy(full, function () {
        forkBtn.classList.add("copied");
        if (forkTimer) clearTimeout(forkTimer);
        forkTimer = setTimeout(function () {
          forkTimer = null;
          forkBtn.classList.remove("copied");
        }, 1600);
      });
    });
  })();
  walkBtn.addEventListener("click", function () {
    if (!(walkId >= 1) || walkBtn.hidden) return;
    window.location.assign(walkHref(walkId));
  });
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
        if (checkWait) runCheck(checkWait);
        return;
      }
      if (msg.ready === false) {
        proofsOk = false;
        proofsReady = true;
        listNote = msg.match ? "the list does not match" : "the list did not load";
        if (key) applyKey();
        if (checkWait) runCheck(checkWait);
        return;
      }
      if (typeof msg.id === "string") {
        if (!checkAddr || msg.addr !== checkAddr) return;
        showCheckLine(msg.addr, (msg.miss || !msg.proof) ? "ineligible" : "eligible");
        return;
      }
      if (!pending || msg.id !== pending.id || pending.ticket !== ticket) return;
      if (msg.addr && key && msg.addr !== key.toLowerCase()) return;
      if (msg.miss || !msg.proof) {
        if (heldProof) return;
        heldProof = null;
        showHallOut(true);
        return;
      }
      heldProof = msg.proof;
      showHallOut(false);
      drawKey(pending.addr, pending.ticket);
    };
    if (!STILL) {
      worker.postMessage({ start: true });
      return;
    }
    rpc("eth_call", [{ to: STILL, data: MERKLE_SIG }, "latest"]).then(function (root) {
      var lock = String(root).toLowerCase();
      if (lock === tinyRoot()) {
        worker.postMessage({ start: true, root: lock, list: TEST_KEYS.join("\n") });
        return;
      }
      worker.postMessage({ start: true, root: lock });
    }).catch(function () {
      proofsOk = false;
      proofsReady = true;
      listNote = "the list did not load";
      if (key) applyKey();
      if (checkWait) runCheck(checkWait);
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) disarm();
  });
  /* The Walk and this page share one key. The provider's first account is that key. */
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

  var didAsk = false;

  function dropKey() {
    if (!key) return;
    ticket += 1;
    heldProof = null;
    pending = null;
    showKey("");
    hidePlate();
    showHallOut(false);
  }

  /* A saved key is used only when it is the account the provider reports first. */
  function resume() {
    var saved = StillDoor.read();
    var eth = window.ethereum;
    if (!eth || !eth.request) {
      dropKey();
      return;
    }
    eth.request({ method: "eth_accounts" }).then(function (accounts) {
      var selected = accounts && accounts[0] ? accounts[0] : "";
      if (selected) {
        if (StillDoor.isOff() && !key) return;
        adopt(selected);
        return;
      }
      dropKey();
      if (!saved || StillDoor.isOff() || didAsk) return;
      didAsk = true;
      eth.request({ method: "eth_requestAccounts" }).then(function (asked) {
        if (StillDoor.isOff()) return;
        var now = asked && asked[0] ? asked[0] : "";
        if (now) adopt(now);
      }).catch(function (err) {
        if (err && err.code === 4001) setNote("declined");
      });
    }).catch(function () {
      dropKey();
    });
  }

  function watchKey() {
    var eth = window.ethereum;
    if (!eth || !eth.on) return;
    eth.on("accountsChanged", function (reported) {
      var hinted = reported && reported[0] ? reported[0] : "";
      eth.request({ method: "eth_accounts" }).then(function (accounts) {
        var selected = accounts && accounts[0] ? accounts[0] : "";
        if (!selected) {
          dropKey();
          return;
        }
        if (StillDoor.isOff() && !key) return;
        adopt(selected);
      }).catch(function () {
        if (!hinted) {
          dropKey();
          return;
        }
        if (StillDoor.isOff() && !key) return;
        adopt(hinted);
      });
    });
  }

  window.addEventListener("storage", function (ev) {
    if (!ev || ev.key !== StillDoor.name) return;
    resume();
  });

  window.addEventListener("pageshow", function () {
    resume();
  });

  var checkRow = document.getElementById("check-row");
  var checkInput = document.getElementById("check");
  var checkOut = document.getElementById("check-out");
  var checkId = 0;
  var checkWait = "";
  var checkAddr = "";

  function showCheckLine(addr, word) {
    var text = shortKey(checksum(addr));
    if (!text) return;
    checkRow.setAttribute("data-shut", "false");
    checkRow.setAttribute("data-open", "true");
    checkInput.hidden = true;
    checkOut.hidden = false;
    checkOut.textContent = word ? (text + "\u2003" + word) : text;
  }

  function runCheck(addr) {
    checkAddr = addr;
    checkWait = "";
    if (!hallStarted) startHall();
    if (!proofsReady) {
      checkWait = addr;
      showCheckLine(addr, "");
      return;
    }
    if (!proofsOk) {
      setNote(listNote);
      showCheckLine(addr, "");
      return;
    }
    showCheckLine(addr, "");
    worker.postMessage({ id: "c" + (++checkId), addr: addr });
  }

  function openCheck() {
    checkRow.setAttribute("data-shut", "false");
    checkInput.hidden = false;
    checkOut.hidden = true;
    checkOut.textContent = "";
  }

  if (checkInput) {
    checkInput.addEventListener("focus", openCheck);
    checkInput.addEventListener("input", function () {
      var addr = cleanAddr(checkInput.value);
      if (!addr) return;
      runCheck(addr);
    });
    checkOut.addEventListener("click", function () {
      openCheck();
      checkInput.value = "";
      checkInput.focus();
    });
    checkRow.addEventListener("pointerdown", function (event) {
      if (event.target === checkInput) return;
      checkRow.setAttribute("data-shut", "false");
    });
  }

  applyHallQuery();
  buildGrid();
  showGrid();
  readPrice();
  readLeft();
  resume();
  watchKey();
})();
