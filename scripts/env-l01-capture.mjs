// Real renderer evidence; isolated browser context, never a user's save. Build first.
// node scripts/env-l01-capture.mjs audit|prototype /absolute/output/directory
import { chromium } from 'playwright-core';
import { preview } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const MODE = process.argv[2] ?? 'audit', OUT = process.argv[3];
if (!OUT) throw new Error('An explicit output directory is required');
mkdirSync(OUT, { recursive: true });
const D = Math.PI / 180;
export const POSES = {
  boslust: { x: 63, y: 0, z: 11.5, yaw: 0, pitch: 0.05 },
  approach: { x: 51.5, y: 0, z: 7.6, yaw: 55 * D, pitch: 0.04 },
  garden: { x: 90, y: 0, z: 123, yaw: 0, pitch: -0.03 },
  manor: { x: 90, y: 0, z: 60, yaw: 0, pitch: 0.05 },
  woodland: { x: 120, y: 0, z: 13.6, yaw: 85 * D, pitch: 0.02 },
  hall: { x: 90, y: 0.15, z: 84.6, yaw: 0, pitch: 0.05 },
  living: { x: 83.4, y: 0.15, z: 87.2, yaw: -90 * D, pitch: -0.06 },
  darkroom: { x: 83.6, y: 3.35, z: 88.4, yaw: -60 * D, pitch: -0.08 },
};
const server = await preview({ preview: { host: '127.0.0.1', port: 4187, strictPort: true } });
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/root/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const problems = [], rows = [];
const page = await browser.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 1 });
page.on('pageerror', e => problems.push(e.message));
page.on('console', m => { if (m.type() === 'error') problems.push(m.text()); });
let loadedFallback = null;
async function capture(name, quality, portrait, dusk, variant = 'normal', fallback = false) {
  await page.setViewportSize(portrait ? { width: 412, height: 915 } : { width: 915, height: 412 });
  if (loadedFallback !== fallback) {
  await page.goto(`http://127.0.0.1:4187/Feh-Lu-We/?autotest=1${MODE === 'prototype' ? '&review=lighting' : ''}${fallback ? '&multidraw=0' : ''}`);
  if (MODE === 'audit') {
    await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['frontKey', 'torch', 'matches', 'notebook'], flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true } })));
    await page.reload(); await page.click('[data-cont]');
  } else await page.click('[data-review-start]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(() => { window.__envUpdate = null; window.__fog = null; window.__tone = null; });
  loadedFallback = fallback;
  }
  const m = await page.evaluate(({ pose, quality, dusk, variant, mode }) => {
    const g = window.__game, env = g.extras.env;
    window.__envUpdate ??= env.update; env.update = window.__envUpdate;
    window.__fog ??= g.world.scene.fog; g.world.scene.fog = window.__fog;
    window.__tone ??= g.renderer.toneMapping; g.renderer.toneMapping = window.__tone;
    g.running = false; g.settings.quality = quality; g.settings.reducedMotion = true; g.applyQuality(true);
    g.player.setPose(pose); g.player.y = g.world.col.supportHeight(pose.x, pose.z, pose.y + 0.05, 0.42);
    for (let i = 0; i < 90; i++) g.tick(1 / 30);
    g.player.applyCamera(g.camera);
    const indoor = g.world.hereRoom === 'out' ? 0 : 1;
    if (mode === 'prototype') env.preview = dusk;
    env.update(dusk, g.camera.position, indoor); env.update = () => {};
    if (variant === 'hemi') env.sun.intensity = 0;
    if (variant === 'sun') env.hemi.intensity = 0;
    if (variant === 'no-shadows') { g.renderer.shadowMap.enabled = false; env.sun.castShadow = false; }
    if (variant === 'no-fog') g.world.scene.fog = null;
    g.world.scene.traverse(o => {
      const b = o.userData.envAuditOriginal; if (!b) return;
      o.material = b.material; if (o.isInstancedMesh) o.instanceColor = b.instanceColor;
      if (b.colors) { o._colorsTexture.image.data.set(b.colors); o._colorsTexture.needsUpdate = true; }
    });
    const materials = new Set();
    g.world.scene.traverse(o => { if (o.isMesh) for (const mat of Array.isArray(o.material) ? o.material : [o.material]) if (mat) materials.add(mat); });
    for (const mat of materials) { if (!mat.userData.envAuditDefines) mat.userData.envAuditDefines = {...mat.defines}; mat.defines = {...mat.userData.envAuditDefines}; mat.needsUpdate = true; }
    if (variant === 'no-surfaces') for (const mat of materials) if (mat.defines?.FLW_SURFACE) { delete mat.defines.FLW_SURFACE; mat.needsUpdate = true; }
    if (variant === 'neutral') { env.sun.color.set('white'); env.hemi.color.set('white'); env.hemi.groundColor.set('#888888'); g.world.scene.fog = null; }
    if (variant === 'no-tonemap') g.renderer.toneMapping = 0;
    if (variant === 'clay') {
      const Lam = [...materials].find(m => m.type === 'MeshLambertMaterial').constructor;
      const mat = new Lam({ color: '#b0b0b0' });
      g.world.scene.traverse(o => {
        if (o.isMesh && o.material?.type !== 'ShaderMaterial') {
          o.userData.envAuditOriginal ??= { material: o.material, instanceColor: o.instanceColor, colors: o._colorsTexture?.image.data.slice() };
          o.material = mat;
          if (o.isInstancedMesh) o.instanceColor = null;
          if (o.isBatchedMesh && o._colorsTexture) { o._colorsTexture.image.data.fill(1); o._colorsTexture.needsUpdate = true; }
        }
      });
    }
    for (const id of ['hud', 'toast', 'stick', 'review-bar', 'debug']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    const gl = g.renderer.getContext(), pixel = new Uint8Array(4), times = [];
    for (let i = 0; i < 8; i++) g.renderer.render(g.world.scene, g.camera);
    for (let i = 0; i < 5; i++) { const t = performance.now(); g.renderer.render(g.world.scene, g.camera); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel); times.push(performance.now() - t); }
    times.sort((a,b) => a-b);
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return { pose: g.player.pose(), camera: g.camera.position.toArray(), room: g.world.hereRoom,
      calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles, softwareMedianMs: times[2],
      hemi: env.hemi.intensity, sun: env.sun.intensity, fog: g.world.scene.fog && { near: g.world.scene.fog.near, far: g.world.scene.fog.far },
      exposure: g.renderer.toneMappingExposure, renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      multiDraw: !!gl.getExtension('WEBGL_multi_draw'), programs: g.renderer.info.programs.length,
      shaderFailures: g.renderer.info.programs.filter(p => p.diagnostics?.runnable === false).map(p => p.diagnostics),
      pool: g.pool.assigned(), lights: g.pool.lights.length, glError: gl.getError() };
  }, { pose: POSES[name], quality, dusk, variant, mode: MODE });
  const file = `${name}-${quality}-${portrait ? 'portrait' : 'landscape'}-${dusk}-${variant}${fallback ? '-fallback' : ''}.jpg`;
  await page.screenshot({ path: `${OUT}/${file}`, type: 'jpeg', quality: 86 });
  rows.push({ file, name, quality, portrait, dusk, variant, fallback, ...m });
  writeFileSync(`${OUT}/measurements.json`, JSON.stringify({ mode: MODE, commit: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), browser: browser.version(), conditions: 'SwiftShader WebGL2; DPR 1; FOV 68 landscape / 82 portrait; 915x412 or 412x915; torch off; only front door open; stationary; reduced motion; 5 timed GPU-synchronized renders after 8 warmup frames. Not device FPS.', rows, problems }, null, 2));
  console.log(file, m.calls, m.triangles, m.shaderFailures.length);
}
try {
  for (const quality of ['low','high']) for (const name of Object.keys(POSES)) for (const dusk of MODE === 'audit' ? [0,1] : [0,1/3,2/3,1]) await capture(name,quality,false,dusk);
  for (const name of ['boslust','garden']) for (const dusk of [0,1]) await capture(name,'low',true,dusk);
  if (MODE === 'audit') {
    for (const name of ['boslust','garden','woodland']) for (const variant of ['hemi','sun','no-shadows','no-fog','no-surfaces','neutral','no-tonemap','clay']) await capture(name,'low',false,1,variant);
    await capture('boslust','high',false,1,'no-shadows');
    for (const dusk of [0,1]) await capture('boslust','low',false,dusk,'normal',true);
  } else for (const dusk of [0,2/3,1]) await capture('boslust','low',false,dusk,'normal',true);
} finally { await browser.close(); await new Promise(r => server.httpServer.close(r)); }
