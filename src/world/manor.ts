// The manor (iteration 3): main block X 72–108, Z 80–110 (two storeys) + single-storey service wing
// X 108–116, Z 92–110 + basement under the north half. Room plan and portals live in roomdefs.ts.
//
// Ground floor: vestibule → double-height hall (grand stair along its east wall); living left (fireplace +
// mantel), dining right → kitchen behind it → service corridor → pantry / workshop / conservatory;
// back lobby (basement door) → billiard room; library (double height, upper gallery) behind the living room.
// Upstairs: gallery around the hall void, Reiskamer + Sterrenkamer (guest bedrooms), library gallery,
// bathroom, corridor → study, botanical/map room, north guest room (source id `storage`), shared linen.
// DEV-02 (v0.2 variant A, same footprint): guest WC off the back lobby, utility room in the service wing, rear
// landing loop (rearNook → rearNookEast → linen), a real attic reached by the U-shaped stair S03, with the store,
// the large weekend attic and the lookout (observatory reservation). Basement: stair → Kelderportaal → archive,
// boiler room, route chamber (tunnel door).
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, wall, floor, ceiling, stairsZ, railing, stairRail, hipRoof, gableRoof, windowAt, balustrade, newel, segBox, TRIM } from './arch';
import { lathe, Asm, artMats } from './artkit';
import { box, boxMM, cyl, blob, compound, v3, hipRoofGeo, geo } from './kit';
import {
  table, chair, sofa, armchair, bookshelf, counter, rug, plant, painting, crate, tableLamp, floorLamp, chandelier, wallSconce,
  part, staticLantern, staticSconce, bed2, bedside, wardrobe, curtains, desk, lectern, bathtub, ladder, telescope, canvasPanel, nameBoard, joinery,
} from './furniture';
import { makeDoor, makeDrawer, makePickup, makeLamp, makeInspect, makeAction, place } from '../interactions/props';
import { forestMapTexture } from './textures';
import { buildHearth } from './hearth';
import { ART, SLICE } from '../core/artflags';
import { sliceHall, sliceLibraryTable, sliceUpstairs } from '../slice/world';
import { livingRoomV2 } from './livingSample';
import { ContactShadows } from './artkit';
import { makeFire } from './fire';
import { drawSymbol } from '../content/symbols';
import { EMBLEMS, SERVICE, CATALOG, CONSOLE_SOCKETS, ROUTE_LINES } from '../content/canon';
import { addClue, has } from '../core/state';
import { GF, CEIL, UF, UCEIL, TOP, BF, BCEIL, AF, S03, roofUnderside } from './layout';
import { buildMaquette } from './maquette';
import { placeSolved, slotContents, openBasement } from '../puzzles/rules';

export { GF, CEIL, UF, UCEIL, TOP };

/** Chunks: 'manor' (exterior shell + inner skins), 'mIn' (ground + upper interiors), 'mB' (basement). */
export function buildManor(w: World, g: GameApi, c: Ctx, cIn: Ctx, cB: Ctx) {
  shell(w, c);
  interiorStructure(w, g, cIn);
  groundRooms(w, g, cIn);
  upperRooms(w, g, cIn);
  basement(w, g, cB);
  attic(w, g, cIn);
  w.checkpoints.push(
    { name: 'hall', pose: { x: 90, y: GF, z: 86, yaw: 0, pitch: 0 } },
    { name: 'landing', pose: { x: 89, y: UF, z: 100, yaw: Math.PI / 2, pitch: 0 } },
    { name: 'kitchen', pose: { x: 98.5, y: GF, z: 96, yaw: Math.PI / 2, pitch: 0 } },
    { name: 'library', pose: { x: 82.4, y: GF, z: 97.5, yaw: 0, pitch: 0 } },
    { name: 'ucorr', pose: { x: 100, y: UF, z: 97.3, yaw: Math.PI / 2, pitch: 0 } },
    { name: 'attic', pose: { x: 92, y: AF, z: 99.2, yaw: -Math.PI / 2, pitch: 0 } },
  );
}

