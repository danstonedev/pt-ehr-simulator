/**
 * Scroll utilities for the case editor
 */

import { calculateHeaderOffset } from './CaseEditorUtils.js';

/**
 * Helper: compute fixed header offset
 * @returns {number} Header offset in pixels
 */
export function getHeaderOffsetPx() {
  return calculateHeaderOffset();
}

/**
 * Get the nearest visible anchor ID based on scroll position
 * @returns {string} The ID of the nearest visible anchor
 */
export function getNearestVisibleAnchorId() {
  const sec = document.querySelector('.section-content');
  if (!sec) return '';
  const anchors = Array.from(sec.querySelectorAll('.section-anchor')).filter((a) => {
    const cs = getComputedStyle(a);
    return a.offsetParent !== null && cs.display !== 'none' && cs.visibility !== 'hidden';
  });
  if (!anchors.length) return '';
  let best = anchors[0];
  const threshold = getHeaderOffsetPx();
  anchors.forEach((a) => {
    const r = a.getBoundingClientRect();
    if (r.top <= threshold) best = a;
  });
  return best?.id || '';
}

/**
 * Scroll to a specific anchor with exact positioning
 * @param {string} anchorId - The ID of the anchor to scroll to
 * @param {string} behavior - Scroll behavior ('auto' or 'smooth')
 * @returns {boolean} True if scroll was successful
 */
export function scrollToAnchorExact(anchorId, behavior = 'auto') {
  if (!anchorId) return false;
  const target = document.getElementById(anchorId);
  if (!target || target.offsetParent === null) return false;
  try {
    target.scrollIntoView({ behavior, block: 'start', inline: 'nearest' });
    return true;
  } catch {
    // Fallback for older browsers
    const offset = getHeaderOffsetPx();
    const rect = target.getBoundingClientRect();
    const y = Math.max(0, window.scrollY + rect.top - offset);
    window.scrollTo({ top: y, behavior });
    return true;
  }
}

/**
 * Execute callback after next layout
 * @param {Function} fn - Callback to execute
 */
export function afterNextLayout(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

/**
 * Compute the current scroll percent within the section content
 * @returns {number} Scroll percentage (0-1)
 */
export function getSectionScrollPercent() {
  const sec = document.querySelector('.section-content');
  if (!sec) return 0;
  const offset = getHeaderOffsetPx();
  const rect = sec.getBoundingClientRect();
  const sectionTopAbs = window.scrollY + rect.top;
  const rel = Math.max(0, window.scrollY - (sectionTopAbs - offset));
  const viewportH = window.innerHeight;
  const scrollable = Math.max(0, sec.scrollHeight - (viewportH - offset));
  return scrollable > 0 ? Math.max(0, Math.min(1, rel / scrollable)) : 0;
}

/**
 * Scroll to a specific percentage within the section content
 * @param {number} pct - Percentage to scroll to (0-1)
 * @returns {boolean} True if scroll was successful
 */
export function scrollToPercentExact(pct) {
  const sec = document.querySelector('.section-content');
  if (!sec) return false;
  const offset = getHeaderOffsetPx();
  const rect = sec.getBoundingClientRect();
  const sectionTopAbs = window.scrollY + rect.top;
  const viewportH = window.innerHeight;
  const scrollable = Math.max(0, sec.scrollHeight - (viewportH - offset));
  const clamped = Math.max(0, Math.min(1, pct ?? 0));

  const targetY = Math.max(0, sectionTopAbs - offset + scrollable * clamped);
  window.scrollTo({ top: targetY, behavior: 'auto' });
  return true;
}

/**
 * Expose scroll helpers to global scope for debugging
 * @param {Object} helpers - Object containing helper functions
 */
export function exposeScrollHelpers(helpers) {
  window.scrollHelpers = helpers;
}
