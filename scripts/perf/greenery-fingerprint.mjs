// PERF-R03-A: proof that re-owning the exterior greenery changed no geometry. Fingerprints every mesh of the manor
// shell chunk, the wall climbers' chunk and the front hedges: vertex count and the sums of positions, normals and vertex
// colours, in total and per chunk. A pure re-partition (the climbers moved out of 'manor') keeps the total identical.
// usage: node scripts/perf/greenery-fingerprint.mjs <baseUrl> [<baseUrl> ...]
import { openEstate } from './visibility-harness.mjs';
const out = [];
for (const base of process.argv.slice(2)) {
  const { browser, page } = await openEstate(base);
  out.push(await page.evaluate(() => {
    const chunks = ['manor', 'extGreen.climbers', 'frontHedge.left', 'frontHedge.right'], per = {}, total = { meshes: 0, verts: 0, pos: 0, nrm: 0, col: 0 };
    window.__game.world.scene.traverse((o) => {
      const ch = o.userData?.chunk;
      if (!o.isMesh || !chunks.includes(ch)) return;
      const g = o.geometry, s = (a) => { let t = 0; if (a) for (let i = 0; i < a.array.length; i++) t += a.array[i] * ((i % 7) + 1); return t; };
      const e = (per[ch] ??= { meshes: 0, verts: 0, pos: 0, nrm: 0, col: 0 });
      for (const t of [e, total]) { t.meshes++; t.verts += g.attributes.position.count; t.pos += s(g.attributes.position); t.nrm += s(g.attributes.normal); t.col += s(g.attributes.color); }
    });
    const r = (v) => +v.toFixed(3);
    for (const t of [total, ...Object.values(per)]) for (const k of ['pos', 'nrm', 'col']) t[k] = r(t[k]);
    return { build: VP.meta().build, total, per };
  }));
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
