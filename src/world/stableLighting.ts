// LIGHT-R06 — state-bound living-room lighting pilot.
// Opt in with ?stableLiving=1 (or ?review=living&stableLiving=1).
// NOT a replacement for every room yet: the prototype deliberately scopes
// its authored light masks to the living room and avoids extra meshes/draw calls.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import { getKit } from './kit';

const query = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search);
// Default ON only on the isolated published LIGHT-R06D review URL.
// Explicit ?stableLiving=0 remains available as a same-build A/B baseline.
// The normal production URL and family edition do not use this source bundle.
export const STABLE_LIVING_PILOT = query.get('stableLiving') === '1' ||
  (query.get('stableLiving') !== '0' && typeof location !== 'undefined' &&
   (location.pathname.includes('/light-r06d/') || location.pathname.endsWith('/light-r06d')));
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
// The authored rectangle follows PLAN x 72.4–85, plan z 80.4–94, with
// an inside-facing cutoff at each shared wall (roughly 16 cm thick). The
// preceding R06 mask faded metres *before* an interior wall, leaving the
// actual western fireplace wall unexpectedly underlit. A narrow boundary
// transition here preserves illumination at the living side while excluding
// the hall/library/exterior sides. Values are render-space; z=-planZ.
export const STABLE_LIVING_MASK = Object.freeze({
  x0out:72.30, x0in:72.42, x1in:84.94, x1out:85.02,
  z0out:-94.04, z0in:-93.90, z1in:-80.54, z1out:-80.36,
  y0out:0.04, y0in:0.14, y1in:3.12, y1out:3.30,
});
const mask=STABLE_LIVING_MASK;
const GLSL = /* glsl */ `
uniform vec4 flwStableSources[2];
uniform vec4 flwStableColors[2];
float flwLivingMask(vec3 p) {
  return smoothstep(${mask.x0out},${mask.x0in},p.x)
      * (1.0-smoothstep(${mask.x1in},${mask.x1out},p.x))
      * smoothstep(${mask.z0out},${mask.z0in},p.z)
      * (1.0-smoothstep(${mask.z1in},${mask.z1out},p.z))
      * smoothstep(${mask.y0out},${mask.y0in},p.y)
      * (1.0-smoothstep(${mask.y1in},${mask.y1out},p.y));
}
vec3 flwStableLiving(vec3 p) {
  float room=flwLivingMask(p);
  if(room<0.0001)return vec3(0.0);
  vec3 value=vec3(0.0);
  for(int i=0;i<2;i++){
    vec4 src=flwStableSources[i],tint=flwStableColors[i];
    float r=max(0.1,src.w);
    float d=length(p-src.xyz);
    float falloff=1.0-smoothstep(0.0,r,d);
    value+=tint.rgb*tint.w*falloff;
  }
  return value*room;
}
`;

// Keep a CPU mirror of the *same authored boundary* for reproducible leakage
// checks. View/camera/roomOf(player) are never inputs to this mask.
const smooth=(a:number,b:number,p:number)=>{
  const t=THREE.MathUtils.clamp((p-a)/(b-a),0,1);
  return t*t*(3-2*t);
};
export function stableRoomMaskAt(x:number,y:number,z:number):number{
  const m=STABLE_LIVING_MASK;
  return smooth(m.x0out,m.x0in,x)*(1-smooth(m.x1in,m.x1out,x))
    *smooth(m.z0out,m.z0in,z)*(1-smooth(m.z1in,m.z1out,z))
    *smooth(m.y0out,m.y0in,y)*(1-smooth(m.y1in,m.y1out,y));
}

/** Three.js Material.clone() does not reliably preserve optional custom
 * 'defines' added by surface(). Without FLW_SURFACE the world-position varying
 * is compiled out, and the new shader crashes with undeclared vFlwP.
 */
export function cloneSurfaceWithDefines<T extends THREE.Material>(source:T):T{
  const clone=source.clone();
  type Defined=THREE.Material&{defines?:Record<string,number|boolean|string>};
  const original=(source as Defined).defines;
  if(original)(clone as Defined).defines={...original};
  return clone;
}

