// ChartNavigation.js - Professional EMR-style navigation with progress tracking
import { el } from '../../ui/utils.js';
import { createIcon } from '../../ui/Icons.js';
import { exportToWord } from '../../services/document-export.js';

/**
 * Creates SVG elements with proper namespace
 * @param {string} tag - SVG tag name
 * @param {Object} attrs - Attributes object
 * @param {Array} children - Child elements
 * @returns {SVGElement} SVG element
 */
function createSVGElement(tag, attrs = {}, children = []) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  if (!Array.isArray(children)) children = [children];
  children.forEach(child => {
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
function createProgressRing(percentage, size = 20, color = 'var(--und-green)') {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const svg = createSVGElement('svg', {
    width: size,
    height: size,
    style: 'transform: rotate(-90deg);'
  });
  
  // Background circle
  const bgCircle = createSVGElement('circle', {
    cx: size / 2,
    cy: size / 2,
    r: radius,
    fill: 'none',
    stroke: 'var(--border)',
    'stroke-width': 2
  });
  
  // Progress circle
  const progressCircle = createSVGElement('circle', {
    cx: size / 2,
    cy: size / 2,
    r: radius,
    fill: 'none',
    stroke: color,
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-dasharray': strokeDasharray,
    'stroke-dashoffset': strokeDashoffset,
    style: 'transition: stroke-dashoffset 0.3s ease;'
  });
  
  svg.appendChild(bgCircle);
  svg.appendChild(progressCircle);
  
  return svg;
}

/**
 * Creates a subsection status indicator
 * @param {string} status - 'complete', 'partial', or 'empty'
 * @returns {HTMLElement} Status indicator
 */
function createSubsectionIndicator(status) {
  switch (status) {
    case 'complete':
      return el('span', {
        style: 'color: var(--und-green); font-size: 14px; font-weight: bold; margin-right: 6px;'
      }, '✓');
    
    case 'partial':
      return el('div', {
        style: `
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: linear-gradient(90deg, var(--und-orange) 50%, var(--border) 50%);
          margin-right: 6px;
          flex-shrink: 0;
        `
      });
    
    default: // 'empty'
      return el('div', {
        style: `
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          margin-right: 6px;
          flex-shrink: 0;
        `
      });
  }
}

/**
 * Calculates progress percentage for a section based on completed fields
 * @param {Object} sectionData - Section data object
 * @param {string} sectionType - Type of section (subjective, objective, etc.)
 * @returns {number} Progress percentage (0-100)
 */
function calculateSectionProgress(sectionData, sectionType) {
  if (!sectionData) {
    return 0;
  }
  
  let totalFields = 0;
  let completedFields = 0;
  const deepHasContent = (val) => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (typeof val === 'number') return !isNaN(val);
    if (Array.isArray(val)) return val.some(deepHasContent);
    if (typeof val === 'object') return Object.values(val).some(deepHasContent);
    return Boolean(val);
  };
  
  switch (sectionType) {
    case 'subjective':
      // Define ALL expected subjective fields
      const subjectiveFields = [
        'chiefComplaint',
        'historyOfPresentIllness', 
        'painLocation',
        'painScale',
        'painQuality',
        'functionalLimitations',
        'medicationsCurrent',
        'additionalHistory'
      ];
      
      totalFields = subjectiveFields.length;
      completedFields = subjectiveFields.filter(field => {
        const value = sectionData[field];
        return value && value.toString().trim().length > 0;
      }).length;
      break;
      
    case 'objective':
      // Count objective fields (ROM, MMT, Special Tests, etc.)
      if (sectionData.rom && Array.isArray(sectionData.rom)) {
        totalFields += sectionData.rom.length;
        completedFields += sectionData.rom.filter(item => 
          item.measurement && item.measurement.toString().trim()
        ).length;
      }
      if (sectionData.mmt && Array.isArray(sectionData.mmt)) {
        totalFields += sectionData.mmt.length;
        completedFields += sectionData.mmt.filter(item => 
          item.grade && item.grade.toString().trim()
        ).length;
      }
      if (sectionData.specialTests && Array.isArray(sectionData.specialTests)) {
        totalFields += sectionData.specialTests.length;
        completedFields += sectionData.specialTests.filter(item => 
          item.result && item.result.toString().trim()
        ).length;
      }
      // Fallback for object-based regional assessments
      if (totalFields === 0 && sectionData.regionalAssessments) {
        totalFields = 2; // coarse-grained progress
        completedFields = deepHasContent(sectionData.regionalAssessments) ? 1 : 0;
      }
      break;
      
    case 'assessment':
      if (sectionData.diagnosis !== undefined) {
        totalFields++;
        if (sectionData.diagnosis && sectionData.diagnosis.trim()) completedFields++;
      }
      if (sectionData.impairments && Array.isArray(sectionData.impairments)) {
        totalFields += sectionData.impairments.length;
        completedFields += sectionData.impairments.filter(item => 
          item && item.trim()
        ).length;
      }
      break;
      
    case 'plan':
      if (sectionData.goals && Array.isArray(sectionData.goals)) {
        totalFields += sectionData.goals.length;
        completedFields += sectionData.goals.filter(goal => 
          goal.description && goal.description.trim()
        ).length;
      }
      if (sectionData.interventions && Array.isArray(sectionData.interventions)) {
        totalFields += sectionData.interventions.length;
        completedFields += sectionData.interventions.filter(intervention => 
          intervention.description && intervention.description.trim()
        ).length;
      }
      if (sectionData.frequency !== undefined) {
        totalFields++;
        if (sectionData.frequency && sectionData.frequency.trim()) completedFields++;
      }
      if (sectionData.duration !== undefined) {
        totalFields++;
        if (sectionData.duration && sectionData.duration.trim()) completedFields++;
      }
      break;
      
    case 'billing':
      if (sectionData.cptCodes && Array.isArray(sectionData.cptCodes)) {
        totalFields += sectionData.cptCodes.length;
        completedFields += sectionData.cptCodes.filter(code => 
          code.code && code.code.trim()
        ).length;
      }
      if (sectionData.units !== undefined) {
        totalFields++;
        if (sectionData.units && sectionData.units.toString().trim()) completedFields++;
      }
      break;
  }
  
  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
}

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
    'hpi': (data, section) => {
      const chiefComplaint = section?.chiefComplaint;
      const hpi = section?.historyOfPresentIllness || data;
      // Require both chief concern and HPI content for completion
      return isFieldComplete(chiefComplaint) && isFieldComplete(hpi);
    },
    'pain-assessment': (data, section) => {
      const painData = (section && (section.painLocation || section.painScale || section.painQuality || section.painPattern || section.aggravatingFactors || section.easingFactors)) ? section : data;
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
      return isFieldComplete(functionalLimitations) &&
        isFieldComplete(priorLevel) &&
        isFieldComplete(patientGoals);
    },
    'additional-history': (data, section) => {
      // Require all three fields in Additional History subsection to be complete
      const medications = section?.medicationsCurrent;
      const redFlags = section?.redFlags;
      const additionalHistory = section?.additionalHistory;
      return isFieldComplete(medications) &&
        isFieldComplete(redFlags) &&
        isFieldComplete(additionalHistory);
    },
    
    // Objective subsections
    'regional-assessment': (data, section) => {
      // New regional assessments live under section.regionalAssessments
      const ra = section?.regionalAssessments || data?.regionalAssessments || data;
      if (!ra || typeof ra !== 'object') return false;
      // Tables store values as nested objects; count content if any non-empty value exists
      const hasRom = ra.rom && isFieldComplete(ra.rom);
      const hasMmt = ra.mmt && isFieldComplete(ra.mmt);
      const hasTests = (ra.specialTests || ra.testData) && isFieldComplete(ra.specialTests || ra.testData);
      // Mark complete if any of the three sub-areas has entries
      return Boolean(hasRom || hasMmt || hasTests);
    },
    'inspection': (data, section) => {
      const inspection = section?.inspection?.visual || data;
      return isFieldComplete(inspection);
    },
    'palpation': (data, section) => {
      const palpation = section?.palpation?.findings || data;
      return isFieldComplete(palpation);
    },
    'rom': (data, section) => {
      const romData = section?.rom || data;
      if (!Array.isArray(romData) || romData.length === 0) return false;
      return romData.every(item => isFieldComplete(item.measurement));
    },
    'mmt': (data, section) => {
      const mmtData = section?.mmt || data;
      if (!Array.isArray(mmtData) || mmtData.length === 0) return false;
      return mmtData.every(item => isFieldComplete(item.grade));
    },
    'special-tests': (data, section) => {
      const testsData = section?.specialTests || data;
      if (!Array.isArray(testsData) || testsData.length === 0) return false;
      return testsData.every(item => isFieldComplete(item.result));
    },
    'neuro': (data, section) => {
      const neuro = section?.neuro?.screening || data;
      return isFieldComplete(neuro);
    },
    'functional': (data, section) => {
      const functional = section?.functional?.assessment || data;
      return isFieldComplete(functional);
    },
    
    // Assessment subsections
    'primary-impairments': (data, section) => isFieldComplete(section?.primaryImpairments || data),
    'icf-classification': (data, section) => {
      const s = section || {};
      return isFieldComplete(s.bodyFunctions) && isFieldComplete(s.activityLimitations) && isFieldComplete(s.participationRestrictions);
    },
    'pt-diagnosis': (data, section) => isFieldComplete(section?.ptDiagnosis || data),
    'clinical-reasoning': (data, section) => isFieldComplete(section?.clinicalReasoning || data),
    
    // Plan subsections
  'treatment-plan': (data, section) => (
    isFieldComplete(section?.treatmentPlan || data?.treatmentPlan) &&
    isFieldComplete(section?.patientEducation || data?.patientEducation)
  ),
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
      return arr.every(code => isFieldComplete(code.code));
    },
    'cpt-codes': (data, section) => {
      const arr = section?.billingCodes || section?.cptCodes || data;
      if (!Array.isArray(arr) || arr.length === 0) return false;
      // Require all visible inputs per CPT row: code, units (>0), and timeSpent (non-empty)
      return arr.every(item => {
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
      return arr.every(item => isFieldComplete(item.type) && isFieldComplete(item.details));
    },
    'billing-notes': (data, section) => {
      const notes = section?.skilledJustification || section?.treatmentNotes || data;
      return isFieldComplete(notes);
    }
  };
  
  // Helper function to check if a field is complete
  function isFieldComplete(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (Array.isArray(value)) return value.length > 0 && value.some(item => isFieldComplete(item));
    if (typeof value === 'object') {
      return Object.values(value).some(val => isFieldComplete(val));
    }
    return Boolean(value);
  }
  
  // Check if we have a specific requirement for this subsection type
  const requirement = subsectionRequirements[subsectionType];
  if (requirement) {
    const isComplete = requirement(subsectionData, fullSectionData);
    return isComplete ? 'complete' : (hasAnyContent(subsectionData) ? 'partial' : 'empty');
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
    if (Array.isArray(value)) return value.some(item => hasContent(item));
    if (typeof value === 'object') {
      return Object.values(value).some(val => hasContent(val));
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
    const completedItems = subsectionData.filter(item => {
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object') {
        return Object.values(item).some(value => 
          value && value.toString().trim()
        );
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
    const completedValues = values.filter(value => 
      value && value.toString().trim()
    );
    
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
function applySubsectionVisibilityControls({ activeSection, isFacultyMode, caseData, onEditorSettingsChange }) {
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
          toggleWrap = el('label', {
            class: 'subsection-visibility-toggle und-toggle',
            style: 'margin-left:auto; display:flex; align-items:center; gap:10px; font-weight:500; font-size:12px; color: var(--text-secondary); position: relative;'
          }, [
            el('span', { class: 'toggle-text', style: 'user-select:none;' }, 'OFF'),
            // Accessible checkbox drives the visual switch via sibling selectors
            el('input', { type: 'checkbox', class: 'und-toggle-input', 'aria-label': 'Show subsection', 'aria-checked': 'false', style: 'position:absolute; opacity:0; width:0; height:0;' }),
            el('span', { class: 'und-toggle-track', 'aria-hidden': 'true' }, [
              el('span', { class: 'und-toggle-thumb' })
            ])
          ]);
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
function createEditableCaseHeader(caseInfo, onUpdate, options = {}) {
  const preferEditOnClick = !!options.preferEditOnClick;
  const showEditButton = !!options.forceShowEditButton;
  const showPencil = !!options.showPencil; // default off
  let isExpanded = false;
  // Default to auto-calc if age is empty and DOB exists
  let autoAge = (!caseInfo.age || caseInfo.age === '') && !!caseInfo.dob;
  let ageInput; // reference to age input for enabling/disabling
  
  const toggleButton = el('button', {
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
      }
  }, ['✎']);

  const titleDisplay = el('div', { class: 'case-title' }, [
    el('h3', { class: 'case-title-text' }, caseInfo.title || 'Untitled Case'),
    ...(showPencil ? [toggleButton] : []),
    ...(showEditButton ? [el('button', {
      class: 'btn secondary',
      style: 'margin-left: 8px; padding:4px 8px; font-size:12px;',
      onclick: (e) => { e.stopPropagation(); openEditCaseModal({ ...caseInfo }, (updated) => { Object.assign(caseInfo, updated); updateBasicInfo(); onUpdate?.(caseInfo); }); }
    }, 'Edit')] : [])
  ]);

  // Value spans for easy updates
  const settingValue = el('span', { class: 'value' }, caseInfo.setting || 'N/A');
  // Prefer displaying age computed from DOB when available for ongoing accuracy
  const ageValue = el('span', { class: 'value' }, computeAgeFromDob(caseInfo.dob) || caseInfo.age || 'N/A');
  const sexValue = el('span', { class: 'value' }, caseInfo.sex || 'N/A');
  const acuityValue = el('span', { class: 'value' }, caseInfo.acuity || 'N/A');

  const basicInfo = el('div', { class: 'case-info-grid' }, [
    // Order: DOB, Age, Sex, Setting, Acuity (Title is above already)
    el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'DOB:'), el('span', { class: 'value', id: 'case-dob-display' }, caseInfo.dob || 'N/A') ]),
    el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Age:'), ageValue ]),
    el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Sex:'), sexValue ]),
    el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Setting:'), settingValue ]),
    el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Acuity:'), acuityValue ])
  ]);

  function updateBasicInfo() {
  settingValue.textContent = caseInfo.setting || 'N/A';
  ageValue.textContent = computeAgeFromDob(caseInfo.dob) || caseInfo.age || 'N/A';
  sexValue.textContent = caseInfo.sex || 'N/A';
  acuityValue.textContent = caseInfo.acuity || 'N/A';
  const dobDisp = basicInfo.querySelector('#case-dob-display');
  if (dobDisp) dobDisp.textContent = caseInfo.dob || 'N/A';
  }

  function updateToggleDisplay() { /* no-op; editing handled in modal */ }

  const card = el('div', { class: 'case-info-card', role: 'button', tabIndex: 0, title: preferEditOnClick ? 'Edit case details' : 'View full case details' }, [titleDisplay, basicInfo]);
  const openTarget = preferEditOnClick ? () => openEditCaseModal(caseInfo, (updated) => { Object.assign(caseInfo, updated); updateBasicInfo(); onUpdate?.(caseInfo); }) : () => openCaseDetailsModal(caseInfo);
  card.addEventListener('click', openTarget);
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTarget(); } });
  return card;
}

