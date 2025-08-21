# Case Data Management (2025)

This folder organizes PT EMR cases using a modern manifest-based system that supports both monolithic and per-file organization.

## 📁 Structure

- `manifest.json` – Categorized case index with file references
- `cases/<category>/<case>.json` – Individual case files with complete SOAP data
- `../cases.json` – Optional monolithic case collection (legacy support)

## 🔄 Loading Behavior

The application loads cases in this priority order:

1. **Monolithic file**: `app/data/cases.json` (if present) - single object keyed by case ID
2. **Manifest overlay**: `app/data/cases/manifest.json` - organizes cases by category
3. **Individual files**: Referenced case files are loaded and merged
4. **Data validation**: All cases pass through schema validation and migration
5. **localStorage cache**: Final case collection stored locally for performance

## 📝 Case Structure

Each case file contains a complete wrapper with:

```json
{
  "id": "case_shoulder_impingement_001",
  "title": "Tennis Player - Shoulder Pain", 
  "latestVersion": 0,
  "caseObj": {
    "meta": { "title": "...", "setting": "...", "regions": [...], "acuity": "...", "diagnosis": "..." },
    "snapshot": { "name": "...", "age": "...", "sex": "...", "dob": "...", "teaser": "..." },
    "history": { "chief_complaint": "...", "hpi": "...", "pain": {...}, "pmh": [...], "meds": [...] },
    "findings": { "vitals": {...}, "rom": {...}, "mmt": {...}, "special_tests": [...] },
    "encounters": {
      "eval": {
        "subjective": { "chiefComplaint": "...", "historyOfPresentIllness": "..." },
        "objective": { "inspection": {...}, "regionalAssessments": {...} },
        "assessment": { "primaryImpairments": "...", "bodyFunctions": "...", "ptDiagnosis": "..." },
        "plan": { "frequency": "...", "goalsTable": {...}, "exerciseTable": {...} },
        "billing": { "diagnosisCodes": [...], "billingCodes": [...] }
      }
    }
  }
}
```

## 🎯 Draft Seeding (Faculty → Student)

When faculty create cases in answer key mode, the complete case data maps to student draft fields:

### Subjective Mapping
- `history.chief_complaint` → `draft.subjective.chiefComplaint`
- `history.hpi` → `draft.subjective.historyOfPresentIllness`
- `history.pain.level` → `draft.subjective.painScale`
- `history.pain.location` → `draft.subjective.painLocation`
- `history.pain.quality` → `draft.subjective.painQuality` (normalized to UI enum)
- `history.pain.aggravating_factors` → `draft.subjective.aggravatingFactors`
- `history.pmh` → `draft.subjective.pastMedicalHistory`
- `history.functional_goals` → `draft.subjective.patientGoals`

### Objective Mapping
- `encounters.eval.objective.inspection.visual` → `draft.objective.inspection.visual`
- `encounters.eval.objective.palpation.findings` → `draft.objective.palpation.findings`
- `encounters.eval.objective.regionalAssessments` → `draft.objective.regionalAssessments`
  - ROM data: `rom.{index}` → UI table rows with left/right values
  - MMT data: `mmt.{index}` → normalized grades (e.g., "4-/5")
  - PROM data: `prom.{movement-side}` → table format with notes
  - Special tests: `specialTests.{test-index}` → left/right/notes format

### Assessment Mapping
- `encounters.eval.assessment.primaryImpairments` → `draft.assessment.primaryImpairments`
- `encounters.eval.assessment.bodyFunctions` → `draft.assessment.bodyFunctions`
- `encounters.eval.assessment.activityLimitations` → `draft.assessment.activityLimitations`
- `encounters.eval.assessment.participationRestrictions` → `draft.assessment.participationRestrictions`
- `encounters.eval.assessment.ptDiagnosis` → `draft.assessment.ptDiagnosis`
- `encounters.eval.assessment.prognosis` → `draft.assessment.prognosis`

### Plan Mapping
- `encounters.eval.plan.goalsTable` → `draft.plan.goalsTable`
- `encounters.eval.plan.exerciseTable` → `draft.plan.exerciseTable`
- `encounters.eval.plan.patientEducation` → `draft.plan.patientEducation`
- `encounters.eval.plan.treatmentPlan` → `draft.plan.treatmentPlan`

### Billing Mapping
- `encounters.eval.billing.diagnosisCodes` → `draft.billing.diagnosisCodes`
- `encounters.eval.billing.billingCodes` → `draft.billing.billingCodes`
- `encounters.eval.billing.ordersReferrals` → `draft.billing.ordersReferrals`

## 🔧 Development Notes

- **Student mode**: Loads blank draft (respects case-level `editorSettings`)
- **Faculty mode**: Seeds draft from case answer key for editing
- **Key mode**: Read-only view of faculty answer key for reference
- **Data integrity**: All cases validated and migrated via `schema.js`
- **Modern patterns**: No backward compatibility, clean object-based APIs throughout
