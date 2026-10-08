// DEV-02 estate structural blockout: the spatial source of truth (layout.ts / footprints.ts / terrain.ts / roomdefs.ts)
// checked against the v0.2 design data (docs/design/v0.2/LEVEL_LAYOUT.json) and the placement/terrain contracts.
// Collision of the built world (stairs, railings, doors, culling) is checked in the browser: scripts/e2e-dev02.mjs.
import { describe, it, expect } from 'vitest';
import LAYOUT from '../docs/design/v0.2/LEVEL_LAYOUT.json';
import {
  ESTATE, MANOR, WING, CONS, POOL, TERRACE, COTTAGE, COTTAGE_TERRACE, COTTAGE_PAD, COTTAGE_RAMP, SHED, SAUNA, JACUZZI, PARKING, BBQ, OUTDOOR_DINING,
  MUSIC_BONG, BALLOON_NOOK, WELLNESS, LAKE_VIEW, LANTERN_LAWN, GOLF_TEE, GOLF_CHUTE, ARRIVAL, ARRIVAL_SERVICE, LAKE, lakeQ, WICKERMAN, COTTAGE_PAD_Y,
  COTTAGE_FLOOR, AF, UF, S03, roofUnderside, MAQUETTE, CONS_EAST_DOOR, SAUNA_STEPS, SAUNA_FLOOR, ROUTES,
} from '../src/world/layout';
import { ROOMS, PORTALS, SOURCE_ROOM_IDS, estateRooms } from '../src/world/roomdefs';
import { FOOTPRINTS, vegetationClear, inBuilding, ROUTE_LINES } from '../src/world/footprints';
import { gridHeight, terrainHeight, PROFILED_ROUTES, profileAt, MAX_GRADE, TERRAIN_DIMS, TCELL } from '../src/world/terrain';
import { pointAt, polylineLength } from '../src/world/geom2d';
import { CollisionWorld } from '../src/player/collision';
import { legacyRelocation } from '../src/core/relocate';
import { defaultState, parseSave, POSE_BOUNDS } from '../src/core/state';
import { validatePlacement, prop, POSES } from '../src/slice/placement';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- design data, read structurally
const P = (LAYOUT as any).proposal;
const same = (a: { x0: number; x1: number; z0: number; z1: number }, b: { x0: number; x1: number; z0: number; z1: number }) => expect([a.x0, a.x1, a.z0, a.z1]).toEqual([b.x0, b.x1, b.z0, b.z1]);

