// DEV-04D D2: the FLW key family (K3-001…004) and the FLW S3 reference pieces as stylised low / mid-poly models.
//
// Conventions (art kit): every piece is an `Asm` assembly in plan-local space (lx right, ly up, lz = the piece's
// facing). It is batched into the caller's room chunk with the shared art materials: no new material, no texture.
// Each piece runs the DEV-04B construction audit (Asm.begin / end: no floating or disconnected parts) and records
// its triangles under its FLW id. Wall pieces register a footprint with the DEV-04A wall-art contract (`relief@x,z`).
// Faceted forms (carved wood, papier-maché, clay relief) use flat-shaded icosahedra ("gems"), matching the faceted
// carving the sheets show.
import * as THREE from 'three';
import { compound, type Batcher } from './kit';
import type { Ctx } from './arch';
import type { World } from '../interactions/world';
import { Asm, artMats, lathe, projectUV } from './artkit';
import { joinery } from './furniture';
import { registerArt, artFootprint } from './openings';
import { buildMedallion, buildMoon, buildSloop, buildSwallows } from './d3bAssets';
import { woodMats } from './woodkit';
import { PROP3D, KEY_SPECS, KEY_SCALE as KS, KEY_PRESENT, type KeyItem } from '../content/props3d';

const { sb, bx, cg } = joinery;
type V3 = [number, number, number];

// ------------------------------------------------------------------------------------------------ geometry helpers
/** Flat-shaded copy (one normal per face): the carved facet look. */
function flat(g: THREE.BufferGeometry) {
  const n = g.index ? g.toNonIndexed() : g;
  if (n !== g) g.dispose();
  n.deleteAttribute('normal');
  n.computeVertexNormals();
  return n;
}
/** Faceted ellipsoid (icosahedron, detail 0 = 20 tris, 1 = 80 tris), cached per size. */
const gem = (sx: number, sy: number, sz: number, detail = 0) =>
  cg(`d2gem${sx.toFixed(4)},${sy.toFixed(4)},${sz.toFixed(4)},${detail}`, () => projectUV(flat(new THREE.IcosahedronGeometry(1, detail).scale(sx, sy, sz)), 2));
/** Flat faceted lozenge (octahedron, 8 tris): leaves, petals, small relief marks. */
const oct = (sx: number, sy: number, sz: number) => cg(`d2oct${sx.toFixed(4)},${sy.toFixed(4)},${sz.toFixed(4)}`, () => projectUV(flat(new THREE.OctahedronGeometry(1, 0).scale(sx, sy, sz)), 2));
/** Plan-local point → three.js local vector (local forward lz is three −z). */
const P = (p: V3) => new THREE.Vector3(p[0], p[1], -p[2]);
const UP = new THREE.Vector3(0, 1, 0);
/** A tapered strut from a to b (plan-local), radius ra at a and rb at b. Not cached: the caller adds it once. */
function strut(a: V3, b: V3, ra: number, rb = ra, seg = 5, open = false) {
  const A = P(a), B = P(b), d = B.clone().sub(A);
  const g = new THREE.CylinderGeometry(rb, ra, d.length(), seg, 1, open);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
  g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  return projectUV(g, 2);
}
/** Flat shape (x right, y up) extruded `depth` towards the viewer (+lz), its back face at lz = 0. */
function slab(pts: [number, number][], depth: number, bevel = 0) {
  // the shape is mirrored in x before extrusion and the solid turned by scale(−1, 1, −1) (a 180° turn about y: no
  // winding flip), so it ends up as drawn, extruded towards three −z = local +lz
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(-x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 1, curveSegments: 6 });
  g.scale(-1, 1, -1);
  return projectUV(flat(g), 2);
}
/** Add a one-off geometry already in plan-local coordinates, then free it. */
function put(a: Asm, mat: THREE.Material, color: string, g: THREE.BufferGeometry, o: { s?: V3; rz?: number; at?: V3 } = {}) {
  const [x, y, z] = o.at ?? [0, 0, 0];
  a.add(mat, color, g, x, y, z, { rz: o.rz, s: o.s });
  g.dispose();
}
const wallPiece = (id: string, x: number, y: number, z: number, yaw: number, w: number, h: number) =>
  registerArt(artFootprint(`relief@${x.toFixed(2)},${z.toFixed(2)}`, x, y, z, yaw, w, h)); // id = registry key, not a gameplay id

