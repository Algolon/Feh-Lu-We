// DEV-02 estate grounds (LEVEL_PLAN v0.2 §2–§5): the reserved outdoor functions as blockout volumes with stable ids.
// Arrival court with one gravel surface and the parked cars; the social garden platforms (BBQ, outdoor dining, gravity
// bong + handpan, balloon nook); the lake with its dry viewpoint; golf behind the BOSLUST hill; the wickerman clearing;
// a rest point on the east glade loop. No new puzzle rules, no ball physics, no burn state (I04/I05 open).
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, floor } from './arch';
import { box, boxMM, cyl, blob, compound, v3 } from './kit';
import { table, chair, part, staticLantern } from './furniture';
import { makeInspect, place } from '../interactions/props';
import type { Vegetation } from './nature';
import {
  ARRIVAL, ARRIVAL_SERVICE, PARKING, BBQ, OUTDOOR_DINING, MUSIC_BONG, BALLOON_NOOK, LAKE, LAKE_VIEW, GOLF_TEE, GOLF_CHUTE, WICKERMAN, GF, type Rect,
} from './layout';
import { terrainHeight } from './terrain';

export function buildGrounds(w: World, g: GameApi, c: Ctx, veg: Vegetation) {
  arrival(w, c);
  socialGarden(w, c);
  lake(w, g, c, veg);
  golf(w, c);
  wickerman(w, c);
  // east glade loop: a rest point with a view back over the meadow (optional, no find yet)
  part(c, c.k.M.wood, '#7a5232', 176.4, 124, Math.PI / 2, 0, terrainHeight(176.4, 124), 0, 1.6, 0.45, 0.45, 1);
  w.col.addBox(176.15, 176.65, 123.2, 124.8, terrainHeight(176.4, 124), terrainHeight(176.4, 124) + 0.5);
  w.checkpoints.push({ name: 'lake', pose: { x: 80.0, y: 0, z: 136.4, yaw: -1.2, pitch: 0 } }, { name: 'wellness', pose: { x: 131.6, y: 0.15, z: 113.0, yaw: Math.PI / 2, pitch: 0 } });
}

// ------------------------------------------------------------------------------------------------ arrival
function arrival(w: World, c: Ctx) {
  const k = c.k;
  // ONE gravel surface made of non-overlapping rectangles (no coplanar disc/plane overlap, audit VD-04)
  const parts: Rect[] = [
    ARRIVAL_SERVICE, // manoeuvring strip X 69.5–108 / Z 66–72
    { x0: ARRIVAL.x0, x1: ARRIVAL.x1, z0: 62, z1: ARRIVAL_SERVICE.z0 }, // court south of the strip (the drive ribbon ends at Z 62)
    { x0: 69.5, x1: 77.9, z0: 72, z1: 79 }, { x0: 77.9, x1: 101, z0: 72, z1: 78 }, { x0: 101, x1: 106.6, z0: 72, z1: 79 }, // bays + court + foot strip
    { x0: 86, x1: 94, z0: 78, z1: 78.6 }, // porch approach
  ];
  const geos = parts.map((r) => new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0).rotateX(-Math.PI / 2).translate((r.x0 + r.x1) / 2, 0.03, -(r.z0 + r.z1) / 2));
  for (const g0 of geos) { c.b.add(k.M.dirt, g0, new THREE.Matrix4(), '#d4cfc2', 'paths', false, 0); g0.dispose(); }
  // bay lines (raised a little, never coplanar)
  for (const x of [69.5, 72.3, 75.1, 77.9, 101, 103.8, 106.6]) boxMM(c.b, k.M.paint, '#f2ead8', x - 0.04, x + 0.04, 0.03, 0.045, 72.2, 77.4, { chunk: 'paths', shadow: false });
  // cars: stable positions, nose to the house; the fifth bay stays free
  for (const p of PARKING) if (p.car) car(w, c, p.id, (p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2 + 0.15, p.color);
}

