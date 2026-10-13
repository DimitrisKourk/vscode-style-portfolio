/* ===== activity-bar.js ===== */

(function () {
  "use strict";

  const app = document.querySelector(".app");
  const activityBar = document.querySelector(".activity-bar");
  const sideBar = document.querySelector(".side-bar");
  if (!app || !activityBar || !sideBar) return;

  const explorerButton = activityBar.querySelector('[data-view="explorer"]');
  const phone = window.matchMedia("(max-width: 40em)");   // same breakpoint as the CSS

  // ----- Side bar visibility -----
  // The CSS reacts to data-sidebar="shown" / "hidden" on .app
  function setSideBar(visible) {
    app.dataset.sidebar = visible ? "shown" : "hidden";
    explorerButton.classList.toggle("activity-bar__item--active", visible);
    explorerButton.setAttribute("aria-expanded", String(visible));
  }

  function isSideBarShown() {
    return app.dataset.sidebar === "shown";
  }

  // Start open on large screens, closed on phones (and reset when crossing the breakpoint)
  setSideBar(!phone.matches);
  phone.addEventListener("change", () => setSideBar(!phone.matches));

  // Explorer icon toggles the side bar
  explorerButton.addEventListener("click", () => setSideBar(!isSideBarShown()));

  // ----- Phones: the side bar is a drawer, so close it when... -----

  // ...a file was opened
  document.addEventListener("portfolio:change", () => {
    if (phone.matches) setSideBar(false);
  });

  // ...the user taps outside it
  document.addEventListener("click", (event) => {
    if (!phone.matches || !isSideBarShown()) return;
    if (sideBar.contains(event.target) || activityBar.contains(event.target)) return;
    setSideBar(false);
  });

  // ...Escape is pressed
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && phone.matches && isSideBarShown()) {
      setSideBar(false);
      explorerButton.focus();
    }
  });
    // ----- The other icons (data-view="...") -----
  const GITHUB_URL = "https://github.com/DimitrisKourk";   // ← your GitHub profile

  const views = {
    search() {
      Portfolio.focusTerminal();
    },

    "source-control"() {
      window.open(GITHUB_URL, "_blank", "noopener");
    },

    run() {
      Portfolio.notify("Nothing to debug, this portfolio is bug-free 😉");
    },

    extensions() {
      Portfolio.runCommand("skills");
    },

    accounts() {
      Portfolio.openFile("contact");
    },

    settings() {
      Portfolio.notify("You are not authorized to access settings.");
    }
  };

  activityBar.querySelectorAll("[data-view]").forEach((button) => {
    const view = views[button.dataset.view];
    if (view) button.addEventListener("click", () => view());
  });
})();