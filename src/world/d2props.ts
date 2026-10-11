// DEV-04D D2: the FLW key family (K3-001…004) and the FLW S3 reference pieces as stylised low / mid-poly models.
//
// Conventions (art kit): every piece is an `Asm` assembly in plan-local space (lx right, ly up, lz = the piece's
// facing). It is batched into the caller's room chunk with the shared art materials: no new material, no texture.
// Each piece runs the DEV-04B construction audit (Asm.begin / end: no floating or disconnected parts) and records
// its triangles under its FLW id. Wall pieces register a footprint with the DEV-04A wall-art contract (`relief@x,z`).
// Faceted forms (carved wood, papier-maché, clay relief) use flat-shaded icosahedra ("gems"), matching the faceted
// carving the sheets show.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Batcher } from './kit';
import type { Ctx } from './arch';
import { Asm, artMats, lathe, projectUV } from './artkit';
import { joinery } from './furniture';
import { registerArt, artFootprint } from './openings';
import { PROP3D, KEY_SPECS, KEY_SCALE as KS, type KeyItem } from '../content/props3d';

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
/** Merge one-off parts into one geometry (all non-indexed, position / normal / uv only). */
function merge(parts: THREE.BufferGeometry[]) {
  const ps = parts.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); return n; });
  const m = mergeGeometries(ps, false)!;
  parts.forEach((g) => g.dispose());
  ps.forEach((g) => g.dispose());
  return m;
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

/** Mirror a non-indexed geometry in x, keeping its faces outward (swap each triangle's winding). */
function mirrorX(g: THREE.BufferGeometry) {
  g.scale(-1, 1, 1);
  for (const name of Object.keys(g.attributes)) {
    const at = g.attributes[name] as THREE.BufferAttribute, n = at.itemSize, arr = at.array as Float32Array;
    for (let t = 0; t < at.count; t += 3) for (let k = 0; k < n; k++) { const i1 = (t + 1) * n + k, i2 = (t + 2) * n + k, tmp = arr[i1]; arr[i1] = arr[i2]; arr[i2] = tmp; }
  }
  g.deleteAttribute('normal');
  g.computeVertexNormals();
  return g;
}

/** One carved swallow (built flying along local +x, then mirrored: on the wall it flies to the viewer's right), split in dark back / wings / tail and the light belly. */
function swallowGeos() {
  const dark = merge([
    new THREE.IcosahedronGeometry(1, 1).scale(0.072, 0.022, 0.02),
    new THREE.IcosahedronGeometry(1, 0).scale(0.024, 0.021, 0.02).translate(0.068, 0.006, -0.003),
    slab([[0.02, 0.006], [-0.008, 0.05], [-0.055, 0.115], [-0.105, 0.165], [-0.085, 0.112], [-0.048, 0.052], [-0.02, 0.006]], 0.006).translate(0, 0, -0.0),
    slab([[0.016, -0.004], [-0.018, -0.042], [-0.065, -0.088], [-0.098, -0.118], [-0.07, -0.068], [-0.03, -0.012]], 0.006).translate(0, 0, -0.012),
    slab([[-0.055, 0.006], [-0.165, 0.036], [-0.118, 0.0], [-0.165, -0.03], [-0.055, -0.006]], 0.005).translate(0, 0, 0.002),
    new THREE.ConeGeometry(0.005, 0.016, 4).rotateZ(-Math.PI / 2).translate(0.098, 0.004, -0.003),
    strut([0, 0, -0.035], [0, 0, -0.008], 0.006, 0.006, 5), // hidden dowel to the rail
  ].map((g) => flat(g)));
  const light = flat(new THREE.IcosahedronGeometry(1, 0).scale(0.056, 0.013, 0.016).translate(0.008, -0.01, -0.008));
  return { dark: projectUV(mirrorX(dark), 2), light: projectUV(mirrorX(light), 2) };
}

/**
 * FLW-S3-014 Gesneden zwaluwen: three carved swallows (oiled oak with a cool stain on the backs) on a concealed rail.
 * The art's horizontal flight direction (not the blockout's triangle), set as a loose, asymmetric shallow arc (owner):
 * uneven spacing, the middle bird highest, each at its own pitch and size and a few mm deeper or shallower.
 */
