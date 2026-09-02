# Icons

Pixel art on a 12x12 grid, drawn as SVG rectangles so it stays crisp at any
size. `shape-rendering="crispEdges"` stops the browser softening the edges.

- `hanger.svg` — the app mark, cream on the sidebar's green tile
- `shirt.svg` — the wardrobe glyph, in the app's sage green
- `minimize.svg`, `maximize.svg`, `close.svg` — window controls, applied as a
  CSS `mask-image` over `currentColor` so they follow the light or dark theme

The category sprites used for photo-less items are not here: they live in
`components/PixelSprite.tsx`, since they are drawn as text grids in code.
