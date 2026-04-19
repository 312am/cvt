(function initThemeSwitch(global) {
  const STORAGE_KEY = "corvianth-theme";

  function applyTheme(mode) {
    document.body.classList.toggle("light", mode === "light");
    const label = document.getElementById("themeLabel");
    if (label) {
      label.textContent = mode === "light" ? "Claro" : "Oscuro";
    }
    localStorage.setItem(STORAGE_KEY, mode);
  }

  function setupThemeSwitch() {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) return;

    const saved = localStorage.getItem(STORAGE_KEY) || "dark";
    applyTheme(saved);

    toggle.addEventListener("click", () => {
      const next = document.body.classList.contains("light") ? "dark" : "light";
      applyTheme(next);
    });
  }

  global.addEventListener("DOMContentLoaded", setupThemeSwitch);
})(window);

