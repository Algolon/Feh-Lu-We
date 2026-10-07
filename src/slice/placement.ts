// DEV-01 as-built slice layout: openings, windows, stair route, walking route, evidence poses and prop footprints.
// One record set: world.ts places the slice props FROM these records, and validatePlacement() checks them against
// keepouts (unit-tested). Plan metres: X east, Z north; y is the floor height of the storey.
//
// Source of the numbers: the CURRENT builders (src/world/manor.ts walls/doors, roomdefs.ts rooms), not LEVEL_LAYOUT
// v0.2 (not in this repository). Openings below mirror the wall() calls that create both the rendered gap and the
// collider gap (arch.ts builds both from the same `openings` list, so render and collision cannot disagree).
import { ROOMS } from '../world/roomdefs';
import { GF, UF } from '../world/layout';

export interface Rect { x0: number; x1: number; z0: number; z1: number }
export interface OpeningRec {
  id: string; rooms: [string, string]; axis: 'x' | 'z'; f: number; at: number; w: number; y: number;
  door?: { id: string; hinge: [number, number]; dir: 'x+' | 'z+'; swing: 1 | -1 };
}
export interface WindowRec { room: string; axis: 'x' | 'z'; f: number; at: number; w: number; y: number; sill: number }
export interface PropRec {
  id: string; room: string; x: number; z: number; y: number;
  w: number; d: number; h: number; // footprint along X (w) and Z (d), height
  kind: 'evidence-surface' | 'staging';
  /** Interactables carried by this surface: offset from the prop centre (plan) and height above its top. */
  parts?: { id: string; dx: number; dz: number }[];
}
export interface PoseRec { id: string; target: string; room: string; x: number; z: number; y: number }

const T_EXT = 0.4, T_PART = 0.16;

// ------------------------------------------------------------------------------------------------ openings on the route
export const OPENINGS: OpeningRec[] = [
  { id: 'front', rooms: ['vestibule', 'out'], axis: 'x', f: 80.2, at: 90, w: 1.7, y: GF, door: { id: 'door.front', hinge: [89.15, 80.2], dir: 'x+', swing: 1 } },
  { id: 'vest-hall', rooms: ['vestibule', 'hall'], axis: 'x', f: 84, at: 90, w: 2.4, y: GF },
  { id: 'hall-living', rooms: ['hall', 'living'], axis: 'z', f: 85, at: 88.5, w: 3.0, y: GF },
  { id: 'hall-lobby', rooms: ['hall', 'lobby'], axis: 'x', f: 98, at: 88.5, w: 4.2, y: GF },
  { id: 'lobby-library', rooms: ['lobby', 'library'], axis: 'z', f: 85, at: 101, w: 1.0, y: GF, door: { id: 'door.library', hinge: [85, 100.5], dir: 'z+', swing: -1 } },
  { id: 'living-library', rooms: ['living', 'library'], axis: 'x', f: 94, at: 79, w: 1.6, y: GF, door: { id: 'door.livLib', hinge: [78.2, 94], dir: 'x+', swing: 1 } },
  { id: 'gallery-reis', rooms: ['frontGallery', 'reis'], axis: 'z', f: 85, at: 82.2, w: 0.95, y: UF, door: { id: 'door.reis', hinge: [85, 81.72], dir: 'z+', swing: -1 } },
  { id: 'walkway-sterren', rooms: ['walkway', 'sterren'], axis: 'z', f: 85, at: 90.2, w: 0.95, y: UF, door: { id: 'door.sterren', hinge: [85, 89.72], dir: 'z+', swing: -1 } },
  { id: 'landing-ucorr', rooms: ['landing', 'ucorr'], axis: 'z', f: 95, at: 97.3, w: 2.0, y: UF },
  { id: 'ucorr-botanic', rooms: ['ucorr', 'botanic'], axis: 'x', f: 96, at: 104.5, w: 0.95, y: UF, door: { id: 'door.botanic', hinge: [104.02, 96], dir: 'x+', swing: -1 } },
];

