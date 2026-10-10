// DEV-04C ART-01.1 authored surfaces: broad, designed value / hue breakup per material family, in world space.
//
// The canvas textures give each material its small-scale identity (grain, ashlar, weave) but they repeat every metre or
// two, and the batcher's ±4 % part jitter is per piece: a plastered wall, a floor, the lawn or a canopy still read as one
// flat value. This layer adds the missing *large* structure — low-frequency value zones and a slight warm / cool drift,
// material-specific in scale and strength — the way a painted environment carries broad shapes before detail:
//   timber    long soft value drift + per-metre warmth changes (warmer exposed wood, cooler shadowed)
//   plaster   very broad clouding, a faint grounding darker band in the lowest ~0.5 m of every storey
//   stone     broader + mid breakup (mass, not noise)
//   fabric    soft, short-range variation (reads as cloth, not as painted solid)
//   paint     very little (painted objects stay clean)
//   ground    lawn / forest floor / paths: large dry-vs-lush patches, a little less saturation
//   foliage   canopy-scale variation between and within crowns, a little less saturation
//   metal     almost none
// No geometry, no extra textures, no extra draw calls: the code lives in three.js shader chunks behind `#ifdef
// FLW_SURFACE`, and a material opts in with `surface(mat, profile)` (one define → one program variant per profile).
// Everything is static (no time / light dependence), so it never fights the realtime lighting.
import * as THREE from 'three';

export const SURFACE_PROFILES = { timber: 1, plaster: 2, stone: 3, fabric: 4, paint: 5, ground: 6, foliage: 7, metal: 8, tree: 9 } as const;
export type SurfaceProfile = keyof typeof SURFACE_PROFILES;

/** Per profile: [low scale m, low amp, mid scale m, mid amp, hue amp, saturation, storey grounding amp]. */
export const SURFACE_PARAMS: Record<SurfaceProfile, [number, number, number, number, number, number, number]> = {
  timber: [3.2, 0.1, 0.55, 0.05, 0.05, 1.0, 0.0],
  plaster: [2.6, 0.12, 0.9, 0.045, 0.05, 1.0, 0.08],
  stone: [1.9, 0.1, 0.42, 0.07, 0.035, 0.97, 0.04],
  fabric: [1.1, 0.07, 0.3, 0.035, 0.03, 1.0, 0.0],
  paint: [2.4, 0.04, 0.0, 0.0, 0.02, 1.0, 0.0],
  ground: [11.0, 0.2, 2.8, 0.09, 0.11, 0.72, 0.0],
  foliage: [8.0, 0.14, 1.6, 0.05, 0.09, 0.84, 0.0],
  metal: [1.2, 0.03, 0.0, 0.0, 0.0, 1.0, 0.0],
  tree: [7.0, 0.12, 1.4, 0.05, 0.08, 0.86, 0.0],
};

const f = (n: number) => n.toFixed(4);
function profileGlsl() {
  return (Object.keys(SURFACE_PROFILES) as SurfaceProfile[]).map((k) => {
    const [ls, la, ms, ma, ha, sa, ga] = SURFACE_PARAMS[k];
    return `#if FLW_SURFACE == ${SURFACE_PROFILES[k]}
  const vec4 FLW_A = vec4(${f(1 / ls)}, ${f(la)}, ${f(ms > 0 ? 1 / ms : 0)}, ${f(ma)});
  const vec3 FLW_B = vec3(${f(ha)}, ${f(sa)}, ${f(ga)});
#endif`;
  }).join('\n');
}

