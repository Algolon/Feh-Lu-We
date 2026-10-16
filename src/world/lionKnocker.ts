// FRONT-R04 — authored volumetric lion mesh, baked offline with explicit anatomy.
// Unlike the old radial heightfield, this is a full, closed 3D sculpture with
// nontrivial depth and shaped rear/side silhouette. No runtime SDF calculations.
import * as THREE from 'three';
import { geo, type Batcher } from './kit';
import { LION_SCULPT } from './lionSculptData';

export const LION_BRONZE = {
  recess: '#242322',
  body: '#393631',
  middle: '#605442',
  polished: '#a38a62',
} as const;
const BASE = new THREE.Color(LION_BRONZE.body);
const MID = new THREE.Color(LION_BRONZE.middle);
const HILITE = new THREE.Color(LION_BRONZE.polished);
const RECESS = new THREE.Color(LION_BRONZE.recess);
const clamp = (x:number) => Math.max(0,Math.min(1,x));
function bronzeColor(wear:number,shadow:number):THREE.Color {
  const c=BASE.clone().lerp(MID,clamp(.25+wear*.55));
  c.lerp(HILITE,clamp(wear*.78));
  c.lerp(RECESS,clamp(shadow*.91));
  return c;
}
function decodeBase64(s:string):Uint8Array {
  const raw=atob(s);
  const a=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);
  return a;
}

/**
 * Load the hand-shaped, baked, indexed watertight low/mid-poly ornament.
 * Geometry is local Three.js space (front = +Z), with a planar mounting back.
 * The resulting mesh is one contiguous 3D object, not a collection of spheres.
 */
export function lionHeadSculptGeometry():THREE.BufferGeometry {
  const src=LION_SCULPT;
  const packedPos=decodeBase64(src.positions);
  const packedColors=decodeBase64(src.colors);
  const packedIndices=decodeBase64(src.indices);
  const pos=new Int16Array(packedPos.buffer,packedPos.byteOffset,packedPos.byteLength/2);
  const ix=new Uint16Array(packedIndices.buffer,packedIndices.byteOffset,packedIndices.byteLength/2);
  if(pos.length!==src.vertexCount*3||packedColors.length!==src.vertexCount*3||ix.length!==src.triangleCount*3)
    throw new Error('FRONT-R04 mesh payload length mismatch');
  const p=new Float32Array(pos.length),colors=new Float32Array(pos.length);
  const uv=new Float32Array(src.vertexCount*2);
  for(let i=0;i<src.vertexCount;i++){
    for(let j=0;j<3;j++) {
      p[i*3+j]=pos[i*3+j]/src.coordinateScale;
      colors[i*3+j]=packedColors[i*3+j]/255;
    }
    uv[i*2]=.5+p[i*3]/.33;
    uv[i*2+1]=.5+p[i*3+1]/.39;
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(p,3));
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  g.setIndex(Array.from(ix));
  g.computeVertexNormals();
  g.userData.keepColor=true;
  return g;
}

/** Backwards-compatible geometry hook for existing tests and callers. */
export const lionHeadReliefGeometry=lionHeadSculptGeometry;

/** Matching aged-bronze patina on 3D cylindrical pulls or the knocker ring. */
export function castBronzeMetal(g:THREE.BufferGeometry):THREE.BufferGeometry {
  const pos=g.attributes.position as THREE.BufferAttribute;
  const norm=g.attributes.normal as THREE.BufferAttribute;
  const colors:number[]=[];
  for(let i=0;i<pos.count;i++){
    const n=norm.getX(i),m=norm.getZ(i);
    const ridge=Math.pow(Math.abs(n),9); // rubbed gold along two narrow shaft edges
    const front=Math.max(0,m);
    const col=bronzeColor(.12+.77*ridge+.07*front,.08+(1-front)*.32);
    colors.push(col.r,col.g,col.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.userData.keepColor=true;
  return g;
}

export function addLionKnocker(b:Batcher,metal:THREE.Material,cx:number,cy:number,th:number){
  const front=-th/2;
  const relief=lionHeadSculptGeometry();
  // Keep the back against timber, face raised into outdoor space.
  geo(b,metal,'#ffffff',relief,cx,cy,front-.012,{jitter:0});
  relief.dispose();

  // The ring is caught by the dark open jaw; its top passes under the muzzle.
  const ring=castBronzeMetal(new THREE.TorusGeometry(.062,.009,9,32));
  geo(b,metal,'#ffffff',ring,cx,cy-.178,front-.127,{jitter:0});
  ring.dispose();
  const stop=castBronzeMetal(new THREE.SphereGeometry(.013,12,8));
  geo(b,metal,'#ffffff',stop,cx,cy-.248,front-.035,{jitter:0});
  stop.dispose();
}
