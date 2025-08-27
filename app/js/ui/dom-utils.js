// DOM Utilities
// Helper functions for DOM manipulation and creation

/**
 * Creates a DOM element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Element attributes and event handlers
 * @param {Array|string|Element} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);

  // Set attributes and event handlers
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') {
      element.className = value;
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === 'html') {
      // Sanitize: never assign unsanitized HTML
      setSafeHtml(element, value);
    } else {
      element.setAttribute(key, value);
    }
  });

  // Add children
  if (!Array.isArray(children)) children = [children];
  children.forEach((child) => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });

  return element;
}

/**
 * Auto-resizes textarea to fit content
 * @param {HTMLTextAreaElement} textarea - Textarea element to resize
 */
export function textareaAutoResize(textarea) {
  const resizeHandler = () => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 4 + 'px';
  };

  textarea.addEventListener('input', resizeHandler);
  resizeHandler(); // Initial resize
}

/**
 * Creates a loading spinner element
 * @param {string} message - Loading message
 * @returns {HTMLElement} Loading element
 */
export function createLoadingSpinner(message = 'Loading...') {
  return el('div', { class: 'loading-spinner' }, [
    el('div', { class: 'spinner' }),
    el('span', {}, message),
  ]);
}

/**
 * Safely set HTML using a basic allowlist approach or fallback to text
 * Current minimal version escapes the string and optionally allows a tiny subset later.
 * @param {HTMLElement} element
 * @param {string} html
 */
export function setSafeHtml(element, html) {
  if (!element) return;
  // Safest default: treat input as text; escape by assigning textContent
  element.textContent = String(html ?? '');
}
