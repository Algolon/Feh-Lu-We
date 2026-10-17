import { defineConfig } from 'vitest/config';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Build identifier shown in the pause menu and in playtest feedback, so reports name the tested build.
function buildId() {
  let sha = 'unknown';
  try { sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* not a git checkout */ }
  return `${sha} · ${new Date().toISOString().slice(0, 10)}`;
}

// GitHub Pages project site: https://algolon.github.io/Feh-Lu-We/
export default defineConfig({
  base: '/Feh-Lu-We/',
  define: { __BUILD__: JSON.stringify(buildId()) },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    // Publish / and /game/ from one shared codebase, under the existing Pages artifact.
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        family: fileURLToPath(new URL('./game/index.html', import.meta.url)),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