// ------------------------------------------------------------------------------------------------ K3 key family
// One builder for all four keys: bow + collar stack + shank + per-key bit + split ring + tag / hanger / drop. The keys
// are told apart by silhouette (trefoil, ring, square, oval bow; size; bit) and by what hangs on them, never by colour
// alone. Game scale ×1.3 (owner K1), so a key reads in a drawer at arm's length. A key lies flat: its long axis is
// local z (bow towards −z), its underside at y = 0. Per-key dimensions: KEY_SPECS (src/content/props3d.ts).
/** Build a K3 key into batcher `b` at plan (x, y, z) with heading `yaw` (a compound's local frame: pass 0, 0, 0, 0). */
export function addKey(b: Batcher, item: KeyItem, x = 0, y = 0, z = 0, yaw = 0) {
  const K = KEY_SPECS[item], M = artMats(), metal = K.metal === 'brass' ? M.brass : M.paint;
  const a = new Asm(b, 'main', x, y, z, yaw).begin(`key:${item}`);
  const L = K.len, cR = K.shaftR * 1.55, yc = cR, t = cR * 0.92; // centre line height = the collars' radius
  const zb = -L / 2 + K.bowH / 2; // bow centre
  // bow
  if (K.bow === 'trefoil') {
    const rl = (K.bowW / 2 - t) / 1.91, d = rl * 1.05;
    const lobe = cg(`keyLobe${rl.toFixed(4)}`, () => new THREE.TorusGeometry(rl, t, 4, 8).rotateX(Math.PI / 2));
    for (const [lx, lz] of [[0, zb - d * 0.6], [-d * 0.87, zb + d * 0.45], [d * 0.87, zb + d * 0.45]] as const) a.add(metal, K.col, lobe, lx, yc, lz);
  } else if (K.bow === 'square') {
    const R = (K.bowW - 2 * t) / Math.SQRT2;
    a.add(metal, K.col, cg(`keySq${R.toFixed(4)}`, () => new THREE.TorusGeometry(R, t, 4, 4).rotateZ(Math.PI / 4).rotateX(Math.PI / 2)), 0, yc, zb);
  } else {
    const R = K.bowW / 2 - t;
    a.add(metal, K.col, cg(`keyRing${R.toFixed(4)}`, () => new THREE.TorusGeometry(R, t, 5, 14).rotateX(Math.PI / 2)), 0, yc, zb, { s: K.bow === 'oval' ? [1, 1, (K.bowH - 2 * t) / (K.bowW - 2 * t)] : undefined });
  }
  // neck, collar stack, shank, tip collar (cylinders along local z)
  const z0 = zb + K.bowH / 2 - t * 0.6, cl = 0.0045 * KS;
  const rod = (r: number, len: number, seg: number) => cg(`keyRod${r.toFixed(4)},${len.toFixed(4)},${seg}`, () => new THREE.CylinderGeometry(r, r, len, seg).rotateX(Math.PI / 2));
  a.add(metal, K.col, rod(K.shaftR * 1.15, 0.006 * KS, 6), 0, yc, z0 + 0.003 * KS);
  for (let i = 0; i < 2; i++) a.add(metal, K.dark, rod(cR, cl, 6), 0, yc, z0 + 0.006 * KS + cl / 2 + i * (cl + 0.0025 * KS));
  const s0 = z0 + 0.006 * KS + 2 * cl + 0.0025 * KS, s1 = L / 2 - 0.003 * KS;
  a.add(metal, K.col, rod(K.shaftR, s1 - s0, 6), 0, yc, (s0 + s1) / 2);
  a.add(metal, K.dark, rod(K.shaftR * 1.25, 0.004 * KS, 6), 0, yc, L / 2 - 0.002 * KS);
  // bit: a web along the shank's tip with stepped teeth, lying flat (one side, +x)
  const n = K.teeth.length, bitLen = Math.min(0.03 * KS, (L / 2 - s0) * 0.7), th = K.shaftR * 1.3;
  const bz0 = L / 2 - 0.005 * KS - bitLen;
  a.add(metal, K.col, bx(K.bitW * 0.45, th, bitLen), K.shaftR * 0.6 + K.bitW * 0.225, yc, bz0 + bitLen / 2);
  K.teeth.forEach((tw, i) => {
    const tl = (bitLen / n) * 0.7, tz = bz0 + (bitLen / n) * (i + 0.5);
    a.add(metal, K.col, bx(K.bitW * tw, th, tl), K.shaftR * 0.6 + (K.bitW * tw) / 2, yc, tz);
  });
  // split ring through the bow's far end, and what hangs on it (fanned out to the side, lying flat)
  const rz = -L / 2 + t * 0.4, rr = 0.0065 * KS, ang = 2.45, ux = Math.sin(ang), uz = Math.cos(ang);
  const ringCol = item === 'studyKey' ? '#c8b896' : item === 'shedKey' ? '#6a625a' : '#b0623a'; // string, steel, copper
  a.add(item === 'studyKey' ? M.paint : metal, ringCol, cg(`keySplit${rr.toFixed(4)}`, () => new THREE.TorusGeometry(rr, 0.0011 * KS, 3, 10).rotateX(Math.PI / 2)), rr * 0.6, 0.0012 * KS, rz);
  const hang = (len: number) => [rr * 0.6 + ux * (rr + len / 2), rz + uz * (rr + len / 2)] as const;
  if (item === 'frontKey') { // red leather tag with a brass name plate (no lettering)
    const tl = 0.05 * KS, [hx, hz] = hang(tl);
    a.add(M.paint, '#8e2a22', bx(0.024 * KS, 0.0035, tl), hx, 0.00175, hz, { ry: ang });
    a.add(metal, '#c9a24c', bx(0.013 * KS, 0.0012, tl * 0.62), hx, 0.0035 + 0.0006, hz, { ry: ang });
  } else if (item === 'studyKey') { // ivory paper tag, blank but for a faint ruled line
    const tl = 0.036 * KS, [hx, hz] = hang(tl);
    a.add(M.paint, '#efe6cc', bx(0.019 * KS, 0.0016, tl), hx, 0.0008, hz, { ry: ang });
    a.add(M.paint, '#a89878', bx(0.011 * KS, 0.0004, 0.0012), hx, 0.0018, hz, { ry: ang });
  } else if (item === 'shedKey') { // wooden house-shaped hanger with a window, its roof towards the ring
    const hw = 0.03 * KS, hh = 0.04 * KS, [hx, hz] = hang(hh);
    a.add(M.paint, '#9a6a3e', cg(`keyHouse${hw.toFixed(4)}`, () => {
      const s = new THREE.Shape([[-hw / 2, -hh / 2], [hw / 2, -hh / 2], [hw / 2, hh * 0.12], [0, hh / 2], [-hw / 2, hh * 0.12]].map(([u, v]) => new THREE.Vector2(u, v)));
      return flat(new THREE.ExtrudeGeometry(s, { depth: 0.005, bevelEnabled: false }).translate(0, 0, -0.0025).rotateX(Math.PI / 2));
    }), hx, 0.0025, hz, { ry: ang });
    a.add(M.paint, '#4a3020', bx(0.009 * KS, 0.0008, 0.011 * KS), hx - ux * 0.004 * KS, 0.0053, hz - uz * 0.004 * KS, { ry: ang });
    a.add(M.paint, K.dark, bx(K.bitW * 0.5, th * 1.02, 0.006 * KS), K.shaftR * 0.6 + K.bitW * 0.3, yc, bz0 + 0.004 * KS); // rust bloom on the bit
  } else { // green glass teardrop, narrow end to the ring
    const r = 0.011 * KS, [hx, hz] = hang(0.03 * KS);
    a.add(M.ceramic, '#3f8f5e', cg(`keyDrop${r.toFixed(4)}`, () => lathe([[0.001, 0], [r * 0.75, r * 0.35], [r, r * 1.1], [r * 0.8, r * 1.8], [r * 0.35, r * 2.4], [0.001, r * 2.7]], 8)), hx + ux * 0.012 * KS, r, hz + uz * 0.012 * KS, { rx: Math.PI / 2, ry: ang });
  }
  a.end({ ground: false });
}

