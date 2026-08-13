(function (win) {
  "use strict";

  function normalizeBase(raw) {
    var p = String(raw || "").trim();
    if (!p || p === "/" || p === "auto") return "";
    if (p.charAt(0) !== "/") p = "/" + p;
    return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
  }

  function detectBase() {
    var preset = normalizeBase(win.CREDPIX_BASE_PATH);
    if (preset) return preset;
    var m = (win.location.pathname || "").match(/^(\/[^/]+)\/(?:up|pay|type|config|js|api)(?:\/|$)/);
    return m ? m[1] : "";
  }

  win.CREDPIX_BASE_PATH = detectBase();
  win.credpixGetBasePath = win.credpixGetBasePath || function () {
    return win.CREDPIX_BASE_PATH || "";
  };
  win.credpixPath = win.credpixPath || function (path) {
    path = String(path || "");
    if (/^(?:https?:)?\/\//i.test(path)) return path;
    if (path.charAt(0) !== "/") path = "/" + path;
    var base = win.credpixGetBasePath();
    if (base && path.indexOf(base + "/") === 0) return path;
    return base + path;
  };
  win.credpixStorageKey = win.credpixStorageKey || function (name) {
    return "credpix:" + (win.CREDPIX_BASE_PATH || "_root").replace(/\//g, "_") + ":" + String(name || "");
  };
})(window);
