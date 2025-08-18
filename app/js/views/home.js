// Home view - Rich Landing page for PT EMR Simulator
import { route, navigate } from '../core/router.js';
import { el } from '../ui/utils.js';
import { listCases, listDrafts } from '../core/store.js';

function countDrafts(draftsMap) {
  let count = 0;
  Object.values(draftsMap || {}).forEach(encMap => {
    count += Object.keys(encMap || {}).length;
  });
  return count;
}

function buildResumeCard(lastHash, allCases) {
  if (!lastHash || lastHash === '#/' || lastHash === '#/404') return null;
  const [path, query] = lastHash.split('?');
  const params = new URLSearchParams(query || '');
  const caseId = params.get('case');
  const section = params.get('section');
  const isFaculty = path.startsWith('#/instructor/');
  const audience = isFaculty ? 'Faculty' : 'Student';
  const caseTitle = caseId ? (allCases.find(c => c.id === caseId)?.title || caseId) : '';
  const subtitle = [caseTitle, section].filter(Boolean).join(' • ');
  return el('div', { class: 'panel' }, [
    el('h3', {}, 'Resume where you left off'),
    el('p', { style: 'margin-top: 4px;' }, subtitle || 'Return to your last location'),
    el('button', {
      class: 'btn primary',
      onClick: () => navigate(lastHash),
      'aria-label': `Resume as ${audience}`
    }, `Resume (${audience})`)
  ]);
}

// removed featured demo cards

function buildHelpPanel() {
  const onReset = async () => {
    if (!confirm('Reset local data and restore the demo case? This will delete your local cases and drafts.')) return;
    try {
      // Remove cases, counter, and drafts
      localStorage.removeItem('pt_emr_cases');
      localStorage.removeItem('pt_emr_case_counter');
      // Remove all drafts
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('draft_')) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
      // Keep last route so user can resume intentionally if desired, or clear it:
      // localStorage.removeItem('pt_emr_last_route');
      alert('Data reset completed. Demo case restored.');
      // Soft refresh the home view
      navigate('#/');
    } catch (e) {
      console.error('Reset failed:', e);
      alert('Reset failed. Please reload the page.');
    }
  };
  return el('div', { class: 'panel' }, [
    el('h3', {}, 'Help & Tools'),
    el('ul', { style: 'margin: 6px 0 10px 18px;' }, [
      el('li', {}, 'Runs locally; data stored in your browser; works offline'),
      el('li', {}, 'Export documentation to Word from the editor')
    ]),
    el('button', { class: 'btn danger', onClick: onReset }, 'Reset sample data')
  ]);
}

function buildWhatsNewPanel() {
  return el('div', { class: 'panel' }, [
    el('h3', {}, "What's new"),
    el('ul', { style: 'margin: 6px 0 0 18px;' }, [
      el('li', {}, 'Faculty visibility toggles per subsection with sidebar filtering'),
      el('li', {}, 'True Student Preview with seamless back-to-faculty'),
      el('li', {}, 'Precise deep-link scrolling under sticky headers'),
      el('li', {}, 'Relative scroll preservation when switching modes')
    ])
  ]);
}

