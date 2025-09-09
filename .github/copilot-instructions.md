# Copilot Instructions – PT EMR Simulator (Vanilla JS SPA)

Purpose: Make AI agents productive in this repo. This is a pure‑frontend, hash‑routed SPA served from `app/` with ES modules and localStorage data. No backend required.

Use with: `.github/workflows/copilot-style-guide.md` (checklist + snippets). Paste that checklist into every PR.

1. Architecture (what lives where)

- Entry: `app/index.html` loads modules; routes render into `<main id="app">`.
- Router: `app/js/core/router.js` registers routes via `route('#/path', (app, qs, params)=>{})` and starts in `initializeApp()` after importing all view modules.
- Data store: `app/js/core/store.js` uses `storageAdapter` (localStorage) with case wrappers keyed under `pt_emr_cases`; drafts under `draft_<caseId>_<encounter>`.
- Schema helpers: `app/js/core/schema.js` provides `validateCase`, `ensureDataIntegrity`, `migrateOldCaseData`.
- Views: `app/js/views/**` for pages (student, instructor, editor, preview).
- Case data: manifest‑driven under `app/data/cases/manifest.json` → per‑case JSON files.
- Exports: `app/js/services/document-export.js` requires global `docx` (Word export).

2. Add a new page/feature (concrete pattern)

- Create `app/js/views/feature/foo.js` and register the route:
  `import { route } from '../../core/router.js';
import { el } from '../../ui/utils.js';
route('#/feature/foo', async (app)=>{ app.replaceChildren(el('h1',{},'Foo')); });`
- Add a dynamic import to `initializeApp()` in `core/router.js` so it loads before `startRouter()`.
- For navigation, link via `href="#/feature/foo"` or use `url.navigate('/feature/foo')`.

3. Work with cases and drafts (use store API, don’t hand‑roll keys)

- List/get: `const cases = await listCases(); const w = await getCase(id);`
- Create/update/delete: `createCase(caseObj)`, `updateCase(id, caseObj)`, `deleteCase(id)`.
- Drafts: `saveDraft(caseId, encounter, draft)`, `loadDraft(caseId, encounter)`, `listDrafts()`.
- Always run `validateCase` and prefer `ensureDataIntegrity` before persisting.

4. Case loading (manifest overlay)

- On first load, cases come from `app/data/cases/manifest.json` then cache to storage.
- To refresh: clear `pt_emr_cases` (and `pt_emr_case_counter`) or call `forceReloadCases()` from `core/store.js`.

5. Dev workflow

- Serve locally: run `./start_servers_simple.ps1` (or `app/start_servers_simple.ps1`) → http://localhost:3000.
- Lint/format: `npm run lint`, `npm run format`, `npm run check`.
- Browser tests: open files under `app/tests/*.test.html` while the server runs (e.g., `wiring.test.html`).
- Debug logs: append `?debug=1` to the URL (use `?debug=0` to silence).

6. Conventions that differ from “typical” apps

- Hash routes only (e.g., `#/student/cases`); active link highlighting handled in `core/router.js`.
- DOM building via `ui/utils.el()`; avoid unsanitized `innerHTML`.
- Feature modules are ES modules; register routes in the module and import them in `initializeApp()`.
- Storage is the “backend.” Never assume server APIs; optional local dev sync uses `publishToServer()` if enabled.

7. Accessibility and CSS quick rules

- Keep pages semantically structured; one `<h1>` per view; skip‑link in `index.html` is already provided.
- Use BEM‑ish classes and CSS tokens defined in `app/css/*.css`; avoid deep selectors and IDs.
- See `.github/workflows/copilot-style-guide.md` for detailed a11y/CSS/JS standards and snippets.

Key files for reference: `core/router.js`, `core/store.js`, `core/schema.js`, `views/**`, `services/document-export.js`, `data/cases/manifest.json`, `tests/*.test.html`.
