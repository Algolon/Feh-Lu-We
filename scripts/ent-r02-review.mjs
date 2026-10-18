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
  ['front-approach', { x: 90, z: 71.5 }, [90, 4.6, 76.55]],
  ['front-oblique', { x: 98, z: 71.5 }, [90, 5.1, 76.55]],
  ['portico', { x: 90, z: 75.5 }, [90, 4.7, 76.55]],
  ['entry-to-hall', { x: 90, z: 79 }, [90, 2.2, 89]],
  ['hall-to-entry', { x: 90, z: 87 }, [90, 4.6, 76.55]],
  ['gallery-to-window', { x: 88.2, y: 3.35, z: 83 }, [90, 4.8, 76.55]],
  ['gallery-wide', { x: 93, y: 3.35, z: 83 }, [89, 4.5, 78.3]],
  ['gallery-to-hall', { x: 90, y: 3.35, z: 78.7 }, [90, 3.4, 91]],
  ['foyer-to-hall-closed', { x: 90, z: 81.1 }, [90, 1.75, 89]],
  ['hall-to-foyer-closed', { x: 90, z: 87 }, [90, 1.75, 79.5]],
  ['front-left-jamb', { x: 87.35, z: 74.8 }, [88.9, 1.35, 76.79]],
  ['front-right-jamb', { x: 92.65, z: 74.8 }, [91.1, 1.35, 76.79]],
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
      flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true, 'door.entranceHall': true },
    }));
  });
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 120000 });
  for (const [name, stand, target] of views) {
    const stats = await page.evaluate(({ stand, target, name }) => {
      const g = window.__game, w = g.world;
      if (g.ui.modalOpen) g.ui.closeModal();
      g.running = false;
      const y = stand.y ?? w.col.supportHeight(stand.x, stand.z, .15, .42);
      const yaw = Math.atan2(target[0] - stand.x, target[2] - stand.z);
      const pitch = Math.atan2(target[1] - (y + 1.65), Math.hypot(target[0] - stand.x, target[2] - stand.z));
      const pose = { x: stand.x, y, z: stand.z, yaw, pitch };
      g.player.setPose(pose);
      g.state.open['door.entranceHall'] = !name.endsWith('-closed');
      w.syncAll();
      for (let i = 0; i < 75; i++) g.tick(1 / 30);
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
    }, { stand, target, name });
    results.push({ name, ...stats });
    const shot = await page.screenshot({ path: `${out}/${name}.jpg`, quality: 82, timeout: 60000 });
    if (process.env.ENT_R02_THUMBS === '1' && ['front-approach', 'entry-to-hall', 'gallery-wide', 'hall-to-entry','foyer-to-hall-closed'].includes(name)) {
      // Low-res data comes back through the job log; the original full screenshots remain in the artifact.
      const tiny = await page.screenshot({ type: 'jpeg', quality: 40, timeout: 60000 });
      console.log('ENT_R02_IMAGE_' + name + ' ' + tiny.toString('base64'));
    }
    console.log(name, JSON.stringify(stats));
  }
  // Boundary ray proofs for the formerly open wall beneath the portico jambs.
  const seals = await page.evaluate(() => {
    const g=window.__game,w=g.world;
    g.player.setPose({x:87.0,y:.15,z:81,yaw:0,pitch:0});
    g.state.open['door.front']=true;
    g.state.open['door.entranceHall']=false; w.syncAll();
    for(let i=0;i<75;i++)g.tick(1/30);
    const ray=(x,y,z1,z2)=>w.col.segmentBlocked(x,y,z1,x,y,z2);
    const state={
      frontLeftLow:ray(88.8,.35,75.8,77.85),
      frontLeftMid:ray(88.8,1.45,75.8,77.85),
      frontRightLow:ray(91.2,.35,75.8,77.85),
      frontRightMid:ray(91.2,1.45,75.8,77.85),
      frontDoorOpen:!ray(90,1.5,75.8,77.85),
      hallDoorClosed:ray(90,1.5,83.4,84.6),
      hallDoorLeftClosed:ray(89.45,1.5,83.4,84.6),
      hallDoorRightClosed:ray(90.55,1.5,83.4,84.6),
      westInteriorWall:ray(87.25,1.5,83.4,84.6),
      eastInteriorWall:ray(92.75,1.5,83.4,84.6),
    };
    g.state.open['door.entranceHall']=true;w.syncAll();
    for(let i=0;i<75;i++)g.tick(1/30);
    state.hallDoorOpen=!ray(90,1.5,83.4,84.6);
    state.hallDoorLeftOpen=!ray(89.45,1.5,83.4,84.6);
    state.hallDoorRightOpen=!ray(90.55,1.5,83.4,84.6);
    return state;
  });
  console.log('ENT_R02_SEAL_PROOF',JSON.stringify(seals));
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
    && Object.values(seals).every(Boolean)
    && gallerySupport.every(x => Math.abs(x.y - 3.35) < .06);
  const report = { passed, baseline, errors, results, seals, travel, gallerySupport,
    scope: 'Software WebGL, high-quality 412x915, isolated branch. Roof join and gameplay still require visual owner review.' };
  writeFileSync(`${out}/results.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed, errors, travel, gallerySupport }));
  if (!passed) process.exitCode = 1;
} finally {
  await browser.close(); await server.close();
}