function car(w: World, c: Ctx, id: string, x: number, z: number, color: string) {
  const k = c.k;
  const o = { chunk: 'grounds' };
  box(c.b, k.M.paint, color, x, 0.32, z, 1.78, 0.62, 4.3, o);
  box(c.b, k.M.paint, color, x, 0.94, z - 0.2, 1.6, 0.5, 2.2, o);
  box(c.b, k.M.glow, '#8fa4b4', x, 0.98, z - 0.2, 1.62, 0.36, 2.1, { ...o, shadow: false, jitter: 0 });
  for (const sx of [-1, 1]) for (const sz of [-1.35, 1.35]) cyl(c.b, k.M.paint, '#1f1f1f', x + sx * 0.8, 0.0, z + sz, 0.33, 0.33, 0.24, 12, { ...o, rz: Math.PI / 2, yaw: 0 });
  box(c.b, k.M.glow, '#fff2c8', x, 0.55, z + 2.16, 1.4, 0.1, 0.02, { ...o, shadow: false, jitter: 0 });
  const col = w.col.addBox(x - 0.92, x + 0.92, z - 2.2, z + 2.2, 0, 1.25, { occludes: true, tag: id });
  void col;
}

// ------------------------------------------------------------------------------------------------ social garden
function platform(c: Ctx, r: Rect, color: string) {
  floor(c, r.x0, r.x1, r.z0, r.z1, GF, c.k.M.stone, color, 0.25, true, 1.4);
  boxMM(c.b, c.k.M.stone, '#c4b898', r.x0 - 0.06, r.x1 + 0.06, -0.05, GF - 0.03, r.z0 - 0.06, r.z1 + 0.06, { chunk: c.chunk, uv: 1 }); // edge course
}

function socialGarden(w: World, c: Ctx) {
  const k = c.k;
  // BBQ work place (reached from the kitchen door), apart from the balloon tank
  platform(c, BBQ, '#d8ccb0');
  box(c.b, k.M.paint, '#2b2b2b', 107.0, GF, 117.6, 1.3, 0.85, 0.65, { chunk: c.chunk });
  box(c.b, k.M.paint, '#3a3a3a', 107.0, GF + 0.85, 117.6, 1.25, 0.32, 0.6, { chunk: c.chunk, rx: -0.25 });
  table(c, 109.4, 117.6, GF, 1.4, 0.7, 0, '#8a6a4a', 0.9);
  cyl(c.b, k.M.paint, '#5a7a8a', 105.0, GF, 118.5, 0.16, 0.16, 0.6, 10, { chunk: c.chunk }); // gas bottle
  w.col.addBox(106.3, 107.7, 117.25, 117.95, 0, GF + 1.2);
  w.col.addCircle(105.0, 118.5, 0.2, 0, 0.8);
  // outdoor dining: one long table with benches for the group; the central lawn path (X ≈ 90) stays free
  platform(c, OUTDOOR_DINING, '#e2d6bc');
  table(c, 98.0, 120.0, GF, 1.1, 4.4, 0, '#8a6a4a');
  for (const sx of [-1, 1]) { part(c, k.M.wood, '#7a5a3a', 98.0 + sx * 1.0, 120.0, 0, 0, GF, 0, 0.35, 0.45, 4.2, 1); w.col.addBoxC(98.0 + sx * 1.0, 120.0, 0.4, 4.2, 0, GF + 0.5); }
  for (let i = 0; i < 6; i++) cyl(c.b, k.M.paint, '#f2ead8', 97.8 + (i % 2) * 0.4, GF + 0.76, 118.4 + i * 0.6, 0.12, 0.12, 0.02, 10, { chunk: c.chunk });
  // gravity bong + handpan: a low table with the instrument on its own stand (no mechanic, no puzzle sound)
  platform(c, MUSIC_BONG, '#d8ccb0');
  table(c, 81.6, 120.6, GF, 1.1, 0.8, 0, '#7a5a3a', 0.4);
  cyl(c.b, k.M.paint, '#5a8aa8', 81.3, GF + 0.4, 120.5, 0.18, 0.18, 0.42, 12, { chunk: c.chunk }); // bucket
  cyl(c.b, k.M.glass, '#ffffff', 81.3, GF + 0.55, 120.5, 0.06, 0.08, 0.36, 10, { chunk: c.chunk }); // bottle
  cyl(c.b, k.M.wood, '#5a3a22', 83.4, GF, 121.6, 0.04, 0.04, 0.5, 6, { chunk: c.chunk });
  blob(c.b, k.M.paint, '#8a8a90', 83.4, GF + 0.62, 121.6, 0.27, 0.11, 0.27, { chunk: c.chunk }); // handpan
  w.col.addCircle(83.4, 121.6, 0.3, 0, 0.8);
  for (const [x, z] of [[80.0, 119.0], [80.0, 122.0], [82.8, 119.0]] as const) blob(c.b, k.M.paint, '#c4553d', x, GF + 0.15, z, 0.35, 0.16, 0.35, { chunk: c.chunk }); // floor cushions
  // tank + balloons nook (its own seats, away from the BBQ work surface)
  platform(c, BALLOON_NOOK, '#e2d6bc');
  cyl(c.b, k.M.paint, '#8a9aa8', 86.3, GF, 121.4, 0.14, 0.14, 0.9, 10, { chunk: c.chunk });
  w.col.addCircle(86.3, 121.4, 0.18, 0, 1);
  for (let i = 0; i < 5; i++) blob(c.b, k.M.paint, ['#e85a8a', '#f2c64a', '#5ab0e8', '#7ad06a', '#e8743a'][i], 85.0 + (i % 3) * 0.35, GF + 1.0 + (i % 2) * 0.25, 119.0 + Math.floor(i / 2) * 0.3, 0.13, 0.16, 0.13, { chunk: c.chunk });
  for (const z of [118.8, 120.2]) chair(c, 85.3, z, GF, -Math.PI / 2, '#3f6fa8');
  staticLantern(c, w, 87.5, 0, 117.6, 0.8, 0, 3, 7);
}

