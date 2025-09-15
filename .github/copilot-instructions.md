# Copilot Instructions – PT EMR Simulator (Vanilla JS SPA)

Purpose: Make AI agents productive here. Pure‑frontend, hash‑routed SPA served from `app/` with ES modules and browser storage. No backend.

Use with: `.github/workflows/copilot-style-guide.md` (paste its checklist into every PR).

1. Architecture (what lives where)

- Entry: `app/index.html` → render into `<main id="app">`.
- Router: `app/js/core/router.js` registers via `route('#/path', (app, qs, params)=>{})` and starts in `initializeApp()` after importing all view modules (see Promise.all list).
- URL helpers: `app/js/core/url.js` → `getRoute()`, `setQueryParams({k:v})`, `navigate('/path', params)`, `buildLink()`.
- Store: `app/js/core/store.js` wraps `storageAdapter` (localStorage fallback to memory). Cases keyed under `pt_emr_cases`; drafts under `draft_<caseId>_<encounter>`.
- Schema: `app/js/core/schema.js` → `validateCase`, `ensureDataIntegrity`, `migrateOldCaseData`.
- Views: `app/js/views/**` (student, instructor, editor, preview). Features under `app/js/features/**` (SOAP modules, navigation, billing, etc.).
- Case data: manifest‑driven (`app/data/cases/manifest.json` → per‑case JSON).
- Exports: `app/js/services/document-export.js` (requires global `docx`).

2. Router & navigation patterns

- Register: `route('#/feature/foo', async (app, qs, params)=>{ app.replaceChildren(el('h1',{},'Foo')); });`
- Param routes supported (e.g., `#/student/case/:id`) via internal matcher; `params` carries extracted values.
- Import your view module in `initializeApp()` before `startRouter()`; keep the dynamic imports list updated.
- Use `href="#/path"` or `url.navigate('/path')`; active link highlighting handled by `router.js`.
- Transitions: router applies fade/slide CSS classes and cleans up previous view via a stored `currentCleanup` function; respects `prefers-reduced-motion` and disables transitions during resize.

3. Data flow & APIs (don’t hand‑roll keys)

- First load pulls from `app/data/cases/manifest.json` and caches to storage (`pt_emr_cases`).
- CRUD: `listCases()`, `getCase(id)`, `createCase(caseObj)`, `updateCase(id, caseObj)`, `deleteCase(id)`.
- Drafts per encounter: `saveDraft(caseId, encounter, draft)`, `loadDraft(caseId, encounter)`, `listDrafts()`.
- Always run/assume `ensureDataIntegrity` + `validateCase` around persistence.
- Refresh cache: `forceReloadCases()` or clear `pt_emr_cases` and `pt_emr_case_counter`.
- Optional local dev sync (port 5173): set `localStorage.useLocalServer='1'` or run on `localhost:5173` → auto `publishToServer()` after CRUD.
- Debug logs: append `?debug=1` to URL.

4. UI & conventions specific to this repo

- Build DOM via `ui/utils.el()` and set text/attrs; avoid unsanitized `innerHTML`.
- One `<h1>` per view; semantic sections; CSS tokens in `app/css/*.css`; BEM‑ish classes; avoid deep selectors/IDs.
- `document-export.js` expects `window.docx`; include that on hosting page if you enable Word export.

5. Dev workflow (what actually works here)

- Start locally: `./start_servers_simple.ps1` (or `app/start_servers_simple.ps1`) → open `http://localhost:3000`.
- Lint/format: `npm run lint`, `npm run format`, `npm run check`.
- Browser tests: open `app/tests/*.test.html` while server runs (e.g., `wiring.test.html`).
- VS Code tasks available: “Start PT EMR Simulator”, “Check & Lint PT EMR”, etc.

Key files to reference: `app/js/core/router.js`, `app/js/core/url.js`, `app/js/core/store.js`, `app/js/core/schema.js`, `app/js/views/**`, `app/js/services/document-export.js`, `app/data/cases/manifest.json`, `app/tests/*.test.html`.
