// Terrain heightfield (DEV-02, LEVEL_PLAN v0.2 §2): authoring height fields — the woodland undulation in the south,
// the BOSLUST hill, the north and east ridges and a west shoulder under the cottage plateau — overridden in ONE explicit
// priority order: fields → flat pads (house, lawns, arrival, plateau, clearing) → lake basin → route profiles → the
// hill cut. One 2 m grid drives BOTH the rendered ground mesh and collision (same triangle split), so the player's feet
// always match what is drawn. The grid extends TMARGIN beyond the fence so ridges continue visually outside the estate.
// A small hand-made mound over the BOSLUST entrance replaces the grid there (see `entranceMound`).
import { ESTATE, HILL, HILL_CUT, FOREST_PATH_KEYS, DRIVEWAY, CLEARINGS, RIDGES, PADS, LAKE, lakeQ, ROUTES, WICKERMAN, WICKERMAN_LOOP, WICKERMAN_HEIGHTS, type Route } from './layout';
import { chaikin, distToPolyline, project, polylineLength, pointAt, interp, sstep, rectDist, inRect, type P2 } from './geom2d';

export const TCELL = 2;
/** The ground grid reaches this far beyond the estate edge (render + height lookups; movement stays inside the fence). */
export const TMARGIN = 24;
const GX0 = -TMARGIN, GZ0 = -TMARGIN;
const NX = (ESTATE.w + 2 * TMARGIN) / TCELL, NZ = (ESTATE.d + 2 * TMARGIN) / TCELL;

export const FOREST_PATHS = FOREST_PATH_KEYS.map((p) => chaikin(p));

/** Hill height (no cut). */
export function hillHeight(x: number, z: number) {
  const r = Math.hypot(x - HILL.x, z - HILL.z);
  if (r >= HILL.r) return 0;
  return HILL.h * Math.pow(1 - (r / HILL.r) ** 2, 1.2);
}
const inCut = (x: number, z: number) => x >= HILL_CUT.x0 && x <= HILL_CUT.x1 && z >= HILL_CUT.z0 && z <= HILL_CUT.z1;

/** Elliptic ridge field: peak at the centre, zero at the ellipse rim, smooth shoulders. */
export function ridgeHeight(x: number, z: number) {
  let h = 0;
  for (const r of RIDGES) {
    const q = ((x - r.x) / r.rx) ** 2 + ((z - r.z) / r.rz) ** 2;
    if (q < 1) h = Math.max(h, r.peak * Math.pow(1 - q, 1.5));
  }
  return h;
}

/**
 * Profiled routes. The authored profile is given along the authored (raw) polyline; the walked line is the smoothed one,
 * which is shorter at every corner. So the profile is re-sampled along the smoothed line (each sample mapped to its raw
 * arc length) and replaced by its upper envelope with slope MAX_GRADE, which keeps the walked grade ≤ MAX_GRADE.
 */
export const MAX_GRADE = 0.07; // design limit 8 %; the 2 m grid interpolation needs the margin
interface ProfiledRoute { id: string; pts: [number, number][]; d: number[]; h: number[]; hw: number }
const profiled = (id: string, raw: [number, number][], pd: number[], ph: number[], width: number): ProfiledRoute => {
  const pts = chaikin(raw, 2);
  const step = 0.5, L = polylineLength(pts);
  const d: number[] = [], h: number[] = [];
  for (let s = 0; s <= L + 1e-6; s += step) {
    const [x, z] = pointAt(pts, s);
    d.push(s);
    h.push(interp(pd, ph, project(x, z, raw).s));
  }
  // upper envelope: never lower the authored height (a climb starts earlier, a descent ends later), so the walked
  // line reaches a raised platform at its edge instead of meeting it with a step
  for (let i = 1; i < h.length; i++) h[i] = Math.max(h[i], h[i - 1] - MAX_GRADE * step);
  for (let i = h.length - 2; i >= 0; i--) h[i] = Math.max(h[i], h[i + 1] - MAX_GRADE * step);
  return { id, pts, d, h, hw: width / 2 + 2.0 }; // full weight over every grid cell the walked line crosses
};
const vertexDistances = (pts: readonly P2[]) => { const out = [0]; for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return out; };
export const PROFILED_ROUTES: ProfiledRoute[] = [
  ...ROUTES.filter((r): r is Route & { profile: NonNullable<Route['profile']> } => !!r.profile).map((r) => profiled(r.id, r.pts, r.profile.d, r.profile.h, r.width)),
  profiled('wickermanLoop', WICKERMAN_LOOP, vertexDistances(WICKERMAN_LOOP), WICKERMAN_HEIGHTS, 1.5),
];
/** Walking height of a profiled route at arc length `s` of its smoothed line. */
export const profileAt = (r: ProfiledRoute, s: number) => interp(r.d, r.h, s);
const ROUTE_FALLOFF = 9;

