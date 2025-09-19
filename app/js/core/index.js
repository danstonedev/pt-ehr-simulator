// Core Application Barrel Export
// Main entry point for core application modules

export { route, navigate, startRouter } from './router.js';
// Removed store re-exports to avoid static bundle coupling; import from './store.js' directly where needed
export { validateCase, ensureDataIntegrity, migrateOldCaseData } from './schema.js';
export { storage } from './adapters/storageAdapter.js';
export { url } from './adapters/urlAdapter.js';
export * as urlCore from './url.js';
