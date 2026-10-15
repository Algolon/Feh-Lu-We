// Production-browser pool finish review. Use CHROME=... node scripts/pool-r01-review.mjs [baseUrl].
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const out = process.env.E2E_OUT ?? 'scripts/out/pool-r01';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 709, height: 1100 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/?autotest=1');
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'consKey'], flags: { leftHome: true } })));
  await page.reload(); await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 120000 });
  const info = await page.evaluate(() => {
    const g = window.__game; g.running = false;
    const mosaics = [], markers = [];
    g.world.scene.traverse(o => {
      if (o.userData.poolMosaic) mosaics.push(o.userData.poolMosaic);
      if (o.userData.poolDepthMarker) markers.push({ text: o.userData.poolDepthMarker, w: o.geometry.parameters.width, h: o.geometry.parameters.height, x: o.position.x, y: o.position.y, z: -o.position.z });
    });
    return { mosaics, markers, inspect: !!g.world.byId.get('inspect.pool') };
  });
  assert.deepEqual(info.mosaics, ['cirkel', 'driehoek', 'golf', 'ruit']);
  assert.deepEqual(info.markers.map(m => m.text), ['1,0 m', '2,0 m']);
  assert.ok(info.markers.every(m => m.w === 0.64 && m.h === 0.2 && Math.abs(m.y - 0.195) < 0.001));
  assert.deepEqual(info.markers.map(m => m.x), [126.45, 119.55]);
  assert.ok(info.inspect);
  for (const quality of ['low', 'high']) {
    for (const [name, z, yaw] of [['deep', 110.1, Math.PI], ['shallow', 95.9, 0]]) {
      await page.evaluate(({ quality, z, yaw }) => {
        const g = window.__game; g.settings.quality = quality; g.applyQuality(true);
        g.player.setPose({ x: 123, y: 0.15, z, yaw, pitch: -0.55 });
        for (let i = 0; i < 45; i++) g.tick(1 / 30);
        g.renderer.render(g.world.scene, g.camera);
      }, { quality, z, yaw });
      await page.screenshot({ path: `${out}/${quality}-${name}.png` });
    }
  }
  // Wider review angle includes the right-hand depth marker and all four mosaics together.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => {
    const g = window.__game;
    g.player.setPose({ x: 125.5, y: 0.15, z: 95.9, yaw: 0, pitch: -0.5 });
    for (let i = 0; i < 30; i++) g.tick(1 / 30);
    g.renderer.render(g.world.scene, g.camera);
  });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => { const g = window.__game; g.renderer.render(g.world.scene, g.camera); resolve(); })));
  await page.screenshot({ path: `${out}/high-overview.png` });
  assert.deepEqual(errors, []);
  console.log('PASS pool symbols/order, numeric-only depth markers, placement, inspect target and no browser errors', JSON.stringify(info));
} finally { await browser.close(); }
