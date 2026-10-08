// DEV-04A path-junction contract (pure, unit-tested). Different route / ground systems may meet, but every patch of
// ground has ONE owner: a drawn path ribbon never runs on top of a hard surface (gravel court, terrace, landing, tee
// mat, viewpoint bay) or on top of a path that ranks above it. Ribbons are clipped where they enter an owner, their end
// cap is cut flush to the owner's edge (no triangles left over, no hard square end standing proud), and they widen a
// little into a mouth where they meet it, so the junction reads as authored instead of as two overlapping footprints.
//
// The same function feeds the renderer (estate.ts buildPaths) and the tests, so what is checked is what is drawn.
import { chaikin, distToPolyline, inRect, sstep, type P2 } from './geom2d';
import { FOREST_PATHS } from './terrain';
import { ROUTE_LINES } from './footprints';
import {
  DRIVEWAY, ARRIVAL_GRAVEL, TERRACE, BBQ, OUTDOOR_DINING, MUSIC_BONG, BALLOON_NOOK, WELLNESS, LAKE_VIEW, COTTAGE_TERRACE, COTTAGE_LANDING, GOLF_MAT, type Rect,
} from './layout';

export type Owned = (x: number, z: number) => boolean;
/** One cross-section of a ribbon: centre, left and right edge points, arc length, mouth weight (0..1). */
export interface Row { x: number; z: number; lx: number; lz: number; rx: number; rz: number; d: number; mouth: number }
export interface Run { rows: Row[]; startOwned: boolean; endOwned: boolean }

const STEP = 0.5;
function densify(pts: readonly P2[], step = STEP): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let q = 0; q < n; q++) out.push([ax + ((bx - ax) * q) / n, az + ((bz - az) * q) / n]);
  }
  out.push([pts[pts.length - 1][0], pts[pts.length - 1][1]]);
  return out;
}
/** Boundary point between a (not owned) and b (owned), by bisection. */
function crossing(a: P2, b: P2, owned: Owned): [number, number] {
  let lo: [number, number] = [a[0], a[1]], hi: [number, number] = [b[0], b[1]];
  for (let i = 0; i < 24; i++) {
    const m: [number, number] = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2];
    if (owned(m[0], m[1])) hi = m; else lo = m;
  }
  return lo;
}

/**
 * The parts of a line outside every owner. Each part ends exactly on the owner's edge where it was cut; a free line
 * end that stops short of an owner (≤ `snap` m ahead) is extended to meet it, so paths meet instead of leaving a gap.
 */
export interface Part { pts: [number, number][]; s0: boolean; s1: boolean; /** arc length of pts[0] along the original line */ d0: number }
export function clipLine(pts: readonly P2[], owned: Owned, snap = 1.2): Part[] {
  const dense = densify(pts);
  const out: Part[] = [];
  let cur: [number, number][] | null = null, curS0 = false, curD0 = 0, acc = 0;
  for (let i = 0; i < dense.length; i++) {
    const p = dense[i], inside = owned(p[0], p[1]);
    if (i > 0) acc += Math.hypot(p[0] - dense[i - 1][0], p[1] - dense[i - 1][1]);
    if (!inside) {
      if (!cur) {
        const c0 = i > 0 ? crossing(p, dense[i - 1], owned) : p;
        cur = i > 0 ? [c0, p] : [p]; curS0 = i > 0; curD0 = acc - Math.hypot(p[0] - c0[0], p[1] - c0[1]);
      } else cur.push(p);
    } else if (cur) {
      cur.push(crossing(dense[i - 1], p, owned));
      out.push({ pts: cur, s0: curS0, s1: true, d0: curD0 });
      cur = null;
    }
  }
  if (cur) out.push({ pts: cur, s0: curS0, s1: false, d0: curD0 });
  // snap free ends forward onto a nearby owner
  for (const part of out) {
    for (const end of [0, 1] as const) {
      if (end === 0 ? part.s0 : part.s1) continue;
      const p = end === 0 ? part.pts[0] : part.pts[part.pts.length - 1], q = end === 0 ? part.pts[1] : part.pts[part.pts.length - 2];
      if (!q) continue;
      const len = Math.hypot(p[0] - q[0], p[1] - q[1]) || 1, tx = (p[0] - q[0]) / len, tz = (p[1] - q[1]) / len;
      for (let s = 0.1; s <= snap + 1e-6; s += 0.1) {
        const x = p[0] + tx * s, z = p[1] + tz * s;
        if (!owned(x, z)) continue;
        const hit = crossing([p[0] + tx * (s - 0.1), p[1] + tz * (s - 0.1)], [x, z], owned);
        if (end === 0) { part.pts.unshift(hit); part.s0 = true; part.d0 -= Math.hypot(hit[0] - p[0], hit[1] - p[1]); } else { part.pts.push(hit); part.s1 = true; }
        break;
      }
    }
  }
  // render density: clipping works on a 0.5 m sampling, but a ribbon only needs ~1 m rows away from its ends (as the
  // old drape had); within 2 m of an end the 0.5 m rows stay so the mouth and its flush cap keep their shape
  for (const part of out) {
    const P = part.pts, keep: [number, number][] = [], L = P.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - P[i - 1][0], q[1] - P[i - 1][1]) : 0), 0);
    let d = 0, last = -Infinity;
    for (let i = 0; i < P.length; i++) {
      if (i) d += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      if (i === 0 || i === P.length - 1 || d < 2 || L - d < 2 || d - last >= 0.95) { keep.push(P[i]); last = d; }
    }
    part.pts = keep;
  }
  return out.filter((p) => p.pts.length > 1 && Math.hypot(p.pts[0][0] - p.pts[p.pts.length - 1][0], p.pts[0][1] - p.pts[p.pts.length - 1][1]) > 0.3);
}

