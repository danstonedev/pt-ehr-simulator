// Bootstrap module for SPA initialization
import { startRouter } from './app/js/core/router.js';
import * as store from './app/js/core/store.js';

// Optional: expose store for debugging
window.ptStore = store;

// Optional: restore last route
try {
  const last = localStorage.getItem('pt_emr_last_route');
  if (last) location.hash = last;
} catch {}

window.addEventListener('DOMContentLoaded', () => {
  startRouter();
});
