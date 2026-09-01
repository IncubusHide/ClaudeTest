import { describe, expect, it } from 'vitest';
import { countByStatus, filterItems, sortItems } from '../filter.js';
import { makeItem } from './fixtures.js';

describe('filterItems', () => {
  const items = [
    makeItem({ name: 'Blue Oxford Shirt', brand: 'Uniqlo', color: 'blue', category: 'top' }),
    makeItem({ name: 'Black Jeans', brand: 'Levis', color: 'black', category: 'bottom' }),
    makeItem({ name: 'Running Shoes', brand: 'Nike', color: 'white', category: 'shoes', status: 'dirty' }),
  ];

  it('returns everything when no filter is given', () => {
    expect(filterItems(items)).toHaveLength(3);
  });

  it('matches search terms case-insensitively across fields', () => {
    expect(filterItems(items, { search: 'uniqlo' })).toHaveLength(1);
    expect(filterItems(items, { search: 'BLUE' })[0]?.name).toBe('Blue Oxford Shirt');
  });

  it('requires every search term to match, so extra words narrow the result', () => {
    expect(filterItems(items, { search: 'blue shirt' })).toHaveLength(1);
    expect(filterItems(items, { search: 'blue jeans' })).toHaveLength(0);
  });

  it('filters by category and status', () => {
    expect(filterItems(items, { categories: ['top', 'bottom'] })).toHaveLength(2);
    expect(filterItems(items, { statuses: ['dirty'] })).toHaveLength(1);
  });

  it('combines filters conjunctively', () => {
    expect(filterItems(items, { categories: ['shoes'], statuses: ['clean'] })).toHaveLength(0);
  });

  it('filters favorites', () => {
    const withFavorite = [...items, makeItem({ name: 'Lucky Scarf', favorite: true })];
    expect(filterItems(withFavorite, { favoritesOnly: true })).toHaveLength(1);
  });

  it('ignores a whitespace-only search', () => {
    expect(filterItems(items, { search: '   ' })).toHaveLength(3);
  });
});

describe('sortItems', () => {
  const a = makeItem({ name: 'Anorak', wearCount: 2, createdAt: '2026-01-01T00:00:00.000Z' });
  const b = makeItem({ name: 'Beanie', wearCount: 9, createdAt: '2026-03-01T00:00:00.000Z' });
  const items = [a, b];

  it('sorts by name', () => {
    expect(sortItems(items, 'name').map((i) => i.name)).toEqual(['Anorak', 'Beanie']);
  });

  it('sorts most and least worn', () => {
    expect(sortItems(items, 'most-worn')[0]?.name).toBe('Beanie');
    expect(sortItems(items, 'least-worn')[0]?.name).toBe('Anorak');
  });

  it('sorts newest first', () => {
    expect(sortItems(items, 'recent')[0]?.name).toBe('Beanie');
  });

  it('does not mutate the input array', () => {
    const original = [...items];
    sortItems(items, 'name');
    expect(items).toEqual(original);
  });
});

describe('countByStatus', () => {
  it('counts each status and reports zero for unused ones', () => {
    const counts = countByStatus([
      makeItem({ status: 'clean' }),
      makeItem({ status: 'dirty' }),
      makeItem({ status: 'dirty' }),
    ]);
    expect(counts).toEqual({ clean: 1, dirty: 2, in_laundry: 0 });
  });
});
