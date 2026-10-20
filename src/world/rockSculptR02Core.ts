/**
 * ROCK-R01 / A01-R02: an intentionally authored ONE-PIECE geological hero boulder.
 * Pure deterministic geometry, independent of Three.js and renderer.
 * Negative signed field is rock. Coordinates are metres, Y up, front is +Z.
 * Export is triangle soup compatible with Three.BufferGeometry's standard attrs.
 */
export type P3 = readonly [number, number, number];
type V3 = [number, number, number];
export type Plane = readonly [number, number, number, number];
export interface HeroRockParams {
  step?: number;
  seed?: number;
  fractureDepth?: number;
  weathering?: number;
}
export interface HeroRockMesh {
  positions: number[];
  normals: number[];
  colors: number[];
  uv: number[];
  triangles: number;
  bounds: {min: V3; max: V3};
  options: Required<HeroRockParams>;
}
const min=Math.min, max=Math.max, abs=Math.abs;
const clamp=(v:number,a:number,b:number)=>min(b,max(a,v));
const smooth=(v:number,a:number,b:number)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const bevelMax=(a:number,b:number,k:number)=>{const h=max(k-abs(a-b),0)/k;return max(a,b)+h*h*k*0.25;};
/** Plane distances. Every major plane was chosen independently to establish a readable structural mass. */
export const HERO_PLANES:readonly Plane[]=[
  [ 1, 0.06,-0.06,1.58], [-1,-0.02, 0.12,1.55],
  [ 0.09,-1, 0.06,1.00], [ 0.15, 1, 0.08,1.48],
  [ 0.12, 0.03,1,0.99],[-0.06, 0.06,-1,0.99],
  [ 0.76, 0.64,0.08,1.61],[-0.64,0.81,0.15,1.45],
  [ 0.10, 0.80,0.71,1.54],[-0.24,0.70,-0.79,1.43],
  [ 0.81,-0.26,0.51,1.49],[-0.82,-0.20,0.56,1.51],
  [ 0.71, 0.14,-0.78,1.58],[-0.85,0.22,-0.60,1.50],
  [ 0.51,0.92,-0.40,1.50],[-0.21,0.94,0.47,1.58],
  [ 0.45,-0.63,0.74,1.36],[-0.56,-0.64,0.58,1.40],
  [ 0.66,-0.58,-0.60,1.44],[-0.61,-0.57,-0.66,1.44],
  [ 0.03, 1,-0.37,1.34],
];
const FRONT_PLANE:readonly Plane[]=[
  [1,-0.12,-0.10,1.02],[-1,0.11,0.07,1.12],
  [0.27,1,-0.12,0.62],[0.08,-1,0.04,0.73],
  [0.35,0.11,1,0.69],[-0.05,0.03,-1,0.62],
  [0.77,0.60,0.14,1.07],[-0.72,0.57,0.21,1.05],
  [0.11,0.64,0.83,0.86],[-0.15,0.64,-0.85,1.04],
  [0.58,-0.55,0.61,0.99],[-0.61,-0.62,0.47,1.04],
];
const SHOULDER_PLANE:readonly Plane[]=[
  [1,0.11,-0.03,0.84],[-1,-0.08,0.16,0.95],
  [0.27,1,0.06,1.14],[-0.07,-1,0.03,1.01],
  [0.19,0.04,1,0.71],[-0.09,0.08,-1,0.75],
  [0.72,0.64,0.12,1.10],[-0.67,0.71,0.13,1.16],
  [-0.28,0.75,-0.68,1.04],[0.28,0.79,0.61,1.07]
];
const cut=(x:number,y:number,z:number,planes:readonly Plane[])=>{
 let d=-100;
 for(const [nx,ny,nz,h] of planes)d=bevelMax(d,nx*x+ny*y+nz*z-h,0.015);
 return d;
};
const planeAt=(x:number,y:number,z:number)=>{
  const cases:[readonly Plane[],number,number,number][]= [
    [HERO_PLANES,x,y,z],
    [FRONT_PLANE,x+0.45,y+0.58,z-0.65],
    [SHOULDER_PLANE,x-0.73,y-0.22,z+0.37]
  ];
  let group=0, score=Infinity;
  for(let k=0;k<cases.length;k++){
    const [planes,cx,cy,cz]=cases[k];
    const d=cut(cx,cy,cz,planes);
    if(d<score){score=d;group=k;}
  }
  const [planes,cx,cy,cz]=cases[group];
  let best=-Infinity,second=-Infinity,winner=0;
  for(let i=0;i<planes.length;i++){
    const [nx,ny,nz,h]=planes[i];const t=nx*cx+ny*cy+nz*cz-h;
    if(t>best){second=best;best=t;winner=i;}
    else if(t>second)second=t;
  }
  return {winner:group*32+winner,plane:planes[winner],dominance:best-second};
};
const poly=(x:number,y:number,z:number)=>{
  let d=-100;
  for(const [nx,ny,nz,h] of HERO_PLANES)d=bevelMax(d,nx*x+ny*y+nz*z-h,0.012);
  // Interlocked structural pieces; crisp unions, NOT smooth-rounded ellipsoid blobs.
  const p=cut(x+0.45,y+0.58,z-0.65,FRONT_PLANE);
  const s=cut(x-0.73,y-0.22,z+0.37,SHOULDER_PLANE);
  return min(d,p,s);
};
/**
 * Small, large-scale low-frequency shape shifts. No per-vertex randomness.
 * Real surface cracks are negative-space indentations inside the single continuous boulder.
 */
