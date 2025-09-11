/**
 * Form Components Module
 * Standardized, modular form field components with comprehensive props support
 */

import { el, textareaAutoResize } from './utils.js';

// --- Core Form Components ---

// Internal helpers to reduce branching in component builders
function applyAttributes(node, attrs = {}) {
  Object.entries(attrs).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== false && v !== '') node[k] = v;
  });
}

function buildLabelEl(text, id, required, extraClass = '') {
  return el(
    'label',
    { class: `form-label ${required ? 'form-label--required' : ''} ${extraClass}`.trim(), for: id },
    text,
  );
}

function buildFieldContainer(kind, disabled, error, children, extraClass = '') {
  return el(
    'div',
    {
      class:
        `form-field form-field--${kind} ${disabled ? 'form-field--disabled' : ''} ${error ? 'form-field--error' : ''} ${extraClass}`.trim(),
    },
    children,
  );
}

function appendHintAndError(wrapper, hint, error) {
  if (hint) wrapper.appendChild(el('div', { class: 'form-hint' }, hint));
  if (error) wrapper.appendChild(el('div', { class: 'form-error' }, error));
}

function withDefaults(obj, defaults) {
  return { ...defaults, ...obj };
}

// Element builders
function buildInput({
  type,
  placeholder,
  value,
  disabled,
  required,
  size,
  className,
  error,
  onChange,
}) {
  const input = document.createElement('input');
  input.type = type;
  input.placeholder = placeholder;
  input.value = value || '';
  input.disabled = disabled;
  input.required = required;
  input.className =
    `form-input form-input--${size} ${className} ${error ? 'form-input--error' : ''}`.trim();
  input.addEventListener('blur', (e) => {
    if (onChange) onChange(e.target.value);
  });
  return input;
}

function buildTextarea({
  placeholder,
  disabled,
  required,
  rows,
  size,
  className,
  error,
  value,
  onChange,
}) {
  const t = document.createElement('textarea');
  t.placeholder = placeholder;
  t.disabled = disabled;
  t.required = required;
  t.rows = rows;
  t.className =
    `form-textarea form-textarea--${size} ${className} ${error ? 'form-textarea--error' : ''}`.trim();
  t.value = value || '';
  t.addEventListener('blur', (e) => {
    if (onChange) onChange(e.target.value);
  });
  return t;
}

function buildSelect({ disabled, required, multiple, size, className, error, onChange }) {
  const s = document.createElement('select');
  s.disabled = disabled;
  s.required = required;
  s.multiple = multiple;
  s.className =
    `form-select form-select--${size} ${className} ${error ? 'form-select--error' : ''}`.trim();
  s.onchange = function (e) {
    if (!onChange) return;
    const selectedValue = multiple
      ? Array.from(e.target.selectedOptions).map((opt) => opt.value)
      : e.target.value;
    onChange(selectedValue);
  };
  return s;
}

function buildInputWrapper(node, hint, error) {
  const wrapper = el('div', { class: 'form-input-wrapper' }, [node]);
  appendHintAndError(wrapper, hint, error);
  return wrapper;
}

function appendCharCount(wrapper, textarea, maxLength, value) {
  if (!maxLength) return;
  const charCount = el('div', { class: 'form-char-count' }, `${(value || '').length}/${maxLength}`);
  textarea.addEventListener('input', () => {
    charCount.textContent = `${textarea.value.length}/${maxLength}`;
  });
  wrapper.appendChild(charCount);
}

function appendPlaceholderOption(select, shouldAdd, value, placeholder) {
  if (!shouldAdd) return;
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.disabled = !value;
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);
}

function buildOption(option, value, multiple) {
  const optionEl = document.createElement('option');
  optionEl.value = option.value;
  optionEl.textContent = option.label;
  optionEl.disabled = option.disabled || false;
  if (multiple) {
    if (Array.isArray(value) && value.includes(option.value)) optionEl.selected = true;
  } else if (value === option.value) {
    optionEl.selected = true;
  }
  return optionEl;
}

function buildRadioItem({ option, index, name, value, disabled, required, onChange }) {
  const radioId = `${name}-${index}`;
  const radio = el('input', {
    type: 'radio',
    name,
    value: option.value,
    id: radioId,
    checked: value === option.value,
    disabled: disabled || option.disabled,
    required,
    class: 'form-radio',
    onchange: (e) => onChange(e.target.value),
  });
  const radioLabel = el('label', { for: radioId, class: 'form-label form-label--radio' }, [
    radio,
    el('span', {}, option.label),
  ]);
  return el('div', { class: 'form-radio-item' }, [radioLabel]);
}

