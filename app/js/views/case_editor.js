// Modern Case Editor with Conservative Imports
import { route, navigate, getCase, createCase, updateCase } from '../core/index.js';
import { setQueryParams, onRouteChange } from '../core/url.js';
import { el, textareaAutoResize, printPage } from '../ui/utils.js';
import { renderTabs } from '../ui/components.js';
import { inputField, textAreaField, selectField, sectionHeader } from '../ui/form-components.js';
import { exportToWord } from '../services/document-export.js';
import {
  createSubjectiveSection,
  createObjectiveSection,
  createAssessmentSection,
  createPlanSection,
  createBillingSection,
  createMultiRegionalAssessment,
} from '../features/soap/index.js';
import {
  initializeCase,
  initializeDraft,
  createErrorDisplay,
  createLoadingIndicator,
} from '../features/case-management/CaseInitialization.js';
import {
  createChartNavigation,
  createSectionAnchors,
  refreshChartNavigation,
  updateSaveStatus,
} from '../features/navigation/ChartNavigation.js';
import {
  createSimpleTabs,
  createStickyTopBar,
  updateActiveSectionTitle,
  updateHeaderSaveStatus,
} from '../features/navigation/NavigationHeader.js?v=20250818-001';

// Modern modular SOAP section components

route('#/student/editor', async (app, qs) => {
  return renderCaseEditor(app, qs, false); // false = student mode
});

route('#/instructor/editor', async (app, qs) => {
  return renderCaseEditor(app, qs, true); // true = faculty mode
});

