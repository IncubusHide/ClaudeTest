import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Only the main-process modules that are free of Electron imports are unit
    // tested here; the UI is exercised by running the app.
    include: ['src/main/**/*.test.ts'],
  },
});
