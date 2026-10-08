// Instanced vegetation for the BOSLUST sample, with two rendering paths behind one small interface:
//
// - multi-draw (WEBGL_multi_draw available): one three.js BatchedMesh holds every geometry (species × variant × LOD)
//   and draws all visible instances in ONE call. three.js culls each instance against the view (and the shadow
//   camera) itself.
// - instanced fallback (no WEBGL_multi_draw, or ?multidraw=0): one InstancedMesh per geometry. Each frame in which
//   the camera or an instance changed, the instances are culled against the view here and the visible ones are
//   packed to the front of that mesh's instance buffer; a buffer is uploaded only when its visible set changed.
//   One call per geometry that has something visible. With shadow maps on, an instance is also kept when its
//   shadow can reach the view. (three.js's own BatchedMesh fallback would instead issue one call per visible
//   INSTANCE, i.e. hundreds; measured in EXTERIOR_SAMPLE.md.)
//
// Both paths use the same geometries, material, vertex colours, instance colours and matrices, so they render the
// same image; the owner (TreeBatches, PlantBatch) only sets geometry, visibility and matrix per instance.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import { CAPS } from '../core/caps';

/**
 * Per-frame hooks with the rendering camera, run from scene.onBeforeRender (before three.js projects the scene).
 * `late` hooks run after all others: culling (late) must see this frame's LOD choices, as three.js's own
 * per-instance culling in the multi-draw path does.
 */
export type FrameHook = (camera: THREE.Camera, renderer: THREE.WebGLRenderer) => void;
export function onFrame(w: World, fn: FrameHook, late = false) {
  const sc = w.scene as THREE.Scene & { userData: { frameHooks?: { early: FrameHook[]; late: FrameHook[] } } };
  if (!sc.userData.frameHooks) {
    const hooks = (sc.userData.frameHooks = { early: [] as FrameHook[], late: [] as FrameHook[] });
    const prev = sc.onBeforeRender;
    sc.onBeforeRender = function (renderer, scene, camera, ...rest) {
      for (const h of hooks.early) h(camera, renderer);
      for (const h of hooks.late) h(camera, renderer);
      prev.call(this, renderer, scene, camera, ...rest);
    };
  }
  sc.userData.frameHooks![late ? 'late' : 'early'].push(fn);
}

export interface VegBatch {
  /** The scene objects drawing this batch (one BatchedMesh, or one InstancedMesh per geometry). */
  readonly objects: THREE.Mesh[];
  addInstance(geo: number, m: THREE.Matrix4, c: THREE.Color): number;
  setGeometryAt(i: number, geo: number): void;
  setVisibleAt(i: number, v: boolean): void;
  setMatrixAt(i: number, m: THREE.Matrix4): void;
}
export interface VegBatchOpts { castShadow?: boolean; sortObjects?: boolean; tag: Record<string, unknown> }

export function makeVegBatch(w: World, geos: THREE.BufferGeometry[], maxInstances: number, material: THREE.Material, o: VegBatchOpts): VegBatch {
  // a BatchedMesh needs all its geometries indexed or all non-indexed (DEV-03 batches mix kit pieces)
  if (geos.some((g) => !g.index) && geos.some((g) => g.index)) for (let i = 0; i < geos.length; i++) if (geos[i].index) { const n = geos[i].toNonIndexed(); geos[i].dispose(); geos[i] = n; }
  return CAPS.multiDraw ? new BatchedVeg(w, geos, maxInstances, material, o) : new InstancedVeg(w, geos, material, o);
}