// =====================================================================================================
// Exterior shell: stone walls with windows (both storeys), roof with dormers, porch, entrance bay, wing.
function shell(w: World, c: Ctx) {
  const k = c.k;
  const stone = { mat: k.M.stone, color: '#f2e6cc' };
  const skin = { mat: k.M.plaster, color: '#f1e6cf' };
  const ext = (axis: 'x' | 'z', f: number, a0: number, a1: number, exterior: 1 | -1, gfOpen: { at: number; w: number; h?: number }[], gfWin: number[], ufWin: number[]) => {
    wall(c, axis, f, a0, a1, 0, UF, { ...stone, t: 0.4, exterior, skin, uv: 2.4, winStyle: 'manor', openings: gfOpen, windows: gfWin.map((at) => ({ at, sill: 1.05, h: 1.6, w: 1.1 })) });
    wall(c, axis, f, a0, a1, UF, TOP, { ...stone, t: 0.4, exterior, skin, uv: 2.4, winStyle: 'manor', windows: ufWin.map((at) => ({ at, sill: 0.8, h: 1.5, w: 1.0 })) });
  };
  // south (front)
  ext('x', 80.2, 72, 108, -1, [{ at: 90, w: 1.7, h: 2.7 }], [75.5, 79, 82.5, 98, 101.5, 105], [75.5, 79, 82.5, 87.5, 92.5, 98, 101.5, 105]);
  // north (garden): billiard + kitchen garden doors, tall library windows
  ext('x', 109.8, 72, 108, 1, [{ at: 91.5, w: 1.2, h: 2.45 }, { at: 101, w: 1.0, h: 2.35 }], [75, 78.5, 82, 88, 97.5, 105], [75, 78.5, 82, 87.5, 92.5, 98, 104]);
  // west
  ext('z', 72.2, 80.4, 109.6, -1, [], [83, 90.5, 97, 101, 105], [82.5, 90, 97, 101, 105]);
  // east: dining windows; the service wing joins at z 92–110 (door to the service corridor)
  ext('z', 107.8, 80.4, 109.6, 1, [{ at: 102.5, w: 1.0, h: 2.3 }], [83, 86.8, 90.4], [83, 87, 91]);
  // DEV-03 facade grammar: a proud sandstone plinth with a weathered top, rusticated quoins at the corners, a string
  // course at the first floor and a moulded cornice under the eaves on all four sides (one family with the wing).
  const sand = '#cdbb98', dressed = TRIM.dressed;
  const ring = (y0: number, y1: number, proud: number, col: string, x0 = 72, x1 = 108, z0 = 80, z1 = 110, mat: THREE.Material = k.M.stone) => {
    boxMM(c.b, mat, col, x0 - proud, x1 + proud, y0, y1, z0 - proud, z0, { chunk: c.chunk, uv: 2, jitter: 0 });
    boxMM(c.b, mat, col, x0 - proud, x1 + proud, y0, y1, z1, z1 + proud, { chunk: c.chunk, uv: 2, jitter: 0 });
    boxMM(c.b, mat, col, x0 - proud, x0, y0, y1, z0, z1, { chunk: c.chunk, uv: 2, jitter: 0 });
    boxMM(c.b, mat, col, x1, x1 + proud, y0, y1, z0, z1, { chunk: c.chunk, uv: 2, jitter: 0 });
  };
  ring(-0.1, 0.62, 0.1, sand); // plinth
  ring(0.62, 0.7, 0.06, '#d9c9a6', 72, 108, 80, 110, k.M.paint); // weathered plinth top
  ring(UF - 0.12, UF + 0.08, 0.07, dressed, 72, 108, 80, 110, k.M.paint); // string course
  ring(TOP - 0.42, TOP - 0.26, 0.06, dressed, 72, 108, 80, 110, k.M.paint); // cornice: frieze band
  ring(TOP - 0.26, TOP - 0.12, 0.13, '#e9dcc0', 72, 108, 80, 110, k.M.paint); // corona
  ring(TOP - 0.12, TOP - 0.02, 0.2, '#f0e5cd', 72, 108, 80, 110, k.M.paint); // cymatium under the soffit
  // quoins: alternating long and short dressed blocks at the four corners, 4 cm proud
  for (const [qx, qz, sx2, sz2] of [[72, 80, -1, -1], [108, 80, 1, -1], [72, 110, -1, 1], [108, 110, 1, 1]] as const) {
    for (let i = 0, y = 0.7; y < TOP - 0.5; i++, y += 0.42) {
      const long = i % 2 === 0, la = long ? 0.62 : 0.34;
      boxMM(c.b, k.M.stone, dressed, qx + (sx2 < 0 ? -0.04 : -la), qx + (sx2 < 0 ? la : 0.04), y, y + 0.36, sz2 < 0 ? qz - 0.04 : qz - 0.02, sz2 < 0 ? qz + 0.02 : qz + 0.04, { chunk: c.chunk, uv: 1.2, jitter: 0.02 });
      boxMM(c.b, k.M.stone, dressed, sx2 < 0 ? qx - 0.04 : qx - 0.02, sx2 < 0 ? qx + 0.02 : qx + 0.04, y, y + 0.36, qz + (sz2 < 0 ? -0.04 : -(long ? 0.34 : 0.62)), qz + (sz2 < 0 ? (long ? 0.34 : 0.62) : 0.04), { chunk: c.chunk, uv: 1.2, jitter: 0.02 });
    }
  }
  // roof (≈30°) with a real eave (fascia, soffit, gutter, caps) and downpipes at the corners and either side of the bay
  hipRoof(c, 90, 95, 36, 30, TOP, 8.2, k.M.slate, '#a39f9a', 0.7, { downpipes: [[71.86, 80.5], [108.14, 80.5], [71.86, 109.5], [108.14, 109.5], [85.85, 79.88], [94.15, 79.88]] });
  // chimneys: stack with a projecting band and a cap, two pots each
  for (const [x, z] of [[72.9, 86.7], [100, 101], [86, 106]] as const) {
    box(c.b, k.M.stone, '#d9c8a6', x, 8, z, 1.2, 8.4, 1.2, { chunk: c.chunk, uv: 2 });
    box(c.b, k.M.paint, dressed, x, 15.6, z, 1.36, 0.14, 1.36, { chunk: c.chunk });
    box(c.b, k.M.paint, '#e2d4b8', x, 16.25, z, 1.32, 0.15, 1.32, { chunk: c.chunk });
    for (const d of [-0.28, 0.28]) cyl(c.b, k.M.paint, '#a5583c', x + d, 16.4, z, 0.13, 0.16, 0.5, 8, { chunk: c.chunk });
  }
  const dormer = (x: number, z: number, face: 'S' | 'N' | 'E' | 'W') => {
    const alongX = face === 'E' || face === 'W';
    const [fx, fz] = face === 'S' ? [0, -1] : face === 'N' ? [0, 1] : face === 'E' ? [1, 0] : [-1, 0];
    const top = TOP + 1.5;
    const sx = alongX ? 2.4 : 1.8, sz = alongX ? 1.8 : 2.4;
    const dx = x - fx * 1.0, dz = z - fz * 1.0;
    box(c.b, k.M.stone, '#efe2c4', dx, TOP - 0.2, dz, sx, top - TOP + 0.2, sz, { chunk: c.chunk, uv: 1.5 });
    gableRoof(c, dx, dz, 2.6, 2.1, top, 0.8, alongX, k.M.slate, '#9e9a94');
    // the dormer window: framed glass in a dressed surround (same grammar as the facade)
    const wx = dx + fx * (alongX ? 0.9 : 0), wz = dz + fz * (alongX ? 0 : 0.9);
    if (alongX) windowAt(c, 'z', wx + fx * 0.3, fx as 1 | -1, wz, TOP + 0.12, 0.8, 1.05, true, { kind: 'plain' });
    else windowAt(c, 'x', wz + fz * 0.3, fz as 1 | -1, wx, TOP + 0.12, 0.8, 1.05, true, { kind: 'plain' });
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
  for (const x of [86.4, 93.6]) for (let i = 0, y = 0.7; y < TOP - 0.5; i++, y += 0.42) { // quoins on the bay
    const la = i % 2 ? 0.3 : 0.55;
    boxMM(c.b, k.M.stone, dressed, x < 90 ? x - 0.04 : x - la, x < 90 ? x + la : x + 0.04, y, y + 0.36, 79.5, 79.56, { chunk: c.chunk, uv: 1.2, jitter: 0.02 });
  }
  boxMM(c.b, k.M.stone, '#e2d2b2', 86.2, 93.8, TOP, TOP + 0.25, 79.45, 80.05, { chunk: c.chunk });
  gableRoof(c, 90, 79.8, 0.6, 7.8, TOP + 0.25, 2.6, false, k.M.stone, '#f6ead0', false);
  for (const s2 of [-1, 1]) segBox(c, k.M.paint, '#ecdfc4', [90 + s2 * 3.95, TOP + 0.2, 79.42], [90, TOP + 2.9, 79.42], 0.12, 0.26); // raking cornice
  cyl(c.b, k.M.paint, dressed, 90, TOP + 1.0, 79.46, 0.62, 0.62, 0.06, 20, { chunk: c.chunk, rx: Math.PI / 2 }); // oculus ring
  cyl(c.b, k.M.glow, '#5f6f78', 90, TOP + 1.0, 79.44, 0.5, 0.5, 0.05, 16, { chunk: c.chunk, rx: Math.PI / 2, shadow: false, jitter: 0 });
  windowAt(c, 'x', 79.55, -1, 90, 4.0, 1.2, 1.6, true, { kind: 'manor' });
  // porch: two steps up to a stone landing, Tuscan columns (base, shaft, capital) carrying an entablature and a
  // shallow lead-covered roof with a fascia; lanterns either side of the door
  floor(c, 87.8, 92.2, 78.6, 80.0, GF, k.M.stone, '#d9ccb0', 0.4, true);
  boxMM(c.b, k.M.stone, '#cfc0a2', 87.5, 92.5, -0.1, 0.075, 78.25, 80.0, { chunk: c.chunk, uv: 1 });
  const colG = lathe([[0, 0], [0.24, 0], [0.24, 0.08], [0.2, 0.12], [0.19, 0.2], [0.165, 2.5], [0.2, 2.58], [0.23, 2.64], [0.23, 2.7], [0, 2.7]], 12);
  for (const x of [88.1, 91.9]) {
    c.b.add(k.M.stone, colG, new THREE.Matrix4().makeTranslation(x, GF, -78.85), '#efe4ca', c.chunk, true, 0);
    box(c.b, k.M.paint, dressed, x, GF + 2.7, 78.85, 0.5, 0.06, 0.5, { chunk: c.chunk }); // abacus
    c.col.addCircle(x, 78.85, 0.2, 0, 3);
  }
  colG.dispose();
  boxMM(c.b, k.M.paint, dressed, 87.7, 92.3, GF + 2.76, GF + 3.05, 78.6, 79.1, { chunk: c.chunk }); // architrave beam
  boxMM(c.b, k.M.paint, '#e8dcc2', 87.6, 92.4, GF + 3.05, GF + 3.15, 78.5, 80.0, { chunk: c.chunk }); // cornice
  boxMM(c.b, k.M.slate, '#7f8486', 87.55, 92.45, GF + 3.15, GF + 3.27, 78.45, 80.0, { chunk: c.chunk, uv: 1 }); // leaded flat roof
  boxMM(c.b, k.M.paint, '#6e6f6a', 87.55, 92.45, GF + 3.27, GF + 3.31, 78.45, 78.52, { chunk: c.chunk });
  for (const x of [88.8, 91.2]) staticLantern(c, w, x, 2.25, 79.7, 0.8, 0, 4, 7);
  // ---------------------------------------------------------------- service wing (single storey, own roof)
  const WH = 3.9;
  wall(c, 'x', 92.2, 107.6, 116, 0, WH, { ...stone, t: 0.4, exterior: -1, skin, uv: 2.4, winStyle: 'manor', openings: [{ at: 112, w: 1.1, h: 2.3 }], windows: [{ at: 110, sill: 1.1, h: 1.3, w: 1.0 }, { at: 114.4, sill: 1.1, h: 1.3, w: 0.8 }] });
  wall(c, 'x', 109.8, 107.6, 116, 0, WH, { ...stone, t: 0.4, exterior: 1, skin, uv: 2.4, winStyle: 'manor', windows: [{ at: 112, sill: 1.2, h: 1.1, w: 1.0 }] });
  wall(c, 'z', 115.8, 92.4, 109.6, 0, WH, { ...stone, t: 0.4, exterior: 1, skin, uv: 2.4, openings: [{ at: 102.5, w: 1.3, h: 2.35 }] });
  ring(-0.1, 0.62, 0.1, sand, 108, 116, 92.2, 109.8);
  ring(WH - 0.3, WH - 0.14, 0.08, dressed, 108, 116, 92.2, 109.8, k.M.paint);
  hipRoof(c, 112, 101, 8, 18, WH, 2.6, k.M.slate, '#a39f9a', 0.5, { downpipes: [[116.14, 92.6]] });
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
  floor(c, 72.4, 85, 80.4, 94, GF, k.M.wood, ART.set === 'sample' ? '#9c7552' : '#b07e4e', 0.2, false, 2.2); // living (sample: less orange oak)
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
    if (x < 85 && ART.set !== 'sample') boxMM(c.b, k.M.wood, '#6b4426', x - 0.1, x + 0.1, CEIL - 0.22, CEIL, 80.4, 94, { chunk: c.chunk, uv: 1.5 }); // sample: livingSample beams
    if (x > 95) boxMM(c.b, k.M.wood, '#6b4426', x - 0.1, x + 0.1, CEIL - 0.22, CEIL, 80.4, 109.6, { chunk: c.chunk, uv: 1.5 });
  }
  // upper ceiling with the S03 stairwell left open (X 95–99 / Z 99.8–105.6; the upper landing covers Z 98.6–99.8)
  for (const [x0, x1, z0, z1] of [[72.4, 107.6, 80.4, 99.8], [72.4, 95, 99.8, 109.6], [99, 107.6, 99.8, 109.6], [95, 99, 105.6, 109.6]] as const) ceiling(c, x0, x1, z0, z1, UCEIL, '#efe4cc');
  ceiling(c, 108.4, 115.6, 92.4, 109.6, CEIL + 0.4, '#efe4cc');

  // ---------------------------------------------------------------- ground-floor partitions
  const P = { t: 0.16, mat: k.M.plaster, color: '#f3e9d4', uv: 2.4 };
  wall(c, 'z', 85, 80.4, 94, GF, CEIL, { ...P, openings: [{ at: 88.5, w: 3.0, h: 2.6 }] }); // living | hall
  wall(c, 'z', 95, 80.4, 92, GF, CEIL, { ...P, openings: [{ at: 85.2, w: 1.9, h: 2.6 }] }); // hall | dining (south of the stair foot)
  wall(c, 'x', 84, 85, 95, GF, CEIL, { ...P, openings: [{ at: 90, w: 2.4, h: 2.75 }] }); // vestibule | hall
  wall(c, 'x', 98, 85, 92, GF, CEIL, { ...P, openings: [{ at: 88.5, w: 4.2, h: 2.7 }] }); // hall | lobby
  wall(c, 'z', 85, 94, 109.6, GF, CEIL, { ...P, openings: [{ at: 101, w: 1.0, h: 2.3 }] }); // library | lobby/billiard
  wall(c, 'x', 94, 72.4, 85, GF, CEIL, { ...P, openings: [{ at: 79, w: 1.6, h: 2.4 }] }); // living | library
  wall(c, 'x', 104, 85, 92, GF, CEIL, { ...P, openings: [{ at: 86.5, w: 0.9, h: 2.25 }, { at: 90, w: 1.0, h: 2.3 }] }); // lobby | guest WC, billiard
  wall(c, 'z', 88, 104, 107, GF, CEIL, P); // guest WC | billiard (v0.2 guestWC X 85–88 / Z 104–107)
  wall(c, 'x', 107, 85, 88, GF, CEIL, P);
  wall(c, 'z', 95, 92, 109.6, BF, CEIL, P); // kitchen | stairwell/billiard (down to the basement floor)
  wall(c, 'x', 92, 95, 107.6, GF, CEIL, { ...P, openings: [{ at: 101, w: 2.0, h: 2.5 }] }); // dining | kitchen
  // basement stairwell enclosure (west side has the sealed door; walls run down to the basement floor)
  wall(c, 'z', 92, 98, 104.8, GF, CEIL, { ...P, openings: [{ at: 98.9, w: 1.0, h: 2.3 }] });
  wall(c, 'z', 92, 98, 104.8, BF, GF, P);
  wall(c, 'x', 98, 92, 95, BF, CEIL, P);
  wall(c, 'x', 104.8, 92, 95, GF, CEIL, P);
  // service wing partitions
  wall(c, 'x', 101, 108.4, 115.6, GF, CEIL + 0.4, { ...P, openings: [{ at: 112, w: 1.0, h: 2.3 }] }); // workshop | corridor
  wall(c, 'x', 104, 108.4, 115.6, GF, CEIL + 0.4, { ...P, openings: [{ at: 112, w: 1.0, h: 2.3 }, { at: 114.45, w: 1.1, h: 2.3 }] }); // corridor | pantry, utility
  wall(c, 'z', 113.3, 104, 109.6, GF, CEIL + 0.4, P); // pantry | utility (v0.2: pantry X 108.4–113.3, utility 113.3–115.6)
  // wainscot in the hall
  for (const [f, a0, a1] of [[85.09, 84.2, 86.9], [94.91, 86.3, 89.0]] as const) box(c.b, k.M.wood, '#6b4426', f, GF, (a0 + a1) / 2, 0.04, 1.0, a1 - a0, { chunk: c.chunk, uv: 1 });

  // ---------------------------------------------------------------- upstairs partitions
  const U = { t: 0.16, mat: k.M.plaster, color: '#efe2c8', uv: 2.4 };
  wall(c, 'z', 85, 80.4, 109.6, CEIL, UCEIL, { ...U, openings: [{ at: 82.2, w: 0.95, h: 2.3 }, { at: 90.2, w: 0.95, h: 2.3 }, { at: 100, w: 1.0, h: 2.3 }] });
  wall(c, 'x', 86.8, 72.4, 85, CEIL, UCEIL, U); // reis | sterren
  wall(c, 'x', 94, 72.4, 85, CEIL, UCEIL, U); // sterren | library volume
  wall(c, 'z', 95, 80.4, 109.6, CEIL, UCEIL, { ...U, openings: [{ at: 97.3, w: 2.0, h: 2.5 }, { at: 107.6, w: 1.2, h: 2.4 }] }); // hall/landing | east; rearNook | rearNookEast
  wall(c, 'x', 96, 95, 107.6, CEIL, UCEIL, { ...U, openings: [{ at: 98.2, w: 0.95, h: 2.3 }, { at: 104.5, w: 0.95, h: 2.3 }] });
  wall(c, 'z', 101.3, 80.4, 96, CEIL, UCEIL, U); // study | botanic
  wall(c, 'x', 98.6, 95, 107.6, CEIL, UCEIL, { ...U, openings: [{ at: 97, w: 1.2, h: 2.3 }, { at: 101, w: 0.95, h: 2.3 }] }); // ucorr | attic stair, north guest room
  wall(c, 'x', 104, 85, 95, CEIL, UCEIL, { ...U, openings: [{ at: 87.5, w: 0.9, h: 2.3 }, { at: 92, w: 1.2, h: 2.4 }] }); // landing | bath, rear nook
  wall(c, 'z', 90, 104, 109.6, CEIL, UCEIL, U); // bath | rear nook
  wall(c, 'z', 99, 98.6, 109.6, CEIL, UCEIL, { ...U, openings: [{ at: 108, w: 1.0, h: 2.2 }] }); // attic stair + rear nook east | guest room, linen
  wall(c, 'x', 106.6, 99, 107.6, CEIL, UCEIL, U); // north guest room | linen
  wall(c, 'x', 105.6, 95, 99, CEIL, UCEIL, { ...U, openings: [{ at: 97, w: 1.0, h: 2.2 }] }); // attic stair | rear nook east
  railing(c, 'z', 86.8, 84, 95.5, UF);
  railing(c, 'x', 84, 86.8, 95, UF);
  railing(c, 'x', 95.5, 86.8, 93, UF);
  railing(c, 'z', 83.2, 94, 107.8, UF, '#4a2f1a');
  railing(c, 'x', 107.8, 72.4, 83.2, UF, '#4a2f1a');
  // grand stair along the hall's east wall, with a sloped handrail on its open side
  stairsZ(c, 93.05, 94.92, 86.5, 95.5, GF, UF);
  balustrade(c, 'z', 93.12, 86.6, 95.5, GF + 0.02, UF, '#5e3b1f', 0.95, 0.24); // turned balusters, rounded handrail
  newel(c, 93.12, GF, 86.35, '#4a2f1a', 1.3); // a heavier newel at the foot
  // DEV-02: the open side of the flight has a real railing collider over its full height (DEV-01 review: you could
  // step off the stair into the hall). Outside the flight's width, so walking ON the stair is never touched.
  c.col.addBox(92.97, 93.12, 86.5, 95.5, GF, UF + 1.1, { tag: 'railing.S01' });
  // basement stair (descends north from the sealed door)
  stairsZ(c, 92.08, 94.92, 104.8, 99.6, BF, GF, '#6b4a2a', undefined, { mass: '#cbbd9f', runner: false });

  // ---------------------------------------------------------------- doors
  makeDoor(w, g, { id: 'door.front', x: 89.15, z: 80.2, dir: 'x+', width: 1.7, height: 2.62, y0: GF, swing: 1, color: '#6b3f22', key: 'frontKey', thickness: 0.09 });
  makeDoor(w, g, { id: 'door.library', x: 85, z: 100.5, dir: 'z+', width: 1.0, height: 2.25, y0: GF, swing: -1, color: '#5a3520' });
  makeDoor(w, g, { id: 'door.billiard', x: 89.5, z: 104, dir: 'x+', width: 1.0, height: 2.25, y0: GF, swing: 1 }); // v0.2: moved east for the WC (same id/state)
  makeDoor(w, g, { id: 'door.guestWC', x: 86.05, z: 104, dir: 'x+', width: 0.9, height: 2.2, y0: GF, swing: 1, color: '#efe6d6' });
  makeDoor(w, g, { id: 'door.utility', x: 113.9, z: 104, dir: 'x+', width: 1.1, height: 2.25, y0: GF, swing: 1, style: 'plank', color: '#7a5a3a' });
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
  makeDoor(w, g, { id: 'door.storage', x: 100.52, z: 98.6, dir: 'x+', width: 0.95, height: 2.2, y0: UF, swing: 1, color: '#7a5a3a' });
  makeDoor(w, g, { id: 'door.atticStair', x: 96.4, z: 98.6, dir: 'x+', width: 1.2, height: 2.2, y0: UF, swing: 1, style: 'plank', color: '#8a6a4a' });
  makeDoor(w, g, { id: 'door.atticRear', x: 96.5, z: 105.6, dir: 'x+', width: 1.0, height: 2.2, y0: UF, swing: -1, style: 'plank', color: '#8a6a4a' });
  makeDoor(w, g, { id: 'door.linen', x: 99, z: 107.5, dir: 'z+', width: 1.0, height: 2.1, y0: UF, swing: -1, color: '#efe6d6' });
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
  // DEV-01: no room-name plaques and no emblem evidence on the doors (B01 v0.2 is solved from the rooms' contents)
  if (!SLICE) plaques(w, c);
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
  // a woven hanging above the stair, on an oak rod with finials (DEV-03: was a carpet glued flat to the wall)
  boxMM(c.b, k.M.rug, '#e8d8c4', 94.84, 94.88, 3.95, 5.85, 88.5, 90.2, { chunk: c.chunk, shadow: false });
  cyl(c.b, k.M.wood, '#6e4a2c', 94.8, 5.88, 89.35, 0.025, 0.025, 2.0, 8, { chunk: c.chunk, rx: Math.PI / 2 });
  for (const zz of [88.33, 90.37]) blob(c.b, k.M.wood, '#6e4a2c', 94.8, 5.9, zz, 0.045, 0.045, 0.045, { chunk: c.chunk });
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
  // DEV-01: picking the register up does not read it (pickup ≠ observation); it is read from the bag
  makePickup(w, g, { id: 'pk.ledger', item: 'ledger', obj: ledger, available: hallDrawer.isOpen, hit: [0.3, 0.12, 0.36], after: SLICE ? undefined : () => g.inspect('c.ledger') });
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
  // DEV-02: the maquette (a miniature of this house) on a presentation table against the west wall, inspectable
  buildMaquette(w, g, c);
  if (SLICE) sliceHall(w, g, c); // DEV-01 DS01 A: the folded note at the south end of the maquette table
  // four red shopping crates (ES.hallCrates): stacked against the west wall, off console, mantel arch and stair
  for (const [z, y] of [[96.25, 0], [96.95, 0], [96.25, 0.3], [96.95, 0.3]] as const) redCrate(c, 85.55, z, GF + y, Math.PI / 2);
  c.col.addBox(85.15, 85.95, 95.9, 97.3, 0, GF + 0.62);

  // ---------------------------------------------------------------- living room (west, front)
  if (ART.set === 'sample') {
    // art-refresh interior sample (review mode / ?art=sample): same gameplay contract, new assets
    const sh = new ContactShadows();
    buildHearth(w, g, c, { id: 'fire.living', x: 72.4, z: 86.7, y: GF, facing: Math.PI / 2, ceil: CEIL, mantel: true, defaultLit: true, style: 'v2', shadows: sh });
    livingRoomV2(w, g, c, sh);
    sh.build(w.scene, c.chunk);
  } else {
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
  }

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
  // ES.gameTable: the home-made duo board game, cards, dice and beer at the south end of the table (eat/game room)
  boxMM(c.b, k.M.paint, '#e8d8b0', 100.95, 101.65, GF + 0.76, GF + 0.775, 84.0, 84.7, { chunk: c.chunk });
  for (let i = 0; i < 4; i++) box(c.b, k.M.paint, ['#c4553d', '#3f6fa8', '#4f8a3a', '#e8c547'][i], 101.05 + (i % 2) * 0.5, GF + 0.775, 84.1 + Math.floor(i / 2) * 0.5, 0.05, 0.05, 0.05, { chunk: c.chunk });
  for (let i = 0; i < 2; i++) box(c.b, k.M.paint, '#f5f0e6', 100.85 + i * 0.85, GF + 0.76, 85.0, 0.06, 0.06, 0.06, { chunk: c.chunk, yaw: i });
  box(c.b, k.M.paint, '#f2ead8', 101.75, GF + 0.76, 87.95, 0.12, 0.03, 0.18, { chunk: c.chunk, yaw: 0.3 });
  for (const [x, z] of [[100.8, 84.2], [101.85, 84.75], [100.8, 88.2]] as const) cyl(c.b, k.M.paint, '#6a4a1a', x, GF + 0.76, z, 0.03, 0.035, 0.22, 6, { chunk: c.chunk });
  // separate marshmallow / chubby-bunny / shots group on its own small table (not on the A01 sideboard)
  table(c, 96.2, 90.6, GF, 0.6, 0.6, 0, '#6b4426', 0.7);
  blob(c.b, k.M.paint, '#f4f0e8', 96.1, GF + 0.78, 90.5, 0.12, 0.08, 0.1, { chunk: c.chunk });
  for (let i = 0; i < 4; i++) cyl(c.b, k.M.glass, '#ffffff', 96.0 + (i % 2) * 0.18, GF + 0.7, 90.75 + Math.floor(i / 2) * 0.12, 0.025, 0.02, 0.06, 6, { chunk: c.chunk });
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
  for (let i = 0; i < 4; i++) cyl(c.b, k.M.paint, '#6b4426', 109.6 + i * 0.4, GF + 1.6, 103.85, 0.02, 0.02, 0.12, 5, { chunk: c.chunk, rx: Math.PI / 2 });
  // Francois' Copacabana Room — personal name board at the inner approach (P exception: no emblem/tab function)
  nameBoard(w, 114.5, GF + 1.75, 101.1, 0);
  // utility (v0.2): two machines side by side on the east wall, a sink and towel rails; daily household, no puzzle
  for (const z of [107.4, 108.1]) { box(c.b, k.M.paint, '#f2f0ea', 115.2, GF, z, 0.6, 0.85, 0.62, { chunk: c.chunk }); cyl(c.b, k.M.glass, '#ffffff', 114.89, GF + 0.42, z, 0.18, 0.18, 0.02, 14, { chunk: c.chunk, rz: Math.PI / 2 }); }
  c.col.addBox(114.9, 115.55, 107.05, 108.45, 0, GF + 0.9);
  box(c.b, k.M.paint, '#d8d4c8', 115.25, GF, 106.2, 0.6, 0.9, 0.9, { chunk: c.chunk });
  box(c.b, k.M.paint, '#bfc8cc', 115.2, GF + 0.9, 106.2, 0.45, 0.04, 0.6, { chunk: c.chunk });
  c.col.addBox(114.9, 115.55, 105.75, 106.65, 0, GF + 0.95);
  for (let i = 0; i < 3; i++) box(c.b, k.M.paint, ['#6fae9a', '#f2ead8', '#9aa8d8'][i], 113.42, GF + 1.0 + i * 0.35, 106.6 + i * 0.6, 0.04, 0.5, 0.45, { chunk: c.chunk });
  staticLantern(c, w, 114.45, CEIL - 0.1, 107.6, 0.45, 0, 2, 4);
  // guest WC (v0.2): toilet and hand basin; daily credibility, no clue
  box(c.b, k.M.paint, '#f4f1ea', 85.55, GF, 106.2, 0.45, 0.42, 0.65, { chunk: c.chunk });
  box(c.b, k.M.paint, '#f4f1ea', 85.32, GF + 0.42, 106.45, 0.2, 0.45, 0.4, { chunk: c.chunk });
  c.col.addBox(85.1, 85.85, 105.85, 106.75, 0, GF + 0.85);
  box(c.b, k.M.paint, '#f4f1ea', 87.65, GF + 0.75, 105.3, 0.4, 0.15, 0.5, { chunk: c.chunk });
  box(c.b, k.M.glow, '#cfe0e6', 87.9, GF + 1.2, 105.3, 0.02, 0.6, 0.45, { chunk: c.chunk, shadow: false });
  staticSconce(c, w, 87.88, 2.2, 104.5, -Math.PI / 2, 1.5, 3);
  for (const x of [109.0]) {
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
  const deskDrawer = makeDrawer(w, g, { id: 'library.desk', x: tx + 0.36, y: GF + 0.68, z: tz, yaw: Math.PI / 2, w: 0.9, h: 0.12, d: 0.6, color: '#6b4426', unlock: 'lock.libraryDesk', lockedLabel: 'Lade (dicht)', onLocked: () => g.toast(SLICE ? 'De lade van de leestafel zit dicht. Er zit geen sleutelgat in.' : 'De lade van de leestafel zit dicht. Een kaartje op tafel: “Elk boek terug in het vak van zijn kamer.”') });
  if (SLICE) sliceLibraryTable(w, g, c, deskDrawer); // DEV-01 B01 v0.2 table + DS01 B (album, drying letter)
  else libraryCatalogue(w, g, c, tx, tz, deskDrawer);
  libraryRest(w, g, c, tx, tz);
}

/** Iteration-3 catalogue (emblem → room → tab). Replaced by B01 v0.2 in the DEV-01 review build. */
function libraryCatalogue(w: World, g: GameApi, c: Ctx, tx: number, tz: number, deskDrawer: ReturnType<typeof makeDrawer>) {
  const k = c.k;
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
}

function libraryRest(w: World, g: GameApi, c: Ctx, tx: number, tz: number) {
  const k = c.k;
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
  // floor globe: an oak tripod with a horizon ring, a brass meridian, the globe itself (sea + a few land masses)
  { const M = artMats(), a = new Asm(c.b, c.chunk, 82.4, GF, 108.2, 0.6);
    for (let i = 0; i < 3; i++) { const an = (i / 3) * Math.PI * 2; a.add(M.timber, '#5a3a22', joinery.bx(0.035, 0.75, 0.035), Math.cos(an) * 0.2, 0.37, Math.sin(an) * 0.2, { rx: Math.sin(an) * 0.22, rz: -Math.cos(an) * 0.22 }); }
    a.add(M.timber, '#6e4a2c', joinery.cg('globeHorizon', () => new THREE.TorusGeometry(0.29, 0.025, 5, 24).rotateX(Math.PI / 2)), 0, 0.98, 0);
    a.add(M.brass, '#c9a14e', joinery.cg('globeMeridian', () => new THREE.TorusGeometry(0.265, 0.012, 4, 24)), 0, 0.98, 0, { rz: 0.4 });
    a.add(M.ceramic, '#6f91a6', joinery.cg('globeBall', () => new THREE.IcosahedronGeometry(0.25, 2)), 0, 0.98, 0);
    for (const [dx, dy, dz, sx] of [[0.12, 0.08, 0.19, 0.11], [-0.18, 0.04, 0.14, 0.09], [0.05, -0.12, 0.2, 0.07], [-0.08, 0.15, -0.18, 0.1]] as const) a.add(M.paint, '#b8a070', joinery.cg('globeLand', () => new THREE.IcosahedronGeometry(1, 1)), dx, 0.98 + dy, dz, { s: [sx, sx * 0.7, 0.03] , ry: Math.atan2(dx, dz) });
  }
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
  const bl = floorLamp(w, 88.6, GF, 108.9); // v0.2: moved out of the new guest WC (same lamp id)
  makeLamp(w, g, { id: 'lamp.billiard', ...bl, name: 'staande lamp', defaultOn: false, hit: [0.5, 1.9, 0.5], intensity: 5, distance: 8, patch: { y: GF + 0.03, r: 1.5 } });
}

// ---------------------------------------------------------------- kitchen
function kitchen(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  // DEV-03 composition: a range cooker under a chimney hood is the focal point of the north run (between the back
  // door and the window), the sink sits under the window, open shelves with crockery over the east run, a pot rack
  // over the island. Footprints of the runs, the island, the table and every interactable are unchanged.
  counter(c, 96.6, 109.25, GF, Math.PI, 2.6);
  counter(c, 101.95, 109.25, GF, Math.PI, 0.7);
  rangeCooker(c, 102.9, 109.25, GF);
  counter(c, 105.35, 109.25, GF, Math.PI, 3.7);
  counter(c, 107.25, 95.5, GF, -Math.PI / 2, 5.0);
  kitchenDressing(c);
  table(c, 101.0, 100.0, GF, 1.2, 3.0, 0, '#8a5a33');
  for (let i = 0; i < 3; i++) { chair(c, 100.0, 98.9 + i * 1.1, GF, Math.PI / 2, '#6f8a7a'); chair(c, 102.0, 98.9 + i * 1.1, GF, -Math.PI / 2, '#6f8a7a'); }
  kitchenIsland(c, 101, 105.4); // same footprint and collider as before; the drawer (centre, south face) is untouched
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
  // ES.kitchenCrates: eight red shopping crates (two stacks of four, against the counter's west face); beer crates apart
  for (let i = 0; i < 8; i++) redCrate(c, 106.6, 94.0 + (i % 4) * 0.45, GF + Math.floor(i / 4) * 0.3, 0);
  c.col.addBox(106.28, 106.92, 93.78, 95.57, 0, GF + 0.62);
  for (const [x, z] of [[105.6, 92.55], [106.1, 92.55]] as const) { beerCrate(c, x, z, GF, '#e8b030'); beerCrate(c, x, z, GF + 0.3, '#2f5a2a'); }
  c.col.addBox(105.35, 106.35, 92.35, 92.75, 0, GF + 0.6);
}

/**
 * Red plastic shopping crate (0.6 × 0.4 × 0.3), long side along `yaw`. Visual only; callers add one collider per stack.
 * DEV-03: an open crate — floor, ribbed walls with two slots between the ribs, a rolled rim, a hand-grip slot in each
 * short side — instead of a solid red block.
 */
function redCrate(c: Ctx, x: number, z: number, y0: number, yaw: number) {
  const { bx } = joinery, M = artMats();
  const a = new Asm(c.b, c.chunk, x, y0, z, yaw + Math.PI / 2), red = '#c8322a', dk = '#7a1c18';
  a.add(M.paint, dk, bx(0.38, 0.02, 0.58), 0, 0.01, 0); // floor (seen from above: the dark inside)
  for (const s2 of [-1, 1]) {
    a.add(M.paint, red, bx(0.4, 0.035, 0.02), 0, 0.2875, s2 * 0.29); // rim (short sides)
    a.add(M.paint, red, bx(0.02, 0.035, 0.6), s2 * 0.19, 0.2875, 0); // rim (long sides)
    for (const yy of [0.025, 0.115, 0.2]) {
      a.add(M.paint, red, bx(0.4, 0.04, 0.016), 0, yy, s2 * 0.292);
      a.add(M.paint, red, bx(0.016, 0.04, 0.6), s2 * 0.192, yy, 0);
    }
    for (const q of [-1, 0, 1]) { a.add(M.paint, red, bx(0.04, 0.3, 0.018), q * 0.17, 0.15, s2 * 0.291); a.add(M.paint, red, bx(0.018, 0.3, 0.04), s2 * 0.191, 0.15, q * 0.27); }
    a.add(M.paint, '#3a1210', bx(0.12, 0.035, 0.022), 0, 0.245, s2 * 0.294); // grip slot
  }
}
/** A crate of beer (0.42 × 0.3 × 0.3): coloured crate with a darker label panel, 24 bottle caps showing on top. */
function beerCrate(c: Ctx, x: number, z: number, y0: number, col: string) {
  const { bx, sb } = joinery, M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, 0);
  a.add(M.paint, col, sb(0.42, 0.28, 0.3, 0.01), 0, 0.14, 0);
  for (const s2 of [-1, 1]) a.add(M.paint, new THREE.Color(col).multiplyScalar(0.7), bx(0.3, 0.12, 0.012), 0, 0.15, s2 * 0.152);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) a.add(M.paint, '#2e3a2a', bx(0.045, 0.03, 0.045), -0.175 + i * 0.07, 0.295, -0.105 + j * 0.07);
}