/**
 * Enhanced Input Field Component
 * @param {object} options - Configuration options object
 */
export function inputField(options = {}) {
  // Modern props format: inputField({ label, value, onChange, ...props })
  const { label, value, onChange, ...rest } = options;
  const cfg = withDefaults(rest, {
    type: 'text',
    placeholder: '',
    disabled: false,
    required: false,
    maxLength: null,
    pattern: null,
    className: '',
    id: null,
    autocomplete: null,
    hint: '',
    error: '',
    size: 'normal',
  });
  const {
    type,
    placeholder,
    disabled,
    required,
    maxLength,
    pattern,
    className,
    id,
    autocomplete,
    hint,
    error,
    size,
  } = cfg;

  // Create input element
  const input = buildInput({
    type,
    placeholder,
    value,
    disabled,
    required,
    size,
    className,
    error,
    onChange,
  });

  // Add optional attributes
  applyAttributes(input, { maxLength, pattern, id, autocomplete });

  return buildInputFieldContainer({ label, id, required, node: input, hint, error, disabled });
}

function buildInputFieldContainer({ label, id, required, node, hint, error, disabled }) {
  const fieldElements = [buildLabelEl(label, id, required)];
  const inputWrapper = buildInputWrapper(node, hint, error);
  fieldElements.push(inputWrapper);
  return buildFieldContainer('input', disabled, error, fieldElements);
}

/**
 * Enhanced TextArea Field Component
 * @param {object} options - Configuration options object
 */
export function textAreaField(options = {}) {
  // Modern props format: textAreaField({ label, value, onChange, ...props })
  const { label, value, onChange, ...rest } = options;
  const cfg = withDefaults(rest, {
    placeholder: '',
    disabled: false,
    required: false,
    rows: 2,
    maxLength: null,
    autoResize: true,
    className: '',
    id: null,
    hint: '',
    error: '',
    size: 'normal',
  });
  const {
    placeholder,
    disabled,
    required,
    rows,
    maxLength,
    autoResize,
    className,
    id,
    hint,
    error,
    size,
  } = cfg;

  // Create textarea element
  const textarea = buildTextarea({
    placeholder,
    disabled,
    required,
    rows,
    size,
    className,
    error,
    value,
    onChange,
  });

  applyAttributes(textarea, { maxLength, id });

  // Apply auto-resize if enabled
  if (autoResize) textareaAutoResize(textarea);

  return buildTextareaFieldContainer({
    label,
    id,
    required,
    node: textarea,
    hint,
    error,
    disabled,
    maxLength,
    value,
  });
}

function buildTextareaFieldContainer({
  label,
  id,
  required,
  node,
  hint,
  error,
  disabled,
  maxLength,
  value,
}) {
  const fieldElements = [buildLabelEl(label, id, required)];
  const wrapper = buildInputWrapper(node);
  appendCharCount(wrapper, node, maxLength, value);
  appendHintAndError(wrapper, hint, error);
  fieldElements.push(wrapper);
  return buildFieldContainer('textarea', disabled, error, fieldElements);
}

/**
 * Enhanced Select Field Component
 * @param {object} options - Configuration options object
 */
export function selectField(options = {}) {
  // Modern props format: selectField({ label, value, options, onChange, ...props })
  const { label, value, options: optionsArray, onChange, ...rest } = options;
  const cfg = withDefaults(rest, {
    placeholder: 'Select...',
    disabled: false,
    required: false,
    multiple: false,
    className: '',
    id: null,
    hint: '',
    error: '',
    size: 'normal',
    allowEmpty: true,
  });
  const {
    placeholder,
    disabled,
    required,
    multiple,
    className,
    id,
    hint,
    error,
    size,
    allowEmpty,
  } = cfg;

  // Create select element
  const select = buildSelect({ disabled, required, multiple, size, className, error, onChange });

  applyAttributes(select, { id });

  // Add placeholder option if allowed
  appendPlaceholderOption(select, allowEmpty && !multiple, value, placeholder);

  // Add all options using direct DOM creation
  optionsArray.forEach((option) => select.appendChild(buildOption(option, value, multiple)));

  return buildSelectFieldContainer({ label, id, required, node: select, hint, error, disabled });
}

function buildSelectFieldContainer({ label, id, required, node, hint, error, disabled }) {
  const fieldElements = [buildLabelEl(label, id, required)];
  const wrapper = buildInputWrapper(node, hint, error);
  fieldElements.push(wrapper);
  return buildFieldContainer('select', disabled, error, fieldElements);
}

