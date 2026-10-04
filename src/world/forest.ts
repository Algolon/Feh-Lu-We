// Forest: X 0–120, Z 0–50 (≈ half the estate). Walkable woodland with a looping path network and
// clearings: timber shed (28,26), fire clearing (14,12), stone well (96,26), old side gate (108,12).
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, floor, gableRoof } from './arch';
import { box, boxMM, cyl, blob, compound, v3 } from './kit';
import { lantern, flame, crate, part, staticLantern } from './furniture';
import { makeDoor, makeDrawer, makePickup, makeLamp, makeAction, makeInspect, place } from '../interactions/props';
import { Vegetation, scatter, distToPolyline, smooth } from './nature';
import { mulberry32 } from '../core/rng';
import { plaqueTexture } from './textures';
import { useOnFirePit, lightPostLantern, readFirePlate, useOnWell } from '../puzzles/rules';
import { has } from '../core/state';

export const SITES = {
  shed: { x: 28, z: 26 },
  fire: { x: 14, z: 12 },
  well: { x: 96, z: 26 },
  gate: { x: 108, z: 12 },
  forecourt: { x: 60, z: 47 },
};

export const DRIVEWAY: [number, number][] = [[60, 0.3], [60, 20], [60.4, 34], [60, 44]];
export const FOREST_PATHS: [number, number][][] = [
  smooth([[55, 46.5], [47, 42], [38, 34], [31.5, 27.5]]),
  smooth([[26.5, 23.6], [21, 17.5], [16, 13.5]]),
  smooth([[15.5, 9.8], [24, 6], [40, 5], [52, 6], [58, 7]]),
  smooth([[62, 8], [76, 8.6], [92, 10.6], [106.2, 12]]),
  smooth([[101, 11.4], [99.5, 17], [97.5, 22.8]]),
  smooth([[94.6, 29], [88, 35], [76, 42], [65.5, 46.6]]),
];
export const CLEARINGS = [
  { x: 28, z: 26, r: 7 }, { x: 14, z: 12, r: 6.5 }, { x: 96, z: 26, r: 6.5 }, { x: 108, z: 12, r: 5.5 }, { x: 60, z: 47, r: 9 }, { x: 60, z: 2, r: 4 },
];

export function forestTreeOk(x: number, z: number) {
  if (z > 49.2) return false;
  if (Math.abs(x - 60) < 4.6 && z < 47) return false; // driveway corridor
  for (const p of FOREST_PATHS) if (distToPolyline(x, z, p) < 2.7) return false;
  for (const c of CLEARINGS) if (Math.hypot(x - c.x, z - c.z) < c.r) return false;
  if (z < 1.6) return false; // keep the boundary wall clear
  return true;
}

