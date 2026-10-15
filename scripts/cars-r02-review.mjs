// DEV-02: screenshot set of the main locations + render cost per representative view (production build).
// Usage: node scripts/dev02-views.mjs [baseUrl] [outDir]   (VIEWS=name1,name2 to select)
// Poses are SET directly (camera placement for evidence only); routing is proven by scripts/e2e-dev02.mjs by walking.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'docs/dev02/shots';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const D = Math.PI / 180;
// yaw: 0 = north, +90° = east (plan). y = feet.
export const VIEWS = [
 ['front-three-quarter', { x: 78.8, y: 0, z: 79.1, yaw: -2.3, pitch: -0.14 }],
 ['suv-side', { x: 106.6, y: 0, z: 74.9, yaw: -Math.PI/2, pitch: -0.12 }],
 ['rear-three-quarter', { x: 80, y: 0, z: 70, yaw: -0.86, pitch: -0.12 }],
 ['bus-front', { x: 74.0, y: 0, z: 79.2, yaw: -3.04, pitch: -0.1 }],
 ['estate-detail', { x: 68.4, y: 0, z: 77.7, yaw: 2.43, pitch: -0.1 }],
];

const ctx = await browser.newContext({ viewport: { width: 1536, height: 864 } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
await page.goto(BASE + '?autotest=1');
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open: { 'door.front': true, 'door.consEast': true, 'door.atticStair': true, 'door.storage': true, 'door.guestWC': true, 'door.utility': true, 'door.service': true } })));
await page.reload();
await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 120000 });
await page.evaluate(helpers);
const sel = process.env.VIEWS ? new Set(process.env.VIEWS.split(',')) : null;
const rows = [];
for (const [name, pose] of VIEWS) {
  if (sel && !sel.has(name)) continue;
  const m = await page.evaluate(async (p) => {
    const g = window.__game;
    g.player.setPose(p);
    g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42);
    for (let i = 0; i < 20; i++) g.tick(1 / 30);
    await new Promise((r) => setTimeout(r, 250));
    const out = {};
    for (const q of ['low', 'high']) {
      g.settings.quality = q; g.applyQuality(true);
      g.tick(1 / 30); g.renderer.render(g.world.scene, g.camera);
      const i = g.renderer.info.render; out[q] = { calls: i.calls, triangles: i.triangles };
    }
    g.settings.quality = 'low'; g.applyQuality(true); g.tick(1 / 30);
    return { ...out, room: g.world.hereRoom, feetY: +g.player.y.toFixed(2) };
  }, pose);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, quality: 72, type: 'jpeg' });
  rows.push({ name, pose, ...m });
  console.log(`${name.padEnd(30)} room ${String(m.room).padEnd(14)} y ${m.feetY}  low ${m.low.calls}/${m.low.triangles}  high ${m.high.calls}/${m.high.triangles}`);
}
writeFileSync(`${OUT}/views.json`, JSON.stringify({ rows, problems }, null, 2));
if (problems.length) console.log('PROBLEMS:\n' + problems.slice(0, 10).join('\n'));
await browser.close();
