// PERF-R03-A: classify every pixel a culled exterior region would have changed. For each listed frame (pose from a
// visibility-lossless result) the frame is rendered with culling synchronized (Mode B) and again with the region
// forced on; every changed pixel is ray-cast: if the first surface along the ray is opaque geometry nearer than the
// region's own hit, the pixel is bleed-through (the region shows through a seam / gap); if the region is the first
// surface, or only glass lies in front of it, the pixel is visible content.
// usage: node scripts/perf/classify-diffs.mjs <baseUrl> <lossless.json> [regions=frontHedge.left,frontHedge.right]
import { readFileSync } from 'node:fs';
import { openEstate } from './visibility-harness.mjs';
import { ALL_PATHS, DOOR_SETS } from './visibility-paths.mjs';
const [base, file, regs = 'frontHedge.left,frontHedge.right,extGreen.climbers'] = process.argv.slice(2);
const want = regs.split(','), J = JSON.parse(readFileSync(file, 'utf8')), floorOf = Object.fromEntries(ALL_PATHS.map(([n, y]) => [n, y]));
// the stair path changes floor along its waypoints (its rows carry no height): it is not classified here
const skip = new Set(['stair', 'attic']);
const only = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const frames = J.runs.filter((r) => !skip.has(r.path)).flatMap((r) => r.diffs.filter((d) => !only || only.has(`${r.path}|${r.doors}|${d.k}`)).filter((d) => Object.keys(d.by).some((k) => want.includes(k))).map((d) => ({ doors: r.doors, path: r.path, mode: r.mode, k: d.k, pose: { x: d.x, y: floorOf[r.path] ?? 0.15, z: d.z, yaw: d.yaw, pitch: d.pitch }, by: Object.keys(d.by) })));
const { browser, page } = await openEstate(base);
const out = [];
for (const f of frames) {
  const d = DOOR_SETS[f.doors];
  out.push({ ...f, ...(await page.evaluate(({ pose, d, chunks }) => {
    const G = window.__game, w = G.world, r = G.renderer, gl = r.getContext(), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    VP.setDoors(d.mode === 'list' ? 'list' : d.mode, d.list);
    VP.setPose({ ...pose, y: pose.y }); VP.forceCullNextTick(); VP.tick(1 / 30);
    const regsOn = w.regions.filter((g) => g.ext && g.meshes.some((m) => chunks.includes(m.userData.chunk)));
    const ruleOn = regsOn.map((g) => g.on);
    const a = new Uint8Array(W * H * 4), b = new Uint8Array(W * H * 4);
    const draw = (buf) => { VP.renderFrame(); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, buf); };
    draw(a); for (const g of regsOn) for (const m of g.meshes) m.visible = true; draw(b); regsOn.forEach((g, i) => { for (const m of g.meshes) m.visible = ruleOn[i]; });
    const px = []; for (let i = 0, q = 0; i < a.length; i += 4, q++) if (Math.abs(a[i] - b[i]) > 6 || Math.abs(a[i + 1] - b[i + 1]) > 6 || Math.abs(a[i + 2] - b[i + 2]) > 6) px.push([q % W, H - 1 - Math.floor(q / W)]);
    const meshes = []; w.scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
    const vis = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    const chunkOf = (o) => { for (let p = o; p; p = p.parent) if (p.userData?.chunk) return p.userData.chunk; return null; };
    const rc = G.raycaster; rc.far = 300;
    // five rays per pixel (centre and corners): VISIBLE if any reaches the region with only glass in front of it,
    // bleed-through if every ray that reaches it passes opaque geometry first
    const ray = (sx, sy) => {
      rc.setFromCamera({ x: sx / W * 2 - 1, y: -(sy / H * 2 - 1) }, G.camera);
      const hits = rc.intersectObjects(meshes, false).filter((h) => vis(h.object) || chunks.includes(chunkOf(h.object)));
      const iReg = hits.findIndex((h) => chunks.includes(chunkOf(h.object)));
      const before = (iReg < 0 ? hits : hits.slice(0, iReg)).filter((h) => !h.object.material?.transparent);
      const first = before[0] ?? hits[iReg];
      return { kind: iReg < 0 ? 'none' : before.length ? 'bleed' : 'visible', first: first ? { chunk: chunkOf(first.object), d: +first.distance.toFixed(2), p: first.point.toArray().map((v) => +v.toFixed(2)) } : null, region: iReg >= 0 ? +hits[iReg].distance.toFixed(2) : null };
    };
    const cls = px.map(([x, y]) => {
      const rs = [[0.5, 0.5], [0.05, 0.05], [0.95, 0.05], [0.05, 0.95], [0.95, 0.95]].map(([u, v]) => ray(x + u, y + v));
      const kind = rs.some((q) => q.kind === 'visible') ? 'VISIBLE' : rs.some((q) => q.kind === 'bleed') ? 'bleed-through' : 'no region hit (edge / sub-pixel)';
      return { x, y, kind, first: (rs.find((q) => q.kind !== 'none') ?? rs[0]).first, region: (rs.find((q) => q.region !== null) ?? rs[0]).region };
    });
    return { room: w.hereRoom, ruleDrawsNow: ruleOn, px: cls };
  }, { pose: f.pose, d, chunks: want })) });
  const last = out[out.length - 1], kinds = {}; for (const p of last.px) kinds[p.kind] = (kinds[p.kind] || 0) + 1;
  console.log(`${f.path} ${f.doors} ${f.mode} k=${f.k} ${last.room} rule-now=${last.ruleDrawsNow} ${JSON.stringify(kinds)}`);
}
console.log(JSON.stringify(out.flatMap((f) => f.px.filter((p) => p.kind === 'VISIBLE').map((p) => ({ path: f.path, k: f.k, ...p })))));
await browser.close();
