// Static furniture and decor (batched), plus lamp/lantern models for interactive lights.
import * as THREE from 'three';
import { type Ctx, segBox } from './arch';
import { box, cyl, compound, planMatrix, v3, getKit } from './kit';
import { registerArt, artFootprint } from './openings';
import { Asm, artMats, softBox, lathe, projectUV, bake, baseAO, cushion, type ContactShadows } from './artkit';
import { upholstered } from './livingSample';
import { bushModel, BARK_TINT, LEAF_TINT, woodMats } from './woodkit';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { paintingTexture } from './textures';
import type { World } from '../interactions/world';
import type { Batcher } from './kit';
import { makeFire } from './fire';
import { mulberry32 } from '../core/rng';
import { addBook, addShelfBook, addBookStack, bookSpec, bookDims, BOOK_H, PAPER, propMats, rugGeo, addGameBox, GAME_BOXES, drapeGeo, type BookSize, type BookSpec, type RugPattern } from './propkit';

const rot = (dx: number, dz: number, yaw: number): [number, number] => [dx * Math.cos(yaw) + dz * Math.sin(yaw), -dx * Math.sin(yaw) + dz * Math.cos(yaw)];

/** Place a part relative to a furniture origin (x,z,yaw). Local dx = right, dz = forward (facing). */
function P(c: Ctx, mat: THREE.Material, color: THREE.ColorRepresentation, x: number, z: number, yaw: number, dx: number, y0: number, dz: number, sx: number, sy: number, sz: number, uv = 0) {
  const [rx, rz] = rot(dx, dz, yaw);
  box(c.b, mat, color, x + rx, y0, z + rz, sx, sy, sz, { yaw, uv, chunk: c.chunk });
}

function collide(c: Ctx, x: number, z: number, yaw: number, w: number, d: number, h: number, y0 = 0) {
  const swap = Math.abs(Math.sin(yaw)) > 0.7;
  c.col.addBoxC(x, z, swap ? d : w, swap ? w : d, y0, y0 + h);
}


// ------------------------------------------------------------------------------------------------ DEV-03 joinery kit
// The shared furniture is rebuilt on the art kit (the living-room sample's grammar): tops with softened edges, aprons,
// tapered square legs, rails and slats, panelled doors with gaps, plinths and cornices, upholstery as soft volumes.
// Every piece keeps its signature, footprint and collider; parts are merged into the room's batch (one draw call per
// material per area). Geometry is cached per size so a dining set costs one build per part.
const GC = new Map<string, THREE.BufferGeometry>();
function cg(key: string, make: () => THREE.BufferGeometry) {
  let g = GC.get(key);
  if (!g) { g = make(); g.userData.shared = true; GC.set(key, g); }
  return g;
}
const f3 = (v: number) => v.toFixed(3);
/** Softened box (seg 1: 108 triangles; seg 2 for upholstery), grain along its longer plan side. */
const sb = (w: number, h: number, d: number, r = 0.008, seg = 1) => cg(`sb${f3(w)},${f3(h)},${f3(d)},${r},${seg}`, () => projectUV(softBox(w, h, d, r, seg, 1), 1, w >= d ? 'x' : 'z'));
/** Plain box with world-scaled UVs (thin parts: slats, rails, panels). */
const bx = (w: number, h: number, d: number) => cg(`bx${f3(w)},${f3(h)},${f3(d)}`, () => projectUV(new THREE.BoxGeometry(w, h, d).toNonIndexed(), 1, w >= d ? (w >= h ? 'x' : 'y') : d >= h ? 'z' : 'y'));
/** Square tapered leg from the floor (lathe, 4 sides), darker at the foot. */
const taperLeg = (h: number, top = 0.036, foot = 0.024) => cg(`leg${f3(h)},${top},${foot}`, () => {
  const l0 = new THREE.LatheGeometry([new THREE.Vector2(0.001, 0), new THREE.Vector2(foot, 0), new THREE.Vector2(top, h * 0.72), new THREE.Vector2(top, h), new THREE.Vector2(0.001, h)], 4).rotateY(Math.PI / 4);
  const g = bake(projectUV(l0.toNonIndexed(), 1, 'y'), baseAO(0, 0.18, 0.75));
  l0.dispose(); g.computeVertexNormals();
  return g;
});
const darker = (c: THREE.ColorRepresentation, k = 0.82) => new THREE.Color(c).multiplyScalar(k);
export const joinery = { sb, bx, taperLeg, cg, darker };

/**
 * Sun lounger. DEV-04B: every part is carried — two side rails on four legs, the head legs hold an axle with the two
 * wheels on it (they used to hang 12 cm under the rail on nothing), a slatted bed on the rails, the back hinged at the
 * end of the seat and propped on a pair of stays, cushions lying on the slats / the back, a folded towel.
 * Origin = footprint centre, head toward local −z. Collider 0.75 × 1.95 (as the DEV-02 blockout).
 */
export function lounger(c: Ctx, x: number, z: number, y0: number, yaw: number, towel: string, frame = '#a8743f') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('lounger'), dk = darker(frame, 0.8);
  for (const sx of [-1, 1]) {
    a.add(M.timber, frame, bx(0.05, 0.08, 1.95), sx * 0.33, 0.3, 0); // rail 0.26–0.34
    a.add(M.timber, dk, bx(0.05, 0.28, 0.05), sx * 0.33, 0.14, 0.85); // foot legs
    a.add(M.timber, dk, bx(0.05, 0.2, 0.05), sx * 0.33, 0.17, -0.85); // head legs down to the axle
    a.add(M.paint, '#2b2b2b', cg('loungerWheel', () => new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12).rotateZ(Math.PI / 2)), sx * 0.375, 0.07, -0.85);
    a.add(M.timber, dk, bx(0.05, 0.05, 0.05), sx * 0.375, 0.07, -0.85); // hub block between leg and wheel
  }
  a.add(M.paint, '#3a3530', cg('loungerAxle', () => new THREE.CylinderGeometry(0.012, 0.012, 0.8, 6).rotateZ(Math.PI / 2)), 0, 0.07, -0.85);
  for (const lz of [-0.62, 0.85]) a.add(M.timber, dk, bx(0.61, 0.05, 0.05), 0, 0.29, lz); // cross rails
  for (let q = 0; q < 9; q++) a.add(M.timber, frame, bx(0.62, 0.02, 0.1), 0, 0.35, -0.2 + q * 0.13);
  // the back: hinged at the head end of the seat (lz −0.26, on the rails), rising toward the head at 0.62 rad
  const al = 0.62, L = 0.72, hz = -0.26, hy = 0.355, ca = Math.cos(al), sa = Math.sin(al);
  a.add(M.timber, frame, bx(0.62, 0.02, L), 0, hy + (L / 2) * sa + 0.01, hz - (L / 2) * ca, { rx: -al });
  for (const sx of [-1, 1]) a.add(M.timber, dk, bx(0.03, 0.06, 0.06), sx * 0.3, hy, hz); // hinge blocks
  // stays from the rails (lz −0.62) up under the back (0.55 along it)
  const tz = hz - 0.55 * ca, ty = hy + 0.55 * sa, bz = -0.62, by = 0.34, sl = Math.hypot(tz - bz, ty - by);
  for (const sx of [-1, 1]) a.add(M.timber, dk, bx(0.03, sl, 0.03), sx * 0.27, (by + ty) / 2, (bz + tz) / 2, { rx: Math.atan2(bz - tz, ty - by) });
  a.add(M.upholstery, '#f2ead8', cg('loungerSeat', () => projectUV(cushion(0.6, 0.05, 1.08, 0.02, 0.012, 'top', 1, 3), 0.25)), 0, 0.36 + 0.025, 0.31);
  a.add(M.upholstery, '#f2ead8', cg('loungerBack', () => projectUV(cushion(0.6, 0.05, 0.68, 0.02, 0.012, 'top', 1, 3), 0.25)), 0, hy + (L / 2) * sa + 0.02 + 0.035 * ca, hz - (L / 2) * ca + 0.035 * sa, { rx: -al });
  a.add(M.upholstery, towel, sb(0.42, 0.06, 0.3, 0.02), 0.05, 0.435, 0.62, { ry: 0.12 });
  a.end();
  c.col.addBoxC(x, z, Math.abs(Math.sin(yaw)) > 0.7 ? 1.95 : 0.75, Math.abs(Math.sin(yaw)) > 0.7 ? 0.75 : 1.95, y0 - 0.15, y0 + 0.6);
}
/** A turned glass bottle (for bars and tables). */
export function bottleGeo() { return cg('bottle', () => lathe([[0.001, 0], [0.035, 0], [0.037, 0.18], [0.02, 0.24], [0.012, 0.3], [0.001, 0.3]], 8)); }

export function table(c: Ctx, x: number, z: number, y0: number, w: number, d: number, yaw = 0, color = '#7a4a28', h = 0.76, o: { openSide?: 1 | -1 } = {}) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('table');
  const rail = darker(color, 0.86), inset = Math.min(0.07, Math.min(w, d) * 0.12);
  a.add(M.timber, color, sb(w, 0.045, d, 0.01), 0, h - 0.0225, 0);
  for (const s2 of [-1, 1]) {
    a.add(M.timber, rail, bx(w - 2 * inset - 0.06, 0.08, 0.022), 0, h - 0.085, s2 * (d / 2 - inset - 0.011));
    if (o.openSide !== s2) a.add(M.timber, rail, bx(0.022, 0.08, d - 2 * inset - 0.06), s2 * (w / 2 - inset - 0.011), h - 0.085, 0); // (a drawer side has no rail)
  }
  const lx = w / 2 - inset - 0.01, lzz = d / 2 - inset - 0.01;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, rail, taperLeg(h - 0.045, 0.034, 0.024), sx * lx, 0, sz * lzz);
  // DEV-04B: a long table gets an H-stretcher — one between each end's leg pair and a centre rail jointed into them
  // (DEV-03's centre stretcher stopped 2 cm short of the legs and hung in the air)
  if (Math.max(w, d) > 2.2) {
    const dk = darker(color, 0.75), sy = 0.18;
    if (w > d) { for (const sx of [-1, 1]) a.add(M.timber, dk, bx(0.04, 0.05, 2 * lzz), sx * lx, sy, 0); a.add(M.timber, dk, bx(2 * lx, 0.05, 0.04), 0, sy, 0); }
    else { for (const sz of [-1, 1]) a.add(M.timber, dk, bx(2 * lx, 0.05, 0.04), 0, sy, sz * lzz); a.add(M.timber, dk, bx(0.04, 0.05, 2 * lzz), 0, sy, 0); }
  }
  a.end();
  collide(c, x, z, yaw, w, d, h, y0);
}

