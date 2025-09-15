// Section rendering utilities for Case Editor
import { el } from '../ui/utils.js';
import {
  createSubjectiveSection,
  createObjectiveSection,
  createAssessmentSection,
  createPlanSection,
  createBillingSection,
} from '../features/soap/index.js';

/**
 * Creates a section wrapper with header and content
 * @param {string} sectionId - Section ID
 * @param {string} title - Section title
 * @param {HTMLElement} content - Section content element
 * @param {string} cssClass - CSS class for the content
 * @returns {Object} Section wrapper elements
 */
function createSectionWrapper(sectionId, title, content, cssClass) {
  const header = el('div', { id: `section-${sectionId}`, class: 'editor-section-divider' }, [
    el('h3', { class: 'section-title' }, title),
  ]);

  const wrapper = el('div', { class: 'editor-section', id: `wrap-${sectionId}` }, [header]);

  if (cssClass) {
    content.classList.add(cssClass);
  }

  wrapper.append(content);

  return { header, wrapper };
}

/**
 * Creates the subjective section with wrapper
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Object} Section elements
 */
function createSubjectiveSectionWithWrapper(draft, save) {
  const content = createSubjectiveSection(draft.subjective, (data) => {
    draft.subjective = data;
    save();
    if (window.refreshChartProgress) window.refreshChartProgress();
  });

  return createSectionWrapper('subjective', 'Subjective', content, 'subjective-section');
}

/**
 * Creates the objective section with wrapper
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Object} Section elements
 */
function createObjectiveSectionWithWrapper(draft, save) {
  const content = createObjectiveSection(draft.objective, (data) => {
    draft.objective = data;
    save();
    if (window.refreshChartProgress) window.refreshChartProgress();
  });

  return createSectionWrapper('objective', 'Objective', content, 'objective-section');
}

/**
 * Creates the assessment section with wrapper
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Object} Section elements
 */
function createAssessmentSectionWithWrapper(draft, save) {
  const content = createAssessmentSection(draft.assessment, (data) => {
    draft.assessment = data;
    save();
    if (window.refreshChartProgress) window.refreshChartProgress();
  });

  return createSectionWrapper('assessment', 'Assessment', content, 'assessment-section');
}

/**
 * Creates the plan section with wrapper
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Object} Section elements
 */
function createPlanSectionWithWrapper(draft, save) {
  const content = createPlanSection(draft.plan, (data) => {
    draft.plan = data;
    save();
    if (window.refreshChartProgress) window.refreshChartProgress();
  });

  return createSectionWrapper('plan', 'Plan', content, 'plan-section');
}

/**
 * Creates the billing section with wrapper
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Object} Section elements
 */
function createBillingSectionWithWrapper(draft, save) {
  const content = createBillingSection(draft.billing, (data) => {
    draft.billing = data;
    save();
    if (window.refreshChartProgress) window.refreshChartProgress();
  });

  return createSectionWrapper('billing', 'Billing', content, 'billing-section');
}

/**
 * Renders all sections into the content root
 * @param {HTMLElement} contentRoot - Content container
 * @param {Object} draft - Draft data
 * @param {Function} save - Save function
 * @returns {Object} Section roots and headers for reference
 */
export function renderAllSections(contentRoot, draft, save) {
  contentRoot.replaceChildren();

  const sectionRoots = {};
  const sectionHeaders = {};

  // Create all sections
  const sections = [
    { id: 'subjective', creator: createSubjectiveSectionWithWrapper },
    { id: 'objective', creator: createObjectiveSectionWithWrapper },
    { id: 'assessment', creator: createAssessmentSectionWithWrapper },
    { id: 'plan', creator: createPlanSectionWithWrapper },
    { id: 'billing', creator: createBillingSectionWithWrapper },
  ];

  for (const section of sections) {
    const { header, wrapper } = section.creator(draft, save);
    sectionHeaders[section.id] = header;
    sectionRoots[section.id] = wrapper;
    contentRoot.append(wrapper);
  }

  return { sectionRoots, sectionHeaders };
}

/**
 * Gets section root by ID
 * @param {Object} sectionRoots - Section roots object
 * @param {string} id - Section ID
 * @returns {HTMLElement|null} Section root element
 */
export function getSectionRoot(sectionRoots, id) {
  return sectionRoots[id] || null;
}

/**
 * Gets section header by ID
 * @param {Object} sectionHeaders - Section headers object
 * @param {string} id - Section ID
 * @returns {HTMLElement|null} Section header element
 */
export function getSectionHeader(sectionHeaders, id) {
  return sectionHeaders[id] || null;
}
