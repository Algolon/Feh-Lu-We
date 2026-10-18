// ENT-R02 isolated in-game WebGL QA: generated evidence, no deployment or gameplay migration.
import { preview } from 'vite';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const baseline = process.env.ENT_R02_BASELINE === '1';
const out = baseline ? 'docs/development/workstreams/ent-r02/baseline' : 'docs/development/workstreams/ent-r02/review';
mkdirSync(out, { recursive: true });
const server = await preview({
  root: process.env.ENT_R02_ROOT || process.cwd(),
  preview: { host: '127.0.0.1', port: 4229, strictPort: true },
});
const browser = await chromium.launch({
  executablePath: process.env.CHROME || chromium.executablePath(),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const errors = [], results = [];
const views = [
  ['front-approach', { x: 90, z: 71.5 }, [90, 4.6, 77.15]],
  ['front-oblique', { x: 98, z: 71.5 }, [90, 5.1, 77.15]],
  ['portico', { x: 90, z: 75.5 }, [90, 4.7, 77.15]],
  ['entry-to-hall', { x: 90, z: 79 }, [90, 2.2, 89]],
  ['hall-to-entry', { x: 90, z: 87 }, [90, 4.6, 77.15]],
  ['gallery-to-window', { x: 88.2, y: 3.35, z: 83 }, [90, 4.8, 77.15]],
  ['gallery-wide', { x: 93, y: 3.35, z: 83 }, [89, 4.5, 78.3]],
  ['gallery-to-hall', { x: 90, y: 3.35, z: 78.7 }, [90, 3.4, 91]],
];
try {
  const page = await browser.newPage({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 1, isMobile: true, hasTouch: true,
  });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:4229/Feh-Lu-We/?autotest=1', { waitUntil: 'networkidle', timeout: 120000 });
  await page.evaluate(() => {
    localStorage.setItem('fehluwe.settings', JSON.stringify({ quality: 'high' }));
    localStorage.setItem('fehluwe.save', JSON.stringify({
      version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'],
      flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true },
    }));
  });
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 120000 });
  for (const [name, stand, target] of views) {
    const stats = await page.evaluate(({ stand, target }) => {
      const g = window.__game, w = g.world;
      if (g.ui.modalOpen) g.ui.closeModal();
      g.running = false;
      const y = stand.y ?? w.col.supportHeight(stand.x, stand.z, .15, .42);
      const yaw = Math.atan2(target[0] - stand.x, target[2] - stand.z);
      const pitch = Math.atan2(target[1] - (y + 1.65), Math.hypot(target[0] - stand.x, target[2] - stand.z));
      const pose = { x: stand.x, y, z: stand.z, yaw, pitch };
      g.player.setPose(pose);
      for (let i = 0; i < 12; i++) g.tick(1 / 30);
      g.player.setPose(pose);
      g.player.applyCamera(g.camera);
      w.updateCulling(g.camera.position, g.camera);
      for (const id of ['hud', 'stick', 'toast', 'debug']) {
        const el = document.getElementById(id); if (el) el.style.display = 'none';
      }
      g.renderer.render(w.scene, g.camera);
      return {
        pose, room: w.hereRoom, calls: g.renderer.info.render.calls,
        triangles: g.renderer.info.render.triangles,
        glError: g.renderer.getContext().getError(),
        failedShaders: (g.renderer.info.programs || []).filter(p => p.diagnostics?.runnable === false).length,
        frontDoor: w.byId.has('door.front'),
      };
    }, { stand, target });
    results.push({ name, ...stats });
    const shot = await page.screenshot({ path: `${out}/${name}.jpg`, quality: 82, timeout: 60000 });
    if (process.env.ENT_R02_THUMBS === '1' && ['front-approach', 'entry-to-hall', 'gallery-wide', 'hall-to-entry'].includes(name)) {
      // Low-res data comes back through the job log; the original full screenshots remain in the artifact.
      const tiny = await page.screenshot({ type: 'jpeg', quality: 40, timeout: 60000 });
      console.log('ENT_R02_IMAGE_' + name + ' ' + tiny.toString('base64'));
    }
    console.log(name, JSON.stringify(stats));
  }
  const travel = await page.evaluate(() => {
    const g = window.__game, w = g.world;
    const pose = { x: 90, y: w.col.supportHeight(90, 74, .15, .42), z: 74, yaw: 0, pitch: 0 };
    g.player.setPose(pose);
    const rows = [];
    for (const [x, z] of [[90, 78.6], [90, 82.1], [90, 86.2]]) {
      g.autopilot = { x, z, run: false };
      let count = 0;
      while (Math.hypot(g.player.x - x, g.player.z - z) > .35 && count++ < 450) g.tick(1 / 30);
      rows.push({ destination: [x,z], reached: Math.hypot(g.player.x - x, g.player.z - z) <= .35,
        actual: { x: g.player.x, y: g.player.y, z: g.player.z } });
      g.autopilot = null;
      if (!rows.at(-1).reached) break;
    }
    return rows;
  });
  const gallerySupport = await page.evaluate(() => {
    const w = window.__game.world, probes = [];
    for (const [x,z] of [[90,78.2],[90,80.35],[90,80.45],[90,82.2],[86.1,82.4]]) {
      probes.push({ x,z,y:w.col.supportHeight(x,z,3.35,.45) });
    }
    return probes;
  });
  const basic = errors.length === 0 && results.every(x => x.glError === 0 && x.failedShaders === 0 && x.frontDoor);
  const passed = baseline ? basic : basic
    && results.every(x => x.calls <= 150 && x.triangles <= 750000)
    && travel.every(x => x.reached)
    && gallerySupport.every(x => Math.abs(x.y - 3.35) < .06);
  const report = { passed, baseline, errors, results, travel, gallerySupport,
    scope: 'Software WebGL, high-quality 412x915, isolated branch. Roof join and gameplay still require visual owner review.' };
  writeFileSync(`${out}/results.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed, errors, travel, gallerySupport }));
  if (!passed) process.exitCode = 1;
} finally {
  await browser.close(); await server.close();
}