/**
 * Creates a read-only case header for student mode
 * @param {Object} caseInfo - Case information object
 * @returns {HTMLElement} Read-only case header
 */
function createReadOnlyCaseHeader(caseInfo) {
  const card = el('div', { class: 'case-info-card', role: 'button', tabIndex: 0, title: 'View full case details' }, [
    el('div', { class: 'case-title' }, [
      el('h3', { class: 'case-title-text' }, caseInfo.title || 'Untitled Case')
    ]),
    el('div', { class: 'case-info-grid' }, [
      // Order: DOB, Age, Sex, Setting, Acuity
      el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'DOB:'), el('span', { class: 'value' }, caseInfo.dob || 'N/A') ]),
  el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Age:'), el('span', { class: 'value' }, computeAgeFromDob(caseInfo.dob) || caseInfo.age || 'N/A') ]),
      el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Sex:'), el('span', { class: 'value' }, caseInfo.sex || 'N/A') ]),
      el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Setting:'), el('span', { class: 'value' }, caseInfo.setting || 'N/A') ]),
      el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Acuity:'), el('span', { class: 'value' }, caseInfo.acuity || 'N/A') ])
    ])
  ]);
  card.addEventListener('click', () => openCaseDetailsModal(caseInfo));
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCaseDetailsModal(caseInfo); } });
  return card;
}

