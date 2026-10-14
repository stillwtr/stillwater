/* How far the live lantern sinks after a snap.
   Stone (the dated still, the blot sheet) passes freezeTerm 0.
   Quiet is the blocks since the date. One day is 7200 blocks.
   Transactions after the snap melt the cut. */
(function (g) {
  var DAY = 7200;

  function freezeTerm(dNonce, gapBlocks) {
    var day, grown, sent;
    if (!(gapBlocks > 0) || dNonce < 0) return 0;
    day = 7200;
    grown = g.Plate.floorLog2(Math.floor(gapBlocks / day) + 1);
    sent = g.Plate.floorLog2(dNonce + 1);
    return Math.floor(grown / (1 + sent));
  }

  function liveTable(liveNonce, dNonce, gapBlocks) {
    return g.Plate.waterTable(liveNonce, freezeTerm(dNonce, gapBlocks));
  }

  function indices(addressBytes, liveNonce, dNonce, gapBlocks) {
    return g.Plate.indices(addressBytes, liveNonce, 0, freezeTerm(dNonce, gapBlocks));
  }

  g.PlateFreeze = {
    DAY: DAY,
    MONTH: 30 * DAY,
    YEAR: 365 * DAY,
    freezeTerm: freezeTerm,
    liveTable: liveTable,
    indices: indices
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
