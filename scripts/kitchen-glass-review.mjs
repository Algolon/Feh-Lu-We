import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
const out = 'docs/development/workstreams/kitchen-glass';
mkdirSync(out, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: false } });
await server.listen();
const browser = await chromium.launch({ executablePath: `${homedir()}/.cache/ms-playwright/chromium_headless_shell-1194/chrome-linux/headless_shell`, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [], rows = [];
try {
  const page = await browser.newPage({ viewport: { width: 480, height: 860 } });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(server.resolvedUrls.local[0] + '?autotest=1');
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook'], flags: { leftHome: true }, unlocked: [], open: {} })));
  await page.reload(); await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(() => { window.__game.running = false; });
  for (const quality of ['low', 'high']) for (const state of ['before-closed', 'closed', 'open', 'closing', 'opening']) {
    const row = await page.evaluate(({ quality, state }) => {
      const g = window.__game, w = g.world, id = 'door.kitchenBack';
      const seeThrough = state !== 'before-closed';
      w.rooms.portals.find(p => p.door === id).seeThrough = seeThrough;
      w.exteriorDoors.find(p => p.door === id).seeThrough = seeThrough;
      g.settings.quality = quality; g.applyQuality(true);
      g.player.setPose({ x: 101, y: .15, z: 108.2, yaw: 0, pitch: -.22 });
      g.state.open[id] = state === 'open' || state === 'closing'; w.syncAll();
      for (let i = 0; i < 45; i++) g.tick(1 / 30);
      if (state === 'closing' || state === 'opening') {
        g.state.open[id] = state === 'opening'; w.syncAll();
        for (let i = 0; i < 6; i++) g.tick(1 / 30);
      }
      w.updateCulling(g.camera.position, g.camera);
      g.renderer.render(w.scene, g.camera);
      const visible = w.visibleRooms.has('out');
      if (visible !== seeThrough) throw Error(`${quality}/${state}: unexpected outdoor visibility ${visible}`);
      return { quality, state, visible, calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles };
    }, { quality, state });
    rows.push(row);
    await page.screenshot({ path: `${out}/${quality}-${state}.jpg`, quality: 85 });
    console.log(JSON.stringify(row));
  }
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync(`${out}/results.json`, JSON.stringify({ rows, errors }, null, 2));
} finally { await browser.close(); await server.close(); }