export function carvedSwallows(c: Ctx) {
  const p = anchor('FLW-S3-014'), M = artMats();
  wallPiece(p.id, p.x, p.y, p.z, p.yaw, 1.3, 0.7);
  const a = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw).begin(p.id);
  const g = swallowGeos();
  // ≈ 1.2 × 0.55 m on a 2.85 m gallery wall: the sheet's 90 × 50 cm grouping read as three dots from the gallery
  const birds: [number, number, number, number, number][] = [[-0.5, -0.1, 0.05, 0.22, 1.32], [-0.03, 0.08, 0.058, 0.07, 1.52], [0.48, 0.03, 0.052, -0.13, 1.42]]; // x, y, depth, pitch, scale
  for (const [x, y, d, rz, k] of birds) {
    // cool-stained oak on the backs, wings and tail (matte paint; the tone is lifted because the window wall stands in
    // its own shadow at ≈ 37 % light), the pale carved belly in textured oak
    a.add(M.paint, '#b8a48a', g.dark, x, y, d, { rz, s: [k, k, k] });
    a.add(M.timber, '#e2c08e', g.light, x, y, d, { rz, s: [k, k, k] }); // pale carved belly
  }
  g.dark.dispose(); g.light.dispose();
  // each bird is carried by its own hidden dowel into the wall (the sheet's concealed rail sits behind the plaster), so
  // the three are separate parts by design: the audit's part gap is widened to the group's spacing
  a.end({ ground: false, gap: 0.08 });
}

