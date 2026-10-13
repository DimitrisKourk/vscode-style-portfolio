/* ===== files.js — shared core =====
   Single source of truth for the portfolio "files":
   which files exist, which are open as tabs, and which one is active.

   Other scripts never change this state directly. They call
   Portfolio.openFile() / Portfolio.closeFile(), then update their own UI
   when the "portfolio:change" event fires on document. */

(function () {
  "use strict";

  // ----- File definitions (add new files here) -----
  // id       -> matches the #hash links and the editor section ids
  // name     -> label shown in the explorer and the tabs
  // language -> label shown in the status bar
  // icon     -> HTML placed inside the icon placeholder
  // hidden   -> true = not open as a tab when the page loads
  const FILES = [
    { id: "home",     name: "home.jsx",     language: "JavaScript JSX", icon: '<i class="devicon-react-original colored"></i>' },
    { id: "about",    name: "about.html",   language: "HTML",           icon: '<i class="devicon-html5-plain colored"></i>' },
    { id: "contact",  name: "contact.json", language: "JSON",           icon: "{...}" },
    { id: "projects", name: "projects.js",  language: "JavaScript",     icon: '<i class="devicon-javascript-plain colored"></i>' },
    // Easter egg: only reachable through the terminal (ls / open doom.exe)
    { id: "doom",     name: "doom.exe",     language: "DOS Executable", icon: '<i class="codicon codicon-game file-icon--doom"></i>', hidden: true }
  ].map(Object.freeze);

  const DEFAULT_FILE_ID = "home";

  // ----- State -----
  let openIds = FILES.filter((file) => !file.hidden).map((file) => file.id);   // open tabs, in tab order
  let activeId = null;                          // file currently shown in the editor

  // ----- Read helpers -----
  function getFile(id) {
    return FILES.find((file) => file.id === id) || null;
  }

  function getActiveFile() {
    return getFile(activeId);
  }

  function getOpenFiles() {
    return openIds.map(getFile);
  }

  function isOpen(id) {
    return openIds.includes(id);
  }

  // ----- Actions -----

  // Open a file: adds its tab if it was closed, then makes it active
  function openFile(id) {
    if (!getFile(id)) return false;

    if (!isOpen(id)) openIds.push(id);
    activeId = id;

    syncHash();
    emitChange();
    return true;
  }

  // Close a file's tab; if it was active, the neighbouring tab becomes active
  function closeFile(id) {
    const index = openIds.indexOf(id);
    if (index === -1) return false;

    openIds.splice(index, 1);

    if (activeId === id) {
      activeId = openIds[index] || openIds[index - 1] || null;
    }

    syncHash();
    emitChange();
    return true;
  }

    // Move a file's tab to a new position (index in the tab list) and make it active,
  // like dragging a tab in VS Code
  function moveFile(id, toIndex) {
    const fromIndex = openIds.indexOf(id);
    if (fromIndex === -1) return false;

    openIds.splice(fromIndex, 1);
    toIndex = Math.max(0, Math.min(toIndex, openIds.length));
    openIds.splice(toIndex, 0, id);
    activeId = id;

    syncHash();
    emitChange();
    return true;
  }

  // ----- Internals -----

  // Keep the URL hash in sync (#about, #projects...) so links to a file can be shared.
  // replaceState changes the URL without adding history entries or jumping the page.
  function syncHash() {
    const url = activeId
      ? "#" + activeId
      : window.location.pathname + window.location.search;
    history.replaceState(null, "", url);
  }

  // Tell every component that the state changed
  function emitChange() {
    document.dispatchEvent(new CustomEvent("portfolio:change", {
      detail: {
        activeFile: getActiveFile(),
        openFiles: getOpenFiles()
      }
    }));
  }

  // ----- Start-up -----
  // Open the file named in the URL (e.g. index.html#about), otherwise the default.
  const hashId = window.location.hash.slice(1);
  activeId = getFile(hashId) ? hashId : DEFAULT_FILE_ID;

  // Deferred scripts all run before DOMContentLoaded, so by the time this fires
  // every component has registered its listener and receives the initial state.
  document.addEventListener("DOMContentLoaded", emitChange);

  // ----- Public API -----
  window.Portfolio = {
    FILES,
    getFile,
    getActiveFile,
    getOpenFiles,
    isOpen,
    openFile,
    closeFile,
    moveFile
  };
})();