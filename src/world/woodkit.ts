// Art-refresh step 3: woodland asset kit (BOSLUST exterior sample). Code-built, deterministic, shared geometry.
// Every model is returned as a small set of geometries, one per material (e.g. wood + leaves), so a whole
// forest of instances costs one draw call per material per LOD (see LodInstances in boslustSample.ts).
//
// Conventions (three.js local space): y up, base of the plant at the origin. Baked vertex colours carry only
// OCCLUSION / material variation (darker crown interiors and undersides, moss on rock tops, bark tone), never a
// light direction, so they stay right under any sun angle.
import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { mergeGeometries, mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32, type Rng } from '../core/rng';

// ------------------------------------------------------------------------------------------------ primitives
/**
 * Tapered tube along a smooth curve through `pts`, radius interpolated from `radii` (same length as pts or 2).
 * `lobes` adds buttress lobes near the base (root flare). UV: u around (1 = circumference), v = metres / vScale.
 */
export function taperTube(pts: [number, number, number][], radii: number[], o: { radial?: number; rows?: number; lobes?: number; flare?: number; vScale?: number } = {}) {
  const radial = o.radial ?? 8, rows = o.rows ?? Math.max(3, pts.length * 2);
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const frames = curve.computeFrenetFrames(rows, false);
  const len = curve.getLength();
  const R = (t: number) => {
    const f = t * (radii.length - 1), i = Math.min(radii.length - 2, Math.floor(f));
    return THREE.MathUtils.lerp(radii[i], radii[i + 1], f - i);
  };
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  const P = new THREE.Vector3(), N = new THREE.Vector3(), V = new THREE.Vector3();
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    curve.getPointAt(t, P);
    const r0 = R(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      // buttress lobes fade out over the first ~25 % of the length
      const lobe = o.lobes ? 1 + (o.flare ?? 0.6) * Math.pow(Math.max(0, 1 - t / 0.25), 2) * (0.35 + 0.65 * Math.pow(Math.max(0, Math.cos(a * o.lobes)), 2)) : 1;
      N.copy(frames.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a)).normalize();
      V.copy(P).addScaledVector(N, r0 * lobe);
      pos.push(V.x, V.y, V.z); nor.push(N.x, N.y, N.z);
      uv.push(j / radial, (t * len) / (o.vScale ?? 1));
    }
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals(); // lobes change the surface: recompute (seam at u=0 stays smooth enough at this density)
  return g;
}

const UP = new THREE.Vector3(0, 1, 0);
/** Low-frequency deterministic 3D noise (sum of sines) in [-1, 1]. */
const n3 = (x: number, y: number, z: number, s: number) =>
  (Math.sin(x * 1.7 + s) * Math.sin(y * 2.3 + s * 1.3) + Math.sin(z * 1.9 + s * 0.7) * Math.sin((x + y) * 1.3 + s * 2.1) + Math.sin((y - z) * 2.1 + s * 3.1)) / 3;

/**
 * Lumpy foliage mass: an icosphere with low-frequency displacement and a flattened underside, scaled. Normals are
 * blended toward `centre` (the crown centre) so a whole crown shades as one soft volume with readable masses.
 */
export function lump(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, seed: number, detail: number, centre: THREE.Vector3, crownR: number, bend = 0.55, amp = 0.18) {
  const g0 = new THREE.IcosahedronGeometry(1, detail);
  g0.deleteAttribute('normal'); g0.deleteAttribute('uv');
  const g = mergeVertices(g0, 1e-5); // welded: smooth shading across the mass, not facets
  g0.dispose();
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = 1 + amp * n3(v.x * 1.6, v.y * 1.6, v.z * 1.6, seed);
    v.multiplyScalar(d);
    if (v.y < 0) v.y *= 0.72; // flatter underside: masses read as hanging foliage, not balls
    p.setXYZ(i, cx + v.x * rx, cy + v.y * ry, cz + v.z * rz);
  }
  g.computeVertexNormals();
  const nn = g.attributes.normal as THREE.BufferAttribute, w = new THREE.Vector3(), c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    w.copy(v).sub(centre);
    const dist = w.length() / crownR;
    w.normalize();
    // blended toward the crown centre (one soft volume), then biased up: foliage is lit through and between the
    // leaves, so undersides read as shaded green, never as black holes
    const n = new THREE.Vector3().fromBufferAttribute(nn, i).lerp(w, bend).normalize().lerp(UP, 0.3).normalize();
    nn.setXYZ(i, n.x, n.y, n.z);
    // occlusion: darker toward the crown interior and underside, lighter on outer tops
    const up = THREE.MathUtils.smoothstep(n.y, -0.7, 0.9);
    const k = (0.8 + 0.2 * up) * (0.74 + 0.26 * THREE.MathUtils.smoothstep(dist, 0.35, 1.0)) * 1.12;
    // sky-lit tops a touch warmer and yellower, undersides a touch cooler (occlusion only, no sun direction)
    c[i * 3] = k * (0.98 + 0.08 * up); c[i * 3 + 1] = k * (1.0 + 0.04 * up); c[i * 3 + 2] = k * (1.0 - 0.14 * up);
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

/**
 * Thin leaves/blades seen from both sides WITHOUT DoubleSide: a DoubleSide material flips the normal on back
 * faces, so half of every clump would shade as if facing the ground. Here every triangle is duplicated with
 * reversed winding but the same (up-biased) normals and colours, and a FrontSide material is used.
 */
export function twoSided(g0: THREE.BufferGeometry) {
  const g = g0.index ? g0.toNonIndexed() : g0;
  const out = new THREE.BufferGeometry();
  for (const name of Object.keys(g.attributes)) {
    const a = g.attributes[name] as THREE.BufferAttribute, n = a.itemSize, src = a.array as Float32Array;
    const dst = new Float32Array(src.length * 2);
    dst.set(src);
    for (let t = 0; t < a.count; t += 3) for (const [k, j] of [[0, 0], [1, 2], [2, 1]]) for (let c = 0; c < n; c++) dst[src.length + (t + k) * n + c] = src[(t + j) * n + c];
    out.setAttribute(name, new THREE.BufferAttribute(dst, n));
  }
  if (g !== g0) g.dispose();
  g0.dispose();
  out.computeBoundingSphere();
  return out;
}