/** Cream enamel range cooker (1.2 m) against the north wall: two oven doors, a black hob with four rings, a brass rail;
 * a tiled splashback and a plastered chimney hood with an oak mantel shelf above it. */
function rangeCooker(c: Ctx, x: number, z: number, y0: number) {
  const { bx, sb, cg } = joinery, M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, Math.PI), cream = '#e6dcc4';
  a.add(M.ceramic, cream, sb(1.2, 0.86, 0.62, 0.02), 0, 0.47, 0.02);
  a.add(M.paint, '#2a2622', bx(1.16, 0.04, 0.58), 0, 0.92, 0.02);
  for (const q of [-1, 1]) for (const r2 of [-1, 1]) a.add(M.paint, '#151311', cg('burner', () => new THREE.CylinderGeometry(0.09, 0.1, 0.02, 12)), q * 0.28, 0.95, 0.02 + r2 * 0.14);
  for (const q of [-1, 1]) {
    a.add(M.ceramic, '#d8ccb2', sb(0.52, 0.5, 0.02, 0.01), q * 0.29, 0.42, 0.335);
    a.add(M.paint, '#2a2622', bx(0.3, 0.18, 0.01), q * 0.29, 0.5, 0.346);
    a.add(M.brass, '#c9a14e', bx(0.4, 0.02, 0.025), q * 0.29, 0.7, 0.36);
  }
  a.add(M.brass, '#c9a14e', cg('rangeRail', () => new THREE.CylinderGeometry(0.012, 0.012, 1.1, 6).rotateZ(Math.PI / 2)), 0, 0.82, 0.38);
  a.add(M.paint, '#3a3430', bx(1.18, 0.08, 0.5), 0, 0.04, 0);
  // splashback (small ceramic-blue tiles: a band, tinted per course) and the hood with an oak mantel shelf
  for (let r2 = 0; r2 < 5; r2++) a.add(M.ceramic, r2 % 2 ? '#7f9fb2' : '#6f91a6', bx(1.3, 0.11, 0.012), 0, 1.02 + r2 * 0.12, -0.32);
  a.add(M.timber, '#6e4a2c', sb(1.45, 0.06, 0.26, 0.01), 0, 1.72, -0.2);
  a.add(M.paint, '#ece3d0', sb(1.35, 0.42, 0.5, 0.03), 0, 1.96, -0.07);
  a.add(M.paint, '#ece3d0', bx(0.8, 0.9, 0.38), 0, 2.6, -0.14);
  c.col.addBox(x - 0.6, x + 0.6, z - 0.33, z + 0.33, 0, y0 + 0.95);
}
/** The kitchen island (2.6 × 1.0): recessed plinth, panelled doors either side of the central drawer (an interactable
 * built separately), stools on the north side, a stone top with an overhang for the stools. */