export function roundTable(c: Ctx, x: number, z: number, y0: number, r: number, color = '#7a4a28') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, 0);
  a.add(M.timber, color, cg(`rt${f3(r)}`, () => projectUV(lathe([[0, 0], [r - 0.012, 0], [r, 0.014], [r, 0.03], [r - 0.012, 0.045], [0, 0.045]], 24), 1)), 0, 0.715, 0); // top surface at 0.76 (items rest on it)
  a.add(M.timber, darker(color, 0.8), cg('rtPed', () => projectUV(lathe([[0.001, 0], [0.09, 0], [0.09, 0.04], [0.05, 0.1], [0.045, 0.58], [0.06, 0.65], [0.08, 0.715], [0.001, 0.715]], 10), 1, 'y')), 0, 0, 0);
  for (const yaw of [0, Math.PI / 2]) a.add(M.timber, darker(color, 0.75), bx(0.6, 0.05, 0.06), 0, 0.025, 0, { ry: yaw });
  c.col.addCircle(x, z, r * 0.9, y0, y0 + 0.76);
}

/**
 * Side chairs, one joinery family (same timber, same leg language) in four builds. DEV-04B adds the variants so a
 * dining room, a kitchen and a library do not repeat one chair:
 * - ladder: back posts up from the floor, a top rail and two slats (DEV-03);
 * - spindle: a Windsor-style kitchen chair — a solid seat, a bow back on spindles, H-stretchers;
 * - upholstered: a dining chair with a padded seat and a padded back panel between the posts;
 * - carver: the ladder chair with arms on turned supports (heads of a table, desks).
 */
export type ChairStyle = 'ladder' | 'spindle' | 'upholstered' | 'carver';
export function chair(c: Ctx, x: number, z: number, y0: number, yaw: number, seat = '#b5643c', collideIt = true, style: ChairStyle = 'ladder', wood = '#6b4426') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin(`chair.${style}`), dk = darker(wood, 0.85);
  if (style === 'spindle') {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, dk, taperLeg(0.44, 0.022, 0.017), sx * 0.17, 0, sz * 0.16);
    for (const sx of [-1, 1]) a.add(M.timber, dk, bx(0.02, 0.02, 0.32), sx * 0.17, 0.17, 0);
    a.add(M.timber, dk, bx(0.34, 0.02, 0.02), 0, 0.17, 0);
    a.add(M.timber, wood, cg('windsorSeat', () => projectUV(cushion(0.44, 0.045, 0.42, 0.015, -0.008, 'top', 1, 3), 1)), 0, 0.4625, 0);
    // bow back: two posts from the seat into a half-round bow, five spindles between seat and bow
    const R = 0.19, yb = 0.66;
    for (const sx of [-1, 1]) a.add(M.timber, wood, bx(0.026, yb - 0.48, 0.026), sx * R, (yb + 0.48) / 2, -0.17, { rx: -0.08 });
    a.add(M.timber, wood, cg('windsorBow', () => new THREE.TorusGeometry(R, 0.016, 5, 12, Math.PI)), 0, yb, -0.18, { rx: -0.08 });
    for (const q of [-0.1, -0.05, 0, 0.05, 0.1]) { const top = yb + Math.sqrt(R * R - q * q) - 0.012, len = top - 0.48; a.add(M.timber, wood, bx(0.014, len, 0.014), q * 1.6, 0.48 + len / 2, -0.175, { rx: -0.08 }); }
    if (seat) a.add(M.upholstery, seat, cg('windsorPad', () => projectUV(cushion(0.34, 0.025, 0.32, 0.012, 0.008, 'top', 1, 2), 0.25)), 0, 0.4975, 0.02);
  } else {
    for (const sx of [-1, 1]) {
      a.add(M.timber, dk, taperLeg(0.43, 0.022, 0.018), sx * 0.19, 0, 0.18);
      a.add(M.timber, wood, bx(0.034, 0.95, 0.034), sx * 0.19, 0.475, -0.19, { rx: -0.06 });
      a.add(M.timber, dk, bx(0.02, 0.022, 0.34), sx * 0.19, 0.16, 0);
    }
    a.add(M.timber, dk, bx(0.34, 0.022, 0.02), 0, 0.2, 0.18);
    a.add(M.timber, wood, sb(0.45, 0.035, 0.43, 0.008), 0, 0.447, 0);
    if (style === 'upholstered') {
      a.add(M.upholstery, seat, cg('dinPad', () => projectUV(cushion(0.41, 0.06, 0.39, 0.02, 0.012, 'top', 1, 2), 0.25)), 0, 0.494, 0.01);
      a.add(M.timber, wood, sb(0.42, 0.06, 0.03, 0.01), 0, 0.9, -0.236, { rx: -0.06 });
      a.add(M.upholstery, seat, cg('dinBack', () => projectUV(cushion(0.34, 0.3, 0.045, 0.018, 0.014, 'front', 1, 2), 0.25)), 0, 0.71, -0.21, { rx: -0.06 });
    } else {
      if (seat) a.add(M.upholstery, seat, cg('ladderPad', () => projectUV(cushion(0.39, 0.045, 0.37, 0.018, 0.01, 'top', 1, 2), 0.25)), 0, 0.4875, 0.015);
      a.add(M.timber, wood, sb(0.42, 0.075, 0.03, 0.01), 0, 0.88, -0.235, { rx: -0.06 });
      for (const yy of [0.62, 0.75]) a.add(M.timber, wood, bx(0.36, 0.045, 0.02), 0, yy, -0.215, { rx: -0.06 });
    }
    if (style === 'carver') for (const sx of [-1, 1]) {
      a.add(M.timber, wood, bx(0.03, 0.22, 0.03), sx * 0.21, 0.575, 0.16); // arm support over the front leg
      a.add(M.timber, wood, sb(0.055, 0.03, 0.42, 0.008), sx * 0.21, 0.7, -0.02);
    }
  }
  a.end();
  if (collideIt) c.col.addCircle(x, z, style === 'carver' ? 0.3 : 0.26, y0, y0 + 0.9);
}

/**
 * Sofas and armchairs. DEV-04B: one upholstery family everywhere — the owner-approved living-room build (turned
 * walnut feet, an upholstered base, crowned seat cushions, a raked arched back with loose cushions, rolled arms with
 * piped scroll fronts; livingSample.upholstered) in place of the boxier DEV-03 sofa. `wings` adds a wing back
 * (library / study reading chairs). Same signature, footprint and collider as before.
 */
export function sofa(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 2.2, color = '#5f7a45', o: { wings?: boolean; pillows?: string[] } = {}) {
  const seats = w > 1.5 ? 3 : w > 1.25 ? 2 : 1;
  upholstered(c, NO_SHADOWS, x, z, y0, yaw, { lite: true, width: w > 1.25 ? w - 0.1 : 0.88, depth: 0.86, seats, color, pillows: o.pillows ?? (seats > 1 ? ['#b3813f', '#7a2e2a'] : undefined), wings: o.wings });
  collide(c, x, z, yaw, w, 0.9, 0.9, y0);
}
const NO_SHADOWS = { add() {} } as unknown as ContactShadows;

export function armchair(c: Ctx, x: number, z: number, y0: number, yaw: number, color = '#6b7f9a', wings = false) {
  sofa(c, x, z, y0, yaw, 1.0, color, { wings });
}

const BOOK_PALETTES: Record<string, string[]> = {
  // DEV-04B: the book-family sheet's cover colours (oxblood, moss, slate blue, brown, ochre, sage, parchment) per shelf
  leather: ['#7a2f2a', '#8e372c', '#5a3a28', '#754728', '#6b2a2a', '#aa733b'],
  navy: ['#2f3f5f', '#3b4f5d', '#26344a', '#4a5964', '#7a6a4a', '#8e372c'],
  olive: ['#3b4e3c', '#5e7155', '#4f5f32', '#7a6a3a', '#5a4a2a', '#754728'],
  linen: ['#cbb98f', '#a88f62', '#e1bb8a', '#8a7a5a', '#b8a070', '#5e7155'],
};
/**
 * Bookcase. DEV-04B: the books are the modular book family (propkit): hard and soft covers with real boards, spines
 * and recessed paper blocks in four size and four thickness classes. Shelves are composed, not filled: sets that
 * share a binding, single books, a book leaning into a gap, short horizontal stacks, the odd object, empty space.
 */
