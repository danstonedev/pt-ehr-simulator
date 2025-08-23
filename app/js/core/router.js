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
    let hash = (window.location.hash || '#/').replace(/\/$/, '');
    if (hash === '#') hash = '#/';
    const [path, query] = hash.split('?');

    // First try exact match
    let renderer = routes[path];
    let params = {};

    // If no exact match, try parameter matching
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

    // Fallback to 404
    if (!renderer) renderer = routes['#/404'];
    if (!renderer) return;

    // Persist last route (exclude home/404) for Resume on the landing page
    try {
      if (path && path !== '#/' && path !== '#/404') {
        localStorage.setItem('pt_emr_last_route', hash);
      }
    } catch {}

    // Update navigation active states
    updateNavigation(hash);

    // Expose a simple route key on <body> for route-scoped styling
    try {
      const routeKey = path && path !== '#/' ? path.slice(2).replace(/\//g, '-') : 'home';
      document.body.setAttribute('data-route', routeKey);
    } catch {}

    app.innerHTML = '';
    await renderer(app, new URLSearchParams(query || ''), params);
  }
  window.addEventListener('hashchange', render);
  render();
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
