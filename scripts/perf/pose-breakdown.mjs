// PERF-R02 (current-production attribution): single poses, culling synchronized inside Game.tick (Mode B), each
// frame's camera submissions attributed per category (they sum to the renderer's own counters), plus a diagnostic
// visibility test of the largest categories: their drawn objects hidden for one render, changed pixels counted.
// usage: node scripts/perf/pose-breakdown.mjs <baseUrl> <poses.json> <out.json>
//   poses.json: [{ name, doors: 'open' | 'closed' | 'partial', x, y, z, yaw, pitch }]   env TOP=14 SHOT=1 (PNG per pose) TAG=P
//   FINE=1: categories split by drawn object and material (category | object name | material)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { openEstate } from './visibility-harness.mjs';
import { DOOR_SETS } from './visibility-paths.mjs';
const [base, posesFile, out] = process.argv.slice(2);
const poses = JSON.parse(readFileSync(posesFile, 'utf8')), TOP = +(process.env.TOP ?? 14);
const { browser, page, problems } = await openEstate(base);
const res = { base, meta: null, poses: [] };
for (const p of poses) {
  const d = DOOR_SETS[p.doors ?? 'open'];
  const r = await page.evaluate(({ p, d, TOP, shot, fine }) => {
    VP.setDoors(d.mode === 'list' ? 'list' : d.mode, d.list);
    VP.setPose(p); VP.forceCullNextTick(); for (let i = 0; i < 15; i++) VP.tick(1 / 30); // settle (eye height, LOD)
    VP.forceCullNextTick(); VP.tick(1 / 30);
    const f = VP.renderFrame({ breakdown: true, fine: fine });
    const by = Object.entries(f.by).sort((a, b) => b[1].triangles - a[1].triangles);
    const vis = VP.hideTest(by.slice(0, TOP).map(([k]) => k));
    const png = shot ? window.__game.renderer.domElement.toDataURL('image/png') : null;
    return { room: VP.room(), calls: f.calls, tris: f.triangles, unbatched: f.unbatched, regions: VP.activeRegions(), by: by.map(([k, v]) => ({ k, ...v, ...(vis[k] ? { visiblePx: vis[k].px, visiblePct: vis[k].pct, box: vis[k].box, objects: vis[k].objects } : {}) })), png };
  }, { p, d, TOP, shot: !!process.env.SHOT, fine: !!process.env.FINE });
  if (r.png) { mkdirSync(out.replace(/[^/]*$/, 'shots'), { recursive: true }); writeFileSync(out.replace(/[^/]*$/, `shots/${p.name}-${process.env.TAG ?? "x"}.png`), Buffer.from(r.png.split(',')[1], 'base64')); }
  delete r.png;
  const sum = r.by.reduce((a, e) => a + e.triangles, 0);
  res.poses.push({ ...p, ...r, reconciled: sum === r.unbatched.triangles && r.unbatched.triangles === r.tris });
  console.log(`${p.name.padEnd(22)} ${p.doors ?? 'open'}  ${r.room}  tris ${r.tris} calls ${r.calls}  (attributed ${sum}${sum === r.tris ? ' = total' : ' ≠ ' + r.tris})`);
  writeFileSync(out, JSON.stringify({ ...res, problems }, null, 1));
}
res.meta = await page.evaluate(() => VP.meta());
writeFileSync(out, JSON.stringify({ ...res, problems }, null, 1));
await browser.close();
