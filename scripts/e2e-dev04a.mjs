// DEV-04A visual correctness & spatial cohesion: browser suite against the production build (npm run build && npm run preview).
// Usage: node scripts/e2e-dev04a.mjs [baseUrl]   (E2E_OUT=dir for results)
// Generic contracts over the WHOLE estate where they can be checked robustly (no pixel comparisons):
//   - wall art never in a door / window / door sweep; no tipped cylinder built through `cyl` (support contract);
//   - every registered door opening is clear from its threshold up (exact triangle–box test against all drawn geometry
//     with every door open), so a plinth, a glazing rail or a painting in a doorway fails the suite;
//   - no two same-facing coplanar overlapping surfaces in the corrected regions (sink, thresholds, doors, landing);
//   - the corrected routes are walked through the real movement path; legacy save poses still land on valid support;
//   - canonical ids, checkpoints and the save schema are unchanged; representative render budgets hold.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/dev04a';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const baseline = JSON.parse(readFileSync(new URL('./dev04a-baseline.json', import.meta.url), 'utf8'));
// DEV-04C: the baseline ids plus exactly the documented additions (scripts/dev04c-additions.json); nothing else may appear or go
const additions = JSON.parse(readFileSync(new URL('./dev04c-additions.json', import.meta.url), 'utf8')).interactables;
const expectedIds = [...baseline.interactables, ...additions].sort();
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const E = (page, fn, arg) => page.evaluate(fn, arg);

// layout records the suite checks against (src/world/layout.ts)
const L = {
  wickerman: { x: 180, z: 55, r: 6.0, y: 1.2, old: { x: 167, z: 54 } },
  wickermanSide: [[167.9, 57.6], [170.9, 59.7], [174.2, 60.6], [177.0, 60.1]],
  sauna: { floor: 0.65, steps: { x0: 133.3, x1: 134.7, zDoor: 104, zLanding: 104.9, zFoot: 105.54 } },
  nook: { x1: 103.6 }, AF: 6.65, UF: 3.35,
};
const ALL_DOORS = ['door.front', 'door.consEast', 'door.consWest', 'door.service', 'door.atticStair', 'door.storage', 'door.guestWC', 'door.utility', 'door.sterren', 'door.reis', 'door.atticRear', 'door.sauna', 'door.kitchenBack', 'door.billiardOut', 'door.workshopOut', 'door.cottage', 'door.atticStore', 'door.library', 'door.billiard', 'door.livLib', 'door.workshop', 'door.pantry', 'door.libGallery', 'door.bath', 'door.botanic', 'door.linen'];

