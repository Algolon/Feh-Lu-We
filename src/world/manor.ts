// The manor: X 48–72, Z 52–80 (24 × 28). Ground floor: vestibule → double-height entrance hall,
// living room (left/west), dining (right/east) → kitchen behind it, service corridor, billiard room.
// Upstairs (via a real staircase + hidden ramp): landing/gallery, study (locked), storage room.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, wall, floor, ceiling, stairsZ, railing, hipRoof, windowAt } from './arch';
import { box, boxMM, cyl, blob, compound, v3, hitbox } from './kit';
import { table, chair, sofa, armchair, bookshelf, bed, counter, rug, plant, painting, crate, tableLamp, floorLamp, chandelier, wallSconce, flame, part, staticLantern, staticSconce } from './furniture';
import { makeDoor, makeDrawer, makePickup, makeLamp, makeInspect, makeAction, place, lightableItemLabel } from '../interactions/props';
import { plaqueTexture, forestMapTexture } from './textures';
import { drawSymbol } from '../content/symbols';
import { addClue, has } from '../core/state';

export const GF = 0.15, CEIL = 3.15, UF = 3.35, UCEIL = 6.2, TOP = 6.4;

export function buildManor(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const stone = { mat: k.M.stone, color: '#f2e6cc' };
  const skin = { mat: k.M.plaster, color: '#f1e6cf' };
  const ext = (axis: 'x' | 'z', f: number, a0: number, a1: number, exterior: 1 | -1, gfOpen: { at: number; w: number; h?: number }[], gfWin: number[], ufWin: number[]) => {
    wall(c, axis, f, a0, a1, 0, UF, { ...stone, t: 0.4, exterior, skin, uv: 2.4, openings: gfOpen, windows: gfWin.map((at) => ({ at, sill: 1.05, h: 1.6, w: 1.1 })) });
    wall(c, axis, f, a0, a1, UF, TOP, { ...stone, t: 0.4, exterior, skin, uv: 2.4, windows: ufWin.map((at) => ({ at, sill: 0.8, h: 1.5, w: 1.0 })) });
  };
  // ---------------------------------------------------------------- exterior shell
  ext('x', 52.2, 48, 72, -1, [{ at: 60, w: 1.7, h: 2.7 }], [50.2, 53.8, 66.2, 69.4], [50.2, 53.8, 57.6, 62.4, 66.2, 69.4]);
  ext('x', 79.8, 48, 72, 1, [{ at: 66.8, w: 1.0, h: 2.35 }], [51, 55, 59, 69.6], [51, 55, 59, 63, 69]);
  ext('z', 48.2, 52.4, 79.6, -1, [], [55, 58, 66, 69, 76], [55, 60, 65.5, 70, 76]);
  ext('z', 71.8, 52.4, 79.6, 1, [{ at: 72.5, w: 1.4, h: 2.4 }], [57, 61.5, 67, 77], [57, 61.5, 66, 72, 77]);
  // plinth + string course for a richer silhouette
  boxMM(c.b, k.M.stone, '#d8c8a8', 47.85, 72.15, 0, 0.5, 51.85, 52.0, { chunk: c.chunk, uv: 2 });
  boxMM(c.b, k.M.stone, '#d8c8a8', 47.85, 72.15, 0, 0.5, 80.0, 80.15, { chunk: c.chunk, uv: 2 });
  boxMM(c.b, k.M.stone, '#d8c8a8', 47.85, 48.0, 0, 0.5, 51.85, 80.15, { chunk: c.chunk, uv: 2 });
  boxMM(c.b, k.M.stone, '#d8c8a8', 72.0, 72.15, 0, 0.5, 51.85, 80.15, { chunk: c.chunk, uv: 2 });
  boxMM(c.b, k.M.paint, '#e8dcc0', 47.9, 72.1, 3.3, 3.45, 51.9, 52.0, { chunk: c.chunk });
  boxMM(c.b, k.M.paint, '#e8dcc0', 47.9, 72.1, 3.3, 3.45, 80.0, 80.1, { chunk: c.chunk });
  // roof, chimneys, turret
  hipRoof(c, 60, 66, 24, 28, TOP, 5.2, k.M.slate, '#8a93a8', 0.7);
  for (const [x, z] of [[49.6, 62], [66, 75], [56, 58]] as const) box(c.b, k.M.stone, '#e6d6b6', x, 8, z, 1.1, 5.2, 1.1, { chunk: c.chunk, uv: 2 });
  for (const [x, z] of [[49.6, 62], [66, 75], [56, 58]] as const) box(c.b, k.M.paint, '#8a4a32', x, 13.2, z, 0.5, 0.5, 0.5, { chunk: c.chunk });
  cyl(c.b, k.M.stone, '#efe2c4', 72.1, 0, 52.4, 2.2, 2.2, 8.2, 18, { chunk: c.chunk });
  cyl(c.b, k.M.slate, '#7d879c', 72.1, 8.2, 52.4, 0.05, 2.6, 4.2, 18, { chunk: c.chunk });
  w.col.addCircle(72.1, 52.4, 2.2, 0, 8);
  for (const [a, y] of [[0.6, 1.2], [2.0, 1.2], [1.3, 4.3], [-0.4, 4.3]] as const) {
    const wx = 72.1 + Math.sin(a) * 2.22, wz = 52.4 - Math.cos(a) * 2.22;
    box(c.b, k.M.glow, '#ffc96e', wx, y, wz, 0.7, 1.2, 0.08, { yaw: a + Math.PI, chunk: c.chunk });
  }
  // porch: step, columns, canopy, lanterns
  floor(c, 58.2, 61.8, 50.9, 52.0, GF, k.M.stone, '#d9ccb0', 0.4, true);
  for (const x of [58.4, 61.6]) cyl(c.b, k.M.stone, '#efe4ca', x, GF, 51.1, 0.16, 0.18, 2.9, 10, { chunk: c.chunk });
  for (const x of [58.4, 61.6]) w.col.addCircle(x, 51.1, 0.2, 0, 3);
  boxMM(c.b, k.M.slate, '#7d879c', 57.9, 62.1, 3.05, 3.3, 50.6, 52.1, { chunk: c.chunk });
  for (const x of [58.6, 61.4]) {
    staticLantern(c, w, x, 2.2, 51.95, 0.8, 0, 4, 7);
  }

  // everything from here on is interior: its own chunk, hidden when the player is outside and away
  c.chunk = 'manorIn';
  // ---------------------------------------------------------------- floors / ceilings
  floor(c, 56, 64, 52.4, 72, GF, k.M.tile, '#efe4cc', 0.2, false, 1.6); // hall, vestibule, corridor
  floor(c, 48.4, 56, 52.4, 72, GF, k.M.wood, '#b07e4e', 0.2, false, 2.2); // living
  floor(c, 48.4, 64, 72, 79.6, GF, k.M.wood, '#9a6a3e', 0.2, false, 2.2); // billiard
  floor(c, 64, 71.6, 52.4, 64, GF, k.M.wood, '#a8754a', 0.2, false, 2.2); // dining
  floor(c, 64, 71.6, 64, 79.6, GF, k.M.tile, '#e6d2b0', 0.2, false, 1.2); // kitchen
  w.col.addFloor(48.4, 71.6, 52.4, 79.6, GF);
  const slab = (x0: number, x1: number, z0: number, z1: number, walk: boolean) => {
    boxMM(c.b, k.M.wood, '#8a5a34', x0, x1, CEIL, UF, z0, z1, { uv: 2.2, chunk: c.chunk });
    if (walk) w.col.addFloor(x0, x1, z0, z1, UF);
    w.col.addOccluder(x0, x1, z0, z1, CEIL, UF); // floors between storeys block interaction, not movement
  };
  slab(48.4, 56, 52.4, 63, false);
  slab(48.4, 56, 63, 74, true); // study
  slab(48.4, 56, 74, 79.6, false);
  slab(56, 64, 52.4, 55.5, false); // above vestibule
  slab(56, 62, 63, 70, true); // gallery landing
  slab(56, 64, 70, 74, true); // landing north
  slab(56, 64, 74, 79.6, false);
  slab(64, 71.6, 52.4, 68, false);
  slab(64, 70, 68, 74, true); // storage
  slab(70, 71.6, 68, 74, false);
  slab(64, 71.6, 74, 79.6, false);
  // beams under the ground-floor ceiling
  for (let x = 49.5; x < 71; x += 2.4) if (x < 56 || x > 64) boxMM(c.b, k.M.wood, '#6b4426', x - 0.1, x + 0.1, CEIL - 0.22, CEIL, 52.4, 79.6, { chunk: c.chunk, uv: 1.5 });
  ceiling(c, 48.4, 71.6, 52.4, 79.6, UCEIL, '#efe4cc');

  // ---------------------------------------------------------------- interior partitions
  const P = { t: 0.16, mat: k.M.plaster, color: '#f3e9d4', uv: 2.4 };
  wall(c, 'z', 56, 52.4, 72, GF, CEIL, { ...P, openings: [{ at: 61.5, w: 3.0, h: 2.6 }] }); // W1 living | hall
  wall(c, 'z', 56, 55.5, 63, CEIL, UCEIL, P); // double-height hall west
  wall(c, 'z', 64, 52.4, 79.6, GF, CEIL, { ...P, openings: [{ at: 59, w: 2.4, h: 2.6 }, { at: 71, w: 1.0, h: 2.3 }] }); // W2
  wall(c, 'z', 64, 55.5, 63, CEIL, UCEIL, P);
  wall(c, 'x', 55.5, 56, 64, GF, UCEIL, { ...P, openings: [{ at: 60, w: 2.4, h: 2.75 }] }); // W3 vestibule | hall
  wall(c, 'x', 70, 56, 64, GF, CEIL, { ...P, openings: [{ at: 57.6, w: 1.0, h: 2.3 }] }); // W4 hall | corridor
  wall(c, 'x', 72, 48.4, 64, GF, CEIL, { ...P, openings: [{ at: 60, w: 1.0, h: 2.3 }] }); // W5 corridor/living | billiard
  wall(c, 'x', 64, 64, 71.6, GF, CEIL, { ...P, openings: [{ at: 68, w: 2.0, h: 2.5 }] }); // W6 dining | kitchen
  // wainscot in hall
  for (const [f, a0, a1] of [[56.09, 55.6, 60], [63.91, 55.6, 57.8], [63.91, 60.2, 63]] as const) box(c.b, k.M.wood, '#6b4426', f, GF, (a0 + a1) / 2, 0.04, 1.0, a1 - a0, { chunk: c.chunk, uv: 1 });

  // ---------------------------------------------------------------- upstairs
  const U = { t: 0.16, mat: k.M.plaster, color: '#efe2c8', uv: 2.4 };
  wall(c, 'z', 56, 63, 74, CEIL, UCEIL, { ...U, openings: [{ at: 66.5, w: 0.95, h: 2.4 }] }); // study | landing
  wall(c, 'z', 64, 63, 74, CEIL, UCEIL, { ...U, openings: [{ at: 72, w: 0.9, h: 2.4 }] }); // stairwell/landing | storage
  wall(c, 'x', 63, 48.4, 56, CEIL, UCEIL, { ...U, windows: [] });
  wall(c, 'x', 74, 48.4, 70, CEIL, UCEIL, U);
  wall(c, 'x', 68, 64, 70, CEIL, UCEIL, U);
  wall(c, 'z', 70, 68, 74, CEIL, UCEIL, U);
  railing(c, 'x', 63.05, 56.1, 62, UF);
  railing(c, 'z', 62, 63, 69.4, UF);
  railing(c, 'x', 63.05, 62, 63.9, UF);
  stairsZ(c, 62.05, 63.92, 63.0, 70.0, GF, UF);
  // newel posts
  for (const z of [63.0]) cyl(c.b, k.M.wood, '#5e3b1f', 62.15, GF, z, 0.09, 0.09, 1.25, 8, { chunk: c.chunk });

  // ---------------------------------------------------------------- doors
  makeDoor(w, g, { id: 'door.front', x: 59.15, z: 52.2, dir: 'x+', width: 1.7, height: 2.62, y0: GF, swing: 1, color: '#6b3f22', key: 'frontKey', thickness: 0.09 });
  makeDoor(w, g, { id: 'door.corridor', x: 57.1, z: 70, dir: 'x+', width: 1.0, height: 2.25, y0: GF, swing: 1 });
  makeDoor(w, g, { id: 'door.billiard', x: 59.5, z: 72, dir: 'x+', width: 1.0, height: 2.25, y0: GF, swing: 1 });
  makeDoor(w, g, { id: 'door.study', x: 56, z: 66.03, dir: 'z+', width: 0.95, height: 2.2, y0: UF, swing: 1, key: 'studyKey', color: '#5a3520' });
  makeDoor(w, g, { id: 'door.storage', x: 64, z: 71.55, dir: 'z+', width: 0.9, height: 2.2, y0: UF, swing: -1, color: '#7a5a3a', style: 'plank' });
  makeDoor(w, g, { id: 'door.kitchenBack', x: 66.3, z: 79.8, dir: 'x+', width: 1.0, height: 2.3, y0: GF, swing: -1, style: 'glass' });
  makeDoor(w, g, { id: 'door.conservatory', x: 71.8, z: 71.8, dir: 'z+', width: 1.4, height: 2.35, y0: GF, swing: -1, style: 'glass' });

  // ---------------------------------------------------------------- entrance hall
  rug(c, 60, 61, GF + 0.01, 3.2, 6.0, 0);
  rug(c, 60, 53.9, GF + 0.01, 2.6, 1.6, 0, '#e8d0c0');
  plant(c, 56.6, 55.9, GF, 1.3, '#c9d6e8');
  plant(c, 63.4, 55.9, GF, 1.3, '#c9d6e8');
  plant(c, 61.4, 69.3, GF, 1.1);
  painting(c, 56.1, 2.0, 58.7, Math.PI / 2, 0.9, 0.7, 0);
  painting(c, 63.9, 4.5, 59, -Math.PI / 2, 1.2, 0.9, 1);
  painting(c, 56.1, 4.6, 59.5, Math.PI / 2, 1.0, 0.75, 4);
  // tapestry above the stairs
  boxMM(c.b, k.M.rug, '#c86060', 63.86, 63.9, 3.8, 5.8, 64.5, 66.0, { chunk: c.chunk, shadow: false });
  const ch = chandelier(w, 60, UCEIL, 59.2, 0.9, 1.6);
  const sw = compound((b) => box(b, k.M.paint, '#c9a44c', 0, 0, 0, 0.12, 0.18, 0.03));
  place(sw, 61.5, 1.35, 55.6, 0);
  w.scene.add(sw);
  makeLamp(w, g, { id: 'lamp.hallChandelier', obj: sw, glow: ch.glow, light: ch.light, name: 'kroonluchter', defaultOn: true, intensity: 9, distance: 12, hit: [0.4, 0.4, 0.3], hitOffset: [0, 0.05, 0] });
  for (const [x, z, yaw] of [[56.15, 64.5, Math.PI / 2], [63.85, 61.5, -Math.PI / 2]] as const) {
    staticSconce(c, w, x, 2.2, z, yaw, 3, 6);
  }
  // console (ladekast) with the symbol-dial drawer — beat 1
  const cx = 56.32, cz = 57.6;
  box(c.b, k.M.wood, '#6b4426', cx, GF, cz, 0.46, 0.84, 1.3, { chunk: c.chunk, uv: 1 });
  box(c.b, k.M.wood, '#5a3a22', cx + 0.02, GF + 0.84, cz, 0.52, 0.05, 1.4, { chunk: c.chunk, uv: 1 });
  for (const sx of [-1, 1]) box(c.b, k.M.paint, '#4a2f1a', cx + 0.2, GF, cz + sx * 0.6, 0.06, 0.1, 0.06, { chunk: c.chunk });
  w.col.addBox(56.08, 56.6, cz - 0.7, cz + 0.7, 0, GF + 0.9);
  const dialPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), w.material(new THREE.MeshLambertMaterial({ map: w.texture(plaqueTexture({ w: 192, h: 64, bg: '#c9a44c', symbols: ['kaars', 'veer', 'klok'], symbolColor: '#3a2a1a' })) })));
  const hallDrawer = makeDrawer(w, g, {
    id: 'hall.drawer', x: cx + 0.02, y: GF + 0.66, z: cz, yaw: Math.PI / 2, w: 1.0, h: 0.2, d: 0.42, color: '#7a5232',
    unlock: 'lock.hallDrawer', lockedLabel: 'Slot bekijken',
    onLocked: () => { if (addClue(g.state, 'c.drawerLock')) g.changed(); g.openPanel('drawerLock'); },
  });
  dialPlate.position.set(0.28, -0.02, -0.235);
  dialPlate.rotation.y = Math.PI;
  hallDrawer.slider.add(dialPlate);
  const brass = compound((b) => {
    box(b, k.M.paint, '#d9b14a', 0, 0, 0, 0.04, 0.012, 0.13);
    cyl(b, k.M.paint, '#d9b14a', 0, 0, -0.08, 0.03, 0.03, 0.012, 10);
  });
  brass.position.set(0.1, -0.07, 0);
  hallDrawer.slider.add(brass);
  makePickup(w, g, { id: 'pk.studyKey', item: 'studyKey', obj: brass, available: hallDrawer.isOpen, hit: [0.3, 0.12, 0.3] });
  // guestbook (memory)
  const gb = compound((b) => { box(b, k.M.paint, '#6a2f2a', 0, 0, 0, 0.3, 0.04, 0.22); box(b, k.M.paint, '#f2e8d2', 0, 0.04, 0, 0.28, 0.005, 0.2); });
  place(gb, cx + 0.03, GF + 0.89, cz - 0.35, Math.PI / 2);
  w.scene.add(gb);
  makeInspect(w, g, { id: 'mem.hall.guestbook', obj: gb, clue: 'mem.hall.guestbook', hit: [0.4, 0.2, 0.35] });
  const tl = tableLamp(w, cx, GF + 0.89, cz + 0.45);
  makeLamp(w, g, { id: 'lamp.hallConsole', ...tl, name: 'lamp', defaultOn: false, hit: [0.4, 0.7, 0.4], intensity: 4, distance: 6 });

  // ---------------------------------------------------------------- living room (west)
  rug(c, 51.8, 62, GF + 0.01, 3.6, 5.2, 0);
  sofa(c, 52.6, 62, GF, -Math.PI / 2, 2.6, '#5f7a45');
  armchair(c, 50.6, 58.9, GF, -0.4, '#6b7f9a');
  armchair(c, 50.6, 65.1, GF, Math.PI + 0.4, '#6b7f9a');
  table(c, 50.9, 62, GF, 0.9, 1.5, 0, '#6b4426', 0.45);
  bookshelf(c, 50.5, 71.6, GF, Math.PI, 2.2, 2.4);
  bookshelf(c, 53.6, 71.6, GF, Math.PI, 2.2, 2.4);
  plant(c, 55.4, 52.9, GF, 1.2);
  painting(c, 52, 2.1, 52.42, 0, 1.2, 0.85, 3);
  painting(c, 55.9, 2.0, 67, -Math.PI / 2, 0.9, 0.7, 6);
  // fireplace on the west wall with the mantelpiece — beat 1 evidence
  const fz = 62;
  boxMM(c.b, k.M.stone, '#e2d2b2', 48.4, 49.05, GF, 1.25, fz - 1.4, fz + 1.4, { chunk: c.chunk, uv: 1.2 });
  boxMM(c.b, k.M.paint, '#1d1712', 48.42, 49.07, GF, 0.95, fz - 0.7, fz + 0.7, { chunk: c.chunk });
  boxMM(c.b, k.M.stone, '#d8c6a4', 48.4, 49.15, 1.25, 1.33, fz - 1.7, fz + 1.7, { chunk: c.chunk, uv: 1.2 });
  boxMM(c.b, k.M.stone, '#e8dcc0', 48.4, 48.9, 1.33, CEIL, fz - 1.2, fz + 1.2, { chunk: c.chunk, uv: 1.6 });
  boxMM(c.b, k.M.stone, '#cbb898', 48.6, 49.6, GF, GF + 0.06, fz - 1.3, fz + 1.3, { chunk: c.chunk });
  w.col.addBox(48.4, 49.15, fz - 1.4, fz + 1.4, 0, 1.3);
  for (let i = 0; i < 3; i++) cyl(c.b, k.M.bark, '#7a5a3a', 48.75, GF + 0.08 + i * 0.05, fz - 0.3 + i * 0.3, 0.07, 0.07, 0.8, 6, { chunk: c.chunk, rx: Math.PI / 2, yaw: 0.3 * i });
  const mantelY = 1.33, mx = 48.82;
  const mantel = new THREE.Group();
  w.scene.add(mantel);
  const mz = [60.6, 61.2, 61.8, 62.4, 63.0, 63.5];
  const trinkets = compound((b) => {
    // kaars (candle)
    cyl(b, k.M.paint, '#b8892f', mx, mantelY, mz[0], 0.07, 0.08, 0.02, 10);
    cyl(b, k.M.paint, '#f3ead0', mx, mantelY + 0.02, mz[0], 0.035, 0.035, 0.24, 8);
    // veer (feather): long thin tilted blade + quill
    box(b, k.M.paint, '#efe6d2', mx, mantelY + 0.02, mz[1], 0.03, 0.34, 0.09, { rz: 0.0, rx: -0.5 });
    box(b, k.M.paint, '#8a6a4a', mx, mantelY, mz[1] - 0.06, 0.012, 0.12, 0.012, { rx: -0.5 });
    // klok (clock)
    box(b, k.M.wood, '#6b4426', mx, mantelY, mz[2], 0.14, 0.28, 0.24, { uv: 0.5 });
    cyl(b, k.M.paint, '#f5ecd6', mx + 0.075, mantelY + 0.16, mz[2], 0.085, 0.085, 0.01, 14, { rz: Math.PI / 2 });
    // dennenappel (pinecone)
    blob(b, k.M.paint, '#8a5a2a', mx, mantelY + 0.09, mz[3], 0.06, 0.1, 0.06);
    for (let i = 0; i < 6; i++) box(b, k.M.paint, '#6b4220', mx + Math.cos(i) * 0.05, mantelY + 0.04 + i * 0.022, mz[3] + Math.sin(i) * 0.05, 0.03, 0.02, 0.03, { yaw: i });
    // vaas (vase) with a flower
    cyl(b, k.M.paint, '#4f7fa8', mx, mantelY, mz[4], 0.05, 0.08, 0.24, 10);
    cyl(b, k.M.paint, '#4f8a3a', mx, mantelY + 0.24, mz[4], 0.008, 0.008, 0.18, 4);
    blob(b, k.M.paint, '#d9c45a', mx, mantelY + 0.44, mz[4], 0.04, 0.04, 0.04);
    // kopje (teacup) on saucer
    cyl(b, k.M.paint, '#f5f0e6', mx, mantelY, mz[5], 0.08, 0.08, 0.015, 12);
    cyl(b, k.M.paint, '#8fb4d8', mx, mantelY + 0.015, mz[5], 0.06, 0.045, 0.08, 12);
    box(b, k.M.paint, '#8fb4d8', mx, mantelY + 0.04, mz[5] + 0.075, 0.015, 0.05, 0.03);
  });
  mantel.add(trinkets);
  const mh = new THREE.Group();
  place(mh, 48.85, mantelY, fz, 0);
  w.scene.add(mh);
  makeInspect(w, g, { id: 'inspect.mantel', obj: mh, clue: 'c.mantel', hit: [0.6, 0.6, 3.4], hitOffset: [0, 0.25, 0], label: 'Bekijken: schoorsteenmantel' });
  // the fire itself: light with matches, put out again
  const fireGrp = flame(w, 48.75, GF + 0.1, fz, 0.7);
  w.lamps.push({ id: 'fire.living', pos: v3(49.4, GF + 0.6, fz), color: '#ff9a4a', intensity: 7, distance: 9, on: () => !!g.state.lit['fire.living'], flicker: 0.3 });
  w.emitters.push({ kind: 'fire', pos: v3(48.8, 0.6, fz), on: () => !!g.state.lit['fire.living'] });
  w.onSync(() => { fireGrp.visible = !!g.state.lit['fire.living']; });
  const fireHit = new THREE.Group();
  place(fireHit, 49.0, GF, fz);
  w.scene.add(fireHit);
  makeAction(w, {
    id: 'fire.living', obj: fireHit, hit: [0.5, 0.8, 1.4], hitOffset: [0, 0.4, 0],
    label: () => (g.state.lit['fire.living'] ? 'Vuur doven' : 'Open haard'),
    run: () => {
      if (g.state.lit['fire.living']) { g.state.lit['fire.living'] = false; g.act({ ok: true, msg: 'Je dooft het vuur.', sfx: 'click' }); return; }
      g.toast(has(g.state, 'matches') ? 'Er ligt hout klaar. Neem de lucifers in de hand om het aan te steken.' : 'Er ligt hout klaar, maar je hebt niets om het aan te steken.');
    },
    itemLabel: lightableItemLabel(() => !!g.state.lit['fire.living']),
    useItem: (item) => {
      if (item !== 'matches') { g.act({ ok: false, msg: 'Daarmee krijg je de haard niet aan.', sfx: 'fail' }, { save: false }); return; }
      if (g.state.lit['fire.living']) { g.toast('Het vuur brandt al.'); return; }
      g.state.lit['fire.living'] = true;
      g.act({ ok: true, msg: 'Het droge hout vat meteen vlam. De kamer wordt warm en oranje.', sfx: 'fire' });
    },
  });
  // side table with photo (memory), floor lamp
  table(c, 54.8, 69.6, GF, 0.6, 0.6, 0, '#6b4426', 0.62);
  const photo = compound((b) => { box(b, k.M.paint, '#b8892f', 0, 0, 0, 0.22, 0.17, 0.03); box(b, k.M.glow, '#c8b8a0', 0, 0.02, 0.018, 0.17, 0.12, 0.005); });
  place(photo, 54.8, GF + 0.62, 69.6, Math.PI * 0.8);
  w.scene.add(photo);
  makeInspect(w, g, { id: 'mem.living.photo', obj: photo, clue: 'mem.living.photo', hit: [0.35, 0.3, 0.35] });
  const fl = floorLamp(w, 55.3, GF, 64.9);
  makeLamp(w, g, { id: 'lamp.livingFloor', ...fl, name: 'staande lamp', defaultOn: true, hit: [0.5, 1.9, 0.5], intensity: 5, distance: 8 });

  // ---------------------------------------------------------------- dining room (east, front)
  rug(c, 68, 58.3, GF + 0.01, 3.0, 5.4, 0, '#e0c8a8');
  table(c, 68, 58.3, GF, 1.2, 3.8, 0, '#6b4426');
  for (let i = 0; i < 4; i++) {
    const z = 56.9 + i * 0.95;
    chair(c, 67.05, z, GF, Math.PI / 2, '#b5643c');
    chair(c, 68.95, z, GF, -Math.PI / 2, '#b5643c');
  }
  for (let i = 0; i < 3; i++) cyl(c.b, k.M.paint, '#efe6c8', 68, GF + 0.76, 57.3 + i, 0.03, 0.03, 0.22, 6, { chunk: c.chunk });
  box(c.b, k.M.wood, '#5a3a22', 71.3, GF, 58.3, 0.5, 0.9, 2.2, { chunk: c.chunk, uv: 1 });
  w.col.addBox(71.0, 71.6, 57.2, 59.4, 0, 1);
  painting(c, 71.38, 2.1, 61.5, -Math.PI / 2, 0.8, 0.6, 7);
  const dch = chandelier(w, 68, CEIL, 58.3, 0.7, 0.9);
  const dsw = compound((b) => box(b, k.M.paint, '#c9a44c', 0, 0, 0, 0.12, 0.18, 0.03));
  place(dsw, 64.09, 1.35, 61.0, Math.PI / 2);
  w.scene.add(dsw);
  makeLamp(w, g, { id: 'lamp.dining', obj: dsw, glow: dch.glow, light: dch.light, name: 'kroonluchter', defaultOn: false, intensity: 7, distance: 10, hit: [0.3, 0.4, 0.4], hitOffset: [0, 0.05, 0] });

  // ---------------------------------------------------------------- kitchen (east, rear)
  counter(c, 65.2, 79.25, GF, Math.PI, 1.6);
  counter(c, 69.6, 79.25, GF, Math.PI, 3.6);
  counter(c, 71.25, 67.5, GF, -Math.PI / 2, 5.6);
  counter(c, 71.25, 76.4, GF, -Math.PI / 2, 4.6);
  box(c.b, k.M.paint, '#2b2b2b', 69.6, GF + 0.91, 79.3, 0.9, 0.04, 0.55, { chunk: c.chunk }); // hob
  for (let i = 0; i < 4; i++) cyl(c.b, k.M.paint, '#b8682f', 68.4 + i * 0.5, 2.0, 79.45, 0.12, 0.1, 0.16, 10, { chunk: c.chunk }); // copper pots
  box(c.b, k.M.paint, '#3b3026', 69.2, 2.18, 79.45, 2.2, 0.04, 0.04, { chunk: c.chunk });
  // island with the spare-matches drawer (recovery path; also one of the three drawers)
  box(c.b, k.M.paint, '#7f9a8a', 67.6, GF, 71, 1.0, 0.86, 2.6, { chunk: c.chunk });
  box(c.b, k.M.paint, '#d8cdb8', 67.6, GF + 0.86, 71, 1.1, 0.05, 2.7, { chunk: c.chunk });
  w.col.addBox(67.05, 68.15, 69.65, 72.35, 0, 1);
  const kd = makeDrawer(w, g, { id: 'kitchen.drawer', x: 67.12, y: GF + 0.7, z: 71, yaw: -Math.PI / 2, w: 0.7, h: 0.2, d: 0.42, color: '#6f8a7a' });
  const spare = compound((b) => { box(b, k.M.paint, '#e6dcc0', 0, 0, 0, 0.1, 0.03, 0.06); box(b, k.M.paint, '#c4553d', 0, 0.03, 0, 0.07, 0.003, 0.04); });
  spare.position.set(0.05, -0.08, 0);
  kd.slider.add(spare);
  makePickup(w, g, { id: 'pk.kitchenMatches', item: 'matches', obj: spare, available: () => kd.isOpen() && !has(g.state, 'matches'), hit: [0.25, 0.12, 0.25], label: 'Pakken: reservelucifers' });
  const list = compound((b) => box(b, k.M.paint, '#f5f0e0', 0, 0, 0, 0.2, 0.004, 0.28));
  place(list, 67.4, GF + 0.91, 70.2, 0.3);
  w.scene.add(list);
  makeInspect(w, g, { id: 'mem.kitchen.list', obj: list, clue: 'mem.kitchen.list', hit: [0.35, 0.15, 0.4] });
  const kl = wallSconce(w, 64.1, 2.2, 67.5, Math.PI / 2);
  makeLamp(w, g, { id: 'lamp.kitchen', ...kl, name: 'wandlamp', defaultOn: true, intensity: 4, distance: 8, hit: [0.4, 0.5, 0.4] });
  plant(c, 64.6, 79.1, GF, 0.9, '#d0a070');

  // ---------------------------------------------------------------- service corridor + billiard room
  for (const x of [57, 62.5]) {
    staticSconce(c, w, x, 2.1, 70.1, 0, 2.5, 5);
  }
  rug(c, 55, 75.8, GF + 0.01, 4.2, 5.6, 0, '#c8b0a0');
  // billiard table (balls double as the optional panel's evidence)
  const bx0 = 54.2, bx1 = 55.8, bz0 = 74.2, bz1 = 77.4;
  boxMM(c.b, k.M.wood, '#5a3a22', bx0 - 0.15, bx1 + 0.15, GF + 0.62, GF + 0.82, bz0 - 0.15, bz1 + 0.15, { chunk: c.chunk, uv: 1 });
  boxMM(c.b, k.M.paint, '#2f6b3f', bx0, bx1, GF + 0.82, GF + 0.84, bz0, bz1, { chunk: c.chunk });
  for (const [x, z] of [[bx0, bz0], [bx1, bz0], [bx0, bz1], [bx1, bz1]]) box(c.b, k.M.wood, '#4a2f1a', x, GF, z, 0.16, 0.62, 0.16, { chunk: c.chunk });
  w.col.addBox(bx0 - 0.15, bx1 + 0.15, bz0 - 0.15, bz1 + 0.15, 0, 0.95);
  const ball = (r: number, cc: number, col: string) => blob(c.b, k.M.paint, col, bx0 + ((cc + 0.5) * (bx1 - bx0)) / 3, GF + 0.88, bz1 - ((r + 0.5) * (bz1 - bz0)) / 3, 0.045, 0.045, 0.045, { chunk: c.chunk, jitter: 0 });
  ball(0, 0, '#d33'); ball(1, 2, '#e8c547'); ball(2, 2, '#36c'); ball(2, 1, '#ffffff');
  box(c.b, k.M.wood, '#c9a46a', 55.3, GF + 0.85, 75.0, 0.03, 0.03, 1.4, { chunk: c.chunk, yaw: 0.5 }); // cue
  bookshelf(c, 49.2, 76, GF, Math.PI / 2, 2.0, 2.4);
  armchair(c, 50.4, 78.6, GF, Math.PI * 1.15, '#7a3a3a');
  // optional panel + example sketches on the east wall (facing west)
  const pnl = compound((b) => {
    box(b, k.M.wood, '#4a2f1a', 0, 0, 0, 0.6, 0.6, 0.05);
    for (let r = 0; r < 3; r++) for (let cc = 0; cc < 3; cc++) box(b, k.M.paint, '#3a2a1a', -0.18 + cc * 0.18, 0.12 + r * 0.18, 0.03, 0.12, 0.12, 0.02);
  });
  place(pnl, 63.88, 1.2, 76.2, -Math.PI / 2);
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
  place(ex, 63.88, 1.4, 74.6, -Math.PI / 2);
  w.scene.add(ex);
  makeInspect(w, g, { id: 'inspect.billiardExamples', obj: ex, clue: 'c.billiardExamples', hit: [1.1, 0.5, 0.3], hitOffset: [0, 0.2, 0] });
  const bl = floorLamp(w, 62.8, GF, 78.9);
  makeLamp(w, g, { id: 'lamp.billiard', ...bl, name: 'staande lamp', defaultOn: false, hit: [0.5, 1.9, 0.5], intensity: 5, distance: 8 });

  // ---------------------------------------------------------------- upstairs: landing, study, storage
  rug(c, 59, 72, UF + 0.01, 4.0, 2.4, 0, '#d0b8a0');
  plant(c, 56.6, 73.4, UF, 1.0);
  painting(c, 59, UF + 1.7, 73.92, Math.PI, 1.1, 0.8, 2);
  const ls = wallSconce(w, 61, UF + 1.9, 73.9, Math.PI);
  makeLamp(w, g, { id: 'lamp.landing', ...ls, name: 'wandlamp', defaultOn: true, intensity: 4, distance: 7, hit: [0.4, 0.5, 0.4] });
  // study (west upstairs room)
  rug(c, 52, 68.5, UF + 0.01, 3.0, 3.6, 0, '#b8a0c0');
  bed(c, 50.0, 71.8, UF, Math.PI / 2);
  bookshelf(c, 52.5, 73.7, UF, Math.PI, 2.0, 2.2);
  // desk facing east with the 3-button lock + compartment drawer — beat 2
  const dkx = 49.2, dkz = 67.2;
  box(c.b, k.M.wood, '#6b4426', dkx, UF + 0.72, dkz, 0.8, 0.06, 1.6, { chunk: c.chunk, uv: 1 });
  for (const sz of [-1, 1]) box(c.b, k.M.wood, '#5a3a22', dkx, UF, dkz + sz * 0.7, 0.75, 0.72, 0.12, { chunk: c.chunk, uv: 1 });
  w.col.addBox(48.6, 49.65, dkz - 0.82, dkz + 0.82, UF, UF + 0.8);
  chair(c, 50.1, dkz, UF, -Math.PI / 2, '#7a3a3a');
  const studyDrawer = makeDrawer(w, g, {
    id: 'study.compartment', x: dkx + 0.05, y: UF + 0.6, z: dkz, yaw: Math.PI / 2, w: 0.8, h: 0.16, d: 0.6, color: '#7a5232',
    unlock: 'lock.studyCompartment', lockedLabel: 'Slot bekijken', onLocked: () => g.openPanel('studyLock'),
  });
  const btns = compound((b) => {
    box(b, k.M.paint, '#b8892f', 0, 0, 0, 0.04, 0.12, 0.5);
    for (let i = 0; i < 3; i++) cyl(b, k.M.paint, '#e8c56a', 0.03, 0.04, -0.15 + i * 0.15, 0.035, 0.035, 0.02, 10, { rz: Math.PI / 2 });
  });
  btns.position.set(0, -0.06, -0.31);
  btns.rotation.y = Math.PI / 2;
  studyDrawer.slider.add(btns);
  const shedKey = compound((b) => {
    box(b, k.M.paint, '#8a6a4a', 0, 0, 0, 0.05, 0.015, 0.15);
    box(b, k.M.wood, '#a8743f', 0, 0, 0.11, 0.08, 0.02, 0.07);
  });
  shedKey.position.set(0, -0.05, 0);
  studyDrawer.slider.add(shedKey);
  makePickup(w, g, { id: 'pk.shedKey', item: 'shedKey', obj: shedKey, available: studyDrawer.isOpen, hit: [0.3, 0.12, 0.3] });
  const note = compound((b) => box(b, k.M.paint, '#f5eedc', 0, 0, 0, 0.21, 0.004, 0.28));
  place(note, dkx + 0.05, UF + 0.78, dkz - 0.45, 0.4);
  w.scene.add(note);
  makeInspect(w, g, { id: 'inspect.studyNote', obj: note, clue: 'c.studyNote', hit: [0.35, 0.15, 0.4], label: 'Lezen: briefje' });
  const dl = tableLamp(w, dkx - 0.15, UF + 0.78, dkz + 0.55);
  makeLamp(w, g, { id: 'lamp.study', ...dl, name: 'bureaulamp', defaultOn: false, hit: [0.4, 0.7, 0.4], intensity: 4, distance: 6 });
  // framed forest map on the south wall, facing north
  const mapMat = w.material(new THREE.MeshLambertMaterial({ map: w.texture(forestMapTexture()) }));
  const mapMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 1.0), mapMat);
  const mapGrp = new THREE.Group();
  mapGrp.add(mapMesh);
  mapMesh.position.set(0, 0, -0.03);
  mapMesh.rotation.y = Math.PI;
  const mapFrame = compound((b) => box(b, k.M.paint, '#b8892f', 0, -0.57, 0, 1.42, 1.14, 0.04));
  mapGrp.add(mapFrame);
  place(mapGrp, 52.2, UF + 1.65, 63.1, 0);
  w.scene.add(mapGrp);
  makeInspect(w, g, { id: 'inspect.forestMap', obj: mapGrp, clue: 'c.forestMap', hit: [1.4, 1.1, 0.3], hitOffset: [0, 0, 0], label: 'Bekijken: kaart' });
  windowAt(c, 'z', 48.4, 1, 69.5, UF + 0.8, 1.0, 1.5, false);
  // storage room
  for (const [x, z, s] of [[65, 73.2, 0.7], [65.8, 73.3, 0.55], [69.2, 72.8, 0.8], [69.2, 69, 0.6], [68.4, 73.3, 0.5]] as const) crate(c, x, z, UF, s, 0.3);
  const memBox = compound((b) => { box(b, k.M.paint, '#c8a070', 0, 0, 0, 0.6, 0.4, 0.45); box(b, k.M.paint, '#a07a50', 0, 0.4, 0, 0.62, 0.03, 0.47); });
  place(memBox, 66.6, UF, 69, 0.2);
  w.scene.add(memBox);
  w.col.addCircle(66.6, 69, 0.4, UF, UF + 0.5);
  makeInspect(w, g, { id: 'mem.storage.box', obj: memBox, clue: 'mem.storage.box', hit: [0.7, 0.5, 0.6] });
  const bulb = new THREE.Group();
  place(bulb, 67, UCEIL - 0.25, 71);
  w.scene.add(bulb);
  const bulbMat = w.material(new THREE.MeshBasicMaterial({ color: '#ffd27a' }));
  const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), bulbMat);
  bulb.add(bulbMesh);
  const cord = compound((b) => box(b, k.M.paint, '#222222', 0, 0, 0, 0.01, 0.6, 0.01));
  cord.position.y = 0.0;
  bulb.add(cord);
  const pull = new THREE.Group();
  place(pull, 64.4, UF + 1.3, 70.5, Math.PI / 2);
  w.scene.add(pull);
  pull.add(compound((b) => box(b, k.M.paint, '#c9a44c', 0, 0, 0, 0.1, 0.15, 0.03)));
  makeLamp(w, g, { id: 'lamp.storage', obj: pull, glow: [bulbMat], light: v3(67, UCEIL - 0.4, 71), name: 'peertje', defaultOn: false, intensity: 4, distance: 7, hit: [0.4, 0.4, 0.3], hitOffset: [0, 0.05, 0] });
  void hitbox; void part;

  // ---------------------------------------------------------------- checkpoints
  w.checkpoints.push(
    { name: 'hall', pose: { x: 60, y: GF, z: 57, yaw: 0, pitch: 0 } },
    { name: 'landing', pose: { x: 59, y: UF, z: 72, yaw: -Math.PI / 2, pitch: 0 } },
    { name: 'kitchen', pose: { x: 66, y: GF, z: 75, yaw: Math.PI / 2, pitch: 0 } },
    { name: 'billiard', pose: { x: 58, y: GF, z: 76, yaw: -Math.PI / 2, pitch: 0 } },
  );
  return { drawSymbol };
}
