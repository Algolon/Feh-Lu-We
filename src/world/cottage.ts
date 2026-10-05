// The old cottage X 32–42, Z 128–136 at the west end of the garden: white plaster, terracotta roof,
// blue shutters, a small terrace, and the pond beside it. This is where the group used to gather; this
// year the table is laid elsewhere. Optional location: a note from the Kwartiermaker and two memories.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, wall, floor, ceiling, hipRoof } from './arch';
import { box, boxMM, cyl, blob, compound, v3 } from './kit';
import { table, chair, plant, lantern, part, staticLantern } from './furniture';
import { makeDoor, makeLamp, makeInspect, place } from '../interactions/props';
import { COTTAGE, SITES } from './layout';

export function buildCottage(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = COTTAGE;
  const CX = (X0 + X1) / 2, CZ = (Z0 + Z1) / 2, MID = Z0 + 3;
  const Y = 0.3, TOPW = 3.3;
  const white = { mat: k.M.plaster, color: '#fbf6ec', t: 0.3, uv: 2 };
  const win = (at: number) => ({ at, w: 0.9, h: 1.2, sill: 0.95 });
  wall(c, 'x', Z0 + 0.15, X0, X1, 0, TOPW, { ...white, exterior: -1, openings: [{ at: CX, w: 1.0, h: 2.25 }], windows: [win(X0 + 2.2), win(X1 - 2.2)] });
  wall(c, 'x', Z1 - 0.15, X0, X1, 0, TOPW, { ...white, exterior: 1, windows: [win(X0 + 2.5), win(X1 - 2.5)] });
  wall(c, 'z', X0 + 0.15, Z0 + 0.3, Z1 - 0.3, 0, TOPW, { ...white, exterior: -1, windows: [win(Z0 + 5.3)] });
  wall(c, 'z', X1 - 0.15, Z0 + 0.3, Z1 - 0.3, 0, TOPW, { ...white, exterior: 1, windows: [win(Z0 + 1.7), win(Z0 + 5.6)] });
  for (const x of [X0 + 2.2, X1 - 2.2]) for (const s of [-1, 1]) box(c.b, k.M.wood, '#3f6fa8', x + s * 0.68, Y + 0.9, Z0 - 0.05, 0.42, 1.35, 0.05, { chunk: c.chunk, uv: 1 });
  for (const z of [Z0 + 1.7, Z0 + 5.6]) for (const s of [-1, 1]) box(c.b, k.M.wood, '#3f6fa8', X1 + 0.05, Y + 0.9, z + s * 0.68, 0.05, 1.35, 0.42, { chunk: c.chunk, uv: 1 });
  boxMM(c.b, k.M.paint, '#c8643a', X0 - 0.1, X1 + 0.1, 0, 0.3, Z0 - 0.1, Z1 + 0.1, { chunk: c.chunk });
  hipRoof(c, CX, CZ, X1 - X0, Z1 - Z0, TOPW, 2.2, k.M.terracotta, '#ffffff', 0.55);
  box(c.b, k.M.plaster, '#fbf6ec', X0 + 1.2, 4.0, Z1 - 1.4, 0.8, 2.0, 0.8, { chunk: c.chunk });
  box(c.b, k.M.terracotta, '#ffffff', X0 + 1.2, 6.0, Z1 - 1.4, 1.0, 0.15, 1.0, { chunk: c.chunk });
  // interior (own chunk, culled unless seen)
  const outChunk = c.chunk;
  c.chunk = 'cottageIn';
  floor(c, X0 + 0.3, X1 - 0.3, Z0 + 0.3, Z1 - 0.3, Y, k.M.wood, '#b88a5a', 0.3, true, 2);
  ceiling(c, X0 + 0.3, X1 - 0.3, Z0 + 0.3, Z1 - 0.3, 3.05, '#f4ead6');
  for (let x = X0 + 1; x < X1; x += 1.6) box(c.b, k.M.wood, '#6b4426', x, 2.88, CZ, 0.16, 0.17, 7.4, { chunk: c.chunk, uv: 1 });
  wall(c, 'x', MID, X0 + 0.3, X1 - 0.3, Y, 3.05, { t: 0.2, mat: k.M.plaster, color: '#f6efe2', openings: [{ at: CX, w: 1.4, h: 2.3 }] });
  makeDoor(w, g, { id: 'door.cottage', x: CX - 0.5, z: Z0 + 0.15, dir: 'x+', width: 1.0, height: 2.2, y0: Y, swing: 1, color: '#3f6fa8' });
  for (const x of [X0 + 1, X1 - 1.2]) plant(c, x, Z0 + 0.8, Y, 0.9, '#c9774a');
  const el = lantern(w, X1 - 0.6, Y + 1.8, Z0 + 2.6, 0.7);
  makeLamp(w, g, { id: 'lamp.cottageEntry', ...el, name: 'lantaarn', defaultOn: true, intensity: 3, distance: 6, hit: [0.4, 0.5, 0.4] });
  // the old gathering room: an empty table with folded cloths, chairs pushed in
  const TZ = Z0 + 5.4;
  table(c, CX, TZ, Y, 5.0, 1.4, 0, '#7a4a28');
  for (let i = 0; i < 5; i++) {
    if (i !== 2) chair(c, CX - 2 + i, TZ - 1.1, Y, 0, '#c4553d');
    chair(c, CX - 2 + i, TZ + 1.1, Y, Math.PI, '#c4553d');
  }
  for (let i = 0; i < 3; i++) box(c.b, k.M.paint, ['#efe6d6', '#e8d8c0', '#f5f0e6'][i], CX - 1.6 + i * 1.6, Y + 0.76, TZ, 0.4, 0.04 + i * 0.01, 0.3, { chunk: c.chunk });
  cyl(c.b, k.M.paint, '#c9a44c', CX + 1.9, Y + 0.76, TZ, 0.06, 0.07, 0.02, 10, { chunk: c.chunk });
  cyl(c.b, k.M.paint, '#efe6c8', CX + 1.9, Y + 0.78, TZ, 0.03, 0.03, 0.08, 8, { chunk: c.chunk }); // burnt-down candle
  const card = compound((b) => { box(b, k.M.paint, '#f5eedc', 0, 0, 0, 0.18, 0.12, 0.01, { rx: -0.3 }); });
  place(card, CX, Y + 0.77, TZ - 0.5, 0);
  w.scene.add(card);
  makeInspect(w, g, { id: 'mem.cottage.table', obj: card, clue: 'mem.cottage.table', hit: [0.3, 0.25, 0.3] });
  const note = compound((b) => box(b, k.M.paint, '#f2e8d2', 0, 0, 0, 0.22, 0.004, 0.16, { yaw: 0.2 }));
  place(note, CX - 1.1, Y + 0.77, TZ + 0.2, 0);
  w.scene.add(note);
  makeInspect(w, g, { id: 'inspect.cottageNote', obj: note, clue: 'c.cottageNote', hit: [0.35, 0.2, 0.3], label: 'Lezen: briefje' });
  const bunting: THREE.MeshBasicMaterial[] = [];
  const bm = w.material(new THREE.MeshBasicMaterial({ color: '#8a7a5a' }));
  bunting.push(bm);
  const bulbs = Array.from({ length: 9 }, (_, i) => new THREE.SphereGeometry(0.05, 6, 4).translate(X0 + 1 + i, 2.65 - Math.sin((i / 8) * Math.PI) * 0.25, -TZ));
  w.scene.add(new THREE.Mesh(mergeGeometries(bulbs)!, bm)); // one draw call for the whole string
  bulbs.forEach((b) => b.dispose());
  const rl = lantern(w, X0 + 0.6, Y + 1.8, TZ + 1.6, 0.7);
  makeLamp(w, g, { id: 'lamp.cottageRoom', ...rl, name: 'lantaarn', defaultOn: false, intensity: 3, distance: 7, hit: [0.4, 0.5, 0.4] });
  c.chunk = outChunk;

  // ---------------------------------------------------------------- terrace + pond
  floor(c, X0 + 0.4, X1 - 0.4, Z0 - 2.3, Z0, 0.15, k.M.terracotta, '#e8b090', 0.3, true, 1.2);
  table(c, X0 + 2.6, Z0 - 1.2, 0.15, 1.2, 0.8, 0, '#efe6d6');
  chair(c, X0 + 1.8, Z0 - 1.2, 0.15, Math.PI / 2, '#3f6fa8');
  chair(c, X0 + 3.4, Z0 - 1.2, 0.15, -Math.PI / 2, '#3f6fa8');
  for (const [x, z] of [[X1 - 1.2, Z0 - 1.8], [X0 + 0.8, Z0 - 1.8]] as const) plant(c, x, z, 0.15, 1.1, '#c8643a');
  for (const x of [CX - 1, CX + 1]) staticLantern(c, w, x, 2.3, Z0, 0.7, 0, 3, 6);
  const { x: PX, z: PZ } = SITES.pond;
  const pondMat = w.material(new THREE.MeshLambertMaterial({ color: '#2f6f78', transparent: true, opacity: 0.88, emissive: new THREE.Color('#0a2a30') }));
  const pond = new THREE.Mesh(new THREE.CircleGeometry(3.2, 28), pondMat);
  pond.rotation.x = -Math.PI / 2;
  pond.position.copy(v3(PX, 0.035, PZ));
  pond.scale.set(1, 0.8, 1);
  w.scene.add(pond);
  w.col.addCircle(PX, PZ, 2.85, -1, 1.5);
  w.emitters.push({ kind: 'water', pos: v3(PX, 0, PZ), on: () => true });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    blob(c.b, k.M.paint, '#9a948a', PX + Math.cos(a) * 3.3, 0.05, PZ + Math.sin(a) * 2.7, 0.35 + (i % 3) * 0.1, 0.2, 0.3, { chunk: c.chunk });
  }
  for (const [dx, dz, r] of [[-1, 0.8, 0.35], [1.2, -0.7, 0.3], [0.3, 1.4, 0.25], [-1.4, -0.8, 0.28]] as const) {
    cyl(c.b, k.M.paint, '#4f8a3a', PX + dx, 0.04, PZ + dz, r, r, 0.02, 10, { chunk: c.chunk });
    if (r > 0.3) blob(c.b, k.M.paint, '#f2c6d8', PX + dx + 0.1, 0.1, PZ + dz, 0.08, 0.05, 0.08, { chunk: c.chunk });
  }
  // pond bench (optional memory)
  const BZ = PZ - 4.1;
  part(c, k.M.wood, '#7a5232', PX, BZ, 0, 0, 0, 0, 1.6, 0.45, 0.45, 1);
  part(c, k.M.wood, '#7a5232', PX, BZ, 0, 0, 0.45, -0.2, 1.6, 0.45, 0.06, 1);
  w.col.addBoxC(PX, BZ, 1.7, 0.5, 0, 0.6);
  const benchNote = compound((b) => box(b, k.M.paint, '#f5eedc', 0, 0, 0, 0.16, 0.004, 0.2));
  place(benchNote, PX + 0.3, 0.46, BZ + 0.05, 0.2);
  w.scene.add(benchNote);
  makeInspect(w, g, { id: 'mem.pond.bench', obj: benchNote, clue: 'mem.pond.bench', hit: [0.4, 0.2, 0.4] });

  w.checkpoints.push({ name: 'cottage', pose: { x: CX, y: 0.15, z: Z0 - 1.6, yaw: 0, pitch: 0 } });
}
