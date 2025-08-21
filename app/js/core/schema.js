
export const ENUMS = {
  setting: ['Outpatient', 'Inpatient', 'Home Health', 'SNF', 'Acute Rehab', 'Other'],
  encounters: ['eval', 'daily', 'progress', 'discharge'],
  diagnosis: ['Musculoskeletal', 'Neurological', 'Cardiopulmonary', 'Integumentary', 'Other'],
  acuity: ['acute', 'subacute', 'chronic', 'unspecified'],
  sex: ['male', 'female', 'other', 'unspecified'],
  prognosis: ['excellent', 'good', 'fair', 'poor', 'guarded'],
  regions: ['lumbar-spine', 'cervical-spine', 'shoulder', 'knee', 'ankle', 'hip', 'elbow', 'wrist'],
  painQuality: ['sharp', 'dull', 'aching', 'burning', 'throbbing', 'stabbing', 'cramping', 'tingling']
};

export function makeBlankCase() {
  return { 
    meta: {
      title: '', 
      setting: 'Outpatient', 
      regions: [], 
      acuity: 'unspecified', 
      diagnosis: 'Musculoskeletal'
    },
    snapshot: {
      name: '',
      age: '',
      sex: 'unspecified',
      dob: '',
      teaser: ''
    },
    history: {
      chief_complaint: '',
      hpi: '',
      mechanism_of_injury: '',
      pain: {
        level: '',
        location: '',
        quality: '',
        aggravating_factors: '',
        easing_factors: '',
        onset: '',
        duration: ''
      },
      pmh: [],
      meds: [],
      red_flag_signals: [],
      functional_goals: []
    },
    findings: {
      vitals: { 
        bp: '', 
        hr: '', 
        rr: '', 
        temp: '', 
        o2sat: '', 
        pain: '' 
      },
      rom: {},
      mmt: {},
      special_tests: [],
      gait: { 
        device: 'none', 
        distance_m: 0,
        pattern: '',
        observations: ''
      },
      outcome_options: []
    },
    // Updated structure to match actual usage in application
    exam: {
      vitals: { 
        bp: '', 
        hr: '', 
        rr: '', 
        temp: '', 
        o2sat: '', 
        pain: '' 
      },
      inspection: {
        visual: ''
      },
      palpation: {
        findings: ''
      },
      range_of_motion: {},
      muscle_strength: {},
      special_tests: {},
      functional_assessment: '',
      gait: {
        pattern: '',
        device: '',
        observations: ''
      },
      regionalAssessments: {
        selectedRegions: [],
        rom: {},
        mmt: {},
        specialTests: {}
      }
    },
    assessment: {
      primaryImpairments: '',
      bodyFunctions: '',
      activityLimitations: '',
      participationRestrictions: '',
      ptDiagnosis: '',
      prognosis: '',
      prognosticFactors: '',
      clinicalReasoning: '',
      clinical_impression: '',
      icf_framework: {
        body_functions: '',
        activity_limitations: '',
        participation_restrictions: ''
      },
      visibility: {
        primaryImpairments: { studentKey: true, studentExaminer: true },
        bodyFunctions: { studentKey: true, studentExaminer: true },
        activityLimitations: { studentKey: true, studentExaminer: true },
        participationRestrictions: { studentKey: true, studentExaminer: true },
        ptDiagnosis: { studentKey: true, studentExaminer: false },
        prognosis: { studentKey: true, studentExaminer: false },
        prognosticFactors: { studentKey: true, studentExaminer: false },
        clinicalReasoning: { studentKey: true, studentExaminer: false }
      }
    },
    plan: {
      goals: [],
      interventions: [],
      frequency: '',
      duration: '',
      prognosis: ''
    },
    encounters: {
      eval: { 
        notes_seed: '',
        completed_sections: []
      },
      daily: [],
      progress: null,
      discharge: null
    }, 
    assets: [] 
  };
}

// Enhanced validation with specific field checks
export function validateCase(c) {
  const e = []; 
  
  // Meta validation
  if (!c?.meta?.title) e.push('meta.title is required');
  if (c?.meta?.setting && !ENUMS.setting.includes(c.meta.setting)) e.push('meta.setting invalid');
  if (c?.meta?.diagnosis && !ENUMS.diagnosis.includes(c.meta.diagnosis)) e.push('meta.diagnosis invalid');
  if (c?.meta?.acuity && !ENUMS.acuity.includes(c.meta.acuity)) e.push('meta.acuity invalid');
  
  // Snapshot validation
  if (!c?.snapshot) e.push('snapshot is missing');
  if (c?.snapshot?.sex && !ENUMS.sex.includes(c.snapshot.sex)) e.push('snapshot.sex invalid');
  
  // History validation
  if (!c?.history) e.push('history is missing');
  if (c?.history?.red_flag_signals && !Array.isArray(c.history.red_flag_signals)) e.push('history.red_flag_signals must be array');
  if (c?.history?.pmh && !Array.isArray(c.history.pmh)) e.push('history.pmh must be array');
  if (c?.history?.meds && !Array.isArray(c.history.meds)) e.push('history.meds must be array');
  
  // Structure validation
  if (!c?.findings) e.push('findings is missing');
  if (!c?.encounters) e.push('encounters is missing');
  
  // Assessment validation (if present)
  if (c?.assessment?.prognosis && !ENUMS.prognosis.includes(c.assessment.prognosis)) {
    e.push('assessment.prognosis invalid');
  }
  
  return e;
}

// New helper functions for data integrity
export function ensureDataIntegrity(caseData) {
  // Ensure required data structures exist
  if (!caseData.exam && caseData.findings) {
    caseData.exam = { ...caseData.findings };
  }
  if (!caseData.findings && caseData.exam) {
    caseData.findings = { ...caseData.exam };
  }
  
  // Ensure assessment has visibility structure for faculty mode
  if (caseData.assessment && !caseData.assessment.visibility) {
    caseData.assessment.visibility = {
      primaryImpairments: { studentKey: true, studentExaminer: true },
      bodyFunctions: { studentKey: true, studentExaminer: true },
      activityLimitations: { studentKey: true, studentExaminer: true },
      participationRestrictions: { studentKey: true, studentExaminer: true },
      ptDiagnosis: { studentKey: true, studentExaminer: false },
      prognosis: { studentKey: true, studentExaminer: false },
      prognosticFactors: { studentKey: true, studentExaminer: false },
      clinicalReasoning: { studentKey: true, studentExaminer: false }
    };
  }
  
  return caseData;
}

export function migrateOldCaseData(caseData) {
  // Handle old string-based assessment format
  if (typeof caseData.assessment === 'string') {
    const oldAssessment = caseData.assessment;
    caseData.assessment = {
      primaryImpairments: oldAssessment,
      bodyFunctions: '',
      activityLimitations: '',
      participationRestrictions: '',
      ptDiagnosis: '',
      prognosis: '',
      prognosticFactors: '',
      clinicalReasoning: ''
    };
  }
  
  // Handle old subjective format
  if (typeof caseData.subjective === 'string') {
    const oldSubjective = caseData.subjective;
    caseData.subjective = {
      chiefComplaint: '',
      historyOfPresentIllness: oldSubjective,
      painLocation: '',
      painScale: '',
      painQuality: '',
      aggravatingFactors: '',
      easingFactors: '',
      pastMedicalHistory: '',
      medications: '',
      functionalGoals: '',
      additionalHistory: ''
    };
  }
  
  return ensureDataIntegrity(caseData);
}
