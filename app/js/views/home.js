// Home view - Rich Landing page for PT EMR Simulator
import { route } from '../core/router.js';
import { navigate as urlNavigate, navigateHash } from '../core/url.js';
import { storage } from '../core/index.js';
import { el } from '../ui/utils.js';
// no case fetch needed on home view

// (draft summary removed to simplify hero layout)

function buildWhatsNewPanel() {
  return el('div', { class: 'panel' }, [
    el('h3', {}, 'Program Executive Overview'),
    el('ul', { style: 'margin: 6px 0 0 18px;' }, [
      el('li', {}, 'Static, browser-only EMR simulator (no backend; GitHub Pages deployable)'),
      el('li', {}, 'Centralized routing with deep links & shareable states'),
      el('li', {}, 'Data store: case/draft separation, schema validation/migration'),
      el('li', {}, 'Feature modules: SOAP, Goals, Billing, Export (modular files)'),
      el('li', {}, 'Views: tailored student and faculty flows'),
      el('li', {}, 'Accessibility & UX: skip links, ARIA, Safari mobile patch, sticky headers'),
      el('li', {}, 'Exports: professional Word format matching app layout'),
      el('li', {}, 'Feedback: MS Forms integration for quick updates'),
    ]),
  ]);
}

route('#/', async (app) => {
  app.innerHTML = '';

  const lastHash = storage.getItem('pt_emr_last_route');
  const resumeInfo = (() => {
    if (!lastHash || lastHash === '#/' || lastHash === '#/404') return null;
    const [path] = lastHash.split('?');
    const isFaculty = path.startsWith('#/instructor/');
    return { audience: isFaculty ? 'Faculty' : 'Student', hash: lastHash };
  })();

  // Hero banner (UND green gradient parallelogram)
  const hero = el('div', { class: 'home-hero' }, [
    el('h1', { class: 'home-hero__title' }, 'UND Physical Therapy EMR Simulator'),
  ]);

  // (editor navigation helpers not needed on simplified home)

  // Build main panels
  const studentActions = [];
  studentActions.push(
    el(
      'button',
      { class: 'btn primary', onClick: () => urlNavigate('/student/cases') },
      'Student Dashboard',
    ),
  );
  if (resumeInfo && resumeInfo.audience === 'Student') {
    studentActions.push(
      el(
        'button',
        { class: 'btn primary', onClick: () => navigateHash(resumeInfo.hash) },
        'Resume Case',
      ),
    );
  }

  const studentPanel = el('div', { class: 'panel' }, [
    el('h2', {}, 'Student'),
    el('div', { style: 'margin:6px 0 12px 0;' }, [
      el(
        'div',
        { class: 'muted', style: 'font-weight:600; margin-bottom:6px;' },
        'Student Experience Summary',
      ),
      el('ul', { style: 'margin:0 0 0 18px;' }, [
        el('li', {}, 'Access: #/student/cases → assigned/available cases'),
        el('li', {}, 'Documentation: guided tabs for SOAP, Goals, Billing'),
        el('li', {}, 'Persistence: auto-save drafts in localStorage'),
        el('li', {}, 'Export: Word report with structured tables'),
      ]),
    ]),
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
      { class: 'btn primary', onClick: () => urlNavigate('/instructor/cases') },
      'Faculty Dashboard',
    ),
  );
  if (resumeInfo && resumeInfo.audience === 'Faculty') {
    facultyActions.push(
      el(
        'button',
        { class: 'btn primary', onClick: () => navigateHash(resumeInfo.hash) },
        'Resume Case',
      ),
    );
  }

  const facultyPanel = el('div', { class: 'panel' }, [
    el('h2', {}, 'Faculty'),
    el('div', { style: 'margin:6px 0 12px 0;' }, [
      el(
        'div',
        { class: 'muted', style: 'font-weight:600; margin-bottom:6px;' },
        'Faculty Experience Summary',
      ),
      el('ul', { style: 'margin:0 0 0 18px;' }, [
        el('li', {}, 'Access: #/instructor/cases for case management'),
        el('li', {}, 'Authoring: demographics, DOB age calculator, schema integrity'),
        el('li', {}, 'Distribution: share deep links with students'),
        el('li', {}, 'Review: student exports mirror app structure for grading'),
      ]),
    ]),
    el(
      'div',
      { class: 'home-actions', style: 'display:flex; gap:8px; flex-wrap:wrap;' },
      facultyActions,
    ),
  ]);

  // Side panels
  const whatsNew = buildWhatsNewPanel();

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
  const leftCol = el('div', { class: 'col-side', style: 'display:grid; gap:12px;' }, [whatsNew]);
  // right column intentionally omitted

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
