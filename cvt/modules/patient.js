(function registerPatientModule(global) {
  const registry = (global.CorvianthModules = global.CorvianthModules || {});
  const MODULE_ICON = `
    <svg class="icon-sm" viewBox="0 0 40 40" fill="#a3e635" aria-hidden="true">
      <path d="M20.01,0C8.95,0,0,8.95,0,20c0,3.88,1.1,7.48,3.01,10.54,1.37,2.21,3.17,4.14,5.29,5.67,3.3,2.38,7.33,3.79,11.71,3.79,11.04,0,19.99-8.95,19.99-20S31.05,0,20.01,0ZM20.01,35.23c-3.33,0-6.4-1.07-8.91-2.88-1.61-1.16-2.99-2.63-4.03-4.31-1.45-2.33-2.28-5.08-2.28-8.03,0-8.4,6.81-15.22,15.22-15.22s15.22,6.82,15.22,15.22-6.81,15.22-15.22,15.22Z"/>
      <path d="M25.22,19.48h-4.13v-8.64c0-.55-.45-1-1-1h-1.68c-.55,0-1,.45-1,1v9.44s.02.06.02.1c0,.03-.02.06-.02.1v1.61c0,.55.45,1,1,1h6.82c.55,0,1-.45,1-1v-1.61c0-.55-.45-1-1-1Z"/>
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

  registry.patient = {
    type: "patient",
    label: "Presentacion del paciente",
    description: "Bloque de resumen clinico y metadatos del paciente.",
    createDefaultData() {
      return {
        title: "Presentacion del paciente",
        summary:
          "Paciente con dolor localizado y evolucion subaguda. Escribe aqui el contexto clinico inicial.",
        age: "42 anos",
        sex: "Masculino",
        reason: "Dolor articular",
        side: "Derecho",
      };
    },
    renderDisplay(data) {
      const section = document.createElement("section");
      section.className = "module module--accent patient-module";
      section.innerHTML = `
        <div class="module-head">${MODULE_ICON}${
          data.title || "Presentacion del paciente"
        }</div>
        <div class="module-body">
          <div class="patient-card">
            <div class="patient-summary">
              <div class="text-block">${data.summary || ""}</div>
            </div>
            <div class="patient-meta-grid">
              <div class="patient-meta-item">
                <div class="patient-meta-label">Edad</div>
                <div class="patient-meta-value">${data.age || ""}</div>
              </div>
              <div class="patient-meta-item">
                <div class="patient-meta-label">Sexo</div>
                <div class="patient-meta-value">${data.sex || ""}</div>
              </div>
              <div class="patient-meta-item">
                <div class="patient-meta-label">Motivo</div>
                <div class="patient-meta-value">${data.reason || ""}</div>
              </div>
              <div class="patient-meta-item">
                <div class="patient-meta-label">Lado</div>
                <div class="patient-meta-value">${data.side || ""}</div>
              </div>
            </div>
          </div>
        </div>
      `;
      return section;
    },
    renderEditable(data, context) {
      const safeData = {
        title: data.title || "Presentacion del paciente",
        summary: data.summary || "",
        age: data.age || "",
        sex: data.sex || "",
        reason: data.reason || "",
        side: data.side || "",
      };

      const section = document.createElement("section");
      section.className = "module module--accent patient-module";

      const head = document.createElement("div");
      head.className = "module-head";
      head.insertAdjacentHTML("beforeend", MODULE_ICON);
      head.appendChild(
        createEditableNode(
          "h2",
          "editable-module-title",
          safeData.title,
          "Titulo del bloque",
          (next) => {
            safeData.title = next;
            context.onChange({ ...safeData }, { rerenderCanvas: false });
          }
        )
      );

      const body = document.createElement("div");
      body.className = "module-body";

      const card = document.createElement("div");
      card.className = "patient-card";

      const summaryWrap = document.createElement("div");
      summaryWrap.className = "patient-summary";
      summaryWrap.appendChild(
        createEditableNode(
          "div",
          "editable-paragraph",
          safeData.summary,
          "Resumen del paciente",
          (next) => {
            safeData.summary = next;
            context.onChange({ ...safeData }, { rerenderCanvas: false });
          }
        )
      );

      const metaGrid = document.createElement("div");
      metaGrid.className = "patient-meta-grid";

      const fields = [
        { key: "age", label: "Edad", placeholder: "Edad" },
        { key: "sex", label: "Sexo", placeholder: "Sexo" },
        { key: "reason", label: "Motivo", placeholder: "Motivo de consulta" },
        { key: "side", label: "Lado", placeholder: "Lado afectado" },
      ];

      fields.forEach((field) => {
        const item = document.createElement("div");
        item.className = "patient-meta-item";

        const label = document.createElement("div");
        label.className = "patient-meta-label";
        label.textContent = field.label;

        const value = createEditableNode(
          "div",
          "patient-meta-value editable-inline",
          safeData[field.key],
          field.placeholder,
          (next) => {
            safeData[field.key] = next;
            context.onChange({ ...safeData }, { rerenderCanvas: false });
          }
        );

        item.appendChild(label);
        item.appendChild(value);
        metaGrid.appendChild(item);
      });

      card.appendChild(summaryWrap);
      card.appendChild(metaGrid);
      body.appendChild(card);
      section.appendChild(head);
      section.appendChild(body);
      return section;
    },
  };
})(window);
