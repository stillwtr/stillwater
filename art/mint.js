(function () {
  var STILL = "";
  var SUPPLY = 512;
  var PRICE = "0xeebe0b40e8000";
  var MINT_SIG = "b77a147b";
  var NEXT_ID = "0x61b8ce8c";
  var RPCS = ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org"];
  var MODE = "open";

  var lintel = document.getElementById("lintel");
  var note = document.getElementById("note");
  var connectBtn = document.getElementById("connect");
  var mintBtn = document.getElementById("mint");
  var left = document.getElementById("left");
  var pool = document.getElementById("pool-wrap");
  var canvas = document.getElementById("pool");
  var key = "";
  var proofsReady = false;
  var proofsOk = false;
  var listNote = "the list did not load";
  var heldProof = null;
  var askId = 0;
  var pending = null;
  var worker = new Worker("hall-worker.js");
  var copyTimer = null;
  var timer = null;
  var phase = 0;
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

  function showKey(value) {
    key = value || "";
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = null;
    lintel.classList.remove("copied");
    if (!key) {
      lintel.textContent = "";
      lintel.removeAttribute("data-full");
      connectBtn.textContent = "connect";
      connectBtn.setAttribute("aria-pressed", "false");
      return;
    }
    lintel.textContent = shortKey(checksum(key));
    lintel.setAttribute("data-full", checksum(key));
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
    if (timer) clearInterval(timer);
    timer = null;
    phase = 0;
  }

  function fit() {
    var room = Math.min(window.innerWidth, window.innerHeight - 156);
    var mult = Math.max(1, Math.floor(room / 128));
    var px = String(mult * 128) + "px";
    canvas.style.width = px;
    canvas.style.height = px;
  }

  function hidePlate() {
    disarm();
    pool.hidden = true;
  }

  function arm(bytes, nonce) {
    var hash, n, i;
    disarm();
    if (!bytes || !Plate.crawls(MODE)) return;
    hash = PlateKeccak.keccak256(bytes);
    n = 0;
    for (i = 0; i < 4; i++) n = (n * 256) + hash[i];
    phase = 0;
    timer = setInterval(function () {
      if (!Plate.crawls(MODE)) return;
      phase = (phase + 1) & 31;
      Plate.paint(canvas, bytes, nonce, phase);
      fit();
    }, (6 + (n % 7)) * 1000);
  }

  function showPlate(bytes, nonce) {
    pool.hidden = false;
    Plate.paint(canvas, bytes, nonce, 0);
    fit();
    arm(bytes, nonce);
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
    left.textContent = String(SUPPLY);
    if (!STILL) return;
    rpc("eth_call", [{ to: STILL, data: NEXT_ID }, "latest"]).then(function (hex) {
      var n = parseInt(hex, 16);
      var remain;
      if (!(n >= 0)) return;
      remain = SUPPLY - n;
      if (remain < 0) remain = 0;
      left.textContent = String(remain);
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

  function connect() {
    if (!window.ethereum) {
      setNote("no wallet");
      return;
    }
    setNote("");
    window.ethereum.request({ method: "eth_requestAccounts" }).then(function (accounts) {
      showKey(accounts && accounts[0] ? accounts[0] : "");
      if (!key) setNote("no wallet");
      else applyKey();
    }).catch(function (err) {
      if (err && err.code === 4001) setNote("declined");
      else setNote("no wallet");
    });
  }

  function disconnect() {
    ticket += 1;
    heldProof = null;
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
      setNote("no wallet");
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
  connectBtn.addEventListener("click", onConnect);
  mintBtn.addEventListener("click", mint);
  window.addEventListener("resize", fit);

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
    if (msg.miss || !msg.proof) {
      heldProof = null;
      hidePlate();
      setNote("this key is not in the hall");
      return;
    }
    heldProof = msg.proof;
    drawKey(pending.addr, pending.ticket);
  };

  readLeft();
  fit();
})();
