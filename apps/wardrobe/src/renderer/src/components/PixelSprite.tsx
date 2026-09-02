import type { ReactElement } from 'react';
import type { Category } from '@wardrobe/core';

/**
 * Hand-drawn 12x12 pixel art, one sprite per category, shown when an item has
 * no photograph yet.
 *
 * Each sprite is a small picture in text: `#` is the outline, `.` is
 * transparent and `o` is the fill. Drawing them this way keeps them editable
 * without an image editor and costs nothing to render.
 */
const SPRITES: Record<Category, string[]> = {
  top: [
    '............',
    '..##....##..',
    '.#oo####oo#.',
    '#oooooooooo#',
    '#oooooooooo#',
    '.##oooooo##.',
    '...#oooo#...',
    '...#oooo#...',
    '...#oooo#...',
    '...#oooo#...',
    '...######...',
    '............',
  ],
  bottom: [
    '............',
    '.##########.',
    '.#oooooooo#.',
    '.#oooooooo#.',
    '.#oooooooo#.',
    '.#oo####oo#.',
    '.#oo#..#oo#.',
    '.#oo#..#oo#.',
    '.#oo#..#oo#.',
    '.#oo#..#oo#.',
    '.####..####.',
    '............',
  ],
  outerwear: [
    '............',
    '..##....##..',
    '.#oo####oo#.',
    '#oooo##oooo#',
    '#oooo##oooo#',
    '.###o##o###.',
    '...#o##o#...',
    '...#o##o#...',
    '...#o##o#...',
    '...#o##o#...',
    '...######...',
    '............',
  ],
  dress: [
    '............',
    '..##....##..',
    '.#oo####oo#.',
    '.#oooooooo#.',
    '..#oooooo#..',
    '..#oooooo#..',
    '.#oooooooo#.',
    '.#oooooooo#.',
    '#oooooooooo#',
    '#oooooooooo#',
    '############',
    '............',
  ],
  shoes: [
    '............',
    '...####.....',
    '...#oo#.....',
    '...#oo#.....',
    '...#oo#.....',
    '...#oo#.....',
    '...#oo###...',
    '...#oooo##..',
    '...#oooooo#.',
    '..#oooooooo#',
    '..##########',
    '............',
  ],
  accessory: [
    '............',
    '....####....',
    '...#oooo#...',
    '...#oooo#...',
    '..#oooooo#..',
    '.##########.',
    '#oooooooooo#',
    '#oooooooooo#',
    '.##########.',
    '............',
    '............',
    '............',
  ],
  underwear: [
    '............',
    '............',
    '############',
    '#oooooooooo#',
    '#oooooooooo#',
    '#oooooooooo#',
    '#oo######oo#',
    '#oo#....#oo#',
    '#oo#....#oo#',
    '.##......##.',
    '............',
    '............',
  ],
  other: [
    '............',
    '...######...',
    '..#......#..',
    '..#......#..',
    '############',
    '#oooooooooo#',
    '#o#o#o#o#o##',
    '#oooooooooo#',
    '#o#o#o#o#o##',
    '#oooooooooo#',
    '.##########.',
    '............',
  ],
};

/** A soft, slightly faded colour for each category's cloth. */
const FILLS: Record<Category, string> = {
  top: '#a8bf8e',
  bottom: '#9aa8c4',
  outerwear: '#c4956b',
  dress: '#d1a0a8',
  shoes: '#a9805c',
  accessory: '#d9be7a',
  underwear: '#cfc2ad',
  other: '#bfa980',
};

export function PixelSprite({ category }: { category: Category }) {
  const rows = SPRITES[category];
  const cells: ReactElement[] = [];

  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === '.') return;
      cells.push(
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill={cell === '#' ? 'var(--sprite-line)' : FILLS[category]}
        />,
      );
    });
  });

  return (
    <svg
      className="sprite"
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {cells}
    </svg>
  );
}