// ------------------------------------------------------------------------------------------------ windows in slice rooms
const win = (room: string, axis: 'x' | 'z', f: number, ats: number[], w: number, y: number, sill: number) => ats.map((at) => ({ room, axis, f, at, w, y, sill }));
export const WINDOWS: WindowRec[] = [
  ...win('living', 'x', 80.2, [75.5, 79, 82.5], 1.1, GF, 1.05), ...win('living', 'z', 72.2, [83, 90.5], 1.1, GF, 1.05),
  ...win('library', 'z', 72.2, [97, 101, 105], 1.1, GF, 1.05), ...win('library', 'x', 109.8, [75, 78.5, 82], 1.1, GF, 1.05),
  ...win('reis', 'x', 80.2, [75.5, 79, 82.5], 1.0, UF, 0.8), ...win('reis', 'z', 72.2, [82.5], 1.0, UF, 0.8),
  ...win('sterren', 'z', 72.2, [90], 1.0, UF, 0.8),
  ...win('botanic', 'z', 107.8, [83, 87, 91], 1.0, UF, 0.8), ...win('botanic', 'x', 80.2, [105], 1.0, UF, 0.8),
];

// ------------------------------------------------------------------------------------------------ the grand stair
/** Stair flight (ramp) plus the clear foot and head areas. */
export const STAIR = { flight: { x0: 93.05, x1: 94.92, z0: 86.5, z1: 95.5 }, foot: { x0: 93.05, x1: 94.92, z0: 85.2, z1: 86.5 }, head: { x0: 93.05, x1: 94.92, z0: 95.5, z1: 96.8 } };

// ------------------------------------------------------------------------------------------------ the walking route (no teleports)
/** Waypoints of the review route; the e2e suite walks exactly these through real collision. */
export const ROUTE = {
  arrive: [[89.6, 75.5], [89.6, 77.6], [90, 79.0]] as [number, number][], // forecourt → front door (unlock)
  toMantel: [[90, 82], [90, 86], [86.5, 88.5], [83, 89.2], [77.5, 89.2], [75.2, 88.6], [74.6, 86.7]] as [number, number][],
  toConsole: [[75.2, 88.6], [77.5, 89.2], [83, 89.2], [86.5, 88.5], [86.5, 85.5]] as [number, number][],
  toMaquette: [[87.2, 90], [86.75, 95.9]] as [number, number][],
  toLibrary: [[88.5, 97.0], [88.5, 100.2], [86.4, 101]] as [number, number][], // then open door.library
  intoLibrary: [[84.0, 101], [81.85, 101.2]] as [number, number][],
  toAlbum: [[82.2, 102.9], [79.4, 102.9], [78.9, 105.6], [75.75, 106.6]] as [number, number][],
  albumBack: [[78.9, 105.6], [79.4, 102.9], [82.2, 102.9], [81.85, 101.2]] as [number, number][],
  libraryOut: [[84.0, 101], [86.4, 101], [88.5, 100.2], [88.5, 97.0]] as [number, number][],
  upstairs: [[90, 92], [94.0, 85.6], [94.0, 96.3]] as [number, number][], // proven by the iteration-3 walkthrough
  toSterren: [[90, 96.6], [85.95, 96.6], [85.95, 90.2]] as [number, number][], // then open door.sterren
  intoSterren: [[84.0, 90.2], [80.5, 91.9], [79.0, 92.35]] as [number, number][],
  sterrenOut: [[80.5, 91.9], [84.0, 90.2], [85.95, 90.2]] as [number, number][],
  toReis: [[85.95, 84.6], [85.95, 82.2]] as [number, number][], // then open door.reis
  intoReis: [[83.9, 82.2], [80.6, 84.6], [78.6, 85.3]] as [number, number][],
  toRack: [[80.6, 83.6], [82.2, 82.45]] as [number, number][],
  reisOut: [[83.9, 82.2], [85.95, 82.2]] as [number, number][],
  toBotanic: [[85.95, 90.2], [85.95, 96.6], [94.0, 97.3], [98.0, 97.3], [104.5, 97.3]] as [number, number][], // then open door.botanic
  intoBotanic: [[104.5, 94.6], [102.7, 92.0], [102.9, 84.0]] as [number, number][],
  botanicOut: [[102.7, 92.0], [104.5, 94.6], [104.5, 97.3]] as [number, number][],
  downstairs: [[98.0, 97.3], [93.0, 97.3], [94.0, 96.3], [94.0, 85.6], [90, 85.5], [90, 92], [88.5, 97.0]] as [number, number][],
  backToTable: [[88.5, 100.2], [86.4, 101], [84.0, 101], [81.85, 101.2]] as [number, number][],
};

