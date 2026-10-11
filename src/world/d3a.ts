// DEV-04D D3-a: dining / game room and kitchen craft and composition (docs/dev04d/DEV04D_D3_KICKOFF.md §5).
// Architectural dressing (panelled wainscot, a tiled splashback, wall cupboards) and the furniture that gives the two
// rooms their zones (refectory and farmhouse tables, a games cabinet, a dartboard cabinet, a serving console, a china
// cabinet, enamel pendants, a peg rail with a clock). Visual only: nothing here is interactable, and every piece is built
// on the existing art kit materials (timber / paint / brass / ceramic / stone), so the rooms' batches gain no material.
// Origins at the floor (or the wall face) centre, facing plan heading `yaw`; local +lz is forward (Asm convention).
import * as THREE from 'three';
import type { Ctx } from './arch';
import { Asm, artMats, lathe, projectUV } from './artkit';
import { joinery } from './furniture';
import { addGameBox, GAME_BOXES, bottleGeoOf, propMats } from './propkit';
import { registerArt, artFootprint } from './openings';

const { sb, bx, cg, darker } = joinery;
const collide = (c: Ctx, x: number, z: number, yaw: number, w: number, d: number, h: number, y0 = 0) => {
  const swap = Math.abs(Math.sin(yaw)) > 0.7;
  c.col.addBoxC(x, z, swap ? d : w, swap ? w : d, y0, y0 + h);
};
/** Facing vector of a plan heading. */
const fwd = (yaw: number): [number, number] => [Math.sin(yaw), Math.cos(yaw)];

/**
 * Frame-and-panel door or drawer front (w × h, field face at local lz `z`, facing `dir` along lz): a recessed panel field with stiles and rails
 * standing 6 mm proud of it. Reads as joinery at room distance (the rails catch the light), and costs 5 plain boxes.
 */
export function panelDoor(a: Asm, M: ReturnType<typeof artMats>, mat: THREE.Material, col: THREE.ColorRepresentation, x: number, y: number, z: number, w: number, h: number, rail = 0.06, dir: 1 | -1 = 1) {
  const field = darker(col, 0.86);
  a.add(mat, field, bx(w - 0.02, h - 0.02, 0.01), x, y, z - dir * 0.005); // inside the frame: no face shared with a rail
  for (const sy of [-1, 1]) a.add(mat, col, bx(w, rail, 0.022), x, y + sy * (h / 2 - rail / 2), z - dir * 0.005);
  for (const sx of [-1, 1]) a.add(mat, col, bx(rail, h - 2 * rail, 0.022), x + sx * (w / 2 - rail / 2), y, z - dir * 0.005);
  void M;
}

// ------------------------------------------------------------------------------------------------ wainscot
export interface WallRun { axis: 'x' | 'z'; f: number; dir: 1 | -1; a0: number; a1: number }
/**
 * Panelled wainscot (dado) along a wall run: a skirting board, a frame (bottom rail, top rail, stiles about every
 * 0.6 m) over a recessed field, and a moulded dado rail on top. 0.80 m high, so it stays under the window sills (1.05)
 * and the curtains. `axis` = the axis the wall runs along, `f` = its face coordinate, `dir` = the room side (+1 / −1).
 */
