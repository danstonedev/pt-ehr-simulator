// PlanMain.js - Main Plan Module (SOAP-P)
// Comprehensive treatment planning and goal setting

// form-components are imported within subsections as needed
import { el } from '../../../ui/utils.js';
import { TreatmentPlan } from './TreatmentPlan.js';
import { GoalSetting } from './GoalSetting.js';

/**
 * Creates the complete SOAP Plan section
 * Evidence-based treatment planning with SMART goals
 * @param {Object} planData - Current plan data
 * @param {Function} onUpdate - Callback when data changes
 * @returns {HTMLElement} Complete plan section
 */
export function createPlanSection(planData, onUpdate) {
  const section = el('div', {
    class: 'plan-section',
    id: 'plan-section',
  });

  // Initialize plan data structure
  let data = {
    // Treatment planning
    interventions: [],
    frequency: '',
    duration: '',
    ...planData,
  };

  // Initialize comprehensive data structure for PT practice
  data = {
    // Treatment approach and interventions
    treatmentPlan: '',
    exerciseFocus: '',
    exercisePrescription: '',
    manualTherapy: '',
    modalities: [],

    // Editable table data
    exerciseTable: {},
    manualTherapyTable: {},
    modalitiesTable: {},
    scheduleTable: {},
    progressTable: {},
    educationTable: {},
    goalsTable: {},

    // Scheduling and goals
    frequency: '',
    duration: '',
    shortTermGoals: '',
    longTermGoals: '',
    patientEducation: '',

    // Merge with provided planData
    ...planData,
  };

  // Update helper
  const updateField = (field, value) => {
    data[field] = value;
    onUpdate(data);
  };

  // Create subsections (SMART Goals first, then Plan of Care)
  section.append(GoalSetting.create(data, updateField));
  section.append(TreatmentPlan.create(data, updateField));

  return section;
}

// Export alias for consistency
export { createPlanSection as PlanSection };
