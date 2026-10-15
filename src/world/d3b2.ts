// DEV-04D D3-b2: the upstairs identity rooms (docs/dev04d/DEV04D_D3B2_REPORT.md). Room furniture and use traces with no
// FLW stable id, for the Reiskamer (travel), the Sterrenkamer (rest and observation), the north guest room (`storage`)
// and the bathroom. Construction first: every piece stands on, hangs from or leans against something you can read.
// The existing art kit materials only; visual only (nothing here is interactable). Origins at the floor (or support)
// centre, facing plan heading `yaw` (Asm: +lz forward, +lx to the right of it).
//
// Rule for luggage: no second hard-shell suitcase anywhere on this floor. The koffer is the Reiskamer's emblem and its
// memory (`mem.reis.suitcase`); every other bag is a soft holdall or rucksack, so nothing reads as a second candidate.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { Asm, artMats, lathe, softBox, deform, projectUV, cushion } from './artkit';
import { joinery } from './furniture';
import { addBook, drapeGeo, PAPER } from './propkit';

const { sb, bx, cg, darker } = joinery;
const collide = (c: Ctx, x: number, z: number, yaw: number, w: number, d: number, h: number, y0 = 0) => {
  const swap = Math.abs(Math.sin(yaw)) > 0.7;
  c.col.addBoxC(x, z, swap ? d : w, swap ? w : d, y0, y0 + h);
};

// ================================================================================================ Reiskamer
/**
 * Coat stand by the door: three flat feet halved into a turned boss carry the pole; four pegs rake up at 1.62 m.
 * A travel coat hangs from the front peg by its collar, a scarf over the left peg, a felt hat on the finial: the
 * guest's outdoor things, the first travel read from the door. Collider: a 0.28 m circle.
 */
export function coatStand(c: Ctx, x: number, z: number, y0: number, yaw: number, coat = '#3f4a5a', scarf = '#b0503a', hat = '#4a3a2e', wood = '#5a3a22') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('coatStand'), dk = darker(wood, 0.8);
  for (let i = 0; i < 3; i++) a.add(M.timber, dk, bx(0.045, 0.04, 0.3), Math.sin((i * 2 * Math.PI) / 3 + 0.5) * 0.17, 0.02, Math.cos((i * 2 * Math.PI) / 3 + 0.5) * 0.17, { ry: (i * 2 * Math.PI) / 3 + 0.5 });
  a.add(M.timber, wood, cg('d3b2StandBoss', () => lathe([[0.001, 0], [0.06, 0], [0.06, 0.05], [0.04, 0.09], [0.032, 0.2], [0.001, 0.2]], 10)), 0, 0, 0);
  a.add(M.timber, wood, cg('d3b2StandPole', () => new THREE.CylinderGeometry(0.021, 0.026, 1.6, 8).translate(0, 0.8, 0)), 0, 0.18, 0);
  a.add(M.timber, dk, cg('d3b2StandFinial', () => lathe([[0.001, 0], [0.03, 0], [0.034, 0.03], [0.022, 0.06], [0.03, 0.085], [0.001, 0.11]], 8)), 0, 1.78, 0);
  const pegY = 1.62, pegL = 0.14, rake = 0.6; // pegs rise 34° from the pole
  const peg = cg('d3b2Peg', () => new THREE.CylinderGeometry(0.009, 0.011, pegL, 6).rotateX(Math.PI / 2 - rake).translate(0, Math.sin(rake) * pegL / 2, Math.cos(rake) * pegL / 2));
  for (let i = 0; i < 4; i++) a.add(M.timber, dk, peg, 0, pegY, 0, { ry: (i * Math.PI) / 2 });
  const tipY = pegY + Math.sin(rake) * pegL, tip = Math.cos(rake) * pegL;
  // the coat, hung by its collar on the front peg: shoulders narrow into the hanging loop, the hem flares a little
  a.add(M.upholstery, coat, cg('d3b2Coat', () => projectUV(deform(softBox(0.46, 0.98, 0.15, 0.045, 1, 3), (p) => {
    const k = Math.min(1, Math.max(0, (p.y - 0.18) / 0.31));
    p.x *= 1 - 0.55 * k * k; p.z *= 1 - 0.45 * k;
    if (p.y < -0.3) p.x *= 1 + 0.08 * ((-0.3 - p.y) / 0.19);
  }), 0.25)), 0, tipY - 0.49 + 0.01, tip - 0.005);
  a.add(M.upholstery, darker(coat, 0.8), sb(0.2, 0.08, 0.04, 0.012), 0, tipY - 0.07, tip + 0.06, { rx: -0.3 }); // turned-up collar
  const cy = tipY - 0.49 + 0.01, front = tip - 0.005 + 0.075; // the coat's centre height and its front face
  for (const s of [-1, 1]) a.add(M.upholstery, darker(coat, 0.92), cg('d3b2CoatSleeve', () => new THREE.CylinderGeometry(0.042, 0.055, 0.6, 7).translate(0, -0.3, 0)), s * 0.165, tipY - 0.12, tip + 0.01, { rz: s * 0.07 }); // sleeves hang from the shoulders
  a.add(M.upholstery, darker(coat, 0.75), bx(0.014, 0.82, 0.006), 0.02, cy - 0.05, front + 0.002); // front edge / placket
  for (let i = 0; i < 3; i++) a.add(M.paint, '#1e1c1a', bx(0.022, 0.022, 0.008), 0.055, cy + 0.2 - i * 0.2, front + 0.003); // buttons
  // the scarf over the left peg: two tails hanging either side of it, one longer
  // the scarf over the right peg (seen beside the coat from the room): two tails hanging either side of it, one longer
  for (const [dz, len] of [[-0.03, 0.62], [0.03, 0.48]] as const) a.add(M.upholstery, scarf, sb(0.12, len, 0.014, 0.005), tip, tipY - len / 2 + 0.01, dz, { rz: -0.03 });
  a.add(M.upholstery, scarf, cg('d3b2ScarfFold', () => new THREE.CylinderGeometry(0.032, 0.032, 0.12, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(-Math.PI / 2)), tip, tipY + 0.0, 0, { ry: Math.PI / 2 });
  // a felt hat on the finial: brim and a creased crown
  a.add(M.upholstery, hat, cg('d3b2HatBrim', () => new THREE.CylinderGeometry(0.15, 0.155, 0.012, 14)), 0, 1.86, 0, { rz: 0.06 });
  a.add(M.upholstery, hat, cg('d3b2HatCrown', () => lathe([[0.001, 0], [0.085, 0], [0.083, 0.08], [0.06, 0.105], [0.001, 0.095]], 12)), 0, 1.866, 0.004, { rz: 0.06 });
  a.add(M.upholstery, '#2a2220', cg('d3b2HatBand', () => new THREE.CylinderGeometry(0.0865, 0.0865, 0.022, 14, 1, true)), 0, 1.879, 0.004, { rz: 0.06 });
  a.end();
  c.col.addCircle(x, z, 0.28, y0, y0 + 1.9);
}

