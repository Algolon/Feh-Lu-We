// TUT-R02 — the remaining home-only asset families. Shared estate builders stay unchanged.
// Rounded garment volumes, readable footwear construction and built fixtures; metre-scale origins.
import * as THREE from 'three';
import { INTERIOR_GREEN } from './gardenkit';
import { addIndoorPlant } from './indoorPlants';

import { GARDEN_DETAIL, gardenPot, gardenSoilMaterial, SOIL_TINT } from './gardenkit';
import type { Ctx } from './arch';
import { Asm, artMats, lathe, projectUV, bake, baseAO } from './artkit';
import { compound, v3 } from './kit';
import { joinery, type LampModel } from './furniture';
import type { World } from '../interactions/world';
import { MEMORIES } from '../content/memories';

const { sb, bx, cg } = joinery;
const oak = '#66503a', dk = '#3d3025', brass = '#b79557';

/** Elliptical cross sections: genuine depth, shaped shoulders/waist/hem rather than a flat board. */
function loft(rings: [number, number, number, number][], n = 16) {
  const pos: number[] = [], uv: number[] = [], indices: number[] = [];
  rings.forEach(([y, rx, rz, cz], j) => {
    for (let i = 0; i <= n; i++) {
      const t = 2 * Math.PI * i / n;
      pos.push(rx * Math.cos(t), y, -cz + rz * Math.sin(t)); uv.push(i / n, j / (rings.length - 1));
      if (j && i < n) { const q = j * (n + 1) + i, p = q - n - 1; indices.push(p, q, p + 1, p + 1, q, q + 1); }
    }
  });
  // Close the ends; skirts/collars are drawn over the caps where appropriate.
  for (const j of [0, rings.length - 1]) {
    const [y, , , cz] = rings[j], at = pos.length / 3, start = j * (n + 1);
    pos.push(0, y, -cz); uv.push(0.5, j ? 1 : 0);
    for (let i = 0; i < n; i++) indices.push(...(j ? [at, start + i + 1, start + i] : [at, start + i, start + i + 1]));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(indices); g.computeVertexNormals();
  return g;
}

/** A supported rail/arm between two local-plan points. */
function rail(a: Asm, mat: THREE.Material, color: string, p: number[], q: number[], r = 0.012) {
  const dir = new THREE.Vector3(q[0] - p[0], q[1] - p[1], -(q[2] - p[2]));
  const g = new THREE.CylinderGeometry(r, r, dir.length(), 10);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  a.add(mat, color, g, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2); g.dispose();
}

/** Turned oak stand on a three-foot base; visible pegs carry coat hangers. */
export function homeCoatStand(c: Ctx) {
  const M = artMats(), a = new Asm(c.b, c.chunk, 7.55, 0, 4.6, -Math.PI / 2);
  a.add(M.timber, oak, cg('homeCoatPost', () => projectUV(lathe([
    [0.001, 0], [0.066, 0], [0.075, 0.05], [0.04, 0.13], [0.026, 0.35],
    [0.027, 1.6], [0.046, 1.67], [0.04, 1.72], [0.028, 1.86], [0.001, 1.89],
  ], 16), 0.7, 'y')), 0, 0, 0);
  for (let i = 0; i < 3; i++) {
    const t = i * 2 * Math.PI / 3;
    const g = sb(0.095, 0.062, 0.34, 0.014);
    a.add(M.timber, dk, g, Math.sin(t) * 0.13, 0.031, Math.cos(t) * 0.13, { ry: t });
  }
  for (const x of [-0.36, 0.36]) {
    rail(a, M.timber, oak, [0, 1.68, 0], [x, 1.79, 0.055], 0.021);
    a.add(M.timber, oak, cg('homePegBall', () => new THREE.SphereGeometry(0.029, 12, 8)), x, 1.79, 0.055);
  }
  for (const z of [-0.19, 0.19]) rail(a, M.timber, oak, [0, 1.65, 0], [0, 1.74, z], 0.018);
  // 72 cm between hanger centres; each unified garment is <64 cm wide including bevels.
  // Leave actual air between the coats rather than hiding interpenetration with draw order.
  coat(c, 7.455, 4.24, -Math.PI / 2, '#65705a', false);
  coat(c, 7.455, 4.96, -Math.PI / 2, '#3e5666', true);
  c.col.addCircle(7.55, 4.6, 0.3, 0, 2); // original footprint
}

function coat(c: Ctx, x: number, z: number, yaw: number, color: string, short: boolean) {
  const M = artMats(), a = new Asm(c.b, c.chunk, x, 0, z, yaw), hem = short ? 1.03 : 0.9;
  // One bevelled garment contour includes torso, shoulders and both drooping sleeves.
  // No overlapping sleeve tubes or separate shoulder caps: the shoulder is a continuous surface.
  a.add(M.upholstery, color, cg(`homeCoatUnified${hem}`, () => {
    const s = new THREE.Shape();
    s.moveTo(-0.172, hem);
    s.quadraticCurveTo(-0.195, hem + 0.16, -0.17, 1.33);
    s.lineTo(-0.176, 1.4);
    s.quadraticCurveTo(-0.205, 1.26, -0.228, 1.065);
    s.quadraticCurveTo(-0.262, 1.048, -0.292, 1.075);
    s.quadraticCurveTo(-0.305, 1.29, -0.29, 1.45);
    s.quadraticCurveTo(-0.285, 1.535, -0.195, 1.592);
    s.lineTo(-0.064, 1.65); s.quadraticCurveTo(0, 1.622, 0.064, 1.65);
    s.lineTo(0.195, 1.592);
    s.quadraticCurveTo(0.285, 1.535, 0.29, 1.45);
    s.quadraticCurveTo(0.305, 1.29, 0.292, 1.075);
    s.quadraticCurveTo(0.262, 1.048, 0.228, 1.065);
    s.quadraticCurveTo(0.205, 1.26, 0.176, 1.4);
    s.lineTo(0.17, 1.33); s.quadraticCurveTo(0.195, hem + 0.16, 0.172, hem);
    s.quadraticCurveTo(0, hem - 0.012, -0.172, hem);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.088, bevelEnabled: true, bevelSize: 0.018, bevelThickness: 0.018, bevelSegments: 3, curveSegments: 7 });
    g.translate(0, 0, -0.044);
    return projectUV(g, 1, 'y');
  }), 0, 0, 0);
  for (const side of [-1, 1]) {
    a.add(M.upholstery, '#303d3c', sb(0.065, 0.028, 0.132, 0.012), side * 0.26, 1.057, 0);
    a.add(M.upholstery, '#c1b49a', sb(0.05, 0.108, 0.021, 0.008), side * 0.055, 1.615, 0.076, { rz: side * -0.38 });
    a.add(M.upholstery, color, sb(0.10, 0.10, 0.014, 0.007), side * 0.106, hem + 0.24, 0.062);
    a.add(M.upholstery, '#455144', sb(0.105, 0.02, 0.016, 0.004), side * 0.106, hem + 0.287, 0.067);
  }
  a.add(M.paint, '#38413a', bx(0.012, 1.58 - hem, 0.006), 0, (1.58 + hem) / 2, 0.063);
  for (const y of [hem + 0.12, hem + 0.27, hem + 0.42]) a.add(M.brass, brass, cg('homeCoatButton', () => new THREE.SphereGeometry(0.009, 8, 6)), 0.015, y, 0.068);
  // Hanger sits inside the shoulder line; hook reaches the stand's corresponding peg.
  rail(a, M.timber, '#b49368', [-0.17, 1.59, -0.04], [0, 1.69, -0.04], 0.009);
  rail(a, M.timber, '#b49368', [0, 1.69, -0.04], [0.17, 1.59, -0.04], 0.009);
  a.add(M.brass, brass, cg('homeHangerHook', () => new THREE.TorusGeometry(0.043, 0.006, 5, 16, Math.PI * 1.6)), 0, 1.737, -0.04, { rz: 0.38 });
}

