// Repeatable renderer measurements for the BOSLUST exterior sample (art-refresh step 3, consolidation pass).
// Same settings as scripts/art-capture.mjs: 844×390, DPR 1, quality "low" (phone default, no shadow maps), HUD
// hidden, fresh estate state per pose (reload), 1.5 s settle, then max over 30 real frames.
//
// Usage: node scripts/ext-measure.mjs "<query>" [label] [baseUrl]
//   query  e.g. "ext=sample&light=sample"  or  "ext=sample&light=sample&multidraw=0" (forced fallback)
// Prints one JSON line per pose and a summary table. Renderer measurements (calls, triangles, drawn instances,
// memory counters) are read from the running renderer; nothing here is estimated from source.
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const QUERY = process.argv[2] ?? 'ext=sample&light=sample';
const LABEL = process.argv[3] ?? (QUERY || 'baseline');
const BASE = process.argv[4] ?? 'http://localhost:4173/Feh-Lu-We/';
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const ESS = ['invitation', 'torch', 'matches', 'notebook', 'frontKey'];
// the five measured views (stand, look-at); fork/door/reverse/approach are the capture poses 13/15/31/30
const POSES = [
  ['fork', { x: 51.0, z: 7.2 }, [63.0, 2.0, 16.0]],
  ['approach', { x: 58.6, z: 9.6 }, [63.2, 1.8, 18.0]],
  ['door', { x: 63, z: 15.4 }, [63, 1.4, 18.2]],
  ['reverse', { x: 63, z: 16.4 }, [55.0, 1.4, 6.0]],
  ['busy', { x: 47.5, z: 5.2 }, [60.0, 3.5, 22.0]],
];
const ONLY = process.env.ONLY?.split(',');

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
const rows = [];
for (const [name, stand, target] of POSES.filter(([n]) => !ONLY || ONLY.includes(n))) {
  await page.goto(BASE + '?autotest=1' + (QUERY ? '&' + QUERY : ''));
  await page.evaluate(([save]) => {
    localStorage.setItem('fehluwe.save', JSON.stringify(save));
    localStorage.setItem('fehluwe.settings', JSON.stringify({ quality: 'low' }));
  }, [{ version: 4, scene: 'estate', inventory: ESS, flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true }, player: { home: null, estate: { x: stand.x, y: 0.15, z: stand.z, yaw: 0, pitch: 0 } } }]);
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 60000 });
  await page.evaluate(helpers);
  await page.evaluate((t) => {
    if (window.T.modalOpen()) window.T.closeModal();
    window.T.tick(15); window.T.lookAt(t[0], t[1], t[2]); window.T.tick(10);
    for (const id of ['toast', 'hud', 'stick']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
  }, target);
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => new Promise((res) => {
    const g = window.__game, c = [], t = [];
    const f = () => { c.push(g.renderer.info.render.calls); t.push(g.renderer.info.render.triangles); if (c.length < 30) requestAnimationFrame(f); else res({ calls: Math.max(...c), callsMin: Math.min(...c), triangles: Math.max(...t) }); };
    requestAnimationFrame(f);
  }));
  // what the last frame actually drew of the sample vegetation, per part (renderer state, after culling)
  const veg = await page.evaluate(() => {
    const g = window.__game, gl = g.renderer.getContext();
    const tris = (geo) => (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
    const parts = {};
    const add = (k, calls, inst, t) => { const p = (parts[k] ??= { calls: 0, instances: 0, triangles: 0, objects: 0 }); p.calls += calls; p.instances += inst; p.triangles += t; p.objects++; };
    g.world.scene.traverse((o) => {
      const k = o.userData.vegPart ?? (o.userData.understory ? 'plants' : o.userData.part);
      if (!k || !o.visible) return;
      if (o.isBatchedMesh) { let t = 0; for (let i = 0; i < o._multiDrawCount; i++) t += o._multiDrawCounts[i] / 3; add(k, o._multiDrawCount ? 1 : 0, o._multiDrawCount, t); }
      else if (o.isInstancedMesh) { if (o.count) add(k, 1, o.count, o.count * tris(o.geometry)); }
    });
    // memory: unique geometry buffers in the scene (incl. instance buffers), uploaded textures
    const geos = new Set(), texs = new Set(); let geoBytes = 0, vegBytes = 0, texPx = 0;
    g.world.scene.traverse((o) => {
      const isVeg = !!(o.userData.vegPart || o.userData.understory || o.userData.artTrees);
      if (o.geometry && !geos.has(o.geometry)) {
        geos.add(o.geometry);
        let b = 0; for (const a of Object.values(o.geometry.attributes)) b += a.array.byteLength; if (o.geometry.index) b += o.geometry.index.array.byteLength;
        if (o.isInstancedMesh) b += o.instanceMatrix.array.byteLength + (o.instanceColor?.array.byteLength ?? 0);
        if (o.isBatchedMesh) b += (o._matricesTexture?.image.data.byteLength ?? 0) + (o._colorsTexture?.image.data.byteLength ?? 0) + (o._indirectTexture?.image.data.byteLength ?? 0);
        geoBytes += b; if (isVeg) vegBytes += b;
      }
      for (const mm of [].concat(o.material ?? [])) for (const v of Object.values(mm)) if (v && v.isTexture && !texs.has(v)) { texs.add(v); const im = v.image; if (im?.width) texPx += im.width * im.height; }
    });
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      parts,
      stats: g.world.scene.userData.vegStats?.() ?? null,
      caps: {
        path: g.world.scene.userData.vegPath ?? 'n/a',
        multiDraw: g.renderer.extensions.has('WEBGL_multi_draw'),
        webgl2: g.renderer.capabilities.isWebGL2,
        renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      },
      memory: { geometries: g.renderer.info.memory.geometries, textures: g.renderer.info.memory.textures, sceneGeoMB: +(geoBytes / 1048576).toFixed(2), vegGeoMB: +(vegBytes / 1048576).toFixed(2), sceneTexMPx: +(texPx / 1e6).toFixed(3) },
    };
  });
  const row = { pose: name, ...m, ...veg };
  rows.push(row);
  console.log(JSON.stringify(row));
}
mkdirSync('scripts/out/measure', { recursive: true });
writeFileSync(`scripts/out/measure/${LABEL.replace(/[^\w.-]+/g, '_')}.json`, JSON.stringify({ query: QUERY, rows }, null, 2));
console.log(`\n${LABEL}  (${rows[0]?.caps.path}, multi_draw ${rows[0]?.caps.multiDraw})`);
console.log('pose      calls  triangles  veg calls  veg tris trees / plants   trees n/m/f in view      bushes n/m/f in view');
for (const r of rows) {
  const p = r.parts, vc = Object.values(p).reduce((s, q) => s + q.calls, 0);
  const vt = ['trees', 'plants'].map((k) => p[k] ? Math.round(p[k].triangles / 100) / 10 + 'k' : '-').join(' / ');
  const s = r.stats, nf = (o) => (o ? `${o.nearInView}/${o.midInView ?? '-'}/${o.farInView}` : '-');
  console.log(`${r.pose.padEnd(9)} ${String(r.calls).padStart(5)}  ${String(r.triangles).padStart(9)}  ${String(vc).padStart(9)}  ${vt.padEnd(17)}  ${nf(s?.trees).padEnd(23)}  ${nf(s?.bushes)}`);
}
console.log(problems.length ? problems.join('\n') : 'no page errors');
await browser.close();
