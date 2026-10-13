/* The connected key, shared by the mint page and the Walk. */
(function (root) {
  var NAME = "stillwater-key";
  var OFF = "stillwater-key-off";

  function read() {
    try {
      return localStorage.getItem(NAME) || "";
    } catch (e) {
      return "";
    }
  }

  function write(value) {
    try {
      if (value) localStorage.setItem(NAME, value);
      else localStorage.removeItem(NAME);
    } catch (e) {}
  }

  /* Set only by a disconnect control. Opening the other page does not set it. */
  function off(value) {
    try {
      if (value) localStorage.setItem(OFF, "1");
      else localStorage.removeItem(OFF);
    } catch (e) {}
  }

  function isOff() {
    try { return localStorage.getItem(OFF) === "1"; }
    catch (e) { return false; }
  }

  function valid(value) {
    return /^0x[0-9a-fA-F]{40}$/.test(String(value || ""));
  }

  function provider() {
    try { return root.ethereum || null; }
    catch (e) { return null; }
  }

  /* The account the provider reports. An empty list is disconnected.
     A switch event names the account even when the re-read is stale.
     selectedAddress is used when it is one of the permitted accounts. */
  function reported(accounts, hinted) {
    var list = [];
    var i;
    var selected = "";
    var eth = provider();
    var hint = String(hinted || "");
    for (i = 0; accounts && i < accounts.length; i++) {
      if (valid(accounts[i])) list.push(accounts[i]);
    }
    if (valid(hint)) {
      for (i = 0; i < list.length; i++) {
        if (list[i].toLowerCase() === hint.toLowerCase()) return list[i];
      }
      return hint;
    }
    try { selected = (eth && eth.selectedAddress) || ""; }
    catch (e) { selected = ""; }
    if (valid(selected)) {
      for (i = 0; i < list.length; i++) {
        if (list[i].toLowerCase() === String(selected).toLowerCase()) return list[i];
      }
    }
    return list[0] || "";
  }

  var releasing = Promise.resolve();

  /* Drop the site permission so the next connect can pick the account on screen. */
  function release() {
    var eth = provider();
    if (!eth || !eth.request) return releasing;
    releasing = eth.request({
      method: "wallet_revokePermissions",
      params: [{ eth_accounts: {} }]
    }).catch(function () {});
    return releasing;
  }

  /* An explicit connect. Asks again when a session is already stored. */
  function ask() {
    var eth = provider();
    function read() {
      return eth.request({ method: "eth_accounts" }).then(function (accounts) {
        return reported(accounts, "");
      });
    }
    if (!eth || !eth.request) return Promise.reject(new Error("key"));
    return releasing.then(function () {
      return eth.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      }).then(read, function (err) {
        if (err && err.code === 4001) throw err;
        return eth.request({ method: "eth_requestAccounts" }).then(read);
      });
    });
  }

  root.StillDoor = {
    name: NAME,
    read: read,
    write: write,
    off: off,
    isOff: isOff,
    reported: reported,
    release: release,
    ask: ask
  };
})(window);