export function heroR02Field(x:number,y:number,z:number,opts:HeroRockParams={}):number {
  const seed=opts.seed??37,wear=opts.weathering??0.013,depth=opts.fractureDepth??1;
  const phase=(seed%997)*0.026;
  // Bend the geological planes coherently. The broad faces remain flat-ish.
  const dx=wear*(0.54*Math.sin(1.6*y+0.9*z+phase)+0.32*Math.sin(2.1*z-0.7*y));
  const dy=wear*(0.44*Math.sin(1.4*x-0.7*z+phase)+0.30*Math.sin(2.3*z+0.7*x));
  const dz=wear*(0.50*Math.sin(1.4*x+0.9*y-phase)+0.35*Math.sin(2.3*y-1.0*x));
  const wx=x+dx, wy=y+dy, wz=z+dz;
  let d=poly(wx,wy,wz);
  // A main oblique structural split, wider at the upper lip and narrowing at the lower bed.
  // Cut only the exposed +Z flank. Curvature follows a credible stress line.
  const seamX=wx-0.03-0.19*wy-0.065*Math.sin(wy*1.7);
  const seamWidth=0.086+0.065*smooth(wy,-0.55,0.80);
  const seam=1-smooth(abs(seamX),seamWidth,seamWidth+0.16);
  const frontal=smooth(wz,0.00,0.66);
  const exposed=smooth(wy,-0.88,-0.45)*(1-smooth(wy,1.08,1.40));
  d+=depth*0.17*seam*frontal*exposed;
  // A broad diagonal break line around the base of the left-hand structural face.
  const lowerY=wy+0.33+0.28*wx+0.12*wz;
  const bed=1-smooth(abs(lowerY),0.045,0.205);
  d+=depth*0.075*bed*smooth(wz,0.30,0.76)*(1-smooth(wx,0.38,1.15));
  // Above main fracture: recessed chipped lip, one controlled geological event.
  const chipPlane=0.50*wx+0.91*wy+0.15*wz-1.20;
  const chip=1-smooth(abs(chipPlane),0.035,0.23);
  d+=depth*0.032*chip*smooth(wz,0.24,0.80)*smooth(wx,-0.40,0.20);
  return d;
}
const TETRAS:[[number,number,number,number],...number[][]]=[
  [0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]
];
const CORNERS:V3[]=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
function cross(a:P3,b:P3):V3{return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function normalize(a:P3):V3 {const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];}
const dot=(a:P3,b:P3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const lerp=(a:P3,b:P3,t:number):V3=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];

