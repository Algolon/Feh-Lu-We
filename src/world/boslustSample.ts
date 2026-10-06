// Art-refresh step 3: the BOSLUST exterior sample (fork → approach → cut → entrance). Built only when
// ART.ext === 'sample' (?review=boslust or ?ext=sample); otherwise the original woodland is built.
// Gameplay contract kept: tree positions and collision circles are the original ones (same scatter points);
// the cut and headwall colliders are created by the original code (visuals replaced); the door, sign,
// inscription tablet, lock, signpost hitbox and all interaction ids are untouched.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeVegBatch, onFrame, type VegBatch } from './vegbatch';
import { CAPS } from '../core/caps';
import type { World, GameApi } from '../interactions/world';
import type { Ctx } from './arch';
import { Batcher, compound, getKit, v3 } from './kit';
import { Asm, artMats, softBox, projectUV, bake, baseAO, ContactShadows } from './artkit';
import { lump as lumpGeo, treeModel, bushModel, plantModel, rockModel, litterLeafModel, woodMats, taperTube, PLANT_VARIANTS, type Model, type Lod, type TreeSpecies, type BushSpecies, type PlantKind } from './woodkit';
import { mulberry32 } from '../core/rng';
import { FOREST_PATHS, terrainHeight, gridHeight, hillHeight } from './terrain';
import { HILL_CUT, SITES } from './layout';
import { distToPolyline, scatter } from './nature';
import { makeInspect, place } from '../interactions/props';

export { ZONE, inZone, zoneWeight } from './boslustZone';
import { ZONE, inZone, zoneWeight } from './boslustZone';
const inCutArea = (x: number, z: number) => x > HILL_CUT.x0 - 1.2 && x < HILL_CUT.x1 + 1.2 && z > HILL_CUT.z0 + 2.8 && z < 24;
const pathDist = (x: number, z: number) => Math.min(...FOREST_PATHS.map((p) => distToPolyline(x, z, p)));

export const WOOD = {
  oakLeaves: '#6f8a3a', oakLeaves2: '#7d8f40', oakBark: '#7a6652',
  pineLeaves: '#4e6c48', pineBark: '#a3896f',
  rock: '#867d6d', fern: '#6b8a3c', plant: '#5a7a38', grass: '#7f9a48', flower: '#f4f1e6',
  litter: ['#8a5a2e', '#a26e36', '#6e4a2a', '#9a7a3a'],
};
/** Per-species tints (instance colours): bark on the bark atlas, foliage on the leaf-dab texture. */
const BARK_TINT: Record<TreeSpecies | BushSpecies, string> = { oak: '#7a6652', beech: '#9c978c', birch: '#ece8de', pine: '#a3896f', hazel: '#8c735c', holly: '#6e604e' };
const LEAF_TINT: Record<TreeSpecies | BushSpecies, string> = { oak: '#6f8a3a', beech: '#86a043', birch: '#97a94c', pine: '#4e6c48', hazel: '#7b9645', holly: '#46663a' };

// ------------------------------------------------------------------------------------------------ ground and path
// The terrain material multiplies a strongly green grass texture; to reach a target albedo the vertex colour is
// the target divided by the texture's mean (both linear). Targets are the rendered forest-floor colours.
const TEX_MEAN = new THREE.Color('#8fb35a');
const fin = (hex: string) => { const c = new THREE.Color(hex); return new THREE.Color(c.r / TEX_MEAN.r, c.g / TEX_MEAN.g, c.b / TEX_MEAN.b); };
const GROUND = { floor: fin('#535e2d'), sun: fin('#76833a'), moss: fin('#3f5226'), litter: fin('#5c4528'), soil: fin('#7a6040'), rockSoil: fin('#625a48'), hill: fin('#62723a') };
const nz2 = (x: number, z: number) => Math.sin(x * 0.31 + Math.sin(z * 0.17) * 2.1) * Math.cos(z * 0.27 - x * 0.05);
/** Ground fade: wider than the object fade so the forest floor changes gradually across the zone boundary. */
const groundWeight = (x: number, z: number) => {
  const d = Math.min(x - ZONE.x0 + 4, ZONE.x1 - x + 4, z - ZONE.z0 + 8, ZONE.z1 - z + 4);
  return THREE.MathUtils.smoothstep(d, 0, 16);
};
/**
 * Forest-floor colour in the zone (terrain vertex colours, 2 m grid): leaf litter under the crowns, a warm
 * worn-soil band either side of the path, earth and rock-dust at the cut, sunlit and mossy patches between, a
 * grassier hill. Blended in by a wide fade so the old/new boundary has no seam.
 */
export function zoneGround(x: number, z: number, c: THREE.Color, trees: [number, number][]) {
  const zw = groundWeight(x, z);
  if (zw <= 0) return;
  const base = c.clone();
  const n = nz2(x, z);
  c.copy(GROUND.floor).lerp(n > 0 ? GROUND.sun : GROUND.moss, Math.abs(n) * 0.6);
  const hr = Math.hypot(x - 63, z - 30);
  if (hr < 15) c.lerp(GROUND.hill, 0.6 * (1 - hr / 15));
  let crown = 0;
  for (const [tx, tz] of trees) { const d = Math.hypot(tx - x, tz - z); if (d < 4.2) crown = Math.max(crown, 1 - d / 4.2); }
  c.lerp(GROUND.litter, crown * 0.7);
  const dp = pathDist(x, z);
  if (dp < 3.8) c.lerp(GROUND.soil, (1 - dp / 3.8) ** 1.3 * 0.75); // worn soil grading out from the path into the floor
  if (x > HILL_CUT.x0 - 3 && x < HILL_CUT.x1 + 3 && z > HILL_CUT.z0 + 3 && z < 21) c.lerp(GROUND.rockSoil, 0.5);
  c.lerp(base, 1 - zw);
}

/** Per-side path width for the drape: wanders slowly (1.4–2.6 m) inside the zone, the original 1.9 m outside it. */
export const zonePathWidth = (x: number, z: number, d: number) => {
  const zw = zoneWeight(x, z);
  return 1.9 + zw * (0.45 * Math.sin(d * 0.71) + 0.12 * Math.sin(d * 1.31 + 1.3) + 0.1); // slow wander: no zigzag at the 1 m sampling
};
const PATH_T = (() => { const a = new THREE.Color('#c8ad80'), b = new THREE.Color('#948670'); return [b.r / a.r, b.g / a.g, b.b / a.b]; })();
/** Path vertex tint: the original colour outside the zone, a less orange, earthier soil inside (keepColor). */
export function zonePathTint(g: THREE.BufferGeometry) {
  const p = g.attributes.position as THREE.BufferAttribute, c = g.attributes.color as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const zw = groundWeight(p.getX(i), -p.getZ(i)), k = 0.92 + 0.08 * Math.sin(p.getX(i) * 1.3 - p.getZ(i) * 0.9);
    c.setXYZ(i, THREE.MathUtils.lerp(1, PATH_T[0] * k, zw), THREE.MathUtils.lerp(1, PATH_T[1] * k, zw), THREE.MathUtils.lerp(1, PATH_T[2] * k, zw));
  }
  g.userData.keepColor = true;
  return g;
}

/**
 * Soft path verge (sample zone only): on both sides of each forest path a band that continues the path's own
 * surface (same dirt texture, same tint, UVs continuing across the edge) and fades out over an irregular 0.55–1.25 m,
 * plus soft-edged earth patches beside the path, all in one transparent mesh (one draw call). The opaque path stays
 * exactly as it is, so the route reads as clearly as before; only its hard edge dissolves into the forest floor.
 * The band's inner edge must coincide with the drape's edge: the sampling below mirrors `drape` in estate.ts
 * (1 m steps, same distance accumulation, same per-side width function).
 */