// ------------------------------------------------------------------------------------------------ lake + viewpoint
function lake(w: World, g: GameApi, c: Ctx, veg: Vegetation) {
  const k = c.k;
  const mat = w.material(new THREE.MeshLambertMaterial({ color: '#3f8088', transparent: true, opacity: 0.86, emissive: new THREE.Color('#0a2a30') }));
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 64), mat);
  water.rotation.x = -Math.PI / 2;
  water.scale.set(LAKE.rx + 0.6, LAKE.rz + 0.6, 1);
  water.position.copy(v3(LAKE.x, LAKE.water, LAKE.z));
  water.renderOrder = 2;
  water.userData.region = 'outdoor';
  water.userData.noCull = true;
  w.scene.add(water);
  w.col.addEllipse(LAKE.x, LAKE.z, LAKE.rx, LAKE.rz, -3, 3, 'lake'); // the water is never walkable
  w.emitters.push({ kind: 'water', pos: v3(LAKE.x, 0, LAKE.z), on: () => true });
  // reed clumps and stones on the shore (outside the water ellipse, never on a path)
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + Math.sin(i * 3.1) * 0.08, f = 1.06 + (i % 3) * 0.04;
    const x = LAKE.x + Math.cos(a) * LAKE.rx * f, z = LAKE.z + Math.sin(a) * LAKE.rz * f;
    if (x > 72 && z < 143) continue; // keep the viewpoint shore open
    const y = terrainHeight(x, z);
    if (i % 3 === 0) blob(c.b, k.M.paint, '#9a948a', x, y + 0.08, z, 0.45, 0.22, 0.35, { chunk: 'grounds' });
    else for (let j = 0; j < 4; j++) cyl(c.b, k.M.foliage, j % 2 ? '#6a8a3a' : '#7f9a4a', x + Math.cos(j * 1.7) * 0.25, y, z + Math.sin(j * 1.7) * 0.25, 0.03, 0.05, 1.0 + (j % 3) * 0.3, 5, { chunk: 'grounds', shadow: false });
  }
  // dry viewpoint: gravel bay with the bench (memory moved here from the old pond, same id)
  const V = LAKE_VIEW;
  floor(c, V.x0, V.x1, V.z0, V.z1, 0.04, k.M.dirt, '#cdb894', 0.1, false, 1.4);
  const bx = 78.4, bz = 139.6;
  part(c, k.M.wood, '#7a5232', bx, bz, -Math.PI / 2, 0, 0, 0, 1.6, 0.45, 0.45, 1);
  part(c, k.M.wood, '#7a5232', bx, bz, -Math.PI / 2, 0, 0.45, -0.2, 1.6, 0.45, 0.06, 1);
  w.col.addBoxC(bx, bz, 0.5, 1.7, 0, 0.6);
  const benchNote = compound((b) => box(b, k.M.paint, '#f5eedc', 0, 0, 0, 0.16, 0.004, 0.2));
  place(benchNote, bx - 0.05, 0.46, bz + 0.3, 0.2);
  w.scene.add(benchNote);
  makeInspect(w, g, { id: 'mem.pond.bench', obj: benchNote, clue: 'mem.pond.bench', hit: [0.4, 0.2, 0.4] });
  // the old oak on the east side of the water with its nest box (herbarium: "aan de oostkant van de vijver")
  const OX = 80.2, OZ = 148.6, OY = terrainHeight(OX, OZ);
  veg.tree({ x: OX, z: OZ, h: 5.2, r: 3.2, kind: 'oak', hue: -0.3, y: OY }, 'garden');
  w.col.addCircle(OX, OZ, 0.55, OY, OY + 6);
  const nb = compound((b) => {
    box(b, k.M.wood, '#8a5a33', 0, 0, 0, 0.3, 0.38, 0.28);
    box(b, k.M.wood, '#5a3a22', 0, 0.38, 0, 0.36, 0.05, 0.34, { rx: 0.2 });
    cyl(b, k.M.paint, '#2a1f16', 0, 0.22, 0.142, 0.05, 0.05, 0.01, 10, { rx: Math.PI / 2 });
  });
  place(nb, OX - 0.45, OY + 1.7, OZ - 0.2, -Math.PI / 2 - 0.3);
  w.scene.add(nb);
  makeInspect(w, g, { id: 'mem.garden.nestbox', obj: nb, clue: 'mem.garden.nestbox', hit: [0.5, 0.6, 0.5], label: 'Bekijken: nestkastje' });
}

