import { route, navigate } from '../../core/router.js';
import { listCases } from '../../core/store.js';
import { el } from '../../ui/utils.js';

route('#/student/drafts', async (app, qs) => {
  app.innerHTML = '';
  
  const loadingIndicator = el('div', {class: 'panel'}, 'Loading drafts...');
  app.append(loadingIndicator);

  try {
    // Get all case data to match case IDs with titles
    const allCases = await listCases();

    const casesMap = {};
    allCases.forEach(caseWrapper => {
      casesMap[caseWrapper.id] = caseWrapper.title;
    });


    // Scan localStorage for draft keys
    const drafts = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('draft_')) {
        try {
          const draftData = JSON.parse(localStorage.getItem(key));
          // More robust parsing: handle case IDs that contain underscores
          const parts = key.split('_');
          if (parts.length < 3) continue; // Invalid key format
          
          // For keys like "draft_case_dbbcd14f_eval", we need to reconstruct the case ID
          // The case ID starts after "draft_" and ends before the last "_encounter"
          const draftPrefix = 'draft_';
          const keyWithoutPrefix = key.substring(draftPrefix.length);
          const lastUnderscoreIndex = keyWithoutPrefix.lastIndexOf('_');
          
          if (lastUnderscoreIndex === -1) continue; // No encounter part found
          
          const caseId = keyWithoutPrefix.substring(0, lastUnderscoreIndex);
          const encounter = keyWithoutPrefix.substring(lastUnderscoreIndex + 1);
          

          
          // Calculate completion percentage
          const sections = ['subjective', 'assessment', 'goals', 'plan', 'billing'];
          const objectiveSections = draftData.objective ? 
            [draftData.objective.text || ''].filter(Boolean).length : 0;
          const completedSections = sections.filter(section => 
            draftData[section] && draftData[section].trim().length > 0
          ).length + (objectiveSections > 0 ? 1 : 0);
          const totalSections = sections.length + 1; // +1 for objective
          const completionPercent = Math.round((completedSections / totalSections) * 100);
          
          // Get last modified time (approximate)
          const lastModified = new Date().toLocaleDateString(); // Could enhance with actual timestamp
          
          drafts.push({
            key,
            caseId,
            encounter,
            caseTitle: casesMap[caseId] || `Case ${caseId}`,
            data: draftData,
            completionPercent,
            lastModified,
            hasContent: completedSections > 0
          });
        } catch (error) {
          console.warn('Could not parse draft:', key, error);
        }
      }
    }

    // Sort drafts by case title, then encounter
    drafts.sort((a, b) => {
      const titleCompare = a.caseTitle.localeCompare(b.caseTitle);
      if (titleCompare !== 0) return titleCompare;
      return a.encounter.localeCompare(b.encounter);
    });

    app.innerHTML = '';

    const panel = el('div', {class: 'panel'}, [
      el('div', {class: 'flex-between'}, [
        el('div', {}, [
          el('h2', {}, 'My Draft Notes'),
          el('div', {class: 'small'}, `${drafts.length} saved draft${drafts.length !== 1 ? 's' : ''} found`)
        ]),
        el('div', {}, [
          el('button', {class: 'btn', onClick: () => navigate('#/student/cases')}, '← Back to Cases'),
          ' ',
          el('button', {class: 'btn secondary', onClick: clearAllDrafts}, 'Clear All Drafts')
        ])
      ])
    ]);

    if (drafts.length === 0) {
      panel.append(
        el('div', {class: 'empty-state'}, [
          el('h3', {}, 'No Draft Notes Found'),
          el('p', {}, 'Start working on a case to create draft notes that will be saved automatically.'),
          el('button', {class: 'btn', onClick: () => navigate('#/student/cases')}, 'Browse Cases')
        ])
      );
    } else {
      const draftsList = el('div', {class: 'drafts-list'});
      
      drafts.forEach(draft => {
        const draftCard = el('div', {class: 'draft-card'}, [
          el('div', {class: 'draft-header'}, [
            el('h4', {class: 'draft-title'}, draft.caseTitle),
            el('span', {class: 'draft-encounter'}, draft.encounter.toUpperCase())
          ]),
          el('div', {class: 'draft-info'}, [
            el('div', {class: 'draft-completion'}, [
              el('div', {class: 'completion-bar'}, [
                el('div', {
                  class: 'completion-fill',
                  style: `width: ${draft.completionPercent}%`
                })
              ]),
              el('span', {class: 'completion-text'}, `${draft.completionPercent}% complete`)
            ]),
            el('div', {class: 'draft-modified'}, `Last modified: ${draft.lastModified}`)
          ]),
          el('div', {class: 'draft-actions'}, [
            el('button', {
              class: 'btn primary',
              onClick: () => {

                navigate(`#/student/editor?case=${draft.caseId}&v=0&encounter=${draft.encounter}`);
              }
            }, 'Continue Working'),
            el('button', {
              class: 'btn subtle-danger small',
              onClick: () => deleteDraft(draft.key, draft.caseTitle, draft.encounter)
            }, 'Delete')
          ])
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
      if (confirm(`Are you sure you want to delete the draft for "${caseTitle}" (${encounter.toUpperCase()})? This cannot be undone.`)) {
        localStorage.removeItem(key);
        // Reload the page to reflect changes
        navigate('#/student/drafts');
      }
    }

    // Helper function to clear all drafts
    function clearAllDrafts() {
      if (confirm('Are you sure you want to delete ALL your draft notes? This cannot be undone.')) {
        // Remove all draft keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('draft_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        // Reload the page to reflect changes
        navigate('#/student/drafts');
      }
    }

  } catch (error) {
    console.error('Failed to load drafts:', error);
    app.innerHTML = '';
    app.append(el('div', {class: 'panel error'}, 'Error loading drafts. Please check the console for details.'));
  }
});
