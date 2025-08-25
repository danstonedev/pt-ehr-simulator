// ChartNavigation.js - Professional EMR-style navigation with progress tracking
import { el } from '../../ui/utils.js';
import { exportToWord } from '../../services/document-export.js';

/**
 * Creates SVG elements with proper namespace
 * @param {string} tag - SVG tag name
 * @param {Object} attrs - Attributes object
 * @param {Array} children - Child elements
 * @returns {SVGElement} SVG element
 */
// Helper kept for future SVG UI; suppress unused until needed
// eslint-disable-next-line no-unused-vars
function createSVGElement(tag, attrs = {}, children = []) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);

  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  if (!Array.isArray(children)) children = [children];
  children.forEach((child) => {
    if (child instanceof Node) {
      element.appendChild(child);
    }
  });

  return element;
}

/**
 * Creates a mini progress ring for a section
 * @param {number} percentage - Progress percentage (0-100)
 * @param {number} size - Ring size in pixels
 * @param {string} color - Ring color
 * @returns {HTMLElement} SVG progress ring
 */
// removed unused createProgressRing

/**
 * Creates a subsection status indicator
 * @param {string} status - 'complete', 'partial', or 'empty'
 * @returns {HTMLElement} Status indicator
 */
function createSubsectionIndicator(status) {
  switch (status) {
    case 'complete':
      return el(
        'span',
        {
          style: 'color: var(--und-green); font-size: 14px; font-weight: bold; margin-right: 6px;',
        },
        '✓',
      );

    case 'partial':
      return el('div', {
        style: `
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: linear-gradient(90deg, var(--und-orange) 50%, var(--border) 50%);
          margin-right: 6px;
          flex-shrink: 0;
        `,
      });

    default: // 'empty'
      return el('div', {
        style: `
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--bg);
          margin-right: 6px;
          flex-shrink: 0;
        `,
      });
  }
}

/**
 * Calculates progress percentage for a section based on completed fields
 * @param {Object} sectionData - Section data object
 * @param {string} sectionType - Type of section (subjective, objective, etc.)
 * @returns {number} Progress percentage (0-100)
 */
// removed unused calculateSectionProgress

/**
 * Determines subsection completion status with stricter validation
 * @param {any} subsectionData - Data for the subsection
 * @param {string} subsectionType - Type of subsection
 * @param {Object} fullSectionData - Full section data for context
 * @returns {string} Status: 'complete', 'partial', or 'empty'
 */
function getSubsectionStatus(subsectionData, subsectionType, fullSectionData = {}) {
  if (!subsectionData) return 'empty';

  // Define required fields for each subsection type
  const subsectionRequirements = {
    // Subjective subsections
    hpi: (data, section) => {
      const chiefComplaint = section?.chiefComplaint;
      const hpi = section?.historyOfPresentIllness || data;
      // Require both chief concern and HPI content for completion
      return isFieldComplete(chiefComplaint) && isFieldComplete(hpi);
    },
    /* eslint-disable-next-line complexity */
    'pain-assessment': (data, section) => {
      const painData =
        section &&
        (section.painLocation ||
          section.painScale ||
          section.painQuality ||
          section.painPattern ||
          section.aggravatingFactors ||
          section.easingFactors)
          ? section
          : data;
      if (typeof painData !== 'object' || Array.isArray(painData)) return false;

      // Require all six inputs to mark complete
      const painLocation = painData.painLocation || painData.location;
      const painScale = painData.painScale || painData.scale;
      const painQuality = painData.painQuality || painData.quality;
      const painPattern = painData.painPattern || painData.pattern;
      const aggravatingFactors = painData.aggravatingFactors;
      const easingFactors = painData.easingFactors;

      return (
        isFieldComplete(painLocation) &&
        isFieldComplete(painScale) &&
        isFieldComplete(painQuality) &&
        isFieldComplete(painPattern) &&
        isFieldComplete(aggravatingFactors) &&
        isFieldComplete(easingFactors)
      );
    },
    'functional-status': (data, section) => {
      // Require all three fields in Functional Status subsection to be complete
      const functionalLimitations = section?.functionalLimitations;
      const priorLevel = section?.priorLevel;
      const patientGoals = section?.patientGoals;
      return (
        isFieldComplete(functionalLimitations) &&
        isFieldComplete(priorLevel) &&
        isFieldComplete(patientGoals)
      );
    },
    'additional-history': (data, section) => {
      // Require all three fields in Additional History subsection to be complete
      const medications = section?.medicationsCurrent;
      const redFlags = section?.redFlags;
      const additionalHistory = section?.additionalHistory;
      return (
        isFieldComplete(medications) &&
        isFieldComplete(redFlags) &&
        isFieldComplete(additionalHistory)
      );
    },

    // Objective subsections
    'regional-assessment': (data, section) => {
      const ra = section?.regionalAssessments || data?.regionalAssessments || data;
      if (!ra || typeof ra !== 'object') return false;
      // Tables store values as nested objects; count content if any non-empty value exists
      const hasRom = ra.rom && isFieldComplete(ra.rom);
      const hasMmt = ra.mmt && isFieldComplete(ra.mmt);
      const hasTests = ra.specialTests && isFieldComplete(ra.specialTests);
      // Mark complete if any of the three sub-areas has entries
      return Boolean(hasRom || hasMmt || hasTests);
    },
    inspection: (data, section) => {
      const inspection = section?.inspection?.visual || data;
      return isFieldComplete(inspection);
    },
    palpation: (data, section) => {
      const palpation = section?.palpation?.findings || data;
      return isFieldComplete(palpation);
    },
    neuro: (data, section) => {
      const neuro = section?.neuro?.screening || data;
      return isFieldComplete(neuro);
    },
    functional: (data, section) => {
      const functional = section?.functional?.assessment || data;
      return isFieldComplete(functional);
    },

    // Assessment subsections
    'primary-impairments': (data, section) => isFieldComplete(section?.primaryImpairments || data),
    'icf-classification': (data, section) => {
      const s = section || {};
      return (
        isFieldComplete(s.bodyFunctions) &&
        isFieldComplete(s.activityLimitations) &&
        isFieldComplete(s.participationRestrictions)
      );
    },
    'pt-diagnosis': (data, section) => isFieldComplete(section?.ptDiagnosis || data),
    'clinical-reasoning': (data, section) => isFieldComplete(section?.clinicalReasoning || data),

    // Plan subsections
    'treatment-plan': (data, section) =>
      isFieldComplete(section?.treatmentPlan || data?.treatmentPlan) &&
      isFieldComplete(section?.patientEducation || data?.patientEducation),
    'in-clinic-treatment-plan': (data, section) => {
      const hasRows = isFieldComplete(section?.exerciseTable || data?.exerciseTable);
      const hasFreq = isFieldComplete(section?.frequency || data?.frequency);
      const hasDur = isFieldComplete(section?.duration || data?.duration);
      // consider complete when at least one row plus schedule are provided
      return hasRows && hasFreq && hasDur;
    },
    'goal-setting': (data, section) => {
      // Consider complete when at least one goal entry exists
      const table = section?.goalsTable || data?.goalsTable;
      return isFieldComplete(table);
    },

    // Billing subsections
    'diagnosis-codes': (data, section) => {
      const arr = section?.diagnosisCodes || section?.icdCodes || data;
      if (!Array.isArray(arr) || arr.length === 0) return false;
      return arr.every((code) => isFieldComplete(code.code));
    },
    'cpt-codes': (data, section) => {
      const arr = section?.billingCodes || section?.cptCodes || data;
      if (!Array.isArray(arr) || arr.length === 0) return false;
      // Require all visible inputs per CPT row: code, units (>0), and timeSpent (non-empty)
      return arr.every((item) => {
        const hasCode = isFieldComplete(item.code);
        const units = parseInt(item.units, 10);
        const hasValidUnits = !isNaN(units) && units > 0;
        const hasTime = isFieldComplete(item.timeSpent);
        return hasCode && hasValidUnits && hasTime;
      });
    },
    'orders-referrals': (data, section) => {
      const arr = section?.ordersReferrals || data;
      if (!Array.isArray(arr) || arr.length === 0) return false;
      // Require both Type and Details for each row
      return arr.every((item) => isFieldComplete(item.type) && isFieldComplete(item.details));
    },
    'billing-notes': (data, section) => {
      const notes = section?.skilledJustification || section?.treatmentNotes || data;
      return isFieldComplete(notes);
    },
  };

  // Helper function to check if a field is complete
  function isFieldComplete(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (Array.isArray(value))
      return value.length > 0 && value.some((item) => isFieldComplete(item));
    if (typeof value === 'object') {
      return Object.values(value).some((val) => isFieldComplete(val));
    }
    return Boolean(value);
  }

  // Check if we have a specific requirement for this subsection type
  const requirement = subsectionRequirements[subsectionType];
  if (requirement) {
    const isComplete = requirement(subsectionData, fullSectionData);
    return isComplete ? 'complete' : hasAnyContent(subsectionData) ? 'partial' : 'empty';
  }

  // Fallback to generic checking for unknown subsection types
  return genericSubsectionCheck(subsectionData);
}

