// DEV-04A: before/after evidence at normal player eye height for every correctness target + render cost per view.
// Usage: node scripts/dev04a-views.mjs [baseUrl] [outDir]   (VIEWS=a,b to select; QUALITY=low|high|both)
// Poses are SET (camera placement for evidence only, eye 1.65 m above the support surface under the pose); routes and
// clearances are proven by the walked suite (scripts/e2e-dev04a.mjs). `doors` sets saved door states for the view;
// `swing` holds every door of the view part-way (0..1 of the full swing) to show a door mid-motion.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'docs/dev04a/after';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const D = Math.PI / 180;
const OPEN = ['door.front', 'door.consEast', 'door.consWest', 'door.service', 'door.atticStair', 'door.storage', 'door.guestWC', 'door.utility', 'door.sterren', 'door.atticRear', 'door.sauna', 'door.kitchenBack', 'door.cottage', 'door.billiardOut'];
// yaw: 0 = north, +90° = east (plan). y = feet (support surface is resolved below).
export const VIEWS = [
  // P0 openings / doors / windows / wall decor
  ['01-stars-door-walkway', { x: 86.15, y: 3.35, z: 93.4, yaw: 200 * D, pitch: -0.02 }],
  ['01b-stars-door-from-hall', { x: 92.6, y: 0.15, z: 90.2, yaw: -88 * D, pitch: 0.38 }],
  ['02-dining-window-wall', { x: 102.2, y: 0.15, z: 88.4, yaw: 75 * D, pitch: 0.06 }],
  ['03-kitchen-sink', { x: 105.0, y: 0.15, z: 108.25, yaw: 0, pitch: -0.62 }],
  ['03b-kitchen-sink-shift', { x: 105.12, y: 0.15, z: 108.2, yaw: -4 * D, pitch: -0.6 }],
  ['04-cons-double-door-inside', { x: 126.3, y: 0.15, z: 106.0, yaw: 90 * D, pitch: -0.04 }],
  ['04b-cons-double-door-outside', { x: 134.2, y: 0.15, z: 106.0, yaw: -90 * D, pitch: -0.04 }],
  ['04c-cons-double-door-half', { x: 134.2, y: 0.15, z: 106.0, yaw: -90 * D, pitch: -0.04, swing: 0.5 }],
  ['04d-cons-double-door-closed', { x: 126.3, y: 0.15, z: 106.0, yaw: 90 * D, pitch: -0.04, closed: ['door.consEast'] }],
  ['05-main-entrance-threshold', { x: 90.0, y: 0, z: 76.9, yaw: 0, pitch: -0.3 }],
  ['05b-main-entrance-inside', { x: 90.0, y: 0.15, z: 82.6, yaw: 180 * D, pitch: -0.32 }],
  ['05c-service-door-to-wing', { x: 105.6, y: 0.15, z: 102.5, yaw: 90 * D, pitch: -0.3 }],
  ['05d-wing-to-conservatory', { x: 112.6, y: 0.15, z: 102.6, yaw: 90 * D, pitch: -0.3 }],
  ['05f-cottage-door', { x: 25.0, y: 4.15, z: 155.2, yaw: 0, pitch: -0.32 }],
  ['05g-shed-door', { x: 47.0, y: 0, z: 38.9, yaw: -90 * D, pitch: -0.25 }],
  ['05e-garden-door-billiard', { x: 91.5, y: 0.15, z: 112.4, yaw: 180 * D, pitch: -0.3 }],
  // owner-directed: Copacabana sign, sauna access, attic, wickerman
  ['06-copacabana-bar-sign', { x: 124.2, y: 0.15, z: 105.2, yaw: 40 * D, pitch: 0.06 }],
  ['06b-copacabana-old-board', { x: 112.0, y: 0.15, z: 102.6, yaw: 60 * D, pitch: 0.02 }],
  ['07-sauna-access', { x: 137.6, y: 0.15, z: 112.4, yaw: -140 * D, pitch: -0.08 }],
  ['07b-sauna-access-front', { x: 134.0, y: 0.15, z: 110.5, yaw: 180 * D, pitch: -0.05 }],
  ['08-attic-wall-roof', { x: 93.2, y: 6.65, z: 99.3, yaw: -110 * D, pitch: 0.3 }],
  ['08b-attic-common-east', { x: 84.0, y: 6.65, z: 96.0, yaw: 80 * D, pitch: 0.25 }],
  ['09-attic-observatory', { x: 97.0, y: 6.65, z: 96.8, yaw: 120 * D, pitch: 0.28 }],
  ['09b-observatory-exterior', { x: 124.0, y: 0.15, z: 86.0, yaw: -62 * D, pitch: 0.32 }],
  ['10-wickerman-main-path', { x: 158.0, y: 1.0, z: 47.0, yaw: 62 * D, pitch: 0.04 }],
  ['10b-wickerman-path-north', { x: 168.5, y: 1.0, z: 62.0, yaw: 175 * D, pitch: 0.02 }],
  ['11-wickerman-clearing', { x: 158.0, y: 1.0, z: 50.0, yaw: 60 * D, pitch: 0.08 }],
  // ground transitions + support
  ['12-portugal-path-terrace', { x: 16.6, y: 4.0, z: 146.8, yaw: 25 * D, pitch: -0.22 }],
  ['12b-portugal-terrace-ramp', { x: 23.0, y: 4.15, z: 153.2, yaw: -120 * D, pitch: -0.3 }],
  ['13-golf-path-platform', { x: 56.0, y: 0, z: 47.6, yaw: 70 * D, pitch: -0.18 }],
  ['13b-golf-tee-chute', { x: 63.0, y: 0, z: 51.0, yaw: 180 * D, pitch: -0.08 }],
  ['14-woodland-hut-logs', { x: 47.6, y: 0, z: 35.4, yaw: -55 * D, pitch: -0.15 }],
  ['15-forest-path-forecourt', { x: 76.2, y: 0, z: 63.4, yaw: 58 * D, pitch: -0.2 }],
  ['15b-forest-path-forecourt-east', { x: 104.5, y: 0, z: 65.6, yaw: -72 * D, pitch: -0.2 }],
  ['16-boslust-fork-unchanged', { x: 51.5, y: 0, z: 7.6, yaw: 55 * D, pitch: 0.04 }],
  ['17-lantern-lawn-junction', { x: 88.0, y: 0, z: 125.0, yaw: 30 * D, pitch: -0.25 }],
  // perf-only representative views (brief §11)
  ['p1-attic-common', { x: 86.0, y: 6.65, z: 97.5, yaw: 0, pitch: 0.05 }],
  ['p2-front-forecourt', { x: 90.0, y: 0, z: 66.0, yaw: 0, pitch: 0.05 }],
  ['p3-portugal-terrace', { x: 25.0, y: 4.15, z: 152.8, yaw: 20 * D, pitch: -0.05 }],
  ['p4-golf-vicinity', { x: 66.0, y: 0, z: 57.0, yaw: -150 * D, pitch: 0.05 }],
  ['p5-wellness-deck', { x: 132.0, y: 0.15, z: 114.0, yaw: 130 * D, pitch: -0.05 }],
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
