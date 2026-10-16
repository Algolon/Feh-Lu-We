// LIB-R01-R02: library-specific manor furniture. No global furniture family changes.
// All geometry is batched with mLib and shares the existing timber/upholstery/brass materials.
// Local +z is furniture FRONT (plan coordinates); the models face the reading / work area.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { Asm, artMats, softBox, cushion, lathe, projectUV } from './artkit';
import { box, cyl, planMatrix } from './kit';
import { GF, UF } from './layout';

const GEO=new Map<string,THREE.BufferGeometry>();
function cached(key:string, make:()=>THREE.BufferGeometry) {
  let g=GEO.get(key);
  if(!g){g=make();g.userData.shared=true;GEO.set(key,g);}
  return g;
}
const cube=(x:number,y:number,z:number,r=0.012)=>cached('lib02box:'+[x,y,z,r].join(':'),()=>projectUV(softBox(x,y,z,r,1,1),0.75));
const pad=(x:number,y:number,z:number)=>cached('lib02pad:'+x+':'+y+':'+z,()=>projectUV(cushion(x,y,z,0.045,0.018,'top',1,3),0.27));
const ball=cached('lib02sphere',()=>new THREE.SphereGeometry(1,8,6));
const wood='#593622',woodDark='#39251b',edge='#966741',brass='#b99a5d',wine='#63382f';
const T=(c:Ctx)=>artMats();
type Desk={readonly x:number;readonly z:number;readonly w:number;readonly d:number;readonly h:number};

/** Richer Victorian oak partner desk. Its B01 puzzle stays on the same TOP and
 * the saved reward drawer keeps its exact east-facing anchor (x+0.66,z).
 * The centre is deliberately kept clear for the desk chair's knees. */
export function libraryR02Desk(c:Ctx,d:Desk){
  const M=T(c),a=new Asm(c.b,c.chunk,d.x,GF,d.z,0);
  // Solid softened writing surface and stepped moulded perimeter.
  a.add(M.timber,wood,cube(d.w+.10,.062,d.d+.10,.018),0,d.h-.031,0);
  a.add(M.timber,edge,cube(d.w+.14,.022,d.d+.14,.010),0,d.h-.069,0);
  a.add(M.timber,woodDark,cube(d.w+.045,.060,d.d+.04,.006),0,d.h-.106,0);
  // Opposing solid pedestal cabinets leave an actual knee recess in the centre.
  for(const side of [-1,1]){
    const z=side*.82;
    a.add(M.timber,woodDark,cube(1.08,.635,.46,.020),-.03,.365,z);
    a.add(M.timber,wood,cube(1.1,.050,.49,.013),-.03,.063,z);
    a.add(M.timber,edge,cube(1.12,.045,.50,.013),-.03,.698,z);
    // Panel lines frame each eastern drawer face; handles have a brass backplate and pull.
    for(const yy of [.26,.50]){
      a.add(M.timber,edge,cube(.026,.17,.410,.005),.535,yy,z);
      a.add(M.timber,wood,cube(.030,.138,.366,.006),.554,yy,z);
      a.add(M.brass,brass,cube(.014,.043,.095,.006),.574,yy+.006,z);
      a.add(M.brass,'#e0bd71',cube(.028,.013,.058,.004),.586,yy+.007,z);
    }
    // Offset wooden feet and carved corner columns.
    for(const x of [-.53,.46]){
      const feet=cached('lib02deskfoot',()=>lathe([[.05,0],[.067,.035],[.06,.08],[.048,.12],[.033,.17],[.05,.20]],8));
      a.add(M.timber,wood,feet,x,0,z+side*.15);
      a.add(M.timber,edge,cube(.048,.57,.038,.008),x,.42,z+side*.16);
    }
  }
  // Lower knee rail spans the two pedestal interiors, not the player's leg area.
  a.add(M.timber,edge,cube(.07,.11,1.15,.01),-.51,.165,0);
  // Low decorative pigeonholes live only on the WEST/back edge of the desk;
  // the east-side puzzle slots and lamp must remain readable and reachable.
  a.add(M.timber,woodDark,cube(.24,.33,1.62,.022),-.52,1.015,0);
  a.add(M.timber,edge,cube(.34,.055,1.77,.014),-.51,1.205,0);
  for(const z of [-.63,-.315,0,.315,.63]){
    a.add(M.timber,edge,cube(.24,.24,.024,.004),-.51,1.036,z);
    a.add(M.timber,wood,cube(.22,.027,.29,.004),-.51,.91,z+.157);
  }
  // Short carved wings frame the hutch without hiding the central B01 tiles.
  for(const z of [-.86,.86])a.add(M.timber,wood,cube(.24,.41,.050,.012),-.51,1.01,z);
  c.col.addBoxC(d.x,d.z,d.w,d.d,GF,GF+d.h);
}

/** One coherent Chesterfield-inspired seat family, scaled for sofa or wing reading chair.
 * Quilted back: recessed-button rhythm, carved timber crest and brass nailhead finish.
 * Avoid individually meshed 3D cloth wrinkles: softened batch geometry reads better at mobile DPR. */
