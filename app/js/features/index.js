// Features Barrel Export
// Single entry point for all feature modules

// Case Management
export {
  initializeCase,
  initializeDraft,
  createErrorDisplay as createCaseErrorDisplay,
  createLoadingIndicator,
} from './case-management/CaseInitialization.js';

// Navigation
export {
  createChartNavigation,
  createSectionAnchors,
  refreshChartNavigation,
  openEditCaseModal,
} from './navigation/ChartNavigation.js';
export { createSimpleTabs, createStickyTopBar } from './navigation/NavigationHeader.js';

// SOAP Documentation
export * from './soap/index.js';
