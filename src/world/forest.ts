// Woodland: X 0–200, Z 0–72 (the southern band of the estate) on gently rolling ground. DEV-02: the same recipe over
// the wider estate, respecting the shared placement keepouts (golf, wickerman, routes), plus the woodland masses that
// enclose the north half (west bank, north ridge, east ridge, the glades) — see buildWoodlandMasses. A looping path network
// joins the clearings: timber shed (west), fire clearing (south-west), stone well (east), the old side
// gate (south-east) and a side path from the fork signpost to the BOSLUST hill (built in boslust.ts).
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, floor, gableRoof } from './arch';
import { box, boxMM, cyl, rod, blob, compound, v3, planMatrix } from './kit';
import { lantern, crate, part, staticLantern } from './furniture';
import { makeFire } from './fire';
import { makeDoor, makeDrawer, makePickup, makeLamp, makeAction, makeInspect, place } from '../interactions/props';
import { Vegetation, scatter, distToPolyline } from './nature';
import { mulberry32 } from '../core/rng';
import { plaqueTexture } from './textures';
import { useOnFirePit, lightPostLantern, readFirePlate } from '../puzzles/rules';
import { has } from '../core/state';
import { ITEMS } from '../content/items';
import { ESTATE, SITES, DRIVEWAY, CLEARINGS, SHED, HILL, WOODS } from './layout';
import { vegetationClear } from './footprints';
import { FOREST_PATHS, terrainHeight } from './terrain';
import { ART } from '../core/artflags';
import { signpostV2, stumpsV2 } from './boslustSample';
import { woodMats, rockModel, logModel } from './woodkit';
import type { EstateWoods } from './estateWoods';

const FIRE_STONE = (() => { const g = rockModel(61); g.userData.keepColor = true; return g; })();
const BENCH_LOG = logModel(131, 2.2, 0.21);
const SPLIT_LOG = logModel(137, 0.9, 0.1).translate(-0.45, -0.07, 0);

export function forestTreeOk(x: number, z: number) {
  if (z > ESTATE.forestEdge - 0.8 || z < 1.8) return false;
  if (distToPolyline(x, z, DRIVEWAY) < 4.6) return false;
  for (const p of FOREST_PATHS) if (distToPolyline(x, z, p) < 2.7) return false;
  for (const c of CLEARINGS) if (Math.hypot(x - c.x, z - c.z) < c.r) return false;
  if (x > 57 && x < 69 && z > 5 && z < 25) return false; // the cut, door and mound in front of BOSLUST
  if (Math.abs(x - SITES.sideGate.x) < 1.6 && z < 34) return false; // old boundary wall
  return vegetationClear(x, z, 'tree'); // DEV-02 keepouts: golf tee/chute, wickerman clearing + loop, arrival, routes
}

/** The tree positions (the forest scatter is the first consumer of its random stream, so this repeats it exactly). */
export function forestTreePoints() {
  return scatter(mulberry32(42), 1.2, ESTATE.w - 1.2, 1.2, ESTATE.forestEdge, 4.0, 15600, forestTreeOk);
}

