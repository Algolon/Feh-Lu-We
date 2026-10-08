// Architecture helpers: walls with real door openings (geometry + colliders), decorative windows,
// floors/ceilings, stairs with a hidden smooth collision ramp, and roofs.
import * as THREE from 'three';
import { Batcher, box, boxMM, cyl, geo, getKit, gableGeo, hipRoofGeo, planMatrix, type Kit } from './kit';
import { lathe, softBox } from './artkit';
import type { CollisionWorld } from '../player/collision';
import { registerOpening } from './openings';

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
  /** DEV-03 window grammar on the exterior face: 'manor' dressed-stone surround, lintel with keystone, sash bars;
   * 'cottage' plain whitewashed reveal with a painted frame; default 'plain' (painted frame + projecting sill). */
  winStyle?: WinStyle;
  /** DEV-03: interior trim (skirting at the floor, a small cornice at the ceiling) on the interior face(s). Default on
   * for partitions (no exterior) and skinned walls; `false` for sheds, screens and other rough walls. */
  trim?: boolean | { skirting?: THREE.ColorRepresentation; cornice?: boolean };
}
export type WinStyle = 'plain' | 'manor' | 'cottage';
/** Joinery (painted surrounds, skirting) and oak trim colours: ART_TOKENS world.joinery / world.oak family. */
export const TRIM = { joinery: '#e2d6bc', oak: '#6e4a2c', dressed: '#efe4cb', frame: '#ece4d2', bar: '#e6dcc6' };

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
    // DEV-04A opening contract: every wall opening is a floor-level door/passage, clear from y0 up to its head
    registerOpening({ kind: 'door', axis, f, t, a0: s, a1: e, y0, y1: y0 + (op.h ?? 2.3) });
    piece(cur, s, y0, y1);
    piece(s, e, y0 + (op.h ?? 2.3), y1); // lintel
    // door frame (visual only)
    frame(c, axis, f, s, e, y0, y0 + (op.h ?? 2.3), t);
    cur = e;
  }
  piece(cur, hi, y0, y1);
  // interior trim: skirting along the floor between openings, a small cornice under the ceiling (visual only)
  const trimOn = o.trim !== false && (!o.exterior || !!o.skin) && y1 - y0 > 2.2;
  if (trimOn) {
    const tc = typeof o.trim === 'object' ? o.trim : {};
    const ext = o.exterior ?? 0;
    const faces: (1 | -1)[] = ext ? [(-ext) as 1 | -1] : [1, -1];
    for (const sd of faces) {
      const ff = f + sd * (t / 2 + (o.skin ? 0.022 : 0));
      let c0 = lo;
      const runs: [number, number][] = [];
      for (const op of ops) { runs.push([c0, op.at - op.w / 2 - 0.09]); c0 = op.at + op.w / 2 + 0.09; }
      runs.push([c0, hi]);
      for (const [s0, s1] of runs) if (s1 - s0 > 0.05) trimRun(c, axis, ff, sd, s0, s1, y0, 0.14, 0.022, tc.skirting ?? TRIM.joinery);
      if (tc.cornice !== false) trimRun(c, axis, ff, sd, lo, hi, y1 - 0.09, 0.09, 0.035, TRIM.joinery, true);
    }
  }
  if (o.skin) {
    // thin interior finish layer on the inner face (no collider)
    const side = -(o.exterior ?? 1);
    const ff = f + side * (t / 2 + 0.012);
    const sk = { ...o, mat: o.skin.mat, color: o.skin.color, t: 0.02, collide: false, skin: undefined, windows: [], exterior: 0 as const };
    wallNoFrames(c, axis, ff, a0, a1, y0, y1, sk);
  }
  for (const wdef of o.windows ?? []) {
    const ext = o.exterior ?? 0;
    const wy = y0 + (wdef.sill ?? 0.9), ww = wdef.w ?? 1.1;
    registerOpening({ kind: 'window', axis, f, t, a0: wdef.at - ww / 2, a1: wdef.at + ww / 2, y0: wy, y1: wy + (wdef.h ?? 1.5) });
    const sides: (1 | -1)[] = wdef.side ? [wdef.side] : ext ? [ext as 1 | -1, (-ext) as 1 | -1] : [1, -1];
    for (const s of sides) {
      const outside = ext !== 0 && s === ext;
      windowAt(c, axis, f + s * (t / 2 + (o.skin && !outside ? 0.03 : 0)), s, wdef.at, y0 + (wdef.sill ?? 0.9), wdef.w ?? 1.1, wdef.h ?? 1.5, outside, { kind: outside ? o.winStyle ?? 'plain' : 'plain' });
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

/** A trim board along a wall face: `sd` the face side (+1 = +z/+x), from s0 to s1 at height y (h tall, d proud). */
function trimRun(c: Ctx, axis: 'x' | 'z', ff: number, sd: 1 | -1, s0: number, s1: number, y: number, h: number, d: number, col: THREE.ColorRepresentation, cove = false) {
  const m = c.k.M.paint;
  if (axis === 'x') boxMM(c.b, m, col, s0, s1, y, y + h, Math.min(ff, ff + sd * d), Math.max(ff, ff + sd * d), { chunk: c.chunk, shadow: false, jitter: 0 });
  else boxMM(c.b, m, col, Math.min(ff, ff + sd * d), Math.max(ff, ff + sd * d), y, y + h, s0, s1, { chunk: c.chunk, shadow: false, jitter: 0 });
  if (cove) { // a second, shallower step under the cornice: reads as a moulding, not a strip
    if (axis === 'x') boxMM(c.b, m, col, s0, s1, y - 0.035, y, Math.min(ff, ff + sd * d * 0.5), Math.max(ff, ff + sd * d * 0.5), { chunk: c.chunk, shadow: false, jitter: 0 });
    else boxMM(c.b, m, col, Math.min(ff, ff + sd * d * 0.5), Math.max(ff, ff + sd * d * 0.5), y - 0.035, y, s0, s1, { chunk: c.chunk, shadow: false, jitter: 0 });
  }
}

/**
 * Door frame (visual only): a lining across the full wall depth plus, on both faces, an architrave, plinth blocks at the foot and a capped head — the joinery of a real opening instead of three sticks.
 */
function frame(c: Ctx, axis: 'x' | 'z', f: number, s: number, e: number, y0: number, y1: number, t: number) {
  const col = TRIM.oak, m = c.k.M.paint;
  const B = (a0: number, a1: number, ya: number, yb: number, d0: number, d1: number, cc: THREE.ColorRepresentation = col) => {
    if (axis === 'x') boxMM(c.b, m, cc, a0, a1, ya, yb, f + d0, f + d1, { chunk: c.chunk, jitter: 0 });
    else boxMM(c.b, m, cc, f + d0, f + d1, ya, yb, a0, a1, { chunk: c.chunk, jitter: 0 });
  };
  const L = t / 2 + 0.005, w = 0.11;
  // lining (the reveal) across the wall thickness
  B(s - 0.03, s, y0, y1, -L, L);
  B(e, e + 0.03, y0, y1, -L, L);
  B(s - 0.03, e + 0.03, y1, y1 + 0.03, -L, L);
  for (const sd of [-1, 1]) {
    const d0 = sd * L, d1 = sd * (L + 0.03);
    const lo = (a: number, b: number) => [Math.min(a, b), Math.max(a, b)] as [number, number];
    // architrave legs + head, then the bead on the inner edge, then plinth blocks and a head cap
    B(s - w, s, y0 + 0.16, y1 + w, ...lo(d0, d1));
    B(e, e + w, y0 + 0.16, y1 + w, ...lo(d0, d1));
    B(s - w, e + w, y1, y1 + w, ...lo(d0, d1));
    B(s - w - 0.012, s + 0.005, y0, y0 + 0.18, ...lo(d0, sd * (L + 0.04)));
    B(e - 0.005, e + w + 0.012, y0, y0 + 0.18, ...lo(d0, sd * (L + 0.04)));
    B(s - w - 0.03, e + w + 0.03, y1 + w, y1 + w + 0.04, ...lo(d0, sd * (L + 0.05)));
  }
}

const hash = (a: number, b: number, k: number) => { const v = Math.sin(a * 12.9898 + b * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };
/** Exterior glass: cool daylight glass (sky and the dark room behind it); about a quarter of the rooms have a lamp on. */
const GLASS = { day: '#5f6f78', dayLow: '#4b5860', lit: '#e8b86c', litLow: '#c98f4c', inside: '#bcd2dc' };

/**
 * Window on a wall face. DEV-03 grammar: the glass sits behind a painted frame with glazing bars, the frame behind a
 * surround that stands proud of the wall (a reveal you can read from the path), a projecting sill with a drip edge;
 * `manor` adds a dressed-stone architrave, a lintel and a keystone. Inside: a painted lining and a deep window board.
 * The glass is unlit (glow) but no longer every pane is a lit lamp: most read as cool daylight glass.
 */
export function windowAt(c: Ctx, axis: 'x' | 'z', faceF: number, side: 1 | -1, at: number, y: number, w: number, h: number, outside: boolean, style: { frame?: string; glass?: string; arch?: boolean; kind?: WinStyle } = {}) {
  const kind = style.kind ?? 'plain';
  const lit = hash(at, faceF + y, axis === 'x' ? 1 : 2) < 0.26;
  const fr = style.frame ?? (outside ? (kind === 'cottage' ? '#f4efe4' : TRIM.frame) : TRIM.joinery);
  const P = c.k.M.paint;
  const B = (a0: number, a1: number, y0: number, y1: number, d0: number, d1: number, mat: THREE.Material, col: THREE.ColorRepresentation, shadow = false) => {
    const fa = faceF + side * d0, fb = faceF + side * d1;
    if (axis === 'x') boxMM(c.b, mat, col, a0, a1, y0, y1, Math.min(fa, fb), Math.max(fa, fb), { chunk: c.chunk, shadow, jitter: 0 });
    else boxMM(c.b, mat, col, Math.min(fa, fb), Math.max(fa, fb), y0, y1, a0, a1, { chunk: c.chunk, shadow, jitter: 0 });
  };
  const x0 = at - w / 2, x1 = at + w / 2, top = y + h;
  // glass: two tones, lighter at the top (sky reflection), darker low (the room behind); warm when a lamp is on
  if (outside) {
    const [hi, lo] = style.glass ? [style.glass, style.glass] : lit ? [GLASS.lit, GLASS.litLow] : [GLASS.day, GLASS.dayLow];
    B(x0, x1, y + h * 0.45, top, 0.004, 0.012, c.k.M.glow, hi);
    B(x0, x1, y, y + h * 0.45, 0.004, 0.012, c.k.M.glow, lo);
  } else B(x0, x1, y, top, 0.004, 0.012, c.k.M.glow, style.glass ?? GLASS.inside);
  // sash frame + glazing bars (2 × 3 panes; the meeting rail heavier)
  const fw = 0.065, fd0 = 0.006, fd1 = 0.05;
  B(x0 - fw, x0, y - fw, top + fw, fd0, fd1, P, fr);
  B(x1, x1 + fw, y - fw, top + fw, fd0, fd1, P, fr);
  B(x0, x1, top, top + fw, fd0, fd1, P, fr);
  const bar = kind === 'manor' ? TRIM.bar : fr;
  B(at - 0.018, at + 0.018, y, top, fd0, fd1 - 0.012, P, bar);
  B(x0, x1, y + h * 0.5 - 0.025, y + h * 0.5 + 0.025, fd0, fd1, P, bar);
  if (h > 1.1) for (const q of [0.25, 0.75]) B(x0, x1, y + h * q - 0.014, y + h * q + 0.014, fd0, fd1 - 0.012, P, bar);
  if (!outside) {
    // interior: painted lining round the opening and a deep window board
    B(x0 - fw - 0.06, x0 - fw, y - fw, top + fw + 0.06, 0, 0.03, P, TRIM.joinery);
    B(x1 + fw, x1 + fw + 0.06, y - fw, top + fw + 0.06, 0, 0.03, P, TRIM.joinery);
    B(x0 - fw - 0.06, x1 + fw + 0.06, top + fw, top + fw + 0.06, 0, 0.03, P, TRIM.joinery);
    B(x0 - fw - 0.1, x1 + fw + 0.1, y - fw - 0.045, y - fw, 0, 0.17, P, TRIM.joinery, true);
    return;
  }
  if (kind === 'cottage') {
    // whitewashed reveal: a raised plaster band round the opening, a simple tiled sill
    const rw = 0.12;
    B(x0 - fw - rw, x0 - fw, y - fw, top + fw + rw, 0, 0.05, P, '#f6f1e6');
    B(x1 + fw, x1 + fw + rw, y - fw, top + fw + rw, 0, 0.05, P, '#f6f1e6');
    B(x0 - fw - rw, x1 + fw + rw, top + fw, top + fw + rw, 0, 0.05, P, '#f6f1e6');
    B(x0 - fw - 0.16, x1 + fw + 0.16, y - fw - 0.07, y - fw, 0, 0.13, c.k.M.terracotta, '#c08a6a', true);
    return;
  }
  const dressed = kind === 'manor';
  const sw = dressed ? 0.15 : 0.06, sd = dressed ? 0.075 : 0.045, scol = dressed ? TRIM.dressed : fr;
  const smat = dressed ? c.k.M.stone : P;
  // surround (architrave), proud of the wall: the glass now sits in a visible reveal
  B(x0 - fw - sw, x0 - fw, y - fw, top + fw, 0, sd, smat, scol, true);
  B(x1 + fw, x1 + fw + sw, y - fw, top + fw, 0, sd, smat, scol, true);
  B(x0 - fw - sw, x1 + fw + sw, top + fw, top + fw + sw * 0.8, 0, sd, smat, scol, true);
  // sill: projects beyond the surround on both sides
  B(x0 - fw - sw - 0.07, x1 + fw + sw + 0.07, y - fw - 0.085, y - fw, 0, sd + 0.075, smat, scol, true);
  if (dressed) {
    // lintel band and keystone over the head
    const lt = top + fw + sw * 0.8;
    B(x0 - fw - sw - 0.05, x1 + fw + sw + 0.05, lt, lt + 0.16, 0, sd + 0.02, smat, '#eadcc0', true);
    B(at - 0.11, at + 0.11, lt - 0.06, lt + 0.24, 0, sd + 0.05, smat, '#f2e8d2', true);
  }
}

/** Floor slab: visible box (top at yTop) + walkable region. */
export function floor(c: Ctx, x0: number, x1: number, z0: number, z1: number, yTop: number, mat: THREE.Material, color: THREE.ColorRepresentation, thick = 0.2, walk = true, uv = 2) {
  boxMM(c.b, mat, color, x0, x1, yTop - thick, yTop, z0, z1, { uv, chunk: c.chunk });
  if (walk) c.col.addFloor(x0, x1, z0, z1, yTop);
}

/**
 * DEV-04A door threshold: a dressed stone sill through the full depth of a wall opening, its top 12 mm over the floor
 * level y (a readable threshold, never a knee-high piece of wall), walkable.
 */
export function threshold(c: Ctx, x0: number, x1: number, z0: number, z1: number, y: number, color: THREE.ColorRepresentation = '#d6c8a8') {
  boxMM(c.b, c.k.M.stone, color, x0, x1, y - 0.14, y + 0.012, z0, z1, { uv: 0.8, chunk: c.chunk, jitter: 0 });
  c.col.addFloor(x0, x1, z0, z1, y);
}

/** Ceiling (visual only), underside at y. */
export function ceiling(c: Ctx, x0: number, x1: number, z0: number, z1: number, y: number, color: THREE.ColorRepresentation = '#efe4cc', thick = 0.2) {
  boxMM(c.b, c.k.M.plaster, color, x0, x1, y, y + thick, z0, z1, { uv: 3, chunk: c.chunk, shadow: false });
}

export interface StairLook { /** stepped mass under the treads (the closed side of the flight) */ mass?: THREE.ColorRepresentation; runner?: THREE.ColorRepresentation | false; riser?: THREE.ColorRepresentation }
/**
 * Straight stairs rising along +z (dir 1) or -z (dir -1) between z0 and z1 (z0 = bottom when dir 1). DEV-03: oak treads
 * with a nosing over painted risers, closed strings (side boards) following the pitch, a painted stepped mass below
 * (the spandrel), and an optional runner. Collision is unchanged: per-step solids + one smooth hidden ramp.
 */
export function stairsZ(c: Ctx, x0: number, x1: number, zBottom: number, zTop: number, yBottom: number, yTop: number, color: THREE.ColorRepresentation = '#7a4f2c', risers?: number, look: StairLook = {}) {
  const n = risers ?? Math.max(4, Math.round((yTop - yBottom) / 0.18));
  const run = (zTop - zBottom) / n, rise = (yTop - yBottom) / n, dir = Math.sign(run);
  const mass = look.mass ?? '#d8cbb0', runner = look.runner === undefined ? '#7a2e2a' : look.runner, riserCol = look.riser ?? TRIM.joinery;
  const W = c.k.M.wood, P = c.k.M.paint, sw = 0.05;
  for (let i = 0; i < n; i++) {
    const za = zBottom + run * i, zb = za + run, yt = yBottom + rise * (i + 1);
    const lo = Math.min(za, zb), hi = Math.max(za, zb);
    boxMM(c.b, P, mass, x0, x1, yBottom, yt - 0.045, lo, hi, { chunk: c.chunk });
    boxMM(c.b, W, color, x0 + sw, x1 - sw, yt - 0.045, yt, Math.min(za - dir * 0.03, zb), Math.max(za - dir * 0.03, zb), { uv: 1.2, chunk: c.chunk, jitter: 0.03 }); // tread + nosing
    boxMM(c.b, P, riserCol, x0 + sw, x1 - sw, yt - rise, yt - 0.045, Math.min(za, za + dir * 0.02), Math.max(za, za + dir * 0.02), { chunk: c.chunk, shadow: false }); // riser
    if (runner) boxMM(c.b, P, runner, x0 + 0.28, x1 - 0.28, yt, yt + 0.01, Math.min(za - dir * 0.03, zb), Math.max(za - dir * 0.03, zb), { chunk: c.chunk, shadow: false, jitter: 0 });
    // per-step solid: blocks walking into the stair mass from the side, never from the ramp itself
    c.col.addBox(x0, x1, lo, hi, yBottom, yt);
  }
  // closed strings along both sides, following the pitch (top edge ~9 cm over the nosing line)
  const L = Math.hypot(zTop - zBottom, yTop - yBottom), ang = Math.atan2(yTop - yBottom, zTop - zBottom);
  // the nosing line runs through the tread fronts: one rise above the line from the bottom to the top landing
  for (const x of [x0 + sw / 2 - 0.02, x1 - sw / 2 - 0.004]) box(c.b, W, color, x, (yBottom + yTop) / 2 + rise + 0.09 - 0.34, (zBottom + zTop) / 2 - run / 2, sw, 0.34, L, { rx: ang, chunk: c.chunk, uv: 1.2 });
  // smooth hidden ramp (from the nose of the first step to the top) for collision
  c.col.addRamp({ minX: x0, maxX: x1, minZ: Math.min(zBottom, zTop), maxZ: Math.max(zBottom, zTop), axis: 'z', a: zBottom, ya: yBottom, b: zTop, yb: yTop });
}

// ------------------------------------------------------------------------------------------------ joinery parts
let balGeo: THREE.BufferGeometry | null = null;
/** Turned baluster, 1 m tall (scaled per use): square foot, a vase, a neck, a collar (lathe, 4 sides: reads as a
 * turned square baluster at room distance; ~300 of them stay under 15 k triangles). */
export function balusterGeo() {
  if (balGeo) return balGeo;
  balGeo = lathe([[0.027, 0], [0.027, 0.12], [0.03, 0.3], [0.015, 0.64], [0.022, 0.7], [0.016, 0.76], [0.024, 1]], 4); // open-ended, 4 sides: 48 triangles
  balGeo.userData.shared = true;
  return balGeo;
}
let railGeo: THREE.BufferGeometry | null = null;
/** Handrail section (1 m long along local z, rounded top): scaled along z per use. */
function handrailGeo() {
  if (railGeo) return railGeo;
  railGeo = softBox(0.075, 0.06, 1, 0.022, 2, 1);
  railGeo.userData.shared = true;
  return railGeo;
}
/** A box between two plan points (x, y, z), w wide and h tall (e.g. hips, verges, sloped rails). */
export function segBox(c: Ctx, mat: THREE.Material, col: THREE.ColorRepresentation, a: [number, number, number], b: [number, number, number], w: number, h: number, o: { shadow?: boolean; g?: THREE.BufferGeometry } = {}) {
  const A = new THREE.Vector3(a[0], a[1], -a[2]), Bv = new THREE.Vector3(b[0], b[1], -b[2]);
  const len = A.distanceTo(Bv);
  const m = new THREE.Matrix4().lookAt(A, Bv, Math.abs(Bv.y - A.y) > len * 0.999 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0));
  m.scale(new THREE.Vector3(w, h, len)).setPosition(A.clone().add(Bv).multiplyScalar(0.5));
  const g = o.g ?? c.k.unitBox;
  c.b.add(mat, g, m, col, c.chunk, o.shadow ?? true, 0);
}
/** Turned balusters + rounded handrail + bottom rail along a straight line, from (a, ya) to (b, yb) at x/z = f. */
export function balustrade(c: Ctx, axis: 'x' | 'z', f: number, a0: number, a1: number, y0: number, y1: number, color: THREE.ColorRepresentation, h = 0.95, spacing = 0.19) {
  const P = (a: number, y: number): [number, number, number] => (axis === 'x' ? [a, y, f] : [f, y, a]);
  segBox(c, c.k.M.wood, color, P(a0, y0 + h), P(a1, y1 + h), 1, 1, { g: handrailGeo() });
  segBox(c, c.k.M.wood, color, P(a0, y0 + 0.06), P(a1, y1 + 0.06), 0.05, 0.05);
  const n = Math.max(1, Math.round(Math.abs(a1 - a0) / spacing));
  for (let i = 1; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
    const [x, yy, z] = P(a, y + 0.08);
    c.b.add(c.k.M.wood, balusterGeo(), planMatrix(x, yy, z, 0, 1, h - 0.11, 1), color, c.chunk, false, 0);
  }
  for (const [a, y] of [[a0, y0], [a1, y1]] as const) newel(c, ...P(a, y), color, h + 0.12);
}
/** Square newel post with a cap and a ball finial. */
export function newel(c: Ctx, x: number, y: number, z: number, color: THREE.ColorRepresentation, h = 1.1) {
  box(c.b, c.k.M.wood, color, x, y, z, 0.11, h, 0.11, { chunk: c.chunk });
  box(c.b, c.k.M.wood, color, x, y + h, z, 0.15, 0.04, 0.15, { chunk: c.chunk });
  cyl(c.b, c.k.M.wood, color, x, y + h + 0.04, z, 0.035, 0.045, 0.06, 8, { chunk: c.chunk });
}

/** Railing (visual + collider at the given floor height). axis like wall(). */
export function railing(c: Ctx, axis: 'x' | 'z', f: number, a0: number, a1: number, y0: number, color = '#5e3b1f') {
  balustrade(c, axis, f, a0, a1, y0, y0, color, 1.0);
  if (axis === 'x') c.col.addBox(a0, a1, f - 0.08, f + 0.08, y0, y0 + 1.6);
  else c.col.addBox(f - 0.08, f + 0.08, a0, a1, y0, y0 + 1.6);
}

/**
 * Railing along the side of a stair flight (axis 'z': at x = f, the flight rising from (a0, y0) to (a1, y1) along z).
 * Visual: sloped handrail + balusters. Collision: one box from the lower floor to above the upper handrail, entirely
 * OUTSIDE the flight (on the side `side`: −1 = towards −x, +1 = towards +x), so walking on the flight is never touched
 * and stepping off its side is impossible at every height.
 */
export function stairRail(c: Ctx, f: number, a0: number, a1: number, y0: number, y1: number, side: 1 | -1, color = '#5e3b1f', yFloor = Math.min(y0, y1)) {
  balustrade(c, 'z', f, a0, a1, y0, y1, color, 0.95, 0.24);
  const t = 0.14;
  c.col.addBox(side < 0 ? f - t : f, side < 0 ? f : f + t, Math.min(a0, a1), Math.max(a0, a1), yFloor, Math.max(y0, y1) + 1.1, { tag: 'railing' });
}

export interface EaveLook { fascia?: THREE.ColorRepresentation; soffit?: THREE.ColorRepresentation; gutter?: THREE.ColorRepresentation | false; cap?: THREE.ColorRepresentation; downpipes?: [number, number][] }
/**
 * Hip roof with a real eave: fascia boards round the edge, a soffit closing the overhang underneath, a half-round
 * gutter, ridge and hip caps, optional downpipes (plan points at the wall). DEV-03 fix: the old "fascia" was a solid
 * slab under the WHOLE roof footprint at eave height — inside the house it z-fought with the upstairs ceilings and
 * turned them black.
 */
export function hipRoof(c: Ctx, cx: number, cz: number, sx: number, sz: number, y: number, h: number, mat: THREE.Material, color: THREE.ColorRepresentation, overhang = 0.6, look: EaveLook = {}) {
  const g = hipRoofGeo(sx, sz, h, overhang);
  geo(c.b, mat, color, g, cx, y, cz, { chunk: c.chunk });
  g.dispose();
  const P = c.k.M.paint, fas = look.fascia ?? '#5a4636', sof = look.soffit ?? '#d9ccb0', cap = look.cap ?? '#5d5a58';
  const ax = sx / 2 + overhang, az = sz / 2 + overhang, wx = sx / 2, wz = sz / 2;
  // fascia ring (outer edge) and soffit ring (closing the overhang from below)
  for (const [x0, x1, z0, z1] of [[-ax, ax, -az, -az + 0.05], [-ax, ax, az - 0.05, az], [-ax, -ax + 0.05, -az, az], [ax - 0.05, ax, -az, az]] as const)
    boxMM(c.b, P, fas, cx + x0, cx + x1, y - 0.24, y + 0.03, cz + z0, cz + z1, { chunk: c.chunk, jitter: 0 });
  for (const [x0, x1, z0, z1] of [[-ax, ax, -az, -wz], [-ax, ax, wz, az], [-ax, -wx, -wz, wz], [wx, ax, -wz, wz]] as const)
    boxMM(c.b, P, sof, cx + x0, cx + x1, y - 0.22, y - 0.18, cz + z0, cz + z1, { chunk: c.chunk, shadow: false, jitter: 0 });
  if (look.gutter !== false) {
    const gc = look.gutter ?? '#6e6f6a', go = 0.07;
    for (const [x0, x1, z0, z1] of [[-ax - go, ax + go, -az - go - 0.06, -az - go + 0.04], [-ax - go, ax + go, az + go - 0.04, az + go + 0.06], [-ax - go - 0.06, -ax - go + 0.04, -az - go, az + go], [ax + go - 0.04, ax + go + 0.06, -az - go, az + go]] as const)
      boxMM(c.b, P, gc, cx + x0, cx + x1, y - 0.16, y - 0.04, cz + z0, cz + z1, { chunk: c.chunk, jitter: 0 });
    for (const [px, pz] of look.downpipes ?? []) {
      cyl(c.b, P, gc, px, 0.1, pz, 0.045, 0.045, y - 0.25, 6, { chunk: c.chunk, jitter: 0 });
      cyl(c.b, P, gc, px, 0, pz, 0.075, 0.06, 0.12, 6, { chunk: c.chunk, jitter: 0 }); // shoe over the drain
      boxMM(c.b, P, gc, Math.min(px, cx + Math.sign(px - cx) * (ax + go)), Math.max(px, cx + Math.sign(px - cx) * (ax + go)), y - 0.2, y - 0.12, pz - 0.04, pz + 0.04, { chunk: c.chunk, jitter: 0 });
    }
  }
  // ridge and hip caps
  const ridge = Math.abs(ax - az), alongX = ax > az, rx = alongX ? ridge : 0, rz = alongX ? 0 : ridge;
  if (ridge > 0.01) segBox(c, P, cap, [cx - rx, y + h + 0.02, cz - rz], [cx + rx, y + h + 0.02, cz + rz], 0.18, 0.09);
  for (const [sx2, sz2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
    const ex = alongX ? sx2 * rx : 0, ez = alongX ? 0 : sz2 * rz;
    segBox(c, P, cap, [cx + sx2 * ax, y + 0.06, cz + sz2 * az], [cx + ex, y + h + 0.03, cz + ez], 0.14, 0.07);
  }
}

export function gableRoof(c: Ctx, cx: number, cz: number, len: number, width: number, y: number, h: number, alongX: boolean, mat: THREE.Material, color: THREE.ColorRepresentation, barge: THREE.ColorRepresentation | false = '#5a4636') {
  const g = gableGeo(len, width, h, alongX);
  geo(c.b, mat, color, g, cx, y, cz, { chunk: c.chunk });
  g.dispose();
  if (!barge) return;
  // bargeboards on both gable ends + a ridge cap: the roof gets an edge thickness instead of a paper prism
  for (const e of [-1, 1]) {
    const ex = alongX ? cx + e * (len / 2 + 0.02) : cx, ez = alongX ? cz : cz + e * (len / 2 + 0.02);
    for (const s2 of [-1, 1]) {
      const a: [number, number, number] = alongX ? [ex, y - 0.05, cz + s2 * (width / 2 + 0.02)] : [cx + s2 * (width / 2 + 0.02), y - 0.05, ez];
      segBox(c, c.k.M.paint, barge, a, [ex, y + h + 0.02, ez], 0.06, 0.2);
    }
  }
  const r0: [number, number, number] = alongX ? [cx - len / 2, y + h + 0.02, cz] : [cx, y + h + 0.02, cz - len / 2];
  const r1: [number, number, number] = alongX ? [cx + len / 2, y + h + 0.02, cz] : [cx, y + h + 0.02, cz + len / 2];
  segBox(c, c.k.M.paint, '#5d5a58', r0, r1, 0.14, 0.08);
}

/** Simple box helper bound to ctx. */
export function B(c: Ctx, mat: THREE.Material, color: THREE.ColorRepresentation, x: number, y0: number, z: number, sx: number, sy: number, sz: number, yaw = 0, uv = 0) {
  box(c.b, mat, color, x, y0, z, sx, sy, sz, { yaw, uv, chunk: c.chunk });
}
