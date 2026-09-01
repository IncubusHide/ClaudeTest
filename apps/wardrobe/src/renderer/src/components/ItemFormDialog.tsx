import { useState } from 'react';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  LAUNDRY_STATUSES,
  LAUNDRY_STATUS_LABELS,
  emptyItemDraft,
  validateItemDraft,
} from '@wardrobe/core';
import type { ClothingItem, ClothingItemDraft } from '@wardrobe/core';
import { Dialog } from './Dialog.js';
import { Photo } from './Photo.js';

interface ItemFormDialogProps {
  /** Existing item when editing, undefined when adding a new one. */
  item?: ClothingItem;
  onSave(draft: ClothingItemDraft): void;
  onClose(): void;
  onPickPhoto?(): void;
  onClearPhoto?(): void;
  onDelete?(): void;
}

function draftFrom(item?: ClothingItem): ClothingItemDraft {
  if (!item) return emptyItemDraft();
  const { name, category, color, brand, size, notes, status, favorite } = item;
  return { name, category, color, brand, size, notes, status, favorite };
}

export function ItemFormDialog({
  item,
  onSave,
  onClose,
  onPickPhoto,
  onClearPhoto,
  onDelete,
}: ItemFormDialogProps) {
  const [draft, setDraft] = useState<ClothingItemDraft>(() => draftFrom(item));
  const [showErrors, setShowErrors] = useState(false);

  const errors = validateItemDraft(draft);
  const errorFor = (field: string) =>
    showErrors ? errors.find((error) => error.field === field)?.message : undefined;

  const patch = <K extends keyof ClothingItemDraft>(key: K, value: ClothingItemDraft[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));

  const submit = () => {
    if (errors.length > 0) {
      setShowErrors(true);
      return;
    }
    onSave(draft);
  };

  return (
    <Dialog
      title={item ? 'Edit item' : 'Add an item'}
      onClose={onClose}
      footer={
        <>
          {onDelete ? (
            <button type="button" className="button button--danger" onClick={onDelete}>
              Delete
            </button>
          ) : null}
          <div className="spacer" />
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="button button--primary" onClick={submit}>
            {item ? 'Save changes' : 'Add to wardrobe'}
          </button>
        </>
      }
    >
      <div className="item-form">
        <div className="item-form__photo">
          <Photo
            photoId={item?.photoId ?? null}
            alt={draft.name || 'New item'}
            category={draft.category}
            variant="full"
          />
          {item ? (
            <div className="item-form__photo-actions">
              <button type="button" className="button button--small" onClick={onPickPhoto}>
                {item.photoId ? 'Replace photo' : 'Add photo'}
              </button>
              {item.photoId ? (
                <button type="button" className="button button--small" onClick={onClearPhoto}>
                  Remove
                </button>
              ) : null}
            </div>
          ) : (
            <p className="hint">Save the item first, then add a photo.</p>
          )}
        </div>

        <div className="item-form__fields">
          <label className="field">
            <span>Name</span>
            <input
              autoFocus
              value={draft.name}
              onChange={(event) => patch('name', event.target.value)}
              placeholder="Blue oxford shirt"
            />
            {errorFor('name') ? <em className="field__error">{errorFor('name')}</em> : null}
          </label>

          <div className="field-row">
            <label className="field">
              <span>Category</span>
              <select
                value={draft.category}
                onChange={(event) => patch('category', event.target.value as never)}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Status</span>
              <select
                value={draft.status}
                onChange={(event) => patch('status', event.target.value as never)}
              >
                {LAUNDRY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {LAUNDRY_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Colour</span>
              <input
                value={draft.color}
                onChange={(event) => patch('color', event.target.value)}
                placeholder="navy"
              />
            </label>
            <label className="field">
              <span>Brand</span>
              <input
                value={draft.brand}
                onChange={(event) => patch('brand', event.target.value)}
                placeholder="Uniqlo"
              />
            </label>
            <label className="field field--narrow">
              <span>Size</span>
              <input
                value={draft.size}
                onChange={(event) => patch('size', event.target.value)}
                placeholder="M"
              />
            </label>
          </div>

          <label className="field">
            <span>Notes</span>
            <textarea
              rows={3}
              value={draft.notes}
              onChange={(event) => patch('notes', event.target.value)}
              placeholder="Dry clean only, gift from Anna…"
            />
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.favorite}
              onChange={(event) => patch('favorite', event.target.checked)}
            />
            <span>Favourite</span>
          </label>
        </div>
      </div>
    </Dialog>
  );
}