// ------------------------------------------------------------------------------------------------ multi-draw
class BatchedVeg implements VegBatch {
  readonly objects: THREE.Mesh[];
  private mesh: THREE.BatchedMesh;
  private ids: number[];
  constructor(w: World, geos: THREE.BufferGeometry[], maxInstances: number, material: THREE.Material, o: VegBatchOpts) {
    let verts = 0, idx = 0;
    for (const g of geos) { verts += g.attributes.position.count; idx += g.index ? g.index.count : 0; }
    const mesh = new THREE.BatchedMesh(maxInstances, verts, Math.max(idx, 1), material);
    this.ids = geos.map((g) => mesh.addGeometry(g));
    mesh.frustumCulled = false; // three.js culls per instance inside
    mesh.receiveShadow = true;
    mesh.castShadow = !!o.castShadow;
    if (o.sortObjects === false) mesh.sortObjects = false;
    Object.assign(mesh.userData, { region: 'outdoor', vegPath: 'multi-draw', ...o.tag });
    w.scene.add(mesh);
    this.mesh = mesh;
    this.objects = [mesh];
  }
  addInstance(geo: number, m: THREE.Matrix4, c: THREE.Color) {
    const i = this.mesh.addInstance(this.ids[geo]);
    this.mesh.setMatrixAt(i, m); this.mesh.setColorAt(i, c);
    return i;
  }
  setGeometryAt(i: number, geo: number) { this.mesh.setGeometryIdAt(i, this.ids[geo]); }
  setVisibleAt(i: number, v: boolean) { this.mesh.setVisibleAt(i, v); }
  setMatrixAt(i: number, m: THREE.Matrix4) { this.mesh.setMatrixAt(i, m); }
}

// ------------------------------------------------------------------------------------------------ instanced fallback
interface Inst { geo: number; m: THREE.Matrix4; c: THREE.Color; vis: boolean; centre: THREE.Vector3; radius: number }
interface Group { geo: THREE.BufferGeometry; mesh: THREE.InstancedMesh; drawn: number[]; dirty: boolean }
const frustum = new THREE.Frustum(), projView = new THREE.Matrix4(), sphere = new THREE.Sphere();
const sunDir = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();

