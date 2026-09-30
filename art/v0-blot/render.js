/* Overhead ice field. N is the only canvas size.
   Integer math. Divisions truncate toward zero.
   The address is a height lattice. The nonce is a water table.
   Speckle can crawl. The basins do not. */
(function (g) {
  var N = 128;
  var BAYER = [
    0, 8, 2, 10,
    12, 4, 14, 6,
    3, 11, 1, 9,
    15, 7, 13, 5
  ];
  var PALETTES = g.PlatePalettes;

  function idiv(a, b) {
    return Math.trunc(a / b);
  }

  function floorLog2(n) {
    if (n <= 1) return 0;
    var k = 0;
    var v = n;
    while (v > 1) {
      v = Math.trunc(v / 2);
      k += 1;
    }
    return k;
  }

  function swallowRows(nonce) {
    var n = nonce < 0 ? 0 : nonce;
    return floorLog2(n + 1);
  }

  function parseAddress(text) {
    if (typeof text !== "string") return null;
    var s = text.trim();
    if (s.slice(0, 2) === "0x" || s.slice(0, 2) === "0X") s = s.slice(2);
    if (s.length !== 40 || !/^[0-9a-fA-F]{40}$/.test(s)) return null;
    var out = new Uint8Array(20);
    for (var i = 0; i < 20; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
    return out;
  }

  function bytesToHex(bytes) {
    var hex = "0x";
    for (var i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
    return hex;
  }

  function derive(addressBytes) {
    var seed = g.PlateKeccak.keccak256(addressBytes);
    return {
      palette: seed[0] % 3,
      originX: 64 + (seed[1] % 17) - 8,
      originY: 64 + (seed[2] % 17) - 8,
      heading: seed[3] % 8,
      grain: seed[4],
      leads: 1 + (seed[5] & 1),
      seed: seed
    };
  }

  function leadCount(p) {
    return p.leads;
  }

  function crawls(mode) {
    return mode === "open" || mode === "tonight";
  }

  function hashByte(lx, ly, seed, layer) {
    var bytes = new Uint8Array(8);
    bytes[0] = lx & 255;
    bytes[1] = ly & 255;
    bytes[2] = seed[0];
    bytes[3] = seed[1];
    bytes[4] = seed[2];
    bytes[5] = seed[3];
    bytes[6] = seed[4];
    bytes[7] = (seed[5] + layer) & 255;
    return g.PlateKeccak.keccak256(bytes)[0];
  }

  /* 5×5. The valley is a low interior cell near the middle.
     A corner, or the rim, is skipped for the next-lowest.
     Four shelves still share that neighborhood, so a higher table
     can wet the next one. */
  function buildCoarse(seed) {
    var n = 5;
    var raw = new Uint8Array(n * n);
    var lat = new Uint8Array(n * n);
    var ranked = [];
    var i, x, y, u, a, b, dx, dy, anchor, x0, y0, tmp;
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        i = y * n + x;
        u = hashByte(x, y, seed, 1);
        raw[i] = u;
        ranked.push(i);
      }
    }
    ranked.sort(function (p, q) { return raw[p] - raw[q]; });
    anchor = -1;
    for (a = 0; a < ranked.length; a++) {
      x = ranked[a] - idiv(ranked[a], n) * n;
      y = idiv(ranked[a], n);
      if ((x === 0 || x === n - 1) && (y === 0 || y === n - 1)) continue;
      if (x === 0 || y === 0 || x === n - 1 || y === n - 1) continue;
      dx = x - 2;
      dy = y - 2;
      if (dx < 0) dx = -dx;
      if (dy < 0) dy = -dy;
      if (dx + dy > 1) continue;
      anchor = ranked[a];
      break;
    }
    if (anchor < 0) {
      for (a = 0; a < ranked.length; a++) {
        x = ranked[a] - idiv(ranked[a], n) * n;
        y = idiv(ranked[a], n);
        if (x > 0 && y > 0 && x < n - 1 && y < n - 1) {
          anchor = ranked[a];
          break;
        }
      }
    }
    if (anchor < 0) anchor = ranked[0];
    x = anchor - idiv(anchor, n) * n;
    y = idiv(anchor, n);
    x0 = x < 2 ? 1 : 2;
    y0 = y < 2 ? 1 : 2;
    if (x === 3) x0 = 2;
    if (y === 3) y0 = 2;
    var quad = [y0 * n + x0, y0 * n + x0 + 1, (y0 + 1) * n + x0, (y0 + 1) * n + x0 + 1];
    var rest = [];
    for (a = 0; a < 4; a++) if (quad[a] !== anchor) rest.push(quad[a]);
    for (a = 0; a < rest.length; a++) {
      for (b = a + 1; b < rest.length; b++) {
        if (raw[rest[b]] < raw[rest[a]]) {
          tmp = rest[a];
          rest[a] = rest[b];
          rest[b] = tmp;
        }
      }
    }
    var shelf = [50, 128, 156, 178];
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) lat[y * n + x] = 236 + (raw[y * n + x] >> 6);
    }
    lat[anchor] = shelf[0] + (raw[anchor] >> 5);
    for (a = 0; a < rest.length; a++) lat[rest[a]] = shelf[a + 1] + (raw[rest[a]] >> 5);
    return lat;
  }

  function buildDetail(seed) {
    var n = 17;
    var lat = new Uint8Array(n * n);
    var y, x;
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) lat[y * n + x] = hashByte(x, y, seed, 2);
    }
    return lat;
  }

  function blend(lat, row, step, x, y) {
    var lx = idiv(x, step);
    var ly = idiv(y, step);
    var fx = x - lx * step;
    var fy = y - ly * step;
    var h00 = lat[ly * row + lx];
    var h10 = lat[ly * row + lx + 1];
    var h01 = lat[(ly + 1) * row + lx];
    var h11 = lat[(ly + 1) * row + lx + 1];
    var w00 = (step - fx) * (step - fy);
    var w10 = fx * (step - fy);
    var w01 = (step - fx) * fy;
    var w11 = fx * fy;
    return idiv(h00 * w00 + h10 * w10 + h01 * w01 + h11 * w11, step * step);
  }

  function groundAt(coarse, detail, x, y) {
    var h = blend(coarse, 5, 32, x, y);
    var d = blend(detail, 17, 8, x, y);
    var delta = idiv(d - 128, 4);
    h = h + delta;
    if (h < 0) h = 0;
    if (h > 255) h = 255;
    return h;
  }

  /* 0–63. Keccak of the seed and the cell. Not a matrix you can count.
     Phase shifts the sample by one column. */
  function speckle(x, y, seed, phase) {
    var bytes = new Uint8Array(8);
    var xx = x + phase;
    bytes[0] = xx & 255;
    bytes[1] = y & 255;
    bytes[2] = seed[0];
    bytes[3] = seed[1];
    bytes[4] = seed[2];
    bytes[5] = seed[3];
    bytes[6] = seed[4];
    bytes[7] = seed[7];
    return g.PlateKeccak.keccak256(bytes)[0] & 63;
  }

  var NEAR = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function waterTable(nonce) {
    /* s = floor(log2(nonce+1)), no cap.
       1 nicks, 64 is the first modest well, 256 is still that country,
       1024–4096 can wet the second shelf, 8192 can cross the saddle. */
    return 28 + 11 * swallowRows(nonce);
  }

  function basinStats(grid) {
    var seen = new Uint8Array(grid.length);
    var q = [];
    var i, head, k, y, x, nx, ny, j, n, size, count, total, largest, pepper;
    var minY, maxY, tall;
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
      minY = N;
      maxY = 0;
      while (head < q.length) {
        n = q[head++];
        size++;
        y = idiv(n, N);
        x = n - y * N;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        for (k = 0; k < 4; k++) {
          nx = x + NEAR[k][0];
          ny = y + NEAR[k][1];
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
          j = ny * N + nx;
          if (grid[j] > 1 || seen[j]) continue;
          seen[j] = 1;
          q.push(j);
        }
      }
      tall = maxY - minY + 1;
      total += size;
      if (size > largest) largest = size;
      /* Speckle at the shore is not another hollow. */
      if (tall <= 4 || size < 24) continue;
      count++;
      if (size < 24) pepper++;
    }
    return { count: count, total: total, largest: largest, pepper: pepper };
  }

  var fieldCache = {};

  function fieldKey(seed, phase) {
    return seed[0] + "," + seed[1] + "," + seed[2] + "," + seed[3] + "," + seed[4] + ":" + phase;
  }

  function heightAndSpeckle(seed, phase) {
    var key = fieldKey(seed, phase);
    var hit = fieldCache[key];
    var heightLattice, detail, hs, ds, x, y, i, li, wellX, wellY, wellH;
    if (hit) return hit;
    heightLattice = buildCoarse(seed);
    detail = buildDetail(seed);
    hs = new Uint8Array(N * N);
    ds = new Uint8Array(N * N);
    wellX = 0;
    wellY = 0;
    wellH = 256;
    for (li = 0; li < heightLattice.length; li++) {
      if (heightLattice[li] < wellH) {
        wellH = heightLattice[li];
        wellX = (li - idiv(li, 5) * 5) * 32;
        wellY = idiv(li, 5) * 32;
      }
    }
    for (y = 0; y < N; y++) {
      for (x = 0; x < N; x++) {
        i = y * N + x;
        hs[i] = groundAt(heightLattice, detail, x, y);
        ds[i] = speckle(x, y, seed, phase);
      }
    }
    hit = { h: hs, d: ds, wellX: wellX, wellY: wellY };
    fieldCache[key] = hit;
    return hit;
  }

  function indices(addressBytes, nonce, bayerPhase) {
    var seed = derive(addressBytes).seed;
    var t = waterTable(nonce);
    var out = new Uint8Array(N * N);
    var x, y, i, h, d, sum, step, span, adx, ady, field;
    if (!bayerPhase || bayerPhase < 0) bayerPhase = 0;
    bayerPhase = bayerPhase & 31;
    field = heightAndSpeckle(seed, bayerPhase);
    for (y = 0; y < N; y++) {
      for (x = 0; x < N; x++) {
        i = y * N + x;
        h = field.h[i];
        d = field.d[i];
        var dWater = d >> 1;
        if (h + dWater < t - 12) {
          step = d < 10 ? 0 : 1;
        } else if (h + d < t + 20) {
          span = h + d - (t - 12);
          step = 3;
          if (span >= 11) step = 4;
          if (span >= 22) step = 5;
          if (d >= 40 && step > 3) step--;
          else if (d < 12 && step < 5) step++;
        } else {
          step = 8;
          if (d < 14) step = 7;
          if (d === 63 && h >= 200 && ((x + y * 3) & 7) === 0) step = 9;
        }
        out[i] = step;
      }
    }
    softenWell(out, field.h, field.d);
    return out;
  }

  /* The floor of the hole is one step darker than the grain around it.
     The speckle stays in the floor, so the darker tone is not a mark. */
  function softenWell(out, hs, ds) {
    var i, minH, band, n;
    minH = 256;
    n = 0;
    for (i = 0; i < out.length; i++) {
      if (out[i] > 1) continue;
      n++;
      if (hs[i] < minH) minH = hs[i];
    }
    if (n < 8 || minH === 256) return;
    band = 4;
    var floorN = 0;
    while (band < 28 && floorN * 4 < n) {
      band += 2;
      floorN = 0;
      for (i = 0; i < out.length; i++) {
        if (out[i] > 1) continue;
        if (hs[i] <= minH + band) floorN++;
      }
    }
    for (i = 0; i < out.length; i++) {
      if (out[i] > 1) continue;
      if (hs[i] > minH + band) continue;
      out[i] = ds[i] < 60 ? 0 : 1;
    }
  }

  function countWater(grid) {
    var c = 0;
    var i;
    for (i = 0; i < grid.length; i++) if (grid[i] <= 1) c++;
    return c;
  }

  function waterFraction(addressBytes, nonce) {
    return countWater(indices(addressBytes, nonce, 0)) / (N * N);
  }

  function paint(canvas, addressBytes, nonce, phase) {
    var p = derive(addressBytes);
    var ctx = canvas.getContext("2d");
    var img = ctx.createImageData(N, N);
    var pal = PALETTES[p.palette].rgb;
    var grid = indices(addressBytes, nonce, phase || 0);
    var n, c, o;
    for (n = 0; n < grid.length; n++) {
      c = pal[grid[n]];
      o = n * 4;
      img.data[o] = c[0];
      img.data[o + 1] = c[1];
      img.data[o + 2] = c[2];
      img.data[o + 3] = 255;
    }
    canvas.width = N;
    canvas.height = N;
    ctx.putImageData(img, 0, 0);
    return p;
  }

  g.Plate = {
    N: N,
    PALETTES: PALETTES,
    BAYER: BAYER,
    idiv: idiv,
    floorLog2: floorLog2,
    swallowRows: swallowRows,
    leadCount: leadCount,
    crawls: crawls,
    basinStats: basinStats,
    waterTable: waterTable,
    parseAddress: parseAddress,
    bytesToHex: bytesToHex,
    derive: derive,
    indices: indices,
    countWater: countWater,
    waterFraction: waterFraction,
    paint: paint
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
