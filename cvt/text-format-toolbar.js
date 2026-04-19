(function initRichTextToolbar(global) {
  function createToolbar() {
    const panel = document.createElement("div");
    panel.className = "rt-toolbar";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <div class="rt-toolbar-actions">
        <button type="button" class="rt-btn" title="Regular" data-cmd="weight-400">A</button>
        <button type="button" class="rt-btn" title="Negrita" data-cmd="weight-700"><strong>B</strong></button>
        <button type="button" class="rt-btn" title="Cursiva" data-cmd="italic"><em>I</em></button>
        <button type="button" class="rt-btn" title="Subrayado" data-cmd="underline"><u>U</u></button>
        <button type="button" class="rt-btn" title="Reducir tamano" data-cmd="size-sm">A-</button>
        <button type="button" class="rt-btn" title="Aumentar tamano" data-cmd="size-lg">A+</button>
        <button type="button" class="rt-btn" title="Peso medio" data-cmd="weight-600">S</button>
        <button type="button" class="rt-btn" title="Quitar formato" data-cmd="clear">×</button>
        <button type="button" class="rt-btn rt-btn-list" title="Lista con vietas (solo texto)" data-cmd="list-ul">• List</button>
        <button type="button" class="rt-btn rt-btn-list" title="Lista numerada (solo texto)" data-cmd="list-ol">1. List</button>
      </div>
    `;
    document.body.appendChild(panel);
    return panel;
  }

  function getSelectionContext() {
    const selection = global.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

    const range = selection.getRangeAt(0);
    const startNode =
      range.startContainer.nodeType === Node.ELEMENT_NODE
        ? range.startContainer
        : range.startContainer.parentElement;
    const endNode =
      range.endContainer.nodeType === Node.ELEMENT_NODE
        ? range.endContainer
        : range.endContainer.parentElement;

    const startEditable = startNode?.closest?.('[contenteditable="true"]');
    const endEditable = endNode?.closest?.('[contenteditable="true"]');
    if (!startEditable || !endEditable || startEditable !== endEditable) return null;

    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return null;

    return { selection, range, editable: startEditable, rect };
  }

  function isNormalTextEditable(editable) {
    return Boolean(editable?.classList?.contains("editable-paragraph"));
  }

  function notifyInput(editable) {
    if (!editable) return;
    editable.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function wrapSelectionWithStyle(stylePatch) {
    const ctx = getSelectionContext();
    if (!ctx) return;

    const { range, selection, editable } = ctx;
    const fragment = range.extractContents();
    const wrapper = document.createElement("span");
    wrapper.className = "rt-inline-style";
    Object.assign(wrapper.style, stylePatch);
    wrapper.appendChild(fragment);
    range.insertNode(wrapper);

    selection.removeAllRanges();
    const nextRange = document.createRange();
    nextRange.selectNodeContents(wrapper);
    selection.addRange(nextRange);
    notifyInput(editable);
  }

  function clearFormatting() {
    const ctx = getSelectionContext();
    if (!ctx) return;
    if (typeof document.execCommand === "function") {
      document.execCommand("removeFormat");
    }
    notifyInput(ctx.editable);
  }

  function executeCommand(command) {
    const ctx = getSelectionContext();
    if (!ctx) return;

    if (command === "clear") {
      clearFormatting();
      return;
    }

    if (command === "italic") {
      wrapSelectionWithStyle({ fontStyle: "italic" });
      return;
    }

    if (command === "underline") {
      wrapSelectionWithStyle({ textDecoration: "underline" });
      return;
    }

    if (command === "weight-400") {
      wrapSelectionWithStyle({ fontWeight: "400" });
      return;
    }

    if (command === "weight-600") {
      wrapSelectionWithStyle({ fontWeight: "600" });
      return;
    }

    if (command === "weight-700") {
      wrapSelectionWithStyle({ fontWeight: "700" });
      return;
    }

    if (command === "size-sm") {
      wrapSelectionWithStyle({ fontSize: "0.9em" });
      return;
    }

    if (command === "size-lg") {
      wrapSelectionWithStyle({ fontSize: "1.2em" });
      return;
    }

    if (command === "list-ul") {
      if (!isNormalTextEditable(ctx.editable)) return;
      if (typeof document.execCommand === "function") {
        document.execCommand("insertUnorderedList");
      }
      notifyInput(ctx.editable);
      return;
    }

    if (command === "list-ol") {
      if (!isNormalTextEditable(ctx.editable)) return;
      if (typeof document.execCommand === "function") {
        document.execCommand("insertOrderedList");
      }
      notifyInput(ctx.editable);
    }
  }

  function setupToolbar() {
    const toolbar = createToolbar();
    const listButtons = Array.from(toolbar.querySelectorAll(".rt-btn-list"));

    function setListButtonsEnabled(enabled) {
      listButtons.forEach((btn) => {
        btn.disabled = !enabled;
        btn.setAttribute("aria-disabled", String(!enabled));
      });
    }

    function hideToolbar() {
      toolbar.classList.remove("is-open");
      toolbar.setAttribute("aria-hidden", "true");
      setListButtonsEnabled(false);
    }

    function positionToolbar(rect) {
      const toolbarWidth = toolbar.offsetWidth || 320;
      const toolbarHeight = toolbar.offsetHeight || 52;
      const viewportPadding = 10;
      const desiredTop = rect.top - toolbarHeight - 10;
      const desiredLeft = rect.left + rect.width / 2 - toolbarWidth / 2;
      const maxLeft = global.innerWidth - toolbarWidth - viewportPadding;

      toolbar.style.top = `${Math.max(viewportPadding, desiredTop)}px`;
      toolbar.style.left = `${Math.max(
        viewportPadding,
        Math.min(desiredLeft, maxLeft)
      )}px`;
      toolbar.classList.add("is-open");
      toolbar.setAttribute("aria-hidden", "false");
    }

    toolbar.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });

    toolbar.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-cmd]");
      if (!btn || btn.disabled) return;
      executeCommand(btn.dataset.cmd);
      const selection = global.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
      hideToolbar();
    });

    function syncFromSelection() {
      const ctx = getSelectionContext();
      if (!ctx) {
        hideToolbar();
        return;
      }
      setListButtonsEnabled(isNormalTextEditable(ctx.editable));
      positionToolbar(ctx.rect);
    }

    document.addEventListener("selectionchange", syncFromSelection);
    document.addEventListener("mouseup", () => {
      setTimeout(syncFromSelection, 0);
    });
    document.addEventListener("keyup", () => {
      setTimeout(syncFromSelection, 0);
    });

    global.addEventListener("scroll", hideToolbar, { passive: true });
    global.addEventListener("resize", hideToolbar);
    document.addEventListener("mousedown", (event) => {
      if (!toolbar.contains(event.target)) {
        const selectedInEditable = Boolean(
          event.target.closest?.('[contenteditable="true"]')
        );
        if (!selectedInEditable) {
          hideToolbar();
        }
      }
    });
  }

  global.addEventListener("DOMContentLoaded", setupToolbar);
})(window);
