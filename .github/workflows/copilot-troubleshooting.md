# Copilot Troubleshooting – Modernization Playbook

> Practical steps to steer Copilot/LLMs while refactoring to modern HTML/CSS/Vanilla JS. Use this when suggestions drift, ignore constraints, or break behavior.

---

## 0) Quick Tactics (When Output Goes Off the Rails)

- **Constrain the scope**: select only the function/component you want changed and restate: “**Make the smallest possible diff** that {does X}; **do not** alter unrelated code.”
- **Restate hard rules** (copy/paste): “No inline handlers/styles; ES modules only; strict equality; `const`/`let`; no IDs in CSS; max selector depth 3; sanitize before `innerHTML`.”
- **Ask for a unified diff**: “Return a **unified diff** with context; avoid rewrites.”
- **Regenerate with contrastive instruction**: “Your last diff used `innerHTML` unsafely. Try again using `textContent` or `html()` util.”
- **Pin acceptance criteria**: list tests and click-paths the change must pass (see Regression Checklist below).

---

## 1) Prompt Templates (Copy/Paste)

### Minimal-Diff Refactor

> _Selection: target function or component_

```
Refactor this to modern standards with the smallest possible diff:
- ES modules; const/let; strict equality; no inline handlers; sanitize before innerHTML.
- Keep API and behavior the same.
- Return a unified diff; do not change unrelated files or styles.
```

### Replace Inline Handlers

```
Convert inline event handlers to addEventListener with delegation where sensible.
- No global mutation; init inside DOMContentLoaded or exported init().
- Update aria-expanded/controls if a disclosure/menu is affected.
- Return a unified diff.
```

### innerHTML → Safe DOM construction

```
Replace innerHTML usage with safer patterns:
- Prefer textContent for plain text.
- For markup, construct nodes with ui/utils.el() or document.createElement and append children explicitly.
- Keep the same DOM shape and classes.
- Return a unified diff.
```

### CSS Specificity/Deep Selector Fix

```
Reduce CSS specificity:
- Convert deep selectors (>3) or ID selectors to BEM-like classes.
- No !important.
- Update HTML class names as needed with minimal changes.
- Return a unified diff.
```

### Mobile Header/Nav Fix

```
Make the header responsive:
- Mobile-first; burger toggles a <nav> with aria-expanded and hidden attribute.
- Use features/menu/index.js::initMenu pattern.
- No absolute positioning for primary layout.
- Return a unified diff.
```

---

## 2) Common Failure Modes & Fixes

### A. Copilot adds frameworks or build tooling

- **Fix:** “No frameworks or build steps. Vanilla ES modules only. Reattempt with pure HTML/CSS/JS.”

### B. Suggests `var`, `==`, `onclick=`, or deep CSS

- **Fix:** “Use `const/let`, `===`, `addEventListener`, BEM-like classes, selector depth ≤3. Try again.”

### C. Breaks keyboard/screen-reader support

- **Fix:** Require `aria-` state sync, `:focus-visible` styles, skip link, proper `button`/`a` usage.

### D. Unsafe `innerHTML` (XSS risk)

- **Fix:** “Use `textContent` or build nodes with `el()` and append them.” Avoid raw innerHTML.

### E. DOM access before ready

- **Fix:** Wrap in `DOMContentLoaded` or move script to end with `type="module"`.

### F. Overwrites unrelated code (big diffs)

- **Fix:** Select smaller range; instruct “minimal diff”; ask for unified diff.

### G. CSS collisions/specificity wars

- **Fix:** Introduce tokens/utilities, BEM classes, remove IDs/`!important`, add component scopes.

### H. Mobile layout regressions

- **Fix:** Use grid/flex utilities, content-first flow, explicit breakpoints (e.g., 48rem).

---

## 3) Mechanical Refactor Playbooks

### Playbook 1: Inline Handlers → addEventListener

1. Search: `onclick=|onchange=|oninput=` across HTML.
2. Create `initX()` in module, attach listeners via delegation where feasible.
3. Ensure `type="button"` on non-submit buttons.
4. Update ARIA (`aria-expanded`, `aria-controls`) where applicable.
5. Test: mouse + keyboard (Tab / Enter / Space).

### Playbook 2: `var`/`==` → `const`/`let`/`===`

1. Replace `var` with `const` (default) or `let` (reassigned).
2. Replace loose equality; audit for type coercion.
3. Run ESLint `no-var`, `eqeqeq` rules.

### Playbook 3: `innerHTML` → `textContent`/`html()`

1. If text-only: `node.textContent = value`.
2. If markup: build nodes with `el()` or `document.createElement`, then append children.
3. Ensure event binding occurs after insertion.

### Playbook 4: Deep Selectors → BEM + Utilities

1. Identify selectors with depth >3 or IDs.
2. Create component class `.component` and elements `.component__part`.
3. Replace IDs/descendant chains with flat classes.
4. Verify no `!important` usage remains.

### Playbook 5: px → rem + fluid type

1. Replace body copy `px` with `rem` (e.g., `1rem`).
2. Use `clamp()` for headings.
3. Verify line-length/contrast remains acceptable.

---

## 4) Regression Checklist (Copy into PR)

- [ ] Keyboard access (Tab, Enter/Space), focus visible, screen reader labels correct.
- [ ] No console errors; no global name leaks.
- [ ] Mobile nav works at <48rem; desktop layout intact at ≥64rem.
- [ ] No `var`, no `==`, no inline handlers/styles, no IDs in CSS, no `!important`.
- [ ] No unsafe `innerHTML`; sanitized templating used where needed.
- [ ] Lighthouse a11y score ≥ 95 on changed pages (manual check for form errors).

---

## 5) Commands & Tooling

```bash
# Format & lint
npx prettier . --write
npx eslint . --max-warnings=0

# Greps
rg -n "onclick=|onchange=|oninput=" app
rg -n "var " app | rg -v "for \(var i = 0"   # then fix loops too
rg -n "==[^=]" app
rg -n "innerHTML\s*=" app
rg -n "#[A-Za-z0-9_-]+\s*\{" app/styles
rg -n "!important" app/styles
```

---

## 6) Diff Hygiene

- Ask Copilot for **unified diffs** with minimal, focused changes.
- Reject diffs that include renames/whitespace churn unrelated to the task.
- Require **before/after screenshots** for UI-affecting changes.

---

## 7) When to Stop and Hand-Edit

- Repeated violations after 2–3 regenerations.
- Security-sensitive code paths (templating, storage, navigation).
- Complex layout regressions—fix CSS structure manually, then let Copilot fill in details.

---

**See also:** `copilot-style-guide.md` (checklist & snippets) and `.github/copilot-instructions.md` (rules).
