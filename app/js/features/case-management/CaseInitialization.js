// CaseInitialization.js - Case Setup & Data Management Module
// Handles case loading, draft initialization, localStorage management, and error handling

import { getCase } from '../../core/store.js';
import { el } from '../../ui/utils.js';

/**
 * Creates a blank case template for new case creation
 * @returns {Object} Blank case structure
 */
function createBlankCaseTemplate() {
  return {
    meta: {
      title: '',
      setting: 'Outpatient',
      regions: [],
      acuity: 'acute',
      diagnosis: 'Musculoskeletal'
    },
    snapshot: {
      age: '',
      sex: 'unspecified',
      teaser: ''
    },
    history: {
      chief_complaint: '',
      hpi: '',
      pmh: [],
      meds: [],
      red_flag_signals: []
    },
    findings: {
      vitals: { bp: '', hr: '', rr: '', temp: '', o2sat: '', pain: '' },
      rom: {},
      mmt: {},
      special_tests: [],
      gait: { device: 'none', distance_m: 0 },
      outcome_options: []
    },
    encounters: {
      eval: { notes_seed: '' },
      daily: [],
      progress: null,
      discharge: null
    }
  };
}

/**
 * Creates default draft structure with enhanced subjective fields
 * @returns {Object} Default draft structure
 */
function createDefaultDraft() {
  return { 
    subjective: {
      chiefComplaint: '',
      historyOfPresentIllness: '',
      painLocation: '',
      painScale: '',
      painQuality: '',
      aggravatingFactors: '',
      easingFactors: '',
      functionalLimitations: '',
      priorLevel: '',
      patientGoals: '',
      medicationsCurrent: '',
      redFlags: '',
      additionalHistory: ''
    }, 
    objective: { 
      text: '', 
      inspection: { visual: '' },
      palpation: { findings: '' },
      neuro: { screening: '' },
      functional: { assessment: '' },
      regionalAssessments: {
        expandedRegions: {},
        romData: {},
        mmtData: {},
        testData: {}
      },
      rom: {}, 
      mmt: {} 
    }, 
    assessment: {
      primaryImpairments: '',
      bodyFunctions: '',
      activityLimitations: '',
      participationRestrictions: '',
      ptDiagnosis: '',
      prognosticFactors: '',
      clinicalReasoning: ''
    }, 
    goals: '', 
    plan: {
      // Enhanced plan object structure
      interventions: [], // Array for intervention row cards
      frequency: '',
      duration: '',
      shortTermGoals: '',
      longTermGoals: '',
      patientEducation: ''
    }, 
    billing: {
      diagnosisCodes: [
        { code: '', description: '', isPrimary: true }
      ],
      billingCodes: [
        { code: '', units: '', timeSpent: '' }
      ],
      ordersReferrals: [
        { type: '', details: '' }
      ],
      skilledJustification: '',
      treatmentNotes: '',
      legacyText: ''
    },
    // Instructor editor settings are stored on the case object; draft uses this only in faculty mode
    editorSettings: {
      visibility: {
        subjective: {
          'hpi': true,
          'pain-assessment': true,
          'functional-status': true,
          'additional-history': true
        },
        objective: {
          'general-observations': true,
          'inspection': true,
          'palpation': true,
          'regional-assessment': true,
          'neurological-screening': true,
          'functional-movement': true
        },
        assessment: {
          'primary-impairments': true,
          'icf-classification': true,
          'pt-diagnosis': true,
          'clinical-reasoning': true
        },
        plan: {
          'treatment-plan': true,
          'goal-setting': true
        },
        billing: {
          'diagnosis-codes': true,
          'cpt-codes': true,
          'orders-referrals': true
        }
      }
    }
  };
}

/**
 * Populates draft from case data for faculty editing (answer key mode)
 * @param {Object} draft - The draft object to populate
 * @param {Object} caseData - The case data to load from
 * @returns {Object} Populated draft
 */
function populateDraftFromCaseData(draft, caseData) {
  // This function converts case data structure to draft structure
  // Faculty members edit the "answer key" by populating the draft with case data
  
  if (caseData.history) {
    draft.subjective.chiefComplaint = caseData.history.chief_complaint || '';
    draft.subjective.historyOfPresentIllness = caseData.history.hpi || '';
    // Map other case history fields to draft subjective fields
  }
  
  if (caseData.findings) {
    // Map case findings to draft objective
    if (caseData.findings.vitals) {
      // Convert vitals data to objective format
    }
    if (caseData.findings.rom) {
      draft.objective.rom = caseData.findings.rom;
    }
    if (caseData.findings.mmt) {
      draft.objective.mmt = caseData.findings.mmt;
    }
  }
  
  // For now, return the original draft - this can be expanded as needed
  return draft;
}

