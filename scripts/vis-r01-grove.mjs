// VIS-R01AB: reproducible Mushroom Grove draw-distance / LOD measurement (baseline, variants, final).
// Serves a built `dist` folder, drives the real game (autopilot through collision, no teleports during walks),
// and records per frame: renderer calls/triangles, programs, every mushroom instance (category, LOD level, fade,
// submitted, in view, projected height, fog), and pop events (a mushroom in view in both frames whose presence or
// LOD changed). Works on production builds without the VIS-R01 diagnostics (generic InstancedMesh inspection).
//
//   DIST=dist TAG=final PARAMS="grovelod=b" MODE=views|walk|turn|still|toggle QUALITY=low VIEWPORT=landscape \
//   DUSK=0 MULTIDRAW=1 VIDEO=1 OUT=docs/vis-r01/evidence node scripts/vis-r01-grove.mjs
//
// SwiftShader timings are software-rasteriser wall times: never phone FPS.
import { createServer } from 'node:http';
import { resolve, extname, join } from 'node:path';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const env = process.env;
const DIST = env.DIST ?? 'dist', TAG = env.TAG ?? 'candidate', MODE = (env.MODE ?? 'views').split(',');
const OUT = env.OUT ?? 'docs/vis-r01/evidence', QUALITY = env.QUALITY ?? 'low', DUSK = +(env.DUSK ?? 0);
const VIEWPORTS = { landscape: { width: 915, height: 412 }, portrait: { width: 412, height: 915 }, desktop: { width: 1280, height: 720 } };
const VP = env.VIEWPORT ?? 'landscape', viewport = VIEWPORTS[VP];
const PARAMS = [env.PARAMS, env.MULTIDRAW === '0' ? 'multidraw=0' : ''].filter(Boolean).join('&');
const path = env.MULTIDRAW === '0' ? 'instanced' : 'multidraw';
const label = `${TAG}-${QUALITY}-${VP}-${DUSK ? 'dusk' : 'day'}-${path}`;
mkdirSync(OUT, { recursive: true });