function kitchenIsland(c: Ctx, x: number, z: number) {
  const { bx, sb, taperLeg } = joinery, M = artMats(), a = new Asm(c.b, c.chunk, x, GF, z, Math.PI), body = '#7f9a8a', gap = '#46564e';
  a.add(M.paint, '#4a4038', bx(2.5, 0.1, 0.9), 0, 0.05, 0);
  a.add(M.paint, gap, bx(2.6, 0.74, 1.0), 0, 0.47, 0);
  for (const sd of [-1, 1]) for (const px of [-0.85, -0.5, 0.5, 0.85]) {
    if (sd < 0 && Math.abs(px) < 0.6) continue; // south face: the centre is the drawer's
    a.add(M.paint, body, sb(0.33, 0.66, 0.022, 0.004), px, 0.45, sd * -0.51);
    a.add(M.brass, '#c9a44c', bx(0.012, 0.1, 0.02), px + 0.12 * Math.sign(px), 0.55, sd * -0.525);
  }
  a.add(M.paint, body, sb(0.66, 0.4, 0.022, 0.004), 0, 0.3, 0.51); // door under the drawer (south face)
  a.add(M.stone, '#d8cdb8', sb(2.7, 0.05, 1.3, 0.006), 0, 0.885, -0.1);
  // two stools tucked under the overhang (north side)
  for (const px of [-0.6, 0.6]) {
    const st = new Asm(c.b, c.chunk, x + px, GF, z + 0.95, 0);
    for (const [lx, lz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]] as const) st.add(M.timber, '#5a3a22', taperLeg(0.62, 0.022, 0.018), lx, 0, lz);
    st.add(M.timber, '#6e4a2c', sb(0.36, 0.04, 0.36, 0.012), 0, 0.64, 0);
    st.add(M.timber, '#5a3a22', bx(0.28, 0.02, 0.02), 0, 0.25, -0.14); st.add(M.timber, '#5a3a22', bx(0.28, 0.02, 0.02), 0, 0.25, 0.14);
    c.col.addCircle(x + px, z + 0.95, 0.22, 0, 0.7);
  }
}

