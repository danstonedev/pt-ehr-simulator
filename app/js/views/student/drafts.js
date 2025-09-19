import { route } from '../../core/router.js';
import { navigate as urlNavigate } from '../../core/url.js';
async function _listCases() {
  const { listCases } = await import('../../core/store.js');
  return listCases();
}
import { storage } from '../../core/index.js';
import { el } from '../../ui/utils.js';
import { createCasesMap, scanAndProcessDrafts, sortDrafts } from './DraftsUtils.js';

route('#/student/drafts', async (app) => {
  app.replaceChildren();

  const loadingIndicator = el('div', { class: 'panel' }, 'Loading drafts...');
  app.append(loadingIndicator);

  try {
    // Get all case data to match case IDs with titles
    const allCases = await _listCases();
    const casesMap = createCasesMap(allCases);

    // Scan storage for draft keys and process them
    const drafts = scanAndProcessDrafts(storage, casesMap);

    // Sort drafts by case title, then encounter
    sortDrafts(drafts);

    app.replaceChildren();

    const panel = el('div', { class: 'panel' }, [
      el('div', { class: 'flex-between' }, [
        el('div', {}, [
          el('h2', {}, 'My Draft Notes'),
          el(
            'div',
            { class: 'small' },
            `${drafts.length} saved draft${drafts.length !== 1 ? 's' : ''} found`,
          ),
        ]),
        el('div', {}, [
          el(
            'button',
            { class: 'btn', onClick: () => urlNavigate('/student/cases') },
            '← Back to Cases',
          ),
          ' ',
          el('button', { class: 'btn secondary', onClick: clearAllDrafts }, 'Clear All Drafts'),
        ]),
      ]),
    ]);

    if (drafts.length === 0) {
      panel.append(
        el('div', { class: 'empty-state' }, [
          el('h3', {}, 'No Draft Notes Found'),
          el(
            'p',
            {},
            'Start working on a case to create draft notes that will be saved automatically.',
          ),
          el(
            'button',
            { class: 'btn', onClick: () => urlNavigate('/student/cases') },
            'Browse Cases',
          ),
        ]),
      );
    } else {
      const draftsList = el('div', { class: 'drafts-list' });

      drafts.forEach((draft) => {
        const draftCard = el('div', { class: 'draft-card' }, [
          el('div', { class: 'draft-header' }, [
            el('h4', { class: 'draft-title' }, draft.caseTitle),
            el('span', { class: 'draft-encounter' }, draft.encounter.toUpperCase()),
          ]),
          el('div', { class: 'draft-info' }, [
            el('div', { class: 'draft-completion' }, [
              el('div', { class: 'completion-bar' }, [
                el('div', {
                  class: 'completion-fill',
                  style: `width: ${draft.completionPercent}%`,
                }),
              ]),
              el('span', { class: 'completion-text' }, `${draft.completionPercent}% complete`),
            ]),
            el('div', { class: 'draft-modified' }, `Last modified: ${draft.lastModified}`),
          ]),
          el('div', { class: 'draft-actions' }, [
            el(
              'button',
              {
                class: 'btn primary',
                onClick: () => {
                  urlNavigate('/student/editor', {
                    case: draft.caseId,
                    v: 0,
                    encounter: draft.encounter,
                  });
                },
              },
              'Continue Working',
            ),
            el(
              'button',
              {
                class: 'btn subtle-danger small',
                onClick: () => deleteDraft(draft.key, draft.caseTitle, draft.encounter),
              },
              'Delete',
            ),
          ]),
        ]);

        // Add status indicator
        if (!draft.hasContent) {
          draftCard.classList.add('empty-draft');
        } else if (draft.completionPercent >= 80) {
          draftCard.classList.add('near-complete');
        }

        draftsList.append(draftCard);
      });

      panel.append(draftsList);
    }

    app.append(panel);

    // Helper function to delete a specific draft
    function deleteDraft(key, caseTitle, encounter) {
      if (
        confirm(
          `Are you sure you want to delete the draft for "${caseTitle}" (${encounter.toUpperCase()})? This cannot be undone.`,
        )
      ) {
        storage.removeItem(key);
        // Reload the page to reflect changes
        urlNavigate('/student/drafts');
      }
    }

    // Helper function to clear all drafts
    function clearAllDrafts() {
      if (confirm('Are you sure you want to delete ALL your draft notes? This cannot be undone.')) {
        // Remove all draft keys
        const keysToRemove = storage.keys().filter((k) => k && k.startsWith('draft_'));
        keysToRemove.forEach((key) => storage.removeItem(key));
        // Reload the page to reflect changes
        urlNavigate('/student/drafts');
      }
    }
  } catch (error) {
    console.error('Failed to load drafts:', error);
    app.replaceChildren();
    app.append(
      el(
        'div',
        { class: 'panel error' },
        'Error loading drafts. Please check the console for details.',
      ),
    );
  }
});
