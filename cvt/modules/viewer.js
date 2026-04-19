(function registerUnifiedViewerModule(global) {
  const registry = (global.CorvianthModules = global.CorvianthModules || {});
  const MODALITY_OPTIONS = ["CT", "MRI", "RX", "USG"];
  const viewerEditOpenState = new Map();
  const viewerPendingManualMarkState = new Map();
  const viewerPendingBubblePlacementState = new Map();
  const viewerPendingArrowPickerState = new Map();
  const viewerPendingMarkTargetMenuState = new Map();
  const viewerActiveContextState = new Map();
  const viewerFrameSizeCache = new Map();
  const THUMBS_REVEAL_ZONE_PX = 92;
  const THUMBS_HIDE_DELAY_MS = 140;
  const ARROW_ICON_OPTIONS = [
    {
      id: "right-up",
      label: "Derecha arriba",
      src: "./assets/icons/Flecha_derecha_arriba_a3e635.svg",
    },
    {
      id: "left-down",
      label: "Izquierda abajo",
      src: "./assets/icons/Flecha_izquierda_abajo_a3e635.svg",
    },
    {
      id: "left-up",
      label: "Izquierda arriba",
      src: "./assets/icons/Flecha_izquierda_arriba_a3e635.svg",
    },
    {
      id: "right-down",
      label: "Derecha abajo",
      src: "./assets/icons/Flecha_derecha_abajo_a3e635.svg",
    },
  ];

  const MODULE_ICON =
    '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#a3e635" stroke-width="2" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /></svg>';
  const MARKS_TOGGLE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/></svg>';
  const MARK_ICON =
    '<img class="viewer-mark-icon" src="./assets/icons/estrella_a3e635.svg" alt="" aria-hidden="true" />';
  const THUMBS_UNLOCK_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0"/></svg>';
  const THUMBS_LOCK_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0"/><circle cx="12" cy="16" r="1.2"/></svg>';
  const ACTION_ICON_PLACE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>';
  const ACTION_ICON_BUBBLE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5z"/></svg>';
  const ACTION_ICON_CLEAR_BUBBLE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5z"/><path d="M9 9l6 6M15 9l-6 6"/></svg>';
  const ACTION_ICON_REMOVE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M8 10v8M12 10v8M16 10v8"/></svg>';
  const SERIES_REMOVE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const CONTRAST_TRUE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="m8.5 12.5 2.2 2.2 4.8-4.8"/></svg>';
  const CONTRAST_FALSE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M9 9l6 6M15 9l-6 6"/></svg>';
  const FULLSCREEN_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></svg>';
  const MOBILE_SCROLL_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v18"/><path d="m7 8 5-5 5 5"/><path d="m7 16 5 5 5-5"/></svg>';

  function getCachedFrameSize(src) {
    const key = String(src || "").trim();
    if (!key) return null;
    const cached = viewerFrameSizeCache.get(key);
    if (!cached || cached.status !== "loaded" || !cached.size) return null;
    return cached.size;
  }

  function preloadFrameSize(src) {
    const key = String(src || "").trim();
    if (!key) return Promise.resolve(null);
    const cached = viewerFrameSizeCache.get(key);
    if (cached?.status === "loaded") return Promise.resolve(cached.size);
    if (cached?.status === "loading" && cached.promise) return cached.promise;
    const promise = new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        const width = Number(image.naturalWidth) || 0;
        const height = Number(image.naturalHeight) || 0;
        if (width > 0 && height > 0) {
          const size = { width, height };
          viewerFrameSizeCache.set(key, { status: "loaded", size });
          resolve(size);
          return;
        }
        viewerFrameSizeCache.set(key, { status: "error", size: null });
        resolve(null);
      };
      image.onerror = () => {
        viewerFrameSizeCache.set(key, { status: "error", size: null });
        resolve(null);
      };
      image.src = key;
    });
    viewerFrameSizeCache.set(key, { status: "loading", promise });
    return promise;
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

  function sanitizeHtml(html) {
    return String(html || "")
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "");
  }

  function normalizeCaptionHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = sanitizeHtml(html);
    const out = document.createElement("div");

    const blockTags = new Set([
      "P",
      "DIV",
      "LI",
      "UL",
      "OL",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "BLOCKQUOTE",
      "SECTION",
      "ARTICLE",
      "TABLE",
      "TR",
      "TD",
      "TH",
    ]);

    function appendNormalized(source, target) {
      Array.from(source.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          target.appendChild(document.createTextNode(node.nodeValue || ""));
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        const el = node;
        const tag = el.tagName.toUpperCase();
        if (tag === "BR") {
          target.appendChild(document.createElement("br"));
          return;
        }
        if (tag === "SPAN" && el.classList.contains("viewer-mark-token")) {
          const markId = String(el.dataset.markId || "").trim();
          const tokenText = String(el.textContent || "");
          if (!tokenText.trim()) return;
          const span = document.createElement("span");
          span.className = "viewer-mark-token viewer-mark-token--interactive";
          if (markId) span.dataset.markId = markId;
          span.textContent = tokenText;
          target.appendChild(span);
          return;
        }

        appendNormalized(el, target);
        if (blockTags.has(tag)) {
          target.appendChild(document.createTextNode(" "));
        }
      });
    }

    appendNormalized(template.content, out);
    return out.innerHTML.replace(/\s{2,}/g, " ").replace(/ ?<br>\s*/g, "<br>").trim();
  }

  function pruneCaptionTokensByMarks(html, marks) {
    const validIds = new Set((Array.isArray(marks) ? marks : []).map((mark) => String(mark.id || "")));
    const template = document.createElement("template");
    template.innerHTML = normalizeCaptionHtml(html || "");
    template.content.querySelectorAll(".viewer-mark-token").forEach((tokenNode) => {
      const id = String(tokenNode.dataset.markId || "");
      if (id && validIds.has(id)) return;
      tokenNode.replaceWith(document.createTextNode(tokenNode.textContent || ""));
    });
    return normalizeCaptionHtml(template.innerHTML);
  }

  function getLinkedMarkIdsFromCaptionNode(captionNode) {
    const ids = new Set();
    if (!captionNode) return ids;
    captionNode.querySelectorAll(".viewer-mark-token[data-mark-id]").forEach((tokenNode) => {
      const id = String(tokenNode.dataset.markId || "").trim();
      if (id) ids.add(id);
    });
    return ids;
  }

  function nextMarkId(marks) {
    const values = (Array.isArray(marks) ? marks : [])
      .map((mark) => Number(String(mark.id || "").replace(/[^\d]/g, "")))
      .filter((num) => Number.isFinite(num) && num > 0);
    const next = values.length ? Math.max(...values) + 1 : 1;
    return `MK-${String(next).padStart(3, "0")}`;
  }

  function getArrowOption(arrowType) {
    return (
      ARROW_ICON_OPTIONS.find((option) => option.id === String(arrowType || "").trim()) ||
      ARROW_ICON_OPTIONS[0]
    );
  }

  function parsePlacedCoordinate(value) {
    if (value === null || value === undefined || value === "") return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    if (numeric <= 0) return null;
    return Math.min(99, Math.max(1, numeric));
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("No se pudo leer el archivo."));
      reader.readAsDataURL(file);
    });
  }

  function parseContrastFlag(study) {
    if (typeof study?.hasContrast === "boolean") {
      return study.hasContrast;
    }
    const detail = String(study?.detail || "").trim().toLowerCase();
    if (!detail) return false;
    if (detail.includes("sin contraste")) return false;
    if (detail.includes("con contraste")) return true;
    return false;
  }

  function contrastLabelFromFlag(flag) {
    return flag ? "Con contraste" : "Sin contraste";
  }

  function normalizeStudies(studies) {
    const source = Array.isArray(studies) && studies.length ? studies : [];
    return source.map((study, index) => ({
      hasContrast: parseContrastFlag(study),
      id: study.id || `viewer-study-${index + 1}`,
      modality: MODALITY_OPTIONS.includes(study.modality) ? study.modality : "CT",
      plane: study.plane || "Axial",
      series: study.series || "Serie",
      detail: contrastLabelFromFlag(parseContrastFlag(study)),
      previewTone: study.previewTone || `tone-${(index % 4) + 1}`,
      totalFrames: Math.max(1, Number(study.totalFrames) || 1),
      defaultFrame: Math.max(0, Number(study.defaultFrame) || 0),
      frames: Array.isArray(study.frames)
        ? study.frames.map((src) => String(src || "")).filter(Boolean)
        : [],
    }));
  }

  function normalizeMarks(marks, studies) {
    const source = Array.isArray(marks) ? marks : [];
    const fallbackStudyId = studies[0]?.id || "";
    return source.map((mark, index) => {
      const x = parsePlacedCoordinate(mark?.x);
      const y = parsePlacedCoordinate(mark?.y);
      const labelX = parsePlacedCoordinate(mark?.labelX);
      const labelY = parsePlacedCoordinate(mark?.labelY);
      return {
        id: mark.id || `MK-${String(index + 1).padStart(3, "0")}`,
        text: String(mark.text || "").trim(),
        studyId: mark.studyId || fallbackStudyId,
        frameIndex: Math.max(0, Number(mark.frameIndex) || 0),
        x,
        y,
        labelX,
        labelY,
        hasBubble: Boolean(mark?.hasBubble) || (labelX !== null && labelY !== null),
        arrowType: getArrowOption(mark?.arrowType).id,
      };
    });
  }

  function getStagePercent(event, rect) {
    if (!event || !rect || !rect.width || !rect.height) {
      return { x: null, y: null };
    }
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      return { x: null, y: null };
    }
    const x = Number((((event.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = Number((((event.clientY - rect.top) / rect.height) * 100).toFixed(2));
    return {
      x: Math.min(99, Math.max(1, x)),
      y: Math.min(99, Math.max(1, y)),
    };
  }

  function normalizeData(data) {
    const studies = normalizeStudies(data?.studies);
    const marks = normalizeMarks(data?.marks, studies);
    return {
      title: data?.title || "Visor del caso",
      showDescription: Boolean(data?.showDescription),
      descriptionLabel: "Descripcion de la figura",
      descriptionHtml: pruneCaptionTokensByMarks(data?.descriptionHtml || "", marks),
      studies,
      marks,
    };
  }

  function formatStudyTitle(study) {
    if (!study) return "Visor del caso";
    return `${study.modality} ${study.plane}`.trim();
  }

  function getStudyFrameCount(study) {
    if (!study) return 1;
    if (Array.isArray(study.frames) && study.frames.length) {
      return study.frames.length;
    }
    return Math.max(1, Number(study.totalFrames) || 1);
  }

  function bindCaptionTokens(captionText, onTokenClick) {
    if (!captionText) return;
    captionText.querySelectorAll(".viewer-mark-token[data-mark-id]").forEach((tokenNode) => {
      tokenNode.classList.add("viewer-mark-token--interactive");
      tokenNode.addEventListener("click", (event) => {
        event.preventDefault();
        onTokenClick(tokenNode.dataset.markId || "");
      });
    });
  }

  function mountViewerInteractions(section, safeData, options = {}) {
    const stage = section.querySelector('[data-role="stage"]');
    const counter = section.querySelector('[data-role="counter"]');
    const track = section.querySelector('[data-role="track"]');
    const markLayer = section.querySelector('[data-role="mark-layer"]');
    const markCanvas = section.querySelector('[data-role="mark-canvas"]');
    const markTools = section.querySelector('[data-role="mark-tools"]');
    const viewerIcon = section.querySelector('[data-role="viewer-icon"]');
    const frameScrollThumb = section.querySelector('[data-role="frame-scroll-thumb"]');
    const headTitle = section.querySelector('[data-role="head-title"]');
    const prevBtn = section.querySelector('[data-role="prev"]');
    const nextBtn = section.querySelector('[data-role="next"]');
    const viewport = section.querySelector(".studies-viewport");
    const thumbsWrap = section.querySelector('[data-role="thumbs-wrap"]');
    const studiesRow = section.querySelector(".studies-row");
    const thumbsToggle = section.querySelector('[data-role="thumb-toggle"]');
    const thumbsToggleIcon = section.querySelector('[data-role="thumb-toggle-icon"]');
    const thumbsToggleText = section.querySelector('[data-role="thumb-toggle-text"]');
    const mobileScrollToggle = section.querySelector('[data-role="mobile-scroll-toggle"]');
    const mobileScrollToggleText = section.querySelector('[data-role="mobile-scroll-toggle-text"]');
    const marksNav = section.querySelector('[data-role="marks-nav"]');
    const marksNavPrev = section.querySelector('[data-role="marks-nav-prev"]');
    const marksNavNext = section.querySelector('[data-role="marks-nav-next"]');
    const marksNavCount = section.querySelector('[data-role="marks-nav-count"]');
    const fullscreenToggle = section.querySelector('[data-role="fullscreen-toggle"]');
    const captionText = section.querySelector('[data-role="caption-text"]');

    const initialStudyId = section.dataset.activeStudyId || safeData.studies[0]?.id || "";
    const initialStudyIndex = safeData.studies.findIndex((study) => study.id === initialStudyId);
    let currentIndex = initialStudyIndex >= 0 ? initialStudyIndex : 0;
    const parsedInitialFrameIndex = Number(section.dataset.activeFrameIndex);
    let activeFrameIndex = Number.isFinite(parsedInitialFrameIndex)
      ? Math.max(0, parsedInitialFrameIndex)
      : safeData.studies[currentIndex]?.defaultFrame || 0;
    let activeMarkId = "";
    let thumbsCollapsed = section.dataset.thumbsCollapsed === "true";
    let thumbsHoverVisible = false;
    let thumbsHideTimer = null;
    let suppressTopRevealUntilZoneExit = false;
    const mobileUiMode =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 1023px)").matches;
    const forceStaticThumbs = mobileUiMode;
    const spectatorMode = options.spectatorMode === true;
    let marksVisible = spectatorMode ? Boolean(options.initialMarksVisible) : true;
    let marksNavIndex = -1;
    let mobileScrollMode = false;
    let fallbackFullscreen = section.classList.contains("is-viewer-fullscreen");
    let stagePulseTimer = null;
    if (mobileUiMode) {
      thumbsCollapsed = false;
    }

    function getActiveStudy() {
      return safeData.studies[currentIndex];
    }

    function getActiveFrameSource(study = getActiveStudy()) {
      if (!study || !Array.isArray(study.frames) || !study.frames.length) return "";
      const safeIndex = Math.min(Math.max(0, activeFrameIndex), study.frames.length - 1);
      return String(study.frames[safeIndex] || "");
    }

    function computeContainedImageBox(stageRect, frameSize) {
      const stageWidth = Number(stageRect?.width) || 0;
      const stageHeight = Number(stageRect?.height) || 0;
      if (stageWidth <= 0 || stageHeight <= 0) {
        return { left: 0, top: 0, width: 0, height: 0 };
      }
      const imageWidth = Number(frameSize?.width) || 0;
      const imageHeight = Number(frameSize?.height) || 0;
      if (imageWidth <= 0 || imageHeight <= 0) {
        return { left: 0, top: 0, width: stageWidth, height: stageHeight };
      }
      const scale = Math.min(stageWidth / imageWidth, stageHeight / imageHeight);
      const width = Math.max(1, Math.round(imageWidth * scale));
      const height = Math.max(1, Math.round(imageHeight * scale));
      const left = Math.round((stageWidth - width) / 2);
      const top = Math.round((stageHeight - height) / 2);
      return { left, top, width, height };
    }

    function syncMarkLayerGeometry() {
      if (!stage || !markLayer) return null;
      const stageRect = stage.getBoundingClientRect();
      const frameSrc = getActiveFrameSource();
      const frameSize = getCachedFrameSize(frameSrc);
      const box = computeContainedImageBox(stageRect, frameSize);
      markLayer.style.left = `${box.left}px`;
      markLayer.style.top = `${box.top}px`;
      markLayer.style.right = "auto";
      markLayer.style.bottom = "auto";
      markLayer.style.width = `${box.width}px`;
      markLayer.style.height = `${box.height}px`;
      return {
        left: stageRect.left + box.left,
        top: stageRect.top + box.top,
        width: box.width,
        height: box.height,
        right: stageRect.left + box.left + box.width,
        bottom: stageRect.top + box.top + box.height,
      };
    }

    function resolveMarkPlacementRect() {
      const rect = syncMarkLayerGeometry();
      if (rect && rect.width > 0 && rect.height > 0) return rect;
      return stage?.getBoundingClientRect?.() || null;
    }

    function queueMarkLayerSync(render = false) {
      if (typeof window === "undefined") {
        syncMarkLayerGeometry();
        if (render) renderMarks();
        return;
      }
      window.requestAnimationFrame(() => {
        syncMarkLayerGeometry();
        if (render) renderMarks();
      });
    }

    function isThumbsAutoRevealBlocked() {
      return typeof options.isThumbsAutoRevealBlocked === "function"
        ? options.isThumbsAutoRevealBlocked() === true
        : false;
    }

    function isViewerEditModeActive() {
      return typeof options.isViewerEditModeActive === "function"
        ? options.isViewerEditModeActive() === true
        : false;
    }

    function isNativeFullscreenActive() {
      if (typeof document === "undefined") return false;
      return document.fullscreenElement === section;
    }

    function isFullscreenActive() {
      return isNativeFullscreenActive() || fallbackFullscreen;
    }

    function applyFullscreenUi() {
      const active = isFullscreenActive();
      section.classList.toggle("is-viewer-fullscreen", active);
      queueMarkLayerSync(true);
      if (!fullscreenToggle) return;
      if (!spectatorMode || isViewerEditModeActive()) {
        fullscreenToggle.hidden = true;
        fullscreenToggle.classList.remove("is-active");
        fullscreenToggle.setAttribute("aria-pressed", "false");
        return;
      }
      fullscreenToggle.hidden = false;
      fullscreenToggle.classList.toggle("is-active", active);
      fullscreenToggle.setAttribute("aria-pressed", String(active));
      fullscreenToggle.setAttribute(
        "aria-label",
        active ? "Salir de pantalla completa" : "Pantalla completa"
      );
      fullscreenToggle.title = active ? "Salir de pantalla completa" : "Pantalla completa";
    }

    async function toggleFullscreenViewer() {
      if (!spectatorMode || isViewerEditModeActive()) return;
      const canNativeFullscreen =
        typeof document !== "undefined" &&
        document.fullscreenEnabled &&
        typeof section.requestFullscreen === "function" &&
        typeof document.exitFullscreen === "function";
      if (!canNativeFullscreen) {
        fallbackFullscreen = !fallbackFullscreen;
        applyFullscreenUi();
        return;
      }
      try {
        if (document.fullscreenElement === section) {
          await document.exitFullscreen();
        } else {
          await section.requestFullscreen();
        }
      } catch (error) {
        fallbackFullscreen = !fallbackFullscreen;
      }
      applyFullscreenUi();
    }

    function applyMarksVisibilityState() {
      if (!viewerIcon) return;
      const isBlocked = !spectatorMode && isViewerEditModeActive();
      viewerIcon.classList.add("is-marks-toggle");
      viewerIcon.classList.toggle("is-disabled", isBlocked);
      viewerIcon.classList.toggle("is-marks-visible", marksVisible);
      viewerIcon.classList.toggle("is-marks-hidden", !marksVisible);
      const label = viewerIcon.querySelector('[data-role="viewer-icon-text"]');
      if (isBlocked) {
        viewerIcon.disabled = true;
        viewerIcon.setAttribute("aria-disabled", "true");
        viewerIcon.removeAttribute("role");
        viewerIcon.removeAttribute("tabindex");
        viewerIcon.removeAttribute("aria-pressed");
        viewerIcon.setAttribute("aria-label", "Marcadores desactivados durante la edicion");
        viewerIcon.title = "Marcadores desactivados durante la edicion";
        if (label) label.textContent = "Bloqueado";
        if (marksNav) {
          marksNav.hidden = true;
          marksNav.classList.remove("is-visible");
        }
        markTools?.classList.remove("is-merged");
        return;
      }
      viewerIcon.disabled = false;
      viewerIcon.removeAttribute("aria-disabled");
      viewerIcon.setAttribute("role", "button");
      viewerIcon.setAttribute("tabindex", "0");
      viewerIcon.setAttribute("aria-pressed", String(marksVisible));
      viewerIcon.setAttribute(
        "aria-label",
        marksVisible ? "Ocultar marcadores" : "Mostrar marcadores"
      );
      viewerIcon.title = marksVisible ? "Ocultar marcadores" : "Mostrar marcadores";
      if (label) label.textContent = marksVisible ? "Ocultar" : "Mostrar";
      syncMarksNavigationUi();
    }

    function getNavigableMarks() {
      return [...safeData.marks]
        .filter((mark) => Number.isFinite(mark.x) && Number.isFinite(mark.y))
        .sort((a, b) =>
          String(a.id || "").localeCompare(String(b.id || ""), undefined, {
            numeric: true,
            sensitivity: "base",
          })
        );
    }

    function syncMarksNavIndex() {
      const marks = getNavigableMarks();
      if (!marks.length) {
        marksNavIndex = -1;
        return;
      }
      const activeIdx = marks.findIndex((mark) => String(mark.id || "") === String(activeMarkId || ""));
      if (activeIdx >= 0) {
        marksNavIndex = activeIdx;
        return;
      }
      if (marksNavIndex < 0 || marksNavIndex >= marks.length) {
        marksNavIndex = 0;
      }
    }

    function syncMarksNavigationUi() {
      if (!marksNav) return;
      const marks = getNavigableMarks();
      const shouldShow = Boolean(spectatorMode) && Boolean(marksVisible) && marks.length > 0;
      if (!shouldShow) {
        marksNav.hidden = true;
        marksNav.classList.remove("is-visible");
        markTools?.classList.remove("is-merged");
        return;
      }
      syncMarksNavIndex();
      const currentPos = Math.max(0, marksNavIndex) + 1;
      if (marksNavCount) {
        marksNavCount.textContent = `${currentPos}/${marks.length}`;
      }
      marksNav.hidden = false;
      marksNav.classList.add("is-visible");
      markTools?.classList.add("is-merged");
      const disableControls = marks.length <= 1;
      if (marksNavPrev) marksNavPrev.disabled = disableControls;
      if (marksNavNext) marksNavNext.disabled = disableControls;
    }

    function stepMarksNavigation(direction) {
      const marks = getNavigableMarks();
      if (!marks.length) return;
      syncMarksNavIndex();
      if (marksNavIndex < 0) marksNavIndex = 0;
      const len = marks.length;
      marksNavIndex = (marksNavIndex + direction + len) % len;
      const nextMark = marks[marksNavIndex];
      if (!nextMark) return;
      jumpToMark(nextMark.id);
      syncMarksNavigationUi();
    }

    function studyHasFrames(study) {
      return Boolean(study && Array.isArray(study.frames) && study.frames.length > 0);
    }

    function updateFrameScroll(maxFrame) {
      if (!frameScrollThumb) return;
      const thumbHeight = Math.max(16, Math.floor(100 / Math.max(1, maxFrame)));
      const top = maxFrame > 1 ? (activeFrameIndex / (maxFrame - 1)) * (100 - thumbHeight) : 0;
      frameScrollThumb.style.height = `${thumbHeight}%`;
      frameScrollThumb.style.top = `${top}%`;
    }

    function notifyActiveContext() {
      if (typeof options.onActiveContextChange !== "function") return;
      options.onActiveContextChange({
        studyId: getActiveStudy()?.id || "",
        frameIndex: activeFrameIndex,
      });
    }

    function applyThumbsVisibility() {
      const showThumbsRow = !thumbsCollapsed && (forceStaticThumbs || thumbsHoverVisible);
      thumbsWrap?.classList.toggle("is-thumbs-collapsed", thumbsCollapsed);
      thumbsWrap?.classList.toggle("is-thumbs-hover-visible", showThumbsRow);
      thumbsWrap?.classList.toggle("is-mobile-static", forceStaticThumbs);
      section.dataset.thumbsCollapsed = thumbsCollapsed ? "true" : "false";
      if (!thumbsToggle) return;
      const locked = thumbsCollapsed;
      thumbsToggle.dataset.lockState = locked ? "locked" : "unlocked";
      thumbsToggle.classList.toggle("is-locked", locked);
      thumbsToggle.classList.toggle("is-unlocked", !locked);
      thumbsToggle.setAttribute("aria-pressed", String(locked));
      thumbsToggle.setAttribute("aria-expanded", String(!locked));
      const toggleLabel = locked
        ? "Candado activo. Miniaturas ocultas."
        : forceStaticThumbs
          ? "Candado inactivo. Carrusel fijo visible."
          : "Candado inactivo. Carrusel visible al pasar el cursor.";
      thumbsToggle.title = toggleLabel;
      thumbsToggle.setAttribute("aria-label", toggleLabel);
      if (thumbsToggleIcon) {
        thumbsToggleIcon.innerHTML = locked ? THUMBS_LOCK_ICON : THUMBS_UNLOCK_ICON;
      }
      if (thumbsToggleText) {
        thumbsToggleText.textContent = locked
          ? "Candado activo"
          : forceStaticThumbs
            ? "Carrusel fijo"
            : "Carrusel auto";
      }
    }

    function applyMobileScrollModeUi() {
      if (!mobileScrollToggle) return;
      if (!mobileUiMode) {
        mobileScrollToggle.hidden = true;
        mobileScrollToggle.classList.remove("is-active");
        mobileScrollToggle.setAttribute("aria-pressed", "false");
        return;
      }
      mobileScrollToggle.hidden = false;
      mobileScrollToggle.classList.toggle("is-active", mobileScrollMode);
      mobileScrollToggle.setAttribute("aria-pressed", String(mobileScrollMode));
      const label = mobileScrollMode ? "Modo scroll activo" : "Activar modo scroll";
      mobileScrollToggle.title = label;
      mobileScrollToggle.setAttribute("aria-label", label);
      if (mobileScrollToggleText) {
        mobileScrollToggleText.textContent = mobileScrollMode
          ? "Scroll de serie activo"
          : "Activar scroll de serie";
      }
      stage?.classList.toggle("is-mobile-scroll-mode", mobileScrollMode);
    }

    function clearThumbsHideTimer() {
      if (thumbsHideTimer) {
        clearTimeout(thumbsHideTimer);
        thumbsHideTimer = null;
      }
    }

    function showThumbsRow() {
      clearThumbsHideTimer();
      if (forceStaticThumbs) {
        thumbsHoverVisible = true;
        applyThumbsVisibility();
        return;
      }
      if (thumbsCollapsed) return;
      if (thumbsHoverVisible) return;
      thumbsHoverVisible = true;
      applyThumbsVisibility();
    }

    function hideThumbsRow(immediate = false) {
      clearThumbsHideTimer();
      if (forceStaticThumbs) {
        thumbsHoverVisible = !thumbsCollapsed;
        applyThumbsVisibility();
        return;
      }
      if (immediate) {
        thumbsHoverVisible = false;
        applyThumbsVisibility();
        return;
      }
      thumbsHideTimer = setTimeout(() => {
        thumbsHoverVisible = false;
        applyThumbsVisibility();
      }, THUMBS_HIDE_DELAY_MS);
    }

    function isPointerInTopRevealZone(event, stageRect = null) {
      if (!event) return false;
      const rect = stageRect || stage?.getBoundingClientRect();
      if (!rect) return false;
      if (event.clientX < rect.left || event.clientX > rect.right) return false;
      if (event.clientY < rect.top) return false;
      if (event.clientY > rect.top + THUMBS_REVEAL_ZONE_PX) return false;
      return true;
    }

    function evaluateThumbsHoverFromPointer(event) {
      if (thumbsCollapsed) return hideThumbsRow();
      if (forceStaticThumbs) {
        thumbsHoverVisible = true;
        applyThumbsVisibility();
        return;
      }
      if (isThumbsAutoRevealBlocked()) {
        suppressTopRevealUntilZoneExit = false;
        hideThumbsRow(true);
        return;
      }
      const inThumbsUi =
        Boolean(thumbsWrap && event?.target && thumbsWrap.contains(event.target));
      if (inThumbsUi) {
        showThumbsRow();
        return;
      }
      if (!stage || !event) return hideThumbsRow();
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return hideThumbsRow();
      const inTopZone = isPointerInTopRevealZone(event, rect);
      if (!inTopZone) {
        suppressTopRevealUntilZoneExit = false;
      }
      if (inTopZone && !suppressTopRevealUntilZoneExit) {
        showThumbsRow();
      } else {
        hideThumbsRow();
      }
    }

    function renderMarks() {
      if (!markLayer) return;
      syncMarkLayerGeometry();
      const marksHost = markCanvas || markLayer;
      marksHost.innerHTML = "";
      const activeStudy = getActiveStudy();
      if (!activeStudy) return;
      if (!marksVisible) {
        syncMarksNavigationUi();
        return;
      }

      safeData.marks
        .filter(
          (mark) =>
            mark.studyId === activeStudy.id &&
            mark.frameIndex === activeFrameIndex &&
            Number.isFinite(mark.x) &&
            Number.isFinite(mark.y)
        )
        .forEach((mark) => {
          const arrowOption = getArrowOption(mark.arrowType);
          const arrow = document.createElement("button");
          arrow.type = "button";
          arrow.className = `viewer-mark-arrow${mark.id === activeMarkId ? " is-active" : ""}`;
          arrow.style.left = `${mark.x}%`;
          arrow.style.top = `${mark.y}%`;
          arrow.innerHTML =
            `<img class="viewer-mark-arrow-icon" src="${arrowOption.src}" alt="" aria-hidden="true" />`;
          arrow.title = mark.id;
          arrow.addEventListener("click", (event) => {
            event.stopPropagation();
            activeMarkId = mark.id;
            renderMarks();
            if (typeof options.onMarkTargetClick === "function") {
              options.onMarkTargetClick({
                markId: mark.id,
                target: "arrow",
                studyId: mark.studyId,
                frameIndex: mark.frameIndex,
                x: mark.x,
                y: mark.y,
              });
            }
          });
          marksHost.appendChild(arrow);
        });

      safeData.marks
        .filter(
          (mark) =>
            mark.studyId === activeStudy.id &&
            mark.frameIndex === activeFrameIndex &&
            Boolean(mark.hasBubble) &&
            Number.isFinite(mark.labelX) &&
            Number.isFinite(mark.labelY)
        )
        .forEach((mark) => {
          const bubble = document.createElement("button");
          bubble.type = "button";
          bubble.className = `viewer-mark-bubble${mark.id === activeMarkId ? " is-active" : ""}`;
          bubble.style.left = `${mark.labelX}%`;
          bubble.style.top = `${mark.labelY}%`;
          bubble.textContent = String(mark.text || "").trim() || "Sin texto vinculado";
          bubble.title = mark.id;
          bubble.addEventListener("click", (event) => {
            event.stopPropagation();
            activeMarkId = mark.id;
            renderMarks();
            if (typeof options.onMarkTargetClick === "function") {
              options.onMarkTargetClick({
                markId: mark.id,
                target: "bubble",
                studyId: mark.studyId,
                frameIndex: mark.frameIndex,
                x: mark.labelX,
                y: mark.labelY,
              });
            }
          });
          marksHost.appendChild(bubble);
        });
      syncMarksNavigationUi();
    }

    function jumpToMark(markId) {
      const mark = safeData.marks.find((item) => item.id === markId);
      if (!mark) return;
      const nextIndex = safeData.studies.findIndex((item) => item.id === mark.studyId);
      if (nextIndex < 0) return;
      currentIndex = nextIndex;
      const maxFrame = getStudyFrameCount(safeData.studies[currentIndex]);
      activeFrameIndex = Math.min(Math.max(0, mark.frameIndex), maxFrame - 1);
      activeMarkId = mark.id;
      if (spectatorMode && !marksVisible) {
        marksVisible = true;
        applyMarksVisibilityState();
      }
      syncMarksNavIndex();
      applyStudy();
      renderTrack();
      renderMarks();
      syncMarksNavigationUi();
    }

    function applyStudy() {
      const study = getActiveStudy();
      if (!study) return;

      const maxFrame = getStudyFrameCount(study);
      activeFrameIndex = Math.min(Math.max(0, activeFrameIndex), maxFrame - 1);
      const frame = activeFrameIndex + 1;

      section.dataset.activeStudyId = study.id;
      section.dataset.activeFrameIndex = String(activeFrameIndex);
      notifyActiveContext();

      if (headTitle) {
        headTitle.textContent = formatStudyTitle(study);
      }
      if (counter) {
        counter.textContent = `${frame}/${maxFrame}`;
      }
      updateFrameScroll(maxFrame);

      stage.className = `viewer-stage viewer-stage-vertical ${study.previewTone}`;
      if (Array.isArray(study.frames) && study.frames.length) {
        const frameSrc = getActiveFrameSource(study);
        stage.style.backgroundImage = `url("${frameSrc}")`;
        stage.style.backgroundSize = "contain";
        stage.style.backgroundPosition = "center";
        stage.style.backgroundRepeat = "no-repeat";
        stage.classList.add("has-frame-image");
        syncMarkLayerGeometry();
        preloadFrameSize(frameSrc).then(() => {
          if (frameSrc !== getActiveFrameSource()) return;
          queueMarkLayerSync(true);
        });
      } else {
        stage.style.backgroundImage = "";
        stage.style.backgroundRepeat = "";
        stage.classList.remove("has-frame-image");
        syncMarkLayerGeometry();
      }

      if (study.mediaPulsePending) {
        stage.classList.add("has-media-pulse");
        if (stagePulseTimer) {
          clearTimeout(stagePulseTimer);
        }
        stagePulseTimer = setTimeout(() => {
          stage.classList.remove("has-media-pulse");
        }, 1450);
      } else {
        stage.classList.remove("has-media-pulse");
      }
    }

    function renderTrack() {
      if (!track) return;
      track.innerHTML = "";
      safeData.studies.forEach((study, index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = `study-card${index === currentIndex ? " active" : ""}`;
        if (study.mediaPulsePending) {
          card.classList.add("is-media-pulse");
        }
        card.innerHTML = `
          <div class="study-preview ${study.previewTone}"></div>
          <div class="study-meta">
            <div class="study-line-1">${study.modality} | ${study.plane}</div>
            <div class="study-line-2">${study.series}</div>
            <div class="study-line-3">${contrastLabelFromFlag(Boolean(study.hasContrast))}</div>
          </div>
        `;
        card.addEventListener("click", () => {
          currentIndex = index;
          activeFrameIndex = study.defaultFrame || 0;
          activeMarkId = "";
          applyStudy();
          renderTrack();
          renderMarks();
        });
        track.appendChild(card);
        if (study.mediaPulsePending) {
          study.mediaPulsePending = false;
        }
      });
    }

    function stepFrame(direction) {
      const study = getActiveStudy();
      if (!study) return;
      if (!studyHasFrames(study)) return;
      const maxFrame = getStudyFrameCount(study);
      if (maxFrame <= 1) return;
      activeFrameIndex = Math.min(maxFrame - 1, Math.max(0, activeFrameIndex + direction));
      activeMarkId = "";
      applyStudy();
      renderMarks();
    }

    prevBtn?.addEventListener("click", () => {
      viewport?.scrollBy({ left: -180, behavior: "smooth" });
    });
    nextBtn?.addEventListener("click", () => {
      viewport?.scrollBy({ left: 180, behavior: "smooth" });
    });
    thumbsToggle?.addEventListener("click", () => {
      thumbsCollapsed = !thumbsCollapsed;
      thumbsHoverVisible = forceStaticThumbs ? !thumbsCollapsed : !thumbsCollapsed;
      suppressTopRevealUntilZoneExit = false;
      applyThumbsVisibility();
    });
    section.addEventListener("pointermove", evaluateThumbsHoverFromPointer);
    section.addEventListener("pointerleave", () => {
      if (forceStaticThumbs) return;
      hideThumbsRow(true);
    });
    studiesRow?.addEventListener("pointerenter", () => {
      if (forceStaticThumbs) return;
      showThumbsRow();
    });
    studiesRow?.addEventListener("pointerleave", () => {
      if (forceStaticThumbs) return;
      suppressTopRevealUntilZoneExit = true;
      hideThumbsRow(true);
    });

    stage?.addEventListener(
      "wheel",
      (event) => {
        const deltaY = event.deltaY || 0;
        const activeStudy = getActiveStudy();
        if (activeStudy && !studyHasFrames(activeStudy)) {
          event.preventDefault();
          return;
        }
        if (Math.abs(deltaY) < 2) return;
        event.preventDefault();
        stepFrame(deltaY > 0 ? 1 : -1);
      },
      { passive: false }
    );

    stage?.addEventListener("dblclick", (event) => {
      if (!spectatorMode || isViewerEditModeActive()) return;
      event.preventDefault();
      toggleFullscreenViewer();
    });

    if (mobileUiMode && stage) {
      let touchLastY = null;
      const TOUCH_STEP_PX = 18;

      stage.addEventListener(
        "touchstart",
        (event) => {
          if (!mobileScrollMode) return;
          const touch = event.touches?.[0];
          if (!touch) return;
          touchLastY = touch.clientY;
        },
        { passive: true }
      );

      stage.addEventListener(
        "touchmove",
        (event) => {
          if (!mobileScrollMode) return;
          const touch = event.touches?.[0];
          if (!touch) return;
          event.preventDefault();
          if (!Number.isFinite(touchLastY)) {
            touchLastY = touch.clientY;
            return;
          }
          const delta = touch.clientY - touchLastY;
          if (Math.abs(delta) < TOUCH_STEP_PX) return;
          stepFrame(delta > 0 ? 1 : -1);
          touchLastY = touch.clientY;
        },
        { passive: false }
      );

      stage.addEventListener(
        "touchend",
        () => {
          touchLastY = null;
        },
        { passive: true }
      );
    }

    if (viewerIcon) {
      const toggleMarks = (event) => {
        if (isViewerEditModeActive() && !spectatorMode) return;
        event?.preventDefault?.();
        event?.stopPropagation?.();
        marksVisible = !marksVisible;
        applyMarksVisibilityState();
        renderMarks();
        syncMarksNavigationUi();
      };
      viewerIcon.addEventListener("click", toggleMarks);
      viewerIcon.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          toggleMarks(event);
        }
      });
    }

    marksNavPrev?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      stepMarksNavigation(-1);
    });
    marksNavNext?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      stepMarksNavigation(1);
    });
    fullscreenToggle?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleFullscreenViewer();
    });
    if (spectatorMode && typeof document !== "undefined" && !section.__viewerFullscreenBound) {
      const onFullscreenChange = () => applyFullscreenUi();
      document.addEventListener("fullscreenchange", onFullscreenChange);
      section.__viewerFullscreenBound = true;
      section.__viewerFullscreenChangeHandler = onFullscreenChange;
    }
    if (spectatorMode && typeof window !== "undefined" && !section.__viewerEscapeBound) {
      const onEsc = (event) => {
        if (event.key !== "Escape") return;
        if (!fallbackFullscreen) return;
        fallbackFullscreen = false;
        applyFullscreenUi();
      };
      window.addEventListener("keydown", onEsc);
      section.__viewerEscapeBound = true;
      section.__viewerEscapeHandler = onEsc;
    }
    if (typeof window !== "undefined") {
      if (typeof section.__viewerWindowResizeHandler === "function") {
        window.removeEventListener("resize", section.__viewerWindowResizeHandler);
      }
      const onWindowResize = () => {
        queueMarkLayerSync(true);
      };
      window.addEventListener("resize", onWindowResize);
      section.__viewerWindowResizeHandler = onWindowResize;
    }

    if (mobileScrollToggle) {
      mobileScrollToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        mobileScrollMode = !mobileScrollMode;
        applyMobileScrollModeUi();
      });
    }

    if (typeof options.onStageClick === "function") {
      stage?.addEventListener("click", (event) => {
        options.onStageClick({
          event,
          study: getActiveStudy(),
          frameIndex: activeFrameIndex,
        });
      });
    }

    bindCaptionTokens(captionText, jumpToMark);
    applyMarksVisibilityState();
    if (forceStaticThumbs) {
      thumbsHoverVisible = !thumbsCollapsed;
    } else if (isThumbsAutoRevealBlocked()) {
      thumbsHoverVisible = false;
    }
    applyThumbsVisibility();
    applyMobileScrollModeUi();
    applyStudy();
    renderTrack();
    renderMarks();
    syncMarksNavigationUi();
    applyFullscreenUi();

    return {
      jumpToMark,
      getActiveStudyId() {
        return getActiveStudy()?.id || "";
      },
      getActiveFrameIndex() {
        return activeFrameIndex;
      },
      getMarkPlacementRect() {
        return resolveMarkPlacementRect();
      },
      refreshInteractionState() {
        applyMarksVisibilityState();
        applyFullscreenUi();
      },
      refreshTrackView() {
        applyStudy();
        renderTrack();
        renderMarks();
      },
    };
  }

  function renderViewer(section, safeData, options = {}) {
    if (!safeData.studies.length) {
      section.innerHTML = `
        <div class="module-head">
          ${MODULE_ICON}
          <span data-role="head-title">Visor del caso</span>
          <div class="viewer-head-right" data-role="head-right"></div>
        </div>
        <div class="module-body">
          <div class="studio-empty">Este visor no tiene series de estudio configuradas.</div>
        </div>
      `;
      return null;
    }

    section.innerHTML = `
      <div class="module-head">
        ${MODULE_ICON}
        <span data-role="head-title">Visor del caso</span>
        <div class="viewer-head-right" data-role="head-right">
          <button
            class="studio-outline-btn viewer-thumbs-toggle"
            type="button"
            data-role="thumb-toggle"
            data-lock-state="unlocked"
            aria-pressed="false"
            aria-expanded="true"
            aria-label="Candado inactivo. Miniaturas visibles."
            title="Candado inactivo. Miniaturas visibles."
          >
            <span class="viewer-thumbs-toggle-icon" data-role="thumb-toggle-icon">${THUMBS_UNLOCK_ICON}</span>
            <span class="viewer-thumbs-toggle-text" data-role="thumb-toggle-text">Carrusel auto</span>
          </button>
        </div>
      </div>
      <div class="module-body">
        <div class="viewer-thumbs-wrap" data-role="thumbs-wrap">
          <div class="studies-row">
            <button class="studies-arrow" type="button" data-role="prev">&#8249;</button>
            <div class="studies-viewport">
              <div class="studies-track" data-role="track"></div>
            </div>
            <button class="studies-arrow" type="button" data-role="next">&#8250;</button>
          </div>
        </div>
        <div class="viewer">
          <div class="viewer-stage viewer-stage-vertical ${safeData.studies[0].previewTone}" data-role="stage">
            <div class="viewer-glow"></div>
            <div class="viewer-grid"></div>
            <div class="viewer-mark-layer" data-role="mark-layer">
              <div class="viewer-mark-canvas" data-role="mark-canvas"></div>
            </div>
            <div class="viewer-frame-scroll"><span data-role="frame-scroll-thumb"></span></div>
            <div class="viewer-mark-tools" data-role="mark-tools">
              <button class="viewer-icon" data-role="viewer-icon" type="button" aria-label="Marcadores">
                <span class="viewer-icon-glyph">${MARKS_TOGGLE_ICON}</span>
                <span class="viewer-icon-text" data-role="viewer-icon-text">Mostrar</span>
              </button>
              <div class="viewer-marks-nav" data-role="marks-nav" hidden>
                <button class="viewer-marks-nav-btn" type="button" data-role="marks-nav-prev" aria-label="Marca anterior" title="Marca anterior">&#8249;</button>
                <span class="viewer-marks-nav-count" data-role="marks-nav-count">0/0</span>
                <button class="viewer-marks-nav-btn" type="button" data-role="marks-nav-next" aria-label="Marca siguiente" title="Marca siguiente">&#8250;</button>
              </div>
            </div>
            <button class="viewer-fullscreen-toggle" data-role="fullscreen-toggle" type="button" aria-pressed="false" aria-label="Pantalla completa" title="Pantalla completa">
              ${FULLSCREEN_ICON}
            </button>
            <button
              class="viewer-mobile-scroll-toggle"
              data-role="mobile-scroll-toggle"
              type="button"
              aria-pressed="false"
              aria-label="Activar modo scroll"
              title="Activar modo scroll"
              hidden
            >
              <span class="viewer-mobile-scroll-icon">${MOBILE_SCROLL_ICON}</span>
              <span class="viewer-mobile-scroll-text" data-role="mobile-scroll-toggle-text">Activar scroll de serie</span>
            </button>
            <div class="viewer-counter"><span data-role="counter"></span><span>&bull;&bull;&bull;</span></div>
          </div>
        </div>
        <div class="viewer-caption${safeData.showDescription ? "" : " is-hidden"}">
          <div class="viewer-caption-label">${safeData.descriptionLabel}</div>
          <div class="viewer-caption-text" data-role="caption-text">${safeData.descriptionHtml}</div>
        </div>
      </div>
    `;

    return mountViewerInteractions(section, safeData, options);
  }

  function renderSeriesEditor(safeData, wrapper, onChange) {
    wrapper.innerHTML = "";
    const header = document.createElement("div");
    header.className = "viewer-series-head";
    header.innerHTML = `
      <span class="viewer-series-head-item">Modalidad</span>
      <span class="viewer-series-head-item">Plano</span>
      <span class="viewer-series-head-item viewer-series-head-item-center">Contraste</span>
      <span class="viewer-series-head-item">Imagenes</span>
      <span class="viewer-series-head-item viewer-series-head-item-center">Quitar</span>
    `;
    wrapper.appendChild(header);

    safeData.studies.forEach((study, index) => {
      const row = document.createElement("div");
      row.className = "viewer-series-row";

      function getStudyLabel(studyEntry, studyIndex) {
        const modality = String(studyEntry?.modality || "").trim();
        const plane = String(studyEntry?.plane || "").trim();
        const composed = `${modality} ${plane}`.trim();
        return composed || `Serie ${studyIndex + 1}`;
      }

      function getPickerContext() {
        const currentStudy = safeData.studies[index] || null;
        const modality = String(currentStudy?.modality || "").trim();
        const usedUrlsInModality = Array.from(
          new Set(
            safeData.studies
              .filter((studyEntry) => String(studyEntry?.modality || "").trim() === modality)
              .flatMap((studyEntry) =>
                Array.isArray(studyEntry?.frames) ? studyEntry.frames : []
              )
              .map((url) => String(url || "").trim())
              .filter(Boolean)
          )
        );
        const usedUrlsInCurrentStudy = Array.from(
          new Set(
            (Array.isArray(currentStudy?.frames) ? currentStudy.frames : [])
              .map((url) => String(url || "").trim())
              .filter(Boolean)
          )
        );
        return {
          modality,
          usedUrlsInModality,
          usedUrlsInCurrentStudy,
        };
      }

      function findFrameUsage(url) {
        const targetUrl = String(url || "").trim();
        if (!targetUrl) return null;
        for (let studyIndex = 0; studyIndex < safeData.studies.length; studyIndex += 1) {
          const studyEntry = safeData.studies[studyIndex];
          const frames = Array.isArray(studyEntry?.frames) ? studyEntry.frames : [];
          if (frames.includes(targetUrl)) {
            return {
              studyIndex,
              sameStudy: studyIndex === index,
              label: getStudyLabel(studyEntry, studyIndex),
            };
          }
        }
        return null;
      }

      const modality = document.createElement("select");
      modality.className = "studio-select";
      MODALITY_OPTIONS.forEach((option) => {
        const optionNode = document.createElement("option");
        optionNode.value = option;
        optionNode.textContent = option;
        if (option === study.modality) optionNode.selected = true;
        modality.appendChild(optionNode);
      });
      modality.addEventListener("change", () => {
        safeData.studies[index].modality = modality.value;
        onChange();
      });

      const plane = document.createElement("input");
      plane.className = "studio-input viewer-series-plane-input";
      plane.placeholder = "Plano";
      plane.value = study.plane;
      plane.addEventListener("change", () => {
        safeData.studies[index].plane = plane.value;
        onChange();
      });

      const contrastToggle = document.createElement("button");
      contrastToggle.type = "button";
      contrastToggle.className = "studio-outline-btn viewer-series-contrast-toggle";
      contrastToggle.addEventListener("pointerdown", (event) => {
        event.preventDefault();
      });
      function syncContrastToggle() {
        const isTrue = Boolean(safeData.studies[index].hasContrast);
        contrastToggle.classList.toggle("is-true", isTrue);
        contrastToggle.classList.toggle("is-false", !isTrue);
        contrastToggle.innerHTML = isTrue ? CONTRAST_TRUE_ICON : CONTRAST_FALSE_ICON;
        contrastToggle.setAttribute("aria-pressed", String(isTrue));
        contrastToggle.setAttribute("aria-label", `Contraste: ${isTrue ? "true" : "false"}`);
        contrastToggle.title = `Contraste: ${isTrue ? "true" : "false"}`;
      }
      contrastToggle.addEventListener("click", () => {
        const nextValue = !Boolean(safeData.studies[index].hasContrast);
        safeData.studies[index].hasContrast = nextValue;
        safeData.studies[index].detail = contrastLabelFromFlag(nextValue);
        syncContrastToggle();
        onChange({
          preservePageScroll: true,
          skipBodyRefresh: true,
          skipEditorRefresh: true,
        });
      });
      syncContrastToggle();

      const media = document.createElement("div");
      media.className = "viewer-series-media";
      const mediaLibrary =
        typeof global !== "undefined" ? global.CorvianthMediaLibrary || null : null;
      const mediaFeedback = document.createElement("span");
      mediaFeedback.className = "viewer-series-media-feedback";
      let feedbackTimer = null;

      function setMediaFeedback(message, tone = "info") {
        mediaFeedback.textContent = String(message || "");
        mediaFeedback.dataset.tone = String(tone || "info");
        mediaFeedback.hidden = !message;
        if (feedbackTimer) {
          clearTimeout(feedbackTimer);
          feedbackTimer = null;
        }
        if (message) {
          feedbackTimer = setTimeout(() => {
            mediaFeedback.textContent = "";
            mediaFeedback.hidden = true;
          }, 2200);
        }
      }

      const fileInputId = `viewer-series-upload-${index}-${Math.random().toString(36).slice(2, 8)}`;
      const uploadInput = document.createElement("input");
      uploadInput.id = fileInputId;
      uploadInput.type = "file";
      uploadInput.accept = "image/*";
      uploadInput.multiple = true;
      uploadInput.className = "viewer-series-upload-input";

      const uploadLabel = document.createElement("label");
      uploadLabel.className = "studio-outline-btn viewer-series-upload-btn";
      uploadLabel.setAttribute("for", fileInputId);
      uploadLabel.textContent = "Cargar imagenes";

      const libraryBtn = document.createElement("button");
      libraryBtn.type = "button";
      libraryBtn.className = "studio-outline-btn viewer-series-upload-btn viewer-series-library-btn";
      libraryBtn.textContent = "Biblioteca";
      libraryBtn.disabled = !(
        mediaLibrary && typeof mediaLibrary.openPicker === "function"
      );
      libraryBtn.title = libraryBtn.disabled
        ? "Libreria no disponible en esta vista"
        : "Usar imagen de la libreria";
      libraryBtn.addEventListener("click", async () => {
        if (!mediaLibrary || typeof mediaLibrary.openPicker !== "function") return;
        const picked = await mediaLibrary.openPicker(getPickerContext());
        if (!picked || !picked.url) return;
        const pickedUrl = String(picked.url || "").trim();
        if (!pickedUrl) return;
        const usage = findFrameUsage(pickedUrl);
        if (usage) {
          setMediaFeedback(
            usage.sameStudy
              ? "Imagen ya usada en esta serie."
              : `Imagen ya usada en ${usage.label}.`,
            "warning"
          );
          libraryBtn.classList.add("is-warning");
          setTimeout(() => {
            libraryBtn.classList.remove("is-warning");
          }, 550);
          return;
        }
        const existing = Array.isArray(safeData.studies[index].frames)
          ? safeData.studies[index].frames.slice()
          : [];
        const merged = [...existing, pickedUrl];
        safeData.studies[index].frames = merged;
        safeData.studies[index].totalFrames = Math.max(1, merged.length || 1);
        safeData.studies[index].mediaPulsePending = true;
        safeData.studies[index].defaultFrame = Math.min(
          Math.max(0, Number(safeData.studies[index].defaultFrame) || 0),
          Math.max(0, safeData.studies[index].totalFrames - 1)
        );
        onChange();
      });

      const mediaCount = document.createElement("span");
      mediaCount.className = "viewer-series-media-count";
      const currentFrames = Array.isArray(study.frames) ? study.frames.length : 0;
      mediaCount.textContent = currentFrames
        ? `${currentFrames} imagen${currentFrames === 1 ? "" : "es"}`
        : "Sin imagenes";

      const clearMediaBtn = document.createElement("button");
      clearMediaBtn.type = "button";
      clearMediaBtn.className = "studio-outline-btn viewer-series-clear-btn";
      clearMediaBtn.textContent = "Limpiar";
      clearMediaBtn.disabled = !currentFrames;
      clearMediaBtn.addEventListener("click", () => {
        safeData.studies[index].frames = [];
        safeData.studies[index].totalFrames = 1;
        safeData.studies[index].defaultFrame = 0;
        onChange();
      });

      uploadInput.addEventListener("change", async () => {
        const files = Array.from(uploadInput.files || []);
        if (!files.length) return;
        uploadLabel.classList.add("is-loading");
        mediaCount.textContent = "Procesando...";
        try {
          let loaded = [];
          if (mediaLibrary && typeof mediaLibrary.addFiles === "function") {
            const addedAssets = await mediaLibrary.addFiles(files);
            loaded = (Array.isArray(addedAssets) ? addedAssets : [])
              .map((asset) => String(asset?.url || ""))
              .filter(Boolean);
          } else {
            loaded = await Promise.all(files.map((file) => readFileAsDataUrl(file)));
          }
          const existing = Array.isArray(safeData.studies[index].frames)
            ? safeData.studies[index].frames.slice()
            : [];
          const merged = Array.from(
            new Set([...existing, ...loaded.filter(Boolean).map((url) => String(url || ""))])
          ).filter(Boolean);
          safeData.studies[index].frames = merged;
          safeData.studies[index].totalFrames = Math.max(1, merged.length || 1);
          safeData.studies[index].defaultFrame = Math.min(
            Math.max(0, Number(safeData.studies[index].defaultFrame) || 0),
            Math.max(0, safeData.studies[index].totalFrames - 1)
          );
          onChange();
        } finally {
          uploadInput.value = "";
          uploadLabel.classList.remove("is-loading");
        }
      });

      media.appendChild(uploadInput);
      media.appendChild(uploadLabel);
      media.appendChild(libraryBtn);
      media.appendChild(mediaCount);
      media.appendChild(clearMediaBtn);
      media.appendChild(mediaFeedback);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "studio-outline-btn viewer-series-remove-btn";
      removeBtn.innerHTML = SERIES_REMOVE_ICON;
      removeBtn.setAttribute("aria-label", "Quitar serie");
      removeBtn.title = "Quitar serie";
      removeBtn.addEventListener("click", () => {
        safeData.studies = safeData.studies.filter((_, i) => i !== index);
        onChange();
      });

      row.appendChild(modality);
      row.appendChild(plane);
      row.appendChild(contrastToggle);
      row.appendChild(media);
      row.appendChild(removeBtn);
      wrapper.appendChild(row);
    });
  }

  function renderMarksEditor(safeData, wrapper, onChange, stateKey, getActiveContext) {
    wrapper.innerHTML = "";
    safeData.marks.forEach((mark, index) => {
      const row = document.createElement("div");
      row.className = "viewer-mark-row";

      const idChip = document.createElement("span");
      idChip.className = "viewer-mark-id-chip";
      idChip.textContent = mark.id;

      const text = document.createElement("input");
      text.className = "studio-input viewer-mark-text-readonly";
      text.value = mark.text || "";
      text.placeholder = "Sin texto vinculado";
      text.readOnly = true;
      text.spellcheck = false;
      text.setAttribute("aria-readonly", "true");
      text.title = "Texto vinculado (solo lectura)";

      const study = document.createElement("select");
      study.className = "studio-select";
      safeData.studies.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.modality} ${item.plane}`;
        if (item.id === mark.studyId) option.selected = true;
        study.appendChild(option);
      });
      study.addEventListener("change", () => {
        safeData.marks[index].studyId = study.value;
        onChange();
      });

      const hasArrow =
        Number.isFinite(mark.x) && Number.isFinite(mark.y);
      const hasBubble =
        Boolean(mark.hasBubble) &&
        Number.isFinite(mark.labelX) &&
        Number.isFinite(mark.labelY);

      const linkState = document.createElement("div");
      linkState.className = "viewer-mark-link-state";

      const arrowState = document.createElement("span");
      arrowState.className = `viewer-mark-link-chip ${hasArrow ? "is-on" : "is-off"}`;
      arrowState.textContent = hasArrow ? "↗ Flecha" : "○ Flecha";
      linkState.appendChild(arrowState);

      const bubbleState = document.createElement("span");
      const bubbleTone = hasBubble ? (hasArrow ? "is-on" : "is-warn") : "is-off";
      bubbleState.className = `viewer-mark-link-chip ${bubbleTone}`;
      bubbleState.textContent = hasBubble
        ? hasArrow
          ? "● Globo"
          : "! Globo"
        : "○ Globo";
      linkState.appendChild(bubbleState);

      const isPlacingArrow = viewerPendingManualMarkState.get(stateKey) === mark.id;
      const placeBtn = document.createElement("button");
      placeBtn.type = "button";
      placeBtn.className = `studio-outline-btn viewer-mark-action-btn${
        isPlacingArrow ? " is-armed" : ""
      }`;
      placeBtn.innerHTML = ACTION_ICON_PLACE;
      placeBtn.title = isPlacingArrow ? "Posicionando flecha..." : "Posicionar flecha";
      placeBtn.setAttribute("aria-label", placeBtn.title);
      placeBtn.addEventListener("click", () => {
        viewerPendingManualMarkState.set(stateKey, mark.id);
        if (viewerPendingBubblePlacementState.get(stateKey) === mark.id) {
          viewerPendingBubblePlacementState.delete(stateKey);
        }
        if (viewerPendingArrowPickerState.get(stateKey)?.markId === mark.id) {
          viewerPendingArrowPickerState.delete(stateKey);
        }
        if (viewerPendingMarkTargetMenuState.get(stateKey)?.markId === mark.id) {
          viewerPendingMarkTargetMenuState.delete(stateKey);
        }
        onChange();
      });

      const placeBubbleBtn = document.createElement("button");
      placeBubbleBtn.type = "button";
      const isPlacingBubble = viewerPendingBubblePlacementState.get(stateKey) === mark.id;
      placeBubbleBtn.className = `studio-outline-btn viewer-mark-action-btn${
        isPlacingBubble ? " is-armed" : ""
      }`;
      placeBubbleBtn.innerHTML = ACTION_ICON_BUBBLE;
      placeBubbleBtn.title = isPlacingBubble ? "Ubicando globo..." : "Ubicar globo";
      placeBubbleBtn.setAttribute("aria-label", placeBubbleBtn.title);
      placeBubbleBtn.addEventListener("click", () => {
        viewerPendingBubblePlacementState.set(stateKey, mark.id);
        if (viewerPendingManualMarkState.get(stateKey) === mark.id) {
          viewerPendingManualMarkState.delete(stateKey);
        }
        if (viewerPendingArrowPickerState.get(stateKey)?.markId === mark.id) {
          viewerPendingArrowPickerState.delete(stateKey);
        }
        if (viewerPendingMarkTargetMenuState.get(stateKey)?.markId === mark.id) {
          viewerPendingMarkTargetMenuState.delete(stateKey);
        }
        onChange();
      });

      const clearBubbleBtn = document.createElement("button");
      clearBubbleBtn.type = "button";
      clearBubbleBtn.className = "studio-outline-btn viewer-mark-action-btn";
      clearBubbleBtn.innerHTML = ACTION_ICON_CLEAR_BUBBLE;
      clearBubbleBtn.title = "Quitar globo";
      clearBubbleBtn.setAttribute("aria-label", "Quitar globo");
      clearBubbleBtn.disabled = !(
        Boolean(mark.hasBubble) &&
        Number.isFinite(mark.labelX) &&
        Number.isFinite(mark.labelY)
      );
      clearBubbleBtn.addEventListener("click", () => {
        safeData.marks[index].labelX = null;
        safeData.marks[index].labelY = null;
        safeData.marks[index].hasBubble = false;
        if (viewerPendingBubblePlacementState.get(stateKey) === mark.id) {
          viewerPendingBubblePlacementState.delete(stateKey);
        }
        if (viewerPendingArrowPickerState.get(stateKey)?.markId === mark.id) {
          viewerPendingArrowPickerState.delete(stateKey);
        }
        if (viewerPendingMarkTargetMenuState.get(stateKey)?.markId === mark.id) {
          viewerPendingMarkTargetMenuState.delete(stateKey);
        }
        onChange();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "studio-outline-btn viewer-mark-action-btn is-danger";
      remove.innerHTML = ACTION_ICON_REMOVE;
      remove.title = "Quitar marca";
      remove.setAttribute("aria-label", "Quitar marca");
      remove.addEventListener("click", () => {
        safeData.marks = safeData.marks.filter((_, i) => i !== index);
        safeData.descriptionHtml = pruneCaptionTokensByMarks(
          safeData.descriptionHtml,
          safeData.marks
        );
        if (viewerPendingManualMarkState.get(stateKey) === mark.id) {
          viewerPendingManualMarkState.delete(stateKey);
        }
        if (viewerPendingBubblePlacementState.get(stateKey) === mark.id) {
          viewerPendingBubblePlacementState.delete(stateKey);
        }
        if (viewerPendingArrowPickerState.get(stateKey)?.markId === mark.id) {
          viewerPendingArrowPickerState.delete(stateKey);
        }
        if (viewerPendingMarkTargetMenuState.get(stateKey)?.markId === mark.id) {
          viewerPendingMarkTargetMenuState.delete(stateKey);
        }
        onChange();
      });

      row.appendChild(idChip);
      row.appendChild(text);
      row.appendChild(study);
      row.appendChild(linkState);
      row.appendChild(placeBtn);
      row.appendChild(placeBubbleBtn);
      row.appendChild(clearBubbleBtn);
      row.appendChild(remove);
      wrapper.appendChild(row);
    });
  }

  function wrapSelectionWithMark(range, markId) {
    if (!range || !markId) return false;
    const startElement =
      range.startContainer.nodeType === Node.ELEMENT_NODE
        ? range.startContainer
        : range.startContainer.parentElement;
    const endElement =
      range.endContainer.nodeType === Node.ELEMENT_NODE
        ? range.endContainer
        : range.endContainer.parentElement;
    const startToken = startElement?.closest?.(".viewer-mark-token") || null;
    const endToken = endElement?.closest?.(".viewer-mark-token") || null;
    if (startToken && startToken === endToken) {
      startToken.dataset.markId = markId;
      return true;
    }

    const token = document.createElement("span");
    token.className = "viewer-mark-token viewer-mark-token--interactive";
    token.dataset.markId = markId;
    try {
      range.surroundContents(token);
    } catch (error) {
      token.appendChild(range.extractContents());
      range.insertNode(token);
    }
    return Boolean(token.textContent && token.textContent.trim());
  }

  function rangeHasBlockElements(range) {
    const fragment = range.cloneContents();
    if (!fragment || typeof fragment.querySelector !== "function") return false;
    return Boolean(
      fragment.querySelector(
        "p,div,ul,ol,li,table,tr,td,th,h1,h2,h3,h4,h5,h6,blockquote,section,article"
      )
    );
  }

  function isMarkableSelection(range, rootNode) {
    if (!range || range.collapsed || !rootNode) return false;
    const startParent =
      range.startContainer.nodeType === Node.ELEMENT_NODE
        ? range.startContainer
        : range.startContainer.parentElement;
    const endParent =
      range.endContainer.nodeType === Node.ELEMENT_NODE
        ? range.endContainer
        : range.endContainer.parentElement;
    if (!startParent || !endParent) return false;
    if (!rootNode.contains(startParent) || !rootNode.contains(endParent)) return false;
    const selectedText = String(range.toString() || "");
    if (!selectedText.trim()) return false;
    if (/[\r\n]/.test(selectedText)) return false;
    if (rangeHasBlockElements(range)) return false;
    return true;
  }

  function setupSelectionMarkMenu(
    section,
    safeData,
    onChange,
    isEnabled = () => true,
    getActiveContext = null
  ) {
    if (typeof section.__viewerMarkMenuCleanup === "function") {
      section.__viewerMarkMenuCleanup();
    }

    const captionTextNode = section.querySelector('[data-role="caption-text"]');
    if (!captionTextNode) return;

    const popover = document.createElement("div");
    popover.className = "viewer-mark-popover";
    popover.hidden = true;
    document.body.appendChild(popover);
    let pendingRange = null;
    let keepMenuDuringClick = false;
    const MENU_ANIMATION_MS = 150;
    let hideTimer = null;

    function showMenu() {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      popover.hidden = false;
      popover.classList.remove("is-hiding");
      popover.classList.add("is-visible");
    }

    function hideMenu(immediate = false) {
      pendingRange = null;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      if (immediate) {
        popover.classList.remove("is-visible", "is-hiding");
        popover.hidden = true;
        return;
      }
      if (popover.hidden) return;
      popover.classList.remove("is-visible");
      popover.classList.add("is-hiding");
      hideTimer = setTimeout(() => {
        popover.classList.remove("is-hiding");
        popover.hidden = true;
      }, MENU_ANIMATION_MS);
    }

    function currentContextMarks() {
      const linkedTextIds = getLinkedMarkIdsFromCaptionNode(captionTextNode);
      return [...safeData.marks]
        .filter((mark) => {
          const id = String(mark.id || "").trim();
          const linkedToText = id ? linkedTextIds.has(id) : false;
          return !linkedToText;
        })
        .sort((a, b) =>
          String(a.id || "").localeCompare(String(b.id || ""), undefined, {
            numeric: true,
            sensitivity: "base",
          })
        );
    }

    function resolveSelectionRangeAndText() {
      if (pendingRange && isMarkableSelection(pendingRange, captionTextNode)) {
        return {
          range: pendingRange.cloneRange(),
          text: String(pendingRange.toString() || "").trim(),
        };
      }
      const liveSelection = window.getSelection();
      if (liveSelection && liveSelection.rangeCount > 0 && !liveSelection.isCollapsed) {
        const liveRange = liveSelection.getRangeAt(0).cloneRange();
        if (isMarkableSelection(liveRange, captionTextNode)) {
          return {
            range: liveRange,
            text: String(liveRange.toString() || "").trim(),
          };
        }
      }
      return null;
    }

    function getCurrentContext() {
      if (typeof getActiveContext === "function") {
        const external = getActiveContext();
        return {
          studyId: String(external?.studyId || section.dataset.activeStudyId || safeData.studies[0]?.id || ""),
          frameIndex: Math.max(
            0,
            Number.isFinite(Number(external?.frameIndex))
              ? Number(external?.frameIndex)
              : Number(section.dataset.activeFrameIndex) || 0
          ),
        };
      }
      return {
        studyId: String(section.dataset.activeStudyId || safeData.studies[0]?.id || ""),
        frameIndex: Math.max(0, Number(section.dataset.activeFrameIndex) || 0),
      };
    }

    function applyLink(markId, selectedText = "") {
      if (!markId) return false;
      const selectionData = resolveSelectionRangeAndText();
      if (!selectionData) {
        hideMenu();
        return false;
      }

      const ok = wrapSelectionWithMark(selectionData.range, markId);
      hideMenu();
      if (!ok) return false;
      const mark = safeData.marks.find((item) => item.id === markId);
      const finalText = String(selectedText || selectionData.text || "").trim();
      if (mark && finalText) {
        mark.text = finalText;
      }
      safeData.descriptionHtml = normalizeCaptionHtml(captionTextNode.innerHTML);
      onChange();
      return true;
    }

    function applyQuickLink() {
      const selectionData = resolveSelectionRangeAndText();
      if (!selectionData) {
        hideMenu();
        return;
      }
      const { studyId, frameIndex } = getCurrentContext();
      const newId = nextMarkId(safeData.marks);
      safeData.marks.push({
        id: newId,
        text: selectionData.text,
        studyId,
        frameIndex,
        x: null,
        y: null,
        labelX: null,
        labelY: null,
        hasBubble: false,
        arrowType: ARROW_ICON_OPTIONS[0].id,
      });
      const ok = applyLink(newId, selectionData.text);
      if (!ok) {
        safeData.marks = safeData.marks.filter((mark) => mark.id !== newId);
        onChange();
      }
    }

    function buildMenu() {
      const marks = currentContextMarks();
      popover.innerHTML = "";

      function bindPopoverAction(buttonNode, action) {
        buttonNode.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          event.preventDefault();
        });
        buttonNode.addEventListener("mousedown", (event) => {
          if (event.button !== 0) return;
          event.preventDefault();
        });
        buttonNode.addEventListener("click", (event) => {
          if (event.button !== 0) return;
          event.stopPropagation();
          action();
        });
      }

      const head = document.createElement("button");
      head.type = "button";
      head.className = "viewer-mark-popover-head";
      head.innerHTML = `${MARK_ICON}<span>Marcar</span>`;
      bindPopoverAction(head, () => applyQuickLink());
      popover.appendChild(head);

      if (!marks.length) {
        const empty = document.createElement("div");
        empty.className = "viewer-mark-popover-empty";
        empty.textContent = "Sin IDs disponibles. Crea una flecha manual.";
        popover.appendChild(empty);
        return;
      }

      marks.forEach((mark) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "viewer-mark-popover-item";
        item.textContent = mark.id;
        bindPopoverAction(item, () => applyLink(mark.id));
        popover.appendChild(item);
      });
    }

    function showMenuFromSelection() {
      if (!isEnabled()) {
        hideMenu();
        return;
      }
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        hideMenu();
        return;
      }
      const range = selection.getRangeAt(0);
      const container =
        range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
          ? range.commonAncestorContainer
          : range.commonAncestorContainer.parentElement;
      if (!container || !captionTextNode.contains(container)) {
        hideMenu();
        return;
      }
      if (!selection.toString().trim()) {
        hideMenu();
        return;
      }
      if (!isMarkableSelection(range, captionTextNode)) {
        hideMenu();
        return;
      }

      pendingRange = range.cloneRange();
      buildMenu();
      const rect = range.getBoundingClientRect();
      showMenu();
      const top = Math.max(8, rect.top + window.scrollY - 6);
      const left = Math.max(8, rect.right + window.scrollX + 10);
      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
      const bounds = popover.getBoundingClientRect();
      const overflowX = bounds.right - window.innerWidth + 8;
      const overflowY = bounds.bottom - window.innerHeight + 8;
      if (overflowX > 0) {
        popover.style.left = `${Math.max(8, left - overflowX)}px`;
      }
      if (overflowY > 0) {
        popover.style.top = `${Math.max(8, top - overflowY)}px`;
      }
    }

    const onMouseUp = () => {
      if (!isEnabled()) {
        hideMenu();
        return;
      }
      setTimeout(showMenuFromSelection, 0);
    };
    const onKeyUp = () => {
      if (!isEnabled()) {
        hideMenu();
        return;
      }
      setTimeout(showMenuFromSelection, 0);
    };
    const onDocLeftClick = (event) => {
      if (event.button !== 0) return;
      if (!popover.hidden) hideMenu();
    };
    const onDocScroll = () => hideMenu();
    const onDocPointerUp = (event) => {
      if (keepMenuDuringClick) return;
      if (event?.target && popover.contains(event.target)) return;
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
          hideMenu();
          return;
        }
        const range = selection.getRangeAt(0);
        const container =
          range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
            ? range.commonAncestorContainer
            : range.commonAncestorContainer.parentElement;
        if (!container || !captionTextNode.contains(container)) {
          hideMenu();
        }
      }, 0);
    };
    const onWindowBlur = () => hideMenu();
    const onPopoverPointerDown = () => {
      keepMenuDuringClick = true;
    };
    const onPopoverMouseDown = () => {
      keepMenuDuringClick = true;
      setTimeout(() => {
        keepMenuDuringClick = false;
      }, 0);
    };
    const onDocPointerUpReset = () => {
      setTimeout(() => {
        keepMenuDuringClick = false;
      }, 0);
    };
    const onSelectionChange = () => {
      if (popover.hidden || keepMenuDuringClick) return;
      if (!isEnabled()) {
        hideMenu();
        return;
      }
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        hideMenu();
        return;
      }
      if (selection.isCollapsed) {
        hideMenu();
        return;
      }
      const range = selection.getRangeAt(0);
      const container =
        range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
          ? range.commonAncestorContainer
          : range.commonAncestorContainer.parentElement;
      if (!container || !captionTextNode.contains(container)) {
        hideMenu();
      }
    };

    captionTextNode.addEventListener("mouseup", onMouseUp);
    captionTextNode.addEventListener("keyup", onKeyUp);
    captionTextNode.addEventListener("blur", hideMenu);
    document.addEventListener("click", onDocLeftClick);
    document.addEventListener("pointerup", onDocPointerUp);
    document.addEventListener("pointerup", onDocPointerUpReset);
    window.addEventListener("scroll", onDocScroll, true);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("selectionchange", onSelectionChange);
    popover.addEventListener("pointerdown", onPopoverPointerDown);
    popover.addEventListener("mousedown", onPopoverMouseDown);

    section.__viewerMarkMenuCleanup = () => {
      captionTextNode.removeEventListener("mouseup", onMouseUp);
      captionTextNode.removeEventListener("keyup", onKeyUp);
      captionTextNode.removeEventListener("blur", hideMenu);
      document.removeEventListener("click", onDocLeftClick);
      document.removeEventListener("pointerup", onDocPointerUp);
      document.removeEventListener("pointerup", onDocPointerUpReset);
      window.removeEventListener("scroll", onDocScroll, true);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("selectionchange", onSelectionChange);
      popover.removeEventListener("pointerdown", onPopoverPointerDown);
      popover.removeEventListener("mousedown", onPopoverMouseDown);
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      hideMenu(true);
      popover.remove();
    };
  }

  registry.viewer = {
    type: "viewer",
    label: "Visor",
    description: "Visor rectangular vertical con marcado de texto y frames.",
    createDefaultData() {
      return {
        title: "Visor del caso",
        showDescription: true,
        descriptionLabel: "Descripcion de la figura",
        descriptionHtml:
          "Selecciona texto para vincularlo con un ID de flecha, o crea una flecha manual en el frame y luego vincula.",
        studies: [
          {
            id: "vw-1",
            modality: "MRI",
            plane: "Sagital",
            series: "Rodilla",
            detail: "PD fat sat",
            previewTone: "tone-1",
            totalFrames: 4,
            defaultFrame: 0,
            frames: [
              "./assets/frames/medial-meniscocapsular-recess.jpg",
              "./assets/frames/medial-meniscocapsular-recess-1.jpg",
              "./assets/frames/medial-meniscocapsular-recess-2.jpg",
              "./assets/frames/medial-meniscocapsular-recess-3.jpg",
            ],
          },
        ],
        marks: [],
      };
    },
    renderDisplay(data) {
      const safeData = normalizeData(data);
      const section = document.createElement("section");
      section.className = "module viewer-full-bleed-mobile";
      renderViewer(section, safeData, {
        spectatorMode: true,
        initialMarksVisible: false,
      });
      return section;
    },
    renderEditable(data, context) {
      const stateKey = context?.moduleId || "viewer-local";
      const safeData = normalizeData(data);
      const section = document.createElement("section");
      section.className = "module viewer-full-bleed-mobile viewer-module";
      const persistedContext = viewerActiveContextState.get(stateKey);
      if (persistedContext?.studyId) {
        section.dataset.activeStudyId = String(persistedContext.studyId);
      }
      if (Number.isFinite(persistedContext?.frameIndex)) {
        section.dataset.activeFrameIndex = String(Math.max(0, Number(persistedContext.frameIndex) || 0));
      }

      function getActiveViewContext() {
        const interactionStudyId = interaction?.getActiveStudyId?.() || "";
        const interactionFrameIndex = interaction?.getActiveFrameIndex?.();
        const saved = viewerActiveContextState.get(stateKey);
        return {
          studyId:
            interactionStudyId ||
            section.dataset.activeStudyId ||
            saved?.studyId ||
            safeData.studies[0]?.id ||
            "",
          frameIndex: Number.isFinite(interactionFrameIndex)
            ? Math.max(0, Number(interactionFrameIndex) || 0)
            : Number.isFinite(Number(section.dataset.activeFrameIndex))
              ? Math.max(0, Number(section.dataset.activeFrameIndex) || 0)
              : Math.max(0, Number(saved?.frameIndex) || 0),
        };
      }

      let viewerToolsOpen = viewerEditOpenState.get(stateKey) === true;

      const interactionOptions = {
        isThumbsAutoRevealBlocked() {
          return Boolean(viewerPendingManualMarkState.get(stateKey));
        },
        isViewerEditModeActive() {
          return viewerToolsOpen;
        },
        onActiveContextChange({ studyId, frameIndex }) {
          viewerActiveContextState.set(stateKey, {
            studyId: String(studyId || safeData.studies[0]?.id || ""),
            frameIndex: Math.max(0, Number(frameIndex) || 0),
          });
        },
        onMarkTargetClick({ markId, target, studyId, frameIndex, x, y }) {
          viewerPendingMarkTargetMenuState.set(stateKey, {
            markId: String(markId || ""),
            target: target === "bubble" ? "bubble" : "arrow",
            studyId: String(studyId || safeData.studies[0]?.id || ""),
            frameIndex: Math.max(0, Number(frameIndex) || 0),
            x: parsePlacedCoordinate(x),
            y: parsePlacedCoordinate(y),
          });
          viewerPendingArrowPickerState.delete(stateKey);
          renderArrowTypePicker();
          renderMarkTargetMenu();
        },
        onStageClick({ event, study, frameIndex }) {
          viewerPendingMarkTargetMenuState.delete(stateKey);
          const stage = section.querySelector('[data-role="stage"]');
          if (!stage) return;
          const rect = interaction?.getMarkPlacementRect?.() || stage.getBoundingClientRect();
          const point = getStagePercent(event, rect);
          if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
          const activeContext = getActiveViewContext();
          const resolvedStudyId = String(
            activeContext.studyId || study?.id || safeData.studies[0]?.id || ""
          );
          const resolvedFrameIndex = Number.isFinite(Number(activeContext.frameIndex))
            ? Math.max(0, Number(activeContext.frameIndex) || 0)
            : Number.isFinite(frameIndex)
              ? Math.max(0, Number(frameIndex) || 0)
              : 0;

          const pendingBubbleId = viewerPendingBubblePlacementState.get(stateKey);
          if (pendingBubbleId) {
            const bubbleMark = safeData.marks.find((item) => item.id === pendingBubbleId);
            if (!bubbleMark) return;
            bubbleMark.studyId = resolvedStudyId;
            bubbleMark.frameIndex = resolvedFrameIndex;
            bubbleMark.labelX = point.x;
            bubbleMark.labelY = point.y;
            bubbleMark.hasBubble = true;
            viewerPendingBubblePlacementState.delete(stateKey);
            refreshAll();
            return;
          }

          const pendingMarkId = viewerPendingManualMarkState.get(stateKey);
          if (!pendingMarkId) return;
          const mark = safeData.marks.find((item) => item.id === pendingMarkId);
          if (!mark) return;
          mark.studyId = resolvedStudyId;
          mark.frameIndex = resolvedFrameIndex;
          mark.x = point.x;
          mark.y = point.y;
          viewerPendingManualMarkState.delete(stateKey);
          viewerPendingArrowPickerState.set(stateKey, {
            markId: mark.id,
            x: point.x,
            y: point.y,
            studyId: resolvedStudyId,
            frameIndex: resolvedFrameIndex,
          });
          refreshAll();
        },
      };

      let interaction = renderViewer(section, safeData, interactionOptions);

      function refreshBodyOnly() {
        const currentViewport = section.querySelector(".studies-viewport");
        const previousTrackScrollLeft = currentViewport
          ? Number(currentViewport.scrollLeft) || 0
          : 0;
        const activeStudyId = interaction?.getActiveStudyId?.() || "";
        const activeFrameIndex = interaction?.getActiveFrameIndex?.();
        if (activeStudyId) {
          section.dataset.activeStudyId = activeStudyId;
        }
        if (Number.isFinite(activeFrameIndex)) {
          section.dataset.activeFrameIndex = String(activeFrameIndex);
        }
        const activeContext = getActiveViewContext();
        viewerActiveContextState.set(stateKey, {
          studyId: String(activeContext.studyId || safeData.studies[0]?.id || ""),
          frameIndex: Math.max(0, Number(activeContext.frameIndex) || 0),
        });

        const temp = document.createElement("section");
        temp.className = section.className;
        renderViewer(temp, safeData, interactionOptions);
        const nextBody = temp.querySelector(".module-body");
        const currentBody = section.querySelector(".module-body");
        const nextHeadTitle = temp.querySelector('[data-role="head-title"]');
        const currentHeadTitle = section.querySelector('[data-role="head-title"]');
        if (nextHeadTitle && currentHeadTitle) {
          currentHeadTitle.textContent = nextHeadTitle.textContent || "Visor del caso";
        }
        if (nextBody && currentBody) {
          currentBody.replaceWith(nextBody);
        }
        interaction = mountViewerInteractions(section, safeData, interactionOptions);
        const restoredViewport = section.querySelector(".studies-viewport");
        if (restoredViewport && previousTrackScrollLeft > 0) {
          restoredViewport.scrollLeft = previousTrackScrollLeft;
        }
      }

      const head = section.querySelector(".module-head");
      const headRight = head?.querySelector('[data-role="head-right"]');
      if (!headRight) return section;

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "studio-outline-btn viewer-mode-btn";
      editBtn.textContent = "Editar visor";
      editBtn.setAttribute("aria-expanded", String(viewerToolsOpen));
      headRight.appendChild(editBtn);

      const panel = document.createElement("div");
      panel.className = "viewer-mode-panel";
      panel.hidden = !viewerToolsOpen;
      section.classList.toggle("is-edit-mode", viewerToolsOpen);

      const fields = document.createElement("div");
      fields.className = "viewer-mode-fields";

      const showDescriptionRow = document.createElement("label");
      showDescriptionRow.className = "viewer-switch";
      const showDescription = document.createElement("input");
      showDescription.type = "checkbox";
      showDescription.checked = safeData.showDescription;
      const switchText = document.createElement("span");
      switchText.textContent = "Mostrar descripcion de la figura";
      showDescriptionRow.appendChild(showDescription);
      showDescriptionRow.appendChild(switchText);
      fields.appendChild(showDescriptionRow);

      const createManualBtn = document.createElement("button");
      createManualBtn.type = "button";
      createManualBtn.className = "hero-btn accent";
      createManualBtn.textContent = "Agregar flecha manual";
      createManualBtn.addEventListener("click", () => {
        const activeContext = getActiveViewContext();
        const newId = nextMarkId(safeData.marks);
        safeData.marks.push({
          id: newId,
          text: "",
          studyId: activeContext.studyId,
          frameIndex: activeContext.frameIndex,
          x: null,
          y: null,
          labelX: null,
          labelY: null,
          hasBubble: false,
          arrowType: ARROW_ICON_OPTIONS[0].id,
        });
        viewerPendingManualMarkState.set(stateKey, newId);
        viewerPendingBubblePlacementState.delete(stateKey);
        viewerPendingArrowPickerState.delete(stateKey);
        viewerPendingMarkTargetMenuState.delete(stateKey);
        refreshAll();
      });
      fields.appendChild(createManualBtn);

      const marksTitle = document.createElement("div");
      marksTitle.className = "module-head-label";
      marksTitle.textContent = "Marcados";
      fields.appendChild(marksTitle);

      const marksWrap = document.createElement("div");
      marksWrap.className = "viewer-marks-list";
      fields.appendChild(marksWrap);

      const seriesTitle = document.createElement("div");
      seriesTitle.className = "module-head-label";
      seriesTitle.textContent = "Series de estudio";
      fields.appendChild(seriesTitle);

      const seriesWrap = document.createElement("div");
      seriesWrap.className = "viewer-series-list";
      fields.appendChild(seriesWrap);

      const addSeriesBtn = document.createElement("button");
      addSeriesBtn.type = "button";
      addSeriesBtn.className = "studio-outline-btn";
      addSeriesBtn.textContent = "Agregar serie";
      addSeriesBtn.addEventListener("click", () => {
        const tone = `tone-${(safeData.studies.length % 4) + 1}`;
        safeData.studies.push({
          id: `vw-${Date.now()}-${safeData.studies.length + 1}`,
          modality: "CT",
          plane: "Axial",
          series: "Nueva serie",
          hasContrast: false,
          detail: "Sin contraste",
          previewTone: tone,
          totalFrames: 1,
          defaultFrame: 0,
          frames: [],
        });
        refreshAll();
      });
      fields.appendChild(addSeriesBtn);

      panel.appendChild(fields);
      section.appendChild(panel);

      function renderArrowTypePicker() {
        if (typeof section.__viewerArrowPickerCleanup === "function") {
          section.__viewerArrowPickerCleanup();
          section.__viewerArrowPickerCleanup = null;
        }

        const pickerState = viewerPendingArrowPickerState.get(stateKey);
        if (!pickerState) return;

        const mark = safeData.marks.find((item) => item.id === pickerState.markId);
        if (!mark) {
          viewerPendingArrowPickerState.delete(stateKey);
          return;
        }

        const activeContext = getActiveViewContext();
        if (
          String(mark.studyId || "") !== String(activeContext.studyId || "") ||
          Math.max(0, Number(mark.frameIndex) || 0) !==
            Math.max(0, Number(activeContext.frameIndex) || 0)
        ) {
          return;
        }

        const stage = section.querySelector('[data-role="stage"]');
        if (!stage) return;
        const markLayerHost = section.querySelector('[data-role="mark-layer"]') || stage;

        const anchorX = Number.isFinite(Number(pickerState.x))
          ? Math.min(99, Math.max(1, Number(pickerState.x)))
          : Number.isFinite(mark.x)
            ? Math.min(99, Math.max(1, Number(mark.x)))
            : 50;
        const anchorY = Number.isFinite(Number(pickerState.y))
          ? Math.min(99, Math.max(1, Number(pickerState.y)))
          : Number.isFinite(mark.y)
            ? Math.min(99, Math.max(1, Number(mark.y)))
            : 50;

        const picker = document.createElement("div");
        picker.className = "viewer-arrow-picker";
        picker.style.left = `${anchorX}%`;
        picker.style.top = `${anchorY}%`;
        picker.dataset.placement = anchorY <= 18 ? "below" : "above";

        ARROW_ICON_OPTIONS.forEach((option) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `viewer-arrow-picker-btn${
            String(mark.arrowType || "") === option.id ? " is-active" : ""
          }`;
          button.title = option.label;
          button.setAttribute("aria-label", option.label);
          button.innerHTML = `<img src="${option.src}" alt="" aria-hidden="true" />`;
          button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            mark.arrowType = option.id;
            viewerPendingArrowPickerState.delete(stateKey);
            refreshAll();
          });
          picker.appendChild(button);
        });

        markLayerHost.appendChild(picker);
        requestAnimationFrame(() => {
          picker.classList.add("is-visible");
        });

        const onDocumentPointerDown = (event) => {
          if (picker.contains(event.target)) return;
          viewerPendingArrowPickerState.delete(stateKey);
          renderArrowTypePicker();
        };

        document.addEventListener("pointerdown", onDocumentPointerDown, true);

        section.__viewerArrowPickerCleanup = () => {
          document.removeEventListener("pointerdown", onDocumentPointerDown, true);
          picker.remove();
        };
      }

      function renderMarkTargetMenu() {
        if (typeof section.__viewerMarkTargetMenuCleanup === "function") {
          section.__viewerMarkTargetMenuCleanup();
          section.__viewerMarkTargetMenuCleanup = null;
        }

        const menuState = viewerPendingMarkTargetMenuState.get(stateKey);
        if (!menuState) return;

        const mark = safeData.marks.find((item) => item.id === menuState.markId);
        if (!mark) {
          viewerPendingMarkTargetMenuState.delete(stateKey);
          return;
        }

        const activeContext = getActiveViewContext();
        if (
          String(mark.studyId || "") !== String(activeContext.studyId || "") ||
          Math.max(0, Number(mark.frameIndex) || 0) !==
            Math.max(0, Number(activeContext.frameIndex) || 0)
        ) {
          return;
        }

        const stage = section.querySelector('[data-role="stage"]');
        if (!stage) return;
        const markLayerHost = section.querySelector('[data-role="mark-layer"]') || stage;

        const targetType = menuState.target === "bubble" ? "bubble" : "arrow";
        const anchorX =
          targetType === "bubble"
            ? parsePlacedCoordinate(mark.labelX)
            : parsePlacedCoordinate(mark.x);
        const anchorY =
          targetType === "bubble"
            ? parsePlacedCoordinate(mark.labelY)
            : parsePlacedCoordinate(mark.y);
        if (!Number.isFinite(anchorX) || !Number.isFinite(anchorY)) {
          viewerPendingMarkTargetMenuState.delete(stateKey);
          return;
        }

        const menu = document.createElement("div");
        menu.className = "viewer-mark-target-menu";
        menu.style.left = `${anchorX}%`;
        menu.style.top = `${anchorY}%`;
        menu.dataset.placement = anchorY <= 18 ? "below" : "above";

        const actionBtn = document.createElement("button");
        actionBtn.type = "button";
        actionBtn.className = "viewer-mark-target-menu-btn";
        actionBtn.textContent = targetType === "bubble" ? "Eliminar globo" : "Eliminar flecha";
        actionBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (targetType === "bubble") {
            mark.labelX = null;
            mark.labelY = null;
            mark.hasBubble = false;
          } else {
            mark.x = null;
            mark.y = null;
            if (viewerPendingArrowPickerState.get(stateKey)?.markId === mark.id) {
              viewerPendingArrowPickerState.delete(stateKey);
            }
          }
          viewerPendingMarkTargetMenuState.delete(stateKey);
          refreshAll();
        });
        menu.appendChild(actionBtn);

        markLayerHost.appendChild(menu);
        requestAnimationFrame(() => {
          menu.classList.add("is-visible");
        });

        const onDocumentPointerDown = (event) => {
          if (menu.contains(event.target)) return;
          viewerPendingMarkTargetMenuState.delete(stateKey);
          renderMarkTargetMenu();
        };

        document.addEventListener("pointerdown", onDocumentPointerDown, true);

        section.__viewerMarkTargetMenuCleanup = () => {
          document.removeEventListener("pointerdown", onDocumentPointerDown, true);
          menu.remove();
        };
      }

      function bindCaptionEditing() {
        const captionWrap = section.querySelector(".viewer-caption");
        const captionTextNode = section.querySelector('[data-role="caption-text"]');
        const canEditCaption = !panel.hidden && safeData.showDescription;
        if (captionWrap) captionWrap.classList.toggle("is-editable", canEditCaption);
        if (!captionTextNode) return;
        captionTextNode.contentEditable = String(canEditCaption);
        captionTextNode.spellcheck = canEditCaption;
        captionTextNode.dataset.richText = "true";
        captionTextNode.dataset.placeholder = "Escribe aqui la descripcion de la figura...";
        captionTextNode.dataset.empty = captionTextNode.textContent?.trim() ? "false" : "true";
        if (canEditCaption && captionTextNode.dataset.captionInputBound !== "true") {
          captionTextNode.dataset.captionInputBound = "true";
          captionTextNode.addEventListener("input", () => {
            safeData.descriptionHtml = normalizeCaptionHtml(captionTextNode.innerHTML);
            captionTextNode.dataset.empty = captionTextNode.textContent?.trim() ? "false" : "true";
            context.onChange({ ...safeData }, { rerenderCanvas: false });
          });
        }
      }

      function isMarkMenuEnabled() {
        return !panel.hidden && safeData.showDescription;
      }

      function refreshAll(options = {}) {
        const preservePageScroll = Boolean(options.preservePageScroll);
        const skipBodyRefresh = Boolean(options.skipBodyRefresh);
        const skipEditorRefresh = Boolean(options.skipEditorRefresh);
        const previousScrollY = preservePageScroll ? window.scrollY : null;
        safeData.descriptionHtml = pruneCaptionTokensByMarks(
          safeData.descriptionHtml,
          safeData.marks
        );
        context.onChange({ ...safeData }, { rerenderCanvas: false });
        if (skipBodyRefresh) {
          interaction?.refreshTrackView?.();
        } else {
          refreshBodyOnly();
        }
        if (!skipEditorRefresh) {
          renderSeriesEditor(safeData, seriesWrap, refreshAll);
          renderMarksEditor(
            safeData,
            marksWrap,
            refreshAll,
            stateKey,
            getActiveViewContext
          );
          bindCaptionEditing();
          setupSelectionMarkMenu(
            section,
            safeData,
            refreshAll,
            isMarkMenuEnabled,
            getActiveViewContext
          );
          renderArrowTypePicker();
          renderMarkTargetMenu();
        }
        if (preservePageScroll && Number.isFinite(previousScrollY)) {
          window.scrollTo({ top: previousScrollY, behavior: "auto" });
        }
      }

      showDescription.addEventListener("change", () => {
        safeData.showDescription = showDescription.checked;
        refreshAll();
      });
      editBtn.addEventListener("click", () => {
        const nextOpen = panel.hidden;
        viewerToolsOpen = nextOpen;
        panel.hidden = !nextOpen;
        editBtn.setAttribute("aria-expanded", String(nextOpen));
        section.classList.toggle("is-edit-mode", nextOpen);
        viewerEditOpenState.set(stateKey, nextOpen);
        interaction?.refreshInteractionState?.();
        bindCaptionEditing();
        setupSelectionMarkMenu(
          section,
          safeData,
          refreshAll,
          isMarkMenuEnabled,
          getActiveViewContext
        );
        renderArrowTypePicker();
        renderMarkTargetMenu();
      });

      renderSeriesEditor(safeData, seriesWrap, refreshAll);
      renderMarksEditor(
        safeData,
        marksWrap,
        refreshAll,
        stateKey,
        getActiveViewContext
      );
      bindCaptionEditing();
      setupSelectionMarkMenu(
        section,
        safeData,
        refreshAll,
        isMarkMenuEnabled,
        getActiveViewContext
      );
      renderArrowTypePicker();
      renderMarkTargetMenu();

      return section;
    },
  };
})(window);