/**
 * Soft travel holdall standing on the floor: a canvas body that slumps a little at the top, two leather bands round it,
 * two carry handles meeting over the zip, a shoulder strap fallen across one end. Length along local x.
 */
export function holdall(c: Ctx, x: number, z: number, y0: number, yaw: number, body = '#8a7a5a', leather = '#5a3a22', l = 0.56) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('holdall'), H = 0.29, D = 0.3;
  a.add(M.upholstery, body, cg(`d3b2Holdall${l}`, () => projectUV(deform(softBox(l, H, D, 0.1, 1, 3), (p) => {
    if (p.y > 0) p.y -= 0.03 * (1 - (2 * p.x / l) ** 2); // the top sags between the handles
    if (p.y < -H / 2 + 0.03) p.z *= 1.04; // a flat, slightly spread bottom
  }), 0.25)), 0, H / 2, 0);
  for (const s of [-1, 1]) a.add(M.upholstery, leather, cg(`d3b2HoldallBand${l}`, () => softBox(0.05, H + 0.008, D + 0.008, 0.1, 1, 1)), s * l * 0.3, H / 2, 0);
  for (const s of [-1, 1]) a.add(M.upholstery, leather, cg('d3b2HoldallHandle', () => new THREE.TorusGeometry(0.085, 0.011, 4, 10, Math.PI)), 0, H - 0.035, s * 0.045, { rx: s * 0.25 });
  a.add(M.paint, '#3a2a1e', bx(l * 0.72, 0.006, 0.014), 0, H - 0.028, 0); // zip
  a.add(M.upholstery, leather, cg(`d3b2HoldallStrap${l}`, () => new THREE.TorusGeometry(0.17, 0.008, 3, 12, Math.PI * 0.9).rotateY(Math.PI / 2)), l / 2 - 0.02, 0.1, 0, { rz: -0.15 }); // the shoulder strap, fallen over one end
  a.end({ gap: 0.02 });
  collide(c, x, z, yaw, l, D, H, y0);
}

/**
 * Rucksack leaning back against a wall (local −z): a soft canvas body that bellies forward under its load and narrows to
 * a drawstring top under a flap; a full front pocket, two compression straps, a grab loop; the shoulder straps against
 * the wall. D3-b2R: rebuilt from the boxy first pass (a soft box with a cushion on top read as a crate). The whole bag
 * tips about its bottom back edge, so it rests on that edge and the wall.
 */
