// LIB-STAIR-R01 — closed-tread, guarded spiral stair with gallery-grade oak bridge.
// The visual wedges and walking support are authored from the same step positions.
// Collision is deliberately kept separate from visual timber: a protected path inside
// the outer guardrail and no invisible riser collider blocking the player.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { box, cyl, planMatrix } from './kit';
import { GF, UF } from './layout';

export const LIB_STAIR = {
  x: 81.95, z: 105.3, radius: 1.18, steps: 26,
  // 450° rise, identical to the validated old staircase. Only rail ENDS earlier.
  start: -Math.PI / 2, sweep: 2.5 * Math.PI,
  inner: 0.063, outer: 1.13, walkRadius: 0.78,
  // Gallery slab begins at x=83.2. Bridge only occupies the missing strip.
  bridge: { x0: 82.74, x1: 83.2, z0: 104.76, z1: 105.76 },
  guardEndsAtStep: 24,
} as const;
export const LIB_STAIR_RISE = (UF-GF)/LIB_STAIR.steps;
export const stairStepAngle=(i:number)=>LIB_STAIR.start+(i+.5)*LIB_STAIR.sweep/LIB_STAIR.steps;
export const stairStepPoint=(i:number,r=LIB_STAIR.walkRadius)=>{
  const a=stairStepAngle(i);
  return {x:LIB_STAIR.x+r*Math.cos(a),z:LIB_STAIR.z+r*Math.sin(a),y:GF+(i+1)*LIB_STAIR_RISE};
};

/** Shape extrusion is a CLOSED solid with top, bottom and six side faces.
 * The inboard nose penetrates the post slightly: there is no daylight gap at the pivot. */
export function solidSpiralTread(i:number):THREE.BufferGeometry {
  const a=stairStepAngle(i),d=LIB_STAIR.sweep/LIB_STAIR.steps/2+.014;
  const shape=new THREE.Shape();
  for(let j=0;j<=4;j++){
    const t=a-d+2*d*j/4;
    const x=LIB_STAIR.outer*Math.cos(t), z=LIB_STAIR.outer*Math.sin(t);
    if(j===0)shape.moveTo(x,z);else shape.lineTo(x,z);
  }
  for(let j=4;j>=0;j--){
    const t=a-d+2*d*j/4;
    shape.lineTo(LIB_STAIR.inner*Math.cos(t),LIB_STAIR.inner*Math.sin(t));
  }
  shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:.125,bevelEnabled:false,steps:1,curveSegments:1});
  // Extrusion's +Z becomes world +Y; shape Y becomes -world Z (plan coordinates).
  g.rotateX(-Math.PI/2);
  g.computeVertexNormals();
  return g;
}