export function bookshelf(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.6, h = 2.2, palette = 'leather', depth = 0.35) {
  const k = c.k, M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), case_ = '#5a3a22';
  const pal = BOOK_PALETTES[palette] ?? BOOK_PALETTES.leather;
  // carcass: back, side panels standing 1 cm proud, a recessed plinth and a two-step cornice
  P(c, k.M.wood, darker(case_, 0.8), x, z, yaw, 0, y0 + 0.08, -depth / 2 + 0.03, w - 0.06, h - 0.12, 0.02, 1);
  for (const s2 of [-1, 1]) a.add(M.timber, case_, bx(0.04, h, depth + 0.01), s2 * (w / 2 - 0.02), h / 2, 0.005);
  a.add(M.timber, darker(case_, 0.7), bx(w - 0.08, 0.09, depth - 0.04), 0, 0.045, -0.01);
  a.add(M.timber, case_, sb(w + 0.04, 0.05, depth + 0.04, 0.008), 0, h - 0.025, 0.01);
  a.add(M.timber, darker(case_, 0.85), sb(w + 0.1, 0.04, depth + 0.08, 0.008), 0, h + 0.02, 0.02);
  const shelves = Math.floor(h / 0.42);
  const r = mulberry32(Math.floor(x * 7 + z * 13) * 31 + Math.floor(h * 10));
  const inner = depth - 0.03, front = inner / 2 - 0.006;
  const sizes = (['small', 'medium', 'tall', 'folio'] as BookSize[]).filter((sz) => BOOK_H[sz][1] < inner - 0.01);
  for (let i = 0; i <= shelves; i++) {
    const yy = 0.09 + i * ((h - 0.14) / shelves) - (i === shelves ? 0.04 : 0);
    // shelf with a thicker front lipping
    a.add(M.timber, case_, bx(w - 0.08, 0.03, depth - 0.03), 0, yy + 0.015, 0);
    a.add(M.timber, darker(case_, 1.08), bx(w - 0.08, 0.045, 0.02), 0, yy + 0.0075, front + 0.016);
    if (i >= shelves) continue;
    const clear = (h - 0.14) / shelves - 0.035, base = yy + 0.03;
    const fits = sizes.filter((sz) => BOOK_H[sz][0] < clear - 0.02);
    if (!fits.length) continue;
    let bx2 = -w / 2 + 0.045, prevRight = bx2, prevH = 0;
    const end = w / 2 - 0.045;
    while (bx2 < end - 0.03) {
      const roll = r();
      if (roll < 0.09) { bx2 += 0.06 + r() * 0.12; prevH = 0; continue; } // an empty stretch
      if (roll < 0.17 && end - bx2 > 0.3) { // a short stack lying flat
        const n = 2 + Math.floor(r() * 4), sz = fits[Math.min(fits.length - 1, 1 + Math.floor(r() * (fits.length - 1)))];
        const cx = bx2 + BOOK_H[sz][0] / 2 + 0.01;
        addBookStack(a, r, pal, cx, base, front - BOOK_H[sz][1] / 2 - 0.004, n, { sizes: [sz, sz, ...fits.slice(0, 1)] });
        bx2 += BOOK_H[sz][0] + 0.03; prevH = 0; continue;
      }
      if (roll < 0.2 && end - bx2 > 0.14) { // an object: a small jug or a lidded box
        if (r() < 0.5) a.add(M.ceramic, ['#6f91a6', '#e6dcc4', '#b3813f'][Math.floor(r() * 3)], cg('shelfJug', () => lathe([[0.001, 0], [0.04, 0], [0.05, 0.05], [0.045, 0.11], [0.03, 0.14], [0.035, 0.16], [0.001, 0.15]], 10)), bx2 + 0.06, base, 0);
        else { a.add(M.timber, '#6e4a2c', sb(0.11, 0.07, 0.09, 0.006), bx2 + 0.06, base + 0.035, 0); a.add(M.brass, '#c9a44c', bx(0.02, 0.008, 0.012), bx2 + 0.06, base + 0.04, 0.046); }
        bx2 += 0.13; prevH = 0; continue;
      }
      // a set: one binding (size, cover, design family), one or two colours, thicknesses varying
      const n = 2 + Math.floor(r() * 7), spec = bookSpec(r, { sizes: fits }), cA = pal[Math.floor(r() * pal.length)], cB = pal[Math.floor(r() * pal.length)];
      const shared = r() < 0.6, paper = r() < 0.3 ? PAPER.old : r() < 0.6 ? PAPER.aged : PAPER.fresh;
      for (let q = 0; q < n && bx2 < end - 0.02; q++) {
        const s1: BookSpec = { ...spec, thick: shared ? spec.thick : (['thin', 'medium', 'medium', 'thick'] as const)[Math.floor(r() * 4)], design: shared ? spec.design : (spec.design + q) % 8 };
        const { t, h: bh, d } = bookDims(s1);
        if (bx2 + t > end) break;
        const lz = front - d / 2 - r() * 0.012;
        const leanNext = q === n - 1 && r() < 0.28 && prevH > bh * 0.9 && end - bx2 > bh * 0.4;
        if (leanNext) {
          // the last book of a run leans into the empty space, its top resting on its neighbour
          const ang = 0.22 + r() * 0.12, xc = prevRight + t / 2 + bh * Math.sin(ang) * 0.98;
          addBook(a, s1, shared ? cA : r() < 0.5 ? cA : cB, xc, base, lz, { lean: -ang, paper });
          bx2 = xc + t / 2 + 0.05 + r() * 0.05; prevH = 0; break;
        }
        addShelfBook(a, s1, shared ? (q % 3 === 2 ? cB : cA) : pal[Math.floor(r() * pal.length)], bx2 + t / 2, base, lz, paper);
        bx2 += t + 0.0015; prevRight = bx2; prevH = bh;
      }
    }
  }
  collide(c, x, z, yaw, w, depth + 0.05, h, y0);
}



/**
 * Kitchen run. DEV-04A `sink`: a cut-out for a sink module (centre `at` along the run in local units, width `w`): the
 * worktop and carcass stop at the cut-out (only a strip behind it remains for the tap), the carcass under it is
 * lowered for the bowl and the drawer row gives way to the sink's apron. The sink itself is `farmhouseSink`.
 */
export function counter(c: Ctx, x: number, z: number, y0: number, yaw: number, w: number, top = '#d8cdb8', body = '#7f9a8a', sink?: { at: number; w: number }) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), gap = darker(body, 0.55);
  // kitchen run: recessed plinth, carcass, doors and a drawer row with shadow gaps, brass bar handles, a worktop
  // with a front overhang and a thin upstand at the wall
  a.add(M.paint, '#4a4038', bx(w - 0.02, 0.1, 0.54), 0, 0.05, -0.04);
  const s0 = sink ? sink.at - sink.w / 2 : 0, s1 = sink ? sink.at + sink.w / 2 : 0;
  const runs: [number, number][] = sink ? [[-w / 2, s0], [s1, w / 2]] : [[-w / 2, w / 2]];
  for (const [r0, r1] of runs) if (r1 - r0 > 0.01) a.add(M.paint, gap, bx(r1 - r0, 0.74, 0.58), (r0 + r1) / 2, 0.47, -0.02);
  if (sink) a.add(M.paint, gap, bx(s1 - s0, 0.5, 0.58), sink.at, 0.35, -0.02); // carcass under the bowl (top 0.60)
  const n = Math.max(1, Math.round(w / 0.6)), uw = w / n;
  for (let i = 0; i < n; i++) {
    const ux = -w / 2 + uw * (i + 0.5), underSink = !!sink && ux + uw / 2 > s0 + 0.02 && ux - uw / 2 < s1 - 0.02;
    a.add(M.paint, body, sb(uw - 0.008, 0.52, 0.022, 0.004), ux, 0.37, 0.27);
    if (underSink) continue; // the sink apron takes the drawer row's place
    a.add(M.paint, body, sb(uw - 0.008, 0.16, 0.022, 0.004), ux, 0.735, 0.27);
    a.add(M.brass, '#c9a44c', bx(0.12, 0.012, 0.02), ux, 0.76, 0.29);
    a.add(M.brass, '#c9a44c', bx(0.012, 0.12, 0.02), ux + uw / 2 - 0.06, 0.52, 0.29);
  }
  if (!sink) a.add(M.stone, top, sb(w + 0.02, 0.04, 0.66, 0.006), 0, 0.88, 0.02);
  else {
    for (const [r0, r1] of [[-w / 2 - 0.01, s0], [s1, w / 2 + 0.01]] as const) if (r1 - r0 > 0.01) a.add(M.stone, top, sb(r1 - r0, 0.04, 0.66, 0.006), (r0 + r1) / 2, 0.88, 0.02);
    a.add(M.stone, top, bx(s1 - s0, 0.04, 0.16), sink.at, 0.88, -0.23); // strip behind the bowl (the tap stands on it)
  }
  a.add(M.stone, top, bx(w, 0.08, 0.015), 0, 0.94, -0.305);
  collide(c, x, z, yaw, w, 0.66, 0.92, y0);
}

/**
 * DEV-04A farmhouse sink (fits a `counter` sink cut-out at the same position/yaw): one ceramic body built as a real
 * bowl — apron, back and side walls (3.5 cm), a floor 22 cm below the rim, a drain, the rim 5 mm proud of the worktop
 * — and a bridge tap on the worktop strip behind it. Every visible surface owns its own plane (the old sink drew its
 * dark "water" plane in the body's top face and flickered with each camera move).
 */
export function farmhouseSink(c: Ctx, x: number, z: number, y0: number, yaw: number, W = 0.8) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw);
  const D = 0.52, zc = 0.11, top = 0.905, bot = 0.645, t = 0.035, hh = top - bot, outer = '#f4f1ea', inner = '#e9e6dd';
  a.add(M.ceramic, outer, sb(W, hh, t, 0.01), 0, bot + hh / 2, zc + D / 2 - t / 2); // apron (front)
  a.add(M.ceramic, inner, bx(W, hh, t), 0, bot + hh / 2, zc - D / 2 + t / 2); // back wall
  for (const sx of [-1, 1]) a.add(M.ceramic, inner, bx(t, hh, D - 2 * t), sx * (W / 2 - t / 2), bot + hh / 2, zc);
  a.add(M.ceramic, '#e2dfd5', bx(W - 2 * t, 0.04, D - 2 * t), 0, bot + 0.02, zc); // floor of the bowl between the walls (top 0.685)
  a.add(M.paint, '#3a3c3a', cg('sinkDrain', () => new THREE.CylinderGeometry(0.035, 0.035, 0.006, 12)), 0, bot + 0.04 + 0.004, zc);
  a.add(M.brass, '#b8b8b0', cg('sinkDrainRing', () => new THREE.TorusGeometry(0.04, 0.006, 4, 14).rotateX(Math.PI / 2)), 0, bot + 0.04 + 0.006, zc);
  // bridge tap: a pillar on the worktop strip, a spout arching forward over the bowl
  a.add(M.brass, '#c9a14e', bx(0.03, 0.1, 0.03), 0, 0.9 + 0.05, -0.24);
  a.add(M.brass, '#c9a14e', cg('tapArc', () => new THREE.TorusGeometry(0.1, 0.012, 5, 10, Math.PI)), 0, 1.0, -0.14, { ry: Math.PI / 2 });
}

/**
 * A rug from the DEV-04B rug family (propkit RUG: medallion, kilim, lattice, field, runner, oval, hanging): each design
 * carries its own border structure; `tint` only shifts its palette. A rug marks a furniture zone; DEV-04B removed
 * the ones that only filled floor area.
 */
export function rug(c: Ctx, x: number, z: number, y: number, w: number, d: number, yaw = 0, tint = '#ffffff', pattern: RugPattern = 'medallion', fringe = false) {
  new Asm(c.b, c.chunk, x, y, z, yaw).add(propMats().rug, tint, rugGeo(pattern, w, d, fringe), 0, 0, 0, { shadow: false });
}

export function plant(c: Ctx, x: number, z: number, y0: number, s = 1, pot = '#c9774a') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, (x * 7.3 + z * 3.1) % 6.28);
  // a thrown terracotta pot with a rolled rim, dark soil, a leafy shrub from the woodland kit (hazel / holly)
  a.add(M.paint, pot, cg('pot', () => lathe([[0.001, 0], [0.15, 0], [0.19, 0.06], [0.23, 0.33], [0.255, 0.35], [0.26, 0.39], [0.235, 0.4], [0.225, 0.37], [0.001, 0.37]], 14)), 0, 0, 0, { s: [s, s, s] });
  a.add(M.paint, '#3e2e22', cg('soil', () => new THREE.CircleGeometry(0.22, 12).rotateX(-Math.PI / 2)), 0, 0.36 * s, 0, { s: [s, 1, s] });
  const holly = Math.abs(Math.sin(x * 3.1 + z)) > 0.6, sp = holly ? 'holly' as const : 'hazel' as const;
  a.add(woodMats().tree, LEAF_TINT[sp], pottedShrub(sp), 0, 0.33 * s, 0, { s: [0.42 * s, 0.42 * s, 0.42 * s] });
  c.col.addCircle(x, z, 0.22 * s, y0, y0 + 1);
}
/** One merged woodland-kit bush (bark × bark/leaf ratio baked in, like TreeBatches) for pots and planters. */
function pottedShrub(sp: 'hazel' | 'holly') {
  return cg(`shrub.${sp}`, () => {
    const m = bushModel(sp, 1, 'near'), b = new THREE.Color(BARK_TINT[sp]), l = new THREE.Color(LEAF_TINT[sp]);
    const cc = m.wood.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < cc.count; i++) cc.setXYZ(i, cc.getX(i) * (b.r / l.r), cc.getY(i) * (b.g / l.g), cc.getZ(i) * (b.b / l.b));
    const parts = [m.wood, m.leaves].map((g) => (g.index ? g.toNonIndexed() : g));
    const g = mergeGeometries(parts)!;
    g.userData.keepColor = true;
    return g;
  });
}

