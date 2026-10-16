// LIB-R01 — authored wall-library composition, not a free-standing maze.
// Coordinates in estate plan metres: X east, Z north. All decorative geometry uses mLib batching.
// The existing B01 puzzle and DS01 discovery remain owned by manor.ts/slice/world.ts.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import type { Ctx } from './arch';
import { segBox } from './arch';
import { box, cyl, compound, v3, getKit } from './kit';
import { bookshelf, sofa, armchair, rug, table, roundTable, chair, plant } from './furniture';
import { floorGlobe, tabletop } from './dressing';
import { GF, UF } from './layout';

export const LIB_R01 = {
  desk: { x: 74.55, z: 97.35, w: 1.3, d: 2.2, h: 0.81 },
  stair: { x: 81.95, z: 105.3, radius: 1.18, steps: 26 },
  landing: { x0: 82.52, x1: 83.43, z0: 104.93, z1: 105.69 },
} as const;

/** Sized specifically to the ground-floor window bays: no shelving across glazing. */
export const LIB_R01_BAYS = {
  west: [
    { z: 95.1, w: 1.65, pal: 'leather' },
    { z: 99.0, w: 1.70, pal: 'olive' },
    { z: 103.0, w: 1.70, pal: 'navy' },
    { z: 107.0, w: 1.90, pal: 'leather' },
  ],
  north: [
    { x: 73.35, w: 1.28, pal: 'navy' },
    { x: 76.75, w: 1.75, pal: 'leather' },
    { x: 80.25, w: 1.75, pal: 'olive' },
    { x: 83.67, w: 1.08, pal: 'leather' },
  ],
} as const;

export function libraryR01Furniture(c: Ctx) {
  // Each bookcase is aligned with a *solid* wall section, not a window opening.
  for (const b of LIB_R01_BAYS.west) bookshelf(c, 72.74, b.z, GF, Math.PI / 2, b.w, 2.89, b.pal, 0.32);
  for (const b of LIB_R01_BAYS.north) bookshelf(c, b.x, 109.26, GF, Math.PI, b.w, 2.88, b.pal, 0.32);
  // Near the entrance and on the library's interior wall (never through its door at Z 101).
  bookshelf(c, 84.68, 96.8, GF, -Math.PI / 2, 2.3, 2.85, 'olive', 0.30);
  bookshelf(c, 84.68, 108.0, GF, -Math.PI / 2, 1.55, 2.85, 'leather', 0.30);

  // The former B01 freestanding table is replaced by a writing-desk zone in the SW corner.
  // A long top keeps the original three slot spacing and east-facing reward drawer geometry.
  const d = LIB_R01.desk;
  table(c, d.x, d.z, GF, d.w, d.d, 0, '#5a3a22', d.h, { openSide: 1 });
  // A fitted pedestal with moulded drawer fronts, a lower cabinet and a small rear desk organizer.
  const k = c.k;
  for (const z of [d.z - 0.83, d.z + 0.83]) {
    box(c.b, k.M.wood, '#4b2b1c', d.x - 0.31, GF + 0.34, z, 0.48, 0.62, 0.47, { chunk: c.chunk });
    for (const yy of [0.25, 0.46]) {
      box(c.b, k.M.wood, '#70482d', d.x - 0.052, GF + yy, z, 0.027, 0.15, 0.39, { chunk: c.chunk });
      box(c.b, k.M.paint, '#b8944a', d.x - 0.025, GF + yy, z, 0.016, 0.025, 0.055, { chunk: c.chunk });
    }
  }
  box(c.b, k.M.wood, '#4c301f', d.x - 0.41, GF + 0.91, d.z - 0.61, 0.38, 0.17, 0.77, { chunk: c.chunk });
  for (const z of [d.z - 0.86, d.z - 0.61, d.z - 0.36])
    box(c.b, k.M.wood, '#765035', d.x - 0.19, GF + 0.90, z, 0.028, 0.13, 0.19, { chunk: c.chunk });
  // A single upholstered visitor chair, parked just north of the puzzle standing point.
  chair(c, 76.05, 98.52, GF, Math.PI / 2, '#b39a77', true, 'upholstered', '#5a3a22');

  // Central quiet reading lounge. Seating is deliberately outside B01/DS01 routes.
  rug(c, 78.35, 102.5, GF + 0.01, 4.6, 5.0, 0, '#a34f38', 'medallion', true);
  sofa(c, 78.75, 103.76, GF, Math.PI, 2.36, '#6c4034',
    { pillows: ['#506346', '#8b4939'] });
  armchair(c, 75.8, 102.75, GF, -Math.PI / 2, '#744638', true);
  table(c, 78.4, 102.18, GF, 1.36, 0.72, 0, '#6b4426', 0.46);
  tabletop(c, 78.4, 102.18, GF + 0.46, 0, ['book', 'stack', 'open'], 51);
  roundTable(c, 76.25, 104.15, GF, 0.26, '#5a3a22');
  tabletop(c, 76.25, 104.15, GF + 0.76, 0, ['book'], 19);
  floorGlobe(c, 82.15, 108.15, GF, 0.3, 0.32);
  plant(c, 73.55, 104.2, GF, 0.68);
  // Intentional book clutter. Use existing batched book family rather than tiny new textures.
  for (const [x, z, seed] of [[75.3, 104.7, 23], [80.3, 103.7, 17], [82.4, 107.4, 29]] as const)
    tabletop(c, x, z, GF + 0.022, 0, ['stack', 'book'], seed);
}