/**
 * D2-R key presentation (owner): the key's visible meshes are drawn ×KEY_PRESENT about their own origin (the underside
 * stays on its support). Call before `makePickup`, which adds the (unscaled) hit box: item, pickup, hit box and reach
 * are unchanged.
 */
export function presentKey<T extends THREE.Object3D>(grp: T): T {
  for (const m of grp.children) m.scale.setScalar(KEY_PRESENT);
  return grp;
}
/**
 * D2-R: what a key lies on, inside its drawer (a child of the drawer's slider, so it rides with it and stays when the key
 * is taken). Each container has its own support, chosen for contrast with that key:
 * - `felt` (front key, home dresser): a dark green felt liner under the brass key and red tag;
 * - `linen` (shed key, hall drawer): a pale folded linen cloth under the dark iron key and its wooden hanger;
 * - `blotter` (study key, library desk): a dark leather blotter under the ivory archive card.
 * Height of the support's top above its origin: LINER_TOP.
 */
export const LINER_TOP = { felt: 0.006, linen: 0.008, blotter: 0.006 } as const;
export function keyLiner(kind: keyof typeof LINER_TOP) {
  return compound((b) => {
    const M = artMats(), a = new Asm(b, 'main', 0, 0, 0, 0);
    if (kind === 'felt') a.add(M.paint, '#2e4a3c', sb(0.32, 0.006, 0.34, 0.0025), 0, 0.003, 0);
    else if (kind === 'linen') { a.add(M.paint, '#e8dfca', sb(0.3, 0.008, 0.34, 0.003), 0, 0.004, 0); a.add(M.paint, '#ddd2ba', sb(0.3, 0.006, 0.05, 0.003), 0, 0.011, 0.15); } // the folded-back end, clear of the key
    else a.add(M.paint, '#3a2a22', sb(0.24, 0.006, 0.32, 0.0025), 0, 0.003, 0);
  });
}
/**
 * A liner is drawn only while its drawer is open: shut inside the drawer it cannot be seen, and as its own mesh it would
 * otherwise cost a draw call in every view that frames the closed chest (measured: +1 call in the hall / living views).
 */
