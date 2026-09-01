import { useState } from 'react';
import { outfitAvailability } from '@wardrobe/core';
import type { Outfit } from '@wardrobe/core';
import type { WardrobeStore } from '../useWardrobe.js';
import { OutfitFormDialog } from './OutfitFormDialog.js';
import { Photo } from './Photo.js';

interface OutfitsViewProps {
  store: WardrobeStore;
}

export function OutfitsView({ store }: OutfitsViewProps) {
  const [editing, setEditing] = useState<Outfit | 'new' | null>(null);
  const editingOutfit = editing && editing !== 'new' ? editing : undefined;

  return (
    <section className="view">
      <header className="view__header">
        <div>
          <h1>Outfits</h1>
          <p className="view__subtitle">
            {store.outfits.length} saved combination{store.outfits.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          type="button"
          className="button button--primary"
          onClick={() => setEditing('new')}
          disabled={store.items.length === 0}
          title={store.items.length === 0 ? 'Add some items first' : undefined}
        >
          New outfit
        </button>
      </header>

      {store.outfits.length === 0 ? (
        <div className="empty">
          <p>
            {store.items.length === 0
              ? 'Add a few items to your wardrobe, then combine them into outfits.'
              : 'No outfits yet. Group items you like wearing together.'}
          </p>
        </div>
      ) : (
        <div className="outfit-list">
          {store.outfits.map((outfit) => {
            const availability = outfitAvailability(outfit, store.items);
            const members = [...availability.available, ...availability.unavailable];

            return (
              <article className="outfit" key={outfit.id}>
                <div className="outfit__main">
                  <div className="outfit__heading">
                    <h3>{outfit.name}</h3>
                    <span className={availability.wearable ? 'badge badge--ok' : 'badge'}>
                      {availability.wearable
                        ? 'Ready to wear'
                        : `${availability.unavailable.length} in the wash`}
                    </span>
                  </div>

                  {outfit.notes ? <p className="outfit__notes">{outfit.notes}</p> : null}

                  <div className="outfit__items">
                    {members.map((item) => (
                      <div
                        key={item.id}
                        className={item.status === 'clean' ? 'outfit__item' : 'outfit__item is-dirty'}
                        title={`${item.name}${item.status === 'clean' ? '' : ' — not clean'}`}
                      >
                        <Photo photoId={item.photoId} alt={item.name} category={item.category} />
                      </div>
                    ))}
                  </div>

                  {outfit.wearCount > 0 ? (
                    <p className="hint">
                      Worn {outfit.wearCount} time{outfit.wearCount === 1 ? '' : 's'}
                    </p>
                  ) : null}
                </div>

                <div className="outfit__actions">
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => void store.wearOutfit(outfit.id)}
                    disabled={outfit.itemIds.length === 0}
                    title="Marks every piece as worn and sends it to the laundry pile"
                  >
                    Wear today
                  </button>
                  <button type="button" className="button" onClick={() => setEditing(outfit)}>
                    Edit
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing ? (
        <OutfitFormDialog
          {...(editingOutfit ? { outfit: editingOutfit } : {})}
          items={store.items}
          onClose={() => setEditing(null)}
          onSave={async (draft) => {
            if (editingOutfit) await store.updateOutfit(editingOutfit.id, draft);
            else await store.createOutfit(draft);
            setEditing(null);
          }}
          {...(editingOutfit
            ? {
                onDelete: () => {
                  void store.deleteOutfit(editingOutfit.id);
                  setEditing(null);
                },
              }
            : {})}
        />
      ) : null}
    </section>
  );
}
