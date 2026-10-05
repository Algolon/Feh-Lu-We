// Reusable interactive object factories: hinged doors, sliding drawers, pickups, lamps, inspectables.
// All visual state is derived from GameState inside onSync, so restoring a save just calls syncAll().
import * as THREE from 'three';
import { World, type GameApi } from './world';
import { CollisionWorld, type Box } from '../player/collision';
import { getKit, compound, box, hitbox, v3, type Batcher } from '../world/kit';
import { has } from '../core/state';
import { pickup as pickupRule, unlockWithKey } from '../puzzles/rules';
import { ITEMS } from '../content/items';

const DIRS = { 'x+': [1, 0], 'x-': [-1, 0], 'z+': [0, 1], 'z-': [0, -1] } as const;
export type Dir = keyof typeof DIRS;

export interface DoorOpts {
  id: string;
  x: number; z: number; // hinge (plan)
  dir: Dir; // leaf direction from hinge when closed
  width: number; height: number; y0: number;
  swing: 1 | -1; // +1 = counter-clockwise seen from above
  color?: THREE.ColorRepresentation;
  style?: 'panel' | 'plank' | 'glass' | 'gate';
  key?: string; // key item that unlocks (lock id = lock.<id>, or lockId when doors share one lock)
  lockId?: string;
  unlock?: string; // OR a lock id set by a puzzle (no key)
  lockedMsg?: string;
  name?: string;
  thickness?: number;
}

