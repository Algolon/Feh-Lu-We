// Iteration-3 comparison screenshots at fixed poses (same pose/FOV/quality before and after a change).
// Usage: node scripts/views3.mjs <outDir> [set] [baseUrl]    set = cp1 (pre-expansion world) | world (expanded world)
// Needs `npm run preview` running. Software-rendered (SwiftShader): composition evidence, not performance.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] ?? 'scripts/out/views3';
const SET = process.argv[3] ?? 'cp1';
const BASE = process.argv[4] ?? 'http://localhost:4173/Feh-Lu-We/';
mkdirSync(OUT, { recursive: true });
const ESS = ['invitation', 'torch', 'matches', 'notebook', 'frontKey'];
const base = { leftHome: true };
const allItems = ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'studyKey', 'shedKey', 'kindling', 'token', 'crank', 'crest', 'cottageKey', 'fragment'];

// [name, save extras (null = home scene), pose, ui action]
const SETS = {
  cp1: [
    ['01-entrance', {}, { x: 60, y: 0, z: 41, yaw: 0, pitch: 0.06 }],
    ['02-mantel', { lit: { 'fire.living': true } }, { x: 50.0, y: 0.15, z: 62, yaw: -Math.PI / 2, pitch: -0.12 }],
    ['03-living-hearth-wide', { lit: { 'fire.living': true } }, { x: 54.8, y: 0.15, z: 58.2, yaw: -1.05, pitch: -0.05 }],
    ['04-doorway-hall-to-living', { lit: { 'fire.living': true, 'lamp.hallConsole': true } }, { x: 61.5, y: 0.15, z: 61.5, yaw: -Math.PI / 2, pitch: -0.02 }],
    ['05-doorway-living-to-hall', { lit: { 'fire.living': true } }, { x: 51, y: 0.15, z: 61.5, yaw: Math.PI / 2, pitch: 0 }],
    ['06-study', { inventory: [...ESS, 'studyKey'], unlocked: ['lock.door.front', 'lock.door.study'], open: { 'door.front': true, 'door.study': true }, lit: { 'lamp.study': true } }, { x: 54.6, y: 3.35, z: 66.6, yaw: -1.9, pitch: -0.1 }],
    ['07-pool', {}, { x: 75.5, y: 0.15, z: 65.2, yaw: 0.35, pitch: -0.25 }],
    ['08-garden', {}, { x: 50, y: 0, z: 97, yaw: 2.6, pitch: 0.02 }],
    ['09-forest', {}, { x: 40, y: 0, z: 36, yaw: -2.2, pitch: 0 }],
    ['10-campfire', { flags: { ...base, firewood: true, fireLit: true }, lit: { 'fire.clearing': true } }, { x: 17.2, y: 0, z: 14.6, yaw: -2.3, pitch: -0.25 }],
    ['11-home-candle', null, { x: 3.5, y: 0, z: 2.6, yaw: 0.6, pitch: -0.45 }, { lit: { 'home.candle': true } }],
  ],
};
const UI_SHOTS = [
  // phone-scale HUD with the bag open, a held item chip and the hall dial lock
  ['ui-bag', 'bag'],
  ['ui-held', 'held'],
  ['ui-dials', 'dials'],
  ['ui-notebook', 'notebook'],
];

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
async function load(page, save, quality = 'high') {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate(([s, q]) => { localStorage.setItem('fehluwe.save', JSON.stringify(s)); localStorage.setItem('fehluwe.settings', JSON.stringify({ quality: q })); }, [save, quality]);
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world);
  await page.evaluate(() => { const t = document.getElementById('toast'); if (t) t.style.display = 'none'; });
}
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
for (const [name, extra, pose, homeExtra] of SETS[SET] ?? []) {
  const save = extra === null
    ? { version: 3, scene: 'home', inventory: ['frontKey', 'matches'], player: { home: pose }, ...(homeExtra ?? {}) }
    : { version: 3, scene: 'estate', inventory: ESS, flags: base, unlocked: ['lock.door.front'], open: { 'door.front': true }, ...extra, player: { estate: pose } };
  await load(page, save);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('captured', name);
}
// phone-scale UI evidence (844×390 CSS px at DPR 2, like a landscape phone)
const phone = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
for (const [name, what] of UI_SHOTS) {
  await load(phone, { version: 3, scene: 'estate', inventory: allItems, flags: base, unlocked: ['lock.door.front'], open: { 'door.front': true }, clues: ['c.invitation', 'c.mantel', 'c.drawerLock'], player: { estate: { x: 57.3, y: 0.15, z: 57.6, yaw: -Math.PI / 2, pitch: -0.3 } } }, 'low');
  await phone.waitForTimeout(800);
  await phone.evaluate((w) => {
    const g = window.__game;
    if (w === 'bag') { g.openBag(); document.querySelector('.inv button[data-id="matches"]')?.click(); }
    if (w === 'held') g.select('matches');
    if (w === 'dials') g.openPanel('drawerLock');
    if (w === 'notebook') g.openNotebook();
  }, what);
  await phone.waitForTimeout(500);
  await phone.screenshot({ path: `${OUT}/${name}.png` });
  console.log('captured', name);
}
await browser.close();
