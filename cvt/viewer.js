const viewerStudyData = {
  totalFramesLabel: "3/14",
  studies: [
    {
      id: "study-1",
      modality: "US",
      plane: "Longitudinal",
      series: "Supraespinoso",
      contrast: false,
      detail: "Sin contraste",
      previewTone: "tone-1",
      preview: null,
      frames: ["frame-1", "frame-2", "frame-3"],
      defaultFrame: 0,
      stackType: "image-stack",
      windowPreset: null,
    },
    {
      id: "study-2",
      modality: "US",
      plane: "Transversal",
      series: "Supraespinoso",
      contrast: false,
      detail: "Sin contraste",
      previewTone: "tone-2",
      preview: null,
      frames: ["frame-1", "frame-2", "frame-3"],
      defaultFrame: 0,
      stackType: "image-stack",
      windowPreset: null,
    },
    {
      id: "study-3",
      modality: "CT",
      plane: "Axial",
      series: "Fase simple",
      contrast: false,
      detail: "Sin contraste",
      previewTone: "tone-3",
      preview: null,
      frames: ["frame-1", "frame-2", "frame-3", "frame-4"],
      defaultFrame: 0,
      stackType: "image-stack",
      windowPreset: "soft-tissue",
    },
    {
      id: "study-4",
      modality: "MRI",
      plane: "Sagital",
      series: "T2",
      contrast: false,
      detail: "Sin contraste",
      previewTone: "tone-4",
      preview: null,
      frames: ["frame-1", "frame-2", "frame-3", "frame-4"],
      defaultFrame: 0,
      stackType: "image-stack",
      windowPreset: null,
    },
    {
      id: "study-5",
      modality: "MRI",
      plane: "Coronal",
      series: "STIR",
      contrast: true,
      detail: "Con contraste",
      previewTone: "tone-2",
      preview: null,
      frames: ["frame-1", "frame-2", "frame-3"],
      defaultFrame: 0,
      stackType: "image-stack",
      windowPreset: null,
    },
    {
      id: "study-6",
      modality: "US",
      plane: "Longitudinal",
      series: "B\u00edceps",
      contrast: false,
      detail: "Con Doppler",
      previewTone: "tone-1",
      preview: null,
      frames: ["frame-1", "frame-2"],
      defaultFrame: 0,
      stackType: "image-stack",
      windowPreset: null,
    },
  ],
};

const editorialViewerData = {
  defaultStudyId: "editorial-study-1",
  studies: [
    {
      id: "editorial-study-1",
      modality: "X-RAY",
      plane: "Lateral",
      series: "Rodilla derecha",
      contrast: false,
      detail: "Frame \u00fanico",
      previewTone: "tone-3",
      frames: ["frame-1"],
      defaultFrame: 0,
      annotations: [
        {
          id: "ann-fragmentacion",
          frameIndex: 0,
          x: 44,
          y: 74,
          label: "fragmentaci\u00f3n",
        },
        {
          id: "ann-edema",
          frameIndex: 0,
          x: 30,
          y: 60,
          label: "tejidos blandos",
        },
      ],
    },
    {
      id: "editorial-study-2",
      modality: "X-RAY",
      plane: "Lateral",
      series: "Rodilla izquierda",
      contrast: false,
      detail: "Frame \u00fanico",
      previewTone: "tone-2",
      frames: ["frame-1"],
      defaultFrame: 0,
      annotations: [
        {
          id: "ann-engrosamiento",
          frameIndex: 0,
          x: 56,
          y: 66,
          label: "engrosamiento",
        },
      ],
    },
    {
      id: "editorial-study-3",
      modality: "X-RAY",
      plane: "Frontal",
      series: "Bilateral",
      contrast: false,
      detail: "Frame \u00fanico",
      previewTone: "tone-1",
      frames: ["frame-1"],
      defaultFrame: 0,
      annotations: [
        {
          id: "ann-comparacion",
          frameIndex: 0,
          x: 56,
          y: 56,
          label: "comparaci\u00f3n",
        },
      ],
    },
  ],
  notes: [
    {
      id: "note-1",
      studyId: "editorial-study-1",
      frameIndex: 0,
      annotationId: "ann-edema",
      html: 'Soft tissue swelling <span class="hl">(right and left)</span> more marked on the right, anterior to the proximal tibia bilaterally.',
    },
    {
      id: "note-2",
      studyId: "editorial-study-1",
      frameIndex: 0,
      annotationId: "ann-fragmentacion",
      html: 'Some <span class="hl">fragmentation</span> of the right tibial tuberosity is evident.',
    },
    {
      id: "note-3",
      studyId: "editorial-study-2",
      frameIndex: 0,
      annotationId: "ann-engrosamiento",
      html: 'On the left side, there is relative <span class="hl">tendon thickening</span> without the same degree of fragmentation.',
    },
  ],
};