export function pathVerge(w: World, paths: readonly (readonly (readonly [number, number])[])[], dirt: THREE.Texture) {
  const pos: number[] = [], col: number[] = [], uv: number[] = [], idx: number[] = [];
  const base = new THREE.Color('#c8ad80');
  const r = mulberry32(404);
  const vert = (x: number, z: number, u: number, v: number, a: number, k = 1) => {
    const zw = groundWeight(x, z), t = 0.92 + 0.08 * Math.sin(x * 1.3 + z * 0.9);
    pos.push(x, terrainHeight(x, z) + 0.033, -z); uv.push(u, v);
    col.push(base.r * THREE.MathUtils.lerp(1, PATH_T[0] * t, zw) * k, base.g * THREE.MathUtils.lerp(1, PATH_T[1] * t, zw) * k, base.b * THREE.MathUtils.lerp(1, PATH_T[2] * t, zw) * k, a);
    return pos.length / 3 - 1;
  };
  for (const pts of paths) {
    const dense: [number, number][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 1.0));
      for (let q = 0; q < n; q++) dense.push([ax + ((bx - ax) * q) / n, az + ((bz - az) * q) / n]);
    }
    dense.push([pts[pts.length - 1][0], pts[pts.length - 1][1]]);
    let dist = 0;
    const rows: { a: number[]; b: number[]; zw: number }[] = [];
    for (let i = 0; i < dense.length; i++) {
      const p = dense[i], a = dense[Math.max(0, i - 1)], b = dense[Math.min(dense.length - 1, i + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1];
      const len = Math.hypot(dx, dz) || 1;
      dx /= len; dz /= len;
      if (i > 0) dist += Math.hypot(p[0] - dense[i - 1][0], p[1] - dense[i - 1][1]);
      const zw = zoneWeight(p[0], p[1]);
      const row: { a: number[]; b: number[]; zw: number } = { a: [], b: [], zw };
      for (const sd of [-1, 1]) {
        const wd = zonePathWidth(p[0], p[1], dist + sd * 7.3) / 2; // the drape's edge on this side
        const nz = 0.5 + 0.5 * Math.sin(dist * 0.83 + sd * 2.1) * Math.sin(dist * 0.29 + sd);
        const bw = zw * (0.55 + 0.7 * nz), mid = 0.4 + 0.15 * Math.sin(dist * 1.7 + sd * 3);
        const off = (d: number): [number, number] => [p[0] - dz * sd * d, p[1] + dx * sd * d];
        const u0 = sd < 0 ? 0 : 1.9 / 3, du = (d: number) => (sd < 0 ? -d : d) / 3;
        const ids = [vert(...off(wd), u0, dist / 3, zw), vert(...off(wd + bw * mid), u0 + du(bw * mid), dist / 3, zw * (0.6 + 0.25 * nz), 0.96), vert(...off(wd + bw), u0 + du(bw), dist / 3, 0, 0.9)];
        (sd < 0 ? row.a : row.b).push(...ids);
      }
      rows.push(row);
    }
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].zw <= 0 && rows[i - 1].zw <= 0) continue; // outside the zone the path keeps its original edge
      for (const side of ['a', 'b'] as const) {
        const p0 = rows[i - 1][side], p1 = rows[i][side];
        for (let k = 0; k < 2; k++) idx.push(p0[k], p1[k], p1[k + 1], p0[k], p1[k + 1], p0[k + 1]);
      }
    }
    // earth patches: soft, irregular, a little away from the path, here and there
    for (let i = 2; i < dense.length - 2; i += 3 + Math.floor(r() * 4)) {
      const p = dense[i], q = dense[i + 1];
      if (zoneWeight(p[0], p[1]) < 0.5 || inCutArea(p[0], p[1])) continue;
      if (r() < 0.4) continue;
      let dx = q[0] - p[0], dz = q[1] - p[1]; const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
      const sd = r() < 0.5 ? -1 : 1, d = 1.0 + r() * 1.1, R = 0.45 + r() * 0.6;
      const cx = p[0] - dz * sd * d, cz = p[1] + dx * sd * d, ph = r() * 6.3;
      const c0 = vert(cx, cz, cx / 3, cz / 3, 0.5 + r() * 0.25, 0.9);
      const rim: number[] = [];
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2, rr = R * (0.75 + 0.35 * Math.sin(a * 3 + ph) * Math.sin(a * 2 - ph));
        const x = cx + Math.cos(a) * rr * 1.3, z = cz + Math.sin(a) * rr;
        rim.push(vert(x, z, x / 3, z / 3, 0, 0.9));
      }
      for (let k = 0; k < 10; k++) idx.push(c0, rim[(k + 1) % 10], rim[k]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); // rgba: vertex alpha fades the band out
  g.setIndex(idx);
  g.computeVertexNormals();
  const nn = g.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < nn.count; i++) if (nn.getY(i) < 0) nn.setXYZ(i, -nn.getX(i), -nn.getY(i), -nn.getZ(i));
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: dirt, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.receiveShadow = true;
  m.renderOrder = 1; // after the opaque path and terrain
  Object.assign(m.userData, { region: 'outdoor', pathVerge: true });
  w.scene.add(m);
  return m;
}

// ------------------------------------------------------------------------------------------------ contact grounding
/**
 * Contact shadows for everything planted in the zone (tree feet, stumps, rocks, the signpost): soft multiply
 * decals lying on the terrain slope, one draw call. Phone quality has no shadow maps, so this is what grounds
 * the woodland there; at high quality it adds the ambient occlusion a shadow map does not give.
 */
let contact: ContactShadows | null = null;
const groundN = (x: number, z: number) => {
  const e = 0.5, dx = (terrainHeight(x + e, z) - terrainHeight(x - e, z)) / (2 * e), dz = (terrainHeight(x, z + e) - terrainHeight(x, z - e)) / (2 * e);
  return new THREE.Vector3(-dx, 1, dz).normalize(); // three.js space (z = -plan z)
};
function ground(x: number, z: number, size: number, k: number, yaw = 0, aspect = 1) {
  (contact ??= new ContactShadows()).add(x, terrainHeight(x, z) + 0.05, z, size * aspect, size, yaw, k, groundN(x, z));
}
/** Called once after the whole zone is built (estate.ts). */
export function finishZone(w: World) {
  contact?.build(w.scene, 'outdoor', '#2e2416');
  contact = null;
}

// ------------------------------------------------------------------------------------------------ batching with LOD
// Rendering paths (multi-draw BatchedMesh or instanced fallback) are in vegbatch.ts; the classes below only decide
// which geometry (LOD) each instance shows and whether it is in range.
const camPos = new THREE.Vector3();

type Spec = { kind: 'tree'; species: TreeSpecies; v: number } | { kind: 'bush'; species: BushSpecies; v: number };
interface TreeItem { key: string; bush: boolean; m: THREE.Matrix4; p: THREE.Vector3; c: THREE.Color; lod: number; vis: boolean; id: number; r: number }
const LODS: Lod[] = ['near', 'mid', 'far'];
/**
 * Trees and bushes of every species and variant in ONE batch (one draw call with multi-draw). Each species ×
 * variant has a near, mid and far geometry, each bark + foliage merged on the tree-atlas material, the bark's
 * vertex colours pre-multiplied by bark ÷ leaf tint so that one instance colour (the leaf tint) serves both.
 * Near < 16 m, mid < 26 m (3 m hysteresis each way); trees drawn to 115 m, bushes to 50 m. All LODs are emitted
 * from one skeleton with the same cluster layout, so a switch coarsens the surface but keeps the silhouette.
 */
