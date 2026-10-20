// GRASS-R01: isolated morphology study. Not imported by production world builders.
// Four procedural, non-indexed, opaque, double-sided blade clumps; compatible with PlantBatch / makeVegBatch.
// Intentional: no wind, no new shader, no textures, and no estate-wide integration.
import * as THREE from 'three';
import { twoSided } from '../world/woodkit';
import { mulberry32 } from '../core/rng';

export type GrassR01Profile = 'meadow' | 'woodland';
export const GRASS_R01_NAMES = [
  'Medium lush meadow',
  'Tall wild grass',
  'Short ground grass',
  'Directional woodland grass',
] as const;

interface Form {
  blades: number;
  height: number;
  spread: number;
  halfWidth: number;
  lean: number;
  droop: number;
  bias: number;
}
const FORMS: readonly Form[] = [
  { blades: 15, height: 0.52, spread: 0.105, halfWidth: 0.032, lean: 0.22, droop: 0.07, bias: 0.0 },
  { blades: 13, height: 0.76, spread: 0.115, halfWidth: 0.027, lean: 0.31, droop: 0.11, bias: 0.20 },
  { blades: 12, height: 0.29, spread: 0.11, halfWidth: 0.028, lean: 0.145, droop: 0.055, bias: 0.0 },
  { blades: 13, height: 0.57, spread: 0.14, halfWidth: 0.037, lean: 0.37, droop: 0.21, bias: 0.85 },
];
const PALETTES: Record<GrassR01Profile, [string, string, string]> = {
  meadow: ['#345e3e', '#639c53', '#b1c875'],
  woodland: ['#665c37', '#a2874a', '#d5bb79'],
};
const UP = new THREE.Vector3(0, 1, 0);

/**
 * A real 3D curved ribbon with two folds across its width, rather than camera-facing alpha cards.
 * Root at local y=0. Dimensions are metres. Each form is reproducible from one stable seed.
 * Instance yaw/scale and patch colour are deliberately owned by the existing vegetation planner.
 * Compared with referencePlantModel(grass), this prototype adds fuller blade shoulders, a curved
 * apex, crown layers, asymmetrical foot placement and a controlled side-to-side bend.
 */
export function grassR01Model(variant: number, profile: GrassR01Profile = 'meadow'): THREE.BufferGeometry {
  const v = ((Math.floor(variant) % 4) + 4) % 4;
  const form = FORMS[v];
  const rand = mulberry32(61071 + v * 131);
  const palette = PALETTES[profile];
  const baseColor = new THREE.Color(palette[0]);
  const bodyColor = new THREE.Color(palette[1]);
  const tipColor = new THREE.Color(palette[2]);
  const positions: number[] = [];
  const colors: number[] = [];

  const vertex = (point: THREE.Vector3, color: THREE.Color) => {
    positions.push(point.x, point.y, point.z);
    colors.push(color.r, color.g, color.b);
  };
  const triangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, ca: THREE.Color, cb: THREE.Color, cc: THREE.Color) => {
    vertex(a, ca); vertex(b, cb); vertex(c, cc);
  };
  const quad = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, c0: THREE.Color, c1: THREE.Color) => {
    triangle(a, b, c, c0, c0, c1);
    triangle(a, c, d, c0, c1, c1);
  };
  const shade = (u: number, tone: number) => {
    // Cool/dark rooted blades, coherent body colour, warm sunlit tips.
    const t = THREE.MathUtils.smoothstep(u, 0.03, 0.95);
    const out = u < 0.4
      ? baseColor.clone().lerp(bodyColor, THREE.MathUtils.smoothstep(u, 0, 0.48))
      : bodyColor.clone().lerp(tipColor, THREE.MathUtils.smoothstep(t, 0.28, 1) * 0.85);
    return out.multiplyScalar(tone);
  };

  for (let i = 0; i < form.blades; i++) {
    const angle = i * 2.399963229728653 + (rand() - 0.5) * 0.85;
    const layer = (i % 5 === 0) ? 0.40 : (i % 3 === 0) ? 0.73 : 1;
    const h = form.height * (0.72 + rand() * 0.45) * (layer === 0.40 ? 0.84 : 1);
    const width = form.halfWidth * (0.78 + rand() * 0.48);
    const lean = form.lean * (0.60 + rand() * 0.73) * layer;
    const droop = form.droop * (0.73 + rand() * 0.47);
    const radius = form.spread * Math.sqrt(rand());
    const drift = (rand() - 0.5) * 0.07;
    const tone = 0.91 + rand() * 0.13; // never independently random RGB values
    const sway = (rand() - 0.5) * 0.09;
    const heading = angle * (1 - form.bias) + form.bias * (Math.PI * 0.35 + angle * 0.2);
    const direction = new THREE.Vector3(Math.cos(heading), 0, Math.sin(heading));
    const tangent = new THREE.Vector3(-direction.z, 0, direction.x);
    const root = new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    const sample = (u: number, edge: -1 | 0 | 1): THREE.Vector3 => {
      // Broad shoulders; no stiff linear spike from root to tip.
      const shoulder = (0.4 + 0.6 * Math.sin(Math.PI * Math.pow(u, 0.75))) * Math.pow(1 - u, 0.75);
      const sideBend = sway * Math.sin(u * Math.PI) * u + drift * u * u;
      const midrib = edge === 0 ? width * 0.22 * Math.sin(u * Math.PI) : 0;
      return root.clone()
        .addScaledVector(direction, lean * (0.13 * u + 0.87 * u * u))
        .addScaledVector(tangent, sideBend + edge * width * shoulder)
        .addScaledVector(UP, h * (u - droop * u * u * u) + midrib);
    };

    const segments = 4; // authored curve, capped triangle cost
    for (let s = 0; s < segments; s++) {
      const u = s / segments;
      const z = (s + 1) / segments;
      const start = shade(u, tone), end = shade(z, tone);
      // Raised midrib gives the blade a modest sculpted normal break (opaque geometry).
      quad(sample(u, -1), sample(u, 0), sample(z, 0), sample(z, -1), start, end);
      quad(sample(u, 0), sample(u, 1), sample(z, 1), sample(z, 0), start, end);
    }
  }

  const front = new THREE.BufferGeometry();
  front.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  front.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  front.computeVertexNormals();
  // Exactly the existing foliage contract: up-biased normals, duplicate reverse-facing
  // triangles with the same normals to work with the project's FrontSide material.
  const normals = front.getAttribute('normal') as THREE.BufferAttribute;
  const n = new THREE.Vector3();
  for (let i = 0; i < normals.count; i++) {
    n.fromBufferAttribute(normals, i);
    if (n.y < 0) n.negate();
    n.lerp(UP, 0.47).normalize();
    normals.setXYZ(i, n.x, n.y, n.z);
  }
  const both = twoSided(front);
  both.computeBoundingBox();
  both.computeBoundingSphere();
  both.userData.grassR01 = { variant: v, profile, blades: form.blades, triangles: both.getAttribute('position').count / 3 };
  return both;
}
