// PERF-R03-A evidence sheet: at chosen poses on R, render the frame with the new rule (candidate) and with the climbers
// and hedges forced on (the previous rule), report which groups the rule draws, triangles and changed pixels, and save
// both images. usage: node scripts/perf/greenery-sheet.mjs <baseUrl> <outDir> '<json poses>'
import { mkdirSync, writeFileSync } from 'node:fs';
import { openEstate } from './visibility-harness.mjs';
import { DOOR_SETS } from './visibility-paths.mjs';
const [base, outDir, posesJson] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const { browser, page } = await openEstate(base);
const rows = [];
for (const p of JSON.parse(posesJson)) {
  const d = DOOR_SETS[p.doors];
  const r = await page.evaluate(({ p, d }) => {
    const G = window.__game, w = G.world, chunks = ['extGreen.climbers', 'frontHedge.left', 'frontHedge.right'];
    VP.setDoors(d.mode === 'list' ? 'list' : d.mode, d.list); VP.setPose(p); VP.forceCullNextTick(); for (let i = 0; i < 10; i++) VP.tick(1 / 30); VP.forceCullNextTick(); VP.tick(1 / 30);
    if (p.dusk !== undefined) { G.dusk = p.dusk; G.extras.env?.update(G.dusk, G.camera.position, G.indoor); }
    const regs = w.regions.filter((g) => g.ext && g.meshes.some((m) => chunks.includes(m.userData.chunk)));
    const on = Object.fromEntries(regs.map((g) => [g.meshes[0].userData.chunk, g.on]));
    const gl = G.renderer.getContext(), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, a = new Uint8Array(W * H * 4), b = new Uint8Array(W * H * 4);
    const f1 = VP.renderFrame(); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, a); const cand = G.renderer.domElement.toDataURL('image/png');
    const was = regs.map((g) => g.meshes.map((m) => m.visible)); for (const g of regs) for (const m of g.meshes) m.visible = true;
    const f2 = VP.renderFrame(); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, b); const ref = G.renderer.domElement.toDataURL('image/png');
    regs.forEach((g, i) => g.meshes.forEach((m, j) => { m.visible = was[i][j]; }));
    let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) > 6 || Math.abs(a[i + 1] - b[i + 1]) > 6 || Math.abs(a[i + 2] - b[i + 2]) > 6) n++;
    return { room: w.hereRoom, on, cand: { tris: f1.triangles, calls: f1.calls }, ref: { tris: f2.triangles, calls: f2.calls }, px: n, img: { cand, ref } };
  }, { p, d });
  for (const k of ['cand', 'ref']) writeFileSync(`${outDir}/${p.name}-${k}.png`, Buffer.from(r.img[k].split(',')[1], 'base64'));
  delete r.img; rows.push({ ...p, ...r }); console.log(JSON.stringify(rows[rows.length - 1]));
}
writeFileSync(`${outDir}/sheet.json`, JSON.stringify(rows, null, 1));
await browser.close();