const COMMON = /* glsl */ `
#ifdef FLW_SURFACE
varying vec3 vFlwP;
varying vec3 vFlwN;
${profileGlsl()}
float flwHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float flwNoise(vec3 x) {
  vec3 i = floor(x), u = fract(x); u = u * u * (3.0 - 2.0 * u);
  return mix(mix(mix(flwHash(i), flwHash(i + vec3(1, 0, 0)), u.x), mix(flwHash(i + vec3(0, 1, 0)), flwHash(i + vec3(1, 1, 0)), u.x), u.y),
             mix(mix(flwHash(i + vec3(0, 0, 1)), flwHash(i + vec3(1, 0, 1)), u.x), mix(flwHash(i + vec3(0, 1, 1)), flwHash(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}
vec3 flwSurface(vec3 base, vec3 p, vec3 n) {
  // broad value zones (two octaves at the profile's own scale), a mid-scale breakup, a separate warm / cool drift
  float lo = flwNoise(p * FLW_A.x) * 0.65 + flwNoise(p * FLW_A.x * 2.13 + 11.7) * 0.35;
  float v = 1.0 + (lo - 0.5) * 2.0 * FLW_A.y;
  if (FLW_A.w > 0.0) v += (flwNoise(p * FLW_A.z + 31.1) - 0.5) * 2.0 * FLW_A.w;
  float hue = (flwNoise(p * FLW_A.x * 0.61 - 7.3) - 0.5) * 2.0 * FLW_B.x;
  vec3 c = base * v * (vec3(1.0) + vec3(0.6, 0.12, -0.75) * hue);
  // grounding: the lowest half metre of each storey (floors at 0.15 / 3.35 / 6.65 m) sits a little darker on walls
  if (FLW_B.z > 0.0 && abs(n.y) < 0.5) { float h = mod(p.y + 0.05, 3.2); c *= 1.0 - FLW_B.z * (1.0 - smoothstep(0.05, 0.55, h)); }
  float g = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(g), c, FLW_B.y);
}
#endif
`;

const WORLDPOS = /* glsl */ `
#ifdef FLW_SURFACE
  vec4 flwW = vec4(transformed, 1.0);
  #ifdef USE_BATCHING
    flwW = batchingMatrix * flwW;
  #endif
  #ifdef USE_INSTANCING
    flwW = instanceMatrix * flwW;
  #endif
  vFlwP = (modelMatrix * flwW).xyz;
  vFlwN = inverseTransformDirection(transformedNormal, viewMatrix);
#endif
`;

const COLOR = /* glsl */ `
#ifdef FLW_SURFACE
  diffuseColor.rgb = flwSurface(diffuseColor.rgb, vFlwP, normalize(vFlwN));
#endif
`;

let installed = false;
/** Extend the shared shader chunks once (before the first program compiles). Idempotent. */
export function installSurfaces() {
  if (installed) return;
  installed = true;
  const C = THREE.ShaderChunk as unknown as Record<string, string>;
  C.common += COMMON;
  C.worldpos_vertex += WORLDPOS;
  C.color_fragment += COLOR;
}

/** Opt a lit material into an authored-surface profile (no-op for unlit materials). Returns the material. */
export function surface<T extends THREE.Material>(m: T, profile: SurfaceProfile): T {
  installSurfaces();
  const mm = m as unknown as THREE.Material & { defines?: Record<string, unknown> };
  if (!(m instanceof THREE.MeshLambertMaterial || m instanceof THREE.MeshPhongMaterial || m instanceof THREE.MeshStandardMaterial)) return m;
  mm.defines = { ...(mm.defines ?? {}), FLW_SURFACE: SURFACE_PROFILES[profile] };
  m.userData.surface = profile;
  m.needsUpdate = true;
  return m;
}

/** CPU mirror of the GLSL value-noise (tests and probes): same hash, same interpolation. */
export function flwNoiseCPU(x: number, y: number, z: number) {
  const fr = (v: number) => v - Math.floor(v);
  const hash = (a: number, b: number, c: number) => { let px = fr(a * 0.3183099 + 0.1) * 17, py = fr(b * 0.3183099 + 0.1) * 17, pz = fr(c * 0.3183099 + 0.1) * 17; return fr(px * py * pz * (px + py + pz)); };
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const s = (t: number) => t * t * (3 - 2 * t);
  const ux = s(x - ix), uy = s(y - iy), uz = s(z - iz);
  const L = (a: number, b: number, t: number) => a + (b - a) * t;
  return L(L(L(hash(ix, iy, iz), hash(ix + 1, iy, iz), ux), L(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), ux), uy),
           L(L(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), ux), L(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), ux), uy), uz);
}
