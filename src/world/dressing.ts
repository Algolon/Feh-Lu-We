// DEV-04B room dressing: the storage, furniture and small-prop pieces the rooms were missing or carried as plain
// boxes — built on the same joinery / upholstery / prop families (furniture.ts joinery, propkit). Every piece is a
// functional object with a support you can read (plinth, feet, brackets, a wall it hangs on) and its own collider
// where it stands on the floor. Origins at the floor (or wall) centre, facing plan heading `yaw` (local −z forward).
import * as THREE from 'three';
import type { Ctx } from './arch';
import { Asm, artMats, lathe, cushion, projectUV, softBox } from './artkit';
import { joinery } from './furniture';
import { mulberry32 } from '../core/rng';
import { addBook, addBookStack, addOpenBook, addGameBox, addCrateLoad, bottleGeoOf, GAME_BOXES, cached, type CrateLoad, type BottleKind } from './propkit';

const { sb, bx, cg, taperLeg, darker } = joinery;
const collide = (c: Ctx, x: number, z: number, yaw: number, w: number, d: number, h: number, y0 = 0) => {
  const swap = Math.abs(Math.sin(yaw)) > 0.7;
  c.col.addBoxC(x, z, swap ? d : w, swap ? w : d, y0, y0 + h);
};
const BOOKS = ['#8e372c', '#3b4e3c', '#3b4f5d', '#754728', '#aa733b', '#5e7155'];

/**
 * Low cabinet / sideboard (living/dining furniture sheet): a plinth on short feet, a carcass with a top that
 * overhangs it, a drawer row over two or three panelled doors (raised panels, brass pulls). Top at `h`.
 */
export function sideboard(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.8, d = 0.5, h = 0.9, wood = '#6b4426') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('sideboard'), dk = darker(wood, 0.78), lt = darker(wood, 1.1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, dk, taperLeg(0.1, 0.03, 0.024), sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06));
  a.add(M.timber, dk, bx(w - 0.04, 0.06, d - 0.04), 0, 0.13, 0);
  a.add(M.timber, wood, sb(w - 0.02, h - 0.2, d - 0.04, 0.006), 0, 0.16 + (h - 0.2) / 2, -0.01);
  a.add(M.timber, lt, sb(w + 0.04, 0.04, d + 0.03, 0.01), 0, h - 0.02, 0);
  const n = w > 1.5 ? 3 : 2, uw = (w - 0.08) / n, dh = h - 0.2 - 0.2;
  for (let i = 0; i < n; i++) {
    const ux = -w / 2 + 0.04 + uw * (i + 0.5);
    a.add(M.timber, lt, sb(uw - 0.02, 0.13, 0.02, 0.004), ux, h - 0.12, d / 2 - 0.02); // drawer front
    a.add(M.brass, '#c9a44c', bx(0.09, 0.014, 0.02), ux, h - 0.12, d / 2 - 0.002);
    a.add(M.timber, lt, sb(uw - 0.02, dh, 0.02, 0.004), ux, 0.18 + dh / 2, d / 2 - 0.02); // door frame
    a.add(M.timber, darker(wood, 1.18), sb(uw - 0.12, dh - 0.12, 0.016, 0.008), ux, 0.18 + dh / 2, d / 2 - 0.006); // raised panel
    a.add(M.brass, '#c9a44c', cg('pullKnob', () => new THREE.SphereGeometry(0.014, 8, 6)), ux + (i % 2 ? -1 : 1) * (uw / 2 - 0.06), 0.18 + dh * 0.6, d / 2 + 0.006);
  }
  a.end();
  collide(c, x, z, yaw, w, d, h, y0);
}

/**
 * Billiard table: six turned legs, a deep apron with panels, the slate bed in green cloth, cushion rails round it
 * capped with a timber rail, six pockets (dark cups at the corners and middles). Cloth top at y0 + 0.84 (the balls
 * and cue rest on it). Long side along local z, w × L outside the rails.
 */
