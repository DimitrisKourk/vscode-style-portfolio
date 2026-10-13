/* ===== doom.js — runs DOOM (1993 shareware) in the doom.exe tab =====
   The game runs inside an <iframe> (games/doom/player.html) so js-dos's own CSS and
   keyboard handling stay completely separate from the portfolio.
   Nothing is downloaded until the tab is opened. */

(function () {
  "use strict";

  const view = document.querySelector('.editor-view[data-file="doom"]');
  if (!view) return;

  const PLAYER_URL = "./games/doom/player.html";

  const player = view.querySelector(".doom__player");
  const loadingMessage = view.querySelector("[data-doom-loading]");
  const mobileMessage = view.querySelector("[data-doom-mobile]");

  // Touch-only devices (no mouse/keyboard) get a friendly message instead of the game
  const touchOnly = window.matchMedia("(hover: none) and (pointer: coarse)");

  let frame = null;          // the game's iframe while running

  // ----- Start / stop -----
  function start() {
    if (touchOnly.matches) {
      loadingMessage.hidden = true;
      mobileMessage.hidden = false;
      return;
    }

    loadingMessage.hidden = false;
    loadingMessage.textContent = "Loading DOOM…";

    frame = document.createElement("iframe");
    frame.className = "doom__frame";
    frame.src = PLAYER_URL;
    frame.title = "DOOM (1993 shareware)";
    frame.setAttribute("allow", "autoplay; fullscreen");
    player.appendChild(frame);
  }

  function stop() {
    if (!frame) return;
    frame.remove();                       // removing the iframe ends the emulator and its sound
    frame = null;
  }

  function setPaused(paused) {
    if (frame && frame.contentWindow) {
      frame.contentWindow.postMessage({ type: "pause", paused: paused }, "*");
    }
  }

  // ----- Messages from the game iframe -----
  window.addEventListener("message", (event) => {
    if (!frame || event.source !== frame.contentWindow) return;   // only our own iframe
    if (!event.data || event.data.source !== "doom") return;

    if (event.data.type === "ready") {
      loadingMessage.hidden = true;
      frame.focus();                      // keyboard goes straight to the game
    } else if (event.data.type === "error") {
      loadingMessage.textContent = "Couldn't load DOOM. Check your connection and reopen doom.exe.";
    }
  });

  // ----- Follow the shared state -----
  document.addEventListener("portfolio:change", (event) => {
    const { activeFile } = event.detail;
    const isOpen = Portfolio.isOpen("doom");
    const isActive = activeFile !== null && activeFile.id === "doom";

    if (!isOpen) {
      stop();                             // tab closed: shut everything down
      return;
    }

    if (isActive && !frame) start();

    // Pause while another tab is shown, resume when coming back
    setPaused(!isActive);
  });
})();