export function linerWhenOpen(w: World, liner: THREE.Object3D, isOpen: () => boolean) {
  w.onSync(() => { liner.visible = isOpen(); });
}
/** D2-R: the conservatory key's support in the service hatch: a small oval cream enamel dish (static, in the room batch). */
export function hatchDish(c: Ctx, x: number, y: number, z: number) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y, z, 0);
  a.add(M.ceramic, '#efe8da', cg('hatchDish', () => lathe([[0.001, 0], [0.095, 0], [0.105, 0.008], [0.112, 0.016], [0.106, 0.018], [0.096, 0.01], [0.001, 0.01]], 16).scale(0.72, 1, 1.3)), 0, 0, 0);
  a.add(M.ceramic, '#2f56a0', cg('hatchDishRim', () => new THREE.TorusGeometry(0.108, 0.0025, 3, 16).rotateX(Math.PI / 2).scale(0.72, 1, 1.3)), 0, 0.016, 0);
}
/** Top of the hatch dish's floor above its base (where the key lies). */
export const HATCH_DISH_FLOOR = 0.01;

// ------------------------------------------------------------------------------------------------ S3 pieces
const anchor = (id: string) => { const p = PROP3D[id]; if (!p) throw new Error(`d2props: ${id} not in PROPS3D`); return p; };

/** FLW-S3-004 Houten vogelbeeld: a faceted carved songbird in oiled oak, ≈ 22 cm, standing on its own feet. */
export function carvedBird(c: Ctx) {
  const p = anchor('FLW-S3-004'), M = artMats(), oak = '#a8703e', dk = '#7e5230';
  const a = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw).begin(p.id);
  for (const s of [-1, 1]) {
    a.add(M.timber, dk, gem(0.022, 0.009, 0.034), s * 0.022, 0.009, 0.006); // foot block
    a.add(M.timber, oak, bx(0.014, 0.05, 0.016), s * 0.02, 0.04, 0.0); // leg
    a.add(M.timber, dk, gem(0.012, 0.045, 0.06), s * 0.056, 0.115, -0.012, { rx: -0.35 }); // folded wing
  }
  a.add(M.timber, oak, gem(0.058, 0.066, 0.072, 1), 0, 0.112, 0); // body
  a.add(M.timber, oak, gem(0.038, 0.036, 0.04, 1), 0, 0.178, 0.022); // head
  a.add(M.timber, dk, gem(0.022, 0.008, 0.05), 0, 0.085, -0.085, { rx: -0.45 }); // tail
  a.add(M.timber, dk, cg('birdBeak', () => projectUV(new THREE.ConeGeometry(0.011, 0.034, 4).rotateX(-Math.PI / 2), 2)), 0, 0.174, 0.072);
  for (const s of [-1, 1]) a.add(M.paint, '#2a1c12', gem(0.0055, 0.0055, 0.004), s * 0.026, 0.188, 0.044, { ry: s * 0.9 });
  a.end();
}

/** FLW-S3-017 Terracotta bloemmedaillon: a shallow terracotta disc (Ø 35 cm) with a raised bud on paired leaves. */
/** FLW-S3-033 Smeedijzeren haardscherm (original BBQ plate): shouldered arch, scrollwork and A-frame feet. */
export function fireScreen(c: Ctx) {
  const p = anchor('FLW-S3-033'), M = artMats(), iron = '#2a2724', iron2 = '#5a534c'; // the raised scrollwork catches light
  const a = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw).begin(p.id);
  const W = 0.7, y0 = 0.03;
  a.add(M.paint, iron, cg('screenPlate', () => {
    const pts: [number, number][] = [[-W / 2, 0], [W / 2, 0], [W / 2, 0.66], [0.3, 0.7], [0.22, 0.72]];
    for (let i = 1; i < 8; i++) { const t = (i / 8) * Math.PI; pts.push([0.22 * Math.cos(t), 0.72 + 0.16 * Math.sin(t)]); }
    pts.push([-0.22, 0.72], [-0.3, 0.7], [-W / 2, 0.66]);
    return slab(pts, 0.01).translate(0, 0, -0.005);
  }), 0, y0, 0);
  for (const s of [-1, 1]) a.add(M.paint, iron2, bx(0.03, 0.66, 0.022), s * (W / 2 - 0.015), y0 + 0.33, 0.004); // edge bars
  a.add(M.paint, iron2, bx(W, 0.03, 0.022), 0, y0 + 0.015, 0.004); // bottom bar
  a.add(M.paint, iron2, cg('screenArch', () => new THREE.TorusGeometry(0.205, 0.009, 3, 10, Math.PI)), 0, y0 + 0.72, 0.007);
  a.add(M.paint, iron2, bx(0.012, 0.56, 0.012), 0, y0 + 0.36, 0.011); // central stem
  const scroll = (r: number, arc: number) => cg(`scroll${r},${arc}`, () => new THREE.TorusGeometry(r, 0.0055, 3, 8, arc));
  for (const s of [-1, 1]) {
    a.add(M.paint, iron2, scroll(0.085, Math.PI * 1.35), s * 0.115, y0 + 0.42, 0.011, { rz: s > 0 ? -0.6 : Math.PI + 0.6, s: [1, 1.5, 1] });
    a.add(M.paint, iron2, scroll(0.04, Math.PI * 1.5), s * 0.085, y0 + 0.14, 0.011, { rz: s > 0 ? 0.3 : Math.PI - 0.3 });
    for (const [x, y, r] of [[0.2, 0.55, 0.6], [0.13, 0.27, -0.5], [0.04, 0.66, 0.4]] as const) a.add(M.paint, iron2, gem(0.026, 0.012, 0.006), s * x, y0 + y, 0.014, { rz: s * r });
    a.add(M.paint, iron2, bx(0.034, 0.03, 0.34), s * 0.3, 0.015, -0.1); // foot runner (front-to-back)
    put(a, M.paint, iron2, strut([s * 0.3, 0.03, -0.24], [s * 0.3, 0.45, -0.012], 0.009, 0.009, 4)); // A-frame stay
  }
  // PROP-R08: oriented collision bounds follow the artwork (screen width 0.7 m and A-frame stays).
  // This keeps the inner-room passage sensible at yaw = π/2 and works for future placements too.
  const corners = ([-0.38, 0.38] as const).flatMap(lx =>
    ([-0.28, 0.09] as const).map(lz => ({
      x: p.x + lx * Math.cos(p.yaw) + lz * Math.sin(p.yaw),
      z: p.z - lx * Math.sin(p.yaw) + lz * Math.cos(p.yaw),
    })));
  c.col.addBox(
    Math.min(...corners.map(v => v.x)), Math.max(...corners.map(v => v.x)),
    Math.min(...corners.map(v => v.z)), Math.max(...corners.map(v => v.z)),
    p.y, p.y + 0.95,
  );
  a.end();
}

