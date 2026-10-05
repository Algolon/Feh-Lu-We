// The manor (iteration 3): main block X 72–108, Z 80–110 (two storeys) + single-storey service wing
// X 108–116, Z 92–110 + basement under the north half. Room plan and portals live in roomdefs.ts.
//
// Ground floor: vestibule → double-height hall (grand stair along its east wall); living left (fireplace +
// mantel), dining right → kitchen behind it → service corridor → pantry / workshop / conservatory;
// back lobby (basement door) → billiard room; library (double height, upper gallery) behind the living room.
// Upstairs: gallery around the hall void, Reiskamer + Sterrenkamer (guest bedrooms), library gallery,
// bathroom, corridor → study, botanical/map room, attic storage. Basement: stair → Kelderportaal →
// archive, boiler room, route chamber (tunnel door).
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, wall, floor, ceiling, stairsZ, railing, hipRoof, gableRoof, windowAt } from './arch';
import { box, boxMM, cyl, blob, compound, v3 } from './kit';
import {
  table, chair, sofa, armchair, bookshelf, counter, rug, plant, painting, crate, tableLamp, floorLamp, chandelier, wallSconce,
  part, staticLantern, staticSconce, bed2, bedside, wardrobe, curtains, desk, lectern, bathtub, ladder, telescope, canvasPanel,
} from './furniture';
import { makeDoor, makeDrawer, makePickup, makeLamp, makeInspect, makeAction, place } from '../interactions/props';
import { forestMapTexture } from './textures';
import { buildHearth } from './hearth';
import { makeFire } from './fire';
import { drawSymbol } from '../content/symbols';
import { EMBLEMS, SERVICE, CATALOG, CONSOLE_SOCKETS, ROUTE_LINES } from '../content/canon';
import { addClue, has } from '../core/state';
import { GF, CEIL, UF, UCEIL, TOP, BF, BCEIL } from './layout';
import { placeSolved, slotContents, openBasement } from '../puzzles/rules';

export { GF, CEIL, UF, UCEIL, TOP };

/** Chunks: 'manor' (exterior shell + inner skins), 'mIn' (ground + upper interiors), 'mB' (basement). */
export function buildManor(w: World, g: GameApi, c: Ctx, cIn: Ctx, cB: Ctx) {
  shell(w, c);
  interiorStructure(w, g, cIn);
  groundRooms(w, g, cIn);
  upperRooms(w, g, cIn);
  basement(w, g, cB);
  w.checkpoints.push(
    { name: 'hall', pose: { x: 90, y: GF, z: 86, yaw: 0, pitch: 0 } },
    { name: 'landing', pose: { x: 89, y: UF, z: 100, yaw: Math.PI / 2, pitch: 0 } },
    { name: 'kitchen', pose: { x: 98.5, y: GF, z: 96, yaw: Math.PI / 2, pitch: 0 } },
    { name: 'library', pose: { x: 82.4, y: GF, z: 97.5, yaw: 0, pitch: 0 } },
  );
}

// =====================================================================================================
// Exterior shell: stone walls with windows (both storeys), roof with dormers, porch, entrance bay, wing.
function shell(w: World, c: Ctx) {
  const k = c.k;
  const stone = { mat: k.M.stone, color: '#f2e6cc' };
  const skin = { mat: k.M.plaster, color: '#f1e6cf' };
  const ext = (axis: 'x' | 'z', f: number, a0: number, a1: number, exterior: 1 | -1, gfOpen: { at: number; w: number; h?: number }[], gfWin: number[], ufWin: number[]) => {
    wall(c, axis, f, a0, a1, 0, UF, { ...stone, t: 0.4, exterior, skin, uv: 2.4, openings: gfOpen, windows: gfWin.map((at) => ({ at, sill: 1.05, h: 1.6, w: 1.1 })) });
    wall(c, axis, f, a0, a1, UF, TOP, { ...stone, t: 0.4, exterior, skin, uv: 2.4, windows: ufWin.map((at) => ({ at, sill: 0.8, h: 1.5, w: 1.0 })) });
  };
  // south (front)
  ext('x', 80.2, 72, 108, -1, [{ at: 90, w: 1.7, h: 2.7 }], [75.5, 79, 82.5, 98, 101.5, 105], [75.5, 79, 82.5, 87.5, 92.5, 98, 101.5, 105]);
  // north (garden): billiard + kitchen garden doors, tall library windows
  ext('x', 109.8, 72, 108, 1, [{ at: 91.5, w: 1.2, h: 2.45 }, { at: 101, w: 1.0, h: 2.35 }], [75, 78.5, 82, 88, 97.5, 105], [75, 78.5, 82, 87.5, 98, 104]);
  // west
  ext('z', 72.2, 80.4, 109.6, -1, [], [83, 90.5, 97, 101, 105], [82.5, 90, 97, 101, 105]);
  // east: dining windows; the service wing joins at z 92–110 (door to the service corridor)
  ext('z', 107.8, 80.4, 109.6, 1, [{ at: 102.5, w: 1.0, h: 2.3 }], [83, 86.8, 90.4], [83, 87, 91]);
  // plinth + string course
  for (const [x0, x1, z0, z1] of [[71.85, 108.15, 79.85, 80.0], [71.85, 108.15, 110.0, 110.15], [71.85, 72.0, 79.85, 110.15], [108.0, 108.15, 79.85, 92]] as const) boxMM(c.b, k.M.stone, '#d8c8a8', x0, x1, 0, 0.5, z0, z1, { chunk: c.chunk, uv: 2 });
  boxMM(c.b, k.M.paint, '#e8dcc0', 71.9, 108.1, 3.3, 3.45, 79.9, 80.0, { chunk: c.chunk });
  boxMM(c.b, k.M.paint, '#e8dcc0', 71.9, 108.1, 3.3, 3.45, 110.0, 110.1, { chunk: c.chunk });
  // roof (≈30°) with dormers, chimneys
  hipRoof(c, 90, 95, 36, 30, TOP, 8.2, k.M.slate, '#8a93a8', 0.7);
  for (const [x, z] of [[72.9, 86.7], [100, 101], [86, 106]] as const) {
    box(c.b, k.M.stone, '#e6d6b6', x, 8, z, 1.2, 8.4, 1.2, { chunk: c.chunk, uv: 2 });
    box(c.b, k.M.paint, '#8a4a32', x, 16.4, z, 0.55, 0.5, 0.55, { chunk: c.chunk });
  }
  const dormer = (x: number, z: number, face: 'S' | 'N' | 'E' | 'W') => {
    const alongX = face === 'E' || face === 'W';
    const [fx, fz] = face === 'S' ? [0, -1] : face === 'N' ? [0, 1] : face === 'E' ? [1, 0] : [-1, 0];
    const top = TOP + 1.5;
    const sx = alongX ? 2.4 : 1.8, sz = alongX ? 1.8 : 2.4;
    box(c.b, k.M.stone, '#efe2c4', x - fx * 1.0, TOP - 0.2, z - fz * 1.0, sx, top - TOP + 0.2, sz, { chunk: c.chunk, uv: 1.5 });
    gableRoof(c, x - fx * 1.0, z - fz * 1.0, 2.6, 2.1, top, 0.8, alongX, k.M.slate, '#7d879c');
    const wx = x - fx * 1.0 + fx * (alongX ? 1.21 : 0), wz = z - fz * 1.0 + fz * (alongX ? 0 : 1.21);
    box(c.b, k.M.glow, '#ffc96e', wx, TOP + 0.25, wz, alongX ? 0.04 : 0.8, 1.0, alongX ? 0.8 : 0.04, { chunk: c.chunk, shadow: false, jitter: 0 });
  };
  for (const x of [78, 102]) { dormer(x, 79.6, 'S'); dormer(x, 110.4, 'N'); }
  for (const z of [88, 98]) { dormer(71.6, z, 'W'); dormer(108.4, z, 'E'); }
  // projecting central entrance bay with pediment, round window and porch
  const bay = (x0: number, x1: number, y0: number, y1: number) => {
    boxMM(c.b, k.M.stone, '#f6ead0', x0, x1, y0, y1, 79.55, 80.02, { chunk: c.chunk, uv: 2.4 });
    if (y0 < 2) c.col.addBox(x0, x1, 79.55, 80.02, 0, y1, { occludes: true });
  };
  bay(86.4, 89.05, 0.5, TOP);
  bay(90.95, 93.6, 0.5, TOP);
  bay(89.05, 90.95, 3.0, TOP);
  boxMM(c.b, k.M.stone, '#e2d2b2', 86.2, 93.8, TOP, TOP + 0.25, 79.45, 80.05, { chunk: c.chunk });
  gableRoof(c, 90, 79.8, 0.6, 7.8, TOP + 0.25, 2.6, false, k.M.stone, '#f6ead0');
  cyl(c.b, k.M.glow, '#ffc96e', 90, TOP + 1.0, 79.48, 0.5, 0.5, 0.05, 16, { chunk: c.chunk, rx: Math.PI / 2, shadow: false, jitter: 0 });
  windowAt(c, 'x', 79.55, -1, 90, 4.0, 1.2, 1.6, true);
  floor(c, 87.8, 92.2, 78.6, 80.0, GF, k.M.stone, '#d9ccb0', 0.4, true);
  for (const x of [88.1, 91.9]) { cyl(c.b, k.M.stone, '#efe4ca', x, GF, 78.85, 0.17, 0.19, 2.95, 12, { chunk: c.chunk }); c.col.addCircle(x, 78.85, 0.2, 0, 3); }
  boxMM(c.b, k.M.slate, '#7d879c', 87.5, 92.5, 3.1, 3.35, 78.3, 80.1, { chunk: c.chunk });
  for (const x of [88.8, 91.2]) staticLantern(c, w, x, 2.25, 79.7, 0.8, 0, 4, 7);
  // ---------------------------------------------------------------- service wing (single storey, own roof)
  const WH = 3.9;
  wall(c, 'x', 92.2, 107.6, 116, 0, WH, { ...stone, t: 0.4, exterior: -1, skin, uv: 2.4, openings: [{ at: 112, w: 1.1, h: 2.3 }], windows: [{ at: 110, sill: 1.1, h: 1.3, w: 1.0 }, { at: 114.4, sill: 1.1, h: 1.3, w: 0.8 }] });
  wall(c, 'x', 109.8, 107.6, 116, 0, WH, { ...stone, t: 0.4, exterior: 1, skin, uv: 2.4, windows: [{ at: 112, sill: 1.2, h: 1.1, w: 1.0 }] });
  wall(c, 'z', 115.8, 92.4, 109.6, 0, WH, { ...stone, t: 0.4, exterior: 1, skin, uv: 2.4, openings: [{ at: 102.5, w: 1.3, h: 2.35 }] });
  hipRoof(c, 112, 101, 8, 18, WH, 2.6, k.M.slate, '#848da0', 0.5);
}