export function billiardTable(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.9, L = 3.5) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('billiardTable'), wood = '#5a3a22', dk = darker(wood, 0.75), cloth = '#2f6b3f';
  const leg = cg('billiardLeg', () => projectUV(lathe([[0.001, 0], [0.07, 0], [0.075, 0.04], [0.055, 0.1], [0.06, 0.3], [0.075, 0.42], [0.06, 0.6], [0.07, 0.64], [0.001, 0.64]], 10), 1, 'y'));
  for (const sx of [-1, 1]) for (const lz of [-1, 0, 1]) a.add(M.timber, dk, leg, sx * (w / 2 - 0.16), 0, lz * (L / 2 - 0.2));
  a.add(M.timber, wood, sb(w - 0.06, 0.18, L - 0.06, 0.008), 0, 0.64 + 0.09, 0); // apron (0.64–0.82)
  for (const sx of [-1, 1]) for (const lz of [-0.5, 0.5]) a.add(M.timber, darker(wood, 1.12), sb(0.012, 0.11, L / 2 - 0.3, 0.004), sx * (w / 2 - 0.025), 0.73, lz * (L / 2));
  a.add(M.paint, cloth, bx(w - 0.24, 0.02, L - 0.24), 0, 0.83, 0); // cloth bed, top 0.84
  // cushion rails (cloth) and the timber capping rail; pocket cups in the corners and at the middle of the long sides
  for (const sx of [-1, 1]) { a.add(M.paint, darker(cloth, 0.85), bx(0.05, 0.045, L - 0.42), sx * (w / 2 - 0.145), 0.8625, 0); a.add(M.timber, wood, sb(0.1, 0.05, L, 0.01), sx * (w / 2 - 0.05), 0.865, 0); }
  for (const sz of [-1, 1]) { a.add(M.paint, darker(cloth, 0.85), bx(w - 0.42, 0.045, 0.05), 0, 0.8625, sz * (L / 2 - 0.145)); a.add(M.timber, wood, sb(w - 0.2, 0.05, 0.1, 0.01), 0, 0.865, sz * (L / 2 - 0.05)); }
  const pocket = cg('pocket', () => lathe([[0.001, 0], [0.05, 0], [0.065, 0.06], [0.07, 0.07], [0.001, 0.07]], 10));
  for (const sx of [-1, 1]) for (const lz of [-1, 0, 1]) a.add(M.paint, '#1b1a18', pocket, sx * (w / 2 - 0.12), 0.8, lz * (L / 2 - 0.12) * (lz ? 1 : 0));
  a.end();
}

/** A wall rack of four cues and a chalk ledge (hung on the wall facing `yaw`, bottom at y0). */
export function cueRack(c: Ctx, x: number, z: number, y0: number, yaw: number) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('cueRack');
  a.add(M.timber, '#4a2f1a', sb(0.6, 0.06, 0.08, 0.008), 0, 0.03, 0.04); // foot ledge
  a.add(M.timber, '#4a2f1a', sb(0.6, 0.08, 0.05, 0.008), 0, 1.25, 0.025); // top bar
  a.add(M.timber, '#4a2f1a', bx(0.6, 1.2, 0.012), 0, 0.65, 0.006); // backboard
  for (let i = 0; i < 4; i++) a.add(M.timber, '#c9a46a', cg('cue', () => lathe([[0.001, 0], [0.016, 0], [0.014, 0.6], [0.007, 1.42], [0.001, 1.42]], 6)), -0.21 + i * 0.14, 0.04, 0.05, { rx: -0.02 });
  a.end({ gap: 0.03 });
}