export function libraryStairR01(c:Ctx) {
  const {x,z,radius,steps,start,sweep,bridge}=LIB_STAIR;
  const k=c.k,rise=LIB_STAIR_RISE,wood=k.M.wood,metal=k.M.paint;
  const walnut='#432b1d',oak='#795032',edge='#926844',iron='#282724';

  // Full-height cylindrical newel and timber cap, rather than a disconnected dark column.
  cyl(c.b,wood,walnut,x,GF,z,.078,.078,UF-GF+1.08,12,{chunk:c.chunk});
  cyl(c.b,wood,edge,x,UF+.92,z,.103,.103,.10,12,{chunk:c.chunk});
  c.col.addCircle(x,z,.18,GF,UF+1.11,{tag:'lib-stair.inner-post'});

  // 26 solid treads: accurately closed skirt, coloured oak, contact to the central spindle.
  for(let i=0;i<steps;i++){
    const p=stairStepPoint(i);
    const tread=solidSpiralTread(i);
    c.b.add(wood,tread,planMatrix(x,p.y-.125,z),oak,c.chunk,true,0);
    tread.dispose();
    // Narrow dark oak riser/nosing ring at the outer edge (thin so it reads at phone DPR).
    const a=stairStepAngle(i),r=LIB_STAIR.outer-.035;
    box(c.b,wood,edge,x+r*Math.cos(a),p.y-.023,z+r*Math.sin(a),
      .17,.024,.024,{chunk:c.chunk,yaw:-a});
    // Three overlapping strips approximate a sector for the game's 2.5D floor engine.
    // They follow the actual tread, rather than only a tiny walkable patch in open space.
    for(const rad of [.60,.78,.94]){
      const px=x+rad*Math.cos(a),pz=z+rad*Math.sin(a);
      c.col.addFloor(px-.245,px+.245,pz-.245,pz+.245,p.y);
    }
    // An outer vertical stave on EVERY step; old version drew one every other tread.
    if(i<LIB_STAIR.guardEndsAtStep){
      const bx=x+(radius-.012)*Math.cos(a),bz=z+(radius-.012)*Math.sin(a);
      cyl(c.b,metal,iron,bx,p.y-.06,bz,.018,.018,1.09,7,{chunk:c.chunk});
      cyl(c.b,wood,walnut,bx,p.y+1.00,bz,.025,.026,.06,7,{chunk:c.chunk});
    }
  }

  // Follow the tread perimeter, not an overlong 450-degree free-floating curve.
  // Stop before reaching the east-facing exit; the new gallery-edge rails take over.
  const guardSteps=LIB_STAIR.guardEndsAtStep;
  const first=start+.03;
  const last=start+guardSteps*sweep/steps-.03;
  const path:THREE.Vector3[]=[];
  const samples=guardSteps*5;
  for(let j=0;j<=samples;j++){
    const t=j/samples,ang=first+(last-first)*t;
    const index=(ang-start)/(sweep/steps);
    const yy=GF+rise*(index+1)+.92;
    path.push(new THREE.Vector3(radius*Math.cos(ang),yy,-radius*Math.sin(ang)));
  }
  const curve=new THREE.CatmullRomCurve3(path);
  const handrail=new THREE.TubeGeometry(curve,samples,.035,7,false);
  c.b.add(wood,handrail,planMatrix(x,GF,z),walnut,c.chunk,true,0);
  handrail.dispose();

  // Physical side enclosure. Short tangent-aligned AABB sections, gated by tread
  // height, prevent stepping through visual balusters. No collision across stair mouth.
  const segments=guardSteps*2;
  for(let j=0;j<segments;j++){
    const a0=first+(last-first)*j/segments;
    const a1=first+(last-first)*(j+1)/segments;
    const px0=x+(radius-.01)*Math.cos(a0),pz0=z+(radius-.01)*Math.sin(a0);
    const px1=x+(radius-.01)*Math.cos(a1),pz1=z+(radius-.01)*Math.sin(a1);
    const index=(a0-start)/(sweep/steps);
    const y=GF+rise*(index+1);
    const pad=.027;
    c.col.addBox(Math.min(px0,px1)-pad,Math.max(px0,px1)+pad,
      Math.min(pz0,pz1)-pad,Math.max(pz0,pz1)+pad,
      y-.13,y+1.20,{tag:'lib-stair.outer-guard'});
  }

  // Landing: match upper gallery oak and thickness, end FLUSH with the slab at X83.2.
  // The old 0.91 m square plate floated across already-present floor; only the gap
  // outside the slab is bridged now. There is no duplicated coplanar surface.
  const b=bridge;
  box(c.b,wood,'#8a5a34',(b.x0+b.x1)/2,UF-.20,(b.z0+b.z1)/2,
    b.x1-b.x0,.20,b.z1-b.z0,{chunk:c.chunk,uv:1.1});
  c.col.addFloor(b.x0-.12,b.x1+.02,b.z0,b.z1,UF);
  // Readable oak joists underneath the bridge, and a single finished lip at void edge.
  for(const zz of [b.z0+.035,b.z1-.035]){
    box(c.b,wood,'#5c3c28',(b.x0+b.x1)/2,UF-.25,zz,b.x1-b.x0,.12,.075,{chunk:c.chunk});
  }
  box(c.b,wood,edge,b.x0,UF-.205,(b.z0+b.z1)/2,.035,.205,b.z1-b.z0,{chunk:c.chunk});

  // Two short, enclosed gallery approach sides. Critically NO barrier across the
  // passage at X83.2: one can actually walk through to the established gallery.
  for(const zz of [b.z0,b.z1]){
    for(const xx of [b.x0,b.x1]){
      cyl(c.b,wood,walnut,xx,UF,zz,.044,.047,1.08,8,{chunk:c.chunk});
    }
    box(c.b,wood,walnut,(b.x0+b.x1)/2,UF+1.045,zz,
      b.x1-b.x0+.09,.065,.065,{chunk:c.chunk});
    c.col.addBox(b.x0-.075,b.x1+.055,zz-.05,zz+.05,UF-.14,UF+1.12,
      {tag:'lib-stair.gallery-side-guard'});
  }
}
