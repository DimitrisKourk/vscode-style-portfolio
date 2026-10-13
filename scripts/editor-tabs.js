/* ===== editor-tabs.js — tab bar above the editor ===== */

(function () {
  "use strict";

  const tabBar = document.querySelector(".editor-tabs");
  if (!tabBar) return;

  // ----- Draw the tabs from the shared state -----
  function render(openFiles, activeFile) {
    // Remember if keyboard focus was inside the tab bar (e.g. on a close button)
    const hadFocus = tabBar.contains(document.activeElement);

    tabBar.innerHTML = openFiles.map((file) => {
      const isActive = activeFile !== null && file.id === activeFile.id;

      return `
        <div class="editor-tab${isActive ? " editor-tab--active" : ""}" data-file="${file.id}">
          <a href="#${file.id}" class="editor-tab__link" draggable="false"${isActive ? ' aria-current="page"' : ""}>
            <span class="editor-tab__icon">${file.icon}</span>
            <span class="editor-tab__name">${file.name}</span>
          </a>
          <button type="button" class="editor-tab__close" title="Close" aria-label="Close ${file.name}">
            <i class="codicon codicon-close"></i>
          </button>
        </div>`;
    }).join("");

    const activeTab = tabBar.querySelector(".editor-tab--active");
    if (!activeTab) return;

    scrollIntoTabBar(activeTab);

    // The focused element was replaced, so give focus to the new active tab
    if (hadFocus) activeTab.querySelector(".editor-tab__link").focus();
  }

  // Scroll the tab bar sideways so a tab is fully visible
  function scrollIntoTabBar(tab) {
    const barRect = tabBar.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();

    if (tabRect.left < barRect.left) {
      tabBar.scrollLeft -= barRect.left - tabRect.left;
    } else if (tabRect.right > barRect.right) {
      tabBar.scrollLeft += tabRect.right - barRect.right;
    }
  }

  // ----- Clicks: one listener for all tabs (they are re-created on every render) -----
  tabBar.addEventListener("click", (event) => {
    const tab = event.target.closest(".editor-tab");
    if (!tab) return;

    event.preventDefault();
    
    const id = tab.dataset.file;

    if (event.target.closest(".editor-tab__close")) {
      Portfolio.closeFile(id);
    } else {
      Portfolio.openFile(id);
    }
  });

  // ----- Mouse wheel scrolls the tabs sideways, like VS Code -----
  tabBar.addEventListener("wheel", (event) => {
    const overflowing = tabBar.scrollWidth > tabBar.clientWidth;
    const mostlyVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX);
    if (!overflowing || !mostlyVertical) return;   // let trackpads scroll naturally

    // Firefox can report the wheel in lines instead of pixels
    const amount = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    tabBar.scrollLeft += amount;
    event.preventDefault();
  }, { passive: false });

    // ----- Drag tabs to reorder them (mouse and pen) -----
  const DRAG_THRESHOLD = 5;               // pixels the pointer must move before a drag starts

  let drag = null;                        // info about the tab being dragged, or null
  let justDragged = false;

  tabBar.addEventListener("pointerdown", (event) => {
    const tab = event.target.closest(".editor-tab");
    if (!tab || event.button !== 0 || event.pointerType === "touch") return;  // touch keeps swipe-scrolling
    if (event.target.closest(".editor-tab__close")) return;                   // close button isn't a handle

    drag = {
      tab,
      id: tab.dataset.file,
      startX: event.clientX,
      startScroll: tabBar.scrollLeft,
      fromIndex: Array.from(tabBar.children).indexOf(tab),
      toIndex: null,
      started: false
    };
    tab.setPointerCapture(event.pointerId); // keep receiving moves even outside the tab
  });

  tabBar.addEventListener("pointermove", (event) => {
    if (!drag) return;

    const distance = event.clientX - drag.startX;
    if (!drag.started) {
      if (Math.abs(distance) < DRAG_THRESHOLD) return;
      drag.started = true;
      drag.tab.classList.add("editor-tab--dragging");
      tabBar.classList.add("editor-tabs--dragging");
    }

    autoScroll(event.clientX);

    // The dragged tab follows the pointer
    const scrolled = tabBar.scrollLeft - drag.startScroll;
    drag.tab.style.transform = "translateX(" + (distance + scrolled) + "px)";

    // Where would it land? Count the other tabs whose middle is left of the pointer
    const others = Array.from(tabBar.children).filter((tab) => tab !== drag.tab);
    drag.toIndex = others.filter((tab) => {
      const rect = tab.getBoundingClientRect();
      return rect.left + rect.width / 2 < event.clientX;
    }).length;

    showDropMarker(others);
  });

  tabBar.addEventListener("pointerup", () => finishDrag(true));
  tabBar.addEventListener("pointercancel", () => finishDrag(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drag && drag.started) finishDrag(false);   // Esc cancels a drag
  });

  // Browsers' own link dragging would fight with ours
  tabBar.addEventListener("dragstart", (event) => event.preventDefault());

  function finishDrag(drop) {
    if (!drag) return;
    const { started, id, fromIndex, toIndex } = drag;

    clearDragStyles();
    drag = null;
    if (!started) return;                 // it was a normal click

    justDragged = true;
    setTimeout(() => { justDragged = false; }, 0);

    if (drop && toIndex !== null && toIndex !== fromIndex) {
      Portfolio.moveFile(id, toIndex);
    } else {
      Portfolio.openFile(id);             // dropped in place: just activate it, like VS Code
    }
  }

  // Accent line on the side of the tab where the dragged tab would be inserted
  function showDropMarker(others) {
    others.forEach((tab) => tab.classList.remove("editor-tab--drop-before", "editor-tab--drop-after"));
    if (drag.toIndex === drag.fromIndex) return;   // same place: no marker

    if (drag.toIndex < others.length) {
      others[drag.toIndex].classList.add("editor-tab--drop-before");
    } else {
      others[others.length - 1].classList.add("editor-tab--drop-after");
    }
  }

  function clearDragStyles() {
    tabBar.classList.remove("editor-tabs--dragging");
    Array.from(tabBar.children).forEach((tab) => {
      tab.classList.remove("editor-tab--dragging", "editor-tab--drop-before", "editor-tab--drop-after");
      tab.style.transform = "";
    });
  }

  // Scroll the tab bar when dragging close to its left/right edge
  function autoScroll(pointerX) {
    const rect = tabBar.getBoundingClientRect();
    const edge = rect.width * 0.08;
    if (pointerX < rect.left + edge) tabBar.scrollLeft -= 8;
    else if (pointerX > rect.right - edge) tabBar.scrollLeft += 8;
  }

  // ----- Keyboard: Ctrl + Shift + ← / → moves the focused tab -----
  tabBar.addEventListener("keydown", (event) => {
    if (!event.ctrlKey || !event.shiftKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    const tab = event.target.closest(".editor-tab");
    if (!tab) return;

    const index = Array.from(tabBar.children).indexOf(tab);
    Portfolio.moveFile(tab.dataset.file, index + (event.key === "ArrowLeft" ? -1 : 1));
    event.preventDefault();
  });

  // ----- Redraw whenever the state changes -----
  document.addEventListener("portfolio:change", (event) => {
    render(event.detail.openFiles, event.detail.activeFile);
  });
})();