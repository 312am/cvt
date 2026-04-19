(function initViewerWorkbench(global) {
  function boot() {
    const definition = global.CorvianthRegistry?.getModuleDefinition("viewer");
    if (!definition) return;

    const editorRoot = document.getElementById("viewerEditorRoot");
    const displayRoot = document.getElementById("viewerDisplayRoot");
    const jsonRoot = document.getElementById("viewerJson");
    if (!editorRoot || !displayRoot || !jsonRoot) return;

    let moduleData = definition.createDefaultData({});

    function render() {
      editorRoot.innerHTML = "";
      renderDisplay();
      syncJson();

      const editableNode = definition.renderEditable(moduleData, {
        moduleId: "viewer-workbench",
        onChange(nextData) {
          moduleData = nextData;
          syncJson();
          renderDisplay();
        },
      });

      if (editableNode) editorRoot.appendChild(editableNode);
    }

    function syncJson() {
      jsonRoot.textContent = JSON.stringify(moduleData, null, 2);
    }

    function renderDisplay() {
      displayRoot.innerHTML = "";
      const displayNode = definition.renderDisplay(moduleData, {
        id: "viewer-workbench",
        type: "viewer",
      });
      if (displayNode) displayRoot.appendChild(displayNode);
    }

    render();
  }

  global.addEventListener("DOMContentLoaded", boot);
})(window);
