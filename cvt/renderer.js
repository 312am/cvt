(function registerRenderer(global) {
  const ARTICLE_STORAGE_KEY = "corvianth-article-draft-v1";
  const ARTICLE_REVIEW_STORAGE_KEY = "corvianth-article-review-v1";
  const ARTICLE_PUBLISHED_STORAGE_KEY = "corvianth-article-published-v1";
  const WORKFLOW = {
    DRAFT: "draft",
    IN_REVIEW: "in_review",
    PUBLISHED: "published",
  };

  function createEmptyBibliographyModule() {
    return {
      id: `bibliography-${Date.now()}`,
      type: "bibliography",
      data: {
        title: "Bibliografia",
        items: [{ text: "", url: "" }],
      },
    };
  }

  function ensureBibliographyModule(modules) {
    const safeModules = Array.isArray(modules) ? modules.slice() : [];
    const hasBibliography = safeModules.some(
      (moduleEntry) => moduleEntry?.type === "bibliography"
    );
    if (!hasBibliography) {
      safeModules.push(createEmptyBibliographyModule());
    }
    return safeModules;
  }

  function normalizeViewerStudies(studies) {
    if (!Array.isArray(studies) || !studies.length) return [];
    return studies.map((study, index) => ({
      id: study.id || `viewer-study-${index + 1}`,
      modality: study.modality || "CT",
      plane: study.plane || "Axial",
      series: study.series || "Serie",
      detail: study.detail || "Sin contraste",
      previewTone: study.previewTone || `tone-${(index % 4) + 1}`,
      totalFrames: Math.max(1, Number(study.totalFrames) || 1),
      defaultFrame: Math.max(0, Number(study.defaultFrame) || 0),
    }));
  }

  function legacyViewerToUnified(moduleEntry) {
    if (!moduleEntry || !moduleEntry.type) return moduleEntry;
    if (moduleEntry.type !== "viewer-basic" && moduleEntry.type !== "viewer-editorial") {
      return moduleEntry;
    }

    const data = moduleEntry.data || {};
    const studies = normalizeViewerStudies(data.studies);
    let descriptionHtml = data.descriptionHtml || "";

    if (!descriptionHtml && Array.isArray(data.notes) && data.notes.length) {
      descriptionHtml = data.notes
        .map((note) => String(note?.html || "").trim())
        .filter(Boolean)
        .join("<br><br>");
    }

    return {
      id: moduleEntry.id || `viewer-${Date.now()}`,
      type: "viewer",
      data: {
        title: data.title || "Visor del caso",
        showDescription:
          moduleEntry.type === "viewer-editorial" || Boolean(descriptionHtml),
        descriptionLabel: data.descriptionLabel || "Descripcion de la figura",
        descriptionHtml,
        studies,
        marks: [],
      },
    };
  }

  function normalizeArticle(rawArticle) {
    if (!rawArticle || typeof rawArticle !== "object") {
      return createDefaultArticle();
    }

    const modules = Array.isArray(rawArticle.modules) ? rawArticle.modules : [];
    const normalizedModules = ensureBibliographyModule(
      modules
        .filter((item) => item?.type !== "footer")
        .map((item) => legacyViewerToUnified(item))
    );

    const statusValue =
      rawArticle.status === WORKFLOW.IN_REVIEW ||
      rawArticle.status === WORKFLOW.PUBLISHED
        ? rawArticle.status
        : WORKFLOW.DRAFT;

    return {
      ...rawArticle,
      status: statusValue,
      modules: normalizedModules,
    };
  }

  function createDefaultArticle() {
    return {
      id: "article-0001",
      slug: "adrenocortical-carcinoma-entrada-estandar",
      status: WORKFLOW.DRAFT,
      seo: {
        title: "Adrenocortical carcinoma: entrada estandar",
        description:
          "Demo modular de adrenocortical carcinoma con estructura editorial estandar.",
      },
      meta: {
        title: "Adrenocortical carcinoma",
        author: "Corvianth",
        date: "2026-04-16",
        tags: ["Oncologia endocrina", "Suprarrenal", "Caso estandar"],
      },
      modules: [
        {
          id: "hero-1",
          type: "hero",
          data: {
            eyebrow: "Guia clinica / Oncologia endocrina",
            title: "Adrenocortical carcinoma: enfoque diagnostico y terapeutico",
            entryPrefix: "Por",
            author: "Corvianth",
            date: "16 de abril de 2026",
            tags: ["Oncologia endocrina", "Suprarrenal", "Intermedio"],
          },
        },
        {
          id: "patient-1",
          type: "patient",
          data: {
            title: "Presentacion del paciente",
            summary:
              "Paciente femenina de 48 anos con hipertension de dificil control, hipokalemia, debilidad proximal y aumento de peso progresivo en los ultimos meses.",
            age: "48 anos",
            sex: "Femenino",
            reason: "Sospecha de tumor suprarrenal funcional",
            side: "Izquierdo",
          },
        },
        {
          id: "text-1",
          type: "text",
          data: {
            title: "Nueva seccion",
            blocks: [
              {
                subtitle: "Contexto clinico",
                body:
                  "El adrenocortical carcinoma (ACC) es un tumor raro de la corteza suprarrenal. Puede presentarse por exceso hormonal o como masa no funcional detectada incidentalmente.",
              },
              {
                subtitle: "Objetivo de la entrada",
                body:
                  "Esta entrada resume presentacion, hallazgos por imagen y estrategia terapeutica en formato modular reutilizable.",
              },
            ],
          },
        },
        {
          id: "subtitle-1",
          type: "subtitle",
          data: {
            subtitle: "Presentacion y laboratorio",
            body:
              "Los tumores funcionales pueden cursar con hipercortisolismo, alteraciones androgenicas o combinaciones hormonales. La evaluacion incluye cortisol y pruebas de supresion con dexametasona, entre otras.",
          },
        },
        {
          id: "text-only-1",
          type: "text-only",
          data: {
            body:
              "Una parte relevante de los casos se detecta por hallazgo incidental. El estadio, la reseccion completa y el grado histologico son factores pronosticos centrales.",
          },
        },
        {
          id: "subtitle-2",
          type: "subtitle",
          data: {
            subtitle: "Imagen: puntos clave en TC y RM",
            body:
              "Suelen observarse masas grandes, heterogeneas, con necrosis/hemorragia y bordes irregulares. En contexto adecuado, una lesion suprarrenal >4 cm con rasgos agresivos requiere valoracion oncologica y quirurgica.",
          },
        },
        {
          id: "key-point-1",
          type: "key-point",
          data: {
            title: "Punto clave",
            quote:
              "En ACC, la reseccion completa cuando es posible es el eje del tratamiento inicial y el principal determinante pronostico.",
            footer: "Principio operativo de manejo",
          },
        },
        {
          id: "pitfalls-1",
          type: "pitfalls",
          data: {
            title: "Pitfalls",
            warningTitle: "Errores frecuentes de interpretacion",
            items: [
              "Asumir benignidad solo por hallazgo incidental sin integrar clinica y laboratorio.",
              "Interpretar imagen sin estadiaje sistematico toracoabdominal.",
              "Retrasar referencia quirurgica en lesiones con alta sospecha de malignidad.",
            ],
            checklist:
              "Checklist: confirmar perfil hormonal, estadiaje por imagen, resecabilidad y plan multidisciplinario.",
          },
        },
        {
          id: "viewer-1",
          type: "viewer",
          data: {
            title: "Visor principal del caso",
            stageLabel: "Revision por modalidades",
            showDescription: true,
            descriptionLabel: "Descripcion de la figura",
            descriptionHtml:
              'Masa suprarrenal <span class="hl">heterogenea</span> con necrosis central y signos de extension local.',
            studies: [
              {
                id: "vw-1",
                modality: "MRI",
                plane: "Coronal",
                series: "Rodilla",
                detail: "PD FS",
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
              {
                id: "vw-2",
                modality: "MRI",
                plane: "Coronal",
                series: "Rodilla",
                detail: "T2",
                previewTone: "tone-2",
                totalFrames: 3,
                defaultFrame: 0,
              },
              {
                id: "vw-3",
                modality: "MRI",
                plane: "T2",
                series: "Suprarrenal",
                detail: "Multiplanar",
                previewTone: "tone-3",
                totalFrames: 5,
                defaultFrame: 0,
              },
            ],
            marks: [],
          },
        },
        {
          id: "text-2",
          type: "text",
          data: {
            title: "Conclusion",
            blocks: [
              {
                subtitle: "Impresion diagnostica",
                body:
                  "Hallazgos compatibles con carcinoma adrenocortical con alta sospecha de comportamiento agresivo.",
              },
              {
                subtitle: "Conducta sugerida",
                body:
                  "Priorizar valoracion en comite multidisciplinario, definir resecabilidad y plan sistemico segun estadio.",
              },
            ],
          },
        },
        {
          id: "bibliography-1",
          type: "bibliography",
          data: {
            title: "Bibliografia",
            items: [
              {
                text: "Fassnacht M, Dekkers OM, Else T, et al. European Society of Endocrinology clinical practice guidelines on adrenocortical carcinoma in adults, in collaboration with ENSAT.",
                url: "https://academic.oup.com/ejendo/article/179/4/G1/6653915",
              },
              {
                text: "Bancos I, Tamhane S, Shah M, et al. Diagnosis and management of adrenal masses and adrenocortical carcinoma.",
                url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7098830/",
              },
            ],
          },
        },
      ],
    };
  }

  function loadArticle() {
    const savedArticle = localStorage.getItem(ARTICLE_STORAGE_KEY);

    if (!savedArticle) {
      return createDefaultArticle();
    }

    try {
      return normalizeArticle(JSON.parse(savedArticle));
    } catch (error) {
      return createDefaultArticle();
    }
  }

  function loadPublishedArticle() {
    const savedPublishedArticle = localStorage.getItem(
      ARTICLE_PUBLISHED_STORAGE_KEY
    );

    if (!savedPublishedArticle) {
      return null;
    }

    try {
      return normalizeArticle(JSON.parse(savedPublishedArticle));
    } catch (error) {
      return null;
    }
  }

  function loadReviewArticle() {
    const savedReviewArticle = localStorage.getItem(ARTICLE_REVIEW_STORAGE_KEY);

    if (!savedReviewArticle) {
      return null;
    }

    try {
      return normalizeArticle(JSON.parse(savedReviewArticle));
    } catch (error) {
      return null;
    }
  }

  function saveArticle(article) {
    localStorage.setItem(
      ARTICLE_STORAGE_KEY,
      JSON.stringify(normalizeArticle(article))
    );
  }

  function saveReviewArticle(article) {
    const normalized = normalizeArticle({
      ...article,
      status: WORKFLOW.IN_REVIEW,
      reviewedAt: new Date().toISOString(),
    });

    localStorage.setItem(ARTICLE_REVIEW_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function clearReviewArticle() {
    localStorage.removeItem(ARTICLE_REVIEW_STORAGE_KEY);
  }

  function publishArticle(article) {
    const normalized = normalizeArticle({
      ...article,
      status: WORKFLOW.PUBLISHED,
      publishedAt: new Date().toISOString(),
    });

    localStorage.setItem(ARTICLE_PUBLISHED_STORAGE_KEY, JSON.stringify(normalized));
    clearReviewArticle();
    return normalized;
  }

  function renderArticleInto(root, article) {
    if (!root) return;
    if (!global.CorvianthRegistry) return;

    root.innerHTML = "";
    root.className = "article-render-stack";

    article.modules.forEach((moduleEntry) => {
      const definition = global.CorvianthRegistry.getModuleDefinition(
        moduleEntry.type
      );
      if (!definition) return;

      const node = definition.renderDisplay(moduleEntry.data, moduleEntry);
      if (node) {
        root.appendChild(node);
      }
    });

    applyInlineCitationLinks(root);
  }

  function collectReferenceNumbers(root) {
    const references = Array.from(
      root.querySelectorAll(".bibliography-module .bibliography-list .bibliography-item")
    );
    const available = new Set();
    references.forEach((item, index) => {
      const number = index + 1;
      item.id = `ref-${number}`;
      item.dataset.referenceNumber = String(number);
      available.add(number);
    });
    return available;
  }

  function createCitationFragment(matchText, refNumbers) {
    const parts = String(matchText || "")
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!parts.length) return null;

    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createTextNode("["));

    parts.forEach((value, index) => {
      if (index > 0) {
        fragment.appendChild(document.createTextNode(", "));
      }

      if (refNumbers.has(value)) {
        const link = document.createElement("a");
        link.className = "inline-cite";
        link.href = `#ref-${value}`;
        link.textContent = String(value);
        fragment.appendChild(link);
      } else {
        fragment.appendChild(document.createTextNode(String(value)));
      }
    });

    fragment.appendChild(document.createTextNode("]"));
    return fragment;
  }

  function processCitationTextNode(textNode, refNumbers) {
    if (!textNode?.nodeValue) return false;
    const pattern = /\[((?:\d+\s*(?:,\s*\d+\s*)*))\]/g;
    const source = textNode.nodeValue;
    let cursor = 0;
    let matched = false;
    let foundMatch = null;
    const fragment = document.createDocumentFragment();

    while ((foundMatch = pattern.exec(source))) {
      const full = foundMatch[0];
      const startIndex = foundMatch.index;
      const endIndex = startIndex + full.length;

      if (startIndex > cursor) {
        fragment.appendChild(document.createTextNode(source.slice(cursor, startIndex)));
      }

      const citationFragment = createCitationFragment(full, refNumbers);
      if (citationFragment) {
        matched = true;
        fragment.appendChild(citationFragment);
      } else {
        fragment.appendChild(document.createTextNode(full));
      }

      cursor = endIndex;
    }

    if (!matched) return false;

    if (cursor < source.length) {
      fragment.appendChild(document.createTextNode(source.slice(cursor)));
    }

    textNode.replaceWith(fragment);
    return true;
  }

  function applyInlineCitationLinks(root) {
    const refNumbers = collectReferenceNumbers(root);
    if (!refNumbers.size) return;

    const blocks = Array.from(
      root.querySelectorAll(
        ".text-block, .note-inline, .patient-summary, .warning-list li, .quote-text, .viewer-caption-text, .copy"
      )
    ).filter((node) => !node.closest(".bibliography-module"));

    blocks.forEach((block) => {
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      const nodes = [];
      let current = walker.nextNode();
      while (current) {
        const parent = current.parentElement;
        const skip =
          !parent ||
          parent.closest("a") ||
          parent.closest("[contenteditable='true']") ||
          parent.closest(".viewer-mark-token");
        if (!skip) nodes.push(current);
        current = walker.nextNode();
      }
      nodes.forEach((node) => {
        processCitationTextNode(node, refNumbers);
      });
    });
  }

  global.CorvianthRenderer = {
    ARTICLE_STORAGE_KEY,
    ARTICLE_REVIEW_STORAGE_KEY,
    ARTICLE_PUBLISHED_STORAGE_KEY,
    WORKFLOW,
    createDefaultArticle,
    loadArticle,
    loadReviewArticle,
    loadPublishedArticle,
    saveArticle,
    saveReviewArticle,
    clearReviewArticle,
    publishArticle,
    renderArticleInto,
  };
})(window);