function getStudyDisplayMeta(study) {
  const contrastLabel = study.contrast ? "Con contraste" : "Sin contraste";
  const detailLabel = study.detail || contrastLabel;

  return {
    line1: `${study.modality} \u00b7 ${study.plane}`,
    line2: study.series,
    line3: detailLabel,
  };
}

function hasTouchCarouselMode() {
  return (
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

function createBaseViewerController(config) {
  const {
    stage,
    counter,
    meta,
    track,
    prevBtn,
    nextBtn,
    studies,
    initialStudyId,
    onStudyApplied,
    onStudyChange,
    onStudiesRendered,
  } = config;

  if (!stage || !counter || !meta || !track || !prevBtn || !nextBtn) {
    return null;
  }

  let currentStudyIndex = Math.max(
    0,
    studies.findIndex((study) => study.id === initialStudyId)
  );
  let currentTrackIndex = 0;
  let currentFrameIndex = studies[currentStudyIndex]?.defaultFrame ?? 0;

  function getActiveStudy() {
    return studies[currentStudyIndex];
  }

  function getCurrentFrameIndex() {
    return currentFrameIndex;
  }

  function applyStudy(study) {
    stage.className = `viewer-stage ${study.previewTone || "tone-1"}`;

    const currentFrame = currentFrameIndex + 1;
    const totalFrames = study.frames?.length || 1;

    counter.textContent = `${currentFrame}/${totalFrames}`;
    meta.textContent = `${study.modality} \u00b7 ${study.plane} \u00b7 ${study.series}`;

    if (typeof onStudyApplied === "function") {
      onStudyApplied(study, currentFrameIndex);
    }
  }

  function notifyStudyChange(study, index) {
    if (typeof onStudyChange === "function") {
      onStudyChange(study, index, currentFrameIndex);
    }
  }

  function getStudyStep() {
    const firstCard = track.querySelector(".study-card");
    if (!firstCard) return 0;

    const trackStyles = window.getComputedStyle(track);
    const gap = parseFloat(trackStyles.gap || 12);

    return firstCard.getBoundingClientRect().width + gap;
  }

  function getMaxTrackIndex() {
    const viewport = track.parentElement;
    if (!viewport) return 0;

    const totalWidth = track.scrollWidth;
    const visibleWidth = viewport.clientWidth;
    const step = getStudyStep();

    if (!step) return 0;

    return Math.max(0, Math.ceil((totalWidth - visibleWidth) / step));
  }

  function updateTrack() {
    const isTouchViewport = hasTouchCarouselMode();

    if (!isTouchViewport) {
      const step = getStudyStep();
      track.style.transform = `translateX(-${currentTrackIndex * step}px)`;
      prevBtn.disabled = currentTrackIndex === 0;
      nextBtn.disabled = currentTrackIndex >= getMaxTrackIndex();
    } else {
      track.style.transform = "none";
      prevBtn.disabled = false;
      nextBtn.disabled = false;
    }
  }

  function renderStudies() {
    track.innerHTML = "";

    studies.forEach((study, index) => {
      const metaLines = getStudyDisplayMeta(study);
      const button = document.createElement("button");

      button.type = "button";
      button.className = `study-card${
        index === currentStudyIndex ? " active" : ""
      }`;
      button.dataset.index = String(index);
      button.dataset.studyId = study.id;

      button.innerHTML = `
        <div class="study-preview ${study.previewTone || "tone-1"}"></div>
        <div class="study-meta">
          <div class="study-line-1">${metaLines.line1}</div>
          <div class="study-line-2">${metaLines.line2}</div>
          <div class="study-line-3">${metaLines.line3}</div>
        </div>
      `;

      button.addEventListener("click", () => {
        selectStudy(index);
      });

      track.appendChild(button);
    });

    updateTrack();

    if (typeof onStudiesRendered === "function") {
      onStudiesRendered(getActiveStudy(), currentStudyIndex);
    }
  }

  function selectStudy(index, options = {}) {
    const nextStudy = studies[index];
    if (!nextStudy) return;

    currentStudyIndex = index;
    currentFrameIndex = Math.max(
      0,
      Math.min(
        options.frameIndex ?? nextStudy.defaultFrame ?? 0,
        Math.max((nextStudy.frames?.length || 1) - 1, 0)
      )
    );
    notifyStudyChange(nextStudy, index);
    applyStudy(nextStudy);
    renderStudies();
  }

  prevBtn.addEventListener("click", () => {
    const isTouchViewport = hasTouchCarouselMode();

    if (isTouchViewport) {
      const viewport = track.parentElement;
      const step = getStudyStep();

      if (viewport && step) {
        viewport.scrollBy({ left: -step, behavior: "smooth" });
      }
      return;
    }

    currentTrackIndex = Math.max(0, currentTrackIndex - 1);
    updateTrack();
  });

  nextBtn.addEventListener("click", () => {
    const isTouchViewport = hasTouchCarouselMode();

    if (isTouchViewport) {
      const viewport = track.parentElement;
      const step = getStudyStep();

      if (viewport && step) {
        viewport.scrollBy({ left: step, behavior: "smooth" });
      }
      return;
    }

    currentTrackIndex = Math.min(getMaxTrackIndex(), currentTrackIndex + 1);
    updateTrack();
  });

  window.addEventListener("resize", updateTrack);

  selectStudy(currentStudyIndex);

  return {
    getActiveStudy,
    getCurrentFrameIndex,
    applyStudy,
    renderStudies,
    updateTrack,
    selectStudy,
    setFrameIndex(index) {
      currentFrameIndex = Math.max(
        0,
        Math.min(index, Math.max((getActiveStudy()?.frames?.length || 1) - 1, 0))
      );
      applyStudy(getActiveStudy());
    },
    setStudyIndex(index) {
      currentStudyIndex = index;
    },
    getStudyIndex() {
      return currentStudyIndex;
    },
  };
}

function initMainViewer() {
  const viewerStage = document.getElementById("viewerStage");
  const viewerCounter = document.getElementById("viewerCounter");
  const viewerMeta = document.getElementById("viewerMeta");
  const studiesTrack = document.getElementById("studiesTrack");
  const studiesPrevBtn = document.getElementById("studiesPrevBtn");
  const studiesNextBtn = document.getElementById("studiesNextBtn");

  createBaseViewerController({
    stage: viewerStage,
    counter: viewerCounter,
    meta: viewerMeta,
    track: studiesTrack,
    prevBtn: studiesPrevBtn,
    nextBtn: studiesNextBtn,
    studies: viewerStudyData.studies,
    initialStudyId: viewerStudyData.studies[0]?.id,
  });
}

function initEditorialViewer() {
  const stage = document.getElementById("editorialViewerStage");
  const counter = document.getElementById("editorialViewerCounter");
  const meta = document.getElementById("editorialViewerMeta");
  const track = document.getElementById("editorialStudiesTrack");
  const prevBtn = document.getElementById("editorialStudiesPrevBtn");
  const nextBtn = document.getElementById("editorialStudiesNextBtn");
  const annotationLayer = document.getElementById("editorialAnnotationLayer");
  const caption = document.getElementById("editorialViewerCaption");

  if (
    !stage ||
    !counter ||
    !meta ||
    !track ||
    !prevBtn ||
    !nextBtn ||
    !annotationLayer ||
    !caption
  ) {
    return;
  }

  let activeFrameIndex = 0;
  let activeAnnotationId = null;
  let activeNoteId = null;
  let controller = null;

  function getActiveEditorialStudy() {
    return controller?.getActiveStudy() || null;
  }

  function renderAnnotations() {
    const study = getActiveEditorialStudy();
    if (!study) return;

    annotationLayer.innerHTML = "";

    const visibleAnnotations = (study.annotations || []).filter(
      (annotation) => annotation.frameIndex === activeFrameIndex
    );

    visibleAnnotations.forEach((annotation) => {
      const node = document.createElement("div");

      node.className = `annotation${
        annotation.id === activeAnnotationId ? " active" : ""
      }`;
      node.style.left = `${annotation.x}%`;
      node.style.top = `${annotation.y}%`;

      node.innerHTML = `
        <div class="annotation-marker"></div>
        <div class="annotation-badge">${annotation.label}</div>
      `;

      annotationLayer.appendChild(node);
    });
  }

  function renderNotes() {
    caption.innerHTML = "";

    editorialViewerData.notes
      .forEach((note) => {
        const link = document.createElement("a");

        link.href = "#";
        link.className = `note-link${
          note.id === activeNoteId ? " active" : ""
        }`;
        link.innerHTML = note.html;

        link.addEventListener("click", (event) => {
          event.preventDefault();

          const studyIndex = editorialViewerData.studies.findIndex(
            (study) => study.id === note.studyId
          );

          if (studyIndex < 0 || !controller) return;

          activeNoteId = note.id;
          activeAnnotationId = note.annotationId;
          controller.selectStudy(studyIndex, { frameIndex: note.frameIndex });

          renderAnnotations();
          renderNotes();
        });

        caption.appendChild(link);
      });
  }

  function getEditorialNotes() {
    return editorialViewerData.notes.map((note) => ({ ...note }));
  }

  function setEditorialNotes(nextNotes) {
    editorialViewerData.notes = nextNotes.map((note) => ({ ...note }));
    activeNoteId = null;
    activeAnnotationId = null;
    renderNotes();
    renderAnnotations();
  }

  function focusEditorialReference(noteId) {
    const note = editorialViewerData.notes.find((item) => item.id === noteId);
    if (!note || !controller) return;

    const studyIndex = editorialViewerData.studies.findIndex(
      (study) => study.id === note.studyId
    );

    if (studyIndex < 0) return;

    activeNoteId = note.id;
    activeAnnotationId = note.annotationId;
    controller.selectStudy(studyIndex, { frameIndex: note.frameIndex });
    renderAnnotations();
    renderNotes();
  }

  controller = createBaseViewerController({
    stage,
    counter,
    meta,
    track,
    prevBtn,
    nextBtn,
    studies: editorialViewerData.studies,
    initialStudyId: editorialViewerData.defaultStudyId,
    onStudyChange: (study, index, frameIndex) => {
      activeFrameIndex = frameIndex;

      const hasActiveAnnotation = (study.annotations || []).some(
        (annotation) =>
          annotation.frameIndex === activeFrameIndex &&
          annotation.id === activeAnnotationId
      );

      if (!hasActiveAnnotation) {
        activeAnnotationId = null;
        activeNoteId = null;
      }
    },
    onStudyApplied: () => {
      if (controller) {
        renderAnnotations();
      }
    },
    onStudiesRendered: () => {
      if (controller) {
        renderNotes();
      }
    },
  });

  if (!controller) return;

  activeFrameIndex = controller.getCurrentFrameIndex();
  controller.renderStudies();
  renderAnnotations();
  renderNotes();

  window.corvianthEditor = {
    getEditorialNotes,
    setEditorialNotes,
    focusEditorialReference,
  };
}

function initViewers() {
  initMainViewer();
  initEditorialViewer();
}

document.addEventListener("DOMContentLoaded", initViewers);
