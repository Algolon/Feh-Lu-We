/**
 * ROCK-R01 / A01 — isolated authored volumetric hero boulder.
 * This generator is EXPERIMENTAL and has not passed the art acceptance gate.
 * No production wiring. Metres; +Y is up.
 */
import * as THREE from 'three';
type P = readonly [number, number, number];
type V = [number, number, number];
type Plane = readonly [number, number, number, number];
export interface RockSculptOptions {
  seed?: number;
  step?: number;
  weathering?: number;
}
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const smoothMax = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
};
const smoothMin = (a: number, b: number, k: number) => -smoothMax(-a, -b, k);
const CORE: Plane[] = [
  [1,-0.12,-0.04,1.29],[-1,0.12,0.08,1.25],
  [0.22,1,-0.12,1.16],[0.09,-1,0.02,0.85],
  [0.20,0.07,1,0.75],[-0.07,0.05,-1,0.83],
  [0.70,0.68,0.15,1.36],[-0.77,0.62,0.10,1.16],
  [-0.72,-0.52,0.20,1.21],[0.18,0.79,0.59,1.12],
  [-0.17,0.64,-0.75,1.25],[0.80,0.05,0.59,1.10],
];
const SHOULDER: Plane[] = [
  [1,0.14,0.03,0.97],[-1,0.05,-0.12,0.89],
  [0.25,1,-0.18,1.36],[0.06,-1,0,0.96],
  [-0.21,0.06,1,0.73],[0.09,0.05,-1,0.86],
  [0.72,0.60,0.17,1.17],[-0.58,0.74,0.21,1.24],
  [0.68,0.28,-0.68,1.20],[0.29,0.83,0.48,1.12],
];
const FOREPLATE: Plane[] = [
  [1,-0.19,0.05,1.02],[-1,0.17,0.02,1.12],
  [0.23,1,-0.13,0.69],[-0.05,-1,0.02,0.62],
  [0.29,0.12,1,0.67],[0.09,0.11,-1,0.51],
  [0.65,0.56,0.50,0.95],[-0.50,0.58,0.64,0.96],
  [0.47,-0.52,0.70,0.93],[-0.63,-0.47,0.60,0.98],
  [0.02,0.76,0.65,0.75],
];
function poly(p: P, c: P, planes: readonly Plane[], bevel: number) {
  const x=p[0]-c[0],y=p[1]-c[1],z=p[2]-c[2]; let d=-100;
  for (const [nx,ny,nz,offset] of planes) d=smoothMax(d,nx*x+ny*y+nz*z-offset,bevel);
  return d;
}
export function heroBoulderField(x: number,y: number,z: number,seed=37,weathering=0.028): number {
  const phase=(seed%997)*0.019;
  const wx=x+weathering*(0.6*Math.sin(2.3*y+1.5*z+phase)+0.4*Math.sin(3.4*z-1.1*y));
  const wy=y+weathering*(0.6*Math.sin(2.0*x+1.5*z-phase)+0.4*Math.sin(2.9*x-0.7*z));
  const wz=z+weathering*(0.6*Math.sin(2.1*y-1.6*x+phase)+0.4*Math.sin(3.1*x+0.6*y));
  const p:P=[wx,wy,wz];
  const a=poly(p,[-0.52,0.04,-0.15],CORE,0.08);
  const b=poly(p,[0.84,0.20,-0.27],SHOULDER,0.075);
  const c=poly(p,[0.24,-0.53,0.57],FOREPLATE,0.085);
  let d=smoothMin(smoothMin(a,b,0.20),c,0.31);
  // Subsample-safe, surface-localized structural indentations.
  const smooth=(v:number,a:number,b:number)=>{
    const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);
  };
  const front=smooth(wz,0.18,0.75);
  const h=smooth(wy,-0.92,-0.48)*(1-smooth(wy,1.13,1.42));
  const cleft=(wx-0.32-0.12*wy+0.055*Math.sin(2.6*wy))/0.17;
  d+=0.30*Math.exp(-cleft*cleft)*front*h;
  const seam=(wy+0.41+0.32*wx)/0.18;
  const gate=smooth(wz,0.58,1.00)*smooth(wx,-0.82,-0.5)*(1-smooth(wx,0.74,1.02));
  return d+0.15*Math.exp(-seam*seam)*gate;
}
const CORNERS:P[]=[
  [0,0,0],[1,0,0],[1,1,0],[0,1,0],
  [0,0,1],[1,0,1],[1,1,1],[0,1,1],
];
const TETS=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]] as const;
export function heroBoulderGeometry(opts:RockSculptOptions={}):THREE.BufferGeometry {
  const seed=opts.seed??37,step=clamp(opts.step??0.12,0.055,0.25);
  const weathering=clamp(opts.weathering??0.028,0,0.06);
  const lo:P=[-2.45,-1.75,-1.80],hi:P=[2.45,2.04,1.96];
  const nx=Math.ceil((hi[0]-lo[0])/step)+1;
  const ny=Math.ceil((hi[1]-lo[1])/step)+1;
  const nz=Math.ceil((hi[2]-lo[2])/step)+1;
  const dx=(hi[0]-lo[0])/(nx-1);
  const dy=(hi[1]-lo[1])/(ny-1);
  const dz=(hi[2]-lo[2])/(nz-1);
  const field=(p:P)=>heroBoulderField(p[0],p[1],p[2],seed,weathering);
  const sample=new Float32Array(nx*ny*nz);
  const at=(ix:number,iy:number,iz:number)=>(iz*ny+iy)*nx+ix;
  for(let iz=0;iz<nz;iz++)for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++){
    sample[at(ix,iy,iz)]=field([lo[0]+ix*dx,lo[1]+iy*dy,lo[2]+iz*dz]);
  }
  const positions:number[]=[],normals:number[]=[],colors:number[]=[],uvs:number[]=[];
  const dark=new THREE.Color('#596574'),light=new THREE.Color('#a4a8a5'),base=new THREE.Color('#7d8896');
  const cc=new THREE.Color(),eps=0.012;
  const normalAt=(p:P):V=>{
    const [x,y,z]=p;
    const a=heroBoulderField(x+eps,y,z,seed,weathering)-heroBoulderField(x-eps,y,z,seed,weathering);
    const b=heroBoulderField(x,y+eps,z,seed,weathering)-heroBoulderField(x,y-eps,z,seed,weathering);
    const c=heroBoulderField(x,y,z+eps,seed,weathering)-heroBoulderField(x,y,z-eps,seed,weathering);
    const l=Math.hypot(a,b,c)||1;return [a/l,b/l,c/l];
  };
  const interp=(a:P,b:P,va:number,vb:number):V=>{
    const t=clamp(va/(va-vb),0,1);
    return [a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]),a[2]+t*(b[2]-a[2])];
  };
  const emit=(a:P,b:P,c:P)=>{
    const ab:V=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],ac:V=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const cross:V=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    const centre:P=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3,(a[2]+b[2]+c[2])/3];
    const n=normalAt(centre);
    if(cross[0]*n[0]+cross[1]*n[1]+cross[2]*n[2]<0)[b,c]=[c,b];
    for(const v of [a,b,c]){
      const vn=normalAt(v),up=clamp(0.5+vn[1]*0.38,0,1);
      const contact=clamp((v[1]+1.2)/0.64,0,1);
      const strata=0.96+0.04*Math.sin(v[1]*5.4+Math.sin(v[0]*1.3)*0.25);
      cc.copy(base).lerp(light,0.12+0.13*up).lerp(dark,0.22*(1-contact));
      cc.multiplyScalar(strata);
      positions.push(...v);normals.push(...vn);colors.push(cc.r,cc.g,cc.b);uvs.push(v[0]*0.42,v[1]*0.42);
    }
  };
  for(let iz=0;iz<nz-1;iz++)for(let iy=0;iy<ny-1;iy++)for(let ix=0;ix<nx-1;ix++){
    const pp:V[]=[],vv:number[]=[];
    for(const [cx,cy,cz] of CORNERS){
      pp.push([lo[0]+(ix+cx)*dx,lo[1]+(iy+cy)*dy,lo[2]+(iz+cz)*dz]);
      vv.push(sample[at(ix+cx,iy+cy,iz+cz)]);
    }
    if(vv.every(v=>v>=0)||vv.every(v=>v<0))continue;
    for(const tet of TETS){
      const inside=tet.filter(i=>vv[i]<0),outside=tet.filter(i=>vv[i]>=0);
      if(!inside.length||!outside.length)continue;
      const pts:V[]=[];
      for(const a of inside)for(const b of outside)pts.push(interp(pp[a],pp[b],vv[a],vv[b]));
      if(pts.length<3)continue;
      if(pts.length===3){emit(pts[0],pts[1],pts[2]);continue;}
      const centre:V=[0,0,0];
      for(const q of pts){centre[0]+=q[0]*0.25;centre[1]+=q[1]*0.25;centre[2]+=q[2]*0.25;}
      const n=normalAt(centre);let ex:V=[-n[1],n[0],0];
      if(Math.hypot(...ex)<0.1)ex=[0,-n[2],n[1]];
      const el=Math.hypot(...ex);ex=[ex[0]/el,ex[1]/el,ex[2]/el];
      const ey:V=[n[1]*ex[2]-n[2]*ex[1],n[2]*ex[0]-n[0]*ex[2],n[0]*ex[1]-n[1]*ex[0]];
      pts.sort((a,b)=>{
        const ang=(v:P)=>{
          const x=v[0]-centre[0],y=v[1]-centre[1],z=v[2]-centre[2];
          return Math.atan2(x*ey[0]+y*ey[1]+z*ey[2],x*ex[0]+y*ex[1]+z*ex[2]);
        };
        return ang(a)-ang(b);
      });
      emit(pts[0],pts[1],pts[2]);emit(pts[0],pts[2],pts[3]);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.computeBoundingBox();
  if(g.boundingBox)g.translate(0,-0.12-g.boundingBox.min.y,0);
  g.computeBoundingBox();g.computeBoundingSphere();
  g.userData.keepColor=true;
  g.userData.rockR01={seed,step,weathering,triangles:positions.length/9,isolated:true};
  return g;
}
export function heroBoulderMaterial(){
  return new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:0.91,metalness:0});
}