export function wainscot(c: Ctx, y0: number, runs: WallRun[], wood = '#6e4a2c') {
  const M = artMats(), field = darker(wood, 0.82), cap = darker(wood, 0.9), H = 0.8;
  for (const r of runs) {
    const L = r.a1 - r.a0;
    if (L < 0.3) continue;
    const mid = (r.a0 + r.a1) / 2;
    // the run's forward = into the room; local x runs along the wall
    const yaw = r.axis === 'x' ? (r.dir > 0 ? 0 : Math.PI) : r.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    const [x, z] = r.axis === 'x' ? [mid, r.f] : [r.f, mid];
    const a = new Asm(c.b, c.chunk, x, y0, z, yaw);
    a.add(M.timber, field, bx(L, H - 0.14, 0.012), 0, 0.14 + (H - 0.14) / 2, 0.006); // field
    a.add(M.timber, darker(wood, 0.7), bx(L, 0.15, 0.03), 0, 0.075, 0.015); // skirting (covers the wall's own 22 mm skirting)
    a.add(M.timber, wood, bx(L, 0.07, 0.02), 0, 0.175, 0.01); // bottom rail
    a.add(M.timber, wood, bx(L, 0.08, 0.02), 0, H - 0.1, 0.01); // top rail
    a.add(M.timber, cap, bx(L, 0.04, 0.045), 0, H - 0.02, 0.0225); // dado rail
    a.add(M.timber, wood, bx(L, 0.018, 0.032), 0, H - 0.049, 0.016); // its bead
    const n = Math.max(1, Math.round(L / 0.62)), step = L / n;
    for (let i = 0; i <= n; i++) a.add(M.timber, wood, bx(0.07, H - 0.35, 0.02), -L / 2 + Math.min(L - 0.035, Math.max(0.035, i * step)), 0.21 + (H - 0.35) / 2 + 0.0, 0.01);
  }
}

// ------------------------------------------------------------------------------------------------ tables
const balusterLeg = (h: number) => cg(`d3aBaluster${h.toFixed(3)}`, () => projectUV(lathe([
  [0.001, 0], [0.045, 0], [0.032, 0.07], [0.05, 0.2 * h / 0.56], [0.056, 0.3 * h / 0.56], [0.028, 0.46 * h / 0.56],
  [0.044, 0.51 * h / 0.56], [0.03, h - 0.012], [0.04, h], [0.001, h]], 6), 1, 'y'));
/**
 * Refectory / farmhouse table (D3-a): turned baluster legs with square blocks under a 12 cm apron, breadboard ends
 * (cross grain) on the top, and floor stretchers (one per leg pair, a centre rail between them). The top surface is at
 * `h` (0.76) and the footprint / collider match the old `table`, so everything standing on it stays seated.
 * Long side along local z (w across, d long).
 */
export function refectoryTable(c: Ctx, x: number, z: number, y0: number, w: number, d: number, yaw = 0, color = '#6b4426', h = 0.76) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('refectoryTable');
  const dk = darker(color, 0.8), ap = 0.12, top = 0.045, blockH = ap + 0.03, legH = h - top - blockH;
  const lx = w / 2 - 0.13, pairs = d > 3.5 ? 3 : 2, lz0 = d / 2 - 0.28;
  const lzs = pairs === 3 ? [-lz0, 0, lz0] : [-lz0, lz0];
  a.add(M.timber, color, sb(w, top, d - 0.24, 0.008), 0, h - top / 2, 0);
  for (const s2 of [-1, 1]) a.add(M.timber, darker(color, 0.94), bx(w, top, 0.12), 0, h - top / 2, s2 * (d / 2 - 0.06)); // breadboard ends
  for (const s2 of [-1, 1]) {
    a.add(M.timber, dk, bx(0.035, ap, 2 * lz0), s2 * lx, h - top - ap / 2, 0); // side aprons
    a.add(M.timber, dk, bx(2 * lx, ap, 0.035), 0, h - top - ap / 2, s2 * lz0); // end aprons
  }
  for (const sx of [-1, 1]) for (const lz of lzs) {
    a.add(M.timber, dk, balusterLeg(legH), sx * lx, 0, lz);
    a.add(M.timber, dk, bx(0.085, blockH, 0.085), sx * lx, legH + blockH / 2, lz); // square block (the apron's tenons)
  }
  for (const lz of [-lz0, lz0]) a.add(M.timber, dk, bx(2 * lx, 0.05, 0.05), 0, 0.12, lz); // end stretchers
  a.add(M.timber, dk, bx(0.05, 0.05, 2 * lz0), 0, 0.12, 0); // centre rail
  a.end();
  collide(c, x, z, yaw, w, d, h, y0);
}

// ------------------------------------------------------------------------------------------------ dining room
/**
 * Games cabinet (dining, NW corner): plinth, a panelled cupboard base, an open upper case behind a glazing-bar frame
 * with board games and card boxes on two shelves, a cornice. Against a wall; 1.1 × 0.4 × 2.0.
 */