/**
 * Helper function to check if there's any content in the subsection
 */
function hasAnyContent(subsectionData) {
  // Check if there's any non-empty content
  function hasContent(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return false; // booleans (e.g., flags) don’t count as content
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (Array.isArray(value)) return value.some((item) => hasContent(item));
    if (typeof value === 'object') {
      return Object.values(value).some((val) => hasContent(val));
    }
    return Boolean(value);
  }

  return hasContent(subsectionData);
}

/**
 * Generic subsection checking for unknown types
 */
function genericSubsectionCheck(subsectionData) {
  if (Array.isArray(subsectionData)) {
    const completedItems = subsectionData.filter((item) => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object') {
        return Object.values(item).some((value) => value && value.toString().trim());
      }
      return false;
    });

    if (completedItems.length === 0) return 'empty';
    if (completedItems.length === subsectionData.length) return 'complete';
    return 'partial';
  }

  if (typeof subsectionData === 'string') {
    return subsectionData.trim() ? 'complete' : 'empty';
  }

  if (typeof subsectionData === 'object') {
    const values = Object.values(subsectionData);
    const completedValues = values.filter((value) => value && value.toString().trim());

    if (completedValues.length === 0) return 'empty';
    if (completedValues.length === values.length) return 'complete';
    return 'partial';
  }

  return 'empty';
}

// Compute age from a YYYY-MM-DD date string
function computeAgeFromDob(dobStr) {
  if (!dobStr) return '';
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 && age < 200 ? String(age) : '';
}

// Collapse/expand subsection content while keeping the banner visible
function setSubsectionCollapsed(anchorEl, collapsed) {
  if (!anchorEl) return;
  const header = anchorEl.querySelector('h4.subsection-title');
  const children = Array.from(anchorEl.children || []);
  children.forEach((child) => {
    if (child !== header) {
      child.style.display = collapsed ? 'none' : '';
    }
  });
  if (header) header.style.opacity = collapsed ? '0.85' : '1';
}

// Attach right-aligned toggles to subsection banners and enforce visibility rules
function applySubsectionVisibilityControls({
  activeSection,
  isFacultyMode,
  caseData,
  onEditorSettingsChange,
}) {
  try {
    const sectionRoot = document.querySelector(`.${activeSection}-section`);
    if (!sectionRoot) return;
    const anchors = Array.from(sectionRoot.querySelectorAll('.section-anchor'));
    const visAll = caseData?.editorSettings?.visibility || {};
    const secVis = visAll[activeSection] || {};

    anchors.forEach((anchorEl) => {
      const subId = anchorEl.id;
      const visible = secVis[subId] !== false; // default true
      const header = anchorEl.querySelector('h4.subsection-title');
      if (!header) return;

      if (isFacultyMode) {
        // Flex the header to place toggle at right
        if (!header.dataset.flexified) {
          header.style.display = 'flex';
          header.style.alignItems = 'center';
          header.style.justifyContent = 'space-between';
          header.dataset.flexified = 'true';
        }
        let toggleWrap = header.querySelector('.subsection-visibility-toggle');
        if (!toggleWrap) {
          toggleWrap = el(
            'label',
            {
              class: 'subsection-visibility-toggle und-toggle',
              style:
                'margin-left:auto; display:flex; align-items:center; gap:10px; font-weight:500; font-size:12px; color: var(--text-secondary); position: relative;',
            },
            [
              el('span', { class: 'toggle-text', style: 'user-select:none;' }, 'OFF'),
              // Accessible checkbox drives the visual switch via sibling selectors
              el('input', {
                type: 'checkbox',
                class: 'und-toggle-input',
                'aria-label': 'Show subsection',
                'aria-checked': 'false',
                style: 'position:absolute; opacity:0; width:0; height:0;',
              }),
              el('span', { class: 'und-toggle-track', 'aria-hidden': 'true' }, [
                el('span', { class: 'und-toggle-thumb' }),
              ]),
            ],
          );
          header.appendChild(toggleWrap);
        }
        const checkbox = toggleWrap.querySelector('input[type="checkbox"]');
        const textEl = toggleWrap.querySelector('.toggle-text');
        checkbox.checked = !!visible;
        checkbox.setAttribute('aria-checked', checkbox.checked ? 'true' : 'false');
        if (textEl) textEl.textContent = checkbox.checked ? 'ON' : 'OFF';
        checkbox.onchange = (e) => {
          const next = JSON.parse(JSON.stringify(caseData.editorSettings || { visibility: {} }));
          if (!next.visibility[activeSection]) next.visibility[activeSection] = {};
          next.visibility[activeSection][subId] = e.target.checked;
          setSubsectionCollapsed(anchorEl, !e.target.checked);
          onEditorSettingsChange?.(next);
          checkbox.setAttribute('aria-checked', e.target.checked ? 'true' : 'false');
          if (textEl) textEl.textContent = e.target.checked ? 'ON' : 'OFF';
        };
        // In faculty view, keep banner; collapse content if off
        setSubsectionCollapsed(anchorEl, !visible);
        anchorEl.style.display = '';
      } else {
        // Student view: hide entire subsection if off
        anchorEl.style.display = visible ? '' : 'none';
      }
    });
  } catch (e) {
    console.warn('applySubsectionVisibilityControls error:', e);
  }
}

/**
 * Creates an editable case header for faculty mode
 * @param {Object} caseInfo - Case information object
 * @param {Function} onUpdate - Callback when case info is updated
 * @returns {HTMLElement} Editable case header
 */
