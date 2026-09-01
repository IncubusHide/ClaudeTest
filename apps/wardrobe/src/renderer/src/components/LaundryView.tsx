import { LAUNDRY_STATUS_LABELS, filterItems } from '@wardrobe/core';
import type { ClothingItem, LaundryStatus } from '@wardrobe/core';
import type { WardrobeStore } from '../useWardrobe.js';
import { Photo } from './Photo.js';

interface LaundryViewProps {
  store: WardrobeStore;
}

export function LaundryView({ store }: LaundryViewProps) {
  const dirty = filterItems(store.items, { statuses: ['dirty'] });
  const washing = filterItems(store.items, { statuses: ['in_laundry'] });

  return (
    <section className="view">
      <header className="view__header">
        <div>
          <h1>Laundry</h1>
          <p className="view__subtitle">
            {dirty.length + washing.length === 0
              ? 'Everything is clean.'
              : `${dirty.length} to wash, ${washing.length} in the machine`}
          </p>
        </div>
      </header>

      <LaundryGroup
        title="Needs washing"
        emptyText="Nothing waiting to be washed."
        items={dirty}
        action={{
          label: 'Put all in the laundry',
          run: () => void store.setStatusBulk(dirty.map((item) => item.id), 'in_laundry'),
        }}
        itemAction={{
          label: 'To laundry',
          status: 'in_laundry',
          store,
        }}
      />

      <LaundryGroup
        title="In the laundry"
        emptyText="The machine is empty."
        items={washing}
        action={{
          label: 'Mark all as clean',
          run: () => void store.setStatusBulk(washing.map((item) => item.id), 'clean'),
        }}
        itemAction={{
          label: 'Clean',
          status: 'clean',
          store,
        }}
      />
    </section>
  );
}

interface LaundryGroupProps {
  title: string;
  emptyText: string;
  items: ClothingItem[];
  action: { label: string; run(): void };
  itemAction: { label: string; status: LaundryStatus; store: WardrobeStore };
}

function LaundryGroup({ title, emptyText, items, action, itemAction }: LaundryGroupProps) {
  return (
    <div className="laundry-group">
      <div className="laundry-group__header">
        <h2>
          {title} <span className="count">{items.length}</span>
        </h2>
        {items.length > 0 ? (
          <button type="button" className="button button--small" onClick={action.run}>
            {action.label}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="hint">{emptyText}</p>
      ) : (
        <ul className="laundry-list">
          {items.map((item) => (
            <li key={item.id}>
              <Photo photoId={item.photoId} alt={item.name} category={item.category} />
              <div className="laundry-list__text">
                <strong>{item.name}</strong>
                <span className="hint">{LAUNDRY_STATUS_LABELS[item.status]}</span>
              </div>
              <button
                type="button"
                className="button button--small"
                onClick={() => void itemAction.store.setItemStatus(item.id, itemAction.status)}
              >
                {itemAction.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
