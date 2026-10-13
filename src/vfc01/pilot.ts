import * as T from 'three';
import {Batcher,getKit} from '../world/kit';
import {artMats,softBox} from '../world/artkit';
import {geometryPilot,materialPilot,objects,zoneAt,q} from './config';
import {pilotMaterial} from './materials';
export const pilotStats={affected:0,timber:0,beveled:0,objects:{} as Record<string,number>,addedTriangles:0};
const box=new T.Box3(),pos=new T.Vector3(),sz=new T.Vector3();
function uv(g:T.BufferGeometry,old?:T.BufferGeometry,family='timber'){g.computeBoundingBox();const b=g.boundingBox!,dims=b.getSize(new T.Vector3()),p=g.attributes.position,nn=g.attributes.normal;const axis=dims.y>=dims.x&&dims.y>=dims.z?'y':dims.x>=dims.z?'x':'z';const uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){const a=[Math.abs(nn.getX(i)),Math.abs(nn.getY(i)),Math.abs(nn.getZ(i))],face=a.indexOf(Math.max(...a));const v=[p.getX(i),p.getY(i),p.getZ(i)];let u:number,w:number;
 if(!old){const grain=axis==='x'?0:axis==='y'?1:2;const cross=[0,1,2].find(j=>j!==grain&&j!==face)??(grain+1)%3;u=v[cross]/.55;w=v[grain]/1.5;if(face===grain){u=v[(grain+1)%3]/.55;w=v[(grain+2)%3]/.55;}if(family!=='timber'){const axes=face===0?[2,1]:face===1?[0,2]:[0,1],period=family==='fabric'?.25:family==='plaster'?2.5:family==='tile'?1:1.8;u=v[axes[0]]/period;w=v[axes[1]]/period;}}
 else {const axes=face===0?[2,1]:face===1?[0,2]:[0,1],lo=[b.min.x,b.min.y,b.min.z],d=[dims.x,dims.y,dims.z];u=(v[axes[0]]-lo[axes[0]])/d[axes[0]];w=(v[axes[1]]-lo[axes[1]])/d[axes[1]]; // preserve each production face's affine UV orientation/scale
 const op=old.attributes.position,on=old.attributes.normal,ou=old.attributes.uv;const pts:number[][]=[];
 if(ou)for(let j=0;j<op.count;j++){const na=[Math.abs(on.getX(j)),Math.abs(on.getY(j)),Math.abs(on.getZ(j))];if(na.indexOf(Math.max(...na))===face&&Math.sign([on.getX(j),on.getY(j),on.getZ(j)][face])===Math.sign([nn.getX(i),nn.getY(i),nn.getZ(i)][face]))pts.push([[op.getX(j),op.getY(j),op.getZ(j)][axes[0]],[op.getX(j),op.getY(j),op.getZ(j)][axes[1]],ou.getX(j),ou.getY(j)]);}
 if(pts.length){const x0=Math.min(...pts.map(a=>a[0])),x1=Math.max(...pts.map(a=>a[0])),y0=Math.min(...pts.map(a=>a[1])),y1=Math.max(...pts.map(a=>a[1]));const corner=(x:number,y:number)=>pts.find(a=>Math.abs(a[0]-x)<1e-5&&Math.abs(a[1]-y)<1e-5);const a0=corner(x0,y0),ax=corner(x1,y0),ay=corner(x0,y1);if(a0&&ax&&ay){const uu=u,vv=w;u=a0[2]+uu*(ax[2]-a0[2])+vv*(ay[2]-a0[2]);w=a0[3]+uu*(ax[3]-a0[3])+vv*(ay[3]-a0[3]);}}
 }
 uv[i*2]=u;uv[i*2+1]=w;}
 g.setAttribute('uv',new T.BufferAttribute(uv,2));return g;
}
/** Scoped build adapter, restored in finally by the lab. Production builders stay unchanged. */
export function intercept(){const original=Batcher.prototype.add,k=getKit(),a=artMats();const fam=new Map<T.Material,string>([[k.M.wood,'timber'],[a.timber,'timber'],[k.M.plaster,'plaster'],[k.M.stone,'limestone'],[a.stone,'limestone'],[k.M.tile,'tile'],[a.upholstery,'fabric'],[a.paint,'paint'],[k.M.paint,'paint']]);
 Batcher.prototype.add=function(mat,geo,m,color,chunk,shadow,jitter){geo.computeBoundingBox();box.copy(geo.boundingBox!).applyMatrix4(m);box.getCenter(pos);box.getSize(sz);const zone=zoneAt(pos.x,pos.y,-pos.z),family=fam.get(mat);let g=geo,changed=false;
 if(zone&&family&&[box.min,box.max].every(p=>zoneAt(p.x,p.y,-p.z)===zone)){
 const object=objects.find(o=>Math.abs(pos.x-o.x)+sz.x/2<=o.sx/2+.03&&Math.abs(-pos.z-o.z)+sz.z/2<=o.sz/2+.03&&box.min.y>=o.y-.05&&box.max.y<=o.y+o.h+.05);
 if(geometryPilot&&family==='timber'&&object&&(geo.index?geo.index.count:geo.attributes.position.count)===36){const b=geo.boundingBox!,s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());g=softBox(s.x,s.y,s.z,Math.min(.012,Math.min(s.x,s.y,s.z)*.14),1,1).translate(c.x,c.y,c.z);g=uv(g,geo);if(q.get('normals')==='flat'){const ng=g.toNonIndexed();g.dispose();g=ng;g.computeVertexNormals();}changed=true;pilotStats.beveled++;pilotStats.objects[object.id]=(pilotStats.objects[object.id]??0)+1;}
 if(materialPilot&&(!q.has('selected')||['timber','tile','limestone'].includes(family))){if(!changed)g=geo.clone();uv(g,undefined,family);changed=true;mat=pilotMaterial(family);pilotStats.affected++;if(family==='timber'){pilotStats.timber++;const tint=new T.Color(color);tint.multiplyScalar(1.05);color=tint;}}
 }
 original.call(this,mat,g,m,color,chunk,shadow,jitter);if(changed)g.dispose();};return()=>{Batcher.prototype.add=original;};}