export function rucksack(c: Ctx, x: number, z: number, y0: number, yaw: number, body = '#4f6a5a', trim = '#3a2a1e') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('rucksack'), H = 0.48, D = 0.2, t = 0.15;
  const zp = -D / 2, lean = (y: number, zz: number): [number, number] => { const dz = zz - zp; return [y * Math.cos(t) + dz * Math.sin(t), zp + dz * Math.cos(t) - y * Math.sin(t)]; };
  const put = (mat: THREE.Material, col: THREE.ColorRepresentation, g: THREE.BufferGeometry, lx: number, y: number, zz: number, o: { rx?: number; rz?: number } = {}) => { const [yy, z2] = lean(y, zz); a.add(mat, col, g, lx, yy, z2, { rx: t + (o.rx ?? 0), rz: o.rz }); };
  // the body: a soft box deformed into a loaded sack (bulging front and sides low, a narrower gathered top, a flat back)
  put(M.upholstery, body, cg('d3b2RuckBody', () => projectUV(deform(softBox(0.32, H, D, 0.07, 2, 3), (p) => {
    const v = (p.y + H / 2) / H; // 0 bottom … 1 top
    const belly = Math.sin(Math.PI * Math.min(1, v * 1.15)) ** 0.8;
    p.x *= 1 + 0.12 * belly - 0.28 * Math.max(0, v - 0.75) / 0.25;
    if (p.z > 0) p.z += 0.045 * belly * (1 - (2 * p.x / 0.36) ** 2);
    p.z *= 1 - 0.3 * Math.max(0, v - 0.8) / 0.2;
  }), 0.25)), 0, H / 2, 0);
  put(M.upholstery, darker(body, 0.82), cg('d3b2RuckFlap', () => projectUV(deform(cushion(0.27, 0.05, 0.2, 0.024, 0.016, 'top', 1, 2), (p) => { if (p.z > 0.04) p.y -= 0.06 * ((p.z - 0.04) / 0.06); }), 0.25)), 0, H + 0.005, 0.015, { rx: -0.12 }); // the lid flap, its front edge falling over the body
  put(M.upholstery, darker(body, 0.9), cg('d3b2RuckPocket', () => projectUV(cushion(0.22, 0.17, 0.07, 0.03, 0.018, 'front', 1, 2), 0.25)), 0, 0.15, D / 2 + 0.05, { rx: Math.PI });
  for (const s of [-1, 1]) put(M.upholstery, trim, bx(0.03, 0.24, 0.012), s * 0.07, H - 0.13, D / 2 + 0.035, { rx: -0.18 }); // flap straps down onto the belly
  for (const s of [-1, 1]) put(M.paint, '#8a8478', bx(0.034, 0.02, 0.016), s * 0.07, H - 0.24, D / 2 + 0.05); // their buckles
  for (const s of [-1, 1]) put(M.upholstery, trim, bx(0.045, H - 0.06, 0.012), s * 0.085, H / 2, -D / 2 - 0.004); // shoulder straps (against the wall)
  put(M.upholstery, trim, cg('d3b2RuckLoop', () => new THREE.TorusGeometry(0.03, 0.007, 3, 8, Math.PI)), 0, H + 0.035, -0.05);
  a.end({ gap: 0.02 });
  collide(c, x, z, yaw, 0.34, 0.3, H, y0);
}

/**
 * Planning desk (Reiskamer, D3-b2R; replaces the slim writing desk under the middle window). A heavier silhouette for the
 * room's planning zone: a pedestal of three drawers (plinth, carcass, drawer fronts with cup pulls) carries the west end,
 * two square tapered legs the east end, an apron with a drawer between them, and a low gallery rail stands along the
 * back edge. The top datum is 0.76 (the sloop and the map stand on it). Width along local x, the user side at local +z.
 */
