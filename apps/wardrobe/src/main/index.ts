import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BrowserWindow, app, nativeTheme, protocol, shell } from 'electron';
import { PHOTO_PROTOCOL } from '../shared/api.js';
import { openDatabase } from './db.js';
import { registerIpcHandlers } from './ipc.js';
import { PhotoStore } from './photos.js';
import { WardrobeRepository } from './repository.js';

// The package name (@apps/wardrobe) would become a nested, scope-prefixed
// folder under %APPDATA%, and would differ between `npm run dev` and the
// packaged build. Pinning the name keeps one predictable database location.
app.setName('Wardrobe Tracker');

// Must run before the app is ready: tells Chromium the photo scheme behaves
// like https, so images load under the renderer's content security policy.
protocol.registerSchemesAsPrivileged([
  {
    scheme: PHOTO_PROTOCOL,
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 940,
    minHeight: 620,
    show: false,
    // The app draws its own title bar so the chrome matches the theme.
    frame: false,
    // Matches the stylesheet, so there is no flash of the wrong colour.
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#241c15' : '#e9d9bc',
    title: 'Wardrobe Tracker',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Avoid the white flash while the renderer paints its first frame.
  window.once('ready-to-show', () => window.show());

  // Any target="_blank" link opens in the user's browser, never in the app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  const devServerUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}

function registerPhotoProtocol(photos: PhotoStore): void {
  protocol.handle(PHOTO_PROTOCOL, async (request) => {
    const url = new URL(request.url);
    const variant = url.hostname === 'full' ? 'full' : 'thumb';
    const photoId = decodeURIComponent(url.pathname).replace(/^\//, '');

    try {
      const data = await readFile(photos.path(photoId, variant));
      return new Response(new Uint8Array(data), {
        headers: { 'content-type': 'image/jpeg', 'cache-control': 'no-cache' },
      });
    } catch {
      // A missing or malformed id is not exceptional: the item may have had its
      // photo removed while the renderer still held the old URL.
      return new Response('Photo not found', { status: 404 });
    }
  });
}

void app.whenReady().then(() => {
  const dataDir = app.getPath('userData');
  const db = openDatabase(dataDir);
  const photos = new PhotoStore(dataDir);

  registerPhotoProtocol(photos);
  registerIpcHandlers(new WardrobeRepository(db), photos);

  app.on('will-quit', () => db.close());

  createWindow();

  // macOS keeps the app alive with no windows; re-open one from the dock.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