export class TreeBatches {
  private geos: THREE.BufferGeometry[] = [];
  private keys = new Map<string, number[]>(); // geometry index per LOD
  private items: TreeItem[] = [];
  private batch: VegBatch | null = null;
  private last = new THREE.Vector3(Infinity, 0, 0);
  private cam: THREE.Camera | null = null;
  constructor(private lodDist = [16, 26], private farDist = 115, private bushFar = 50) {}
  private model(s: Spec) {
    const key = `${s.species}.${s.v}`;
    if (!this.keys.has(key)) {
      const b = new THREE.Color(BARK_TINT[s.species]), l = new THREE.Color(LEAF_TINT[s.species]);
      const ratio = new THREE.Color(b.r / l.r, b.g / l.g, b.b / l.b);
      if (s.kind === 'tree') this.keys.set(key, LODS.map((lod) => this.geos.push(mergeModel(treeModel(s.species, s.v, lod), ratio)) - 1));
      else { // bushes: near and far only (one geometry serves mid and far: fewer groups in the instanced fallback)
        const near = this.geos.push(mergeModel(bushModel(s.species, s.v, 'near'), ratio)) - 1, far = this.geos.push(mergeModel(bushModel(s.species, s.v, 'far'), ratio)) - 1;
        this.keys.set(key, [near, far, far]);
      }
    }
    return key;
  }
  add(s: Spec, m: THREE.Matrix4, leafTint: THREE.ColorRepresentation) {
    const key = this.model(s);
    this.items.push({ key, bush: s.kind === 'bush', m: m.clone(), p: new THREE.Vector3().setFromMatrixPosition(m), c: new THREE.Color(leafTint), lod: 2, vis: true, id: -1, r: 0 });
  }
  get size() { return this.items.length; }
  build(w: World) {
    this.batch = makeVegBatch(w, this.geos, this.items.length, woodMats().tree, { castShadow: true, tag: { artTrees: true, vegPart: 'trees' } });
    for (const it of this.items) {
      const g = this.keys.get(it.key)!;
      it.id = this.batch.addInstance(g[2], it.m, it.c);
      this.geos[g[0]].computeBoundingSphere();
      it.r = this.geos[g[0]].boundingSphere!.radius * it.m.getMaxScaleOnAxis();
    }
    onFrame(w, (cam) => this.update(cam));
  }
  /** LOD and range by distance; only after the camera has moved (turning is handled by the per-instance culling). */
  update(camera: THREE.Camera) {
    this.cam = camera;
    camPos.setFromMatrixPosition(camera.matrixWorld);
    if (camPos.distanceTo(this.last) < 0.3) return;
    this.last.copy(camPos);
    const b = this.batch!;
    for (const it of this.items) {
      const d = it.p.distanceTo(camPos), vis = d < (it.bush ? this.bushFar : this.farDist);
      // the LOD whose band holds d, with 3 m hysteresis: a tree keeps its current LOD until 3 m past a boundary
      let lod = 0;
      while (lod < this.lodDist.length && d >= this.lodDist[lod] + (it.lod <= lod ? 3 : -3)) lod++;
      if (lod !== it.lod) { b.setGeometryAt(it.id, this.keys.get(it.key)![lod]); it.lod = lod; }
      if (vis !== it.vis) { b.setVisibleAt(it.id, vis); it.vis = vis; }
    }
  }
  /** Diagnostics: LOD (0 near, 1 mid, 2 far; -1 out of range) of the tree or bush nearest to plan (x, z). */
  lodAt(x: number, z: number) {
    let best: TreeItem | null = null, bd = Infinity;
    for (const it of this.items) { const d = Math.hypot(it.p.x - x, -it.p.z - z); if (d < bd) { bd = d; best = it; } }
    return best && best.vis ? best.lod : -1;
  }
  /** Diagnostics: every tree and bush (species.variant, plan position). */
  list() { return this.items.map((it) => ({ key: it.key, bush: it.bush, x: +it.p.x.toFixed(2), z: +(-it.p.z).toFixed(2) })); }
  /** Diagnostics: per kind × LOD, how many are in range, and how many of those intersect the view. */
  stats() {
    const z = () => ({ near: 0, mid: 0, far: 0, nearInView: 0, midInView: 0, farInView: 0 });
    const out = { trees: z(), bushes: z() };
    if (!this.cam) return out;
    const f = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(this.cam.projectionMatrix, this.cam.matrixWorldInverse));
    const sph = new THREE.Sphere();
    for (const it of this.items) {
      if (!it.vis) continue;
      const o = it.bush ? out.bushes : out.trees, k = LODS[it.lod];
      o[k]++;
      sph.set(it.p.clone().add(new THREE.Vector3(0, it.r * 0.5, 0)), it.r);
      if (f.intersectsSphere(sph)) o[`${k}InView`]++;
    }
    return out;
  }
}

/** One geometry per LOD: bark (vertex colours × bark ÷ leaf tint) + foliage, on the tree-atlas material. */
function mergeModel(m: Model, ratio: THREE.Color) {
  const c = m.wood.attributes.color as THREE.BufferAttribute;
  for (let i = 0; i < c.count; i++) c.setXYZ(i, c.getX(i) * ratio.r, c.getY(i) * ratio.g, c.getZ(i) * ratio.b);
  const parts = m.wood.index && m.leaves.index ? [m.wood, m.leaves] : [m.wood, m.leaves].map((g) => (g.index ? g.toNonIndexed() : g));
  const g = mergeGeometries(parts)!;
  m.wood.dispose(); m.leaves.dispose();
  g.computeBoundingSphere();
  return g;
}

interface PlantItem { geo: number; m: THREE.Matrix4; p: THREE.Vector3; c: THREE.Color; show: number; id: number; k: number }
/**
 * How far each kind is shown (m). Small ground plants stop where they are a few pixels tall on a phone; foxgloves,
 * the colour accent of the approach, and ferns, which carry the verge's shape, are kept further.
 */
export const PLANT_SHOW: Record<PlantKind, number> = { fern: 16, grass: 13, bilberry: 13, foxglove: 24, lily: 11, anemone: 12 };
/**
 * Every understory plant (all kinds and variants) in one batch: one draw call with multi-draw, one per plant
 * geometry in view without. Shown within a per-kind range (PLANT_SHOW); instances shrink to nothing over the last
 * `fade` metres instead of popping.
 */
export class PlantBatch {
  private kinds = new Map<string, number>();
  private geos: THREE.BufferGeometry[] = [];
  private items: PlantItem[] = [];
  private batch: VegBatch | null = null;
  private last = new THREE.Vector3(Infinity, 0, 0);
  private count = new Map<PlantKind, number>();
  shown = 0;
  constructor(private fade = 4) {}
  add(kind: PlantKind, v: number, m: THREE.Matrix4, c: THREE.ColorRepresentation, show = PLANT_SHOW[kind]) {
    const key = `${kind}.${v % PLANT_VARIANTS[kind]}`;
    if (!this.kinds.has(key)) { this.kinds.set(key, this.geos.length); this.geos.push(plantModel(kind, v)); }
    this.items.push({ geo: this.kinds.get(key)!, m: m.clone(), p: new THREE.Vector3().setFromMatrixPosition(m), c: new THREE.Color(c), show, id: -1, k: -1 });
    this.count.set(kind, (this.count.get(kind) ?? 0) + 1);
  }
  counts() { return Object.fromEntries(this.count); }
  build(w: World) {
    if (!this.items.length) return;
    this.batch = makeVegBatch(w, this.geos, this.items.length, woodMats().flat, { sortObjects: false, tag: { understory: true, vegPart: 'plants' } });
    for (const it of this.items) { it.id = this.batch.addInstance(it.geo, it.m, it.c); this.batch.setVisibleAt(it.id, false); }
    onFrame(w, (cam) => this.update(cam));
  }
  update(camera: THREE.Camera) {
    camPos.setFromMatrixPosition(camera.matrixWorld);
    if (camPos.distanceTo(this.last) < 0.25) return;
    this.last.copy(camPos);
    const b = this.batch!;
    let shown = 0;
    for (const it of this.items) {
      const d = it.p.distanceTo(camPos);
      const k = d > it.show ? 0 : Math.min(1, (it.show - d) / this.fade);
      const kq = Math.round(k * 12) / 12; // quantised: rewrite a matrix only when its scale step changes
      if (kq > 0) shown++;
      if (kq === it.k) continue;
      if ((kq > 0) !== (it.k > 0)) b.setVisibleAt(it.id, kq > 0);
      if (kq > 0) b.setMatrixAt(it.id, kq < 1 ? tmpM.copy(it.m).multiply(tmpS2.makeScale(kq, kq, kq)) : it.m);
      it.k = kq;
    }
    this.shown = shown;
  }
}

const tmpM = new THREE.Matrix4(), tmpS2 = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3();
/** Plan position (x, y, z), heading `yaw`, optional tilt, uniform or xyz scale → three.js matrix. */
function mat(x: number, y: number, z: number, yaw: number, s: number | [number, number, number], rx = 0, rz = 0) {
  tmpE.set(rx, -yaw, rz, 'YXZ');
  tmpQ.setFromEuler(tmpE);
  if (typeof s === 'number') tmpS.set(s, s, s); else tmpS.set(...s);
  return new THREE.Matrix4().compose(tmpP.set(x, y, -z), tmpQ, tmpS);
}

