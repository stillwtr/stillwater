/* node art/gate.js
   Prints PASS, or FAIL and the first broken law. */
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var dir = __dirname;
var ctx = { console: console, Math: Math, Uint8Array: Uint8Array };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, "keccak256.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(dir, "palettes.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(dir, "render.js"), "utf8"), ctx);
var Plate = ctx.Plate;

function fail(msg) {
  console.log("FAIL " + msg);
  process.exit(1);
}

function waterBits(grid) {
  var b = new Uint8Array(grid.length);
  var i;
  for (i = 0; i < grid.length; i++) if (grid[i] <= 1) b[i] = 1;
  return b;
}

function rot90(bits) {
  var o = new Uint8Array(bits.length);
  var y, x;
  for (y = 0; y < 128; y++) {
    for (x = 0; x < 128; x++) o[x * 128 + (127 - y)] = bits[y * 128 + x];
  }
  return o;
}

function sameBits(a, b) {
  var i;
  for (i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function evenSectors(grid, ox, oy) {
  var bins = [0, 0, 0, 0, 0, 0, 0, 0];
  var y, x, i, dx, dy, ax, ay, sec, n, lo, hi;
  for (i = 0; i < grid.length; i++) {
    if (grid[i] > 2) continue;
    y = Math.floor(i / 128);
    x = i - y * 128;
    dx = x - ox;
    dy = y - oy;
    if (dx === 0 && dy === 0) continue;
    ax = dx < 0 ? -dx : dx;
    ay = dy < 0 ? -dy : dy;
    if (dx >= 0 && dy < 0 && ax >= ay) sec = 0;
    else if (dx >= 0 && dy < 0) sec = 1;
    else if (dx >= 0 && dy >= 0 && ax < ay) sec = 2;
    else if (dx >= 0 && dy >= 0) sec = 3;
    else if (dx < 0 && dy >= 0 && ax >= ay) sec = 4;
    else if (dx < 0 && dy >= 0) sec = 5;
    else if (dx < 0 && dy < 0 && ax < ay) sec = 6;
    else sec = 7;
    bins[sec]++;
  }
  lo = bins[0];
  hi = bins[0];
  for (n = 1; n < 8; n++) {
    if (bins[n] < lo) lo = bins[n];
    if (bins[n] > hi) hi = bins[n];
  }
  if (lo === 0) return false;
  return hi * 5 <= lo * 6;
}

function maxDist(bits, ox, oy) {
  var best = 0;
  var i, y, x, dx, dy, r;
  for (i = 0; i < bits.length; i++) {
    if (!bits[i]) continue;
    y = Math.floor(i / 128);
    x = i - y * 128;
    dx = x - ox;
    dy = y - oy;
    r = 0;
    var v = dx * dx + dy * dy;
    while ((r + 1) * (r + 1) <= v) r++;
    if (r > best) best = r;
  }
  return best;
}

function dilateToCount(bits, target) {
  var w = new Uint8Array(bits);
  var count = 0;
  var i, y, x, guard, add, n;
  for (i = 0; i < w.length; i++) if (w[i]) count++;
  guard = 0;
  while (count < target && guard < 48) {
    add = [];
    for (y = 0; y < 128; y++) {
      for (x = 0; x < 128; x++) {
        i = y * 128 + x;
        if (w[i]) continue;
        if ((y > 0 && w[i - 128]) || (y + 1 < 128 && w[i + 128]) || (x > 0 && w[i - 1]) || (x + 1 < 128 && w[i + 1])) {
          add.push(i);
        }
      }
    }
    if (!add.length) break;
    for (n = 0; n < add.length && count < target; n++) {
      w[add[n]] = 1;
      count++;
    }
    guard++;
  }
  return w;
}

function bulk(grid) {
  var sum = 0;
  var n = 0;
  var i, y, x, dy, dx, yy, xx, c;
  for (i = 0; i < grid.length; i++) {
    if (grid[i] > 2) continue;
    y = Math.floor(i / 128);
    x = i - y * 128;
    c = 0;
    for (dy = -3; dy <= 3; dy++) {
      for (dx = -3; dx <= 3; dx++) {
        yy = y + dy;
        xx = x + dx;
        if (yy < 0 || xx < 0 || yy > 127 || xx > 127) continue;
        if (grid[yy * 128 + xx] <= 2) c++;
      }
    }
    sum += c;
    n++;
  }
  if (!n) return 0;
  return sum / n;
}

function outlineSolid(grid) {
  var ring = 0;
  var slush = 0;
  var i, y, x, touch;
  for (i = 0; i < grid.length; i++) {
    if (grid[i] <= 2) continue;
    y = Math.floor(i / 128);
    x = i - y * 128;
    touch = false;
    if (y > 0 && grid[i - 128] <= 2) touch = true;
    else if (y + 1 < 128 && grid[i + 128] <= 2) touch = true;
    else if (x > 0 && grid[i - 1] <= 2) touch = true;
    else if (x + 1 < 128 && grid[i + 1] <= 2) touch = true;
    if (!touch) continue;
    ring++;
    if (grid[i] >= 3 && grid[i] <= 5) slush++;
  }
  if (!ring) return 1;
  return slush / ring;
}

function sausage(grid) {
  var seen = new Uint8Array(grid.length);
  var q = [];
  var i, y, x, head, k, nx, ny, j, n, neigh, skinny, size, total, biggest, bi;
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var sizes = [];
  var skinnies = [];
  total = 0;
  for (i = 0; i < grid.length; i++) {
    if (grid[i] > 1 || seen[i]) continue;
    q.length = 0;
    q.push(i);
    seen[i] = 1;
    head = 0;
    size = 0;
    skinny = 0;
    while (head < q.length) {
      j = q[head++];
      size++;
      y = Math.floor(j / 128);
      x = j - y * 128;
      neigh = 0;
      for (k = 0; k < 4; k++) {
        nx = x + dirs[k][0];
        ny = y + dirs[k][1];
        if (nx < 0 || ny < 0 || nx > 127 || ny > 127) continue;
        n = ny * 128 + nx;
        if (grid[n] > 1) continue;
        neigh++;
        if (!seen[n]) {
          seen[n] = 1;
          q.push(n);
        }
      }
      if (neigh <= 2) skinny++;
    }
    sizes.push(size);
    skinnies.push(skinny);
    total += size;
  }
  if (!sizes.length || total < 80) return false;
  biggest = 0;
  for (bi = 1; bi < sizes.length; bi++) if (sizes[bi] > sizes[biggest]) biggest = bi;
  if (sizes.length !== 1) return false;
  return skinnies[biggest] / sizes[biggest] > 0.5;
}

function basins(grid) {
  var seen = new Uint8Array(grid.length);
  var q = [];
  var i, head, k, y, x, nx, ny, n, j, size, count, total, largest, pepper;
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  count = 0;
  total = 0;
  largest = 0;
  pepper = 0;
  for (i = 0; i < grid.length; i++) {
    if (grid[i] > 1 || seen[i]) continue;
    q.length = 0;
    q.push(i);
    seen[i] = 1;
    head = 0;
    size = 0;
    while (head < q.length) {
      n = q[head++];
      size++;
      y = Math.floor(n / 128);
      x = n - y * 128;
      for (k = 0; k < 4; k++) {
        nx = x + dirs[k][0];
        ny = y + dirs[k][1];
        if (nx < 0 || ny < 0 || nx > 127 || ny > 127) continue;
        j = ny * 128 + nx;
        if (grid[j] > 1 || seen[j]) continue;
        seen[j] = 1;
        q.push(j);
      }
    }
    count++;
    total += size;
    if (size > largest) largest = size;
    if (size < 24) pepper++;
  }
  return { count: count, total: total, largest: largest, pepper: pepper };
}

function klass(step) {
  if (step <= 1) return 0;
  if (step <= 5) return 1;
  return 2;
}

function combRows(grid) {
  var rows = 0;
  var y, x, run, i, step, u, up, dn, thin, seen;
  for (y = 0; y < 128; y++) {
    run = 1;
    var hit = false;
    for (x = 1; x < 128; x++) {
      i = y * 128 + x;
      if (grid[i] === grid[i - 1]) run++;
      else run = 1;
      if (run < 8) continue;
      step = grid[i];
      thin = 0;
      seen = 0;
      for (u = x - 7; u <= x; u++) {
        seen++;
        up = y > 0 ? grid[(y - 1) * 128 + u] : -1;
        dn = y < 127 ? grid[(y + 1) * 128 + u] : -1;
        if (klass(up) !== klass(step) && klass(dn) !== klass(step)) thin++;
      }
      if (thin * 2 > seen) hit = true;
    }
    if (hit) rows++;
  }
  return rows;
}

function flatWater(grid) {
  var n = 0;
  var c0 = 0;
  var c1 = 0;
  var i, top;
  for (i = 0; i < grid.length; i++) {
    if (grid[i] > 1) continue;
    n++;
    if (grid[i] === 0) c0++;
    else c1++;
  }
  if (n < 40) return false;
  top = c0 > c1 ? c0 : c1;
  return top * 5 > n * 4;
}

function wellMark(grid) {
  var seen = new Uint8Array(grid.length);
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var best = [];
  var i, head, n, y, x, k, nx, ny, j, q, comp, water;
  water = 0;
  for (i = 0; i < grid.length; i++) if (grid[i] <= 1) water++;
  if (water < 80) return "";
  for (i = 0; i < grid.length; i++) {
    if (grid[i] !== 0 || seen[i]) continue;
    q = [i];
    seen[i] = 1;
    comp = [i];
    for (head = 0; head < q.length; head++) {
      n = q[head];
      y = Math.floor(n / 128);
      x = n - y * 128;
      for (k = 0; k < 4; k++) {
        nx = x + dirs[k][0];
        ny = y + dirs[k][1];
        if (nx < 0 || ny < 0 || nx > 127 || ny > 127) continue;
        j = ny * 128 + nx;
        if (grid[j] !== 0 || seen[j]) continue;
        seen[j] = 1;
        q.push(j);
        comp.push(j);
      }
    }
    if (comp.length > best.length) best = comp;
  }
  if (!best.length) return "";
  var minx = 128;
  var miny = 128;
  var maxx = -1;
  var maxy = -1;
  var onCross = 0;
  var onDiag = 0;
  for (i = 0; i < best.length; i++) {
    y = Math.floor(best[i] / 128);
    x = best[i] - y * 128;
    if (x < minx) minx = x;
    if (y < miny) miny = y;
    if (x > maxx) maxx = x;
    if (y > maxy) maxy = y;
  }
  var w = maxx - minx + 1;
  var h = maxy - miny + 1;
  var midX = minx + Math.floor((w - 1) / 2);
  var midY = miny + Math.floor((h - 1) / 2);
  for (i = 0; i < best.length; i++) {
    y = Math.floor(best[i] / 128);
    x = best[i] - y * 128;
    if (x === midX || y === midY) onCross++;
    if (x - minx === y - miny || (x - minx) + (y - miny) === w - 1) onDiag++;
  }
  if (best.length === 4 && w === 2 && h === 2) return "2x2";
  if (w >= 4 && h >= 4 && w <= h + 1 && h <= w + 1 && best.length * 20 > w * h * 17) return "square";
  if (w >= 5 && h >= 5 && best.length <= w + h + 1 && onCross * 5 > best.length * 4) return "plus";
  if (w >= 5 && h >= 5 && best.length <= w + h + 1 && onDiag * 5 > best.length * 4) return "x";
  return "";
}

function lumaOf(rgb) {
  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
}

function loudSnow() {
  var pi, waterGap, snowGap, a, b, c, d;
  for (pi = 0; pi < Plate.PALETTES.length; pi++) {
    a = lumaOf(Plate.PALETTES[pi].rgb[0]);
    b = lumaOf(Plate.PALETTES[pi].rgb[1]);
    c = lumaOf(Plate.PALETTES[pi].rgb[7]);
    d = lumaOf(Plate.PALETTES[pi].rgb[8]);
    waterGap = a > b ? a - b : b - a;
    snowGap = c > d ? c - d : d - c;
    if (snowGap > waterGap) return true;
  }
  return false;
}

function periodicSnow(grid) {
  var n1 = 0;
  var s1 = 0;
  var n2 = 0;
  var s2 = 0;
  var n4 = 0;
  var s4 = 0;
  var y, x, i;
  for (y = 0; y < 128; y++) {
    for (x = 0; x < 127; x++) {
      i = y * 128 + x;
      if (grid[i] < 7 || grid[i + 1] < 7) continue;
      n1++;
      if (grid[i] === grid[i + 1]) s1++;
      if (x < 126 && grid[i + 2] >= 7) {
        n2++;
        if (grid[i] === grid[i + 2]) s2++;
      }
      if (x < 124 && grid[i + 4] >= 7) {
        n4++;
        if (grid[i] === grid[i + 4]) s4++;
      }
    }
  }
  if (n1 < 400 || n2 < 400 || n4 < 400) return false;
  if (s2 / n2 > s1 / n1 + 0.18) return true;
  if (s4 / n4 > s1 / n1 + 0.18) return true;
  return false;
}

function flipRate(grid, inside) {
  var n = 0;
  var diff = 0;
  var y, x, i;
  for (y = 0; y < 128; y++) {
    for (x = 0; x < 127; x++) {
      i = y * 128 + x;
      if (!inside(grid[i]) || !inside(grid[i + 1])) continue;
      n++;
      if (grid[i] !== grid[i + 1]) diff++;
    }
  }
  if (n < 30) return 0;
  return diff / n;
}

function sootWater(grid) {
  var waterN = 0;
  var i;
  for (i = 0; i < grid.length; i++) if (grid[i] <= 1) waterN++;
  if (waterN < 80) return false;
  var waterFlip = flipRate(grid, function (s) { return s <= 1; });
  var snowFlip = flipRate(grid, function (s) { return s >= 7; });
  return snowFlip > 0 && waterFlip >= snowFlip;
}

function missingWell(grid) {
  var water = 0;
  var dark = 0;
  var i;
  for (i = 0; i < grid.length; i++) {
    if (grid[i] > 1) continue;
    water++;
    if (grid[i] === 0) dark++;
  }
  if (water < 80) return false;
  return dark < 16;
}

function glintShare(grid) {
  var n = 0;
  var i;
  for (i = 0; i < grid.length; i++) if (grid[i] === 9) n++;
  return n / grid.length;
}

function stickerRing(grid) {
  var dist = new Uint8Array(grid.length);
  var q = [];
  var i, head, y, x, k, nx, ny, n, d, slush, near, far;
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (i = 0; i < grid.length; i++) {
    if (grid[i] > 1) continue;
    dist[i] = 1;
    q.push(i);
  }
  head = 0;
  while (head < q.length) {
    i = q[head++];
    d = dist[i];
    if (d >= 12) continue;
    y = Math.floor(i / 128);
    x = i - y * 128;
    for (k = 0; k < 4; k++) {
      nx = x + dirs[k][0];
      ny = y + dirs[k][1];
      if (nx < 0 || ny < 0 || nx > 127 || ny > 127) continue;
      n = ny * 128 + nx;
      if (dist[n]) continue;
      dist[n] = d + 1;
      q.push(n);
    }
  }
  slush = 0;
  near = 0;
  far = 0;
  for (i = 0; i < grid.length; i++) {
    if (grid[i] < 3 || grid[i] > 5) continue;
    slush++;
    if (dist[i] && dist[i] <= 4) near++;
    if (!dist[i] || dist[i] >= 8) far++;
  }
  if (slush < 40) return false;
  if (!(near * 4 > slush * 3 && far * 5 < slush)) return false;
  var water = 0;
  var perim = 0;
  for (i = 0; i < grid.length; i++) {
    if (grid[i] > 1) continue;
    water++;
    y = Math.floor(i / 128);
    x = i - y * 128;
    if (y === 0 || y === 127 || x === 0 || x === 127) perim++;
    else if (grid[i - 1] > 1 || grid[i + 1] > 1 || grid[i - 128] > 1 || grid[i + 128] > 1) perim++;
  }
  if (water < 40) return false;
  return perim * perim < water * 24;
}

function smoothFill(grid) {
  var water = 0;
  var step1 = 0;
  var perim = 0;
  var i, y, x, edge;
  for (i = 0; i < grid.length; i++) {
    if (grid[i] > 1) continue;
    water++;
    if (grid[i] === 1) step1++;
    y = Math.floor(i / 128);
    x = i - y * 128;
    edge = false;
    if (y === 0 || grid[i - 128] > 1) edge = true;
    else if (y === 127 || grid[i + 128] > 1) edge = true;
    else if (x === 0 || grid[i - 1] > 1) edge = true;
    else if (x === 127 || grid[i + 1] > 1) edge = true;
    if (edge) perim++;
  }
  if (water < 40) return false;
  if (step1 * 12 < water && perim * perim < water * 8) return true;
  return false;
}

function rowGrain(grid) {
  var hor = 0;
  var horN = 0;
  var ver = 0;
  var verN = 0;
  var i, y, x;
  for (y = 0; y < 128; y++) {
    for (x = 0; x < 127; x++) {
      i = y * 128 + x;
      if (grid[i] < 6 || grid[i + 1] < 6) continue;
      horN++;
      if (grid[i] === grid[i + 1]) hor++;
    }
  }
  for (y = 0; y < 127; y++) {
    for (x = 0; x < 128; x++) {
      i = y * 128 + x;
      if (grid[i] < 6 || grid[i + 128] < 6) continue;
      verN++;
      if (grid[i] === grid[i + 128]) ver++;
    }
  }
  if (horN < 200 || verN < 200) return false;
  return hor / horN > ver / verN + 0.03;
}

function centroid(grid) {
  var sx = 0;
  var sy = 0;
  var n = 0;
  var i, y, x;
  for (i = 0; i < grid.length; i++) {
    if (grid[i] > 1) continue;
    y = Math.floor(i / 128);
    x = i - y * 128;
    sx += x;
    sy += y;
    n++;
  }
  if (!n) return null;
  return { x: sx / n, y: sy / n, n: n };
}

function thinHalo(grid) {
  var dist = new Uint8Array(grid.length);
  var q = [];
  var i, head, y, x, k, nx, ny, n, d, slush, wide;
  var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (i = 0; i < grid.length; i++) {
    if (grid[i] > 1) continue;
    dist[i] = 1;
    q.push(i);
  }
  head = 0;
  while (head < q.length) {
    i = q[head++];
    d = dist[i];
    if (d >= 20) continue;
    y = Math.floor(i / 128);
    x = i - y * 128;
    for (k = 0; k < 4; k++) {
      nx = x + dirs[k][0];
      ny = y + dirs[k][1];
      if (nx < 0 || ny < 0 || nx > 127 || ny > 127) continue;
      n = ny * 128 + nx;
      if (dist[n]) continue;
      dist[n] = d + 1;
      q.push(n);
    }
  }
  slush = 0;
  wide = 0;
  for (i = 0; i < grid.length; i++) {
    if (grid[i] < 3 || grid[i] > 5) continue;
    slush++;
    if (dist[i] >= 6) wide++;
  }
  if (slush < 40) return true;
  return wide * 5 < slush * 2;
}

function cornerWipe(grid) {
  var top = 0;
  var bot = 0;
  var left = 0;
  var right = 0;
  var x, y, i, full;
  for (x = 0; x < 128; x++) {
    if (grid[x] <= 1) top++;
    if (grid[127 * 128 + x] <= 1) bot++;
  }
  for (y = 0; y < 128; y++) {
    if (grid[y * 128] <= 1) left++;
    if (grid[y * 128 + 127] <= 1) right++;
  }
  full = 0;
  if (top > 80) full++;
  if (bot > 80) full++;
  if (left > 80) full++;
  if (right > 80) full++;
  return full >= 2;
}

function drownedQuiet(quiet, loud) {
  var hit = 0;
  var tot = 0;
  var i;
  for (i = 0; i < quiet.length; i++) {
    if (quiet[i] > 1) continue;
    tot++;
    if (loud[i] <= 1) hit++;
  }
  if (!tot) return 1;
  return hit / tot;
}

function nearDisk(grid) {
  var r = 12;
  var rr = r * r;
  var cy, cx, dy, dx, y, x, i, hit, tot, water;
  water = 0;
  for (i = 0; i < grid.length; i++) if (grid[i] <= 2) water++;
  if (!water) return false;
  for (cy = r; cy < 128 - r; cy += 2) {
    for (cx = r; cx < 128 - r; cx += 2) {
      hit = 0;
      tot = 0;
      for (dy = -r; dy <= r; dy++) {
        for (dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > rr) continue;
          x = cx + dx;
          y = cy + dy;
          i = y * 128 + x;
          tot++;
          if (grid[i] <= 2) hit++;
        }
      }
      if (tot > 300 && hit / tot > 0.93 && hit / water > 0.4) return true;
    }
  }
  return false;
}

function cover(grown, target) {
  var hit = 0;
  var tot = 0;
  var i;
  for (i = 0; i < target.length; i++) {
    if (!target[i]) continue;
    tot++;
    if (grown[i]) hit++;
  }
  if (!tot) return 1;
  return hit / tot;
}

var src = fs.readFileSync(path.join(dir, "render.js"), "utf8");
var palSrc = fs.readFileSync(path.join(dir, "palettes.js"), "utf8");
if (/phosphor|0e6b52|b7e2c8|c5d9c8|00442e|00563e|acd6bc/i.test(src + palSrc)) fail("mint phosphor is back");
if (/perlin|simplex|Math\.sin|Math\.cos|Math\.random/i.test(src)) fail("float noise is imported");
if (/\b(mast|boom|hull|dinghy)\b/i.test(src)) fail("renderer still names a boat");
if (!/lattice/i.test(src)) fail("no height lattice");
if (/paintLead|polyline/.test(src)) fail("stroked a path again");
if (/slushFront|dominantBasin|thawEdge|dropSpeckles|floodFill/.test(src)) fail("pixels draws a mask then a halo");
if (/curl|perlin|simplex|advection|particle/i.test(src)) fail("pixels use curl noise");
if (/jev|mixbox|color-?wander/i.test(src)) fail("pixels use a pigment mixer");
if (/circle\s*\(/.test(src)) fail("disk primitive is back");
if (src.indexOf(">> 1") < 0) fail("water uses the snow dice");
if (src.indexOf(">> 2") >= 0) fail("water dice is too quiet");
if (Plate.N !== 128) fail("N is not 128");
if (Plate.leadCount({ leads: 2 }) !== 2) fail("lead count helper");

var walk = fs.readFileSync(path.join(dir, "../walk/index.html"), "utf8");
var walkLow = walk.toLowerCase();
if (walkLow.indexOf("eth") !== -1) fail("The Walk HTML says ETH");
if (walkLow.indexOf("floor") !== -1) fail("The Walk HTML says floor");
if (walkLow.indexOf("rarity") !== -1) fail("The Walk HTML says rarity");
if (walkLow.indexOf("stillwater") !== -1) fail("The Walk HTML has a wordmark");

var allowed = {};
var pi, hi;
for (pi = 0; pi < Plate.PALETTES.length; pi++) {
  for (hi = 0; hi < Plate.PALETTES[pi].hex.length; hi++) {
    allowed[Plate.PALETTES[pi].hex[hi].toLowerCase()] = true;
  }
}
var hexes = src.match(/#[0-9A-Fa-f]{6}/g) || [];
for (hi = 0; hi < hexes.length; hi++) {
  if (!allowed[hexes[hi].toLowerCase()]) fail("color outside palettes " + hexes[hi]);
}

function addr(n) {
  var b = new Uint8Array(20);
  var i;
  var v = n;
  for (i = 19; i >= 16; i--) {
    b[i] = v & 255;
    v = Math.floor(v / 256);
  }
  return b;
}

var samples = [1, 2, 10, 255, 1000, 65535];
var cents = [];
var s, bytes, g1, gLoud, f1, fLoud, i, snow3, snow4, phos4, water, interior, neigh, x, y, idx;

for (s = 0; s < samples.length; s++) {
  bytes = addr(samples[s]);
  g1 = Plate.indices(bytes, 1);
  gLoud = Plate.indices(bytes, 4096);
  if (g1.length !== 128 * 128 || gLoud.length !== 128 * 128) fail("canvas is not full frame");
  f1 = Plate.countWater(g1) / (128 * 128);
  fLoud = Plate.countWater(gLoud) / (128 * 128);
  if (fLoud < f1) fail("table rose on seed " + samples[s]);
  var g256 = Plate.indices(bytes, 256);
  var g8192 = Plate.indices(bytes, 8192);
  var g64 = Plate.indices(bytes, 64);
  if (sameBits(g256, gLoud)) fail("nonce 256 looks like nonce 4096 on seed " + samples[s]);
  if (sameBits(g8192, gLoud)) fail("nonce 8192 looks like nonce 4096 on seed " + samples[s]);
  if (Plate.basinStats(g64).count > 1) fail("nonce 64 has two peer lakes on seed " + samples[s]);
  if (drownedQuiet(g1, gLoud) < 0.95) fail("hills changed with nonce on seed " + samples[s]);
  if (sausage(gLoud)) fail("single connected sausage on seed " + samples[s]);
  var parts = Plate.basinStats(gLoud);
  if (cornerWipe(gLoud)) fail("corner wipe on seed " + samples[s]);
  if (parts.count > 2) fail("too many basins on seed " + samples[s] + " " + parts.count);
  if (missingWell(gLoud)) fail("loud plate has no darker well on seed " + samples[s]);
  var mark = wellMark(gLoud) || wellMark(g64);
  if (mark) fail("water well is a " + mark + " on seed " + samples[s]);
  if (sootWater(gLoud)) fail("water speckle is as loud as the snow on seed " + samples[s]);
  if (parts.total > 40 && parts.largest * 5 < parts.total * 2) {
    fail("no dominant lake on seed " + samples[s]);
  }
  if (parts.pepper > 3) fail("lattice grid on seed " + samples[s]);
  if (parts.total > 80 && stickerRing(gLoud)) fail("slush is a closed ring on seed " + samples[s]);
  if (smoothFill(gLoud) || flatWater(gLoud)) fail("water is a flat undithered fill on seed " + samples[s]);
  if (combRows(gLoud) >= 8) fail("horizontal comb on seed " + samples[s]);
  if (loudSnow()) fail("snow contrast is louder than the water on seed " + samples[s]);
  if (periodicSnow(gLoud)) fail("snow still shows a countable lattice on seed " + samples[s]);
  if (glintShare(gLoud) > 0.01) fail("glints are " + glintShare(gLoud).toFixed(3) + " on seed " + samples[s]);
  cents.push(centroid(gLoud));
  var bits = waterBits(gLoud);
  if (Plate.countWater(gLoud) > 30 && sameBits(bits, rot90(bits))) {
    fail("90 degree water symmetry on seed " + samples[s]);
  }
}

bytes = addr(1);
var p = Plate.derive(bytes);
if (p.palette !== 2) {
  for (s = 1; s < 80 && p.palette !== 2; s++) {
    bytes = addr(s);
    p = Plate.derive(bytes);
  }
}
if (p.palette !== 2) fail("no day sample");
if (Plate.PALETTES[0].name !== "Ice" || Plate.PALETTES[1].name !== "Pewter" || Plate.PALETTES[2].name !== "Ash") {
  fail("families are not Ice, Pewter, Ash");
}
var gPh = Plate.indices(bytes, 4096);
phos4 = 0;
for (i = 0; i < gPh.length; i++) if (gPh[i] === 9) phos4++;
if (phos4 / (128 * 128) > 0.01) fail("day glints are " + (phos4 / (128 * 128)).toFixed(3));

g1 = Plate.indices(addr(2), 1);
if (Plate.derive(addr(2)).palette === 2) g1 = Plate.indices(addr(10), 1);
snow3 = 0;
snow4 = 0;
for (i = 0; i < g1.length; i++) {
  if (g1[i] === 7) snow3++;
  if (g1[i] === 8) snow4++;
}
if (snow3 + snow4 < 1000) fail("snow ramp missing");

var mid = Plate.countWater(Plate.indices(addr(2), 64));
var quiet2 = Plate.countWater(Plate.indices(addr(2), 1));
var loud2 = Plate.countWater(Plate.indices(addr(2), 4096));
if (mid < quiet2 || loud2 < mid) fail("water table did not drop in order");

var still = Plate.indices(addr(10), 4096, 0);
var crawled = Plate.indices(addr(10), 4096, 1);
var moved = 0;
var leadMoved = 0;
var shoreMoved = 0;
for (i = 0; i < still.length; i++) {
  if (still[i] !== crawled[i]) moved++;
  if ((still[i] <= 1) !== (crawled[i] <= 1)) leadMoved++;
  if ((still[i] >= 3 && still[i] <= 5) !== (crawled[i] >= 3 && crawled[i] <= 5)) shoreMoved++;
}
if (moved < 40) fail("Bayer phase does not crawl");
var held = 0;
var was = 0;
for (i = 0; i < still.length; i++) {
  if (still[i] > 1) continue;
  was++;
  if (crawled[i] <= 1) held++;
}
if (was > 40 && held * 5 < was * 3) fail("phase moved the basin");
if (!Plate.crawls("open") || !Plate.crawls("tonight")) fail("OPEN walk cannot crawl Bayer phase");
if (Plate.crawls("dated")) fail("DATED walk crawls");

var walkJs = fs.readFileSync(path.join(dir, "../walk/walk.js"), "utf8");
if (walkJs.indexOf("Plate.crawls") < 0 || walkJs.indexOf("setInterval") < 0) {
  fail("OPEN walk cannot crawl Bayer phase");
}
if (walkJs.indexOf("phase = 0") < 0) fail("DATED walk does not freeze Bayer phase");
if (walkJs.indexOf("eth_getTransactionCount") < 0) fail("Walk does not read the transaction count");
if (walkJs.indexOf("FAIL-RPC") < 0) fail("Walk hides an RPC failure");
if (/paint\s*\(\s*canvas\s*,\s*addr\s*,\s*1\s*,/.test(walkJs)) fail("Walk paints nonce 1");
if (/azimuth|day-of-year|dayOfYear|polar bear|\bseal\b|fauna/i.test(src + walkJs)) fail("pixels name weather or animals");
var fromTimer = walkJs.slice(walkJs.indexOf("setInterval"));
if (/Math\.random/.test(walkJs)) fail("Walk pace is session random");
if (walkJs.indexOf("return 6 + (n % 7)") < 0) fail("Walk pace is not keyed");
var periodLiteral = walkJs.match(/setInterval\(\s*function\s*\(\)\s*\{[\s\S]*?\},\s*(\d+)\s*\)/);
if (periodLiteral && parseInt(periodLiteral[1], 10) < 6000) fail("Walk period is under 6 seconds");
var snapRender = fs.readFileSync(path.join(dir, "v0-blot/render.js"), "utf8");
var snapPal = fs.readFileSync(path.join(dir, "v0-blot/palettes.js"), "utf8");
var snapTable = fs.readFileSync(path.join(dir, "v0-blot/table.txt"), "utf8");
if (snapRender.indexOf(">> 1") < 0 || snapRender.indexOf("function waterTable") < 0) fail("snapshot folder is missing");
if (snapPal.indexOf("Morning") < 0 || snapTable.indexOf("floor(log2") < 0) fail("snapshot folder is missing");

var edgeHits = 0;
var placed = 0;
var ci;
for (ci = 0; ci < cents.length; ci++) {
  if (!cents[ci] || cents[ci].n < 40) continue;
  placed++;
  if (cents[ci].x < 8 || cents[ci].y < 8 || cents[ci].x > 119 || cents[ci].y > 119) edgeHits++;
}
if (placed && edgeHits * 2 >= placed) fail("loud centroid is within 8px of the frame");

var sheetHtml = fs.readFileSync(path.join(dir, "sheet.html"), "utf8");
if (/sheet-clock|PlateClock|2026-06-21|\bdoy\b/.test(sheetHtml)) fail("sheet.html grew clock columns");
if (src.indexOf("Math.sin") >= 0 || src.indexOf("Math.cos") >= 0) fail("blot pixels use a sun angle");

var clockSrc = fs.readFileSync(path.join(dir, "clock.js"), "utf8");
var clockSheet = fs.readFileSync(path.join(dir, "sheet-clock.html"), "utf8");
if (clockSheet.indexOf("render.js") < 0 || clockSheet.indexOf("clock.js") < 0) fail("clock sheet is not beside the blot");
if (clockSheet.indexOf("nonce 4096") < 0) fail("clock sheet does not hold nonce 4096");
if (/Plate\.PALETTES\s*=/.test(clockSrc)) fail("clock rewrites families");
vm.runInContext(clockSrc, ctx);
var Clock = ctx.PlateClock;
if (!Clock || !Clock.rake || !Clock.polar) fail("clock sheet is not beside the blot");

var morning = null;
var mi;
for (mi = 1; mi < 80 && !morning; mi++) {
  var mb = addr(mi);
  if (Plate.derive(mb).palette === 1) morning = mb;
}
if (!morning) fail("no morning seed");
var blot4096 = Plate.indices(morning, 4096, 0);
var heights = Plate.lightHeights(morning, 0);
var grains = Plate.grains(morning, 0);
var sunA = { y: 2026, mo: 6, d: 21, hour: 12 };
var sunB = { y: 2026, mo: 6, d: 21, hour: 0 };
var sunC = { y: 2026, mo: 12, d: 21, hour: 12 };
var sunN = { y: 2026, mo: 12, d: 21, hour: 0 };
var gA = Clock.rake(blot4096, sunA, heights, grains, true);
var gB = Clock.rake(blot4096, sunB, heights, grains, true);
var gC = Clock.rake(blot4096, sunC, heights, grains, true);
var gN = Clock.rake(blot4096, sunN, heights, grains, true);
var gOff = Clock.rake(blot4096, sunA, heights, grains, false);

function waterSame(a, b) {
  var i;
  for (i = 0; i < a.length; i++) if ((a[i] <= 1) !== (b[i] <= 1)) return false;
  return true;
}
function warmSide(raked, base, y0, y1) {
  var n = 0;
  var i, y;
  for (i = 0; i < raked.length; i++) {
    if (raked[i] <= base[i]) continue;
    if (base[i] < 7) return -1;
    y = Math.floor(i / 128);
    if (y >= y0 && y < y1) n++;
  }
  return n;
}
if (!waterSame(blot4096, gA) || !waterSame(blot4096, gB) || !waterSame(blot4096, gC) || !waterSame(blot4096, gN)) fail("clock moved the hole");
if (Plate.basinStats(gA).count !== Plate.basinStats(blot4096).count) fail("clock opened a new country");
if (Plate.basinStats(gB).count !== Plate.basinStats(blot4096).count) fail("clock opened a new country");
if (Plate.basinStats(gC).count !== Plate.basinStats(blot4096).count) fail("clock opened a new country");
if (/90\s*°\s*N|90\*N/.test(clockSrc)) fail("clock is still the pole");
if (/K \* Math\.sin/.test(clockSrc)) fail("clock still wipes the plate");
function snowMean(raked, base) {
  var s = 0;
  var n = 0;
  var i;
  for (i = 0; i < base.length; i++) {
    if (base[i] < 7) continue;
    s += raked[i];
    n++;
  }
  if (!n) return 0;
  return s / n;
}
function sideCounts(raked, base) {
  var left = 0;
  var right = 0;
  var i, x, y;
  for (i = 0; i < raked.length; i++) {
    if (raked[i] === base[i]) continue;
    if (base[i] < 7) return null;
    y = Math.floor(i / 128);
    x = i - y * 128;
    if (x < 64) left++;
    else right++;
  }
  return { left: left, right: right };
}
function snowFrac(a, b, base) {
  var n = 0;
  var d = 0;
  var i;
  for (i = 0; i < base.length; i++) {
    if (base[i] < 7) continue;
    n++;
    if (a[i] !== b[i]) d++;
  }
  if (!n) return 0;
  return d / n;
}
function glintCount(grid) {
  var n = 0;
  var i;
  for (i = 0; i < grid.length; i++) if (grid[i] === 9) n++;
  return n;
}
function nightIsNoonWithoutGlints(night, noon) {
  var i;
  for (i = 0; i < night.length; i++) {
    if (night[i] === 9) return false;
    if (noon[i] === 9) continue;
    if (night[i] !== noon[i]) return false;
  }
  return true;
}
function warmth(raked, base) {
  var n = 0;
  var i;
  for (i = 0; i < raked.length; i++) {
    if (base[i] < 7 || raked[i] === 9) continue;
    if (raked[i] > base[i]) n++;
  }
  return n;
}
function shadowCount(grid) {
  var n = 0;
  var i;
  if (!grid.shadow) return 0;
  for (i = 0; i < grid.shadow.length; i++) if (grid.shadow[i]) n++;
  return n;
}
if (!sameBits(gOff, blot4096)) fail("sun off still changes the plate");
if (shadowCount(gA) > 0) fail("high noon draws a crescent");
if (shadowCount(gN) > 0 || glintCount(gN) > 0) fail("night draws a crescent or keeps glints");
if (!nightIsNoonWithoutGlints(gN, gA)) fail("night paper is not noon without glints");
if ((gA.budget || 0) > 3 || (gB.budget || 0) > 3 || (gC.budget || 0) > 3 || (gN.budget || 0) > 3) fail("caption B > 3");
if (shadowCount(gB) < 20 || shadowCount(gC) < 20) fail("horizon has no crescent");
if (shadowCount(gB) > 400 || shadowCount(gC) > 400) fail("shadow is a thumbprint");
if (warmth(gC, blot4096) > 0) fail("winter rim shares summer warmth");
var warmB = 0;
var wi;
if (gB.warm) for (wi = 0; wi < gB.warm.length; wi++) if (gB.warm[wi]) warmB++;
if (warmB < 10) fail("summer midnight has no sunward warmth");
var pct = Plate.countWater(gA) * 100 / (128 * 128);
if (Math.abs(pct - 6.7) > 0.3) fail("clock water drifted from the blot");
if (/sunOn\s*=\s*true/.test(walkJs) || /PlateClock|clock\.js/.test(walkJs + walk)) fail("Walk ships with the sun on");
if (/overhead|\bpond\b|\bmelt\b|\bsun\b|\bbullet\b/i.test(walk + walkJs)) fail("Walk uses a banned word");
if (walkJs.indexOf("0xd934cc70b1b06256581527a534285f5bd6a7edc7") < 0) fail("Walk lost the probe key");
if (walkJs.indexOf("DEMO-2") < 0 || walkJs.indexOf("DEMO-3") < 0) fail("Walk lost the demo seeds");
if (walkJs.indexOf("16384") < 0 || walkJs.indexOf("1024") < 0) fail("Walk lost the nonce curve");
var demoFn = walkJs.slice(walkJs.indexOf("function demoCaption"), walkJs.indexOf("function chrome"));
if (demoFn.length < 20 || demoFn.indexOf("0x") >= 0) fail("DEMO caption carries an address");
if (walkJs.indexOf("checksum") < 0) fail("Walk hides a checksum error");
if (walkJs.indexOf("FORCED ") < 0) fail("Walk has no forced strip");
var sheetHtmlSun = fs.readFileSync(path.join(dir, "sheet.html"), "utf8");
if (sheetHtmlSun.indexOf("clock.js") >= 0 || sheetHtmlSun.indexOf("PlateClock") >= 0) fail("public plate ships with the sun on");
if (sheetHtmlSun.indexOf("wind.js") >= 0 || sheetHtmlSun.indexOf("PlateWind") >= 0) fail("public plate ships wind");
if (walkJs.indexOf("PlateWind") >= 0 || walkJs.indexOf("wind.js") >= 0) fail("Walk ships wind");
vm.runInContext(fs.readFileSync(path.join(dir, "well.js"), "utf8"), ctx);
var Well = ctx.PlateWell;
var wellBase = Plate.indices(morning, 4096, 0);
var wellOn = Well.nudge(wellBase, Plate.heights(morning, 0));
if (Plate.countWater(wellOn) !== Plate.countWater(wellBase)) fail("well nudge drifted water%");
if (Plate.basinStats(wellOn).count !== Plate.basinStats(wellBase).count) fail("well nudge opened a second lake");
var wellMarks = 0;
var snowMoved = 0;
var wi3;
for (wi3 = 0; wi3 < wellBase.length; wi3++) {
  if ((wellBase[wi3] <= 1) !== (wellOn[wi3] <= 1)) fail("well nudge moved the hole");
  if (wellBase[wi3] >= 7 && wellOn[wi3] !== wellBase[wi3]) snowMoved++;
  if (wellOn.well && wellOn.well[wi3]) wellMarks++;
}
if (snowMoved) fail("well nudge changed the snow");
if (wellMarks < 1 || wellMarks > 5) fail("well nudge is a sticker");
if (!/mode !== "dated"/.test(walkJs)) fail("dated Walk can turn the sun on");
var polA = Clock.polar(sunA);
var polC = Clock.polar(sunC);
if (polA.elev <= 8 || polC.elev > 1) fail("arctic height is backwards");
if (Plate.PALETTES[1].name !== "Pewter") fail("families swapped");
var nameFiles = ["sheet.html", "sheet-read.html", "sheet-seeds.html", "sheet-well.html", "sheet-clock.html", "sheet-clock-compare.html", "sheet-freeze.html"];
var nameI;
for (nameI = 0; nameI < nameFiles.length; nameI++) {
  var nameTxt = fs.readFileSync(path.join(dir, nameFiles[nameI]), "utf8");
  if (/Morning|Evening|\bDay\b/.test(nameTxt)) fail("old family name remains in " + nameFiles[nameI]);
}
if (/Morning|Evening|\bDay\b/.test(walkJs)) fail("old family name remains in Walk");
if (/Morning|Evening|\bDay\b/.test(walk)) fail("old family name remains in Walk");
var readHtml = fs.readFileSync(path.join(dir, "sheet-read.html"), "utf8");
if (/overhead|\bsun\b|pond|bullet|crego/i.test(readHtml)) fail("read sheet uses a banned word");
var beforeLip = Plate.indices(morning, 4096, 0);
var afterLip = Plate.indices(morning, 4096, 0, 0, 28);
if (!waterSame(beforeLip, afterLip)) fail("softer bank moved the hole");
if (Plate.basinStats(afterLip).count !== 1) fail("softer bank opened a second lake");
if (Plate.countWater(afterLip) !== Plate.countWater(beforeLip)) fail("softer bank changed the water count");
if (Plate.PALETTES[1].rgb[0][0] > 20) fail("soot well was recolored");
function glassBox(rgb, lo, hi) {
  return rgb[0] >= lo[0] && rgb[0] <= hi[0] && rgb[1] >= lo[1] && rgb[1] <= hi[1] && rgb[2] >= lo[2] && rgb[2] <= hi[2] && rgb[1] <= rgb[2];
}
var glassSkin = Plate.glassRgb(1, 0);
var glassSkinHi = Plate.glassRgb(1, 15);
var glassFloor = Plate.glassRgb(0, 0);
if (!glassBox(glassSkin, [58, 88, 98], [70, 100, 108])) fail("glass skin left the steel");
if (!glassBox(glassSkinHi, [58, 88, 98], [70, 100, 108])) fail("glass skin left the steel");
if (glassFloor[0] < 48 || glassFloor[1] < 74 || glassFloor[2] < 86) fail("glass well went black");
if (glassFloor[0] + 4 > glassSkin[0] || glassFloor[0] + 14 < glassSkin[0]) fail("glass well is not one step under the skin");
if (glassFloor[1] > glassFloor[2]) fail("glass went green");
if ((readHtml.match(/add\(/g) || []).length < 5) fail("read sheet lost a plate");
var pitMarks = Plate.pitWell(afterLip, Plate.heights(morning, 0));
var pitN = 0;
var pitI;
for (pitI = 0; pitI < pitMarks.length; pitI++) if (pitMarks[pitI]) pitN++;
if (pitN < 1 || pitN > 5) fail("pit is not the deep cell and its neighbors");
var pitColor = Plate.wellRgb();
var skinLo = Plate.skinRgb(0);
var skinHi = Plate.skinRgb(1);
if (skinLo[0] === skinHi[0] && skinLo[1] === skinHi[1] && skinLo[2] === skinHi[2]) fail("skin speckle is zero");
if (!glassBox(skinLo, [58, 88, 98], [70, 100, 108])) fail("skin left the steel");
if (!glassBox(skinHi, [58, 88, 98], [70, 100, 108])) fail("skin left the steel");
if (!glassBox(pitColor, [32, 50, 60], [40, 62, 72])) fail("pit left the steel");
if (lumaOf(pitColor) + 18 > lumaOf(skinLo)) fail("pit is not darker than the skin");
var lip = Plate.frostRgb(Plate.PALETTES[1].rgb[8], skinLo);
var lipFar = Math.abs(lumaOf(lip) - lumaOf(Plate.PALETTES[1].rgb[8]));
var lipNear = Math.abs(lumaOf(lip) - lumaOf(skinLo));
if (lipFar > lipNear) fail("slush sits nearer the water than the snow");
if (lip[2] - lip[0] > 16) fail("slush is a teal halo");
var flakeLo = Plate.flakeRgb(Plate.PALETTES[1].rgb[8], 0);
var flakeHi = Plate.flakeRgb(Plate.PALETTES[1].rgb[8], 63);
var flakeSpan = flakeHi[0] - flakeLo[0];
if (flakeSpan < 0) flakeSpan = -flakeSpan;
if (flakeSpan <= skinHi[0] - skinLo[0]) fail("snow is quieter than the skin");
if (/x\s*>>\s*1/.test(fs.readFileSync(path.join(dir, "render.js"), "utf8"))) fail("coarse snow tap is back");
var clump = Plate.clumpWell(afterLip, Plate.heights(morning, 0));
var clumpN = 0;
var clumpIn = 0;
var clumpI, clumpY, clumpX, clumpJ, clumpTouch;
var cminx = 128;
var cminy = 128;
var cmaxx = 0;
var cmaxy = 0;
for (clumpI = 0; clumpI < clump.length; clumpI++) {
  if (!clump[clumpI]) continue;
  clumpN++;
  clumpY = Math.floor(clumpI / 128);
  clumpX = clumpI - clumpY * 128;
  if (clumpX < cminx) cminx = clumpX;
  if (clumpY < cminy) cminy = clumpY;
  if (clumpX > cmaxx) cmaxx = clumpX;
  if (clumpY > cmaxy) cmaxy = clumpY;
  clumpTouch = 0;
  if (clumpX > 0 && clump[clumpI - 1]) clumpTouch++;
  if (clumpX < 127 && clump[clumpI + 1]) clumpTouch++;
  if (clumpY > 0 && clump[clumpI - 128]) clumpTouch++;
  if (clumpY < 127 && clump[clumpI + 128]) clumpTouch++;
  if (clumpTouch === 4) clumpIn++;
}
var clumpWant = Math.floor(Plate.countWater(afterLip) * 15 / 100);
if (clumpWant < 12) clumpWant = 12;
if (clumpN < 12) fail("well is a single pixel");
if (clumpN !== clumpWant) fail("well is not the low slice of the wet heights");
if (clumpIn * 3 < clumpN) fail("well is a ring or a plus");
if ((cmaxx - cminx + 1) <= 3 && (cmaxy - cminy + 1) <= 3) fail("well is a dot");
var clumpFill = clumpN / ((cmaxx - cminx + 1) * (cmaxy - cminy + 1));
if (clumpFill > 0.92) fail("well is a hard disk");
var eBands = Plate.wetBands(afterLip, Plate.heights(morning, 0));
var eCount = [0, 0, 0, 0];
var eI;
for (eI = 0; eI < eBands.length; eI++) eCount[eBands[eI]]++;
if (eCount[3] < 12 || eCount[2] < 12) fail("E wet steps collapsed");
if (eCount[3] !== clumpN) fail("E well left the low heights");
var eRgb = Plate.lawRgb(afterLip, Plate.heights(morning, 0), Plate.grains(morning, 0), Plate.waterTable(4096, 0), 28, Plate.PALETTES[1].rgb);
var eSum = 0;
var eN = 0;
for (eI = 0; eI < afterLip.length; eI++) {
  if (afterLip[eI] > 1) continue;
  eSum += eRgb[eI * 3] + eRgb[eI * 3 + 1] + eRgb[eI * 3 + 2];
  eN++;
}
if (eN === 0 || eSum / eN < 140) fail("wired paint is still soot");
var packLo = Plate.packRgb([220, 220, 218], 63, 0, 0, 100);
var packHi = Plate.packRgb([220, 220, 218], 63, 100, 0, 100);
if (packHi[0] - 220 <= packLo[0] - 220) fail("high snow is quieter than the crust");
var pewterPct = Plate.countWater(afterLip) * 1000 / (128 * 128);
if (pewterPct < 64 || pewterPct > 70) fail("Pewter 4096 water drifted");
if (walkJs.indexOf("Plate.paint") < 0) fail("Walk does not use the wired paint");
if (fs.readFileSync(path.join(dir, "sheet-freeze.html"), "utf8").indexOf("Plate.paint") < 0) fail("refreeze still paints the old ramp");

var freezeSrc = fs.readFileSync(path.join(dir, "freeze.js"), "utf8");
var freezeSheet = fs.readFileSync(path.join(dir, "sheet-freeze.html"), "utf8");
if (/etherscan|last-?tx|lastOutbound/i.test(freezeSrc + freezeSheet)) fail("freeze sheet searches for a last transaction");
if (freezeSheet.indexOf("clock.js") >= 0 || freezeSheet.indexOf("PlateClock") >= 0) fail("freeze sheet has a sun rake");
if (freezeSheet.indexOf("FAIL-ARCHIVE") < 0) fail("freeze sheet hides a missing archive");
vm.runInContext(freezeSrc, ctx);
var Freeze = ctx.PlateFreeze;
if (!Freeze || Freeze.freezeTerm(0, 0) !== 0) fail("gap 0 still freezes");
if (Freeze.freezeTerm(0, 4 * Freeze.YEAR) <= Freeze.freezeTerm(0, Freeze.MONTH)) fail("a long quiet does not deepen");
var stone = Plate.indices(morning, 4096, 0, 0);
if (!waterSame(stone, blot4096) || Plate.countWater(stone) !== Plate.countWater(blot4096)) fail("freeze changed the dated still");
var quietYear = Freeze.indices(morning, 4096, 0, Freeze.YEAR);
var quietLong = Freeze.indices(morning, 4096, 0, 4 * Freeze.YEAR);
var walked = Freeze.indices(morning, 8192, 4096, Freeze.YEAR);
if (Plate.countWater(quietYear) >= Plate.countWater(stone)) fail("a quiet year did not shrink the hole");
if (Plate.countWater(quietLong) >= Plate.countWater(quietYear)) fail("four quiet years did not shrink further");
if (Plate.countWater(walked) < Plate.countWater(stone)) fail("walking after the snap shrank the hole");

console.log("PASS");
