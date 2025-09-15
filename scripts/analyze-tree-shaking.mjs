#!/usr/bin/env node

/**
 * Tree Shaking Analysis Script
 * Identifies potentially unused exports across the PT EMR Simulator codebase
 * to help optimize bundle size through better tree shaking.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const APP_DIR = path.join(__dirname, '..', 'app', 'js');
const IGNORE_PATTERNS = [/\.test\./, /\.spec\./, /test-/, /debug-/];

// Collectors
const exports = new Map(); // filename -> Set of exported names
const imports = new Map(); // filename -> Map of imported names -> source file
const allFiles = new Set();
const unusedExports = new Map();

/**
 * Recursively find all JS files
 */
function findJSFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        // Skip test files and other ignore patterns
        if (!IGNORE_PATTERNS.some((pattern) => pattern.test(entry.name))) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Parse exports from a file
 */
function parseExports(content, filePath) {
  const fileExports = new Set();

  // Named exports: export { foo, bar }
  const namedExportMatches = content.matchAll(/export\s*\{\s*([^}]+)\s*\}/g);
  for (const match of namedExportMatches) {
    const names = match[1].split(',').map((name) => {
      // Handle "foo as bar" syntax
      const parts = name.trim().split(/\s+as\s+/);
      return parts[parts.length - 1].trim();
    });
    names.forEach((name) => fileExports.add(name));
  }

  // Direct function/const/class exports
  const directExportMatches = content.matchAll(
    /export\s+(function|const|let|var|class|async\s+function)\s+(\w+)/g,
  );
  for (const match of directExportMatches) {
    fileExports.add(match[2]);
  }

  // Default exports (track as 'default')
  if (content.includes('export default')) {
    fileExports.add('default');
  }

  // Re-exports: export * from './other'
  const reExportAllMatches = content.matchAll(/export\s*\*\s*from\s*['"]([^'"]+)['"]/g);
  for (const match of reExportAllMatches) {
    fileExports.add(`*from:${match[1]}`);
  }

  // Re-exports: export { foo } from './other'
  const reExportNamedMatches = content.matchAll(
    /export\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g,
  );
  for (const match of reExportNamedMatches) {
    const names = match[1].split(',').map((name) =>
      name
        .trim()
        .split(/\s+as\s+/)
        .pop()
        .trim(),
    );
    names.forEach((name) => fileExports.add(`${name}from:${match[2]}`));
  }

  return fileExports;
}

/**
 * Parse imports from a file
 */
function parseImports(content, filePath) {
  const fileImports = new Map();

  // Named imports: import { foo, bar } from './module'
  const namedImportMatches = content.matchAll(
    /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g,
  );
  for (const match of namedImportMatches) {
    const source = match[2];
    const names = match[1].split(',').map((name) => {
      // Handle "foo as bar" syntax - we care about the original name
      const parts = name.trim().split(/\s+as\s+/);
      return parts[0].trim();
    });

    if (!fileImports.has(source)) {
      fileImports.set(source, new Set());
    }
    names.forEach((name) => fileImports.get(source).add(name));
  }

  // Default imports
  const defaultImportMatches = content.matchAll(/import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g);
  for (const match of defaultImportMatches) {
    const source = match[2];
    if (!fileImports.has(source)) {
      fileImports.set(source, new Set());
    }
    fileImports.get(source).add('default');
  }

  // Namespace imports: import * as foo from './module'
  const namespaceImportMatches = content.matchAll(
    /import\s*\*\s*as\s+\w+\s+from\s*['"]([^'"]+)['"]/g,
  );
  for (const match of namespaceImportMatches) {
    const source = match[1];
    if (!fileImports.has(source)) {
      fileImports.set(source, new Set());
    }
    fileImports.get(source).add('*');
  }

  return fileImports;
}

/**
 * Resolve relative imports to absolute file paths
 */
function resolveImportPath(importPath, fromFile) {
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const resolvedPath = path.resolve(path.dirname(fromFile), importPath);

    // Try with .js extension if not present
    if (fs.existsSync(resolvedPath + '.js')) {
      return resolvedPath + '.js';
    }
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }

  // External or unresolvable imports
  return null;
}

/**
 * Main analysis function
 */
