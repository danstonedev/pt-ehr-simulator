/**
 * Form Components Module
 * Standardized, modular form field components with comprehensive props support
 */

import { el, textareaAutoResize } from './utils.js';

// --- Core Form Components ---

/**
 * Enhanced Input Field Component
 * @param {object} options - Configuration options object
 */
export function inputField(options = {}) {
  // Modern props format: inputField({ label, value, onChange, ...props })
  const {
    label,
    value,
    onChange,
    ...config
  } = options;

  const {
    type = 'text',
    placeholder = '',
    disabled = false,
    required = false,
    maxLength = null,
    pattern = null,
    className = '',
    id = null,
    autocomplete = null,
    hint = '',
    error = '',
    size = 'normal' // 'small', 'normal', 'large'
  } = config;

  // Create input element using direct DOM approach (like working direct input)
  const input = document.createElement('input');
  input.type = type;
  input.placeholder = placeholder;
  input.value = value || '';
  input.disabled = disabled;
  input.required = required;
  input.className = `form-input form-input--${size} ${className} ${error ? 'form-input--error' : ''}`.trim();
  
  // Add direct event listener - use blur instead of input to avoid triggering on every keystroke
  input.addEventListener('blur', e => {
    onChange && onChange(e.target.value);
  });

  // Add optional attributes
  if (maxLength) input.maxLength = maxLength;
  if (pattern) input.pattern = pattern;
  if (id) input.id = id;
  if (autocomplete) input.autocomplete = autocomplete;

  // Build field wrapper
  const fieldElements = [
    el('label', { 
      class: `form-label ${required ? 'form-label--required' : ''}`,
      for: id 
    }, label)
  ];

  const inputWrapper = el('div', { class: 'form-input-wrapper' }, [input]);
  
  // Add hint text if provided
  if (hint) {
    inputWrapper.appendChild(el('div', { class: 'form-hint' }, hint));
  }
  
  // Add error message if provided
  if (error) {
    inputWrapper.appendChild(el('div', { class: 'form-error' }, error));
  }

  fieldElements.push(inputWrapper);

  return el('div', { 
    class: `form-field form-field--input ${disabled ? 'form-field--disabled' : ''} ${error ? 'form-field--error' : ''}`.trim()
  }, fieldElements);
}

/**
 * Enhanced TextArea Field Component
 * @param {object} options - Configuration options object
 */
export function textAreaField(options = {}) {
  // Modern props format: textAreaField({ label, value, onChange, ...props })
  const {
    label,
    value,
    onChange,
    placeholder = '',
    disabled = false,
    required = false,
  rows = 2,
    maxLength = null,
    autoResize = true,
    className = '',
    id = null,
    hint = '',
    error = '',
    size = 'normal' // 'small', 'normal', 'large'
  } = options;

  // Create textarea element using direct DOM approach
  const textarea = document.createElement('textarea');
  textarea.placeholder = placeholder;
  textarea.disabled = disabled;
  textarea.required = required;
  textarea.rows = rows;
  textarea.className = `form-textarea form-textarea--${size} ${className} ${error ? 'form-textarea--error' : ''}`.trim();
  textarea.value = value || '';
  
  // Add direct event listener - use blur instead of input to avoid triggering on every keystroke
  textarea.addEventListener('blur', e => {
    onChange && onChange(e.target.value);
  });

  if (maxLength) textarea.maxLength = maxLength;
  if (id) textarea.id = id;

  // Apply auto-resize if enabled
  if (autoResize) {
    textareaAutoResize(textarea);
  }

  // Build field wrapper
  const fieldElements = [
    el('label', { 
      class: `form-label ${required ? 'form-label--required' : ''}`,
      for: id 
    }, label)
  ];

  const inputWrapper = el('div', { class: 'form-input-wrapper' }, [textarea]);
  
  // Add character count if maxLength is set
  if (maxLength) {
    const charCount = el('div', { class: 'form-char-count' }, `${(value || '').length}/${maxLength}`);
    textarea.addEventListener('input', () => {
      charCount.textContent = `${textarea.value.length}/${maxLength}`;
    });
    inputWrapper.appendChild(charCount);
  }
  
  // Add hint text if provided
  if (hint) {
    inputWrapper.appendChild(el('div', { class: 'form-hint' }, hint));
  }
  
  // Add error message if provided
  if (error) {
    inputWrapper.appendChild(el('div', { class: 'form-error' }, error));
  }

  fieldElements.push(inputWrapper);

  return el('div', { 
    class: `form-field form-field--textarea ${disabled ? 'form-field--disabled' : ''} ${error ? 'form-field--error' : ''}`.trim()
  }, fieldElements);
}

/**
 * Enhanced Select Field Component
 * @param {object} options - Configuration options object
 */