/** Slide an edge point along direction (tx, tz) (pointing INTO the owner) until it lies on the owner's edge. */
function slide(x: number, z: number, tx: number, tz: number, owned: Owned, max = 1.6): [number, number] {
  if (owned(x, z)) {
    const bx = x - tx * max, bz = z - tz * max;
    return owned(bx, bz) ? [x, z] : crossing([bx, bz], [x, z], owned);
  }
  const fx = x + tx * max, fz = z + tz * max;
  return owned(fx, fz) ? crossing([x, z], [fx, fz], owned) : [x, z];
}

export interface RibbonOpts { width: number; widthAt?: (x: number, z: number, d: number) => number; flare?: number; flareLen?: number; taper?: boolean }
/**
 * Cross-sections of one clipped part; ends that meet an owner widen into a mouth and are cut flush to its edge; a free
 * end (meeting nothing) tapers off over its last metre instead of stopping as a square slab.
 */
export function ribbonRows(part: { pts: [number, number][]; s0: boolean; s1: boolean; d0?: number }, owned: Owned, o: RibbonOpts): Run {
  const pts = part.pts, flare = o.flare ?? 0.3, fl = o.flareLen ?? 1.5;
  const total = pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  const rows: Row[] = [];
  let d = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    if (i > 0) d += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    let tx = b[0] - a[0], tz = b[1] - a[1];
    const len = Math.hypot(tx, tz) || 1;
    tx /= len; tz /= len;
    const mouth = Math.max(part.s0 ? 1 - sstep(d, 0, fl) : 0, part.s1 ? sstep(d, total - fl, total) : 0);
    const tip = o.taper === false ? 1 : Math.min(part.s0 ? 1 : 0.4 + 0.6 * sstep(d, 0, 1.0), part.s1 ? 1 : 0.4 + 0.6 * sstep(total - d, 0, 1.0));
    const k = (1 + flare * mouth) * tip, dd = d + (part.d0 ?? 0);
    const wl = (o.widthAt ? o.widthAt(p[0], p[1], dd - 7.3) : o.width) * k / 2, wr = (o.widthAt ? o.widthAt(p[0], p[1], dd + 7.3) : o.width) * k / 2;
    let lx = p[0] - tz * -1 * wl, lz = p[1] + tx * -1 * wl, rx = p[0] - tz * wr, rz = p[1] + tx * wr;
    // flush cap: at an owned end both edge points move along the path onto the owner's boundary
    if ((i === 0 && part.s0) || (i === pts.length - 1 && part.s1)) {
      const sx = i === 0 ? -tx : tx, sz = i === 0 ? -tz : tz;
      [lx, lz] = slide(lx, lz, sx, sz, owned);
      [rx, rz] = slide(rx, rz, sx, sz, owned);
    }
    rows.push({ x: p[0], z: p[1], lx, lz, rx, rz, d: dd, mouth });
  }
  return { rows, startOwned: part.s0, endOwned: part.s1 };
}