export function makeDoor(w: World, g: GameApi, o: DoorOpts) {
  const k = getKit();
  const [dx, dz] = DIRS[o.dir];
  const base = Math.atan2(dz, dx);
  const pivot = new THREE.Group();
  pivot.position.copy(v3(o.x, o.y0, o.z));
  pivot.rotation.y = base;
  const th = o.thickness ?? 0.07;
  const col = o.color ?? '#7a4f2c';
  const leaf = compound((b: Batcher) => {
    // local leaf frame: built at plan origin, spanning +X; local plan z ≡ thickness
    if (o.style === 'glass') {
      box(b, k.M.paint, '#2f4a3c', o.width / 2, 0, 0, o.width, 0.1, th);
      box(b, k.M.paint, '#2f4a3c', o.width / 2, o.height - 0.1, 0, o.width, 0.1, th);
      box(b, k.M.paint, '#2f4a3c', 0.05, 0, 0, 0.1, o.height, th);
      box(b, k.M.paint, '#2f4a3c', o.width - 0.05, 0, 0, 0.1, o.height, th);
      box(b, k.M.glass, '#ffffff', o.width / 2, 0.1, 0, o.width - 0.2, o.height - 0.2, 0.02);
    } else if (o.style === 'gate') {
      for (let i = 0; i < 6; i++) box(b, k.M.paint, '#2b2b2b', 0.1 + (i * (o.width - 0.2)) / 5, 0, 0, 0.05, o.height, 0.05);
      box(b, k.M.paint, '#2b2b2b', o.width / 2, 0.2, 0, o.width, 0.08, 0.06);
      box(b, k.M.paint, '#2b2b2b', o.width / 2, o.height - 0.25, 0, o.width, 0.08, 0.06);
    } else {
      box(b, k.M.wood, col, o.width / 2, 0, 0, o.width - 0.02, o.height, th, { uv: 1.2 });
      if (o.style !== 'plank') {
        for (const yy of [0.25, o.height * 0.55]) {
          box(b, k.M.paint, new THREE.Color(col).multiplyScalar(0.8), o.width / 2, yy, 0, o.width * 0.7, o.height * 0.33, th + 0.03);
        }
      } else {
        box(b, k.M.paint, '#3b3b3b', o.width / 2, o.height * 0.2, 0, o.width * 0.9, 0.08, th + 0.03);
        box(b, k.M.paint, '#3b3b3b', o.width / 2, o.height * 0.75, 0, o.width * 0.9, 0.08, th + 0.03);
      }
      // handles both sides
      box(b, k.M.paint, '#c9a44c', o.width - 0.12, 1.0, 0, 0.05, 0.05, th + 0.12);
      box(b, k.M.paint, '#c9a44c', o.width - 0.18, 1.0, 0, 0.14, 0.04, th + 0.14);
    }
  });
  // compound() builds in plan space: plan (x, z) → three (x, -z). Leaf spans +X locally, which is what we want.
  pivot.add(leaf);
  const hb = hitbox(leaf, o.width, o.height, Math.max(0.2, th + 0.1), o.width / 2, o.height / 2, 0);
  w.scene.add(pivot);

  const cx = o.x + (dx * o.width) / 2, cz = o.z + (dz * o.width) / 2;
  const sx = dx ? o.width : th + 0.08, sz = dz ? o.width : th + 0.08;
  const collider: Box = w.col.addBoxC(cx, cz, sx, sz, o.y0, o.y0 + o.height, { occludes: true, tag: o.id });
  const lockId = o.key ? o.lockId ?? `lock.${o.id}` : o.unlock;
  let angle = 0, target = 0, first = true;
  const isLocked = () => !!lockId && !g.state.unlocked.includes(lockId);
  const isOpen = () => g.state.open[o.id] === true;

  const setOpen = (open: boolean) => {
    if (!open && playerInLeafPath()) {
      g.toast('Je staat waar de deur dichtzwaait. Doe een stapje opzij.');
      return;
    }
    g.state.open[o.id] = open;
    g.sfx('door');
    g.changed();
  };

  const tryUnlock = (item: string | null) => {
    if (!o.key) {
      g.act({ ok: false, msg: o.lockedMsg ?? 'Deze deur zit op slot.', sfx: 'locked' }, { save: false });
      return;
    }
    const r = unlockWithKey(g.state, lockId!, o.key, item);
    g.act(r);
    if (r.ok) setOpen(true);
  };

  w.add({
    id: o.id,
    obj: pivot,
    hit: [hb],
    focus: v3(cx, o.y0 + 1.2, cz),
    reach: 2.6,
    ignore: new Set([collider]),
    acceptsItems: !!o.key,
    label: () => {
      if (isLocked()) return o.key && has(g.state, o.key) ? 'Ontgrendelen' : 'Op slot';
      return isOpen() ? 'Sluiten' : 'Openen';
    },
    run: () => (isLocked() ? tryUnlock(null) : setOpen(!isOpen())),
    // A held item only matters while the door is locked; once unlocked the door simply opens/closes.
    itemLabel: (item) => (isLocked() ? (item === o.key ? 'Ontgrendelen' : `Gebruik: ${ITEMS[item]?.name ?? item}`) : null),
    useItem: (item) => (isLocked() ? tryUnlock(item) : setOpen(!isOpen())),
  });

  // Visual angle and collision are both derived from the persisted open state. The closed-leaf collider
  // stays solid while the leaf is mostly closed (< ~25°), so collision agrees with what the player sees.
  const OPEN = o.swing * 1.6, SOLID_BELOW = 0.45;
  // Sweep area of the leaf: the square spanned by the closed leaf and the open leaf (swing side).
  const playerInLeafPath = () => {
    const p = g.playerXZ();
    if (!(p.y < o.y0 + o.height && p.y + 1.7 > o.y0)) return false;
    return CollisionWorld.circleHitsBox(p.x, p.z, g.playerRadius + 0.05, sweepBox);
  };
  const [nx, nz] = [-dz * o.swing, dx * o.swing]; // plan normal on the swing side
  const sweepBox: Box = {
    kind: 'box', enabled: true, occludes: false, solid: false,
    minX: Math.min(o.x, o.x + dx * o.width, o.x + nx * o.width) - 0.05, maxX: Math.max(o.x, o.x + dx * o.width, o.x + nx * o.width) + 0.05,
    minZ: Math.min(o.z, o.z + dz * o.width, o.z + nz * o.width) - 0.05, maxZ: Math.max(o.z, o.z + dz * o.width, o.z + nz * o.width) + 0.05,
    minY: o.y0, maxY: o.y0 + o.height,
  };
  const applyCollision = () => { collider.enabled = Math.abs(angle) < SOLID_BELOW; };
  w.onSync(() => {
    target = isOpen() ? OPEN : 0;
    if (first) {
      angle = target;
      pivot.rotation.y = base + angle; // restored doors start at their real angle
      first = false;
    }
    applyCollision();
  });
  w.onUpdate((dt) => {
    if (angle !== target) {
      // a closing leaf waits instead of sweeping through the player
      if (target === 0 && playerInLeafPath()) return;
      const step = dt * 2.6;
      angle = Math.abs(target - angle) < step ? target : angle + Math.sign(target - angle) * step;
      pivot.rotation.y = base + angle;
      applyCollision();
    }
  });
  pivot.rotation.y = base;
  return { pivot, collider, angle: () => angle };
}

export interface DrawerOpts {
  id: string;
  x: number; y: number; z: number; // plan centre of the CLOSED drawer box
  yaw: number; // drawer front faces this plan heading
  w: number; h: number; d: number;
  travel?: number;
  color?: THREE.ColorRepresentation;
  unlock?: string; // lock id that must be in state.unlocked
  onLocked?: () => void; // e.g. open the code panel
  lockedLabel?: string;
}

