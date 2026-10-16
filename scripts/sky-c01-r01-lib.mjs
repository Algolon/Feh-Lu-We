// SKY-C01-R01 shared harness: the real game canvas, fixed camera/phase/quality, optional diagnostic shader or dome
// overrides applied to the live sky material. Diagnostics never touch source files or saves.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const SHELLS = ['/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell`];

export async function openSky({ port = 4211, viewport = { width: 915, height: 412 }, dpr = 1, quality = 'low', query = '' } = {}) {
  const server = await preview({ preview: { host: '127.0.0.1', port, strictPort: true } });
  const executablePath = process.env.CHROME ?? SHELLS.find(existsSync);
  const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  const context = await browser.newContext({ viewport, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  // High quality must be chosen before the renderer exists (antialias is a context attribute).
  await page.addInitScript(q => localStorage.setItem('fehluwe.settings', JSON.stringify({ quality: q, reducedMotion: true })), quality);
  await page.goto(`http://127.0.0.1:${port}/Feh-Lu-We/?autotest=1&review=lighting${query}`);
  await page.click('[data-review-start]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 90000 });
  await page.evaluate(q => {
    const g = window.__game; g.running = false; g.settings.reducedMotion = true; g.settings.quality = q; g.applyQuality(true);
    const sky = g.world.scene.children.find(o => o.material?.uniforms?.uZenith);
    window.__r01 = { sky, geometry: sky.geometry, vertex: sky.material.vertexShader };
  }, quality);
  const close = async () => { await browser.close(); await new Promise(r => server.httpServer.close(r)); };
  return { page, browser, errors, close, version: browser.version() };
}

/** Render one frame. opts: pose, t, variant, clouds, skyOnly, frag (string transform source), vert, segments, wire,
 *  camera override {pitch,yaw} (bypasses the player's pitch limit), format. Returns base64 PNG + counters. */
export async function render(page, opts) {
  return page.evaluate(o => {
    const g = window.__game, e = g.extras.env, r = window.__r01, sky = r.sky;
    if (o.quality && g.settings.quality !== o.quality) { g.settings.quality = o.quality; g.applyQuality(true); }
    g.player.setPose(o.pose);
    g.player.y = g.world.col.supportHeight(o.pose.x, o.pose.z, o.pose.y + .05, .42);
    e.mode = 'pilot'; e.preview = o.t; e.cloudVariant = o.variant ?? 'procedural'; e.clouds = o.clouds !== false;
    for (let i = 0; i < (o.settle ?? 40); i++) g.tick(1 / 30);
    if (o.camera) g.camera.rotation.set(o.camera.pitch, -o.camera.yaw, 0, 'YXZ');
    g.camera.updateMatrixWorld(true);
    e.update(o.t, g.camera.position, g.world.hereRoom === 'out' ? 0 : 1);
    // Diagnostic overrides on the live material/geometry; restored below so cases stay independent.
    const baseFrag = sky.material.fragmentShader, baseVert = sky.material.vertexShader;
    if (o.frag) { sky.material.fragmentShader = new Function('s', o.frag)(baseFrag); }
    if (o.vert) sky.material.vertexShader = o.vert;
    if (o.frag || o.vert) sky.material.needsUpdate = true;
    if (o.segments) sky.geometry = new r.geometry.constructor(400, o.segments[0], o.segments[1]);
    const visible = g.world.scene.children.map(c => c.visible);
    if (o.skyOnly) g.world.scene.children.forEach(c => { if (c !== sky) c.visible = false; });
    const gl = g.renderer.getContext();
    try {
      for (let i = 0; i < 3; i++) g.renderer.render(g.world.scene, g.camera);
      const calls = g.renderer.info.render.calls, triangles = g.renderer.info.render.triangles;
      if (o.wire) {
        // Triangulation overlay: same dome, wireframe, flat colour, drawn over the finished frame.
        const keepFrag = sky.material.fragmentShader, auto = g.renderer.autoClear;
        g.world.scene.children.forEach(c => { if (c !== sky) c.visible = false; });
        sky.material.fragmentShader = 'void main(){ gl_FragColor = vec4(1.0,0.0,0.85,1.0); }';
        sky.material.wireframe = true; sky.material.needsUpdate = true; g.renderer.autoClear = false;
        g.renderer.render(g.world.scene, g.camera);
        sky.material.wireframe = false; sky.material.fragmentShader = keepFrag; sky.material.needsUpdate = true; g.renderer.autoClear = auto;
      }
      const png = g.renderer.domElement.toDataURL('image/png').split(',')[1];
      const bad = g.renderer.info.programs.filter(p => p.diagnostics?.runnable === false), failures = bad.length;
      if (o.frag && bad.length) console.error('shader', bad.at(-1).diagnostics.fragmentShader.log);
      return { png, calls, triangles, glError: gl.getError(), failures, width: g.renderer.domElement.width, height: g.renderer.domElement.height,
        pixelRatio: g.renderer.getPixelRatio(), camera: g.camera.position.toArray(), skyCenter: sky.position.toArray() };
    } finally {
      g.world.scene.children.forEach((c, i) => c.visible = visible[i]);
      if (o.frag || o.vert) { sky.material.fragmentShader = baseFrag; sky.material.vertexShader = baseVert; sky.material.needsUpdate = true; }
      if (o.segments) { sky.geometry.dispose(); sky.geometry = r.geometry; }
    }
  }, opts);
}

/** Median GPU-synchronised wall time of n renders (software rasteriser; NOT physical GPU time). */
export async function timeSky(page, opts, n = 9, warm = 4) {
  return page.evaluate(({ o, n, warm }) => {
    const g = window.__game, e = g.extras.env, sky = window.__r01.sky;
    g.player.setPose(o.pose); e.preview = o.t; e.clouds = o.clouds !== false; e.cloudVariant = o.variant ?? 'procedural';
    for (let i = 0; i < 20; i++) g.tick(1 / 30);
    e.update(o.t, g.camera.position, 0);
    const baseFrag = sky.material.fragmentShader;
    if (o.frag) { sky.material.fragmentShader = new Function('s', o.frag)(baseFrag); sky.material.needsUpdate = true; }
    const visible = g.world.scene.children.map(c => c.visible);
    if (o.skyOnly) g.world.scene.children.forEach(c => { if (c !== sky) c.visible = false; });
    const gl = g.renderer.getContext(), px = new Uint8Array(4), times = [];
    try {
      for (let i = 0; i < n + warm; i++) {
        const s = performance.now(); g.renderer.render(g.world.scene, g.camera); gl.finish(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        if (i >= warm) times.push(performance.now() - s);
      }
    } finally {
      g.world.scene.children.forEach((c, i) => c.visible = visible[i]);
      if (o.frag) { sky.material.fragmentShader = baseFrag; sky.material.needsUpdate = true; }
    }
    times.sort((a, b) => a - b);
    return { median: times[times.length >> 1], min: times[0], max: times.at(-1), calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles };
  }, { o: opts, n, warm });
}
