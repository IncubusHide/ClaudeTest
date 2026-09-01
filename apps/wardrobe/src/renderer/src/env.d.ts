/// <reference types="vite/client" />
import type { WardrobeApi } from '../../shared/api.js';

declare global {
  interface Window {
    /** Exposed by the preload script via contextBridge. */
    wardrobe: WardrobeApi;
  }
}

export {};