// ------------------------------------------------------------------------------------------------ the woodland
export interface ZoneTree { x: number; z: number; y: number; h: number; r: number; kind: 'oak' | 'birch' | 'cypress' | 'pine'; hue: number }
/**
 * The zone's backdrop: the visual-only woodland just beyond the south fence along the zone (seen over the fence
 * from the approach and the door). Without it the reverse views show the old cone pines right behind the new
 * trees. Only this strip; the rest of the outer ring is unchanged.
 */
export const inBackdrop = (x: number, z: number) => x > ZONE.x0 && x < ZONE.x1 && z > -9 && z < -1.5;
const backdrop: ZoneTree[] = [];
export const addBackdrop = (t: ZoneTree) => { backdrop.push(t); };

/**
 * Trees (on the original positions), understory, litter, flowers and verge stones for the sample zone.
 * `trees` are the original scatter points inside the zone; their collision has already been added.
 */
export function buildWoodland(w: World, c: Ctx, trees: ZoneTree[]) {
  const r = mulberry32(2026);
  const hash = (x: number, z: number, k: number) => { const v = Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };
  // ---- trees: the original kinds become species (birch stays birch, a third of the oaks become beech), each
  // position gets a variant by hash, so neighbours rarely repeat
  const tb = new TreeBatches();
  const leafTint = new THREE.Color();
  const species: { t: ZoneTree; sp: TreeSpecies }[] = [];
  const back = backdrop.splice(0); // consumed once per build
  for (const t of [...trees, ...back]) {
    const sp: TreeSpecies = t.kind === 'pine' ? 'pine' : t.kind === 'birch' ? 'birch' : hash(t.x, t.z, 1) < 0.35 ? 'beech' : 'oak';
    const heroOak = Math.hypot(t.x - 55.83, t.z - 11.65) < 0.3, heroPine = Math.hypot(t.x - 69.23, t.z - 16.07) < 0.3;
    const s0 = heroOak ? 'oak' : heroPine ? 'pine' : sp;
    const v = heroOak || heroPine ? 0 : Math.floor(hash(t.x, t.z, 2) * 3);
    const total = s0 === 'pine' ? t.h * 1.35 : t.h + t.r * 1.2;
    const base = { oak: 8.6, beech: 9.6, birch: 9.4, pine: 13.4 }[s0];
    const s = heroOak || heroPine ? 1 : THREE.MathUtils.clamp(total / base, s0 === 'pine' ? 0.68 : 0.66, s0 === 'oak' ? 1.02 : 0.98);
    const yaw = heroOak ? 2.2 : heroPine ? 0.4 : r() * Math.PI * 2;
    const sy = s * (0.94 + hash(t.x, t.z, 3) * 0.12); // a little height variation per tree
    leafTint.set(LEAF_TINT[s0]).offsetHSL(t.hue * 0.025, (r() - 0.5) * 0.05, (r() - 0.5) * 0.06);
    r(); // (was a separate bark tint jitter: one instance colour now tints bark and leaves; the draw keeps the sequence)
    tb.add({ kind: 'tree', species: s0, v }, mat(t.x, t.y - 0.05, t.z, yaw, [s, sy, s]), leafTint);
    if (t.z > 0) { ground(t.x, t.z, ({ oak: 3.6, beech: 3.2, birch: 1.8, pine: 2.2 })[s0] * s, s0 === 'birch' ? 0.4 : 0.5, yaw); species.push({ t, sp: s0 }); } // backdrop: no decals, no undergrowth
  }
  const broadleaves = species.filter((q) => q.sp === 'oak' || q.sp === 'beech').map((q) => q.t);
  const pines = species.filter((q) => q.sp === 'pine').map((q) => q.t);

  const free = (x: number, z: number, corridor = 1.35) => inZone(x, z) && !inCutArea(x, z) && pathDist(x, z) > corridor && Math.hypot(x - SITES.fork.x + 1.3, z - SITES.fork.z + 0.9) > 1.2;
  const treeNear = (x: number, z: number, d: number) => trees.some((t) => Math.hypot(t.x - x, t.z - z) < d);
  const nearOf = (list: ZoneTree[], x: number, z: number, d: number) => list.some((t) => Math.hypot(t.x - x, t.z - z) < d);

  // ---- bushes: hazel in loose groups at the edge of broadleaf crowns (set back from the path, never in the
  // corridor), the odd holly in their shade. No collision (as in the original undergrowth).
  let bushes = 0;
  for (const t of broadleaves) {
    if (hash(t.x, t.z, 4) > 0.42) continue;
    const a0 = r() * Math.PI * 2, n = 1 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const a = a0 + i * 0.9 + r() * 0.4, d = 2.4 + r() * 1.6, x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d;
      if (!free(x, z, 2.6) || treeNear(x, z, 1.3)) continue;
      const holly = r() < 0.25, sp: BushSpecies = holly ? 'holly' : 'hazel', sc = 0.8 + r() * 0.4, yaw = r() * 6.3;
      const bv = Math.floor(r() * 3);
      r(); // (was a separate bark tint jitter; the draw is kept so the random sequence and placement stay the same)
      tb.add({ kind: 'bush', species: sp, v: bv }, mat(x, terrainHeight(x, z) - 0.05, z, yaw, sc), new THREE.Color(LEAF_TINT[sp]).offsetHSL((r() - 0.5) * 0.02, 0, (r() - 0.5) * 0.06));
      ground(x, z, (holly ? 1.6 : 2.0) * sc, 0.4, yaw);
      bushes++;
    }
  }
  tb.build(w);

  // ---- understory (one batch): clustered, with negative space; never in the walking corridor, the cut or in
  // front of clues. Each cluster mostly keeps one variant, as plants spread in patches.
  const M = woodMats();
  const pb = new PlantBatch();
  const tint = (k = 0.08) => new THREE.Color(1, 1, 1).offsetHSL((r() - 0.5) * 0.02, 0, (r() - 0.5) * k);
  const put = (kind: PlantKind, v: number, x: number, z: number, sc: number, show?: number) => pb.add(kind, v, mat(x, terrainHeight(x, z) - 0.02, z, r() * 6.3, sc), tint(), show);
  const patch = (kind: PlantKind, cx: number, cz: number, n: number, spread: number, sc: [number, number], corridor: number, show?: number, avoidTree = 0.5) => {
    const v0 = Math.floor(r() * PLANT_VARIANTS[kind]);
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - 0.5) * spread, z = cz + (r() - 0.5) * spread;
      if (!free(x, z, corridor) || treeNear(x, z, avoidTree)) continue;
      put(kind, r() < 0.75 ? v0 : Math.floor(r() * PLANT_VARIANTS[kind]), x, z, sc[0] + r() * sc[1], show);
    }
  };
  // ferns in hollows and at tree feet
  for (const [cx, cz] of scatter(r, ZONE.x0, ZONE.x1, 2, ZONE.z1 - 2, 6.5, 900, (x, z) => free(x, z, 2.0))) patch('fern', cx, cz, 2 + Math.floor(r() * 4), 2.2, [0.9, 0.5], 1.5);
  // bilberry carpets under the pines and up the hill
  for (const t of pines) if (r() < 0.8) patch('bilberry', t.x + (r() - 0.5) * 3, t.z + (r() - 0.5) * 3, 6 + Math.floor(r() * 7), 3.4, [0.9, 0.6], 1.6);
  // lily of the valley in small patches under oaks and beeches
  for (const t of broadleaves) if (r() < 0.4) { const a = r() * 6.3, d = 1.0 + r() * 1.2; patch('lily', t.x + Math.cos(a) * d, t.z + Math.sin(a) * d, 4 + Math.floor(r() * 5), 1.1, [0.9, 0.5], 1.6); }
  // foxgloves: a few groups in the lighter openings set back from the path (the colour accent of the approach)
  for (const [cx, cz] of scatter(r, ZONE.x0 + 3, ZONE.x1 - 3, 3, 34, 8.5, 400, (x, z) => free(x, z, 2.3) && pathDist(x, z) < 6 && !treeNear(x, z, 2.2))) patch('foxglove', cx, cz, 2 + Math.floor(r() * 4), 1.4, [0.85, 0.35], 2.0, undefined, 1.2);
  // wood anemones in drifts under the broadleaves and in openings
  for (const [cx, cz] of scatter(r, ZONE.x0 + 4, ZONE.x1 - 4, 3, 30, 7, 300, (x, z) => free(x, z, 1.8) && nearOf(broadleaves, x, z, 5))) patch('anemone', cx, cz, 5 + Math.floor(r() * 5), 1.6, [0.9, 0.4], 1.4);
  // grass: the path verge (clumps with gaps; wispy and seed-head grasses where it is light), sedge at tree feet,
  // loose tufts in the openings; verge stones
  const stoneG = rockModel(7); stoneG.userData.keepColor = true;
  let stones = 0;
  for (const p of FOREST_PATHS) for (let i = 1; i < p.length; i++) {
    const [ax, az] = p[i - 1], [bx, bz] = p[i];
    const seg = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / seg, nz = (bx - ax) / seg;
    for (let t = 0; t < seg; t += 0.4 + r() * 0.55) { // irregular spacing: no rhythm along the edge
      const x0 = ax + ((bx - ax) * t) / seg, z0 = az + ((bz - az) * t) / seg;
      if (!inZone(x0, z0)) continue;
      for (const side of [-1, 1]) {
        if (Math.sin((x0 + z0) * 0.9 + side * 1.7) + Math.sin((x0 - z0) * 0.37) < -0.35) continue; // gaps along the verge
        const off = 1.05 + r() * 0.9, x = x0 + nx * off * side, z = z0 + nz * off * side;
        if (inCutArea(x, z) || pathDist(x, z) < 0.95) continue;
        const v = treeNear(x, z, 3) ? (r() < 0.7 ? 0 : 3) : [0, 1, 1, 2][Math.floor(r() * 4)];
        put('grass', v, x, z, 0.75 + r() * 0.55);
        if (r() < 0.18) { c.b.add(M.rock, stoneG, mat(x + nx * side * 0.2, terrainHeight(x, z) - 0.06, z + nz * side * 0.2, r() * 6.3, [0.14 + r() * 0.1, 0.1 + r() * 0.06, 0.12 + r() * 0.1]), new THREE.Color(WOOD.rock).multiplyScalar(0.92 + r() * 0.12), c.chunk, true, 0); stones++; }
      }
    }
  }
  for (const [x, z] of scatter(r, ZONE.x0, ZONE.x1, 2, ZONE.z1 - 2, 2.6, 2500, (x, z) => free(x, z, 2.2) && !treeNear(x, z, 1.4))) {
    if (r() < 0.55) put('grass', nearOf(trees, x, z, 3) ? 3 : [0, 0, 1, 2][Math.floor(r() * 4)], x, z, 0.7 + r() * 0.5);
  }
  // leaf litter under the broadleaves, drifting onto the path edges: static, batched into the forest chunk
  const litterG = litterLeafModel();
  let litter = 0;
  for (const t of trees) {
    if (t.kind === 'pine') continue;
    for (let i = 0; i < 22; i++) {
      const a = r() * Math.PI * 2, d = 0.5 + Math.sqrt(r()) * 3.2, x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d;
      if (!inZone(x, z) || inCutArea(x, z) || pathDist(x, z) < 0.4) continue; // a few drift onto the path edge
      c.b.add(M.flat, litterG, mat(x, terrainHeight(x, z) + 0.012, z, r() * 6.3, 0.8 + r() * 0.7), WOOD.litter[Math.floor(r() * 4)], c.chunk, false, 0);
      litter++;
    }
  }
  pb.build(w);
  // diagnostics for the measurement script, tests and the debug overlay (no effect on rendering)
  w.scene.userData.vegPath = CAPS.multiDraw ? 'multi-draw' : 'instanced';
  w.scene.userData.vegStats = () => ({ ...tb.stats(), plantsShown: pb.shown });
  w.scene.userData.vegLodAt = (x: number, z: number) => tb.lodAt(x, z);
  w.scene.userData.vegList = () => tb.list();
  return { trees: tb.size - bushes, bushes, counts: { ...pb.counts(), litter, stones } };
}

