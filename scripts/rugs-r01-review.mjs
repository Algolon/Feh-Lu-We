// DEV-04B (from the DEV-04A script): before/after evidence for the visual-convergence pass at normal player eye height for every correctness target + render cost per view.
// Usage: node scripts/dev04b-views.mjs [baseUrl] [outDir]   (VIEWS=a,b to select; QUALITY=low|high|both)
// Poses are SET (camera placement for evidence only, eye 1.65 m above the support surface under the pose); routes and
// clearances are proven by the walked suite (scripts/e2e-dev04a.mjs). `doors` sets saved door states for the view;
// `swing` holds every door of the view part-way (0..1 of the full swing) to show a door mid-motion.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'docs/rugs-r01/after';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const D = Math.PI / 180;
const OPEN = ['door.front', 'door.consEast', 'door.consWest', 'door.service', 'door.atticStair', 'door.storage', 'door.guestWC', 'door.utility', 'door.sterren', 'door.atticRear', 'door.sauna', 'door.kitchenBack', 'door.cottage', 'door.billiardOut'];
// yaw: 0 = north, +90° = east (plan). y = feet (support surface is resolved below).
export const VIEWS = [
  ['hall-runner', { x: 90, y: 0.15, z: 85.8, yaw: 0, pitch: -0.65 }],
  ['hall-mat', { x: 90, y: 0.15, z: 83, yaw: Math.PI, pitch: -1.0 }],
  ['living-rug', { x: 74.9, y: 0.15, z: 89.5, yaw: 2.2, pitch: -0.65 }],
];

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => { problems.push(`pageerror: ${e.message}`); console.error(e.message); });
page.on('console', (m) => { if (m.type() === 'error') { problems.push(`console: ${m.text()}`); console.error(m.text()); } });
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
