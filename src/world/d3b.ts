// DEV-04D D3-b1: study and botanic room furniture (docs/dev04d/DEV04D_D3B1_REPORT.md). Room furniture with no FLW
// stable id: a plan chest as the study's centrepiece, a potting bench for the botanic room's work end and a plant-stand
// group for its display end. Construction first (every top is carried by a frame you can read), the existing art kit
// materials only, visual only (no interactable). Origins at the floor centre, facing plan heading `yaw` (Asm: +lz forward).
import * as THREE from 'three';
import { GARDEN_DETAIL, gardenPot, gardenSoil, gardenSoilMaterial, SOIL_TINT, gardenHouseplant } from './gardenkit';
import { woodMats } from './woodkit';
import type { Ctx } from './arch';
import { Asm, artMats, lathe } from './artkit';
import { joinery } from './furniture';
import { panelDoor } from './d3a';

const { sb, bx, cg, darker } = joinery;
const collide = (c: Ctx, x: number, z: number, yaw: number, w: number, d: number, h: number, y0 = 0) => {
  const swap = Math.abs(Math.sin(yaw)) > 0.7;
  c.col.addBoxC(x, z, swap ? d : w, swap ? w : d, y0, y0 + h);
};
const potGeo = (r: number, h: number) => GARDEN_DETAIL ? cg(`gardenPot${r},${h}`,()=>gardenPot(r,h)) : cg(`d3bPot${r},${h}`, () => lathe([[0.001, 0], [r * 0.7, 0], [r * 0.95, h * 0.8], [r * 1.08, h * 0.86], [r * 1.08, h], [r * 0.98, h], [r * 0.9, h * 0.88], [0.001, h * 0.85]], 10));
const leafBall = (r: number) => cg(`d3bLeaf${r}`, () => new THREE.IcosahedronGeometry(r, 1));

/**
 * Plan chest (study centrepiece): a recessed plinth carries the carcass; one face holds a bank of four wide, shallow
 * map drawers (brass cup pulls and label frames), the other face and the ends are frame-and-panel; a moulded top
 * overhangs 3 cm all round and carries what the chest is for: two maps spread under brass weights, a rolled map and a
 * reading glass. Long side along local z (w across, l long), top at 0.86. Drawers face local +x.
 */
