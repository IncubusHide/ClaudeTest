import { CATEGORY_LABELS, nextLaundryStatus } from '@wardrobe/core';
import type { ClothingItem } from '@wardrobe/core';
import { Photo } from './Photo.js';
import { StatusPill } from './StatusPill.js';

interface ItemCardProps {
  item: ClothingItem;
  onEdit(): void;
  onCycleStatus(): void;
  onWear(): void;
}

export function ItemCard({ item, onEdit, onCycleStatus, onWear }: ItemCardProps) {
  const subtitle = [item.brand, item.color, item.size].filter(Boolean).join(' · ');

  return (
    <article className="card">
      <button type="button" className="card__photo" onClick={onEdit} title="Edit item">
        <Photo photoId={item.photoId} alt={item.name} category={item.category} />
        {item.favorite ? <span className="card__favorite" aria-label="Favourite">★</span> : null}
      </button>

      <div className="card__body">
        <h3 className="card__title" title={item.name}>
          {item.name}
        </h3>
        <p className="card__meta">{subtitle || CATEGORY_LABELS[item.category]}</p>

        <div className="card__actions">
          <StatusPill
            status={item.status}
            onClick={onCycleStatus}
            title={`Mark as ${nextLaundryStatus(item.status).replace('_', ' ')}`}
          />
          {item.status === 'clean' ? (
            <button
              type="button"
              className="button button--small"
              onClick={onWear}
              title="Mark as worn today"
            >
              Wear
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
