// Static furniture and decor (batched), plus lamp/lantern models for interactive lights.
import * as THREE from 'three';
import { type Ctx, segBox } from './arch';
import { box, cyl, compound, planMatrix, v3, getKit } from './kit';
import { registerArt, artFootprint } from './openings';
import { Asm, artMats, softBox, lathe, projectUV, bake, baseAO } from './artkit';
import { bushModel, BARK_TINT, LEAF_TINT, woodMats } from './woodkit';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { paintingTexture } from './textures';
import type { World } from '../interactions/world';
import type { Batcher } from './kit';
import { makeFire } from './fire';

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
 * DEV-03 sun lounger: a timber frame on four short legs (two little wheels at the head), a slatted bed, the back
 * raised on its stay, a thin cushion and a folded towel. Origin = footprint centre, head toward local −z.
 * Collider 0.75 × 1.95 (as the DEV-02 blockout).
 */
export function lounger(c: Ctx, x: number, z: number, y0: number, yaw: number, towel: string, frame = '#a8743f') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), dk = darker(frame, 0.8);
  for (const sx of [-1, 1]) {
    a.add(M.timber, frame, bx(0.05, 0.08, 1.95), sx * 0.33, 0.3, 0);
    a.add(M.timber, dk, bx(0.05, 0.27, 0.05), sx * 0.33, 0.135, 0.85);
    a.add(M.paint, '#2b2b2b', cg('loungerWheel', () => new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10).rotateZ(Math.PI / 2)), sx * 0.36, 0.07, -0.85);
  }
  for (let q = 0; q < 9; q++) a.add(M.timber, frame, bx(0.62, 0.02, 0.1), 0, 0.34, -0.2 + q * 0.13);
  a.add(M.timber, frame, bx(0.62, 0.02, 0.72), 0, 0.55, -0.62, { rx: 0.62 });
  a.add(M.upholstery, '#f2ead8', sb(0.6, 0.05, 1.15, 0.02), 0, 0.38, 0.32);
  a.add(M.upholstery, '#f2ead8', sb(0.6, 0.05, 0.7, 0.02), 0, 0.6, -0.6, { rx: 0.62 });
  a.add(M.upholstery, towel, sb(0.42, 0.06, 0.3, 0.02), 0.05, 0.43, 0.65, { ry: 0.12 });
  c.col.addBoxC(x, z, Math.abs(Math.sin(yaw)) > 0.7 ? 1.95 : 0.75, Math.abs(Math.sin(yaw)) > 0.7 ? 0.75 : 1.95, y0 - 0.15, y0 + 0.6);
}
/** A turned glass bottle (for bars and tables). */
export function bottleGeo() { return cg('bottle', () => lathe([[0.001, 0], [0.035, 0], [0.037, 0.18], [0.02, 0.24], [0.012, 0.3], [0.001, 0.3]], 8)); }

export function table(c: Ctx, x: number, z: number, y0: number, w: number, d: number, yaw = 0, color = '#7a4a28', h = 0.76) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw);
  const rail = darker(color, 0.86), inset = Math.min(0.07, Math.min(w, d) * 0.12);
  a.add(M.timber, color, sb(w, 0.045, d, 0.01), 0, h - 0.0225, 0);
  for (const s2 of [-1, 1]) {
    a.add(M.timber, rail, bx(w - 2 * inset - 0.06, 0.08, 0.022), 0, h - 0.085, s2 * (d / 2 - inset - 0.011));
    a.add(M.timber, rail, bx(0.022, 0.08, d - 2 * inset - 0.06), s2 * (w / 2 - inset - 0.011), h - 0.085, 0);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, rail, taperLeg(h - 0.045, 0.034, 0.024), sx * (w / 2 - inset - 0.01), 0, sz * (d / 2 - inset - 0.01));
  // a long table gets a centre stretcher (it is a trestle-like dining table, not a sheet on four sticks)
  if (Math.max(w, d) > 2.2) a.add(M.timber, darker(color, 0.75), w > d ? bx(w - 2 * inset - 0.1, 0.05, 0.04) : bx(0.04, 0.05, d - 2 * inset - 0.1), 0, 0.18, 0);
  collide(c, x, z, yaw, w, d, h, y0);
}

