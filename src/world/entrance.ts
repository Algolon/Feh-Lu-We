// DEV-04D D3-A2: the manor's principal entrance as constructed architecture (docs/dev04d/DEV04D_D3_ARCH_CALIBRATION_REPORT.md).
// The portico carries itself: plinth blocks → Tuscan columns (torus base, shaft with entasis, astragal, echinus) →
// square abaci → a two-fascia architrave that returns to responding pilasters on the bay → a recessed frieze → a
// projecting cornice (bed moulding, corona, cymatium) → a lead roof with a front roll and a wall flashing. The doorway
// gets a dressed stone surround and lined reveals, the steps get nosed treads over darker risers, and the projecting
// entrance bay gets its own plinth and a floor-level string course. Visual only: every collider, floor, the door and
// its opening are the ones the shell already builds. Plan coordinates (x, y, z); `boxMM` / `box` take plan z.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { TRIM } from './arch';
import { lathe } from './artkit';
import { boxMM, rod } from './kit';
import { EXTERIOR_STUDY, exteriorMats, dressedLatheUV } from './exteriorStudy';

/** The entrance datum (plan): door centre x, bay face z, portico column line z, floor y. */
export interface EntranceSite { x: number; bayZ: number; colZ: number; colX: [number, number]; gf: number }

/** Shades of one limestone family (broad value zones, not texture noise): base darkest, trim lightest. */
export const STONE = { base: EXTERIOR_STUDY ? '#c4c0ac' : '#c4b08c', baseTop: EXTERIOR_STUDY ? '#d6d1bd' : '#d6c6a2', riser: EXTERIOR_STUDY ? '#b9b6a4' : '#b9a888', tread: EXTERIOR_STUDY ? '#ddd7c4' : '#ddd0b2', field: '#f6ead0', dressed: TRIM.dressed, shadowed: '#e2d4b6', lead: '#6f7476' };

/**
 * Tuscan column profile from the top of its plinth block: torus base, fillet, a shaft with a slight entasis (widest at
 * a third of its height), an astragal under the neck and an echinus that spreads to the abacus. `h` = plinth top →
 * abacus underside. Lathe radii in metres. Reusable for any hero column of the house's order.
 */
export function tuscanColumnGeo(h: number, r = 0.2, seg = 16) {
  const k = (y: number) => y * h; // relative height
  return lathe([
    [0.001, 0], [r * 1.18, 0], [r * 1.2, 0.03], [r * 1.16, 0.07], [r * 1.03, 0.09], [r, 0.115],
    [r * 1.01, k(0.33)], [r * 0.93, k(0.75)], [r * 0.85, h - 0.17],
    [r * 0.95, h - 0.155], [r * 0.95, h - 0.125], [r * 0.85, h - 0.11], [r * 0.85, h - 0.075],
    [r * 1.07, h - 0.04], [r * 1.18, h], [0.001, h],
  ], seg);
}

/**
 * Projecting cornice on three sides of a block (front at z0, back at the wall zW), from `y`: bed moulding, corona with a
 * soffit shadow, cymatium. `x0..x1` is the block's span. Returns the top height. Reusable for any canopy / door head.
 */
export function corniceRun(c: Ctx, x0: number, x1: number, z0: number, zW: number, y: number, col = STONE.dressed) {
  const m = c.k.M.paint, o = { chunk: c.chunk, jitter: 0.01 };
  boxMM(c.b, m, STONE.shadowed, x0 - 0.05, x1 + 0.05, y, y + 0.05, z0 - 0.05, zW, o); // bed moulding
  boxMM(c.b, m, col, x0 - 0.17, x1 + 0.17, y + 0.05, y + 0.17, z0 - 0.17, zW, o); // corona
  boxMM(c.b, m, '#f3eada', x0 - 0.15, x1 + 0.15, y + 0.17, y + 0.21, z0 - 0.15, zW, o); // cymatium
  return y + 0.21;
}