/** Give a geometry a constant (or function) vertex colour so it can be merged with coloured parts. */
function paint(g: THREE.BufferGeometry, f: number | ((p: THREE.Vector3, i: number) => [number, number, number])) {
  const p = g.attributes.position as THREE.BufferAttribute, c = new Float32Array(p.count * 3), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const rgb = typeof f === 'number' ? [f, f, f] : f(v.fromBufferAttribute(p, i), i);
    c.set(rgb, i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
/** Merge parts into one indexed geometry with position/normal/uv/color (missing uv → planar). */
function mergeParts(parts: THREE.BufferGeometry[]) {
  for (const g of parts) {
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.color) paint(g, 1);
    for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(n)) g.deleteAttribute(n);
  }
  const allIdx = parts.every((g) => g.index);
  const m = mergeGeometries(allIdx ? parts : parts.map((g) => (g.index ? g.toNonIndexed() : g)))!;
  parts.forEach((g) => g.dispose());
  m.computeBoundingSphere();
  return m;
}
/** Spherical-ish UVs for foliage masses (a leaf-dab texture wraps without stretching badly). */
function foliageUV(g: THREE.BufferGeometry, scale: number) {
  const p = g.attributes.position as THREE.BufferAttribute, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + p.getZ(i) * 0.7) / scale; uv[i * 2 + 1] = (p.getY(i) + p.getZ(i) * 0.4) / scale; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

export interface Model { wood: THREE.BufferGeometry; leaves: THREE.BufferGeometry }
export type Lod = 'near' | 'far';
export type TreeSpecies = 'oak' | 'beech' | 'birch' | 'pine';
export type BushSpecies = 'hazel' | 'holly';
/** Variants per species (each a distinct, authored or seeded silhouette). */
export const VARIANTS = 3;

// ------------------------------------------------------------------------------------------------ bark atlas
/**
 * One bark texture holds three barks side by side (so all species share one material and one draw call):
 * 0 fissured (oak, pine), 1 smooth with faint lenticels (beech, hazel), 2 birch (white with black dashes).
 * u (around the trunk, 0–1) is remapped into the column with a gutter against filtering bleed.
 */
export const BARK = { fissured: 0, smooth: 1, birch: 2 } as const;
const GUT = 0.07;
function barkCol(g: THREE.BufferGeometry, col: number) {
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setX(i, (col + GUT + Math.min(1, Math.max(0, uv.getX(i))) * (1 - 2 * GUT)) / 3);
  return g;
}

// ------------------------------------------------------------------------------------------------ broadleaf trees
interface Broadleaf {
  seed: number; H: number; lean: [number, number]; trunk: [number, number, number, number];
  majors: [number, number, number, number][]; subs: number; detail: number; crownR: number;
  bark: number; roots: number; rootR: number; rootSpin: number; limbR: number; leader: number; fork: number;
  /** noise offsets for the mass and clump displacement */ nm: number; ns: number;
}
/**
 * Generic broadleaf: a leaning, tapering trunk; roots growing out of the trunk axis and diving into the soil;
 * limbs from the trunk top into each MAJOR foliage mass (they enter the foliage, never end in air); each major mass
 * carries smaller clumps on its outer side, so the outline is scalloped rather than a pillow. Both LODs keep the
 * same masses, clumps, limbs and roots (coarser far away), so the switch does not change the silhouette.
 */
function broadleaf(sp: Broadleaf, lod: Lod): Model {
  const r = mulberry32(sp.seed);
  const near = lod === 'near';
  const { H, lean } = sp;
  const trunkTop: [number, number, number] = [lean[0], H + 0.4, lean[1]];
  const wood: THREE.BufferGeometry[] = [];
  wood.push(taperTube([[0, -0.3, 0], [lean[0] * 0.2, H * 0.35, lean[1] * 0.2], [lean[0] * 0.7, H * 0.75, lean[1] * 0.7], trunkTop], [...sp.trunk], { radial: near ? 12 : 6, rows: near ? 10 : 4, vScale: 1.4 }));
  const crownC = new THREE.Vector3(lean[0] * 1.2, H + 2.4, lean[1] * 1.2);
  const leaves: THREE.BufferGeometry[] = [];
  sp.majors.forEach(([mx, my, mz, ms], i) => {
    const cx = crownC.x + mx, cy = H + my, cz = crownC.z + mz;
    leaves.push(lump(cx, cy, cz, ms * 1.05, ms * 0.78, ms * 0.98, i * 1.7 + sp.nm, near ? sp.detail : 1, crownC, sp.crownR));
    const out = new THREE.Vector3(mx, 0, mz).normalize();
    for (let k = 0; k < sp.subs; k++) {
      const a = Math.atan2(out.z, out.x) + (r() - 0.5) * 2.6, el = 0.15 + r() * 0.75;
      const d = ms * (0.72 + r() * 0.18), cs = ms * (0.38 + r() * 0.2);
      leaves.push(lump(cx + Math.cos(a) * Math.cos(el) * d, cy + Math.sin(el) * d * 0.75, cz + Math.sin(a) * Math.cos(el) * d, cs * 1.05, cs * 0.8, cs, i * 7.3 + k * 2.9 + sp.ns, near ? 1 : 0, crownC, sp.crownR));
    }
  });
  const rad = near ? 1 : 0.6;
  sp.majors.slice(1).forEach(([mx, my, mz], i) => {
    const s: [number, number, number] = [trunkTop[0] * 0.85, H - 0.15 + i * 0.12, trunkTop[2] * 0.85];
    const e: [number, number, number] = [crownC.x + mx * 0.75, H + my * 0.7, crownC.z + mz * 0.75];
    const m: [number, number, number] = [(s[0] + e[0]) / 2 + (r() - 0.5) * 0.4, (s[1] + e[1]) / 2 + 0.3, (s[2] + e[2]) / 2 + (r() - 0.5) * 0.4];
    wood.push(taperTube([s, m, e], [sp.limbR, sp.limbR * 0.64, sp.limbR * 0.32], { radial: Math.round(7 * rad), rows: near ? 6 : 3, vScale: 1.2 }));
    const f: [number, number, number] = [m[0] + (e[0] - s[0]) * 0.25 + (r() - 0.5) * 0.8, m[1] + 0.9, m[2] + (e[2] - s[2]) * 0.25 + (r() - 0.5) * 0.8];
    if (i % sp.fork === 0 && near) wood.push(taperTube([m, [(m[0] + f[0]) / 2, (m[1] + f[1]) / 2 + 0.1, (m[2] + f[2]) / 2], f], [sp.limbR * 0.4, sp.limbR * 0.3, sp.limbR * 0.16], { radial: 5, rows: 4, vScale: 1.2 }));
  });
  wood.push(taperTube([trunkTop, [trunkTop[0] * 1.1, H + sp.leader * 0.64, trunkTop[2]], [crownC.x, H + sp.leader, crownC.z]], [sp.limbR * 0.9, sp.limbR * 0.6, sp.limbR * 0.27], { radial: Math.round(7 * rad), rows: near ? 5 : 2, vScale: 1.2 }));
  for (let i = 0; i < sp.roots; i++) {
    const a = (i / sp.roots) * Math.PI * 2 + sp.rootSpin + (r() - 0.5) * 0.35, L = (0.5 + r() * 0.4) * sp.rootR / 0.3;
    const c = Math.cos(a), s = Math.sin(a), R = sp.rootR;
    wood.push(taperTube([[c * 0.04, 1.05 * R / 0.3, s * 0.04], [c * 0.42 * R / 0.3, 0.38, s * 0.42 * R / 0.3], [c * (0.62 + L * 0.5), -0.02, s * (0.62 + L * 0.5)], [c * (0.66 + L), -0.75, s * (0.66 + L)]], [R, R * 0.8, R * 0.4, R * 0.13], { radial: near ? 7 : 4, rows: near ? 7 : 3, vScale: 1.2 }));
  }
  const woodG = mergeParts(wood.map((g) => barkCol(paint(g, (p) => { const k = 0.74 + 0.26 * THREE.MathUtils.smoothstep(p.y, -0.2, 1.4); return [k, k, k]; }), sp.bark)));
  return { wood: woodG, leaves: mergeParts(leaves.map((g) => foliageUV(g, 1.6))) };
}

