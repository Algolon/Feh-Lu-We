// DEV-04C evidence harness: matched before / after views of the atmosphere, surface and setpiece pass at normal player
// eye height, plus render cost per view (low quality = the phone default, no shadow maps).
// Usage: node scripts/dev04c-views.mjs [baseUrl] [outDir]   (VIEWS=a,b to select)
//
// Poses are SET (camera placement for evidence only; eye 1.65 m above the support surface under the pose). Door state is
// the standard evidence state (front door + Copacabana doors open). `lit` sets optional environmental state for the view
// (the Wickerman candle / figure keys are DEV-04C state: on a pre-DEV-04C build they are simply ignored, so the same
// script captures the "before" frame of every view). `burn` advances the simulated clock after the state is set
// (seconds), so the burning view is not the first frame of the ignition. `act` runs the real interaction (matches in hand)
// for the listed ids: a figure is only *burning* after an in-session ignition — set straight into the save it loads as
// the settled aftermath (w07).
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'docs/dev04c/after';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const D = Math.PI / 180;
const OPEN = ['door.front', 'door.consEast', 'door.consWest', 'door.atticStair'];
const W0 = { 'wicker.candles': false, 'wicker.figure': false };
const W1 = { 'wicker.candles': true, 'wicker.figure': false };
const W2 = { 'wicker.candles': true, 'wicker.figure': true };
// yaw: 0 = north, +90° = east (plan). y = feet (the support surface is resolved below).
export const VIEWS = [
  // calibration set (C1)
  ['c01-arrival-manor', { x: 90.0, y: 0, z: 60.0, yaw: 0, pitch: 0.05 }],
  ['c02-hall', { x: 90.0, y: 0.15, z: 84.6, yaw: 0, pitch: 0.05 }],
  ['c03-living', { x: 83.4, y: 0.15, z: 87.2, yaw: -90 * D, pitch: -0.06 }],
  ['c04-living-hearth', { x: 77.4, y: 0.15, z: 88.6, yaw: -110 * D, pitch: -0.12 }],
  ['c05-sterren-bedroom', { x: 83.6, y: 3.35, z: 88.4, yaw: -60 * D, pitch: -0.08 }],
  ['c06-copa-room', { x: 118.0, y: 0.15, z: 99.0, yaw: 30 * D, pitch: -0.05 }],
  ['c07-copa-bar', { x: 127.0, y: 0.15, z: 107.0, yaw: 25 * D, pitch: 0.1 }],
  ['c08-portugal-exterior', { x: 25.0, y: 4.0, z: 146.5, yaw: 0, pitch: 0.05 }],
  ['c09-portugal-interior', { x: 25.0, y: 4.15, z: 158.6, yaw: 0, pitch: -0.12 }],
  ['c10-lake-approach', { x: 64.0, y: 0, z: 121.5, yaw: -22 * D, pitch: 0.0 }],
  ['c11-lake-shore', { x: 80.0, y: 0, z: 136.4, yaw: -70 * D, pitch: -0.04 }],
  ['c12-woodland-route', { x: 120.0, y: 0, z: 13.6, yaw: 85 * D, pitch: 0.02 }],
  ['c13-woodland-shed-path', { x: 64.0, y: 0, z: 56.0, yaw: -130 * D, pitch: 0.0 }],
  ['c14-boslust-calibration', { x: 51.5, y: 0, z: 7.6, yaw: 55 * D, pitch: 0.04 }],
  ['c15-boslust-door', { x: 63.0, y: 0, z: 11.5, yaw: 0, pitch: 0.05 }],
  // Wickerman setpiece (C6)
  ['w01-wickerman-unlit', { x: 176.4, y: 1.2, z: 59.9, yaw: 145 * D, pitch: 0.12, lit: W0 }],
  ['w02-wickerman-lit', { x: 176.4, y: 1.2, z: 59.9, yaw: 145 * D, pitch: 0.12, lit: W0, act: ['wicker.candles'], burn: 3 }],
  ['w03-wickerman-burning', { x: 176.4, y: 1.2, z: 59.9, yaw: 145 * D, pitch: 0.12, lit: W0, act: ['wicker.candles', 'wicker.figure'], burn: 16 }],
  ['w04-wickerman-candles-close', { x: 178.6, y: 1.2, z: 58.6, yaw: 135 * D, pitch: -0.35, lit: W0, act: ['wicker.candles'], burn: 3 }],
  ['w05-wickerman-burning-close', { x: 178.2, y: 1.2, z: 57.4, yaw: 140 * D, pitch: 0.35, lit: W0, act: ['wicker.candles', 'wicker.figure'], burn: 30 }],
  ['w06-wickerman-approach-burning', { x: 172.0, y: 1.2, z: 60.4, yaw: 105 * D, pitch: 0.06, lit: W0, act: ['wicker.candles', 'wicker.figure'], burn: 10 }],
  ['w07-wickerman-aftermath', { x: 176.4, y: 1.2, z: 59.9, yaw: 145 * D, pitch: 0.12, lit: W2 }],
  // fire / light continuity (C3)
  ['f01-hall-from-forecourt', { x: 90.0, y: 0, z: 74.0, yaw: 0, pitch: 0.12 }],
  ['f02-dining-candles', { x: 96.4, y: 0.15, z: 83.0, yaw: 60 * D, pitch: -0.1 }],
  ['f03-campfire', { x: 26.0, y: 0, z: 21.5, yaw: -125 * D, pitch: -0.25, lit: { 'fire.clearing': true } }],
  ['f04-living-from-hall', { x: 86.2, y: 0.15, z: 86.4, yaw: -90 * D, pitch: -0.04 }],
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
await page.addStyleTag({ content: '#hud, .hud, #joy, #topbar, #objective, #toast, .toast { opacity: 0 !important; }' }).catch(() => {});
const sel = process.env.VIEWS ? new Set(process.env.VIEWS.split(',')) : null;
const rows = [];
for (const [name, pose] of VIEWS) {
  if (sel && !sel.has(name)) continue;
  const m = await page.evaluate(async ({ p }) => {
    const g = window.__game;
    for (const [k, v] of Object.entries(p.lit ?? {})) g.state.lit[k] = v;
    g.world.syncAll();
    g.player.setPose(p);
    g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42);
    // `act`: run the real interaction (matches in hand) — a burning figure only exists after an in-session ignition
    for (const id of p.act ?? []) { const it = g.world.byId.get(id); if (it?.useItem) { it.useItem('matches'); for (let i = 0; i < 15; i++) g.tick(1 / 30); } }
    for (let i = 0; i < 60 + Math.round((p.burn ?? 0) * 30); i++) g.tick(1 / 30);
    g.player.setPose(p);
    g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42);
    g.tick(1 / 30);
    await new Promise((r) => setTimeout(r, 250));
    g.settings.quality = 'low'; g.applyQuality(true);
    g.tick(1 / 30);
    g.renderer.render(g.world.scene, g.camera);
    const i = g.renderer.info.render;
    return { calls: i.calls, triangles: i.triangles, room: g.world.hereRoom, feetY: +g.player.y.toFixed(2) };
  }, { p: pose });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, quality: 80, type: 'jpeg' });
  rows.push({ name, pose, ...m });
  console.log(`${name.padEnd(34)} room ${String(m.room).padEnd(14)} y ${m.feetY}  low ${m.calls}/${m.triangles}`);
  // reset optional state so the next view starts from the standard state
  await page.evaluate(({ p }) => { const g = window.__game; for (const k of Object.keys(p.lit ?? {})) delete g.state.lit[k]; g.world.syncAll(); }, { p: pose });
}
writeFileSync(`${OUT}/views.json`, JSON.stringify({ rows, problems }, null, 2));
if (problems.length) console.log('PROBLEMS:\n' + problems.slice(0, 10).join('\n'));
await browser.close();