// ------------------------------------------------------------------------------------------------ D2-R craft pieces
// DEV-04D D2-R (owner phone review): the wall reliefs are rebuilt as authored surfaces instead of a base with scattered
// primitives. Silhouette first (an outline that reads at 5 m), real relief depth (6–10 cm) and paint zones that follow
// the surface (authored vertex colour, `keepColor`), on the shared paint / ceramic / timber materials.
const smooth = THREE.MathUtils.smoothstep;
const gauss = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));

/** Turn every triangle of `g` to face the viewer of a wall piece (local +lz = three −z), then recompute normals. */
function faceFront(g: THREE.BufferGeometry) {
  g.computeVertexNormals();
  const n = g.attributes.normal as THREE.BufferAttribute;
  let sum = 0;
  for (let i = 0; i < n.count; i++) sum += n.getZ(i);
  if (sum > 0) {
    const idx = g.index!;
    for (let t = 0; t < idx.count; t += 3) { const b2 = idx.getX(t + 1); idx.setX(t + 1, idx.getX(t + 2)); idx.setX(t + 2, b2); }
    g.computeVertexNormals();
  }
  return g;
}

/**
 * Authored relief surface: a nu × nv grid; `f(s, t)` (both 0…1) gives a point in the viewer's frame (x to the
 * viewer's right, y up, d off the wall) and its paint colour. Returned in Asm local space, facing the viewer.
 */