/**
 * Loads and initializes case data with proper error handling
 * @param {string} caseId - Case ID to load
 * @param {boolean} isFacultyMode - Whether in faculty mode
 * @param {boolean} isKeyMode - Whether in key mode
 * @returns {Promise<Object>} Case wrapper object or error state
 */
export async function initializeCase(caseId, isFacultyMode = false, isKeyMode = false) {
  try {
    if (caseId === 'new') {
      // Create a new blank case for faculty mode
      if (!isFacultyMode || isKeyMode) {
        return {
          error: true,
          title: isKeyMode ? 'Key View Not Available' : 'Access Denied',
          message: isKeyMode ? 'Answer Key view is only available for existing cases.' : 'Creating new cases is only available to faculty.'
        };
      }
      
      const caseObj = createBlankCaseTemplate();
      return { 
        id: 'new', 
        caseObj: caseObj, 
        latestVersion: 0 
      };
    } else {
      const caseWrapper = await getCase(caseId);
      
      if (!caseWrapper) {
        return {
          error: true,
          title: 'Case not found',
          message: `Could not find case with ID: ${caseId}`
        };
      }
      
      return caseWrapper;
    }
  } catch (error) {
    console.error('Failed to load case:', error);
    return {
      error: true,
      title: 'Error loading case',
      message: `Failed to load case ${caseId}: ${error.message}`,
      details: 'Please check the console for details.'
    };
  }
}

/**
 * Initializes draft data with proper handling for faculty vs student modes
 * @param {string} caseId - Case identifier  
 * @param {string} encounter - Encounter type
 * @param {boolean} isFacultyMode - Whether in faculty mode
 * @param {Object} caseData - The case data object
 * @returns {Object} Draft data and management functions
 */
