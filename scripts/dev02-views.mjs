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
  ['01-gate-drive', { x: 90, y: 0, z: 3, yaw: 0, pitch: 0.02 }],
  ['02-arrival-court', { x: 88, y: 0, z: 62, yaw: 4 * D, pitch: 0.06 }],
  ['03-parking-west', { x: 84, y: 0, z: 68, yaw: -60 * D, pitch: -0.05 }],
  ['04-hall-maquette', { x: 88.6, y: 0.15, z: 92.2, yaw: -70 * D, pitch: -0.25 }],
  ['05-hall-stair', { x: 89.5, y: 0.15, z: 86, yaw: 30 * D, pitch: 0.15 }],
  ['06-stair-railing', { x: 94.0, y: 1.6, z: 90.4, yaw: 0, pitch: -0.25 }],
  ['07-upper-corridor-attic-door', { x: 99.5, y: 3.35, z: 97.3, yaw: -90 * D, pitch: 0 }],
  ['08-attic-stair', { x: 97.2, y: 3.35, z: 99.2, yaw: 0, pitch: 0.35 }],
  ['09-attic-common', { x: 93.5, y: 6.65, z: 99.2, yaw: -100 * D, pitch: 0.05 }],
  ['10-attic-lookout', { x: 96.2, y: 6.65, z: 97.2, yaw: 150 * D, pitch: 0.05 }],
  ['11-north-guest-room', { x: 100.2, y: 3.35, z: 99.6, yaw: 60 * D, pitch: -0.1 }],
  ['12-guest-wc-lobby', { x: 89.5, y: 0.15, z: 100.5, yaw: -150 * D, pitch: -0.1 }],
  ['13-utility', { x: 114.4, y: 0.15, z: 102.4, yaw: 0, pitch: -0.15 }],
  ['14-dining-game', { x: 97.4, y: 0.15, z: 83.0, yaw: 60 * D, pitch: -0.2 }],
  ['15-copacabana-inside', { x: 120.5, y: 0.15, z: 99.5, yaw: 60 * D, pitch: -0.05 }],
  ['16-copacabana-double-door', { x: 137, y: 0.15, z: 106, yaw: -90 * D, pitch: 0 }],
  ['17-wellness-deck', { x: 132, y: 0.15, z: 114, yaw: 130 * D, pitch: -0.05 }],
  ['18-social-garden', { x: 90, y: 0.15, z: 113.6, yaw: 0, pitch: -0.02 }],
  ['19-terrace-to-lake', { x: 82, y: 0.15, z: 116.5, yaw: -50 * D, pitch: 0.02 }],
  ['20-lake-view', { x: 77, y: 0, z: 138.5, yaw: -70 * D, pitch: 0.02 }],
  ['21-cottage-approach', { x: 18.5, y: 3.0, z: 139.5, yaw: 10 * D, pitch: 0.02 }],
  ['22-cottage-terrace', { x: 25, y: 4.15, z: 152.8, yaw: 20 * D, pitch: -0.05 }],
  ['23-from-cottage-terrace', { x: 26.5, y: 4.15, z: 153.0, yaw: 120 * D, pitch: -0.08 }],
  ['24-cottage-return', { x: 60, y: 1.0, z: 166.5, yaw: 110 * D, pitch: -0.02 }],
  ['25-east-glade', { x: 150, y: 2.0, z: 144, yaw: 70 * D, pitch: 0 }],
  ['26-east-ridge-path', { x: 174, y: 2.4, z: 132, yaw: 180 * D, pitch: 0 }],
  ['27-golf-tee', { x: 66, y: 0, z: 57, yaw: -150 * D, pitch: 0.05 }],
  ['28-wickerman', { x: 158, y: 1.0, z: 50, yaw: 60 * D, pitch: 0.08 }],
  ['29-shed-forest', { x: 50, y: 0, z: 44, yaw: -2.2, pitch: 0 }],
  ['30-boslust-cut', { x: 63, y: 0, z: 9, yaw: 0, pitch: 0.08 }],
  ['31-garden-to-manor', { x: 92, y: 0, z: 136, yaw: Math.PI * 0.9, pitch: 0 }],
  ['32-estate-north-edge', { x: 110, y: 2, z: 166, yaw: 200 * D, pitch: -0.02 }],
];

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
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