/** Rounded toe, separate outsole/heel, leather ankle shaft, padded opening, tongue and laces. */
export function homeBoots(c: Ctx) {
  const M = artMats();
  const sole = cg('homeBootSole', () => {
    const s = new THREE.Shape();
    s.moveTo(-0.058, -0.135); s.lineTo(-0.073, -0.07); s.lineTo(-0.085, 0.11);
    s.quadraticCurveTo(-0.085, 0.205, -0.035, 0.218);
    s.quadraticCurveTo(0.045, 0.229, 0.077, 0.183);
    s.quadraticCurveTo(0.09, 0.13, 0.073, 0.04); s.lineTo(0.061, -0.135);
    s.quadraticCurveTo(0, -0.166, -0.058, -0.135);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.027, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2, curveSegments: 5 });
    g.rotateX(-Math.PI / 2); g.translate(0, 0.004, 0); return projectUV(g, 0.3);
  });
  for (const [i, z] of [3.79, 4.0].entries()) {
    const a = new Asm(c.b, c.chunk, 7.5, 0, z, -Math.PI / 2 + (i ? -0.12 : 0.06));
    a.add(M.paint, '#352e28', sole, 0, 0, 0);
    a.add(M.paint, '#493b2e', sole, 0, 0.032, 0, { s: [0.94, 0.27, 0.97] });
    a.add(M.paint, '#835b3c', cg('homeBootUpper', () => bake(loft([
      [0.04, 0.081, 0.17, 0.035], [0.105, 0.077, 0.169, 0.035], [0.16, 0.065, 0.14, 0.02],
      [0.21, 0.057, 0.08, -0.055], [0.3, 0.053, 0.067, -0.065],
    ]), baseAO(0.04, 0.16, 0.8))), 0, 0, 0);
    a.add(M.paint, '#292a27', cg('homeBootHole', () => new THREE.CylinderGeometry(0.045, 0.045, 0.005, 16).scale(1, 1, 1.22)), 0, 0.301, -0.065);
    a.add(M.upholstery, '#4b5149', cg('homeBootCollar', () => new THREE.TorusGeometry(0.049, 0.011, 6, 16).rotateX(Math.PI / 2).scale(1, 1, 1.22)), 0, 0.3, -0.065);
    a.add(M.paint, '#a4794c', sb(0.065, 0.15, 0.017, 0.008), 0, 0.2, 0.012, { rx: 0.4 });
    for (const y of [0.17, 0.205, 0.24]) {
      const lz = y < 0.19 ? 0.061 : y < 0.23 ? 0.034 : 0.012;
      for (const side of [-1, 1]) {
        a.add(M.brass, brass, cg('homeBootEyelet', () => new THREE.TorusGeometry(0.006, 0.002, 4, 8)), side * 0.035, y, lz);
        rail(a, M.upholstery, '#d2bea0', [side * 0.036, y, lz + 0.006], [-side * 0.034, y + 0.017, lz - 0.004], 0.003);
      }
    }
    a.add(M.paint, '#412d20', sb(0.018, 0.059, 0.009, 0.003), 0, 0.312, -0.13);
  }
}

