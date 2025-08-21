// case-generator.js - Comprehensive Deterministic Case Generator
// Generates detailed, realistic PT cases with integrated UI data

import { regionalAssessments } from '../features/soap/objective/RegionalAssessments.js';

/**
 * Enhanced Case Generator with clinical realism and UI integration
 * @param {Object} anchors - Case parameters (title, region, condition, etc.)
 * @returns {Object} Complete case structure
 */
export function generateCase(anchors = {}) {
  const {
    title = '',
    region = 'shoulder',
    condition = 'Rotator cuff tendinopathy',
    age = 45,
    sex = 'female',
    pain = 5,
    acuity = 'chronic',
    setting = 'Outpatient',
    prompt = '',
    goal = ''
  } = anchors;

  // Normalize inputs
  const normalizedAge = normalizeAge(age);
  const normalizedSex = normalizeSex(sex);
  const regionSlug = normalizeRegionSlug(region);
  
  // Get comprehensive template for region using normalized slug
  const template = getRegionTemplate(regionSlug, acuity, condition, pain, goal);
  
  // Generate comprehensive case structure
  return {
    title: title || `${capitalize(region)} ${capitalize(condition)} (${capitalize(acuity)})`,
    setting,
    patientAge: normalizedAge,
    patientGender: normalizedSex,
    acuity,
    patientDOB: undefined,
    createdBy: 'faculty',
    createdAt: new Date().toISOString(),
    
    // Metadata for case management
    meta: {
      title: title || template.teaser,
      setting,
      patientAge: normalizedAge,
      patientGender: normalizedSex,
      acuity,
      diagnosis: 'Musculoskeletal',
      regions: regionSlug ? [regionSlug] : []
    },
    
    // Case snapshot for quick reference
    snapshot: {
      age: String(normalizedAge),
      sex: normalizedSex,
      teaser: template.teaser
    },
    
    // Clinical history
    history: {
      chief_complaint: template.chiefComplaint,
      hpi: prompt ? `${prompt} ${template.hpi}`.trim() : template.hpi,
      pmh: template.pmh || [],
      meds: template.meds || [],
      red_flag_signals: template.redFlags || []
    },
    
    // Clinical findings
    findings: {
      rom: template.rom || {},
      mmt: template.mmt || {},
      special_tests: template.specialTests || [],
      outcome_options: template.outcome ? [template.outcome] : []
    },
    
    // SOAP documentation structure
    encounters: {
      eval: {
        subjective: {
          chiefComplaint: template.chiefComplaint,
          historyOfPresentIllness: prompt ? `${prompt} ${template.hpi}`.trim() : template.hpi,
          painScale: String(pain ?? ''),
          patientGoals: goal || template.defaultGoal
        },
        objective: {
          regionalAssessments: {
            selectedRegions: [regionSlug],
            rom: template.rom || {},
            mmt: template.mmt || {},
            prom: template.prom || {},
            specialTests: template.specialTests || {}
          }
        },
        assessment: {
          primaryImpairments: template.impairments ? template.impairments.join('; ') : '',
          ptDiagnosis: condition,
          prognosis: template.prognosis?.toLowerCase() || 'good',
          prognosticFactors: template.prognosticFactors || ''
        },
        plan: {
          frequency: template.plan?.frequency || '',
          duration: template.plan?.duration || '',
          interventions: template.plan?.interventions || [],
          shortTermGoals: template.plan?.stg || '',
          longTermGoals: template.plan?.ltg || ''
        },
        billing: {
          diagnosisCodes: template.icd10 ? [{ 
            code: template.icd10.code, 
            description: template.icd10.desc, 
            isPrimary: true 
          }] : [],
          billingCodes: template.cpt ? template.cpt.map(code => ({ 
            code, 
            units: '1' 
          })) : []
        }
      }
    }
  };
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function capitalize(str) {
  const text = (str || '').toString().trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function normalizeSex(sex) {
  if (!sex) return 'unspecified';
  const normalized = String(sex).toLowerCase().trim();
  if (normalized === 'prefer-not-to-say') return 'unspecified';
  if (['male', 'female', 'other', 'unspecified'].includes(normalized)) return normalized;
  return 'unspecified';
}

function normalizeAge(age) {
  const ageNum = parseInt(age);
  return (!isNaN(ageNum) && ageNum > 0 && ageNum < 120) ? ageNum : 45;
}

function normalizeRegionSlug(region) {
  const regionMap = {
    'low back': 'lumbar-spine',
    'lower back': 'lumbar-spine',
    'lumbar': 'lumbar-spine',
    'neck': 'cervical-spine',
    'cervical': 'cervical-spine',
    'upper back': 'thoracic-spine',
    'thoracic': 'thoracic-spine'
  };
  const key = (region || '').toLowerCase().trim();
  return regionMap[key] || key || 'shoulder';
}

function mapFrequencyToEnum(frequency = '') {
  const s = String(frequency).toLowerCase();
  if (!s) return '';
  if (/(^|\b)1x(\b|\/|\s)/.test(s) || s.includes('1x per week') || s.includes('once per week')) return '1x-week';
  if (/(^|\b)2x(\b|\/|\s)/.test(s) || s.includes('2x per week') || s.includes('twice per week')) return '2x-week';
  if (/(^|\b)3x(\b|\/|\s)/.test(s) || s.includes('3x per week') || s.includes('three times per week')) return '3x-week';
  if (/(^|\b)4x(\b|\/|\s)/.test(s) || s.includes('4x per week') || s.includes('four times per week')) return '4x-week';
  if (/(^|\b)5x(\b|\/|\s)/.test(s) || s.includes('5x per week') || s.includes('daily') || s.includes('five times per week')) return '5x-week';
  if (s.includes('2x per day') || s.includes('twice a day') || s.includes('twice daily')) return '2x-day';
  if (s.includes('prn') || s.includes('as needed')) return 'prn';
  return s;
}

function mapDurationToEnum(duration = '') {
  const s = String(duration).toLowerCase();
  if (!s) return '';
  if (s.includes('2') && s.includes('week')) return '2-weeks';
  if (s.includes('4') && s.includes('week')) return '4-weeks';
  if (s.includes('6') && s.includes('week')) return '6-weeks';
  if (s.includes('8') && s.includes('week')) return '8-weeks';
  if (s.includes('12') && s.includes('week')) return '12-weeks';
  if (s.includes('16') && s.includes('week')) return '16-weeks';
  if (s.includes('6') && s.includes('month')) return '6-months';
  if (s.includes('ongoing') || s.includes('indefinite')) return 'ongoing';
  return s;
}

function generateSmartGoals(region, condition, patientGoal, acuity, painLevel) {
  const timeframes = {
    acute: { short: '1-2 weeks', long: '4-6 weeks' },
    subacute: { short: '2-3 weeks', long: '6-8 weeks' },
    chronic: { short: '3-4 weeks', long: '8-12 weeks' }
  };
  
  const timeframe = timeframes[acuity] || timeframes.chronic;
  const painReduction = Math.max(1, Math.floor(painLevel / 2));
  
  const baseGoal = patientGoal || getDefaultGoalForRegion(region);
  
  return {
    shortTerm: `In ${timeframe.short}, patient will demonstrate measurable progress toward ${baseGoal} with pain reduced by ${painReduction} points and improved function.`,
    longTerm: `In ${timeframe.long}, patient will achieve ${baseGoal} with pain ≤ 2/10, restored strength/ROM, and return to desired activities.`
  };
}

function getDefaultGoalForRegion(region) {
  const regionGoals = {
    'shoulder': 'pain-free overhead reaching and lifting up to 20 lbs',
    'cervical-spine': 'pain-free neck rotation and improved posture',
    'lumbar-spine': 'pain-free lifting and prolonged sitting tolerance',
    'knee': 'pain-free stair climbing and return to recreational activities',
    'ankle': 'pain-free weight bearing and improved balance',
    'hip': 'improved mobility and return to functional activities',
    'elbow': 'pain-free gripping and lifting activities',
    'thoracic-spine': 'improved posture and reduced pain with prolonged activities'
  };
  return regionGoals[region] || 'improved function and reduced pain';
}

// ========================================
// UI DATA PROCESSING FUNCTIONS
// ========================================

function processUIRomData(uiRomData, acuity, painLevel, affectedSide = 'R') {
  if (!uiRomData || !Array.isArray(uiRomData)) return {};
  
  const romData = {};
  
  const impairmentFactors = {
    acute: { percentage: 0.6, variation: 0.1 },
    subacute: { percentage: 0.75, variation: 0.1 },
    chronic: { percentage: 0.8, variation: 0.15 }
  };
  
  const factor = impairmentFactors[acuity] || impairmentFactors.chronic;
  
  // Group ROM data by joint motion (since data has separate L/R entries)
  const groupedData = {};
  uiRomData.forEach(romItem => {
    if (!romItem.joint) return;
    
    const jointName = romItem.joint;
    if (!groupedData[jointName]) {
      groupedData[jointName] = {};
    }
    
    // Parse normal value (remove degree symbol)
    const normalValue = parseInt(romItem.normal.replace('°', '')) || 0;
    
    if (romItem.side === 'L') {
      groupedData[jointName].leftNormal = normalValue;
    } else if (romItem.side === 'R') {
      groupedData[jointName].rightNormal = normalValue;
    }
  });
  
  // Process each joint motion
  Object.keys(groupedData).forEach((jointName, index) => {
    const joint = groupedData[jointName];
    
    const seed = (jointName.charCodeAt(0) + index) / 100;
    const randomFactor = 1 + (Math.sin(seed) * factor.variation);
    const impairment = factor.percentage * randomFactor;
    
    // Get normal values
    const leftNormal = joint.leftNormal || 0;
    const rightNormal = joint.rightNormal || 0;
    
    // Calculate impaired values
    const leftValue = Math.round(leftNormal * (affectedSide === 'L' ? impairment : 0.95));
    const rightValue = Math.round(rightNormal * (affectedSide === 'R' ? impairment : 0.95));
    
    romData[jointName] = {
      leftValue: String(leftValue),
      rightValue: String(rightValue),
      leftNormal: String(leftNormal),
      rightNormal: String(rightNormal),
      leftPain: affectedSide === 'L' ? String(Math.min(painLevel, 8)) : '0',
      rightPain: affectedSide === 'R' ? String(Math.min(painLevel, 8)) : '0'
    };
  });
  
  return romData;
}

function processUIMMTData(uiMMTData, acuity, affectedSide = 'R') {
  if (!uiMMTData || !Array.isArray(uiMMTData)) return {};
  
  const mmtData = {};
  
  const gradesByAcuity = {
    acute: ['3-', '3', '3+'],
    subacute: ['3+', '4-', '4'],
    chronic: ['4', '4+', '5-']
  };
  
  const grades = gradesByAcuity[acuity] || gradesByAcuity.chronic;
  
  uiMMTData.forEach((mmtItem, index) => {
    if (!mmtItem.muscle) return;
    
    const gradeIndex = index % grades.length;
    const unaffectedGrade = '5';
    
    mmtData[mmtItem.muscle] = {
      leftGrade: affectedSide === 'L' ? grades[gradeIndex] : unaffectedGrade,
      rightGrade: affectedSide === 'R' ? grades[gradeIndex] : unaffectedGrade
    };
  });
  
  return mmtData;
}

function processUIPROMData(uiRomData, acuity, painLevel, affectedSide = 'R') {
  if (!uiRomData || !Array.isArray(uiRomData)) return {};
  
  const promData = {};
  
  // End-feel patterns based on acuity
  const endFeelPatterns = {
    acute: ['muscle spasm', 'empty', 'hard'],
    subacute: ['firm', 'hard', 'springy'],
    chronic: ['firm', 'springy', 'hard']
  };
  
  const endFeels = endFeelPatterns[acuity] || endFeelPatterns.chronic;
  
  const impairmentFactors = {
    acute: { percentage: 0.7, variation: 0.1 },
    subacute: { percentage: 0.8, variation: 0.1 },
    chronic: { percentage: 0.85, variation: 0.1 }
  };
  
  const factor = impairmentFactors[acuity] || impairmentFactors.chronic;
  
  // Group ROM data by joint motion (since data has separate L/R entries)
  const groupedData = {};
  uiRomData.forEach(romItem => {
    if (!romItem.joint) return;
    
    const jointName = romItem.joint;
    if (!groupedData[jointName]) {
      groupedData[jointName] = {};
    }
    
    // Parse normal value (remove degree symbol)
    const normalValue = parseInt(romItem.normal.replace('°', '')) || 0;
    
    if (romItem.side === 'L') {
      groupedData[jointName].leftNormal = normalValue;
    } else if (romItem.side === 'R') {
      groupedData[jointName].rightNormal = normalValue;
    }
  });
  
  // Process each joint motion
  Object.keys(groupedData).forEach((jointName, index) => {
    const joint = groupedData[jointName];
    
    const seed = (jointName.charCodeAt(0) + index) / 100;
    const randomFactor = 1 + (Math.sin(seed) * factor.variation);
    const impairment = factor.percentage * randomFactor;
    
    // Get normal values
    const leftNormal = joint.leftNormal || 0;
    const rightNormal = joint.rightNormal || 0;
    
    // Calculate PROM values (typically slightly better than AROM)
    const leftValue = Math.round(leftNormal * (affectedSide === 'L' ? impairment + 0.1 : 0.98));
    const rightValue = Math.round(rightNormal * (affectedSide === 'R' ? impairment + 0.1 : 0.98));
    
    // Select end-feel based on deterministic pattern
    const endFeelIndex = index % endFeels.length;
    const endFeel = endFeels[endFeelIndex];
    
    promData[jointName] = {
      leftValue: String(Math.min(leftValue, leftNormal)),
      rightValue: String(Math.min(rightValue, rightNormal)),
      leftEndFeel: affectedSide === 'L' ? endFeel : 'normal',
      rightEndFeel: affectedSide === 'R' ? endFeel : 'normal',
      leftPain: affectedSide === 'L' ? String(Math.max(0, painLevel - 1)) : '0',
      rightPain: affectedSide === 'R' ? String(Math.max(0, painLevel - 1)) : '0'
    };
  });
  
  return promData;
}

function formatSpecialTestsData(specialTestsArray = []) {
  if (!Array.isArray(specialTestsArray)) return {};
  
  const testsData = {};
  
  specialTestsArray.forEach((test, index) => {
    if (!test.name) return;
    
    // Deterministic results based on test name and position
    const seed = test.name.charCodeAt(0) + index;
    const isPositive = (seed % 3) === 0; // ~33% positive rate
    const bilateralPositive = (seed % 5) === 0; // ~20% bilateral
    
    testsData[test.name] = {
      leftResult: bilateralPositive || isPositive ? 'positive' : 'negative',
      rightResult: bilateralPositive || (isPositive && index % 2 === 1) ? 'positive' : 'negative'
    };
  });
  
  return testsData;
}

// ========================================
// UI SHAPE BUILDERS
// ========================================

// ROM UI expects an object keyed by item index with string values for left/right and optional notes using `${rowId}-notes`
function buildUIRomTableData(items = [], romByJoint = {}) {
  const out = {};
  items.forEach((item, index) => {
    const name = item.name || item.joint || item.muscle;
    const row = romByJoint[name];
    if (!row) return;
    // EditableTable maps left/right using index positions of L/R entries
    // Here we simply assign the same value to both L/R indices if they exist, otherwise leave blank.
    if (item.side === 'L') out[index] = row.leftValue ?? '';
    if (item.side === 'R') out[index] = row.rightValue ?? '';
    if (!item.side) {
      // midline/bilateral item: prefer right as representative, fallback left
      out[index] = (row.rightValue ?? row.leftValue ?? '').toString();
    }
    // Notes (optional) kept empty; can be extended later
  });
  return out;
}

// MMT UI expects object keyed by item index → grade string
function buildUIMmtTableData(items = [], mmtByMuscle = {}) {
  const out = {};
  items.forEach((item, index) => {
    const name = item.muscle || item.name || item.joint;
    const row = mmtByMuscle[name];
    if (!row) return;
    if (item.side === 'L') out[index] = row.leftGrade ?? '';
    if (item.side === 'R') out[index] = row.rightGrade ?? '';
    if (!item.side) out[index] = row.rightGrade ?? row.leftGrade ?? '';
  });
  return out;
}

// PROM UI now stores { left, right, notes } per movement row (notes shown instead of End-Feel)
function buildUIPromTableData(items = [], promByJoint = {}, sideLetter = 'R') {
  const out = {};
  // Group by base name
  const groups = {};
  items.forEach(item => {
    const baseName = item.name || item.joint || item.muscle;
    if (!groups[baseName]) groups[baseName] = { normal: item.normal, hasL: false, hasR: false };
    if (item.side === 'L') groups[baseName].hasL = true;
    else if (item.side === 'R') groups[baseName].hasR = true;
  });
  Object.keys(groups).forEach(baseName => {
    const key = baseName.toLowerCase().replace(/\s+/g, '-');
    const prom = promByJoint[baseName] || {};
    out[key] = {
      left: prom.leftValue || '',
      right: prom.rightValue || '',
      // Include endfeel data in notes field
      notes: (sideLetter === 'L' ? prom.leftEndFeel : prom.rightEndFeel) || ''
    };
  });
  return out;
}

// Special Tests UI expects { test-<index>: { name, left, right, notes } }
function buildUISpecialTestsTableData(items = [], specialByName = {}) {
  const out = {};
  items.forEach((item, index) => {
    const key = `test-${index}`;
    const row = specialByName[item.name] || {};
  const left = row.leftResult || '';
  const right = row.rightResult || '';
  out[key] = { name: item.name, left, right, notes: '' };
  });
  return out;
}

// ========================================
// REGION TEMPLATE SYSTEM
// ========================================

function getRegionTemplate(regionSlug, acuity, condition, painLevel, patientGoal) {
  // Get UI data for the region
  const regionData = regionalAssessments[regionSlug];
  if (!regionData) {
    console.warn(`No regional assessment data found for: ${regionSlug}`);
    return getBasicTemplate(condition, acuity, painLevel, patientGoal);
  }

  // Process UI data into clinical findings
  const affectedSide = (painLevel > 6) ? 'bilateral' : 'R';
  const sideLetter = affectedSide === 'bilateral' ? 'R' : affectedSide;

  // First compute deterministic, clinically realistic values by name
  const romByJoint = processUIRomData(regionData.rom || [], acuity, painLevel, sideLetter);
  const mmtByMuscle = processUIMMTData(regionData.mmt || [], acuity, sideLetter);
  const promByJoint = processUIPROMData(regionData.rom || [], acuity, painLevel, sideLetter);
  const specialByName = formatSpecialTestsData(regionData.specialTests || []);

  // Then convert to UI-expected shapes
  const rom = buildUIRomTableData(regionData.rom || [], romByJoint);
  const mmt = buildUIMmtTableData(regionData.mmt || [], mmtByMuscle);
  const prom = buildUIPromTableData(regionData.rom || [], promByJoint, sideLetter);
  const specialTests = buildUISpecialTestsTableData(regionData.specialTests || [], specialByName);
  
  // Generate goals
  const goals = generateSmartGoals(regionSlug, condition, patientGoal, acuity, painLevel);
  
  // Create comprehensive template
  return {
    teaser: `${capitalize(acuity)} ${condition.toLowerCase()} - ${capitalize(regionSlug.replace('-', ' '))}`,
    chiefComplaint: `${capitalize(acuity)} ${regionSlug.replace('-', ' ')} pain and dysfunction`,
    hpi: generateHPI(condition, acuity, regionSlug, painLevel),
  rom,
  mmt,
  prom,
  specialTests,
    impairments: generateImpairments(regionSlug, acuity),
    prognosis: generatePrognosis(acuity, painLevel),
    defaultGoal: getDefaultGoalForRegion(regionSlug),
    plan: {
      frequency: mapFrequencyToEnum(getFrequencyForAcuity(acuity)),
      duration: mapDurationToEnum(getDurationForAcuity(acuity)),
      interventions: getInterventionsForRegion(regionSlug, acuity),
      stg: goals.shortTerm,
      ltg: goals.longTerm
    },
    icd10: getICD10ForCondition(condition),
    cpt: getCPTForAcuity(acuity),
    prognosticFactors: generatePrognosticFactors(acuity, painLevel)
  };
}

function getBasicTemplate(condition, acuity, painLevel, patientGoal) {
  const goals = generateSmartGoals('general', condition, patientGoal, acuity, painLevel);
  
  return {
    teaser: `${capitalize(acuity)} ${condition.toLowerCase()}`,
    chiefComplaint: `${capitalize(acuity)} musculoskeletal pain and dysfunction`,
    hpi: generateHPI(condition, acuity, 'general', painLevel),
    rom: {},
    mmt: {},
    prom: {},
    specialTests: {},
    impairments: ['Pain', 'Decreased mobility', 'Functional limitations'],
    prognosis: generatePrognosis(acuity, painLevel),
    defaultGoal: 'improved function and reduced pain',
    plan: {
      frequency: mapFrequencyToEnum(getFrequencyForAcuity(acuity)),
      duration: mapDurationToEnum(getDurationForAcuity(acuity)),
      interventions: ['Manual therapy', 'Therapeutic exercise', 'Patient education'],
      stg: goals.shortTerm,
      ltg: goals.longTerm
    },
    icd10: getICD10ForCondition(condition),
    cpt: getCPTForAcuity(acuity),
    prognosticFactors: generatePrognosticFactors(acuity, painLevel)
  };
}

// ========================================
// CLINICAL CONTENT GENERATORS
// ========================================

function generateHPI(condition, acuity, region, painLevel) {
  const templates = {
    acute: `Patient reports sudden onset of ${region.replace('-', ' ')} pain following recent activity. Pain is ${painLevel}/10, constant, and significantly limiting function. No previous history of similar episodes.`,
    subacute: `Patient describes ${region.replace('-', ' ')} pain that has persisted for several weeks following initial injury. Pain fluctuates between ${Math.max(1, painLevel-2)}-${painLevel}/10 depending on activity level.`,
    chronic: `Patient reports persistent ${region.replace('-', ' ')} pain for several months. Pain averages ${painLevel}/10 and interferes with daily activities and sleep. Previous conservative treatments have provided minimal relief.`
  };
  return templates[acuity] || templates.chronic;
}

function generateImpairments(region, acuity) {
  const baseImpairments = ['Pain', 'Decreased ROM', 'Muscle weakness'];
  const acuitySpecific = {
    acute: ['Inflammation', 'Protective muscle guarding'],
    subacute: ['Tissue healing limitations', 'Movement compensations'],
    chronic: ['Movement avoidance patterns', 'Deconditioning']
  };
  return [...baseImpairments, ...acuitySpecific[acuity] || []];
}

function generatePrognosis(acuity, painLevel) {
  if (painLevel >= 7) return 'Fair';
  if (acuity === 'acute') return 'Good';
  if (acuity === 'chronic') return 'Fair to Good';
  return 'Good';
}

function generatePrognosticFactors(acuity, painLevel) {
  const factors = [];
  if (acuity === 'acute') factors.push('Recent onset');
  if (acuity === 'chronic') factors.push('Duration of symptoms');
  if (painLevel >= 7) factors.push('High pain levels');
  if (painLevel <= 3) factors.push('Low pain levels');
  return factors.join(', ');
}

function getFrequencyForAcuity(acuity) {
  const frequencies = {
    acute: '2-3x per week',
    subacute: '2x per week',
    chronic: '2x per week'
  };
  return frequencies[acuity] || frequencies.chronic;
}

function getDurationForAcuity(acuity) {
  const durations = {
    acute: '4-6 weeks',
    subacute: '6-8 weeks',
    chronic: '8-12 weeks'
  };
  return durations[acuity] || durations.chronic;
}

function getInterventionsForRegion(region, acuity) {
  const base = ['Manual therapy', 'Therapeutic exercise', 'Patient education'];
  const regionSpecific = {
    'shoulder': ['Joint mobilization', 'Rotator cuff strengthening'],
    'cervical-spine': ['Cervical stabilization', 'Postural training'],
    'lumbar-spine': ['Core strengthening', 'Movement retraining'],
    'knee': ['Quadriceps strengthening', 'Gait training'],
    'ankle': ['Balance training', 'Proprioceptive exercises']
  };
  return [...base, ...(regionSpecific[region] || [])];
}

function getICD10ForCondition(condition) {
  const icd10Map = {
    'Rotator cuff tendinopathy': { code: 'M75.30', desc: 'Calcific tendinitis of shoulder, unspecified' },
    'Cervical strain': { code: 'S13.4XXA', desc: 'Sprain of ligaments of cervical spine, initial encounter' },
    'Lumbar strain': { code: 'S33.5XXA', desc: 'Sprain of ligaments of lumbar spine, initial encounter' },
    'Knee osteoarthritis': { code: 'M17.9', desc: 'Osteoarthritis of knee, unspecified' },
    'Ankle sprain': { code: 'S93.409A', desc: 'Sprain of unspecified ligament of unspecified ankle, initial encounter' }
  };
  return icd10Map[condition] || { code: 'M79.3', desc: 'Panniculitis, unspecified' };
}

function getCPTForAcuity(acuity) {
  const baseCPT = ['97110', '97112', '97140'];
  const acuityCPT = {
    acute: ['97012'],
    subacute: ['97116'],
    chronic: ['97535', '97530']
  };
  return [...baseCPT, ...(acuityCPT[acuity] || [])];
}

// Export additional utilities for potential standalone use
export {
  normalizeSex,
  normalizeAge,
  normalizeRegionSlug,
  mapFrequencyToEnum,
  mapDurationToEnum,
  generateSmartGoals,
  getDefaultGoalForRegion,
  getRegionTemplate
};