export function buildForest(w: World, g: GameApi, c: Ctx, veg: Vegetation) {
  const k = c.k;
  const r = mulberry32(42);
  // trees: Poisson-disc spacing ≥ 3.4 m keeps ≥ 2 m gaps between trunks — never a sealed wall
  const pts = scatter(r, 1.2, 118.8, 1.2, 49.5, 3.4, 9000, forestTreeOk);
  for (const [x, z] of pts) {
    const roll = r();
    const kind = roll < 0.14 ? 'pine' : roll < 0.28 ? 'birch' : 'oak';
    const h = kind === 'pine' ? 6 + r() * 3 : 3.2 + r() * 2.6;
    const rad = kind === 'pine' ? 1.5 + r() * 0.6 : 1.7 + r() * 1.1;
    veg.tree({ x, z, h, r: rad, kind, hue: r() - 0.5 }, `f${Math.floor(x / 40)}`);
    w.col.addCircle(x, z, kind === 'birch' ? 0.22 : 0.34, 0, 6);
  }
  // undergrowth (no collision): ferns, shrubs, rocks
  for (const [x, z] of scatter(r, 1, 119, 1, 49.5, 3.3, 4000, (x, z) => z < 49.5 && !(Math.abs(x - 60) < 2.6) && !FOREST_PATHS.some((p) => distToPolyline(x, z, p) < 1.3))) {
    const roll = r();
    const chunk = `f${Math.floor(x / 40)}`;
    if (roll < 0.45) veg.smallThing('fern', x, z, 0.35 + r() * 0.3, r() < 0.5 ? '#6a9a3e' : '#557f34', chunk);
    else if (roll < 0.7) veg.smallThing('shrub', x, z, 0.45 + r() * 0.4, r() < 0.5 ? '#4f7f38' : '#5f8f40', chunk);
    else if (roll < 0.8) veg.smallThing('rock', x, z, 0.25 + r() * 0.3, '#9a968a', chunk);
    else veg.smallThing('flower', x, z, 0.14, r() < 0.5 ? '#b89ad8' : '#f2f0e6', chunk);
  }

  buildShed(w, g, c);
  buildFireClearing(w, g, c);
  buildWell(w, g, c);
  buildSideGate(w, g, c);

  // a few forest lanterns along the loop for orientation at dusk
  for (const [x, z] of [[47, 43.6], [33.5, 29.8], [19.5, 16], [40, 7], [78, 10.2], [99.8, 15], [86, 37.6], [62.6, 20], [57.6, 34]] as const) {
    cyl(c.b, k.M.wood, '#5a3a22', x, 0, z, 0.06, 0.07, 1.4, 6, { chunk: c.chunk });
    staticLantern(c, w, x, 1.4, z, 0.6, 0, 2.2, 6);
    w.col.addCircle(x, z, 0.12, 0, 2);
  }
  w.checkpoints.push(
    { name: 'gate', pose: { x: 60, y: 0, z: 3, yaw: 0, pitch: 0 } },
    { name: 'forecourt', pose: { x: 60, y: 0, z: 45, yaw: 0, pitch: 0 } },
    { name: 'shed', pose: { x: 32, y: 0, z: 27.5, yaw: -Math.PI / 2, pitch: 0 } },
    { name: 'fire', pose: { x: 17.5, y: 0, z: 9.5, yaw: -0.9, pitch: 0 } },
    { name: 'well', pose: { x: 96, y: 0, z: 22, yaw: 0, pitch: 0 } },
  );
}

