# Modern Web Style Guide – Checklist & Snippets (HTML, CSS, Vanilla JS)

> Use this as the **source of truth** for Copilot/LLM output in this repo. Any generated code or PR must satisfy the checklist and prefer the snippets below.

---

## ✅ PR Checklist (Paste into every PR description)

**Standards**

- [ ] HTML5 semantics used (`header/nav/main/section/article/aside/footer/form`).
- [ ] One `<h1>` per page; `<html lang="en">`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- [ ] No inline styles or inline event handlers.
- [ ] Buttons have explicit `type` and real controls are used for interaction (no clickable divs).
- [ ] Images/SVGs have meaningful `alt` (or `alt=""` if decorative); SVGs have `<title>` where needed.
- [ ] Keyboard and screen-reader accessible: focus order, `:focus-visible` styles, skip link to `#main`.
- [ ] Color is not the only carrier of meaning (text/icon/aria provided).

**CSS**

- [ ] Mobile‑first layout; Flex/Grid for structure; no absolute positioning for primary layout.
- [ ] Typography in `rem`; responsive with `clamp()` where appropriate.
- [ ] BEM-ish classes and utilities; selector depth ≤ 3; no ID selectors; no `!important`.
- [ ] Uses CSS custom properties for theme tokens (spacing, colors, radius, z-index).
- [ ] Respects user prefs: `prefers-reduced-motion`; `color-scheme` safe.

**JavaScript**

- [ ] ES modules (`type="module"`); `const/let`, strict equality; no global mutation.
- [ ] No `innerHTML` with unsanitized input; prefer `textContent` or sanitized templates.
- [ ] Event handling with `addEventListener`; delegation where sensible.
- [ ] DOM access guarded (DOMContentLoaded or scripts at end of body).
- [ ] Async with `AbortController` for cleanup; errors surface to an `aria-live` region.
- [ ] Only required state persisted; localStorage parsing guarded with try/catch.

**Performance & Assets**

- [ ] Critical CSS and fonts optimized (preload where justified).
- [ ] Images optimized (SVG preferred; appropriate `width/height` attributes to prevent CLS).
- [ ] Third-party deps avoided unless essential.

**Testing & Docs**

- [ ] Accessibility pass (manual + automated) performed; notable issues documented.
- [ ] Lint/format clean (ESLint + Prettier); small focused diffs with rationale.
- [ ] Screenshots/GIFs for UI changes; before/after where relevant.

---

## Reusable Snippets

### 1) Base Document & Skip Link

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>App</title>
    <link rel="stylesheet" href="./styles/app.css" />
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to main content</a>
    <header class="site-header" role="banner">…</header>
    <nav class="site-nav" aria-label="Primary">…</nav>
    <main id="main" tabindex="-1">…</main>
    <footer class="site-footer">…</footer>
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

```css
/* app.css */
.skip-link {
  position: absolute;
  left: -999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.skip-link:focus {
  left: 1rem;
  top: 1rem;
  width: auto;
  height: auto;
  padding: 0.5rem 1rem;
}
```

---

### 2) Tokens, Fluid Type, and Focus

```css
:root {
  --brand: #00583f;
  --ink: #111;
  --bg: #fff;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 1rem;
  --radius-2: 0.5rem;
}
html {
  color-scheme: light dark;
}
body {
  font:
    1rem/1.5 system-ui,
    sans-serif;
  color: var(--ink);
  background: var(--bg);
  margin: 0;
}
h1 {
  font-size: clamp(1.5rem, 2.5vw, 2.25rem);
}
:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

### 3) Responsive Header with Accessible Menu

```html
<header class="header">
  <a class="brand" href="/">PT EMR Sim</a>
  <button
    class="menu-btn"
    type="button"
    aria-label="Open menu"
    aria-expanded="false"
    aria-controls="primary-nav"
    data-menu-toggle
  >
    <!-- SVG icon -->
  </button>
  <nav id="primary-nav" class="nav" data-menu hidden>
    <ul class="nav__list">
      <li><a href="#cases">Cases</a></li>
      <li><a href="#editor">Editor</a></li>
      <li><a href="#help">Help</a></li>
    </ul>
  </nav>
</header>

<script type="module">
  import { initMenu } from './features/menu/index.js';
  window.addEventListener('DOMContentLoaded', () => initMenu());
