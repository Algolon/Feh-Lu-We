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
export function lump(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, seed: number, detail: number, centre: THREE.Vector3, crownR: number, bend = 0.55) {
  const g0 = new THREE.IcosahedronGeometry(1, detail);
  g0.deleteAttribute('normal'); g0.deleteAttribute('uv');
  const g = mergeVertices(g0, 1e-5); // welded: smooth shading across the mass, not facets
  g0.dispose();
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = 1 + 0.18 * n3(v.x * 1.6, v.y * 1.6, v.z * 1.6, seed);
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

// ------------------------------------------------------------------------------------------------ oak
/**
 * Broadleaf oak, authored: a leaning, tapering trunk with buttress lobes, five roots diving into the ground,
 * four main limbs (+ two secondary) forking into a broad, irregular crown of eleven masses with a flatter
 * underside and real gaps. `lod` 'far' keeps the silhouette with a fraction of the triangles.
 */
export function oakModel(variant: 0 | 1, lod: 'near' | 'far'): Model {
  const r = mulberry32(variant ? 911 : 517);
  const near = lod === 'near';
  const H = variant ? 2.7 : 3.1; // crown base height
  const lean: [number, number] = variant ? [-0.25, 0.15] : [0.3, -0.1];
  const trunkTop: [number, number, number] = [lean[0], H + 0.4, lean[1]];
  const wood: THREE.BufferGeometry[] = [];
  wood.push(taperTube([[0, -0.3, 0], [lean[0] * 0.2, H * 0.35, lean[1] * 0.2], [lean[0] * 0.7, H * 0.75, lean[1] * 0.7], trunkTop], [0.5, 0.4, 0.34, 0.29], { radial: near ? 12 : 6, rows: near ? 10 : 4, vScale: 1.4 }));
  // crown: a few MAJOR masses (authored, broad and lopsided, with sky between them), each built from one body
  // and several smaller clumps on its upper/outer side, so the outline is scalloped rather than a pillow
  const crownC = new THREE.Vector3(lean[0] * 1.2, H + 2.4, lean[1] * 1.2);
  const majors: [number, number, number, number][] = variant
    ? [[0.2, 2.6, 0.1, 1.55], [-2.0, 1.7, 0.9, 1.25], [1.8, 2.0, -1.0, 1.35], [0.3, 1.3, 2.1, 1.1], [-0.9, 1.6, -2.0, 1.15]]
    : [[0, 2.9, 0.1, 1.6], [-2.5, 1.9, 0.5, 1.35], [2.4, 2.2, -0.6, 1.45], [0.7, 1.5, 2.4, 1.25], [-1.0, 1.7, -2.4, 1.25], [2.6, 1.1, 1.8, 0.95]];
  const leaves: THREE.BufferGeometry[] = [];
  majors.forEach(([mx, my, mz, ms], i) => {
    const cx = crownC.x + mx, cy = H + my, cz = crownC.z + mz;
    leaves.push(lump(cx, cy, cz, ms * 1.05, ms * 0.78, ms * 0.98, i * 1.7 + variant * 9, near ? 2 : 1, crownC, 4.2));
    const subs = 5; // same layout in both LODs (no silhouette pop at the switch), coarser tessellation far away
    const out = new THREE.Vector3(mx, 0, mz).normalize();
    for (let k = 0; k < subs; k++) {
      // clumps sit on the outer/upper surface of the body, biased away from the trunk
      const a = Math.atan2(out.z, out.x) + (r() - 0.5) * 2.6, el = 0.15 + r() * 0.75;
      const d = ms * (0.72 + r() * 0.18), cs = ms * (0.38 + r() * 0.2);
      leaves.push(lump(cx + Math.cos(a) * Math.cos(el) * d, cy + Math.sin(el) * d * 0.75, cz + Math.sin(a) * Math.cos(el) * d, cs * 1.05, cs * 0.8, cs, i * 7.3 + k * 2.9 + variant * 5, near ? 1 : 0, crownC, 4.2));
    }
  });
  {
    // limbs: from the trunk top into the major masses (they enter the foliage, never end in air); the far LOD
    // keeps limbs and roots (coarser), so nothing disappears at the switch
    const rad = near ? 1 : 0.6;
    majors.slice(1).forEach(([mx, my, mz], i) => {
      const s: [number, number, number] = [trunkTop[0] * 0.85, H - 0.15 + i * 0.12, trunkTop[2] * 0.85];
      const e: [number, number, number] = [crownC.x + mx * 0.75, H + my * 0.7, crownC.z + mz * 0.75];
      const m: [number, number, number] = [(s[0] + e[0]) / 2 + (r() - 0.5) * 0.4, (s[1] + e[1]) / 2 + 0.3, (s[2] + e[2]) / 2 + (r() - 0.5) * 0.4];
      wood.push(taperTube([s, m, e], [0.22, 0.14, 0.07], { radial: Math.round(7 * rad), rows: near ? 6 : 3, vScale: 1.2 }));
      const f: [number, number, number] = [m[0] + (e[0] - s[0]) * 0.25 + (r() - 0.5) * 0.8, m[1] + 0.9, m[2] + (e[2] - s[2]) * 0.25 + (r() - 0.5) * 0.8];
      if (i % 2 === 0 && near) wood.push(taperTube([m, [(m[0] + f[0]) / 2, (m[1] + f[1]) / 2 + 0.1, (m[2] + f[2]) / 2], f], [0.09, 0.065, 0.035], { radial: 5, rows: 4, vScale: 1.2 }));
    });
    wood.push(taperTube([trunkTop, [trunkTop[0] * 1.1, H + 1.6, trunkTop[2]], [crownC.x, H + 2.5, crownC.z]], [0.2, 0.13, 0.06], { radial: Math.round(7 * rad), rows: near ? 5 : 2, vScale: 1.2 }));
    // roots: buttress roots grow out of the trunk axis (so they merge into it without seams), flare out and
    // dive steeply into the soil — they make the root flare, and end below ground even on a slope
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + (variant ? 0.5 : 0.15) + (r() - 0.5) * 0.35, L = 0.5 + r() * 0.4;
      const c = Math.cos(a), s = Math.sin(a);
      wood.push(taperTube([[c * 0.04, 1.05, s * 0.04], [c * 0.42, 0.38, s * 0.42], [c * (0.62 + L * 0.5), -0.02, s * (0.62 + L * 0.5)], [c * (0.66 + L), -0.75, s * (0.66 + L)]], [0.3, 0.24, 0.12, 0.04], { radial: near ? 7 : 4, rows: near ? 7 : 3, vScale: 1.2 }));
    }
  }
  const woodG = mergeParts(wood.map((g) => paint(g, (p) => { const k = 0.74 + 0.26 * THREE.MathUtils.smoothstep(p.y, -0.2, 1.4); return [k, k, k]; })));
  return { wood: woodG, leaves: mergeParts(leaves.map((g) => foliageUV(g, 1.6))) };
}

