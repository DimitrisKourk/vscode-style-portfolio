/* ===== cv.js — CV.pdf tab =====
   Shows CV.pdf in the browser's built-in PDF viewer.
   The PDF is only requested the first time the tab is opened. */

(function () {
  "use strict";

  const frame = document.querySelector(".cv__frame");
  if (!frame) return;

  // Same check as the CSS: touch-only devices get the fallback message, so skip the download
  const touchOnly = window.matchMedia("(hover: none) and (pointer: coarse)");

  function loadOnce(activeFile) {
    if (touchOnly.matches) return;
    if (activeFile && activeFile.id === "cv" && !frame.getAttribute("src")) {
      frame.src = frame.dataset.src;
    }
  }

  document.addEventListener("portfolio:change", (event) => loadOnce(event.detail.activeFile));
})();