/** Open shelving unit (pantry, workshop, archive): four uprights, `n` boards, contents chosen per shelf. */
export type ShelfLoad = 'jars' | 'tins' | 'crates' | 'archive' | 'tools' | 'linen' | 'books' | 'empty';
export function shelvingUnit(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.6, d = 0.45, h = 2.0, loads: ShelfLoad[] = ['jars', 'tins', 'crates'], wood = '#7a5a3a', seed = 1) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('shelvingUnit'), dk = darker(wood, 0.8), r = mulberry32(seed);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, dk, bx(0.045, h, 0.045), sx * (w / 2 - 0.0225), h / 2, sz * (d / 2 - 0.0225));
  const n = loads.length, gap = (h - 0.12) / n;
  for (let i = 0; i <= n; i++) {
    const yy = 0.1 + i * gap;
    a.add(M.timber, wood, bx(w - 0.01, 0.025, d - 0.01), 0, yy, 0);
    for (const sz of [-1, 1]) a.add(M.timber, dk, bx(w - 0.09, 0.05, 0.02), 0, yy - 0.035, sz * (d / 2 - 0.0225)); // rails under the board
    if (i === n) break;
    const top = yy + 0.0125, room = gap - 0.04, load = loads[i];
    let px = -w / 2 + 0.08;
    const step = (dw: number) => { const at = px + dw / 2; px += dw + 0.02 + r() * 0.03; return at; };
    while (px < w / 2 - 0.12) {
      if (load === 'empty') break;
      if (load === 'jars') { const k: BottleKind = r() < 0.6 ? 'jar' : 'squat', lx = step(0.1); a.add(M.ceramic, ['#e6dcc4', '#c4a46a', '#9fb0a0', '#d8b878'][Math.floor(r() * 4)], bottleGeoOf(k), lx, top, (r() - 0.5) * 0.12); if (k === 'jar') a.add(M.paint, '#c4553d', cg('jarLid', () => new THREE.CylinderGeometry(0.048, 0.048, 0.02, 10).translate(0, 0.145, 0)), lx, top, 0); }
      else if (load === 'tins') { const lx = step(0.08); a.add(M.brass, ['#b8b8b0', '#c4553d', '#3f6fa8', '#e8c547'][Math.floor(r() * 4)], cg('tinS', () => new THREE.CylinderGeometry(0.036, 0.036, 0.11, 10).translate(0, 0.055, 0)), lx, top, (r() - 0.5) * 0.1); }
      else if (load === 'crates') { if (room < 0.3) break; const lx = step(0.42); crateBox(a, lx, top, 0, Math.min(d - 0.08, 0.38), (['apples', 'potatoes', 'veg', 'bread', 'oranges'] as CrateLoad[])[Math.floor(r() * 5)], Math.floor(r() * 1000)); if (r() < 0.4) px += 0.3; }
      else if (load === 'archive') { const lx = step(0.3), bd = Math.min(0.36, d - 0.04); a.add(M.paint, ['#c8b48a', '#a88f62', '#d8c8a0'][Math.floor(r() * 3)], cg(`archBox${bd.toFixed(2)}`, () => projectUV(new THREE.BoxGeometry(0.28, 0.25, bd).toNonIndexed(), 1).translate(0, 0.125, 0)), lx, top, 0); a.add(M.paint, '#f2ead8', cg(`archLabel${bd.toFixed(2)}`, () => new THREE.PlaneGeometry(0.12, 0.06).rotateY(Math.PI).translate(0, 0.17, -bd / 2 - 0.002)), lx, top, 0); }
      else if (load === 'tools') { const lx = step(0.3); crateBox(a, lx, top, 0, 0.3, 'pantry', Math.floor(r() * 1000)); }
      else if (load === 'linen') { const lx = step(0.38); for (let q = 0; q < 4 + Math.floor(r() * 3); q++) a.add(M.upholstery, ['#f2ead8', '#9aa8d8', '#6fae9a', '#e0a060', '#fbf6ea'][Math.floor(r() * 5)], cg('linenFold', () => projectUV(softBox(0.36, 0.045, 0.3, 0.012, 1, 1), 0.25)), lx + (r() - 0.5) * 0.02, top + 0.0225 + q * 0.045, 0, { ry: (r() - 0.5) * 0.06 }); }
      else if (load === 'books') { const lx = step(0.3); addBookStack(a, r, BOOKS, lx, top, 0, 2 + Math.floor(r() * 3)); }
    }
  }
  a.end({ gap: 0.02 });
  collide(c, x, z, yaw, w, d, h, y0);
}
/** A slatted timber crate with a load, as a shelf / floor prop (inside the shelving unit's Asm frame). */
function crateBox(a: Asm, lx: number, ly: number, lz: number, s: number, load: CrateLoad, seed: number) {
  const M = artMats(), wood = '#a0784a', dk = darker(wood, 0.78), h = s * 0.62;
  a.add(M.timber, dk, bx(s - 0.02, 0.02, s * 0.7 - 0.02), lx, ly + 0.01, lz);
  for (const sz of [-1, 1]) for (const yy of [0.25, 0.75]) a.add(M.timber, wood, bx(s, h * 0.4, 0.015), lx, ly + h * yy, lz + sz * (s * 0.35 - 0.0075));
  for (const sx of [-1, 1]) for (const yy of [0.25, 0.75]) a.add(M.timber, wood, bx(0.015, h * 0.4, s * 0.7), lx + sx * (s / 2 - 0.0075), ly + h * yy, lz);
  addCrateLoad(a, load, seed, lx, ly + 0.02, lz, { w: s - 0.03, d: s * 0.7 - 0.03, topY: ly + h });
}

