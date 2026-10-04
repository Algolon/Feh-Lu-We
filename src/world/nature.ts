// Instanced vegetation: broadleaf trees (trunk + clustered crown blobs), cypresses, shrubs, ferns,
// flowers, rocks. Instances are chunked by area so frustum culling still works.
import * as THREE from 'three';
import { getKit } from './kit';
import { mulberry32, type Rng } from '../core/rng';

export interface TreeSpec { x: number; z: number; h: number; r: number; kind: 'oak' | 'birch' | 'cypress' | 'pine'; hue: number }

const crownColors = ['#4d7a33', '#5c8a3a', '#6b9942', '#41692e', '#76a248', '#839c3e', '#56823a'];

function withColor(g: THREE.BufferGeometry) {
  const n = g.attributes.position.count;
  const c = new Float32Array(n * 3).fill(1);
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

/** Bake vertical shading into vertex colours: darker underside, lighter top → soft painted volume. */
function shadeVertically(g: THREE.BufferGeometry, lo = 0.62, hi = 1.12) {
  const p = g.attributes.position, c = g.attributes.color;
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) + 1) / 2;
    const v = lo + (hi - lo) * t;
    c.setXYZ(i, v, v, v);
  }
  return g;
}

export class Vegetation {
  private trunks: { m: THREE.Matrix4; c: THREE.Color; chunk: string }[] = [];
  private crowns: { m: THREE.Matrix4; c: THREE.Color; chunk: string }[] = [];
  private cones: { m: THREE.Matrix4; c: THREE.Color; chunk: string }[] = [];
  private small: { m: THREE.Matrix4; c: THREE.Color; chunk: string; kind: 'fern' | 'shrub' | 'flower' | 'rock' }[] = [];
  private r: Rng;
  constructor(seed = 5) {
    this.r = mulberry32(seed);
  }

  private mat(x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0) {
    const m = new THREE.Matrix4();
    m.compose(new THREE.Vector3(x, y, -z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));
    return m;
  }

  tree(t: TreeSpec, chunk: string) {
    const r = this.r;
    if (t.kind === 'cypress') {
      const c = new THREE.Color('#2f5a2e').offsetHSL(t.hue * 0.03, 0, (r() - 0.5) * 0.06);
      this.trunks.push({ m: this.mat(t.x, 0, t.z, 0.18, 1.2, 0.18), c: new THREE.Color('#5a4030'), chunk });
      this.cones.push({ m: this.mat(t.x, 0.6, t.z, t.r, t.h, t.r, r() * 6), c, chunk });
      return;
    }
    if (t.kind === 'pine') {
      const c = new THREE.Color('#33603a').offsetHSL(t.hue * 0.02, 0, (r() - 0.5) * 0.08);
      this.trunks.push({ m: this.mat(t.x, 0, t.z, t.r * 0.25, t.h * 0.5, t.r * 0.25), c: new THREE.Color('#6a4a32'), chunk });
      for (let i = 0; i < 3; i++) this.cones.push({ m: this.mat(t.x, t.h * (0.25 + i * 0.2), t.z, t.r * (1 - i * 0.25), t.h * 0.45, t.r * (1 - i * 0.25), r() * 6), c, chunk });
      return;
    }
    const trunkCol = t.kind === 'birch' ? new THREE.Color('#e8e2d4') : new THREE.Color('#6b4a32').offsetHSL(0, 0, (r() - 0.5) * 0.08);
    const tr = t.kind === 'birch' ? t.r * 0.18 : t.r * 0.22;
    this.trunks.push({ m: this.mat(t.x, 0, t.z, tr, t.h, tr), c: trunkCol, chunk });
    const base = new THREE.Color(crownColors[Math.floor(r() * crownColors.length)]).offsetHSL(t.hue * 0.02, 0, (r() - 0.5) * 0.05);
    const blobs = 3 + Math.floor(r() * 3);
    const cy = t.h + t.r * 0.35;
    for (let i = 0; i < blobs; i++) {
      const a = (i / blobs) * Math.PI * 2 + r();
      const d = i === 0 ? 0 : t.r * (0.45 + r() * 0.3);
      const s = t.r * (i === 0 ? 0.95 : 0.6 + r() * 0.25);
      const c = base.clone().offsetHSL(0, 0, (r() - 0.5) * 0.06);
      this.crowns.push({ m: this.mat(t.x + Math.cos(a) * d, cy + (i === 0 ? 0.25 * t.r : (r() - 0.3) * t.r * 0.6), t.z + Math.sin(a) * d, s, s * 0.85, s, r() * 6), c, chunk });
    }
  }

  smallThing(kind: 'fern' | 'shrub' | 'flower' | 'rock', x: number, z: number, s: number, color: THREE.ColorRepresentation, chunk: string) {
    const r = this.r;
    const sy = kind === 'fern' ? s * 0.38 : kind === 'flower' ? s * 0.5 : kind === 'rock' ? s * 0.55 : s * 0.7;
    this.small.push({ m: this.mat(x, kind === 'rock' ? s * 0.1 : sy * 0.6, z, s, sy, s * (0.8 + r() * 0.4), r() * 6), c: new THREE.Color(color), chunk, kind });
  }

