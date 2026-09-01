import type {
  ClothingItem,
  ClothingItemDraft,
  LaundryStatus,
  Outfit,
  OutfitDraft,
} from '@wardrobe/core';

/**
 * The contract between the renderer and the main process.
 *
 * Both sides import these types, so adding a method here immediately shows up
 * as a type error in whichever side has not implemented it yet.
 */
export interface WardrobeApi {
  items: {
    list(): Promise<ClothingItem[]>;
    create(draft: ClothingItemDraft): Promise<ClothingItem>;
    update(id: string, draft: ClothingItemDraft): Promise<ClothingItem>;
    remove(id: string): Promise<void>;
    setStatus(id: string, status: LaundryStatus): Promise<ClothingItem>;
    /** Marks the item worn: dirty, wear count +1, last-worn stamped. */
    wear(id: string): Promise<ClothingItem>;
    /** Opens a file picker; resolves to null when the user cancels. */
    pickPhoto(id: string): Promise<ClothingItem | null>;
    clearPhoto(id: string): Promise<ClothingItem>;
  };
  outfits: {
    list(): Promise<Outfit[]>;
    create(draft: OutfitDraft): Promise<Outfit>;
    update(id: string, draft: OutfitDraft): Promise<Outfit>;
    remove(id: string): Promise<void>;
    /** Wears every item in the outfit, returning the refreshed wardrobe. */
    wear(id: string): Promise<{ outfit: Outfit; items: ClothingItem[] }>;
  };
  laundry: {
    /** Bulk status change, used by the "wash everything" buttons. */
    setStatusBulk(ids: string[], status: LaundryStatus): Promise<ClothingItem[]>;
  };
}

/** IPC channel names, kept in one place so main and preload cannot drift. */
export const CHANNELS = {
  itemsList: 'items:list',
  itemsCreate: 'items:create',
  itemsUpdate: 'items:update',
  itemsRemove: 'items:remove',
  itemsSetStatus: 'items:set-status',
  itemsWear: 'items:wear',
  itemsPickPhoto: 'items:pick-photo',
  itemsClearPhoto: 'items:clear-photo',
  outfitsList: 'outfits:list',
  outfitsCreate: 'outfits:create',
  outfitsUpdate: 'outfits:update',
  outfitsRemove: 'outfits:remove',
  outfitsWear: 'outfits:wear',
  laundrySetStatusBulk: 'laundry:set-status-bulk',
} as const;

/** Custom protocol used to load stored photos into the renderer. */
export const PHOTO_PROTOCOL = 'wardrobe-photo';

export function photoUrl(photoId: string, variant: 'full' | 'thumb' = 'thumb'): string {
  return `${PHOTO_PROTOCOL}://${variant}/${photoId}`;
}
