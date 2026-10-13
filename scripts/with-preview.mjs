// Run an existing browser harness beside its preview server (same process/network environment).
// Usage: CHROME=/path/to/chrome node scripts/with-preview.mjs e2e.mjs
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const script = process.argv[2] ?? 'e2e.mjs';
if (!/^[-\w]+\.mjs$/.test(script)) throw new Error('Pass a script filename within scripts/.');
if (!process.env.CHROME) {
  const shell = `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell`;
  process.env.CHROME = existsSync(shell) ? shell : chromium.executablePath();
}
const server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: false } });
const target = new URL(script, import.meta.url);
process.argv = [process.argv[0], fileURLToPath(target), server.resolvedUrls.local[0], ...process.argv.slice(3)];
try { await import(target.href); }
finally { await new Promise(resolve => server.httpServer.close(resolve)); }