function reliefSurface(nu: number, nv: number, f: (s: number, t: number) => { x: number; y: number; d: number; c: THREE.ColorRepresentation }) {
  const pos: number[] = [], col: number[] = [], idx: number[] = [], tc = new THREE.Color();
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const q = f(i / nu, j / nv);
    pos.push(-q.x, q.y, -q.d); // viewer right = local −x; off the wall = local +lz = three −z
    tc.set(q.c); col.push(tc.r, tc.g, tc.b);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a0 = j * (nu + 1) + i, b0 = a0 + 1, c0 = a0 + nu + 1, d0 = c0 + 1;
    idx.push(a0, b0, d0, a0, d0, c0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  faceFront(g);
  g.userData.keepColor = true;
  return g;
}

/**
 * FLW-S3-030 Papier-maché wandmasker (D2-R remodel): one sculpted shell, ≈ 0.65 × 0.38 m. An almond face that rises
 * into an asymmetric three-tongue flame crown; brow, nose ridge, cheek planes and lips modelled in the surface; eye
 * sockets cut in; the coral / olive / cream paint zones follow the form (authored colour), with a hand-made waver in
 * both relief and edges. Hung flush on a rear cord: its rim meets the wall all round.
 */
function maskSurface() {
  // paint as soft washes (weights, not hard zones): lighter coral / olive / cream, read in the cottage's warm, dim light
  const C = { cream: '#efe5cf', coral: '#e3826a', olive: '#7f8f55', white: '#f6f1e2', dark: '#3a2c22' };
  const crown = (u: number) => 0.03 + 0.07 * gauss(u, -0.5, 0.26) + 0.12 * gauss(u, 0.06, 0.26) + 0.06 * gauss(u, 0.58, 0.24);
  const halfW = (y: number) => (y < 0 ? 0.19 * Math.max(0, 1 - (y / 0.33) ** 2) ** 0.6 : 0.19 * Math.max(0.3, 1 - (y / 0.6) ** 2) ** 0.5);
  const soft = (v: number, w: number) => smooth(v, -w, w); // 0 → 1 across ±w
  return reliefSurface(22, 34, (s, t) => {
    const u = s * 2 - 1, yTop = 0.2 + crown(u), y = -0.3 + t * (yTop + 0.3), x = u * halfW(y) * (1 + 0.025 * Math.sin(y * 17 + 1)), ax = Math.abs(x);
    let d = 0.085 * Math.max(0, 1 - u * u) ** 0.55 * (y > 0.2 ? 0.75 : 1);
    d += 0.042 * gauss(x, 0, 0.022) * smooth(y, -0.15, -0.1) * (1 - smooth(y, 0.06, 0.11)); // nose ridge
    d += 0.02 * gauss(x, 0, 0.03) * gauss(y, -0.12, 0.03); // nose tip
    d += 0.014 * gauss(y, 0.075, 0.02) * gauss(ax, 0.07, 0.05); // brows
    d -= 0.024 * gauss(ax, 0.075, 0.032) * gauss(y, 0.035, 0.02); // eye sockets
    d += 0.012 * gauss(ax, 0.1, 0.05) * gauss(y, -0.08, 0.05); // cheek planes
    d += 0.007 * gauss(x, 0, 0.05) * (gauss(y, -0.188, 0.01) + gauss(y, -0.212, 0.01)) - 0.008 * gauss(x, 0, 0.05) * gauss(y, -0.2, 0.006); // lips
    d += 0.004 * Math.sin(13 * x + 3) * Math.sin(9 * y + 1) + 0.003 * Math.sin(27 * y + 5 * x); // papier-maché waver
    d = Math.max(0.0008, d) * Math.min(1, (1 - u * u) * 6) * Math.sin(Math.PI * t) ** 0.25; // the rim meets the wall
    const c = new THREE.Color(C.cream), mix = (col: string, w: number) => c.lerp(new THREE.Color(col), THREE.MathUtils.clamp(w, 0, 1));
    mix(C.olive, soft(u - (0.3 + 0.1 * Math.sin(y * 8)), 0.06) * soft(0.25 - Math.abs(y), 0.04)); // olive sweep, right temple and cheek
    mix(C.olive, soft(y - (0.19 + 0.02 * Math.sin(x * 30)), 0.02) * soft(u - 0.15, 0.08)); // crown, olive on the right
    mix(C.coral, soft(y - (0.19 + 0.02 * Math.sin(x * 30)), 0.02) * soft(0.15 - u, 0.08)); // crown, coral tongues
    mix(C.coral, soft(-0.2 - y, 0.025) * soft(-u - 0.1, 0.08)); // chin, left
    mix(C.coral, 1 - soft(Math.hypot(ax - 0.1, (y + 0.09) * 0.9) - 0.045, 0.012)); // cheek discs
    mix(C.coral, (1 - soft(ax - 0.022, 0.008)) * soft(y + 0.13, 0.015) * soft(0.1 - y, 0.015)); // nose
    const eye = ((ax - 0.075) / 0.032) ** 2 + ((y - 0.035) / 0.017) ** 2;
    mix(C.olive, 1 - soft(eye - 2.3, 0.5)); // lids
    mix(C.white, 1 - soft(eye - 1, 0.25));
    mix(C.dark, 1 - soft(eye - 0.35, 0.12)); // eye holes
    mix(C.olive, (1 - soft(Math.abs(y - (0.082 + 2.2 * (ax - 0.075) ** 2)) - 0.009, 0.004)) * soft(ax - 0.03, 0.01) * soft(0.12 - ax, 0.01)); // brows
    mix(C.coral, 1 - soft((x / 0.045) ** 2 + ((y + 0.2) / 0.018) ** 2 - 1, 0.3)); // lips
    mix(C.dark, (1 - soft(Math.abs(y + 0.2) - 0.003, 0.002)) * soft(0.04 - ax, 0.01)); // mouth line
    return { x: x * 0.96, y: y * 0.96, d, c };
  });
}
export function paperMask(c: Ctx) {
  const p = anchor('FLW-S3-030'), M = artMats();
  wallPiece(p.id, p.x, p.y, p.z, p.yaw, 0.42, 0.7);
  const a = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw).begin(p.id);
  a.add(M.paint, '#ffffff', cg('d2rMask', maskSurface), 0, -0.04, 0); // anchor at the visual centre
  a.end({ ground: false });
}

// FLW-S3-017 / FLW-S3-014 (D3-b1) and FLW-S3-016 / FLW-S3-015 (D3-b2): the D2 / D2-R models are superseded by the
// owner-approved Track 01 builds (d3bAssets.ts), placed through their PROPS3D anchors and scales. One production
// implementation per stable id: the D2 moon and sloop builders are retired.
function t01Medallion(c: Ctx) {
  const p = anchor('FLW-S3-017'), s = p.scale ?? 1;
  wallPiece(p.id, p.x, p.y, p.z, p.yaw, 0.6 * s, 0.6 * s);
  buildMedallion(c.b, c.chunk, p.x, p.y, p.z, p.yaw, s, p.id);
}
function t01Moon(c: Ctx) {
  const p = anchor('FLW-S3-016'), s = p.scale ?? 1;
  buildMoon(c.b, c.chunk, p.x, p.y, p.z, p.yaw, s, p.id); // stands on the bedside top (anchor y)
}
function t01Sloop(c: Ctx) {
  const p = anchor('FLW-S3-015'), s = p.scale ?? 1;
  buildSloop(c.b, c.chunk, p.x, p.y, p.z, p.yaw, s, p.id); // its oak base on the desk top (anchor y), the bow towards the facing
}
function t01Swallows(c: Ctx) {
  const p = anchor('FLW-S3-014'), s = p.scale ?? 1;
  wallPiece(p.id, p.x, p.y, p.z, p.yaw, 1.73 * s, 0.6 * s);
  buildSwallows(c.b, c.chunk, p.x, p.y, p.z, p.yaw, s, p.id);
}

