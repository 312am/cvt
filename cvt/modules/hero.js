(function registerHeroModule(global) {
  const registry = (global.CorvianthModules = global.CorvianthModules || {});

  function createEditableNode(tag, className, value, placeholder, onInput) {
    const node = document.createElement(tag);
    node.className = className;
    node.contentEditable = "true";
    node.spellcheck = true;
    node.dataset.placeholder = placeholder;
    node.textContent = value || "";
    node.addEventListener("input", () => onInput(node.textContent));
    return node;
  }

  function createField(label, value, onInput) {
    const wrapper = document.createElement("label");
    wrapper.className = "studio-field";

    const title = document.createElement("span");
    title.className = "studio-field-label";
    title.textContent = label;
    wrapper.appendChild(title);

    const input = document.createElement("input");
    input.className = "studio-input";
    input.value = value || "";
    input.addEventListener("input", (event) => onInput(event.target.value));
    wrapper.appendChild(input);

    return wrapper;
  }

  registry.hero = {
    type: "hero",
    label: "Hero",
    description: "Cabecera principal con titulo, autor, fecha y tags.",
    createDefaultData(article) {
      return {
        eyebrow: "Guias / Nuevo articulo",
        title: article?.meta?.title || "Nuevo tema clinico",
        entryPrefix: "Por",
        author: article?.meta?.author || "Corvianth",
        date: article?.meta?.date || "14 de abril de 2026",
        tags: [...(article?.meta?.tags || ["Nuevo", "Borrador"])],
      };
    },
    renderDisplay(data) {
      const section = document.createElement("section");
      section.className = "hero";
      section.innerHTML = `
        <div class="eyebrow">${data.eyebrow || ""}</div>
        <div class="hero-grid hero-grid-single">
          <div>
            <h1>${data.title || ""}</h1>
            <p class="hero-sub">
              <span>${data.entryPrefix || "Por"}</span>
              <span class="author-link">${data.author || ""}</span>
            </p>
            <div class="meta">
              <span class="meta-date">${data.date || ""}</span>
              ${(data.tags || [])
                .map((tag) => `<span class="tag">${tag}</span>`)
                .join("")}
            </div>
          </div>
        </div>
      `;
      return section;
    },
    renderEditable(data, context) {
      const safeData = {
        eyebrow: data.eyebrow || "",
        title: data.title || "",
        entryPrefix: data.entryPrefix || "Por",
        author: data.author || "",
        date: data.date || "",
        tags: Array.isArray(data.tags) ? [...data.tags] : [],
      };

      const section = document.createElement("section");
      section.className = "hero";

      const eyebrow = createEditableNode(
        "div",
        "eyebrow",
        safeData.eyebrow,
        "Eyebrow del artículo",
        (next) => {
          safeData.eyebrow = next;
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        }
      );

      const grid = document.createElement("div");
      grid.className = "hero-grid hero-grid-single";
      const content = document.createElement("div");

      const title = createEditableNode(
        "h1",
        "editable-hero-title",
        safeData.title,
        "Título principal",
        (next) => {
          safeData.title = next;
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        }
      );

      const sub = document.createElement("p");
      sub.className = "hero-sub";
      const prefix = createEditableNode(
        "span",
        "editable-inline",
        safeData.entryPrefix,
        "Por",
        (next) => {
          safeData.entryPrefix = next;
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        }
      );
      const author = createEditableNode(
        "span",
        "author-link editable-inline",
        safeData.author,
        "Autor",
        (next) => {
          safeData.author = next;
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        }
      );
      sub.appendChild(prefix);
      sub.appendChild(document.createTextNode(" "));
      sub.appendChild(author);

      const meta = document.createElement("div");
      meta.className = "meta";
      const date = createEditableNode(
        "span",
        "meta-date editable-inline",
        safeData.date,
        "Fecha",
        (next) => {
          safeData.date = next;
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        }
      );
      const tags = createEditableNode(
        "span",
        "editable-tags-inline",
        safeData.tags.join(", "),
        "Tags separados por coma",
        (next) => {
          safeData.tags = next
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        }
      );
      meta.appendChild(date);
      meta.appendChild(tags);

      content.appendChild(title);
      content.appendChild(sub);
      content.appendChild(meta);
      grid.appendChild(content);

      section.appendChild(eyebrow);
      section.appendChild(grid);
      return section;
    },
    renderEditor(data, context) {
      const container = document.createElement("div");
      container.className = "studio-form";

      function update(patch) {
        context.onChange({
          ...data,
          ...patch,
        });
      }

      container.appendChild(
        createField("Eyebrow", data.eyebrow, (value) => update({ eyebrow: value }))
      );
      container.appendChild(
        createField("Titulo", data.title, (value) => update({ title: value }))
      );
      container.appendChild(
        createField("Prefijo", data.entryPrefix, (value) =>
          update({ entryPrefix: value })
        )
      );
      container.appendChild(
        createField("Autor", data.author, (value) => update({ author: value }))
      );
      container.appendChild(
        createField("Fecha", data.date, (value) => update({ date: value }))
      );
      container.appendChild(
        createField("Tags (coma separada)", (data.tags || []).join(", "), (value) =>
          update({
            tags: value
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          })
        )
      );

      return container;
    },
  };
})(window);
