// DEV-04D W01: the hay bale at the south-west edge of the Wickerman clearing (the source of the refill), its low timber
// pallet and a twig besom leaning against it (the visual explanation of the cleaning: scenery, never an item).
// DEV04D_WICKERMAN_DESIGN §4: a compact two-string bale ≈ 0.95 × 0.48 × 0.38 m, a soft slightly bulged box (not a
// cube), stalks along the length on the long faces, darker cut ends, two bark-twine bands with tension dents, a pulled
// tuft at one loosened corner and a few loose stalks on the ground. Same straw sheet and palette as the figure's hay.
// Pure geometry in the bale's local frame: x = length, y up from the pallet top, z = width (three.js axes).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { toAtlas } from './propkit';
import { mulberry32 } from '../core/rng';

export const BALE = { L: 0.95, W: 0.48, H: 0.38, pallet: 0.105, bands: [-0.24, 0.24] } as const;
const STRAW = ['#fff6e0', '#f2eadc', '#ffffff', '#e8ddc8'];
const hash = (x: number, y: number, z: number) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };

/** The bale body (prop-atlas straw sheet, authored vertex colours: keepColor). */
export function baleGeo(seed = 77) {
  const r = mulberry32(seed), { L, W, H } = BALE;
  const g = new THREE.BoxGeometry(L, H, W, 12, 5, 6);
  const p = g.attributes.position as THREE.BufferAttribute, n = g.attributes.normal as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute;
  const col = new Float32Array(p.count * 3);
  const end = new THREE.Color('#b08a4c'), side = new THREE.Color('#ffffff');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nx = x / (L / 2), ny = y / (H / 2), nz = z / (W / 2);
    // soft box: edges and corners pulled in, faces bulging a little, the top a touch more than the sides
    const e = (a: number) => Math.pow(Math.abs(a), 6);
    const round = 1 - 0.07 * (e(nx) * e(ny) + e(ny) * e(nz) + e(nz) * e(nx)) - 0.035 * (e(ny) * e(nz));
    const bulge = 0.018 * (1 - nx * nx) * (1 - nz * nz) * (ny > 0 ? 1.3 : 0.5) + 0.012 * (1 - ny * ny) * (1 - nx * nx);
    // the twine bands bite into the straw (tension dents), strongest over the edges
    let dent = 0;
    for (const bx of BALE.bands) dent = Math.max(dent, Math.exp(-(((x - bx) / 0.028) ** 2)) * (0.012 + 0.01 * Math.max(e(ny), e(nz))));
    const jit = (hash(x, y, z) - 0.5) * 0.01;
    const k = round, out = bulge - dent + jit;
    const len = Math.hypot(nx, ny * 1.4, nz * 1.2) || 1;
    p.setXYZ(i, x * k + (nx / len) * out, y * k + (ny / len) * out + (ny < -0.99 ? 0 : 0), z * k + (nz / len) * out);
    // stalks along the length on the long faces and the top / bottom (the sheet's stalks run along v): v ← x
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const isEnd = ax > 0.5;
    if (isEnd) uv.setXY(i, 0.5 + z / W * 0.9, 0.5 + y / H * 0.3); // cut ends: stalks seen across, squeezed: short ends
    else if (ay > 0.5) uv.setXY(i, 0.5 + z / W * 0.7, 0.5 + x / L);
    else uv.setXY(i, 0.5 + y / H * 0.55, 0.5 + x / L);
    const c = (isEnd ? end : side).clone().multiply(new THREE.Color(STRAW[Math.floor(hash(z, x, y) * STRAW.length)]));
    const shade = (0.84 + 0.2 * hash(x * 3, y * 3, z * 3)) * (isEnd ? 0.82 + 0.1 * Math.abs(ny) : 1) * (0.9 + 0.1 * (ny + 1) / 2);
    col[i * 3] = c.r * shade; col[i * 3 + 1] = c.g * shade; col[i * 3 + 2] = c.b * shade;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.translate(0, H / 2, 0);
  g.computeVertexNormals();
  // a pulled tuft standing out of the loosened corner and stalks sticking out of the cut ends
  const straws: THREE.BufferGeometry[] = [];
  const straw = (o: [number, number, number], d: THREE.Vector3, len: number, rad = 0.006) => {
    const s = new THREE.ConeGeometry(rad, len, 3, 1).translate(0, len / 2, 0);
    s.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    s.translate(...o);
    const c = new THREE.Color(STRAW[Math.floor(r() * STRAW.length)]).multiplyScalar(1.05 + r() * 0.15), a = new Float32Array(s.attributes.position.count * 3);
    for (let i = 0; i < s.attributes.position.count; i++) a.set([c.r, c.g, c.b], i * 3);
    s.setAttribute('color', new THREE.BufferAttribute(a, 3));
    straws.push(s);
  };
  for (let q = 0; q < 14; q++) straw([L / 2 - 0.09 + (r() - 0.5) * 0.08, H - 0.01, W / 2 - 0.09 + (r() - 0.5) * 0.06], new THREE.Vector3((r() - 0.3) * 0.9, 1, (r() - 0.3) * 0.9), 0.1 + r() * 0.12);
  for (const sx of [-1, 1]) for (let q = 0; q < 16; q++) straw([sx * (L / 2 - 0.02), 0.04 + r() * (H - 0.08), (r() - 0.5) * (W - 0.06)], new THREE.Vector3(sx, (r() - 0.5) * 0.7, (r() - 0.5) * 0.7), 0.04 + r() * 0.07);
  const merged = mergeGeometries([g, ...straws])!;
  straws.forEach((s) => s.dispose()); g.dispose();
  toAtlas(merged, 'straw');
  merged.userData.keepColor = true;
  return merged;
}

