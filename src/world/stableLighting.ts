// LIGHT-R06 — state-bound living-room lighting pilot.
// Opt in with ?stableLiving=1 (or ?review=living&stableLiving=1).
// NOT a replacement for every room yet: the prototype deliberately scopes
// its authored light masks to the living room and avoids extra meshes/draw calls.
import * as THREE from 'three';
import type { World } from '../interactions/world';

const query = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search);
export const STABLE_LIVING_PILOT = query.get('stableLiving') === '1';
/** Review-only A/B: all pooled point lights off, but this local lamp-bound baseline remains. */
export const STABLE_NO_POOL = STABLE_LIVING_PILOT && query.get('noPoint') === '1';
export const STABLE_LIVING_IDS = new Set(['fire.living', 'lamp.livingFloor']);

export type StableSourceId = 'fire.living' | 'lamp.livingFloor';
export const STABLE_SOURCE_IDS: readonly StableSourceId[] = ['fire.living', 'lamp.livingFloor'];

/** World coordinates (Three.js z is negative plan z); fourth component is physical light radius. */
const positions = [new THREE.Vector4(73.35, 0.75, -86.7, 7.9), new THREE.Vector4(84.2, 1.75, -83.6, 7.7)];
/** Warm, art-authored LOW-FREQUENCY base contribution, not real-time physics. Alpha is on/off intensity. */
const contributions = [
  new THREE.Vector4(new THREE.Color('#ff9a4a').r, new THREE.Color('#ff9a4a').g, new THREE.Color('#ff9a4a').b, 0),
  new THREE.Vector4(new THREE.Color('#ffd49a').r, new THREE.Color('#ffd49a').g, new THREE.Color('#ffd49a').b, 0),
];
const sourceUniform = { value: positions };
const colorUniform = { value: contributions };

// Frag-level world position already exists on every material using surface().
// The probe adds *stable emissive bounce* rather than a THREE.PointLight: its
// spatial footprint never changes with camera, viewer position or pool slots.
// Boundary mask confines the initial study to the authored living-room volume.
// Future rollout requires actual per-room occlusion/portal and baked masks.
const GLSL = /* glsl */ `
uniform vec4 flwStableSources[2];
uniform vec4 flwStableColors[2];
vec3 flwStableLiving(vec3 p) {
  // Rectangular living room, slightly feathered at room edges.
  // Coordinates are render-space metres (x, y, negative-plan-z).
  float room = smoothstep(72.15, 73.2, p.x) * (1.0-smoothstep(84.0, 85.15, p.x))
             * smoothstep(-94.5, -93.8, p.z) * (1.0-smoothstep(-80.9, -80.2, p.z))
             * smoothstep(-0.12, 0.15, p.y) * (1.0-smoothstep(3.0, 3.45, p.y));
  if (room < 0.0001) return vec3(0.0);
  vec3 value = vec3(0.0);
  for (int i=0; i<2; i++) {
    vec4 src=flwStableSources[i], tint=flwStableColors[i];
    float r=max(0.1, src.w);
    float d=length(p-src.xyz);
    float attenuation=1.0-smoothstep(0.0, r, d);
    // Deliberately gentle, bounded surface bounce; no light-slot or motion dependency.
    value += tint.rgb * tint.w * attenuation;
  }
  return value * room;
}
`;

/** Called once for each existing lit surface material, before shader compilation. */
export function stableMaterial<T extends THREE.Material>(mat: T): T {
  if (!STABLE_LIVING_PILOT || mat.userData.stableLiving) return mat;
  const lit = mat as unknown as THREE.MeshLambertMaterial | THREE.MeshPhongMaterial | THREE.MeshStandardMaterial;
  if (!(mat instanceof THREE.MeshLambertMaterial || mat instanceof THREE.MeshPhongMaterial || mat instanceof THREE.MeshStandardMaterial)) return mat;
  lit.defines = { ...(lit.defines ?? {}), FLW_STABLE_LIVING: 1 };
  const previous = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    previous.call(mat, shader, renderer);
    shader.uniforms.flwStableSources = sourceUniform;
    shader.uniforms.flwStableColors = colorUniform;
    shader.fragmentShader = GLSL + '\n' + shader.fragmentShader;
    const injection = '#include <emissivemap_fragment>';
    if (!shader.fragmentShader.includes(injection)) throw new Error('LIGHT-R06 requires emissivemap_fragment for this material');
    shader.fragmentShader = shader.fragmentShader.replace(injection,
      injection + '\n totalEmissiveRadiance += flwStableLiving(vFlwP);');
  };
  mat.userData.stableLiving = true;
  mat.needsUpdate = true;
  return mat;
}

/** CPU analogue of the two authored surface contributions for regression tests. */
export function stableContributionAt(x: number, y: number, z: number) {
  const s = (a: number, b: number, v: number) => {
    const t = THREE.MathUtils.clamp((v - a) / (b - a), 0, 1);
    return t*t*(3-2*t);
  };
  const room=s(72.15,73.2,x)*(1-s(84,85.15,x))*s(-94.5,-93.8,z)*
    (1-s(-80.9,-80.2,z))*s(-.12,.15,y)*(1-s(3,3.45,y));
  const col = new THREE.Color(0, 0, 0);
  for(let i=0;i<2;i++) {
    const p=positions[i],q=contributions[i];
    const dist=Math.hypot(x-p.x,y-p.y,z-p.z);
    const a=1-s(0,p.w,dist);
    col.r+=q.x*q.w*a*room;col.g+=q.y*q.w*a*room;col.b+=q.z*q.w*a*room;
  }
  return col;
}

/** The actual existing save-state callbacks — never camera, frame, distance or LightPool. */
export function bindStableLiving(w: World) {
  if (!STABLE_LIVING_PILOT || w.id !== 'estate') return;
  const lamps = STABLE_SOURCE_IDS.map(id => w.lamps.find(l => l.id === id));
  if (lamps.some(x=>!x)) throw new Error('LIGHT-R06 missing living room source contract');
  lamps.forEach((lamp,i)=>{
    positions[i].set(lamp!.pos.x,lamp!.pos.y,lamp!.pos.z,Math.min(i === 0 ? 6.7 : 5.7, lamp!.distance));
  });
  const sync = () => {
    contributions[0].w = lamps[0]!.on() ? 0.19 : 0;
    contributions[1].w = lamps[1]!.on() ? 0.13 : 0;
  };
  w.onSync(sync);
  sync();
  w.scene.userData.stableLiving = {
    mode:'source-bound-material', ids:[...STABLE_SOURCE_IDS],
    noPoint:STABLE_NO_POOL, sources:lamps.map(l=>l!.id),
    state:()=>contributions.map(x=>x.w),
    // QA only; the production build never enables the pilot from ordinary URLs.
    contribution:(x:number,y:number,z:number)=>stableContributionAt(x,y,z).toArray(),
  };
}