export function planChest(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 0.95, l = 1.7, wood = '#5a3a22') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('planChest');
  const dk = darker(wood, 0.72), lt = darker(wood, 1.14), H = 0.86, PL = 0.09, TOP = 0.045, CH = H - TOP - PL;
  a.add(M.timber, dk, bx(w - 0.08, PL, l - 0.08), 0, PL / 2, 0); // recessed plinth (toe-kick shadow)
  a.add(M.timber, wood, bx(w, CH, l), 0, PL + CH / 2, 0); // carcass
  // drawer bank on the +x face: four shallow map drawers between a top and a bottom rail
  const dh = (CH - 0.06) / 4;
  for (let i = 0; i < 4; i++) {
    const yy = PL + 0.03 + dh * (i + 0.5);
    a.add(M.timber, lt, bx(0.02, dh - 0.014, l - 0.08), w / 2 + 0.008, yy, 0); // drawer front, a shadow gap round it
    for (const s of [-1, 1]) a.add(M.brass, '#b8913e', cg('d3bCupPull', () => new THREE.CylinderGeometry(0.035, 0.035, 0.018, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2)), w / 2 + 0.024, yy - 0.006, s * 0.42);
    a.add(M.brass, '#c9a44c', bx(0.006, 0.035, 0.07), w / 2 + 0.02, yy + 0.018, 0); // label frame
  }
  // the other face and the ends: frame and panel (the house's D3-a door language)
  for (const s of [-1, 1]) panelDoor(a, M, M.timber, wood, 0, PL + CH / 2, s * (l / 2 + 0.011), w - 0.08, CH - 0.06, 0.06, s > 0 ? 1 : -1);
  // back face (−x): two framed panels, stiles / rails proud of a recessed field
  for (const s of [-1, 1]) {
    const pz = s * l / 4, pw = l / 2 - 0.08, ph = CH - 0.08, yc = PL + CH / 2;
    a.add(M.timber, darker(wood, 0.86), bx(0.01, ph - 0.02, pw - 0.02), -w / 2 - 0.005, yc, pz);
    for (const sy of [-1, 1]) a.add(M.timber, wood, bx(0.02, 0.06, pw), -w / 2 - 0.01, yc + sy * (ph / 2 - 0.03), pz);
    for (const sz of [-1, 1]) a.add(M.timber, wood, bx(0.02, ph - 0.12, 0.06), -w / 2 - 0.01, yc, pz + sz * (pw / 2 - 0.03));
  }
  a.add(M.timber, lt, sb(w + 0.06, TOP, l + 0.06, 0.012), 0, H - TOP / 2, 0); // top, 3 cm overhang
  a.add(M.timber, dk, bx(w + 0.03, 0.025, l + 0.03), 0, H - TOP - 0.0125, 0); // moulding under the top edge
  // on the top: two maps spread flat, held by brass weights; a rolled map; a reading glass
  a.add(M.paint, '#e8dcbc', bx(0.62, 0.003, 0.8), -0.05, H + 0.0015, -0.2, { ry: 0.06 });
  a.add(M.paint, '#dccfa8', bx(0.5, 0.003, 0.66), 0.08, H + 0.004, 0.32, { ry: -0.12 });
  for (const [px, pz] of [[-0.33, -0.56], [0.24, -0.58], [0.3, 0.6], [-0.15, 0.62]] as const) a.add(M.brass, '#b8913e', cg('d3bWeight', () => lathe([[0.001, 0], [0.025, 0], [0.025, 0.02], [0.012, 0.03], [0.008, 0.045], [0.001, 0.05]], 8)), px, H + 0.006, pz);
  a.add(M.paint, '#e2d4b0', cg('d3bRoll', () => new THREE.CylinderGeometry(0.035, 0.035, 0.62, 10).rotateZ(Math.PI / 2)), -0.1, H + 0.035, 0.73, { ry: 0.1 });
  a.add(M.brass, '#c9a44c', cg('d3bLensRing', () => new THREE.TorusGeometry(0.055, 0.008, 4, 14).rotateX(Math.PI / 2)), 0.2, H + 0.012, -0.05);
  a.add(M.timber, dk, bx(0.02, 0.02, 0.13), 0.2, H + 0.012, 0.055);
  a.end();
  collide(c, x, z, yaw, w + 0.06, l + 0.06, H, y0);
}

/**
 * Potting bench (botanic work end): four 7 cm legs, front and side rails tenoned in under a top of three planks with
 * gaps, a slatted pot board on low stretchers, and a back board with a shelf rail on the back legs' extensions. On it:
 * pots, a seed tray, a trowel, plant labels and a plant press (two boards, a strap, paper between). l along local x.
 */