function buildShed(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const X0 = 25.5, X1 = 30.5, Z0 = 24.5, Z1 = 28, H = 2.6;
  const plank = { mat: k.M.wood, color: '#8a5a33' };
  const wallBox = (x0: number, x1: number, z0: number, z1: number) => {
    boxMM(c.b, plank.mat, plank.color, x0, x1, 0, H, z0, z1, { chunk: c.chunk, uv: 1.4 });
    w.col.addBox(x0, x1, z0, z1, 0, H, { occludes: true });
  };
  wallBox(X0, X1, Z0, Z0 + 0.12);
  wallBox(X0, X1, Z1 - 0.12, Z1);
  wallBox(X0, X0 + 0.12, Z0, Z1);
  wallBox(X1 - 0.12, X1, Z0, 25.7);
  wallBox(X1 - 0.12, X1, 26.7, Z1);
  boxMM(c.b, plank.mat, plank.color, X1 - 0.12, X1, 2.25, H, 25.7, 26.7, { chunk: c.chunk, uv: 1.4 });
  // darker interior lining (the shed reads as dim inside)
  boxMM(c.b, k.M.wood, '#3e2a1a', X0 + 0.12, X1 - 0.12, 0, H, Z1 - 0.14, Z1 - 0.12, { chunk: c.chunk, uv: 1.4, shadow: false });
  boxMM(c.b, k.M.wood, '#3e2a1a', X0 + 0.12, X0 + 0.14, 0, H, Z0 + 0.12, Z1 - 0.12, { chunk: c.chunk, uv: 1.4, shadow: false });
  boxMM(c.b, k.M.wood, '#3e2a1a', X0 + 0.12, X1 - 0.12, 0, H, Z0 + 0.12, Z0 + 0.14, { chunk: c.chunk, uv: 1.4, shadow: false });
  floor(c, X0 + 0.12, X1 - 0.12, Z0 + 0.12, Z1 - 0.12, 0.1, k.M.wood, '#4a3020', 0.1, true, 1.4);
  boxMM(c.b, k.M.wood, '#3e2a1a', X0, X1, H - 0.02, H, Z0, Z1, { chunk: c.chunk, uv: 1.4, shadow: false });
  // gable gable ends + roof
  gableRoof(c, 28, 26.25, X1 - X0 + 0.6, Z1 - Z0 + 0.7, H, 1.3, true, k.M.slate, '#7a7a6a');
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
  makeDoor(w, g, { id: 'door.shed', x: X1, z: 25.7, dir: 'z+', width: 1.0, height: 2.2, y0: 0.1, swing: -1, color: '#6b4a2a', style: 'plank', key: 'shedKey' });
  staticLantern(c, w, X1 + 0.15, 2.0, 27.2, 0.6, 0, 2.5, 6);
  // log pile + chopping stump outside
  for (let i = 0; i < 9; i++) cyl(c.b, k.M.bark, '#8a6a4a', X1 + 0.6, 0.15 + Math.floor(i / 3) * 0.28, 24.8 - (i % 3) * 0.3 - (Math.floor(i / 3) % 2) * 0.15, 0.14, 0.14, 1.0, 7, { chunk: c.chunk, rz: Math.PI / 2, yaw: Math.PI / 2 });
  w.col.addBox(X1 + 0.05, X1 + 1.15, 23.9, 25.0, 0, 1);
  cyl(c.b, k.M.bark, '#7a5a3a', 32, 0, 24.6, 0.35, 0.4, 0.5, 9, { chunk: c.chunk });
  w.col.addCircle(32, 24.6, 0.4, 0, 0.6);
  // workbench along the north wall with the token drawer
  boxMM(c.b, k.M.wood, '#6b4a2a', 26, 29.6, 0.9, 0.97, 27.2, 27.85, { chunk: c.chunk, uv: 1 });
  for (const x of [26.1, 29.5]) boxMM(c.b, k.M.wood, '#5a3a22', x - 0.05, x + 0.05, 0.1, 0.9, 27.25, 27.8, { chunk: c.chunk });
  w.col.addBox(26, 29.6, 27.15, 27.88, 0, 1.0);
  const wd = makeDrawer(w, g, { id: 'shed.drawer', x: 27.2, y: 0.8, z: 27.5, yaw: Math.PI, w: 0.8, h: 0.16, d: 0.55, color: '#7a5a3a' });
  const token = compound((b) => {
    cyl(b, k.M.wood, '#b98a4e', 0, 0, 0, 0.06, 0.06, 0.02, 14);
    box(b, k.M.paint, '#5a3a1a', 0, 0.02, 0, 0.01, 0.003, 0.08);
  });
  token.position.set(0.12, -0.05, 0);
  wd.slider.add(token);
  makePickup(w, g, { id: 'pk.token', item: 'token', obj: token, available: wd.isOpen, hit: [0.3, 0.12, 0.3] });
  // kindling bundle on the floor
  const kind = compound((b) => {
    for (let i = 0; i < 7; i++) cyl(b, k.M.bark, '#c8a070', (i % 3) * 0.08 - 0.08, 0.05 + Math.floor(i / 3) * 0.07, 0, 0.035, 0.035, 0.6, 5, { rz: Math.PI / 2 });
    box(b, k.M.paint, '#c4553d', 0, 0.02, 0, 0.04, 0.22, 0.05);
  });
  place(kind, 26.4, 0.1, 25.1, 0.2);
  w.scene.add(kind);
  makePickup(w, g, { id: 'pk.kindling', item: 'kindling', obj: kind, hit: [0.7, 0.35, 0.4] });
  crate(c, 29.6, 24.95, 0.1, 0.6, 0.2);
  // tool board on the west wall (needs light to read)
  const boardMat = w.material(new THREE.MeshLambertMaterial({
    map: w.texture(plaqueTexture({ w: 256, h: 192, bg: '#4a3a2a', ink: '#efe6d0', title: 'Gereedschap', lines: ['Eerst het vuur.', 'Dan de lantaarn bij het vuur.', 'Pas in dat licht: de plaat.'] })),
  }));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.05), boardMat);
  const bgp = new THREE.Group();
  bgp.add(board);
  board.rotation.y = Math.PI;
  place(bgp, X0 + 0.17, 1.55, 26.3, Math.PI / 2);
  w.scene.add(bgp);
  // painted tool outlines
  for (let i = 0; i < 4; i++) box(c.b, k.M.paint, '#2a1f16', X0 + 0.18, 1.0, 25.4 + i * 0.55, 0.02, 0.35, 0.05, { chunk: c.chunk, shadow: false });
  w.onUpdate(() => {
    const p = g.playerXZ();
    const near = Math.hypot(p.x - 27, p.z - 26.3) < 4;
    boardMat.color.set(g.state.lit.torch && near ? '#ffffff' : '#3a3632');
  });
  makeInspect(w, g, {
    id: 'inspect.toolboard', obj: bgp, hit: [1.5, 1.2, 0.3], hitOffset: [0, 0, 0], label: 'Bekijken: gereedschapsbord',
    onInspect: () => {
      if (!g.state.lit.torch) {
        g.toast(has(g.state, 'torch') ? 'Te donker om het bord te lezen. Zet je zaklamp aan (🎒 → Zaklamp aan, of F).' : 'Te donker om het bord te lezen.');
        return false;
      }
      g.inspect('c.toolboard');
      return false;
    },
  });
}

