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

  var PIN = "stillwater-account";

  /* The account a switch event or a connect named. Both pages read it. */
  function note(value) {
    var next = valid(value) ? value : "";
    try {
      if (next) localStorage.setItem(PIN, next);
      else localStorage.removeItem(PIN);
    } catch (e) {}
  }

  function pinned() {
    try {
      var stored = localStorage.getItem(PIN) || "";
      if (valid(stored)) return stored;
    } catch (e) {}
    return "";
  }

  function current(value) {
    return (pinned() || "").toLowerCase() === String(value || "").toLowerCase();
  }

  /* The account in this list. Ignores a pin so a fresh grant can replace it. */
  function pick(pool) {
    var list = [];
    var i;
    var selected = "";
    var eth = provider();
    for (i = 0; pool && i < pool.length; i++) {
      if (valid(pool[i])) list.push(pool[i]);
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

  /* Accounts named by the permission the user just granted. */
  function granted(permissions) {
    var i, j, k, caveats, value, found;
    found = [];
    if (!permissions || !permissions.length) return found;
    for (i = 0; i < permissions.length; i++) {
      caveats = permissions[i] && permissions[i].caveats;
      if (!caveats) continue;
      for (j = 0; j < caveats.length; j++) {
        if (!caveats[j] || caveats[j].type !== "restrictReturnedAccounts") continue;
        value = caveats[j].value;
        if (!value || !value.length) continue;
        for (k = 0; k < value.length; k++) {
          if (valid(value[k])) found.push(value[k]);
        }
      }
    }
    return found;
  }

  /* The account the provider reports.
     A switch event names the account even when the re-read is stale.
     A pinned account stays until disconnect or a new connect.
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
    if (!valid(hint)) hint = pinned();
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

  /* An explicit connect. The granted account replaces the previous key. */
  function ask() {
    var eth = provider();
    if (!eth || !eth.request) return Promise.reject(new Error("key"));
    note("");
    return releasing.then(function () {
      return eth.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      }).then(function (permissions) {
        var named = granted(permissions);
        return eth.request({ method: "eth_accounts" }).then(function (accounts) {
          var chosen = pick(named.length ? named : accounts);
          note(chosen);
          return chosen;
        });
      }, function (err) {
        if (err && err.code === 4001) throw err;
        return eth.request({ method: "eth_requestAccounts" }).then(function (accounts) {
          var chosen = pick(accounts);
          note(chosen);
          return chosen;
        });
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
    note: note,
    current: current,
    release: release,
    ask: ask
  };
})(window);
