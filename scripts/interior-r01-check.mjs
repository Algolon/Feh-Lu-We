// Focused production-scene regression: structure blocks the sun, tile coverage and short-leaf grip seating.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage();
  await page.goto(process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/?autotest=1');
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'], flags: { leftHome: true } })));
  await page.reload(); await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 120000 });
  const result = await page.evaluate(() => {
    const g = window.__game; g.running = false;
    g.settings.quality = 'high'; g.applyQuality(true);
    g.player.setPose({ x: 98.5, y: 0.15, z: 98.6, yaw: -Math.PI / 2, pitch: 0 });
    for (let i = 0; i < 60; i++) g.tick(1 / 30);
    const scene = g.world.scene, V = g.camera.position.constructor, ray = new g.raycaster.constructor();
    scene.updateMatrixWorld(true);
    const all = []; scene.traverse(o => { if (o.isMesh && !o.userData.hit) all.push(o); });
    const cast = (x, y, z, dx, dy, dz, meshes) => { ray.set(new V(x, y, -z), new V(dx, dy, -dz)); ray.far = 30; return ray.intersectObjects(meshes, false)[0]; };
    // A vertical sun path from each occupied level must hit a structural slab even with upper furniture hidden.
    const blockers = [[101, 1.8, 100, 3.15], [79, 1.8, 88, 3.15], [90, 1.8, 101, 3.15], [90, 4.5, 100, 6.45]].map(([x,y,z,ceiling]) => {
      const h = cast(x,y,z,0,1,0,all.filter(o => o.visible && o.castShadow && o.userData.chunk === 'manor'));
      return { x,z,ceiling,hitY:h?.point.y,chunk:h?.object.userData.chunk };
    });
    const tile = cast(96,0.65,98.6,-1,0,0,all.filter(o => o.visible));
    const leaf = g.world.byId.get('kitchen.hatch').obj;
    let maxY = -Infinity; leaf.traverse(o => { if (!o.isMesh || o.userData.hit) return; const a=o.geometry.attributes.position,v=new V(); for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);maxY=Math.max(maxY,v.y);} });
    return { blockers, tileX:tile?.point.x, tileChunk:tile?.object.userData.chunk, hatchMaxY:maxY };
  });
  console.log(JSON.stringify(result));
  for (const r of result.blockers) { assert.equal(r.chunk, 'manor'); assert.ok(Math.abs(r.hitY-r.ceiling)<0.01, JSON.stringify(r)); }
  assert.ok(result.tileX > 95.08, JSON.stringify(result));
  assert.ok(result.hatchMaxY < 1.9, JSON.stringify(result));
  console.log('PASS interior structural blockers, continuous tiles and seated hatch hardware', JSON.stringify(result));
} finally { await browser.close(); }
