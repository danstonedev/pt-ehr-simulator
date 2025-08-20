# PT EMR Simulator — Pure Frontend Application (Single-source in app/)

A comprehensive Physical Therapy Electronic Medical Record simulator built as a **pure frontend application** with no backend dependencies.

## ✨ Features

- **Faculty Mode**: Create and develop case content with integrated metadata editor
- **Student Mode**: Practice on existing cases with clean interface
- **SOAP Documentation**: Complete Subjective, Objective, Assessment, Plan workflow
- **Billing Integration**: Professional ICD-10 and CPT code management
- **Pure Frontend**: No backend required - uses localStorage for data persistence

## 🚀 Quick Start

### Option 1: Root launcher (serves app/)

PowerShell (Windows):

```powershell
./start_servers_simple.ps1
# Open http://localhost:3000
```

### Option 2: Simple Python server from app/

```bash
cd app
python -m http.server 3000
# Open http://localhost:3000
```

### Option 3: VS Code Live Server

1. Install Live Server extension in VS Code
2. Right-click `app/index.html`
3. Select "Open with Live Server"

### Option 4: App-level PowerShell script

```powershell
cd app
./start_servers_simple.ps1
```

## 📁 Project Structure

```text
app/  ← single source of truth for the site
├── index.html                       # Main application entry
├── start_servers_simple.ps1         # Simple startup script
├── .nojekyll                        # Ensure GH Pages serves as static app
├── css/                             # Stylesheets & print styles
├── js/                              # Modular JavaScript application
│   ├── core/                        # Core application logic
│   │   ├── router.js                # Client-side routing system
│   │   ├── store.js                 # localStorage-based data management
│   │   ├── schema.js                # Data validation & migration
│   │   └── index.js                 # Core module barrel export
│   ├── features/                    # Feature-based organization
│   │   ├── case-management/         # Case initialization & management
│   │   ├── navigation/              # Chart navigation & headers
│   │   ├── soap/                    # SOAP documentation modules
│   │   │   ├── subjective/          # Subjective assessment
│   │   │   ├── objective/           # Objective measurements & tests
│   │   │   ├── assessment/          # Clinical assessment & diagnosis
│   │   │   ├── plan/                # Treatment planning & goals
│   │   │   └── billing/             # ICD-10 & CPT code management
│   │   └── index.js                 # Features barrel export
│   ├── modules/                     # Shared utility modules
│   │   ├── GoalLinker.js            # Deprecated stub (safe no-op)
│   ├── features/soap/objective/EditableTable.js  # Standardized editable table used across app
│   ├── services/                    # External service integrations
│   │   └── document-export.js       # Word document generation
│   ├── ui/                          # User interface components
│   │   ├── components.js            # Reusable UI elements
│   │   ├── form-components.js       # Form input components
│   │   ├── utils.js                 # DOM manipulation utilities
│   │   └── Icons.js                 # SVG icon system
│   └── views/                       # Route handlers & page components
│       ├── student/                 # Student-specific views
│       ├── instructor/              # Faculty-specific views
│       └── case_editor.js           # Main case editing interface
└── data/                            # Initial sample data (optional)

Repository root
├── start_servers_simple.ps1         # Delegates to app/start_servers_simple.ps1
└── .github/workflows/static.yml     # GitHub Pages deployment (publishes app/)
```

## 🏗️ Architecture & Code Organization

### Modern Modular Design

- **Feature-based organization**: Related functionality grouped together
- **Barrel exports**: Simplified imports with `index.js` entry points
- **Separation of concerns**: Core, UI, features, and services clearly separated
- **ES6 modules**: Modern JavaScript with clean import/export patterns

### Key Architectural Benefits

- **Maintainable**: Easy to locate and modify specific functionality
- **Scalable**: New features can be added without restructuring
- **Testable**: Modular design supports unit and integration testing
- **Developer-friendly**: Clear naming conventions and organized structure

## 🔧 Development

### Data Storage

- **Cases**: Stored in localStorage with automatic sample data initialization
- **Drafts**: Student work saved locally per case/encounter
- **Faculty Mode**: Case content saves directly to case object (answer keys)
- **Student Mode**: Draft work saved separately from case content

### Key Routes

- `#/instructor/cases` - Faculty case management
- `#/instructor/editor?case=new` - Faculty case creation with integrated metadata
- `#/student/cases` - Student case list
- `#/student/editor?case=ID` - Student practice interface

### Faculty vs Student Workflows

- **Faculty**: Integrated case creation with metadata panel + SOAP content
- **Students**: Clean practice interface with existing case content

## 🎯 No Backend Required

This application runs entirely in the browser:

- ✅ No server setup complexity
- ✅ No database configuration
- ✅ No Python/Node.js environment issues
- ✅ Works on static hosting (e.g., GitHub Pages)
- ✅ Perfect for demos and development

## 💡 Architecture Benefits

- **Instant startup** - no backend server delays
- **Zero dependencies** - works with any HTTP server
- **Portable** - runs anywhere that serves static files
- **Development friendly** - hot reload with Live Server
- **Production ready** - can be hosted on CDN/static hosting

## 🔄 Recent Migration

This version eliminates the previous FastAPI/Azure Functions backend complexity:

- ✅ All CRUD operations now use localStorage
- ✅ Case management handled client-side
- ✅ Draft system preserves student work
- ✅ Sample data auto-initializes on first run
- ✅ Faculty can create complete case content (answer keys)

Start developing immediately with no environment setup! 🎉

Optional AI endpoint
- You can configure an external AI HTTP endpoint (any provider) by setting one of:
	- window.AI_GENERATE_URL on the page, or
	- <meta name="ai-generate-url" content="https://your-endpoint" />, or
	- localStorage key aiGenerateUrl
- If not set, the app falls back to the built-in deterministic generator. No serverless provider is required.

## 📦 Deployment (GitHub Pages)

- Changes pushed to the main branch are automatically deployed via GitHub Actions.
- The workflow uploads only the `app/` directory artifact to Pages.
- A `.nojekyll` file in `app/` ensures assets are served without Jekyll processing.

If your Pages URL hasn’t updated yet, check the Actions tab for the latest “Deploy static content to Pages” run.