export function roundTable(c: Ctx, x: number, z: number, y0: number, r: number, color = '#7a4a28') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, 0);
  a.add(M.timber, color, cg(`rt${f3(r)}`, () => projectUV(lathe([[0, 0], [r - 0.012, 0], [r, 0.014], [r, 0.03], [r - 0.012, 0.045], [0, 0.045]], 24), 1)), 0, 0.715, 0); // top surface at 0.76 (items rest on it)
  a.add(M.timber, darker(color, 0.8), cg('rtPed', () => projectUV(lathe([[0.001, 0], [0.09, 0], [0.09, 0.04], [0.05, 0.1], [0.045, 0.58], [0.06, 0.65], [0.08, 0.715], [0.001, 0.715]], 10), 1, 'y')), 0, 0, 0);
  for (const yaw of [0, Math.PI / 2]) a.add(M.timber, darker(color, 0.75), bx(0.6, 0.05, 0.06), 0, 0.025, 0, { ry: yaw });
  c.col.addCircle(x, z, r * 0.9, y0, y0 + 0.76);
}

export function chair(c: Ctx, x: number, z: number, y0: number, yaw: number, seat = '#b5643c', collideIt = true) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), wood = '#6b4426', dk = darker(wood, 0.85);
  // ladder-back side chair: back posts run up from the floor, front legs taper, a seat frame with an upholstered pad,
  // a curved-looking top rail and two slats, stretchers between the legs
  for (const sx of [-1, 1]) {
    a.add(M.timber, dk, taperLeg(0.43, 0.022, 0.018), sx * 0.19, 0, 0.18);
    a.add(M.timber, wood, bx(0.034, 0.95, 0.034), sx * 0.19, 0.475, -0.19, { rx: -0.06 });
    a.add(M.timber, dk, bx(0.02, 0.022, 0.34), sx * 0.19, 0.16, 0);
  }
  a.add(M.timber, dk, bx(0.34, 0.022, 0.02), 0, 0.2, 0.18);
  a.add(M.timber, wood, sb(0.45, 0.035, 0.43, 0.008), 0, 0.447, 0);
  if (seat) a.add(M.upholstery, seat, sb(0.39, 0.045, 0.37, 0.018), 0, 0.485, 0.015);
  a.add(M.timber, wood, sb(0.42, 0.075, 0.03, 0.01), 0, 0.88, -0.235, { rx: -0.06 });
  for (const yy of [0.62, 0.75]) a.add(M.timber, wood, bx(0.36, 0.045, 0.02), 0, yy, -0.215, { rx: -0.06 });
  if (collideIt) c.col.addCircle(x, z, 0.26, y0, y0 + 0.9);
}

export function sofa(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 2.2, color = '#5f7a45') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw);
  const col = new THREE.Color(color), dark = darker(color, 0.78), D = 0.9, armW = 0.17, n = w > 1.5 ? 3 : 1;
  // upholstered seat: turned feet, a base darker toward the floor, crowned seat and back cushions, rolled arms
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, '#4e3320', taperLeg(0.08, 0.03, 0.022), sx * (w / 2 - 0.08), 0, sz * (D / 2 - 0.08));
  a.add(M.upholstery, col, cg(`sofaBase${f3(w)}`, () => bake(projectUV(softBox(w - 0.02, 0.27, D - 0.04, 0.035, 2, 1), 0.25), baseAO(-0.135, 0.16, 0.7))), 0, 0.215, 0.01);
  const innerW = w - 2 * armW, seatW = innerW / n;
  for (let i = 0; i < n; i++) {
    a.add(M.upholstery, col, sb(seatW - 0.015, 0.13, D - 0.2, 0.045, 2), -innerW / 2 + seatW * (i + 0.5), 0.41, 0.07);
    a.add(M.upholstery, col, sb(seatW - 0.03, 0.42, 0.13, 0.05, 2), -innerW / 2 + seatW * (i + 0.5), 0.68, -D / 2 + 0.26, { rx: 0.2 });
  }
  a.add(M.upholstery, dark, cg(`sofaBack${f3(w)}`, () => bake(projectUV(softBox(w, 0.6, 0.17, 0.05, 2, 1), 0.25), baseAO(-0.3, 0.2, 0.8))), 0, 0.62, -D / 2 + 0.085, { rx: 0.1 });
  for (const sx of [-1, 1]) {
    a.add(M.upholstery, col, sb(armW, 0.44, D - 0.04, 0.05, 2), sx * (w / 2 - armW / 2), 0.31, 0.0);
    a.add(M.upholstery, col, cg('sofaRoll', () => projectUV(new THREE.CylinderGeometry(0.08, 0.08, D - 0.06, 12).rotateX(Math.PI / 2), 0.25)), sx * (w / 2 - armW / 2 + 0.01), 0.55, 0.0);
  }
  // throw pillows (sofa) in the room's accent family: ochre, oxblood, ceramic blue
  if (n > 1) ['#b3813f', '#7a2e2a'].forEach((pc, i) => a.add(M.upholstery, pc, sb(0.38, 0.36, 0.12, 0.05, 2), (i ? 1 : -1) * (innerW / 2 - 0.25), 0.66, -D / 2 + 0.36, { rx: 0.3, ry: (i ? -1 : 1) * 0.3 }));
  collide(c, x, z, yaw, w, 0.9, 0.9, y0);
}

