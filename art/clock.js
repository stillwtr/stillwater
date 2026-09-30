/* Arctic Circle light, after the hole is chosen.
   66.56°N, Greenwich. Pixel +x is east, pixel +y is south.
   sunEnabled false skips the pass. Water is never retinted. */
(function (g) {
  var LAT = (90 - 23.44) * Math.PI / 180;
  var OBL = 23.44 * Math.PI / 180;

  function dayOfYear(y, mo, d) {
    var md = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    var n = d;
    var i;
    if (leap) md[2] = 29;
    for (i = 1; i < mo; i++) n += md[i];
    return n;
  }

  function parts(when) {
    if (when && typeof when.getUTCFullYear === "function") {
      return {
        y: when.getUTCFullYear(),
        mo: when.getUTCMonth() + 1,
        d: when.getUTCDate(),
        hour: when.getUTCHours() + when.getUTCMinutes() / 60 + when.getUTCSeconds() / 3600
      };
    }
    return when;
  }

  function polar(when) {
    var p = parts(when);
    var doy = dayOfYear(p.y, p.mo, p.d);
    var dec = OBL * Math.sin((2 * Math.PI * (doy - 80)) / 365);
    var H = (p.hour - 12) * (15 * Math.PI / 180);
    var sinElev = Math.sin(LAT) * Math.sin(dec) + Math.cos(LAT) * Math.cos(dec) * Math.cos(H);
    if (sinElev > 1) sinElev = 1;
    if (sinElev < -1) sinElev = -1;
    var elev = Math.asin(sinElev) * 180 / Math.PI;
    var cosElev = Math.cos(Math.asin(sinElev));
    var cosNorth = 0;
    var sinEast = 0;
    if (cosElev > 0.02) {
      cosNorth = (Math.sin(dec) * Math.cos(LAT) - Math.cos(dec) * Math.sin(LAT) * Math.cos(H)) / cosElev;
      if (cosNorth > 1) cosNorth = 1;
      if (cosNorth < -1) cosNorth = -1;
      sinEast = Math.sin(H) * Math.cos(dec) / cosElev;
      if (sinEast > 1) sinEast = 1;
      if (sinEast < -1) sinEast = -1;
    }
    var az = Math.atan2(sinEast, cosNorth);
    var azDeg = az * 180 / Math.PI;
    if (azDeg < 0) azDeg += 360;
    return {
      doy: doy,
      hour: p.hour,
      elev: elev,
      az: az,
      azDeg: azDeg,
      night: elev < -1,
      east: sinEast,
      south: -cosNorth
    };
  }

  /* az is from north. +x east, +y south. Noon points down the plate. */
  function sunVector(sun) {
    return { x: Math.sin(sun.az), y: -Math.cos(sun.az) };
  }

  function hAt(hs, x, y, n) {
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x >= n) x = n - 1;
    if (y >= n) y = n - 1;
    return hs[y * n + x];
  }

  function litAt(hs, x, y, n, sun) {
    var sv = sunVector(sun);
    var gx = hAt(hs, x + 2, y, n) - hAt(hs, x - 2, y, n);
    var gy = hAt(hs, x, y + 2, n) - hAt(hs, x, y - 2, n);
    return gx * sv.x + gy * sv.y;
  }

  function winterRim(when) {
    var p = parts(when);
    return p.mo === 12 && p.d === 21;
  }

  function copyGrid(grid) {
    var out = new Uint8Array(grid.length);
    var i;
    for (i = 0; i < grid.length; i++) out[i] = grid[i];
    return out;
  }

  /* Steps toward the sun. Noon (south) walks +Y. */
  function towardSun(sun) {
    return { x: sun.east, y: sun.south };
  }

  function rayHitsWater(grid, x, y, dx, dy, reach, n) {
    var k, u, v;
    for (k = 1; k <= reach; k++) {
      u = x + Math.round(k * dx);
      v = y + Math.round(k * dy);
      if (u < 0 || v < 0 || u >= n || v >= n) return false;
      if (grid[v * n + u] <= 1) return true;
    }
    return false;
  }

  function budget(elev) {
    if (elev < -5) return 0;
    if (elev >= 35) return 0;
    if (elev >= 8) return 1;
    return 3;
  }

  function chebToWater(grid, x, y, n, limit) {
    var dy, dx, adx, ady, u, v;
    for (dy = -limit; dy <= limit; dy++) {
      ady = dy < 0 ? -dy : dy;
      for (dx = -limit; dx <= limit; dx++) {
        adx = dx < 0 ? -dx : dx;
        if ((adx > ady ? adx : ady) > limit) continue;
        u = x + dx;
        v = y + dy;
        if (u < 0 || v < 0 || u >= n || v >= n) continue;
        if (grid[v * n + u] <= 1) return true;
      }
    }
    return false;
  }

  function rake(grid, when, hs, grains, sunEnabled) {
    var sun, out, n, dir, reach, cold, night;
    if (sunEnabled === false) return copyGrid(grid);
    sun = polar(when);
    n = g.Plate.N;
    dir = towardSun(sun);
    reach = budget(sun.elev);
    cold = winterRim(when);
    night = sun.elev < -5;
    function fill(lip) {
      var painted = copyGrid(grid);
      var shadow = new Uint8Array(grid.length);
      var warm = new Uint8Array(grid.length);
      var i, y, x, step, nShadow;
      for (i = 0; i < grid.length; i++) {
        step = grid[i];
        if (night && step === 9) painted[i] = 8;
        if (step < 3 || night || reach === 0) continue;
        y = Math.floor(i / n);
        x = i - y * n;
        if (rayHitsWater(grid, x, y, dir.x, dir.y, reach, n) && chebToWater(grid, x, y, n, lip)) {
          shadow[i] = 1;
          if (step >= 7) step = painted[i] - 3;
          else step = painted[i] - 2;
          if (step < 2) step = 2;
          painted[i] = step;
          continue;
        }
        if (step === 7 && sun.elev > -5 && sun.elev < 25 && litAt(hs, x, y, n, sun) < 0) {
          painted[i] = 6;
        }
        if (!cold && sun.elev > -5 && sun.elev < 8 && chebToWater(grid, x, y, n, 8) && rayHitsWater(grid, x, y, -dir.x, -dir.y, 8, n)) {
          warm[i] = 1;
          if (painted[i] < 8) painted[i] = painted[i] + 1;
        }
      }
      nShadow = 0;
      for (i = 0; i < shadow.length; i++) if (shadow[i]) nShadow++;
      painted.shadow = shadow;
      painted.warm = warm;
      painted.budget = reach;
      painted.nShadow = nShadow;
      return painted;
    }
    out = fill(6);
    if (out.nShadow > 400) out = fill(4);
    return out;
  }

  function paint(canvas, addressBytes, nonce, phase, when, sunEnabled) {
    var p = g.Plate.derive(addressBytes);
    var ctx = canvas.getContext("2d");
    var img = ctx.createImageData(g.Plate.N, g.Plate.N);
    var pal = g.Plate.PALETTES[p.palette].rgb;
    var on = sunEnabled !== false;
    var grid = rake(
      g.Plate.indices(addressBytes, nonce, phase || 0),
      when,
      on ? g.Plate.lightHeights(addressBytes, phase || 0) : null,
      on ? g.Plate.grains(addressBytes, phase || 0) : null,
      on
    );
    var i, c, o, ink, src;
    ink = pal[0];
    for (i = 0; i < grid.length; i++) {
      c = pal[grid[i]];
      if (grid.shadow && grid.shadow[i]) {
        src = c;
        c = [
          Math.round(src[0] * 0.78 + ink[0] * 0.22),
          Math.round(src[1] * 0.82 + ink[1] * 0.18),
          Math.round(src[2] * 0.7 + ink[2] * 0.3)
        ];
        if (c[1] > c[2]) c[1] = c[2];
        if (c[0] > c[2]) c[0] = c[2];
      }
      o = i * 4;
      img.data[o] = c[0];
      img.data[o + 1] = c[1];
      img.data[o + 2] = c[2];
      img.data[o + 3] = 255;
    }
    canvas.width = g.Plate.N;
    canvas.height = g.Plate.N;
    ctx.putImageData(img, 0, 0);
    return p;
  }

  g.PlateClock = {
    dayOfYear: dayOfYear,
    polar: polar,
    rake: rake,
    paint: paint
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
