/* One hall proof. The contract root is the lock.
   The packed file stores the sorted keys and the inner nodes.
   A proof is returned only after it hashes back to that root. */
importScripts("keccak256.js");

var ROOT = "0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3";
var addrs = [];
var layers = [];
var locked = "";

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

function hexOf(bytes) {
  var s = "";
  var i;
  var h;
  for (i = 0; i < bytes.length; i++) {
    h = bytes[i].toString(16);
    s += h.length === 1 ? "0" + h : h;
  }
  return s;
}

function hexTo32(hex) {
  var raw = new Uint8Array(32);
  var i;
  var s = hex.slice(0, 2) === "0x" ? hex.slice(2) : hex;
  for (i = 0; i < 32; i++) raw[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return raw;
}

function nodeAt(level, index) {
  if (!layers[0] && level === 0) return leafOf(addrs[index]);
  return layers[level][index];
}

function lockTo(root) {
  var top = layers[layers.length - 1][0];
  locked = (root || ROOT).toLowerCase();
  if (("0x" + hexOf(top)) !== locked) throw new Error("root");
}

function build(text, root) {
  var level;
  var next;
  var i;
  addrs = text.trim().split(/\s+/);
  level = new Array(addrs.length);
  for (i = 0; i < addrs.length; i++) level[i] = leafOf(addrs[i]);
  layers = [level];
  while (level.length > 1) {
    next = [];
    for (i = 0; i < level.length; i += 2) {
      if (i + 1 >= level.length) next.push(level[i]);
      else next.push(hashPair(level[i], level[i + 1]));
    }
    level = next;
    layers.push(level);
  }
  lockTo(root);
}

function beginPacked(buffer, root) {
  var bytes = new Uint8Array(buffer);
  var view = new DataView(buffer);
  var n;
  var i;
  var j;
  var h;
  var offset;
  var width;
  var sizes;
  var level;
  var need;
  if (bytes.length < 8) throw new Error("missing");
  if (bytes[0] !== 72 || bytes[1] !== 76 || bytes[2] !== 87 || bytes[3] !== 49) throw new Error("missing");
  n = view.getUint32(4, true);
  if (n < 2) throw new Error("missing");
  sizes = [];
  width = n;
  while (width > 1) {
    width = (width + 1) >> 1;
    sizes.push(width);
  }
  need = 8 + n * 20;
  for (i = 0; i < sizes.length; i++) need += sizes[i] * 32;
  if (bytes.length !== need) throw new Error("missing");
  addrs = new Array(n);
  for (i = 0; i < n; i++) {
    h = "0x";
    for (j = 0; j < 20; j++) {
      h += ("0" + bytes[8 + i * 20 + j].toString(16)).slice(-2);
    }
    addrs[i] = h;
  }
  offset = 8 + n * 20;
  layers = [null];
  for (i = 0; i < sizes.length; i++) {
    level = new Array(sizes[i]);
    for (j = 0; j < sizes[i]; j++) {
      level[j] = bytes.subarray(offset, offset + 32);
      offset += 32;
    }
    layers.push(level);
  }
  lockTo(root);
}

function findIndex(addr) {
  var lo = 0;
  var hi = addrs.length - 1;
  var mid;
  while (lo <= hi) {
    mid = (lo + hi) >> 1;
    if (addrs[mid] === addr) return mid;
    if (addrs[mid] < addr) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

function proofAt(index) {
  var proof = [];
  var idx = index;
  var width = addrs.length;
  var L = 0;
  var sibling;
  while (width > 1) {
    sibling = idx ^ 1;
    if (sibling < width) proof.push("0x" + hexOf(nodeAt(L, sibling)));
    idx = idx >> 1;
    width = (width + 1) >> 1;
    L++;
  }
  return proof;
}

function checkedProof(index, addr) {
  var proof = proofAt(index);
  var h = leafOf(addr);
  var i;
  for (i = 0; i < proof.length; i++) h = hashPair(h, hexTo32(proof[i]));
  if (("0x" + hexOf(h)) !== locked) throw new Error("root");
  return proof;
}

var started = false;
var queued = null;

function reply(data) {
  var addr = String((data && data.addr) || "").toLowerCase();
  var index;
  var proof;
  if (!data || data.id == null) return;
  if (!/^0x[0-9a-f]{40}$/.test(addr)) return;
  index = findIndex(addr);
  if (index < 0) {
    postMessage({ id: data.id, addr: addr, miss: true });
    return;
  }
  try {
    proof = checkedProof(index, addr);
  } catch (err) {
    postMessage({ id: data.id, addr: addr, miss: true });
    return;
  }
  postMessage({ id: data.id, addr: addr, proof: proof });
}

function finish(err) {
  if (!err) {
    postMessage({ ready: true });
    if (queued) {
      var job = queued;
      queued = null;
      reply(job);
    }
    return;
  }
  postMessage({ ready: false, match: !!(err && err.message === "root") });
}

function begin(text, root) {
  if (started) return;
  started = true;
  try {
    build(text, root);
    finish(null);
  } catch (err) {
    finish(err);
  }
}

function loadFile(root) {
  if (started) return;
  fetch("../snapshot/hall-proofs.bin").then(function (res) {
    if (!res.ok) throw new Error("missing");
    return res.arrayBuffer();
  }).then(function (buffer) {
    if (started) return;
    started = true;
    try {
      beginPacked(buffer, root);
      finish(null);
    } catch (err) {
      finish(err);
    }
  }).catch(function (err) {
    if (started) return;
    started = true;
    finish(err);
  });
}

onmessage = function (ev) {
  var data = ev.data || {};
  if (data.start) {
    if (data.list) begin(String(data.list), data.root);
    else loadFile(data.root);
    return;
  }
  /* The list is still loading. Hold the key. Do not call it a miss. */
  if (!layers.length) {
    queued = data;
    return;
  }
  reply(data);
};
