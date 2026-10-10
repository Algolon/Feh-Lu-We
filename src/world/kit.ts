// Shared materials, geometry helpers and a static batcher that merges many small coloured parts into
// a handful of draw calls. All placement helpers take PLAN coordinates (x = east, z = north, y = up);
// they convert to three.js space (x, y, -z) internally so the world is not mirrored.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeTextures } from './textures';
import { surface } from './surfaces';

export const v3 = (x: number, y: number, n: number) => new THREE.Vector3(x, y, -n);

export type MatKey =
  | 'paint' | 'plaster' | 'stone' | 'wood' | 'tile' | 'slate' | 'terracotta' | 'grass' | 'dirt'
  | 'foliage' | 'bark' | 'glass' | 'glow' | 'poolTile' | 'rug';

export interface Kit {
  T: Record<string, THREE.Texture>;
  M: Record<MatKey, THREE.Material>;
  unitBox: THREE.BoxGeometry;
  hitMat: THREE.MeshBasicMaterial;
}

let kit: Kit | null = null;

export function getKit(): Kit {
  if (kit) return kit;
  const T = makeTextures();
  const lam = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial({ vertexColors: true, ...o });
  const M: Record<MatKey, THREE.Material> = {
    paint: lam({}),
    plaster: lam({ map: T.plaster }),
    stone: lam({ map: T.stone }),
    wood: lam({ map: T.wood }),
    tile: lam({ map: T.tile }),
    slate: lam({ map: T.slate }),
    terracotta: lam({ map: T.terracotta }),
    grass: lam({ map: T.grass }),
    dirt: lam({ map: T.dirt, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    foliage: lam({ map: T.foliage }),
    bark: lam({ map: T.bark }),
    glass: new THREE.MeshLambertMaterial({ color: 0xd8efe9, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
    glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
    poolTile: lam({ map: T.poolTile }),
    rug: lam({ map: T.rug, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
  };
  // DEV-04C ART-01.1: broad authored value / hue breakup per material family (surfaces.ts; no extra draw calls)
  const SURF: Partial<Record<MatKey, Parameters<typeof surface>[1]>> = {
    paint: 'paint', plaster: 'plaster', stone: 'stone', wood: 'timber', tile: 'stone', slate: 'stone', terracotta: 'stone',
    grass: 'ground', dirt: 'ground', foliage: 'foliage', bark: 'timber', rug: 'fabric',
  };
  for (const [key, prof] of Object.entries(SURF)) surface(M[key as MatKey], prof);
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  unitBox.userData.shared = true;
  kit = { T, M, unitBox, hitMat: new THREE.MeshBasicMaterial({ visible: false }) };
  return kit;
}

const tmpColor = new THREE.Color();

/** Scale BoxGeometry UVs so textures keep real-world size (uvScale metres per texture repeat). */
export function boxGeo(sx: number, sy: number, sz: number, uvScale = 0): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  if (uvScale > 0) {
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const dims: [number, number][] = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, (uv.getX(k) * dims[f][0]) / uvScale, (uv.getY(k) * dims[f][1]) / uvScale);
    }
  }
  return g;
}

interface Group { mat: THREE.Material; geos: THREE.BufferGeometry[]; shadow: boolean; chunk: string }

/** Accumulates transformed, vertex-coloured geometry and merges it per material+chunk. */
export class Batcher {
  private groups = new Map<string, Group>();
  private rnd = 0.5;
  add(mat: THREE.Material, geo: THREE.BufferGeometry, m: THREE.Matrix4, color: THREE.ColorRepresentation, chunk = 'main', shadow = true, jitter = 0.04) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    g.applyMatrix4(m);
    // opt-in (art kit): geometry flagged keepColor brings authored vertex colours (baked shading), multiplied by the tint
    const authored = geo.userData.keepColor && g.attributes.color ? Float32Array.from((g.attributes.color as THREE.BufferAttribute).array) : null;
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    tmpColor.set(color);
    // tiny deterministic per-part brightness jitter: painterly variation without extra materials
    this.rnd = (this.rnd * 9301 + 0.49297) % 1;
    const k = 1 + (this.rnd - 0.5) * 2 * jitter;
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = tmpColor.r * k; col[i * 3 + 1] = tmpColor.g * k; col[i * 3 + 2] = tmpColor.b * k; }
    if (authored) for (let i = 0; i < n * 3; i++) col[i] *= authored[i];
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const key = `${mat.uuid}|${chunk}|${shadow}`;
    let grp = this.groups.get(key);
    if (!grp) this.groups.set(key, (grp = { mat, geos: [], shadow, chunk }));
    grp.geos.push(g);
  }
  build(parent: THREE.Object3D, castShadow = true): THREE.Mesh[] {
    const out: THREE.Mesh[] = [];
    for (const grp of this.groups.values()) {
      if (!grp.geos.length) continue;
      const merged = mergeGeometries(grp.geos, false);
      for (const g of grp.geos) g.dispose();
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, grp.mat);
      // interiors sit inside shadow-casting shells already; their own shadows would only cost draw calls
      mesh.castShadow = castShadow && grp.shadow && !(grp.mat as THREE.Material).transparent && !grp.chunk.endsWith('In');
      mesh.userData.chunk = grp.chunk;
      mesh.userData.static = true;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      parent.add(mesh);
      out.push(mesh);
    }
    this.groups.clear();
    return out;
  }
}