/* istanbul ignore next */
/* eslint-disable no-unused-vars, complexity */
function createEditableCaseHeader(caseInfo, onUpdate, options = {}) {
  const preferEditOnClick = !!options.preferEditOnClick;
  const showEditButton = !!options.forceShowEditButton;
  const showPencil = !!options.showPencil; // default off
  // removed unused local state from earlier iterations

  const toggleButton = el(
    'button',
    {
      style: `
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 4px;
      margin-left: 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
    `,
      title: 'Edit Case Details',
      type: 'button',
      onClick: (e) => {
        e.stopPropagation();
        openEditCaseModal({ ...caseInfo }, (updated) => {
          Object.assign(caseInfo, updated);
          titleDisplay.querySelector('h3').textContent = caseInfo.title || 'Untitled Case';
          const dobDisp = basicInfo.querySelector('#case-dob-display');
          if (dobDisp) dobDisp.textContent = caseInfo.dob || 'N/A';
          updateBasicInfo();
          onUpdate?.(caseInfo);
        });
      },
      onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          openEditCaseModal({ ...caseInfo }, (updated) => {
            Object.assign(caseInfo, updated);
            titleDisplay.querySelector('h3').textContent = caseInfo.title || 'Untitled Case';
            const dobDisp = basicInfo.querySelector('#case-dob-display');
            if (dobDisp) dobDisp.textContent = caseInfo.dob || 'N/A';
            updateBasicInfo();
            onUpdate?.(caseInfo);
          });
        }
      },
    },
    ['✎'],
  );

  const titleDisplay = el('div', { class: 'case-title' }, [
    el('h3', { class: 'case-title-text' }, caseInfo.title || 'Untitled Case'),
    ...(showPencil ? [toggleButton] : []),
    ...(showEditButton
      ? [
          el(
            'button',
            {
              class: 'btn secondary',
              style: 'margin-left: 8px; padding:4px 8px; font-size:12px;',
              onclick: (e) => {
                e.stopPropagation();
                openEditCaseModal({ ...caseInfo }, (updated) => {
                  Object.assign(caseInfo, updated);
                  updateBasicInfo();
                  onUpdate?.(caseInfo);
                });
              },
            },
            'Edit',
          ),
        ]
      : []),
  ]);

  // Value spans for easy updates
  const settingValue = el('span', { class: 'value' }, caseInfo.setting || 'N/A');
  // Prefer displaying age computed from DOB when available for ongoing accuracy
  const ageValue = el(
    'span',
    { class: 'value' },
    computeAgeFromDob(caseInfo.dob) || caseInfo.age || 'N/A',
  );
  const sexValue = el('span', { class: 'value' }, caseInfo.sex || 'N/A');
  const acuityValue = el('span', { class: 'value' }, caseInfo.acuity || 'N/A');

  const basicInfo = el('div', { class: 'case-info-grid' }, [
    // Order: DOB, Age, Sex, Setting, Acuity (Title is above already)
    el('div', { class: 'case-info-row' }, [
      el('span', { class: 'label' }, 'DOB:'),
      el('span', { class: 'value', id: 'case-dob-display' }, caseInfo.dob || 'N/A'),
    ]),
    el('div', { class: 'case-info-row' }, [el('span', { class: 'label' }, 'Age:'), ageValue]),
    el('div', { class: 'case-info-row' }, [el('span', { class: 'label' }, 'Sex:'), sexValue]),
    el('div', { class: 'case-info-row' }, [
      el('span', { class: 'label' }, 'Setting:'),
      settingValue,
    ]),
    el('div', { class: 'case-info-row' }, [el('span', { class: 'label' }, 'Acuity:'), acuityValue]),
  ]);

  function updateBasicInfo() {
    settingValue.textContent = caseInfo.setting || 'N/A';
    ageValue.textContent = computeAgeFromDob(caseInfo.dob) || caseInfo.age || 'N/A';
    sexValue.textContent = caseInfo.sex || 'N/A';
    acuityValue.textContent = caseInfo.acuity || 'N/A';
    const dobDisp = basicInfo.querySelector('#case-dob-display');
    if (dobDisp) dobDisp.textContent = caseInfo.dob || 'N/A';
  }

  // removed unused updateToggleDisplay

  const card = el(
    'div',
    {
      class: 'case-info-card',
      role: 'button',
      tabIndex: 0,
      title: preferEditOnClick ? 'Edit case details' : 'View full case details',
    },
    [titleDisplay, basicInfo],
  );
  const openTarget = preferEditOnClick
    ? () =>
        openEditCaseModal(caseInfo, (updated) => {
          Object.assign(caseInfo, updated);
          updateBasicInfo();
          onUpdate?.(caseInfo);
        })
    : () => openCaseDetailsModal(caseInfo);
  card.addEventListener('click', openTarget);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openTarget();
    }
  });
  return card;
}

/**
 * Creates a read-only case header for student mode
 * @param {Object} caseInfo - Case information object
 * @returns {HTMLElement} Read-only case header
 */
/* istanbul ignore next */
/* eslint-disable no-unused-vars */
function createReadOnlyCaseHeader(caseInfo) {
  const card = el(
    'div',
    { class: 'case-info-card', role: 'button', tabIndex: 0, title: 'View full case details' },
    [
      el('div', { class: 'case-title' }, [
        el('h3', { class: 'case-title-text' }, caseInfo.title || 'Untitled Case'),
      ]),
      el('div', { class: 'case-info-grid' }, [
        // Order: DOB, Age, Sex, Setting, Acuity
        el('div', { class: 'case-info-row' }, [
          el('span', { class: 'label' }, 'DOB:'),
          el('span', { class: 'value' }, caseInfo.dob || 'N/A'),
        ]),
        el('div', { class: 'case-info-row' }, [
          el('span', { class: 'label' }, 'Age:'),
          el('span', { class: 'value' }, computeAgeFromDob(caseInfo.dob) || caseInfo.age || 'N/A'),
        ]),
        el('div', { class: 'case-info-row' }, [
          el('span', { class: 'label' }, 'Sex:'),
          el('span', { class: 'value' }, caseInfo.sex || 'N/A'),
        ]),
        el('div', { class: 'case-info-row' }, [
          el('span', { class: 'label' }, 'Setting:'),
          el('span', { class: 'value' }, caseInfo.setting || 'N/A'),
        ]),
        el('div', { class: 'case-info-row' }, [
          el('span', { class: 'label' }, 'Acuity:'),
          el('span', { class: 'value' }, caseInfo.acuity || 'N/A'),
        ]),
      ]),
    ],
  );
  card.addEventListener('click', () => openCaseDetailsModal(caseInfo));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCaseDetailsModal(caseInfo);
    }
  });
  return card;
}

// Simple Case Details Modal
function openCaseDetailsModal(caseInfo) {
  const overlay = el('div', { class: 'goal-linker-modal', role: 'dialog', 'aria-modal': 'true' });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  const content = el('div', { class: 'goal-linker-content case-details-modal' }, [
    el('div', { class: 'goal-linker-header' }, [
      el('h3', {}, 'Case Details'),
      el(
        'button',
        { class: 'close-btn', onclick: () => overlay.remove(), 'aria-label': 'Close' },
        '✕',
      ),
    ]),
    el('div', { class: 'goal-selection-list case-details-body' }, [
      // Top summary row: Title, DOB (with computed age), Sex
      (() => {
        const age = computeAgeFromDob(caseInfo.dob) || caseInfo.age || '';
        return el(
          'div',
          {
            class: 'case-details-summary',
            style:
              'display:flex; gap:12px; flex-wrap:wrap; align-items:flex-start; margin-bottom: 12px;',
          },
          [
            el('div', { style: 'flex:1 1 280px; min-width:240px;' }, [
              el('div', { class: 'label', style: 'margin-bottom:4px;' }, 'Title'),
              el(
                'div',
                { class: 'value', style: 'font-weight:600;' },
                caseInfo.title || 'Untitled Case',
              ),
            ]),
            el('div', { style: 'flex:1 1 180px; min-width:180px;' }, [
              el('div', { class: 'label', style: 'margin-bottom:4px;' }, 'DOB (years)'),
              el('div', { class: 'value' }, `${caseInfo.dob || 'N/A'}${age ? ` (${age}y)` : ''}`),
            ]),
            el('div', { style: 'flex:1 1 140px; min-width:140px;' }, [
              el('div', { class: 'label', style: 'margin-bottom:4px;' }, 'Sex'),
              el('div', { class: 'value' }, caseInfo.sex || 'N/A'),
            ]),
          ],
        );
      })(),
      el('div', { class: 'case-info-grid case-details-grid' }, [
        // Secondary details: Setting, Acuity
        el('div', { class: 'case-info-row' }, [
          el('span', { class: 'label' }, 'Setting'),
          el('span', { class: 'value' }, caseInfo.setting || 'N/A'),
        ]),
        el('div', { class: 'case-info-row' }, [
          el('span', { class: 'label' }, 'Acuity'),
          el('span', { class: 'value' }, caseInfo.acuity || 'N/A'),
        ]),
      ]),
    ]),
    el(
      'div',
      {
        class: 'goal-linker-header',
        style:
          'justify-content: flex-end; background: var(--surface); border-top: 1px solid var(--border);',
      },
      [el('button', { class: 'btn secondary', onclick: () => overlay.remove() }, 'Close')],
    ),
  ]);
  overlay.append(content);
  document.body.append(overlay);
  // Focus for accessibility
  setTimeout(() => {
    const btn = overlay.querySelector('.close-btn');
    btn?.focus();
  }, 0);
}

