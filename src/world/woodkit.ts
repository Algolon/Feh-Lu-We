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
/** Spherical-ish UVs for foliage masses (a leaf-dab texture wraps without stretching badly); u offset by LEAF_U. */
function foliageUV(g: THREE.BufferGeometry, scale: number) {
  const p = g.attributes.position as THREE.BufferAttribute, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = LEAF_U + (p.getX(i) + p.getZ(i) * 0.7) / scale; uv[i * 2 + 1] = (p.getY(i) + p.getZ(i) * 0.4) / scale; }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

export interface Model { wood: THREE.BufferGeometry; leaves: THREE.BufferGeometry }
/** near < 16 m (inspected), mid 16–26 m, far beyond (in the haze). All three share one skeleton and layout. */
export type Lod = 'near' | 'mid' | 'far';
export type TreeSpecies = 'oak' | 'beech' | 'birch' | 'pine';
export type BushSpecies = 'hazel' | 'holly';
/** Variants per species (each a distinct, authored or seeded silhouette). */
export const VARIANTS = 3;

// ------------------------------------------------------------------------------------------------ bark atlas
/**
 * One texture (the tree atlas, see woodMats) holds three barks and the leaf dabs side by side, so trunks and
 * crowns of every species share ONE material and each tree LOD is ONE geometry:
 * columns 0 fissured (oak, pine), 1 smooth with faint lenticels (beech, hazel, holly), 2 birch (white with black
 * dashes), 3 leaf dabs. Bark u (around the trunk, 0–1) is remapped into its column with a gutter against filtering
 * bleed; foliage u is stored as LEAF_U + u and wrapped into column 3 by the material (it repeats freely).
 */
export const BARK = { fissured: 0, smooth: 1, birch: 2 } as const;
export const ATLAS_COLS = 4;
/** Foliage UVs carry this offset in u: the tree material recognises them and repeats them inside the leaf column. */
export const LEAF_U = 64;
const GUT = 0.07;
function barkCol(g: THREE.BufferGeometry, col: number) {
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setX(i, (col + GUT + Math.min(1, Math.max(0, uv.getX(i))) * (1 - 2 * GUT)) / ATLAS_COLS);
  return g;
}

// ------------------------------------------------------------------------------------------------ tree building blocks
type P3 = [number, number, number];
const vec = (p: P3) => new THREE.Vector3(p[0], p[1], p[2]);

/**
 * A foliage cluster: a displaced, slightly flattened sphere. Near: icosphere (80 triangles); far: octasphere (32)
 * (small clusters one step coarser) — same centre, size and noise, so the LOD switch keeps the outline.
 * Normals are blended toward the crown centre (one soft volume) and biased up (undersides read as shaded green,
 * not black); vertex colour bakes occlusion (darker inside and underneath, lighter and warmer on outer tops) and a
 * small per-cluster value step so overlapping clusters separate.
 */
interface Cluster { c: THREE.Vector3; r: P3; seed: number; amp: number; flat: number; val: number; spiky?: boolean; /** a small filler clump: near LOD only */ sat?: boolean }
function clusterGeo(k: Cluster, lod: Lod, crownC: THREE.Vector3, crownR: number, bend = 0.5, nearSmall = 0.5) {
  // small clusters one step coarser: near icosphere (80) / octasphere (32); far octasphere (32) / icosahedron (20)
  // far: icosahedron (20) for every cluster
  const small = Math.max(...k.r) < (lod === 'near' ? nearSmall : 0.9);
  const g0 = lod === 'near' ? (small ? new THREE.OctahedronGeometry(1, 1) : new THREE.IcosahedronGeometry(1, 1)) : small || lod === 'far' ? new THREE.IcosahedronGeometry(1, 0) : new THREE.OctahedronGeometry(1, 1);
  g0.deleteAttribute('normal'); g0.deleteAttribute('uv');
  const g = mergeVertices(g0, 1e-5);
  g0.dispose();
  const p = g.attributes.position as THREE.BufferAttribute, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let d = 1 + k.amp * n3(v.x * 1.7, v.y * 1.7, v.z * 1.7, k.seed) + k.amp * 0.45 * n3(v.x * 3.9, v.y * 3.9, v.z * 3.9, k.seed + 7.7);
    if (k.spiky) d += 0.22 * Math.max(0, n3(v.x * 6.3, v.y * 6.3, v.z * 6.3, k.seed + 3.1));
    v.multiplyScalar(d);
    if (v.y < 0) v.y *= k.flat;
    p.setXYZ(i, k.c.x + v.x * k.r[0], k.c.y + v.y * k.r[1], k.c.z + v.z * k.r[2]);
  }
  g.computeVertexNormals();
  const nn = g.attributes.normal as THREE.BufferAttribute, w = new THREE.Vector3(), col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    w.copy(v).sub(crownC);
    const dist = w.length() / crownR;
    w.normalize();
    const n = new THREE.Vector3().fromBufferAttribute(nn, i).lerp(w, bend).normalize().lerp(UP, 0.3).normalize();
    nn.setXYZ(i, n.x, n.y, n.z);
    const up = THREE.MathUtils.smoothstep(n.y, -0.7, 0.9);
    const kk = (0.78 + 0.22 * up) * (0.72 + 0.28 * THREE.MathUtils.smoothstep(dist, 0.3, 1.0)) * 1.12 * k.val;
    col[i * 3] = kk * (0.98 + 0.08 * up); col[i * 3 + 1] = kk * (1.0 + 0.04 * up); col[i * 3 + 2] = kk * (1.0 - 0.14 * up);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
