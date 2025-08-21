import { validateCase, ensureDataIntegrity, migrateOldCaseData } from './schema.js';

// --- Pure Frontend Data Store (No Backend Required) ---
// All data stored in localStorage with case/draft separation

const CASES_KEY = 'pt_emr_cases';
const CASE_COUNTER_KEY = 'pt_emr_case_counter';

// Local dev detection (only auto-publish to server when running locally)
const IS_LOCAL_DEV = (typeof window !== 'undefined') && (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
);
// Explicit toggle for optional local server sync (avoids noisy 5173 errors by default)
const USE_LOCAL_SERVER = (typeof window !== 'undefined') && (
  (IS_LOCAL_DEV && window.location.port === '5173') || localStorage.getItem('useLocalServer') === '1'
);

// Lightweight debounce for auto-publish so we don't spam the server
let __publishScheduled = false;
function scheduleAutoPublish() {
  if (!USE_LOCAL_SERVER) return; // Skip when local server sync is disabled/not running
  if (__publishScheduled) return;
  __publishScheduled = true;
  setTimeout(async () => {
    try {
      await publishToServer();
    } finally {
      __publishScheduled = false;
    }
  }, 500);
}

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

// Helper to fetch JSON safely
async function fetchJson(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

// Load cases from manifest file-based layout: app/data/cases/manifest.json
async function loadCasesFromManifest() {
  const manifest = await fetchJson('/data/cases/manifest.json');
  if (!manifest || !Array.isArray(manifest.categories)) return {};
  const collected = {};
  for (const cat of manifest.categories) {
    if (!Array.isArray(cat.cases)) continue;
    for (const c of cat.cases) {
      if (!c?.file) continue;
      const caseWrapper = await fetchJson(`/data/${c.file}`);
      if (!caseWrapper || !caseWrapper.id || !caseWrapper.caseObj) continue;
      // Ensure integrity/migrations
      caseWrapper.caseObj = migrateOldCaseData(caseWrapper.caseObj);
      caseWrapper.caseObj = ensureDataIntegrity(caseWrapper.caseObj);
      collected[caseWrapper.id] = caseWrapper;
    }
  }
  return collected;
}

// --- Initialize with data file (app/data/cases.json) if empty; fallback to sample ---
async function ensureCasesInitialized() {
  const existing = loadCasesFromStorage();
  if (Object.keys(existing).length > 0) return existing;

  try {
    // Optional local server (only when explicitly enabled)
    if (USE_LOCAL_SERVER) {
      try {
        const serverRes = await fetch('http://localhost:5173/cases', { cache: 'no-store' });
        if (serverRes.ok) {
          const serverJson = await serverRes.json();
          if (serverJson && typeof serverJson === 'object' && !Array.isArray(serverJson)) {
            Object.keys(serverJson).forEach(id => {
              if (serverJson[id] && serverJson[id].caseObj) {
                serverJson[id].caseObj = migrateOldCaseData(serverJson[id].caseObj);
                serverJson[id].caseObj = ensureDataIntegrity(serverJson[id].caseObj);
              }
            });
            saveCasesToStorage(serverJson);

            return serverJson;
          }
        }
      } catch {}
    }

    // Load cases from manifest (new file-based structure)
    const manifestMap = await loadCasesFromManifest();
    if (Object.keys(manifestMap).length > 0) {
      saveCasesToStorage(manifestMap);
      return manifestMap;
    }
  } catch (e) {
    console.warn('Unable to load cases from manifest, falling back to sample data.', e);
  }

  // No cases available - return empty
  console.warn('No cases found in manifest or storage');
  return {};
}

// --- Public API (matches original backend interface) ---

export const listCases = async () => {
  const cases = await ensureCasesInitialized();
  return Object.values(cases);
};

export const getCase = async (id) => {
  const cases = await ensureCasesInitialized();
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
  // Auto-publish to local server if available
  scheduleAutoPublish();
  

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
  // Auto-publish to local server if available
  scheduleAutoPublish();
  

  return cases[id];
};

export const deleteCase = async (id) => {
  const cases = loadCasesFromStorage();
  if (cases[id]) {
    delete cases[id];
    saveCasesToStorage(cases);
  // Auto-publish to local server if available
  scheduleAutoPublish();

  }
  return { ok: true };
};

export const upsertCase = (c) => (c.id ? updateCase(c.id, c.caseObj) : createCase(c));

// --- Export helpers for website publishing ---
export const exportCasesMap = () => {
  // Returns the full cases dictionary keyed by id for writing to app/data/cases.json
  return loadCasesFromStorage();
};

// Optional: publish current cases to basic server (if running)
export const publishToServer = async () => {
  if (!USE_LOCAL_SERVER) return false;
  try {
    const map = loadCasesFromStorage();
    const resp = await fetch('http://localhost:5173/cases', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(map)
    });
    if (!resp.ok) throw new Error('Server returned ' + resp.status);
    return true;
  } catch (e) {
    console.warn('Publish to server failed:', e);
    return false;
  }
};

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
