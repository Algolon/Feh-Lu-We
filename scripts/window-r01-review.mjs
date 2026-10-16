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
  // WINDOW-R01-R02: the second interior sash was most conspicuous from an oblique view.
  // Capture that actual geometry in addition to head-on technical checks.
  const oblique = [];
  for (const side of ['inside', 'outside']) {
    const row = await page.evaluate(side => {
      const g = window.__game, w = g.world;
      g.settings.quality = 'low'; g.applyQuality(true);
      g.state.open['door.billiardOut'] = false; w.syncAll();
      const x = side === 'inside' ? 89.5 : 89.65;
      const z = side === 'inside' ? 107.3 : 112.5;
      g.player.setPose({ x, y: 0.15, z, yaw: Math.atan2(88 - x, 109.8 - z), pitch: 0 });
      for (let i = 0; i < 35; i++) g.tick(1 / 30);
      w.updateCulling(g.camera.position, g.camera);
      g.renderer.render(w.scene, g.camera);
      const target = side === 'inside' ? 'out' : 'billiard';
      return { side, here: w.hereRoom, targetVisible: w.visibleRooms.has(target),
        calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles,
        glError: g.renderer.getContext().getError() };
    }, side);
    if (row.glError !== 0 || (!baseline && !row.targetVisible))
      throw Error('Unexpected oblique sightline: '+JSON.stringify(row));
    oblique.push(row);
    await page.screenshot({ path: `${folder}/low-${side}-oblique.jpg`, type: 'jpeg', quality: 88 });
    console.log('oblique', JSON.stringify(row));
  }
  // WINDOW-R01-R04: verify the ACTUAL game material and two low-quality close-up captures
  // (the wide room view did not resolve the texture's fine timber grain well enough).
  let sillMaterial = null;
  if (!baseline) {
    sillMaterial = await page.evaluate(() => {
      // Inspect the live WebGL scene, not an import URL (which is unavailable in the test server).
      const materials = new Set();
      window.__game.world.scene.traverse(obj => {
        if (!obj.isMesh) return;
        for (const material of (Array.isArray(obj.material) ? obj.material : [obj.material]))
          if (material?.map?.image?.getContext && material.userData.surface === 'timber')
            materials.add(material);
      });
      const candidates = [];
      for (const m of materials) {
        const canvas = m.map.image;
        if (canvas.width !== 512 || canvas.height !== 512) continue;
        const d = canvas.getContext('2d').getImageData(128, 128, 1, 1).data;
        // Warm stained oak: unlike the common pale wood-plank material.
        if (d[0] > 120 && d[0] < 185 && d[1] > 75 && d[1] < 145 && d[2] < 110)
          candidates.push(m);
      }
      if (candidates.length !== 1) throw Error('Expected one batched stained-oak sill material, got ' + candidates.length);
      const material = candidates[0];
      const canvas = material.map.image;
      const data = canvas.getContext('2d').getImageData(0, 0, 512, 512).data;
      let min = Infinity, max = -Infinity, red = 0, green = 0, blue = 0;
      let along = 0, across = 0, samples = 0;
      for (let y = 8; y < 504; y += 13) for (let x = 8; x < 504; x += 13) {
        const i = (y * 512 + x) * 4;
        red += data[i]; green += data[i + 1]; blue += data[i + 2];
        min = Math.min(min, data[i]); max = Math.max(max, data[i]);
        along += Math.abs(data[i] - data[i + 4 * 6]);
        across += Math.abs(data[i] - data[i + 4 * 512 * 6]);
        samples++;
      }
      const result = { meanRed: red / samples, meanGreen: green / samples,
        meanBlue: blue / samples, contrast: max - min,
        lengthwiseVariation: along / samples, crossGrainVariation: across / samples,
        surface: material.userData.surface };
      if (!(result.meanRed > 125 && result.meanRed < 180
        && result.meanGreen < result.meanRed && result.meanBlue < result.meanGreen
        && result.contrast > 28 && result.crossGrainVariation > result.lengthwiseVariation * 1.15
        && result.surface === 'timber')) throw Error('Oak grain or tone contract not met: ' + JSON.stringify(result));
      return result;
    });
    console.log('Oak window board material:', JSON.stringify(sillMaterial));
  }
  const closeups = [];
  for (const position of ['front', 'oblique']) {
    const row = await page.evaluate(position => {
      const g = window.__game, w = g.world;
      g.settings.quality = 'low'; g.applyQuality(true);
      g.state.open['door.billiardOut'] = false; w.syncAll();
      const x = position === 'front' ? 88 : 88.8;
      const z = 108.25;
      g.player.setPose({ x, y: 0.15, z, yaw: Math.atan2(88 - x, 109.8 - z),
        pitch: position === 'front' ? -0.46 : -0.43 });
      for (let i = 0; i < 35; i++) g.tick(1 / 30);
      w.updateCulling(g.camera.position, g.camera);
      g.renderer.render(w.scene, g.camera);
      return { position, here: w.hereRoom, exteriorVisible: w.visibleRooms.has('out'),
        calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles,
        glError: g.renderer.getContext().getError() };
    }, position);
    if (row.glError !== 0 || (!baseline && !row.exteriorVisible))
      throw Error('Unexpected oak windowsill closeup: ' + JSON.stringify(row));
    closeups.push(row);
    await page.screenshot({ path: `${folder}/low-sill-${position}.jpg`, type: 'jpeg', quality: 92 });
    console.log('sill:', JSON.stringify(row));
  }
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync(folder+'/results.json',
    JSON.stringify({baseline, collision, frames, oblique, closeups, sillMaterial, errors, deviceValidated:false}, null, 2));
} finally { await browser.close(); await server.close(); }
