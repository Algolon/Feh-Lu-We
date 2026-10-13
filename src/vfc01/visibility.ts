import * as T from 'three';
import type {Game} from '../core/game';
import {variant,q} from './config';
/** Lab-only typed-at-boundary adapters. Keep native room/portal and tree LOD logic. */
export function visibility(game:Game){const w=game.world! as any;
 if(q.has('hero-test')){const item=w.byId.get('lamp.cottageEntry');const delta=new T.Vector3(28.4,5.95,-151.97).sub(item.obj.position);item.obj.position.add(delta);item.focus.add(delta);item.obj.updateWorldMatrix(true,true);const c=w.cullables.find((c:any)=>c.root===item.obj);if(c){c.pos.add(delta);c.rooms=['out'];}const lamp=w.lamps.find((l:any)=>l.id==='lamp.cottageEntry');if(lamp){lamp.pos.add(delta);lamp.room='out';}}
 if(variant==='V4')for(const c of w.cullables){if(c.rooms?.some((r:string)=>['library','cottageRoom'].includes(r))||(q.has('hero-test')&&c.root===w.byId.get('lamp.cottageEntry').obj))c.dist2=Infinity;}
 if(variant==='V4')for(const region of w.regions){if(region.meshes.some((m:T.Object3D)=>m.userData.chunk==='cottage'))region.far=Infinity;}
 const card=new T.Mesh(new T.PlaneGeometry(.06,.09),new T.MeshLambertMaterial({color:0xf2ead8,side:T.DoubleSide,alphaHash:variant==='V4'}));card.position.set(27.2,4.925,-154.3);card.rotation.x=-Math.PI/2;card.userData.noCull=true;card.name='vfc-micro-card';if(q.has('lodtest'))w.scene.add(card);let on=true;
 const update=()=>{const eye=game.camera.position,d=eye.distanceTo(card.position),px=.09*game.renderer.domElement.clientHeight/(2*Math.tan(game.camera.fov*Math.PI/360)*d);if(variant==='V4'){if(on&&px<1.5)on=false;if(!on&&px>2.5)on=true;card.material.opacity=T.MathUtils.clamp((px-1.5)/2.5,0,1);}else on=d<24;const region=w.regions.find((r:any)=>r.meshes.some((m:T.Object3D)=>m.userData.chunk==='cottage'));card.visible=on&&(region?.on??true);
 for(const m of w.scene.children.filter((m:T.Object3D)=>m.userData.vfcSupport)){const rr=w.regions.find((r:any)=>r.meshes.some((c:T.Object3D)=>c.userData.chunk===(m.userData.chunk==='library'?'mLib':m.userData.chunk)));m.visible=rr?.on??true;}
 return {micro:{distance:d,projectedPx:px,on:card.visible,opacity:card.material.opacity},regions:w.regions.filter((r:any)=>r.meshes.some((m:T.Object3D)=>['cottage','library'].includes(m.userData.chunk))).map((r:any)=>({on:r.on,far:Number.isFinite(r.far)?r.far:null,rooms:Array.from(r.rooms)})),hero:{visible:!w.isCulled(w.byId.get('lamp.cottageEntry').obj),position:w.byId.get('lamp.cottageEntry').obj.position.toArray()},vegetation:w.scene.userData.vegStats?.()};};return update;
}
