import type { Category, ClothingItem, LaundryStatus } from './types.js';

export interface ItemFilter {
  /** Matched case-insensitively against name, brand, colour and notes. */
  search?: string;
  categories?: Category[];
  statuses?: LaundryStatus[];
  favoritesOnly?: boolean;
}

export type ItemSort = 'recent' | 'name' | 'most-worn' | 'least-worn';

export const ITEM_SORT_LABELS: Record<ItemSort, string> = {
  recent: 'Recently added',
  name: 'Name (A–Z)',
  'most-worn': 'Most worn',
  'least-worn': 'Least worn',
};

function matchesSearch(item: ClothingItem, needle: string): boolean {
  const haystack = [item.name, item.brand, item.color, item.notes, item.size]
    .join(' ')
    .toLowerCase();
  // Every whitespace-separated term must appear, so "blue nike" narrows results
  // rather than widening them.
  return needle
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function filterItems(items: readonly ClothingItem[], filter: ItemFilter = {}): ClothingItem[] {
  const search = filter.search?.trim() ?? '';

  return items.filter((item) => {
    if (search && !matchesSearch(item, search)) return false;
    if (filter.categories?.length && !filter.categories.includes(item.category)) return false;
    if (filter.statuses?.length && !filter.statuses.includes(item.status)) return false;
    if (filter.favoritesOnly && !item.favorite) return false;
    return true;
  });
}

/** Returns a new sorted array; the input is never mutated. */
export function sortItems(items: readonly ClothingItem[], sort: ItemSort): ClothingItem[] {
  const sorted = [...items];

  switch (sort) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'most-worn':
      return sorted.sort((a, b) => b.wearCount - a.wearCount || a.name.localeCompare(b.name));
    case 'least-worn':
      return sorted.sort((a, b) => a.wearCount - b.wearCount || a.name.localeCompare(b.name));
    case 'recent':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

/** Counts per category, used to badge the sidebar. */
export function countByStatus(items: readonly ClothingItem[]): Record<LaundryStatus, number> {
  const counts: Record<LaundryStatus, number> = { clean: 0, dirty: 0, in_laundry: 0 };
  for (const item of items) counts[item.status] += 1;
  return counts;
}
