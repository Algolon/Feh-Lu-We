// Art-refresh step 3: the BOSLUST exterior sample (fork → approach → cut → entrance). Built only when
// ART.ext === 'sample' (?review=boslust or ?ext=sample); otherwise the original woodland is built.
// Gameplay contract kept: tree positions and collision circles are the original ones (same scatter points);
// the cut and headwall colliders are created by the original code (visuals replaced); the door, sign,
// inscription tablet, lock, signpost hitbox and all interaction ids are untouched.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { World, GameApi } from '../interactions/world';
import type { Ctx } from './arch';
import { Batcher, compound, getKit, v3 } from './kit';
import { Asm, artMats, softBox, projectUV, bake, baseAO, ContactShadows } from './artkit';
import { lump as lumpGeo, oakModel, pineModel, rockModel, fernModel, groundPlantModel, grassModel, litterLeafModel, flowerModel, woodMats, taperTube, type Model } from './woodkit';
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

// ------------------------------------------------------------------------------------------------ ground and path
// The terrain material multiplies a strongly green grass texture; to reach a target albedo the vertex colour is
// the target divided by the texture's mean (both linear). Targets are the rendered forest-floor colours.
const TEX_MEAN = new THREE.Color('#8fb35a');
const fin = (hex: string) => { const c = new THREE.Color(hex); return new THREE.Color(c.r / TEX_MEAN.r, c.g / TEX_MEAN.g, c.b / TEX_MEAN.b); };
const GROUND = { floor: fin('#535e2d'), sun: fin('#76833a'), moss: fin('#3f5226'), litter: fin('#5c4528'), soil: fin('#665238'), rockSoil: fin('#625a48'), hill: fin('#62723a') };
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
  if (dp < 3.6) c.lerp(GROUND.soil, (1 - dp / 3.6) ** 1.5 * 0.7);
  if (x > HILL_CUT.x0 - 3 && x < HILL_CUT.x1 + 3 && z > HILL_CUT.z0 + 3 && z < 21) c.lerp(GROUND.rockSoil, 0.5);
  c.lerp(base, 1 - zw);
}

