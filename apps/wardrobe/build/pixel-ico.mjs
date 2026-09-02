/**
 * Turns pixel-art grids into a Windows .ico.
 *
 * Shared by the icon scripts so the PNG and ICO encoders exist once. Node's
 * zlib is all a PNG encoder needs, and an .ico is a small header wrapped
 * around PNG payloads, so neither needs an image library.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

let CRC_TABLE = null;
function crc32(buffer) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let crc = -1;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return crc ^ -1;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // truecolour with alpha
  // Every scanline carries a leading filter byte; 0 means "none".
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y += 1) {
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * `art` is an array of equal-length strings; each character is looked up in
 * `palette` to give [r, g, b, a]. Sizes must be whole-number multiples of the
 * grid, so each source pixel becomes an exact square block with no blurring.
 */
export function writeIco(path, art, palette, sizes) {
  const grid = art.length;
  for (const size of sizes) {
    if (size % grid !== 0) {
      throw new Error(`${size}px is not a whole multiple of the ${grid}px grid`);
    }
  }

  const pngs = sizes.map((size) => {
    const scale = size / grid;
    const pixels = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const key = art[Math.floor(y / scale)][Math.floor(x / scale)];
        const colour = palette[key];
        if (!colour) throw new Error(`No palette entry for '${key}'`);
        pixels.set(colour, (y * size + x) * 4);
      }
    }
    return { size, data: encodePng(size, pixels) };
  });

  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + pngs.length * 16;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size; // 0 means 256
    entry[1] = size >= 256 ? 0 : size;
    entry[4] = 1; // colour planes
    entry[6] = 32; // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  writeFileSync(path, Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]));
  return pngs.map((p) => p.size);
}
