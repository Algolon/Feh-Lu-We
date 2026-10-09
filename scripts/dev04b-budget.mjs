// DEV-04B dev probe: draw calls / triangles at low quality for the full-suite render poses and the DEV-04B hero views
// (door state of the full suite: front door open). Usage: node scripts/dev04b-budget.mjs [baseUrl]  → JSON
import { chromium } from 'playwright-core';
const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const D = Math.PI / 180;
const POSES = {
  'gate (driveway)': [90, 0, 3, 0, 0.02], 'forecourt → manor': [90, 0, 60, 0, 0.05], 'entrance hall': [90, 0.15, 83, 0, 0.1], library: [82.4, 0.15, 97.5, -0.8, 0.05],
  'garden → manor + conservatory': [92, 0, 136, Math.PI * 0.9, 0], 'forest (shed area)': [50, 0, 44, -2.2, 0], 'BOSLUST cut': [63, 0, 9, 0, 0.08], 'conservatory pool': [118, 0.15, 95.5, 0.5, -0.2],
  campfire: [26, 0, 21.5, -125 * D, -0.25], well: [146.6, 0, 41.6, -135 * D, -0.3], 'wickerman figure': [180, 1.2, 59.6, 180 * D, 0.22], 'golf chute': [63, 0, 54.2, 180 * D, 0.02],
  dining: [96.4, 0.15, 83, 60 * D, -0.1], kitchen: [101, 0.15, 96, 0, 0], 'attic observatory': [97, 6.65, 96.8, 120 * D, 0.28], 'Copacabana bar': [127, 0.15, 107, 25 * D, 0.1], 'Portugal cottage': [25, 4.15, 158.6, 0, -0.12],
};
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(BASE + '?autotest=1');
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['frontKey'], flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true } })));
await page.reload(); await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
const out = await page.evaluate(async (P) => {
  const g = window.__game, res = {};
  for (const [k, [x, y, z, yaw, pitch]] of Object.entries(P)) {
    g.player.setPose({ x, y, z, yaw, pitch }); g.player.y = g.world.col.supportHeight(x, z, y + 0.05, 0.42);
    for (let i = 0; i < 20; i++) g.tick(1 / 30);
    await new Promise((r) => setTimeout(r, 100));
    g.settings.quality = 'low'; g.applyQuality(true); g.tick(1 / 30); g.renderer.render(g.world.scene, g.camera);
    res[k] = { calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles };
  }
  return res;
}, POSES);
console.log(JSON.stringify(out));
await browser.close();
