/* ===== panel.js — terminal panel =====
   Commands are plain data in data/commands.json:
   typing a key prints its value (a string = one line, an array = one line per item).
   Only "help", "clear", "ls", "open <file>" and "projects" are built in. */
(function () {
  "use strict";

  const panel = document.querySelector(".panel");
  if (!panel) return;

  const terminal = panel.querySelector(".terminal");
  const output = panel.querySelector(".terminal__output");
  const form = panel.querySelector(".terminal__line");
  const input = panel.querySelector(".terminal__input");
  const prompt = panel.querySelector(".terminal__prompt");
const panelToggle = document.getElementById("panel-toggle");   // checked = minimized

  const COMMANDS_URL = "./data/commands.json";
  const BUILT_INS = ["help", "clear", "ls", "open", "projects"];
  const welcomeHTML = output.innerHTML;   // kept to restore on "New Terminal"
  let commands = null;                    // filled once the JSON has loaded
  let history = [];                       // previous commands, oldest first
  let historyIndex = 0;                   // position while browsing with ↑/↓

  // ----- Load the commands -----
  fetch(COMMANDS_URL)
    .then((response) => {
      if (!response.ok) throw new Error(response.status);
      return response.json();
    })
    .then((data) => {
      // Store with lower-case keys so commands are case-insensitive
      commands = {};
      Object.keys(data).forEach((key) => {
        commands[key.toLowerCase()] = data[key];
      });
    })
    .catch(() => {
      printLine("Could not load " + COMMANDS_URL + " (is the site running on a web server?)", "terminal__error");
    });

  // ----- Output helpers -----

  // Print one line; URLs and e-mail addresses become clickable links
  function printLine(text, className) {
    const line = document.createElement("p");
    if (className) line.className = className;

    const pattern = /(https?:\/\/[^\s]+|[\w.+-]+@[\w-]+\.[\w.-]+)/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      line.append(text.slice(lastIndex, match.index));

      const link = document.createElement("a");
      const isEmail = !match[0].startsWith("http");
      link.href = isEmail ? "mailto:" + match[0] : match[0];
      link.textContent = match[0];
      link.className = "terminal__link";
      if (!isEmail) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      line.append(link);

      lastIndex = pattern.lastIndex;
    }
    line.append(text.slice(lastIndex));

    output.appendChild(line);
  }

  // Repeat the prompt + typed command, like a real shell
  function echoCommand(text) {
    const line = document.createElement("p");
    // Same coloured prompt (and same phone layout). trim() drops the HTML file's
    // line breaks/indentation, which white-space: pre-wrap would otherwise show.
    line.innerHTML = prompt.innerHTML.trim();
    line.append(" " + text);
    output.appendChild(line);
  }

  function scrollToBottom() {
    terminal.scrollTop = terminal.scrollHeight;
  }

  // ----- Run a command -----
  function run(rawInput) {
    const text = rawInput.trim();
    echoCommand(text);
    if (text === "") return;

    history.push(text);
    historyIndex = history.length;

    const name = text.toLowerCase().replace(/\s+/g, " ");

    if (name === "clear") {
      output.innerHTML = "";
      return;
    }
    
    if (name === "ls" || name.startsWith("ls ")) {      // "ls", "ls -l", "ls -la"... all the same
      listFiles();
      return;
    }

    if (name === "open" || name.startsWith("open ")) {
      openCommand(name.slice(4).trim());
      return;
    }

    if (name === "projects") {
      listProjects();
      return;
    }

    if (commands === null) {
      printLine("Commands are still loading, try again in a moment.", "terminal__error");
      return;
    }

    if (name === "help") {
      printLine("Available commands:");
      const names = Object.keys(commands).filter((key) => !BUILT_INS.includes(key));
      const builtIns = BUILT_INS.map((key) => (key === "open" ? "open <file>" : key));
      printLine("  " + names.concat(builtIns).join("   "), "terminal__help");
      return;
    }

    if (Object.prototype.hasOwnProperty.call(commands, name)) {
      const value = commands[name];
      const lines = Array.isArray(value) ? value : [value];
      lines.forEach((item) => printLine(String(item)));
      return;
    }

    printLine("command not found: " + text + ". Type 'help' to see available commands.", "terminal__error");
  }

  // ----- "ls": fake `ls -la` listing, built from files.js so it is always up to date -----
  function listFiles() {
    // Newest possible date = when index.html was last changed (from the server, or now)
    const newest = new Date(document.lastModified);

    const files = Portfolio.FILES.map((file) => ({
      mode: "-rw-r--r--",
      links: 1,
      size: fakeSize(file.name),
      date: fakeDate(file.name, newest),
      name: file.name
    }));

    // A folder's date is when its newest file changed
    const folderDate = new Date(Math.max(...files.map((file) => file.date.getTime())));

    const entries = [
      { mode: "drwxr-xr-x", links: 2, size: 4096, date: folderDate, name: "." },
      { mode: "drwxr-xr-x", links: 3, size: 4096, date: fakeDate("..", folderDate), name: ".." }
    ].concat(files);

    // Right-align the size column, like the real ls
    const sizeWidth = Math.max(...entries.map((entry) => String(entry.size).length));
    const totalBlocks = entries.reduce((sum, entry) => sum + Math.ceil(entry.size / 1024) * 4, 0);

    printLine("/home/dimitris/portfolio", "terminal__path");
    printLine("total " + totalBlocks);

    entries.forEach((entry) => {
      printLine([
        entry.mode,
        String(entry.links).padStart(2, " "),
        "dimitris portfolio",
        String(entry.size).padStart(sizeWidth, " "),
        formatDate(entry.date),
        entry.name
      ].join(" "));
    });
  }

  // Stable pseudo-random number for a text: the same text always gives the same number,
  // so the listing looks random but doesn't change every time you type ls
  function hashOf(text) {
    let hash = 0;
    for (const char of text) {
      hash = (hash * 31 + char.charCodeAt(0)) % 1000003;
    }
    return hash;
  }

  // Made-up file size between 400 and 3999 bytes
  function fakeSize(name) {
    return 400 + (hashOf(name) % 3600);
  }

  // Made-up modified date: somewhere in the 3 weeks before "newest", at a random time of day
  function fakeDate(name, newest) {
    const minutesBack = hashOf(name + ":date") % (21 * 24 * 60);
    return new Date(newest.getTime() - minutesBack * 60 * 1000);
  }

  // "Oct  9 17:24", the format ls uses for recent files
  function formatDate(date) {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return MONTHS[date.getMonth()] + " " +
      String(date.getDate()).padStart(2, " ") + " " +
      String(date.getHours()).padStart(2, "0") + ":" +
      String(date.getMinutes()).padStart(2, "0");
  }
    // ----- "projects": printed from data/projects.json (loaded by projects.js) -----
  function listProjects() {
    Portfolio.getProjects()
      .then((projects) => {
        printLine(projects.length + " projects — type 'open projects.js' for the full view", "terminal__muted");

        projects.forEach((project) => {
          printLine(" ");
          printLine(project.name + (project.status ? "  (" + project.status.toLowerCase() + ")" : ""), "terminal__user");
          printLine("  " + project.description);
          if (project.tech && project.tech.length) {
            printLine("  " + project.tech.map(Portfolio.techLabel).join(" · "), "terminal__muted");
          }
          if (project.repo) printLine("  repo: " + project.repo);
          if (project.demo) printLine("  demo: " + project.demo);
        });
      })
      .catch(() => {
        printLine("projects: could not load ./data/projects.json", "terminal__error");
      })
      .then(scrollToBottom);   // the list arrives after the submit handler already scrolled
  }
  // ----- "open <file>": open a file in the editor -----
  // Accepts the full name ("about.html") or just the id ("about"), any case
  function openCommand(arg) {
    const fileList = "  " + Portfolio.FILES.map((file) => file.name).join("   ");

    if (arg === "") {
      printLine("usage: open <file>");
      printLine(fileList, "terminal__help");
      return;
    }

    const file = Portfolio.FILES.find((f) => f.name.toLowerCase() === arg || f.id === arg);

    if (!file) {
      printLine("open: no such file: " + arg, "terminal__error");
      printLine(fileList, "terminal__help");
      return;
    }

    Portfolio.openFile(file.id);
    printLine("Opening " + file.name + "...");
  }
  // ----- Typing -----
  form.addEventListener("submit", (event) => {
    event.preventDefault();               // stop the page from reloading
    run(input.value);
    input.value = "";
    scrollToBottom();
  });

  input.addEventListener("keydown", (event) => {
    // ↑ / ↓ browse the command history
    if (event.key === "ArrowUp" && historyIndex > 0) {
      historyIndex -= 1;
      input.value = history[historyIndex];
      event.preventDefault();             // keep the caret from jumping to the start
    } else if (event.key === "ArrowDown" && historyIndex < history.length) {
      historyIndex += 1;
      input.value = history[historyIndex] || "";
      event.preventDefault();
    }

    // Tab completes a command (or a file name after "open ") when exactly one matches
    if (event.key === "Tab" && input.value.trim() !== "") {
      const typed = input.value.trimStart().toLowerCase();
      let candidates = [];

      if (typed.startsWith("open ")) {
        candidates = Portfolio.FILES.map((file) => "open " + file.name.toLowerCase());
      } else if (commands !== null) {
        candidates = Object.keys(commands).concat(BUILT_INS);
      }

      const matches = candidates.filter((key, i, all) => key.startsWith(typed) && all.indexOf(key) === i);

      if (matches.length === 1) {
        input.value = matches[0];
        event.preventDefault();           // only trap Tab when it actually completed
      }
    }
  });

  // Clicking anywhere in the terminal focuses the input (unless selecting text)
  terminal.addEventListener("click", () => {
    if (window.getSelection().toString() === "") input.focus();
  });

  // ----- Panel header buttons (data-action="...") -----
  const actions = {
    // Fresh terminal: welcome message back, history kept
    "new-terminal"() {
      output.innerHTML = welcomeHTML;
      input.value = "";
      input.focus();
    },

    // Trash: empty the output
    "clear"() {
      output.innerHTML = "";
      input.focus();
    },

    // ✕: minimize the panel (always minimizes, never restores)
    "hide"() {
      panelToggle.checked = true;
    }
  };

  panel.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = actions[button.dataset.action];
      if (action) action();
    });
  });
    // ----- Public API (used by the activity bar) -----

  // Restore the panel and put the cursor in the prompt
  Portfolio.focusTerminal = function () {
    panelToggle.checked = false;
    input.focus();
  };

  // Restore the panel and run a command as if it had been typed
  Portfolio.runCommand = function (text) {
    panelToggle.checked = false;
    run(text);
    scrollToBottom();
    input.focus();
  };
})();