export function pottingBench(c: Ctx, x: number, z: number, y0: number, yaw: number, l = 1.7, d = 0.6, wood = '#8a6440') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('pottingBench');
  const dk = darker(wood, 0.78), worn = darker(wood, 1.15), H = 0.9, LG = 0.07, lx = l / 2 - LG / 2 - 0.03, lz = d / 2 - LG / 2 - 0.03;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, dk, bx(LG, sz < 0 ? 1.2 : H - 0.05, LG), sx * lx, (sz < 0 ? 1.2 : H - 0.05) / 2, sz * lz); // back legs run up to carry the shelf
  for (const sz of [-1, 1]) a.add(M.timber, dk, bx(2 * lx, 0.09, 0.03), 0, H - 0.05 - 0.045, sz * (lz + LG / 2 - 0.015)); // front / back rails
  for (const sx of [-1, 1]) a.add(M.timber, dk, bx(0.03, 0.09, 2 * lz), sx * (lx + LG / 2 - 0.015), H - 0.05 - 0.045, 0); // side rails
  for (let i = 0; i < 3; i++) a.add(M.timber, i === 1 ? worn : wood, bx(l, 0.04, d / 3 - 0.012), 0, H - 0.02, -d / 2 + d / 6 + (i * d) / 3); // top planks
  for (const sx of [-1, 1]) a.add(M.timber, dk, bx(0.04, 0.05, 2 * lz), sx * lx, 0.2, 0); // pot-board stretchers
  for (let i = 0; i < 5; i++) a.add(M.timber, wood, bx(2 * lx - 0.02, 0.025, 0.08), 0, 0.235, -lz + 0.04 + (i * (2 * lz - 0.08)) / 4); // slatted pot board
  a.add(M.timber, wood, bx(l - 0.06, 0.24, 0.02), 0, H + 0.12, -d / 2 + 0.04); // back board (stops soil off the wall)
  a.add(M.timber, wood, bx(l - 0.02, 0.025, 0.16), 0, 1.2 - 0.0125, -d / 2 + 0.1); // shelf on the leg tops
  // use: pots (some planted), a seed tray, a trowel, labels, a plant press, a sack on the pot board
  const terr = '#b8653e';
  for (const [px, pr, ph] of [[-0.55, 0.075, 0.13], [-0.36, 0.06, 0.1], [0.4, 0.09, 0.15]] as const) {
    a.add(M.paint, terr, potGeo(pr, ph), px, H, -0.08);
    if(GARDEN_DETAIL){
      a.add(gardenSoilMaterial(),SOIL_TINT,gardenSoil(pr*.89),px,H+ph*.82,-.08);
      a.add(woodMats().flat,'#ffffff',cg('gardenBenchPlant',()=>gardenHouseplant(0)),px,H+ph*.82,-.08,{s:[pr*2,pr*2,pr*2]});
    }else a.add(M.paint, '#4f7a34', leafBall(pr * 1.1), px, H + ph + pr * 0.5, -0.08, { s: [1, 0.8, 1] });
  }
  for (let i = 0; i < 5; i++){a.add(M.paint, darker(terr, 0.9 + (i % 2) * 0.15), potGeo(0.05, 0.08), -0.62 + i * 0.13, 1.2, -d / 2 + 0.1);if(GARDEN_DETAIL)a.add(gardenSoilMaterial(),SOIL_TINT,gardenSoil(.0445),-.62+i*.13,1.2+.08*.82,-d/2+.1);} // a row of small pots on the shelf
  a.add(M.timber, worn, bx(0.36, 0.05, 0.24), -0.05, H + 0.025, 0.12); // seed tray
  a.add(GARDEN_DETAIL?gardenSoilMaterial():M.paint, GARDEN_DETAIL?SOIL_TINT:'#3e2e22', bx(0.32, 0.012, 0.2), -0.05, H + 0.047, 0.12);
  for (let i = 0; i < 4; i++) a.add(M.paint, '#f2ead8', bx(0.012, 0.07, 0.003), -0.17 + i * 0.075, H + 0.08, 0.06 + (i % 2) * 0.1, { rz: (i - 1.5) * 0.08 });
  a.add(M.brass, '#8a8a84', bx(0.07, 0.008, 0.13), 0.12, H + 0.004, 0.2, { ry: 0.5 }); // trowel blade
  a.add(M.timber, dk, cg('d3bHandle', () => new THREE.CylinderGeometry(0.014, 0.016, 0.11, 6).rotateX(Math.PI / 2)), 0.08, H + 0.016, 0.27, { ry: 0.5 });
  for (const yy of [0, 0.075]) a.add(M.timber, '#6e4a2c', bx(0.34, 0.018, 0.26), 0.62, H + 0.009 + yy, 0.06); // plant press boards
  a.add(M.paint, '#ece2c8', bx(0.32, 0.057, 0.24), 0.62, H + 0.018 + 0.028, 0.06); // paper between them
  for (const s of [-1, 1]) a.add(M.paint, '#4a3a2a', bx(0.025, 0.105, 0.27), 0.62 + s * 0.09, H + 0.051, 0.06); // straps
  a.add(M.paint, '#c4a678', cg('d3bSack', () => new THREE.SphereGeometry(0.17, 8, 6)), -0.35, 0.25, 0.02, { s: [1.3, 0.75, 0.85] }); // a sack of potting soil
  a.end();
  collide(c, x, z, yaw, l, d, 1.2, y0);
}