/** Home plants use individual shaped leaves on visible stems, not outdoor shrub crown chunks. */
export function homePottedPlant(c: Ctx, x: number, z: number, s: number) {
  if(INTERIOR_GREEN){addIndoorPlant(c,x,z,0,x>4?'ficus':'snake',x>4?1:2,s,x>4?'ceramic':'wicker');c.col.addCircle(x,z,.22*s,0,1);return;}
  const M = artMats(), a = new Asm(c.b, c.chunk, x, 0, z, 0);
  a.add(M.paint, '#b57752', cg(GARDEN_DETAIL?'homeGardenPot':'homePlantPot', () => GARDEN_DETAIL?gardenPot(.24,.40):lathe([
    [0, 0], [0.15, 0], [0.17, 0.03], [0.224, 0.32], [0.242, 0.34],
    [0.248, 0.365], [0.23, 0.386], [0.217, 0.365], [0.213, 0.345], [0, 0.345],
  ], 24)), 0, 0, 0, { s: [s, s, s] });
  a.add(GARDEN_DETAIL?gardenSoilMaterial():M.paint, GARDEN_DETAIL?SOIL_TINT:'#41362c', cg('homePlantSoil', () => new THREE.CircleGeometry(0.213, 20).rotateX(-Math.PI / 2)), 0, 0.35 * s, 0, { s: [s, 1, s] });
  const leaf = cg('homePlantLeaf', () => {
    const pos: number[] = [], uv: number[] = [], ix: number[] = [];
    const rings = [[0, 0.003, 0], [0.046, 0.038, 0.055], [0.076, 0.047, 0.128], [0.048, 0.028, 0.205], [0, -0.006, 0.25]];
    rings.forEach(([w, y, z], j) => {
      for (const k of [-1, 0, 1]) { pos.push(k * w, y - Math.abs(k) * 0.016, -z); uv.push((k + 1) / 2, j / 4); }
      if (j) for (let k = 0; k < 2; k++) { const p = (j - 1) * 3 + k, q = j * 3 + k; ix.push(p, p + 1, q, p + 1, q + 1, q); }
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix); g.computeVertexNormals();
    // Duplicate the thin back with the same upward-biased authored normal, avoiding DoubleSide normal flipping.
    const normal = g.attributes.normal.array as Float32Array, n = pos.length / 3;
    const backPos = pos.map((v, i) => i % 3 === 1 ? v - 0.003 : v);
    const both = new THREE.BufferGeometry();
    both.setAttribute('position', new THREE.Float32BufferAttribute([...pos, ...backPos], 3));
    both.setAttribute('uv', new THREE.Float32BufferAttribute([...uv, ...uv], 2));
    both.setAttribute('normal', new THREE.Float32BufferAttribute([...normal, ...normal], 3));
    const backs: number[] = []; for (let i = 0; i < ix.length; i += 3) backs.push(ix[i] + n, ix[i + 2] + n, ix[i + 1] + n);
    both.setIndex([...ix, ...backs]); g.dispose(); return both;
  });
  rail(a, M.paint, '#59624a', [0, 0.35 * s, 0], [0.013 * s, 1.11 * s, 0], 0.011 * s);
  for (let i = 0; i < 13; i++) {
    const t = i * 2.4 + 0.3, yy = (0.47 + i * 0.049) * s, reach = (i > 9 ? 0.085 : 0.135) * s;
    const dx = Math.sin(t) * reach, dz = Math.cos(t) * reach;
    rail(a, M.paint, '#59624a', [0, yy - 0.055 * s, 0], [dx, yy, dz], 0.005 * s);
    const sz = s * (i > 9 ? 0.75 : 1);
    a.add(M.paint, ['#667d50', '#718454', '#516c48'][i % 3], leaf, dx, yy, dz, { ry: t, rx: i % 2 ? -0.16 : 0.18, s: [sz, sz, sz] });
  }
  c.col.addCircle(x, z, 0.22 * s, 0, 1); // existing plant footprint
}

/** Candle top/wick stays at 0.172 so its existing flame and lighting contract remain aligned. */
export function homeCandle() {
  return compound(b => {
    const M = artMats(), a = new Asm(b, 'main', 0, 0, 0, 0);
    a.add(M.brass, brass, cg('homeCandleDish', () => lathe([[0, 0], [0.061, 0], [0.072, 0.009], [0.074, 0.015], [0.06, 0.026], [0.035, 0.026], [0.035, 0.018], [0, 0.018]], 20)), 0, 0, 0);
    a.add(M.paint, '#f2e4bf', cg('homeWax', () => lathe([[0, 0], [0.025, 0], [0.026, 0.1], [0.023, 0.14], [0, 0.135]], 16)), 0, 0.02, 0);
    a.add(M.paint, '#d5c596', cg('homeWaxTop', () => new THREE.CylinderGeometry(0.018, 0.018, 0.002, 16)), 0, 0.156, 0);
    for (const [x, z, y, h] of [[0.022, 0, 0.095, 0.055], [-0.012, 0.021, 0.12, 0.036]]) a.add(M.paint, '#f7ebcc', sb(0.011, h, 0.009, 0.004), x, y, z);
    a.add(M.paint, '#2d251e', cg('homeWick', () => new THREE.CylinderGeometry(0.002, 0.002, 0.016, 6)), 0, 0.168, 0);
    a.add(M.brass, brass, cg('homeCandleHandle', () => new THREE.TorusGeometry(0.027, 0.005, 6, 16)), 0.073, 0.028, 0);
  });
}

function pleatedShade(w: World, obj: THREE.Group, topR: number, botR: number, h: number, y: number) {
  const n = 48, g = new THREE.CylinderGeometry(topR, botR, h, n, 1, true);
  const p = g.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const t = Math.atan2(p.getZ(i), p.getX(i)), k = 1 + 0.023 * Math.cos(t * 24);
    p.setXYZ(i, p.getX(i) * k, p.getY(i), p.getZ(i) * k);
    // Fabric seam variation, never directional or coloured baked lamp illumination.
    const v = 0.91 + 0.09 * (Math.cos(t * 24) + 1) / 2;
    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = v;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  const mat = w.material(new THREE.MeshBasicMaterial({ color: '#ffe4b2', vertexColors: true, side: THREE.DoubleSide }));
  const mesh = new THREE.Mesh(g, mat); mesh.position.y = y; obj.add(mesh);
  return mat;
}

// Rims/body are one shared-material compound; shade is the same controllable light surface contract as production.
export function homeLamp(w: World, x: number, y0: number, z: number, floor: boolean): LampModel {
  const M = artMats(), sy = floor ? 1.55 : 0.45, hr = floor ? 0.16 : 0.13, br = floor ? 0.26 : 0.21, sh = floor ? 0.32 : 0.26;
  const obj = compound(b => {
    const a = new Asm(b, 'main', 0, 0, 0, 0);
    if (floor) {
      a.add(M.brass, brass, cg('homeFloorBase', () => lathe([[0, 0], [0.2, 0], [0.21, 0.015], [0.18, 0.05], [0.04, 0.06], [0, 0.06]], 24)), 0, 0, 0);
      a.add(M.timber, dk, cg('homeFloorStem', () => projectUV(lathe([[0, 0], [0.029, 0], [0.025, 0.15], [0.021, 1.25], [0.04, 1.32], [0, 1.32]], 16), 0.5, 'y')), 0, 0.06, 0);
    } else {
      a.add(M.brass, brass, cg('homeTableBase', () => lathe([[0, 0], [0.12, 0], [0.128, 0.012], [0.11, 0.028], [0, 0.028]], 20)), 0, 0, 0);
      a.add(M.ceramic, '#81958b', cg('homeTableBody', () => lathe([[0, 0], [0.059, 0], [0.088, 0.048], [0.1, 0.13], [0.085, 0.2], [0.043, 0.25], [0.034, 0.28], [0, 0.28]], 24)), 0, 0.027, 0);
    }
    a.add(M.brass, brass, cg(`homeSocket${floor}`, () => new THREE.CylinderGeometry(0.019, 0.025, 0.07, 12)), 0, sy - sh / 2 - 0.015, 0);
    for (const [r, yy] of [[br, sy - sh / 2], [hr, sy + sh / 2]]) a.add(M.upholstery, '#c1a777', cg(`homeShadeRim${r}`, () => new THREE.TorusGeometry(r, 0.007, 5, 48).rotateX(Math.PI / 2)), 0, yy, 0);
    for (const xx of [-0.028, 0.028]) rail(a, M.brass, brass, [xx, sy - sh / 2 - 0.04, 0], [xx, sy + sh / 2 + 0.024, 0], 0.005);
    a.add(M.brass, brass, cg('homeLampFinial', () => new THREE.SphereGeometry(0.019, 12, 8)), 0, sy + sh / 2 + 0.024, 0);
  });
  const mat = pleatedShade(w, obj, hr, br, sh, sy);
  obj.position.copy(v3(x, y0, z)); w.scene.add(obj);
  return { obj, glow: [mat], light: v3(x, y0 + (floor ? 1.6 : 0.5), z) };
}

/** Printed calendar repeats existing memory prose. No new dates, codes or puzzle information. */
export function homeCalendar(w: World) {
  const M = artMats();
  const obj = compound(b => {
    const a = new Asm(b, 'main', 0, 0, 0, 0);
    a.add(M.paint, '#eee3c8', sb(0.40, 0.5, 0.012, 0.003), 0, 0.25, 0);
    a.add(M.paint, '#9b4935', sb(0.415, 0.06, 0.023, 0.005), 0, 0.493, 0.004);
    for (const x of [-0.13, -0.065, 0, 0.065, 0.13]) a.add(M.brass, brass, cg('homeCalendarRing', () => new THREE.TorusGeometry(0.015, 0.003, 5, 12).rotateY(Math.PI / 2)), x, 0.505, 0);
  });
  const cv = document.createElement('canvas'); cv.width = 384; cv.height = 480;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#f0e8d5'; ctx.fillRect(0, 0, 384, 480);
  ctx.fillStyle = '#403c32'; ctx.font = 'bold 26px Georgia'; ctx.fillText('WEEKENDPLANNING', 24, 53);
  const days = ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO']; ctx.font = '18px sans-serif';
  days.forEach((d, i) => ctx.fillText(d, 25 + i * 48, 104));
  ctx.strokeStyle = '#c5b9a0'; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(18 + i * 48, 118); ctx.lineTo(18 + i * 48, 340); ctx.stroke(); }
  for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.moveTo(18, 118 + j * 55); ctx.lineTo(354, 118 + j * 55); ctx.stroke(); }
  ctx.strokeStyle = '#a34837'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(286, 198, 64, 31, -0.08, 0, Math.PI * 2); ctx.stroke();
  // Wording drawn from the authoritative memory; this visual never invents a numbered date.
  const note = MEMORIES['mem.home.calendar'].text.split('“')[1].split('”')[0];
  ctx.fillStyle = '#4a4c42'; ctx.font = 'italic 23px Georgia';
  ctx.fillText(note.split('. ')[0] + '.', 24, 390); ctx.fillText('Echt.', 24, 425);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = w.material(new THREE.MeshLambertMaterial({ map: tex }));
  const page = new THREE.Mesh(new THREE.PlaneGeometry(0.376, 0.466), mat);
  page.rotation.y = Math.PI; page.position.set(0, 0.25, -0.009); obj.add(page);
  return obj;
}
