// PERF-R02 visual-safety proof for doorway-rule regions (non-functional tooling).
// For every frame of a run (Mode A: continuous movement at the game's culling cadence; Mode B: per-pose synchronized
// culling), the candidate frame is compared with a REFERENCE rendered in the same frame, same culling state and same
// time: the chosen regions switched back to the rooms-only rule (on whenever one of their rooms is in the room graph's
// visible set, exactly as before), ordinary frustum culling untouched. Any pixel the candidate loses is attributed to
// the region responsible (each region re-enabled alone) and its crop saved. Mode A therefore also catches late
// pop-in: a doorway rule that turns a region on one culling update after it became visible shows up as lost pixels.
// Usage: node scripts/perf/visibility-lossless.mjs <baseUrl> <outDir>
//   REGIONS=mUpE,mAttic,mLib (chunks whose rule is tested)  MODES=A,B  PATHS=...  DOORS=open,partial  FPS=30  TH=6
//   EXT=1: test the exterior regions (World.exteriorRegion, PERF-R03-A) instead; their reference is the previous rule,
//   drawn whenever within the region's distance.  DUSK=0.8: render every frame at that dusk phase.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { openEstate } from './visibility-harness.mjs';
import { ALL_PATHS, DOOR_SETS, legacySamples, trajectory } from './visibility-paths.mjs';

const env = process.env, list = (v, d) => (v ? v.split(',').filter(Boolean) : d);
const [base, outDir] = process.argv.slice(2);
if (!base || !outDir) { console.error('usage: node scripts/perf/visibility-lossless.mjs <baseUrl> <outDir>'); process.exit(2); }
mkdirSync(`${outDir}/crops`, { recursive: true });
const REGIONS = list(env.REGIONS, ['mUpE', 'mAttic', 'mLib']), MODES = list(env.MODES, ['A', 'B']), DOORS = list(env.DOORS, ['open', 'partial']);
const FPS = +(env.FPS ?? 30), TH = +(env.TH ?? 6), wanted = list(env.PATHS, null), EXT = !!env.EXT, DUSK = env.DUSK === undefined ? null : +env.DUSK;
const paths = ALL_PATHS.filter(([n]) => !wanted || wanted.includes(n));

