/* Builds one hall proof from snapshot/walkers.txt. The contract root is the lock. */
importScripts("keccak256.js");

var ROOT = "0x6cece1d62b58afe3a6f7352024edd36e4a083d0d360d4d844ddd339dd90d6634";
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

function build(text) {
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
  if (("0x" + hexOf(level[0])) !== ROOT) throw new Error("root");
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

fetch("../snapshot/walkers.txt").then(function (res) {
  if (!res.ok) throw new Error("missing");
  return res.text();
}).then(function (text) {
  build(text);
  postMessage({ ready: true });
}).catch(function (err) {
  postMessage({ ready: false, match: !!(err && err.message === "root") });
});

onmessage = function (ev) {
  var addr = String((ev.data && ev.data.addr) || "").toLowerCase();
  var index = findIndex(addr);
  if (index < 0) postMessage({ id: ev.data.id, miss: true });
  else postMessage({ id: ev.data.id, proof: proofAt(index) });
};
