// Scene container + the shared interaction API. Every interactive object registers an Interactable
// with a stable id; the game picks one via reticle/tap raycast and calls its handlers.
import * as THREE from 'three';
import { CollisionWorld, type Collider } from '../player/collision';
import type { GameState, PlayerPose, SceneId } from '../core/state';
import type { Outcome, Sfx } from '../puzzles/rules';
import { type RoomGraph, type LampCandidate, type PortalDef, chooseLamps } from '../world/rooms';
import type { RitualMix } from '../world/wickerRitual';

export interface Interactable {
  id: string;
  obj: THREE.Object3D; // root; nested meshes resolve to this id via userData.interactId
  hit: THREE.Object3D[]; // raycast targets (usually invisible hitboxes)
  focus: THREE.Vector3; // world-space point for distance prefilter
  reach: number;
  label: () => string | null; // null → not interactable right now
  /** `at` = the world-space point the reticle / tap hit on this target (where on the object it was used). */
  run: (at?: THREE.Vector3) => void;
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
  sfx(name: Sfx | 'door' | 'drawer' | 'switch' | 'water' | 'steam' | 'electric-zap' | 'bongHit', gain?: number): void;
  toast(msg: string): void;
  /** Play one handpan stroke at `freq` Hz (`vel` 0–1). False when nothing sounds (audio muted or unavailable). */
  playNote(freq: number, vel?: number): boolean;
  changed(): void; // state mutated → resync + save
  inspect(clueId: string, extra?: { title?: string; text?: string }): void;
  openPanel(kind: string, data?: Record<string, unknown>): void;
  /** Submit the same four-digit BOSLUST draft from the metal knob or accessible panel. */
  tryBoslustCode(digits?: readonly number[]): boolean;
  /** Enter a diegetic, movement-locked camera inspection; no puzzle popup. */
  enterBoslustInspect(): void;
  /** Whether the direct lock inspection currently owns input. */
  readonly isBoslustInspecting: boolean;
  playerXZ(): { x: number; z: number; y: number };
  playerRadius: number;
  readonly reducedMotion: boolean;
  /**
   * DEV-04D W01: hold something that is not an item (the Wickerman's hay bundle) in the held chip. Selecting an item or
   * tapping the chip calls `release`; `null` clears it without calling `release` (the holder put it down itself).
   */
  carry(held: { name: string; icon: string; release: () => void } | null): void;
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
/** A region doorway (plan centre; `n` = the plan direction into the region's room, found on first use). */
interface RegionDoor { door: string; x: number; y: number; z: number; r: number; n?: [number, number] | null }
/** An exterior opening in plan: centre, outward normal, half width, and its height range (world y). */
interface Aperture { x: number; z: number; nx: number; nz: number; half: number; y0: number; y1: number; depth: number }
/** A bounding box in plan coordinates (x east, z north) with its world height range. */
interface PlanBox { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number }

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
  /** DEV-04D W01: the Wickerman ritual's sound (procedural layers + one-shot events), localised by Game.updateAudio. */
  ritual: { pos: THREE.Vector3; mix: () => RitualMix; events: string[] } | null = null;
  /** Small objects hidden beyond a size-dependent distance; whole interior chunks hidden by zone. */
  private cullables: { root: THREE.Object3D; meshes: THREE.Object3D[]; pos: THREE.Vector3; dist2: number; on: boolean; zone: { on: boolean } | null; rooms: string[] | null }[] = [];
  private zones: { meshes: THREE.Object3D[]; near: (x: number, z: number) => boolean; inside: (x: number, z: number) => boolean; on: boolean }[] = [];
  /** Room-based visibility (estate): regions are static chunks that belong to a set of rooms ('out' = outdoors). */
  rooms: RoomGraph | null = null;
  isOpen: (door: string) => boolean = () => false;
  private regions: { meshes: THREE.Object3D[]; rooms: Set<string>; on: boolean; far: number; outFar: number; sph: THREE.Sphere; shade?: boolean; doors?: RegionDoor[]; ext?: PlanBox[] }[] = [];
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
        const cc = (o.userData.cullCentre as THREE.Vector3 | undefined) ?? sph.center; // doors: their closed pose (DEV-04A)
        const r = o.userData.cullCentre ? 0.6 : Math.min(0.6, sph.radius);
        for (const [dx, dz] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) set.add(this.rooms.roomAt(cc.x + dx, cc.y, -cc.z + dz));
        // a sample poking through a wall reads as 'out'; underground and upstairs that is never true
        const centre = this.rooms.roomAt(cc.x, cc.y, -cc.z);
        if (centre !== 'out' && (cc.y < -0.6 || cc.y > 3.3)) set.delete('out');
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
  /**
   * `doors` (DEV-04D D3-b2, opt-in): the region's only doorways. From another room the region is then drawn only while
   * one of them is open and in (a generous cone round) the view with a line of sight, as the outdoors through
   * exteriorDoors: with every door open the graph reaches these rooms from the hall at depth 2-3, behind solid walls.
   */
  roomRegion(chunks: string[], rooms: string[], far = Infinity, outFar = Infinity, doors?: string[]) {
    const meshes = this.scene.children.filter((o) => chunks.includes(o.userData.chunk) || chunks.includes(o.userData.region));
    // bounding sphere of the whole region (for the optional distance limit)
    const box = new THREE.Box3();
    for (const m of meshes) box.expandByObject(m);
    const sph = box.isEmpty() ? new THREE.Sphere() : box.getBoundingSphere(new THREE.Sphere());
    const ds = doors?.flatMap((door) => {
      const it = this.byId.get(door);
      if (!it?.hit[0]) return [];
      it.hit[0].updateWorldMatrix(true, false);
      const v = it.hit[0].getWorldPosition(new THREE.Vector3());
      return [{ door, x: v.x, y: v.y, z: -v.z, r: 0.9 }];
    });
    this.regions.push({ meshes, rooms: new Set(rooms), on: true, far, outFar, sph, doors: ds?.length === doors?.length ? ds : undefined });
  }
  /**
   * PERF-R03-A: an exterior region (plants on or against the house's own walls). From outside it is drawn within `far`,
   * as before. From inside, it is drawn only while an exterior aperture that can show it is in view: an open (or glass)
   * exterior door, or a clear window, that passes the usual view-cone and line-of-sight tests (World.outdoorInView,
   * World.clearWindowInView), with the region's plan footprint inside the wedge the eye sees through that aperture.
   * The wedge is widened by 0.5 m either side and 0.1 m above and below; a window is a tunnel through the wall, only
   * ±0.15 m deep here (the manor walls are 0.4 m thick); all conservative. The glass room counts as outdoors.
   */
  exteriorRegion(chunks: string[], far = Infinity) {
    this.roomRegion(chunks, ['out'], far);
    const r = this.regions[this.regions.length - 1];
    const plan = (b: THREE.Box3): PlanBox => ({ x0: b.min.x, x1: b.max.x, z0: -b.max.z, z1: -b.min.z, y0: b.min.y, y1: b.max.y });
    // a mesh may list the world boxes of its separate parts (userData.visibilityBoxes, e.g. one per climber site; the
    // meshes of one group, one per material, share the same list: each list is used once)
    const lists = new Set<THREE.Box3[]>();
    r.ext = r.meshes.flatMap((m) => {
      const list = m.userData.visibilityBoxes as THREE.Box3[] | undefined;
      if (list) { if (lists.has(list)) return []; lists.add(list); return list.map(plan); }
      const b = new THREE.Box3().expandByObject(m);
      return b.isEmpty() ? [] : [plan(b)];
    });
  }
  /** The exterior apertures in view from inside (plan centre, outward normal, half width); see exteriorRegion. */
  private exteriorApertures(eye: THREE.Vector3, cam: THREE.PerspectiveCamera | undefined, clearWindows: PortalDef[]) {
    const out: Aperture[] = [];
    if (!this.rooms) return out;
    for (const p of clearWindows) {
      const a = p.aperture!, room = this.rooms.get(p.a === 'out' ? p.b : p.a);
      if (!room) continue;
      out.push({ x: a.x, z: a.z, nx: a.axis === 'z' ? Math.sign(a.x - (room.x0 + room.x1) / 2) : 0, nz: a.axis === 'x' ? Math.sign(a.z - (room.z0 + room.z1) / 2) : 0, half: a.width / 2, y0: a.y - a.height / 2, y1: a.y + a.height / 2, depth: 0.15 });
    }
    for (const d of this.exteriorDoors) {
      if (d.door && !d.seeThrough && !this.isOpen(d.door)) continue;
      if (!this.outdoorInView(eye, cam, 26, false, d.door)) continue;
      const p = this.rooms.portals.find((q) => q.door === d.door);
      // the house side of the opening (a glass room's door: the room it leads from)
      const side = p && [p.a, p.b].find((id) => id !== 'out' && !this.rooms!.portals.some((q) => q.kind === 'glass' && (q.a === id || q.b === id)));
      const n = side ? this.doorInward({ door: d.door, x: d.x, y: d.y, z: d.z, r: d.r }, new Set([side])) : null;
      // unknown orientation: every direction (conservative)
      if (!n) { out.push({ x: d.x, z: d.z, nx: 0, nz: 0, half: Infinity, y0: -Infinity, y1: Infinity, depth: 0 }); continue; }
      // a door's height is not recorded: its leaf centre ± 1.5 m (conservative)
      out.push({ x: d.x, z: d.z, nx: -n[0], nz: -n[1], half: d.r, y0: d.y - 1.5, y1: d.y + 1.5, depth: 0 });
    }
    return out;
  }
  /** Can the eye see any of the box through this aperture (the wedge from the eye through its width and height)? */
  private apertureShows(eye: THREE.Vector3, a: Aperture, b: PlanBox) {
    if (a.half === Infinity || (a.nx === 0 && a.nz === 0)) return true;
    const ex = eye.x, ez = -eye.z, tx = -a.nz, tz = a.nx;
    const eu = (ex - a.x) * a.nx + (ez - a.z) * a.nz, ev = (ex - a.x) * tx + (ez - a.z) * tz;
    if (eu > -0.05) return true; // the eye is in the opening (or beyond it)
    let u0 = Infinity, u1 = -Infinity;
    // where the eye's rays to the box corners cross the plane at depth p (the opening's inner and outer faces)
    const across = (p: number) => {
      let lo = Infinity, hi = -Infinity;
      for (const cx of [b.x0, b.x1]) for (const cz of [b.z0, b.z1]) {
        const u = Math.max((cx - a.x) * a.nx + (cz - a.z) * a.nz, p + 0.02), v = (cx - a.x) * tx + (cz - a.z) * tz;
        const vc = ev + ((v - ev) * (p - eu)) / (u - eu);
        if (vc < lo) lo = vc; if (vc > hi) hi = vc;
      }
      return lo <= a.half + 0.5 && hi >= -a.half - 0.5;
    };
    for (const cx of [b.x0, b.x1]) for (const cz of [b.z0, b.z1]) { const u = (cx - a.x) * a.nx + (cz - a.z) * a.nz; if (u > 0) { if (u < u0) u0 = u; if (u > u1) u1 = u; } }
    // behind the opening, or outside its width at either face of the wall
    if (u0 === Infinity || !across(-a.depth) || !across(a.depth)) return false;
    // height: the rays through the opening's bottom and top edges, at the box's nearest and farthest depth beyond it
    let yb = Infinity, yt = -Infinity;
    for (const u of [u0, u1]) { const k = (u - eu) / -eu; yb = Math.min(yb, eye.y + (a.y0 - eye.y) * k); yt = Math.max(yt, eye.y + (a.y1 - eye.y) * k); }
    return yb - 0.1 <= b.y1 && yt + 0.1 >= b.y0;
  }
  /**
   * A region doorway that is open, in the cone round the view and seen through: sight lines from the eye through points
   * of the opening (across its width, at three heights), carried 0.35 m on into the room, must be clear of walls, closed
   * doors and the walkable floors (an upstairs doorway is not seen from the ground floor through the gallery's floor;
   * the hall's open well has none). Without a room graph or a camera the region stays drawn.
   */
  private doorwayInView(eye: THREE.Vector3, cam: THREE.PerspectiveCamera | undefined, doors: RegionDoor[], rooms: Set<string>) {
    if (!cam || !this.rooms) return true;
    const fwd = cam.getWorldDirection(tmpFwd);
    const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect) + THREE.MathUtils.degToRad(32);
    const ex = eye.x, ey = eye.y, ez = -eye.z;
    for (const d of doors) {
      if (!this.isOpen(d.door)) continue;
      tmpTo.set(d.x - eye.x, d.y - eye.y, -d.z - eye.z);
      const dist = tmpTo.length();
      if (dist > d.r && Math.acos(THREE.MathUtils.clamp(tmpTo.dot(fwd) / dist, -1, 1)) - Math.asin(Math.min(1, d.r / dist)) >= half) continue;
      if (d.n === undefined) d.n = this.doorInward(d, rooms);
      if (!d.n || dist < 1.2) return true; // standing in the doorway
      const [nx, nz] = d.n;
      for (const dy of [0, -0.8, 0.8]) for (const s of [0, -0.35, 0.35]) {
        const px = d.x + nz * s, py = d.y + dy, pz = d.z + nx * s; // a point of the opening (its plane through the centre)
        const vx = px - ex, vy = py - ey, vz = pz - ez, inward = vx * nx + vz * nz;
        if (inward <= 0.05) continue; // the eye is not in front of the opening (or looks along it)
        const k = 1 + 0.35 / inward; // just past the wall: the jambs either side must be passed
        const tx = ex + vx * k, ty = ey + vy * k, tz = ez + vz * k;
        if (!this.col.segmentBlocked(ex, ey, ez, tx, ty, tz, this.visualPassThrough) && !this.floorBetween(ex, ey, ez, tx, ty, tz)) return true;
      }
    }
    return false;
  }
  /** The plan direction from a region doorway into its room: the room rectangle's nearest edge (null if unknown). */
  private doorInward(d: RegionDoor, rooms: Set<string>): [number, number] | null {
    const p = this.rooms?.portals.find((q) => q.door === d.door);
    const r = p && this.rooms?.get(rooms.has(p.a) ? p.a : p.b);
    if (!r) return null;
    const edges: [number, [number, number]][] = [[Math.abs(d.x - r.x0), [1, 0]], [Math.abs(d.x - r.x1), [-1, 0]], [Math.abs(d.z - r.z0), [0, 1]], [Math.abs(d.z - r.z1), [0, -1]]];
    edges.sort((a, b) => a[0] - b[0]);
    return edges[0][0] < 0.5 ? edges[0][1] : null;
  }
  /** Does the segment pass through a walkable floor plate (strictly between its ends)? */
  private floorBetween(ax: number, ay: number, az: number, bx: number, by: number, bz: number) {
    for (const f of this.col.floors) {
      if ((ay - f.y) * (by - f.y) >= 0) continue;
      const t = (f.y - ay) / (by - ay), x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (x > f.minX + 0.05 && x < f.maxX - 0.05 && z > f.minZ + 0.05 && z < f.maxZ - 0.05) return true;
    }
    return false;
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
  exteriorDoors: { door: string; x: number; y: number; z: number; r: number; seeThrough?: boolean }[] = [];
  /** Glass still blocks movement and picking; only visibility rays may pass through it. */
  readonly visualPassThrough = new Set<Collider>();
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
  /** WINDOW-R01: both sides of a physically open window, limited by actual aperture, view cone and LOS.
   * The glass collider remains solid for movement and picking; only these visual rays skip it.
   */
  private clearWindowInView(eye: THREE.Vector3, cam: THREE.PerspectiveCamera | undefined, portal: PortalDef, reachable: ReadonlySet<string>) {
    const p = portal.aperture;
    // Do not require the camera to already be INSIDE this window's room: a kitchen
    // window must remain transparent when seen through the dining/kitchen arch.
    // Limit candidates to rooms reachable via OPEN interior portals (no glass/window
    // shortcuts), then retain the aperture cone + physical LOS below.
    const windowRoom = portal.a === 'out' ? portal.b : portal.a;
    if (!cam || !portal.seeThrough || !p || (this.hereRoom !== 'out' && !reachable.has(windowRoom))) return false;
    tmpTo.set(p.x - eye.x, p.y - eye.y, -p.z - eye.z);
    const dist = tmpTo.length();
    if (dist < 0.01 || dist > (this.hereRoom === 'out' ? 25 : 40)) return false;
    const forward = cam.getWorldDirection(tmpFwd);
    const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect) + THREE.MathUtils.degToRad(32);
    const angular = Math.acos(THREE.MathUtils.clamp(tmpTo.dot(forward) / dist, -1, 1));
    if (angular - Math.asin(Math.min(1, Math.hypot(p.width, p.height) / (2 * dist))) > half) return false;
    // Sample the centre and four offsets, and continue past the wall thickness to avoid false positives.
    for (const across of [0, -0.27, 0.27]) for (const up of [0, -0.25, 0.25]) {
      const tx = p.x + (p.axis === 'x' ? across * p.width : 0);
      const tz = p.z + (p.axis === 'z' ? across * p.width : 0);
      const ty = p.y + up * p.height;
      const dx = tx - eye.x, dy = ty - eye.y, dz = tz + eye.z;
      const d = Math.hypot(dx, dy, dz);
      if (d < 0.01) continue;
      const k = 1 + 0.35 / d;
      const endX = eye.x + dx * k, endY = eye.y + dy * k, endZ = -eye.z + dz * k;
      if (!this.col.segmentBlocked(eye.x, eye.y, -eye.z, endX, endY, endZ, this.visualPassThrough)
          && !this.floorBetween(eye.x, eye.y, -eye.z, endX, endY, endZ)) return true;
    }
    return false;
  }
  private outdoorInView(eye: THREE.Vector3, cam?: THREE.PerspectiveCamera, maxDist = Infinity, all = false, onlyDoor?: string) {
    if ((!cam && !all) || !this.exteriorDoors.length) return true;
    const fwd = cam ? cam.getWorldDirection(tmpFwd) : tmpFwd.set(0, 0, -1);
    const half = cam ? Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect) + THREE.MathUtils.degToRad(32) : Math.PI;
    for (const d of this.exteriorDoors) {
      if (onlyDoor && d.door !== onlyDoor) continue;
      if (d.door && !d.seeThrough && !this.isOpen(d.door)) continue; // '' = a glass wall (always see-through)
      tmpTo.set(d.x - eye.x, d.y - eye.y, -d.z - eye.z);
      const dist = tmpTo.length();
      if (dist > maxDist) continue;
      if (this.collectWindows) { // inside: every open doorway in line of sight contributes a window (no early exit)
        let seen = false;
        for (const [ox, oz] of DOOR_SAMPLES) if (!this.col.segmentBlocked(eye.x, eye.y, -eye.z, d.x + ox, d.y, d.z + oz, this.visualPassThrough)) { seen = true; break; }
        if (seen) {
          const px = d.x - eye.x, pz = d.z + eye.z, pd = Math.hypot(px, pz) || 1;
          this.windowsTmp.push({ x: eye.x, z: -eye.z, dx: px / pd, dz: pz / pd, cos: Math.cos(Math.min(Math.PI / 2, Math.atan2(d.r + 0.6, pd) + 0.12)) });
        }
      }
      if (all) continue; // window collection only (done above)
      const ang = Math.acos(THREE.MathUtils.clamp(tmpTo.dot(fwd) / dist, -1, 1)) - Math.asin(Math.min(1, d.r / dist));
      if (ang >= half) continue;
      // in the cone: is any part of the doorway in line of sight (walls and closed doors occlude)?
      for (const [ox, oz] of DOOR_SAMPLES) if (!this.col.segmentBlocked(eye.x, eye.y, -eye.z, d.x + ox, d.y, d.z + oz, this.visualPassThrough)) return true;
    }
    return false;
  }
  updateCulling(eye: THREE.Vector3, cam?: THREE.PerspectiveCamera) {
    if (this.rooms) {
      this.hereRoom = this.rooms.roomAt(eye.x, eye.y - 0.8, -eye.z);
      // outdoors, an open door shows only the first rooms behind it (windows are opaque panes)
      // Closed glass adds a visual path only if that particular aperture can be seen from outside.
      // Otherwise the global 'out' node would pull the service wing into views behind opaque manor walls.
      // Pass through arches/open doors for sightlines (three hops as for room rendering),
      // but do not use glazing itself to make unrelated rooms reachable.
      const reachable = this.hereRoom === 'out' ? new Set(['out'])
        : this.rooms.visible(this.hereRoom, this.isOpen, 3, () => false, () => false);
      const clearWindows = this.rooms.portals.filter(p => p.kind === 'window' && p.seeThrough && this.clearWindowInView(eye, cam, p, reachable));
      if (this.hereRoom === 'out') {
        // WINDOW-R02: seeing through a window reveals its room, not every adjacent
        // room reached through that room's arches/doors. Otherwise many simultaneous
        // exterior apertures bypass the woodland/mobile culling budget.
        // Keep the previous two-step traversal for genuinely open exterior doors.
        const behindDoors = this.rooms.visible('out', this.isOpen, 2,
          door => this.outdoorInView(eye, cam, 22, false, door), () => false);
        this.visibleRooms = behindDoors;
        for (const p of clearWindows) this.visibleRooms.add(p.a === 'out' ? p.b : p.a);
      } else {
        this.visibleRooms = this.rooms.visible(this.hereRoom, this.isOpen, 3,
          undefined, p => clearWindows.includes(p));
      }
      // the outdoors and the glass Copacabana Room (whose walls show the outdoors) count as one view: from inside the
      // house they are drawn only while an open doorway to them is in (a generous cone round) the view
      if (this.hereRoom !== 'out' && this.hereRoom !== 'cons' && (this.visibleRooms.has('out') || this.visibleRooms.has('cons')) && !this.outdoorInView(eye, cam, 26) && !clearWindows.length) {
        this.visibleRooms.delete('out'); this.visibleRooms.delete('cons');
      }
      // portal windows for the woodland (inside, outdoors visible, not in the glass room or next to it)
      let wins: typeof this.outdoorWindows = null;
      if (this.hereRoom !== 'out' && this.hereRoom !== 'cons' && this.visibleRooms.has('out') && !this.rooms.visible(this.hereRoom, this.isOpen, 1).has('cons')) {
        this.windowsTmp = []; this.collectWindows = true;
        this.outdoorInView(eye, undefined, 60, true);
        this.collectWindows = false;
        // Pass the actual glazing cone to woodland LOD instead of drawing all trees behind the manor.
        for (const portal of clearWindows) {
          const p = portal.aperture!;
          const dx = p.x - eye.x, dz = p.z + eye.z, d = Math.hypot(dx, dz) || 1;
          this.windowsTmp.push({ x: eye.x, z: -eye.z, dx: dx / d, dz: dz / d,
            cos: Math.cos(Math.min(Math.PI / 2, Math.atan2(p.width / 2 + 0.6, d) + 0.12)) });
        }
        wins = this.windowsTmp.length ? this.windowsTmp : null;
      }
      const key = wins ? wins.map((q) => `${q.dx.toFixed(2)},${q.dz.toFixed(2)},${q.cos.toFixed(2)}`).join('|') : '';
      if (key !== this.windowsKey) { this.windowsKey = key; this.outdoorWindows = wins; this.outdoorWindowsVersion++; }
      // from outside, interiors are drawn only through an open doorway within 22 m in (the cone round) the view
      this.interiorThroughDoor = this.hereRoom !== 'out' || this.outdoorInView(eye, cam, 22) || clearWindows.length > 0;
      let apertures: ReturnType<World['exteriorApertures']> | null = null;
      for (const r of this.regions) {
        let on = false;
        if (r.ext) { // PERF-R03-A: exterior region (exteriorRegion)
          const boxes = r.ext;
          on = this.hereRoom === 'out' || this.hereRoom === 'cons' || (apertures ??= this.exteriorApertures(eye, cam, clearWindows)).some((a) => boxes.some((b) => this.apertureShows(eye, a, b)));
        } else for (const id of r.rooms) if (this.visibleRooms.has(id)) { on = true; break; }
        // PERF-R02 integration (WINDOW-R02): a doorway region seen through one of its own clear windows is drawn
        // whatever its doorways show (the doorway rule only removes rooms that are behind solid walls)
        if (on && r.doors && !r.rooms.has(this.hereRoom) && !clearWindows.some((p) => r.rooms.has(p.a === 'out' ? p.b : p.a))) on = this.doorwayInView(eye, cam, r.doors, r.rooms);
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
    this.visualPassThrough.clear();
  }
}

/** Legacy view data accepted by LightPool callers but no longer used for ranking (LIGHT-R04). */
export interface LightView { dir: THREE.Vector3; cosHalf: number; blocked: (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => boolean }

/**
 * A small, fixed pool of point lights (no shader recompiles). Logical lamp state and the emissive fixture never depend
 * on this: losing a pooled light only fades its illumination, the source stays visibly lit.
 *
 * LIGHT-R04: eligibility follows up to six open or optically transparent portals,
 * independent of camera culling. Selection is based on metric distance, source strength and
 * incumbent hysteresis ONLY. Gaze/dwell must never reassign a point-light slot: the player
 * can look around a stationary room without the walls brightening after two seconds.
 * Closed opaque doors still block reachability; moving far enough can transfer a slot
 * using the existing fade-out/fade-in. Fixtures stay emissive independently of the pool.
 * No extra shader light slots are created.

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
  // There is intentionally no gaze/dwell priority. Direction changes must not alter lighting.
  update(dt: number, t: number, lamps: LampSource[], eye: THREE.Vector3, rooms?: RoomGraph, isOpen: (door: string) => boolean = () => true, _view?: LightView, _visibleRooms?: ReadonlySet<string>) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.25;
      const roomOf = (l: LampSource) => {
        let r = this.roomCache.get(l);
        if (r === undefined) { r = l.room ?? (rooms ? rooms.roomAt(l.pos.x, l.pos.y, -l.pos.z) : 'out'); this.roomCache.set(l, r); }
        return r;
      };
      this.here = rooms ? rooms.roomAt(eye.x, eye.y - 0.8, -eye.z) : 'out';
      // Dynamic point-light assignment must NEVER be gated by camera culling:
      // camera cones, exterior-window LOS and room culling change discretely at
      // specific distances / door thresholds. They are valid for rendering geometry
      // but produce unmistakable illumination pops when applied to light candidates.
      //
      // Use only physical *open* portal connectivity over six steps, independent
      // of where the camera looks. The pool already ranks by metric distance,
      // so expanding this inexpensive graph does not add point lights or draw calls.
      // Keep the one-way outdoor/window relevance used for outdoor practicals.
      const rel = rooms ? rooms.relevant(this.here, isOpen) : null;
      // Closed clear-glass doors also conduct visible light; opaque closed doors
      // do not. Window apertures are kept out of graph reachability.
      const stableRooms = rooms ? rooms.visible(this.here, isOpen, 6, () => true, () => false) : null;
      const byId = new Map<string, LampSource>();
      const cands: LampCandidate[] = [];
      for (const l of lamps) {
        if (!l.on()) continue;
        const room = roomOf(l);
        if (stableRooms && !stableRooms.has(room) && !(rel && rel.has(room))) continue;
        const d = l.pos.distanceTo(eye);
        // A stationary viewpoint has a stationary lamp ranking, regardless of
        // whether the fixture is inside the camera cone or how long it is watched.
        const w = 0.2 * l.intensity;
        byId.set(l.id, l);
        cands.push({ id: l.id, room, d, w });
      }
      // Do not use a room-identity or gaze preference: these change discretely
      // at door thresholds and during camera rotation. Rank by physical distance
      // with held-source hysteresis instead.
      this.want = chooseLamps(cands, this.here, this.want, this.lights.length, 2.3, 0);
      this.lookup = byId;
    }
    for (let i = 0; i < this.lights.length; i++) {
      const l = this.lights[i];
      const target = this.want[i] ? this.lookup.get(this.want[i]!) ?? null : null;
      const cur = this.shown[i];
      if (cur !== target) {
        // fade the old source out before the light moves: no pop when a slot changes hands
        // A fixed 20 units/s fade was still visibly abrupt for weak sources
        // (and left distant lamps dark until the viewer crossed a boundary).
        // Ease every source over roughly a second regardless of its brightness.
        const fadeRate = Math.max(3.5, (cur?.intensity ?? 4) * this.gain * 0.95);
        l.intensity = Math.max(0, l.intensity - dt * fadeRate);
        if (l.intensity > 0.05 && cur) continue;
        this.shown[i] = target;
        if (target) { l.position.copy(target.pos); l.color.set(target.color); l.distance = target.distance; }
        l.intensity = 0;
        continue;
      }
      if (!cur || !cur.on()) { l.intensity = Math.max(0, l.intensity - dt * Math.max(3.5, (cur?.intensity ?? 4) * this.gain * 0.95)); continue; }
      const f = cur.flicker && !this.reducedMotion ? 1 - cur.flicker * (0.5 + 0.5 * Math.sin(t * 13.1 + i) * Math.sin(t * 7.3)) : 1;
      l.intensity += (cur.intensity * f * this.gain - l.intensity) * (1 - Math.exp(-dt * 2.0));
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