const mtx = new THREE.Matrix4();
const q = new THREE.Quaternion();
const eul = new THREE.Euler();
const scl = new THREE.Vector3();

/** Compose a matrix from plan position, plan yaw (clockwise from above), optional extra rotation and scale. */
export function planMatrix(x: number, y: number, z: number, yaw = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0): THREE.Matrix4 {
  eul.set(rx, -yaw, rz, 'YXZ');
  q.setFromEuler(eul);
  scl.set(sx, sy, sz);
  return mtx.compose(v3(x, y, z), q, scl);
}

export interface PartOpts { yaw?: number; uv?: number; chunk?: string; shadow?: boolean; rx?: number; rz?: number; jitter?: number }

/** Box with its BOTTOM at y0, centred at plan (x, z). Size sx (east), sy (up), sz (north). */
export function box(b: Batcher, mat: THREE.Material, color: THREE.ColorRepresentation, x: number, y0: number, z: number, sx: number, sy: number, sz: number, o: PartOpts = {}) {
  const g = boxGeo(sx, sy, sz, o.uv ?? 0);
  b.add(mat, g, planMatrix(x, y0 + sy / 2, z, o.yaw ?? 0, 1, 1, 1, o.rx ?? 0, o.rz ?? 0), color, o.chunk, o.shadow ?? true, o.jitter);
  g.dispose();
}

/** Axis-aligned box from min/max corners (plan). */
export function boxMM(b: Batcher, mat: THREE.Material, color: THREE.ColorRepresentation, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, o: PartOpts = {}) {
  box(b, mat, color, (x0 + x1) / 2, y0, (z0 + z1) / 2, Math.abs(x1 - x0), y1 - y0, Math.abs(z1 - z0), o);
}

const geoCache = new Map<string, THREE.BufferGeometry>();
function cached(key: string, make: () => THREE.BufferGeometry) {
  let g = geoCache.get(key);
  if (!g) {
    geoCache.set(key, (g = make()));
    g.userData.shared = true;
  }
  return g;
}

/**
 * DEV-04A support contract: `cyl` takes the BASE height y0 of an upright cylinder. Tipped over (rx / rz), that base is
 * meaningless — the centre lands at y0 + h/2, which is how the shed's log pile, the fire logs, the kindling bundle and
 * the hall's tapestry rod came to float half their length above their support. Lying or tilted cylinders use `rod`
 * (centre-based); a long cylinder tipped past ~35° through `cyl` is recorded here and fails the DEV-04A suite.
 */
export const supportWarnings: string[] = [];
export function cyl(b: Batcher, mat: THREE.Material, color: THREE.ColorRepresentation, x: number, y0: number, z: number, rTop: number, rBot: number, h: number, seg = 10, o: PartOpts = {}) {
  if (h > 0.3 && Math.cos(o.rx ?? 0) * Math.cos(o.rz ?? 0) < 0.8) supportWarnings.push(`cyl@${x.toFixed(2)},${y0.toFixed(2)},${z.toFixed(2)} h ${h} tipped: use rod()`);
  cylAt(b, mat, color, x, y0 + h / 2, z, rTop, rBot, h, seg, o);
}
/** A cylinder whose CENTRE is at (x, y, z): logs, rods, rails, pipes — anything not standing upright on its base. */
export function rod(b: Batcher, mat: THREE.Material, color: THREE.ColorRepresentation, x: number, y: number, z: number, rTop: number, rBot: number, len: number, seg = 10, o: PartOpts = {}) {
  cylAt(b, mat, color, x, y, z, rTop, rBot, len, seg, o);
}
function cylAt(b: Batcher, mat: THREE.Material, color: THREE.ColorRepresentation, x: number, yc: number, z: number, rTop: number, rBot: number, h: number, seg: number, o: PartOpts) {
  const g = cached(`cyl${seg}`, () => new THREE.CylinderGeometry(1, 1, 1, seg, 1));
  if (rTop === rBot) {
    b.add(mat, g, planMatrix(x, yc, z, o.yaw ?? 0, rTop, h, rTop, o.rx ?? 0, o.rz ?? 0), color, o.chunk, o.shadow ?? true, o.jitter);
  } else {
    const gg = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1);
    b.add(mat, gg, planMatrix(x, yc, z, o.yaw ?? 0, 1, 1, 1, o.rx ?? 0, o.rz ?? 0), color, o.chunk, o.shadow ?? true, o.jitter);
    gg.dispose();
  }
}

