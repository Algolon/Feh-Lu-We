import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {installOpaqueBatches} from '../src/world/opaqueBatches';
import type {World} from '../src/interactions/world';
function fixture(){
 const scene=new THREE.Scene(),mat=new THREE.MeshLambertMaterial({vertexColors:true}),meshes:THREE.Mesh[]=[];
 for(let i=0;i<4;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),mat);m.geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(m.geometry.attributes.position.count*3).fill(1),3));m.position.x=(i-1.5)*.7;scene.add(m);meshes.push(m);}
 const camera=new THREE.PerspectiveCamera(70,1,.1,30);camera.position.z=5;camera.updateMatrixWorld();camera.updateProjectionMatrix();
 installOpaqueBatches({scene} as unknown as World);
 const renderer={shadowMap:{enabled:false}} as THREE.WebGLRenderer;
 const before=()=>{scene.updateMatrixWorld(true);scene.onBeforeRender(renderer,scene,camera,null as never,null as never,null as never);};
 const after=()=>scene.onAfterRender(renderer,scene,camera,null as never,null as never,null as never);
 const batch=scene.children.find(o=>o.userData.opaqueAggregate) as THREE.Mesh;
 return {scene,meshes,camera,renderer,before,after,batch};
}
describe('opaque render aggregation invariants',()=>{
 it('suppresses sources only inside rendering, preserving gameplay visibility afterwards',()=>{
  const f=fixture();f.before();expect(f.meshes.every(m=>!m.visible)).toBe(true);expect(f.batch.visible).toBe(true);f.after();expect(f.meshes.every(m=>m.visible)).toBe(true);
 });
 it('preserves parent/child visibility and excludes genuinely hidden sources',()=>{
  const f=fixture();f.meshes[0].add(f.meshes[1]);f.meshes[2].visible=false;f.before();expect(f.scene.userData.opaqueBatches.submittedSources).toBe(3);f.after();expect(f.meshes[2].visible).toBe(false);expect(f.meshes[1].visible).toBe(true);
 });
 it('updates moving transforms and returns to native rendering for replacement geometry',()=>{
  const f=fixture();f.before();f.after();const old=Array.from(f.batch.geometry.attributes.position.array);f.meshes[0].position.y=1;f.before();f.after();expect(Array.from(f.batch.geometry.attributes.position.array)).not.toEqual(old);
  f.meshes[1].geometry=new THREE.SphereGeometry(.2,8,5);f.before();expect(f.meshes[1].visible).toBe(true);expect(f.scene.userData.opaqueBatches.submittedSources).toBe(3);f.after();
 });
 it('leaves the high-quality shadow path untouched and survives quality switching',()=>{
  const f=fixture();f.before();f.after();f.renderer.shadowMap.enabled=true;f.before();expect(f.meshes.every(m=>m.visible)).toBe(true);expect(f.batch.visible).toBe(false);f.after();f.renderer.shadowMap.enabled=false;f.before();expect(f.batch.visible).toBe(true);f.after();
 });
 it('tracks vertex colour changes on existing geometry',()=>{
  const f=fixture();const src=f.meshes[0].geometry;src.setAttribute('color',new THREE.Float32BufferAttribute(src.attributes.position.count*3,3));f.before();f.after();const old=Array.from(f.batch.geometry.attributes.color.array);(src.attributes.color as THREE.BufferAttribute).setXYZ(0,1,.5,.25);src.attributes.color.needsUpdate=true;f.before();f.after();expect(Array.from(f.batch.geometry.attributes.color.array)).not.toEqual(old);
 });
});