/**
 * Enhanced Number Input Field Component
 * @param {string} label - Field label text
 * @param {number} value - Current field value
 * @param {function} onChange - Change handler function
 * @param {object} options - Configuration options
 */
export function numberField(label, value, onChange, options = {}) {
  const cfg = withDefaults(options, {
    min: null,
    max: null,
    step: null,
    placeholder: '',
    disabled: false,
    required: false,
    className: '',
    id: null,
    hint: '',
    error: '',
    size: 'normal',
  });
  const { min, max, step, placeholder, disabled, required, className, id, hint, error, size } = cfg;

  const numberOptions = {
    type: 'number',
    placeholder,
    disabled,
    required,
    className,
    id,
    hint,
    error,
    size,
  };

  // Use the input field but override the onChange to handle numbers (adapt to object signature)
  const field = inputField({
    label,
    value,
    onChange: (val) => {
      const numValue = val === '' ? null : Number(val);
      onChange(numValue);
    },
    ...numberOptions,
  });

  // Add number-specific attributes to the input
  const input = field.querySelector('input');
  applyAttributes(input, { min, max, step });

  return field;
}

/**
 * Checkbox Field Component
 * @param {string} label - Field label text
 * @param {boolean} checked - Current checked state
 * @param {function} onChange - Change handler function
 * @param {object} options - Configuration options
 */
export function checkboxField(label, checked, onChange, options = {}) {
  const {
    disabled = false,
    required = false,
    className = '',
    id = null,
    hint = '',
    error = '',
  } = options;

  const checkbox = el('input', {
    type: 'checkbox',
    checked: !!checked,
    disabled,
    required,
    id,
    class: `form-checkbox ${className}`.trim(),
    onchange: (e) => onChange(e.target.checked),
  });

  const labelEl = el(
    'label',
    {
      class: `form-label form-label--checkbox ${required ? 'form-label--required' : ''}`,
      for: id,
    },
    [checkbox, el('span', {}, label)],
  );

  const fieldElements = [labelEl];

  if (hint) {
    fieldElements.push(el('div', { class: 'form-hint' }, hint));
  }

  if (error) {
    fieldElements.push(el('div', { class: 'form-error' }, error));
  }

  return buildFieldContainer('checkbox', disabled, error, fieldElements);
}

/**
 * Radio Button Group Component
 * @param {string} label - Field label text
 * @param {string} value - Current selected value
 * @param {array} options - Array of option objects {value, label, disabled}
 * @param {function} onChange - Change handler function
 * @param {object} config - Configuration options
 */
export function radioField(label, value, options, onChange, config = {}) {
  const cfg = withDefaults(config, {
    name: `radio-${Date.now()}`,
    disabled: false,
    required: false,
    className: '',
    hint: '',
    error: '',
    inline: false,
  });
  const { name, disabled, required, className, hint, error, inline } = cfg;

  const radioOptions = options.map((option, index) =>
    buildRadioItem({ option, index, name, value, disabled, required, onChange }),
  );

  const fieldElements = [
    el(
      'div',
      {
        class: `form-label ${required ? 'form-label--required' : ''}`,
      },
      label,
    ),
    el(
      'div',
      {
        class: `form-radio-group ${inline ? 'form-radio-group--inline' : ''}`,
      },
      radioOptions,
    ),
  ];

  if (hint) {
    fieldElements.push(el('div', { class: 'form-hint' }, hint));
  }

  if (error) {
    fieldElements.push(el('div', { class: 'form-error' }, error));
  }

  return buildFieldContainer('radio', disabled, error, fieldElements, className);
}

// --- Utility Components ---

/**
 * Section Header Component
 * @param {string} text - Header text
 * @param {object} options - Configuration options
 */
export function sectionHeader(text, options = {}) {
  const { level = 3, className = '', id = null } = options;

  const headerProps = {
    class: `section-title section-title--h${level} ${className}`.trim(),
  };

  if (id) headerProps.id = id;

  return el(`h${level}`, headerProps, text);
}

/**
 * Field Group Component - groups related fields
 * @param {string} legend - Group legend/title
 * @param {array} fields - Array of field elements
 * @param {object} options - Configuration options
 */
export function fieldGroup(legend, fields, options = {}) {
  const { className = '', disabled = false } = options;

  const fieldset = el(
    'fieldset',
    {
      class: `form-fieldset ${className} ${disabled ? 'form-fieldset--disabled' : ''}`.trim(),
      disabled,
    },
    [el('legend', { class: 'form-legend' }, legend), ...fields],
  );

  return fieldset;
}