export function planningDesk(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.4, d = 0.62, wood = '#7a4f2c') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('planningDesk'), dk = darker(wood, 0.78), lt = darker(wood, 1.12), H = 0.76, T = 0.04;
  const pw = 0.42, px = -w / 2 + 0.03 + pw / 2; // the pedestal, under the west end
  a.add(M.timber, dk, bx(pw - 0.04, 0.06, d - 0.1), px, 0.03, -0.01); // plinth
  a.add(M.timber, wood, sb(pw, H - T - 0.06, d - 0.06, 0.008), px, 0.06 + (H - T - 0.06) / 2, 0);
  for (let i = 0; i < 3; i++) {
    const hy = 0.12 + i * 0.19;
    a.add(M.timber, lt, sb(pw - 0.06, 0.16, 0.02, 0.005), px, hy + 0.08, d / 2 - 0.045); // drawer front, inside the top's edge
    a.add(M.brass, '#b8913e', cg('d3bCupPull', () => new THREE.CylinderGeometry(0.035, 0.035, 0.018, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2)), px, hy + 0.1, d / 2 - 0.026, { ry: Math.PI / 2 });
  }
  for (const sz of [-1, 1]) a.add(M.timber, dk, joinery.taperLeg(H - T, 0.05, 0.034), w / 2 - 0.06, 0, sz * (d / 2 - 0.06)); // east legs
  a.add(M.timber, wood, bx(w - pw - 0.14, 0.1, 0.022), (px + pw / 2 + w / 2 - 0.06) / 2, H - T - 0.05, d / 2 - 0.06); // front apron
  a.add(M.timber, wood, bx(w - pw - 0.14, 0.1, 0.022), (px + pw / 2 + w / 2 - 0.06) / 2, H - T - 0.05, -d / 2 + 0.06); // back apron
  a.add(M.timber, wood, bx(0.022, 0.1, d - 0.12), w / 2 - 0.06, H - T - 0.05, 0); // end apron
  a.add(M.timber, lt, sb(0.4, 0.07, 0.016, 0.004), (px + pw / 2 + w / 2 - 0.06) / 2, H - T - 0.05, d / 2 - 0.045); // the centre drawer
  a.add(M.timber, wood, sb(w, T, d, 0.01), 0, H - T / 2, 0); // top
  a.add(M.timber, dk, bx(w - 0.04, 0.05, 0.018), 0, H + 0.025, -d / 2 + 0.012); // gallery rail along the back
  for (const sx of [-1, 1]) a.add(M.timber, dk, bx(0.018, 0.05, 0.1), sx * (w / 2 - 0.03), H + 0.025, -d / 2 + 0.06); // its returns
  a.end();
  collide(c, x, z, yaw, w, d, 0.8, y0);
}

/**
 * The travel-planning set on the writing desk's west half (support: the desk top, y = 0): a folded road map opened two
 * panels wide with a route marked, the guidebook lying on it with its elastic band and a ribbon, a pencil. Replaces
 * the generic open book; the sloop keeps the east half.
 */
export function deskTravelSet(c: Ctx, x: number, y: number, z: number, yaw: number) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y, z, yaw).begin('deskTravelSet');
  const pw = 0.15, pd = 0.27;
  for (let i = 0; i < 3; i++) { // three panels, the fold lines alternately up and down (a map that has been folded)
    const tilt = (i === 1 ? -1 : 1) * 0.045;
    a.add(M.paint, i === 1 ? '#dfe3cf' : '#e6e4d0', bx(pw, 0.0025, pd), -pw + i * pw, 0.0013 + Math.abs(tilt) * pw * 0.25, 0, { rz: tilt });
  }
  // the map's printed read at arm's length: green land, a blue lake, a road and the marked route
  a.add(M.paint, '#b9cfa2', bx(0.13, 0.001, 0.12), -0.15, 0.0045, -0.05);
  a.add(M.paint, '#8fb2c4', bx(0.06, 0.001, 0.05), 0.0, 0.0045, 0.07, { ry: 0.4 });
  a.add(M.paint, '#c8a24a', bx(0.32, 0.0012, 0.006), -0.02, 0.005, -0.01, { ry: -0.25 });
  a.add(M.paint, '#b03a2e', bx(0.2, 0.0014, 0.004), 0.03, 0.0056, 0.04, { ry: 0.35 });
  addBook(a, { size: 'small', thick: 'medium', hard: false, design: 3 }, '#2f5a7a', 0.06, 0.004, -0.02, { flat: true, ry: 0.35, paper: PAPER.fresh });
  a.add(M.paint, '#1e1c1a', bx(0.006, 0.034, 0.135), 0.105, 0.02, -0.0, { ry: 0.35 }); // elastic band over the guidebook
  a.add(M.paint, '#b03a2e', bx(0.008, 0.0015, 0.05), 0.0, 0.0045, 0.1, { ry: 0.35 }); // its ribbon marker
  a.add(M.paint, '#c9a24a', cg('d3b2Pencil', () => new THREE.CylinderGeometry(0.004, 0.004, 0.16, 6).rotateZ(Math.PI / 2)), -0.12, 0.0068, 0.11, { ry: -0.5 });
  a.end();
}

/**
 * A jacket hung by its shoulders over a chair's back (cresting rail at `railY`, its centre `railZ` along the chair's
 * local z, the back raked by `rake`). D3-b2R: rebuilt from the first pass's flat slabs. The shoulders straddle the rail
 * (two rounded humps over it, the collar rolled between them), the body falls behind the back in a slight A-line with a
 * fold, the open fronts and lapels fall in front of it, one sleeve hangs straight, the other is caught on the seat corner
 * and bends forward. It reads as a garment from 2–4 m: shoulder line, two hanging sleeves, an uneven hem.
 */
