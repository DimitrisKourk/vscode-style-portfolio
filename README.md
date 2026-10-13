# VS Code–Style Portfolio

My personal portfolio website, designed to look and behave like the **Visual Studio Code** editor. Each page is a "file" you open in the editor. There's a working terminal, VS Code–style notifications, and a hidden easter egg.

Built with **plain HTML, CSS and JavaScript**: no frameworks, no build step, no dependencies to install.

## Features

### A working VS Code workbench
- **Title bar, activity bar, explorer side bar, editor tabs, status bar and panel,** laid out like the real editor
- **Pages are files:** `home.jsx`, `about.html`, `contact.json` and `projects.js` open as editor tabs, with a file-type icon and line numbers in the gutter
- **Tabs** can be opened from the explorer, switched and closed, just like in VS Code
- **Shareable URLs:** the address follows the active file (`#about`, `#contact`…), so a link opens straight to that page
- **Status bar** shows the language of the active file
- **VS Code–style notifications** pop up in the corner, and respect the *reduced motion* setting

### Interactive terminal
A terminal panel that runs commands:

| Command | Output |
|---|---|
| `help` | Lists all available commands |
| `whoami`, `about`, `skills`, `projects`, `contact` | Information about me |
| `ls` | A fake `ls -la` listing of the portfolio's files |
| `open <file>` | Opens that file in the editor |
| `clear` | Clears the terminal |

↑ / ↓ browse the command history. The informational commands live in `data/commands.json` as plain data, so new commands can be added without touching any JavaScript.

### Easter egg 🎮
Somewhere in the terminal there's a file that isn't in the explorer. Opening it runs **DOOM (1993 shareware)** in an editor tab, emulated in the browser with **js-dos**:
- The game runs inside its own iframe, so the emulator's CSS and keyboard handling can't interfere with the site.
- Nothing is downloaded until the tab is opened.
- The game pauses when you switch to another tab and shuts down when you close it.
- Touch-only devices get a friendly message instead.

### Responsive and cross-browser
- **No pixel sizing:** layouts use percentages and spacing and fonts use `em`, so everything scales with the screen and the user's font size.
- **Adapts to phones:** a mobile breakpoint rearranges the workbench for small screens.
- **Works in all major browsers, including Firefox.** It uses well-supported CSS rather than features that only the newest browsers have.

## Project structure

```
├── index.html            # The whole workbench layout and page content
├── data/
│   └── commands.json     # Terminal command output (edit to add commands)
├── scripts/
│   ├── files.js          # Shared core: which files exist, which are open, which is active
│   ├── editor.js         # Shows the active file's page and draws line numbers
│   ├── editor-tabs.js    # Tab bar
│   ├── side-bar.js       # Explorer
│   ├── activity-bar.js
│   ├── status-bar.js
│   ├── panel.js          # Terminal
│   ├── notifications.js  # Pop-up messages
│   └── doom.js           # Easter egg loader
├── styles/               # One stylesheet per component, plus styles.css for shared rules
└── games/doom/           # js-dos player page and the DOOM shareware bundle
```

### How the scripts work together
`files.js` is the **single source of truth**. It defines the files and keeps track of which tabs are open and which one is active. The other scripts never change that state directly. They call `Portfolio.openFile()` / `Portfolio.closeFile()`, then update their own part of the UI when the `portfolio:change` event fires. Adding a new page means one entry in the file list plus its section in `index.html`.

Each component has its own stylesheet, loaded with a separate `<link>` tag rather than `@import` so the browser can download them in parallel.

## Run locally

The terminal loads its commands with `fetch()`, which browsers block for pages opened directly from disk. Serve the folder with any static server instead:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Status

🚧 **Work in progress.** The **Projects** page (`projects.js`) is still being built.

## Credits

- [VS Code Codicons](https://github.com/microsoft/vscode-codicons) and [Devicon](https://devicon.dev/) for icons
- [Ubuntu](https://fonts.google.com/specimen/Ubuntu) and Ubuntu Mono fonts from Google Fonts
- [js-dos](https://js-dos.com/) for the DOS emulator
- **DOOM** shareware episode © id Software, distributed under its shareware terms
- Visual design inspired by Microsoft's Visual Studio Code. This is a personal project, not affiliated with Microsoft.
