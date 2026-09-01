import { useMemo, useState } from 'react';
import { emptyOutfitDraft, filterItems, validateOutfitDraft } from '@wardrobe/core';
import type { ClothingItem, Outfit, OutfitDraft } from '@wardrobe/core';
import { Dialog } from './Dialog.js';
import { Photo } from './Photo.js';

interface OutfitFormDialogProps {
  outfit?: Outfit;
  items: ClothingItem[];
  onSave(draft: OutfitDraft): void;
  onClose(): void;
  onDelete?(): void;
}

function draftFrom(outfit?: Outfit): OutfitDraft {
  if (!outfit) return emptyOutfitDraft();
  return { name: outfit.name, notes: outfit.notes, itemIds: [...outfit.itemIds] };
}

export function OutfitFormDialog({
  outfit,
  items,
  onSave,
  onClose,
  onDelete,
}: OutfitFormDialogProps) {
  const [draft, setDraft] = useState<OutfitDraft>(() => draftFrom(outfit));
  const [search, setSearch] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const errors = validateOutfitDraft(draft);
  const errorFor = (field: string) =>
    showErrors ? errors.find((error) => error.field === field)?.message : undefined;

  const selected = useMemo(() => new Set(draft.itemIds), [draft.itemIds]);
  const visible = useMemo(() => filterItems(items, { search }), [items, search]);

  const toggle = (id: string) =>
    setDraft((previous) => ({
      ...previous,
      itemIds: previous.itemIds.includes(id)
        ? previous.itemIds.filter((candidate) => candidate !== id)
        : [...previous.itemIds, id],
    }));

  const submit = () => {
    if (errors.length > 0) {
      setShowErrors(true);
      return;
    }
    onSave(draft);
  };

  return (
    <Dialog
      wide
      title={outfit ? 'Edit outfit' : 'New outfit'}
      onClose={onClose}
      footer={
        <>
          {onDelete ? (
            <button type="button" className="button button--danger" onClick={onDelete}>
              Delete
            </button>
          ) : null}
          <div className="spacer" />
          <span className="hint">
            {draft.itemIds.length} item{draft.itemIds.length === 1 ? '' : 's'} selected
          </span>
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="button button--primary" onClick={submit}>
            {outfit ? 'Save changes' : 'Create outfit'}
          </button>
        </>
      }
    >
      <div className="outfit-form">
        <div className="field-row">
          <label className="field">
            <span>Name</span>
            <input
              autoFocus
              value={draft.name}
              onChange={(event) => setDraft((p) => ({ ...p, name: event.target.value }))}
              placeholder="Friday dinner"
            />
            {errorFor('name') ? <em className="field__error">{errorFor('name')}</em> : null}
          </label>
          <label className="field">
            <span>Notes</span>
            <input
              value={draft.notes}
              onChange={(event) => setDraft((p) => ({ ...p, notes: event.target.value }))}
              placeholder="Smart casual, works in the cold"
            />
          </label>
        </div>

        <div className="picker">
          <div className="picker__header">
            <strong>Pick the pieces</strong>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter items…"
            />
          </div>
          {errorFor('itemIds') ? <em className="field__error">{errorFor('itemIds')}</em> : null}

          {visible.length === 0 ? (
            <p className="hint">No items match that search.</p>
          ) : (
            <div className="picker__grid">
              {visible.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={selected.has(item.id) ? 'chip chip--on' : 'chip'}
                  onClick={() => toggle(item.id)}
                  aria-pressed={selected.has(item.id)}
                >
                  <Photo photoId={item.photoId} alt={item.name} category={item.category} />
                  <span className="chip__label">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
