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
/** A single rail at the exposed edge of the upper landing, terminating in
 * the existing north gallery post. No L-shaped secondary gate (photo reference). */
export const LIB_STAIR_TOP_GUARD = {
  from: {x:LIB_STAIR.x,z:LIB_STAIR.z},
  to: {x:LIB_STAIR.bridge.x0,z:LIB_STAIR.bridge.z1},
  y:UF+1.045,
} as const;

/** Match the full upper library gallery slab: SAME wood material, #8a5a34
 * tint and 2.2-metre UV density, anchored to that slab's positive-y face.
 * Deliberately do NOT reuse the separate single-board stair-tread texture. */
export function libraryGalleryFloorUV(x:number,z:number): [number,number] {
  return [(x-83.2)/2.2,(107.8-z)/2.2];
}
/** One simple upper-floor segment, edged by a single diagonal newel rail.
 * Its gallery-top face uses exactly the existing slab's timber UV language. */
export function solidGalleryStairLanding():THREE.BufferGeometry {
  const b=LIB_STAIR.bridge;
  // One tapered, flush gallery-floor transition. The north-west edge follows
  // the SINGLE newel-to-gallery rail; no little rectangular raised cap.
  // R06: fill the missing SOUTH-WEST triangle below the existing staircase
  // balusters. Previously the final point [b.x0,LIB_STAIR.z] cut this corner
  // out, leaving daylight between landing boards and the right-hand rail.
  // Removing that notch makes the north and south triangular regions part of
  // the SAME 20cm solid gallery-floor extrusion, not a second coplanar patch.
  const outline:[number,number][]=[
    [LIB_STAIR.x,LIB_STAIR.z],
    [b.x0,b.z1],
    [b.x1,b.z1],
    [b.x1,b.z0],
    [b.x0,b.z0],
  ];
  const shape=new THREE.Shape();
  outline.forEach(([px,pz],i)=>{
    const lx=px-LIB_STAIR.x, ly=-(pz-LIB_STAIR.z);
    if(i===0)shape.moveTo(lx,ly);else shape.lineTo(lx,ly);
  });
  shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:.20,bevelEnabled:false,steps:1,curveSegments:1});
  g.rotateX(-Math.PI/2);
  const pos=g.getAttribute('position') as THREE.BufferAttribute;
  const norm=g.getAttribute('normal') as THREE.BufferAttribute;
  const uv=g.getAttribute('uv') as THREE.BufferAttribute;
  for(let i=0;i<pos.count;i++) {
    const wx=LIB_STAIR.x+pos.getX(i),wz=LIB_STAIR.z+pos.getZ(i);
    const [u,v]=libraryGalleryFloorUV(wx,wz);
    if(Math.abs(norm.getY(i))>.5)uv.setXY(i,u,v);
    else uv.setXY(i,wx/2.2,pos.getY(i)/2.2);
  }
  uv.needsUpdate=true;
  return g;
}
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
// One seamless timber board per stair tread. The general house wood atlas
// intentionally contains EIGHT separated floor boards; sampling that material
// on the small wedge made each individual stair tread look like a miniature floor.
let treadBoardMaterial: THREE.MeshLambertMaterial | undefined;
function singleBoardTreadMaterial(): THREE.MeshLambertMaterial {
  if (treadBoardMaterial) return treadBoardMaterial;
  const cv=document.createElement('canvas');cv.width=cv.height=256;
  const ctx=cv.getContext('2d');
  if(!ctx) throw new Error('LIB-STAIR-R03: canvas context unavailable');
  ctx.fillStyle='#e5d5bc';ctx.fillRect(0,0,256,256);
  // A stable, quiet long-grain figure with NO transverse joints or plank seams.
  let seed=19337;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<72;i++){
    const x=8+rnd()*240, y=rnd()*220, length=18+rnd()*110;
    ctx.beginPath();ctx.moveTo(x,y);
    ctx.bezierCurveTo(x-2+rnd()*4,y+length*.35,x-2+rnd()*4,y+length*.7,x+(rnd()-.5)*5,Math.min(256,y+length));
    ctx.strokeStyle=i%4===0?'rgba(112,81,54,0.085)':'rgba(105,78,48,0.045)';
    ctx.lineWidth=.55+rnd()*1.35;ctx.stroke();
  }
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=THREE.ClampToEdgeWrapping;tex.wrapT=THREE.ClampToEdgeWrapping;
  tex.name='LIB-STAIR-R03-SingleOakBoard-NoPlankSeams';
  treadBoardMaterial=new THREE.MeshLambertMaterial({map:tex,vertexColors:true});
  treadBoardMaterial.name='LIB-STAIR-R03-SingleBoard';
  return treadBoardMaterial;
}

