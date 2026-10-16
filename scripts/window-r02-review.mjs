// WINDOW-R02 review on the actual built gameplay scene. Software WebGL is NOT an Android FPS test.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
const folder = 'docs/development/workstreams/window-r02/review';
mkdirSync(folder, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: false } });
await server.listen();
const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const errors = [], views = [];
// Coordinates are actual facade apertures, *not* newly invented camera locations.
// South, north, west, east, two upstairs rooms and both faces of the wing.
const poses = [
  { id:'south-ground', axis:'x', f:80.2, at:79, y:1.85, ext:-1 },
  { id:'north-ground', axis:'x', f:109.8, at:88, y:1.85, ext:1 },
  { id:'west-ground', axis:'z', f:72.2, at:97, y:1.85, ext:-1 },
  { id:'east-ground', axis:'z', f:107.8, at:86.8, y:1.85, ext:1 },
  { id:'south-upper', axis:'x', f:80.2, at:101.5, y:4.75, ext:-1 },
  { id:'north-upper', axis:'x', f:109.8, at:98, y:4.75, ext:1 },
  { id:'west-upper', axis:'z', f:72.2, at:90, y:4.75, ext:-1 },
  { id:'east-upper', axis:'z', f:107.8, at:87, y:4.75, ext:1 },
  { id:'wing-south', axis:'x', f:92.2, at:110, y:1.75, ext:-1 },
  { id:'wing-north', axis:'x', f:109.8, at:112, y:1.75, ext:1 },
];
try {
  const page = await browser.newPage({ viewport: { width: 480, height: 860 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(server.resolvedUrls.local[0] + '?autotest=1');
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({
    version:4,scene:'estate',inventory:['invitation','torch','matches','notebook'],
    flags:{ leftHome:true },unlocked:[],open:{},
  })));
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 150000 });
  await page.evaluate(() => { window.__game.running = false; });
  const registry = await page.evaluate(() => {
    const w = window.__game.world;
    const p = w.rooms.portals.filter(p => p.kind === 'window' && p.seeThrough && p.aperture);
    const result = { portals: p.length, rooms: [...new Set(p.map(x => x.a))].sort(),
      glassColliderTags: 0, physicallyBlocked: 0, visuallyClear: 0 };
    const normals = (p) => {
      const a = p.aperture;
      const ext = a.axis === 'x' ? (a.z === 80.2 || a.z === 92.2 ? -1 : 1)
        : (a.x === 72.2 ? -1 : 1);
      const x0 = a.x + (a.axis === 'z' ? -0.35 * ext : 0),
        z0 = a.z + (a.axis === 'x' ? -0.35 * ext : 0),
        x1 = a.x + (a.axis === 'z' ? 0.35 * ext : 0),
        z1 = a.z + (a.axis === 'x' ? 0.35 * ext : 0);
      return [x0, a.y, z0, x1, a.y, z1];
    };
    for (const portal of p) {
      const points = normals(portal);
      if (w.col.segmentBlocked(...points)) result.physicallyBlocked++;
      if (!w.col.segmentBlocked(...points, w.visualPassThrough)) result.visuallyClear++;
    }
    return result;
  });
  if (registry.portals !== 46 || registry.physicallyBlocked !== 46 || registry.visuallyClear !== 46)
    throw Error('All facade glasses must block motion but transmit visibility: ' + JSON.stringify(registry));
  for (const p of poses) for (const side of ['inside','outside']) {
    const view = await page.evaluate(({ p, side }) => {
      const g = window.__game, w = g.world;
      g.settings.quality = 'low'; g.applyQuality(true);
      const nx = p.axis === 'z' ? p.ext : 0;
      const nz = p.axis === 'x' ? p.ext : 0;
      const step = side === 'outside' ? 0.88 : -0.88;
      const atX = p.axis === 'x' ? p.at : p.f;
      const atZ = p.axis === 'x' ? p.f : p.at;
      g.camera.position.set(atX + nx * step, p.y, -atZ - nz * step);
      g.camera.lookAt(atX, p.y, -atZ);
      g.camera.updateMatrixWorld(true);
      w.updateCulling(g.camera.position, g.camera);
      g.renderer.render(w.scene, g.camera);
      const source = w.hereRoom;
      const target = side === 'inside' ? 'out'
        : w.rooms.portals.find(portal => portal.kind === 'window' && portal.seeThrough
          && portal.aperture?.x === atX && portal.aperture?.z === atZ
          && portal.aperture?.y === p.y)?.a ?? 'missing';
      return { name: p.id, side, source, target,
        visible: w.visibleRooms.has(target), calls: g.renderer.info.render.calls,
        triangles: g.renderer.info.render.triangles,
        glError: g.renderer.getContext().getError() };
    }, {p,side});
    views.push(view);
    if (!view.visible || view.glError !== 0)
      throw Error('Failed through-window view: '+JSON.stringify(view));
    if (view.calls > 150 || view.triangles > 750000)
      throw Error('Exceeded provisional PB01 mobile-low ceiling: '+JSON.stringify(view));
    await page.screenshot({ path: `${folder}/${p.id}-${side}.jpg`, type:'jpeg', quality:85 });
    console.log(JSON.stringify(view));
  }
  if (errors.length) throw Error('Page errors: '+errors.join('\n'));
  writeFileSync(folder+'/results.json',JSON.stringify({ registry, views, errors,
    samsungValidated:false, budget:{calls:150,triangles:750000} },null,2));
} finally {
  await browser.close();
  await server.close();
}