// =====================================================================================================
// Floors, ceilings, partitions, stairs, doors (interior chunk).
function interiorStructure(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  // ---------------------------------------------------------------- ground floor surfaces
  floor(c, 85, 95, 80.4, 98, GF, k.M.tile, '#efe4cc', 0.2, false, 1.6); // vestibule + hall
  floor(c, 85, 92, 98, 104, GF, k.M.tile, '#e8dcc0', 0.2, false, 1.6); // back lobby
  floor(c, 92, 95, 98, 99.6, GF, k.M.wood, '#7a5232', 0.2, false, 1.2); // basement stair landing
  floor(c, 85, 95, 104.8, 109.6, GF, k.M.wood, '#9a6a3e', 0.2, false, 2.2); // billiard
  floor(c, 85, 92, 104, 104.8, GF, k.M.wood, '#9a6a3e', 0.2, false, 2.2);
  floor(c, 72.4, 85, 80.4, 94, GF, k.M.wood, '#b07e4e', 0.2, false, 2.2); // living
  floor(c, 72.4, 85, 94, 109.6, GF, k.M.wood, '#8a5a34', 0.2, false, 2.2); // library
  floor(c, 95, 107.6, 80.4, 92, GF, k.M.wood, '#a8754a', 0.2, false, 2.2); // dining
  floor(c, 95, 107.6, 92, 109.6, GF, k.M.tile, '#e6d2b0', 0.2, false, 1.2); // kitchen
  floor(c, 108.4, 115.6, 92.4, 109.6, GF, k.M.tile, '#d8c8a8', 0.2, false, 1.2); // wing
  // walkable regions (the basement stair opening is left out)
  for (const [x0, x1, z0, z1] of [[72.4, 92, 80.4, 109.6], [92, 95, 80.4, 99.6], [92, 95, 104.8, 109.6], [95, 107.6, 80.4, 109.6], [108.4, 115.6, 92.4, 109.6], [107.4, 108.6, 101.9, 103.1], [111.3, 112.7, 91.6, 92.6], [115.4, 116.4, 101.7, 103.3]] as const) w.col.addFloor(x0, x1, z0, z1, GF);
  // ---------------------------------------------------------------- slabs between storeys (walk above, occlude interaction)
  const slab = (x0: number, x1: number, z0: number, z1: number) => {
    boxMM(c.b, k.M.wood, '#8a5a34', x0, x1, CEIL, UF, z0, z1, { uv: 2.2, chunk: c.chunk });
    w.col.addFloor(x0, x1, z0, z1, UF);
    w.col.addOccluder(x0, x1, z0, z1, CEIL, UF);
  };
  slab(72.4, 85, 80.4, 94); // bedrooms
  slab(85, 95, 80.4, 84); // front gallery
  slab(85, 86.8, 84, 95.5); // walkway
  slab(85, 95, 95.5, 104); // landing
  slab(85, 95, 104, 109.6); // bath + linen
  slab(95, 107.6, 80.4, 109.6); // east upstairs
  slab(83.2, 85, 94, 107.8); // library gallery (east side)
  slab(72.4, 85, 107.8, 109.6); // library gallery (north side)
  // beams under ground-floor ceilings (not in the double-height spaces)
  for (let x = 74; x < 107; x += 2.4) {
    if (x < 85) boxMM(c.b, k.M.wood, '#6b4426', x - 0.1, x + 0.1, CEIL - 0.22, CEIL, 80.4, 94, { chunk: c.chunk, uv: 1.5 });
    if (x > 95) boxMM(c.b, k.M.wood, '#6b4426', x - 0.1, x + 0.1, CEIL - 0.22, CEIL, 80.4, 109.6, { chunk: c.chunk, uv: 1.5 });
  }
  ceiling(c, 72.4, 107.6, 80.4, 109.6, UCEIL, '#efe4cc');
  ceiling(c, 108.4, 115.6, 92.4, 109.6, CEIL + 0.4, '#efe4cc');

  // ---------------------------------------------------------------- ground-floor partitions
  const P = { t: 0.16, mat: k.M.plaster, color: '#f3e9d4', uv: 2.4 };
  wall(c, 'z', 85, 80.4, 94, GF, CEIL, { ...P, openings: [{ at: 88.5, w: 3.0, h: 2.6 }] }); // living | hall
  wall(c, 'z', 95, 80.4, 92, GF, CEIL, { ...P, openings: [{ at: 85.2, w: 1.9, h: 2.6 }] }); // hall | dining (south of the stair foot)
  wall(c, 'x', 84, 85, 95, GF, CEIL, { ...P, openings: [{ at: 90, w: 2.4, h: 2.75 }] }); // vestibule | hall
  wall(c, 'x', 98, 85, 92, GF, CEIL, { ...P, openings: [{ at: 88.5, w: 4.2, h: 2.7 }] }); // hall | lobby
  wall(c, 'z', 85, 94, 109.6, GF, CEIL, { ...P, openings: [{ at: 101, w: 1.0, h: 2.3 }] }); // library | lobby/billiard
  wall(c, 'x', 94, 72.4, 85, GF, CEIL, { ...P, openings: [{ at: 79, w: 1.6, h: 2.4 }] }); // living | library
  wall(c, 'x', 104, 85, 92, GF, CEIL, { ...P, openings: [{ at: 88.5, w: 1.0, h: 2.3 }] }); // lobby | billiard
  wall(c, 'z', 95, 92, 109.6, BF, CEIL, P); // kitchen | stairwell/billiard (down to the basement floor)
  wall(c, 'x', 92, 95, 107.6, GF, CEIL, { ...P, openings: [{ at: 101, w: 2.0, h: 2.5 }] }); // dining | kitchen
  // basement stairwell enclosure (west side has the sealed door; walls run down to the basement floor)
  wall(c, 'z', 92, 98, 104.8, GF, CEIL, { ...P, openings: [{ at: 98.9, w: 1.0, h: 2.3 }] });
  wall(c, 'z', 92, 98, 104.8, BF, GF, P);
  wall(c, 'x', 98, 92, 95, BF, CEIL, P);
  wall(c, 'x', 104.8, 92, 95, GF, CEIL, P);
  // service wing partitions
  wall(c, 'x', 101, 108.4, 115.6, GF, CEIL + 0.4, { ...P, openings: [{ at: 112, w: 1.0, h: 2.3 }] }); // workshop | corridor
  wall(c, 'x', 104, 108.4, 115.6, GF, CEIL + 0.4, { ...P, openings: [{ at: 112, w: 1.0, h: 2.3 }] }); // corridor | pantry
  // wainscot in the hall
  for (const [f, a0, a1] of [[85.09, 84.2, 86.9], [94.91, 86.3, 89.0]] as const) box(c.b, k.M.wood, '#6b4426', f, GF, (a0 + a1) / 2, 0.04, 1.0, a1 - a0, { chunk: c.chunk, uv: 1 });

  // ---------------------------------------------------------------- upstairs partitions
  const U = { t: 0.16, mat: k.M.plaster, color: '#efe2c8', uv: 2.4 };
  wall(c, 'z', 85, 80.4, 109.6, CEIL, UCEIL, { ...U, openings: [{ at: 82.2, w: 0.95, h: 2.3 }, { at: 90.2, w: 0.95, h: 2.3 }, { at: 100, w: 1.0, h: 2.3 }] });
  wall(c, 'x', 86.8, 72.4, 85, CEIL, UCEIL, U); // reis | sterren
  wall(c, 'x', 94, 72.4, 85, CEIL, UCEIL, U); // sterren | library volume
  wall(c, 'z', 95, 80.4, 109.6, CEIL, UCEIL, { ...U, openings: [{ at: 97.3, w: 2.0, h: 2.5 }] }); // hall/landing | east
  wall(c, 'x', 96, 95, 107.6, CEIL, UCEIL, { ...U, openings: [{ at: 98.2, w: 0.95, h: 2.3 }, { at: 104.5, w: 0.95, h: 2.3 }] });
  wall(c, 'z', 101.3, 80.4, 96, CEIL, UCEIL, U); // study | botanic
  wall(c, 'x', 98.6, 95, 107.6, CEIL, UCEIL, { ...U, openings: [{ at: 101, w: 0.95, h: 2.3 }] });
  wall(c, 'x', 104, 85, 95, CEIL, UCEIL, { ...U, openings: [{ at: 87.5, w: 0.9, h: 2.3 }] });
  wall(c, 'z', 90, 104, 109.6, CEIL, UCEIL, U); // bath | linen
  railing(c, 'z', 86.8, 84, 95.5, UF);
  railing(c, 'x', 84, 86.8, 95, UF);
  railing(c, 'x', 95.5, 86.8, 93, UF);
  railing(c, 'z', 83.2, 94, 107.8, UF, '#4a2f1a');
  railing(c, 'x', 107.8, 72.4, 83.2, UF, '#4a2f1a');
  // grand stair along the hall's east wall, with a sloped handrail on its open side
  stairsZ(c, 93.05, 94.92, 86.5, 95.5, GF, UF);
  for (let i = 0; i <= 9; i++) {
    const z = 86.6 + i * 0.98, y = GF + ((z - 86.5) / 9) * (UF - GF);
    cyl(c.b, k.M.wood, '#5e3b1f', 93.12, y, z, 0.025, 0.025, 0.95, 6, { chunk: c.chunk });
  }
  const len = Math.hypot(9, UF - GF), ang = Math.atan2(UF - GF, 9);
  box(c.b, k.M.wood, '#5e3b1f', 93.12, GF + 0.95 + (UF - GF) / 2 - 0.03, 91, 0.07, 0.06, len, { rx: ang, chunk: c.chunk });
  cyl(c.b, k.M.wood, '#4a2f1a', 93.12, GF, 86.5, 0.1, 0.1, 1.25, 8, { chunk: c.chunk });
  // basement stair (descends north from the sealed door)
  stairsZ(c, 92.08, 94.92, 104.8, 99.6, BF, GF, '#6b4a2a');

  // ---------------------------------------------------------------- doors
  makeDoor(w, g, { id: 'door.front', x: 89.15, z: 80.2, dir: 'x+', width: 1.7, height: 2.62, y0: GF, swing: 1, color: '#6b3f22', key: 'frontKey', thickness: 0.09 });
  makeDoor(w, g, { id: 'door.library', x: 85, z: 100.5, dir: 'z+', width: 1.0, height: 2.25, y0: GF, swing: -1, color: '#5a3520' });
  makeDoor(w, g, { id: 'door.billiard', x: 88, z: 104, dir: 'x+', width: 1.0, height: 2.25, y0: GF, swing: 1 });
  makeDoor(w, g, { id: 'door.livLib', x: 78.2, z: 94, dir: 'x+', width: 1.6, height: 2.35, y0: GF, swing: 1, color: '#5a3520' });
  makeDoor(w, g, { id: 'door.service', x: 107.8, z: 102, dir: 'z+', width: 1.0, height: 2.25, y0: GF, swing: 1 });
  makeDoor(w, g, { id: 'door.workshop', x: 111.5, z: 101, dir: 'x+', width: 1.0, height: 2.25, y0: GF, swing: -1, style: 'plank', color: '#7a5a3a' });
  makeDoor(w, g, { id: 'door.pantry', x: 111.5, z: 104, dir: 'x+', width: 1.0, height: 2.25, y0: GF, swing: 1, style: 'plank', color: '#7a5a3a' });
  makeDoor(w, g, { id: 'door.workshopOut', x: 111.45, z: 92.2, dir: 'x+', width: 1.1, height: 2.25, y0: GF, swing: -1, style: 'plank', color: '#6b4a2a' });
  makeDoor(w, g, { id: 'door.billiardOut', x: 90.9, z: 109.8, dir: 'x+', width: 1.2, height: 2.4, y0: GF, swing: -1, style: 'glass' });
  makeDoor(w, g, { id: 'door.kitchenBack', x: 100.5, z: 109.8, dir: 'x+', width: 1.0, height: 2.3, y0: GF, swing: -1, style: 'glass' });
  makeDoor(w, g, { id: 'door.reis', x: 85, z: 81.72, dir: 'z+', width: 0.95, height: 2.2, y0: UF, swing: -1 });
  makeDoor(w, g, { id: 'door.sterren', x: 85, z: 89.72, dir: 'z+', width: 0.95, height: 2.2, y0: UF, swing: -1 });
  makeDoor(w, g, { id: 'door.libGallery', x: 85, z: 99.5, dir: 'z+', width: 1.0, height: 2.2, y0: UF, swing: -1, color: '#5a3520' });
  makeDoor(w, g, { id: 'door.bath', x: 87.05, z: 104, dir: 'x+', width: 0.9, height: 2.2, y0: UF, swing: 1, color: '#efe6d6' });
  makeDoor(w, g, { id: 'door.study', x: 97.72, z: 96, dir: 'x+', width: 0.95, height: 2.2, y0: UF, swing: -1, key: 'studyKey', color: '#5a3520' });
  makeDoor(w, g, { id: 'door.botanic', x: 104.02, z: 96, dir: 'x+', width: 0.95, height: 2.2, y0: UF, swing: -1 });
  makeDoor(w, g, { id: 'door.storage', x: 100.52, z: 98.6, dir: 'x+', width: 0.95, height: 2.2, y0: UF, swing: 1, style: 'plank', color: '#7a5a3a' });
  // the sealed basement door: three seal impressions; holding all three seals opens it
  makeDoor(w, g, { id: 'door.basement', x: 92, z: 98.4, dir: 'z+', width: 1.0, height: 2.25, y0: GF, swing: 1, color: '#4a2f1a', unlock: 'lock.basement', lockedMsg: '' });
  const bd = w.byId.get('door.basement')!;
  const bdRun = bd.run;
  bd.label = () => (g.state.flags.basementOpen ? (g.state.open['door.basement'] ? 'Sluiten' : 'Openen') : 'Kelderdeur');
  bd.run = () => { if (g.state.flags.basementOpen) return bdRun(); g.act(openBasement(g.state)); };
  const seals = compound((b) => {
    box(b, k.M.paint, '#c9a44c', 0, 0, 0, 0.06, 0.62, 0.3);
    blob(b, k.M.paint, '#3a2a1a', 0.035, 0.5, 0, 0.01, 0.06, 0.06);
    box(b, k.M.paint, '#3a2a1a', 0.035, 0.27, 0, 0.012, 0.11, 0.11);
    blob(b, k.M.paint, '#3a2a1a', 0.035, 0.1, 0, 0.01, 0.07, 0.045);
  });
  place(seals, 91.88, GF + 0.95, 99.55, 0);
  w.scene.add(seals);
  makeInspect(w, g, { id: 'inspect.basementDoor', obj: seals, clue: 'c.basementDoor', hit: [0.2, 0.7, 0.4], hitOffset: [0, 0.3, 0], label: 'Bekijken: zegelafdrukken' });
  plaques(w, c);
}