// ------------------------------------------------------------------------------------------------ golf (I05: decor first)
function golf(w: World, c: Ctx) {
  const k = c.k, o = { chunk: 'grounds' };
  const T = GOLF_TEE, C = GOLF_CHUTE;
  boxMM(c.b, k.M.paint, '#4f8a3a', T.x0 + 0.4, T.x0 + 3.0, 0.02, 0.06, T.z0 + 0.3, T.z0 + 2.2, { ...o, shadow: false }); // tee mat
  cyl(c.b, k.M.paint, '#f4f4f0', T.x0 + 1.8, 0.06, T.z0 + 1.2, 0.025, 0.025, 0.03, 8, o);
  cyl(c.b, k.M.paint, '#3a4a6a', T.x0 + 0.7, 0, T.z0 + 2.6, 0.13, 0.15, 0.85, 10, { ...o, rx: 0.15 }); // bag
  for (const dx of [-0.05, 0.05]) cyl(c.b, k.M.paint, '#b8b8b0', T.x0 + 0.7 + dx, 0.8, T.z0 + 2.5, 0.012, 0.012, 0.45, 5, o);
  w.col.addCircle(T.x0 + 0.7, T.z0 + 2.6, 0.2, 0, 1);
  // cardboard return chute climbing the hill's north slope, on timber side beams; not walkable
  const cx = (C.x0 + C.x1) / 2;
  for (let z = C.z0; z < C.z1 - 1e-6; z += 1) {
    const ya = terrainHeight(cx, z), yb = terrainHeight(cx, z + 1);
    const len = Math.hypot(1, yb - ya), ang = Math.atan2(yb - ya, 1);
    box(c.b, k.M.paint, '#c8a878', cx, (ya + yb) / 2 + 0.15, z + 0.5, 0.5, 0.04, len, { ...o, rx: ang });
    for (const s of [-1, 1]) box(c.b, k.M.wood, '#6b4a2a', cx + s * 0.28, (ya + yb) / 2 + 0.1, z + 0.5, 0.08, 0.2, len, { ...o, rx: ang });
    w.col.addBox(cx - 0.35, cx + 0.35, z, z + 1, Math.min(ya, yb) - 0.2, Math.max(ya, yb) + 0.45); // above ground only (never into the hall below)
  }
  const yt = terrainHeight(cx, C.z0);
  cyl(c.b, k.M.paint, '#c8a878', cx, yt, C.z0 - 0.2, 0.3, 0.3, 0.35, 12, o); // cup at the top
}