/** Per-side path width for the drape: wanders 1.5–3.0 m inside the zone, the original 1.9 m outside it. */
export const zonePathWidth = (x: number, z: number, d: number) => {
  const zw = zoneWeight(x, z);
  return 1.9 + zw * (0.45 * Math.sin(d * 0.71) + 0.3 * Math.sin(d * 1.93 + 1.3) + 0.25);
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

// ------------------------------------------------------------------------------------------------ instancing with LOD
/**
 * Per-frame hooks with the rendering camera: run from scene.onBeforeRender, i.e. after the camera matrices are
 * updated and BEFORE three.js projects the scene, so instance buffers written here are used in this very frame
 * (no lag, no popping when the view turns quickly).
 */
type FrameHook = (camera: THREE.Camera) => void;
function onFrame(w: World, fn: FrameHook) {
  const sc = w.scene as THREE.Scene & { userData: { frameHooks?: FrameHook[] } };
  if (!sc.userData.frameHooks) {
    const hooks: FrameHook[] = (sc.userData.frameHooks = []);
    const prev = sc.onBeforeRender;
    sc.onBeforeRender = function (renderer, scene, camera, ...rest) {
      for (const h of hooks) h(camera);
      prev.call(this, renderer, scene, camera, ...rest);
    };
  }
  sc.userData.frameHooks!.push(fn);
}
const frustum = new THREE.Frustum(), projM = new THREE.Matrix4(), sphere = new THREE.Sphere();
const camPos = new THREE.Vector3();
function frustumOf(camera: THREE.Camera) {
  projM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  frustum.setFromProjectionMatrix(projM);
  camPos.setFromMatrixPosition(camera.matrixWorld);
  return frustum;
}

interface Item { v: number; m: THREE.Matrix4; p: THREE.Vector3; c: THREE.Vector3; rad: number; cw: THREE.Color; cl: THREE.Color; near: boolean }
/**
 * Instanced models with a near/far LOD per instance. Every frame the instances inside the camera frustum are
 * sorted into the near or far InstancedMesh of their variant by distance (with hysteresis), so the whole sample
 * forest costs (variants × 2 LODs × 2 materials) draw calls and only what is in view is drawn. Shadows (high
 * quality only) come from separate far-LOD proxies on layer 1, which only the sun's shadow camera renders, so
 * trees behind the viewer still cast their shadows into view.
 */
export class LodInstances {
  private items: Item[] = [];
  private meshes: { v: number; near: boolean; part: 'wood' | 'leaves' | 'all'; im: THREE.InstancedMesh }[] = [];
  /** `ratio`: bark colour ÷ leaf colour, baked into the far LOD's wood so it can share the leaf material. */
  constructor(private variants: { near: Model; far: Model; ratio: THREE.Color }[], private nearDist = 18, private farDist = 115) {}
  add(v: number, m: THREE.Matrix4, cw: THREE.ColorRepresentation, cl: THREE.ColorRepresentation) {
    const p = new THREE.Vector3().setFromMatrixPosition(m);
    const s = new THREE.Vector3().setFromMatrixScale(m).y;
    // culling sphere around the crown (generous: a whole tree, roots to crown tips)
    const vm = this.variants[v].far, bs = vm.leaves.boundingSphere!;
    const c = new THREE.Vector3(0, bs.center.y * s * 0.6, 0).add(p);
    this.items.push({ v, m: m.clone(), p, c, rad: (bs.radius + bs.center.y * 0.4 + 0.5) * s, cw: new THREE.Color(cw), cl: new THREE.Color(cl), near: false });
  }
  get size() { return this.items.length; }
  build(w: World, castShadow: boolean) {
    const M = woodMats();
    this.variants.forEach((vm, v) => {
      const mine = this.items.filter((it) => it.v === v);
      if (!mine.length) return;
      // near: bark + leaves (two materials); far: one merged geometry on the leaf material (one draw call)
      const farAll = mergeFar(vm.far, vm.ratio);
      for (const [near, part] of [[true, 'wood'], [true, 'leaves'], [false, 'all']] as const) {
        const im = new THREE.InstancedMesh(part === 'all' ? farAll : vm.near[part], part === 'wood' ? M.bark : M.leaves, mine.length);
        im.count = 0;
        im.castShadow = false; im.receiveShadow = true;
        im.frustumCulled = false; // instances are culled individually below
        im.userData.region = 'outdoor';
        im.userData.artTrees = true;
        im.userData.lod = near ? 'near' : 'far';
        im.setColorAt(0, new THREE.Color(1, 1, 1));
        w.scene.add(im);
        this.meshes.push({ v, near, part, im });
      }
      if (castShadow) for (const part of ['wood', 'leaves'] as const) {
        const sh = new THREE.InstancedMesh(vm.far[part], M.flat, mine.length);
        mine.forEach((it, i) => sh.setMatrixAt(i, it.m));
        sh.castShadow = true; sh.receiveShadow = false;
        sh.layers.set(1);
        sh.userData.region = 'outdoor';
        sh.userData.artTrees = 'shadow';
        sh.computeBoundingSphere();
        w.scene.add(sh);
      }
    });
    // the sun's shadow camera also renders layer 1 (the proxies); shadows are switched on later by quality
    if (castShadow) w.scene.traverse((o) => { const l = o as THREE.DirectionalLight; if (l.isDirectionalLight) l.shadow.camera.layers.enable(1); });
    onFrame(w, (cam) => this.update(cam));
  }
  private last = new THREE.Matrix4();
  update(camera: THREE.Camera) {
    if (this.last.equals(camera.matrixWorld)) return; // camera unchanged: buffers still valid
    this.last.copy(camera.matrixWorld);
    const f = frustumOf(camera);
    for (const mm of this.meshes) mm.im.count = 0;
    const slot = this.meshes;
    for (const it of this.items) {
      const d = it.p.distanceTo(camPos);
      it.near = it.near ? d < this.nearDist + 3 : d < this.nearDist - 3;
      if (d > this.farDist || !f.intersectsSphere(sphere.set(it.c, it.rad))) continue;
      for (const mm of slot) {
        if (mm.v !== it.v || mm.near !== it.near) continue;
        const n = mm.im.count++;
        mm.im.setMatrixAt(n, it.m);
        mm.im.setColorAt(n, mm.part === 'wood' ? it.cw : it.cl);
      }
    }
    for (const mm of slot) {
      mm.im.instanceMatrix.needsUpdate = true;
      if (mm.im.instanceColor) mm.im.instanceColor.needsUpdate = true;
      mm.im.layers.set(mm.im.count ? 0 : 2); // an empty instanced mesh would still cost a draw call
    }
  }
}

/** Far LOD as one geometry: wood vertex colours pre-multiplied by bark ÷ leaf colour (the instance colour is the leaf tint). */
function mergeFar(m: Model, ratio: THREE.Color) {
  const wood = m.wood.clone(), c = wood.attributes.color as THREE.BufferAttribute;
  for (let i = 0; i < c.count; i++) c.setXYZ(i, c.getX(i) * ratio.r, c.getY(i) * ratio.g, c.getZ(i) * ratio.b);
  const g = mergeGeometries([wood, m.leaves.clone()])!;
  wood.dispose();
  g.computeBoundingSphere();
  return g;
}

/**
 * Small repeated things (understory): one InstancedMesh each, shown within `show` metres and inside the view.
 * Instances shrink to nothing over the last `fade` metres instead of popping at the radius.
 */
export class NearInstances {
  private items: { m: THREE.Matrix4; p: THREE.Vector3; c: THREE.Color }[] = [];
  private im: THREE.InstancedMesh | null = null;
  private last = new THREE.Matrix4();
  private rad: number;
  constructor(private geo: THREE.BufferGeometry, private mat: THREE.Material, private show = 28, private fade = 6) {
    geo.computeBoundingSphere();
    this.rad = geo.boundingSphere!.radius * 1.6 + 0.1;
  }
  add(m: THREE.Matrix4, c: THREE.ColorRepresentation) { this.items.push({ m: m.clone(), p: new THREE.Vector3().setFromMatrixPosition(m), c: new THREE.Color(c) }); }
  get size() { return this.items.length; }
  build(w: World) {
    if (!this.items.length) return;
    const im = new THREE.InstancedMesh(this.geo, this.mat, this.items.length);
    im.count = 0; im.receiveShadow = true; im.castShadow = false;
    im.frustumCulled = false;
    im.userData.region = 'outdoor';
    im.userData.understory = true;
    im.setColorAt(0, new THREE.Color(1, 1, 1));
    w.scene.add(im);
    this.im = im;
    onFrame(w, (cam) => this.update(cam));
  }
  update(camera: THREE.Camera) {
    if (this.last.equals(camera.matrixWorld)) return;
    this.last.copy(camera.matrixWorld);
    const f = frustumOf(camera), im = this.im!;
    let n = 0;
    for (const it of this.items) {
      const d = it.p.distanceTo(camPos);
      if (d > this.show || !f.intersectsSphere(sphere.set(it.p, this.rad))) continue;
      const k = Math.min(1, (this.show - d) / this.fade);
      im.setMatrixAt(n, k < 1 ? tmpM.copy(it.m).multiply(tmpS2.makeScale(k, k, k)) : it.m); im.setColorAt(n, it.c); n++;
    }
    im.count = n;
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.layers.set(n ? 0 : 2);
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
 * Trees (on the original positions), understory, litter, flowers and verge stones for the sample zone.
 * `trees` are the original scatter points inside the zone; their collision has already been added.
 */
export function buildWoodland(w: World, c: Ctx, trees: ZoneTree[]) {
  const r = mulberry32(2026);
  const ratio = (bark: string, leaf: string) => { const b = new THREE.Color(bark), l = new THREE.Color(leaf); return new THREE.Color(b.r / l.r, b.g / l.g, b.b / l.b); };
  const oakA = { near: oakModel(0, 'near'), far: oakModel(0, 'far'), ratio: ratio(WOOD.oakBark, WOOD.oakLeaves) };
  const oakB = { near: oakModel(1, 'near'), far: oakModel(1, 'far'), ratio: ratio(WOOD.oakBark, WOOD.oakLeaves2) };
  const pine = { near: pineModel('near'), far: pineModel('far'), ratio: ratio(WOOD.pineBark, WOOD.pineLeaves) };
  const lod = new LodInstances([oakA, oakB, pine]);
  const leafTint = new THREE.Color(), barkTint = new THREE.Color();
  for (const t of trees) {
    const isPine = t.kind === 'pine';
    const hero = Math.hypot(t.x - 55.83, t.z - 11.65) < 0.3 || Math.hypot(t.x - 69.23, t.z - 16.07) < 0.3;
    const total = isPine ? t.h * 1.35 : t.h + t.r * 1.2;
    const s = hero ? 1 : THREE.MathUtils.clamp(total / (isPine ? 13.4 : 8.6), isPine ? 0.68 : 0.62, isPine ? 0.95 : 1.02);
    const v = isPine ? 2 : (t.kind === 'birch' || t.hue > 0.15 ? 1 : 0);
    const yaw = hero ? (isPine ? 0.4 : 2.2) : r() * Math.PI * 2;
    leafTint.set(isPine ? WOOD.pineLeaves : v === 1 ? WOOD.oakLeaves2 : WOOD.oakLeaves).offsetHSL(t.hue * 0.025, (r() - 0.5) * 0.05, (r() - 0.5) * 0.06);
    barkTint.set(isPine ? WOOD.pineBark : WOOD.oakBark).multiplyScalar(0.92 + r() * 0.16);
    lod.add(v, mat(t.x, t.y - 0.05, t.z, yaw, s), barkTint, leafTint);
    ground(t.x, t.z, (isPine ? 2.2 : 3.6) * s, isPine ? 0.45 : 0.55, yaw);
  }
  lod.build(w, true);

  // ---- understory: clustered, with negative space; never in the walking corridor, the cut or in front of clues
  const M = woodMats();
  const ferns = new NearInstances(fernModel(), M.flat);
  const plants = new NearInstances(groundPlantModel(), M.flat);
  const grass = new NearInstances(grassModel(), M.flat, 24, 6);
  // litter, flowers and verge stones are static: batched into the forest chunk (they share the flat and rock
  // materials with the cut, so they add no draw calls)
  const batch = (m: THREE.Material, g: THREE.BufferGeometry, shadow: boolean) => ({ n: 0, add(mm: THREE.Matrix4, col: THREE.ColorRepresentation) { c.b.add(m, g, mm, col, c.chunk, shadow, 0); this.n++; }, get size() { return this.n; }, build() {} });
  const litter = batch(M.flat, litterLeafModel(), false);
  const flowerG = flowerModel(); flowerG.userData.keepColor = true;
  const flowers = batch(M.flat, flowerG, false);
  const stoneG = rockModel(7); stoneG.userData.keepColor = true;
  const stones = batch(M.rock, stoneG, true); // same group as the cut rocks
  const free = (x: number, z: number, corridor = 1.35) => inZone(x, z) && !inCutArea(x, z) && pathDist(x, z) > corridor && Math.hypot(x - SITES.fork.x + 1.3, z - SITES.fork.z + 0.9) > 1.2;
  const treeNear = (x: number, z: number, d: number) => trees.some((t) => Math.hypot(t.x - x, t.z - z) < d);
  // fern clusters at tree feet and in hollows
  for (const [cx, cz] of scatter(r, ZONE.x0, ZONE.x1, 2, ZONE.z1 - 2, 6.5, 900, (x, z) => free(x, z, 2.0))) {
    const n = 2 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - 0.5) * 2.2, z = cz + (r() - 0.5) * 2.2;
      if (!free(x, z, 1.5) || treeNear(x, z, 0.5)) continue;
      ferns.add(mat(x, terrainHeight(x, z) - 0.02, z, r() * 6.3, 0.9 + r() * 0.5), new THREE.Color(WOOD.fern).offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.08));
    }
  }
  // broadleaf ground plants at tree bases (one side), sparse
  for (const t of trees) {
    if (r() > 0.45) continue;
    const a = r() * Math.PI * 2, d = 0.9 + r() * 0.8, x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d;
    if (!free(x, z, 1.6)) continue;
    plants.add(mat(x, terrainHeight(x, z) - 0.02, z, r() * 6.3, 0.9 + r() * 0.6), new THREE.Color(WOOD.plant).offsetHSL(0, 0, (r() - 0.5) * 0.08));
  }
  // grass: the path verge (clumps with gaps), and loose clumps in the lighter openings
  for (const p of FOREST_PATHS) for (let i = 1; i < p.length; i++) {
    const [ax, az] = p[i - 1], [bx, bz] = p[i];
    const seg = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / seg, nz = (bx - ax) / seg;
    for (let t = 0; t < seg; t += 0.55) {
      const x0 = ax + ((bx - ax) * t) / seg, z0 = az + ((bz - az) * t) / seg;
      if (!inZone(x0, z0)) continue;
      for (const side of [-1, 1]) {
        if (Math.sin((x0 + z0) * 0.9 + side * 1.7) + Math.sin((x0 - z0) * 0.37) < -0.35) continue; // gaps along the verge
        const off = 1.05 + r() * 0.9, x = x0 + nx * off * side, z = z0 + nz * off * side;
        if (inCutArea(x, z) || pathDist(x, z) < 0.95) continue;
        grass.add(mat(x, terrainHeight(x, z) - 0.01, z, r() * 6.3, 0.75 + r() * 0.55), new THREE.Color(WOOD.grass).offsetHSL((r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.1));
        if (r() < 0.18) stones.add(mat(x + nx * side * 0.2, terrainHeight(x, z) - 0.06, z + nz * side * 0.2, r() * 6.3, [0.14 + r() * 0.1, 0.1 + r() * 0.06, 0.12 + r() * 0.1]), new THREE.Color(WOOD.rock).multiplyScalar(0.92 + r() * 0.12));
        if (r() < 0.07) for (let f = 0; f < 3; f++) flowers.add(mat(x + (r() - 0.5) * 0.4, terrainHeight(x, z), z + (r() - 0.5) * 0.4, r() * 6.3, 0.9 + r() * 0.4), WOOD.flower);
      }
    }
  }
  for (const [x, z] of scatter(r, ZONE.x0, ZONE.x1, 2, ZONE.z1 - 2, 2.6, 2500, (x, z) => free(x, z, 2.2) && !treeNear(x, z, 1.4))) {
    if (r() < 0.55) grass.add(mat(x, terrainHeight(x, z) - 0.01, z, r() * 6.3, 0.7 + r() * 0.5), new THREE.Color(WOOD.grass).offsetHSL(0, -0.05, (r() - 0.5) * 0.1));
  }
  // leaf litter under the oaks and drifting onto the path edges
  for (const t of trees) {
    if (t.kind === 'pine') continue;
    for (let i = 0; i < 22; i++) {
      const a = r() * Math.PI * 2, d = 0.5 + Math.sqrt(r()) * 3.2, x = t.x + Math.cos(a) * d, z = t.z + Math.sin(a) * d;
      if (!inZone(x, z) || inCutArea(x, z) || pathDist(x, z) < 0.55) continue;
      litter.add(mat(x, terrainHeight(x, z) + 0.012, z, r() * 6.3, 0.8 + r() * 0.7), WOOD.litter[Math.floor(r() * 4)]);
    }
  }
  // a few flower drifts in sunny openings
  for (const [x, z] of scatter(r, ZONE.x0 + 4, ZONE.x1 - 4, 3, 30, 9, 300, (x, z) => free(x, z, 1.8) && !treeNear(x, z, 2.5))) {
    for (let i = 0; i < 7; i++) { const fx = x + (r() - 0.5) * 1.4, fz = z + (r() - 0.5) * 1.4; flowers.add(mat(fx, terrainHeight(fx, fz), fz, r() * 6.3, 0.8 + r() * 0.5), WOOD.flower); }
  }
  for (const s of [ferns, plants, grass]) s.build(w);
  return { lod, counts: { ferns: ferns.size, plants: plants.size, grass: grass.size, litter: litter.size, flowers: flowers.size, stones: stones.size } };
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
 * Headwall and portal, embedded: a rubble wall of chunky dressed stones on a dark mortar backing, set between
 * two rock masses that come out of the hill, with irregular capping stones and turf over the top; a heavy oak
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
  // dark mortar backing (also what shows in the joints)
  for (const [x0, x1, y0, y1] of [[59.4, 62.38, 0, TOP], [63.62, 66.6, 0, TOP], [62.38, 63.62, 2.32, TOP]] as const) {
    const g = projectUV(softBox(x1 - x0, y1 - y0, 0.3, 0.01, 1), 0.8);
    c.b.add(M.rock, g, mat((x0 + x1) / 2, y0 + (y1 - y0) / 2, DZ + 0.08, 0, 1), '#5a5347', c.chunk, true, 0); // face 7 cm behind the stones
    g.dispose();
  }
  // coursed rubble: rows of irregular stones, every joint broken, bigger stones low
  const stone = (x0: number, x1: number, y0: number, y1: number, proud = 0) => {
    const g = bake(projectUV(softBox(x1 - x0 - 0.035, y1 - y0 - 0.035, 0.3 + r() * 0.08, 0.035 + r() * 0.025, 1), 0.7), baseAO(-(y1 - y0) / 2, 0.12, 0.82));
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
      const tall = r() < 0.16 && y + h * 2 < TOP && wdt < 0.6;
      const sh = tall ? h * 1.9 : h * (0.86 + r() * 0.14);
      if (!blocked(x, x + wdt, y, y + sh)) { stone(x, x + wdt, y, y + sh); if (tall) taken.push([x, x + wdt, y + sh]); }
      x += wdt;
    }
    y += h;
  }
  // capping stones along the top, irregular, then turf lumps rolling over from the mound behind
  for (let x = 59.3; x < 66.7;) {
    const wd = 0.45 + r() * 0.35;
    const g = bake(projectUV(softBox(wd, 0.16 + r() * 0.08, 0.6, 0.05, 1), 0.7), () => 0.95);
    c.b.add(M.rock, g, mat(x + wd / 2, TOP + 0.06, DZ + 0.02, (r() - 0.5) * 0.15, 1, 0, (r() - 0.5) * 0.08), new THREE.Color('#9d917a').multiplyScalar(0.9 + r() * 0.15), c.chunk, true, 0);
    g.dispose();
    x += wd - 0.02;
  }
  for (let i = 0; i < 9; i++) {
    const x = 59.6 + i * 0.86 + (r() - 0.5) * 0.3;
    const g = lumpTurf(x, TOP + 0.12, DZ + 0.12, 0.55 + r() * 0.2, i);
    c.b.add(M.flat, g, new THREE.Matrix4(), new THREE.Color(WOOD.grass).multiplyScalar(0.82 + r() * 0.12), c.chunk, false, 0); // same group as the litter
    g.dispose();
  }
  // two rock masses that hold the headwall: out of the hill, overlapping the wall ends
  for (const [x, yaw, i] of [[58.75, 0.35, 0], [67.25, 2.9, 2]] as const) {
    const bb = ROCKS[i].boundingBox!;
    c.b.add(M.rock, ROCKS[i], mat(x, -0.3 - bb.min.y * 2.4, DZ - 0.1, yaw, [1.05, 2.4, 0.95]), new THREE.Color(WOOD.rock).multiplyScalar(0.95), c.chunk, true, 0);
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