describe('DEV-02 layout = v0.2 design data', () => {
  it('fixed estate extent 200 × 180, variant A', () => {
    expect([ESTATE.w, ESTATE.d]).toEqual(P.estate);
    expect(P.variant).toBe('A');
  });
  it('canonical footprints are the LEVEL_LAYOUT ones (main building not enlarged)', () => {
    const C = P.canonical_footprints;
    for (const [mine, id] of [[MANOR, 'MANOR'], [WING, 'WING'], [CONS, 'CONS'], [POOL, 'POOL'], [TERRACE, 'TERRACE'], [COTTAGE, 'COTTAGE'], [COTTAGE_TERRACE, 'COTTAGE_TERRACE'],
      [COTTAGE_PAD, 'COTTAGE_PAD'], [SHED, 'SHED'], [SAUNA, 'SAUNA'], [JACUZZI, 'JACUZZI'], [COTTAGE_RAMP, 'COTTAGE_TERRACE_RAMP']] as const) same(mine, C[id]);
    expect(COTTAGE_FLOOR).toBe(C.COTTAGE.floor_y);
    expect(COTTAGE_PAD_Y).toBe(C.COTTAGE_PAD.terrain_y);
    // DEV-04A owner directive (compact sauna access, ~0.5 m above the deck): v0.2's floor +0.80 is superseded
    expect(C.SAUNA.floor_y).toBe(0.8);
    expect(SAUNA_FLOOR).toBe(0.65);
  });
  it('outdoor zones, parking bays, the lake and the clearing match the reservations', () => {
    const Z = (id: string) => P.outdoor_zones.find((z: { id: string }) => z.id === id).bounds;
    for (const [mine, id] of [[ARRIVAL, 'arrivalCourt'], [ARRIVAL_SERVICE, 'arrivalService'], [BBQ, 'bbq'], [OUTDOOR_DINING, 'outdoorDining'], [MUSIC_BONG, 'musicBong'],
      [BALLOON_NOOK, 'balloonNook'], [WELLNESS, 'wellness'], [LANTERN_LAWN, 'lanternLawn'], [GOLF_TEE, 'golfTee'], [GOLF_CHUTE, 'golfChute']] as const) same(mine, Z(id));
    // documented deviation: the design's viewpoint box is partly in the water ellipse; ours is the same box 3 m east
    const lv = Z('lakeView');
    expect(lakeQ(lv.x0, lv.z1)).toBeLessThan(1);
    same(LAKE_VIEW, { x0: lv.x0 + 3, x1: lv.x1 + 3, z0: lv.z0, z1: lv.z1 });
    PARKING.forEach((b, i) => { expect(b.id).toBe(P.parking_bays[i].id); same(b, P.parking_bays[i].bounds); });
    expect(PARKING.filter((b) => b.car)).toHaveLength(4); // four cars + the optional fifth bay
    same({ x0: LAKE.x - LAKE.rx, x1: LAKE.x + LAKE.rx, z0: LAKE.z - LAKE.rz, z1: LAKE.z + LAKE.rz }, Z('lake'));
    expect(WICKERMAN.y).toBe(P.heights.wickerman);
    // DEV-04A owner directive: the v0.2 clearing centred ON the wickerman loop (a loop vertex); it is restaged east of
    // the loop in its own enclosed clearing (reached by WICKERMAN_SIDE). The v0.2 reservation is kept as a check of the
    // record it replaced.
    same({ x0: 167 - 7.5, x1: 167 + 7.5, z0: 54 - 7.5, z1: 54 + 7.5 }, Z('wickerman'));
    expect(Math.hypot(WICKERMAN.x - 167, WICKERMAN.z - 54)).toBeGreaterThan(WICKERMAN.r + 4);
  });
  it('the Copacabana double door follows the v0.2 metrics; the sauna access is compact (DEV-04A)', () => {
    expect([CONS_EAST_DOOR.x, CONS_EAST_DOOR.z0, CONS_EAST_DOOR.z1]).toEqual([P.door_group_policy.clear_opening_xz.x, P.door_group_policy.clear_opening_xz.z0, P.door_group_policy.clear_opening_xz.z1]);
    expect(CONS_EAST_DOOR.z1 - CONS_EAST_DOOR.z0).toBeCloseTo(2.4, 6);
    // DEV-04A (owner directive): a landing and a few comfortable steps replace v0.2's 8 m ramp
    const rise = SAUNA_STEPS.yTop - SAUNA_STEPS.yFoot;
    expect(rise).toBeCloseTo(0.5, 6);
    expect(rise / SAUNA_STEPS.risers).toBeLessThanOrEqual(0.18);
    expect((SAUNA_STEPS.zFoot - SAUNA_STEPS.zLanding) / SAUNA_STEPS.risers).toBeGreaterThanOrEqual(0.2); // going per step
    expect(SAUNA_STEPS.zFoot - SAUNA_STEPS.zDoor).toBeLessThan(2.0); // compact: landing + steps < 2 m in front of the door
    expect(SAUNA_STEPS.zLanding - SAUNA_STEPS.zDoor).toBeGreaterThanOrEqual(0.9); // a landing to open the door from
    expect(SAUNA_STEPS.x1 - SAUNA_STEPS.x0).toBeGreaterThanOrEqual(1.2);
  });
});