export function selectField(options = {}) {
  // Modern props format: selectField({ label, value, options, onChange, ...props })
  const {
    label,
    value,
    options: optionsArray,
    onChange,
    placeholder = 'Select...',
    disabled = false,
    required = false,
    multiple = false,
    className = '',
    id = null,
    hint = '',
    error = '',
    size = 'normal', // 'small', 'normal', 'large'
    allowEmpty = true
  } = options;

  // Create select element using direct DOM approach
  const select = document.createElement('select');
  select.disabled = disabled;
  select.required = required;
  select.multiple = multiple;
  select.className = `form-select form-select--${size} ${className} ${error ? 'form-select--error' : ''}`.trim();
  
  // Add direct event listener using onchange property for maximum compatibility
  select.onchange = function(e) {
    if (!onChange) return;
    const selectedValue = multiple 
      ? Array.from(e.target.selectedOptions).map(opt => opt.value)
      : e.target.value;
    onChange(selectedValue);
  };

  if (id) select.id = id;

  // Add placeholder option if allowed
  if (allowEmpty && !multiple) {
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.disabled = !value;
    placeholderOption.textContent = placeholder;
    select.appendChild(placeholderOption);
  }

  // Add all options using direct DOM creation
  optionsArray.forEach(option => {
    const optionEl = document.createElement('option');
    optionEl.value = option.value;
    optionEl.textContent = option.label;
    optionEl.disabled = option.disabled || false;
    
    // Handle selection for both single and multiple select
    if (multiple) {
      if (Array.isArray(value) && value.includes(option.value)) {
        optionEl.selected = true;
      }
    } else {
      if (value === option.value) {
        optionEl.selected = true;
      }
    }

    select.appendChild(optionEl);
  });

  // Build field wrapper
  const fieldElements = [
    el('label', { 
      class: `form-label ${required ? 'form-label--required' : ''}`,
      for: id 
    }, label)
  ];

  const inputWrapper = el('div', { class: 'form-input-wrapper' }, [select]);
  
  // Add hint text if provided
  if (hint) {
    inputWrapper.appendChild(el('div', { class: 'form-hint' }, hint));
  }
  
  // Add error message if provided
  if (error) {
    inputWrapper.appendChild(el('div', { class: 'form-error' }, error));
  }

  fieldElements.push(inputWrapper);

  return el('div', { 
    class: `form-field form-field--select ${disabled ? 'form-field--disabled' : ''} ${error ? 'form-field--error' : ''}`.trim()
  }, fieldElements);
}

/**
 * Enhanced Number Input Field Component
 * @param {string} label - Field label text
 * @param {number} value - Current field value
 * @param {function} onChange - Change handler function
 * @param {object} options - Configuration options
 */
export function numberField(label, value, onChange, options = {}) {
  const {
    min = null,
    max = null,
    step = null,
    placeholder = '',
    disabled = false,
    required = false,
    className = '',
    id = null,
    hint = '',
    error = '',
    size = 'normal'
  } = options;

  const numberOptions = {
    type: 'number',
    placeholder,
    disabled,
    required,
    className,
    id,
    hint,
    error,
    size
  };

  // Use the input field but override the onChange to handle numbers
  const field = inputField(label, value, (val) => {
    const numValue = val === '' ? null : Number(val);
    onChange(numValue);
  }, numberOptions);

  // Add number-specific attributes to the input
  const input = field.querySelector('input');
  if (min !== null) input.min = min;
  if (max !== null) input.max = max;
  if (step !== null) input.step = step;

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
    error = ''
  } = options;

  const checkbox = el('input', {
    type: 'checkbox',
    checked: !!checked,
    disabled,
    required,
    id,
    class: `form-checkbox ${className}`.trim(),
    onchange: e => onChange(e.target.checked)
  });

  const labelEl = el('label', {
    class: `form-label form-label--checkbox ${required ? 'form-label--required' : ''}`,
    for: id
  }, [checkbox, el('span', {}, label)]);

  const fieldElements = [labelEl];

  if (hint) {
    fieldElements.push(el('div', { class: 'form-hint' }, hint));
  }

  if (error) {
    fieldElements.push(el('div', { class: 'form-error' }, error));
  }

  return el('div', { 
    class: `form-field form-field--checkbox ${disabled ? 'form-field--disabled' : ''} ${error ? 'form-field--error' : ''}`.trim()
  }, fieldElements);
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
  const {
    name = `radio-${Date.now()}`,
    disabled = false,
    required = false,
    className = '',
    hint = '',
    error = '',
    inline = false
  } = config;

  const radioOptions = options.map((option, index) => {
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
      onchange: e => onChange(e.target.value)
    });

    const radioLabel = el('label', {
      for: radioId,
      class: 'form-label form-label--radio'
    }, [radio, el('span', {}, option.label)]);

    return el('div', { class: 'form-radio-item' }, [radioLabel]);
  });

  const fieldElements = [
    el('div', { 
      class: `form-label ${required ? 'form-label--required' : ''}`
    }, label),
    el('div', { 
      class: `form-radio-group ${inline ? 'form-radio-group--inline' : ''}`
    }, radioOptions)
  ];

  if (hint) {
    fieldElements.push(el('div', { class: 'form-hint' }, hint));
  }

  if (error) {
    fieldElements.push(el('div', { class: 'form-error' }, error));
  }

  return el('div', { 
    class: `form-field form-field--radio ${disabled ? 'form-field--disabled' : ''} ${error ? 'form-field--error' : ''} ${className}`.trim()
  }, fieldElements);
}

// --- Utility Components ---

/**
 * Section Header Component
 * @param {string} text - Header text
 * @param {object} options - Configuration options
 */
export function sectionHeader(text, options = {}) {
  const {
    level = 3,
    className = '',
    id = null
  } = options;

  const headerProps = {
    class: `section-title section-title--h${level} ${className}`.trim()
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
  const {
    className = '',
    disabled = false
  } = options;

  const fieldset = el('fieldset', {
    class: `form-fieldset ${className} ${disabled ? 'form-fieldset--disabled' : ''}`.trim(),
    disabled
  }, [
    el('legend', { class: 'form-legend' }, legend),
    ...fields
  ]);

  return fieldset;
}
