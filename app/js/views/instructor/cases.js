import { route, navigate } from '../../core/router.js';
import * as store from '../../core/store.js';
import { generateCase } from '../../services/index.js';
import { el } from '../../ui/utils.js';
// Stop importing JS icons; we'll use the HTML sprite via <use>

// Compute age from a YYYY-MM-DD string
function computeAgeFromDob(dobStr) {
  if (!dobStr) return '';
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 && age < 200 ? String(age) : '';
}

// Lightweight YouTube-style Share Popup
function showSharePopup(url) {
  let status;
  const overlay = el('div', {
    style: `position: fixed; inset: 0; background: rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:1100;`,
    onclick: (e) => { if (e.target === overlay) document.body.removeChild(overlay); }
  });
  const card = el('div', {
    role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Share',
    style: `background:var(--bg); color:var(--text); border-radius:12px; width:92%; max-width:520px; box-shadow:0 20px 45px rgba(0,0,0,0.2); padding:20px 20px 16px; position:relative;`,
    onclick: (e) => e.stopPropagation()
  }, [
    el('div', { style: 'display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;' }, [
      el('h3', { style: 'margin:0; font-size:18px; font-weight:600;' }, 'Share'),
      el('button', { class: 'btn icon', 'aria-label': 'Close', style: 'border:none; background:transparent; font-size:18px; cursor:pointer; padding:4px;', onclick: () => document.body.removeChild(overlay) }, '✕')
    ]),
  (() => { const row = el('div', { style: 'display:flex; gap:8px; align-items:center; margin:8px 0 4px;' });
            const input = el('input', { type: 'text', value: url, readOnly: true, style: 'flex:1; padding:10px 12px; border:1px solid var(--input-border); border-radius:8px; font-size:14px;' });
            const copyBtn = el('button', { class: 'btn small primary', style: 'white-space:nowrap;', onclick: async () => { try { await navigator.clipboard.writeText(url); status.textContent = 'Copied!'; } catch { status.textContent = 'Copy failed. Select text to copy.'; input.select(); input.focus(); } setTimeout(() => { status.textContent = '' }, 2000); } }, 'Copy');
            row.append(input, copyBtn); return row; })(),
  (() => { const s = el('div', { style: 'min-height:18px; font-size:12px; color:var(--success); margin-top:2px;' }, ''); status = s; return s; })(),
    el('div', { style: 'display:flex; justify-content:flex-end; gap:8px; margin-top:8px;' }, [
      el('a', { href: url, target: '_blank', rel: 'noopener noreferrer', class: 'btn small secondary', style: 'text-decoration:none;' }, 'Open Link')
    ])
  ]);
  // status declared above
  overlay.append(card); document.body.appendChild(overlay);
  setTimeout(() => { const input = card.querySelector('input'); input?.focus(); input?.select(); }, 0);
  const onKey = (e) => { if (e.key === 'Escape') { document.body.removeChild(overlay); window.removeEventListener('keydown', onKey); } };
  window.addEventListener('keydown', onKey);
}

