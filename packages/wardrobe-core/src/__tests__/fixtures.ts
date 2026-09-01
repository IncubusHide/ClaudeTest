import type { ClothingItem, LaundryStatus, Outfit } from '../types.js';

let counter = 0;

export function makeItem(overrides: Partial<ClothingItem> = {}): ClothingItem {
  counter += 1;
  const stamp = `2026-01-${String(counter).padStart(2, '0')}T00:00:00.000Z`;
  return {
    id: `item-${counter}`,
    name: `Item ${counter}`,
    category: 'top',
    color: '',
    brand: '',
    size: '',
    notes: '',
    photoId: null,
    status: 'clean' as LaundryStatus,
    favorite: false,
    wearCount: 0,
    lastWornAt: null,
    createdAt: stamp,
    updatedAt: stamp,
    ...overrides,
  };
}

export function makeOutfit(overrides: Partial<Outfit> = {}): Outfit {
  counter += 1;
  const stamp = `2026-02-${String(counter).padStart(2, '0')}T00:00:00.000Z`;
  return {
    id: `outfit-${counter}`,
    name: `Outfit ${counter}`,
    notes: '',
    itemIds: [],
    wearCount: 0,
    lastWornAt: null,
    createdAt: stamp,
    updatedAt: stamp,
    ...overrides,
  };
}