const W_HELPERS = `window.W = {
  walk(points, run = false) {
    const g = T.G(); let maxDy = 0, minY = Infinity, maxY = -Infinity, prevY = g.player.y, dist = 0;
    for (const [x, z] of points) {
      g.autopilot = { x, z, run };
      let still = 0, last = { x: g.player.x, z: g.player.z }, ok = false;
      for (let i = 0; i < 90 * 30; i++) {
        g.tick(1 / 30);
        const y = g.player.y; maxDy = Math.max(maxDy, Math.abs(y - prevY)); prevY = y; minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        const m = Math.hypot(g.player.x - last.x, g.player.z - last.z); dist += m;
        if (Math.hypot(g.player.x - x, g.player.z - z) < 0.3) { ok = true; break; }
        still = m < 0.002 ? still + 1 / 30 : 0; last = { x: g.player.x, z: g.player.z };
        if (still > 1.5) { g.autopilot = null; throw new Error('stuck walking to (' + x + ',' + z + ') at ' + JSON.stringify(T.pos())); }
      }
      g.autopilot = null;
      if (!ok) throw new Error('timeout walking to (' + x + ',' + z + ') at ' + JSON.stringify(T.pos()));
    }
    T.tick(2);
    return { maxDy: +maxDy.toFixed(3), minY: +minY.toFixed(2), maxY: +maxY.toFixed(2), dist: +dist.toFixed(1), pos: T.pos(), room: T.G().world.hereRoom };
  },
  push(dx, dz, sec = 1.6) {
    const g = T.G(); const y0 = g.player.y;
    g.autopilot = { x: g.player.x + dx, z: g.player.z + dz };
    for (let i = 0; i < sec * 30; i++) g.tick(1 / 30);
    g.autopilot = null; T.tick(2);
    return { ...T.pos(), y0: +y0.toFixed(2) };
  },
  /** Triangles of every drawn static mesh (world space, plan z = -three z) whose AABB meets one of the boxes. */
  triangles(boxes) {
    const out = boxes.map(() => []), scene = T.G().world.scene, v = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.isBatchedMesh || o.userData.hit) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (mats.every((m) => m.visible === false)) return;
      const g = o.geometry, pos = g.attributes.position; if (!pos) return;
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
      const hits = boxes.map((b, i) => (bb.max.x >= b.min[0] && bb.min.x <= b.max[0] && bb.max.y >= b.min[1] && bb.min.y <= b.max[1] && bb.max.z >= b.min[2] && bb.min.z <= b.max[2] ? i : -1)).filter((i) => i >= 0);
      if (!hits.length) return;
      const e = o.matrixWorld.elements, idx = g.index ? g.index.array : null, n = idx ? idx.length : pos.count, col = g.attributes.color;
      const gm = (t) => { const gr = g.groups?.find((q) => t >= q.start && t < q.start + q.count); return mats[gr ? gr.materialIndex : 0] ?? mats[0]; };
      for (let t = 0; t < n; t += 3) {
        for (let k = 0; k < 3; k++) {
          const j = idx ? idx[t + k] : t + k, x = pos.getX(j), y = pos.getY(j), z = pos.getZ(j);
          v[k][0] = e[0] * x + e[4] * y + e[8] * z + e[12]; v[k][1] = e[1] * x + e[5] * y + e[9] * z + e[13]; v[k][2] = e[2] * x + e[6] * y + e[10] * z + e[14];
        }
        for (const i of hits) {
          const b = boxes[i];
          if (Math.max(v[0][0], v[1][0], v[2][0]) < b.min[0] || Math.min(v[0][0], v[1][0], v[2][0]) > b.max[0] || Math.max(v[0][1], v[1][1], v[2][1]) < b.min[1] || Math.min(v[0][1], v[1][1], v[2][1]) > b.max[1] || Math.max(v[0][2], v[1][2], v[2][2]) < b.min[2] || Math.min(v[0][2], v[1][2], v[2][2]) > b.max[2]) continue;
          // look = material + vertex colour + texture: two coplanar faces with the same look shade identically (no visible fight)
          const j0 = idx ? idx[t] : t, m = gm(t), mc = m.color ? m.color.getHexString() : '';
          const look = m.uuid + ':' + mc + ':' + (col ? [col.getX(j0), col.getY(j0), col.getZ(j0)].map((q) => q.toFixed(2)).join(',') : '');
          // decals (transparent, polygon-offset overlays such as the path verge) are drawn over a surface by design
          if (m.transparent && m.polygonOffset && m.polygonOffsetFactor < 0) continue;
          out[i].push({ v: v.map((p) => [...p]), chunk: o.userData.chunk ?? o.parent?.userData?.chunk ?? o.name ?? '?', transparent: mats.some((m) => m.transparent), look });
        }
      }
    });
    return out;
  },
};
/** Akenine-Möller triangle / AABB overlap (separating axis theorem; 13 axes). */
window.triBox = (b, tri) => {
  const c = [0, 1, 2].map((k) => (b.min[k] + b.max[k]) / 2), h = [0, 1, 2].map((k) => (b.max[k] - b.min[k]) / 2);
  const p = tri.map((q) => [q[0] - c[0], q[1] - c[1], q[2] - c[2]]);
  const sub = (a, d) => [a[0] - d[0], a[1] - d[1], a[2] - d[2]], cross = (a, d) => [a[1] * d[2] - a[2] * d[1], a[2] * d[0] - a[0] * d[2], a[0] * d[1] - a[1] * d[0]];
  const dot = (a, d) => a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
  const edges = [sub(p[1], p[0]), sub(p[2], p[1]), sub(p[0], p[2])], U = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const axes = [...U, cross(edges[0], edges[1])];
  for (const e of edges) for (const u of U) axes.push(cross(e, u));
  for (const a of axes) {
    if (Math.abs(a[0]) + Math.abs(a[1]) + Math.abs(a[2]) < 1e-9) continue;
    const pr = p.map((q) => dot(q, a)), r = h[0] * Math.abs(a[0]) + h[1] * Math.abs(a[1]) + h[2] * Math.abs(a[2]);
    if (Math.min(...pr) > r - 1e-6 || Math.max(...pr) < -r + 1e-6) return false;
  }
  return true;
};
/** Same-facing coplanar triangles whose areas overlap INSIDE the box (a z-fighting pair): both are clipped to the box first. */
window.coplanarPairs = (tris, box, occ = []) => {
  const sub = (a, d) => [a[0] - d[0], a[1] - d[1], a[2] - d[2]], cross = (a, d) => [a[1] * d[2] - a[2] * d[1], a[2] * d[0] - a[0] * d[2], a[0] * d[1] - a[1] * d[0]];
  const clip = (poly) => { // Sutherland–Hodgman against the six faces of the box
    let P = poly;
    for (let k = 0; k < 3 && P.length; k++) for (const [lim, sgn] of [[box.min[k], 1], [box.max[k], -1]]) {
      const out = [];
      for (let i = 0; i < P.length; i++) {
        const a = P[i], b = P[(i + 1) % P.length], da = (a[k] - lim) * sgn, db = (b[k] - lim) * sgn;
        if (da >= 0) out.push(a);
        if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); }
      }
      P = out;
    }
    return P;
  };
  const info = tris.map((t) => { const n = cross(sub(t.v[1], t.v[0]), sub(t.v[2], t.v[0])), l = Math.hypot(...n); if (l < 1e-8) return null; const u = n.map((q) => q / l), P = clip(t.v); return P.length >= 3 ? { t, n: u, d: u[0] * t.v[0][0] + u[1] * t.v[0][1] + u[2] * t.v[0][2], P } : null; }).filter(Boolean);
  const proj = (q, ax) => (ax === 0 ? [q[1], q[2]] : ax === 1 ? [q[0], q[2]] : [q[0], q[1]]);
  const area2 = (A) => { let s2 = 0; for (let i = 0; i < A.length; i++) { const a = A[i], b = A[(i + 1) % A.length]; s2 += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s2) / 2; };
  const sep = (A, B) => { // 2D SAT for convex polygons (touching counts as separated)
    for (const P of [A, B]) for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], nx = b[1] - a[1], ny = a[0] - b[0], l = Math.hypot(nx, ny);
      if (l < 1e-9) continue;
      const pa = A.map((q) => (q[0] * nx + q[1] * ny) / l), pb = B.map((q) => (q[0] * nx + q[1] * ny) / l);
      if (Math.max(...pa) <= Math.min(...pb) + 2e-4 || Math.max(...pb) <= Math.min(...pa) + 2e-4) return true;
    }
    return false;
  };
  // a face that looks INTO solid geometry is never seen (the back of a plinth against the wall, the bottom of a slab
  // in the ground): from a point just in front of the overlap, the first surface along the normal is hit from behind
  const dot3 = (a, d) => a[0] * d[0] + a[1] * d[1] + a[2] * d[2];
  // (or it opens only onto a closed pocket: every ray out of it — along the normal and tilted 45° four ways — hits
  // something within 0.6 m, e.g. the void under a floor between a plinth, a wall base and a step)
  const cast = (o, dir) => {
    let best = Infinity, back = false;
    for (const t of occ) {
      const e1 = sub(t.v[1], t.v[0]), e2 = sub(t.v[2], t.v[0]), h = cross(dir, e2), a = dot3(e1, h);
      if (Math.abs(a) < 1e-12) continue;
      const f = 1 / a, s = sub(o, t.v[0]), u = f * dot3(s, h); if (u < -1e-9 || u > 1 + 1e-9) continue;
      const q = cross(s, e1), v = f * dot3(dir, q); if (v < -1e-9 || u + v > 1 + 1e-9) continue;
      const d = f * dot3(e2, q); if (d <= 1e-6 || d >= best || d > 1.2) continue;
      best = d; back = dot3(cross(e1, e2), dir) > 0;
    }
    return { d: best, back };
  };
  const buried = (p, n) => {
    const o = [p[0] + n[0] * 0.003, p[1] + n[1] * 0.003, p[2] + n[2] * 0.003];
    const first = cast(o, n);
    if (first.back) return true;
    const t1 = Math.abs(n[1]) < 0.9 ? cross(n, [0, 1, 0]) : cross(n, [1, 0, 0]), l1 = Math.hypot(...t1), u1 = t1.map((q) => q / l1), u2 = cross(n, u1);
    const dirs = [n, ...[u1, u2].flatMap((u) => [1, -1].map((sg) => n.map((q, k) => (q + sg * u[k]) / Math.SQRT2)))];
    return dirs.every((dir) => cast(o, dir).d < 0.6);
  };
  const clip2 = (A, B) => { // convex A ∩ convex B (2D)
    let s2 = 0; for (let i = 0; i < B.length; i++) { const a = B[i], b = B[(i + 1) % B.length]; s2 += a[0] * b[1] - b[0] * a[1]; }
    const sg = Math.sign(s2) || 1; let P = A;
    for (let i = 0; i < B.length && P.length; i++) {
      const a = B[i], b = B[(i + 1) % B.length], side = (q) => sg * ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]));
      const out = [];
      for (let j = 0; j < P.length; j++) {
        const c0 = P[j], c1 = P[(j + 1) % P.length], d0 = side(c0), d1 = side(c1);
        if (d0 >= 0) out.push(c0);
        if ((d0 >= 0) !== (d1 >= 0)) { const t = d0 / (d0 - d1); out.push([c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t]); }
      }
      P = out;
    }
    return P;
  };
  const lift = (q, ax, n, d) => { // 2D point on the projection plane back onto the face's plane
    if (ax === 0) return [(d - n[1] * q[0] - n[2] * q[1]) / n[0], q[0], q[1]];
    if (ax === 1) return [q[0], (d - n[0] * q[0] - n[2] * q[1]) / n[1], q[1]];
    return [q[0], q[1], (d - n[0] * q[0] - n[1] * q[1]) / n[2]];
  };
  const pairs = [];
  for (let i = 0; i < info.length; i++) for (let j = i + 1; j < info.length; j++) {
    const a = info[i], b = info[j];
    // coplanar: parallel, and b's vertices within 3 mm of a's plane (a path's rank lift of 5 mm is a separate layer)
    if (a.n[0] * b.n[0] + a.n[1] * b.n[1] + a.n[2] * b.n[2] < 0.9999 || b.t.v.some((q) => Math.abs(a.n[0] * q[0] + a.n[1] * q[1] + a.n[2] * q[2] - a.d) > 0.003)) continue;
    const ax = [0, 1, 2].reduce((m, k) => (Math.abs(a.n[k]) > Math.abs(a.n[m]) ? k : m), 0);
    const A = a.P.map((q) => proj(q, ax)), B = b.P.map((q) => proj(q, ax));
    if (area2(A) < 1e-6 || area2(B) < 1e-6) continue;
    if (sep(A, B)) continue;
    const I = clip2(A, B);
    if (I.length >= 3 && occ.length) { const m2 = I.reduce((q, r) => [q[0] + r[0] / I.length, q[1] + r[1] / I.length], [0, 0]); if (buried(lift(m2, ax, a.n, a.d), a.n)) continue; }
    pairs.push({ d: [+a.d.toFixed(4), +b.d.toFixed(4)], n: a.n.map((q) => +q.toFixed(2)), looks: [a.t.look.slice(9), b.t.look.slice(9)], same: a.t.look === b.t.look, chunks: [a.t.chunk, b.t.chunk], a: a.P.map((q) => q.map((v) => +v.toFixed(3))), b: b.P.map((q) => q.map((v) => +v.toFixed(3))) });
  }
  return pairs;
};`;

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && m.text().startsWith('DEV-04A'))) problems.push(`console: ${m.text()}`); });

