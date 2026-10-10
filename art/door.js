/* The connected key, shared by the mint page and the Walk. */
(function (root) {
  var NAME = "stillwater-key";

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

  root.StillDoor = { name: NAME, read: read, write: write };
})(window);
