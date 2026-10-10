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

  root.StillDoor = { name: NAME, read: read, write: write, off: off, isOff: isOff };
})(window);
