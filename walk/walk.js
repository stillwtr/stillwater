(function () {
  var curve = document.getElementById("curve");
  var state = document.getElementById("state");
  var row = document.getElementById("row");
  var mode = "open";
  var paceNote = document.getElementById("pace");
  var modes = ["open", "dated", "tonight"];
  var RPCS = ["https://ethereum-rpc.publicnode.com", "https://eth.drpc.org"];
  var PROBE = "0xd934cc70b1b06256581527a534285f5bd6a7edc7";
  var DEMO_NONCE = 4096;

  function addrOf(n) {
    var b = new Uint8Array(20);
    var v = n;
    var i;
    for (i = 19; i >= 16; i--) {
      b[i] = v & 255;
      v = Math.floor(v / 256);
    }
    return b;
  }

  function findFamily(fam) {
    var n = 1;
    var bytes;
    while (n < 100000) {
      bytes = addrOf(n);
      if (Plate.derive(bytes).palette === fam) return bytes;
      n += 1;
    }
    return addrOf(1);
  }

  function percent(grid) {
    var tenths = Math.trunc(Plate.countWater(grid) * 1000 / (Plate.N * Plate.N));
    return (tenths / 10).toFixed(1) + "%";
  }

  function demoCaption(bytes, label) {
    return Plate.PALETTES[Plate.derive(bytes).palette].name + " · " + label;
  }

  function chrome(text) {
    var s = text.trim();
    if (s.slice(0, 2) === "0x" || s.slice(0, 2) === "0X") s = s.slice(2);
    if (s.length < 10) return "";
    return "0x" + s.slice(0, 6) + "…" + s.slice(s.length - 4);
  }

  function liveCaption(bytes, nonce, shown) {
    var name = Plate.PALETTES[Plate.derive(bytes).palette].name;
    var grid = Plate.indices(bytes, nonce, 0);
    var line = name + " · " + nonce + " · s" + Plate.swallowRows(nonce) + " · " + percent(grid);
    if (!shown) return line;
    return chrome(shown) + "\n" + line;
  }

  function pulseSeconds(bytes) {
    var hash = PlateKeccak.keccak256(bytes);
    var n = 0;
    var i;
    for (i = 0; i < 4; i++) n = (n * 256) + hash[i];
    return 6 + (n % 7);
  }

  function tryOnchainNonce() {
    return null;
  }

  function readNonce(addressText, blockTag, i) {
    var onchain = tryOnchainNonce(addressText, blockTag);
    if (onchain !== null && onchain !== undefined) return Promise.resolve(onchain);
    return tryRpc(addressText, i || 0, blockTag || "latest");
  }

  var probeBytes = Plate.parseAddress(PROBE);
  var curveNonce = [64, 256, 1024, 4096, 16384];
  var curveBits = [];
  var ci;
  for (ci = 0; ci < curveNonce.length; ci++) {
    var cn = curveNonce[ci];
    curveBits.push(cn + " s" + Plate.swallowRows(cn) + " " + percent(Plate.indices(probeBytes, cn, 0)));
  }
  curve.textContent = curveBits.join(" · ");

  var forcedRow = document.getElementById("forced");
  var forcedNonce = [1, 256, 4096];

  function makeSlot(placeholder) {
    var fig = document.createElement("figure");
    var input = document.createElement("input");
    var canvas = document.createElement("canvas");
    var cap = document.createElement("figcaption");
    var forced = [];
    var f;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = placeholder;
    canvas.width = 128;
    canvas.height = 128;
    fig.appendChild(input);
    fig.appendChild(canvas);
    fig.appendChild(cap);
    row.appendChild(fig);
    for (f = 0; f < forcedNonce.length; f++) {
      var small = document.createElement("figure");
      var smallCanvas = document.createElement("canvas");
      var smallCap = document.createElement("figcaption");
      smallCanvas.width = 128;
      smallCanvas.height = 128;
      small.appendChild(smallCanvas);
      small.appendChild(smallCap);
      forcedRow.appendChild(small);
      forced.push({ n: forcedNonce[f], canvas: smallCanvas, cap: smallCap });
    }
    return { input: input, canvas: canvas, cap: cap, text: "", nonce: null, req: 0, forced: forced };
  }

  var slots = [
    makeSlot(PROBE),
    makeSlot("DEMO-2"),
    makeSlot("DEMO-3")
  ];
  var demos = [
    null,
    { bytes: findFamily(1), label: "DEMO-2" },
    { bytes: findFamily(2), label: "DEMO-3" }
  ];

  function rpcCount(url, addressText, blockTag) {
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionCount",
        params: [addressText, blockTag || "latest"]
      })
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (body) {
      if (!body || typeof body.result !== "string" || body.error) throw new Error("no result");
      var n = parseInt(body.result, 16);
      if (!(n >= 0)) throw new Error("bad result");
      return n;
    });
  }

  function tryRpc(addressText, i, blockTag) {
    if (i >= RPCS.length) return Promise.reject(new Error("FAIL-RPC"));
    return rpcCount(RPCS[i], addressText, blockTag).catch(function () {
      return tryRpc(addressText, i + 1, blockTag);
    });
  }

  function clearCanvas(canvas) {
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function clearSlot(slot) {
    clearCanvas(slot.canvas);
  }

  function clearForced(slot) {
    var f;
    for (f = 0; f < slot.forced.length; f++) {
      clearCanvas(slot.forced[f].canvas);
      slot.forced[f].cap.textContent = "";
    }
  }

  function paintForced(slot, bytes) {
    var f, grid;
    for (f = 0; f < slot.forced.length; f++) {
      grid = Plate.indices(bytes, slot.forced[f].n, 0);
      slot.forced[f].cap.textContent = "FORCED " + slot.forced[f].n + " · " + percent(grid);
      Plate.paint(slot.forced[f].canvas, bytes, slot.forced[f].n, 0);
    }
  }

  function paintSlot(slot, bytes, nonce) {
    if (mode !== "dated") Plate.paint(slot.canvas, bytes, nonce, slot.phase || 0);
  }

  function disarm(slot) {
    if (slot.timer) clearInterval(slot.timer);
    slot.timer = null;
    slot.phase = 0;
  }

  function armSlot(slot, bytes) {
    var ms = pulseSeconds(bytes) * 1000;
    if (slot.timer && slot.pulseMs === ms && Plate.crawls(mode)) return;
    disarm(slot);
    if (!bytes || !Plate.crawls(mode)) return;
    slot.pulseMs = ms;
    slot.liveBytes = bytes;
    slot.timer = setInterval(function () {
      if (!Plate.crawls(mode) || slot.nonce === null) return;
      slot.phase = (slot.phase + 1) & 31;
      Plate.paint(slot.canvas, bytes, slot.nonce, slot.phase);
    }, ms);
    if (paceNote) {
      var parts = [];
      var s;
      for (s = 0; s < slots.length; s++) {
        if (slots[s].liveBytes) parts.push(pulseSeconds(slots[s].liveBytes) + "s");
      }
      paceNote.textContent = parts.join(" · ");
    }
  }

  function showDemo(slot, demo) {
    slot.nonce = DEMO_NONCE;
    slot.text = "";
    slot.cap.textContent = demoCaption(demo.bytes, demo.label);
    slot.liveBytes = demo.bytes;
    if (mode !== "dated") paintSlot(slot, demo.bytes, DEMO_NONCE);
    paintForced(slot, demo.bytes);
    armSlot(slot, demo.bytes);
  }

  function fieldError(slot, msg) {
    slot.text = "";
    slot.nonce = null;
    slot.cap.textContent = msg;
    clearSlot(slot);
    clearForced(slot);
  }

  function drawSlot(slot, index) {
    var raw = slot.input.value.trim();
    if (mode === "dated") {
      disarm(slot);
      slot.phase = 0;
      if (slot.datedBy && slot.datedBlock) {
        readNonce(slot.datedBy, slot.datedBlock).then(function (nonce) {
          if (mode !== "dated") return;
          slot.cap.textContent = liveCaption(Plate.parseAddress(slot.datedBy), nonce, slot.datedBy);
          Plate.paint(slot.canvas, Plate.parseAddress(slot.datedBy), nonce, 0);
        }).catch(function () {
          slot.cap.textContent = "datedBlock";
          clearSlot(slot);
        });
        return;
      }
      slot.cap.textContent = "datedBlock";
      clearSlot(slot);
      return;
    }
    if (!raw) {
      if (index === 0) {
        if (slot.text === PROBE && slot.nonce !== null) {
          slot.cap.textContent = liveCaption(probeBytes, slot.nonce, PROBE);
          paintSlot(slot, probeBytes, slot.nonce);
          paintForced(slot, probeBytes);
          armSlot(slot, probeBytes);
          return;
        }
        var id0 = ++slot.req;
        readNonce(PROBE, "latest", 0).then(function (nonce) {
          if (id0 !== slot.req || slot.input.value.trim()) return;
          slot.text = PROBE;
          slot.nonce = nonce;
          slot.liveBytes = probeBytes;
          slot.cap.textContent = liveCaption(probeBytes, nonce, PROBE);
          paintSlot(slot, probeBytes, slot.nonce);
          paintForced(slot, probeBytes);
          armSlot(slot, probeBytes);
        }).catch(function () {
          if (id0 !== slot.req) return;
          fieldError(slot, "FAIL-RPC");
        });
        return;
      }
      showDemo(slot, demos[index]);
      return;
    }
    var check = Plate.checksumState(raw);
    if (check === "checksum") {
      fieldError(slot, "checksum");
      return;
    }
    var addr = Plate.parseAddress(raw);
    if (!addr || check !== "ok") {
      fieldError(slot, "That address does not parse.");
      return;
    }
    if (slot.text === raw && slot.nonce !== null) {
      slot.cap.textContent = liveCaption(addr, slot.nonce, raw);
      paintSlot(slot, addr, slot.nonce);
      paintForced(slot, addr);
      armSlot(slot, addr);
      return;
    }
    var id = ++slot.req;
    readNonce(raw, "latest", 0).then(function (nonce) {
      if (id !== slot.req || slot.input.value.trim() !== raw) return;
      slot.text = raw;
      slot.nonce = nonce;
      slot.liveBytes = addr;
      console.log("walk nonce " + nonce + " for " + raw);
      slot.cap.textContent = liveCaption(addr, nonce, raw);
      paintSlot(slot, addr, slot.nonce);
      paintForced(slot, addr);
      armSlot(slot, addr);
    }).catch(function () {
      if (id !== slot.req) return;
      fieldError(slot, "FAIL-RPC");
    });
  }

  function draw() {
    var i;
    if (mode === "dated") {
      for (i = 0; i < slots.length; i++) disarm(slots[i]);
    }
    for (i = 0; i < slots.length; i++) drawSlot(slots[i], i);
    state.textContent = mode;
  }

  function arm() {
    var i;
    for (i = 0; i < slots.length; i++) disarm(slots[i]);
    if (!Plate.crawls(mode)) return;
  }

  state.addEventListener("click", function () {
    var i = modes.indexOf(mode);
    mode = modes[(i + 1) % modes.length];
    var s;
    for (s = 0; s < slots.length; s++) {
      slots[s].text = "";
      slots[s].nonce = null;
    }
    arm();
    draw();
  });

  slots.forEach(function (slot) {
    slot.input.addEventListener("input", function () {
      slot.text = "";
      slot.nonce = null;
      slot.req += 1;
      drawSlot(slot, slots.indexOf(slot));
    });
  });

  arm();
  draw();
})();