/** Functional ascending steps. The 2.5D locomotion system supports floors, not curved ramps:
 * give each timber tread a reachable small walkable patch, separated in height by < stepUp.
 * No solid tread collider may block the player's capsule while ascending. */
export function libraryR01Stair(c: Ctx) {
  const k = c.k, { x, z, radius, steps } = LIB_R01.stair;
  const rise = (UF - GF) / steps, turn = Math.PI * 2.5, start = -Math.PI / 2;
  const at = (i: number) => {
    const angle = start + (i + 0.5) * turn / steps;
    return { angle, px: x + 0.78 * Math.cos(angle), pz: z + 0.78 * Math.sin(angle) };
  };
  // The thin central post is solid; treads / banisters are visuals plus floor patches.
  cyl(c.b, k.M.wood, '#382819', x, GF, z, 0.09, 0.09, UF - GF + 1.07, 12, { chunk: c.chunk });
  c.col.addCircle(x, z, 0.18, GF, UF + 1.1);
  for (let i = 0; i < steps; i++) {
    const { angle, px, pz } = at(i), y = GF + (i + 1) * rise;
    // Rotate long axis radially, keeping a consistent readable oak nosing.
    box(c.b, k.M.wood, '#684329', px, y - 0.042, pz, 1.00, 0.085, 0.35,
      { chunk: c.chunk, yaw: -angle });
    box(c.b, k.M.wood, '#96633a', px, y + 0.004, pz, 1.01, 0.016, 0.032,
      { chunk: c.chunk, yaw: -angle });
    // The collision engine samples point-foot support, so generous 0.56 m landing pads
    // bridge angular tread corners without invisible solid walls.
    c.col.addFloor(px - 0.30, px + 0.30, pz - 0.30, pz + 0.30, y);
    if (i % 2 === 0) {
      const bx = x + radius * Math.cos(angle), bz = z + radius * Math.sin(angle);
      box(c.b, k.M.wood, '#48301f', bx, y + 0.5, bz, 0.038, 1.0, 0.038, { chunk: c.chunk });
    }
    if (i > 0) {
      const prev = at(i - 1);
      segBox(c, k.M.wood, '#583822',
        [x + radius * Math.cos(prev.angle), GF + i * rise + 1.0, z + radius * Math.sin(prev.angle)],
        [x + radius * Math.cos(angle), y + 1.0, z + radius * Math.sin(angle)], 0.043, 0.043);
    }
  }
  // Open, physically walkable last step into the east gallery, with no inter-floor teleport.
  const l = LIB_R01.landing;
  box(c.b, k.M.wood, '#805433', (l.x0 + l.x1) / 2, UF - 0.07, (l.z0 + l.z1) / 2,
      l.x1 - l.x0, 0.14, l.z1 - l.z0, { chunk: c.chunk });
  c.col.addFloor(l.x0, l.x1, l.z0, l.z1, UF);
}

/** Classic green brass banker's lamp, preserving the existing lamp.library save/id contract. */
export function libraryR01BankerLamp(w: World, x: number, y: number, z: number) {
  const kit = getKit();
  const obj = compound((b) => {
    cyl(b, kit.M.paint, '#a88942', 0, 0, 0, 0.11, 0.13, 0.025, 12);
    cyl(b, kit.M.paint, '#bd9c4d', 0, 0.025, 0, 0.017, 0.018, 0.31, 10);
    box(b, kit.M.paint, '#aa8847', 0, 0.31, 0, 0.43, 0.022, 0.04);
  });
  const shadeMat = w.material(new THREE.MeshLambertMaterial({ color: '#176244', side: THREE.DoubleSide }));
  const greenShade = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), shadeMat);
  greenShade.scale.set(0.29, 0.09, 0.15);
  greenShade.position.y = 0.37;
  obj.add(greenShade);
  const glow = w.material(new THREE.MeshBasicMaterial({ color: '#ffd27a', side: THREE.DoubleSide }));
  const bulb = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.12), glow);
  bulb.rotation.x = -Math.PI / 2; bulb.position.y = 0.307;
  obj.add(bulb);
  obj.position.copy(v3(x, y, z));
  w.scene.add(obj);
  return { obj, glow: [glow], light: v3(x, y + 0.32, z) };
}
