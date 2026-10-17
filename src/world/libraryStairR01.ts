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
  bridge: { x0: 82.64, x1: 83.2, z0: 104.66, z1: 105.99 },
  guardEndsAtStep: 24,
} as const;
export const LIB_STAIR_RISE = (UF-GF)/LIB_STAIR.steps;
/** World height of the centre of the curved rail at an exact spiral angle. */
export const spiralRailWorldY=(angle:number)=>GF+LIB_STAIR_RISE*((angle-LIB_STAIR.start)/(LIB_STAIR.sweep/LIB_STAIR.steps)+1)+.92;
export const stairStepAngle=(i:number)=>LIB_STAIR.start+(i+.5)*LIB_STAIR.sweep/LIB_STAIR.steps;
export const stairStepPoint=(i:number,r=LIB_STAIR.walkRadius)=>{
  const a=stairStepAngle(i);
  return {x:LIB_STAIR.x+r*Math.cos(a),z:LIB_STAIR.z+r*Math.sin(a),y:GF+(i+1)*LIB_STAIR_RISE};
};

/** Shape extrusion is a CLOSED solid with top, bottom and six side faces.
 * The inboard nose penetrates the post slightly: there is no daylight gap at the pivot. */
export const LIB_STAIR_TREAD_THICKNESS = .090;
export function solidSpiralTread(i:number):THREE.BufferGeometry {
  const a=stairStepAngle(i),d=LIB_STAIR.sweep/LIB_STAIR.steps/2+.014;
  type Pt={x:number;z:number};
  let polygon:Pt[]=[];
  for(let j=0;j<=4;j++){
    const t=a-d+2*d*j/4;
    polygon.push({x:LIB_STAIR.outer*Math.cos(t),z:LIB_STAIR.outer*Math.sin(t)});
  }
  for(let j=4;j>=0;j--){
    const t=a-d+2*d*j/4;
    polygon.push({x:LIB_STAIR.inner*Math.cos(t),z:LIB_STAIR.inner*Math.sin(t)});
  }
  if(i===LIB_STAIR.steps-1){
    // Gallery oak and upper tread share the exact same height. Avoid coplanar
    // overlap at the lip by finishing this final tread at the bridge edge.
    const limit=LIB_STAIR.bridge.x0-LIB_STAIR.x-.004;
    const clipped:Pt[]=[];
    for(let j=0;j<polygon.length;j++){
      const A=polygon[j],B=polygon[(j+1)%polygon.length];
      const ain=A.x<=limit,bin=B.x<=limit;
      if(ain)clipped.push(A);
      if(ain!==bin){
        const t=(limit-A.x)/(B.x-A.x);
        clipped.push({x:limit,z:A.z+(B.z-A.z)*t});
      }
    }
    polygon=clipped;
  }
  const shape=new THREE.Shape();
  polygon.forEach((p,j)=>{if(j===0)shape.moveTo(p.x,p.z);else shape.lineTo(p.x,p.z);});
  shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:LIB_STAIR_TREAD_THICKNESS,bevelEnabled:false,steps:1,curveSegments:1});
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

  // 26 closed 90 mm treads: visible underside gaps, sound sidewalls and contact with the spindle.
  for(let i=0;i<steps;i++){
    const p=stairStepPoint(i);
    const tread=solidSpiralTread(i);
    c.b.add(wood,tread,planMatrix(x,p.y-LIB_STAIR_TREAD_THICKNESS,z),oak,c.chunk,true,0);
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
      // Embed the top of each spindle INSIDE the rail tube, using its exact
      // angle/height. The old hard-coded 1.09m shaft stopped visibly short.
      const base=p.y-.06,top=spiralRailWorldY(a)+.018;
      cyl(c.b,metal,iron,bx,base,bz,.018,.018,top-base,8,{chunk:c.chunk});
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
    // The batch transform contributes GF once. The old rail had GF twice,
    // raising it 15cm above the spindle connection at every step.
    const localY=spiralRailWorldY(ang)-GF;
    path.push(new THREE.Vector3(radius*Math.cos(ang),localY,-radius*Math.sin(ang)));
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

  // LIB-STAIR-R02: a continuous timber return from the final spiral rail to
  // the upper gallery, rather than an abruptly dangling curved handrail.
  // The matching dark steel balusters land on the new oak transfer deck.
  const finish=new THREE.Vector3(bridge.x1-x,UF+1.045-GF,-(bridge.z1-z));
  const startJoin=path[path.length-1].clone();
  const upperCurve=new THREE.CatmullRomCurve3([
    startJoin,
    new THREE.Vector3(bridge.x0-x+.27,UF+.97-GF,-(bridge.z1-z+.012)),
    finish
  ]);
  const upperTube=new THREE.TubeGeometry(upperCurve,14,.035,8,false);
  c.b.add(wood,upperTube,planMatrix(x,GF,z),walnut,c.chunk,true,0);
  upperTube.dispose();
  for(const t of [.43,.68,.88]) {
    const at=upperCurve.getPoint(t);
    const bx=x+at.x,bz=z-at.z,top=GF+at.y+.018;
    cyl(c.b,metal,iron,bx,UF-.055,bz,.017,.017,top-(UF-.055),8,{chunk:c.chunk});
  }

  // R02 transfer landing: 56cm deep and 133cm wide, a distinct safe wood deck
  // with finished planks, sized exactly to the interruption in the gallery rail.
  // It ends FLUSH with the existing slab at X83.2 (no double-floor geometry).
  const b=bridge;
  box(c.b,wood,'#8a5a34',(b.x0+b.x1)/2,UF-.20,(b.z0+b.z1)/2,
    b.x1-b.x0,.20,b.z1-b.z0,{chunk:c.chunk,uv:1.1});
  c.col.addFloor(b.x0-.12,b.x1+.02,b.z0,b.z1,UF);
  // Four shallow oak floorboards make this read as a real landing rather than
  // the former undifferentiated slab. Their top is only 3mm above the walkway.
  const count=4,boardLength=(b.z1-b.z0)/count;
  for(let i=0;i<count;i++){
    const zz=b.z0+(i+.5)*boardLength;
    box(c.b,wood,i%2===0?'#8e6040':'#855936',(b.x0+b.x1)/2,UF+.001,zz,
      b.x1-b.x0-.014,.003,boardLength-.012,{chunk:c.chunk,uv:1.1});
  }
  // Readable oak joists underneath the bridge, and a single finished lip at void edge.
  for(const zz of [b.z0+.035,b.z1-.035]){
    box(c.b,wood,'#5c3c28',(b.x0+b.x1)/2,UF-.25,zz,b.x1-b.x0,.12,.075,{chunk:c.chunk});
  }
  box(c.b,wood,edge,b.x0,UF-.205,(b.z0+b.z1)/2,.035,.205,b.z1-b.z0,{chunk:c.chunk});

  // Gallery-side guards: continuous top rail and infill instead of only two
  // huge wooden posts. North side is already linked to the spiral handrail
  // by the upperCurve above. South side is a separate short oak return.
  for(const zz of [b.z0,b.z1]){
    // Reinforced newel at the outer edge; the east end already meets the
    // gallery's own balustrade and needs no overlapping double newel.
    cyl(c.b,wood,walnut,b.x0,UF,zz,.048,.05,1.09,8,{chunk:c.chunk});
    if(zz===b.z0){
      box(c.b,wood,walnut,(b.x0+b.x1)/2,UF+1.045,zz,
        b.x1-b.x0+.06,.070,.073,{chunk:c.chunk});
      for(const xx of [b.x0+.14,b.x0+.28,b.x0+.42]){
        cyl(c.b,metal,iron,xx,UF-.04,zz,.018,.018,1.13,8,{chunk:c.chunk});
      }
    }
    // This guard is a physical boundary as well as a visual one.
    c.col.addBox(b.x0-.045,b.x1+.055,zz-.052,zz+.052,UF-.14,UF+1.12,
      {tag:'lib-stair.gallery-side-guard'});
  }
}
