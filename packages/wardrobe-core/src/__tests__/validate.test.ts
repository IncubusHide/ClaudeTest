import { describe, expect, it } from 'vitest';
import { emptyItemDraft, emptyOutfitDraft } from '../types.js';
import {
  MAX_NAME_LENGTH,
  normalizeItemDraft,
  validateItemDraft,
  validateOutfitDraft,
} from '../validate.js';

describe('validateItemDraft', () => {
  it('accepts a filled-in draft', () => {
    expect(validateItemDraft({ ...emptyItemDraft(), name: 'Wool coat' })).toEqual([]);
  });

  it('rejects a blank or whitespace-only name', () => {
    expect(validateItemDraft(emptyItemDraft())[0]?.field).toBe('name');
    expect(validateItemDraft({ ...emptyItemDraft(), name: '   ' })[0]?.field).toBe('name');
  });

  it('rejects an over-long name', () => {
    const draft = { ...emptyItemDraft(), name: 'x'.repeat(MAX_NAME_LENGTH + 1) };
    expect(validateItemDraft(draft)[0]?.field).toBe('name');
  });

  it('rejects an unknown category', () => {
    const draft = { ...emptyItemDraft(), name: 'Hat', category: 'hats' as never };
    expect(validateItemDraft(draft).map((e) => e.field)).toContain('category');
  });
});

describe('validateOutfitDraft', () => {
  it('requires a name and at least one item', () => {
    expect(validateOutfitDraft(emptyOutfitDraft()).map((e) => e.field)).toEqual([
      'name',
      'itemIds',
    ]);
  });

  it('rejects a duplicated item', () => {
    const draft = { name: 'Sunday', notes: '', itemIds: ['a', 'a'] };
    expect(validateOutfitDraft(draft).map((e) => e.field)).toContain('itemIds');
  });

  it('accepts a valid outfit', () => {
    expect(validateOutfitDraft({ name: 'Sunday', notes: '', itemIds: ['a', 'b'] })).toEqual([]);
  });
});

describe('normalizeItemDraft', () => {
  it('trims the free-text fields', () => {
    const result = normalizeItemDraft({
      ...emptyItemDraft(),
      name: '  Wool coat  ',
      brand: ' Acme ',
      color: ' navy ',
    });
    expect(result).toMatchObject({ name: 'Wool coat', brand: 'Acme', color: 'navy' });
  });
});
