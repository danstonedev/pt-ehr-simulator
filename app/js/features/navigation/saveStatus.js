// saveStatus.js - extracted from ChartNavigation.js
// Provides updateSaveStatus to reflect autosave state in sidebar.

export function updateSaveStatus(sidebar, status) {
  if (!sidebar) return;
  const statusDot = sidebar.querySelector('.status-dot');
  const statusText = sidebar.querySelector('.autosave-status span:last-child');
  if (!(statusDot && statusText)) return;
  switch (status) {
    case 'saving':
      statusDot.style.background = 'var(--warn)';
      statusText.textContent = 'Saving...';
      break;
    case 'saved':
      statusDot.style.background = 'var(--success)';
      statusText.textContent = 'Saved';
      break;
    case 'error':
      statusDot.style.background = 'var(--danger)';
      statusText.textContent = 'Save failed';
      break;
  }
}