// ------------------------------------------------------------------------------------------------ slice props (footprints)
export const PROPS: PropRec[] = [
  // G02 hall — DS01 A: maquette on a low table against the west wall, north of the living-room arch (away from
  // the console at z 85.5 and the mantel route through the arch at z 87–90)
  { id: 'ds01.maquetteTable', room: 'hall', x: 85.5, z: 95.9, y: GF, w: 0.62, d: 1.1, h: 0.74, kind: 'staging', parts: [{ id: 'ds01.note', dx: 0.06, dz: -0.38 }] },
  // G04 library — B01 table (the iteration-3 reading table, chairs moved to its west side)
  { id: 'b01.tableTop', room: 'library', x: 80.6, z: 101.2, y: GF, w: 1.1, d: 2.2, h: 0.81, kind: 'evidence-surface', parts: [{ id: 'b01.table', dx: 0, dz: 0 }] },
  // G04 library — DS01 B: reading plank in the reading corner, ~7 m from the B01 table
  // (DEV-01R canon: a quiet reading plank — a ledge on two trestles; same footprint as the DEV-01 side table)
  { id: 'ds01.sideTable', room: 'library', x: 74.55, z: 106.6, y: GF, w: 0.7, d: 0.9, h: 0.95, kind: 'evidence-surface', parts: [{ id: 'ds01.album', dx: -0.02, dz: -0.2 }, { id: 'ds01.letter', dx: 0.04, dz: 0.27 }] },
  // U05 — B01 star cluster: table against the north wall under the (plain) wall star chart
  { id: 'b01.sterrenTable', room: 'sterren', x: 79.0, z: 93.45, y: UF, w: 1.0, d: 0.5, h: 0.74, kind: 'evidence-surface', parts: [{ id: 'b01.pair.sterren', dx: -0.18, dz: 0 }, { id: 'b01.clip.sterren', dx: 0.37, dz: 0 }] },
  // U04 — B01 travel cluster: writing desk against the north wall
  { id: 'b01.reisDesk', room: 'reis', x: 78.6, z: 86.4, y: UF, w: 1.1, d: 0.5, h: 0.74, kind: 'evidence-surface', parts: [{ id: 'b01.pair.reizen', dx: -0.2, dz: 0 }, { id: 'b01.clip.reizen', dx: 0.38, dz: 0 }] },
  // U04 — DS01 C: small drying rack in front of the south-east window, near the suitcase bench; ≈5 m from the desk
  { id: 'ds01.rack', room: 'reis', x: 82.2, z: 81.2, y: UF, w: 0.55, d: 0.3, h: 1.0, kind: 'staging', parts: [{ id: 'ds01.photo', dx: 0, dz: 0 }] },
  // U10 — B01 plant cluster: table against the west wall (no windows on that wall)
  { id: 'b01.botanicTable', room: 'botanic', x: 101.75, z: 84.0, y: UF, w: 0.5, d: 1.0, h: 0.74, kind: 'evidence-surface', parts: [{ id: 'b01.pair.planten', dx: 0, dz: -0.18 }, { id: 'b01.clip.planten', dx: 0, dz: 0.37 }] },
];
export const prop = (id: string) => PROPS.find((p) => p.id === id)!;

