// Generate Apple Touch and favicon PNGs from the EMRsim flame SVG
// Requires: sharp (installed as devDependency)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const imgDir = path.join(root, 'app', 'img');
const srcSvg = path.join(imgDir, 'EMRsim-flame.svg');

const targets = [
  { file: 'EMRsim-flame-180.png', size: 180 }, // Apple touch
  // You can add more sizes here if needed
];

async function run() {
  try {
    const svgExists = await fs
      .access(srcSvg)
      .then(() => true)
      .catch(() => false);
    if (!svgExists) {
      console.error('Source SVG not found:', srcSvg);
      process.exitCode = 1;
      return;
    }

    const svgBuffer = await fs.readFile(srcSvg);
    await Promise.all(
      targets.map(async ({ file, size }) => {
        const outPath = path.join(imgDir, file);
        const png = await sharp(svgBuffer, { density: 384 })
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png({ compressionLevel: 9 })
          .toBuffer();
        await fs.writeFile(outPath, png);
        console.log('Wrote', outPath);
      }),
    );
  } catch (err) {
    console.error('Icon generation failed:', err);
    process.exitCode = 1;
  }
}

run();
