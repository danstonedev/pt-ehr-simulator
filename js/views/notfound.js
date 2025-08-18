
import { route } from '../core/router.js';
import { el } from '../ui/utils.js';
route('#/404', (app) => {
  app.append(el('div', { class: 'panel' }, [
    el('h2', {}, 'Not Found')
  ]));
});
