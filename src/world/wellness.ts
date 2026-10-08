// Wellness deck (v0.2 §3): a dry timber deck X 130–148 / Z 96–115 at terrace height (+0.15) east of the Copacabana
// Room: the barrel sauna (its own raised floor and ramp, see conservatory.ts) and a jacuzzi with its step-out and
// service zone. No evidence here: the A02 sauna board stays the one clue; the jacuzzi is a scene, not a second index.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import { type Ctx, floor } from './arch';
import { box, boxMM, cyl, v3 } from './kit';
import { staticLantern, lounger, joinery } from './furniture';
import { Asm, artMats, lathe } from './artkit';
import { WELLNESS, SAUNA, JACUZZI } from './layout';

export function buildWellness(w: World, c: Ctx) {
  const k = c.k, D = WELLNESS, S = SAUNA, Y = 0.15;
  // deck boards around the sauna footprint (the barrel's cradle stands on the ground)
  for (const [x0, x1, z0, z1] of [[D.x0, D.x1, D.z0, S.z0], [D.x0, D.x1, S.z1, D.z1], [D.x0, S.x0, S.z0, S.z1], [S.x1, D.x1, S.z0, S.z1]] as const) {
    floor(c, x0, x1, z0, z1, Y, k.M.wood, '#a07850', Y + 0.05, true, 1.6);
  }
  boxMM(c.b, k.M.wood, '#7a5a3a', D.x0, D.x1, -0.05, Y - 0.02, D.z1 - 0.12, D.z1, { chunk: c.chunk }); // edge board
  boxMM(c.b, k.M.wood, '#7a5a3a', D.x1 - 0.12, D.x1, -0.05, Y - 0.02, D.z0, D.z1, { chunk: c.chunk });
  // jacuzzi: a raised round-cornered tub (a different shape from the pool), water inside, solid (not enterable)
  const J = JACUZZI, jx = (J.x0 + J.x1) / 2, jz = (J.z0 + J.z1) / 2, jr = (J.x1 - J.x0) / 2;
  cyl(c.b, k.M.wood, '#8a5a33', jx, Y, jz, jr, jr, 0.8, 20, { chunk: c.chunk, uv: 1 });
  cyl(c.b, k.M.paint, '#d8d0c0', jx, Y + 0.8, jz, jr + 0.08, jr + 0.08, 0.06, 20, { chunk: c.chunk });
  w.col.addCircle(jx, jz, jr + 0.08, 0, Y + 0.95);
  const water = new THREE.Mesh(new THREE.CircleGeometry(jr - 0.12, 24), w.material(new THREE.MeshLambertMaterial({ color: '#5fd4e0', transparent: true, opacity: 0.7, emissive: new THREE.Color('#0a3a44') })));
  water.rotation.x = -Math.PI / 2;
  water.position.copy(v3(jx, Y + 0.87, jz));
  water.userData.region = 'outdoor';
  w.scene.add(water);
  w.emitters.push({ kind: 'water', pos: v3(jx, 0.9, jz), on: () => true });
  for (let i = 0; i < 2; i++) boxMM(c.b, k.M.wood, '#7a5232', J.x0 - 0.6 + i * 0.3, J.x0 - 0.3 + i * 0.3, Y, Y + 0.25 + i * 0.25, jz - 0.5, jz + 0.5, { chunk: c.chunk }); // step-out
  w.col.addBox(J.x0 - 0.6, J.x0, jz - 0.5, jz + 0.5, 0, Y + 0.5);
  box(c.b, k.M.paint, '#6a6a62', 146.6, Y, 99.0, 1.0, 0.9, 0.7, { chunk: c.chunk }); // pump/heater box (service zone)
  w.col.addBox(146.1, 147.1, 98.65, 99.35, 0, 1.1);
  // loungers + towels along the north part of the deck, clear of the ramp (X 133.4–134.6) and the jacuzzi step-out
  lounger(c, 139.0, 111.5, Y, 0, '#9aa8d8');
  lounger(c, 140.4, 111.5, Y, 0, '#e0a060');
  lounger(c, 141.8, 111.5, Y, 0, '#6fae9a');
  { const M = artMats(), a = new Asm(c.b, c.chunk, 143.2, Y, 111.6, 0); // teak side table: two glasses and a jug
    a.add(M.timber, '#a8743f', joinery.cg('sideTable', () => lathe([[0.001, 0], [0.22, 0], [0.22, 0.03], [0.05, 0.05], [0.05, 0.45], [0.35, 0.46], [0.35, 0.5], [0.001, 0.5]], 14)), 0, 0, 0);
    for (const [dx, dz] of [[-0.1, 0.06], [0.08, -0.1]] as const) a.add(k.M.glass, '#ffffff', joinery.cg('tumbler', () => new THREE.CylinderGeometry(0.035, 0.03, 0.09, 8)), dx, 0.545, dz);
    a.add(M.ceramic, '#efe9dc', joinery.cg('jug', () => lathe([[0.001, 0], [0.06, 0], [0.075, 0.1], [0.05, 0.18], [0.06, 0.22], [0.001, 0.2]], 12)), 0.1, 0.5, 0.12);
  }
  w.col.addCircle(143.2, 111.6, 0.32, 0, 0.7);
  for (const [x, z] of [[130.6, 96.6], [147.4, 96.6], [147.4, 114.4], [137.0, 114.4]] as const) {
    box(c.b, k.M.wood, '#4a3a2a', x, Y, z, 0.12, 1.6, 0.12, { chunk: c.chunk });
    staticLantern(c, w, x, Y + 1.6, z, 0.6, 0, 3, 7);
    w.col.addCircle(x, z, 0.12, 0, 2);
  }
}