export function crate(c: Ctx, x: number, z: number, y0: number, s = 0.6, yaw = 0, color = '#a0784a') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), dk = darker(color, 0.78);
  // a slatted timber crate: corner posts, three slats a side with gaps, a solid base
  a.add(M.timber, dk, bx(s - 0.02, 0.025, s - 0.02), 0, 0.0125, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, dk, bx(0.045, s, 0.045), sx * (s / 2 - 0.0225), s / 2, sz * (s / 2 - 0.0225));
  const sh = (s - 0.03) / 3;
  for (let i = 0; i < 3; i++) {
    const yy = 0.025 + sh * (i + 0.5);
    for (const sd of [-1, 1]) {
      a.add(M.timber, color, bx(s - 0.09, sh - 0.025, 0.018), 0, yy, sd * (s / 2 - 0.01));
      a.add(M.timber, color, bx(0.018, sh - 0.025, s - 0.09), sd * (s / 2 - 0.01), yy, 0);
    }
  }
  c.col.addCircle(x, z, s * 0.6, y0, y0 + s);
}

// ---------------------------------------------------------------- paintings (one shared atlas material)
let atlasMat: THREE.MeshLambertMaterial | null = null;
function paintingAtlas() {
  if (atlasMat) return atlasMat;
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 192;
  const x = cv.getContext('2d')!;
  for (let i = 0; i < 8; i++) {
    const t = paintingTexture(i + 3);
    x.drawImage(t.image as HTMLCanvasElement, (i % 4) * 128, Math.floor(i / 4) * 96, 128, 96);
    t.dispose();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  atlasMat = new THREE.MeshLambertMaterial({ map: tex, vertexColors: true });
  return atlasMat;
}

/** Framed painting hung on a wall. Faces plan heading yaw. */
export function painting(c: Ctx, x: number, y: number, z: number, yaw: number, w = 0.9, h = 0.68, idx = 0) {
  registerArt(artFootprint(`painting@${x.toFixed(2)},${z.toFixed(2)}`, x, y, z, yaw, w + 0.14, h + 0.14)); // DEV-04A wall-art contract
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const u0 = (idx % 4) / 4, v0 = 1 - (Math.floor(idx / 4) + 1) / 2;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) / 4, v0 + uv.getY(i) / 2);
  // PlaneGeometry faces +Z (three) = plan south; our facing convention: local -Z faces yaw → rotate by PI
  const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)];
  c.b.add(paintingAtlas(), g, planMatrix(x + fx * 0.045, y, z + fz * 0.045, yaw + Math.PI), '#ffffff', c.chunk, false, 0);
  g.dispose();
  // a moulded frame (four rails, a linen slip inside) instead of a flat board behind the canvas
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y, z, yaw), fr = idx % 3 === 1 ? '#4e3320' : '#a8823c', fw = 0.07;
  a.add(M.paint, '#e2d6bc', bx(w + 0.03, h + 0.03, 0.02), 0, 0, 0.03);
  for (const s2 of [-1, 1]) {
    a.add(idx % 3 === 1 ? M.timber : M.brass, fr, sb(w + 2 * fw, fw, 0.05, 0.012), 0, s2 * (h / 2 + fw / 2), 0.035);
    a.add(idx % 3 === 1 ? M.timber : M.brass, fr, sb(fw, h, 0.05, 0.012), s2 * (w / 2 + fw / 2), 0, 0.035);
  }
}

// ---------------------------------------------------------------- light models (individual objects)
export interface LampModel { obj: THREE.Group; glow: THREE.MeshBasicMaterial[]; light: THREE.Vector3; flames?: THREE.Object3D }

function glowPart(w: World, geom: THREE.BufferGeometry, color = '#ffd27a') {
  const m = w.material(new THREE.MeshBasicMaterial({ color }));
  const mesh = new THREE.Mesh(geom, m);
  return { mesh, m };
}

export function tableLamp(w: World, x: number, y0: number, z: number): LampModel {
  const k = getKit();
  const obj = compound((b) => {
    cyl(b, k.M.paint, '#e8dfc8', 0, 0, 0, 0.1, 0.13, 0.32, 10);
  });
  const shade = glowPart(w, new THREE.CylinderGeometry(0.14, 0.24, 0.26, 14, 1, true), '#ffe2a8');
  shade.mesh.position.y = 0.45;
  (shade.m as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
  obj.add(shade.mesh);
  obj.position.copy(v3(x, y0, z));
  w.scene.add(obj);
  return { obj, glow: [shade.m], light: v3(x, y0 + 0.5, z) };
}

export function floorLamp(w: World, x: number, y0: number, z: number): LampModel {
  const k = getKit();
  const obj = compound((b) => {
    cyl(b, k.M.paint, '#3b3026', 0, 0, 0, 0.2, 0.22, 0.04, 12);
    cyl(b, k.M.paint, '#3b3026', 0, 0, 0, 0.02, 0.02, 1.5, 6);
  });
  const shade = glowPart(w, new THREE.CylinderGeometry(0.18, 0.3, 0.32, 14, 1, true), '#ffe2a8');
  shade.mesh.position.y = 1.55;
  (shade.m as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
  obj.add(shade.mesh);
  obj.position.copy(v3(x, y0, z));
  w.scene.add(obj);
  return { obj, glow: [shade.m], light: v3(x, y0 + 1.6, z) };
}

/**
 * Hanging candle chandelier with real candle flames (shown while the lamp is on). DEV-03: forged iron — a chain-like
 * stem, a turned centre, a hoop at the candle line, S-scroll arms to brass drip pans and candle cups.
 */
export function chandelier(w: World, x: number, yTop: number, z: number, r = 0.8, drop = 1.2): LampModel {
  const k = getKit(), M = artMats();
  const obj = new THREE.Group();
  const iron = '#2f2a24';
  const frame = compound((b) => {
    cyl(b, k.M.paint, iron, 0, -drop + 0.35, 0, 0.012, 0.012, drop - 0.35, 5);
    b.add(k.M.paint, cg('chandCentre', () => lathe([[0.001, 0], [0.05, 0.02], [0.09, 0.08], [0.05, 0.16], [0.035, 0.3], [0.06, 0.36], [0.001, 0.4]], 10)), planMatrix(0, -drop - 0.06, 0), iron, 'main', false, 0);
    b.add(k.M.paint, cg(`chandRing${f3(r)}`, () => new THREE.TorusGeometry(r, 0.018, 5, 28).rotateX(Math.PI / 2)), planMatrix(0, -drop - 0.02, 0), iron, 'main', false, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      // S-scroll arm: up and out from the centre, a dip, then up into the cup at the hoop
      for (const [t0, y0, t1, y1] of [[0.08, 0.05, 0.45, 0.16], [0.45, 0.16, 0.75, 0.0], [0.75, 0.0, 1.0, 0.02]] as const) {
        const ax = ca * r * t0, az = sa * r * t0, bx2 = ca * r * t1, bz2 = sa * r * t1;
        const len = Math.hypot(bx2 - ax, bz2 - az, y1 - y0);
        b.add(k.M.paint, k.unitBox, new THREE.Matrix4().lookAt(new THREE.Vector3(ax, -drop + y0, -az), new THREE.Vector3(bx2, -drop + y1, -bz2), new THREE.Vector3(0, 1, 0)).scale(new THREE.Vector3(0.022, 0.022, len)).setPosition((ax + bx2) / 2, -drop + (y0 + y1) / 2, -(az + bz2) / 2), iron, 'main', false, 0);
      }
      b.add(M.brass, cg('dripPan', () => lathe([[0.001, 0], [0.06, 0.005], [0.065, 0.018], [0.02, 0.02], [0.001, 0.02]], 10)), planMatrix(ca * r, -drop, sa * r), '#c9a14e', 'main', false, 0);
      b.add(M.brass, cg('candleCup', () => lathe([[0.001, 0], [0.022, 0.0], [0.03, 0.03], [0.03, 0.04], [0.001, 0.04]], 8)), planMatrix(ca * r, -drop + 0.02, sa * r), '#c9a14e', 'main', false, 0);
      cyl(b, k.M.paint, '#efe6c8', ca * r, -drop + 0.035, sa * r, 0.022, 0.024, 0.15, 8);
    }
  });
  obj.add(frame);
  obj.position.copy(v3(x, yTop, z));
  w.scene.add(obj);
  const wicks: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; wicks.push([Math.cos(a) * r, 0, Math.sin(a) * r]); }
  const flames = makeFire(w, { kind: 'candles', x, y: yTop - drop + 0.185, z, wicks, s: 1.2 });
  // an invisible material handle keeps the LampModel contract (no glow sphere needed)
  const glow = w.material(new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
  return { obj, glow: [glow], light: v3(x, yTop - drop + 0.1, z), flames };
}

/** Lantern box (iron frame + glowing glass), optionally with a symbol cut-out panel. */
export function lantern(w: World, x: number, y0: number, z: number, s = 1, yaw = 0): LampModel {
  const k = getKit();
  const obj = compound((b) => {
    box(b, k.M.paint, '#2b2622', 0, 0, 0, 0.3 * s, 0.04 * s, 0.3 * s);
    box(b, k.M.paint, '#2b2622', 0, 0.42 * s, 0, 0.34 * s, 0.05 * s, 0.34 * s);
    cyl(b, k.M.paint, '#2b2622', 0, 0.47 * s, 0, 0.02 * s, 0.17 * s, 0.12 * s, 4, { yaw: Math.PI / 4 });
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) box(b, k.M.paint, '#2b2622', dx * 0.14 * s, 0, dz * 0.14 * s, 0.03 * s, 0.44 * s, 0.03 * s);
  });
  const glass = glowPart(w, new THREE.BoxGeometry(0.25 * s, 0.36 * s, 0.25 * s), '#ffd27a');
  glass.mesh.position.y = 0.22 * s;
  obj.add(glass.mesh);
  obj.position.copy(v3(x, y0, z));
  obj.rotation.y = -yaw;
  w.scene.add(obj);
  return { obj, glow: [glass.m], light: v3(x, y0 + 0.25 * s, z) };
}

export function wallSconce(w: World, x: number, y: number, z: number, yaw: number): LampModel {
  const k = getKit();
  registerArt(artFootprint(`sconce@${x.toFixed(2)},${z.toFixed(2)}`, x, y - 0.05, z, yaw, 0.2, 0.4)); // DEV-04A: wall decor contract
  const obj = compound((b) => {
    box(b, k.M.paint, '#b8892f', 0, -0.12, 0.03, 0.1, 0.24, 0.04);
    box(b, k.M.paint, '#b8892f', 0, -0.02, -0.08, 0.04, 0.04, 0.2);
  });
  const shade = glowPart(w, new THREE.CylinderGeometry(0.07, 0.11, 0.16, 10), '#ffe2a8');
  shade.mesh.position.set(0, 0.08, -0.18);
  obj.add(shade.mesh);
  obj.position.copy(v3(x, y, z));
  obj.rotation.y = -yaw;
  w.scene.add(obj);
  const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)];
  return { obj, glow: [shade.m], light: v3(x + fx * 0.4, y + 0.1, z + fz * 0.4) };
}