describe('DEV-02 rooms and portals', () => {
  it('keeps all 39 source room ids and adds every v0.2 room with the designed bounds', () => {
    const ids = new Set(ROOMS.map((r) => r.id));
    for (const id of SOURCE_ROOM_IDS) expect(ids.has(id)).toBe(true);
    expect(SOURCE_ROOM_IDS).toHaveLength(39);
    for (const d of P.rooms) {
      const r = ROOMS.find((q) => q.id === d.id);
      expect(r, d.id).toBeTruthy();
      expect([r!.x0, r!.x1, r!.z0, r!.z1]).toEqual([d.bounds.x0, d.bounds.x1, d.bounds.z0, d.bounds.z1]);
    }
    expect(ROOMS.length).toBe(P.rooms.length); // 49
  });
  it('every portal names existing rooms; every v0.2 door id is wired', () => {
    const ids = new Set([...ROOMS.map((r) => r.id), 'out']);
    for (const p of PORTALS) { expect(ids.has(p.a), p.a).toBe(true); expect(ids.has(p.b), p.b).toBe(true); }
    const doors = new Set(PORTALS.map((p) => p.door).filter(Boolean));
    for (const d of P.doors) if (d.canonical_runtime_id) expect(doors.has(d.canonical_runtime_id), d.canonical_runtime_id).toBe(true);
    expect(PORTALS.length).toBeGreaterThanOrEqual(68); // all 68 source relations are kept
  });
  it('classifies most-specific first (attic, attic stair, guest WC, utility)', () => {
    const R = estateRooms();
    const at = (x: number, y: number, z: number) => R.roomAt(x, y + 0.85, z);
    expect(at(97.2, UF, 99.2)).toBe('atticStair'); // lower landing
    expect(at(97.2, 4.2, 101.0)).toBe('atticStair'); // on flight 1
    expect(at(96.0, 5.9, 100.6)).toBe('atticLanding'); // top of flight 2
    expect(at(88, AF, 98)).toBe('atticCommon');
    expect(at(88, AF, 89)).toBe('atticStore');
    expect(at(98, AF, 95)).toBe('atticLookout');
    expect(at(90, 0.15, 95)).toBe('hall'); // the hall void is not the attic
    expect(at(86.5, 0.15, 105.5)).toBe('guestWC');
    expect(at(91, 0.15, 106)).toBe('billiard');
    expect(at(114.5, 0.15, 106)).toBe('utility');
    expect(at(110, 0.15, 106)).toBe('pantry');
    expect(at(103, UF, 102)).toBe('storage');
    expect(at(103, UF, 108)).toBe('linen');
    expect(at(25, COTTAGE_FLOOR, 162)).toBe('cottageRoom');
  });
});

describe('DEV-02 attic: headroom and stair S03', () => {
  it('the roof leaves ≥ 2.1 m over the whole attic play zone (80–101 / 86–105.6)', () => {
    for (const r of ROOMS.filter((q) => q.floor === 'a')) for (let x = r.x0; x <= r.x1; x += 0.5) for (let z = r.z0; z <= r.z1; z += 0.5) expect(roofUnderside(x, z) - AF, `${x},${z}`).toBeGreaterThanOrEqual(2.1);
  });
  it('S03: two 1.2 m flights, middle landing at +5.00, riser ≈ 0.165 and tread ≈ 0.25', () => {
    expect(S03.flight1.x1 - S03.flight1.x0).toBeCloseTo(1.2, 6);
    expect(S03.flight2.x1 - S03.flight2.x0).toBeCloseTo(1.2, 6);
    const run = S03.flight1.z1 - S03.flight1.z0;
    expect((S03.mid.y - UF) / 10).toBeCloseTo(0.165, 3);
    expect((AF - S03.mid.y) / 10).toBeCloseTo(0.165, 3);
    expect(run / 10).toBeGreaterThan(0.24);
    expect(S03.lane.x1 - S03.lane.x0).toBeCloseTo(1.2, 6); // return lane at +3.35
  });
  it('S03 headroom: ≥ 2.1 m above every point of both flights and the landings', () => {
    // the attic floor stops at the stairwell hole; above the lower landing the upper landing slab is at AF − 0.2
    const ceilingAt = (z: number) => (z < S03.hole.z0 ? AF - 0.2 : roofUnderside(97, z));
    for (let z = S03.flight1.z0; z <= S03.flight1.z1; z += 0.1) {
      const y = UF + ((S03.mid.y - UF) * (z - S03.flight1.z0)) / (S03.flight1.z1 - S03.flight1.z0);
      expect(ceilingAt(z) - y).toBeGreaterThanOrEqual(2.1);
    }
    for (let z = S03.flight2.z0; z <= S03.flight2.z1; z += 0.1) expect(roofUnderside(95.8, z) - AF).toBeGreaterThanOrEqual(2.1);
  });
});

