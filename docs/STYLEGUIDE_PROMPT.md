# PT EMR Design System – LLM Prompt Template

Use this prompt (fill in bracketed sections) to have an LLM generate UI or CSS consistent with the PT EMR Simulator design system.

---

## Prompt

You are implementing UI components for a web application. Follow the PT EMR Simulator design system:

1. Use provided design tokens (CSS custom properties) instead of hard-coded values. Available tokens include brand colors (`--und-green`, `--und-orange`), surface/background (`--bg`, `--panel`, `--panel-alt`), borders (`--color-border`, `--surface-light-border`), typography scale (`--font-xs` .. `--font-xl`), radii (`--radius-sm|md|lg`), elevations (`--elev-deep`), layout (`--sidebar-w`, `--topbar-h`), and semantic sidebar / role tokens.
2. Dark mode is applied via `html[data-theme='dark']` overrides. Provide only the delta overrides for dark mode (no duplication of shared rules).
3. Accessibility:
   - Include visible focus states using `outline: 3px solid var(--und-orange); outline-offset: 2px;` via `:focus-visible`.
   - Use semantic HTML (buttons for interactive elements, nav/aside for navigation, etc.).
   - Support reduced motion (`@media (prefers-reduced-motion: reduce)` remove transitions/animations).
4. Performance and structure:
   - Keep CSS selectors shallow; avoid deep descendant chains.
   - Separate structural layout from skin (theme) styling when possible.
   - Use rAF coalesced update logic for high-frequency DOM/UI refreshes (reference pattern: `createCoalescedUpdater(render)` dirty-flag scheduler).
5. Provide minimal, composable class names; avoid id selectors. Favor utility-like spacing where appropriate, but rely on tokens for sizing.
6. For any message/chat bubble, map roles to tokens:
   - User: `background: var(--role-user-bg); color: var(--role-user-fg);`
   - Assistant: `background: var(--role-assistant-bg); color: var(--role-assistant-fg);`
   - System: `background: var(--role-system-bg); color: var(--role-system-fg);`
7. Never remove outlines without replacement. Do not inline hard-coded hex values when a token exists.
8. Z-index layering uses tokenized values (e.g., `var(--z-sidebar)`). Only introduce new layers if necessary and document rationale.
9. All spacing should be multiples of 4px (e.g., `.25rem`, `.5rem`, `.75rem`, `1rem`).
10. If implementing a drawer or overlay, use pattern:

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}
.drawer {
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}
.drawer.is-open {
  transform: translateX(0);
}
```

Provide only the essential structural rules plus theme-driven tokens.

TASK: [Describe the components or screens needed]
OUTPUT FORMAT:

- Brief rationale (1–2 sentences)
- HTML snippet(s)
- Corresponding CSS (light + minimal dark overrides)
- Optional JS if interaction required (coalesced updater pattern if applicable)

Reject out-of-scope features (state management, backend APIs). Keep code self-contained.

---

## Example Usage

Component: Primary + Secondary Button
(Request) "Generate buttons for form actions"

(HTML)

```html
<button class="btn">Save</button> <button class="btn secondary">Cancel</button>
```

(CSS)

```css
.btn {
  --btn-pad-y: 0.625rem;
  --btn-pad-x: 1rem;
  display: inline-flex;
  gap: 0.5rem;
  padding: var(--btn-pad-y) var(--btn-pad-x);
  font-size: var(--font-sm);
  font-weight: 600;
  background: var(--btn-bg);
  color: var(--btn-fg);
  border: 1px solid var(--btn-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    background-color 0.18s,
    border-color 0.18s,
    box-shadow 0.18s;
}
.btn:hover,
.btn:focus {
  background: var(--btn-hover-bg);
}
.btn:focus-visible {
  outline: 3px solid var(--und-orange);
  outline-offset: 2px;
}
.btn.secondary {
  background: var(--surface-light);
  color: var(--text);
  border-color: var(--surface-light-border);
}
html[data-theme='dark'] .btn.secondary {
  background: var(--panel);
  border-color: var(--color-border);
}
```

---

## Integration Notes

- Generated CSS can append to `app/css/components/` or be dynamically injected for experiments.
- After adding new tokens, update `design-tokens.json` manually if semantic meaning changes.
- Run `node scripts/generate-design-tokens.mjs` to produce/refresh `design-tokens.generated.json` for auditing.

---

## Validation Checklist (LLM should implicitly satisfy)

- Uses only existing tokens (or introduces clearly named new semantic tokens).
- Provides dark mode deltas only.
- Focus states visible and accessible.
- No hard-coded magic numbers for color/radius/z-index.
- Spacing respects 4px baseline.

---

## Prompt Tail (Append This Exactly)

"Adhere strictly to the PT EMR design system tokens and patterns. If a required token is missing, propose the token name instead of inlining a literal value."
