(function registerViewerEditorialModule(global) {
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
      id: study.id || `editorial-study-${index + 1}`,
      modality: study.modality || "X-RAY",
      plane: study.plane || "Lateral",
      series: study.series || "Serie",
      detail: study.detail || "Frame unico",
      previewTone: study.previewTone || "tone-3",
      totalFrames: Math.max(1, Number(study.totalFrames) || 1),
      defaultFrame: Math.max(0, Number(study.defaultFrame) || 0),
      annotations: Array.isArray(study.annotations) ? study.annotations : [],
    }));
  }

  function normalizeNotes(notes) {
    if (!Array.isArray(notes)) return [];
    return notes.map((note, index) => ({
      id: note.id || `note-${index + 1}`,
      studyId: note.studyId || "",
      frameIndex: Math.max(0, Number(note.frameIndex) || 0),
      annotationId: note.annotationId || "",
      html: note.html || "",
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
    textarea.rows = 10;
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

  registry["viewer-editorial"] = {
    type: "viewer-editorial",
    label: "Visor editorial",
    description: "Visor con texto vinculado y anotaciones.",
    createDefaultData() {
      return {
        title: "Figura editorial con texto vinculado",
        stageLabel: "Figura editorial",
        studies: [
          {
            id: "ed-1",
            modality: "X-RAY",
            plane: "Lateral",
            series: "Rodilla derecha",
            detail: "Frame unico",
            previewTone: "tone-3",
            totalFrames: 1,
            defaultFrame: 0,
            annotations: [
              { id: "ann-edema", x: 30, y: 60, label: "tejidos blandos", frameIndex: 0 },
              { id: "ann-frag", x: 44, y: 74, label: "fragmentacion", frameIndex: 0 },
            ],
          },
          {
            id: "ed-2",
            modality: "X-RAY",
            plane: "Lateral",
            series: "Rodilla izquierda",
            detail: "Frame unico",
            previewTone: "tone-2",
            totalFrames: 1,
            defaultFrame: 0,
            annotations: [
              { id: "ann-eng", x: 56, y: 66, label: "engrosamiento", frameIndex: 0 },
            ],
          },
        ],
        notes: [
          {
            id: "n1",
            studyId: "ed-1",
            frameIndex: 0,
            annotationId: "ann-edema",
            html: 'Soft tissue swelling <span class="hl">(right and left)</span> more marked on the right.',
          },
          {
            id: "n2",
            studyId: "ed-1",
            frameIndex: 0,
            annotationId: "ann-frag",
            html: 'Some <span class="hl">fragmentation</span> of the right tibial tuberosity is evident.',
          },
          {
            id: "n3",
            studyId: "ed-2",
            frameIndex: 0,
            annotationId: "ann-eng",
            html: 'On the left side, there is relative <span class="hl">tendon thickening</span>.',
          },
        ],
      };
    },
    renderDisplay(data) {
      const studies = normalizeStudies(data.studies);
      const notes = normalizeNotes(data.notes);
      const section = document.createElement("section");
      section.className = "module viewer-full-bleed-mobile";

      if (!studies.length) {
        section.innerHTML = `
          <div class="module-head">${data.title || "Visor editorial"}</div>
          <div class="module-body">
            <div class="studio-empty">Este visor no tiene estudios configurados.</div>
          </div>
        `;
        return section;
      }

      section.innerHTML = `
        <div class="module-head">${MODULE_ICON}${data.title || "Visor editorial"}</div>
        <div class="module-body">
          <div class="viewer">
            <div class="viewer-stage ${studies[0].previewTone}" data-role="stage">
              <div class="viewer-glow"></div>
              <div class="viewer-grid"></div>
              <div class="annotation-layer" data-role="annotation-layer"></div>
              <div class="viewer-label">${data.stageLabel || "Figura editorial"}</div>
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
          <div class="viewer-caption">
            <div class="viewer-caption-label">Descripcion de la figura</div>
            <div class="viewer-caption-text" data-role="caption"></div>
          </div>
        </div>
      `;

      const stage = section.querySelector('[data-role="stage"]');
      const meta = section.querySelector('[data-role="meta"]');
      const counter = section.querySelector('[data-role="counter"]');
      const track = section.querySelector('[data-role="track"]');
      const caption = section.querySelector('[data-role="caption"]');
      const annotationLayer = section.querySelector('[data-role="annotation-layer"]');
      const prevBtn = section.querySelector('[data-role="prev"]');
      const nextBtn = section.querySelector('[data-role="next"]');
      const viewport = section.querySelector(".studies-viewport");

      let currentIndex = 0;
      let activeFrameIndex = studies[0].defaultFrame || 0;
      let activeNoteId = null;
      let activeAnnotationId = null;

      function getActiveStudy() {
        return studies[currentIndex];
      }

      function renderAnnotations() {
        const activeStudy = getActiveStudy();
        annotationLayer.innerHTML = "";

        (activeStudy.annotations || [])
          .filter((annotation) => (annotation.frameIndex || 0) === activeFrameIndex)
          .forEach((annotation) => {
            const node = document.createElement("div");
            node.className = `annotation${
              annotation.id === activeAnnotationId ? " active" : ""
            }`;
            node.style.left = `${annotation.x}%`;
            node.style.top = `${annotation.y}%`;
            node.innerHTML = `
              <div class="annotation-marker"></div>
              <div class="annotation-badge">${annotation.label || ""}</div>
            `;
            annotationLayer.appendChild(node);
          });
      }

      function renderNotes() {
        caption.innerHTML = "";
        notes.forEach((note) => {
          const link = document.createElement("a");
          link.href = "#";
          link.className = `note-link${note.id === activeNoteId ? " active" : ""}`;
          link.innerHTML = note.html;
          link.addEventListener("click", (event) => {
            event.preventDefault();
            const nextStudyIndex = studies.findIndex((study) => study.id === note.studyId);
            if (nextStudyIndex < 0) return;

            currentIndex = nextStudyIndex;
            activeFrameIndex = note.frameIndex;
            activeNoteId = note.id;
            activeAnnotationId = note.annotationId;
            applyStudy();
            renderTrack();
            renderAnnotations();
            renderNotes();
          });
          caption.appendChild(link);
        });
      }

      function applyStudy() {
        const study = getActiveStudy();
        const frame = Math.min(activeFrameIndex + 1, study.totalFrames);
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
            activeFrameIndex = study.defaultFrame || 0;
            activeNoteId = null;
            activeAnnotationId = null;
            applyStudy();
            renderTrack();
            renderAnnotations();
            renderNotes();
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
      renderAnnotations();
      renderNotes();
      return section;
    },
    renderEditable(data, context) {
      const safeData = {
        title: data.title || "Figura editorial con texto vinculado",
        stageLabel: data.stageLabel || "Figura editorial",
        studies: normalizeStudies(data.studies),
        notes: normalizeNotes(data.notes),
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
            "Título del visor editorial",
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
        summary.textContent = "Editar estructura editorial";

        const card = document.createElement("div");
        card.className = "studio-subcard";
        card.appendChild(
          createJsonEditorField("Estudios (JSON)", safeData.studies, (next) => {
            safeData.studies = normalizeStudies(next);
            context.onChange({ ...safeData }, { rerenderCanvas: true });
          })
        );
        card.appendChild(
          createJsonEditorField("Notas (JSON)", safeData.notes, (next) => {
            safeData.notes = normalizeNotes(next);
            context.onChange({ ...safeData }, { rerenderCanvas: true });
          })
        );

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

      container.appendChild(
        createJsonEditorField("Notas (JSON)", normalizeNotes(data.notes), (next) => {
          context.onChange({
            ...data,
            notes: normalizeNotes(next),
          });
        })
      );

      return container;
    },
  };
})(window);