/** Enamel room plaques: emblem + room name, drawn into one atlas (one draw call for all plaques). */
function plaques(w: World, c: Ctx) {
  const where: { room: string; x: number; y: number; z: number; yaw: number }[] = [
    { room: 'Woonkamer', x: 85.1, y: GF + 1.55, z: 86.6, yaw: Math.PI / 2 },
    { room: 'Eetkamer', x: 94.9, y: GF + 1.55, z: 86.9, yaw: -Math.PI / 2 },
    { room: 'Bibliotheek', x: 85.1, y: GF + 1.55, z: 102.0, yaw: Math.PI / 2 },
    { room: 'Keuken', x: 102.4, y: GF + 1.55, z: 91.9, yaw: Math.PI },
    { room: 'Reiskamer', x: 85.1, y: UF + 1.55, z: 83.25, yaw: Math.PI / 2 },
    { room: 'Sterrenkamer', x: 85.1, y: UF + 1.55, z: 91.25, yaw: Math.PI / 2 },
    { room: 'Studeerkamer', x: 99.1, y: UF + 1.55, z: 96.1, yaw: 0 },
    { room: 'Botanische kamer', x: 105.4, y: UF + 1.55, z: 96.1, yaw: 0 },
  ];
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 160;
  const x = cv.getContext('2d')!;
  EMBLEMS.forEach((e, i) => {
    const ox = i * 128;
    x.fillStyle = '#21324a'; x.fillRect(ox, 0, 128, 160);
    x.fillStyle = '#f4ecd8'; x.beginPath(); x.ellipse(ox + 64, 64, 56, 56, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#c9a44c'; x.lineWidth = 6; x.beginPath(); x.ellipse(ox + 64, 64, 56, 56, 0, 0, Math.PI * 2); x.stroke();
    drawSymbol(x, e.sym, ox + 22, 22, 84);
    x.fillStyle = '#f4ecd8'; x.font = 'bold 17px Georgia'; x.textAlign = 'center';
    x.fillText(e.room, ox + 64, 146);
  });
  const tex = w.texture(new THREE.CanvasTexture(cv));
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = w.material(new THREE.MeshLambertMaterial({ map: tex, vertexColors: true }));
  for (const p of where) {
    const i = EMBLEMS.findIndex((e) => e.room === p.room);
    const geo = new THREE.PlaneGeometry(0.26, 0.325);
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    for (let j = 0; j < uv.count; j++) uv.setXY(j, (i + uv.getX(j)) / 8, uv.getY(j));
    const [fx, fz] = [Math.sin(p.yaw), Math.cos(p.yaw)];
    const m = new THREE.Matrix4().makeRotationY(Math.PI - p.yaw).setPosition(p.x + fx * 0.012, p.y, -(p.z + fz * 0.012));
    c.b.add(mat, geo, m, '#ffffff', c.chunk, false, 0);
    geo.dispose();
  }
}

// =====================================================================================================
// Ground-floor rooms
function groundRooms(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const base = c.chunk;
  c.chunk = 'mHall'; // furnishings are batched per area so whole areas can be hidden (see estate.ts regions)
  // ---------------------------------------------------------------- vestibule
  rug(c, 90, 82.2, GF + 0.01, 2.6, 2.4, 0, '#e8d0c0');
  plant(c, 85.7, 80.9, GF, 1.2, '#c9d6e8');
  plant(c, 94.3, 80.9, GF, 1.2, '#c9d6e8');
  part(c, k.M.wood, '#6b4426', 86.0, 82.6, Math.PI / 2, 0, GF, 0, 1.4, 0.45, 0.4, 1); // bench
  c.col.addBox(85.8, 86.25, 81.9, 83.3, 0, 0.5);
  for (let i = 0; i < 3; i++) cyl(c.b, k.M.paint, '#c9a44c', 94.85, GF + 1.7, 81.6 + i * 0.5, 0.02, 0.02, 0.12, 5, { chunk: c.chunk, rz: Math.PI / 2 });
  box(c.b, k.M.paint, '#3f5a35', 94.78, GF + 1.0, 81.9, 0.1, 0.75, 0.3, { chunk: c.chunk });
  staticSconce(c, w, 85.12, 2.2, 83.2, Math.PI / 2, 2.5, 5);
  // ---------------------------------------------------------------- entrance hall (double height)
  rug(c, 90, 90, GF + 0.01, 3.4, 6.5, 0);
  plant(c, 91.6, 96.8, GF, 1.1);
  painting(c, 85.12, 4.6, 90, Math.PI / 2, 1.2, 0.9, 1);
  painting(c, 85.12, 2.0, 92.5, Math.PI / 2, 0.9, 0.7, 0);
  boxMM(c.b, k.M.rug, '#c86060', 94.86, 94.9, 3.9, 5.9, 88.5, 90.2, { chunk: c.chunk, shadow: false }); // tapestry above the stair
  const ch = chandelier(w, 89.9, UCEIL, 90, 0.9, 1.8);
  const sw = compound((b) => box(b, k.M.paint, '#c9a44c', 0, 0, 0, 0.12, 0.18, 0.03));
  place(sw, 91.5, 1.35, 84.1, 0);
  w.scene.add(sw);
  makeLamp(w, g, { id: 'lamp.hallChandelier', obj: sw, glow: ch.glow, light: ch.light, flames: ch.flames, name: 'kroonluchter', defaultOn: true, intensity: 9, distance: 13, hit: [0.4, 0.4, 0.3], hitOffset: [0, 0.05, 0], patch: { y: GF + 0.03, r: 2.8 } });
  staticSconce(c, w, 94.88, 2.25, 88.2, -Math.PI / 2, 3, 6);
  staticSconce(c, w, 85.12, 2.2, 95.6, Math.PI / 2, 3, 6);
  // console (ladekast) with the dial drawer — the first lock
  const cx = 85.32, cz = 85.5;
  box(c.b, k.M.wood, '#6b4426', cx, GF, cz, 0.46, 0.84, 1.3, { chunk: c.chunk, uv: 1 });
  box(c.b, k.M.wood, '#5a3a22', cx + 0.02, GF + 0.84, cz, 0.52, 0.05, 1.4, { chunk: c.chunk, uv: 1 });
  w.col.addBox(85.08, 85.6, cz - 0.7, cz + 0.7, 0, GF + 0.9);
  const hallDrawer = makeDrawer(w, g, {
    id: 'hall.drawer', x: cx + 0.02, y: GF + 0.66, z: cz, yaw: Math.PI / 2, w: 1.0, h: 0.2, d: 0.42, color: '#7a5232',
    unlock: 'lock.hallDrawer', lockedLabel: 'Slot bekijken',
    onLocked: () => { if (addClue(g.state, 'c.drawerLock')) g.changed(); g.openPanel('drawerLock'); },
  });
  const dials = compound((b) => { for (let i = 0; i < 3; i++) cyl(b, k.M.paint, '#c9a44c', -0.12 + i * 0.12, 0, 0, 0.035, 0.035, 0.025, 12, { rx: Math.PI / 2 }); });
  dials.position.set(0, -0.1, -0.235);
  hallDrawer.slider.add(dials);
  const ledger = compound((b) => { box(b, k.M.paint, '#5a2a22', 0, 0, 0, 0.24, 0.05, 0.32); box(b, k.M.paint, '#efe2c2', 0.01, 0.006, 0, 0.22, 0.04, 0.3); box(b, k.M.paint, '#c9a44c', -0.1, 0.051, 0.12, 0.04, 0.003, 0.04); });
  ledger.position.set(-0.18, -0.08, 0);
  hallDrawer.slider.add(ledger);
  makePickup(w, g, { id: 'pk.ledger', item: 'ledger', obj: ledger, available: hallDrawer.isOpen, hit: [0.3, 0.12, 0.36], after: () => g.inspect('c.ledger') });
  const shedKey = compound((b) => { box(b, k.M.paint, '#8a5a3a', 0, 0, 0, 0.05, 0.015, 0.15); box(b, k.M.wood, '#a8743f', 0, 0, 0.11, 0.08, 0.02, 0.07); });
  shedKey.position.set(0.22, -0.08, 0);
  hallDrawer.slider.add(shedKey);
  makePickup(w, g, { id: 'pk.shedKey', item: 'shedKey', obj: shedKey, available: hallDrawer.isOpen, hit: [0.3, 0.12, 0.3] });
  const gb = compound((b) => { box(b, k.M.paint, '#6a2f2a', 0, 0, 0, 0.3, 0.04, 0.22); box(b, k.M.paint, '#f2e8d2', 0, 0.04, 0, 0.28, 0.005, 0.2); });
  place(gb, cx + 0.03, GF + 0.89, cz - 0.35, Math.PI / 2);
  w.scene.add(gb);
  makeInspect(w, g, { id: 'mem.hall.guestbook', obj: gb, clue: 'mem.hall.guestbook', hit: [0.4, 0.2, 0.35] });
  const tl = tableLamp(w, cx, GF + 0.89, cz + 0.45);
  makeLamp(w, g, { id: 'lamp.hallConsole', ...tl, name: 'lamp', defaultOn: false, hit: [0.4, 0.7, 0.4], intensity: 4, distance: 6 });

  // ---------------------------------------------------------------- living room (west, front)
  buildHearth(w, g, c, { id: 'fire.living', x: 72.4, z: 86.7, y: GF, facing: Math.PI / 2, ceil: CEIL, mantel: true, defaultLit: true });
  rug(c, 77.4, 86.7, GF + 0.01, 4.2, 5.4, 0);
  sofa(c, 79.0, 86.7, GF, -Math.PI / 2, 2.6, '#5f7a45');
  armchair(c, 76.4, 83.0, GF, -0.35, '#4f7f88');
  armchair(c, 76.4, 90.4, GF, Math.PI + 0.35, '#4f7f88');
  table(c, 77.3, 86.7, GF, 0.9, 1.5, 0, '#6b4426', 0.45);
  bookshelf(c, 81.5, 93.6, GF, Math.PI, 2.0, 2.4, 'navy');
  plant(c, 84.4, 80.9, GF, 1.2);
  painting(c, 78, 2.1, 80.45, 0, 1.2, 0.85, 3);
  table(c, 83.9, 92.4, GF, 0.6, 0.6, 0, '#6b4426', 0.62);
  const photo = compound((b) => { box(b, k.M.paint, '#b8892f', 0, 0, 0, 0.22, 0.17, 0.03); box(b, k.M.glow, '#c8b8a0', 0, 0.02, 0.018, 0.17, 0.12, 0.005); });
  place(photo, 83.9, GF + 0.62, 92.4, Math.PI * 0.8);
  w.scene.add(photo);
  makeInspect(w, g, { id: 'mem.living.photo', obj: photo, clue: 'mem.living.photo', hit: [0.35, 0.3, 0.35] });
  const fl = floorLamp(w, 84.2, GF, 83.6);
  makeLamp(w, g, { id: 'lamp.livingFloor', ...fl, name: 'staande lamp', defaultOn: true, hit: [0.5, 1.9, 0.5], intensity: 5, distance: 8, patch: { y: GF + 0.03, r: 1.5 } });
  for (const z of [83, 90.5]) curtains(c, 72.45, z, GF + 0.85, Math.PI / 2, 1.1, 2.0, '#7a3a3a');

  c.chunk = 'mLib';
  library(w, g, c);
  c.chunk = 'mHall';

  // ---------------------------------------------------------------- back lobby
  rug(c, 88.5, 101, GF + 0.01, 2.4, 4.0, Math.PI / 2, '#d0b8a0');
  part(c, k.M.wood, '#6b4426', 85.4, 102.8, Math.PI / 2, 0, GF, 0, 1.2, 0.45, 0.4, 1);
  c.col.addBox(85.2, 85.65, 102.2, 103.4, 0, 0.5);
  staticSconce(c, w, 91.9, 2.2, 101.6, -Math.PI / 2, 3, 6);

  billiard(w, g, c);

  // ---------------------------------------------------------------- dining room (thread A: damaged hosting plan)
  c.chunk = 'mWing';
  rug(c, 101.3, 86.2, GF + 0.01, 3.2, 6.4, 0, '#e0c8a8');
  table(c, 101.3, 86.2, GF, 1.3, 4.6, 0, '#6b4426');
  for (let i = 0; i < 5; i++) {
    const z = 84.2 + i * 1.0;
    chair(c, 100.25, z, GF, Math.PI / 2, '#b5643c');
    chair(c, 102.35, z, GF, -Math.PI / 2, '#b5643c');
  }
  for (let i = 0; i < 3; i++) {
    cyl(c.b, k.M.paint, '#c9a44c', 101.3, GF + 0.76, 85.2 + i, 0.06, 0.07, 0.02, 10, { chunk: c.chunk });
    cyl(c.b, k.M.paint, '#efe6c8', 101.3, GF + 0.78, 85.2 + i, 0.03, 0.03, 0.22, 8, { chunk: c.chunk });
  }
  makeFire(w, { kind: 'candles', x: 101.3, y: GF + 1.01, z: 85.2, wicks: [[0, 0, 0], [0, 0, 1], [0, 0, 2]] });
  w.lamps.push({ id: 'candles.dining', pos: v3(101.3, GF + 1.3, 86.2), color: '#ffb35a', intensity: 2.5, distance: 5, on: () => true, flicker: 0.2 });
  w.patches.add(101.3, GF + 0.8, 86.2, 1.3, '#ffb35a', () => true, 0.35);
  box(c.b, k.M.wood, '#5a3a22', 107.15, GF, 86.2, 0.5, 0.9, 2.4, { chunk: c.chunk, uv: 1 });
  c.col.addBox(106.8, 107.6, 85, 87.4, 0, 1);
  const plan = compound((b) => { box(b, k.M.paint, '#f2e8d2', 0, 0, 0, 0.32, 0.004, 0.42, { yaw: 0.15 }); box(b, k.M.paint, '#e8dcc0', 0.1, 0.002, 0.14, 0.14, 0.005, 0.12, { yaw: 0.6 }); });
  place(plan, 107.05, GF + 0.9, 86.0, -Math.PI / 2);
  w.scene.add(plan);
  makeInspect(w, g, { id: 'inspect.hostingPlan', obj: plan, clue: 'c.hostingPlan', hit: [0.5, 0.2, 0.55], label: 'Lezen: tafelplan' });
  painting(c, 107.55, 2.1, 89.7, -Math.PI / 2, 0.8, 0.6, 7);
  const dch = chandelier(w, 101.3, CEIL, 86.2, 0.7, 0.9);
  const dsw = compound((b) => box(b, k.M.paint, '#c9a44c', 0, 0, 0, 0.12, 0.18, 0.03));
  place(dsw, 95.09, 1.35, 90.4, Math.PI / 2);
  w.scene.add(dsw);
  makeLamp(w, g, { id: 'lamp.dining', obj: dsw, glow: dch.glow, light: dch.light, flames: dch.flames, name: 'kroonluchter', defaultOn: false, intensity: 7, distance: 10, hit: [0.3, 0.4, 0.4], hitOffset: [0, 0.05, 0], patch: { y: GF + 0.03, r: 2.2 } });
  for (const z of [83, 86.8, 90.4]) curtains(c, 107.55, z, GF + 0.85, -Math.PI / 2, 1.1, 2.0, '#3f5a6a');

  kitchen(w, g, c);

  // ---------------------------------------------------------------- service wing: corridor, pantry, workshop
  staticSconce(c, w, 110.2, 2.2, 101.12, 0, 2.5, 5);
  for (let i = 0; i < 4; i++) cyl(c.b, k.M.paint, '#6b4426', 113.6 + i * 0.4, GF + 1.6, 103.85, 0.02, 0.02, 0.12, 5, { chunk: c.chunk, rx: Math.PI / 2 });
  for (const x of [109.0, 115.0]) {
    box(c.b, k.M.wood, '#7a5232', x, GF, 106.9, 0.6, 2.2, 4.6, { chunk: c.chunk, uv: 1 });
    c.col.addBox(x - 0.3, x + 0.3, 104.6, 109.2, 0, 2.3);
    for (let s = 0; s < 4; s++) for (let j = 0; j < 7; j++) {
      const cols = ['#c9d4dc', '#d9b878', '#c4553d', '#9fbf7a'];
      cyl(c.b, k.M.paint, cols[(s + j) % 4], x + (x < 112 ? 0.32 : -0.32), GF + 0.25 + s * 0.52, 105.0 + j * 0.6, 0.07, 0.07, 0.2, 8, { chunk: c.chunk });
    }
  }
  for (let i = 0; i < 3; i++) blob(c.b, k.M.paint, '#d9c8a0', 112 + (i - 1) * 0.7, GF + 0.3, 109.0, 0.32, 0.3, 0.25, { chunk: c.chunk });
  c.col.addBox(110.9, 113.1, 108.6, 109.5, 0, 0.6);
  staticLantern(c, w, 112, CEIL - 0.1, 106.8, 0.5, 0, 2.5, 5);
  box(c.b, k.M.wood, '#7a5232', 112, GF, 100.3, 3.2, 0.9, 0.7, { chunk: c.chunk, uv: 1 });
  c.col.addBox(110.4, 113.6, 99.9, 100.75, 0, 1);
  box(c.b, k.M.wood, '#5a3a22', 115.5, GF + 1.2, 96.5, 0.05, 1.4, 3.0, { chunk: c.chunk, uv: 1 });
  for (let i = 0; i < 6; i++) box(c.b, k.M.paint, '#3a3530', 115.45, GF + 1.4 + (i % 2) * 0.4, 95.3 + i * 0.45, 0.04, 0.4, 0.06, { chunk: c.chunk });
  for (const [x, z, s] of [[109.2, 93.4, 0.7], [109.9, 93.4, 0.55], [109.2, 94.2, 0.6]] as const) crate(c, x, z, GF, s, 0.2);
  staticLantern(c, w, 112, CEIL - 0.1, 96.5, 0.5, 0, 2.5, 5);
  c.chunk = base;
}

// ---------------------------------------------------------------- library
function library(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  rug(c, 78.4, 101, GF + 0.01, 4.4, 5.8, 0, '#d8c0a0');
  for (const [z, pal] of [[95.6, 'leather'], [99.0, 'olive'], [103.0, 'navy'], [107.0, 'leather']] as const) bookshelf(c, 72.75, z, GF, Math.PI / 2, 1.9, 2.9, pal);
  for (const [x, pal] of [[74.5, 'navy'], [77.9, 'leather'], [81.3, 'olive']] as const) bookshelf(c, x, 109.25, GF, Math.PI, 2.0, 2.9, pal);
  // two free-standing double-sided stacks form aisles (walk between them)
  for (const z of [97.6, 104.4]) {
    bookshelf(c, 76.6, z + 0.2, GF, 0, 3.2, 2.3, z < 100 ? 'olive' : 'navy', 0.3);
    bookshelf(c, 76.6, z - 0.2, GF, Math.PI, 3.2, 2.3, z < 100 ? 'leather' : 'linen', 0.3);
  }
  for (const [x, pal] of [[75.0, 'linen'], [79.0, 'leather']] as const) bookshelf(c, x, 109.3, UF, Math.PI, 2.6, 2.4, pal, 0.25);
  bookshelf(c, 84.75, 97.0, UF, -Math.PI / 2, 2.4, 2.4, 'navy', 0.25);
  bookshelf(c, 84.75, 103.6, UF, -Math.PI / 2, 2.4, 2.4, 'olive', 0.25);
  ladder(c, 74.0, 108.85, GF, Math.PI, 3.3);
  // reading table with the three catalogue sockets (thread B) + its drawer (study key + archive card)
  const tx = 80.6, tz = 101.2;
  box(c.b, k.M.wood, '#5a3a22', tx, GF + 0.74, tz, 1.1, 0.07, 2.2, { chunk: c.chunk, uv: 1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(c.b, k.M.wood, '#4a2f1a', tx + sx * 0.45, GF, tz + sz * 0.95, 0.09, 0.74, 0.09, { chunk: c.chunk });
  c.col.addBox(tx - 0.55, tx + 0.55, tz - 1.1, tz + 1.1, 0, 0.85);
  chair(c, tx + 0.95, tz - 0.5, GF, -Math.PI / 2, '#3f5a6a');
  chair(c, tx + 0.95, tz + 0.5, GF, -Math.PI / 2, '#3f5a6a');
  const sockets = new THREE.Group();
  place(sockets, tx, GF + 0.81, tz, 0);
  w.scene.add(sockets);
  const bookGrp: Record<string, THREE.Object3D> = {};
  // sockets run south → north = left → right for someone standing east of the table, facing west
  const socketZ = (i: number) => (i - 1) * 0.62;
  CATALOG.sockets.forEach((s, i) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 96;
    const x = cv.getContext('2d')!;
    x.fillStyle = '#c9a44c'; x.fillRect(0, 0, 96, 96);
    x.strokeStyle = '#7a5a1a'; x.lineWidth = 5; x.strokeRect(3, 3, 90, 90);
    drawSymbol(x, s.tab, 14, 12, 68, { color: '#e2cf8a', ink: '#5a3a10' });
    const t = w.texture(new THREE.CanvasTexture(cv)); t.colorSpace = THREE.SRGBColorSpace;
    const tile = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), w.material(new THREE.MeshLambertMaterial({ map: t })));
    tile.rotation.x = -Math.PI / 2;
    tile.rotation.z = Math.PI / 2; // tab points away from a reader standing east of the table
    tile.position.set(0, 0.002, -socketZ(i));
    sockets.add(tile);
  });
  const bookCols: Record<string, string> = { ster: '#26344a', varen: '#3f5f32', koffer: '#7a4f2c' };
  CATALOG.books.forEach((b) => {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 160;
    const x = cv.getContext('2d')!;
    x.fillStyle = bookCols[b.id]; x.fillRect(0, 0, 128, 160);
    x.strokeStyle = '#c9a44c'; x.lineWidth = 6; x.strokeRect(8, 8, 112, 144);
    drawSymbol(x, b.sym, 24, 40, 80, { color: '#d9b14a', ink: '#5a3a10' });
    const t = w.texture(new THREE.CanvasTexture(cv)); t.colorSpace = THREE.SRGBColorSpace;
    const grp = new THREE.Group();
    grp.add(compound((bb) => { box(bb, k.M.paint, bookCols[b.id], 0, 0, 0, 0.24, 0.05, 0.32); box(bb, k.M.paint, '#efe2c2', 0.012, 0.006, 0, 0.22, 0.038, 0.3); }));
    const cover = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.32), w.material(new THREE.MeshLambertMaterial({ map: t })));
    cover.rotation.x = -Math.PI / 2;
    cover.rotation.z = Math.PI / 2;
    cover.position.y = 0.052;
    grp.add(cover);
    sockets.add(grp);
    bookGrp[b.id] = grp;
  });
  w.onSync(() => {
    const cur = slotContents(g.state, 'cat');
    let loose = 0;
    CATALOG.books.forEach((b) => {
      const slot = Object.entries(cur).find(([, v]) => v === b.id)?.[0];
      const grp = bookGrp[b.id];
      if (slot) { const i = CATALOG.sockets.findIndex((s) => s.id === slot); grp.position.set(0, 0.004, -socketZ(i)); grp.rotation.y = 0; }
      else { grp.position.set(-0.3, 0.004 + loose * 0.055, -0.95); grp.rotation.y = 0.3 + loose * 0.4; loose++; }
    });
  });
  makeAction(w, {
    id: 'library.catalog', obj: sockets, hit: [1.0, 0.3, 2.2], hitOffset: [0, 0.1, 0],
    label: () => (placeSolved(g.state, 'cat') ? null : 'Boeken en vakken bekijken'),
    run: () => { if (addClue(g.state, 'c.catalogDesk')) g.changed(); g.openPanel('catalog'); },
  });
  const deskDrawer = makeDrawer(w, g, { id: 'library.desk', x: tx + 0.36, y: GF + 0.68, z: tz, yaw: Math.PI / 2, w: 0.9, h: 0.12, d: 0.6, color: '#6b4426', unlock: 'lock.libraryDesk', lockedLabel: 'Lade (dicht)', onLocked: () => g.toast('De lade van de leestafel zit dicht. Een kaartje op tafel: “Elk boek terug in het vak van zijn kamer.”') });
  const card = compound((b) => { box(b, k.M.paint, '#f5eedc', 0, 0, 0, 0.12, 0.004, 0.18); box(b, k.M.paint, '#c9a44c', 0.03, 0.006, 0.05, 0.03, 0.01, 0.1); });
  card.position.set(0.05, -0.04, 0.1);
  deskDrawer.slider.add(card);
  makePickup(w, g, { id: 'pk.studyKey', item: 'studyKey', obj: card, available: deskDrawer.isOpen, hit: [0.3, 0.12, 0.3], label: 'Pakken: messing sleutel en kaart', after: () => g.inspect('c.archiveCard') });
  // framed floor plan with the room emblems, on the east wall facing into the library
  canvasPanel(w, 84.82, GF + 1.75, 96.6, -Math.PI / 2, 1.3, 1.0, (x, W, H) => drawLibraryPlan(x, W, H), 512);
  const planHit = new THREE.Group(); place(planHit, 84.7, GF + 1.25, 96.6, 0); w.scene.add(planHit);
  makeInspect(w, g, { id: 'inspect.libraryPlan', obj: planHit, clue: 'c.libraryPlan', hit: [0.3, 1.0, 1.4], hitOffset: [0, 0.5, 0], label: 'Bekijken: plattegrond' });
  // lectern with the big guestbook (page tabs)
  const lec = lectern(c, 82.8, 105.6, GF, -Math.PI / 2);
  const gbk = compound((b) => {
    box(b, k.M.paint, '#5a2a22', 0, 0, 0, 0.5, 0.04, 0.36, { rx: -0.45 });
    box(b, k.M.paint, '#f2e8d2', 0, 0.03, 0, 0.47, 0.02, 0.33, { rx: -0.45 });
    ['#d0643a', '#4f8a3a', '#3f6fa8', '#9a64c4', '#c9a44c'].forEach((col, i) => box(b, k.M.paint, col, 0.25, 0.03, -0.12 + i * 0.06, 0.04, 0.012, 0.04, { rx: -0.45 }));
  });
  place(gbk, lec.x, lec.y, lec.z, Math.PI / 2);
  w.scene.add(gbk);
  makeInspect(w, g, { id: 'inspect.guestbookTabs', obj: gbk, clue: 'c.guestbookTabs', hit: [0.6, 0.4, 0.5], hitOffset: [0, 0.1, 0], label: 'Lezen: gastenboek' });
  // second lectern: notes on secret writing (the worked example — not the answer)
  const lec2 = lectern(c, 73.8, 101.1, GF, Math.PI / 2);
  const nt = compound((b) => { box(b, k.M.paint, '#3f4a3a', 0, 0, 0, 0.42, 0.03, 0.3, { rx: -0.45 }); box(b, k.M.paint, '#f2e8d2', 0, 0.025, 0, 0.4, 0.015, 0.28, { rx: -0.45 }); });
  place(nt, lec2.x, lec2.y, lec2.z, -Math.PI / 2);
  w.scene.add(nt);
  makeInspect(w, g, { id: 'inspect.cipherExample', obj: nt, clue: 'c.cipherExample', hit: [0.5, 0.4, 0.45], hitOffset: [0, 0.1, 0], label: 'Lezen: notitie' });
  const rl = tableLamp(w, tx - 0.3, GF + 0.81, tz + 0.9);
  makeLamp(w, g, { id: 'lamp.library', ...rl, name: 'leeslamp', defaultOn: true, hit: [0.4, 0.7, 0.4], intensity: 5, distance: 8, patch: { y: GF + 0.82, r: 0.8, strength: 0.3 } });
  const lch = chandelier(w, 78.4, UCEIL, 101, 0.8, 1.6);
  const lsw = compound((b) => box(b, k.M.paint, '#c9a44c', 0, 0, 0, 0.12, 0.18, 0.03));
  place(lsw, 84.9, 1.35, 99.4, -Math.PI / 2);
  w.scene.add(lsw);
  makeLamp(w, g, { id: 'lamp.libraryChandelier', obj: lsw, glow: lch.glow, light: lch.light, flames: lch.flames, name: 'kroonluchter', defaultOn: true, intensity: 7, distance: 12, hit: [0.3, 0.4, 0.4], hitOffset: [0, 0.05, 0], patch: { y: GF + 0.03, r: 2.6 } });
  armchair(c, 74.4, 105.4, GF, Math.PI / 2, '#7a3a3a');
  cyl(c.b, k.M.paint, '#4f7fa8', 82.4, GF, 108.2, 0.04, 0.05, 0.9, 6, { chunk: c.chunk });
  blob(c.b, k.M.paint, '#6aa0c8', 82.4, GF + 1.08, 108.2, 0.22, 0.22, 0.22, { chunk: c.chunk });
  c.col.addCircle(82.4, 108.2, 0.3, 0, 1.3);
}