// Read-only Artifact viewer modal (student and faculty view)
function openViewArtifactModal(module) {
  const overlay = el('div', { class: 'goal-linker-modal', role: 'dialog', 'aria-modal': 'true' });
  const title =
    module?.title ||
    (module?.type ? module.type[0].toUpperCase() + module.type.slice(1) : 'Artifact');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.remove();
  });
  const content = el('div', { class: 'goal-linker-content case-details-modal' }, [
    el('div', { class: 'goal-linker-header' }, [
      el('h3', {}, title),
      el(
        'button',
        { class: 'close-btn', onclick: () => overlay.remove(), 'aria-label': 'Close' },
        '✕',
      ),
    ]),
    el('div', { class: 'goal-selection-list case-details-body' }, [
      (() => {
        const t = (module?.type || '').toLowerCase();
        if (t === 'referral') {
          const d = module.data || {};
          return el(
            'div',
            {
              class: 'module-card',
              style:
                'border:1px solid var(--border); border-radius:8px; padding:12px; background: var(--surface);',
            },
            [
              el('div', { style: 'font-weight:600; margin-bottom:6px;' }, 'Referral'),
              el('div', { class: 'case-info-grid case-details-grid' }, [
                el('div', { class: 'case-info-row' }, [
                  el('span', { class: 'label' }, 'Date'),
                  el('span', { class: 'value' }, d.date || 'N/A'),
                ]),
                el('div', { class: 'case-info-row' }, [
                  el('span', { class: 'label' }, 'From'),
                  el('span', { class: 'value' }, d.source || 'N/A'),
                ]),
                el('div', { class: 'case-info-row' }, [
                  el('span', { class: 'label' }, 'Reason'),
                  el('span', { class: 'value' }, d.reason || 'N/A'),
                ]),
                d.notes
                  ? el('div', { class: 'case-info-row' }, [
                      el('span', { class: 'label' }, 'Notes'),
                      el('span', { class: 'value' }, d.notes || ''),
                    ])
                  : null,
              ]),
            ],
          );
        }
        return el(
          'pre',
          { style: 'white-space:pre-wrap; font-size:12px;' },
          JSON.stringify(module, null, 2),
        );
      })(),
    ]),
    el(
      'div',
      {
        class: 'goal-linker-header',
        style:
          'justify-content: flex-end; background: var(--surface); border-top: 1px solid var(--border);',
      },
      [el('button', { class: 'btn secondary', onclick: () => overlay.remove() }, 'Close')],
    ),
  ]);
  overlay.append(content);
  document.body.append(overlay);
  setTimeout(() => overlay.querySelector('.close-btn')?.focus(), 0);
}