function analyzeTreeShaking() {
  console.log('🌳 Analyzing tree shaking opportunities...\n');

  // Find all JS files
  const jsFiles = findJSFiles(APP_DIR);
  console.log(`Found ${jsFiles.length} JavaScript files to analyze\n`);

  // Parse exports and imports
  for (const filePath of jsFiles) {
    allFiles.add(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse exports
    const fileExports = parseExports(content, filePath);
    if (fileExports.size > 0) {
      exports.set(filePath, fileExports);
    }

    // Parse imports
    const fileImports = parseImports(content, filePath);
    if (fileImports.size > 0) {
      imports.set(filePath, fileImports);
    }
  }

  // Find unused exports
  for (const [exportingFile, exportedNames] of exports) {
    const unused = new Set(exportedNames);

    // Check each importing file
    for (const [importingFile, importMap] of imports) {
      for (const [importSource, importedNames] of importMap) {
        const resolvedSource = resolveImportPath(importSource, importingFile);

        if (resolvedSource === exportingFile) {
          // This file imports from the exporting file
          if (importedNames.has('*')) {
            // Namespace import - assume all exports are used
            unused.clear();
            break;
          }

          // Remove used imports from unused set
          for (const importedName of importedNames) {
            unused.delete(importedName);
          }
        }
      }

      if (unused.size === 0) break;
    }

    if (unused.size > 0) {
      // Filter out re-exports which are intentional
      const actualUnused = Array.from(unused).filter(
        (name) => !name.includes('from:') && name !== 'default',
      );

      if (actualUnused.length > 0) {
        unusedExports.set(exportingFile, actualUnused);
      }
    }
  }

  // Generate report
  console.log('📊 TREE SHAKING ANALYSIS REPORT');
  console.log('================================\n');

  if (unusedExports.size === 0) {
    console.log('✅ No unused exports detected! All exports appear to be used.\n');
  } else {
    console.log(`❌ Found potentially unused exports in ${unusedExports.size} files:\n`);

    let totalUnused = 0;
    for (const [filePath, unusedNames] of unusedExports) {
      const relativePath = path.relative(APP_DIR, filePath);
      console.log(`📁 ${relativePath}`);

      for (const name of unusedNames) {
        console.log(`   ❌ ${name}`);
        totalUnused++;
      }
      console.log('');
    }

    console.log(`Total unused exports: ${totalUnused}\n`);
  }

  // Barrel export recommendations
  console.log('📦 BARREL EXPORT ANALYSIS');
  console.log('=========================\n');

  const barrelFiles = Array.from(exports.keys()).filter(
    (file) => path.basename(file) === 'index.js',
  );

  if (barrelFiles.length > 0) {
    console.log('Found barrel export files (index.js):');
    for (const barrel of barrelFiles) {
      const relativePath = path.relative(APP_DIR, barrel);
      const exportedNames = exports.get(barrel);
      console.log(`📦 ${relativePath} - exports ${exportedNames.size} items`);

      // Check if barrel exports are actually used
      let barrelUsageCount = 0;
      for (const [importingFile, importMap] of imports) {
        for (const [importSource, importedNames] of importMap) {
          const resolvedSource = resolveImportPath(importSource, importingFile);
          if (resolvedSource === barrel) {
            barrelUsageCount += importedNames.size;
          }
        }
      }

      console.log(`   Used: ~${barrelUsageCount} imports from this barrel\n`);
    }
  }

  // Recommendations
  console.log('💡 OPTIMIZATION RECOMMENDATIONS');
  console.log('===============================\n');

  if (unusedExports.size > 0) {
    console.log('1. Remove unused exports to enable better tree shaking');
    console.log('2. Consider splitting large modules with mixed usage patterns');
    console.log('3. Use direct imports instead of barrel exports where possible');
  }

  console.log('4. Mark side-effect-free modules in package.json');
  console.log("5. Use Vite's bundle analyzer to visualize the final bundle");
  console.log('6. Consider dynamic imports for large, rarely-used modules');

  console.log('\n✨ Analysis complete! Run `npm run build:analyze` to see bundle composition.');
}

// Run analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeTreeShaking();
}

export { analyzeTreeShaking };
