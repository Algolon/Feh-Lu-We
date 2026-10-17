// EXT-R04: authored wall climbers and an entrance pair. No forest-kit or random-stream mutations.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Ctx } from './arch';
import { Batcher, box, geo, planMatrix } from './kit';
import { lathe } from './artkit';
import { exteriorMats, dressedLatheUV } from './exteriorStudy';
import { surface } from './surfaces';
import { mulberry32 } from '../core/rng';

export const EXTERIOR_GREENERY = typeof location === 'undefined' || new URLSearchParams(location.search).get('greenery') !== 'base';
export type GreenFace = 'W' | 'N';
export interface GreenLeaf { at: number; y: number; depth: number; size: number; angle: number; tilt: number; tone: number }
export interface GreenStem { points: THREE.Vector3[]; radius: number }
export interface Climber { face: GreenFace; root: number; leaves: GreenLeaf[]; stems: GreenStem[] }
export const ENTRANCE_POTS = [{ x: 86.7, z: 78.15, seed: 231 }, { x: 93.3, z: 78.15, seed: 427 }] as const;

const WINDOWS = {
  W: [{ ats: [83,90.5,97,101,105], lo: 1.05, hi: 2.65 }, { ats: [82.5,90,97,101,105], lo: 4.15, hi: 5.65 }],
  N: [{ ats: [75,78.5,82,88,97.5,105], lo: 1.05, hi: 2.65 }, { ats: [75,78.5,82,87.5,92.5,98,104], lo: 4.15, hi: 5.65 }],
};
/** Full leaf/branch envelope keeps clear of reveals, not merely the glass centre. */
export function greenClear(face: GreenFace, at: number, y: number, radius: number) {
  if (y + radius > 5.88 || at - radius < (face === 'W' ? 81 : 72.65) || at + radius > (face === 'W' ? 109.35 : 107.35)) return false;
  for (const row of WINDOWS[face]) for (const a of row.ats)
    if (Math.abs(at-a) < .94+radius && y+radius > row.lo-.28 && y-radius < row.hi+.4) return false;
  if (face === 'N' && [91.5,101].some(a=>Math.abs(at-a)<.95+radius) && y-radius<2.85) return false;
  return true;
}
export function climberPlan(): Climber[] {
  const sites: [GreenFace,number,number,number,number][] = [
    ['W',86.3,5.45,1.45,31], ['W',94,3.75,1.55,47], ['W',108,4.65,.82,62],
    ['N',73.3,4.55,.58,78], ['N',85,5.55,1.95,89], ['N',95.2,4.65,1.48,103],
  ];
  return sites.map(([face,root,height,spread,seed])=>{
    const r=mulberry32(seed), leaves: GreenLeaf[]=[], stems: GreenStem[]=[];
    for (let leader=0; leader<3; leader++) {
      const tip=(leader-1)*spread*.58+(r()-.5)*.28, h=height*(leader===1?1:.68+r()*.29), points:THREE.Vector3[]=[];
      const phase=r()*6, count=26;
      for(let j=0;j<=count;j++) {
        const t=j/count, at=root+tip*Math.pow(t,.8)+Math.sin(t*8+phase)*.13*Math.sin(t*Math.PI), y=.09+t*h;
        const depth=.075+.06*(1-THREE.MathUtils.smoothstep(y,.65,.9))+.10*Math.exp(-(((y-3.32)/.16)**2));
        if(!greenClear(face,at,y,.055)) break;
        points.push(new THREE.Vector3(at,y,depth));
        if(j<4 || r()<.10)continue;
        // Irregular side shoots create distinct leafy islands instead of leaves evenly spaced on a fan.
        const side=(r()-.5)*2*spread*(.13+.19*t);
        const ba=at+side, by=y+.08+r()*.24, bd=depth+.035;
        if(!greenClear(face,ba,by,.07))continue;
        stems.push({points:[new THREE.Vector3(at,y,depth),new THREE.Vector3(ba,by,bd)],radius:.007});
        for(let k=0;k<14;k++) {
          const size=.085+r()*.04, a=ba+(r()-.5)*.40, ly=by+(r()-.5)*.40, ld=bd+.055+r()*.07;
          if(greenClear(face,a,ly,size*1.25)) {
            leaves.push({at:a,y:ly,depth:ld,size,angle:(r()-.5)*1.5,tilt:(r()-.5)*.7,tone:Math.floor(r()*4)});
            stems.push({points:[new THREE.Vector3(ba,by,bd),new THREE.Vector3(a,ly+size*.5,ld)],radius:.0035});
          }
        }
      }
      if(points.length>1) stems.push({points,radius:.018-leader*.003});
    }
    return {face,root,leaves,stems};
  });
}

