// DEV-04B dev probe: the render list of one view (object chunk | material | triangles), standard budget door state.
// Usage: node scripts/dev04b-drawlist.mjs baseUrl x y z yaw   → JSON lines sorted by triangles
import { chromium } from 'playwright-core';
const [BASE, x, y, z, yaw] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(BASE + '?autotest=1');
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['frontKey', 'consKey'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open: { 'door.front': true, 'door.consEast': true, 'door.atticStair': true } })));
await page.reload(); await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
const out = await page.evaluate(async (p) => {
  const g = window.__game;
  g.player.setPose({ x: p[0], y: p[1], z: p[2], yaw: p[3], pitch: 0.05 }); g.player.y = g.world.col.supportHeight(p[0], p[2], p[1] + 0.05, 0.42);
  for (let i = 0; i < 20; i++) g.tick(1 / 30);
  await new Promise((r) => setTimeout(r, 100));
  g.settings.quality = 'low'; g.applyQuality(true); g.tick(1 / 30); g.renderer.render(g.world.scene, g.camera);
  const list = g.renderer.renderLists.get(g.world.scene, 0), rows = [];
  for (const it of [...list.opaque, ...list.transparent]) {
    const o = it.object, geo = it.geometry, tri = (geo.index ? geo.index.count : geo.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
    let top = o; while (top.parent && top.parent !== g.world.scene) top = top.parent;
    rows.push({ k: `${o.userData.chunk ?? top.userData.chunk ?? top.userData.region ?? top.type}|${it.material.type}${it.material.map ? '+map' : ''}|${it.material.uuid.slice(0, 4)}`, tri: Math.round(tri) });
  }
  return { calls: g.renderer.info.render.calls, tris: g.renderer.info.render.triangles, rows };
}, [+x, +y, +z, +yaw]);
console.log(JSON.stringify(out));
await browser.close();
