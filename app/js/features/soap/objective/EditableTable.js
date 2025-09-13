/**
 * Editable Table Module
 * Consolidated table helper for all assessment tables
 */
import { el, textareaAutoResize } from '../../../ui/utils.js';

// Map common percentage widths to utility classes to avoid inline styles
function widthClass(width) {
  const v = String(width || '').trim();
  switch (v) {
    case '50%':
      return 'w-50p';
    case '40%':
      return 'w-40p';
    case '25%':
      return 'w-25p';
    case '20%':
      return 'w-20p';
    default:
      return '';
  }
}

// ---- Internal builders to reduce complexity ----
function buildTableHeader({ title, showAddButton, compactAddButton, addButtonText, onAdd }) {
  if (!title && !(showAddButton && !compactAddButton)) return null;
  const header = el('div', {
    class: 'editable-table__header d-flex jc-between ai-center mb-8',
  });
  if (title) {
    header.appendChild(el('h5', { class: 'editable-table__title m-0 text-accent' }, title));
  }
  if (showAddButton && !compactAddButton) {
    header.appendChild(
      el(
        'button',
        { type: 'button', class: 'btn small primary editable-table__add-btn', onclick: onAdd },
        addButtonText,
      ),
    );
  }
  return header;
}

function ensureEmptyOption(options) {
  const raw = Array.isArray(options) ? options.slice() : [];
  const hasEmpty = raw.some((opt) =>
    opt && typeof opt === 'object' ? String(opt.value ?? '') === '' : String(opt) === '',
  );
  if (!hasEmpty) raw.unshift({ value: '', label: '' });
  return raw;
}

function buildSelectInput(column, value, onChange) {
  const input = el('select', {
    class: 'editable-table__select form-input-standard',
    onchange: (e) => onChange(String(e.target.value)),
  });
  const rawOptions = ensureEmptyOption(column.options);
  rawOptions.forEach((option) => {
    const isObj = option && typeof option === 'object';
    const optValue = isObj
      ? Object.prototype.hasOwnProperty.call(option, 'value')
        ? option.value
        : (option.label ?? '')
      : option;
    const optLabel = isObj ? (option.label ?? String(optValue)) : String(optValue);
    input.appendChild(el('option', { value: String(optValue) }, optLabel));
  });
  input.value = String(value ?? '');
  return input;
}

function buildInputForColumn(column, value, onChange) {
  if (column.type === 'select') return buildSelectInput(column, value, onChange);
  if (column.type === 'number')
    return el('input', {
      type: 'number',
      class: 'editable-table__input form-input-standard',
      value: value,
      placeholder: column.placeholder || '',
      min: column.min,
      max: column.max,
      step: column.step,
      onblur: (e) => onChange(e.target.value),
    });
  if (column.type === 'textarea') {
    const t = el(
      'textarea',
      {
        class: 'editable-table__textarea form-input-standard resize-vertical',
        rows: column.rows || 1,
        placeholder: column.placeholder || '',
        onblur: (e) => onChange(e.target.value),
      },
      value,
    );
    textareaAutoResize(t);
    return t;
  }
  return el('input', {
    type: column.type || 'text',
    class: 'editable-table__input form-input-standard',
    value: value,
    placeholder: column.placeholder || '',
    onblur: (e) => onChange(e.target.value),
  });
}

function buildBodyRow(columns, rowId, rowData, createCell, showDeleteButton, onDelete) {
  return el('tr', { class: 'editable-table__row', 'data-row-id': rowId }, [
    ...columns.map((col) => createCell(col, rowData, rowId)),
    ...(showDeleteButton
      ? [
          el(
            'td',
            { class: 'editable-table__cell editable-table__cell--actions' },
            el(
              'button',
              {
                type: 'button',
                class: 'remove-btn editable-table__delete-btn',
                title: 'Delete row',
                'aria-label': 'Delete row',
                onclick: () => onDelete(rowId),
              },
              '×',
            ),
          ),
        ]
      : []),
  ]);
}