const start = async (extra = {}) => {
  await page.goto(BASE + '?autotest=1');
  const open = Object.fromEntries(ALL_DOORS.map((d) => [d, true]));
  await page.evaluate((save) => localStorage.setItem('fehluwe.save', JSON.stringify(save)), { version: 4, scene: 'estate', inventory: ['frontKey', 'consKey', 'torch'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open, ...extra });
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);
  await page.evaluate(W_HELPERS);
};
const step = async (name, fn, arg) => { try { return await E(page, fn, arg); } catch (e) { log(name, false, String(e.message ?? e).slice(0, 300)); return null; } };

const BUDGET_VIEWS = { atticNook: [96.4, 6.65, 94.2, 1.08], atticCommon: [86, 6.65, 97.5, 0], conservatoryInside: [126.3, 0.15, 106, 1.57], conservatoryDoorDeck: [137, 0.15, 106, -1.57], wellnessDeck: [132, 0.15, 114, 2.27], saunaAccess: [137.6, 0.15, 112.4, -2.44], wickermanClearing: [176.4, 1.2, 59.9, 2.53], wickermanPath: [158, 1.0, 47, 1.08], frontForecourt: [90, 0, 66, 0], arrivalCourt: [88, 0, 62, 0.07], portugalTerrace: [25, 4.15, 152.8, 0.35], portugalApproach: [16.6, 4.0, 146.8, 0.44], golfVicinity: [66, 0, 57, -2.62], golfSpur: [56, 0, 47.6, 1.22] };
/** Draw calls / triangles at low quality with the standard capture door state (front door + Copacabana double door open). */
async function measureBudget() {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['frontKey', 'consKey'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open: { 'door.front': true, 'door.consEast': true, 'door.atticStair': true } })));
  await page.reload(); await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);
  return E(page, async (V) => {
    const g = T.G(), out = {};
    for (const [k, [x, y, z, yaw]] of Object.entries(V)) {
      g.player.setPose({ x, y, z, yaw, pitch: 0.05 }); g.player.y = g.world.col.supportHeight(x, z, y + 0.05, 0.42);
      for (let i = 0; i < 20; i++) g.tick(1 / 30);
      await new Promise((r) => setTimeout(r, 100));
      g.settings.quality = 'low'; g.applyQuality(true); g.tick(1 / 30); g.renderer.render(g.world.scene, g.camera);
      const r = g.renderer.info.render; out[k] = { calls: r.calls, triangles: r.triangles };
    }
    return out;
  }, BUDGET_VIEWS);
}
if (process.env.BUDGET_ONLY) { console.log(JSON.stringify(await measureBudget())); await browser.close(); process.exit(0); }