/** Pegboard tool wall: a board on battens with outlined tool silhouettes and the tools hanging on pegs. Wall-mounted. */
export function toolWall(c: Ctx, x: number, z: number, y: number, yaw: number, w = 2.8) {
  const M = artMats(), a0 = new Asm(c.b, c.chunk, x, y, z, yaw).begin('toolWall');
  // tools are authored at 1:1 but read small at room distance: drawn 1.5× on the board (the board itself is 1:1)
  const a = { add: (m: THREE.Material, col: THREE.ColorRepresentation, g: THREE.BufferGeometry, lx: number, ly: number, lz: number, o: { rx?: number; ry?: number; rz?: number } = {}) => (lz > 0.045 ? a0.add(m, col, g, lx, ly * 1.5 - 0.1, lz, { ...o, s: [1.5, 1.5, 1.5] }) : a0.add(m, col, g, lx, ly, lz, o)), end: (o: { ground?: boolean; gap?: number }) => a0.end(o) };
  a.add(M.timber, '#5a3a22', bx(w, 1.2, 0.02), 0, 0, 0.03); // board (centre at y)
  for (const yy of [-0.55, 0.55]) a.add(M.timber, '#4a2f1a', bx(w, 0.06, 0.03), 0, yy, 0.015); // battens on the wall
  const steel = '#8a8a86', handle = '#8a5a33';
  const T: [string, number, number][] = [['hammer', -1.2, 0.2], ['saw', -0.75, 0.05], ['square', -0.25, 0.25], ['wrench', 0.05, 0.2], ['chisels', 0.4, 0.25], ['pliers', 0.85, 0.2], ['brace', 1.2, 0.05]];
  for (const [kind, px, py] of T) {
    if (Math.abs(px) > w / 2 - 0.15) continue;
    a.add(M.paint, '#2b2622', cg('peg', () => new THREE.CylinderGeometry(0.008, 0.008, 0.06, 5).rotateX(Math.PI / 2)), px, py + 0.25, 0.07);
    if (kind === 'hammer') { a.add(M.timber, handle, bx(0.03, 0.34, 0.025), px, py + 0.05, 0.06); a.add(M.paint, steel, bx(0.14, 0.04, 0.035), px, py + 0.22, 0.06); }
    if (kind === 'saw') { a.add(M.paint, steel, cg('sawBlade', () => new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.11, 0), new THREE.Vector2(0.04, -0.5), new THREE.Vector2(0, -0.5)]))), px - 0.05, py + 0.2, 0.052); a.add(M.timber, handle, bx(0.11, 0.12, 0.025), px, py + 0.25, 0.058); }
    if (kind === 'square') { a.add(M.paint, steel, bx(0.025, 0.3, 0.008), px, py + 0.05, 0.05); a.add(M.timber, handle, bx(0.2, 0.04, 0.02), px + 0.09, py + 0.19, 0.055); }
    if (kind === 'wrench') { a.add(M.paint, steel, bx(0.03, 0.3, 0.012), px, py + 0.05, 0.052); a.add(M.paint, steel, cg('wrenchHead', () => new THREE.TorusGeometry(0.03, 0.012, 4, 8, Math.PI * 1.4)), px, py + 0.21, 0.052); }
    if (kind === 'chisels') for (let q = 0; q < 4; q++) { a.add(M.timber, handle, bx(0.025, 0.1, 0.025), px - 0.09 + q * 0.06, py + 0.17, 0.055); a.add(M.paint, steel, bx(0.015 + q * 0.004, 0.12, 0.006), px - 0.09 + q * 0.06, py + 0.06, 0.05); }
    if (kind === 'pliers') for (const s2 of [-1, 1]) a.add(M.paint, '#a8342a', bx(0.02, 0.18, 0.012), px + s2 * 0.02, py + 0.08, 0.052, { rz: s2 * 0.12 });
    if (kind === 'brace') { a.add(M.paint, steel, cg('braceCrank', () => new THREE.TorusGeometry(0.1, 0.008, 4, 10, Math.PI)), px, py + 0.1, 0.05, { rz: Math.PI / 2 }); a.add(M.timber, handle, bx(0.04, 0.05, 0.04), px, py + 0.22, 0.06); }
  }
  a.end({ ground: false, gap: 0.06 });
}