export function makeDrawer(w: World, g: GameApi, o: DrawerOpts) {
  const k = getKit();
  const outer = new THREE.Group();
  outer.position.copy(v3(o.x, o.y, o.z));
  outer.rotation.y = -o.yaw;
  const slider = new THREE.Group();
  outer.add(slider);
  const col = o.color ?? '#8a5a33';
  const model = compound((b) => {
    // local: front faces three -Z == plan +z
    box(b, k.M.wood, col, 0, -o.h / 2, o.d / 2 - 0.02, o.w - 0.02, o.h - 0.02, 0.04, { uv: 1 }); // front
    box(b, k.M.paint, '#6b4426', 0, -o.h / 2 + 0.01, 0, o.w - 0.1, 0.02, o.d - 0.04); // bottom
    box(b, k.M.paint, '#6b4426', -o.w / 2 + 0.06, -o.h / 2, 0, 0.02, o.h * 0.7, o.d - 0.04);
    box(b, k.M.paint, '#6b4426', o.w / 2 - 0.06, -o.h / 2, 0, 0.02, o.h * 0.7, o.d - 0.04);
    box(b, k.M.paint, '#6b4426', 0, -o.h / 2, -o.d / 2 + 0.03, o.w - 0.1, o.h * 0.7, 0.02);
    box(b, k.M.paint, '#d4b25a', 0, -0.03, o.d / 2 + 0.02, 0.12, 0.05, 0.04); // knob
  }, false);
  slider.add(model);
  // a thin front plate: once open, the things lying inside stay pickable from above
  const hb = hitbox(slider, o.w, o.h + 0.04, 0.1, 0, 0, -o.d / 2);
  w.scene.add(outer);
  const travel = o.travel ?? o.d * 0.75;
  let pos = 0, first = true;
  const isOpen = () => g.state.open[o.id] === true;
  const locked = () => !!o.unlock && !g.state.unlocked.includes(o.unlock);
  w.add({
    id: o.id,
    obj: outer,
    hit: [hb],
    focus: v3(o.x, o.y, o.z),
    reach: 2.4,
    label: () => (locked() ? o.lockedLabel ?? 'Op slot' : isOpen() ? 'Dichtschuiven' : 'Openen'),
    run: () => {
      if (locked()) {
        if (o.onLocked) o.onLocked();
        else g.act({ ok: false, msg: 'De lade zit op slot.', sfx: 'locked' }, { save: false });
        return;
      }
      g.state.open[o.id] = !isOpen();
      g.sfx('drawer');
      g.changed();
    },
  });
  w.onSync(() => {
    if (first) {
      pos = isOpen() ? travel : 0;
      slider.position.z = -pos;
      first = false;
    }
  });
  w.onUpdate((dt) => {
    const t = isOpen() ? travel : 0;
    if (pos !== t) {
      const s = dt * 1.4;
      pos = Math.abs(t - pos) < s ? t : pos + Math.sign(t - pos) * s;
      slider.position.z = -pos;
    }
  });
  return { outer, slider, isOpen };
}

export interface PickupOpts {
  id: string;
  item: string;
  obj: THREE.Object3D; // already placed/parented
  hit?: [number, number, number]; // hitbox size (three local), default 0.35 cube
  hitOffset?: [number, number, number];
  available?: () => boolean; // e.g. drawer open
  label?: string;
  after?: () => void;
}

export function makePickup(w: World, g: GameApi, o: PickupOpts) {
  const s = o.hit ?? [0.35, 0.3, 0.35];
  const off = o.hitOffset ?? [0, s[1] / 2, 0];
  const hb = hitbox(o.obj, s[0], s[1], s[2], off[0], off[1], off[2]);
  const focus = new THREE.Vector3();
  o.obj.updateWorldMatrix(true, false);
  o.obj.getWorldPosition(focus);
  w.add({
    id: o.id,
    obj: o.obj,
    hit: [hb],
    focus,
    reach: 2.5,
    label: () => (g.state.taken.includes(o.id) || (o.available && !o.available()) ? null : o.label ?? `Pakken: ${ITEMS[o.item]?.name ?? o.item}`),
    run: () => {
      if (g.state.taken.includes(o.id)) return;
      g.act(pickupRule(g.state, o.id, o.item));
      o.after?.();
    },
  });
  w.onSync(() => {
    o.obj.visible = !g.state.taken.includes(o.id);
  });
}

export interface LampOpts {
  id: string;
  obj: THREE.Object3D;
  glow: THREE.MeshBasicMaterial[]; // materials to brighten when on
  light: THREE.Vector3; // three.js position of the light source
  color?: THREE.ColorRepresentation;
  intensity?: number;
  distance?: number;
  defaultOn?: boolean;
  hit?: [number, number, number];
  hitOffset?: [number, number, number];
  name?: string;
  toggle?: boolean; // false → not player-operated (driven by puzzles)
  flicker?: number;
  onColor?: THREE.ColorRepresentation;
  flames?: THREE.Object3D; // candle/fire visual shown while on (independent of the light pool)
  patch?: { y: number; r: number; strength?: number }; // painted floor glow under the fixture while on
}

