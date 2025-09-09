/**
 * Editable Table Module
 * Consolidated table helper for all assessment tables
 */
import { el, textareaAutoResize } from '../../../ui/utils.js';

/**
 * Creates a standardized editable table with consistent styling and behavior
 * @param {object} config - Table configuration
 */
export function createEditableTable(config) {
  const {
    title,
    columns,
    data,
    onChange,
    addButtonText = '+ Add Row',
    showAddButton = true,
    showDeleteButton = true,
    actionsHeaderLabel = '',
    compactAddButton = false,
    startWithOneRow = false,
    showHeader = true,
    className = '',
    style = {},
  } = config;

  const container = el('div', {
    class: `editable-table ${className}`.trim(),
    style: Object.assign(
      {
        marginBottom: '16px',
      },
      style,
    ),
  });

  // Add title and controls
  if (title || (showAddButton && !compactAddButton)) {
    const header = el('div', {
      class: 'editable-table__header',
      style:
        'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;',
    });

    if (title) {
      header.appendChild(
        el(
          'h5',
          {
            class: 'editable-table__title',
            style: 'margin: 0; color: var(--accent2);',
          },
          title,
        ),
      );
    }

    if (showAddButton && !compactAddButton) {
      header.appendChild(
        el(
          'button',
          {
            type: 'button',
            class: 'btn small primary editable-table__add-btn',
            onclick: () => addRow(),
          },
          addButtonText,
        ),
      );
    }

    container.appendChild(header);
  }

  let table;
  let footerEl;

  const addRow = () => {
    const newRow = {};
    columns.forEach((col) => {
      newRow[col.field] = col.defaultValue || '';
    });
    const newId = Date.now().toString();
    data[newId] = newRow;
    onChange(data);
    rebuildTable();
  };

  const deleteRow = (rowId) => {
    delete data[rowId];
    onChange(data);
    rebuildTable();
  };

  const updateCell = (rowId, field, value) => {
    if (!data[rowId]) data[rowId] = {};
    data[rowId][field] = value;
    onChange(data);
  };

  const createCell = (column, rowData, rowId) => {
    const value = rowData[column.field] || '';

    let input;

    if (column.type === 'select') {
      input = el('select', {
        class: 'editable-table__select',
        style: 'width: 100%; padding: 4px;',
        onchange: (e) => updateCell(rowId, column.field, e.target.value),
      });

      // Support both string options and { value, label } objects.
      // Do not attach a `selected` attribute; instead, set the select's value after
      // appending options to avoid boolean-attribute mishandling.
      const rawOptions = Array.isArray(column.options) ? column.options.slice() : [];
      const hasEmpty = rawOptions.some((opt) => {
        if (opt && typeof opt === 'object') {
          return String(opt.value ?? '') === '';
        }
        return String(opt) === '';
      });
      if (!hasEmpty) rawOptions.unshift({ value: '', label: '' });

      rawOptions.forEach((option) => {
        const isObj = option && typeof option === 'object';
        const optValue = isObj
          ? Object.prototype.hasOwnProperty.call(option, 'value')
            ? option.value
            : (option.label ?? '')
          : option;
        const optLabel = isObj ? (option.label ?? String(optValue)) : String(option);
        const optValueStr = String(optValue);

        const optionEl = el('option', { value: optValueStr }, optLabel);
        input.appendChild(optionEl);
      });

      // Assign current value (string) to select; if no match, browser keeps first option.
      input.value = String(value ?? '');
    } else if (column.type === 'number') {
      input = el('input', {
        type: 'number',
        class: 'editable-table__input',
        value: value,
        placeholder: column.placeholder || '',
        min: column.min,
        max: column.max,
        step: column.step,
        style: 'width: 100%; padding: 4px;',
        onblur: (e) => updateCell(rowId, column.field, e.target.value),
      });
    } else if (column.type === 'textarea') {
      input = el(
        'textarea',
        {
          class: 'editable-table__textarea',
          rows: column.rows || 1,
          placeholder: column.placeholder || '',
          style: 'width: 100%; padding: 4px; min-height: 40px;',
          onblur: (e) => updateCell(rowId, column.field, e.target.value),
        },
        value,
      );
      // Auto-expand as the user types; no scrollbars/resizer needed
      textareaAutoResize(input);
    } else {
      input = el('input', {
        type: column.type || 'text',
        class: 'editable-table__input',
        value: value,
        placeholder: column.placeholder || '',
        style: 'width: 100%; padding: 4px;',
        onblur: (e) => updateCell(rowId, column.field, e.target.value),
      });
    }

    return el(
      'td',
      {
        class: `editable-table__cell editable-table__cell--${column.field}`,
        style: column.width ? `width: ${column.width};` : '',
      },
      input,
    );
  };

  const rebuildTable = () => {
    if (table) table.remove();
    if (footerEl) {
      footerEl.remove();
      footerEl = null;
    }

    const rows = Object.keys(data);

    const tableChildren = [];
    if (showHeader) {
      tableChildren.push(
        el(
          'thead',
          { class: 'editable-table__head' },
          el('tr', {}, [
            ...columns.map((col) =>
              el(
                'th',
                {
                  class: `editable-table__header-cell editable-table__header-cell--${col.field}`,
                  style: col.width ? `width: ${col.width};` : '',
                },
                col.label,
              ),
            ),
            ...(showDeleteButton
              ? [
                  el(
                    'th',
                    {
                      class: 'editable-table__header-cell editable-table__header-cell--actions',
                      style: 'width: 50px;',
                    },
                    actionsHeaderLabel,
                  ),
                ]
              : []),
          ]),
        ),
      );
    }
    tableChildren.push(
      el(
        'tbody',
        { class: 'editable-table__body' },
        rows.map((rowId) => {
          const rowData = data[rowId];
          return el(
            'tr',
            {
              class: 'editable-table__row',
              'data-row-id': rowId,
            },
            [
              ...columns.map((col) => createCell(col, rowData, rowId)),
              ...(showDeleteButton
                ? [
                    el(
                      'td',
                      {
                        class: 'editable-table__cell editable-table__cell--actions',
                      },
                      el(
                        'button',
                        {
                          type: 'button',
                          class: 'remove-btn editable-table__delete-btn',
                          title: 'Delete row',
                          onclick: () => deleteRow(rowId),
                        },
                        '×',
                      ),
                    ),
                  ]
                : []),
            ],
          );
        }),
      ),
    );

    table = el('table', { class: 'table editable-table__table' }, tableChildren);

    container.appendChild(table);

    // Compact add button centered beneath the table (Plan/Billing style)
    if (showAddButton && compactAddButton) {
      footerEl = el(
        'div',
        {
          class: 'editable-table__footer',
          style: 'display:flex; justify-content:center; margin-bottom: 16px;',
        },
        el(
          'div',
          {
            class: 'compact-add-btn',
            title: 'Add row',
            onclick: () => addRow(),
          },
          '+',
        ),
      );
      container.appendChild(footerEl);
    }
  };

  // Optionally start with one row if no data exists
  if (startWithOneRow && Object.keys(data || {}).length === 0) {
    addRow();
  } else {
    rebuildTable();
  }

  return {
    element: container,
    rebuild: rebuildTable,
    addRow,
    deleteRow,
    updateCell,
  };
}

