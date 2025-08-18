// DEPRECATED MODULE: FillableTable
// This component has been replaced by features/soap/objective/EditableTable.js
// Do not use. If imported, it will throw to surface legacy usage.

/* eslint-disable no-console */
console.warn('[DEPRECATED] app/js/modules/FillableTable.js is deprecated. Use features/soap/objective/EditableTable.js instead.');

export function createFillableTable() {
  throw new Error('[DEPRECATED] createFillableTable has been removed. Use createEditableTable.');
}

export default null;
/**
 * Enhanced Fillable Table Component
 * Professional table layout for goals, interventions, and other structured data
 * Updated: 2025-08-11
 */
import { el } from '../ui/utils.js';
import { createIcon } from '../ui/Icons.js';

/**
 * Creates a professional fillable table with enhanced styling
 * @param {Object} config - Table configuration
 * @returns {HTMLElement} Table container
 */
export function createFillableTable(config) {
  const {
    title = '',
    subtitle = '',
    columns = [],
    data = {},
    onUpdate = () => {},
    onAdd = () => {},
    onDelete = () => {},
    allowAdd = true,
    allowDelete = true,
    minRows = 1,
    maxRows = 10,
    className = '',
    placeholder = 'Click to add new row...'
  } = config;

  const container = el('div', {
    class: `fillable-table-container ${className}`,
    style: `
      background: var(--inline-card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      overflow: hidden;
    `
  });

  // Header section
  if (title || subtitle) {
    const header = el('div', {
      class: 'table-header',
      style: 'margin-bottom: 20px;'
    });

    if (title) {
      header.append(el('h4', {
        style: 'margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: var(--text);'
      }, title));
    }

    if (subtitle) {
      header.append(el('p', {
        style: 'margin: 0; font-size: 13px; color: var(--text-muted);'
      }, subtitle));
    }

    container.append(header);
  }

  // Table wrapper for overflow handling
  const tableWrapper = el('div', {
    style: 'overflow-x: auto; border-radius: 8px; border: 1px solid var(--border);'
  });

  // Main table
  const table = el('table', {
    class: 'fillable-table',
    style: `
      width: 100%;
      border-collapse: collapse;
      background: var(--bg);
      font-size: 14px;
    `
  });

  // Table header
  const thead = el('thead');
  const headerRow = el('tr', {
    style: 'background: var(--bg-secondary); border-bottom: 2px solid var(--border);'
  });

  columns.forEach((column, index) => {
    const th = el('th', {
      style: `
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        color: var(--text);
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
        width: ${column.width || 'auto'};
        ${index === 0 ? 'border-right: 1px solid var(--border-light);' : ''}
      `
    }, column.label);
    headerRow.append(th);
  });

  // Actions column if delete is allowed
  if (allowDelete) {
    headerRow.append(el('th', {
      style: `
        padding: 12px 16px;
        text-align: center;
        font-weight: 600;
        color: var(--text);
        font-size: 13px;
        width: 60px;
      `
    }, 'Actions'));
  }

  thead.append(headerRow);
  table.append(thead);

  // Table body
  const tbody = el('tbody');
  table.append(tbody);

  // Function to render rows
  function renderRows() {
    tbody.innerHTML = '';
    
    const dataEntries = Object.entries(data);
    
    // Ensure minimum rows
    while (dataEntries.length < minRows) {
      const newId = Date.now().toString() + Math.random();
      dataEntries.push([newId, {}]);
    }

    dataEntries.forEach(([rowId, rowData], index) => {
      const row = createTableRow(rowId, rowData, index);
      tbody.append(row);
    });

    // Add empty row if allowed and under max
    if (allowAdd && dataEntries.length < maxRows) {
      const emptyRow = createEmptyRow();
      tbody.append(emptyRow);
    }
  }

  // Function to create a data row
  function createTableRow(rowId, rowData, index) {
    const row = el('tr', {
      class: 'data-row',
      style: `
        border-bottom: 1px solid var(--border-light);
        transition: background-color 0.2s ease;
      `
    });

    // Add hover effect
    row.addEventListener('mouseenter', () => {
      row.style.backgroundColor = 'var(--bg-secondary)';
    });
    row.addEventListener('mouseleave', () => {
      row.style.backgroundColor = 'transparent';
    });

    columns.forEach((column, colIndex) => {
      const td = el('td', {
        style: `
          padding: 12px 16px;
          vertical-align: middle;
          border-right: ${colIndex === 0 ? '1px solid var(--border-light)' : 'none'};
        `
      });

      const input = createCellInput(column, rowData[column.field] || '', (value) => {
        if (!data[rowId]) data[rowId] = {};
        data[rowId][column.field] = value;
        onUpdate(data);
      });

      td.append(input);
      row.append(td);
    });

    // Delete button if allowed
    if (allowDelete) {
      const actionTd = el('td', {
        style: 'padding: 12px 16px; text-align: center; vertical-align: middle;'
      });

      const deleteBtn = el('button', {
        class: 'remove-btn',
        title: 'Delete row',
        onclick: () => {
          delete data[rowId];
          onUpdate(data);
          onDelete(rowId);
          renderRows();
        }
      }, '×');
      actionTd.append(deleteBtn);
      row.append(actionTd);
    }

    return row;
  }

  // Function to create empty row for adding new entries
  function createEmptyRow() {
    const row = el('tr', {
      class: 'empty-row',
      style: `
        border-bottom: 1px solid var(--border-light);
        cursor: pointer;
        transition: all 0.2s ease;
      `
    });

    const colspan = columns.length + (allowDelete ? 1 : 0);
    const td = el('td', {
      colspan: colspan,
      style: `
        padding: 20px;
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
        background: var(--panel);
        border: 2px dashed var(--border);
      `
    }, placeholder);

    row.addEventListener('mouseenter', () => {
      td.style.background = 'var(--primary-light)';
      td.style.color = 'var(--primary-dark)';
      td.style.borderColor = 'var(--primary)';
    });
    row.addEventListener('mouseleave', () => {
      td.style.background = 'var(--panel)';
      td.style.color = 'var(--text-muted)';
      td.style.borderColor = 'var(--border)';
    });

    row.addEventListener('click', () => {
      const newId = Date.now().toString();
      data[newId] = {};
      onUpdate(data);
      onAdd(newId);
      renderRows();
      
      // Focus first input in new row
      setTimeout(() => {
        const firstInput = tbody.querySelector(`tr:nth-last-child(2) input, tr:nth-last-child(2) textarea, tr:nth-last-child(2) select`);
        if (firstInput) firstInput.focus();
      }, 100);
    });

    row.append(td);
    return row;
  }

  // Function to create cell input based on column type
  function createCellInput(column, value, onChange) {
    const baseStyle = `
      width: 100%;
      border: none;
      background: transparent;
      padding: 6px 8px;
      font-size: 13px;
      color: var(--text);
      outline: none;
      transition: background-color 0.2s ease;
      border-radius: 4px;
    `;

    const focusStyle = `
      background: var(--input-bg);
      box-shadow: 0 0 0 2px var(--primary-light);
    `;

    let input;

    if (column.type === 'select') {
      input = el('select', {
        style: baseStyle,
        onchange: (e) => onChange(e.target.value)
      });

      (column.options || []).forEach(option => {
        input.append(el('option', {
          value: option.value,
          selected: value === option.value
        }, option.label));
      });
    } else if (column.type === 'textarea') {
      input = el('textarea', {
        style: baseStyle + 'min-height: 60px; resize: vertical;',
        value: value,
        placeholder: column.placeholder || '',
        oninput: (e) => onChange(e.target.value)
      });
    } else if (column.type === 'number') {
      input = el('input', {
        type: 'number',
        style: baseStyle,
        value: value,
        placeholder: column.placeholder || '',
        min: column.min,
        max: column.max,
        step: column.step,
        oninput: (e) => onChange(e.target.value)
      });
    } else {
      input = el('input', {
        type: column.type || 'text',
        style: baseStyle,
        value: value,
        placeholder: column.placeholder || '',
        oninput: (e) => onChange(e.target.value)
      });
    }

    // Add focus effects
    input.addEventListener('focus', () => {
      input.style.background = 'var(--input-bg)';
      input.style.boxShadow = '0 0 0 2px var(--primary-light)';
    });
    input.addEventListener('blur', () => {
      input.style.background = 'transparent';
      input.style.boxShadow = 'none';
    });

    return input;
  }

  tableWrapper.append(table);
  container.append(tableWrapper);

  // Initial render
  renderRows();

  return {
    container,
    refresh: renderRows,
    getData: () => data,
    setData: (newData) => {
      Object.keys(data).forEach(key => delete data[key]);
      Object.assign(data, newData);
      renderRows();
    }
  };
}