/** FLW-S3-015 Miniatuurzeilboot: wooden model sloop on brass posts and an oak base; rigging simplified to 4 lines. */
export function modelSloop(c: Ctx) {
  const p = anchor('FLW-S3-015'), M = artMats(), walnut = '#6a3e22', deck = '#b88a58';
  const a = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw).begin(p.id);
  const HL = 0.17, HB = 0.048, HD = 0.05, yh = 0.02 + 0.03 + HD; // hull half-length / half-beam / depth; deck height
  const bowTaper = (v: THREE.Vector3) => { if (v.z < 0) v.x *= 1 - 0.62 * (-v.z) ** 1.6; }; // three −z = bow
  a.add(M.timber, '#7a5232', sb(0.075, 0.02, 0.24, 0.004), 0, 0.01, 0); // base board, along the hull
  for (const lz of [-0.07, 0.07]) {
    a.add(M.brass, '#c9a24c', cg('sloopPost', () => new THREE.CylinderGeometry(0.0045, 0.0045, 0.042, 6).translate(0, 0.021, 0)), 0, 0.02, lz);
    a.add(M.brass, '#c9a24c', cg('sloopCup', () => new THREE.CylinderGeometry(0.009, 0.011, 0.006, 8).translate(0, 0.003, 0)), 0, 0.02, lz);
  }
  a.add(M.timber, walnut, cg('sloopHull', () => {
    const g = new THREE.SphereGeometry(1, 12, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const v = new THREE.Vector3(), pa = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); bowTaper(v); pa.setXYZ(i, v.x * HB, v.y * HD, v.z * HL); }
    g.computeVertexNormals();
    return projectUV(g, 2, 'z');
  }), 0, yh, 0);
  a.add(M.timber, deck, cg('sloopDeck', () => {
    const g = new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2);
    const v = new THREE.Vector3(), pa = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); bowTaper(v); pa.setXYZ(i, v.x * HB * 0.97, 0, v.z * HL * 0.97); }
    return projectUV(g, 2, 'z');
  }), 0, yh + 0.001, 0);
  a.add(M.timber, walnut, bx(0.006, 0.026, 0.15), 0, yh - HD - 0.006, -0.005); // keel
  a.add(M.timber, walnut, bx(0.005, 0.04, 0.022), 0, yh - 0.024, -HL + 0.01); // rudder
  a.add(M.timber, '#8a5a34', bx(0.044, 0.02, 0.05), 0, yh + 0.011, -0.055); // cabin
  a.add(M.paint, '#efe6d2', cg('sloopSheer', () => { // a cream band just under the sheer: a thin slice of the hull, 2 % proud
    const g = new THREE.SphereGeometry(1, 12, 1, 0, Math.PI * 2, Math.PI / 2 + 0.12, 0.1);
    const v = new THREE.Vector3(), pa = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); bowTaper(v); pa.setXYZ(i, v.x * HB * 1.02, v.y * HD, v.z * HL * 1.02); }
    g.computeVertexNormals();
    return g;
  }), 0, yh, 0);
  const mz = 0.035, top = yh + 0.38;
  put(a, M.timber, '#7e4e2a', strut([0, yh - 0.01, mz], [0, top, mz], 0.0055, 0.004, 6)); // mast
  put(a, M.timber, '#7e4e2a', strut([0, yh + 0.045, mz], [0, yh + 0.05, -0.14], 0.0035, 0.003, 5)); // boom
  put(a, M.timber, '#7e4e2a', strut([0, yh + 0.004, HL - 0.01], [0, yh + 0.012, HL + 0.045], 0.003, 0.0025, 5)); // bowsprit
  put(a, M.brass, '#c9a24c', strut([0, yh - 0.002, mz], [0, yh + 0.012, mz], 0.009, 0.009, 8)); // mast collar
  // mainsail: a triangle from the mast head to the boom, cream canvas, both faces
  put(a, M.paint, '#ece2cc', (() => {
    const g = new THREE.BufferGeometry(), A = P([0, yh + 0.055, mz - 0.006]), B = P([0, top - 0.015, mz - 0.006]), C = P([0, yh + 0.055, -0.135]);
    const off = 0.0012, pts: number[] = [];
    for (const s of [1, -1]) { const q = [A, B, C].map((v) => v.clone().setX(s * off)); (s > 0 ? [q[0], q[1], q[2]] : [q[0], q[2], q[1]]).forEach((v) => pts.push(v.x, v.y, v.z)); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.computeVertexNormals();
    return g;
  })());
  // rigging: forestay, two shrouds, backstay
  for (const [from, to] of [[[0, top, mz], [0, yh + 0.01, HL + 0.04]], [[0, top - 0.08, mz], [HB * 0.9, yh, mz - 0.01]], [[0, top - 0.08, mz], [-HB * 0.9, yh, mz - 0.01]], [[0, top, mz], [0, yh + 0.004, -HL + 0.004]]] as [V3, V3][]) put(a, M.paint, '#c8b48a', strut(from, to, 0.0011, 0.0011, 3, true));
  a.end();
}

/** Crescent outline: the outer circle minus an offset inner circle, as one closed polygon (x right, y up). */
function crescentPts(R: number, cx: number, cy: number, r: number, n = 14): [number, number][] {
  const d = Math.hypot(cx, cy), aa = (R * R - r * r + d * d) / (2 * d), h = Math.sqrt(Math.max(0, R * R - aa * aa));
  const px = (aa * cx) / d, py = (aa * cy) / d, I = [[px - (h * cy) / d, py + (h * cx) / d], [px + (h * cy) / d, py - (h * cx) / d]];
  const arc = (ox: number, oy: number, rad: number, p0: number[], p1: number[], keep: (x: number, y: number) => boolean) => {
    let a0 = Math.atan2(p0[1] - oy, p0[0] - ox), a1 = Math.atan2(p1[1] - oy, p1[0] - ox);
    if (a1 < a0) a1 += Math.PI * 2;
    const mid = (a0 + a1) / 2;
    if (!keep(ox + rad * Math.cos(mid), oy + rad * Math.sin(mid))) a1 -= Math.PI * 2; // go the other way round
    return Array.from({ length: n + 1 }, (_, i) => { const t = a0 + ((a1 - a0) * i) / n; return [ox + rad * Math.cos(t), oy + rad * Math.sin(t)] as [number, number]; });
  };
  const outer = arc(0, 0, R, I[0], I[1], (x, y) => Math.hypot(x - cx, y - cy) > r);
  const inner = arc(cx, cy, r, I[1], I[0], (x, y) => Math.hypot(x, y) < R);
  return [...outer, ...inner.slice(1, -1)];
}