// ------------------------------------------------------------------------------------------------ oak
/**
 * Pedunculate oak: low, broad, lopsided crown on a stout leaning trunk, five roots. Three authored layouts:
 * 0 the hero (broad, six masses), 1 a smaller, rounder tree, 2 an old spreading oak with a long low limb.
 */
const OAKS: Broadleaf[] = [
  { seed: 517, H: 3.1, lean: [0.3, -0.1], trunk: [0.5, 0.4, 0.34, 0.29], subs: 5, detail: 2, crownR: 4.2, bark: BARK.fissured, roots: 5, rootR: 0.3, rootSpin: 0.15, limbR: 0.22, leader: 2.5, fork: 2, nm: 0, ns: 0,
    majors: [[0, 2.9, 0.1, 1.6], [-2.5, 1.9, 0.5, 1.35], [2.4, 2.2, -0.6, 1.45], [0.7, 1.5, 2.4, 1.25], [-1.0, 1.7, -2.4, 1.25], [2.6, 1.1, 1.8, 0.95]] },
  { seed: 911, H: 2.7, lean: [-0.25, 0.15], trunk: [0.5, 0.4, 0.34, 0.29], subs: 5, detail: 2, crownR: 4.2, bark: BARK.fissured, roots: 5, rootR: 0.3, rootSpin: 0.5, limbR: 0.22, leader: 2.5, fork: 2, nm: 9, ns: 5,
    majors: [[0.2, 2.6, 0.1, 1.55], [-2.0, 1.7, 0.9, 1.25], [1.8, 2.0, -1.0, 1.35], [0.3, 1.3, 2.1, 1.1], [-0.9, 1.6, -2.0, 1.15]] },
  { seed: 1303, H: 2.4, lean: [0.15, 0.25], trunk: [0.56, 0.45, 0.37, 0.31], subs: 4, detail: 2, crownR: 4.6, bark: BARK.fissured, roots: 6, rootR: 0.32, rootSpin: 0.9, limbR: 0.24, leader: 2.2, fork: 1, nm: 21, ns: 11,
    majors: [[0.4, 2.4, 0.3, 1.45], [-3.1, 1.2, 0.8, 1.2], [2.7, 1.8, -0.3, 1.3], [0.2, 1.2, 2.6, 1.15], [-0.6, 1.5, -2.7, 1.2], [-2.0, 2.7, -1.5, 1.0], [2.0, 2.8, 1.7, 0.95]] },
];
export function oakModel(variant: number, lod: Lod): Model { return broadleaf(OAKS[variant % 3], lod); }

// ------------------------------------------------------------------------------------------------ beech
/**
 * European beech: a straighter, slimmer, smooth grey trunk; a taller, domed crown built in layers (masses rise
 * toward the centre), limbs sweeping upward. Seeded layouts, three variants (narrow-tall to broad).
 */
function beechSpec(v: number): Broadleaf {
  const r = mulberry32(4401 + v * 77);
  const n = 7 + v, wide = [0.85, 1.0, 1.15][v % 3];
  const majors: [number, number, number, number][] = [[0, 4.4 + v * 0.2, 0, 1.15]];
  for (let i = 0; i < n; i++) {
    const layer = i / (n - 1), a = i * 2.4 + r() * 0.6;
    const d = (2.1 - layer * 1.0) * (0.8 + r() * 0.35) * wide, y = 1.1 + layer * 3.0 + r() * 0.4;
    majors.push([Math.cos(a) * d, y, Math.sin(a) * d, (1.12 - layer * 0.25 + r() * 0.15) * (0.9 + 0.1 * wide)]);
  }
  return { seed: 4401 + v * 77, H: [3.9, 3.5, 3.2][v % 3], lean: [[0.1, 0.05], [-0.15, 0.1], [0.05, -0.2]][v % 3] as [number, number], trunk: [0.42, 0.33, 0.29, 0.25], subs: 3, detail: 1, crownR: 4.0, bark: BARK.smooth, roots: 4, rootR: 0.24, rootSpin: v, limbR: 0.18, leader: 3.6, fork: 2, nm: 30 + v * 7, ns: 40 + v * 3, majors };
}
export function beechModel(variant: number, lod: Lod): Model { return broadleaf(beechSpec(variant % 3), lod); }

// ------------------------------------------------------------------------------------------------ birch
/**
 * Silver birch: a slender, slightly wavering white trunk (dark and rough at the base), five or six thin branches
 * that rise and then droop at the tips, light clumps hanging along them — an airy, narrow crown you can see
 * through. Three seeded variants (height, branch count, lean).
 */