/** FLW-S3-031 lemon relief (the core motif, 45 × 45 cm): built into `a` at its origin. */
function addLemonRelief(a: Asm, M: ReturnType<typeof artMats>) {
  const blue = '#2f56a0', yel = '#e0a830', green = '#3f6a3a';
  a.add(M.paint, '#b8693e', bx(0.45, 0.45, 0.022), 0, 0, 0.011); // terracotta body
  a.add(M.ceramic, '#efe2c4', bx(0.43, 0.43, 0.004), 0, 0, 0.024); // glazed face
  for (const s of [-1, 1]) { a.add(M.ceramic, blue, bx(0.43, 0.026, 0.003), 0, s * 0.198, 0.0275); a.add(M.ceramic, blue, bx(0.026, 0.37, 0.003), s * 0.198, 0, 0.0275); }
  a.add(M.ceramic, yel, cg('tileRing', () => new THREE.TorusGeometry(0.158, 0.007, 3, 16)), 0, 0, 0.027);
  a.add(M.ceramic, blue, cg('tileRing2', () => new THREE.TorusGeometry(0.143, 0.004, 3, 16)), 0, 0, 0.027);
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.add(M.ceramic, blue, oct(0.032, 0.032, 0.004), x * 0.16, y * 0.16, 0.027, { rz: 0.785 });
  a.add(M.ceramic, '#7a5a3a', bx(0.2, 0.008, 0.005), 0, 0.03, 0.028, { rz: -0.35 }); // branch
  for (const [x, y, r] of [[-0.09, 0.07, 0.5], [-0.05, 0.1, -0.4], [0.02, 0.06, 0.9], [0.07, 0.015, -0.6], [-0.08, -0.01, -0.3], [0.1, -0.03, 0.4], [-0.02, -0.06, 1.2], [0.05, 0.1, 0.2]] as const) a.add(M.ceramic, green, oct(0.042, 0.013, 0.008), x, y, 0.03, { rz: r });
  for (const [x, y] of [[-0.06, -0.055], [0.055, -0.07]] as const) a.add(M.ceramic, '#e8b42c', gem(0.03, 0.04, 0.022), x, y, 0.036);
  for (const [x, y] of [[-0.03, 0.12], [0.1, 0.07], [-0.11, 0.035]] as const) a.add(M.ceramic, '#f6f0e2', oct(0.017, 0.017, 0.006), x, y, 0.033);
}
/**
 * FLW-S3-031 Keramisch tegelreliëf (D2-R): the lemon relief set as an architectural azulejo panel, ≈ 1.04 m. A 4 × 4
 * field of 22.5 cm glazed tiles (the relief takes the centre 2 × 2) on a grout bed, framed by a blue plaster surround
 * in the house's trim colour; the twelve border tiles carry a blue diamond and a yellow eye, the corners a quarter
 * rosette, so the panel reads as one tiled wall piece from the terrace.
 */
export function lemonPanel(c: Ctx) {
  const p = anchor('FLW-S3-031'), M = artMats(), cell = 0.225, field = cell * 4, fr = 0.07;
  wallPiece(p.id, p.x, p.y, p.z, p.yaw, field + 2 * fr, field + 2 * fr);
  const a = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw).begin(p.id);
  a.add(M.paint, '#cfc6b2', bx(field, field, 0.012), 0, 0, 0.006); // grout bed
  for (const s2 of [-1, 1]) { // blue plaster surround, 4 cm proud
    a.add(M.paint, '#3f6fa8', bx(field + 2 * fr, fr, 0.04), 0, s2 * (field / 2 + fr / 2), 0.02);
    a.add(M.paint, '#3f6fa8', bx(fr, field, 0.04), s2 * (field / 2 + fr / 2), 0, 0.02);
  }
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    if ((i === 1 || i === 2) && (j === 1 || j === 2)) continue; // the relief
    const x = (i - 1.5) * cell, y = (j - 1.5) * cell, corner = (i === 0 || i === 3) && (j === 0 || j === 3);
    a.add(M.ceramic, '#f1ead8', bx(cell - 0.008, cell - 0.008, 0.014), x, y, 0.019);
    a.add(M.ceramic, '#2f56a0', oct(corner ? 0.075 : 0.065, corner ? 0.075 : 0.065, 0.004), x, y, 0.026, { rz: corner ? 0 : 0.785 });
    a.add(M.ceramic, '#f1ead8', oct(0.032, 0.032, 0.004), x, y, 0.028, { rz: 0.785 });
    a.add(M.ceramic, '#e0a830', oct(0.016, 0.016, 0.004), x, y, 0.03);
  }
  const core = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw);
  addLemonRelief(core, M);
  a.end({ ground: false });
}