/** Five-lobed leaf, folded at its centre; explicit back faces avoid alpha cards and one-sided holes. */
export function climberLeafGeo(): THREE.BufferGeometry {
  const outline=[[-.15,-.58],[-.67,-.26],[-.82,.13],[-.34,.12],[-.48,.57],[-.12,.43],[0,.92],[.12,.43],[.48,.57],[.34,.12],[.82,.13],[.67,-.26],[.15,-.58]].reverse();
  const p:number[]=[], colors:number[]=[];
  for(let i=0;i<outline.length;i++) {
    const a=outline[i],b=outline[(i+1)%outline.length];
    for(const back of [false,true]) {
      const tri=back?[[0,.05,.055],[b[0],b[1],0],[a[0],a[1],0]]:[[0,.05,.055],[a[0],a[1],0],[b[0],b[1],0]];
      for(let j=0;j<3;j++){p.push(...tri[j]);const v=(j===0?1:.93)*(back?.94:1);colors.push(v,v,v);}
    }
  }
  // VEG-R10B: keep the original 13-point silhouette exactly. The narrow raised midrib
  // is coloured within the SAME leaf geometry/material (zero extra draw calls).
  // Two tapered triangles per face avoid alpha textures or additional materials.
  for(const upper of [false,true])for(const back of [false,true]) {
    const nearZ=back?-.015:.076,tipZ=back?-.012:.021;
    const left:[number,number,number]=[-.020,.05,nearZ];
    const right:[number,number,number]=[.020,.05,nearZ];
    const tip:[number,number,number]=upper?[0,.78,tipZ]:[0,-.43,tipZ];
    const tri=back?[right,left,tip]:[left,right,tip];
    for(let j=0;j<3;j++){
      p.push(...tri[j]);
      const v=(j===2?1.035:1.105)*(back?.94:1);
      colors.push(v*1.02,v*1.045,v*.99);
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(p.length/3*2,2));g.computeVertexNormals();
  // Broad, smooth leaf folds; the fan triangulation must not read as a ring of sharp cones.
  const normals=g.attributes.normal as THREE.BufferAttribute;
  for(let i=0;i<normals.count;i++) {
    const sign=Math.floor(i/3)%2===0?1:-1, n=new THREE.Vector3(-p[i*3]*.35,-p[i*3+1]*.12,1).normalize().multiplyScalar(sign);
    normals.setXYZ(i,n.x,n.y,n.z);
  }
  g.rotateZ(Math.PI);g.userData.keepColor=true;return g;
}
const GREEN=['#63834e','#6b8d54','#78965b','#587749'];
function placeLeaf(raw:THREE.BufferGeometry,l:GreenLeaf,yaw=0) {
  const g=raw.clone();g.scale(l.size,l.size,l.size);g.rotateX(l.tilt);g.rotateZ(l.angle);g.rotateY(yaw);g.translate(l.at,l.y,l.depth);
  const col=new THREE.Color(GREEN[l.tone]),a=g.attributes.color as THREE.BufferAttribute;
  for(let i=0;i<a.count;i++)a.setXYZ(i,a.getX(i)*col.r,a.getY(i)*col.g,a.getZ(i)*col.b);
  return g;
}
function tube(points:THREE.Vector3[],radius:number) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),points.length===2?1:Math.max(3,(points.length-1)*2),radius,5,false);
}
function submit(c:Ctx,parts:THREE.BufferGeometry[],mat:THREE.Material,color:string,matrix:THREE.Matrix4) {
  if(!parts.length)return;
  // BufferGeometryUtils requires consistent indexed/non-indexed and attribute layouts.
  const geos=parts.map(g=>g.index?g.toNonIndexed():g);
  const merged=mergeGeometries(geos)!;merged.userData.keepColor=!!merged.attributes.color;
  c.b.add(mat,merged,matrix,color,c.chunk,true,0);merged.dispose();
  parts.forEach(g=>g.dispose());geos.forEach((g,i)=>{if(g!==parts[i])g.dispose();});
}
function climbers(c:Ctx) {
  const raw=climberLeafGeo();
  for(const site of climberPlan()) {
    // Local X is the distance along the facade; Z is proud of its outer face.
    const matrix=new THREE.Matrix4().makeRotationY(site.face==='W'?-Math.PI/2:Math.PI);
    matrix.setPosition(site.face==='W'?72:0,0,site.face==='W'?0:-110);
    submit(c,site.leaves.map(l=>placeLeaf(raw,{...l,at:-l.at,angle:-l.angle})),c.k.M.paint,'#ffffff',matrix);
    submit(c,site.stems.map(s=>tube(s.points.map(p=>new THREE.Vector3(-p.x,p.y,p.z)),s.radius)),c.k.M.paint,'#675740',matrix);
    // Planting pocket gives each group a visible origin; thin footprint stays against the wall.
    if(site.face==='W') box(c.b,c.k.M.paint,'#514b37',71.88,.025,site.root,.25,.045,.65,{chunk:c.chunk,jitter:0});
    else box(c.b,c.k.M.paint,'#514b37',site.root,.025,110.12,.65,.045,.25,{chunk:c.chunk,jitter:0});
  }
  raw.dispose();
}
function entrancePot(c:Ctx,x:number,z:number,seed:number,dressed:THREE.Material) {
  const profile:[[number,number],...[number,number][]]=[[.001,0],[.39,0],[.39,.10],[.32,.13],[.28,.23],[.30,.59],[.38,.66],[.39,.75],[.31,.75],[.29,.67],[.27,.61],[.001,.61]];
  const g=dressedLatheUV(lathe(profile,16));geo(c.b,dressed,'#d8d2bf',g,x,.03,z,{chunk:c.chunk,jitter:0});g.dispose();
  const soil=new THREE.CylinderGeometry(.275,.275,.02,16);geo(c.b,c.k.M.paint,'#514735',soil,x,.65,z,{chunk:c.chunk,jitter:0});soil.dispose();
  const r=mulberry32(seed), raw=climberLeafGeo(),leaves:THREE.BufferGeometry[]=[],stems:THREE.BufferGeometry[]=[];
  for(let j=0;j<9;j++) {
    const a=j/9*Math.PI*2+.3,reach=.20+r()*.13,h=.55+r()*.28;
    const end=new THREE.Vector3(Math.cos(a)*reach,.69+h,Math.sin(a)*reach);
    stems.push(tube([new THREE.Vector3(0,.64,0),new THREE.Vector3(end.x*.45,.94,end.z*.45),end],.012));
    for(let k=0;k<11;k++) {
      const t=.28+k/15,angle=a+k*2.4;
      const leaf=placeLeaf(raw,{at:end.x*t+Math.cos(angle)*.12,y:.72+h*t,depth:end.z*t+Math.sin(angle)*.12,size:.13+r()*.055,angle:(r()-.5)*1.8,tilt:(r()-.5)*1.2,tone:Math.floor(r()*4)},angle);
      const lp=leaf.attributes.position;
      // Connect the visible leaf stalk to the shrub stem rather than floating the leaf cluster.
      stems.push(tube([new THREE.Vector3(end.x*t,.72+h*t,end.z*t),new THREE.Vector3(lp.getX(0),lp.getY(0)-.08,lp.getZ(0))],.0035));
      leaves.push(leaf);
    }
  }
  submit(c,stems,c.k.M.paint,'#66543c',planMatrix(x,0,z).clone());
  submit(c,leaves,c.k.M.paint,'#ffffff',planMatrix(x,0,z).clone());raw.dispose();
  // Pots have physical bodies; do not add collision for their soft foliage.
  c.col.addCircle(x,z,.39,0,.78);
}
export function buildExteriorGreenery(parent:THREE.Object3D,c:Ctx) {
  // Keep new vegetation out of the architectural mesh. Expanding that mesh's bounding sphere
  // changes opaque draw ordering at coplanar doorway trims, even when geometry there is untouched.
  const paint=c.k.M.paint.clone();surface(paint,'foliage');
  const dressed=exteriorMats().dressed.clone();surface(dressed,'stone');
  const local:Ctx={...c,b:new Batcher(),k:{...c.k,M:{...c.k.M,paint}}};
  climbers(local);
  for(const pot of ENTRANCE_POTS)entrancePot(local,pot.x,pot.z,pot.seed,dressed);
  local.b.build(parent);
}