// ------------------------------------------------------------------------------------------------ the estate network
const rectOwner = (rs: readonly Rect[]): Owned => (x, z) => rs.some((r) => inRect(x, z, r));
const corridor = (pts: readonly P2[], width: number): Owned => {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const m = width / 2;
  return (x, z) => x > x0 - m && x < x1 + m && z > z0 - m && z < z1 + m && distToPolyline(x, z, pts) < m;
};
const anyOf = (fs: Owned[]): Owned => (x, z) => fs.some((f) => f(x, z));

/** Hard surfaces that own their ground (they are drawn by their own builders). */
export const GROUND_OWNERS: { id: string; r: Rect }[] = [
  ...ARRIVAL_GRAVEL.map((r, i) => ({ id: `arrival${i}`, r })),
  { id: 'TERRACE', r: TERRACE }, { id: 'BBQ', r: BBQ }, { id: 'OUTDOOR_DINING', r: OUTDOOR_DINING }, { id: 'MUSIC_BONG', r: MUSIC_BONG },
  { id: 'BALLOON_NOOK', r: BALLOON_NOOK }, { id: 'WELLNESS', r: WELLNESS }, { id: 'LAKE_VIEW', r: LAKE_VIEW },
  { id: 'COTTAGE_TERRACE', r: COTTAGE_TERRACE }, { id: 'COTTAGE_LANDING', r: COTTAGE_LANDING }, { id: 'GOLF_MAT', r: GOLF_MAT },
];
/** Route priority: a route ranked lower is clipped by every line above it (and by the driveway and forest paths). */
export const ROUTE_ORDER = ['terraceLanterns', 'wellnessPath', 'bbqApproach', 'cottageOut', 'cottageReturn', 'lakeViewRoute', 'eastGardenLoop', 'wickermanLoop', 'wickermanSide', 'golfSpur'];

export interface NetLine { id: string; kind: 'drive' | 'forest' | 'route'; width: number; runs: Run[] }
/**
 * Every drawn path of the estate, clipped by ownership: the driveway owns its corridor; forest paths stop at the
 * driveway and the arrival gravel; routes stop at every hard surface, the driveway, the forest paths and the routes
 * ranked above them. `forestWidthAt` is the BOSLUST zone's irregular edge (the renderer passes it; tests use none).
 */
export function pathNetwork(forestWidthAt?: (x: number, z: number, d: number) => number): NetLine[] {
  const hard = rectOwner(GROUND_OWNERS.map((o) => o.r));
  const drive = chaikin(DRIVEWAY, 2);
  const out: NetLine[] = [{ id: 'driveway', kind: 'drive', width: 4.2, runs: [ribbonRows({ pts: drive, s0: false, s1: false }, () => false, { width: 4.2, taper: false })] }];
  const driveOwner = corridor(drive, 4.2);
  const forestOwners: Owned[] = [];
  FOREST_PATHS.forEach((p, i) => {
    const owned = anyOf([driveOwner, rectOwner(ARRIVAL_GRAVEL)]);
    out.push({ id: `forest${i}`, kind: 'forest', width: 1.9, runs: clipLine(p, owned).map((part) => ribbonRows(part, owned, { width: 1.9, widthAt: forestWidthAt, taper: false })) });
    forestOwners.push(corridor(p, 1.9));
  });
  const above: Owned[] = [hard, driveOwner, ...forestOwners];
  const routes = [...ROUTE_LINES].sort((a, b) => ROUTE_ORDER.indexOf(a.id) - ROUTE_ORDER.indexOf(b.id));
  for (const r of routes) {
    const owned = anyOf([...above]);
    out.push({ id: r.id, kind: 'route', width: r.width, runs: clipLine(r.pts, owned).map((part) => ribbonRows(part, owned, { width: r.width })) });
    above.push(corridor(r.pts, r.width));
  }
  return out;
}

/** Quads of a run (left half and right half per segment), for coverage checks. */
export function runQuads(run: Run): [number, number][][] {
  const q: [number, number][][] = [];
  for (let i = 0; i < run.rows.length - 1; i++) {
    const a = run.rows[i], b = run.rows[i + 1];
    q.push([[a.lx, a.lz], [a.x, a.z], [b.x, b.z], [b.lx, b.lz]], [[a.x, a.z], [a.rx, a.rz], [b.rx, b.rz], [b.x, b.z]]);
  }
  return q;
}
