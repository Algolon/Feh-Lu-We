// DEV-02 estate grounds (LEVEL_PLAN v0.2 §2–§5): the reserved outdoor functions as blockout volumes with stable ids.
// Arrival court with one gravel surface and the parked cars; the social garden platforms (BBQ, outdoor dining, gravity
// bong + handpan, balloon nook); the lake with its dry viewpoint; golf behind the BOSLUST hill; the wickerman clearing;
// a rest point on the east glade loop. No new puzzle rules, no ball physics, no burn state (I04/I05 open).
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, floor, segBox } from './arch';
import { box, boxMM, cyl, blob, compound, v3, planMatrix } from './kit';
import { woodMats, logModel, rockModel, trunkAt } from './woodkit';
import { NEST_OAK, type EstateWoods } from './estateWoods';
import { hash01 } from './woodlandPlan';
import { table, part, staticLantern, joinery } from './furniture';
import { Asm, artMats, lathe, cushion, projectUV } from './artkit';
import { makeInspect, place } from '../interactions/props';
import type { Vegetation } from './nature';
import {
  ARRIVAL, ARRIVAL_SERVICE, PARKING, BBQ, OUTDOOR_DINING, MUSIC_BONG, BALLOON_NOOK, LAKE, LAKE_VIEW, GOLF_TEE, GOLF_CHUTE, WICKERMAN, GF, type Rect,
} from './layout';
import { terrainHeight } from './terrain';

const PLATFORM_LOG = logModel(151, 2.1, 0.17);
const BENCH_LOG2 = logModel(157, 2.2, 0.21);
const SHORE_STONE = (() => { const g = rockModel(71); g.userData.keepColor = true; return g; })();

