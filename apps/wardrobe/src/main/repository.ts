import { randomUUID } from 'node:crypto';
import { normalizeItemDraft, normalizeOutfitDraft, wearItem as wearPatch } from '@wardrobe/core';
import type {
  Category,
  ClothingItem,
  ClothingItemDraft,
  LaundryStatus,
  Outfit,
  OutfitDraft,
} from '@wardrobe/core';
import type { Db } from './db.js';

interface ItemRow {
  id: string;
  name: string;
  category: string;
  color: string;
  brand: string;
  size: string;
  notes: string;
  photo_id: string | null;
  status: string;
  favorite: number;
  wear_count: number;
  last_worn_at: string | null;
  created_at: string;
  updated_at: string;
}

interface OutfitRow {
  id: string;
  name: string;
  notes: string;
  wear_count: number;
  last_worn_at: string | null;
  created_at: string;
  updated_at: string;
}

function toItem(row: ItemRow): ClothingItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    color: row.color,
    brand: row.brand,
    size: row.size,
    notes: row.notes,
    photoId: row.photo_id,
    status: row.status as LaundryStatus,
    favorite: row.favorite === 1,
    wearCount: row.wear_count,
    lastWornAt: row.last_worn_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const now = (): string => new Date().toISOString();

export class WardrobeRepository {
  constructor(private readonly db: Db) {}

  // ---------------------------------------------------------------- items

  listItems(): ClothingItem[] {
    const rows = this.db.prepare('SELECT * FROM items ORDER BY created_at DESC').all() as ItemRow[];
    return rows.map(toItem);
  }

  getItem(id: string): ClothingItem {
    const row = this.db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow | undefined;
    if (!row) throw new Error(`No item with id ${id}`);
    return toItem(row);
  }

  createItem(draft: ClothingItemDraft): ClothingItem {
    const clean = normalizeItemDraft(draft);
    const id = randomUUID();
    const stamp = now();

    this.db
      .prepare(
        `INSERT INTO items (id, name, category, color, brand, size, notes, status, favorite, created_at, updated_at)
         VALUES (@id, @name, @category, @color, @brand, @size, @notes, @status, @favorite, @stamp, @stamp)`,
      )
      .run({ ...clean, id, favorite: clean.favorite ? 1 : 0, stamp });

    return this.getItem(id);
  }

  updateItem(id: string, draft: ClothingItemDraft): ClothingItem {
    const clean = normalizeItemDraft(draft);

    const result = this.db
      .prepare(
        `UPDATE items SET name = @name, category = @category, color = @color, brand = @brand,
                          size = @size, notes = @notes, status = @status, favorite = @favorite,
                          updated_at = @stamp
         WHERE id = @id`,
      )
      .run({ ...clean, id, favorite: clean.favorite ? 1 : 0, stamp: now() });

    if (result.changes === 0) throw new Error(`No item with id ${id}`);
    return this.getItem(id);
  }

  /** Deletes the item and returns its photo id so the caller can clean up. */
  deleteItem(id: string): string | null {
    const item = this.getItem(id);
    this.db.prepare('DELETE FROM items WHERE id = ?').run(id);
    return item.photoId;
  }

  setItemStatus(id: string, status: LaundryStatus): ClothingItem {
    this.db
      .prepare('UPDATE items SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, now(), id);
    return this.getItem(id);
  }

  setStatusBulk(ids: string[], status: LaundryStatus): ClothingItem[] {
    const stamp = now();
    const update = this.db.prepare('UPDATE items SET status = ?, updated_at = ? WHERE id = ?');

    this.db.transaction(() => {
      for (const id of ids) update.run(status, stamp, id);
    })();

    return ids.map((id) => this.getItem(id));
  }

  wearItem(id: string): ClothingItem {
    const patch = wearPatch(this.getItem(id));
    this.db
      .prepare(
        'UPDATE items SET status = ?, wear_count = ?, last_worn_at = ?, updated_at = ? WHERE id = ?',
      )
      .run(patch.status, patch.wearCount, patch.lastWornAt, now(), id);
    return this.getItem(id);
  }

  setItemPhoto(id: string, photoId: string | null): ClothingItem {
    this.db
      .prepare('UPDATE items SET photo_id = ?, updated_at = ? WHERE id = ?')
      .run(photoId, now(), id);
    return this.getItem(id);
  }

  // -------------------------------------------------------------- outfits

  listOutfits(): Outfit[] {
    const rows = this.db
      .prepare('SELECT * FROM outfits ORDER BY created_at DESC')
      .all() as OutfitRow[];

    const members = this.db
      .prepare('SELECT outfit_id, item_id FROM outfit_items ORDER BY position ASC')
      .all() as { outfit_id: string; item_id: string }[];

    const byOutfit = new Map<string, string[]>();
    for (const { outfit_id, item_id } of members) {
      const list = byOutfit.get(outfit_id);
      if (list) list.push(item_id);
      else byOutfit.set(outfit_id, [item_id]);
    }

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      notes: row.notes,
      itemIds: byOutfit.get(row.id) ?? [],
      wearCount: row.wear_count,
      lastWornAt: row.last_worn_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  getOutfit(id: string): Outfit {
    const outfit = this.listOutfits().find((candidate) => candidate.id === id);
    if (!outfit) throw new Error(`No outfit with id ${id}`);
    return outfit;
  }

  createOutfit(draft: OutfitDraft): Outfit {
    const clean = normalizeOutfitDraft(draft);
    const id = randomUUID();
    const stamp = now();

    this.db.transaction(() => {
      this.db
        .prepare(
          `INSERT INTO outfits (id, name, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(id, clean.name, clean.notes, stamp, stamp);
      this.replaceMembers(id, clean.itemIds);
    })();

    return this.getOutfit(id);
  }

  updateOutfit(id: string, draft: OutfitDraft): Outfit {
    const clean = normalizeOutfitDraft(draft);

    this.db.transaction(() => {
      const result = this.db
        .prepare('UPDATE outfits SET name = ?, notes = ?, updated_at = ? WHERE id = ?')
        .run(clean.name, clean.notes, now(), id);
      if (result.changes === 0) throw new Error(`No outfit with id ${id}`);
      this.replaceMembers(id, clean.itemIds);
    })();

    return this.getOutfit(id);
  }

  deleteOutfit(id: string): void {
    this.db.prepare('DELETE FROM outfits WHERE id = ?').run(id);
  }

  /** Wears every item in the outfit and bumps the outfit's own counters. */
  wearOutfit(id: string): { outfit: Outfit; items: ClothingItem[] } {
    const outfit = this.getOutfit(id);
    const stamp = now();

    this.db.transaction(() => {
      for (const itemId of outfit.itemIds) this.wearItem(itemId);
      this.db
        .prepare(
          'UPDATE outfits SET wear_count = wear_count + 1, last_worn_at = ?, updated_at = ? WHERE id = ?',
        )
        .run(stamp, stamp, id);
    })();

    return { outfit: this.getOutfit(id), items: this.listItems() };
  }

  private replaceMembers(outfitId: string, itemIds: string[]): void {
    this.db.prepare('DELETE FROM outfit_items WHERE outfit_id = ?').run(outfitId);
    const insert = this.db.prepare(
      'INSERT INTO outfit_items (outfit_id, item_id, position) VALUES (?, ?, ?)',
    );
    itemIds.forEach((itemId, position) => insert.run(outfitId, itemId, position));
  }
}
