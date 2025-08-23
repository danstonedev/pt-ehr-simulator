// ai-case-generator.js - Optional AI-backed case generator (frontend wrapper)
// This module tries an AI endpoint to build a full case JSON. If not configured or it fails,
// callers should fall back to the local deterministic generator.

// Resolve AI endpoint from multiple configurable sources without hard-coding hosting providers.
function getAiEndpoint() {
  try {
    // Preferred: global var (set early by host page)
    if (typeof window !== 'undefined' && window.AI_GENERATE_URL)
      return String(window.AI_GENERATE_URL);
    // Meta tag override: <meta name="ai-generate-url" content="https://..." />
    const meta =
      typeof document !== 'undefined'
        ? document.querySelector('meta[name="ai-generate-url"]')
        : null;
    if (meta && meta.content) return String(meta.content);
    // Local storage (developer configurable)
    if (typeof localStorage !== 'undefined') {
      const ls = localStorage.getItem('aiGenerateUrl');
      if (ls) return String(ls);
    }
  } catch {}
  return '';
}

function mapFrequencyToEnum(v = '') {
  const s = String(v || '').toLowerCase();
  if (!s) return '';
  if (/(^|\b)1x(\b|\/|\s)/.test(s) || s.includes('1x per week')) return '1x-week';
  if (/(^|\b)2x(\b|\/|\s)/.test(s) || s.includes('2x per week')) return '2x-week';
  if (/(^|\b)3x(\b|\/|\s)/.test(s) || s.includes('3x per week')) return '3x-week';
  if (/(^|\b)4x(\b|\/|\s)/.test(s) || s.includes('4x per week')) return '4x-week';
  if (/(^|\b)5x(\b|\/|\s)/.test(s) || s.includes('5x per week') || s.includes('daily'))
    return '5x-week';
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

// Minimal shape check + normalization to the editor's expected schema
function coerceToCaseShape(ai, anchors) {
  if (!ai || typeof ai !== 'object') throw new Error('Invalid AI response');
  const title = ai.title || anchors.title || 'Untitled Case';
  const setting = ai.setting || anchors.setting || 'Outpatient';
  const acuity = ai.acuity || anchors.acuity || 'chronic';
  const age = ai.patientAge || anchors.age || 45;
  const sex = (ai.patientGender || anchors.sex || 'unspecified').toLowerCase();
  const regionSlug = (() => {
    const map = { 'low back': 'lumbar-spine', lumbar: 'lumbar-spine', neck: 'cervical-spine' };
    const key = (anchors.region || '').toLowerCase();
    return ai?.meta?.regions?.[0] || map[key] || key || 'shoulder';
  })();

  // Build containers with safe defaults
  const meta = {
    title,
    setting,
    patientAge: age,
    patientGender: sex,
    acuity,
    diagnosis: ai?.meta?.diagnosis || 'Musculoskeletal',
    regions: [regionSlug],
  };
  const snapshot = ai.snapshot || { age: String(age), sex, teaser: ai?.snapshot?.teaser || '' };
  const history = ai.history || {};
  const findings = ai.findings || {};
  const evalNode = ai.encounters?.eval || {};

  // Normalize plan enums if present
  if (evalNode.plan) {
    evalNode.plan.frequency = mapFrequencyToEnum(evalNode.plan.frequency);
    evalNode.plan.duration = mapDurationToEnum(evalNode.plan.duration);
  }

  // Ensure required subjective anchors exist
  const subjective = {
    chiefComplaint: evalNode.subjective?.chiefComplaint || history.chief_complaint || '',
    historyOfPresentIllness: evalNode.subjective?.historyOfPresentIllness || history.hpi || '',
    painScale: evalNode.subjective?.painScale ?? anchors.pain ?? '',
    patientGoals: evalNode.subjective?.patientGoals || anchors.goal || '',
  };
  const objective = {
    rom: evalNode.objective?.rom || findings.rom || {},
    mmt: evalNode.objective?.mmt || findings.mmt || {},
  };
  const assessment = {
    primaryImpairments: evalNode.assessment?.primaryImpairments || '',
    ptDiagnosis: evalNode.assessment?.ptDiagnosis || anchors.condition || '',
    prognosis: (evalNode.assessment?.prognosis || '').toString().toLowerCase(),
    prognosticFactors: evalNode.assessment?.prognosticFactors || '',
  };
  const plan = {
    frequency: evalNode.plan?.frequency || '',
    duration: evalNode.plan?.duration || '',
    interventions: Array.isArray(evalNode.plan?.interventions) ? evalNode.plan.interventions : [],
    shortTermGoals: evalNode.plan?.shortTermGoals || '',
    longTermGoals: evalNode.plan?.longTermGoals || '',
  };
  const billing = {
    diagnosisCodes: Array.isArray(evalNode.billing?.diagnosisCodes)
      ? evalNode.billing.diagnosisCodes
      : [],
    billingCodes: Array.isArray(evalNode.billing?.billingCodes)
      ? evalNode.billing.billingCodes
      : [],
  };

  return {
    title,
    setting,
    patientAge: age,
    patientGender: sex,
    acuity,
    createdBy: 'faculty',
    createdAt: new Date().toISOString(),
    meta,
    snapshot,
    history: {
      chief_complaint: history.chief_complaint || subjective.chiefComplaint || '',
      hpi: history.hpi || subjective.historyOfPresentIllness || '',
      pmh: Array.isArray(history.pmh) ? history.pmh : history.pmh ? [history.pmh] : [],
      meds: Array.isArray(history.meds) ? history.meds : history.meds ? [history.meds] : [],
      red_flag_signals: Array.isArray(history.red_flag_signals) ? history.red_flag_signals : [],
    },
    findings: {
      rom: objective.rom || {},
      mmt: objective.mmt || {},
      special_tests: Array.isArray(findings.special_tests) ? findings.special_tests : [],
      outcome_options: Array.isArray(findings.outcome_options) ? findings.outcome_options : [],
    },
    encounters: {
      eval: {
        subjective,
        objective,
        assessment,
        plan,
        billing,
      },
    },
  };
}

export async function generateCaseWithAI(anchors) {
  const endpoint = getAiEndpoint();
  if (!endpoint) return null; // Not configured; caller should fall back

  const payload = {
    title: anchors.title || '',
    prompt: anchors.prompt || '',
    region: anchors.region || '',
    condition: anchors.condition || '',
    setting: anchors.setting || '',
    acuity: anchors.acuity || '',
    age: anchors.age,
    sex: anchors.sex,
    pain: anchors.pain,
    goal: anchors.goal,
  };

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // credentials: 'include' // optional if your endpoint uses cookies
    });
    if (!resp.ok) throw new Error(`AI endpoint error: ${resp.status}`);
    const ai = await resp.json();
    return coerceToCaseShape(ai, anchors);
  } catch (e) {
    console.warn('AI generation failed; falling back to local generator.', e);
    return null;
  }
}