export function buildForest(w: World, g: GameApi, c: Ctx, veg: Vegetation, woods: EstateWoods | null) {
  const k = c.k;
  const r = mulberry32(42);
  // trees: Poisson-disc spacing ≥ 4.0 m keeps ≥ 2 m gaps between trunks — never a sealed wall
  const pts = scatter(r, 1.2, ESTATE.w - 1.2, 1.2, ESTATE.forestEdge, 4.0, 15600, forestTreeOk);
  // DEV-03: every tree keeps its position and collision but is drawn by the estate woodland (woodkit; the Vegetation
  // capture hook set by estate.ts hands it over without changing the random sequence)
  for (const [x, z] of pts) {
    const roll = r();
    const onHill = Math.hypot(x - HILL.x, z - HILL.z) < HILL.r;
    const kind = roll < (onHill ? 0.35 : 0.16) ? 'pine' : roll < 0.3 ? 'birch' : 'oak';
    const h = kind === 'pine' ? 6 + r() * 3 : 3.2 + r() * 2.6;
    const rad = kind === 'pine' ? 1.5 + r() * 0.6 : 1.7 + r() * 1.1;
    const y = terrainHeight(x, z);
    const spec = { x, z, h, r: rad, kind, hue: r() - 0.5, y } as const;
    veg.tree(spec, `f${Math.floor(x / 45)}_${Math.floor(z / 36)}`, `T${Math.floor(x / 100)}_${Math.floor(z / 90)}`); // DEV-02: trunks/cones on a coarse grid
    w.col.addCircle(x, z, kind === 'birch' ? 0.22 : 0.34, y - 0.5, y + 6);
  }
  // undergrowth (no collision): ferns, shrubs, rocks, flowers
  const undergrowthOk = (x: number, z: number) => z < ESTATE.forestEdge - 0.5 && distToPolyline(x, z, DRIVEWAY) > 2.6 && !FOREST_PATHS.some((p) => distToPolyline(x, z, p) < 1.3) && !(x > 59 && x < 67 && z > 7 && z < 25) && vegetationClear(x, z, 'small');
  for (const [x, z] of scatter(r, 1, ESTATE.w - 1, 1, ESTATE.forestEdge, 3.4, 7000, undergrowthOk)) {
    const roll = r();
    const chunk = `f${Math.floor(x / 45)}_${Math.floor(z / 36)}`;
    const y = terrainHeight(x, z);
    if (roll < 0.45) veg.smallThing('fern', x, z, 0.35 + r() * 0.3, r() < 0.5 ? '#6a9a3e' : '#557f34', chunk, y);
    else if (roll < 0.7) veg.smallThing('shrub', x, z, 0.45 + r() * 0.4, r() < 0.5 ? '#4f7f38' : '#5f8f40', chunk, y);
    else if (roll < 0.8) veg.smallThing('rock', x, z, 0.25 + r() * 0.3, '#9a968a', chunk, y);
    else veg.smallThing('flower', x, z, 0.14, r() < 0.5 ? '#b89ad8' : '#f2f0e6', chunk, y);
  }

  // storybook details: toadstool clusters at tree feet, old stumps, grass tufts along the paths
  pts.forEach(([x, z], i) => {
    if (i % 6 !== 0) return;
    const a = r() * Math.PI * 2, mx = x + Math.cos(a) * 0.75, mz = z + Math.sin(a) * 0.75;
    if ((!forestTreeOk(mx, mz) && FOREST_PATHS.some((p) => distToPolyline(mx, mz, p) < 1.3)) || !vegetationClear(mx, mz, 'small')) return;
    veg.mushrooms(mx, mz, terrainHeight(mx, mz), `f${Math.floor(x / 45)}_${Math.floor(z / 36)}`, 2 + (i % 3));
  });
  for (const [x, z] of scatter(r, 3, ESTATE.w - 3, 3, ESTATE.forestEdge - 2, 11, 1200, forestTreeOk)) {
    const y = terrainHeight(x, z), sc = 0.25 + r() * 0.2;
    veg.smallThing('stump', x, z, sc, '#8a6a4a', `f${Math.floor(x / 45)}_${Math.floor(z / 36)}`, y);
    woods?.addStump({ x, z, y, s: sc }); // drawn by the estate woodland (stumpsV2: same collider)
    w.col.addCircle(x, z, sc, y - 0.2, y + sc * 0.9);
    if (r() < 0.5) veg.mushrooms(x + sc + 0.15, z, y, `f${Math.floor(x / 45)}_${Math.floor(z / 36)}`, 2);
  }
  for (const p of FOREST_PATHS) for (let i = 1; i < p.length; i++) {
    const [ax, az] = p[i - 1], [bx, bz] = p[i];
    const seg = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / seg, nz = (bx - ax) / seg;
    for (let t = 0; t < seg; t += 1.6) {
      const side = r() < 0.5 ? -1 : 1, off = 1.25 + r() * 0.8;
      const x = ax + ((bx - ax) * t) / seg + nx * off * side, z = az + ((bz - az) * t) / seg + nz * off * side;
      if (!vegetationClear(x, z, 'small')) continue; // DEV-02: not on the arrival court / manoeuvring strip
      veg.smallThing('grass', x, z, 0.28 + r() * 0.18, r() < 0.5 ? '#6f9a3e' : '#86a84a', `gr${Math.floor(x / 40)}_${Math.floor(z / 40)}`, terrainHeight(x, z));
    }
  }

  buildShed(w, g, c);
  buildFireClearing(w, g, c);
  buildWell(w, g, c);
  buildSideGate(w, g, c);
  if (ART.ext === 'sample') signpostV2(w, g, c);
  else buildFork(w, g, c);

  // forest lanterns along the paths for orientation at dusk (every ~30 m, just off the path)
  let li = 0;
  for (const p of FOREST_PATHS) {
    let acc = 12;
    for (let i = 1; i < p.length; i++) {
      const [ax, az] = p[i - 1], [bx, bz] = p[i];
      const seg = Math.hypot(bx - ax, bz - az);
      acc += seg;
      if (acc < 30) continue;
      acc = 0;
      const nx = -(bz - az) / seg, nz = (bx - ax) / seg, side = li++ % 2 ? 1 : -1;
      const x = bx + nx * 1.7 * side, z = bz + nz * 1.7 * side, y = terrainHeight(x, z);
      cyl(c.b, k.M.wood, '#5a3a22', x, y - 0.1, z, 0.06, 0.07, 1.5, 6, { chunk: c.chunk });
      staticLantern(c, w, x, y + 1.4, z, 0.6, 0, 2.2, 6);
      w.col.addCircle(x, z, 0.12, y, y + 2);
    }
  }
  w.checkpoints.push(
    { name: 'shed', pose: { x: SHED.x1 + 3.5, y: 0, z: 39, yaw: -Math.PI / 2, pitch: 0 } },
    { name: 'fire', pose: { x: SITES.fire.x + 3.5, y: 0, z: SITES.fire.z - 2.5, yaw: -0.9, pitch: 0 } },
    { name: 'well', pose: { x: SITES.well.x, y: 0, z: SITES.well.z - 4, yaw: 0, pitch: 0 } },
    { name: 'fork', pose: { x: SITES.fork.x - 1.5, y: 0, z: SITES.fork.z - 1.2, yaw: 0.6, pitch: 0 } },
  );
}

