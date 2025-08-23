// Application Utilities
// General utility functions for the PT EMR application

/**
 * Updates the status chip in the header
 * @param {string} text - Status text to display
 */
export function setStatus(_text) {
  /* no-op: status chip removed */
}

/**
 * Downloads text content as a file
 * @param {string} filename - Name of the file to download
 * @param {string} text - Text content to download
 */
export function download(filename, text) {
  const anchor = document.createElement('a');
  anchor.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(text);
  anchor.download = filename;
  anchor.click();
}

/**
 * Triggers the browser's print dialog
 */
export function printPage() {
  window.print();
}

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Generates a unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
