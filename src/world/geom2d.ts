// Pure plan-space (X east, Z north) polyline helpers shared by the terrain, the placement keepouts and the tests.
export type P2 = readonly [number, number];

/** Chaikin corner cutting (keeps both end points). */
export function chaikin(pts: readonly P2[], iters = 2): [number, number][] {
  let p = pts.map((q) => [q[0], q[1]] as [number, number]);
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

export function polylineLength(pts: readonly P2[]) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
}

/** Nearest point on a polyline: distance to it and the arc length `s` at which it lies. */
export function project(x: number, z: number, pts: readonly P2[]): { d: number; s: number } {
  let best = Infinity, bestS = 0, acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az, len2 = dx * dx + dz * dz, len = Math.sqrt(len2);
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2)) : 0;
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    if (d < best) { best = d; bestS = acc + t * len; }
    acc += len;
  }
  return { d: best, s: bestS };
}

export const distToPolyline = (x: number, z: number, pts: readonly P2[]) => project(x, z, pts).d;

/** Point at arc length s along a polyline. */
export function pointAt(pts: readonly P2[], s: number): [number, number] {
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    if (acc + len >= s || i === pts.length - 2) { const t = len ? Math.max(0, Math.min(1, (s - acc) / len)) : 0; return [ax + (bx - ax) * t, az + (bz - az) * t]; }
    acc += len;
  }
  return [pts[0][0], pts[0][1]];
}

/** Piecewise-linear interpolation of (xs, ys) at x (clamped). */
export function interp(xs: readonly number[], ys: readonly number[], x: number) {
  if (x <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) if (x <= xs[i]) { const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1] || 1); return ys[i - 1] + (ys[i] - ys[i - 1]) * t; }
  return ys[ys.length - 1];
}

export const sstep = (x: number, a: number, b: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const inRect = (x: number, z: number, r: { x0: number; x1: number; z0: number; z1: number }, m = 0) => x >= r.x0 - m && x <= r.x1 + m && z >= r.z0 - m && z <= r.z1 + m;
export const rectDist = (x: number, z: number, r: { x0: number; x1: number; z0: number; z1: number }) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));