// ---------------------------------------------------------------------------------------------
function buildShed(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = SHED;
  const H = 2.6, DZ = (Z0 + Z1) / 2 - 0.05; // door centre (east wall)
  const plank = { mat: k.M.wood, color: '#8a5a33' };
  const wallBox = (x0: number, x1: number, z0: number, z1: number) => {
    boxMM(c.b, plank.mat, plank.color, x0, x1, 0, H, z0, z1, { chunk: c.chunk, uv: 1.4 });
    w.col.addBox(x0, x1, z0, z1, 0, H, { occludes: true });
  };
  wallBox(X0, X1, Z0, Z0 + 0.12);
  wallBox(X0, X1, Z1 - 0.12, Z1);
  wallBox(X0, X0 + 0.12, Z0, Z1);
  wallBox(X1 - 0.12, X1, Z0, DZ - 0.5);
  wallBox(X1 - 0.12, X1, DZ + 0.5, Z1);
  boxMM(c.b, plank.mat, plank.color, X1 - 0.12, X1, 2.25, H, DZ - 0.5, DZ + 0.5, { chunk: c.chunk, uv: 1.4 });
  // darker interior lining (the shed reads as dim inside)
  boxMM(c.b, k.M.wood, '#3e2a1a', X0 + 0.12, X1 - 0.12, 0, H, Z1 - 0.14, Z1 - 0.12, { chunk: c.chunk, uv: 1.4, shadow: false });
  boxMM(c.b, k.M.wood, '#3e2a1a', X0 + 0.12, X0 + 0.14, 0, H, Z0 + 0.12, Z1 - 0.12, { chunk: c.chunk, uv: 1.4, shadow: false });
  boxMM(c.b, k.M.wood, '#3e2a1a', X0 + 0.12, X1 - 0.12, 0, H, Z0 + 0.12, Z0 + 0.14, { chunk: c.chunk, uv: 1.4, shadow: false });
  floor(c, X0 + 0.12, X1 - 0.12, Z0 + 0.12, Z1 - 0.12, 0.1, k.M.wood, '#4a3020', 0.1, true, 1.4);
  boxMM(c.b, k.M.wood, '#3e2a1a', X0, X1, H - 0.02, H, Z0, Z1, { chunk: c.chunk, uv: 1.4, shadow: false });
  gableRoof(c, (X0 + X1) / 2, (Z0 + Z1) / 2, X1 - X0 + 0.6, Z1 - Z0 + 0.7, H, 1.3, true, k.M.slate, '#7a7a6a');
  for (const x of [X0, X1]) {
    const tri = new THREE.Shape();
    tri.moveTo(-(Z1 - Z0) / 2, 0); tri.lineTo((Z1 - Z0) / 2, 0); tri.lineTo(0, 1.3); tri.closePath();
    const tg = new THREE.ShapeGeometry(tri);
    tg.rotateY(Math.PI / 2);
    c.b.add(k.M.wood, tg, new THREE.Matrix4().makeTranslation(x, H, -(Z0 + Z1) / 2), '#7a4f2c', c.chunk);
    const tg2 = tg.clone();
    tg2.rotateY(Math.PI);
    c.b.add(k.M.wood, tg2, new THREE.Matrix4().makeTranslation(x, H, -(Z0 + Z1) / 2), '#7a4f2c', c.chunk);
    tg.dispose(); tg2.dispose();
  }
  makeDoor(w, g, { id: 'door.shed', x: X1, z: DZ - 0.5, dir: 'z+', width: 1.0, height: 2.2, y0: 0.1, swing: -1, color: '#6b4a2a', style: 'plank', key: 'shedKey' });
  staticLantern(c, w, X1 + 0.15, 2.0, DZ + 1.2, 0.6, 0, 2.5, 6);
  // DEV-04A: the log pile floated ~0.5 m in the air (three long logs laid through `cyl`, which takes a BASE height). It is
  // now a stacked log store against the east wall south of the door: split logs on the ground, end grain out, rows
  // resting in the grooves of the row below, held by stakes at both ends (the same woodpile as the fire clearing)
  woodpile(c, X1 + 0.47, Z0 + 0.62, -Math.PI / 2, 5, 4, mulberry32(2203));
  w.col.addBox(X1, X1 + 0.95, Z0 + 0.0, Z0 + 1.24, 0, 1.0);
  cyl(c.b, k.M.bark, '#7a5a3a', X1 + 1.5, 0, Z0 + 0.1, 0.35, 0.4, 0.5, 9, { chunk: c.chunk });
  w.col.addCircle(X1 + 1.5, Z0 + 0.1, 0.4, 0, 0.6);
  // workbench along the north wall; its drawer holds the forest-walk journal
  boxMM(c.b, k.M.wood, '#6b4a2a', X0 + 0.5, X1 - 0.9, 0.9, 0.97, Z1 - 0.8, Z1 - 0.15, { chunk: c.chunk, uv: 1 });
  for (const x of [X0 + 0.6, X1 - 1.0]) boxMM(c.b, k.M.wood, '#5a3a22', x - 0.05, x + 0.05, 0.1, 0.9, Z1 - 0.75, Z1 - 0.2, { chunk: c.chunk });
  w.col.addBox(X0 + 0.5, X1 - 0.9, Z1 - 0.85, Z1 - 0.12, 0, 1.0);
  const wd = makeDrawer(w, g, { id: 'shed.drawer', x: X0 + 1.7, y: 0.8, z: Z1 - 0.5, yaw: Math.PI, w: 0.8, h: 0.16, d: 0.55, color: '#7a5a3a' });
  const journal = compound((b) => {
    box(b, k.M.paint, '#4f6a3a', 0, 0, 0, 0.18, 0.025, 0.24);
    box(b, k.M.paint, '#efe2c2', 0.008, 0.004, 0, 0.16, 0.02, 0.22);
    box(b, k.M.paint, '#c9a44c', -0.06, 0.026, 0, 0.02, 0.003, 0.2);
  });
  journal.position.set(0.1, -0.05, 0);
  wd.slider.add(journal);
  makePickup(w, g, { id: 'pk.journal', item: 'journal', obj: journal, available: wd.isOpen, hit: [0.3, 0.12, 0.3], after: () => g.inspect('c.journal') });
  // kindling bundle on the floor
  const kind = compound((b) => {
    for (let i = 0; i < 7; i++) rod(b, k.M.bark, '#c8a070', 0, 0.035 + Math.floor(i / 3) * 0.065, (i % 3) * 0.075 - 0.075 + (Math.floor(i / 3) % 2) * 0.035, 0.035, 0.035, 0.6, 5, { rz: Math.PI / 2 });
    box(b, k.M.paint, '#c4553d', 0, 0.02, 0, 0.04, 0.22, 0.05);
  });
  place(kind, X0 + 0.9, 0.1, Z0 + 0.6, 0.2);
  w.scene.add(kind);
  makePickup(w, g, { id: 'pk.kindling', item: 'kindling', obj: kind, hit: [0.7, 0.35, 0.4] });
  crate(c, X1 - 0.9, Z0 + 0.45, 0.1, 0.6, 0.2);
  // tool board on the west wall (needs light to read)
  const boardMat = w.material(new THREE.MeshLambertMaterial({
    map: w.texture(plaqueTexture({ w: 256, h: 192, bg: '#4a3a2a', ink: '#efe6d0', title: 'Gereedschap', lines: ['Eerst het vuur.', 'Dan de lantaarn bij het vuur.', 'Pas in dat licht: de plaat.'] })),
  }));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.05), boardMat);
  const bgp = new THREE.Group();
  bgp.add(board);
  board.rotation.y = Math.PI;
  place(bgp, X0 + 0.17, 1.55, (Z0 + Z1) / 2, Math.PI / 2);
  w.scene.add(bgp);
  for (let i = 0; i < 4; i++) box(c.b, k.M.paint, '#2a1f16', X0 + 0.18, 1.0, Z0 + 0.9 + i * 0.55, 0.02, 0.35, 0.05, { chunk: c.chunk, shadow: false });
  w.onUpdate(() => {
    const p = g.playerXZ();
    const near = Math.hypot(p.x - (X0 + X1) / 2, p.z - (Z0 + Z1) / 2) < 4;
    boardMat.color.set(g.state.lit.torch && near ? '#ffffff' : '#3a3632');
  });
  makeInspect(w, g, {
    id: 'inspect.toolboard', obj: bgp, hit: [1.5, 1.2, 0.3], hitOffset: [0, 0, 0], label: 'Bekijken: gereedschapsbord',
    onInspect: () => {
      if (!g.state.lit.torch) {
        g.toast(has(g.state, 'torch') ? 'Te donker om het bord te lezen. Zet je zaklamp aan (Tas → Zaklamp aan, of F).' : 'Te donker om het bord te lezen.');
        return false;
      }
      g.inspect('c.toolboard');
      return false;
    },
  });
}