export function birchModel(variant: number, lod: Lod): Model {
  const v = variant % 3, r = mulberry32(6203 + v * 131);
  const near = lod === 'near';
  const T = [10.2, 9.0, 11.2][v], sway = [[0.25, -0.1], [-0.3, 0.2], [0.15, 0.3]][v];
  const trunkPts: [number, number, number][] = [[0, -0.3, 0], [sway[0] * 0.3, T * 0.3, sway[1] * 0.2], [sway[0] * 0.2, T * 0.6, sway[1] * 0.7], [sway[0], T, sway[1]]];
  const wood: THREE.BufferGeometry[] = [taperTube(trunkPts, [0.24, 0.17, 0.11, 0.04], { radial: near ? 9 : 5, rows: near ? 10 : 4, vScale: 1.6 })];
  const trunkAt = (y: number): [number, number] => { const t = y / T; return [sway[0] * (t < 0.6 ? t * 0.4 : t), sway[1] * t]; };
  const leaves: THREE.BufferGeometry[] = [];
  const centre = new THREE.Vector3(sway[0] * 0.7, T * 0.72, sway[1] * 0.7);
  const nb = 5 + (v === 2 ? 1 : 0);
  for (let i = 0; i < nb; i++) {
    const y = T * (0.42 + (i / nb) * 0.42) + r() * 0.3, a = i * 2.4 + r() * 0.7, L = (2.2 - (i / nb) * 1.0) * (0.85 + r() * 0.3);
    const [tx, tz] = trunkAt(y), c = Math.cos(a), s = Math.sin(a);
    const pts: [number, number, number][] = [[tx, y, tz], [tx + c * L * 0.4, y + 0.9, tz + s * L * 0.4], [tx + c * L * 0.8, y + 1.15, tz + s * L * 0.8], [tx + c * L, y + 0.6, tz + s * L]];
    wood.push(taperTube(pts, [0.07, 0.05, 0.03, 0.012], { radial: near ? 5 : 3, rows: near ? 6 : 3, vScale: 1.2 }));
    for (let k = 0; k < 3; k++) { // clumps hang along the outer branch
      const t = 0.45 + k * 0.27, p = new THREE.Vector3(tx + c * L * t, y + 0.9 + Math.sin(t * Math.PI) * 0.3 - k * 0.15, tz + s * L * t);
      const cs = 0.5 + r() * 0.22;
      leaves.push(lump(p.x, p.y - cs * 0.25, p.z, cs * 1.1, cs * 0.75, cs, i * 5.1 + k * 1.3 + v, near ? 1 : 0, centre, 3.0, 0.45));
    }
  }
  leaves.push(lump(sway[0], T + 0.1, sway[1], 0.8, 0.7, 0.75, 77 + v, near ? 1 : 0, centre, 3.0, 0.45));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + r(), c = Math.cos(a), s = Math.sin(a);
    wood.push(taperTube([[c * 0.03, 0.55, s * 0.03], [c * 0.3, 0.12, s * 0.3], [c * 0.6, -0.5, s * 0.6]], [0.15, 0.1, 0.03], { radial: near ? 6 : 4, rows: 4, vScale: 1.2 }));
  }
  // birch bark is dark and rugged at the foot, white above
  const woodG = mergeParts(wood.map((g) => barkCol(paint(g, (p) => { const k = 0.35 + 0.65 * THREE.MathUtils.smoothstep(p.y, 0.2, 1.3); return [k, k, k * 0.98]; }), BARK.birch)));
  return { wood: woodG, leaves: mergeParts(leaves.map((g) => foliageUV(g, 1.0))) };
}

// ------------------------------------------------------------------------------------------------ Scots pine
/**
 * Scots pine (the Veluwe tree): a tall, slightly leaning trunk, grey-brown and furrowed low, warm orange high up,
 * a few dead stubs, and an uneven crown of clumped, drooping foliage on near-horizontal branches in the top third.
 * Variant 0 is authored; 1 (shorter, fuller) and 2 (tall, sparse, leaning) are seeded.
 */
export function pineModel(lod: Lod, variant = 0): Model {
  const v = variant % 3, r = mulberry32(733 + v * 211);
  const near = lod === 'near';
  const T = [12.2, 11.0, 13.4][v];
  const off = [[0.35, -0.2], [-0.2, 0.15], [0.6, 0.35]][v];
  const top: [number, number, number] = [off[0], T, off[1]];
  const wood: THREE.BufferGeometry[] = [taperTube([[0, -0.3, 0], [top[0] * 0.15, T * 0.33, top[2] * 0.1], [top[0] * 0.55, T * 0.7, top[2] * 0.5], top], [0.36, 0.27, 0.18, 0.07], { radial: near ? 10 : 5, rows: near ? 12 : 4, lobes: near ? 4 : 0, flare: 0.35, vScale: 1.6 })];
  const pads: [number, number, number, number][] = []; // x, y, z, size
  const tiers: number[][] = v === 0
    ? [[6.6, 0.3, 2.3], [7.2, 2.5, 2.0], [7.9, 4.4, 2.1], [8.5, 1.3, 1.9], [9.1, 3.5, 1.7], [9.6, 5.6, 1.5], [10.2, 0.7, 1.4], [10.7, 2.8, 1.2], [11.2, 4.8, 1.0]]
    : Array.from({ length: v === 1 ? 10 : 8 }, (_, i) => { const t = i / (v === 1 ? 9 : 7); return [T * (0.5 + t * 0.42) + r() * 0.3, i * 2.39 + r() * 0.8, (v === 1 ? 2.4 : 2.0) - 1.2 * t + r() * 0.3]; });
  for (const [y, a, L] of tiers) {
    const t = y / T, cx = top[0] * t, cz = top[2] * t;
    const ex = cx + Math.cos(a) * L, ez = cz + Math.sin(a) * L;
    wood.push(taperTube([[cx, y - 0.15, cz], [cx + Math.cos(a) * L * 0.5, y + 0.1, cz + Math.sin(a) * L * 0.5], [ex, y + 0.05, ez]], [0.1, 0.06, 0.03], { radial: near ? 5 : 3, rows: near ? 4 : 2, vScale: 1.2 }));
    pads.push([ex, y + 0.15, ez, 0.55 + L * 0.22]);
  }
  pads.push([top[0], T - 0.1, top[2], 0.95]);
  if (near) for (let i = 0; i < 4; i++) { // dead stubs low on the trunk
    const y = 2.4 + i * 0.95, a = i * 2.1 + r();
    wood.push(taperTube([[0, y, 0], [Math.cos(a) * 0.45, y - 0.12, Math.sin(a) * 0.45]], [0.05, 0.02], { radial: 4, rows: 2 }));
  }
  // bark: grey-brown low, warm orange above ~5 m (the Scots pine's signature)
  const woodG = mergeParts(wood.map((g) => barkCol(paint(g, (p) => {
    const t = THREE.MathUtils.smoothstep(p.y, T * 0.29, T * 0.6);
    return [0.62 + 0.55 * t, 0.56 + 0.2 * t, 0.5 + 0.02 * t];
  }), BARK.fissured)));
  const centre = new THREE.Vector3(top[0] * 0.75, T * 0.77, top[2] * 0.75);
  const leaves: THREE.BufferGeometry[] = [];
  pads.forEach(([x, y, z, s], i) => {
    const n = 4; // same clumps in both LODs, coarser far away
    const dx = x - top[0] * (y / T), dz = z - top[2] * (y / T), dl = Math.hypot(dx, dz) || 1;
    for (let k = 0; k < n; k++) {
      const back = (k / n) * 0.9, side = (r() - 0.5) * s * 0.9;
      const px = x - (dx / dl) * back + (-dz / dl) * side, pz = z - (dz / dl) * back + (dx / dl) * side;
      const cs = s * (k ? 0.62 + r() * 0.2 : 0.85);
      leaves.push(lump(px, y + back * 0.12 - (k ? 0 : 0.08) + r() * 0.12, pz, cs * 1.1, cs * 0.55, cs, i * 3.1 + k + v * 17, near ? 1 : 0, centre, 3.2, 0.4));
    }
  });
  return { wood: woodG, leaves: mergeParts(leaves.map((g) => foliageUV(g, 1.2))) };
}

export function treeModel(species: TreeSpecies, variant: number, lod: Lod): Model {
  return species === 'oak' ? oakModel(variant, lod) : species === 'beech' ? beechModel(variant, lod) : species === 'birch' ? birchModel(variant, lod) : pineModel(lod, variant);
}

