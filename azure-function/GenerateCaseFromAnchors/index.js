// Azure Function: GenerateCaseFromAnchors
// Minimal HTTP endpoint that accepts anchors and returns a deterministic case JSON.
// CORS-friendly and safe defaults; mirrors the frontend shape expected by CaseInitialization.

function mapFrequencyToEnum(v = '') {
  const s = String(v || '').toLowerCase();
  if (!s) return '';
  if (/(^|\b)1x(\b|\/|\s)/.test(s) || s.includes('1x per week')) return '1x-week';
  if (/(^|\b)2x(\b|\/|\s)/.test(s) || s.includes('2x per week')) return '2x-week';
  if (/(^|\b)3x(\b|\/|\s)/.test(s) || s.includes('3x per week')) return '3x-week';
  if (/(^|\b)4x(\b|\/|\s)/.test(s) || s.includes('4x per week')) return '4x-week';
  if (/(^|\b)5x(\b|\/|\s)/.test(s) || s.includes('5x per week') || s.includes('daily')) return '5x-week';
  if (s.includes('2x per day') || s.includes('twice a day')) return '2x-day';
  if (s.includes('prn')) return 'prn';
  return s;
}
function mapDurationToEnum(v = '') {
  const s = String(v || '').toLowerCase();
  if (!s) return '';
  if (s.includes('2') && s.includes('week')) return '2-weeks';
  if (s.includes('4') && s.includes('week')) return '4-weeks';
  if (s.includes('6') && s.includes('week')) return '6-weeks';
  if (s.includes('8') && s.includes('week')) return '8-weeks';
  if (s.includes('12') && s.includes('week')) return '12-weeks';
  if (s.includes('16') && s.includes('week')) return '16-weeks';
  if (s.includes('6') && s.includes('month')) return '6-months';
  if (s.includes('ongoing')) return 'ongoing';
  return s;
}

function regionSlug(region = '') {
  const r = String(region || '').toLowerCase();
  const map = {
    shoulder: 'shoulder',
    knee: 'knee',
    hip: 'hip',
    ankle: 'ankle',
    foot: 'foot',
    wrist: 'wrist',
    elbow: 'elbow',
    hand: 'hand',
    cervical: 'cervical-spine',
    neck: 'cervical-spine',
    lumbar: 'lumbar-spine',
    'low back': 'lumbar-spine',
    thoracic: 'thoracic-spine'
  };
  return map[r] || r || 'shoulder';
}

function buildDeterministicCase(anchors = {}) {
  const title = anchors.title || 'Generated PT Case';
  const setting = anchors.setting || 'Outpatient';
  const age = anchors.age || 45;
  const sex = (anchors.sex || 'unspecified').toLowerCase();
  const acuity = anchors.acuity || 'subacute';
  const region = anchors.region || 'shoulder';
  const regionSlugVal = regionSlug(region);
  const condition = anchors.condition || 'Rotator cuff tendinopathy';

  const hpi = anchors.prompt || `Patient presents with ${condition} in the ${region}.`;

  const planFrequency = mapFrequencyToEnum(anchors.frequency || '2x per week');
  const planDuration = mapDurationToEnum(anchors.duration || '6 weeks');

  const stg = `In ${planDuration.replace('-weeks', ' weeks')}, reduce pain to ${anchors.pain ?? 2}/10 and improve ${region} ROM by 20%.`;
  const ltg = `Return to prior level of function for ADLs and work/sport without pain within 12 weeks.`;

  return {
    title,
    setting,
    patientAge: age,
    patientGender: sex,
    acuity,
    createdBy: 'faculty',
    createdAt: new Date().toISOString(),
    meta: {
      title,
      setting,
      patientAge: age,
      patientGender: sex,
      acuity,
      diagnosis: condition,
      regions: [regionSlugVal]
    },
    snapshot: { age: String(age), sex, teaser: `${age}y ${sex} with ${condition}` },
    history: {
      chief_complaint: anchors.cc || `Pain and limited ${region} function`,
      hpi,
      pmh: ["HTN"],
      meds: ["NSAIDs"],
      red_flag_signals: []
    },
    findings: {
      rom: {},
      mmt: {},
      special_tests: [],
      outcome_options: []
    },
    encounters: {
      eval: {
        subjective: {
          chiefComplaint: anchors.cc || `Pain and limited ${region} function`,
          historyOfPresentIllness: hpi,
          painScale: anchors.pain ?? '',
          patientGoals: anchors.goal || 'Reduce pain and return to activity'
        },
        objective: {
          rom: {},
          mmt: {}
        },
        assessment: {
          primaryImpairments: `${region} pain, decreased ROM, decreased strength`,
          ptDiagnosis: condition,
          prognosis: (anchors.prognosis || 'good').toLowerCase(),
          prognosticFactors: 'No significant comorbidities.'
        },
        plan: {
          frequency: planFrequency,
          duration: planDuration,
          interventions: ['Therapeutic Exercise', 'Manual Therapy', 'Patient Education'],
          shortTermGoals: stg,
          longTermGoals: ltg
        },
        billing: {
          diagnosisCodes: ['M75.1'],
          billingCodes: ['97110', '97140']
        }
      }
    }
  };
}

module.exports = async function (context, req) {
  // Basic CORS handling
  const origin = req.headers.origin || '*';
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    };
    return;
  }

  try {
    const anchors = req.body || {};
    const result = buildDeterministicCase(anchors);

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin
      },
      body: result
    };
  } catch (err) {
    context.log.error('Generation failed', err);
    context.res = {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': origin },
      body: { error: 'Generation failed' }
    };
  }
};
