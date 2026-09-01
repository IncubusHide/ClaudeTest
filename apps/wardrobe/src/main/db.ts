import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';

export type Db = Database.Database;

/**
 * Schema revisions, applied in order. Each entry runs exactly once and then
 * `user_version` is bumped, so shipping a new version of the app only ever adds
 * an entry to the end of this array.
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

  CREATE INDEX idx_items_status   ON items(status);
  CREATE INDEX idx_items_category ON items(category);
  CREATE INDEX idx_outfit_items_item ON outfit_items(item_id);
  `,
];

/**
 * Opens the wardrobe database, creating the directory and applying any
 * outstanding migrations. Safe to call once at startup.
 */
export function openDatabase(dataDir: string): Db {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  const db = new Database(join(dataDir, 'wardrobe.db'));

  // WAL keeps reads fast while a write is in flight; foreign keys are off by
  // default in SQLite and we rely on ON DELETE CASCADE for outfit membership.
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  migrate(db);
  return db;
}

function migrate(db: Db): void {
  const current = db.pragma('user_version', { simple: true }) as number;

  for (let version = current; version < MIGRATIONS.length; version += 1) {
    const sql = MIGRATIONS[version];
    if (!sql) continue;
    db.exec(`BEGIN; ${sql} PRAGMA user_version = ${version + 1}; COMMIT;`);
  }
}
