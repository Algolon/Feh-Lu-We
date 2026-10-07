// Architecture helpers: walls with real door openings (geometry + colliders), decorative windows,
// floors/ceilings, stairs with a hidden smooth collision ramp, and roofs.
import * as THREE from 'three';
import { Batcher, box, boxMM, geo, getKit, gableGeo, hipRoofGeo, type Kit } from './kit';
import type { CollisionWorld } from '../player/collision';

export interface Ctx {
  b: Batcher;
  col: CollisionWorld;
  k: Kit;
  chunk: string;
}

export function makeCtx(col: CollisionWorld, chunk: string, b = new Batcher()): Ctx {
  return { b, col, k: getKit(), chunk };
}

export interface Opening { at: number; w: number; h?: number }
export interface Win { at: number; w?: number; h?: number; sill?: number; side?: 1 | -1 | 0; inside?: boolean }

export interface WallOpts {
  mat?: THREE.Material;
  color?: THREE.ColorRepresentation;
  openings?: Opening[];
  windows?: Win[];
  t?: number;
  collide?: boolean;
  /** Which face is the exterior (+1 = +z/+x face). Windows glow amber outside, daylight inside. */
  exterior?: 1 | -1 | 0;
  uv?: number;
  skin?: { mat: THREE.Material; color: THREE.ColorRepresentation }; // interior finish on the non-exterior face
}

/** Axis-aligned wall. axis 'x': runs along x from a0..a1 at fixed z = f. axis 'z': along z at fixed x = f. */
export function wall(c: Ctx, axis: 'x' | 'z', f: number, a0: number, a1: number, y0: number, y1: number, o: WallOpts = {}) {
  const t = o.t ?? 0.18;
  const mat = o.mat ?? c.k.M.plaster;
  const color = o.color ?? '#f1e8d6';
  const ops = [...(o.openings ?? [])].sort((p, q) => p.at - q.at);
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
  const piece = (s0: number, s1: number, ya: number, yb: number) => {
    if (s1 - s0 < 0.005 || yb - ya < 0.005) return;
    if (axis === 'x') {
      boxMM(c.b, mat, color, s0, s1, ya, yb, f - t / 2, f + t / 2, { uv: o.uv ?? 2, chunk: c.chunk });
      if (o.collide !== false) c.col.addBox(s0, s1, f - t / 2, f + t / 2, ya, yb, { occludes: true });
    } else {
      boxMM(c.b, mat, color, f - t / 2, f + t / 2, ya, yb, s0, s1, { uv: o.uv ?? 2, chunk: c.chunk });
      if (o.collide !== false) c.col.addBox(f - t / 2, f + t / 2, s0, s1, ya, yb, { occludes: true });
    }
  };
  let cur = lo;
  for (const op of ops) {
    const s = op.at - op.w / 2, e = op.at + op.w / 2;
    piece(cur, s, y0, y1);
    piece(s, e, y0 + (op.h ?? 2.3), y1); // lintel
    // door frame (visual only)
    frame(c, axis, f, s, e, y0, y0 + (op.h ?? 2.3), t);
    cur = e;
  }
  piece(cur, hi, y0, y1);
  if (o.skin) {
    // thin interior finish layer on the inner face (no collider)
    const side = -(o.exterior ?? 1);
    const ff = f + side * (t / 2 + 0.012);
    const sk = { ...o, mat: o.skin.mat, color: o.skin.color, t: 0.02, collide: false, skin: undefined, windows: [], exterior: 0 as const };
    wallNoFrames(c, axis, ff, a0, a1, y0, y1, sk);
  }
  for (const wdef of o.windows ?? []) {
    const ext = o.exterior ?? 0;
    const sides: (1 | -1)[] = wdef.side ? [wdef.side] : ext ? [ext as 1 | -1, (-ext) as 1 | -1] : [1, -1];
    for (const s of sides) {
      const outside = ext !== 0 && s === ext;
      windowAt(c, axis, f + s * (t / 2 + (o.skin && !outside ? 0.03 : 0)), s, wdef.at, y0 + (wdef.sill ?? 0.9), wdef.w ?? 1.1, wdef.h ?? 1.5, outside);
    }
  }
}

