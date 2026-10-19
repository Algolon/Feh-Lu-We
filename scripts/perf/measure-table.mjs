// Matched-measurement table: one row per (path, doors, mode, build) present in every listed measurement file of the
// visibility harness (scripts/perf/visibility-harness.mjs), in the order of the first file.
// usage: node scripts/perf/measure-table.mjs <name>=<measure.json> [<name>=<measure.json> ...] > table.md
import { readFileSync } from 'node:fs';
const builds = process.argv.slice(2).map((a) => { const [n, f] = a.split('='); return { n, runs: JSON.parse(readFileSync(f, 'utf8')).runs }; });
const key = (r) => `${r.path}|${r.doors}|${r.mode}@${r.fps}`;
const fmt = (v) => v.toLocaleString('en-US');
const pct = (k, n) => `${k} (${Math.round((100 * k) / n)} %)`;
console.log('| path | doors | mode | build | frames | median | p95 | p99 | max | calls max | > 750 k | > 150 calls | cull ms med / p95 |');
console.log('|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
const order = ['closed', 'partial', 'open'];
const keys = builds[0].runs.map(key).filter((k) => builds.every((b) => b.runs.some((r) => key(r) === k)));
keys.sort((a, b) => { const [pa, da, ma] = a.split('|'), [pb, db, mb] = b.split('|'); return pa.localeCompare(pb) || order.indexOf(da) - order.indexOf(db) || ma.localeCompare(mb); });
for (const k of keys) for (const b of builds) {
  const r = b.runs.find((x) => key(x) === k), s = r.summary, t = s.triangles;
  console.log(`| ${r.path} | ${r.doors} | ${r.mode}@${r.fps} | ${b.n} | ${s.frames} | ${fmt(t.median)} | ${fmt(t.p95)} | ${fmt(t.p99)} | ${fmt(t.max)} | ${s.calls.max} | ${pct(s.over750k, s.frames)} | ${pct(s.over150calls, s.frames)} | ${s.cullMs ? `${s.cullMs.median.toFixed(2)} / ${s.cullMs.p95.toFixed(2)}` : '-'} |`);
}
