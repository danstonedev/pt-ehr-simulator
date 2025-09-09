# Case Authoring Guide (Faculty)

This guide helps faculty create high‑quality clinical cases that work smoothly across Student and Key modes.

## Where cases live

- Manifest: `app/data/cases/manifest.json`
- Case files: `app/data/cases/<category>/<case-id>.json`
- On load, cases are read from the manifest and cached into browser storage.

After editing files locally, run the app and open DevTools → `ptStore.forceReloadCases()` → refresh.

## Case file shape

Each case file should export a wrapper object:

```json
{
  "id": "case_shoulder_impingement_001",
  "caseObj": {
    "meta": {
      "title": "Tennis Player - Shoulder Pain",
      "setting": "Outpatient",
      "regions": ["shoulder"],
      "acuity": "subacute",
      "diagnosis": "Musculoskeletal"
    },
    "snapshot": { "name": "—", "age": "—", "sex": "unspecified", "teaser": "—" },
    "history": { "chief_complaint": "...", "hpi": "...", "red_flag_signals": [] },
    "exam": { "vitals": { "bp": "", "hr": "" }, "regionalAssessments": { "selectedRegions": [] } },
    "assessment": {
      "primaryImpairments": "...",
      "clinicalReasoning": "...",
      "visibility": {
        "ptDiagnosis": { "studentKey": true, "studentExaminer": false },
        "prognosis": { "studentKey": true, "studentExaminer": false }
      }
    },
    "plan": { "goals": [], "interventions": [] },
    "encounters": { "eval": { "notes_seed": "" }, "daily": [] },
    "assets": []
  }
}
```

Notes:

- `ensureDataIntegrity` fills reasonable defaults if some sections are missing
- Use canonical enums where applicable (see `app/js/core/schema.js` → `ENUMS`)

## Manifest entries

Add your case to the appropriate category:

```json
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
```

The `title` here is for the catalog. The authoritative case title lives under `caseObj.meta.title`.

## Attachments (images, PDFs)

- Include referenced files under `app/data/` (or a subfolder) and point to them from `caseObj.assets`
- All artifact categories now accept attachments; they’ll render as cards and export appropriately

Example asset:

```json
{
  "type": "image",
  "label": "X-ray",
  "src": "data/images/shoulder_xray.png"
}
```

## Drafts and answer keys

- Student drafts are saved under keys like `draft_<caseId>_<encounter>`
- Faculty “Key mode” is toggled via the editor route param `key=true`; visibility fields under `assessment.visibility` control what students see

## Quality checklist

- Title, setting, region(s), and diagnosis present under `meta`
- Snapshot completed enough to identify the patient scenario (age/sex/teaser)
- History covers HPI, mechanism, pain, red flags if relevant
- Exam contains at least vitals and any region‑specific exam expected by the scenario
- Assessment includes a clear impression and clinical reasoning
- Plan includes at least goals or interventions
- Billing (optional) uses ICD‑10/CPT where appropriate
- Validate: enable `?debug=1`, check console warnings; address `validateCase` output

## Troubleshooting

- Cases not appearing? Run `ptStore.forceReloadCases()` and refresh
- Bad enum or missing field? Review `docs/DATA_AND_STORAGE.md` and `app/js/core/schema.js`
- Export issues? Ensure the `docx` global is available or test without export