export { P as part };

/** Always-on decorative lantern baked into the static batch (no per-lamp draw calls) + pooled light. */
export function staticLantern(c: Ctx, w: World, x: number, y0: number, z: number, s = 1, yaw = 0, intensity = 3, distance = 7) {
  const k = c.k;
  const b: Batcher = c.b;
  const o = { yaw, chunk: c.chunk, shadow: false };
  box(b, k.M.paint, '#2b2622', x, y0, z, 0.3 * s, 0.04 * s, 0.3 * s, o);
  box(b, k.M.paint, '#2b2622', x, y0 + 0.42 * s, z, 0.34 * s, 0.05 * s, 0.34 * s, o);
  cyl(b, k.M.paint, '#2b2622', x, y0 + 0.47 * s, z, 0.02 * s, 0.17 * s, 0.12 * s, 4, { ...o, yaw: yaw + Math.PI / 4 });
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
    const [rx, rz] = rot(dx * 0.14 * s, dz * 0.14 * s, yaw);
    box(b, k.M.paint, '#2b2622', x + rx, y0, z + rz, 0.03 * s, 0.44 * s, 0.03 * s, o);
  }
  box(b, k.M.glow, '#ffd27a', x, y0 + 0.04 * s, z, 0.25 * s, 0.36 * s, 0.25 * s, { ...o, jitter: 0 });
  w.lamps.push({ id: `fixed.${x.toFixed(2)}.${z.toFixed(2)}`, pos: v3(x, y0 + 0.25 * s, z), color: 0xffc77a, intensity, distance, on: () => true });
}

/** Always-on wall sconce baked into the static batch. Faces plan heading yaw (away from the wall). */
export function staticSconce(c: Ctx, w: World, x: number, y: number, z: number, yaw: number, intensity = 3, distance = 6) {
  const k = c.k;
  registerArt(artFootprint(`sconce@${x.toFixed(2)},${z.toFixed(2)}`, x, y - 0.05, z, yaw, 0.2, 0.4)); // DEV-04A: wall decor contract
  P(c, k.M.paint, '#b8892f', x, z, yaw, 0, y - 0.12, -0.03 + 0.03, 0.1, 0.24, 0.04);
  P(c, k.M.paint, '#b8892f', x, z, yaw, 0, y - 0.02, 0.08, 0.04, 0.04, 0.2);
  const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)];
  cyl(c.b, k.M.glow, '#ffe2a8', x + fx * 0.18, y, z + fz * 0.18, 0.07, 0.11, 0.16, 10, { chunk: c.chunk, shadow: false, jitter: 0 });
  w.lamps.push({ id: `fixed.${x.toFixed(2)}.${z.toFixed(2)}`, pos: v3(x + fx * 0.4, y + 0.1, z + fz * 0.4), color: 0xffc77a, intensity, distance, on: () => true });
}


// ---------------------------------------------------------------- iteration 3 decor kit (rounded, chunky timber, warm textiles)
/**
 * Bed (faces plan heading yaw = toward the foot end). DEV-04B construction, closed from every side: head and foot
 * posts, side rails on them and a slatted deck between the rails (the space under the mattress no longer shows the
 * floor through an empty frame), a crowned mattress on the deck, a duvet that lies on the mattress and rolls over its
 * sides and foot (keeping its thickness), its head end turned down, pillows resting ON the mattress and leaning back
 * against the headboard (they used to be tilted the wrong way, into it), an optional throw across the foot.
 * Headboards: `panel` (framed panel), `spindle` (rails and spindles) or `upholstered` (a padded panel in a frame).
 * Footprint and collider unchanged (width × 2.15).
 */
export type BedStyle = 'panel' | 'spindle' | 'upholstered';
export function bed2(c: Ctx, x: number, z: number, y0: number, yaw: number, duvet = '#7a3a3a', wood = '#6b4426', width = 1.6, o: { style?: BedStyle; throwColor?: string; cushion?: string; pillows?: number; sheet?: string } = {}) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('bed'), dk = darker(wood, 0.8), W = width;
  const style = o.style ?? 'panel', sheet = o.sheet ?? '#f4eee2';
  // frame: four posts, side rails 0.20–0.40, a foot board, a slatted deck at 0.32–0.40 inside the rails
  for (const sx of [-1, 1]) {
    a.add(M.timber, wood, bx(0.07, 1.15, 0.07), sx * (W / 2 + 0.02), 0.575, -1.06);
    a.add(M.timber, dk, cg('bedFinial', () => lathe([[0.001, 0], [0.045, 0], [0.05, 0.03], [0.03, 0.07], [0.001, 0.09]], 8)), sx * (W / 2 + 0.02), 1.15, -1.06);
    a.add(M.timber, wood, bx(0.06, 0.55, 0.06), sx * (W / 2 + 0.02), 0.275, 1.03);
    a.add(M.timber, wood, sb(0.04, 0.2, 2.06, 0.008), sx * W / 2, 0.3, 0);
  }
  a.add(M.timber, wood, sb(W, 0.34, 0.04, 0.01), 0, 0.37, 1.04); // foot board
  a.add(M.timber, dk, sb(W + 0.1, 0.04, 0.08, 0.008), 0, 0.56, 1.04); // its capping rail
  a.add(M.timber, dk, bx(W - 0.04, 0.08, 2.04), 0, 0.36, 0); // the deck (closes the frame under the mattress)
  // headboard
  a.add(M.timber, dk, sb(W + 0.12, 0.06, 0.1, 0.01), 0, 1.17, -1.06);
  a.add(M.timber, wood, bx(W, 0.06, 0.05), 0, 0.45, -1.06);
  if (style === 'panel') {
    a.add(M.timber, wood, sb(W, 0.66, 0.04, 0.01), 0, 0.81, -1.06);
    for (const px of [-W / 4, W / 4]) a.add(M.timber, darker(wood, 1.08), sb(W / 2 - 0.16, 0.42, 0.02, 0.008), px, 0.82, -1.035);
  } else if (style === 'spindle') {
    a.add(M.timber, wood, bx(W, 0.05, 0.05), 0, 1.06, -1.06);
    const n = Math.round(W / 0.12);
    for (let i = 0; i < n; i++) a.add(M.timber, wood, cg('bedSpindle', () => lathe([[0.001, 0], [0.014, 0], [0.016, 0.06], [0.011, 0.3], [0.016, 0.52], [0.014, 0.58], [0.001, 0.58]], 6)), -W / 2 + (W / n) * (i + 0.5), 0.475, -1.06);
  } else {
    a.add(M.timber, wood, sb(W, 0.66, 0.035, 0.008), 0, 0.81, -1.075);
    a.add(M.upholstery, o.cushion ?? '#8a7a68', cg(`bedPad${f3(W)}`, () => projectUV(cushion(W - 0.12, 0.56, 0.07, 0.03, 0.025, 'front', 1, 3), 0.25)), 0, 0.81, -1.025);
  }
  // mattress (crowned) on the deck: 0.40–0.60
  const mw = W - 0.06, top = 0.6;
  a.add(M.upholstery, sheet, cg(`mattress${f3(mw)}`, () => projectUV(cushion(mw, 0.2, 1.98, 0.05, 0.012, 'top', 1, 3), 0.25)), 0, 0.5, -0.01);
  // duvet: on the mattress from z −0.5 to the foot, rolled over the sides and the foot end; the turned-down band
  const t = 0.065, hx = mw / 2;
  a.add(M.upholstery, duvet, cg(`duvet${f3(W)}`, () => drapeGeo(hx, -0.5, 0.98, t, 0.17, 0.98, 0.15)), 0, top + 0.004, 0);
  a.add(M.upholstery, sheet, cg(`turnDown${f3(W)}`, () => drapeGeo(hx + t, -0.5, -0.24, 0.035, 0.12)), 0, top + t + 0.004, 0);
  if (o.throwColor) a.add(M.upholstery, o.throwColor, cg(`throw${f3(W)}`, () => drapeGeo(hx + t, 0.48, 0.92, 0.03, 0.22)), 0, top + t + 0.006, 0);
  // pillows: resting on the mattress, leaning back against the headboard (top tilted toward the foot)
  const np = o.pillows ?? (W > 1.2 ? 2 : 1), pw = np > 1 ? W * 0.42 : W * 0.7, lp = 0.4, tp = 0.13, al = 0.32, hf = -1.04;
  const pg = cg(`pillow${f3(pw)}`, () => projectUV(cushion(pw, tp, lp, 0.055, 0.035, 'top', 1, 3), 0.25));
  const pcy = top + Math.sin(al) * (lp / 2) + Math.cos(al) * (tp / 2) - 0.012, pcz = hf + Math.cos(al) * (lp / 2) + Math.sin(al) * (tp / 2);
  for (let i = 0; i < np; i++) { const px = np > 1 ? (i ? 1 : -1) * W * 0.235 : 0; a.add(M.upholstery, '#fbf6ea', pg, px, pcy, pcz, { rx: -al, ry: (i ? 1 : -1) * 0.04 }); }
  if (o.cushion && style !== 'upholstered') a.add(M.upholstery, o.cushion, cg('bedCushion', () => projectUV(cushion(0.4, 0.34, 0.11, 0.05, 0.03, 'front', 1, 3), 0.25)), 0, top + 0.165, pcz + 0.26, { rx: 0.22 });
  a.end();
  collide(c, x, z, yaw, width, 2.15, 0.8, y0);
}

