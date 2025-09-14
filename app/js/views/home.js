// Home view - Rich Landing page for PT EMR Simulator
import { route } from '../core/router.js';
import { navigate as urlNavigate } from '../core/url.js';
import { el } from '../ui/utils.js';
// no case fetch needed on home view

// (draft summary removed to simplify hero layout)

function buildWhatsNewPanel() {
  return el('div', { class: 'panel' }, [
    el('h3', {}, 'Program Executive Overview'),
    el('ul', { class: 'mt-6 ml-18' }, [
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
    const row = el('div', { class: 'home-quick-row' });
    const studentBtn = el(
      'button',
      {
        class: 'btn primary btn-hero student',
        onClick: () => urlNavigate('/student/cases'),
        'aria-label': 'Open Student',
      },
      'STUDENT',
    );
    const facultyBtn = el(
      'button',
      {
        class: 'btn primary btn-hero faculty',
        onClick: () => urlNavigate('/instructor/cases'),
        'aria-label': 'Open Faculty',
      },
      'FACULTY',
    );
    const img = el('img', {
      alt: 'EMR badge',
      title: 'Click to reveal Student & Faculty sections and the overview',
      role: 'button',
      tabindex: '0',
      class: 'home-badge',
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
    return row;
  })();

  // (editor navigation helpers not needed on simplified home)

  // Build main panels

  const studentPanel = el('div', { class: 'panel' }, [
    el('h2', {}, 'Student'),
    el('div', { class: 'mt-6 mb-12' }, [
      el('div', { class: 'fw-600 mb-6 text-secondary' }, 'Student Experience Summary'),
      el('ul', { class: 'm-0 ml-18' }, [
        el('li', {}, 'Access: #/student/cases → assigned/available cases'),
        el('li', {}, 'Documentation: guided tabs for SOAP, Goals, Billing'),
        el('li', {}, 'Persistence: auto-save drafts in localStorage'),
        el('li', {}, 'Export: Word report with structured tables'),
      ]),
    ]),
  ]);

  const facultyPanel = el('div', { class: 'panel' }, [
    el('h2', {}, 'Faculty'),
    el('div', { class: 'mt-6 mb-12' }, [
      el('div', { class: 'fw-600 mb-6 text-secondary' }, 'Faculty Experience Summary'),
      el('ul', { class: 'm-0 ml-18' }, [
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
  const studentFacultyRow = el('div', { class: 'row-student-faculty d-grid gap-12' }, [
    studentPanel,
    facultyPanel,
  ]);

  // Row 3: Two-column grid for side info and optional resume card
  const leftCol = el('div', { class: 'col-side d-grid gap-12' }, [whatsNew]);
  // right column intentionally omitted

  const grid = el('div', { class: 'home-grid d-grid gap-12' }, [leftCol]);

  // Responsive: make main column wider on desktop
  // Grid responsive behavior handled in CSS media queries

  // Hide details until the badge is clicked
  const revealWrap = el('div', { class: 'home-reveal is-hidden' }, [studentFacultyRow, grid]);
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
      revealWrap.classList.add('is-hidden');
    }
  };
  revealWrap.addEventListener('transitionend', onTransitionEnd);

  const show = () => {
    if (isRevealed || isTransitioning) return;
    isTransitioning = true;
    revealWrap.classList.remove('is-hidden');
    requestAnimationFrame(() => {
      void revealWrap.offsetWidth;
      revealWrap.classList.add('is-open');
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
      revealWrap.classList.remove('is-open');
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
  const container = el('div', { class: 'home-container d-grid gap-12' }, [quickRow, revealWrap]);

  app.append(container);
});
