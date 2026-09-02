# Wardrobe Tracker

A local-first desktop app for cataloguing your clothes, combining them into
outfits and keeping on top of the laundry. Everything lives on your own
machine — there is no account, no server and no network access.

## What it does

- **Wardrobe** — a photo grid of every item, with search across name, brand,
  colour and notes, plus filters by category, laundry status and favourites.
- **Outfits** — save combinations of items. Each outfit shows whether it is
  ready to wear or waiting on something in the wash. "Wear today" marks every
  piece worn in one click.
- **Laundry** — the items that need washing and the ones in the machine, with
  bulk "put all in the laundry" and "mark all as clean" actions.

Each item cycles `clean → needs washing → in the laundry → clean`, and tracks
how many times it has been worn and when it was last worn.

## Running it

```bash
npm install     # from the repository root
npm run dev     # or: npm run dev --workspace=@apps/wardrobe
```

## Troubleshooting

**`Error: Electron uninstall` when starting the app.** Electron's runtime
binary is missing — its download is skipped if an earlier install failed part
way through. `npm install` repairs this automatically; to force it directly:

```bash
node node_modules/electron/install.js
```

**`EPERM: operation not permitted` during `npm install` on Windows.** Something
is holding files open, usually antivirus or OneDrive file sync. Keep the
project outside synced folders such as Desktop, Documents or OneDrive —
somewhere like `C:\dev\` works well.

## Installing it as a normal desktop app

You do not need Node, a terminal or this source code to *use* the app — only to
develop it. Every push builds Windows binaries in GitHub Actions:

1. Open the repository's **Actions** tab and pick the latest
   **build windows app** run.
2. Download the **wardrobe-tracker-windows** artifact and unzip it.
3. Double-click **Wardrobe Tracker Setup.exe**.

It installs for the current user only, so there is no administrator prompt, and
it puts a **Wardrobe Tracker** shortcut on the desktop. From then on the app is
an ordinary double-click, with no console window.

The zip also contains **Wardrobe Tracker Portable.exe**, which runs directly
without installing anything.

> **Windows will warn you the first time.** The build is not code-signed, so
> SmartScreen shows "Windows protected your PC". Choose **More info** →
> **Run anyway**. Silencing that warning permanently requires a paid code
> signing certificate.

### Building it yourself

```bash
npm run dist:win
```

Output lands in `apps/wardrobe/release/`. The app has **no native
dependencies**, so nothing is compiled and no C++ toolchain (Visual Studio
Build Tools) is needed. Windows binaries must be built on Windows; for macOS or
Linux, add the targets to `electron-builder.yml` and build on that platform.

## Where your data lives

Everything is stored under `%APPDATA%\Wardrobe Tracker` on Windows
(`~/.config/Wardrobe Tracker` on Linux, `~/Library/Application Support/Wardrobe Tracker`
on macOS):

- `wardrobe.db` — a SQLite database holding items and outfits
- `photos/` — two JPEGs per item: a display copy capped at 1600px wide and a
  480px thumbnail

Photos you import are **copied** into that folder, so moving or deleting the
original file afterwards is safe. The originals are never modified. To back up
or move to a new computer, copy the whole folder.

Note: HEIC photos straight from an iPhone are not supported — Electron cannot
decode them. Export as JPEG first.

## Look and feel

A cosy, pixelated cottagecore theme: linen and cream by day, lantern-lit timber
at night, following the system's light or dark setting. Nothing is rounded,
shadows are hard offsets with no blur, and borders are chunky — the three rules
that keep a pixel look honest.

Items without a photograph fall back to hand-drawn 12x12 pixel sprites, one per
category, defined as text grids in
`src/renderer/src/components/PixelSprite.tsx` — so they can be redrawn without
an image editor. The app icon works the same way: `build/make-icon.mjs` scales a
16x16 grid up by whole-number factors.

The palette button in the title bar opens a theme picker: **Follow system**
(the default), **Cottage Day**, **Cottage Night**, **Game Boy**, **Nord**,
**Dracula** and **Rosé Pine Dawn**. A theme is just a set of the CSS custom
properties the stylesheet already reads, defined in
`src/renderer/src/themes.ts`; choosing one writes them inline on `<html>`,
which beats the stylesheet's own rules, and "Follow system" clears them again.
The choice is remembered per machine.

Foreground colours are tuned so each clears 4.5:1 against its own surface
(3:1 for the favourite star, which is an icon rather than text). That moves a
few shades of the borrowed palettes off their published values — hue and
saturation are kept, only lightness shifts.

The window has no native frame: `src/renderer/src/components/TitleBar.tsx`
draws its own title bar and minimise, maximise and close buttons, which reach
the main process through `window.wardrobe.window`. Reusable icons live in
`src/renderer/src/assets/icons/` — see the README there.

Two pixel typefaces are bundled so the app stays fully offline: **Pixelify
Sans** (body) and **Press Start 2P** (headings), both by their respective
authors under the SIL Open Font License 1.1. The licence travels with them in
`src/renderer/src/assets/fonts/OFL.txt`.

## How it is put together

```
src/
├── main/        Electron main process — the only code that touches disk
│   ├── db.ts            SQLite connection, schema and migrations
│   ├── repository.ts    All queries, mapping rows to domain objects
│   ├── photos.ts        Photo import, resizing and thumbnails
│   ├── ipc.ts           Request handlers exposed to the renderer
│   └── index.ts         App lifecycle, window, photo protocol
├── preload/     contextBridge — the renderer's only door to the main process
├── renderer/    React UI
└── shared/      The typed contract both sides import
```

The renderer runs with `contextIsolation` on, `nodeIntegration` off and a
content security policy that blocks remote content. It cannot touch the
filesystem or the database directly; it can only call the methods listed in
`src/shared/api.ts`, each of which is a `contextBridge` wrapper in
`src/preload/index.ts`. Photos reach the UI through a custom `wardrobe-photo://`
protocol rather than `file://` paths.

Domain rules — filtering, sorting, validation, the laundry cycle, whether an
outfit is wearable — live in `@wardrobe/core`, which has no Electron, React or
SQL dependencies and is unit tested on its own.

## Schema changes

`src/main/db.ts` holds an array of migrations and SQLite's `user_version`
records how many have run. To change the schema, **append** a new entry to that
array; never edit an existing one, or databases already in the wild will not
match. Then add a test in `src/main/repository.test.ts`, which runs against a
real SQLite file rather than a mock.
