// Quick smoke for the iteration-3 estate: loads injected v4 saves at named poses, reports errors + render stats.
// Usage: node scripts/smoke3.mjs [baseUrl]  (preview server must be running). SwiftShader: FPS is not meaningful.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync } from 'node:fs';
const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/smoke3';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ESS = ['invitation', 'torch', 'matches', 'notebook', 'frontKey'];
const poses = JSON.parse(process.env.POSES ?? 'null') ?? [
  ['gate', { x: 90, y: 0, z: 3, yaw: 0, pitch: 0.02 }],
  ['forecourt', { x: 90, y: 0, z: 70, yaw: 0, pitch: 0.05 }],
  ['hall', { x: 90, y: 0.15, z: 86, yaw: 0, pitch: 0.1 }],
  ['living', { x: 80, y: 0.15, z: 86.7, yaw: -Math.PI / 2, pitch: 0 }],
  ['library', { x: 82.4, y: 0.15, z: 97.5, yaw: -0.6, pitch: 0.1 }],
  ['landing', { x: 89, y: 3.35, z: 100, yaw: Math.PI / 2, pitch: 0 }],
  ['kitchen', { x: 98.5, y: 0.15, z: 96, yaw: -Math.PI / 2, pitch: 0 }],
  ['cons', { x: 118, y: 0.15, z: 99.5, yaw: Math.PI / 2, pitch: -0.2 }],
  ['garden', { x: 90, y: 0.15, z: 118, yaw: 0, pitch: 0 }],
  ['cut', { x: 63, y: 0, z: 12, yaw: 0, pitch: 0.1 }],
  ['forest', { x: 40, y: 0, z: 9, yaw: 1.2, pitch: 0 }],
  ['entry', { x: 63, y: -3.4, z: 28, yaw: 0, pitch: 0 }],
  ['gathering', { x: 63, y: -3.4, z: 47.5, yaw: 0, pitch: 0 }],
  ['basement', { x: 93, y: -3.2, z: 107, yaw: -Math.PI / 2, pitch: 0 }],
];
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
const extra = JSON.parse(process.env.EXTRA ?? '{}');
for (const [name, pose] of poses) {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate((save) => localStorage.setItem('fehluwe.save', JSON.stringify(save)), {
    version: 4, scene: 'estate', inventory: ESS, flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true }, player: { home: null, estate: pose }, ...extra,
  });
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 60000 });
  await page.evaluate(helpers);
  await page.evaluate(() => { if (window.T.modalOpen()) window.T.closeModal(); window.T.tick(10); });
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => { const g = window.__game; return { ...g.metrics(), room: g.world.hereRoom, objective: document.getElementById('objective').textContent }; });
  if (process.env.DEBUG_VIS) console.log(await page.evaluate(() => {
    const g = window.__game, w = g.world;
    const vis = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    const roots = {};
    for (const o of w.scene.children) {
      if (!vis(o) || o.userData.static || o.isInstancedMesh) continue;
      let n = 0; o.traverse((c) => { if (c.isMesh && vis(c) && !c.userData.hit) n++; });
      if (!n) continue;
      const k = o.userData.interactId ?? (o.userData.fire ? 'fire' : o.type);
      roots[k] = (roots[k] ?? 0) + n;
    }
    const statics = {};
    for (const o of w.scene.children) if (vis(o) && (o.userData.static || o.isInstancedMesh)) { const k = o.userData.chunk ?? (o.userData.veg ? 'veg:' + o.userData.veg : 'inst'); statics[k] = (statics[k] ?? 0) + 1; }
    return JSON.stringify({ visibleRooms: [...w.visibleRooms], roots: Object.entries(roots).sort((a, b) => b[1] - a[1]).slice(0, 30), statics });
  }));
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(name.padEnd(10), JSON.stringify({ pos: [m.pos.x.toFixed(1), m.pos.y.toFixed(2), m.pos.z.toFixed(1)], room: m.room, calls: m.calls, tris: m.triangles, target: m.target }), m.objective);
}
console.log(problems.length ? problems.join('\n') : 'no page errors');
await browser.close();
