import { storage } from './adapters/storageAdapter.js';
import { cssOptimizer, loadRouteCSS } from './css-optimizer.js';

// Track per-view cleanup returned by renderers to avoid stacked listeners/memory leaks
let currentCleanup = null;
let __firstRenderDone = false; // track first successful route paint

/**
 * Determines the route type for CSS loading based on path
 * @param {string} path - The current route path
 * @returns {string} Route type for CSS optimization
 */
function getRouteType(path) {
  if (path.includes('/student/')) return 'student';
  if (path.includes('/instructor/')) return 'instructor';
  if (path.includes('/editor/') || path.includes('/case/')) return 'editor';
  if (path === '#/' || path.includes('/home')) return 'home';
  return 'default';
}

// Basic route transition utility
function applyRouteTransition(appEl, mode = 'fade') {
  // Skip if user prefers reduced motion
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return { before: (cb) => cb(), after: () => {} };

  const enterClassBase = mode === 'slide' ? 'route-slide' : 'route-fade';
  let currentContent = appEl.firstElementChild;
  let exitEl = null;

  const before = (prepareNew) => {
    if (currentContent) {
      exitEl = currentContent;
      exitEl.classList.remove(`${enterClassBase}-enter`, `${enterClassBase}-enter-active`);
      exitEl.classList.add(`${enterClassBase}-exit`);
      // Force reflow to ensure transition start
      // Force reflow to commit exit state before adding active class
      void exitEl.offsetWidth;
      exitEl.classList.add(`${enterClassBase}-exit-active`);
      exitEl.addEventListener(
        'transitionend',
        () => {
          if (exitEl && exitEl.parentElement === appEl) {
            try {
              appEl.removeChild(exitEl);
            } catch {}
          }
        },
        { once: true },
      );
    }
    prepareNew();
  };
  const after = (newEl) => {
    if (!newEl) return;
    newEl.classList.add(`${enterClassBase}-enter`);
    // next frame
    requestAnimationFrame(() => {
      newEl.classList.add(`${enterClassBase}-enter-active`);
      newEl.addEventListener(
        'transitionend',
        () => {
          newEl.classList.remove(`${enterClassBase}-enter`, `${enterClassBase}-enter-active`);
        },
        { once: true },
      );
    });
  };
  return { before, after };
}
// Router with proper initialization order and parameter handling

const routes = {};

export function route(path, render) {
  routes[path] = render;
}

export { routes };

export function navigate(hash) {
  window.location.hash = hash;
}