/** FLW-S3-016 Keramische maanvorm: matte ivory ceramic crescent on a plain oak block (the art's simple base), ≈ 24 cm. */
export function ceramicMoon(c: Ctx) {
  const p = anchor('FLW-S3-016'), M = artMats();
  const a = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw).begin(p.id);
  a.add(M.timber, '#7a4a28', sb(0.085, 0.058, 0.07, 0.006), 0, 0.029, 0); // block
  a.add(M.paint, '#3a2a1e', cg('moonPeg', () => new THREE.CylinderGeometry(0.006, 0.006, 0.02, 6).translate(0, 0.01, 0)), 0, 0.056, 0);
  a.add(M.paint, '#e8dec6', cg('moonCrescent', () => {
    const pts = crescentPts(0.085, 0.042, 0.03, 0.072);
    let lo = pts[0];
    for (const q of pts) if (q[1] < lo[1]) lo = q;
    const g = slab(pts.map(([x, y]) => [x - lo[0], y - lo[1]]), 0.022, 0.003);
    return g.translate(0, 0, 0.011); // centred on its thickness
  }), 0, 0.073, 0);
  a.end();
}

/** FLW-S3-017 Terracotta bloemmedaillon: a shallow terracotta disc (Ø 35 cm) with a raised bud on paired leaves. */
export function terracottaMedallion(c: Ctx) {
  const p = anchor('FLW-S3-017'), M = artMats(), clay = '#b4603f', hi = '#cf875e', lf = '#9e7a4e';
  wallPiece(p.id, p.x, p.y, p.z, p.yaw, 0.35, 0.35);
  const a = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw).begin(p.id);
  a.add(M.paint, clay, cg('medDisc', () => new THREE.CylinderGeometry(0.175, 0.175, 0.026, 20).rotateX(Math.PI / 2)), 0, 0, 0.013);
  a.add(M.paint, '#a5553a', cg('medRim', () => new THREE.TorusGeometry(0.158, 0.011, 4, 20)), 0, 0, 0.026);
  a.add(M.paint, hi, gem(0.03, 0.048, 0.02, 1), 0, 0.045, 0.034); // bud
  for (const s of [-1, 1]) a.add(M.paint, lf, gem(0.012, 0.03, 0.008), s * 0.022, 0.018, 0.036, { rz: s * 0.5 }); // sepals
  a.add(M.paint, hi, bx(0.012, 0.14, 0.012), 0, -0.06, 0.032); // stem
  for (const [x, y, r] of [[-0.05, -0.02, 0.45], [0.05, -0.04, -0.45], [-0.046, -0.085, 0.25], [0.044, -0.1, -0.2]] as const) a.add(M.paint, lf, gem(0.048, 0.017, 0.009), x, y, 0.033, { rz: r });
  a.end({ ground: false });
}