/**
 * FLW-S3-037 Houten reigerbeeld (D2-R): the accepted heron design at ×1.45 (≈ 1.18 m overall), now on a broad rooted
 * stump (flared root lobes) bedded in three shore stones, set at the water's edge in front-right of the bench, so it
 * frames the lake view without standing in it; it reads against the water from the path.
 */
export function carvedHeron(c: Ctx) {
  const p = anchor('FLW-S3-037'), M = artMats(), wood = '#8c7b66', dk = '#6e5f4e', K = 1.25, T = 0.32;
  const a = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw).begin(p.id);
  a.add(M.timber, '#76664f', cg('heronStump2', () => {
    const g = new THREE.CylinderGeometry(0.19, 0.25, T, 9, 2);
    const pa = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) { const k = 1 + 0.09 * Math.sin(i * 2.3) + 0.05 * Math.sin(i * 5.1); if (Math.abs(pa.getY(i)) < T / 2 - 0.001) pa.setXYZ(i, pa.getX(i) * k, pa.getY(i), pa.getZ(i) * k); }
    return projectUV(flat(g.translate(0, T / 2, 0)), 2, 'y');
  }), 0, 0, 0);
  for (let i = 0; i < 5; i++) { const an = i * 1.31 + 0.4; a.add(M.timber, '#6c5c46', gem(0.06, 0.05, 0.15), Math.cos(an) * 0.22, 0.05, Math.sin(an) * 0.22, { ry: -an + Math.PI / 2 }); } // root lobes, on the ground
  // shore stones in the lake's own rock material: its mesh already spans the shore, so the chunk's culling sphere does
  // not grow (a paint-material stone stretched the grounds paint mesh into the lake view: +9 k triangles, D1 lesson)
  const rock = woodMats().rock;
  for (const [x, z, s] of [[0.32, 0.12, 0.14], [-0.28, 0.2, 0.11], [0.08, -0.33, 0.12]] as const) a.add(rock, '#8f877a', gem(s, s * 0.6, s * 0.85, 1), x, s * 0.6, z); // resting on the gravel
  const v = (x: number, y: number, z: number): V3 => [x * K, T + (y - 0.26) * K, z * K]; // the design is authored on a 0.26 m stump
  for (const s of [-1, 1]) {
    a.add(M.timber, dk, gem(0.03 * K, 0.008 * K, 0.05 * K), s * 0.035 * K, T + 0.008, 0.02 * K); // toes
    put(a, M.timber, wood, strut(v(s * 0.035, 0.26, 0.0), v(s * 0.03, 0.54, -0.02), 0.012 * K, 0.01 * K, 4)); // legs
    a.add(M.timber, dk, gem(0.026 * K, 0.1 * K, 0.16 * K), s * 0.055 * K, T + (0.63 - 0.26) * K, -0.05 * K, { rx: 0.42 }); // folded wings
  }
  a.add(M.timber, wood, gem(0.072 * K, 0.1 * K, 0.165 * K, 1), 0, T + (0.62 - 0.26) * K, -0.02 * K, { rx: 0.38 }); // body
  const neck: V3[] = [v(0, 0.66, 0.1), v(0, 0.76, 0.14), v(0, 0.84, 0.1), v(0, 0.9, 0.12)];
  for (let i = 0; i < 3; i++) put(a, M.timber, wood, strut(neck[i], neck[i + 1], (0.024 - i * 0.003) * K, (0.021 - i * 0.003) * K, 5));
  a.add(M.timber, wood, gem(0.024 * K, 0.026 * K, 0.042 * K), 0, T + (0.915 - 0.26) * K, 0.135 * K); // head
  put(a, M.timber, dk, strut(v(0, 0.912, 0.165), v(0, 0.9, 0.28), 0.01 * K, 0.002, 4)); // beak
  put(a, M.timber, dk, strut(v(0, 0.93, 0.115), v(0, 0.925, 0.06), 0.006 * K, 0.001, 3)); // crest plume
  c.col.addCircle(p.x, p.z, 0.3, p.y, p.y + 1.2);
  a.end();
}

/** All D2-b pieces whose anchor lies in `room` (callers pass their own chunk context). */
export const S3_BUILDERS: Record<string, (c: Ctx) => void> = {
  'FLW-S3-004': carvedBird, 'FLW-S3-014': t01Swallows, 'FLW-S3-015': t01Sloop, 'FLW-S3-016': t01Moon, 'FLW-S3-017': t01Medallion,
  'FLW-S3-030': paperMask, 'FLW-S3-031': lemonPanel, 'FLW-S3-033': fireScreen, 'FLW-S3-037': carvedHeron,
};
