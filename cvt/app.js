const articleData = {
  title: "Ultrasonido de hombro doloroso",
  entryType: "article",
  author: {
    name: "Corvianth",
    url: "#/authors/corvianth",
  },
  date: "26 de abril de 2025",
  tags: ["Musculoesquel\u00e9tico", "Hombro", "Intermedio"],
  patient: {
    summary:
      "Paciente masculino de 42 a\u00f1os con dolor de hombro derecho de 3 semanas de evoluci\u00f3n, exacerbado con elevaci\u00f3n y rotaci\u00f3n externa. Sin trauma mayor identificado. Se solicita ultrasonido para valorar manguito rotador y bursa subacromial-subdeltoidea.",
    age: "42 a\u00f1os",
    sex: "Masculino",
    reason: "Dolor de hombro derecho",
    side: "Derecho",
  },
};

const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");
const scrollTopBtn = document.getElementById("scrollTopBtn");
const refsToggle = document.getElementById("refsToggle");
const refsContent = document.getElementById("refsContent");
const heroFavoriteBtn = document.getElementById("heroFavoriteBtn");
const shareBtn = document.getElementById("shareBtn");
const reportBtn = document.getElementById("reportBtn");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const mobileThemeBtn = document.getElementById("mobileThemeBtn");
const mobileThemeLabel = document.getElementById("mobileThemeLabel");
const mobileSearchBtn = document.getElementById("mobileSearchBtn");

const articleTitle = document.getElementById("articleTitle");
const articleSubtitle = document.getElementById("articleSubtitle");
const entryPrefix = document.getElementById("entryPrefix");
const articleAuthorLink = document.getElementById("articleAuthorLink");
const articleDate = document.getElementById("articleDate");
const tagOne = document.getElementById("tagOne");
const tagTwo = document.getElementById("tagTwo");
const tagThree = document.getElementById("tagThree");
const patientSummaryText = document.getElementById("patientSummaryText");
const patientAge = document.getElementById("patientAge");
const patientSex = document.getElementById("patientSex");
const patientReason = document.getElementById("patientReason");
const patientSide = document.getElementById("patientSide");
const tocNav = document.getElementById("tocNav");

function getEntryPrefix(entryType) {
  const prefixMap = {
    article: "Por",
    case: "Caso contribuido por",
  };
  return prefixMap[entryType] || "Por";
}

function renderArticleData() {
  articleTitle.textContent = articleData.title;

  if (entryPrefix) {
    entryPrefix.textContent = getEntryPrefix(articleData.entryType);
  }

  if (articleAuthorLink) {
    articleAuthorLink.textContent =
      articleData.author?.name || "Autor desconocido";
    articleAuthorLink.href = articleData.author?.url || "#";
    articleAuthorLink.setAttribute(
      "aria-label",
      `Ver perfil de ${articleData.author?.name || "autor"}`
    );
  }

  articleDate.textContent = articleData.date;
  tagOne.textContent = articleData.tags[0] || "";
  tagTwo.textContent = articleData.tags[1] || "";
  tagThree.textContent = articleData.tags[2] || "";

  patientSummaryText.textContent = articleData.patient.summary;
  patientAge.textContent = articleData.patient.age;
  patientSex.textContent = articleData.patient.sex;
  patientReason.textContent = articleData.patient.reason;
  patientSide.textContent = articleData.patient.side;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildToc() {
  if (!tocNav) return [];

  const sections = Array.from(document.querySelectorAll("[data-toc-title]"));
  tocNav.innerHTML = "";

  const trackedItems = [];

  sections.forEach((section, index) => {
    const sectionId =
      section.id || `${slugify(section.dataset.tocTitle)}-${index + 1}`;
    section.id = sectionId;

    const group = document.createElement("div");
    group.className = "nav-group";

    const sectionLink = document.createElement("a");
    sectionLink.href = `#${sectionId}`;
    sectionLink.className = "nav-link";
    sectionLink.dataset.tocLink = sectionId;
    sectionLink.innerHTML = `<span>${section.dataset.tocTitle}</span><span>\u203a</span>`;
    group.appendChild(sectionLink);

    trackedItems.push({
      id: sectionId,
      element: section,
      level: "section",
    });

    const subsections = Array.from(
      section.querySelectorAll("[data-toc-subtitle]")
    );

    if (subsections.length) {
      const sublinksWrap = document.createElement("div");
      sublinksWrap.className = "nav-sublinks";

      subsections.forEach((subsection, subIndex) => {
        const subsectionId =
          subsection.id || `${sectionId}-sub-${subIndex + 1}`;
        subsection.id = subsectionId;

        const subsectionLink = document.createElement("a");
        subsectionLink.href = `#${subsectionId}`;
        subsectionLink.className = "nav-sublink";
        subsectionLink.dataset.tocLink = subsectionId;
        subsectionLink.innerHTML = `<span>${subsection.dataset.tocSubtitle}</span><span>\u203a</span>`;
        sublinksWrap.appendChild(subsectionLink);

        trackedItems.push({
          id: subsectionId,
          element: subsection,
          level: "subsection",
          parentId: sectionId,
        });
      });

      group.appendChild(sublinksWrap);
    }

    tocNav.appendChild(group);
  });

  return trackedItems;
}

function setupScrollSpy(items) {
  if (!items.length) return;

  const links = Array.from(document.querySelectorAll("[data-toc-link]"));

  function updateActiveSection() {
    const viewportCenter = window.innerHeight / 2;
    let activeItem = items[0];
    let closestDistance = Infinity;

    items.forEach((item) => {
      const rect = item.element.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const distanceToCenter = Math.abs(itemCenter - viewportCenter);

      if (distanceToCenter < closestDistance) {
        closestDistance = distanceToCenter;
        activeItem = item;
      }
    });

    const resolvedActiveId =
      activeItem.level === "subsection" ? activeItem.parentId : activeItem.id;

    links.forEach((link) => {
      const isMainLink = link.classList.contains("nav-link");
      link.classList.toggle(
        "active",
        isMainLink && link.dataset.tocLink === resolvedActiveId
      );
    });
  }

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();

      const targetId = link.dataset.tocLink;
      const targetItem = items.find((item) => item.id === targetId);
      if (!targetItem) return;

      const rect = targetItem.element.getBoundingClientRect();
      const targetTop =
        window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    });
  });

  updateActiveSection();
  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection);
}

