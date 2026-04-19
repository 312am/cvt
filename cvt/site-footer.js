(function initSiteFooter(global) {
  const FOOTER_ID = "corvianth-site-footer";
  const SCROLL_TOP_ID = "scrollTopBtn";

  function buildFooter() {
    const footer = document.createElement("footer");
    footer.id = FOOTER_ID;
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="site-footer-inner">
        <div class="site-footer-brand">
          <img
            class="brand-logo brand-logo-dark site-footer-logo"
            src="./assets/corviant_white_full_horizontal.svg"
            alt="Corvianth"
          />
          <img
            class="brand-logo brand-logo-light site-footer-logo"
            src="./assets/corviant_black_full_horizontal.svg"
            alt="Corvianth"
          />
        </div>

        <div class="site-footer-grid">
          <section class="site-footer-col">
            <h3>Articles</h3>
            <ul>
              <li>By section</li>
              <li>By system</li>
              <li>Clasificaciones</li>
              <li>Tecnologia de imagen</li>
              <li>Interventional radiology</li>
            </ul>
          </section>
          <section class="site-footer-col">
            <h3>Cases</h3>
            <ul>
              <li>Breast</li>
              <li>Cardiac</li>
              <li>Central nervous system</li>
              <li>Gastrointestinal</li>
              <li>Musculoskeletal</li>
            </ul>
          </section>
          <section class="site-footer-col">
            <h3>Corvianth.org</h3>
            <ul>
              <li>About</li>
              <li>Editorial board</li>
              <li>Corvianth team</li>
              <li>Supporters</li>
              <li>Help</li>
            </ul>
          </section>
        </div>

        <div class="site-footer-legal">
          <span>Contact Us</span>
          <span>Terms of Use</span>
          <span>Privacy Policy</span>
          <span>Licensing</span>
          <span>Sponsorship</span>
          <span>Developers</span>
        </div>

        <div class="site-footer-copy">© 2026 Corvianth.org</div>
      </div>
    `;
    return footer;
  }

  function appendFooter() {
    if (!document.body) return;
    if (document.getElementById(FOOTER_ID)) return;
    document.body.appendChild(buildFooter());
  }

  function createScrollTopButton() {
    const button = document.createElement("button");
    button.id = SCROLL_TOP_ID;
    button.type = "button";
    button.className = "float-btn is-auto";
    button.setAttribute("aria-label", "Volver arriba");
    button.title = "Volver arriba";
    button.innerHTML = "&uarr;";
    return button;
  }

  function bindScrollTopButton(button) {
    if (!button || button.dataset.scrollTopBound === "true") return;

    button.dataset.scrollTopBound = "true";
    button.classList.add("is-auto");

    const updateVisibility = () => {
      const isVisible = global.scrollY > 280;
      button.classList.toggle("is-visible", isVisible);
    };

    button.addEventListener("click", () => {
      global.scrollTo({ top: 0, behavior: "smooth" });
    });

    global.addEventListener("scroll", updateVisibility, { passive: true });
    global.addEventListener("resize", updateVisibility);
    updateVisibility();
  }

  function ensureScrollTopButton() {
    if (!document.body) return;

    let button = document.getElementById(SCROLL_TOP_ID);
    if (!button) {
      button = createScrollTopButton();
      document.body.appendChild(button);
    }

    bindScrollTopButton(button);
  }

  function initLayoutEnhancements() {
    appendFooter();
    ensureScrollTopButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLayoutEnhancements);
  } else {
    initLayoutEnhancements();
  }
})(window);
