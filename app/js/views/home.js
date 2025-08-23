// Home view - Rich Landing page for PT EMR Simulator
import { route, navigate } from '../core/router.js';
import { storage } from '../core/index.js';
import { el } from '../ui/utils.js';
import { listCases, listDrafts } from '../core/store.js';

function countDrafts(draftsMap) {
  let count = 0;
  Object.values(draftsMap || {}).forEach((encMap) => {
    count += Object.keys(encMap || {}).length;
  });
  return count;
}

function buildHelpPanel() {
  const onReset = async () => {
    if (
      !confirm(
        'Reset local data and restore the demo case? This will delete your local cases and drafts.',
      )
    )
      return;
    try {
      // Remove cases, counter, and drafts
      storage.removeItem('pt_emr_cases');
      storage.removeItem('pt_emr_case_counter');
      // Remove all drafts
      const keys = storage.keys().filter((k) => k && k.startsWith('draft_'));
      keys.forEach((k) => storage.removeItem(k));
      // Keep last route so user can resume intentionally if desired, or clear it:
      // storage.removeItem('pt_emr_last_route');
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
      el('li', {}, 'Export documentation to Word from the editor'),
    ]),
    el('button', { class: 'btn danger', onClick: onReset }, 'Reset sample data'),
  ]);
}

function buildWhatsNewPanel() {
  return el('div', { class: 'panel' }, [
    el('h3', {}, "What's new"),
    el('ul', { style: 'margin: 6px 0 0 18px;' }, [
      el('li', {}, 'Faculty visibility toggles per subsection with sidebar filtering'),
      el('li', {}, 'True Student Preview with seamless back-to-faculty'),
      el('li', {}, 'Precise deep-link scrolling under sticky headers'),
      el('li', {}, 'Relative scroll preservation when switching modes'),
    ]),
  ]);
}

route('#/', async (app) => {
  app.innerHTML = '';

  // Load data for counts and featured card
  const [cases, drafts] = await Promise.all([listCases(), Promise.resolve(listDrafts())]);
  const draftsCount = countDrafts(drafts);
  const featured = cases.find((c) => c.id === 'demo_case_1') || cases[0];
  const lastHash = storage.getItem('pt_emr_last_route');
  const resumeInfo = (() => {
    if (!lastHash || lastHash === '#/' || lastHash === '#/404') return null;
    const [path] = lastHash.split('?');
    const isFaculty = path.startsWith('#/instructor/');
    return { audience: isFaculty ? 'Faculty' : 'Student', hash: lastHash };
  })();

  // Hero panel (full-width)
  const hero = el('div', { class: 'panel' }, [
    el('h1', {}, 'Physical Therapy EHR Simulator'),
    el('p', {}, 'Practice professional SOAP documentation and billing.'),
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
    const fallback = featured
      ? { caseId: featured.id, version: featured.latestVersion || 0 }
      : null;
    const picked = lastParams || fallback;
    if (!picked) {
      navigate(kind === 'student' ? '#/student/cases' : '#/instructor/cases');
      return;
    }
    const base = kind === 'student' ? '#/student/editor' : '#/instructor/editor';
    navigate(
      `${base}?case=${encodeURIComponent(picked.caseId)}&v=${picked.version}&encounter=${encodeURIComponent(encounter)}`,
    );
  }

  // Build main panels
  const studentActions = [];
  studentActions.push(
    el(
      'button',
      { class: 'btn primary', onClick: () => navigate('#/student/cases') },
      'Student Dashboard',
    ),
  );
  if (resumeInfo && resumeInfo.audience === 'Student') {
    studentActions.push(
      el(
        'button',
        { class: 'btn primary', onClick: () => navigate(resumeInfo.hash) },
        'Resume Case',
      ),
    );
  }

  const studentPanel = el('div', { class: 'panel' }, [
    el('h2', {}, 'Student'),
    el(
      'p',
      { class: 'muted', style: 'margin:6px 0 12px 0;' },
      'Work on assigned cases and manage your drafts.',
    ),
    el(
      'div',
      { class: 'home-actions', style: 'display:flex; gap:8px; flex-wrap:wrap;' },
      studentActions,
    ),
  ]);

  const facultyActions = [];
  facultyActions.push(
    el(
      'button',
      { class: 'btn primary', onClick: () => navigate('#/instructor/cases') },
      'Faculty Dashboard',
    ),
  );
  if (resumeInfo && resumeInfo.audience === 'Faculty') {
    facultyActions.push(
      el(
        'button',
        { class: 'btn primary', onClick: () => navigate(resumeInfo.hash) },
        'Resume Case',
      ),
    );
  }

  const facultyPanel = el('div', { class: 'panel' }, [
    el('h2', {}, 'Faculty'),
    el(
      'p',
      { class: 'muted', style: 'margin:6px 0 12px 0;' },
      'Create and edit cases; preview as a student.',
    ),
    el(
      'div',
      { class: 'home-actions', style: 'display:flex; gap:8px; flex-wrap:wrap;' },
      facultyActions,
    ),
  ]);

  // Side panels
  const whatsNew = buildWhatsNewPanel();
  const help = buildHelpPanel();

  // Row 2: Student + Faculty (full-width row with 2-up on desktop)
  const studentFacultyRow = el(
    'div',
    {
      class: 'row-student-faculty',
      style: 'display:grid; gap:12px; grid-template-columns: 1fr; align-items:start;',
    },
    [studentPanel, facultyPanel],
  );

  // Row 3: Two-column grid for side info and optional resume card
  const leftCol = el('div', { class: 'col-side', style: 'display:grid; gap:12px;' }, [
    whatsNew,
    help,
  ]);
  const hasRight = false; // no right column content when resume card is removed

  const grid = el(
    'div',
    {
      class: 'home-grid',
      style: 'display:grid; gap:12px; grid-template-columns: 1fr; align-items:start;',
    },
    [leftCol],
  );

  // Responsive: make main column wider on desktop
  const setGrid = () => {
    const desktop = window.innerWidth >= 900;
    grid.style.gridTemplateColumns = '1fr';
    studentFacultyRow.style.gridTemplateColumns = desktop ? '1fr 1fr' : '1fr';
  };
  setGrid();
  window.addEventListener('resize', setGrid, { passive: true });

  // Final container: hero (row 1), student/faculty (row 2), then side grid (row 3)
  const container = el('div', { class: 'home-container', style: 'display:grid; gap:12px;' }, [
    hero,
    studentFacultyRow,
    grid,
  ]);

  app.append(container);
});