export function libraryR02ReadingSeat(c:Ctx,x:number,z:number,y0:number,yaw:number,w:number,chair=false) {
  const M=T(c),a=new Asm(c.b,c.chunk,x,y0,z,yaw);
  const D=chair?.99:1.04,H=chair?1.23:1.10;
  const upholstery=chair?'#754837':wine,lo=new THREE.Color(upholstery).multiplyScalar(.73);
  const inner=w-.34,backZ=-D/2+.125;
  // four short carved walnut feet, attached to a continuous bottom timber rail
  const fg=cached('lib02foot',()=>lathe([[.055,0],[.068,.028],[.041,.065],[.044,.12],[.068,.135]],8));
  for(const sx of [-1,1])for(const sz of [-1,1])
    a.add(M.timber,wood,fg,sx*(w/2-.13),0,sz*(D/2-.14));
  a.add(M.timber,woodDark,cube(w-.06,.115,D-.07,.022),0,.16,0);
  a.add(M.timber,edge,cube(w-.045,.032,D-.07,.01),0,.230,0);
  a.add(M.upholstery,lo,cube(w-.11,.205,D-.08,.055),0,.335,0);
  const count=chair?1:3,each=inner/count;
  for(let s=0;s<count;s++) {
    const sx=-inner/2+each*(s+.5);
    a.add(M.upholstery,upholstery,pad(each-.022,.13,D-.35),sx,.493,.12);
    a.add(M.upholstery,lo,cube(each-.06,.014,.018,.004),sx,.54,D/2-.105);
  }
  // A broad, high rounded back with a separate inset quilted panel (not loose cushions).
  a.add(M.timber,wood,cube(w-.015,.067,.17,.026),0,H-.043,backZ-.036);
  a.add(M.upholstery,lo,cube(w-.01,H-.40,.19,.065),0,.40+(H-.40)/2,backZ-.035);
  a.add(M.upholstery,upholstery,cube(w-.145,H-.46,.16,.055),0,.455+(H-.46)/2,backZ+.09);
  // 2 staggered rows of small leather-covered buttons, subtle diamonds instead of metal dots.
  const rows=chair?3:3,cols=chair?2:7;
  for(let row=0;row<rows;row++){
    const yy=.63+row*(chair?.185:.145);
    for(let col=0;col<cols;col++){
      const px=((col+.5+(row%2)*.23)/cols-.5)*(w-.31);
      a.add(M.upholstery,lo,ball,px,yy,backZ+.186,{s:[.024,.024,.013]});
      a.add(M.upholstery,upholstery,ball,px,yy,backZ+.201,{s:[.009,.009,.007]});
    }
  }
  // Raised rolled arms, timber crown around outer scroll front, upholstery on inner face.
  const roll=cached('lib02roll'+(chair?'C':'S'),()=>new THREE.CylinderGeometry(.086,.086,D-.13,10).rotateX(Math.PI/2));
  const disk=cached('lib02endcap',()=>new THREE.CylinderGeometry(.083,.083,.028,12).rotateX(Math.PI/2));
  for(const side of [-1,1]){
    const sx=side*(w/2-.115);
    a.add(M.upholstery,lo,cube(.215,.37,D-.10,.06),sx,.43,.015);
    a.add(M.upholstery,upholstery,roll,sx,.649,0);
    a.add(M.upholstery,upholstery,disk,sx,.65,D/2-.06);
    // Walnut volute line on the endcap and six nailheads along the arm front edge.
    a.add(M.timber,edge,ball,sx,.65,D/2-.037,{s:[.035,.035,.014]});
    for(let n=0;n<6;n++)
      a.add(M.brass,brass,ball,sx,.25+n*.068,D/2-.031,{s:[.010,.010,.008]});
    // wing-back profile climbs into the shoulders of the fauteuil.
    if(chair){
      a.add(M.upholstery,lo,cube(.125,.43,.26,.048),side*(w/2-.105),.84,-D/2+.24);
      a.add(M.timber,edge,cube(.038,.45,.26,.010),side*(w/2-.044),.84,-D/2+.25);
    }
  }
  // Dark welt line below cushions and subtly carved timber apron.
  a.add(M.timber,edge,cube(w-.13,.040,.060,.010),0,.227,D/2-.040);
  // Existing room locomotion regards seating as one simple solid volume.
  const rotated=Math.abs(Math.sin(yaw))>.7;
  c.col.addBoxC(x,z,rotated?D:w,rotated?w:D,y0,y0+.90);
}

/** Classic upholstered library writing chair with curved timber crest and armrests.
 * Centre is under the desk edge; keep the explicit player inspection pose free. */
