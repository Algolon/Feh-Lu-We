// The Portugal cottage (v0.2 §4): the same 10 × 8 m house, moved to X 20–30 / Z 157–165 on a dry plateau (ground +4,
// floor +4.15) above the lake's west shore: white plaster, terracotta roof, blue shutters. In front, a 10 × 5 m covered
// terrace (floor +4.15, roof underside +6.85 on posts at its outer edge) with the weekend table: two MTG places facing
// each other, a stack of games, 30 Seconds, books, food and bottles. A short ramp from the path. Where the plateau edge
// drops steeply (towards the lake) a retaining wall with a real footing doubles as the parapet. Optional location.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { World, GameApi } from '../interactions/world';
import { type Ctx, wall, floor, ceiling, hipRoof, segBox, threshold } from './arch';
import { Asm, artMats, projectUV, cushion, lathe } from './artkit';
import { box, boxMM, compound } from './kit';
import { table, chair, plant, lantern, staticLantern, joinery, rug, gameBoxes, flwPainting } from './furniture';
import { sideboard, tabletop } from './dressing';
import { addBookStack, bottleGeoOf, addGameBox, GAME_BOXES } from './propkit';
import { mulberry32 } from '../core/rng';
import { makeDoor, makeLamp, makeInspect, place } from '../interactions/props';
import { COTTAGE, COTTAGE_TERRACE, COTTAGE_PAD, COTTAGE_LANDING, COTTAGE_FLOOR, COTTAGE_PAD_Y, COTTAGE_CANOPY } from './layout';
import { terrainHeight } from './terrain';
import { onRoute } from './footprints';

