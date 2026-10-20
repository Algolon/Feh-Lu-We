/** ROCK-R01 / A01-R04: isolated Three.js adapter. NOT approved or used by production. */
import * as THREE from 'three';
import { buildHeroR04, type BoulderR04Params } from './rockSculptR04Core';
export function rockR04Geometry(opts:BoulderR04Params={}):THREE.BufferGeometry {
  const src=buildHeroR04(opts);
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(src.positions,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(src.normals,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(src.colors,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(src.uv,2));
  geo.computeBoundingBox();geo.computeBoundingSphere();
  geo.name='HeroBoulder_A01_R04_UNAPPROVED';
  geo.userData.keepColor=true;
  geo.userData.rockR04={triangles:src.triangles,pieces:src.pieces,seed:src.seed,
    detail:src.detail,artApproved:false,productionIntegrated:false};
  return geo;
}
export function rockR04Material():THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:0.91,metalness:0,side:THREE.FrontSide});
}
