# Copilot Instructions – Modern Web Standards (HTML, CSS, Vanilla JS)

> **Purpose:** Constrain AI code suggestions to high‑quality, modern, accessible, and maintainable patterns for a **pure‑frontend** app (HTML5/CSS3/ES modules). No frameworks. No build step assumed. Works when served from `/app` via a static server.

**Use with:** See the companion checklist & snippets: `copilot-style-guide.md`. Every PR **must** include the checklist from that file in the description.

---

## Golden Rules (TL;DR)

- **Semantics first, accessibility always.**
- **Mobile‑first, responsive layouts** with progressive enhancement.
- **Vanilla ES Modules** only (`type="module"`). **No global script tags** that mutate `window`.
- **Separation of concerns:** no inline styles or inline event handlers.
- **Idempotent, testable functions**; avoid magic globals and side effects.
- **Prefer composable utilities over deep CSS selectors or one‑off hacks.**

---

## HTML (Required Practices)

**Must:**

- Use semantic elements (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `form`, `fieldset`, `legend`, `label`).
- Provide `<html lang="en">`, UTF‑8 charset, and viewport meta:
  ```html
  <meta charset="utf-8" /> <meta name="viewport" content="width=device-width, initial-scale=1" />
  ```
- Every interactive control is a **real control** (`button`, `a[href]`, `input`, `select`, etc.) with **visible label** and associated `aria-*` only as needed.
- All images require `alt` (meaningful or `alt=""` if decorative). SVGs include `role="img"` + `<title>` where appropriate.
- Forms: pair `label[for]` with inputs; include `required`, `min`, `max`, `step` as applicable; provide inline error messaging region with `aria-live="polite"`.
- Only one `<h1>` per document; use a logical heading hierarchy.

**Never:**

- Inline event handlers (e.g., `onclick="..."`) or inline styles.
- Misusing `<div>`/`<span>` for interactive elements.
- Relying on color alone to convey meaning; provide text or icon + `aria-label`.

**Prefer:**

- **Fragment navigation** and accessible skip links: `<a class="skip-link" href="#main">Skip to content</a>`.
- Native `<dialog>` for modals with focus trapping and `aria-modal="true"`.

---

## CSS (Required Practices)

**Must:**

- **Mobile‑first**: start with small screens; enhance with media queries.
- Use logical properties (`margin-inline`, `padding-block`) where sensible.
- Scale typography with `rem` and fluid sizes via `clamp()`.
- Layout with **Flexbox/Grid**; avoid absolute positioning for primary layout.
- Use **utility classes** and **BEM‑like naming** to avoid deep specificity:
  - Utilities: `.sr-only`, `.text-xs`, `.flow`, `.stack`, `.grid-gap-2`, etc.
  - Components: `.card`, `.card__header`, `.card__body`.
- Respect user prefs:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none;
      transition: none;
    }
  }
  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: light dark;
    }
  }
  ```

**Never:**

- `!important` (except in rare utility resets).
- ID selectors or selector depth > 3.
- Hard‑coded `px` for body copy.

**Prefer:**

- CSS custom properties for theme tokens (spacing, color, radius, z‑index).
- `:focus-visible` styles with clear outlines; do not remove outlines.

---

## JavaScript (Required Practices)

**Module & Structure**

- ES modules with `type="module"` and named exports. Prefer pure functions.
- Namespace features by folder; use barrel files (`index.js`) only for public API.

**DOM & Events**

- No inline handlers. Use `addEventListener`. Delegate where possible.
- Guard DOM access: run after `DOMContentLoaded` or place scripts at end of body.
- Use `dataset` for configuration; avoid tight coupling to classes/ids.

**Data & State**

- Validate external inputs; sanitize any HTML before injection.
- Prefer `textContent` for text; only use `innerHTML` with sanitized templates.
- Persist only necessary state in `localStorage` with defensive parsing (`try/catch`).

**Error Handling & Logging**

- Fail gracefully. Show user-friendly messages in an `aria-live` region.
- No `console.log` in production paths; wrap logs behind a debug flag.

**Never:**

- `var`; use `const` by default, `let` when reassigned.
- `==`/`!=`; use strict equality `===`/`!==`.
- Mutate imported bindings or global objects.

**Prefer:**

- Event‑driven modules with small public APIs.
- Feature detection over UA sniffing.
- `AbortController` for cancellable async ops and to avoid leaks.

---

## Performance & Bundling (No Build Assumed)

- `<link rel="preload">` for critical fonts/assets when justified.
- Defer non‑critical scripts with `type="module"` or `defer`.
- Optimize images (SVG preferred). Avoid oversized PNG/JPEG.
- Keep third‑party dependencies out unless essential.

---

## Security & Privacy

- Treat all external data as untrusted. Sanitize before `innerHTML`.
- Do not store sensitive info in `localStorage`.
- Avoid leaking internal structure via error messages.

---

## Testing & Linting

- Provide minimal unit tests for pure functions where practical.
- Run an accessibility pass (manual + automated) before merging.
- Follow a consistent style: Prettier defaults; ESLint rules (`no-var`, `eqeqeq`, `no-implicit-globals`).

---

## Required File Practices (This Repo)

- New pages: single `<h1>`, `lang="en"`, viewport meta, skip‑link, landmark roles.
- Buttons: explicit `type="button"` unless submit required.
- Forms: client‑side validation + accessible errors (`aria-live="polite"`).
- Components: BEM‑like class naming, **max selector depth 3**.
- JS: ES modules, no `innerHTML` unless sanitized template function is used.
- CSS: tokenized with custom properties; **no IDs** and **no `!important`**.

---

## Snippets & PR Checklist

For ready‑to‑use snippets (header menu, forms, dialog, templating utility, fetch with AbortController, storage wrapper, utilities) **and the required PR checklist**, see **`copilot-style-guide.md`** at the repository root. **Every PR must paste and check off that list.**

---

## Troubleshooting

If Copilot suggestions drift from these rules or create regressions, follow the **"Copilot Troubleshooting – Modernization Playbook"** in `.github/copilot-troubleshooting.md`. It includes prompt templates, common failure‑mode fixes, mechanical refactor playbooks, regression checklists, and lint/grep commands.
