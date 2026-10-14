// TUT-R01: hand-sized departure props. Local origin is the supporting tabletop;
// all parts use the existing batched art kit. No item IDs, state or lighting here.
import * as THREE from 'three';
import { compound, type Batcher } from './kit';
import { Asm, artMats, lathe } from './artkit';
import { joinery } from './furniture';

const { sb, bx, cg } = joinery;
const C = { green: '#4c6054', leather: '#593b2b', edge: '#302c27', brass: '#be9959', paper: '#e9dfc9', red: '#973f32' };
function assembly(b: Batcher) { return new Asm(b, 'main', 0, 0, 0, 0); }

/** A connected reflector, barrel and tail on ONE horizontal axis. The bezel touches the table. */
export function homeTorch() {
  return compound(b => {
    const a = assembly(b), M = artMats();
    const axis = 0.058;
    a.add(M.paint, C.green, cg('homeTorchShell', () => lathe([
      [0, -0.17], [0.03, -0.17], [0.035, -0.155], [0.035, 0.055],
      [0.042, 0.07], [0.055, 0.11], [0.055, 0.145], [0, 0.145],
    ], 16)), 0, axis, 0, { rx: -Math.PI / 2 });
    // Front points local +plan-z; bands, reflector and lens share the same axis.
    for (const z of [-0.155, -0.12, -0.085, -0.05, -0.015]) {
      a.add(M.paint, C.edge, cg(`homeGrip${z}`, () => new THREE.CylinderGeometry(0.037, 0.037, 0.012, 16)), 0, axis, z, { rx: -Math.PI / 2 });
    }
    a.add(M.brass, C.brass, cg('homeTorchBezel', () => new THREE.TorusGeometry(0.051, 0.007, 6, 20)), 0, axis, 0.143);
    a.add(M.paint, '#a3b5b5', cg('homeTorchReflector', () => new THREE.CylinderGeometry(0.046, 0.032, 0.012, 20)), 0, axis, 0.14, { rx: -Math.PI / 2 });
    a.add(M.ceramic, '#dce7df', cg('homeTorchLens', () => new THREE.CylinderGeometry(0.041, 0.041, 0.003, 20)), 0, axis, 0.148, { rx: -Math.PI / 2 });
    a.add(M.paint, C.edge, sb(0.026, 0.012, 0.05, 0.004), 0, axis + 0.035, 0.025);
    a.add(M.brass, C.brass, sb(0.018, 0.006, 0.022, 0.002), 0, axis + 0.044, 0.035);
    // Tail bumper is flattened at the underside: rests at the same height as the head.
    a.add(M.paint, C.edge, sb(0.075, 0.07, 0.025, 0.009), 0, 0.035, -0.161);
  });
}

/** Sleeve, partly exposed inner tray, abrasive sides and a large match emblem. */
export function homeMatches() {
  return compound(b => {
    const a = assembly(b), M = artMats();
    a.add(M.paint, C.paper, sb(0.145, 0.034, 0.094, 0.004), 0, 0.017, 0);
    a.add(M.paint, '#bba783', bx(0.012, 0.025, 0.082), 0.075, 0.016, 0);
    a.add(M.paint, '#f4ead6', bx(0.009, 0.029, 0.086), 0.08, 0.017, 0);
    for (const z of [-0.048, 0.048]) {
      a.add(M.paint, '#684736', bx(0.128, 0.019, 0.002), 0, 0.017, z);
      for (let x = -0.055; x < 0.06; x += 0.014) a.add(M.paint, '#aa8563', bx(0.003, 0.014, 0.002), x, 0.017, z * 1.025);
    }
    a.add(M.paint, C.red, sb(0.121, 0.002, 0.072, 0.001), 0, 0.035, 0);
    a.add(M.paint, C.paper, bx(0.009, 0.002, 0.041), -0.006, 0.037, -0.003, { ry: -0.55 });
    a.add(M.paint, '#edba61', cg('homeMatchHead', () => new THREE.SphereGeometry(0.011, 10, 6).scale(1, 0.22, 1)), 0.007, 0.039, 0.017);
    // A simple cream border keeps the label legible without tiny typography or a new puzzle symbol.
    for (const z of [-0.031, 0.031]) a.add(M.paint, C.paper, bx(0.108, 0.001, 0.002), 0, 0.037, z);
  });
}

