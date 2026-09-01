import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from '../shared/api.js';
import type { WardrobeApi } from '../shared/api.js';

/**
 * The only surface the renderer gets. Every method is a thin `invoke` wrapper —
 * no Node APIs and no ipcRenderer itself are exposed to page code.
 */
const api: WardrobeApi = {
  items: {
    list: () => ipcRenderer.invoke(CHANNELS.itemsList),
    create: (draft) => ipcRenderer.invoke(CHANNELS.itemsCreate, draft),
    update: (id, draft) => ipcRenderer.invoke(CHANNELS.itemsUpdate, id, draft),
    remove: (id) => ipcRenderer.invoke(CHANNELS.itemsRemove, id),
    setStatus: (id, status) => ipcRenderer.invoke(CHANNELS.itemsSetStatus, id, status),
    wear: (id) => ipcRenderer.invoke(CHANNELS.itemsWear, id),
    pickPhoto: (id) => ipcRenderer.invoke(CHANNELS.itemsPickPhoto, id),
    clearPhoto: (id) => ipcRenderer.invoke(CHANNELS.itemsClearPhoto, id),
  },
  outfits: {
    list: () => ipcRenderer.invoke(CHANNELS.outfitsList),
    create: (draft) => ipcRenderer.invoke(CHANNELS.outfitsCreate, draft),
    update: (id, draft) => ipcRenderer.invoke(CHANNELS.outfitsUpdate, id, draft),
    remove: (id) => ipcRenderer.invoke(CHANNELS.outfitsRemove, id),
    wear: (id) => ipcRenderer.invoke(CHANNELS.outfitsWear, id),
  },
  laundry: {
    setStatusBulk: (ids, status) => ipcRenderer.invoke(CHANNELS.laundrySetStatusBulk, ids, status),
  },
};

contextBridge.exposeInMainWorld('wardrobe', api);
