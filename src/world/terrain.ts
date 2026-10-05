// Terrain heightfield: gentle undulation in the forest, the rounded BOSLUST hill with a stone-walled cut in
// front of its door, everything else flat (garden lawn, paths, clearings, building pads).
// One 2 m grid drives BOTH the rendered ground mesh and collision (same triangle split), so the
// player's feet always match what is drawn. A small hand-made mound over the BOSLUST entrance replaces
// the grid there (see `entranceMound`).
import { ESTATE, HILL, HILL_CUT, FOREST_PATH_KEYS, DRIVEWAY, CLEARINGS } from './layout';

export const TCELL = 2;
const NX = ESTATE.w / TCELL, NZ = ESTATE.d / TCELL;

function chaikin(pts: [number, number][], iters = 2): [number, number][] {
  let p = pts;
  for (let k = 0; k < iters; k++) {
    const out: [number, number][] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, az] = p[i], [bx, bz] = p[i + 1];
      out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}
export const FOREST_PATHS = FOREST_PATH_KEYS.map((p) => chaikin(p));

function distToPolyline(x: number, z: number, pts: readonly (readonly [number, number])[]) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return best;
}
const sstep = (x: number, a: number, b: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Hill height (no cut). */
export function hillHeight(x: number, z: number) {
  const r = Math.hypot(x - HILL.x, z - HILL.z);
  if (r >= HILL.r) return 0;
  return HILL.h * Math.pow(1 - (r / HILL.r) ** 2, 1.2);
}
const inCut = (x: number, z: number) => x >= HILL_CUT.x0 && x <= HILL_CUT.x1 && z >= HILL_CUT.z0 && z <= HILL_CUT.z1;

/** Analytic terrain (used to fill the grid). */
export function rawHeight(x: number, z: number): number {
  if (inCut(x, z)) return 0;
  // forest undulation, flattened along paths, clearings, the driveway and the walls
  let u = 0;
  const forest = 1 - sstep(z, ESTATE.forestEdge - 10, ESTATE.forestEdge - 2);
  if (forest > 0) {
    const n = Math.sin(x * 0.11 + 1.3) * Math.sin(z * 0.13 + 0.4) + 0.5 * Math.sin(x * 0.23 + z * 0.17 + 2.1) + 0.3 * Math.sin(x * 0.05 - z * 0.07);
    u = 0.42 * (1 + n / 1.8) * forest;
    let flat = 1;
    for (const p of FOREST_PATHS) flat = Math.min(flat, sstep(distToPolyline(x, z, p), 1.4, 4.2));
    for (const c of CLEARINGS) flat = Math.min(flat, sstep(Math.hypot(x - c.x, z - c.z) - c.r, -1, 2.5));
    flat = Math.min(flat, sstep(distToPolyline(x, z, DRIVEWAY), 3, 6.5));
    flat = Math.min(flat, sstep(z, 2, 5), sstep(x, 1.5, 4), sstep(ESTATE.w - x, 1.5, 4));
    flat = Math.min(flat, sstep(Math.abs(x - 162), 1, 3.5)); // old side-gate wall line
    u *= flat;
  }
  return u + hillHeight(x, z);
}

let GRID: Float32Array | null = null;
function grid() {
  if (GRID) return GRID;
  GRID = new Float32Array((NX + 1) * (NZ + 1));
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) GRID[j * (NX + 1) + i] = rawHeight(i * TCELL, j * TCELL);
  return GRID;
}
export const gridAt = (i: number, j: number) => grid()[Math.min(NZ, Math.max(0, j)) * (NX + 1) + Math.min(NX, Math.max(0, i))];

/** Height of the rendered grid surface (triangle split 00-10-11 / 00-11-01, like the ground mesh). */
export function gridHeight(x: number, z: number): number {
  const gx = Math.min(NX - 1e-6, Math.max(0, x / TCELL)), gz = Math.min(NZ - 1e-6, Math.max(0, z / TCELL));
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

export const TERRAIN_DIMS = { NX, NZ };
