/* Lab only. The lowest wet cell and its four wet neighbors
   go one step darker. Skin, snow, and the outline stay. */
(function (g) {
  var NEAR = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function nudge(grid, hs) {
    var out = new Uint8Array(grid.length);
    var mark = new Uint8Array(grid.length);
    var i, minH, minI, y, x, k, nx, ny, j, step;
    var n = g.Plate.N;
    for (i = 0; i < grid.length; i++) out[i] = grid[i];
    minH = 256;
    minI = -1;
    for (i = 0; i < grid.length; i++) {
      if (grid[i] > 1) continue;
      if (hs[i] < minH) {
        minH = hs[i];
        minI = i;
      }
    }
    if (minI < 0) {
      out.well = mark;
      return out;
    }
    mark[minI] = 1;
    y = Math.floor(minI / n);
    x = minI - y * n;
    for (k = 0; k < 4; k++) {
      nx = x + NEAR[k][0];
      ny = y + NEAR[k][1];
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      j = ny * n + nx;
      if (grid[j] > 1) continue;
      mark[j] = 1;
    }
    for (i = 0; i < grid.length; i++) {
      if (!mark[i]) continue;
      step = out[i] - 1;
      if (step < 0) step = 0;
      out[i] = step;
    }
    out.well = mark;
    return out;
  }

  function paint(canvas, addressBytes, nonce, on) {
    var p = g.Plate.derive(addressBytes);
    var ctx = canvas.getContext("2d");
    var img = ctx.createImageData(g.Plate.N, g.Plate.N);
    var pal = g.Plate.PALETTES[p.palette].rgb;
    var base = g.Plate.indices(addressBytes, nonce, 0);
    var grid = on ? nudge(base, g.Plate.heights(addressBytes, 0)) : base;
    var ink = pal[0];
    var i, c, o;
    for (i = 0; i < grid.length; i++) {
      c = pal[grid[i]];
      if (on && grid.well && grid.well[i] && grid[i] === 0) {
        c = [
          ink[0] > 2 ? ink[0] - 2 : 0,
          ink[1] > 3 ? ink[1] - 3 : 0,
          ink[2] > 1 ? ink[2] - 1 : 0
        ];
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

  g.PlateWell = { nudge: nudge, paint: paint };
})(typeof globalThis !== "undefined" ? globalThis : this);
