// Rasterizes the maskable PWA icons from scripts/icon.svg.
// Run with: npm run gen-icons
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('./icon.svg', import.meta.url));

for (const size of [192, 512]) {
	const out = fileURLToPath(new URL(`../static/icon-${size}.png`, import.meta.url));
	await sharp(source).resize(size, size).png().toFile(out);
	console.log(`Wrote static/icon-${size}.png`);
}