// ------------------------------------------------------------------------------------------------ wickerman (I04: scene only)
function wickerman(w: World, c: Ctx) {
  const k = c.k, o = { chunk: 'grounds' };
  const { x, z, y } = WICKERMAN;
  const straw = '#d8b860', twig = '#8a6a3a';
  boxMM(c.b, k.M.wood, '#6b4a2a', x - 0.9, x + 0.9, y - 0.05, y + 0.25, z - 0.9, z + 0.9, o); // log base
  for (const s of [-1, 1]) cyl(c.b, k.M.bark, straw, x + s * 0.28, y + 0.25, z, 0.14, 0.18, 1.1, 7, { ...o, rz: -s * 0.12 }); // legs
  cyl(c.b, k.M.bark, straw, x, y + 1.3, z, 0.34, 0.26, 0.9, 8, o); // body
  cyl(c.b, k.M.bark, straw, x, y + 1.95, z, 0.1, 0.1, 1.7, 6, { ...o, rz: Math.PI / 2 }); // arms
  for (const s of [-1, 1]) cyl(c.b, k.M.bark, straw, x + s * 0.85, y + 1.95, z, 0.08, 0.1, 0.55, 6, { ...o, rz: s * 0.5 });
  blob(c.b, k.M.bark, straw, x, y + 2.45, z, 0.24, 0.3, 0.24, o); // head (≈ 2.8 m tall)
  for (let i = 0; i < 6; i++) cyl(c.b, k.M.bark, twig, x + Math.cos(i) * 0.2, y + 1.4, z + Math.sin(i) * 0.2, 0.02, 0.02, 0.9, 4, { ...o, rz: 0.3 * Math.sin(i * 2) });
  w.col.addCircle(x, z, 1.0, y - 0.5, y + 3);
  for (let i = 0; i < 9; i++) { // a ring of candles: local composition, not a route index
    const a = (i / 9) * Math.PI * 2, cxx = x + Math.cos(a) * 3.0, czz = z + Math.sin(a) * 3.0;
    cyl(c.b, k.M.paint, '#f2ead8', cxx, y, czz, 0.05, 0.05, 0.18 + (i % 3) * 0.06, 8, o);
    box(c.b, k.M.glow, '#ffd27a', cxx, y + 0.18 + (i % 3) * 0.06, czz, 0.03, 0.05, 0.03, { ...o, shadow: false, jitter: 0 });
  }
  part(c, k.M.bark, '#7a5a3a', x - 5.2, z + 1.5, 0.4, 0, y, 0, 2.2, 0.4, 0.4, 1); // log bench
  w.col.addBoxC(x - 5.2, z + 1.5, 1.2, 2.3, y - 0.3, y + 0.45);
  staticLantern(c, w, x + 5.6, y, z - 2.0, 0.7, 0, 3, 8);
}
