import { el } from './utils.js';

// Renders a tab bar into the given container.
// tabs: array of {id, label}
// activeTab: current active tab id
// onChange: function(tabId) called when a tab is clicked
export function renderTabs(container, tabs, activeTab, onChange) {
  container.replaceChildren();
  tabs.forEach((tab) => {
    const tabEl = el(
      'div',
      {
        class: `tab ${activeTab === tab.id ? 'active' : ''}`,
        onClick: () => onChange(tab.id),
      },
      tab.label,
    );
    container.appendChild(tabEl);
  });
}
