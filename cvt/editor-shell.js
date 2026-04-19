(function initEditorShell(global) {
  const renderer = global.CorvianthRenderer;
  const registry = global.CorvianthRegistry;

  if (!renderer || !registry) return;

  const articleSlugInput = document.getElementById("articleSlugInput");
  const editorDocumentRoot = document.getElementById("editorDocumentRoot");
  const editorTocNav = document.getElementById("editorTocNav");
  const saveStatus = document.getElementById("saveStatus");
  const workflowStatusChip = document.getElementById("workflowStatusChip");
  const loadDemoBtn = document.getElementById("loadDemoBtn");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const sendReviewBtn = document.getElementById("sendReviewBtn");
  const publishArticleBtn = document.getElementById("publishArticleBtn");
  const WORKFLOW = renderer.WORKFLOW || {
    DRAFT: "draft",
    IN_REVIEW: "in_review",
    PUBLISHED: "published",
  };

  let article = renderer.loadArticle();
  let draggedModuleId = null;
  let armedDragModuleId = null;
  let scrollSpyItems = [];
  let tocRefreshHandle = null;

  function isEditableField(node) {
    return Boolean(node?.matches?.('[contenteditable="true"]'));
  }

  function isEditableEmpty(node) {
    if (!node) return true;
    const content = (node.textContent || "").replace(/\u200B/g, "").trim();
    return content.length === 0;
  }

  function syncEditableEmptyState(root = editorDocumentRoot) {
    if (!root) return;
    const editables = root.querySelectorAll(
      '[contenteditable="true"][data-placeholder]'
    );
    editables.forEach((editable) => {
      editable.dataset.empty = isEditableEmpty(editable) ? "true" : "false";
    });
  }

  function placeCaretAtEnd(node) {
    if (!node) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function insertPlainTextAtSelection(editable, text) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editable.textContent += text;
      placeCaretAtEnd(editable);
      return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const isInsideEditable =
      container === editable ||
      editable.contains(
        container.nodeType === Node.ELEMENT_NODE
          ? container
          : container.parentNode
      );

    if (!isInsideEditable) {
      placeCaretAtEnd(editable);
      return insertPlainTextAtSelection(editable, text);
    }

    range.deleteContents();

    const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
    const fragment = document.createDocumentFragment();
    lines.forEach((line, index) => {
      fragment.appendChild(document.createTextNode(line));
      if (index < lines.length - 1) {
        fragment.appendChild(document.createElement("br"));
      }
    });

    range.insertNode(fragment);
    placeCaretAtEnd(editable);
  }

  function handleEditablePaste(event) {
    const editable = event.target.closest?.('[contenteditable="true"]');
    if (!isEditableField(editable)) return;

    event.preventDefault();
    const clipboard = event.clipboardData || window.clipboardData;
    const text = clipboard?.getData("text/plain") || "";

    insertPlainTextAtSelection(editable, text);
    editable.dispatchEvent(new Event("input", { bubbles: true }));
    syncEditableEmptyState(editorDocumentRoot);
  }

  function handleEditableStateSync(event) {
    const editable = event.target.closest?.('[contenteditable="true"]');
    if (!isEditableField(editable)) return;
    editable.dataset.empty = isEditableEmpty(editable) ? "true" : "false";
  }

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  function setSaveStatus(message) {
    if (saveStatus) {
      saveStatus.textContent = message;
    }
  }

  function setWorkflowStatusUI(statusValue) {
    if (!workflowStatusChip) return;

    const normalizedStatus =
      statusValue === WORKFLOW.IN_REVIEW || statusValue === WORKFLOW.PUBLISHED
        ? statusValue
        : WORKFLOW.DRAFT;

    workflowStatusChip.className = "studio-status-chip";
    if (normalizedStatus === WORKFLOW.IN_REVIEW) {
      workflowStatusChip.classList.add("is-review");
      workflowStatusChip.textContent = "En revision";
      return;
    }

    if (normalizedStatus === WORKFLOW.PUBLISHED) {
      workflowStatusChip.classList.add("is-published");
      workflowStatusChip.textContent = "Publicado";
      return;
    }

    workflowStatusChip.classList.add("is-draft");
    workflowStatusChip.textContent = "Borrador";
  }

  function formatStatusTime() {
    try {
      return new Intl.DateTimeFormat("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());
    } catch (error) {
      return new Date().toLocaleTimeString();
    }
  }

  function saveState(options = {}) {
    const mode = options.mode || "auto";
    article.updatedAt = new Date().toISOString();
    renderer.saveArticle(article);
    setWorkflowStatusUI(article.status);
    if (articleSlugInput) {
      articleSlugInput.value = article.slug;
    }

    if (mode === "publish") {
      setSaveStatus(`Publicado ${formatStatusTime()}`);
    } else if (mode === "review") {
      setSaveStatus(`En revision ${formatStatusTime()}`);
    } else if (mode === "draft") {
      setSaveStatus(`Borrador guardado ${formatStatusTime()}`);
    } else {
      setSaveStatus(`Autoguardado ${formatStatusTime()}`);
    }
    scheduleTocRefresh();
  }

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function scheduleTocRefresh() {
    if (!editorTocNav) return;
    if (tocRefreshHandle) {
      cancelAnimationFrame(tocRefreshHandle);
    }
    tocRefreshHandle = requestAnimationFrame(() => {
      tocRefreshHandle = null;
      refreshEditorToc();
    });
  }

  function extractModuleTitle(shell, fallbackText) {
    const explicitTitle = shell.querySelector(
      ".editable-module-title, .module-head h1, .module-head h2, .module-head h3"
    );
    if (explicitTitle?.textContent?.trim()) {
      return explicitTitle.textContent.trim();
    }

    const moduleHead = shell.querySelector(".module-head");
    if (moduleHead?.textContent?.trim()) {
      return moduleHead.textContent.trim();
    }

    return fallbackText || "Modulo";
  }

  function refreshEditorToc() {
    if (!editorTocNav) return;

    const shells = Array.from(
      editorDocumentRoot.querySelectorAll(".editable-module-shell")
    );

    editorTocNav.innerHTML = "";
    scrollSpyItems = [];

    shells.forEach((shell, index) => {
      const moduleId = shell.dataset.moduleId || `module-${index + 1}`;
      const sectionId = `editor-section-${moduleId}`;
      shell.id = sectionId;

      const fallbackDefinition = registry.getModuleDefinition(
        article.modules[index]?.type
      );
      const sectionTitle = extractModuleTitle(
        shell,
        fallbackDefinition?.label || `Modulo ${index + 1}`
      );

      const group = document.createElement("div");
      group.className = "nav-group";

      const sectionLink = document.createElement("a");
      sectionLink.href = `#${sectionId}`;
      sectionLink.className = "nav-link";
      sectionLink.dataset.tocLink = sectionId;
      sectionLink.innerHTML = `<span>${sectionTitle}</span><span>&#8250;</span>`;
      group.appendChild(sectionLink);

      scrollSpyItems.push({
        id: sectionId,
        element: shell,
        level: "section",
      });

      const subtitles = Array.from(shell.querySelectorAll(".subsection-title"));
      if (subtitles.length) {
        const subWrap = document.createElement("div");
        subWrap.className = "nav-sublinks";

        subtitles.forEach((subtitleNode, subIndex) => {
          const subtitleText = subtitleNode.textContent?.trim();
          if (!subtitleText) return;

          const subtitleId = `${sectionId}-sub-${subIndex + 1}-${slugify(
            subtitleText
          )}`;
          subtitleNode.id = subtitleId;

          const subtitleLink = document.createElement("a");
          subtitleLink.href = `#${subtitleId}`;
          subtitleLink.className = "nav-sublink";
          subtitleLink.dataset.tocLink = subtitleId;
          subtitleLink.innerHTML = `<span>${subtitleText}</span><span>&#8250;</span>`;
          subWrap.appendChild(subtitleLink);

          scrollSpyItems.push({
            id: subtitleId,
            element: subtitleNode,
            level: "subsection",
            parentId: sectionId,
          });
        });

        if (subWrap.childElementCount) {
          group.appendChild(subWrap);
        }
      }

      editorTocNav.appendChild(group);
    });
  }

  function updateActiveTocLink() {
    if (!scrollSpyItems.length || !editorTocNav) return;

    const viewportCenter = window.innerHeight / 2;
    let activeItem = scrollSpyItems[0];
    let minDistance = Infinity;

    scrollSpyItems.forEach((item) => {
      const rect = item.element.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - viewportCenter);
      if (distance < minDistance) {
        minDistance = distance;
        activeItem = item;
      }
    });

    const activeMainId =
      activeItem.level === "subsection" ? activeItem.parentId : activeItem.id;

    const links = editorTocNav.querySelectorAll("[data-toc-link]");
    links.forEach((link) => {
      const isMain = link.classList.contains("nav-link");
      const isSub = link.classList.contains("nav-sublink");
      link.classList.toggle(
        "active",
        (isMain && link.dataset.tocLink === activeMainId) ||
          (isSub && link.dataset.tocLink === activeItem.id)
      );
    });
  }

  function scrollToTocTarget(targetElement) {
    const rect = targetElement.getBoundingClientRect();
    const targetTop =
      window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }

  function updateModuleData(moduleId, nextData, options = {}) {
    const moduleEntry = article.modules.find((item) => item.id === moduleId);
    if (!moduleEntry) return;

    if (article.status === WORKFLOW.PUBLISHED) {
      article.status = WORKFLOW.DRAFT;
      if (typeof renderer.clearReviewArticle === "function") {
        renderer.clearReviewArticle();
      }
    }

    moduleEntry.data = nextData;
    saveState();

    if (options.rerenderCanvas) {
      renderDocument();
    }
  }

  function normalizeSubtitleData(data) {
    return {
      subtitle: data?.subtitle || "",
      body: data?.body || "",
    };
  }

  function findPreviousTextModuleIndex(fromIndexExclusive) {
    for (let index = fromIndexExclusive - 1; index >= 0; index -= 1) {
      if (article.modules[index]?.type === "text") {
        return index;
      }
    }
    return -1;
  }

  function appendSubtitleIntoTextModule(textModule, subtitleData) {
    if (!textModule) return;
    const currentBlocks = Array.isArray(textModule.data?.blocks)
      ? textModule.data.blocks
      : [];
    currentBlocks.push({
      subtitle: subtitleData.subtitle,
      body: subtitleData.body,
    });
    textModule.data = {
      ...(textModule.data || {}),
      blocks: currentBlocks,
    };
  }

  function integrateSubtitleModuleAt(index) {
    const subtitleModule = article.modules[index];
    if (!subtitleModule || subtitleModule.type !== "subtitle") return false;

    const previousTextIndex = findPreviousTextModuleIndex(index);
    if (previousTextIndex < 0) return false;

    appendSubtitleIntoTextModule(
      article.modules[previousTextIndex],
      normalizeSubtitleData(subtitleModule.data)
    );
    article.modules.splice(index, 1);
    return true;
  }

  function integrateExistingSubtitleModules() {
    let integrated = false;
    for (let index = 0; index < article.modules.length; index += 1) {
      if (article.modules[index]?.type !== "subtitle") continue;
      if (integrateSubtitleModuleAt(index)) {
        integrated = true;
        index -= 1;
      }
    }
    return integrated;
  }

  function addModuleByType(type) {
    if (type === "hero" && article.modules.some((module) => module.type === "hero")) {
      setSaveStatus("Ya existe un modulo Hero");
      return;
    }

    const definition = registry.getModuleDefinition(type);
    if (!definition) return;

    if (type === "subtitle") {
      const subtitleData = normalizeSubtitleData(definition.createDefaultData(article));
      const previousTextIndex = findPreviousTextModuleIndex(article.modules.length);

      if (previousTextIndex >= 0) {
        appendSubtitleIntoTextModule(article.modules[previousTextIndex], subtitleData);
        saveState();
        renderDocument();
        setSaveStatus("Subtitulo integrado en la seccion anterior");
        return;
      }

      const textDefinition = registry.getModuleDefinition("text");
      if (textDefinition) {
        const textData = textDefinition.createDefaultData(article);
        article.modules.push({
          id: createId("text"),
          type: "text",
          data: {
            ...textData,
            blocks: [
              {
                subtitle: subtitleData.subtitle,
                body: subtitleData.body,
              },
            ],
          },
        });
        saveState();
        renderDocument();
        setSaveStatus("No habia seccion previa. Se creo una seccion de texto.");
        return;
      }
    }

    article.modules.push({
      id: createId(type),
      type,
      data: definition.createDefaultData(article),
    });
    saveState();
    renderDocument();
  }

  function renderModuleActions(moduleEntry, index) {
    const isHero = moduleEntry.type === "hero";
    const actions = document.createElement("div");
    actions.className = "editable-module-actions";

    if (isHero) {
      const fixed = document.createElement("span");
      fixed.className = "studio-muted";
      fixed.textContent = "Fijo";
      actions.appendChild(fixed);
      return actions;
    }

    const dragHandle = document.createElement("button");
    dragHandle.type = "button";
    dragHandle.className = "studio-outline-btn module-drag-handle";
    dragHandle.innerHTML = "&#9776;";
    dragHandle.title = "Arrastrar modulo";
    dragHandle.setAttribute("aria-label", "Arrastrar modulo");
    dragHandle.addEventListener("mousedown", () => {
      armedDragModuleId = moduleEntry.id;
    });
    dragHandle.addEventListener("touchstart", () => {
      armedDragModuleId = moduleEntry.id;
    });

    const moveUp = document.createElement("button");
    moveUp.type = "button";
    moveUp.className = "studio-outline-btn";
    moveUp.innerHTML = "&#8593;";
    moveUp.title = "Subir modulo";
    moveUp.addEventListener("click", () => {
      if (index <= 0) return;
      [article.modules[index - 1], article.modules[index]] = [
        article.modules[index],
        article.modules[index - 1],
      ];
      saveState();
      renderDocument();
    });

    const moveDown = document.createElement("button");
    moveDown.type = "button";
    moveDown.className = "studio-outline-btn";
    moveDown.innerHTML = "&#8595;";
    moveDown.title = "Bajar modulo";
    moveDown.addEventListener("click", () => {
      if (index >= article.modules.length - 1) return;
      [article.modules[index + 1], article.modules[index]] = [
        article.modules[index],
        article.modules[index + 1],
      ];
      saveState();
      renderDocument();
    });

    const duplicate = document.createElement("button");
    duplicate.type = "button";
    duplicate.className = "studio-outline-btn";
    duplicate.innerHTML = "Duplicar";
    duplicate.addEventListener("click", () => {
      const copy = {
        id: createId(moduleEntry.type),
        type: moduleEntry.type,
        data: JSON.parse(JSON.stringify(moduleEntry.data)),
      };
      article.modules.splice(index + 1, 0, copy);
      saveState();
      renderDocument();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "studio-outline-btn";
    remove.innerHTML = "&times;";
    remove.title = "Eliminar modulo";
    remove.addEventListener("click", () => {
      article.modules = article.modules.filter((item) => item.id !== moduleEntry.id);
      saveState();
      renderDocument();
    });

    actions.appendChild(dragHandle);
    actions.appendChild(moveUp);
    actions.appendChild(moveDown);
    actions.appendChild(duplicate);
    actions.appendChild(remove);
    return actions;
  }

  function renderDocument() {
    editorDocumentRoot.innerHTML = "";

    article.modules.forEach((moduleEntry, index) => {
      const definition = registry.getModuleDefinition(moduleEntry.type);
      if (!definition) return;

      const shell = document.createElement("article");
      shell.className = "editable-module-shell";
      shell.dataset.moduleId = moduleEntry.id;
      shell.draggable = moduleEntry.type !== "hero";

      shell.addEventListener("dragstart", (event) => {
        if (moduleEntry.type === "hero") {
          event.preventDefault();
          return;
        }
        if (armedDragModuleId !== moduleEntry.id) {
          event.preventDefault();
          return;
        }

        draggedModuleId = moduleEntry.id;
        shell.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", moduleEntry.id);
      });

      shell.addEventListener("dragend", () => {
        draggedModuleId = null;
        armedDragModuleId = null;
        shell.classList.remove("is-dragging");
        editorDocumentRoot
          .querySelectorAll(".drop-before, .drop-after")
          .forEach((node) => {
            node.classList.remove("drop-before", "drop-after");
          });
      });

      shell.addEventListener("dragover", (event) => {
        if (moduleEntry.type === "hero") return;
        if (!draggedModuleId || draggedModuleId === moduleEntry.id) return;
        event.preventDefault();
        const rect = shell.getBoundingClientRect();
        const before = event.clientY < rect.top + rect.height / 2;
        shell.classList.toggle("drop-before", before);
        shell.classList.toggle("drop-after", !before);
      });

      shell.addEventListener("dragleave", () => {
        shell.classList.remove("drop-before", "drop-after");
      });

      shell.addEventListener("drop", (event) => {
        event.preventDefault();
        shell.classList.remove("drop-before", "drop-after");

        if (moduleEntry.type === "hero") return;
        if (!draggedModuleId || draggedModuleId === moduleEntry.id) return;

        const heroOriginalIndex = article.modules.findIndex(
          (item) => item.type === "hero"
        );
        const sourceIndex = article.modules.findIndex(
          (item) => item.id === draggedModuleId
        );
        const targetIndex = article.modules.findIndex(
          (item) => item.id === moduleEntry.id
        );

        if (sourceIndex < 0 || targetIndex < 0) return;
        if (article.modules[sourceIndex]?.type === "hero") return;

        const targetRect = shell.getBoundingClientRect();
        const insertBefore = event.clientY < targetRect.top + targetRect.height / 2;

        const [moving] = article.modules.splice(sourceIndex, 1);
        let nextIndex = targetIndex;
        if (sourceIndex < targetIndex) {
          nextIndex -= 1;
        }
        article.modules.splice(insertBefore ? nextIndex : nextIndex + 1, 0, moving);

        if (heroOriginalIndex >= 0) {
          const heroCurrentIndex = article.modules.findIndex(
            (item) => item.type === "hero"
          );
          if (heroCurrentIndex >= 0 && heroCurrentIndex !== heroOriginalIndex) {
            const [heroModule] = article.modules.splice(heroCurrentIndex, 1);
            article.modules.splice(heroOriginalIndex, 0, heroModule);
          }
        }

        saveState();
        renderDocument();
      });

      const chrome = document.createElement("header");
      chrome.className = "editable-module-chrome";
      chrome.innerHTML = `
        <span class="studio-muted">${definition.label || moduleEntry.type}</span>
      `;
      chrome.appendChild(renderModuleActions(moduleEntry, index));
      shell.appendChild(chrome);

      const moduleNode = definition.renderEditable
        ? definition.renderEditable(moduleEntry.data, {
            moduleId: moduleEntry.id,
            onChange(nextData, options = {}) {
              updateModuleData(moduleEntry.id, nextData, {
                rerenderCanvas: Boolean(options.rerenderCanvas),
              });
            },
          })
        : definition.renderDisplay(moduleEntry.data, moduleEntry);

      shell.appendChild(moduleNode);
      editorDocumentRoot.appendChild(shell);
    });

    const launcher = document.createElement("div");
    launcher.className = "module-launcher";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "module-launcher-toggle";
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.innerHTML = `
      <span class="module-launcher-plus">+</span>
      <span>Da clic en + para desplegar mas opciones</span>
    `;

    const menu = document.createElement("div");
    menu.className = "module-launcher-menu";
    menu.hidden = true;

    registry.listModuleDefinitions().forEach((definition) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "module-launcher-item";
      item.textContent = definition.label;
      if (
        definition.type === "hero" &&
        article.modules.some((module) => module.type === "hero")
      ) {
        item.disabled = true;
        item.textContent = `${definition.label} (ya agregado)`;
      }
      item.addEventListener("click", () => {
        addModuleByType(definition.type);
      });
      menu.appendChild(item);
    });

    toggleBtn.addEventListener("click", () => {
      const isOpen = toggleBtn.getAttribute("aria-expanded") === "true";
      toggleBtn.setAttribute("aria-expanded", String(!isOpen));
      menu.hidden = isOpen;
    });

    launcher.appendChild(toggleBtn);
    launcher.appendChild(menu);
    editorDocumentRoot.appendChild(launcher);

    syncEditableEmptyState(editorDocumentRoot);
    refreshEditorToc();
    updateActiveTocLink();
  }

  function attachGlobalEvents() {
    document.addEventListener("mouseup", () => {
      armedDragModuleId = null;
    });
    document.addEventListener("touchend", () => {
      armedDragModuleId = null;
    });

    editorTocNav?.addEventListener("click", (event) => {
      const link = event.target.closest("[data-toc-link]");
      if (!link) return;

      event.preventDefault();
      const targetId = link.dataset.tocLink;
      const target = document.getElementById(targetId);
      if (!target) return;
      scrollToTocTarget(target);
    });

    window.addEventListener("scroll", updateActiveTocLink, { passive: true });
    window.addEventListener("resize", updateActiveTocLink);

    articleSlugInput?.addEventListener("input", (event) => {
      if (article.status === WORKFLOW.PUBLISHED) {
        article.status = WORKFLOW.DRAFT;
        if (typeof renderer.clearReviewArticle === "function") {
          renderer.clearReviewArticle();
        }
      }
      article.slug = event.target.value.trim();
      saveState();
    });

    saveDraftBtn?.addEventListener("click", () => {
      article.status = WORKFLOW.DRAFT;
      if (typeof renderer.clearReviewArticle === "function") {
        renderer.clearReviewArticle();
      }
      saveState({ mode: "draft" });
    });

    sendReviewBtn?.addEventListener("click", () => {
      article.status = WORKFLOW.IN_REVIEW;
      if (typeof renderer.saveReviewArticle === "function") {
        article = renderer.saveReviewArticle(article);
      }
      saveState({ mode: "review" });
    });

    publishArticleBtn?.addEventListener("click", () => {
      if (article.status !== WORKFLOW.IN_REVIEW) {
        setSaveStatus("Primero envia el articulo a revision");
        return;
      }

      article.status = WORKFLOW.PUBLISHED;
      if (typeof renderer.publishArticle === "function") {
        article = renderer.publishArticle(article);
      }
      saveState({ mode: "publish" });
    });

    loadDemoBtn?.addEventListener("click", () => {
      const shouldLoad = window.confirm(
        "Esto reemplazara el borrador actual por la entrada demo estandar. Continuar?"
      );
      if (!shouldLoad) return;
      article = renderer.createDefaultArticle();
      article.status = WORKFLOW.DRAFT;
      if (typeof renderer.clearReviewArticle === "function") {
        renderer.clearReviewArticle();
      }
      saveState();
      renderDocument();
      setSaveStatus("Demo estandar cargada");
    });

    editorDocumentRoot?.addEventListener("paste", handleEditablePaste);
    editorDocumentRoot?.addEventListener("input", handleEditableStateSync, true);
    editorDocumentRoot?.addEventListener("focusout", handleEditableStateSync, true);
  }

  function boot() {
    if (!article.modules.length) {
      article = renderer.createDefaultArticle();
    }
    if (
      article.status !== WORKFLOW.IN_REVIEW &&
      article.status !== WORKFLOW.PUBLISHED
    ) {
      article.status = WORKFLOW.DRAFT;
    }

    const integrated = integrateExistingSubtitleModules();
    if (integrated) {
      setSaveStatus("Subtitulos aislados integrados en secciones previas");
    }

    attachGlobalEvents();
    saveState();
    renderDocument();
  }

  boot();
})(window);
