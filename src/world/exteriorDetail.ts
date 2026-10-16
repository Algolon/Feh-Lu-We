// EXT-R05: small constructed joints and an authored entrance leaf. Gameplay stays with makeDoor.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { box, boxMM, boxGeo, planMatrix, geo, rod, type Batcher, type Kit, type PartOpts } from './kit';
import { mulberry32 } from '../core/rng';
import { softBox } from './artkit';

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
 * FRONT-R01: single broad exterior leaf, horizontal mahogany boards, charcoal perimeter,
 * a long right-hand pull and a sculpted, blackened-bronze lion knocker. All fittings
 * are part of the hinged batch so the original save/lock/swing/collision stay intact.
 * Plan Z negative is the outdoor-facing side of the front door.
 */
export function frontDoorLeaf(b:Batcher,k:Kit,width:number,height:number,th:number,color:THREE.ColorRepresentation) {
  const wood=entranceTimber(k.M.wood),metal=k.M.paint;
  const mahogany=new THREE.Color(color);
  const dark=mahogany.clone().multiplyScalar(.72);
  const edge=.043;
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
    rod(b,metal,'#252825',hx,cy,handleZ,radius,radius,len,10,{jitter:0});
    for(const y of [cy-len*.40,cy+len*.40]){
      // A mounting post projecting from the leaf to the pull-bar axis.
      rod(b,metal,'#3d3e38',hx,y,side*(th/2+.012),.012,.012,.032,8,{rx:Math.PI/2,jitter:0});
      const stud=softBox(.044,.048,.012,.006);
      geo(b,metal,'#30312e',stud,hx,y,side*(th/2+.003),{jitter:0});
      stud.dispose();
    }
  }
  // Small, restrained key cylinder rather than the old interior-style lever.
  const key=new THREE.CylinderGeometry(.012,.012,.007,12);
  geo(b,metal,'#a29370',key,width-.245,.97,-th/2-.012,{rx:Math.PI/2,jitter:0});
  key.dispose();

  lionEntranceKnocker(b,metal,width/2,height*.70,th);

  // Keep hinges flush within the original leaf x/y envelope.
  for(const y of [.30,height*.5,height-.30])
    rod(b,metal,charcoal,.029,y,-th/2,.011,.011,.082,8,{jitter:0});
}

/** A small readable relief, not a flat decal or an assembly of anonymous boxes. */
function lionEntranceKnocker(b:Batcher,metal:THREE.Material,cx:number,cy:number,th:number) {
  // Dark, weathered bronze: highlights catch ridges, recesses stay almost black.
  const front=-th/2,iron='#24201e',bronze='#493b30',lit='#756149';
  const orb=new THREE.SphereGeometry(1,12,9);
  const swell=(dx:number,dy:number,dz:number,sx:number,sy:number,sz:number,tint:string,rz=0)=>
    geo(b,metal,tint,orb,cx+dx,cy+dy,front-dz,{s:[sx,sy,sz],rz,jitter:0});

  // A compact oval backing follows the silhouette. No rectangular doorbell plate.
  swell(0,.004,.015,.095,.126,.013,iron);
  swell(0,.010,.045,.091,.113,.030,bronze);

  // Round, directional locks of mane, not spikes radiating like a sun.
  // Raised dark grooves alternate with low bronze highlights.
  for(let i=0;i<16;i++){
    const a=i*Math.PI*2/16;
    const dx=Math.sin(a)*.081,dy=Math.cos(a)*.103;
    swell(dx,dy,.046,.023,.050,.021,i%4===0?lit:bronze,-a+.16*Math.sin(i*2.1));
    if(i%2===0){
      const cx2=dx+Math.sin(a)*.013,cy2=dy+Math.cos(a)*.014;
      swell(cx2,cy2,.062,.009,.031,.009,iron,-a+.17);
    }
  }
  // Crown and ears give the distinct lion silhouette, with a sculpted forehead.
  for(const side of [-1,1]){
    swell(side*.068,.055,.059,.029,.024,.023,bronze,-side*.30);
    swell(side*.030,.080,.068,.025,.024,.018,lit,side*.24);
  }
  swell(0,.024,.075,.059,.072,.034,bronze);
  swell(0,.060,.103,.037,.016,.012,lit);
  // Heavy upper lids shadow deeply set eyes (no cartoon-white pupils).
  for(const side of [-1,1]){
    swell(side*.029,.029,.105,.025,.014,.013,lit,side*.16);
    swell(side*.029,.017,.116,.010,.006,.006,iron);
    swell(side*.044,-.020,.084,.029,.038,.027,bronze);
    swell(side*.019,-.041,.111,.027,.022,.019,lit);
    for(let j=0;j<2;j++){
      const brow=new THREE.CylinderGeometry(.0035,.0035,.035,6);
      geo(b,metal,iron,brow,cx+side*(.028+j*.006),cy-.043-j*.013,front-.133,{rz:side*(.76+j*.14),jitter:0});
      brow.dispose();
    }
  }
  // Sculpted triangular feline nose, dark lip and a jaw beneath the ring.
  const triangle=new THREE.Shape();
  triangle.moveTo(-.023,.008);triangle.lineTo(.023,.008);triangle.lineTo(0,-.018);triangle.closePath();
  const nose=new THREE.ExtrudeGeometry(triangle,{depth:.007,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.003,bevelThickness:.003});
  geo(b,metal,iron,nose,cx,cy-.048,front-.131,{jitter:0});nose.dispose();
  rod(b,metal,iron,cx,cy-.075,front-.132,.0035,.0035,.026,6,{jitter:0});
  swell(0,-.077,.110,.030,.010,.011,iron);
  swell(0,-.094,.085,.034,.021,.020,bronze);

  // Hanging bronze ring held just below the lion's muzzle.
  const ring=new THREE.TorusGeometry(.057,.009,7,24);
  geo(b,metal,'#5a4b3a',ring,cx,cy-.148,front-.106,{jitter:0});
  ring.dispose();
  const stop=new THREE.SphereGeometry(.013,8,6);
  geo(b,metal,iron,stop,cx,cy-.214,front-.056,{jitter:0});
  stop.dispose();
  orb.dispose();
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
