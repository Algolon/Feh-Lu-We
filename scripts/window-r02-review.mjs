// WINDOW-R02 review on the actual built gameplay scene. Software WebGL is NOT an Android FPS test.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const folder = 'docs/development/workstreams/window-r02/review';
mkdirSync(folder, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: false } });
await server.listen();
const browser = await chromium.launch({
  ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const errors = [], views = [], productionBaseline = JSON.parse(readFileSync('docs/development/workstreams/window-r02/review/production-baseline.json','utf8'));
const budgetExceptions = [];
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
      glassColliderTags: 0, physicallyBlocked: 0, visuallyClear: 0, obstructed: [] };
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
      else {
        const [ax, ay, az, bx, by, bz] = points;
        const blockers = [];
        const hit = (c) => {
          const a=[ax,ay,az], d=[bx-ax,by-ay,bz-az];
          const mn=[c.minX,c.minY,c.minZ], mx=[c.maxX,c.maxY,c.maxZ];
          let t0=0.001,t1=0.999;
          for(let i=0;i<3;i++){
            if(Math.abs(d[i])<1e-9){if(a[i]<mn[i]||a[i]>mx[i])return false;}
            else {let l=(mn[i]-a[i])/d[i],h=(mx[i]-a[i])/d[i];if(l>h)[l,h]=[h,l];t0=Math.max(t0,l);t1=Math.min(t1,h);if(t0>t1)return false;}
          } return true;
        };
        w.col.forEachNear(Math.min(ax,bx),Math.max(ax,bx),Math.min(az,bz),Math.max(az,bz), c => {
          if (!c.enabled || !c.occludes || w.visualPassThrough.has(c)) return;
          if (c.kind==='box'&&hit(c)) blockers.push({tag:c.tag,bounds:[c.minX,c.maxX,c.minY,c.maxY,c.minZ,c.maxZ]});
        });
        result.obstructed.push({room:portal.a,aperture:portal.aperture,blockers});
      }
    }
    return result;
  });
  console.log('WINDOW-R02 registrar QA:',JSON.stringify(registry));
  if (registry.portals !== 44 || registry.physicallyBlocked !== 44 || registry.visuallyClear !== 44)
    throw Error('All facade glasses must block motion but transmit visibility: ' + JSON.stringify(registry));
  // WINDOW-R02-R03: verify the actual mahogany canvas in the real loaded gameplay scene.
  const mahogany = await page.evaluate(() => {
    const materials = new Set();
    window.__game.world.scene.traverse(obj => {
      if (!obj.isMesh) return;
      for (const m of (Array.isArray(obj.material) ? obj.material : [obj.material]))
        if (m?.name === 'WINDOW-R02-MahoganySill') materials.add(m);
    });
    if (materials.size !== 1) throw Error('Expected one shared timber sill material, got ' + materials.size);
    const material = [...materials][0], canvas = material.map?.image;
    if (!canvas?.getContext) throw Error('Mahogany texture not found in game render');
    const rgba = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let red=0, green=0, blue=0, lengthwise=0, across=0, n=0;
    for (let y=12; y<canvas.height-12; y+=13) for(let x=12; x<canvas.width-12; x+=13) {
      const i=(y*canvas.width+x)*4;
      red+=rgba[i]; green+=rgba[i+1]; blue+=rgba[i+2];
      lengthwise+=Math.abs(rgba[i] - rgba[i+4*6]);
      across+=Math.abs(rgba[i] - rgba[i+4*canvas.width*6]); n++;
    }
    const result={ rgb:[red/n,green/n,blue/n], lengthwise:lengthwise/n, across:across/n };
    if (!(result.rgb[0] > 85 && result.rgb[0] < 122 &&
       result.rgb[1] < 70 && result.rgb[1] > 30 &&
       result.rgb[2] < result.rgb[1] && result.rgb[1] < result.rgb[0] &&
       result.across > result.lengthwise * 1.15 &&
       result.across < 4.0))
      throw Error('Mahogany hue/grain check failed: '+JSON.stringify(result));
    return result;
  });
  console.log('Real in-game mahogany texture:', JSON.stringify(mahogany));
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
    const reference = productionBaseline.results.find(b => b.id === p.id && b.side === side);
    if (!reference) throw Error('No exact production baseline for '+p.id+'/'+side);
    const triangleDelta = view.triangles - reference.triangles;
    const callDelta = view.calls - reference.calls;
    // More triangles are EXPECTED through a formerly opaque window. The essential
    // quality gate is the absolute PB01 ceiling, not equivalence with an opaque pane.
    // Still retain matched production deltas for diagnosing new cost.
    if (view.calls > 150 || view.triangles > 750000)
      throw Error('WINDOW-R02 budget exceeded with visible rooms: '+JSON.stringify({view,reference,triangleDelta,callDelta}));
    if (triangleDelta > 20000 || callDelta > 5)
      budgetExceptions.push({view,reference,triangleDelta,callDelta});
    await page.screenshot({ path: `${folder}/${p.id}-${side}.jpg`, type:'jpeg', quality:85 });
    console.log(JSON.stringify(view));
  }
  // WINDOW-R02-R04: real game close-ups of the mahogany sill only.
  const sills = [];
  for (const p of [poses[1], poses[2]]) {
    const view = await page.evaluate(p => {
      const g = window.__game, w = g.world;
      g.settings.quality = 'low'; g.applyQuality(true);
      const nx = p.axis === 'z' ? p.ext : 0, nz = p.axis === 'x' ? p.ext : 0;
      const atX = p.axis === 'x' ? p.at : p.f;
      const atZ = p.axis === 'x' ? p.f : p.at;
      const camX = atX - nx * 0.82 + (p.axis === 'x' ? 0.15 : 0);
      const camZ = atZ - nz * 0.82 + (p.axis === 'z' ? 0.15 : 0);
      g.camera.position.set(camX, 1.46, -camZ);
      g.camera.lookAt(atX, 1.02, -atZ);
      g.camera.updateMatrixWorld(true);
      w.updateCulling(g.camera.position, g.camera);
      g.renderer.render(w.scene, g.camera);
      return { site: p.id, calls: g.renderer.info.render.calls,
        triangles: g.renderer.info.render.triangles,
        glError: g.renderer.getContext().getError() };
    }, p);
    if (view.glError || view.calls > 150 || view.triangles > 750000)
      throw Error('Mahogany sill closeup failed: ' + JSON.stringify(view));
    await page.screenshot({path:`${folder}/sill-${p.id}.jpg`,type:'jpeg',quality:92});
    sills.push(view);
    console.log('sill', JSON.stringify(view));
  }
  if (errors.length) throw Error('Page errors: '+errors.join('\\n'));
  writeFileSync(folder+'/results.json',JSON.stringify({registry,views,sills,mahogany,productionBaselineCommit:productionBaseline.commit,budgetExceptions,errors,
    samsungValidated:false,budget:{calls:150,triangles:750000}},null,2));
} finally {
  await browser.close();
  await server.close();
}
