# PT EMR AI Case Generator - Azure Function

Minimal HTTP endpoint that generates PT case data from anchors. Returns JSON case structure compatible with the PT EMR frontend.

## Local Development

1. **Install Azure Functions Core Tools:**
   ```powershell
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

2. **Start the function:**
   ```powershell
   cd azure-function
   func start
   ```
   - Serves at: http://localhost:7071/api/generate-case
   - CORS enabled for local development

3. **Configure Frontend:**
   - The frontend reads the endpoint from:
     - Meta tag: `<meta name="ai-generate-url" content="http://localhost:7071/api/generate-case">`
     - Global variable: `window.AI_GENERATE_URL = 'http://localhost:7071/api/generate-case'`
     - localStorage: `localStorage.setItem('aiGenerateUrl', 'http://localhost:7071/api/generate-case')`

## API Usage

**Endpoint:** `POST /api/generate-case`

**Request Body:**
```json
{
  "title": "Test Shoulder Case",
  "region": "shoulder", 
  "condition": "Rotator cuff tendinopathy",
  "age": 42,
  "sex": "female", 
  "pain": 6,
  "goal": "Return to overhead lifting",
  "setting": "Outpatient",
  "acuity": "subacute"
}
```

**Response:** Complete case JSON with:
- Meta, snapshot, history, findings
- Encounters.eval with subjective/objective/assessment/plan/billing
- Normalized plan frequency/duration enums
- Preselected regions for objective tables

## Testing

**PowerShell:**
```powershell
$body = '{"title":"Test Case","region":"shoulder","age":42}'
Invoke-RestMethod -Uri 'http://localhost:7071/api/generate-case' -Method POST -ContentType 'application/json' -Body $body
```

**In App:**
1. Navigate to Instructor Cases → "Generate from Prompt"
2. Fill the form and generate
3. App will call AI endpoint first, fall back to local generator if unreachable

## Deployment

Deploy to Azure Functions when ready:
```powershell
func azure functionapp publish <your-function-app-name>
```

Update the frontend meta tag with your deployed URL.
