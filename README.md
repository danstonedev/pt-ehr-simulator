# PT EMR Simulator — Modern Physical Therapy Electronic Medical Record

> **Professional-grade Physical Therapy documentation simulator with comprehensive SOAP workflow, advanced regional assessments, and embedded clinical cases. Built as a modern pure frontend application with contemporary theming system.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-GitHub_Pages-blue?style=for-the-badge)](https://danstonedev.github.io/pt-ehr-simulator/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Built with TypeScript](https://img.shields.io/badge/Built%20with-Vanilla%20JS%20ES6+-yellow?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## ✨ Features & Capabilities

### 🏥 **Professional SOAP Documentation**

- **Complete clinical workflow**: Subjective, Objective, Assessment, Plan
- **Advanced pain assessment**: Multiple pain scales, pattern tracking, functional impact
- **Comprehensive history taking**: HPI, PMH, medications, red flag screening
- **Evidence-based assessment**: ICF framework integration with clinical reasoning

### 🎯 **Advanced Regional Assessments**

- **Dynamic body region selection**: Shoulder, cervical spine, lumbar spine, and more
- **Comprehensive measurement tools**: ROM, MMT, PROM with standardized scales
- **Special testing protocols**: Region-specific orthopedic tests with interpretation
- **Professional documentation**: Standardized forms with validation and notes

### 💼 **Professional Practice Management**

- **ICD-10 & CPT coding**: Comprehensive billing with units and time tracking
- **SMART goals framework**: Evidence-based goal setting with measurable outcomes
- **Exercise prescription**: Structured therapeutic exercise documentation
- **Word document export**: Professional report generation for completed notes

### 🎓 **Educational Excellence**

- **Faculty dashboard**: Complete case creation and management tools
- **Student practice environment**: Clean, distraction-free documentation interface
- **Embedded clinical cases**: Tennis player shoulder pain, office worker cervical radiculopathy
- **Answer key system**: Faculty-created reference materials for learning

### 🎨 **Modern User Experience**

- **Light & Dark themes**: Professional theming with consistent brand identity
- **Responsive design**: Works seamlessly across desktop, tablet, and mobile
- **Accessibility focused**: WCAG compliant with keyboard navigation and screen reader support
- **Pure frontend architecture**: No server setup required, runs entirely in browser

## 🚀 Quick Start

> **No installation required!** This application runs entirely in your browser with zero setup complexity.

### 🌐 **Option 1: Use Live Demo (Recommended)**

**[🔗 Open PT EMR Simulator](https://danstonedev.github.io/pt-ehr-simulator/)**

The application is deployed on GitHub Pages and ready to use immediately.

### 💻 **Option 2: Run Locally**

**PowerShell (Windows) - Recommended:**

```powershell
# Clone the repository
git clone https://github.com/danstonedev/pt-ehr-simulator.git
cd pt-ehr-simulator

# Launch the application (serves app/ directory)
./start_servers_simple.ps1

# Open http://localhost:3000 in your browser
```

**Python HTTP Server:**

```bash
cd app
python -m http.server 3000
# Open http://localhost:3000
```

**VS Code Live Server Extension:**

1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Open the project in VS Code
3. Right-click `app/index.html` → **"Open with Live Server"**

### 🎯 **Getting Started**

1. **Faculty Users**: Navigate to **Faculty Dashboard** to create cases or view embedded examples
2. **Students**: Visit **Student Dashboard** to practice documentation with provided cases
3. **Demo Cases**: Two professional cases are included:
   - 🎾 **Tennis Player - Shoulder Pain** (Impingement syndrome)
   - 💻 **Office Worker - Cervical Radiculopathy** (C6 nerve root)

### 🔧 **Troubleshooting**

If you don't see the embedded cases in Faculty Dashboard:

1. Open browser developer console (F12)
2. Run: `ptStore.forceReloadCases()`
3. Refresh the page

This clears the storage adapter cache (browser storage) and reloads cases from the manifest.

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
│   │   ├── store.js                 # Browser storage via storage adapter (data management)
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
└── .github/workflows/               # GitHub Actions workflows (CI, deploy)
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
- **store.js**: CRUD operations backed by the storage adapter (browser storage/localStorage)
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

- **Cases**: Stored in browser storage (localStorage) via the storage adapter, with auto-initialization from sample data
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
- **Browser storage via storage adapter**: Robust data management with sample auto-initialization
- **Feature-based organization**: Logical grouping with barrel exports
- **Modern form components**: Object-based API with comprehensive validation
- **Professional error handling**: Appropriate logging for production debugging

Start developing immediately with no environment setup required! 🎉

## 🤖 Optional AI Integration

You can configure an external AI HTTP endpoint (any provider) by setting one of:

- `window.AI_GENERATE_URL` on the page, or
- `<meta name="ai-generate-url" content="https://your-endpoint" />`, or
- Storage key `aiGenerateUrl` (settable via DevTools localStorage; read through the storage adapter)

If not configured, the app uses the built-in deterministic case generator. No external services required.

Note: Legacy Azure Functions sample code has been removed. If you need a server-side endpoint, any HTTP service will work—just provide its URL via one of the mechanisms above.

## 📦 Deployment (GitHub Pages)

- Changes pushed to the main branch are automatically deployed via GitHub Actions.
- The workflow uploads only the `app/` directory artifact to Pages.
- A `.nojekyll` file in `app/` ensures assets are served without Jekyll processing.

If your Pages URL hasn’t updated yet, check the Actions tab for the latest “Deploy static content to Pages” run.
