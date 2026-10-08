// DEV-04B dev probe: what surface is under a pixel (unexplained-geometry audit).
// usage: node scripts/dev04b-pick.mjs x y z yawDeg pitch px,py [px,py ...]   (pixel coords in a 1280x720 frame)
import { chromium } from 'playwright-core';
const [x, y, z, yawD, pitch, ...px] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto((process.env.BASE ?? 'http://localhost:4173/Feh-Lu-We/') + '?autotest=1');
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: [], flags: { leftHome: true }, unlocked: [], open: {} })));
await page.reload();
await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
const out = await page.evaluate(({ p, px }) => {
  const g = window.__game, THREE = g.world.scene.constructor; void THREE;
  g.player.setPose(p); g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42); for (let i = 0; i < 10; i++) g.tick(1 / 30);
  g.player.setPose(p); g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42); g.tick(1 / 30);
  g.renderer.render(g.world.scene, g.camera);
  const res = [];
  const rcst = g.raycaster;
  for (const s of px) {
    const [sx, sy] = s.split(',').map(Number);
    rcst.setFromCamera({ x: (sx / 1280) * 2 - 1, y: -(sy / 720) * 2 + 1 }, g.camera);
    rcst.far = 200;
    const hits = rcst.intersectObjects(g.world.scene.children, true).filter((h) => h.object.visible && !h.object.userData.hit && h.object.material?.visible !== false);
    const h = hits[0];
    if (!h) { res.push({ s, none: true }); continue; }
    const o = h.object;
    res.push({ s, dist: +h.distance.toFixed(2), point: h.point.toArray().map((v) => +v.toFixed(2)), plan: [+h.point.x.toFixed(2), +h.point.y.toFixed(2), +(-h.point.z).toFixed(2)], chunk: o.userData.chunk, name: o.name, type: o.type, mat: o.material?.type, map: !!o.material?.map, region: o.userData.region, parentChunk: o.parent?.userData?.chunk, tris: o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3 });
  }
  return { cam: g.camera.position.toArray(), res };
}, { p: { x: +x, y: +y, z: +z, yaw: (+yawD * Math.PI) / 180, pitch: +pitch }, px });
console.log(JSON.stringify(out));
await browser.close();
