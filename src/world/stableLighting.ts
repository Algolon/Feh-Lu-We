// LIGHT-R06 — state-bound living-room lighting pilot.
// Opt in with ?stableLiving=1 (or ?review=living&stableLiving=1).
// NOT a replacement for every room yet: the prototype deliberately scopes
// its authored light masks to the living room and avoids extra meshes/draw calls.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import { getKit } from './kit';

const query = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search);
// LIGHT-R08 release uses the source-bound room light by default; separate
// older review build outputs stay pinned to their own commit.
// Deployed release: source-bound lighting is the DEFAULT for both normal and
// family gameplay. The separate review snapshots remain pinned and unchanged.
// ?stableRooms=0 is an emergency same-build rollback switch.
// In non-browser unit tests (no window/location), opt-in remains explicit.
const deployedRoute = typeof location !== 'undefined' && (
  location.pathname === '/Feh-Lu-We/' ||
  location.pathname === '/Feh-Lu-We/index.html' ||
  location.pathname === '/Feh-Lu-We/game' ||
  location.pathname.startsWith('/Feh-Lu-We/game/') ||
  location.pathname === '/Feh-Lu-We/light-r08' ||
  location.pathname.startsWith('/Feh-Lu-We/light-r08/')
);
export const STABLE_ROOMS_PILOT = query.get('stableRooms') === '1' ||
  (query.get('stableRooms') !== '0' && deployedRoute);
export const STABLE_LIVING_PILOT = STABLE_ROOMS_PILOT || query.get('stableLiving') === '1' ||
  (query.get('stableLiving') !== '0' && typeof location !== 'undefined' &&
   (location.pathname.includes('/light-r06d/') || location.pathname.endsWith('/light-r06d')));
/** Review-only A/B: all pooled point lights off, but this local lamp-bound baseline remains. */
export const STABLE_NO_POOL = STABLE_LIVING_PILOT && query.get('noPoint') === '1';
export const ROOM_SOURCE_IDS = ['lamp.hallChandelier','lamp.hallConsole','lamp.libraryChandelier','lamp.library'] as const;
export const STABLE_LIVING_IDS = new Set([
  'fire.living', 'lamp.livingFloor',
  ...(STABLE_ROOMS_PILOT ? [...ROOM_SOURCE_IDS] : []),
]);

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

/** LIGHT-R08: steady source-bound hall/library ambient. No player's room involved. */
const roomPositions = Array.from({length:4},()=>new THREE.Vector4());
const roomColors = [
  new THREE.Vector4(new THREE.Color('#ffe1b1').r,new THREE.Color('#ffe1b1').g,new THREE.Color('#ffe1b1').b,0),
  new THREE.Vector4(new THREE.Color('#ffc77f').r,new THREE.Color('#ffc77f').g,new THREE.Color('#ffc77f').b,0),
  new THREE.Vector4(new THREE.Color('#f9d2a0').r,new THREE.Color('#f9d2a0').g,new THREE.Color('#f9d2a0').b,0),
  new THREE.Vector4(new THREE.Color('#ffe0a5').r,new THREE.Color('#ffe0a5').g,new THREE.Color('#ffe0a5').b,0),
];
const roomPositionUniform = {value:roomPositions};
const roomColorUniform = {value:roomColors};

/** Between two independently lit rooms, the boundary corresponds to the
 * *actual wall*, not to where the player stands. Library gallery spans two
 * floors; the double-height hall also needs an upper light footprint.
 */
export const STABLE_HALL_MASK = Object.freeze({
 x0out:85.02,x0in:85.14,x1in:94.86,x1out:94.98,
 z0out:-98.10,z0in:-97.88,z1in:-84.14,z1out:-83.98,
 y0out:0.04,y0in:0.13,y1in:6.23,y1out:6.40,
});
export const STABLE_LIBRARY_MASK = Object.freeze({
 x0out:72.30,x0in:72.42,x1in:84.90,x1out:85.00,
 z0out:-109.68,z0in:-109.50,z1in:-94.16,z1out:-94.04,
 y0out:0.04,y0in:0.13,y1in:6.23,y1out:6.40,
});


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

