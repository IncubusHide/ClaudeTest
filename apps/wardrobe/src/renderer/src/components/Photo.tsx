import { CATEGORY_LABELS } from '@wardrobe/core';
import type { Category } from '@wardrobe/core';
import { photoUrl } from '../../../shared/api.js';
import { PixelSprite } from './PixelSprite.js';

interface PhotoProps {
  photoId: string | null;
  alt: string;
  category: Category;
  variant?: 'thumb' | 'full';
}

/** Item photo, falling back to the category's pixel sprite when there is none. */
export function Photo({ photoId, alt, category, variant = 'thumb' }: PhotoProps) {
  if (!photoId) {
    return (
      <div className="photo photo--empty" aria-label={`${alt} (no photo)`}>
        <PixelSprite category={category} />
        <span>{CATEGORY_LABELS[category]}</span>
      </div>
    );
  }

  return <img className="photo" src={photoUrl(photoId, variant)} alt={alt} loading="lazy" />;
}
