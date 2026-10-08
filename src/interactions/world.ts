// Scene container + the shared interaction API. Every interactive object registers an Interactable
// with a stable id; the game picks one via reticle/tap raycast and calls its handlers.
import * as THREE from 'three';
import { CollisionWorld, type Collider } from '../player/collision';
import type { GameState, PlayerPose, SceneId } from '../core/state';
import type { Outcome, Sfx } from '../puzzles/rules';
import { type RoomGraph, type LampCandidate, chooseLamps } from '../world/rooms';

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
  room?: string; // explicit room (otherwise derived from the position)
}

export interface Checkpoint { name: string; pose: PlayerPose }

const tmpFwd = new THREE.Vector3(), tmpTo = new THREE.Vector3();
const DOOR_SAMPLES: [number, number][] = [[0, 0], [0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7]];

export class World {
  readonly scene = new THREE.Scene();
  readonly col = new CollisionWorld();
  readonly items: Interactable[] = [];
  readonly byId = new Map<string, Interactable>();
  readonly updaters: ((dt: number, t: number) => void)[] = [];
  readonly syncers: (() => void)[] = [];
  readonly lamps: LampSource[] = [];
  readonly checkpoints: Checkpoint[] = [];
  readonly patches = new LightPatches();
  readonly ownMaterials: THREE.Material[] = [];
  readonly ownTextures: THREE.Texture[] = [];
  spawn: PlayerPose = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
  /** Reduced-motion: procedural animation (fire, steam, water, flicker) holds a still, informative pose. */
  reducedMotion = false;
  ambience: 'home' | 'estate' = 'estate';
  /** Named sound emitters (fire crackle, water, heater) — audio reads these each frame. */
  readonly emitters: { kind: 'fire' | 'water' | 'steam'; pos: THREE.Vector3; on: () => boolean }[] = [];
  /** Small objects hidden beyond a size-dependent distance; whole interior chunks hidden by zone. */
  private cullables: { root: THREE.Object3D; meshes: THREE.Object3D[]; pos: THREE.Vector3; dist2: number; on: boolean; zone: { on: boolean } | null; rooms: string[] | null }[] = [];
  private zones: { meshes: THREE.Object3D[]; near: (x: number, z: number) => boolean; inside: (x: number, z: number) => boolean; on: boolean }[] = [];
  /** Room-based visibility (estate): regions are static chunks that belong to a set of rooms ('out' = outdoors). */
  rooms: RoomGraph | null = null;
  isOpen: (door: string) => boolean = () => false;
  private regions: { meshes: THREE.Object3D[]; rooms: Set<string>; on: boolean; far: number; outFar: number; sph: THREE.Sphere; shade?: boolean }[] = [];
  visibleRooms = new Set<string>(['out']);
  hereRoom = 'out';
  constructor(public readonly id: SceneId) {}

