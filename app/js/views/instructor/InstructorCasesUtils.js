/**
 * Instructor Cases utility functions to reduce complexity
 * Extracted from instructor/cases.js to improve maintainability
 */

/**
 * Get form values from case creation form
 * @returns {Object} Form values
 */
function getFormValues() {
  return {
    title: document.getElementById('case-title').value.trim(),
    setting: document.getElementById('case-setting').value,
    age: parseInt(document.getElementById('case-age').value),
    gender: document.getElementById('case-gender').value,
    acuity: document.getElementById('case-acuity').value,
    dob: document.getElementById('case-dob')?.value || '',
  };
}

/**
 * Generate DOB from age if missing
 * @param {number} age - Age in years
 * @returns {string} Generated DOB in YYYY-MM-DD format
 */
function generateDobFromAge(age) {
  const today = new Date();
  const y = today.getFullYear() - age;
  const m = today.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const d = Math.min(today.getDate(), lastDay);
  const mm = String(m + 1).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/**
 * Process age and DOB fields together
 * @param {number} age - Age from form
 * @param {string} dob - DOB from form
 * @returns {Object} Processed age and DOB
 */
function processAgeAndDob(age, dob) {
  let finalAge = age;
  let finalDob = dob;

  // Compute age from DOB if age is missing
  if ((!finalAge || isNaN(finalAge)) && finalDob) {
    const computed = parseInt(computeAgeFromDob(finalDob));
    if (!isNaN(computed)) finalAge = computed;
  }

  // Generate DOB from age if DOB is missing
  if ((!finalDob || finalDob === '') && finalAge && !isNaN(finalAge)) {
    finalDob = generateDobFromAge(finalAge);
  }

  return { age: finalAge, dob: finalDob };
}

/**
 * Validate required form fields
 * @param {Object} data - Form data to validate
 * @returns {boolean} True if all required fields are present
 */
function validateRequiredFields({ title, setting, age, gender, acuity, dob }) {
  return !!(title && setting && (age || dob) && gender && acuity);
}

/**
 * Parse and validate form data for case creation
 * @returns {Object} Parsed form data or null if invalid
 */
export function parseAndValidateCaseForm() {
  const formValues = getFormValues();
  const { title, setting, age, gender, acuity, dob } = formValues;

  const processed = processAgeAndDob(age, dob);
  const finalData = { title, setting, ...processed, gender, acuity };

  if (!validateRequiredFields({ ...finalData, dob: processed.dob })) {
    return null;
  }

  return { ...finalData, dobFinal: processed.dob };
}

/**
 * Handle form submission UI feedback
 * @param {HTMLFormElement} form - Form element
 * @param {boolean} isSubmitting - Whether currently submitting
 */
export function handleFormSubmissionUI(form, isSubmitting) {
  const submitBtn = form.querySelector('button[type="submit"], .create-case-submit');
  if (!submitBtn) return { submitBtn: null };

  if (isSubmitting) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
  } else {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Case';
  }

  return { submitBtn };
}

/**
 * Get sort value from case object
 * @param {Object} caseObj - Case object
 * @param {string} column - Column to sort by
 * @returns {any} Sort value
 */
export function getSortValue(caseObj, column) {
  if (column === 'title') {
    return caseObj.title || caseObj.caseObj?.meta?.title || 'Untitled';
  }
  return caseObj.caseObj?.meta?.[column] || '';
}

/**
 * Compare two sort values
 * @param {any} aVal - First value
 * @param {any} bVal - Second value
 * @returns {number} Comparison result
 */
export function compareValues(aVal, bVal) {
  if (typeof aVal === 'string') {
    aVal = aVal.toLowerCase();
    bVal = bVal.toLowerCase();
  }

  if (aVal > bVal) return 1;
  if (aVal < bVal) return -1;
  return 0;
}

/**
 * Sort cases array by column and direction
 * @param {Array} cases - Array of cases to sort
 * @param {string} sortColumn - Column to sort by
 * @param {string} sortDirection - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted cases array
 */
export function sortCases(cases, sortColumn, sortDirection) {
  if (!sortColumn) return cases;

  return cases.sort((a, b) => {
    const aVal = getSortValue(a, sortColumn);
    const bVal = getSortValue(b, sortColumn);
    const comparison = compareValues(aVal, bVal);
    return sortDirection === 'desc' ? -comparison : comparison;
  });
}

/**
 * Create sortable header icon
 * @param {boolean} isActive - Whether this column is active
 * @param {boolean} isDesc - Whether sort is descending
 * @param {Function} spriteIcon - Icon creation function
 * @returns {Element} Icon element
 */
export function createSortIcon(isActive, isDesc, spriteIcon) {
  const icon = spriteIcon(isActive ? (isDesc ? 'sortDesc' : 'sortAsc') : 'sort', {
    className: 'icon sort-icon',
  });
  icon.style.opacity = isActive ? '0.9' : '0.5';
  return icon;
}

/**
 * Create header content container
 * @param {string} text - Header text
 * @param {Element} icon - Sort icon element
 * @returns {Element} Container element
 */
export function createHeaderContent(text, icon) {
  const container = document.createElement('div');
  container.style.cssText =
    'display: flex; align-items: center; justify-content: space-between; gap: 8px;';

  const textSpan = document.createElement('span');
  textSpan.style.fontWeight = '600';
  textSpan.textContent = text;

  container.appendChild(textSpan);
  container.appendChild(icon);
  return container;
}

/**
 * Handle sort column click
 * @param {string} column - Column being clicked
 * @param {string} currentSortColumn - Current sort column
 * @param {string} currentSortDirection - Current sort direction
 * @returns {Object} New sort state
 */
export function handleSortClick(column, currentSortColumn, currentSortDirection) {
  let sortColumn = column;
  let sortDirection = 'asc';

  if (currentSortColumn === column) {
    sortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
  }

  return { sortColumn, sortDirection };
}

// Helper function that may be used in the main file
function computeAgeFromDob(dob) {
  if (!dob) return 0;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
