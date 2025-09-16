// Case Drawer Controller: slide the existing .chart-navigation in/out on <900px viewports
import { getRoute, onRouteChange } from '../../core/url.js';

// Lightweight debug helper (enable via ?debug=1 in URL)
const CD_DEBUG = typeof location !== 'undefined' && location.search.includes('debug=1');
function cdDebug(...args) {
  if (CD_DEBUG) {
    try {
      console.warn('[CaseDrawer]', ...args);
    } catch {}
  }
}

// --- Shared icons & nudge creator (hoisted for route gating) ---
function getNoteIcon() {
  return (
    '<svg class="icon" aria-hidden="true" focusable="false">' +
    '<use href="#icon-chevron-right"></use>' +
    '</svg>' +
    '<span class="sr-only">Open</span>'
  );
}
function getCloseIcon() {
  return (
    '<svg class="icon" aria-hidden="true" focusable="false">' +
    '<use href="#icon-chevron-left"></use>' +
    '</svg>' +
    '<span class="sr-only">Close</span>'
  );
}

function ensureLeftNudge() {
  if (!isEditorRoute()) return null;
  let btn = document.getElementById('caseDrawerLeftNudge');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'caseDrawerLeftNudge';
    btn.className = 'case-left-nudge';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open My Note');
    btn.innerHTML =
      '<svg class="icon" aria-hidden="true" focusable="false"><use href="#icon-chevron-right"></use></svg>' +
      '<span class="sr-only">Open</span>';
    document.body.appendChild(btn);
    btn.addEventListener('click', () => {
      if (window.caseDrawer && typeof window.caseDrawer.toggle === 'function') {
        window.caseDrawer.toggle();
      } else {
        const wasOpen = document.body.classList.contains('case-drawer-open');
        if (!wasOpen) {
          document.body.classList.add('case-drawer-open');
        } else {
          document.body.classList.remove('case-drawer-open');
        }
      }
    });
  }
  btn.classList.add('case-left-nudge--floating');
  return btn;
}