export function makeLamp(w: World, g: GameApi, o: LampOpts) {
  const isOn = () => g.state.lit[o.id] ?? o.defaultOn ?? false;
  o.obj.userData.cullDist = 30; // lit lamps read from further away than plain props
  const onC = new THREE.Color(o.onColor ?? '#ffd27a');
  const offC = new THREE.Color('#5a5046');
  w.lamps.push({ id: o.id, pos: o.light, color: o.color ?? 0xffc77a, intensity: o.intensity ?? 6, distance: o.distance ?? 9, on: isOn, flicker: o.flicker });
  w.onSync(() => {
    for (const m of o.glow) m.color.copy(isOn() ? onC : offC);
    if (o.flames) o.flames.visible = isOn();
  });
  if (o.patch) w.patches.add(o.light.x, o.patch.y, -o.light.z, o.patch.r, o.color ?? '#ffc77a', isOn, o.patch.strength ?? 0.45);
  if (o.toggle === false) return { isOn };
  const s = o.hit ?? [0.5, 0.6, 0.5];
  const off = o.hitOffset ?? [0, s[1] / 2, 0];
  const hb = hitbox(o.obj, s[0], s[1], s[2], off[0], off[1], off[2]);
  w.add({
    id: o.id,
    obj: o.obj,
    hit: [hb],
    focus: o.light.clone(),
    reach: 2.6,
    label: () => (isOn() ? `Uitdoen${o.name ? ': ' + o.name : ''}` : `Aandoen${o.name ? ': ' + o.name : ''}`),
    run: () => {
      g.state.lit[o.id] = !isOn();
      g.sfx('switch');
      g.changed();
    },
  });
  return { isOn };
}

/** Glow material owned by a world (for lamps that change colour). */
export function glowMat(w: World, color: THREE.ColorRepresentation = '#ffd27a') {
  return w.material(new THREE.MeshBasicMaterial({ color }));
}

export interface InspectOpts {
  id: string;
  obj: THREE.Object3D;
  clue?: string;
  hit: [number, number, number];
  hitOffset?: [number, number, number];
  label?: string;
  reach?: number;
  onInspect?: () => boolean | void; // return false → skip default clue overlay
}

export function makeInspect(w: World, g: GameApi, o: InspectOpts) {
  const off = o.hitOffset ?? [0, o.hit[1] / 2, 0];
  const hb = hitbox(o.obj, o.hit[0], o.hit[1], o.hit[2], off[0], off[1], off[2]);
  const focus = new THREE.Vector3();
  o.obj.updateWorldMatrix(true, false);
  hb.updateWorldMatrix(true, false);
  hb.getWorldPosition(focus);
  w.add({
    id: o.id,
    obj: o.obj,
    hit: [hb],
    focus,
    reach: o.reach ?? 2.6,
    label: () => o.label ?? 'Bekijken',
    run: () => {
      const r = o.onInspect?.();
      if (r === false || !o.clue) return;
      g.inspect(o.clue);
    },
  });
}

/** Generic interactable from a placed object. */
export function makeAction(w: World, o: { id: string; obj: THREE.Object3D; hit: [number, number, number]; hitOffset?: [number, number, number]; reach?: number; label: () => string | null; run: () => void; useItem?: (item: string) => void; itemLabel?: (item: string) => string | null }) {
  const off = o.hitOffset ?? [0, o.hit[1] / 2, 0];
  const hb = hitbox(o.obj, o.hit[0], o.hit[1], o.hit[2], off[0], off[1], off[2]);
  const focus = new THREE.Vector3();
  o.obj.updateWorldMatrix(true, false);
  hb.updateWorldMatrix(true, false);
  hb.getWorldPosition(focus);
  w.add({ id: o.id, obj: o.obj, hit: [hb], focus, reach: o.reach ?? 2.6, label: o.label, run: o.run, acceptsItems: !!o.useItem, useItem: o.useItem, itemLabel: o.itemLabel });
}

/** Place an object at plan coords facing plan yaw. */
export function place(obj: THREE.Object3D, x: number, y: number, z: number, yaw = 0) {
  obj.position.copy(v3(x, y, z));
  obj.rotation.y = -yaw;
  return obj;
}

/** Standard resolver for "light it with matches" targets: matches light it; once lit, held items are ignored. */
export function lightableItemLabel(isLit: () => boolean) {
  return (item: string) => (isLit() ? null : item === 'matches' ? 'Aansteken' : `Gebruik: ${ITEMS[item]?.name ?? item}`);
}