export function armchair(c: Ctx, x: number, z: number, y0: number, yaw: number, color = '#6b7f9a') {
  sofa(c, x, z, y0, yaw, 1.0, color);
}

const BOOK_PALETTES: Record<string, string[]> = {
  leather: ['#7a2f2a', '#8a4a2a', '#5a3a28', '#9a6a3a', '#6b2a2a'],
  navy: ['#2f3f5f', '#3f5070', '#26344a', '#5a6a80', '#7a6a4a'],
  olive: ['#4f5f32', '#6a6a3a', '#3f4a2a', '#8a7a4a', '#5a4a2a'],
  linen: ['#cbb98f', '#a88f62', '#d8c8a0', '#8a7a5a', '#b8a070'],
};
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
  let seed = Math.floor(x * 7 + z * 13);
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i <= shelves; i++) {
    const yy = y0 + 0.09 + i * ((h - 0.14) / shelves) - (i === shelves ? 0.04 : 0);
    a.add(M.timber, case_, bx(w - 0.08, 0.03, depth - 0.03), 0, yy - y0 + 0.015, 0);
    if (i < shelves) {
      // books in runs with gaps, the odd one leaning, a short stack lying flat (real shelves are not full)
      let bx2 = -w / 2 + 0.08;
      while (bx2 < w / 2 - 0.12) {
        if (r() < 0.07) { bx2 += 0.08 + r() * 0.12; continue; }
        if (r() < 0.06) {
          for (let q = 0; q < 3; q++) P(c, k.M.paint, pal[Math.floor(r() * pal.length)], x, z, yaw, bx2 + 0.12, yy + 0.03 + q * 0.035, 0, 0.22, 0.034, 0.17);
          bx2 += 0.26; continue;
        }
        const bw = 0.03 + r() * 0.05, bh = 0.22 + r() * 0.1;
        P(c, k.M.paint, pal[Math.floor(r() * pal.length)], x, z, yaw, bx2 + bw / 2, yy + 0.03, 0.01 + r() * 0.02, bw, bh, 0.2 + r() * 0.04);
        bx2 += bw + 0.004;
      }
    }
  }
  collide(c, x, z, yaw, w, depth + 0.05, h, y0);
}