// Case Creation Modal
function showCaseCreationModal() {
  const modal = el('div', {
    style: `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `,
    onclick: (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    }
  }, [
    el('div', {
      style: `
        background: var(--bg);
        color: var(--text);
        padding: 32px;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      `,
      onclick: (e) => e.stopPropagation()
    }, [
      el('h2', { 
        class: 'instructor-title'
      }, 'Create New Case'),
      
      // Form
      el('form', {
        id: 'case-creation-form',
        onsubmit: handleCaseCreation
      }, [
        // Title
        el('div', { 
          class: 'instructor-form-field'
        }, [
          el('label', { 
            class: 'instructor-form-label'
          }, 'Case Title *'),
          el('input', {
            type: 'text',
            id: 'case-title',
            required: true,
            class: 'instructor-form-input',
            placeholder: 'e.g., Post-surgical ACL reconstruction'
          })
        ]),
        
        // DOB Row (moved up after Title)
        el('div', { style: 'margin-bottom: 16px;' }, [
          el('label', { 
            style: 'display: block; margin-bottom: 8px; font-weight: 500; color: var(--text);' 
          }, 'DOB'),
          el('input', {
            type: 'date',
            id: 'case-dob',
            style: `
              width: 100%;
              padding: 12px;
              border: 1px solid var(--input-border);
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            `,
            oninput: (e) => {
              // Mark as user-edited if they type a DOB
              if (e.isTrusted) delete e.target.dataset.autofilled;
              const computed = computeAgeFromDob(e.target.value);
              if (computed) {
                const ageEl = document.getElementById('case-age');
                if (ageEl) ageEl.value = computed;
              }
            }
          }),
          el('div', { style: 'margin-top: 6px; font-size: 12px; color: var(--text-secondary);' }, 'Age auto-fills when DOB is entered.')
        ]),
        
  // Age and Sex Row
        el('div', { style: 'display: flex; gap: 16px; margin-bottom: 16px;' }, [
          el('div', { style: 'flex: 1;' }, [
            el('label', { 
              style: 'display: block; margin-bottom: 8px; font-weight: 500; color: var(--text);' 
            }, 'Patient Age *'),
            el('input', {
              type: 'number',
              id: 'case-age',
              required: true,
              min: 0,
              max: 120,
              style: `
                width: 100%;
                padding: 12px;
                border: 1px solid var(--input-border);
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
              `,
              placeholder: '25',
              oninput: (e) => {
                const dobEl = document.getElementById('case-dob');
                if (!dobEl) return;
                // Only set DOB if empty or previously auto-filled
                if (dobEl.value && dobEl.dataset.autofilled !== 'age') return;
                const v = parseInt(e.target.value, 10);
                if (isNaN(v) || v <= 0 || v > 120) return;
                const today = new Date();
                const y = today.getFullYear() - v;
                const m = today.getMonth();
                const lastDay = new Date(y, m + 1, 0).getDate();
                const d = Math.min(today.getDate(), lastDay);
                const mm = String(m + 1).padStart(2, '0');
                const dd = String(d).padStart(2, '0');
                dobEl.value = `${y}-${mm}-${dd}`;
                dobEl.dataset.autofilled = 'age';
              }
            })
          ]),
          el('div', { style: 'flex: 1;' }, [
            el('label', { 
              style: 'display: block; margin-bottom: 8px; font-weight: 500; color: var(--text);' 
            }, 'Sex *'),
            el('select', {
              id: 'case-gender',
              required: true,
              style: `
                width: 100%;
                padding: 12px;
                border: 1px solid var(--input-border);
                border-radius: 6px;
                font-size: 14px;
                box-sizing: border-box;
              `
            }, [
              el('option', { value: '' }, 'Select...'),
              el('option', { value: 'male' }, 'Male'),
              el('option', { value: 'female' }, 'Female'),
              el('option', { value: 'other' }, 'Other'),
              el('option', { value: 'prefer-not-to-say' }, 'Prefer not to say')
            ])
          ])
        ]),

        // Setting (moved below Age/Sex)
        el('div', { 
          class: 'instructor-form-field'
        }, [
          el('label', { 
            class: 'instructor-form-label'
          }, 'Clinical Setting *'),
          el('select', {
            id: 'case-setting',
            required: true,
            class: 'instructor-form-input'
          }, [
            el('option', { value: '' }, 'Select setting...'),
            el('option', { value: 'Outpatient' }, 'Outpatient'),
            el('option', { value: 'Inpatient' }, 'Inpatient'),
            el('option', { value: 'Home Health' }, 'Home Health'),
            el('option', { value: 'SNF' }, 'Skilled Nursing Facility (SNF)'),
            el('option', { value: 'Acute Rehab' }, 'Acute Rehabilitation'),
            el('option', { value: 'Other' }, 'Other')
          ])
        ]),
        
        // Acuity
        el('div', { style: 'margin-bottom: 24px;' }, [
          el('label', { 
            style: 'display: block; margin-bottom: 8px; font-weight: 500; color: var(--text);' 
          }, 'Case Acuity *'),
          el('select', {
            id: 'case-acuity',
            required: true,
            style: `
              width: 100%;
              padding: 12px;
              border: 1px solid var(--input-border);
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            `
          }, [
            el('option', { value: '' }, 'Select acuity...'),
            el('option', { value: 'acute' }, 'Acute - Recent onset'),
            el('option', { value: 'subacute' }, 'Subacute - Ongoing condition'),
            el('option', { value: 'chronic' }, 'Chronic - Long-term condition'),
            el('option', { value: 'unspecified' }, 'Unspecified')
          ])
        ]),
        
        // Buttons
        el('div', { style: 'display: flex; gap: 12px; justify-content: flex-end;' }, [
          el('button', {
            type: 'button',
            class: 'btn neutral',
            style: 'padding: 12px 24px; font-size: 14px;',
            onclick: () => document.body.removeChild(modal)
          }, 'Cancel'),
          el('button', {
            type: 'submit',
            class: 'btn primary',
            style: 'padding: 12px 24px; font-size: 14px;'
          }, 'Create Case')
        ])
      ])
    ])
  ]);
  
  document.body.appendChild(modal);
  
  // Focus the first input
  setTimeout(() => {
    document.getElementById('case-title')?.focus();
  }, 100);
}

