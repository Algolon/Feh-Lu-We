// Evidence only: fixed camera poses and observed-clue fixtures, never a gameplay route assertion.
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const out = process.env.E2E_OUT ?? 'scripts/out/ui-r02-baseline';
mkdirSync(out, { recursive: true });
const base = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? chromium.executablePath(), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 852, height: 393 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
try {
  const page = await context.newPage();
  await page.goto(base + '?review=boslust&autotest=1');
  await page.click('[data-review-start]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate');
  await page.evaluate(readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8'));
  await page.evaluate(() => {
    document.querySelector('#review-bar').remove();
    const g = T.G(); g.player.x = 63; g.player.z = 11.5; g.player.y = g.world.col.ground(63, 11.5);
    g.player.yaw = 0; g.player.pitch = 0.05; T.tick(4);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/boslust-exploration.jpg`, type: 'jpeg', quality: 90 });
  await page.click('#b-notes');
  await page.screenshot({ path: `${out}/boslust-notebook-threads.jpg`, type: 'jpeg', quality: 90 });
  await page.click('[data-t="a"]');
  await page.screenshot({ path: `${out}/boslust-notebook-evidence.jpg`, type: 'jpeg', quality: 90 });
  writeFileSync(`${out}/provenance.json`, JSON.stringify({ viewport: { width: 852, height: 393 }, pose: { x: 63, z: 11.5, yaw: 0, pitch: 0.05 }, state: 'existing isolated BOSLUST art-review fixture', screenshots: 'actual production game browser captures, no image generation' }, null, 2));
} finally {
  await browser.close();
}
