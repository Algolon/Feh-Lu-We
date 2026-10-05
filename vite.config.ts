import { defineConfig } from 'vitest/config';
import { execSync } from 'node:child_process';

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
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
