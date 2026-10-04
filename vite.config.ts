import { defineConfig } from 'vitest/config';

// GitHub Pages project site: https://algolon.github.io/Feh-Lu-We/
export default defineConfig({
  base: '/Feh-Lu-We/',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
