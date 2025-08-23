// Component Factory
// Standardized approach for creating reusable UI components

import { el } from './dom-utils.js';

/**
 * Creates a standardized button component
 * @param {Object} config - Button configuration
 * @returns {HTMLElement} Button element
 */
export function createButton(config) {
  const {
    text,
    type = 'button',
    variant = 'default', // 'primary', 'secondary', 'danger'
    size = 'medium', // 'small', 'medium', 'large'
    onClick,
    disabled = false,
    icon,
  } = config;

  const className = `btn ${variant} ${size}`;
  const children = [];

  if (icon) children.push(icon);
  if (text) children.push(text);

  return el(
    'button',
    {
      type,
      class: className,
      disabled,
      onClick,
    },
    children,
  );
}

/**
 * Creates a standardized card component
 * @param {Object} config - Card configuration
 * @returns {HTMLElement} Card element
 */
export function createCard(config) {
  const { title, content, actions, className = '' } = config;

  const cardChildren = [];

  if (title) {
    cardChildren.push(
      el('div', { class: 'card-header' }, [el('h3', { class: 'card-title' }, title)]),
    );
  }

  if (content) {
    cardChildren.push(el('div', { class: 'card-content' }, content));
  }

  if (actions && actions.length > 0) {
    cardChildren.push(el('div', { class: 'card-actions' }, actions));
  }

  return el('div', { class: `card ${className}` }, cardChildren);
}

/**
 * Creates a standardized section with collapsible functionality
 * @param {Object} config - Section configuration
 * @returns {HTMLElement} Section element
 */
export function createSection(config) {
  const { title, content, collapsible = false, collapsed = false, id, className = '' } = config;

  const sectionId = id || `section_${Date.now()}`;
  const headerChildren = [el('h3', {}, title)];

  if (collapsible) {
    const toggleButton = createButton({
      text: collapsed ? '▶' : '▼',
      variant: 'ghost',
      size: 'small',
      onClick: () => {
        const contentEl = document.getElementById(`${sectionId}_content`);
        const isHidden = contentEl.style.display === 'none';
        contentEl.style.display = isHidden ? 'block' : 'none';
        toggleButton.textContent = isHidden ? '▼' : '▶';
      },
    });
    headerChildren.unshift(toggleButton);
  }

  return el('section', { class: `section ${className}`, id: sectionId }, [
    el('div', { class: 'section-header' }, headerChildren),
    el(
      'div',
      {
        class: 'section-content',
        id: `${sectionId}_content`,
        style: collapsed ? 'display: none' : '',
      },
      content,
    ),
  ]);
}
