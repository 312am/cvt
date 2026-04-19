(function registerTextOnlyModule(global) {
  const registry = (global.CorvianthModules = global.CorvianthModules || {});
  const MODULE_ICON = `
    <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#a3e635" stroke-width="2">
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
    </svg>
  `;
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

  registry["text-only"] = {
    type: "text-only",
    label: "Texto",
    description: "Bloque de texto simple sin crear nueva seccion.",
    createDefaultData() {
      return {
        body: "Escribe aqui texto continuo para extender la seccion actual.",
      };
    },
    renderDisplay(data) {
      const section = document.createElement("section");
      section.className = "module module--compact";
      section.innerHTML = `
        <div class="module-body">
          <div class="text-block">${data.body || ""}</div>
        </div>
      `;
      return section;
    },
    renderEditable(data, context) {
      const safeData = {
        body: data.body || "",
      };

      const section = document.createElement("section");
      section.className = "module module--compact editable-text-only-module";

      const body = document.createElement("div");
      body.className = "module-body content-stack";

      const row = document.createElement("div");
      row.className = "editable-subsection-row";

      const paragraph = createEditableParagraph(
        safeData.body,
        "Texto del bloque",
        (nextBody) => {
          safeData.body = nextBody;
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        }
      );

      const iconWrap = document.createElement("div");
      iconWrap.className = "studio-inline-tools";
      iconWrap.innerHTML = MODULE_ICON;

      row.appendChild(paragraph);
      row.appendChild(iconWrap);
      body.appendChild(row);
      section.appendChild(body);
      return section;
    },
  };
})(window);