export function bedside(c: Ctx, x: number, z: number, y0: number, yaw: number, wood = '#6b4426') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), dk = darker(wood, 0.7);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, dk, taperLeg(0.12, 0.025, 0.02), sx * 0.19, 0, sz * 0.16);
  a.add(M.timber, wood, sb(0.44, 0.42, 0.38, 0.008), 0, 0.33, 0);
  a.add(M.timber, darker(wood, 1.08), sb(0.36, 0.14, 0.02, 0.005), 0, 0.44, 0.195);
  a.add(M.brass, '#c9a44c', cg('knob', () => new THREE.SphereGeometry(0.018, 8, 6)), 0, 0.44, 0.215);
  a.add(M.timber, darker(wood, 1.1), sb(0.5, 0.035, 0.44, 0.008), 0, 0.56, 0);
  collide(c, x, z, yaw, 0.5, 0.45, 0.6, y0);
}

export function wardrobe(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.4, wood = '#6b4426') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), dk = darker(wood, 0.8), lt = darker(wood, 1.08);
  // carcass on a plinth, two panelled doors (frame + fielded panel) with a centre gap, cornice, knobs
  a.add(M.timber, dk, bx(w - 0.04, 0.1, 0.56), 0, 0.05, -0.01);
  a.add(M.timber, wood, sb(w, 1.92, 0.6, 0.008), 0, 1.06, 0);
  for (const s2 of [-1, 1]) {
    const dx = s2 * (w / 4 + 0.002);
    a.add(M.timber, lt, sb(w / 2 - 0.03, 1.74, 0.025, 0.006), dx, 1.06, 0.31);
    a.add(M.timber, wood, sb(w / 2 - 0.2, 0.62, 0.02, 0.01), dx, 1.42, 0.325);
    a.add(M.timber, wood, sb(w / 2 - 0.2, 0.62, 0.02, 0.01), dx, 0.68, 0.325);
    a.add(M.brass, '#c9a44c', cg('knob', () => new THREE.SphereGeometry(0.018, 8, 6)), s2 * 0.05, 1.06, 0.335);
  }
  a.add(M.timber, dk, sb(w + 0.08, 0.06, 0.66, 0.01), 0, 2.05, 0.01);
  a.add(M.timber, wood, sb(w + 0.02, 0.05, 0.62, 0.008), 0, 2.0, 0.005);
  collide(c, x, z, yaw, w, 0.6, 2.1, y0);
}

/**
 * Drapes either side of a window (on a wall facing heading yaw), with a rod. DEV-04B: each drape is one pleated
 * cloth (a closed slab folded in soft pleats, flaring a little toward the floor) hung from rings on a rod with
 * finials and wall brackets, instead of three loose boards per side.
 */
export function curtains(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.3, h = 1.9, color = '#3f6f78') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw);
  const dw = 0.36, drape = cg(`drape${f3(h)}`, () => {
    const g = new THREE.BoxGeometry(dw, h, 0.018, 14, 3, 1).toNonIndexed();
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), k = 1 + 0.18 * (0.5 - py / h); p.setXYZ(i, px * k, py + h / 2, p.getZ(i) + 0.035 * Math.sin((px / dw) * Math.PI * 4.5)); }
    g.computeVertexNormals();
    return projectUV(g, 0.25);
  });
  for (const s2 of [-1, 1]) {
    a.add(M.upholstery, color, drape, s2 * (w / 2 + dw / 2 - 0.05), 0, 0.07);
    for (let q = 0; q < 4; q++) a.add(M.brass, '#a8823c', cg('curtainRing', () => new THREE.TorusGeometry(0.022, 0.005, 4, 10)), s2 * (w / 2 - 0.05 + 0.03 + q * 0.1), h + 0.02, 0.07);
    a.add(M.brass, '#a8823c', cg('rodFinial', () => new THREE.SphereGeometry(0.03, 8, 6)), s2 * (w / 2 + dw + 0.12), h + 0.04, 0.07);
    a.add(M.brass, '#8a6a30', bx(0.02, 0.05, 0.07), s2 * (w / 2 + dw - 0.02), h + 0.04, 0.035); // wall bracket
  }
  a.add(M.brass, '#a8823c', cg(`curtainRod${f3(w)}`, () => new THREE.CylinderGeometry(0.012, 0.012, w + 2 * dw + 0.2, 6).rotateZ(Math.PI / 2)), 0, h + 0.04, 0.07);
}
export function desk(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.5, d = 0.75, wood = '#6b4426') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), dk = darker(wood, 0.85);
  // pedestal desk: a top with a leather inlay, two drawer pedestals on plinths, a kneehole with a modesty panel
  a.add(M.timber, wood, sb(w, 0.045, d, 0.01), 0, 0.7425, 0);
  a.add(M.upholstery, '#3f4a3a', bx(w - 0.3, 0.004, d - 0.25), 0, 0.767, 0.02);
  for (const s2 of [-1, 1]) {
    const px = s2 * (w / 2 - 0.22);
    a.add(M.timber, dk, bx(0.4, 0.06, d - 0.1), px, 0.03, 0);
    a.add(M.timber, dk, sb(0.42, 0.66, d - 0.06, 0.006), px, 0.39, 0);
    for (let q = 0; q < 3; q++) {
      a.add(M.timber, wood, sb(0.36, 0.19, 0.02, 0.005), px, 0.18 + q * 0.21, d / 2 - 0.02);
      a.add(M.brass, '#c9a44c', bx(0.08, 0.012, 0.02), px, 0.2 + q * 0.21, d / 2 - 0.002);
    }
  }
  a.add(M.timber, dk, bx(w - 0.88, 0.4, 0.02), 0, 0.48, -d / 2 + 0.06);
  collide(c, x, z, yaw, w, d, 0.8, y0);
}

/**
 * Reading lectern; returns the plan point and height of the book rest (unchanged: the interactable books lie on it).
 * DEV-04B: cross feet on pads, a turned column, a sloped desk carried by a block under it, a book ledge at its low edge.
 */
export function lectern(c: Ctx, x: number, z: number, y0: number, yaw: number, wood = '#5a3a22') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('lectern'), lt = darker(wood, 1.15);
  for (const ry of [0, Math.PI / 2]) a.add(M.timber, wood, sb(0.5, 0.06, 0.08, 0.01), 0, 0.03, 0, { ry });
  a.add(M.timber, wood, cg('lecternColumn', () => projectUV(lathe([[0.001, 0], [0.07, 0.0], [0.07, 0.05], [0.045, 0.1], [0.04, 0.5], [0.05, 0.56], [0.038, 0.62], [0.038, 0.86], [0.06, 0.92], [0.001, 0.92]], 10), 1, 'y')), 0, 0.06, 0);
  a.add(M.timber, wood, bx(0.2, 0.08, 0.2), 0, 0.99, 0); // block under the desk
  a.add(M.timber, lt, sb(0.62, 0.05, 0.46, 0.01), 0, 1.025, 0, { rx: -0.45 });
  a.add(M.timber, wood, bx(0.62, 0.035, 0.025), 0, 1.025 - 0.23 * Math.sin(0.45) + 0.03, 0.23 * Math.cos(0.45) + 0.005, { rx: -0.45 }); // book ledge
  a.end({ gap: 0.02 });
  c.col.addCircle(x, z, 0.3, y0, y0 + 1.2);
  return { x, z, y: y0 + 1.06 };
}
/** DEV-04B roll-top bath on four brass feet: a real tub (walls with a rolled rim, an inner floor), water inside. */
export function bathtub(c: Ctx, x: number, z: number, y0: number, yaw: number) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('bathtub');
  const tub = cg('rollTop', () => {
    const rr = (w: number, d: number, r: number) => { const s0 = new THREE.Shape(), hw = w / 2, hd = d / 2; s0.moveTo(-hw + r, -hd); s0.lineTo(hw - r, -hd); s0.quadraticCurveTo(hw, -hd, hw, -hd + r); s0.lineTo(hw, hd - r); s0.quadraticCurveTo(hw, hd, hw - r, hd); s0.lineTo(-hw + r, hd); s0.quadraticCurveTo(-hw, hd, -hw, hd - r); s0.lineTo(-hw, -hd + r); s0.quadraticCurveTo(-hw, -hd, -hw + r, -hd); return s0; };
    const outer = rr(0.76, 1.66, 0.3), hole = rr(0.64, 1.54, 0.25);
    outer.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(outer, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 2, curveSegments: 5 });
    g.rotateX(-Math.PI / 2).translate(0, 0.025, 0);
    return g;
  });
  a.add(M.ceramic, '#f4f1ea', tub, 0, 0.12, 0);
  a.add(M.ceramic, '#ece8de', cg('tubFloor', () => projectUV(softBox(0.66, 0.06, 1.56, 0.02, 1, 1), 1)), 0, 0.15, 0);
  a.add(M.paint, '#bfe0e6', cg('tubWater', () => new THREE.PlaneGeometry(0.64, 1.52).rotateX(-Math.PI / 2)), 0, 0.42, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.brass, '#c9a44c', cg('clawFoot', () => lathe([[0.001, 0], [0.045, 0], [0.05, 0.02], [0.03, 0.08], [0.04, 0.12], [0.001, 0.13]], 8)), sx * 0.28, 0, sz * 0.62);
  a.add(M.brass, '#c9a44c', cg('bathTap', () => new THREE.TorusGeometry(0.06, 0.012, 5, 10, Math.PI)), 0, 0.565, -0.8, { ry: Math.PI / 2 });
  a.end({ gap: 0.02 });
  collide(c, x, z, yaw, 0.8, 1.7, 0.6, y0);
}
export function ladder(c: Ctx, x: number, z: number, y0: number, yaw: number, h = 3.0, wood = '#8a5a33') {
  const k = c.k;
  for (const s of [-1, 1]) P(c, k.M.wood, wood, x, z, yaw, s * 0.22, y0, 0, 0.05, h, 0.05, 0.5);
  for (let y = 0.3; y < h; y += 0.3) P(c, k.M.wood, wood, x, z, yaw, 0, y0 + y, 0, 0.44, 0.04, 0.05, 0.5);
}
/**
 * Brass refractor on an alt-az head over a timber tripod. It points along plan heading `yaw`, its tube raised by `alt`
 * (rad); the eyepiece sits at the LOW back end (DEV-04A). DEV-04B remodel (telescope refs): a tube with a dew shield,
 * brass bands and a dark objective, a focuser with knobs and an eyepiece, a finder scope on two rings, a fork with
 * trunnion bolts on a turned head, three tripod legs with brass feet and a spreader tray. TELESCOPE (pivot height,
 * back / front lengths) is unchanged, so the DEV-04A sightline contract still holds.
 */
