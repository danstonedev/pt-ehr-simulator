# 🤖 AI Case Generator - Azure Function

[![Status](https://img.shields.io/badge/Status-Development-yellow?style=flat-square)]()
[![Azure Functions](https://img.shields.io/badge/Platform-Azure_Functions-blue?style=flat-square)](https://azure.microsoft.com/en-us/services/functions/)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI_GPT--4-green?style=flat-square)](https://openai.com/)

> **Intelligent PT Case Creation** - AI-powered Azure Function for generating comprehensive physical therapy case studies

## 🎯 Overview

This Azure Function provides an **AI-powered case generation endpoint** that creates comprehensive physical therapy case studies from minimal input anchors. The system leverages OpenAI's GPT-4 to generate realistic patient scenarios with complete SOAP documentation, assessment findings, and treatment plans.

## 🚀 Function Endpoint

### **POST** `/api/generate-case`

Generates a complete PT case study from provided clinical anchors.

#### **Request Body**

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

#### **Response Structure**

Returns a complete case JSON with:

- **Meta, snapshot, history, findings** - Patient demographics and clinical data
- **Encounters.eval** - Complete SOAP documentation
- **Normalized enums** - Plan frequency/duration properly formatted
- **Preselected regions** - Objective assessment tables configured

```json
{
  "id": "case_shoulder_tendinopathy_001",
  "title": "Office Worker - Shoulder Pain",
  "latestVersion": 0,
  "caseObj": {
    "meta": { "title": "...", "setting": "Outpatient", "regions": ["shoulder"] },
    "snapshot": { "name": "...", "age": 42, "sex": "Female" },
    "history": { "chief_complaint": "...", "hpi": "...", "pain": {...} },
    "findings": { "vitals": {...}, "rom": {...}, "mmt": {...} },
    "encounters": {
      "eval": {
        "subjective": { "chiefComplaint": "...", "historyOfPresentIllness": "..." },
        "objective": { "inspection": {...}, "regionalAssessments": {...} },
        "assessment": { "primaryImpairments": "...", "ptDiagnosis": "..." },
        "plan": { "goalsTable": {...}, "exerciseTable": {...} },
        "billing": { "diagnosisCodes": [...], "billingCodes": [...] }
      }
    }
  }
}
```

## 🔧 Local Development

### **Prerequisites**

- Node.js 18+ with npm
- Azure Functions Core Tools v4
- OpenAI API key (for AI generation)

### **Setup Instructions**

```powershell
# Install Azure Functions Core Tools globally
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Navigate to function directory
cd azure-function

# Start the function locally
func start
```

The function will be available at: `http://localhost:7071/api/generate-case`

- **CORS Enabled**: For local development with the frontend
- **Auto-reload**: Function updates automatically during development

### **Frontend Configuration**

Configure the PT EMR Simulator to use the local endpoint:

```html
<!-- Meta tag configuration -->
<meta name="ai-generate-url" content="http://localhost:7071/api/generate-case" />
```

```javascript
// Global variable
window.AI_GENERATE_URL = 'http://localhost:7071/api/generate-case';

// localStorage option
localStorage.setItem('aiGenerateUrl', 'http://localhost:7071/api/generate-case');
```

### **Testing the Function**

**PowerShell:**

```powershell
$body = @{
    title = "Test Shoulder Case"
    region = "shoulder"
    condition = "Rotator cuff tendinopathy"
    age = 42
    sex = "female"
    pain = 6
    goal = "Return to overhead lifting"
    setting = "Outpatient"
    acuity = "subacute"
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:7071/api/generate-case' -Method POST -ContentType 'application/json' -Body $body
```

**In Application:**

1. Navigate to **Instructor Cases** → **"Generate from Prompt"**
2. Fill the generation form with clinical anchors
3. Click **Generate** - App calls AI endpoint first, falls back to local generator if unreachable

## 🧠 AI Generation Features

### **Intelligent Case Creation**

- **Patient Demographics**: Realistic age-appropriate names and backgrounds
- **Clinical History**: Comprehensive chief complaint, HPI, and past medical history
- **Assessment Findings**: Detailed ROM, MMT, special tests, and palpation findings
- **SOAP Documentation**: Complete subjective, objective, assessment, and plan sections
- **Evidence-Based Treatment**: Realistic goals, exercises, and patient education

### **Quality Assurance**

- **Clinical Accuracy**: Findings consistent with diagnosis and patient presentation
- **Professional Language**: Appropriate medical terminology and documentation style
- **Data Validation**: Output validated against PT EMR Simulator schema
- **Comprehensive Coverage**: All required sections populated with realistic data

## 🚀 Deployment

### **Azure Deployment**

```powershell
# Deploy to Azure Functions
func azure functionapp publish <your-function-app-name>

# Configure production environment variables
az functionapp config appsettings set \
  --name <your-function-app-name> \
  --resource-group <your-resource-group> \
  --settings OPENAI_API_KEY="your-production-key"
```

### **Production Configuration**

Update the frontend meta tag with your deployed URL:

```html
<meta
  name="ai-generate-url"
  content="https://your-function-app.azurewebsites.net/api/generate-case"
/>
```

## 🔒 Security & Configuration

### **Environment Variables**

| Variable                   | Description                          | Required |
| -------------------------- | ------------------------------------ | -------- |
| `OPENAI_API_KEY`           | Your OpenAI API key for GPT-4 access | ✅ Yes   |
| `AzureWebJobsStorage`      | Azure Storage connection string      | ✅ Yes   |
| `FUNCTIONS_WORKER_RUNTIME` | Set to "node"                        | ✅ Yes   |

### **Function Configuration**

- **Runtime**: Node.js 18+
- **Trigger**: HTTP POST
- **Authorization Level**: Anonymous (for development), Function (for production)
- **Timeout**: 5 minutes (accommodates AI generation time)
- **CORS**: Enabled for frontend integration

## 🤝 Integration Workflow

The function integrates seamlessly with the PT EMR Simulator:

1. **Faculty Access**: Navigate to Instructor Dashboard → Cases
2. **Case Generation**: Use "Generate from Prompt" with clinical anchors
3. **AI Processing**: Function calls OpenAI API to generate comprehensive case
4. **Fallback System**: Local generator used if AI endpoint is unavailable
5. **Customization**: Faculty can edit and refine generated cases
6. **Publishing**: Save cases to manifest system for student use

## 📚 Development Notes

- **Modern Architecture**: ES6+ JavaScript with async/await patterns
- **Error Handling**: Comprehensive error catching and user-friendly responses
- **Performance**: Optimized for quick response times despite AI processing
- **Maintainability**: Clean function structure with separation of concerns
- **Testing**: Built-in testing capabilities for development and production