export function gamesCabinet(c: Ctx, x: number, z: number, y0: number, yaw: number, wood = '#5a3a22') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('gamesCabinet'), W = 1.1, D = 0.4, lt = darker(wood, 1.12);
  a.add(M.timber, darker(wood, 0.7), bx(W - 0.04, 0.09, D - 0.04), 0, 0.045, -0.01);
  a.add(M.timber, wood, bx(W, 0.78, D), 0, 0.09 + 0.39, 0);
  for (const s2 of [-1, 1]) { panelDoor(a, M, M.timber, lt, s2 * 0.27, 0.48, D / 2 + 0.011, 0.5, 0.66); a.add(M.brass, '#c9a44c', bx(0.012, 0.1, 0.02), s2 * 0.05, 0.56, D / 2 + 0.03); }
  a.add(M.timber, lt, bx(W + 0.04, 0.04, D + 0.04), 0, 0.89, 0.01); // counter top of the base
  // upper case: back board, sides, two shelves, the glazing-bar front frame
  const U0 = 0.91, UH = 1.0, ud = 0.3;
  a.add(M.paint, '#2e3b3a', bx(W - 0.04, UH, 0.02), 0, U0 + UH / 2, -D / 2 + 0.02);
  for (const s2 of [-1, 1]) a.add(M.timber, wood, bx(0.03, UH, ud), s2 * (W / 2 - 0.035), U0 + UH / 2, -D / 2 + ud / 2 + 0.01);
  for (const yy of [U0 + 0.02, U0 + 0.46]) a.add(M.timber, wood, bx(W - 0.1, 0.022, ud - 0.02), 0, yy, -D / 2 + ud / 2 + 0.01);
  a.add(M.timber, wood, bx(W - 0.04, 0.05, ud + 0.02), 0, U0 + UH - 0.025, -D / 2 + ud / 2 + 0.01);
  const fz = -D / 2 + ud + 0.02;
  for (const s2 of [-1, 0, 1]) a.add(M.timber, lt, bx(0.025, UH - 0.05, 0.02), s2 * (W / 2 - 0.05), U0 + UH / 2 - 0.02, fz);
  a.add(M.timber, lt, bx(W - 0.08, 0.025, 0.02), 0, U0 + 0.46 + 0.02, fz);
  // the games: stacks of boxes and card boxes. Their print parts join the room's existing prop-atlas batch (drawn without
  // shadow, as the rugs are), so the cabinet adds no draw call
  const ga = { add: (m: THREE.Material, col: THREE.ColorRepresentation, g: THREE.BufferGeometry, lx: number, ly: number, lz: number, o: Parameters<Asm['add']>[6] = {}) => a.add(m, col, g, lx, ly, lz, m === propMats().print ? { ...o, shadow: false } : o) } as unknown as Asm;
  let yy = 0;
  for (let i = 0; i < 3; i++) { const b = GAME_BOXES[i]; yy += addGameBox(ga, b, -0.24, U0 + 0.031 + yy, -0.04, { ry: (i % 2 ? 1 : -1) * 0.05 }); }
  yy = 0;
  for (let i = 4; i < 6; i++) { const b = GAME_BOXES[i]; yy += addGameBox(ga, b, 0.25, U0 + 0.031 + yy, -0.04, { ry: (i % 2 ? 1 : -1) * 0.06 }); }
  yy = 0;
  for (let i = 0; i < 1; i++) { const b = GAME_BOXES[(i * 3 + 1) % GAME_BOXES.length]; yy += addGameBox(ga, b, -0.22, U0 + 0.471 + yy, -0.04, { ry: 0.04 * i }); }
  for (let i = 0; i < 5; i++) a.add(M.paint, ['#8e372c', '#2f4a6a', '#e6dcc4', '#3b4e3c', '#7a3a1a'][i], bx(0.065, 0.095, 0.025), 0.12 + i * 0.07, U0 + 0.471 + 0.0475, -0.05 + (i % 2) * 0.01);
  a.add(M.timber, lt, bx(W + 0.1, 0.07, D + 0.06), 0, U0 + UH + 0.035, 0.0); // cornice
  a.end();
  collide(c, x, z, yaw, W, D, 2.0, y0);
}