// Prompt-driven Case Generation Modal
function showPromptGenerationModal() {
  const modal = el('div', {
    style: `position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000;`,
    onclick: (e) => { if (e.target === modal) document.body.removeChild(modal); }
  }, [
    el('div', {
      style: `background:var(--bg); padding:28px; border-radius:12px; max-width:720px; width:92%; box-shadow:0 20px 25px -5px rgba(0,0,0,0.15); color:var(--text);`,
      onclick: (e) => e.stopPropagation()
    }, [
  el('h2', { style:'margin:0 0 12px 0; color: var(--text);' }, 'Generate Case from Prompt'),
  el('p', { class:'small', style:'margin:0 0 14px 0; color:var(--text-secondary);' }, 'Provide a short scenario and anchors; we\'ll seed a realistic draft you can edit.'),
      // Title (optional)
      el('div', { style:'margin-bottom:12px;' }, [
  el('label', { style:'display:block; margin-bottom:6px; font-weight:600; color:var(--text);' }, 'Case Title (optional)'),
  el('input', { id:'gen-title', type:'text', placeholder:'e.g., Rotator Cuff Tendinopathy (R)', style:'width:100%; padding:10px 12px; border:1px solid var(--input-border); border-radius:8px; font-size:14px;' })
      ]),
      // Scenario prompt
      el('div', { style:'margin-bottom:12px;' }, [
  el('label', { style:'display:block; margin-bottom:6px; font-weight:600; color:var(--text);' }, 'Scenario Prompt (1–3 sentences) *'),
  el('textarea', { id:'gen-prompt', rows:3, placeholder:'Key history/context to ground the case...', style:'width:100%; padding:10px 12px; border:1px solid var(--input-border); border-radius:8px; font-size:14px; resize:vertical;' })
      ]),
      // Structured anchors row 1
      el('div', { style:'display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap;' }, [
        // Region
        (() => {
          const regions = ['shoulder','knee','low back','neck','ankle','hip','elbow','wrist'];
          const sel = el('select', { id:'gen-region', required:true, style:'flex:1; min-width:180px; padding:10px 12px; border:1px solid var(--input-border); border-radius:8px; font-size:14px;' });
          sel.append(el('option', { value:'' }, 'Select region...'));
          regions.forEach(r => sel.append(el('option', { value:r }, r)));
          return el('div', { style:'flex:1; min-width:200px;' }, [
            el('label', { style:'display:block; margin-bottom:6px; font-weight:600; color:var(--text);' }, 'Body Region *'),
            sel
          ]);
        })(),
        // Condition
        el('div', { style:'flex:1; min-width:200px;' }, [
          el('label', { style:'display:block; margin-bottom:6px; font-weight:600; color:var(--text);' }, 'Suspected Condition *'),
          el('input', { id:'gen-condition', type:'text', placeholder:'e.g., Rotator cuff tendinopathy', style:'width:100%; padding:10px 12px; border:1px solid var(--input-border); border-radius:8px; font-size:14px;' })
        ])
      ]),
      // Structured anchors row 2
      el('div', { style:'display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap;' }, [
        // Setting
  (() => { const sel = el('select', { id:'gen-setting', style:'flex:1; min-width:180px; padding:10px 12px; border:1px solid var(--input-border); border-radius:8px; font-size:14px;' });
          sel.append(
            el('option', { value:'' }, 'Select setting...'),
            el('option', { value:'Outpatient' }, 'Outpatient'),
            el('option', { value:'Inpatient' }, 'Inpatient'),
            el('option', { value:'Home Health' }, 'Home Health'),
            el('option', { value:'SNF' }, 'SNF'),
            el('option', { value:'Acute Rehab' }, 'Acute Rehab')
          );
          return el('div', { style:'flex:1; min-width:200px;' }, [
            el('label', { style:'display:block; margin-bottom:6px; font-weight:600; color:var(--text);' }, 'Clinical Setting *'),
            sel
          ]);
        })(),
        // Acuity
  (() => { const sel = el('select', { id:'gen-acuity', style:'flex:1; min-width:180px; padding:10px 12px; border:1px solid var(--input-border); border-radius:8px; font-size:14px;' });
          sel.append(
            el('option', { value:'' }, 'Select acuity...'),
            el('option', { value:'acute' }, 'Acute'),
            el('option', { value:'subacute' }, 'Subacute'),
            el('option', { value:'chronic' }, 'Chronic')
          );
          return el('div', { style:'flex:1; min-width:200px;' }, [
            el('label', { style:'display:block; margin-bottom:6px; font-weight:600; color:var(--text);' }, 'Acuity *'),
            sel
          ]);
        })()
      ]),
      // Structured anchors row 3
      el('div', { style:'display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap;' }, [
        el('div', { style:'flex:1; min-width:160px;' }, [
          el('label', { style:'display:block; margin-bottom:6px; font-weight:600; color:var(--text);' }, 'Age (yrs)'),
          el('input', { id:'gen-age', type:'number', min:1, max:120, placeholder:'45', style:'width:100%; padding:10px 12px; border:1px solid var(--input-border); border-radius:8px; font-size:14px;' })
        ]),
        el('div', { style:'flex:1; min-width:180px;' }, [
          el('label', { style:'display:block; margin-bottom:6px; font-weight:600; color:var(--text);' }, 'Sex'),
          (() => { const sel = el('select', { id:'gen-sex', style:'width:100%; padding:10px 12px; border:1px solid var(--input-border); border-radius:8px; font-size:14px;' });
            sel.append(el('option', { value:'' }, 'Select...'), el('option', { value:'female' }, 'Female'), el('option', { value:'male' }, 'Male'), el('option', { value:'unspecified' }, 'Unspecified'));
            return sel; })()
        ]),
        el('div', { style:'flex:1; min-width:200px;' }, [
          el('label', { style:'display:block; margin-bottom:6px; font-weight:600; color:var(--text);' }, 'Pain (0–10)'),
          el('input', { id:'gen-pain', type:'number', min:0, max:10, step:'1', placeholder:'5', style:'width:100%; padding:10px 12px; border:1px solid var(--input-border); border-radius:8px; font-size:14px;' })
        ])
      ]),
      // Functional goal
      el('div', { style:'margin-bottom:12px;' }, [
  el('label', { style:'display:block; margin-bottom:6px; font-weight:600; color:var(--text);' }, 'Functional Goal (optional)'),
  el('input', { id:'gen-goal', type:'text', placeholder:'e.g., reach overhead to place dishes', style:'width:100%; padding:10px 12px; border:1px solid var(--input-border); border-radius:8px; font-size:14px;' })
      ]),
      // Buttons
      el('div', { style:'display:flex; gap:10px; justify-content:flex-end; margin-top:6px;' }, [
        el('button', { class:'btn neutral', onclick:() => document.body.removeChild(modal) }, 'Cancel'),
        el('button', { class:'btn primary', onclick:() => handlePromptGeneration(modal) }, 'Generate Case')
      ])
    ])
  ]);
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('gen-prompt')?.focus(), 0);
}

