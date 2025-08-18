// DEPRECATED MODULE: EnhancedRowCards
// This module has been removed and replaced by the standardized EditableTable.
// Do not use. If imported, it will throw a clear error to surface legacy usage.

/* eslint-disable no-console */
console.warn('[DEPRECATED] app/js/modules/EnhancedRowCards.js is deprecated. Use features/soap/objective/EditableTable.js instead.');

export function createInterventionRowCard() {
  throw new Error('[DEPRECATED] createInterventionRowCard has been removed. Use createEditableTable with appropriate columns.');
}

export function createCollapsibleCard() {
  throw new Error('[DEPRECATED] createCollapsibleCard has been removed. Use standard section containers and EditableTable.');
}

export default null;
/**
 * Enhanced Row Cards - Modern treatment plan row design
 * Replaces dense tables with intuitive card-based rows
 * Updated: 2025-08-10 21:45
 */
import { el } from '../ui/utils.js';
import { createIcon } from '../ui/Icons.js';

/**
 * Creates a modern row card for treatment interventions
 * @param {Object} config - Row configuration
 * @returns {HTMLElement} Row card element
 */
export function createInterventionRowCard(config) {
  const {
    data = {},
    fields = [],
    onUpdate = () => {},
    onDuplicate = () => {},
    onDelete = () => {},
    linkedGoals = [],
    expectedResponse = '',
    progressionRule = '',
    rowId = '',
    type = 'exercise' // 'exercise', 'manual-therapy', 'modality'
  } = config;

  const card = el('div', {
    class: 'intervention-row-card',
    style: `
      background: var(--inline-card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      transition: all 0.2s ease;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    `
  });

  // Card header with primary field and actions
  const header = el('div', {
    class: 'intervention-header',
    style: 'display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;'
  }, [
    // Primary field (intervention name)
    el('div', { 
      class: 'primary-field',
      style: 'flex: 1; min-width: 0;' 
    }, [
      el('label', {
        style: 'display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;'
      }, fields[0]?.label || 'Exercise'),
      createFieldInput(fields[0], data[fields[0]?.field] || '', (value) => {
        onUpdate(fields[0]?.field, value);
      })
    ]),
    
    // Actions
    el('div', {
      class: 'row-actions',
      style: 'display: flex; gap: 4px; flex-shrink: 0;'
    }, [
      // Duplicate button
      el('button', {
        class: 'btn icon-btn',
        title: 'Duplicate row',
        onclick: onDuplicate,
        style: 'padding: 6px; border: 1px solid var(--border); background: var(--bg); border-radius: 4px; cursor: pointer;'
      }, createIcon('copy')),
      
      // Delete button
          el('button', {
            class: 'remove-btn',
            title: 'Delete row',
            onclick: onDelete
          }, '×')
    ])
  ]);

  // Main content grid
  const contentGrid = el('div', {
    class: 'intervention-content-grid',
    style: `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    `
  });

  // Add remaining fields to grid (skip first field as it's in header)
  fields.slice(1).forEach(field => {
    const fieldContainer = el('div', { 
      class: 'field-container',
      style: 'min-width: 0;' // Prevent overflow
    }, [
      el('label', {
        style: 'display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'
      }, field.label),
      createFieldInput(field, data[field.field] || '', (value) => {
        onUpdate(field.field, value);
      })
    ]);
    contentGrid.append(fieldContainer);
  });

  // Linked goals chips
  const goalsSection = el('div', {
    class: 'goals-section',
    style: 'display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; align-items: center; padding: 12px 0; border-top: 1px solid var(--border-light);'
  });

  if (linkedGoals.length > 0) {
    goalsSection.append(
      el('span', {
        style: 'font-size: 12px; font-weight: 600; color: var(--text-muted); margin-right: 8px; white-space: nowrap; letter-spacing: 0.5px;'
      }, 'LINKED GOALS:'),
      ...linkedGoals.map(goal => 
        el('span', {
          class: 'goal-chip',
          style: `
            padding: 2px 8px;
            background: var(--accent);
            color: white;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
          `,
          onclick: () => jumpToGoal(goal.id)
        }, goal.label)
      )
    );
  } else {
    goalsSection.append(
      el('button', {
        class: 'link-goals-btn',
        style: `
          padding: 4px 12px;
          border: 1px dashed var(--border);
          background: transparent;
          color: var(--muted);
          border-radius: 12px;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
        `,
        onclick: () => openGoalLinker(rowId)
      }, '+ Link Goals')
    );
  }

  // Progression rule and expected response
  const bottomSection = el('div', {
    class: 'progression-section',
    style: 'display: grid; grid-template-columns: 1fr 160px; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-light);'
  }, [
    el('div', { style: 'min-width: 0;' }, [
      el('label', {
        style: 'display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;'
      }, 'PROGRESSION RULE'),
      el('input', {
        type: 'text',
        placeholder: 'e.g., Increase by 10% weekly',
        value: progressionRule,
        style: 'width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 4px; font-size: 13px; min-width: 0;',
        oninput: (e) => onUpdate('progressionRule', e.target.value)
      })
    ]),
    el('div', { style: 'min-width: 0;' }, [
      el('label', {
        style: 'display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;'
      }, 'EXPECTED RESPONSE'),
      el('select', {
        style: 'width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 4px; font-size: 13px; min-width: 0;',
        onchange: (e) => onUpdate('expectedResponse', e.target.value)
      }, [
        el('option', { value: '' }, 'Select...'),
        el('option', { value: 'improve-strength', selected: expectedResponse === 'improve-strength' }, '↑ Strength'),
        el('option', { value: 'improve-rom', selected: expectedResponse === 'improve-rom' }, '↑ ROM'),
        el('option', { value: 'reduce-pain', selected: expectedResponse === 'reduce-pain' }, '↓ Pain'),
        el('option', { value: 'improve-function', selected: expectedResponse === 'improve-function' }, '↑ Function'),
        el('option', { value: 'improve-endurance', selected: expectedResponse === 'improve-endurance' }, '↑ Endurance')
      ])
    ])
  ]);

  card.append(header, contentGrid, goalsSection, bottomSection);

  // Hover effect
  card.addEventListener('mouseenter', () => {
    card.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    card.style.borderColor = 'var(--accent2)';
    card.style.transform = 'translateY(-2px)';
  });

  card.addEventListener('mouseleave', () => {
    card.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
    card.style.borderColor = 'var(--border)';
    card.style.transform = 'translateY(0)';
  });

  return card;
}