/**
 * A stacked woodpile of split logs: `base` logs in the bottom row, one fewer per row, each row resting in the grooves of
 * the row below (log Ø 0.2 at 0.24 centres → rows 0.16 apart); the rows run along plan direction (cos yaw, −sin yaw),
 * each log lies across it; a stake at each end of the row line.
 */
function woodpile(c: Ctx, x: number, z: number, yaw: number, base: number, rows: number, r: () => number) {
  const M = woodMats(), ux = Math.cos(yaw), uz = -Math.sin(yaw);
  for (let row = 0; row < rows; row++) for (let i = 0; i < base - row; i++) {
    const off = (i - (base - 1 - row) / 2) * 0.24;
    c.b.add(M.tree, SPLIT_LOG, planMatrix(x + ux * off, 0.1 + row * 0.165, z + uz * off, yaw + Math.PI / 2, 1, 1, 1), new THREE.Color('#a08c70').multiplyScalar(0.85 + r() * 0.25), c.chunk, true, 0);
  }
  const end = (base - 1) * 0.12 + 0.17;
  for (const e of [-1, 1]) cyl(c.b, c.k.M.wood, '#5a4630', x + ux * e * end, 0, z + uz * e * end, 0.04, 0.05, 0.25 + rows * 0.17, 6, { chunk: c.chunk });
}