/** Woodland undulation in the south (unchanged recipe), flattened along paths, clearings, the driveway and walls. */
function southUndulation(x: number, z: number) {
  const forest = 1 - sstep(z, ESTATE.forestEdge - 10, ESTATE.forestEdge - 2);
  if (forest <= 0) return 0;
  const n = Math.sin(x * 0.11 + 1.3) * Math.sin(z * 0.13 + 0.4) + 0.5 * Math.sin(x * 0.23 + z * 0.17 + 2.1) + 0.3 * Math.sin(x * 0.05 - z * 0.07);
  let u = 0.42 * (1 + n / 1.8) * forest;
  let flat = 1;
  for (const p of FOREST_PATHS) flat = Math.min(flat, sstep(distToPolyline(x, z, p), 1.4, 4.2));
  for (const c of CLEARINGS) flat = Math.min(flat, sstep(Math.hypot(x - c.x, z - c.z) - c.r, -1, 2.5));
  flat = Math.min(flat, sstep(distToPolyline(x, z, DRIVEWAY), 3, 6.5));
  flat = Math.min(flat, sstep(z, 2, 5), sstep(x, 1.5, 4), sstep(ESTATE.w - x, 1.5, 4));
  flat = Math.min(flat, sstep(Math.abs(x - 162), 1, 3.5)); // old side-gate wall line
  return u * flat;
}

/** Analytic terrain (used to fill the grid). Priority: fields → pads → lake → routes → cut. */
export function rawHeight(x: number, z: number): number {
  if (inCut(x, z)) return 0;
  // 1. authoring fields (faded out towards the outer edge of the rendered margin)
  const outside = Math.hypot(Math.max(0, -x, x - ESTATE.w), Math.max(0, -z, z - ESTATE.d));
  let h = (southUndulation(x, z) + hillHeight(x, z) + ridgeHeight(x, z)) * (1 - sstep(outside, 3, TMARGIN - 3));
  // 2. flat pads (level platforms with a soft margin) and the wickerman clearing
  for (const p of PADS) { const w = 1 - sstep(rectDist(x, z, p), 0, p.m); if (w > 0) h += (p.y - h) * w; }
  { const w = 1 - sstep(Math.hypot(x - WICKERMAN.x, z - WICKERMAN.z) - WICKERMAN.r, 0, 6); if (w > 0) h += (WICKERMAN.y - h) * w; }
  // 3. lake basin: below the water inside the ellipse, a shore band blends back to the land (never inside the plateau)
  const q = lakeQ(x, z);
  // the waterline sits on the rim (where the collider stops the player), the bed falls away steeply inside it
  const edge = LAKE.water - 0.06;
  if (q < 1) h = edge + (LAKE.bottom - edge) * sstep(1 - q, 0, 0.3);
  else if (q < 1.3 && !PADS.some((p) => inRect(x, z, p))) h = edge + (h - edge) * sstep(q, 1, 1.3);
  // 4. route profiles: the authored walking height wins in a corridor around each profiled route
  // the nearest (strongest) route wins, so two routes meeting at the plateau never pull each other; raised pads keep
  // their level and the water keeps its bed (no route enters the lake, unit-tested)
  if (PADS.some((p) => p.y !== 0 && inRect(x, z, p))) return h;
  const nearWater = sstep(q, 1.05, 1.35);
  let bestW = 0, bestH = 0;
  for (const r of PROFILED_ROUTES) {
    const pr = project(x, z, r.pts);
    if (pr.d > r.hw + ROUTE_FALLOFF) continue;
    const w = (1 - sstep(pr.d, r.hw, r.hw + ROUTE_FALLOFF)) * nearWater;
    if (w > bestW) { bestW = w; bestH = profileAt(r, pr.s); }
  }
  return h + (bestH - h) * bestW;
}

