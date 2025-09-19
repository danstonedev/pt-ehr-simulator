// EditorConfigManager.js - Handles editor configuration and state management

import { EXPERIMENT_FLAGS } from '../core/constants.js';
// Lazy accessor to avoid statically bundling navigation API
async function _getRefreshChartNavigation() {
  const { getRefreshChartNavigation } = await import('../features/navigation/api.js');
  return getRefreshChartNavigation();
}

/**
 * Creates editor configuration for section management
 * @param {Object} options - Configuration options
 * @returns {Object} Configuration object
 */
export function createEditorConfiguration(options) {
  const { initialSectionParam, qs, initialScrollPercent, initialAnchorParam } = options;

  // Section configuration - no need for old progress tracking
  const sections = ['subjective', 'objective', 'assessment', 'plan', 'billing'];
  const isValidSection = (s) => sections.includes(s);
  const active = isValidSection(initialSectionParam) ? initialSectionParam : 'subjective';
  const initialActiveSection = active;

  // Simple mode: only permit initial scroll if URL explicitly requests it
  // Simple mode defaults on; allow URL to opt out with navsimple=0
  const navParam = qs.get('navsimple');
  const simpleMode = navParam === '0' ? false : !!EXPERIMENT_FLAGS.NAV_SIMPLE_MODE;

  const scrollConfiguration = createScrollConfiguration({
    simpleMode,
    initialScrollPercent,
    initialAnchorParam,
    active,
    isValidSection,
  });

  return {
    sections,
    isValidSection,
    active,
    initialActiveSection,
    simpleMode,
    ...scrollConfiguration,
  };
}

/**
 * Creates scroll configuration settings
 * @param {Object} options - Scroll options
 * @returns {Object} Scroll configuration
 */
function createScrollConfiguration(options) {
  const { simpleMode, initialScrollPercent, initialAnchorParam, active, isValidSection } = options;

  const needsInitialPercentScroll =
    !simpleMode && Number.isFinite(initialScrollPercent) && isValidSection(active);

  const needsInitialAnchorScroll =
    (!simpleMode && !needsInitialPercentScroll && !!initialAnchorParam && isValidSection(active)) ||
    (simpleMode && !!initialAnchorParam && isValidSection(active));

  return {
    needsInitialPercentScroll,
    needsInitialAnchorScroll,
  };
}

/**
 * Creates state management for programmatic scrolling
 * @returns {Object} State management functions
 */
export function createScrollStateManager() {
  // During a programmatic section change we temporarily suppress scroll-driven
  // active section recalculation to avoid rapid re-renders (jitter) while the
  // browser animates smooth scrolling. We store a timestamp instead of a boolean
  // so overlapping programmatic navigations extend the window naturally.
  let programmaticScrollBlockUntil = 0;
  let isProgrammaticScroll = false; // simple guard

  return {
    getProgrammaticScrollBlockUntil: () => programmaticScrollBlockUntil,
    setProgrammaticScrollBlockUntil: (value) => {
      programmaticScrollBlockUntil = value;
    },
    getIsProgrammaticScroll: () => isProgrammaticScroll,
    setIsProgrammaticScroll: (value) => {
      isProgrammaticScroll = value;
    },
  };
}

/**
 * Creates chart refresh function
 * @param {Object} options - Refresh options
 * @returns {Function} Refresh function
 */
export function createChartRefreshFunction(options) {
  const {
    chartNav,
    active,
    switchTo,
    isFacultyMode,
    getCaseDataForNavigation,
    getCaseInfo,
    c,
    draft,
    updateCaseObject,
    save,
  } = options;

  // Query param gates for debug logging (use ?debug=1 or ?debug=progress)
  const search = new URLSearchParams(location.search);
  const debugAll = search.get('debug') === '1';
  const debugProgress = debugAll || search.get('debug') === 'progress';

  let frameHandle = null; // requestAnimationFrame handle
  let isDirty = false; // Indicates a refresh has been requested while one is pending
  let lastRunTs = 0; // diagnostic timing

  function log(...args) {
    if (debugProgress) console.warn('[progress]', ...args);
  }

  function runRefresh() {
    frameHandle = null;
    if (!isDirty) return; // no work queued
    isDirty = false;
    lastRunTs = performance.now();
    log('refreshChartProgress executing');
    try {
      _getRefreshChartNavigation().then(
        (refreshChartNavigation) =>
          refreshChartNavigation &&
          refreshChartNavigation(chartNav, {
            activeSection: active,
            onSectionChange: (sectionId) => switchTo(sectionId),
            isFacultyMode: isFacultyMode,
            caseData: getCaseDataForNavigation(c, draft),
            caseInfo: getCaseInfo(c),
            onCaseInfoUpdate: (updatedInfo) => {
              log('onCaseInfoUpdate');
              updateCaseObject(c, updatedInfo, draft);
              save();
              queue();
            },
            onEditorSettingsChange: (nextSettings) => {
              log('onEditorSettingsChange');
              draft.editorSettings = nextSettings;
              c.editorSettings = nextSettings;
              save();
              queue();
            },
          }),
      );
    } catch (err) {
      log('refreshChartProgress error', err);
    }
  }

  function queue() {
    // Mark dirty and ensure a frame is queued
    isDirty = true;
    if (frameHandle == null) {
      frameHandle = requestAnimationFrame(runRefresh);
    }
  }

  // Public API: schedule a refresh; multiple rapid calls coalesce into one per frame
  function refreshChartProgress() {
    queue();
  }

  // Optionally expose a diagnostic method (not documented; for internal tests)
  refreshChartProgress._diagnostics = () => ({ lastRunTs, pending: frameHandle != null, isDirty });

  return refreshChartProgress;
}
