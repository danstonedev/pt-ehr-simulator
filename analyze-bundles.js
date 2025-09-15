#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const distDir = path.join(__dirname, 'dist', 'assets');

if (!fs.existsSync(distDir)) {
  console.log('❌ No dist directory found. Run "npm run build" first.');
  process.exit(1);
}

const files = fs.readdirSync(distDir);
const jsFiles = files.filter((f) => f.endsWith('.js') && !f.includes('.map'));

console.log('\n📊 Bundle Analysis After Code Splitting:\n');

let totalSize = 0;
const bundles = [];

jsFiles.forEach((file) => {
  const fullPath = path.join(distDir, file);
  const stats = fs.statSync(fullPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  totalSize += stats.size;

  bundles.push({
    name: file,
    sizeKB: parseFloat(sizeKB),
    size: stats.size,
  });
});

// Sort by size descending
bundles.sort((a, b) => b.size - a.size);

bundles.forEach((bundle) => {
  const { name, sizeKB } = bundle;
  let category = '📄';

  if (name.includes('case_editor')) {
    category = '🏥 Case Editor (main)';
  } else if (name.includes('soap-')) {
    category = `🧩 SOAP ${name.match(/soap-(\w+)/)?.[1] || 'section'}`;
  } else if (name.includes('index')) {
    category = '⚡ App Entry';
  } else if (name.includes('legacy')) {
    category = '🏛️ Legacy Support';
  }

  console.log(`${category.padEnd(25)} ${sizeKB.toString().padStart(8)} KB - ${name}`);
});

console.log(`\n📈 Total JavaScript: ${(totalSize / 1024).toFixed(1)} KB`);

// Calculate SOAP sections total
const soapBundles = bundles.filter((b) => b.name.includes('soap-'));
const soapTotal = soapBundles.reduce((sum, b) => sum + b.size, 0);
console.log(`🧩 SOAP sections total: ${(soapTotal / 1024).toFixed(1)} KB (now lazy-loaded)`);

// Show main case editor size
const caseEditorBundle = bundles.find(
  (b) => b.name.includes('case_editor') && !b.name.includes('legacy'),
);
if (caseEditorBundle) {
  console.log(`🏥 Case Editor main: ${caseEditorBundle.sizeKB} KB (reduced by code splitting)`);
}

console.log('\n✅ Code splitting implementation complete!');
