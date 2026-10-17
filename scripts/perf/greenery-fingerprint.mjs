// PERF-R03-A: proof that re-owning the exterior greenery changed no geometry. Fingerprints every mesh of the manor
// shell chunk, the wall climbers' chunk and the front hedges: vertex count and the sums of positions, normals and vertex
// colours, in total and per chunk, plus an order-independent hash of every vertex (position, normal, colour rounded to
// 1e-4): a pure re-partition (the climbers moved out of 'manor') keeps the totals identical, any changed vertex does not.
// usage: node scripts/perf/greenery-fingerprint.mjs <baseUrl> [<baseUrl> ...]
import { openEstate } from './visibility-harness.mjs';
const out = [];
for (const base of process.argv.slice(2)) {
  const { browser, page } = await openEstate(base);
  out.push(await page.evaluate(() => {
    const chunks = ['manor', 'extGreen.climbers', 'frontHedge.left', 'frontHedge.right'], per = {}, total = { meshes: 0, verts: 0, pos: 0, nrm: 0, col: 0, vhash: 0 };
    window.__game.world.scene.traverse((o) => {
      const ch = o.userData?.chunk;
      if (!o.isMesh || !chunks.includes(ch)) return;
      const g = o.geometry, s = (a) => { let t = 0; if (a) for (let i = 0; i < a.array.length; i++) t += a.array[i]; return t; };
      const P = g.attributes.position, N = g.attributes.normal, C = g.attributes.color, q = (v) => Math.round(v * 1e4);
      let vh = 0; // sum over vertices of a 32-bit hash of the rounded tuple (order-independent)
      for (let i = 0; i < P.count; i++) {
        let h = 2166136261;
        for (const v of [P.getX(i), P.getY(i), P.getZ(i), N ? N.getX(i) : 0, N ? N.getY(i) : 0, N ? N.getZ(i) : 0, C ? C.getX(i) : 0, C ? C.getY(i) : 0, C ? C.getZ(i) : 0]) { h ^= q(v); h = Math.imul(h, 16777619) >>> 0; }
        vh = (vh + h) % 4294967296;
      }
      const e = (per[ch] ??= { meshes: 0, verts: 0, pos: 0, nrm: 0, col: 0, vhash: 0 });
      for (const t of [e, total]) { t.meshes++; t.verts += P.count; t.pos += s(P); t.nrm += s(N); t.col += s(C); t.vhash = (t.vhash + vh) % 4294967296; }
    });
    const r = (v) => +v.toFixed(3);
    for (const t of [total, ...Object.values(per)]) for (const k of ['pos', 'nrm', 'col']) t[k] = r(t[k]);
    return { build: VP.meta().build, total, per };
  }));
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