const discGeo = (r: number, t: number, seg = 24) => cg(`d3aDisc${r},${t},${seg}`, () => new THREE.CylinderGeometry(r, r, t, seg).rotateX(Math.PI / 2));
/** Alternate dartboard sectors (10 of the 20, both windings), r0 → r1, facing local ±z. */
const sectorGeo = (r0: number, r1: number) => cg(`d3aSectors${r0},${r1}`, () => {
  const p: number[] = [], n = 20, s = (2 * Math.PI) / n;
  for (let i = 0; i < n; i += 2) {
    const a0 = i * s - s / 2, a1 = a0 + s, q = [[r0, a0], [r1, a0], [r1, a1], [r0, a1]].map(([r, t]) => [Math.cos(t) * r, Math.sin(t) * r, 0]);
    for (const [i0, i1, i2] of [[0, 1, 2], [0, 2, 3], [0, 2, 1], [0, 3, 2]]) p.push(...q[i0], ...q[i1], ...q[i2]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((p.length / 3) * 2).fill(0.5), 2));
  g.computeVertexNormals();
  return g;
});
/**
 * Dartboard cabinet on a wall (dining games corner): a back board, the board (sectors, double and treble rings, bull),
 * two doors standing open with chalk score panels (tally strokes), three darts in the board. Bull at 1.73 m. `y` is
 * the floor; a brass throw line (oche) is set into the floor 2.37 m out. Registered as wall art (door / window rules).
 */
export function dartboard(c: Ctx, x: number, y: number, z: number, yaw: number) {
  const M = artMats(), BY = 1.73, a = new Asm(c.b, c.chunk, x, y + BY, z, yaw), wood = '#4a2f1a';
  a.add(M.timber, wood, bx(0.6, 0.62, 0.04), 0, 0, 0.02); // back board
  for (const s2 of [-1, 1]) {
    a.add(M.timber, wood, bx(0.6, 0.04, 0.12), 0, s2 * 0.31, 0.06); // head / sill of the case
    a.add(M.timber, wood, bx(0.04, 0.62, 0.12), s2 * 0.3, 0, 0.06);
    // open door, flat against the wall beside the case, its chalk panel facing out
    a.add(M.timber, wood, bx(0.3, 0.62, 0.025), s2 * 0.47, 0, 0.0125);
    a.add(M.paint, '#2a3a32', bx(0.24, 0.52, 0.006), s2 * 0.47, 0, 0.028);
    for (let r = 0; r < 2; r++) for (let k = 0; k < (r % 2 ? 3 : 5); k++) a.add(M.paint, '#e8e4d8', bx(0.005, 0.045, 0.004), s2 * 0.47 - 0.08 + k * 0.022, 0.17 - r * 0.1, 0.032, { rz: k === 4 ? 1.1 : 0 });
  }
  const t0 = 0.045;
  a.add(M.paint, '#1d1b19', discGeo(0.225, 0.04), 0, 0, t0 + 0.02);
  a.add(M.paint, '#a8342a', discGeo(0.17, 0.004, 24), 0, 0, t0 + 0.042);
  a.add(M.paint, '#1d1b19', discGeo(0.16, 0.004, 24), 0, 0, t0 + 0.044);
  a.add(M.paint, '#e8dcbc', sectorGeo(0.012, 0.16), 0, 0, t0 + 0.0465, { rz: Math.PI / 20 });
  a.add(M.paint, '#3a7a4a', discGeo(0.105, 0.004, 20), 0, 0, t0 + 0.048);
  a.add(M.paint, '#1d1b19', discGeo(0.095, 0.004, 20), 0, 0, t0 + 0.05);
  a.add(M.paint, '#e8dcbc', sectorGeo(0.03, 0.095), 0, 0, t0 + 0.0525, { rz: Math.PI / 20 });
  a.add(M.paint, '#3a7a4a', discGeo(0.03, 0.004, 16), 0, 0, t0 + 0.054);
  a.add(M.paint, '#a8342a', discGeo(0.013, 0.004, 12), 0, 0, t0 + 0.056);
  for (const [dx, dy] of [[0.05, 0.07], [-0.08, 0.02], [0.02, -0.11]] as const) {
    a.add(M.brass, '#b8a070', cg('dartBarrel', () => new THREE.CylinderGeometry(0.004, 0.006, 0.07, 6).rotateX(Math.PI / 2)), dx, dy, t0 + 0.09);
    a.add(M.paint, '#c4553d', bx(0.03, 0.002, 0.035), dx, dy, t0 + 0.135);
  }
  registerArt(artFootprint(`dartboard@${x.toFixed(2)},${z.toFixed(2)}`, x, y + BY, z, yaw, 1.24, 0.66));
  const [fx, fz] = fwd(yaw);
  const o = new Asm(c.b, c.chunk, x + fx * 2.37, y, z + fz * 2.37, yaw);
  o.add(M.brass, '#b8913e', bx(0.6, 0.006, 0.035), 0, 0.003, 0);
}