function buildFireClearing(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const { x: FX, z: FZ } = SITES.fire;
  // DEV-03: an authored fire place instead of six pegs in a perfect ring: a ring of real field stones round a sooty
  // hearth, two log benches and two stump seats (asymmetric, facing the fire), a woodpile at the edge of the clearing
  const M = woodMats(), r = mulberry32(2101);
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + (r() - 0.5) * 0.2, d = 0.95 + (r() - 0.5) * 0.08, s = 0.2 + r() * 0.08;
    c.b.add(M.rock, FIRE_STONE, planMatrix(FX + Math.cos(a) * d, -0.04, FZ + Math.sin(a) * d, r() * 6.3, s * 1.2, s, s), new THREE.Color('#8f877a').multiplyScalar(0.8 + r() * 0.25), c.chunk, true, 0);
  }
  cyl(c.b, k.M.paint, '#2e2a26', FX, 0.01, FZ, 0.8, 0.8, 0.04, 14, { chunk: c.chunk });
  w.col.addCircle(FX, FZ, 1.15, 0, 0.8);
  const seat = (a: number, d: number) => {
    const x = FX + Math.cos(a) * d, z = FZ + Math.sin(a) * d;
    stumpsV2(c, [{ x, z, y: 0, s: 0.5, treatment: 'plain', vx: x, vz: z, vr: 0.34 }]);
    w.col.addCircle(x, z, 0.35, 0, 0.5);
  };
  const bench = (a: number, d: number, len: number) => {
    const cx = FX + Math.cos(a) * d, cz = FZ + Math.sin(a) * d, yaw = -a + Math.PI / 2; // tangential: you sit facing the fire
    const ax = cx - (Math.cos(yaw) * len) / 2, az = cz + (Math.sin(yaw) * len) / 2;
    c.b.add(M.tree, BENCH_LOG, planMatrix(ax, 0.02, az, yaw), '#9a8a74', c.chunk, true, 0);
    for (let q = 0.3; q < len; q += 0.5) w.col.addCircle(ax + Math.cos(yaw) * q, az - Math.sin(yaw) * q, 0.26, 0, 0.45);
  };
  seat(0.35, 3.1); seat(2.55, 3.3);
  bench(1.45, 3.2, 2.2); bench(4.3, 3.35, 2.2);
  // woodpile against a tree at the clearing edge: split logs stacked between two stakes
  const wpA = 5.45, wpx = FX + Math.cos(wpA) * 6.6, wpz = FZ + Math.sin(wpA) * 6.6, wpyaw = -wpA + Math.PI / 2;
  woodpile(c, wpx, wpz, wpyaw, 6, 4, r);
  w.col.addCircle(wpx, wpz, 0.75, 0, 1.0);
  // DEV-04A: the firewood laid in the pit floated at +0.57 (`cyl` base height); two crossed layers resting on the hearth
  const logs = compound((b) => {
    for (let i = 0; i < 4; i++) rod(b, k.M.bark, '#8a6a4a', 0, 0.09 + (i % 2) * 0.12, 0, 0.07, 0.07, 0.9, 6, { rz: Math.PI / 2, yaw: (i % 2) * 1.57 + (i > 1 ? 0.35 : -0.35) });
  });
  place(logs, FX, 0, FZ);
  w.scene.add(logs);
  const fire = makeFire(w, { kind: 'campfire', x: FX, y: 0.14, z: FZ, s: 1.15 });
  w.lamps.push({ id: 'fire.clearing', pos: v3(FX, 1.2, FZ), color: '#ff9a4a', intensity: 14, distance: 14, on: () => !!g.state.lit['fire.clearing'], flicker: 0.3 });
  w.emitters.push({ kind: 'fire', pos: v3(FX, 0.5, FZ), on: () => !!g.state.lit['fire.clearing'] });
  w.onSync(() => {
    logs.visible = !!g.state.flags.firewood;
    fire.visible = !!g.state.lit['fire.clearing'];
  });
  const pit = new THREE.Group();
  place(pit, FX, 0, FZ);
  w.scene.add(pit);
  makeAction(w, {
    id: 'firepit', obj: pit, hit: [2.2, 0.8, 2.2], hitOffset: [0, 0.3, 0], reach: 3.0,
    label: () => (g.state.lit['fire.clearing'] ? 'Vuur doven' : 'Vuurkuil'),
    run: () => g.act(useOnFirePit(g.state, null)),
    useItem: (item) => g.act(useOnFirePit(g.state, item)),
    itemLabel: (item) => {
      const f = g.state.flags, lit = !!g.state.lit['fire.clearing'];
      if (lit) return null;
      if (item === 'kindling' && !f.firewood) return 'Aanmaakhout erin leggen';
      if (item === 'matches') return f.firewood ? 'Aansteken' : 'Gebruik: Lucifers';
      return `Gebruik: ${ITEMS[item]?.name ?? item}`;
    },
  });
  // mounted lantern on a post + engraved copper plate
  const PX = FX + 2.8, PZ = FZ + 1.6;
  const yaw = Math.atan2(FX - PX, FZ - PZ);
  cyl(c.b, k.M.wood, '#5a3a22', PX, 0, PZ, 0.09, 0.11, 2.3, 7, { chunk: c.chunk });
  part(c, k.M.wood, '#5a3a22', PX, PZ, yaw, 0, 2.1, 0.3, 0.08, 0.08, 0.6);
  w.col.addCircle(PX, PZ, 0.15, 0, 2.5);
  const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)];
  const ln = lantern(w, PX + fx * 0.55, 1.62, PZ + fz * 0.55, 0.9, yaw);
  makeLamp(w, g, { id: 'lantern.firepost', ...ln, toggle: false, defaultOn: false, intensity: 5, distance: 7 });
  makeAction(w, {
    id: 'lantern.firepost.act', obj: ln.obj, hit: [0.5, 0.6, 0.5], hitOffset: [0, 0.25, 0],
    label: () => (g.state.lit['lantern.firepost'] ? null : 'Lantaarn aansteken'),
    run: () => g.act(lightPostLantern(g.state)),
  });
  const plateMat = w.material(new THREE.MeshLambertMaterial({ map: w.texture(plaqueTexture({ w: 256, h: 160, bg: '#b8733f', ink: '#2a160a', symbols: ['maan', 'blad', 'zon'], arrows: true, symbolColor: '#e8c08a', lines: ['Zo ontsteek je de tuin.'] })) }));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4), plateMat);
  plate.rotation.y = Math.PI;
  const plateGrp = new THREE.Group();
  plateGrp.add(plate);
  place(plateGrp, PX + fx * 0.13, 1.15, PZ + fz * 0.13, yaw);
  w.scene.add(plateGrp);
  w.onSync(() => plateMat.color.set(g.state.lit['lantern.firepost'] ? '#ffffff' : '#2e2a26'));
  makeAction(w, {
    id: 'plate.fire', obj: plateGrp, hit: [0.7, 0.5, 0.3], hitOffset: [0, 0, 0],
    label: () => 'Bekijken: koperen plaat',
    run: () => {
      const o = readFirePlate(g.state);
      if (o.ok) {
        g.changed();
        g.inspect('c.firePlate');
      } else g.act(o, { save: false });
    },
  });
}