/** A floor globe on a three-legged oak stand (horizon ring, brass meridian). */
export function floorGlobe(c: Ctx, x: number, z: number, y0: number, yaw = 0.6, r = 0.25) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('floorGlobe');
  for (let i = 0; i < 3; i++) { const an = (i / 3) * Math.PI * 2; a.add(M.timber, '#5a3a22', bx(0.035, 0.75, 0.035), Math.cos(an) * 0.2, 0.37, Math.sin(an) * 0.2, { rx: Math.sin(an) * 0.22, rz: -Math.cos(an) * 0.22 }); }
  a.add(M.timber, '#5a3a22', cg('globeStretcher', () => new THREE.TorusGeometry(0.17, 0.012, 4, 12).rotateX(Math.PI / 2)), 0, 0.28, 0);
  a.add(M.timber, '#6e4a2c', cg('globeHorizon', () => new THREE.TorusGeometry(r + 0.04, 0.025, 5, 24).rotateX(Math.PI / 2)), 0, 0.73 + r, 0);
  a.add(M.brass, '#c9a14e', cg('globeMeridian', () => new THREE.TorusGeometry(r + 0.015, 0.012, 4, 24)), 0, 0.73 + r, 0, { rz: 0.4 });
  a.add(M.ceramic, '#6f91a6', cg(`globeBall${r}`, () => new THREE.IcosahedronGeometry(r, 2)), 0, 0.73 + r, 0);
  for (const [dx, dy, dz, sx] of [[0.12, 0.08, 0.19, 0.11], [-0.18, 0.04, 0.14, 0.09], [0.05, -0.12, 0.2, 0.07], [-0.08, 0.15, -0.18, 0.1]] as const) a.add(M.paint, '#b8a070', cg('globeLand', () => new THREE.IcosahedronGeometry(1, 1)), dx * (r / 0.25), 0.73 + r + dy * (r / 0.25), dz * (r / 0.25), { s: [sx, sx * 0.7, 0.03], ry: Math.atan2(dx, dz) });
  a.end({ gap: 0.03 });
  c.col.addCircle(x, z, 0.3, y0, y0 + 0.75 + 2 * r);
}

