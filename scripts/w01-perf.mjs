// DEV-04D W01 performance probe: matched production / candidate counters per ritual stage at mobile low quality
// (915 × 412, DPR 1, shadows off). Usage: node scripts/w01-perf.mjs baseUrl out.json [multidraw=0]
// Per stage and pose: camera draw calls + submitted triangles; geometry / texture objects and compiled programs; the
// clearing's visible transparent meshes with an estimated screen coverage (projected bounding sphere, an overdraw
// proxy, not a measured fill rate); pooled lights assigned; and the median ms per renderer.render() on SwiftShader
// (CPU rasteriser: a RELATIVE fill / shader cost between builds, never a device frame time).
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'w01-perf.json';
const QUERY = process.argv[4] === 'multidraw=0' ? '&multidraw=0' : '';
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 1 })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
await page.goto(BASE + '?autotest=1' + QUERY);
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['matches'], flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true } })));
await page.reload();
await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
const D = Math.PI / 180;
const POSES = { entrance: { x: 176.4, y: 1.2, z: 59.9, yaw: 145 * D, pitch: 0.12 }, figure: { x: 180.0, y: 1.2, z: 59.6, yaw: 180 * D, pitch: 0.16 } };
const STAGES = ['ready', 'ring', 'burn:4', 'burn:14', 'burn:32', 'burn:58', 'burn:72', 'charred', 'empty', 'refill:0.8'];
const res = await page.evaluate(async ({ POSES, STAGES }) => {
  const g = window.__game, w = g.world, DT = 1 / 30, gl = g.renderer.getContext(), THREE_V = g.camera.position.constructor;
  const tick = (s) => { for (let i = 0; i < Math.round(s / DT); i++) g.tick(DT); };
  const it = (id) => w.byId.get(id);
  const near = (x, z) => { g.player.setPose({ x, y: 1.2, z, yaw: 0, pitch: 0 }); g.player.y = w.col.supportHeight(x, z, 1.3, 0.42); g.tick(DT); };
  const reset = () => { g.select?.(null); g.carry?.(null); for (const k of Object.keys(g.state.lit)) if (k.startsWith('wicker.')) delete g.state.lit[k]; w.scene.userData.wickerSet?.reset?.(); w.syncAll(); tick(0.2); };
  const na = [];
  const run = (n, a) => {
    if (n === 'ready') return;
    if (n === 'ring') { near(177.2, 57.6); it('wicker.candles').useItem('matches'); tick(4.2); return; }
    if (n === 'burn') { run('ring'); near(177.6, 55.6); it('wicker.figure').useItem('matches'); tick(+a); return; }
    if (n === 'charred') { run('burn', 84); return; }
    if (n === 'empty') { run('charred'); near(177.6, 55.6); const f = it('wicker.figure'); if (/schoon/i.test(f.label() ?? '')) { f.run(); tick(2.4); } else na.push('clean'); return; }
    if (n === 'refill') { run('empty'); const b = it('wicker.bale'); if (!b) { na.push('bale'); return; } near(177.4, 52.6); b.run(); near(177.6, 55.6); it('wicker.figure').run(); tick(+a); }
  };
  g.settings.quality = 'low'; g.applyQuality(true);
  const out = { multiDraw: g.metrics().multiDraw, programs0: g.renderer.info.programs.length, rows: [] };
  for (const st of STAGES) {
    na.length = 0; reset();
    const [n, a] = st.split(':'); run(n, a);
    for (const [pk, p] of Object.entries(POSES)) {
      g.player.setPose(p); g.player.y = w.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42); g.dusk = 0;
      for (let k = 0; k < 6; k++) { g.player.setPose(p); g.player.y = w.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42); g.tick(DT); } // 0.2 s: the culling cadence ran here
      await new Promise((r) => setTimeout(r, 50));
      g.renderer.render(w.scene, g.camera);
      const i = g.renderer.info;
      const row = { stage: st, pose: pk, calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs.length, lights: g.pool?.assigned?.().filter(Boolean).length ?? null, na: [...na] };
      // the clearing's visible transparent meshes and their estimated screen coverage (fraction of the viewport)
      const tr = []; const v = new THREE_V();
      w.scene.traverse((o) => {
        if (!o.isMesh || !o.material?.transparent) return;
        let vis = true; for (let q = o; q; q = q.parent) if (!q.visible) { vis = false; break; }
        if (!vis) return;
        const near = o.getWorldPosition(v); if (Math.hypot(near.x - 180, -near.z - 55) > 8) return;
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
        const s = o.geometry.boundingSphere, c = s.center.clone().applyMatrix4(o.matrixWorld), r = s.radius * o.matrixWorld.getMaxScaleOnAxis();
        const d = c.distanceTo(g.camera.position), f = 1 / Math.tan((g.camera.fov * Math.PI) / 360);
        const cov = d <= r ? 1 : Math.min(1, (Math.PI * (r / d * f) ** 2 / 4) / g.camera.aspect);
        tr.push({ key: o.material.customProgramCacheKey?.() ?? o.material.type, cov: +cov.toFixed(3) });
      });
      row.transparent = tr.length; row.transparentCoverage = +tr.reduce((s2, t) => s2 + t.cov, 0).toFixed(2); row.transparentList = tr;
      const px = new Uint8Array(4), ms = [];
      for (let k = 0; k < 9; k++) { const t0 = performance.now(); g.renderer.render(w.scene, g.camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); ms.push(performance.now() - t0); }
      ms.sort((x, y) => x - y); row.renderMsMedian = +ms[4].toFixed(1);
      out.rows.push(row);
    }
  }
  // reduced motion (burn 32, entrance): still informative, same counts
  reset(); g.settings.reducedMotion = true; run('burn', 32);
  const p = POSES.entrance; g.player.setPose(p); g.player.y = w.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42); g.tick(DT); g.renderer.render(w.scene, g.camera);
  out.reducedMotion = { calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles };
  g.settings.reducedMotion = false;
  out.programsEnd = g.renderer.info.programs.length;
  return out;
}, { POSES, STAGES });
res.base = BASE; res.query = QUERY; res.problems = problems;
writeFileSync(OUT, JSON.stringify(res, null, 2));
for (const r of res.rows) console.log(`${r.stage.padEnd(11)} ${r.pose.padEnd(9)} ${r.calls}/${r.triangles} tr ${r.transparent} cov ${r.transparentCoverage} ms ${r.renderMsMedian}${r.na.length ? ' n/a ' + r.na : ''}`);
await browser.close();