function applyTheme(mode) {
  body.classList.toggle("light", mode === "light");
  themeLabel.textContent = mode === "light" ? "Claro" : "Oscuro";

  if (mobileThemeLabel) {
    mobileThemeLabel.textContent =
      mode === "light" ? "Modo claro" : "Modo oscuro";
  }

  localStorage.setItem("corvianth-theme", mode);
}

function mobileMenuWrapContains(target) {
  const wrap = document.querySelector(".mobile-menu-wrap");
  return wrap ? wrap.contains(target) : false;
}

function toggleFavorite() {
  if (!heroFavoriteBtn) return;

  const isActive = heroFavoriteBtn.classList.toggle("is-active");
  heroFavoriteBtn.textContent = isActive
    ? "\u2605 Guardado"
    : "\u2606 Guardar";
  heroFavoriteBtn.setAttribute("aria-pressed", String(isActive));
  localStorage.setItem("corvianth-favorite", String(isActive));
}

function setupTheme() {
  const savedTheme = localStorage.getItem("corvianth-theme") || "dark";
  applyTheme(savedTheme);

  themeToggle?.addEventListener("click", () => {
    const nextMode = body.classList.contains("light") ? "dark" : "light";
    applyTheme(nextMode);
  });

  mobileThemeBtn?.addEventListener("click", () => {
    const nextMode = body.classList.contains("light") ? "dark" : "light";
    applyTheme(nextMode);
  });
}

function setupReferencesToggle() {
  refsToggle?.addEventListener("click", () => {
    const isCollapsed = refsContent.classList.contains("is-collapsed");
    refsContent.classList.toggle("is-collapsed");
    refsToggle.textContent = isCollapsed ? "Ocultar" : "Mostrar";
    refsToggle.setAttribute("aria-expanded", String(isCollapsed));
  });
}

function setupScrollTop() {
  scrollTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function setupFavorite() {
  const savedFavorite = localStorage.getItem("corvianth-favorite") === "true";

  if (savedFavorite && heroFavoriteBtn) {
    heroFavoriteBtn.textContent = "\u2605 Guardado";
    heroFavoriteBtn.classList.add("is-active");
    heroFavoriteBtn.setAttribute("aria-pressed", "true");
  }

  heroFavoriteBtn?.addEventListener("click", toggleFavorite);
}

function setupMobileMenu() {
  if (!mobileMenuBtn || !mobileMenu) return;

  mobileMenuBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");
    mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!mobileMenuWrapContains(event.target)) {
      mobileMenu.classList.remove("is-open");
      mobileMenuBtn.setAttribute("aria-expanded", "false");
    }
  });
}

function setupUtilityActions() {
  mobileSearchBtn?.addEventListener("click", () => {
    alert("Aqu\u00ed puedes abrir b\u00fasqueda en m\u00f3vil.");
  });

  shareBtn?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Enlace copiado");
    } catch (error) {
      alert("No se pudo copiar el enlace");
    }
  });

  reportBtn?.addEventListener("click", () => {
    alert("Funci\u00f3n de reporte (pendiente backend)");
  });
}

function initApp() {
  renderArticleData();

  const trackedSections = buildToc();
  setupScrollSpy(trackedSections);

  setupTheme();
  setupReferencesToggle();
  setupScrollTop();
  setupFavorite();
  setupMobileMenu();
  setupUtilityActions();
}

document.addEventListener("DOMContentLoaded", initApp);
