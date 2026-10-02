(function () {
  var CHAINS = {
    mainnet: ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org"],
    sepolia: ["https://ethereum-sepolia-rpc.publicnode.com", "https://rpc.sepolia.org"]
  };
  var SEL = {
    nextId: "0x61b8ce8c",
    datedBlock: "0x418ab103",
    datedBy: "0x8105885e",
    minter: "0xac8d856c",
    tokenURI: "0xc87b56dd"
  };
  var NO_PRINT = "there is no dated print";
  var WEATHER = "the chain did not answer";

  var canvas = document.getElementById("pool");
  var lintel = document.getElementById("lintel");
  var note = document.getElementById("note");
  var field = document.getElementById("field");
  var EXAMPLE = "0xd934CC70B1b06256581527a534285f5bd6A7eDc7";
  var SEPOLIA = "0x1b8EdEAF2CE1bA591a6F812ae52024F77e229A34";
  var liveBtn = document.getElementById("live");
  var datedBtn = document.getElementById("dated");
  var searchBtn = document.getElementById("search");
  var prevBtn = document.getElementById("prev");
  var nextBtn = document.getElementById("next");
  var mode = "";
  var timer = null;
  var phase = 0;
  var heldBytes = null;
  var heldNonce = 0;
  var heldPace = null;
  var ticket = 0;
  var index = 0;
  var searchKey = "";
  var fromSearch = false;
  var cache = {};
  var wPal = document.getElementById("w-pal");
  var wNonce = document.getElementById("w-nonce");
  var wWater = document.getElementById("w-water");
  var whisperEl = document.getElementById("whisper");
  var hall = { chain: "sepolia", contract: SEPOLIA, nextId: 0, known: false };

  function fit() {
    var room = Math.min(window.innerWidth, window.innerHeight - 156);
    var mult = Math.max(1, Math.floor(room / 128));
    var px = String(mult * 128) + "px";
    canvas.style.width = px;
    canvas.style.height = px;
  }

  function snow() {
    disarm();
    var ctx = canvas.getContext("2d");
    canvas.width = 128;
    canvas.height = 128;
    ctx.fillStyle = "#E4E7EC";
    ctx.fillRect(0, 0, 128, 128);
    fit();
  }

  function press(next) {
    mode = next;
    liveBtn.setAttribute("aria-pressed", next === "open" ? "true" : "false");
    datedBtn.setAttribute("aria-pressed", next === "dated" ? "true" : "false");
  }

  function disarm() {
    if (timer) clearInterval(timer);
    timer = null;
    phase = 0;
  }

  function shortKey(text) {
    var s = text.trim();
    if (s.slice(0, 2) === "0x" || s.slice(0, 2) === "0X") s = s.slice(2);
    if (s.length < 10) return "";
    return "0x" + s.slice(0, 6) + "…" + s.slice(s.length - 4);
  }

  function checksum(raw) {
    var s = raw.trim();
    var bytes = new Uint8Array(40);
    var hash, i, nibble, ch, out;
    if (s.slice(0, 2) === "0x" || s.slice(0, 2) === "0X") s = s.slice(2);
    s = s.toLowerCase();
    if (s.length !== 40) return raw.trim();
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

  function word(id) {
    var b = new Uint8Array(32);
    var n = id;
    var i;
    for (i = 31; i >= 0; i--) {
      b[i] = n % 256;
      n = Math.floor(n / 256);
    }
    return b;
  }

  function arm(bytes, nonce, paceBytes) {
    var pace = paceBytes || bytes;
    var hash, n, i;
    disarm();
    if (!bytes || !pace || !Plate.crawls(mode)) return;
    hash = PlateKeccak.keccak256(pace);
    n = 0;
    for (i = 0; i < 4; i++) n = (n * 256) + hash[i];
    phase = 0;
    timer = setInterval(function () {
      if (!Plate.crawls(mode)) return;
      phase = (phase + 1) & 31;
      Plate.paint(canvas, bytes, nonce, phase);
      fit();
    }, (6 + (n % 7)) * 1000);
  }

  function paintWhisper(bytes, nonce) {
    wPal.textContent = Plate.PALETTES[Plate.derive(bytes).palette].name;
    wNonce.textContent = String(nonce);
    wWater.textContent = (Plate.waterFraction(bytes, nonce) * 100).toFixed(1) + "%";
    whisperEl.hidden = false;
  }

  function clearWhisper() {
    wPal.textContent = "";
    wNonce.textContent = "";
    wWater.textContent = "";
    whisperEl.hidden = true;
  }

  function show(bytes, nonce, who, crawlBytes) {
    var full = checksum(who);
    heldBytes = bytes;
    heldNonce = nonce;
    heldPace = crawlBytes || bytes;
    setNote("");
    lintel.textContent = shortKey(full);
    lintel.setAttribute("data-full", full);
    lintel.removeAttribute("title");
    paintWhisper(bytes, nonce);
    Plate.paint(canvas, bytes, nonce, 0);
    fit();
    arm(bytes, nonce, crawlBytes || bytes);
  }

  function clearLintel() {
    lintel.textContent = "";
    lintel.removeAttribute("data-full");
    lintel.removeAttribute("title");
    clearWhisper();
  }

  function setNote(text) {
    note.textContent = text;
    if (text === WEATHER) note.title = "nonce read failed";
    else note.removeAttribute("title");
  }

  function weather(which) {
    if (which === "open" || which === "dated") press(which);
    setNote(WEATHER);
  }

  function returnLive() {
    setNote("");
    press("open");
    if (!timer && heldBytes) arm(heldBytes, heldNonce, heldPace);
  }

  function badKey() {
    index = 0;
    press("");
    clearLintel();
    snow();
    setNote("checksum");
  }

  function rpc(chain, method, params, i) {
    var urls = CHAINS[chain];
    if (!i) i = 0;
    if (!urls || i >= urls.length) return Promise.reject(new Error("rpc"));
    return fetch(urls[i], {
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
      return rpc(chain, method, params, i + 1);
    });
  }

  function count(chain, address, tag) {
    return rpc(chain, "eth_getTransactionCount", [address, tag]).then(function (hex) {
      var n = parseInt(hex, 16);
      if (!(n >= 0)) throw new Error("nonce");
      return n;
    });
  }

  function pad(id) {
    return id.toString(16).padStart(64, "0");
  }

  function ethCall(chain, contract, data) {
    return rpc(chain, "eth_call", [{ to: contract, data: data }, "latest"]);
  }

  function call(chain, contract, sig, id) {
    return ethCall(chain, contract, sig + pad(id));
  }

  function addressOf(hex) {
    var h = hex.replace(/^0x/, "");
    if (h.length < 40) return "";
    return "0x" + h.slice(h.length - 40);
  }

  function decodeString(hex) {
    var h = hex.replace(/^0x/, "");
    var len = parseInt(h.slice(64, 128), 16);
    var data = h.slice(128, 128 + len * 2);
    var s = "";
    var i;
    if (!(len >= 0)) return "";
    for (i = 0; i < data.length; i += 2) s += String.fromCharCode(parseInt(data.slice(i, i + 2), 16));
    return s;
  }

  function readToken(chain, contract, id) {
    return Promise.all([
      call(chain, contract, SEL.datedBlock, id),
      call(chain, contract, SEL.datedBy, id),
      call(chain, contract, SEL.minter, id),
      call(chain, contract, SEL.tokenURI, id)
    ]).then(function (parts) {
      var block = parseInt(parts[0], 16);
      var uri = decodeString(parts[3]);
      if (!(block >= 0)) throw new Error("block");
      if (uri.indexOf("data:application/json") !== 0) throw new Error("uri");
      return {
        block: block,
        by: checksum(addressOf(parts[1])),
        minter: checksum(addressOf(parts[2])),
        uri: uri
      };
    });
  }

  function readCached(chain, contract, idn) {
    var key = chain + ":" + contract.toLowerCase() + ":" + idn;
    if (!cache[key]) {
      cache[key] = readToken(chain, contract, idn).catch(function (err) {
        delete cache[key];
        throw err;
      });
    }
    return cache[key];
  }

  function readNextId(chain, contract) {
    return ethCall(chain, contract, SEL.nextId).then(function (hex) {
      var n = parseInt(hex, 16);
      if (!(n >= 0)) throw new Error("next");
      return n;
    });
  }

  function arrows() {
    var show = !!(hall && hall.known && hall.contract && hall.nextId >= 1);
    prevBtn.hidden = !show;
    nextBtn.hidden = !show;
  }

  function chainOf(name) {
    var s = (name || "").toLowerCase();
    if (s === "sepolia" || s === "mainnet") return s;
    return "";
  }

  function modeOf(name) {
    var s = (name || "").toLowerCase();
    if (s === "live" || s === "dated") return s;
    return "";
  }

  function query() {
    var q = new URLSearchParams(location.search);
    var hash = location.hash ? decodeURIComponent(location.hash.slice(1)) : "";
    return {
      chain: chainOf(q.get("chain")),
      contract: q.get("contract") || "",
      id: q.get("id") || "",
      key: q.get("key") || "",
      mode: modeOf(q.get("mode")),
      hash: hash
    };
  }

  function writeUrl(parts) {
    var q = new URLSearchParams();
    var tail, hash;
    if (parts.chain) q.set("chain", parts.chain);
    if (parts.contract) q.set("contract", parts.contract);
    if (parts.id) q.set("id", String(parts.id));
    if (parts.mode) q.set("mode", parts.mode);
    if (parts.key) q.set("key", parts.key);
    tail = q.toString();
    hash = parts.id ? "#" + parts.id : (parts.key ? "#" + parts.key : "");
    history.replaceState(null, "", location.pathname + (tail ? "?" + tail : "") + hash);
  }

  function onToken() {
    if (!(index >= 1) || !hall || !hall.contract) return false;
    if (hall.known && (!(hall.nextId >= 1) || index > hall.nextId)) return false;
    return true;
  }

  function openKey(raw, chain, paceBytes, postcard) {
    var id = ++ticket;
    var check = Plate.checksumState(raw);
    var bytes;
    if (check === "checksum") {
      badKey();
      return;
    }
    bytes = Plate.parseAddress(raw);
    if (!bytes || check !== "ok") {
      badKey();
      return;
    }
    count(chain, raw, "latest").then(function (nonce) {
      if (id !== ticket) return;
      index = 0;
      fromSearch = false;
      searchKey = checksum(raw);
      press("open");
      show(bytes, nonce, raw, paceBytes || bytes);
      if (postcard !== false) writeUrl({ chain: chain, mode: "live", key: checksum(raw) });
      else writeUrl({});
    }).catch(function () {
      if (id !== ticket) return;
      weather("open");
    });
  }

  function openLiveToken(chain, contract, idn) {
    var mine = ++ticket;
    if (!(idn >= 1) || !contract) return;
    readCached(chain, contract, idn).then(function (token) {
      if (mine !== ticket) return;
      return count(chain, token.minter, "latest").then(function (nonce) {
        if (mine !== ticket) return;
        press("open");
        index = idn;
        var bytes = Plate.parseAddress(token.minter);
        show(bytes, nonce, token.minter, word(idn));
        writeUrl({ chain: chain, contract: contract, id: idn, mode: "live", key: token.minter });
      });
    }).catch(function () {
      if (mine !== ticket) return;
      weather("open");
    });
  }

  function openDated(chain, contract, idText) {
    var idn = parseInt(idText, 10);
    var mine = ++ticket;
    if (!(idn >= 1) || !contract) {
      snow();
      return;
    }
    readCached(chain, contract, idn).then(function (token) {
      var who = token.block !== 0 ? token.by : token.minter;
      var tag = token.block !== 0 ? "0x" + token.block.toString(16) : "latest";
      if (mine !== ticket) return;
      return count(chain, who, tag).then(function (nonce) {
        if (mine !== ticket) return;
        var shuttered = token.block !== 0;
        press(shuttered ? "dated" : "open");
        index = idn;
        show(Plate.parseAddress(who), nonce, who, word(idn));
        writeUrl({
          chain: chain,
          contract: contract,
          id: idn,
          mode: shuttered ? "dated" : "live",
          key: shuttered ? "" : who
        });
      });
    }).catch(function () {
      if (mine !== ticket) return;
      weather("dated");
    });
  }

  function hallFrom(q) {
    if (q.contract) {
      return { chain: q.chain || "sepolia", contract: q.contract, nextId: 0, known: false };
    }
    return { chain: "sepolia", contract: SEPOLIA, nextId: 0, known: false };
  }

  function route(q) {
    var key = q.key || ((q.hash.slice(0, 2) === "0x" || q.hash.slice(0, 2) === "0X") ? q.hash : "");
    var contract = q.contract;
    var chain = q.chain;
    if (!contract && chain === "sepolia" && q.id) contract = SEPOLIA;
    if (!chain && contract) chain = "sepolia";
    if (q.id && contract && chain) {
      if (q.mode === "live") openLiveToken(chain, contract, parseInt(q.id, 10));
      else openDated(chain, contract, q.id);
      return;
    }
    if (key) openKey(key, chain || "mainnet", null, true);
    else openKey(EXAMPLE, "mainnet", null, false);
  }

  function boot() {
    var q = query();
    snow();
    hall = hallFrom(q);
    readNextId(hall.chain, hall.contract).then(function (n) {
      hall.nextId = n >= 1 ? n : 0;
      hall.known = true;
      arrows();
    }).catch(function () {
      hall.nextId = 0;
      hall.known = true;
      arrows();
    });
    route(q);
  }

  function step(dir) {
    var i;
    var entering = false;
    if (!hall || !hall.known || !(hall.nextId >= 1)) return;
    if (!(index >= 1 && index <= hall.nextId)) {
      entering = true;
      i = 1;
    } else {
      i = index + dir;
      if (i < 1 || i > hall.nextId) return;
    }
    if (entering && searchKey) fromSearch = true;
    if (mode === "dated") openDated(hall.chain, hall.contract, String(i));
    else openLiveToken(hall.chain, hall.contract, i);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () { copyFallback(text); });
      return;
    }
    copyFallback(text);
  }

  function copyFallback(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-999px";
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); } catch (e) { /* quiet */ }
    document.body.removeChild(area);
  }

  liveBtn.addEventListener("click", function () {
    var typed = field.value.trim();
    setNote("");
    if (onToken()) {
      openLiveToken(hall.chain, hall.contract, index);
      return;
    }
    typed = typed || searchKey || EXAMPLE;
    openKey(typed, "mainnet", null, typed.toLowerCase() === EXAMPLE.toLowerCase() ? false : true);
  });

  function restoreSearch() {
    var key = searchKey || EXAMPLE;
    var example = key.toLowerCase() === EXAMPLE.toLowerCase();
    field.value = example ? "" : key;
    openKey(key, "mainnet", null, example ? false : true);
  }

  datedBtn.addEventListener("click", function () {
    var q, contract, typed;
    if (note.textContent === WEATHER) {
      returnLive();
      return;
    }
    if (note.textContent === NO_PRINT) {
      typed = field.value.trim() || searchKey || EXAMPLE;
      setNote("");
      openKey(typed, "mainnet", null, typed.toLowerCase() === EXAMPLE.toLowerCase() ? false : true);
      return;
    }
    if (onToken()) {
      openDated(hall.chain, hall.contract, String(index));
      return;
    }
    q = query();
    contract = q.contract || ((q.chain === "sepolia" && q.id) ? SEPOLIA : "");
    if (q.id && contract && (q.chain || contract)) {
      openDated(q.chain || hall.chain, contract, q.id);
      return;
    }
    press("dated");
    disarm();
    setNote(NO_PRINT);
  });

  searchBtn.addEventListener("click", function () {
    var open = field.hidden;
    var trapped = fromSearch && index >= 1 && searchKey;
    field.hidden = !open;
    searchBtn.setAttribute("aria-pressed", open ? "true" : "false");
    if (trapped) restoreSearch();
    if (open) {
      field.focus();
      field.select();
    }
  });

  prevBtn.addEventListener("click", function () { step(-1); });
  nextBtn.addEventListener("click", function () { step(1); });

  lintel.addEventListener("click", function () {
    var full = lintel.getAttribute("data-full");
    if (full) copyText(full);
  });

  field.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" || field.value.trim()) return;
    event.preventDefault();
    setNote("");
    openKey(EXAMPLE, "mainnet", null, false);
  });

  field.addEventListener("input", function () {
    var raw = field.value.trim();
    if (!raw) {
      index = 0;
      setNote("");
      openKey(EXAMPLE, "mainnet", null, false);
      return;
    }
    if (Plate.parseAddress(raw) && Plate.checksumState(raw) !== "parse") openKey(raw, "mainnet");
  });

  window.addEventListener("resize", fit);
  fit();
  boot();
})();