/**
 * Creates appropriate input field based on field type
 */
function createFieldInput(field, value, onChange) {
  const baseStyle = `
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 13px;
    background: var(--bg);
    color: var(--text);
    box-sizing: border-box;
    min-width: 0;
  `;

  if (field.type === 'select') {
    const select = el('select', {
      style: baseStyle,
      onchange: (e) => onChange(e.target.value)
    });

    field.options.forEach(option => {
      const optionEl = el('option', {
        value: option.value || option,
        selected: value === (option.value || option)
      }, option.label || option);
      select.append(optionEl);
    });

    return select;
  } else if (field.type === 'number') {
    return el('input', {
      type: 'number',
      style: baseStyle,
      value: value,
      placeholder: field.placeholder || '',
      min: field.min,
      max: field.max,
      step: field.step,
      oninput: (e) => onChange(e.target.value)
    });
  } else {
    return el('input', {
      type: field.type || 'text',
      style: baseStyle,
      value: value,
      placeholder: field.placeholder || '',
      oninput: (e) => onChange(e.target.value)
    });
  }
}

/**
 * Creates a collapsible card container
 */
export function createCollapsibleCard(config) {
  const {
    title = '',
    status = 'incomplete', // 'complete', 'incomplete', 'required'
    completionText = '',
    children = [],
    isCollapsed = false
  } = config;

  const card = el('div', {
    class: 'collapsible-card',
    style: `
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
    `
  });

  // Card header
  const header = el('div', {
    class: 'card-header',
    style: `
      padding: 16px 20px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
    onclick: toggleCollapse
  });

  // Title and status
  const titleSection = el('div', {
    style: 'display: flex; align-items: center; gap: 12px;'
  }, [
    el('h3', {
      style: 'margin: 0; font-size: 16px; font-weight: 600; color: var(--text);'
    }, title),
    el('span', {
      class: `status-pill ${status}`,
      style: `
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        background: ${
          status === 'complete' ? '#10b981' :
          status === 'required' ? '#ef4444' :
          '#6b7280'
        };
        color: white;
      `
    }, completionText || status)
  ]);

  // Chevron
  const chevron = createIcon('chevron-down');
  chevron.style.transition = 'transform 0.2s ease';
  chevron.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';

  header.append(titleSection, chevron);

  // Card content
  const content = el('div', {
    class: 'card-content',
    style: `
      padding: 20px;
      display: ${isCollapsed ? 'none' : 'block'};
    `
  }, children);

  function toggleCollapse() {
    const isCurrentlyCollapsed = content.style.display === 'none';
    content.style.display = isCurrentlyCollapsed ? 'block' : 'none';
    chevron.style.transform = isCurrentlyCollapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
  }

  card.append(header, content);
  return { card, toggleCollapse };
}

// Helper functions for goal linking
function jumpToGoal(goalId) {
  // Delegate to global function
  if (window.jumpToGoal) {
    window.jumpToGoal(goalId);
  }
}

function openGoalLinker(rowId) {
  // Delegate to global function
  if (window.openGoalLinker) {
    window.openGoalLinker(rowId);
  }
}
