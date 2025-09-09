// NavigationHeader.js - Case Editor Navigation & Action Controls
// Handles tabs, action buttons, mode switching, and case metadata display

// (imports removed: navigate, exportToWord, createCase were unused)
import { el } from '../../ui/utils.js';

/**
 * Creates a sticky top bar for case editing
 * @param {Object} config - Configuration object
 * @returns {HTMLElement} Sticky top bar element
 */
export function createStickyTopBar(config) {
  const {
    activeSection = 'subjective',
    onPreview = () => {},
    onExitPreview = () => {},
    isFacultyMode = false,
    isPreviewMode = false,
  } = config;

  // Section title mapping
  const sectionTitles = {
    subjective: 'Subjective Assessment',
    objective: 'Objective Examination',
    assessment: 'Assessment',
    plan: 'Plan',
    billing: 'Billing & Coding',
  };

  const topBar = el('div', {
    class: 'sticky-top-bar',
  });

  // Left side: Active Section Title
  const leftSection = el(
    'div',
    {
      class: 'left-section',
    },
    [
      el(
        'h2',
        {
          class: 'active-section-title',
        },
        sectionTitles[activeSection] || activeSection,
      ),
    ],
  );

  // Right side: Actions (Preview in faculty OR Back to Faculty in student-preview)
  const rightSection = el(
    'div',
    {
      class: 'right-section',
    },
    [
      // Save status pill (always present)
      el(
        'div',
        {
          class: 'save-status-pill',
          'aria-live': 'polite',
          title: 'Autosaved in this browser. Not synced to a server.',
        },
        [el('span', { class: 'dot saved' }), el('span', { class: 'text' }, 'Autosaved locally')],
      ),
      // Preview as Student button (for faculty only)
      ...(isFacultyMode
        ? [
            el(
              'button',
              {
                class: 'btn secondary',
                onclick: onPreview,
              },
              'Preview as Student',
            ),
          ]
        : []),
      // Back to Faculty Editor button (only when viewing student preview)
      ...(!isFacultyMode && isPreviewMode
        ? [
            el(
              'button',
              {
                class: 'btn secondary',
                onclick: onExitPreview,
              },
              'Back to Faculty Editor',
            ),
          ]
        : []),
    ],
  );

  // Constrain inner content width and keep semantics stable
  const inner = el('div', { class: 'bar-inner' }, [leftSection, rightSection]);
  topBar.append(inner);
  return topBar;
}

/**
 * Updates the save status pill in the sticky top bar
 * @param {HTMLElement} topBar - The top bar element
 * @param {'saving'|'saved'|'error'} status
 */
export function updateHeaderSaveStatus(topBar, status) {
  if (!topBar) return;
  const pill = topBar.querySelector('.save-status-pill');
  if (!pill) return;
  const dot = pill.querySelector('.dot');
  const text = pill.querySelector('.text');
  if (!dot || !text) return;
  dot.classList.remove('saved', 'saving', 'error');
  switch (status) {
    case 'saving':
      dot.classList.add('saving');
      text.textContent = 'Saving locally...';
      break;
    case 'error':
      dot.classList.add('error');
      text.textContent = 'Save failed';
      break;
    default:
      dot.classList.add('saved');
      text.textContent = 'Autosaved locally';
  }
}

/**
 * Updates the active section title in the sticky top bar
 * @param {HTMLElement} topBar - The top bar element
 * @param {string} activeSection - The new active section
 */
export function updateActiveSectionTitle(topBar, activeSection) {
  const sectionTitles = {
    subjective: 'Subjective Assessment',
    objective: 'Objective Examination',
    assessment: 'Assessment',
    plan: 'Plan',
    billing: 'Billing & Coding',
  };

  const titleElement = topBar.querySelector('.active-section-title');
  if (titleElement) {
    titleElement.textContent = sectionTitles[activeSection] || activeSection;
  }
}

/**
 * Creates tab navigation system
 * @param {Array} tabs - Array of tab objects {id, label, active}
 * @param {Function} switchTo - Tab switching function
 * @returns {HTMLElement} Tab navigation element
 */
export function createTabNavigation(tabs, switchTo) {
  const tabsContainer = el('div', { class: 'tabs' });

  tabs.forEach((tab) => {
    const tabButton = el(
      'button',
      {
        class: `tab ${tab.active ? 'active' : ''}`,
        onClick: () => switchTo(tab.id),
      },
      tab.label,
    );

    tabsContainer.append(tabButton);
  });

  return tabsContainer;
}

/**
 * Creates simple section tabs for case editor
 * @param {string} activeSection - Currently active section
 * @param {Function} switchTo - Tab switching function
 * @returns {HTMLElement} Simple tabs element
 */
export function createSimpleTabs(activeSection, switchTo) {
  const sections = [
    { id: 'subjective', label: 'Subjective' },
    { id: 'objective', label: 'Objective' },
    { id: 'assessment', label: 'Assessment' },
    { id: 'goals', label: 'Goals' },
    { id: 'plan', label: 'Plan' },
    { id: 'billing', label: 'Billing' },
  ];

  const tabs = sections.map((section) => ({
    ...section,
    active: section.id === activeSection,
  }));

  return createTabNavigation(tabs, switchTo);
}

/**
 * Creates mode indicator badge
 * @param {boolean} isFacultyMode - Whether in faculty mode
 * @param {boolean} isKeyMode - Whether in key mode
 * @returns {HTMLElement|null} Mode indicator or null
 */
export function createModeIndicator(isFacultyMode, isKeyMode) {
  if (isKeyMode) {
    return el(
      'span',
      {
        class: 'badge',
        style: 'background: var(--warning); color: var(--text); margin-left: 8px;',
      },
      'KEY VIEW',
    );
  } else if (isFacultyMode) {
    return el(
      'span',
      {
        class: 'badge',
        style: 'background: var(--und-green); color: #fff; margin-left: 8px;',
      },
      'FACULTY',
    );
  }
  return null;
}

/**
 * Creates case metadata display
 * @param {Object} caseObj - Case object
 * @param {string} encounter - Encounter type
 * @returns {HTMLElement} Metadata display element
 */
export function createCaseMetadata(caseObj, encounter) {
  const metadata = el('div', { class: 'case-metadata' }, [
    el('div', { class: 'metadata-item' }, [
      el('strong', {}, 'Setting: '),
      el('span', {}, caseObj.meta.setting),
    ]),
    el('div', { class: 'metadata-item' }, [
      el('strong', {}, 'Encounter: '),
      el('span', {}, encounter.toUpperCase()),
    ]),
  ]);

  if (caseObj.meta.regions && caseObj.meta.regions.length > 0) {
    metadata.append(
      el('div', { class: 'metadata-item' }, [
        el('strong', {}, 'Regions: '),
        el('span', {}, caseObj.meta.regions.join(', ')),
      ]),
    );
  }

  return metadata;
}

/**
 * Global print function for print button
 */
window.printPage = function () {
  window.print();
};
