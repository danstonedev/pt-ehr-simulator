// @ts-check
// events.js - Tiny EventTarget-based event bus for cross-feature signals

const bus = new EventTarget();

/**
 * Emit a custom event with optional detail payload.
 * @template T
 * @param {string} type
 * @param {T} [detail]
 */
export function emit(type, detail) {
  bus.dispatchEvent(new CustomEvent(type, { detail }));
}

/**
 * Subscribe to an event and get an unsubscribe function.
 * @param {string} type
 * @param {(ev: CustomEvent) => void} handler
 * @returns {() => void}
 */
export function on(type, handler) {
  // Wrap to ensure handler receives CustomEvent consistently
  /** @param {Event} e */
  const wrapped = (e) => handler(/** @type {CustomEvent} */ (e));
  bus.addEventListener(type, wrapped);
  return () => bus.removeEventListener(type, wrapped);
}

// Standard event names (document for discoverability)
// - 'draft:updated' -> detail: { caseId, encounterId, draft }
// - 'case:reloaded' -> detail: { caseId }
// - 'navigation:panel-toggled' -> detail: { id, collapsed }
// - 'export:completed' -> detail: { caseId, encounterId, format: 'docx' | 'pdf' }