/** A woven log basket by a hearth: a wicker tub (rim, bands) with split logs standing in it. */
export function logBasket(c: Ctx, x: number, z: number, y0: number, yaw = 0) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('logBasket');
  a.add(M.upholstery, '#a8844a', cg('basket', () => projectUV(lathe([[0.001, 0], [0.2, 0], [0.24, 0.05], [0.26, 0.36], [0.27, 0.38], [0.255, 0.4], [0.24, 0.37], [0.001, 0.37]], 14), 0.25)), 0, 0, 0);
  for (const yy of [0.12, 0.26]) a.add(M.upholstery, '#8a6a3a', cg(`basketBand${yy}`, () => new THREE.TorusGeometry(0.243 + yy * 0.05, 0.012, 4, 16).rotateX(Math.PI / 2)), 0, yy, 0);
  const logs = cg('basketLogs', () => {
    const parts = [0, 1, 2, 3, 4, 5].map((i) => { const an = i * 1.1, rr = i ? 0.12 : 0; return new THREE.CylinderGeometry(0.055, 0.06, 0.5 - (i % 3) * 0.05, 7).translate(Math.cos(an) * rr, 0.25, Math.sin(an) * rr).toNonIndexed(); });
    const g = parts[0].clone(); void g;
    return mergeAll(parts);
  });
  a.add(M.timber, '#8a6a4a', logs, 0, 0.03, 0);
  a.end({ gap: 0.02 });
  c.col.addCircle(x, z, 0.28, y0, y0 + 0.55);
}
function mergeAll(parts: THREE.BufferGeometry[]) {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [];
  for (const g of parts) { pos.push(...(g.attributes.position.array as Float32Array)); nor.push(...(g.attributes.normal.array as Float32Array)); uv.push(...(g.attributes.uv.array as Float32Array)); g.dispose(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** Coat rail on the wall: a board with brass hooks, coats / scarf hanging from some (soft volumes, not boxes). */
export function coatRail(c: Ctx, x: number, z: number, y: number, yaw: number, w = 1.2, coats: string[] = ['#3f5a35', '#7a3a2a']) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y, z, yaw).begin('coatRail');
  a.add(M.timber, '#6e4a2c', sb(w, 0.1, 0.025, 0.006), 0, 0, 0.0125);
  const n = Math.max(3, Math.round(w / 0.3));
  for (let i = 0; i < n; i++) a.add(M.brass, '#c9a44c', cg('coatHook', () => new THREE.TorusGeometry(0.03, 0.006, 4, 8, Math.PI * 1.3).rotateY(Math.PI / 2)), -w / 2 + (w / n) * (i + 0.5), -0.03, 0.05);
  coats.forEach((col, i) => {
    const hx = -w / 2 + (w / n) * (i * 2 + 0.5);
    a.add(M.upholstery, col, cg('coat', () => { const g = projectUV(cushion(0.42, 0.95, 0.12, 0.06, 0.03, 'front', 1, 3), 0.25); const p = g.attributes.position as THREE.BufferAttribute; for (let k = 0; k < p.count; k++) { const yy = p.getY(k); p.setX(k, p.getX(k) * (0.55 + 0.45 * (0.5 - yy / 0.95))); } g.computeVertexNormals(); return g; }), hx, -0.53, 0.09);
    a.add(M.upholstery, darker(col, 0.85), cg('coatCollar', () => projectUV(cushion(0.2, 0.08, 0.1, 0.03, 0.01, 'top', 1, 2), 0.25)), hx, -0.06, 0.08);
  });
  a.end({ ground: false, gap: 0.04 });
}

/** Pedestal hand basin (wall-backed): a fluted pedestal, a basin with a rim and a dark bowl, a pillar tap. */
export function pedestalBasin(c: Ctx, x: number, z: number, y0: number, yaw: number) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('pedestalBasin');
  a.add(M.ceramic, '#f4f1ea', cg('pedestal', () => lathe([[0.001, 0], [0.13, 0], [0.12, 0.04], [0.08, 0.1], [0.07, 0.6], [0.1, 0.72], [0.001, 0.72]], 12)), 0, 0, 0.05);
  a.add(M.ceramic, '#f4f1ea', cg('basinBowl', () => lathe([[0.05, 0], [0.18, 0.02], [0.27, 0.13], [0.28, 0.16], [0.25, 0.16], [0.17, 0.05], [0.06, 0.03], [0.001, 0.03]], 16).scale(1, 1, 0.75)), 0, 0.7, 0.04);
  a.add(M.brass, '#c9c4b8', bx(0.025, 0.12, 0.025), 0, 0.92, -0.13);
  a.add(M.brass, '#c9c4b8', cg('basinSpout', () => new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6).rotateX(Math.PI / 2)), 0, 0.97, -0.09);
  a.end({ gap: 0.03 });
  collide(c, x, z, yaw, 0.55, 0.45, 0.9, y0);
}

/** A towel rail standing on two feet with towels folded over it. */
export function towelRail(c: Ctx, x: number, z: number, y0: number, yaw: number, colors: string[] = ['#6fae9a', '#f2ead8']) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('towelRail');
  for (const sx of [-1, 1]) { a.add(M.brass, '#c9a44c', bx(0.025, 0.9, 0.025), sx * 0.3, 0.45, 0); a.add(M.brass, '#c9a44c', bx(0.03, 0.025, 0.25), sx * 0.3, 0.0125, 0); }
  for (const yy of [0.55, 0.85]) a.add(M.brass, '#c9a44c', cg('railBar', () => new THREE.CylinderGeometry(0.011, 0.011, 0.6, 6).rotateZ(Math.PI / 2)), 0, yy, 0);
  colors.forEach((col, i) => a.add(M.upholstery, col, cg(`towelDrape${i}`, () => { const g = projectUV(softBox(0.42, 0.4 - i * 0.08, 0.035, 0.012, 1, 2), 0.25); return g; }), (i ? 0.06 : -0.04), 0.85 - (0.4 - i * 0.08) / 2 + 0.01, i ? 0.025 : -0.025));
  a.end({ gap: 0.03 });
  c.col.addCircle(x, z, 0.25, y0, y0 + 0.9);
}

