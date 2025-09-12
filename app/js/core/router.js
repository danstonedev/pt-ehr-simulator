import { storage } from './adapters/storageAdapter.js';

// Track per-view cleanup returned by renderers to avoid stacked listeners/memory leaks
let currentCleanup = null;

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
