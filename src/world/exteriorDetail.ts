// EXT-R05: small constructed joints and an authored entrance leaf. Gameplay stays with makeDoor.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { box, boxMM, boxGeo, planMatrix, geo, rod, type Batcher, type Kit, type PartOpts } from './kit';
import { mulberry32 } from '../core/rng';
import { softBox } from './artkit';

export const EXTERIOR_DETAILS = typeof location==='undefined'||new URLSearchParams(location.search).get('details')!=='base';
export const ENTRANCE_METAL={iron:'#343c37',bronze:'#9a895f',shadow:'#625b43'};
export function entrancePanels(width:number,height:number) {
  const stile=.145,centre=.05;
  return [[stile,width/2-centre],[width/2+centre,width-stile]].flatMap(([x0,x1])=>
    [[.14,height*.43-.055],[height*.43+.055,height-.14]].map(([y0,y1])=>({x0,x1,y0,y1})));
}
let doorTimber:THREE.Material|undefined;
function entranceTimber(base:THREE.Material) {
  if(typeof document==='undefined')return base;
  if(doorTimber)return doorTimber;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const x=canvas.getContext('2d')!,r=mulberry32(505);
  x.fillStyle='#ece5d8';x.fillRect(0,0,256,256);
  for(let i=0;i<420;i++) {
    const at=r()*256,phase=r()*6;
    x.strokeStyle=i%3?'rgba(134,117,90,.07)':'rgba(255,249,231,.12)';x.lineWidth=.5+r();x.beginPath();
    for(let y=0;y<=256;y+=8){const a=at+Math.sin(y/256*Math.PI*2+phase)*1.5;if(y===0)x.moveTo(a,y);else x.lineTo(a,y);}x.stroke();
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
  const mat=(base as THREE.MeshLambertMaterial).clone();mat.map=map;doorTimber=mat;return mat;
}
function timber(b:Batcher,mat:THREE.Material,color:THREE.ColorRepresentation,x:number,y:number,z:number,sx:number,sy:number,sz:number,_opts:PartOpts={}) {
  const g=boxGeo(sx,sy,sz,.8),uv=g.attributes.uv as THREE.BufferAttribute;
  // The texture's grain runs along V; turn it along horizontal rails, keep it upright on stiles/fields.
  if(sx>sy)for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getY(i),uv.getX(i));
  b.add(mat,g,planMatrix(x,y+sy/2,z),color,'main',true,0);g.dispose();
}

/** Four genuinely recessed fields carried between stiles and rails; all metal follows the same hinge. */
export function frontDoorLeaf(b:Batcher,k:Kit,width:number,height:number,th:number,color:THREE.ColorRepresentation) {
  const wood=entranceTimber(k.M.wood),metal=k.M.paint,col=new THREE.Color(color),frame=col.clone().multiplyScalar(1.04);
  const rail=.14,mid=height*.43;
  for(const x of [rail/2,width-rail/2])timber(b,wood,frame,x,0,0,rail,height,th,{uv:1.2,jitter:0});
  timber(b,wood,frame,width/2,0,0,width-2*rail,.14,th,{uv:1.2,jitter:0});
  timber(b,wood,frame,width/2,height-.14,0,width-2*rail,.14,th,{uv:1.2,jitter:0});
  timber(b,wood,frame,width/2,mid-.055,0,width-2*rail,.11,th,{uv:1.2,jitter:0});
  timber(b,wood,frame,width/2,.14,0,.10,height-.28,th,{uv:1.2,jitter:0});
  for(const p of entrancePanels(width,height)) {
    const w=p.x1-p.x0,h=p.y1-p.y0,cx=(p.x0+p.x1)/2;
    timber(b,wood,col.clone().multiplyScalar(.88),cx,p.y0,0,w+.012,h+.012,th*.54,{uv:1.2,jitter:0});
    for(const side of [-1,1]) {
      const z=side*(th/2-.004);
      for(const x of [p.x0+.018,p.x1-.018])timber(b,wood,col,x,p.y0+.018,z,.036,h-.036,.018,{uv:1.2,jitter:0});
      for(const y of [p.y0+.018,p.y1-.054])timber(b,wood,col,cx,y,z,w-.072,.036,.018,{uv:1.2,jitter:0});
    }
  }
  for(const side of [-1,1]) {
    const z=side*(th/2+.011),x=width-.105;
    const plate=softBox(.06,.23,.018,.009);geo(b,metal,ENTRANCE_METAL.shadow,plate,x,1.06,z,{jitter:0});plate.dispose();
    rod(b,metal,ENTRANCE_METAL.bronze,x,1.09,z+side*.02,.018,.018,.045,8,{rx:Math.PI/2,jitter:0});
    rod(b,metal,ENTRANCE_METAL.bronze,x-.045,1.09,z+side*.04,.014,.014,.105,8,{rz:Math.PI/2,jitter:0});
    const key=new THREE.CircleGeometry(.008,8);geo(b,metal,'#30362e',key,x,1.005,z+side*.011,{rx:side===1?Math.PI:0,jitter:0});key.dispose();
  }
  // A restrained bronze knocker, on the exterior centre stile.
  const z=-th/2-.018,plate=softBox(.065,.20,.018,.009);
  geo(b,metal,ENTRANCE_METAL.shadow,plate,width/2,height*.65,z,{jitter:0});plate.dispose();
  const ring=new THREE.TorusGeometry(.052,.009,5,16);ring.scale(1,1.22,1);
  geo(b,metal,ENTRANCE_METAL.bronze,ring,width/2,height*.65-.012,z-.018,{jitter:0});ring.dispose();
  for(const y of [.28,height*.5,height-.28])rod(b,metal,ENTRANCE_METAL.iron,.035,y,-th/2,.012,.012,.10,8,{jitter:0});
}
/** Mounting plate → bowed arm → small hanging ring, ending at the existing lantern cap. */
export function lanternMount(c:Ctx,x:number,wallZ:number,lanternZ:number,capY:number) {
  const plate=softBox(.085,.22,.022,.012);
  geo(c.b,c.k.M.paint,ENTRANCE_METAL.iron,plate,x,capY+.035,wallZ-.015,{chunk:c.chunk,shadow:false,jitter:0});plate.dispose();
  const pts=[[x,capY+.04,wallZ-.028],[x,capY+.15,wallZ-.10],[x,capY+.17,lanternZ+.03],[x,capY+.07,lanternZ]];
  const arm=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([a,b,z])=>new THREE.Vector3(a,b,-z))),10,.012,6,false);
  c.b.add(c.k.M.paint,arm,new THREE.Matrix4(),ENTRANCE_METAL.iron,c.chunk,false,0);arm.dispose();
  const ring=new THREE.TorusGeometry(.026,.007,5,12);ring.rotateY(Math.PI/2);
  geo(c.b,c.k.M.paint,ENTRANCE_METAL.iron,ring,x,capY+.037,lanternZ,{chunk:c.chunk,shadow:false,jitter:0});ring.dispose();
}
/** Low drain below the existing shoe; no raised obstacle is added to the walk surface. */
export function drainGrate(c:Ctx,x:number,z:number) {
  const o={chunk:c.chunk,jitter:0,shadow:false};
  box(c.b,c.k.M.paint,'#898e7e',x,.032,z,.28,.018,.28,o);
  box(c.b,c.k.M.paint,'#303a32',x,.051,z,.22,.004,.22,o);
  for(const d of [-.08,-.04,0,.04,.08])boxMM(c.b,c.k.M.paint,'#66756a',x-.105,x+.105,.055,.064,z+d-.006,z+d+.006,o);
}
