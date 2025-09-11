// Home view - Rich Landing page for PT EMR Simulator
import { route } from '../core/router.js';
import { navigate as urlNavigate } from '../core/url.js';
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
  app.replaceChildren();

  // Quick access row: Student (left) • EMR badge (center) • Faculty (right)
  const quickRow = (() => {
    const row = el('div', {
      class: 'home-quick-row',
      style:
        'display:grid; width:100%; align-items:center; justify-items:center; grid-template-columns: 1fr auto 1fr; gap:32px; padding:16px 0; margin-top: calc(33vh - 96px);',
    });
    const studentBtn = el(
      'button',
      {
        class: 'btn primary',
        onClick: () => urlNavigate('/student/cases'),
        'aria-label': 'Open Student',
        style: 'font-size:44px; padding:24px 44px; border-radius:14px; justify-self:end;',
      },
      'STUDENT',
    );
    const facultyBtn = el(
      'button',
      {
        class: 'btn primary',
        onClick: () => urlNavigate('/instructor/cases'),
        'aria-label': 'Open Faculty',
        style: 'font-size:44px; padding:24px 44px; border-radius:14px; justify-self:start;',
      },
      'FACULTY',
    );
    const img = el('img', {
      alt: 'EMR badge',
      title: 'Click to reveal Student & Faculty sections and the overview',
      role: 'button',
      tabindex: '0',
      style:
        'width:min(280px, 30vw); height:auto; display:block; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,.15); cursor:pointer;',
    });
    // Theme-aware logo switching (light vs dark) with filename auto-detect.
    // We'll probe common filenames and pick the first that loads.
    // Only include filenames that actually exist in /img to avoid 404 spam.
    // Previous variants (emr-white-circle.*) did not exist and generated repeated 404s.
    const darkCandidates = ['img/green-white-favicon.2.png', 'img/emr favicon green circle.png'];
    // For now we reuse an existing asset for light mode (second provides subtle variation if added later)
    const lightCandidates = ['img/emr favicon green circle.png', 'img/green-white-favicon.2.png'];
    const pickFirstAvailable = (candidates, cb) => {
      let i = 0;
      const tryNext = () => {
        if (i >= candidates.length) {
          cb(null);
          return;
        }
        const url = candidates[i++];
        const test = new Image();
        test.onload = () => cb(url);
        test.onerror = tryNext;
        test.src = url;
      };
      tryNext();
    };
    let resolvedDark = darkCandidates[0];
    let resolvedLight = null;
    // Start with dark default to avoid blank, then resolve both
    img.src = resolvedDark;
    pickFirstAvailable(darkCandidates, (url) => {
      if (url) resolvedDark = url;
    });
    pickFirstAvailable(lightCandidates, (url) => {
      resolvedLight = url;
    });

    const mqlDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const setLogo = (isDark) => {
      const desired = isDark ? resolvedDark : resolvedLight || resolvedDark;
      img.src = desired;
    };
    // Initial logo based on theme
    setLogo(mqlDark ? mqlDark.matches : false);
    // React to theme changes
    if (mqlDark) {
      const handler = (e) => setLogo(e.matches);
      if (mqlDark.addEventListener) mqlDark.addEventListener('change', handler);
      else if (mqlDark.addListener) mqlDark.addListener(handler);
    }
    row.replaceChildren(studentBtn, img, facultyBtn);
    // Expose a hook so we can attach reveal behavior later
    row._badgeEl = img;
    // Responsive: stack on very small screens
    const applyLayout = () => {
      const mobile = window.innerWidth < 560;
      row.style.gridTemplateColumns = mobile ? '1fr' : '1fr auto 1fr';
      row.style.gap = mobile ? '16px' : '32px';
      // When stacked, center both buttons
      if (mobile) {
        studentBtn.style.justifySelf = 'center';
        facultyBtn.style.justifySelf = 'center';
      } else {
        studentBtn.style.justifySelf = 'end';
        facultyBtn.style.justifySelf = 'start';
      }
    };
    applyLayout();
    window.addEventListener('resize', applyLayout, { passive: true });
    return row;
  })();

  // (editor navigation helpers not needed on simplified home)

  // Build main panels

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
  ]);

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

  // Hide details until the badge is clicked
  const revealWrap = el(
    'div',
    {
      style:
        'display:none; opacity:0; transform: translateY(-12px); transition: opacity 600ms ease, transform 600ms ease;',
    },
    [studentFacultyRow, grid],
  );
  // Assign an id so the badge can reference it for accessibility
  revealWrap.id = 'home-reveal';
  // Click/keyboard toggle handler (show/hide with animation)
  let isRevealed = false;
  let isTransitioning = false;
  const badge = quickRow && quickRow._badgeEl;
  if (badge) {
    badge.setAttribute('aria-controls', revealWrap.id);
    badge.setAttribute('aria-expanded', 'false');
  }
  const onTransitionEnd = (e) => {
    if (e.target !== revealWrap) return;
    isTransitioning = false;
    // When hiding completes, set display:none
    if (!isRevealed) {
      revealWrap.style.display = 'none';
    }
  };
  revealWrap.addEventListener('transitionend', onTransitionEnd);

  const show = () => {
    if (isRevealed || isTransitioning) return;
    isTransitioning = true;
    revealWrap.style.display = '';
    requestAnimationFrame(() => {
      void revealWrap.offsetWidth;
      revealWrap.style.opacity = '1';
      revealWrap.style.transform = 'translateY(0)';
      isRevealed = true;
      if (badge) {
        badge.setAttribute('aria-expanded', 'true');
        badge.title = 'Click to hide Student & Faculty sections and the overview';
      }
      // gentle scroll after animation begins
      setTimeout(() => {
        try {
          revealWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch {}
      }, 120);
    });
  };

  const hide = () => {
    if (!isRevealed || isTransitioning) return;
    isTransitioning = true;
    requestAnimationFrame(() => {
      void revealWrap.offsetWidth;
      revealWrap.style.opacity = '0';
      revealWrap.style.transform = 'translateY(-12px)';
      isRevealed = false;
      if (badge) {
        badge.setAttribute('aria-expanded', 'false');
        badge.title = 'Click to reveal Student & Faculty sections and the overview';
      }
    });
  };

  const toggle = () => {
    if (isRevealed) hide();
    else show();
  };
  if (badge) {
    badge.addEventListener('click', toggle);
    badge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  }

  // Final container: quick access row then reveal-on-click content
  const container = el('div', { class: 'home-container', style: 'display:grid; gap:12px;' }, [
    quickRow,
    revealWrap,
  ]);

  app.append(container);
});
