# Data & Storage

The simulator uses browser storage (via `storageAdapter`) as its persistence layer. There is no backend.

## Keys

- Cases map: `pt_emr_cases` → `{ [id]: { id, title, latestVersion, caseObj } }`
- Case ID counter: `pt_emr_case_counter`
- Drafts: `draft_<caseId>_<encounter>` → free‑form JSON per encounter (eval, daily, progress, discharge)

## Initialization

On first run, cases are loaded from `app/data/cases/manifest.json`, which points to per‑case JSON files under `app/data/cases/**`. Loaded cases are validated and migrated via `schema.js` and then cached to storage.

Use `ptStore.forceReloadCases()` to clear the cache and reload from the manifest.

## API

From `app/js/core/store.js`:

- `listCases()` → array of case wrappers
- `getCase(id)` → single case wrapper
- `createCase(caseObj)` → adds a new case wrapper and persists
- `updateCase(id, caseObj)` → updates wrapper + `latestVersion`
- `deleteCase(id)` → removes case
- `saveDraft(caseId, encounter, draft)` / `loadDraft(caseId, encounter)` / `listDrafts()`

All inputs are normalized via `ensureDataIntegrity` and validated by `validateCase`.

## Manifest shape

`app/data/cases/manifest.json`:

```json
{
  "categories": [
    {
      "id": "shoulder",
      "name": "Shoulder / Upper Quarter",
      "cases": [
        {
          "id": "case_shoulder_impingement_001",
          "file": "cases/shoulder/impingement_001.json",
          "title": "Tennis Player - Shoulder Pain"
        }
      ]
    }
  ]
}
```

Each referenced file resolves to an object `{ id, caseObj }` (plus optional title, etc.).