// ------------------------------------------------------------------------------------------------ stumps
/**
 * Old stumps in the zone (same positions and collision circles as before, radius `s`): a short flared stump
 * with a sawn top showing rings, batched (timber material) into the forest chunk.
 */
export function stumpsV2(c: Ctx, list: { x: number; z: number; y: number; s: number }[]) {
  const A = artMats();
  const r = mulberry32(77);
  const body = taperTube([[0, -0.25, 0], [0, 0.35, 0], [0.02, 0.9, 0.01]], [1.18, 0.98, 0.94], { radial: 10, rows: 5, lobes: 4, flare: 0.35, vScale: 1.0 });
  bake(body, (p) => 0.7 + 0.3 * THREE.MathUtils.smoothstep(p.y, -0.1, 0.6));
  const top = new THREE.CircleGeometry(0.97, 12).rotateX(-Math.PI / 2).translate(0.02, 0.9, -0.01);
  const uv = top.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.25 + 0.2, uv.getY(i) * 0.25 + 0.2);
  for (const t of list) {
    const yaw = r() * 6.3;
    c.b.add(A.timber, body, mat(t.x, t.y - 0.05, t.z, yaw, t.s), new THREE.Color('#6e5440').multiplyScalar(0.9 + r() * 0.2), c.chunk, true, 0);
    c.b.add(A.timber, top, mat(t.x, t.y - 0.05, t.z, yaw, t.s), '#b08a62', c.chunk, true, 0);
    ground(t.x, t.z, t.s * 3.2, 0.5, yaw);
  }
  body.dispose(); top.dispose();
}

// ------------------------------------------------------------------------------------------------ the cut
const ROCKS = [rockModel(11), rockModel(23), rockModel(37), rockModel(53)];
for (const g of ROCKS) { g.userData.keepColor = true; g.computeBoundingBox(); }
/**
 * The hillside cut as rock: on both sides, courses of big outcrop boulders whose inner faces sit 3 cm proud of
 * the original collision boxes (x 60 / 66) and whose bodies run back into the hill, stacked until they are above
 * the hill surface behind them (no terrain step shows). Gatepost boulders mark the mouth; more rock breaks
 * through the hill around the door. Batched into the forest chunk: one draw call (rock material).
 */
