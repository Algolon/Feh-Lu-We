// PERF-R03-B visual proof: for every frame of a run (Mode A: continuous movement at the game's culling cadence; Mode B:
// culling synchronized per pose), the candidate frame is compared with references rendered in the SAME frame and at
// the same time (zero-length ticks): (1) every mesh of the window-constrained outdoor regions drawn while its region is
// (World.windowConstrained off) and (2) the tree batches culled by their cones only (World.glassShows off). A pixel the
// candidate loses is attributed to the meshes or the trees, and the frame's crops are saved (the 6 largest per run).
// usage: node scripts/perf/window-lossless.mjs <baseUrl> <outDir>    env: MODES=A,B DOORS=closed,partial,open PATHS=…
//   FPS=30 TURN=3.14 (rad/s for Mode A trajectories) TH=6 DUSK=0.85 RESUME=1
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { openEstate } from './visibility-harness.mjs';
import { ALL_PATHS, DOOR_SETS, legacySamples, trajectory } from './visibility-paths.mjs';

const env = process.env, list = (v, d) => (v ? v.split(',').filter(Boolean) : d);
const [base, outDir] = process.argv.slice(2);
if (!base || !outDir) { console.error('usage: node scripts/perf/window-lossless.mjs <baseUrl> <outDir>'); process.exit(2); }
mkdirSync(`${outDir}/crops`, { recursive: true });
const MODES = list(env.MODES, ['B']), DOORS = list(env.DOORS, ['closed']), FPS = +(env.FPS ?? 30), TH = +(env.TH ?? 6);
const TURN = +(env.TURN ?? Math.PI), DUSK = env.DUSK === undefined ? null : +env.DUSK, wanted = list(env.PATHS, null);
const paths = ALL_PATHS.filter(([n]) => !wanted || wanted.includes(n));
const tag = `${DUSK !== null ? 'dusk-' : ''}${FPS !== 30 ? FPS + 'fps-' : ''}${TURN !== Math.PI ? 'turn' + TURN.toFixed(1) + '-' : ''}`;
const { browser, page, problems } = await openEstate(base);
const file = `${outDir}/window-lossless.json`, summary = { base, threshold: TH, runs: [] };
if (env.RESUME && existsSync(file)) summary.runs = JSON.parse(readFileSync(file, 'utf8')).runs ?? [];
const done = new Set(summary.runs.map((r) => `${r.tag}|${r.path}|${r.doors}|${r.mode}`));
for (const doorName of DOORS) for (const [name, y, pts] of paths) for (const mode of MODES) {
  if (done.has(`${tag}|${name}|${doorName}|${mode}`)) continue;
  const poses = mode === 'A' ? trajectory(pts, y, { fps: FPS, turnRate: TURN, lookUp: name === 'well' ? pts.map((_, i) => i) : [] }) : legacySamples(pts, y, 0.4, [0, 0.35]);
  const res = await page.evaluate(({ poses, mode, doors, fps, TH, DUSK }) => {
    const G = window.__game, w = G.world, gl = G.renderer.getContext();
    VP.setDoors(doors.mode === 'list' ? 'list' : doors.mode, doors.list);
    const regs = w.regions.filter((r) => r.win);
    const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, cand = new Uint8Array(W * H * 4), ref = new Uint8Array(W * H * 4);
    const render = (buf) => { VP.renderFrame(); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf); return G.renderer.info.render.triangles; };
    const dusk = () => { if (DUSK !== null) { G.dusk = DUSK; G.extras.env?.update(G.dusk, G.camera.position, G.indoor); } };
    // a zero-length tick re-runs the world's per-frame updaters (tree batches) without advancing time or culling
    const still = () => { const ct = G.cullTimer; G.cullTimer = 1e9; VP.tick(0); G.cullTimer = ct; dusk(); };
    // visible and regionOff together: vegetation batches re-derive their visibility from regionOff in their update
    const meshes = (all) => { for (const r of regs) r.meshes.forEach((m, i) => { const v = all ? r.on : r.meshOn[i]; m.visible = v; m.userData.regionOff = !v; }); };
    const glass = (on, saved) => { w.glassApertures = on ? saved : null; w.outdoorWindowsVersion++; still(); };
    const diff = (a, b) => { let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let i = 0, p = 0; i < a.length; i += 4, p++) { if (Math.abs(a[i] - b[i]) > TH || Math.abs(a[i + 1] - b[i + 1]) > TH || Math.abs(a[i + 2] - b[i + 2]) > TH) { n++; const x = p % W, yy = H - 1 - Math.floor(p / W); if (x < x0) x0 = x; if (x > x1) x1 = x; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; } } return n ? { n, box: [x0, y0, x1, y1] } : { n: 0 }; };
    VP.setPose(poses[0]); VP.forceCullNextTick(); for (let i = 0; i < 15; i++) VP.tick(1 / fps); VP.forceCullNextTick();
    const rows = [], crops = [];
    let glassFrames = 0, saved = 0, maxSaved = 0;
    for (let k = 0; k < poses.length; k++) {
      const p = poses[k];
      if (mode === 'A') { VP.setPose(p); VP.tick(1 / fps); } else { VP.setPose(p); VP.forceCullNextTick(); VP.tick(1 / 30); }
      dusk();
      const ga = w.glassApertures;
      if (!ga) continue; // the outdoors is not seen through glass only: nothing is constrained in this frame
      glassFrames++;
      // the previous rule (both parts) first, then the candidate after restoring it: both images follow the same
      // hide / show cycle of the batched instances (whose draw order it can change by a few leaf pixels)
      meshes(true); glass(false, ga); const tr = render(ref);
      meshes(false); glass(true, ga); const tc = render(cand);
      const d = diff(cand, ref);
      saved += tr - tc; maxSaved = Math.max(maxSaved, tr - tc);
      let by = null;
      if (d.n) { // attribute: meshes only, then trees only
        glass(true, ga); const a = new Uint8Array(W * H * 4); render(a); const dm = diff(cand, a);
        meshes(false); glass(false, ga); render(a); const dt = diff(cand, a);
        by = { meshes: dm.n, trees: dt.n };
        meshes(true); // reference state for the crop below
      }
      if (d.n && (crops.length < 6 || d.n > Math.min(...crops.map((c) => c.n)))) {
        if (crops.length >= 6) crops.splice(crops.findIndex((c) => c.n === Math.min(...crops.map((q) => q.n))), 1);
        render(ref); const refPng = G.renderer.domElement.toDataURL('image/png');
        meshes(false); glass(true, ga); render(cand); crops.push({ k, n: d.n, ref: refPng, cand: G.renderer.domElement.toDataURL('image/png') });
      }
      meshes(false); glass(true, ga); // back to the candidate state
      if (d.n) rows.push({ k, x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch, room: w.hereRoom, n: d.n, box: d.box, by, cand: tc, ref: tr, windows: ga.map((a) => [a.x, a.z, a.y0]) });
    }
    return { frames: poses.length, glassFrames, avgSaved: glassFrames ? Math.round(saved / glassFrames) : 0, maxSaved, diffs: rows, crops };
  }, { poses, mode, doors: DOOR_SETS[doorName], fps: FPS, TH, DUSK });
  for (const c of res.crops) for (const kind of ['cand', 'ref']) writeFileSync(`${outDir}/crops/${tag}${doorName}-${name}-${mode}-${c.k}-${kind}.png`, Buffer.from(c[kind].split(',')[1], 'base64'));
  delete res.crops;
  const maxPx = Math.max(0, ...res.diffs.map((d) => d.n));
  summary.runs.push({ tag, path: name, doors: doorName, mode, fps: FPS, turn: TURN, dusk: DUSK, ...res, maxPx });
  writeFileSync(file, JSON.stringify(summary, null, 1));
  console.log(`${(tag + name).padEnd(22)} ${doorName.padEnd(7)} ${mode}  frames ${String(res.frames).padStart(4)}  glass-only ${String(res.glassFrames).padStart(4)}  avg saved ${res.avgSaved} max ${res.maxSaved}  diff frames ${res.diffs.length} max ${maxPx} px`);
}
summary.problems = problems;
writeFileSync(file, JSON.stringify(summary, null, 1));
await browser.close();