export function bed(c: Ctx, x: number, z: number, y0: number, yaw: number) {
  const k = c.k;
  P(c, k.M.wood, '#6b4426', x, z, yaw, 0, y0, 0, 1.6, 0.4, 2.1, 1);
  P(c, k.M.paint, '#efe6d6', x, z, yaw, 0, y0 + 0.4, 0, 1.5, 0.2, 2.0);
  P(c, k.M.paint, '#7a3a3a', x, z, yaw, 0, y0 + 0.6, 0.25, 1.55, 0.06, 1.3);
  P(c, k.M.paint, '#ffffff', x, z, yaw, 0, y0 + 0.6, -0.75, 1.2, 0.14, 0.4);
  P(c, k.M.wood, '#6b4426', x, z, yaw, 0, y0, -1.05, 1.6, 1.1, 0.08, 1);
  collide(c, x, z, yaw, 1.6, 2.15, 0.8, y0);
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
  a.add(M.ceramic, '#e2dfd5', bx(W, 0.04, D), 0, bot + 0.02, zc); // floor of the bowl (top 0.685)
  a.add(M.paint, '#3a3c3a', cg('sinkDrain', () => new THREE.CylinderGeometry(0.035, 0.035, 0.006, 12)), 0, bot + 0.04 + 0.004, zc);
  a.add(M.brass, '#b8b8b0', cg('sinkDrainRing', () => new THREE.TorusGeometry(0.04, 0.006, 4, 14).rotateX(Math.PI / 2)), 0, bot + 0.04 + 0.006, zc);
  // bridge tap: a pillar on the worktop strip, a spout arching forward over the bowl
  a.add(M.brass, '#c9a14e', bx(0.03, 0.1, 0.03), 0, 0.9 + 0.05, -0.24);
  a.add(M.brass, '#c9a14e', cg('tapArc', () => new THREE.TorusGeometry(0.1, 0.012, 5, 10, Math.PI)), 0, 1.0, -0.14, { ry: Math.PI / 2 });
}

export function rug(c: Ctx, x: number, z: number, y: number, w: number, d: number, yaw = 0, tint = '#ffffff') {
  box(c.b, c.k.M.rug, tint, x, y, z, w, 0.012, d, { yaw, chunk: c.chunk, shadow: false });
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
  P(c, k.M.paint, '#b8892f', x, z, yaw, 0, y - 0.12, -0.03 + 0.03, 0.1, 0.24, 0.04);
  P(c, k.M.paint, '#b8892f', x, z, yaw, 0, y - 0.02, 0.08, 0.04, 0.04, 0.2);
  const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)];
  cyl(c.b, k.M.glow, '#ffe2a8', x + fx * 0.18, y, z + fz * 0.18, 0.07, 0.11, 0.16, 10, { chunk: c.chunk, shadow: false, jitter: 0 });
  w.lamps.push({ id: `fixed.${x.toFixed(2)}.${z.toFixed(2)}`, pos: v3(x + fx * 0.4, y + 0.1, z + fz * 0.4), color: 0xffc77a, intensity, distance, on: () => true });
}


// ---------------------------------------------------------------- iteration 3 decor kit (rounded, chunky timber, warm textiles)
/** Bed with headboard, mattress, duvet in a given colour and two pillows. Faces plan heading yaw (foot end). */
export function bed2(c: Ctx, x: number, z: number, y0: number, yaw: number, duvet = '#7a3a3a', wood = '#6b4426', width = 1.6) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), dk = darker(wood, 0.8);
  // panelled headboard between posts, side rails on short legs, a mattress, a duvet turned down, two pillows
  for (const sx of [-1, 1]) {
    a.add(M.timber, wood, bx(0.07, 1.15, 0.07), sx * (width / 2 + 0.02), 0.575, -1.06);
    a.add(M.timber, dk, cg('bedFinial', () => lathe([[0.001, 0], [0.045, 0], [0.05, 0.03], [0.03, 0.07], [0.001, 0.09]], 8)), sx * (width / 2 + 0.02), 1.15, -1.06);
    a.add(M.timber, wood, bx(0.06, 0.5, 0.06), sx * (width / 2 + 0.02), 0.25, 1.03);
    a.add(M.timber, wood, sb(0.04, 0.2, 2.06, 0.008), sx * (width / 2), 0.3, 0);
  }
  a.add(M.timber, wood, sb(width, 0.6, 0.04, 0.01), 0, 0.75, -1.06);
  a.add(M.timber, dk, sb(width + 0.12, 0.06, 0.1, 0.01), 0, 1.17, -1.06);
  a.add(M.timber, wood, sb(width, 0.32, 0.04, 0.01), 0, 0.36, 1.04);
  a.add(M.upholstery, '#efe6d6', sb(width - 0.08, 0.2, 2.0, 0.05, 2), 0, 0.48, 0);
  a.add(M.upholstery, duvet, sb(width + 0.02, 0.1, 1.5, 0.045, 2), 0, 0.6, 0.24);
  a.add(M.upholstery, darker(duvet, 0.92), sb(width - 0.02, 0.07, 0.24, 0.03, 2), 0, 0.62, -0.5);
  for (const sx of [-1, 1]) a.add(M.upholstery, '#fbf6ea', sb(width * 0.4, 0.13, 0.36, 0.05, 2), sx * width * 0.24, 0.63, -0.8, { rx: 0.25 });
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

