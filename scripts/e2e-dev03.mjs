// DEV-03 art rollout: spatial validation + game-feel checks against the production build (npm run build && npm run preview).
// Usage: node scripts/e2e-dev03.mjs [baseUrl]   (E2E_OUT=dir for results)
// Generic placement rules over the WHOLE estate instead of per-object fixes: door clearance, every interactable
// reachable from a free standing spot with line of sight, no vegetation in building footprints, vegetation seated on
// the terrain, no furniture interpenetrating, footstep cadence on the real movement path.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/dev03';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const E = (page, fn, arg) => page.evaluate(fn, arg);

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });

const start = async (extra = {}) => {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate((save) => localStorage.setItem('fehluwe.save', JSON.stringify(save)), { version: 4, scene: 'estate', inventory: [], flags: { leftHome: true }, ...extra });
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);
};

// building footprints (plan x0, x1, z0, z1): manor, service wing, conservatory, cottage, sauna, jacuzzi, shed, BOSLUST hut
const FP = { manor: [72, 108, 80, 110], wing: [108, 116, 92, 110], cons: [116, 130, 94, 112], cottage: [20, 30, 152, 165], sauna: [132, 136, 100, 104], jacuzzi: [139, 142.6, 101, 104.6], shed: [39.5, 44.5, 37.2, 40.8], hut: [60.4, 65.6, 18.2, 20] };

