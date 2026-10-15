// CARS-R02: four authored European silhouettes with open cabins and constructed wheels.
// Plan space: +z = nose. All opaque parts reuse the grounds paint/metal batches.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { Asm, artMats, lathe } from './artkit';
import { joinery } from './furniture';
type P = [number, number, number];
export const CAR_PROFILES = {
  'car.1': { kind: 'estate', L: 4.3, axle: 1.37, wheel: 0.34, belt: 0.96, top: 1.52, rear: -1.86, front: 0.97, rr: -1.6, rf: 0.36, rh: 0.65 },
  'car.2': { kind: 'bus', L: 4.3, axle: 1.37, wheel: 0.35, belt: 1.08, top: 1.95, rear: -1.92, front: 1.88, rr: -1.76, rf: 1.56, rh: 0.73 },
  'car.3': { kind: 'hatch', L: 3.8, axle: 1.13, wheel: 0.32, belt: 0.91, top: 1.43, rear: -1.57, front: 0.83, rr: -1.02, rf: 0.32, rh: 0.64 },
  'car.4': { kind: 'suv', L: 4.3, axle: 1.36, wheel: 0.39, belt: 1.12, top: 1.8, rear: -1.85, front: 1.03, rr: -1.52, rf: 0.48, rh: 0.7 },
} as const;
// Shared neutral metal and subtle glazing, retained across world rebuilds.
const metal = new THREE.MeshPhongMaterial({ vertexColors: true, specular: '#9daab3', shininess: 48 });
const glazing = new THREE.MeshPhongMaterial({ vertexColors: true, transparent: true, opacity: 0.24, depthWrite: false, side: THREE.DoubleSide, specular: '#c2d5df', shininess: 70 });
function panel(p: P[], outward: P) {
  const v = p.map(([x, y, z]) => new THREE.Vector3(x, y, -z));
  const n = new THREE.Vector3().subVectors(v[1], v[0]).cross(new THREE.Vector3().subVectors(v[2], v[0]));
  const ix = n.dot(new THREE.Vector3(outward[0], outward[1], -outward[2])) > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(ix.flatMap(i => v[i].toArray()), 3));
  g.computeVertexNormals(); return g;
}
export function parkedCar(c: Ctx, id: string, x: number, z: number, color: string) {
  const p = CAR_PROFILES[id as keyof typeof CAR_PROFILES] ?? CAR_PROFILES['car.1'];
  const { L, axle, belt, top, rear, front, rr, rf, rh, wheel: R } = p;
  const bus = p.kind === 'bus', suv = p.kind === 'suv', hatch = p.kind === 'hatch';
  const M = artMats(), { sb, bx, cg } = joinery, a = new Asm(c.b, 'grounds', x, 0, z, 0);
  const trim = '#252d30', body = new THREE.Color(bus ? '#627f80' : color), upper = bus ? '#ded7bd' : body;
  const wy = R + 0.035, arch = R + 0.055, half = bus ? 0.81 : suv ? 0.81 : 0.77;
  const shellHalf = 0.785, outer = 0.856, sill = suv ? 0.44 : 0.34;
  const add = (g: THREE.BufferGeometry, col: THREE.ColorRepresentation, mat: THREE.Material = M.paint) => { a.add(mat, col, g, 0, 0, 0, { shadow: mat !== glazing }); g.dispose(); };
  const line = (v: P, w: P, radius: number, col: THREE.ColorRepresentation, mat: THREE.Material = M.paint) => {
    const start = new THREE.Vector3(v[0], v[1], -v[2]), end = new THREE.Vector3(w[0], w[1], -w[2]);
    const d = end.clone().sub(start), g = new THREE.CylinderGeometry(radius, radius, d.length(), 5);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
    g.translate(...start.add(end).multiplyScalar(0.5).toArray()); add(g, col, mat);
  };
  // Continuous bevelled shell with real wheel openings, not painted discs.
  const s = new THREE.Shape(); s.moveTo(-L / 2, sill);
  const angle = Math.asin((sill - wy) / arch);
  for (const wz of [-axle, axle]) {
    s.lineTo(wz - Math.cos(angle) * arch, sill);
    for (let j = 1; j <= 12; j++) {
      const t = Math.PI - angle - j * (Math.PI - 2 * angle) / 12;
      s.lineTo(wz + Math.cos(t) * arch, wy + Math.sin(t) * arch);
    }
  }
  s.lineTo(L / 2, sill); s.lineTo(L / 2, belt - 0.23);
  s.lineTo(L / 2 - (bus ? 0.06 : 0.17), belt - 0.07);
  s.lineTo(front, belt); s.lineTo(rear, belt); s.lineTo(-L / 2, belt - 0.12); s.closePath();
  const shell = new THREE.ExtrudeGeometry(s, { depth: shellHalf * 2, steps: 1, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.065, bevelSegments: 2, curveSegments: 1 });
  shell.rotateY(Math.PI / 2).translate(-shellHalf, 0, 0); add(shell, body);

  // Paint surrounds -> narrow rubber seals -> open glazing: no solid wall behind windows.
  const patch = (at: (u: number, v: number, off: number) => P, u0: number, u1: number, v0: number, v1: number, col: THREE.ColorRepresentation, normal: P, off = 0, mat: THREE.Material = M.paint) =>
    add(panel([at(u0, v0, off), at(u1, v0, off), at(u1, v1, off), at(u0, v1, off)], normal), col, mat);
  for (const side of [-1, 1]) {
    const normal: P = [side, 0, 0];
    const at = (u: number, v: number, off: number): P => [side * (half + (rh - half) * v + off), belt + (top - belt) * v, (rear + (front - rear) * u) * (1 - v) + (rr + (rf - rr) * u) * v];
    patch(at, 0, 1, 0, 0.09, upper, normal); patch(at, 0, 1, 0.92, 1, upper, normal);
    const divisions = hatch ? [0, 0.38, 1] : bus ? [0, 0.3, 0.64, 1] : [0, 0.27, 0.61, 1];
    for (const u of divisions) patch(at, Math.max(0, u - 0.014), Math.min(1, u + 0.014), 0.09, 0.92, upper, normal);
    for (let j = 0; j < divisions.length - 1; j++) {
      const u0 = divisions[j] + 0.014, u1 = divisions[j + 1] - 0.014;
      patch(at, u0, u1, 0.09, 0.115, trim, normal, 0.001); patch(at, u0, u1, 0.895, 0.92, trim, normal, 0.001);
      patch(at, u0, u0 + 0.008, 0.115, 0.895, trim, normal, 0.001); patch(at, u1 - 0.008, u1, 0.115, 0.895, trim, normal, 0.001);
      patch(at, u0 + 0.008, u1 - 0.008, 0.115, 0.895, '#91adb6', normal, 0, glazing);
      // Glass catches a fine edge highlight, rather than a broad opaque stripe.
      line(at(u0 + 0.01, 0.88, 0.003), at(u1 - 0.01, 0.88, 0.003), 0.004, '#829da6');
    }
    // Complete door outlines, aligned with cabin pillars and clear of wheel arches.
    const joints = hatch ? [front - 0.1, rear + (front - rear) * 0.38] : [front - 0.1, rear + (front - rear) * 0.61, rear + (front - rear) * 0.3];
    for (const pz of joints) {
      const bottom = Math.abs(pz) > axle - arch ? wy + arch + 0.025 : sill + 0.035;
      if (bottom < belt - 0.02) line([side * outer, bottom, pz], [side * outer, belt - 0.015, pz], 0.005, '#28312f');
    }
    line([side * outer, belt - 0.035, rear], [side * outer, belt - 0.035, front], 0.007, body.clone().multiplyScalar(0.68));
    line([side * outer, sill + 0.035, -axle + arch], [side * outer, sill + 0.035, axle - arch], 0.007, '#303a36');
    const handles = hatch ? [front - 0.67] : [front - 0.64, rear + 0.52];
    for (const hz of handles) {
      a.add(M.paint, trim, sb(0.018, 0.055, 0.17, 0.012, 1), side * 0.86, belt - 0.115, hz);
      a.add(metal, '#b8bdbb', bx(0.015, 0.016, 0.11), side * 0.873, belt - 0.106, hz);
    }
    // Wheel lip is a shaped annular strip which follows the opening.
    for (const wz of [-axle, axle]) for (let j = 0; j < 12; j++) {
      const t0 = Math.PI - angle - j * (Math.PI - 2 * angle) / 12, t1 = Math.PI - angle - (j + 1) * (Math.PI - 2 * angle) / 12;
      const ap = (r: number, t: number): P => [side * (outer + 0.002), wy + r * Math.sin(t), wz + r * Math.cos(t)];
      add(panel([ap(arch - 0.002, t0), ap(arch - 0.002, t1), ap(arch + (suv ? 0.075 : 0.035), t1), ap(arch + (suv ? 0.075 : 0.035), t0)], normal), suv ? '#414a47' : body.clone().multiplyScalar(1.12));
    }
    if (bus) a.add(M.paint, upper, bx(0.012, 0.17, L - 0.19), side * 0.858, belt - 0.1, 0);
    if (suv) a.add(M.paint, trim, sb(0.06, 0.11, 1.62, 0.02, 1), side * 0.86, sill + 0.01, 0);
    a.add(M.paint, trim, bx(0.15, 0.035, 0.06), side * 0.83, belt + 0.12, front - 0.17);
    a.add(M.paint, body, sb(0.16, 0.135, 0.25, 0.026, 1), side * 0.915, belt + 0.15, front - 0.17);
    a.add(metal, '#87989b', bx(0.01, 0.09, 0.18), side * 1.001, belt + 0.15, front - 0.17);
  }
  for (const end of [-1, 1]) {
    const b = end > 0 ? front : rear, r = end > 0 ? rf : rr, normal: P = [0, 0.2, end];
    const at = (u: number, v: number, off: number): P => [(u * 2 - 1) * (half + (rh - half) * v), belt + (top - belt) * v, b + (r - b) * v + end * off];
    patch(at, 0, 1, 0, 0.1, upper, normal); patch(at, 0, 1, 0.92, 1, upper, normal);
    patch(at, 0, 0.045, 0.1, 0.92, upper, normal); patch(at, 0.955, 1, 0.1, 0.92, upper, normal);
    patch(at, 0.045, 0.955, 0.1, 0.125, trim, normal, 0.002); patch(at, 0.045, 0.955, 0.895, 0.92, trim, normal, 0.002);
    patch(at, 0.045, 0.058, 0.125, 0.895, trim, normal, 0.002); patch(at, 0.942, 0.955, 0.125, 0.895, trim, normal, 0.002);
    patch(at, 0.058, 0.942, 0.125, 0.895, '#90a9b2', normal, 0, glazing);
    for (const u of end > 0 ? [0.26, 0.67] : [0.52]) line(at(u - 0.1, 0.15, 0.018), at(u + 0.1, 0.19, 0.018), 0.008, trim);
  }
  a.add(M.paint, upper, sb(rh * 2 + 0.055, 0.075, rf - rr + 0.1, 0.035, 2), 0, top + 0.01, (rf + rr) / 2);
  // Dark interior tub hides the lower shell's painted top. Seats and headrests are visible through real glazing.
  a.add(M.paint, '#242b2c', bx(half * 2 - 0.04, 0.025, front - rear - 0.06), 0, belt + 0.014, (front + rear) / 2);
  const seatZ = front - (bus ? 0.7 : 0.85), seatH = (top - belt) * 0.55;
  for (const side of [-1, 1]) {
    a.add(M.paint, '#454644', sb(0.47, seatH, 0.15, 0.045, 2), side * 0.37, belt + seatH / 2 + 0.035, seatZ, { rx: -0.1 });
    a.add(M.paint, '#393b3a', sb(0.28, 0.14, 0.13, 0.035, 2), side * 0.37, belt + seatH + 0.08, seatZ - 0.025);
  }
  a.add(M.paint, '#3d4140', sb(1.2, seatH * 0.9, 0.18, 0.035, 1), 0, belt + seatH * 0.45 + 0.02, rear + 0.4);
  for (const side of [-1, 1]) a.add(M.paint, '#343837', sb(0.26, 0.12, 0.12, 0.025, 1), side * 0.39, belt + seatH + 0.015, rear + 0.4);
  a.add(M.paint, '#242c2e', sb(1.38, 0.13, 0.3, 0.025, 1), 0, belt + 0.035, front - 0.15);
  a.add(M.paint, '#22292b', cg('carsR02Steering', () => new THREE.TorusGeometry(0.15, 0.018, 5, 16).rotateX(-0.6)), -0.4, belt + 0.12, front - 0.43);
  line([-0.55, belt + 0.12, front - 0.43], [-0.25, belt + 0.12, front - 0.43], 0.012, '#353d3e');
  if (suv || p.kind === 'estate') for (const side of [-1, 1]) {
    a.add(M.paint, trim, sb(0.04, 0.045, rf - rr - 0.15, 0.016, 1), side * 0.57, top + 0.095, (rf + rr) / 2);
    for (const rz of [rr + 0.17, rf - 0.17]) a.add(M.paint, trim, bx(0.055, 0.07, 0.08), side * 0.57, top + 0.055, rz);
  }
  // Proper tyre section with shoulders + recessed rim bowl, outer ring, radial tapered spokes and bolt circle.
  const rimR = R * (suv ? 0.6 : bus ? 0.56 : 0.62), tw = suv ? 0.13 : 0.105;
  const tyre = cg(`carsR02Tyre${R}`, () => lathe([[rimR, -tw], [R * 0.88, -tw], [R * 0.98, -tw * 0.65], [R, -tw * 0.35], [R, tw * 0.35], [R * 0.98, tw * 0.65], [R * 0.88, tw], [rimR, tw], [rimR, -tw]], 24).rotateZ(Math.PI / 2));
  const ring = cg(`carsR02Ring${R}`, () => new THREE.TorusGeometry(rimR - 0.012, 0.013, 5, 24).rotateY(Math.PI / 2));
  for (const side of [-1, 1]) for (const wz of [-axle, axle]) {
    const face = side * (0.79 + tw + 0.005);
    a.add(M.paint, '#202528', tyre, side * 0.79, wy, wz);
    a.add(M.paint, '#303a40', cg(`carsR02Bowl${rimR}`, () => new THREE.CylinderGeometry(rimR - 0.012, rimR - 0.012, 0.015, 24).rotateZ(Math.PI / 2)), face - side * 0.016, wy, wz);
    a.add(metal, '#acb6b9', ring, face, wy, wz);
    const count = bus ? 8 : suv ? 6 : hatch ? 6 : 8;
    for (let j = 0; j < count; j++) {
      const t = j * Math.PI * 2 / count;
      const sp = (r: number, dt: number, dx: number): P => [face + side * dx, wy + r * Math.cos(t + dt), wz + r * Math.sin(t + dt)];
      add(panel([sp(rimR * 0.29, -0.2, 0.005), sp(rimR * 0.9, -0.1, 0), sp(rimR * 0.9, 0.1, 0), sp(rimR * 0.29, 0.2, 0.005)], [side, 0, 0]), bus ? '#9da7aa' : '#aeb9bd', metal);
    }
    a.add(metal, '#a2adb0', cg(`carsR02Hub${rimR}`, () => new THREE.CylinderGeometry(rimR * 0.3, rimR * 0.3, 0.024, 16).rotateZ(Math.PI / 2)), face + side * 0.008, wy, wz);
    for (let j = 0; j < 5; j++) {
      const t = j * Math.PI * 2 / 5;
      a.add(M.paint, '#475156', cg('carsR02Bolt', () => new THREE.CylinderGeometry(0.009, 0.009, 0.009, 6).rotateZ(Math.PI / 2)), face + side * 0.023, wy + rimR * 0.18 * Math.cos(t), wz + rimR * 0.18 * Math.sin(t));
    }
  }
  // Bumpers integrate a bright upper strip, rubber face, grille and inset lamp housings.
  for (const end of [-1, 1]) {
    const ez = end * (L / 2 + 0.035), ly = belt - (bus ? 0.27 : 0.24);
    a.add(M.paint, trim, sb(1.77, 0.19, 0.19, 0.035, 2), 0, sill + 0.065, ez);
    a.add(M.paint, '#727d7e', bx(1.64, 0.022, 0.025), 0, sill + 0.115, ez + end * 0.1);
    a.add(M.paint, '#d8bd65', bx(0.44, 0.105, 0.02), 0, sill + 0.22, ez + end * 0.033);
    a.add(M.paint, '#303739', sb(1.58, 0.205, 0.055, 0.018, 1), 0, ly, end * (L / 2 + 0.03));
    for (const side of [-1, 1]) {
      const lampW = end > 0 ? (bus ? 0.29 : 0.34) : (suv ? 0.2 : 0.3);
      a.add(M.paint, end > 0 ? '#dce4df' : '#a73530', sb(lampW, 0.14, 0.025, 0.012, 1), side * 0.58, ly, end * (L / 2 + 0.071));
      a.add(M.paint, '#d19a4b', bx(0.058, 0.14, 0.03), side * 0.765, ly, end * (L / 2 + 0.074));
      if (end < 0) a.add(M.paint, '#d8d7bf', bx(lampW * 0.85, 0.025, 0.012), side * 0.58, ly - 0.01, end * (L / 2 + 0.09));
    }
    if (end > 0) {
      for (let j = 0; j < 6; j++) a.add(M.paint, '#727e80', bx(0.73, 0.01, 0.012), 0, ly - 0.075 + j * 0.03, L / 2 + 0.064);
      a.add(M.paint, trim, bx(0.65, 0.06, 0.02), 0, sill + 0.025, L / 2 + 0.14);
      if (bus) {
        // T3 cues: two-tone high body, broad windscreen, short nose and centred VW badge.
        a.add(M.paint, upper, bx(1.63, 0.12, 0.02), 0, belt - 0.09, L / 2 + 0.026);
        a.add(metal, '#b9c0ba', cg('carsR02VWring', () => new THREE.TorusGeometry(0.065, 0.008, 4, 20)), 0, belt - 0.09, L / 2 + 0.043);
        const bz = L / 2 + 0.05, by = belt - 0.09;
        for (const [v, w] of [[[-0.035, by + 0.04, bz], [0, by - 0.005, bz]], [[0, by - 0.005, bz], [0.035, by + 0.04, bz]], [[-0.045, by + 0.005, bz], [-0.02, by - 0.04, bz]], [[-0.02, by - 0.04, bz], [0, by - 0.012, bz]], [[0, by - 0.012, bz], [0.02, by - 0.04, bz]], [[0.02, by - 0.04, bz], [0.045, by + 0.005, bz]]] as [P, P][]) line(v, w, 0.005, '#c7cfcb', metal);
      }
      // Hood panel gap follows the sloping bonnet surface.
      if (!bus) for (const side of [-1, 1]) line([side * 0.67, belt + 0.026, front + 0.08], [side * 0.67, belt - 0.046, L / 2 - 0.2], 0.005, body.clone().multiplyScalar(0.58));
    } else {
      a.add(M.paint, trim, bx(0.14, 0.025, 0.024), 0, belt - 0.1, -L / 2 - 0.036);
      line([-0.72, belt - 0.02, -L / 2 - 0.027], [0.72, belt - 0.02, -L / 2 - 0.027], 0.005, body.clone().multiplyScalar(0.58));
    }
  }
}
