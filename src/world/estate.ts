// The estate: 200 × 180 m (X east, Z north, Y up) — DEV-02 structural blockout of LEVEL_PLAN v0.2 variant A.
// Front gate on the south edge at X 90. South (Z 0–72): woodland on gently rolling ground with the BOSLUST hill, the
// golf tee behind it and the wickerman clearing in the east. Middle: arrival court with the cars, the manor (main block,
// service wing, the glass Copacabana Room, wellness deck with sauna and jacuzzi), the social garden and the lantern lawn.
// North: the lake with the Portugal cottage on its plateau, wooded ridges along the north and east, the west bank.
// Layout constants live in layout.ts, keepouts in footprints.ts, ground in terrain.ts.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { World, type GameApi } from '../interactions/world';
import type { SceneExtras } from '../core/game';
import { makeCtx, floor, type Ctx } from './arch';
import { Batcher, box, boxMM, cyl, blob, compound, getKit, v3, geo, supportWarnings } from './kit';
import { softBox, projectUV } from './artkit';
import { table, chair, lantern, plant, staticLantern } from './furniture';
import { Vegetation, scatter, distToPolyline } from './nature';
import { buildManor } from './manor';
import { buildConservatory } from './conservatory';
import { buildCottage } from './cottage';
import { buildWellness } from './wellness';
import { buildGrounds } from './grounds';
import { buildForest, buildWoodlandMasses } from './forest';
import { EstateWoods } from './estateWoods';
import { buildBoslust } from './boslust';
import { addEnvironment } from './env';
import { ART } from '../core/artflags';
import { zoneGround, zonePathWidth, zonePathTint, pathVerge, finishZone, TreeGrid } from './boslustSample';
import { DENSE_WOODS } from './boslustZone';
import { makeLamp, makeAction, makeDoor, makePickup, place } from '../interactions/props';
import { pressLantern } from '../puzzles/rules';
import { addClue } from '../core/state';
import { drawSymbol, SYMBOLS } from '../content/symbols';
import { mulberry32 } from '../core/rng';
import { estateRooms } from './roomdefs';
import { ESTATE, SITES, DRIVEWAY, TERRACE, GF, HILL, WOODS, lakeQ, COTTAGE_PAD, WELLNESS } from './layout';
import { FOREST_PATHS, TCELL, TERRAIN_DIMS, gridAt, gridHeight, inHole, terrainHeight, walkHeight, entranceMound } from './terrain';
import { FOOTPRINTS, vegetationClear } from './footprints';
import { inRect as inR } from './geom2d';
import { beginOpenings, wallArtConflicts } from './openings';
import { pathNetwork, type Run } from './junctions';

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
  const openings = beginOpenings(); // DEV-04A: openings, door sweeps and wall art of this build (see openings.ts)
  supportWarnings.length = 0; // DEV-04A support contract (kit.ts `cyl` vs `rod`)
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
  const groundsC = makeCtx(w.col, 'grounds');
  const ugC = makeCtx(w.col, 'ug');

  // DEV-03: every tree of the layout goes to the estate woodland (woodkit); the cypresses stay clipped garden columns.
  // Old undergrowth blobs in the woodland (ferns, shrubs, rocks, flowers, grass, stumps) are replaced by the planned
  // understory; toadstools stay. Random draws are still made, so nothing else moves.
  // ?ext=base keeps the DEV-02 blob woodland for side-by-side comparison (review=boslust "Toon oud")
  const woods = ART.ext === 'sample' ? new EstateWoods() : null;
  if (woods) {
    veg.capture = (t, chunk) => { if (t.kind === 'cypress') return false; woods.addTree(t, chunk); return true; };
    const inWoodland = (x: number, z: number) => z < ESTATE.forestEdge + 1 || DENSE_WOODS.some((m) => inR(x, z, m, 1));
    veg.drop = (x, z, kind) => kind !== 'cap' && kind !== 'stem' && inWoodland(x, z);
  }
  buildPaths(w, ground);
  buildBoundary(w, g, ground, veg);
  buildManor(w, g, manorC, manorIn, manorB);
  buildConservatory(w, g, consC);
  buildWellness(w, gardenC);
  buildCottage(w, g, cotC);
  buildForest(w, g, forestC, veg, woods);
  buildBoslust(w, g, forestC, ugC, veg);
  buildWoodlandMasses(w, veg);
  buildGrounds(w, g, groundsC, veg, woods);
  buildGarden(w, g, gardenC, veg, woods);
  veg.drop = null; veg.capture = null;
  woods?.build(w, forestC);
  finishZone(w);
  buildGround(w, woods ? new TreeGrid(woods.points()) : null);

  for (const c of [ground, manorC, manorIn, manorB, consC, cotC, forestC, gardenC, groundsC, ugC]) c.b.build(w.scene);
  w.scene.userData.openings = openings;
  w.scene.userData.supportWarnings = [...supportWarnings];
  if (supportWarnings.length) console.warn('DEV-04A support contract:', JSON.stringify(supportWarnings));
  const artBad = wallArtConflicts(openings);
  if (artBad.length) console.warn('DEV-04A wall-art contract:', JSON.stringify(artBad));
  for (const m of veg.build(w.scene, true)) m.userData.region = 'outdoor';

  // whole-room culling: chunks are shown only while one of their rooms can be seen from the player's room
  const R = estateRooms();
  const manorRooms = R.rooms.filter((r) => r.floor === 'g' || r.floor === 'u' || r.floor === 'a').filter((r) => r.x0 >= 72 && r.x1 <= 116 && r.id !== 'cons').map((r) => r.id);
  const atticRooms = ['atticLanding', 'atticCommon', 'atticStore', 'atticLookout'];
  const basementRooms = ['bstair', 'bLobby', 'archive', 'boiler', 'route', 'tunnel2', 'tunnel'];
  const ugRooms = ['hut', 'descent', 'entry', 'passage', 'gathering', 'tunnel', 'tunnel2'];
  // furnishings per area: listed rooms are the ones from which that area can actually be seen (seen from
  // outside through the front door, only the vestibule and hall furnishings are drawn)
  w.roomRegion(['manor'], [...manorRooms, 'out', 'cons'], 130);
  // DEV-03: interiors seen from OUTSIDE (through an open door) only within ~30 m of the house: beyond that the opening
  // is a few pixels, but drawing the hall's furnishings from the forest cost ~100 k triangles (render budget)
  const IN_FAR = 30;
  w.roomRegion(['mIn'], manorRooms, Infinity, IN_FAR);
  w.roomRegion(['mHall'], ['vestibule', 'hall', 'living', 'lobby', 'billiard', 'frontGallery', 'walkway', 'landing'], Infinity, IN_FAR);
  w.roomRegion(['mLib'], ['library', 'libGallery'], Infinity, IN_FAR); // DEV-03: drawn when the library itself is visible (its doors open), not whenever the living room or lobby is
  w.roomRegion(['mWing'], ['dining', 'kitchen', 'corridor', 'workshop', 'pantry', 'utility', 'guestWC', 'lobby'], Infinity, IN_FAR);
  w.roomRegion(['mUp'], ['frontGallery', 'walkway', 'landing', 'libGallery', 'reis', 'sterren', 'bath', 'ucorr', 'study', 'botanic', 'storage', 'library', 'linen', 'rearNook', 'rearNookEast', 'atticStair'], Infinity, IN_FAR);
  w.roomRegion(['mAttic'], [...atticRooms, 'atticStair'], Infinity, IN_FAR); // seen through the open stair doors (atticStair is then visible)
  w.roomRegion(['mB'], basementRooms);
  w.roomRegion(['ug'], ugRooms);
  w.roomRegion(['cons', 'glass'], ['cons', 'out', 'corridor'], 95);
  w.roomRegion(['cottageIn'], ['cottageEntry', 'cottageRoom'], Infinity, 25);
  w.roomRegion(['cottage'], ['out', 'cottageEntry', 'cottageRoom'], 75); // a landmark across the lake: visible from the terrace and the lawn
  w.roomRegion(['ground', 'paths', 'wall', 'fence', 'garden', 'grounds', 'forest', 'outdoor', 'hills'], ['out', 'cons', 'sauna', 'shed', 'cottageEntry', 'cottageRoom']);
  w.roomRegion(['wick'], ['out', 'cons', 'sauna', 'shed', 'cottageEntry', 'cottageRoom'], 70); // DEV-04A: the enclosed wickerman clearing

  w.spawn = { x: SITES.gate.x, y: 0, z: 3, yaw: 0, pitch: 0.02 };
  w.checkpoints.push(
    { name: 'gate', pose: { x: SITES.gate.x, y: 0, z: 3, yaw: 0, pitch: 0 } },
    { name: 'forecourt', pose: { x: 90, y: 0, z: 72, yaw: 0, pitch: 0 } },
    { name: 'garden', pose: { x: 90, y: 0, z: 122, yaw: 0, pitch: 0 } },
  );

  // exterior openings for the indoor view test (World.exteriorDoors): open doors to 'out' and glass walls
  for (const p of R.portals) {
    if (p.a !== 'out' && p.b !== 'out') continue;
    if (p.kind === 'door' && p.door) {
      const it = w.byId.get(p.door);
      if (!it) continue;
      it.hit[0].updateWorldMatrix(true, false);
      const v = it.hit[0].getWorldPosition(new THREE.Vector3());
      w.exteriorDoors.push({ door: p.door, x: v.x, y: v.y, z: -v.z, r: 0.9 });
    } else if (p.kind === 'glass') {
      // a glass room shows the outdoors: its doors from the house count as exterior openings
      const glassRoom = p.a === 'out' ? p.b : p.a;
      for (const q of R.portals) {
        if (!q.door || q.kind !== 'door' || (q.a !== glassRoom && q.b !== glassRoom) || q.a === 'out' || q.b === 'out') continue;
        const it = w.byId.get(q.door);
        if (!it) continue;
        it.hit[0].updateWorldMatrix(true, false);
        const v = it.hit[0].getWorldPosition(new THREE.Vector3());
        w.exteriorDoors.push({ door: q.door, x: v.x, y: v.y, z: -v.z, r: 0.9 });
      }
    }
  }
  const isIndoor = (x: number, z: number, y = 0) => R.roomAt(x, y + 0.8, z) !== 'out';
  const surfaceAt = (x: number, z: number, y = 0): 'grass' | 'wood' | 'stone' => {
    const room = R.roomAt(x, y + 0.8, z);
    if (room !== 'out') return R.get(room)?.floor === 'b' || room === 'cons' || room === 'hall' || room === 'vestibule' || room === 'kitchen' ? 'stone' : 'wood';
    if (inR(x, z, WELLNESS) && y > 0.1) return 'wood';
    if (FOOTPRINTS.some((f) => f.kind === 'platform' && inR(x, z, f)) || inRect(x, z, TERRACE.x0, TERRACE.x1, TERRACE.z0, TERRACE.z1) || inRect(x, z, 60, 66, 8, 18.2)) return 'stone';
    if (FOOTPRINTS.some((f) => f.kind === 'parking' && inR(x, z, f))) return 'stone';
    if (distToPolyline(x, z, DRIVEWAY) < 2.4 || Math.hypot(x - SITES.forecourt.x, z - SITES.forecourt.z) < 8) return 'stone';
    return 'grass';
  };
  return { world: w, extras: { env, isIndoor, surfaceAt, rooms: R } };
}