  /** Register every non-static top-level object for distance (and room) culling. Call once after building. */
  setupCulling() {
    const box = new THREE.Box3(), sph = new THREE.Sphere();
    for (const o of this.scene.children) {
      const im = o as THREE.InstancedMesh;
      if (!im.isInstancedMesh || !o.userData.veg) continue;
      if (!im.boundingSphere) im.computeBoundingSphere();
      this.veg.push({ m: im, c: im.boundingSphere!.center.clone(), r: im.boundingSphere!.radius, lod: o.userData.veg });
    }
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
      let rooms: string[] | null = null;
      const probe = o.userData.roomProbe as { x: number; y: number; z: number } | undefined;
      if (this.rooms && Array.isArray(o.userData.rooms)) rooms = o.userData.rooms as string[]; // authored set (exterior skins: 'out' + the room)
      else if (this.rooms && o.userData.room) rooms = [o.userData.room]; // authored room
      else if (this.rooms && probe) rooms = [this.rooms.roomAt(probe.x, probe.y, probe.z)]; // wall-mounted: the room it faces
      else if (this.rooms) {
        // sample around the centre so objects in doorways belong to both rooms
        const set = new Set<string>();
        const r = Math.min(0.6, sph.radius);
        for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) set.add(this.rooms.roomAt(sph.center.x + dx, sph.center.y, -sph.center.z + dz));
        // a sample poking through a wall reads as 'out'; underground and upstairs that is never true
        const centre = this.rooms.roomAt(sph.center.x, sph.center.y, -sph.center.z);
        if (centre !== 'out' && (sph.center.y < -0.6 || sph.center.y > 3.3)) set.delete('out');
        rooms = [...set];
      }
      this.cullables.push({ root: o, meshes, pos: sph.center.clone(), dist2: d * d, on: true, zone, rooms });
    }
  }
  /** Instanced vegetation chunks: distance culling + crown level of detail (see Vegetation.build). */
  private veg: { m: THREE.InstancedMesh; c: THREE.Vector3; r: number; lod: string }[] = [];
  static readonly VEG_FAR = 105;
  static readonly VEG_LOD = 26;
  static readonly VEG_SMALL = 42;
  /** Hide the meshes of a batched chunk unless `near(planX, planZ)` holds. */
  cullZone(chunk: string, near: (x: number, z: number) => boolean, inside: (x: number, z: number) => boolean) {
    const meshes = this.scene.children.filter((o) => o.userData.chunk === chunk);
    this.zones.push({ meshes, near, inside, on: true });
  }
  /** Static chunks (or objects tagged userData.region) shown only while one of `rooms` is visible. */
  /**
   * `outFar` (DEV-03): while the player is OUTSIDE, the region is drawn only within this distance (an interior seen
   * through an open door is a few pixels from 40 m but cost ~100 k triangles from the forest).
   */
  roomRegion(chunks: string[], rooms: string[], far = Infinity, outFar = Infinity) {
    const meshes = this.scene.children.filter((o) => chunks.includes(o.userData.chunk) || chunks.includes(o.userData.region));
    // bounding sphere of the whole region (for the optional distance limit)
    const box = new THREE.Box3();
    for (const m of meshes) box.expandByObject(m);
    const sph = box.isEmpty() ? new THREE.Sphere() : box.getBoundingSphere(new THREE.Sphere());
    this.regions.push({ meshes, rooms: new Set(rooms), on: true, far, outFar, sph });
  }
  /** Top-level objects whose render meshes are currently culled: never pickable (explicit invariant). */
  readonly culledRoots = new Set<THREE.Object3D>();
  isCulled(o: THREE.Object3D) {
    let p: THREE.Object3D = o;
    while (p.parent && p.parent !== this.scene) p = p.parent;
    return this.culledRoots.has(p);
  }
  /**
   * DEV-03: exterior doorways (plan centre of the opening, radius, door id). Inside, when the outdoors is NOT directly
   * adjacent (e.g. living → hall → vestibule → front door), it is drawn only while one of these open doorways lies in a
   * generous cone round the view direction (half the horizontal FOV + 32°; culling runs every 0.12 s, so even a fast
   * turn reaches the doorway only after the outdoors is back). In the
   * living room this saved ~150 k triangles of forest drawn behind solid walls.
   */
  exteriorDoors: { door: string; x: number; y: number; z: number; r: number }[] = [];
  private interiorThroughDoor = true;
  /**
   * DEV-03: while inside with the outdoors visible only through doorways, the plan-angle windows through them (eye
   * position, direction, half-angle). Instanced woodland outside every window is not drawn (TreeBatches): from the
   * lobby the drive is seen through the front door, not the forest to either side of it behind the walls.
   */
  outdoorWindows: { x: number; z: number; dx: number; dz: number; cos: number }[] | null = null;
  outdoorWindowsVersion = 0;
  private collectWindows = false;
  private windowsTmp: { x: number; z: number; dx: number; dz: number; cos: number }[] = [];
  private windowsKey = '';
  private outdoorInView(eye: THREE.Vector3, cam?: THREE.PerspectiveCamera, maxDist = Infinity, all = false) {
    if ((!cam && !all) || !this.exteriorDoors.length) return true;
    const fwd = cam ? cam.getWorldDirection(tmpFwd) : tmpFwd.set(0, 0, -1);
    const half = cam ? Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect) + THREE.MathUtils.degToRad(32) : Math.PI;
    for (const d of this.exteriorDoors) {
      if (d.door && !this.isOpen(d.door)) continue; // '' = a glass wall (always see-through)
      tmpTo.set(d.x - eye.x, d.y - eye.y, -d.z - eye.z);
      const dist = tmpTo.length();
      if (dist > maxDist) continue;
      if (this.collectWindows) { // inside: every open doorway in line of sight contributes a window (no early exit)
        let seen = false;
        for (const [ox, oz] of DOOR_SAMPLES) if (!this.col.segmentBlocked(eye.x, eye.y, -eye.z, d.x + ox, d.y, d.z + oz)) { seen = true; break; }
        if (seen) {
          const px = d.x - eye.x, pz = d.z + eye.z, pd = Math.hypot(px, pz) || 1;
          this.windowsTmp.push({ x: eye.x, z: -eye.z, dx: px / pd, dz: pz / pd, cos: Math.cos(Math.min(Math.PI / 2, Math.atan2(d.r + 0.6, pd) + 0.12)) });
        }
      }
      if (all) continue; // window collection only (done above)
      const ang = Math.acos(THREE.MathUtils.clamp(tmpTo.dot(fwd) / dist, -1, 1)) - Math.asin(Math.min(1, d.r / dist));
      if (ang >= half) continue;
      // in the cone: is any part of the doorway in line of sight (walls and closed doors occlude)?
      for (const [ox, oz] of DOOR_SAMPLES) if (!this.col.segmentBlocked(eye.x, eye.y, -eye.z, d.x + ox, d.y, d.z + oz)) return true;
    }
    return false;
  }
  updateCulling(eye: THREE.Vector3, cam?: THREE.PerspectiveCamera) {
    if (this.rooms) {
      this.hereRoom = this.rooms.roomAt(eye.x, eye.y - 0.8, -eye.z);
      // outdoors, an open door shows only the first rooms behind it (windows are opaque panes)
      this.visibleRooms = this.rooms.visible(this.hereRoom, this.isOpen, this.hereRoom === 'out' ? 2 : 3);
      // the outdoors and the glass Copacabana Room (whose walls show the outdoors) count as one view: from inside the
      // house they are drawn only while an open doorway to them is in (a generous cone round) the view
      if (this.hereRoom !== 'out' && this.hereRoom !== 'cons' && (this.visibleRooms.has('out') || this.visibleRooms.has('cons')) && !this.outdoorInView(eye, cam, 26)) {
        this.visibleRooms.delete('out'); this.visibleRooms.delete('cons');
      }
      // portal windows for the woodland (inside, outdoors visible, not in the glass room or next to it)
      let wins: typeof this.outdoorWindows = null;
      if (this.hereRoom !== 'out' && this.hereRoom !== 'cons' && this.visibleRooms.has('out') && !this.rooms.visible(this.hereRoom, this.isOpen, 1).has('cons')) {
        this.windowsTmp = []; this.collectWindows = true;
        this.outdoorInView(eye, undefined, 60, true);
        this.collectWindows = false;
        wins = this.windowsTmp.length ? this.windowsTmp : null;
      }
      const key = wins ? wins.map((q) => `${q.dx.toFixed(2)},${q.dz.toFixed(2)},${q.cos.toFixed(2)}`).join('|') : '';
      if (key !== this.windowsKey) { this.windowsKey = key; this.outdoorWindows = wins; this.outdoorWindowsVersion++; }
      // from outside, interiors are drawn only through an open doorway within 22 m in (the cone round) the view
      this.interiorThroughDoor = this.hereRoom !== 'out' || this.outdoorInView(eye, cam, 22);
      for (const r of this.regions) {
        let on = false;
        for (const id of r.rooms) if (this.visibleRooms.has(id)) { on = true; break; }
        if (on && r.far < Infinity) on = r.sph.center.distanceTo(eye) - r.sph.radius < r.far;
        if (on && r.outFar < Infinity && this.hereRoom === 'out') on = this.interiorThroughDoor && r.sph.center.distanceTo(eye) - r.sph.radius < r.outFar;
        if (on !== r.on) { r.on = on; for (const m of r.meshes) { m.visible = on; m.userData.regionOff = !on; } }
        // an interior seen from outside (through a doorway) lies under its own roof: it casts no sun shadow worth a
        // second render of its furniture in the shadow pass; inside, its casters are restored
        const shade = this.hereRoom !== 'out' || r.rooms.has('out');
        if (shade !== (r.shade ?? true)) {
          r.shade = shade;
          for (const m of r.meshes) m.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.userData.cast0 ??= o.castShadow; o.castShadow = shade && o.userData.cast0; } });
        }
      }
    }
    for (const v of this.veg) {
      const d = Math.max(0, v.c.distanceTo(eye) - v.r);
      let on = !v.m.userData.regionOff && d < World.VEG_FAR;
      if (on && v.lod === 'small') on = d < World.VEG_SMALL;
      // crown LOD by the chunk's nearest point: chunks the player stands in keep the detailed crowns
      else if (on && v.lod === 'near') on = d < World.VEG_LOD;
      else if (on && v.lod === 'far') on = d >= World.VEG_LOD;
      v.m.visible = on;
    }
    for (const z of this.zones) {
      const on = z.near(eye.x, -eye.z);
      if (on !== z.on) { z.on = on; for (const m of z.meshes) m.visible = on; }
    }
    for (const c of this.cullables) {
      let on = (!c.zone || c.zone.on) && c.pos.distanceToSquared(eye) < c.dist2;
      if (on && c.rooms) on = c.rooms.some((r) => this.visibleRooms.has(r));
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

/**
 * A small, fixed pool of point lights (no shader recompiles). Which lamps get a real light is decided by
 * room/portal relevance (current room + rooms seen through OPEN doors/arches; outdoor lamps through
 * windows), never by view direction. Logical lamp state and the emissive fixture never depend on this:
 * losing a pooled light only fades its illumination, the source stays visibly lit.
 */
export class LightPool {
  readonly lights: THREE.PointLight[] = [];
  private timer = 0;
  private want: (string | null)[] = [];
  private shown: (LampSource | null)[] = [];
  reducedMotion = false;
  here = 'out';
  constructor(scene: THREE.Scene, count: number) {
    for (let i = 0; i < count; i++) {
      const l = new THREE.PointLight(0xffc77a, 0, 8, 1.6);
      l.castShadow = false;
      scene.add(l);
      this.lights.push(l);
      this.want.push(null);
      this.shown.push(null);
    }
  }
  private roomCache = new Map<LampSource, string>();
  /** Global multiplier for fixture light (art-refresh lighting comparison; 1 = original behaviour). */
  gain = 1;
  update(dt: number, t: number, lamps: LampSource[], eye: THREE.Vector3, rooms?: RoomGraph, isOpen: (door: string) => boolean = () => true) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.25;
      const roomOf = (l: LampSource) => {
        let r = this.roomCache.get(l);
        if (r === undefined) { r = l.room ?? (rooms ? rooms.roomAt(l.pos.x, l.pos.y, -l.pos.z) : 'out'); this.roomCache.set(l, r); }
        return r;
      };
      this.here = rooms ? rooms.roomAt(eye.x, eye.y - 0.8, -eye.z) : 'out';
      const rel = rooms ? rooms.relevant(this.here, isOpen) : null;
      const byId = new Map<string, LampSource>();
      const cands: LampCandidate[] = [];
      for (const l of lamps) {
        if (!l.on()) continue;
        const room = roomOf(l);
        if (rel && !rel.has(room)) continue;
        byId.set(l.id, l);
        cands.push({ id: l.id, room, d: l.pos.distanceTo(eye), w: 0.2 * l.intensity });
      }
      this.want = chooseLamps(cands, this.here, this.want, this.lights.length);
      this.lookup = byId;
    }
    for (let i = 0; i < this.lights.length; i++) {
      const l = this.lights[i];
      const target = this.want[i] ? this.lookup.get(this.want[i]!) ?? null : null;
      const cur = this.shown[i];
      if (cur !== target) {
        // fade the old source out before the light moves: no pop when a slot changes hands
        l.intensity = Math.max(0, l.intensity - dt * 30);
        if (l.intensity > 0.05 && cur) continue;
        this.shown[i] = target;
        if (target) { l.position.copy(target.pos); l.color.set(target.color); l.distance = target.distance; }
        l.intensity = 0;
        continue;
      }
      if (!cur || !cur.on()) { l.intensity = Math.max(0, l.intensity - dt * 20); continue; }
      const f = cur.flicker && !this.reducedMotion ? 1 - cur.flicker * (0.5 + 0.5 * Math.sin(t * 13.1 + i) * Math.sin(t * 7.3)) : 1;
      l.intensity += (cur.intensity * f * this.gain - l.intensity) * Math.min(1, dt * 5);
    }
  }
  private lookup = new Map<string, LampSource>();
  /** Lamp ids currently holding a real light (tests/debug). */
  assigned() { return this.shown.map((l) => l?.id ?? null); }
}

