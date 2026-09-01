import { CATEGORIES, LAUNDRY_STATUSES } from './types.js';
import type { ClothingItemDraft, OutfitDraft } from './types.js';

export interface ValidationError {
  field: string;
  message: string;
}

export const MAX_NAME_LENGTH = 80;
export const MAX_NOTES_LENGTH = 2000;

export function validateItemDraft(draft: ClothingItemDraft): ValidationError[] {
  const errors: ValidationError[] = [];

  const name = draft.name.trim();
  if (!name) {
    errors.push({ field: 'name', message: 'Give the item a name.' });
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.push({ field: 'name', message: `Keep the name under ${MAX_NAME_LENGTH} characters.` });
  }

  if (!CATEGORIES.includes(draft.category)) {
    errors.push({ field: 'category', message: 'Pick a category.' });
  }

  if (!LAUNDRY_STATUSES.includes(draft.status)) {
    errors.push({ field: 'status', message: 'Pick a laundry status.' });
  }

  if (draft.notes.length > MAX_NOTES_LENGTH) {
    errors.push({ field: 'notes', message: `Notes are limited to ${MAX_NOTES_LENGTH} characters.` });
  }

  return errors;
}

export function validateOutfitDraft(draft: OutfitDraft): ValidationError[] {
  const errors: ValidationError[] = [];

  const name = draft.name.trim();
  if (!name) {
    errors.push({ field: 'name', message: 'Give the outfit a name.' });
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.push({ field: 'name', message: `Keep the name under ${MAX_NAME_LENGTH} characters.` });
  }

  if (draft.itemIds.length === 0) {
    errors.push({ field: 'itemIds', message: 'Add at least one item to the outfit.' });
  }

  if (new Set(draft.itemIds).size !== draft.itemIds.length) {
    errors.push({ field: 'itemIds', message: 'The same item was added twice.' });
  }

  return errors;
}

/** Trims the free-text fields so stored data stays tidy. */
export function normalizeItemDraft(draft: ClothingItemDraft): ClothingItemDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    color: draft.color.trim(),
    brand: draft.brand.trim(),
    size: draft.size.trim(),
    notes: draft.notes.trim(),
  };
}

export function normalizeOutfitDraft(draft: OutfitDraft): OutfitDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    notes: draft.notes.trim(),
  };
}
