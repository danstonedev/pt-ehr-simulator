/**
 * Mobile Drawer v2 (robust binding + overlay)
 * Works even if #chartNavigation is inserted after page load (route-driven).
 */
(function () {
  // Signal presence so other scripts can avoid duplicate listeners
  window.__MOBILE_DRAWER_V2 = true;
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const navParam = params.get('navsimple');
  const SIMPLE_MODE = navParam === '0' ? false : true;
  // If the user clicks before we finish binding, remember to open once ready
  let __PENDING_FIRST_OPEN__ = false;
  // In simple mode, we remove scroll deferrals entirely
  let __LAST_SCROLL_TS__ = 0;
  let __OPEN_RETRY_SCHEDULED__ = false;
  if (!SIMPLE_MODE) {
    try {
      window.addEventListener(
        'scroll',
        () => {
          __LAST_SCROLL_TS__ = Date.now();
        },
        { passive: true },
      );
    } catch {}
  }
  function ensureOverlay() {
    let overlay = document.getElementById('drawerOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'drawerOverlay';
      overlay.className = 'drawer-overlay';
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function getHamburgerBtn() {
    return (
      document.querySelector('.hamburger-btn') ||
      document.querySelector('[data-mobile="hamburger"]')
    );
  }

  function getChartDrawer() {
    return document.querySelector('.chart-navigation');
  }

  function hasDrawerAndHamburger() {
    return !!(getChartDrawer() && getHamburgerBtn());
  }

  function hook() {
    // If a dedicated site menu is present, do not hijack the hamburger for the chart drawer
    if (document.getElementById('siteMenu')) {
      return true; // nothing to bind here; site menu script will handle it
    }
    const hamburger = getHamburgerBtn();
    const drawer = getChartDrawer();
    if (!hamburger || !drawer) return false;

    const overlay = ensureOverlay();

    // Prefer core toggle if available to avoid double logic
    const useCore = typeof window.toggleMobileNav === 'function';

    function openDrawer() {
      if (!SIMPLE_MODE) {
        // If a smooth scroll just occurred (e.g., landing on a non-Subjective section),
        // defer the very first open slightly to avoid layout thrash
        const sinceScroll = Date.now() - __LAST_SCROLL_TS__;
        if (sinceScroll >= 0 && sinceScroll < 180) {
          if (!__OPEN_RETRY_SCHEDULED__) {
            __OPEN_RETRY_SCHEDULED__ = true;
            setTimeout(() => {
              __OPEN_RETRY_SCHEDULED__ = false;
              openDrawer();
            }, 160);
          }
          return;
        }
      }
      if (useCore) {
        const expanded = window.toggleMobileNav();
        hamburger.setAttribute('aria-expanded', String(!!expanded));
        overlay.classList.toggle('is-visible', !!expanded);
        document.body.classList.toggle('mobile-drawer-open', !!expanded);
        return;
      }
      // Normalize any legacy open state classes to the canonical mobile-open
      drawer.classList.remove('is-open');
      // Lock scroll before visual change to avoid content jump
      document.body.classList.add('mobile-drawer-open');
      // Then toggle drawer in
      drawer.classList.add('mobile-open');
      overlay.classList.add('is-visible');
      hamburger.setAttribute('aria-expanded', 'true');
      // Avoid scroll jank when focusing the newly opened drawer
      // Use preventScroll when supported; otherwise, skip focus
      try {
        if (typeof drawer.focus === 'function') {
          // Ensure focusability
          if (!drawer.hasAttribute('tabindex')) drawer.setAttribute('tabindex', '-1');
          drawer.focus({ preventScroll: true });
        }
      } catch {}
    }
    function closeDrawer() {
      if (useCore) {
        const expanded = window.toggleMobileNav(); // core toggles; calling again closes
        hamburger.setAttribute('aria-expanded', String(!!expanded));
        overlay.classList.remove('is-visible');
        document.body.classList.remove('mobile-drawer-open');
        return;
      }
      drawer.classList.remove('mobile-open');
      overlay.classList.remove('is-visible');
      document.body.classList.remove('mobile-drawer-open');
      hamburger.setAttribute('aria-expanded', 'false');
    }

    // Create a visible close button if absent
    let closeBtn = drawer.querySelector('.mobile-close');
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.className = 'btn small mobile-close';
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Close navigation');
      closeBtn.textContent = 'Close';
      drawer.prepend(closeBtn);
    }

    // Avoid duplicate listeners
    if (!hamburger._drawerBound) {
      hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen =
          drawer.classList.contains('is-open') ||
          document.body.classList.contains('mobile-drawer-open');
        if (isOpen) closeDrawer();
        else openDrawer();
      });
      hamburger._drawerBound = true;
    }
    if (!overlay._drawerBound) {
      overlay.addEventListener('click', closeDrawer);
      overlay._drawerBound = true;
    }
    if (!closeBtn._drawerBound) {
      closeBtn.addEventListener('click', closeDrawer);
      closeBtn._drawerBound = true;
    }

    // Close on ESC
    const escHandler = function (ev) {
      if (ev.key === 'Escape') closeDrawer();
    };
    if (!document._drawerEscBound) {
      document.addEventListener('keydown', escHandler);
      document._drawerEscBound = true;
    }

    // Re-close on route change
    if (!window._drawerHashBound) {
      window.addEventListener('hashchange', closeDrawer);
      window._drawerHashBound = true;
    }

    // If a click happened before we were ready, honor it now
    if (__PENDING_FIRST_OPEN__) {
      __PENDING_FIRST_OPEN__ = false;
      // Prefer core toggle if available; else open directly
      if (typeof window.toggleMobileNav === 'function') {
        const expanded = window.toggleMobileNav();
        hamburger.setAttribute('aria-expanded', String(!!expanded));
        overlay.classList.toggle('is-visible', !!expanded);
        document.body.classList.toggle('mobile-drawer-open', !!expanded);
      } else {
        openDrawer();
      }
    }

    return true;
  }

  // Try now, then on DOMContentLoaded, then observe for late insertion
  if (!hook()) {
    if (!SIMPLE_MODE) {
      // Prime first click so it isn’t lost before we bind
      try {
        const btn = getHamburgerBtn();
        if (btn && !btn._drawerPrimeBound) {
          btn.addEventListener(
            'click',
            (e) => {
              // If site menu exists, don’t intercept
              if (document.getElementById('siteMenu')) return;
              // If hook has not fully bound yet, defer the first open
              if (!btn._drawerBound) {
                e.preventDefault();
                __PENDING_FIRST_OPEN__ = true;
                // Try to bind immediately
                hook();
                // And schedule a microtask retry if still not ready
                setTimeout(() => {
                  if (__PENDING_FIRST_OPEN__ && hasDrawerAndHamburger()) hook();
                }, 0);
              }
            },
            { capture: true, once: true },
          );
          btn._drawerPrimeBound = true;
        }
      } catch {}
    }

    document.addEventListener('DOMContentLoaded', hook, { once: true });
    const mo = new MutationObserver(() => hook());
    mo.observe(document.documentElement, { childList: true, subtree: true });
    const stopOnReady = setInterval(() => {
      if (hasDrawerAndHamburger()) {
        if (hook()) {
          mo.disconnect();
          clearInterval(stopOnReady);
        }
      }
    }, 250);
    setTimeout(() => {
      mo.disconnect();
      clearInterval(stopOnReady);
    }, 15000);
  }
})();
