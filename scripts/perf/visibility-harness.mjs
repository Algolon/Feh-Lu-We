// PERF-R02 visibility / render-cost harness (non-functional tooling). Three explicit modes on the same paths:
//   A  runtime-faithful: one pose per rendered frame along a continuous trajectory (fixed dt, 30 or 60 FPS), the
//      game's own culling cadence (World.updateCulling every 0.12 s inside Game.tick), every frame rendered and read.
//   A* the same frames with culling forced on every frame (what a fully up-to-date visibility state would draw):
//      A vs A* isolates what the 0.12 s cadence itself adds or hides.
//   B  pose-synchronized: per sample pose, culling is forced for that exact pose INSIDE Game.tick (the game's own
//      order: camera → culling → world updaters → render). A diagnostic / worst case, not a runtime frequency.
//   C  legacy: scripts/dev04d-walk-budget.mjs's method (three 1/30 s ticks per sample; culling whenever the cadence
//      happens to fire), with the cadence phase pinned at the path start so it is reproducible.
// Do NOT call World.updateCulling outside Game.tick to "force" a frame: region culling then runs after the world's
// updaters, and an object that an updater hides (the Mushroom Grove, 107 m from the manor) is drawn (PERF-R02 §2).
//
// Usage: node scripts/perf/visibility-harness.mjs <baseUrl> <out.json> [options as env]
//   MODES=A,Astar,B,C  PATHS=up-west,hall,...  DOORS=closed,open,partial  FPS=30,60  SPEED=3.2  VW=915 VH=412
//   BREAK=550000 (attribute every frame above this; plus the top TOPN frames per run)  COMMIT=sha  SMOKE=1
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { ALL_PATHS, DOOR_SETS, legacySamples, trajectory } from './visibility-paths.mjs';

const env = process.env;
const list = (v, d) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : d);

export const SMOKE = {
  modes: ['A', 'B', 'C'], doors: ['open'], fps: [30],
  // short, fixed slices of the hotspot paths: the walkway looking east, the landing, the hall under the well
  paths: [['smoke-walkway', 3.35, [[90, 99.5], [85.9, 95.0], [85.9, 90.2]]], ['smoke-well', 0.15, [[90, 84.5], [90, 88.0]]]],
};

export function stats(values) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b), q = (p) => s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))];
  return { n: s.length, min: s[0], median: q(0.5), p95: q(0.95), p99: q(0.99), max: s[s.length - 1] };
}

/** Open the estate (fresh, isolated profile; a fixture save, never a player's) at mobile low quality. */
export async function openEstate(base, { width = 915, height = 412, exe = env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' } = {}) {
  const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width, height } })).newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  await page.goto(base + '?autotest=1');
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'consKey'], flags: { leftHome: true, basementOpen: true, boslustOpen: true } })));
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(readFileSync(new URL('./visibility-probe.js', import.meta.url), 'utf8'));
  await page.evaluate(() => { const g = window.__game; g.settings.quality = 'low'; g.applyQuality(true); });
  return { browser, page, problems };
}

/**
 * Run one mode over one pose list inside the page (one synchronous evaluate: no real frames interleave).
 * Returns per-frame rows; attribution (`by`) for rows above `brk` and for the `topN` highest-triangle rows.
 */
export async function runMode(page, { mode, poses, doors, fps = 30, brk = 550000, topN = 5 }) {
  return page.evaluate(({ mode, poses, doors, fps, brk, topN }) => {
    const G = window.__game, dt = 1 / fps;
    VP.setDoors(doors.mode === 'list' ? 'list' : doors.mode, doors.list);
    // settle on the first pose, then pin the cadence phase: the first culling fires on the first measured tick
    VP.setPose(poses[0]); VP.forceCullNextTick(); for (let i = 0; i < 15; i++) VP.tick(dt);
    VP.forceCullNextTick();
    VP.takeCullMs();
    const sets = [], setIdx = new Map(), rows = [];
    const regionsKey = () => { const k = VP.activeRegions().join(' '); if (!setIdx.has(k)) { setIdx.set(k, sets.length); sets.push(k); } return setIdx.get(k); };
    const frame = (p, extra) => {
      const t0 = performance.now(); const f = VP.renderFrame(); const renderMs = performance.now() - t0;
      const cullMs = VP.takeCullMs();
      const row = { i: rows.length, x: p.x, z: p.z, yaw: p.yaw, pitch: p.pitch, tag: p.tag ?? (p.turn ? 'turn' : 'step'), room: VP.room(), calls: f.calls, tris: f.triangles, rg: regionsKey(), culled: cullMs.length > 0, cullMs: cullMs.length ? +cullMs.reduce((a, b) => a + b, 0).toFixed(3) : 0, renderMs: +renderMs.toFixed(2), ...extra };
      if (f.triangles > brk) row.by = VP.renderFrame({ breakdown: true }).by;
      rows.push(row);
    };
    for (const p of poses) {
      if (mode === 'A') { VP.setPose(p); VP.tick(dt); frame(p); }                                   // cadence culling
      else if (mode === 'Astar') { VP.setPose(p); VP.forceCullNextTick(); VP.tick(dt); frame(p); }  // culling every frame
      else if (mode === 'B') { VP.setPose(p); VP.forceCullNextTick(); VP.tick(1 / 30); frame(p); }
      else if (mode === 'C') { VP.setPose(p); VP.tick(1 / 30); VP.tick(1 / 30); VP.setPose(p); VP.tick(1 / 30); frame(p); }
    }
    // attribution for the top frames that were below the threshold
    const top = [...rows].sort((a, b) => b.tris - a.tris).slice(0, topN).filter((r) => !r.by);
    for (const r of top) {
      const p = poses[r.i];
      VP.setPose(p); VP.forceCullNextTick(); VP.tick(1 / 30);
      const f = VP.renderFrame({ breakdown: true });
      r.byForced = { tris: f.triangles, by: f.by }; // re-rendered with up-to-date culling (Mode A rows may differ)
    }
    return { rows, regionSets: sets, meta: VP.meta() };
  }, { mode, poses, doors, fps, brk, topN });
}

