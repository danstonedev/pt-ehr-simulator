/**
 * HTML utility functions for safe DOM manipulation
 * Follows modern web standards with sanitization and validation
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - Raw HTML string
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Create element with safe attribute setting
 * @param {string} tag - Element tag name
 * @param {Object} attrs - Attributes to set
 * @param {string} content - Text content
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, content = '') {
  const element = document.createElement(tag);

  Object.entries(attrs).forEach(([key, value]) => {
    if (
      key.startsWith('data-') ||
      ['id', 'class', 'role', 'aria-'].some((safe) => key.startsWith(safe))
    ) {
      element.setAttribute(key, value);
    }
  });

  if (content) {
    element.textContent = content;
  }

  return element;
}
