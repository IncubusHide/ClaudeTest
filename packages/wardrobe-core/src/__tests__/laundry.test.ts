import { describe, expect, it } from 'vitest';
import { isAvailable, nextLaundryStatus, outfitAvailability, wearItem } from '../laundry.js';
import { makeItem, makeOutfit } from './fixtures.js';

describe('nextLaundryStatus', () => {
  it('cycles clean -> dirty -> in_laundry -> clean', () => {
    expect(nextLaundryStatus('clean')).toBe('dirty');
    expect(nextLaundryStatus('dirty')).toBe('in_laundry');
    expect(nextLaundryStatus('in_laundry')).toBe('clean');
  });
});

describe('wearItem', () => {
  it('marks the item dirty, increments the counter and stamps the date', () => {
    const item = makeItem({ wearCount: 3, status: 'clean' });
    const now = new Date('2026-05-04T12:00:00.000Z');

    expect(wearItem(item, now)).toEqual({
      status: 'dirty',
      wearCount: 4,
      lastWornAt: '2026-05-04T12:00:00.000Z',
    });
  });

  it('does not mutate the item it is given', () => {
    const item = makeItem({ wearCount: 1 });
    wearItem(item);
    expect(item.wearCount).toBe(1);
    expect(item.status).toBe('clean');
  });
});

describe('isAvailable', () => {
  it('is true only for clean items', () => {
    expect(isAvailable(makeItem({ status: 'clean' }))).toBe(true);
    expect(isAvailable(makeItem({ status: 'dirty' }))).toBe(false);
    expect(isAvailable(makeItem({ status: 'in_laundry' }))).toBe(false);
  });
});

describe('outfitAvailability', () => {
  it('reports an outfit wearable when every item is clean', () => {
    const shirt = makeItem({ status: 'clean' });
    const jeans = makeItem({ status: 'clean' });
    const outfit = makeOutfit({ itemIds: [shirt.id, jeans.id] });

    const result = outfitAvailability(outfit, [shirt, jeans]);

    expect(result.wearable).toBe(true);
    expect(result.available).toHaveLength(2);
    expect(result.unavailable).toHaveLength(0);
  });

  it('splits out the items that are dirty or in the wash', () => {
    const shirt = makeItem({ status: 'clean' });
    const jeans = makeItem({ status: 'in_laundry' });
    const outfit = makeOutfit({ itemIds: [shirt.id, jeans.id] });

    const result = outfitAvailability(outfit, [shirt, jeans]);

    expect(result.wearable).toBe(false);
    expect(result.unavailable.map((i) => i.id)).toEqual([jeans.id]);
  });

  it('reports ids whose item was deleted', () => {
    const shirt = makeItem({ status: 'clean' });
    const outfit = makeOutfit({ itemIds: [shirt.id, 'deleted-item'] });

    const result = outfitAvailability(outfit, [shirt]);

    expect(result.missingIds).toEqual(['deleted-item']);
    expect(result.wearable).toBe(false);
  });

  it('treats an empty outfit as not wearable', () => {
    expect(outfitAvailability(makeOutfit({ itemIds: [] }), []).wearable).toBe(false);
  });
});
