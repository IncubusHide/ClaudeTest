import { useCallback, useEffect, useState } from 'react';
import type {
  ClothingItem,
  ClothingItemDraft,
  LaundryStatus,
  Outfit,
  OutfitDraft,
} from '@wardrobe/core';

export interface WardrobeStore {
  items: ClothingItem[];
  outfits: Outfit[];
  loading: boolean;
  error: string | null;
  dismissError(): void;
  createItem(draft: ClothingItemDraft): Promise<ClothingItem | null>;
  updateItem(id: string, draft: ClothingItemDraft): Promise<void>;
  deleteItem(id: string): Promise<void>;
  setItemStatus(id: string, status: LaundryStatus): Promise<void>;
  wearItem(id: string): Promise<void>;
  pickPhoto(id: string): Promise<void>;
  clearPhoto(id: string): Promise<void>;
  createOutfit(draft: OutfitDraft): Promise<void>;
  updateOutfit(id: string, draft: OutfitDraft): Promise<void>;
  deleteOutfit(id: string): Promise<void>;
  wearOutfit(id: string): Promise<void>;
  setStatusBulk(ids: string[], status: LaundryStatus): Promise<void>;
}

/**
 * Single source of truth for the renderer. Every mutation goes through the
 * preload bridge and then patches local state with whatever the main process
 * returned, so the UI always reflects what was actually persisted.
 */
export function useWardrobe(): WardrobeStore {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [nextItems, nextOutfits] = await Promise.all([
      window.wardrobe.items.list(),
      window.wardrobe.outfits.list(),
    ]);
    setItems(nextItems);
    setOutfits(nextOutfits);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } catch (cause) {
        setError(messageOf(cause));
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  /** Runs an action, surfacing any failure as a dismissible banner. */
  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | null> => {
    try {
      return await action();
    } catch (cause) {
      setError(messageOf(cause));
      return null;
    }
  }, []);

  const replaceItem = useCallback((updated: ClothingItem) => {
    setItems((previous) => previous.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  return {
    items,
    outfits,
    loading,
    error,
    dismissError: () => setError(null),

    createItem: (draft) =>
      run(async () => {
        const created = await window.wardrobe.items.create(draft);
        setItems((previous) => [created, ...previous]);
        return created;
      }),

    updateItem: async (id, draft) => {
      const updated = await run(() => window.wardrobe.items.update(id, draft));
      if (updated) replaceItem(updated);
    },

    deleteItem: async (id) => {
      // Deleting an item cascades to outfit membership, so reload both lists.
      await run(async () => {
        await window.wardrobe.items.remove(id);
        await refresh();
      });
    },

    setItemStatus: async (id, status) => {
      const updated = await run(() => window.wardrobe.items.setStatus(id, status));
      if (updated) replaceItem(updated);
    },

    wearItem: async (id) => {
      const updated = await run(() => window.wardrobe.items.wear(id));
      if (updated) replaceItem(updated);
    },

    pickPhoto: async (id) => {
      const updated = await run(() => window.wardrobe.items.pickPhoto(id));
      // null means the user cancelled the file dialog - not an error.
      if (updated) replaceItem(updated);
    },

    clearPhoto: async (id) => {
      const updated = await run(() => window.wardrobe.items.clearPhoto(id));
      if (updated) replaceItem(updated);
    },

    createOutfit: async (draft) => {
      const created = await run(() => window.wardrobe.outfits.create(draft));
      if (created) setOutfits((previous) => [created, ...previous]);
    },

    updateOutfit: async (id, draft) => {
      const updated = await run(() => window.wardrobe.outfits.update(id, draft));
      if (updated) {
        setOutfits((previous) => previous.map((o) => (o.id === updated.id ? updated : o)));
      }
    },

    deleteOutfit: async (id) => {
      const done = await run(async () => {
        await window.wardrobe.outfits.remove(id);
        return true;
      });
      if (done) setOutfits((previous) => previous.filter((o) => o.id !== id));
    },

    wearOutfit: async (id) => {
      const result = await run(() => window.wardrobe.outfits.wear(id));
      if (result) {
        setItems(result.items);
        setOutfits((previous) => previous.map((o) => (o.id === id ? result.outfit : o)));
      }
    },

    setStatusBulk: async (ids, status) => {
      const updated = await run(() => window.wardrobe.laundry.setStatusBulk(ids, status));
      if (updated) {
        const byId = new Map(updated.map((item) => [item.id, item]));
        setItems((previous) => previous.map((item) => byId.get(item.id) ?? item));
      }
    },
  };
}

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