function buildTableElement({
  columns,
  data,
  showHeader,
  actionsHeaderLabel,
  showDeleteButton,
  createCell,
  onDelete,
}) {
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
                class:
                  `editable-table__header-cell editable-table__header-cell--${col.field} ${widthClass(col.width)}`.trim(),
                style: widthClass(col.width)
                  ? undefined
                  : col.width
                    ? `width: ${col.width};`
                    : undefined,
                scope: 'col',
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
                    style: undefined,
                    scope: 'col',
                    'aria-label': 'Actions',
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
      rows.map((rowId) =>
        buildBodyRow(columns, rowId, data[rowId], createCell, showDeleteButton, onDelete),
      ),
    ),
  );
  const table = el('table', { class: 'table editable-table__table' }, tableChildren);
  // Wrap in responsive container for mobile horizontal scroll when needed
  return el('div', { class: 'table-responsive' }, table);
}

function buildCompactFooter(showAddButton, compactAddButton, onAdd) {
  if (!(showAddButton && compactAddButton)) return null;
  return el(
    'div',
    {
      class: 'editable-table__footer d-flex jc-center mb-16',
    },
    el(
      'button',
      {
        type: 'button',
        class: 'compact-add-btn',
        title: 'Add row',
        'aria-label': 'Add row',
        onclick: onAdd,
      },
      '+',
    ),
  );
}

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
    class: `editable-table mb-16 ${className}`.trim(),
    style: style,
  });

  // Add title and controls
  const updateCell = makeUpdateCell(data, onChange);
  let rebuildTable;
  const addRow = makeAddRow(columns, data, onChange, () => rebuildTable());
  const deleteRow = makeDeleteRow(data, onChange, () => rebuildTable());

  attachHeader(container, { title, showAddButton, compactAddButton, addButtonText }, () =>
    addRow(),
  );

  const createCell = makeCreateCell(updateCell);
  rebuildTable = makeRebuildTable({
    container,
    columns,
    data,
    showHeader,
    actionsHeaderLabel,
    showDeleteButton,
    createCell,
    onDelete: deleteRow,
    showAddButton,
    compactAddButton,
    onAdd: () => addRow(),
  });

  initializeTable(startWithOneRow, data, addRow, rebuildTable);
  return {
    element: container,
    rebuild: rebuildTable,
    addRow,
    deleteRow,
    updateCell,
  };
}

function attachHeader(container, { title, showAddButton, compactAddButton, addButtonText }, onAdd) {
  const header = buildTableHeader({ title, showAddButton, compactAddButton, addButtonText, onAdd });
  if (header) container.appendChild(header);
}

function makeCreateCell(updateCell) {
  return (column, rowData, rowId) => {
    const value = rowData[column.field] || '';
    const input = buildInputForColumn(column, value, (val) => updateCell(rowId, column.field, val));
    return el(
      'td',
      {
        class:
          `editable-table__cell editable-table__cell--${column.field} ${widthClass(column.width)}`.trim(),
        style: widthClass(column.width)
          ? undefined
          : column.width
            ? `width: ${column.width};`
            : undefined,
      },
      input,
    );
  };
}

function makeRebuildTable({
  container,
  columns,
  data,
  showHeader,
  actionsHeaderLabel,
  showDeleteButton,
  createCell,
  onDelete,
  showAddButton,
  compactAddButton,
  onAdd,
}) {
  let table = null;
  let footerEl = null;
  return () => {
    if (table) table.remove();
    if (footerEl) {
      footerEl.remove();
      footerEl = null;
    }
    table = buildTableElement({
      columns,
      data,
      showHeader,
      actionsHeaderLabel,
      showDeleteButton,
      createCell,
      onDelete,
    });
    container.appendChild(table);
    const footer = buildCompactFooter(showAddButton, compactAddButton, onAdd);
    if (footer) {
      footerEl = footer;
      container.appendChild(footerEl);
    }
  };
}

function initializeTable(startWithOneRow, data, addRow, rebuildTable) {
  if (startWithOneRow && Object.keys(data || {}).length === 0) {
    addRow();
  } else {
    rebuildTable();
  }
}

function makeAddRow(columns, data, onChange, onAfter) {
  return () => {
    const newRow = {};
    columns.forEach((col) => {
      newRow[col.field] = col.defaultValue || '';
    });
    const newId = Date.now().toString();
    data[newId] = newRow;
    onChange(data);
    onAfter();
  };
}

function makeDeleteRow(data, onChange, onAfter) {
  return (rowId) => {
    delete data[rowId];
    onChange(data);
    onAfter();
  };
}

function makeUpdateCell(data, onChange) {
  return (rowId, field, value) => {
    if (!data[rowId]) data[rowId] = {};
    data[rowId][field] = value;
    onChange(data);
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
