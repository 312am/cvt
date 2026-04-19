function initEditorialTextEditor() {
  const editorNotesList = document.getElementById("editorNotesList");
  const editorApplyBtn = document.getElementById("editorApplyBtn");
  const editorResetBtn = document.getElementById("editorResetBtn");
  const editorStatus = document.getElementById("editorStatus");
  const editorApi = window.corvianthEditor;

  if (
    !editorNotesList ||
    !editorApplyBtn ||
    !editorResetBtn ||
    !editorStatus ||
    !editorApi
  ) {
    return;
  }

  function setStatus(message) {
    editorStatus.innerHTML = message;
  }

  function getMetaLabel(note) {
    return `Estudio: ${note.studyId} \u00b7 Frame: ${note.frameIndex + 1}`;
  }

  function renderEditor() {
    const notes = editorApi.getEditorialNotes();
    editorNotesList.innerHTML = "";

    notes.forEach((note, index) => {
      const card = document.createElement("article");
      card.className = "editor-card";

      card.innerHTML = `
        <div class="editor-card-head">
          <div>
            <div class="editor-card-title">Bloque ${index + 1}</div>
            <div class="editor-card-meta">${getMetaLabel(note)}</div>
          </div>
          <button
            class="editor-jump-btn"
            type="button"
            data-editor-jump="${note.id}"
          >
            Ver en visor
          </button>
        </div>
        <textarea
          class="editor-textarea"
          data-note-id="${note.id}"
          spellcheck="false"
        >${note.html}</textarea>
      `;

      editorNotesList.appendChild(card);
    });

    editorNotesList
      .querySelectorAll("[data-editor-jump]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          editorApi.focusEditorialReference(button.dataset.editorJump);
          setStatus("Bloque localizado en el visor editorial.");
        });
      });
  }

  function collectEditorValues() {
    const currentNotes = editorApi.getEditorialNotes();

    return currentNotes.map((note) => {
      const textarea = editorNotesList.querySelector(
        `[data-note-id="${note.id}"]`
      );

      return {
        ...note,
        html: textarea ? textarea.value.trim() : note.html,
      };
    });
  }

  editorApplyBtn.addEventListener("click", () => {
    const nextNotes = collectEditorValues();
    editorApi.setEditorialNotes(nextNotes);
    renderEditor();
    setStatus(
      'Cambios aplicados al visor. Si quieres conservar resaltado verde, mant\u00e9n <code>&lt;span class="hl"&gt;...&lt;/span&gt;</code>.'
    );
  });

  editorResetBtn.addEventListener("click", () => {
    renderEditor();
    setStatus("Editor restaurado con el contenido actual del visor.");
  });

  renderEditor();
}

document.addEventListener("DOMContentLoaded", initEditorialTextEditor);