/** Polygonize one authored field. Work is bounded to sampling the bounding volume. */
export function buildHeroR02(opts:HeroRockParams={}):HeroRockMesh {
  const o:Required<HeroRockParams>={step:clamp(opts.step??0.16,0.08,0.26),seed:opts.seed??37,fractureDepth:clamp(opts.fractureDepth??1,0,1.5),weathering:clamp(opts.weathering??0.013,0,0.055)};
  const lo:V3=[-2.12,-1.65,-1.70],hi:V3=[2.12,2.15,2.14];
  const nx=Math.ceil((hi[0]-lo[0])/o.step)+1,ny=Math.ceil((hi[1]-lo[1])/o.step)+1,nz=Math.ceil((hi[2]-lo[2])/o.step)+1;
  const hx=(hi[0]-lo[0])/(nx-1),hy=(hi[1]-lo[1])/(ny-1),hz=(hi[2]-lo[2])/(nz-1);
  const id=(x:number,y:number,z:number)=>(z*ny+y)*nx+x;
  const size=nx*ny*nz,values=new Float32Array(size);
  const field=(x:number,y:number,z:number)=>heroR02Field(x,y,z,o);
  for(let iz=0;iz<nz;iz++)for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++) values[id(ix,iy,iz)]=field(lo[0]+ix*hx,lo[1]+iy*hy,lo[2]+iz*hz);
  const grads=new Float32Array(size*3);
  const val=(x:number,y:number,z:number)=>values[id(clamp(x,0,nx-1),clamp(y,0,ny-1),clamp(z,0,nz-1))];
  for(let iz=0;iz<nz;iz++)for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++){
    const gx=(val(ix+1,iy,iz)-val(ix-1,iy,iz))/(hx*(ix===0||ix===nx-1?1:2));
    const gy=(val(ix,iy+1,iz)-val(ix,iy-1,iz))/(hy*(iy===0||iy===ny-1?1:2));
    const gz=(val(ix,iy,iz+1)-val(ix,iy,iz-1))/(hz*(iz===0||iz===nz-1?1:2));
    const n=normalize([gx,gy,gz]);const ix3=id(ix,iy,iz)*3;
    grads[ix3]=n[0];grads[ix3+1]=n[1];grads[ix3+2]=n[2];
  }
  type Vert={pos:V3;normal:V3};
  const positions:number[]=[],normals:number[]=[],colors:number[]=[],uv:number[]=[];
  const lower:V3=[Infinity,Infinity,Infinity], upper:V3=[-Infinity,-Infinity,-Infinity];
  const emit=(aa:Vert,bb:Vert,cc:Vert)=>{
    let a=aa,b=bb,c=cc;
    const ab:V3=[b.pos[0]-a.pos[0],b.pos[1]-a.pos[1],b.pos[2]-a.pos[2]];
    const ac:V3=[c.pos[0]-a.pos[0],c.pos[1]-a.pos[1],c.pos[2]-a.pos[2]];
    const face=cross(ab,ac);
    const avg=normalize([a.normal[0]+b.normal[0]+c.normal[0],a.normal[1]+b.normal[1]+c.normal[1],a.normal[2]+b.normal[2]+c.normal[2]]);
    if(dot(face,avg)<0)[b,c]=[c,b];
    for(const v of [a,b,c]){
      const p=v.pos;
      const {winner:featureId,plane,dominance}=planeAt(p[0],p[1],p[2]);
      const authored=normalize(plane.slice(0,3) as V3);
      const delta=heroR02Field(p[0],p[1],p[2],o)-poly(p[0],p[1],p[2]);
      // Keep geological planes distinct, with a controlled softened edge band.
      const blend=max(smooth(delta,0.02,0.09),1-smooth(dominance,0.02,0.22));
      const n=normalize(lerp(authored,v.normal,blend));
      positions.push(...p);normals.push(...n);
      // Cool mid-grey stone, warm upper surfaces, blue recessed fractures.
      // Color variation references underlying geometry only; no baked sunlight or random speckles.
      const top=smooth(p[1],0.05,1.20);
      const baseY=smooth(p[1],-1.08,-0.33);
      const up=clamp(n[1]*0.5+0.5,0,1);
      const crack=clamp((p[2]-0.50)/0.52,0,1)*clamp(1-abs(p[0]-0.10-0.19*p[1])/0.23,0,1);
      let k=(0.86+0.14*baseY)*(1-0.17*crack)*(0.96+0.04*Math.sin(featureId*2.17));
      let cr=0.49+0.065*top+0.045*up;
      let cg=0.54+0.058*top+0.040*up;
      let cb=0.62-0.010*top+0.007*up;
      cr*=k;cg*=k;cb*=k;
      colors.push(cr,cg,cb);
      uv.push(p[0]*0.4,p[1]*0.4);
      for(let j=0;j<3;j++){lower[j]=min(lower[j],p[j]);upper[j]=max(upper[j],p[j]);}
    }
  };
  for(let iz=0;iz<nz-1;iz++)for(let iy=0;iy<ny-1;iy++)for(let ix=0;ix<nx-1;ix++){
    const ids:number[]=[],pts:V3[]=[],vv:number[]=[];
    for(const [cx,cy,cz] of CORNERS){const g=id(ix+cx,iy+cy,iz+cz);ids.push(g);pts.push([lo[0]+(ix+cx)*hx,lo[1]+(iy+cy)*hy,lo[2]+(iz+cz)*hz]);vv.push(values[g]);}
    if(vv.every(v=>v>=0)||vv.every(v=>v<0))continue;
    const edge=(a:number,b:number):Vert=>{const t=clamp(vv[a]/(vv[a]-vv[b]),0,1);
      const p=lerp(pts[a],pts[b],t),ia=ids[a]*3,ib=ids[b]*3;
      const n=normalize(lerp([grads[ia],grads[ia+1],grads[ia+2]],[grads[ib],grads[ib+1],grads[ib+2]],t));
      return{pos:p,normal:n};};
    for(const tet of TETRAS){
      const inside=tet.filter(t=>vv[t]<0),outside=tet.filter(t=>vv[t]>=0);
      if(!inside.length||!outside.length)continue;
      if(inside.length===1){const a=inside[0];emit(edge(a,outside[0]),edge(a,outside[1]),edge(a,outside[2]));continue;}
      if(outside.length===1){const a=outside[0];emit(edge(a,inside[0]),edge(a,inside[1]),edge(a,inside[2]));continue;}
      const a=inside[0],b=inside[1],c=outside[0],d=outside[1];
      const ac=edge(a,c),ad=edge(a,d),bc=edge(b,c),bd=edge(b,d);
      emit(ac,ad,bc);emit(bc,ad,bd);
    }
  }
  // Keep world-scale coords, but the base is embedded slightly below review ground plane.
  const shift=-0.12-lower[1];
  for(let i=1;i<positions.length;i+=3)positions[i]+=shift;
  lower[1]+=shift;upper[1]+=shift;
  return {positions,normals,colors,uv,triangles:positions.length/9,bounds:{min:lower,max:upper},options:o};
}
