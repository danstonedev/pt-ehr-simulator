/**
 * Inline handler binding system
 * Converts data-onclick attributes to proper event listeners
 * Follows modern web standards without inline handlers
 */

/**
 * Global function registry for data-onclick handlers
 */
const handlerRegistry = new Map();

/**
 * Register a global function for use with data-onclick
 * @param {string} name - Function name
 * @param {Function} fn - Function implementation
 */
export function registerHandler(name, fn) {
  handlerRegistry.set(name, fn);
}

/**
 * Initialize inline handler binding on page load
 */
function initializeHandlers() {
  // Register global functions that are available on window
  if (window.toggleTheme) {
    registerHandler('toggleTheme', window.toggleTheme);
  }

  // Find all elements with data-onclick attributes
  const elements = document.querySelectorAll('[data-onclick]');

  elements.forEach((element) => {
    const handlerName = element.getAttribute('data-onclick');
    const handler = handlerRegistry.get(handlerName);

    if (handler) {
      element.addEventListener('click', handler);
      // Remove the data attribute to avoid double-binding
      element.removeAttribute('data-onclick');
    } else {
      console.warn(`Handler "${handlerName}" not found in registry`);
    }
  });
}

// Auto-initialize when module loads
document.addEventListener('DOMContentLoaded', initializeHandlers);