function drawLibraryPlan(x: CanvasRenderingContext2D, W: number, H: number) {
  x.fillStyle = '#efe2c2'; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#5a4630'; x.lineWidth = 6; x.strokeRect(6, 6, W - 12, H - 12);
  x.fillStyle = '#3a2a1a'; x.font = 'bold 26px Georgia'; x.textAlign = 'center';
  x.fillText('Het huis en zijn kamers', W / 2, 40);
  // a simple 4 × 2 grid: one cell per room, emblem above the name
  const cols = 4, rows = 2, ox = 22, oy = 56, cw = (W - 44) / cols, ch = (H - 76) / rows;
  EMBLEMS.forEach((e, i) => {
    const X = ox + (i % cols) * cw, Y = oy + Math.floor(i / cols) * ch;
    x.fillStyle = '#f7efdc'; x.fillRect(X + 3, Y + 3, cw - 6, ch - 6);
    x.strokeStyle = '#5a4630'; x.lineWidth = 3; x.strokeRect(X + 3, Y + 3, cw - 6, ch - 6);
    const s = Math.min(cw, ch) * 0.55;
    drawSymbol(x, e.sym, X + cw / 2 - s / 2, Y + 10, s);
    x.fillStyle = '#3a2a1a'; x.font = '17px Georgia'; x.fillText(e.room, X + cw / 2, Y + ch - 16);
  });
}