try {
  await start();

  // ---------------------------------------------------------------- 1. contracts registered during the build
  const reg = await E(page, () => {
    const u = T.G().world.scene.userData, o = u.openings;
    return { openings: o.openings.length, doors: o.openings.filter((q) => q.kind === 'door').length, windows: o.openings.filter((q) => q.kind === 'window').length, sweeps: o.sweeps.length, art: o.art.map((a) => a.id), conflicts: u.artConflicts, support: u.supportWarnings };
  });
  log('wall-art contract: no painting / panel in a door opening, a window or a door sweep (whole estate)', reg.conflicts.length === 0 && reg.art.length >= 20 && reg.windows >= 50 && reg.sweeps >= 38, JSON.stringify({ conflicts: reg.conflicts, art: reg.art.length, doors: reg.doors, windows: reg.windows, sweeps: reg.sweeps }));
  log('wall art: the Sterren-door and dining-window paintings moved; the old name boards are gone, the bar sign is up', reg.art.includes('painting@85.12,86.20') && !reg.art.includes('painting@85.12,90.00') && reg.art.includes('painting@104.80,91.92') && !reg.art.includes('painting@107.55,89.70') && !reg.art.includes('panel@114.50,101.10') && !reg.art.includes('panel@130.82,108.70') && reg.art.includes('panel@128.60,109.35'), JSON.stringify(reg.art.filter((a) => /85\.12|104\.80|107\.55|114\.50|130\.82|128\.60/.test(a))));
  log('support contract: no long cylinder tipped onto its side through cyl() (lying logs / rods are centred)', reg.support.length === 0, JSON.stringify(reg.support));

  // ---------------------------------------------------------------- 2. every door opening clear from its threshold up (all doors open)
  const clear = await step('door passages', () => {
    const g = T.G(), u = g.world.scene.userData;
    for (const id of g.world.byId.keys()) if (id.startsWith('door.')) g.state.open[id] = true;
    g.world.syncAll(); for (let i = 0; i < 90; i++) g.tick(1 / 30);
    const ops0 = u.openings.openings.filter((q) => q.kind === 'door' && q.a1 - q.a0 > 0.5);
    // the walking level at the opening (an exterior wall starts at +0.0 under a +0.15 floor; an upper partition at the
    // slab's underside): the highest support through the opening, sampled across the wall
    const col = g.world.col;
    const levels = (q) => { const a = (q.a0 + q.a1) / 2; return [-0.5, 0, 0.5].map((dn) => { const [x, z] = q.axis === 'x' ? [a, q.f + dn] : [q.f + dn, a]; return col.supportHeight(x, z, q.y0 + 0.6, 0.05); }).filter(Number.isFinite); };
    const level = (q) => Math.max(q.y0, ...levels(q));
    // an opening on a ramp or stair (walking levels across it differ by > 8 cm) is checked by walking it, not by a box
    const sloped = u.openings.openings.filter((q) => q.kind === 'door' && q.a1 - q.a0 > 0.5 && (() => { const l = levels(q); return l.length > 1 && Math.max(...l) - Math.min(...l) > 0.08; })());
    const ops = ops0.filter((q) => !sloped.includes(q));
    // passage box (three coords): inset from the jambs and the head, from 8 cm over the walking level, through the wall ± 0.35 m
    const boxes = ops.map((q) => {
      const a0 = q.a0 + 0.16, a1 = q.a1 - 0.16, n0 = q.f - q.t / 2 - 0.35, n1 = q.f + q.t / 2 + 0.35, y0 = level(q) + 0.08, y1 = q.y1 - 0.1;
      return q.axis === 'x' ? { min: [a0, y0, -n1], max: [a1, y1, -n0] } : { min: [n0, y0, -a1], max: [n1, y1, -a0] };
    });
    const tris = W.triangles(boxes), bad = [];
    ops.forEach((q, i) => {
      const hit = tris[i].filter((t) => triBox(boxes[i], t.v));
      if (hit.length) bad.push({ at: `${q.axis}${q.f.toFixed(2)}:${q.a0.toFixed(2)}-${q.a1.toFixed(2)}@${q.y0.toFixed(2)}`, id: q.id ?? null, n: hit.length, chunks: [...new Set(hit.map((t) => t.chunk))].slice(0, 4), y: +Math.min(...hit.flatMap((t) => t.v.map((p) => p[1]))).toFixed(2) });
    });
    return { n: ops.length, sloped: sloped.map((q) => `${q.axis}${q.f.toFixed(2)}:${q.a0.toFixed(2)}@${q.y0.toFixed(2)}`), bad };
  });
  if (clear) log('openings: every registered door / passage opening is clear from its threshold up with all doors open (exact triangle–box test)', clear.n >= 40 && clear.bad.length === 0, JSON.stringify({ openings: clear.n, slopedWalked: clear.sloped, blocked: clear.bad.slice(0, 8), nBlocked: clear.bad.length }));

  // ---------------------------------------------------------------- 3. surface ownership: no same-facing coplanar overlaps in corrected regions
  const regions = {
    kitchenSink: [104.45, 105.55, 0.6, 1.0, 108.85, 109.62], frontThreshold: [88.9, 91.1, 0.05, 0.6, 79.6, 80.6], consDoubleDoor: [129.5, 130.5, 0.05, 2.8, 104.5, 107.5],
    cottageDoor: [24.3, 25.7, 4.05, 4.6, 156.7, 157.6], cottageLanding: [16.6, 20.2, 3.72, 4.3, 150.8, 153.8], golfMat: [60.65, 62.65, -0.1, 0.2, 48.8, 52.0] /* DEV-04B-R: the spur → mat junction moved with the re-centred mat (x 61.65) */,
    forecourtWest: [76.5, 81.5, -0.1, 0.2, 63.5, 67.5], forecourtEast: [101.5, 106.0, -0.1, 0.2, 63.5, 67.5], saunaSteps: [133.2, 134.8, 0.16, 0.8, 103.9, 105.7], // from the deck surface up (the pre-DEV-04A deck cut-out under the barrel is out of sight)
  };
  const cop = await step('coplanar', (R) => {
    const names = Object.keys(R), boxes = names.map((k) => { const [x0, x1, y0, y1, z0, z1] = R[k]; return { min: [x0, y0, -z1], max: [x1, y1, -z0] }; });
    const tris = W.triangles(boxes), occ = W.triangles(boxes.map((b) => ({ min: b.min.map((q) => q - 1.2), max: b.max.map((q) => q + 1.2) })));
    return Object.fromEntries(names.map((k, i) => { const p = coplanarPairs(tris[i], boxes[i], occ[i]); const f = p.filter((q) => !q.same); return [k, { tris: tris[i].length, pairs: f.length, sameLook: p.length - f.length, sample: f.slice(0, 2), n: f.slice(0, 2).map((q) => q.n) }]; }));
  }, regions);
  if (cop) log('surface ownership: no z-fighting (same-facing coplanar overlapping surfaces of a different look) at the sink, thresholds, double door, landing, junctions, sauna steps', Object.values(cop).every((r) => r.pairs === 0 && r.tris > 0), JSON.stringify(cop));

  // ---------------------------------------------------------------- 4. walked routes through the corrected openings and junctions
  await E(page, () => { const g = T.G(); g.player.setPose({ x: 90, y: 0, z: 74, yaw: 0, pitch: 0 }); g.player.y = g.world.col.supportHeight(90, 74, 0.2, 0.42); T.tick(5); });
  const front = await step('front door', () => { const a = W.walk([[90, 77.5], [90, 79.0], [90, 81.4], [90, 84]]); const b = W.walk([[90, 79.0], [90, 76.5]]); return { a, b }; });
  if (front) log('front door: straight through the threshold both ways (no knee-high sill: no stuck, step ≤ 0.2 m)', ['vestibule', 'hall'].includes(front.a.room) && front.a.maxDy < 0.2 && front.b.maxDy < 0.2 && front.b.pos.z < 77, JSON.stringify(front));
  const garden = await step('garden doors', () => {
    const g = T.G(); g.player.setPose({ x: 91.5, y: 0.15, z: 107.6, yaw: 0, pitch: 0 }); T.tick(5);
    const a = W.walk([[91.5, 109.0], [91.5, 111.2]]), b = W.walk([[101.0, 111.2], [101.0, 108.6]]), c = W.walk([[101.0, 111.2]]);
    return { billiardOut: a, kitchenBackIn: b, kitchenBackOut: c };
  });
  if (garden) log('garden doors (billiard, kitchen back door): through the threshold both ways', garden.billiardOut.pos.z > 110.9 && garden.kitchenBackIn.room === 'kitchen' && Object.values(garden).every((r) => r.maxDy < 0.2), JSON.stringify(garden));
  const wing = await step('wing → conservatory → deck → sauna', () => {
    const g = T.G(); g.player.setPose({ x: 104, y: 0.15, z: 102.9, yaw: Math.PI / 2, pitch: 0 }); T.tick(5);
    const a = W.walk([[107.0, 102.5], [109.5, 102.5], [114.6, 102.5], [117.4, 102.5]]);
    const b = W.walk([[117.4, 95.6], [127.7, 95.6], [127.7, 101.5], [128.6, 106.0], [132.4, 106.0]]); // round the pool
    const lanes = [105.3, 106.0, 106.7].map((z) => { W.walk([[128.4, z]]); const i = W.walk([[131.6, z]]); return +i.pos.x.toFixed(2); });
    const c = W.walk([[134, 106.4], [134, 104.45]]);
    T.act('door.sauna'); T.wait(1.2);
    const d = W.walk([[134, 102.2]]);
    return { wing: a, cons: b, lanes, steps: c, sauna: d };
  });
  if (wing) log('service door → wing → Copacabana door → double door (three lanes across its width) → sauna steps → sauna floor', wing.wing.room === 'cons' && wing.wing.maxDy < 0.2 && wing.cons.room === 'out' && wing.lanes.every((x) => x > 131.3) && wing.steps.maxDy < 0.25 && Math.abs(wing.steps.pos.y - L.sauna.floor) < 0.04 && wing.sauna.room === 'sauna' && Math.abs(wing.sauna.pos.y - L.sauna.floor) < 0.04, JSON.stringify(wing));
  const yard = await step('workshop yard door', () => { const g = T.G(); g.player.setPose({ x: 112, y: 0.15, z: 93.6, yaw: Math.PI, pitch: 0 }); T.tick(5); const a = W.walk([[112, 92.2], [112, 90.6]]); const b = W.walk([[112, 93.4]]); return { out: a, back: b }; });
  if (yard) log('workshop yard door: through the threshold both ways', yard.out.pos.z < 91 && yard.back.room === 'workshop' && yard.out.maxDy < 0.2 && yard.back.maxDy < 0.2, JSON.stringify(yard));
  const cot = await step('cottage landing + door', () => {
    const g = T.G(); g.player.setPose({ x: 18, y: 4, z: 147.5, yaw: 0, pitch: 0 }); g.player.y = g.world.col.supportHeight(18, 147.5, 4.2, 0.42); T.tick(5);
    const a = W.walk([[18, 150.5], [18, 152.3], [19.4, 152.8], [21.5, 153.4], [25, 154.6]]);
    const b = W.walk([[25, 156.2], [25, 158.6]]);
    const c = W.walk([[25, 155.0], [18.2, 152.6], [18, 155.5], [18, 158]]);
    return { landing: a, door: b, north: c };
  });
  if (cot) log('Portugal cottage: path → landing → terrace → door → room, and out along the north route (no lip > 0.2 m)', cot.landing.maxDy < 0.2 && Math.abs(cot.landing.pos.y - 4.15) < 0.04 && cot.door.room === 'cottageEntry' && cot.door.maxDy < 0.2 && cot.north.maxDy < 0.2, JSON.stringify(cot));
  const attic = await step('attic → nook → telescope', () => {
    const g = T.G(); g.player.setPose({ x: 100, y: 3.35, z: 97.3, yaw: -Math.PI / 2, pitch: 0 }); T.tick(5);
    const a = W.walk([[97.2, 97.6], [97.2, 99.2], [97.2, 102.0], [96.6, 103.0], [95.8, 102.6], [95.8, 100.0], [95.8, 99.2], [94.0, 99.2]]);
    const b = W.walk([[94.2, 95.0], [96.0, 95.0], [98.5, 96.6], [99.9, 96.7]]); // beside the observer's stool, behind the eyepiece
    const op = { ...T.pos(), room: b.room };
    W.walk([[102.8, 94.0]]); const knee = W.push(3, 0);
    return { stair: a, nook: b, operator: op, knee };
  });
  if (attic) log('attic: up S03 into the common room, through the arch into the observation nook, to the operator spot; the knee wall stops you', attic.stair.room === 'atticCommon' && Math.abs(attic.stair.pos.y - L.AF) < 0.05 && attic.nook.room === 'atticLookout' && attic.operator.room === 'atticLookout' && attic.knee.x < L.nook.x1 - 0.15, JSON.stringify(attic));
  const wick = await step('wickerman loop + side path', () => {
    const g = T.G(); g.player.setPose({ x: 163, y: 1.2, z: 49, yaw: 0, pitch: 0 }); g.player.y = g.world.col.supportHeight(163, 49, 1.5, 0.42); T.tick(5);
    const loop = W.walk([[165.3, 51.4], [167.0, 54.0], [168.0, 57.0], [168.8, 61.0]]);
    const side = W.walk([[167.9, 57.6], [170.9, 59.7], [174.2, 60.6], [177.0, 60.1], [178.2, 57.6]]);
    const block = W.push(1.8, -2.4);
    return { loop, side, block };
  });
  if (wick) log('wickerman: the loop is a clear through-route over the old figure spot; the side path leads into the clearing at +1.2; the figure is solid', wick.loop.maxDy < 0.2 && Math.abs(wick.loop.pos.y - 1.2) < 0.12 && wick.side.maxDy < 0.2 && Math.abs(wick.side.pos.y - L.wickerman.y) < 0.15 && Math.hypot(wick.block.x - L.wickerman.x, wick.block.z - L.wickerman.z) > 1.1, JSON.stringify(wick));
  const golf = await step('golf spur', () => { const g = T.G(); g.player.setPose({ x: 50.5, y: 0, z: 44.6, yaw: 0, pitch: 0 }); g.player.y = g.world.col.supportHeight(50.5, 44.6, 0.5, 0.42); T.tick(5); return W.walk([[52.5, 46.5], [57, 49.6], [60.2, 50.3], [61.5, 50.4]]); });
  if (golf) log('golf: shed path → spur → tee mat without a step', golf.maxDy < 0.15 && golf.pos.y < 0.12, JSON.stringify(golf));

  // ---------------------------------------------------------------- 5. interactables in the corrected areas still reachable (reticle targets them)
  const reach = await step('interactables', () => {
    const g = T.G(), out = {};
    // doors are checked closed (the state a player first meets them in); the rest as built
    const at = (x, y, z, id) => {
      g.player.setPose({ x, y, z, yaw: 0, pitch: 0 }); g.player.y = g.world.col.supportHeight(x, z, y + 0.3, 0.42); T.tick(4);
      if (id.startsWith('door.')) { g.state.open[id] = false; g.world.syncAll(); }
      T.tick(90); T.lookAtId(id);
      const tg = g.metrics().target, it = g.world.byId.get(id);
      out[id] = out[id] === undefined || out[id] === true ? (tg === id ? true : { target: tg ?? 'none', pos: T.pos(), room: g.world.hereRoom, culled: g.world.isCulled(it.obj), rotY: +it.obj.rotation.y.toFixed(2), label: g.metrics().label ?? null }) : out[id];
      if (id.startsWith('door.')) { g.state.open[id] = true; g.world.syncAll(); T.tick(40); }
    };
    at(134, 0.15, 106.2, 'door.sauna'); at(134, 0.65, 102.6, 'sauna.heater'); at(134, 0.65, 102.6, 'inspect.saunaBoard');
    at(131.4, 0.15, 106.0, 'door.consEast'); at(128.4, 0.15, 106.0, 'door.consEast'); at(86.0, 6.65, 93.4, 'door.atticStore');
    at(25, 4.15, 155.6, 'door.cottage'); at(86.2, 3.35, 91.4, 'door.sterren'); at(101, 0.15, 103.6, 'kitchen.drawer'); at(105.8, 0.15, 86.6, 'inspect.hostingPlan');
    return out;
  });
  if (reach) log('interactables in the corrected areas are targeted by the reticle (sauna door / heater / board, double door both sides, attic store, cottage, Sterren door, kitchen, dining plan)', Object.values(reach).every((v) => v === true), JSON.stringify(reach));

  // ---------------------------------------------------------------- 6. vegetation: nothing in the new clearing or on its side path
  const veg = await step('vegetation', (L) => {
    const plan = T.G().world.scene.userData.vegPlan; if (!plan) return { missing: true };
    const dSeg = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); };
    const dPath = (x, z) => Math.min(...L.wickermanSide.slice(1).map((b, i) => dSeg(x, z, L.wickermanSide[i], b)));
    const bad = [];
    for (const [kind, list, rIn, pathM] of [['tree', plan.trees, L.wickerman.r + 1.4, 1.9], ['bush', plan.bushes, L.wickerman.r - 0.2, 1.1], ['stump', plan.stumps, L.wickerman.r, 0.9]]) {
      for (const t of list) { const d = Math.hypot(t.x - L.wickerman.x, t.z - L.wickerman.z); if (d < rIn || dPath(t.x, t.z) < pathM) bad.push(`${kind}@${t.x.toFixed(1)},${t.z.toFixed(1)}`); }
    }
    const screen = plan.bushes.filter((b) => { const d = Math.hypot(b.x - L.wickerman.x, b.z - L.wickerman.z); return d > L.wickerman.r && d < L.wickerman.r + 4.5; }).length;
    return { bad: bad.slice(0, 8), nBad: bad.length, screen, trees: plan.trees.length };
  }, L);
  if (veg) log('wickerman relocation: no tree / bush / stump in the clearing or on its side path; the clearing is enclosed by a hedge screen', !veg.missing && veg.nBad === 0 && veg.screen >= 25, JSON.stringify(veg));

  // ---------------------------------------------------------------- 7. ids, checkpoints and the save schema unchanged
  const ids = await E(page, () => { const g = T.G(); return { interactables: [...g.world.byId.keys()].sort(), checkpoints: g.world.checkpoints.map((c) => c.name).sort(), stateKeys: Object.keys(g.state).sort(), version: g.state.version }; });
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  log('no id regression: every interactable / door id, checkpoint and save key of the pre-DEV-04A build is unchanged (none removed; the only additions are the documented DEV-04C ids)', same(ids.interactables, expectedIds) && same(ids.checkpoints, baseline.checkpoints) && same(ids.stateKeys, baseline.stateKeys) && ids.version === baseline.saveVersion, JSON.stringify({ interactables: ids.interactables.length, missing: baseline.interactables.filter((i) => !ids.interactables.includes(i)), added: ids.interactables.filter((i) => !expectedIds.includes(i)), checkpoints: ids.checkpoints.length, version: ids.version }));

  // ---------------------------------------------------------------- 8. render budget at representative views
  const budget = await measureBudget();
  const cmp = Object.fromEntries(Object.entries(budget).map(([k, b]) => { const b0 = baseline.budget?.[k]; return [k, { ...b, before: b0 ?? null }]; }));
  // within the mobile guide (≤ 150 calls / ≤ 250 k triangles at low) wherever the pre-DEV-04A build was; never a material
  // regression against it (calls + 6, triangles + 8 %: the corrections add real geometry - plinth returns, a sink bowl,
  // stairs, a roof window, hedges - but must not move a view across the guide)
  const okB = Object.values(cmp).every((b) => b.before && b.calls <= Math.max(150, b.before.calls) + 6 && b.triangles <= Math.max(250000, b.before.triangles) * 1.08 && (b.before.calls > 150 || b.calls <= 150) && (b.before.triangles > 250000 || b.triangles <= 250000));
  log('render budget (low, standard door state): every DEV-04A view stays within the mobile guide where it was, no material regression vs the pre-DEV-04A build', okB, JSON.stringify(cmp));

  // ---------------------------------------------------------------- 9. legacy saves: poses on surfaces that changed still load onto valid support
  const legacy = [];
  for (const [name, pose, yExp] of [['old sauna ramp', { x: 134, y: 0.5, z: 109.0 }, 0.15], ['old sauna floor', { x: 134, y: 0.8, z: 101.8 }, L.sauna.floor], ['old wickerman spot', { x: 167, y: 1.2, z: 54 }, 1.2], ['old lookout', { x: 98, y: 6.65, z: 95 }, L.AF], ['old cottage ramp', { x: 19, y: 4.08, z: 152 }, null]]) {
    await start({ player: { estate: { ...pose, yaw: 0, pitch: 0 } } });
    const r = await E(page, () => { T.tick(60); const p = T.pos(); return { ...p, room: T.G().world.hereRoom }; });
    const ok = yExp == null ? r.y > 3.98 && r.y < 4.17 : Math.abs(r.y - yExp) < 0.06;
    legacy.push({ name, ok, ...r });
  }
  log('legacy save poses on changed surfaces (sauna ramp / floor, wickerman spot, lookout, cottage ramp) load onto valid support (same save schema)', legacy.every((l) => l.ok), JSON.stringify(legacy));
} catch (e) {
  log('suite crashed', false, String(e?.stack ?? e).slice(0, 500));
}
log('no page errors / DEV-04A contract warnings', problems.length === 0, problems.slice(0, 6).join(' | '));
writeFileSync(`${OUT}/e2e-dev04a-results.json`, JSON.stringify({ base: BASE, results }, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close();
process.exit(failed ? 1 : 0);