// Simple Case Details Modal (reuses modal styles from GoalLinker)
function openCaseDetailsModal(caseInfo) {
  const overlay = el('div', { class: 'goal-linker-modal', role: 'dialog', 'aria-modal': 'true' });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  const content = el('div', { class: 'goal-linker-content', style: 'max-width: 640px;' }, [
    el('div', { class: 'goal-linker-header' }, [
      el('h3', {}, 'Case Details'),
      el('button', { class: 'close-btn', onclick: () => overlay.remove(), 'aria-label': 'Close' }, '✕')
    ]),
    el('div', { class: 'goal-selection-list', style: 'max-height: 60vh;' }, [
      el('div', { class: 'case-info-grid', style: 'grid-template-columns: 160px 1fr;' }, [
        // Order: Title, DOB, Age, Sex, Setting, Acuity
        el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Title'), el('span', { class: 'value' }, caseInfo.title || 'Untitled Case') ]),
  el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'DOB'), el('span', { class: 'value' }, caseInfo.dob || 'N/A') ]),
  el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Age'), el('span', { class: 'value' }, computeAgeFromDob(caseInfo.dob) || caseInfo.age || 'N/A') ]),
        el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Sex'), el('span', { class: 'value' }, caseInfo.sex || 'N/A') ]),
        el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Setting'), el('span', { class: 'value' }, caseInfo.setting || 'N/A') ]),
        el('div', { class: 'case-info-row' }, [ el('span', { class: 'label' }, 'Acuity'), el('span', { class: 'value' }, caseInfo.acuity || 'N/A') ])
      ])
    ]),
    el('div', { class: 'goal-linker-header', style: 'justify-content: flex-end; background: var(--surface); border-top: 1px solid var(--border);' }, [
      el('button', { class: 'btn secondary', onclick: () => overlay.remove() }, 'Close')
    ])
  ]);
  overlay.append(content);
  document.body.append(overlay);
  // Focus for accessibility
  setTimeout(() => { const btn = overlay.querySelector('.close-btn'); btn?.focus(); }, 0);
}