// ---------------------------------------------------------------- billiard room
function billiard(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  rug(c, 90, 107, GF + 0.01, 4.4, 3.8, 0, '#c8b0a0');
  const bx0 = 89.3, bx1 = 90.9, bz0 = 105.4, bz1 = 108.6;
  boxMM(c.b, k.M.wood, '#5a3a22', bx0 - 0.15, bx1 + 0.15, GF + 0.62, GF + 0.82, bz0 - 0.15, bz1 + 0.15, { chunk: c.chunk, uv: 1 });
  boxMM(c.b, k.M.paint, '#2f6b3f', bx0, bx1, GF + 0.82, GF + 0.84, bz0, bz1, { chunk: c.chunk });
  for (const [x, z] of [[bx0, bz0], [bx1, bz0], [bx0, bz1], [bx1, bz1]]) box(c.b, k.M.wood, '#4a2f1a', x, GF, z, 0.16, 0.62, 0.16, { chunk: c.chunk });
  c.col.addBox(bx0 - 0.15, bx1 + 0.15, bz0 - 0.15, bz1 + 0.15, 0, 0.95);
  const ball = (r: number, cc: number, col: string) => blob(c.b, k.M.paint, col, bx0 + ((cc + 0.5) * (bx1 - bx0)) / 3, GF + 0.88, bz1 - ((r + 0.5) * (bz1 - bz0)) / 3, 0.045, 0.045, 0.045, { chunk: c.chunk, jitter: 0 });
  ball(0, 0, '#d33'); ball(1, 2, '#e8c547'); ball(2, 2, '#36c'); ball(2, 1, '#ffffff');
  box(c.b, k.M.wood, '#c9a46a', 90.5, GF + 0.85, 106.2, 0.03, 0.03, 1.4, { chunk: c.chunk, yaw: 0.5 });
  armchair(c, 86.0, 108.6, GF, Math.PI * 1.15, '#7a3a3a');
  const pnl = compound((b) => {
    box(b, k.M.wood, '#4a2f1a', 0, 0, 0, 0.6, 0.6, 0.05);
    for (let r = 0; r < 3; r++) for (let cc = 0; cc < 3; cc++) box(b, k.M.paint, '#3a2a1a', -0.18 + cc * 0.18, 0.12 + r * 0.18, 0.03, 0.12, 0.12, 0.02);
  });
  place(pnl, 94.88, 1.2, 107.4, -Math.PI / 2);
  w.scene.add(pnl);
  const pnlLit = new THREE.Group();
  pnl.add(pnlLit);
  const litMat = w.material(new THREE.MeshBasicMaterial({ color: '#f3c45a' }));
  for (const cell of [0, 5, 8]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.022), litMat);
    const r = Math.floor(cell / 3), cc = cell % 3;
    m.position.set(-0.18 + cc * 0.18, 0.48 - r * 0.18, -0.045);
    pnlLit.add(m);
  }
  w.onSync(() => { pnlLit.visible = !!g.state.flags.billiardSolved; });
  makeAction(w, {
    id: 'billiard.panel', obj: pnl, hit: [0.7, 0.7, 0.3], hitOffset: [0, 0.3, 0],
    label: () => (g.state.flags.billiardSolved ? 'Krijtbord lezen' : 'Paneel bekijken'),
    run: () => (g.state.flags.billiardSolved ? g.inspect('mem.billiard.scoreboard') : g.openPanel('billiard')),
  });
  const ex = compound((b) => {
    box(b, k.M.paint, '#b8892f', -0.3, 0, 0, 0.5, 0.42, 0.04);
    box(b, k.M.paint, '#b8892f', 0.3, 0, 0, 0.5, 0.42, 0.04);
    box(b, k.M.paint, '#2f6b3f', -0.3, 0.06, 0.025, 0.36, 0.3, 0.01);
    box(b, k.M.paint, '#2f6b3f', 0.3, 0.06, 0.025, 0.36, 0.3, 0.01);
  });
  place(ex, 94.88, 1.4, 105.6, -Math.PI / 2);
  w.scene.add(ex);
  makeInspect(w, g, { id: 'inspect.billiardExamples', obj: ex, clue: 'c.billiardExamples', hit: [1.1, 0.5, 0.3], hitOffset: [0, 0.2, 0] });
  const bl = floorLamp(w, 86.0, GF, 105.4);
  makeLamp(w, g, { id: 'lamp.billiard', ...bl, name: 'staande lamp', defaultOn: false, hit: [0.5, 1.9, 0.5], intensity: 5, distance: 8, patch: { y: GF + 0.03, r: 1.5 } });
}