/** Only called on *cloned, scoped* world materials, never globally in surface(). */
export function stableMaterial<T extends THREE.Material>(mat: T): T {
  if (!STABLE_LIVING_PILOT || mat.userData.stableLiving) return mat;
  const lit = mat as unknown as THREE.MeshLambertMaterial | THREE.MeshPhongMaterial | THREE.MeshStandardMaterial;
  if (!(mat instanceof THREE.MeshLambertMaterial || mat instanceof THREE.MeshPhongMaterial || mat instanceof THREE.MeshStandardMaterial)) return mat;
  if (!mat.userData.surface) return mat; // vFlwP is provided by the existing surface() shader contract
  // Guard against silently shipping an invalid fragment shader when the
  // custom surface define was dropped by a material clone.
  if (!(lit.defines as Record<string,unknown>|undefined)?.FLW_SURFACE)
    throw new Error('LIGHT-R06B: missing FLW_SURFACE define for scoped material');
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
      // Apply the authored bounce through existing material albedo, preserving
      // plaster/stone/timber variations instead of an identical orange wash.
      // No player/camera/gaze or LightPool dependence is introduced.
      injection + '\n totalEmissiveRadiance += flwStableLiving(vFlwP) * mix(vec3(0.55), clamp(diffuseColor.rgb, vec3(0.0), vec3(1.0)), 0.45);');
  };
  mat.userData.stableLiving = true;
  mat.needsUpdate = true;
  return mat;
}

/** CPU analogue of the two authored surface contributions for regression tests. */
export function stableContributionAt(x: number, y: number, z: number) {
  const room=stableRoomMaskAt(x,y,z);
  const col = new THREE.Color(0, 0, 0);
  for(let i=0;i<2;i++) {
    const p=positions[i],q=contributions[i];
    const dist=Math.hypot(x-p.x,y-p.y,z-p.z);
    const a=1-smooth(0,p.w,dist);
    col.r+=q.x*q.w*a*room;col.g+=q.y*q.w*a*room;col.b+=q.z*q.w*a*room;
  }
  return col;
}

/**
 * Opt in the actual room-area meshes at scene BUILD TIME, before opaque
 * aggregation. Shared kit materials remain untouched and outdoor meshes
 * retain their original shader programs. The shell's interior plaster is
 * an explicit exception: it is owned by the 'manor' batch, but needed for
 * fireplace light on the external wall's *inside* face.
 *
 * This is still a PILOT: mIn is a large merged chunk, so some unrelated
 * interior fragments run the very cheap room-boundary reject. The eventual
 * per-room geometry/lightmap authoring can eliminate even that cost.
 */
export function installStableLivingMaterials(w:World){
  if(!STABLE_LIVING_PILOT||w.id!=='estate')return;
  const kit=getKit();
  const area=new THREE.Box3(
    new THREE.Vector3(72.20,0,-94.2),
    new THREE.Vector3(85.20,3.45,-80.20));
  const clones=new Map<THREE.Material,THREE.Material>();
  const counts:Record<string,number>={};
  let meshes=0,untouched=0,skippedByBox=0;
  w.scene.updateMatrixWorld(true);
  const bounds=new THREE.Box3();
  w.scene.traverse(obj=>{
    const m=obj as THREE.Mesh;
    if(!m.isMesh||!m.geometry||Array.isArray(m.material))return;
    const chunk=m.userData.chunk as string|undefined;
    const mat=m.material as THREE.Material;
    const relevant=chunk==='mLiv'||chunk==='mIn'||
      (chunk==='manor'&&mat===kit.M.plaster);
    if(!relevant){untouched++;return;}
    // Avoid transforming detached/instanced geometries by an incomplete bbox:
    // only normal merged Mesh batches are part of the pilot.
    if((m as THREE.InstancedMesh).isInstancedMesh){untouched++;return;}
    if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();
    if(!m.geometry.boundingBox){untouched++;return;}
    bounds.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);
    if(!bounds.intersectsBox(area)){skippedByBox++;return;}
    // Large architectural, timber, stone and upholstery surfaces carry the
    // stable bounce. Small painted ornaments/metalwork keep their original
    // shaders: they neither need an orange wash nor another program variant.
    if(!['plaster','timber','stone','fabric'].includes(mat.userData.surface)){untouched++;return;}
    let clone=clones.get(mat);
    if(!clone){
      clone=w.material(cloneSurfaceWithDefines(mat));
      stableMaterial(clone);
      clones.set(mat,clone);
    }
    m.material=clone;
    meshes++;
    counts[chunk??'unnamed']=(counts[chunk??'unnamed']??0)+1;
  });
  w.scene.userData.stableScope={
    mode:'scoped-mesh-material',
    totalScopedMeshes:meshes,createdMaterialClones:clones.size,
    chunks:counts,untouchedMeshes:untouched,skippedByBox,
    // Review data, no reference to the camera or the player's location.
  };
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
    contributions[0].w = lamps[0]!.on() ? 0.14 : 0;
    contributions[1].w = lamps[1]!.on() ? 0.10 : 0;
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