// These are explicitly room-local masks. Closed doors are not transmissive:
// no room's local sources contribute to the surface on the other side of a wall.
// Object.freeze retains literal number types: widen values so the function
// accepts every authored room geometry (not only the hall's exact literals).
type RoomMaskBounds={ [K in keyof typeof STABLE_HALL_MASK]: number };
/** GLSL numeric literals used by smoothstep must be float typed.
 * JS string interpolation writes 85 rather than 85.0, which failed to
 * compile on actual WebGL/SwiftShader even when TypeScript passed.
 */
export const glslFloat=(v:number)=>Number.isInteger(v)?v.toFixed(1):String(v);
function roomMaskShader(m:RoomMaskBounds){
 const f=glslFloat;
 return `(smoothstep(${f(m.x0out)},${f(m.x0in)},p.x) *
 (1.0-smoothstep(${f(m.x1in)},${f(m.x1out)},p.x)) *
 smoothstep(${f(m.z0out)},${f(m.z0in)},p.z) *
 (1.0-smoothstep(${f(m.z1in)},${f(m.z1out)},p.z)) *
 smoothstep(${f(m.y0out)},${f(m.y0in)},p.y) *
 (1.0-smoothstep(${f(m.y1in)},${f(m.y1out)},p.y)))`;
}
const ROOMS_GLSL = /*glsl*/ `
uniform vec4 flwRoomSources[4];
uniform vec4 flwRoomColors[4];
vec3 flwStableOtherRooms(vec3 p) {
  // Evaluate a source only if it belongs to this authored space, never
  // when the player or camera happens to be near it.
  float hall=${roomMaskShader(STABLE_HALL_MASK)};
  float library=${roomMaskShader(STABLE_LIBRARY_MASK)};
  if(hall<0.0001 && library<0.0001)return vec3(0.0);
  vec3 outLight=vec3(0.0);
  for(int i=0;i<4;i++){
    float maskValue=(i<2)?hall:library;
    if(maskValue<0.0001)continue;
    vec4 source=flwRoomSources[i],tint=flwRoomColors[i];
    float falloff=1.0-smoothstep(0.0,max(0.1,source.w),length(p-source.xyz));
    // Banker's lamp: keep a small, down-facing work-surface pool even when
    // this fixture is not selected by the scarce real-time LightPool. Unlike
    // a global intensity increase, the accent fades within the actual desk
    // footprint and cannot illuminate the whole library rug/walls.
    float task=0.0;
    if(i==3){
      vec3 below=p-(source.xyz-vec3(0.0,0.38,0.0));
      float tabletop=1.0-smoothstep(0.18,1.58,length(below));
      float downward=1.0-smoothstep(-0.05,0.35,p.y-source.y);
      task=2.0*tabletop*downward;
    }
    outLight+=tint.rgb*tint.w*(falloff+task)*maskValue;
  }
  return outLight;
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
function maskAt(m:RoomMaskBounds,x:number,y:number,z:number):number{
 return smooth(m.x0out,m.x0in,x)*(1-smooth(m.x1in,m.x1out,x))*
 smooth(m.z0out,m.z0in,z)*(1-smooth(m.z1in,m.z1out,z))*
 smooth(m.y0out,m.y0in,y)*(1-smooth(m.y1in,m.y1out,y));
}
export const stableHallMaskAt=(x:number,y:number,z:number)=>maskAt(STABLE_HALL_MASK,x,y,z);
export const stableLibraryMaskAt=(x:number,y:number,z:number)=>maskAt(STABLE_LIBRARY_MASK,x,y,z);


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
  lit.defines = { ...(lit.defines ?? {}), FLW_STABLE_LIVING: 1, ...(STABLE_ROOMS_PILOT ? {FLW_STABLE_ROOMS:1} : {}) };
  const previous = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    previous.call(mat, shader, renderer);
    shader.uniforms.flwStableSources = sourceUniform;
    shader.uniforms.flwStableColors = colorUniform;
    if(STABLE_ROOMS_PILOT){
      shader.uniforms.flwRoomSources=roomPositionUniform;
      shader.uniforms.flwRoomColors=roomColorUniform;
    }
    shader.fragmentShader = GLSL + (STABLE_ROOMS_PILOT ? ROOMS_GLSL : '') + '\n' + shader.fragmentShader;
    const injection = '#include <emissivemap_fragment>';
    if (!shader.fragmentShader.includes(injection)) throw new Error('LIGHT-R06 requires emissivemap_fragment for this material');
    shader.fragmentShader = shader.fragmentShader.replace(injection,
      // Apply the authored bounce through existing material albedo, preserving
      // plaster/stone/timber variations instead of an identical orange wash.
      // No player/camera/gaze or LightPool dependence is introduced.
      injection + '\n totalEmissiveRadiance += (flwStableLiving(vFlwP)' +
      (STABLE_ROOMS_PILOT ? ' + flwStableOtherRooms(vFlwP)' : '') +
      ') * mix(vec3(0.55), clamp(diffuseColor.rgb, vec3(0.0), vec3(1.0)), 0.45);');
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
  const areas = [
    new THREE.Box3(new THREE.Vector3(72.20,0,-94.2),new THREE.Vector3(85.20,3.45,-80.20)),
    ...(STABLE_ROOMS_PILOT ? [
      new THREE.Box3(new THREE.Vector3(84.95,0,-98.2),new THREE.Vector3(95.05,6.50,-83.9)),
      new THREE.Box3(new THREE.Vector3(72.20,0,-109.8),new THREE.Vector3(85.20,6.50,-93.9)),
    ] : []),
  ];
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
      (STABLE_ROOMS_PILOT && (chunk==='mHall'||chunk==='mLib'))||
      (chunk==='manor'&&mat===kit.M.plaster);
    if(!relevant){untouched++;return;}
    // Avoid transforming detached/instanced geometries by an incomplete bbox:
    // only normal merged Mesh batches are part of the pilot.
    if((m as THREE.InstancedMesh).isInstancedMesh){untouched++;return;}
    if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();
    if(!m.geometry.boundingBox){untouched++;return;}
    bounds.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);
    if(!areas.some(area=>bounds.intersectsBox(area))){skippedByBox++;return;}
    // Large architectural, timber, stone and upholstery surfaces carry the
    // stable bounce. Small painted ornaments/metalwork keep their original
    // shaders: they neither need an orange wash nor another program variant.
    // Local library desk details are authored as painted objects. Include
    // only mLib paint (not world-wide paint) in the source-bound desk pool.
    const profile=mat.userData.surface;
    if(!['plaster','timber','stone','fabric'].includes(profile) &&
       !(STABLE_ROOMS_PILOT && chunk==='mLib' && profile==='paint')){
       untouched++;return;
    }
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
  if(STABLE_ROOMS_PILOT){
    const sources=ROOM_SOURCE_IDS.map(id=>w.lamps.find(l=>l.id===id));
    if(sources.some(l=>!l))throw new Error('LIGHT-R08: missing hall/library fixture');
    const radii=[9,5,9,4.5];
    sources.forEach((lamp,i)=>roomPositions[i].set(lamp!.pos.x,lamp!.pos.y,lamp!.pos.z,
      Math.min(radii[i],lamp!.distance)));
    // Hall chandelier must read from the actual arch, while library carpet
    // and plaster retain texture rather than flattening into an orange patch.
    const strength=[0.16,0.085,0.095,0.095];
    const update=()=>sources.forEach((lamp,i)=>{
      roomColors[i].w=lamp!.on()?strength[i]:0;
    });
    w.onSync(update);
    update();
    w.scene.userData.stableRooms={
      mode:'source-bound-hall-library',
      sources:[...ROOM_SOURCE_IDS],
      state:()=>roomColors.map(col=>col.w),
      hallMask:(x:number,y:number,z:number)=>stableHallMaskAt(x,y,z),
      libraryMask:(x:number,y:number,z:number)=>stableLibraryMaskAt(x,y,z),
    };
  }
}
