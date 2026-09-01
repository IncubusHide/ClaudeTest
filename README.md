# Monorepo

A single repository hosting several independent desktop applications plus the
packages they share.

```
.
├── apps/
│   └── wardrobe/            Wardrobe Tracker (Electron + React desktop app)
├── packages/
│   └── wardrobe-core/       Shared domain model and pure business logic
├── .github/workflows/       Per-project CI, filtered by path
└── tsconfig.base.json       Compiler options every project extends
```

## Why a monorepo

Projects here share code, are released on their own schedule and are all owned
by one person. Adding a second app means adding a directory under `apps/` — no
new repository, no cross-repo version juggling.

### The rule that keeps it splittable

**Apps may depend on `packages/*`. Apps must never import from another app.**

Every shared dependency is declared in `package.json` as a workspace
dependency, never reached for with a relative path like `../../other-app/src`.
As long as that holds, extracting an app into its own repository later is a
mechanical `git filter-repo --subdirectory-filter apps/<name>`, which keeps the
full history of that directory.

## Getting started

Requires **Node 22.5 or newer** (Node 24 recommended).

```bash
npm install          # installs every workspace at once
npm run dev          # launches the Wardrobe Tracker in development
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the wardrobe app with hot reload |
| `npm run build` | Builds the wardrobe app into `apps/wardrobe/out/` |
| `npm run dist:win` | Produces a Windows installer in `apps/wardrobe/release/` |
| `npm test` | Runs every workspace's tests |
| `npm run typecheck` | Typechecks every workspace |

To work on a single workspace, add `--workspace`:

```bash
npm test --workspace=@wardrobe/core
```

## Just want to use the app?

You do not need any of this to run the Wardrobe Tracker. GitHub Actions builds
a Windows installer on every push — see
[apps/wardrobe/README.md](apps/wardrobe/README.md#installing-it-as-a-normal-desktop-app).

## Adding a second app

1. `mkdir apps/<name>` and give it a `package.json` with a unique `name`.
2. Extend `tsconfig.base.json` from its `tsconfig.json`.
3. Copy `.github/workflows/wardrobe.yml` and change the paths and workspace
   name, so the new app's CI only runs when the new app changes.
4. Put anything two apps both need into `packages/`, never into an app.

`npm install` at the root picks the new workspace up automatically.
