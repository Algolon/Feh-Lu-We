// PERF-R03-B: CPU cost of culling, same poses on each build, alternating builds per round (fair under shared load):
// World.updateCulling alone, and one forced-cull tick (culling + per-frame updaters such as the tree batches).
// usage: node scripts/perf/cull-cpu.mjs <name>=<baseUrl> ...   env: ROUNDS=5 REPS=40 DOORS=closed
import { openEstate } from './visibility-harness.mjs';
import { ALL_PATHS, DOOR_SETS, legacySamples } from './visibility-paths.mjs';
const builds = process.argv.slice(2).map((a) => { const i = a.indexOf('='); return { n: a.slice(0, i), url: a.slice(i + 1) }; });
const ROUNDS = +(process.env.ROUNDS ?? 5), REPS = +(process.env.REPS ?? 40), doors = DOOR_SETS[process.env.DOORS ?? 'closed'];
const poses = ALL_PATHS.filter(([n]) => ['hall', 'well', 'up-west', 'library', 'ground-front'].includes(n)).flatMap(([n, y, pts]) => legacySamples(pts, y, 0.4, [0]).filter((_, i) => i % 6 === 0).map((p) => ({ ...p, path: n })));
for (const b of builds) Object.assign(b, await openEstate(b.url), { cull: [], tick: [] });
for (let r = 0; r < ROUNDS; r++) for (const b of builds) {
  const res = await b.page.evaluate(({ poses, REPS, doors }) => {
    const G = window.__game, w = G.world; VP.setDoors(doors.mode === 'list' ? 'list' : doors.mode, doors.list);
    const cull = [], tick = [];
    for (const p of poses) {
      VP.setPose(p); VP.forceCullNextTick(); VP.tick(1 / 30);
      let t = performance.now(); for (let i = 0; i < REPS; i++) w.updateCulling(G.camera.position, G.camera); cull.push((performance.now() - t) / REPS);
      t = performance.now(); for (let i = 0; i < REPS; i++) { w.outdoorWindowsVersion++; VP.forceCullNextTick(); VP.tick(0); } tick.push((performance.now() - t) / REPS);
    }
    return { cull, tick };
  }, { poses, REPS, doors });
  b.cull.push(...res.cull); b.tick.push(...res.tick);
}
const q = (a, f) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };
console.log(`poses ${poses.length} × rounds ${ROUNDS} × reps ${REPS}`);
for (const b of builds) { console.log(`${b.n}  updateCulling ms med ${q(b.cull, 0.5).toFixed(3)} p95 ${q(b.cull, 0.95).toFixed(3)} max ${Math.max(...b.cull).toFixed(3)}   cull+updaters tick (tree re-cull forced) ms med ${q(b.tick, 0.5).toFixed(3)} p95 ${q(b.tick, 0.95).toFixed(3)}`); await b.browser.close(); }
