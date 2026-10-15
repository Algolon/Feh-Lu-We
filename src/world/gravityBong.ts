// Feh Lu We prop R02: two-chamber commercial gravity bong, based on user photo references.
// Decorative only: no smoking interaction, puzzle state, sound, or physics.
// Smoke runs on the existing FIRE_UNIFORMS clock and respects reduced motion.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Ctx } from './arch';
import { Asm, artMats, lathe } from './artkit';
import { FIRE_UNIFORMS } from './fire';

const GEOS = new Map<string, THREE.BufferGeometry>();
function cache(id: string, make: () => THREE.BufferGeometry) {
  let g = GEOS.get(id);
  if (!g) { g = make(); g.userData.shared = true; GEOS.set(id, g); }
  return g;
}
const turn = (id: string, points: [number, number][], sides = 16) => cache(id, () => lathe(points, sides));
const ring = (id: string, r: number, tube = 0.003) =>
  cache(id, () => new THREE.TorusGeometry(r, tube, 5, 18).rotateX(Math.PI / 2));
const rod = (id: string, top: number, bottom: number, len: number, sides = 12) =>
  cache(id, () => new THREE.CylinderGeometry(top, bottom, len, sides));
const bx = (id: string, x: number, y: number, z: number) => cache(id, () => new THREE.BoxGeometry(x, y, z));
const pebble = (id: string, r: number) => cache(id, () => new THREE.IcosahedronGeometry(r, 0));

let WATER: THREE.MeshPhongMaterial | null = null;
function waterMaterial() {
  return WATER ??= new THREE.MeshPhongMaterial({
    color: '#eef9fa', vertexColors: true, transparent: true, opacity: 0.55,
    depthWrite: false, side: THREE.DoubleSide, specular: '#c4d6df', shininess: 60,
  });
}

/** One accurate size setting: 2/3 of the R02 product in ALL axes, not its yaw. */
export const GRAVITY_BONG_SCALE = 2 / 3;
export const SMOKE_PUFF_COUNT = 6;
const SMOKE_RISE = 0.26;
const SMOKE = new Map<'fill' | 'plume', THREE.ShaderMaterial>();

/** Staggered low-poly smoke puffs. UV.x carries phase, UV.y vertical shading. */
export function smokePuffs(id: string, phaseOffset = 0): THREE.BufferGeometry {
  return cache(id, () => {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < SMOKE_PUFF_COUNT; i++) {
      const g = new THREE.IcosahedronGeometry(1, 1).toNonIndexed();
      g.scale(0.017 + (i % 3) * 0.003, 0.028 + (i % 2) * 0.007, 0.016 + (i % 3) * 0.002);
      const p = g.getAttribute('position');
      const uvs = new Float32Array(p.count * 2);
      const phase = ((i / SMOKE_PUFF_COUNT + phaseOffset) % 1 + 1) % 1;
      for (let n = 0; n < p.count; n++) {
        uvs[2 * n] = phase;
        uvs[2 * n + 1] = (p.getY(n) / 0.035 + 1) * 0.5;
      }
      g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      parts.push(g);
    }
    const merged = mergeGeometries(parts, false);
    for (const g of parts) g.dispose();
    if (!merged) throw new Error('Could not merge the gravity bong smoke puffs');
    return merged;
  });
}
function smokeMaterial(kind: 'fill' | 'plume') {
  const prev = SMOKE.get(kind);
  if (prev) return prev;
  const alpha = kind === 'fill'
    ? '0.26 * (0.7 + 0.3 * smoothstep(0.0, 0.12, vUv.y)) * (1.0 - 0.55 * smoothstep(0.67, 1.0, vUv.y)) * wave'
    : '0.28 * smoothstep(0.0, 0.09, vLife) * (1.0 - smoothstep(0.58, 0.99, vLife)) * wave';
  const m = new THREE.ShaderMaterial({
    vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: FIRE_UNIFORMS.uTime, uMotion: FIRE_UNIFORMS.uMotion },
    vertexShader: `
      uniform float uTime; uniform float uMotion;
      varying vec2 vUv; varying vec3 vTint; varying float vLife;
      void main() {
        vUv = uv; vTint = color;
        vec3 p = position;
        float t = uTime * uMotion;
        if (${kind === 'plume' ? 'true' : 'false'}) {
          // Staggered puffs LOOP UP, rather than showing a static translucent cone.
          float k = fract(uv.x + t * 0.24);
          vLife = k;
          p.x += 0.014 * k * sin(t * 1.17 + k * 8.5 + uv.x * 13.0);
          p.z += 0.008 * k * cos(t * 0.89 + k * 6.0 + uv.x * 17.0);
          p.y += k * ${(SMOKE_RISE * GRAVITY_BONG_SCALE).toFixed(3)};
        } else {
          vLife = uv.y;
          p.x += uMotion * uv.y * (0.006 * sin(t * 1.06 + uv.y * 11.0 + uv.x * 6.28318)
                + 0.003 * sin(t * 1.6 + uv.y * 16.0));
          p.z += uMotion * uv.y * 0.006 * cos(t * 0.82 + uv.y * 8.0 + uv.x * 6.28318);
        }
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform float uTime; uniform float uMotion;
      varying vec2 vUv; varying vec3 vTint; varying float vLife;
      void main() {
        float t = uTime * uMotion;
        float wave = 0.76 + 0.24 * sin(vUv.y * 17.0 - t * 1.1 + vUv.x * 6.28318);
        float a = ${alpha};
        gl_FragColor = vec4(vTint, a);
      }`,
  });
  SMOKE.set(kind, m);
  return m;
}

