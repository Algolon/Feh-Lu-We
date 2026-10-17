// PERF-R02 current-production comparison: one table per path × door state × mode from harness result files.
// usage: node scripts/perf/consolidate.mjs H=a.json,b.json P=p.json C=c.json   (several files per build allowed)
import { readFileSync } from 'node:fs';
const builds = process.argv.slice(2).map((a) => { const [n, fs] = a.split('='); return { n, runs: fs.split(',').flatMap((f) => JSON.parse(readFileSync(f, 'utf8')).runs) }; });
const key = (r) => `${r.path}|${r.doors}|${r.mode}@${r.fps ?? 30}`;
const order = ['closed', 'partial', 'open'], paths = (process.env.PATHS ?? 'hall,stair,well,up-west').split(',');
const modes = (process.env.MODES ?? 'A,B').split(',');
const keys = [...new Set(builds.flatMap((b) => b.runs.map(key)))].filter((k) => paths.includes(k.split('|')[0]) && modes.includes(k.split('|')[2].split('@')[0]))
  .sort((a, b) => { const [pa, da, ma] = a.split('|'), [pb, db, mb] = b.split('|'); return paths.indexOf(pa) - paths.indexOf(pb) || order.indexOf(da) - order.indexOf(db) || ma.localeCompare(mb); });
const pct = (n, d) => `${n} (${Math.round((100 * n) / d)} %)`;
console.log('| path | doors | mode | build | frames | median | p95 | p99 | max | calls max | > 750 k | > 150 calls |');
console.log('|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const k of keys) {
  const [p, d, m] = k.split('|');
  for (const b of builds) {
    const r = b.runs.find((q) => key(q) === k); if (!r) continue;
    const s = r.summary;
    console.log(`| ${p} | ${d} | ${m} | ${b.n} | ${s.frames} | ${s.triangles.median.toLocaleString('en')} | ${s.triangles.p95.toLocaleString('en')} | ${s.triangles.p99.toLocaleString('en')} | ${s.triangles.max.toLocaleString('en')} | ${s.calls.max} | ${pct(s.over750k, s.frames)} | ${pct(s.over150calls, s.frames)} |`);
  }
}