/** The old stone well (the start of the morning walk on the study map): scenery with a little life. */
function buildWell(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const { x: WX, z: WZ } = SITES.well;
  cyl(c.b, k.M.stone, '#b8b0a0', WX, 0, WZ, 1.05, 1.1, 0.9, 16, { chunk: c.chunk, uv: 1 });
  cyl(c.b, k.M.paint, '#1a1612', WX, 0.6, WZ, 0.85, 0.85, 0.31, 16, { chunk: c.chunk });
  cyl(c.b, k.M.stone, '#a8a090', WX, 0.9, WZ, 1.12, 1.12, 0.1, 16, { chunk: c.chunk, uv: 1 });
  w.col.addCircle(WX, WZ, 1.15, 0, 1.5);
  for (const s of [-1, 1]) box(c.b, k.M.wood, '#6b4a2a', WX + s * 1.0, 0.9, WZ, 0.14, 1.6, 0.14, { chunk: c.chunk });
  gableRoof(c, WX, WZ, 2.6, 1.6, 2.5, 0.8, true, k.M.slate, '#7a8070');
  // DEV-04A: the winch axle sat at +2.75 (above the posts, in the roof): it now runs between the post heads
  rod(c.b, k.M.wood, '#7a5a3a', WX, 2.2, WZ, 0.08, 0.08, 2.0, 8, { chunk: c.chunk, rz: Math.PI / 2 });
  box(c.b, k.M.paint, '#3b3b3b', WX + 1.12, 1.92, WZ, 0.04, 0.3, 0.04, { chunk: c.chunk });
  cyl(c.b, k.M.wood, '#7a5a3a', WX + 0.3, 0.9, WZ + 0.55, 0.2, 0.17, 0.3, 10, { chunk: c.chunk });
  const hit = new THREE.Group();
  place(hit, WX, 0, WZ);
  w.scene.add(hit);
  makeAction(w, {
    id: 'well', obj: hit, hit: [2.4, 2.0, 2.4], hitOffset: [0, 1.0, 0], reach: 3.0,
    label: () => 'Put',
    run: () => g.act({ ok: true, msg: 'Een oude put. Ver beneden glinstert water, en het touw is nieuw. Hier begon iemand elke ochtend een wandeling.', sfx: 'none' }, { save: false }),
  });
}