function buildFireClearing(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const { x: FX, z: FZ } = SITES.fire;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    blob(c.b, k.M.paint, '#8a8580', FX + Math.cos(a) * 0.95, 0.12, FZ + Math.sin(a) * 0.95, 0.25, 0.18, 0.22, { chunk: c.chunk, yaw: a });
  }
  cyl(c.b, k.M.paint, '#3a3530', FX, 0.01, FZ, 0.8, 0.8, 0.04, 14, { chunk: c.chunk });
  w.col.addCircle(FX, FZ, 1.15, 0, 0.8);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    cyl(c.b, k.M.bark, '#7a5a3a', FX + Math.cos(a) * 3.2, 0, FZ + Math.sin(a) * 3.2, 0.32, 0.36, 0.45, 9, { chunk: c.chunk });
    w.col.addCircle(FX + Math.cos(a) * 3.2, FZ + Math.sin(a) * 3.2, 0.35, 0, 0.5);
  }
  // logs appear once kindling is placed
  const logs = compound((b) => {
    for (let i = 0; i < 4; i++) cyl(b, k.M.bark, '#8a6a4a', 0, 0.12, 0, 0.07, 0.07, 0.9, 6, { rz: Math.PI / 2, yaw: i * 0.8 });
  });
  place(logs, FX, 0, FZ);
  w.scene.add(logs);
  const fire = flame(w, FX, 0.1, FZ, 1.3);
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
  });
  // mounted lantern on a post + engraved copper plate
  const PX = 16.8, PZ = 13.6;
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

