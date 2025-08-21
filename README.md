# PT EMR Simulator — Modernized Pure Frontend Application

A comprehensive Physical Therapy Electronic Medical Record simulator built as a **modern pure frontend application** with no backend dependencies. Recently modernized with aggressive cleanup and contemporary JavaScript patterns.

## ✨ Features

- **Professional SOAP Documentation**: Complete Subjective, Objective, Assessment, Plan workflow
- **Integrated Case Management**: Faculty create complete cases with embedded metadata
- **Student Practice Environment**: Clean interface for practicing documentation
- **Advanced Regional Assessments**: ROM, MMT, PROM, and special tests by body region
- **Professional Billing**: Comprehensive ICD-10 and CPT code management with units
- **ICF Framework**: Complete Body Functions, Activity Limitations, Participation Restrictions
- **SMART Goals**: Evidence-based goal setting with measurable outcomes
- **Word Export**: Professional document generation for completed notes
- **Pure Frontend Architecture**: Zero backend dependencies, runs entirely in browser

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

## 🏗️ Modern Architecture & Organization

### Clean Modular Design (2025)

- **Feature-based organization**: SOAP modules, navigation, case management grouped logically  
- **Modern ES6+ patterns**: Object destructuring, barrel exports, async/await throughout
- **No legacy code**: Aggressive modernization with backward compatibility eliminated
- **Professional error handling**: Appropriate console.error/warn for production debugging
- **Clean data flow**: Direct field mapping without wrapper patterns

### Core Application (`app/js/core/`)

- **router.js**: Client-side routing with dynamic imports and parameter handling
- **store.js**: localStorage-based CRUD operations with data persistence  
- **schema.js**: Data validation, integrity checks, and migration utilities
- **index.js**: Core module barrel export for simplified imports

### Feature Modules (`app/js/features/`)

- **case-management/**: Case initialization, draft management, error handling
- **navigation/**: Dynamic chart navigation with progress tracking
- **soap/**: Complete SOAP documentation system
  - `subjective/`: Patient history, pain assessment, functional goals
  - `objective/`: Regional assessments (ROM/MMT/PROM/tests), inspection, palpation
  - `assessment/`: ICF framework, clinical reasoning, PT diagnosis
  - `plan/`: SMART goals, exercise prescription, patient education
  - `billing/`: Professional ICD-10 & CPT code management with units

### UI Components (`app/js/ui/`)

- **Modern form components**: Object-based API with comprehensive validation
- **Reusable elements**: Tabs, cards, modals with consistent styling
- **Professional icons**: Comprehensive SVG icon system
- **DOM utilities**: Clean element creation and manipulation helpers

### Key Architectural Benefits

- **Maintainable**: Easy to locate and modify specific functionality
- **Modern**: Contemporary JavaScript patterns and clean code standards
- **Scalable**: New features integrate seamlessly with existing patterns
- **Professional**: Production-ready error handling and data validation

## 🔧 Development & Data Management

### Modern Data Architecture

- **Cases**: Stored in localStorage with auto-initialization from sample data
- **Student Drafts**: Isolated practice work saved separately per case/encounter
- **Faculty Answer Keys**: Complete case content with integrated metadata editing
- **Regional Assessments**: ROM, MMT, PROM, and special tests organized by body region
- **Professional Validation**: Data integrity checks and migration utilities

### Key Application Routes

- `#/instructor/cases` - Faculty case management dashboard
- `#/instructor/editor?case=new` - Integrated case creation with metadata panel
- `#/instructor/editor?case=ID&key=true` - Faculty answer key editing mode
- `#/student/cases` - Student case selection and draft management
- `#/student/editor?case=ID` - Student practice documentation interface

### Faculty vs Student Experience

- **Faculty Mode**: Complete case development with metadata, SOAP content, and answer keys
- **Student Mode**: Clean practice interface focusing on documentation skills
- **Key Mode**: Read-only view of faculty answer keys for reference

## 🎯 Pure Frontend Benefits

This modernized application runs entirely in the browser with contemporary patterns:

- ✅ **Zero setup complexity** - no server environment required
- ✅ **Modern JavaScript** - ES6+ patterns with object destructuring
- ✅ **Professional architecture** - feature-based organization
- ✅ **Clean codebase** - no legacy compatibility code
- ✅ **Instant development** - works with any static server
- ✅ **Production ready** - can be hosted on any CDN or static hosting

## 🔄 2025 Modernization

This version represents a comprehensive modernization and cleanup:

### Major Improvements

- ✅ **Aggressive modernization**: Eliminated all backward compatibility code
- ✅ **Clean codebase**: Removed debug statements, TODO comments, and temporary files  
- ✅ **Modern JavaScript**: ES6+ patterns with object destructuring throughout
- ✅ **Professional data flow**: Direct field mapping without legacy wrappers
- ✅ **Enhanced SOAP modules**: Complete regional assessments with ROM/MMT/PROM/tests
- ✅ **ICF framework integration**: Body Functions, Activity Limitations, Participation Restrictions
- ✅ **Professional billing**: Comprehensive ICD-10 and CPT codes with proper units
- ✅ **Case quality**: Removed incomplete cases, validated complete data structures

### Technical Architecture

- **Pure frontend approach**: No backend complexity, runs entirely in browser
- **localStorage persistence**: Robust data management with sample auto-initialization  
- **Feature-based organization**: Logical grouping with barrel exports
- **Modern form components**: Object-based API with comprehensive validation
- **Professional error handling**: Appropriate logging for production debugging

Start developing immediately with no environment setup required! 🎉

## 🤖 Optional AI Integration

You can configure an external AI HTTP endpoint (any provider) by setting one of:

- `window.AI_GENERATE_URL` on the page, or
- `<meta name="ai-generate-url" content="https://your-endpoint" />`, or  
- localStorage key `aiGenerateUrl`

If not configured, the app uses the built-in deterministic case generator. No external services required.

## 📦 Deployment (GitHub Pages)

- Changes pushed to the main branch are automatically deployed via GitHub Actions.
- The workflow uploads only the `app/` directory artifact to Pages.
- A `.nojekyll` file in `app/` ensures assets are served without Jekyll processing.

If your Pages URL hasn’t updated yet, check the Actions tab for the latest “Deploy static content to Pages” run.