/** Where the player stands to read each piece of evidence (feet position). e2e walks here and aims. */
export const POSES: PoseRec[] = [
  { id: 'pose.mantel', target: 'inspect.mantel', room: 'living', x: 74.6, z: 86.7, y: GF },
  { id: 'pose.console', target: 'hall.drawer', room: 'hall', x: 86.5, z: 85.5, y: GF },
  { id: 'pose.maquette', target: 'ds01.note', room: 'hall', x: 86.75, z: 95.9, y: GF },
  { id: 'pose.table', target: 'b01.table', room: 'library', x: 81.85, z: 101.2, y: GF },
  { id: 'pose.album', target: 'ds01.album', room: 'library', x: 75.75, z: 106.6, y: GF },
  { id: 'pose.letter', target: 'ds01.letter', room: 'library', x: 75.75, z: 106.6, y: GF },
  { id: 'pose.sterren.pair', target: 'b01.pair.sterren', room: 'sterren', x: 79.0, z: 92.35, y: UF },
  { id: 'pose.sterren.clip', target: 'b01.clip.sterren', room: 'sterren', x: 79.0, z: 92.35, y: UF },
  { id: 'pose.reis.pair', target: 'b01.pair.reizen', room: 'reis', x: 78.6, z: 85.3, y: UF },
  { id: 'pose.reis.clip', target: 'b01.clip.reizen', room: 'reis', x: 78.6, z: 85.3, y: UF },
  { id: 'pose.rack', target: 'ds01.photo', room: 'reis', x: 82.2, z: 82.45, y: UF },
  { id: 'pose.botanic.pair', target: 'b01.pair.planten', room: 'botanic', x: 102.9, z: 84.0, y: UF },
  { id: 'pose.botanic.clip', target: 'b01.clip.planten', room: 'botanic', x: 102.9, z: 84.0, y: UF },
];

// ------------------------------------------------------------------------------------------------ keepouts + validation
export const PLAYER_R = 0.3;
const rectOf = (p: { x: number; z: number; w: number; d: number }): Rect => ({ x0: p.x - p.w / 2, x1: p.x + p.w / 2, z0: p.z - p.d / 2, z1: p.z + p.d / 2 });
export const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
const grow = (r: Rect, m: number): Rect => ({ x0: r.x0 - m, x1: r.x1 + m, z0: r.z0 - m, z1: r.z1 + m });

/** Clear zone on both sides of an opening (doors: + the leaf's swing square). */
export function openingKeepouts(o: OpeningRec): Rect[] {
  const s = o.at - o.w / 2 - 0.1, e = o.at + o.w / 2 + 0.1, depth = o.door ? 0.9 : 0.6;
  const out: Rect[] = [o.axis === 'x' ? { x0: s, x1: e, z0: o.f - depth, z1: o.f + depth } : { x0: o.f - depth, x1: o.f + depth, z0: s, z1: e }];
  if (o.door) {
    const [hx, hz] = o.door.hinge;
    const [dx, dz] = o.door.dir === 'x+' ? [1, 0] : [0, 1];
    const [nx, nz] = [-dz * o.door.swing, dx * o.door.swing];
    const xs = [hx, hx + dx * o.w, hx + nx * o.w], zs = [hz, hz + dz * o.w, hz + nz * o.w];
    out.push({ x0: Math.min(...xs) - 0.05, x1: Math.max(...xs) + 0.05, z0: Math.min(...zs) - 0.05, z1: Math.max(...zs) + 0.05 });
  }
  return out;
}
/** Nothing may stand in the wall slab at a window, nor block the bottom 0.45 m in front of the glass above the sill. */
export function windowKeepout(wr: WindowRec): Rect {
  const s = wr.at - wr.w / 2, e = wr.at + wr.w / 2, t = 0.25;
  return wr.axis === 'x' ? { x0: s, x1: e, z0: wr.f - t, z1: wr.f + t } : { x0: wr.f - t, x1: wr.f + t, z0: s, z1: e };
}
/** Corridor around each route segment (player diameter + margin), on the floor it belongs to. */
export function routeCorridors(width = 2 * PLAYER_R + 0.2): { y: number; rect: Rect; leg: string }[] {
  const out: { y: number; rect: Rect; leg: string }[] = [];
  const upLegs = new Set(['toSterren', 'intoSterren', 'sterrenOut', 'toReis', 'intoReis', 'toRack', 'reisOut', 'toBotanic', 'intoBotanic', 'botanicOut']);
  for (const [leg, pts] of Object.entries(ROUTE)) {
    if (leg === 'upstairs' || leg === 'downstairs') continue; // the stair itself is covered by STAIR
    const y = upLegs.has(leg) ? UF : GF;
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
      // axis-aligned hull of the segment, sampled so diagonal legs stay narrow
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5));
      for (let k = 0; k <= n; k++) {
        const x = ax + ((bx - ax) * k) / n, z = az + ((bz - az) * k) / n;
        out.push({ y, leg, rect: { x0: x - width / 2, x1: x + width / 2, z0: z - width / 2, z1: z + width / 2 } });
      }
    }
  }
  return out;
}

