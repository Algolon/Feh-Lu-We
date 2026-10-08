// DEV-04B (from the DEV-04A script): before/after evidence for the visual-convergence pass at normal player eye height for every correctness target + render cost per view.
// Usage: node scripts/dev04b-views.mjs [baseUrl] [outDir]   (VIEWS=a,b to select; QUALITY=low|high|both)
// Poses are SET (camera placement for evidence only, eye 1.65 m above the support surface under the pose); routes and
// clearances are proven by the walked suite (scripts/e2e-dev04a.mjs). `doors` sets saved door states for the view;
// `swing` holds every door of the view part-way (0..1 of the full swing) to show a door mid-motion.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'docs/dev04b/after';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const D = Math.PI / 180;
const OPEN = ['door.front', 'door.consEast', 'door.consWest', 'door.service', 'door.atticStair', 'door.storage', 'door.guestWC', 'door.utility', 'door.sterren', 'door.atticRear', 'door.sauna', 'door.kitchenBack', 'door.cottage', 'door.billiardOut'];
// yaw: 0 = north, +90° = east (plan). y = feet (support surface is resolved below).
export const VIEWS = [
  // B1 asset families (close range, eye height)
  ['b01-library-books-close', { x: 74.1, y: 0.15, z: 95.9, yaw: -95 * D, pitch: -0.12 }],
  ['b02-library-room', { x: 83.2, y: 0.15, z: 99.2, yaw: -98 * D, pitch: 0.02 }],
  ['b03-study-shelves', { x: 97.6, y: 3.35, z: 89.6, yaw: -110 * D, pitch: -0.08 }],
  ['b04-reis-bed', { x: 77.4, y: 3.35, z: 83.6, yaw: -105 * D, pitch: -0.32 }],
  ['b05-guest-bed', { x: 102.9, y: 3.35, z: 101.2, yaw: 72 * D, pitch: -0.3 }],
  ['b06-sterren-bed', { x: 77.6, y: 3.35, z: 90.6, yaw: -110 * D, pitch: -0.28 }],
  ['b07-dining-table-chairs', { x: 101.3, y: 0.15, z: 81.6, yaw: 5 * D, pitch: -0.3 }],
  ['b08-kitchen-table', { x: 98.2, y: 0.15, z: 96.8, yaw: 40 * D, pitch: -0.32 }],
  ['b09-copa-loungers', { x: 119.8, y: 0.15, z: 106.2, yaw: -95 * D, pitch: -0.35 }],
  ['b10-hall-rugs', { x: 90.0, y: 0.15, z: 82.8, yaw: 0, pitch: -0.32 }],
  ['b11-kitchen-crates', { x: 104.2, y: 0.15, z: 93.2, yaw: 78 * D, pitch: -0.5 }],
  ['b12-hall-grocery-crates', { x: 87.6, y: 0.15, z: 96.6, yaw: -90 * D, pitch: -0.45 }],
  ['b13-attic-gameboxes', { x: 86.0, y: 6.65, z: 100.0, yaw: 0, pitch: -0.55 }],
  ['b14-woodpile-hut', { x: 47.6, y: 0, z: 35.4, yaw: -55 * D, pitch: -0.15 }],
  ['b15-workshop', { x: 110.0, y: 0.15, z: 97.4, yaw: 85 * D, pitch: -0.12 }],
  // B2 rooms
  ['r01-living', { x: 83.4, y: 0.15, z: 87.2, yaw: -90 * D, pitch: -0.06 }],
  ['r02-hall', { x: 90.0, y: 0.15, z: 84.6, yaw: 0, pitch: 0.05 }],
  ['r03-dining', { x: 96.4, y: 0.15, z: 83.0, yaw: 60 * D, pitch: -0.1 }],
  ['r04-kitchen', { x: 97.0, y: 0.15, z: 94.0, yaw: 30 * D, pitch: -0.08 }],
  ['r05-billiard', { x: 93.6, y: 0.15, z: 105.0, yaw: -75 * D, pitch: -0.12 }],
  ['r06-study', { x: 99.4, y: 3.35, z: 92.6, yaw: 190 * D, pitch: -0.1 }],
  ['r07-botanic', { x: 104.4, y: 3.35, z: 94.4, yaw: 180 * D, pitch: -0.12 }],
  ['r08-reis', { x: 82.6, y: 3.35, z: 82.0, yaw: -80 * D, pitch: -0.1 }],
  ['r09-sterren', { x: 83.6, y: 3.35, z: 88.4, yaw: -60 * D, pitch: -0.08 }],
  ['r10-guest', { x: 100.4, y: 3.35, z: 99.6, yaw: 60 * D, pitch: -0.12 }],
  ['r11-attic-common', { x: 86.0, y: 6.65, z: 97.5, yaw: 0, pitch: 0.0 }],
  ['r12-cottage-room', { x: 25.0, y: 4.15, z: 158.6, yaw: 0, pitch: -0.12 }],
  ['r13-cottage-terrace', { x: 25.0, y: 4.15, z: 152.8, yaw: 20 * D, pitch: -0.15 }],
  ['r14-copa-room', { x: 118.0, y: 0.15, z: 99.0, yaw: 30 * D, pitch: -0.05 }],
  ['r15-bathroom', { x: 88.8, y: 3.35, z: 105.0, yaw: -120 * D, pitch: -0.2 }],
  ['r16-vestibule', { x: 90.0, y: 0.15, z: 83.6, yaw: 180 * D, pitch: -0.1 }],
  // B3 hero locations
  ['h01-campfire', { x: 26.0, y: 0, z: 21.5, yaw: -125 * D, pitch: -0.25 }],
  ['h02-campfire-wide', { x: 28.5, y: 0, z: 15.0, yaw: -75 * D, pitch: -0.12 }],
  ['h03-wickerman-figure', { x: 180.0, y: 1.2, z: 59.6, yaw: 180 * D, pitch: 0.22 }],
  ['h04-wickerman-clearing', { x: 176.4, y: 1.2, z: 59.9, yaw: 145 * D, pitch: 0.12 }],
  ['h05-wickerman-close', { x: 178.2, y: 1.2, z: 57.4, yaw: 140 * D, pitch: 0.35 }],
  ['h06-well', { x: 146.6, y: 0, z: 41.6, yaw: -135 * D, pitch: -0.3 }],
  ['h07-well-shaft', { x: 145.5, y: 0, z: 40.4, yaw: -135 * D, pitch: -0.85 }],
  ['h07b-well-down', { x: 144.35, y: 0, z: 39.45, yaw: -150 * D, pitch: -1.35 }],
  ['h08-golf-chute', { x: 63.0, y: 0, z: 54.2, yaw: 180 * D, pitch: 0.02 }],
  ['h09-golf-bag', { x: 62.3, y: 0, z: 52.6, yaw: -110 * D, pitch: -0.3 }],
  ['h10-golf-slope', { x: 67.5, y: 0, z: 50.5, yaw: -150 * D, pitch: 0.05 }],
  ['h11-copa-sign', { x: 124.2, y: 0.15, z: 105.2, yaw: 40 * D, pitch: 0.06 }],
  ['h12-copa-bar-close', { x: 127.0, y: 0.15, z: 107.0, yaw: 25 * D, pitch: 0.1 }],
  ['h13-attic-observatory', { x: 97.0, y: 6.65, z: 96.8, yaw: 120 * D, pitch: 0.28 }],
  ['h14-attic-nook', { x: 96.4, y: 6.65, z: 94.2, yaw: 62 * D, pitch: 0.12 }],
  ['h15-boslust-calibration', { x: 51.5, y: 0, z: 7.6, yaw: 55 * D, pitch: 0.04 }],
  ['h16-boslust-door', { x: 63.0, y: 0, z: 11.5, yaw: 0, pitch: 0.05 }],
  ['h17-portugal-exterior', { x: 25.0, y: 4.0, z: 146.5, yaw: 0, pitch: 0.05 }],
  // B4 estate audit (primitive / garbage fixes)
  ['a01-hall-commode', { x: 88.2, y: 0.15, z: 85.5, yaw: -90 * D, pitch: -0.18 }],
  ['a02-wc', { x: 87.3, y: 0.15, z: 104.4, yaw: -45 * D, pitch: -0.3 }],
  ['a03-utility-sink', { x: 113.9, y: 0.15, z: 106.2, yaw: 90 * D, pitch: -0.3 }],
  ['a04-boiler', { x: 100.0, y: -3.2, z: 101.5, yaw: 49 * D, pitch: 0.15 }],
  ['a05-route-pipes', { x: 83.0, y: -3.2, z: 95.0, yaw: 180 * D, pitch: 0.15 }],
  ['a06-side-gate', { x: 156.0, y: 0, z: 18.0, yaw: 90 * D, pitch: 0.05 }],
  ['a07-chopping-block', { x: 47.5, y: 0, z: 35.0, yaw: -33 * D, pitch: -0.35 }],
  ['a08-forecourt-planter', { x: 90.0, y: 0, z: 64.0, yaw: 0, pitch: -0.1 }],
];

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
await page.goto(BASE + '?autotest=1');
const open = Object.fromEntries(OPEN.map((id) => [id, true]));
await page.evaluate((open) => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'consKey'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open })), open);
await page.reload();
await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
await page.evaluate(helpers);
await page.addStyleTag({ content: '#hud, .hud, #joy, #topbar, #objective { opacity: 0 !important; }' }).catch(() => {});
const sel = process.env.VIEWS ? new Set(process.env.VIEWS.split(',')) : null;
const QS = process.env.QUALITY === 'high' ? ['high'] : process.env.QUALITY === 'both' ? ['low', 'high'] : ['low'];
const rows = [];
for (const [name, pose] of VIEWS) {
  if (sel && !sel.has(name)) continue;
  const m = await page.evaluate(async ({ p, QS, OPEN }) => {
    const g = window.__game;
    for (const id of OPEN) g.state.open[id] = !(p.closed ?? []).includes(id);
    g.world.syncAll();
    g.player.setPose(p);
    g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42);
    // let doors settle in their saved state, or stop them part-way for a mid-swing view
    if (p.swing != null) {
      for (const id of OPEN) g.state.open[id] = false;
      g.world.syncAll();
      for (let i = 0; i < 60; i++) g.tick(1 / 30);
      for (const id of OPEN) g.state.open[id] = !(p.closed ?? []).includes(id);
      g.world.syncAll();
      for (let i = 0; i < Math.round((1.6 / 2.6) * p.swing * 30); i++) g.tick(1 / 30);
    } else for (let i = 0; i < 60; i++) g.tick(1 / 30);
    g.player.setPose(p);
    g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42);
    g.tick(1 / 30);
    await new Promise((r) => setTimeout(r, 250));
    const out = {};
    for (const q of QS) {
      g.settings.quality = q; g.applyQuality(true);
      g.renderer.render(g.world.scene, g.camera);
      const i = g.renderer.info.render; out[q] = { calls: i.calls, triangles: i.triangles };
    }
    g.settings.quality = QS[0]; g.applyQuality(true);
    g.renderer.render(g.world.scene, g.camera);
    return { ...out, room: g.world.hereRoom, feetY: +g.player.y.toFixed(2) };
  }, { p: pose, QS, OPEN });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, quality: 76, type: 'jpeg' });
  rows.push({ name, pose, ...m });
  console.log(`${name.padEnd(34)} room ${String(m.room).padEnd(14)} y ${m.feetY}  ${QS.map((q) => `${q} ${m[q].calls}/${m[q].triangles}`).join('  ')}`);
}
writeFileSync(`${OUT}/views.json`, JSON.stringify({ rows, problems }, null, 2));
if (problems.length) console.log('PROBLEMS:\n' + problems.slice(0, 10).join('\n'));
await browser.close();