/**
 * Serving console (dining, under D2-010 by the kitchen arch): a narrow side table (tapered legs, apron, a pot board
 * below) carrying a stack of plates, a covered tureen, two wine bottles and four glasses. 1.6 × 0.42, top at 0.86.
 */
export function servingConsole(c: Ctx, x: number, z: number, y0: number, yaw: number, wood = '#5a3a22') {
  const { taperLeg } = joinery, M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('servingConsole'), W = 1.6, D = 0.42, H = 0.86, dk = darker(wood, 0.8);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, dk, taperLeg(H - 0.035, 0.032, 0.022), sx * (W / 2 - 0.06), 0, sz * (D / 2 - 0.05));
  a.add(M.timber, wood, sb(W, 0.035, D, 0.008), 0, H - 0.0175, 0);
  a.add(M.timber, dk, bx(W - 0.14, 0.1, 0.022), 0, H - 0.085, D / 2 - 0.06);
  a.add(M.timber, dk, bx(W - 0.14, 0.1, 0.022), 0, H - 0.085, -D / 2 + 0.06);
  for (const s2 of [-1, 1]) a.add(M.timber, dk, bx(0.022, 0.1, D - 0.14), s2 * (W / 2 - 0.06), H - 0.085, 0);
  a.add(M.timber, wood, bx(W - 0.1, 0.02, D - 0.08), 0, 0.17, 0); // pot board, between the legs
  // on the top: plates, a tureen with its lid, bottles and glasses
  a.add(M.ceramic, '#e6dcc4', cg('d3aPlateStack', () => new THREE.CylinderGeometry(0.13, 0.12, 0.08, 12).translate(0, 0.04, 0)), -0.52, H, 0.0);
  a.add(M.ceramic, '#efe9dc', cg('d3aPlate', () => lathe([[0.001, 0], [0.09, 0], [0.13, 0.014], [0.125, 0.016], [0.001, 0.006]], 12)), -0.52, H + 0.08, 0.0);
  a.add(M.ceramic, '#efe9dc', cg('d3aTureen', () => lathe([[0.001, 0], [0.07, 0], [0.075, 0.015], [0.13, 0.07], [0.14, 0.13], [0.12, 0.15], [0.001, 0.15]], 10)), -0.06, H, 0.02);
  a.add(M.ceramic, '#6f91a6', cg('d3aTureenLid', () => lathe([[0.001, 0], [0.125, 0], [0.11, 0.035], [0.04, 0.06], [0.025, 0.09], [0.001, 0.095]], 10)), -0.06, H + 0.15, 0.02);
  for (const dx of [0.3, 0.4]) a.add(M.ceramic, '#2f3a24', bottleGeoOf('wine'), dx, H, -0.08 + (dx - 0.3) * 0.6);
  for (let i = 0; i < 4; i++) a.add(M.ceramic, '#d8e4e6', cg('d3aGlass', () => lathe([[0.001, 0], [0.035, 0], [0.005, 0.012], [0.005, 0.07], [0.038, 0.16], [0.001, 0.1]], 6)), 0.55 + (i % 2) * 0.09, H, 0.07 - Math.floor(i / 2) * 0.12);
  a.add(M.ceramic, '#e6dcc4', cg('d3aStackDish', () => lathe([[0.001, 0], [0.1, 0], [0.16, 0.05], [0.165, 0.06], [0.001, 0.02]], 14)), -0.52, 0.19, 0.0); // a dish on the pot board
  a.end();
  collide(c, x, z, yaw, W, D, H, y0);
}