// ------------------------------------------------------------------------------------------------ Scots pine
/**
 * Scots pine (the Veluwe tree): a tall, slightly leaning trunk, grey-brown and furrowed low, warm orange high up,
 * a few dead stubs, and an uneven crown of flat, drooping foliage pads on near-horizontal branches — no cones.
 */
export function pineModel(lod: 'near' | 'far'): Model {
  const r = mulberry32(733);
  const near = lod === 'near';
  const T = 12.2;
  const top: [number, number, number] = [0.35, T, -0.2];
  const wood: THREE.BufferGeometry[] = [taperTube([[0, -0.3, 0], [0.05, 4, 0.02], [0.2, 8.5, -0.1], top], [0.36, 0.27, 0.18, 0.07], { radial: near ? 10 : 5, rows: near ? 12 : 4, lobes: near ? 4 : 0, flare: 0.35, vScale: 1.6 })];
  const pads: [number, number, number, number][] = []; // x, y, z, size
  // branches: uneven heights and directions, near-horizontal, shorter toward the top; the crown occupies the top
  // third, so the long bare trunk reads first (unlike the oak's low, broad crown)
  const tiers = [[6.6, 0.3, 2.3], [7.2, 2.5, 2.0], [7.9, 4.4, 2.1], [8.5, 1.3, 1.9], [9.1, 3.5, 1.7], [9.6, 5.6, 1.5], [10.2, 0.7, 1.4], [10.7, 2.8, 1.2], [11.2, 4.8, 1.0]];
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
  const woodG = mergeParts(wood.map((g) => paint(g, (p) => {
    const t = THREE.MathUtils.smoothstep(p.y, 3.5, 7.5);
    return [0.62 + 0.55 * t, 0.56 + 0.2 * t, 0.5 + 0.02 * t];
  })));
  const centre = new THREE.Vector3(top[0] * 0.75, 9.4, top[2] * 0.75);
  const leaves: THREE.BufferGeometry[] = [];
  pads.forEach(([x, y, z, s], i) => {
    // each branch end: a loose cluster of small flattened clumps along the outer branch, the outermost drooping
    const n = 4; // same clumps in both LODs, coarser far away
    const dx = x - top[0] * (y / T), dz = z - top[2] * (y / T), dl = Math.hypot(dx, dz) || 1;
    for (let k = 0; k < n; k++) {
      const back = (k / n) * 0.9, side = (r() - 0.5) * s * 0.9;
      const px = x - (dx / dl) * back + (-dz / dl) * side, pz = z - (dz / dl) * back + (dx / dl) * side;
      const cs = s * (k ? 0.62 + r() * 0.2 : 0.85);
      leaves.push(lump(px, y + back * 0.12 - (k ? 0 : 0.08) + r() * 0.12, pz, cs * 1.1, cs * 0.55, cs, i * 3.1 + k, near ? 1 : 0, centre, 3.2, 0.4));
    }
  });
  return { wood: woodG, leaves: mergeParts(leaves.map((g) => foliageUV(g, 1.2))) };
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

// ------------------------------------------------------------------------------------------------ understory
/** Fern: nine arching fronds; each frond is a spine with alternating pinnae (a serrated, readable silhouette). */
export function fernModel(): THREE.BufferGeometry {
  const r = mulberry32(61);
  const pos: number[] = [], col: number[] = [];
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, k: number) => { pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); col.push(k * 0.85, k * 0.85, k * 0.85, k, k, k, k, k, k); };
  const F = 9;
  for (let f = 0; f < F; f++) {
    const a = (f / F) * Math.PI * 2 + r() * 0.4, L = 0.55 + r() * 0.3, rise = 0.32 + r() * 0.15;
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), side = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
    const S = 9;
    const spine = (t: number) => dir.clone().multiplyScalar(t * L).add(new THREE.Vector3(0, Math.sin(t * Math.PI * 0.85) * rise - t * t * 0.12, 0));
    for (let i = 0; i < S; i++) {
      const t0 = i / S, t1 = (i + 1) / S, p0 = spine(t0), p1 = spine(t1);
      const w = 0.11 * Math.sin(Math.PI * Math.min(1, t0 * 1.1 + 0.08)) * (1 - t0 * 0.55);
      const k = 0.55 + 0.45 * t0;
      for (const sgn of [-1, 1]) {
        const tip = p0.clone().lerp(p1, 0.5).addScaledVector(side, sgn * w).addScaledVector(dir, w * 0.35).add(new THREE.Vector3(0, -w * 0.25, 0));
        tri(p0, sgn > 0 ? p1 : tip, sgn > 0 ? tip : p1, k);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  // up-facing normals read better for thin double-sided leaves under a sky light
  const nn = g.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < nn.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(nn, i); if (v.y < 0) v.negate(); v.lerp(new THREE.Vector3(0, 1, 0), 0.45).normalize(); nn.setXYZ(i, v.x, v.y, v.z); }
  return twoSided(g);
}

