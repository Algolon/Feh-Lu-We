// DEV-04D D3-b2 movement budget (non-functional tooling): camera draw calls / triangles sampled while moving along fixed
// player paths, not only from stationary views. Each path is a polyline at eye height, sampled every STEP metres with
// the camera along the direction of travel, plus an eight-way turn at every waypoint. Runs once with every door closed
// and once with every door open. Low quality (DPR 1, no shadows), so the counters are camera-only (PB01).
// Usage: node scripts/dev04d-walk-budget.mjs [baseUrl] [out.json]   (CHUNKS=a,b adds per-chunk reach; PATHS=a,b selects)
import { chromium } from 'playwright-core';
import { writeFileSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'walk-budget.json';
const STEP = +(process.env.STEP ?? 0.4);
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// [name, floor y, waypoints [x, z]] in plan coordinates (as the audit poses)
const PATHS = [
  ['up-west', 3.35, [[90, 99.5], [85.9, 95.0], [85.9, 90.2], [83.4, 90.2], [78.5, 90.6], [75.4, 89.6], [80.4, 92.6], [83.6, 90.4], [85.9, 90.2], [85.9, 82.2], [83.4, 82.2], [79.4, 82.4], [76.2, 83.0], [82.6, 84.0], [85.9, 82.2], [90, 82.2]]],
  ['up-east', 3.35, [[90, 100.2], [87.5, 103.0], [87.5, 105.0], [88.6, 107.4], [87.5, 103.0], [92.5, 98.6], [96.5, 97.3], [101.0, 97.3], [101.0, 99.6], [104.0, 100.8], [103.0, 104.5], [100.4, 103.6], [101.0, 99.6]]],
  ['hall', 0.15, [[90, 81.8], [90, 88.0], [89.5, 95.0], [90, 99.5]]],
  ['library', 0.15, [[84.0, 95.6], [78.0, 99.8], [74.2, 106.0], [80.0, 107.2], [83.4, 101.0]]],
];
const sel = process.env.PATHS ? new Set(process.env.PATHS.split(',')) : null;
const poses = (pts, y) => {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    for (let k = 0; k < 8; k++) out.push({ x, y, z, yaw: (k / 8) * Math.PI * 2, pitch: 0, turn: true });
    if (i === pts.length - 1) break;
    const [x1, z1] = pts[i + 1], L = Math.hypot(x1 - x, z1 - z), n = Math.max(1, Math.round(L / STEP)), yaw = Math.atan2(x1 - x, z1 - z);
    for (let s = 0; s < n; s++) out.push({ x: x + ((x1 - x) * s) / n, y, z: z + ((z1 - z) * s) / n, yaw, pitch: -0.04 });
  }
  return out;
};

const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: +(process.env.VW ?? 915), height: +(process.env.VH ?? 412) } })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
await page.goto(BASE + '?autotest=1');
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'consKey'], flags: { leftHome: true, basementOpen: true, boslustOpen: true } })));
await page.reload();
await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
await page.evaluate(helpers);
await page.evaluate(() => { const g = window.__game; g.settings.quality = 'low'; g.applyQuality(true); });
const stats = (a) => { const s = [...a].sort((p, q) => p - q); return { min: s[0], median: s[Math.floor(s.length / 2)], max: s[s.length - 1] }; };
const result = { commit: process.env.COMMIT ?? null, step: STEP, viewport: [+(process.env.VW ?? 915), +(process.env.VH ?? 412)], paths: {} };
for (const doors of ['closed', 'open']) {
  for (const [name, y, pts] of PATHS) {
    if (sel && !sel.has(name)) continue;
    const samples = await page.evaluate(({ ps, open, chunks }) => {
      const g = window.__game;
      for (const id of g.world.byId.keys()) if (id.startsWith('door.')) g.state.open[id] = open;
      g.world.syncAll();
      for (let i = 0; i < 45; i++) g.tick(1 / 30); // doors finish swinging
      const want = chunks ? new Set(chunks) : null;
      const rows = [];
      let drawn = {};
      if (want) g.world.scene.traverse((o) => { if (o.isMesh && want.has(o.userData?.chunk)) o.onBeforeRender = () => { const d = (drawn[o.userData.chunk] ??= { calls: 0, triangles: 0 }); d.calls++; d.triangles += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }; });
      for (const p of ps) {
        g.player.setPose(p); g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42);
        g.tick(1 / 30); g.tick(1 / 30);
        g.player.setPose(p); g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42);
        g.tick(1 / 30);
        drawn = {};
        g.renderer.render(g.world.scene, g.camera);
        const i = g.renderer.info.render;
        rows.push({ x: +p.x.toFixed(2), z: +p.z.toFixed(2), yaw: +p.yaw.toFixed(2), turn: !!p.turn, room: g.world.hereRoom, calls: i.calls, triangles: i.triangles, ...(want ? { chunks: drawn } : {}) });
      }
      return rows;
    }, { ps: poses(pts, y), open: doors === 'open', chunks: process.env.CHUNKS ? process.env.CHUNKS.split(',') : null });
    const key = `${name}/${doors}`, chunkStats = {};
    for (const ch of (process.env.CHUNKS ?? '').split(',').filter(Boolean)) chunkStats[ch] = { drawnIn: samples.filter((s) => s.chunks?.[ch]).length, triangles: stats(samples.map((s) => s.chunks?.[ch]?.triangles ?? 0)) };
    result.paths[key] = { samples: samples.length, calls: stats(samples.map((s) => s.calls)), triangles: stats(samples.map((s) => s.triangles)), chunks: chunkStats, rows: samples };
    const r = result.paths[key];
    console.log(`${key.padEnd(18)} n ${String(r.samples).padStart(3)}  calls ${r.calls.min}/${r.calls.median}/${r.calls.max}  tris ${r.triangles.min}/${r.triangles.median}/${r.triangles.max}  ${Object.entries(chunkStats).map(([k, v]) => `${k}:${v.drawnIn}× max ${v.triangles.max}`).join(' ')}`);
  }
}
result.problems = problems;
writeFileSync(OUT, JSON.stringify(result, null, 1));
await browser.close();
