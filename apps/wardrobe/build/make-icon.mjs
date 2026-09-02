/**
 * Generates icon.ico for the Windows build.
 *
 * The artwork is genuine pixel art: a 16x16 grid, scaled up by whole-number
 * factors so every source pixel becomes a crisp square block. Sizes that are
 * not a multiple of 16 are deliberately omitted, since they would need
 * interpolation and would blur the edges.
 *
 * Written by hand rather than pulled from an image library so the icon is
 * reproducible from source with no extra dependency: Node's zlib is all a PNG
 * encoder needs, and an .ico is just a small header around PNG payloads.
 *
 * Run with: node build/make-icon.mjs
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeIco } from './pixel-ico.mjs';

// Every size is a whole-number multiple of the 16px source grid.
const SIZES = [16, 32, 48, 64, 128, 256];

/** '.' background, '#' the cream hanger, 'e' the darker edge. */
const ART = [
  'eeeeeeeeeeeeeeee',
  'e..............e',
  'e......###.....e',
  'e.....#...#....e',
  'e.....#...#....e',
  'e......###.....e',
  'e.......#......e',
  'e......#.#.....e',
  'e.....#...#....e',
  'e....#.....#...e',
  'e...#.......#..e',
  'e..#.........#.e',
  'e.#############e',
  'e..............e',
  'e..............e',
  'eeeeeeeeeeeeeeee',
];

const PALETTE = {
  '.': [111, 145, 89, 255], // sage green
  '#': [251, 243, 226, 255], // cream
  e: [79, 107, 63, 255], // darker sage edge
};

const out = join(dirname(fileURLToPath(import.meta.url)), 'icon.ico');
const written = writeIco(out, ART, PALETTE, SIZES);
console.log(`Wrote ${out} (${written.join(', ')} px)`);