describe('DEV-02 terrain', () => {
  it('house, arrival and lantern lawn stay flat; the plateau is level at +4; the clearing at +1.2', () => {
    for (const [x, z] of [[90, 70], [90, 95], [120, 113], [90, 128], [136, 98]]) expect(Math.abs(terrainHeight(x, z))).toBeLessThan(0.02);
    for (let x = COTTAGE_PAD.x0; x <= COTTAGE_PAD.x1; x += 2) for (let z = COTTAGE_PAD.z0; z <= COTTAGE_PAD.z1; z += 2) expect(terrainHeight(x, z)).toBeCloseTo(COTTAGE_PAD_Y, 2);
    expect(terrainHeight(WICKERMAN.x, WICKERMAN.z)).toBeCloseTo(WICKERMAN.y, 2);
  });
  it('the lake basin lies below the water; its shore, the viewpoint and the plateau are dry', () => {
    expect(gridHeight(LAKE.x, LAKE.z)).toBeLessThan(LAKE.water - 1);
    for (let a = 0; a < Math.PI * 2; a += 0.1) { // a little inside the rim the bed is under water
      expect(gridHeight(LAKE.x + Math.cos(a) * LAKE.rx * 0.85, LAKE.z + Math.sin(a) * LAKE.rz * 0.85)).toBeLessThan(LAKE.water);
    }
    for (let x = LAKE_VIEW.x0; x <= LAKE_VIEW.x1; x += 1) for (let z = LAKE_VIEW.z0; z <= LAKE_VIEW.z1; z += 1) { expect(lakeQ(x, z)).toBeGreaterThan(1); expect(gridHeight(x, z)).toBeGreaterThan(LAKE.water + 0.2); }
    for (let x = COTTAGE_PAD.x0; x <= COTTAGE_PAD.x1; x += 1) for (let z = COTTAGE_PAD.z0; z <= COTTAGE_PAD.z1; z += 1) expect(lakeQ(x, z)).toBeGreaterThan(1);
  });
  it('profiled routes: authored height kept (≤ 0.2 m off on the grid), grade ≤ 8 %, the cottage reached at plateau height', () => {
    for (const r of PROFILED_ROUTES) {
      for (let i = 1; i < r.d.length; i++) expect(Math.abs(r.h[i] - r.h[i - 1]) / (r.d[i] - r.d[i - 1]), r.id).toBeLessThanOrEqual(MAX_GRADE + 1e-9);
      const len = r.d[r.d.length - 1];
      for (let s = 0; s < len; s += 0.5) { const [x, z] = pointAt(r.pts, s); expect(Math.abs(gridHeight(x, z) - profileAt(r, s)), `${r.id}@${s}`).toBeLessThan(0.2); }
      // walked grade on the real grid over 2 m windows
      // walked grade on the real 2 m grid over 2 m windows: the triangle surface adds up to ~3 % where a route hugs a pad edge
      for (let s = 0; s + 2 < len; s += 1) { const [ax, az] = pointAt(r.pts, s), [bx, bz] = pointAt(r.pts, s + 2); expect(Math.abs(gridHeight(bx, bz) - gridHeight(ax, az)) / Math.hypot(bx - ax, bz - az), `${r.id}@${s}`).toBeLessThan(0.105); }
    }
    const out = PROFILED_ROUTES.find((r) => r.id === 'cottageOut')!;
    expect(profileAt(out, out.d[out.d.length - 1])).toBeCloseTo(COTTAGE_PAD_Y, 2);
  });
  it('no route crosses the water; the grid covers the estate plus its margin', () => {
    for (const r of ROUTE_LINES) for (let s = 0; s < polylineLength(r.pts); s += 0.5) { const [x, z] = pointAt(r.pts, s); expect(lakeQ(x, z), r.id).toBeGreaterThan(1.15); }
    expect(TERRAIN_DIMS.X0).toBeLessThan(0);
    expect(TERRAIN_DIMS.X0 + TERRAIN_DIMS.NX * TCELL).toBeGreaterThan(ESTATE.w);
    expect(TERRAIN_DIMS.Z0 + TERRAIN_DIMS.NZ * TCELL).toBeGreaterThan(ESTATE.d);
    expect(ROUTES.every((r) => r.pts.every(([x, z]) => x >= 0 && x <= ESTATE.w && z >= 0 && z <= ESTATE.d))).toBe(true);
  });
});