export function buildGrounds(w: World, g: GameApi, c: Ctx, veg: Vegetation, woods: EstateWoods | null) {
  arrival(w, c);
  socialGarden(w, c);
  lake(w, g, c, veg, woods);
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

/**
 * DEV-03 car kit: a stylised European car (body with softened shoulders, a glasshouse with pillars, wheel arches
 * with tyres and hubs, bumpers, lamps, plates). Three silhouettes by bay: estate, hatchback, compact van. The
 * collider is unchanged (one box per car, `id` tag).
 */
function car(w: World, c: Ctx, id: string, x: number, z: number, color: string) {
  const { sb, bx, cg } = joinery, M = artMats(), a = new Asm(c.b, 'grounds', x, 0, z, 0);
  const kind = ['car.1', 'car.4'].includes(id) ? 'estate' : id === 'car.2' ? 'van' : 'hatch';
  const L = kind === 'hatch' ? 3.95 : 4.3, roofL = kind === 'estate' ? 2.55 : kind === 'van' ? 2.9 : 1.9;
  const roofZ = kind === 'hatch' ? -0.35 : kind === 'van' ? -0.15 : -0.3;
  const body = new THREE.Color(color), trim = '#2a2a2a', glass = '#5d6c76';
  // lower body and bonnet (front = +z, nose toward the house)
  a.add(M.paint, body, sb(1.76, 0.5, L, 0.12, 2), 0, 0.5, 0);
  if (kind !== 'van') a.add(M.paint, body, sb(1.7, 0.16, L * 0.32, 0.08, 2), 0, 0.8, L / 2 - L * 0.16 - 0.1);
  // glasshouse: glass band + roof + pillars
  const gh = kind === 'van' ? 0.62 : 0.5, gy = 0.75 + (kind === 'van' ? 0.05 : 0);
  a.add(c.k.M.glow, glass, bx(1.58, gh * 0.85, roofL - 0.1), 0, gy + gh * 0.45, roofZ);
  a.add(M.paint, body, sb(1.6, 0.07, roofL, 0.03), 0, gy + gh + 0.02, roofZ);
  for (const sx of [-1, 1]) for (const pz of [roofZ - roofL / 2 + 0.06, roofZ + roofL / 2 - 0.08, roofZ]) a.add(M.paint, pz === roofZ ? trim : body, bx(0.05, gh, 0.08), sx * 0.785, gy + gh / 2, pz);
  if (kind === 'van') a.add(M.paint, body, sb(1.7, 0.42, 1.0, 0.1, 2), 0, 0.98, L / 2 - 0.55);
  // wheels in arches, bumpers, lamps, plates, mirrors
  const tyre = cg('tyre', () => new THREE.CylinderGeometry(0.33, 0.33, 0.22, 12).rotateZ(Math.PI / 2));
  const hub = cg('hub', () => new THREE.CylinderGeometry(0.17, 0.17, 0.23, 10).rotateZ(Math.PI / 2));
  for (const sx of [-1, 1]) for (const wz of [L / 2 - 0.78, -L / 2 + 0.78]) {
    a.add(M.paint, '#1c1c1c', tyre, sx * 0.79, 0.33, wz);
    a.add(M.brass, '#a8a8a2', hub, sx * 0.795, 0.33, wz);
    a.add(M.paint, '#1e1e1e', bx(0.06, 0.12, 0.86), sx * 0.86, 0.66, wz);
  }
  for (const ez of [1, -1]) {
    a.add(M.paint, trim, sb(1.8, 0.16, 0.12, 0.05), 0, 0.32, ez * (L / 2 + 0.02));
    a.add(M.paint, '#f2d24a', bx(0.52, 0.11, 0.012), 0, 0.42, ez * (L / 2 + 0.085)); // plate
    for (const sx of [-1, 1]) a.add(c.k.M.glow, ez > 0 ? '#fff2c8' : '#9a2a22', bx(0.32, 0.12, 0.02), sx * 0.6, 0.6, ez * (L / 2 + 0.005));
  }
  for (const sx of [-1, 1]) a.add(M.paint, body, sb(0.12, 0.09, 0.16, 0.03), sx * 0.93, gy + 0.08, roofZ + roofL / 2 - 0.1);
  const col = w.col.addBox(x - 0.92, x + 0.92, z - 2.2, z + 2.2, 0, 1.25, { occludes: true, tag: id });
  void col;
}

// ------------------------------------------------------------------------------------------------ social garden
function platform(c: Ctx, r: Rect, color: string) {
  floor(c, r.x0, r.x1, r.z0, r.z1, GF, c.k.M.stone, color, 0.25, true, 1.4);
  boxMM(c.b, c.k.M.stone, '#c4b898', r.x0 - 0.06, r.x1 + 0.06, -0.05, GF - 0.03, r.z0 - 0.06, r.z1 + 0.06, { chunk: c.chunk, uv: 1 }); // edge course
}

function socialGarden(w: World, c: Ctx) {
  const k = c.k, { sb, bx, cg } = joinery, M = artMats();
  // BBQ work place (reached from the kitchen door), apart from the balloon tank: a kettle grill on three legs with a
  // side shelf, the prep table, a gas bottle with its valve; tongs and a board on the prep table
  platform(c, BBQ, '#d8ccb0');
  { const a = new Asm(c.b, c.chunk, 107.0, GF, 117.6, 0);
    for (let i = 0; i < 3; i++) { const an = (i / 3) * Math.PI * 2 + 0.5; a.add(M.paint, '#2b2b2b', bx(0.035, 0.75, 0.035), Math.cos(an) * 0.24, 0.37, Math.sin(an) * 0.24, { rx: Math.sin(an) * 0.18, rz: -Math.cos(an) * 0.18 }); }
    a.add(M.paint, '#1f1f1f', cg('kettleBowl', () => lathe([[0.001, 0], [0.18, 0.02], [0.3, 0.14], [0.34, 0.26], [0.001, 0.26]], 16)), 0, 0.62, 0);
    a.add(M.paint, '#262626', cg('kettleLid', () => lathe([[0.34, 0], [0.32, 0.1], [0.22, 0.2], [0.05, 0.24], [0.001, 0.24]], 16)), 0, 0.9, 0);
    a.add(M.brass, '#9a9a96', bx(0.12, 0.03, 0.03), 0, 1.15, 0);
    a.add(M.timber, '#7e5636', sb(0.5, 0.03, 0.3, 0.006), 0.55, 0.85, 0);
    a.add(M.paint, '#5a7a8a', cg('gasBottle', () => lathe([[0.001, 0], [0.16, 0], [0.165, 0.05], [0.165, 0.5], [0.12, 0.6], [0.05, 0.63], [0.05, 0.68], [0.001, 0.68]], 14)), -2.0, 0, 0.9);
    a.add(M.brass, '#c9a14e', bx(0.05, 0.05, 0.05), -2.0, 0.71, 0.9);
  }
  table(c, 109.4, 117.6, GF, 1.4, 0.7, 0, '#8a6a4a', 0.9);
  { const a = new Asm(c.b, c.chunk, 109.4, GF, 117.6, 0);
    a.add(M.timber, '#b08458', sb(0.5, 0.025, 0.32, 0.008), -0.3, 0.915, 0, { ry: 0.15 });
    a.add(M.paint, '#8a8a86', bx(0.32, 0.02, 0.04), 0.35, 0.91, 0.05, { ry: -0.3 });
  }
  w.col.addBox(106.3, 107.7, 117.25, 117.95, 0, GF + 1.2);
  w.col.addCircle(105.0, 118.5, 0.2, 0, 0.8);
  // outdoor dining: one long table with slatted garden benches; a festoon of warm bulbs on two posts; plates set
  platform(c, OUTDOOR_DINING, '#e2d6bc');
  table(c, 98.0, 120.0, GF, 1.1, 4.4, 0, '#8a6a4a');
  for (const sx of [-1, 1]) {
    const a = new Asm(c.b, c.chunk, 98.0 + sx * 1.0, GF, 120.0, 0);
    for (let q = 0; q < 4; q++) a.add(M.timber, '#8a6a48', bx(0.075, 0.035, 4.2), -0.13 + q * 0.087, 0.445, 0);
    for (const lz of [-1.8, 0, 1.8]) { a.add(M.timber, '#6e5238', bx(0.05, 0.43, 0.06), -0.12, 0.215, lz); a.add(M.timber, '#6e5238', bx(0.05, 0.43, 0.06), 0.12, 0.215, lz); a.add(M.timber, '#6e5238', bx(0.32, 0.05, 0.06), 0, 0.41, lz); }
    w.col.addBoxC(98.0 + sx * 1.0, 120.0, 0.4, 4.2, 0, GF + 0.5);
  }
  for (let i = 0; i < 6; i++) { const a = new Asm(c.b, c.chunk, 97.75 + (i % 2) * 0.5, GF + 0.76, 118.4 + i * 0.6, 0); a.add(M.ceramic, '#f2ead8', cg('plate', () => new THREE.CylinderGeometry(0.12, 0.11, 0.018, 16)), 0, 0.009, 0); a.add(M.ceramic, '#6f91a6', cg('plateRim', () => new THREE.TorusGeometry(0.105, 0.006, 4, 16).rotateX(Math.PI / 2)), 0, 0.018, 0); }
  festoon(c, [[95.1, 117.4], [100.9, 122.6]], GF);
  // gravity bong + handpan: a low table with the instrument on its own stand, an outdoor rug, poufs (no mechanic)
  platform(c, MUSIC_BONG, '#d8ccb0');
  boxMM(c.b, k.M.rug, '#c8b898', 79.6, 84.4, GF + 0.005, GF + 0.012, 118.5, 122.5, { chunk: c.chunk, shadow: false });
  table(c, 81.6, 120.6, GF, 1.1, 0.8, 0, '#7a5a3a', 0.4);
  { const a = new Asm(c.b, c.chunk, 81.3, GF + 0.4, 120.5, 0.3);
    a.add(M.paint, '#4f86a8', cg('bongBucket', () => lathe([[0.001, 0], [0.15, 0], [0.18, 0.36], [0.19, 0.38], [0.17, 0.38], [0.001, 0.36]], 14)), 0, 0, 0);
    a.add(M.paint, '#8fb8c8', cg('bongWater', () => new THREE.CircleGeometry(0.165, 14).rotateX(-Math.PI / 2)), 0, 0.33, 0);
    a.add(k.M.glass, '#ffffff', cg('bongBottle', () => lathe([[0.03, 0], [0.075, 0.03], [0.08, 0.28], [0.04, 0.34], [0.025, 0.4], [0.001, 0.4]], 12)), 0, 0.12, 0);
    a.add(M.brass, '#a8a8a2', cg('bongBowl', () => lathe([[0.001, 0], [0.012, 0], [0.03, 0.04], [0.032, 0.05], [0.001, 0.02]], 8)), 0, 0.52, 0);
  }
  { const a = new Asm(c.b, c.chunk, 83.4, GF, 121.6, 0.4);
    for (let i = 0; i < 3; i++) { const an = (i / 3) * Math.PI * 2; a.add(M.timber, '#5a3a22', bx(0.025, 0.58, 0.025), Math.cos(an) * 0.13, 0.29, Math.sin(an) * 0.13, { rx: Math.sin(an) * 0.2, rz: -Math.cos(an) * 0.2 }); }
    a.add(M.brass, '#8e8a84', cg('handpanTop', () => lathe([[0.001, 0.09], [0.12, 0.08], [0.24, 0.035], [0.27, 0.0], [0.001, 0.0]], 18)), 0, 0.6, 0);
    a.add(M.brass, '#7e7a74', cg('handpanBot', () => lathe([[0.27, 0], [0.24, -0.035], [0.12, -0.075], [0.001, -0.08]], 18)), 0, 0.6, 0);
    for (let i = 0; i < 7; i++) { const an = (i / 7) * Math.PI * 2; a.add(M.brass, '#6e6a64', cg('tone', () => new THREE.CircleGeometry(0.045, 8).rotateX(-Math.PI / 2)), Math.cos(an) * 0.17, 0.6 + 0.052, Math.sin(an) * 0.17, { rx: -Math.sin(an) * 0.25, rz: Math.cos(an) * 0.25 }); }
    a.add(M.brass, '#6e6a64', cg('ding', () => lathe([[0.001, 0.02], [0.04, 0.015], [0.05, 0.0], [0.001, 0.0]], 10)), 0, 0.69, 0);
  }
  w.col.addCircle(83.4, 121.6, 0.3, 0, 0.8);
  for (const [x, z, col] of [[80.0, 119.0, '#b3813f'], [80.0, 122.0, '#7a2e2a'], [82.8, 119.0, '#62704a']] as const) { const a = new Asm(c.b, c.chunk, x, GF, z, x * 0.7); a.add(M.upholstery, col, cg('pouf', () => projectUV(cushion(0.55, 0.3, 0.55, 0.12, 0.03), 0.25)), 0, 0.15, 0); }
  // helium tank on its trolley + balloons tethered to a weight (they float on strings, they do not hover loose)
  platform(c, BALLOON_NOOK, '#e2d6bc');
  { const a = new Asm(c.b, c.chunk, 86.3, GF, 121.4, -0.5);
    a.add(M.paint, '#8a9aa8', cg('heliumTank', () => lathe([[0.001, 0], [0.13, 0], [0.14, 0.03], [0.14, 0.78], [0.1, 0.88], [0.04, 0.92], [0.001, 0.92]], 14)), 0, 0.02, 0);
    a.add(M.brass, '#c9a14e', bx(0.06, 0.1, 0.06), 0, 0.97, 0);
    a.add(M.paint, '#2b2b2b', bx(0.36, 0.03, 0.3), 0, 0.015, 0.05);
    a.add(M.paint, '#2b2b2b', bx(0.03, 1.0, 0.03), 0.16, 0.5, 0.2); a.add(M.paint, '#2b2b2b', bx(0.03, 1.0, 0.03), -0.16, 0.5, 0.2);
  }
  w.col.addCircle(86.3, 121.4, 0.18, 0, 1);
  const wx = 85.2, wz = 119.4;
  { const a = new Asm(c.b, c.chunk, wx, GF, wz, 0); a.add(M.paint, '#c9a14e', cg('balloonWeight', () => lathe([[0.001, 0], [0.07, 0], [0.06, 0.08], [0.001, 0.09]], 10)), 0, 0, 0); }
  ['#e85a8a', '#f2c64a', '#5ab0e8', '#7ad06a', '#e8743a'].forEach((col, i) => {
    const an = i * 1.3, bx2 = wx + Math.cos(an) * 0.35, bz = wz + Math.sin(an) * 0.3, by = GF + 1.55 + (i % 3) * 0.2;
    const a = new Asm(c.b, c.chunk, bx2, by, bz, an);
    a.add(M.ceramic, col, cg('balloon', () => lathe([[0.001, -0.2], [0.07, -0.17], [0.15, -0.06], [0.16, 0.04], [0.12, 0.13], [0.001, 0.17]], 12)), 0, 0, 0);
    a.add(M.ceramic, col, cg('balloonKnot', () => new THREE.ConeGeometry(0.02, 0.04, 6).rotateX(Math.PI)), 0, -0.22, 0);
    const len = Math.hypot(bx2 - wx, by - 0.24 - GF - 0.09, bz - wz);
    segBox(c, k.M.paint, '#f4f0e6', [wx, GF + 0.09, wz], [bx2, by - 0.24, bz], 0.006, 0.006); void len;
  });
  for (const z of [118.8, 120.2]) foldingChair(c, 85.3, z, GF, -Math.PI / 2, '#3f6fa8');
  staticLantern(c, w, 87.5, 0, 117.6, 0.8, 0, 3, 7);
}

/** A slatted folding garden chair (painted). */
function foldingChair(c: Ctx, x: number, z: number, y0: number, yaw: number, col: string) {
  const { bx } = joinery, M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw);
  for (const sx of [-1, 1]) { a.add(M.paint, col, bx(0.03, 0.85, 0.03), sx * 0.2, 0.42, -0.12, { rx: 0.18 }); a.add(M.paint, col, bx(0.03, 0.5, 0.03), sx * 0.2, 0.25, 0.12, { rx: -0.35 }); }
  for (let q = 0; q < 4; q++) a.add(M.paint, col, bx(0.42, 0.02, 0.07), 0, 0.45, -0.12 + q * 0.085);
  for (let q = 0; q < 3; q++) a.add(M.paint, col, bx(0.42, 0.06, 0.02), 0, 0.62 + q * 0.09, -0.2, { rx: 0.15 });
  c.col.addCircle(x, z, 0.26, y0, y0 + 0.9);
}