/** Folding luggage rack (X-legs, two straps) — carries the Reiskamer suitcase. Top at 0.5. */
export function luggageRack(c: Ctx, x: number, z: number, y0: number, yaw: number) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('luggageRack'), wood = '#6b4426';
  for (const sx of [-1, 1]) for (const s2 of [-1, 1]) a.add(M.timber, wood, bx(0.03, 0.6, 0.03), sx * 0.4, 0.25, 0, { rx: s2 * 0.6 });
  for (const sz of [-1, 1]) a.add(M.timber, wood, bx(0.86, 0.03, 0.03), 0, 0.485, sz * 0.17);
  for (const sx of [-0.2, 0.2]) a.add(M.upholstery, '#7a2e2a', bx(0.06, 0.008, 0.36), sx, 0.5, 0);
  a.end({ gap: 0.03 });
}

/** A writing / observation desk on legs with one drawer, a small lamp-free top for charts and books. Top at 0.76. */
export function writingDesk(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.1, d = 0.55, wood = '#6e4a2c') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('writingDesk'), dk = darker(wood, 0.8);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) a.add(M.timber, dk, taperLeg(0.715, 0.03, 0.022), sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05));
  a.add(M.timber, wood, sb(w, 0.045, d, 0.01), 0, 0.7375, 0);
  a.add(M.timber, dk, bx(w - 0.14, 0.11, d - 0.12), 0, 0.66, -0.02);
  a.add(M.timber, darker(wood, 1.1), sb(w * 0.5, 0.09, 0.02, 0.004), 0, 0.66, d / 2 - 0.07);
  a.add(M.brass, '#c9a44c', cg('pullKnob', () => new THREE.SphereGeometry(0.014, 8, 6)), 0, 0.66, d / 2 - 0.05);
  a.end();
  collide(c, x, z, yaw, w, d, 0.8, y0);
}

/** Things on a work surface, built in the surface's frame (books, an open book, a lidded box, a jug…). */
export function tabletop(c: Ctx, x: number, z: number, y: number, yaw: number, items: ('book' | 'open' | 'stack' | 'jug' | 'candle' | 'cards' | 'game' | 'gameOpen' | 'bowl' | 'chart' | 'tumblers')[], seed = 1) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y, z, yaw), r = mulberry32(seed);
  let px = -((items.length - 1) * 0.32) / 2;
  for (const it of items) {
    const jz = (r() - 0.5) * 0.08;
    if (it === 'book') addBook(a, { size: 'medium', thick: 'medium', hard: true, design: Math.floor(r() * 8) }, BOOKS[Math.floor(r() * BOOKS.length)], px, 0, jz, { flat: true, ry: (r() - 0.5) * 0.6 });
    if (it === 'open') addOpenBook(a, BOOKS[Math.floor(r() * BOOKS.length)], px, 0, jz, { ry: (r() - 0.5) * 0.3 });
    if (it === 'stack') addBookStack(a, r, BOOKS, px, 0, jz, 3 + Math.floor(r() * 2), { ry: (r() - 0.5) * 0.4 });
    if (it === 'jug') a.add(M.ceramic, '#e6dcc4', cg('tableJug', () => lathe([[0.001, 0], [0.06, 0], [0.075, 0.08], [0.06, 0.18], [0.04, 0.22], [0.05, 0.24], [0.001, 0.23]], 12)), px, 0, jz);
    if (it === 'candle') { a.add(M.brass, '#c9a14e', cg('candlestick', () => lathe([[0.001, 0], [0.05, 0], [0.05, 0.01], [0.015, 0.03], [0.012, 0.16], [0.03, 0.18], [0.03, 0.19], [0.001, 0.19]], 10)), px, 0, jz); a.add(M.paint, '#efe6c8', cg('candleStub', () => new THREE.CylinderGeometry(0.012, 0.013, 0.1, 8).translate(0, 0.05, 0)), px, 0.19, jz); }
    if (it === 'cards') for (let q = 0; q < 2; q++) a.add(M.paint, '#f2ead8', cached('cardDeck', () => projectUV(softBox(0.063, 0.03, 0.088, 0.003, 1, 1), 1)), px + q * 0.08, 0.015, jz, { ry: r() });
    if (it === 'game') addGameBox(a, GAME_BOXES[Math.floor(r() * GAME_BOXES.length)], px, 0, jz, { ry: (r() - 0.5) * 0.4 });
    if (it === 'gameOpen') addGameBox(a, GAME_BOXES[Math.floor(r() * GAME_BOXES.length)], px, 0, jz, { ry: (r() - 0.5) * 0.4, open: true });
    if (it === 'bowl') a.add(M.ceramic, '#6f91a6', cg('tableBowl', () => lathe([[0.001, 0], [0.06, 0], [0.12, 0.06], [0.13, 0.075], [0.001, 0.02]], 12)), px, 0, jz);
    if (it === 'chart') a.add(M.paint, '#e8dcbc', cg('rolledChart', () => new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8).rotateZ(Math.PI / 2).translate(0, 0.03, 0)), px, 0, jz, { ry: 0.3 });
    if (it === 'tumblers') for (let q = 0; q < 3; q++) a.add(M.ceramic, '#cfe0e6', cg('tumbler2', () => lathe([[0.001, 0], [0.03, 0], [0.034, 0.09], [0.031, 0.09], [0.027, 0.008], [0.001, 0.008]], 8)), px + (q % 2) * 0.07, 0, jz + (q - 1) * 0.06);
    px += 0.32;
  }
}

