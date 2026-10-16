// WINDOW-R01: reproducible preview from both sides of the single opted-in pane.
// This script uses software WebGL, so frame counts are not physical Samsung performance.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';

const baseline = process.env.WINDOW_R01_BASELINE === '1';
const folder = 'docs/development/workstreams/window-r01/review' + (baseline ? '/baseline' : '');
mkdirSync(folder, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: false } });
await server.listen();
const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const errors = [], frames = [];
try {
  const page = await browser.newPage({ viewport: { width: 480, height: 860 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(server.resolvedUrls.local[0] + '?autotest=1');
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({
    version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook'],
    flags: { leftHome: true }, unlocked: [], open: {},
  })));
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 150000 });
  await page.evaluate(() => { window.__game.running = false; });
  // Test one glass pane is solid for interaction/picking and transparent to visibility rays.
  const collision = await page.evaluate(() => {
    const w = window.__game.world, a = [88, 1.85, 108.5, 88, 1.85, 111.1];
    return {
      physical: w.col.segmentBlocked(...a),
      visual: w.col.segmentBlocked(...a, w.visualPassThrough),
      optedWindow: w.rooms.portals.find(p => p.a === 'billiard' && p.kind === 'window')?.aperture,
      billiardDoorSeeThrough: w.rooms.portals.find(p => p.door === 'door.billiardOut')?.seeThrough,
    };
  });
  if (!baseline && (!collision.physical || collision.visual || !collision.optedWindow || !collision.billiardDoorSeeThrough))
    throw Error('Failed billiard glazing physical/visual separation: ' + JSON.stringify(collision));
  for (const quality of ['low', 'high']) for (const side of ['inside', 'outside']) for (const door of ['closed', 'open']) {
    const row = await page.evaluate(({quality,side,door}) => {
      const g = window.__game, w = g.world, id = 'door.billiardOut';
      g.settings.quality = quality; g.applyQuality(true);
      g.state.open[id] = door === 'open'; w.syncAll();
      g.player.setPose(side === 'inside'
        ? { x: 88, y: 0.15, z: 107.4, yaw: 0, pitch: 0 }
        : { x: 88, y: 0.15, z: 112.5, yaw: Math.PI, pitch: 0 });
      for (let i = 0; i < 35; i++) g.tick(1 / 30);
      w.updateCulling(g.camera.position, g.camera);
      g.renderer.render(w.scene, g.camera);
      const target = side === 'inside' ? 'out' : 'billiard';
      return {
        quality, side, door, here: w.hereRoom, target, targetVisible: w.visibleRooms.has(target),
        calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles,
        buffer: [g.canvas.width, g.canvas.height], glError: g.renderer.getContext().getError(),
      };
    }, {quality,side,door});
    frames.push(row);
    if (row.glError !== 0 || (!baseline && !row.targetVisible)) throw Error('Unexpected window view: '+JSON.stringify(row));
    await page.screenshot({ path: `${folder}/${quality}-${side}-${door}.jpg`, type: 'jpeg', quality: 88 });
    console.log(JSON.stringify(row));
  }
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync(folder+'/results.json', JSON.stringify({baseline, collision, frames, errors, deviceValidated:false}, null, 2));
} finally { await browser.close(); await server.close(); }
