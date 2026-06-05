import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';

// Resolve sharp from the pnpm store
const require = createRequire(import.meta.url);
const sharp = require(
  join(process.cwd(), 'node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js')
);

const DIR = join(process.cwd(), 'public/images');
const MAX = 1920; // longest side in px

const kb = (n) => (n / 1024).toFixed(0) + 'KB';
let before = 0;
let after = 0;

for (const file of readdirSync(DIR)) {
  const ext = extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;

  const path = join(DIR, file);
  const input = readFileSync(path);
  const origSize = statSync(path).size;

  let pipeline = sharp(input)
    .rotate() // auto-orient using EXIF, then strip metadata
    .resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });

  if (ext === '.png') {
    pipeline = pipeline.png({ compressionLevel: 9, quality: 80, palette: true });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({ quality: 80 });
  } else {
    pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
  }

  const out = await pipeline.toBuffer();
  writeFileSync(path, out);

  before += origSize;
  after += out.length;
  console.log(`${file.padEnd(48)} ${kb(origSize).padStart(8)} -> ${kb(out.length).padStart(8)}`);
}

console.log('-'.repeat(70));
console.log(`TOTAL ${kb(before)} -> ${kb(after)}  (saved ${(100 - (after / before) * 100).toFixed(1)}%)`);