class InstancedVeg implements VegBatch {
  readonly objects: THREE.Mesh[] = [];
  private inst: Inst[] = [];
  private groups: Group[];
  private lastView = new THREE.Matrix4();
  private lastProj = new THREE.Matrix4();
  private lastSun = new THREE.Vector3();
  private sun: THREE.DirectionalLight | null = null;
  private changed = true;
  constructor(private w: World, geos: THREE.BufferGeometry[], private material: THREE.Material, private o: VegBatchOpts) {
    for (const g of geos) if (!g.boundingSphere) g.computeBoundingSphere();
    this.groups = geos.map((geo) => ({ geo, mesh: this.makeMesh(geo, 8), drawn: [], dirty: false }));
    onFrame(w, (cam, r) => this.sync(cam, r), true);
  }
  private makeMesh(geo: THREE.BufferGeometry, cap: number) {
    const mesh = new THREE.InstancedMesh(geo, this.material, cap);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.setColorAt(0, new THREE.Color(1, 1, 1)); // creates instanceColor (vertex colours × instance colour, as in the batch)
    mesh.instanceColor!.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0;
    mesh.visible = false;
    mesh.frustumCulled = false; // culled per instance in sync()
    mesh.receiveShadow = true;
    mesh.castShadow = !!this.o.castShadow;
    Object.assign(mesh.userData, { region: 'outdoor', vegPath: 'instanced', ...this.o.tag });
    this.w.scene.add(mesh);
    this.objects.push(mesh);
    return mesh;
  }
  private bound(it: Inst) {
    const s = this.groups[it.geo].geo.boundingSphere!;
    it.centre.copy(s.center).applyMatrix4(it.m);
    it.radius = s.radius * it.m.getMaxScaleOnAxis();
  }
  addInstance(geo: number, m: THREE.Matrix4, c: THREE.Color) {
    const it: Inst = { geo, m: m.clone(), c: c.clone(), vis: true, centre: new THREE.Vector3(), radius: 0 };
    this.bound(it);
    this.inst.push(it);
    this.changed = true;
    return this.inst.length - 1;
  }
  setGeometryAt(i: number, geo: number) {
    const it = this.inst[i];
    if (it.geo === geo) return;
    it.geo = geo; this.bound(it); this.changed = true;
  }
  setVisibleAt(i: number, v: boolean) { const it = this.inst[i]; if (it.vis !== v) { it.vis = v; this.changed = true; } }
  setMatrixAt(i: number, m: THREE.Matrix4) {
    const it = this.inst[i];
    it.m.copy(m); this.bound(it); this.changed = true;
    if (it.vis) this.groups[it.geo].dirty = true; // its slot must be rewritten even if the visible set is unchanged
  }
  /** The shadow-casting sun, if shadows are on and this batch casts (found once, then cached). */
  private shadowSun(renderer: THREE.WebGLRenderer) {
    if (!this.o.castShadow || !renderer.shadowMap.enabled) return null;
    if (!this.sun?.parent) { this.sun = null; this.w.scene.traverse((o) => { if (!this.sun && (o as THREE.DirectionalLight).isDirectionalLight && o.castShadow) this.sun = o as THREE.DirectionalLight; }); }
    return this.sun?.castShadow ? this.sun : null;
  }
  /**
   * Cull and pack. Runs only when the view, the sun direction or an instance changed. With shadow maps on, a
   * casting instance is kept if its SHADOW can reach the view: its bounding sphere swept along the sun direction
   * down to the ground (one conservative sphere round the sweep). One instance list serves both passes, so this
   * draws a superset of what multi-draw draws per camera, never less.
   */
  private sync(camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    const sun = this.shadowSun(renderer);
    if (sun) sunDir.copy(tmpA.setFromMatrixPosition(sun.target.matrixWorld)).sub(tmpB.setFromMatrixPosition(sun.matrixWorld)).normalize();
    const sunChanged = !!sun && sunDir.distanceTo(this.lastSun) > 0.01;
    const viewChanged = !this.lastView.equals(camera.matrixWorldInverse) || !this.lastProj.equals(camera.projectionMatrix);
    if (!viewChanged && !this.changed && !sunChanged) return;
    this.lastView.copy(camera.matrixWorldInverse); this.lastProj.copy(camera.projectionMatrix);
    if (sun) this.lastSun.copy(sunDir);
    this.changed = false;
    frustum.setFromProjectionMatrix(projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const down = sun ? Math.max(0.25, -sunDir.y) : 1;
    const lists: number[][] = this.groups.map(() => []);
    for (let i = 0; i < this.inst.length; i++) {
      const it = this.inst[i];
      if (!it.vis) continue;
      sphere.center.copy(it.centre); sphere.radius = it.radius;
      if (sun) { const L = (2 * it.radius) / down; sphere.center.addScaledVector(sunDir, L / 2); sphere.radius += L / 2; }
      if (!frustum.intersectsSphere(sphere)) continue;
      lists[it.geo].push(i);
    }
    this.groups.forEach((g, gi) => {
      const list = lists[gi];
      if (!g.dirty && list.length === g.drawn.length && list.every((v, k) => v === g.drawn[k])) return; // unchanged
      g.dirty = false;
      g.drawn = list;
      if (list.length > g.mesh.instanceMatrix.count) { // grow (rare: the first frames)
        const old = g.mesh, cap = Math.max(8, 1 << Math.ceil(Math.log2(list.length)));
        old.removeFromParent(); old.dispose(); this.objects.splice(this.objects.indexOf(old), 1);
        g.mesh = this.makeMesh(g.geo, cap);
      }
      const mesh = g.mesh;
      list.forEach((i, k) => { mesh.setMatrixAt(k, this.inst[i].m); if (mesh.instanceColor) mesh.setColorAt(k, this.inst[i].c); });
      mesh.count = list.length;
      mesh.visible = list.length > 0;
      if (list.length) {
        mesh.instanceMatrix.clearUpdateRanges(); mesh.instanceMatrix.addUpdateRange(0, list.length * 16); mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) { mesh.instanceColor.clearUpdateRanges(); mesh.instanceColor.addUpdateRange(0, list.length * 3); mesh.instanceColor.needsUpdate = true; }
      }
    });
  }
}