/** Far LOD: the n largest clusters, a little larger, so the crown keeps its mass and outline with fewer parts. */
function largest(ks: Cluster[], n: number) {
  if (ks.length <= n) return ks;
  const f = Math.cbrt(ks.length / n);
  return [...ks].sort((a, b) => b.r[0] * b.r[1] * b.r[2] - a.r[0] * a.r[1] * a.r[2]).slice(0, n).map((k) => ({ ...k, r: k.r.map((x) => x * f) as P3 }));
}
/**
 * Drop cluster triangles buried inside a neighbouring cluster (centroid well inside its ellipsoid): they are never
 * seen, only drawn. Keeps every triangle on the outside of the crown.
 */
function cullBuried(geos: THREE.BufferGeometry[], ks: Cluster[], margin = 0.82) {
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  geos.forEach((g, gi) => {
    const p = g.attributes.position as THREE.BufferAttribute, idx = g.index!.array, keep: number[] = [];
    for (let t = 0; t < idx.length; t += 3) {
      a.fromBufferAttribute(p, idx[t]); b.fromBufferAttribute(p, idx[t + 1]); c.fromBufferAttribute(p, idx[t + 2]);
      a.add(b).add(c).divideScalar(3);
      const hidden = ks.some((k, ki) => ki !== gi && ((a.x - k.c.x) / k.r[0]) ** 2 + ((a.y - k.c.y) / k.r[1]) ** 2 + ((a.z - k.c.z) / k.r[2]) ** 2 < margin * margin);
      if (!hidden) keep.push(idx[t], idx[t + 1], idx[t + 2]);
    }
    g.setIndex(keep);
  });
  return geos;
}

/**
 * Trunk with integrated roots: horizontal rings round a smooth (slightly leaning) axis. Toward the ground the ring
 * swells into buttress lobes at irregular bearings and strengths, widest at ground level and narrowing again below
 * it, so each lobe is a root ridge that rises out of the soil and runs up into the trunk — no separate root tubes,
 * no joints, no visible root tips — and on a slope the downhill side shows the ridges diving into the soil.
 */
