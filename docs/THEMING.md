# Theming & Branding

- Light baseline with optional dark theme via `data-theme="dark"` on `<html>`.
- Theme toggle lives in `app/index.html` and persists preference via storage.
- Brand tokens are defined in `app/css/*.css` (e.g., UND green, UND gray). Avoid hard‑coded colors.
- Header “| Proof of Concept” suffix and footer (edu ribbon) use UND gray.
- Feedback buttons use the secondary style with dark treatment by default, consistent across themes.

## CSS guidelines

- Use CSS variables and BEM‑ish classes.
- Keep selectors shallow; avoid ID styling except for scoped overrides.
- Respect `prefers-color-scheme` and `prefers-reduced-motion`.