/** Kitchen dressing (visual only): sink under the north window, open shelves with crockery, a pot rack, small props. */
function kitchenDressing(c: Ctx) {
  const { bx, sb, cg } = joinery, M = artMats();
  // farmhouse sink in the run under the window (x 105): white apron, dark basin, brass bridge tap
  const s = new Asm(c.b, c.chunk, 105, GF, 109.25, Math.PI);
  s.add(M.ceramic, '#f4f1ea', sb(0.8, 0.26, 0.5, 0.02), 0, 0.78, 0.1);
  s.add(M.paint, '#8a8c88', bx(0.68, 0.01, 0.38), 0, 0.905, 0.08);
  s.add(M.brass, '#c9a14e', cg('tap', () => new THREE.TorusGeometry(0.1, 0.012, 5, 10, Math.PI)), 0, 0.96, -0.2);
  s.add(M.brass, '#c9a14e', bx(0.03, 0.12, 0.03), 0, 0.97, -0.25);
  // open oak shelves on brackets over the east run, with plates on edge, bowls and jars
  const sh = new Asm(c.b, c.chunk, 107.45, GF, 95.5, -Math.PI / 2);
  for (const yy of [1.55, 1.98]) {
    sh.add(M.timber, '#7e5636', sb(3.6, 0.035, 0.26, 0.006), 0, yy, 0);
    for (const q of [-1.5, 0, 1.5]) sh.add(M.timber, '#6e4a2c', bx(0.03, 0.18, 0.2), q, yy - 0.11, -0.02);
  }
  for (let i = 0; i < 7; i++) sh.add(M.ceramic, i % 3 ? '#efe9dc' : '#6f91a6', cg('plate', () => new THREE.CylinderGeometry(0.12, 0.12, 0.015, 14).rotateX(Math.PI / 2)), -1.5 + i * 0.12, 1.69, -0.05, { rx: -0.12 });
  for (let i = 0; i < 4; i++) sh.add(M.ceramic, ['#e6dcc4', '#b3813f', '#6f91a6', '#e6dcc4'][i], cg('jar', () => lathe([[0.001, 0], [0.05, 0], [0.055, 0.12], [0.04, 0.15], [0.042, 0.17], [0.001, 0.17]], 10)), 0.4 + i * 0.16, 1.57, 0);
  for (let i = 0; i < 3; i++) sh.add(M.ceramic, '#efe9dc', cg('bowl', () => lathe([[0.001, 0], [0.05, 0], [0.09, 0.05], [0.095, 0.07], [0.001, 0.02]], 12)), -0.9 + i * 0.22, 2.0, 0);
  // pot rack hung over the island on four rods, copper pans on hooks
  const pr = new Asm(c.b, c.chunk, 101, GF, 105.4, 0);
  pr.add(M.paint, '#2f2a24', bx(1.8, 0.03, 0.03), 0, 2.25, -0.25); pr.add(M.paint, '#2f2a24', bx(1.8, 0.03, 0.03), 0, 2.25, 0.25);
  for (const q of [-0.85, 0.85]) { pr.add(M.paint, '#2f2a24', bx(0.03, 0.03, 0.5), q, 2.25, 0); for (const r2 of [-0.25, 0.25]) pr.add(M.paint, '#2f2a24', bx(0.012, 0.9, 0.012), q, 2.7, r2); }
  for (let i = 0; i < 4; i++) {
    pr.add(M.brass, '#b8682f', cg('pan', () => lathe([[0.001, 0], [0.09, 0], [0.11, 0.06], [0.115, 0.08], [0.001, 0.07]], 12).rotateX(Math.PI / 2)), -0.6 + i * 0.4, 1.98, 0.25);
    pr.add(M.paint, '#2f2a24', bx(0.012, 0.16, 0.012), -0.6 + i * 0.4, 2.15, 0.25);
  }
  // a painted kitchen dresser on the west wall (between the service hatch and the dining arch): cupboard base, a plate
  // rack with plates on edge and cups on hooks
  const dr = new Asm(c.b, c.chunk, 95.45, GF, 104.2, Math.PI / 2), drc = '#8fa596';
  dr.add(M.paint, '#4a4038', bx(1.7, 0.08, 0.48), 0, 0.04, 0);
  dr.add(M.paint, drc, sb(1.8, 0.8, 0.52, 0.006), 0, 0.48, 0);
  for (const px of [-0.6, 0, 0.6]) { dr.add(M.paint, new THREE.Color(drc).multiplyScalar(1.06), sb(0.54, 0.6, 0.02, 0.004), px, 0.44, 0.27); dr.add(M.brass, '#c9a44c', bx(0.06, 0.012, 0.02), px, 0.66, 0.285); }
  dr.add(M.timber, '#7e5636', sb(1.86, 0.04, 0.56, 0.006), 0, 0.9, 0.0);
  dr.add(M.paint, drc, bx(1.8, 1.2, 0.02), 0, 1.52, -0.22);
  for (const sx of [-0.91, 0.91]) dr.add(M.paint, drc, bx(0.04, 1.2, 0.26), sx, 1.52, -0.1);
  for (const yy of [1.3, 1.72]) { dr.add(M.paint, drc, bx(1.8, 0.03, 0.24), 0, yy, -0.1); for (let i = 0; i < 6; i++) dr.add(M.ceramic, i % 2 ? '#efe9dc' : '#6f91a6', cg('plate', () => new THREE.CylinderGeometry(0.12, 0.12, 0.015, 14).rotateX(Math.PI / 2)), -0.7 + i * 0.28, yy + 0.13, -0.15, { rx: -0.15 }); }
  dr.add(M.paint, drc, sb(1.9, 0.06, 0.32, 0.008), 0, 2.15, -0.07);
  c.col.addBox(95.15, 95.75, 103.3, 105.1, 0, 2.2);
  // on the kitchen table: a bread board and a fruit bowl
  const t = new Asm(c.b, c.chunk, 101, GF, 100, 0);
  t.add(M.timber, '#a8784a', sb(0.42, 0.025, 0.28, 0.008), 0.15, 0.775, -0.6, { ry: 0.2 });
  t.add(M.ceramic, '#efe9dc', cg('fruitBowl', () => lathe([[0.001, 0], [0.08, 0], [0.16, 0.08], [0.17, 0.1], [0.001, 0.03]], 14)), -0.1, 0.76, 0.5);
  for (const [dx, dz, col] of [[-0.12, 0.48, '#c8452a'], [-0.05, 0.55, '#e0a030'], [-0.08, 0.44, '#8aa040']] as const) t.add(M.paint, col, cg('fruit', () => new THREE.IcosahedronGeometry(0.04, 1)), dx, 0.83, dz);
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
  canvasPanel(w, 78.6, R0 + 1.6, 86.7, Math.PI, 1.1, 0.75, (x, W, H) => { const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#f6e2b8'); gr.addColorStop(1, '#e8d2a0'); x.fillStyle = gr; x.fillRect(0, 0, W, H); x.strokeStyle = '#7a5a3a'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, H * 0.7); for (let i = 0; i <= 10; i++) x.lineTo((W * i) / 10, H * (0.55 + 0.12 * Math.sin(i * 1.3))); x.stroke(); x.beginPath(); x.arc(W * 0.75, H * 0.3, 26, 0, Math.PI * 2); x.stroke(); x.font = 'italic 22px Georgia'; x.fillStyle = '#7a5a3a'; if (!SLICE) x.fillText('onderweg', 20, H - 18); /* DEV-01R: no label-like words in clue rooms */ }, 256);
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
  canvasPanel(w, 78.6, R0 + 1.6, 93.9, Math.PI, 1.4, 0.95, (x, W, H) => { x.fillStyle = '#1c2a44'; x.fillRect(0, 0, W, H); for (let i = 0; i < 60; i++) { x.fillStyle = i % 5 ? '#f4ecd8' : '#e8c547'; x.beginPath(); x.arc((Math.sin(i * 12.9) * 0.5 + 0.5) * W, (Math.sin(i * 7.3) * 0.5 + 0.5) * H, i % 7 ? 2 : 4, 0, Math.PI * 2); x.fill(); } x.strokeStyle = 'rgba(244,236,216,.5)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(W * 0.2, H * 0.3); x.lineTo(W * 0.32, H * 0.42); x.lineTo(W * 0.45, H * 0.36); x.lineTo(W * 0.58, H * 0.5); x.stroke(); x.font = 'italic 20px Georgia'; x.fillStyle = '#f4ecd8'; if (!SLICE) x.fillText('sterrenkaart', 16, H - 14); /* DEV-01R */ }, 384);
  telescope(c, 82.6, 91.4, R0, -Math.PI / 2 - 0.4);
  table(c, 83.9, 93.0, R0, 0.6, 0.5, 0, '#4a3a2a', 0.7);
  const logbook = compound((b) => { box(b, k.M.paint, '#2f3f5f', 0, 0, 0, 0.2, 0.03, 0.28); box(b, k.M.paint, '#efe2c2', 0.005, 0.005, 0, 0.18, 0.025, 0.26); });
  place(logbook, 83.9, R0 + 0.7, 93.0, 0.4);
  w.scene.add(logbook);
  makeInspect(w, g, { id: 'mem.sterren.telescope', obj: logbook, clue: 'mem.sterren.telescope', hit: [0.4, 0.2, 0.4], label: 'Lezen: logboek' });
  const sl = tableLamp(w, 73.4, R0 + 0.59, 92.4);
  // DEV-01: on by default so the B01 evidence is readable on arrival
  makeLamp(w, g, { id: 'lamp.sterren', ...sl, name: 'lamp', defaultOn: SLICE, hit: [0.4, 0.7, 0.4], intensity: 4, distance: 6, patch: { y: R0 + 0.03, r: 1.0 } });
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
  // botanical prints; DEV-01 drops them (they reuse the old emblem drawings: no second emblem system)
  if (!SLICE) for (let i = 0; i < 4; i++) {
    const z = 82.5 + i * 3.4;
    canvasPanel(w, 107.5, R0 + 1.6, z, -Math.PI / 2, 0.5, 0.65, (x, W, H) => { x.fillStyle = '#f2e8d2'; x.fillRect(0, 0, W, H); drawSymbol(x, ['blad', 'e.varen', 'blad', 'e.varen'][i], W * 0.15, H * 0.15, W * 0.7); }, 128, '#8a6a3a');
  }
  for (const [x, z] of [[106.9, 81.0], [102.0, 81.0], [106.9, 95.2]] as const) plant(c, x, z, R0, 1.0, '#c9774a');
  const bl = tableLamp(w, 103.9, R0 + 0.76, 89.4);
  makeLamp(w, g, { id: 'lamp.botanic', ...bl, name: 'lamp', defaultOn: true, hit: [0.4, 0.7, 0.4], intensity: 4, distance: 7, patch: { y: R0 + 0.03, r: 1.2 } });
  // ---------------------------------------------------------------- north guest room (source id `storage`), linen, rear nooks
  bed2(c, 105.4, 102.6, R0, -Math.PI / 2, '#6f8a7a', '#7a5a3a');
  bedside(c, 107.15, 100.6, R0, -Math.PI / 2, '#7a5a3a');
  wardrobe(c, 101.6, 106.25, R0, Math.PI, 1.4, '#7a5a3a');
  rug(c, 103.4, 102.6, R0 + 0.01, 2.6, 3.0, 0, '#b8a888');
  staticLantern(c, w, 103.3, UCEIL - 0.6, 101.0, 0.5, 0, 2.5, 6);
  // shared linen: shelves along the north wall, reached centrally from the rear nook (not through a bedroom)
  for (let i = 0; i < 3; i++) {
    const x = 101.2 + i * 2.2;
    box(c.b, k.M.wood, '#8a6a4a', x, R0, 109.25, 1.9, 2.0, 0.5, { chunk: c.chunk, uv: 1 });
    for (let sIdx = 0; sIdx < 4; sIdx++) box(c.b, k.M.paint, ['#f2ead8', '#9aa8d8', '#6fae9a', '#e0a060'][(sIdx + i) % 4], x, R0 + 0.25 + sIdx * 0.45, 108.95, 1.6, 0.2, 0.06, { chunk: c.chunk });
  }
  c.col.addBox(100.2, 107.4, 109.0, 109.5, R0, R0 + 2.0);
  staticSconce(c, w, 98.88, R0 + 1.9, 106.4, -Math.PI / 2, 2, 4); // rear nook east (the linen itself is a cupboard)
  // rear nook (landing side loop) and its east seat by the attic stair's back door
  armchair(c, 93.6, 108.6, R0, Math.PI, '#7a8a5a');
  plant(c, 90.7, 109.0, R0, 1.0);
  rug(c, 92.5, 106.8, R0 + 0.01, 2.6, 3.2, 0, '#c8b090');
  part(c, k.M.wood, '#6b4426', 97.0, 109.1, Math.PI, 0, R0, 0, 1.4, 0.45, 0.4, 1);
  c.col.addBox(96.3, 97.7, 108.85, 109.4, R0, R0 + 0.5);
  staticSconce(c, w, 94.88, R0 + 1.9, 105.4, -Math.PI / 2, 2, 4); // rear nook
  if (SLICE) sliceUpstairs(w, g, c); // DEV-01 B01 clusters (U04/U05/U10) + DS01 C (drying rack in U04)
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

// =====================================================================================================
// DEV-02 attic (v0.2 A01–A04): stair S03 from the upper corridor, a real attic floor (+6.65) under the existing roof.
function attic(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const base = c.chunk;
  c.chunk = 'mAttic';
  const MID = S03.mid.y, wood = '#8a6a4a';
  // ---------------------------------------------------------------- S03: flight 1, middle landing, flight 2 (real steps)
  const f1 = S03.flight1, f2 = S03.flight2, m = S03.mid;
  stairsZ(c, f1.x0, f1.x1, f1.z0, f1.z1, UF, MID, wood, 10, { runner: false, mass: '#d4c6a8' });
  boxMM(c.b, k.M.wood, wood, m.x0, m.x1, UF, MID, m.z0, m.z1, { chunk: c.chunk, uv: 1.2 });
  w.col.addFloor(m.x0, m.x1, m.z0, m.z1, MID);
  w.col.addBox(m.x0, m.x1, m.z0, m.z1, UF, MID, { occludes: true }); // solid under the landing (too low to walk under)
  stairsZ(c, f2.x0, f2.x1, f2.z1, f2.z0, MID, AF, wood, 10, { runner: false, mass: '#d4c6a8' });
  boxMM(c.b, k.M.wood, '#7a5a3a', f2.x0, f2.x1, UF, MID, f2.z0, f2.z1, { chunk: c.chunk, uv: 1.2 });
  w.col.addBox(f2.x0, f2.x1, f2.z0, f2.z1, UF, MID, { occludes: true }); // closed under flight 2
  // railings: flight 1 | lane, between the flights (full height), middle landing edges, upper landing over the well
  stairRail(c, f1.x1 + 0.06, f1.z0, f1.z1, UF, MID, 1);
  stairRail(c, 96.5, f2.z0, f2.z1, AF, MID, -1, '#5e3b1f', UF);
  railing(c, 'z', m.x1 + 0.06, m.z0, m.z1, MID);
  railing(c, 'x', m.z1 + 0.06, m.x0, m.x1 + 0.06, MID);
  railing(c, 'x', S03.landing.z1, 96.4, 99, AF);
  // ---------------------------------------------------------------- attic floor (only the attic rooms; the stairwell stays open)
  const af = (x0: number, x1: number, z0: number, z1: number) => {
    boxMM(c.b, k.M.wood, '#a8845a', x0, x1, AF - 0.2, AF, z0, z1, { uv: 2.2, chunk: c.chunk });
    w.col.addFloor(x0, x1, z0, z1, AF);
    w.col.addOccluder(x0, x1, z0, z1, AF - 0.2, AF);
  };
  af(80, 95, 86, 104); // atticStore + atticCommon
  af(95, 101, 92, 98.6); // atticLookout
  af(95, 99, 98.6, 99.8); // upper landing (atticLanding)
  // ---------------------------------------------------------------- partitions + knee walls up to the roof (play zone 80–101 / 86–105.6)
  const aw = (axis: 'x' | 'z', f: number, a0: number, a1: number, openings: { at: number; w: number; h?: number }[] = []) => {
    let top = Infinity;
    for (let a = a0; a <= a1 + 1e-6; a += 0.5) top = Math.min(top, axis === 'x' ? roofUnderside(a, f) : roofUnderside(f, a));
    wall(c, axis, f, a0, a1, AF, top - 0.05, { t: 0.12, mat: k.M.wood, color: '#c8ad84', uv: 1.6, openings });
  };
  aw('z', 80, 86, 104);
  aw('x', 86, 80, 95);
  aw('z', 95, 86, 92);
  aw('x', 92, 80, 95, [{ at: 86, w: 1.0, h: 2.1 }]); // atticStore door
  aw('x', 92, 95, 101);
  aw('z', 101, 92, 98.6);
  aw('x', 98.6, 99, 101);
  aw('z', 95, 92, 98.6, [{ at: 95, w: 1.3, h: 2.2 }]); // common | lookout (arch)
  aw('x', 98.6, 95, 99, [{ at: 97, w: 1.2, h: 2.2 }]); // lookout | landing (arch)
  aw('z', 95, 99.8, 105.6); // common | stairwell (the opening Z 98.6–99.8 is the stair exit, v0.2 "X95/Z99.2")
  aw('x', 104, 80, 95);
  aw('z', 99, 98.6, 105.6);
  aw('x', 105.6, 95, 99);
  makeDoor(w, g, { id: 'door.atticStore', x: 85.5, z: 92, dir: 'x+', width: 1.0, height: 2.05, y0: AF, swing: -1, style: 'plank', color: '#8a6a4a' });
  // ---------------------------------------------------------------- inner roof skin (the exterior roof is single-sided)
  const skin = hipRoofGeo(36, 30, 8.2, 0.7);
  const pos = skin.attributes.position as THREE.BufferAttribute, uvA = skin.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i += 3) { // reverse each triangle: faces point into the attic
    const p1 = [pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)], u1 = [uvA.getX(i + 1), uvA.getY(i + 1)];
    pos.setXYZ(i + 1, pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2)); uvA.setXY(i + 1, uvA.getX(i + 2), uvA.getY(i + 2));
    pos.setXYZ(i + 2, p1[0], p1[1], p1[2]); uvA.setXY(i + 2, u1[0], u1[1]);
  }
  skin.computeVertexNormals();
  geo(c.b, k.M.wood, '#b89a72', skin, 90, TOP - 0.2, 95, { chunk: c.chunk, shadow: false });
  skin.dispose();
  for (let x = 81; x < 101; x += 2.4) box(c.b, k.M.wood, '#6b4a2a', x, AF, 95, 0.14, roofUnderside(x, 95) - AF - 0.15, 0.14, { chunk: c.chunk }); // king posts
  // ---------------------------------------------------------------- staging: A02 weekend attic, A03 seasonal store, A04 lookout
  for (const [x, z, sz, col] of [[81.0, 102.9, 0.7, '#a0784a'], [81.8, 102.9, 0.55, '#b08a5a'], [81.0, 102.1, 0.6, '#8a6a4a'], [93.7, 102.9, 0.65, '#a0784a'], [92.9, 102.9, 0.5, '#c8a070'], [81.0, 96.0, 0.6, '#a0784a']] as const) crate(c, x, z, AF, sz, 0.15, col);
  for (let i = 0; i < 3; i++) { // instrument cases leaning against the north wall
    box(c.b, k.M.paint, ['#2b2622', '#4a2f2a', '#2f3f4a'][i], 86 + i * 0.7, AF, 103.65, 0.4, 1.1 - i * 0.15, 0.22, { chunk: c.chunk, yaw: 0.05 * i });
  }
  c.col.addBox(85.7, 87.9, 103.4, 103.9, AF, AF + 1.1);
  for (const x of [84, 89]) cyl(c.b, k.M.wood, '#6b4a2a', x, AF, 97.5, 0.04, 0.04, 1.8, 6, { chunk: c.chunk }); // drying line posts
  box(c.b, k.M.paint, '#efe8d8', 86.5, AF + 1.75, 97.5, 5.0, 0.01, 0.01, { chunk: c.chunk });
  for (let i = 0; i < 5; i++) box(c.b, k.M.paint, ['#6fae9a', '#f2ead8', '#9aa8d8', '#e0a060', '#c4553d'][i], 84.8 + i * 0.8, AF + 1.15, 97.5, 0.55, 0.6, 0.02, { chunk: c.chunk });
  c.col.addCircle(84, 97.5, 0.12, AF, AF + 1.8); c.col.addCircle(89, 97.5, 0.12, AF, AF + 1.8);
  sofa(c, 82.0, 99.5, AF, Math.PI / 2, 2.0, '#8a7a5a');
  table(c, 88.5, 101.4, AF, 1.4, 0.8, 0, '#7a5a3a', 0.72);
  for (let i = 0; i < 3; i++) box(c.b, k.M.paint, ['#c4553d', '#3f6fa8', '#e8c547'][i], 88.0 + i * 0.45, AF + 0.72, 101.4, 0.36, 0.06, 0.28, { chunk: c.chunk });
  // A03 seasonal store (behind its door): garden cushions, a boxed tree, the old games box (memory moved here, same id)
  for (const [x, z, sz] of [[81.0, 86.8, 0.7], [81.8, 86.8, 0.6], [94.1, 86.8, 0.7], [94.1, 87.6, 0.55], [90.5, 86.8, 0.6]] as const) crate(c, x, z, AF, sz, 0.1, '#9a7a52');
  box(c.b, k.M.paint, '#3f5a3a', 92.0, AF, 87.0, 1.6, 0.35, 0.35, { chunk: c.chunk });
  c.col.addBox(91.2, 92.8, 86.8, 87.2, AF, AF + 0.4);
  const memBox = compound((b) => { box(b, k.M.paint, '#c8a070', 0, 0, 0, 0.6, 0.4, 0.45); box(b, k.M.paint, '#a07a50', 0, 0.4, 0, 0.62, 0.03, 0.47); });
  place(memBox, 84.4, AF, 87.0, 0.2);
  w.scene.add(memBox);
  c.col.addCircle(84.4, 87.0, 0.4, AF, AF + 0.5);
  makeInspect(w, g, { id: 'mem.storage.box', obj: memBox, clue: 'mem.storage.box', hit: [0.7, 0.5, 0.6] });
  // A04 lookout: observatory reservation only (I03 open) — a bench and the stars hobby, no roof opening claimed
  part(c, k.M.wood, '#6b4426', 99.8, 94.6, -Math.PI / 2, 0, AF, 0, 1.6, 0.45, 0.45, 1);
  c.col.addBox(99.5, 100.1, 93.8, 95.4, AF, AF + 0.5);
  telescope(c, 97.4, 93.2, AF, -0.5);
  for (const [x, z] of [[88, 98.5], [86.5, 89], [98, 95.4], [97, 102.6]] as const) staticLantern(c, w, x, AF + 1.9, z, 0.5, 0, 2.5, 7);
  staticLantern(c, w, 98.4, UF + 2.4, 103.2, 0.5, 0, 3, 8); // stairwell light over the return lane
  c.chunk = base;
}
