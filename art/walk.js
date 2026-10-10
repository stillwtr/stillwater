(function () {
  var CHAINS = {
    mainnet: ["https://ethereum.publicnode.com", "https://eth.drpc.org"],
    sepolia: ["https://ethereum-sepolia-rpc.publicnode.com", "https://rpc.sepolia.org"]
  };
  var SEL = {
    nextId: "0x61b8ce8c",
    datedBlock: "0x418ab103",
    datedBy: "0x8105885e",
    minter: "0xac8d856c",
    tokenURI: "0xc87b56dd",
    listedPrice: "0xe5a818f8",
    titleHolder: "0xc4436d2f",
    nonceProbe: "0x186ad0cf",
    nonceOf: "0xed2a2d64",
    buy: "0x5a19b4db",
    ownerOf: "0x6352211e",
    balanceOf: "0x70a08231",
    mailboxOf: "0x7d1debb6",
    setMailbox: "0x386de411",
    list: "0x50fd7367",
    cancel: "0x40e58ee5",
    date: "0x60c757ba",
    transferFrom: "0x23b872dd"
  };
  /* Local four-print hall. It is not deployed and it does not mint. */
  var FOUR = "0x1111111111111111111111111111111111111111";
  var FOUR_STAND = "0xdddddddddddddddddddddddddddddddddddd0004";
  var fourBook = null;
  var NO_PRINT = "there is no dated print";
  var NO_LISTED = "there is no listed print";
  var NO_HELD = "there is no held print";
  var WEATHER = "the chain did not answer";
  var UNREAD = "the last transaction could not be read";

  var canvas = document.getElementById("pool");
  var note = document.getElementById("note");
  var field = document.getElementById("field");
  var EXAMPLE = "0xd934CC70B1b06256581527a534285f5bd6A7eDc7";
  var SEPOLIA = "0x1b8EdEAF2CE1bA591a6F812ae52024F77e229A34";
  var MAINNET_STILL = "0x47FA611Bb47f2172b99135D6c00dC5555ca230C1";
  var DOOR = "https://metamask.app.link/dapp/stillwtr.github.io/stillwater/art/walk.html";
  var CHAIN_ID = { mainnet: "0x1", sepolia: "0xaa36a7" };
  var liveBtn = document.getElementById("live");
  var datedBtn = document.getElementById("dated");
  var searchBtn = document.getElementById("search");
  var listedBtn = document.getElementById("listed");
  var heldBtn = document.getElementById("held");
  var parkBtn = document.getElementById("park");
  var listBtn = document.getElementById("list");
  var cancelBtn = document.getElementById("cancel");
  var dateBtn = document.getElementById("date");
  var prevBtn = document.getElementById("prev");
  var nextBtn = document.getElementById("next");
  var askEl = document.getElementById("ask");
  var wPrice = document.getElementById("w-price");
  var buyBtn = document.getElementById("buy");
  var connectBtn = document.getElementById("connect");
  var roleRow = document.getElementById("role-row");
  var vaultRow = document.getElementById("vault-row");
  var vaultField = document.getElementById("vault");
  var confirmBtn = document.getElementById("confirm");
  var listRow = document.getElementById("list-row");
  var listPrice = document.getElementById("list-price");
  var listConfirm = document.getElementById("list-confirm");
  var returnBtn = document.getElementById("return");
  var returnRow = document.getElementById("return-row");
  var returnField = document.getElementById("return-to");
  var returnConfirm = document.getElementById("return-confirm");
  var mode = "";
  var timer = null;
  var phase = 0;
  var crawlMs = 0;
  var crawlDue = 0;
  var crawlPaused = false;
  var heldBytes = null;
  var heldNonce = 0;
  var heldPace = null;
  var heldTerm = 0;
  var ticket = 0;
  var index = 0;
  var searchKey = "";
  var shownKey = "";
  var cache = {};
  var wId = document.getElementById("w-id");
  var wIdGap = document.getElementById("w-id-gap");
  var wPal = document.getElementById("w-pal");
  var wNonce = document.getElementById("w-nonce");
  var wWater = document.getElementById("w-water");
  var whisperEl = document.getElementById("whisper");
  var modeBar = document.getElementById("mode-bar");
  var hall = { chain: "mainnet", contract: "", nextId: 0, known: false };
  var doorNext = 0;
  var doorKnown = false;
  var whisperToken = 0;
  var listedOn = false;
  var heldOn = false;
  var listedCount = 0;
  var heldBalance = 0;
  var lit = "live";
  var spareNote = false;
  var walkTicket = 0;
  var buyTicket = 0;
  var askGen = 0;
  var plateAsk = null;
  var walletKey = "";
  var hallWorker = null;
  var hallReady = false;
  var hallProof = null;
  var proofId = 0;
  var proofState = "";
  var buyWait = null;
  var roleTicket = 0;
  var holdTicket = 0;
  var vaultTicket = 0;
  var vaultSure = "";
  var listTicket = 0;
  var returnTicket = 0;
  var plateRole = null;
  var pageStill = false;

  function fit() {
    var court = canvas.parentElement.parentElement;
    var pad = getComputedStyle(canvas.parentElement);
    var lip = (parseFloat(pad.paddingTop) || 0) + (parseFloat(pad.paddingBottom) || 0);
    var room = Math.min(court.clientWidth, court.clientHeight) - lip;
    var mult = Math.max(1, Math.floor(room / 128));
    var px = String(mult * 128) + "px";
    canvas.style.width = px;
    canvas.style.height = px;
    placeRows();
  }

  /* The mode cluster stays centered on the plate. Disconnect keeps the plate's right edge.
     A narrow plate tightens the cluster so the two do not meet. */
  function placeRows() {
    var words, width, door, cluster, room, scale;
    words = modeBar.querySelector(".words");
    width = canvas.parentElement.offsetWidth;
    if (!(width >= 1)) return;
    modeBar.style.width = width + "px";
    roleRow.style.width = width + "px";
    words.style.letterSpacing = "";
    words.style.gap = "";
    words.style.transform = "";
    door = connectBtn.offsetWidth;
    cluster = words.offsetWidth;
    room = width - (door * 2) - 12;
    if (!(room >= 1)) room = 1;
    if (cluster > room) {
      words.style.letterSpacing = "0.06em";
      words.style.gap = "0.45rem";
      cluster = words.offsetWidth;
    }
    if (cluster > room && cluster > 0) {
      scale = room / cluster;
      words.style.transform = "scale(" + scale + ")";
      words.style.transformOrigin = "center center";
    }
  }

  function snow() {
    disarm();
    hideAsk();
    hideRole();
    var ctx = canvas.getContext("2d");
    canvas.width = 128;
    canvas.height = 128;
    ctx.fillStyle = "#E4E7EC";
    ctx.fillRect(0, 0, 128, 128);
    fit();
  }

  function setPaint(next) {
    mode = next === "dated" ? "dated" : (next ? "open" : "");
  }

  /* One lit mode word. Search lights itself while the field is open. */
  function mark(which) {
    lit = which || "";
    listedOn = lit === "listed";
    heldOn = lit === "held";
    liveBtn.setAttribute("aria-pressed", lit === "live" ? "true" : "false");
    datedBtn.setAttribute("aria-pressed", lit === "dated" ? "true" : "false");
    listedBtn.setAttribute("aria-pressed", lit === "listed" ? "true" : "false");
    heldBtn.setAttribute("aria-pressed", lit === "held" ? "true" : "false");
    searchBtn.setAttribute("aria-pressed", "false");
    setPaint(lit === "dated" ? "dated" : (lit ? "open" : ""));
    paintRole();
    placeRows();
    arrows();
  }

  function closeSearch() {
    field.hidden = true;
    searchBtn.setAttribute("aria-pressed", "false");
  }

  function actionNote() {
    var text = note.textContent;
    return text === "listed" || text === "mailbox named"
      || text === "already listed" || text === "bad address"
      || text === "a vault is named"
      || text.indexOf("a wrong vault is permanent") !== -1;
  }

  function light(which) {
    ticket += 1;
    walkTicket += 1;
    closeSearch();
    if (actionNote() || note.textContent === "connect") setNote("");
    mark(which);
  }

  function keptNote() {
    return actionNote();
  }

  function why(text) {
    var err = new Error(text);
    err.why = text;
    return err;
  }

  function noteWhy(err) {
    if (err && err.code === 4001) setNote("declined");
    else if (err && err.why) setNote(err.why);
  }

  function disarm() {
    if (timer) clearTimeout(timer);
    timer = null;
    phase = 0;
    crawlPaused = false;
    crawlDue = 0;
    crawlMs = 0;
  }

  function stepCrawl() {
    timer = null;
    if (document.hidden) {
      crawlPaused = true;
      return;
    }
    if (!heldBytes || !Plate.crawls(mode)) return;
    phase = (phase + 1) & 31;
    crawlDue += crawlMs;
    if (crawlDue <= Date.now()) crawlDue = Date.now() + crawlMs;
    Plate.paint(canvas, heldBytes, heldNonce, phase, heldTerm);
    fit();
    waitCrawl();
  }

  function waitCrawl() {
    var wait;
    if (timer) clearTimeout(timer);
    timer = null;
    if (!crawlMs || !heldBytes || !Plate.crawls(mode)) return;
    if (document.hidden) {
      crawlPaused = true;
      return;
    }
    crawlPaused = false;
    wait = crawlDue - Date.now();
    if (wait < 1) wait = crawlMs;
    timer = setTimeout(stepCrawl, wait);
  }

  /* Time spent hidden counts, and only the step that time reached is drawn. */
  function reachCrawl() {
    var now, late, steps;
    if (!crawlPaused) return;
    crawlPaused = false;
    now = Date.now();
    if (crawlDue && now >= crawlDue && heldBytes && Plate.crawls(mode)) {
      late = now - crawlDue;
      steps = Math.floor(late / crawlMs) + 1;
      phase = (phase + (steps % 32)) & 31;
      crawlDue += steps * crawlMs;
      Plate.paint(canvas, heldBytes, heldNonce, phase, heldTerm);
    }
    waitCrawl();
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
    if (pageStill) return;
    if (!bytes || !pace || !Plate.crawls(mode)) return;
    hash = PlateKeccak.keccak256(pace);
    n = 0;
    for (i = 0; i < 4; i++) n = (n * 256) + hash[i];
    phase = 0;
    crawlMs = (6 + (n % 7)) * 1000;
    crawlDue = Date.now() + crawlMs;
    waitCrawl();
  }

  function restoreWhisper(el) {
    var value = el.getAttribute("data-value");
    el.classList.remove("fade");
    if (value) el.textContent = value;
  }

  function endWhisperNames() {
    whisperToken += 1;
    restoreWhisper(wId);
    restoreWhisper(wPal);
    restoreWhisper(wNonce);
    restoreWhisper(wWater);
    restoreWhisper(wPrice);
  }

  function paintWhisper(bytes, nonce, term) {
    var pal = Plate.PALETTES[Plate.derive(bytes).palette].name;
    var nText = String(nonce);
    var grid = Plate.indices(bytes, nonce, 0, term > 0 ? term : 0);
    var wText = (Plate.countWater(grid) / (128 * 128) * 100).toFixed(1) + "%";
    var idText = index >= 1 ? "#" + index : "";
    endWhisperNames();
    wId.hidden = !idText;
    wIdGap.hidden = !idText;
    if (idText) {
      wId.setAttribute("data-value", idText);
      wId.textContent = idText;
    } else {
      wId.textContent = "";
      wId.removeAttribute("data-value");
    }
    wPal.setAttribute("data-value", pal);
    wNonce.setAttribute("data-value", nText);
    wWater.setAttribute("data-value", wText);
    wPal.textContent = pal;
    wNonce.textContent = nText;
    wWater.textContent = wText;
    whisperEl.hidden = false;
  }

  function clearWhisper() {
    endWhisperNames();
    wId.hidden = true;
    wIdGap.hidden = true;
    wId.textContent = "";
    wPal.textContent = "";
    wNonce.textContent = "";
    wWater.textContent = "";
    wPrice.textContent = "";
    wId.removeAttribute("data-value");
    wPal.removeAttribute("data-value");
    wNonce.removeAttribute("data-value");
    wWater.removeAttribute("data-value");
    wPrice.removeAttribute("data-value");
    whisperEl.hidden = true;
  }

  function showWhisperName(el) {
    var label = el.getAttribute("data-name");
    var value = el.getAttribute("data-value");
    var token;
    if (whisperEl.hidden || !value || !label) return;
    token = ++whisperToken;
    restoreWhisper(wId);
    restoreWhisper(wPal);
    restoreWhisper(wNonce);
    restoreWhisper(wWater);
    restoreWhisper(wPrice);
    el.textContent = label;
    setTimeout(function () {
      if (token !== whisperToken) return;
      el.classList.add("fade");
      setTimeout(function () {
        if (token !== whisperToken) return;
        el.classList.remove("fade");
        el.textContent = el.getAttribute("data-value") || "";
      }, 280);
    }, 1750);
  }

  function show(bytes, nonce, who, crawlBytes, freezeTerm) {
    shownKey = checksum(who);
    heldBytes = bytes;
    heldNonce = nonce;
    heldPace = crawlBytes || bytes;
    heldTerm = freezeTerm > 0 ? freezeTerm : 0;
    if (!(spareNote && keptNote())) setNote("");
    spareNote = false;
    hideAsk();
    hideRole();
    paintWhisper(bytes, nonce, heldTerm);
    Plate.paint(canvas, bytes, nonce, 0, heldTerm);
    fit();
    arm(bytes, nonce, crawlBytes || bytes);
  }

  function clearLintel() {
    shownKey = "";
    clearWhisper();
    hideAsk();
    hideRole();
  }

  function setNote(text) {
    note.classList.remove("fade");
    note.textContent = text;
    if (text === WEATHER) note.title = "nonce read failed";
    else note.removeAttribute("title");
  }

  function weather(which) {
    spareNote = false;
    if (which === "open" || which === "dated") mark(which === "dated" ? "dated" : "live");
    hideAsk();
    hideRole();
    setNote(WEATHER);
  }

  function returnLive() {
    setNote("");
    mark("live");
    if (!timer && !crawlPaused && heldBytes) arm(heldBytes, heldNonce, heldPace);
  }

  function badKey() {
    index = 0;
    mark("");
    clearLintel();
    snow();
    setNote("checksum");
  }

  function u256(n) {
    var v;
    try { v = BigInt(n); } catch (e) { v = 0n; }
    if (v < 0n) v = 0n;
    return "0x" + v.toString(16).padStart(64, "0");
  }

  function u256Addr(addr) {
    var s = String(addr || "").replace(/^0x/i, "").toLowerCase();
    if (s.length > 40) s = s.slice(-40);
    return "0x" + s.padStart(64, "0");
  }

  function fourMinter(n) {
    return "0x" + n.toString(16).padStart(40, "0");
  }

  function fourFresh() {
    var z = "0x" + "0".repeat(40);
    var stand = FOUR_STAND;
    return {
      head: 100,
      rows: [
        null,
        { block: 0, by: z, minter: fourMinter(1), title: fourMinter(1), owner: fourMinter(1), mail: z, price: 0n, live: 11, shut: 11 },
        { block: 5, by: fourMinter(2), minter: fourMinter(2), title: stand, owner: stand, mail: z, price: 4200000000000000n, live: 22, shut: 3 },
        { block: 0, by: z, minter: fourMinter(3), title: stand, owner: stand, mail: z, price: 0n, live: 33, shut: 33 },
        { block: 8, by: fourMinter(4), minter: fourMinter(4), title: fourMinter(4), owner: stand, mail: z, price: 1000000000000000n, live: 44, shut: 7 }
      ]
    };
  }

  function isFour(contract) {
    return sameAddr(contract, FOUR);
  }

  /* The connected key sells #2, titles #3, and holds #4. A new key retargets those seats. */
  function fourBind(key) {
    var who, z, rows;
    if (!fourBook) fourBook = fourFresh();
    who = key || FOUR_STAND;
    z = "0x" + "0".repeat(40);
    rows = fourBook.rows;
    rows[2].title = who;
    rows[2].owner = who;
    rows[2].mail = z;
    rows[3].title = who;
    rows[3].owner = who;
    rows[3].mail = z;
    rows[4].owner = who;
    rows[4].mail = z;
  }

  function fourWord(data, n) {
    return String(data || "").slice(10 + n * 64, 10 + (n + 1) * 64);
  }

  function fourDrop(id) {
    var chain = hall && hall.chain ? hall.chain : "sepolia";
    delete cache[chain + ":" + FOUR.toLowerCase() + ":" + id];
  }

  function fourApply(tx) {
    var data = String(tx.data || "").toLowerCase();
    var sig = data.slice(0, 10);
    var from = tx.from || "";
    var id, row, vault, ask, dest;
    if (sig === SEL.transferFrom) id = parseInt(fourWord(data, 2), 16);
    else id = parseInt(fourWord(data, 0), 16);
    row = fourBook && fourBook.rows[id];
    if (!row || !from) throw new Error("plate");
    if (sig === SEL.cancel) {
      if (!sameAddr(from, row.title)) throw new Error("title");
      row.price = 0n;
      return;
    }
    if (sig === SEL.date) {
      var titleSigns = sameAddr(from, row.title);
      var vaultSigns = namedVault(row.mail) && sameAddr(from, row.mail) && sameAddr(row.owner, row.mail);
      if (!titleSigns && !vaultSigns) throw new Error("title");
      if (row.block) throw new Error("dated");
      row.block = fourBook.head;
      row.by = from;
      fourDrop(id);
      return;
    }
    if (sig === SEL.setMailbox) {
      vault = "0x" + fourWord(data, 1).slice(-40);
      if (!sameAddr(from, row.title) || !sameAddr(row.owner, row.title)) throw new Error("title");
      if (!namedVault(vault) || sameAddr(vault, FOUR) || sameAddr(vault, row.title)) throw why("bad address");
      row.mail = vault;
      row.owner = vault;
      row.price = 0n;
      return;
    }
    if (sig === SEL.list) {
      ask = BigInt("0x" + fourWord(data, 1));
      if (ask <= 0n) throw new Error("price");
      if (!sameAddr(from, row.title) || !sameAddr(row.owner, row.title)) throw new Error("title");
      if (namedVault(row.mail)) throw why("a vault is named");
      if (row.price > 0n) throw why("already listed");
      row.price = ask;
      return;
    }
    if (sig === SEL.transferFrom) {
      dest = "0x" + fourWord(data, 1).slice(-40);
      if (!sameAddr(from, row.owner) || sameAddr(from, row.title)) throw new Error("key");
      if (!sameAddr(dest, row.title)) throw new Error("title");
      row.owner = dest;
      row.mail = "0x" + "0".repeat(40);
      row.price = 0n;
      return;
    }
    if (sig === SEL.buy) {
      if (row.price <= 0n) throw new Error("price");
      if (sameAddr(from, row.title)) throw new Error("key");
      row.price = 0n;
      row.owner = from;
      row.title = from;
      return;
    }
    throw new Error("plate");
  }

  function fourRpc(method, params) {
    var to, data, sig, id, row, addr, tag, block, i, n, word;
    if (!fourBook) fourBook = fourFresh();
    params = params || [];
    if (method === "eth_blockNumber") return { result: "0x" + fourBook.head.toString(16) };
    if (method === "eth_getBlockByNumber") {
      block = parseInt(params[0], 16);
      if (!(block >= 0)) return { result: null };
      return { result: { number: params[0], timestamp: "0x" + (1700000000 + block * 12).toString(16) } };
    }
    if (method === "eth_getTransactionCount") {
      addr = params[0];
      tag = params[1];
      for (i = 1; i <= 4; i++) {
        row = fourBook.rows[i];
        if (!sameAddr(addr, row.minter)) continue;
        if (!tag || tag === "latest" || tag === "pending") return { result: u256(row.live) };
        block = parseInt(tag, 16);
        if (row.block && block <= row.block) return { result: u256(row.shut) };
        return { result: u256(row.live) };
      }
      /* A signer who is not a minter still has a page nonce. Do not ask a node. */
      return { result: u256(1) };
    }
    if (method === "eth_chainId") return { result: "0xaa36a7" };
    if (method !== "eth_call") return { result: "0x0" };
    to = params[0] && params[0].to;
    data = String((params[0] && params[0].data) || "");
    if (!isFour(to)) return { result: u256(0) };
    sig = data.slice(0, 10).toLowerCase();
    word = data.slice(10);
    if (sig === SEL.nextId) return { result: u256(4) };
    if (sig === SEL.nonceProbe) return { result: u256(0) };
    id = parseInt(word.slice(0, 64), 16);
    row = fourBook.rows[id];
    if (sig === SEL.balanceOf) {
      addr = "0x" + word.slice(0, 64).slice(-40);
      n = 0;
      for (i = 1; i <= 4; i++) if (sameAddr(fourBook.rows[i].owner, addr)) n += 1;
      return { result: u256(n) };
    }
    if (!row) return { result: u256(0) };
    if (sig === SEL.datedBlock) return { result: u256(row.block) };
    if (sig === SEL.datedBy) return { result: u256Addr(row.by) };
    if (sig === SEL.minter) return { result: u256Addr(row.minter) };
    if (sig === SEL.listedPrice) return { result: u256(row.price) };
    if (sig === SEL.titleHolder) return { result: u256Addr(row.title) };
    if (sig === SEL.ownerOf) return { result: u256Addr(row.owner) };
    if (sig === SEL.mailboxOf) return { result: u256Addr(row.mail) };
    return { result: u256(0) };
  }

  function rpc(chain, method, params, i) {
    var local;
    if (isFour(hall && hall.contract)) {
      local = fourRpc(method, params);
      if (local && typeof local.result === "string") return Promise.resolve(local.result);
      return Promise.reject(new Error("rpc"));
    }
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

  /* Anvil can answer the send before latest moves. Wait until that block is visible. */
  function settled(chain, hash, attempt) {
    if (hash === "local") return Promise.resolve();
    if (!attempt) attempt = 0;
    if (!hash || attempt > 40) return Promise.reject(new Error("receipt"));
    return rpcValue(chain, "eth_getTransactionReceipt", [hash]).then(function (receipt) {
      var status = receipt && receipt.status;
      var mined = receipt && receipt.blockNumber;
      if (!mined) throw new Error("pending");
      if (status === "0x0" || status === "0x00") return Promise.reject(new Error("revert"));
      return rpc(chain, "eth_blockNumber", []).then(function (hex) {
        if (parseInt(hex, 16) >= parseInt(mined, 16)) return;
        throw new Error("pending");
      });
    }).catch(function (err) {
      if (err && (err.message === "revert" || err.message === "receipt")) return Promise.reject(err);
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          settled(chain, hash, attempt + 1).then(resolve, reject);
        }, 50);
      });
    });
  }

  function count(chain, address, tag) {
    return rpc(chain, "eth_getTransactionCount", [address, tag]).then(function (hex) {
      var n = parseInt(hex, 16);
      if (!(n >= 0)) throw new Error("nonce");
      return n;
    });
  }

  /* A live plate may read the probe after it is set. A dated plate stays on the node. */
  function liveCount(chain, address) {
    var contract = hall && hall.chain === chain ? hall.contract : "";
    if (!contract) return count(chain, address, "latest");
    return ethCall(chain, contract, SEL.nonceProbe).then(function (hex) {
      var probe = addressOf(hex);
      if (!probe || /^0x0+$/i.test(probe)) return count(chain, address, "latest");
      return ethCall(chain, probe, SEL.nonceOf + padAddr(address)).then(function (nhex) {
        var n = parseInt(nhex, 16);
        if (!(n >= 0)) throw new Error("nonce");
        return n;
      });
    }).catch(function () {
      return count(chain, address, "latest");
    });
  }

  function pad(id) {
    return id.toString(16).padStart(64, "0");
  }

  function padAddr(addr) {
    var s = String(addr || "").replace(/^0x/i, "").toLowerCase();
    if (s.length > 40) s = s.slice(-40);
    return s.padStart(64, "0");
  }

  function priceHex(hex) {
    var s;
    try {
      if (BigInt(hex) <= 0n) return "";
    } catch (e) {
      return "";
    }
    s = BigInt(hex).toString(16);
    if (s.length % 2) s = "0" + s;
    return "0x" + s;
  }

  function ethWei(text) {
    var s = String(text || "").trim().toLowerCase().replace(/\s*eth$/, "");
    var parts, whole, frac, wei;
    if (!/^\d+(\.\d+)?$/.test(s)) return "";
    parts = s.split(".");
    whole = parts[0];
    frac = parts[1] || "";
    if (frac.length > 18) return "";
    while (frac.length < 18) frac += "0";
    try {
      wei = BigInt(whole) * 1000000000000000000n + BigInt(frac);
    } catch (e) {
      return "";
    }
    if (wei <= 0n) return "";
    return wei.toString(16).padStart(64, "0");
  }

  function weiText(hex) {
    var wei, base, whole, frac, digits, i;
    try {
      wei = BigInt(hex);
    } catch (e) {
      return "";
    }
    if (wei <= 0n) return "";
    if (wei === 4200000000000000n) return "0.00420 eth";
    base = 1000000000000000000n;
    whole = wei / base;
    frac = wei % base;
    if (frac === 0n) return whole.toString() + " eth";
    digits = frac.toString().padStart(18, "0");
    i = digits.length;
    while (i > 1 && digits.charAt(i - 1) === "0") i -= 1;
    return whole.toString() + "." + digits.slice(0, i) + " eth";
  }

  function hideAsk() {
    plateAsk = null;
    buyTicket += 1;
    askEl.hidden = true;
    wPrice.textContent = "";
    wPrice.removeAttribute("data-value");
    buyBtn.hidden = true;
    buyBtn.setAttribute("aria-pressed", "false");
  }

  function sameAddr(a, b) {
    return String(a || "").toLowerCase() === String(b || "").toLowerCase();
  }

  function namedVault(addr) {
    var s = String(addr || "").replace(/^0x/i, "");
    return /^[0-9a-fA-F]{40}$/.test(s) && !/^0+$/.test(s);
  }

  /* A named or parked print is not for sale. Buy stays off until the read says so. */
  function saleOpen() {
    if (!plateRole || !plateAsk || plateRole.id !== plateAsk.id) return false;
    if (!sameAddr(plateRole.contract, plateAsk.contract)) return false;
    if (namedVault(plateRole.mailbox)) return false;
    if (!sameAddr(plateRole.owner, plateRole.title)) return false;
    return true;
  }

  function otherVerb() {
    return !listBtn.hidden || !parkBtn.hidden || !returnBtn.hidden || !cancelBtn.hidden || !dateBtn.hidden;
  }

  /* Price of the print on the plate. Buy is for a key who is not the title. */
  function paintBuy() {
    buyBtn.hidden = true;
    if (otherVerb()) return;
    if (!plateAsk || askEl.hidden || !walletKey || !plateAsk.title || !saleOpen()) return;
    if (sameAddr(walletKey, plateAsk.title)) return;
    buyBtn.hidden = false;
  }

  function readAsk(chain, contract, idn, mine) {
    var gen;
    if (mine !== ticket || !(idn >= 1) || !contract) return;
    gen = ++askGen;
    call(chain, contract, SEL.listedPrice, idn).then(function (hex) {
      var text, px, title;
      if (gen !== askGen || mine !== ticket || index !== idn) return;
      text = weiText(hex);
      px = priceHex(hex);
      if (!text || !px) {
        hideAsk();
        paintRole();
        return;
      }
      plateAsk = { chain: chain, contract: contract, id: idn, priceHex: px, title: "" };
      wPrice.textContent = text;
      wPrice.setAttribute("data-value", text);
      askEl.hidden = false;
      paintRole();
      return call(chain, contract, SEL.titleHolder, idn).then(function (titleHex) {
        if (gen !== askGen || mine !== ticket || index !== idn || !plateAsk || plateAsk.id !== idn) return;
        title = checksum(addressOf(titleHex));
        if (!title || title.replace(/^0x/i, "").length !== 40) return;
        plateAsk.title = title;
        paintRole();
      }).catch(function () {});
    }).catch(function () {
      if (gen !== askGen || mine !== ticket || index !== idn) return;
      hideAsk();
      paintRole();
    });
  }

  function closeVault() {
    vaultTicket += 1;
    vaultSure = "";
    parkBtn.setAttribute("aria-pressed", "false");
    vaultRow.hidden = true;
    vaultField.value = "";
  }

  function closeList() {
    listTicket += 1;
    listBtn.setAttribute("aria-pressed", "false");
    listRow.hidden = true;
    listPrice.value = "";
  }

  function closeReturn() {
    returnTicket += 1;
    returnBtn.setAttribute("aria-pressed", "false");
    returnRow.hidden = true;
    returnField.value = "";
  }

  function hideRole() {
    plateRole = null;
    parkBtn.hidden = true;
    listBtn.hidden = true;
    returnBtn.hidden = true;
    cancelBtn.hidden = true;
    dateBtn.hidden = true;
    cancelBtn.setAttribute("aria-pressed", "false");
    dateBtn.setAttribute("aria-pressed", "false");
    buyBtn.hidden = true;
    closeVault();
    closeList();
    closeReturn();
  }

  function hideHeld() {}

  function priceShown() {
    return !!(plateAsk && !askEl.hidden && plateAsk.id === index);
  }

  /* The verb row keeps its height. Verbs stay hidden until a key is connected.
     LIVE, DATED, LISTED, and HELD only choose which prints the arrows walk.
     They do not hide an action this key may take on the plate.
     List hides when the whisper already shows a price. Park stays while this
     key titles the plate and still holds it. Return when this key holds the
     print and is not title. Cancel when this key is the seller and a price
     is showing. Date when this key may date and the print is not yet dated.
     Naming the vault moves the print. Buy is a listed plate this key does not sell. */
  function paintRole() {
    var titleHere, seller, returns, showList, showCancel, showDate, vaultSigns;
    parkBtn.hidden = true;
    listBtn.hidden = true;
    returnBtn.hidden = true;
    cancelBtn.hidden = true;
    dateBtn.hidden = true;
    if (!plateRole || !walletKey) {
      cancelBtn.setAttribute("aria-pressed", "false");
      dateBtn.setAttribute("aria-pressed", "false");
      closeVault();
      closeList();
      closeReturn();
      buyBtn.hidden = true;
      return;
    }
    seller = sameAddr(walletKey, plateRole.title);
    titleHere = seller && sameAddr(plateRole.owner, plateRole.title);
    returns = !titleHere && sameAddr(walletKey, plateRole.owner) && !sameAddr(walletKey, plateRole.title);
    showList = titleHere && !priceShown();
    showCancel = seller && priceShown();
    vaultSigns = namedVault(plateRole.mailbox) && sameAddr(walletKey, plateRole.mailbox) && sameAddr(walletKey, plateRole.owner);
    showDate = !plateRole.dated && (seller || vaultSigns);
    if (!titleHere) closeVault();
    if (!showList) closeList();
    if (!returns) closeReturn();
    if (!showCancel) cancelBtn.setAttribute("aria-pressed", "false");
    if (!showDate) dateBtn.setAttribute("aria-pressed", "false");
    listBtn.hidden = !showList;
    parkBtn.hidden = !titleHere;
    returnBtn.hidden = !returns;
    cancelBtn.hidden = !showCancel;
    dateBtn.hidden = !showDate;
    if (titleHere || returns || showCancel || showDate) buyBtn.hidden = true;
    paintBuy();
  }

  function paintDoor() {
    var on = !!walletKey;
    connectBtn.textContent = on ? "disconnect" : "connect";
    connectBtn.setAttribute("aria-pressed", on ? "true" : "false");
    placeRows();
  }

  function settleBuy(proof) {
    var wait = buyWait;
    buyWait = null;
    if (wait) wait.resolve(proof || null);
  }

  /* Set only by the disconnect control. A new URL does not set it. */
  var DOOR_OFF = "stillwater-key-off";

  function doorOff(value) {
    try {
      if (value) localStorage.setItem(DOOR_OFF, "1");
      else localStorage.removeItem(DOOR_OFF);
    } catch (e) {}
  }

  function doorIsOff() {
    try { return localStorage.getItem(DOOR_OFF) === "1"; }
    catch (e) { return false; }
  }

  /* A permitted key, when this page has not been disconnected. An empty list stays put. */
  function pullGranted() {
    var eth = window.ethereum;
    if (!eth || !eth.request || walletKey || doorIsOff()) return;
    eth.request({ method: "eth_accounts" }).then(function (accounts) {
      if (walletKey || doorIsOff()) return;
      if (!accounts || !accounts[0]) return;
      adoptKey(accounts[0]);
    }).catch(function () {});
  }

  function setWallet(value) {
    var next = value || "";
    var changed = next.toLowerCase() !== (walletKey || "").toLowerCase();
    walletKey = next;
    StillDoor.write(walletKey);
    if (next) doorOff(false);
    if (changed && isFour(hall && hall.contract)) {
      fourBind(walletKey);
      if (index >= 1) {
        readRole(hall.chain, hall.contract, index, ticket);
        readAsk(hall.chain, hall.contract, index, ticket);
      }
    }
    if (!walletKey) {
      hallProof = null;
      proofState = "";
      settleBuy(null);
      return;
    }
    if (!changed) return;
    hallProof = null;
    proofState = "";
    settleBuy(null);
    try { startHall(); } catch (e) { hallReady = true; }
  }

  function disconnectKey() {
    doorOff(true);
    setWallet("");
    heldBalance = 0;
    closeVault();
    closeList();
    closeReturn();
    paintDoor();
    paintRole();
    arrows();
  }

  function connectKey() {
    if (!window.ethereum) {
      window.location.assign(DOOR);
      return;
    }
    window.ethereum.request({ method: "eth_requestAccounts" }).then(function (accounts) {
      setWallet(accounts && accounts[0] ? accounts[0] : "");
      if (note.textContent === "connect") setNote("");
      paintDoor();
      paintRole();
      readHeld();
    }).catch(function (err) {
      if (err && err.code === 4001) setNote("declined");
    });
  }

  function readRole(chain, contract, idn, mine) {
    var mineRole;
    if (mine !== ticket || !(idn >= 1) || !contract) return;
    mineRole = ++roleTicket;
    Promise.all([
      call(chain, contract, SEL.titleHolder, idn),
      call(chain, contract, SEL.ownerOf, idn),
      call(chain, contract, SEL.mailboxOf, idn),
      call(chain, contract, SEL.datedBlock, idn)
    ]).then(function (parts) {
      var title, owner, box, dated;
      if (mineRole !== roleTicket || mine !== ticket || index !== idn) return;
      title = checksum(addressOf(parts[0]));
      owner = checksum(addressOf(parts[1]));
      box = checksum(addressOf(parts[2]));
      dated = parseInt(parts[3], 16) > 0;
      if (!title || title.replace(/^0x/i, "").length !== 40) return;
      if (!owner || owner.replace(/^0x/i, "").length !== 40) return;
      plateRole = {
        chain: chain,
        contract: contract,
        id: idn,
        title: title,
        owner: owner,
        mailbox: box,
        dated: dated
      };
      paintRole();
    }).catch(function () {
      if (mineRole !== roleTicket) return;
      hideRole();
    });
  }

  /* One balance read. The hall is not scanned until HELD is pressed and an arrow is clicked. */
  function readHeld() {
    var mine = ++holdTicket;
    var key = walletKey;
    var chain = hall.chain;
    var contract = hall.contract;
    if (!key || !contract) {
      heldBalance = 0;
      arrows();
      hideHeld();
      return;
    }
    ethCall(chain, contract, SEL.balanceOf + padAddr(key)).then(function (hex) {
      var n;
      if (mine !== holdTicket) return;
      if (!walletKey || !sameAddr(walletKey, key)) return;
      if (!hall.contract || hall.chain !== chain || !sameAddr(hall.contract, contract)) return;
      n = parseInt(hex, 16);
      heldBalance = inBar() && n >= 0 ? n : 0;
      arrows();
      if (!(n > 0)) {
        hideHeld();
        return;
      }
      heldBtn.hidden = false;
    }).catch(function () {
      if (mine !== holdTicket) return;
      heldBalance = 0;
      arrows();
      hideHeld();
    });
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

  /* The plate is Plate.paint. tokenURI would run the on-chain painter. */
  function readToken(chain, contract, id) {
    return Promise.all([
      call(chain, contract, SEL.datedBlock, id),
      call(chain, contract, SEL.datedBy, id),
      call(chain, contract, SEL.minter, id)
    ]).then(function (parts) {
      var block = parseInt(parts[0], 16);
      var minter = checksum(addressOf(parts[2]));
      var bare = minter.replace(/^0x/i, "");
      if (!(block >= 0)) throw new Error("block");
      if (!bare || /^0+$/.test(bare)) {
        var missing = new Error("none");
        missing.why = "none";
        throw missing;
      }
      return {
        block: block,
        by: checksum(addressOf(parts[1])),
        minter: minter
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

  /* The address bar, not the default hall. A bare page has no set. */
  function inBar() {
    var q = query();
    if (!q.contract || !hall || !hall.known || !hall.contract) return false;
    return String(q.contract).toLowerCase() === String(hall.contract).toLowerCase();
  }

  /* Quiet until a hall is in the bar, or LISTED / HELD has more than one print. */
  function arrows() {
    var on = false;
    if (lit === "listed") on = listedCount > 1;
    else if (lit === "held") on = heldBalance > 1;
    else if (lit === "live" || lit === "dated") on = inBar();
    prevBtn.setAttribute("aria-disabled", on ? "false" : "true");
    nextBtn.setAttribute("aria-disabled", on ? "false" : "true");
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
      still: q.get("still") === "1",
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
    if (pageStill) q.set("still", "1");
    tail = q.toString();
    hash = parts.id ? "#" + parts.id : (parts.key ? "#" + parts.key : "");
    history.replaceState(null, "", location.pathname + (tail ? "?" + tail : "") + hash);
  }

  function onToken() {
    if (!(index >= 1) || !hall || !hall.contract) return false;
    if (hall.known && (!(hall.nextId >= 1) || index > hall.nextId)) return false;
    return true;
  }

  function emptyHall() {
    index = 0;
    searchKey = "";
    snow();
    clearLintel();
    mark("live");
    setNote("there is no print");
    writeUrl({ chain: hall.chain, contract: hall.contract });
  }

  function settleHall(q) {
    if (!q.contract || q.id) return;
    if (!(hall.nextId >= 1)) {
      emptyHall();
      return;
    }
    openLiveToken(hall.chain, hall.contract, 1);
  }

  function openKey(raw, chain, paceBytes, postcard) {
    var asked = query();
    if (asked.contract && hall && hall.contract && String(raw || "").toLowerCase() === EXAMPLE.toLowerCase()) {
      if (!hall.known) return;
      if (hall.nextId >= 1) {
        openLiveToken(hall.chain, hall.contract, index >= 1 ? index : 1);
        return;
      }
      emptyHall();
      return;
    }
    var id = ++ticket;
    walkTicket += 1;
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
    liveCount(chain, raw).then(function (nonce) {
      if (id !== ticket) return;
      index = 0;
      searchKey = checksum(raw);
      mark("live");
      show(bytes, nonce, raw, paceBytes || bytes);
      if (postcard !== false) {
        writeUrl({
          chain: asked.contract ? hall.chain : chain,
          contract: asked.contract ? hall.contract : "",
          mode: "live",
          key: checksum(raw)
        });
      } else if (asked.contract) writeUrl({ chain: hall.chain, contract: hall.contract });
      else writeUrl({});
    }).catch(function () {
      if (id !== ticket) return;
      weather("open");
    });
  }

  function hexBlock(n) {
    return "0x" + n.toString(16);
  }

  function rpcValue(chain, method, params, i) {
    var local;
    if (isFour(hall && hall.contract)) {
      local = fourRpc(method, params);
      if (local && local.result != null) return Promise.resolve(local.result);
      return Promise.reject(new Error("rpc"));
    }
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
      if (!body || body.error || body.result == null) throw new Error("result");
      return body.result;
    }).catch(function () {
      return rpcValue(chain, method, params, i + 1);
    });
  }

  /* The block where this key's nonce reached its latest count, then the quiet since that block. */
  function quietGap(chain, address) {
    return Promise.all([
      rpc(chain, "eth_blockNumber", []),
      count(chain, address, "latest")
    ]).then(function (parts) {
      var hi = parseInt(parts[0], 16);
      var nonce = parts[1];
      if (!(hi >= 0) || !(nonce >= 1)) throw new Error("gap");
      return findSend(chain, address, nonce, 0, hi).then(function (block) {
        return Promise.all([
          rpcValue(chain, "eth_getBlockByNumber", [hexBlock(block), false]),
          rpcValue(chain, "eth_getBlockByNumber", [hexBlock(hi), false])
        ]).then(function (blocks) {
          var sent = parseInt(blocks[0] && blocks[0].timestamp, 16);
          var now = parseInt(blocks[1] && blocks[1].timestamp, 16);
          if (!(sent >= 0) || !(now >= sent)) throw new Error("gap");
          return now - sent;
        });
      });
    });
  }

  function findSend(chain, address, nonce, lo, hi) {
    if (lo > hi) return Promise.reject(new Error("gap"));
    if (lo === hi) {
      return count(chain, address, hexBlock(lo)).then(function (n) {
        if (n < nonce) throw new Error("gap");
        return lo;
      });
    }
    var mid = lo + Math.floor((hi - lo) / 2);
    return count(chain, address, hexBlock(mid)).then(function (n) {
      if (n >= nonce) return findSend(chain, address, nonce, lo, mid);
      return findSend(chain, address, nonce, mid + 1, hi);
    });
  }

  function showUnread(token, idn, mine, chain, contract) {
    var tag = "0x" + token.block.toString(16);
    var who = token.by;
    return count(chain, who, tag).then(function (nonce) {
      if (mine !== ticket) return;
      setPaint("open");
      index = idn;
      show(Plate.parseAddress(who), nonce, who, word(idn), 0);
      setNote(UNREAD);
      readAsk(chain, contract, idn, mine);
      readRole(chain, contract, idn, mine);
      writeUrl({ chain: chain, contract: contract, id: idn, mode: "live", key: who });
    }).catch(function () {
      if (mine !== ticket) return;
      weather("open");
    });
  }

  function openDatedLive(chain, contract, idn, token, mine) {
    var datedTag = "0x" + token.block.toString(16);
    var bytes = Plate.parseAddress(token.minter);
    return liveCount(chain, token.minter).then(function (liveNonce) {
      if (mine !== ticket) return;
      return count(chain, token.minter, datedTag).then(function (datedNonce) {
        var dNonce;
        if (mine !== ticket) return;
        dNonce = liveNonce - datedNonce;
        if (!(dNonce >= 0)) return showUnread(token, idn, mine, chain, contract);
        return quietGap(chain, token.minter).then(function (gap) {
          var term;
          if (mine !== ticket) return;
          term = PlateFreeze.freezeTerm(dNonce, gap);
          setPaint("open");
          index = idn;
          show(bytes, liveNonce, token.minter, word(idn), term);
          readAsk(chain, contract, idn, mine);
      readRole(chain, contract, idn, mine);
          writeUrl({ chain: chain, contract: contract, id: idn, mode: "live", key: token.minter });
        }).catch(function () {
          if (mine !== ticket) return;
          return showUnread(token, idn, mine, chain, contract);
        });
      });
    }).catch(function () {
      if (mine !== ticket) return;
      weather("open");
    });
  }

  function openLiveToken(chain, contract, idn) {
    var mine = ++ticket;
    walkTicket += 1;
    if (!(idn >= 1) || !contract) return;
    readCached(chain, contract, idn).then(function (token) {
      if (mine !== ticket) return;
      if (token.block !== 0) return openDatedLive(chain, contract, idn, token, mine);
      return liveCount(chain, token.minter).then(function (nonce) {
        if (mine !== ticket) return;
        setPaint("open");
        index = idn;
        var bytes = Plate.parseAddress(token.minter);
        show(bytes, nonce, token.minter, word(idn));
        readAsk(chain, contract, idn, mine);
      readRole(chain, contract, idn, mine);
        writeUrl({ chain: chain, contract: contract, id: idn, mode: "live", key: token.minter });
      });
    }).catch(function (err) {
      if (mine !== ticket) return;
      if (err && err.why === "none") {
        if (contract) emptyHall();
        else openKey(EXAMPLE, chain || "mainnet", null, false);
        return;
      }
      weather("open");
    });
  }

  function openDated(chain, contract, idText) {
    var idn = parseInt(idText, 10);
    var mine = ++ticket;
    walkTicket += 1;
    if (!(idn >= 1) || !contract) {
      if (contract) {
        emptyHall();
        return;
      }
      if (pageStill) {
        openKey(EXAMPLE, chain || "mainnet", null, false);
        return;
      }
      setNote(NO_PRINT);
      return;
    }
    readCached(chain, contract, idn).then(function (token) {
      var who = token.block !== 0 ? token.by : token.minter;
      var tag = token.block !== 0 ? "0x" + token.block.toString(16) : "latest";
      if (mine !== ticket) return;
      if (token.block === 0) {
        return liveCount(chain, token.minter).then(function (nonce) {
          if (mine !== ticket) return;
          setPaint("open");
          index = idn;
          show(Plate.parseAddress(token.minter), nonce, token.minter, word(idn));
          if (!pageStill) setNote(NO_PRINT);
          readAsk(chain, contract, idn, mine);
          readRole(chain, contract, idn, mine);
          writeUrl({ chain: chain, contract: contract, id: idn, mode: "live", key: token.minter });
        });
      }
      return count(chain, who, tag).then(function (nonce) {
        if (mine !== ticket) return;
        setPaint("dated");
        index = idn;
        show(Plate.parseAddress(who), nonce, who, word(idn));
        readAsk(chain, contract, idn, mine);
      readRole(chain, contract, idn, mine);
        writeUrl({
          chain: chain,
          contract: contract,
          id: idn,
          mode: "dated",
          key: ""
        });
      });
    }).catch(function (err) {
      if (mine !== ticket) return;
      if (err && err.why === "none") {
        if (contract) emptyHall();
        else openKey(EXAMPLE, chain || "mainnet", null, false);
        return;
      }
      weather("dated");
    });
  }

  function hallFrom(q) {
    if (q.contract) {
      return { chain: q.chain || "sepolia", contract: q.contract, nextId: 0, known: false };
    }
    if (q.chain === "sepolia" && q.id) {
      return { chain: "sepolia", contract: SEPOLIA, nextId: 0, known: false };
    }
    return { chain: "mainnet", contract: MAINNET_STILL, nextId: 0, known: false };
  }

  function rememberDoor(chain, contract, nextId) {
    if (!MAINNET_STILL) return;
    if (chain === "mainnet" && contract.toLowerCase() === MAINNET_STILL.toLowerCase()) {
      doorNext = nextId >= 1 ? nextId : 0;
      doorKnown = true;
    }
  }

  function route(q) {
    var key = q.key || ((q.hash.slice(0, 2) === "0x" || q.hash.slice(0, 2) === "0X") ? q.hash : "");
    var contract = q.contract;
    var chain = q.chain;
    if (!contract && chain === "sepolia" && q.id) contract = SEPOLIA;
    if (!contract && q.still && q.id && MAINNET_STILL && chain !== "sepolia") {
      contract = MAINNET_STILL;
      chain = chain || "mainnet";
    }
    if (!chain && contract) chain = "sepolia";
    if (q.id && contract && chain) {
      if (q.mode === "live") openLiveToken(chain, contract, parseInt(q.id, 10));
      else openDated(chain, contract, q.id);
      return;
    }
    if (contract && !key) return;
    if (key) openKey(key, chain || "mainnet", null, true);
    else openKey(EXAMPLE, "mainnet", null, false);
  }

  function boot() {
    var q = query();
    resumeKey();
    pageStill = !!q.still;
    snow();
    hall = hallFrom(q);
    if (isFour(hall.contract)) fourBind(StillDoor.read());
    if (!MAINNET_STILL || isFour(hall.contract)) {
      doorNext = 0;
      doorKnown = true;
    } else if (!(hall.contract && hall.chain === "mainnet" && hall.contract.toLowerCase() === MAINNET_STILL.toLowerCase())) {
      readNextId("mainnet", MAINNET_STILL).then(function (n) {
        doorNext = n >= 1 ? n : 0;
        doorKnown = true;
        arrows();
      }).catch(function () {
        doorNext = 0;
        doorKnown = true;
        arrows();
      });
    }
    if (!hall.contract) {
      hall.nextId = 0;
      hall.known = true;
      arrows();
      readHeld();
    } else {
      readNextId(hall.chain, hall.contract).then(function (n) {
        hall.nextId = n >= 1 ? n : 0;
        hall.known = true;
        rememberDoor(hall.chain, hall.contract, hall.nextId);
        arrows();
        readHeld();
        settleHall(q);
      }).catch(function () {
        hall.nextId = 0;
        hall.known = true;
        arrows();
        readHeld();
        if (q.contract && !q.id) {
          writeUrl({ chain: hall.chain, contract: hall.contract });
          weather("open");
        }
      });
    }
    route(q);
    resumeKey();
  }

  /* A stored key stays connected across a new URL. An empty provider list does not clear it. */
  function adoptKey(value) {
    if (!value) {
      if (!walletKey) return;
      setWallet("");
      heldBalance = 0;
      closeVault();
      closeList();
      closeReturn();
      paintDoor();
      paintRole();
      arrows();
      return;
    }
    if (walletKey && sameAddr(walletKey, value)) {
      paintDoor();
      return;
    }
    setWallet(value);
    if (note.textContent === "connect") setNote("");
    paintDoor();
    paintRole();
    readHeld();
  }

  function resumeKey() {
    var saved = StillDoor.read();
    if (saved) {
      adoptKey(saved);
      return;
    }
    if (doorIsOff()) return;
    pullGranted();
  }

  window.addEventListener("storage", function (ev) {
    if (!ev || ev.key !== StillDoor.name) return;
    adoptKey(ev.newValue || "");
  });

  window.addEventListener("pageshow", function () {
    resumeKey();
  });

  function askProof(addr) {
    var id;
    if (!hallWorker || !hallReady || !addr) return;
    id = ++proofId;
    proofState = "wait";
    hallProof = null;
    hallWorker.postMessage({ id: id, addr: String(addr).toLowerCase() });
  }

  function startHall() {
    if (hallWorker) {
      if (hallReady && walletKey) askProof(walletKey);
      return;
    }
    hallWorker = new Worker("hall-worker.js");
    hallWorker.onerror = function () {
      hallReady = true;
      if (buyWait) settleBuy(null);
    };
    hallWorker.onmessage = function (ev) {
      var msg = ev.data || {};
      if (msg.ready === true) {
        hallReady = true;
        if (walletKey) askProof(walletKey);
        return;
      }
      if (msg.ready === false) {
        hallReady = true;
        if (buyWait) settleBuy(null);
        return;
      }
      if (msg.id !== proofId || !walletKey) return;
      if (msg.miss || !msg.proof) {
        hallProof = null;
        proofState = "miss";
        setNote("this key is not in the hall");
        if (buyWait) settleBuy(null);
        return;
      }
      hallProof = msg.proof;
      proofState = "have";
      if (buyWait) {
        if (sameAddr(buyWait.addr, walletKey)) settleBuy(hallProof);
        else settleBuy(null);
      }
    };
    hallWorker.postMessage({ start: true });
  }

  /* buy(uint256,bytes32[]): id, then the proof array at word offset 64. */
  function encodeBuy(id, proof) {
    var n, body, i, word;
    try { n = BigInt(id); } catch (e) { return ""; }
    if (n < 0n || !proof) return "";
    body = n.toString(16).padStart(64, "0") + pad(64) + pad(proof.length);
    for (i = 0; i < proof.length; i++) {
      word = String(proof[i]).replace(/^0x/i, "").toLowerCase();
      if (!/^[0-9a-f]{1,64}$/.test(word)) return "";
      body += "0".repeat(64 - word.length) + word;
    }
    return SEL.buy + body;
  }

  function takeProof(addr) {
    if (!addr || !sameAddr(walletKey, addr)) return Promise.resolve(null);
    if (proofState === "have" && hallProof) return Promise.resolve(hallProof);
    if (proofState === "miss") return Promise.resolve(null);
    return new Promise(function (resolve) {
      buyWait = { addr: addr, resolve: resolve };
      if (proofState !== "wait") startHall();
    });
  }

  function openAt(i) {
    if (mode === "dated") openDated(hall.chain, hall.contract, String(i));
    else openLiveToken(hall.chain, hall.contract, i);
  }

  /* One lit set. A miss leaves the plate and the line alone. */
  function scanIds(kind, start, dir, scan) {
    var chain = hall.chain;
    var contract = hall.contract;
    var last = hall.nextId;
    var key = walletKey;
    function one(id) {
      if (kind === "listed") {
        return call(chain, contract, SEL.listedPrice, id).then(function (hex) {
          return priceHex(hex) ? id : 0;
        });
      }
      if (kind === "held") {
        if (!key) return Promise.resolve(0);
        return call(chain, contract, SEL.ownerOf, id).then(function (hex) {
          return sameAddr(addressOf(hex), key) ? id : 0;
        });
      }
      return call(chain, contract, SEL.datedBlock, id).then(function (hex) {
        return parseInt(hex, 16) > 0 ? id : 0;
      });
    }
    function batch(from) {
      var ids = [];
      var n;
      var i;
      if (scan !== false && scan !== walkTicket) return Promise.resolve(0);
      if (from < 1 || from > last) return Promise.resolve(0);
      i = from;
      for (n = 0; n < 16; n++) {
        if (i < 1 || i > last) break;
        ids.push(i);
        i += dir;
      }
      if (!ids.length) return Promise.resolve(0);
      return Promise.all(ids.map(function (id) {
        return one(id).catch(function () { return -1; });
      })).then(function (hits) {
        var k;
        if (scan !== false && scan !== walkTicket) return 0;
        for (k = 0; k < hits.length; k++) {
          if (hits[k] > 0) return hits[k];
          if (hits[k] < 0) return 0;
        }
        return batch(i);
      });
    }
    return batch(start);
  }

  function step(dir) {
    var kind, start, scan;
    if (prevBtn.getAttribute("aria-disabled") === "true") return;
    if (!inBar() || !(hall.nextId >= 1)) return;
    if (lit === "listed" && !(listedCount > 1)) return;
    if (lit === "held" && !(heldBalance > 1)) return;
    kind = (lit === "listed" || lit === "held" || lit === "dated") ? lit : "";
    if (!(index >= 1 && index <= hall.nextId)) start = dir < 0 ? hall.nextId : 1;
    else {
      start = index + dir;
      if (start < 1 || start > hall.nextId) return;
    }
    if (!kind) {
      spareNote = true;
      openAt(start);
      return;
    }
    scan = ++walkTicket;
    spareNote = true;
    scanIds(kind, start, dir, scan).then(function (id) {
      if (scan !== walkTicket) return;
      if (!(id >= 1)) {
        spareNote = false;
        return;
      }
      openAt(id);
    });
  }

  function enterLive() {
    var was = lit;
    pageStill = false;
    light("live");
    if (note.textContent === NO_PRINT || note.textContent === NO_LISTED || note.textContent === NO_HELD) setNote("");
    if (was === "dated") {
      if (onToken()) openLiveToken(hall.chain, hall.contract, index);
      else if (heldBytes) arm(heldBytes, heldNonce, heldPace);
    }
  }

  function enterFilter(kind) {
    var scan;
    var empty = kind === "listed" ? NO_LISTED : NO_HELD;
    if (kind === "held" && !walletKey) {
      setNote("connect");
      return;
    }
    if (lit === kind) {
      enterLive();
      return;
    }
    if (kind === "listed") listedCount = 0;
    light(kind);
    if (!inBar() || !(hall.nextId >= 1)) {
      setNote(empty);
      return;
    }
    scan = walkTicket;
    scanIds(kind, 1, 1, scan).then(function (id) {
      if (scan !== walkTicket || lit !== kind) return;
      if (!(id >= 1)) {
        setNote(empty);
        return;
      }
      if (kind === "listed") {
        scanIds("listed", id + 1, 1, false).then(function (second) {
          if (lit !== "listed") return;
          listedCount = second >= 1 ? 2 : 1;
          arrows();
        });
      }
      openLiveToken(hall.chain, hall.contract, id);
    });
  }

  function enterDated() {
    var scan;
    var here;
    if (note.textContent === WEATHER) {
      returnLive();
      return;
    }
    if (lit === "dated") {
      enterLive();
      return;
    }
    light("dated");
    if (!inBar() || !(hall.nextId >= 1)) {
      disarm();
      setNote(NO_PRINT);
      return;
    }
    scan = walkTicket;
    here = index;
    scanIds("dated", 1, 1, scan).then(function (id) {
      if (scan !== walkTicket || lit !== "dated") return;
      if (!(id >= 1)) {
        disarm();
        setNote(NO_PRINT);
        return;
      }
      if (!(here >= 1)) {
        openDated(hall.chain, hall.contract, String(id));
        return;
      }
      return call(hall.chain, hall.contract, SEL.datedBlock, here).then(function (hex) {
        if (scan !== walkTicket || lit !== "dated") return;
        openDated(hall.chain, hall.contract, String(parseInt(hex, 16) > 0 ? here : id));
      });
    });
  }

  liveBtn.addEventListener("click", function () {
    var typed;
    pageStill = false;
    if (note.textContent === WEATHER) {
      returnLive();
      return;
    }
    light("live");
    if (note.textContent === NO_PRINT || note.textContent === NO_LISTED || note.textContent === NO_HELD) setNote("");
    if (onToken()) {
      openLiveToken(hall.chain, hall.contract, index);
      return;
    }
    typed = field.value.trim() || searchKey || EXAMPLE;
    openKey(typed, "mainnet", null, typed.toLowerCase() === EXAMPLE.toLowerCase() ? false : true);
  });

  datedBtn.addEventListener("click", enterDated);

  listedBtn.addEventListener("click", function () { enterFilter("listed"); });

  heldBtn.addEventListener("click", function () { enterFilter("held"); });

  function onCancel() {
    var role, from;
    if (cancelBtn.hidden || !plateRole) return;
    if (cancelBtn.getAttribute("aria-pressed") === "true") return;
    if (!window.ethereum && !isFour(plateRole.contract)) {
      window.location.assign(DOOR);
      return;
    }
    closeVault();
    closeList();
    closeReturn();
    role = {
      chain: plateRole.chain,
      contract: plateRole.contract,
      id: plateRole.id,
      title: plateRole.title
    };
    cancelBtn.setAttribute("aria-pressed", "true");
    keyFrom(role.contract).then(function (accounts) {
      from = accounts && accounts[0] ? accounts[0] : "";
      if (!isFour(role.contract)) {
        setWallet(from);
        paintDoor();
      }
      if (!from || !sameAddr(from, role.title)) throw new Error("key");
      return call(role.chain, role.contract, SEL.titleHolder, role.id);
    }).then(function (hex) {
      if (!sameAddr(addressOf(hex), from)) throw new Error("title");
      return castTx(role.chain, {
        from: from,
        to: role.contract,
        data: SEL.cancel + pad(role.id)
      }).then(function (hash) {
        return settled(role.chain, hash);
      });
    }).then(function () {
      cancelBtn.setAttribute("aria-pressed", "false");
      setNote("");
      if (index === role.id) {
        readRole(role.chain, role.contract, role.id, ticket);
        readAsk(role.chain, role.contract, role.id, ticket);
      }
    }).catch(function (err) {
      cancelBtn.setAttribute("aria-pressed", "false");
      noteWhy(err);
    });
  }

  function onDate() {
    var role, from;
    if (dateBtn.hidden || !plateRole) return;
    if (dateBtn.getAttribute("aria-pressed") === "true") return;
    if (!window.ethereum && !isFour(plateRole.contract)) {
      window.location.assign(DOOR);
      return;
    }
    closeVault();
    closeList();
    closeReturn();
    role = {
      chain: plateRole.chain,
      contract: plateRole.contract,
      id: plateRole.id,
      title: plateRole.title
    };
    dateBtn.setAttribute("aria-pressed", "true");
    keyFrom(role.contract).then(function (accounts) {
      from = accounts && accounts[0] ? accounts[0] : "";
      if (!isFour(role.contract)) {
        setWallet(from);
        paintDoor();
      }
      if (!from) throw new Error("key");
      return Promise.all([
        call(role.chain, role.contract, SEL.titleHolder, role.id),
        call(role.chain, role.contract, SEL.ownerOf, role.id),
        call(role.chain, role.contract, SEL.mailboxOf, role.id),
        call(role.chain, role.contract, SEL.datedBlock, role.id)
      ]);
    }).then(function (parts) {
      var title = addressOf(parts[0]);
      var owner = addressOf(parts[1]);
      var box = addressOf(parts[2]);
      var dated = parseInt(parts[3], 16) > 0;
      var titleSigns = sameAddr(from, title);
      var vaultSigns = namedVault(box) && sameAddr(from, box) && sameAddr(owner, box);
      if (!titleSigns && !vaultSigns) throw new Error("title");
      if (dated) throw new Error("dated");
      return castTx(role.chain, {
        from: from,
        to: role.contract,
        data: SEL.date + pad(role.id)
      }).then(function (hash) {
        return settled(role.chain, hash);
      });
    }).then(function () {
      dateBtn.setAttribute("aria-pressed", "false");
      setNote("");
      if (index === role.id) readRole(role.chain, role.contract, role.id, ticket);
    }).catch(function (err) {
      dateBtn.setAttribute("aria-pressed", "false");
      noteWhy(err);
    });
  }

  cancelBtn.addEventListener("click", onCancel);
  dateBtn.addEventListener("click", onDate);

  parkBtn.addEventListener("click", function () {
    var open;
    if (parkBtn.hidden) return;
    open = parkBtn.getAttribute("aria-pressed") !== "true";
    if (!open) {
      closeVault();
      return;
    }
    closeList();
    closeReturn();
    parkBtn.setAttribute("aria-pressed", "true");
    vaultRow.hidden = false;
    vaultField.value = "";
    vaultField.focus();
  });

  function sameChain(id, want) {
    try {
      return BigInt(id) === BigInt(want);
    } catch (e) {
      return false;
    }
  }

  function ensureChain(chain) {
    var want = CHAIN_ID[chain];
    if (!want || !window.ethereum) return Promise.reject(new Error("chain"));
    return window.ethereum.request({ method: "eth_chainId" }).then(function (id) {
      if (sameChain(id, want)) return;
      return window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: want }]
      });
    });
  }

  function keyFrom(contract) {
    if (isFour(contract)) return Promise.resolve([walletKey]);
    if (!window.ethereum) {
      window.location.assign(DOOR);
      return Promise.reject(new Error("wallet"));
    }
    return window.ethereum.request({ method: "eth_requestAccounts" });
  }

  function castTx(chain, tx) {
    if (isFour(tx.to)) {
      fourApply(tx);
      return Promise.resolve("local");
    }
    return ensureChain(chain).then(function () {
      return window.ethereum.request({
        method: "eth_sendTransaction",
        params: [tx]
      });
    });
  }

  /* Sends the listed wei. There is no field that can go short or over. */
  function onBuy() {
    var ask, from;
    if (!plateAsk || buyBtn.hidden) return;
    if (buyBtn.getAttribute("aria-pressed") === "true") return;
    if (!window.ethereum && !isFour(plateAsk.contract)) {
      window.location.assign(DOOR);
      return;
    }
    ask = {
      chain: plateAsk.chain,
      contract: plateAsk.contract,
      id: plateAsk.id,
      title: plateAsk.title
    };
    buyBtn.setAttribute("aria-pressed", "true");
    keyFrom(ask.contract).then(function (accounts) {
      from = accounts && accounts[0] ? accounts[0] : "";
      setWallet(from);
      paintDoor();
      if (!from || (ask.title && sameAddr(from, ask.title))) throw new Error("key");
      return call(ask.chain, ask.contract, SEL.listedPrice, ask.id);
    }).then(function (hex) {
      var value = priceHex(hex);
      var data;
      if (!value) throw new Error("price");
      return takeProof(from).then(function (proof) {
        if (!proof) throw why("this key is not in the hall");
        data = encodeBuy(ask.id, proof);
        if (!data || data.slice(0, 10).toLowerCase() !== SEL.buy) throw why("this key is not in the hall");
        return castTx(ask.chain, {
          from: from,
          to: ask.contract,
          value: value,
          data: data
        }).then(function (hash) {
          return settled(ask.chain, hash);
        });
      });
    }).then(function () {
      buyBtn.setAttribute("aria-pressed", "false");
      setNote("");
      if (index === ask.id) {
        readAsk(ask.chain, ask.contract, ask.id, ticket);
        readRole(ask.chain, ask.contract, ask.id, ticket);
      }
    }).catch(function (err) {
      buyBtn.setAttribute("aria-pressed", "false");
      paintBuy();
      noteWhy(err);
    });
  }

  buyBtn.addEventListener("click", onBuy);

  /* Names a vault. The contract moves the print. Confirm the address first. */
  function onConfirm() {
    var role, raw, check, vault, from, mine;
    if (!plateRole || parkBtn.hidden || vaultRow.hidden) return;
    if (confirmBtn.getAttribute("aria-pressed") === "true") return;
    if (!window.ethereum && !isFour(plateRole.contract)) {
      window.location.assign(DOOR);
      return;
    }
    raw = vaultField.value.trim();
    check = Plate.checksumState(raw);
    vault = check === "ok" && Plate.parseAddress(raw) ? checksum(raw) : "";
    if (!namedVault(vault) || sameAddr(vault, plateRole.contract) || sameAddr(vault, plateRole.title)) {
      setNote("bad address");
      return;
    }
    if (vaultSure.toLowerCase() !== vault.toLowerCase()) {
      vaultSure = vault;
      setNote(vault + " — a wrong vault is permanent");
      return;
    }
    mine = vaultTicket;
    role = {
      chain: plateRole.chain,
      contract: plateRole.contract,
      id: plateRole.id,
      title: plateRole.title,
      vault: vault
    };
    confirmBtn.setAttribute("aria-pressed", "true");
    keyFrom(role.contract).then(function (accounts) {
      from = accounts && accounts[0] ? accounts[0] : "";
      setWallet(from);
      paintDoor();
      if (mine !== vaultTicket) throw new Error("plate");
      if (!from || !sameAddr(from, role.title)) throw new Error("key");
      return Promise.all([
        call(role.chain, role.contract, SEL.titleHolder, role.id),
        call(role.chain, role.contract, SEL.ownerOf, role.id)
      ]);
    }).then(function (parts) {
      var title = addressOf(parts[0]);
      var owner = addressOf(parts[1]);
      if (mine !== vaultTicket) throw new Error("plate");
      if (!sameAddr(title, role.title) || !sameAddr(owner, role.title) || !sameAddr(from, title)) throw new Error("title");
      if (mine !== vaultTicket) throw new Error("plate");
      return castTx(role.chain, {
        from: from,
        to: role.contract,
        data: SEL.setMailbox + pad(role.id) + padAddr(role.vault)
      }).then(function (hash) {
        return settled(role.chain, hash);
      });
    }).then(function () {
      confirmBtn.setAttribute("aria-pressed", "false");
      closeVault();
      setNote("mailbox named");
      if (index === role.id) readRole(role.chain, role.contract, role.id, ticket);
      readHeld();
    }).catch(function (err) {
      confirmBtn.setAttribute("aria-pressed", "false");
      noteWhy(err);
    });
  }

  confirmBtn.addEventListener("click", onConfirm);

  /* Title names a price. The print stays. */
  function onListConfirm() {
    var role, raw, word, from, mine;
    if (!plateRole || listBtn.hidden || listRow.hidden) return;
    if (listConfirm.getAttribute("aria-pressed") === "true") return;
    if (!window.ethereum && !isFour(plateRole.contract)) {
      window.location.assign(DOOR);
      return;
    }
    raw = listPrice.value.trim();
    word = ethWei(raw);
    if (!word) return;
    mine = listTicket;
    role = {
      chain: plateRole.chain,
      contract: plateRole.contract,
      id: plateRole.id,
      title: plateRole.title
    };
    listConfirm.setAttribute("aria-pressed", "true");
    keyFrom(role.contract).then(function (accounts) {
      from = accounts && accounts[0] ? accounts[0] : "";
      setWallet(from);
      paintDoor();
      if (mine !== listTicket) throw new Error("plate");
      if (!from || !sameAddr(from, role.title)) throw new Error("key");
      return Promise.all([
        call(role.chain, role.contract, SEL.titleHolder, role.id),
        call(role.chain, role.contract, SEL.ownerOf, role.id),
        call(role.chain, role.contract, SEL.mailboxOf, role.id),
        call(role.chain, role.contract, SEL.listedPrice, role.id)
      ]);
    }).then(function (parts) {
      var title = addressOf(parts[0]);
      var owner = addressOf(parts[1]);
      var box = addressOf(parts[2]);
      var price = 0n;
      if (mine !== listTicket) throw new Error("plate");
      if (!sameAddr(title, role.title) || !sameAddr(owner, role.title) || !sameAddr(from, title)) throw new Error("title");
      try { price = BigInt(parts[3]); } catch (e) { price = 0n; }
      if (price > 0n) throw why("already listed");
      if (namedVault(box)) throw why("a vault is named");
      if (mine !== listTicket) throw new Error("plate");
      return castTx(role.chain, {
        from: from,
        to: role.contract,
        data: SEL.list + pad(role.id) + word
      }).then(function (hash) {
        return settled(role.chain, hash);
      });
    }).then(function () {
      listConfirm.setAttribute("aria-pressed", "false");
      closeList();
      setNote("listed");
      if (index === role.id) {
        readRole(role.chain, role.contract, role.id, ticket);
        readAsk(role.chain, role.contract, role.id, ticket);
      }
    }).catch(function (err) {
      listConfirm.setAttribute("aria-pressed", "false");
      noteWhy(err);
    });
  }

  /* The vault sends the print home. The field already holds the title. */
  function onReturn() {
    var role, raw, check, dest, from, mine;
    if (!plateRole || returnBtn.hidden || returnRow.hidden) return;
    if (returnConfirm.getAttribute("aria-pressed") === "true") return;
    if (!window.ethereum && !isFour(plateRole.contract)) {
      window.location.assign(DOOR);
      return;
    }
    raw = returnField.value.trim();
    check = Plate.checksumState(raw);
    dest = check === "ok" && Plate.parseAddress(raw) ? checksum(raw) : "";
    if (!dest || !sameAddr(dest, plateRole.title) || sameAddr(dest, plateRole.contract)) {
      setNote("bad address");
      return;
    }
    mine = returnTicket;
    role = {
      chain: plateRole.chain,
      contract: plateRole.contract,
      id: plateRole.id,
      title: plateRole.title,
      owner: plateRole.owner
    };
    returnConfirm.setAttribute("aria-pressed", "true");
    keyFrom(role.contract).then(function (accounts) {
      from = accounts && accounts[0] ? accounts[0] : "";
      setWallet(from);
      paintDoor();
      if (mine !== returnTicket) throw new Error("plate");
      if (!from || !sameAddr(from, role.owner) || sameAddr(from, role.title)) throw new Error("key");
      return Promise.all([
        call(role.chain, role.contract, SEL.ownerOf, role.id),
        call(role.chain, role.contract, SEL.titleHolder, role.id)
      ]);
    }).then(function (parts) {
      var owner = addressOf(parts[0]);
      var title = addressOf(parts[1]);
      if (mine !== returnTicket) throw new Error("plate");
      if (!sameAddr(owner, from) || !sameAddr(title, role.title) || !sameAddr(dest, title)) throw new Error("title");
      if (mine !== returnTicket) throw new Error("plate");
      return castTx(role.chain, {
        from: from,
        to: role.contract,
        data: SEL.transferFrom + padAddr(from) + padAddr(title) + pad(role.id)
      }).then(function (hash) {
        return settled(role.chain, hash);
      });
    }).then(function () {
      returnConfirm.setAttribute("aria-pressed", "false");
      closeReturn();
      setNote("");
      if (index === role.id) {
        readRole(role.chain, role.contract, role.id, ticket);
        readAsk(role.chain, role.contract, role.id, ticket);
      }
      readHeld();
    }).catch(function (err) {
      returnConfirm.setAttribute("aria-pressed", "false");
      noteWhy(err);
    });
  }

  returnBtn.addEventListener("click", function () {
    var open;
    if (returnBtn.hidden || !plateRole) return;
    open = returnBtn.getAttribute("aria-pressed") !== "true";
    if (!open) {
      closeReturn();
      return;
    }
    closeVault();
    closeList();
    returnBtn.setAttribute("aria-pressed", "true");
    returnField.value = plateRole.title || "";
    returnRow.hidden = false;
    returnField.focus();
  });
  returnConfirm.addEventListener("click", onReturn);
  returnField.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onReturn();
  });

  listBtn.addEventListener("click", function () {
    var open;
    if (listBtn.hidden) return;
    open = listBtn.getAttribute("aria-pressed") !== "true";
    if (!open) {
      closeList();
      return;
    }
    closeVault();
    closeReturn();
    listBtn.setAttribute("aria-pressed", "true");
    listRow.hidden = false;
    listPrice.value = "";
    listPrice.focus();
  });
  listConfirm.addEventListener("click", onListConfirm);
  listPrice.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onListConfirm();
  });
  vaultField.addEventListener("input", function () {
    vaultSure = "";
    if (note.textContent.indexOf("a wrong vault is permanent") !== -1) setNote("");
  });
  vaultField.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onConfirm();
  });

  searchBtn.addEventListener("click", function () {
    if (!field.hidden) {
      closeSearch();
      if (lit === "search") mark("live");
      return;
    }
    walkTicket += 1;
    setNote("");
    lit = "search";
    listedOn = false;
    heldOn = false;
    liveBtn.setAttribute("aria-pressed", "false");
    datedBtn.setAttribute("aria-pressed", "false");
    listedBtn.setAttribute("aria-pressed", "false");
    heldBtn.setAttribute("aria-pressed", "false");
    searchBtn.setAttribute("aria-pressed", "true");
    if (mode === "dated") {
      setPaint("open");
      if (heldBytes) arm(heldBytes, heldNonce, heldPace);
    }
    field.hidden = false;
    field.value = shownKey || EXAMPLE;
    field.focus();
    field.select();
    arrows();
    placeRows();
  });

  prevBtn.addEventListener("click", function () { step(-1); });
  nextBtn.addEventListener("click", function () { step(1); });

  [wId, wPal, wNonce, wWater, wPrice].forEach(function (el) {
    el.addEventListener("click", function (event) {
      event.stopPropagation();
      showWhisperName(el);
    });
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

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (timer) clearTimeout(timer);
      timer = null;
      if (crawlMs && crawlDue) crawlPaused = true;
      return;
    }
    reachCrawl();
  });
  function watchKey() {
    var eth = window.ethereum;
    if (!eth || !eth.on) return;
    eth.on("accountsChanged", function (accounts) {
      var next = accounts && accounts[0];
      if (!next) {
        if (!walletKey && !doorIsOff()) pullGranted();
        return;
      }
      if (doorIsOff() && !walletKey) return;
      adoptKey(next);
    });
  }

  connectBtn.addEventListener("click", function () {
    if (walletKey) disconnectKey();
    else connectKey();
  });

  window.addEventListener("resize", fit);
  fit();
  boot();
  watchKey();
})();
