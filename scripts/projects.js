/* ===== projects.js view =====
   Reads data/projects.json and draws one card per project, in the order of the file.
   To add a project, add an object to the JSON — no HTML changes needed. */
(function () {

  const GITHUB_PROFILE = "https://github.com/DimitrisKourk";

  // Known tech names -> label + Devicon class.
  // "colored" uses the brand color; icons whose brand color is black stay text-colored.
  // Any name not listed here is shown as a plain text chip.
  const TECH = {
    react:        { label: "React",         icon: "devicon-react-original colored" },
    vite:         { label: "Vite",          icon: "devicon-vitejs-plain colored" },
    nodejs:       { label: "Node.js",       icon: "devicon-nodejs-plain colored" },
    express:      { label: "Express",       icon: "devicon-express-original" },
    mysql:        { label: "MySQL",         icon: "devicon-mysql-original colored" },
    redis:        { label: "Redis",         icon: "devicon-redis-plain colored" },
    python:       { label: "Python",        icon: "devicon-python-plain colored" },
    html:         { label: "HTML",          icon: "devicon-html5-plain colored" },
    css:          { label: "CSS",           icon: "devicon-css3-plain colored" },
    javascript:   { label: "JavaScript",    icon: "devicon-javascript-plain colored" },
    latex:        { label: "LaTeX",         icon: "devicon-latex-original" },
    unrealengine: { label: "Unreal Engine", icon: "devicon-unrealengine-original" },
  };

  // Small helper: create an element with a class and optional text
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function techChip(name) {
    const known = TECH[name.toLowerCase()];
    const chip = el("li", "chip project-card__tech");
    if (known) {
      chip.appendChild(el("i", known.icon));
      chip.appendChild(document.createTextNode(known.label));
    } else {
      chip.textContent = name;
    }
    return chip;
  }

  function linkButton(href, label, iconClass, variant) {
    const link = el("a", "button button--" + variant);
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.appendChild(el("i", "codicon " + iconClass));
    link.appendChild(document.createTextNode(label));
    return link;
  }

  function projectCard(project) {
    const card = el("article", "card project-card");

    const header = el("header", "project-card__header");
    const title = el("h2", "card__title project-card__title");
    title.appendChild(el("i", "codicon codicon-repo"));
    title.appendChild(document.createTextNode(project.name));
    header.appendChild(title);
    if (project.status) header.appendChild(el("span", "card__period", project.status));
    card.appendChild(header);

    card.appendChild(el("p", "card__text", project.description));

    if (project.tech && project.tech.length) {
      const chips = el("ul", "chips chips--small");
      project.tech.forEach((name) => chips.appendChild(techChip(name)));
      card.appendChild(chips);
    }

    const actions = el("div", "project-card__actions");
    if (project.repo) actions.appendChild(linkButton(project.repo, "Repo", "codicon-github", "secondary"));
    if (project.demo) actions.appendChild(linkButton(project.demo, "Live demo", "codicon-link-external", "primary"));
    card.appendChild(actions);

    return card;
  }

  function showError() {
    const message = el("p", "projects__error", "Could not load the projects. You can find them all on ");
    const link = el("a", "", "GitHub");
    link.href = GITHUB_PROFILE;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    message.appendChild(link);
    message.appendChild(document.createTextNode("."));
    grid.replaceChildren(message);
  }

    // Load once; the terminal's "projects" command reuses the same request
  const projectsRequest = fetch("./data/projects.json").then((response) => {
    if (!response.ok) throw new Error(response.status);
    return response.json();
  });

  Portfolio.getProjects = () => projectsRequest;
  Portfolio.techLabel = (name) => (TECH[name.toLowerCase()] || { label: name }).label;

  const grid = document.querySelector(".projects__grid");
  if (!grid) return;

  projectsRequest
    .then((projects) => grid.replaceChildren(...projects.map(projectCard)))
    .catch(showError);
})();