export const TELESCOPE = { pivotY: 1.38, back: 0.42, front: 0.4 };
export function telescope(c: Ctx, x: number, z: number, y0: number, yaw: number, alt = 0.35) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), oak = '#5a3a22', brass = '#b8892f';
  for (let i = 0; i < 3; i++) {
    const t = yaw + (i / 3) * Math.PI * 2, fx = x + Math.sin(t) * 0.3, fz = z + Math.cos(t) * 0.3;
    segBox(c, M.timber, oak, [fx, y0 + 0.03, fz], [x + Math.sin(t) * 0.05, y0 + 1.17, z + Math.cos(t) * 0.05], 0.036, 0.026);
    segBox(c, M.timber, darker(oak, 0.8), [x + Math.sin(t) * 0.19, y0 + 0.44, z + Math.cos(t) * 0.19], [x, y0 + 0.44, z], 0.022, 0.018);
    new Asm(c.b, c.chunk, fx, y0, fz, 0).add(M.brass, darker(brass, 0.8), cg('tsFoot', () => lathe([[0.001, 0], [0.028, 0], [0.024, 0.04], [0.001, 0.045]], 8)), 0, 0, 0);
  }
  a.add(M.timber, darker(oak, 0.9), cg('tsTray', () => new THREE.CylinderGeometry(0.11, 0.11, 0.02, 3).rotateY(Math.PI / 6)), 0, 0.455, 0);
  a.add(M.timber, darker(oak, 0.8), cg('tsHead', () => lathe([[0.001, 0], [0.08, 0], [0.075, 0.04], [0.05, 0.07], [0.045, 0.12], [0.001, 0.12]], 10)), 0, 1.15, 0);
  for (const sx of [-1, 1]) {
    a.add(M.brass, darker(brass, 0.7), bx(0.018, 0.13, 0.05), sx * 0.066, 1.33, 0); // fork arm
    a.add(M.brass, brass, cg('tsTrunnion', () => new THREE.CylinderGeometry(0.018, 0.018, 0.02, 8).rotateZ(Math.PI / 2)), sx * 0.08, TELESCOPE.pivotY, 0);
  }
  a.add(M.brass, darker(brass, 0.7), bx(0.15, 0.025, 0.06), 0, 1.27, 0); // fork base
  // the optical tube assembly, built along the tube axis (+y before laying down), centred on the pivot
  const B = TELESCOPE.back;
  const lay = (g: THREE.BufferGeometry) => g.translate(0, -B, 0).rotateX(-Math.PI / 2);
  const ota = cg('tsOta', () => lay(mergeGeometries([
    lathe([[0.001, 0], [0.033, 0], [0.036, 0.05], [0.042, 0.6], [0.056, 0.62], [0.056, 0.82], [0.052, 0.82], [0.052, 0.63], [0.001, 0.63]], 14),
    ...[0.2, 0.42, 0.58].map((y) => new THREE.CylinderGeometry(0.046, 0.046, 0.025, 14).translate(0, y, 0)), // brass bands
    new THREE.CylinderGeometry(0.022, 0.026, 0.07, 10).translate(0, -0.03, 0), // focuser draw tube
    new THREE.CylinderGeometry(0.012, 0.012, 0.09, 6).rotateZ(Math.PI / 2).translate(0, 0.02, 0), // focus knobs (one shaft)
    new THREE.CylinderGeometry(0.006, 0.006, 0.05, 5).translate(0.035, 0.45, 0.06), new THREE.CylinderGeometry(0.006, 0.006, 0.05, 5).translate(-0.0, 0.25, 0.06).translate(0.035, 0, 0), // finder stalks
    new THREE.CylinderGeometry(0.016, 0.018, 0.28, 10).translate(0.035, 0.36, 0.085), // finder scope
  ].map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => { g.deleteAttribute('uv'); return g; }))!));
  a.add(M.brass, brass, ota, 0, TELESCOPE.pivotY, 0, { rx: alt });
  const dark = cg('tsDark', () => lay(mergeGeometries([
    new THREE.CylinderGeometry(0.05, 0.05, 0.004, 14).translate(0, 0.7, 0), // objective glass, in from the dew shield
    new THREE.CylinderGeometry(0.016, 0.016, 0.1, 8).translate(0, -0.1, 0), // eyepiece
    new THREE.CylinderGeometry(0.022, 0.022, 0.012, 8).rotateZ(Math.PI / 2).translate(0.05, 0.02, 0), new THREE.CylinderGeometry(0.022, 0.022, 0.012, 8).rotateZ(Math.PI / 2).translate(-0.05, 0.02, 0), // knob heads
  ].map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => { g.deleteAttribute('uv'); return g; }))!));
  a.add(M.paint, '#1e1c1a', dark, 0, TELESCOPE.pivotY, 0, { rx: alt });
  c.col.addCircle(x, z, 0.3, y0, y0 + 1.5);
}
/** DEV-04A observer's stool: a turned seat on three splayed legs with a ring stretcher (0.5 m). */
export function stool(c: Ctx, x: number, z: number, y0: number) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, 0.4);
  for (let i = 0; i < 3; i++) { const an = (i / 3) * Math.PI * 2; a.add(M.timber, '#5a3a22', bx(0.03, 0.5, 0.03), Math.cos(an) * 0.13, 0.25, Math.sin(an) * 0.13, { rx: Math.sin(an) * 0.14, rz: -Math.cos(an) * 0.14 }); }
  a.add(M.timber, '#6e4a2c', cg('stoolSeat', () => lathe([[0.001, 0], [0.17, 0], [0.18, 0.025], [0.16, 0.045], [0.001, 0.045]], 14)), 0, 0.49, 0);
  a.add(M.timber, '#5a3a22', cg('stoolRing', () => new THREE.TorusGeometry(0.15, 0.012, 4, 12).rotateX(Math.PI / 2)), 0, 0.2, 0);
  c.col.addCircle(x, z, 0.2, y0, y0 + 0.55);
}
/** DEV-03 slatted bench: two trestle ends, a stretcher, three seat slats with eased edges. Origin = centre, along local x. */
export function slatBench(c: Ctx, x: number, z: number, y0: number, yaw: number, len = 1.5, wood = '#7a5232') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), dk = darker(wood, 0.78);
  for (const sx of [-1, 1]) {
    a.add(M.timber, dk, sb(0.06, 0.4, 0.36, 0.006), sx * (len / 2 - 0.12), 0.2, 0);
    a.add(M.timber, dk, sb(0.08, 0.05, 0.42, 0.006), sx * (len / 2 - 0.12), 0.025, 0);
  }
  a.add(M.timber, dk, bx(len - 0.3, 0.05, 0.04), 0, 0.14, 0);
  for (const dz of [-0.13, 0, 0.13]) a.add(M.timber, wood, sb(len, 0.035, 0.11, 0.008), 0, 0.42, dz);
  collide(c, x, z, yaw, len, 0.42, 0.45, y0);
}
/** DEV-03 joiner's workbench: thick laminated top, splayed square legs, stretchers, a lower shelf, a front vice. Along local x. */
export function workbench(c: Ctx, x: number, z: number, y0: number, yaw: number, len = 3.0, d = 0.7, wood = '#8a6440') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), dk = darker(wood, 0.75);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, dk, bx(0.09, 0.84, 0.09), sx * (len / 2 - 0.15), 0.42, sz * (d / 2 - 0.08));
  for (const sx of [-1, 1]) a.add(M.timber, dk, bx(0.06, 0.08, d - 0.1), sx * (len / 2 - 0.15), 0.2, 0);
  a.add(M.timber, dk, bx(len - 0.3, 0.08, 0.06), 0, 0.2, 0);
  a.add(M.timber, darker(wood, 0.9), bx(len - 0.34, 0.03, d - 0.2), 0, 0.25, 0);
  a.add(M.timber, wood, sb(len, 0.08, d, 0.012), 0, 0.88, 0);
  a.add(M.timber, dk, bx(0.4, 0.14, 0.08), -len / 2 + 0.45, 0.8, d / 2 + 0.04); // vice chop
  a.add(M.paint, '#3a3530', cg('viceScrew', () => new THREE.CylinderGeometry(0.018, 0.018, 0.34, 6).rotateZ(Math.PI / 2)), -len / 2 + 0.45, 0.78, d / 2 + 0.1);
  collide(c, x, z, yaw, len, d, 0.95, y0);
}
/** DEV-03 blanket chest (bed foot): frame-and-panel box on a plinth, moulded lid, iron handles. */
export function blanketChest(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.1, wood = '#7a5a3a') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), dk = darker(wood, 0.78), lt = darker(wood, 1.1);
  a.add(M.timber, dk, bx(w - 0.04, 0.07, 0.4), 0, 0.035, 0);
  a.add(M.timber, wood, sb(w, 0.4, 0.44, 0.008), 0, 0.27, 0);
  for (const dx of [-w / 4, w / 4]) a.add(M.timber, lt, sb(w / 2 - 0.12, 0.24, 0.02, 0.008), dx, 0.27, 0.22);
  a.add(M.timber, dk, sb(w + 0.04, 0.05, 0.48, 0.012), 0, 0.495, 0);
  for (const sx of [-1, 1]) a.add(M.paint, '#2f2b28', bx(0.02, 0.03, 0.16), sx * (w / 2 + 0.01), 0.36, 0);
  a.add(M.upholstery, '#d9cbb0', sb(w * 0.7, 0.06, 0.36, 0.02, 2), -0.05, 0.55, 0, { ry: 0.04 });
  collide(c, x, z, yaw, w, 0.46, 0.55, y0);
}
/** Stacked board-game boxes (DEV-04B: printed lids over trays from the game-box family), one per colour entry. */
export function gameBoxes(c: Ctx, x: number, z: number, y: number, yaw: number, colors: string[], start = 0) {
  const a = new Asm(c.b, c.chunk, x, y, z, yaw);
  let yy = 0;
  colors.forEach((_, i) => { const b = GAME_BOXES[(start + i) % GAME_BOXES.length]; yy += addGameBox(a, b, (i % 2 ? 1 : -1) * 0.01, yy, 0, { ry: (i % 2 ? 1 : -1) * 0.06 * i }); });
}
/** A hard instrument case leaning against a wall: body + neck, edge band, handle. Origin = foot at the floor. */
export function instrumentCase(c: Ctx, x: number, z: number, y0: number, yaw: number, color: string, len = 1.05) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), lean = 0.14;
  const body = len * 0.55, neck = len - body;
  a.add(M.upholstery, color, sb(0.4, body, 0.13, 0.04, 2), 0, body / 2, 0, { rx: lean });
  a.add(M.upholstery, color, sb(0.22, neck, 0.11, 0.035, 2), 0, body + neck / 2 - 0.02, -lean * (body + neck / 2), { rx: lean });
  a.add(M.paint, '#8a8278', bx(0.41, 0.015, 0.135), 0, body * 0.5, -lean * body * 0.5, { rx: lean });
  a.add(M.paint, '#1e1a17', bx(0.12, 0.025, 0.03), 0.21, body * 0.55, -lean * body * 0.55, { rx: lean, rz: Math.PI / 2 });
}
/** A flat framed panel with its own canvas texture (signs, boards, drawn diagrams). Faces plan heading yaw. */
export function canvasPanel(w: World, x: number, y: number, z: number, yaw: number, width: number, height: number, draw: (x: CanvasRenderingContext2D, W: number, H: number) => void, px = 512, frame: string | null = '#6b4426', emissive = false) {
  const cv = document.createElement('canvas');
  cv.width = px; cv.height = Math.round((px * height) / width);
  const g = cv.getContext('2d')!;
  draw(g, cv.width, cv.height);
  const tex = w.texture(new THREE.CanvasTexture(cv));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = w.material(emissive ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshLambertMaterial({ map: tex }));
  const grp = new THREE.Group();
  registerArt(artFootprint(`panel@${x.toFixed(2)},${z.toFixed(2)}`, x, y, z, yaw, width + (frame ? 0.1 : 0), height + (frame ? 0.1 : 0))); // DEV-04A wall-art contract
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  plane.position.z = 0.03;
  grp.add(plane);
  if (frame) {
    const k = getKit();
    grp.add(compound((b) => box(b, k.M.wood, frame, 0, -height / 2 - 0.05, -0.0, width + 0.1, height + 0.1, 0.04)));
  }
  grp.position.copy(v3(x, y, z));
  grp.rotation.y = Math.PI - yaw; // plane normal (+Z local) points along plan heading yaw
  // a wall-mounted panel belongs to the room it faces (sampling around it would leak through the wall)
  grp.updateMatrixWorld(true);
  const fwd = new THREE.Vector3(Math.sin(yaw) * 0.4, 0, Math.cos(yaw) * 0.4);
  grp.userData.roomProbe = { x: x + fwd.x, y, z: z + fwd.z };
  w.scene.add(grp);
  return { grp, mat, tex, canvas: cv };
}