/** FLW-S3-030 Papier-maché wandmasker: a coral / olive / cream shell mask (≈ 40 cm), hung by a rear cord. */
export function paperMask(c: Ctx) {
  const p = anchor('FLW-S3-030'), M = artMats(), cream = '#e9dcc2', coral = '#d8735a', olive = '#6c7646';
  wallPiece(p.id, p.x, p.y, p.z, p.yaw, 0.26, 0.42);
  const a = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw).begin(p.id);
  const SX = 0.12, SY = 0.2, SZ = 0.055;
  const shell = (key: string, k: number, ws: number, hs: number, ph0: number, ph1: number, th0: number, th1: number) => cg(`mask${key}`, () => new THREE.SphereGeometry(1, ws, hs, ph0, ph1 - ph0, th0, th1 - th0).scale(SX * k, SY * k, SZ * k));
  a.add(M.paint, cream, shell('Base', 1, 10, 8, Math.PI, Math.PI * 2, 0, Math.PI), 0, 0, 0);
  a.add(M.paint, olive, shell('Olive', 1.02, 4, 6, Math.PI * 1.55, Math.PI * 2, Math.PI * 0.12, Math.PI * 0.94), 0, 0, 0); // one cheek and temple
  a.add(M.paint, coral, shell('Coral', 1.025, 5, 3, Math.PI, Math.PI * 1.6, 0, Math.PI * 0.3), 0, 0, 0); // flame over the brow
  const surf = (x: number, y: number) => SZ * Math.sqrt(Math.max(0.02, 1 - (x / SX) ** 2 - (y / SY) ** 2));
  for (const s of [-1, 1]) {
    a.add(M.paint, coral, oct(0.03, 0.03, 0.006), s * 0.062, -0.055, surf(s * 0.062, -0.055) + 0.001); // cheek discs
    a.add(M.paint, '#f2ead8', gem(0.026, 0.011, 0.008), s * 0.045, 0.03, surf(s * 0.045, 0.03) + 0.001); // eye whites
    a.add(M.paint, '#2a2018', oct(0.007, 0.007, 0.004), s * 0.045, 0.03, surf(s * 0.045, 0.03) + 0.008); // pupils
    a.add(M.paint, olive, oct(0.03, 0.006, 0.006), s * 0.045, 0.058, surf(s * 0.045, 0.058) + 0.002, { rz: s * 0.15 }); // brows
  }
  a.add(M.paint, coral, gem(0.014, 0.06, 0.024), 0, -0.005, surf(0, -0.005) + 0.006); // nose
  a.add(M.paint, coral, oct(0.036, 0.009, 0.008), 0, -0.115, surf(0, -0.115) + 0.002); // mouth
  a.end({ ground: false });
}

/** FLW-S3-031 Keramisch tegelreliëf: a 45 × 45 cm glazed azulejo slab with a raised lemon branch, on a hidden wire. */
export function lemonTile(c: Ctx) {
  const p = anchor('FLW-S3-031'), M = artMats(), blue = '#2f56a0', yel = '#e0a830', green = '#3f6a3a';
  wallPiece(p.id, p.x, p.y, p.z, p.yaw, 0.45, 0.45);
  const a = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw).begin(p.id);
  a.add(M.paint, '#b8693e', bx(0.45, 0.45, 0.022), 0, 0, 0.011); // terracotta body (edges show)
  a.add(M.ceramic, '#efe2c4', bx(0.43, 0.43, 0.004), 0, 0, 0.024); // glazed face
  for (const s of [-1, 1]) { a.add(M.ceramic, blue, bx(0.43, 0.026, 0.003), 0, s * 0.198, 0.0275); a.add(M.ceramic, blue, bx(0.026, 0.37, 0.003), s * 0.198, 0, 0.0275); }
  a.add(M.ceramic, yel, cg('tileRing', () => new THREE.TorusGeometry(0.158, 0.007, 3, 16)), 0, 0, 0.027);
  a.add(M.ceramic, blue, cg('tileRing2', () => new THREE.TorusGeometry(0.143, 0.004, 3, 16)), 0, 0, 0.027);
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) a.add(M.ceramic, blue, oct(0.032, 0.032, 0.004), x * 0.16, y * 0.16, 0.027, { rz: 0.785 });
  a.add(M.ceramic, '#7a5a3a', bx(0.2, 0.008, 0.005), 0, 0.03, 0.028, { rz: -0.35 }); // branch
  for (const [x, y, r] of [[-0.09, 0.07, 0.5], [-0.05, 0.1, -0.4], [0.02, 0.06, 0.9], [0.07, 0.015, -0.6], [-0.08, -0.01, -0.3], [0.1, -0.03, 0.4], [-0.02, -0.06, 1.2], [0.05, 0.1, 0.2]] as const) a.add(M.ceramic, green, oct(0.042, 0.013, 0.008), x, y, 0.03, { rz: r });
  for (const [x, y] of [[-0.06, -0.055], [0.055, -0.07]] as const) a.add(M.ceramic, '#e8b42c', gem(0.03, 0.04, 0.022), x, y, 0.036);
  for (const [x, y] of [[-0.03, 0.12], [0.1, 0.07], [-0.11, 0.035]] as const) a.add(M.ceramic, '#f6f0e2', oct(0.017, 0.017, 0.006), x, y, 0.033);
  a.end({ ground: false });
}

