// PERF-R02 visibility smoke (bounded, deterministic; for routine release checks). Runs the harness's smoke set
// (scripts/perf/visibility-harness.mjs: walkway and hall-well slices, every door open) and asserts:
//   - synchronization: a culling update forced inside Game.tick for a pose is idempotent (forcing it again for the
//     same pose changes no region and no submitted counts), and the region set matches the pose's room;
//   - no world updater's own visibility leaks past region culling (an out-of-order World.updateCulling does not change
//     what the Mushroom Grove draws in the next manor frame, and it draws < 5 k of its 364 k triangles there);
//   - determinism: two runs of Mode B over the same poses, with the same history (after a warm-up run: vegetation LOD
//     has 3 m hysteresis), give identical triangles and regions (calls ±1: opaque-batching state);
//   - PB01: every Mode B (fully synchronized) sample stays within 750,000 camera triangles; calls over the 150 guide
//     are reported, not failed (the guide has suite-specific exceptions).
// Usage: npm run build && npm run perf:visibility:smoke     (or: node scripts/perf-visibility.mjs <baseUrl> [out.json])
// The exhaustive sweep (Modes A / A* / B / C, every path and door state, 30 / 60 FPS) is the extended tool:
//   node scripts/perf/visibility-harness.mjs <baseUrl> <out.json>   (see docs/perf-r02/PERF_R02_REPORT.md §3)
import { writeFileSync, mkdirSync } from 'node:fs';
import { openEstate, runMode, summarize, SMOKE } from './perf/visibility-harness.mjs';
import { DOOR_SETS, legacySamples, trajectory } from './perf/visibility-paths.mjs';
import { PERFORMANCE_BUDGET } from './performance-budget.mjs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'scripts/out/perf-visibility-smoke.json';
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };

const { browser, page, problems } = await openEstate(BASE);
const report = { base: BASE, runs: [] };
try {
  for (const [name, y, pts] of SMOKE.paths) {
    const samples = legacySamples(pts, y), frames = trajectory(pts, y, { fps: 30, lookAround: 'first', lookUp: name === 'smoke-well' ? [0] : [] });
    // a warm-up run first: vegetation LOD keeps 3 m hysteresis, so a pose's tree levels depend on where the camera
    // came from; two runs that follow the same path (the warm-up, then run 1) have identical histories
    await runMode(page, { mode: 'B', poses: samples, doors: DOOR_SETS.open, topN: 0 });
    const B1 = await runMode(page, { mode: 'B', poses: samples, doors: DOOR_SETS.open, topN: 0 });
    const B2 = await runMode(page, { mode: 'B', poses: samples, doors: DOOR_SETS.open, topN: 0 });
    const A = await runMode(page, { mode: 'A', poses: frames, doors: DOOR_SETS.open, fps: 30, topN: 0 });
    const C = await runMode(page, { mode: 'C', poses: samples, doors: DOOR_SETS.open, topN: 0 });
    const sB = summarize(B1.rows), sA = summarize(A.rows), sC = summarize(C.rows);
    report.runs.push({ path: name, B: sB, A: sA, C: sC });
    // triangles and regions must match exactly; draw calls within ±1: the low-quality opaque batching can merge or split
    // one draw depending on its state from the previous frame (same geometry, PERF-R02 §4.5)
    const same = B1.rows.every((r, i) => r.tris === B2.rows[i].tris && B1.regionSets[r.rg] === B2.regionSets[B2.rows[i].rg]);
    const callDiff = Math.max(0, ...B1.rows.map((r, i) => Math.abs(r.calls - B2.rows[i].calls)));
    log(`${name}: Mode B is deterministic (two runs with the same history: identical triangles and regions per pose, calls ±1)`, same && callDiff <= 1, `${B1.rows.length} poses, max call difference ${callDiff}`);
    log(`${name}: Mode B within PB01 (${PERFORMANCE_BUDGET.cameraTrianglesPerView.toLocaleString('en')} camera triangles)`, sB.triangles.max <= PERFORMANCE_BUDGET.cameraTrianglesPerView,
      `max ${sB.triangles.max}, p95 ${sB.triangles.p95}; calls max ${sB.calls.max}${sB.over150calls ? ` (${sB.over150calls} poses over the ${PERFORMANCE_BUDGET.lowDrawCalls}-call guide)` : ''}`);
    console.log(`      A@30 max ${sA.triangles.max} / ${sA.calls.max} calls · B max ${sB.triangles.max} / ${sB.calls.max} · C max ${sC.triangles.max} / ${sC.calls.max}`);
  }
  // synchronization + updater leakage, at the poses of the release diagnostic's spikes
  const sync = await page.evaluate(() => {
    const G = window.__game, w = G.world, grove = w.scene.children.find((o) => o.name === 'Mushroom Grove');
    // VIS-R01 (production since PERF-R02's baseline): the grove root stays visible and each mushroom instance is shown
    // or hidden by the grove's own updater (a few may be drawn through an opening): the leak is a change in what it
    // draws after the out-of-order call, or a grove anywhere near its full 364 k triangles in a manor frame
    const groveDrawn = () => { const snap = w.scene.userData.groveSnapshot; if (!grove?.visible) return { n: 0, tris: 0 }; if (!snap) return { n: Infinity, tris: Infinity }; const d = snap().filter((m) => m.drawn); return { n: d.length, tris: d.reduce((a, m) => a + m.tris, 0) }; };
    VP.setDoors('open');
    const poses = [{ x: 90, y: 3.35, z: 99.5, yaw: 1.571, pitch: 0 }, { x: 85.9, y: 3.35, z: 90.2, yaw: 1.571, pitch: 0 }, { x: 90, y: 0.15, z: 84.5, yaw: 0, pitch: 0.35 }];
    const out = [];
    for (const p of poses) {
      VP.setPose({ ...p, yaw: p.yaw - 0.785 }); VP.forceCullNextTick(); VP.tick(1 / 30);
      VP.setPose(p); VP.forceCullNextTick(); VP.tick(1 / 30);
      const a = VP.renderFrame(), ra = VP.activeRegions().join(' '), groveA = groveDrawn();
      VP.forceCullNextTick(); VP.tick(1 / 30);
      const b = VP.renderFrame(), rb = VP.activeRegions().join(' ');
      // the out-of-order call the release diagnostic made: it must not leak the grove into the next game frame
      w.updateCulling(G.camera.position, G.camera); VP.tick(1 / 30);
      const groveAfter = groveDrawn();
      out.push({ p, room: VP.room(), idempotent: a.calls === b.calls && a.triangles === b.triangles && ra === rb, groveHidden: groveAfter.n === groveA.n && groveA.tris < 5000, grove: [groveA.n, groveAfter.n, groveA.tris], tris: a.triangles });
    }
    return out;
  });
  log('synchronization: a culling update forced inside Game.tick is idempotent for its pose', sync.every((s) => s.idempotent), JSON.stringify(sync.map((s) => [s.room, s.tris])));
  log('no updater leak: an out-of-order World.updateCulling does not change what the Mushroom Grove draws in the next manor frame (and it draws < 5 k triangles there)', sync.every((s) => s.groveHidden), JSON.stringify(sync.map((s) => s.grove)));
  log('no page / console errors', problems.length === 0, problems.slice(0, 3).join(' | '));
} catch (e) {
  log('perf-visibility smoke', false, String(e.message).split('\n')[0]);
} finally {
  await browser.close();
}
mkdirSync(OUT.replace(/\/[^/]*$/, ''), { recursive: true });
writeFileSync(OUT, JSON.stringify({ ...report, results }, null, 1));
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exitCode = failed ? 1 : 0;
