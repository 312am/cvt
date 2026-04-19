(function registerTextModule(global) {
  const registry = (global.CorvianthModules = global.CorvianthModules || {});
  const MODULE_ICON = `
    <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#a3e635" stroke-width="2">
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
    </svg>
  `;

  function createEditableHeading(
    tag,
    className,
    value,
    placeholder,
    onInput,
    options = {}
  ) {
    const node = document.createElement(tag);
    node.className = className;
    node.contentEditable = "true";
    node.spellcheck = true;
    node.dataset.placeholder = placeholder;
    if (options.richText) {
      node.dataset.richText = "true";
      node.innerHTML = value || "";
    } else {
      node.textContent = value || "";
    }
    node.addEventListener("input", () => {
      onInput(options.richText ? node.innerHTML : node.textContent);
    });
    return node;
  }

  function createEditableParagraph(value, placeholder, onInput, options = {}) {
    const node = document.createElement("div");
    node.className = "editable-paragraph";
    node.contentEditable = "true";
    node.spellcheck = true;
    node.dataset.placeholder = placeholder;
    if (options.richText) {
      node.dataset.richText = "true";
      node.innerHTML = value || "";
    } else {
      node.textContent = value || "";
    }
    node.addEventListener("input", () => {
      onInput(options.richText ? node.innerHTML : node.textContent);
    });
    return node;
  }

  function normalizeBlocks(blocks) {
    if (!Array.isArray(blocks) || !blocks.length) {
      return [{ subtitle: "", body: "" }];
    }
    return blocks.map((block) => ({
      subtitle: block.subtitle || "",
      body: block.body || "",
    }));
  }

  registry.text = {
    type: "text",
    label: "Nueva seccion",
    description: "Seccion modular con titulo, subtitulos y parrafos.",
    createDefaultData() {
      return {
        title: "Nueva seccion",
        blocks: [
          {
            subtitle: "Subtitulo",
            body: "Escribe aqui el contenido principal del bloque.",
          },
        ],
      };
    },
    renderDisplay(data) {
      const section = document.createElement("section");
      section.className = "module text-module";

      const blocksMarkup = normalizeBlocks(data.blocks)
        .map(
          (block) => `
            <div class="subsection-block">
              <h3 class="subsection-title">${block.subtitle || ""}</h3>
              <div class="text-block">${block.body || ""}</div>
            </div>
          `
        )
        .join("");

      section.innerHTML = `
        <div class="module-head">${MODULE_ICON}${data.title || ""}</div>
        <div class="module-body content-stack">
          ${blocksMarkup}
        </div>
      `;

      return section;
    },
    renderEditable(data, context) {
      const safeData = {
        title: data.title || "",
        blocks: normalizeBlocks(data.blocks),
      };

      const section = document.createElement("section");
      section.className = "module text-module editable-text-module";

      const head = document.createElement("div");
      head.className = "module-head";
      head.insertAdjacentHTML("beforeend", MODULE_ICON);
      const editableTitle = createEditableHeading(
        "h2",
        "editable-module-title",
        safeData.title,
        "Escribe el titulo de la seccion",
        (nextTitle) => {
          context.onChange(
            {
              ...safeData,
              title: nextTitle,
            },
            { rerenderCanvas: false }
          );
          safeData.title = nextTitle;
        },
        { richText: true }
      );
      head.appendChild(editableTitle);
      section.appendChild(head);

      const body = document.createElement("div");
      body.className = "module-body content-stack";
      const blocksWrap = document.createElement("div");
      blocksWrap.className = "editable-subblocks";

      function renderBlocks() {
        blocksWrap.innerHTML = "";

        safeData.blocks.forEach((block, index) => {
          const blockNode = document.createElement("article");
          blockNode.className = "subsection-block editable-subsection-block";

          const row = document.createElement("div");
          row.className = "editable-subsection-row";

          const subtitle = createEditableHeading(
            "h3",
            "subsection-title editable-subtitle",
            block.subtitle,
            "Subtitulo interno",
            (nextSubtitle) => {
              safeData.blocks[index] = {
                ...safeData.blocks[index],
                subtitle: nextSubtitle,
              };
              context.onChange(
                {
                  ...safeData,
                  blocks: [...safeData.blocks],
                },
                { rerenderCanvas: false }
              );
            },
            { richText: true }
          );

          const controls = document.createElement("div");
          controls.className = "editable-subsection-controls";

          const upBtn = document.createElement("button");
          upBtn.type = "button";
          upBtn.className = "studio-outline-btn";
          upBtn.innerHTML = "&#8593;";
          upBtn.title = "Subir subtitulo";
          upBtn.addEventListener("click", () => {
            if (index <= 0) return;
            [safeData.blocks[index - 1], safeData.blocks[index]] = [
              safeData.blocks[index],
              safeData.blocks[index - 1],
            ];
            context.onChange(
              {
                ...safeData,
                blocks: [...safeData.blocks],
              },
              { rerenderCanvas: true }
            );
          });

          const downBtn = document.createElement("button");
          downBtn.type = "button";
          downBtn.className = "studio-outline-btn";
          downBtn.innerHTML = "&#8595;";
          downBtn.title = "Bajar subtitulo";
          downBtn.addEventListener("click", () => {
            if (index >= safeData.blocks.length - 1) return;
            [safeData.blocks[index + 1], safeData.blocks[index]] = [
              safeData.blocks[index],
              safeData.blocks[index + 1],
            ];
            context.onChange(
              {
                ...safeData,
                blocks: [...safeData.blocks],
              },
              { rerenderCanvas: true }
            );
          });

          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "studio-outline-btn";
          removeBtn.innerHTML = "&times;";
          removeBtn.title = "Eliminar subtitulo";
          removeBtn.addEventListener("click", () => {
            if (safeData.blocks.length === 1) {
              safeData.blocks[0] = { subtitle: "", body: "" };
            } else {
              safeData.blocks = safeData.blocks.filter((_, blockIndex) => blockIndex !== index);
            }
            context.onChange(
              {
                ...safeData,
                blocks: [...safeData.blocks],
              },
              { rerenderCanvas: true }
            );
          });

          controls.appendChild(upBtn);
          controls.appendChild(downBtn);
          controls.appendChild(removeBtn);
          row.appendChild(subtitle);
          row.appendChild(controls);

          const paragraph = createEditableParagraph(
            block.body,
            "Escribe el texto de este subtitulo",
            (nextBody) => {
              safeData.blocks[index] = {
                ...safeData.blocks[index],
                body: nextBody,
              };
              context.onChange(
                {
                  ...safeData,
                  blocks: [...safeData.blocks],
                },
                { rerenderCanvas: false }
              );
            },
            { richText: true }
          );

          blockNode.appendChild(row);
          blockNode.appendChild(paragraph);
          blocksWrap.appendChild(blockNode);
        });
      }

      renderBlocks();
      body.appendChild(blocksWrap);

      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "hero-btn accent";
      addBtn.textContent = "Agregar subtitulo";
      addBtn.addEventListener("click", () => {
        safeData.blocks.push({
          subtitle: "",
          body: "",
        });
        context.onChange(
          {
            ...safeData,
            blocks: [...safeData.blocks],
          },
          { rerenderCanvas: true }
        );
      });

      body.appendChild(addBtn);
      section.appendChild(body);
      return section;
    },
  };
})(window);