/** A tall pantry / larder cupboard (two panelled doors over two drawers), against a wall. */
export function larder(c: Ctx, x: number, z: number, y0: number, yaw: number, w = 1.2, d = 0.5, h = 2.05, paint = '#8fa596') {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y0, z, yaw).begin('larder'), lt = darker(paint, 1.06);
  a.add(M.paint, '#4a4038', bx(w - 0.04, 0.09, d - 0.04), 0, 0.045, -0.01);
  a.add(M.paint, paint, sb(w, h - 0.13, d, 0.006), 0, 0.09 + (h - 0.13) / 2, 0);
  a.add(M.paint, paint, sb(w + 0.06, 0.05, d + 0.04, 0.008), 0, h - 0.015, 0.01);
  for (const s2 of [-1, 1]) {
    a.add(M.paint, lt, sb(w / 2 - 0.03, 1.2, 0.02, 0.004), s2 * (w / 4), 1.25, d / 2 + 0.005);
    a.add(M.paint, darker(paint, 1.12), sb(w / 2 - 0.16, 0.95, 0.014, 0.006), s2 * (w / 4), 1.25, d / 2 + 0.018);
    a.add(M.paint, lt, sb(w / 2 - 0.03, 0.26, 0.02, 0.004), s2 * (w / 4), 0.42, d / 2 + 0.005);
    a.add(M.brass, '#c9a44c', bx(0.012, 0.12, 0.02), s2 * 0.05, 1.2, d / 2 + 0.02);
    a.add(M.brass, '#c9a44c', bx(0.1, 0.012, 0.02), s2 * (w / 4), 0.45, d / 2 + 0.02);
  }
  a.end();
  collide(c, x, z, yaw, w, d, h, y0);
}

/** Pieces for a board-game table (the dining room's home-made duo game): board, pawns, small dice, card piles. */
export function boardGameSet(c: Ctx, x: number, z: number, y: number, yaw: number) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, y, z, yaw).begin('boardGameSet');
  a.add(M.paint, '#e8d8b0', cg('gameBoard', () => projectUV(softBox(0.68, 0.012, 0.68, 0.004, 1, 1), 1)), 0, 0.006, 0);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2) a.add(M.paint, '#c9b48a', cg('gameSquare', () => new THREE.PlaneGeometry(0.1, 0.1).rotateX(-Math.PI / 2)), -0.25 + i * 0.1, 0.0125, -0.25 + j * 0.1);
  const pawn = cg('pawn', () => lathe([[0.001, 0], [0.018, 0], [0.018, 0.006], [0.009, 0.02], [0.007, 0.032], [0.012, 0.042], [0.001, 0.05]], 8));
  ['#c4553d', '#3f6fa8', '#4f8a3a', '#e8c547'].forEach((col, i) => a.add(M.ceramic, col, pawn, -0.2 + (i % 2) * 0.4, 0.012, -0.2 + Math.floor(i / 2) * 0.4));
  for (let i = 0; i < 2; i++) a.add(M.ceramic, '#f5f0e6', cg('die', () => projectUV(softBox(0.018, 0.018, 0.018, 0.003, 1, 1), 1)), 0.42 + i * 0.05, 0.009, 0.1 + i * 0.04, { ry: i * 0.7 });
  for (const [dx, dz] of [[0.45, -0.18], [-0.46, 0.2]] as const) a.add(M.paint, '#f2ead8', cached('cardDeck', () => projectUV(softBox(0.063, 0.03, 0.088, 0.003, 1, 1), 1)), dx, 0.015, dz, { ry: 0.2 });
  a.end({ ground: false, gap: 0.5 });
}
