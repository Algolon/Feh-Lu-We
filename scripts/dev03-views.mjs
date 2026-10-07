// DEV-03: first-person audit / evidence set over every zone of the estate + render cost per view (production build).
// Usage: node scripts/dev03-views.mjs [baseUrl] [outDir] [query]   (VIEWS=a,b to select; QUALITY=low|high|both)
// The same poses are captured before and after the art rollout (docs/dev03/before, docs/dev03/after). Poses are SET
// (camera placement for evidence only, at normal eye height 1.65 m above the support surface); routes are proven by
// the walked suites. Every view also records the room, feet height, and draw calls/triangles at low and high quality.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'docs/dev03/after';
const QUERY = process.argv[4] ?? '';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const D = Math.PI / 180;
// yaw: 0 = north, +90° = east (plan). y = feet (support surface is resolved below).
export const VIEWS = [
  // A — arrival / manor approach
  ['a01-drive-approach', { x: 90.3, y: 0, z: 44, yaw: 0, pitch: 0.04 }],
  ['a02-arrival-court', { x: 88, y: 0, z: 62, yaw: 4 * D, pitch: 0.06 }],
  ['a03-parking-west', { x: 84, y: 0, z: 68, yaw: -60 * D, pitch: -0.05 }],
  ['a04-front-door', { x: 91.2, y: 0, z: 75.5, yaw: -8 * D, pitch: 0.14 }],
  ['a05-manor-oblique', { x: 112, y: 0, z: 70, yaw: -40 * D, pitch: 0.1 }],
  // B — hall / living / library / dining / kitchen
  ['b01-vestibule', { x: 90, y: 0.15, z: 81.2, yaw: 0, pitch: -0.05 }],
  ['b02-hall-from-vestibule', { x: 90, y: 0.15, z: 85, yaw: 0, pitch: 0.12 }],
  ['b03-hall-maquette', { x: 88.6, y: 0.15, z: 92.2, yaw: -70 * D, pitch: -0.25 }],
  ['b04-hall-stair', { x: 89.5, y: 0.15, z: 86, yaw: 30 * D, pitch: 0.15 }],
  ['b05-living-from-hall', { x: 85.6, y: 0.15, z: 86.7, yaw: -90 * D, pitch: -0.08 }],
  ['b06-living-hearth', { x: 80.5, y: 0.15, z: 91.5, yaw: -115 * D, pitch: -0.1 }],
  ['b07-living-reverse', { x: 74.5, y: 0.15, z: 83, yaw: 55 * D, pitch: -0.1 }],
  ['b08-library', { x: 84, y: 0.15, z: 101, yaw: -95 * D, pitch: 0.05 }],
  ['b09-library-reverse', { x: 74, y: 0.15, z: 106, yaw: 120 * D, pitch: 0.02 }],
  ['b10-dining-game', { x: 97.4, y: 0.15, z: 83.0, yaw: 60 * D, pitch: -0.2 }],
  ['b11-kitchen', { x: 97.2, y: 0.15, z: 94, yaw: 35 * D, pitch: -0.15 }],
  ['b12-kitchen-reverse', { x: 106, y: 0.15, z: 107, yaw: -140 * D, pitch: -0.15 }],
  ['b13-billiard-lobby', { x: 89.5, y: 0.15, z: 100.5, yaw: -150 * D, pitch: -0.1 }],
  // D — Copacabana / wellness
  ['d01-copacabana-inside', { x: 120.5, y: 0.15, z: 99.5, yaw: 60 * D, pitch: -0.05 }],
  ['d02-copacabana-bar', { x: 123, y: 0.15, z: 104, yaw: 40 * D, pitch: -0.1 }],
  ['d03-copacabana-double-door', { x: 137, y: 0.15, z: 106, yaw: -90 * D, pitch: 0 }],
  ['d04-wellness-deck', { x: 132, y: 0.15, z: 114, yaw: 130 * D, pitch: -0.05 }],
  ['d05-sauna-jacuzzi', { x: 145.5, y: 0.15, z: 109, yaw: -135 * D, pitch: -0.1 }],
  // G — upstairs / attic
  ['g01-upper-corridor', { x: 99.5, y: 3.35, z: 97.3, yaw: -90 * D, pitch: 0 }],
  ['g02-north-guest-room', { x: 100.2, y: 3.35, z: 99.6, yaw: 60 * D, pitch: -0.1 }],
  ['g03-attic-stair', { x: 97.2, y: 3.35, z: 99.2, yaw: 0, pitch: 0.35 }],
  ['g04-attic-common', { x: 93.5, y: 6.65, z: 99.2, yaw: -100 * D, pitch: 0.05 }],
  ['g05-attic-lookout', { x: 96.2, y: 6.65, z: 97.2, yaw: 150 * D, pitch: 0.05 }],
  // C — social garden
  ['c01-social-garden', { x: 90, y: 0.15, z: 113.6, yaw: 0, pitch: -0.02 }],
  ['c02-bbq-dining', { x: 99, y: 0.15, z: 113.8, yaw: 50 * D, pitch: -0.1 }],
  ['c03-music-balloon', { x: 89, y: 0.15, z: 116.5, yaw: -60 * D, pitch: -0.12 }],
  ['c04-garden-to-manor', { x: 92, y: 0, z: 136, yaw: 180 * D, pitch: 0.02 }],
  ['c05-lantern-lawn', { x: 90.5, y: 0, z: 121, yaw: 0, pitch: -0.05 }],
  // E — lake / Portugal cottage
  ['e01-terrace-to-lake', { x: 82, y: 0.15, z: 116.5, yaw: -50 * D, pitch: 0.02 }],
  ['e02-lake-view', { x: 77, y: 0, z: 138.5, yaw: -70 * D, pitch: 0.02 }],
  ['e03-cottage-approach', { x: 18.5, y: 3.0, z: 139.5, yaw: 10 * D, pitch: 0.02 }],
  ['e04-cottage-terrace', { x: 25, y: 4.15, z: 152.8, yaw: 20 * D, pitch: -0.05 }],
  ['e05-from-cottage-terrace', { x: 26.5, y: 4.15, z: 153.0, yaw: 120 * D, pitch: -0.08 }],
  ['e06-cottage-return', { x: 60, y: 1.0, z: 166.5, yaw: 110 * D, pitch: -0.02 }],
  // F — woodland and discoveries
  ['f01-gate-drive', { x: 90, y: 0, z: 3, yaw: 0, pitch: 0.02 }],
  ['f02-forest-path-east', { x: 112, y: 0, z: 12.8, yaw: 85 * D, pitch: 0 }],
  ['f03-shed-forest', { x: 50, y: 0, z: 44, yaw: -2.2, pitch: 0 }],
  ['f04-fire-clearing', { x: 27, y: 0, z: 14, yaw: -60 * D, pitch: -0.05 }],
  ['f05-boslust-fork', { x: 51.5, y: 0, z: 7.6, yaw: 55 * D, pitch: 0.04 }],
  ['f06-boslust-cut', { x: 63, y: 0, z: 9, yaw: 0, pitch: 0.08 }],
  ['f07-well', { x: 145, y: 0, z: 31.5, yaw: -5 * D, pitch: -0.05 }],
  ['f08-wickerman', { x: 158, y: 1.0, z: 50, yaw: 60 * D, pitch: 0.08 }],
  ['f09-golf-tee', { x: 66, y: 0, z: 57, yaw: -150 * D, pitch: 0.05 }],
  ['f10-east-glade', { x: 150, y: 2.0, z: 144, yaw: 70 * D, pitch: 0 }],
  ['f11-east-ridge-path', { x: 174, y: 2.4, z: 132, yaw: 180 * D, pitch: 0 }],
  ['f12-north-edge', { x: 110, y: 4.1, z: 166, yaw: 200 * D, pitch: -0.02 }],
  ['f13-west-forest-walk', { x: 25, y: 0.5, z: 136, yaw: -120 * D, pitch: 0 }],
];

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
await page.goto(BASE + '?autotest=1' + QUERY);
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open: { 'door.front': true, 'door.consEast': true, 'door.atticStair': true, 'door.storage': true, 'door.guestWC': true, 'door.utility': true, 'door.service': true } })));
await page.reload();
await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
await page.evaluate(helpers);
await page.addStyleTag({ content: '#hud, .hud, #joy, #topbar, #objective { opacity: 0 !important; }' }).catch(() => {});
const sel = process.env.VIEWS ? new Set(process.env.VIEWS.split(',')) : null;
const QS = process.env.QUALITY === 'high' ? ['high'] : process.env.QUALITY === 'low' ? ['low'] : ['low', 'high'];
const rows = [];
for (const [name, pose] of VIEWS) {
  if (sel && !sel.has(name)) continue;
  const m = await page.evaluate(async ({ p, QS }) => {
    const g = window.__game;
    g.player.setPose(p);
    g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42);
    for (let i = 0; i < 20; i++) g.tick(1 / 30);
    await new Promise((r) => setTimeout(r, 250));
    const out = {};
    for (const q of QS) {
      g.settings.quality = q; g.applyQuality(true);
      g.tick(1 / 30); g.renderer.render(g.world.scene, g.camera);
      const i = g.renderer.info.render; out[q] = { calls: i.calls, triangles: i.triangles };
    }
    g.settings.quality = QS[QS.length - 1] === 'high' && QS.length === 1 ? 'high' : 'low'; g.applyQuality(true); g.tick(1 / 30);
    return { ...out, room: g.world.hereRoom, feetY: +g.player.y.toFixed(2) };
  }, { p: pose, QS });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, quality: 74, type: 'jpeg' });
  rows.push({ name, pose, ...m });
  console.log(`${name.padEnd(30)} room ${String(m.room).padEnd(14)} y ${m.feetY}  ${QS.map((q) => `${q} ${m[q].calls}/${m[q].triangles}`).join('  ')}`);
}
writeFileSync(`${OUT}/views.json`, JSON.stringify({ query: QUERY, rows, problems }, null, 2));
if (problems.length) console.log('PROBLEMS:\n' + problems.slice(0, 10).join('\n'));
await browser.close();
