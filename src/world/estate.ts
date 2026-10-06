// The estate: 180 × 150 m (X east, Z north, Y up). Front gate on the south edge at X 90.
// South (Z 0–72): woodland on gently rolling ground with the BOSLUST hill. North: the manor (main block,
// service wing, glass pool conservatory, sauna outside to its right), an open lawn with the lantern
// circle, and the old cottage by the pond. Layout constants live in layout.ts; ground in terrain.ts.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { World, type GameApi } from '../interactions/world';
import type { SceneExtras } from '../core/game';
import { makeCtx, floor, type Ctx } from './arch';
import { Batcher, box, boxMM, cyl, blob, compound, getKit, v3 } from './kit';
import { table, chair, lantern, plant, staticLantern } from './furniture';
import { Vegetation, scatter, distToPolyline, smooth } from './nature';
import { buildManor } from './manor';
import { buildConservatory } from './conservatory';
import { buildCottage } from './cottage';
import { buildForest, forestTreePoints } from './forest';
import { buildBoslust } from './boslust';
import { addEnvironment } from './env';
import { ART } from '../core/artflags';
import { inZone, inBackdrop, addBackdrop, zoneGround, zonePathWidth, zonePathTint, pathVerge, finishZone } from './boslustSample';
import { makeLamp, makeAction, makeDoor, makePickup, makeInspect, place } from '../interactions/props';
import { pressLantern } from '../puzzles/rules';
import { addClue } from '../core/state';
import { drawSymbol, SYMBOLS } from '../content/symbols';
import { mulberry32 } from '../core/rng';
import { estateRooms } from './roomdefs';
import { ESTATE, SITES, DRIVEWAY, GARDEN_PATH, TERRACE, GF, HILL } from './layout';
import { FOREST_PATHS, TCELL, TERRAIN_DIMS, gridAt, gridHeight, inHole, terrainHeight, walkHeight, entranceMound } from './terrain';

/** The lantern circle on the lawn behind the manor (a wrong attempt never means crossing the garden). */
export const LANTERN_CIRCLE = SITES.lanterns;
export const LANTERNS = [
  { sym: 'zon', x: LANTERN_CIRCLE.x - 3.4, z: LANTERN_CIRCLE.z - 0.6 },
  { sym: 'maan', x: LANTERN_CIRCLE.x, z: LANTERN_CIRCLE.z + 3.4 },
  { sym: 'blad', x: LANTERN_CIRCLE.x + 3.4, z: LANTERN_CIRCLE.z - 0.6 },
];

const inRect = (x: number, z: number, x0: number, x1: number, z0: number, z1: number) => x >= x0 && x <= x1 && z >= z0 && z <= z1;