// Update navigation active states
function updateNavigation(currentPath) {
  const navLinks = document.querySelectorAll('.topnav a');
  navLinks.forEach((link) => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
    const href = link.getAttribute('href');
    if (
      href === currentPath ||
      (currentPath.startsWith('#/student') && href === '#/student/cases') ||
      (currentPath.startsWith('#/instructor') && href === '#/instructor/cases') ||
      (currentPath === '#/' && href === '#/')
    ) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

export function startRouter() {
  const app = document.getElementById('app');

  async function render() {
    const { hash, path, query } = getNormalizedHash();

    const { renderer, params } = resolveRendererAndParams(path);
    if (!renderer) return;

    // Load route-specific CSS based on current path
    try {
      const routeType = getRouteType(path);
      await loadRouteCSS(routeType);

      // Only preload CSS for the most likely immediate next route
      const preloadMap = {
        home: [], // Don't preload on home - let users choose their path
        student: ['editor'], // Students likely go to editor next
        instructor: ['editor'], // Instructors likely go to editor next
        editor: [], // Editor users typically stay in editor
      };

      const routesToPreload = preloadMap[routeType] || [];
      if (routesToPreload.length > 0) {
        // Delay preloading to ensure current route CSS is fully utilized first
        setTimeout(() => {
          cssOptimizer.preloadRoutes(routesToPreload);
        }, 3000); // Wait 3 seconds before preloading
      }
    } catch (error) {
      console.error('Failed to load route CSS:', error);
    }

    // Teardown previous view before rendering the next one
    try {
      if (typeof currentCleanup === 'function') currentCleanup();
    } catch {}

    persistLastRoute(hash, path);
    updateNavigation(hash);
    setBodyRouteKey(path);

    const { before, after } = applyRouteTransition(app, 'fade');
    const newWrapper = buildRouteWrapper(app, before);
    const maybeCleanup = await renderer(newWrapper, new URLSearchParams(query || ''), params);
    currentCleanup = typeof maybeCleanup === 'function' ? maybeCleanup : null;
    after(newWrapper);
    if (!__firstRenderDone) {
      __firstRenderDone = true;
      window.dispatchEvent(new Event('app-ready'));
    }
  }
  window.addEventListener('hashchange', render);
  render();
}

function getNormalizedHash() {
  let hash = (window.location.hash || '#/').replace(/\/$/, '');
  if (hash === '#') hash = '#/';
  const [path, query] = hash.split('?');
  return { hash, path, query };
}

function resolveRendererAndParams(path) {
  let renderer = routes[path];
  let params = {};
  if (!renderer) {
    for (const [routePath, routeRenderer] of Object.entries(routes)) {
      const match = matchRoute(routePath, path);
      if (match) {
        renderer = routeRenderer;
        params = match;
        break;
      }
    }
  }
  if (!renderer) renderer = routes['#/404'];
  return { renderer, params };
}

function persistLastRoute(hash, path) {
  try {
    if (path && path !== '#/' && path !== '#/404') storage.setItem('pt_emr_last_route', hash);
  } catch {}
}

function setBodyRouteKey(path) {
  try {
    const routeKey = path && path !== '#/' ? path.slice(2).replace(/\//g, '-') : 'home';
    document.body.setAttribute('data-route', routeKey);
  } catch {}
}

function buildRouteWrapper(app, before) {
  let newWrapper = null;
  before(() => {
    app.replaceChildren();
    newWrapper = document.createElement('div');
    newWrapper.className = 'route-transition-container';
    app.appendChild(newWrapper);
  });
  return newWrapper;
}

// Disable CSS transitions during window resize/rotation to avoid janky animations
let resizeTimer = null;
let isResizing = false;

function setResizingState(on) {
  const root = document.documentElement;
  if (on && !isResizing) {
    isResizing = true;
    root.classList.add('is-resizing');
    // Temporarily disable will-change on sidebar for better performance during resize
    const sidebar = document.querySelector('.chart-navigation');
    if (sidebar) sidebar.style.willChange = 'auto';
  } else if (!on && isResizing) {
    isResizing = false;
    root.classList.remove('is-resizing');
    // Re-enable will-change after resize completes
    const sidebar = document.querySelector('.chart-navigation');
    if (sidebar && window.matchMedia('(max-width: 900px)').matches) {
      sidebar.style.willChange = 'transform';
    }
  }
}

function handleResize() {
  setResizingState(true);
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => setResizingState(false), 200); // Increased from 180ms
}
window.addEventListener('resize', handleResize, { passive: true });
window.addEventListener('orientationchange', handleResize, { passive: true });

// Helper function to match parameterized routes
function matchRoute(routePath, actualPath) {
  const routeSegments = routePath.split('/');
  const pathSegments = actualPath.split('/');

  if (routeSegments.length !== pathSegments.length) return null;

  const params = {};
  for (let i = 0; i < routeSegments.length; i++) {
    if (routeSegments[i].startsWith(':')) {
      // This is a parameter
      const paramName = routeSegments[i].slice(1);
      params[paramName] = pathSegments[i];
    } else if (routeSegments[i] !== pathSegments[i]) {
      // Segments don't match
      return null;
    }
  }

  return params;
}

// Initialization function that loads all modules and starts the router
async function initializeApp() {
  // Import all modules that register routes
  await Promise.all([
    import('./store.js'),
    import('../views/home.js'),
    import('../views/student/cases.js'),
    import('../views/student/drafts.js'),
    import('../views/instructor/cases.js?v=20250111-001'),
    import('../views/case_editor.js?v=20250818-003'),
    import('../views/preview.js'),
    import('../views/notfound.js'),
  ]);

  // Start the router after all routes are registered
  startRouter();
}

// Initialize the app when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
