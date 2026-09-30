/* Keccak-256 of raw bytes. Not NIST SHA3 (the padding byte is 0x01). */
(function (g) {
  var RC = [
    0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
    0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
    0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
    0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
    0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
    0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
    0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
    0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
  ];
  var ROT = [
    [0, 36, 3, 41, 18],
    [1, 44, 10, 45, 2],
    [62, 6, 43, 15, 61],
    [28, 55, 25, 21, 56],
    [27, 20, 39, 8, 14]
  ];
  var MASK = (1n << 64n) - 1n;

  function rotl(x, n) {
    n = BigInt(n);
    if (n === 0n) return x;
    return ((x << n) | (x >> (64n - n))) & MASK;
  }

  function keccakF(a) {
    var C = [0n, 0n, 0n, 0n, 0n];
    var D = [0n, 0n, 0n, 0n, 0n];
    var B = [[0n, 0n, 0n, 0n, 0n], [0n, 0n, 0n, 0n, 0n], [0n, 0n, 0n, 0n, 0n], [0n, 0n, 0n, 0n, 0n], [0n, 0n, 0n, 0n, 0n]];
    var round, x, y;
    for (round = 0; round < 24; round++) {
      for (x = 0; x < 5; x++) C[x] = a[x][0] ^ a[x][1] ^ a[x][2] ^ a[x][3] ^ a[x][4];
      for (x = 0; x < 5; x++) D[x] = C[(x + 4) % 5] ^ rotl(C[(x + 1) % 5], 1);
      for (x = 0; x < 5; x++) for (y = 0; y < 5; y++) a[x][y] = (a[x][y] ^ D[x]) & MASK;
      for (x = 0; x < 5; x++) for (y = 0; y < 5; y++) B[y][(2 * x + 3 * y) % 5] = rotl(a[x][y], ROT[x][y]);
      for (x = 0; x < 5; x++) {
        for (y = 0; y < 5; y++) {
          a[x][y] = (B[x][y] ^ ((~B[(x + 1) % 5][y]) & B[(x + 2) % 5][y])) & MASK;
        }
      }
      a[0][0] = (a[0][0] ^ RC[round]) & MASK;
    }
  }

  function keccak256(bytes) {
    var rate = 136;
    var a = [[0n, 0n, 0n, 0n, 0n], [0n, 0n, 0n, 0n, 0n], [0n, 0n, 0n, 0n, 0n], [0n, 0n, 0n, 0n, 0n], [0n, 0n, 0n, 0n, 0n]];
    var msg = new Uint8Array(bytes.length + rate);
    msg.set(bytes, 0);
    var pad = rate - (bytes.length % rate);
    msg[bytes.length] = 0x01;
    msg[bytes.length + pad - 1] |= 0x80;
    var total = bytes.length + pad;
    var offset = 0;
    while (offset < total) {
      for (var i = 0; i < rate; i++) {
        var lane = Math.floor(i / 8);
        var x = lane % 5;
        var y = Math.floor(lane / 5);
        var shift = BigInt((i % 8) * 8);
        a[x][y] = (a[x][y] ^ (BigInt(msg[offset + i]) << shift)) & MASK;
      }
      keccakF(a);
      offset += rate;
    }
    var out = new Uint8Array(32);
    for (var j = 0; j < 32; j++) {
      var lane2 = Math.floor(j / 8);
      var x2 = lane2 % 5;
      var y2 = Math.floor(lane2 / 5);
      var shift2 = BigInt((j % 8) * 8);
      out[j] = Number((a[x2][y2] >> shift2) & 0xffn);
    }
    return out;
  }

  g.PlateKeccak = { keccak256: keccak256 };
})(typeof globalThis !== "undefined" ? globalThis : this);
