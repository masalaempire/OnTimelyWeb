(() => {
  "use strict";
  const tabs = Array.from(document.querySelectorAll("[data-tab]"));
  const panels = Array.from(document.querySelectorAll(".app-panel"));
  const feedback = document.querySelector("#demo-feedback");
  let completed = false;
  function selectTab(name, focus = false) {
    tabs.forEach((tab) => {
      const selected = tab.dataset.tab === name;
      tab.classList.toggle("is-selected", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    panels.forEach((panel) => { panel.hidden = panel.id !== "panel-" + name; });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab.dataset.tab));
    tab.addEventListener("keydown", (event) => {
      const moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (event.key in moves) {
        event.preventDefault();
        selectTab(tabs[(index + moves[event.key] + tabs.length) % tabs.length].dataset.tab, true);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        selectTab(tabs[event.key === "Home" ? 0 : tabs.length - 1].dataset.tab, true);
      }
    });
  });
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (completed) return;
      const status = document.querySelector("[data-task-status]");
      if (button.dataset.action === "work") {
        status.textContent = "You’re working. One step closer.";
        feedback.textContent = "Example: start confirmed. OnTimely can check in again at your latest safe start.";
        button.hidden = true;
        document.querySelector('[data-action="snooze"]').hidden = true;
      }
      if (button.dataset.action === "snooze") {
        status.textContent = "Snoozed for 10 minutes.";
        feedback.textContent = "Example: a little more time. Your deadline and latest safe start stay in view.";
      }
      if (button.dataset.action === "done") {
        completed = true;
        document.querySelector("#example-task").hidden = true;
        document.querySelector("[data-ready-group]").hidden = true;
        document.querySelector("[data-completed-essay]").hidden = false;
        document.querySelector("[data-active-count]").textContent = "1";
        document.querySelector("[data-done-count]").textContent = "2";
        feedback.textContent = "Example: task finished. Its reminders stop, and it moves to Done.";
        selectTab("done", true);
      }
    });
  });
  document.querySelector("[data-reset]").addEventListener("click", () => {
    completed = false;
    document.querySelector("#example-task").hidden = false;
    document.querySelector("[data-ready-group]").hidden = false;
    document.querySelector("[data-completed-essay]").hidden = true;
    document.querySelector("[data-task-status]").textContent = "It’s a good time to get started.";
    document.querySelectorAll("[data-action]").forEach((button) => { button.hidden = false; });
    document.querySelector("[data-active-count]").textContent = "2";
    document.querySelector("[data-done-count]").textContent = "1";
    document.querySelector(".timing-details").open = false;
    feedback.textContent = "Try the tabs and task actions. This is an example, so nothing is saved.";
    selectTab("active");
  });
  // The stable release download works even if this optional metadata request fails.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  fetch("https://api.github.com/repos/masalaempire/OnTimely/releases/latest", {
    signal: controller.signal, headers: { Accept: "application/vnd.github+json" }
  }).then((response) => {
    if (!response.ok) throw new Error("Release metadata unavailable");
    return response.json();
  }).then((release) => {
    const asset = Array.isArray(release.assets) && release.assets.find((item) =>
      item.name === "OnTimely.dmg" &&
      typeof item.browser_download_url === "string" &&
      item.browser_download_url.startsWith("https://github.com/masalaempire/OnTimely/releases/download/")
    );
    if (!asset || typeof release.tag_name !== "string" || !/^v?\d[\w.\-+]*$/.test(release.tag_name)) {
      throw new Error("Release metadata incomplete");
    }
    document.querySelectorAll("[data-release]").forEach((label) => {
      label.textContent = "Version " + release.tag_name.replace(/^v/, "");
    });
  }).catch(() => {
    document.querySelectorAll("[data-release]").forEach((label) => { label.textContent = "Latest on GitHub"; });
  }).finally(() => clearTimeout(timeout));
})();