const { browser, page, problems } = await openEstate(base);
const summary = { base, regions: REGIONS, threshold: TH, runs: [] };
// RESUME=1 keeps completed runs from <outDir>/lossless.json
if (env.RESUME && existsSync(`${outDir}/lossless.json`)) summary.runs = JSON.parse(readFileSync(`${outDir}/lossless.json`, 'utf8')).runs ?? [];
const doneRuns = new Set(summary.runs.map((r) => `${r.path}|${r.doors}|${r.mode}`));
for (const doorName of DOORS) for (const [name, y, pts] of paths) for (const mode of MODES) {
  if (doneRuns.has(`${name}|${doorName}|${mode}`)) continue;
  const poses = mode === 'A' ? trajectory(pts, y, { fps: FPS, lookUp: name === 'well' ? pts.map((_, i) => i) : [] }) : legacySamples(pts, y, 0.4, [0, 0.35]);
  const res = await page.evaluate(({ poses, mode, doors, regions, fps, TH, EXT, DUSK }) => {
    const G = window.__game, w = G.world, gl = G.renderer.getContext();
    VP.setDoors(doors.mode === 'list' ? 'list' : doors.mode, doors.list);
    const regs = w.regions.filter((r) => (EXT ? r.ext : r.doors) && r.meshes.some((m) => regions.includes(m.userData.chunk)));
    const dusk = () => { if (DUSK !== null) { G.dusk = DUSK; G.extras.env?.update(G.dusk, G.camera.position, G.indoor); } };
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, cand = new Uint8Array(W * H * 4), ref = new Uint8Array(W * H * 4), one = new Uint8Array(W * H * 4);
    const render = (buf) => { VP.renderFrame(); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf); return { calls: G.renderer.info.render.calls, tris: G.renderer.info.render.triangles }; };
    // rooms-only verdict for a region from the CURRENT culling state (visibleRooms of the last culling update)
    const roomsOnly = (r) => { if (r.ext) return r.sph.center.distanceTo(G.camera.position) - r.sph.radius < r.far; let on = false; for (const id of r.rooms) if (w.visibleRooms.has(id)) { on = true; break; } if (on && r.outFar < Infinity && w.hereRoom === 'out') on = r.sph.center.distanceTo(G.camera.position) - r.sph.radius < r.outFar; return on; };
    const show = (r, v) => { for (const m of r.meshes) m.visible = v; };
    const diff = (a, b) => { let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let i = 0, p = 0; i < a.length; i += 4, p++) { if (Math.abs(a[i] - b[i]) > TH || Math.abs(a[i + 1] - b[i + 1]) > TH || Math.abs(a[i + 2] - b[i + 2]) > TH) { n++; const x = p % W, yy = H - 1 - Math.floor(p / W); if (x < x0) x0 = x; if (x > x1) x1 = x; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; } } return n ? { n, box: [x0, y0, x1, y1] } : { n: 0 }; };
    VP.setPose(poses[0]); VP.forceCullNextTick(); for (let i = 0; i < 15; i++) VP.tick(1 / fps); VP.forceCullNextTick();
    const rows = [], crops = [];
    let culledFrames = 0, savedTris = 0, maxSaved = 0;
    for (let k = 0; k < poses.length; k++) {
      const p = poses[k];
      if (mode === 'A') { VP.setPose(p); VP.tick(1 / fps); } else { VP.setPose(p); VP.forceCullNextTick(); VP.tick(1 / 30); }
      dusk();
      const ruled = regs.filter((r) => r.on !== roomsOnly(r)); // regions the doorway rule currently hides
      if (!ruled.length) continue;
      culledFrames++;
      const c = render(cand);
      for (const r of ruled) show(r, true);
      const rr = render(ref);
      for (const r of ruled) show(r, r.on);
      savedTris += rr.tris - c.tris; maxSaved = Math.max(maxSaved, rr.tris - c.tris);
      const d = diff(cand, ref);
      if (!d.n) continue;
      const by = {};
      for (const r of ruled) { show(r, true); render(one); show(r, r.on); const e = diff(cand, one); if (e.n) by[r.meshes.find((m) => m.userData.chunk)?.userData.chunk] = e; }
      const row = { k, x: p.x, z: p.z, yaw: p.yaw, pitch: p.pitch, room: w.hereRoom, n: d.n, box: d.box, by, cand: c, ref: rr };
      rows.push(row);
      if (crops.length < 6 || d.n > Math.min(...crops.map((c) => c.n))) { if (crops.length >= 6) crops.splice(crops.findIndex((c) => c.n === Math.min(...crops.map((q) => q.n))), 1); show(ruled[0], false); VP.renderFrame(); crops.push({ k, n: d.n, cand: G.renderer.domElement.toDataURL('image/png') }); for (const r of ruled) show(r, true); VP.renderFrame(); crops[crops.length - 1].ref = G.renderer.domElement.toDataURL('image/png'); for (const r of ruled) show(r, r.on); }
    }
    return { frames: poses.length, culledFrames, savedTris, maxSaved, diffs: rows, crops };
  }, { poses, mode, doors: DOOR_SETS[doorName], regions: REGIONS, fps: FPS, TH, EXT, DUSK });
  for (const c of res.crops) for (const kind of ['cand', 'ref']) writeFileSync(`${outDir}/crops/${doorName}-${name}-${mode}-${c.k}-${kind}.png`, Buffer.from(c[kind].split(',')[1], 'base64'));
  delete res.crops;
  const maxPx = Math.max(0, ...res.diffs.map((d) => d.n));
  summary.runs.push({ path: name, doors: doorName, mode, ...res, maxPx });
  writeFileSync(`${outDir}/lossless.json`, JSON.stringify(summary, null, 1));
  console.log(`${name.padEnd(9)} ${doorName.padEnd(7)} ${mode}  frames ${String(res.frames).padStart(4)}  culled by rule ${String(res.culledFrames).padStart(4)}  avg saved ${res.culledFrames ? Math.round(res.savedTris / res.culledFrames) : 0} max ${res.maxSaved}  pixel-diff frames ${res.diffs.length} max ${maxPx} px`);
}
summary.problems = problems;
writeFileSync(`${outDir}/lossless.json`, JSON.stringify(summary, null, 1));
await browser.close();