// Add Artifact modal (faculty): collects title, type, and type-specific fields
function openAddArtifactModal(onAdd) {
  const overlay = el('div', { class: 'goal-linker-modal', role: 'dialog', 'aria-modal': 'true' });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.remove();
  });
  let currentType = 'referral';
  const titleInput = el('input', {
    type: 'text',
    class: 'instructor-form-input',
    placeholder: 'Artifact title (e.g., Referral to PT)',
    value: '',
  });

  // Referral fields
  const ref = { date: '', source: '', reason: '', notes: '' };
  const refForm = el('div', { style: 'display:grid; gap:10px; margin-top: 8px;' }, [
    el('div', {}, [
      el('label', { class: 'instructor-form-label' }, 'Date'),
      el('input', {
        type: 'date',
        class: 'instructor-form-input',
        oninput: (e) => (ref.date = e.target.value),
      }),
    ]),
    el('div', {}, [
      el('label', { class: 'instructor-form-label' }, 'From (provider/department)'),
      el('input', {
        type: 'text',
        class: 'instructor-form-input',
        oninput: (e) => (ref.source = e.target.value),
      }),
    ]),
    el('div', {}, [
      el('label', { class: 'instructor-form-label' }, 'Reason'),
      el('input', {
        type: 'text',
        class: 'instructor-form-input',
        oninput: (e) => (ref.reason = e.target.value),
      }),
    ]),
    el('div', {}, [
      el('label', { class: 'instructor-form-label' }, 'Notes'),
      el('textarea', {
        class: 'instructor-form-input',
        style: 'min-height:68px;',
        oninput: (e) => (ref.notes = e.target.value),
      }),
    ]),
  ]);

  const content = el('div', { class: 'goal-linker-content case-details-modal' }, [
    el('div', { class: 'goal-linker-header' }, [
      el('h3', {}, 'Add Case Artifact'),
      el(
        'button',
        { class: 'close-btn', onclick: () => overlay.remove(), 'aria-label': 'Close' },
        '✕',
      ),
    ]),
    el('div', { class: 'goal-selection-list case-details-body' }, [
      el('div', { class: 'instructor-form-field' }, [
        el('label', { class: 'instructor-form-label' }, 'Title *'),
        titleInput,
      ]),
      el('div', { class: 'instructor-form-field' }, [
        el('label', { class: 'instructor-form-label' }, 'Type *'),
        el(
          'select',
          { class: 'instructor-form-input', onchange: (e) => (currentType = e.target.value) },
          [
            el('option', { value: 'referral', selected: '' }, 'Referral'),
            // Future: imaging, labs, meds, vitals, prior-notes
          ],
        ),
      ]),
      refForm,
    ]),
    el(
      'div',
      {
        class: 'goal-linker-header',
        style:
          'justify-content: flex-end; background: var(--surface); border-top: 1px solid var(--border);',
      },
      [
        el('button', { class: 'btn secondary', onclick: () => overlay.remove() }, 'Cancel'),
        el(
          'button',
          {
            class: 'btn primary',
            onclick: () => {
              const title = (titleInput.value || '').trim();
              if (!title) {
                alert('Please enter a title for this artifact.');
                titleInput.focus();
                return;
              }
              const id = `${currentType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
              const mod = { id, type: currentType, title, data: {} };
              if (currentType === 'referral') mod.data = { ...ref };
              onAdd?.(mod);
              overlay.remove();
            },
          },
          'Add Artifact',
        ),
      ],
    ),
  ]);
  overlay.append(content);
  document.body.append(overlay);
  setTimeout(() => titleInput?.focus(), 0);
}

// Edit Case Details Modal (faculty): mirrors Create New Case layout
export function openEditCaseModal(caseInfo, onSave) {
  // Clone modules array for local editing
  const modulesLocal = Array.isArray(caseInfo.modules)
    ? JSON.parse(JSON.stringify(caseInfo.modules))
    : [];
  const modal = el(
    'div',
    {
      style: `
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-start; justify-content: center; z-index: var(--z-modal);
  overflow-y: auto; padding: 24px 12px;
    `,
      onclick: (e) => {
        if (e.target === modal) document.body.removeChild(modal);
      },
    },
    [
      el(
        'div',
        {
          style: `
  background: var(--bg); color: var(--text); padding: 32px; border-radius: 12px; max-width: 560px; width: 95%;
  max-height: calc(100vh - 48px); overflow: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
      `,
          onclick: (e) => e.stopPropagation(),
        },
        [
          el('h2', { class: 'instructor-title' }, 'Edit Case Details'),
          el('form', { id: 'edit-case-form', onsubmit: handleSubmit }, [
            // Title
            el('div', { class: 'instructor-form-field' }, [
              el('label', { class: 'instructor-form-label' }, 'Case Title *'),
              el('input', {
                type: 'text',
                id: 'edit-title',
                required: true,
                class: 'instructor-form-input',
                value: caseInfo.title || '',
              }),
            ]),
            // Age + DOB (single row)
            el('div', { style: 'display: flex; gap: 16px; margin-bottom: 16px;' }, [
              // Age (left)
              el('div', { style: 'flex: 1;' }, [
                el(
                  'label',
                  {
                    style:
                      'display: block; margin-bottom: 8px; font-weight: 500; color: var(--text);',
                  },
                  'Age',
                ),
                el('input', {
                  type: 'number',
                  id: 'edit-age',
                  min: 0,
                  max: 120,
                  style:
                    'width:100%; padding:12px; border:1px solid var(--input-border); border-radius:6px; font-size:14px; box-sizing:border-box;',
                  value: caseInfo.age || '',
                  oninput: (e) => {
                    const dobEl = document.getElementById('edit-dob');
                    if (!dobEl) return;
                    // Only set/overwrite DOB if empty or previously auto-filled from age
                    if (dobEl.value && dobEl.dataset.autofilled !== 'age') return;
                    const v = parseInt(e.target.value, 10);
                    if (isNaN(v) || v <= 0 || v > 120) return;
                    const today = new Date();
                    const y = today.getFullYear() - v;
                    const m = today.getMonth();
                    const lastDay = new Date(y, m + 1, 0).getDate();
                    const d = Math.min(today.getDate(), lastDay);
                    const mm = String(m + 1).padStart(2, '0');
                    const dd = String(d).padStart(2, '0');
                    dobEl.value = `${y}-${mm}-${dd}`;
                    dobEl.dataset.autofilled = 'age';
                  },
                }),
              ]),
              // DOB (right)
              el('div', { style: 'flex: 1;' }, [
                el(
                  'label',
                  {
                    style:
                      'display: block; margin-bottom: 8px; font-weight: 500; color: var(--text);',
                  },
                  'DOB',
                ),
                el('input', {
                  type: 'date',
                  id: 'edit-dob',
                  value: caseInfo.dob || '',
                  style:
                    'width:100%; padding:12px; border:1px solid var(--input-border); border-radius:6px; font-size:14px; box-sizing:border-box;',
                  oninput: (e) => {
                    // If user is typing a DOB, mark as user-edited so age changes won't overwrite
                    if (e.isTrusted) delete e.target.dataset.autofilled;
                    const computed = computeAgeFromDob(e.target.value);
                    const ageEl = document.getElementById('edit-age');
                    if (computed && ageEl) ageEl.value = computed;
                  },
                }),
                el(
                  'div',
                  { style: 'margin-top: 6px; font-size: 12px; color: var(--text-secondary);' },
                  'Age auto-fills when DOB is entered.',
                ),
              ]),
            ]),
            // Sex (full width row)
            el('div', { style: 'margin-bottom: 16px;' }, [
              el(
                'label',
                {
                  style:
                    'display: block; margin-bottom: 8px; font-weight: 500; color: var(--text);',
                },
                'Sex',
              ),
              el(
                'select',
                {
                  id: 'edit-gender',
                  style:
                    'width:100%; padding:12px; border:1px solid var(--input-border); border-radius:6px; font-size:14px; box-sizing:border-box;',
                },
                [
                  el('option', { value: '' }, 'Select...'),
                  el(
                    'option',
                    { value: 'Male', selected: caseInfo.sex === 'Male' ? '' : undefined },
                    'Male',
                  ),
                  el(
                    'option',
                    { value: 'Female', selected: caseInfo.sex === 'Female' ? '' : undefined },
                    'Female',
                  ),
                  el(
                    'option',
                    { value: 'Other', selected: caseInfo.sex === 'Other' ? '' : undefined },
                    'Other',
                  ),
                  el(
                    'option',
                    {
                      value: 'Prefer not to say',
                      selected: caseInfo.sex === 'Prefer not to say' ? '' : undefined,
                    },
                    'Prefer not to say',
                  ),
                ],
              ),
            ]),
            // Setting (moved below Age/Sex)
            el('div', { class: 'instructor-form-field' }, [
              el('label', { class: 'instructor-form-label' }, 'Clinical Setting *'),
              el('select', { id: 'edit-setting', required: true, class: 'instructor-form-input' }, [
                el('option', { value: '' }, 'Select setting...'),
                el(
                  'option',
                  {
                    value: 'Outpatient',
                    selected: caseInfo.setting === 'Outpatient' ? '' : undefined,
                  },
                  'Outpatient',
                ),
                el(
                  'option',
                  {
                    value: 'Inpatient',
                    selected: caseInfo.setting === 'Inpatient' ? '' : undefined,
                  },
                  'Inpatient',
                ),
                el(
                  'option',
                  {
                    value: 'Home Health',
                    selected: caseInfo.setting === 'Home Health' ? '' : undefined,
                  },
                  'Home Health',
                ),
                el(
                  'option',
                  { value: 'SNF', selected: caseInfo.setting === 'SNF' ? '' : undefined },
                  'Skilled Nursing Facility (SNF)',
                ),
                el(
                  'option',
                  {
                    value: 'Acute Rehab',
                    selected: caseInfo.setting === 'Acute Rehab' ? '' : undefined,
                  },
                  'Acute Rehabilitation',
                ),
                el(
                  'option',
                  { value: 'Other', selected: caseInfo.setting === 'Other' ? '' : undefined },
                  'Other',
                ),
              ]),
            ]),
            // Acuity
            el('div', { style: 'margin-bottom: 24px;' }, [
              el(
                'label',
                {
                  style:
                    'display: block; margin-bottom: 8px; font-weight: 500; color: var(--text);',
                },
                'Case Acuity',
              ),
              el(
                'select',
                {
                  id: 'edit-acuity',
                  style:
                    'width:100%; padding:12px; border:1px solid var(--input-border); border-radius:6px; font-size:14px; box-sizing:border-box;',
                },
                [
                  el('option', { value: '' }, 'Select acuity...'),
                  el(
                    'option',
                    { value: 'Routine', selected: caseInfo.acuity === 'Routine' ? '' : undefined },
                    'Routine',
                  ),
                  el(
                    'option',
                    { value: 'Acute', selected: caseInfo.acuity === 'Acute' ? '' : undefined },
                    'Acute',
                  ),
                  el(
                    'option',
                    { value: 'Complex', selected: caseInfo.acuity === 'Complex' ? '' : undefined },
                    'Complex',
                  ),
                  el(
                    'option',
                    {
                      value: 'Critical',
                      selected: caseInfo.acuity === 'Critical' ? '' : undefined,
                    },
                    'Critical',
                  ),
                ],
              ),
            ]),
            // Case Artifacts moved to dedicated modal and sidebar block
            // Buttons (sticky footer area so actions remain visible)
            el(
              'div',
              {
                style:
                  'position: sticky; bottom: 0; background: var(--bg); padding-top: 12px; margin-top: 16px; border-top: 1px solid var(--border); display: flex; gap: 12px; justify-content: flex-end;',
              },
              [
                el(
                  'button',
                  {
                    type: 'button',
                    class: 'btn secondary',
                    style: 'padding: 12px 24px; font-size: 14px;',
                    onclick: () => document.body.removeChild(modal),
                  },
                  'Cancel',
                ),
                el(
                  'button',
                  {
                    type: 'submit',
                    class: 'btn primary',
                    style: 'padding: 12px 24px; font-size: 14px;',
                  },
                  'Save Changes',
                ),
              ],
            ),
          ]),
        ],
      ),
    ],
  );

  function handleSubmit(e) {
    e.preventDefault();
    const updated = {
      title: document.getElementById('edit-title').value.trim(),
      setting: document.getElementById('edit-setting').value,
      age: document.getElementById('edit-age').value,
      sex: document.getElementById('edit-gender').value,
      dob: document.getElementById('edit-dob').value,
      acuity: document.getElementById('edit-acuity').value,
      modules: modulesLocal,
    };
    // If age empty but DOB present, compute
    if ((!updated.age || updated.age === '') && updated.dob) {
      const computed = computeAgeFromDob(updated.dob);
      if (computed) updated.age = computed;
    }
    // If DOB empty but Age present, backfill a realistic DOB (today minus age years)
    if ((!updated.dob || updated.dob === '') && updated.age) {
      const v = parseInt(updated.age, 10);
      if (!isNaN(v) && v > 0 && v <= 120) {
        const today = new Date();
        const y = today.getFullYear() - v;
        const m = today.getMonth();
        const lastDay = new Date(y, m + 1, 0).getDate();
        const d = Math.min(today.getDate(), lastDay);
        const mm = String(m + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        updated.dob = `${y}-${mm}-${dd}`;
      }
    }
    document.body.removeChild(modal);
    onSave?.(updated);
  }

  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('edit-title')?.focus(), 50);
}

export function createChartNavigation(config) {
  const {
    activeSection,
    onSectionChange,
    caseData = {},
    caseInfo = {},
    isFacultyMode = false,
    onEditorSettingsChange,
  } = config;

  // Define top-level sections only; subsections will be derived from DOM anchors to keep sidebar in sync with editor content
  const sections = [
    { id: 'subjective', label: 'Subjective', icon: '◉' },
    { id: 'objective', label: 'Objective', icon: '⚬' },
    { id: 'assessment', label: 'Assessment', icon: '⬢' },
    { id: 'plan', label: 'Plan', icon: '▪' },
    { id: 'billing', label: 'Billing', icon: '⬟' },
  ];

  // Map known subsection IDs to data accessors for accurate status
  const subsectionDataResolvers = {
    // Subjective
    hpi: (section) => ({
      chiefComplaint: section?.chiefComplaint,
      historyOfPresentIllness: section?.historyOfPresentIllness,
    }),
    'pain-assessment': (section) => ({
      location: section?.painLocation,
      scale: section?.painScale,
      quality: section?.painQuality,
      pattern: section?.painPattern,
      aggravatingFactors: section?.aggravatingFactors,
      easingFactors: section?.easingFactors,
    }),
    'functional-status': (section) => ({
      functionalLimitations: section?.functionalLimitations,
      priorLevel: section?.priorLevel,
      patientGoals: section?.patientGoals,
    }),
    'additional-history': (section) => ({
      medicationsCurrent: section?.medicationsCurrent,
      redFlags: section?.redFlags,
      additionalHistory: section?.additionalHistory,
    }),
    // Objective
    'general-observations': (section) => section?.text,
    inspection: (section) => section?.inspection?.visual,
    palpation: (section) => section?.palpation?.findings,
    'regional-assessment': (section) => ({
      rom: section?.rom,
      mmt: section?.mmt,
      specialTests: section?.specialTests,
      regionalAssessments: section?.regionalAssessments,
    }),
    'neurological-screening': (section) => section?.neuro?.screening,
    'functional-movement': (section) => section?.functional?.assessment,
    'treatment-performed': (section) => section?.treatmentPerformed,
    // Assessment
    'primary-impairments': (section) => section?.primaryImpairments,
    'icf-classification': (section) => ({
      bodyFunctions: section?.bodyFunctions,
      activityLimitations: section?.activityLimitations,
      participationRestrictions: section?.participationRestrictions,
    }),
    'pt-diagnosis': (section) => section?.ptDiagnosis,
    'clinical-reasoning': (section) => section?.clinicalReasoning,
    // Plan (dynamic from existing anchors in Plan components)
    'treatment-plan': (section) => section, // composite within Plan
    'in-clinic-treatment-plan': (section) => ({
      exerciseTable: section?.exerciseTable,
      frequency: section?.frequency,
      duration: section?.duration,
    }),
    'goal-setting': (section) => ({
      frequency: section?.frequency,
      duration: section?.duration,
      goalsTable: section?.goalsTable,
    }),
    // Billing
    'diagnosis-codes': (section) => section?.diagnosisCodes || section?.icdCodes,
    'cpt-codes': (section) => section?.billingCodes || section?.cptCodes,
    'billing-notes': (section) => section?.skilledJustification || section?.treatmentNotes,
    'orders-referrals': (section) => section?.ordersReferrals,
  };

  // Title extraction helper (use only text nodes, ignore toggle UI like the banner 'Show' control)
  const extractTitle = (anchorEl) => {
    const h = anchorEl.querySelector('.subsection-title');
    if (h) {
      // Collect only TEXT_NODE contents to avoid including toggle label text
      const text = Array.from(h.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) return text;
      // Fallback: strip a trailing 'Show' if present
      const raw = (h.textContent || '').trim();
      return raw.replace(/\s*Show\s*$/i, '').trim();
    }
    return anchorEl.getAttribute('data-title') || anchorEl.id || 'Subsection';
  };

  // Fallback subsection map and titles (used when section is not currently rendered)
  const subsectionFallbackMap = {
    subjective: ['hpi', 'pain-assessment', 'functional-status', 'additional-history'],
    objective: [
      'general-observations',
      'inspection',
      'palpation',
      'regional-assessment',
      'neurological-screening',
      'functional-movement',
      'treatment-performed',
    ],
    assessment: ['primary-impairments', 'icf-classification', 'pt-diagnosis', 'clinical-reasoning'],
    plan: ['goal-setting', 'treatment-plan', 'in-clinic-treatment-plan'],
    billing: ['diagnosis-codes', 'cpt-codes', 'orders-referrals'],
  };
  const subsectionTitleMap = {
    hpi: 'History of Present Illness',
    'pain-assessment': 'Symptom Assessment',
    'functional-status': 'Functional Status',
    'additional-history': 'Additional History',
    'general-observations': 'General Observations & Vital Signs',
    inspection: 'Inspection',
    palpation: 'Palpation',
    'regional-assessment': 'Regional Assessment',
    'neurological-screening': 'Neurological Screening',
    'functional-movement': 'Functional Movement',
    'treatment-performed': 'Treatment Performed',
    'primary-impairments': 'Primary Impairments',
    'icf-classification': 'ICF Classification',
    'pt-diagnosis': 'PT Diagnosis',
    'clinical-reasoning': 'Clinical Reasoning',
    'goal-setting': 'Goal Setting',
    'in-clinic-treatment-plan': 'In-Clinic Treatment Plan',
    'diagnosis-codes': 'Diagnosis Codes',
    'cpt-codes': 'CPT Codes',
    'billing-notes': 'Billing Notes',
    'orders-referrals': 'Orders & Referrals',
    'regional-assessment': 'Regional Assessment',
    'neurological-screening': 'Neurological Screening',
    'functional-movement': 'Functional Movement Assessment',
    'treatment-performed': 'Treatment Performed',
    'primary-impairments': 'Primary Impairments',
    'icf-classification': 'ICF Classification',
    'pt-diagnosis': 'Physical Therapy Diagnosis & Prognosis',
    'clinical-reasoning': 'Clinical Reasoning',
    'treatment-plan': 'Plan of Care',
    'in-clinic-treatment-plan': 'In-Clinic Treatment Plan',
    'goal-setting': 'SMART Goals & Outcomes',
    'diagnosis-codes': 'ICD-10 Codes',
    'cpt-codes': 'CPT Codes',
    'orders-referrals': 'Orders & Referrals',
  };

  function getSubsectionsForSection(sectionId, activeSectionId) {
    // If the section is active, prefer DOM-derived anchors
    if (sectionId === activeSectionId) {
      const contentRoot = document.querySelector('.section-content');
      const sectionRoot = contentRoot?.querySelector(`.${sectionId}-section`);
      if (sectionRoot) {
        let anchors = Array.from(sectionRoot.querySelectorAll('.section-anchor'));
        // In student mode, hide subsections toggled off by instructor
        const vis = caseData?.editorSettings?.visibility?.[sectionId];
        if (vis && typeof vis === 'object') {
          anchors = anchors.filter((a) => vis[a.id] !== false);
        }
        if (anchors.length) {
          return anchors.map((a) => ({
            id: a.id,
            label:
              a.querySelector('.subsection-title')?.textContent || subsectionTitleMap[a.id] || a.id,
          }));
        }
      }
    }
    // Fallback to expected anchors
    let ids = subsectionFallbackMap[sectionId] || [];
    const vis = caseData?.editorSettings?.visibility?.[sectionId];
    if (vis && typeof vis === 'object') {
      ids = ids.filter((id) => vis[id] !== false);
    }
    return ids.map((id) => ({ id, label: subsectionTitleMap[id] || id }));
  }

  // Tri-state section status from its subsections
  function calculateSectionStatus(sectionId, caseDataObj, activeSectionId) {
    const sectionData = caseDataObj?.[sectionId] || {};
    const subs = getSubsectionsForSection(sectionId, activeSectionId);
    if (!subs.length) return 'empty';
    let sawComplete = false;
    let sawEmpty = false;
    for (const sub of subs) {
      const resolver = subsectionDataResolvers[sub.id];
      const data = resolver ? resolver(sectionData) : sectionData?.[sub.id];
      const status = getSubsectionStatus(data, sub.id, sectionData);
      if (status === 'partial') return 'partial';
      if (status === 'complete') sawComplete = true;
      if (status === 'empty') sawEmpty = true;
    }
    if (sawComplete && sawEmpty) return 'partial';
    return sawComplete ? 'complete' : 'empty';
  }

  // Helper: tri-state section status (no percentage)
  const getProgressStatus = (sectionId, caseData = {}) => {
    const status = calculateSectionStatus(sectionId, caseData, activeSection);
    return { status };
  };

  // Simple tri-state dot indicator
  const createProgressIndicator = (status) => {
    const colors = {
      empty: 'var(--border)',
      partial: 'var(--und-orange)',
      complete: 'var(--und-green)',
    };
    const color = colors[status] || 'var(--border)';
    return el('div', {
      style: `width: 12px; height: 12px; border-radius: 50%; background: ${status === 'empty' ? 'var(--bg)' : color}; border: 2px solid ${color}; margin-right: 10px; flex-shrink:0;`,
    });
  };

  // Create section navigation item
  const createSectionNav = (section) => {
    const isActive = section.id === activeSection;
    const progressInfo = getProgressStatus(section.id, config.caseData);

    const navItem = el(
      'div',
      {
        class: `section-nav-item ${isActive ? 'active' : ''}`,
        'aria-current': isActive ? 'page' : undefined,
        role: 'link',
        tabIndex: 0,
        onClick: () => {
          // Call the editor's handler to change active section and perform aligned scroll
          onSectionChange(section.id);
          try {
            // Defensive: if the editor didn’t scroll yet, force precise alignment to section wrapper top
            const root =
              document.getElementById(`wrap-${section.id}`) ||
              document.getElementById(`section-${section.id}`);
            if (root) {
              const cs = getComputedStyle(document.documentElement);
              const topbarH = parseInt(
                (cs.getPropertyValue('--topbar-h') || '').replace('px', '').trim(),
                10,
              );
              const offset = isNaN(topbarH) ? 72 : topbarH;
              const r = root.getBoundingClientRect();
              const y = Math.max(0, window.scrollY + r.top - offset);
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          } catch {}
        },
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSectionChange(section.id);
            try {
              const root =
                document.getElementById(`wrap-${section.id}`) ||
                document.getElementById(`section-${section.id}`);
              if (root) {
                const cs = getComputedStyle(document.documentElement);
                const topbarH = parseInt(
                  (cs.getPropertyValue('--topbar-h') || '').replace('px', '').trim(),
                  10,
                );
                const offset = isNaN(topbarH) ? 72 : topbarH;
                const r = root.getBoundingClientRect();
                const y = Math.max(0, window.scrollY + r.top - offset);
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            } catch {}
          }
        },
      },
      [
        // Tri-state progress indicator
        createProgressIndicator(progressInfo.status),

        // Section info
        el(
          'div',
          {
            style: 'margin-left: 12px; flex: 1;',
          },
          [
            el(
              'div',
              {
                class: 'nav-label',
                style: `
            font-weight: ${isActive ? '600' : '500'};
            font-size: 14px;
            color: inherit;
          `,
              },
              section.label,
            ),

            // Tri-state progress text
            el(
              'div',
              {
                class: 'nav-progress-text',
                style: 'font-size: 12px; margin-top: 2px;',
              },
              progressInfo.status === 'complete'
                ? 'Complete'
                : progressInfo.status === 'partial'
                  ? 'In Progress'
                  : 'Not Started',
            ),
          ],
        ),
      ],
    );

    // Hover effects handled in CSS

    return navItem;
  };

  // Create subsection table of contents dynamically from DOM anchors (shown when section is active)
  const createSubsectionTOC = (section) => {
    if (section.id !== activeSection) return null;
    // Do not show subsections for the Billing section per UX request
    if (section.id === 'billing') return null;

    // Find the main content area and locate anchors for this section
    const contentRoot = document.querySelector('.section-content');
    let anchors = Array.from(contentRoot?.querySelectorAll('.section-anchor') || []).filter((a) =>
      a.closest(`.${section.id}-section`),
    );
    // Filter by case-level visibility settings for both faculty and students
    const vis = config.caseData?.editorSettings?.visibility?.[section.id];
    if (vis && typeof vis === 'object') {
      anchors = anchors.filter((a) => vis[a.id] !== false);
    }

    const subs = anchors.map((a) => ({ id: a.id, label: extractTitle(a) }));

    return el(
      'div',
      { class: 'subsection-toc' },
      subs.map((sub) => {
        const sectionData = config.caseData?.[section.id];
        // Resolve data by ID using mapping if available
        const resolver = subsectionDataResolvers[sub.id];
        let subsectionData = resolver ? resolver(sectionData) : (sectionData?.[sub.id] ?? null);
        const subsectionStatus = getSubsectionStatus(subsectionData, sub.id, sectionData);

        const row = el(
          'div',
          {
            class: 'subsection-item',
            style: `display:flex; align-items:center; padding:4px 8px; font-size:12px; cursor:pointer; transition:all 0.2s ease; border-radius:4px;`,
            onClick: () => {
              const anchor = document.getElementById(sub.id);
              if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            },
          },
          [createSubsectionIndicator(subsectionStatus), el('span', {}, sub.label)],
        );

        // No sidebar toggles; toggles live in subsection banners now

        return row;
      }),
    );
  };

  // Allow student to rename blank notes: prefer draft.noteTitle when present
  const computedCaseInfo = { ...caseInfo };
  try {
    const isStudent = !isFacultyMode;
    const isBlank =
      typeof (caseData?.id || '') === 'string' ? String(caseData.id).startsWith('blank') : false;
    const draft = window && window.currentDraft ? window.currentDraft : null;
    if (isStudent && isBlank && draft) {
      if (draft.noteTitle && draft.noteTitle.trim()) {
        computedCaseInfo.title = draft.noteTitle.trim();
      }
    }
  } catch {}

  // Create the sidebar navigation
  // Modules available on the case object (draft-safe)
  const currentModules = Array.isArray((config.caseData || {}).modules)
    ? config.caseData.modules
    : [];

  const sidebar = el(
    'div',
    {
      class: 'chart-navigation',
      role: 'complementary',
      'aria-label': 'Chart navigation',
      id: 'chartNavigation',
    },
    [
      // Navigation panel (white card stack)
      el(
        'div',
        {
          class: 'sidebar-nav-panel',
          role: 'navigation',
          'aria-label': 'Chart sections',
        },
        [
          // Case info card removed per design; patient info now lives in sticky header above content.
          // Background Information (formerly Artifacts): clearly separated with dividers
          (() => {
            const items = Array.isArray(currentModules) ? currentModules : [];
            const topDivider = el('div', {
              style: 'border-top:1px solid var(--border-strong); margin: 8px 0 10px 0;',
            });
            const header = el(
              'h4',
              {
                style:
                  'margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; color: var(--text);',
              },
              'Background Information',
            );
            const bottomDivider = el('div', {
              style: 'border-top:1px solid var(--border-strong); margin: 10px 0 8px 0;',
            });
            if (config.isFacultyMode) {
              // List artifacts with table-style remove buttons
              const list = items.length
                ? el(
                    'div',
                    { style: 'display:flex; flex-direction:column; gap:6px;' },
                    items.map((m) => {
                      const title =
                        m.title ||
                        (m.type ? m.type[0].toUpperCase() + m.type.slice(1) : 'Artifact');
                      return el('div', { style: 'display:flex; gap:6px; align-items:center;' }, [
                        el(
                          'button',
                          {
                            class: 'btn secondary',
                            style: 'flex:1; text-align:left; padding:6px 10px; font-size:12px;',
                            onClick: () => openViewArtifactModal(m),
                            title: 'View background document',
                          },
                          title,
                        ),
                        el(
                          'button',
                          {
                            type: 'button',
                            class: 'remove-btn editable-table__delete-btn',
                            title: 'Remove document',
                            onClick: () => {
                              const next = items.filter((x) => x.id !== m.id);
                              const payload = { ...(config.caseInfo || {}), modules: next };
                              config.onCaseInfoUpdate?.(payload);
                            },
                          },
                          '×',
                        ),
                      ]);
                    }),
                  )
                : el('div');

              // Add button styled like tables (compact circular +), placed below list
              const addBtnFooter = el(
                'div',
                {
                  class: 'editable-table__footer',
                  style: 'display:flex; justify-content:center; margin: 6px 0 10px 0;',
                },
                el(
                  'div',
                  {
                    class: 'compact-add-btn',
                    title: 'Add background document',
                    onclick: () => {
                      openAddArtifactModal((mod) => {
                        const next = [...items, mod];
                        const payload = { ...(config.caseInfo || {}), modules: next };
                        config.onCaseInfoUpdate?.(payload);
                      });
                    },
                  },
                  '+',
                ),
              );

              return el('div', { style: 'margin: 6px 0 10px 0;' }, [
                topDivider,
                header,
                list,
                addBtnFooter,
                bottomDivider,
              ]);
            }
            // Student view: buttons to open artifacts
            if (!items.length) return el('div');
            const list = el(
              'div',
              { style: 'display:flex; flex-direction:column; gap:6px;' },
              items.map((m) => {
                const title =
                  m.title || (m.type ? m.type[0].toUpperCase() + m.type.slice(1) : 'Artifact');
                return el(
                  'button',
                  {
                    class: 'btn secondary',
                    style: 'width:100%; text-align:left; padding:6px 10px; font-size:12px;',
                    onClick: () => openViewArtifactModal(m),
                  },
                  title,
                );
              }),
            );
            return el('div', { style: 'margin: 6px 0 10px 0;' }, [
              topDivider,
              header,
              list,
              bottomDivider,
            ]);
          })(),
          // Extra padding before section trackers
          el('div', { style: 'height: 20px;' }),
          // Section cards + subsections
          ...sections.map((section) =>
            el('div', {}, [createSectionNav(section), createSubsectionTOC(section)]),
          ),
          // Footer actions: Export to Word at very bottom with extra separation from Billing
          (() => {
            function handleExportClick() {
              try {
                const out = config.caseData || {};
                const draft = window && window.currentDraft ? window.currentDraft : out || {};
                try {
                  if (draft.noteTitle) out.title = draft.noteTitle;
                } catch {}
                try {
                  if (draft.snapshot) out.snapshot = { ...(out.snapshot || {}), ...draft.snapshot };
                } catch {}
                try {
                  if (draft.meta) out.meta = { ...(out.meta || {}), ...draft.meta };
                } catch {}
                exportToWord(out, draft);
              } catch (e) {
                console.error('Export to Word failed to start:', e);
                alert('Unable to start Word export.');
              }
            }
            return el(
              'div',
              { style: 'margin: 24px 0 8px 0; display:flex; gap:8px; justify-content: stretch;' },
              [
                el(
                  'button',
                  {
                    class: 'btn primary',
                    style: 'flex:1;',
                    title: 'Export this chart to a Word document',
                    onClick: handleExportClick,
                  },
                  'Export to Word',
                ),
              ],
            );
          })(),
        ],
      ),
    ],
  );

  // Ensure content starts full width on small screens (nav closed)
  setTimeout(() => {
    /* layout offsets handled by drawer CSS */
  }, 100);

  // Expose a reusable toggle for header hamburger and FAB
  window.toggleMobileNav = function toggleMobileNav() {
    try {
      const isOpen = sidebar.classList.contains('mobile-open');
      const nowOpen = !isOpen;
      sidebar.classList.toggle('mobile-open', nowOpen);
      document.body.classList.toggle('mobile-drawer-open', nowOpen);
      return nowOpen;
    } catch {
      return false;
    }
  };

  // Enhance current section content with banner toggles + visibility rules
  setTimeout(() => {
    applySubsectionVisibilityControls({
      activeSection,
      isFacultyMode,
      caseData,
      onEditorSettingsChange,
    });
  }, 0);

  return sidebar;
}

/**
 * Updates the save status in the sidebar
 * @param {HTMLElement} sidebar - The sidebar element
 * @param {string} status - Save status: 'saving', 'saved', 'error'
 */
export function updateSaveStatus(sidebar, status) {
  const statusDot = sidebar.querySelector('.status-dot');
  const statusText = sidebar.querySelector('.autosave-status span:last-child');

  if (statusDot && statusText) {
    switch (status) {
      case 'saving':
        statusDot.style.background = 'var(--warning)';
        statusText.textContent = 'Saving...';
        break;
      case 'saved':
        statusDot.style.background = 'var(--success)';
        statusText.textContent = 'Saved';
        break;
      case 'error':
        statusDot.style.background = 'var(--danger)';
        statusText.textContent = 'Save failed';
        break;
    }
  }
}

/**
 * Refreshes the chart navigation with updated progress data
 * @param {HTMLElement} sidebar - The sidebar element to refresh
 * @param {Object} config - Updated navigation configuration
 */
export function refreshChartNavigation(sidebar, config) {
  // Create new navigation content
  const newSidebar = createChartNavigation(config);

  // Replace the content while preserving the container
  sidebar.innerHTML = '';
  Array.from(newSidebar.children).forEach((child) => {
    sidebar.appendChild(child);
  });
  // Re-apply visibility controls on current content after refresh
  setTimeout(() => {
    try {
      applySubsectionVisibilityControls({
        activeSection: config.activeSection,
        isFacultyMode: !!config.isFacultyMode,
        caseData: config.caseData || {},
        onEditorSettingsChange: config.onEditorSettingsChange,
      });
    } catch {}
  }, 0);
}

/**
 * Creates anchors for subsections to enable smooth scrolling
 * @param {string} sectionId - Section identifier
 * @param {Array} subsections - Array of subsection objects
 * @returns {Array} Array of anchor elements
 */
export function createSectionAnchors(sectionId, subsections) {
  return subsections.map((sub) =>
    el('div', {
      id: sub.id,
      class: 'section-anchor',
      // scroll-margin-top handled via CSS to account for patient header height dynamically
    }),
  );
}