export function supports(scene:T.Scene){if(!geometryPilot)return;const b=new Batcher(),mat=materialPilot?pilotMaterial('timber'):getKit().M.wood;
 const member=(from:T.Vector3,to:T.Vector3,w:number,d:number,chunk:string)=>{const delta=to.clone().sub(from),g=uv(softBox(w,delta.length(),d,.006,1,1)),m=new T.Matrix4().compose(from.clone().add(to).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()),new T.Vector3(1,1,1));pilotStats.addedTriangles+=(g.index?.count??g.attributes.position.count)/3;b.add(mat,g,m,'#6b4426',chunk,true,0);g.dispose();};
 for(const x of [21.6,28.4])for(const sign of [-1,1])member(new T.Vector3(x,6.05,-152.18),new T.Vector3(x+sign*.5,6.83,-152.18),.09,.09,'cottage');
 for(const [x,z,w,d,ch,y] of [[27.2,154.6,2.2,1,'cottage',4.15],[80.6,101.2,1.1,2.2,'library',.15]] as const){const lx=w/2-.08,lz=d/2-.08;for(const s of [-1,1])member(new T.Vector3(x+s*lx,y+.18,-z-lz),new T.Vector3(x+s*lx,y+.18,-z+lz),.04,.05,ch);member(new T.Vector3(x-lx,y+.18,-z),new T.Vector3(x+lx,y+.18,-z),.04,.05,ch);}
 const meshes=b.build(scene);for(const m of meshes){m.userData.vfcSupport=true;m.userData.noCull=true;}
}
