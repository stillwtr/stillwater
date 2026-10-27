/* Builds one hall proof from snapshot/hall-walkers.txt. The contract root is the lock. */
importScripts("keccak256.js");

var ROOT = "0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3";
var addrs = [];
var layers = [];

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

function build(text, root) {
  var level;
  var next;
  var i;
  var lock = (root || ROOT).toLowerCase();
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
  if (("0x" + hexOf(level[0])) !== lock) throw new Error("root");
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
  var L;
  var sibling;
  for (L = 0; L < layers.length - 1; L++) {
    sibling = idx ^ 1;
    if (sibling < layers[L].length) proof.push("0x" + hexOf(layers[L][sibling]));
    idx = Math.floor(idx / 2);
  }
  return proof;
}

var started = false;
var queued = null;

function reply(data) {
  var addr = String((data && data.addr) || "").toLowerCase();
  var index;
  if (!data || data.id == null) return;
  if (!/^0x[0-9a-f]{40}$/.test(addr)) return;
  index = findIndex(addr);
  if (index < 0) postMessage({ id: data.id, addr: addr, miss: true });
  else postMessage({ id: data.id, addr: addr, proof: proofAt(index) });
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
  fetch("../snapshot/hall-walkers.txt").then(function (res) {
    if (!res.ok) throw new Error("missing");
    return res.text();
  }).then(function (text) {
    begin(text, root);
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