/** Broadleaf ground plant (a hosta-like clump): eleven curved, pointed leaves radiating and tilting up. */
export function groundPlantModel(): THREE.BufferGeometry {
  const r = mulberry32(62);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + r() * 0.5, L = 0.26 + r() * 0.12, W = L * 0.42, tilt = 0.5 + r() * 0.5;
    // leaf outline in its own plane (x across, z along), curved upward then down at the tip
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.quadraticCurveTo(W, L * 0.45, 0, L); s.quadraticCurveTo(-W, L * 0.45, 0, 0);
    const g = new THREE.ShapeGeometry(s, 4);
    g.rotateX(-Math.PI / 2); // shape y → -z (forward along the leaf)
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < p.count; k++) { const along = -p.getZ(k) / L, x = p.getX(k); p.setY(k, Math.sin(along * Math.PI * 0.8) * L * tilt * 0.6 - Math.abs(x) * 0.25); }
    g.rotateY(-a + Math.PI / 2);
    paint(g, (q) => { const k = 0.55 + 0.45 * Math.min(1, Math.hypot(q.x, q.z) / L); return [k, k, k]; });
    parts.push(g);
  }
  const m = mergeGeometries(parts.map((g) => { g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; }))!;
  m.computeVertexNormals();
  const nn = m.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < nn.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(nn, i); if (v.y < 0) v.negate(); v.lerp(new THREE.Vector3(0, 1, 0), 0.3).normalize(); nn.setXYZ(i, v.x, v.y, v.z); }
  return twoSided(m);
}