// Edit Case Details Modal (faculty): mirrors Create New Case layout
function openEditCaseModal(caseInfo, onSave) {
  const modal = el('div', {
    style: `
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    `,
    onclick: (e) => { if (e.target === modal) document.body.removeChild(modal); }
  }, [
    el('div', {
      style: `
        background: white; padding: 32px; border-radius: 12px; max-width: 520px; width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
      `,
      onclick: (e) => e.stopPropagation()
    }, [
      el('h2', { class: 'instructor-title' }, 'Edit Case Details'),
      el('form', { id: 'edit-case-form', onsubmit: handleSubmit }, [
        // Title
        el('div', { class: 'instructor-form-field' }, [
          el('label', { class: 'instructor-form-label' }, 'Case Title *'),
          el('input', { type: 'text', id: 'edit-title', required: true, class: 'instructor-form-input', value: caseInfo.title || '' })
        ]),
        // DOB (moved up)
        el('div', { style: 'margin-bottom: 16px;' }, [
          el('label', { style: 'display: block; margin-bottom: 8px; font-weight: 500; color: #374151;' }, 'DOB'),
          el('input', { type: 'date', id: 'edit-dob', value: caseInfo.dob || '', style: 'width:100%; padding:12px; border:1px solid #d1d5db; border-radius:6px; font-size:14px; box-sizing:border-box;', oninput: (e) => {
            // If user is typing a DOB, mark as user-edited so age changes won't overwrite
            if (e.isTrusted) delete e.target.dataset.autofilled;
            const computed = computeAgeFromDob(e.target.value);
            const ageEl = document.getElementById('edit-age');
            if (computed && ageEl) ageEl.value = computed;
          } }),
          el('div', { style: 'margin-top: 6px; font-size: 12px; color: #6b7280;' }, 'Age auto-fills when DOB is entered.')
        ]),
        // Age/Sex
        el('div', { style: 'display: flex; gap: 16px; margin-bottom: 16px;' }, [
          el('div', { style: 'flex: 1;' }, [
            el('label', { style: 'display: block; margin-bottom: 8px; font-weight: 500; color: #374151;' }, 'Patient Age'),
            el('input', { type: 'number', id: 'edit-age', min: 0, max: 120, style: 'width:100%; padding:12px; border:1px solid #d1d5db; border-radius:6px; font-size:14px; box-sizing:border-box;', value: caseInfo.age || '', oninput: (e) => {
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
            } })
          ]),
          el('div', { style: 'flex: 1;' }, [
            el('label', { style: 'display: block; margin-bottom: 8px; font-weight: 500; color: #374151;' }, 'Sex'),
            el('select', { id: 'edit-gender', style: 'width:100%; padding:12px; border:1px solid #d1d5db; border-radius:6px; font-size:14px; box-sizing:border-box;' }, [
              el('option', { value: '' }, 'Select...'),
              el('option', { value: 'Male', selected: caseInfo.sex === 'Male' ? '' : undefined }, 'Male'),
              el('option', { value: 'Female', selected: caseInfo.sex === 'Female' ? '' : undefined }, 'Female'),
              el('option', { value: 'Other', selected: caseInfo.sex === 'Other' ? '' : undefined }, 'Other'),
              el('option', { value: 'Prefer not to say', selected: caseInfo.sex === 'Prefer not to say' ? '' : undefined }, 'Prefer not to say')
            ])
          ])
        ]),
        // Setting (moved below Age/Sex)
        el('div', { class: 'instructor-form-field' }, [
          el('label', { class: 'instructor-form-label' }, 'Clinical Setting *'),
          el('select', { id: 'edit-setting', required: true, class: 'instructor-form-input' }, [
            el('option', { value: '' }, 'Select setting...'),
            el('option', { value: 'Outpatient', selected: caseInfo.setting === 'Outpatient' ? '' : undefined }, 'Outpatient'),
            el('option', { value: 'Inpatient', selected: caseInfo.setting === 'Inpatient' ? '' : undefined }, 'Inpatient'),
            el('option', { value: 'Home Health', selected: caseInfo.setting === 'Home Health' ? '' : undefined }, 'Home Health'),
            el('option', { value: 'SNF', selected: caseInfo.setting === 'SNF' ? '' : undefined }, 'Skilled Nursing Facility (SNF)'),
            el('option', { value: 'Acute Rehab', selected: caseInfo.setting === 'Acute Rehab' ? '' : undefined }, 'Acute Rehabilitation'),
            el('option', { value: 'Other', selected: caseInfo.setting === 'Other' ? '' : undefined }, 'Other')
          ])
  ]),
        // Acuity
        el('div', { style: 'margin-bottom: 24px;' }, [
          el('label', { style: 'display: block; margin-bottom: 8px; font-weight: 500; color: #374151;' }, 'Case Acuity'),
          el('select', { id: 'edit-acuity', style: 'width:100%; padding:12px; border:1px solid #d1d5db; border-radius:6px; font-size:14px; box-sizing:border-box;' }, [
            el('option', { value: '' }, 'Select acuity...'),
            el('option', { value: 'Routine', selected: caseInfo.acuity === 'Routine' ? '' : undefined }, 'Routine'),
            el('option', { value: 'Acute', selected: caseInfo.acuity === 'Acute' ? '' : undefined }, 'Acute'),
            el('option', { value: 'Complex', selected: caseInfo.acuity === 'Complex' ? '' : undefined }, 'Complex'),
            el('option', { value: 'Critical', selected: caseInfo.acuity === 'Critical' ? '' : undefined }, 'Critical')
          ])
        ]),
        // Buttons
        el('div', { style: 'display: flex; gap: 12px; justify-content: flex-end;' }, [
          el('button', { type: 'button', class: 'btn secondary', style: 'padding: 12px 24px; font-size: 14px;', onclick: () => document.body.removeChild(modal) }, 'Cancel'),
          el('button', { type: 'submit', class: 'btn primary', style: 'padding: 12px 24px; font-size: 14px;' }, 'Save Changes')
        ])
      ])
    ])
  ]);

  function handleSubmit(e) {
    e.preventDefault();
    const updated = {
      title: document.getElementById('edit-title').value.trim(),
      setting: document.getElementById('edit-setting').value,
      age: document.getElementById('edit-age').value,
      sex: document.getElementById('edit-gender').value,
      dob: document.getElementById('edit-dob').value,
      acuity: document.getElementById('edit-acuity').value
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
  const { activeSection, onSectionChange, caseData = {}, caseInfo = {}, isFacultyMode = false, onEditorSettingsChange } = config;
  
  // Define top-level sections only; subsections will be derived from DOM anchors to keep sidebar in sync with editor content
  const sections = [
    { id: 'subjective', label: 'Subjective', icon: '◉' },
    { id: 'objective', label: 'Objective', icon: '⚬' },
    { id: 'assessment', label: 'Assessment', icon: '⬢' },
    { id: 'plan', label: 'Plan', icon: '▪' },
    { id: 'billing', label: 'Billing', icon: '⬟' }
  ];

  // Map known subsection IDs to data accessors for accurate status
  const subsectionDataResolvers = {
    // Subjective
    'hpi': (section) => ({ chiefComplaint: section?.chiefComplaint, historyOfPresentIllness: section?.historyOfPresentIllness }),
    'pain-assessment': (section) => ({
      location: section?.painLocation,
      scale: section?.painScale,
      quality: section?.painQuality,
      pattern: section?.painPattern,
      aggravatingFactors: section?.aggravatingFactors,
      easingFactors: section?.easingFactors
    }),
    'functional-status': (section) => ({
      functionalLimitations: section?.functionalLimitations,
      priorLevel: section?.priorLevel,
      patientGoals: section?.patientGoals
    }),
    'additional-history': (section) => ({ medicationsCurrent: section?.medicationsCurrent, redFlags: section?.redFlags, additionalHistory: section?.additionalHistory }),
    // Objective
    'general-observations': (section) => section?.text,
    'inspection': (section) => section?.inspection?.visual,
    'palpation': (section) => section?.palpation?.findings,
    'regional-assessment': (section) => ({ rom: section?.rom, mmt: section?.mmt, specialTests: section?.specialTests, regionalAssessments: section?.regionalAssessments }),
    'neurological-screening': (section) => section?.neuro?.screening,
  'functional-movement': (section) => section?.functional?.assessment,
  'treatment-performed': (section) => section?.treatmentPerformed,
    // Assessment
    'primary-impairments': (section) => section?.primaryImpairments,
    'icf-classification': (section) => ({ bodyFunctions: section?.bodyFunctions, activityLimitations: section?.activityLimitations, participationRestrictions: section?.participationRestrictions }),
    'pt-diagnosis': (section) => section?.ptDiagnosis,
    'clinical-reasoning': (section) => section?.clinicalReasoning,
    // Plan (dynamic from existing anchors in Plan components)
    'treatment-plan': (section) => section, // composite within Plan
    'in-clinic-treatment-plan': (section) => ({ exerciseTable: section?.exerciseTable, frequency: section?.frequency, duration: section?.duration }),
  'goal-setting': (section) => ({ frequency: section?.frequency, duration: section?.duration, goalsTable: section?.goalsTable }),
    // Billing
    'diagnosis-codes': (section) => section?.diagnosisCodes || section?.icdCodes,
    'cpt-codes': (section) => section?.billingCodes || section?.cptCodes,
  'billing-notes': (section) => section?.skilledJustification || section?.treatmentNotes,
  'orders-referrals': (section) => section?.ordersReferrals
  };

  // Title extraction helper (use only text nodes, ignore toggle UI like the banner 'Show' control)
  const extractTitle = (anchorEl) => {
    const h = anchorEl.querySelector('.subsection-title');
    if (h) {
      // Collect only TEXT_NODE contents to avoid including toggle label text
      const text = Array.from(h.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent)
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
  objective: ['general-observations', 'inspection', 'palpation', 'regional-assessment', 'neurological-screening', 'functional-movement', 'treatment-performed'],
    assessment: ['primary-impairments', 'icf-classification', 'pt-diagnosis', 'clinical-reasoning'],
  plan: ['goal-setting', 'treatment-plan', 'in-clinic-treatment-plan'],
  billing: ['diagnosis-codes', 'cpt-codes', 'orders-referrals']
  };
  const subsectionTitleMap = {
    'hpi': 'History of Present Illness',
    'pain-assessment': 'Symptom Assessment',
    'functional-status': 'Functional Status',
    'additional-history': 'Additional History',
    'general-observations': 'General Observations & Vital Signs',
    'inspection': 'Inspection',
    'palpation': 'Palpation',
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
  'orders-referrals': 'Orders & Referrals'
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
          anchors = anchors.filter(a => vis[a.id] !== false);
        }
        if (anchors.length) {
          return anchors.map(a => ({ id: a.id, label: (a.querySelector('.subsection-title')?.textContent || subsectionTitleMap[a.id] || a.id) }));
        }
      }
    }
    // Fallback to expected anchors
    let ids = (subsectionFallbackMap[sectionId] || []);
    const vis = caseData?.editorSettings?.visibility?.[sectionId];
    if (vis && typeof vis === 'object') {
      ids = ids.filter(id => vis[id] !== false);
    }
    return ids.map(id => ({ id, label: subsectionTitleMap[id] || id }));
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
      complete: 'var(--und-green)'
    };
    const color = colors[status] || 'var(--border)';
    return el('div', { style: `width: 12px; height: 12px; border-radius: 50%; background: ${status === 'empty' ? '#ffffff' : color}; border: 2px solid ${color}; margin-right: 10px; flex-shrink:0;` });
  };

  // Create section navigation item
  const createSectionNav = (section, index) => {
    const isActive = section.id === activeSection;
    const progressInfo = getProgressStatus(section.id, config.caseData);
    
  const navItem = el('div', {
      class: `section-nav-item ${isActive ? 'active' : ''}`,
      onClick: () => onSectionChange(section.id)
    }, [
  // Tri-state progress indicator
  createProgressIndicator(progressInfo.status),
      
      // Section info
      el('div', {
        style: 'margin-left: 12px; flex: 1;'
      }, [
        el('div', {
          style: `
            font-weight: ${isActive ? '600' : '500'};
            font-size: 14px;
            color: inherit;
          `
        }, section.label),
        
  // Tri-state progress text
        el('div', {
          class: 'nav-progress-text',
          style: 'font-size: 12px; margin-top: 2px;'
  }, progressInfo.status === 'complete' ? 'Complete' : 
     progressInfo.status === 'partial' ? 'In Progress' : 'Not Started')
      ])
    ]);

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
    let anchors = Array.from(contentRoot?.querySelectorAll('.section-anchor') || [])
      .filter(a => a.closest(`.${section.id}-section`));
    // Filter by case-level visibility settings for both faculty and students
    const vis = config.caseData?.editorSettings?.visibility?.[section.id];
    if (vis && typeof vis === 'object') {
      anchors = anchors.filter(a => vis[a.id] !== false);
    }

    const subs = anchors.map(a => ({ id: a.id, label: extractTitle(a) }));

    return el('div', { class: 'subsection-toc' }, subs.map(sub => {
      const sectionData = config.caseData?.[section.id];
      // Resolve data by ID using mapping if available
      const resolver = subsectionDataResolvers[sub.id];
      let subsectionData = resolver ? resolver(sectionData) : (sectionData?.[sub.id] ?? null);
      const subsectionStatus = getSubsectionStatus(subsectionData, sub.id, sectionData);

      const row = el('div', {
        class: 'subsection-item',
        style: `display:flex; align-items:center; padding:4px 8px; font-size:12px; cursor:pointer; transition:all 0.2s ease; border-radius:4px;`,
        onClick: () => {
          const anchor = document.getElementById(sub.id);
          if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, [
        createSubsectionIndicator(subsectionStatus),
        el('span', {}, sub.label)
      ]);

  // No sidebar toggles; toggles live in subsection banners now

      return row;
    }));
  };

  // Create mobile toggle button
  const mobileToggle = el('button', {
    class: 'nav-toggle',
    style: `
      display: none;
      position: fixed;
      top: 70px;
      left: 20px;
      z-index: 1001;
  background: var(--und-green);
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `,
    onClick: () => {
      sidebar.classList.toggle('mobile-open');
      const mainContent = document.querySelector('.main-content-with-sidebar');
      const stickyTopBar = document.querySelector('.sticky-top-bar');
      
      if (mainContent) {
        mainContent.classList.toggle('nav-collapsed');
      }
      
      if (stickyTopBar) {
        stickyTopBar.classList.toggle('nav-collapsed');
      }
    }
  }, [
    el('span', { style: 'font-size: 18px;' }, '☰')
  ]);

  // Allow student to rename blank notes: prefer draft.noteTitle when present
  const computedCaseInfo = { ...caseInfo };
  try {
    const isStudent = !isFacultyMode;
    const isBlank = typeof (caseData?.id || '') === 'string' ? String(caseData.id).startsWith('blank') : false;
    const draft = (window && window.currentDraft) ? window.currentDraft : null;
    if (isStudent && isBlank && draft) {
      if (draft.noteTitle && draft.noteTitle.trim()) {
        computedCaseInfo.title = draft.noteTitle.trim();
      }
    }
  } catch {}

  // Create the sidebar navigation
  const sidebar = el('div', {
    class: 'chart-navigation'
  }, [
    // Navigation panel (white card stack)
    el('div', {
      class: 'sidebar-nav-panel',
      role: 'navigation',
      'aria-label': 'Chart sections'
    }, [
      // Case summary card shown above SOAP tracker as a peer card (no extra container)
      (() => {
        if (config.isFacultyMode) {
          // Faculty always gets editable header with an explicit Edit button
          return createEditableCaseHeader(computedCaseInfo, config.onCaseInfoUpdate, { forceShowEditButton: true, showPencil: false });
        }
        // Student-owned blank notes: allow editing in the sidebar
        // Robust blank detection: prefer caseData.id, fallback to URL hash
        let isStudentBlank = false;
        try {
          const idStr = String(config.caseData?.id || '');
          if (idStr.startsWith('blank')) isStudentBlank = true;
          if (!isStudentBlank && typeof window !== 'undefined') {
            const hash = window.location.hash || '';
            const m = hash.match(/case=([^&]+)/);
            const idFromHash = m ? decodeURIComponent(m[1]) : '';
            if (idFromHash && idFromHash.startsWith('blank')) isStudentBlank = true;
          }
        } catch {}
        if (isStudentBlank) {
          // Show any student-provided values from draft
          try {
            const d = (window && window.currentDraft) ? window.currentDraft : {};
            if (d?.snapshot) {
              if (d.snapshot.dob) computedCaseInfo.dob = d.snapshot.dob;
              if (d.snapshot.age) computedCaseInfo.age = d.snapshot.age;
              if (d.snapshot.sex) computedCaseInfo.sex = d.snapshot.sex;
            }
            if (d?.meta) {
              if (d.meta.setting) computedCaseInfo.setting = d.meta.setting;
              if (d.meta.acuity) computedCaseInfo.acuity = d.meta.acuity;
              if (d.meta.title) computedCaseInfo.title = d.meta.title;
            }
          } catch {}
          return createEditableCaseHeader(computedCaseInfo, (info) => {
            // Bubble up to editor handler which persists into draft
            config.onCaseInfoUpdate?.(info);
          }, { preferEditOnClick: true, forceShowEditButton: true });
        }
        return createReadOnlyCaseHeader(computedCaseInfo);
      })(),
      // Actions: place Export button directly under case description
      el('div', { style: 'margin: 8px 0 12px 0; display:flex; gap:8px; justify-content: stretch;' }, [
        el('button', {
          class: 'btn primary',
          style: 'flex:1;',
          title: 'Export this chart to a Word document',
      onClick: () => {
            try {
              const cd = config.caseData || {};
        const draft = (window && window.currentDraft) ? window.currentDraft : (cd || {});
        // If student note has a title, surface it as the case title for export context
              try {
                if (draft && typeof cd === 'object') {
                  if (draft.noteTitle) cd.title = draft.noteTitle;
                  if (draft.snapshot) {
                    cd.snapshot = { ...(cd.snapshot || {}), ...draft.snapshot };
                  }
                  if (draft.meta) {
                    cd.meta = { ...(cd.meta || {}), ...draft.meta };
                  }
                }
              } catch {}
              exportToWord(cd, draft);
            } catch (e) {
              console.error('Export to Word failed to start:', e);
              alert('Unable to start Word export.');
            }
          }
        }, 'Export to Word')
      ]),
      // Section cards + subsections
      ...sections.map((section, index) => 
        el('div', {}, [
          createSectionNav(section, index),
          createSubsectionTOC(section)
        ])
      ),
      // No footer actions; Export button moved to the top under case header
    ])
  ]);

  // Add mobile toggle to body
  setTimeout(() => {
    if (!document.querySelector('.nav-toggle')) {
      document.body.appendChild(mobileToggle);
    }
  }, 100);

  // Enhance current section content with banner toggles + visibility rules
  setTimeout(() => {
    applySubsectionVisibilityControls({
      activeSection,
      isFacultyMode,
      caseData,
      onEditorSettingsChange
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
        statusDot.style.background = '#fbbf24';
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
  Array.from(newSidebar.children).forEach(child => {
    sidebar.appendChild(child);
  });
  // Re-apply visibility controls on current content after refresh
  setTimeout(() => {
    try {
      applySubsectionVisibilityControls({
        activeSection: config.activeSection,
        isFacultyMode: !!config.isFacultyMode,
        caseData: config.caseData || {},
        onEditorSettingsChange: config.onEditorSettingsChange
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
  return subsections.map(sub => 
    el('div', {
      id: sub.id,
      class: 'section-anchor',
      style: 'scroll-margin-top: 80px;' // Account for sticky headers
    })
  );
}