/** Loose stalks on the ground round the bale (local frame of the bale, y = 0 at the ground; atlas straw). */
export function looseStrawGeo(seed = 78) {
  const r = mulberry32(seed), parts: THREE.BufferGeometry[] = [];
  const { L, W } = BALE;
  for (let q = 0; q < 26; q++) {
    // mostly in front of the long face that looks into the clearing (−z) and at the pulled corner
    const a = r() * Math.PI * 2, x = (r() - 0.35) * (L + 0.5), z = -W / 2 - 0.08 - r() * 0.45 + (q % 5 === 0 ? W + 0.25 : 0);
    const len = 0.09 + r() * 0.16, s = new THREE.ConeGeometry(0.006, len, 3, 1).translate(0, len / 2, 0).rotateZ(Math.PI / 2 - 0.05).rotateY(a).translate(x, 0.008, z);
    const c = new THREE.Color(STRAW[Math.floor(r() * STRAW.length)]).multiplyScalar(0.95 + r() * 0.2), arr = new Float32Array(s.attributes.position.count * 3);
    for (let i = 0; i < s.attributes.position.count; i++) arr.set([c.r, c.g, c.b], i * 3);
    s.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    parts.push(s);
  }
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  toAtlas(g, 'straw');
  g.userData.keepColor = true;
  return g;
}

/** The two twine bands round the girth (bark / sisal), following the bulged surface (vertex colours). */
export function twineGeo() {
  const { W, H } = BALE, parts: THREE.BufferGeometry[] = [];
  for (const bx of BALE.bands) {
    const pts: THREE.Vector3[] = [];
    const hw = W / 2 + 0.004, hh = H / 2 + 0.004, rr = 0.05;
    // a rounded rectangle round the y-z section (the corners are where the twine bites in)
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2, cx = Math.cos(a), cy = Math.sin(a);
      const sx = Math.sign(cx) * Math.min(1, Math.abs(cx) * 1.6), sy = Math.sign(cy) * Math.min(1, Math.abs(cy) * 1.6);
      pts.push(new THREE.Vector3(bx + Math.sin(a * 3) * 0.004, H / 2 + sy * (hh - rr * (1 - Math.abs(sy))) , sx * (hw - rr * (1 - Math.abs(sx)))));
    }
    const t = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 48, 0.0065, 4, true);
    const c = new Float32Array(t.attributes.position.count * 3);
    for (let i = 0; i < t.attributes.position.count; i++) { const k = 0.85 + 0.25 * hash(i, bx, 1); c.set([k, k, k], i * 3); }
    t.setAttribute('color', new THREE.BufferAttribute(c, 3));
    t.deleteAttribute('uv');
    parts.push(t);
  }
  // the knot on the top of each band
  for (const bx of BALE.bands) { const k = new THREE.SphereGeometry(0.014, 5, 4).scale(1.2, 0.7, 1).translate(bx + 0.01, H + 0.006, W * 0.12); k.deleteAttribute('uv'); k.setAttribute('color', new THREE.BufferAttribute(new Float32Array(k.attributes.position.count * 3).fill(0.8), 3)); parts.push(k); }
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  g.userData.keepColor = true;
  return g;
}

/** A twig besom: handle + a bound bundle of birch twigs splaying to the sweeping end (local: foot at the origin, up +y). */
export function besomGeo(seed = 79) {
  const r = mulberry32(seed), parts: THREE.BufferGeometry[] = [];
  const paint = (g: THREE.BufferGeometry, hex: string, k = 1) => {
    const c = new THREE.Color(hex).multiplyScalar(k), a = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < g.attributes.position.count; i++) { const v = 0.9 + ((i * 7) % 5) / 25; a.set([c.r * v, c.g * v, c.b * v], i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    g.deleteAttribute('uv');
    return g;
  };
  parts.push(paint(new THREE.CylinderGeometry(0.015, 0.018, 1.0, 6).translate(0, 0.42 + 0.5, 0), '#8a6a46')); // handle (into the bundle)
  for (let q = 0; q < 22; q++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()), len = 0.44 + r() * 0.08;
    const foot = new THREE.Vector3(Math.cos(a) * d * 0.075, 0.0 + r() * 0.03, Math.sin(a) * d * 0.075 * 0.7), top = new THREE.Vector3(Math.cos(a) * d * 0.022, len, Math.sin(a) * d * 0.02);
    const dir = top.clone().sub(foot), g = new THREE.CylinderGeometry(0.003, 0.0045, dir.length(), 3).translate(0, dir.length() / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())).translate(foot.x, foot.y, foot.z);
    parts.push(paint(g, ['#5e4a34', '#6e573c', '#4e3d2b'][q % 3], 0.9 + r() * 0.25));
  }
  for (const y of [0.3, 0.38]) parts.push(paint(new THREE.CylinderGeometry(0.03, 0.032, 0.025, 7).translate(0, y, 0), '#352a1f')); // bindings
  const g = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
  parts.forEach((p) => p.dispose());
  g.userData.keepColor = true;
  return g;
}