export function cutRocks(c: Ctx) {
  const M = woodMats();
  const r = mulberry32(31);
  const { x0, x1, z1 } = HILL_CUT;
  const tint = () => new THREE.Color(WOOD.rock).multiplyScalar(0.86 + r() * 0.2);
  const put = (x: number, y: number, z: number, yaw: number, s: [number, number, number], i = Math.floor(r() * ROCKS.length)) =>
    c.b.add(M.rock, ROCKS[i], mat(x, y, z, yaw, s), tint(), c.chunk, true, 0);
  /** A rock whose face toward `side` (−1 = it lies west of the face, +1 = east) is at plan x `face`. */
  const wallRock = (face: number, side: -1 | 1, yBot: number, h: number, z: number, depth: number, len: number) => {
    const i = Math.floor(r() * ROCKS.length), bb = ROCKS[i].boundingBox!;
    const flip = r() < 0.5; // yaw 0 or π: extents stay axis-aligned, so the face position is exact
    const sy = h / (bb.max.y - bb.min.y), sx = depth / (bb.max.x - bb.min.x), sz = len / (bb.max.z - bb.min.z);
    // plan x of the rock's face toward the cut: max x (side −1) or min x (side +1) of the yawed hull
    const ext = side < 0 ? (flip ? -bb.min.x : bb.max.x) : (flip ? -bb.max.x : bb.min.x);
    const cx = face - ext * sx - side * 0.03; // 3 cm proud of the collider face
    const cz = z - (flip ? -(bb.max.z + bb.min.z) / 2 : (bb.max.z + bb.min.z) / 2) * sz;
    put(cx, yBot - bb.min.y * sy, cz, flip ? Math.PI : 0, [sx, sy, sz], i);
  };
  for (const side of [-1, 1] as const) {
    const face = side < 0 ? x0 : x1; // inner face of the original wall colliders
    for (let z = 11.6; z < z1 + 0.6;) {
      const len = 1.15 + r() * 0.55, zc = z + len / 2;
      // highest ground within 2.6 m behind the face, plus the collider top: the stack must cover both
      let need = 0.5;
      for (let d = 0; d <= 2.6; d += 0.4) need = Math.max(need, gridHeight(face - side * d, zc) + 0.15, hillHeight(face - side * d, zc) + 0.1);
      if (zc > 12) need = Math.max(need, Math.max(0.45, gridHeight(face + side * 0.6, zc), hillHeight(face + side * 0.3, zc + 0.5)) + 0.3);
      let y = -0.35, layer = 0;
      while (y < need - 0.05 && layer < 4) {
        const h = Math.min(1.5, Math.max(0.75, need - y + 0.25)) * (0.85 + r() * 0.25);
        const setback = layer * 0.12 + r() * 0.06; // a slight batter: upper courses step back
        wallRock(face + side * setback, side, y, h, zc + (r() - 0.5) * 0.25, 2.2 + r() * 0.8, len * (1.0 + r() * 0.15));
        y += h * 0.78; layer++;
      }
      z += len * 0.82;
    }
    // gatepost boulders at the mouth of the cut (outside the walls, partly buried)
    put(face + side * 1.35, -0.35, 10.9, side * 0.4, [1.15, 1.25, 1.05]);
    put(face + side * 2.6, -0.3, 9.7, side * 1.1, [0.8, 0.85, 0.85]);
  }
  // rock breaking through the hill around the entrance (embedded in the slope, never in the walkway)
  for (const [x, z, sc] of [[57.2, 16.0, 1.0], [68.9, 16.4, 1.05], [57.9, 20.4, 0.8], [68.0, 20.9, 0.75], [55.8, 13.6, 0.7], [70.4, 13.2, 0.65], [59.0, 23.6, 0.6], [67.1, 24.2, 0.7]] as const) {
    const yaw = r() * 6.3;
    put(x, terrainHeight(x, z) - 0.4 * sc, z, yaw, [1.2 * sc, 1.0 * sc, 1.0 * sc]);
    ground(x, z, 3.4 * sc, 0.5, yaw, 1.2);
  }
  // contact along the foot of both rock walls and at the gateposts (on the cut floor)
  for (let z = 11.4; z < z1; z += 1.6) for (const fx of [x0 + 0.25, x1 - 0.25]) ground(fx, z, 1.6, 0.45, 0, 0.6);
  for (const side of [-1, 1]) { ground((side < 0 ? x0 : x1) + side * 1.35, 10.9, 3.2, 0.5); ground((side < 0 ? x0 : x1) + side * 2.6, 9.7, 2.2, 0.45); }
}

// ------------------------------------------------------------------------------------------------ the entrance
/**
 * Headwall and portal, embedded: a rubble wall of chunky dressed stones on a dark mortar backing whose top steps
 * down toward both ends, where earth and turf from the hill come over it and rock masses step up into the slope;
 * irregular capping stones and turf over the top; a heavy oak
 * door frame (posts on stone pads, a lintel with projecting ends) right around the opening, a stone threshold,
 * roots coming over the top and two lanterns on wall brackets. The original sign, inscription tablet, lock and
 * door are kept exactly where they were (built by boslust.ts); nothing here covers them.
 */
