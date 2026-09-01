# Working in this repository

An npm-workspaces monorepo. `apps/*` are shippable applications, `packages/*`
are libraries they share. Node 22+.

## Layout rules

- Apps may depend on `packages/*`; **apps must never import from another app**.
- Shared code is reached through its workspace name (`@wardrobe/core`), never a
  relative path that climbs out of the workspace (`../../packages/...`).
- Keeping to these two rules is what makes extracting an app into its own
  repository a mechanical `git filter-repo` later.

## Commands

Run from the repository root:

```bash
npm run dev          # launch the wardrobe app
npm run build        # build the wardrobe app
npm test             # every workspace
npm run typecheck    # every workspace
```

Scope to one workspace with `--workspace=@wardrobe/core` or
`--workspace=@apps/wardrobe`.

Always run `npm run typecheck` and `npm test` before committing. CI is filtered
by path, so a change under `packages/` runs both workflows and a change under
`apps/wardrobe/` runs only that app's.

## `packages/wardrobe-core`

Pure domain logic: types, filtering, sorting, validation, the laundry cycle.
No I/O, no Electron, no React, no SQL — that is what makes it cheap to test and
safe to reuse. Keep it that way; anything that touches disk belongs in an app's
main process.

It is consumed **as TypeScript source** (`exports` points at `src/index.ts`),
so there is no build step and no stale `dist/`. Bundlers compile it as part of
the app. This is deliberate — do not add a build step.

## `apps/wardrobe`

Electron + React + SQLite. See `apps/wardrobe/README.md` for the full picture.

When adding a feature that crosses the process boundary, change all four in the
same commit, or the types will not line up:

1. `src/shared/api.ts` — add the method and its channel name
2. `src/main/repository.ts` — the SQL
3. `src/main/ipc.ts` — the handler
4. `src/preload/index.ts` — the bridge wrapper

Security invariants for the renderer, which must not be relaxed:
`contextIsolation: true`, `nodeIntegration: false`, and a content security
policy in `index.html` that permits no remote content. The renderer reaches the
main process only through `window.wardrobe`.

SQLite comes from Node's built-in `node:sqlite`, which Electron bundles. Do not
replace it with a native package such as better-sqlite3: npm runs `node-gyp
rebuild` by default for any dependency that has a `binding.gyp` and no install
script, which fails on a machine without a C++ toolchain. Keeping the app free
of native dependencies is what makes `npm install` work everywhere.

Schema changes are append-only migrations in `src/main/db.ts` — see that file
and the app README. `src/main/repository.test.ts` runs against a real SQLite
file in a temp directory, so add cases there rather than mocking.

Electron's runtime binary is not needed to typecheck or build; set
`ELECTRON_SKIP_BINARY_DOWNLOAD=1` to skip the download, as CI does.
