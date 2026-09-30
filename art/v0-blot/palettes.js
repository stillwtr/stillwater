/* Ten-step ramps. Steps 0–6 are even in OKLab lightness.
   Steps 7–9 sit in a tighter band so snow speckle stays quieter than the well.
   Seed picks the family. Nothing here follows the hour. */
(function (g) {
  g.PlatePalettes = [
    {
      name: "Day",
      hex: ["#090E16", "#2A3039", "#52565C", "#71757B", "#92959B", "#B4B7BC", "#D7DADF", "#DADDE2", "#DFE2E7", "#E4E7EC"],
      rgb: [[9, 14, 22], [42, 48, 57], [82, 86, 92], [113, 117, 123], [146, 149, 155], [180, 183, 188], [215, 218, 223], [218, 221, 226], [223, 226, 231], [228, 231, 236]]
    },
    {
      name: "Morning",
      hex: ["#05090F", "#252B32", "#4E5052", "#6E6F70", "#8F908F", "#B1B2B0", "#D5D6D2", "#D8D9D5", "#DDDEDA", "#E2E3DF"],
      rgb: [[5, 9, 15], [37, 43, 50], [78, 80, 82], [110, 111, 112], [143, 144, 143], [177, 178, 176], [213, 214, 210], [216, 217, 213], [221, 222, 218], [226, 227, 223]]
    },
    {
      name: "Evening",
      hex: ["#070A0F", "#282B31", "#544F4C", "#746E6A", "#948F8A", "#B6B1AC", "#DAD4CE", "#DDD7D1", "#E2DCD6", "#E7E1DB"],
      rgb: [[7, 10, 15], [40, 43, 49], [84, 79, 76], [116, 110, 106], [148, 143, 138], [182, 177, 172], [218, 212, 206], [221, 215, 209], [226, 220, 214], [231, 225, 219]]
    }
  ];
})(typeof globalThis !== "undefined" ? globalThis : this);
