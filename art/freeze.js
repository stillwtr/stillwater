/* How far the live lantern sinks after a snap.
   Stone (the dated still, the blot sheet) passes freezeTerm 0.
   Quiet years deepen the cut. Transactions after the snap melt it. */
(function (g) {
  var MONTH = 30 * 24 * 3600;

  function freezeTerm(dNonce, gapTime) {
    var months, gapSteps, sent, step;
    if (!(gapTime > 0) || dNonce < 0) return 0;
    months = Math.floor(gapTime / MONTH);
    if (months < 1) months = 1;
    gapSteps = g.Plate.floorLog2(months + 1);
    sent = g.Plate.floorLog2(dNonce + 1);
    step = 11;
    return Math.floor((gapSteps * step) / (1 + sent));
  }

  function liveTable(liveNonce, dNonce, gapTime) {
    return g.Plate.waterTable(liveNonce, freezeTerm(dNonce, gapTime));
  }

  function indices(addressBytes, liveNonce, dNonce, gapTime) {
    return g.Plate.indices(addressBytes, liveNonce, 0, freezeTerm(dNonce, gapTime));
  }

  g.PlateFreeze = {
    MONTH: MONTH,
    YEAR: 365 * 24 * 3600,
    freezeTerm: freezeTerm,
    liveTable: liveTable,
    indices: indices
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