/**
 * "Copacabana Room" bar sign (owner direction; DEV-04A placement on the bar canopy kept). DEV-04B redesign: a shaped
 * timber board (rounded ends, a wave crest, a teal inlay following the outline) in place of a rectangle, and lettering
 * that is drawn, not typed: "Copacabana" as bouncing hand-set capitals-and-lowercase on a wave baseline, each letter
 * tilted a little, cream with a thick dark outline and a teal offset shadow; "ROOM" letter-spaced beneath between two
 * wave ornaments. Both lines are measured and scaled to fit inside the inlay with margin (the DEV-04A title ran to
 * the frame). Board 1.9 × 0.62 m, canvas 1024 × 334. Faces plan heading yaw; same wall-art id as before.
 */
export const BAR_SIGN = { w: 1.9, h: 0.62 };
export function barSign(w: World, x: number, y: number, z: number, yaw: number) {
  const W = 1024, H = Math.round((W * BAR_SIGN.h) / BAR_SIGN.w), cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const cx = cv.getContext('2d')!;
  // board outline (canvas px): rounded ends, a gentle double wave along the top, a straight bottom
  const outline = (g: CanvasRenderingContext2D | THREE.Shape, ins: number, sx = 1, sy = 1, ox = 0, oy = 0) => {
    const P = (px: number, py: number): [number, number] => [ox + px * sx, oy + py * sy], r = H * 0.3 - ins, x0 = ins, x1 = W - ins, y0 = H * 0.16 + ins, y1 = H - ins;
    const m = (a: [number, number]) => g.moveTo(...a), l = (a: [number, number]) => g.lineTo(...a), q = (c1: [number, number], a: [number, number]) => g.quadraticCurveTo(...c1, ...a);
    m(P(x0 + r, y1)); l(P(x1 - r, y1)); q(P(x1, y1), P(x1, y1 - r)); l(P(x1, y0 + r * 0.6)); q(P(x1, y0), P(x1 - r, y0));
    q(P(W * 0.75, y0 - H * 0.16), P(W * 0.5, y0)); q(P(W * 0.25, y0 - H * 0.16), P(x0 + r, y0));
    q(P(x0, y0), P(x0, y0 + r * 0.6)); l(P(x0, y1 - r)); q(P(x0, y1), P(x0 + r, y1));
  };
  cx.clearRect(0, 0, W, H);
  cx.save(); cx.beginPath(); outline(cx, 0); cx.closePath(); cx.clip();
  const gr = cx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#9a6236'); gr.addColorStop(1, '#6d3c1c');
  cx.fillStyle = gr; cx.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) { cx.fillStyle = `rgba(40,20,8,${0.08 + (i % 2) * 0.05})`; cx.fillRect(0, H * 0.16 + i * (H * 0.84) / 6, W, 2); } // plank joints
  cx.strokeStyle = 'rgba(40,20,8,0.22)'; cx.lineWidth = 2;
  for (let i = 0; i < 14; i++) { cx.beginPath(); const yy = H * (0.2 + i * 0.058); cx.moveTo(0, yy); cx.bezierCurveTo(W * 0.3, yy - 6, W * 0.6, yy + 7, W, yy - 2); cx.stroke(); } // grain
  cx.restore();
  cx.beginPath(); outline(cx, 16); cx.closePath(); cx.lineWidth = 10; cx.strokeStyle = '#2f7f84'; cx.stroke(); // teal inlay
  cx.beginPath(); outline(cx, 27); cx.closePath(); cx.lineWidth = 2.5; cx.strokeStyle = 'rgba(242,226,184,0.6)'; cx.stroke();
  for (const [px, py] of [[44, H - 44], [W - 44, H - 44], [70, H * 0.36], [W - 70, H * 0.36]]) { cx.fillStyle = '#2b1a10'; cx.beginPath(); cx.arc(px, py, 6, 0, 7); cx.fill(); cx.fillStyle = '#c9a14e'; cx.beginPath(); cx.arc(px - 1.5, py - 1.5, 3, 0, 7); cx.fill(); } // brass nails
  // lettering: measured per glyph, fitted to the inlay, set on a wave baseline
  const FONT = '"Trebuchet MS", "Segoe UI", Verdana, "DejaVu Sans", Arial, sans-serif';
  const title = 'Copacabana', maxW = W * 0.78, track = 0.02;
  let size = H * 0.4;
  const widthAt = (sz: number) => { cx.font = `900 ${sz}px ${FONT}`; return [...title].reduce((s2, ch) => s2 + cx.measureText(ch).width + sz * track, -sz * track); };
  while (widthAt(size) > maxW) size *= 0.96;
  cx.font = `900 ${size}px ${FONT}`; cx.textBaseline = 'alphabetic'; cx.textAlign = 'left';
  const tw = widthAt(size), base = H * 0.57;
  let px = (W - tw) / 2;
  const glyphs = [...title].map((ch, i) => { const g = { ch, x: px, y: base + Math.sin(i * 0.9 + 0.4) * size * 0.085, rot: Math.sin(i * 1.7) * 0.09 }; px += cx.measureText(ch).width + size * track; return g; });
  for (const pass of ['shadow', 'outline', 'fill'] as const) for (const g of glyphs) {
    const cw = cx.measureText(g.ch).width;
    cx.save(); cx.translate(g.x + cw / 2, g.y); cx.rotate(g.rot);
    if (pass === 'shadow') { cx.fillStyle = '#1f5a5c'; cx.fillText(g.ch, -cw / 2 + size * 0.05, size * 0.05); }
    if (pass === 'outline') { cx.lineJoin = 'round'; cx.lineWidth = size * 0.14; cx.strokeStyle = '#3a1e0c'; cx.strokeText(g.ch, -cw / 2, 0); }
    if (pass === 'fill') { const fg = cx.createLinearGradient(0, -size * 0.75, 0, 0); fg.addColorStop(0, '#fbf0cc'); fg.addColorStop(1, '#f0c870'); cx.fillStyle = fg; cx.fillText(g.ch, -cw / 2, 0); }
    cx.restore();
  }
  // second line: ROOM, letter-spaced, between two little wave ornaments
  const rs = size * 0.5; cx.font = `800 ${rs}px ${FONT}`;
  const room = 'R O O M', rw = cx.measureText(room).width, ry = H * 0.875;
  cx.textAlign = 'center'; cx.lineWidth = rs * 0.16; cx.strokeStyle = '#3a1e0c'; cx.lineJoin = 'round'; cx.strokeText(room, W / 2, ry); cx.fillStyle = '#f2e2b8'; cx.fillText(room, W / 2, ry);
  cx.strokeStyle = '#2f7f84'; cx.lineWidth = 6; cx.lineCap = 'round';
  for (const sd of [-1, 1]) { cx.beginPath(); const sx0 = W / 2 + sd * (rw / 2 + 24); for (let k2 = 0; k2 <= 24; k2++) { const xx = sx0 + sd * k2 * 4, yy = ry - rs * 0.32 + Math.sin(k2 * 0.6) * 7; if (k2) cx.lineTo(xx, yy); else cx.moveTo(xx, yy); } cx.stroke(); }
  const tex = w.texture(new THREE.CanvasTexture(cv));
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = w.material(new THREE.MeshLambertMaterial({ map: tex, transparent: false, alphaTest: 0.5 }));
  // the board itself: the same outline extruded 4 cm (dark timber edge), the painted face on its front
  const shape = new THREE.Shape(); const S = BAR_SIGN.w / W;
  outline(shape, 0, S, -S, -BAR_SIGN.w / 2, BAR_SIGN.h / 2); shape.closePath();
  const back = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -0.045);
  const grp = new THREE.Group();
  grp.add(compound((b) => b.add(artMats().timber, back, new THREE.Matrix4(), '#4a2814', 'main', false, 0)));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(BAR_SIGN.w, BAR_SIGN.h), mat);
  face.position.z = 0.0;
  grp.add(face);
  back.dispose();
  registerArt(artFootprint(`panel@${x.toFixed(2)},${z.toFixed(2)}`, x, y, z, yaw, BAR_SIGN.w, BAR_SIGN.h)); // DEV-04A wall-art contract (same id)
  grp.position.copy(v3(x, y, z));
  grp.rotation.y = Math.PI - yaw;
  grp.updateMatrixWorld(true);
  grp.userData.roomProbe = { x: x + Math.sin(yaw) * 0.4, y, z: z + Math.cos(yaw) * 0.4 };
  w.scene.add(grp);
  return { grp, mat, tex, canvas: cv };
}
