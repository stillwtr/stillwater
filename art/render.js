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

  /* Mixed-case addresses must match EIP-55. One case is unchecked. */
  function checksumState(text) {
    var s, lower, bytes, hash, i, nibble, ch, want;
    if (typeof text !== "string") return "parse";
    s = text.trim();
    if (s.slice(0, 2) === "0x" || s.slice(0, 2) === "0X") s = s.slice(2);
    if (s.length !== 40 || !/^[0-9a-fA-F]{40}$/.test(s)) return "parse";
    if (s === s.toLowerCase() || s === s.toUpperCase()) return "ok";
    lower = s.toLowerCase();
    bytes = new Uint8Array(40);
    for (i = 0; i < 40; i++) bytes[i] = lower.charCodeAt(i);
    hash = g.PlateKeccak.keccak256(bytes);
    for (i = 0; i < 40; i++) {
      nibble = (i & 1) ? (hash[i >> 1] & 15) : (hash[i >> 1] >> 4);
      ch = lower.charAt(i);
      if (ch < "a" || ch > "f") continue;
      want = nibble >= 8 ? ch.toUpperCase() : ch;
      if (s.charAt(i) !== want) return "checksum";
    }
    return "ok";
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
  function buildCoarse(seed, attempt) {
    var n = 5;
    var raw = new Uint8Array(n * n);
    var lat = new Uint8Array(n * n);
    var ranked = [];
    var anchors = [];
    var i, x, y, u, a, b, dx, dy, anchor, x0, y0, tmp;
    if (!attempt || attempt < 0) attempt = 0;
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        i = y * n + x;
        u = hashByte(x, y, seed, 1);
        raw[i] = u;
        ranked.push(i);
      }
    }
    ranked.sort(function (p, q) { return raw[p] - raw[q]; });
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
      anchors.push(ranked[a]);
    }
    anchor = anchors.length ? anchors[attempt < anchors.length ? attempt : anchors.length - 1] : -1;
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

  /* Same 16×16 lattice, stronger than the drawing layer. Lighting only. */
  function lightAt(coarse, detail, x, y) {
    var h = blend(coarse, 5, 32, x, y);
    var d = blend(detail, 17, 8, x, y);
    var delta = idiv(d - 128, 2);
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

  function waterTable(nonce, freezeTerm) {
    /* s = floor(log2(nonce+1)), no cap.
       1 nicks, 64 is the first modest well, 256 is still that country,
       1024–4096 can wet the second shelf, 8192 can cross the saddle.
       freezeTerm is 0 on the blot and on a dated still. */
    var lift = 11 * swallowRows(nonce);
    var cut = freezeTerm > 0 ? freezeTerm : 0;
    if (cut > lift) cut = lift;
    return 28 + lift - cut;
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

  function fieldKey(seed, phase, attempt) {
    return seed[0] + "," + seed[1] + "," + seed[2] + "," + seed[3] + "," + seed[4] + ":" + phase + ":" + attempt;
  }

  function heightAndSpeckle(seed, phase, attempt) {
    var key = fieldKey(seed, phase, attempt);
    var hit = fieldCache[key];
    var heightLattice, detail, hs, ds, x, y, i, li, wellX, wellY, wellH;
    if (hit) return hit;
    heightLattice = buildCoarse(seed, attempt);
    detail = buildDetail(seed);
    hs = new Uint8Array(N * N);
    ds = new Uint8Array(N * N);
    var ls = new Uint8Array(N * N);
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
        ls[i] = lightAt(heightLattice, detail, x, y);
        ds[i] = speckle(x, y, seed, phase);
      }
    }
    hit = { h: hs, d: ds, litH: ls, wellX: wellX, wellY: wellY };
    fieldCache[key] = hit;
    return hit;
  }

  function gridFor(seed, nonce, phase, attempt, freezeTerm, slushPad) {
    var t = waterTable(nonce, freezeTerm);
    var pad = slushPad >= 28 ? slushPad : 20;
    var frost = slushPad >= 28;
    var out = new Uint8Array(N * N);
    var x, y, i, h, d, step, span, field;
    field = heightAndSpeckle(seed, phase, attempt);
    for (y = 0; y < N; y++) {
      for (x = 0; x < N; x++) {
        i = y * N + x;
        h = field.h[i];
        d = field.d[i];
        var dWater = d >> 1;
        if (h + dWater < t - 12) {
          step = d < 10 ? 0 : 1;
        } else if (h + d < t + pad) {
          if (frost) {
            /* Optional lip only. The whole shore sits on the snow steps.
               Default pad stays the old spray. */
            span = h + d - (t - 12);
            step = span < 30 ? 6 : 7;
          } else {
            span = h + d - (t - 12);
            step = 3;
            if (span >= 11) step = 4;
            if (span >= 22) step = 5;
            if (d >= 40 && step > 3) step--;
            else if (d < 12 && step < 5) step++;
          }
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

  var attemptFor = {};

  function waterCentroid(grid) {
    var sx = 0;
    var sy = 0;
    var n = 0;
    var i, y, x;
    for (i = 0; i < grid.length; i++) {
      if (grid[i] > 1) continue;
      y = idiv(i, N);
      x = i - y * N;
      sx += x;
      sy += y;
      n++;
    }
    if (!n) return null;
    return { x: sx / n, y: sy / n, n: n };
  }

  function inMiddle(cen) {
    return cen.x >= 13 && cen.y >= 13 && cen.x <= 114 && cen.y <= 114;
  }

  /* Loud plate only. If that basin sits on the frame, the next-lowest
     interior cell takes the valley. Speckle and shelf heights stay put. */
  function chooseAttempt(seed) {
    var key = seed[0] + "," + seed[1] + "," + seed[2] + "," + seed[3] + "," + seed[4];
    var a, grid, cen, edge, best, bestEdge;
    if (attemptFor[key] !== undefined) return attemptFor[key];
    best = 0;
    bestEdge = -1;
    for (a = 0; a < 5; a++) {
      grid = gridFor(seed, 4096, 0, a);
      cen = waterCentroid(grid);
      if (!cen || cen.n < 40 || inMiddle(cen)) {
        attemptFor[key] = a;
        return a;
      }
      edge = cen.x;
      if (cen.y < edge) edge = cen.y;
      if (127 - cen.x < edge) edge = 127 - cen.x;
      if (127 - cen.y < edge) edge = 127 - cen.y;
      if (edge > bestEdge) {
        bestEdge = edge;
        best = a;
      }
    }
    attemptFor[key] = best;
    return best;
  }

  function indices(addressBytes, nonce, bayerPhase, freezeTerm, slushPad) {
    var seed = derive(addressBytes).seed;
    if (!bayerPhase || bayerPhase < 0) bayerPhase = 0;
    bayerPhase = bayerPhase & 31;
    return gridFor(seed, nonce, bayerPhase, chooseAttempt(seed), freezeTerm, slushPad);
  }

  /* Read-only height lattice for a later light pass. The blot does not use it. */
  function fieldOf(addressBytes, phase) {
    var seed = derive(addressBytes).seed;
    if (!phase || phase < 0) phase = 0;
    phase = phase & 31;
    return heightAndSpeckle(seed, phase, chooseAttempt(seed));
  }

  function heights(addressBytes, phase) {
    return fieldOf(addressBytes, phase).h;
  }

  function grains(addressBytes, phase) {
    return fieldOf(addressBytes, phase).d;
  }

  function lightHeights(addressBytes, phase) {
    return fieldOf(addressBytes, phase).litH;
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

  /* Stamp plate. The deep floor sits a short step under the skin. */
  function glassRgb(step, grain) {
    var t, r, g, b;
    if (step > 1) return null;
    t = grain & 15;
    r = 58 + idiv(12 * t, 15);
    g = 88 + idiv(12 * t, 15);
    b = 98 + idiv(10 * t, 15);
    if (step === 0) {
      r -= 8;
      g -= 10;
      b -= 8;
    }
    return [r, g, b];
  }

  /* Lowest slice of the wet heights. Not a neighbor cross. */
  function clumpWell(grid, hs) {
    var wet = [];
    var i, want, mark, k;
    for (i = 0; i < grid.length; i++) {
      if (grid[i] <= 1) wet.push(i);
    }
    wet.sort(function (a, b) {
      if (hs[a] !== hs[b]) return hs[a] - hs[b];
      return a - b;
    });
    want = idiv(wet.length * 15, 100);
    if (want < 12) want = 12;
    if (want > wet.length) want = wet.length;
    mark = new Uint8Array(grid.length);
    for (k = 0; k < want; k++) mark[wet[k]] = 1;
    return mark;
  }

  /* Deepest wet cell and the four wet cells that touch it. */
  function pitWell(grid, hs) {
    var mark = new Uint8Array(grid.length);
    var minH = 256;
    var minI = -1;
    var i, y, x, k, px, py, j;
    var off = [0, 0, -1, 0, 1, 0, 0, -1, 0, 1];
    for (i = 0; i < grid.length; i++) {
      if (grid[i] > 1) continue;
      if (hs[i] < minH) {
        minH = hs[i];
        minI = i;
      }
    }
    if (minI < 0) return mark;
    y = idiv(minI, N);
    x = minI - y * N;
    for (k = 0; k < 5; k++) {
      px = x + off[k * 2];
      py = y + off[k * 2 + 1];
      if (px < 0 || py < 0 || px >= N || py >= N) continue;
      j = py * N + px;
      if (grid[j] <= 1) mark[j] = 1;
    }
    return mark;
  }

  /* Two milky tones inside the skin range. Not a single fill. */
  function skinRgb(grain) {
    if (grain & 1) return [70, 100, 108];
    return [58, 88, 98];
  }

  function wellRgb() {
    return [36, 56, 66];
  }

  function frostRgb(snow, skin) {
    return [
      idiv(snow[0] * 3 + skin[0], 4),
      idiv(snow[1] * 3 + skin[1], 4),
      idiv(snow[2] * 3 + skin[2], 4)
    ];
  }

  /* Fine hash only. A half-cell tap tiles, so it stays off. */
  function flakeRgb(base, fine) {
    var delta = idiv(fine * 24, 63) - 12;
    return [base[0] + delta, base[1] + delta, base[2] + delta];
  }

  function snowIndex(d, h, x, y) {
    var step = 8;
    if (d < 14) step = 7;
    if (d === 63 && h >= 200 && ((x + y * 3) & 7) === 0) step = 9;
    return step;
  }

  function litAt(grid, i, h, d, x, y, isWell, table, pad, pal) {
    var skin = skinRgb(d);
    if (grid[i] <= 1) return isWell ? wellRgb() : skin;
    if (h + d < table + pad) return frostRgb(pal[snowIndex(d, h, x, y)], skin);
    return flakeRgb(pal[grid[i]], d);
  }

  /* 3 = deepest 15%, 2 = the next 25%, 1 = the rest of the water. */
  function wetBands(grid, hs) {
    var wet = [];
    var band = new Uint8Array(grid.length);
    var i, n, nWell, nMid, k;
    for (i = 0; i < grid.length; i++) {
      if (grid[i] <= 1) wet.push(i);
    }
    wet.sort(function (a, b) {
      if (hs[a] !== hs[b]) return hs[a] - hs[b];
      return a - b;
    });
    n = wet.length;
    nWell = idiv(n * 15, 100);
    if (nWell < 12) nWell = 12;
    if (nWell > n) nWell = n;
    nMid = idiv(n * 25, 100);
    if (nWell + nMid > n) nMid = n - nWell;
    for (k = 0; k < n; k++) {
      if (k < nWell) band[wet[k]] = 3;
      else if (k < nWell + nMid) band[wet[k]] = 2;
      else band[wet[k]] = 1;
    }
    return band;
  }

  function wetRgb(band, grain) {
    var j;
    if (band === 3) return [36, 56, 66];
    if (band === 2) {
      j = grain & 1;
      return [47 + j * 2, 72 + j * 2, 82 + j * 2];
    }
    return skinRgb(grain);
  }

  /* Thicker hash on higher snow. Low dry ground stays near the snow hex. */
  function packRgb(base, fine, h, hMin, hMax) {
    var span = hMax - hMin + 1;
    var amp = 4 + idiv(16 * (h - hMin), span);
    var delta = idiv(fine * 2 * amp, 63) - amp;
    return [base[0] + delta, base[1] + delta, base[2] + delta];
  }

  function lawRgb(grid, hs, grains, table, pad, pal) {
    var bands = wetBands(grid, hs);
    var out = new Uint8Array(grid.length * 3);
    var hMin = 256;
    var hMax = 0;
    var i, y, x, c, o;
    for (i = 0; i < grid.length; i++) {
      if (grid[i] <= 1) continue;
      if (hs[i] + grains[i] < table + pad) continue;
      if (hs[i] < hMin) hMin = hs[i];
      if (hs[i] > hMax) hMax = hs[i];
    }
    if (hMax < hMin) {
      hMin = 0;
      hMax = 0;
    }
    for (i = 0; i < grid.length; i++) {
      y = idiv(i, N);
      x = i - y * N;
      if (grid[i] <= 1) c = wetRgb(bands[i], grains[i]);
      else if (hs[i] + grains[i] < table + pad) c = frostRgb(pal[snowIndex(grains[i], hs[i], x, y)], skinRgb(grains[i]));
      else c = packRgb(pal[grid[i]], grains[i], hs[i], hMin, hMax);
      o = i * 3;
      out[o] = c[0];
      out[o + 1] = c[1];
      out[o + 2] = c[2];
    }
    return out;
  }

  function paint(canvas, addressBytes, nonce, phase, freezeTerm) {
    var p = derive(addressBytes);
    var ctx = canvas.getContext("2d");
    var img = ctx.createImageData(N, N);
    var pal = PALETTES[p.palette].rgb;
    var term = freezeTerm > 0 ? freezeTerm : 0;
    var grid = indices(addressBytes, nonce, phase || 0, term, 28);
    var field = fieldOf(addressBytes, phase || 0);
    var rgb = lawRgb(grid, field.h, field.d, waterTable(nonce, term), 28, pal);
    var n, o, p3;
    for (n = 0; n < grid.length; n++) {
      o = n * 4;
      p3 = n * 3;
      img.data[o] = rgb[p3];
      img.data[o + 1] = rgb[p3 + 1];
      img.data[o + 2] = rgb[p3 + 2];
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
    checksumState: checksumState,
    bytesToHex: bytesToHex,
    derive: derive,
    indices: indices,
    heights: heights,
    grains: grains,
    lightHeights: lightHeights,
    countWater: countWater,
    waterFraction: waterFraction,
    glassRgb: glassRgb,
    clumpWell: clumpWell,
    pitWell: pitWell,
    skinRgb: skinRgb,
    wellRgb: wellRgb,
    frostRgb: frostRgb,
    flakeRgb: flakeRgb,
    litAt: litAt,
    wetBands: wetBands,
    packRgb: packRgb,
    lawRgb: lawRgb,
    paint: paint
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