// ---------------------------------------------------------------- kitchen
function kitchen(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  counter(c, 96.6, 109.25, GF, Math.PI, 2.6);
  counter(c, 104.4, 109.25, GF, Math.PI, 5.6);
  counter(c, 107.25, 95.5, GF, -Math.PI / 2, 5.0);
  box(c.b, k.M.paint, '#2b2b2b', 105.6, GF + 0.91, 109.3, 0.9, 0.04, 0.55, { chunk: c.chunk });
  for (let i = 0; i < 4; i++) cyl(c.b, k.M.paint, '#b8682f', 103.9 + i * 0.5, 2.0, 109.45, 0.12, 0.1, 0.16, 10, { chunk: c.chunk });
  box(c.b, k.M.paint, '#3b3026', 104.7, 2.18, 109.45, 2.2, 0.04, 0.04, { chunk: c.chunk });
  table(c, 101.0, 100.0, GF, 1.2, 3.0, 0, '#8a5a33');
  for (let i = 0; i < 3; i++) { chair(c, 100.0, 98.9 + i * 1.1, GF, Math.PI / 2, '#6f8a7a'); chair(c, 102.0, 98.9 + i * 1.1, GF, -Math.PI / 2, '#6f8a7a'); }
  box(c.b, k.M.paint, '#7f9a8a', 101, GF, 105.4, 2.6, 0.86, 1.0, { chunk: c.chunk });
  box(c.b, k.M.paint, '#d8cdb8', 101, GF + 0.86, 105.4, 2.7, 0.05, 1.1, { chunk: c.chunk });
  c.col.addBox(99.65, 102.35, 104.85, 105.95, 0, 1);
  const kd = makeDrawer(w, g, { id: 'kitchen.drawer', x: 101, y: GF + 0.7, z: 104.92, yaw: Math.PI, w: 0.7, h: 0.2, d: 0.42, color: '#6f8a7a' });
  const spare = compound((b) => { box(b, k.M.paint, '#e6dcc0', 0, 0, 0, 0.1, 0.03, 0.06); box(b, k.M.paint, '#c4553d', 0, 0.03, 0, 0.07, 0.003, 0.04); });
  spare.position.set(0.05, -0.08, 0);
  kd.slider.add(spare);
  makePickup(w, g, { id: 'pk.kitchenMatches', item: 'matches', obj: spare, available: () => kd.isOpen() && !has(g.state, 'matches'), hit: [0.25, 0.12, 0.25], label: 'Pakken: reservelucifers' });
  const list = compound((b) => box(b, k.M.paint, '#f5f0e0', 0, 0, 0, 0.2, 0.004, 0.28));
  place(list, 100.4, GF + 0.91, 105.3, 0.3);
  w.scene.add(list);
  makeInspect(w, g, { id: 'mem.kitchen.list', obj: list, clue: 'mem.kitchen.list', hit: [0.35, 0.15, 0.4] });
  const kl = wallSconce(w, 104.0, 2.2, 92.1, 0);
  makeLamp(w, g, { id: 'lamp.kitchen', ...kl, name: 'wandlamp', defaultOn: true, intensity: 5, distance: 9, hit: [0.4, 0.5, 0.4], patch: { y: GF + 0.03, r: 1.6 } });
  plant(c, 96.2, 93.0, GF, 0.9, '#d0a070');
  // ---- service chart (thread A) on the west wall + hook board with the three trolley tags
  const chart = canvasPanel(w, 95.1, GF + 1.65, 96.0, Math.PI / 2, 2.0, 1.0, (x, W, H) => drawServiceChart(x, W, H), 768);
  const tagGroups: Record<string, THREE.Object3D> = {};
  SERVICE.tags.forEach((t) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 96;
    const x = cv.getContext('2d')!;
    x.fillStyle = '#efe2c2'; x.fillRect(0, 0, 96, 96); x.strokeStyle = '#6b4426'; x.lineWidth = 6; x.strokeRect(3, 3, 90, 90);
    drawSymbol(x, t.sym, 12, 12, 72);
    const tex = w.texture(new THREE.CanvasTexture(cv)); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), w.material(new THREE.MeshLambertMaterial({ map: tex })));
    m.position.z = 0.045;
    const grp = new THREE.Group();
    grp.add(m);
    chart.grp.add(grp);
    tagGroups[t.id] = grp;
  });
  w.onSync(() => {
    const cur = slotContents(g.state, 'svc');
    let loose = 0;
    SERVICE.tags.forEach((t) => {
      const slot = Object.entries(cur).find(([, v]) => v === t.id)?.[0];
      const grp = tagGroups[t.id];
      // chart local x runs left → right as the player faces the wall
      if (slot) { const i = SERVICE.slots.findIndex((s) => s.id === slot); grp.position.set((i - 1) * 0.62, -0.27, 0); }
      else { grp.position.set(1.3, 0.32 - loose * 0.32, 0); loose++; }
    });
  });
  makeAction(w, {
    id: 'kitchen.chart', obj: chart.grp, hit: [2.7, 1.1, 0.3], hitOffset: [0.3, 0, 0],
    label: () => (placeSolved(g.state, 'svc') ? 'Bekijken: dienstrooster' : 'Labels ophangen'),
    run: () => { if (addClue(g.state, 'c.serviceChart')) g.changed(); if (placeSolved(g.state, 'svc')) g.inspect('c.serviceChart'); else g.openPanel('service'); },
  });
  // ---- service hatch (dumbwaiter) beside the chart: opens when the plan is right → conservatory key
  const hz = 98.6;
  boxMM(c.b, k.M.wood, '#4a2f1a', 95.08, 95.28, GF + 0.95, GF + 1.75, hz - 0.45, hz + 0.45, { chunk: c.chunk });
  boxMM(c.b, k.M.paint, '#2a201a', 95.08, 95.1, GF + 1.02, GF + 1.68, hz - 0.36, hz + 0.36, { chunk: c.chunk });
  makeDoor(w, g, { id: 'kitchen.hatch', x: 95.32, z: hz - 0.36, dir: 'z+', width: 0.72, height: 0.66, y0: GF + 1.02, swing: -1, color: '#7a5232', unlock: 'lock.serviceHatch', lockedMsg: 'Een serveerluik met een klein slotje zonder sleutelgat. Het hoort bij het dienstrooster ernaast.', thickness: 0.04 });
  const key = compound((b) => { box(b, k.M.paint, '#c9a44c', 0, 0, 0, 0.05, 0.015, 0.16); blob(b, k.M.glow, '#5fbf8f', 0, 0, 0.12, 0.04, 0.02, 0.05); });
  place(key, 95.2, GF + 1.05, hz, 0.3);
  w.scene.add(key);
  makePickup(w, g, { id: 'pk.consKey', item: 'consKey', obj: key, available: () => !!g.state.open['kitchen.hatch'], hit: [0.3, 0.2, 0.3], after: () => g.inspect('c.consNote') });
}

function drawServiceChart(x: CanvasRenderingContext2D, W: number, H: number) {
  x.fillStyle = '#3a2a1a'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#efe2c2'; x.fillRect(10, 10, W - 20, H - 20);
  x.fillStyle = '#3a2a1a'; x.textAlign = 'center';
  x.font = 'bold 34px Georgia'; x.fillText('Dienstrooster', W / 2, 52);
  x.font = 'italic 19px Georgia';
  let line = '', y = 86;
  for (const wd of SERVICE.rule.split(' ')) { const t = line ? `${line} ${wd}` : wd; if (x.measureText(t).width > W - 80) { x.fillText(line, W / 2, y); y += 25; line = wd; } else line = t; }
  x.fillText(line, W / 2, y);
  SERVICE.slots.forEach((s, i) => {
    const cx = W / 2 + (i - 1) * W * 0.31;
    x.strokeStyle = '#6b4426'; x.lineWidth = 5; x.strokeRect(cx - 70, H - 178, 140, 162);
    drawSymbol(x, s.sym, cx - 30, H - 174, 60);
    x.fillStyle = '#3a2a1a'; x.font = 'bold 17px Georgia'; x.fillText(s.name, cx, H - 98);
    x.fillStyle = '#d8c8a0'; x.fillRect(cx - 50, H - 88, 100, 66);
  });
}