export function summarize(rows) {
  const tri = stats(rows.map((r) => r.tris)), calls = stats(rows.map((r) => r.calls));
  const cull = stats(rows.filter((r) => r.culled).map((r) => r.cullMs)), render = stats(rows.map((r) => r.renderMs));
  const top = [...rows].sort((a, b) => b.tris - a.tris).slice(0, 5).map((r) => ({ i: r.i, x: r.x, z: r.z, yaw: r.yaw, pitch: r.pitch, room: r.room, tag: r.tag, calls: r.calls, tris: r.tris }));
  return { frames: rows.length, triangles: tri, calls, cullMs: cull, renderMs: render, over750k: rows.filter((r) => r.tris > 750000).length, over150calls: rows.filter((r) => r.calls > 150).length, top };
}

async function main() {
  const [base, out] = process.argv.slice(2);
  if (!base || !out) { console.error('usage: node scripts/perf/visibility-harness.mjs <baseUrl> <out.json>'); process.exit(2); }
  const smoke = !!env.SMOKE;
  const modes = smoke ? SMOKE.modes : list(env.MODES, ['A', 'B', 'C']);
  const doorsList = smoke ? SMOKE.doors : list(env.DOORS, ['closed', 'open', 'partial']);
  const fpsList = (smoke ? SMOKE.fps : list(env.FPS, ['30'])).map(Number);
  const wanted = list(env.PATHS, null);
  const paths = smoke ? SMOKE.paths : ALL_PATHS.filter(([n]) => !wanted || wanted.includes(n));
  const speed = +(env.SPEED ?? 3.2), brk = +(env.BREAK ?? 550000), topN = +(env.TOPN ?? 5);
  const { browser, page, problems } = await openEstate(base, { width: +(env.VW ?? 915), height: +(env.VH ?? 412) });
  const result = { tool: 'scripts/perf/visibility-harness.mjs', commit: env.COMMIT ?? null, base, smoke, speed, runs: [] };
  for (const doorName of doorsList) for (const [name, y, pts] of paths) for (const mode of modes) {
    const fpsFor = mode === 'A' || mode === 'Astar' ? fpsList : [30];
    for (const fps of fpsFor) {
      const poses = mode === 'A' || mode === 'Astar' ? trajectory(pts, y, { fps, speed, lookAround: smoke ? 'first' : 'corners', lookUp: name === 'well' ? pts.map((_, i) => i) : name === 'smoke-well' ? [0] : [] }) : legacySamples(pts, y);
      const t0 = Date.now();
      const r = await runMode(page, { mode, poses, doors: DOOR_SETS[doorName], fps, brk, topN });
      const s = summarize(r.rows);
      result.meta ??= r.meta;
      result.runs.push({ path: name, doors: doorName, mode, fps, wallSeconds: Math.round((Date.now() - t0) / 1000), summary: s, regionSets: r.regionSets, rows: r.rows });
      writeFileSync(out, JSON.stringify(result)); // after every run: a long sweep survives an interruption
      console.log(`${name.padEnd(14)} ${doorName.padEnd(7)} ${(mode + (fpsFor.length > 1 || mode.startsWith('A') ? '@' + fps : '')).padEnd(9)} n ${String(s.frames).padStart(4)}  tris med ${s.triangles.median} p95 ${s.triangles.p95} p99 ${s.triangles.p99} max ${s.triangles.max}  calls max ${s.calls.max}  >750k ${s.over750k}  cull ms med ${s.cullMs?.median?.toFixed(2) ?? '-'} max ${s.cullMs?.max?.toFixed(2) ?? '-'}`);
    }
  }
  result.problems = problems;
  writeFileSync(out, JSON.stringify(result));
  await browser.close();
  if (problems.length) { console.error('page problems:', problems.slice(0, 5)); process.exitCode = 1; }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
