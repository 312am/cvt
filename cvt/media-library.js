(function initCorvianthMediaLibrary(global) {
  const STORAGE_KEY = "corvianth-media-library-v1";
  const UPDATE_EVENT = "corvianth-media-library-updated";
  const PANEL_ID = "corvianth-media-library-panel";
  const OPEN_BUTTON_ID = "openMediaLibraryBtn";

  let items = [];
  let panel = null;
  let listNode = null;
  let emptyNode = null;
  let uploadInput = null;
  let pickerHint = null;
  let pickerResolve = null;
  let pickerContext = null;

  function createId(prefix = "media") {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  function normalizeItem(item) {
    return {
      id: String(item?.id || createId("asset")),
      name: String(item?.name || "Archivo"),
      url: String(item?.url || ""),
      type: String(item?.type || "image"),
      createdAt: String(item?.createdAt || new Date().toISOString()),
    };
  }

  function loadItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeItem).filter((item) => Boolean(item.url));
    } catch (error) {
      return [];
    }
  }

  function saveItems(nextItems) {
    items = Array.isArray(nextItems) ? nextItems.map(normalizeItem) : [];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("No se pudo guardar la libreria de medios.", error);
    }
    global.dispatchEvent(
      new CustomEvent(UPDATE_EVENT, {
        detail: { count: items.length },
      })
    );
    renderItems();
  }

  function formatDate(iso) {
    try {
      return new Intl.DateTimeFormat("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch (error) {
      return iso;
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () =>
        reject(reader.error || new Error("No se pudo leer el archivo."));
      reader.readAsDataURL(file);
    });
  }

  async function addFiles(files) {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length) return [];

    const loaded = await Promise.all(
      list.map(async (file) => {
        const url = await readFileAsDataUrl(file);
        return normalizeItem({
          id: createId("asset"),
          name: file.name || "Imagen",
          type: String(file.type || "image"),
          url,
          createdAt: new Date().toISOString(),
        });
      })
    );

    saveItems([...items, ...loaded]);
    return loaded;
  }

  function closePanel() {
    if (!panel) return;
    panel.classList.remove("is-open", "is-picker");
    panel.setAttribute("aria-hidden", "true");
    if (pickerHint) pickerHint.textContent = "";
    pickerContext = null;
    renderItems();
    if (pickerResolve) {
      const resolve = pickerResolve;
      pickerResolve = null;
      resolve(null);
    }
  }

  function openPanel() {
    ensurePanel();
    panel.classList.add("is-open");
    panel.classList.remove("is-picker");
    panel.setAttribute("aria-hidden", "false");
    if (pickerHint) pickerHint.textContent = "";
    pickerContext = null;
    renderItems();
  }

  function normalizePickerContext(context) {
    const modality = String(context?.modality || "").trim();
    const usedUrlsInModality = new Set(
      Array.isArray(context?.usedUrlsInModality)
        ? context.usedUrlsInModality.map((url) => String(url || "").trim()).filter(Boolean)
        : []
    );
    const usedUrlsInCurrentStudy = new Set(
      Array.isArray(context?.usedUrlsInCurrentStudy)
        ? context.usedUrlsInCurrentStudy
            .map((url) => String(url || "").trim())
            .filter(Boolean)
        : []
    );
    return {
      modality,
      usedUrlsInModality,
      usedUrlsInCurrentStudy,
    };
  }

  function openPicker(context = {}) {
    ensurePanel();
    panel.classList.add("is-open", "is-picker");
    panel.setAttribute("aria-hidden", "false");
    pickerContext = normalizePickerContext(context);
    if (pickerHint) {
      const modalityLabel = pickerContext.modality || "esta modalidad";
      pickerHint.textContent = `Selecciona un recurso para usarlo en el visor (${modalityLabel}).`;
    }
    renderItems();

    return new Promise((resolve) => {
      if (pickerResolve) {
        pickerResolve(null);
      }
      pickerResolve = resolve;
    });
  }

  function removeItemById(id) {
    const targetId = String(id || "");
    if (!targetId) return;
    saveItems(items.filter((item) => item.id !== targetId));
  }

  function copyUrl(value) {
    const url = String(value || "");
    if (!url) return;
    navigator.clipboard?.writeText(url).catch(() => {});
  }

  function renderItems() {
    if (!listNode || !emptyNode) return;
    listNode.innerHTML = "";
    emptyNode.hidden = items.length > 0;

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "media-library-item";
      const itemUrl = String(item.url || "").trim();
      const usedInModality =
        Boolean(pickerContext?.usedUrlsInModality) &&
        pickerContext.usedUrlsInModality.has(itemUrl);
      const usedInCurrentStudy =
        Boolean(pickerContext?.usedUrlsInCurrentStudy) &&
        pickerContext.usedUrlsInCurrentStudy.has(itemUrl);
      if (usedInModality) {
        card.classList.add("is-used-in-modality");
      }
      if (usedInCurrentStudy) {
        card.classList.add("is-used-in-current-study");
      }

      const preview = document.createElement("div");
      preview.className = "media-library-preview";
      preview.innerHTML = `<img src="${item.url}" alt="${item.name}" loading="lazy" />`;

      const meta = document.createElement("div");
      meta.className = "media-library-meta";
      meta.innerHTML = `
        <div class="media-library-name" title="${item.name}">${item.name}</div>
        <div class="media-library-date">${formatDate(item.createdAt)}</div>
      `;
      if (usedInModality) {
        const status = document.createElement("div");
        status.className = "media-library-used-badge";
        status.textContent = usedInCurrentStudy
          ? "Ya usada en esta serie"
          : "Ya usada en esta modalidad";
        meta.appendChild(status);
      }

      const actions = document.createElement("div");
      actions.className = "media-library-item-actions";

      const useBtn = document.createElement("button");
      useBtn.type = "button";
      useBtn.className = "hero-btn media-library-use-btn";
      useBtn.textContent = "Usar";
      useBtn.addEventListener("click", () => {
        if (pickerResolve) {
          const resolve = pickerResolve;
          pickerResolve = null;
          resolve({ ...item });
          panel?.classList.remove("is-open", "is-picker");
          panel?.setAttribute("aria-hidden", "true");
          pickerContext = null;
          if (pickerHint) pickerHint.textContent = "";
          renderItems();
        }
      });

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "studio-outline-btn";
      copyBtn.textContent = "Copiar URL";
      copyBtn.addEventListener("click", () => copyUrl(item.url));

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "studio-outline-btn";
      removeBtn.textContent = "Quitar";
      removeBtn.addEventListener("click", () => removeItemById(item.id));

      actions.appendChild(useBtn);
      actions.appendChild(copyBtn);
      actions.appendChild(removeBtn);

      card.appendChild(preview);
      card.appendChild(meta);
      card.appendChild(actions);
      listNode.appendChild(card);
    });
  }

  function ensurePanel() {
    if (panel) return panel;
    if (!document.body) return null;

    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "media-library-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <div class="media-library-backdrop" data-role="media-library-close"></div>
      <div class="media-library-dialog" role="dialog" aria-modal="true" aria-label="Libreria de medios">
        <header class="media-library-head">
          <div class="module-head-label">Libreria de medios</div>
          <button type="button" class="studio-outline-btn" data-role="media-library-close">Cerrar</button>
        </header>
        <div class="media-library-tools">
          <label class="hero-btn accent media-library-upload-label" for="mediaLibraryUploadInput">
            Subir imagenes
          </label>
          <input id="mediaLibraryUploadInput" class="media-library-upload-input" type="file" accept="image/*" multiple />
          <span class="studio-muted">Centralizada para reutilizar en visores y modulos</span>
        </div>
        <div class="media-library-picker-hint" data-role="picker-hint"></div>
        <div class="media-library-empty">Aun no hay archivos. Sube imagenes para empezar.</div>
        <div class="media-library-grid"></div>
      </div>
    `;

    document.body.appendChild(panel);
    listNode = panel.querySelector(".media-library-grid");
    emptyNode = panel.querySelector(".media-library-empty");
    uploadInput = panel.querySelector("#mediaLibraryUploadInput");
    pickerHint = panel.querySelector('[data-role="picker-hint"]');

    panel.querySelectorAll('[data-role="media-library-close"]').forEach((node) => {
      node.addEventListener("click", closePanel);
    });

    uploadInput?.addEventListener("change", async () => {
      const files = Array.from(uploadInput.files || []);
      if (!files.length) return;
      try {
        await addFiles(files);
      } finally {
        uploadInput.value = "";
      }
    });

    renderItems();
    return panel;
  }

  function attachOpenButton() {
    const button = document.getElementById(OPEN_BUTTON_ID);
    if (!button || button.dataset.mediaLibraryBound === "true") return;
    button.dataset.mediaLibraryBound = "true";
    button.addEventListener("click", () => {
      openPanel();
    });
  }

  function list() {
    return items.map((item) => ({ ...item }));
  }

  items = loadItems();

  global.CorvianthMediaLibrary = {
    STORAGE_KEY,
    UPDATE_EVENT,
    list,
    openPanel,
    openPicker,
    addFiles,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      ensurePanel();
      attachOpenButton();
    });
  } else {
    ensurePanel();
    attachOpenButton();
  }
})(window);
