// PERF-R03-B: classify every pixel the window-constrained rule changed in a frame listed by window-lossless.mjs. The
// pose is re-run (Mode B: culling synchronized), the candidate's culled set is recorded (outdoor meshes the rule hid,
// tree instances glassShows hid), then the reference state (everything the previous rule draws) is rendered and every
// changed pixel is ray-cast against the scene: VISIBLE if a culled object is the first opaque surface along any of five
// rays through the pixel (only glass in front of it), bleed-through if every ray reaching it passes opaque geometry
// first (it shows through a seam), otherwise edge / ordering (no culled object along the pixel: draw-order artefact).
// usage: node scripts/perf/classify-window-diffs.mjs <baseUrl> <window-lossless.json>   env: ONLY=path|doors|k,…
import { readFileSync } from 'node:fs';
import { openEstate } from './visibility-harness.mjs';
import { ALL_PATHS, DOOR_SETS } from './visibility-paths.mjs';
const [base, file] = process.argv.slice(2);
const J = JSON.parse(readFileSync(file, 'utf8')), floorOf = Object.fromEntries(ALL_PATHS.map(([n, y]) => [n, y]));
const only = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
// Mode B rows only (a Mode A frame depends on its trajectory's history; its pose is re-run synchronized here)
const frames = J.runs.flatMap((r) => r.diffs.filter((d) => !only || only.has(`${r.path}|${r.doors}|${d.k}`)).map((d) => ({ tag: r.tag, doors: r.doors, path: r.path, mode: r.mode, k: d.k, n: d.n, by: d.by, dusk: r.dusk, pose: { x: d.x, y: d.y ?? floorOf[r.path] ?? 0.15, z: d.z, yaw: d.yaw, pitch: d.pitch } })));
const { browser, page } = await openEstate(base);
const out = [];
for (const f of frames) {
  out.push({ ...f, ...(await page.evaluate(({ pose, d, DUSK }) => {
    const G = window.__game, w = G.world, gl = G.renderer.getContext(), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    VP.setDoors(d.mode === 'list' ? 'list' : d.mode, d.list);
    VP.setPose(pose); VP.forceCullNextTick(); VP.tick(1 / 30);
    const dusk = () => { if (DUSK !== null && DUSK !== undefined) { G.dusk = DUSK; G.extras.env?.update(G.dusk, G.camera.position, G.indoor); } };
    const still = () => { const ct = G.cullTimer; G.cullTimer = 1e9; VP.tick(0); G.cullTimer = ct; dusk(); };
    dusk();
    const ga = w.glassApertures; if (!ga) return { room: w.hereRoom, glass: false, px: [] };
    const regs = w.regions.filter((r) => r.win);
    const hidden = new Set(); for (const r of regs) r.meshes.forEach((m, i) => { if (r.on && !r.meshOn[i]) hidden.add(m); });
    // tree instances the wedge hides: compare instance visibility with glassShows off
    const batches = []; w.scene.traverse((o) => { if (o.isBatchedMesh && o.userData.vegPart === 'trees') batches.push(o); });
    const cand = batches.map((b) => { const s = []; for (let i = 0; i < (b.instanceCount ?? 0); i++) s.push(b.getVisibleAt(i)); return s; });
    const meshesAll = (all) => { for (const r of regs) r.meshes.forEach((m, i) => { const v = all ? r.on : r.meshOn[i]; m.visible = v; m.userData.regionOff = !v; }); };
    const glass = (on) => { w.glassApertures = on ? ga : null; w.outdoorWindowsVersion++; still(); };
    const a = new Uint8Array(W * H * 4), b = new Uint8Array(W * H * 4);
    const draw = (buf) => { VP.renderFrame(); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf); };
    meshesAll(true); glass(false); draw(b);
    const hiddenInst = batches.map((bt, j) => { const s = new Set(); for (let i = 0; i < cand[j].length; i++) if (!cand[j][i] && bt.getVisibleAt(i)) s.add(i); return s; });
    meshesAll(false); glass(true); draw(a);
    meshesAll(true); glass(false); // ray-cast in the reference state
    const px = []; for (let i = 0, q = 0; i < a.length; i += 4, q++) if (Math.abs(a[i] - b[i]) > 6 || Math.abs(a[i + 1] - b[i + 1]) > 6 || Math.abs(a[i + 2] - b[i + 2]) > 6) px.push([q % W, H - 1 - Math.floor(q / W)]);
    const meshes = []; w.scene.traverse((o) => { if (o.isMesh || o.isBatchedMesh) meshes.push(o); });
    const vis = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    const culled = (h) => hidden.has(h.object) || (h.object.isBatchedMesh && hiddenInst[batches.indexOf(h.object)]?.has(h.batchId));
    const chunkOf = (o) => { for (let p = o; p; p = p.parent) if (p.userData?.chunk) return p.userData.chunk; return o.userData?.vegPart ?? null; };
    const rc = G.raycaster; rc.far = 400;
    const ray = (sx, sy) => {
      rc.setFromCamera({ x: sx / W * 2 - 1, y: -(sy / H * 2 - 1) }, G.camera);
      const hits = rc.intersectObjects(meshes.filter(vis), false);
      const iC = hits.findIndex(culled);
      const before = (iC < 0 ? hits : hits.slice(0, iC)).filter((h) => !h.object.material?.transparent);
      const first = before[0] ?? hits[iC];
      return { kind: iC < 0 ? 'none' : before.length ? 'bleed' : 'visible', first: first ? { chunk: chunkOf(first.object), d: +first.distance.toFixed(2) } : null, culled: iC >= 0 ? { chunk: chunkOf(hits[iC].object), d: +hits[iC].distance.toFixed(2) } : null };
    };
    const cls = px.map(([x, y]) => {
      const rs = [[0.5, 0.5], [0.05, 0.05], [0.95, 0.05], [0.05, 0.95], [0.95, 0.95]].map(([u, v]) => ray(x + u, y + v));
      const kind = rs.some((q) => q.kind === 'visible') ? 'VISIBLE' : rs.some((q) => q.kind === 'bleed') ? 'bleed-through' : 'edge / ordering';
      return { x, y, kind, first: (rs.find((q) => q.kind !== 'none') ?? rs[0]).first, culled: (rs.find((q) => q.culled) ?? rs[0]).culled };
    });
    meshesAll(false); glass(true);
    return { room: w.hereRoom, glass: true, hiddenMeshes: hidden.size, hiddenTrees: hiddenInst.reduce((s, x) => s + x.size, 0), px: cls };
  }, { pose: f.pose, d: DOOR_SETS[f.doors], DUSK: f.dusk })) });
  const last = out[out.length - 1], kinds = {}; for (const p of last.px) kinds[p.kind] = (kinds[p.kind] || 0) + 1;
  console.log(`${f.tag ?? ''}${f.path} ${f.doors} ${f.mode} k=${f.k} n=${f.n} ${last.room} glass=${last.glass} ${JSON.stringify(kinds)}`);
}
if (process.env.DUMP) console.log(JSON.stringify(out.map((f) => ({ k: f.k, path: f.path, px: f.px }))));
console.log(JSON.stringify(out.flatMap((f) => f.px.filter((p) => p.kind === 'VISIBLE').map((p) => ({ path: f.path, doors: f.doors, k: f.k, ...p })))));
await browser.close();