/** A festoon of warm bulbs strung between two posts (posts at the ends; the string sags). */
function festoon(c: Ctx, ends: [[number, number], [number, number]], y0: number) {
  const { bx, cg } = joinery, M = artMats(), [[x0, z0], [x1, z1]] = ends, top = y0 + 2.7;
  for (const [x, z] of ends) { const a = new Asm(c.b, c.chunk, x, y0, z, 0); a.add(M.timber, '#5a4630', bx(0.08, 2.8, 0.08), 0, 1.4, 0); c.col.addCircle(x, z, 0.08, y0, y0 + 2.8); }
  const n = 14;
  let prev: [number, number, number] | null = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, y = top - 0.55 * Math.sin(t * Math.PI);
    if (prev) segBox(c, c.k.M.paint, '#2b2622', prev, [x, y, z], 0.01, 0.01);
    if (i > 0 && i < n) { const a = new Asm(c.b, c.chunk, x, y - 0.1, z, 0); a.add(c.k.M.glow, '#ffd890', cg('bulb', () => new THREE.SphereGeometry(0.04, 8, 6)), 0, 0, 0); a.add(M.paint, '#2b2622', bx(0.02, 0.05, 0.02), 0, 0.05, 0); }
    prev = [x, y, z];
  }
}

// ------------------------------------------------------------------------------------------------ lake + viewpoint
function lake(w: World, g: GameApi, c: Ctx, veg: Vegetation, woods: EstateWoods | null) {
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
  // reed beds and shore stones (outside the water ellipse, never on a path). DEV-03: reeds are clumps of tall grass
  // blades from the plant kit in drifts along the shallow shore, shown from across the water; stones are kit rocks,
  // half-sunk; the viewpoint shore stays open
  const M = woodMats();
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + Math.sin(i * 3.1) * 0.08, f = 1.06 + (i % 3) * 0.04;
    const x = LAKE.x + Math.cos(a) * LAKE.rx * f, z = LAKE.z + Math.sin(a) * LAKE.rz * f;
    if (x > 72 && z < 143) continue; // keep the viewpoint shore open
    const y = terrainHeight(x, z);
    if (i % 3 === 0) { c.b.add(M.rock, SHORE_STONE, planMatrix(x, y - 0.12, z, a * 3, 0.55, 0.35, 0.45), '#8f877a', 'grounds', true, 0); continue; }
    for (let j = 0; j < 7; j++) {
      const rx = x + Math.cos(j * 1.7 + i) * (0.2 + (j % 3) * 0.22), rz = z + Math.sin(j * 1.7 + i) * (0.2 + (j % 3) * 0.18);
      if (woods) woods.addPlant('grass', j % 2 ? 1 : 2, rx, rz, 1.6 + (j % 3) * 0.35, terrainHeight(rx, rz) - 0.03, 60);
      else cyl(c.b, k.M.foliage, j % 2 ? '#6a8a3a' : '#7f9a4a', rx, y, rz, 0.03, 0.05, 1.0 + (j % 3) * 0.3, 5, { chunk: 'grounds', shadow: false });
    }
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
  const OX = NEST_OAK.x, OZ = NEST_OAK.z, OY = terrainHeight(OX, OZ);
  veg.tree({ x: OX, z: OZ, h: 5.2, r: 3.2, kind: 'oak', hue: -0.3, y: OY }, 'garden');
  w.col.addCircle(OX, OZ, 0.55, OY, OY + 6);
  const nb = compound((b) => {
    box(b, k.M.wood, '#8a5a33', 0, 0, 0, 0.3, 0.38, 0.28);
    box(b, k.M.wood, '#5a3a22', 0, 0.38, 0, 0.36, 0.05, 0.34, { rx: 0.2 });
    cyl(b, k.M.paint, '#2a1f16', 0, 0.22, 0.142, 0.05, 0.05, 0.01, 10, { rx: Math.PI / 2 });
  });
  // DEV-03: mounted ON the woodkit oak's trunk (its surface at this height and bearing, the trunk's lean included)
  { const dx = -0.914, dz = -0.406, yw = NEST_OAK.yaw, sy = 0.94 + hash01(OX, OZ, 3) * 0.12, my = 1.75 / sy;
    const a = -Math.atan2(dz, dx) - yw, t = trunkAt('oak', NEST_OAK.v, my, a);
    const ax = t.cx * Math.cos(yw) - t.cz * Math.sin(yw), az = -(t.cx * Math.sin(yw) + t.cz * Math.cos(yw));
    place(nb, OX + ax + dx * (t.r + 0.12), OY - 0.05 + 1.75 - 0.19, OZ + az + dz * (t.r + 0.12), Math.atan2(dx, dz)); }
  w.scene.add(nb);
  makeInspect(w, g, { id: 'mem.garden.nestbox', obj: nb, clue: 'mem.garden.nestbox', hit: [0.5, 0.6, 0.5], label: 'Bekijken: nestkastje' });
}

