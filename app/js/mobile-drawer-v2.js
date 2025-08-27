/**
 * Mobile Drawer v2 (robust binding + overlay)
 * Works even if #chartNavigation is inserted after page load (route-driven).
 */
(function () {
  // Signal presence so other scripts can avoid duplicate listeners
  window.__MOBILE_DRAWER_V2 = true;
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
      if (useCore) {
        const expanded = window.toggleMobileNav();
        hamburger.setAttribute('aria-expanded', String(!!expanded));
        overlay.classList.toggle('is-visible', !!expanded);
        document.body.classList.toggle('mobile-drawer-open', !!expanded);
        return;
      }
      drawer.classList.add('is-open');
      overlay.classList.add('is-visible');
      document.body.classList.add('mobile-drawer-open');
      hamburger.setAttribute('aria-expanded', 'true');
      setTimeout(() => drawer.focus && drawer.focus(), 0);
    }
    function closeDrawer() {
      if (useCore) {
        const expanded = window.toggleMobileNav(); // core toggles; calling again closes
        hamburger.setAttribute('aria-expanded', String(!!expanded));
        overlay.classList.remove('is-visible');
        document.body.classList.remove('mobile-drawer-open');
        return;
      }
      drawer.classList.remove('is-open');
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

    return true;
  }

  // Try now, then on DOMContentLoaded, then observe for late insertion
  if (!hook()) {
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
