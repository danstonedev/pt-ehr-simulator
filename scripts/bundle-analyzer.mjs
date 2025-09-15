import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeBundles() {
  const distDir = path.join(__dirname, '..', 'dist', 'assets');
  const files = fs.readdirSync(distDir);

  // Group files by type
  const jsFiles = files.filter((f) => f.endsWith('.js') && !f.endsWith('.map'));
  const cssFiles = files.filter((f) => f.endsWith('.css'));
  const otherFiles = files.filter(
    (f) => !f.endsWith('.js') && !f.endsWith('.css') && !f.endsWith('.map'),
  );

  console.log('\n📊 Bundle Analysis Report');
  console.log('========================\n');

  // JavaScript bundles
  console.log('🎯 JavaScript Bundles:');
  const jsAnalysis = jsFiles
    .map((file) => {
      const filePath = path.join(distDir, file);
      const stats = fs.statSync(filePath);
      return { file, size: stats.size, type: getChunkType(file) };
    })
    .sort((a, b) => b.size - a.size);

  let totalJSSize = 0;
  jsAnalysis.forEach(({ file, size, type }) => {
    totalJSSize += size;
    console.log(`  ${file.padEnd(40)} ${formatBytes(size).padStart(10)} (${type})`);
  });

  console.log(`  ${''.padEnd(40)} ${'----------'.padStart(10)}`);
  console.log(`  ${'TOTAL JS'.padEnd(40)} ${formatBytes(totalJSSize).padStart(10)}\n`);

  // CSS bundles
  console.log('🎨 CSS Bundles:');
  let totalCSSSize = 0;
  cssFiles.forEach((file) => {
    const filePath = path.join(distDir, file);
    const stats = fs.statSync(filePath);
    totalCSSSize += stats.size;
    console.log(`  ${file.padEnd(40)} ${formatBytes(stats.size).padStart(10)}`);
  });
  console.log(`  ${'TOTAL CSS'.padEnd(40)} ${formatBytes(totalCSSSize).padStart(10)}\n`);

  // Other assets
  console.log('🖼️  Other Assets:');
  let totalOtherSize = 0;
  otherFiles.forEach((file) => {
    const filePath = path.join(distDir, file);
    const stats = fs.statSync(filePath);
    totalOtherSize += stats.size;
    console.log(`  ${file.padEnd(40)} ${formatBytes(stats.size).padStart(10)}`);
  });
  console.log(`  ${'TOTAL OTHER'.padEnd(40)} ${formatBytes(totalOtherSize).padStart(10)}\n`);

  // Summary
  const grandTotal = totalJSSize + totalCSSSize + totalOtherSize;
  console.log('📈 Summary:');
  console.log(
    `  JavaScript: ${formatBytes(totalJSSize)} (${((totalJSSize / grandTotal) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  CSS:        ${formatBytes(totalCSSSize)} (${((totalCSSSize / grandTotal) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  Other:      ${formatBytes(totalOtherSize)} (${((totalOtherSize / grandTotal) * 100).toFixed(1)}%)`,
  );
  console.log(`  Total:      ${formatBytes(grandTotal)}\n`);

  // Tree shaking insights
  console.log('🌳 Tree Shaking Insights:');
  const modernJS = jsAnalysis
    .filter(({ file }) => !file.includes('-legacy-'))
    .reduce((sum, { size }) => sum + size, 0);
  const legacyJS = jsAnalysis
    .filter(({ file }) => file.includes('-legacy-'))
    .reduce((sum, { size }) => sum + size, 0);

  console.log(`  Modern bundles: ${formatBytes(modernJS)}`);
  console.log(`  Legacy bundles: ${formatBytes(legacyJS)}`);
  console.log(
    `  Legacy overhead: ${formatBytes(legacyJS - modernJS)} (${(((legacyJS - modernJS) / modernJS) * 100).toFixed(1)}%)\n`,
  );

  // Largest chunks
  console.log('🎯 Optimization Opportunities:');
  const largeChunks = jsAnalysis.filter(({ size }) => size > 50000).slice(0, 3);
  largeChunks.forEach(({ file, size, type }) => {
    console.log(`  • ${file} (${formatBytes(size)}) - Consider code splitting for ${type}`);
  });
}

function getChunkType(filename) {
  if (filename.includes('case_editor')) return 'Case Editor';
  if (filename.includes('cases')) return 'Cases View';
  if (filename.includes('index')) return 'Main Entry';
  if (filename.includes('polyfills')) return 'Polyfills';
  if (filename.includes('home')) return 'Home View';
  if (filename.includes('drafts')) return 'Drafts View';
  if (filename.includes('utils')) return 'Utilities';
  if (filename.includes('preview')) return 'Preview View';
  if (filename.includes('notfound')) return '404 View';
  return 'Unknown';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

analyzeBundles();