export function initializeDraft(caseId, encounter, isFacultyMode = false, caseData = null) {
  let draft = createDefaultDraft();
  
  console.log('🎯 INITIALIZING DRAFT:', {
    caseId,
    encounter, 
    isFacultyMode,
    hasCaseData: !!caseData
  });

  if (isFacultyMode) {
    // FACULTY MODE: Load the case data (answer key) into the draft for editing
    console.log('👩‍🏫 Faculty Mode: Loading case data into draft (answer key)');
    
    if (caseData && caseId !== 'new') {
      // Load existing case data into draft for faculty editing
      draft = populateDraftFromCaseData(draft, caseData);
      console.log('📚 Loaded case data into faculty draft');
      // If case has stored editor settings, use them in faculty draft
      if (caseData.editorSettings) {
        draft.editorSettings = caseData.editorSettings;
      }
    }
  } else {
    // STUDENT MODE: Start with blank slate, but try to load any student progress
    console.log('🎓 Student Mode: Starting with blank slate');
    // Students should respect case-level editor settings; do not store them in student draft
    delete draft.editorSettings;
  }
  
  // Development mode: Skip localStorage loading for NEW cases only to prevent cached data issues
  const isDevelopmentMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isNewCase = caseId === 'new';
  const skipLoading = isDevelopmentMode && isNewCase;
  
  if (skipLoading) {
    console.log('Development mode: Skipping localStorage cache for new case (clean state)');
  } else {
    // Local storage key for this specific case
    const localStorageKey = `draft_${caseId}_${encounter}`;
    
    // Try to load existing draft from localStorage
    try {
      const savedDraft = localStorage.getItem(localStorageKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
      
      // Handle both old and new subjective formats
      if (typeof parsed.subjective === 'string') {
        // Old format - migrate to new structure
        draft.subjective.additionalHistory = parsed.subjective;
      } else if (parsed.subjective && typeof parsed.subjective === 'object') {
        // New format - merge with defaults
        draft.subjective = { ...draft.subjective, ...parsed.subjective };
      }
      
      // Handle objective section - merge new regional fields with existing
      if (parsed.objective) {
        draft.objective = { 
          ...draft.objective, 
          ...parsed.objective,
          inspection: parsed.objective.inspection || { visual: '' },
          palpation: parsed.objective.palpation || { findings: '' },
          neuro: parsed.objective.neuro || { screening: '' },
          functional: parsed.objective.functional || { assessment: '' },
          regionalAssessments: parsed.objective.regionalAssessments || {
            expandedRegions: {},
            romData: {},
            mmtData: {},
            testData: {}
          }
        };
      }
      
      if (parsed.assessment) draft.assessment = parsed.assessment;
      if (parsed.goals) draft.goals = parsed.goals;
      if (parsed.plan) draft.plan = { ...draft.plan, ...parsed.plan };
      // For students, discard any editorSettings saved in local drafts to avoid stale overrides
      if (!isFacultyMode) {
        if (parsed.editorSettings) {
          console.log('Discarding local editorSettings from student draft (using case settings)');
        }
        delete draft.editorSettings;
      } else if (parsed.editorSettings) {
        // Faculty can keep their saved editorSettings
        draft.editorSettings = parsed.editorSettings;
      }
        if (parsed.billing) draft.billing = parsed.billing;
        
        console.log('Loaded draft from local storage');
      }
    } catch (error) {
      console.warn('Could not load draft from localStorage:', error);
    }
  }
  
  // Track the current case ID (mutable for new case creation)
  let currentCaseId = caseId;
  
  // Local storage key for saving (used by save function)
  const localStorageKey = `draft_${caseId}_${encounter}`;
  
  // Save function - behavior depends on faculty mode
  const save = async (isKeyMode = false) => {
    // Don't save in key mode (read-only view)
    if (isKeyMode) return;
    
    if (isFacultyMode && caseData) {
      // FACULTY MODE: Save draft content back to the case itself (create answer key)
      console.log('👩‍🏫 Faculty Mode: Saving draft content to case (answer key)');
      
      try {
        // Update case metadata from case info if available
        if (typeof c !== 'undefined' && c) {
          caseData.meta = caseData.meta || {};
          caseData.meta.title = c.title || c.caseTitle || 'Untitled Case';
          caseData.meta.setting = c.setting || 'Outpatient';
          caseData.meta.patientAge = c.patientAge || c.age;
          caseData.meta.patientGender = c.patientGender || c.sex;
          caseData.meta.acuity = c.acuity || 'Routine';
        }
        
        // Update the case object with current draft content
        if (draft.subjective) {
          caseData.encounters = caseData.encounters || {};
          caseData.encounters[encounter] = caseData.encounters[encounter] || {};
          caseData.encounters[encounter].subjective = draft.subjective;
        }
        
        if (draft.objective) {
          caseData.encounters[encounter].objective = draft.objective;
        }
        
        if (draft.assessment) {
          caseData.encounters[encounter].assessment = draft.assessment;
        }
        
        if (draft.plan) {
          caseData.encounters[encounter].plan = draft.plan;
        }
        
        if (draft.billing) {
          caseData.encounters[encounter].billing = draft.billing;
        }
        // Persist instructor editor settings onto the case so students see it
        if (draft.editorSettings) {
          caseData.editorSettings = draft.editorSettings;
        }
        
        // Save the case to the server
        if (currentCaseId === 'new') {
          // For new cases, create a new case
          const { createCase } = await import('../../core/store.js');
          const newCase = await createCase(caseData);
          console.log('✅ New case created with ID:', newCase.id);
          
          // Update the caseId for future saves (extract just the ID)
          currentCaseId = newCase.id;
          
          // Update the URL to reflect the new case ID
          window.history.replaceState({}, '', `#/instructor/${newCase.id}`);
          
        } else {
          // For existing cases, update the existing case
          const { updateCase } = await import('../../core/store.js');
          await updateCase(currentCaseId, caseData);
          console.log('✅ Case content saved to server (answer key updated)');
        }
        
        // Also save to localStorage for draft persistence
        localStorage.setItem(localStorageKey, JSON.stringify(draft));
        
      } catch (error) {
        console.error('❌ Failed to save case content:', error);
        // Fallback to localStorage only
        localStorage.setItem(localStorageKey, JSON.stringify(draft));
      }
    } else {
      // STUDENT MODE: Save to localStorage only (draft work)
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(draft));
        console.log('🎓 Student draft saved locally');
      } catch (error) {
        console.warn('Could not save draft to localStorage:', error);
      }
    }
  };
  
  // Clear draft and localStorage
  const resetDraft = () => {
    if (confirm('Are you sure you want to clear all your work? This cannot be undone.')) {
      draft = createDefaultDraft();
      localStorage.removeItem(localStorageKey);
      console.log('Draft reset and cleared from local storage');
      return true; // Indicates reset occurred
    }
    return false; // Reset cancelled
  };
  
  return {
    draft,
    save,
    resetDraft,
    localStorageKey
  };
}

/**
 * Creates error display element
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {string} details - Additional details (optional)
 * @returns {HTMLElement} Error display element
 */
export function createErrorDisplay(title, message, details = null) {
  const elements = [
    el('h2', {}, title),
    el('p', {}, message)
  ];
  
  if (details) {
    elements.push(el('p', {}, details));
  }
  
  return el('div', { class: 'panel error' }, elements);
}

/**
 * Creates loading indicator element
 * @param {string} message - Loading message
 * @returns {HTMLElement} Loading indicator
 */
export function createLoadingIndicator(message = 'Loading case...') {
  return el('div', { class: 'panel' }, message);
}
