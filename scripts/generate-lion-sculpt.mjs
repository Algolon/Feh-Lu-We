// FRONT-R04 asset bake — offline, deterministic, authored 3D lion ornament.
// Run in CI: node scripts/generate-lion-sculpt.mjs
// This is a VOLUMETRIC mesh, not the previous radial 2.5D heightfield.
// Anatomical masses and hand-placed flowing mane locks are fused into one cast.
import { writeFileSync } from 'node:fs';

const PITCH=.008, min=[-.185,-.210,-.022],max=[.185,.214,.194];
const N=min.map((x,i)=>Math.ceil((max[i]-x)/PITCH)+1);
const [NX,NY,NZ]=N;
const grid=new Float32Array(NX*NY*NZ);
const at=(i,j,k)=>(i*NY+j)*NZ+k;
const smoothMin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
const ell=(x,y,z,cx,cy,cz,rx,ry,rz)=>{
  const dx=(x-cx)/rx,dy=(y-cy)/ry,dz=(z-cz)/rz;
  return (Math.sqrt(dx*dx+dy*dy+dz*dz)-1)*Math.min(rx,ry,rz);
};
const locks=[
 // Hand-placed silhouette volumes and strand directions, from roots to tips.
 [[0,.110,.052,.029],[.005,.150,.063,.025],[.001,.182,.055,.005]],
 [[-.035,.109,.054,.024],[-.048,.146,.065,.022],[-.060,.178,.046,.006]],
 [[-.066,.099,.049,.027],[-.097,.138,.064,.021],[-.127,.144,.045,.004]],
 [[-.084,.070,.046,.027],[-.134,.095,.056,.021],[-.150,.069,.041,.005]],
 [[-.090,.031,.046,.027],[-.138,.035,.061,.021],[-.148,-.002,.036,.005]],
 [[-.089,-.010,.052,.030],[-.145,-.029,.061,.024],[-.137,-.069,.037,.006]],
 [[-.078,-.052,.053,.028],[-.126,-.091,.071,.025],[-.115,-.126,.039,.004]],
 [[-.058,-.096,.049,.027],[-.089,-.133,.061,.024],[-.068,-.166,.035,.006]],
 [[-.020,-.117,.046,.029],[-.031,-.151,.058,.022],[-.017,-.179,.037,.004]],
 [[.018,-.113,.046,.028],[.037,-.149,.060,.021],[.019,-.176,.036,.005]],
 [[.060,-.097,.053,.027],[.094,-.132,.065,.023],[.073,-.167,.038,.005]],
 [[.082,-.052,.053,.028],[.129,-.091,.069,.025],[.117,-.125,.039,.006]],
 [[.090,-.010,.053,.029],[.145,-.028,.060,.023],[.134,-.067,.037,.006]],
 [[.090,.030,.050,.027],[.139,.046,.058,.021],[.147,.010,.037,.005]],
 [[.081,.070,.052,.026],[.128,.105,.064,.021],[.148,.079,.039,.004]],
 [[.066,.100,.050,.025],[.096,.141,.061,.021],[.128,.151,.043,.005]],
 [[.033,.109,.052,.024],[.051,.148,.063,.023],[.059,.177,.046,.005]],
];
const strands=[];
for(const arr of locks)for(let i=0;i<arr.length-1;i++)strands.push([arr[i],arr[i+1]]);
function swept(x,y,z,a,b) {
  const vx=b[0]-a[0],vy=b[1]-a[1],vz=b[2]-a[2];
  const t=Math.min(1,Math.max(0,((x-a[0])*vx+(y-a[1])*vy+(z-a[2])*vz)/(vx*vx+vy*vy+vz*vz)));
  const px=a[0]+t*vx,py=a[1]+t*vy,pz=a[2]+t*vz;
  const r=(a[3]+(b[3]-a[3])*t)*.90; // taper broad cast locks, avoiding rounded sausage silhouettes
  return Math.sqrt((x-px)**2+(y-py)**2+((z-pz)*1.17)**2)-r;
}
function field(x,y,z) {
  // Cast backing mass. Eyes, ears and face are shaped in full xyz, with meaningful side profile.
  let d=ell(x,y,z,0,0,.013,.106,.154,.038);
  d=smoothMin(d,ell(x,y,z,0,.019,.047,.073,.107,.066),.012); // cranium
  d=smoothMin(d,ell(x,y,z,0,.063,.063,.062,.061,.064),.010); // forehead
  d=smoothMin(d,ell(x,y,z,0,-.022,.082,.028,.068,.061),.010); // long nose bridge

  for(const sign of [-1,1]){
    d=smoothMin(d,ell(x,y,z,sign*.036,.051,.106,.037,.022,.039),.011); // pronounced brow
    d=smoothMin(d,ell(x,y,z,sign*.049,-.040,.079,.041,.048,.051),.012); // cheek-bone
    d=smoothMin(d,ell(x,y,z,sign*.027,-.086,.100,.034,.027,.043),.008); // whisker pad
    d=smoothMin(d,ell(x,y,z,sign*.084,.108,.041,.031,.037,.027),.010); // ears
  }
  d=smoothMin(d,ell(x,y,z,0,-.128,.058,.052,.034,.047),.007); // chin
  d=smoothMin(d,ell(x,y,z,0,-.077,.115,.026,.028,.038),.006); // nose shield

  // True triangular feline nose wedge: upper span ~50 mm, converges beneath.
  const fy=Math.max(0,Math.min(1,(y+.104)/.028));
  const noseW=.007+.020*fy;
  const nose=Math.max(Math.abs(x)-noseW,Math.abs(y+.090)-.016,Math.abs(z-.145)-.012);
  d=smoothMin(d,nose,.0035);

  // Distinct, sculpted locks of mane: not evenly spaced radial shader noise.
  for(const [a,b] of strands){
    // Quickly skip strands outside influence.
    const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
    if(Math.abs(x-mx)>.105||Math.abs(y-my)>.105)continue;
    d=smoothMin(d,swept(x,y,z,a,b),.018); // merge locks organically into common mane mass
  }
  // Negative spaces carved into the continuous casting:
  // lower ear bowl, almond eye hollows, small pupils and whisker scratches.
  for(const sign of [-1,1]){
    d=Math.max(d,-ell(x,y,z,sign*.085,.112,.067,.017,.022,.020)); // ear inset
    d=Math.max(d,-ell(x,y,z,sign*.038,.024,.128,.024,.010,.022)); // almond orbit
    d=Math.min(d,ell(x,y,z,sign*.039,.023,.112,.008,.008,.011)); // bead inside recessed eye
    d=Math.max(d,-ell(x,y,z,sign*.018,-.093,.154,.007,.005,.014)); // nostril
    for(let w=0;w<3;w++){
      const yy=-.085-w*.009;
      const xx=sign*(.039+w*.003);
      d=Math.max(d,-ell(x,y,z,xx,yy,.143,.018,.0028,.009)); // engraved muzzle grooves
    }
  }
  d=Math.max(d,-ell(x,y,z,0,-.123,.133,.049,.008,.020)); // visible open mouth
  d=Math.max(d,-ell(x,y,z,0,-.108,.149,.004,.021,.010)); // philtrum
  // Trim back as a flat mounting face: supports all features and stays one solid.
  d=Math.max(d,-.007-z);
  return d;
}

