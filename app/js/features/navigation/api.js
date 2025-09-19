// navigation/api.js
// Central lazy-loading access layer for navigation helpers.
// This isolates large ChartNavigation code so views don't statically import it,
// improving tree shaking and allowing future module splitting.

let _navMonolithPromise = null;

async function loadMonolith() {
  if (!_navMonolithPromise) {
    _navMonolithPromise = import('./ChartNavigation.js');
  }
  // expose in a global cache for create.js synchronous fallback path
  _navMonolithPromise.then((m) => (window.__navMonolithCache = m)).catch(() => {});
  return _navMonolithPromise;
}

// Light submodules (extracted)
export async function getOpenEditCaseModal() {
  const mod = await import('./modal.js');
  return mod.openEditCaseModal;
}

export async function getUpdateSaveStatus() {
  const mod = await import('./saveStatus.js');
  return mod.updateSaveStatus;
}

// Remaining heavy functions still sourced from monolith until split progresses
export async function getRefreshChartNavigation() {
  const mod = await import('./progress.js');
  return mod.refreshChartNavigation;
}

export async function getCreateChartNavigation() {
  // Prefer lightweight creator module that can progressively inline logic
  const mod = await import('./create.js');
  return mod.createChartNavigation;
}

export async function preloadNavigation() {
  // Fire and forget; helpful if we ever want to warm cache after first paint
  void loadMonolith();
  // Warm the creator module too so first usage is instant
  void import('./create.js');
}

// Convenience helper to batch-load commonly used functions
export async function loadNavigationBundle() {
  const [creator, progressMod] = await Promise.all([
    import('./create.js'),
    import('./progress.js'),
  ]);
  return {
    refreshChartNavigation: progressMod.refreshChartNavigation,
    updateSaveStatus: (await import('./saveStatus.js')).updateSaveStatus,
    openEditCaseModal: (await import('./modal.js')).openEditCaseModal,
    createChartNavigation: creator.createChartNavigation,
  };
}