  build(scene: THREE.Scene, castShadow: boolean) {
    const k = getKit();
    const trunkGeo = withColor(new THREE.CylinderGeometry(0.7, 1, 1, 7, 1));
    trunkGeo.translate(0, 0.5, 0);
    const crownGeo = shadeVertically(withColor(new THREE.IcosahedronGeometry(1, 1)));
    const coneGeo = shadeVertically(withColor(new THREE.ConeGeometry(1, 1, 8, 1)), 0.7, 1.1);
    coneGeo.translate(0, 0.5, 0);
    const blobGeo = shadeVertically(withColor(new THREE.IcosahedronGeometry(1, 0)), 0.7, 1.1);
    const rockGeo = shadeVertically(withColor(new THREE.DodecahedronGeometry(1, 0)), 0.75, 1.05);
    for (const g of [trunkGeo, crownGeo, coneGeo, blobGeo, rockGeo]) g.userData.shared = false;
    const rockMat = k.M.paint;
    const groups = new Map<string, { geo: THREE.BufferGeometry; mat: THREE.Material; items: { m: THREE.Matrix4; c: THREE.Color }[]; shadow: boolean }>();
    const push = (key: string, geo: THREE.BufferGeometry, mat: THREE.Material, it: { m: THREE.Matrix4; c: THREE.Color }, shadow: boolean) => {
      let g = groups.get(key);
      if (!g) groups.set(key, (g = { geo, mat, items: [], shadow }));
      g.items.push(it);
    };
    for (const t of this.trunks) push(`trunk|${t.chunk}`, trunkGeo, k.M.bark, t, !t.chunk.startsWith('outer'));
    const lowCrown = shadeVertically(withColor(new THREE.IcosahedronGeometry(1, 0)));
    for (const t of this.crowns) push(`crown|${t.chunk}`, t.chunk.startsWith('outer') ? lowCrown : crownGeo, k.M.foliage, t, !t.chunk.startsWith('outer'));
    for (const t of this.cones) push(`cone|${t.chunk}`, coneGeo, k.M.foliage, t, true);
    const softGeo = shadeVertically(withColor(new THREE.IcosahedronGeometry(1, 1)), 0.6, 1.1);
    for (const t of this.small) push(`${t.kind}|${t.chunk}`, t.kind === 'rock' ? rockGeo : t.kind === 'flower' ? blobGeo : softGeo, t.kind === 'rock' ? rockMat : k.M.foliage, t, false);
    const meshes: THREE.InstancedMesh[] = [];
    for (const g of groups.values()) {
      const im = new THREE.InstancedMesh(g.geo, g.mat, g.items.length);
      g.items.forEach((it, i) => {
        im.setMatrixAt(i, it.m);
        im.setColorAt(i, it.c);
      });
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
      im.castShadow = castShadow && g.shadow;
      im.receiveShadow = true;
      scene.add(im);
      meshes.push(im);
    }
    return meshes;
  }
}

/** Poisson-disc-ish scatter (dart throwing on a grid) with an exclusion predicate. */
export function scatter(r: Rng, x0: number, x1: number, z0: number, z1: number, minDist: number, tries: number, ok: (x: number, z: number) => boolean): [number, number][] {
  const cell = minDist / Math.SQRT2;
  const gw = Math.ceil((x1 - x0) / cell), gh = Math.ceil((z1 - z0) / cell);
  const grid = new Int32Array(gw * gh).fill(-1);
  const pts: [number, number][] = [];
  for (let t = 0; t < tries; t++) {
    const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0);
    const gx = Math.floor((x - x0) / cell), gz = Math.floor((z - z0) / cell);
    let good = true;
    for (let i = Math.max(0, gx - 2); i <= Math.min(gw - 1, gx + 2) && good; i++) {
      for (let j = Math.max(0, gz - 2); j <= Math.min(gh - 1, gz + 2); j++) {
        const p = grid[i + j * gw];
        if (p >= 0 && (pts[p][0] - x) ** 2 + (pts[p][1] - z) ** 2 < minDist * minDist) { good = false; break; }
      }
    }
    if (!good || !ok(x, z)) continue;
    grid[gx + gz * gw] = pts.length;
    pts.push([x, z]);
  }
  return pts;
}

/** Distance from point to polyline. */
export function distToPolyline(x: number, z: number, pts: readonly (readonly [number, number])[]) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }
  return best;
}

/** Flat ribbon mesh along a polyline (plan coords) for paths. */
export function ribbon(pts: readonly (readonly [number, number])[], width: number, y: number): THREE.BufferGeometry {
  const pos: number[] = [], uv: number[] = [], col: number[] = [];
  let dist = 0;
  const L = pts.length;
  const left: [number, number][] = [], right: [number, number][] = [], ds: number[] = [];
  for (let i = 0; i < L; i++) {
    const p = pts[i];
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(L - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len; dz /= len;
    const nx = -dz, nz = dx;
    left.push([p[0] + nx * width / 2, p[1] + nz * width / 2]);
    right.push([p[0] - nx * width / 2, p[1] - nz * width / 2]);
    if (i > 0) dist += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    ds.push(dist);
  }
  for (let i = 0; i < L - 1; i++) {
    const quad = [left[i], right[i], right[i + 1], left[i], right[i + 1], left[i + 1]];
    const us = [0, 1, 1, 0, 1, 0], vs = [ds[i], ds[i], ds[i + 1], ds[i], ds[i + 1], ds[i + 1]];
    quad.forEach((q, j) => {
      pos.push(q[0], y, -q[1]);
      uv.push(us[j] * width / 3, vs[j] / 3);
      col.push(1, 1, 1);
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  // ensure upward normals regardless of winding
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return g;
}

/** Smooth a polyline (Chaikin) for organic paths. */
export function smooth(pts: [number, number][], iters = 2): [number, number][] {
  let p = pts;
  for (let k = 0; k < iters; k++) {
    const out: [number, number][] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, az] = p[i], [bx, bz] = p[i + 1];
      out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}
