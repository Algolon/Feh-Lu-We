// Scene container + the shared interaction API. Every interactive object registers an Interactable
// with a stable id; the game picks one via reticle/tap raycast and calls its handlers.
import * as THREE from 'three';
import { CollisionWorld, type Collider } from '../player/collision';
import type { GameState, PlayerPose, SceneId } from '../core/state';
import type { Outcome, Sfx } from '../puzzles/rules';

export interface Interactable {
  id: string;
  obj: THREE.Object3D; // root; nested meshes resolve to this id via userData.interactId
  hit: THREE.Object3D[]; // raycast targets (usually invisible hitboxes)
  focus: THREE.Vector3; // world-space point for distance prefilter
  reach: number;
  label: () => string | null; // null → not interactable right now
  run: () => void;
  acceptsItems?: boolean;
  useItem?: (item: string) => void;
  /**
   * Contextual resolver for a held item. Return the label of the item action when using this item here is
   * meaningful (including a deliberate "wrong item" response), or null to fall back to the default action.
   * Without a resolver, accepting targets always route held items to useItem.
   */
  itemLabel?: (item: string) => string | null;
  ignore?: Set<Collider>; // the target's own colliders (doors) are ignored by the LOS test
}

/** What world builders may use from the running game. Kept small to avoid tight coupling. */
export interface GameApi {
  readonly state: GameState;
  readonly selected: string | null;
  act(o: Outcome, opts?: { save?: boolean }): void;
  sfx(name: Sfx | 'door' | 'drawer' | 'switch' | 'water' | 'steam'): void;
  toast(msg: string): void;
  changed(): void; // state mutated → resync + save
  inspect(clueId: string, extra?: { title?: string; text?: string }): void;
  openPanel(kind: string, data?: Record<string, unknown>): void;
  playerXZ(): { x: number; z: number; y: number };
  playerRadius: number;
  readonly reducedMotion: boolean;
  leaveHome(): void;
  finish(): void;
}

export interface LampSource {
  id: string;
  pos: THREE.Vector3; // three.js world position
  color: THREE.ColorRepresentation;
  intensity: number;
  distance: number;
  on: () => boolean;
  flicker?: number;
}

export interface Checkpoint { name: string; pose: PlayerPose }

export class World {
  readonly scene = new THREE.Scene();
  readonly col = new CollisionWorld();
  readonly items: Interactable[] = [];
  readonly byId = new Map<string, Interactable>();
  readonly updaters: ((dt: number, t: number) => void)[] = [];
  readonly syncers: (() => void)[] = [];
  readonly lamps: LampSource[] = [];
  readonly checkpoints: Checkpoint[] = [];
  readonly ownMaterials: THREE.Material[] = [];
  readonly ownTextures: THREE.Texture[] = [];
  spawn: PlayerPose = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
  /** Reduced-motion: procedural animation (fire, steam, water, flicker) holds a still, informative pose. */
  reducedMotion = false;
  ambience: 'home' | 'estate' = 'estate';
  /** Named sound emitters (fire crackle, water, heater) — audio reads these each frame. */
  readonly emitters: { kind: 'fire' | 'water' | 'steam'; pos: THREE.Vector3; on: () => boolean }[] = [];
  /** Small objects hidden beyond a size-dependent distance; whole interior chunks hidden by zone. */
  private cullables: { root: THREE.Object3D; meshes: THREE.Object3D[]; pos: THREE.Vector3; dist2: number; on: boolean; zone: { on: boolean } | null }[] = [];
  private zones: { meshes: THREE.Object3D[]; near: (x: number, z: number) => boolean; inside: (x: number, z: number) => boolean; on: boolean }[] = [];
  constructor(public readonly id: SceneId) {}