/** Drapes either side of a window (on a wall facing heading yaw), with a rod. */
export function curtains(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.3, h = 1.9, color = '#3f6f78') {
  const k = c.k;
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) P(c, k.M.paint, new THREE.Color(color).multiplyScalar(0.9 + i * 0.06), x, z, yaw, s * (w / 2 + 0.05 + i * 0.07), y0, 0.06 + (i % 2) * 0.03, 0.09, h, 0.05);
  P(c, k.M.paint, '#8a6a3a', x, z, yaw, 0, y0 + h + 0.02, 0.05, w + 0.7, 0.04, 0.04);
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

/** Slanted reading lectern; returns the plan point and height of the book rest. */
export function lectern(c: Ctx, x: number, z: number, y0: number, yaw: number, wood = '#5a3a22') {
  const k = c.k;
  P(c, k.M.wood, wood, x, z, yaw, 0, y0, 0, 0.5, 0.05, 0.4, 1);
  P(c, k.M.wood, wood, x, z, yaw, 0, y0, 0, 0.12, 1.0, 0.12, 1);
  box(c.b, k.M.wood, new THREE.Color(wood).multiplyScalar(1.15), x, y0 + 1.0, z, 0.62, 0.05, 0.46, { yaw, rx: -0.45, chunk: c.chunk, uv: 0.6 });
  c.col.addCircle(x, z, 0.3, y0, y0 + 1.2);
  return { x, z, y: y0 + 1.06 };
}
export function bathtub(c: Ctx, x: number, z: number, y0: number, yaw: number) {
  const k = c.k;
  P(c, k.M.paint, '#f4f1ea', x, z, yaw, 0, y0 + 0.08, 0, 0.8, 0.5, 1.7);
  P(c, k.M.paint, '#bfe0e6', x, z, yaw, 0, y0 + 0.5, 0, 0.62, 0.02, 1.5);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P(c, k.M.paint, '#c9a44c', x, z, yaw, sx * 0.3, y0, sz * 0.7, 0.08, 0.1, 0.08);
  collide(c, x, z, yaw, 0.8, 1.7, 0.6, y0);
}
export function ladder(c: Ctx, x: number, z: number, y0: number, yaw: number, h = 3.0, wood = '#8a5a33') {
  const k = c.k;
  for (const s of [-1, 1]) P(c, k.M.wood, wood, x, z, yaw, s * 0.22, y0, 0, 0.05, h, 0.05, 0.5);
  for (let y = 0.3; y < h; y += 0.3) P(c, k.M.wood, wood, x, z, yaw, 0, y0 + y, 0, 0.44, 0.04, 0.05, 0.5);
}
/** Small telescope on a tripod pointing out of a window. */
/**
 * Brass refractor on an alt-az head over a timber tripod. It points along plan heading `yaw`, its tube raised by `alt`
 * (rad). DEV-04A: the objective end (dew shield) faces `yaw` and the eyepiece sits at the LOW back end of the tube
 * (it used to sit under the dew shield, at the wrong end); `alt` lets the attic telescope aim through its roof window.
 */
