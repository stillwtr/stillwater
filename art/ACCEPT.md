# Accept

The plate is a frozen pond. How busy the key has been is how much water is open. The drawing is 128 by 128, full frame. One comparison per cell: height plus a row dither against the water table. Water is frost that failed. Slush is frost breaking. Snow is frost that held. There is no mask and no halo drawn around one.

## Laws

- One canvas size, N = 128. The frame is never cropped to the water.
- Three families only. Each is one 10-step ramp in `render.js`. No sixth hue. No gold.
- Steps 0–1 are open water. Steps 3–5 are slush. Steps 6–9 are ice and snow.
- The dither is row-major and sheared, values 0–63. Rows have to read. It is not pepper, and it is not a CRT fill.
- Phosphor steps 8 and 9 stay under 3 percent of the cells.
- The address is a 4×4 height lattice plus a weak 16×16. One interior hollow. The nonce is the water table. The same hills drown as the table rises, because more cells fail the test.
- A two-pixel dither row is the edge, not a second hollow. A loud plate with more than four real basins fails.
- Slush is not a closed ring drawn around a solid blob. Water is not a smooth undithered silhouette.
- On The Walk, an open or tonight plate crawls the Bayer dust. A dated plate holds the phase still. The sheet is always still.
- The water is not a plus, a star, or the character 大. Turning the frame 90 degrees must not look the same.
- Nonce 4096 is not nonce 1 drawn with a fatter pen.
- The Walk page does not say ETH, floor, rarity, or Stillwater on the plate.

`node art/gate.js` prints PASS only when every law holds. Taste is still KEEP / CUT after that.
