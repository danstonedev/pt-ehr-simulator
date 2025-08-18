// AssessmentSection.js - ICF Framework & Clinical Reasoning Module
// Handles comprehensive assessment using ICF classification and PT diagnosis

import { textAreaField, inputField, selectField } from '../../../ui/form-components.js';
import { el } from '../../../ui/utils.js';

/**
 * Creates the complete assessment section with clinical reasoning
 * @param {Object} assessmentData - Current assessment data
 * @param {Function} onUpdate - Callback when data changes
 * @returns {HTMLElement} Complete assessment section
 */
export function createAssessmentSection(assessmentData, onUpdate) {
  const section = el('div', { class: 'assessment-section' });
  
  // Handle backward compatibility - if assessment is a string, migrate to object
  let data = assessmentData;
  if (typeof data === 'string') {
    const oldAssessment = data;
    data = {
      primaryImpairments: oldAssessment,
      bodyFunctions: '',
      activityLimitations: '',
      participationRestrictions: '',
      ptDiagnosis: '',
      prognosis: '',
      prognosticFactors: '',
      clinicalReasoning: ''
    };
    onUpdate(data); // Trigger migration save
  }
  
  // Initialize data structure if needed
  data = {
    primaryImpairments: '',
    bodyFunctions: '',
    activityLimitations: '',
    participationRestrictions: '',
    ptDiagnosis: '',
    prognosis: '',
    prognosticFactors: '',
    clinicalReasoning: '',
    ...data
  };

  // Update helper
  const updateField = (field, value) => {
    data[field] = value;
    onUpdate(data);
  };

  // Primary Impairments
  const impairmentSection = el('div', { id: 'primary-impairments', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Primary Impairments'),
    textAreaField({
      label: 'Key Physical Impairments Identified',
      value: data.primaryImpairments,
      onChange: v => updateField('primaryImpairments', v)
    })
  ]);
  section.append(impairmentSection);
  
  // ICF Classification
  const icfSection = el('div', { id: 'icf-classification', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'ICF Classification'),
    textAreaField({
      label: 'Body Functions & Structures',
      value: data.bodyFunctions,
      onChange: v => updateField('bodyFunctions', v)
    }),
    textAreaField({
      label: 'Activity Limitations',
      value: data.activityLimitations,
      onChange: v => updateField('activityLimitations', v)
    }),
    textAreaField({
      label: 'Participation Restrictions',
      value: data.participationRestrictions,
      onChange: v => updateField('participationRestrictions', v)
    })
  ]);
  section.append(icfSection);
  
  // PT Diagnosis & Prognosis
  const diagnosisSection = el('div', { id: 'pt-diagnosis', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Physical Therapy Diagnosis & Prognosis'),
    inputField({
      label: 'PT Diagnosis/Movement System Diagnosis',
      value: data.ptDiagnosis,
      onChange: v => updateField('ptDiagnosis', v),
      placeholder: 'e.g., Lumbar extension syndrome with mobility deficits'
    }),
    selectField({
      label: 'Prognosis',
      value: data.prognosis,
      options: [
        {value: 'excellent', label: 'Excellent - Full recovery expected'},
        {value: 'good', label: 'Good - Significant improvement expected'},
      {value: 'fair', label: 'Fair - Moderate improvement expected'},
      {value: 'poor', label: 'Poor - Minimal improvement expected'},
      {value: 'guarded', label: 'Guarded - Uncertain outcome'}
    ],
    onChange: v => updateField('prognosis', v)
  }),
  textAreaField({
    label: 'Prognostic Factors',
    value: data.prognosticFactors,
    onChange: v => updateField('prognosticFactors', v)
  })
  ]);
  section.append(diagnosisSection);
  
  // Clinical Reasoning
  const reasoningSection = el('div', { id: 'clinical-reasoning', class: 'section-anchor' }, [
    el('h4', { class: 'subsection-title' }, 'Clinical Reasoning'),
    textAreaField({
      label: 'Clinical Reasoning & Hypothesis',
      value: data.clinicalReasoning,
      onChange: v => updateField('clinicalReasoning', v)
    })
  ]);
  section.append(reasoningSection);
  
  return section;
}
