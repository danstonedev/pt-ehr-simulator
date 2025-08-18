// Application Constants
// Centralized configuration and constants for better maintainability

export const STORAGE_KEYS = {
  CASES: 'pt_emr_cases',
  CASE_COUNTER: 'pt_emr_case_counter',
  USER_PREFERENCES: 'pt_emr_preferences'
};

export const ROUTES = {
  HOME: '#/',
  STUDENT_CASES: '#/student/cases',
  STUDENT_DRAFTS: '#/student/drafts',
  STUDENT_EDITOR: '#/student/editor',
  INSTRUCTOR_CASES: '#/instructor/cases',
  INSTRUCTOR_EDITOR: '#/instructor/editor',
  PREVIEW: '#/preview'
};

export const APP_CONFIG = {
  DEFAULT_PORT: 3000,
  MAX_CASE_TITLE_LENGTH: 100,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  SUPPORTED_REGIONS: [
    'Cervical', 'Thoracic', 'Lumbar', 'Shoulder', 'Elbow', 
    'Wrist/Hand', 'Hip', 'Knee', 'Ankle/Foot'
  ],
  CLINICAL_SETTINGS: [
    'Outpatient Orthopedic', 'Inpatient Acute', 'Skilled Nursing',
    'Home Health', 'Pediatric', 'Neurologic Rehab'
  ]
};

export const UI_CONSTANTS = {
  LOADING_DELAY: 100,
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300
};