function flaredTrunk(path: P3[], radius: (t: number) => number, lobes: { a: number; w: number }[], flare: number, flareH: number, radial: number, rows: number, vScale: number) {
  const curve = new THREE.CatmullRomCurve3(path.map(vec), false, 'centripetal');
  const len = curve.getLength();
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const P = new THREE.Vector3();
  // ring heights: dense through the flare (where the buttresses change fastest), then even up the trunk
  const y0 = path[0][1], y1 = path[path.length - 1][1], base = [y0, -0.2, 0, 0.14, 0.3, 0.48, 0.7, 0.95, flareH + 0.25].filter((y) => y > y0 && y < y1 - 0.5);
  const fine = rows < 6 ? base.filter((_, i) => i % 3 === 0) : base; // coarse LODs: every third flare ring
  const top = fine[fine.length - 1] ?? y0, ys = [y0, ...fine.filter((y) => y > y0)];
  const rest = Math.max(1, rows - ys.length + 1);
  for (let i = 1; i <= rest; i++) ys.push(top + ((y1 - top) * i) / rest);
  rows = ys.length - 1;
  for (let i = 0; i <= rows; i++) {
    const t = (ys[i] - y0) / (y1 - y0); // height fraction ≈ curve parameter (the axis is near vertical)
    curve.getPointAt(t, P);
    // buttresses widest at ground level; above it they run up into the trunk, below it they dive and narrow (on a
    // slope the downhill side shows them going into the soil, not a skirt)
    const R = radius(t), F = flare * (P.y >= 0 ? Math.pow(1 - THREE.MathUtils.smoothstep(P.y, 0, flareH), 3.2) : 0.5 + 0.5 * THREE.MathUtils.smoothstep(P.y, -0.45, 0));
    const curl = 0.18 * (1 - THREE.MathUtils.smoothstep(P.y, -0.45, flareH)); // ridges twist a little as they descend
    const sharp = 4 + 12 * (1 - THREE.MathUtils.smoothstep(P.y, -0.1, flareH * 0.7)); // broad buttress up the trunk, slim root at the ground
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      let k = 1;
      for (const l of lobes) { const d = Math.cos(a - l.a - curl * l.w); if (d > 0) k += F * l.w * d ** sharp; }
      k += F * 0.08 * (1 + Math.sin(a * 3 + 1.3)) * 0.5; // a little general swell between the ridges
      pos.push(P.x + Math.cos(a) * R * k, P.y, P.z + Math.sin(a) * R * k);
      uv.push(j / radial, (t * len) / vScale);
    }
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------------------------------------ broadleaf trees
/**
 * Generic broadleaf, grown as a skeleton first (trunk → limbs → side branches → foliage clusters at the branch ends),
 * then emitted per LOD from the same skeleton, so near and far keep one layout.
 * - Decurrent (oak): the trunk divides into a few heavy, wide-spreading limbs at `H`.
 * - Tiered (beech, birch): a leader continues to the top; limbs leave it at several heights, shorter upward.
 * Foliage sits on the outer ends of the branches, so the crown has gaps and you see limbs through it.
 */
interface Broadleaf {
  seed: number; H: number; leader: number; lean: [number, number]; trunk: [number, number]; flare: number; buttress: number;
  limbs: number; tiered: boolean; limbEl: [number, number]; limbLen: [number, number]; limbR: number; limbArch: number;
  subs: [number, number]; subLen: [number, number]; subEl: number;
  cl: [number, number]; clFlat: number; clSquash: number; clAmp: number; droop: number; topClusters: number; midP: number;
  bark: number; barkK: (y: number) => [number, number, number]; vScale: number;
}
interface Branch { pts: P3[]; r: number[]; level: 1 | 2 }
interface Skeleton { trunk: { path: P3[]; radius: (t: number) => number; lobes: { a: number; w: number }[] }; branches: Branch[]; clusters: Cluster[] }

function growBroadleaf(sp: Broadleaf): Skeleton {
  const r = mulberry32(sp.seed);
  const rnd = (a: number, b: number) => a + r() * (b - a);
  const top = sp.H + sp.leader;
  const axis = (y: number): P3 => { const t = Math.max(0, y) / top; return [sp.lean[0] * t * t * 1.0 + sp.lean[0] * t * 0.3, y, sp.lean[1] * t * t + sp.lean[1] * t * 0.3]; };
  const trunkPath: P3[] = [[0, -0.45, 0], axis(top * 0.3), axis(top * 0.65), axis(top)];
  const r0 = sp.trunk[0], r1 = sp.trunk[1];
  const trunkR = (y: number) => { const t = (y + 0.45) / (top + 0.45); return y <= sp.H ? THREE.MathUtils.lerp(r0, r1, Math.min(1, (y + 0.45) / (sp.H + 0.45))) : THREE.MathUtils.lerp(r1, r1 * 0.25, (y - sp.H) / Math.max(0.01, sp.leader)) * (t > 0 ? 1 : 1); };
  const radius = (t: number) => trunkR(-0.45 + t * (top + 0.45));
  // buttresses at irregular bearings and strengths
  const lobes: { a: number; w: number }[] = [];
  let a = r() * Math.PI * 2;
  for (let i = 0; i < sp.buttress; i++) { lobes.push({ a, w: rnd(0.55, 1.0) }); a += (Math.PI * 2 / sp.buttress) * rnd(0.6, 1.4); }
  const branches: Branch[] = [], clusters: Cluster[] = [];
  const addCluster = (c: THREE.Vector3, s: number, seed: number, sat = false) => clusters.push({ c, r: [s * rnd(0.95, 1.15), s * sp.clSquash * rnd(0.9, 1.1), s * rnd(0.95, 1.15)], seed, amp: sp.clAmp, flat: sp.clFlat, val: rnd(0.93, 1.07), sat });
  // limbs
  const a0 = r() * Math.PI * 2;
  for (let i = 0; i < sp.limbs; i++) {
    const f = sp.limbs > 1 ? i / (sp.limbs - 1) : 0;
    const y = sp.tiered ? sp.H + f * sp.leader * 0.82 + rnd(-0.2, 0.2) : sp.H - rnd(0, 0.7);
    const az = a0 + i * 2.39996 + rnd(-0.45, 0.45);
    const el = THREE.MathUtils.lerp(sp.limbEl[0], sp.limbEl[1], sp.tiered ? f * 0.6 + r() * 0.4 : r());
    const L = rnd(sp.limbLen[0], sp.limbLen[1]) * (sp.tiered ? 1 - 0.55 * f : 1);
    const d = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    const S = vec(axis(y));
    const P1 = S.clone().addScaledVector(d, L * 0.34).add(new THREE.Vector3(0, L * sp.limbArch * 0.5, 0));
    const P2 = S.clone().addScaledVector(d, L * 0.7).add(new THREE.Vector3(0, L * sp.limbArch * 0.6 - sp.droop * L * 0.15, 0));
    const E = S.clone().addScaledVector(d, L).add(new THREE.Vector3(0, L * sp.limbArch * 0.35 - sp.droop * L * 0.5, 0));
    const rl = trunkR(y) * sp.limbR * rnd(0.8, 1.1);
    const limb: P3[] = [S, P1, P2, E].map((v) => [v.x, v.y, v.z]);
    branches.push({ pts: limb, r: [rl, rl * 0.72, rl * 0.45, rl * 0.18], level: 1 });
    const curve = new THREE.CatmullRomCurve3(limb.map(vec), false, 'centripetal');
    const ns = Math.round(rnd(sp.subs[0], sp.subs[1]));
    for (let k = 0; k < ns; k++) {
      const ft = rnd(0.42, 0.82), Sb = curve.getPointAt(ft);
      const saz = az + (k % 2 ? 1 : -1) * rnd(0.45, 1.05), sel = el + rnd(0.05, sp.subEl);
      const Ls = L * rnd(sp.subLen[0], sp.subLen[1]);
      const ds = new THREE.Vector3(Math.cos(sel) * Math.cos(saz), Math.sin(sel), Math.cos(sel) * Math.sin(saz));
      const Mb = Sb.clone().addScaledVector(ds, Ls * 0.55).add(new THREE.Vector3(0, Ls * 0.1, 0));
      const Eb = Sb.clone().addScaledVector(ds, Ls).add(new THREE.Vector3(0, -sp.droop * Ls * 0.45, 0));
      const rs = rl * (1 - ft * 0.6) * 0.55;
      branches.push({ pts: [Sb, Mb, Eb].map((v) => [v.x, v.y, v.z]), r: [rs, rs * 0.55, rs * 0.2], level: 2 });
      const s = rnd(sp.cl[0], sp.cl[1]);
      addCluster(Eb.clone().add(new THREE.Vector3(0, s * 0.3 - sp.droop * s * 0.5, 0)), s, sp.seed * 0.01 + i * 7.3 + k * 2.9);
      if (r() < sp.midP) { const m = Sb.clone().lerp(Eb, 0.5); addCluster(m.add(new THREE.Vector3(0, s * 0.35, 0)), s * rnd(0.6, 0.75), sp.seed * 0.01 + i * 3.1 + k * 5.3 + 1, true); }
    }
    const s = rnd(sp.cl[0], sp.cl[1]) * 1.1;
    addCluster(E.clone().add(new THREE.Vector3(0, s * 0.3 - sp.droop * s * 0.5, 0)), s, sp.seed * 0.01 + i * 4.7 + 0.5);
  }
  // crown top: over the end of the leader (tiered) or over the fork (decurrent), so the crown is closed above
  for (let i = 0; i < sp.topClusters; i++) {
    const t = vec(axis(top));
    const s = rnd(sp.cl[0], sp.cl[1]) * (i ? 0.85 : 1.05);
    addCluster(t.add(new THREE.Vector3(rnd(-0.9, 0.9) * (i ? 1 : 0.3), s * 0.45 + (sp.tiered ? 0 : 1.4) + i * 0.4, rnd(-0.9, 0.9) * (i ? 1 : 0.3))), s, sp.seed * 0.01 + 50 + i);
  }
  return { trunk: { path: trunkPath, radius, lobes }, branches, clusters };
}

function emitBroadleaf(sp: Broadleaf, sk: Skeleton, lod: Lod): Model {
  const near = lod === 'near', far = lod === 'far';
  const girth = THREE.MathUtils.clamp(sp.trunk[0] / 0.45, 0.6, 1); // slim trunks need fewer sides
  const wood: THREE.BufferGeometry[] = [flaredTrunk(sk.trunk.path, sk.trunk.radius, sk.trunk.lobes, sp.flare, 1.25, Math.round((near ? 20 : far ? 6 : 9) * girth), near ? 11 : far ? 3 : 4, sp.vScale)];
  for (const b of sk.branches) {
    if (!near && b.level === 2) continue; // mid/far: limbs only; side branches are hidden in the foliage at that distance
    wood.push(taperTube(b.pts, b.r, { radial: near ? (b.level === 1 ? 6 : 3) : far ? 3 : 4, rows: near ? (b.level === 1 ? 4 : 3) : far ? 1 : 2, vScale: 1.2 }));
  }
  const crownC = sk.clusters.reduce((s, k) => s.add(k.c), new THREE.Vector3()).divideScalar(sk.clusters.length);
  const crownR = Math.max(...sk.clusters.map((k) => k.c.distanceTo(crownC) + Math.max(...k.r)));
  let ks = near ? sk.clusters : sk.clusters.filter((k) => !k.sat); // mid/far: the small filler clumps are dropped
  if (far) ks = largest(ks, 14);
  const leaves = cullBuried(ks.map((k) => clusterGeo(k, lod, crownC, crownR)), ks);
  const woodG = mergeParts(wood.map((g) => barkCol(paint(g, (p) => sp.barkK(p.y)), sp.bark)));
  return { wood: woodG, leaves: mergeParts(leaves.map((g) => foliageUV(g, 1.4))) };
}
const broadleaf = (sp: Broadleaf, lod: Lod) => emitBroadleaf(sp, growBroadleaf(sp), lod);
const barkGrad = (lo: number, hi = 1, y1 = 1.4): ((y: number) => [number, number, number]) => (y) => { const k = lo + (hi - lo) * THREE.MathUtils.smoothstep(y, -0.2, y1); return [k, k, k]; };

// ------------------------------------------------------------------------------------------------ oak
/**
 * Pedunculate oak: a stout, flared trunk that divides low into a few heavy limbs spreading wide and nearly level;
 * a broad, irregular crown of clumps at the limb ends with gaps between. Three layouts: 0 the hero (broad, five
 * limbs), 1 a smaller, rounder tree, 2 an old spreading oak with long low limbs.
 */
const OAK_BASE = { leader: 1.0, flare: 2.2, buttress: 5, tiered: false, limbR: 0.62, subEl: 0.45, clFlat: 0.82, clSquash: 0.88, clAmp: 0.26, droop: 0.15, topClusters: 1, midP: 0.3, bark: BARK.fissured, barkK: barkGrad(0.72), vScale: 1.4 };
const OAKS: Broadleaf[] = [
  { ...OAK_BASE, seed: 517, H: 3.0, lean: [0.35, -0.12], trunk: [0.5, 0.36], limbs: 5, limbEl: [0.28, 0.75], limbLen: [3.3, 4.5], limbArch: 0.32, subs: [2, 3], subLen: [0.45, 0.65], cl: [0.8, 1.15] },
  { ...OAK_BASE, seed: 911, H: 2.7, lean: [-0.25, 0.18], trunk: [0.46, 0.34], limbs: 5, limbEl: [0.45, 0.9], limbLen: [2.7, 3.5], limbArch: 0.38, subs: [1, 3], subLen: [0.45, 0.6], cl: [0.8, 1.1] },
  { ...OAK_BASE, seed: 1303, H: 2.3, lean: [0.18, 0.28], trunk: [0.56, 0.4], limbs: 6, limbEl: [0.12, 0.6], limbLen: [3.6, 5.0], limbArch: 0.26, subs: [2, 3], subLen: [0.4, 0.6], cl: [0.8, 1.15], buttress: 6, flare: 2.5 },
];
export function oakModel(variant: number, lod: Lod): Model { return broadleaf(OAKS[variant % 3], lod); }

// ------------------------------------------------------------------------------------------------ beech
/**
 * European beech: a straight, smooth grey trunk (little flare) carrying a leader high into the crown; limbs leave
 * it at several heights, steeply rising and shorter toward the top, each ending in flatter, spreading sprays — a
 * tall, domed crown with visible layers and gaps. Three layouts from narrow-tall to broad.
 */
const BEECHES: Broadleaf[] = [0, 1, 2].map((v) => ({
  seed: 4401 + v * 77, H: [2.8, 2.6, 2.4][v], leader: [5.8, 5.2, 4.8][v], lean: [[0.12, 0.05], [-0.18, 0.1], [0.05, -0.22]][v] as [number, number],
  trunk: [0.4, 0.3] as [number, number], flare: 1.3, buttress: 5, tiered: true, limbs: [8, 9, 9][v], limbEl: [0.42, 0.95] as [number, number],
  limbLen: ([[2.7, 3.4], [3.0, 3.8], [3.4, 4.3]] as [number, number][])[v], limbR: 0.55, limbArch: 0.18, subs: [1, 2] as [number, number], subLen: [0.45, 0.65] as [number, number], subEl: 0.25,
  cl: [0.72, 1.0] as [number, number], clFlat: 0.78, clSquash: 0.8, clAmp: 0.24, droop: 0.05, topClusters: 2, midP: 0.2,
  bark: BARK.smooth, barkK: barkGrad(0.8, 1, 0.8), vScale: 1.6,
}));
export function beechModel(variant: number, lod: Lod): Model { return broadleaf(BEECHES[variant % 3], lod); }

// ------------------------------------------------------------------------------------------------ birch
/**
 * Silver birch: a slender, slightly wavering white trunk (dark and rough at the foot) with a leader to the top; many
 * thin branches rising and then drooping at the tips, small clumps hanging from them — a narrow, airy crown you can
 * see through. Three layouts (height, branch count, lean).
 */
const BIRCHES: Broadleaf[] = [0, 1, 2].map((v) => ({
  seed: 6203 + v * 131, H: [3.8, 3.4, 4.2][v], leader: [6.2, 5.4, 6.8][v], lean: [[0.3, -0.1], [-0.35, 0.22], [0.18, 0.35]][v] as [number, number],
  trunk: [0.22, 0.15] as [number, number], flare: 0.9, buttress: 4, tiered: true, limbs: [9, 8, 10][v], limbEl: [0.45, 0.95] as [number, number],
  limbLen: [2.3, 3.1] as [number, number], limbR: 0.4, limbArch: 0.3, subs: [1, 2] as [number, number], subLen: [0.45, 0.7] as [number, number], subEl: 0.15,
  cl: [0.3, 0.42] as [number, number], clFlat: 0.85, clSquash: 0.92, clAmp: 0.3, droop: 1.1, topClusters: 1, midP: 0.55,
  bark: BARK.birch, barkK: (y: number) => { const k = 0.35 + 0.65 * THREE.MathUtils.smoothstep(y, 0.2, 1.3); return [k, k, k * 0.98]; }, vScale: 1.6,
}));
export function birchModel(variant: number, lod: Lod): Model { return broadleaf(BIRCHES[variant % 3], lod); }

// ------------------------------------------------------------------------------------------------ Scots pine
/**
 * Scots pine (the Veluwe tree): a tall trunk with a gentle bend, bare for more than half its height, grey-brown and
 * furrowed low, warm orange above; a few dead stubs; an open, uneven crown in the top third: branches in irregular
 * whorls (some missing), longer on the light side, nearly level and slightly upturned, each ending in two or three
 * ragged, tilted needle clumps; the top rounds off rather than tapering to a spire. Three layouts.
 */
export function pineModel(lod: Lod, variant = 0): Model {
  const v = variant % 3, r = mulberry32(733 + v * 211), near = lod === 'near', far = lod === 'far';
  const rnd = (a: number, b: number) => a + r() * (b - a);
  const T = [12.2, 11.0, 13.4][v], bend = [[0.45, -0.25], [-0.3, 0.2], [0.75, 0.4]][v], light = [0.6, 2.4, 4.1][v];
  const axis = (y: number): P3 => { const t = Math.max(0, y) / T; return [bend[0] * (t * t * 0.8 + 0.25 * Math.sin(t * 3.1)), y, bend[1] * (t * t * 0.8 + 0.2 * Math.sin(t * 2.6))]; };
  const lobes = [0, 1, 2, 3].map((i) => ({ a: i * 1.57 + rnd(-0.4, 0.4), w: rnd(0.5, 1) }));
  const wood: THREE.BufferGeometry[] = [flaredTrunk([[0, -0.45, 0], axis(T * 0.3), axis(T * 0.65), axis(T)], (t) => THREE.MathUtils.lerp(0.36, 0.06, Math.pow(t, 0.9)), lobes, 1.1, 0.9, near ? 14 : far ? 5 : 7, near ? 12 : far ? 3 : 4, 1.6)];
  const clusters: Cluster[] = [];
  const crownBase = T * [0.56, 0.5, 0.62][v];
  // irregular whorls: 4–5 levels, 2–4 branches each, some skipped
  let y = crownBase, a = rnd(0, 6.3), i = 0;
  while (y < T - 0.6) {
    const f = (y - crownBase) / (T - crownBase), n = 2 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      a += 2.39996 + rnd(-0.6, 0.6);
      if (r() < 0.22) continue; // a missing branch: gaps in the crown
      const lightSide = 1 + 0.45 * Math.cos(a - light);
      const L = (2.3 - 0.9 * f * f) * lightSide * rnd(0.75, 1.15) * (v === 1 ? 1.1 : 1);
      const el = THREE.MathUtils.lerp(-0.12, 0.35, f) + rnd(-0.1, 0.12);
      const S = vec(axis(y + rnd(-0.25, 0.25)));
      const d = new THREE.Vector3(Math.cos(el) * Math.cos(a), Math.sin(el), Math.cos(el) * Math.sin(a));
      const E = S.clone().addScaledVector(d, L), M = S.clone().lerp(E, 0.5).add(new THREE.Vector3(0, -0.12 + f * 0.2, 0));
      wood.push(taperTube([[S.x, S.y, S.z], [M.x, M.y, M.z], [E.x, E.y, E.z]], [0.1 - f * 0.03, 0.06, 0.025], { radial: near ? 5 : 3, rows: near ? 4 : far ? 1 : 2, vScale: 1.2 }));
      // two or three ragged clumps along the end of the branch, tilted with it, at different heights
      const m = 2 + Math.floor(r() * 2.5);
      for (let q = 0; q < m; q++) {
        const t = 1 - q * rnd(0.18, 0.26), c = S.clone().lerp(E, t).add(new THREE.Vector3(rnd(-0.25, 0.25), rnd(-0.1, 0.3) + q * 0.08, rnd(-0.25, 0.25)));
        const s = (0.48 + L * 0.13) * (q ? rnd(0.7, 0.9) : 1);
        clusters.push({ c, r: [s * rnd(0.95, 1.2), s * rnd(0.58, 0.74), s * rnd(0.9, 1.15)], seed: v * 17 + i * 3.1 + q, amp: 0.34, flat: 0.8, val: rnd(0.9, 1.1), sat: q >= 2 });
      }
      i++;
    }
    y += rnd(0.75, 1.25);
  }
  // rounded top: a few clumps round the leader's end
  const tp = vec(axis(T));
  for (let q = 0; q < 4; q++) clusters.push({ c: tp.clone().add(new THREE.Vector3(Math.cos(q * 1.9 + v) * (q ? 0.8 : 0.1), -0.3 * q + 0.15, Math.sin(q * 1.9 + v) * (q ? 0.8 : 0.1))), r: [0.85, 0.6, 0.8].map((s) => s * rnd(0.85, 1.1)) as P3, seed: v * 17 + 90 + q, amp: 0.34, flat: 0.8, val: rnd(0.95, 1.08) });
  if (near) for (let k = 0; k < 4; k++) { // dead stubs on the bare trunk
    const yy = 2.2 + k * rnd(0.8, 1.3), aa = k * 2.1 + r(), S = vec(axis(yy));
    wood.push(taperTube([[S.x, yy, S.z], [S.x + Math.cos(aa) * 0.45, yy - 0.12, S.z + Math.sin(aa) * 0.45]], [0.05, 0.02], { radial: 4, rows: 2 }));
  }
  const woodG = mergeParts(wood.map((g) => barkCol(paint(g, (p) => {
    const t = THREE.MathUtils.smoothstep(p.y, T * 0.29, T * 0.6);
    return [0.62 + 0.55 * t, 0.56 + 0.2 * t, 0.5 + 0.02 * t];
  }), BARK.fissured)));
  const centre = clusters.reduce((s, k) => s.add(k.c), new THREE.Vector3()).divideScalar(clusters.length);
  const cr = Math.max(...clusters.map((k) => k.c.distanceTo(centre) + k.r[0]));
  const ks = near ? clusters : clusters.filter((k) => !k.sat);
  const leaves = cullBuried(ks.map((k) => clusterGeo(k, lod, centre, cr, 0.4, 0.75)), ks); // high crown, seen from 6 m+ below
  return { wood: woodG, leaves: mergeParts(leaves.map((g) => foliageUV(g, 1.2))) };
}

