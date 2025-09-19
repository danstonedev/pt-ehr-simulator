# Theming & Branding

- Light baseline with optional dark theme via `data-theme="dark"` on `<html>`.
- Theme toggle lives in `app/index.html` and persists preference via storage.
- Brand tokens are defined in `app/css/*.css` (e.g., UND green, UND gray). Avoid hard‑coded colors.
- Header “| Proof of Concept” suffix and footer (edu ribbon) use UND gray.
- Feedback buttons use the secondary style with dark treatment by default, consistent across themes.

## Token cheat sheet (semantic)

Prefer these semantic tokens; numeric aliases still exist for backward compatibility.

- Colors: `--color-bg` (background), `--color-fg` (foreground/text), `--color-brand`, `--color-muted`, `--color-warn`, `--color-danger`, `--color-overlay`, `--color-surface-90`, `--color-surface-18`.
- Typography: `--font-xs|sm|md|base|lg|xl` and line-heights `--lh-tight|snug|normal|relaxed|comfy`.
- Spacing: `--space-xxs|xs|sm|md|lg|xl|2xl|3xl` (aliases `--space-1..8` preserved).
- Radii: `--radius-none|sm|md|lg|pill|round` (aliases `--radius-1..6` preserved).
- Shadows: `--elev-none`, `--elev-focus-ring`, `--elev-fab`, `--shadow-sm|md|lg|drawer` (aliases `--shadow-1..9` preserved).
- Surfaces (new):
  - Global: `--surface-warn`, `--text-on-warn`, `--surface-topbar`, `--surface-footer`, `--color-icon`
  - Components: `--surface-inline-card`, `--surface-editor`, `--surface-case-header`
  - Tables: `--surface-table-striped`, `--surface-table-head`
  - Borders: `--color-border`
  - Note: Themes override these in `styles.css` (e.g., darker neutrals in dark theme; light neutrals and gradients in light theme).
- Z-index: `--z-below|base|modal|overlay|drawer|top` (aliases `--z-1..6` preserved).
- Print: `--font-print-base/small/h1/h2/h3/h4/h5`.
- Breakpoints: Documented in tokens, but do not use `var()` inside `@media` in plain CSS.

Usage tips:

- Outside `@media`, replace `#fff`/`#000` with `var(--color-bg, #fff)` / `var(--color-fg, #000)`.
- Replace numeric tokens like `--font-4` with `--font-sm` when editing nearby code.
- For subtle hover elevation, use `--shadow-sm`; for large popovers/drawers, use `--shadow-lg` or `--shadow-drawer`.
- For warn banners or alerts, prefer `--surface-warn` and `--text-on-warn` instead of literal colors.
- For chrome (topbar/footer), prefer `--surface-topbar` and `--surface-footer`; set per-theme overrides in the theme blocks.
- For icons, use `fill: var(--color-icon)`; theme can tune `--color-icon` for contrast.
- For borders, use `border-color: var(--border)` for component borders and set the theme with `--color-border`.
- For tables, use `--surface-table-head` for header backgrounds and `--surface-table-striped` for even-row striping.

## CSS guidelines

- Use CSS variables and BEM‑ish classes.
- Keep selectors shallow; avoid ID styling except for scoped overrides.
- Respect `prefers-color-scheme` and `prefers-reduced-motion`.

## EMRsim logo assets

The following logo variants are available in `app/img/`:

- `EMRsim-white.png` — optimized for dark headers (this is used in the top bar by default)
- `EMRsim-green.png` — green text version for light backgrounds
- `EMRsim-black.png` — black text version for white/very light backgrounds

Header usage is defined in `app/index.html` on the element `<img class="und-logo" src="img/EMRsim-white.png">`. Sizing is controlled via the `.und-logo` class in `app/css/styles.css`.

To change per-theme automatically, either:

- swap the `src` in a small script that listens for `data-theme` changes on `<html>`, or
- use a `<picture>` element with `(prefers-color-scheme: dark)` conditional sources.
