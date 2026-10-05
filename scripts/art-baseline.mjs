// Art-refresh baseline captures: fixed poses at phone-default quality ("low": no shadows, DPR 1, no MSAA)
// in a landscape phone viewport (HUD hidden), each shot three times:
//   <name>.jpg          game lighting as shipped
//   <name>-neutral.jpg  NEUTRAL lighting (no fog, white sky/ground fill, white sun, exposure 1)
//   <name>-clay.jpg     neutral lighting + every lit surface replaced by one grey clay material (no textures,
//                       no vertex/instance colours) — shape and silhouette only, nothing for atmosphere to hide.
// Usage: node scripts/art-baseline.mjs [outDir] [baseUrl]   (needs `npm run preview` running)
// Software-rendered (SwiftShader): composition/shape evidence, not performance. Draw calls and triangles
// are reported by three.js and are renderer-independent.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const OUT = process.argv[2] ?? 'docs/art-refresh/baseline';
const BASE = process.argv[3] ?? 'http://localhost:4173/Feh-Lu-We/';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const ESS = ['invitation', 'torch', 'matches', 'notebook', 'frontKey'];
const VIEW = { width: 844, height: 390 }; // landscape phone (CSS px); quality "low" renders at DPR 1

// [name, standing pose (plan x/z, yaw), look-at target (plan x, y, z) or null, save extras]
const SHOTS = [
  // living-room hearth and mantel (fire lit by default)
  ['01-hearth-wide', { x: 80.6, z: 84.4 }, [72.6, 1.2, 86.9]],
  ['02-mantel-front', { x: 75.4, z: 86.7 }, [72.6, 1.35, 86.7]],
  ['03-mantel-near', { x: 73.9, z: 87.0 }, [72.8, 1.3, 86.6]],
  ['04-armchair-near', { x: 78.2, z: 81.9 }, [76.4, 0.45, 83.0]],
  // library (furniture-dense interior)
  ['05-library-wide', { x: 82.4, z: 97.5 }, [76.0, 1.6, 103.0]],
  ['06-library-table-near', { x: 82.4, z: 99.4 }, [80.6, 0.75, 101.2]],
  ['07-bookshelf-near', { x: 74.6, z: 98.2 }, [72.8, 1.3, 99.0]],
  // manor entrance and architectural framing
  ['08-manor-forecourt', { x: 90, z: 66 }, [90, 4.5, 80]],
  ['09-manor-porch-near', { x: 90, z: 75.8 }, [90, 2.0, 80]],
  // woodland path at ordinary player height
  ['10-woodland-path', { x: 66.5, z: 57.6 }, [56.0, 1.4, 49.0]],
  ['11-southern-loop', { x: 40, z: 9.3 }, [55.5, 1.4, 8.6]],
  ['12-path-edge-near', { x: 47.5, z: 41.5 }, [50.0, 0.0, 44.2]],
  // BOSLUST approach
  ['13-boslust-fork', { x: 51.0, z: 7.2 }, [63.0, 2.0, 16.0]],
  ['14-boslust-cut', { x: 63, z: 10.2 }, [63, 1.8, 18.2]],
  ['15-boslust-door-near', { x: 63, z: 15.4 }, [63, 1.4, 18.2]],
];

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1 });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
const record = [];
for (const [name, stand, target, extra] of SHOTS) {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate(([save]) => {
    localStorage.setItem('fehluwe.save', JSON.stringify(save));
    localStorage.setItem('fehluwe.settings', JSON.stringify({ quality: 'low' }));
  }, [{ version: 4, scene: 'estate', inventory: ESS, flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true }, player: { home: null, estate: { x: stand.x, y: 0.15, z: stand.z, yaw: 0, pitch: 0 } }, ...(extra ?? {}) }]);
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 60000 });
  await page.evaluate(helpers);
  const pose = await page.evaluate(([t]) => {
    if (window.T.modalOpen()) window.T.closeModal();
    window.T.tick(15);
    if (t) window.T.lookAt(t[0], t[1], t[2]);
    window.T.tick(10);
    for (const id of ['toast', 'hud', 'stick']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    const p = window.__game.player;
    return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), yaw: +p.yaw.toFixed(3), pitch: +p.pitch.toFixed(3) };
  }, [target]);
  await page.waitForTimeout(700);
  const m = await page.evaluate(() => { const g = window.__game; const r = g.metrics(); return { calls: r.calls, triangles: r.triangles, room: g.world.hereRoom }; });
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 80 });
  // neutral pass: freeze the environment and replace the mood lighting with flat white fill
  await page.evaluate(() => {
    const g = window.__game, env = g.extras.env;
    env.update = () => {};
    env.hemi.color.set('#ffffff'); env.hemi.groundColor.set('#8a8a8a'); env.hemi.intensity = 2.0;
    env.sun.color.set('#ffffff'); env.sun.intensity = 1.6;
    const f = g.world.scene.fog; if (f) { f.near = 1e4; f.far = 2e4; }
    g.renderer.toneMappingExposure = 1.0;
    window.T.tick(2);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}-neutral.jpg`, type: 'jpeg', quality: 80 });
  // clay pass: one matte grey for every Lambert surface (fixture glows, flames and the sky stay as they are)
  await page.evaluate(() => {
    const g = window.__game;
    let Lam = null;
    g.world.scene.traverse((o) => { if (!Lam && o.isMesh && o.material?.type === 'MeshLambertMaterial') Lam = o.material.constructor; });
    const solid = new Lam({ color: '#c9c3b8' });
    const glass = new Lam({ color: '#c9c3b8', transparent: true, opacity: 0.15, depthWrite: false });
    g.world.scene.traverse((o) => {
      if (!o.isMesh) return;
      const swap = (m) => m?.type === 'MeshLambertMaterial' ? (m.transparent ? glass : solid) : m;
      o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
      if (o.isInstancedMesh) o.instanceColor = null;
    });
    window.T.tick(2);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}-clay.jpg`, type: 'jpeg', quality: 80 });
  record.push({ name, pose, lookAt: target, ...m });
  console.log(name.padEnd(24), JSON.stringify(pose), m.room, m.calls, m.triangles);
}
writeFileSync(`${OUT}/poses.json`, JSON.stringify({
  viewport: VIEW, deviceScaleFactor: 1, quality: 'low', renderer: 'Chromium 141 + SwiftShader (software WebGL2)',
  neutral: 'fog disabled, hemisphere #ffffff/#8a8a8a ×2.0, sun #ffffff ×1.6, exposure 1.0; fixture lights unchanged',
  clay: 'neutral lighting + all MeshLambertMaterial surfaces replaced by matte #c9c3b8 (instance colours removed)',
  hud: 'hidden (#hud, #stick, #toast) so the frame shows only the world',
  saveState: 'fresh estate start (essentials, front door open), dusk ≈ 0', shots: record,
}, null, 2));
console.log(problems.length ? problems.join('\n') : 'no page errors');
await browser.close();
