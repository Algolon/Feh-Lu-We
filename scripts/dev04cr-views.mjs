// DEV-04C-R evidence: the three corrections, same poses on any build.
// Usage: node scripts/dev04cr-views.mjs [baseUrl] [outDir]
//   lake      — approach, shore and a close look down at the water; landscape 1280×720 and phone portrait 412×915
//   candles   — the ring lit through the real action (matches carried), frames at fixed times of the sweep; the toast
//               layer is NOT hidden, so a message card would show in the frames
//   light     — walk out of the living room into the hall while looking back at the hearth (real controller), then frame
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'docs/dev04c/review-r/after';
mkdirSync(OUT, { recursive: true });
const D = Math.PI / 180;
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const rows = [];
async function session(viewport, fn) {
  const page = await browser.newPage({ viewport });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + '?autotest=1');
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'consKey'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open: { 'door.front': true } })));
  await page.reload(); await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.addStyleTag({ content: '#hud, .hud, #joy, #topbar, #objective, .hud-btn, #reticle, #actbtn { opacity: 0 !important; }' }).catch(() => {});
  await page.evaluate(() => { const g = window.__game; g.settings.quality = 'low'; g.applyQuality(true); });
  await fn(page);
  if (errs.length) rows.push({ errors: errs });
  await page.close();
}
const pose = (page, p, ticks = 60) => page.evaluate(({ p, ticks }) => {
  const g = window.__game; g.player.setPose(p); g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42);
  for (let i = 0; i < ticks; i++) g.tick(1 / 30);
  g.renderer.render(g.world.scene, g.camera);
  const r = g.renderer.info.render; return { calls: r.calls, triangles: r.triangles };
}, { p, ticks });
const shot = async (page, name, extra = {}) => { await page.waitForTimeout(120); await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 80 }); rows.push({ name, ...extra }); console.log(name, JSON.stringify(extra)); };

const LAKE = [
  ['l01-lake-approach', { x: 64.0, y: 0, z: 121.5, yaw: -22 * D, pitch: 0.0 }],
  ['l02-lake-shore', { x: 80.0, y: 0, z: 136.4, yaw: -70 * D, pitch: -0.04 }],
  ['l03-lake-close', { x: 77.4, y: 0, z: 138.6, yaw: -105 * D, pitch: -0.42 }],
];
await session({ width: 1280, height: 720 }, async (page) => { for (const [n, p] of LAKE) await shot(page, n, await pose(page, p)); });
await session({ width: 412, height: 915 }, async (page) => { for (const [n, p] of LAKE) await shot(page, `${n}-phone`, await pose(page, p)); });

// candle sweep: the plain action button (matches carried) from the clearing pose; frames at fixed sweep times
await session({ width: 1280, height: 720 }, async (page) => {
  await pose(page, { x: 176.4, y: 1.2, z: 59.9, yaw: 145 * D, pitch: 0.12 });
  await page.evaluate(() => { const g = window.__game, it = g.world.byId.get('wicker.candles'); window.__lbl = it.label(); it.run(); });
  let t = 0;
  for (const at of [0.3, 1.0, 1.8, 2.6, 3.8]) {
    const info = await page.evaluate((dt) => { const g = window.__game; for (let i = 0; i < Math.round(dt * 30); i++) g.tick(1 / 30); g.renderer.render(g.world.scene, g.camera); return { lit: g.world.scene.userData.wickerSet?.litCount?.() ?? null, toast: document.getElementById('toast')?.classList.contains('show') ?? false, label: window.__lbl }; }, at - t);
    t = at;
    await shot(page, `w-candles-${String(at).replace('.', '_')}s`, info);
  }
});

// light continuity: living → hall, looking back at the hearth (real controller)
await session({ width: 1280, height: 720 }, async (page) => {
  const res = await page.evaluate(() => {
    const g = window.__game, look = [72.7, 0.8, 86.7];
    const face = () => { const dx = look[0] - g.player.x, dz = look[2] - g.player.z; g.player.yaw = Math.atan2(dx, dz); g.player.pitch = Math.atan2(look[1] - (g.player.y + 1.65), Math.hypot(dx, dz)); };
    g.player.setPose({ x: 82.8, y: 0.15, z: 88.6, yaw: 0, pitch: 0 }); g.player.y = g.world.col.supportHeight(82.8, 88.6, 0.2, 0.42);
    for (let i = 0; i < 90; i++) { face(); g.tick(1 / 30); }
    g.autopilot = { x: 88.0, z: 88.6, run: false };
    for (let i = 0; i < 300; i++) { face(); g.tick(1 / 30); if (Math.hypot(g.player.x - 88, g.player.z - 88.6) < 0.3) break; }
    g.autopilot = null;
    for (let i = 0; i < 30; i++) { face(); g.tick(1 / 30); }
    g.renderer.render(g.world.scene, g.camera);
    const slot = g.pool.assigned().indexOf('fire.living');
    return { room: g.world.hereRoom, hearthLight: slot >= 0 ? +g.pool.lights[slot].intensity.toFixed(2) : 0, assigned: g.pool.assigned() };
  });
  await shot(page, 'r-hall-looking-back-at-hearth', res);
});
writeFileSync(`${OUT}/views.json`, JSON.stringify({ base: BASE, rows }, null, 2));
await browser.close();
