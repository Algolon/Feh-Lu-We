/**
 * ROCK-R01 A01-R03 — an authored planar hero boulder, not an implicit rounded blob.
 * Standalone, deterministic TypeScript. No Three.js import in the sculptural core.
 * Feh Lu We / art calibration only. NOT approved or wired to production.
 * Coordinates in metres, +Y up, +Z forward. Face normals are deliberately flat.
 */
export type V3 = [number,number,number];
export type Plane = readonly [number,number,number,number];
type Face = {verts: V3[]; planeId:number};
export type BoulderPiece = 'main' | 'frontSlab';
export interface BoulderR03Params { seed?:number; detail?:'primary'|'refined'; }
export interface BoulderR03Mesh {
  positions:number[]; normals:number[]; colors:number[]; uv:number[];
  triangles:number; bounds:{min:V3;max:V3};
  pieces:{name:BoulderPiece;triangles:number;faces:number}[];
  seed:number; detail:'primary'|'refined';
}
const min=Math.min, max=Math.max;
const EPS=1e-7;
const sub=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:V3,b:V3)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:V3,b:V3):V3=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normalize=(v:V3):V3=>{const len=Math.hypot(...v)||1;return[v[0]/len,v[1]/len,v[2]/len]};
const lerp=(a:V3,b:V3,t:number):V3=>[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]),a[2]+t*(b[2]-a[2])];
const length2=(v:V3)=>dot(v,v);
const quant=(v:V3)=>v.map(x=>Math.round(x*1e5)).join('|');
const hash=(seed:number,a:number,b:number)=>{
  let n=(seed*2654435761+a*1013904223+b*374761393)|0;
  n=Math.imul(n^(n>>>16),2246822519);n=Math.imul(n^(n>>>13),3266489917);
  return ((n^(n>>>16))>>>0)/4294967295;
};
const srgb=(x:number)=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const palette=(r:number,g:number,b:number):V3=>[srgb(r/255),srgb(g/255),srgb(b/255)];
const BASE=palette(127,143,160), WARM=palette(157,157,154), SHADE=palette(83,105,132);
const colors=(n:V3,seed:number,component:number,faceId:number):V3=>{
  // No baked lights; emphasize planes by using a restrained palette and face-wide tint only.
  const top=max(0,n[1]);const rear=max(0,-n[2]);
  const hue=hash(seed,component,faceId);
  const warmth=0.08+0.30*top+0.07*hue;
  const shadow=0.05+0.12*rear+0.06*(1-hue);
  const intensity=0.93+(hue-.5)*0.10;
  return [0,1,2].map(i=>max(0,min(1,(BASE[i]*(1-warmth-shadow)+WARM[i]*warmth+SHADE[i]*shadow)*intensity))) as V3;
};
const cube=(box:{x:[number,number];y:[number,number];z:[number,number]}):Face[]=>{
  const [x0,x1]=box.x,[y0,y1]=box.y,[z0,z1]=box.z;
  const a:V3=[x0,y0,z0],b:V3=[x1,y0,z0],c:V3=[x1,y1,z0],d:V3=[x0,y1,z0];
  const e:V3=[x0,y0,z1],f:V3=[x1,y0,z1],g:V3=[x1,y1,z1],h:V3=[x0,y1,z1];
  return [
    {verts:[a,d,c,b],planeId:-1},
    {verts:[e,f,g,h],planeId:-2},
    {verts:[a,e,h,d],planeId:-3},
    {verts:[b,c,g,f],planeId:-4},
    {verts:[a,b,f,e],planeId:-5},
    {verts:[d,h,g,c],planeId:-6},
  ];
};
function clipPoly(face:Face,plane:Plane):{face:Face|null;hits:V3[]}{
  const [nx,ny,nz,d]=plane;
  const dist=(p:V3)=>nx*p[0]+ny*p[1]+nz*p[2]-d;
  const out:V3[]=[],hits:V3[]=[];
  const verts=face.verts;
  for(let i=0;i<verts.length;i++){
    const a=verts[i],b=verts[(i+1)%verts.length];
    const da=dist(a),db=dist(b),insideA=da<=EPS,insideB=db<=EPS;
    if(insideA)out.push(a);
    if(insideA!==insideB){
      const v=lerp(a,b,da/(da-db));out.push(v);hits.push(v);
    }
  }
  return {face:out.length>=3?{verts:out,planeId:face.planeId}:null,hits};
}
function clipSolid(faces:Face[],plane:Plane,planeId:number):Face[]{
  const trimmed:Face[]=[],hits:V3[]=[];
  for(const face of faces){
    const r=clipPoly(face,plane);
    if(r.face)trimmed.push(r.face);
    hits.push(...r.hits);
  }
  const uniq=new Map<string,V3>();
  for(const p of hits)uniq.set(quant(p),p);
  const pts=[...uniq.values()];
  if(pts.length<3)return trimmed;
  const centre:V3=[0,0,0];for(const p of pts){centre[0]+=p[0]/pts.length;centre[1]+=p[1]/pts.length;centre[2]+=p[2]/pts.length;}
  const normal=normalize([plane[0],plane[1],plane[2]]);
  const pivot:V3=Math.abs(normal[1])<0.8?[0,1,0]:[1,0,0];
  const u=normalize(cross(pivot,normal)),v=cross(normal,u);
  pts.sort((a,b)=>{
    const angle=(p:V3)=>{const t=sub(p,centre);return Math.atan2(dot(t,v),dot(t,u));};
    return angle(a)-angle(b);
  });
  trimmed.push({verts:pts,planeId});
  return trimmed;
}
const MAIN:readonly Plane[]=[
  [0.18,1,0.07,2.38],
  [-0.83,0.64,0.13,2.47],
  [0.77,0.54,0.21,1.57],
  [-0.91,0.09,0.42,1.58],
  [0.65,0.07,0.77,1.13],
  [-0.26,0.18,1,1.24],
  [0.12,0.23,-1,1.32],
  [-0.70,0.12,-0.62,1.43],
  [0.78,0.13,-0.48,1.31],
  [-0.64,-0.70,0.19,1.44],
  [0.66,-0.51,0.24,1.06],
  [-0.25,-0.60,0.74,1.20],
  [0.14,0.78,0.78,2.17],
  [-0.14,0.73,-0.75,2.01],
  [-0.21,1,0.56,2.66],
];
const SLAB:readonly Plane[]=[
  [0.48,1,0.29,1.82],
  [-0.72,0.68,0.34,1.53],
  [0.66,0.63,0.45,1.73],
  [0.54,0.07,1,1.96],
  [-0.12,0.18,1,1.80],
  [0.79,-0.10,-0.65,0.38],
  [-0.84,0.14,-0.62,1.11],
  [0.75,-0.61,0.33,1.32],
  [-0.69,-0.62,0.47,1.38],
  [-0.36,0.72,-0.70,0.95],
];
const MAIN_DETAIL:readonly Plane[]=[
  [-0.48,0.32,0.76,1.62],
  [0.35,0.73,0.53,1.91],
  [-0.31,-0.62,-0.71,1.19],
];
const SLAB_DETAIL:readonly Plane[]=[
  [0.84,0.21,0.22,1.28],
  [-0.61,-0.51,0.61,1.32],
];
const FORMS:{name:BoulderPiece; box:{x:[number,number];y:[number,number];z:[number,number]};planes:readonly Plane[];detail:readonly Plane[]}[]=[
  {name:'main',box:{x:[-1.76,1.66],y:[-0.16,2.57],z:[-1.10,1.04]},planes:MAIN,detail:MAIN_DETAIL},
  {name:'frontSlab',box:{x:[-0.87,1.05],y:[-0.12,1.75],z:[0.58,1.75]},planes:SLAB,detail:SLAB_DETAIL},
];
const isDegenerate=(face:Face):boolean=>{
  if(face.verts.length<3)return true;
  const a=face.verts[0];let area=0;
  for(let i=1;i<face.verts.length-1;i++)area+=Math.hypot(...cross(sub(face.verts[i],a),sub(face.verts[i+1],a)));
  return area<1e-7;
};
export function buildHeroR03(params:BoulderR03Params={}):BoulderR03Mesh{
  const seed=params.seed??37,detail=params.detail??'refined';
  const pos:number[]=[],normals:number[]=[],cols:number[]=[],uv:number[]=[];
  const lower:V3=[Infinity,Infinity,Infinity],upper:V3=[-Infinity,-Infinity,-Infinity];
  const pieces:BoulderR03Mesh['pieces']=[];
  FORMS.forEach((f,part)=>{
    let faces=cube(f.box);
    [...f.planes,...(detail==='refined'?f.detail:[])].forEach((plane,i)=>{faces=clipSolid(faces,plane,i);});
    faces=faces.filter(face=>!isDegenerate(face));
    const start=pos.length/9;
    faces.forEach((face,fi)=>{
      const vert=face.verts;
      const n=normalize(cross(sub(vert[1],vert[0]),sub(vert[2],vert[0])));
      const c=colors(n,seed,part,face.planeId);
      const area=(()=>{let a=0;for(let i=1;i<vert.length-1;i++)a+=Math.hypot(...cross(sub(vert[i],vert[0]),sub(vert[i+1],vert[0])))*0.5;return a;})();
      const sculpted=detail==='refined'&&(
        (part===0 && n[2]>0.45 && area>0.9) ||
        (part===1 && n[2]>0.35 && area>0.8) ||
        (part===2 && n[2]>0.50 && area>0.55)
      );
      const faceTint=0.985+0.03*hash(seed,fi,part);
      const emitTri=(a:V3,b:V3,c0:V3,tint=1)=>{
        const cr=cross(sub(b,a),sub(c0,a));if(length2(cr)<1e-12)return;
        const tn=normalize(cr);
        for(const p of [a,b,c0]){
          pos.push(...p);normals.push(...tn);
          cols.push(c[0]*faceTint*tint,c[1]*faceTint*tint,c[2]*faceTint*tint);
          uv.push(p[0]*0.35,p[1]*0.35);
          for(let j=0;j<3;j++){lower[j]=min(lower[j],p[j]);upper[j]=max(upper[j],p[j]);}
        }
      };
      const centroid:V3=[0,0,0];
      for(const p of vert){centroid[0]+=p[0]/vert.length;centroid[1]+=p[1]/vert.length;centroid[2]+=p[2]/vert.length;}
      if(sculpted){
        const centreDepth=-0.033;
        const inner=vert.map((p,i)=>{
          const k=0.46+0.025*(hash(seed,fi,i)-0.5);
          return [p[0]*(1-k)+centroid[0]*k+n[0]*centreDepth,
                  p[1]*(1-k)+centroid[1]*k+n[1]*centreDepth,
                  p[2]*(1-k)+centroid[2]*k+n[2]*centreDepth] as V3;
        });
        for(let i=0;i<vert.length;i++){
          const j=(i+1)%vert.length;
          emitTri(vert[i],vert[j],inner[j],0.995);
          emitTri(vert[i],inner[j],inner[i],0.975);
        }
        for(let i=1;i<inner.length-1;i++)emitTri(inner[0],inner[i],inner[i+1],1.02);
      }else{
        for(let i=0;i<vert.length;i++)emitTri(centroid,vert[i],vert[(i+1)%vert.length]);
      }
    });
    pieces.push({name:f.name,faces:faces.length,triangles:pos.length/9-start});
  });
  return {positions:pos,normals,colors:cols,uv,triangles:pos.length/9,bounds:{min:lower,max:upper},pieces,seed,detail};
}