export function buildEntrance(c: Ctx, s: EntranceSite) {
  const k = c.k, stone = EXTERIOR_STUDY ? exteriorMats().dressed : k.M.stone, o = { chunk: c.chunk }, oj = { chunk: c.chunk, jitter: 0.015 }, gf = s.gf;
  const [cx0, cx1] = s.colX, cz = s.colZ, bay = s.bayZ;
  // ENT-R02: retain the complete approved portico vocabulary while moving its authored ground treads.
  const zShift = 79.55 - bay, Z = (original: number) => original - zShift;
  const ABACUS = gf + 2.76; // the old abacus top: the beam datum is unchanged

  // ---- steps and landing (the walk surfaces stay the shell's floor + step heights: 0.075 and GF)
  boxMM(c.b, stone, STONE.riser, 87.4, 92.6, -0.1, 0.045, Z(78.2), Z(80.0), { ...oj, uv: 1 }); // step body (riser in the darker base stone)
  boxMM(c.b, stone, STONE.tread, 87.375, 92.625, 0.045, 0.075, Z(78.175), Z(78.6), { ...oj, uv: 1 }); // tread with a 2.5 cm nosing
  boxMM(c.b, stone, STONE.tread, 87.375, 87.8, 0.045, 0.075, Z(78.6), Z(79.95), { ...oj, uv: 1 }); // tread returns at the ends
  boxMM(c.b, stone, STONE.tread, 92.2, 92.625, 0.045, 0.075, Z(78.6), Z(79.95), { ...oj, uv: 1 });
  boxMM(c.b, stone, STONE.riser, 87.8, 92.2, 0.075, 0.118, Z(78.59), Z(78.62), o); // landing riser band (1 cm proud of the slab's own face: no shared plane)
  boxMM(c.b, stone, STONE.tread, 87.775, 92.225, 0.118, 0.15, Z(78.575), Z(78.6), oj); // landing nosing lip (top flush with GF)
  for (const x of [87.775, 92.2]) boxMM(c.b, stone, STONE.tread, x, x + 0.025, 0.118, 0.15, 78.6, 79.95, oj);

  // ---- columns on plinth blocks
  const PL = 0.14, colH = ABACUS - 0.1 - (gf + PL);
  const colG = tuscanColumnGeo(colH);
  if(EXTERIOR_STUDY)dressedLatheUV(colG);
  for (const x of [cx0, cx1]) {
    boxMM(c.b, stone, STONE.baseTop, x - 0.25, x + 0.25, gf, gf + PL, cz - 0.25, cz + 0.25, { ...oj, uv: 0.8 });
    c.b.add(stone, colG, new THREE.Matrix4().makeTranslation(x, gf + PL, -cz), '#efe4ca', c.chunk, true, 0);
    boxMM(c.b, k.M.paint, STONE.dressed, x - 0.27, x + 0.27, ABACUS - 0.1, ABACUS, cz - 0.27, cz + 0.27, o); // abacus
  }
  colG.dispose();

  // ---- responding pilasters on the bay face behind the columns (the beam's back bearing)
  for (const x of [cx0, cx1]) {
    boxMM(c.b, k.M.paint, STONE.shadowed, x - 0.2, x + 0.2, gf, ABACUS, bay - 0.07, bay + 0.01, oj); // shaft (a step darker than the columns: they stay the figure)
    boxMM(c.b, stone, STONE.baseTop, x - 0.24, x + 0.24, gf, gf + PL, bay - 0.11, bay + 0.01, { ...oj, uv: 0.8 }); // base block
    boxMM(c.b, k.M.paint, STONE.dressed, x - 0.24, x + 0.24, ABACUS - 0.1, ABACUS, bay - 0.11, bay + 0.01, o); // cap
  }

  // ---- entablature: architrave (two fasciae) along the front, returning to the pilasters; frieze; cornice; roof
  const ex0 = cx0 - 0.3, ex1 = cx1 + 0.3, zF = cz - 0.25;
  boxMM(c.b, k.M.paint, STONE.shadowed, ex0 + 0.02, ex1 - 0.02, ABACUS, ABACUS + 0.1, zF + 0.02, cz + 0.25, o); // lower fascia
  boxMM(c.b, k.M.paint, STONE.dressed, ex0, ex1, ABACUS + 0.1, ABACUS + 0.22, zF, cz + 0.25, o); // upper fascia
  for (const x of [cx0, cx1]) {
    boxMM(c.b, k.M.paint, STONE.shadowed, x - 0.23, x + 0.23, ABACUS, ABACUS + 0.1, cz + 0.25, bay, o); // returns: beam over column → pilaster
    boxMM(c.b, k.M.paint, STONE.dressed, x - 0.25, x + 0.25, ABACUS + 0.1, ABACUS + 0.22, cz + 0.25, bay, o);
  }
  const FR = ABACUS + 0.22, fz = zF + 0.04;
  boxMM(c.b, k.M.paint, STONE.field, ex0 + 0.04, ex1 - 0.04, FR, FR + 0.2, fz, bay + 0.01, oj); // frieze (recessed 4 cm)
  // the soffit closes the canopy over the landing between the beams (no view up into an empty box)
  boxMM(c.b, k.M.paint, STONE.shadowed, cx0 + 0.25, cx1 - 0.25, ABACUS + 0.1, ABACUS + 0.12, cz + 0.25, bay, o);
  const top = corniceRun(c, ex0 + 0.04, ex1 - 0.04, fz, bay + 0.01, FR + 0.2);
  boxMM(c.b, k.M.slate, STONE.lead, ex0 - 0.08, ex1 + 0.08, top, top + 0.07, fz - 0.12, bay + 0.01, { ...o, uv: 1 }); // lead roof
  boxMM(c.b, k.M.slate, STONE.lead, ex0 - 0.08, ex1 + 0.08, top + 0.07, top + 0.22, bay - 0.05, bay + 0.01, { ...o, uv: 1 }); // flashing up the bay
  rod(c.b, k.M.slate, STONE.lead, (ex0 + ex1) / 2, top + 0.07, fz - 0.115, 0.028, 0.028, ex1 - ex0 + 0.16, 8, { ...o, rz: Math.PI / 2 }); // lead roll along the front edge (centred, lying)

  // ---- doorway: a dressed stone surround on the bay face (jambs on plinth blocks, the canopy as its head) and
  // reveals lined in dressed stone through the bay depth. The opening (1.9 m in the bay, 1.7 m in the wall) is kept.
  const dx0 = s.x - 0.95, dx1 = s.x + 0.95, DH = gf + 2.7;
  for (const [a, b2] of [[dx0 - 0.2, dx0], [dx1, dx1 + 0.2]] as const) {
    boxMM(c.b, k.M.paint, STONE.dressed, a, b2, gf + 0.3, DH, bay - 0.06, bay + 0.01, oj); // jamb
    boxMM(c.b, stone, STONE.baseTop, a - 0.02, b2 + 0.02, gf, gf + 0.3, bay - 0.09, bay + 0.01, { ...oj, uv: 0.8 }); // jamb plinth
  }
  boxMM(c.b, k.M.paint, STONE.dressed, dx0 - 0.2, dx1 + 0.2, DH, DH + 0.14, bay - 0.06, bay + 0.01, oj); // lintel: the surround's head
  for (const [a, b2] of [[dx0, dx0 + 0.03], [dx1 - 0.03, dx1]] as const) boxMM(c.b, k.M.paint, STONE.shadowed, a, b2, gf, DH, bay + 0.01, Z(79.99), o); // reveal linings
  boxMM(c.b, k.M.paint, STONE.shadowed, dx0, dx1, DH, DH + 0.02, bay + 0.01, Z(79.99), o); // soffit of the reveal under the lintel
}

