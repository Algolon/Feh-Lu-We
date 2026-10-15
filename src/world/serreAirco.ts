// Optional scene detail: a condenser outside the south facade of the Copacabana Room.
// Deliberately independent of clues, saves and puzzle progression.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { makeAction } from '../interactions/props';
import { Batcher, blob, box, geo, getKit, v3 } from './kit';
import { CONS } from './layout';
import { terrainHeight } from './terrain';

/** Along the south glazing, tucked against the service-wing corner; clear of the glass and pool. */
export const SERRE_AIRCO = { x: CONS.x0 + 1.45, z: CONS.z0 - 1.12, width: 2.06, depth: 0.80, height: 1.10 } as const;

export function buildSerreAirco(w: World, g: GameApi) {
  const k = getKit(), b = new Batcher();
  const X = SERRE_AIRCO.x, Z = SERRE_AIRCO.z, Y = terrainHeight(X, Z);
  // Everything is local to one cullable object. Helpers use plan coordinates (Z reverses in Three.js).
  const root = new THREE.Group();
  root.name = 'serre-airco-met-kever';
  root.position.copy(v3(X, Y, Z));
  root.userData.rooms = ['out', 'cons']; // visible outside and through the greenhouse glazing
  root.userData.cullDist = 36;

  const metal = k.M.paint;
  // Feet, slightly softened casing and a stepped top lip: chunky silhouettes rather than a photoreal texture.
  for (const x of [-0.81, 0.81]) for (const z of [-0.27, 0.27])
    box(b, metal, '#555950', x, 0.025, z, 0.20, 0.14, 0.19);
  box(b, metal, '#9da39b', 0, 0.17, 0, 2.02, 0.88, 0.77);
  box(b, metal, '#c4c7ba', 0, 0.99, 0, 2.06, 0.105, 0.82);
  box(b, metal, '#d4d1c3', 0, 1.065, -0.015, 2.08, 0.028, 0.84);
  box(b, metal, '#bcc0b5', 0, 0.20, -0.392, 1.94, 0.78, 0.023);
  // Housing rim, fan inset and two distinctly readable side panels.
  box(b, metal, '#787f76', -0.52, 0.28, -0.414, 0.83, 0.75, 0.018);
  box(b, metal, '#c7c9ba', 0.48, 0.25, -0.416, 0.89, 0.75, 0.025);
  box(b, metal, '#858c82', 0.005, 0.23, -0.445, 0.018, 0.77, 0.014);
  box(b, metal, '#777f77', 0, 0.17, -0.43, 1.99, 0.035, 0.026);
  for (let i = 0; i < 7; i++) {
    box(b, metal, '#69756f', 0.49, 0.33 + i * 0.089, -0.443, 0.70, 0.017, 0.012);
    box(b, metal, '#d8d6c9', 0.49, 0.348 + i * 0.089, -0.442, 0.70, 0.008, 0.014);
  }
  // Ventilation slots on the left return (seen when walking around the casing).
  for (let i = 0; i < 5; i++)
    box(b, metal, '#56605c', -1.016, 0.39 + i * 0.102, -0.035, 0.018, 0.028, 0.55);

  const disc = new THREE.CircleGeometry(0.344, 24);
  geo(b, metal, '#242e2c', disc, -0.52, 0.655, -0.436);
  disc.dispose();
  // Five simple fan blades, behind an angular protective grille.
  const vane = new THREE.Shape();
  vane.moveTo(0.025, -0.018);
  vane.lineTo(0.065, 0.048);
  vane.quadraticCurveTo(0.245, 0.17, 0.283, 0.058);
  vane.lineTo(0.135, -0.063);
  vane.closePath();
  const blade = new THREE.ShapeGeometry(vane, 4);
  for (let i = 0; i < 5; i++)
    geo(b, metal, i % 2 ? '#495651' : '#424d48', blade, -0.52, 0.655, -0.447, { rz: i * Math.PI * 2 / 5 });
  blade.dispose();
  const fanRing = new THREE.RingGeometry(0.323, 0.35, 28);
  geo(b, metal, '#737f78', fanRing, -0.52, 0.655, -0.456);
  fanRing.dispose();
  for (let i = 0; i < 4; i++)
    box(b, metal, '#8c9389', -0.52, 0.337, -0.461, 0.014, 0.634, 0.014, { rz: i * Math.PI / 4 });
  const hub = new THREE.CircleGeometry(0.064, 12);
  geo(b, metal, '#56645e', hub, -0.52, 0.655, -0.465);
  hub.dispose();
  // Restrained wear: a tiny label and a few uneven seams, not noisy all-over grime.
  box(b, metal, '#686e65', -0.89, 0.905, -0.458, 0.17, 0.075, 0.012);
  box(b, metal, '#bbb4a6', -0.89, 0.918, -0.467, 0.125, 0.027, 0.010);

  // A fallen beetle, belly up. All six bent legs are in the air; no live insect animation.
  const bx = 0.25, bz = 0.02;
  blob(b, metal, '#38271f', bx, 1.126, bz, 0.118, 0.052, 0.075);
  blob(b, metal, '#98764c', bx, 1.156, bz, 0.086, 0.031, 0.061);
  blob(b, metal, '#453125', bx + 0.117, 1.137, bz, 0.046, 0.040, 0.049);
  const rod = new THREE.CylinderGeometry(0.009, 0.011, 1, 5);
  const pipe = (a: THREE.Vector3, c: THREE.Vector3, tint: string) => {
    const delta = c.clone().sub(a), mid = a.clone().add(c).multiplyScalar(0.5);
    const rot = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
    const transform = new THREE.Matrix4().compose(mid, rot, new THREE.Vector3(1, delta.length(), 1));
    b.add(metal, rod, transform, tint, 'airco', false, 0);
  };
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x = bx - 0.068 + 0.067 * i;
    const a = new THREE.Vector3(x, 1.158, -(bz + side * 0.050));
    const knee = new THREE.Vector3(x - 0.024 + i * 0.024, 1.25 + 0.012 * i, -(bz + side * 0.112));
    const tip = new THREE.Vector3(x - 0.043 + i * 0.036, 1.284 - 0.012 * i, -(bz + side * 0.157));
    pipe(a, knee, '#302219');
    pipe(knee, tip, '#3e3025');
  }
  for (const side of [-1, 1])
    pipe(new THREE.Vector3(bx + 0.145, 1.153, -(bz + side * 0.018)),
      new THREE.Vector3(bx + 0.19, 1.198, -(bz + side * 0.061)), '#39271d');
  rod.dispose();
  // A dark singe beneath the body leaves the cause legible, even with reduced motion.
  const scorch = new THREE.CircleGeometry(0.15, 14);
  scorch.rotateX(-Math.PI / 2);
  geo(b, metal, '#4f4a3d', scorch, bx, 1.099, bz);
  scorch.dispose();

  b.build(root, false);
  // Tiny, occasional cool sparks: no particle emitter or continuously running lights.
  const sparkPositions = new Float32Array([
    bx + 0.07, 1.30, -(bz - 0.08), bx + 0.105, 1.35, -(bz - 0.07),
    bx + 0.105, 1.35, -(bz - 0.07), bx + 0.075, 1.37, -(bz - 0.04),
    bx - 0.09, 1.27, -(bz + 0.08), bx - 0.13, 1.32, -(bz + 0.055),
    bx - 0.13, 1.32, -(bz + 0.055), bx - 0.10, 1.34, -(bz + 0.035),
  ]);
  const sparksGeo = new THREE.BufferGeometry();
  sparksGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  const sparks = new THREE.LineSegments(sparksGeo, w.material(new THREE.LineBasicMaterial({ color: '#b5f2ed' })));
  root.add(sparks);
  w.onUpdate((_dt, t) => { sparks.visible = w.reducedMotion || (t % 4.2 < 0.25); });
  w.scene.add(root);

  // A large touch target includes the beetle on top. Inspection is optional and never writes to save state.
  const collider = w.col.addBox(X - 1.02, X + 1.02, Z - 0.41, Z + 0.41, Y, Y + 1.10, { occludes: false, tag: 'serre.airco' });
  void collider;
  makeAction(w, {
    id: 'inspect.serreAircoBeetle', obj: root, hit: [2.08, 1.35, 0.88],
    hitOffset: [0, 0.67, 0], reach: 2.8,
    label: () => 'Bekijken: airco en kever',
    run: () => g.act({
      ok: true,
      msg: 'Boven op de airco ligt een kevertje op zijn rug, de pootjes verkrampt omhoog. Een blauw vonkje knettert naast zijn verschroeide schild. Geëlektrocuteerd. De spanning was hem duidelijk te veel.',
      sfx: 'none',
    }, { save: false }),
  });
}
