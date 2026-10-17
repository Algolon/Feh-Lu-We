// PERF-R02 §2: reproduces the D3-b2 release diagnostic's 785–929 k "spikes" and shows they are a measurement artefact.
// At the landing hotspot (90, 99.5) turning east with every door open, the same frame is produced three ways:
//   explicitAfterTick: World.updateCulling called AFTER Game.tick (as the release diagnostic did) with no culling tick
//     in between: region culling switches 'outdoor' on after the world's updaters ran, so the Mushroom Grove root
//     (107 m away, hidden by its own distance rule in w.update) is drawn: +364 k triangles;
//   forcedInTick: culling forced inside Game.tick (the game's own order: camera → culling → updaters → render);
//   legacy: the dev04d-walk-budget sequence.
// Usage: node scripts/perf/reproduce-r02-artefact.mjs <baseUrl>
import { openEstate } from './visibility-harness.mjs';

const base = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const { browser, page } = await openEstate(base);
const out = await page.evaluate(() => {
  const G = window.__game, w = G.world; VP.setDoors('open');
  const grove = w.scene.children.find((o) => o.name === 'Mushroom Grove');
  const away = { x: 90, y: 3.35, z: 99.5, yaw: 0.785, pitch: 0 }, east = { ...away, yaw: 1.571 };
  const groveTris = (f) => Object.entries(f.by).filter(([k]) => k.includes('Mushroom')).reduce((n, [, v]) => n + v.triangles, 0);
  const settle = () => { VP.setPose(away); VP.forceCullNextTick(); for (let i = 0; i < 6; i++) VP.tick(1 / 30); };
  const res = {};
  settle(); VP.setPose(east); G.cullTimer = 10; VP.tick(1 / 30); VP.tick(1 / 30); VP.tick(1 / 30);
  w.updateCulling(G.camera.position, G.camera);
  let f = VP.renderFrame({ breakdown: true }); res.explicitAfterTick = { triangles: f.triangles, calls: f.calls, groveTriangles: groveTris(f), groveVisible: grove.visible };
  settle(); VP.setPose(east); VP.forceCullNextTick(); VP.tick(1 / 30);
  f = VP.renderFrame({ breakdown: true }); res.forcedInTick = { triangles: f.triangles, calls: f.calls, groveTriangles: groveTris(f), groveVisible: grove.visible };
  settle(); VP.setPose(east); VP.tick(1 / 30); VP.tick(1 / 30); VP.setPose(east); VP.tick(1 / 30);
  f = VP.renderFrame({ breakdown: true }); res.legacy = { triangles: f.triangles, calls: f.calls, groveTriangles: groveTris(f), groveVisible: grove.visible };
  res.groveDistanceM = +Math.hypot(G.player.x - 179, G.player.z - 160).toFixed(1);
  return res;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