export function jacketOverChair(c: Ctx, x: number, z: number, y0: number, yaw: number, railY: number, railZ: number, col = '#7a8458', rake = 0.06) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('chairJacket'), W = 0.42, top = railY + 0.045, dk = darker(col, 0.86), lt = darker(col, 1.08);
  // the back, hanging behind the chair back (local −z), a little wider at the hem, one fold down the middle
  a.add(M.upholstery, col, cg('d3b2JacketBack', () => projectUV(deform(softBox(W, 0.52, 0.024, 0.01, 1, 3), (p) => {
    const v = (0.26 - p.y) / 0.52; // 0 shoulders … 1 hem
    p.x *= 1 + 0.1 * v - 0.18 * Math.max(0, 0.2 - v) / 0.2; // sloping shoulders, a slight A-line below
    if (v < 0.12) p.y -= 0.05 * (2 * Math.abs(p.x) / W) ** 2; // the shoulder line falls to the sleeve heads
    p.z -= 0.014 * Math.cos((p.x / W) * Math.PI * 2) * v; // the fold
    p.y -= 0.06 * v * (p.x / W); // the hem drops lower on one side
  }), 0.25)), 0, top - 0.26, railZ - 0.032, { rx: rake });
  a.add(M.upholstery, dk, bx(0.012, 0.16, 0.006), 0.02, top - 0.44, railZ - 0.048, { rx: rake }); // the back vent
  // the shoulders over the rail: two humps and the rolled collar between them
  for (const sx of [-1, 1]) a.add(M.upholstery, col, cg('d3b2JacketShoulder', () => new THREE.SphereGeometry(0.05, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1.5, 0.8, 1.05)), sx * 0.13, top - 0.012, railZ, { rx: rake });
  a.add(M.upholstery, lt, cg('d3b2JacketCollar', () => new THREE.CylinderGeometry(0.03, 0.03, 0.17, 5, 1, false, -Math.PI / 2, Math.PI).rotateZ(Math.PI / 2)), 0, top - 0.01, railZ, { rx: rake });
  // the open fronts in front of the back (local +z), each with its lapel turned out, falling shorter than the back
  for (const sx of [-1, 1]) {
    a.add(M.upholstery, col, cg('d3b2JacketFront', () => projectUV(softBox(0.15, 0.4, 0.018, 0.008, 1, 1), 0.25)), sx * 0.12, top - 0.22, railZ + 0.03, { rx: rake - 0.05, rz: -sx * 0.06 });
    a.add(M.upholstery, lt, bx(0.05, 0.2, 0.008), sx * 0.065, top - 0.11, railZ + 0.042, { rx: rake - 0.05, rz: sx * 0.32 }); // lapel
  }
  // sleeves: one straight down outside the post, one caught forward over the seat corner
  a.add(M.upholstery, col, cg('d3b2SleeveA', () => new THREE.CylinderGeometry(0.045, 0.056, 0.52, 6, 1, true).translate(0, -0.26, 0)), W / 2 + 0.01, top - 0.05, railZ - 0.01, { rz: 0.14, rx: rake });
  a.add(M.upholstery, dk, cg('d3b2Cuff', () => new THREE.CylinderGeometry(0.057, 0.057, 0.04, 6, 1, true)), W / 2 + 0.01 + Math.sin(0.14) * 0.5, top - 0.05 - 0.5, railZ - 0.01 - 0.03);
  a.add(M.upholstery, col, cg('d3b2SleeveB1', () => new THREE.CylinderGeometry(0.048, 0.056, 0.27, 6, 1, true).translate(0, -0.135, 0)), -W / 2 - 0.01, top - 0.05, railZ, { rz: -0.2 });
  a.add(M.upholstery, col, cg('d3b2SleeveB2', () => new THREE.CylinderGeometry(0.044, 0.048, 0.28, 6).translate(0, -0.14, 0)), -W / 2 - 0.05, top - 0.3, railZ + 0.02, { rx: -0.65, rz: -0.08 }); // forearm, bent forward
  a.end({ ground: false, gap: 0.025 });
}

// ================================================================================================ Sterrenkamer
/**
 * Observing table (replaces the plain logbook table, same 0.6 × 0.5 footprint, top at `h`): four square tapered legs
 * tenoned into aprons, a shallow drawer on the room side, a lower shelf on stretchers holding two star atlases. On the
 * top beside the logbook (placed separately, unchanged): a red-lens torch for night reading and a mug.
 */