export function entranceV2(w: World, c: Ctx) {
  const A = artMats(), M = woodMats();
  const DX = 63, DZ = 18.2, TOP = 3.62;
  const r = mulberry32(5);
  // clear zones (plan x0, x1, y0, y1) for the door opening, tablet, lock and sign
  const keep: [number, number, number, number][] = [[62.38, 63.62, -1, 2.32], [60.12, 61.38, 1.17, 1.93], [64.55, 65.15, 0.92, 1.48], [62.0, 64.0, 2.85, 3.46]];
  const blocked = (x0: number, x1: number, y0: number, y1: number) => keep.some(([a, b, c0, d]) => x1 > a && x0 < b && y1 > c0 && y0 < d);
  // the wall top steps down toward both ends (it sinks into the hill there): full height over the door, sign and
  // tablet (x 61.05–64.95), one step lower, then lower again at the ends
  const STEPS = { l1: 61.05, l2: 60.3, r1: 64.95, r2: 65.75 };
  const topX = (x: number) => (x < STEPS.l2 ? TOP - 0.95 : x < STEPS.l1 ? TOP - 0.42 : x > STEPS.r2 ? TOP - 1.0 : x > STEPS.r1 ? TOP - 0.45 : TOP);
  const topAt = (x0: number, x1: number) => Math.min(topX(x0 + 0.01), topX(x1 - 0.01));
  // dark mortar backing (also what shows in the joints), stepped like the wall
  for (const [x0, x1, y0, y1] of [[59.4, STEPS.l2, 0, TOP - 0.95], [STEPS.l2, STEPS.l1, 0, TOP - 0.42], [STEPS.l1, 62.38, 0, TOP], [63.62, STEPS.r1, 0, TOP], [STEPS.r1, STEPS.r2, 0, TOP - 0.45], [STEPS.r2, 66.6, 0, TOP - 1.0], [62.38, 63.62, 2.32, TOP]] as const) {
    const g = projectUV(softBox(x1 - x0, y1 - y0, 0.3, 0.01, 1), 0.8);
    c.b.add(M.rock, g, mat((x0 + x1) / 2, y0 + (y1 - y0) / 2, DZ + 0.08, 0, 1), '#5a5347', c.chunk, true, 0); // face 7 cm behind the stones
    g.dispose();
  }
  // coursed rubble: rows of irregular stones, every joint broken, bigger stones low
  const stone = (x0: number, x1: number, y0: number, y1: number, proud = 0) => {
    const g = dropBack(bake(projectUV(softBox(x1 - x0 - 0.035, y1 - y0 - 0.035, 0.3 + r() * 0.08, 0.035 + r() * 0.025, 1), 0.7), baseAO(-(y1 - y0) / 2, 0.12, 0.82)));
    const t = new THREE.Color('#8c8270').offsetHSL((r() - 0.5) * 0.05, (r() - 0.5) * 0.1, (r() - 0.5) * 0.14).multiplyScalar(0.78 + 0.22 * Math.min(1, (y0 + 0.2) / 1.2)); // darker, earthier low
    c.b.add(M.rock, g, mat((x0 + x1) / 2, (y0 + y1) / 2, DZ - 0.02 - proud + r() * 0.04, (r() - 0.5) * 0.06, 1, (r() - 0.5) * 0.05, (r() - 0.5) * 0.06), t, c.chunk, true, 0);
    g.dispose();
  };
  // rubble in rough courses: heights vary within a course, a tall stone now and then spans two courses (it
  // claims the space above it), widths vary, big stones low, every vertical joint broken
  const taken: [number, number, number][] = []; // x0, x1, top of tall stones reaching into the next course
  let y = 0;
  while (y < TOP - 0.12) {
    const h = Math.min(TOP - y, (y < 1 ? 0.42 : 0.32) + r() * 0.12);
    let x = 59.4;
    const tallNow = taken.filter((t) => t[2] > y + 0.05);
    taken.length = 0;
    while (x < 66.6 - 0.05) {
      const t = tallNow.find((q) => x >= q[0] - 0.01 && x < q[1]);
      if (t) { x = t[1]; continue; }
      const next = tallNow.find((q) => q[0] > x);
      let wdt = Math.min(66.6 - x, (y < 1 ? 0.5 : 0.36) + r() * 0.42, next ? next[0] - x : 99);
      if (66.6 - x - wdt < 0.2) wdt = 66.6 - x;
      const top = topAt(x, x + wdt);
      const tall = r() < 0.16 && y + h * 2 < top && wdt < 0.6;
      let sh = tall ? h * 1.9 : h * (0.86 + r() * 0.14);
      if (y + sh > top) sh = top - y; // the last course under a lower step is cut to it
      if (sh > 0.12 && !blocked(x, x + wdt, y, y + sh)) { stone(x, x + wdt, y, y + sh); if (tall) taken.push([x, x + wdt, y + sh]); }
      x += wdt;
    }
    y += h;
  }
  // capping stones along the stepped top (each step's cap ends in the next), then turf rolling over from the mound
  for (let x = 59.3; x < 66.7;) {
    let wd = 0.45 + r() * 0.35;
    for (const b of [STEPS.l2, STEPS.l1, STEPS.r1, STEPS.r2]) if (x < b - 0.05 && x + wd > b) wd = b - x + 0.04; // no cap across a step
    const g = bake(projectUV(softBox(wd, 0.16 + r() * 0.08, 0.6, 0.05, 1), 0.7), () => 0.95);
    c.b.add(M.rock, g, mat(x + wd / 2, topX(x + wd / 2) + 0.06, DZ + 0.02, (r() - 0.5) * 0.15, 1, 0, (r() - 0.5) * 0.08), new THREE.Color('#9d917a').multiplyScalar(0.9 + r() * 0.15), c.chunk, true, 0);
    g.dispose();
    x += wd - 0.02;
  }
  for (let i = 0; i < 9; i++) {
    const x = 59.6 + i * 0.86 + (r() - 0.5) * 0.3;
    const g = lumpTurf(x, topX(x) + 0.12, DZ + 0.12, 0.55 + r() * 0.2, i);
    c.b.add(M.flat, g, new THREE.Matrix4(), new THREE.Color(WOOD.grass).multiplyScalar(0.82 + r() * 0.12), c.chunk, false, 0); // same group as the litter
    g.dispose();
  }
  // where the wall steps down, the hill comes over it: larger earth-and-turf mounds on the lower steps, running
  // back into the slope behind (the hill is ~3.0–3.4 m high just behind the wall)
  for (const [x, y, z, sz, earth] of [[59.75, TOP - 0.82, DZ + 0.35, 0.95, 0.35], [60.6, TOP - 0.3, DZ + 0.4, 0.75, 0.15], [66.25, TOP - 0.86, DZ + 0.35, 1.0, 0.35], [65.35, TOP - 0.33, DZ + 0.4, 0.75, 0.15], [59.2, TOP - 1.05, DZ + 1.1, 1.1, 0.5], [66.85, TOP - 1.1, DZ + 1.1, 1.1, 0.5]] as const) {
    const g = lumpTurf(x, y, z, sz, Math.round(x * 10));
    c.b.add(M.flat, g, new THREE.Matrix4(), new THREE.Color(WOOD.grass).lerp(new THREE.Color('#6a5236'), earth).multiplyScalar(0.8 + r() * 0.12), c.chunk, false, 0);
    g.dispose();
  }
  // rock masses that hold the headwall: out of the hill, overlapping the stepped wall ends, and a second, smaller
  // rock above and behind each, so the ends step up into the slope instead of stopping at a vertical edge
  for (const [x, z, y0, yaw, i, s] of [
    [58.75, DZ - 0.1, -0.3, 0.35, 0, [1.05, 2.0, 0.95]], [67.25, DZ - 0.1, -0.3, 2.9, 2, [1.05, 2.0, 0.95]],
    [58.45, DZ + 0.9, 1.25, 1.1, 1, [0.95, 1.2, 0.9]], [67.6, DZ + 0.95, 1.2, 2.2, 3, [0.9, 1.15, 0.95]],
    [59.55, DZ + 0.75, 2.05, 0.4, 2, [0.7, 0.75, 0.7]], [66.45, DZ + 0.8, 2.0, 1.9, 0, [0.75, 0.7, 0.7]],
  ] as const) {
    const bb = ROCKS[i].boundingBox!;
    c.b.add(M.rock, ROCKS[i], mat(x, y0 - bb.min.y * s[1], z, yaw, [...s]), new THREE.Color(WOOD.rock).multiplyScalar(0.9 + r() * 0.1), c.chunk, true, 0);
  }
  // corner rocks where the headwall meets the cut walls: on top of the cut-wall courses, their inner faces flush
  // with the cut's collision faces (x 60 / 66), overlapping the stepped wall ends so no vertical wall edge shows
  for (const [side, i, zc, y0, s] of [[-1, 1, DZ - 0.2, 1.95, [1.25, 1.05, 0.9]], [1, 3, DZ - 0.2, 1.9, [1.25, 1.1, 0.95]]] as const) {
    const bb = ROCKS[i].boundingBox!, face = side < 0 ? HILL_CUT.x0 : HILL_CUT.x1;
    const cx = side < 0 ? face - bb.max.x * s[0] - 0.03 : face - bb.min.x * s[0] + 0.03;
    c.b.add(M.rock, ROCKS[i], mat(cx, y0 - bb.min.y * s[1], zc - (bb.max.z + bb.min.z) / 2 * s[2], 0, [...s]), new THREE.Color(WOOD.rock).multiplyScalar(0.92), c.chunk, true, 0);
  }
  // oak door frame on stone pads, right around the opening; lintel with projecting ends
  const post = projectUV(softBox(0.28, 2.3, 0.3, 0.03, 1), 1, 'y');
  const pad = bake(projectUV(softBox(0.42, 0.16, 0.44, 0.03, 1), 0.8), baseAO(-0.08, 0.1, 0.7));
  for (const x of [62.24, 63.76]) {
    c.b.add(M.rock, pad, mat(x, 0.08, DZ - 0.24, 0, 1), '#a3967c', c.chunk, true, 0);
    c.b.add(A.timber, post, mat(x, 0.16 + 1.15, DZ - 0.22, 0, 1), '#5e4129', c.chunk, true, 0);
  }
  post.dispose(); pad.dispose();
  const lintel = projectUV(softBox(2.3, 0.32, 0.34, 0.035, 1), 1, 'x');
  c.b.add(A.timber, lintel, mat(DX, 2.62, DZ - 0.22, 0, 1), '#56391f', c.chunk, true, 0);
  lintel.dispose();
  const peg = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 6).rotateX(Math.PI / 2);
  for (const x of [62.24, 63.76]) c.b.add(A.timber, peg, mat(x, 2.62, DZ - 0.4, 0, 1), '#3e2a18', c.chunk, true, 0);
  peg.dispose();
  // contact along the foot of the headwall and under the posts
  for (const x of [60.2, 61.4, 64.6, 65.8]) ground(x, DZ - 0.3, 1.4, 0.4, 0, 1.0);
  // stone threshold step
  const sill = bake(projectUV(softBox(1.7, 0.08, 0.62, 0.02, 1), 0.8), baseAO(-0.04, 0.05, 0.8));
  c.b.add(M.rock, sill, mat(DX, 0.04, DZ - 0.42, 0, 1), '#857a68', c.chunk, true, 0);
  sill.dispose();
  // roots coming over the top of the headwall (kept clear of the sign, tablet and lock)
  for (const [x, len, bend] of [[59.9, 1.7, 0.25], [60.7, 1.0, -0.2], [61.4, 0.7, 0.15], [64.9, 0.8, -0.15], [65.6, 1.3, 0.2], [66.3, 1.9, -0.25]] as const) {
    const g = taperTube([[x - bend, TOP + 0.35, -(DZ + 0.6)], [x, TOP + 0.1, -(DZ - 0.04)], [x + bend * 0.4, TOP - len * 0.5, -(DZ - 0.1)], [x + bend, TOP - 0.05 - len, -(DZ - 0.06)]], [0.07, 0.055, 0.035, 0.012], { radial: 6, rows: 8, vScale: 1.2 }); // three.js space (z = -plan z)
    c.b.add(A.timber, g, new THREE.Matrix4(), '#5c4a3a', c.chunk, true, 0);
    g.dispose();
  }
  // a dressed stone surround behind the inscription tablet (the tablet panel itself is the original canvas)
  const slab = bake(projectUV(softBox(1.26, 0.78, 0.06, 0.02, 1), 0.7), () => 0.9);
  c.b.add(M.rock, slab, mat(60.75, 1.55, DZ - 0.215, 0, 1), '#a3967e', c.chunk, true, 0);
  slab.dispose();
  // an oak board behind the BOSLUST sign (the sign panel itself is the original canvas)
  const board = projectUV(softBox(1.98, 0.64, 0.05, 0.015, 1), 1, 'x');
  c.b.add(A.timber, board, mat(DX, 3.15, DZ - 0.215, 0, 1), '#4a3020', c.chunk, true, 0);
  board.dispose();
  // two lanterns on iron brackets either side of the frame: always lit, soft pool on the threshold
  for (const x of [61.62, 64.38]) lanternV2(w, c, x, 2.0, DZ - 0.42);
  w.patches.add(DX, 0.06, DZ - 1.2, 2.2, '#ffb35a', () => true, 0.1, { soft: true, aspect: 1.4 });
}

