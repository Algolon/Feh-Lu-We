// Capture comparison screenshots at fixed viewpoints (same poses before/after a change).
// Usage: node scripts/views.mjs <outDir> [baseUrl]   (needs `npm run preview` running)
// Software-rendered (SwiftShader): useful for composition comparison, not for performance.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? 'scripts/out/views';
const BASE = process.argv[3] ?? 'http://localhost:4173/Feh-Lu-We/';
mkdirSync(OUT, { recursive: true });
const ESS = ['invitation', 'torch', 'matches', 'notebook', 'frontKey'];
const all = { leftHome: true };
const views = [
  ['01-home-table', null, { x: 2.6, y: 0, z: 1.9, yaw: 0.85, pitch: -0.35 }],
  ['02-forecourt', {}, { x: 60, y: 0, z: 41, yaw: 0, pitch: 0.06 }],
  ['03-hall', {}, { x: 60, y: 0.15, z: 54.2, yaw: 0, pitch: 0.12 }],
  ['04-living-mantel', {}, { x: 51.4, y: 0.15, z: 62, yaw: -Math.PI / 2, pitch: -0.05 }],
  ['05-landing', { inventory: [...ESS, 'studyKey'] }, { x: 59, y: 3.35, z: 72.5, yaw: -2.2, pitch: -0.05 }],
  ['06-pool', {}, { x: 75.5, y: 0.15, z: 65.2, yaw: 0.35, pitch: -0.25 }],
  ['07-sauna', { open: { 'door.front': true, 'door.sauna': true } }, { x: 87, y: 0.8, z: 72.2, yaw: Math.PI, pitch: 0.05 }],
  ['08-garden', {}, { x: 50, y: 0, z: 97, yaw: 2.6, pitch: 0.02 }],
  ['09-shed', {}, { x: 35, y: 0, z: 30, yaw: -2.1, pitch: 0 }],
  ['10-fire', { flags: { ...all, firewood: true, fireLit: true }, lit: { 'fire.clearing': true } }, { x: 18.5, y: 0, z: 16, yaw: -2.3, pitch: -0.1 }],
  ['11-well', {}, { x: 96, y: 0, z: 21, yaw: 0, pitch: 0 }],
  ['12-cottage', {}, { x: 27, y: 0, z: 81.5, yaw: -0.25, pitch: 0.04 }],
];
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
for (const [name, extra, pose] of views) {
  await page.goto(BASE + '?autotest=1');
  const save = extra === null
    ? { version: 2, scene: 'home', inventory: ['frontKey'], player: { home: pose } }
    : { version: 2, scene: 'estate', inventory: ESS, flags: all, unlocked: ['lock.door.front'], open: { 'door.front': true }, ...extra, player: { estate: pose } };
  await page.evaluate((s) => { localStorage.setItem('fehluwe.save', JSON.stringify(s)); localStorage.setItem('fehluwe.settings', JSON.stringify({ quality: 'high' })); }, save);
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world);
  await page.evaluate(() => { const t = document.getElementById('toast'); if (t) t.style.display = 'none'; });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('captured', name);
}
await browser.close();