export function observingTable(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 0.6, d = 0.5, h = 0.7, wood = '#4a3a2a') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('observingTable'), dk = darker(wood, 0.8), lt = darker(wood, 1.15);
  const L = 0.04, lx = w / 2 - 0.05, lz = d / 2 - 0.05;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, dk, joinery.taperLeg(h - 0.03, L, 0.026), sx * lx, 0, sz * lz);
  for (const sz of [-1, 1]) a.add(M.timber, wood, bx(2 * lx, 0.09, 0.02), 0, h - 0.075, sz * lz); // long aprons
  for (const sx of [-1, 1]) a.add(M.timber, wood, bx(0.02, 0.09, 2 * lz), sx * lx, h - 0.075, 0); // end aprons
  a.add(M.timber, lt, sb(0.3, 0.06, 0.012, 0.004), 0, h - 0.075, lz + 0.012); // drawer front on the room-side apron
  a.add(M.brass, '#c9a44c', cg('knob', () => new THREE.SphereGeometry(0.018, 8, 6)), 0, h - 0.075, lz + 0.026);
  a.add(M.timber, wood, sb(w, 0.03, d, 0.008), 0, h - 0.015, 0); // top
  for (const sx of [-1, 1]) a.add(M.timber, dk, bx(0.03, 0.03, 2 * lz), sx * lx, 0.16, 0); // shelf stretchers
  a.add(M.timber, wood, bx(2 * lx - 0.03, 0.018, 2 * lz - 0.02), 0, 0.184, 0); // lower shelf
  addBook(a, { size: 'folio', thick: 'medium', hard: true, design: 2 }, '#26344a', 0.0, 0.193, 0.0, { flat: true, ry: 0.06, paper: PAPER.aged });
  addBook(a, { size: 'tall', thick: 'thin', hard: true, design: 4 }, '#5a3a28', 0.02, 0.225, 0.01, { flat: true, ry: -0.12, paper: PAPER.aged });
  // the red torch, lying on its side, lens towards the room; the mug, its handle out
  a.add(M.paint, '#2a2622', cg('d3b2TorchBody', () => new THREE.CylinderGeometry(0.017, 0.017, 0.14, 8).rotateX(Math.PI / 2)), -0.2, h + 0.017, 0.1, { ry: 0.5 });
  a.add(M.paint, '#c8322a', cg('d3b2TorchLens', () => new THREE.CylinderGeometry(0.022, 0.019, 0.03, 8).rotateX(Math.PI / 2)), -0.2 + Math.sin(0.5) * 0.085, h + 0.021, 0.1 + Math.cos(0.5) * 0.085, { ry: 0.5 });
  a.add(M.ceramic, '#e8e2d4', cg('d3b2Mug', () => lathe([[0.001, 0], [0.036, 0], [0.04, 0.09], [0.034, 0.09], [0.031, 0.012], [0.001, 0.012]], 12)), 0.21, h, -0.14);
  a.add(M.ceramic, '#e8e2d4', cg('d3b2MugHandle', () => new THREE.TorusGeometry(0.024, 0.006, 4, 8, Math.PI)), 0.255, h + 0.045, -0.14, { rz: -Math.PI / 2 });
  a.end();
  collide(c, x, z, yaw, w, d, h, y0);
}

/**
 * Daybed under the star map (Sterrenkamer, D3-b2R): somewhere to lie down between observations, in the middle of the
 * room's north wall. Four square legs and side rails carry a slatted deck; two scrolled end boards rise 0.55 m at the
 * ends; a spindled back (end posts, top rail) stands along the wall side and gives it a silhouette under the chart; a crowned mattress, a bolster at the head end, a throw folded at the foot and a star atlas left open face down.
 * Length along local x, the open side at local +z.
 */