// ------------------------------------------------------------------------------------------------ bushes
/**
 * Hazel: six to eight thin, smooth stems fanning up from one stool, leaf clumps along their upper half — the
 * multi-stemmed understory shrub of oak woods. Three seeded variants (stem count, height, spread).
 */
export function hazelModel(variant: number, lod: Lod): Model {
  const v = variant % 3, r = mulberry32(8101 + v * 59), near = lod === 'near';
  const n = 6 + v, Hh = [1.8, 2.2, 1.5][v], spread = [0.55, 0.45, 0.65][v];
  const wood: THREE.BufferGeometry[] = [], leaves: THREE.BufferGeometry[] = [];
  const centre = new THREE.Vector3(0, Hh * 0.7, 0);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.6, h = Hh * (0.75 + r() * 0.35), d = h * spread * (0.7 + r() * 0.5);
    const c = Math.cos(a), s = Math.sin(a);
    const pts: [number, number, number][] = [[c * 0.05, -0.1, s * 0.05], [c * 0.15, h * 0.4, s * 0.15], [c * d * 0.6, h * 0.75, s * d * 0.6], [c * d, h, s * d]];
    wood.push(taperTube(pts, [0.045, 0.035, 0.022, 0.01], { radial: near ? 5 : 3, rows: near ? 5 : 2, vScale: 1.0 }));
    // leafy from knee height to the arching tips, clumps pushed out from the stem (an open, irregular fan,
    // not a ball on sticks); smaller clumps toward the tips
    for (const t of [0.3, 0.55, 0.8, 1.0]) {
      if (t === 0.3 && r() < 0.4) continue;
      const cs = (0.36 + r() * 0.14) * (1.15 - t * 0.35), out = 0.18 + r() * 0.12;
      leaves.push(lump(c * (d * t + out), h * (0.25 + t * 0.7), s * (d * t + out), cs * 1.15, cs * 0.75, cs, i * 3.7 + t * 5 + v, near ? 1 : 0, centre, 1.6, 0.4));
    }
  }
  const woodG = mergeParts(wood.map((g) => barkCol(paint(g, 0.85), BARK.smooth)));
  return { wood: woodG, leaves: mergeParts(leaves.map((g) => foliageUV(g, 0.9))) };
}
/**
 * Holly: a compact, dense evergreen — a short stem under an irregular cone of spiky (strongly displaced) dark
 * clumps. Three seeded variants (height, fullness).
 */
export function hollyModel(variant: number, lod: Lod): Model {
  const v = variant % 3, r = mulberry32(9203 + v * 71), near = lod === 'near';
  const Hh = [1.5, 1.9, 1.25][v], n = 9 + v * 2;
  const wood = [barkCol(paint(taperTube([[0, -0.1, 0], [0.02, 0.35, 0.01], [0.03, 0.7, 0]], [0.08, 0.06, 0.04], { radial: near ? 6 : 4, rows: 3 }), 0.8), BARK.smooth)];
  const leaves: THREE.BufferGeometry[] = [];
  const centre = new THREE.Vector3(0, Hh * 0.5, 0);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), y = 0.35 + t * Hh * 0.85, rad = (1 - t) * 0.55 + 0.12, a = i * 2.3 + r() * 0.8;
    const cs = 0.26 + (1 - t) * 0.2 + r() * 0.06;
    leaves.push(lump(Math.cos(a) * rad, y, Math.sin(a) * rad, cs * 1.1, cs * 0.9, cs, i * 4.3 + v * 7, near ? 1 : 0, centre, Hh * 0.6, 0.45, 0.34));
  }
  return { wood: mergeParts(wood), leaves: mergeParts(leaves.map((g) => foliageUV(g, 0.7))) };
}
export function bushModel(species: BushSpecies, variant: number, lod: Lod): Model {
  return species === 'hazel' ? hazelModel(variant, lod) : hollyModel(variant, lod);
}

// ------------------------------------------------------------------------------------------------ rocks
/**
 * Rock: the convex hull of a few jittered points on a squashed, slightly tilted ellipsoid — a handful of broad,
 * deliberate planes. Normals creased at ~32° so shallow transitions soften while real edges stay crisp. Vertex
 * colour: moss on upward faces near the top, darker toward the ground (contact).
 */
export function rockModel(seed: number): THREE.BufferGeometry {
  const r: Rng = mulberry32(seed);
  const pts: THREE.Vector3[] = [];
  const n = 11 + Math.floor(r() * 4), tilt = (r() - 0.5) * 0.35;
  for (let i = 0; i < n; i++) {
    const u = r() * Math.PI * 2, v = Math.acos(2 * r() - 1);
    let x = Math.sin(v) * Math.cos(u), y = Math.cos(v), z = Math.sin(v) * Math.sin(u);
    y = y > 0 ? y * (0.55 + r() * 0.25) : y * 0.4; // flatter top, buried bottom
    x *= 1.0 + r() * 0.25; z *= 0.75 + r() * 0.2;
    pts.push(new THREE.Vector3(x, y + x * tilt, z));
  }
  pts.push(new THREE.Vector3(0.9, -0.45, 0.6), new THREE.Vector3(-0.9, -0.45, -0.5), new THREE.Vector3(0.2, -0.45, -0.8), new THREE.Vector3(-0.3, -0.45, 0.8));
  const hull = new ConvexGeometry(pts);
  hull.deleteAttribute('normal');
  const g = toCreasedNormals(hull, 0.56);
  hull.dispose();
  g.computeBoundingBox();
  const top = g.boundingBox!.max.y, bot = g.boundingBox!.min.y;
  const nn = g.attributes.normal as THREE.BufferAttribute;
  const face: number[] = [];
  for (let f = 0; f < g.attributes.position.count / 3; f++) face.push(0.88 + r() * 0.2); // each plane its own value
  paint(g, (p, i) => {
    const h = (p.y - bot) / (top - bot), up = nn.getY(i);
    const moss = THREE.MathUtils.smoothstep(up, 0.55, 0.9) * THREE.MathUtils.smoothstep(h, 0.45, 0.85);
    const k = (0.72 + 0.28 * THREE.MathUtils.smoothstep(h, 0.0, 0.35)) * face[Math.floor(i / 3)];
    return [k * (1 - moss * 0.4), k * (1 - moss * 0.12), k * (1 - moss * 0.55)];
  });
  // planar UVs (strata run horizontally)
  const p = g.attributes.position as THREE.BufferAttribute, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(nn.getX(i)) > Math.abs(nn.getZ(i)); uv[i * 2] = (ax ? p.getZ(i) : p.getX(i)) * 0.9; uv[i * 2 + 1] = p.getY(i) * 0.9; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeBoundingSphere();
  return g;
}

