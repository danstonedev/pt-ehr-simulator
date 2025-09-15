// Modern Case Editor with Conservative Imports
import { route } from '../core/index.js';
import { EXPERIMENT_FLAGS } from '../core/constants.js';
import { setQueryParams, onRouteChange, navigate as urlNavigate } from '../core/url.js';
import { el } from '../ui/utils.js';
import {
  createSubjectiveSection,
  createObjectiveSection,
  createAssessmentSection,
  createPlanSection,
  createBillingSection,
} from '../features/soap/index.js';
import {
  initializeCase,
  initializeDraft,
  createErrorDisplay,
  createLoadingIndicator,
} from '../features/case-management/CaseInitialization.js';
import {
  getCaseInfo,
  getPatientDisplayName,
  getCaseDataForNavigation,
  updateCaseObject,
  parseEditorQueryParams,
  calculateHeaderOffset,
  canEditCase,
  formatDOB,
  getPatientDOB,
  getPatientSex,
  handleSectionScroll,
  handleCaseInfoUpdate,
  getCaseInfoSnapshot,
  createChartNavigationForEditor,
} from './CaseEditorUtils.js';
import {
  getHeaderOffsetPx,
  getNearestVisibleAnchorId,
  scrollToAnchorExact,
  afterNextLayout,
  getSectionScrollPercent,
  scrollToPercentExact,
  exposeScrollHelpers,
} from './ScrollUtils.js';
import { createMissingCaseIdError } from './EditorUIUtils.js';
import {
  createPatientHeader,
  setupThemeObserver,
  createPatientHeaderUpdater,
  createPatientHeaderActionsRenderer,
} from './CaseEditorRenderer.js';
import { renderAllSections, getSectionRoot, getSectionHeader } from './SectionRenderer.js';
import {
  createChartNavigation,
  refreshChartNavigation,
  updateSaveStatus,
  openEditCaseModal,
} from '../features/navigation/ChartNavigation.js';
// Sticky green header removed per design update

// Modern modular SOAP section components

route('#/student/editor', async (app, qs) => {
  return renderCaseEditor(app, qs, false); // false = student mode
});

route('#/instructor/editor', async (app, qs) => {
  return renderCaseEditor(app, qs, true); // true = faculty mode
});