/**
 * China cabinet (dining, south wall between two windows): plinth, a panelled two-door base, a glazed upper case
 * (dark green-grey back, two shelves of plates on edge and glasses, glazing bars), a broken-front cornice.
 * 1.2 × 0.42 × 2.15.
 */
export function chinaCabinet(c: Ctx, x: number, z: number, y0: number, yaw: number, wood = '#5a3a22') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('chinaCabinet'), W = 1.2, D = 0.42, lt = darker(wood, 1.12);
  a.add(M.timber, darker(wood, 0.7), bx(W - 0.04, 0.1, D - 0.04), 0, 0.05, -0.01);
  a.add(M.timber, wood, bx(W, 0.76, D), 0, 0.1 + 0.38, 0);
  for (const s2 of [-1, 1]) { panelDoor(a, M, M.timber, lt, s2 * 0.295, 0.49, D / 2 + 0.011, 0.55, 0.64); a.add(M.brass, '#c9a44c', cg('pullKnob', () => new THREE.SphereGeometry(0.014, 8, 6)), s2 * 0.06, 0.55, D / 2 + 0.03); }
  a.add(M.timber, lt, bx(W + 0.05, 0.04, D + 0.04), 0, 0.88, 0.01);
  const U0 = 0.9, UH = 1.12, ud = 0.32, back = -D / 2 + 0.02;
  a.add(M.paint, '#3f504a', bx(W - 0.06, UH, 0.02), 0, U0 + UH / 2, back);
  for (const s2 of [-1, 1]) a.add(M.timber, wood, bx(0.035, UH, ud), s2 * (W / 2 - 0.04), U0 + UH / 2, back + ud / 2 - 0.01);
  for (const yy of [0.02, 0.38, 0.74]) a.add(M.timber, wood, bx(W - 0.1, 0.022, ud - 0.04), 0, U0 + yy, back + ud / 2 - 0.02);
  // contents: plates on edge against the back, glasses in front
  for (const [yy, n] of [[0.031, 5], [0.391, 5]] as const) for (let i = 0; i < n; i++) a.add(M.ceramic, i % 2 ? '#6f91a6' : '#efe9dc', cg('d3aPlateEdge', () => new THREE.CylinderGeometry(0.11, 0.11, 0.014, 12).rotateX(Math.PI / 2)), -0.42 + i * 0.21, U0 + yy + 0.11, back + 0.05, { rx: -0.12 });
  for (let i = 0; i < 4; i++) a.add(M.ceramic, '#d8e4e6', cg('d3aGlass', () => lathe([[0.001, 0], [0.035, 0], [0.005, 0.012], [0.005, 0.07], [0.038, 0.16], [0.001, 0.1]], 6)), -0.3 + i * 0.2, U0 + 0.751, back + 0.16);
  // the glazed front: frame, a centre meeting stile, glazing bars
  const fz = back + ud;
  for (const s2 of [-1, 1]) a.add(M.timber, lt, bx(0.05, UH, 0.025), s2 * (W / 2 - 0.045), U0 + UH / 2, fz);
  a.add(M.timber, lt, bx(0.04, UH, 0.025), 0, U0 + UH / 2, fz);
  for (const yy of [0.025, UH - 0.03]) a.add(M.timber, lt, bx(W - 0.08, 0.05, 0.025), 0, U0 + yy, fz);
  for (const s2 of [-1, 1]) { a.add(M.timber, lt, bx(0.014, UH - 0.08, 0.016), s2 * 0.28, U0 + UH / 2, fz + 0.002); for (const yy of [0.38, 0.74]) a.add(M.timber, lt, bx(W / 2 - 0.08, 0.014, 0.016), s2 * 0.29, U0 + yy, fz + 0.002); }
  a.add(M.timber, wood, bx(W + 0.02, 0.05, ud + 0.04), 0, U0 + UH + 0.025, back + ud / 2);
  a.add(M.timber, lt, bx(W + 0.12, 0.06, ud + 0.12), 0, U0 + UH + 0.08, back + ud / 2 + 0.02); // cornice
  a.add(M.timber, lt, bx(0.3, 0.1, 0.03), 0, U0 + UH + 0.16, back + ud / 2 + 0.05); // crest
  a.end();
  collide(c, x, z, yaw, W, D, 2.15, y0);
}

