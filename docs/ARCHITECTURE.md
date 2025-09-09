# Architecture

Pure‑frontend, hash‑routed SPA served from `app/` with ES modules and localStorage data. No backend required.

- Entry: `app/index.html` loads modules; routes render into `<main id="app">`.
- Router: `app/js/core/router.js` registers routes via `route('#/path', (app, qs, params)=>{})` and starts in `initializeApp()` after importing all view modules.
- Data store: `app/js/core/store.js` uses `storageAdapter` (localStorage) with case wrappers keyed under `pt_emr_cases`; drafts under `draft_<caseId>_<encounter>`.
- Schema helpers: `app/js/core/schema.js` provides `validateCase`, `ensureDataIntegrity`, `migrateOldCaseData`.
- Views: `app/js/views/**` for pages (student, instructor, editor, preview).
- Features: `app/js/features/**` for SOAP sections, navigation, billing, etc.
- Case data: manifest‑driven under `app/data/cases/manifest.json` → per‑case JSON files.
- Export: `app/js/services/document-export.js` requires global `docx` for Word export.

## Routing

- Hash routes only (e.g., `#/student/cases`); active link highlighting handled in `router.js`.
- Use `route()` in any module to register a handler. Import the module in `initializeApp()` before `startRouter()`.
- For navigation, link via `href="#/path"` or use `navigate('#/path')` (or `url.navigate('/path')` if present).

## Data flow

- On first load, cases are pulled from `app/data/cases/manifest.json` and cached in browser storage under `pt_emr_cases`.
- To refresh: call `forceReloadCases()` or clear `pt_emr_cases` and `pt_emr_case_counter` via DevTools.
- CRUD: `listCases()`, `getCase(id)`, `createCase(obj)`, `updateCase(id, obj)`, `deleteCase(id)`.
- Drafts per encounter: `saveDraft(caseId, encounter, draft)`, `loadDraft(caseId, encounter)`, `listDrafts()`.

## UI patterns

- DOM building via `ui/utils.el()`; avoid unsanitized `innerHTML`.
- One `<h1>` per view; use semantic sections and labels.
- CSS tokens in `app/css/*.css`; BEM‑ish classes; avoid deep selectors/IDs.

## Accessibility

- Keyboard focus management for modals, route announcer for screen readers, switch role for theme toggle.
- Respect `prefers-reduced-motion` in transitions.

## Testing

- Browser tests live under `app/tests/*.test.html`. Start a local server and open the test HTML files.