export function treeModel(species: TreeSpecies, variant: number, lod: Lod): Model {
  return species === 'oak' ? oakModel(variant, lod) : species === 'beech' ? beechModel(variant, lod) : species === 'birch' ? birchModel(variant, lod) : pineModel(lod, variant);
}

// ------------------------------------------------------------------------------------------------ bushes
/**
 * Hazel: a multi-stemmed shrub — seven to nine thin, smooth stems of different lengths rising from one stool in a
 * loose vase and arching over at the tips, some with a side shoot; small, rounded leaf clumps alternate along each
 * stem from knee height, with gaps between the stems. Three layouts.
 */
export function hazelModel(variant: number, lod: Lod): Model {
  const v = variant % 3, r = mulberry32(8101 + v * 59), near = lod === 'near', far = lod === 'far';
  const rnd = (a: number, b: number) => a + r() * (b - a);
  const n = [8, 9, 7][v], Hh = [2.0, 2.4, 1.7][v];
  const wood: THREE.BufferGeometry[] = [], clusters: Cluster[] = [];
  const stem = (S: THREE.Vector3, a: number, lean: number, h: number, rad: number, leafy: number, from: number, seed: number) => {
    const d = new THREE.Vector3(Math.cos(a) * Math.sin(lean), Math.cos(lean), Math.sin(a) * Math.sin(lean));
    const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const P1 = S.clone().addScaledVector(d, h * 0.45), P2 = S.clone().addScaledVector(d, h * 0.85).addScaledVector(out, h * 0.08);
    const E = S.clone().addScaledVector(d, h).addScaledVector(out, h * 0.22).add(new THREE.Vector3(0, -h * 0.08, 0)); // arching over
    const pts: P3[] = [S, P1, P2, E].map((p) => [p.x, p.y, p.z]);
    wood.push(taperTube(pts, [rad, rad * 0.8, rad * 0.5, rad * 0.2], { radial: near ? 5 : 3, rows: near ? 4 : far ? 1 : 2, vScale: 1.0 }));
    const curve = new THREE.CatmullRomCurve3(pts.map(vec), false, 'centripetal');
    const side = new THREE.Vector3(-out.z, 0, out.x);
    const m = Math.round(leafy);
    for (let k = 0; k < m; k++) {
      const t = from + (k / Math.max(1, m - 1)) * (1 - from) * rnd(0.85, 1.0), c = curve.getPointAt(Math.min(1, t));
      const s = rnd(0.24, 0.33) * (1.15 - t * 0.35);
      c.addScaledVector(side, (k % 2 ? 1 : -1) * s * 0.6).addScaledVector(out, s * 0.35).add(new THREE.Vector3(0, s * 0.15, 0));
      clusters.push({ c, r: [s * rnd(1.0, 1.2), s * rnd(0.78, 0.95), s * rnd(0.9, 1.1)], seed: seed + k * 1.7, amp: 0.3, flat: 0.85, val: rnd(0.9, 1.1) });
    }
    return curve;
  };
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(-0.35, 0.35), h = Hh * rnd(0.55, 1.05), lean = rnd(0.12, 0.5);
    const S = new THREE.Vector3(Math.cos(a) * 0.08, -0.1, Math.sin(a) * 0.08);
    // leafy from knee height on the long stems; short stems carry leaves along most of their length
    const curve = stem(S, a, lean, h, rnd(0.032, 0.048), h > Hh * 0.75 ? 3 : 2, h > Hh * 0.75 ? 0.3 : 0.45, v * 31 + i * 3.7);
    if (h > Hh * 0.8 && r() < 0.5) stem(curve.getPointAt(0.4), a + rnd(-0.9, 0.9), lean + 0.4, h * 0.45, 0.02, 1, 0.9, v * 31 + i * 3.7 + 20); // side shoot
  }
  const centre = new THREE.Vector3(0, Hh * 0.55, 0);
  const ks = far ? largest(clusters, 10) : clusters;
  const leaves = cullBuried(ks.map((k) => clusterGeo(k, lod, centre, Hh, 0.4)), ks);
  return { wood: mergeParts(wood.map((g) => barkCol(paint(g, 0.85), BARK.smooth))), leaves: mergeParts(leaves.map((g) => foliageUV(g, 0.9))) };
}
/**
 * Holly: a compact evergreen — a short stem and side branches under an irregular, upward-tapering mass of spiky,
 * glossy clumps (lighter, warmer tops, so it reads as leaves catching light rather than a dark blob), with a few
 * berry clusters. Three layouts (height, fullness).
 */