// =====================================================================================================
// Upstairs rooms
function upperRooms(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const R0 = UF;
  const base = c.chunk;
  c.chunk = 'mUp';
  // gallery + landing
  rug(c, 90, 99.7, UF + 0.01, 4.0, 2.6, 0, '#d0b8a0');
  plant(c, 85.6, 103.3, UF, 1.0);
  painting(c, 90, UF + 1.7, 103.92, Math.PI, 1.1, 0.8, 2);
  const ls = wallSconce(w, 92.5, UF + 1.9, 103.9, Math.PI);
  makeLamp(w, g, { id: 'lamp.landing', ...ls, name: 'wandlamp', defaultOn: true, intensity: 4, distance: 7, hit: [0.4, 0.5, 0.4], patch: { y: UF + 0.03, r: 1.3 } });
  painting(c, 85.12, UF + 1.6, 93, Math.PI / 2, 0.9, 0.7, 5);
  rug(c, 90, 82.2, UF + 0.01, 3.4, 2.2, 0, '#c8b0a0');
  part(c, k.M.wood, '#6b4426', 93.2, 81.0, 0, 0, UF, 0, 1.4, 0.45, 0.4, 1);
  c.col.addBox(92.5, 93.9, 80.6, 81.4, UF, UF + 0.5);
  // ---------------------------------------------------------------- Reiskamer (warm, travel)
  rug(c, 78.5, 83.6, R0 + 0.01, 3.0, 2.8, 0, '#c9774a');
  bed2(c, 75.0, 83.6, R0, Math.PI / 2, '#b5643c', '#7a4f2c');
  bedside(c, 73.4, 81.6, R0, Math.PI / 2, '#7a4f2c');
  wardrobe(c, 81.6, 86.35, R0, Math.PI, 1.4, '#7a4f2c');
  curtains(c, 75.5, 80.45, R0 + 0.75, 0, 1.0, 1.9, '#c8643a');
  curtains(c, 82.5, 80.45, R0 + 0.75, 0, 1.0, 1.9, '#c8643a');
  canvasPanel(w, 78.6, R0 + 1.6, 86.7, Math.PI, 1.1, 0.75, (x, W, H) => { const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#f6e2b8'); gr.addColorStop(1, '#e8d2a0'); x.fillStyle = gr; x.fillRect(0, 0, W, H); x.strokeStyle = '#7a5a3a'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, H * 0.7); for (let i = 0; i <= 10; i++) x.lineTo((W * i) / 10, H * (0.55 + 0.12 * Math.sin(i * 1.3))); x.stroke(); x.beginPath(); x.arc(W * 0.75, H * 0.3, 26, 0, Math.PI * 2); x.stroke(); x.font = 'italic 22px Georgia'; x.fillStyle = '#7a5a3a'; x.fillText('onderweg', 20, H - 18); }, 256);
  part(c, k.M.wood, '#6b4426', 83.8, 84.4, -Math.PI / 2, 0, R0, 0, 0.9, 0.5, 0.5, 1);
  const suitcase = compound((b) => {
    box(b, k.M.paint, '#a8743f', 0, 0, 0, 0.8, 0.16, 0.5);
    box(b, k.M.paint, '#a8743f', 0, 0.16, -0.24, 0.8, 0.5, 0.06, { rx: -0.25 });
    for (let i = 0; i < 5; i++) box(b, k.M.paint, ['#f6eed8', '#c4553d', '#3f6fa8', '#e8c547', '#6fae4f'][i], -0.3 + i * 0.15, 0.17, 0.05, 0.1, 0.01, 0.07, { yaw: i * 0.4 });
  });
  place(suitcase, 83.8, R0 + 0.5, 84.4, -Math.PI / 2);
  w.scene.add(suitcase);
  c.col.addBox(83.5, 84.9, 83.9, 84.9, R0, R0 + 0.7);
  makeInspect(w, g, { id: 'mem.reis.suitcase', obj: suitcase, clue: 'mem.reis.suitcase', hit: [0.9, 0.5, 0.6], label: 'Bekijken: koffer' });
  const rl = tableLamp(w, 73.4, R0 + 0.59, 81.6);
  makeLamp(w, g, { id: 'lamp.reis', ...rl, name: 'lamp', defaultOn: true, hit: [0.4, 0.7, 0.4], intensity: 4, distance: 6, patch: { y: R0 + 0.03, r: 1.0 } });
  // ---------------------------------------------------------------- Sterrenkamer (cool, astronomy)
  rug(c, 78.5, 90.4, R0 + 0.01, 3.0, 3.0, 0, '#3f5a7a');
  bed2(c, 75.0, 90.4, R0, Math.PI / 2, '#26344a', '#4a3a2a');
  bedside(c, 73.4, 92.4, R0, Math.PI / 2, '#4a3a2a');
  curtains(c, 72.45, 90.0, R0 + 0.75, Math.PI / 2, 1.0, 1.9, '#2f3f5f');
  canvasPanel(w, 78.6, R0 + 1.6, 93.9, Math.PI, 1.4, 0.95, (x, W, H) => { x.fillStyle = '#1c2a44'; x.fillRect(0, 0, W, H); for (let i = 0; i < 60; i++) { x.fillStyle = i % 5 ? '#f4ecd8' : '#e8c547'; x.beginPath(); x.arc((Math.sin(i * 12.9) * 0.5 + 0.5) * W, (Math.sin(i * 7.3) * 0.5 + 0.5) * H, i % 7 ? 2 : 4, 0, Math.PI * 2); x.fill(); } x.strokeStyle = 'rgba(244,236,216,.5)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(W * 0.2, H * 0.3); x.lineTo(W * 0.32, H * 0.42); x.lineTo(W * 0.45, H * 0.36); x.lineTo(W * 0.58, H * 0.5); x.stroke(); x.font = 'italic 20px Georgia'; x.fillStyle = '#f4ecd8'; x.fillText('sterrenkaart', 16, H - 14); }, 384);
  telescope(c, 82.6, 91.4, R0, -Math.PI / 2 - 0.4);
  table(c, 83.9, 93.0, R0, 0.6, 0.5, 0, '#4a3a2a', 0.7);
  const logbook = compound((b) => { box(b, k.M.paint, '#2f3f5f', 0, 0, 0, 0.2, 0.03, 0.28); box(b, k.M.paint, '#efe2c2', 0.005, 0.005, 0, 0.18, 0.025, 0.26); });
  place(logbook, 83.9, R0 + 0.7, 93.0, 0.4);
  w.scene.add(logbook);
  makeInspect(w, g, { id: 'mem.sterren.telescope', obj: logbook, clue: 'mem.sterren.telescope', hit: [0.4, 0.2, 0.4], label: 'Lezen: logboek' });
  const sl = tableLamp(w, 73.4, R0 + 0.59, 92.4);
  makeLamp(w, g, { id: 'lamp.sterren', ...sl, name: 'lamp', defaultOn: false, hit: [0.4, 0.7, 0.4], intensity: 4, distance: 6, patch: { y: R0 + 0.03, r: 1.0 } });
  // ---------------------------------------------------------------- bathroom
  bathtub(c, 86.0, 107.6, R0, 0);
  box(c.b, k.M.paint, '#f4f1ea', 89.3, R0, 105.0, 0.5, 0.85, 0.45, { chunk: c.chunk });
  c.col.addBox(89.0, 89.6, 104.75, 105.3, R0, R0 + 0.9);
  box(c.b, k.M.glow, '#cfe0e6', 89.85, R0 + 1.2, 105.0, 0.02, 0.7, 0.5, { chunk: c.chunk, shadow: false });
  for (let i = 0; i < 3; i++) box(c.b, k.M.paint, ['#6fae9a', '#f2ead8', '#9aa8d8'][i], 85.12, R0 + 1.0 + i * 0.05, 105.4, 0.06, 0.05, 0.5, { chunk: c.chunk });
  staticSconce(c, w, 89.85, R0 + 1.9, 106.8, -Math.PI / 2, 2.5, 4.5);
  // ---------------------------------------------------------------- upstairs corridor
  rug(c, 101.3, 97.3, R0 + 0.01, 11.4, 1.2, 0, '#7a3a3a');
  for (const x of [99, 104]) staticSconce(c, w, x, R0 + 1.9, 98.5, Math.PI, 2.5, 5);
  study(w, g, c);
  // ---------------------------------------------------------------- botanical / map room (optional observation)
  rug(c, 104.4, 88, R0 + 0.01, 3.4, 5.0, 0, '#8a9a6a');
  table(c, 104.4, 88.5, R0, 1.2, 2.4, 0, '#7a5232');
  const herb = compound((b) => {
    box(b, k.M.paint, '#4f6a3a', 0, 0, 0, 0.5, 0.05, 0.36);
    box(b, k.M.paint, '#f2e8d2', 0.02, 0.05, 0, 0.46, 0.01, 0.32);
    for (let i = 0; i < 3; i++) blob(b, k.M.paint, ['#6fae4f', '#9a8a3a', '#c9774a'][i], -0.12 + i * 0.12, 0.06, 0.02, 0.05, 0.005, 0.07);
  });
  place(herb, 104.4, R0 + 0.76, 87.8, 0.2);
  w.scene.add(herb);
  makeInspect(w, g, { id: 'inspect.herbarium', obj: herb, clue: 'c.herbarium', hit: [0.6, 0.25, 0.5], label: 'Lezen: herbarium' });
  for (let i = 0; i < 4; i++) {
    const z = 82.5 + i * 3.4;
    canvasPanel(w, 107.5, R0 + 1.6, z, -Math.PI / 2, 0.5, 0.65, (x, W, H) => { x.fillStyle = '#f2e8d2'; x.fillRect(0, 0, W, H); drawSymbol(x, ['blad', 'e.varen', 'blad', 'e.varen'][i], W * 0.15, H * 0.15, W * 0.7); }, 128, '#8a6a3a');
  }
  for (const [x, z] of [[106.9, 81.0], [102.0, 81.0], [106.9, 95.2]] as const) plant(c, x, z, R0, 1.0, '#c9774a');
  const bl = tableLamp(w, 103.9, R0 + 0.76, 89.4);
  makeLamp(w, g, { id: 'lamp.botanic', ...bl, name: 'lamp', defaultOn: true, hit: [0.4, 0.7, 0.4], intensity: 4, distance: 7, patch: { y: R0 + 0.03, r: 1.2 } });
  // ---------------------------------------------------------------- attic storage (optional memory)
  for (const [x, z, s] of [[96.4, 108.6, 0.7], [97.2, 108.7, 0.55], [106.6, 108.4, 0.8], [106.6, 100.0, 0.6], [105.6, 108.7, 0.5]] as const) crate(c, x, z, R0, s, 0.3);
  for (const [x, z] of [[100.5, 105.5], [103.5, 104.2]] as const) { blob(c.b, k.M.paint, '#efe8d8', x, R0 + 0.55, z, 0.8, 0.55, 0.55, { chunk: c.chunk }); c.col.addCircle(x, z, 0.7, R0, R0 + 1.1); }
  const memBox = compound((b) => { box(b, k.M.paint, '#c8a070', 0, 0, 0, 0.6, 0.4, 0.45); box(b, k.M.paint, '#a07a50', 0, 0.4, 0, 0.62, 0.03, 0.47); });
  place(memBox, 98.5, R0, 102.5, 0.2);
  w.scene.add(memBox);
  c.col.addCircle(98.5, 102.5, 0.4, R0, R0 + 0.5);
  makeInspect(w, g, { id: 'mem.storage.box', obj: memBox, clue: 'mem.storage.box', hit: [0.7, 0.5, 0.6] });
  staticLantern(c, w, 101.3, UCEIL - 0.6, 104, 0.5, 0, 2.5, 6);
  c.chunk = base;
}

function study(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const R0 = UF;
  rug(c, 98.2, 88, R0 + 0.01, 3.2, 4.4, 0, '#b8a0c0');
  bookshelf(c, 95.35, 86.5, R0, Math.PI / 2, 2.0, 2.2, 'leather');
  bookshelf(c, 95.35, 92.5, R0, Math.PI / 2, 2.0, 2.2, 'navy');
  armchair(c, 99.6, 93.6, R0, Math.PI * 0.85, '#7a3a3a');
  // desk under the front window; the drawer front faces north (into the room)
  const dkx = 98.2, dkz = 81.6;
  desk(c, dkx, dkz, R0, Math.PI, 1.8, 0.8);
  chair(c, dkx, dkz + 0.95, R0, Math.PI, '#7a3a3a');
  const studyDrawer = makeDrawer(w, g, {
    id: 'study.compartment', x: dkx, y: R0 + 0.6, z: dkz + 0.05, yaw: 0, w: 0.8, h: 0.16, d: 0.6, color: '#7a5232',
    unlock: 'lock.studyCompartment', lockedLabel: 'Slot bekijken', onLocked: () => g.openPanel('studyLock'),
  });
  const btns = compound((b) => {
    box(b, k.M.paint, '#b8892f', 0, 0, 0, 0.5, 0.12, 0.04);
    for (let i = 0; i < 3; i++) cyl(b, k.M.paint, '#e8c56a', -0.15 + i * 0.15, 0.04, 0.03, 0.035, 0.035, 0.02, 10, { rx: Math.PI / 2 });
  });
  btns.position.set(0, -0.06, -0.31);
  studyDrawer.slider.add(btns);
  const seal = compound((b) => { box(b, k.M.paint, '#3f6fa8', 0, 0, 0, 0.14, 0.03, 0.14); box(b, k.M.paint, '#e8eef8', 0, 0.03, 0, 0.09, 0.006, 0.08); });
  seal.position.set(0, -0.05, 0);
  studyDrawer.slider.add(seal);
  makePickup(w, g, { id: 'pk.archiveSeal', item: 'archiveSeal', obj: seal, available: studyDrawer.isOpen, hit: [0.3, 0.12, 0.3] });
  const note = compound((b) => box(b, k.M.paint, '#f5eedc', 0, 0, 0, 0.21, 0.004, 0.28));
  place(note, dkx - 0.55, R0 + 0.78, dkz, 0.4);
  w.scene.add(note);
  makeInspect(w, g, { id: 'inspect.studyNote', obj: note, clue: 'c.studyNote', hit: [0.35, 0.15, 0.4], label: 'Lezen: briefje' });
  const dl = tableLamp(w, dkx + 0.6, R0 + 0.78, dkz - 0.15);
  makeLamp(w, g, { id: 'lamp.study', ...dl, name: 'bureaulamp', defaultOn: false, hit: [0.4, 0.7, 0.4], intensity: 4, distance: 6, patch: { y: R0 + 0.79, r: 0.5, strength: 0.35 } });
  // framed forest map (the morning-walk route) on the east wall, facing west
  const mapMat = w.material(new THREE.MeshLambertMaterial({ map: w.texture(forestMapTexture()) }));
  const mapMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 1.0), mapMat);
  const mapGrp = new THREE.Group();
  mapGrp.add(mapMesh);
  mapMesh.position.set(0, 0, -0.03);
  mapMesh.rotation.y = Math.PI;
  mapGrp.add(compound((b) => box(b, k.M.paint, '#b8892f', 0, -0.57, 0, 1.42, 1.14, 0.04)));
  place(mapGrp, 101.2, R0 + 1.65, 87.5, Math.PI / 2);
  w.scene.add(mapGrp);
  makeInspect(w, g, { id: 'inspect.forestMap', obj: mapGrp, clue: 'c.forestMap', hit: [1.4, 1.1, 0.3], hitOffset: [0, 0, 0], label: 'Bekijken: kaart' });
  cyl(c.b, k.M.paint, '#4f7fa8', 96.2, R0, 82.0, 0.04, 0.05, 0.9, 6, { chunk: c.chunk });
  blob(c.b, k.M.paint, '#7ab0d0', 96.2, R0 + 1.08, 82.0, 0.22, 0.22, 0.22, { chunk: c.chunk });
  c.col.addCircle(96.2, 82.0, 0.3, R0, R0 + 1.3);
}

// =====================================================================================================
// Basement: Kelderportaal, archive, boiler room, route chamber (+ tunnel door, bolted from the far side)
function basement(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const stoneW = { t: 0.3, mat: k.M.stone, color: '#b8ae98', uv: 2 };
  for (const [x0, x1, z0, z1] of [[89, 97, 104.8, 109.6], [76, 89, 100, 109.6], [97, 107.6, 100, 109.6], [77, 89, 90, 100]] as const) {
    floor(c, x0, x1, z0, z1, BF, k.M.tile, '#a8a090', 0.2, true, 1.4);
    ceiling(c, x0, x1, z0, z1, BCEIL, '#d8d0bc');
  }
  floor(c, 92, 95, 103.6, 104.8, BF, k.M.tile, '#a8a090', 0.2, true, 1.4); // foot of the stair
  const B0 = BF, B1 = BCEIL + 0.2;
  wall(c, 'x', 109.75, 76, 107.6, B0, B1, stoneW);
  wall(c, 'z', 107.75, 100, 109.6, B0, B1, stoneW);
  wall(c, 'x', 99.85, 97, 107.6, B0, B1, stoneW);
  wall(c, 'z', 97, 100, 109.6, B0, B1, { ...stoneW, openings: [{ at: 107.2, w: 1.4, h: 2.3 }] });
  wall(c, 'x', 104.8, 89, 92, B0, B1, stoneW);
  wall(c, 'x', 104.8, 95, 97, B0, B1, stoneW);
  wall(c, 'z', 89, 100, 109.6, B0, B1, { ...stoneW, openings: [{ at: 107.2, w: 1.4, h: 2.3 }] });
  wall(c, 'z', 75.85, 100, 109.6, B0, B1, stoneW);
  wall(c, 'x', 100, 76, 89, B0, B1, { ...stoneW, openings: [{ at: 83, w: 1.6, h: 2.3 }] });
  wall(c, 'z', 89.15, 90, 100, B0, B1, stoneW);
  wall(c, 'x', 89.85, 77, 89, B0, B1, stoneW);
  wall(c, 'z', 76.85, 90, 100, B0, B1, { ...stoneW, openings: [{ at: 97, w: 1.2, h: 2.25 }] });
  // pipes along the ceilings converging on the route chamber (the service drawing made physical)
  for (const [z, col] of [[108.8, '#8a6a3a'], [108.4, '#5a7a8a'], [108.0, '#6b8a5a']] as const) cyl(c.b, k.M.paint, col, 92, BCEIL - 0.25, z, 0.07, 0.07, 30, 8, { chunk: c.chunk, rz: Math.PI / 2 });
  for (const [x, col] of [[86.0, '#8a6a3a'], [86.4, '#5a7a8a'], [86.8, '#6b8a5a']] as const) cyl(c.b, k.M.paint, col, x, BCEIL - 0.25, 99, 0.07, 0.07, 19, 8, { chunk: c.chunk, rx: Math.PI / 2 });
  staticLantern(c, w, 93, BCEIL - 0.45, 107.4, 0.6, 0, 3, 7);
  // boiler room
  cyl(c.b, k.M.paint, '#3a3530', 104, BF, 105, 1.0, 1.1, 2.2, 14, { chunk: c.chunk });
  cyl(c.b, k.M.paint, '#b8682f', 104, BF + 2.2, 105, 0.12, 0.12, 0.6, 8, { chunk: c.chunk });
  c.col.addCircle(104, 105, 1.15, BF, BF + 2.6);
  box(c.b, k.M.paint, '#2a2622', 100.2, BF, 108.4, 1.6, 0.8, 1.2, { chunk: c.chunk });
  c.col.addBox(99.4, 101, 107.8, 109.4, BF, BF + 0.9);
  cyl(c.b, k.M.glow, '#ff7a3a', 104, BF + 0.6, 103.95, 0.25, 0.25, 0.02, 12, { chunk: c.chunk, rx: Math.PI / 2, shadow: false, jitter: 0 });
  w.lamps.push({ id: 'boiler.glow', pos: v3(104, BF + 0.8, 103.2), color: '#ff8a4a', intensity: 3, distance: 6, on: () => true, flicker: 0.1 });
  staticLantern(c, w, 100, BCEIL - 0.45, 103, 0.6, 0, 2.5, 6);
  // archive vault: file shelves + the service drawing
  for (let i = 0; i < 4; i++) {
    const x = 78.5 + i * 2.6;
    box(c.b, k.M.wood, '#6b4a2a', x, BF, 104.4, 0.5, 2.3, 5.0, { chunk: c.chunk, uv: 1 });
    c.col.addBox(x - 0.25, x + 0.25, 101.9, 106.9, BF, BF + 2.4);
    for (let s = 0; s < 4; s++) for (let j = 0; j < 7; j++) box(c.b, k.M.paint, ['#c8b48a', '#a88f62', '#d8c8a0'][(s + j + i) % 3], x + (j % 2 ? 0.27 : -0.27), BF + 0.2 + s * 0.55, 102.2 + j * 0.65, 0.04, 0.36, 0.5, { chunk: c.chunk });
  }
  canvasPanel(w, 82.5, BF + 1.6, 109.44, Math.PI, 2.2, 1.4, (x, W, H) => drawServiceDrawing(x, W, H), 768, '#4a3a2a');
  const sdHit = new THREE.Group(); place(sdHit, 82.5, BF + 1.0, 109.25, 0); w.scene.add(sdHit);
  makeInspect(w, g, { id: 'inspect.serviceDrawing', obj: sdHit, clue: 'c.serviceDrawing', hit: [2.3, 1.5, 0.3], hitOffset: [0, 0.6, 0], label: 'Bekijken: leidingtekening' });
  staticLantern(c, w, 82.5, BCEIL - 0.45, 107.6, 0.6, 0, 3, 7);
  staticLantern(c, w, 80, BCEIL - 0.45, 101.0, 0.6, 0, 2.5, 6);
  routeConsole(w, g, c);
  staticLantern(c, w, 83, BCEIL - 0.45, 95, 0.7, 0, 3.5, 8);
  // the tunnel door: bolted on the tunnel side (opened from BOSLUST's side → a late two-way shortcut)
  makeDoor(w, g, { id: 'door.tunnelManor', x: 76.85, z: 96.4, dir: 'z+', width: 1.2, height: 2.2, y0: BF, swing: 1, color: '#4a3a2a', style: 'plank', unlock: 'lock.tunnelBolt', lockedMsg: '' });
  const td = w.byId.get('door.tunnelManor')!;
  const tdRun = td.run;
  td.label = () => (g.state.unlocked.includes('lock.tunnelBolt') ? (g.state.open['door.tunnelManor'] ? 'Sluiten' : 'Openen') : g.playerXZ().x < 76.85 ? 'Grendel openschuiven' : 'Oude deur');
  td.run = () => {
    if (g.state.unlocked.includes('lock.tunnelBolt')) return tdRun();
    if (g.playerXZ().x < 76.85) {
      g.state.unlocked.push('lock.tunnelBolt');
      g.state.open['door.tunnelManor'] = true;
      g.act({ ok: true, msg: 'Je schuift de zware grendel open. De oude gang verbindt nu de kelder met de verzamelzaal.', sfx: 'unlock' });
      return;
    }
    g.act({ ok: false, msg: 'Een oude deur naar een gang. Hij zit aan de andere kant op de grendel.', sfx: 'locked' }, { save: false });
  };
}

function drawServiceDrawing(x: CanvasRenderingContext2D, W: number, H: number) {
  x.fillStyle = '#e8dcbc'; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#6b5a3a'; x.lineWidth = 4; x.strokeRect(10, 10, W - 20, H - 20);
  x.fillStyle = '#3a2a1a'; x.font = 'bold 30px Georgia'; x.textAlign = 'center';
  x.fillText('Leidingen onder het landgoed', W / 2, 48);
  const hub = { x: W * 0.5, y: H * 0.55 };
  const ends = [
    { id: 'muren', label: 'bibliotheek', sub: '(de muren)', x: W * 0.17, y: H * 0.3 },
    { id: 'water', label: 'zwembad in de serre', sub: '(het water)', x: W * 0.83, y: H * 0.3 },
    { id: 'paden', label: 'vuurplaats in het bos', sub: '(de paden)', x: W * 0.2, y: H * 0.84 },
  ];
  const dash: Record<string, number[]> = { muren: [], water: [22, 12], paden: [4, 10] };
  for (const e of ends) {
    x.setLineDash(dash[e.id]); x.strokeStyle = '#2b2118'; x.lineWidth = 7; x.lineCap = 'round';
    x.beginPath(); x.moveTo(e.x, e.y); x.lineTo(hub.x, hub.y); x.stroke();
    x.setLineDash([]); x.fillStyle = '#2b2118'; x.font = '22px Georgia'; x.fillText(e.label, e.x, e.y - 18);
    x.font = 'italic 18px Georgia'; x.fillText(e.sub, e.x, e.y + 34);
  }
  x.setLineDash([]); x.lineWidth = 9; x.strokeStyle = '#8a2f1a';
  x.beginPath(); x.moveTo(hub.x, hub.y); x.lineTo(W * 0.64, H * 0.88); x.stroke();
  x.fillStyle = '#8a2f1a'; x.beginPath(); x.arc(hub.x, hub.y, 14, 0, Math.PI * 2); x.fill();
  x.font = 'bold 20px Georgia'; x.fillText('routekamer', hub.x + 82, hub.y + 6);
  x.beginPath(); x.ellipse(W * 0.68, H * 0.93, 46, 18, 0, Math.PI, 0); x.fill();
  x.font = 'italic 18px Georgia'; x.fillText('heuvel', W * 0.68, H * 0.86 - 12);
  void ROUTE_LINES;
}

function routeConsole(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const x0 = 83, z0 = 90.3; // against the south wall of the route chamber, facing north
  box(c.b, k.M.wood, '#5a3a22', x0, BF, z0 + 0.35, 2.8, 1.0, 0.7, { chunk: c.chunk, uv: 1 });
  c.col.addBox(x0 - 1.45, x0 + 1.45, z0, z0 + 0.75, BF, BF + 1.1);
  for (let i = 0; i < 6; i++) cyl(c.b, k.M.paint, '#b8682f', x0 - 1.2 + i * 0.48, BF + 1.0, z0 + 0.1, 0.05, 0.05, 1.5, 8, { chunk: c.chunk });
  const map = canvasPanel(w, x0, BF + 1.95, z0 + 0.02, 0, 2.4, 1.2, (x, W, H) => drawRouteMap(x, W, H, false), 512, '#4a3a2a');
  const lit = canvasPanel(w, x0, BF + 1.95, z0 + 0.05, 0, 2.4, 1.2, (x, W, H) => drawRouteMap(x, W, H, true), 512, null, true);
  w.onSync(() => { lit.grp.visible = placeSolved(g.state, 'con'); map.grp.visible = !placeSolved(g.state, 'con'); });
  w.lamps.push({ id: 'route.map', pos: v3(x0, BF + 1.8, z0 + 1.0), color: '#ffcf6a', intensity: 3, distance: 6, on: () => placeSolved(g.state, 'con') });
  const sockets = new THREE.Group();
  place(sockets, x0, BF + 1.01, z0 + 0.4, 0);
  w.scene.add(sockets);
  const sealMesh: Record<string, THREE.Object3D> = {};
  const sealCol: Record<string, string> = { tableSeal: '#c4553d', archiveSeal: '#3f6fa8', trailSeal: '#4f8a3a' };
  CONSOLE_SOCKETS.forEach((id, i) => {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const x = cv.getContext('2d')!;
    x.fillStyle = '#c9a44c'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#5a3a10'; x.lineWidth = 6; x.strokeRect(4, 4, 120, 120);
    x.strokeStyle = '#2b2118'; x.lineWidth = 9; x.lineCap = 'round';
    x.setLineDash(id === 'muren' ? [] : id === 'water' ? [22, 12] : [3, 12]);
    x.beginPath(); x.moveTo(18, 104); x.lineTo(110, 104); x.stroke();
    x.setLineDash([]); x.fillStyle = '#7a5a1a'; x.beginPath(); x.arc(64, 52, 30, 0, Math.PI * 2); x.fill();
    const t = w.texture(new THREE.CanvasTexture(cv)); t.colorSpace = THREE.SRGBColorSpace;
    const tile = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), w.material(new THREE.MeshLambertMaterial({ map: t })));
    tile.rotation.x = -Math.PI / 2;
    tile.position.set((i - 1) * 0.75, 0.002, 0);
    sockets.add(tile);
  });
  for (const seal of ['tableSeal', 'archiveSeal', 'trailSeal']) {
    const m = compound((b) => { cyl(b, k.M.paint, sealCol[seal], 0, 0, 0, 0.12, 0.12, 0.03, 14); });
    sockets.add(m);
    sealMesh[seal] = m;
  }
  w.onSync(() => {
    const cur = slotContents(g.state, 'con');
    for (const seal of Object.keys(sealMesh)) {
      const slot = Object.entries(cur).find(([, v]) => v === seal)?.[0];
      sealMesh[seal].visible = !!slot;
      if (slot) sealMesh[seal].position.set((CONSOLE_SOCKETS.indexOf(slot) - 1) * 0.75, 0.02, 0.07);
    }
  });
  makeAction(w, {
    id: 'route.console', obj: sockets, hit: [2.6, 0.4, 0.7], hitOffset: [0, 0.1, 0],
    label: () => (placeSolved(g.state, 'con') ? 'Bekijken: routekaart' : 'Zegels in de kast leggen'),
    run: () => { if (addClue(g.state, 'c.routeConsole')) g.changed(); if (placeSolved(g.state, 'con')) g.inspect('c.routeRestored'); else g.openPanel('console'); },
  });
  const strip = compound((b) => { box(b, k.M.paint, '#f2e8d2', 0, 0, 0, 0.5, 0.004, 0.08); box(b, k.M.paint, '#3a2a1a', 0, 0.003, 0, 0.44, 0.002, 0.012); });
  place(strip, x0 + 1.1, BF + 1.015, z0 + 0.62, 0);
  w.scene.add(strip);
  makePickup(w, g, { id: 'pk.cipherStrip', item: 'cipherStrip', obj: strip, available: () => placeSolved(g.state, 'con'), hit: [0.6, 0.12, 0.3], after: () => g.inspect('c.letterstrook') });
}

