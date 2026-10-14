// One bounded counting attempt; SwiftShader is NOT mobile capacity evidence.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { lowViewWithinBudget, PERFORMANCE_BUDGET } from './performance-budget.mjs';
const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/pb01';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? chromium.executablePath(), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await context.newPage(), errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
const views = [
  ['busy-interior-library', { x: 82.4, y: 0.15, z: 97.5, yaw: -0.8, pitch: 0.05 }],
  ['forest-shed-area', { x: 50, y: 0, z: 44, yaw: -2.2, pitch: 0 }],
  ['long-garden-manor-conservatory', { x: 92, y: 0, z: 136, yaw: Math.PI * 0.9, pitch: 0 }],
];
const results = [];
try {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['frontKey', 'consKey'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open: { 'door.front': true, 'door.consWest': true } }));
  });
  await page.reload(); await page.locator('[data-cont]').click();
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 60000 });
  for (const [name, pose] of views) {
    const row = await page.evaluate(pose => {
      const g = window.__game;
      g.settings.quality = 'low'; g.applyQuality(true);
      g.player.setPose(pose);
      for (let i = 0; i < 30; i++) g.tick(1 / 30);
      const samples = [], first = g.player.pose();
      for (let j = 0; j < 8; j++) {
        // Real existing fixed-step collision/movement path plus camera turn, not a static screenshot.
        g.autopilot = { x: pose.x + (j < 4 ? 1 : -1), z: pose.z, run: false };
        g.player.yaw = pose.yaw + (j - 3.5) * 0.025;
        for (let i = 0; i < 4; i++) g.tick(1 / 30);
        g.renderer.render(g.world.scene, g.camera);
        samples.push({ cameraCalls: g.renderer.info.render.calls, cameraTriangles: g.renderer.info.render.triangles, pos: g.player.pose() });
      }
      g.autopilot = null;
      const seen = new Set(); let geometryBytes = 0;
      g.world.scene.traverse(o => { const geo = o.geometry; if (!geo || seen.has(geo)) return; seen.add(geo); for (const a of Object.values(geo.attributes)) geometryBytes += a.array?.byteLength ?? 0; geometryBytes += geo.index?.array?.byteLength ?? 0; });
      const gl = g.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
      return { samples, first, last: g.player.pose(), quality: g.settings.quality, shadowPasses: 0, shadowCalls: 0, shadowTriangles: 0, dpr: g.renderer.getPixelRatio(), cssViewport: [innerWidth, innerHeight], buffer: [g.canvas.width, g.canvas.height], memory: { ...g.renderer.info.memory, estimatedGeometryAttributeBytes: geometryBytes, omissions: 'instance/driver/target/texture byte storage; object counts are not VRAM bytes' }, multiDraw: g.metrics().multiDraw, renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown', browser: navigator.userAgent, shaderFailures: g.renderer.info.programs.filter(p => p.diagnostics?.runnable === false).length, glError: gl.getError(), shadowsEnabled: g.renderer.shadowMap.enabled };
    }, pose);
    row.maxCalls = Math.max(...row.samples.map(s => s.cameraCalls));
    row.minTriangles = Math.min(...row.samples.map(s => s.cameraTriangles));
    row.maxTriangles = Math.max(...row.samples.map(s => s.cameraTriangles));
    row.budgetPass = row.samples.every(s => lowViewWithinBudget({ calls: s.cameraCalls, triangles: s.cameraTriangles }));
    results.push({ name, ...row });
    console.log(`${name}: ${row.maxCalls} calls / ${row.minTriangles}–${row.maxTriangles} camera triangles; policy=${row.budgetPass}`);
  }
  const report = { status: 'DEVICE VALIDATION PENDING', policy: PERFORMANCE_BUDGET, build: process.env.PB01_BUILD ?? 'unspecified', productionBase: 'fe74db0b471d7816d840e6c223b92950adf5639f', scope: 'unchanged production runtime; 8 short movement/turn samples per view, software counting only; no hardware FPS/thermal/capacity conclusion', errors, results };
  writeFileSync(`${OUT}/views.json`, JSON.stringify(report, null, 2) + '\n');
  if (errors.length || results.some(r => r.shaderFailures || r.glError || r.shadowsEnabled || !r.budgetPass)) process.exitCode = 1;
} finally { await browser.close(); }
