// Centralized helpers for hash-based routing and query params.
//
// Hash format used in the app:   #/route/subroute?key=value&foo=bar
// - path = '/route/subroute'
// - params = object of string -> string
//
// Design goals:
// - Do not throw; always return something sensible
// - Preserve unknown query params on write
// - Avoid history spam: use replace by default for state synchronization
// - Emit a 'routechange' CustomEvent on hash updates (both programmatic & user)

function parseHash(hash) {
  const raw =
    typeof hash === 'string' ? hash : (typeof location !== 'undefined' ? location.hash : '') || '';
  const noHash = raw.startsWith('#') ? raw.slice(1) : raw;
  const [pathPart, queryPart = ''] = noHash.split('?');
  const path = pathPart || '/';
  const params = Object.fromEntries(new URLSearchParams(queryPart).entries());
  return { path, params };
}

function buildHash(path, params) {
  const qs = new URLSearchParams(params || {});
  const qstr = qs.toString();
  const normalizedPath = path && path.startsWith('/') ? path : '/' + (path || '');
  return '#' + normalizedPath + (qstr ? '?' + qstr : '');
}

// --- Public API ---

export function getRoute() {
  return parseHash(typeof location !== 'undefined' ? location.hash : '');
}

/**
 * Update only the query params, preserving current path and unspecified params.
 * opts:
 *  - replace (default true): use history.replaceState to avoid history spam
 */
export function setQueryParams(nextParams, opts = { replace: true }) {
  const { path, params } = parseHash(typeof location !== 'undefined' ? location.hash : '');
  const merged = { ...params, ...nextParams };
  // Remove keys explicitly set to undefined, null, or empty string
  for (const k of Object.keys(merged)) {
    if (merged[k] === null || merged[k] === undefined || merged[k] === '') delete merged[k];
  }
  const nextHash = buildHash(path, merged);
  if (opts.replace !== false) {
    if (typeof history !== 'undefined') history.replaceState(null, '', nextHash);
  } else if (typeof location !== 'undefined') {
    location.hash = nextHash; // adds to history
  }
  emitRouteChange();
}

/**
 * Navigate to a new path (optionally with params).
 * opts:
 *  - replace (default false): set true to avoid adding a history entry
 */
export function navigate(path, params = {}, opts = { replace: false }) {
  const nextHash = buildHash(path, params);
  if (opts.replace) {
    if (typeof history !== 'undefined') history.replaceState(null, '', nextHash);
    emitRouteChange();
  } else if (typeof location !== 'undefined') {
    location.hash = nextHash; // will trigger hashchange -> emitRouteChange
  }
}

/**
 * Navigate using a pre-built hash string (e.g., "#/route?x=1").
 * Useful when you need to preserve unknown params exactly.
 */
export function navigateHash(rawHash, opts = { replace: false }) {
  const next =
    typeof rawHash === 'string' && rawHash.length
      ? rawHash.startsWith('#')
        ? rawHash
        : '#' + rawHash
      : '#/';
  if (opts.replace) {
    if (typeof history !== 'undefined') history.replaceState(null, '', next);
    emitRouteChange();
  } else if (typeof location !== 'undefined') {
    location.hash = next; // will trigger hashchange -> emitRouteChange
  }
}

/**
 * Subscribe to route changes.
 * Returns an unsubscribe function.
 */
export function onRouteChange(handler) {
  window.addEventListener('routechange', handler);
  window.addEventListener('hashchange', emitRouteChange, { passive: true });
  // Fire once so listeners get the initial state
  queueMicrotask(() => handler(new CustomEvent('routechange', { detail: getRoute() })));
  return () => {
    window.removeEventListener('routechange', handler);
    window.removeEventListener('hashchange', emitRouteChange);
  };
}

function emitRouteChange() {
  const detail = getRoute();
  window.dispatchEvent(new CustomEvent('routechange', { detail }));
}

/**
 * Convenience to read a single param as string (or fallback).
 */
export function getParam(name, fallback = null) {
  const { params } = getRoute();
  return params[name] ?? fallback;
}

/**
 * Narrow helper: encode/decode arrays as CSV ("a,b,c") for simple cases.
 * If you need real arrays, consider JSON.stringify/parse pattern instead.
 */
export const ParamCodec = {
  encodeCsv(arr) {
    return Array.isArray(arr) ? arr.join(',') : '';
  },
  decodeCsv(str) {
    return typeof str === 'string' && str.length ? str.split(',') : [];
  },
};

/**
 * Build a link string for a given path and params.
 * opts:
 *  - absolute (default true): when true, prefix with origin + pathname; otherwise returns just the hash part
 */
export function buildLink(path, params = {}, opts = { absolute: true }) {
  const hash = buildHash(path, params);
  if (opts && opts.absolute === false) return hash;
  const origin = typeof location !== 'undefined' ? location.origin : '';
  const basePath = typeof location !== 'undefined' ? location.pathname : '';
  return origin + basePath + hash;
}