export function homeNotebook() {
  return compound(b => {
    const a = assembly(b), M = artMats();
    a.add(M.paint, C.green, sb(0.205, 0.008, 0.265, 0.003), 0, 0.004, 0);
    a.add(M.paint, C.paper, sb(0.189, 0.025, 0.249, 0.003), 0.003, 0.02, 0);
    a.add(M.paint, C.green, sb(0.205, 0.008, 0.265, 0.003), 0, 0.0365, 0);
    a.add(M.paint, C.leather, sb(0.018, 0.041, 0.265, 0.006), -0.096, 0.0205, 0);
    for (const y of [0.014, 0.022, 0.029]) a.add(M.paint, '#c3b69d', bx(0.001, 0.001, 0.235), 0.098, y, 0);
    a.add(M.paint, C.edge, bx(0.012, 0.002, 0.267), 0.068, 0.042, 0);
    a.add(M.paint, C.paper, sb(0.115, 0.002, 0.064, 0.001), -0.009, 0.042, 0.024);
    for (const z of [0.015, 0.03]) a.add(M.paint, '#8e927f', bx(0.078, 0.001, 0.002), -0.009, 0.0435, z);
    a.add(M.paint, C.red, bx(0.014, 0.003, 0.04), 0.028, 0.009, -0.137); // bookmark protrudes from pages
  });
}

export function homeInvitation() {
  return compound(b => {
    const a = assembly(b), M = artMats();
    a.add(M.paint, C.paper, sb(0.27, 0.009, 0.19, 0.003), 0, 0.0045, 0);
    // Folded envelope flap: actual triangle lying on the paper, no symbol-bearing texture.
    const flap = new THREE.BufferGeometry();
    flap.setAttribute('position', new THREE.Float32BufferAttribute([-0.132, 0, -0.09, 0.132, 0, -0.09, 0, 0, 0.018], 3));
    flap.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2));
    flap.computeVertexNormals();
    // Reverse winding: the visible side faces up.
    flap.setIndex([0, 2, 1]); flap.computeVertexNormals();
    a.add(M.paint, '#f5ecd7', flap, 0, 0.01, 0); flap.dispose();
    a.add(M.paint, C.red, cg('homeSeal', () => lathe([[0, 0], [0.026, 0], [0.03, 0.003], [0.027, 0.008], [0, 0.008]], 12)), 0, 0.011, 0.012);
    a.add(M.paint, '#b25a42', cg('homeSealRim', () => new THREE.TorusGeometry(0.019, 0.002, 4, 14).rotateX(Math.PI / 2)), 0, 0.019, 0.012);
  });
}

/** A compact canvas travel case with leather straps, two clasps and an open grip. Decor only. */
export function homeTravelCase() {
  return compound(b => {
    const a = assembly(b), M = artMats();
    a.add(M.paint, C.green, sb(0.41, 0.245, 0.21, 0.025, 2), 0, 0.1325, 0);
    a.add(M.paint, C.leather, sb(0.415, 0.018, 0.215, 0.006), 0, 0.203, 0);
    for (const x of [-0.135, 0.135]) {
      a.add(M.paint, C.leather, sb(0.036, 0.25, 0.217, 0.01), x, 0.132, 0);
      a.add(M.brass, C.brass, sb(0.045, 0.037, 0.009, 0.003), x, 0.188, 0.114);
      a.add(M.paint, C.edge, bx(0.022, 0.015, 0.011), x, 0.188, 0.12);
      a.add(M.paint, C.edge, sb(0.045, 0.012, 0.14, 0.005), x, 0.006, 0);
    }
    for (const x of [-0.067, 0.067]) {
      a.add(M.brass, C.brass, sb(0.028, 0.008, 0.055, 0.003), x, 0.258, 0);
      a.add(M.paint, C.leather, sb(0.019, 0.041, 0.025, 0.006), x, 0.278, 0);
    }
    a.add(M.paint, C.leather, sb(0.15, 0.025, 0.03, 0.01, 2), 0, 0.303, 0);
    // Unlettered luggage tag: a travel cue, never a clue or an implied pickup.
    a.add(M.paint, C.paper, sb(0.045, 0.066, 0.004, 0.002), 0.033, 0.219, 0.112, { rz: -0.18 });
  });
}