const exeCandidates = [env.CHROME, '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', `${env.HOME}/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell`];
const exe = exeCandidates.find((p) => p && existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  try {
    const rel = decodeURIComponent(req.url.split('?')[0].replace(/^\/Feh-Lu-We\//, '')) || 'index.html';
    const file = resolve(DIST, rel);
    res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    res.end(readFileSync(file));
  } catch { res.statusCode = 404; res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/Feh-Lu-We/`;

const ctx = await browser.newContext({ viewport, hasTouch: VP !== 'desktop', isMobile: false });
const page = await ctx.newPage(), errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${base}?autotest=1${PARAMS ? '&' + PARAMS : ''}`);
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'], flags: { leftHome: true }, unlocked: ['lock.door.front'] })));
await page.reload(); await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
await page.evaluate(readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8'));

// ------------------------------------------------------------------------------------------------ page-side probe
await page.evaluate(({ quality, dusk }) => {
  const g = window.__game, w = g.world;
  g.running = false; g.settings.quality = quality; g.settings.reducedMotion = false; g.applyQuality(true);
  const env = g.extras.env;
  const C = { x: 179, z: 160 };
  const planes = Array.from({ length: 6 }, () => [0, 0, 0, 0]);
  const frustum = () => {
    const m = g.camera.projectionMatrix.clone().multiply(g.camera.matrixWorldInverse).elements;
    const row = (i) => [m[i], m[i + 4], m[i + 8], m[i + 12]];
    const r0 = row(0), r1 = row(1), r2 = row(2), r3 = row(3);
    const set = (p, s, r) => { for (let k = 0; k < 4; k++) p[k] = r3[k] + s * r[k]; const n = Math.hypot(p[0], p[1], p[2]); for (let k = 0; k < 4; k++) p[k] /= n; };
    set(planes[0], 1, r0); set(planes[1], -1, r0); set(planes[2], 1, r1); set(planes[3], -1, r1); set(planes[4], 1, r2); set(planes[5], -1, r2);
  };
  const inView = (x, y, z, r) => planes.every((p) => p[0] * x + p[1] * y + p[2] * z + p[3] > -r);
  const tri = (geo) => (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
  const root = w.scene.children.find((o) => o.name === 'Mushroom Grove');
  // Every mushroom instance with its world bounds, whether it is submitted (drawn) and its LOD/fade.
  function instances() {
    w.scene.updateMatrixWorld(true);
    if (w.scene.userData.groveSnapshot) return w.scene.userData.groveSnapshot();
    const out = [];
    for (const mesh of root.children) {
      if (!mesh.isInstancedMesh) continue;
      const cat = mesh.name.endsWith('hero') ? 'hero' : mesh.name.endsWith('young') ? 'nursery' : 'medium';
      const geo = mesh.geometry; if (!geo.boundingSphere) geo.computeBoundingSphere();
      const ms = mesh.boundingSphere ?? (mesh.computeBoundingSphere(), mesh.boundingSphere);
      const c = ms.center.clone().applyMatrix4(mesh.matrixWorld), mr = ms.radius * mesh.matrixWorld.getMaxScaleOnAxis();
      const submitted = root.visible && mesh.visible && (!mesh.frustumCulled || inView(c.x, c.y, c.z, mr));
      const m = mesh.matrixWorld.clone(), t = m.clone();
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, t); t.premultiply(m);
        const p = geo.boundingSphere.center.clone().applyMatrix4(t), r = geo.boundingSphere.radius * t.getMaxScaleOnAxis();
        out.push({ id: `${mesh.name}#${i}`, cat, level: 0, k: 1, drawn: submitted, x: p.x, y: p.y, z: p.z, r, tris: tri(geo) });
      }
    }
    return out;
  }
  function probe() {
    frustum();
    const cam = g.camera.position, fog = w.scene.fog, H = g.renderer.domElement.height;
    const tanH = Math.tan((g.camera.fov * Math.PI) / 360);
    const list = instances();
    const by = {}, onScreen = {}, tris = { hero: 0, medium: 0, nursery: 0 };
    let nearest = Infinity;
    const state = {};
    for (const it of list) {
      const d = Math.hypot(it.x - cam.x, it.y - cam.y, it.z - cam.z);
      nearest = Math.min(nearest, Math.hypot(it.x - cam.x, it.z - cam.z));
      const view = inView(it.x, it.y, it.z, it.r);
      const px = ((2 * it.r) / (2 * Math.max(0.1, d) * tanH)) * H;
      // three.js linear Fog is smoothstep(near, far, view depth); the Euclidean distance stands in for the depth
      const u = fog ? Math.min(1, Math.max(0, (d - fog.near) / (fog.far - fog.near))) : 0, f = u * u * (3 - 2 * u);
      const shown = it.drawn && it.k > 0;
      state[it.id] = { view, shown, level: it.level, k: it.k, px, fog: f, d, cat: it.cat };
      by[it.cat] ??= { total: 0, drawn: 0, levels: {} };
      by[it.cat].total++;
      if (shown) { by[it.cat].drawn++; by[it.cat].levels[it.level] = (by[it.cat].levels[it.level] ?? 0) + 1; if (!it.perInstanceCulling || view) tris[it.cat] += it.tris; }
      onScreen[it.cat] = (onScreen[it.cat] ?? 0) + (view && shown ? 1 : 0);
    }
    const info = g.renderer.info;
    const p = g.player;
    return {
      calls: info.render.calls, triangles: info.render.triangles, programs: info.programs?.length ?? 0,
      pos: { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), yaw: +p.yaw.toFixed(3), pitch: +p.pitch.toFixed(3) },
      centreDist: +Math.hypot(p.x - C.x, p.z - C.z).toFixed(2), nearestMushroom: +nearest.toFixed(2),
      fog: fog ? { near: +fog.near.toFixed(1), far: +fog.far.toFixed(1) } : null,
      groveSubmittedTris: tris, categories: by, onScreen,
      lights: (() => { let n = 0; w.scene.traverseVisible((o) => { if (o.isPointLight) n++; }); return n; })(),
      vegPath: w.scene.userData.vegPath, grovePath: w.scene.userData.grovePath ?? 'instanced-legacy', groveProfile: w.scene.userData.groveProfile?.id ?? 'production',
      state,
    };
  }
  function render() {
    const a = performance.now();
    g.player.applyCamera(g.camera);
    if (dusk !== null) { g.dusk = dusk; env.update(dusk, g.camera.position, g.world.hereRoom === 'out' ? 0 : 1); }
    g.mushroomVision.render(g.renderer, w.scene, g.camera, g.time, g.settings.reducedMotion, g.settings.mushroomDistortion, quality === 'high');
    const gl = g.renderer.getContext(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    return performance.now() - a;
  }
  function lookAtGrove() {
    const p = g.player, dx = C.x - p.x, dz = C.z - p.z, d = Math.hypot(dx, dz);
    p.yaw = Math.atan2(dx, dz);
    p.pitch = Math.atan2(w.col.ground(C.x, C.z) + 2.2 - (p.y + 1.65), Math.max(d, 1)) * (d > 6 ? 1 : 0);
  }
  // Occlusion-aware: pixels that change when only the mushroom meshes are left out of the frame (layers, so no
  // batch's own visibility bookkeeping can interfere and the light count stays the same).
  let buf = null;
  function mushroomPixels() {
    const gl = g.renderer.getContext(), W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
    const objs = w.scene.userData.groveSnapshot ? w.scene.children.filter((o) => o.name === 'Mushroom Grove instances') : root.children.filter((o) => o.isInstancedMesh);
    const read = () => { const a = new Uint8Array(W * H * 4); render(); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, a); return a; };
    const a = read();
    const masks = objs.map((o) => o.layers.mask); objs.forEach((o) => o.layers.disableAll());
    const b = read();
    objs.forEach((o, i) => { o.layers.mask = masks[i]; });
    let n = 0;
    for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 24) n++;
    render();
    return n;
  }
  window.VIS = { probe, render, lookAtGrove, mushroomPixels, C };
}, { quality: QUALITY, dusk: DUSK });

// The reproducible route into the grove (walkable routes of the layout) and its reverse.
// (91.5, 130.5) for the terrace-lantern junction (90, 128), which a lantern base blocks.
const ROUTE = [[48, 168], [79, 160], [90, 139], [91.5, 130.5], [94, 127], [124, 132], [149, 145], [166, 140], [172, 149], [178, 157], [179, 160], [181, 162]];
const DISTANCES = (env.DISTANCES ?? '120,100,80,65,55,30').split(',').map(Number);
// First point on the route (walking in) at each distance from the grove centre.
function routePoint(d) {
  for (let i = 0; i < ROUTE.length - 1; i++) {
    const [ax, az] = ROUTE[i], [bx, bz] = ROUTE[i + 1];
    for (let s = 0; s <= 200; s++) {
      const t = s / 200, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (Math.hypot(x - 179, z - 160) <= d) return [x, z];
    }
  }
  return ROUTE.at(-1);
}

const rows = { fogModel: 'smoothstep', label, tag: TAG, params: PARAMS, quality: QUALITY, viewport, dusk: DUSK, path, chrome: await browser.version(), ua: await page.evaluate(() => navigator.userAgent), modes: {} };
const summarize = (frames) => {
  const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return +(s[Math.min(s.length - 1, Math.floor(s.length * p))] ?? 0).toFixed(1); };
  return {
    frames: frames.length,
    calls: { min: Math.min(...frames.map((f) => f.calls)), max: Math.max(...frames.map((f) => f.calls)) },
    triangles: { min: Math.min(...frames.map((f) => f.triangles)), median: q(frames.map((f) => f.triangles), 0.5), max: Math.max(...frames.map((f) => f.triangles)) },
    swiftshaderMs: { median: q(frames.map((f) => f.ms), 0.5), p95: q(frames.map((f) => f.ms), 0.95), max: q(frames.map((f) => f.ms), 1) },
  };
};
// Pop events between consecutive probes: a mushroom in view in both frames whose presence or LOD changed.
function pops(prev, cur, at) {
  const ev = [];
  for (const id in cur.state) {
    const a = prev.state[id], b = cur.state[id];
    if (!a || !(a.view && b.view)) continue;
    if (a.shown !== b.shown) {
      const k = b.shown ? b.k : a.k; // size at which it appeared / vanished
      ev.push({ at, id, cat: b.cat, kind: b.shown ? 'appear' : 'vanish', d: +b.d.toFixed(1), px: +(b.px * k).toFixed(1), fog: +b.fog.toFixed(2), weight: +(b.px * k * (1 - b.fog)).toFixed(2) });
    } else if (a.shown && a.level !== b.level) ev.push({ at, id, cat: b.cat, kind: `lod${a.level}->${b.level}`, d: +b.d.toFixed(1), px: +b.px.toFixed(1), fog: +b.fog.toFixed(2), weight: +(b.px * (1 - b.fog)).toFixed(2) });
  }
  return ev;
}
const popSummary = (ev) => {
  const vis = ev.filter((e) => e.weight >= 2 && (e.kind === 'appear' || e.kind === 'vanish'));
  const lod = ev.filter((e) => e.kind.startsWith('lod'));
  return { events: ev.length, visiblePops: vis.length, maxPopWeight: Math.max(0, ...vis.map((e) => e.weight)), maxPopsInOneFrame: Math.max(0, ...Object.values(vis.reduce((m, e) => ((m[e.at] = (m[e.at] ?? 0) + 1), m), {}))), lodSwitches: lod.length, maxLodPx: Math.max(0, ...lod.map((e) => e.px)) };
};
const strip = ({ state, ...f }) => f;

