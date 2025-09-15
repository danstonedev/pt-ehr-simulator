import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🌳 Quick Tree Shaking Analysis\n');

const APP_DIR = path.join(__dirname, '..', 'app', 'js');
console.log('Analyzing directory:', APP_DIR);

function findJSFiles(dir) {
  const files = [];
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        scan(itemPath);
      } else if (item.endsWith('.js') && !item.includes('.test.') && !item.includes('.spec.')) {
        files.push(itemPath);
      }
    }
  }
  scan(dir);
  return files;
}

function parseExports(content) {
  const exports = new Set();

  // Named exports: export function name() {} or export const name =
  const namedExports = content.matchAll(
    /export\s+(?:function|const|let|var|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
  );
  for (const match of namedExports) {
    exports.add(match[1]);
  }

  // Export { name1, name2 }
  const braceExports = content.matchAll(/export\s*{\s*([^}]+)\s*}/g);
  for (const match of braceExports) {
    const names = match[1].split(',').map((n) => n.trim().split(' as ')[0].trim());
    names.forEach((name) => exports.add(name));
  }

  return exports;
}

function parseImports(content) {
  const imports = new Set();

  // import { name1, name2 } from './module'
  const namedImports = content.matchAll(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"]/g);
  for (const match of namedImports) {
    const names = match[1].split(',').map((n) => n.trim().split(' as ')[0].trim());
    names.forEach((name) => imports.add(name));
  }

  // import name from './module' (default imports)
  const defaultImports = content.matchAll(
    /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s*['"]([^'"]+)['"]/g,
  );
  for (const match of defaultImports) {
    imports.add('default');
  }

  return imports;
}

// Main analysis
const jsFiles = findJSFiles(APP_DIR);
console.log(`Found ${jsFiles.length} JavaScript files\n`);

const allExports = new Map();
const allImports = new Set();

// Parse all files
for (const filePath of jsFiles) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const exports = parseExports(content);
    const imports = parseImports(content);

    if (exports.size > 0) {
      const relativePath = path.relative(APP_DIR, filePath);
      allExports.set(relativePath, exports);
    }

    imports.forEach((imp) => allImports.add(imp));
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

console.log('📊 Export Analysis:');
for (const [file, exports] of allExports) {
  console.log(`\n${file}:`);
  for (const exportName of exports) {
    const isUsed = allImports.has(exportName);
    const status = isUsed ? '✅ Used' : '⚠️  Potentially unused';
    console.log(`  ${exportName.padEnd(20)} ${status}`);
  }
}

console.log(
  `\nTotal exports found: ${Array.from(allExports.values()).reduce((sum, exports) => sum + exports.size, 0)}`,
);
console.log(`Total imports found: ${allImports.size}`);