/** A turned plant stand (round top, three splayed legs into a ring stretcher), its top at `h`. */
export function plantStand(c: Ctx, x: number, z: number, y0: number, h: number, r = 0.17, wood = '#5a3a22') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, (x * 3.7 + z) % 6.28).begin('plantStand');
  a.add(M.timber, wood, cg(`d3bStandTop${r}`, () => lathe([[0.001, 0], [r, 0], [r, 0.03], [r * 0.85, 0.04], [0.001, 0.04]], 12)), 0, h - 0.04, 0);
  for (let i = 0; i < 3; i++) {
    const an = (i / 3) * Math.PI * 2, fr = r * 0.62, fl = r * 1.15;
    const dxl = Math.cos(an), dzl = Math.sin(an), len = Math.hypot(h - 0.04, fl - fr), tilt = Math.atan2(fl - fr, h - 0.04);
    a.add(M.timber, darker(wood, 0.85), bx(0.03, len, 0.03), dxl * (fr + fl) / 2, (h - 0.04) / 2, dzl * (fr + fl) / 2, { rx: dzl * tilt, rz: -dxl * tilt });
  }
  a.add(M.timber, darker(wood, 0.85), cg(`d3bStandRing${r}`, () => new THREE.TorusGeometry(r * 0.98, 0.012, 4, 12).rotateX(Math.PI / 2)), 0, h * 0.32, 0);
  a.end();
}

/**
 * Stepped plant étagère against a wall (botanic display end): two ladder sides carry three staggered shelves, each
 * set back from the one below, so the pots read as a rising group. Width along local x.
 */
export function plantEtagere(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 0.95, wood = '#6e4a2c') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('plantEtagere');
  const dk = darker(wood, 0.82), steps = [[0.36, 0.17], [0.72, 0.0], [1.08, -0.15]] as const; // [height, lz of the shelf centre]
  for (const s of [-1, 1]) {
    a.add(M.timber, dk, bx(0.035, 1.1, 0.035), s * (w / 2 - 0.02), 0.55, -0.2); // back upright
    a.add(M.timber, dk, bx(0.035, 0.38, 0.035), s * (w / 2 - 0.02), 0.19, 0.25); // front upright
    a.add(M.timber, dk, cg('d3bEtStay', () => new THREE.BoxGeometry(0.03, 0.82, 0.03)), s * (w / 2 - 0.02), 0.63, 0.04, { rx: -0.6 }); // raking stay
  }
  for (const [hy, lz] of steps) a.add(M.timber, wood, sb(w, 0.025, 0.2, 0.004), 0, hy, lz);
  a.end();
  collide(c, x, z, yaw, w, 0.5, 1.1, y0);
  return steps.map(([hy, lz]) => ({ y: hy + 0.0125, lz }));
}

/** A potted plant group on a surface: a pot and a leafy head of a given size and tone (visual only). */
export function pottedPlant(c: Ctx, x: number, z: number, y0: number, r: number, leaf = '#4f7a34', pot = '#b8653e', tall = 1) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, (x * 5.1 + z * 2.3) % 6.28);
  const ph = r * 1.6;
  if(GARDEN_DETAIL){
    a.add(M.ceramic,pot,potGeo(r,ph),0,0,0);
    a.add(gardenSoilMaterial(),SOIL_TINT,gardenSoil(r*.89),0,ph*.82,0);
    const v=Math.floor(Math.abs(Math.sin(x*5.1+z))*3);
    a.add(woodMats().flat,'#ffffff',cg(`gardenSmallPlant${v}`,()=>gardenHouseplant(v)),0,ph*.82,0,{s:[r*2.8,r*2.8*tall,r*2.8]});return;
  }
  a.add(M.paint, pot, potGeo(r, ph), 0, 0, 0);
  a.add(M.paint, leaf, leafBall(r * 1.35), 0, ph + r * 1.1 * tall, 0, { s: [1, tall, 1] });
  a.add(M.paint, darker(leaf, 0.8), leafBall(r * 0.9), r * 0.6, ph + r * 0.7 * tall, r * 0.3, { s: [1, tall, 1] });
}