export function buildEstate(g: GameApi): { world: World; extras: SceneExtras } {
  const w = new World('estate');
  w.ambience = 'estate';
  w.col.bounds = { minX: 0.6, maxX: ESTATE.w - 0.6, minZ: 0.6, maxZ: ESTATE.d - 0.6 };
  w.col.ground = walkHeight;
  const env = addEnvironment(w);
  const veg = new Vegetation(7);
  const ground = makeCtx(w.col, 'ground');
  const manorC = makeCtx(w.col, 'manor');
  const manorIn = makeCtx(w.col, 'mIn');
  const manorB = makeCtx(w.col, 'mB');
  const consC = makeCtx(w.col, 'cons');
  const cotC = makeCtx(w.col, 'cottage');
  const forestC = makeCtx(w.col, 'forest');
  const gardenC = makeCtx(w.col, 'garden');
  const ugC = makeCtx(w.col, 'ug');

  buildGround(w);
  buildPaths(w, ground);
  buildBoundary(w, g, ground, veg);
  buildManor(w, g, manorC, manorIn, manorB);
  buildConservatory(w, g, consC);
  buildCottage(w, g, cotC);
  // art sample (?ext=sample): old visuals in the BOSLUST zone are generated but discarded
  if (ART.ext === 'sample') veg.drop = (x, z) => inZone(x, z); // zone stumps are rebuilt by stumpsV2 (same colliders)
  buildForest(w, g, forestC, veg);
  buildBoslust(w, g, forestC, ugC, veg);
  veg.drop = null;
  if (ART.ext === 'sample') finishZone(w);
  buildGarden(w, g, gardenC, veg);

  for (const c of [ground, manorC, manorIn, manorB, consC, cotC, forestC, gardenC, ugC]) c.b.build(w.scene);
  for (const m of veg.build(w.scene, true)) m.userData.region = 'outdoor';

  // whole-room culling: chunks are shown only while one of their rooms can be seen from the player's room
  const R = estateRooms();
  const manorRooms = R.rooms.filter((r) => r.floor === 'g' || r.floor === 'u').filter((r) => r.x0 >= 72 && r.x1 <= 116 && r.id !== 'cons').map((r) => r.id);
  const basementRooms = ['bstair', 'bLobby', 'archive', 'boiler', 'route', 'tunnel2', 'tunnel'];
  const ugRooms = ['hut', 'descent', 'entry', 'passage', 'gathering', 'tunnel', 'tunnel2'];
  // furnishings per area: listed rooms are the ones from which that area can actually be seen (seen from
  // outside through the front door, only the vestibule and hall furnishings are drawn)
  w.roomRegion(['manor'], [...manorRooms, 'out', 'cons'], 130);
  w.roomRegion(['mIn'], manorRooms);
  w.roomRegion(['mHall'], ['vestibule', 'hall', 'living', 'lobby', 'billiard', 'frontGallery', 'walkway', 'landing']);
  w.roomRegion(['mLib'], ['library', 'libGallery', 'living', 'lobby']);
  w.roomRegion(['mWing'], ['dining', 'kitchen', 'corridor', 'workshop', 'pantry']);
  w.roomRegion(['mUp'], ['frontGallery', 'walkway', 'landing', 'libGallery', 'reis', 'sterren', 'bath', 'ucorr', 'study', 'botanic', 'storage', 'library']);
  w.roomRegion(['mB'], basementRooms);
  w.roomRegion(['ug'], ugRooms);
  w.roomRegion(['cons', 'glass'], ['cons', 'out', 'corridor'], 95);
  w.roomRegion(['cottageIn'], ['cottageEntry', 'cottageRoom']);
  w.roomRegion(['cottage'], ['out', 'cottageEntry', 'cottageRoom'], 75);
  w.roomRegion(['ground', 'paths', 'wall', 'fence', 'garden', 'forest', 'outdoor', 'hills'], ['out', 'cons', 'sauna', 'shed', 'cottageEntry', 'cottageRoom']);

  w.spawn = { x: SITES.gate.x, y: 0, z: 3, yaw: 0, pitch: 0.02 };
  w.checkpoints.push(
    { name: 'gate', pose: { x: SITES.gate.x, y: 0, z: 3, yaw: 0, pitch: 0 } },
    { name: 'forecourt', pose: { x: 90, y: 0, z: 72, yaw: 0, pitch: 0 } },
    { name: 'garden', pose: { x: 90, y: 0, z: 122, yaw: 0, pitch: 0 } },
  );

  const isIndoor = (x: number, z: number, y = 0) => R.roomAt(x, y + 0.8, z) !== 'out';
  const surfaceAt = (x: number, z: number, y = 0): 'grass' | 'wood' | 'stone' => {
    const room = R.roomAt(x, y + 0.8, z);
    if (room !== 'out') return R.get(room)?.floor === 'b' || room === 'cons' || room === 'hall' || room === 'vestibule' || room === 'kitchen' ? 'stone' : 'wood';
    if (inRect(x, z, TERRACE.x0, TERRACE.x1, TERRACE.z0, TERRACE.z1) || inRect(x, z, 60, 66, 8, 18.2)) return 'stone';
    if (distToPolyline(x, z, DRIVEWAY) < 2.4 || Math.hypot(x - SITES.forecourt.x, z - SITES.forecourt.z) < 8) return 'stone';
    return 'grass';
  };
  return { world: w, extras: { env, isIndoor, surfaceAt, rooms: R } };
}