async function renderCaseEditor(app, qs, isFacultyMode) {
  const caseId = qs.get('case');
  const version = parseInt(qs.get('v') || '0', 10);
  const encounter = qs.get('encounter') || 'eval';
  const isKeyMode = qs.get('key') === 'true';
  const fromParam = qs.get('from') || '';
  const isPreviewMode = !isFacultyMode && fromParam === 'faculty';
  const initialSectionParam = (qs.get('section') || '').toLowerCase();
  const initialAnchorParam = qs.get('anchor') || '';
  const spParamRaw = qs.get('sp');
  const initialScrollPercent = spParamRaw !== null ? parseFloat(spParamRaw) : NaN;
  // Helper: compute combined fixed header offset for anchor calculations
  function getHeaderOffsetPx() {
    const cs = getComputedStyle(document.documentElement);
    const topbarH = parseInt(
      (cs.getPropertyValue('--topbar-h') || '').replace('px', '').trim(),
      10,
    );
    const stickyH = parseInt(
      (cs.getPropertyValue('--sticky-header-h') || '').replace('px', '').trim(),
      10,
    );
    const tb = isNaN(topbarH) ? 72 : topbarH;
    const sh = isNaN(stickyH) ? 64 : stickyH;
    return tb + sh; // exact sum; CSS scroll-margin-top uses the same
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
    navigate('#/instructor/cases');
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
  const encReq = {}; // Encounter requirements configuration

  // Initialize draft using modular function - pass faculty mode for proper data handling
  const draftManager = initializeDraft(caseId, encounter, isFacultyMode, c, isKeyMode);
  let { draft, save: originalSave, resetDraft } = draftManager;

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
    // Update save status to saving (header + sidebar if present)
    updateHeaderSaveStatus(stickyTopBar, 'saving');
    updateSaveStatus(chartNav, 'saving');

    try {
      await originalSave(...args);
      // Update save status to saved
      updateHeaderSaveStatus(stickyTopBar, 'saved');
      updateSaveStatus(chartNav, 'saved');

      // Trigger progress refresh after save
      if (window.refreshChartProgress) {
        window.refreshChartProgress();
      }
    } catch (error) {
      // Update save status to error
      updateHeaderSaveStatus(stickyTopBar, 'error');
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

  // Create sticky top bar (shows active section title)
  const stickyTopBar = createStickyTopBar({
    activeSection: active,
    isFacultyMode,
    isPreviewMode,
    onPreview: () => {
      // Determine nearest subsection anchor within current section using exact header offset
      const anchorId = getNearestVisibleAnchorId();
      const sp = getSectionScrollPercent();
      const base = isFacultyMode ? '#/student/editor' : '#/student/editor';
      const from = isFacultyMode ? '&from=faculty' : '';
      const sectionQS = `&section=${encodeURIComponent(active)}`;
      const anchorQS = anchorId ? `&anchor=${encodeURIComponent(anchorId)}` : '';
      const spQS = `&sp=${sp.toFixed(4)}`;
      navigate(
        `${base}?case=${caseId}&v=${version}&encounter=${encounter}${from}${sectionQS}${anchorQS}${spQS}`,
      );
    },
    onExitPreview: () => {
      // Only meaningful in student preview mode; navigate back to faculty editor with original context when available
      // Prefer the original anchor used when entering preview (initialAnchorParam),
      // because some anchors may be hidden in student mode due to faculty visibility.
      let anchorId = initialAnchorParam || '';
      if (!anchorId) {
        anchorId = getNearestVisibleAnchorId();
      }
      const sectionQS = `&section=${encodeURIComponent(active)}`;
      const anchorQS = anchorId ? `&anchor=${encodeURIComponent(anchorId)}` : '';
      const sp = Number.isFinite(initialScrollPercent)
        ? initialScrollPercent
        : getSectionScrollPercent();
      const spQS = `&sp=${sp.toFixed(4)}`;
      navigate(
        `#/instructor/editor?case=${caseId}&v=${version}&encounter=${encounter}${sectionQS}${anchorQS}${spQS}`,
      );
    },
  });

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
  const contentElements = [];

  // Remove the case metadata panel - it's now integrated into the sidebar

  // Add section content area (no more tabs - just content)
  contentElements.push(
    el('div', {
      id: 'section',
      class: 'section-content',
    }),
  );

  const mainContainer = el(
    'div',
    {
      class: 'main-content-with-sidebar',
    },
    contentElements,
  );

  // Centralized initial scroll handler to apply percent-first, then anchor fallback
  function performInitialScrollIfNeeded(currentSectionId) {
    if (currentSectionId !== active) return;
    if (needsInitialPercentScroll && Number.isFinite(initialScrollPercent)) {
      let okP = scrollToPercentExact(initialScrollPercent);
      afterNextLayout(() => {
        if (!okP) okP = scrollToPercentExact(initialScrollPercent);
      });
      setTimeout(() => {
        if (!okP) okP = scrollToPercentExact(initialScrollPercent);
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

    // Update active section title in header
    updateActiveSectionTitle(stickyTopBar, active);

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
        debouncedSave(); // Use debounced save instead of immediate save
      },
      onEditorSettingsChange: (nextSettings) => {
        draft.editorSettings = nextSettings;
        c.editorSettings = nextSettings;
        save();
        if (window.refreshChartProgress) window.refreshChartProgress();
      },
    });

    const sec = mainContainer.querySelector('#section');
    sec.innerHTML = '';

    // Section title is now displayed in the UND Green navigation header
    // No need for redundant section headers in content

    // Use modular section components with anchors
    if (s === 'subjective') {
      const subjectiveSection = createSubjectiveSection(draft.subjective, (data) => {
        draft.subjective = data;
        save();
        if (window.refreshChartProgress) window.refreshChartProgress();
      });
      sec.append(subjectiveSection);
      // Rebuild sidebar subsections from freshly rendered content
      if (window.refreshChartProgress) window.refreshChartProgress();
      performInitialScrollIfNeeded(s);
    }
    if (s === 'objective') {
      const objectiveSection = createObjectiveSection(draft.objective, (data) => {
        draft.objective = data;
        save();
        if (window.refreshChartProgress) window.refreshChartProgress();
      });
      sec.append(objectiveSection);
      if (window.refreshChartProgress) window.refreshChartProgress();
      performInitialScrollIfNeeded(s);
    }
    if (s === 'assessment') {
      const assessmentSection = createAssessmentSection(draft.assessment, (data) => {
        draft.assessment = data;
        save();
        if (window.refreshChartProgress) window.refreshChartProgress();
      });
      sec.append(assessmentSection);
      if (window.refreshChartProgress) window.refreshChartProgress();
      performInitialScrollIfNeeded(s);
    }
    if (s === 'plan') {
      const planSection = createPlanSection(draft.plan, (data) => {
        draft.plan = data;
        save();
        if (window.refreshChartProgress) window.refreshChartProgress();
      });
      sec.append(planSection);
      if (window.refreshChartProgress) window.refreshChartProgress();
      performInitialScrollIfNeeded(s);

      // Make refresh function available globally for goal linking
      window.refreshInterventionCard = (rowId) => {
        // Trigger a refresh of the plan section
        if (active === 'plan') {
          // Re-render the plan section if it's currently active
          const currentSec = mainContainer.querySelector('#section');
          const planContent = currentSec.querySelector('.plan-section');
          if (planContent) {
            const refreshedPlanSection = createPlanSection(draft.plan, (data) => {
              draft.plan = data;
              save();
              if (window.refreshChartProgress) window.refreshChartProgress();
            });
            planContent.replaceWith(refreshedPlanSection);
          }
        }
      };
    }
    if (s === 'billing') {
      const billingSection = createBillingSection(draft.billing, (data) => {
        draft.billing = data;
        save();
        if (window.refreshChartProgress) window.refreshChartProgress();
      });
      sec.append(billingSection);
      if (window.refreshChartProgress) window.refreshChartProgress();
      performInitialScrollIfNeeded(s);
    }
  }

  // Initialize the editor with both top bar and sidebar navigation
  app.append(stickyTopBar, chartNav, mainContainer);
  switchTo(active);
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
                      const newUrl = `#/instructor/editor?case=${savedCase.id}`;
                      setTimeout(() => navigate(newUrl), 100);
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