export function daybed(c: Ctx, x: number, z: number, y0: number, yaw: number, l = 1.9, d = 0.74, wood = '#4a3a2a', cover = '#93a3b6') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('daybed'), dk = darker(wood, 0.8), RH = 0.22, top = 0.4;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, dk, joinery.taperLeg(RH + 0.05, 0.045, 0.034), sx * (l / 2 - 0.05), 0, sz * (d / 2 - 0.05));
  for (const sz of [-1, 1]) a.add(M.timber, wood, sb(l - 0.04, 0.1, 0.03, 0.006), 0, RH + 0.03, sz * (d / 2 - 0.03)); // side rails
  a.add(M.timber, dk, bx(l - 0.1, 0.03, d - 0.08), 0, RH + 0.05, 0); // the deck
  for (const sx of [-1, 1]) { // scrolled end boards: a board and a rolled top
    a.add(M.timber, wood, sb(0.04, 0.5, d, 0.008), sx * (l / 2 - 0.02), 0.3, 0);
    a.add(M.timber, wood, cg('d3b2DaybedScroll', () => new THREE.CylinderGeometry(0.045, 0.045, d + 0.02, 8).rotateX(Math.PI / 2)), sx * (l / 2 - 0.005), 0.56, 0);
  }
  // the back along the wall side (local −z): end posts rise to 0.78, a top rail on them, spindles from the side rail up
  for (const sx of [-1, 1]) a.add(M.timber, dk, bx(0.045, 0.78, 0.045), sx * (l / 2 - 0.03), 0.39, -d / 2 + 0.03);
  a.add(M.timber, wood, sb(l, 0.06, 0.05, 0.01), 0, 0.78, -d / 2 + 0.03);
  for (let i = 1; i < 8; i++) a.add(M.timber, wood, bx(0.022, 0.78 - RH - 0.08 - 0.03, 0.022), -l / 2 + (i * l) / 8, (RH + 0.08 + 0.75) / 2, -d / 2 + 0.03);
  a.add(M.upholstery, cover, cg(`d3b2DaybedMat${l}`, () => projectUV(cushion(l - 0.1, 0.13, d - 0.06, 0.04, 0.02, 'top', 1, 3), 0.25)), 0, RH + 0.065 + 0.065, 0);
  a.add(M.upholstery, darker(cover, 1.25), cg('d3b2Bolster', () => new THREE.CylinderGeometry(0.085, 0.085, d - 0.12, 8).rotateX(Math.PI / 2)), -l / 2 + 0.14, top + 0.08, 0);
  a.add(M.upholstery, '#c9a25a', cg('d3b2DaybedThrow', () => projectUV(cushion(0.42, 0.06, d - 0.1, 0.02, 0.012, 'top', 1, 2), 0.25)), l / 2 - 0.3, top + 0.03, 0, { ry: 0.05 });
  addBook(a, { size: 'folio', thick: 'medium', hard: true, design: 2 }, '#26344a', 0.12, top + 0.004, 0.08, { flat: true, ry: 0.5, paper: PAPER.aged });
  a.end();
  collide(c, x, z, yaw, l, d, 0.6, y0);
}

/** Binoculars set down on a surface (support y = 0): two barrels on a hinge bridge, eyecups and a neck strap loop. */
export function binoculars(c: Ctx, x: number, y: number, z: number, yaw: number) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y, z, yaw).begin('binoculars');
  for (const s of [-1, 1]) {
    a.add(M.paint, '#2e2a26', cg('d3b2Barrel', () => new THREE.CylinderGeometry(0.024, 0.027, 0.12, 10).rotateX(Math.PI / 2)), s * 0.033, 0.027, 0);
    a.add(M.paint, '#151412', cg('d3b2Eyecup', () => new THREE.CylinderGeometry(0.018, 0.02, 0.022, 8).rotateX(Math.PI / 2)), s * 0.033, 0.027, -0.07);
  }
  a.add(M.brass, '#8a7a5a', bx(0.04, 0.016, 0.05), 0, 0.034, -0.02); // hinge bridge
  a.add(M.upholstery, '#5a3a22', cg('d3b2Strap', () => new THREE.TorusGeometry(0.07, 0.005, 3, 12, Math.PI * 1.2).rotateX(Math.PI / 2)), 0, 0.004, 0.04);
  a.end();
}

/** A wool throw over a round stool seat (seat top at `seatY`, radius `r`): rolled over both sides, the ends hanging. */
export function stoolThrow(c: Ctx, x: number, z: number, y0: number, yaw: number, seatY: number, r: number, col = '#3b4f5d') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('stoolThrow');
  a.add(M.upholstery, col, cg(`d3b2Throw${r}`, () => drapeGeo(r * 0.72, -0.17, 0.17, 0.022, 0.24)), 0, seatY, 0.0);
  a.end({ ground: false });
}

// ================================================================================================ guest room / bathroom
/** A sweater left over the end of a blanket chest (top at `topY`): folded on the lid, one end hanging over the front. */
export function sweaterOverChest(c: Ctx, x: number, z: number, y0: number, yaw: number, topY: number, front: number, col = '#b8873a') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('chestSweater');
  a.add(M.upholstery, col, cg('d3b2SweaterTop', () => projectUV(cushion(0.34, 0.035, 0.28, 0.012, 0.01, 'top', 1, 2), 0.25)), 0, topY + 0.0175, front - 0.13);
  a.add(M.upholstery, col, cg('d3b2SweaterRoll', () => new THREE.CylinderGeometry(0.022, 0.022, 0.34, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI / 2)), 0, topY + 0.013, front + 0.005);
  a.add(M.upholstery, darker(col, 0.9), sb(0.32, 0.22, 0.02, 0.008), 0, topY - 0.1, front + 0.025, { rx: 0.05 });
  a.end({ ground: false, gap: 0.02 });
}