let GRID: Float32Array | null = null;
function grid() {
  if (GRID) return GRID;
  GRID = new Float32Array((NX + 1) * (NZ + 1));
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) GRID[j * (NX + 1) + i] = rawHeight(GX0 + i * TCELL, GZ0 + j * TCELL);
  return GRID;
}
export const gridAt = (i: number, j: number) => grid()[Math.min(NZ, Math.max(0, j)) * (NX + 1) + Math.min(NX, Math.max(0, i))];

/** Height of the rendered grid surface (triangle split 00-10-11 / 00-11-01, like the ground mesh). */
export function gridHeight(x: number, z: number): number {
  const gx = Math.min(NX - 1e-6, Math.max(0, (x - GX0) / TCELL)), gz = Math.min(NZ - 1e-6, Math.max(0, (z - GZ0) / TCELL));
  const i = Math.floor(gx), j = Math.floor(gz), u = gx - i, v = gz - j;
  const h00 = gridAt(i, j), h10 = gridAt(i + 1, j), h01 = gridAt(i, j + 1), h11 = gridAt(i + 1, j + 1);
  return u >= v ? h00 + u * (h10 - h00) + v * (h11 - h10) : h00 + v * (h01 - h00) + u * (h11 - h01);
}

/** Ground cells that are not drawn by the grid mesh (building footprints, the entrance mound). */
export const HOLES = [
  { x0: 72, x1: 108, z0: 80, z1: 110 }, // manor main block (own floors + basement stairwell)
  { x0: 108, x1: 116, z0: 92, z1: 110 }, // service wing
  { x0: 116, x1: 130, z0: 94, z1: 112 }, // conservatory (pool basin)
  { x0: 60, x1: 66, z0: 18, z1: 24 }, // BOSLUST entrance mound (custom mesh)
];
export const inHole = (x: number, z: number) => HOLES.some((h) => x > h.x0 && x < h.x1 && z > h.z0 && z < h.z1);

/** The BOSLUST door hut: earth-covered roof that the mound must cover. */
export const HUT = { x0: 60.4, x1: 65.6, z0: 18.2, z1: 22.6, roof: 2.95 };
/** Mound over the entrance: the grid surface, raised to cover the hut roof (matches the grid at the hole edge). */
export function entranceMound(x: number, z: number) {
  const g = gridHeight(x, z);
  if (x < HUT.x0 || x > HUT.x1 || z < HUT.z0 - 0.25 || z > HUT.z1) return g;
  // gentle crown over the hut so its timber roof reads as earth-covered from above
  const cx = (x - (HUT.x0 + HUT.x1) / 2) / ((HUT.x1 - HUT.x0) / 2);
  return Math.max(g, HUT.roof + 0.3 * (1 - cx * cx) + 0.12);
}

/** Walkable ground height everywhere (collision + placement). */
export function terrainHeight(x: number, z: number): number {
  if (x > 60 && x < 66 && z > 18 && z < 24) return entranceMound(x, z);
  return gridHeight(x, z);
}

/** Collision ground: buildings with their own floors (and a stairwell into the basement) have NO terrain. */
export function walkHeight(x: number, z: number): number {
  for (let i = 0; i < 3; i++) { const h = HOLES[i]; if (x > h.x0 && x < h.x1 && z > h.z0 && z < h.z1) return -Infinity; }
  return terrainHeight(x, z);
}

/** Grid size and origin: vertex (i, j) lies at plan (X0 + i·TCELL, Z0 + j·TCELL). */
export const TERRAIN_DIMS = { NX, NZ, X0: GX0, Z0: GZ0 };
