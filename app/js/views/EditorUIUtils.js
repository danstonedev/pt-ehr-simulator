/**
 * UI utilities for the case editor
 */

import { el } from '../ui/utils.js';

/**
 * Create a loading indicator
 * @returns {HTMLElement} Loading indicator element
 */
export function createLoadingIndicator() {
  return el('div', { class: 'panel' }, 'Loading case...');
}

/**
 * Create an error display
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {string} details - Additional error details
 * @returns {HTMLElement} Error display element
 */
export function createErrorDisplay(title, message, details) {
  const elements = [el('h2', {}, title), el('p', {}, message)];

  if (details) {
    elements.push(el('pre', { class: 'small' }, details));
  }

  return el('div', { class: 'panel error' }, elements);
}

/**
 * Create missing case ID error display
 * @returns {HTMLElement} Missing case ID error element
 */
export function createMissingCaseIdError() {
  return el('div', { class: 'panel error' }, [
    el('h2', {}, 'Missing Case ID'),
    el(
      'p',
      {},
      'No case ID provided in URL. Expected format: #/student/editor?case=CASE_ID&v=0&encounter=eval',
    ),
  ]);
}
