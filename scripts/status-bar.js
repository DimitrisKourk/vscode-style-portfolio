/* ===== status-bar.js ===== */

(function () {
  "use strict";

  const statusBar = document.querySelector(".status-bar");
  if (!statusBar) return;

  const language = statusBar.querySelector('[data-status="language"] span');
  const editorItems = statusBar.querySelectorAll("[data-editor-item]");
  const bell = statusBar.querySelector('[data-status="notifications"]');
  const bellIcon = bell.querySelector(".codicon");

  // ----- Follow the active file -----
  document.addEventListener("portfolio:change", (event) => {
    const activeFile = event.detail.activeFile;

    // No file open: hide editor-only items (Ln/Col, encoding, language), like VS Code
    editorItems.forEach((item) => {
      item.hidden = activeFile === null;
    });

    if (activeFile) language.textContent = activeFile.language;
  });

  // ----- Bell: shows a dot while notifications are on screen -----
  document.addEventListener("portfolio:notifications", (event) => {
    const hasNotifications = event.detail.count > 0;
    bellIcon.classList.toggle("codicon-bell", !hasNotifications);
    bellIcon.classList.toggle("codicon-bell-dot", hasNotifications);
  });

  // Click: close open notifications, or say there are none
  bell.addEventListener("click", () => {
    if (Portfolio.clearNotifications() === 0) {
      Portfolio.notify("No new notifications.");
    }
  });
})();