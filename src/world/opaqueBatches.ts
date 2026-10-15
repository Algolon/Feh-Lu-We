// Low-quality opaque draw aggregation. Original objects retain ownership, transforms, picking and culling.
// Only meshes the normal renderer would draw are submitted. Originals are hidden during render only,
// then restored before gameplay runs again. No transparency, vegetation instances or shader animations.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import { onFrame } from './vegbatch';
interface Source { mesh:THREE.Mesh; geometry:THREE.BufferGeometry; offset:number; count:number; indices:number[]; matrix:THREE.Matrix4; version:string; flip:boolean }
interface Batch { mesh:THREE.Mesh; sources:Source[]; positions:THREE.BufferAttribute; normals:THREE.BufferAttribute; last:string }
const LIMIT=350_000, MAX_SOURCE=24_000;
const allowed=new Set(['position','normal','uv','color']);
export function installOpaqueBatches(w:World) {
  const disabled=typeof location!=='undefined'&&new URLSearchParams(location.search).get('batch')==='base';
  const state={enabled:!disabled,groups:0,sources:0,vertices:0,attributeBytes:0,submittedSources:0};w.scene.userData.opaqueBatches=state;
  const grouped=new Map<string,THREE.Mesh[]>();
  w.scene.traverse(o=>{
    const m=o as THREE.Mesh,g=m.geometry,mat=m.material as THREE.Material;
    if(!m.isMesh||(m as THREE.InstancedMesh).isInstancedMesh||(m as THREE.BatchedMesh).isBatchedMesh||(m as THREE.SkinnedMesh).isSkinnedMesh||m.morphTargetInfluences||!g||Array.isArray(m.material))return;
    if(!['MeshLambertMaterial','MeshPhongMaterial','MeshBasicMaterial','MeshStandardMaterial'].includes(mat.type)||mat.transparent||!mat.depthWrite||m.userData.hit)return;
    if(m.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender||Object.keys(g.attributes).some(k=>!allowed.has(k))||g.drawRange.start!==0||g.drawRange.count!==Infinity)return;
    const n=g.attributes.position?.count;if(!n||n>MAX_SOURCE||!g.attributes.normal)return;
    const key=[mat.uuid,m.renderOrder,m.receiveShadow,m.layers.mask].join('|');
    const list=grouped.get(key)??[];list.push(m);grouped.set(key,list);
  });
  const batches:Batch[]=[];
  for(const list of [...grouped.values()].sort((a,b)=>b.length-a.length)) {
    if(list.length<3)continue;
    const selected:THREE.Mesh[]=[];let n=0;
    for(const m of list.sort((a,b)=>a.geometry.attributes.position.count-b.geometry.attributes.position.count)) {
      const count=m.geometry.attributes.position.count;if(state.vertices+n+count>LIMIT)continue;selected.push(m);n+=count;
    }
    if(selected.length<3)continue;
    const g=new THREE.BufferGeometry(),pos=new THREE.Float32BufferAttribute(n*3,3),norm=new THREE.Float32BufferAttribute(n*3,3),uv=new THREE.Float32BufferAttribute(n*2,2),color=new THREE.Float32BufferAttribute(n*3,3);
    pos.setUsage(THREE.DynamicDrawUsage);norm.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position',pos);g.setAttribute('normal',norm);g.setAttribute('uv',uv);g.setAttribute('color',color);
    const sources:Source[]=[];let offset=0,indexCount=0;
    for(const m of selected) {
      const src=m.geometry,p=src.attributes.position;
      const indices=src.index?Array.from(src.index.array):Array.from({length:p.count},(_,i)=>i);
      sources.push({mesh:m,geometry:src,offset,count:p.count,indices,matrix:new THREE.Matrix4().set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0),version:'',flip:false});
      for(let i=0;i<p.count;i++){
        uv.setXY(offset+i,src.attributes.uv?.getX(i)??0,src.attributes.uv?.getY(i)??0);
        color.setXYZ(offset+i,src.attributes.color?.getX(i)??1,src.attributes.color?.getY(i)??1,src.attributes.color?.getZ(i)??1);
      }
      offset+=p.count;indexCount+=indices.length;
    }
    const index=new THREE.Uint32BufferAttribute(indexCount,1);index.setUsage(THREE.DynamicDrawUsage);g.setIndex(index);g.setDrawRange(0,0);
    const mesh=new THREE.Mesh(g,selected[0].material);mesh.receiveShadow=selected[0].receiveShadow;mesh.renderOrder=selected[0].renderOrder;mesh.layers.mask=selected[0].layers.mask;
    mesh.frustumCulled=false;mesh.visible=false;mesh.matrixAutoUpdate=false;mesh.userData={static:true,noCull:true,opaqueAggregate:true};w.scene.add(mesh);
    batches.push({mesh,sources,positions:pos,normals:norm,last:''});state.vertices+=n;state.sources+=sources.length;state.attributeBytes+=n*44+indexCount*4;
  }
  state.groups=batches.length;
  const hidden:THREE.Mesh[]=[],frustum=new THREE.Frustum(),pv=new THREE.Matrix4(),normal=new THREE.Matrix3(),v=new THREE.Vector3();
  const restore=()=>{for(const m of hidden)m.visible=true;hidden.length=0;};
  const prev=w.scene.onAfterRender;
  w.scene.onAfterRender=function(...args){restore();prev.apply(this,args);};
  onFrame(w,(camera,renderer)=>{
    restore();state.submittedSources=0;
    const active=state.enabled&&!renderer.shadowMap.enabled;
    frustum.setFromProjectionMatrix(pv.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    for(const batch of batches){
      batch.mesh.visible=false;if(!active)continue;
      const visible:number[]=[];let changed=false;batch.positions.clearUpdateRanges();batch.normals.clearUpdateRanges();
      for(let si=0;si<batch.sources.length;si++){
        const s=batch.sources[si],m=s.mesh;let on=true;for(let p:THREE.Object3D|null=m;p;p=p.parent)if(!p.visible){on=false;break;}
        if(!on||!m.layers.test(camera.layers)||(m.frustumCulled&&!frustum.intersectsObject(m)))continue;
        const src=m.geometry,p=src.attributes.position,n=src.attributes.normal;
        if(src!==s.geometry||p.count!==s.count||m.material!==batch.mesh.material||(src.index?.count??p.count)!==s.indices.length)continue; // a replaced/LOD geometry keeps its normal renderer path
        const ver=(a:THREE.BufferAttribute|THREE.InterleavedBufferAttribute|undefined)=>!a?'':((a as THREE.BufferAttribute).version??(a as THREE.InterleavedBufferAttribute).data.version);
        const version=[ver(p),ver(n),ver(src.attributes.uv),ver(src.attributes.color),src.index?.version??0].join('|');
        if(!s.matrix.equals(m.matrixWorld)||s.version!==version){
          s.matrix.copy(m.matrixWorld);s.version=version;s.indices=src.index?Array.from(src.index.array):s.indices;s.flip=m.matrixWorld.determinant()<0;normal.getNormalMatrix(m.matrixWorld);
          for(let i=0;i<s.count;i++){
            v.fromBufferAttribute(p as THREE.BufferAttribute,i).applyMatrix4(m.matrixWorld);batch.positions.setXYZ(s.offset+i,v.x,v.y,v.z);
            v.fromBufferAttribute(n as THREE.BufferAttribute,i).applyMatrix3(normal).normalize();batch.normals.setXYZ(s.offset+i,v.x,v.y,v.z);
            (batch.mesh.geometry.attributes.uv as THREE.BufferAttribute).setXY(s.offset+i,src.attributes.uv?.getX(i)??0,src.attributes.uv?.getY(i)??0);
            (batch.mesh.geometry.attributes.color as THREE.BufferAttribute).setXYZ(s.offset+i,src.attributes.color?.getX(i)??1,src.attributes.color?.getY(i)??1,src.attributes.color?.getZ(i)??1);
          }
          batch.positions.addUpdateRange(s.offset*3,s.count*3);batch.normals.addUpdateRange(s.offset*3,s.count*3);changed=true;
        }
        visible.push(si);hidden.push(m);
      }
      if(changed){batch.positions.needsUpdate=true;batch.normals.needsUpdate=true;batch.mesh.geometry.attributes.uv.needsUpdate=true;batch.mesh.geometry.attributes.color.needsUpdate=true;}
      const key=visible.join(',');
      if(batch.last!==key||changed){
        const index=batch.mesh.geometry.index!;let at=0;
        for(const i of visible){const s=batch.sources[i];for(let j=0;j<s.indices.length;j+=3){index.setX(at++,s.offset+s.indices[j]);index.setX(at++,s.offset+s.indices[j+(s.flip?2:1)]);index.setX(at++,s.offset+s.indices[j+(s.flip?1:2)]);}}
        index.needsUpdate=true;batch.mesh.geometry.setDrawRange(0,at);batch.last=key;
      }
      state.submittedSources+=visible.length;batch.mesh.visible=visible.length>0;
    }
    // Defer suppression until every source is classified: a candidate parent may contain another candidate.
    for(const m of hidden)m.visible=false;
  },true);
}
