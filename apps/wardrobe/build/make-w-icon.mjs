/**
 * Generates w-mark.ico — the "W" monogram as a Windows icon.
 *
 * Unlike the flat in-app SVG, this one is shaded: a lighter bevel along the
 * top and left, a darker one along the bottom and right, and a hard offset
 * shadow under the letter. No blur or gradients — the depth comes from whole
 * pixels of light and dark, the way a 2D game tile is drawn.
 *
 * Run with: node build/make-w-icon.mjs
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeIco } from './pixel-ico.mjs';

const GRID = 16;
const SIZES = [16, 32, 48, 64, 128, 256];

/** The letter, on its own 12x12 grid; '#' is a lit pixel. */
const LETTER = [
  '............',
  '............',
  '.##......##.',
  '.##......##.',
  '.##......##.',
  '.##..##..##.',
  '.##..##..##.',
  '.##.####.##.',
  '.##########.',
  '..##....##..',
  '............',
  '............',
];

const PALETTE = {
  e: [61, 83, 48, 255], // outline
  l: [143, 177, 115, 255], // top and left bevel, catching the light
  g: [111, 145, 89, 255], // the tile itself
  d: [74, 99, 57, 255], // bottom and right bevel, in shade
  s: [63, 86, 49, 255], // the letter's dropped shadow
  w: [251, 243, 226, 255], // the letter
};

// Start from a bevelled tile: outline, then a lit edge and a shaded edge.
const art = [];
for (let y = 0; y < GRID; y += 1) {
  const row = [];
  for (let x = 0; x < GRID; x += 1) {
    if (y === 0 || x === 0 || y === GRID - 1 || x === GRID - 1) row.push('e');
    else if (y === 1 || x === 1) row.push('l');
    else if (y === GRID - 2 || x === GRID - 2) row.push('d');
    else row.push('g');
  }
  art.push(row);
}

// Lay the shadow down first so the letter itself paints over it.
const OFFSET_X = 3;
const OFFSET_Y = 2;
const paint = (dx, dy, key) => {
  LETTER.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell !== '#') return;
      const px = x + OFFSET_X + dx;
      const py = y + OFFSET_Y + dy;
      // Never paint over the outline, so the tile keeps a clean edge.
      if (px < 1 || py < 1 || px > GRID - 2 || py > GRID - 2) return;
      art[py][px] = key;
    });
  });
};

paint(1, 1, 's');
paint(0, 0, 'w');

const out = join(dirname(fileURLToPath(import.meta.url)), 'w-mark.ico');
const written = writeIco(out, art.map((row) => row.join('')), PALETTE, SIZES);
console.log(`Wrote ${out} (${written.join(', ')} px)`);
