// PERF-R03-B: summary table of window-lossless.mjs results (one row per run). A run missing from the first file is
// taken from the later ones (marked with their label): used for the earlier candidate, whose drawn set the final rule
// only extends, so its loss bounds the final rule's.
// usage: node scripts/perf/window-proof-table.mjs <label>=<window-lossless.json> [<label>=<window-lossless.json> ...]
import { readFileSync } from 'node:fs';
const files = process.argv.slice(2).map((a) => { const i = a.indexOf('='); return { label: a.slice(0, i), runs: JSON.parse(readFileSync(a.slice(i + 1), 'utf8')).runs }; });
const key = (r) => `${r.tag}|${r.path}|${r.doors}|${r.mode}`, seen = new Set(), rows = [];
for (const f of files) for (const r of f.runs) if (!seen.has(key(r))) { seen.add(key(r)); rows.push({ ...r, src: f.label }); }
const order = { closed: 0, partial: 1, open: 2 }, n = (v) => v.toLocaleString('en-US');
rows.sort((a, b) => (a.tag ?? '').localeCompare(b.tag ?? '') || a.mode.localeCompare(b.mode) || order[a.doors] - order[b.doors] || a.path.localeCompare(b.path));
console.log('| variant | mode | doors | path | frames | glass-only frames | avg saved tris | max saved tris | diff frames | max px | build |');
console.log('|---|---|---|---|---:|---:|---:|---:|---:|---:|---|');
for (const r of rows) console.log(`| ${r.tag ? r.tag.replace(/-$/, '') : 'day'} | ${r.mode}${r.mode === 'A' ? '@' + r.fps : ''} | ${r.doors} | ${r.path} | ${r.frames} | ${r.glassFrames} | ${n(r.avgSaved)} | ${n(r.maxSaved)} | ${r.diffs.length} | ${r.maxPx} | ${r.src} |`);
const all = rows.flatMap((r) => r.diffs), px = all.reduce((s, d) => s + d.n, 0);
console.log(`\nruns ${rows.length}, frames ${n(rows.reduce((s, r) => s + r.frames, 0))}, glass-only frames ${n(rows.reduce((s, r) => s + r.glassFrames, 0))}, frames with any changed pixel ${all.length} (${px} px in total, max ${Math.max(0, ...all.map((d) => d.n))} px in one frame)`);