function wallNoFrames(c: Ctx, axis: 'x' | 'z', f: number, a0: number, a1: number, y0: number, y1: number, o: WallOpts) {
  const ops = [...(o.openings ?? [])].sort((p, q) => p.at - q.at);
  let cur = Math.min(a0, a1);
  const hi = Math.max(a0, a1);
  const t = o.t ?? 0.02;
  const piece = (s0: number, s1: number, ya: number, yb: number) => {
    if (s1 - s0 < 0.005 || yb - ya < 0.005) return;
    if (axis === 'x') boxMM(c.b, o.mat!, o.color!, s0, s1, ya, yb, f - t / 2, f + t / 2, { uv: 2, chunk: c.chunk, shadow: false });
    else boxMM(c.b, o.mat!, o.color!, f - t / 2, f + t / 2, ya, yb, s0, s1, { uv: 2, chunk: c.chunk, shadow: false });
  };
  for (const op of ops) {
    piece(cur, op.at - op.w / 2, y0, y1);
    piece(op.at - op.w / 2, op.at + op.w / 2, y0 + (op.h ?? 2.3), y1);
    cur = op.at + op.w / 2;
  }
  piece(cur, hi, y0, y1);
}

function frame(c: Ctx, axis: 'x' | 'z', f: number, s: number, e: number, y0: number, y1: number, t: number) {
  const col = '#6b4426', w = 0.09, d = t + 0.06;
  if (axis === 'x') {
    boxMM(c.b, c.k.M.paint, col, s - w, s, y0, y1 + w, f - d / 2, f + d / 2, { chunk: c.chunk });
    boxMM(c.b, c.k.M.paint, col, e, e + w, y0, y1 + w, f - d / 2, f + d / 2, { chunk: c.chunk });
    boxMM(c.b, c.k.M.paint, col, s - w, e + w, y1, y1 + w, f - d / 2, f + d / 2, { chunk: c.chunk });
  } else {
    boxMM(c.b, c.k.M.paint, col, f - d / 2, f + d / 2, y0, y1 + w, s - w, s, { chunk: c.chunk });
    boxMM(c.b, c.k.M.paint, col, f - d / 2, f + d / 2, y0, y1 + w, e, e + w, { chunk: c.chunk });
    boxMM(c.b, c.k.M.paint, col, f - d / 2, f + d / 2, y1, y1 + w, s - w, e + w, { chunk: c.chunk });
  }
}

/** Decorative window on a wall face: frame, glazing (glowing), mullions, sill. */
export function windowAt(c: Ctx, axis: 'x' | 'z', faceF: number, side: 1 | -1, at: number, y: number, w: number, h: number, outside: boolean, style: { frame?: string; glass?: string; arch?: boolean } = {}) {
  const glass = style.glass ?? (outside ? '#ffc96e' : '#bcd2dc');
  const fr = style.frame ?? (outside ? '#f3ead6' : '#7a5232');
  const d = 0.05;
  const off = side * d / 2;
  const B = (a0: number, a1: number, y0: number, y1: number, depth: number, mat: THREE.Material, col: THREE.ColorRepresentation, push = 0) => {
    const ff = faceF + off + side * push;
    if (axis === 'x') boxMM(c.b, mat, col, a0, a1, y0, y1, ff - depth / 2, ff + depth / 2, { chunk: c.chunk, shadow: false });
    else boxMM(c.b, mat, col, ff - depth / 2, ff + depth / 2, y0, y1, a0, a1, { chunk: c.chunk, shadow: false });
  };
  B(at - w / 2, at + w / 2, y, y + h, 0.02, c.k.M.glow, glass);
  const fw = 0.1;
  B(at - w / 2 - fw, at - w / 2, y - fw, y + h + fw, 0.08, c.k.M.paint, fr);
  B(at + w / 2, at + w / 2 + fw, y - fw, y + h + fw, 0.08, c.k.M.paint, fr);
  B(at - w / 2, at + w / 2, y + h, y + h + fw, 0.08, c.k.M.paint, fr);
  B(at - w / 2 - 0.12, at + w / 2 + 0.12, y - fw - 0.06, y - fw + 0.02, 0.16, c.k.M.paint, fr, 0.04); // sill
  B(at - 0.025, at + 0.025, y, y + h, 0.05, c.k.M.paint, outside ? '#3b3026' : '#5a3a22');
  B(at - w / 2, at + w / 2, y + h * 0.62, y + h * 0.62 + 0.04, 0.05, c.k.M.paint, outside ? '#3b3026' : '#5a3a22');
}

