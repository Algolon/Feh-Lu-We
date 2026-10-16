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
    const poseKey = JSON.stringify([o.pose, o.t, o.quality]);
    for (let i = 0; i < (r.poseKey === poseKey ? 1 : o.settle ?? 40); i++) g.tick(1 / 30);
    r.poseKey = poseKey;
    if (o.camera) g.camera.rotation.set(o.camera.pitch, -o.camera.yaw, 0, 'YXZ');
    g.camera.updateMatrixWorld(true);
    e.update(o.t, g.camera.position, g.world.hereRoom === 'out' ? 0 : 1);
    // Diagnostic overrides: a cached clone of the live material sharing its uniforms, so every shader variant keeps
    // its compiled program (switching source on one material would recompile on every swap).
    const base = sky.material;
    if (o.frag || o.vert) {
      const frag = o.frag ? new Function('s', o.frag)(base.fragmentShader) : base.fragmentShader;
      if (o.frag && frag === base.fragmentShader) throw Error('diagnostic transform did not apply');
      const key = (o.vert ?? '') + '\u0000' + frag;
      r.mats ??= new Map();
      if (!r.mats.has(key)) { const m = base.clone(); m.uniforms = base.uniforms; m.fragmentShader = frag; if (o.vert) m.vertexShader = o.vert; r.mats.set(key, m); }
      sky.material = r.mats.get(key);
    }
    if (o.segments) sky.geometry = new r.geometry.constructor(400, o.segments[0], o.segments[1]);
    const visible = g.world.scene.children.map(c => c.visible);
    if (o.skyOnly) g.world.scene.children.forEach(c => { if (c !== sky) c.visible = false; });
    const gl = g.renderer.getContext();
    try {
      g.renderer.render(g.world.scene, g.camera);
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
      // Raw framebuffer kept in the page for exact diffs; PNG only when the frame is saved (encoding dominates time).
      const w = g.renderer.domElement.width, h = g.renderer.domElement.height, pixels = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      r.frames ??= new Map(); r.next = (r.next ?? 0) + 1; r.frames.set(r.next, pixels);
      if (r.frames.size > 16) r.frames.delete(r.frames.keys().next().value);
      let hash = 2166136261; for (let i = 0; i < pixels.length; i += 7) hash = Math.imul(hash ^ pixels[i], 16777619) >>> 0;
      const png = o.save === false ? null : g.renderer.domElement.toDataURL('image/png').split(',')[1];
      const id = r.next;
      const bad = g.renderer.info.programs.filter(p => p.diagnostics?.runnable === false), failures = bad.length;
      if (o.frag && bad.length) console.error('shader', bad.at(-1).diagnostics.fragmentShader.log);
      return { id, hash: hash.toString(16), png, calls, triangles, glError: gl.getError(), failures, width: g.renderer.domElement.width, height: g.renderer.domElement.height,
        pixelRatio: g.renderer.getPixelRatio(), camera: g.camera.position.toArray(), skyCenter: sky.position.toArray() };
    } finally {
      g.world.scene.children.forEach((c, i) => c.visible = visible[i]);
      sky.material = base;
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
    const base = sky.material;
    if (o.frag) {
      const frag = new Function('s', o.frag)(base.fragmentShader), key = '\u0000' + frag;
      window.__r01.mats ??= new Map();
      if (!window.__r01.mats.has(key)) { const m = base.clone(); m.uniforms = base.uniforms; m.fragmentShader = frag; window.__r01.mats.set(key, m); }
      sky.material = window.__r01.mats.get(key);
    }
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
      sky.material = base;
    }
    times.sort((a, b) => a - b);
    return { median: times[times.length >> 1], min: times[0], max: times.at(-1), calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles };
  }, { o: opts, n, warm });
}

/** Per-channel difference of two frames kept by render(): { max, count } (count = pixels with any change). */
export async function diffFrames(page, a, b) {
  return page.evaluate(([a, b]) => {
    const p = window.__r01.frames.get(a), q = window.__r01.frames.get(b);
    if (!p || !q || p.length !== q.length) throw Error('frame missing or size mismatch');
    let max = 0, count = 0;
    for (let i = 0; i < p.length; i += 4) { const m = Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2])); if (m) { count++; if (m > max) max = m; } }
    return { max, count };
  }, [a, b]);
}
