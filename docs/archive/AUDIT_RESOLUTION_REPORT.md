# Modernization Audit — Resolution Summary

Date: 2025-08-27

This file maps items from `pt-ehr-modernization-audit.csv` to their current status in the repo.

Legend: Done = resolved, Pending = still present or intentionally retained.

## High

- Missing lang attribute on html (debug-case-data.html) — Done (added lang="en").

## Medium

- Missing responsive viewport meta (debug-case-data.html) — Done.
- Inline event handler on debug page — Done (migrated to addEventListener).
- Button missing explicit type (debug page) — Done (type="button").
- Loose equality in core/url.js and services/document-export.js — Done (== → strict checks).
- Many innerHTML assignments — Pending (numerous across views; requires phased refactor + sanitizer where HTML is intentional).
- Element.onclick occurrences in ChartNavigation.js — Pending (several assignments remain; move to addEventListener in a follow-up).

## Low (sampling of representative rows in CSV)

- ID selectors in CSS (#primaryNav, #app, etc.) — Partially Done. Many were removed/converted; remaining legacy blocks exist in styles.css. Legacy mobile-patch.css has been removed; continue cleanup with minimal regression risk.
- !important usages — Partially Done. print.css cleaned; styles.css and mobile-patch-v2.css retain a few for utility/override purposes; evaluate case-by-case.
- Vendor prefixes (-webkit-backdrop-filter) — Intentionally Kept for Safari/iOS blur support.
- Font sizes in px — Partially Done. Buttons and many components now use rem; some legacy px remain in large stylesheets; continue conversion opportunistically.
- Potential DOM access before ready — Largely addressed by module placement; continue verifying per file.

## Notes

- Legacy file `app/js/mobile-drawer.js` removed in favor of v2 module and tested overlay.
- CI smoke covers menu and drawer. Consider adding automated a11y checks next.

## Next Steps

- Replace remaining Element.onclick with addEventListener.
- Introduce a tiny sanitized template helper to replace innerHTML write paths where feasible.
- Continue migrating ID selectors to classes; keep route-safe hooks.
- Convert remaining px font sizes to rem in styles.css/tables.css where practical.
