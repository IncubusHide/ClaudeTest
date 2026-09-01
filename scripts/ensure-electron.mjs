/**
 * Makes sure Electron's runtime binary is actually on disk after `npm install`.
 *
 * The `electron` package downloads its ~100 MB runtime in a postinstall script.
 * npm skips that script when the package directory already exists from an
 * earlier interrupted or failed install, which leaves a package that looks
 * installed but has no binary. `electron-vite dev` then fails late and
 * unhelpfully with "Error: Electron uninstall".
 *
 * Re-running the download here is cheap when the binary is present (a single
 * file check) and self-healing when it is not.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

// CI only typechecks and builds, so it deliberately skips the download.
if (process.env.ELECTRON_SKIP_BINARY_DOWNLOAD) process.exit(0);

let electronDir;
try {
  electronDir = dirname(require.resolve('electron/package.json'));
} catch {
  // Electron is not installed at all (for example `npm install --omit=dev`).
  process.exit(0);
}

const pathTxt = join(electronDir, 'path.txt');
if (existsSync(pathTxt)) {
  const binary = join(electronDir, 'dist', readFileSync(pathTxt, 'utf8').trim());
  if (existsSync(binary)) process.exit(0);
}

console.log('Electron runtime binary is missing; downloading it (this can take a few minutes)…');

const result = spawnSync(process.execPath, [join(electronDir, 'install.js')], {
  cwd: electronDir,
  stdio: 'inherit',
});

if (result.status !== 0) {
  // Do not fail the whole install over a network hiccup: say plainly what to
  // do, and note that simply running `npm install` again retries this step.
  console.warn(
    '\nCould not download the Electron runtime.\n' +
      'Check your internet connection, then run `npm install` again.\n' +
      'The app cannot start until this succeeds.\n',
  );
}