// ------------------------------------------------------------------------------------------------ understory plants
// All plants: non-indexed, two-sided by duplicated triangles, attributes position + normal + color only (one batch,
// one flat material). Colours are AUTHORED here (linear, from sRGB hex), so foxglove bells and lily flowers keep
// their colour; the per-instance colour is a near-white brightness/hue variation.
export type PlantKind = 'fern' | 'grass' | 'bilberry' | 'foxglove' | 'lily' | 'anemone';
export const PLANT_VARIANTS: Record<PlantKind, number> = { fern: 3, grass: 4, bilberry: 3, foxglove: 3, lily: 3, anemone: 3 };

class Tris {
  pos: number[] = []; col: number[] = [];
  tri(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, ca: THREE.Color, cb = ca, cc = cb) {
    this.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    this.col.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b);
  }
  quad(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, c0: THREE.Color, c1 = c0) { this.tri(a, b, c, c0, c0, c1); this.tri(a, c, d, c0, c1, c1); }
  /** Normals from the faces, flipped to face up, then biased toward the sky by `up` (0–1); two-sided. */
  build(up = 0.4) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeVertexNormals();
    const nn = g.attributes.normal as THREE.BufferAttribute, v = new THREE.Vector3();
    for (let i = 0; i < nn.count; i++) { v.fromBufferAttribute(nn, i); if (v.y < 0) v.negate(); v.lerp(UP, up).normalize(); nn.setXYZ(i, v.x, v.y, v.z); }
    return twoSided(g);
  }
}
const C = (hex: string) => new THREE.Color(hex);
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const mix = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, t);
/** A flat pointed leaf lying along `dir` (unit, horizontal) from `base`, bending up by `lift` then down at the tip. */
function leafShape(t: Tris, base: THREE.Vector3, dir: THREE.Vector3, L: number, W: number, lift: number, c0: THREE.Color, c1: THREE.Color, segs = 4, upright = 0) {
  const side = V(-dir.z, 0, dir.x);
  const at = (u: number, s: number) => {
    const w = W * Math.sin(Math.PI * Math.min(1, u * 1.05)) * (1 - u * 0.3);
    const h = Math.sin(u * Math.PI * 0.8) * lift + u * upright * L;
    return base.clone().addScaledVector(dir, u * L * (1 - upright * 0.6)).addScaledVector(side, s * w).add(V(0, h - Math.abs(s) * w * 0.2, 0));
  };
  for (let i = 0; i < segs; i++) {
    const u0 = i / segs, u1 = (i + 1) / segs, k0 = mix(c0, c1, u0), k1 = mix(c0, c1, u1);
    t.quad(at(u0, 0), at(u1, 0), at(u1, 1), at(u0, 1), k0, k1);
    t.quad(at(u0, -1), at(u1, -1), at(u1, 0), at(u0, 0), k0, k1);
  }
}
/** A small open bell (cone of `n` sides) hanging from `p` along `dir`. */
function bell(t: Tris, p: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, c0: THREE.Color, c1: THREE.Color, n = 5) {
  const a = dir.clone().normalize(), u = Math.abs(a.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0), s1 = u.clone().cross(a).normalize(), s2 = a.clone().cross(s1);
  const tip = p.clone().addScaledVector(a, len);
  for (let i = 0; i < n; i++) {
    const q0 = (i / n) * Math.PI * 2, q1 = ((i + 1) / n) * Math.PI * 2;
    const e0 = tip.clone().addScaledVector(s1, Math.cos(q0) * rad).addScaledVector(s2, Math.sin(q0) * rad);
    const e1 = tip.clone().addScaledVector(s1, Math.cos(q1) * rad).addScaledVector(s2, Math.sin(q1) * rad);
    t.tri(p, e0, e1, c0, c1, c1);
  }
}
/** A thin stem (flat ribbon facing the camera from most sides: two crossed strips). */
function stem(t: Tris, pts: THREE.Vector3[], w: number, c0: THREE.Color, c1 = c0) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], k0 = mix(c0, c1, (i - 1) / (pts.length - 1)), k1 = mix(c0, c1, i / (pts.length - 1));
    const w0 = w * (1 - (i - 1) / pts.length), w1 = w * (1 - i / pts.length);
    for (const d of [V(1, 0, 0), V(0, 0, 1)]) t.quad(a.clone().addScaledVector(d, -w0), b.clone().addScaledVector(d, -w1), b.clone().addScaledVector(d, w1), a.clone().addScaledVector(d, w0), k0, k1);
  }
}

/** Fern: arching fronds with alternating pinnae. 0: nine mid fronds, 1: thirteen long fresh fronds, 2: seven short dark ones. */
export function fernModel(variant = 0): THREE.BufferGeometry {
  const v = variant % 3, r = mulberry32(61 + v * 13), t = new Tris();
  const F = [9, 13, 7][v], Lb = [0.55, 0.7, 0.42][v], base = C(['#3f5a22', '#45622a', '#36501f'][v]), tipC = C(['#7d9a3c', '#90ad48', '#647f34'][v]);
  for (let f = 0; f < F; f++) {
    const a = (f / F) * Math.PI * 2 + r() * 0.4, L = Lb + r() * 0.3, rise = 0.32 + r() * 0.15;
    const dir = V(Math.cos(a), 0, Math.sin(a)), side = V(-Math.sin(a), 0, Math.cos(a));
    const S = 7;
    const spine = (u: number) => dir.clone().multiplyScalar(u * L).add(V(0, Math.sin(u * Math.PI * 0.85) * rise - u * u * 0.12, 0));
    for (let i = 0; i < S; i++) {
      const t0 = i / S, t1 = (i + 1) / S, p0 = spine(t0), p1 = spine(t1);
      const w = 0.11 * Math.sin(Math.PI * Math.min(1, t0 * 1.1 + 0.08)) * (1 - t0 * 0.55);
      const k0 = mix(base, tipC, t0), k1 = mix(base, tipC, t1);
      for (const sgn of [-1, 1]) {
        const tip = p0.clone().lerp(p1, 0.5).addScaledVector(side, sgn * w).addScaledVector(dir, w * 0.35).add(V(0, -w * 0.25, 0));
        t.tri(p0, sgn > 0 ? p1 : tip, sgn > 0 ? tip : p1, k0, sgn > 0 ? k1 : k1, k1);
      }
    }
  }
  return t.build(0.45);
}

