import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * SQLite comes from Node's own `node:sqlite` module, which Electron bundles.
 * That deliberately avoids a native dependency such as better-sqlite3: those
 * require a C++ toolchain (Visual Studio Build Tools on Windows) whenever npm
 * falls back to compiling them, which is a poor first-run experience.
 */
export type Db = DatabaseSync;

/**
 * Schema revisions, applied in order. Each entry runs exactly once and then
 * `user_version` is bumped, so shipping a new version of the app only ever adds
 * an entry to the end of this array. Never edit an existing entry.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE items (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    category     TEXT NOT NULL,
    color        TEXT NOT NULL DEFAULT '',
    brand        TEXT NOT NULL DEFAULT '',
    size         TEXT NOT NULL DEFAULT '',
    notes        TEXT NOT NULL DEFAULT '',
    photo_id     TEXT,
    status       TEXT NOT NULL DEFAULT 'clean',
    favorite     INTEGER NOT NULL DEFAULT 0,
    wear_count   INTEGER NOT NULL DEFAULT 0,
    last_worn_at TEXT,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
  );

  CREATE TABLE outfits (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    notes        TEXT NOT NULL DEFAULT '',
    wear_count   INTEGER NOT NULL DEFAULT 0,
    last_worn_at TEXT,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
  );

  CREATE TABLE outfit_items (
    outfit_id TEXT NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
    item_id   TEXT NOT NULL REFERENCES items(id)   ON DELETE CASCADE,
    position  INTEGER NOT NULL,
    PRIMARY KEY (outfit_id, item_id)
  );

  CREATE INDEX idx_items_status      ON items(status);
  CREATE INDEX idx_items_category    ON items(category);
  CREATE INDEX idx_outfit_items_item ON outfit_items(item_id);
  `,
];

/**
 * Opens the wardrobe database, creating the directory and applying any
 * outstanding migrations. Safe to call once at startup.
 */
export function openDatabase(dataDir: string): Db {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  const db = new DatabaseSync(join(dataDir, 'wardrobe.db'));

  // WAL keeps reads fast while a write is in flight; foreign keys are off by
  // default in SQLite and we rely on ON DELETE CASCADE for outfit membership.
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  migrate(db);
  return db;
}

export function userVersion(db: Db): number {
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number } | undefined;
  return row?.user_version ?? 0;
}

function migrate(db: Db): void {
  for (let version = userVersion(db); version < MIGRATIONS.length; version += 1) {
    const sql = MIGRATIONS[version];
    if (!sql) continue;
    // PRAGMA user_version does not accept a bound parameter, and `version` is a
    // loop counter rather than anything user-supplied.
    transaction(db, () => {
      db.exec(sql);
      db.exec(`PRAGMA user_version = ${version + 1}`);
    });
  }
}

/**
 * Runs `work` inside a transaction, rolling back if it throws.
 * `node:sqlite` has no transaction helper of its own.
 */
export function transaction<T>(db: Db, work: () => T): T {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (cause) {
    db.exec('ROLLBACK');
    throw cause;
  }
}
