/* node art/make-plates.js
   Finds six addresses whose keccak seeds land on the three palettes
   and a clear left or right lean, then writes art/plates.json and art/plates.js. */
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
var Plate = ctx.Plate;

var found = {};
var i;
for (i = 1; i < 500000 && Object.keys(found).length < 6; i++) {
  var bytes = new Uint8Array(20);
  bytes[16] = (i >>> 24) & 255;
  bytes[17] = (i >>> 16) & 255;
  bytes[18] = (i >>> 8) & 255;
  bytes[19] = i & 255;
  var p = Plate.derive(bytes);
  var side = p.lean <= -4 ? "left" : p.lean >= 4 ? "right" : "";
  if (!side) continue;
  var key = p.palette + "-" + side;
  if (found[key]) continue;
  found[key] = {
    address: Plate.bytesToHex(bytes),
    palette: Plate.PALETTES[p.palette].name,
    paletteIndex: p.palette,
    lean: p.lean,
    side: side
  };
}
if (Object.keys(found).length !== 6) {
  console.error("only found " + Object.keys(found).length);
  process.exit(1);
}

var nonces = [1, 64, 4096];
var plates = [];
var pal;
for (pal = 0; pal < 3; pal++) {
  ["left", "right"].forEach(function (side) {
    var src = found[pal + "-" + side];
    nonces.forEach(function (nonce) {
      plates.push({
        address: src.address,
        palette: src.palette,
        lean: src.lean,
        side: src.side,
        nonce: nonce
      });
    });
  });
}
var needlesLeft = found["0-left"];
[0, 1000000].forEach(function (nonce) {
  plates.push({
    address: needlesLeft.address,
    palette: needlesLeft.palette,
    lean: needlesLeft.lean,
    side: needlesLeft.side,
    nonce: nonce
  });
});

if (plates.length !== 20) {
  console.error("count " + plates.length);
  process.exit(1);
}

fs.writeFileSync(path.join(dir, "plates.json"), JSON.stringify(plates, null, 2) + "\n");
var js = "(function (g) {\n  g.PLATES = " + JSON.stringify(plates) + ";\n})(typeof globalThis !== \"undefined\" ? globalThis : this);\n";
fs.writeFileSync(path.join(dir, "plates.js"), js);
console.log("wrote 20 plates");