function buildSideGate(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const { x: GX, z: GZ } = SITES.sideGate;
  for (const s of [-1, 1]) {
    box(c.b, k.M.stone, '#b8ae98', GX, 0, GZ + s * 0.85, 0.5, 1.9, 0.5, { chunk: c.chunk, uv: 1 });
    blob(c.b, k.M.paint, '#6a8a40', GX, 1.95, GZ + s * 0.85, 0.3, 0.12, 0.3, { chunk: c.chunk });
    w.col.addBox(GX - 0.25, GX + 0.25, GZ + s * 0.85 - 0.25, GZ + s * 0.85 + 0.25, 0, 2);
  }
  for (const [a, b2] of [[2, GZ - 1.1], [GZ + 1.1, 32]] as const) {
    for (let z = a; z < b2; z += 1.2) {
      const h = 0.5 + Math.abs(Math.sin(z * 1.7)) * 0.6;
      const y = terrainHeight(GX, z + 0.6);
      box(c.b, k.M.stone, '#a89e88', GX, y - 0.1, z + 0.6, 0.45, h + 0.1, 1.18, { chunk: c.chunk, uv: 1, yaw: Math.sin(z) * 0.05 });
    }
    w.col.addBox(GX - 0.25, GX + 0.25, a, b2, 0, 1.6);
  }
  makeDoor(w, g, { id: 'gate.side', x: GX, z: GZ - 0.6, dir: 'z+', width: 1.2, height: 1.6, y0: 0, swing: -1, style: 'gate' });
  cyl(c.b, k.M.wood, '#5a3a22', GX - 1.6, 0, GZ + 1.7, 0.05, 0.05, 1.1, 6, { chunk: c.chunk });
  const pb = compound((b) => {
    box(b, k.M.paint, '#2f5a3a', 0, 0, 0, 0.3, 0.35, 0.4);
    box(b, k.M.paint, '#c9a44c', 0, 0.2, 0.205, 0.18, 0.03, 0.01);
  });
  place(pb, GX - 1.6, 1.1, GZ + 1.7, Math.PI);
  w.scene.add(pb);
  w.col.addCircle(GX - 1.6, GZ + 1.7, 0.25, 0, 1.5);
  makeInspect(w, g, { id: 'mem.sidegate.postbox', obj: pb, clue: 'mem.sidegate.postbox', hit: [0.45, 0.45, 0.5], label: 'Brievenbus openen' });
  w.checkpoints.push({ name: 'sidegate', pose: { x: GX - 3, y: 0, z: GZ, yaw: Math.PI / 2, pitch: 0 } });
}

