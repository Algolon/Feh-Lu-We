/** ROCK-R01 A01-R02: Three.js adapter; experiment only, no production integration. */
import * as THREE from 'three';
import { buildHeroR02, type HeroRockParams } from './rockSculptR02Core';

export function rockR02Geometry(opts:HeroRockParams={}): THREE.BufferGeometry {
  const src=buildHeroR02(opts);
  // Source emits identical positions at shared tetrahedral grid edges.
  // Indexing saves GPU memory while keeping the topology and normals intact.
  const dedupe=new Map<string,number>();
  const pos:number[]=[],normals:number[]=[],colors:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let i=0;i<src.positions.length/3;i++){
    const j=i*3,u=i*2;
    const key=[...src.positions.slice(j,j+3),...src.normals.slice(j,j+3)]
      .map(x=>x.toFixed(6)).join(',');
    let idx=dedupe.get(key);
    if(idx===undefined){idx=pos.length/3;dedupe.set(key,idx);
      pos.push(...src.positions.slice(j,j+3));normals.push(...src.normals.slice(j,j+3));
      colors.push(...src.colors.slice(j,j+3));uv.push(...src.uv.slice(u,u+2));}
    indices.push(idx);
  }
  const g=new THREE.BufferGeometry();
  g.setIndex(indices);
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.computeBoundingBox();g.computeBoundingSphere();
  g.name='ROCK_R01_HeroBoulder_A01_R02_EXPERIMENT';
  g.userData.keepColor=true;
  g.userData.rockR02={triangles:src.triangles,vertices:pos.length/3,opts:src.options,artApproved:false};
  return g;
}
export function rockR02Material():THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:0.93,metalness:0});
}
