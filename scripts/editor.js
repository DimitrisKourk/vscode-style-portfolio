/* ===== editor.js — shows the active file's page and draws the line numbers ===== */

(function () {
  "use strict";

  const editor = document.querySelector(".editor");
  if (!editor) return;

  const gutter = editor.querySelector(".editor__gutter");
  const lineList = gutter.querySelector("ol");
  const views = editor.querySelectorAll(".editor-view");

  // ----- Show the active file's view -----
  function showView(activeFile) {
    views.forEach((view) => {
      view.hidden = activeFile === null
        ? !view.hasAttribute("data-empty")      // no file open: show the empty-editor code
        : view.dataset.file !== activeFile.id;  // otherwise: only the active file's view
    });

    editor.classList.toggle("editor--empty", activeFile === null);
    editor.scrollTop = 0;                 // every file opens at the top
    updateLineNumbers();
  }

  // ----- Line numbers: enough to fill the gutter's current height -----
  function updateLineNumbers() {
    if (!lineList.firstChild) lineList.appendChild(createLine(1));

    const lineHeight = lineList.firstChild.getBoundingClientRect().height;
    if (lineHeight === 0) return;         // not visible yet (e.g. hidden by CSS)

    const needed = Math.ceil(gutter.clientHeight / lineHeight);
    const current = lineList.children.length;

    if (needed > current) {
      const fragment = document.createDocumentFragment();
      for (let n = current + 1; n <= needed; n++) fragment.appendChild(createLine(n));
      lineList.appendChild(fragment);
    } else {
      for (let n = current; n > needed && n > 1; n--) lineList.lastChild.remove();
    }
  }

  function createLine(number) {
    const line = document.createElement("li");
    line.textContent = number;
    return line;
  }

  // The gutter is as tall as the page (or the visible editor), so watching it covers
  // window resizes, the panel being minimized, and pages of different lengths
  new ResizeObserver(updateLineNumbers).observe(gutter);

  // ----- Links inside pages that open another file: data-open="about" -----
  editor.addEventListener("click", (event) => {
    const link = event.target.closest("[data-open]");
    if (!link) return;

    event.preventDefault();
    Portfolio.openFile(link.dataset.open);
  });

    // ----- Copy buttons inside pages: data-copy="text to copy" -----
  editor.addEventListener("click", (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;

    copyText(button.dataset.copy)
      .then(() => Portfolio.notify("Copied to clipboard: " + button.dataset.copy))
      .catch(() => Portfolio.notify("Couldn't copy automatically. Please select and copy it manually."));
  });

  // Modern clipboard API where allowed (https / localhost), older fallback everywhere else
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "absolute";
      field.style.left = "-9999em";         // off screen, but still selectable
      document.body.appendChild(field);
      field.select();

      const copied = document.execCommand("copy");
      field.remove();
      copied ? resolve() : reject();
    });
  }
  
  document.addEventListener("portfolio:change", (event) => {
    showView(event.detail.activeFile);
  });
})();