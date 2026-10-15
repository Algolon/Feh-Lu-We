// Decorative emmer-fles gravity bong for the social garden. No gameplay, smoking or physics state.
// Static, low/mid-poly pieces join the existing grounds batch (no independent mesh per detail).
import * as THREE from 'three';
import type { Ctx } from './arch';
import { Asm, artMats, lathe } from './artkit';

const GEOMETRIES = new Map<string, THREE.BufferGeometry>();
function geo(key: string, create: () => THREE.BufferGeometry) {
  let g = GEOMETRIES.get(key);
  if (!g) {
    g = create();
    g.userData.shared = true;
    GEOMETRIES.set(key, g);
  }
  return g;
}
const ring = (radius: number, tube: number, name: string) =>
  geo(name, () => new THREE.TorusGeometry(radius, tube, 5, 18).rotateX(Math.PI / 2));
const bar = (w: number, h: number, d: number, name: string) =>
  geo(name, () => new THREE.BoxGeometry(w, h, d));

/**
 * Sits directly on the existing low table (top GF + 0.4), in the original prop's footprint.
 * Key silhouette from the walking camera: OPEN bucket, water surface, recognisable clear PET
 * bottle rising above the rim, and a small metal bowl with an inset screen on its neck.
 * Deliberately inspired by the clean detailing of the reference, not its proprietary logo
 * or complicated commercial stand; this remains a traditional bucket-and-bottle prop.
 */
export function buildGravityBong(c: Ctx, x: number, tabletopY: number, z: number) {
  const a = new Asm(c.b, c.chunk, x, tabletopY, z, 0.3);
  const M = artMats();

  // One open-walled, slightly tapered plastic bucket: inner wall turns downward after
  // the rolled lip. Unlike the old model, there is NO solid lid hiding the bottle.
  a.add(M.paint, '#347995', geo('gb_bucket_open', () => lathe([
    [0.001, 0.006], [0.137, 0.006], [0.148, 0.018], [0.157, 0.049],
    [0.172, 0.295], [0.181, 0.354], [0.189, 0.369],
    [0.182, 0.382], [0.168, 0.377], [0.162, 0.349],
    [0.145, 0.086], [0.135, 0.041], [0.001, 0.041],
  ], 16)), 0, 0, 0);
  a.add(M.ceramic, '#1e5066', ring(0.183, 0.008, 'gb_rolled_lip'), 0, 0.375, 0);
  a.add(M.paint, '#23566c', ring(0.151, 0.006, 'gb_foot'), 0, 0.020, 0);
  // Two moulded handle mounts and a slim raised, dark carrying handle at the back.
  for (const s of [-1, 1]) {
    a.add(M.paint, '#214d61', geo('gb_handle_mount', () => new THREE.CylinderGeometry(0.025, 0.025, 0.020, 10).rotateZ(Math.PI / 2)), s * 0.183, 0.300, 0);
    a.add(M.ceramic, '#9daca9', geo('gb_handle_pin', () => new THREE.CylinderGeometry(0.011, 0.011, 0.024, 8).rotateZ(Math.PI / 2)), s * 0.196, 0.300, 0);
  }
  a.add(M.ceramic, '#4a5d62', geo('gb_carry_handle', () => new THREE.TorusGeometry(0.196, 0.006, 5, 18, Math.PI)), 0, 0.300, 0.048);

  // Visible water plane below the open rim; subdued concentric ripples.
  a.add(M.ceramic, '#72b9c6', geo('gb_water', () => new THREE.CircleGeometry(0.156, 18).rotateX(-Math.PI / 2)), 0, 0.288, 0, { shadow: false });
  a.add(M.ceramic, '#a1d7d8', ring(0.118, 0.0028, 'gb_water_ripple'), 0, 0.290, 0, { shadow: false });

  // Clear PET bottle, partly submerged. Its cut bottom is open; shoulder slopes to
  // a narrowed neck and retains a small bead under the improvised metal top.
  a.add(c.k.M.glass, '#e5f7f3', geo('gb_pet_open', () => lathe([
    [0.093, 0.125], [0.101, 0.155], [0.106, 0.192],
    [0.106, 0.470], [0.104, 0.533], [0.095, 0.589],
    [0.066, 0.643], [0.033, 0.679], [0.029, 0.697],
    [0.029, 0.716], [0.034, 0.720],
  ], 18)), 0, 0, 0, { shadow: false });
  // Deliberate strong highlights so the transparent silhouette survives on mobile
  // against the bright garden; two small PET moulding rings establish its volume.
  for (const y of [0.437, 0.458]) {
    a.add(M.ceramic, '#b7d8de', ring(0.106, 0.0025, 'gb_pet_rib'), 0, y, 0, { shadow: false });
  }
  a.add(M.ceramic, '#d4e8e7', ring(0.030, 0.004, 'gb_neck_bead'), 0, 0.713, 0);
  a.add(M.ceramic, '#c6e4e8', bar(0.008, 0.244, 0.005, 'gb_pet_glint'), -0.072, 0.486, -0.073, { shadow: false });
  a.add(M.ceramic, '#94c5cc', bar(0.004, 0.166, 0.004, 'gb_pet_glint_short'), 0.070, 0.468, -0.075, { shadow: false });

  // A small recognisable bowl/roostertje on the neck: dark inset, brighter rim,
  // and tiny crossbars. Purely visual; no animation or use interaction.
  a.add(M.brass, '#616968', geo('gb_metal_bowl', () => lathe([
    [0.024, 0.000], [0.030, 0.011], [0.043, 0.029],
    [0.050, 0.038], [0.051, 0.045], [0.043, 0.047],
    [0.033, 0.033], [0.024, 0.022],
  ], 16)), 0, 0.718, 0);
  a.add(M.paint, '#293333', geo('gb_screen_back', () => new THREE.CircleGeometry(0.030, 12).rotateX(-Math.PI / 2)), 0, 0.754, 0, { shadow: false });
  a.add(M.brass, '#b9c2bc', ring(0.049, 0.004, 'gb_metal_rim'), 0, 0.764, 0);
  for (const p of [-0.018, 0, 0.018]) {
    a.add(M.brass, '#a3ada5', bar(0.003, 0.003, 0.053, 'gb_mesh_x'), p, 0.756, 0, { shadow: false });
    a.add(M.brass, '#a3ada5', bar(0.053, 0.003, 0.003, 'gb_mesh_z'), 0, 0.758, p, { shadow: false });
  }
}