/** Drop the faces of a wall stone that point into the wall (never seen: the mortar backing is behind them). */
function dropBack(g: THREE.BufferGeometry) {
  const p = g.attributes.position as THREE.BufferAttribute, idx = g.index!.array, keep: number[] = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < idx.length; t += 3) {
    a.fromBufferAttribute(p, idx[t]); b.fromBufferAttribute(p, idx[t + 1]); c.fromBufferAttribute(p, idx[t + 2]);
    if (b.sub(a).cross(c.sub(a)).normalize().z > -0.5) keep.push(idx[t], idx[t + 1], idx[t + 2]); // three.js −z = into the hill
  }
  g.setIndex(keep);
  return g;
}

/** A low, lumpy turf mass (foliage material) for the top of the headwall. */
function lumpTurf(x: number, y: number, z: number, s: number, seed: number) {
  const g = lumpGeo(x, y, -z, s * 1.2, s * 0.42, s * 0.85, seed, 1, new THREE.Vector3(x, y - 0.4, -z), 1.2, 0.3);
  return g;
}

/** Wrought iron lantern on a short hook: cage, cap, glowing glass (static emissive) and a pooled light. */
function lanternV2(w: World, c: Ctx, x: number, y: number, z: number) {
  const k = getKit();
  const a = new Asm(c.b, c.chunk, x, y, z, 0);
  const bracket = new THREE.BoxGeometry(0.03, 0.03, 0.44);
  a.add(k.M.paint, '#2b2622', bracket, 0, 0.6, 0.2);
  a.add(k.M.paint, '#2b2622', bracket, 0, 0.42, 0.36, { s: [1, 1, 0.5], rx: 0.8 });
  const bar = new THREE.CylinderGeometry(0.012, 0.012, 1, 5);
  for (const [dx, dz] of [[-0.09, -0.09], [0.09, -0.09], [-0.09, 0.09], [0.09, 0.09]]) a.add(k.M.paint, '#2b2622', bar, dx, 0.17, dz, { s: [1, 0.34, 1] });
  a.add(k.M.paint, '#2b2622', bar, 0, 0.5, 0, { s: [1, 0.3, 1] });
  const cap = new THREE.ConeGeometry(0.16, 0.14, 4).rotateY(Math.PI / 4);
  a.add(k.M.paint, '#2b2622', cap, 0, 0.41, 0);
  const base = new THREE.BoxGeometry(0.22, 0.04, 0.22);
  a.add(k.M.paint, '#2b2622', base, 0, 0, 0);
  const glass = new THREE.BoxGeometry(0.16, 0.28, 0.16);
  c.b.add(k.M.glow, glass, mat(x, y + 0.17, z, 0, 1), '#ffc979', c.chunk, false, 0);
  for (const g of [bar, cap, base, glass, bracket]) g.dispose();
  w.lamps.push({ id: `fixed.boslust.${x.toFixed(2)}`, pos: v3(x, y + 0.2, z), color: 0xffc77a, intensity: 1.35, distance: 5.5, on: () => true });
}

// ------------------------------------------------------------------------------------------------ the signpost
/**
 * The fork signpost, rebuilt as joinery: a chamfered oak post (slight lean) on a stone, a capped top, an arm
 * along the path with a pointed end, and the FORKED arm towards the hill (two tines, like a branch) with a carved
 * leaf. No words, as the clue says. Same group placement, same inspect hitbox, same collision circle.
 */
export function signpostV2(w: World, g: GameApi, c: Ctx) {
  const A = artMats();
  const { x: SX, z: SZ } = SITES.fork;
  const PX = SX - 1.3, PZ = SZ - 0.9;
  w.col.addCircle(PX, PZ, 0.14, 0, 2.5); // == original
  const sign = compound((b: Batcher) => {
    const a = new Asm(b, 'sign', 0, 0, 0, 0);
    const post = bake(projectUV(softBox(0.17, 2.35, 0.17, 0.025, 1), 1, 'y'), baseAO(-1.175, 0.3, 0.7));
    a.add(A.timber, '#6e5038', post, 0, 1.12, 0, { rz: 0.02 });
    post.dispose();
    const cap = new THREE.ConeGeometry(0.16, 0.14, 4).rotateY(Math.PI / 4);
    a.add(A.timber, '#4e3420', cap, 0, 2.36, 0);
    cap.dispose();
    // arm along the path (east): a board with a pointed end, pegged through the post
    const arrow = new THREE.Shape();
    arrow.moveTo(0, -0.1); arrow.lineTo(0.95, -0.1); arrow.lineTo(1.12, 0); arrow.lineTo(0.95, 0.1); arrow.lineTo(0, 0.1); arrow.lineTo(0, -0.1);
    const ag = new THREE.ExtrudeGeometry(arrow, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 });
    ag.translate(0, 0, -0.025); projectUV(ag, 1, 'x');
    a.add(A.timber, '#9a6c42', ag, 0.04, 1.95, 0);
    ag.dispose();
    // the forked arm (north): a board that splits into two tines, carved leaf near the post
    const fork = new THREE.Shape();
    fork.moveTo(-0.08, 0); fork.lineTo(0.08, 0); fork.lineTo(0.08, 0.62); fork.lineTo(0.2, 0.98); fork.lineTo(0.13, 1.0); fork.lineTo(0.03, 0.74);
    fork.lineTo(-0.03, 0.74); fork.lineTo(-0.13, 1.0); fork.lineTo(-0.2, 0.98); fork.lineTo(-0.08, 0.62); fork.lineTo(-0.08, 0);
    // a vertical board (like the original arm, readable from the side at eye height): shape x → up, shape y →
    // north (plan forward), extrusion → across (three -x)
    const toVertical = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0));
    const fg = new THREE.ExtrudeGeometry(fork, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 });
    fg.applyMatrix4(toVertical).translate(0.025, 0, 0); projectUV(fg, 1, 'z');
    a.add(A.timber, '#8a5a33', fg, 0, 1.6, 0.06);
    fg.dispose();
    const leaf = new THREE.Shape();
    leaf.moveTo(-0.07, 0); leaf.quadraticCurveTo(0, 0.045, 0.07, 0); leaf.quadraticCurveTo(0, -0.045, -0.07, 0);
    const lg = new THREE.ShapeGeometry(leaf).applyMatrix4(toVertical); // carved on both faces of the forked arm
    a.add(A.paint, '#4e3a22', lg, 0.034, 1.6, 0.35);
    a.add(A.paint, '#4e3a22', lg, -0.034, 1.6, 0.35, { ry: Math.PI });
    lg.dispose();
    // iron pegs through the post
    const peg = new THREE.CylinderGeometry(0.018, 0.018, 0.24, 6).rotateX(Math.PI / 2);
    a.add(A.paint, '#2f2c2a', peg, 0, 1.95, 0); a.add(A.paint, '#2f2c2a', peg, 0, 1.62, 0, { ry: Math.PI / 2 });
    peg.dispose();
    // footing stone
    const st = ROCKS[2].clone();
    st.userData.keepColor = true;
    a.add(woodMats().rock, WOOD.rock, st, 0.05, -0.12, 0.02, { s: [0.32, 0.28, 0.3] });
    st.dispose();
  });
  place(sign, PX, 0, PZ, 0);
  w.scene.add(sign);
  ground(PX + 0.05, PZ + 0.02, 0.9, 0.45);
  makeInspect(w, g, { id: 'inspect.fork', obj: sign, clue: 'c.fork', hit: [1.4, 0.7, 1.4], hitOffset: [0.4, 1.7, 0.4], label: 'Bekijken: wegwijzer' });
}