export function hollyModel(variant: number, lod: Lod): Model {
  const v = variant % 3, r = mulberry32(9203 + v * 71), near = lod === 'near';
  const rnd = (a: number, b: number) => a + r() * (b - a);
  const Hh = [1.6, 2.0, 1.3][v], n = 10 + v * 2;
  const wood: THREE.BufferGeometry[] = [taperTube([[0, -0.1, 0], [0.03, Hh * 0.4, 0.02], [0.02, Hh * 0.8, -0.02]], [0.07, 0.05, 0.03], { radial: near ? 6 : 4, rows: 3 })];
  const clusters: Cluster[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), y = 0.3 + t * Hh * 0.85, rad = (1 - t) * 0.5 + 0.08, a = i * 2.39996 + rnd(-0.5, 0.5);
    const c = new THREE.Vector3(Math.cos(a) * rad * rnd(0.7, 1.2), y, Math.sin(a) * rad * rnd(0.7, 1.2));
    if (near && t < 0.7) wood.push(taperTube([[0, y - 0.15, 0], [c.x * 0.6, y - 0.05, c.z * 0.6], [c.x, y, c.z]], [0.025, 0.018, 0.01], { radial: 3, rows: 2 }));
    const s = (0.24 + (1 - t) * 0.18) * rnd(0.85, 1.15);
    clusters.push({ c, r: [s * 1.05, s * rnd(0.85, 1.0), s], seed: v * 7 + i * 4.3, amp: 0.26, flat: 0.85, val: rnd(0.95, 1.15), spiky: true });
  }
  const centre = new THREE.Vector3(0, Hh * 0.5, 0);
  const ks = lod === 'far' ? largest(clusters, 8) : clusters;
  const leafGeos = cullBuried(ks.map((k) => clusterGeo(k, lod, centre, Hh * 0.6, 0.35)), ks);
  // glossy holly: tops markedly lighter than the shaded sides (vertex colour), so the form reads in value
  for (const g of leafGeos) {
    const c = g.attributes.color as THREE.BufferAttribute, nn = g.attributes.normal as THREE.BufferAttribute;
    for (let i = 0; i < c.count; i++) { const k = 1 + 0.35 * THREE.MathUtils.smoothstep(nn.getY(i), 0.3, 0.95); c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k * 0.95); }
  }
  // berries (near only): small red clusters on the outside. Vertex colour = red ÷ the holly leaf tint, so the
  // instance colour (the leaf tint) brings them back to red.
  if (near) {
    const tint = new THREE.Color('#46663a'), red = new THREE.Color('#b0201c');
    for (let i = 0; i < 6; i++) {
      const k = clusters[1 + Math.floor(r() * (clusters.length - 3))], a = r() * Math.PI * 2;
      const p = k.c.clone().add(new THREE.Vector3(Math.cos(a) * k.r[0] * 0.95, rnd(-0.1, 0.2) * k.r[1], Math.sin(a) * k.r[2] * 0.95));
      for (let b = 0; b < 3; b++) {
        const g0 = new THREE.IcosahedronGeometry(0.03, 0).translate(p.x + (b - 1) * 0.035, p.y - (b % 2) * 0.03, p.z + (b % 2) * 0.03);
        g0.deleteAttribute('uv');
        leafGeos.push(paint(mergeVertices(g0), () => [red.r / tint.r, red.g / tint.g, red.b / tint.b])); // indexed, like the clusters
        g0.dispose();
      }
    }
  }
  return { wood: mergeParts(wood.map((g) => barkCol(paint(g, 0.8), BARK.smooth))), leaves: mergeParts(leafGeos.map((g) => foliageUV(g, 0.7))) };
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
    const S = 5;
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
export interface WoodMats { tree: THREE.MeshLambertMaterial; rock: THREE.MeshLambertMaterial; flat: THREE.MeshLambertMaterial }
let wm: WoodMats | null = null;
const C_PX = 128;
/**
 * tree: the tree atlas (3 barks + leaf dabs, see BARK / LEAF_U) — trunks and crowns of every species in one
 * material; rock gets faint strata; flat (vertex colour only) for plants, turf and litter.
 */