/** Signpost where the side path leaves the southern loop for the hill: one arm forked like a branch. */
function buildFork(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const { x: SX, z: SZ } = SITES.fork;
  const PX = SX - 1.3, PZ = SZ - 0.9;
  cyl(c.b, k.M.wood, '#6b4a2a', PX, 0, PZ, 0.08, 0.1, 2.3, 7, { chunk: c.chunk });
  w.col.addCircle(PX, PZ, 0.14, 0, 2.5);
  const sign = compound((b) => {
    // arm along the path (east) and the forked arm (north, towards the hill)
    box(b, k.M.wood, '#a8743f', 0.55, 1.95, 0, 1.0, 0.18, 0.05);
    box(b, k.M.wood, '#a8743f', 1.1, 1.95, 0, 0.12, 0.12, 0.05, { yaw: 0.785 });
    box(b, k.M.wood, '#8a5a33', 0, 1.6, 0.45, 0.05, 0.16, 0.8);
    box(b, k.M.wood, '#8a5a33', 0.1, 1.6, 0.92, 0.05, 0.1, 0.3, { yaw: 0.5 });
    box(b, k.M.wood, '#8a5a33', -0.1, 1.6, 0.92, 0.05, 0.1, 0.3, { yaw: -0.5 });
    blob(b, k.M.paint, '#4f8a3a', 0.04, 1.68, 0.5, 0.06, 0.02, 0.09);
  });
  place(sign, PX, 0, PZ, 0);
  w.scene.add(sign);
  makeInspect(w, g, { id: 'inspect.fork', obj: sign, clue: 'c.fork', hit: [1.4, 0.7, 1.4], hitOffset: [0.4, 1.7, 0.4], label: 'Bekijken: wegwijzer' });
}

/**
 * DEV-02 woodland masses enclosing the north half (layout.ts WOODS): uneven density (dense masses, open glades),
 * mixed crown heights, trunks on the terrain, collision trunks. Every point passes the shared keepouts first.
 */
export function buildWoodlandMasses(w: World, veg: Vegetation) {
  const r = mulberry32(911);
  for (const zone of WOODS) {
    const pts = scatter(r, zone.x0 + 1, zone.x1 - 1, zone.z0 + 1, zone.z1 - 1, zone.gap, Math.round(((zone.x1 - zone.x0) * (zone.z1 - zone.z0)) / (zone.gap * zone.gap) * 3), (x, z) => vegetationClear(x, z, 'tree'));
    for (const [x, z] of pts) {
      const roll = r();
      const kind = roll < zone.pine ? 'pine' : roll < zone.pine + 0.15 ? 'birch' : 'oak';
      const tall = zone.gap > 8 ? 0.85 : 1 + r() * 0.35; // glade trees lower, mass trees taller and uneven
      const h = (kind === 'pine' ? 6.5 + r() * 3 : 3.6 + r() * 2.6) * tall;
      const rad = kind === 'pine' ? 1.5 + r() * 0.6 : 1.9 + r() * 1.1;
      const y = terrainHeight(x, z);
      veg.tree({ x, z, h, r: rad, kind, hue: r() - 0.5, y }, `w${Math.floor(x / 50)}_${Math.floor(z / 45)}`, `T${Math.floor(x / 100)}_${Math.floor(z / 90)}`);
      w.col.addCircle(x, z, kind === 'birch' ? 0.22 : 0.34, y - 0.5, y + 6);
      if (zone.gap <= 6 && r() < 0.35) veg.smallThing(r() < 0.5 ? 'fern' : 'shrub', x + 1.2, z + 0.6, 0.4 + r() * 0.3, r() < 0.5 ? '#557f34' : '#4f7f38', `w${Math.floor(x / 50)}_${Math.floor(z / 45)}`, terrainHeight(x + 1.2, z + 0.6));
    }
  }
}
