// PERF-R02 current-production attribution: per-group triangles at the same poses across production checkpoints, and
// which merge added what. usage: node scripts/perf/attribution-steps.mjs label=file.json ...  (in history order)
import { readFileSync } from 'node:fs';
import { group, GROUPS } from './attribution-table.mjs';
const steps = process.argv.slice(2).map((a) => { const [label, f] = a.split('='); return { label, J: JSON.parse(readFileSync(f, 'utf8')) }; });
const names = [...GROUPS.map(([n]) => n), 'other'];
const common = steps[0].J.poses.map((p) => p.name).filter((n) => steps.every(({ J }) => J.poses.some((q) => q.name === n)));
for (const pose of common) {
  const rows = steps.map(({ label, J }) => { const p = J.poses.find((q) => q.name === pose), m = {}; for (const e of p.by) m[group(e.k)] = (m[group(e.k)] ?? 0) + e.triangles; return { label, tris: p.tris, calls: p.calls, build: J.meta?.build, m }; });
  const used = names.filter((n) => rows.some((r) => r.m[n]));
  console.log(`\n### ${pose}: triangles per group at each checkpoint (Δ = change from the previous checkpoint)\n`);
  console.log(`| checkpoint | total | calls | ${used.join(' | ')} |`);
  console.log(`|---|---:|---:|${used.map(() => '---:').join('|')}|`);
  rows.forEach((r, j) => { const prev = rows[j - 1]; console.log(`| ${r.label} | ${r.tris.toLocaleString('en')}${prev ? ` (${r.tris - prev.tris >= 0 ? '+' : ''}${(r.tris - prev.tris).toLocaleString('en')})` : ''} | ${r.calls} | ${used.map((n) => { const v = r.m[n] ?? 0, d = prev ? v - (prev.m[n] ?? 0) : 0; return `${v.toLocaleString('en')}${prev && d ? ` (${d > 0 ? '+' : ''}${d.toLocaleString('en')})` : ''}`; }).join(' | ')} |`); });
}
