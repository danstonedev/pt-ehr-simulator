// Error Handling Utilities
// Centralized error handling and user feedback

import { el } from '../ui/dom-utils.js';
import { setStatus } from '../ui/app-utils.js';

/**
 * Application error types
 */
export const ErrorTypes = {
  VALIDATION: 'validation',
  STORAGE: 'storage',
  NETWORK: 'network',
  CASE_NOT_FOUND: 'case_not_found',
  PERMISSION: 'permission'
};

/**
 * Creates a user-friendly error display
 * @param {string} message - Error message
 * @param {string} type - Error type from ErrorTypes
 * @returns {HTMLElement} Error display element
 */
export function createErrorDisplay(message, type = ErrorTypes.VALIDATION) {
  const errorClass = `error-display ${type}`;
  
  return el('div', { class: errorClass }, [
    el('div', { class: 'error-icon' }, '⚠️'),
    el('div', { class: 'error-content' }, [
      el('strong', {}, 'Error'),
      el('p', {}, message)
    ])
  ]);
}

/**
 * Shows a temporary status message
 * @param {string} message - Status message
 * @param {string} type - Message type ('success', 'error', 'info')
 * @param {number} duration - Display duration in milliseconds
 */
export function showStatusMessage(message, type = 'info', duration = 3000) {
  // UI status chip removed; this remains as a hook for future toast/snackbar
  setStatus(message);
}

/**
 * Wraps async operations with error handling
 * @param {Function} operation - Async operation to execute
 * @param {string} errorContext - Context for error messages
 * @returns {Promise} Operation result or error
 */
export async function withErrorHandling(operation, errorContext = 'Operation') {
  try {
    showStatusMessage(`${errorContext}...`, 'info');
    const result = await operation();
    showStatusMessage(`${errorContext} completed`, 'success');
    return result;
  } catch (error) {
    console.error(`${errorContext} failed:`, error);
    showStatusMessage(`${errorContext} failed: ${error.message}`, 'error');
    throw error;
  }
}