export function woodMats(): WoodMats {
  if (wm) return wm;
  // tree atlas: four 128 px columns. u is clamped (each bark column is one trip round the trunk), v repeats along it
  const atlas = canvasTex(C_PX * ATLAS_COLS, 256, (x, r) => {
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
    // 3: leaf dabs, tileable in the 128 × 256 column (drawn with wrap-around copies; clipped to the column)
    x.save(); x.beginPath(); x.rect(384, 0, 128, 256); x.clip();
    x.fillStyle = grey(0.86); x.fillRect(384, 0, 128, 256);
    for (let i = 0; i < 520; i++) {
      const px = r() * 128, py = r() * 256, s = 3 + r() * 5;
      x.fillStyle = grey(0.74 + r() * 0.3, 0.75);
      for (const ox of [-128, 0, 128]) for (const oy of [-256, 0, 256]) { x.beginPath(); x.ellipse(384 + px + ox, py + oy, s, s * 0.55, r() * Math.PI, 0, Math.PI * 2); x.fill(); }
    }
    x.restore();
  }, 81);
  atlas.wrapS = THREE.ClampToEdgeWrapping;
  const strata = canvasTex(128, 128, (x, r) => {
    x.fillStyle = grey(0.9); x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 14; i++) { x.fillStyle = grey(0.82 + r() * 0.14, 0.6); x.fillRect(0, r() * 128, 128, 2 + r() * 6); }
    for (let i = 0; i < 60; i++) { x.fillStyle = grey(0.7 + r() * 0.3, 0.3); x.fillRect(r() * 128, r() * 128, 2 + r() * 5, 2 + r() * 5); }
  }, 83);
  const lam = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial({ vertexColors: true, ...o });
  const tree = lam({ map: atlas });
  // foliage UVs (u ≥ LEAF_U) repeat inside the leaf column; gradients from the unwrapped UV keep mip selection
  // continuous across the wrap (no seams); bark UVs are sampled as usual
  tree.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
  vec2 tUv = vMapUv;
  vec4 sampledDiffuseColor;
  if (tUv.x > ${(LEAF_U / 2).toFixed(1)}) {
    vec2 lUv = vec2(fract(tUv.x), tUv.y * 0.5);
    vec2 aUv = vec2((3.0 + ${GUT.toFixed(2)} + lUv.x * ${(1 - 2 * GUT).toFixed(2)}) * 0.25, lUv.y);
    vec2 k = vec2(${((1 - 2 * GUT) / ATLAS_COLS).toFixed(4)}, 0.5);
    sampledDiffuseColor = textureGrad(map, aUv, dFdx(tUv) * k, dFdy(tUv) * k);
  } else {
    sampledDiffuseColor = texture2D(map, tUv);
  }
  diffuseColor *= sampledDiffuseColor;
#endif`);
  };
  tree.customProgramCacheKey = () => 'woodkit-tree-atlas';
  wm = { tree, rock: lam({ map: strata }), flat: lam({}) };
  return wm;
}