/** Floor slab: visible box (top at yTop) + walkable region. */
export function floor(c: Ctx, x0: number, x1: number, z0: number, z1: number, yTop: number, mat: THREE.Material, color: THREE.ColorRepresentation, thick = 0.2, walk = true, uv = 2) {
  boxMM(c.b, mat, color, x0, x1, yTop - thick, yTop, z0, z1, { uv, chunk: c.chunk });
  if (walk) c.col.addFloor(x0, x1, z0, z1, yTop);
}

/** Ceiling (visual only), underside at y. */
export function ceiling(c: Ctx, x0: number, x1: number, z0: number, z1: number, y: number, color: THREE.ColorRepresentation = '#efe4cc', thick = 0.2) {
  boxMM(c.b, c.k.M.plaster, color, x0, x1, y, y + thick, z0, z1, { uv: 3, chunk: c.chunk, shadow: false });
}

/** Straight stairs rising along +z (dir 1) or -z (dir -1) between z0 and z1 (z0 = bottom when dir 1). */
export function stairsZ(c: Ctx, x0: number, x1: number, zBottom: number, zTop: number, yBottom: number, yTop: number, color: THREE.ColorRepresentation = '#7a4f2c', risers?: number) {
  const n = risers ?? Math.max(4, Math.round((yTop - yBottom) / 0.18));
  const run = (zTop - zBottom) / n, rise = (yTop - yBottom) / n;
  for (let i = 0; i < n; i++) {
    const za = zBottom + run * i;
    // solid stepped mass under each tread so the stair looks massive from the side
    boxMM(c.b, c.k.M.wood, color, x0, x1, yBottom, yBottom + rise * (i + 1), za, za + run, { uv: 1.2, chunk: c.chunk });
    boxMM(c.b, c.k.M.paint, '#7a2a30', x0 + 0.25, x1 - 0.25, yBottom + rise * (i + 1), yBottom + rise * (i + 1) + 0.012, za, za + run * 0.92, { chunk: c.chunk, shadow: false }); // runner carpet
    // per-step solid: blocks walking into the stair mass from the side, never from the ramp itself
    c.col.addBox(x0, x1, za, za + run, yBottom, yBottom + rise * (i + 1));
  }
  // smooth hidden ramp (from the nose of the first step to the top) for collision
  c.col.addRamp({ minX: x0, maxX: x1, minZ: Math.min(zBottom, zTop), maxZ: Math.max(zBottom, zTop), axis: 'z', a: zBottom, ya: yBottom, b: zTop, yb: yTop });
}