try {
  await start();

  // ---------------------------------------------------------------- vegetation: footprints + seating on the terrain
  const veg = await E(page, (FP) => {
    const w = T.G().world, plan = w.scene.userData.vegPlan;
    if (!plan) return { missing: true };
    const inFP = (x, z, m) => Object.entries(FP).find(([, [x0, x1, z0, z1]]) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m)?.[0];
    const bad = [], floating = [];
    const check = (kind, list, margin) => list.forEach((t) => {
      const f = inFP(t.x, t.z, margin); if (f) bad.push(`${kind}@${t.x.toFixed(1)},${t.z.toFixed(1)} in ${f}`);
      if (typeof t.y === 'number') { const gy = w.col.ground(t.x, t.z); if (t.y - gy > 0.2 || gy - t.y > 0.45) floating.push(`${kind}@${t.x.toFixed(1)},${t.z.toFixed(1)} y ${t.y.toFixed(2)} ground ${gy.toFixed(2)}`); }
    });
    check('tree', plan.trees, 0.6); check('bush', plan.bushes, 0.2); check('stump', plan.stumps, 0.2);
    return { n: plan.trees.length + plan.bushes.length + plan.stumps.length, trees: plan.trees.length, bad: bad.slice(0, 8), nBad: bad.length, floating: floating.slice(0, 8), nFloat: floating.length, counts: w.scene.userData.woodCounts };
  }, FP);
  log('spatial: no tree / bush / stump inside a building footprint (trees with 0.6 m crown margin)', !veg.missing && veg.nBad === 0, JSON.stringify(veg.missing ? veg : { n: veg.n, bad: veg.bad, nBad: veg.nBad }));
  log('spatial: woodland plants seated on the terrain (no floating / buried trunks)', !veg.missing && veg.nFloat === 0, JSON.stringify(veg.missing ? veg : { floating: veg.floating, nFloat: veg.nFloat, counts: veg.counts }));
  log('woodland: dense forest rollout present (trees + saplings + understory + dead wood)', !veg.missing && veg.counts && veg.counts.trees > 1200 && veg.counts.saplings > 150 && veg.counts.plants > 5000 && veg.counts.logs > 20, JSON.stringify(veg.counts));

  // ---------------------------------------------------------------- door clearance (closed doors = the opening)
  const doors = await E(page, () => {
    const w = T.G().world, col = w.col, out = [], R = 0.22;
    const leaves = col.colliders.filter((c) => c.kind === 'box' && c.tag?.startsWith('door.') && c.occludes);
    for (const d of leaves) {
      const alongX = d.maxX - d.minX > d.maxZ - d.minZ, len = alongX ? d.maxX - d.minX : d.maxZ - d.minZ;
      if (len < 0.6) continue; // swing / sweep helpers
      const cx = (d.minX + d.maxX) / 2, cz = (d.minZ + d.maxZ) / 2, y0 = d.minY;
      const blocked = [];
      for (const side of [-1, 1]) for (const off of [0.55, 0.9]) {
        const x = alongX ? cx : cx + side * off, z = alongX ? cz + side * off : cz;
        const was = d.enabled; d.enabled = false; // the leaf itself (and its swing) never blocks its own doorway
        const y = col.supportHeight(x, z, y0 + 0.05, 0.42);
        const hit = Math.abs(y - y0) < 0.6 && col.overlaps(x, z, y, R, 1.7, 0.3);
        d.enabled = was;
        if (hit) blocked.push(`${side > 0 ? '+' : '-'}${off}`);
      }
      // a door is fine if at least the near standing spot on each side is free
      const nearBlocked = blocked.filter((b) => b.endsWith('0.55'));
      if (nearBlocked.length) out.push(`${d.tag} (${cx.toFixed(1)},${cz.toFixed(1)}) blocked ${blocked.join(' ')}`);
    }
    return { n: leaves.length, bad: out };
  });
  log('spatial: every doorway has a free standing spot on both sides (0.55 m, body r 0.22)', doors.bad.length === 0, JSON.stringify({ doors: doors.n, bad: doors.bad.slice(0, 10), nBad: doors.bad.length }));

  // ---------------------------------------------------------------- interactables reachable with line of sight
  const reach = await E(page, () => {
    const g = T.G(), w = g.world, col = w.col, bad = [];
    // door leaves and hatches move: a pickup behind a closed hatch is reached once it is open
    const leaves = new Set(col.colliders.filter((c) => c.tag && /^(door|kitchen\.hatch|.*hatch|.*lid)/.test(c.tag)));
    for (const it of w.items) {
      const ign = new Set([...leaves, ...(it.ignore ?? [])]);
      const f = it.focus; if (!f) continue;
      // large targets (the pool surface): aim at the nearest point of the hit volume, as the reticle does
      let hb = null;
      for (const h of it.hit ?? []) {
        if (!h.geometry) continue;
        h.updateWorldMatrix(true, false); h.geometry.computeBoundingBox();
        const bb = h.geometry.boundingBox.clone().applyMatrix4(h.matrixWorld);
        hb = hb ? hb.union(bb) : bb;
      }
      const big = hb && (hb.max.x - hb.min.x > 2 || hb.max.z - hb.min.z > 2);
      const ext = big ? Math.hypot(hb.max.x - hb.min.x, hb.max.z - hb.min.z) / 2 : 0;
      const cx0 = f.x, cz0 = -f.z;
      let ok = false;
      for (let a = 0; a < 24 && !ok; a++) for (const d0 of [0.7, 1.0, 1.3, 1.6, 2.0, 2.5, 3.0]) {
        if (d0 > it.reach) continue;
        const d = d0 + ext, x = cx0 + Math.cos((a / 24) * Math.PI * 2) * d, z = cz0 + Math.sin((a / 24) * Math.PI * 2) * d;
        const fx = big ? Math.min(Math.max(x, hb.min.x), hb.max.x) : f.x, fz = big ? Math.min(Math.max(z, -hb.max.z), -hb.min.z) : -f.z, fy = big ? hb.max.y : f.y;
        const y = col.supportHeight(x, z, fy + 0.2, 0.42);
        if (Math.hypot(Math.hypot(x - fx, z - fz), fy - (y + 1.62)) > it.reach + 0.5 || y - fy > 1.4) continue; // the reticle reaches from the eye
        if (col.overlaps(x, z, y, 0.22, 1.7, 0.3)) continue;
        if (col.segmentBlocked(x, y + 1.62, z, fx, fy, fz, ign)) continue;
        ok = true; break;
      }
      if (!ok) bad.push(`${it.id} @${f.x.toFixed(1)},${f.y.toFixed(1)},${(-f.z).toFixed(1)}`);
    }
    return { n: w.items.length, bad };
  });
  log('spatial: every interactable has a free standing spot within reach and line of sight', reach.bad.length === 0, JSON.stringify({ items: reach.n, bad: reach.bad.slice(0, 12), nBad: reach.bad.length }));

  // ---------------------------------------------------------------- furniture interpenetration (indoor, solid, non-wall)
  const furn = await E(page, (FP) => {
    const col = T.G().world.col, inside = (c) => Object.entries(FP).some(([k, [x0, x1, z0, z1]]) => ['manor', 'wing', 'cons', 'cottage'].includes(k) && c.minX > x0 && c.maxX < x1 && c.minZ > z0 && c.maxZ < z1);
    const box = (c) => c.kind === 'box' ? c : c.kind === 'circle' ? { minX: c.x - c.r, maxX: c.x + c.r, minZ: c.z - c.r, maxZ: c.z + c.r, minY: c.minY, maxY: c.maxY, circle: c } : null;
    // furniture = small solid non-occluding obstacles (walls / doors occlude; floors, ramps and stairs are excluded by size)
    const list = col.colliders.filter((c) => c.solid && !c.occludes && !c.tag && c.kind !== 'ellipse').map(box).filter((b) => b && inside(b) && (b.maxX - b.minX) < 3.2 && (b.maxZ - b.minZ) < 3.2 && b.maxY - b.minY > 0.25);
    const bad = [];
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const ox = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX), oz = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ), oy = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
      if (ox > 0.12 && oz > 0.12 && oy > 0.12) {
        if (a.circle && b.circle && Math.hypot(a.circle.x - b.circle.x, a.circle.z - b.circle.z) > a.circle.r + b.circle.r - 0.12) continue;
        // a part fully containing another is a compound collider (a stool under a counter), not two pieces colliding
        const contains = (p, q) => p.minX <= q.minX + 0.01 && p.maxX >= q.maxX - 0.01 && p.minZ <= q.minZ + 0.01 && p.maxZ >= q.maxZ - 0.01;
        if (contains(a, b) || contains(b, a)) continue;
        bad.push(`(${((a.minX + a.maxX) / 2).toFixed(1)},${((a.minZ + a.maxZ) / 2).toFixed(1)}) × (${((b.minX + b.maxX) / 2).toFixed(1)},${((b.minZ + b.maxZ) / 2).toFixed(1)}) y ${a.minY.toFixed(1)} overlap ${ox.toFixed(2)}×${oz.toFixed(2)}`);
      }
    }
    return { n: list.length, bad };
  }, FP);
  log('spatial: no two indoor furniture pieces interpenetrate (> 12 cm in x, z and y)', furn.bad.length === 0, JSON.stringify({ pieces: furn.n, bad: furn.bad.slice(0, 12), nBad: furn.bad.length }));

  // ---------------------------------------------------------------- footstep cadence on the real movement path
  const steps = await E(page, () => {
    const g = T.G(), p = g.player, ev = [];
    // listen on the real audio path (player gait → onStep → audio.step); a settle step is the soft one (gain < 0.6)
    let t = 0; const prev = g.audio.step;
    g.audio.step = (surface, gain, foot) => { ev.push({ t, gain, foot, settle: gain < 0.6, surface }); };
    const run = (pose, target, sec, runFlag = false) => {
      ev.length = 0; t = 0;
      p.setPose(pose); p.y = g.world.col.supportHeight(pose.x, pose.z, pose.y + 0.05, 0.42);
      g.autopilot = { x: target[0], z: target[1], run: runFlag };
      let dist = 0, last = { x: p.x, z: p.z };
      for (let i = 0; i < sec * 60; i++) { g.tick(1 / 60); t += 1 / 60; dist += Math.hypot(p.x - last.x, p.z - last.z); last = { x: p.x, z: p.z }; }
      g.autopilot = null;
      const full = ev.filter((e) => !e.settle), dts = full.slice(1).map((e, i) => e.t - full[i].t);
      const hz = dts.length ? 1 / (dts.reduce((a, b) => a + b, 0) / dts.length) : 0;
      return { n: full.length, hz: +hz.toFixed(2), stride: full.length > 1 ? +(dist / full.length).toFixed(2) : 0, minGap: dts.length ? +Math.min(...dts).toFixed(3) : 0, speed: +(dist / sec).toFixed(2) };
    };
    // the long open lawn south of the manor: straight, flat, no obstacles
    const walk = run({ x: 90.3, y: 0, z: 50, yaw: 0, pitch: 0 }, [90.3, 74], 4);
    const sprint = run({ x: 90.3, y: 0, z: 46, yaw: 0, pitch: 0 }, [90.3, 74], 3, true);
    // the grand stair (hall → gallery)
    const stair = run({ x: 94.3, y: 0.15, z: 86.0, yaw: 0, pitch: 0 }, [94.3, 95.0], 4);
    // turning on the spot: no translation → no steps
    ev.length = 0; p.setPose({ x: 90.3, y: 0, z: 60, yaw: 0, pitch: 0 });
    for (let i = 0; i < 120; i++) { p.yaw += 0.05; g.tick(1 / 60); }
    const turn = ev.length;
    g.audio.step = prev;
    return { walk, sprint, stair, turn };
  });
  log('footsteps: walk cadence of an adult at a normal pace (1.7–2.1 Hz, stride ≥ 0.6 m)', steps.walk.hz >= 1.7 && steps.walk.hz <= 2.1 && steps.walk.stride >= 0.6, JSON.stringify(steps.walk));
  log('footsteps: sprint faster but no machine-gun (≤ 2.8 Hz, never < 0.33 s apart)', steps.sprint.hz > steps.walk.hz && steps.sprint.hz <= 2.8 && steps.sprint.minGap >= 0.33, JSON.stringify(steps.sprint));
  log('footsteps: stairs keep a walking cadence (≤ 2.3 Hz)', steps.stair.n >= 3 && steps.stair.hz <= 2.3, JSON.stringify(steps.stair));
  log('footsteps: turning on the spot makes no steps', steps.turn === 0, `steps ${steps.turn}`);

  log('dev03: no console errors / page errors', problems.length === 0, problems.slice(0, 5).join(' | '));
} catch (e) {
  log('dev03 checks', false, e.message.split('\n')[0]);
}

await browser.close();
const failed = results.filter((r) => !r.ok);
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 1));
console.log(`\n${results.length - failed.length}/${results.length} DEV-03 checks passed`);
process.exit(failed.length ? 1 : 0);
