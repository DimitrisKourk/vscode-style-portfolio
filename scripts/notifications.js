/* ===== notifications.js — VS Code style pop-up messages ===== */

(function () {
  "use strict";

  const container = document.querySelector(".notifications");
  if (!container) return;

  const AUTO_CLOSE_MS = 5000;   // how long a notification stays on screen
  const MAX_VISIBLE = 3;        // older ones are removed when this is exceeded

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // ----- Show a notification -----
  function notify(message) {
    const item = document.createElement("div");
    item.className = "notification";
    item.innerHTML = `
      <i class="codicon codicon-info notification__icon"></i>
      <p class="notification__message"></p>
      <button type="button" class="notification__close" title="Close" aria-label="Close notification">
        <i class="codicon codicon-close"></i>
      </button>`;

    // textContent (not innerHTML) so a message can never inject HTML
    item.querySelector(".notification__message").textContent = message;

    item.querySelector(".notification__close").addEventListener("click", () => dismiss(item));
    item.timer = setTimeout(() => dismiss(item), AUTO_CLOSE_MS);

    container.appendChild(item);

    // Too many on screen? Remove the oldest
    const visible = container.querySelectorAll(".notification:not(.notification--leaving)");
    if (visible.length > MAX_VISIBLE) dismiss(visible[0]);

    emitCount();
  }

  // ----- Hide one notification (fade out, then remove) -----
  function dismiss(item) {
    if (item.classList.contains("notification--leaving")) return;

    clearTimeout(item.timer);
    item.classList.add("notification--leaving");
    emitCount();

    if (reducedMotion.matches) {
      item.remove();
    } else {
      item.addEventListener("animationend", () => item.remove(), { once: true });
    }
  }

  // ----- Hide all; returns how many were visible -----
  function clearAll() {
    const visible = container.querySelectorAll(".notification:not(.notification--leaving)");
    visible.forEach(dismiss);
    return visible.length;
  }

  // Let other components (the status bar bell) know how many are showing
  function emitCount() {
    const count = container.querySelectorAll(".notification:not(.notification--leaving)").length;
    document.dispatchEvent(new CustomEvent("portfolio:notifications", { detail: { count } }));
  }

  // ----- Public API (added to the shared Portfolio object) -----
  Portfolio.notify = notify;
  Portfolio.clearNotifications = clearAll;
})();