  /** Register every non-static top-level object for distance culling. Call once after building. */
  setupCulling() {
    const box = new THREE.Box3(), sph = new THREE.Sphere();
    for (const o of this.scene.children) {
      if (o.userData.static || o.userData.noCull || (o as THREE.InstancedMesh).isInstancedMesh || (o as THREE.Light).isLight || !o.visible && !o.children.length) continue;
      if ((o as THREE.Mesh).isMesh && (o as THREE.Mesh).frustumCulled === false) continue;
      const meshes: THREE.Object3D[] = [];
      o.traverse((c) => { if ((c as THREE.Mesh).isMesh && !c.userData.hit) meshes.push(c); });
      if (!meshes.length) continue;
      o.updateWorldMatrix(true, true);
      box.setFromObject(o, false);
      if (box.isEmpty()) continue;
      box.getBoundingSphere(sph);
      const d = Math.max(o.userData.cullDist ?? 0, 16 + 25 * sph.radius);
      const zone = this.zones.find((zz) => zz.inside(sph.center.x, -sph.center.z)) ?? null;
      this.cullables.push({ root: o, meshes, pos: sph.center.clone(), dist2: d * d, on: true, zone });
    }
  }
  /** Hide the meshes of a batched chunk unless `near(planX, planZ)` holds. */
  cullZone(chunk: string, near: (x: number, z: number) => boolean, inside: (x: number, z: number) => boolean) {
    const meshes = this.scene.children.filter((o) => o.userData.chunk === chunk);
    this.zones.push({ meshes, near, inside, on: true });
  }
  /** Top-level objects whose render meshes are currently culled: never pickable (explicit invariant). */
  readonly culledRoots = new Set<THREE.Object3D>();
  isCulled(o: THREE.Object3D) {
    let p: THREE.Object3D = o;
    while (p.parent && p.parent !== this.scene) p = p.parent;
    return this.culledRoots.has(p);
  }
  updateCulling(eye: THREE.Vector3) {
    for (const z of this.zones) {
      const on = z.near(eye.x, -eye.z);
      if (on !== z.on) { z.on = on; for (const m of z.meshes) m.visible = on; }
    }
    for (const c of this.cullables) {
      const on = (!c.zone || c.zone.on) && c.pos.distanceToSquared(eye) < c.dist2;
      if (on !== c.on) {
        c.on = on;
        for (const m of c.meshes) m.visible = on;
        if (on) this.culledRoots.delete(c.root); else this.culledRoots.add(c.root);
      }
    }
  }

  add(i: Interactable) {
    if (this.byId.has(i.id)) throw new Error(`Duplicate interactable id ${i.id}`);
    i.obj.userData.interactId = i.id;
    for (const h of i.hit) h.userData.interactId = i.id;
    this.items.push(i);
    this.byId.set(i.id, i);
  }

  onUpdate(fn: (dt: number, t: number) => void) {
    this.updaters.push(fn);
  }
  onSync(fn: () => void) {
    this.syncers.push(fn);
  }
  syncAll() {
    for (const s of this.syncers) s();
  }
  update(dt: number, t: number) {
    for (const u of this.updaters) u(dt, t);
  }
  material<T extends THREE.Material>(m: T): T {
    this.ownMaterials.push(m);
    return m;
  }
  texture<T extends THREE.Texture>(t: T): T {
    this.ownTextures.push(t);
    return t;
  }

  /** Free GPU resources of this scene. Shared kit materials/textures are kept for the next scene. */
  dispose() {
    const seen = new Set<THREE.BufferGeometry>();
    this.scene.traverse((o) => {
      const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
      if (g && !seen.has(g) && !g.userData.shared) g.dispose();
      if (g) seen.add(g);
    });
    for (const m of this.ownMaterials) m.dispose();
    for (const t of this.ownTextures) t.dispose();
    this.scene.clear();
    this.updaters.length = 0;
    this.syncers.length = 0;
  }
}

/** A small, fixed pool of point lights assigned to the nearest lit lamps (avoids shader recompiles). */
export class LightPool {
  readonly lights: THREE.PointLight[] = [];
  private timer = 0;
  private assigned: (LampSource | null)[] = [];
  reducedMotion = false;
  constructor(scene: THREE.Scene, count: number) {
    for (let i = 0; i < count; i++) {
      const l = new THREE.PointLight(0xffc77a, 0, 8, 1.6);
      l.castShadow = false;
      scene.add(l);
      this.lights.push(l);
      this.assigned.push(null);
    }
  }
  update(dt: number, t: number, lamps: LampSource[], eye: THREE.Vector3) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.3;
      const on = lamps.filter((l) => l.on());
      on.sort((a, b) => a.pos.distanceToSquared(eye) - b.pos.distanceToSquared(eye));
      for (let i = 0; i < this.lights.length; i++) this.assigned[i] = on[i] ?? null;
    }
    for (let i = 0; i < this.lights.length; i++) {
      const l = this.lights[i];
      const a = this.assigned[i];
      if (!a || !a.on()) {
        l.intensity = Math.max(0, l.intensity - dt * 8);
        continue;
      }
      if (l.position.distanceToSquared(a.pos) > 0.01) {
        l.position.copy(a.pos);
        l.color.set(a.color);
        l.distance = a.distance;
        l.intensity = 0;
      }
      const f = a.flicker && !this.reducedMotion ? 1 - a.flicker * (0.5 + 0.5 * Math.sin(t * 13.1 + i) * Math.sin(t * 7.3)) : 1;
      const target = a.intensity * f;
      l.intensity += (target - l.intensity) * Math.min(1, dt * 10);
    }
  }
}
