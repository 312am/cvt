(function registerSubtitleModule(global) {
  const registry = (global.CorvianthModules = global.CorvianthModules || {});
  const MODULE_ICON = `
    <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#a3e635" stroke-width="2">
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
    </svg>
  `;
  function createEditableHeading(value, placeholder, onInput) {
    const node = document.createElement("h3");
    node.className = "subsection-title editable-subtitle";
    node.contentEditable = "true";
    node.spellcheck = true;
    node.dataset.placeholder = placeholder;
    node.dataset.richText = "true";
    node.innerHTML = value || "";
    node.addEventListener("input", () => onInput(node.innerHTML));
    return node;
  }

  function createEditableParagraph(value, placeholder, onInput) {
    const node = document.createElement("div");
    node.className = "editable-paragraph";
    node.contentEditable = "true";
    node.spellcheck = true;
    node.dataset.placeholder = placeholder;
    node.dataset.richText = "true";
    node.innerHTML = value || "";
    node.addEventListener("input", () => onInput(node.innerHTML));
    return node;
  }

  registry.subtitle = {
    type: "subtitle",
    label: "Subtitulo",
    description: "Bloque ligero con subtitulo y texto, sin seccion nueva.",
    createDefaultData() {
      return {
        subtitle: "Nuevo subtitulo",
        body: "Escribe aqui el texto asociado a este subtitulo.",
      };
    },
    renderDisplay(data) {
      const section = document.createElement("section");
      section.className = "module module--compact";
      section.innerHTML = `
        <div class="module-body content-stack">
          <article class="subsection-block">
            <h3 class="subsection-title">${data.subtitle || ""}</h3>
            <div class="text-block">${data.body || ""}</div>
          </article>
        </div>
      `;
      return section;
    },
    renderEditable(data, context) {
      const safeData = {
        subtitle: data.subtitle || "",
        body: data.body || "",
      };

      const section = document.createElement("section");
      section.className = "module module--compact editable-subtitle-module";

      const body = document.createElement("div");
      body.className = "module-body content-stack";

      const block = document.createElement("article");
      block.className = "subsection-block editable-subsection-block";

      const row = document.createElement("div");
      row.className = "editable-subsection-row";

      const subtitle = createEditableHeading(
        safeData.subtitle,
        "Subtitulo",
        (nextSubtitle) => {
          safeData.subtitle = nextSubtitle;
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        }
      );

      const iconWrap = document.createElement("div");
      iconWrap.className = "studio-inline-tools";
      iconWrap.innerHTML = MODULE_ICON;

      row.appendChild(subtitle);
      row.appendChild(iconWrap);

      const paragraph = createEditableParagraph(
        safeData.body,
        "Texto del subtitulo",
        (nextBody) => {
          safeData.body = nextBody;
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        }
      );

      block.appendChild(row);
      block.appendChild(paragraph);
      body.appendChild(block);
      section.appendChild(body);
      return section;
    },
  };
})(window);
