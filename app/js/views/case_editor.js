// Modern Case Editor with Conservative Imports
import { route } from '../core/index.js';
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

/* eslint-disable-next-line complexity */
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
    const sticky = document.getElementById('patient-sticky-header');
    const sh = sticky && sticky.offsetParent !== null ? sticky.offsetHeight : 0;
    // Include the in-content sticky section divider height so anchors land fully below it
    const dividerH = parseInt(
      (cs.getPropertyValue('--section-divider-h') || '').replace('px', '').trim(),
      10,
    );
    const sd = isNaN(dividerH) ? 0 : dividerH;
    return tb + sh + sd;
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
  function scrollToAnchorExact(anchorId, behavior = 'auto') {
    if (!anchorId) return false;
    const el = document.getElementById(anchorId);
    if (!el || el.offsetParent === null) return false; // not present or display:none
    const offset = getHeaderOffsetPx();
    const rect = el.getBoundingClientRect();
    const targetY = Math.max(0, window.scrollY + rect.top - offset);
    window.scrollTo({ top: targetY, behavior });
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
  // Centralized handler to apply case info updates and keep UI/data in sync
  function handleCaseInfoUpdate(updatedInfo) {
    try {
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
      updatePatientHeader();
      renderPatientHeaderActions();
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    } catch (e) {
      console.warn('handleCaseInfoUpdate error:', e);
    }
  }

  // Render actions (Edit Case) in the patient header when allowed
  /* eslint-disable-next-line complexity */
  function getCaseInfoSnapshot() {
    return {
      title: c.caseTitle || c.title || (c.meta && c.meta.title) || 'Untitled Case',
      setting: c.setting || (c.meta && c.meta.setting) || 'Outpatient',
      age: c.patientAge || c.age || (c.snapshot && c.snapshot.age) || '',
      sex: c.patientGender || c.sex || (c.snapshot && c.snapshot.sex) || 'N/A',
      acuity: c.acuity || (c.meta && c.meta.acuity) || 'unspecified',
      dob: c.patientDOB || c.dob || (c.snapshot && c.snapshot.dob) || '',
      modules: Array.isArray(c.modules) ? c.modules : [],
    };
  }
  function renderPatientHeaderActions() {
    const actions = document.getElementById('patient-header-actions');
    if (!actions) return;
    actions.replaceChildren();
    let canEdit = !!isFacultyMode;
    // Allow students to edit if working on a blank note
    try {
      const idStr = String(caseId || '');
      if (!canEdit && idStr.startsWith('blank')) canEdit = true;
    } catch {}
    if (!canEdit) return;
    const openEdit = () => openEditCaseModal(getCaseInfoSnapshot(), handleCaseInfoUpdate);
    actions.append(
      el(
        'button',
        { class: 'btn secondary', style: 'padding:4px 8px; font-size:12px;', onclick: openEdit },
        'Edit',
      ),
    );
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
    app.replaceChildren();
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
  const chartNav = createChartNavigation({
    activeSection: 'subjective',
    onSectionChange: (sectionId) => switchTo(sectionId),
    isFacultyMode: isFacultyMode,
    caseData: {
      ...c,
      ...draft,
      // Prefer draft.modules when present; otherwise use case modules
      modules: Array.isArray(draft.modules) ? draft.modules : c.modules,
      editorSettings: c.editorSettings || draft.editorSettings,
    },
    caseInfo: {
      // Prefer explicit fields, then canonical meta/snapshot fallbacks
      title: c.caseTitle || c.title || (c.meta && c.meta.title) || 'Untitled Case',
      setting: c.setting || (c.meta && c.meta.setting) || 'Outpatient',
      age: c.patientAge || c.age || (c.snapshot && c.snapshot.age) || '',
      sex: c.patientGender || c.sex || (c.snapshot && c.snapshot.sex) || 'N/A',
      acuity: c.acuity || (c.meta && c.meta.acuity) || 'unspecified',
      dob: c.patientDOB || c.dob || (c.snapshot && c.snapshot.dob) || '',
      modules: Array.isArray(c.modules) ? c.modules : [],
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
      c.modules = Array.isArray(updatedInfo.modules) ? updatedInfo.modules : c.modules || [];
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
      // Persist modules to draft/case
      if (Array.isArray(updatedInfo.modules)) {
        draft.modules = updatedInfo.modules;
      }

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
  let needsInitialPercentScroll = Number.isFinite(initialScrollPercent) && isValidSection(active);
  let needsInitialAnchorScroll =
    !needsInitialPercentScroll && !!initialAnchorParam && isValidSection(active);

  // Sticky top bar removed; preview can be triggered from elsewhere if desired

  // Function to refresh chart navigation progress
  /* eslint-disable-next-line complexity */
  function refreshChartProgress() {
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
        c.modules = Array.isArray(updatedInfo.modules) ? updatedInfo.modules : c.modules || [];
        // Keep canonical containers in sync
        c.meta = c.meta || {};
        c.meta.title = updatedInfo.title;
        c.meta.setting = updatedInfo.setting;
        c.meta.acuity = updatedInfo.acuity;
        c.snapshot = c.snapshot || {};
        c.snapshot.age = updatedInfo.age;
        c.snapshot.sex = (updatedInfo.sex || '').toLowerCase() || 'unspecified';
        c.snapshot.dob = updatedInfo.dob;
        if (Array.isArray(updatedInfo.modules)) {
          draft.modules = updatedInfo.modules;
        }
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

  // Sticky patient header (two-line stacked)
  // Parse YYYY-MM-DD as a local date (avoid implicit UTC parsing which can shift a day in some TZs)
  function parseLocalDateYMD(str) {
    if (!str || typeof str !== 'string') return null;
    // Accept only canonical YYYY-MM-DD
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) {
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d; // fallback for other formats
    }
    const [, y, mo, da] = m;
    const year = Number(y);
    const monthIndex = Number(mo) - 1; // 0-based
    const day = Number(da);
    // Construct local date (year, monthIndex, day) which uses local timezone midnight
    return new Date(year, monthIndex, day, 0, 0, 0, 0);
  }

  function computeAgeFromDobLocal(dobStr) {
    if (!dobStr) return '';
    const dob = parseLocalDateYMD(dobStr);
    if (!dob) return '';
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 0 && age < 200 ? String(age) : '';
  }

  const patientHeaderNameEl = el('div', { style: 'font-size:20px; line-height:1.25;' }, '');
  const patientHeaderDemoEl = el(
    'div',
    {
      style:
        'font-size:16px; color: var(--text-secondary); line-height:1.3; margin-top:4px; margin-left: var(--space-4);',
    },
    '',
  );
  // Avatar container (PNG swapped by sex + theme)
  const avatarEl = el('div', { class: 'patient-avatar', 'aria-hidden': 'true' }, []);

  // Asset mapping – user must place PNGs under app/img/avatars/
  const AVATAR_MAP = {
    male: {
      light: 'img/icon_male_light.png',
      dark: 'img/icon_male_dark.png',
    },
    female: {
      light: 'img/icon_female_light.png',
      dark: 'img/icon_female_dark.png',
    },
    neutral: {
      light: 'img/icon_unknown_light.png',
      dark: 'img/icon_unknown_dark.png',
    },
  };

  function normalizeSex(val) {
    if (!val) return 'neutral';
    const s = String(val).toLowerCase();
    if (s.startsWith('m')) return 'male';
    if (s.startsWith('f')) return 'female';
    return 'neutral';
  }
  function currentThemeMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function updatePatientAvatar(rawSex) {
    const sex = normalizeSex(rawSex);
    const mode = currentThemeMode();
    // Skip if already set
    if (avatarEl.dataset.sex === sex && avatarEl.dataset.mode === mode) return;
    avatarEl.dataset.sex = sex;
    avatarEl.dataset.mode = mode;
    const src = (AVATAR_MAP[sex] && AVATAR_MAP[sex][mode]) || AVATAR_MAP.neutral[mode];
    let img = avatarEl.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.decoding = 'async';
      img.width = 40;
      img.height = 40;
      img.style.display = 'block';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '50%';
      avatarEl.replaceChildren(img);
    }
    // Accessible alt text (describe visual symbol only once)
    const altMap = {
      male: 'Male patient avatar',
      female: 'Female patient avatar',
      neutral: 'Patient avatar',
    };
    img.alt = altMap[sex] || 'Patient avatar';
    img.src = src;
  }

  const patientHeader = el(
    'div',
    {
      id: 'patient-sticky-header',
      style: [
        'position: sticky',
        'top: var(--topbar-h, 72px)',
        // Ensure patient banner stays above sticky section dividers
        'z-index: var(--z-case-header)',
        'background: var(--case-header-bg, var(--bg))',
        'display:flex',
        'align-items:center',
        'justify-content: space-between',
        'gap: 12px',
      ].join('; '),
    },
    [
      // Left: avatar + name lines
      el('div', { style: 'display:flex; align-items:center; gap:12px;' }, [
        avatarEl,
        el('div', {}, [patientHeaderNameEl, patientHeaderDemoEl]),
      ]),
      // Right: actions
      el('div', { id: 'patient-header-actions' }, []),
    ],
  );

  // Initial neutral avatar
  updatePatientAvatar();

  // If theme toggling is added later, observe attribute changes on <html>
  const themeObserver = new MutationObserver((mutList) => {
    for (const m of mutList) {
      if (m.type === 'attributes' && m.attributeName === 'data-theme') {
        // Re-evaluate with last known sex (stored in dataset or fallback)
        updatePatientAvatar(avatarEl.dataset.sex || 'neutral');
      }
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true });

  /* eslint-disable-next-line complexity */
  function updatePatientHeader() {
    try {
      const displayName =
        // Explicit patientName fields first
        c.patientName ||
        c.name ||
        // Meta-provided patient label or meta.title (older cases store title only in meta)
        (c.meta && (c.meta.patientName || c.meta.title)) ||
        // Snapshot-provided patient name (published case snapshots)
        (c.snapshot && (c.snapshot.patientName || c.snapshot.name)) ||
        // Alternate case title keys
        c.caseTitle ||
        c.title ||
        // Final fallback
        'Untitled Case';
      const dob = c.patientDOB || c.dob || (c.snapshot && c.snapshot.dob) || '';
      const age = computeAgeFromDobLocal(dob) || c.patientAge || c.age || '';
      let sex = c.patientGender || c.sex || (c.snapshot && c.snapshot.sex) || '';
      updatePatientAvatar(sex);
      // Format MM-DD-YYYY
      let dobFmt = '';
      if (dob) {
        const d = parseLocalDateYMD(dob);
        if (d) {
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const yyyy = d.getFullYear();
          dobFmt = `${mm}-${dd}-${yyyy}`;
        }
      }
      // Line 1: Title (Sex) where Sex is non-bold
      // Prefer human-friendly label for unspecified
      if (String(sex).toLowerCase() === 'unspecified') sex = 'Prefer not to say';
      const sexDisplay = sex
        ? String(sex).slice(0, 1).toUpperCase() + String(sex).slice(1).toLowerCase()
        : '';
      patientHeaderNameEl.replaceChildren();
      patientHeaderNameEl.append(
        el('span', { style: 'font-weight:700' }, displayName),
        ...(sexDisplay
          ? [
              el(
                'span',
                { style: 'font-weight:400; color: var(--text-secondary); margin-left:6px;' },
                `(${sexDisplay})`,
              ),
            ]
          : []),
      );
      // Line 2: MM-DD-YYYY (xx years old) with date bold
      const dateText = dobFmt || dob || 'N/A';
      patientHeaderDemoEl.replaceChildren();
      patientHeaderDemoEl.append(
        el('span', { style: 'font-weight:700; color: var(--text);' }, dateText),
        ...(age ? [el('span', { style: 'font-weight:400' }, ` (${age} years old)`)] : []),
      );
      // Expose measured height to CSS as a variable so sticky offsets and anchors account for it
      const h = patientHeader.offsetHeight || 0;
      document.documentElement.style.setProperty('--patient-sticky-h', `${h}px`);
    } catch {}
  }
  // Recompute on resize in case wrapping changes height
  window.addEventListener(
    'resize',
    () => {
      const h = patientHeader.offsetHeight || 0;
      document.documentElement.style.setProperty('--patient-sticky-h', `${h}px`);
    },
    { passive: true },
  );

  // Create main content container with sidebar offset + header
  const contentRoot = el('div', { id: 'section', class: 'section-content' });
  const mainContainer = el('div', { class: 'main-content-with-sidebar' }, [
    patientHeader,
    contentRoot,
  ]);

  // Render all sections once to form a single scrolling page
  const sectionRoots = {};
  const sectionHeaders = {}; // anchored dividers used for section scroll/active detection
  function renderAllSections() {
    contentRoot.replaceChildren();

    // Subjective
    const subjHeader = el('div', { id: 'section-subjective', class: 'editor-section-divider' }, [
      el('h3', { class: 'section-title' }, 'Subjective'),
    ]);
    sectionHeaders.subjective = subjHeader;
    const subjWrap = el('div', { class: 'editor-section', id: 'wrap-subjective' }, [subjHeader]);
    const subj = createSubjectiveSection(draft.subjective, (data) => {
      draft.subjective = data;
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    });
    // Ensure expected class is present for sidebar extraction
    subj.classList.add('subjective-section');
    subjWrap.append(subj);
    sectionRoots.subjective = subjWrap;
    contentRoot.append(subjWrap);

    // Objective
    const objHeader = el('div', { id: 'section-objective', class: 'editor-section-divider' }, [
      el('h3', { class: 'section-title' }, 'Objective'),
    ]);
    sectionHeaders.objective = objHeader;
    const objWrap = el('div', { class: 'editor-section', id: 'wrap-objective' }, [objHeader]);
    const obj = createObjectiveSection(draft.objective, (data) => {
      draft.objective = data;
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    });
    obj.classList.add('objective-section');
    objWrap.append(obj);
    sectionRoots.objective = objWrap;
    contentRoot.append(objWrap);

    // Assessment
    const assessHeader = el('div', { id: 'section-assessment', class: 'editor-section-divider' }, [
      el('h3', { class: 'section-title' }, 'Assessment'),
    ]);
    sectionHeaders.assessment = assessHeader;
    const assessWrap = el('div', { class: 'editor-section', id: 'wrap-assessment' }, [
      assessHeader,
    ]);
    const assess = createAssessmentSection(draft.assessment, (data) => {
      draft.assessment = data;
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    });
    assess.classList.add('assessment-section');
    assessWrap.append(assess);
    sectionRoots.assessment = assessWrap;
    contentRoot.append(assessWrap);

    // Plan
    const planHeader = el('div', { id: 'section-plan', class: 'editor-section-divider' }, [
      el('h3', { class: 'section-title' }, 'Plan'),
    ]);
    sectionHeaders.plan = planHeader;
    const planWrap = el('div', { class: 'editor-section', id: 'wrap-plan' }, [planHeader]);
    const plan = createPlanSection(draft.plan, (data) => {
      draft.plan = data;
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    });
    plan.classList.add('plan-section');
    planWrap.append(plan);
    sectionRoots.plan = planWrap;
    contentRoot.append(planWrap);

    // Billing
    const billHeader = el('div', { id: 'section-billing', class: 'editor-section-divider' }, [
      el('h3', { class: 'section-title' }, 'Billing'),
    ]);
    sectionHeaders.billing = billHeader;
    const billWrap = el('div', { class: 'editor-section', id: 'wrap-billing' }, [billHeader]);
    const bill = createBillingSection(draft.billing, (data) => {
      draft.billing = data;
      save();
      if (window.refreshChartProgress) window.refreshChartProgress();
    });
    bill.classList.add('billing-section');
    billWrap.append(bill);
    sectionRoots.billing = billWrap;
    contentRoot.append(billWrap);
  }

  // Centralized initial scroll handler to apply percent-first, then anchor fallback
  function getSectionRoot(id) {
    return sectionRoots[id] || null;
  }
  function getSectionHeader(id) {
    return sectionHeaders[id] || null;
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

  /* eslint-disable-next-line complexity */
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

    // Prefer landing on the designated subsection heading for each section
    const header = getSectionHeader(s);
    const root = getSectionRoot(s) || header;
    if (root) {
      const preferredAnchorBySection = {
        subjective: 'hpi',
        objective: 'general-observations',
        assessment: 'primary-impairments',
        plan: 'goal-setting',
        billing: 'diagnosis-codes',
      };
      const targetId = preferredAnchorBySection[s];
      let scrolled = false;
      const trySmoothExact = (id) => {
        if (!id) return false;
        const ok = scrollToAnchorExact(id, 'smooth');
        return ok;
      };
      try {
        // Attempt smooth exact-offset scroll to preferred anchor with layout-aware retries
        scrolled = trySmoothExact(targetId);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!scrolled) scrolled = trySmoothExact(targetId);
          });
        });
        setTimeout(() => {
          if (!scrolled) scrolled = trySmoothExact(targetId);
          if (!scrolled) {
            // Fallback: first visible anchor in the section
            const firstAnchor = Array.from(root.querySelectorAll('.section-anchor')).find(
              (a) => a.offsetParent !== null,
            );
            if (firstAnchor) {
              scrollToAnchorExact(firstAnchor.id, 'smooth');
              scrolled = true;
            }
          }
          if (!scrolled) {
            const offset = getHeaderOffsetPx();
            const rect = root.getBoundingClientRect();
            const y = Math.max(0, window.scrollY + rect.top - offset);
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 140);
      } catch {
        const offset = getHeaderOffsetPx();
        const rect = root.getBoundingClientRect();
        const y = Math.max(0, window.scrollY + rect.top - offset);
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      // Announce section change and move focus for SR users
      try {
        const focusTarget = header || root;
        focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({ preventScroll: true });
      } catch {}
      try {
        const announcer = document.getElementById('route-announcer');
        if (announcer) announcer.textContent = `Moved to ${s} section`;
      } catch {}
      performInitialScrollIfNeeded(s);
    }
  }

  // Initialize the editor with sidebar navigation only
  app.append(chartNav, mainContainer);
  // Initialize header immediately so CSS var is ready before sections mount
  updatePatientHeader();
  renderPatientHeaderActions();
  renderAllSections();
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

  // Observe scroll to update active section and sidebar
  /* eslint-disable-next-line complexity */
  function determineActiveByScroll() {
    const offset = getHeaderOffsetPx();
    const entries = Object.entries(sectionHeaders);
    let current = entries[0]?.[0] || 'subjective';
    for (const [id, elHeader] of entries) {
      const top = elHeader.getBoundingClientRect().top;
      if (top - offset <= 8) current = id;
      else break;
    }
    if (current !== active) {
      active = current;
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
          updatePatientHeader();
          save();
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
// removed unused createCaseMetadataPanel
