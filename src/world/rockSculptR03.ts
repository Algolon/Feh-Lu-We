/** ROCK-R01 / A01-R03: isolated Three.js adapter. NOT approved or used by production. */
import * as THREE from 'three';
import { buildHeroR03, type BoulderR03Params } from './rockSculptR03Core';
export function rockR03Geometry(opts:BoulderR03Params={}):THREE.BufferGeometry {
  const src=buildHeroR03(opts);
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(src.positions,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(src.normals,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(src.colors,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(src.uv,2));
  geo.computeBoundingBox();geo.computeBoundingSphere();
  geo.name='HeroBoulder_A01_R03_UNAPPROVED';
  geo.userData.keepColor=true;
  geo.userData.rockR03={triangles:src.triangles,pieces:src.pieces,seed:src.seed,
    detail:src.detail,artApproved:false,productionIntegrated:false};
  return geo;
}
export function rockR03Material():THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:0.91,metalness:0,side:THREE.FrontSide});
}