export function blob(b: Batcher, mat: THREE.Material, color: THREE.ColorRepresentation, x: number, y: number, z: number, sx: number, sy = sx, sz = sx, o: PartOpts = {}) {
  const g = cached('ico1', () => new THREE.IcosahedronGeometry(1, 1));
  b.add(mat, g, planMatrix(x, y, z, o.yaw ?? 0, sx, sy, sz), color, o.chunk, o.shadow ?? true, o.jitter);
}

export function geo(b: Batcher, mat: THREE.Material, color: THREE.ColorRepresentation, g: THREE.BufferGeometry, x: number, y: number, z: number, o: PartOpts & { s?: [number, number, number] } = {}) {
  const s = o.s ?? [1, 1, 1];
  b.add(mat, g, planMatrix(x, y, z, o.yaw ?? 0, s[0], s[1], s[2], o.rx ?? 0, o.rz ?? 0), color, o.chunk, o.shadow ?? true, o.jitter);
}

/** Gable prism: ridge runs along plan X if alongX, else along Z. Base at y0, rises by h. */
export function gableGeo(len: number, width: number, h: number, alongX: boolean): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0);
  s.lineTo(width / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
  g.translate(0, 0, -len / 2);
  if (alongX) g.rotateY(Math.PI / 2);
  // UVs: make roof textures repeat by world size
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 2);
  return g;
}

/** Hip-roof (pyramid-ish) geometry for a rectangle sx × sz rising h, ridge along the longer side. */
export function hipRoofGeo(sx: number, sz: number, h: number, overhang = 0.5): THREE.BufferGeometry {
  const ax = sx / 2 + overhang, az = sz / 2 + overhang;
  const ridge = Math.max(0, Math.abs(ax - az));
  const alongX = ax > az;
  const rx = alongX ? ridge : 0, rz = alongX ? 0 : ridge;
  // three.js coords (z negated doesn't matter: symmetric)
  const p = [
    [-ax, 0, -az], [ax, 0, -az], [ax, 0, az], [-ax, 0, az],
    [-rx, h, -rz], [rx, h, rz],
  ];
  const tris = alongX
    ? [[0, 1, 5], [0, 5, 4], [2, 3, 4], [2, 4, 5], [1, 2, 5], [3, 0, 4]]
    : [[0, 1, 4], [1, 2, 5], [1, 5, 4], [2, 3, 5], [3, 0, 4], [3, 4, 5]];
  const pos: number[] = [], uv: number[] = [];
  for (const t of tris) {
    // ensure outward winding: compute normal and flip if pointing down
    const a = new THREE.Vector3(...(p[t[0]] as [number, number, number]));
    const bb = new THREE.Vector3(...(p[t[1]] as [number, number, number]));
    const c = new THREE.Vector3(...(p[t[2]] as [number, number, number]));
    const n = new THREE.Vector3().subVectors(bb, a).cross(new THREE.Vector3().subVectors(c, a));
    const ctr = a.clone().add(bb).add(c).multiplyScalar(1 / 3);
    const order = n.dot(new THREE.Vector3(ctr.x, 0.5, ctr.z)) < 0 ? [a, c, bb] : [a, bb, c];
    for (const v of order) {
      pos.push(v.x, v.y, v.z);
      uv.push((v.x + v.z) / 2, v.y / 1.5 + (Math.abs(v.x) + Math.abs(v.z)) / 6);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/** An individual (non-batched) mesh, e.g. for interactive parts. */
export function mesh(geom: THREE.BufferGeometry, mat: THREE.Material, color?: THREE.ColorRepresentation): THREE.Mesh {
  const g = geom.index ? geom.toNonIndexed() : geom.clone();
  const n = g.attributes.position.count;
  tmpColor.set(color ?? 0xffffff);
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = tmpColor.r; col[i * 3 + 1] = tmpColor.g; col[i * 3 + 2] = tmpColor.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Merge parts built with a temporary Batcher into ONE object (one draw call per material). */
export function compound(build: (b: Batcher) => void, castShadow = false): THREE.Group {
  const b = new Batcher();
  build(b);
  const grp = new THREE.Group();
  b.build(grp, castShadow);
  for (const c of grp.children) {
    c.matrixAutoUpdate = true;
  }
  return grp;
}

/** Invisible raycast target. */
export function hitbox(parent: THREE.Object3D, sx: number, sy: number, sz: number, ox = 0, oy = 0, oz = 0): THREE.Mesh {
  const k = getKit();
  const m = new THREE.Mesh(k.unitBox, k.hitMat);
  m.scale.set(sx, sy, sz);
  m.position.set(ox, oy, oz);
  m.visible = false;
  m.userData.hit = true;
  parent.add(m);
  return m;
}