describe('DEV-02 placement keepouts', () => {
  it('no vegetation in any building, on a platform, in the water or on a route', () => {
    for (const f of FOOTPRINTS) for (const [fx, fz] of [[0.5, 0.5], [0.1, 0.1], [0.9, 0.9], [0.1, 0.9], [0.9, 0.1]]) {
      const x = f.x0 + (f.x1 - f.x0) * fx, z = f.z0 + (f.z1 - f.z0) * fz;
      expect(vegetationClear(x, z, 'tree'), f.id).toBe(false);
      expect(vegetationClear(x, z, 'small'), f.id).toBe(false);
    }
    expect(vegetationClear(LAKE.x, LAKE.z, 'small')).toBe(false);
    for (const r of ROUTE_LINES) { const [x, z] = pointAt(r.pts, polylineLength(r.pts) / 2); expect(vegetationClear(x, z, 'small'), r.id).toBe(false); }
    expect(vegetationClear(10, 120, 'tree')).toBe(true); // west woodland
    expect(vegetationClear(185, 150, 'tree')).toBe(true); // east ridge
  });
  it('trees keep their crowns off the buildings (≥ 3 m) and the sauna/jacuzzi are footprints', () => {
    expect(vegetationClear(MANOR.x0 - 2, 95, 'tree')).toBe(false);
    expect(inBuilding(134, 102)).toBe(true);
    expect(inBuilding(140.8, 102.8)).toBe(true);
  });
  it('the hall maquette stands against the west wall, inside the hall, inspectable from a clear pose (DEV-01 follow-up)', () => {
    const hall = ROOMS.find((r) => r.id === 'hall')!;
    expect(MAQUETTE.x - MAQUETTE.w / 2).toBeGreaterThan(hall.x0 + 0.08); // clear of the 0.16 m partition
    expect(MAQUETTE.x - MAQUETTE.w / 2).toBeLessThan(hall.x0 + 0.3); // and right against it
    expect(MAQUETTE.z - MAQUETTE.d / 2).toBeGreaterThan(90.2); // north of the living-room arch (Z 87–90)
    expect(MAQUETTE.z + MAQUETTE.d / 2).toBeLessThan(97.4); // south of the lobby-arch keepout
    expect(MAQUETTE.pose.x - 0.3).toBeGreaterThan(MAQUETTE.x + MAQUETTE.w / 2);
    expect(prop('ds01.maquetteTable').x).toBe(MAQUETTE.x);
    expect(POSES.find((p) => p.id === 'pose.maquette')!.x).toBe(MAQUETTE.pose.x);
    expect(validatePlacement()).toEqual([]);
  });
});

