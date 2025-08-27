/**
 * Mobile drawer toggler for Chart Navigation
 * Drop this after your other scripts load (e.g., near the end of index.html)
 * Requires #hamburgerBtn and #chartNavigation to exist.
 */
(function () {
  const hamburger =
    document.querySelector('.hamburger-btn') || document.querySelector('[data-mobile="hamburger"]');
  const drawer = document.querySelector('.chart-navigation');
  if (!drawer || !hamburger) return;

  // If core already exposes a toggle, prefer it to avoid double logic
  if (typeof window.toggleMobileNav === 'function') {
    hamburger.addEventListener('click', (e) => {
      e.preventDefault();
      const expanded = window.toggleMobileNav();
      hamburger.setAttribute('aria-expanded', String(!!expanded));
    });
    return;
  }

  // Ensure there is a close button inside the drawer
  let closeBtn = drawer.querySelector('.mobile-close');
  if (!closeBtn) {
    closeBtn = document.createElement('button');
    closeBtn.className = 'btn small mobile-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close navigation');
    closeBtn.textContent = 'Close';
    drawer.prepend(closeBtn);
  }

  function openDrawer() {
    drawer.classList.add('is-open');
    document.body.classList.add('mobile-drawer-open');
    hamburger.setAttribute('aria-expanded', 'true');
    // focus management
    setTimeout(() => drawer.focus && drawer.focus(), 0);
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    document.body.classList.remove('mobile-drawer-open');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', (e) => {
    e.preventDefault();
    if (drawer.classList.contains('is-open')) closeDrawer();
    else openDrawer();
  });

  // Close on ESC
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });

  // Close when route changes (hashchange)
  window.addEventListener('hashchange', closeDrawer);
})();