/**
 * Cheap painted "light pools" on floors under fixtures (one instanced mesh, additive). They follow the
 * lamp's logical state only, so a room keeps its warm read even when its pooled point light moves away.
 */
export class LightPatches {
  private items: { x: number; y: number; z: number; r: number; color: THREE.Color; on: () => boolean; soft: boolean; aspect: number; yaw: number }[] = [];
  private meshes: { m: THREE.InstancedMesh; items: LightPatches['items'] }[] = [];
  /** `soft` (art sample) uses a wide gaussian falloff instead of the plateau disc; `aspect` stretches it along `yaw`. */
  add(x: number, y: number, z: number, r: number, color: THREE.ColorRepresentation, on: () => boolean, strength = 0.55, o: { soft?: boolean; aspect?: number; yaw?: number } = {}) {
    this.items.push({ x, y, z, r, color: new THREE.Color(color).multiplyScalar(strength), on, soft: !!o.soft, aspect: o.aspect ?? 1, yaw: o.yaw ?? 0 });
  }
  build(w: World) {
    for (const soft of [false, true]) {
      const items = this.items.filter((p) => p.soft === soft);
      if (!items.length) continue;
      const cv = document.createElement('canvas');
      cv.width = cv.height = 64;
      const x = cv.getContext('2d')!;
      if (soft) {
        const img = x.createImageData(64, 64);
        for (let j = 0; j < 64; j++) for (let i = 0; i < 64; i++) {
          const d = Math.hypot((i + 0.5) / 32 - 1, (j + 0.5) / 32 - 1);
          const a = d >= 1 ? 0 : Math.exp(-3.2 * d * d) * (1 - d * d); // gaussian, forced to 0 at the rim
          const k = (j * 64 + i) * 4;
          img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.round(a * 255); img.data[k + 3] = 255;
        }
        x.putImageData(img, 0, 0);
      } else {
        const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      }
      const tex = w.texture(new THREE.CanvasTexture(cv));
      const geo = new THREE.PlaneGeometry(1, 1);
      geo.rotateX(-Math.PI / 2);
      const mat = w.material(new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
      const m = new THREE.InstancedMesh(geo, mat, items.length);
      const mtx = new THREE.Matrix4(), rot = new THREE.Matrix4();
      items.forEach((p, i) => {
        mtx.makeScale(p.r * 2 * p.aspect, 1, p.r * 2);
        if (p.yaw) mtx.premultiply(rot.makeRotationY(-p.yaw));
        m.setMatrixAt(i, mtx.setPosition(p.x, p.y, -p.z));
        m.setColorAt(i, p.color);
      });
      m.computeBoundingSphere();
      m.renderOrder = 1;
      m.userData.noCull = true;
      m.userData.lightPatches = true;
      w.scene.add(m);
      this.meshes.push({ m, items });
    }
    if (this.meshes.length) w.onSync(() => this.sync());
  }
  private black = new THREE.Color(0, 0, 0);
  sync() {
    for (const { m, items } of this.meshes) {
      items.forEach((p, i) => m.setColorAt(i, p.on() ? p.color : this.black));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }
}