route('#/', async (app) => {
  app.innerHTML = '';

  // Load data for counts and featured card
  const [cases, drafts] = await Promise.all([
    listCases(),
    Promise.resolve(listDrafts())
  ]);
  const draftsCount = countDrafts(drafts);
  const featured = cases.find(c => c.id === 'demo_case_1') || cases[0];
  const lastHash = localStorage.getItem('pt_emr_last_route');

  // Hero panel (full-width) with What's New
  const hero = el('div', { class: 'panel' }, [
    el('h1', {}, 'Physical Therapy EHR Simulator'),
    el('p', {}, 'Practice professional SOAP documentation and billing in a safe, offline environment.'),
    el('h3', { style: 'margin-top: 10px;' }, "What's new"),
    el('ul', { style: 'margin: 6px 0 0 18px;' }, [
      el('li', {}, 'Faculty visibility toggles per subsection with sidebar filtering'),
      el('li', {}, 'True Student Preview with seamless back-to-faculty'),
      el('li', {}, 'Precise deep-link scrolling under sticky headers'),
      el('li', {}, 'Relative scroll preservation when switching modes')
    ])
  ]);

  // Editor navigation helpers
  function parseQuery(qs) {
    const p = new URLSearchParams(qs || '');
    return Object.fromEntries(p.entries());
  }
  function getLastEditorParams(kind) {
    if (!lastHash) return null;
    const [p, q] = lastHash.split('?');
    const targetPath = kind === 'student' ? '#/student/editor' : '#/instructor/editor';
    if (p !== targetPath) return null;
    const params = parseQuery(q);
    const caseId = params.case;
    const version = params.v ? parseInt(params.v, 10) : 0;
    return caseId ? { caseId, version: Number.isFinite(version) ? version : 0 } : null;
  }
  function goEditor(kind, encounter) {
    const lastParams = getLastEditorParams(kind);
    const fallback = featured ? { caseId: featured.id, version: featured.latestVersion || 0 } : null;
    const picked = lastParams || fallback;
    if (!picked) {
      navigate(kind === 'student' ? '#/student/cases' : '#/instructor/cases');
      return;
    }
    const base = kind === 'student' ? '#/student/editor' : '#/instructor/editor';
    navigate(`${base}?case=${encodeURIComponent(picked.caseId)}&v=${picked.version}&encounter=${encodeURIComponent(encounter)}`);
  }

  // Only show section buttons below

  // No featured demo cards

  // Left (Student) and Right (Faculty) columns
  const studentHeader = el('button', {
    class: 'btn primary',
    style: 'width:100%; font-size:1.1rem; padding:10px 12px;',
    onClick: () => navigate('#/student/cases')
  }, 'STUDENT');
  

  const facultyHeader = el('button', {
    class: 'btn primary',
    style: 'width:100%; font-size:1.1rem; padding:10px 12px;',
    onClick: () => navigate('#/instructor/cases')
  }, 'FACULTY');
  
  // Build a grid with paired rows so related sections align
  const columns = el('div', {
    class: 'home-columns',
    style: 'display:grid; gap:12px; grid-template-columns: 1fr;'
  }, []);

  const rows = [
    // Row 1: Column headers
    [studentHeader, facultyHeader],
    // Row 2: Actions under headers
    [
      el('div', { class: 'home-actions', style: 'display:flex; gap:8px; flex-wrap:wrap;' }, [
  el('button', { class: 'btn secondary', onClick: () => navigate('#/student/cases') }, 'Dashboard'),
  el('button', { class: 'btn secondary', onClick: () => navigate('#/student/drafts') }, 'Drafts'),
  el('button', { class: 'btn secondary', onClick: () => goEditor('student', 'eval') }, 'Evaluation')
      ]),
      el('div', { class: 'home-actions', style: 'display:flex; gap:8px; flex-wrap:wrap;' }, [
  el('button', { class: 'btn secondary', onClick: () => navigate('#/instructor/cases') }, 'Dashboard'),
  el('button', { class: 'btn secondary', onClick: () => navigate('#/instructor/cases?create=true') }, 'Create New Case'),
  el('button', { class: 'btn secondary', onClick: () => goEditor('faculty', 'eval') }, 'Eval Editor')
      ])
    ]
  ];

  rows.forEach(([left, right]) => {
    columns.append(left, right);
  });

  // Responsive columns
  const setCols = () => { columns.style.gridTemplateColumns = window.innerWidth >= 900 ? '1fr 1fr' : '1fr'; };
  setCols();
  window.addEventListener('resize', setCols, { passive: true });

  // Final container: hero spans full width, then columns (+ help already spanning inside columns)
  const container = el('div', { class: 'home-container', style: 'display:grid; gap:12px;' }, [
    hero,
  columns
  ]);

  app.append(container);
});
