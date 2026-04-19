(function registerKeyPointModule(global) {
  const registry = (global.CorvianthModules = global.CorvianthModules || {});
  const MODULE_ICON = `
    <svg class="icon-sm" viewBox="0 0 54 60" fill="#a3e635" aria-hidden="true">
      <path d="M53,40.73l-18.48-10.73,18.48-10.73c.95-.55,1.28-1.78.73-2.73l-1.77-3.08c-.55-.96-1.77-1.28-2.72-.73l-18.48,10.73V2C30.76.9,29.87,0,28.76,0h-3.52C24.13,0,23.24.9,23.24,2v21.45L4.76,12.73c-.95-.55-2.17-.22-2.72.73l-1.77,3.08c-.55.96-.22,2.18.73,2.73l18.48,10.73L1,40.73c-.95.55-1.28,1.78-.73,2.73l1.77,3.08c.55.96,1.77,1.28,2.72.73l18.48-10.73v21.45c0,1.1.9,2,2,2h3.52c1.1,0,2-.9,2-2v-21.45l18.48,10.73c.95.55,2.17.22,2.72-.73l1.77-3.08c.55-.96.22-2.18-.73-2.73Z"/>
    </svg>
  `;

  function createEditableNode(
    tag,
    className,
    value,
    placeholder,
    onInput,
    options = {}
  ) {
    const node = document.createElement(tag);
    node.className = className;
    node.contentEditable = "true";
    node.spellcheck = true;
    node.dataset.placeholder = placeholder;
    if (options.richText) {
      node.dataset.richText = "true";
      node.innerHTML = value || "";
    } else {
      node.textContent = value || "";
    }
    node.addEventListener("input", () =>
      onInput(options.richText ? node.innerHTML : node.textContent)
    );
    return node;
  }

  registry["key-point"] = {
    type: "key-point",
    label: "Punto clave",
    description: "Bloque destacado con frase central.",
    createDefaultData() {
      return {
        title: "Punto clave",
        quote:
          "Antes de concluir un diagnostico, confirma planos ortogonales y correlacion clinica.",
        footer: "Regla editorial",
      };
    },
    renderDisplay(data) {
      const section = document.createElement("section");
      section.className = "quote-box";
      section.innerHTML = `
        <div class="quote-head">${MODULE_ICON}${data.title || "Punto clave"}</div>
        <blockquote>${data.quote || ""}</blockquote>
        <div class="quote-foot">${data.footer || ""}</div>
      `;
      return section;
    },
    renderEditable(data, context) {
      const safeData = {
        title: data.title || "Punto clave",
        quote: data.quote || "",
        footer: data.footer || "",
      };

      const section = document.createElement("section");
      section.className = "quote-box";

      const head = document.createElement("div");
      head.className = "quote-head";
      head.insertAdjacentHTML("beforeend", MODULE_ICON);
      head.appendChild(
        createEditableNode(
          "span",
          "editable-inline",
          safeData.title,
          "Titulo del bloque",
          (next) => {
            safeData.title = next;
            context.onChange({ ...safeData }, { rerenderCanvas: false });
          },
          { richText: true }
        )
      );

      const quote = createEditableNode(
        "blockquote",
        "editable-key-point-quote",
        safeData.quote,
        "Escribe la frase clave",
        (next) => {
          safeData.quote = next;
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        },
        { richText: true }
      );

      const foot = createEditableNode(
        "div",
        "quote-foot editable-inline",
        safeData.footer,
        "Fuente o nota final",
        (next) => {
          safeData.footer = next;
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        },
        { richText: true }
      );

      section.appendChild(head);
      section.appendChild(quote);
      section.appendChild(foot);
      return section;
    },
  };
})(window);