export const TELESCOPE = { pivotY: 1.38, back: 0.42, front: 0.4 };
export function telescope(c: Ctx, x: number, z: number, y0: number, yaw: number, alt = 0.35) {
  // DEV-03: a brass refractor (tapered tube, dew shield, eyepiece) on an alt-az head over a timber tripod with a spreader
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), oak = '#5a3a22', brass = '#b8892f';
  for (let i = 0; i < 3; i++) {
    const t = yaw + (i / 3) * Math.PI * 2, fx = x + Math.sin(t) * 0.26, fz = z + Math.cos(t) * 0.26;
    segBox(c, M.timber, oak, [fx, y0, fz], [x + Math.sin(t) * 0.04, y0 + 1.2, z + Math.cos(t) * 0.04], 0.035, 0.025);
    segBox(c, M.timber, oak, [x + Math.sin(t) * 0.17, y0 + 0.42, z + Math.cos(t) * 0.17], [x, y0 + 0.42, z], 0.025, 0.02);
  }
  a.add(M.timber, darker(oak, 0.8), cg('tsHead', () => lathe([[0.001, 0], [0.07, 0], [0.06, 0.06], [0.03, 0.1], [0.001, 0.1]], 8)), 0, 1.18, 0);
  a.add(M.brass, darker(brass, 0.7), bx(0.05, 0.12, 0.06), 0, 1.3, 0);
  // tube along plan-local +z (front = objective = dew shield), centred on the head's pivot, raised by alt
  const tube = cg('tsTube2', () => lathe([[0.001, 0], [0.032, 0], [0.036, 0.05], [0.042, 0.62], [0.055, 0.64], [0.055, 0.82], [0.001, 0.82]], 12).translate(0, -TELESCOPE.back, 0).rotateX(-Math.PI / 2));
  a.add(M.brass, brass, tube, 0, TELESCOPE.pivotY, 0, { rx: alt });
  const eb = TELESCOPE.back + 0.05; // the eyepiece continues the tube's axis behind its back end
  a.add(M.timber, '#2b2622', cg('tsEye2', () => new THREE.CylinderGeometry(0.016, 0.016, 0.1, 8).rotateX(-Math.PI / 2)), 0, TELESCOPE.pivotY - eb * Math.sin(alt), -eb * Math.cos(alt), { rx: alt });
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
/** Stacked board-game boxes (lid band over a darker base), slightly askew. */
export function gameBoxes(c: Ctx, x: number, z: number, y: number, yaw: number, colors: string[]) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y, z, yaw);
  colors.forEach((col, i) => {
    const w = 0.4 - i * 0.04, d = 0.28 - i * 0.02, h = 0.07, ry = (i % 2 ? 1 : -1) * 0.08 * i;
    a.add(M.paint, darker(col, 0.75), sb(w - 0.01, h - 0.02, d - 0.01, 0.004), 0, i * h + (h - 0.02) / 2, 0, { ry });
    a.add(M.paint, col, sb(w, 0.035, d, 0.004), 0, i * h + h - 0.0175, 0, { ry });
    a.add(M.paint, '#f2ead8', bx(w * 0.5, 0.002, d * 0.3), -0.03, i * h + h + 0.001, 0.02, { ry });
  });
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
 * DEV-04A "Copacabana Room" bar sign (owner direction; replaces the corridor and outdoor name boards): a carved timber
 * board, warm wood with a teal border and cream lettering, mounted on the bar's own canopy. Faces plan heading yaw.
 */
export function barSign(w: World, x: number, y: number, z: number, yaw: number) {
  return canvasPanel(w, x, y, z, yaw, 1.6, 0.36, (cx, W, H) => {
    const gr = cx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#8a5530'); gr.addColorStop(1, '#6d3c1c');
    cx.fillStyle = gr; cx.fillRect(0, 0, W, H);
    cx.strokeStyle = 'rgba(40,20,8,0.35)'; cx.lineWidth = 2; // a little wood grain
    for (let i = 0; i < 7; i++) { cx.beginPath(); cx.moveTo(0, H * (0.12 + i * 0.13)); cx.bezierCurveTo(W * 0.3, H * (0.1 + i * 0.13), W * 0.6, H * (0.16 + i * 0.13), W, H * (0.12 + i * 0.13)); cx.stroke(); }
    cx.strokeStyle = '#4e8690'; cx.lineWidth = 9; cx.strokeRect(9, 9, W - 18, H - 18);
    cx.font = `bold ${Math.round(H * 0.5)}px Georgia, serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.lineWidth = 6; cx.strokeStyle = '#3a1e0c'; cx.strokeText('Copacabana Room', W / 2, H * 0.54);
    cx.fillStyle = '#f2e2b8'; cx.fillText('Copacabana Room', W / 2, H * 0.54);
  }, 512, '#5a3418');
}
