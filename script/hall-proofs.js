/* Rebuild snapshot/hall-proofs.bin from snapshot/hall-walkers.txt.
   node script/hall-proofs.js
   The hall root is not an argument. The file is accepted only when its
   top hash is the root the page reads from the hall. */
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var ROOT = path.join(__dirname, "..");
var LIST = path.join(ROOT, "snapshot", "hall-walkers.txt");
var OUT = path.join(ROOT, "snapshot", "hall-proofs.bin");
var EXPECT = "0x2c80ef0c0a1d75f53ef180ed4fcc4bf30f0836b25e8e69625bceb5f3a0a9a5f3";

function loadKeccak() {
  var ctx = { console: console, Math: Math, Uint8Array: Uint8Array };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "art", "keccak256.js"), "utf8"), ctx);
  return ctx.PlateKeccak;
}

function cmp32(a, b) {
  var i;
  for (i = 0; i < 32; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

function hashPair(K, a, b) {
  var left = cmp32(a, b) < 0 ? a : b;
  var right = left === a ? b : a;
  var buf = new Uint8Array(64);
  buf.set(left, 0);
  buf.set(right, 32);
  return K.keccak256(buf);
}

function leafOf(K, addr) {
  var raw = new Uint8Array(32);
  var hex = addr.slice(2);
  var i;
  for (i = 0; i < 20; i++) raw[12 + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return K.keccak256(K.keccak256(raw));
}

function hexOf(bytes) {
  return Buffer.from(bytes).toString("hex");
}

function main() {
  var K = loadKeccak();
  var addrs = fs.readFileSync(LIST, "utf8").trim().split(/\s+/);
  var i;
  var level;
  var next;
  var layers;
  var width;
  var nodes = [];
  var body;
  var offset;
  var head;
  if (addrs.length < 2) throw new Error("list");
  for (i = 1; i < addrs.length; i++) if (addrs[i] <= addrs[i - 1]) throw new Error("sort");
  level = new Array(addrs.length);
  for (i = 0; i < addrs.length; i++) level[i] = leafOf(K, addrs[i]);
  layers = [level];
  while (level.length > 1) {
    next = [];
    for (i = 0; i < level.length; i += 2) {
      if (i + 1 >= level.length) next.push(level[i]);
      else next.push(hashPair(K, level[i], level[i + 1]));
    }
    level = next;
    layers.push(level);
    for (i = 0; i < level.length; i++) nodes.push(level[i]);
  }
  if (("0x" + hexOf(level[0])) !== EXPECT) throw new Error("root " + hexOf(level[0]));
  head = Buffer.alloc(8);
  head.write("HLW1", 0, "ascii");
  head.writeUInt32LE(addrs.length, 4);
  body = Buffer.alloc(addrs.length * 20);
  for (i = 0; i < addrs.length; i++) body.write(addrs[i].slice(2), i * 20, "hex");
  offset = 0;
  var tree = Buffer.alloc(nodes.length * 32);
  for (i = 0; i < nodes.length; i++) {
    Buffer.from(nodes[i]).copy(tree, offset);
    offset += 32;
  }
  width = 8 + body.length + tree.length;
  fs.writeFileSync(OUT, Buffer.concat([head, body, tree]));
  console.log(JSON.stringify({
    keys: addrs.length,
    inner: nodes.length,
    bytes: width,
    levels: layers.length,
    root: "0x" + hexOf(level[0])
  }));
}

main();