export function libraryR02StudyChair(c:Ctx,x:number,z:number,y0:number,yaw:number) {
  const M=T(c),a=new Asm(c.b,c.chunk,x,y0,z,yaw);
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const g=cached('lib02chairleg',()=>lathe([[.020,0],[.031,.09],[.027,.30],[.042,.44]],8));
    a.add(M.timber,wood,g,sx*.195,0,sz*.18);
  }
  a.add(M.timber,wood,cube(.51,.066,.49,.024),0,.445,0);
  a.add(M.upholstery,'#b79a78',pad(.45,.087,.43),0,.502,.005);
  // Small dark-wood shield back, with an inset soft pad, raked away from the desk.
  a.add(M.timber,wood,cube(.51,.57,.065,.03),0,.77,-.205,{rx:.105});
  a.add(M.upholstery,'#baa586',cube(.420,.40,.077,.045),0,.80,-.164,{rx:.105});
  a.add(M.timber,edge,cube(.54,.06,.09,.022),0,1.061,-.252,{rx:.105});
  for(const sx of [-1,1]){
    a.add(M.timber,wood,cube(.038,.23,.038,.01),sx*.215,.588,.16);
    a.add(M.timber,edge,cube(.060,.035,.44,.013),sx*.229,.701,-.036);
  }
  c.col.addCircle(x,z,.245,y0,y0+1.1);
}

/** Tangential wedge treads with an oak/burnished-bronze continuous spiralling
 * handrail. Keeps the EXACT centreline footsteps and support heights from R01. */
export function libraryR02Spiral(c:Ctx,x:number,z:number,radius:number,steps:number,landing:
 {readonly x0:number;readonly x1:number;readonly z0:number;readonly z1:number}) {
  const k=c.k,M=artMats(),rise=(UF-GF)/steps,turn=Math.PI*2.5,start=-Math.PI/2;
  cyl(c.b,k.M.wood,woodDark,x,GF,z,.068,.068,UF-GF+1.07,12,{chunk:c.chunk});
  cyl(c.b,M.brass,brass,x,UF+.91,z,.092,.092,.10,10,{chunk:c.chunk});
  c.col.addCircle(x,z,.18,GF,UF+1.1);
  const outer=radius-.04,inner=.12;
  const at=(i:number)=>start+(i+.5)*turn/steps;
  // Low-poly trapezoidal fan: true spiral treads are much lighter than stacked rectangular planks.
  const wedge=(angle:number)=>{
    const delta=turn/steps/2+.011,n=3,points:[number,number][]=[];
    for(let j=0;j<=n;j++){const a=angle-delta+j*2*delta/n;points.push([outer*Math.cos(a),outer*Math.sin(a)]);}
    for(let j=n;j>=0;j--){const a=angle-delta+j*2*delta/n;points.push([inner*Math.cos(a),inner*Math.sin(a)]);}
    const verts:number[]=[],inds:number[]=[],N=points.length;
    for(const h of [0,-.049])for(const [px,pz] of points)verts.push(px,h,-pz);
    for(let j=1;j<N-1;j++){inds.push(0,j,j+1);inds.push(N,N+j+1,N+j);}
    for(let j=0;j<N;j++){const next=(j+1)%N;inds.push(j,next,N+next,j,N+next,N+j);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(inds);g.computeVertexNormals();return g;
  };
  const rail:[number,number,number][]=[];
  const N=steps*4;
  for(let j=0;j<=N;j++){
    const fraction=j/N,ang=start+fraction*turn;
    rail.push([radius*Math.cos(ang),rise*(fraction*steps+.7)+.89,-radius*Math.sin(ang)]);
  }
  for(let i=0;i<steps;i++){
    const ang=at(i),y=GF+(i+1)*rise,px=x+.78*Math.cos(ang),pz=z+.78*Math.sin(ang);
    const g=wedge(ang);
    c.b.add(M.timber,g,planMatrix(x,y,z),'#815333',c.chunk,true,0);
    g.dispose();
    // Very thin brass outer tread nosing is carried by the tread. Does not alter collision.
    const bx=x+(radius-.075)*Math.cos(ang),bz=z+(radius-.075)*Math.sin(ang);
    box(c.b,M.brass,'#ae8855',bx,y-.012,bz,.16,.014,.018,{chunk:c.chunk,yaw:-ang});
    // Preserve the proven 2.5D foot pads without adding tread collisions.
    c.col.addFloor(px-.30,px+.30,pz-.30,pz+.30,y);
    if(i%2===0){
      const sx=x+radius*Math.cos(ang),sz=z+radius*Math.sin(ang);
      cyl(c.b,M.brass,'#91754d',sx,y,sz,.016,.019,.94,6,{chunk:c.chunk});
      cyl(c.b,M.timber,edge,sx,y+.90,sz,.025,.025,.05,8,{chunk:c.chunk});
    }
  }
  const pts=rail.map(([px,yy,pz])=>new THREE.Vector3(px,yy,pz));
  const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),steps*5,.027,6,false);
  c.b.add(M.timber,geometry,planMatrix(x,GF,z),woodDark,c.chunk,true,0);
  geometry.dispose();
  const l=landing;
  box(c.b,M.timber,'#815333',(l.x0+l.x1)/2,UF-.065,(l.z0+l.z1)/2,l.x1-l.x0,.13,l.z1-l.z0,{chunk:c.chunk});
  box(c.b,M.timber,edge,(l.x0+l.x1)/2,UF-.03,l.z0+.025,l.x1-l.x0,.028,.045,{chunk:c.chunk});
  c.col.addFloor(l.x0,l.x1,l.z0,l.z1,UF);
}