/**
 * Creates a bilateral assessment table (common for ROM/MMT)
 * @param {object} config - Configuration object
 */
export function createBilateralTable(config) {
  const {
    title,
    items,
    data,
    onChange,
    valueType = 'text', // 'text', 'select', 'number'
    options = [],
    normalValues = true,
    // notesColumn removed (UI simplification)
    nameColumnLabel = 'Name',
    showTitle = true,
    embedNormalInName = false,
    // notesWidth no longer used
  } = config;

  // Group items by their base name (without side designation)
  const groups = {};
  items.forEach((item, index) => {
    const baseName = item.name || item.joint || item.muscle;
    if (!groups[baseName]) {
      groups[baseName] = {
        normal: item.normal,
        left: null,
        right: null,
        bilateral: null,
      };
    }

    if (item.side === 'L') {
      groups[baseName].left = index;
    } else if (item.side === 'R') {
      groups[baseName].right = index;
    } else {
      groups[baseName].bilateral = index;
    }
  });

  const columns = [
    { field: 'name', label: nameColumnLabel },
    { field: 'left', label: 'Left', type: valueType, options },
    { field: 'right', label: 'Right', type: valueType, options },
  ];

  if (normalValues && !embedNormalInName) {
    columns.push({ field: 'normal', label: 'Normal' });
  }

  // Apply standardized width distribution
  if (columns.length === 3) {
    columns[0].width = '50%';
    columns[1].width = '25%';
    columns[2].width = '25%';
  } else if (columns.length === 4) {
    columns[0].width = '40%';
    columns[1].width = '20%';
    columns[2].width = '20%';
    columns[3].width = '20%';
  }

  // Notes column removed

  // Convert grouped data to table format
  const tableData = {};
  const groupsByRowId = {};
  Object.keys(groups).forEach((groupName) => {
    const group = groups[groupName];
    const rowId = groupName.toLowerCase().replace(/\s+/g, '-');
    groupsByRowId[rowId] = group;
    const displayName =
      normalValues && embedNormalInName && group.normal
        ? `${groupName} (${group.normal})`
        : groupName;

    const rowBase = {
      name: displayName,
      left: data[group.left] || '',
      right: data[group.right] || '',
    };
    if (!embedNormalInName && normalValues) rowBase.normal = group.normal || '';
    // notes removed
    tableData[rowId] = rowBase;
  });

  return createEditableTable({
    title: showTitle ? title : undefined,
    columns,
    data: tableData,
    onChange: (newData) => {
      // Convert back to original format and call onChange
      const updatedData = { ...data };
      Object.keys(newData).forEach((rowId) => {
        const row = newData[rowId];
        const group = groupsByRowId[rowId] || groups[row.name];

        if (group.left !== null) updatedData[group.left] = row.left;
        if (group.right !== null) updatedData[group.right] = row.right;
        // notes removed
      });
      onChange(updatedData);
    },
    showAddButton: false, // Bilateral tables typically have fixed structure
    actionsHeaderLabel: '', // Blank header to avoid 'Actions' label
    className: 'bilateral-table',
  });
}
