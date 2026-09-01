import type { ClothingItem, LaundryStatus, Outfit } from './types.js';

/**
 * The wash cycle, in the order the user walks through it:
 * clean -> (worn) -> dirty -> (put in the basket) -> in_laundry -> (washed) -> clean
 */
export function nextLaundryStatus(status: LaundryStatus): LaundryStatus {
  switch (status) {
    case 'clean':
      return 'dirty';
    case 'dirty':
      return 'in_laundry';
    case 'in_laundry':
      return 'clean';
  }
}

/** The fields that change when an item is worn. Applied by the storage layer. */
export interface WearPatch {
  status: LaundryStatus;
  wearCount: number;
  lastWornAt: string;
}

export function wearItem(item: ClothingItem, now: Date = new Date()): WearPatch {
  return {
    status: 'dirty',
    wearCount: item.wearCount + 1,
    lastWornAt: now.toISOString(),
  };
}

/** True when the item is ready to be worn right now. */
export function isAvailable(item: ClothingItem): boolean {
  return item.status === 'clean';
}

export interface OutfitAvailability {
  /** Items belonging to the outfit that are clean and ready. */
  available: ClothingItem[];
  /** Items that are dirty or in the wash. */
  unavailable: ClothingItem[];
  /** Ids referenced by the outfit whose item no longer exists. */
  missingIds: string[];
  /** True only when every referenced item exists and is clean. */
  wearable: boolean;
}

/**
 * Works out whether an outfit can be worn today, given the current wardrobe.
 * An outfit with no items is not wearable.
 */
export function outfitAvailability(
  outfit: Outfit,
  items: readonly ClothingItem[],
): OutfitAvailability {
  const byId = new Map(items.map((item) => [item.id, item]));
  const available: ClothingItem[] = [];
  const unavailable: ClothingItem[] = [];
  const missingIds: string[] = [];

  for (const id of outfit.itemIds) {
    const item = byId.get(id);
    if (!item) {
      missingIds.push(id);
    } else if (isAvailable(item)) {
      available.push(item);
    } else {
      unavailable.push(item);
    }
  }

  return {
    available,
    unavailable,
    missingIds,
    wearable:
      outfit.itemIds.length > 0 && unavailable.length === 0 && missingIds.length === 0,
  };
}
