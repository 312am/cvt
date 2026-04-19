(function registerPitfallsModule(global) {
  const registry = (global.CorvianthModules = global.CorvianthModules || {});
  const MODULE_ICON = `
    <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="var(--warning-accent)" stroke-width="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  `;

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

  registry.pitfalls = {
    type: "pitfalls",
    label: "Pitfalls",
    description: "Bloque de advertencias, errores frecuentes y checklist.",
    createDefaultData() {
      return {
        title: "Pitfalls",
        warningTitle: "Errores frecuentes de interpretacion",
        items: [
          "Primer error frecuente.",
          "Segundo error frecuente.",
          "Tercer error frecuente.",
        ],
        checklist: "Checklist final del bloque.",
      };
    },
    renderDisplay(data) {
      const section = document.createElement("section");
      section.className = "module module--warning";
      section.innerHTML = `
        <div class="module-head">${MODULE_ICON}${data.title || "Pitfalls"}</div>
        <div class="module-body content-stack">
          <div class="subsection-block">
            <div class="warning-box">
              <h3 class="warning-title">${data.warningTitle || ""}</h3>
              <ul class="warning-list">
                ${(data.items || []).map((item) => `<li>${item}</li>`).join("")}
              </ul>
            </div>
          </div>
          <div class="subsection-block">
            <h3 class="subsection-title">Checklist previo</h3>
            <div class="note-inline">${data.checklist || ""}</div>
          </div>
        </div>
      `;
      return section;
    },
    renderEditable(data, context) {
      const safeData = {
        title: data.title || "Pitfalls",
        warningTitle: data.warningTitle || "",
        items: Array.isArray(data.items) && data.items.length ? [...data.items] : [""],
        checklist: data.checklist || "",
      };

      const section = document.createElement("section");
      section.className = "module module--warning";

      const head = document.createElement("div");
      head.className = "module-head";
      head.insertAdjacentHTML("beforeend", MODULE_ICON);
      head.appendChild(
        createEditableNode(
          "h2",
          "editable-module-title",
          safeData.title,
          "Título del módulo",
          (next) => {
            safeData.title = next;
            context.onChange({ ...safeData }, { rerenderCanvas: false });
          }
        )
      );

      const body = document.createElement("div");
      body.className = "module-body content-stack";

      const warningBlock = document.createElement("div");
      warningBlock.className = "subsection-block";

      const warningBox = document.createElement("div");
      warningBox.className = "warning-box";
      warningBox.appendChild(
        createEditableNode(
          "h3",
          "warning-title",
          safeData.warningTitle,
          "Título de advertencia",
          (next) => {
            safeData.warningTitle = next;
            context.onChange({ ...safeData }, { rerenderCanvas: false });
          }
        )
      );

      const list = document.createElement("ul");
      list.className = "warning-list editable-pitfall-list";

      function renderItems() {
        list.innerHTML = "";
        safeData.items.forEach((item, index) => {
          const li = document.createElement("li");
          const row = document.createElement("div");
          row.className = "editable-pitfall-item-row";

          const text = createEditableNode(
            "span",
            "editable-inline",
            item,
            "Error frecuente",
            (next) => {
              safeData.items[index] = next;
              context.onChange({ ...safeData, items: [...safeData.items] }, { rerenderCanvas: false });
            }
          );

          const controls = document.createElement("span");
          controls.className = "editable-subsection-controls";

          const upBtn = document.createElement("button");
          upBtn.type = "button";
          upBtn.className = "studio-outline-btn";
          upBtn.innerHTML = "&#8593;";
          upBtn.title = "Subir";
          upBtn.addEventListener("click", () => {
            if (index <= 0) return;
            [safeData.items[index - 1], safeData.items[index]] = [
              safeData.items[index],
              safeData.items[index - 1],
            ];
            context.onChange({ ...safeData, items: [...safeData.items] }, { rerenderCanvas: true });
          });

          const downBtn = document.createElement("button");
          downBtn.type = "button";
          downBtn.className = "studio-outline-btn";
          downBtn.innerHTML = "&#8595;";
          downBtn.title = "Bajar";
          downBtn.addEventListener("click", () => {
            if (index >= safeData.items.length - 1) return;
            [safeData.items[index + 1], safeData.items[index]] = [
              safeData.items[index],
              safeData.items[index + 1],
            ];
            context.onChange({ ...safeData, items: [...safeData.items] }, { rerenderCanvas: true });
          });

          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "studio-outline-btn";
          removeBtn.innerHTML = "&times;";
          removeBtn.title = "Eliminar";
          removeBtn.addEventListener("click", () => {
            if (safeData.items.length === 1) {
              safeData.items[0] = "";
            } else {
              safeData.items = safeData.items.filter((_, itemIndex) => itemIndex !== index);
            }
            context.onChange({ ...safeData, items: [...safeData.items] }, { rerenderCanvas: true });
          });

          controls.appendChild(upBtn);
          controls.appendChild(downBtn);
          controls.appendChild(removeBtn);
          row.appendChild(text);
          row.appendChild(controls);
          li.appendChild(row);
          list.appendChild(li);
        });
      }

      renderItems();
      warningBox.appendChild(list);
      warningBlock.appendChild(warningBox);

      const addItem = document.createElement("button");
      addItem.type = "button";
      addItem.className = "hero-btn accent";
      addItem.textContent = "Agregar error";
      addItem.addEventListener("click", () => {
        safeData.items.push("");
        context.onChange({ ...safeData, items: [...safeData.items] }, { rerenderCanvas: true });
      });
      warningBlock.appendChild(addItem);

      const checklistBlock = document.createElement("div");
      checklistBlock.className = "subsection-block";

      const checklistTitle = document.createElement("h3");
      checklistTitle.className = "subsection-title";
      checklistTitle.textContent = "Checklist previo";

      const checklistBody = createEditableNode(
        "div",
        "note-inline",
        safeData.checklist,
        "Checklist del bloque",
        (next) => {
          safeData.checklist = next;
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        }
      );

      checklistBlock.appendChild(checklistTitle);
      checklistBlock.appendChild(checklistBody);

      body.appendChild(warningBlock);
      body.appendChild(checklistBlock);
      section.appendChild(head);
      section.appendChild(body);
      return section;
    },
    renderEditor(data, context) {
      const container = document.createElement("div");
      container.className = "studio-form";

      const fields = [
        {
          label: "Titulo del modulo",
          value: data.title || "",
          key: "title",
          type: "input",
        },
        {
          label: "Titulo de advertencia",
          value: data.warningTitle || "",
          key: "warningTitle",
          type: "input",
        },
        {
          label: "Errores frecuentes (una linea por item)",
          value: (data.items || []).join("\n"),
          key: "items",
          type: "textarea",
        },
        {
          label: "Checklist",
          value: data.checklist || "",
          key: "checklist",
          type: "textarea",
        },
      ];

      fields.forEach((field) => {
        const wrapper = document.createElement("label");
        wrapper.className = "studio-field";
        wrapper.innerHTML = `<span class="studio-field-label">${field.label}</span>`;

        const control =
          field.type === "textarea"
            ? document.createElement("textarea")
            : document.createElement("input");

        control.className =
          field.type === "textarea" ? "studio-textarea" : "studio-input";
        control.value = field.value;
        if (field.type === "textarea") {
          control.rows = field.key === "items" ? 5 : 4;
        }

        control.addEventListener("input", (event) => {
          const nextValue =
            field.key === "items"
              ? event.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean)
              : event.target.value;

          context.onChange({
            ...data,
            [field.key]: nextValue,
          });
        });

        wrapper.appendChild(control);
        container.appendChild(wrapper);
      });

      return container;
    },
  };
})(window);
