/* node art/selfcheck.js
   Checks the hash, the swallow steps, and that two nonces which share a
   swallow draw the same plate. */
var fs = require("fs");
var vm = require("vm");
var path = require("path");

var dir = __dirname;
var ctx = { console: console, Math: Math, Uint8Array: Uint8Array };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, "keccak256.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(dir, "palettes.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(dir, "render.js"), "utf8"), ctx);

var keccak = ctx.PlateKeccak.keccak256;
var Plate = ctx.Plate;

function hex(u) {
  var s = "";
  for (var i = 0; i < u.length; i++) s += u[i].toString(16).padStart(2, "0");
  return s;
}

function same(a, b) {
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function fail(msg) {
  console.error("FAIL " + msg);
  process.exit(1);
}

var empty = hex(keccak(new Uint8Array()));
if (empty !== "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470") {
  fail("keccak empty");
}
var abc = hex(keccak(Buffer.from("abc")));
if (abc !== "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45") {
  fail("keccak abc");
}

if (Plate.floorLog2(1) !== 0) fail("log2 1");
if (Plate.swallowRows(0) !== 0) fail("swallow 0");
if (Plate.swallowRows(1) !== 1) fail("swallow 1");
if (Plate.swallowRows(2) !== 1) fail("swallow 2");
if (Plate.swallowRows(256) !== 8) fail("swallow 256 is " + Plate.swallowRows(256));
if (Plate.swallowRows(1000000) !== 19) fail("swallow whale is " + Plate.swallowRows(1000000));

var addr = Plate.parseAddress("0x0000000000000000000000000000000000000001");
if (!addr) fail("parse");
if (Plate.parseAddress("nope")) fail("bad parse should be null");
if (!Plate.parseAddress("0x0000000000000000000000000000000000000001 ")) fail("trim");
if (Plate.parseAddress("0x1234")) fail("short");

var p = Plate.derive(addr);
if (p.palette < 0 || p.palette > 2) fail("palette");
if (p.heading < 0 || p.heading > 7) fail("heading");
var a1 = Plate.indices(addr, 1);
var aLoud = Plate.indices(addr, 4096);
if (a1.length !== Plate.N * Plate.N) fail("frame");
if (same(a1, aLoud)) fail("nonce 1 and 4096 should differ");
console.log("ok palette=" + Plate.PALETTES[p.palette].name + " heading=" + p.heading);