export function initCaseDrawer() {
  cdDebug('initCaseDrawer:start');
  const media = window.matchMedia('(max-width: 900px)');
  setupRouteSync();
  // Only show/create the nudge on editor routes
  if (!isEditorRoute()) {
    cdDebug('initCaseDrawer:aborted (not editor route)', getRoute().path);
    hideNudgeAndClose();
    return false;
  }
  // Ensure a left-edge nudge exists only on editor routes so users have something visible to tap
  ensureLeftNudge();
  // Nudge stays floating; CSS aligns it with the drawer. Keep timer var for potential future use.
  let attachRetryTimer = null;
  let sidebar = document.querySelector('.chart-navigation');
  if (!sidebar) {
    cdDebug('initCaseDrawer:sidebar-missing; will observe DOM');
    // Sidebar not yet in DOM (likely rendered after route/view init). Observe and retry once found.
    if (!window._caseDrawerObserverAttached) {
      const mo = new MutationObserver(() => {
        const s = document.querySelector('.chart-navigation');
        if (s) {
          mo.disconnect();
          window._caseDrawerObserverAttached = false;
          cdDebug('initCaseDrawer:sidebar-found -> re-initializing');
          initCaseDrawer();
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
      window._caseDrawerObserverAttached = true;
    }
    // Ensure the nudge floats on the left until the drawer exists (editor routes only)
    const n = document.getElementById('caseDrawerLeftNudge');
    if (n && isEditorRoute()) n.classList.add('case-left-nudge--floating');
    updateNudgeVisibility();
    return false;
  }

  if (!sidebar.id) sidebar.id = 'chartNavigation';
  const isMobile = () => media.matches;

  // Keep a CSS var in sync with the actual drawer width to avoid any calc(min()) rounding drift
  function syncDrawerWidthVar() {
    try {
      const s = document.querySelector('.chart-navigation');
      if (!s) return;
      const rect = s.getBoundingClientRect();
      if (!rect || !rect.width) return;
      // Round to device pixel to avoid subpixel jitter on transforms
      const w = Math.round(rect.width * window.devicePixelRatio) / window.devicePixelRatio;
      document.body.style.setProperty('--case-drawer-w', `${w}px`);
    } catch {}
  }

  const overlay = ensureOverlay();
  const handle = ensureHandle(sidebar.id);

  function ensureOverlay() {
    let el = document.getElementById('caseDrawerOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'caseDrawerOverlay';
      el.className = 'case-drawer-overlay';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
    return el;
  }

  function ensureHandle(controlsId) {
    let btn = document.getElementById('caseDrawerHandle');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'caseDrawerHandle';
      btn.className = 'case-drawer-handle';
      btn.type = 'button';
      btn.setAttribute('aria-controls', controlsId);
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open My Note');
      btn.innerHTML = getNoteIcon();
      sidebar.appendChild(btn);
    }
    return btn;
  }

  // Drag disabled: click/tap only

  function trapFocus(container) {
    const first = container.querySelector('button, a, input, [tabindex]:not([tabindex="-1"])');
    if (first) first.focus();
  }

  const open = () => {
    if (!isMobile()) return;
    cdDebug('drawer:open');
    syncDrawerWidthVar();
    // Start opening; nudge remains floating and follows via CSS
    document.body.classList.add('case-drawer-open');
    overlay.setAttribute('aria-hidden', 'false');
    if (handle) {
      handle.setAttribute('aria-expanded', 'true');
      handle.setAttribute('aria-label', 'Close My Note');
      handle.innerHTML = getCloseIcon();
    }
    // Update nudge icon/state
    const n = document.getElementById('caseDrawerLeftNudge');
    if (n) {
      n.setAttribute('aria-expanded', 'true');
      n.setAttribute('aria-label', 'Close My Note');
      n.innerHTML = getCloseIcon();
      n.classList.add('case-left-nudge--floating');
      n.setAttribute('aria-controls', sidebar.id || 'chartNavigation');
    }
    updateNudgeVisibility();
    trapFocus(sidebar);
    // Ensure any drag offset is cleared
    // Reset any drag offset
    sidebar.style.removeProperty('--case-drag-x');
    document.body.style.removeProperty('--case-drag-x');
    // After open, sync again in case width changed during transition
    requestAnimationFrame(syncDrawerWidthVar);
  };

  const close = () => {
    // Start closing; nudge remains floating
    if (document.body.classList.contains('case-drawer-open')) cdDebug('drawer:close');
    document.body.classList.remove('case-drawer-open');
    overlay.setAttribute('aria-hidden', 'true');
    if (handle) {
      handle.setAttribute('aria-expanded', 'false');
      handle.setAttribute('aria-label', 'Open My Note');
      handle.innerHTML = getNoteIcon();
    }
    try {
      handle.focus();
    } catch {}
    const n = document.getElementById('caseDrawerLeftNudge');
    if (n) {
      n.setAttribute('aria-expanded', 'false');
      n.setAttribute('aria-label', 'Open My Note');
      n.innerHTML = getNoteIcon();
      n.classList.add('case-left-nudge--floating');
      n.setAttribute('aria-controls', sidebar.id || 'chartNavigation');
    }
    updateNudgeVisibility();
    // Reset any drag offset
    sidebar.style.removeProperty('--case-drag-x');
    document.body.style.removeProperty('--case-drag-x');
    // Keep the drawer width var accurate for when user re-opens quickly
    requestAnimationFrame(syncDrawerWidthVar);
  };

  const toggle = () => {
    const wasOpen = document.body.classList.contains('case-drawer-open');
    cdDebug('drawer:toggle', { wasOpen });
    if (wasOpen) close();
    else open();
  };

  attachEvents();
  initResponsiveState();
  exposeApi();

  // Keep nudge floating and ensure proper attributes
  function attachNudgeWhenOpenOrFloat() {
    const btn = document.getElementById('caseDrawerLeftNudge');
    if (!btn) return;
    if (btn.parentElement !== document.body) document.body.appendChild(btn);
    btn.classList.add('case-left-nudge--floating');
    btn.setAttribute('aria-controls', sidebar.id || 'chartNavigation');
  }

  function exposeApi() {
    window.caseDrawer = window.caseDrawer || {};
    window.caseDrawer.open = open;
    window.caseDrawer.close = close;
    window.caseDrawer.toggle = toggle;
    if (!window.caseDrawer._cdDebug && CD_DEBUG) {
      window.caseDrawer._cdDebug = true;
      cdDebug('API exposed on window.caseDrawer');
    }
  }

  function attachEvents() {
    // Right-side handle is deprecated/hidden; skip attaching events to it
    if (!overlay._caseDrawerBound) {
      overlay.addEventListener('click', close);
      overlay._caseDrawerBound = true;
    }
    if (!document._caseDrawerEscTrap) {
      const onEsc = (e) => {
        if (e.key === 'Escape') close();
      };
      document.addEventListener('keydown', onEsc);
      document._caseDrawerEscTrap = true;
    }
    if (!window._caseDrawerHashClose) {
      window.addEventListener('hashchange', close);
      window._caseDrawerHashClose = true;
    }
    if (!window._caseDrawerResize) {
      let resizeDebounceTimer = null;
      const onResize = () => {
        // Debounce resize events for better performance
        if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
        resizeDebounceTimer = setTimeout(() => {
          if (!isMobile()) {
            cdDebug('resize -> desktop breakpoint; closing');
            close();
            // On desktop, stop retries and keep nudge hidden
            if (attachRetryTimer) {
              clearTimeout(attachRetryTimer);
              attachRetryTimer = null;
            }
          } else {
            // On mobile: attach only if open; otherwise keep floating
            cdDebug('resize -> mobile breakpoint; syncing');
            attachNudgeWhenOpenOrFloat();
            syncDrawerWidthVar();
          }
        }, 100); // 100ms debounce
      };
      window.addEventListener('resize', onResize, { passive: true });
      window._caseDrawerResize = true;
    }
    if (!window._caseDrawerMediaListener) {
      const onMediaChange = (e) => {
        // Use requestAnimationFrame for smooth transitions
        requestAnimationFrame(() => {
          if (e.matches) {
            cdDebug('mediaChange -> now mobile (<=900px)');
            if (handle) handle.style.display = '';
            attachNudgeWhenOpenOrFloat();
            updateNudgeVisibility();
            syncDrawerWidthVar();
          } else {
            cdDebug('mediaChange -> now desktop (>900px)');
            close();
            if (handle) handle.style.display = 'none';
            updateNudgeVisibility();
          }
        });
      };
      media.addEventListener('change', onMediaChange);
      window._caseDrawerMediaListener = true;
    }
  }

  function initResponsiveState() {
    if (!isMobile()) {
      document.body.classList.remove('case-drawer-open');
      if (handle) handle.style.display = 'none';
      updateNudgeVisibility();
      cdDebug('initResponsiveState:desktop');
    } else {
      if (handle) handle.style.display = '';
      // Keep the nudge floating and synced
      const n = document.getElementById('caseDrawerLeftNudge');
      if (n && isEditorRoute()) {
        n.classList.add('case-left-nudge--floating');
        n.setAttribute('aria-controls', sidebar.id || 'chartNavigation');
      }
      attachNudgeWhenOpenOrFloat();
      updateNudgeVisibility();
      syncDrawerWidthVar();
      cdDebug('initResponsiveState:mobile');
    }
  }

  return true;
}

function updateNudgeVisibility() {
  const btn = document.getElementById('caseDrawerLeftNudge');
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  if (!btn) return;
  if (!isMobile || !isEditorRoute()) {
    btn.style.display = 'none';
    return;
  }
  // Keep the nudge visible on mobile; it moves with the drawer
  btn.style.display = '';
}

// Drag disabled by request

// Removed attach/detach helpers: nudge remains floating and follows via CSS

// --- Route gating helpers ---
function isEditorRoute() {
  try {
    const { path } = getRoute();
    return path === '/student/editor' || path === '/instructor/editor';
  } catch {
    return false;
  }
}

function hideNudgeAndClose() {
  const btn = document.getElementById('caseDrawerLeftNudge');
  if (btn) btn.style.display = 'none';
  document.body.classList.remove('case-drawer-open');
  const overlay = document.getElementById('caseDrawerOverlay');
  if (overlay) overlay.setAttribute('aria-hidden', 'true');
}

function setupRouteSync() {
  if (window._caseDrawerRouteListenerAttached) return;
  const unsub = onRouteChange(() => {
    if (isEditorRoute()) {
      // Re-initialize when entering editor views to attach to sidebar
      cdDebug('routeChange -> editor route; re-init');
      initCaseDrawer();
    } else {
      cdDebug('routeChange -> non-editor route; hiding');
      hideNudgeAndClose();
    }
  });
  // Store unsubscribe in case future cleanup is desired
  window._caseDrawerRouteListenerAttached = true;
  window._caseDrawerRouteUnsub = unsub;
}