// ---------------------------------------------------------------------------------------------
// Ground: one indexed heightfield (same 2 m grid + triangle split as collision), holes under buildings.
function buildGround(w: World, trees: TreeGrid | null) {
  const k = getKit();
  const r = mulberry32(3);
  const { NX, NZ, X0: GX0, Z0: GZ0 } = TERRAIN_DIMS;
  const n = (NX + 1) * (NZ + 1);
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
  const forest = new THREE.Color('#6f8c43'), lawn = new THREE.Color(ART.ext === 'sample' ? '#8eac58' : '#9cc05e'), moss = new THREE.Color('#5d7a38'), dirt = new THREE.Color('#9a8456'), hillC = new THREE.Color('#7f9a4a');
  const c = new THREE.Color();
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
    const vi = j * (NX + 1) + i, x = GX0 + i * TCELL, z = GZ0 + j * TCELL, h = gridAt(i, j);
    pos.set([x, h, -z], vi * 3);
    uv.set([x / 5, z / 5], vi * 2);
    const t = THREE.MathUtils.smoothstep(z, ESTATE.forestEdge - 8, ESTATE.forestEdge + 2);
    c.copy(moss).lerp(forest, r()).lerp(lawn, t);
    const hr = Math.hypot(x - HILL.x, z - HILL.z);
    if (hr < HILL.r + 2) c.lerp(hillC, 0.5 * (1 - hr / (HILL.r + 2)));
    let dp = Infinity;
    for (const p of FOREST_PATHS) dp = Math.min(dp, distToPolyline(x, z, p));
    if (dp < 3) c.lerp(dirt, (1 - dp / 3) * 0.35);
    // DEV-02: darker floor under the woodland masses, damp shore round the lake, worn ground on the plateau
    if (WOODS.some((wd) => wd.gap < 8 && x > wd.x0 - 2 && x < wd.x1 + 2 && z > wd.z0 - 2 && z < wd.z1 + 2)) c.lerp(forest, 0.6);
    const lq = lakeQ(x, z);
    if (lq < 1.35) c.lerp(new THREE.Color('#7a7a4a'), 0.5 * (1 - Math.max(0, lq - 1) / 0.35));
    if (inR(x, z, COTTAGE_PAD)) c.lerp(dirt, 0.15);
    if (trees) zoneGround(x, z, c, trees); // DEV-03: the woodland floor wherever the woodland weight is > 0
    col.set([c.r, c.g, c.b], vi * 3);
  }
  const idx: number[] = [];
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    if (inHole(GX0 + i * TCELL + 1, GZ0 + j * TCELL + 1)) continue;
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
      c.copy(hillC).lerp(moss, 0.35 + 0.3 * Math.sin(i * 1.7 + j)); if (trees) zoneGround(x, z, c, trees); mc.push(c.r, c.g, c.b);
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
  const gx0 = GX0, gx1 = GX0 + NX * TCELL, gz0 = GZ0, gz1 = GZ0 + NZ * TCELL; // the grid itself reaches beyond the fence
  const parts = ([[-300, W + 300, -300, gz0], [-300, W + 300, gz1, D + 300], [-300, gx0, gz0, gz1], [gx1, W + 300, gz0, gz1]] as const).map(([x0, x1, z0, z1]) => {
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

/** DEV-04A: a clipped network run draped on the terrain (three vertices across: left edge, centre, right edge). */
function runGeo(run: Run, width: number, lift: number): THREE.BufferGeometry {
  const pos: number[] = [], uv: number[] = [], col: number[] = [], mouth: number[] = [], idx: number[] = [];
  run.rows.forEach((r, i) => {
    for (const [x, z, u] of [[r.lx, r.lz, 0], [r.x, r.z, width / 6], [r.rx, r.rz, width / 3]] as const) {
      pos.push(x, terrainHeight(x, z) + lift, -z); uv.push(u, r.d / 3); col.push(1, 1, 1); mouth.push(r.mouth);
    }
    if (i > 0) { const o = (i - 1) * 3; for (const [q0, q1] of [[0, 1], [1, 2]]) idx.push(o + q0, o + q0 + 3, o + q1 + 3, o + q0, o + q1 + 3, o + q1); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('mouth', new THREE.Float32BufferAttribute(mouth, 1));
  g.setIndex(idx);
  const ng = g.toNonIndexed();
  g.dispose();
  ng.computeVertexNormals();
  const nn = ng.attributes.normal;
  for (let i = 0; i < nn.count; i++) if (nn.getY(i) < 0) nn.setXYZ(i, -nn.getX(i), -nn.getY(i), -nn.getZ(i));
  ng.userData.mouth = (ng.attributes.mouth as THREE.BufferAttribute).array;
  ng.deleteAttribute('mouth');
  return ng;
}

function buildPaths(w: World, c: Ctx) {
  const k = getKit();
  // DEV-04A: every drawn path comes from ONE ownership network (junctions.ts): the driveway owns its corridor, forest
  // paths stop at the driveway and the arrival gravel, routes stop at every hard surface (terraces, platforms, the
  // cottage landing, the tee mat, the viewpoint bay), the forest paths and the routes ranked above them. Where a path
  // meets its owner it widens into a mouth cut flush to the owner's edge (no overlapping footprints, no leftover
  // triangles); forest paths blend into the gravel's tint at the forecourt. Lifts follow rank (never coplanar).
  const sample = ART.ext === 'sample';
  const gravel = new THREE.Color('#d4cfc2'), forestTint = new THREE.Color('#c8ad80');
  const toGravel = [gravel.r / forestTint.r, gravel.g / forestTint.g, gravel.b / forestTint.b];
  const verge: [number, number][][] = [];
  for (const line of pathNetwork(sample ? zonePathWidth : undefined)) {
    for (const run of line.runs) {
      const lift = line.kind === 'drive' ? 0.04 : line.kind === 'forest' ? 0.035 : 0.03;
      let gg = runGeo(run, line.width, lift);
      const woodland = line.kind === 'forest' || line.id.startsWith('wickerman') || line.id === 'golfSpur';
      if (woodland && line.kind === 'route' && sample) gg = zonePathTint(gg); // same soil as the forest path it leaves
      if (line.kind === 'forest') {
        if (sample) gg = zonePathTint(gg);
        // the mouth at the forecourt / driveway takes the gravel's colour: one surface handing over to the next
        const cc = gg.attributes.color as THREE.BufferAttribute, mw = gg.userData.mouth as Float32Array;
        for (let i = 0; i < cc.count; i++) { const m = mw[i] * 0.85; cc.setXYZ(i, cc.getX(i) * (1 + (toGravel[0] - 1) * m), cc.getY(i) * (1 + (toGravel[1] - 1) * m), cc.getZ(i) * (1 + (toGravel[2] - 1) * m)); }
        gg.userData.keepColor = true;
        verge.push(run.rows.map((r) => [r.x, r.z]));
      }
      const tint = line.kind === 'drive' ? '#d4cfc2' : woodland ? '#c8ad80' : '#d9d2c2';
      c.b.add(k.M.dirt, gg, new THREE.Matrix4(), tint, 'paths', false, 0);
      gg.dispose();
    }
  }
  if (sample) pathVerge(w, verge, (k.M.dirt as THREE.MeshLambertMaterial).map!);
  // forecourt: the gravel court itself is one surface built with the arrival (grounds.ts); the central planter stays
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
  for (const [x, z] of outside) {
    const kind = r() < 0.25 ? 'pine' : 'oak';
    const spec = { x, z, h: kind === 'pine' ? 6 + r() * 3 : 3.5 + r() * 2.5, r: 1.8 + r() * 1.0, kind, hue: r() - 0.5, y: terrainHeight(x, z) } as const;
    veg.tree(spec, 'outer'); // DEV-03: captured by the estate woodland (woodkit trees, LOD by distance)
  }
}

// ---------------------------------------------------------------------------------------------
// Garden: dining terrace, open lawn with the lantern circle (thread C), scattered trees and flowers.
function buildGarden(w: World, g: GameApi, c: Ctx, veg: Vegetation, woods: EstateWoods | null) {
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
  for (const [x, z] of [[78.6, 110.6], [102.4, 110.6], [78.6, 116.4], [101.4, 116.4], [96, 116.4]] as const) plant(c, x, z, GF, 1.2, '#c9774a'); // DEV-03: the pot by the kitchen back door clears its doorway
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

  // trees: a few specimen oaks, cypresses and birches around the open lawns (the old nest-box oak now stands on the
  // lake's east shore, grounds.ts); every tree passes the shared keepouts (no crown over a building, platform or path)
  const oaks: [number, number][] = [[64, 84], [58, 100], [44, 92], [40, 110], [120, 82], [140, 88], [150, 120], [112, 132], [100, 142], [140, 140], [160, 100], [26, 96], [30, 128], [166, 76], [26, 78], [58, 120], [118, 145], [132, 126], [44, 76], [150, 160]];
  for (const [x, z] of oaks) {
    const hh = 4 + r() * 1.5, rr = 2.4 + r() * 0.8, hue = r() - 0.5;
    if (!vegetationClear(x, z, 'tree')) continue;
    veg.tree({ x, z, h: hh, r: rr, kind: 'oak', hue, y: terrainHeight(x, z) }, 'garden');
    w.col.addCircle(x, z, 0.4, terrainHeight(x, z), terrainHeight(x, z) + 6);
  }
  for (const [x, z] of [[71, 80.5], [71, 86], [109, 80.5], [69, 112], [111, 112.5], [126, 117.5], [79.2, 64], [100.8, 64]] as const) {
    const hh = 5.5 + r() * 1.5, hue = r() - 0.5;
    if (!vegetationClear(x, z, 'small')) continue;
    veg.tree({ x, z, h: hh, r: 0.75, kind: 'cypress', hue }, 'garden');
    w.col.addCircle(x, z, 0.35, 0, 6);
  }
  for (const [x, z] of [[34, 122], [160, 130], [150, 82]] as const) {
    if (!vegetationClear(x, z, 'small')) continue;
    veg.tree({ x, z, h: 5, r: 1.6, kind: 'birch', hue: 0, y: terrainHeight(x, z) }, 'garden');
    w.col.addCircle(x, z, 0.25, 0, 6);
  }
  // flower patches and low shrubs (no collision)
  // DEV-03: flower beds of woodland-kit plants (foxglove for the purple, anemone for the white/pink/yellow) instead of
  // icosahedron "crystals"; the random draws are still made, so nothing else in the garden moves
  const patch = (cx: number, cz: number, rad: number, n: number, colors: string[]) => {
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * rad;
      const fx = cx + Math.cos(a) * d, fz = cz + Math.sin(a) * d, sz = 0.12 + r() * 0.08, col = colors[Math.floor(r() * colors.length)];
      if (!vegetationClear(fx, fz, 'small')) continue;
      if (woods) woods.addPlant(col.startsWith('#b8') || col.startsWith('#9a') ? 'foxglove' : 'anemone', i, fx, fz, 0.8 + sz * 1.5);
      else veg.smallThing('flower', fx, fz, sz, col, 'garden', terrainHeight(fx, fz));
    }
  };
  const purple = ['#b89ad8', '#9a7ac8', '#f2f0e6', '#e8a8c8'];
  for (const L of LANTERNS) patch(L.x, L.z, 1.4, 10, purple);
  patch(76, 120, 2.2, 18, purple);
  patch(104, 120, 2.2, 18, ['#f2c6d8', '#f2f0e6', '#e8c547']);
  patch(70, 132, 1.6, 12, ['#f2c6d8', '#f2f0e6', '#e8c547']);
  patch(66, 76, 1.6, 12, purple);
  patch(114, 76, 1.6, 12, purple);
  // DEV-02 placement contract (footprints.ts): no scatter in a building, on a platform, in the water or on a route
  const inWood = (x: number, z: number) => WOODS.some((wd) => wd.gap < 8 && inR(x, z, wd));
  const clearOf = (x: number, z: number) =>
    z > ESTATE.forestEdge + 1 && vegetationClear(x, z, 'small') && !inRect(x, z, 70, 132, 78, 119) && !inWood(x, z) &&
    Math.hypot(x - LC.x, z - LC.z) > 5.5 && distToPolyline(x, z, DRIVEWAY) > 3 && Math.hypot(x - SITES.forecourt.x, z - SITES.forecourt.z) > 10.5;
  for (const [x, z] of scatter(r, 2, ESTATE.w - 2, ESTATE.forestEdge, ESTATE.d - 2, 5.0, 2200, clearOf)) {
    const flower = r() < 0.55, v = r();
    if (woods) { if (flower && v < 0.4) for (let q = 0; q < 3; q++) woods.addPlant('anemone', q, x + (q - 1) * 0.25, z + ((q * 7) % 3 - 1) * 0.2, 0.9); } // a calm lawn: a few low clumps, no pebble shrubs
    else if (flower) veg.smallThing('flower', x, z, 0.14, purple[Math.floor(v * 4)], 'garden', terrainHeight(x, z));
    else veg.smallThing('shrub', x, z, 0.4 + v * 0.3, '#5a8a3e', 'garden', terrainHeight(x, z));
  }
  // soft meadow: grass tufts across the lawns (instanced, tiled so only nearby tiles draw; DEV-03: 2.5 m spacing, the
  // low flowers and the woodland understory carry the ground detail now)
  for (const [x, z] of scatter(r, 2, ESTATE.w - 2, ESTATE.forestEdge - 4, ESTATE.d - 2, 2.5, 11000, (x, z) => clearOf(x, z) || (z > 118 && vegetationClear(x, z, 'small') && !inWood(x, z) && Math.hypot(x - LC.x, z - LC.z) > 4.5))) {
    const size = 0.25 + r() * 0.2, col = r() < 0.5 ? '#7fae4a' : '#94bc58';
    veg.smallThing('grass', x, z, size, col, `gr${Math.floor(x / 40)}_${Math.floor(z / 40)}`, terrainHeight(x, z));
  }
  if (woods) {
    // forecourt planter: a clipped box ball in the middle, a ring of foxgloves and anemones (planted in the soil)
    const k2 = c.k;
    blob(c.b, k2.M.foliage, '#3f5f34', SITES.forecourt.x, 0.95, SITES.forecourt.z, 0.75, 0.6, 0.75, { chunk: c.chunk });
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, d = 1.25 + (i % 2) * 0.15; woods.addPlant(i % 3 ? 'anemone' : 'foxglove', i, SITES.forecourt.x + Math.cos(a) * d, SITES.forecourt.z + Math.sin(a) * d, 0.9, 0.45); }
    // clipped box hedges along the manor front (two runs, the approach to the porch open), on a low collider
    // one clipped piece per run (DEV-03 budget: 16 short pieces cost 9.4 k triangles in the forecourt view; one
    // piece per run with the same wavy clipped top costs ~2 k)
    for (const [x0, x1] of [[72.6, 84.9], [95.1, 107.4]] as const) {
      geo(c.b, k2.M.foliage, '#3f5f34', hedgeGeo(x1 - x0), (x0 + x1) / 2, 0, 79.2, { chunk: c.chunk });
      w.col.addBox(x0, x1, 78.85, 79.55, 0, 0.75);
    }
  } else {
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2, d = 0.9 + (i % 3) * 0.2;
      veg.smallThing(i % 4 === 0 ? 'shrub' : 'flower', SITES.forecourt.x + Math.cos(a) * d, SITES.forecourt.z + Math.sin(a) * d, i % 4 === 0 ? 0.35 : 0.14, i % 4 === 0 ? '#4f7f38' : purple[i % 4], 'garden', 0.46);
    }
    // hedges along the manor front, leaving the approach to the porch open
    for (let x = 72.5; x < 107.6; x += 1.1) if (Math.abs(x - 90) > 5) veg.smallThing('shrub', x, 79.15, 0.55, '#4a7a36', 'garden');
  }
}

let hedgeCache: Map<number, THREE.BufferGeometry> | null = null;
/** A clipped hedge segment (len × 0.7 × 0.78): a soft box with a slightly domed, uneven top (foliage texture). */
function hedgeGeo(len: number) {
  hedgeCache ??= new Map();
  const key = Math.round(len * 100);
  let g = hedgeCache.get(key);
  if (!g) {
    g = softBox(len, 0.78, 0.7, 0.14, 2, 5).translate(0, 0.39, 0);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > 0.6) p.setY(i, y + 0.04 * Math.sin(p.getX(i) * 4.1) * Math.cos(p.getZ(i) * 5.3)); }
    g.computeVertexNormals();
    projectUV(g, 0.6);
    g.userData.shared = true;
    hedgeCache.set(key, g);
  }
  return g;
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
  { id: 'lake', x: SITES.lakeView.x, z: SITES.lakeView.z, label: 'meer' },
  { id: 'wellness', x: SITES.jacuzzi.x, z: SITES.jacuzzi.z, label: 'jacuzzi' },
  { id: 'golf', x: SITES.golf.x, z: SITES.golf.z, label: 'golf' },
  { id: 'wickerman', x: SITES.wickerman.x, z: SITES.wickerman.z, label: 'stroman' },
  { id: 'fork', x: SITES.fork.x, z: SITES.fork.z, label: 'wegwijzer' },
  { id: 'hill', x: SITES.hill.x, z: SITES.hill.z, label: 'heuvel' },
];

void gridHeight; void v3;