export interface Violation { prop: string; rule: string; detail: string }
/**
 * Placement contract: every slice prop lies inside its room (clear of the wall slabs, so never through a door or
 * window), clear of door/arch keepouts and swings, window slabs, the stair, the walking route and every evidence pose
 * (except the pose that reads it, which must still be clear of the prop by the player radius).
 */
export function validatePlacement(props = PROPS): Violation[] {
  const v: Violation[] = [];
  const sameFloor = (a: number, b: number) => Math.abs(a - b) < 1;
  for (const p of props) {
    const r = rectOf(p);
    const room = ROOMS.find((q) => q.id === p.room);
    if (!room) { v.push({ prop: p.id, rule: 'room', detail: `unknown room ${p.room}` }); continue; }
    const inset = T_PART / 2 + 0.02;
    const inner = { x0: room.x0 + inset, x1: room.x1 - inset, z0: room.z0 + inset, z1: room.z1 - inset };
    if (r.x0 < inner.x0 || r.x1 > inner.x1 || r.z0 < inner.z0 || r.z1 > inner.z1) v.push({ prop: p.id, rule: 'inside-room', detail: JSON.stringify({ r, inner }) });
    for (const o of OPENINGS) if (sameFloor(o.y, p.y)) for (const k of openingKeepouts(o)) if (overlaps(r, k)) v.push({ prop: p.id, rule: 'opening', detail: o.id });
    for (const wr of WINDOWS) if (sameFloor(wr.y, p.y) && overlaps(r, windowKeepout(wr))) v.push({ prop: p.id, rule: 'window', detail: `${wr.room}@${wr.at}` });
    if (sameFloor(p.y, GF) || sameFloor(p.y, UF)) for (const k of [STAIR.flight, STAIR.foot, STAIR.head]) if (overlaps(r, grow(k, 0.1))) v.push({ prop: p.id, rule: 'stair', detail: '' });
    for (const c of routeCorridors()) if (sameFloor(c.y, p.y) && overlaps(r, c.rect)) v.push({ prop: p.id, rule: 'route', detail: c.leg });
    for (const pose of POSES) {
      if (!sameFloor(pose.y, p.y)) continue;
      const disk = { x0: pose.x - PLAYER_R, x1: pose.x + PLAYER_R, z0: pose.z - PLAYER_R, z1: pose.z + PLAYER_R };
      if (overlaps(r, grow(disk, 0.05))) v.push({ prop: p.id, rule: 'pose', detail: pose.id });
    }
  }
  // the B01 table and the DS01 album must be physically apart (no shared surface, ≥ 3 m)
  const t = prop('b01.tableTop'), a = prop('ds01.sideTable');
  if (Math.hypot(t.x - a.x, t.z - a.z) < 3) v.push({ prop: a.id, rule: 'ds01-apart', detail: 'album too close to the B01 table' });
  const rack = prop('ds01.rack'), desk = prop('b01.reisDesk');
  if (Math.hypot(rack.x - desk.x, rack.z - desk.z) < 3) v.push({ prop: rack.id, rule: 'ds01-apart', detail: 'drying rack inside the B01 travel cluster' });
  return v;
}
void T_EXT;
