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

/** Approved 13-point silhouette with mobile-readable veins, in one opaque batched mesh. */
export function climberLeafGeo(): THREE.BufferGeometry {
  // Keep the original outline EXACTLY: the leaf silhouette is already approved.
  const outline=[[-.15,-.58],[-.67,-.26],[-.82,.13],[-.34,.12],[-.48,.57],[-.12,.43],[0,.92],[.12,.43],[.48,.57],[.34,.12],[.82,.13],[.67,-.26],[.15,-.58]].reverse();
  const p:number[]=[],colors:number[]=[];
  // Each original wedge remains in the same location. Subtle panel tones describe
  // the leaf's folds without reshaping its lobes or creating extra geometry.
  for(let i=0;i<outline.length;i++) {
    const a=outline[i],b=outline[(i+1)%outline.length];
    const side=(a[0]+b[0])*.5;
    const fold=side<-.10?.975:side>.10?1.025:1;
    const lobe=(a[1]+b[1])*.5>.10&&Math.abs(side)>.24?1.025:1;
    for(const back of [false,true]) {
      const tri=back?[[0,.05,.055],[b[0],b[1],0],[a[0],a[1],0]]:[[0,.05,.055],[a[0],a[1],0],[b[0],b[1],0]];
      for(let j=0;j<3;j++) {
        p.push(...tri[j]);
        const value=(j===0?1.045:.935)*fold*lobe*(back?.94:1);
        colors.push(value,value,value);
      }
    }
  }
  // A broader pale-green central midrib, feathered towards the petiole and tip.
  // Two tapered triangles per face; no added texture, alpha cards or draw calls.
  for(const upper of [false,true])for(const back of [false,true]) {
    const z0=back?-.026:.087,zTip=back?-.012:.023;
    const left:[number,number,number]=[-.049,.05,z0];
    const right:[number,number,number]=[.049,.05,z0];
    const tip:[number,number,number]=upper?[0,.83,zTip]:[0,-.49,zTip];
    const tri=back?[right,left,tip]:[left,right,tip];
    for(let j=0;j<3;j++) {
      p.push(...tri[j]);
      const t=(j===2?1.11:1.27)*(back?.95:1);
      colors.push(t*1.01,t*1.045,t*.955);
    }
  }
  // Secondary veins: a paired, tapered diagonal stroke towards the side lobes.
  // One triangle per side and face; the original 13 wedges supply additional
  // gentle facet variation, avoiding dense linework on tiny mobile leaves.
  for(const side of [-1,1])for(const back of [false,true]) {
    const rootZ=back?-.024:.083,tipZ=back?-.014:.026;
    const tri=back
      ? [[side*.068,.14,rootZ],[side*.032,.205,rootZ],[side*.63,.245,tipZ]]
      : [[side*.032,.205,rootZ],[side*.068,.14,rootZ],[side*.63,.245,tipZ]];
    for(let j=0;j<3;j++) {
      p.push(...tri[j]);
      const t=(j===2?1.075:1.185)*(back?.95:1);
      colors.push(t*1.005,t*1.04,t*.97);
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(p.length/3*2,2));g.computeVertexNormals();
  const normals=g.attributes.normal as THREE.BufferAttribute;
  for(let i=0;i<normals.count;i++) {
    const sign=Math.floor(i/3)%2===0?1:-1,n=new THREE.Vector3(-p[i*3]*.35,-p[i*3+1]*.12,1).normalize().multiplyScalar(sign);
    normals.setXYZ(i,n.x,n.y,n.z);
  }
  g.rotateZ(Math.PI);g.userData.keepColor=true;return g;
}
/** A separate, calmer broad-lobed leaf for the two entrance urns. No climber geometry is reused. */
export function entranceLeafGeo():THREE.BufferGeometry {
  // Full broad shoulders and soft notches, without the five jagged climber points.
  // Local Y runs from the stem socket to the terminal tip.
  const outline=[
    [-.12,-.72],[-.36,-.48],[-.59,-.25],[-.72,.05],[-.66,.25],
    [-.48,.37],[-.29,.33],[-.21,.68],[0,.99],[.21,.68],
    [.29,.33],[.48,.37],[.66,.25],[.72,.05],[.59,-.25],
    [.36,-.48],[.12,-.72]
  ].reverse();
  const p:number[]=[],colors:number[]=[];
  const triangle=(v:number[][],tone:number,back:boolean,tipTone=tone)=>{
    for(let i=0;i<3;i++){
      p.push(...v[i]);
      const shade=(i===2?tipTone:tone)*(back?.94:1);
      colors.push(shade,shade*1.012,shade*.988);
    }
  };
  // Two-sided opaque facets with a restrained centre fold.
  for(let i=0;i<outline.length;i++){
    const a=outline[i],b=outline[(i+1)%outline.length];
    const right=(a[0]+b[0])*.5>0;
    const tone=(right?.985:1.02)*(a[1]+b[1]>.30?1.015:1);
    for(const back of [false,true]){
      const core=[0,.04,back?-.065:.065];
      triangle(back?[core,[...b,0],[...a,0]]:[core,[...a,0],[...b,0]],tone,back,1.04);
    }
  }
  // Calm, tapered midrib: leaf-green rather than white.
  for(const back of [false,true]){
    const z=back?-.080:.080,zt=back?-.010:.010;
    const a=[-.034,-.48,z],b=[.034,-.48,z],t=[0,.89,zt];
    triangle(back?[b,a,t]:[a,b,t],1.12,back,1.04);
  }
  // Two short secondary veins per half, only on the upper portion.
  for(const side of [-1,1])for(const offset of [0,.27])for(const back of [false,true]){
    const y=.08+offset,z=back?-.079:.079;
    const a=[side*.018,y,z],b=[side*.052,y+.035,z],t=[side*(offset? .31:.47),y+.19,back?-.009:.009];
    triangle(back?[b,a,t]:[a,b,t],1.085,back,1.025);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(p.length/3*2,2));
  g.computeVertexNormals();
  // Match the existing leaf normal convention and avoid flipped mobile backfaces.
  const normals=g.attributes.normal as THREE.BufferAttribute;
  for(let i=0;i<normals.count;i++){
    const sign=Math.floor(i/3)%2===0?1:-1;
    const n=new THREE.Vector3(-p[i*3]*.20,-p[i*3+1]*.07,1).normalize().multiplyScalar(sign);
    normals.setXYZ(i,n.x,n.y,n.z);
  }
  g.userData.keepColor=true;
  return g;
}

const ENTRANCE_GREEN=['#739653','#7fa05f','#648b50','#87a768'] as const;
export interface EntranceBranch { points:THREE.Vector3[]; radius:number }
export interface EntranceLeaf { centre:THREE.Vector3; base:THREE.Vector3; attachment:THREE.Vector3; size:number; angle:number; tilt:number; yaw:number; tone:number }
/** Seeded, game-space growth layout. No camera-facing billboard or random runtime state. */
export function entrancePlantPlan(seed:number):{branches:EntranceBranch[];leaves:EntranceLeaf[]} {
  const r=mulberry32(seed),branches:EntranceBranch[]=[],leaves:EntranceLeaf[]=[];
  const Y=new THREE.Vector3(0,1,0),X=new THREE.Vector3(1,0,0),origin=new THREE.Vector3(0,.65,0);
  const n=7;
  for(let j=0;j<n;j++){
    const a=(j+.16)/n*Math.PI*2+(r()-.5)*.22,reach=.20+r()*.10;
    const height=.55+r()*.27;
    const outward=new THREE.Vector3(Math.cos(a),0,Math.sin(a));
    const mid=origin.clone().addScaledVector(outward,reach*.42).addScaledVector(Y,height*.48);
    const end=origin.clone().addScaledVector(outward,reach).addScaledVector(Y,height);
    branches.push({points:[origin.clone(),mid,end],radius:.011});
    for(let k=0;k<6;k++){
      const t=.22+k*.136;
      const anchor=origin.clone().lerp(end,t);
      const splay=(k%2===0?-1:1),size=.19+r()*.045;
      const yaw=a+Math.PI/2+(r()-.5)*.30;
      const angle=splay*(.20+r()*.26);
      const tilt=-.12-r()*.20;
      const centre=anchor.clone().addScaledVector(outward,.055+r()*.035).addScaledVector(Y,.055+r()*.035);
      // Rotate the attachment precisely as placeLeaf does: X, Z, then Y.
      const base=new THREE.Vector3(0,-.65*size,0).applyAxisAngle(X,tilt).applyAxisAngle(new THREE.Vector3(0,0,1),angle).applyAxisAngle(Y,yaw).add(centre);
      leaves.push({centre,base,attachment:anchor,size,angle,tilt,yaw,tone:Math.floor(r()*ENTRANCE_GREEN.length)});
    }
  }
  return {branches,leaves};
}

const GREEN=['#63834e','#6b8d54','#78965b','#587749'];
function placeLeaf(raw:THREE.BufferGeometry,l:GreenLeaf,yaw=0,palette:readonly string[]=GREEN) {
  const g=raw.clone();g.scale(l.size,l.size,l.size);g.rotateX(l.tilt);g.rotateZ(l.angle);g.rotateY(yaw);g.translate(l.at,l.y,l.depth);
  const col=new THREE.Color(palette[l.tone]),a=g.attributes.color as THREE.BufferAttribute;
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
  const raw=entranceLeafGeo(),plan=entrancePlantPlan(seed),leaves:THREE.BufferGeometry[]=[],stems:THREE.BufferGeometry[]=[];
  for(const branch of plan.branches)stems.push(tube(branch.points,branch.radius));
  for(const leaf of plan.leaves){
    const placement:GreenLeaf={at:leaf.centre.x,y:leaf.centre.y,depth:leaf.centre.z,size:leaf.size,angle:leaf.angle,tilt:leaf.tilt,tone:leaf.tone};
    leaves.push(placeLeaf(raw,placement,leaf.yaw,ENTRANCE_GREEN));
    stems.push(tube([leaf.attachment,leaf.base],.0032));
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