/** Grass: 0 short tuft, 1 tall wispy, 2 tuft with seed heads, 3 broad arching sedge. */
export function grassModel(variant = 0): THREE.BufferGeometry {
  const v = variant % 4, r = mulberry32(63 + v * 17), t = new Tris();
  const spec = [
    { n: 13, h: [0.28, 0.22], w: [0.022, 0.012], lean: [0.12, 0.2], c0: '#4d6428', c1: '#9cb35a' },
    { n: 20, h: [0.45, 0.35], w: [0.013, 0.008], lean: [0.2, 0.25], c0: '#556b2f', c1: '#b9b46e' },
    { n: 11, h: [0.26, 0.18], w: [0.02, 0.01], lean: [0.1, 0.15], c0: '#4d6428', c1: '#a3b360' },
    { n: 9, h: [0.32, 0.18], w: [0.038, 0.012], lean: [0.25, 0.2], c0: '#3f5a26', c1: '#7e9446' },
  ][v];
  const c0 = C(spec.c0), c1 = C(spec.c1);
  for (let i = 0; i < spec.n; i++) {
    const a = r() * Math.PI * 2, h = spec.h[0] + r() * spec.h[1], lean = spec.lean[0] + r() * spec.lean[1], w = spec.w[0] + r() * spec.w[1];
    const d = V(Math.cos(a), 0, Math.sin(a)), s = V(-Math.sin(a), 0, Math.cos(a));
    const base = d.clone().multiplyScalar(r() * 0.06);
    const pt = (u: number, side: number) => base.clone().addScaledVector(d, lean * u * u).add(V(0, h * u * (1 - (v === 3 ? 0.25 * u * u : 0)), 0)).addScaledVector(s, side * w * (1 - u));
    for (let k = 0; k < 2; k++) { const u0 = k / 2, u1 = (k + 1) / 2; t.quad(pt(u0, -1), pt(u0, 1), pt(u1, 1), pt(u1, -1), mix(c0, c1, u0), mix(c0, c1, u1)); }
  }
  if (v === 2) for (let i = 0; i < 4; i++) { // seed stems with an oat-like head
    const a = r() * Math.PI * 2, h = 0.55 + r() * 0.25, d = V(Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08);
    const top = d.clone().add(V(0, h, 0));
    stem(t, [V(0, 0, 0), d.clone().multiplyScalar(0.5).add(V(0, h * 0.5, 0)), top], 0.005, C('#6f7f3a'), C('#a99c62'));
    const head = C('#b5a26a');
    for (let k = 0; k < 4; k++) leafShape(t, top.clone().add(V(0, -k * 0.035, 0)), V(Math.cos(a + k * 1.6), 0, Math.sin(a + k * 1.6)), 0.05, 0.012, -0.03, head, head, 1);
  }
  return t.build(0.6);
}

/** Bilberry (blauwe bosbes): a low twiggy mound of small bluish leaves; 1 and 2 carry dark blue berries. */
export function bilberryModel(variant = 0): THREE.BufferGeometry {
  const v = variant % 3, r = mulberry32(71 + v * 19), t = new Tris();
  const n = 6 + v * 2, Hh = [0.26, 0.34, 0.22][v];
  const twig = C('#4f6a2a'), l0 = C('#3f6234'), l1 = C('#6c8f48'), berry = C('#2a3156');
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r(), lean = 0.08 + r() * 0.12, h = Hh * (0.7 + r() * 0.5);
    const d = V(Math.cos(a), 0, Math.sin(a));
    const pts = [V(0, 0, 0), d.clone().multiplyScalar(lean * 0.4).add(V(0, h * 0.5, 0)), d.clone().multiplyScalar(lean).add(V(0, h, 0))];
    stem(t, pts, 0.004, twig);
    for (let k = 0; k < 4; k++) {
      const u = 0.4 + k * 0.18, p = pts[0].clone().lerp(pts[2], u), la = a + (k % 2 ? 1.4 : -1.4) + r() * 0.5;
      leafShape(t, p, V(Math.cos(la), 0, Math.sin(la)), 0.05, 0.02, 0.01, l0, mix(l0, l1, r()), 1);
    }
    if (v && r() < 0.6) { const p = pts[2].clone().add(V(0, -0.04, 0)); bell(t, p.clone().add(V(0, 0.012, 0)), V(0, -1, 0), 0.022, 0.009, berry, berry, 4); }
  }
  return t.build(0.5);
}

/** Foxglove: a rosette of broad leaves and one or two spikes of pink-purple bells hanging to one side. */
export function foxgloveModel(variant = 0): THREE.BufferGeometry {
  const v = variant % 3, r = mulberry32(81 + v * 23), t = new Tris();
  const leaf0 = C('#46632e'), leaf1 = C('#6f8c48');
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + r() * 0.5;
    leafShape(t, V(0, 0.02, 0), V(Math.cos(a), 0, Math.sin(a)), 0.24 + r() * 0.1, 0.06, 0.05, leaf0, leaf1, 4);
  }
  const spikes = v === 2 ? [[0.95, 0.04], [0.75, -0.06]] : [[v ? 1.15 : 0.9, 0]];
  const b0 = C('#8e3f7e'), b1 = C('#d58ac0');
  spikes.forEach(([h, off], si) => {
    const lean = V(0.06 + off, 0, 0.03), pts = [V(off, 0, 0), V(off, h * 0.5, 0).add(lean.clone().multiplyScalar(0.4)), V(off, h, 0).add(lean)];
    stem(t, pts, 0.008, C('#5a7436'), C('#6d7f45'));
    const face = si * 2.0 + r();
    for (let k = 0; k < 11; k++) {
      const u = 0.4 + k * 0.054, p = pts[0].clone().lerp(pts[2], u), sz = 1 - k * 0.055;
      const dir = V(Math.cos(face + (k % 2) * 0.6), -0.7, Math.sin(face + (k % 2) * 0.6));
      bell(t, p, dir, 0.085 * sz, 0.036 * sz, k > 8 ? C('#7a6a5a') : b0, k > 8 ? C('#8a6f7a') : b1, 6);
    }
  });
  return t.build(0.3);
}

/** Lily of the valley: two or three broad upright leaves and an arching stem of tiny white bells. */
export function lilyModel(variant = 0): THREE.BufferGeometry {
  const v = variant % 3, r = mulberry32(91 + v * 29), t = new Tris();
  const nl = v === 1 ? 3 : 2, nb = [5, 7, 4][v], l0 = C('#3c6a2e'), l1 = C('#6b9a48'), white = C('#f2f0e4');
  for (let i = 0; i < nl; i++) {
    const a = (i / nl) * Math.PI * 2 + r() * 0.6;
    leafShape(t, V(0, 0, 0), V(Math.cos(a), 0, Math.sin(a)), 0.2 + r() * 0.04, 0.045, 0.02, l0, l1, 4, 0.85);
  }
  const a = r() * Math.PI * 2, d = V(Math.cos(a), 0, Math.sin(a));
  const pts = [V(0, 0, 0), d.clone().multiplyScalar(0.02).add(V(0, 0.13, 0)), d.clone().multiplyScalar(0.07).add(V(0, 0.17, 0)), d.clone().multiplyScalar(0.11).add(V(0, 0.14, 0))];
  stem(t, pts, 0.003, C('#5b8040'));
  for (let k = 0; k < nb; k++) {
    const u = 0.4 + (k / nb) * 0.6, i = Math.min(2, Math.floor(u * 3)), p = pts[i].clone().lerp(pts[i + 1], u * 3 - i);
    bell(t, p.add(V(0, -0.01, 0)), V(0, -1, 0), 0.016, 0.009, white, white, 5);
  }
  return t.build(0.4);
}

