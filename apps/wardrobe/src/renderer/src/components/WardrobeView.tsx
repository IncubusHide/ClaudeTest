import { useMemo, useState } from 'react';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  ITEM_SORT_LABELS,
  LAUNDRY_STATUSES,
  LAUNDRY_STATUS_LABELS,
  filterItems,
  nextLaundryStatus,
  sortItems,
} from '@wardrobe/core';
import type { Category, ClothingItem, ItemSort, LaundryStatus } from '@wardrobe/core';
import type { WardrobeStore } from '../useWardrobe.js';
import { ItemCard } from './ItemCard.js';
import { ItemFormDialog } from './ItemFormDialog.js';

const SORTS = Object.keys(ITEM_SORT_LABELS) as ItemSort[];

interface WardrobeViewProps {
  store: WardrobeStore;
}

export function WardrobeView({ store }: WardrobeViewProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [status, setStatus] = useState<LaundryStatus | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<ItemSort>('recent');
  const [editing, setEditing] = useState<ClothingItem | 'new' | null>(null);

  const visible = useMemo(
    () =>
      sortItems(
        filterItems(store.items, {
          search,
          categories: category === 'all' ? [] : [category],
          statuses: status === 'all' ? [] : [status],
          favoritesOnly,
        }),
        sort,
      ),
    [store.items, search, category, status, favoritesOnly, sort],
  );

  // `editing` holds a snapshot, so re-read from the store to pick up photo changes.
  const editingItem =
    editing && editing !== 'new'
      ? (store.items.find((item) => item.id === editing.id) ?? editing)
      : undefined;

  return (
    <section className="view">
      <header className="view__header">
        <div>
          <h1>Wardrobe</h1>
          <p className="view__subtitle">
            {store.items.length === visible.length
              ? `${store.items.length} item${store.items.length === 1 ? '' : 's'}`
              : `${visible.length} of ${store.items.length} items`}
          </p>
        </div>
        <button
          type="button"
          className="button button--primary"
          onClick={() => setEditing('new')}
        >
          Add item
        </button>
      </header>

      <div className="filters">
        <input
          className="filters__search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, brand, colour, notes…"
        />

        <select value={category} onChange={(event) => setCategory(event.target.value as never)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>

        <select value={status} onChange={(event) => setStatus(event.target.value as never)}>
          <option value="all">Any status</option>
          {LAUNDRY_STATUSES.map((value) => (
            <option key={value} value={value}>
              {LAUNDRY_STATUS_LABELS[value]}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(event) => setSort(event.target.value as ItemSort)}>
          {SORTS.map((value) => (
            <option key={value} value={value}>
              {ITEM_SORT_LABELS[value]}
            </option>
          ))}
        </select>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={favoritesOnly}
            onChange={(event) => setFavoritesOnly(event.target.checked)}
          />
          <span>Favourites</span>
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState hasItems={store.items.length > 0} onAdd={() => setEditing('new')} />
      ) : (
        <div className="grid">
          {visible.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => setEditing(item)}
              onCycleStatus={() => void store.setItemStatus(item.id, nextLaundryStatus(item.status))}
              onWear={() => void store.wearItem(item.id)}
            />
          ))}
        </div>
      )}

      {editing ? (
        <ItemFormDialog
          {...(editingItem ? { item: editingItem } : {})}
          onClose={() => setEditing(null)}
          onSave={async (draft) => {
            if (editingItem) {
              await store.updateItem(editingItem.id, draft);
              setEditing(null);
            } else {
              const created = await store.createItem(draft);
              // Keep the dialog open on the new item so a photo can be added.
              setEditing(created ?? null);
            }
          }}
          {...(editingItem
            ? {
                onPickPhoto: () => void store.pickPhoto(editingItem.id),
                onClearPhoto: () => void store.clearPhoto(editingItem.id),
                onDelete: () => {
                  void store.deleteItem(editingItem.id);
                  setEditing(null);
                },
              }
            : {})}
        />
      ) : null}
    </section>
  );
}

function EmptyState({ hasItems, onAdd }: { hasItems: boolean; onAdd(): void }) {
  if (hasItems) {
    return (
      <div className="empty">
        <p>Nothing matches those filters.</p>
      </div>
    );
  }

  return (
    <div className="empty">
      <p>Your wardrobe is empty.</p>
      <button type="button" className="button button--primary" onClick={onAdd}>
        Add your first item
      </button>
    </div>
  );
}
