#!/usr/bin/env node
/**
 * generate-design-tokens.mjs
 * Scans CSS files under ./app/css for custom properties and emits/updates design-tokens.generated.json.
 *
 * Heuristics:
 *  - Collect lines containing `--foo-bar:` inside a rule block.
 *  - Ignore var() fallback resolution; store raw value trimmed to ;
 *  - Categorize by prefix buckets: color.*, layout.*, font.size.*, radius.*, elevation.*, zindex.*, role.*, sidebar.*, dark.*
 *  - Existing manually curated design-tokens.json (root) is merged first; script only adds new tokens not present.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CSS_DIR = path.join(ROOT, 'app', 'css');
const MANUAL_FILE = path.join(ROOT, 'design-tokens.json');
const OUTPUT_FILE = path.join(ROOT, 'design-tokens.generated.json');

async function readRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await readRecursive(full)));
    else if (e.isFile() && e.name.endsWith('.css')) files.push(full);
  }
  return files;
}

function classify(name) {
  if (name.startsWith('--und-'))
    return 'color.brand.' + name.replace(/^--und-/, '').replace(/-/g, '.');
  if (name.startsWith('--bg')) return 'color.surface.' + name.replace(/^--/, '').replace(/-/g, '.');
  if (name.startsWith('--panel'))
    return 'color.surface.' + name.replace(/^--/, '').replace(/-/g, '.');
  if (name.startsWith('--surface-light'))
    return 'color.surface.base' + name.replace('--surface-light', '').replace(/-/g, '.');
  if (name.startsWith('--color-border')) return 'color.border.base';
  if (name.startsWith('--text-secondary')) return 'color.text.secondary';
  if (name.startsWith('--text')) return 'color.text.primary';
  if (name.startsWith('--font-')) return 'font.size.' + name.replace('--font-', '');
  if (name.startsWith('--radius-')) return 'radius.' + name.replace('--radius-', '');
  if (name.startsWith('--sidebar-'))
    return 'sidebar.' + name.replace('--sidebar-', '').replace(/-/g, '.');
  if (name.startsWith('--role-')) return 'role.' + name.replace('--role-', '').replace(/-/g, '.');
  if (name.startsWith('--z-')) return 'zindex.' + name.replace('--z-', '').replace(/-/g, '.');
  if (name.startsWith('--topbar-h')) return 'layout.topbar.height';
  if (name.startsWith('--sidebar-w')) return 'layout.sidebar.width';
  if (name.startsWith('--elev-'))
    return 'elevation.' + name.replace('--elev-', '').replace(/-/g, '.');
  return 'misc.' + name.replace(/^--/, '').replace(/-/g, '.');
}

function normalizeValue(v) {
  return v
    .replace(/!important/g, '')
    .replace(/var\([^)]*\)/g, (m) => m) // keep var() as-is
    .trim();
}

async function parseCssVariables(file) {
  const text = await fs.readFile(file, 'utf8');
  const vars = [];
  const varRegex = /--[a-z0-9-_]+\s*:[^;]+;/gi;
  const matches = text.match(varRegex) || [];
  for (const decl of matches) {
    const [rawName, ...rest] = decl.split(':');
    const name = rawName.trim();
    const value = normalizeValue(rest.join(':').replace(/;$/, '').trim());
    vars.push({ name, value });
  }
  return vars;
}

async function loadManual() {
  try {
    const json = JSON.parse(await fs.readFile(MANUAL_FILE, 'utf8'));
    return json.props || {};
  } catch (e) {
    return {};
  }
}

function mergeTokens(base, discovered) {
  const out = { ...base };
  for (const { name, value } of discovered) {
    const key = classify(name);
    if (out[key]) continue; // do not override manual curation
    out[key] = { value, type: inferType(key, value) };
  }
  return out;
}

function inferType(key, value) {
  if (/color|gradient|fg|bg|border/.test(key) || /#|rgb|hsl|gradient/.test(value)) return 'color';
  if (/font.size/.test(key)) return 'fontSize';
  if (/radius/.test(key)) return 'borderRadius';
  if (/zindex/.test(key)) return 'number';
  if (/elevation/.test(key)) return 'shadow';
  if (/layout\./.test(key)) return 'sizing';
  return 'other';
}

async function main() {
  const manual = await loadManual();
  const cssFiles = await readRecursive(CSS_DIR);
  const discovered = [];
  for (const f of cssFiles) {
    const vars = await parseCssVariables(f);
    discovered.push(...vars);
  }
  const merged = mergeTokens(manual, discovered);
  const output = {
    meta: {
      generated: new Date().toISOString(),
      source: 'scripts/generate-design-tokens.mjs',
      cssFiles: cssFiles.map((f) => path.relative(ROOT, f)),
    },
    props: merged,
  };
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(
    `Generated ${Object.keys(merged).length} tokens -> ${path.relative(ROOT, OUTPUT_FILE)}`,
  );
}

main().catch((err) => {
  console.error('Token generation failed:', err);
  process.exit(1);
});