/** UV-map ONE wood board over ONE complete wedge. The grain follows its radial
 * length, turning with the tread; UVs stay within a single, non-repeating image. */
export function mapSingleTreadBoardUV(g:THREE.BufferGeometry,a:number): THREE.BufferGeometry {
  const pos=g.getAttribute('position') as THREE.BufferAttribute;
  const uv=g.getAttribute('uv') as THREE.BufferAttribute;
  for(let i=0;i<pos.count;i++){
    const px=pos.getX(i), pz=-pos.getZ(i);
    const radial=Math.hypot(px,pz);
    const across=-px*Math.sin(a)+pz*Math.cos(a);
    const u=THREE.MathUtils.clamp(.5+across*.62,.04,.96);
    const v=THREE.MathUtils.clamp(.08+.84*(radial-LIB_STAIR.inner)/(LIB_STAIR.outer-LIB_STAIR.inner),.04,.96);
    uv.setXY(i,u,v);
  }
  uv.needsUpdate=true;
  return g;
}
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
  return mapSingleTreadBoardUV(g,a);
}

export function libraryStairR01(c:Ctx) {
  const {x,z,radius,steps,start,sweep,bridge}=LIB_STAIR;
  const k=c.k,rise=LIB_STAIR_RISE,wood=k.M.wood,metal=k.M.paint;
  const walnut='#432b1d',oak='#795032',edge='#926844',iron='#282724';
  const boardMat=singleBoardTreadMaterial();

  // Full-height cylindrical newel and timber cap, rather than a disconnected dark column.
  cyl(c.b,wood,walnut,x,GF,z,.078,.078,UF-GF+1.08,12,{chunk:c.chunk});
  cyl(c.b,wood,edge,x,UF+.92,z,.103,.103,.10,12,{chunk:c.chunk});
  c.col.addCircle(x,z,.18,GF,UF+1.11,{tag:'lib-stair.inner-post'});

  // 26 closed 90 mm treads: visible underside gaps, sound sidewalls and contact with the spindle.
  for(let i=0;i<steps;i++){
    const p=stairStepPoint(i);
    const tread=solidSpiralTread(i);
    // The top (26th) wedge is beneath the R06 continuous gallery infill.
    // Keep its closed single-board geometry and 2.5D walking support, but recess
    // its top 5mm so no coplanar mesh z-fights with the new triangular floor.
    const overlapInset=i===steps-1?.005:0;
    c.b.add(boardMat,tread,planMatrix(x,p.y-LIB_STAIR_TREAD_THICKNESS-overlapInset,z),oak,c.chunk,true,0);
    tread.dispose();
    // No separate short nose-boxes: each step is one contiguous solid oak board.
    const a=stairStepAngle(i);
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
      // Collision analogue of each baluster: the previous segmented boxes
      // permitted outward slipping at the final tangential corner (step 23).
      c.col.addCircle(bx,bz,.065,base,top,{tag:'lib-stair.outer-baluster'});
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

  // LIB-STAIR-R02: the 450-degree spiral finishes at the SOUTH edge.
  // Continue this rail into the SOUTH gallery newel (NOT across the walkway).
  // Dark steel balusters are fixed through the real timber landing.
  const finish=new THREE.Vector3(bridge.x1-x,UF+1.045-GF,-(bridge.z0-z));
  const startJoin=path[path.length-1].clone();
  const upperCurve=new THREE.CatmullRomCurve3([
    startJoin,
    new THREE.Vector3(bridge.x0-x+.36,UF+.97-GF,-(bridge.z0-z-.014)),
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

  // R05: single tapered upper landing, like the reference. Same floor atlas,
  // tint and UV pitch as gallery; no freestanding cap or overlay boards.
  const b=bridge;
  const upperFloor=solidGalleryStairLanding();
  c.b.add(wood,upperFloor,planMatrix(x,UF-.20,z),'#8a5a34',c.chunk,true,0);
  upperFloor.dispose();
  c.col.addFloor(b.x0-.12,b.x1+.02,b.z0,b.z1,UF);
  // Only the inscribed rectangles of the R06 triangle are walkable. The 2.5D
  // floor solver cannot represent polygons, so constrain each patch INSIDE
  // the visible wedge; prevent stepping into invisible floor over the void.
  for(const [x0,x1,z0,z1] of [
    [82.16,82.28,105.16,105.28],
    [82.28,82.44,105.06,105.25],
    [82.44,82.61,104.88,105.24],
  ] as const) c.col.addFloor(x0,x1,z0,z1,UF);
  // Readable oak joists underneath the bridge, and a single finished lip at void edge.
  for(const zz of [b.z0+.035,b.z1-.035]){
    box(c.b,wood,'#5c3c28',(b.x0+b.x1)/2,UF-.25,zz,b.x1-b.x0,.12,.075,{chunk:c.chunk});
  }
  box(c.b,wood,edge,b.x0,UF-.205,(b.z0+b.z1)/2,.035,.205,b.z1-b.z0,{chunk:c.chunk});

  // R05 — follow the reference: one simple, uninterrupted rail from the
  // central newel to the existing north-gallery guard. No redundant L-posts,
  // overhead rails, double fences or piles of dangling spindles.
  const link=LIB_STAIR_TOP_GUARD;
  const dx=link.to.x-link.from.x,dz=link.to.z-link.from.z;
  const len=Math.hypot(dx,dz);
  const woodRail=new THREE.CylinderGeometry(.035,.035,len,8);
  woodRail.rotateZ(Math.PI/2);
  c.b.add(wood,woodRail,planMatrix((link.from.x+link.to.x)/2,link.y,
    (link.from.z+link.to.z)/2,Math.atan2(-dz,dx)),walnut,c.chunk,true,0);
  woodRail.dispose();
  for(let i=1;i<=5;i++){
    const t=i/6,px=link.from.x+dx*t,pz=link.from.z+dz*t;
    cyl(c.b,metal,iron,px,UF-.045,pz,.017,.017,1.13,8,{chunk:c.chunk});
  }
  // Match collision exactly to the rail, only above the upper floor.
  // Preserve lower-flight head clearance and the open route into gallery.
  for(let i=0;i<6;i++){
    const t0=i/6,t1=(i+1)/6;
    const ax=link.from.x+dx*t0,az=link.from.z+dz*t0;
    const bx=link.from.x+dx*t1,bz=link.from.z+dz*t1;
    c.col.addBox(Math.min(ax,bx)-.028,Math.max(ax,bx)+.028,
      Math.min(az,bz)-.028,Math.max(az,bz)+.028,
      UF+.015,UF+1.12,{tag:'lib-stair.r05-simple-north-guard'});
  }

  // Gallery side guards continue the two stair rails, without any tertiary
  // L-shaped frames. The R05 north rail shares the existing north corner post.
  for(const zz of [b.z0,b.z1]){
    // Reinforced newel at the outer edge; the east end already meets the
    // gallery's own balustrade and needs no overlapping double newel.
    // R06: the southern x0/z0 post is an orphan visually (blue marking).
    // Only the NORTHERN x0/z1 post actually anchors the newel-to-gallery
    // rail. Keep that one, the central spindle, all infill and guard collision.
    if(zz===b.z1){
      cyl(c.b,wood,walnut,b.x0,UF,zz,.048,.05,1.09,8,{chunk:c.chunk});
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