async function shot(name) {
  const file = join(OUT, `${label}-${name}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 85, timeout: 120000 });
  return file;
}

// ------------------------------------------------------------------------------------------------ static views
if (MODE.includes('views')) {
  const views = [];
  for (const d of [...DISTANCES, ...(env.CENTRE === '0' ? [] : [0])]) {
    let [x, z] = d === 0 ? [181, 162] : routePoint(d);
    // A trunk right in front of the lens says nothing about the grove: step along the route (≤ 6 m) to a clear sight line.
    if (d) [x, z] = await page.evaluate(({ x, z, route }) => {
      const g = window.__game, C = window.VIS.C;
      const clear = (x, z) => { const d = Math.hypot(C.x - x, C.z - z); for (let s = 0.8; s < 8; s += 0.4) { const px = x + ((C.x - x) / d) * s, pz = z + ((C.z - z) / d) * s; if (g.world.col.overlaps(px, pz, g.world.col.ground(px, pz) + 0.2, 0.15, 1.6, 0.15)) return false; } return true; };
      if (clear(x, z)) return [x, z];
      for (let k = 1; k <= 12; k++) for (const s of [k * 0.5, -k * 0.5]) {
        let best = null, bd = Infinity; // nearest route vertex direction: shift along the segment holding (x, z)
        for (let i = 0; i < route.length - 1; i++) { const [ax, az] = route[i], [bx, bz] = route[i + 1], L = Math.hypot(bx - ax, bz - az), t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / (L * L))), dd = Math.hypot(ax + (bx - ax) * t - x, az + (bz - az) * t - z); if (dd < bd) { bd = dd; best = [(bx - ax) / L, (bz - az) / L]; } }
        const nx = x + best[0] * s, nz = z + best[1] * s;
        if (clear(nx, nz)) return [nx, nz];
      }
      return [x, z];
    }, { x, z, route: ROUTE });
    const r = await page.evaluate(async ({ x, z }) => {
      const g = window.__game; const y = g.world.col.ground(x, z);
      g.player.setPose({ x, y, z, yaw: 0, pitch: 0 }); window.VIS.lookAtGrove();
      for (let i = 0; i < 120; i++) { g.tick(1 / 30); window.VIS.lookAtGrove(); }
      for (let i = 0; i < 3; i++) window.VIS.render();
      const ms = []; for (let i = 0; i < 5; i++) ms.push(window.VIS.render());
      ms.sort((a, b) => a - b);
      const p = window.VIS.probe();
      return { ...p, ms: ms[2], mushroomPx: window.VIS.mushroomPixels(), overlap: g.world.col.overlaps(x, z, g.player.y, 0.3, 1.75, 0.42) };
    }, { x, z });
    const file = await shot(`d${String(d).padStart(3, '0')}`);
    const counts = Object.fromEntries(Object.entries(r.categories).map(([k, v]) => [k, `${v.drawn}/${v.total}`]));
    console.log(`${label} d=${d} calls=${r.calls} tris=${r.triangles} grove=${JSON.stringify(r.groveSubmittedTris)} drawn=${JSON.stringify(counts)} onScreen=${JSON.stringify(r.onScreen)} fog=${JSON.stringify(r.fog)} nearest=${r.nearestMushroom} lights=${r.lights} mushroomPx=${r.mushroomPx}`);
    views.push({ distance: d, file, ...strip(r) });
  }
  rows.modes.views = views;
}

// ------------------------------------------------------------------------------------------------ walk in and back
// In: forward along the route, looking at the grove. Out: walking backwards along the same route, still looking at it.
if (MODE.includes('walk')) {
  const video = env.VIDEO ? join(OUT, `.frames-${label}`) : null;
  if (video) { rmSync(video, { recursive: true, force: true }); mkdirSync(video, { recursive: true }); }
  const every = +(env.EVERY ?? 2), shotEvery = +(env.SHOT_EVERY ?? 4);
  await page.evaluate(({ start }) => { const g = window.__game; g.player.setPose({ x: start[0], y: g.world.col.ground(start[0], start[1]), z: start[1], yaw: 0, pitch: 0 }); window.VIS.lookAtGrove(); for (let i = 0; i < 60; i++) g.tick(1 / 30); }, { start: ROUTE[0] });
  const frames = [], events = [];
  let prev = null, n = 0, frameNo = 0;
  const t0 = Date.now();
  const legs = [...ROUTE.slice(1).map((p) => ['in', p]), ...ROUTE.slice(0, -1).reverse().map((p) => ['out', p])];
  for (const [leg, [tx, tz]] of legs) {
    for (let guard = 0; guard < 4000; guard++) {
      const wantPx = env.PX_EVERY !== '0' && n % +(env.PX_EVERY ?? 2) === 0;
      const step = await page.evaluate(({ tx, tz, every, wantPx }) => {
        const g = window.__game;
        g.autopilot = { x: tx, z: tz, run: false };
        for (let i = 0; i < every; i++) { window.VIS.lookAtGrove(); g.tick(1 / 30); }
        const done = Math.hypot(g.player.x - tx, g.player.z - tz) < 0.35;
        if (done) g.autopilot = null;
        window.VIS.lookAtGrove();
        const ms = window.VIS.render();
        return { done, ms, ...window.VIS.probe(), mushroomPx: wantPx ? window.VIS.mushroomPixels() : null };
      }, { tx, tz, every, wantPx });
      const f = { leg, i: n++, ...step };
      if (n % 25 === 0) appendFileSync(join(OUT, `${label}.progress`), `${n} ${leg} ${f.centreDist} m ${((Date.now() - t0) / 1000).toFixed(0)} s\n`);
      if (prev) events.push(...pops(prev, f, f.i).map((e) => ({ leg, ...e })));
      prev = f;
      frames.push(strip(f));
      if (video && n % (shotEvery / every) === 0) await page.screenshot({ path: join(video, `${String(frameNo++).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 80 });
      if (step.done) break;
      if (guard > 600) throw new Error(`walk stuck before (${tx}, ${tz}) at ${JSON.stringify(step.pos)}`);
    }
  }
  // largest frame-to-frame change of visible mushroom pixels (sampled frames, ~0.4 m apart), and where they first show
  const px = frames.filter((f) => f.mushroomPx !== null);
  const jumps = px.slice(1).map((f, i) => ({ leg: f.leg, centreDist: f.centreDist, from: px[i].mushroomPx, to: f.mushroomPx, delta: f.mushroomPx - px[i].mushroomPx }));
  jumps.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const first = (min) => px.find((f) => f.leg === 'in' && f.mushroomPx >= min)?.centreDist ?? null;
  const visibility = { firstVisible50px: first(50), firstVisible500px: first(500), largestJumps: jumps.slice(0, 5) };
  rows.modes.walk = { summary: summarize(frames), pops: popSummary(events), visibility, programsChanged: frames.filter((f, i) => i && f.programs !== frames[i - 1].programs).map((f) => ({ i: f.i, centreDist: f.centreDist, programs: f.programs, ms: f.ms })), events, frames };
  console.log(label, 'walk', JSON.stringify(rows.modes.walk.summary), JSON.stringify(rows.modes.walk.pops), 'program changes', rows.modes.walk.programsChanged.length, JSON.stringify(visibility));
  if (video) {
    const mp4 = join(OUT, `${label}-walk.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(env.FPS ?? 15), '-i', join(video, '%05d.jpg'), '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '28', mp4]);
    rows.modes.walk.video = mp4;
    if (!env.KEEP_FRAMES) rmSync(video, { recursive: true, force: true });
  }
}

// ------------------------------------------------------------------------------------------------ turning on the spot
if (MODE.includes('turn')) {
  const out = [];
  for (const d of (env.TURN ?? '55,65,80').split(',').map(Number)) {
    const [x, z] = routePoint(d);
    const res = await page.evaluate(({ x, z }) => {
      const g = window.__game, y = g.world.col.ground(x, z);
      g.player.setPose({ x, y, z, yaw: 0, pitch: 0 }); window.VIS.lookAtGrove();
      for (let i = 0; i < 60; i++) g.tick(1 / 30);
      const yaw0 = g.player.yaw, frames = [];
      for (let s = 0; s <= 72; s++) { g.player.yaw = yaw0 + (s / 72) * Math.PI * 2; g.tick(1 / 30); g.player.yaw = yaw0 + (s / 72) * Math.PI * 2; const ms = window.VIS.render(); frames.push({ ms, ...window.VIS.probe() }); }
      return frames;
    }, { x, z });
    const ev = []; for (let i = 1; i < res.length; i++) ev.push(...pops(res[i - 1], res[i], i));
    const r = { distance: d, summary: summarize(res), pops: popSummary(ev), events: ev };
    console.log(label, 'turn', d, JSON.stringify(r.summary.triangles), JSON.stringify(r.pops));
    out.push(r);
  }
  rows.modes.turn = out;
}

// ------------------------------------------------------------------------------------------------ standing still / oscillating at band edges
if (MODE.includes('still')) {
  const out = [];
  for (const d of (env.STILL ?? '24.5,25.5,54.5,55.5,64.5,65.5').split(',').map(Number)) {
    const [x, z] = routePoint(d);
    const res = await page.evaluate(({ x, z }) => {
      const g = window.__game, y = g.world.col.ground(x, z), frames = [];
      g.player.setPose({ x, y, z, yaw: 0, pitch: 0 }); window.VIS.lookAtGrove();
      for (let i = 0; i < 90; i++) { g.tick(1 / 30); const ms = window.VIS.render(); frames.push({ ms, ...window.VIS.probe() }); }
      return frames;
    }, { x, z });
    const ev = []; for (let i = 1; i < res.length; i++) ev.push(...pops(res[i - 1], res[i], i));
    out.push({ distance: d, events: ev.length });
    console.log(label, 'still', d, 'state changes', ev.length);
  }
  rows.modes.still = out;
}
// Shuffle ±1.5 m across a band edge (walking, real collision): hysteresis must keep the LOD stable.
if (MODE.includes('toggle')) {
  const out = [];
  for (const d of (env.TOGGLE ?? '25,55,65').split(',').map(Number)) {
    const [ax, az] = routePoint(d + 1.5), [bx, bz] = routePoint(d - 1.5);
    const res = await page.evaluate(({ ax, az, bx, bz }) => {
      const g = window.__game, frames = [];
      g.player.setPose({ x: ax, y: g.world.col.ground(ax, az), z: az, yaw: 0, pitch: 0 }); window.VIS.lookAtGrove();
      for (let i = 0; i < 30; i++) g.tick(1 / 30);
      for (let rep = 0; rep < 4; rep++) for (const [x, z] of [[bx, bz], [ax, az]]) {
        g.autopilot = { x, z, run: false };
        for (let i = 0; i < 90 && Math.hypot(g.player.x - x, g.player.z - z) > 0.3; i++) { window.VIS.lookAtGrove(); g.tick(1 / 30); window.VIS.render(); frames.push(window.VIS.probe()); }
      }
      g.autopilot = null; return frames;
    }, { ax, az, bx, bz });
    const ev = []; for (let i = 1; i < res.length; i++) ev.push(...pops(res[i - 1], res[i], i));
    const s = popSummary(ev);
    out.push({ distance: d, ...s });
    console.log(label, 'toggle', d, JSON.stringify(s));
  }
  rows.modes.toggle = out;
}

// ------------------------------------------------------------------------------------------------ LOD switch magnitude
// For a representative mushroom of each category, stand at each geometry switch distance, render the two levels
// either side of it (forced) and compare the pixels round the mushroom: what a crossfade could at best smooth.
if (MODE.includes('lodpop')) {
  const out = [];
  const cases = JSON.parse(env.LODPOP ?? '[["hero",25,0,1],["hero",55,1,2],["medium",50,0,1],["nursery",12,0,1]]');
  const N = +(env.LODPOP_N ?? 6);
  for (const [cat, dist, la, lb] of cases) for (let nth = 0; nth < N; nth++) {
    const pose = await page.evaluate(({ cat, dist, nth }) => {
      const g = window.__game, w = g.world, list = w.scene.userData.groveSnapshot().filter((it) => it.cat === cat);
      // specimens spread over the size range (and so over species), each with a walkable clear line at `dist`
      list.sort((a, b) => a.r - b.r);
      const order = list.map((_, i) => list[Math.floor(((i * 7919) % list.length))]);
      let found = -1;
      for (const it of order) {
        const px = it.x, pz = -it.z;
        for (let a = 0; a < 24; a++) {
          const ang = 3.9 + (a % 2 ? 1 : -1) * Math.ceil(a / 2) * 0.13;
          const x = px + Math.cos(ang) * dist, z = pz + Math.sin(ang) * dist, y = w.col.ground(x, z);
          if (x < 2 || x > 198 || z < 2 || z > 178 || w.col.overlaps(x, z, y, 0.3, 1.75, 0.42)) continue;
          let blocked = false;
          for (let s = 0.6; s < dist - 1.5 && !blocked; s += 0.4) { const qx = x + ((px - x) / dist) * s, qz = z + ((pz - z) / dist) * s; blocked = w.col.overlaps(qx, qz, w.col.ground(qx, qz) + 0.9, 0.12, 0.9, 0.05); }
          if (blocked) continue;
          if (++found === nth) return { x, z, y, tx: px, tz: pz, ty: it.y, r: it.r, id: it.id };
          break;
        }
      }
      return null;
    }, { cat, dist, nth });
    if (!pose) break;
    const shots = [];
    for (const level of [la, lb]) {
      const box = await page.evaluate(({ pose, level }) => {
        const g = window.__game, p = g.player;
        p.setPose({ x: pose.x, y: pose.y, z: pose.z, yaw: Math.atan2(pose.tx - pose.x, pose.tz - pose.z), pitch: 0 });
        p.pitch = Math.atan2(pose.ty - (pose.y + 1.65), Math.hypot(pose.tx - pose.x, pose.tz - pose.z));
        g.world.scene.userData.groveForceLevel(level);
        for (let i = 0; i < 3; i++) g.tick(0);
        window.VIS.render(); window.VIS.render();
        const c = g.camera, v = c.position.clone().set(pose.tx, pose.ty, -pose.tz).project(c);
        const H = innerHeight, W = innerWidth, half = (pose.r / (Math.hypot(pose.tx - pose.x, pose.tz - pose.z) * Math.tan((c.fov * Math.PI) / 360))) * H / 2;
        return { cx: ((v.x + 1) / 2) * W, cy: ((1 - v.y) / 2) * H, half };
      }, { pose, level });
      const file = join(OUT, `${label}-lodpop-${cat}-${dist}-${nth}-L${level}.png`);
      const clip = { x: Math.max(0, box.cx - box.half * 1.3), y: Math.max(0, box.cy - box.half * 1.3), width: Math.max(8, box.half * 2.6), height: Math.max(8, box.half * 2.6) };
      clip.width = Math.min(clip.width, viewport.width - clip.x); clip.height = Math.min(clip.height, viewport.height - clip.y);
      if (!(clip.width >= 8 && clip.height >= 8 && clip.x < viewport.width && clip.y < viewport.height)) { shots.length = 0; break; } // projected off screen
      await page.screenshot({ path: file, clip });
      shots.push({ file, clip });
    }
    await page.evaluate(() => window.__game.world.scene.userData.groveForceLevel(null));
    if (shots.length < 2) continue;
    const diff = JSON.parse(execFileSync('python3', ['-c', `
import sys,json
from PIL import Image, ImageChops
a,b=[Image.open(f).convert('RGB') for f in sys.argv[1:3]]
d=ImageChops.difference(a,b).convert('L');h=d.histogram();n=sum(h)
print(json.dumps({'px':n,'meanAbs':round(sum(i*c for i,c in enumerate(h))/n,2),'changed24':round(sum(h[24:])/n*100,2),'changed48':round(sum(h[48:])/n*100,2)}))`, shots[0].file, shots[1].file]).toString());
    const r = { cat, dist, from: la, to: lb, specimen: pose.id, cropPx: Math.round(shots[0].clip.width), ...diff };
    console.log(label, 'lodpop', JSON.stringify(r));
    out.push(r);
  }
  const agg = {};
  for (const r of out) { const k = `${r.cat}@${r.dist} L${r.from}->L${r.to}`; (agg[k] ??= []).push(r.changed24); }
  rows.modes.lodpopSummary = Object.fromEntries(Object.entries(agg).map(([k, v]) => { v.sort((a, b) => a - b); return [k, { n: v.length, medianChanged24: v[v.length >> 1], maxChanged24: v.at(-1) }]; }));
  console.log(label, 'lodpop summary', JSON.stringify(rows.modes.lodpopSummary));
  rows.modes.lodpop = out;
}

// ------------------------------------------------------------------------------------------------ gameplay invariants
// Fingerprints that must be identical between production and candidate: colliders round the grove, the placements
// (positions, scales, species, yaw), and a walk through the grove that leaves progression untouched.
if (MODE.includes('gameplay')) {
  rows.modes.gameplay = await page.evaluate(() => {
    const g = window.__game, w = g.world;
    const h = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619) >>> 0; return x.toString(16); };
    const cols = w.col.colliders.filter((c) => (c.x ?? (c.minX + c.maxX) / 2) > 150 && (c.z ?? (c.minZ + c.maxZ) / 2) > 130)
      .map((c) => [c.kind, c.tag ?? '', ...['x', 'z', 'r', 'rx', 'rz', 'minX', 'maxX', 'minZ', 'maxZ', 'minY', 'maxY'].map((k) => (c[k] === undefined ? '' : (+c[k]).toFixed(3))), c.enabled, c.solid].join(','));
    cols.sort();
    const placements = w.scene.userData.mushrooms.placements;
    const before = JSON.stringify({ flags: g.state.flags, clues: g.state.clues, inventory: g.state.inventory, open: g.state.open });
    const y = w.col.ground(166, 140); g.player.setPose({ x: 166, z: 140, y, yaw: 0.5, pitch: 0 }); T.tick(20);
    const walked = T.walk([[172, 149], [178, 157], [181, 162]]); T.wait(5);
    const peak = g.mushroomVision.intensity, inside = g.world.hereRoom;
    T.walk([[178, 157], [172, 149], [166, 140], [160, 135]]); T.wait(7);
    return {
      colliders: cols.length, mushroomColliders: cols.filter((c) => c.includes(',mushroom,')).length, collidersHash: h(cols.join('|')),
      placements: placements.length, placementsHash: h(JSON.stringify(placements)),
      walked, visionPeak: +peak.toFixed(3), visionRestored: g.mushroomVision.intensity, room: inside,
      progressionUnchanged: before === JSON.stringify({ flags: g.state.flags, clues: g.state.clues, inventory: g.state.inventory, open: g.state.open }),
    };
  });
  console.log(label, 'gameplay', JSON.stringify(rows.modes.gameplay));
}

rows.errors = errors;
// CHECK=1: the VIS-R01 acceptance gate (PB01 mobile-low ceilings unchanged: 150 calls, 750k camera triangles).
if (env.CHECK) {
  const fail = [];
  const frames = [...(rows.modes.views ?? []), ...(rows.modes.walk?.frames ?? [])];
  if (QUALITY === 'low') for (const f of frames) {
    if (f.calls > 150) fail.push(`calls ${f.calls} at ${f.centreDist} m`);
    if (f.triangles > 750000) fail.push(`triangles ${f.triangles} at ${f.centreDist} m`);
  }
  if (rows.modes.walk && rows.modes.walk.pops.visiblePops) fail.push(`${rows.modes.walk.pops.visiblePops} visible pops on the walk`);
  for (const t of rows.modes.turn ?? []) if (t.pops.events) fail.push(`${t.pops.events} state changes while turning at ${t.distance} m`);
  for (const t of rows.modes.still ?? []) if (t.events) fail.push(`${t.events} state changes standing still at ${t.distance} m`);
  for (const t of rows.modes.toggle ?? []) if (t.visiblePops) fail.push(`${t.visiblePops} visible pops shuffling at ${t.distance} m`);
  if (errors.length) fail.push(`${errors.length} page errors`);
  rows.check = fail.length ? { pass: false, fail } : { pass: true };
  console.log(label, 'CHECK', JSON.stringify(rows.check));
  if (fail.length) process.exitCode = 1;
}
writeFileSync(join(OUT, `${label}-${MODE.join('+')}.json`), JSON.stringify(rows, null, 1));
console.log(label, 'errors', errors.length, errors.slice(0, 3));
await browser.close(); server.close();
