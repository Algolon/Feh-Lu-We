// PERF-R02 release: attribute single poses (Mode B, every door open) by chunk / object for quick P-vs-C diagnosis.
// usage: node scripts/perf/pose-breakdown.mjs <baseUrl> '<json poses>' [doors=open]
import { openEstate } from './visibility-harness.mjs';
const [base, posesJson, doors = 'open'] = process.argv.slice(2);
const { browser, page } = await openEstate(base);
const out = await page.evaluate(({ poses, doors }) => {
  VP.setDoors(doors);
  return poses.map((p) => {
    VP.setPose(p); VP.forceCullNextTick(); VP.tick(1 / 30); VP.forceCullNextTick(); VP.tick(1 / 30);
    const f = VP.renderFrame({ breakdown: true });
    const top = Object.entries(f.by).sort((a, b) => b[1].triangles - a[1].triangles).slice(0, 14).map(([k, v]) => `${k} ${v.triangles}/${v.calls}`);
    return { p, room: VP.room(), calls: f.calls, tris: f.triangles, regions: VP.activeRegions().join(' '), top };
  });
}, { poses: JSON.parse(posesJson), doors });
console.log(JSON.stringify(out, null, 1));
await browser.close();
