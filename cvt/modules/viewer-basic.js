(function registerViewerBasicModule(global) {
  const registry = (global.CorvianthModules = global.CorvianthModules || {});
  const MODULE_ICON = `
    <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#a3e635" stroke-width="2">
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
    </svg>
  `;
  const STAGE_ICON = `
    <svg class="icon-sm" viewBox="0 0 40 25" fill="#a3e635" aria-hidden="true">
      <path d="M39.98,1.21s-.01-.02-.01-.03c-.02-.09-.06-.18-.09-.26-.04-.09-.09-.19-.15-.26h-.01c-.05-.09-.12-.17-.19-.23-.15-.14-.33-.24-.53-.32-.19-.08-.41-.12-.63-.11h-2.76s-.16.01-.16.01l-18.47.09c-.9.01-1.65.69-1.65,1.53l-.02,2.7c0,.83.73,1.51,1.64,1.5l11.83-.06-12.63,12.44-15.48.08c-.36,0-.67.8-.67,1.78v3.16c0,.98.3,1.77.66,1.77l17.43-.11h.44c.42-.04.84-.22,1.17-.55l.15-.15,14.29-14.07v1.03l-.06,12.23c-.01.9.68,1.62,1.53,1.62l2.74-.02c.85,0,1.55-.73,1.55-1.63l.09-18.37v-2.72s0-.76,0-.76c0-.09,0-.2-.02-.29Z"/>
    </svg>
  `;

  function normalizeStudies(studies) {
    if (!Array.isArray(studies) || !studies.length) {
      return [];
    }

    return studies.map((study, index) => ({
      id: study.id || `study-${index + 1}`,
      modality: study.modality || "US",
      plane: study.plane || "Longitudinal",
      series: study.series || "Serie",
      detail: study.detail || "Sin contraste",
      previewTone: study.previewTone || "tone-1",
      totalFrames: Math.max(1, Number(study.totalFrames) || 1),
      defaultFrame: Math.max(0, Number(study.defaultFrame) || 0),
    }));
  }

  function createJsonEditorField(label, value, onApply) {
    const wrapper = document.createElement("div");
    wrapper.className = "studio-field";

    const labelNode = document.createElement("span");
    labelNode.className = "studio-field-label";
    labelNode.textContent = label;

    const textarea = document.createElement("textarea");
    textarea.className = "studio-textarea";
    textarea.rows = 9;
    textarea.value = JSON.stringify(value, null, 2);

    const message = document.createElement("div");
    message.className = "studio-muted";
    message.textContent = "JSON valido";

    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "hero-btn";
    applyBtn.textContent = "Aplicar JSON";
    applyBtn.addEventListener("click", () => {
      try {
        const parsed = JSON.parse(textarea.value);
        onApply(parsed);
        message.textContent = "JSON aplicado";
      } catch (error) {
        message.textContent = "JSON invalido";
      }
    });

    wrapper.appendChild(labelNode);
    wrapper.appendChild(textarea);
    wrapper.appendChild(applyBtn);
    wrapper.appendChild(message);
    return wrapper;
  }

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

  registry["viewer-basic"] = {
    type: "viewer-basic",
    label: "Visor basico",
    description: "Visor modular sin texto vinculado.",
    createDefaultData() {
      return {
        title: "Visor principal",
        stageLabel: "Modulo visual",
        studies: [
          {
            id: "vb-1",
            modality: "US",
            plane: "Longitudinal",
            series: "Supraespinoso",
            detail: "Sin contraste",
            previewTone: "tone-1",
            totalFrames: 4,
            defaultFrame: 0,
          },
          {
            id: "vb-2",
            modality: "US",
            plane: "Transversal",
            series: "Supraespinoso",
            detail: "Sin contraste",
            previewTone: "tone-2",
            totalFrames: 3,
            defaultFrame: 0,
          },
          {
            id: "vb-3",
            modality: "MRI",
            plane: "Coronal",
            series: "STIR",
            detail: "Con contraste",
            previewTone: "tone-3",
            totalFrames: 5,
            defaultFrame: 0,
          },
        ],
      };
    },
    renderDisplay(data) {
      const studies = normalizeStudies(data.studies);
      const section = document.createElement("section");
      section.className = "module viewer-full-bleed-mobile";

      if (!studies.length) {
        section.innerHTML = `
          <div class="module-head">${data.title || "Visor basico"}</div>
          <div class="module-body">
            <div class="studio-empty">Este visor no tiene estudios configurados.</div>
          </div>
        `;
        return section;
      }

      section.innerHTML = `
        <div class="module-head">${MODULE_ICON}${data.title || "Visor basico"}</div>
        <div class="module-body">
          <div class="viewer">
            <div class="viewer-stage ${studies[0].previewTone}" data-role="stage">
              <div class="viewer-glow"></div>
              <div class="viewer-grid"></div>
              <div class="viewer-label">${data.stageLabel || "Modulo visual"}</div>
              <div class="viewer-meta" data-role="meta"></div>
              <div class="viewer-icon">${STAGE_ICON}</div>
              <div class="viewer-counter"><span data-role="counter"></span><span>&bull;&bull;&bull;</span></div>
            </div>
          </div>
          <div class="studies-row">
            <button class="studies-arrow" type="button" data-role="prev">&#8249;</button>
            <div class="studies-viewport">
              <div class="studies-track" data-role="track"></div>
            </div>
            <button class="studies-arrow" type="button" data-role="next">&#8250;</button>
          </div>
        </div>
      `;

      const stage = section.querySelector('[data-role="stage"]');
      const meta = section.querySelector('[data-role="meta"]');
      const counter = section.querySelector('[data-role="counter"]');
      const track = section.querySelector('[data-role="track"]');
      const prevBtn = section.querySelector('[data-role="prev"]');
      const nextBtn = section.querySelector('[data-role="next"]');
      const viewport = section.querySelector(".studies-viewport");
      let currentIndex = 0;

      function getActiveStudy() {
        return studies[currentIndex];
      }

      function applyStudy() {
        const study = getActiveStudy();
        const frame = Math.min(study.defaultFrame + 1, study.totalFrames);
        stage.className = `viewer-stage ${study.previewTone}`;
        meta.textContent = `${study.modality} | ${study.plane} | ${study.series}`;
        counter.textContent = `${frame}/${study.totalFrames}`;
      }

      function renderTrack() {
        track.innerHTML = "";
        studies.forEach((study, index) => {
          const card = document.createElement("button");
          card.type = "button";
          card.className = `study-card${index === currentIndex ? " active" : ""}`;
          card.innerHTML = `
            <div class="study-preview ${study.previewTone}"></div>
            <div class="study-meta">
              <div class="study-line-1">${study.modality} | ${study.plane}</div>
              <div class="study-line-2">${study.series}</div>
              <div class="study-line-3">${study.detail}</div>
            </div>
          `;
          card.addEventListener("click", () => {
            currentIndex = index;
            applyStudy();
            renderTrack();
          });
          track.appendChild(card);
        });
      }

      prevBtn.addEventListener("click", () => {
        viewport.scrollBy({ left: -180, behavior: "smooth" });
      });
      nextBtn.addEventListener("click", () => {
        viewport.scrollBy({ left: 180, behavior: "smooth" });
      });

      applyStudy();
      renderTrack();
      return section;
    },
    renderEditable(data, context) {
      const safeData = {
        title: data.title || "Visor básico",
        stageLabel: data.stageLabel || "Módulo visual",
        studies: normalizeStudies(data.studies),
      };

      const section = this.renderDisplay(safeData);

      const head = section.querySelector(".module-head");
      if (head) {
        head.innerHTML = "";
        head.insertAdjacentHTML("beforeend", MODULE_ICON);
        head.appendChild(
          createEditableNode(
            "h2",
            "editable-module-title",
            safeData.title,
            "Título del visor",
            (next) => {
              safeData.title = next;
              context.onChange({ ...safeData }, { rerenderCanvas: false });
            }
          )
        );
      }

      const stageLabel = section.querySelector(".viewer-label");
      if (stageLabel) {
        stageLabel.contentEditable = "true";
        stageLabel.spellcheck = true;
        stageLabel.dataset.placeholder = "Etiqueta del visor";
        stageLabel.addEventListener("input", () => {
          safeData.stageLabel = stageLabel.textContent || "";
          context.onChange({ ...safeData }, { rerenderCanvas: false });
        });
      }

      const body = section.querySelector(".module-body");
      if (body) {
        const details = document.createElement("details");
        details.className = "viewer-edit-panel";
        details.open = false;

        const summary = document.createElement("summary");
        summary.textContent = "Editar estructura del visor";

        const card = document.createElement("div");
        card.className = "studio-subcard";
        const jsonEditor = createJsonEditorField(
          "Estudios (JSON)",
          safeData.studies,
          (next) => {
            safeData.studies = normalizeStudies(next);
            context.onChange({ ...safeData }, { rerenderCanvas: true });
          }
        );
        card.appendChild(jsonEditor);
        details.appendChild(summary);
        details.appendChild(card);
        body.appendChild(details);
      }

      return section;
    },
    renderEditor(data, context) {
      const container = document.createElement("div");
      container.className = "studio-form";

      const titleWrap = document.createElement("label");
      titleWrap.className = "studio-field";
      titleWrap.innerHTML = '<span class="studio-field-label">Titulo del modulo</span>';
      const titleInput = document.createElement("input");
      titleInput.className = "studio-input";
      titleInput.value = data.title || "";
      titleInput.addEventListener("input", (event) => {
        context.onChange({
          ...data,
          title: event.target.value,
        });
      });
      titleWrap.appendChild(titleInput);
      container.appendChild(titleWrap);

      const stageWrap = document.createElement("label");
      stageWrap.className = "studio-field";
      stageWrap.innerHTML = '<span class="studio-field-label">Etiqueta en visor</span>';
      const stageInput = document.createElement("input");
      stageInput.className = "studio-input";
      stageInput.value = data.stageLabel || "";
      stageInput.addEventListener("input", (event) => {
        context.onChange({
          ...data,
          stageLabel: event.target.value,
        });
      });
      stageWrap.appendChild(stageInput);
      container.appendChild(stageWrap);

      container.appendChild(
        createJsonEditorField("Estudios (JSON)", normalizeStudies(data.studies), (next) => {
          context.onChange({
            ...data,
            studies: normalizeStudies(next),
          });
        })
      );

      return container;
    },
  };
})(window);
