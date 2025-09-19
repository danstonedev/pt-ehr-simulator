// Features Barrel Export
// Single entry point for all feature modules

// Case Management
export {
  initializeCase,
  initializeDraft,
  createErrorDisplay as createCaseErrorDisplay,
  createLoadingIndicator,
} from './case-management/CaseInitialization.js';

// Navigation: Do NOT re-export heavy navigation functions here to avoid
// accidentally creating static bundle edges. Import from './navigation/api.js'
// where lazy accessors are provided.

// SOAP Documentation
export * from './soap/index.js';
