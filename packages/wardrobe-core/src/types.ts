/**
 * Core domain types for the wardrobe.
 *
 * This module is deliberately free of any I/O, Electron, React or SQL concerns
 * so it can be unit tested in isolation and reused by any future app in the
 * monorepo.
 */

/** Where a garment currently sits in the wash cycle. */
export type LaundryStatus = 'clean' | 'dirty' | 'in_laundry';

export const LAUNDRY_STATUSES: readonly LaundryStatus[] = ['clean', 'dirty', 'in_laundry'];

export const LAUNDRY_STATUS_LABELS: Record<LaundryStatus, string> = {
  clean: 'Clean',
  dirty: 'Needs washing',
  in_laundry: 'In the laundry',
};

export type Category =
  | 'top'
  | 'bottom'
  | 'outerwear'
  | 'dress'
  | 'shoes'
  | 'accessory'
  | 'underwear'
  | 'other';

export const CATEGORIES: readonly Category[] = [
  'top',
  'bottom',
  'outerwear',
  'dress',
  'shoes',
  'accessory',
  'underwear',
  'other',
];

export const CATEGORY_LABELS: Record<Category, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  outerwear: 'Outerwear',
  dress: 'Dresses',
  shoes: 'Shoes',
  accessory: 'Accessories',
  underwear: 'Underwear',
  other: 'Other',
};

/** A single garment. `id` and timestamps are assigned by the storage layer. */
export interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  /** Free-text colour name, e.g. "navy". Empty string when unset. */
  color: string;
  brand: string;
  size: string;
  notes: string;
  /** Identifier of the stored photo, or null when the item has no picture. */
  photoId: string | null;
  status: LaundryStatus;
  favorite: boolean;
  wearCount: number;
  /** ISO-8601 timestamp, or null if never worn. */
  lastWornAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** The user-editable subset of an item, as produced by the item form. */
export type ClothingItemDraft = Pick<
  ClothingItem,
  'name' | 'category' | 'color' | 'brand' | 'size' | 'notes' | 'status' | 'favorite'
>;

export interface Outfit {
  id: string;
  name: string;
  notes: string;
  /** Item ids in display order. May reference items that were since deleted. */
  itemIds: string[];
  wearCount: number;
  lastWornAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OutfitDraft = Pick<Outfit, 'name' | 'notes' | 'itemIds'>;

export function emptyItemDraft(): ClothingItemDraft {
  return {
    name: '',
    category: 'top',
    color: '',
    brand: '',
    size: '',
    notes: '',
    status: 'clean',
    favorite: false,
  };
}

export function emptyOutfitDraft(): OutfitDraft {
  return { name: '', notes: '', itemIds: [] };
}
