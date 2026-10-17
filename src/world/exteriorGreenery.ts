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
/** Authored botanical albedo in the same spirit as the indoor plant atlas.
 * The curved leaf mesh owns the silhouette; texture contributes only calm venation.
 */
let entranceLeafMat:THREE.MeshLambertMaterial|null=null;
export function entranceLeafMaterial():THREE.MeshLambertMaterial {
  if(entranceLeafMat)return entranceLeafMat;
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;
  const x=canvas.getContext('2d')!;
  const ground=x.createLinearGradient(0,0,256,0);
  ground.addColorStop(0,'#b5c3aa');ground.addColorStop(.33,'#e5ebd6');
  ground.addColorStop(.49,'#f5f7e8');ground.addColorStop(.55,'#edf1dd');
  ground.addColorStop(1,'#b7c7ad');
  x.fillStyle=ground;x.fillRect(0,0,256,512);
  const fade=x.createLinearGradient(0,0,0,512);
  fade.addColorStop(0,'rgba(244,251,224,.08)');
  fade.addColorStop(.5,'rgba(255,255,255,0)');
  fade.addColorStop(1,'rgba(65,92,58,.10)');
  x.fillStyle=fade;x.fillRect(0,0,256,512);
  x.lineCap='round';
  x.beginPath();x.moveTo(127,499);x.bezierCurveTo(123,362,131,161,128,15);
  x.strokeStyle='rgba(74,99,68,.34)';x.lineWidth=10;x.stroke();
  x.beginPath();x.moveTo(129,495);x.bezierCurveTo(126,360,130,162,129,19);
  x.strokeStyle='rgba(246,252,208,.94)';x.lineWidth=4;x.stroke();
  for(const side of [-1,1])for(const [u,reach] of [[.22,65],[.40,83],[.59,80],[.76,56]]){
    const cy=512*(1-u),h=reach*.28;
    x.beginPath();x.moveTo(128,cy);
    x.bezierCurveTo(128+side*reach*.30,cy-5,128+side*reach*.72,cy-h*.78,128+side*reach,cy-h);
    x.strokeStyle='rgba(64,94,59,.27)';x.lineWidth=5;x.stroke();
    x.strokeStyle='rgba(242,251,204,.80)';x.lineWidth=2;x.stroke();
  }
  const rand=mulberry32(7345);
  for(let i=0;i<180;i++){
    x.fillStyle=rand()<.5?'rgba(61,91,66,.045)':'rgba(253,255,234,.11)';
    x.fillRect(rand()*256,rand()*512,.6,2+rand()*4);
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  return entranceLeafMat=surface(new THREE.MeshLambertMaterial({map,vertexColors:true,side:THREE.DoubleSide}), 'foliage');
}

/** Small evergreen laurel-like leaves for the formal entrance urns.
 * Gently cupped, pointed and clearly veined on both sides, in one batched mesh.
 * This botanical family deliberately differs from the five-lobed wall ivy.
 */
export function entranceLeafGeo():THREE.BufferGeometry {
  const p:number[]=[],colors:number[]=[],normals:number[]=[];
  const along=8,across=6;
  // Smooth tapered oval, slight asymmetry and natural upward-curling tip.
  const cross=(u:number,s:number,back:boolean)=>{
    const envelope=Math.pow(Math.max(0,Math.sin(Math.PI*u)),.82);
    const width=.54*envelope*(.93+.12*u);
    const x=s*width*(1+.04*Math.sin(u*Math.PI*1.8));
    const y=-.76+1.62*u;
    const curl=.055*Math.sin(Math.PI*u)*(1-s*s)+.032*u*u;
    const fold=.052*(1-Math.abs(s))*envelope;
    const z=(back?-1:1)*(curl+fold+.006);
    // Narrow green-gold centre rib, two paired veins lifting towards the edge.
    const rib=Math.exp(-Math.pow(s/.17,2))*(.55+.45*envelope);
    const vein=(a:number,b:number)=>{
      const d=Math.abs(u-(a+b*Math.abs(s)));
      return Math.exp(-Math.pow(d/.075,2))*Math.max(0,1-Math.abs(s)*.72);
    };
    const secondary=Math.max(vein(.27,.16),vein(.57,.16));
    const folded=(s<0?1.028:.976)*(1-.065*Math.abs(s))*(.96+.06*u);
    const light=folded*(back?.93:1);
    const tone=light*(1+.055*rib+.035*secondary);
    const color:[number,number,number]=[tone*.96,tone*1.065,tone*.91];
    // The built-in normals follow the slight transverse fold, not flat cards.
    const n=new THREE.Vector3(-.18*s*envelope,.028*Math.cos(Math.PI*u),back?-1:1).normalize();
    return {pos:[x,y,z],color,normal:n.toArray()};
  };
  for(const back of [false,true]){
    for(let i=0;i<along;i++)for(let j=0;j<across;j++){
      const u0=i/along,u1=(i+1)/along,s0=j/across*2-1,s1=(j+1)/across*2-1;
      const tris=back?[
        [[u0,s0],[u1,s1],[u1,s0]],[[u0,s0],[u0,s1],[u1,s1]]
      ]:[
        [[u0,s0],[u1,s0],[u1,s1]],[[u0,s0],[u1,s1],[u0,s1]]
      ];
      for(const tri of tris)for(const [u,s] of tri){
        const v=cross(u,s,back);p.push(...v.pos);colors.push(...v.color);normals.push(...v.normal);
      }
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  const uv:number[]=[];
  for(let i=0;i<p.length;i+=3)uv.push(THREE.MathUtils.clamp(p[i]/1.08+.5,0,1),THREE.MathUtils.clamp((p[i+1]+.76)/1.62,0,1));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.userData.keepColor=true;return g;
}
const ENTRANCE_GREEN=['#769758','#85a467','#648650','#96ad75'] as const;
export interface EntranceBranch { points:THREE.Vector3[]; radius:number }
export interface EntranceLeaf { centre:THREE.Vector3; base:THREE.Vector3; attachment:THREE.Vector3; size:number; angle:number; tilt:number; yaw:number; tone:number }
/** Deliberate branched crown: staggered leaf pairs orbit a seed-specific
 * centre, revealing stems and distinct individual leaves in normal game views.
 */
export function entrancePlantPlan(seed:number):{branches:EntranceBranch[];leaves:EntranceLeaf[]} {
  const r=mulberry32(seed),branches:EntranceBranch[]=[],leaves:EntranceLeaf[]=[];
  const origin=new THREE.Vector3(0,.65,0),Y=new THREE.Vector3(0,1,0);
  const X=new THREE.Vector3(1,0,0),Z=new THREE.Vector3(0,0,1);
  for(let j=0;j<7;j++){
    const a=(j+.14+r()*.12)/7*Math.PI*2;
    const outward=new THREE.Vector3(Math.cos(a),0,Math.sin(a));
    const reach=.205+r()*.105,height=.52+r()*.22;
    const mid=origin.clone().addScaledVector(outward,reach*.42).addScaledVector(Y,height*.52);
    const end=origin.clone().addScaledVector(outward,reach).addScaledVector(Y,height);
    branches.push({points:[origin.clone(),mid,end],radius:.009});
    for(let k=0;k<5;k++){
      const t=.30+k*.166;
      const anchor=origin.clone().lerp(end,t);
      const side=k%2===0?-1:1;
      const lateral=new THREE.Vector3(-outward.z,0,outward.x);
      const centre=anchor.clone()
        .addScaledVector(outward,.095+r()*.034)
        .addScaledVector(lateral,side*(.055+r()*.030))
        .addScaledVector(Y,.05+r()*.038);
      const size=.172+r()*.033+(k===4?.014:0);
      const yaw=Math.PI/2-a+side*(.27+r()*.24);
      const angle=side*(.36+r()*.28);
      const tilt= -.15-r()*.22;
      // Respect the exact mesh transform order used in placeLeaf.
      const base=new THREE.Vector3(0,-.74*size,0)
        .applyAxisAngle(X,tilt).applyAxisAngle(Z,angle)
        .applyAxisAngle(Y,yaw).add(centre);
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
  submit(c,leaves,entranceLeafMaterial(),'#ffffff',planMatrix(x,0,z).clone());raw.dispose();
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
