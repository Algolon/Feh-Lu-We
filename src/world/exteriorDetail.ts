// EXT-R05: small constructed joints and an authored entrance leaf. Gameplay stays with makeDoor.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { box, boxMM, boxGeo, planMatrix, geo, rod, type Batcher, type Kit, type PartOpts } from './kit';
import { mulberry32 } from '../core/rng';
import { softBox } from './artkit';
import { addLionKnocker, castBronzeMetal } from './lionKnocker';

export const EXTERIOR_DETAILS = typeof location==='undefined'||new URLSearchParams(location.search).get('details')!=='base';
export const ENTRANCE_METAL={iron:'#343c37',bronze:'#9a895f',shadow:'#625b43'};
/** Horizontal, lightly separated mahogany boards inside the existing wide door envelope. */
export function horizontalDoorBoards(width:number,height:number,count=7) {
  const border=.055,gap=.008;
  const h=(height-2*border-(count-1)*gap)/count;
  return Array.from({length:count},(_,i)=>({
    x0:border,x1:width-border,
    y0:border+i*(h+gap),y1:border+i*(h+gap)+h,
  }));
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

/**
 * FRONT-R03: broad horizontal mahogany leaf with slim charcoal perimeter,
 * matching blackened-bronze pull and a unified sculpted lion knocker. All fittings
 * are part of the hinged batch so the original save/lock/swing/collision stay intact.
 * Plan Z negative is the outdoor-facing side of the front door.
 */
export function frontDoorLeaf(b:Batcher,k:Kit,width:number,height:number,th:number,color:THREE.ColorRepresentation) {
  const wood=entranceTimber(k.M.wood),metal=k.M.paint;
  const mahogany=new THREE.Color(color);
  const dark=mahogany.clone().multiplyScalar(.72);
  const edge=.027;
  const charcoal='#292a27',bevel='#383630';

  // Backing closes the thin shadow lines: no view through the 8 mm joints.
  timber(b,wood,dark,width/2,.012,0,width-.025,height-.024,th*.82,{jitter:0});
  const boards=horizontalDoorBoards(width,height);
  for(let i=0;i<boards.length;i++){
    const p=boards[i],shade=[1.04,.99,1.015,.97,1.03,.985,1.01][i%7];
    const boardColor=mahogany.clone().multiplyScalar(shade);
    const y0=p.y0+.002,h=p.y1-p.y0-.004;
    // Front and back boards: texture grain follows their long, horizontal axis.
    for(const side of [-1,1])
      timber(b,wood,boardColor,width/2,y0,side*(th*.41+.004),p.x1-p.x0,h,.012,{jitter:0});
  }

  // All-black frame belongs to the swinging leaf, not to the stone entrance.
  for(const x of [edge/2,width-edge/2])
    box(b,metal,charcoal,x,0,0,edge,height,th+.014,{jitter:0});
  for(const y of [edge/2,height-edge/2])
    box(b,metal,charcoal,width/2,y-edge/2,0,width-2*edge,edge,th+.014,{jitter:0});
  // Fine inset reveals against the timber, rather than an oversized trim.
  for(const x of [edge+.004,width-edge-.004])
    box(b,metal,bevel,x,.055,0,.007,height-.11,th+.016,{jitter:0});

  // Long contemporary pull on the outside/right. A quieter shorter inner grip
  // keeps the game door usable from both sides without duplicating the hero detail.
  const hx=width-.15;
  for(const side of [-1,1]){
    const exterior=side===-1;
    const len=exterior?1.13:.66,cy=exterior?1.16:1.05;
    const handleZ=side*(th/2+.027);
    const radius=exterior?.018:.014;
    // FRONT-R03: the same blackened cast-bronze vertex patina as the lion,
    // with narrow rubbed-gold edge highlights instead of an orange painted rod.
    const pull=castBronzeMetal(new THREE.CylinderGeometry(radius,radius,len,16,1));
    geo(b,metal,'#ffffff',pull,hx,cy,handleZ,{jitter:0});pull.dispose();
    for(const y of [cy-len*.40,cy+len*.40]){
      // A mounting post projecting from the leaf to the pull-bar axis.
      const post=castBronzeMetal(new THREE.CylinderGeometry(.012,.012,.032,12));
      geo(b,metal,'#ffffff',post,hx,y,side*(th/2+.012),{rx:Math.PI/2,jitter:0});post.dispose();
      const stud=softBox(.044,.048,.012,.006);
      castBronzeMetal(stud);
      geo(b,metal,'#ffffff',stud,hx,y,side*(th/2+.003),{jitter:0});
      stud.dispose();
    }
  }
  // Small, restrained key cylinder rather than the old interior-style lever.
  const key=new THREE.CylinderGeometry(.012,.012,.007,12);
  castBronzeMetal(key);
  geo(b,metal,'#ffffff',key,width-.245,.97,-th/2-.012,{rx:Math.PI/2,jitter:0});
  key.dispose();

  addLionKnocker(b,metal,width/2,height*.70,th);

  // Keep hinges flush within the original leaf x/y envelope.
  for(const y of [.30,height*.5,height-.30])
    rod(b,metal,charcoal,.029,y,-th/2,.011,.011,.082,8,{jitter:0});
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