function handlePromptGeneration(modal) {
  const v = (id) => (document.getElementById(id)?.value || '').trim();
  const prompt = v('gen-prompt');
  const region = v('gen-region');
  const condition = v('gen-condition');
  const setting = v('gen-setting');
  const acuity = v('gen-acuity');
  const age = parseInt(v('gen-age'), 10) || undefined;
  const sex = v('gen-sex') || 'unspecified';
  const pain = Math.max(0, Math.min(10, parseInt(v('gen-pain'), 10) || 0));
  const goal = v('gen-goal');
  let title = v('gen-title');

  if (!prompt || !region || !condition || !setting || !acuity) {
    alert('Please provide: Prompt, Region, Condition, Setting, and Acuity.');
    return;
  }
  if (!title) title = `${capitalize(region)} ${capitalizeFirst(condition)} (${capitalize(acuity)})`;

  const anchors = { title, prompt, region, condition, setting, acuity, age, sex, pain, goal };
  const generated = generateCase(anchors);
  createCaseFromGenerated(generated, modal);
}

function capitalize(s){ const t=(s||'').toString().trim(); return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; }
function capitalizeFirst(s){ const t=(s||'').trim(); return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; }

function createCaseFromGenerated(caseData, modal){
  (async () => {
    try {
      const newCase = await store.createCase(caseData);
      if (modal) document.body.removeChild(modal);
      navigate(`#/instructor/editor?case=${newCase.id}`);
    } catch (e) {
      console.error('Failed to create generated case:', e);
      alert('Could not create the case. See console for details.');
    }
  })();
}