// Signed voxel volume.
for(let i=0;i<NX;i++)for(let j=0;j<NY;j++)for(let k=0;k<NZ;k++){
  grid[at(i,j,k)]=field(min[0]+i*PITCH,min[1]+j*PITCH,min[2]+k*PITCH);
}
const TETS=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
const PAIRS=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
const VERTS=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
const pos=[],indices=[],map=new Map();
const idx=(p)=>{
  const key=p.map(v=>Math.round(v*100000)).join(',');
  let id=map.get(key);if(id===undefined){id=pos.length/3;map.set(key,id);pos.push(...p);}return id;
};
function normalAt(p) {
  const h=.001;
  const dx=field(p[0]+h,p[1],p[2])-field(p[0]-h,p[1],p[2]);
  const dy=field(p[0],p[1]+h,p[2])-field(p[0],p[1]-h,p[2]);
  const dz=field(p[0],p[1],p[2]+h)-field(p[0],p[1],p[2]-h);
  const l=Math.hypot(dx,dy,dz)||1;return [dx/l,dy/l,dz/l];
}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function polygon(points) {
 const c=[0,1,2].map(k=>points.reduce((s,p)=>s+p[k],0)/points.length);
 const n=normalAt(c),axis=Math.abs(n[1])<.92?[0,1,0]:[1,0,0];
 let u=cross(axis,n);const len=Math.hypot(...u)||1;u=u.map(x=>x/len);
 const v=cross(n,u);
 points.sort((a,b)=>{
   const A=a.map((x,i)=>x-c[i]),B=b.map((x,i)=>x-c[i]);
   return Math.atan2(dot(A,v),dot(A,u))-Math.atan2(dot(B,v),dot(B,u));
 });
 for(let i=1;i<points.length-1;i++){
   const a=idx(points[0]),b=idx(points[i]),cidx=idx(points[i+1]);
   if(a===b||b===cidx||cidx===a)continue;
   const p0=points[0],p1=points[i],p2=points[i+1];
   const e1=p1.map((x,j)=>x-p0[j]),e2=p2.map((x,j)=>x-p0[j]);
   if(dot(cross(e1,e2),n)>0)indices.push(a,b,cidx);
   else indices.push(a,cidx,b);
 }
}
for(let i=0;i<NX-1;i++)for(let j=0;j<NY-1;j++)for(let k=0;k<NZ-1;k++){
 const v=VERTS.map(([dx,dy,dz])=>grid[at(i+dx,j+dy,k+dz)]);
 if(Math.min(...v)>0||Math.max(...v)<0)continue;
 const p=VERTS.map(([dx,dy,dz])=>[min[0]+(i+dx)*PITCH,min[1]+(j+dy)*PITCH,min[2]+(k+dz)*PITCH]);
 for(const tet of TETS){
   const samples=tet.map(ii=>v[ii]),verts=[];
   if(Math.min(...samples)>0||Math.max(...samples)<0)continue;
   for(const [ta,tb] of PAIRS){
     const a=tet[ta],b=tet[tb],sa=v[a],sb=v[b];
     if((sa<0)===(sb<0))continue;
     const t=sa/(sa-sb);
     verts.push(p[a].map((x,c)=>x+(p[b][c]-x)*t));
   }
   if(verts.length>=3)polygon(verts);
 }
}
if(!pos.length||pos.length/3>65535)throw Error('Bad sculpture vertices '+pos.length/3);
const bytesOf=(arr)=>Buffer.from(arr.buffer,arr.byteOffset,arr.byteLength).toString('base64');
const q=new Int16Array(pos.length), c=new Uint8Array(pos.length);
const rgb=(hex)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const mid=rgb('#39362f'),gold=rgb('#a58a5f'),dark=rgb('#242322');
const gauss=(x,y,cx,cy,rx,ry)=>Math.exp(-2*(((x-cx)/rx)**2+((y-cy)/ry)**2));
for(let i=0;i<pos.length/3;i++){
 const x=pos[i*3],y=pos[i*3+1],z=pos[i*3+2];
 for(let j=0;j<3;j++)q[i*3+j]=Math.round(pos[i*3+j]*100000);
 const eye=gauss(Math.abs(x),y,.038,.024,.024,.013);
 const nostril=gauss(Math.abs(x),y,.018,-.093,.009,.007);
 const mouth=gauss(x,y,0,-.123,.052,.010);
 const wear=Math.min(1,.075+
   .45*gauss(Math.abs(x),y,.037,.050,.043,.019)+
   .49*gauss(x,y,0,-.050,.034,.077)+
   .36*gauss(Math.abs(x),y,.029,-.091,.033,.027)+
   .20*(Math.abs(x)>.070?.9:0));
 const shadow=Math.min(1,.82*eye+.70*nostril+.74*mouth);
 const rise=Math.max(0,Math.min(1,(z-.04)*2));
 for(let j=0;j<3;j++)c[i*3+j]=Math.max(0,Math.min(255,Math.round((mid[j]*(1-wear*.60)+gold[j]*wear*.60)*(1-shadow*.76)*(1+.13*rise))));
}
const ix=new Uint16Array(indices);
const output=`// AUTO-GENERATED by scripts/generate-lion-sculpt.mjs. Do not hand-edit.\n// FRONT-R04: authored watertight 3D sculpture, baked before shipping to devices.\nexport const LION_SCULPT = {\n  vertexCount: ${pos.length/3},\n  triangleCount: ${ix.length/3},\n  coordinateScale: 100000,\n  positions: '${bytesOf(q)}',\n  indices: '${bytesOf(ix)}',\n  colors: '${bytesOf(c)}',\n} as const;\n`;
writeFileSync('src/world/lionSculptData.ts',output,'utf8');
console.log('FRONT_R04_BAKE',JSON.stringify({dims:N,vertices:pos.length/3,triangles:ix.length/3,bytes:output.length}));