function buildWell(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const { x: WX, z: WZ } = SITES.well;
  cyl(c.b, k.M.stone, '#b8b0a0', WX, 0, WZ, 1.05, 1.1, 0.9, 16, { chunk: c.chunk, uv: 1 });
  cyl(c.b, k.M.paint, '#1a1612', WX, 0.6, WZ, 0.85, 0.85, 0.31, 16, { chunk: c.chunk });
  cyl(c.b, k.M.stone, '#a8a090', WX, 0.9, WZ, 1.12, 1.12, 0.1, 16, { chunk: c.chunk, uv: 1 });
  w.col.addCircle(WX, WZ, 1.15, 0, 1.5);
  for (const s of [-1, 1]) box(c.b, k.M.wood, '#6b4a2a', WX + s * 1.0, 0.9, WZ, 0.14, 1.6, 0.14, { chunk: c.chunk });
  gableRoof(c, WX, WZ, 2.6, 1.6, 2.5, 0.8, true, k.M.slate, '#7a8070');
  cyl(c.b, k.M.wood, '#7a5a3a', WX, 1.75, WZ, 0.08, 0.08, 2.0, 8, { chunk: c.chunk, rz: Math.PI / 2 });
  // crank (visible once installed) and bucket on a rope
  const crank = compound((b) => {
    box(b, k.M.paint, '#3b3b3b', 0, -0.02, 0, 0.04, 0.3, 0.04);
    cyl(b, k.M.wood, '#8a5a33', 0.08, 0.24, 0, 0.03, 0.03, 0.16, 6, { rz: Math.PI / 2 });
  });
  const crankPivot = new THREE.Group();
  crankPivot.position.copy(v3(WX + 1.12, 1.79, WZ));
  crankPivot.add(crank);
  w.scene.add(crankPivot);
  const bucket = compound((b) => {
    cyl(b, k.M.wood, '#7a5a3a', 0, 0, 0, 0.22, 0.18, 0.3, 10);
    box(b, k.M.paint, '#555555', 0, 0.3, 0, 0.18, 0.12, 0.14);
    box(b, k.M.paint, '#2b2b2b', 0, 0, 0, 0.012, 0.9, 0.012);
  });
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 4), w.material(new THREE.MeshLambertMaterial({ color: '#c8b080' })));
  w.scene.add(bucket, rope);
  let bucketY = -0.6, spin = 0;
  w.onSync(() => {
    crankPivot.visible = !!g.state.flags.crankInstalled;
  });
  w.onUpdate((dt) => {
    const target = g.state.flags.wellRaised ? 0.95 : -0.6;
    if (Math.abs(bucketY - target) > 0.001) {
      const step = dt * 0.6;
      bucketY = Math.abs(target - bucketY) < step ? target : bucketY + Math.sign(target - bucketY) * step;
      spin += dt * 4;
      crankPivot.rotation.x = spin;
    }
    bucket.position.copy(v3(WX, bucketY, WZ));
    const top = 1.7;
    rope.scale.y = Math.max(0.05, top - (bucketY + 0.4));
    rope.position.copy(v3(WX, (top + bucketY + 0.4) / 2, WZ));
  });
  const hit = new THREE.Group();
  place(hit, WX, 0, WZ);
  w.scene.add(hit);
  makeAction(w, {
    id: 'well', obj: hit, hit: [2.4, 2.0, 2.4], hitOffset: [0, 1.0, 0], reach: 3.0,
    label: () => {
      const f = g.state.flags;
      if (!f.crankInstalled) return 'Put';
      if (!f.wellRaised) return 'Zwengelen';
      if (!f.wellOpened) return 'Kistje openen';
      return 'Put';
    },
    run: () => g.act(useOnWell(g.state, null)),
    useItem: (item) => g.act(useOnWell(g.state, item)),
  });
}

function buildSideGate(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const { x: GX, z: GZ } = SITES.gate;
  // an old north–south boundary wall with a gate; the forest path from the west ends at it
  for (const s of [-1, 1]) {
    box(c.b, k.M.stone, '#b8ae98', GX, 0, GZ + s * 0.85, 0.5, 1.9, 0.5, { chunk: c.chunk, uv: 1 });
    blob(c.b, k.M.paint, '#6a8a40', GX, 1.95, GZ + s * 0.85, 0.3, 0.12, 0.3, { chunk: c.chunk });
    w.col.addBox(GX - 0.25, GX + 0.25, GZ + s * 0.85 - 0.25, GZ + s * 0.85 + 0.25, 0, 2);
  }
  for (const [a, b2] of [[3, GZ - 1.1], [GZ + 1.1, 21]] as const) {
    for (let z = a; z < b2; z += 1.2) {
      const h = 0.5 + Math.abs(Math.sin(z * 1.7)) * 0.6;
      box(c.b, k.M.stone, '#a89e88', GX, 0, z + 0.6, 0.45, h, 1.18, { chunk: c.chunk, uv: 1, yaw: Math.sin(z) * 0.05 });
    }
    w.col.addBox(GX - 0.25, GX + 0.25, a, b2, 0, 1.2);
  }
  makeDoor(w, g, { id: 'gate.side', x: GX, z: GZ - 0.6, dir: 'z+', width: 1.2, height: 1.6, y0: 0, swing: -1, style: 'gate' });
  // postbox with an optional memory
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
