// Free-wall probe: for target rooms, cast horizontal rays from inside the room to each wall at several heights,
// every 0.2 m along the wall; a sample is free when the first hit is the wall plane (within 6 cm of the farthest
// surface along that ray) at all heights and no registered opening / art overlaps. Prints free spans >= 0.6 m.
import { chromium } from 'playwright-core';
const BASE = 'http://localhost:4173/Feh-Lu-We/';
const ROOMS = (process.env.ROOMS ?? 'kitchen,reis,sterren,workshop,storage,dining,cottageRoom,cottageEntry,gathering,hall,living,landing').split(',');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 640, height: 360 } })).newPage();
await page.goto(BASE + '?autotest=1');
await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'], flags: { leftHome: true, basementOpen: true, boslustOpen: true } })));
await page.reload(); await page.click('[data-cont]');
await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
// AT mode: exact wall face behind given slots ("x,y,z,yaw;..." with yaw = the art's facing in degrees): a ray from
// 1 m in front of the slot towards the wall, at the slot's height and ±0.3 m, prints the wall-face coordinate.
if (process.env.AT) {
  const rows = await page.evaluate((spec) => {
    const g = window.__game, scene = g.world.scene, V = g.camera.position.constructor, rc = new (g.raycaster.constructor)();
    scene.traverse((o) => { if (o.isMesh) o.visible = true; }); scene.updateMatrixWorld(true);
    return spec.split(';').map((q) => {
      const [x, y, z, yd] = q.split(',').map(Number), r = (yd * Math.PI) / 180, fx = Math.sin(r), fz = Math.cos(r);
      const hits = [-0.3, 0, 0.3].map((dy) => { rc.set(new V(x + fx, y + dy, -(z + fz)), new V(-fx, 0, fz)); rc.far = 2; const h = rc.intersectObjects(scene.children, true)[0]; return h ? +(1 - h.distance).toFixed(3) : null; });
      return { slot: q, faceOffset: hits }; // offset of the wall face from the slot point along the facing (+ = in front)
    });
  }, process.env.AT);
  for (const r of rows) console.log(r.slot.padEnd(28), 'wall face at', JSON.stringify(r.faceOffset), 'm along the facing');
  await browser.close(); process.exit(0);
}
const out = await page.evaluate((ROOMS) => {
  const g = window.__game;
  for (const m of []) {}
  const scene = g.world.scene; scene.traverse((o) => { if (o.isMesh) o.visible = true; }); scene.updateMatrixWorld(true);
  const rc = new (g.raycaster.constructor)();
  const reg = scene.userData.openings;
  const res = {};
  for (const id of ROOMS) {
    const r = g.world.rooms.rooms.find((q) => q.id === id);
    if (!r) { res[id] = 'no room'; continue; }
    const fy = r.y0 ?? 0;
    const floor = { g: 0.15, u: 3.35, a: 6.7, b: -3.2 }[r.floor] ?? fy;
    const hs = [1.1, 1.6, 2.1].map((h) => floor + h);
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    const walls = [
      { side: 'N(z1)', axis: 'x', f: r.z1, a0: r.x0, a1: r.x1, dir: [0, 1] },
      { side: 'S(z0)', axis: 'x', f: r.z0, a0: r.x0, a1: r.x1, dir: [0, -1] },
      { side: 'E(x1)', axis: 'z', f: r.x1, a0: r.z0, a1: r.z1, dir: [1, 0] },
      { side: 'W(x0)', axis: 'z', f: r.x0, a0: r.z0, a1: r.z1, dir: [-1, 0] },
    ];
    const wl = [];
    for (const w of walls) {
      const samples = [];
      for (let a = w.a0 + 0.2; a <= w.a1 - 0.2 + 1e-6; a += 0.2) {
        let dist = [];
        for (const y of hs) {
          // start 1.0 m inside the wall line
          const sx = w.axis === 'x' ? a : w.f - w.dir[0] * 1.0, sz = w.axis === 'x' ? w.f - w.dir[1] * 1.0 : a;
          rc.set(new g.camera.position.constructor(sx, y, -sz), new g.camera.position.constructor(w.dir[0], 0, -w.dir[1])); // three z = -plan z
          rc.far = 3;
          const hit = rc.intersectObjects(scene.children, true).find((h) => h.object.visible !== false && !(h.object.material?.transparent && h.object.material.opacity < 0.5));
          dist.push(hit ? +hit.distance.toFixed(2) : null);
        }
        samples.push({ a: +a.toFixed(2), d: dist });
      }
      wl.push({ ...w, samples });
    }
    res[id] = { bounds: [r.x0, r.x1, r.z0, r.z1], floor, walls: wl, art: reg.art.filter((q) => q.f >= Math.min(r.x0, r.z0) - 50), openings: reg.openings.length };
  }
  return { res, art: reg.art, openings: reg.openings };
}, ROOMS);
// post-process: wall surface = the max common distance (most samples' distance); free = all heights within 0.06 of it
for (const id of ROOMS) {
  const R = out.res[id]; if (typeof R === 'string') { console.log(id, R); continue; }
  console.log(`\n## ${id} bounds x ${R.bounds[0]}–${R.bounds[1]} z ${R.bounds[2]}–${R.bounds[3]} floor ${R.floor}`);
  for (const w of R.walls) {
    const all = w.samples.flatMap((s) => s.d).filter((d) => d != null);
    const hist = {}; for (const d of all) hist[d.toFixed(1)] = (hist[d.toFixed(1)] ?? 0) + 1;
    const wallD = +Object.entries(hist).sort((a, b) => b[1] - a[1])[0]?.[0];
    const opn = out.openings.filter((o) => o.axis === w.axis && Math.abs(o.f - w.f) < 0.5);
    const art = out.art.filter((o) => o.axis === w.axis && Math.abs(o.f - w.f) < 0.5);
    const free = w.samples.map((s) => s.d.every((d) => d != null && Math.abs(d - wallD) < 0.08)
      && !opn.some((o) => s.a > o.a0 - 0.4 && s.a < o.a1 + 0.4 && o.y1 > R.floor + 0.9 && o.y0 < R.floor + 2.4)
      && !art.some((o) => s.a > o.a0 - 0.3 && s.a < o.a1 + 0.3));
    const spans = []; let st = null;
    w.samples.forEach((s, i) => { if (free[i] && st == null) st = s.a; if ((!free[i] || i === w.samples.length - 1) && st != null) { const e = free[i] ? s.a : w.samples[i - 1].a; if (e - st >= 0.6) spans.push(`${st}–${e}`); st = null; } });
    const surf = w.axis === 'x' ? (w.f - w.dir[1] * 1.0 + w.dir[1] * wallD) : (w.f - w.dir[0] * 1.0 + w.dir[0] * wallD);
    console.log(`  ${w.side} wall surface ${w.axis === 'x' ? 'z' : 'x'}≈${surf.toFixed(2)}  free: ${spans.join(', ') || '-'}  | art: ${art.map((q) => q.id).join(' ')}`);
  }
}
await browser.close();