function drawRouteMap(x: CanvasRenderingContext2D, W: number, H: number, lit: boolean) {
  x.fillStyle = lit ? '#2a2016' : '#d8c8a0'; x.fillRect(0, 0, W, H);
  x.fillStyle = lit ? '#3a4a2a' : '#a9c47a'; x.fillRect(16, 16, W - 32, (H - 32) * 0.48);
  x.fillStyle = lit ? '#24331f' : '#6f8c4a'; x.fillRect(16, 16 + (H - 32) * 0.48, W - 32, (H - 32) * 0.52);
  x.fillStyle = lit ? '#5a4a3a' : '#efe2c4'; x.fillRect(W * 0.42, H * 0.2, W * 0.16, H * 0.18);
  x.fillStyle = lit ? '#2f5a5a' : '#cfe8e4'; x.fillRect(W * 0.6, H * 0.18, W * 0.08, H * 0.16);
  x.fillStyle = lit ? '#4a3a2a' : '#8f7a5a'; x.beginPath(); x.ellipse(W * 0.35, H * 0.8, 36, 20, 0, 0, Math.PI * 2); x.fill();
  x.strokeStyle = lit ? '#ffcf6a' : '#5a4630'; x.lineWidth = lit ? 6 : 3; x.lineCap = 'round';
  const hub = [W * 0.48, H * 0.36];
  for (const [dx, dy, dash] of [[W * 0.44, H * 0.26, [] as number[]], [W * 0.64, H * 0.26, [16, 9]], [W * 0.14, H * 0.76, [3, 9]]] as const) {
    x.setLineDash([...dash]); x.beginPath(); x.moveTo(dx, dy); x.lineTo(hub[0], hub[1]); x.stroke();
  }
  x.setLineDash([]);
  if (lit) {
    x.lineWidth = 8; x.beginPath(); x.moveTo(hub[0], hub[1]); x.lineTo(W * 0.35, H * 0.8); x.stroke();
    x.fillStyle = '#ffe2a0'; x.font = 'bold 26px Georgia'; x.textAlign = 'center'; x.fillText('BOSLUST', W * 0.35, H * 0.8 + 52);
  }
}
