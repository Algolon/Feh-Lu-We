// CARS-R01: authored car silhouettes, genuine wheel openings and inset glazing.
// Coordinates below use plan space (+z is the nose); all parts join the existing grounds batch.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { Asm, artMats } from './artkit';
import { joinery } from './furniture';

type P = [number, number, number];
/** A planar quad, wound toward an explicit outward normal (including mirrored sides). */
function panel(p: P[], outward: P) {
  const v = p.map(([x, y, z]) => new THREE.Vector3(x, y, -z));
  const n = new THREE.Vector3().subVectors(v[1], v[0]).cross(new THREE.Vector3().subVectors(v[2], v[0]));
  const ix = n.dot(new THREE.Vector3(outward[0], outward[1], -outward[2])) > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(ix.flatMap(i => v[i].toArray()), 3));
  g.computeVertexNormals();
  return g;
}

export function parkedCar(c: Ctx, id: string, x: number, z: number, color: string) {
  const M = artMats(), { sb, bx, cg } = joinery;
  const a = new Asm(c.b, 'grounds', x, 0, z, 0);
  const van = id === 'car.2', hatch = id === 'car.3';
  const L = hatch ? 3.95 : 4.3, axle = L / 2 - 0.78;
  const top = van ? 1.77 : hatch ? 1.46 : 1.5;
  const rear = hatch ? -1.63 : -1.87, front = van ? 1.48 : 0.98;
  const roofRear = hatch ? -1.13 : -1.65, roofFront = van ? 0.98 : 0.42;
  const trim = '#242b2b', body = new THREE.Color(color);
  const add = (g: THREE.BufferGeometry, col: THREE.ColorRepresentation) => { a.add(M.paint, col, g, 0, 0, 0); g.dispose(); };

  // Continuous side outline with two open arches, bevelled across the full car width.
  const s = new THREE.Shape();
  s.moveTo(-L / 2, 0.36);
  for (const wz of [-axle, axle]) {
    s.lineTo(wz - 0.405, 0.36);
    for (let j = 1; j <= 12; j++) {
      const t = Math.PI - j * Math.PI / 12;
      s.lineTo(wz + Math.cos(t) * 0.405, 0.36 + Math.sin(t) * 0.405);
    }
  }
  s.lineTo(L / 2, 0.36); s.lineTo(L / 2, 0.69);
  s.lineTo(L / 2 - 0.2, 0.85); s.lineTo(front, 0.95);
  s.lineTo(rear, 0.95); s.lineTo(-L / 2, 0.8); s.closePath();
  const shell = new THREE.ExtrudeGeometry(s, { depth: 1.57, steps: 1, bevelEnabled: true, bevelSize: 0.045, bevelThickness: 0.075, bevelSegments: 2, curveSegments: 1 });
  shell.rotateY(Math.PI / 2).translate(-0.785, 0, 0);
  add(shell, body);

  // Tapered cabin: sloping windscreen, rear screen and sides, with painted window surrounds.
  const low = 0.945, half = 0.76, rh = van ? 0.69 : 0.64;
  for (const side of [-1, 1]) {
    add(panel([[side * half, low, rear], [side * half, low, front], [side * rh, top, roofFront], [side * rh, top, roofRear]], [side, 0, 0]), body);
    const at = (u: number, v: number, offset = 0): P => [side * (half + (rh - half) * v + offset), low + (top - low) * v, rear + (front - rear) * u + ((roofRear + (roofFront - roofRear) * u) - (rear + (front - rear) * u)) * v];
    const divisions = hatch ? [0.04, 0.45, 0.96] : [0.035, 0.29, 0.61, 0.965];
    for (let j = 0; j < divisions.length - 1; j++) {
      const u0 = divisions[j] + 0.013, u1 = divisions[j + 1] - 0.013;
      add(panel([at(u0, 0.11, 0.006), at(u1, 0.11, 0.006), at(u1, 0.91, 0.006), at(u0, 0.91, 0.006)], [side, 0, 0]), '#354a54');
      // Restrained sky reflection, follows the same sloping window plane.
      add(panel([at(u0 + 0.012, 0.73, 0.009), at(u1 - 0.012, 0.73, 0.009), at(u1 - 0.012, 0.86, 0.009), at(u0 + 0.012, 0.86, 0.009)], [side, 0, 0]), '#647d86');
    }
    // Door joints below the belt line and small flush handles.
    for (const pz of [rear + 0.7, front - 0.68]) {
      a.add(M.paint, body.clone().multiplyScalar(0.6), bx(0.008, 0.22, 0.012), side * 0.862, 0.83, pz);
      a.add(M.paint, '#b1b4ad', sb(0.025, 0.035, 0.14, 0.012, 1), side * 0.87, 0.88, pz - 0.13);
    }
    a.add(M.paint, trim, sb(0.045, 0.08, 1.55, 0.018, 1), side * 0.846, 0.39, 0);
    a.add(M.paint, trim, bx(0.15, 0.025, 0.04), side * 0.82, 1.03, front - 0.14);
    a.add(M.paint, body, sb(0.16, 0.12, 0.23, 0.045, 2), side * 0.91, 1.06, front - 0.14);
  }
  for (const end of [-1, 1]) {
    const b = end > 0 ? front : rear, r = end > 0 ? roofFront : roofRear;
    add(panel([[-half, low, b], [half, low, b], [rh, top, r], [-rh, top, r]], [0, 0.2, end]), body);
    const at = (sx: number, t: number): P => [sx * (half + (rh - half) * t - 0.055), low + (top - low) * t, b + (r - b) * t + end * 0.008];
    add(panel([at(-1, 0.12), at(1, 0.12), at(1, 0.9), at(-1, 0.9)], [0, 0.2, end]), '#3c535f');
    // Wiper rests just above the base of each screen.
    a.add(M.paint, trim, bx(0.58, 0.012, 0.016), 0, low + (top - low) * 0.14, b + (r - b) * 0.14 + end * 0.02);
  }
  a.add(M.paint, body, sb(rh * 2 + 0.025, 0.065, roofFront - roofRear + 0.08, 0.028, 2), 0, top + 0.012, (roofFront + roofRear) / 2);
  if (!hatch && !van) for (const side of [-1, 1]) a.add(M.paint, trim, sb(0.035, 0.05, 1.95, 0.015, 1), side * 0.56, top + 0.07, -0.59);

  // Rounded tyres and inset rims; wheel centres remain clear of the open arches.
  const tyre = cg('carsR01Tyre', () => new THREE.TorusGeometry(0.257, 0.083, 6, 20).rotateY(Math.PI / 2));
  const rim = cg('carsR01Rim', () => new THREE.CylinderGeometry(0.185, 0.185, 0.025, 16).rotateZ(Math.PI / 2));
  for (const side of [-1, 1]) for (const wz of [-axle, axle]) {
    a.add(M.paint, '#202426', tyre, side * 0.79, 0.37, wz);
    a.add(M.paint, '#434b4c', rim, side * 0.865, 0.37, wz);
    for (let j = 0; j < 5; j++) {
      const t = j * Math.PI * 2 / 5;
      a.add(M.brass, '#a9afab', sb(0.018, 0.125, 0.035, 0.007, 1), side * 0.883, 0.37 + Math.cos(t) * 0.09, wz + Math.sin(t) * 0.09, { rx: t });
    }
    a.add(M.brass, '#bac0b9', cg('carsR01Cap', () => new THREE.CylinderGeometry(0.045, 0.045, 0.018, 10).rotateZ(Math.PI / 2)), side * 0.887, 0.37, wz);
  }
  for (const end of [-1, 1]) {
    a.add(M.paint, trim, sb(1.6, 0.14, 0.15, 0.055, 2), 0, 0.43, end * (L / 2 + 0.025));
    a.add(M.paint, '#dfc25c', bx(0.45, 0.105, 0.018), 0, 0.54, end * (L / 2 + 0.055));
    for (const side of [-1, 1]) {
      a.add(M.paint, end > 0 ? '#d5ded8' : '#a3332c', sb(0.3, 0.13, 0.07, 0.025, 2), side * 0.59, 0.73, end * (L / 2 + 0.055));
      a.add(M.paint, '#ca9560', bx(0.055, 0.055, 0.012), side * 0.69, 0.73, end * (L / 2 + 0.095));
    }
    if (end > 0) {
      a.add(M.paint, trim, sb(0.64, 0.13, 0.025, 0.02, 1), 0, 0.72, L / 2 + 0.065);
      for (const dy of [-0.035, 0, 0.035]) a.add(M.paint, '#636e6b', bx(0.54, 0.009, 0.015), 0, 0.72 + dy, L / 2 + 0.087);
    }
  }
}