/** Models the photographed product, not a DIY bucket-and-bottle assembly. */
export function buildGravityBong(c: Ctx, x: number, tabletopY: number, z: number) {
  const a = new Asm(c.b, c.chunk, x, tabletopY, z, 0.20); // 0.20 is the yaw angle.
  // Scale every shape and local offset about the original tabletop contact point.
  // Scaling the Asm yaw instead would rotate the prop and leave it full sized.
  const add: Asm['add'] = (mat, tint, shape, dx, dy, dz, o = {}) => {
    const size = o.s ?? [1, 1, 1];
    a.add(mat, tint, shape, dx * GRAVITY_BONG_SCALE, dy * GRAVITY_BONG_SCALE,
      dz * GRAVITY_BONG_SCALE, {
        ...o, s: [
          size[0] * GRAVITY_BONG_SCALE, size[1] * GRAVITY_BONG_SCALE,
          size[2] * GRAVITY_BONG_SCALE,
        ],
      });
  };
  const M = artMats(), glass = c.k.M.glass;

  // Weighted metal base, lip, inset and right support.
  add(M.ceramic, '#25292b', turn('gb2_foot', [
    [0.001, 0.010], [0.169, 0.010], [0.201, 0.018],
    [0.218, 0.031], [0.211, 0.039], [0.158, 0.045], [0.001, 0.045],
  ]), 0, 0, 0);
  add(M.paint, '#555d60', ring('gb2_foot_trim', 0.204), 0, 0.027, 0);
  add(M.paint, '#171c1f', turn('gb2_base_inset', [
    [0.001, 0], [0.084, 0], [0.100, 0.012], [0.001, 0.012],
  ]), 0, 0.045, 0);
  add(M.ceramic, '#697378', ring('gb2_base_recess', 0.100), 0, 0.052, 0);

  // Lower round-ended GLASS compartment; clear, with a separate blue water VOLUME.
  add(glass, '#f4f6f6', turn('gb2_lower_shell', [
    [0.001, 0.058], [0.047, 0.062], [0.083, 0.079], [0.104, 0.112],
    [0.112, 0.153], [0.112, 0.310], [0.108, 0.332], [0.102, 0.348],
  ], 20), 0, 0, 0, { shadow: false });
  add(M.ceramic, '#b6c3c4', ring('gb2_lower_gasket', 0.107, 0.004), 0, 0.342, 0);
  add(waterMaterial(), '#569db6', turn('gb2_water_volume', [
    [0.001, 0.095], [0.069, 0.095], [0.095, 0.113],
    [0.098, 0.159], [0.099, 0.207], [0.001, 0.207],
  ]), 0, 0, 0, { shadow: false });
  add(waterMaterial(), '#b3dce4', cache('gb2_water_surface', () =>
    new THREE.CircleGeometry(0.097, 18).rotateX(-Math.PI / 2)), 0, 0.209, 0, { shadow: false });
  add(M.ceramic, '#c4e5e7', ring('gb2_waterline', 0.097, 0.003), 0, 0.210, 0, { shadow: false });
  add(M.paint, '#343b3e', rod('gb2_inner_tube_lower', 0.016, 0.016, 0.239), 0, 0.210, 0);
  add(M.ceramic, '#879093', ring('gb2_tube_tip', 0.017, 0.002), 0, 0.093, 0);

  // Matte-black middle body, turned panel lip and small unbranded front inset.
  add(M.ceramic, '#292c2f', turn('gb2_central_housing', [
    [0.001, 0.344], [0.119, 0.344], [0.129, 0.354],
    [0.129, 0.523], [0.120, 0.538], [0.001, 0.538],
  ], 18), 0, 0, 0);
  add(M.paint, '#50575a', ring('gb2_body_lower_seam', 0.123, 0.0045), 0, 0.352, 0);
  add(M.paint, '#535c5d', ring('gb2_body_upper_seam', 0.122, 0.0045), 0, 0.531, 0);
  add(M.paint, '#51575a', ring('gb2_body_panel_seam', 0.129, 0.002), 0, 0.493, 0);
  add(M.ceramic, '#d6d7d1', bx('gb2_front_detail', 0.025, 0.050, 0.004), 0, 0.439, 0.131, { shadow: false });

  // Upper rounded glass capsule. Dark riser remains visible through the interior smoke.
  add(glass, '#f0f5f6', turn('gb2_upper_shell', [
    [0.103, 0.538], [0.110, 0.558], [0.113, 0.587],
    [0.113, 0.721], [0.108, 0.762], [0.090, 0.810],
    [0.062, 0.846], [0.030, 0.867], [0.001, 0.874],
  ], 20), 0, 0, 0, { shadow: false });
  add(M.ceramic, '#c2cbcb', ring('gb2_upper_gasket', 0.107), 0, 0.544, 0);
  add(M.paint, '#373f42', rod('gb2_inner_tube_upper', 0.017, 0.017, 0.262), 0, 0.682, 0);
  add(smokeMaterial('fill'), '#d4d8d6', turn('gb2_upper_smoke', [
    [0.001, 0.562], [0.065, 0.566], [0.092, 0.587], [0.096, 0.710],
    [0.088, 0.755], [0.070, 0.800], [0.035, 0.839], [0.001, 0.852],
  ], 14), 0, 0, 0, { shadow: false });
  add(smokeMaterial('fill'), '#e7e8e3', turn('gb2_upper_smoke_core', [
    [0.001, 0.579], [0.040, 0.589], [0.052, 0.702], [0.044, 0.760], [0.001, 0.817],
  ], 10), 0, 0, 0, { shadow: false });

  // Distinct glass reflections read against pale grass/sky on small phones.
  for (const y of [0.179, 0.296, 0.619, 0.727]) {
    add(M.ceramic, '#aab9bd',
      ring('gb2_glass_guide_' + y, y < 0.34 ? 0.111 : 0.112, 0.0018),
      0, y, 0, { shadow: false });
  }
  add(M.ceramic, '#e0eded', bx('gb2_top_glint', 0.007, 0.17, 0.004),
    -0.080, 0.667, 0.075, { shadow: false });
  add(M.ceramic, '#dae4e7', bx('gb2_bottom_glint', 0.006, 0.13, 0.004),
    -0.080, 0.250, 0.075, { shadow: false });

  // LEFT outlet: cylindrical horizontal joint, ball receiver and a raised angled mouthpiece.
  add(M.ceramic, '#252a2c', cache('gb2_left_hub', () =>
    new THREE.CylinderGeometry(0.060, 0.060, 0.172, 14).rotateZ(Math.PI / 2)),
    -0.169, 0.435, 0);
  add(M.ceramic, '#343c3f', pebble('gb2_left_ball', 0.067), -0.247, 0.437, 0);
  add(M.ceramic, '#171b1e', cache('gb2_mouthpiece', () =>
    new THREE.CylinderGeometry(0.016, 0.021, 0.229, 12).rotateZ(0.41)),
    -0.327, 0.552, 0);
  add(M.ceramic, '#7f8686', ring('gb2_mouth_ring', 0.018, 0.003),
    -0.373, 0.657, 0);

  // RIGHT outlet: cross-tube, supported horizontal saucer, then the metal bowl.
  add(M.ceramic, '#222629', cache('gb2_right_joint', () =>
    new THREE.CylinderGeometry(0.059, 0.059, 0.208, 14).rotateZ(Math.PI / 2)),
    0.218, 0.438, 0);
  add(M.ceramic, '#34393c', rod('gb2_support', 0.012, 0.012, 0.472),
    0.224, 0.279, 0.010);
  add(M.ceramic, '#2c3134', rod('gb2_tray', 0.123, 0.123, 0.014, 20),
    0.337, 0.515, 0);
  add(M.ceramic, '#73797b', ring('gb2_tray_ring', 0.119), 0.337, 0.523, 0);
  add(M.ceramic, '#292e30', turn('gb2_bowl_cup', [
    [0.036, 0.523], [0.050, 0.526], [0.057, 0.553],
    [0.060, 0.601], [0.063, 0.609], [0.057, 0.616],
    [0.049, 0.599], [0.040, 0.588],
  ]), 0.337, 0, 0);
  add(M.paint, '#121619', cache('gb2_screen_bg', () =>
    new THREE.CircleGeometry(0.045, 16).rotateX(-Math.PI / 2)),
    0.337, 0.594, 0, { shadow: false });
  add(M.ceramic, '#7e8585', ring('gb2_bowl_edge', 0.060, 0.004),
    0.337, 0.614, 0);
  for (const p of [-0.022, 0, 0.022]) {
    add(M.brass, '#a1a6a5', bx('gb2_mesh_along', 0.002, 0.002, 0.075),
      0.337 + p, 0.598, 0, { shadow: false });
    add(M.brass, '#a1a6a5', bx('gb2_mesh_across', 0.075, 0.002, 0.002),
      0.337, 0.601, p, { shadow: false });
  }
  // Glowing red/orange smouldering content with irregular facets and dark charcoal.
  for (let i = 0; i < 14; i++) {
    const theta = i * 2.39996, r = 0.008 + (i % 4) * 0.009;
    const x2 = 0.337 + Math.cos(theta) * r, z2 = Math.sin(theta) * r;
    add(i % 5 === 0 ? M.paint : c.k.M.glow,
      i % 5 === 0 ? '#322923' : (i % 3 === 0 ? '#ffb048' : i % 3 === 1 ? '#f05b24' : '#bf2c1b'),
      pebble('gb2_char_' + (i % 3), 0.006 + (i % 3) * 0.003),
      x2, 0.603 + (i % 3) * 0.004, z2, { shadow: false });
  }

  // Independent, subtle smoke plumes: six rising/fading puffs at each outlet.
  // Phases are offset so the two streams do not pulse in sync; the shared
  // FIRE_UNIFORMS clock automatically respects reduced-motion settings.
  add(smokeMaterial('plume'), '#e0e2de', smokePuffs('gb3_mouth_puffs', 0),
    -0.373, 0.665, 0, { shadow: false });
  add(smokeMaterial('plume'), '#d4d6d2', smokePuffs('gb3_bowl_puffs', 0.27),
    0.337, 0.614, 0, { shadow: false });
}
