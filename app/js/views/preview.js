import { route } from '../core/router.js';
import { getCase } from '../core/store.js';
import { el, printPage } from '../ui/utils.js';

route('#/preview', async (app, qs) => {
  const caseId = qs.get('case');

  app.innerHTML = '';
  const loadingIndicator = el('div', { class: 'panel' }, 'Loading case preview...');
  app.append(loadingIndicator);

  let c;
  try {
    const caseWrapper = await getCase(caseId);
    if (!caseWrapper) {
      app.innerHTML = '';
      app.append(el('div', { class: 'panel' }, [el('h2', {}, 'Case not found')]));
      return;
    }
    c = caseWrapper.caseObj;
  } catch (error) {
    console.error('Failed to load case for preview:', error);
    app.innerHTML = '';
    app.append(
      el(
        'div',
        { class: 'panel error' },
        'Error loading case. Please check the console for details.',
      ),
    );
    return;
  }

  app.innerHTML = ''; // Clear loading indicator

  const p = el('div', { class: 'panel' }, [
    el('div', { class: 'flex-between no-print' }, [
      el('h2', {}, c.meta.title),
      el('button', { class: 'btn primary', onClick: printPage }, 'Export PDF (Print)'),
    ]),
    el(
      'div',
      { class: 'small' },
      `Setting: ${c.meta.setting} • Regions: ${c.meta.regions?.join(', ') || '—'}`,
    ),
    el('div', { class: 'hr' }),
    el('h3', {}, 'Snapshot'),
    el('p', {}, c.snapshot.teaser || '—'),
    el('h3', {}, 'Chief Concern'),
    el('p', {}, c.history.chief_complaint || '—'),
    el('h3', {}, 'HPI'),
    el('p', {}, c.history.hpi || '—'),
  ]);
  app.append(p);
});