/**
 * The washstand shelf under the bathroom mirror (on the wall, local −z = the wall face): a timber shelf on two brass
 * brackets; a tumbler with two toothbrushes, a soap bottle and a small jar on it. y = the shelf top.
 */
export function washShelf(c: Ctx, x: number, y: number, z: number, yaw: number, w = 0.5) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y, z, yaw).begin('washShelf');
  a.add(M.timber, '#7a5a3a', sb(w, 0.022, 0.11, 0.005), 0, -0.011, 0.055);
  for (const s of [-1, 1]) a.add(M.brass, '#c9c4b8', bx(0.012, 0.075, 0.09), s * (w / 2 - 0.06), -0.06, 0.045);
  a.add(M.ceramic, '#dfe8e6', cg('d3b2Tumbler', () => lathe([[0.001, 0], [0.026, 0], [0.031, 0.1], [0.027, 0.1], [0.023, 0.006], [0.001, 0.006]], 10)), -0.13, 0, 0.06);
  for (const [dx, col, lean] of [[-0.008, '#3f7fa8', 0.18], [0.01, '#c8643a', -0.14]] as const) a.add(M.paint, col, bx(0.008, 0.17, 0.006), -0.13 + dx, 0.085, 0.06, { rz: lean });
  a.add(M.ceramic, '#f2ede0', cg('d3b2SoapBottle', () => lathe([[0.001, 0], [0.03, 0], [0.032, 0.09], [0.012, 0.11], [0.008, 0.14], [0.001, 0.14]], 10)), 0.05, 0, 0.06);
  a.add(M.paint, '#2a2622', cg('d3b2Pump', () => new THREE.CylinderGeometry(0.006, 0.006, 0.03, 5)), 0.05, 0.15, 0.06);
  a.add(M.ceramic, '#6fae9a', cg('d3b2Jar', () => lathe([[0.001, 0], [0.035, 0], [0.036, 0.05], [0.03, 0.055], [0.001, 0.06]], 10)), 0.16, 0, 0.055);
  a.end({ ground: false });
}

/** A brass towel ring on the wall (local −z = wall) with a hand towel hanging through it; y = the ring's centre. */
export function towelRing(c: Ctx, x: number, y: number, z: number, yaw: number, col = '#f2ead8') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y, z, yaw).begin('towelRing');
  a.add(M.brass, '#c9c4b8', cg('d3b2RingRose', () => new THREE.CylinderGeometry(0.022, 0.022, 0.014, 10).rotateX(Math.PI / 2)), 0, 0.07, 0.007);
  a.add(M.brass, '#c9c4b8', bx(0.01, 0.01, 0.035), 0, 0.07, 0.03);
  a.add(M.brass, '#c9c4b8', cg('d3b2Ring', () => new THREE.TorusGeometry(0.07, 0.006, 4, 16)), 0, 0, 0.048);
  a.add(M.upholstery, col, sb(0.22, 0.3, 0.016, 0.006), 0, -0.2, 0.06, { rx: -0.03 });
  a.add(M.upholstery, col, cg('d3b2TowelFold', () => new THREE.CylinderGeometry(0.014, 0.014, 0.22, 6, 1, false, 0, Math.PI).rotateZ(Math.PI / 2)), 0, -0.055, 0.052);
  a.end({ ground: false, gap: 0.02 });
}

/** A timber bath caddy bridging the tub rim (y = the rim top), with a soap bar and a scrubbing brush on it. */
export function bathCaddy(c: Ctx, x: number, y: number, z: number, yaw: number, span = 0.86) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y, z, yaw).begin('bathCaddy');
  a.add(M.timber, '#8a6440', bx(span, 0.018, 0.13), 0, 0.009, 0);
  for (const s of [-1, 1]) a.add(M.timber, '#7a5232', bx(0.02, 0.03, 0.13), s * (span / 2 - 0.01), 0.033, 0); // end lips
  for (let i = -2; i <= 2; i++) if (i) a.add(M.timber, '#7a5232', bx(0.012, 0.006, 0.12), i * 0.09, 0.021, 0); // drain slots' bars
  a.add(M.ceramic, '#efe6c8', cg('d3b2Soap', () => projectUV(softBox(0.08, 0.025, 0.05, 0.01, 1, 1), 1)), -0.12, 0.031, 0.0, { ry: 0.3 });
  a.add(M.timber, '#a8835a', bx(0.07, 0.03, 0.045), 0.15, 0.033, 0.0, { ry: -0.2 }); // brush back
  a.add(M.paint, '#d8c7a0', bx(0.066, 0.014, 0.04), 0.15, 0.011 + 0.007 + 0.003, 0.0, { ry: -0.2 }); // bristles (under the back)
  a.end({ ground: false });
}
