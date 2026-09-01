import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { emptyItemDraft } from '@wardrobe/core';
import type { ClothingItemDraft } from '@wardrobe/core';
import { openDatabase } from './db.js';
import type { Db } from './db.js';
import { WardrobeRepository } from './repository.js';

/**
 * These run against a real SQLite file in a temp directory, so the schema,
 * migrations, foreign keys and transactions are all genuinely exercised.
 */
describe('WardrobeRepository', () => {
  let dir: string;
  let db: Db;
  let repo: WardrobeRepository;

  const draft = (overrides: Partial<ClothingItemDraft> = {}): ClothingItemDraft => ({
    ...emptyItemDraft(),
    name: 'Blue shirt',
    ...overrides,
  });

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'wardrobe-test-'));
    db = openDatabase(dir);
    repo = new WardrobeRepository(db);
  });

  afterEach(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('applies migrations on a fresh database', () => {
    expect(db.pragma('user_version', { simple: true })).toBe(1);
    expect(repo.listItems()).toEqual([]);
  });

  it('is idempotent when reopening an existing database', () => {
    repo.createItem(draft());
    db.close();

    const reopened = openDatabase(dir);
    expect(new WardrobeRepository(reopened).listItems()).toHaveLength(1);
    reopened.close();
    db = openDatabase(dir); // so afterEach has something to close
  });

  it('round-trips an item through create and read', () => {
    const created = repo.createItem(
      draft({ name: '  Wool coat  ', brand: 'Acme', favorite: true, category: 'outerwear' }),
    );

    expect(created).toMatchObject({
      name: 'Wool coat', // normalised on the way in
      brand: 'Acme',
      category: 'outerwear',
      favorite: true,
      status: 'clean',
      wearCount: 0,
      photoId: null,
      lastWornAt: null,
    });
    expect(repo.getItem(created.id)).toEqual(created);
  });

  it('updates an item and rejects an unknown id', () => {
    const item = repo.createItem(draft());
    const updated = repo.updateItem(item.id, draft({ name: 'Green shirt', size: 'L' }));

    expect(updated).toMatchObject({ name: 'Green shirt', size: 'L' });
    expect(() => repo.updateItem('nope', draft())).toThrow(/No item/);
  });

  it('wears an item: dirty, counter up, timestamp set', () => {
    const item = repo.createItem(draft());
    const worn = repo.wearItem(item.id);

    expect(worn.status).toBe('dirty');
    expect(worn.wearCount).toBe(1);
    expect(worn.lastWornAt).not.toBeNull();

    expect(repo.wearItem(item.id).wearCount).toBe(2);
  });

  it('changes many statuses in one bulk call', () => {
    const ids = [repo.createItem(draft()), repo.createItem(draft())].map((item) => item.id);
    const updated = repo.setStatusBulk(ids, 'in_laundry');

    expect(updated.every((item) => item.status === 'in_laundry')).toBe(true);
    expect(repo.listItems().every((item) => item.status === 'in_laundry')).toBe(true);
  });

  it('preserves outfit item order', () => {
    const a = repo.createItem(draft({ name: 'A' }));
    const b = repo.createItem(draft({ name: 'B' }));
    const c = repo.createItem(draft({ name: 'C' }));

    const outfit = repo.createOutfit({ name: 'Layered', notes: '', itemIds: [c.id, a.id, b.id] });

    expect(outfit.itemIds).toEqual([c.id, a.id, b.id]);
    expect(repo.getOutfit(outfit.id).itemIds).toEqual([c.id, a.id, b.id]);
  });

  it('replaces outfit membership on update rather than appending', () => {
    const a = repo.createItem(draft({ name: 'A' }));
    const b = repo.createItem(draft({ name: 'B' }));
    const outfit = repo.createOutfit({ name: 'Look', notes: '', itemIds: [a.id] });

    const updated = repo.updateOutfit(outfit.id, { name: 'Look', notes: 'warmer', itemIds: [b.id] });

    expect(updated.itemIds).toEqual([b.id]);
    expect(updated.notes).toBe('warmer');
  });

  it('drops an item from its outfits when the item is deleted', () => {
    const a = repo.createItem(draft({ name: 'A' }));
    const b = repo.createItem(draft({ name: 'B' }));
    const outfit = repo.createOutfit({ name: 'Look', notes: '', itemIds: [a.id, b.id] });

    repo.deleteItem(a.id);

    expect(repo.getOutfit(outfit.id).itemIds).toEqual([b.id]);
  });

  it('returns the photo id when deleting so the caller can clean up files', () => {
    const item = repo.createItem(draft());
    repo.setItemPhoto(item.id, '11111111-2222-3333-4444-555555555555');

    expect(repo.deleteItem(item.id)).toBe('11111111-2222-3333-4444-555555555555');
    expect(repo.listItems()).toHaveLength(0);
  });

  it('wearing an outfit dirties every piece and bumps the outfit counter', () => {
    const a = repo.createItem(draft({ name: 'A' }));
    const b = repo.createItem(draft({ name: 'B' }));
    const outfit = repo.createOutfit({ name: 'Look', notes: '', itemIds: [a.id, b.id] });

    const result = repo.wearOutfit(outfit.id);

    expect(result.outfit.wearCount).toBe(1);
    expect(result.outfit.lastWornAt).not.toBeNull();
    expect(result.items.every((item) => item.status === 'dirty')).toBe(true);
    expect(result.items.every((item) => item.wearCount === 1)).toBe(true);
  });

  it('deletes an outfit without touching its items', () => {
    const a = repo.createItem(draft({ name: 'A' }));
    const outfit = repo.createOutfit({ name: 'Look', notes: '', itemIds: [a.id] });

    repo.deleteOutfit(outfit.id);

    expect(repo.listOutfits()).toHaveLength(0);
    expect(repo.listItems()).toHaveLength(1);
  });
});
