// PERF-R02 current-production attribution: group pose-breakdown categories into estate systems and compare builds at
// the same poses. usage: node scripts/perf/attribution-table.mjs H.json P.json C.json  (any number; first = reference)
import { readFileSync } from 'node:fs';
export const GROUPS = [
  ['shell & structure (manor, mIn)', (k) => /^chunk:(manor|mIn)$/.test(k)],
  ['hall & central ground floor (mHall, mLiv, mBil)', (k) => /^chunk:(mHall|mLiv|mBil)$/.test(k)],
  ['library & gallery (mLib)', (k) => k === 'chunk:mLib'],
  ['study / botanic / linen (mUpE)', (k) => k === 'chunk:mUpE'],
  ['upper floor & D3 rooms (mUp, mUpR, mUpS, mUpG)', (k) => /^chunk:mUp[RSG]?$/.test(k)],
  ['service wing (mWing, mServ)', (k) => /^chunk:(mWing|mServ)$/.test(k)],
  ['attic (mAttic)', (k) => k === 'chunk:mAttic'],
  ['basement (mB)', (k) => k === 'chunk:mB'],
  ['indoor plants (green.*)', (k) => /^chunk:green\./.test(k)],
  ['front hedges', (k) => /^chunk:frontHedge/.test(k)],
  ['exterior vegetation batches (veg:*)', (k) => /^veg:/.test(k)],
  ['grounds, woodland, terrain (forest, grounds, outdoor, …)', (k) => /^(chunk|region):(forest|grounds|ground|paths|wall|fence|garden|outdoor|hills)/.test(k)],
  ['conservatory & glass (cons, glass)', (k) => /^chunk:(cons|glass)/.test(k)],
];
export const group = (k) => (GROUPS.find(([, f]) => f(k)) ?? ['other'])[0];
const files = process.argv.slice(2);
if (files.length) {
  const builds = files.map((f) => JSON.parse(readFileSync(f, 'utf8')));
  const names = files.map((f) => f.replace(/.*-([A-Z])\.json$/, '$1'));
  for (let i = 0; i < builds[0].poses.length; i++) {
    const ps = builds.map((b) => b.poses[i]);
    console.log(`\n### ${ps[0].name} (${ps[0].doors})  ` + ps.map((p, j) => `${names[j]}: ${p.tris.toLocaleString('en')} tris / ${p.calls} calls${p.reconciled ? '' : ' (NOT reconciled)'}`).join(' · '));
    const g = ps.map((p) => { const m = {}; for (const e of p.by) { const k = group(e.k); (m[k] ??= { t: 0, c: 0, px: 0, tested: 0 }); m[k].t += e.triangles; m[k].c += e.calls; if (e.visiblePx !== undefined) { m[k].px += e.visiblePx; m[k].tested += e.triangles; } } return m; });
    const keys = [...new Set(g.flatMap((m) => Object.keys(m)))].sort((a, b) => (g.at(-2)?.[b]?.t ?? 0) - (g.at(-2)?.[a]?.t ?? 0));
    console.log(`| group | ${names.map((n) => `${n} tris / calls`).join(' | ')} | ${names.slice(1).map((n) => `Δ ${n}−${names[0]}`).join(' | ')} | visible px (${names.map((n) => n).join(' / ')}) |`);
    console.log(`|---|${names.map(() => '---:').join('|')}|${names.slice(1).map(() => '---:').join('|')}|---|`);
    for (const k of keys) console.log(`| ${k} | ${g.map((m) => m[k] ? `${m[k].t.toLocaleString('en')} / ${m[k].c}` : '–').join(' | ')} | ${g.slice(1).map((m) => ((m[k]?.t ?? 0) - (g[0][k]?.t ?? 0)).toLocaleString('en')).join(' | ')} | ${g.map((m) => m[k]?.tested ? m[k].px : '·').join(' / ')} |`);
  }
}
