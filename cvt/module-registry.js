(function registerModuleRegistry(global) {
  function getModuleRegistry() {
    return global.CorvianthModules || {};
  }

  function getModuleDefinition(type) {
    const registry = getModuleRegistry();
    return registry[type] || null;
  }

  function listModuleDefinitions() {
    return Object.values(getModuleRegistry());
  }

  global.CorvianthRegistry = {
    getModuleDefinition,
    listModuleDefinitions,
  };
})(window);
