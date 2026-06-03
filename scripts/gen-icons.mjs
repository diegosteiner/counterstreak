// Generates simple maskable PWA icons (solid background + a "+" glyph) as PNGs.
// Run with: node scripts/gen-icons.mjs
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const BG = [15, 23, 42]; // #0f172a
const FG = [56, 189, 248]; // #38bdf8

/** Encode a raw RGBA buffer as a PNG (color type 6, 8-bit). */
function encodePng(width, height, rgba) {
	const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

	const chunk = (type, data) => {
		const len = Buffer.alloc(4);
		len.writeUInt32BE(data.length, 0);
		const typeBuf = Buffer.from(type, 'ascii');
		const crc = Buffer.alloc(4);
		crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
		return Buffer.concat([len, typeBuf, data, crc]);
	};

	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 6; // color type RGBA
	// 10,11,12 = compression/filter/interlace = 0

	// Add per-scanline filter byte (0 = none).
	const stride = width * 4;
	const raw = Buffer.alloc((stride + 1) * height);
	for (let y = 0; y < height; y++) {
		raw[y * (stride + 1)] = 0;
		rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
	}

	return Buffer.concat([
		sig,
		chunk('IHDR', ihdr),
		chunk('IDAT', zlib.deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0))
	]);
}

function makeIcon(size) {
	const rgba = Buffer.alloc(size * size * 4);
	// Bar geometry for the "+" glyph.
	const thickness = Math.round(size * 0.12);
	const armHalf = Math.round(size * 0.28);
	const c = size / 2;

	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const dx = Math.abs(x - c);
			const dy = Math.abs(y - c);
			const inVBar = dx <= thickness / 2 && dy <= armHalf;
			const inHBar = dy <= thickness / 2 && dx <= armHalf;
			const [r, g, b] = inVBar || inHBar ? FG : BG;
			const i = (y * size + x) * 4;
			rgba[i] = r;
			rgba[i + 1] = g;
			rgba[i + 2] = b;
			rgba[i + 3] = 255;
		}
	}
	return encodePng(size, size, rgba);
}

mkdirSync('static', { recursive: true });
writeFileSync('static/icon-192.png', makeIcon(192));
writeFileSync('static/icon-512.png', makeIcon(512));
console.log('Wrote static/icon-192.png and static/icon-512.png');