// ---------------------------------------------------------------------------------------------
// Ground: one indexed heightfield (same 2 m grid + triangle split as collision), holes under buildings.
function buildGround(w: World) {
  const k = getKit();
  const r = mulberry32(3);
  const { NX, NZ } = TERRAIN_DIMS;
  const n = (NX + 1) * (NZ + 1);
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
  const zoneTreePts = ART.ext === 'sample' ? forestTreePoints().filter(([x, z]) => inZone(x, z)) : null;
  const forest = new THREE.Color('#6f8c43'), lawn = new THREE.Color('#9cc05e'), moss = new THREE.Color('#5d7a38'), dirt = new THREE.Color('#9a8456'), hillC = new THREE.Color('#7f9a4a');
  const c = new THREE.Color();
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
    const vi = j * (NX + 1) + i, x = i * TCELL, z = j * TCELL, h = gridAt(i, j);
    pos.set([x, h, -z], vi * 3);
    uv.set([x / 5, z / 5], vi * 2);
    const t = THREE.MathUtils.smoothstep(z, ESTATE.forestEdge - 8, ESTATE.forestEdge + 2);
    c.copy(moss).lerp(forest, r()).lerp(lawn, t);
    const hr = Math.hypot(x - HILL.x, z - HILL.z);
    if (hr < HILL.r + 2) c.lerp(hillC, 0.5 * (1 - hr / (HILL.r + 2)));
    let dp = Infinity;
    for (const p of FOREST_PATHS) dp = Math.min(dp, distToPolyline(x, z, p));
    if (dp < 3) c.lerp(dirt, (1 - dp / 3) * 0.35);
    if (zoneTreePts) zoneGround(x, z, c, zoneTreePts);
    col.set([c.r, c.g, c.b], vi * 3);
  }
  const idx: number[] = [];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    if (inHole(i * TCELL + 1, j * TCELL + 1)) continue;
    const a = j * (NX + 1) + i, b = a + 1, cc = a + NX + 2, d = a + NX + 1;
    idx.push(a, b, cc, a, cc, d); // split 00-10-11 / 00-11-01 (matches gridHeight)
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, k.M.grass);
  mesh.receiveShadow = true;
  mesh.userData.noCull = true;
  mesh.userData.region = 'outdoor';
  w.scene.add(mesh);
  // earth mound over the BOSLUST entrance hut (finer grid; its rim matches the 2 m grid exactly)
  {
    const S = 0.5, x0 = 60, z0 = 18, N = 12;
    const mp: number[] = [], mc: number[] = [], mu: number[] = [], mi: number[] = [];
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const x = x0 + i * S, z = z0 + j * S, h = entranceMound(x, z);
      mp.push(x, h, -z); mu.push(x / 5, z / 5);
      c.copy(hillC).lerp(moss, 0.35 + 0.3 * Math.sin(i * 1.7 + j)); if (zoneTreePts) zoneGround(x, z, c, zoneTreePts); mc.push(c.r, c.g, c.b);
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i; mi.push(a, a + 1, a + N + 2, a, a + N + 2, a + N + 1); }
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3));
    mg.setAttribute('uv', new THREE.Float32BufferAttribute(mu, 2));
    mg.setAttribute('color', new THREE.Float32BufferAttribute(mc, 3));
    mg.setIndex(mi);
    mg.computeVertexNormals();
    const mm = new THREE.Mesh(mg, k.M.grass);
    mm.receiveShadow = true;
    mm.userData.noCull = true;
    mm.userData.region = 'outdoor';
    w.scene.add(mm);
  }
  // the land beyond the estate: a frame AROUND it (one draw call)
  const outerMat = w.material(new THREE.MeshLambertMaterial({ color: '#5f7d3a' }));
  const W = ESTATE.w, D = ESTATE.d;
  const parts = ([[-300, W + 300, -300, 0], [-300, W + 300, D, D + 300], [-300, 0, 0, D], [W, W + 300, 0, D]] as const).map(([x0, x1, z0, z1]) => {
    const pg = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    pg.rotateX(-Math.PI / 2);
    pg.translate((x0 + x1) / 2, -0.04, -(z0 + z1) / 2);
    return pg;
  });
  const outer = new THREE.Mesh(mergeGeometries(parts)!, outerMat);
  parts.forEach((pg) => pg.dispose());
  outer.userData.noCull = true;
  outer.userData.region = 'outdoor';
  w.scene.add(outer);
  const hills = new Batcher();
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 + r() * 0.2;
    const d = 230 + r() * 40;
    blob(hills, k.M.paint, i % 2 ? '#5f7f58' : '#6f8a5c', W / 2 + Math.cos(a) * d, -8, D / 2 + Math.sin(a) * d, 55 + r() * 30, 22 + r() * 18, 40, { shadow: false, chunk: 'hills' });
  }
  hills.build(w.scene, false);
}