function handleCaseCreation(e) {
  e.preventDefault();
  
  const title = document.getElementById('case-title').value.trim();
  const setting = document.getElementById('case-setting').value;
  let age = parseInt(document.getElementById('case-age').value);
  const gender = document.getElementById('case-gender').value;
  const acuity = document.getElementById('case-acuity').value;
  const dob = document.getElementById('case-dob')?.value || '';
  if ((!age || isNaN(age)) && dob) {
    const computed = parseInt(computeAgeFromDob(dob));
    if (!isNaN(computed)) age = computed;
  }
  // If DOB empty but Age present, generate a realistic DOB (today minus age years)
  let dobFinal = dob;
  if ((!dobFinal || dobFinal === '') && age && !isNaN(age)) {
    const today = new Date();
    const y = today.getFullYear() - age;
    const m = today.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    const d = Math.min(today.getDate(), lastDay);
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    dobFinal = `${y}-${mm}-${dd}`;
  }
  
  if (!title || !setting || (!age && !dob) || !gender || !acuity) {
    alert('Please fill in all required fields.');
    return;
  }
  
  handleCaseCreationAsync(title, setting, age, gender, acuity, dobFinal);
}

async function handleCaseCreationAsync(title, setting, age, gender, acuity, dob) {
  try {
    // Create the case with proper structure and metadata
    const normalizeSex = (s) => {
      if (!s) return 'unspecified';
      const v = String(s).toLowerCase();
      if (v === 'prefer-not-to-say') return 'unspecified';
      if (['male','female','other','unspecified'].includes(v)) return v;
      return 'unspecified';
    };

    const caseData = {
      title,
      setting,
      patientAge: age,
      patientGender: gender,
      acuity,
      patientDOB: dob || undefined,
      createdBy: 'faculty',
      createdAt: new Date().toISOString(),
      meta: {
        title,
        setting,
        patientAge: age,
        patientGender: gender,
        acuity,
        patientDOB: dob || undefined
      },
      snapshot: {
        age: String(age ?? ''),
        sex: normalizeSex(gender),
        dob: dob || ''
      },
      history: [],
      findings: {},
      encounters: {
        eval: {
          subjective: {},
          objective: {},
          assessment: {},
          plan: {}
        }
      }
    };
    
  const newCase = await store.createCase(caseData);

    
    // Close modal
    const modal = document.querySelector('[style*="z-index: 1000"]');
    if (modal) {
      document.body.removeChild(modal);
    }
    
    // Navigate to editor with proper case ID
    navigate(`#/instructor/editor?case=${newCase.id}`);
    
  } catch (error) {
    console.error('Error creating case:', error);
    alert('Error creating case. Please try again.');
  }
}