async function renderCaseEditor(app, qs, isFacultyMode) {
  // AbortController for all event listeners in this view; router will call returned cleanup
  const ac = new AbortController();
  let offRoute = null;
  let activeObserver = null;
  let headerRO = null;

  // Parse query parameters using utility function
  const params = parseEditorQueryParams(qs);
  const {
    caseId,
    encounter,
    isKeyMode,
    initialSectionParam,
    initialAnchorParam,
    initialScrollPercent,
  } = params;

  // Helper: compute fixed header offset using utility function
  const getHeaderOffsetPxLocal = () => calculateHeaderOffset();

  // Expose helpers for troubleshooting from the console (non-breaking)
  exposeScrollHelpers({
    getHeaderOffsetPx: getHeaderOffsetPxLocal,
    getNearestVisibleAnchorId,
    scrollToAnchorExact,
    getSectionScrollPercent,
    scrollToPercentExact,
  });

  if (!caseId) {
    app.replaceChildren();
    app.append(createMissingCaseIdError());
    return;
  }

  // Redirect old "new" case routes to use the modal instead
  if (caseId === 'new') {
    urlNavigate('/instructor/cases');
    return;
  }

  app.replaceChildren();
  const loadingIndicator = createLoadingIndicator();
  app.append(loadingIndicator);

  // Initialize case using modular function
  const caseResult = await initializeCase(caseId, isFacultyMode, isKeyMode);

  if (caseResult.error) {
    app.replaceChildren();
    app.append(createErrorDisplay(caseResult.title, caseResult.message, caseResult.details));
    return;
  }

  const caseWrapper = caseResult;
  const c = caseWrapper.caseObj;

  app.replaceChildren(); // Clear loading indicator

  // For faculty mode with new cases, we'll show the integrated editor
  // No separate metadata form - everything is integrated

  // Configuration
  // const encReq = {}; // Encounter requirements configuration (reserved for future use)

  // Initialize draft using modular function - pass faculty mode for proper data handling
  const draftManager = initializeDraft(caseId, encounter, isFacultyMode, c, isKeyMode);
  let { draft, save: originalSave } = draftManager;

  // Create chart navigation sidebar first
  const chartNav = await createChartNavigationForEditor({
    c,
    draft,
    isFacultyMode,
    switchTo,
    save,
    refreshChartProgress,
  });

  // Wrap save function to include progress refresh and status updates
  const save = async (...args) => {
    // Update sidebar save status only (sticky header removed)
    updateSaveStatus(chartNav, 'saving');
    // Announce saving to screen readers
    try {
      const announcer = document.getElementById('route-announcer');
      if (announcer) announcer.textContent = 'Saving…';
    } catch {}
    try {
      await originalSave(...args);
      updateSaveStatus(chartNav, 'saved');
      try {
        const announcer = document.getElementById('route-announcer');
        if (announcer) announcer.textContent = 'All changes saved';
      } catch {}
      if (window.refreshChartProgress) window.refreshChartProgress();
    } catch (error) {
      updateSaveStatus(chartNav, 'error');
      try {
        const announcer = document.getElementById('route-announcer');
        if (announcer) announcer.textContent = 'Save failed';
      } catch {}
      console.error('Save failed:', error);
    }
  };

  // Make draft available globally for goal linking
  window.currentDraft = draft;
  window.saveDraft = save;

  // Create debounced save function for case info updates
  let saveTimeout;
  const debouncedSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      save();
      refreshChartProgress();
    }, 500); // Wait 500ms after user stops typing
  };

  // Make chart refresh available globally for components
  window.refreshChartProgress = null; // Will be set after chart creation

  // Section configuration - no need for old progress tracking
  const sections = ['subjective', 'objective', 'assessment', 'plan', 'billing'];
  const isValidSection = (s) => sections.includes(s);
  let active = isValidSection(initialSectionParam) ? initialSectionParam : 'subjective';
  const initialActiveSection = active;
  // Simple mode: only permit initial scroll if URL explicitly requests it
  // Simple mode defaults on; allow URL to opt out with navsimple=0
  const navParam = qs.get('navsimple');
  const simpleMode = navParam === '0' ? false : !!EXPERIMENT_FLAGS.NAV_SIMPLE_MODE;
  let needsInitialPercentScroll =
    !simpleMode && Number.isFinite(initialScrollPercent) && isValidSection(active);
  let needsInitialAnchorScroll =
    (!simpleMode && !needsInitialPercentScroll && !!initialAnchorParam && isValidSection(active)) ||
    (simpleMode && !!initialAnchorParam && isValidSection(active));

  // During a programmatic section change we temporarily suppress scroll-driven
  // active section recalculation to avoid rapid re-renders (jitter) while the
  // browser animates smooth scrolling. We store a timestamp instead of a boolean
  // so overlapping programmatic navigations extend the window naturally.
  let programmaticScrollBlockUntil = 0;
  let isProgrammaticScroll = false; // simple guard

  // Sticky top bar removed; preview can be triggered from elsewhere if desired

  // Function to refresh chart navigation progress
  function refreshChartProgress() {
    refreshChartNavigation(chartNav, {
      activeSection: active,
      onSectionChange: (sectionId) => switchTo(sectionId),
      isFacultyMode: isFacultyMode,
      caseData: getCaseDataForNavigation(c, draft),
      caseInfo: getCaseInfo(c),
      onCaseInfoUpdate: (updatedInfo) => {
        updateCaseObject(c, updatedInfo, draft);
        save();
        refreshChartProgress();
      },
      onEditorSettingsChange: (nextSettings) => {
        draft.editorSettings = nextSettings;
        c.editorSettings = nextSettings;
        save();
        refreshChartProgress();
      },
    });
  }

  // React to external URL changes (e.g., user edits hash or navigates)
  try {
    offRoute = onRouteChange((e) => {
      const { params } = e.detail || {};
      const next = params && params.section ? String(params.section).toLowerCase() : '';
      if (next && next !== active && isValidSection(next)) {
        switchTo(next);
      }
    });
  } catch {}

  // Make chart refresh available globally for components
  window.refreshChartProgress = refreshChartProgress;

  // Create patient header using modular utility
  const { patientHeader, updatePatientHeader } = createPatientHeader();

  // Setup theme observer for avatar updates
  const themeObserver = setupThemeObserver(patientHeader);

  // Setup resize observer for header height tracking
  try {
    if ('ResizeObserver' in window) {
      headerRO = new ResizeObserver(() => {
        const h = patientHeader.offsetHeight || 0;
        document.documentElement.style.setProperty('--patient-sticky-h', `${h}px`);
      });
      headerRO.observe(patientHeader);
    } else {
      // Fallback: recompute on resize in environments without ResizeObserver
      window.addEventListener(
        'resize',
        () => {
          const h = patientHeader.offsetHeight || 0;
          document.documentElement.style.setProperty('--patient-sticky-h', `${h}px`);
        },
        { passive: true, signal: ac.signal },
      );
    }
  } catch {}

  // Create main content container with sidebar offset + header
  const contentRoot = el('div', { id: 'section', class: 'section-content' });
  const mainContainer = el('div', { class: 'main-content-with-sidebar' }, [
    patientHeader,
    contentRoot,
  ]);

  // Render all sections once to form a single scrolling page
  // Use modular section renderer
  const { sectionRoots, sectionHeaders } = renderAllSections(contentRoot, draft, save);

  // Percent scroll within the currently active top-level section
  function scrollToPercentWithinActive(pct) {
    const root = getSectionRoot(sectionRoots, active);
    if (!root) return false;
    const offset = getHeaderOffsetPx();
    const rect = root.getBoundingClientRect();
    const sectionTopAbs = window.scrollY + rect.top;
    const viewportH = window.innerHeight;
    const scrollable = Math.max(0, root.scrollHeight - (viewportH - offset));
    const clamped = Math.max(0, Math.min(1, pct ?? 0));
    const targetY = Math.max(0, sectionTopAbs - offset + scrollable * clamped);
    window.scrollTo({ top: targetY, behavior: 'auto' });
    return true;
  }

  function performInitialScrollIfNeeded(currentSectionId) {
    // If the user navigated away from the initially requested section before
    // the initial scroll fired, cancel the initial scroll behavior entirely.
    if (currentSectionId !== initialActiveSection) {
      needsInitialPercentScroll = false;
      needsInitialAnchorScroll = false;
      // Also check for any transient pending anchor requests and clear them if no longer relevant
      try {
        if (window.__pendingAnchorScrollId && currentSectionId !== active) {
          window.__pendingAnchorScrollId = '';
        }
      } catch {}
      return;
    }
    if (currentSectionId !== active) return;
    // If a pending anchor scroll was requested by the sidebar while changing sections, honor it first
    try {
      if (window.__pendingAnchorScrollId) {
        const id = String(window.__pendingAnchorScrollId);
        window.__pendingAnchorScrollId = '';
        // Attempt immediate scroll; retry lightly after next layout
        let ok = scrollToAnchorExact(id, 'smooth');
        afterNextLayout(() => {
          if (!ok) ok = scrollToAnchorExact(id, 'smooth');
        });
        setTimeout(() => {
          if (!ok) scrollToAnchorExact(id, 'smooth');
        }, 120);
        // Do not proceed with percent/anchor initial behavior in this pass
        needsInitialPercentScroll = false;
        needsInitialAnchorScroll = false;
        return;
      }
    } catch {}
    if (needsInitialPercentScroll && Number.isFinite(initialScrollPercent)) {
      let okP = scrollToPercentWithinActive(initialScrollPercent);
      afterNextLayout(() => {
        if (!okP) okP = scrollToPercentWithinActive(initialScrollPercent);
      });
      setTimeout(() => {
        if (!okP) okP = scrollToPercentWithinActive(initialScrollPercent);
        if (!okP) {
          // fallback to anchor or nearest visible anchor
          if (initialAnchorParam) {
            let ok = scrollToAnchorExact(initialAnchorParam);
            afterNextLayout(() => {
              if (!ok) ok = scrollToAnchorExact(initialAnchorParam);
            });
            setTimeout(() => {
              if (!ok) ok = scrollToAnchorExact(initialAnchorParam);
              if (!ok) {
                const fallbackId = getNearestVisibleAnchorId();
                if (fallbackId) scrollToAnchorExact(fallbackId);
              }
            }, 120);
          } else {
            const fallbackId = getNearestVisibleAnchorId();
            if (fallbackId) scrollToAnchorExact(fallbackId);
          }
        }
      }, 120);
      needsInitialPercentScroll = false;
      needsInitialAnchorScroll = false;
      return;
    }
    if (needsInitialAnchorScroll && initialAnchorParam) {
      let ok = scrollToAnchorExact(initialAnchorParam);
      afterNextLayout(() => {
        if (!ok) ok = scrollToAnchorExact(initialAnchorParam);
      });
      setTimeout(() => {
        if (!ok) ok = scrollToAnchorExact(initialAnchorParam);
        if (!ok) {
          const fallbackId = getNearestVisibleAnchorId();
          if (fallbackId) scrollToAnchorExact(fallbackId);
        }
      }, 120);
      needsInitialAnchorScroll = false;
    }
  }

  // Use IntersectionObserver to update active section based on section headers entering the viewport
  function setupActiveSectionObserver() {
    try {
      if (activeObserver) activeObserver.disconnect();
    } catch {}
    const offset = Math.max(0, getHeaderOffsetPx());
    function setActiveSectionFromObserver(id) {
      if (!id || id === active) return;
      if (!['subjective', 'objective', 'assessment', 'plan', 'billing'].includes(id)) return;
      active = id;
      refreshChartNavigation(chartNav, {
        activeSection: active,
        onSectionChange: (sectionId) => switchTo(sectionId),
        isFacultyMode: isFacultyMode,
        caseData: {
          ...c,
          ...draft,
          modules: Array.isArray(draft.modules) ? draft.modules : c.modules,
          editorSettings: c.editorSettings || draft.editorSettings,
        },
        caseInfo: getCaseInfoSnapshot(),
        onCaseInfoUpdate: handleCaseInfoUpdate,
        onEditorSettingsChange: (nextSettings) => {
          draft.editorSettings = nextSettings;
          c.editorSettings = nextSettings;
          save();
          if (window.refreshChartProgress) window.refreshChartProgress();
        },
      });
    }

    activeObserver = new IntersectionObserver(
      (entries) => {
        if (Date.now() < programmaticScrollBlockUntil || isProgrammaticScroll) return;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = (e.target.id || '').replace('section-', '');
          setActiveSectionFromObserver(id);
        }
      },
      { root: null, rootMargin: `-${offset + 8}px 0px -60% 0px`, threshold: 0.01 },
    );
    // Observe all section headers
    try {
      Object.values(sectionHeaders).forEach((hdr) => hdr && activeObserver.observe(hdr));
    } catch {}
  }

  function switchTo(s) {
    if (!isValidSection(s)) return;

    const changingSection = s !== active;
    active = s;

    // User selection overrides any pending initial scroll behavior
    needsInitialPercentScroll = false;
    needsInitialAnchorScroll = false;

    // Prevent scroll-driven active recalculation for the duration of the smooth scroll
    programmaticScrollBlockUntil = Date.now() + 700; // ~0.7s window
    isProgrammaticScroll = true;

    // Sync section to URL (replace by default to avoid history spam)
    try {
      setQueryParams({ section: s });
    } catch {}

    if (changingSection) {
      // Update chart navigation only if the logical active section changed.
      refreshChartNavigation(chartNav, {
        activeSection: active,
        onSectionChange: (sectionId) => switchTo(sectionId),
        isFacultyMode: isFacultyMode,
        caseData: getCaseDataForNavigation(c, draft),
        caseInfo: getCaseInfo(c),
        onCaseInfoUpdate: (updatedInfo) => {
          updateCaseObject(c, updatedInfo, draft);
          updatePatientHeader();
          debouncedSave();
        },
        onEditorSettingsChange: (nextSettings) => {
          draft.editorSettings = nextSettings;
          c.editorSettings = nextSettings;
          save();
          if (window.refreshChartProgress) window.refreshChartProgress();
        },
      });
    }

    // Scroll logic (single attempt + minimal fallback) kept intentionally lean
    handleSectionScroll(
      s,
      getSectionHeader,
      getSectionRoot,
      scrollToAnchorExact,
      getHeaderOffsetPx,
    );

    // Clear programmatic flag on scroll end or timeout
    const clearProg = () => {
      isProgrammaticScroll = false;
      window.removeEventListener('scrollend', clearProg);
    };
    try {
      window.addEventListener('scrollend', clearProg, { once: true, signal: ac.signal });
    } catch {
      // scrollend not supported; fallback timeout
      setTimeout(() => (isProgrammaticScroll = false), 800);
    }

    performInitialScrollIfNeeded(s);
  }

  // Initialize the editor with sidebar navigation only
  app.append(chartNav, mainContainer);
  // Initialize header immediately so CSS var is ready before sections mount
  updatePatientHeader();
  const renderPatientHeaderActions = createPatientHeaderActionsRenderer(
    patientHeader,
    isFacultyMode,
    c,
    save,
  );
  renderPatientHeaderActions();
  renderAllSections();
  // Set up IntersectionObserver for active section tracking
  setupActiveSectionObserver();
  // Initial nav state + optional deep link handling
  refreshChartNavigation(chartNav, {
    activeSection: active,
    onSectionChange: (sectionId) => switchTo(sectionId),
    isFacultyMode: isFacultyMode,
    caseData: {
      ...c,
      ...draft,
      modules: Array.isArray(draft.modules) ? draft.modules : c.modules,
      editorSettings: c.editorSettings || draft.editorSettings,
    },
    caseInfo: {
      title: c.caseTitle || c.title || (c.meta && c.meta.title) || 'Untitled Case',
      setting: c.setting || (c.meta && c.meta.setting) || 'Outpatient',
      age: c.patientAge || c.age || (c.snapshot && c.snapshot.age) || '',
      sex: c.patientGender || c.sex || (c.snapshot && c.snapshot.sex) || 'N/A',
      acuity: c.acuity || (c.meta && c.meta.acuity) || 'unspecified',
      dob: c.patientDOB || c.dob || (c.snapshot && c.snapshot.dob) || '',
      modules: Array.isArray(c.modules) ? c.modules : [],
    },
    onCaseInfoUpdate: (updatedInfo) => {
      c.caseTitle = updatedInfo.title;
      c.title = updatedInfo.title;
      c.setting = updatedInfo.setting;
      c.patientAge = updatedInfo.age;
      c.patientGender = updatedInfo.sex;
      c.acuity = updatedInfo.acuity;
      c.patientDOB = updatedInfo.dob;
      if (Array.isArray(updatedInfo.modules)) {
        c.modules = updatedInfo.modules;
        draft.modules = updatedInfo.modules;
      }
      // Keep canonical containers in sync
      c.meta = c.meta || {};
      c.meta.title = updatedInfo.title;
      c.meta.setting = updatedInfo.setting;
      c.meta.acuity = updatedInfo.acuity;
      c.snapshot = c.snapshot || {};
      c.snapshot.age = updatedInfo.age;
      c.snapshot.sex = (updatedInfo.sex || '').toLowerCase() || 'unspecified';
      c.snapshot.dob = updatedInfo.dob;
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    },
    onEditorSettingsChange: (nextSettings) => {
      draft.editorSettings = nextSettings;
      c.editorSettings = nextSettings;
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    },
  });
  // Perform initial anchor/percent scroll after content is laid out
  afterNextLayout(() => performInitialScrollIfNeeded(active));

  // Recreate observer on resize to keep rootMargin aligned with sticky header height
  window.addEventListener(
    'resize',
    () => {
      try {
        setupActiveSectionObserver();
      } catch {}
    },
    { passive: true, signal: ac.signal },
  );

  // Return teardown so the router can clean this view on navigation
  return () => {
    offRoute?.();
    themeObserver?.disconnect?.();
    activeObserver?.disconnect?.();
    headerRO?.disconnect?.();
    ac.abort();
  };
}

/**
 * Creates an integrated case metadata panel for faculty editors
 * @param {Object} caseObj - Case object to edit
 * @param {Function} saveFunction - Function to save changes
 * @returns {HTMLElement} Metadata panel element
 */
// removed unused createCaseMetadataPanel
