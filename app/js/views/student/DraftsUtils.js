/**
 * Utilities for handling student drafts functionality
 */

/**
 * Create a map of case IDs to titles
 * @param {Array} allCases - Array of case objects
 * @returns {Object} Map of case ID to title
 */
export function createCasesMap(allCases) {
  const casesMap = {};
  allCases.forEach((caseWrapper) => {
    casesMap[caseWrapper.id] = caseWrapper.title;
  });
  return casesMap;
}

/**
 * Parse a draft key to extract case ID and encounter
 * @param {string} key - Draft key in format 'draft_caseId_encounter'
 * @returns {Object|null} Parsed key data or null if invalid
 */
export function parseDraftKey(key) {
  const parts = key.split('_');
  if (parts.length < 3) return null; // Invalid key format

  // For keys like "draft_case_dbbcd14f_eval", we need to reconstruct the case ID
  // The case ID starts after "draft_" and ends before the last "_encounter"
  const draftPrefix = 'draft_';
  const keyWithoutPrefix = key.substring(draftPrefix.length);
  const lastUnderscoreIndex = keyWithoutPrefix.lastIndexOf('_');

  if (lastUnderscoreIndex === -1) return null; // No encounter part found

  const caseId = keyWithoutPrefix.substring(0, lastUnderscoreIndex);
  const encounter = keyWithoutPrefix.substring(lastUnderscoreIndex + 1);

  return { caseId, encounter };
}

/**
 * Calculate completion percentage for a draft
 * @param {Object} draftData - Draft data object
 * @returns {number} Completion percentage (0-100)
 */
export function calculateCompletionPercent(draftData) {
  const sections = ['subjective', 'assessment', 'goals', 'plan', 'billing'];
  const objectiveSections = draftData.objective
    ? [draftData.objective.text || ''].filter(Boolean).length
    : 0;
  const completedSections =
    sections.filter((section) => draftData[section] && draftData[section].trim().length > 0)
      .length + (objectiveSections > 0 ? 1 : 0);
  const totalSections = sections.length + 1; // +1 for objective
  return Math.round((completedSections / totalSections) * 100);
}

/**
 * Process a single draft entry
 * @param {string} key - Storage key
 * @param {Object} draftData - Parsed draft data
 * @param {Object} casesMap - Map of case IDs to titles
 * @returns {Object} Processed draft object
 */
export function processDraftEntry(key, draftData, casesMap) {
  const keyData = parseDraftKey(key);
  if (!keyData) return null;

  const { caseId, encounter } = keyData;
  const completionPercent = calculateCompletionPercent(draftData);

  // Get last modified time (approximate)
  const lastModified = new Date().toLocaleDateString(); // Could enhance with actual timestamp

  const completedSections = getCompletedSectionsCount(draftData);

  return {
    key,
    caseId,
    encounter,
    caseTitle: casesMap[caseId] || `Case ${caseId}`,
    data: draftData,
    completionPercent,
    lastModified,
    hasContent: completedSections > 0,
  };
}

/**
 * Get count of completed sections in a draft
 * @param {Object} draftData - Draft data object
 * @returns {number} Number of completed sections
 */
function getCompletedSectionsCount(draftData) {
  const sections = ['subjective', 'assessment', 'goals', 'plan', 'billing'];
  const objectiveSections = draftData.objective
    ? [draftData.objective.text || ''].filter(Boolean).length
    : 0;
  return (
    sections.filter((section) => draftData[section] && draftData[section].trim().length > 0)
      .length + (objectiveSections > 0 ? 1 : 0)
  );
}

/**
 * Scan storage for draft keys and process them
 * @param {Object} storage - Storage adapter
 * @param {Object} casesMap - Map of case IDs to titles
 * @returns {Array} Array of processed draft objects
 */
export function scanAndProcessDrafts(storage, casesMap) {
  const drafts = [];
  const keys = storage.keys();

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key && key.startsWith('draft_')) {
      try {
        const draftData = JSON.parse(storage.getItem(key));
        const processedDraft = processDraftEntry(key, draftData, casesMap);
        if (processedDraft) {
          drafts.push(processedDraft);
        }
      } catch (error) {
        console.warn('Could not parse draft:', key, error);
      }
    }
  }

  return drafts;
}

/**
 * Sort drafts by case title, then encounter
 * @param {Array} drafts - Array of draft objects
 * @returns {Array} Sorted draft array
 */
export function sortDrafts(drafts) {
  return drafts.sort((a, b) => {
    const titleCompare = a.caseTitle.localeCompare(b.caseTitle);
    if (titleCompare !== 0) return titleCompare;
    return a.encounter.localeCompare(b.encounter);
  });
}