/** Path ribbon draped on the terrain (densified along the line, three vertices across). */
function drape(pts: readonly (readonly [number, number])[], width: number, lift = 0.035, widthAt?: (x: number, z: number, d: number) => number): THREE.BufferGeometry {
  const dense: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 1.0));
    for (let s = 0; s < n; s++) dense.push([ax + ((bx - ax) * s) / n, az + ((bz - az) * s) / n]);
  }
  dense.push([pts[pts.length - 1][0], pts[pts.length - 1][1]]);
  const pos: number[] = [], uv: number[] = [], col: number[] = [], idx: number[] = [];
  let dist = 0;
  for (let i = 0; i < dense.length; i++) {
    const p = dense[i], a = dense[Math.max(0, i - 1)], b = dense[Math.min(dense.length - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len; dz /= len;
    if (i > 0) dist += Math.hypot(p[0] - dense[i - 1][0], p[1] - dense[i - 1][1]);
    for (let s = -1; s <= 1; s++) {
      // optional per-side width (art sample: irregular, wandering edges inside the BOSLUST zone)
      const wd = widthAt ? widthAt(p[0], p[1], dist + s * 7.3) : width;
      const x = p[0] - dz * s * wd / 2, z = p[1] + dx * s * wd / 2;
      pos.push(x, terrainHeight(x, z) + lift, -z);
      uv.push(((s + 1) / 2) * width / 3, dist / 3);
      col.push(1, 1, 1);
    }
    if (i > 0) {
      const o = (i - 1) * 3;
      for (const [q0, q1] of [[0, 1], [1, 2]]) idx.push(o + q0, o + q0 + 3, o + q1 + 3, o + q0, o + q1 + 3, o + q1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  const ng = g.toNonIndexed();
  g.dispose();
  ng.computeVertexNormals();
  const nn = ng.attributes.normal;
  for (let i = 0; i < nn.count; i++) if (nn.getY(i) < 0) nn.setXYZ(i, -nn.getX(i), -nn.getY(i), -nn.getZ(i));
  return ng;
}

function buildPaths(w: World, c: Ctx) {
  const k = c.k;
  const add = (pts: readonly (readonly [number, number])[], width: number, color: string) => {
    const gg = drape(pts, width);
    c.b.add(k.M.dirt, gg, new THREE.Matrix4(), color, 'paths', false, 0);
    gg.dispose();
  };
  add(smooth(DRIVEWAY, 2), 4.2, '#d8c3a0');
  if (ART.ext === 'sample') {
    for (const p of FOREST_PATHS) { const gg = zonePathTint(drape(p, 1.9, 0.035, zonePathWidth)); c.b.add(k.M.dirt, gg, new THREE.Matrix4(), '#c8ad80', 'paths', false, 0); gg.dispose(); }
    pathVerge(w, FOREST_PATHS, (k.M.dirt as THREE.MeshLambertMaterial).map!);
  }
  else for (const p of FOREST_PATHS) add(p, 1.9, '#c8ad80');
  add(smooth(GARDEN_PATH, 2), 1.5, '#e2d2b0');
  add(smooth([[90, 117], [90, 124.2]], 1), 1.6, '#e2d2b0'); // terrace → lantern circle
  add(smooth([[102, 113.5], [114, 113.5], [126, 113.8], [133, 108], [134, 104.5]], 2), 1.5, '#e2d2b0'); // terrace → cons + sauna
  // forecourt: gravel disc in front of the manor + central planter
  const disc = new THREE.CircleGeometry(9.5, 36);
  disc.rotateX(-Math.PI / 2);
  c.b.add(k.M.dirt, disc, new THREE.Matrix4().makeTranslation(SITES.forecourt.x, 0.03, -SITES.forecourt.z), '#d8c3a0', 'paths', false, 0);
  disc.dispose();
  const ap = new THREE.PlaneGeometry(9, 8);
  ap.rotateX(-Math.PI / 2);
  c.b.add(k.M.dirt, ap, new THREE.Matrix4().makeTranslation(90, 0.031, -76), '#d8c3a0', 'paths', false, 0);
  ap.dispose();
  cyl(c.b, k.M.stone, '#d8ccb0', SITES.forecourt.x, 0, SITES.forecourt.z, 1.8, 1.9, 0.45, 18, { chunk: 'ground', uv: 1 });
  cyl(c.b, k.M.paint, '#6a5040', SITES.forecourt.x, 0.45, SITES.forecourt.z, 1.6, 1.6, 0.02, 18, { chunk: 'ground' });
  w.col.addCircle(SITES.forecourt.x, SITES.forecourt.z, 1.9, 0, 0.8);
}

function buildBoundary(w: World, g: GameApi, c: Ctx, veg: Vegetation) {
  const k = c.k;
  const GX = SITES.gate.x, W = ESTATE.w, D = ESTATE.d;
  // south: stone wall with the front gate
  for (const [a, b2] of [[0, GX - 2.4], [GX + 2.4, W]] as const) {
    boxMM(c.b, k.M.stone, '#cbbf9f', a, b2, 0, 1.3, 0.05, 0.55, { chunk: 'wall', uv: 2 });
    boxMM(c.b, k.M.stone, '#b8ac8c', a, b2, 1.3, 1.42, -0.02, 0.62, { chunk: 'wall', uv: 2 });
    w.col.addBox(a, b2, 0, 0.6, 0, 2);
  }
  for (const x of [GX - 2.7, GX + 2.7]) {
    box(c.b, k.M.stone, '#d8ccb0', x, 0, 0.3, 0.7, 2.6, 0.7, { chunk: 'wall', uv: 1 });
    box(c.b, k.M.stone, '#c8bca0', x, 2.6, 0.3, 0.85, 0.15, 0.85, { chunk: 'wall' });
    staticLantern(c, w, x, 2.75, 0.3, 0.8, 0, 3, 7);
  }
  const msg = 'Het hek is achter je dichtgevallen. Het weekend ligt de andere kant op.';
  makeDoor(w, g, { id: 'gate.front', x: GX - 2.35, z: 0.3, dir: 'x+', width: 2.35, height: 1.9, y0: 0, swing: -1, style: 'gate', unlock: 'never', lockedMsg: msg });
  makeDoor(w, g, { id: 'gate.front2', x: GX + 2.35, z: 0.3, dir: 'x-', width: 2.35, height: 1.9, y0: 0, swing: 1, style: 'gate', unlock: 'never', lockedMsg: msg });
  // fence on the other three sides (the estate bounds also clamp movement); posts follow the terrain
  const fence = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(len / 2.5);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n, y = terrainHeight(x, z);
      box(c.b, k.M.wood, '#6b4a2a', x, y - 0.1, z, 0.14, 1.3, 0.14, { chunk: 'fence' });
      if (i < n) {
        const xb = x0 + ((x1 - x0) * (i + 1)) / n, zb = z0 + ((z1 - z0) * (i + 1)) / n, yb = terrainHeight(xb, zb);
        const seg = Math.hypot(xb - x, zb - z), yaw = Math.atan2(xb - x, zb - z), rise = Math.atan2(yb - y, seg);
        for (const hy of [0.45, 0.95]) box(c.b, k.M.wood, '#7a5a3a', (x + xb) / 2, (y + yb) / 2 + hy, (z + zb) / 2, 0.08, 0.1, seg, { chunk: 'fence', yaw, rx: -rise });
      }
    }
  };
  fence(0.2, 0.6, 0.2, D - 0.2);
  fence(W - 0.2, 0.6, W - 0.2, D - 0.2);
  fence(0.2, D - 0.2, W - 0.2, D - 0.2);
  // woodland continues beyond the fence (visual only): low-poly crowns
  const r = mulberry32(77);
  const outside = scatter(r, -18, W + 18, -18, D + 18, 5.6, 6000, (x, z) => x < -0.8 || x > W + 0.8 || z < -1.5 || z > D + 0.8);
  // art sample: the nearest row beyond the fence behind the BOSLUST zone is its backdrop; those trees get the
  // sample's models (generated-then-discarded here, so the random sequence and every other tree are unchanged)
  if (ART.ext === 'sample') veg.drop = (x, z) => inBackdrop(x, z);
  for (const [x, z] of outside) {
    const kind = r() < 0.25 ? 'pine' : 'oak';
    const spec = { x, z, h: kind === 'pine' ? 6 + r() * 3 : 3.5 + r() * 2.5, r: 1.8 + r() * 1.0, kind, hue: r() - 0.5 } as const;
    veg.tree(spec, `outer${x < 0 ? 'W' : x > W ? 'E' : z < 0 ? 'S' : 'N'}`);
    if (ART.ext === 'sample' && inBackdrop(x, z)) addBackdrop({ ...spec, y: terrainHeight(x, z) });
  }
  veg.drop = null;
}

// ---------------------------------------------------------------------------------------------
// Garden: dining terrace, open lawn with the lantern circle (thread C), scattered trees and flowers.
function buildGarden(w: World, g: GameApi, c: Ctx, veg: Vegetation) {
  const k = c.k;
  const r = mulberry32(19);
  // dining terrace along the garden façade (level with the ground floor)
  floor(c, TERRACE.x0, TERRACE.x1, TERRACE.z0, TERRACE.z1, GF, k.M.stone, '#e2d6bc', 0.4, true, 1.5);
  boxMM(c.b, k.M.stone, '#d0c4a8', TERRACE.x0, TERRACE.x1, 0, GF, TERRACE.z1 - 0.05, TERRACE.z1 + 0.15, { chunk: c.chunk, uv: 1 });
  table(c, 84, 114, GF, 5.0, 1.1, 0, '#8a6a4a');
  for (let i = 0; i < 5; i++) {
    chair(c, 82 + i, 113.0, GF, 0, '#8a6a4a');
    chair(c, 82 + i, 115.0, GF, Math.PI, '#8a6a4a');
  }
  for (const x of [82.4, 85.6]) {
    const l = lantern(w, x, GF + 0.76, 114, 0.5);
    makeLamp(w, g, { id: `lamp.terrace.${x}`, ...l, name: 'tafellantaarn', defaultOn: true, intensity: 3, distance: 6, hit: [0.3, 0.4, 0.3] });
  }
  for (const [x, z] of [[78.6, 110.6], [101.4, 110.6], [78.6, 116.4], [101.4, 116.4], [96, 116.4]] as const) plant(c, x, z, GF, 1.2, '#c9774a');
  staticLantern(c, w, 95, 2.4, 110.25, 0.7, 0, 3, 7);

  // three lantern posts in a circle on the open lawn around a flat stone (thread C)
  const LC = LANTERN_CIRCLE;
  let flashAll = 0;
  w.onUpdate((dt) => {
    if (flashAll > 0) { flashAll -= dt; if (flashAll <= 0) { flashAll = 0; g.changed(); } }
  });
  for (const L of LANTERNS) {
    box(c.b, k.M.stone, '#e2d6bc', L.x, 0, L.z, 0.55, 1.15, 0.55, { chunk: c.chunk, uv: 1 });
    box(c.b, k.M.stone, '#d0c4a8', L.x, 1.15, L.z, 0.65, 0.08, 0.65, { chunk: c.chunk });
    w.col.addBox(L.x - 0.3, L.x + 0.3, L.z - 0.3, L.z + 0.3, 0, 1.3);
    const lm = lantern(w, L.x, 1.23, L.z, 1.25, 0);
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const x = cv.getContext('2d')!;
    x.fillStyle = '#2b2622'; x.fillRect(0, 0, 64, 64);
    x.lineWidth = 2; drawSymbol(x, L.sym, 6, 6, 52, { color: '#fff3c8', ink: '#fff3c8' });
    const t = w.texture(new THREE.CanvasTexture(cv));
    t.colorSpace = THREE.SRGBColorSpace;
    const symMat = w.material(new THREE.MeshBasicMaterial({ map: t, color: '#6a6050' }));
    // the four cut-out faces in one geometry (one draw call per lantern)
    const faces = [0, 1, 2, 3].map((s) => { const a = (s * Math.PI) / 2; return new THREE.PlaneGeometry(0.26, 0.26).rotateY(a).translate(Math.sin(a) * 0.165, 0.29, Math.cos(a) * 0.165); });
    lm.obj.add(new THREE.Mesh(mergeGeometries(faces)!, symMat));
    faces.forEach((f) => f.dispose());
    const isLit = () => flashAll > 0 || !!g.state.flags.lanternsSolved || (g.state.seq.gardenLanterns ?? []).includes(L.sym);
    w.lamps.push({ id: `garden.${L.sym}`, pos: lm.light, color: '#ffcf7a', intensity: 6, distance: 9, on: isLit });
    w.onSync(() => {
      const on = isLit();
      for (const m of lm.glow) m.color.set(on ? '#ffd27a' : '#4a443c');
      symMat.color.set(on ? '#ffffff' : '#6a6050');
    });
    makeAction(w, {
      id: `garden.lantern.${L.sym}`, obj: lm.obj, hit: [0.7, 0.9, 0.7], hitOffset: [0, 0.3, 0], reach: 2.8,
      label: () => (isLit() ? null : `Aansteken: ${SYMBOLS[L.sym].name.toLowerCase()}`),
      run: () => {
        addClue(g.state, 'c.lanterns');
        const { result, outcome } = pressLantern(g.state, L.sym);
        if (result === 'wrong') flashAll = 1.1; // all three burn for a moment: the attempt reads as complete
        g.act(outcome);
      },
    });
  }
  // the flat centre stone: its lid slides aside when the circle is lit → the trail seal
  cyl(c.b, k.M.stone, '#cfc3a6', LC.x, 0, LC.z, 0.95, 1.05, 0.32, 16, { chunk: c.chunk, uv: 1 });
  cyl(c.b, k.M.paint, '#3a3228', LC.x, 0.32, LC.z, 0.55, 0.55, 0.01, 16, { chunk: c.chunk });
  w.col.addCircle(LC.x, LC.z, 1.05, 0, 0.45);
  const lid = compound((b) => {
    cyl(b, k.M.stone, '#e2d6bc', 0, 0, 0, 0.7, 0.7, 0.1, 16);
    for (let i = 0; i < 3; i++) blob(b, k.M.paint, '#a89c80', Math.cos(i * 2.1) * 0.35, 0.1, Math.sin(i * 2.1) * 0.35, 0.08, 0.02, 0.08);
  });
  const lidPivot = new THREE.Group();
  lidPivot.add(lid);
  place(lidPivot, LC.x, 0.32, LC.z, 0);
  w.scene.add(lidPivot);
  let lidT = -1;
  w.onSync(() => {
    const open = !!g.state.open['lantern.stone'];
    if (!open) { lid.position.set(0, 0, 0); lidT = -1; } else if (lidT < 0) lidT = g.reducedMotion ? 1 : 0;
  });
  w.onUpdate((dt) => {
    if (lidT < 0) return;
    lidT = Math.min(1, lidT + dt * 0.7);
    lid.position.set(lidT * 1.15, 0, -lidT * 0.3);
  });
  const seal = compound((b) => { blob(b, k.M.paint, '#4f8a3a', 0, 0.03, 0, 0.13, 0.03, 0.1); box(b, k.M.paint, '#2f5a2a', 0, 0.06, 0, 0.02, 0.01, 0.12); });
  place(seal, LC.x, 0.3, LC.z, 0.4);
  w.scene.add(seal);
  makePickup(w, g, { id: 'pk.trailSeal', item: 'trailSeal', obj: seal, available: () => !!g.state.open['lantern.stone'], hit: [0.5, 0.25, 0.5] });
  const stoneHit = new THREE.Group();
  place(stoneHit, LC.x, 0, LC.z, 0);
  w.scene.add(stoneHit);
  makeAction(w, {
    id: 'lantern.stoneInspect', obj: stoneHit, hit: [1.9, 0.5, 1.9], hitOffset: [0, 0.2, 0], reach: 2.6,
    label: () => (g.state.open['lantern.stone'] ? null : 'Bekijken: platte steen'),
    run: () => { addClue(g.state, 'c.lanterns'); g.act({ ok: false, msg: 'Een platte ronde steen met een naad rondom. Hij zit muurvast. De drie lantaarns staan er in een kring omheen.', sfx: 'none' }); },
  });

  // trees: a few oaks, cypresses and birches; the lawn stays open
  const oaks: [number, number][] = [[64, 84], [58, 100], [44, 92], [40, 110], [120, 82], [140, 92], [150, 120], [112, 132], [72, 140], [100, 142], [140, 140], [160, 100], [20, 96], [16, 130], [166, 76], [26, 78]];
  for (const [x, z] of oaks) {
    veg.tree({ x, z, h: 4 + r() * 1.5, r: 2.4 + r() * 0.8, kind: 'oak', hue: r() - 0.5, y: terrainHeight(x, z) }, 'garden');
    w.col.addCircle(x, z, 0.4, 0, 6);
  }
  // the old oak east of the pond with its nest box (optional memory)
  const OX = SITES.pond.x + 6.5, OZ = SITES.pond.z + 0.5;
  veg.tree({ x: OX, z: OZ, h: 5.2, r: 3.2, kind: 'oak', hue: -0.3 }, 'garden');
  w.col.addCircle(OX, OZ, 0.55, 0, 6);
  const nb = compound((b) => {
    box(b, k.M.wood, '#8a5a33', 0, 0, 0, 0.3, 0.38, 0.28);
    box(b, k.M.wood, '#5a3a22', 0, 0.38, 0, 0.36, 0.05, 0.34, { rx: 0.2 });
    cyl(b, k.M.paint, '#2a1f16', 0, 0.22, 0.142, 0.05, 0.05, 0.01, 10, { rx: Math.PI / 2 });
  });
  place(nb, OX - 0.45, 1.7, OZ - 0.2, -Math.PI / 2 - 0.3);
  w.scene.add(nb);
  makeInspect(w, g, { id: 'mem.garden.nestbox', obj: nb, clue: 'mem.garden.nestbox', hit: [0.5, 0.6, 0.5], label: 'Bekijken: nestkastje' });
  for (const [x, z] of [[71, 80.5], [71, 86], [109, 80.5], [69, 112], [111, 112], [124, 116], [82, 76], [98, 76]] as const) {
    veg.tree({ x, z, h: 5.5 + r() * 1.5, r: 0.75, kind: 'cypress', hue: r() - 0.5 }, 'garden');
    w.col.addCircle(x, z, 0.35, 0, 6);
  }
  for (const [x, z] of [[30, 120], [160, 130], [150, 82]] as const) {
    veg.tree({ x, z, h: 5, r: 1.6, kind: 'birch', hue: 0 }, 'garden');
    w.col.addCircle(x, z, 0.25, 0, 6);
  }
  // flower patches and low shrubs (no collision)
  const patch = (cx: number, cz: number, rad: number, n: number, colors: string[]) => {
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad;
      veg.smallThing('flower', cx + Math.cos(a) * d, cz + Math.sin(a) * d, 0.12 + r() * 0.08, colors[Math.floor(r() * colors.length)], 'garden');
    }
  };
  const purple = ['#b89ad8', '#9a7ac8', '#f2f0e6', '#e8a8c8'];
  for (const L of LANTERNS) patch(L.x, L.z, 1.4, 10, purple);
  patch(76, 120, 2.2, 18, purple);
  patch(104, 120, 2.2, 18, ['#f2c6d8', '#f2f0e6', '#e8c547']);
  patch(46, 124, 1.6, 12, ['#f2c6d8', '#f2f0e6', '#e8c547']);
  patch(66, 76, 1.6, 12, purple);
  patch(114, 76, 1.6, 12, purple);
  const clearOf = (x: number, z: number) =>
    z > ESTATE.forestEdge + 1 && !inRect(x, z, 70, 132, 78, 119) && !inRect(x, z, 29, 45, 124, 139) && Math.hypot(x - SITES.pond.x, z - SITES.pond.z) > 5 &&
    Math.hypot(x - LC.x, z - LC.z) > 5.5 && distToPolyline(x, z, GARDEN_PATH) > 1.4 && distToPolyline(x, z, DRIVEWAY) > 3 && Math.hypot(x - SITES.forecourt.x, z - SITES.forecourt.z) > 10.5;
  for (const [x, z] of scatter(r, 2, ESTATE.w - 2, ESTATE.forestEdge, ESTATE.d - 2, 5.0, 1600, clearOf)) {
    if (r() < 0.55) veg.smallThing('flower', x, z, 0.14, purple[Math.floor(r() * 4)], 'garden');
    else veg.smallThing('shrub', x, z, 0.4 + r() * 0.3, '#5a8a3e', 'garden');
  }
  // soft meadow: grass tufts across the lawn (instanced, tiled so only nearby tiles draw)
  for (const [x, z] of scatter(r, 2, ESTATE.w - 2, ESTATE.forestEdge - 4, ESTATE.d - 2, 2.2, 9000, (x, z) => clearOf(x, z) || (z > 118 && Math.hypot(x - LC.x, z - LC.z) > 4.5 && !inRect(x, z, 29, 45, 124, 139) && Math.hypot(x - SITES.pond.x, z - SITES.pond.z) > 4.2))) {
    veg.smallThing('grass', x, z, 0.25 + r() * 0.2, r() < 0.5 ? '#7fae4a' : '#94bc58', `gr${Math.floor(x / 30)}_${Math.floor(z / 30)}`, terrainHeight(x, z));
  }
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2, d = 0.9 + (i % 3) * 0.2;
    veg.smallThing(i % 4 === 0 ? 'shrub' : 'flower', SITES.forecourt.x + Math.cos(a) * d, SITES.forecourt.z + Math.sin(a) * d, i % 4 === 0 ? 0.35 : 0.14, i % 4 === 0 ? '#4f7f38' : purple[i % 4], 'garden', 0.46);
  }
  // hedges along the manor front, leaving the approach to the porch open
  for (let x = 72.5; x < 107.6; x += 1.1) if (Math.abs(x - 90) > 5) veg.smallThing('shrub', x, 79.0, 0.55, '#4a7a36', 'garden');
}

/** Landmarks whose name appears on the map only once visited (no puzzle answers are ever shown). */
export const MAP_SITES = [
  { id: 'shed', x: SITES.shed.x, z: SITES.shed.z - 4, label: 'schuur' },
  { id: 'fire', x: SITES.fire.x, z: SITES.fire.z, label: 'vuurplaats' },
  { id: 'well', x: SITES.well.x, z: SITES.well.z, label: 'put' },
  { id: 'gate', x: SITES.sideGate.x, z: SITES.sideGate.z, label: 'oud hek' },
  { id: 'lanterns', x: LANTERN_CIRCLE.x, z: LANTERN_CIRCLE.z, label: 'lantaarnkring' },
  { id: 'sauna', x: SITES.sauna.x, z: SITES.sauna.z, label: 'sauna' },
  { id: 'cottage', x: SITES.cottage.x, z: SITES.cottage.z, label: 'huisje' },
  { id: 'fork', x: SITES.fork.x, z: SITES.fork.z, label: 'wegwijzer' },
  { id: 'hill', x: SITES.hill.x, z: SITES.hill.z, label: 'heuvel' },
];

void gridHeight; void v3;
