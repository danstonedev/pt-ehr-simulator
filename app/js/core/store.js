import { validateCase, ensureDataIntegrity, migrateOldCaseData } from './schema.js';

// --- Pure Frontend Data Store (No Backend Required) ---
// All data stored in localStorage with case/draft separation

const CASES_KEY = 'pt_emr_cases';
const CASE_COUNTER_KEY = 'pt_emr_case_counter';

// --- Case Storage Helpers ---

function loadCasesFromStorage() {
  try {
    const stored = localStorage.getItem(CASES_KEY);
    if (stored) {
      const cases = JSON.parse(stored);
      // Apply migrations to all cases
      Object.keys(cases).forEach(id => {
        if (cases[id] && cases[id].caseObj) {
          cases[id].caseObj = migrateOldCaseData(cases[id].caseObj);
          cases[id].caseObj = ensureDataIntegrity(cases[id].caseObj);
        }
      });
      return cases;
    }
    return {};
  } catch (error) {
    console.error('Failed to load cases from storage:', error);
    return {};
  }
}

function saveCasesToStorage(cases) {
  try {
    localStorage.setItem(CASES_KEY, JSON.stringify(cases));
    return true;
  } catch (error) {
    console.error('Failed to save cases to storage:', error);
    return false;
  }
}

function getNextCaseId() {
  try {
    let counter = parseInt(localStorage.getItem(CASE_COUNTER_KEY) || '0', 10);
    counter++;
    localStorage.setItem(CASE_COUNTER_KEY, counter.toString());
    return `case_${counter}`;
  } catch (error) {
    console.error('Failed to generate case ID:', error);
    return `case_${Date.now()}`;
  }
}

// --- Initialize with sample data if empty ---
function initializeSampleData() {
  const cases = loadCasesFromStorage();
  if (Object.keys(cases).length === 0) {
    console.log('🎯 No cases found - initializing with sample data');
    
    const sampleCase = {
      id: 'demo_case_1',
      title: 'Low Back Pain - Acute Episode',
      latestVersion: 0,
      caseObj: {
        meta: {
          title: 'Low Back Pain - Acute Episode',
          setting: 'Outpatient',
          regions: ['lumbar_spine'],
          acuity: 'acute',
          diagnosis: 'Musculoskeletal'
        },
        snapshot: {
          age: '45',
          sex: 'female',
          teaser: 'A 45-year-old female presents with acute low back pain after lifting heavy boxes.'
        },
        history: {
          chief_complaint: 'Low back pain for 3 days',
          hpi: 'Patient reports sudden onset of sharp low back pain while lifting heavy boxes at work 3 days ago.',
          pmh: ['No significant past medical history'],
          meds: ['Ibuprofen 400mg as needed'],
          red_flag_signals: []
        },
        findings: {
          vitals: { bp: '120/80', hr: '72', rr: '16', temp: '98.6', o2sat: '98%', pain: '7/10' },
          rom: {},
          mmt: {},
          special_tests: [],
          gait: { device: 'none', distance_m: 50 },
          outcome_options: []
        },
        encounters: {
          eval: { 
            notes_seed: 'Initial evaluation for acute low back pain',
            subjective: {
              chiefComplaint: 'Low back pain for 3 days',
              currentHistory: 'Patient reports sudden onset of sharp low back pain while lifting heavy boxes at work 3 days ago. Pain is 7/10 in intensity, sharp and stabbing in nature.',
              additionalHistory: 'No radiation down legs. Pain worse with bending forward and prolonged sitting. Improved with rest and ibuprofen.'
            },
            objective: {
              inspection: { visual: 'Patient appears uncomfortable, guarded posture' },
              palpation: { findings: 'Tenderness over L4-L5 paraspinals' },
              neuro: { screening: 'DTRs 2+ and symmetric, sensation intact' },
              functional: { assessment: 'Difficulty with forward bending, normal gait pattern' }
            }
          },
          daily: [],
          progress: null,
          discharge: null
        }
      }
    };
    
    const initialCases = { [sampleCase.id]: sampleCase };
    saveCasesToStorage(initialCases);
    return initialCases;
  }
  return cases;
}