// ------------------------------------------------------------------------------------------------ golf (I05: decor first)
function golf(w: World, c: Ctx) {
  const k = c.k, o = { chunk: 'grounds' };
  const T = GOLF_TEE, C = GOLF_CHUTE;
  boxMM(c.b, k.M.paint, '#3e6a34', T.x0 + 0.35, T.x0 + 3.05, 0.0, 0.035, T.z0 + 0.25, T.z0 + 2.25, { ...o, shadow: false }); // mat base
  boxMM(c.b, k.M.paint, '#5c8f45', T.x0 + 0.42, T.x0 + 2.98, 0.035, 0.06, T.z0 + 0.32, T.z0 + 2.18, { ...o, shadow: false }); // tee mat
  cyl(c.b, k.M.paint, '#f4f4f0', T.x0 + 1.8, 0.06, T.z0 + 1.2, 0.025, 0.025, 0.03, 8, o);
  // a stand bag: body, top collar, pocket, strap, two splayed legs; club shafts with heads and head covers
  const gx = T.x0 + 0.7, gz = T.z0 + 2.6;
  cyl(c.b, k.M.paint, '#2f4a6e', gx, 0.08, gz, 0.13, 0.15, 0.8, 12, { ...o, rx: 0.18 }); // bag
  cyl(c.b, k.M.paint, '#e8e2d4', gx, 0.86, gz + 0.14, 0.15, 0.14, 0.08, 12, { ...o, rx: 0.18 }); // collar
  box(c.b, k.M.paint, '#e8e2d4', gx, 0.3, gz - 0.15, 0.16, 0.3, 0.05, { ...o, rx: 0.18 }); // pocket
  for (const s2 of [-1, 1]) cyl(c.b, k.M.paint, '#2a2a2a', gx + s2 * 0.12, 0, gz + 0.32, 0.012, 0.012, 0.75, 5, { ...o, rx: -0.42, rz: s2 * 0.15 }); // legs
  for (const [dx, dz, col] of [[-0.06, 0.18, '#c8c4bc'], [0.04, 0.2, '#c8c4bc'], [0.0, 0.1, '#b8463a'], [0.07, 0.12, '#2f2f2f']] as const) {
    cyl(c.b, k.M.paint, '#b8b8b0', gx + dx, 0.85, gz + dz, 0.008, 0.008, 0.38, 5, { ...o, rx: 0.18 });
    box(c.b, k.M.paint, col, gx + dx, 1.2, gz + dz + 0.07, 0.07, 0.08, 0.1, o);
  }
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
  const straw = '#d8b860', twine = '#5a4430', M = woodMats();
  // DEV-03 (ENVIRONMENT_STORY reference: bound limbs, broad shoulders): a platform of crossed logs; straw bundles
  // for legs, body, arms and head, tied with twine at ankles, knees, waist, chest, elbows, wrists and neck
  for (const [dz, yaw, yy] of [[-0.55, 0, 0], [0.55, 0, 0], [0, Math.PI / 2, 0.3]] as const) {
    const L = 2.1, ax = x - (Math.cos(yaw) * L) / 2, az = z + dz + (Math.sin(yaw) * L) / 2;
    c.b.add(M.tree, PLATFORM_LOG, planMatrix(ax, y - 0.08 + yy, az, yaw), '#8c7a64', o.chunk, true, 0);
  }
  const top = y + 0.62;
  const band = (bx: number, by: number, r: number, rz = 0) => cyl(c.b, k.M.paint, twine, bx, by, z, r, r, 0.06, 8, { ...o, rz });
  for (const s of [-1, 1]) {
    cyl(c.b, k.M.bark, straw, x + s * 0.24, top, z, 0.13, 0.17, 1.15, 8, { ...o, rz: -s * 0.1 }); // legs
    band(x + s * 0.22, top + 0.08, 0.17); band(x + s * 0.27, top + 0.55, 0.155);
  }
  cyl(c.b, k.M.bark, straw, x, top + 1.05, z, 0.46, 0.27, 1.05, 10, o); // body: broad at the shoulders
  band(x, top + 1.15, 0.31); band(x, top + 1.75, 0.42);
  for (const s of [-1, 1]) { // arms: bundles hanging out and down from the shoulders, bound at the elbow and wrist
    cyl(c.b, k.M.bark, straw, x + s * 0.72, top + 1.62, z, 0.1, 0.13, 0.95, 7, { ...o, rz: s * 1.0 });
    cyl(c.b, k.M.bark, straw, x + s * 1.15, top + 1.0, z, 0.08, 0.1, 0.75, 7, { ...o, rz: s * 0.35 });
    band(x + s * 1.1, top + 1.45, 0.12, s * 1.0); band(x + s * 1.24, top + 1.05, 0.1, s * 0.35);
  }
  cyl(c.b, k.M.bark, straw, x, top + 2.12, z, 0.1, 0.12, 0.2, 7, o); // neck
  band(x, top + 2.16, 0.12);
  blob(c.b, k.M.bark, straw, x, top + 2.5, z, 0.25, 0.32, 0.25, o); // head (≈ 2.8 m in all)
  for (let i = 0; i < 7; i++) cyl(c.b, k.M.bark, '#c8a650', x + Math.cos(i * 0.9) * 0.18, top + 2.75, z + Math.sin(i * 0.9) * 0.18, 0.015, 0.03, 0.3, 4, { ...o, rz: 0.4 * Math.cos(i * 1.3), rx: 0.4 * Math.sin(i * 1.3) }); // straw tuft
  w.col.addCircle(x, z, 1.0, y - 0.5, y + 3);
  for (let i = 0; i < 9; i++) { // a ring of candles in glass jars: local composition, not a route index
    const a = (i / 9) * Math.PI * 2 + 0.15 * Math.sin(i * 2.3), d = 2.9 + 0.25 * Math.sin(i * 1.7), cxx = x + Math.cos(a) * d, czz = z + Math.sin(a) * d, gy = terrainHeight(cxx, czz);
    cyl(c.b, k.M.paint, '#bfc8c0', cxx, gy, czz, 0.065, 0.06, 0.16, 8, o);
    cyl(c.b, k.M.paint, '#f2ead8', cxx, gy + 0.01, czz, 0.035, 0.035, 0.1 + (i % 3) * 0.02, 8, o);
    box(c.b, k.M.glow, '#ffd27a', cxx, gy + 0.11 + (i % 3) * 0.02, czz, 0.022, 0.04, 0.022, { ...o, shadow: false, jitter: 0 });
  }
  // a log bench facing the figure, a lantern on a stake
  const bx = x - 5.2, bz = z + 1.5;
  c.b.add(M.tree, BENCH_LOG2, planMatrix(bx, y - 0.02, bz - 1.1, Math.PI / 2 + 0.25), '#9a8a74', o.chunk, true, 0);
  w.col.addBoxC(bx, bz, 1.2, 2.3, y - 0.3, y + 0.45);
  staticLantern(c, w, x + 5.6, y, z - 2.0, 0.7, 0, 3, 8);
}
