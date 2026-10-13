/* ===== side-bar.js — explorer ===== */

(function () {
  "use strict";

  const sideBar = document.querySelector(".side-bar");
  if (!sideBar) return;

  const fileLinks = sideBar.querySelectorAll(".explorer__file");

  // The file a link points to: href="#about" -> "about"
  function fileIdOf(link) {
    return link.getAttribute("href").slice(1);
  }

  // ----- Open a file when its row is clicked -----
  fileLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();               // the core updates the URL itself
      Portfolio.openFile(fileIdOf(link));
    });
  });

  // ----- Highlight the active file -----
  document.addEventListener("portfolio:change", (event) => {
    const activeFile = event.detail.activeFile;

    fileLinks.forEach((link) => {
      const isActive = activeFile !== null && fileIdOf(link) === activeFile.id;
      link.classList.toggle("explorer__file--active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  });

  // ----- Folder action buttons (data-action="...") -----
  const actions = {
    // Close every folder; the CSS transition animates it
    collapse() {
      sideBar.querySelectorAll(".explorer__toggle").forEach((toggle) => {
        toggle.checked = false;
      });
    },

    // Spin the refresh icon once
    refresh(button) {
      const icon = button.querySelector(".codicon");
      icon.classList.remove("is-spinning");
      void icon.offsetWidth;                // force a reflow so the animation can restart
      icon.classList.add("is-spinning");
    },
    
    // The portfolio is read-only: explain instead of doing nothing
    "new-file"() {
      Portfolio.notify("This portfolio is read-only, so new files can't be created.");
    },

    "new-folder"() {
      Portfolio.notify("This portfolio is read-only, so new folders can't be created.");
    },
  };

  sideBar.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = actions[button.dataset.action];
      if (action) action(button);
    });
  });

  // Clean up the spin class when the animation ends
  sideBar.addEventListener("animationend", (event) => {
    event.target.classList.remove("is-spinning");
  });
})();