// ------------------------------------------------------------------------------------------------ kitchen
/**
 * Wall cupboard run (kitchen): a 0.33 m deep carcass hung on the wall, frame-and-panel doors (the base run's door
 * language), a cornice on top and a small light pelmet under it. `y` = the cupboard's underside. Registered as wall
 * art so the window / door rules hold for it.
 */
export function wallCupboards(c: Ctx, x: number, y: number, z: number, yaw: number, w: number, body = '#7f9a8a') {
  const M = artMats(), H = 0.78, D = 0.33, a = new Asm(c.b, c.chunk, x, y, z, yaw);
  a.add(M.paint, darker(body, 0.9), bx(w, H, D - 0.02), 0, H / 2, D / 2 - 0.01); // carcass: painted ends read as furniture
  const n = Math.max(1, Math.round(w / 0.55)), uw = w / n;
  for (let i = 0; i < n; i++) {
    const ux = -w / 2 + uw * (i + 0.5);
    panelDoor(a, M, M.paint, body, ux, H / 2, D + 0.002, uw - 0.01, H - 0.02, 0.055);
    a.add(M.brass, '#c9a44c', bx(0.012, 0.1, 0.02), ux + (i % 2 ? -1 : 1) * (uw / 2 - 0.06), 0.12, D + 0.016);
  }
  a.add(M.paint, body, bx(w + 0.05, 0.06, D + 0.05), 0, H + 0.03, D / 2 + 0.01); // cornice
  a.add(M.paint, body, bx(w, 0.035, 0.02), 0, 0, D - 0.01); // pelmet lip
  registerArt(artFootprint(`cupboard@${x.toFixed(2)},${z.toFixed(2)}`, x, y + H / 2, z, yaw, w + 0.05, H + 0.06));
}

/**
 * Tiled splashback on a wall run: a cream glazed field from the worktop up to `y1`, grout courses every 15 cm, and a
 * blue border course on top. Flat on the wall (6 mm), so it never collides with anything standing in front of it.
 */
export function splashback(c: Ctx, x: number, y0: number, z: number, yaw: number, w: number, h: number, joint = 0.15) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw);
  a.add(M.ceramic, '#ece4d2', bx(w, h - 0.06, 0.006), 0, (h - 0.06) / 2, 0.003);
  for (let yy = joint; yy < h - 0.08; yy += joint) a.add(M.ceramic, '#cfc4ae', bx(w, 0.006, 0.008), 0, yy, 0.004);
  const nv = Math.max(2, Math.round(w / (2 * joint)));
  for (let i = 1; i < nv; i++) a.add(M.ceramic, '#d8cdb6', bx(0.005, h - 0.06, 0.008), -w / 2 + (i * w) / nv, (h - 0.06) / 2, 0.004);
  a.add(M.ceramic, '#5f86a0', bx(w, 0.06, 0.01), 0, h - 0.03, 0.005);
}

/** Enamel pendant lamp (static: the kitchen's lamp stays the gameplay light): ceiling rose, cord, cone shade with a
 * cream inside, a bulb. `yTop` = ceiling, `drop` = shade rim height above the floor `y0`. */
export function enamelPendant(c: Ctx, x: number, y0: number, z: number, yTop: number, rim: number, col = '#2f4a3e') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, 0), sh = 0.2;
  a.add(M.ceramic, '#e6dcc4', cg('d3aRose', () => lathe([[0.001, 0], [0.05, 0], [0.06, 0.03], [0.001, 0.035]], 12)), 0, yTop - y0 - 0.035, 0);
  const cord = yTop - y0 - 0.035 - (rim + sh);
  a.add(M.paint, '#1d1b19', cg(`d3aCord${cord.toFixed(3)}`, () => new THREE.CylinderGeometry(0.004, 0.004, cord, 5)), 0, rim + sh + cord / 2, 0);
  a.add(M.ceramic, col, cg('d3aShade', () => lathe([[0.17, 0], [0.172, 0.006], [0.07, 0.16], [0.03, 0.19], [0.022, 0.2], [0.001, 0.2]], 12)), 0, rim, 0);
  a.add(M.ceramic, '#f2ead6', cg('d3aShadeIn', () => lathe([[0.001, 0.19], [0.026, 0.188], [0.066, 0.155], [0.164, 0.004]], 12)), 0, rim, 0);
  a.add(M.paint, '#fff1c8', cg('d3aBulb', () => new THREE.SphereGeometry(0.035, 6, 4)), 0, rim + 0.09, 0);
}