export function buildCottage(w: World, g: GameApi, c: Ctx) {
  const k = c.k;
  const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = COTTAGE;
  const CX = (X0 + X1) / 2, CZ = (Z0 + Z1) / 2, MID = Z0 + 3;
  const B = COTTAGE_PAD_Y, Y = COTTAGE_FLOOR, TOPW = B + 3.3;
  const white = { mat: k.M.plaster, color: '#fbf6ec', t: 0.3, uv: 2, winStyle: 'cottage' as const };
  const win = (at: number) => ({ at, w: 0.9, h: 1.2, sill: 0.95 });
  wall(c, 'x', Z0 + 0.15, X0, X1, B, TOPW, { ...white, exterior: -1, openings: [{ at: CX, w: 1.0, h: 2.4 }], windows: [win(X0 + 2.2), win(X1 - 2.2)] });
  wall(c, 'x', Z1 - 0.15, X0, X1, B, TOPW, { ...white, exterior: 1, windows: [win(X0 + 2.5), win(X1 - 2.5)] });
  wall(c, 'z', X0 + 0.15, Z0 + 0.3, Z1 - 0.3, B, TOPW, { ...white, exterior: -1, windows: [win(Z0 + 5.3)] });
  wall(c, 'z', X1 - 0.15, Z0 + 0.3, Z1 - 0.3, B, TOPW, { ...white, exterior: 1, windows: [win(Z0 + 1.7), win(Z0 + 5.6)] });
  // DEV-03: louvred shutters folded back beside the windows (frame + slats), hung on the whitewashed wall; a painted
  // cobalt barra (plinth band) round the house, as on the Portuguese coast
  const shutter = (x: number, z: number, along: 'x' | 'z', out: number) => {
    const M = artMats(), a = new Asm(c.b, c.chunk, x, B + 0.9, z, along === 'x' ? (out < 0 ? Math.PI : 0) : (out > 0 ? Math.PI / 2 : -Math.PI / 2));
    for (const sx of [-1, 1]) a.add(M.paint, '#3f6fa8', joinery.bx(0.05, 1.35, 0.04), sx * 0.185, 0.675, 0.02);
    for (const yy of [0.025, 0.675, 1.325]) a.add(M.paint, '#3f6fa8', joinery.bx(0.42, 0.05, 0.04), 0, yy, 0.02);
    for (let q = 0; q < 14; q++) a.add(M.paint, '#4a7ab2', joinery.bx(0.33, 0.035, 0.02), 0, 0.09 + q * 0.085, 0.03, { rx: 0.45 });
  };
  for (const x of [X0 + 2.2, X1 - 2.2]) for (const s of [-1, 1]) shutter(x + s * 0.73, Z0 - 0.02, 'x', -1);
  for (const z of [Z0 + 1.7, Z0 + 5.6]) for (const s of [-1, 1]) shutter(X1 + 0.02, z + s * 0.73, 'z', 1);
  // DEV-04A: the barra was ONE solid box over the whole footprint (top +4.42): it buried the room's floor (+4.15) under
  // a blue surface and ran across the doorway as a 27 cm sill. It is now a painted band on the four outer wall faces,
  // stopping at the door, with a stone threshold through the wall depth
  { const bo = { chunk: c.chunk }, y0 = B - 0.3, y1 = B + 0.42, dl = CX - 0.5, dr = CX + 0.5;
    // band ends 2 cm behind the door reveal, so its end face never shares the lining's plane
    for (const [a, b2] of [[X0 - 0.06, dl - 0.02], [dr + 0.02, X1 + 0.06]] as const) boxMM(c.b, k.M.paint, '#47709e', a, b2, y0, y1, Z0 - 0.06, Z0, bo);
    boxMM(c.b, k.M.paint, '#47709e', X0 - 0.06, X1 + 0.06, y0, y1, Z1, Z1 + 0.06, bo);
    boxMM(c.b, k.M.paint, '#47709e', X0 - 0.06, X0, y0, y1, Z0, Z1, bo);
    boxMM(c.b, k.M.paint, '#47709e', X1, X1 + 0.06, y0, y1, Z0, Z1, bo);
    threshold(c, dl, dr, Z0 - 0.02, Z0 + 0.32, Y, '#d8ccb0'); }
  hipRoof(c, CX, CZ, X1 - X0, Z1 - Z0, TOPW, 2.2, k.M.terracotta, '#ffffff', 0.55);
  box(c.b, k.M.plaster, '#fbf6ec', X0 + 1.2, B + 4.0, Z1 - 1.4, 0.8, 2.0, 0.8, { chunk: c.chunk });
  box(c.b, k.M.terracotta, '#ffffff', X0 + 1.2, B + 6.0, Z1 - 1.4, 1.0, 0.15, 1.0, { chunk: c.chunk });
  // interior (own chunk, culled unless seen)
  const outChunk = c.chunk;
  c.chunk = 'cottageIn';
  floor(c, X0 + 0.3, X1 - 0.3, Z0 + 0.3, Z1 - 0.3, Y, k.M.wood, '#b88a5a', Y - B + 0.1, true, 2);
  ceiling(c, X0 + 0.3, X1 - 0.3, Z0 + 0.3, Z1 - 0.3, B + 3.05, '#f4ead6');
  for (let x = X0 + 1; x < X1; x += 1.6) box(c.b, k.M.wood, '#6b4426', x, B + 2.88, CZ, 0.16, 0.17, 7.4, { chunk: c.chunk, uv: 1 });
  wall(c, 'x', MID, X0 + 0.3, X1 - 0.3, Y, B + 3.05, { t: 0.2, mat: k.M.plaster, color: '#f6efe2', openings: [{ at: CX, w: 1.4, h: 2.3 }] });
  makeDoor(w, g, { id: 'door.cottage', x: CX - 0.5, z: Z0 + 0.15, dir: 'x+', width: 1.0, height: 2.2, y0: Y, swing: 1, color: '#3f6fa8' });
  for (const x of [X0 + 1, X1 - 1.2]) plant(c, x, Z0 + 0.8, Y, 0.9, '#c9774a');
  flwPainting(c, 'FLW-D2-045', X0 + 0.32, Y + 1.6, Z0 + 1.6, Math.PI / 2); // DEV-04D D1: the coast path, on the entry's west wall
  const el = lantern(w, X1 - 0.6, Y + 1.8, Z0 + 2.6, 0.7);
  makeLamp(w, g, { id: 'lamp.cottageEntry', ...el, name: 'lantaarn', defaultOn: true, intensity: 3, distance: 6, hit: [0.4, 0.5, 0.4] });
  // the old gathering room: an empty table with folded cloths, chairs pushed in
  const TZ = Z0 + 5.4;
  table(c, CX, TZ, Y, 5.0, 1.4, 0, '#7a4a28');
  for (let i = 0; i < 5; i++) {
    if (i !== 2) chair(c, CX - 2 + i, TZ - 1.1, Y, 0, '#c4553d');
    chair(c, CX - 2 + i, TZ + 1.1, Y, Math.PI, '#c4553d');
  }
  // DEV-04B: folded cloths as soft folded linen (were slabs), the burnt-down candle in a turned candlestick; a blue
  // and white kilim under the table and a sideboard with plates on the west wall give the room a use and a palette
  { const M = artMats();
    for (let i = 0; i < 3; i++) { const a = new Asm(c.b, c.chunk, CX - 1.6 + i * 1.6, Y + 0.76, TZ, (i - 1) * 0.12); for (let q = 0; q <= i % 2; q++) a.add(M.upholstery, ['#efe6d6', '#e8d8c0', '#f5f0e6'][i], joinery.cg('foldedCloth', () => projectUV(cushion(0.4, 0.035, 0.3, 0.014, 0.004, 'top', 1, 2), 0.25)), 0, 0.0175 + q * 0.035, 0, { ry: q * 0.1 }); } }
  tabletop(c, CX + 1.9, TZ, Y + 0.76, 0, ['candle'], 3);
  rug(c, CX, TZ, Y + 0.005, 6.0, 2.8, 0, '#d8e4f4', 'kilim', true);
  sideboard(c, X0 + 0.55, TZ - 0.6, Y, Math.PI / 2, 1.5, 0.45, 0.85, '#6b4426');
  flwPainting(c, 'FLW-D2-046', X1 - 2.1, Y + 1.65, MID + 0.12, 0); // DEV-04D D1: one piece only (the set table stays the story)
  { const M = artMats(), a = new Asm(c.b, c.chunk, X0 + 0.55, Y + 0.85, TZ - 0.6, Math.PI / 2);
    for (let i = 0; i < 4; i++) a.add(M.ceramic, i % 2 ? '#f2f0ea' : '#3f6fa8', joinery.cg('azulejoPlate', () => new THREE.CylinderGeometry(0.12, 0.11, 0.016, 14).rotateX(Math.PI / 2)), -0.45 + i * 0.3, 0.13, -0.15, { rx: -0.15 });
    a.add(M.ceramic, '#e6dcc4', joinery.cg('cottageJug', () => lathe([[0.001, 0], [0.06, 0], [0.075, 0.08], [0.06, 0.18], [0.04, 0.22], [0.05, 0.24], [0.001, 0.23]], 12)), 0.55, 0, 0.05); }
  const card = compound((b) => { box(b, k.M.paint, '#f5eedc', 0, 0, 0, 0.18, 0.12, 0.01, { rx: -0.3 }); });
  place(card, CX, Y + 0.77, TZ - 0.5, 0);
  w.scene.add(card);
  makeInspect(w, g, { id: 'mem.cottage.table', obj: card, clue: 'mem.cottage.table', hit: [0.3, 0.25, 0.3] });
  const note = compound((b) => box(b, k.M.paint, '#f2e8d2', 0, 0, 0, 0.22, 0.004, 0.16, { yaw: 0.2 }));
  place(note, CX - 1.1, Y + 0.77, TZ + 0.2, 0);
  w.scene.add(note);
  makeInspect(w, g, { id: 'inspect.cottageNote', obj: note, clue: 'c.cottageNote', hit: [0.35, 0.2, 0.3], label: 'Lezen: briefje' });
  const bm = w.material(new THREE.MeshBasicMaterial({ color: '#8a7a5a' }));
  const bulbs = Array.from({ length: 9 }, (_, i) => new THREE.SphereGeometry(0.05, 6, 4).translate(X0 + 1 + i, B + 2.65 - Math.sin((i / 8) * Math.PI) * 0.25, -TZ));
  const bulbMesh = new THREE.Mesh(mergeGeometries(bulbs)!, bm); // one draw call for the whole string
  bulbMesh.userData.room = 'cottageRoom';
  w.scene.add(bulbMesh);
  bulbs.forEach((b) => b.dispose());
  const rl = lantern(w, X0 + 0.6, Y + 1.8, TZ + 1.6, 0.7);
  makeLamp(w, g, { id: 'lamp.cottageRoom', ...rl, name: 'lantaarn', defaultOn: false, intensity: 3, distance: 7, hit: [0.4, 0.5, 0.4] });
  c.chunk = outChunk;

  // ---------------------------------------------------------------- covered terrace (+4.15), canopy on posts, ramp
  const T = COTTAGE_TERRACE;
  // terracotta floor tiles (square flags tinted terracotta: the roof-tile texture is for roofs) with a stone edge
  floor(c, T.x0, T.x1, T.z0, T.z1, Y, k.M.tile, '#c98a64', Y - B + 0.15, true, 1.2);
  boxMM(c.b, k.M.stone, '#d8ccb0', T.x0 + 0.01, T.x1 + 0.04, Y - 0.06, Y + 0.005, T.z0 - 0.04, T.z0 + 0.12, { chunk: c.chunk, uv: 1 }); // starts at the landing
  // DEV-04A path junction: both cottage routes used to run on over the terrace edge and a loose tile slab (the "ramp",
  // a flat box 8 cm proud of the path). One tiled landing now owns that ground (COTTAGE_LANDING, the routes are
  // clipped at its edges by the path network): flat where the paths arrive (south and north mouths along X 18), it
  // rises over its last 1.1 m (inside the v0.2 COTTAGE_RAMP strip) to the terrace floor; a stone border frames it and a stone
  // cheek closes the raised edge in front of the terrace.
  const L = COTTAGE_LANDING, LY = B + 0.05, RX = 18.9;
  { const o = { chunk: c.chunk, uv: 1 } as const, e = 0.12;
    boxMM(c.b, k.M.tile, '#c08060', L.x0 + e, RX, B - 0.3, LY - 0.005, L.z0 + e, L.z1 - e, o); // tile field (flat)
    for (const [x0, x1, z0, z1] of [[L.x0, RX, L.z0, L.z0 + e], [L.x0, RX, L.z1 - e, L.z1], [L.x0, L.x0 + e, L.z0 + e, L.z1 - e]] as const) boxMM(c.b, k.M.stone, '#d8ccb0', x0, x1, B - 0.3, LY, z0, z1, o);
    // the rising part: a tiled wedge from LY at X 18.9 to the terrace floor at X 20
    const sh = new THREE.Shape();
    sh.moveTo(RX, B - 0.3); sh.lineTo(L.x1, B - 0.3); sh.lineTo(L.x1, Y - 0.005); sh.lineTo(RX, LY - 0.005); sh.closePath();
    const wg = new THREE.ExtrudeGeometry(sh, { depth: L.z1 - L.z0, bevelEnabled: false });
    wg.translate(0, 0, -L.z1);
    c.b.add(k.M.tile, wg, new THREE.Matrix4(), '#c08060', c.chunk, true, 0);
    wg.dispose();
    boxMM(c.b, k.M.stone, '#d8ccb0', L.x1 - 0.04, L.x1 + 0.08, B - 0.3, Y + 0.005, L.z0 + 0.01, T.z0 - 0.04, o); // cheek in front of the terrace (1 cm behind the wedge's end face)
  }
  w.col.addFloor(L.x0, RX, L.z0, L.z1, LY);
  w.col.addRamp({ minX: RX, maxX: L.x1, minZ: L.z0, maxZ: L.z1, axis: 'x', a: RX, ya: LY, b: L.x1, yb: Y });
  // lean-to canopy from the house wall (+7.15) to the front beam (+6.95): underside ≥ +6.85 everywhere
  const roofY0 = COTTAGE_CANOPY + 0.3, roofY1 = COTTAGE_CANOPY + 0.1, rd = T.z1 - T.z0 + 0.3;
  const tilt = Math.atan2(roofY0 - roofY1, rd);
  box(c.b, k.M.terracotta, '#ffffff', (T.x0 + T.x1) / 2, (roofY0 + roofY1) / 2, (T.z0 + T.z1) / 2 - 0.15, T.x1 - T.x0 + 0.6, 0.12, rd + 0.4, { chunk: c.chunk, rx: tilt });
  boxMM(c.b, k.M.wood, '#6b4426', T.x0 - 0.1, T.x1 + 0.1, COTTAGE_CANOPY, COTTAGE_CANOPY + 0.18, T.z0 + 0.05, T.z0 + 0.3, { chunk: c.chunk });
  // rafters under the tiles (wall plate to front beam): the canopy reads as a built lean-to from below
  for (let x = T.x0 + 0.4; x < T.x1; x += 1.0) segBox(c, k.M.wood, '#6b4426', [x, COTTAGE_CANOPY + 0.16, T.z0 + 0.15], [x, roofY0 - 0.08, T.z1 + 0.05], 0.1, 0.14);
  boxMM(c.b, k.M.wood, '#6b4426', T.x0, T.x1, roofY0 - 0.3, roofY0 - 0.1, T.z1 - 0.05, T.z1 + 0.08, { chunk: c.chunk }); // wall plate
  // posts on their own footings at the outer edge, outside the walking strips (path along Z 152, threshold line X 25)
  for (const x of [21.6, 28.4]) {
    box(c.b, k.M.wood, '#6b4426', x, Y, T.z0 + 0.18, 0.18, COTTAGE_CANOPY - Y, 0.18, { chunk: c.chunk });
    box(c.b, k.M.stone, '#cfc3a6', x, B - 0.2, T.z0 + 0.18, 0.4, Y - B + 0.25, 0.4, { chunk: c.chunk });
    w.col.addCircle(x, T.z0 + 0.18, 0.15, B, COTTAGE_CANOPY);
  }
  // the weekend table: two MTG places facing each other, games stack, 30 Seconds box, books, food, bottles
  const tx = 27.2, tz = T.z0 + 2.6; // east of the door line (X 25) so the way to the door stays free
  table(c, tx, tz, Y, 2.2, 1.0, 0, '#efe6d6');
  chair(c, tx, tz - 0.85, Y, 0, '#3f6fa8');
  chair(c, tx, tz + 0.85, Y, Math.PI, '#3f6fa8');
  for (const [dz, col] of [[-0.3, '#2b3a5a'], [0.3, '#5a2b2b']] as const) {
    box(c.b, k.M.paint, col, tx, Y + 0.76, tz + dz, 0.6, 0.004, 0.32, { chunk: c.chunk }); // play mats
    for (let i = 0; i < 4; i++) box(c.b, k.M.paint, '#f2ead8', tx - 0.22 + i * 0.15, Y + 0.765, tz + dz, 0.06, 0.003, 0.09, { chunk: c.chunk, yaw: (i - 1.5) * 0.08 });
  }
  // DEV-04B: the games stack and the quiz box are printed game boxes (lids over trays), the books are the book family
  gameBoxes(c, tx + 0.85, tz - 0.25, Y + 0.76, 0.1, ['a', 'b', 'c', 'd'], 2);
  addGameBox(new Asm(c.b, c.chunk, tx - 0.85, Y + 0.76, tz - 0.25, -0.1), { ...GAME_BOXES[4], w: 0.26, d: 0.26, h: 0.08, art: 1 }, 0, 0, 0); // the quiz box
  addBookStack(new Asm(c.b, c.chunk, tx - 0.85, Y + 0.76, tz + 0.25, 0.2), mulberry32(77), ['#5a3a2a', '#2f5a6a', '#8e372c'], 0, 0, 0, 2);
  { // an open pizza box with what is left of the pizza; three bottles (glass with a darker fill)
    const M = artMats(), a = new Asm(c.b, c.chunk, tx + 0.6, Y + 0.76, tz + 0.3, 0.25);
    a.add(M.paint, '#d8c8a8', joinery.bx(0.36, 0.035, 0.36), 0, 0.018, 0);
    a.add(M.paint, '#cfbe9c', joinery.bx(0.36, 0.36, 0.01), 0, 0.2, -0.18, { rx: -0.25 });
    a.add(M.paint, '#e0b070', joinery.cg('pizza', () => new THREE.CylinderGeometry(0.16, 0.16, 0.012, 14, 1, false, 0, Math.PI * 1.3)), 0, 0.04, 0);
    a.add(M.paint, '#b84a2a', joinery.cg('pizzaTop', () => new THREE.CylinderGeometry(0.14, 0.14, 0.004, 14, 1, false, 0.05, Math.PI * 1.25)), 0, 0.048, 0);
    for (let i = 0; i < 3; i++) {
      const b2 = new Asm(c.b, c.chunk, tx + 0.25 + i * 0.12, Y + 0.76, tz - 0.05, i);
      b2.add(M.ceramic, ['#3a5a24', '#5a3414', '#3a5a24'][i], bottleGeoOf(i === 1 ? 'beer' : 'wine'), 0, 0, 0);
    }
  }
  { // slatted bench against the house
    const M = artMats(), a = new Asm(c.b, c.chunk, T.x1 - 0.6, Y, T.z1 - 0.6, Math.PI / 2);
    for (let q = 0; q < 4; q++) a.add(M.timber, '#7a5232', joinery.bx(1.6, 0.035, 0.09), 0, 0.445, -0.15 + q * 0.1);
    for (const lx of [-0.7, 0.7]) { a.add(M.timber, '#5a3a22', joinery.bx(0.06, 0.43, 0.06), lx, 0.215, -0.15); a.add(M.timber, '#5a3a22', joinery.bx(0.06, 0.43, 0.06), lx, 0.215, 0.15); }
  }
  w.col.addBox(T.x1 - 0.85, T.x1 - 0.35, T.z1 - 1.4, T.z1 + 0.2, Y, Y + 0.5);
  for (const [x, z] of [[T.x0 + 0.6, T.z1 - 0.5], [T.x1 - 0.6, T.z0 + 0.8]] as const) plant(c, x, z, Y, 1.1, '#c8643a');
  for (const x of [CX - 1, CX + 1]) staticLantern(c, w, x, Y + 2.2, Z0, 0.7, 0, 3, 6);

  // ---------------------------------------------------------------- plateau edge: retaining wall where the drop is steep
  // Sample the pad rim; where the bank falls away steeply, build a stone wall from the ground (its footing) up to a 0.95 m
  // parapet. Never across a route.
  const P = COTTAGE_PAD;
  const rim: { axis: 'x' | 'z'; f: number; a0: number; a1: number; out: number }[] = [
    { axis: 'z', f: P.x1, a0: P.z0, a1: P.z1, out: 1 }, { axis: 'x', f: P.z0, a0: P.x0, a1: P.x1, out: -1 }, { axis: 'x', f: P.z1, a0: P.x0, a1: P.x1, out: 1 },
  ];
  for (const e of rim) {
    for (let a = e.a0; a < e.a1 - 1e-6; a += 1) {
      const am = a + 0.5;
      const [px, pz] = e.axis === 'z' ? [e.f, am] : [am, e.f];
      // steep when the land 3 m out lies > 1.5 m below the plateau (a bank steeper than 1 : 2); the footing follows the
      // ground right at the wall
      const out3 = e.axis === 'z' ? terrainHeight(e.f + e.out * 3, am) : terrainHeight(am, e.f + e.out * 3);
      const ground = Math.min(e.axis === 'z' ? terrainHeight(e.f + e.out * 0.4, am) : terrainHeight(am, e.f + e.out * 0.4), B);
      if (B - out3 < 1.5 || onRoute(px, pz, 1.0)) continue;
      const [x0, x1, z0, z1] = e.axis === 'z' ? [e.f - 0.2, e.f + 0.2, a, a + 1] : [a, a + 1, e.f - 0.2, e.f + 0.2];
      boxMM(c.b, k.M.stone, a % 2 ? '#b8ae98' : '#c4baa2', x0, x1, ground - 0.3, Y + 0.95, z0, z1, { chunk: c.chunk, uv: 1 });
      w.col.addBox(x0, x1, z0, z1, ground - 0.3, Y + 1.1, { occludes: true });
    }
  }
  w.checkpoints.push({ name: 'cottage', pose: { x: 25, y: Y, z: T.z0 + 1.6, yaw: 0, pitch: 0 } });
}