// --- Public API (matches original backend interface) ---

export const listCases = async () => {
  const cases = initializeSampleData();
  return Object.values(cases);
};

export const getCase = async (id) => {
  const cases = loadCasesFromStorage();
  const caseData = cases[id];
  if (caseData && caseData.caseObj) {
    // Apply data migrations and integrity checks
    caseData.caseObj = migrateOldCaseData(caseData.caseObj);
    caseData.caseObj = ensureDataIntegrity(caseData.caseObj);
  }
  return caseData || null;
};

export const createCase = async (caseData) => {
  // Validate case data
  const validationErrors = validateCase(caseData);
  if (validationErrors.length > 0) {
    console.warn('Case validation warnings:', validationErrors);
  }
  
  // Ensure data integrity
  const cleanedData = ensureDataIntegrity(caseData);
  
  // Generate new case wrapper
  const newCase = {
    id: getNextCaseId(),
    title: cleanedData.meta?.title || 'Untitled Case',
    latestVersion: 0,
    caseObj: cleanedData
  };
  
  // Save to storage
  const cases = loadCasesFromStorage();
  cases[newCase.id] = newCase;
  saveCasesToStorage(cases);
  
  console.log('✅ Case created:', newCase.id);
  return newCase;
};

export const updateCase = async (id, caseData) => {
  // Validate case data
  const validationErrors = validateCase(caseData);
  if (validationErrors.length > 0) {
    console.warn('Case validation warnings:', validationErrors);
  }
  
  // Ensure data integrity
  const cleanedData = ensureDataIntegrity(caseData);
  
  // Update existing case
  const cases = loadCasesFromStorage();
  if (!cases[id]) {
    throw new Error(`Case ${id} not found`);
  }
  
  cases[id].caseObj = cleanedData;
  cases[id].title = cleanedData.meta?.title || cases[id].title;
  cases[id].latestVersion = (cases[id].latestVersion || 0) + 1;
  
  saveCasesToStorage(cases);
  
  console.log('✅ Case updated:', id);
  return cases[id];
};

export const deleteCase = async (id) => {
  const cases = loadCasesFromStorage();
  if (cases[id]) {
    delete cases[id];
    saveCasesToStorage(cases);
    console.log('✅ Case deleted:', id);
  }
  return { ok: true };
};

export const upsertCase = (c) => (c.id ? updateCase(c.id, c.caseObj) : createCase(c));

// --- Draft Management (unchanged - these were already localStorage-based) ---

export const saveDraft = (caseId, encounter, draftData) => {
  try {
    const key = `draft_${caseId}_${encounter}`;
    localStorage.setItem(key, JSON.stringify(draftData));
    return true;
  } catch (error) {
    console.error('Failed to save draft:', error);
    return false;
  }
};

export const loadDraft = (caseId, encounter) => {
  // Skip localStorage loading for NEW cases in development mode only
  const isDevelopmentMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isNewCase = caseId === 'new';
  const skipLoading = isDevelopmentMode && isNewCase;
  
  if (skipLoading) {
    console.log('Development mode: Skipping localStorage load for new case');
    return null;
  }
  
  try {
    const key = `draft_${caseId}_${encounter}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Apply data migrations if needed
      return migrateOldCaseData(parsed);
    }
    return null;
  } catch (error) {
    console.error('Failed to load draft:', error);
    return null;
  }
};

export const deleteDraft = (caseId, encounter) => {
  try {
    const key = `draft_${caseId}_${encounter}`;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to delete draft:', error);
    return false;
  }
};

export const listDrafts = () => {
  try {
    const drafts = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('draft_')) {
        const parts = key.split('_');
        if (parts.length >= 3) {
          const caseId = parts.slice(1, -1).join('_');
          const encounter = parts[parts.length - 1];
          const data = JSON.parse(localStorage.getItem(key));
          
          if (!drafts[caseId]) drafts[caseId] = {};
          drafts[caseId][encounter] = data;
        }
      }
    }
    return drafts;
  } catch (error) {
    console.error('Failed to list drafts:', error);
    return {};
  }
};
