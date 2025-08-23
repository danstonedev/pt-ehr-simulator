# PT EMR Sim - Modernized Physical Therapy Electronic Medical Record Simulator (2025)

This workspace contains a comprehensive PT EMR simulation application featuring:

- **Pure frontend architecture** with zero backend dependencies (port 3000)
- **Modern JavaScript patterns** with ES6+ throughout, no legacy compatibility
- **Professional SOAP documentation** with integrated case creation workflow
- **Advanced regional assessments** with ROM, MMT, PROM, and special tests
- **ICF framework integration** for comprehensive clinical assessment
- **Feature-based modular architecture** with clean barrel exports

## Development Context

- **Project Type**: Modern pure frontend web application
- **Technology Stack**: Vanilla JavaScript ES6+, HTML5, CSS3, localStorage persistence
- **Architecture**: Feature-based modular organization with barrel exports
- **Code Standards**: Clean modern patterns, no backward compatibility, professional error handling
- **Data Persistence**: localStorage with auto-initialization and validation
- **Server**: Static file server only (port 3000)

## Core Architecture (`app/js/core/`)

- **router.js** - Client-side routing with dynamic imports and parameter handling
- **store.js** - localStorage-based CRUD operations with data persistence
- **schema.js** - Data validation, integrity checks, and modern migration utilities
- **index.js** - Core module barrel export for simplified imports

## Feature Modules (`app/js/features/`)

- **case-management/CaseInitialization.js** - Modern case loading, draft management, error handling
- **navigation/ChartNavigation.js** - Dynamic navigation with progress tracking
- **navigation/NavigationHeader.js** - Professional sticky navigation components
- **soap/** - Complete SOAP documentation system:
  - **subjective/** - Patient history, pain assessment, functional goals with modern form components
  - **objective/** - Advanced regional assessments (ROM/MMT/PROM/special tests), inspection, palpation
  - **assessment/** - ICF framework (Body Functions, Activity Limitations, Participation Restrictions)
  - **plan/** - SMART goals with editable tables, exercise prescription, patient education
  - **billing/** - Professional ICD-10 & CPT code management with units and time tracking

## UI System (`app/js/ui/`)

- **components.js** - Reusable elements (tabs, cards, modals) with modern patterns
- **form-components.js** - Object-based form API with comprehensive validation
- **utils.js** - Clean DOM manipulation and utility functions
- **Icons.js** - Professional SVG icon system

## Views & Routes (`app/js/views/`)

- **case_editor.js** - Main editing interface with faculty/student/key modes
- **student/** - Student dashboard, case selection, draft management
- **instructor/** - Faculty case creation, management, and answer key development

## Recently Completed (2025 Modernization)

- ✅ **Aggressive modernization**: Eliminated all backward compatibility code
- ✅ **Clean codebase**: Removed debug statements, TODO comments, temporary files
- ✅ **Modern JavaScript**: Object destructuring, async/await, barrel exports throughout
- ✅ **Professional data flow**: Direct field mapping without legacy wrappers
- ✅ **Enhanced regional assessments**: Complete ROM/MMT/PROM/special tests by body region
- ✅ **ICF framework**: Full Body Functions, Activity Limitations, Participation Restrictions
- ✅ **Professional billing**: Comprehensive CPT/ICD-10 with units and time tracking
- ✅ **Case quality validation**: Removed incomplete cases, validated all data structures
- ✅ **Feature-based organization**: Logical module grouping with clean imports

## Development Guidelines

- **Modern patterns only**: Use ES6+ features, object destructuring, async/await
- **Feature-based imports**: Import from barrel exports (`../features/`, `../core/`, `../ui/`)
- **Clean data flow**: Direct object mapping, no string fallbacks or legacy wrappers
- **Professional error handling**: Use console.error/warn appropriately for production
- **Object-based APIs**: Form components and data structures use object parameters
- **No backward compatibility**: Modern code standards enforced throughout

## Data Architecture

- **Case storage**: localStorage with manifest-based loading from `app/data/cases/`
- **Draft management**: Student work isolated from faculty answer keys
- **Regional assessments**: ROM/MMT/PROM/special tests organized by selected body regions
- **Validation**: All data passes through schema validation and integrity checks
- **Modern mapping**: Faculty answer keys → student draft fields with clean transformations

## Startup Instructions

```powershell
# Root level (delegates to app/)
.\start_servers_simple.ps1

# Or from app/ directory
cd app
python -m http.server 3000
```

Access at `http://localhost:3000` - No backend setup required!