describe('DEV-02 collision primitives', () => {
  it('the lake ellipse is solid at the shore and slides the body along it', () => {
    const w = new CollisionWorld({ minX: 0, maxX: 200, minZ: 0, maxZ: 180 });
    w.addEllipse(LAKE.x, LAKE.z, LAKE.rx, LAKE.rz, -3, 3);
    const p = { x: LAKE.x, y: 0, z: LAKE.z - LAKE.rz - 1 };
    w.move(p, 0.3, 2, 0.3, 1.7, 0.42);
    expect(lakeQ(p.x, p.z)).toBeGreaterThanOrEqual(1);
    expect(p.x).toBeGreaterThan(LAKE.x + 0.2); // slid along, not stuck
    expect(w.overlaps(LAKE.x, LAKE.z, 0, 0.3, 1.7, 0.42)).toBe(true);
    expect(w.segmentBlocked(LAKE.x - 30, 1, LAKE.z, LAKE.x + 30, 1, LAKE.z)).toBe(false); // water never blocks a view
  });
  it('a full-height side rail beside a ramp: walk on the flight, never step off at any height', () => {
    const w = new CollisionWorld({ minX: 0, maxX: 20, minZ: 0, maxZ: 20 });
    w.addRamp({ minX: 5, maxX: 6.9, minZ: 2, maxZ: 11, axis: 'z', a: 2, ya: 0, b: 11, yb: 3.2 });
    w.addBox(4.86, 5.0, 2, 11, 0, 4.3); // rail outside the flight's width
    const p = { x: 5.9, y: 0, z: 1.5 };
    for (let i = 0; i < 36; i++) w.move(p, 0, 0.25, 0.3, 1.7, 0.42); // up to Z 10.5, still on the flight
    expect(p.y).toBeGreaterThan(2.5);
    for (let i = 0; i < 20; i++) w.move(p, -0.25, 0, 0.3, 1.7, 0.42);
    expect(p.x).toBeGreaterThanOrEqual(5.0 + 0.3 - 1e-6); // stopped by the rail, still on the flight
  });
});

describe('DEV-02 saves', () => {
  it('pose bounds follow the 200 × 180 estate (a cottage / east ridge pose survives a reload)', () => {
    expect(POSE_BOUNDS).toEqual({ x0: -5, x1: 205, z0: -5, z1: 185 });
    const s = defaultState(1);
    s.scene = 'estate';
    s.player.estate = { x: 25, y: COTTAGE_FLOOR, z: 154, yaw: 0, pitch: 0 };
    expect(parseSave(JSON.stringify(s))!.player.estate).toEqual(s.player.estate);
    s.player.estate = { x: 195, y: 3, z: 175, yaw: 0, pitch: 0 };
    expect(parseSave(JSON.stringify(s))!.player.estate).toEqual(s.player.estate);
    s.player.estate = { x: 96, y: AF, z: 99.2, yaw: 0, pitch: 0 }; // attic
    expect(parseSave(JSON.stringify(s))!.player.estate).toEqual(s.player.estate);
    s.player.estate = { x: 210, y: 0, z: 90, yaw: 0, pitch: 0 };
    expect(parseSave(JSON.stringify(s))!.player.estate).toBeNull();
  });
  it('named relocation for poses in rebuilt places; everything else untouched', () => {
    const pose = (x: number, y: number, z: number) => ({ x, y, z, yaw: 0, pitch: 0 });
    expect(legacyRelocation('estate', pose(37, 0.3, 132))?.checkpoint).toBe('cottage'); // old cottage room
    expect(legacyRelocation('estate', pose(37, 0.15, 126.4))?.checkpoint).toBe('cottage'); // old cottage terrace
    expect(legacyRelocation('estate', pose(48, 0, 128.5))?.checkpoint).toBe('lake'); // old pond bench
    expect(legacyRelocation('estate', pose(97, UF, 102.5))?.checkpoint).toBe('ucorr'); // old storage room → attic stair
    expect(legacyRelocation('estate', pose(25, COTTAGE_FLOOR, 154))).toBeNull(); // the new cottage
    expect(legacyRelocation('estate', pose(103, UF, 102))).toBeNull(); // still a room (north guest room)
    expect(legacyRelocation('home', pose(37, 0.3, 132))).toBeNull();
    expect(legacyRelocation('estate', null)).toBeNull();
  });
});
