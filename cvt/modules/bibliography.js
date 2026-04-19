(function registerBibliographyModule(global) {
  const registry = (global.CorvianthModules = global.CorvianthModules || {});
  const MODULE_ICON = `
    <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#a3e635" stroke-width="2">
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
    </svg>
  `;

  function normalizeItems(items) {
    if (!Array.isArray(items) || !items.length) {
      return [{ text: "", url: "" }];
    }
    return items.map((item) => ({
      text: item?.text || "",
      url: item?.url || "",
    }));
  }

  function createEditableText(value, placeholder, onInput) {
    const node = document.createElement("div");
    node.className = "editable-paragraph bibliography-edit-text";
    node.contentEditable = "true";
    node.spellcheck = true;
    node.dataset.richText = "true";
    node.dataset.placeholder = placeholder;
    node.innerHTML = value || "";
    node.addEventListener("input", () => onInput(node.innerHTML));
    return node;
  }

  function createEditableHeading(value, placeholder, onInput) {
    const node = document.createElement("h2");
    node.className = "editable-module-title";
    node.contentEditable = "true";
    node.spellcheck = true;
    node.dataset.richText = "true";
    node.dataset.placeholder = placeholder;
    node.innerHTML = value || "";
    node.addEventListener("input", () => onInput(node.innerHTML));
    return node;
  }

  registry.bibliography = {
    type: "bibliography",
    label: "Bibliografia",
    description: "Referencias bibliograficas para el cierre del articulo.",
    createDefaultData() {
      return {
        title: "Bibliografia",
        items: [
          {
            text: "Autor A, Autor B. Titulo del estudio. Revista. 2024;12(3):100-110.",
            url: "",
          },
        ],
      };
    },
    renderDisplay(data) {
      const safeData = {
        title: data?.title || "Bibliografia",
        items: normalizeItems(data?.items),
      };

      const itemsMarkup = safeData.items
        .filter((item) => (item.text || "").trim())
        .map((item) => {
          const url = (item.url || "").trim();
          return `
            <li class="bibliography-item">
              <span class="bibliography-citation">${item.text}</span>
              ${
                url
                  ? `<a class="bibliography-link" href="${url}" target="_blank" rel="noopener noreferrer">Abrir fuente</a>`
                  : ""
              }
            </li>
          `;
        })
        .join("");

      const section = document.createElement("section");
      section.className = "module bibliography-module";
      section.innerHTML = `
        <div class="module-head">${MODULE_ICON}${safeData.title}</div>
        <div class="module-body">
          ${
            itemsMarkup
              ? `<ol class="bibliography-list">${itemsMarkup}</ol>`
              : `<p class="copy">No hay referencias agregadas.</p>`
          }
        </div>
      `;
      return section;
    },
    renderEditable(data, context) {
      const safeData = {
        title: data?.title || "Bibliografia",
        items: normalizeItems(data?.items),
      };

      const section = document.createElement("section");
      section.className = "module bibliography-module";

      const head = document.createElement("div");
      head.className = "module-head";
      head.insertAdjacentHTML("beforeend", MODULE_ICON);
      head.appendChild(
        createEditableHeading(
          safeData.title,
          "Titulo del modulo",
          (nextTitle) => {
            safeData.title = nextTitle;
            context.onChange({ ...safeData }, { rerenderCanvas: false });
          }
        )
      );
      section.appendChild(head);

      const body = document.createElement("div");
      body.className = "module-body content-stack";

      const list = document.createElement("ol");
      list.className = "bibliography-list editable-bibliography-list";

      function renderItems() {
        list.innerHTML = "";

        safeData.items.forEach((item, index) => {
          const li = document.createElement("li");
          li.className = "bibliography-item editable-bibliography-item";

          const citation = createEditableText(
            item.text,
            "Referencia bibliografica",
            (nextText) => {
              safeData.items[index] = {
                ...safeData.items[index],
                text: nextText,
              };
              context.onChange(
                { ...safeData, items: [...safeData.items] },
                { rerenderCanvas: false }
              );
            }
          );

          const urlWrap = document.createElement("label");
          urlWrap.className = "studio-field";
          urlWrap.innerHTML = `<span class="studio-field-label">URL / DOI (opcional)</span>`;
          const urlInput = document.createElement("input");
          urlInput.type = "url";
          urlInput.className = "studio-input";
          urlInput.placeholder = "https://...";
          urlInput.value = item.url || "";
          urlInput.addEventListener("input", (event) => {
            safeData.items[index] = {
              ...safeData.items[index],
              url: event.target.value,
            };
            context.onChange(
              { ...safeData, items: [...safeData.items] },
              { rerenderCanvas: false }
            );
          });
          urlWrap.appendChild(urlInput);

          const controls = document.createElement("div");
          controls.className = "editable-subsection-controls";

          const upBtn = document.createElement("button");
          upBtn.type = "button";
          upBtn.className = "studio-outline-btn";
          upBtn.innerHTML = "&#8593;";
          upBtn.title = "Subir referencia";
          upBtn.addEventListener("click", () => {
            if (index <= 0) return;
            [safeData.items[index - 1], safeData.items[index]] = [
              safeData.items[index],
              safeData.items[index - 1],
            ];
            context.onChange(
              { ...safeData, items: [...safeData.items] },
              { rerenderCanvas: true }
            );
          });

          const downBtn = document.createElement("button");
          downBtn.type = "button";
          downBtn.className = "studio-outline-btn";
          downBtn.innerHTML = "&#8595;";
          downBtn.title = "Bajar referencia";
          downBtn.addEventListener("click", () => {
            if (index >= safeData.items.length - 1) return;
            [safeData.items[index + 1], safeData.items[index]] = [
              safeData.items[index],
              safeData.items[index + 1],
            ];
            context.onChange(
              { ...safeData, items: [...safeData.items] },
              { rerenderCanvas: true }
            );
          });

          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "studio-outline-btn";
          removeBtn.innerHTML = "&times;";
          removeBtn.title = "Quitar referencia";
          removeBtn.addEventListener("click", () => {
            if (safeData.items.length === 1) {
              safeData.items[0] = { text: "", url: "" };
            } else {
              safeData.items = safeData.items.filter((_, itemIndex) => itemIndex !== index);
            }
            context.onChange(
              { ...safeData, items: [...safeData.items] },
              { rerenderCanvas: true }
            );
          });

          controls.appendChild(upBtn);
          controls.appendChild(downBtn);
          controls.appendChild(removeBtn);

          li.appendChild(citation);
          li.appendChild(urlWrap);
          li.appendChild(controls);
          list.appendChild(li);
        });
      }

      renderItems();
      body.appendChild(list);

      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "hero-btn accent";
      addBtn.textContent = "Agregar referencia";
      addBtn.addEventListener("click", () => {
        safeData.items.push({ text: "", url: "" });
        context.onChange(
          { ...safeData, items: [...safeData.items] },
          { rerenderCanvas: true }
        );
      });
      body.appendChild(addBtn);

      section.appendChild(body);
      return section;
    },
  };
})(window);
