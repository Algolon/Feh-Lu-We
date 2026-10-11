// Matched VCP-01 captures; baseline mode runs the untouched production build.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const variant = process.argv[2] ?? 'production';
const BASE = process.env.BASE_URL ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = `docs/vcp01/frames/${variant}`;
mkdirSync(OUT, { recursive: true });
const shots = [
  ['library-wide', 82.4, 97.5, [76, 1.6, 103]],
  ['table-near', 82.4, 99.4, [80.6, 0.75, 101.2]],
  ['seating-near', 76.4, 106.8, [74.4, 0.7, 105.4]],
  ['globe-3m', 82.4, 105.2, [82.4, 0.9, 108.2]],
  ['globe-1m', 82.4, 107.2, [82.4, 0.88, 108.2]],
  ['globe-side', 84, 108, [82.4, 0.85, 108.2]],
  ['library-alternate', 83.2, 106, [78.4, 1.1, 101.2]],
  ['globe-rear', 82.8, 109.05, [82.4, 0.9, 108.2]],
  ['globe-portrait', 82.4, 105.2, [82.4, 0.9, 108.2]],
];
const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true });
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') problems.push(m.text());
});
const helpers = readFileSync('scripts/e2e-helpers.js', 'utf8'),
  records = [];
for (const [name, x, z, target] of shots) {
  await page.setViewportSize(name.includes('portrait') ? { width: 390, height: 844 } : { width: 844, height: 390 });
  await page.goto(BASE + '?autotest=1' + (variant === 'production' ? '' : `&review=library-craft&craft=${variant}`));
  if (variant === 'production') {
    await page.evaluate(
      ({ x, z }) => {
        localStorage.setItem(
          'fehluwe.save',
          JSON.stringify({
            version: 4,
            scene: 'estate',
            inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'],
            flags: { leftHome: true },
            unlocked: ['lock.door.front'],
            open: { 'door.front': true },
            player: { home: null, estate: { x, y: 0.15, z, yaw: 0, pitch: 0 } },
          }),
        );
        localStorage.setItem('fehluwe.settings', JSON.stringify({ quality: 'low' }));
      },
      { x, z },
    );
    await page.reload();
    await page.click('[data-cont]');
  } else await page.click('[data-review-start]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);
  const record = await page.evaluate(
    ({ x, z, target }) => {
      const g = window.__game;
      g.settings.quality = 'low';
      g.applyQuality();
      if (T.modalOpen()) T.closeModal();
      Object.assign(g.player, { x, y: 0.15, z });
      g.time = 0;
      g.dusk = 0;
      g.indoor = 1;
      T.lookAt(...target);
      T.tick(60);
      // Freeze simulation at an identical 62/30 s; render loop continues for real renderer measurements.
      g.tick = () => {};
      for (const id of ['toast', 'hud', 'stick', 'review-bar']) {
        const e = document.getElementById(id);
        if (e) e.style.display = 'none';
      }
      return {
        viewport: [innerWidth, innerHeight],
        pose: g.player.pose(),
        fov: g.camera.fov,
        exposure: g.renderer.toneMappingExposure,
        room: g.world.hereRoom,
        lamps: g.state.lit,
        audit: g.world.scene.userData.assetWarnings,
      };
    },
    { x, z, target },
  );
  await page.waitForTimeout(800);
  const metrics = await page.evaluate(() => {
    const g = window.__game;
    g.renderer.render(g.world.scene, g.camera);
    g.renderer.getContext().finish();
    return {
      ...g.metrics(),
      actualQuality: g.settings.quality,
      antialias: g.renderer.getContext().getContextAttributes().antialias,
      pixelRatio: g.renderer.getPixelRatio(),
      assetTris: g.world.scene.userData.assetTris,
      renderer: g.renderer.getContext().getParameter(g.renderer.getContext().RENDERER),
    };
  });
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 88 });
  await page.evaluate(() => {
    const g = window.__game,
      e = g.extras.env;
    e.hemi.color.set('#ffffff');
    e.hemi.groundColor.set('#8a8a8a');
    e.hemi.intensity = 2;
    e.sun.color.set('#ffffff');
    e.sun.intensity = 1.6;
    g.world.scene.fog = null;
    g.renderer.toneMappingExposure = 1;
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/${name}-neutral.jpg`, type: 'jpeg', quality: 88 });
  const clay = await page.evaluate(() => {
    const g = window.__game;
    let Lam;
    g.world.scene.traverse((o) => {
      if (o.material?.isMeshLambertMaterial) Lam = o.material.constructor;
    });
    const solid = new Lam({ color: '#c9c3b8' });
    const types = new Set();
    let replaced = 0,
      hidden = 0;
    g.world.scene.traverse((o) => {
      if (o.isPointLight) {
        o.intensity = 0;
        return;
      }
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (mats.some((m) => m.transparent || m.isShaderMaterial || m.isMeshBasicMaterial)) {
        o.visible = false;
        hidden++;
        return;
      }
      for (const m of mats) types.add(m.type);
      o.material = solid;
      if (o.isInstancedMesh) o.instanceColor = null;
      replaced++;
    });
    return { types: [...types], replaced, hidden };
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${OUT}/${name}-clay.jpg`, type: 'jpeg', quality: 88 });
  records.push({ name, target, ...record, metrics, clay });
  console.log(variant, name, metrics.calls, metrics.triangles);
}
writeFileSync(
  `${OUT}/metrics.json`,
  JSON.stringify(
    {
      variant,
      viewport: [844, 390],
      dpr: 1,
      quality: 'low',
      softwareRenderer: true,
      simulationSeconds: 62 / 30,
      records,
      problems,
    },
    null,
    2,
  ),
);
await browser.close();
if (problems.length) throw new Error(problems.join('\n'));