route('#/instructor/cases', async (app) => {
  let allCases = [];

  // Tiny helper to create a sprite-based icon element
  function spriteIcon(name, { className = 'icon', size } = {}) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', className);
    if (size) {
      svg.style.width = size;
      svg.style.height = size;
    }
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#icon-${name}`);
    svg.appendChild(use);
    return svg;
  }

  let sortColumn = '';
  let sortDirection = 'asc';
  let searchTerm = '';

  function renderSearchAndTable() {
    const container = el('div', {});
    
    // Actions row (Search)
    const actionsRow = el('div', { style: 'display:flex; gap:12px; align-items:center; margin-bottom: 20px;' }, [
      // Search bar
      el('input', {
        type: 'text',
        placeholder: 'Search cases by title, setting, diagnosis, or acuity...',
        value: searchTerm,
        style: 'width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 14px;',
        onInput: (e) => {
          searchTerm = e.target.value.toLowerCase();
          renderTable();
        }
      })
    ]);

  const tableContainer = el('div', { id: 'table-container', class: 'table-responsive' });
    
    container.append(actionsRow, tableContainer);
    
    function renderTable() {
      // Filter cases based on search
      let filteredCases = allCases.filter(c => {
        // Defensive check for case structure
        if (!c || !c.caseObj) return false;
        
        const caseData = c.caseObj.meta || {};
        const title = caseData.title || c.title || 'Untitled';
        const setting = caseData.setting || '';
        const diagnosis = caseData.diagnosis || '';
        const acuity = caseData.acuity || '';
        
        const searchText = `${title} ${setting} ${diagnosis} ${acuity}`.toLowerCase();
        return searchText.includes(searchTerm);
      });

      // Sort cases
      if (sortColumn) {
        filteredCases.sort((a, b) => {
          let aVal, bVal;
          
          if (sortColumn === 'title') {
            aVal = a.title || (a.caseObj?.meta?.title) || 'Untitled';
            bVal = b.title || (b.caseObj?.meta?.title) || 'Untitled';
          } else {
            // Safe access to meta properties
            aVal = a.caseObj?.meta?.[sortColumn] || '';
            bVal = b.caseObj?.meta?.[sortColumn] || '';
          }
          
          if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
          }
          
          let comparison = 0;
          if (aVal > bVal) comparison = 1;
          if (aVal < bVal) comparison = -1;
          
          return sortDirection === 'desc' ? -comparison : comparison;
        });
      }

      const table = renderCaseTable(filteredCases);
      tableContainer.innerHTML = '';
      tableContainer.append(table);
    }

    renderTable();
    return container;
  }

  function createSortableHeader(text, column) {
    const isActive = sortColumn === column;
    const isDesc = isActive && sortDirection === 'desc';
    
  const header = document.createElement('th');
  header.className = 'sortable';
  // Accessibility: indicate sort state for assistive tech and enable CSS highlighting
  if (isActive) header.setAttribute('aria-sort', isDesc ? 'descending' : 'ascending');
    header.style.cssText = `
      cursor: pointer; 
      user-select: none; 
      -webkit-user-select: none;
      position: relative; 
      padding: 12px 8px;
    `;
    
    // Create the header content
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 8px;';
    
    const textSpan = document.createElement('span');
    textSpan.style.fontWeight = '600';
    textSpan.textContent = text;
    
  const icon = spriteIcon(isActive ? (isDesc ? 'sortDesc' : 'sortAsc') : 'sort', { className: 'icon sort-icon' });
  icon.style.opacity = isActive ? '0.9' : '0.5';

    container.appendChild(textSpan);
    container.appendChild(icon);
    header.appendChild(container);
    
    // Add event listeners
  // Hover/underline handled via CSS theme
  header.addEventListener('click', () => {
      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = 'asc';
      }
      const tableContainer = document.getElementById('table-container');
      if (tableContainer && tableContainer.parentElement) {
        const container = tableContainer.parentElement;
        const newContainer = renderSearchAndTable();
        container.innerHTML = '';
        container.append(...newContainer.children);
      }
    });
    
    return header;
  }

  async function loadAndRender() {
    app.innerHTML = ''; // Clear previous content
    const loadingIndicator = el('div', { class: 'panel' }, 'Loading cases...');
    app.append(loadingIndicator);

    try {
  allCases = await store.listCases();
    } catch (error) {
      console.error('Failed to load cases:', error);
      app.innerHTML = ''; // Clear loading indicator
      app.append(el('div', { class: 'panel error' }, 'Error loading cases. Please check the console for details.'));
      return;
    }
    
    app.innerHTML = ''; // Clear loading indicator
    app.append(
      el('div', { class: 'panel' }, [
        el('div', { class: 'flex-between', style: 'margin-bottom: 20px;' }, [
          el('h2', {}, 'Faculty Dashboard'),
          el('div', { style: 'display:flex; gap:10px;' }, [
            el('button', { 
              class: 'btn primary',
              style: 'display: flex; align-items: center; gap: 8px;',
              onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                showCaseCreationModal();
              }
            }, [
              spriteIcon('plus'),
              'Create New Case'
            ]),
            el('button', { 
              class: 'btn secondary',
              style: 'display: flex; align-items: center; gap: 8px;',
              onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                showPromptGenerationModal();
              }
            }, [
              spriteIcon('edit'),
              'Generate from Prompt'
            ])
          ])
        ]),
        renderSearchAndTable()
      ])
    );

    // If navigated with ?create=true, open the creation modal automatically
    try {
      const hash = window.location.hash || '';
      const [, query] = hash.split('?');
      const params = new URLSearchParams(query || '');
      if (params.get('create') === 'true') {
        // Remove the param from the URL to avoid reopening on refresh
        const base = '#/instructor/cases';
        history.replaceState(null, '', `${window.location.pathname}${base}`);
        showCaseCreationModal();
      }
    } catch { /* no-op */ }
  }

  function renderFilters() {
    const filtersPanel = el('div', { class: 'panel' }, [
      el('h3', {}, 'Filter & Group Cases'),
      el('div', { class: 'row', style: 'gap: 15px; align-items: end; flex-wrap: wrap;' }, [
        // Search
        el('div', { class: 'col' }, [
          el('label', { style: 'display: block; margin-bottom: 4px;' }, 'Search'),
          el('input', {
            type: 'text',
            placeholder: 'Search case titles...',
            value: currentFilters.search,
            style: 'width: 200px;',
            onInput: (e) => {
              currentFilters.search = e.target.value;
              renderCases();
            }
          })
        ]),
        // Setting filter
        el('div', { class: 'col' }, [
          (() => {
            const select = el('select', {
              style: 'width: 150px;',
              onChange: (e) => {
                currentFilters.setting = e.target.value;
                renderCases();
              }
            });
            select.append(el('option', { value: 'all' }, 'All Settings'));
            ENUMS.setting.forEach(s => {
              select.append(el('option', { value: s }, s));
            });
            select.value = currentFilters.setting;
            return select;
          })()
        ]),
        // Diagnosis filter
        el('div', { class: 'col' }, [
          el('label', { style: 'display: block; margin-bottom: 4px;' }, 'Diagnosis'),
          (() => {
            const select = el('select', {
              style: 'width: 150px;',
              onChange: (e) => {
                currentFilters.diagnosis = e.target.value;
                renderCases();
              }
            });
            select.append(el('option', { value: 'all' }, 'All Diagnoses'));
            ENUMS.diagnosis.forEach(d => {
              select.append(el('option', { value: d }, d));
            });
            select.value = currentFilters.diagnosis;
            return select;
          })()
        ]),
        // Acuity filter
        el('div', { class: 'col' }, [
          el('label', { style: 'display: block; margin-bottom: 4px;' }, 'Acuity'),
          (() => {
            const select = el('select', {
              style: 'width: 120px;',
              onChange: (e) => {
                currentFilters.acuity = e.target.value;
                renderCases();
              }
            });
            select.append(el('option', { value: 'all' }, 'All Acuity'));
            ['acute', 'subacute', 'chronic'].forEach(a => {
              select.append(el('option', { value: a }, a));
            });
            select.value = currentFilters.acuity;
            return select;
          })()
        ]),
        // Region filter
        el('div', { class: 'col' }, [
          el('label', { style: 'display: block; margin-bottom: 4px;' }, 'Region'),
          (() => {
            const select = el('select', {
              style: 'width: 120px;',
              onChange: (e) => {
                currentFilters.region = e.target.value;
                renderCases();
              }
            });
            select.append(el('option', { value: 'all' }, 'All Regions'));
            ['knee', 'shoulder', 'low back', 'neck', 'ankle', 'hip', 'elbow', 'wrist'].forEach(r => {
              select.append(el('option', { value: r }, r));
            });
            select.value = currentFilters.region;
            return select;
          })()
        ]),
        // Group by
        el('div', { class: 'col' }, [
          el('label', { style: 'display: block; margin-bottom: 4px;' }, 'Group By'),
          (() => {
            const select = el('select', {
              style: 'width: 120px;',
              onChange: (e) => {
                currentFilters.groupBy = e.target.value;
                renderCases();
              }
            });
            ['none', 'setting', 'diagnosis', 'acuity'].forEach(g => {
              select.append(el('option', { value: g }, g.charAt(0).toUpperCase() + g.slice(1)));
            });
            select.value = currentFilters.groupBy;
            return select;
          })()
        ])
      ])
    ]);
    return filtersPanel;
  }

  function renderCases() {
    casesContainer.innerHTML = '';
    let filteredCases = allCases.filter(c => {
      const caseData = c.caseObj?.meta || {};
      const title = caseData.title || c.title || '';
      if (currentFilters.search && !title.toLowerCase().includes(currentFilters.search.toLowerCase())) return false;
      if (currentFilters.setting !== 'all' && caseData.setting !== currentFilters.setting) return false;
      if (currentFilters.diagnosis !== 'all' && caseData.diagnosis !== currentFilters.diagnosis) return false;
      if (currentFilters.acuity !== 'all' && caseData.acuity !== currentFilters.acuity) return false;
      if (currentFilters.region !== 'all' && !(caseData.regions || []).includes(currentFilters.region)) return false;
      return true;
    });

    if (currentFilters.groupBy !== 'none') {
      const groups = filteredCases.reduce((acc, c) => {
        const key = c.caseObj?.meta?.[currentFilters.groupBy] || 'Unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(c);
        return acc;
      }, {});

      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).forEach(([groupName, cases]) => {
        casesContainer.append(el('h3', { class: 'group-header' }, groupName));
        const groupTable = renderCaseTable(cases);
        casesContainer.append(groupTable);
      });
    } else {
      const table = renderCaseTable(filteredCases);
      casesContainer.append(table);
    }
  }

  function renderCaseTable(cases) {
    if (cases.length === 0) {
      return el('div', { style: 'text-align: center; padding: 40px; color: var(--muted);' }, 
        searchTerm ? `No cases match "${searchTerm}"` : 'No cases have been created yet.'
      );
    }
    
  const table = el('table', { class: 'table cases-table' }, [
      el('thead', {}, el('tr', {}, [
        createSortableHeader('Case Title', 'title'),
        createSortableHeader('Setting', 'setting'),
        createSortableHeader('Diagnosis', 'diagnosis'),
        createSortableHeader('Acuity', 'acuity'),
        el('th', {}, '')
      ])),
      el('tbody', {}, cases.map(c => {
  const studentLink = `${window.location.origin}${window.location.pathname}#/student/editor?case=${c.id}&v=${c.latestVersion}&encounter=eval`;
        const meta = c.caseObj?.meta || {};
        return el('tr', {}, [
          el('td', {}, c.title || meta.title || 'Untitled'),
          el('td', {}, meta.setting || ''),
          el('td', {}, meta.diagnosis || ''),
          el('td', {}, meta.acuity || ''),
          el('td', { style: 'white-space: nowrap;' }, [
            el('button', { 
              class: 'btn small primary',
              style: 'margin-right: 8px;',
              onClick: async (e) => {
                showSharePopup(studentLink);
                try { await navigator.clipboard.writeText(studentLink); } catch {}
                const originalContent = e.target.innerHTML;
                e.target.innerHTML = '<span>✓ Copied!</span>';
                setTimeout(() => { e.target.innerHTML = originalContent; }, 2000);
              }
            }, [
              spriteIcon('share'),
              'Share'
            ]),
            el('button', { 
              class: 'btn small primary',
              style: 'margin-right: 8px;',
              onClick: () => navigate(`#/instructor/editor?case=${c.id}&v=${c.latestVersion || 0}&encounter=eval`) 
            }, [
              spriteIcon('edit'),
              'Edit'
            ]),
            el('button', { 
              class: 'btn small primary',
              style: 'margin-right: 8px;',
              onClick: () => navigate(`#/student/editor?case=${c.id}&v=${c.latestVersion}&encounter=eval`) 
            }, [
              spriteIcon('preview'),
              'Student View'
            ]),
            el('button', { 
              class: 'btn small primary',
              style: 'margin-right: 8px;',
              onClick: () => navigate(`#/student/editor?case=${c.id}&v=${c.latestVersion}&encounter=eval&key=true`) 
            }, [
              spriteIcon('preview'),
              'Answer Key'
            ]),
            el('button', {
              class: 'btn small subtle-danger',
              style: 'display: inline-flex; align-items: center; gap: 6px;',
              onClick: async () => {
                if (confirm(`Are you sure you want to delete "${c.title}"?`)) {
                  try {
                    await store.deleteCase(c.id);
                    await loadAndRender(); // Reload all data and re-render the view
                  } catch (error) {
                    console.error('Failed to delete case:', error);
                    alert('Error deleting case. See console for details.');
                  }
                }
              }
            }, [
              spriteIcon('delete'),
              'Delete'
            ])
          ])
        ]);
      }))
    ]);
    
    return table;
  }

  loadAndRender();
});
