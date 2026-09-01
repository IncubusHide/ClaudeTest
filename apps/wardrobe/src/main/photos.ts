import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { nativeImage } from 'electron';

/** Long edge of the stored display image. Phone photos are far larger. */
const FULL_MAX_WIDTH = 1600;
/** Long edge of the grid thumbnail. */
const THUMB_MAX_WIDTH = 480;
const JPEG_QUALITY = 82;

export type PhotoVariant = 'full' | 'thumb';

export class PhotoStore {
  private readonly dir: string;

  constructor(dataDir: string) {
    this.dir = join(dataDir, 'photos');
    if (!existsSync(this.dir)) mkdirSync(this.dir, { recursive: true });
  }

  path(photoId: string, variant: PhotoVariant): string {
    // Guard against a crafted id escaping the photos directory.
    if (!/^[0-9a-f-]{36}$/i.test(photoId)) {
      throw new Error(`Invalid photo id: ${photoId}`);
    }
    return join(this.dir, `${photoId}.${variant}.jpg`);
  }

  /**
   * Copies an image into the store as two JPEGs: a size-capped display image
   * and a grid thumbnail. The user's original file is left untouched on disk.
   *
   * Returns the new photo id, or null if the file could not be decoded.
   */
  import(sourcePath: string): string | null {
    const source = nativeImage.createFromPath(sourcePath);
    if (source.isEmpty()) return null;

    const photoId = randomUUID();
    writeFileSync(this.path(photoId, 'full'), toJpeg(source, FULL_MAX_WIDTH));
    writeFileSync(this.path(photoId, 'thumb'), toJpeg(source, THUMB_MAX_WIDTH));
    return photoId;
  }

  remove(photoId: string): void {
    for (const variant of ['full', 'thumb'] as const) {
      rmSync(this.path(photoId, variant), { force: true });
    }
  }

  exists(photoId: string, variant: PhotoVariant): boolean {
    return existsSync(this.path(photoId, variant));
  }
}

/** Downscales to `maxWidth` (never upscales) and encodes as JPEG. */
function toJpeg(image: Electron.NativeImage, maxWidth: number): Buffer {
  const { width } = image.getSize();
  const sized = width > maxWidth ? image.resize({ width: maxWidth, quality: 'good' }) : image;
  return sized.toJPEG(JPEG_QUALITY);
}