/** Railing (visual + collider at the given floor height). axis like wall(). */
export function railing(c: Ctx, axis: 'x' | 'z', f: number, a0: number, a1: number, y0: number, color = '#5e3b1f') {
  const h = 1.0;
  if (axis === 'x') {
    boxMM(c.b, c.k.M.wood, color, a0, a1, y0 + h - 0.08, y0 + h, f - 0.05, f + 0.05, { chunk: c.chunk });
    for (let a = a0; a <= a1 + 1e-6; a += 0.3) boxMM(c.b, c.k.M.paint, color, a - 0.025, a + 0.025, y0, y0 + h, f - 0.025, f + 0.025, { chunk: c.chunk, shadow: false });
    c.col.addBox(a0, a1, f - 0.08, f + 0.08, y0, y0 + 1.6);
  } else {
    boxMM(c.b, c.k.M.wood, color, f - 0.05, f + 0.05, y0 + h - 0.08, y0 + h, a0, a1, { chunk: c.chunk });
    for (let a = a0; a <= a1 + 1e-6; a += 0.3) boxMM(c.b, c.k.M.paint, color, f - 0.025, f + 0.025, y0, y0 + h, a - 0.025, a + 0.025, { chunk: c.chunk, shadow: false });
    c.col.addBox(f - 0.08, f + 0.08, a0, a1, y0, y0 + 1.6);
  }
}

/**
 * Railing along the side of a stair flight (axis 'z': at x = f, the flight rising from (a0, y0) to (a1, y1) along z).
 * Visual: sloped handrail + balusters. Collision: one box from the lower floor to above the upper handrail, entirely
 * OUTSIDE the flight (on the side `side`: −1 = towards −x, +1 = towards +x), so walking on the flight is never touched
 * and stepping off its side is impossible at every height.
 */
export function stairRail(c: Ctx, f: number, a0: number, a1: number, y0: number, y1: number, side: 1 | -1, color = '#5e3b1f', yFloor = Math.min(y0, y1)) {
  const h = 0.95, len = Math.hypot(a1 - a0, y1 - y0), ang = Math.atan2(y1 - y0, a1 - a0);
  box(c.b, c.k.M.wood, color, f, (y0 + y1) / 2 + h - 0.03, (a0 + a1) / 2, 0.07, 0.06, len, { rx: ang, chunk: c.chunk });
  const n = Math.max(2, Math.round(Math.abs(a1 - a0) / 0.35));
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
    box(c.b, c.k.M.paint, color, f, y, a, 0.04, h, 0.04, { chunk: c.chunk, shadow: false });
  }
  const t = 0.14;
  c.col.addBox(side < 0 ? f - t : f, side < 0 ? f : f + t, Math.min(a0, a1), Math.max(a0, a1), yFloor, Math.max(y0, y1) + 1.1, { tag: 'railing' });
}

export function hipRoof(c: Ctx, cx: number, cz: number, sx: number, sz: number, y: number, h: number, mat: THREE.Material, color: THREE.ColorRepresentation, overhang = 0.6) {
  const g = hipRoofGeo(sx, sz, h, overhang);
  geo(c.b, mat, color, g, cx, y, cz, { chunk: c.chunk });
  g.dispose();
  // eave fascia
  boxMM(c.b, c.k.M.paint, '#5a4a3a', cx - sx / 2 - overhang, cx + sx / 2 + overhang, y - 0.2, y, cz - sz / 2 - overhang, cz + sz / 2 + overhang, { chunk: c.chunk });
}

export function gableRoof(c: Ctx, cx: number, cz: number, len: number, width: number, y: number, h: number, alongX: boolean, mat: THREE.Material, color: THREE.ColorRepresentation) {
  const g = gableGeo(len, width, h, alongX);
  geo(c.b, mat, color, g, cx, y, cz, { chunk: c.chunk });
  g.dispose();
}

/** Simple box helper bound to ctx. */
export function B(c: Ctx, mat: THREE.Material, color: THREE.ColorRepresentation, x: number, y0: number, z: number, sx: number, sy: number, sz: number, yaw = 0, uv = 0) {
  box(c.b, mat, color, x, y0, z, sx, sy, sz, { yaw, uv, chunk: c.chunk });
}