/** FLW-S3-033 Smeedijzeren BBQ-haardplaat: a wrought-iron screen with a shouldered arch, scrollwork, A-frame feet. */
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
  c.col.addBox(p.x - 0.4, p.x + 0.36, p.z - 0.12, p.z + 0.32, p.y, p.y + 0.95); // facing ≈ −z (turned 20°): the feet run back to +z
  a.end();
}

/** FLW-S3-037 Houten reigerbeeld: a carved heron on a stump (≈ 0.8 m); thick legs, feathers as a few broad facets. */
export function carvedHeron(c: Ctx) {
  const p = anchor('FLW-S3-037'), M = artMats(), wood = '#8c7b66', dk = '#6e5f4e', K = 0.86;
  const a = new Asm(c.b, c.chunk, p.x, p.y, p.z, p.yaw).begin(p.id);
  a.add(M.timber, '#76664f', cg('heronStump', () => {
    const g = new THREE.CylinderGeometry(0.12, 0.15, 0.26, 8, 2);
    const pa = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) { const k = 1 + 0.08 * Math.sin(i * 2.3); if (Math.abs(pa.getY(i)) < 0.129) pa.setXYZ(i, pa.getX(i) * k, pa.getY(i), pa.getZ(i) * k); }
    return projectUV(flat(g.translate(0, 0.13, 0)), 2, 'y');
  }), 0, 0, 0);
  const T = 0.26, v = (x: number, y: number, z: number): V3 => [x * K, T + (y - T) * K, z * K]; // scaled above the stump top
  for (const s of [-1, 1]) {
    a.add(M.timber, dk, gem(0.03 * K, 0.008, 0.05 * K), s * 0.035 * K, T + 0.006, 0.02 * K); // toes
    put(a, M.timber, wood, strut(v(s * 0.035, T, 0.0), v(s * 0.03, 0.54, -0.02), 0.012, 0.01, 4)); // legs
    a.add(M.timber, dk, gem(0.026 * K, 0.1 * K, 0.16 * K), s * 0.055 * K, T + (0.63 - T) * K, -0.05 * K, { rx: 0.42 }); // folded wings
  }
  a.add(M.timber, wood, gem(0.072 * K, 0.1 * K, 0.165 * K, 1), 0, T + (0.62 - T) * K, -0.02 * K, { rx: 0.38 }); // body
  const neck: V3[] = [v(0, 0.66, 0.1), v(0, 0.76, 0.14), v(0, 0.84, 0.1), v(0, 0.9, 0.12)];
  for (let i = 0; i < 3; i++) put(a, M.timber, wood, strut(neck[i], neck[i + 1], (0.024 - i * 0.003) * K, (0.021 - i * 0.003) * K, 5));
  a.add(M.timber, wood, gem(0.024 * K, 0.026 * K, 0.042 * K), 0, T + (0.915 - T) * K, 0.135 * K); // head
  put(a, M.timber, dk, strut(v(0, 0.912, 0.165), v(0, 0.9, 0.28), 0.01 * K, 0.0015, 4)); // beak
  put(a, M.timber, dk, strut(v(0, 0.93, 0.115), v(0, 0.925, 0.06), 0.006 * K, 0.001, 3)); // crest plume
  c.col.addCircle(p.x, p.z, 0.16, p.y, p.y + 0.85);
  a.end();
}

/** All D2-b pieces whose anchor lies in `room` (callers pass their own chunk context). */
export const S3_BUILDERS: Record<string, (c: Ctx) => void> = {
  'FLW-S3-004': carvedBird, 'FLW-S3-014': carvedSwallows, 'FLW-S3-015': modelSloop, 'FLW-S3-016': ceramicMoon, 'FLW-S3-017': terracottaMedallion,
  'FLW-S3-030': paperMask, 'FLW-S3-031': lemonTile, 'FLW-S3-033': fireScreen, 'FLW-S3-037': carvedHeron,
};
