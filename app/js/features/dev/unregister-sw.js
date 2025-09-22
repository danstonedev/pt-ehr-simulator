// Dev helper: unregister any active Service Workers on localhost to avoid
// navigation preload warnings and stale caches interfering with dev.
// This addresses: "The service worker navigation preload request was cancelled
// before 'preloadResponse' settled..." by ensuring no SW controls dev pages.

(() => {
  try {
    if (!('serviceWorker' in navigator)) return;
    const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const wantsUnregister =
      /(?:^|[?&])unsw=1(?:&|$)/.test(location.search || '') ||
      /(?:^|[?&])unsw=1(?:&|$)/.test((location.hash || '').split('?')[1] || '');
    if (!(isLocalhost || wantsUnregister)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then(async (regs) => {
        await Promise.all(
          regs.map(async (reg) => {
            try {
              if (reg.navigationPreload && typeof reg.navigationPreload.disable === 'function') {
                await reg.navigationPreload.disable();
              }
            } catch {}
            try {
              await reg.unregister();
            } catch {}
          }),
        );
        // Clear caches created by prior SWs to reduce interference
        if (window.caches && typeof caches.keys === 'function') {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          } catch {}
        }
        // Reload when controller changes to ensure a clean, uncontrolled page
        try {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              window.location.reload();
            });
          }
        } catch {}
      })
      .catch(() => {});
  } catch {}
})();
