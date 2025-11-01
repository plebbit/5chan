import { readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// Scan for banners
const bannersDir = join(publicDir, 'assets', 'banners');
const banners = readdirSync(bannersDir)
  .filter((file) => /^banner-.*\.(jpg|jpeg|gif|png)$/i.test(file))
  .map((file) => `assets/banners/${file}`);

// Scan for not-found images
const notFoundDir = join(publicDir, 'assets', 'not-found');
const notFoundImages = readdirSync(notFoundDir)
  .filter((file) => /^not-found-.*\.(jpg|jpeg|gif|png)$/i.test(file))
  .map((file) => `assets/not-found/${file}`);

// Generate TypeScript file
const output = `// Auto-generated file - do not edit manually
// Run 'node scripts/generate-asset-manifest.js' to regenerate
// This file is generated from public/assets/ directory

export const BANNERS = ${JSON.stringify(banners, null, 2)} as const;

export const NOT_FOUND_IMAGES = ${JSON.stringify(notFoundImages, null, 2)} as const;
`;

// Ensure directory exists
const generatedDir = join(__dirname, '..', 'src', 'generated');
mkdirSync(generatedDir, { recursive: true });

const outputPath = join(generatedDir, 'asset-manifest.ts');
writeFileSync(outputPath, output, 'utf8');

console.log(`✅ Generated asset manifest with ${banners.length} banners and ${notFoundImages.length} not-found images`);