/** Grass clump: thirteen tapered, bending blades, darker at the base. */
export function grassModel(): THREE.BufferGeometry {
  const r = mulberry32(63);
  const pos: number[] = [], col: number[] = [];
  for (let i = 0; i < 13; i++) {
    const a = r() * Math.PI * 2, h = 0.28 + r() * 0.22, lean = 0.12 + r() * 0.2, w = 0.022 + r() * 0.012;
    const d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), s = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
    const base = d.clone().multiplyScalar(r() * 0.06);
    const pt = (t: number, side: number) => base.clone().addScaledVector(d, lean * t * t).add(new THREE.Vector3(0, h * t, 0)).addScaledVector(s, side * w * (1 - t));
    for (let k = 0; k < 2; k++) {
      const t0 = k / 2, t1 = (k + 1) / 2;
      const q = [pt(t0, -1), pt(t0, 1), pt(t1, 1), pt(t0, -1), pt(t1, 1), pt(t1, -1)];
      const kk = [t0, t0, t1, t0, t1, t1];
      q.forEach((v, j) => { pos.push(v.x, v.y, v.z); const c = 0.72 + 0.4 * kk[j]; col.push(c, c, c * 0.92); });
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const n = new Float32Array(pos.length); for (let i = 1; i < n.length; i += 3) n[i] = 1; // sky-facing: soft, no flicker
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return twoSided(g);
}

/** A fallen leaf lying flat (instanced by the hundred as litter). */
export function litterLeafModel(): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, -0.05); s.quadraticCurveTo(0.035, 0, 0, 0.05); s.quadraticCurveTo(-0.035, 0, 0, -0.05);
  const g = new THREE.ShapeGeometry(s, 2).rotateX(-Math.PI / 2);
  g.deleteAttribute('uv');
  return twoSided(paint(g, 1));
}

/** Wood anemone: a short stem and a five-petal white star (sparse spring flowers along the verge). */
export function flowerModel(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const stem = new THREE.CylinderGeometry(0.004, 0.005, 0.12, 3).translate(0, 0.06, 0);
  parts.push(paint(stem, () => [0.35, 0.55, 0.25]));
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, rr = i % 2 ? 0.012 : 0.032; if (i) star.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else star.moveTo(rr, 0); }
  const fg = new THREE.ShapeGeometry(star).rotateX(-Math.PI / 2).translate(0, 0.122, 0);
  parts.push(paint(fg, (p) => (Math.hypot(p.x, p.z) < 0.01 ? [1.1, 0.95, 0.4] : [1.15, 1.15, 1.1])));
  const m = mergeGeometries(parts.map((g) => { g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; }))!;
  const n = m.attributes.normal as THREE.BufferAttribute; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return m;
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
export interface WoodMats { bark: THREE.MeshLambertMaterial; leaves: THREE.MeshLambertMaterial; leavesDS: THREE.MeshLambertMaterial; rock: THREE.MeshLambertMaterial; flat: THREE.MeshLambertMaterial }
let wm: WoodMats | null = null;
/** Bark follows the trunk (vertical fissures, u = around); foliage gets soft leaf dabs; rock gets faint strata. */
export function woodMats(): WoodMats {
  if (wm) return wm;
  const bark = canvasTex(128, 256, (x, r) => {
    x.fillStyle = grey(0.86); x.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 26; i++) { // fissures running along the trunk, slightly wavy
      const cx = r() * 128, w = 2 + r() * 4;
      x.strokeStyle = grey(0.6 + r() * 0.12, 0.8); x.lineWidth = w; x.beginPath();
      for (let y = -10; y <= 266; y += 16) { const xx = cx + Math.sin(y * 0.05 + i) * 3; if (y < 0) x.moveTo(xx, y); else x.lineTo(xx, y); }
      x.stroke();
    }
    for (let i = 0; i < 120; i++) { x.fillStyle = grey(0.92 + r() * 0.08, 0.35); x.fillRect(r() * 128, r() * 256, 6 + r() * 10, 2 + r() * 3); }
  }, 81);
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
    leavesDS: lam({ side: THREE.DoubleSide }),
    rock: lam({ map: strata }),
    flat: lam({}),
  };
  return wm;
}