/**
 * Peg rail with kitchen things (west wall between the hatch and the dresser) and a kitchen clock above it: a moulded
 * rail on the wall with turned pegs, two tea towels, a ladle and a sieve hanging, a clock face with hands.
 */
export function pegRailClock(c: Ctx, x: number, y0: number, z: number, yaw: number, w: number) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw), RY = 1.6;
  a.add(M.timber, '#7e5636', bx(w, 0.09, 0.022), 0, RY, 0.011);
  a.add(M.timber, '#6e4a2c', bx(w, 0.02, 0.035), 0, RY + 0.055, 0.0175);
  const n = 6, pg = cg('d3aPeg', () => new THREE.CylinderGeometry(0.016, 0.011, 0.08, 6).rotateX(Math.PI / 2).translate(0, 0, 0.04));
  const px = (i: number) => -w / 2 + 0.2 + (i * (w - 0.4)) / (n - 1);
  for (let i = 0; i < n; i++) a.add(M.timber, '#6e4a2c', pg, px(i), RY, 0.022);
  for (const [i, col] of [[1, '#e8dcc0'], [2, '#b8463a']] as const) {
    a.add(M.paint, col, bx(0.3, 0.42, 0.012), px(i), RY - 0.2, 0.07, { rx: -0.05 });
    for (const yy of [-0.3, -0.35]) a.add(M.paint, darker(col, 0.8), bx(0.3, 0.015, 0.013), px(i), RY + yy, 0.071, { rx: -0.05 });
  }
  a.add(M.brass, '#a8a49a', cg('d3aLadleShaft', () => new THREE.CylinderGeometry(0.006, 0.006, 0.34, 6)), px(3), RY - 0.17, 0.06);
  a.add(M.brass, '#a8a49a', cg('d3aLadleBowl', () => lathe([[0.001, 0], [0.04, 0.005], [0.05, 0.03], [0.048, 0.035], [0.001, 0.012]], 10)), px(3), RY - 0.36, 0.06);
  a.add(M.brass, '#a8a49a', cg('d3aSieve', () => new THREE.TorusGeometry(0.09, 0.008, 4, 12)), px(4), RY - 0.12, 0.03);
  a.add(M.paint, '#9a948a', discGeo(0.088, 0.004, 16), px(4), RY - 0.12, 0.03);
  // clock: a turned case, a cream face, two hands, centred over the rail
  a.add(M.timber, '#5a3a22', discGeo(0.17, 0.05, 24), 0, RY + 0.62, 0.025);
  a.add(M.paint, '#f2ead6', discGeo(0.145, 0.006, 24), 0, RY + 0.62, 0.052);
  for (let i = 0; i < 12; i += 3) { const t = (i * Math.PI) / 6; a.add(M.paint, '#2a2622', bx(0.008, i % 3 ? 0.014 : 0.026, 0.004), Math.sin(t) * 0.12, RY + 0.62 + Math.cos(t) * 0.12, 0.057, { rz: -t }); }
  a.add(M.paint, '#2a2622', bx(0.008, 0.08, 0.004), 0.02, RY + 0.62 + 0.03, 0.06, { rz: -0.6 });
  a.add(M.paint, '#2a2622', bx(0.006, 0.115, 0.004), -0.05, RY + 0.62 + 0.01, 0.062, { rz: 1.9 });
  registerArt(artFootprint(`pegrail@${x.toFixed(2)},${z.toFixed(2)}`, x, y0 + RY + 0.2, z, yaw, w, 1.2));
}
