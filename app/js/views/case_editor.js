// Modern Case Editor with Conservative Imports
import { route, createCase } from '../core/index.js';
import { setQueryParams, onRouteChange, navigate as urlNavigate } from '../core/url.js';
import { el, textareaAutoResize } from '../ui/utils.js';
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
  createChartNavigation,
  refreshChartNavigation,
  updateSaveStatus,
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
  const caseId = qs.get('case');
  // Version param removed with header changes
  const encounter = qs.get('encounter') || 'eval';
  const isKeyMode = qs.get('key') === 'true';
  // const fromParam = qs.get('from') || '';
  const initialSectionParam = (qs.get('section') || '').toLowerCase();
  const initialAnchorParam = qs.get('anchor') || '';
  const spParamRaw = qs.get('sp');
  const initialScrollPercent = spParamRaw !== null ? parseFloat(spParamRaw) : NaN;
  // Helper: compute fixed header offset (green sticky header removed)
  function getHeaderOffsetPx() {
    const cs = getComputedStyle(document.documentElement);
    const topbarH = parseInt(
      (cs.getPropertyValue('--topbar-h') || '').replace('px', '').trim(),
      10,
    );
    const tb = isNaN(topbarH) ? 72 : topbarH;
    return tb; // only app top bar now
  }

  function getNearestVisibleAnchorId() {
    const sec = document.querySelector('.section-content');
    if (!sec) return '';
    const anchors = Array.from(sec.querySelectorAll('.section-anchor')).filter((a) => {
      const cs = getComputedStyle(a);
      return a.offsetParent !== null && cs.display !== 'none' && cs.visibility !== 'hidden';
    });
    if (!anchors.length) return '';
    let best = anchors[0];
    const threshold = getHeaderOffsetPx();
    anchors.forEach((a) => {
      const r = a.getBoundingClientRect();
      if (r.top <= threshold) best = a;
    });
    return best?.id || '';
  }

  // Robust scrolling to an anchor accounting for fixed headers and layout shifts
  function scrollToAnchorExact(anchorId) {
    if (!anchorId) return false;
    const el = document.getElementById(anchorId);
    if (!el || el.offsetParent === null) return false; // not present or display:none
    const offset = getHeaderOffsetPx();
    const rect = el.getBoundingClientRect();
    const targetY = Math.max(0, window.scrollY + rect.top - offset);
    window.scrollTo({ top: targetY, behavior: 'auto' });
    return true;
  }

  function afterNextLayout(fn) {
    requestAnimationFrame(() => requestAnimationFrame(fn));
  }

  // Compute the current scroll percent within the section content, 0..1
  function getSectionScrollPercent() {
    const sec = document.querySelector('.section-content');
    if (!sec) return 0;
    const offset = getHeaderOffsetPx();
    const rect = sec.getBoundingClientRect();
    const sectionTopAbs = window.scrollY + rect.top;
    const rel = Math.max(0, window.scrollY - (sectionTopAbs - offset));
    const viewportH = window.innerHeight;
    const scrollable = Math.max(0, sec.scrollHeight - (viewportH - offset));
    return scrollable > 0 ? Math.max(0, Math.min(1, rel / scrollable)) : 0;
  }

  // Scroll to a percent within the section content
  function scrollToPercentExact(pct) {
    const sec = document.querySelector('.section-content');
    if (!sec) return false;
    const offset = getHeaderOffsetPx();
    const rect = sec.getBoundingClientRect();
    const sectionTopAbs = window.scrollY + rect.top;
    const viewportH = window.innerHeight;
    const scrollable = Math.max(0, sec.scrollHeight - (viewportH - offset));
    const clamped = Math.max(0, Math.min(1, pct ?? 0));
    const targetY = Math.max(0, sectionTopAbs - offset + scrollable * clamped);
    window.scrollTo({ top: targetY, behavior: 'auto' });
    return true;
  }

  // Expose helpers for troubleshooting from the console (non-breaking)
  window.scrollHelpers = {
    getHeaderOffsetPx,
    getNearestVisibleAnchorId,
    scrollToAnchorExact,
    getSectionScrollPercent,
    scrollToPercentExact,
  };

  if (!caseId) {
    app.innerHTML = '';
    app.append(
      el('div', { class: 'panel error' }, [
        el('h2', {}, 'Missing Case ID'),
        el(
          'p',
          {},
          `No case ID provided in URL. Expected format: #/student/editor?case=CASE_ID&v=0&encounter=eval`,
        ),
      ]),
    );
    return;
  }

  // Redirect old "new" case routes to use the modal instead
  if (caseId === 'new') {
    urlNavigate('/instructor/cases');
    return;
  }

  app.innerHTML = '';
  const loadingIndicator = createLoadingIndicator();
  app.append(loadingIndicator);

  // Initialize case using modular function
  const caseResult = await initializeCase(caseId, isFacultyMode, isKeyMode);

  if (caseResult.error) {
    app.innerHTML = '';
    app.append(createErrorDisplay(caseResult.title, caseResult.message, caseResult.details));
    return;
  }

  const caseWrapper = caseResult;
  const c = caseWrapper.caseObj;

  app.innerHTML = ''; // Clear loading indicator

  // For faculty mode with new cases, we'll show the integrated editor
  // No separate metadata form - everything is integrated

  // Configuration
  // const encReq = {}; // Encounter requirements configuration (reserved for future use)

  // Initialize draft using modular function - pass faculty mode for proper data handling
  const draftManager = initializeDraft(caseId, encounter, isFacultyMode, c, isKeyMode);
  let { draft, save: originalSave } = draftManager;

  // Create chart navigation sidebar first
  const chartNav = createChartNavigation({
    activeSection: 'subjective',
    onSectionChange: (sectionId) => switchTo(sectionId),
    isFacultyMode: isFacultyMode,
    caseData: { ...c, ...draft, editorSettings: c.editorSettings || draft.editorSettings },
    caseInfo: {
      // Prefer explicit fields, then canonical meta/snapshot fallbacks
      title: c.caseTitle || c.title || (c.meta && c.meta.title) || 'Untitled Case',
      setting: c.setting || (c.meta && c.meta.setting) || 'Outpatient',
      age: c.patientAge || c.age || (c.snapshot && c.snapshot.age) || '',
      sex: c.patientGender || c.sex || (c.snapshot && c.snapshot.sex) || 'N/A',
      acuity: c.acuity || (c.meta && c.meta.acuity) || 'Routine',
      dob: c.patientDOB || c.dob || (c.snapshot && c.snapshot.dob) || '',
    },
    onCaseInfoUpdate: (updatedInfo) => {
      // Update the case object with new information
      c.caseTitle = updatedInfo.title;
      c.title = updatedInfo.title;
      c.setting = updatedInfo.setting;
      c.patientAge = updatedInfo.age;
      c.patientGender = updatedInfo.sex;
      c.acuity = updatedInfo.acuity;
      c.patientDOB = updatedInfo.dob;
      // Keep canonical containers in sync
      c.meta = c.meta || {};
      c.meta.title = updatedInfo.title;
      c.meta.setting = updatedInfo.setting;
      c.meta.acuity = updatedInfo.acuity;
      c.snapshot = c.snapshot || {};
      c.snapshot.age = updatedInfo.age;
      // Normalize sex for snapshot to lower-case if looks like a label
      c.snapshot.sex = (updatedInfo.sex || '').toLowerCase() || 'unspecified';
      c.snapshot.dob = updatedInfo.dob;

      // Save the case
      save();

      // Refresh chart navigation to show updated progress
      refreshChartProgress();
    },
    onEditorSettingsChange: (nextSettings) => {
      draft.editorSettings = nextSettings;
      c.editorSettings = nextSettings;
      save();
      refreshChartProgress();
    },
  });

  // Wrap save function to include progress refresh and status updates
  const save = async (...args) => {
    // Update sidebar save status only (sticky header removed)
    updateSaveStatus(chartNav, 'saving');
    try {
      await originalSave(...args);
      updateSaveStatus(chartNav, 'saved');
      if (window.refreshChartProgress) window.refreshChartProgress();
    } catch (error) {
      updateSaveStatus(chartNav, 'error');
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
  let needsInitialPercentScroll = Number.isFinite(initialScrollPercent) && isValidSection(active);
  let needsInitialAnchorScroll =
    !needsInitialPercentScroll && !!initialAnchorParam && isValidSection(active);

  // Sticky top bar removed; preview can be triggered from elsewhere if desired

  // Function to refresh chart navigation progress
  function refreshChartProgress() {
    refreshChartNavigation(chartNav, {
      activeSection: active,
      onSectionChange: (sectionId) => switchTo(sectionId),
      isFacultyMode: isFacultyMode,
      caseData: { ...c, ...draft, editorSettings: c.editorSettings || draft.editorSettings },
      caseInfo: {
        title: c.caseTitle || c.title || (c.meta && c.meta.title) || 'Untitled Case',
        setting: c.setting || (c.meta && c.meta.setting) || 'Outpatient',
        age: c.patientAge || c.age || (c.snapshot && c.snapshot.age) || '',
        sex: c.patientGender || c.sex || (c.snapshot && c.snapshot.sex) || 'N/A',
        acuity: c.acuity || (c.meta && c.meta.acuity) || 'Routine',
        dob: c.patientDOB || c.dob || (c.snapshot && c.snapshot.dob) || '',
      },
      onCaseInfoUpdate: (updatedInfo) => {
        c.caseTitle = updatedInfo.title;
        c.title = updatedInfo.title;
        c.setting = updatedInfo.setting;
        c.patientAge = updatedInfo.age;
        c.patientGender = updatedInfo.sex;
        c.acuity = updatedInfo.acuity;
        c.patientDOB = updatedInfo.dob;
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
        refreshChartProgress();
      },
      onEditorSettingsChange: (nextSettings) => {
        draft.editorSettings = nextSettings;
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
    onRouteChange((e) => {
      const { params } = e.detail || {};
      const next = params && params.section ? String(params.section).toLowerCase() : '';
      if (next && next !== active && isValidSection(next)) {
        switchTo(next);
      }
    });
  } catch {}

  // Make chart refresh available globally for components
  window.refreshChartProgress = refreshChartProgress;

  // Create main content container with sidebar offset
  const contentRoot = el('div', { id: 'section', class: 'section-content' });
  const mainContainer = el('div', { class: 'main-content-with-sidebar' }, [contentRoot]);

  // Render all sections once to form a single scrolling page
  const sectionRoots = {};
  function renderAllSections() {
    contentRoot.innerHTML = '';

    // Subjective
    contentRoot.append(
      el('div', { class: 'editor-section' }, [
        el('div', { class: 'editor-section-divider' }, [el('h3', {}, 'Subjective')]),
      ]),
    );
    const subj = createSubjectiveSection(draft.subjective, (data) => {
      draft.subjective = data;
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    });
    // Ensure expected class is present for sidebar extraction
    subj.classList.add('subjective-section');
    sectionRoots.subjective = subj;
    contentRoot.append(subj);

    // Objective
    contentRoot.append(
      el('div', { class: 'editor-section' }, [
        el('div', { class: 'editor-section-divider' }, [el('h3', {}, 'Objective')]),
      ]),
    );
    const obj = createObjectiveSection(draft.objective, (data) => {
      draft.objective = data;
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    });
    obj.classList.add('objective-section');
    sectionRoots.objective = obj;
    contentRoot.append(obj);

    // Assessment
    contentRoot.append(
      el('div', { class: 'editor-section' }, [
        el('div', { class: 'editor-section-divider' }, [el('h3', {}, 'Assessment')]),
      ]),
    );
    const assess = createAssessmentSection(draft.assessment, (data) => {
      draft.assessment = data;
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    });
    assess.classList.add('assessment-section');
    sectionRoots.assessment = assess;
    contentRoot.append(assess);

    // Plan
    contentRoot.append(
      el('div', { class: 'editor-section' }, [
        el('div', { class: 'editor-section-divider' }, [el('h3', {}, 'Plan')]),
      ]),
    );
    const plan = createPlanSection(draft.plan, (data) => {
      draft.plan = data;
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    });
    plan.classList.add('plan-section');
    sectionRoots.plan = plan;
    contentRoot.append(plan);

    // Billing
    contentRoot.append(
      el('div', { class: 'editor-section' }, [
        el('div', { class: 'editor-section-divider' }, [el('h3', {}, 'Billing')]),
      ]),
    );
    const bill = createBillingSection(draft.billing, (data) => {
      draft.billing = data;
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    });
    bill.classList.add('billing-section');
    sectionRoots.billing = bill;
    contentRoot.append(bill);
  }

  // Centralized initial scroll handler to apply percent-first, then anchor fallback
  function getSectionRoot(id) {
    return sectionRoots[id] || null;
  }

  // Percent scroll within the currently active top-level section
  function scrollToPercentWithinActive(pct) {
    const root = getSectionRoot(active);
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
    if (currentSectionId !== active) return;
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

  function switchTo(s) {
    active = s;

    // Sync section to URL (replace by default to avoid history spam)
    try {
      setQueryParams({ section: s });
    } catch {}

    // Sticky header removed; no title update needed

    // Update chart navigation with current data
    refreshChartNavigation(chartNav, {
      activeSection: active,
      onSectionChange: (sectionId) => switchTo(sectionId),
      isFacultyMode: isFacultyMode,
      caseData: { ...c, ...draft, editorSettings: c.editorSettings || draft.editorSettings },
      caseInfo: {
        title: c.caseTitle || c.title || (c.meta && c.meta.title) || 'Untitled Case',
        setting: c.setting || (c.meta && c.meta.setting) || 'Outpatient',
        age: c.patientAge || c.age || (c.snapshot && c.snapshot.age) || '',
        sex: c.patientGender || c.sex || (c.snapshot && c.snapshot.sex) || 'N/A',
        acuity: c.acuity || (c.meta && c.meta.acuity) || 'Routine',
        dob: c.patientDOB || c.dob || (c.snapshot && c.snapshot.dob) || '',
      },
      onCaseInfoUpdate: (updatedInfo) => {
        c.caseTitle = updatedInfo.title;
        c.title = updatedInfo.title;
        c.setting = updatedInfo.setting;
        c.patientAge = updatedInfo.age;
        c.patientGender = updatedInfo.sex;
        c.acuity = updatedInfo.acuity;
        c.patientDOB = updatedInfo.dob;
        // Keep canonical containers in sync
        c.meta = c.meta || {};
        c.meta.title = updatedInfo.title;
        c.meta.setting = updatedInfo.setting;
        c.meta.acuity = updatedInfo.acuity;
        c.snapshot = c.snapshot || {};
        c.snapshot.age = updatedInfo.age;
        c.snapshot.sex = (updatedInfo.sex || '').toLowerCase() || 'unspecified';
        c.snapshot.dob = updatedInfo.dob;
        debouncedSave();
      },
      onEditorSettingsChange: (nextSettings) => {
        draft.editorSettings = nextSettings;
        c.editorSettings = nextSettings;
        save();
        if (window.refreshChartProgress) window.refreshChartProgress();
      },
    });

    // Scroll to the top of the requested section
    const root = getSectionRoot(s);
    if (root) {
      const offset = getHeaderOffsetPx();
      const rect = root.getBoundingClientRect();
      const y = Math.max(0, window.scrollY + rect.top - offset);
      window.scrollTo({ top: y, behavior: 'smooth' });
      performInitialScrollIfNeeded(s);
    }
  }

  // Initialize the editor with sidebar navigation only
  app.append(chartNav, mainContainer);
  renderAllSections();
  // Initial nav state + optional deep link handling
  refreshChartNavigation(chartNav, {
    activeSection: active,
    onSectionChange: (sectionId) => switchTo(sectionId),
    isFacultyMode: isFacultyMode,
    caseData: { ...c, ...draft, editorSettings: c.editorSettings || draft.editorSettings },
    caseInfo: {
      title: c.caseTitle || c.title || (c.meta && c.meta.title) || 'Untitled Case',
      setting: c.setting || (c.meta && c.meta.setting) || 'Outpatient',
      age: c.patientAge || c.age || (c.snapshot && c.snapshot.age) || '',
      sex: c.patientGender || c.sex || (c.snapshot && c.snapshot.sex) || 'N/A',
      acuity: c.acuity || (c.meta && c.meta.acuity) || 'Routine',
      dob: c.patientDOB || c.dob || (c.snapshot && c.snapshot.dob) || '',
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

  // Observe scroll to update active section and sidebar
  function determineActiveByScroll() {
    const offset = getHeaderOffsetPx();
    const entries = Object.entries(sectionRoots);
    let current = entries[0]?.[0] || 'subjective';
    for (const [id, elRoot] of entries) {
      const top = elRoot.getBoundingClientRect().top;
      if (top - offset <= 8) current = id;
      else break;
    }
    if (current !== active) {
      active = current;
      // Sticky header removed; no title update needed
      refreshChartNavigation(chartNav, {
        activeSection: active,
        onSectionChange: (sectionId) => switchTo(sectionId),
        isFacultyMode: isFacultyMode,
        caseData: { ...c, ...draft, editorSettings: c.editorSettings || draft.editorSettings },
        caseInfo: {
          title: c.caseTitle || c.title || (c.meta && c.meta.title) || 'Untitled Case',
          setting: c.setting || (c.meta && c.meta.setting) || 'Outpatient',
          age: c.patientAge || c.age || (c.snapshot && c.snapshot.age) || '',
          sex: c.patientGender || c.sex || (c.snapshot && c.snapshot.sex) || 'N/A',
          acuity: c.acuity || (c.meta && c.meta.acuity) || 'Routine',
          dob: c.patientDOB || c.dob || (c.snapshot && c.snapshot.dob) || '',
        },
        onEditorSettingsChange: (nextSettings) => {
          draft.editorSettings = nextSettings;
          c.editorSettings = nextSettings;
          save();
          if (window.refreshChartProgress) window.refreshChartProgress();
        },
      });
    }
  }

  let scrollTicking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(() => {
          determineActiveByScroll();
          scrollTicking = false;
        });
      }
    },
    { passive: true },
  );
}

/**
 * Creates an integrated case metadata panel for faculty editors
 * @param {Object} caseObj - Case object to edit
 * @param {Function} saveFunction - Function to save changes
 * @returns {HTMLElement} Metadata panel element
 */
function createCaseMetadataPanel(caseObj, saveFunction) {
  // Track if this is a new case that needs saving
  const isNewCase = !caseObj.meta.title || caseObj.meta.title.trim() === '';

  return el(
    'div',
    {
      class: 'case-metadata-panel',
    },
    [
      el(
        'h3',
        {
          class: 'case-metadata-title',
        },
        isNewCase ? '📝 New Case Setup' : '📋 Case Information',
      ),

      el(
        'div',
        {
          class: 'case-metadata-grid',
        },
        [
          // Left column
          el('div', {}, [
            el(
              'label',
              {
                class: 'form-label-standard',
              },
              'Case Title *',
            ),
            el('input', {
              type: 'text',
              value: caseObj.meta.title || '',
              placeholder: 'e.g., Low Back Pain - Acute Episode',
              class: 'form-input-standard',
              onInput: (e) => {
                caseObj.meta.title = e.target.value;
                caseObj.title = e.target.value; // Also set top-level title
                saveFunction?.();
              },
            }),
          ]),

          // Right column
          el('div', {}, [
            el(
              'label',
              {
                class: 'form-label-standard',
              },
              'Setting',
            ),
            el(
              'select',
              {
                value: caseObj.meta.setting || 'Outpatient',
                class: 'form-input-standard',
                onChange: (e) => {
                  caseObj.meta.setting = e.target.value;
                  saveFunction?.();
                },
              },
              [
                el('option', { value: 'Outpatient' }, 'Outpatient'),
                el('option', { value: 'Inpatient' }, 'Inpatient'),
                el('option', { value: 'Home Health' }, 'Home Health'),
                el('option', { value: 'Skilled Nursing' }, 'Skilled Nursing'),
              ],
            ),
          ]),
        ],
      ),

      el(
        'div',
        {
          class: 'case-metadata-grid',
          style: 'grid-template-columns: 1fr 1fr 1fr;',
        },
        [
          el('div', {}, [
            el(
              'label',
              {
                class: 'form-label-standard',
              },
              'Patient Age',
            ),
            el('input', {
              type: 'number',
              value: caseObj.snapshot.age || '',
              placeholder: 'e.g., 45',
              class: 'form-input-standard',
              onInput: (e) => {
                caseObj.snapshot.age = e.target.value;
                saveFunction?.();
              },
            }),
          ]),

          el('div', {}, [
            el(
              'label',
              {
                class: 'form-label-standard',
              },
              'Sex',
            ),
            el(
              'select',
              {
                value: caseObj.snapshot.sex || 'unspecified',
                class: 'form-input-standard',
                onChange: (e) => {
                  caseObj.snapshot.sex = e.target.value;
                  saveFunction?.();
                },
              },
              [
                el('option', { value: 'unspecified' }, 'Not Specified'),
                el('option', { value: 'male' }, 'Male'),
                el('option', { value: 'female' }, 'Female'),
              ],
            ),
          ]),

          el('div', {}, [
            el(
              'label',
              {
                class: 'form-label-standard',
              },
              'Acuity',
            ),
            el(
              'select',
              {
                value: caseObj.meta.acuity || 'acute',
                class: 'form-input-standard',
                onChange: (e) => {
                  caseObj.meta.acuity = e.target.value;
                  saveFunction?.();
                },
              },
              [
                el('option', { value: 'acute' }, 'Acute'),
                el('option', { value: 'subacute' }, 'Subacute'),
                el('option', { value: 'chronic' }, 'Chronic'),
              ],
            ),
          ]),
        ],
      ),

      el('div', {}, [
        el(
          'label',
          {
            class: 'form-label-standard',
          },
          'Case Description',
        ),
        (() => {
          const t = el('textarea', {
            value: caseObj.snapshot.teaser || '',
            placeholder: 'Brief description of the case for student preview...',
            class: 'form-input-standard',
            rows: 2,
            style: 'min-height: 60px;',
            onInput: (e) => {
              caseObj.snapshot.teaser = e.target.value;
              saveFunction?.();
            },
          });
          textareaAutoResize(t);
          return t;
        })(),
      ]),

      // Save button for new cases
      isNewCase
        ? el(
            'div',
            {
              style: 'margin-top: 15px; text-align: right;',
            },
            [
              el(
                'button',
                {
                  class: 'btn primary',
                  onClick: async () => {
                    if (!caseObj.meta.title || caseObj.meta.title.trim() === '') {
                      alert('Please enter a case title before saving.');
                      return;
                    }

                    try {
                      const savedCase = await createCase(caseObj);
                      // Navigate to the saved case in faculty mode
                      setTimeout(
                        () => urlNavigate('/instructor/editor', { case: savedCase.id }),
                        100,
                      );
                    } catch (error) {
                      console.error('Failed to create case:', error);
                      alert('Failed to create case. Please try again.');
                    }
                  },
                },
                '💾 Save Case',
              ),
            ],
          )
        : null,
    ],
  );
}