/**
 * The projecting entrance bay's own base and floor-level band: a plinth course with a weathered top either side of the
 * portico (it stops at the steps, as the main plinth stops at doors), and a string course across the bay front and its
 * returns at the first floor (it carries the main string course round the projecting bay).
 */
export function entranceBay(c: Ctx, x0: number, x1: number, bayZ: number, wallZ: number, plinthGap: [number, number], uf: number) {
  const k = c.k, stone = EXTERIOR_STUDY ? exteriorMats().dressed : k.M.stone, oj = { chunk: c.chunk, jitter: 0.015 };
  for (const [a, b2] of [[x0 - 0.1, plinthGap[0]], [plinthGap[1], x1 + 0.1]] as const) {
    boxMM(c.b, stone, STONE.base, a, b2, -0.1, 0.62, bayZ - 0.1, wallZ - 0.05, { ...oj, uv: 2 });
    boxMM(c.b, k.M.paint, STONE.baseTop, a - 0.03, b2 + 0.03, 0.62, 0.7, bayZ - 0.14, wallZ - 0.05, oj); // weathered top
  }
  // at the main string course's height (UF − 0.12 … UF + 0.08), so the band reads as one line running round the bay;
  // behind the portico it passes inside the canopy, which sits against it
  boxMM(c.b, k.M.paint, STONE.dressed, x0 - 0.08, x1 + 0.08, uf - 0.12, uf + 0.04, bayZ - 0.08, wallZ - 0.05, oj); // band
  boxMM(c.b, k.M.paint, '#f3eada', x0 - 0.11, x1 + 0.11, uf + 0.04, uf + 0.08, bayZ - 0.11, wallZ - 0.05, oj); // weathering / drip
}
