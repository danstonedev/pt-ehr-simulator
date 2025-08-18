// Core Application Barrel Export
// Main entry point for core application modules

export { route, navigate, startRouter } from './router.js';
export { 
  getCase, 
  createCase, 
  updateCase, 
  deleteCase, 
  listCases 
} from './store.js';
export { 
  validateCase, 
  ensureDataIntegrity, 
  migrateOldCaseData 
} from './schema.js';