</script>
```

```css
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
}
.nav[hidden] {
  display: none !important;
}
@media (min-width: 48rem) {
  .menu-btn {
    display: none;
  }
  .nav[hidden] {
    display: block !important;
  }
  .nav__list {
    display: flex;
    gap: var(--space-3);
  }
}
```

```js
// features/menu/index.js
export function initMenu(root = document) {
  const btn = root.querySelector('[data-menu-toggle]');
  const nav = root.querySelector('[data-menu]');
  if (!btn || !nav) return;
  const ctrl = new AbortController();
  btn.addEventListener(
    'click',
    () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      nav.hidden = expanded;
    },
    { signal: ctrl.signal },
  );
  return () => ctrl.abort();
}
```

---

### 4) Accessible Form + Inline Validation

```html
<form id="patient-form" novalidate>
  <fieldset>
    <legend>Patient Info</legend>
    <div class="field">
      <label for="age">Age</label>
      <input id="age" name="age" type="number" required min="0" step="1" inputmode="numeric" />
      <p id="age-error" class="field__error" role="status" aria-live="polite"></p>
    </div>
  </fieldset>
  <button type="submit" class="btn">Save</button>
</form>
```

```js
// utils/validate.js
export function validate(form) {
  let ok = true;
  const age = form.querySelector('#age');
  const err = form.querySelector('#age-error');
  err.textContent = '';
  if (!age.value || Number(age.value) < 0) {
    err.textContent = 'Enter a valid non-negative age.';
    ok = false;
  }
  return ok;
}
document.getElementById('patient-form').addEventListener('submit', (e) => {
  if (!validate(e.currentTarget)) e.preventDefault();
});
```

---

### 5) Safe DOM building (no innerHTML)

- Prefer creating elements with `ui/utils.el()` and setting `textContent` for user data.
- If you must render markup, build it node-by-node instead of injecting HTML.

```js
// Using el() and textContent
import { el } from '../../app/js/ui/utils.js';
export function renderCaseItem(caseData) {
  return el('li', { class: 'case' }, [
    el('h3', { class: 'case__title' }, caseData.title),
    el('p', { class: 'case__meta' }, `#${caseData.id}`),
  ]);
}
```

---

### 6) Fetch with AbortController & Error Surface

```js
// utils/request.js
export async function getJSON(url, { signal } = {}) {
  const ctrl = new AbortController();
  const combined = signal ? new AbortController() : ctrl;
  if (signal) signal.addEventListener('abort', () => combined.abort());
  const res = await fetch(url, {
    signal: (signal || ctrl).signal,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

```html
<div id="messages" aria-live="polite" role="status"></div>
<script type="module">
  import { getJSON } from './utils/request.js';
  const messages = document.getElementById('messages');
  getJSON('./data/cases.json')
    .then((data) => {
      messages.textContent = `Loaded ${data.length} cases.`;
    })
    .catch((err) => {
      messages.textContent = 'Could not load cases. Please try again.';
    });
</script>
```

---

### 7) localStorage Wrapper (Defensive)

```js
// utils/store.js
const KEY = 'pt-emr-sim:v1';
export const store = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  },
  set(obj) {
    try {
      localStorage.setItem(KEY, JSON.stringify(obj));
    } catch {
      /* ignore quota errors */
    }
  },
};
```

---

### 8) Accessible Dialog (Native <dialog>)

```html
<dialog id="help-dialog" aria-labelledby="help-title" aria-modal="true">
  <h2 id="help-title">Help</h2>
  <p>Short instructions…</p>
  <button type="button" data-close>Close</button>
</dialog>
<button type="button" data-open-help>Open Help</button>

<script type="module">
  const dlg = document.getElementById('help-dialog');
  document.querySelector('[data-open-help]').addEventListener('click', () => dlg.showModal());
  dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
</script>
```

---

### 9) Grid/Flex Layout Utilities

```css
.stack > * + * {
  margin-block-start: var(--space-3);
}
.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}
.grid {
  display: grid;
  gap: var(--space-3);
}
@media (min-width: 48rem) {
  .grid.cols-2 {
    grid-template-columns: 1fr 1fr;
  }
}
```

---

### 10) ARIA Dos & Don’ts (Quick Reference)

- Use ARIA **only** to fill semantic gaps; prefer native elements first.
- `role="button"` requires keyboard handlers (`Enter`/`Space`) and `tabindex="0"`—prefer `<button>` instead.
- Ensure `aria-expanded`, `aria-controls`, `aria-modal`, `aria-live` are **kept in sync** with state.
- All interactive elements must be reachable and operable via keyboard.

---

## How to Use This Guide

- For any new component, pick relevant snippets and adapt tokens/classes.
- If Copilot suggests anti-patterns (inline handlers, deep selectors, `innerHTML` w/o sanitization, `var`, `==`), **reject** and regenerate.
- Keep diffs small; update tests and docs when behavior changes.
