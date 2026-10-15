// Optional scene detail: a condenser outside the south facade of the Copacabana Room.
// Deliberately independent of clues, saves and puzzle progression.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { makeAction } from '../interactions/props';
import { Batcher, blob, box, geo, getKit, v3 } from './kit';
import { CONS } from './layout';
import { terrainHeight } from './terrain';

/** Along the south glazing, tucked against the service-wing corner; clear of the glass and pool. */
export const SERRE_AIRCO = { x: CONS.x0 + 1.95, z: CONS.z0 - 1.00, width: 2.06, depth: 0.80, height: 1.10 } as const;

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
  // Angular, low/mid-poly casing. Keep broad colour shapes, but give the metal shell readable construction seams.
  for (const x of [-0.81, 0.81]) for (const z of [-0.27, 0.27])
    box(b, metal, '#555950', x, 0.025, z, 0.20, 0.14, 0.19);
  box(b, metal, '#9da39b', 0, 0.17, 0, 2.02, 0.88, 0.77);
  box(b, metal, '#c4c7ba', 0, 0.99, 0, 2.06, 0.105, 0.82);
  box(b, metal, '#d4d1c3', 0, 1.065, -0.015, 2.08, 0.028, 0.84);
  box(b, metal, '#bcc0b5', 0, 0.20, -0.392, 1.94, 0.78, 0.023);
  // Folded lip, panel joins and positive corner edges; all static details batch into the housing.
  for (const x of [-0.985, 0.985]) {
    box(b, metal, '#8b9389', x, 0.17, -0.443, 0.021, 0.82, 0.028);
    box(b, metal, '#737d73', x, 0.94, 0, 0.026, 0.035, 0.76);
  }
  box(b, metal, '#6b746b', 0, 0.925, -0.422, 1.95, 0.014, 0.023);
  box(b, metal, '#e2decf', 0, 1.092, -0.385, 1.96, 0.014, 0.022);
  // Stiffener/foot rails keep the unit visually grounded rather than perched on four cubes.
  for (const x of [-0.81, 0.81]) {
    box(b, metal, '#5e655d', x, 0.018, 0, 0.24, 0.045, 0.68);
    box(b, metal, '#8d9185', x, 0.063, -0.27, 0.15, 0.025, 0.09);
  }
  // Housing rim, fan inset and two distinctly readable side panels.
  box(b, metal, '#787f76', -0.52, 0.28, -0.414, 0.83, 0.75, 0.018);
  box(b, metal, '#c7c9ba', 0.48, 0.25, -0.416, 0.89, 0.75, 0.025);
  box(b, metal, '#858c82', 0.005, 0.23, -0.445, 0.018, 0.77, 0.014);
  box(b, metal, '#777f77', 0, 0.17, -0.43, 1.99, 0.035, 0.026);
  for (let i = 0; i < 7; i++) {
    box(b, metal, '#69756f', 0.49, 0.33 + i * 0.089, -0.443, 0.70, 0.017, 0.012);
    box(b, metal, '#d8d6c9', 0.49, 0.348 + i * 0.089, -0.442, 0.70, 0.008, 0.014);
  }
  // Ventilation slots on a shaded recessed panel of the left return.
  box(b, metal, '#636b63', -1.026, 0.35, -0.025, 0.018, 0.63, 0.62);
  for (let i = 0; i < 5; i++)
    box(b, metal, '#303b38', -1.042, 0.39 + i * 0.102, -0.035, 0.013, 0.034, 0.52);

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
  const fanRing = new THREE.RingGeometry(0.316, 0.365, 24);
  geo(b, metal, '#737f78', fanRing, -0.52, 0.655, -0.456);
  fanRing.dispose();
  for (let i = 0; i < 4; i++)
    box(b, metal, '#8c9389', -0.52, 0.337, -0.461, 0.014, 0.634, 0.014, { rz: i * Math.PI / 4 });
  const hub = new THREE.CircleGeometry(0.064, 12);
  geo(b, metal, '#56645e', hub, -0.52, 0.655, -0.465);
  hub.dispose();
  // Square external fan frame and four rivet heads reinforce the engineered silhouette.
  for (const y of [0.285, 1.025])
    box(b, metal, '#8a958b', -0.52, y, -0.464, 0.79, 0.022, 0.024);
  for (const x of [-0.905, -0.135])
    box(b, metal, '#8a958b', x, 0.285, -0.464, 0.022, 0.76, 0.024);
  for (const x of [-0.885, -0.155]) for (const y of [0.317, 0.98])
    box(b, metal, '#d7d4c7', x, y, -0.483, 0.028, 0.028, 0.011);
  // Restrained wear: a tiny label and a few uneven seams, not noisy all-over grime.
  box(b, metal, '#686e65', -0.89, 0.905, -0.458, 0.17, 0.075, 0.012);
  box(b, metal, '#bbb4a6', -0.89, 0.918, -0.467, 0.125, 0.027, 0.010);

  // Two exterior service lines connect the right return to the lower facade rail.
  // The glass plane is at local plan Z = +1.00; pipe ends and mounting plate stop short of it.
  const serviceLines: { radius: number; tone: string; points: [number, number, number][] }[] = [
    { radius: 0.053, tone: '#535d55', points: [
      [0.99, 0.67, 0.14], [1.11, 0.67, 0.35], [1.13, 0.72, 0.58], [1.13, 0.62, 0.85],
    ] },
    { radius: 0.027, tone: '#b9b5a5', points: [
      [0.99, 0.43, 0.10], [1.20, 0.43, 0.34], [1.22, 0.48, 0.58], [1.22, 0.52, 0.85],
    ] },
  ];
  for (const line of serviceLines) {
    const path = new THREE.CatmullRomCurve3(line.points.map(([x, y, z]) => v3(x, y, z)), false, 'centripetal');
    const tube = new THREE.TubeGeometry(path, 12, line.radius, 6, false);
    b.add(metal, tube, new THREE.Matrix4(), line.tone, 'airco', false, 0);
    tube.dispose();
  }
  // Small stand-offs and clamps, including a termination plate just south of the glazing.
  box(b, metal, '#626d66', 1.175, 0.49, 0.915, 0.27, 0.31, 0.052);
  for (const [x, y] of [[1.13, 0.62], [1.22, 0.52]] as const) {
    box(b, metal, '#d0c9b6', x, y, 0.875, 0.105, 0.08, 0.055);
    box(b, metal, '#46534e', x, y - 0.067, 0.58, 0.125, 0.027, 0.09);
    box(b, metal, '#aab0a4', x, y - 0.049, 0.58, 0.039, 0.025, 0.085);
  }

  // A fallen beetle, belly up. All six bent legs are in the air; no live insect animation.
  // Scale all features around the top plate anchor, including the legs and antennae.
  const beetleScale = 0.80, beetleTop = 1.10;
  const bp = (x: number, y: number, z: number) =>
    new THREE.Vector3(bx + (x - bx) * beetleScale, beetleTop + (y - beetleTop) * beetleScale, -(bz + (z - bz) * beetleScale));
  const beetleBlob = (tone: string, x: number, y: number, z: number, rx: number, ry: number, rz: number) => {
    blob(b, metal, tone, bx + (x - bx) * beetleScale, beetleTop + (y - beetleTop) * beetleScale,
      bz + (z - bz) * beetleScale, rx * beetleScale, ry * beetleScale, rz * beetleScale);
  };
  const bx = 0.25, bz = 0.02;
  beetleBlob('#38271f', bx, 1.126, bz, 0.118, 0.052, 0.075);
  beetleBlob('#98764c', bx, 1.156, bz, 0.086, 0.031, 0.061);
  beetleBlob('#453125', bx + 0.117, 1.137, bz, 0.046, 0.040, 0.049);
  const rod = new THREE.CylinderGeometry(0.0072, 0.0088, 1, 5);
  const pipe = (a: THREE.Vector3, c: THREE.Vector3, tint: string) => {
    const delta = c.clone().sub(a), mid = a.clone().add(c).multiplyScalar(0.5);
    const rot = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
    const transform = new THREE.Matrix4().compose(mid, rot, new THREE.Vector3(1, delta.length(), 1));
    b.add(metal, rod, transform, tint, 'airco', false, 0);
  };
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x = bx - 0.068 + 0.067 * i;
    const a = bp(x, 1.158, bz + side * 0.050);
    const knee = bp(x - 0.024 + i * 0.024, 1.25 + 0.012 * i, bz + side * 0.112);
    const tip = bp(x - 0.043 + i * 0.036, 1.284 - 0.012 * i, bz + side * 0.157);
    pipe(a, knee, '#302219');
    pipe(knee, tip, '#3e3025');
  }
  for (const side of [-1, 1])
    pipe(bp(bx + 0.145, 1.153, bz + side * 0.018),
      bp(bx + 0.19, 1.198, bz + side * 0.061), '#39271d');
  rod.dispose();
  // A dark singe beneath the body leaves the cause legible, even with reduced motion.
  const scorch = new THREE.CircleGeometry(0.12, 12);
  scorch.rotateX(-Math.PI / 2);
  geo(b, metal, '#4f4a3d', scorch, bx, 1.099, bz);
  scorch.dispose();

  b.build(root, false);
  // Three recognisable little lightning zigzags instead of disconnected straight strokes.
  // A single batched line geometry with alternating icy white and cyan sections.
  const arcs: [number, number, number][][] = [
    [[bx - 0.080, 1.256, bz - 0.105], [bx - 0.104, 1.304, bz - 0.105],
     [bx - 0.060, 1.302, bz - 0.105], [bx - 0.086, 1.360, bz - 0.105]],
    [[bx + 0.095, 1.272, bz - 0.080], [bx + 0.056, 1.317, bz - 0.080],
     [bx + 0.109, 1.326, bz - 0.080], [bx + 0.081, 1.381, bz - 0.080]],
    [[bx + 0.006, 1.284, bz + 0.090], [bx - 0.026, 1.330, bz + 0.090],
     [bx + 0.025, 1.337, bz + 0.090], [bx - 0.004, 1.384, bz + 0.090]],
  ];
  const sparkVertices: number[] = [], sparkColors: number[] = [];
  const ice = new THREE.Color('#e0fffa'), cyan = new THREE.Color('#53c9de');
  arcs.forEach((arc, a) => {
    for (let i = 0; i < arc.length - 1; i++) {
      for (const p of [arc[i], arc[i + 1]]) {
        const v = bp(...p);
        sparkVertices.push(v.x, v.y, v.z);
        const tint = (i + a) % 2 ? cyan : ice;
        sparkColors.push(tint.r, tint.g, tint.b);
      }
    }
  });
  const sparksGeo = new THREE.BufferGeometry();
  sparksGeo.setAttribute('position', new THREE.Float32BufferAttribute(sparkVertices, 3));
  sparksGeo.setAttribute('color', new THREE.Float32BufferAttribute(sparkColors, 3));
  const sparks = new THREE.LineSegments(sparksGeo,
    w.material(new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.94 })));
  root.add(sparks);
  // Brief clustered pulses; reduced-motion mode presents a static readable lightning mark.
  w.onUpdate((_dt, t) => {
    const phase = t % 2.5;
    sparks.visible = w.reducedMotion || (phase < 0.22 || (phase > 0.34 && phase < 0.48));
  });
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