/** Wood anemone: one, three or five white stars over a whorl of three lobed leaves. */
export function anemoneModel(variant = 0): THREE.BufferGeometry {
  const v = variant % 3, r = mulberry32(101 + v * 31), t = new Tris();
  const n = [1, 3, 5][v], white = C('#f6f3ea'), eye = C('#e8c94a'), green = C('#4d7a34');
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, rr = i ? 0.04 + r() * 0.05 : 0, h = 0.1 + r() * 0.05;
    const b = V(Math.cos(a) * rr, 0, Math.sin(a) * rr), top = b.clone().add(V(0, h, 0));
    stem(t, [b, top], 0.003, green);
    for (let k = 0; k < 3; k++) { const la = a + k * 2.1; leafShape(t, b.clone().add(V(0, h * 0.55, 0)), V(Math.cos(la), 0, Math.sin(la)), 0.04, 0.02, 0.005, green, green, 1); }
    for (let k = 0; k < 6; k++) { // six petals around a yellow eye
      const pa = (k / 6) * Math.PI * 2 + a, d = V(Math.cos(pa), 0, Math.sin(pa)), s = V(-d.z, 0, d.x);
      t.tri(top, top.clone().addScaledVector(d, 0.03).addScaledVector(s, 0.011), top.clone().addScaledVector(d, 0.03).addScaledVector(s, -0.011), eye, white, white);
    }
  }
  return t.build(0.7);
}

export function plantModel(kind: PlantKind, variant: number): THREE.BufferGeometry {
  return kind === 'fern' ? fernModel(variant) : kind === 'grass' ? grassModel(variant) : kind === 'bilberry' ? bilberryModel(variant) : kind === 'foxglove' ? foxgloveModel(variant) : kind === 'lily' ? lilyModel(variant) : anemoneModel(variant);
}

/** A fallen leaf lying flat (instanced by the hundred as litter). */
export function litterLeafModel(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, -0.05); s.quadraticCurveTo(0.035, 0, 0, 0.05); s.quadraticCurveTo(-0.035, 0, 0, -0.05);
  const g = new THREE.ShapeGeometry(s, 2).rotateX(-Math.PI / 2);
  g.deleteAttribute('uv');
  return twoSided(paint(g, 1));
}

// ------------------------------------------------------------------------------------------------ materials
function canvasTex(w: number, h: number, draw: (x: CanvasRenderingContext2D, r: Rng) => void, seed: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!, mulberry32(seed));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
const grey = (v: number, a = 1) => `rgba(${Math.round(v * 255)},${Math.round(v * 255)},${Math.round(v * 255)},${a})`;
export interface WoodMats { bark: THREE.MeshLambertMaterial; leaves: THREE.MeshLambertMaterial; rock: THREE.MeshLambertMaterial; flat: THREE.MeshLambertMaterial }
let wm: WoodMats | null = null;
/** Bark atlas (u = around the trunk); foliage gets soft leaf dabs; rock gets faint strata; flat for plants. */
export function woodMats(): WoodMats {
  if (wm) return wm;
  // bark atlas (see barkCol): three 128 px columns — fissured, smooth, birch. u is clamped (each column is one
  // trip round the trunk), v repeats along it
  const bark = canvasTex(384, 256, (x, r) => {
    // 0: fissured (oak, pine) — wavy furrows along the trunk
    x.fillStyle = grey(0.86); x.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 26; i++) {
      const cx = r() * 128, w = 2 + r() * 4;
      x.strokeStyle = grey(0.6 + r() * 0.12, 0.8); x.lineWidth = w; x.beginPath();
      for (let y = -10; y <= 266; y += 16) { const xx = cx + Math.sin(y * 0.05 + i) * 3; if (y < 0) x.moveTo(xx, y); else x.lineTo(xx, y); }
      x.stroke();
    }
    for (let i = 0; i < 120; i++) { x.fillStyle = grey(0.92 + r() * 0.08, 0.35); x.fillRect(r() * 128, r() * 256, 6 + r() * 10, 2 + r() * 3); }
    // 1: smooth (beech, hazel) — soft mottling and faint horizontal lenticels
    x.fillStyle = grey(0.9); x.fillRect(128, 0, 128, 256);
    for (let i = 0; i < 70; i++) { x.fillStyle = grey(0.8 + r() * 0.16, 0.35); x.beginPath(); x.ellipse(128 + r() * 128, r() * 256, 6 + r() * 14, 4 + r() * 10, 0, 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < 60; i++) { x.fillStyle = grey(0.72, 0.45); x.fillRect(128 + r() * 120, r() * 256, 3 + r() * 6, 1); }
    // 2: birch — white with black horizontal dashes and dark patches
    x.fillStyle = grey(0.96); x.fillRect(256, 0, 128, 256);
    for (let i = 0; i < 90; i++) { x.fillStyle = grey(0.12 + r() * 0.2, 0.85); x.fillRect(256 + r() * 120, r() * 256, 4 + r() * 16, 1 + r() * 2.5); }
    for (let i = 0; i < 10; i++) { x.fillStyle = grey(0.2 + r() * 0.15, 0.7); x.beginPath(); x.ellipse(256 + r() * 128, r() * 256, 6 + r() * 10, 3 + r() * 5, 0, 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < 40; i++) { x.fillStyle = grey(0.85 + r() * 0.1, 0.5); x.fillRect(256 + r() * 128, r() * 256, 10 + r() * 20, 2); }
  }, 81);
  bark.wrapS = THREE.ClampToEdgeWrapping;
  const leaf = canvasTex(128, 128, (x, r) => {
    x.fillStyle = grey(0.86); x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i++) {
      const px = r() * 128, py = r() * 128, s = 3 + r() * 5;
      x.fillStyle = grey(0.74 + r() * 0.3, 0.75);
      for (const ox of [-128, 0, 128]) for (const oy of [-128, 0, 128]) { x.beginPath(); x.ellipse(px + ox, py + oy, s, s * 0.55, r() * Math.PI, 0, Math.PI * 2); x.fill(); }
    }
  }, 82);
  const strata = canvasTex(128, 128, (x, r) => {
    x.fillStyle = grey(0.9); x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 14; i++) { x.fillStyle = grey(0.82 + r() * 0.14, 0.6); x.fillRect(0, r() * 128, 128, 2 + r() * 6); }
    for (let i = 0; i < 60; i++) { x.fillStyle = grey(0.7 + r() * 0.3, 0.3); x.fillRect(r() * 128, r() * 128, 2 + r() * 5, 2 + r() * 5); }
  }, 83);
  const lam = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial({ vertexColors: true, ...o });
  wm = {
    bark: lam({ map: bark }),
    leaves: lam({ map: leaf }),
    rock: lam({ map: strata }),
    flat: lam({}),
  };
  return wm;
}
