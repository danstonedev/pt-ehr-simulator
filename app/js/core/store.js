import { validateCase, ensureDataIntegrity, migrateOldCaseData } from './schema.js';
import { storage } from './adapters/storageAdapter.js';

// --- Pure Frontend Data Store (No Backend Required) ---
// All data stored via storage adapter with case/draft separation

const CASES_KEY = 'pt_emr_cases';
const CASE_COUNTER_KEY = 'pt_emr_case_counter';

// Local dev detection (only auto-publish to server when running locally)
const IS_LOCAL_DEV =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
// Explicit toggle for optional local server sync (avoids noisy 5173 errors by default)
const USE_LOCAL_SERVER =
  typeof window !== 'undefined' &&
  ((IS_LOCAL_DEV && window.location.port === '5173') || storage.getItem('useLocalServer') === '1');

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
    const stored = storage.getItem(CASES_KEY);
    if (stored) {
      const cases = JSON.parse(stored);
      // Apply migrations to all cases
      Object.keys(cases).forEach((id) => {
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
    storage.setItem(CASES_KEY, JSON.stringify(cases));
    return true;
  } catch (error) {
    console.error('Failed to save cases to storage:', error);
    return false;
  }
}

function getNextCaseId() {
  try {
    let counter = parseInt(storage.getItem(CASE_COUNTER_KEY) || '0', 10);
    counter++;
    storage.setItem(CASE_COUNTER_KEY, counter.toString());
    return `case_${counter}`;
  } catch (error) {
    console.error('Failed to generate case ID:', error);
    return `case_${Date.now()}`;
  }
}

// Debug flag toggled by ?debug=1 (default off)
const DEBUG = (() => {
  try {
    const usp = new URLSearchParams(window.location.search);
    return usp.get('debug') === '1';
  } catch {
    return false;
  }
})();
const debugWarn = (...args) => {
  if (DEBUG) console.warn(...args);
};

// Helper: fetch JSON with minimal noise (no warn on 404 for fallbacks)
async function fetchJson(url, { silent = false } = {}) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      if (!silent) console.warn(`❌ Fetch failed for ${url}: ${res.status} ${res.statusText}`);
      else debugWarn(`Fetch candidate failed: ${url} -> ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    if (!silent) console.error(`🚨 Error fetching ${url}:`, error);
    else debugWarn(`Error on candidate ${url}:`, error);
    return null;
  }
}

// Try multiple URLs; only warn once if all fail
async function tryFetchJson(urls) {
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    const data = await fetchJson(u, { silent: i < urls.length - 1 });
    if (data) return data;
  }
  console.warn(`❌ Fetch failed for all candidates. First: ${urls[0]}`);
  return null;
}

// Load cases from manifest file-based layout: app/data/cases/manifest.json
async function loadCasesFromManifest() {
  debugWarn('🔍 Loading cases from manifest...');

  // Prefer relative paths first; include '/app/...' for repo-root servers
  const manifest = await tryFetchJson([
    'data/cases/manifest.json',
    './data/cases/manifest.json',
    '/data/cases/manifest.json',
    '/app/data/cases/manifest.json',
  ]);

  debugWarn('📄 Manifest loaded:', manifest);

  if (!manifest || !Array.isArray(manifest.categories)) {
    console.warn('❌ No valid manifest or categories found');
    return {};
  }

  const collected = {};
  for (const cat of manifest.categories) {
    debugWarn(`📂 Processing category: ${cat.name}`);
    if (!Array.isArray(cat.cases)) continue;

    for (const c of cat.cases) {
      if (!c?.file) continue;
      debugWarn(`🔄 Loading case file candidates for: ${c.file}`);
      const caseWrapper = await tryFetchJson([
        `data/${c.file}`,
        `./data/${c.file}`,
        `/data/${c.file}`,
        `/app/data/${c.file}`,
      ]);

      if (!caseWrapper || !caseWrapper.id || !caseWrapper.caseObj) {
        console.warn(`❌ Failed to load case: ${c.file}`);
        continue;
      }

      debugWarn(`✅ Successfully loaded case: ${caseWrapper.id}`);
      // Ensure integrity/migrations
      caseWrapper.caseObj = migrateOldCaseData(caseWrapper.caseObj);
      caseWrapper.caseObj = ensureDataIntegrity(caseWrapper.caseObj);
      collected[caseWrapper.id] = caseWrapper;
    }
  }

  debugWarn('📋 Total cases collected:', Object.keys(collected));
  return collected;
}

// --- Initialize with data file (app/data/cases.json) if empty; fallback to sample ---
async function ensureCasesInitialized() {
  const existing = loadCasesFromStorage();
  debugWarn('Existing cases in storage:', Object.keys(existing));
  if (Object.keys(existing).length > 0) return existing;

  try {
    // Optional local server (only when explicitly enabled)
    if (USE_LOCAL_SERVER) {
      try {
        const serverRes = await fetch('http://localhost:5173/cases', { cache: 'no-store' });
        if (serverRes.ok) {
          const serverJson = await serverRes.json();
          if (serverJson && typeof serverJson === 'object' && !Array.isArray(serverJson)) {
            Object.keys(serverJson).forEach((id) => {
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
    debugWarn('Loading cases from manifest...');
    const manifestMap = await loadCasesFromManifest();
    debugWarn('Loaded cases from manifest:', Object.keys(manifestMap));
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

// Force reload cases from manifest (clears storage cache)
export const forceReloadCases = async () => {
  debugWarn('Force reloading cases...');
  storage.removeItem(CASES_KEY);
  return await ensureCasesInitialized();
};

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
  // Normalize first, then validate to avoid false warnings
  const cleanedData = ensureDataIntegrity(caseData);
  const validationErrors = validateCase(cleanedData);
  if (validationErrors.length > 0) {
    console.warn('Case validation warnings:', validationErrors);
  }

  // Generate new case wrapper
  const newCase = {
    id: getNextCaseId(),
    title: cleanedData.meta?.title || 'Untitled Case',
    latestVersion: 0,
    caseObj: cleanedData,
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
  // Normalize first, then validate to avoid false warnings
  const cleanedData = ensureDataIntegrity(caseData);
  const validationErrors = validateCase(cleanedData);
  if (validationErrors.length > 0) {
    console.warn('Case validation warnings:', validationErrors);
  }

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
    const map = storage.getItem(CASES_KEY);
    const resp = await fetch('http://localhost:5173/cases', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(map),
    });
    if (!resp.ok) throw new Error('Server returned ' + resp.status);
    return true;
  } catch (e) {
    console.warn('Publish to server failed:', e);
    return false;
  }
};

// --- Draft Management (using storage adapter seam) ---

export const saveDraft = (caseId, encounter, draftData) => {
  try {
    const key = `draft_${caseId}_${encounter}`;
    storage.setItem(key, JSON.stringify(draftData));
    return true;
  } catch (error) {
    console.error('Failed to save draft:', error);
    return false;
  }
};

export const loadDraft = (caseId, encounter) => {
  // Skip local draft loading for NEW cases in development mode only
  const isDevelopmentMode =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isNewCase = caseId === 'new';
  const skipLoading = isDevelopmentMode && isNewCase;

  if (skipLoading) {
    return null;
  }

  try {
    const key = `draft_${caseId}_${encounter}`;
    const stored = storage.getItem(key);
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
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to delete draft:', error);
    return false;
  }
};

export const listDrafts = () => {
  try {
    const drafts = {};
    const keys = storage.keys();
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key && key.startsWith('draft_')) {
        const parts = key.split('_');
        if (parts.length >= 3) {
          const caseId = parts.slice(1, -1).join('_');
          const encounter = parts[parts.length - 1];
          const data = JSON.parse(storage.getItem(key));

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
