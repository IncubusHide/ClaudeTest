import { BrowserWindow, dialog, ipcMain } from 'electron';
import type { ClothingItem, ClothingItemDraft, LaundryStatus, OutfitDraft } from '@wardrobe/core';
import { CHANNELS } from '../shared/api.js';
import type { PhotoStore } from './photos.js';
import type { WardrobeRepository } from './repository.js';

const IMAGE_FILTERS = [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'] }];

export function registerIpcHandlers(repo: WardrobeRepository, photos: PhotoStore): void {
  // -------------------------------------------------------------- items
  ipcMain.handle(CHANNELS.itemsList, () => repo.listItems());

  ipcMain.handle(CHANNELS.itemsCreate, (_event, draft: ClothingItemDraft) => repo.createItem(draft));

  ipcMain.handle(CHANNELS.itemsUpdate, (_event, id: string, draft: ClothingItemDraft) =>
    repo.updateItem(id, draft),
  );

  ipcMain.handle(CHANNELS.itemsRemove, (_event, id: string) => {
    const photoId = repo.deleteItem(id);
    if (photoId) photos.remove(photoId);
  });

  ipcMain.handle(CHANNELS.itemsSetStatus, (_event, id: string, status: LaundryStatus) =>
    repo.setItemStatus(id, status),
  );

  ipcMain.handle(CHANNELS.itemsWear, (_event, id: string) => repo.wearItem(id));

  ipcMain.handle(
    CHANNELS.itemsPickPhoto,
    async (event, id: string): Promise<ClothingItem | null> => {
      const window = BrowserWindow.fromWebContents(event.sender);
      const options: Electron.OpenDialogOptions = {
        title: 'Choose a photo',
        properties: ['openFile'],
        filters: IMAGE_FILTERS,
      };

      const result = window
        ? await dialog.showOpenDialog(window, options)
        : await dialog.showOpenDialog(options);

      const sourcePath = result.filePaths[0];
      if (result.canceled || !sourcePath) return null;

      const photoId = photos.import(sourcePath);
      if (!photoId) {
        await dialog.showMessageBox({
          type: 'error',
          message: 'That image could not be read.',
          detail: 'Try a JPEG or PNG file. HEIC photos from an iPhone are not supported yet.',
        });
        return null;
      }

      // Replacing a photo should not leave the previous files behind.
      const previous = repo.getItem(id).photoId;
      const updated = repo.setItemPhoto(id, photoId);
      if (previous) photos.remove(previous);
      return updated;
    },
  );

  ipcMain.handle(CHANNELS.itemsClearPhoto, (_event, id: string) => {
    const previous = repo.getItem(id).photoId;
    const updated = repo.setItemPhoto(id, null);
    if (previous) photos.remove(previous);
    return updated;
  });

  // ------------------------------------------------------------ outfits
  ipcMain.handle(CHANNELS.outfitsList, () => repo.listOutfits());

  ipcMain.handle(CHANNELS.outfitsCreate, (_event, draft: OutfitDraft) => repo.createOutfit(draft));

  ipcMain.handle(CHANNELS.outfitsUpdate, (_event, id: string, draft: OutfitDraft) =>
    repo.updateOutfit(id, draft),
  );

  ipcMain.handle(CHANNELS.outfitsRemove, (_event, id: string) => repo.deleteOutfit(id));

  ipcMain.handle(CHANNELS.outfitsWear, (_event, id: string) => repo.wearOutfit(id));

  // ------------------------------------------------------------ laundry
  ipcMain.handle(
    CHANNELS.laundrySetStatusBulk,
    (_event, ids: string[], status: LaundryStatus) => repo.setStatusBulk(ids, status),
  );
}
