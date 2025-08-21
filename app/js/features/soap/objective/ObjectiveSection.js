// ObjectiveSection.js - Comprehensive Objective Assessment Module
// Handles systematic clinical examination including inspection, palpation, regional assessments

import { textAreaField } from '../../../ui/form-components.js';
import { createMultiRegionalAssessment } from './RegionalAssessments.js';
import { el } from '../../../ui/utils.js';
// CPT widget is intentionally only rendered in BillingSection to avoid duplication

/**
 * Creates the complete objective assessment section with systematic examination approach
 * @param {Object} objectiveData - Current objective assessment data
 * @param {Function} onUpdate - Callback when data changes
 * @returns {HTMLElement} Complete objective section
 */
export function createObjectiveSection(objectiveData, onUpdate) {
  const section = el('div', { class: 'objective-section' });
  
  // Initialize data structure if needed
  const data = {
    text: '',
    inspection: { visual: '' },
    palpation: { findings: '' },
    neuro: { screening: '' },
    functional: { assessment: '' },
    regionalAssessments: {
      selectedRegions: [],
      rom: {},
      mmt: {},
      specialTests: {},
      prom: {},
      promExcluded: []
    },
    treatmentPerformed: {
      patientEducation: '',
      modalities: '',
      therapeuticExercise: '',
      manualTherapy: ''
    },
    ...objectiveData
  };

  // Ensure nested objects exist
  if (!data.inspection) data.inspection = { visual: '' };
  if (!data.palpation) data.palpation = { findings: '' };
  if (!data.neuro) data.neuro = { screening: '' };
  if (!data.functional) data.functional = { assessment: '' };
  if (!data.treatmentPerformed) {
    data.treatmentPerformed = { patientEducation: '', modalities: '', therapeuticExercise: '', manualTherapy: '' };
  }
  if (!data.regionalAssessments) {
    data.regionalAssessments = {
      selectedRegions: [],
      rom: {},
      mmt: {},
      specialTests: {},
      prom: {},
      promExcluded: []
    };
  }

  // Update helper
  const updateField = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!data[parent]) data[parent] = {};
      data[parent][child] = value;
    } else {
      data[field] = value;
    }
    onUpdate(data);
  };

  // Systematic examination approach
  const generalObsSection = el('div', { id: 'general-observations', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'General Observations & Vital Signs'),
    textAreaField({
      label: 'Posture, Gait, Appearance, Vitals',
      value: data.text,
      onChange: v => updateField('text', v)
    })
  ]);
  section.append(generalObsSection);
  
  // Inspection section
  const inspectionSection = el('div', { id: 'inspection', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Inspection'),
    textAreaField({
      label: 'Visual Assessment (swelling, deformity, skin changes, asymmetry)',
      value: data.inspection.visual || '',
      onChange: v => updateField('inspection.visual', v)
    })
  ]);
  section.append(inspectionSection);
  
  // Palpation section
  const palpationSection = el('div', { id: 'palpation', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Palpation'),
    textAreaField({
      label: 'Tenderness, Temperature, Muscle Tone, Tissue Quality',
      value: data.palpation.findings || '',
      onChange: v => updateField('palpation.findings', v)
    })
  ]);
  section.append(palpationSection);
  
  // Regional assessment section
  const regionalSection = el('div', { id: 'regional-assessment', class: 'section-anchor' }, [
  el('h4', { class: 'subsection-title' }, 'Regional Assessment')
  ]);
  
  // Use modular assessment components
  const multiAssessment = createMultiRegionalAssessment(
      data.regionalAssessments || {},
      assessmentData => {
        updateField('regionalAssessments', assessmentData);
      }
    );
    regionalSection.append(multiAssessment.element);
    section.append(regionalSection);
  
  // Neurological screening
  const neuroSection = el('div', { id: 'neurological-screening', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Neurological Screening'),
    textAreaField({
      label: 'Reflexes, Sensation, Dermatomes, Myotomes, Neural Tension',
      value: data.neuro.screening || '',
      onChange: v => updateField('neuro.screening', v)
    })
  ]);
  section.append(neuroSection);
  
  // Functional movement assessment
  const functionalSection = el('div', { id: 'functional-movement', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Functional Movement Assessment'),
    textAreaField({
      label: 'Transfers, Ambulation, ADL Performance, Movement Patterns',
      value: data.functional.assessment || '',
      onChange: v => updateField('functional.assessment', v)
    })
  ]);
  section.append(functionalSection);

  // Treatment Performed subsection
  const performedSection = el('div', { id: 'treatment-performed', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Treatment Performed'),
    textAreaField({
      label: 'Patient Education',
      value: data.treatmentPerformed.patientEducation || '',
      onChange: v => updateField('treatmentPerformed.patientEducation', v)
    }),
    textAreaField({
      label: 'Modalities',
      value: data.treatmentPerformed.modalities || '',
      onChange: v => updateField('treatmentPerformed.modalities', v)
    }),
    textAreaField({
      label: 'Therapeutic Exercise',
      value: data.treatmentPerformed.therapeuticExercise || '',
      onChange: v => updateField('treatmentPerformed.therapeuticExercise', v)
    }),
    textAreaField({
      label: 'Manual Therapy',
      value: data.treatmentPerformed.manualTherapy || '',
      onChange: v => updateField('treatmentPerformed.manualTherapy', v)
    })
  ]);
  section.append(performedSection);

  // CPT Codes widget is rendered only in BillingSection to ensure single source of truth
  
  return section;
}
