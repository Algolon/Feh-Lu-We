// EXT-R01 arrival composition: measured gravel, dressed edging and a formal entrance apron.
// Existing surface footprints, car positions, terrain, path network and collision remain authoritative.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { ARRIVAL_GRAVEL, DRIVEWAY, type Rect } from './layout';
import { boxMM, planMatrix } from './kit';
import { bake, projectUV } from './artkit';
import { dressedBlock, exteriorMats, gravelUV } from './exteriorStudy';
import { FOREST_PATHS } from './terrain';
import { distToPolyline } from './nature';

const inside = (x: number, z: number) => ARRIVAL_GRAVEL.some(r=>x>r.x0-1e-5&&x<r.x1+1e-5&&z>r.z0-1e-5&&z<r.z1+1e-5);
const stone = ['#c4c1af','#d0cbbb','#bcbcad','#d9d1bd','#c8c5b3'];
function hash(x:number,z:number) { return Math.abs(Math.sin(x*37.21+z*11.39)*43758.5453)%1; }

export function arrivalGravel(c: Ctx) {
  for (const r of ARRIVAL_GRAVEL) {
    // Subdivision gives broad authored wear zones without another overlaid transparent material.
    const g=gravelUV(new THREE.PlaneGeometry(r.x1-r.x0,r.z1-r.z0,Math.ceil((r.x1-r.x0)/1.5),Math.ceil((r.z1-r.z0)/1.5))
      .rotateX(-Math.PI/2).translate((r.x0+r.x1)/2,.03,-(r.z0+r.z1)/2));
    const p=g.attributes.position, colors=[];
    for(let i=0;i<p.count;i++) {
      const x=p.getX(i),z=-p.getZ(i);
      const wheel=Math.exp(-Math.pow((Math.abs(x-90)-1.0)/.5,2))*Math.max(0,(67-z)/5);
      const edge=1-Math.min(1,Math.min(x-r.x0,r.x1-x,z-r.z0,r.z1-z)/.7);
      const v=1-wheel*.09-edge*.035;
      colors.push(v,v,v*.995);
    }
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.userData.keepColor=true;
    c.b.add(exteriorMats().gravel,g,new THREE.Matrix4(),'#f2f0e7','paths',false,0);g.dispose();
  }
  edging(c);
  paving(c,{x0:86,x1:94,z0:75.15,z1:78.16},.94,.60);
  // Three concentric courses form an intentional frame around the existing circular planter.
  for(let row=0;row<3;row++)for(let i=0;i<48;i++) {
    const a0=(i/48)*Math.PI*2+.006,a1=((i+1)/48)*Math.PI*2-.006;
    const ri=2.01+row*.34,ro=ri+.325;
    const pts=[[Math.cos(a0)*ri+90,Math.sin(a0)*ri+70],[Math.cos(a1)*ri+90,Math.sin(a1)*ri+70],[Math.cos(a1)*ro+90,Math.sin(a1)*ro+70],[Math.cos(a0)*ro+90,Math.sin(a0)*ro+70]];
    const shape=new THREE.Shape(pts.map(([x,z])=>new THREE.Vector2(x,z)));
    const g=new THREE.ShapeGeometry(shape);g.rotateX(-Math.PI/2);g.translate(0,.053,0);
    c.b.add(exteriorMats().dressed,projectUV(g,.6),new THREE.Matrix4(),stone[(i+row*2)%stone.length],'paths',false,0);g.dispose();
  }
  // Inlaid bay markers replace painted white stripes, keeping all five original parking bays legible.
  for(const x of [69.5,72.3,75.1,77.9,101,103.8,106.6])for(let z=72.25;z<77.4;z+=.52)
    dressedBlock(c,x,.041,z,.09,.025,.48,'#c7c4b3',.008,'paths');
}
function paving(c:Ctx,r:Rect,sw:number,sd:number) {
  // Dark substrate is mortar/contact, 1 cm below the individual stones (no coplanar overlaps).
  boxMM(c.b,c.k.M.paint,'#83877d',r.x0,r.x1,.031,.042,r.z0,r.z1,{chunk:'paths',jitter:0,shadow:false});
  let row=0;
  for(let z=r.z0;z<r.z1-.02;row++) {
    const ze=Math.min(z+sd*(.87+hash(row,19)*.26),r.z1), offset=row%2?-sw*.45:0;
    for(let x=r.x0+offset;x<r.x1-.02;) {
      const end=x+sw*(.82+hash(x,row)*.36),xa=Math.max(x,r.x0),xb=Math.min(end,r.x1);
      if(xb-xa>.12) pavingStone(c,xa,xb,z,ze,row);
      x=end;
    }
    z=ze;
  }
}
/** Hand-dressed slabs: bounded irregular outlines, chipped corners and restrained surface wear.
 * Each stays inside its laying cell; no random rotation that could overlap adjacent stones. */
function pavingStone(c:Ctx,xa:number,xb:number,za:number,zb:number,row:number) {
  const w=xb-xa,d=zb-za,seed=hash(xa,za),gap=.013;
  const hx=w/2-gap, hz=d/2-gap;
  const chip=(i:number)=>Math.min(w*.16,d*.16,.022+hash(seed*100,i)*.044);
  const points=[[-hx+chip(0),-hz+.003], [hx-chip(1),-hz+.007], [hx,-hz+chip(2)],
    [hx-.005,hz-chip(3)],[hx-chip(4),hz],[-hx+chip(5),hz-.004],[-hx,hz-chip(6)],[-hx+.004,-hz+chip(7)]];
  const shape=new THREE.Shape(points.map(([x,z])=>new THREE.Vector2(x,z)));
  const g=new THREE.ExtrudeGeometry(shape,{depth:.021,steps:1,bevelEnabled:true,bevelSize:.006,bevelThickness:.005,bevelSegments:1,curveSegments:1});
  g.rotateX(-Math.PI/2);g.translate(0,.038,0);
  // Subtle crown and edge wear in vertex colours, independent of the sun direction.
  bake(g,p=>.83+.17*THREE.MathUtils.smoothstep(p.y,.032,.054));
  const tint=new THREE.Color(stone[Math.floor(seed*stone.length)]);
  tint.multiplyScalar(.95+hash(row,xa)*.10);
  c.b.add(exteriorMats().dressed,projectUV(g,.6),planMatrix((xa+xb)/2,0,(za+zb)/2),tint,'paths',false,0);g.dispose();
}

function edging(c:Ctx) {
  // Extract the union boundary, rather than drawing a border around each overlapping component rectangle.
  const xs=[...new Set(ARRIVAL_GRAVEL.flatMap(r=>[r.x0,r.x1]))].sort((a,b)=>a-b);
  const zs=[...new Set(ARRIVAL_GRAVEL.flatMap(r=>[r.z0,r.z1]))].sort((a,b)=>a-b);
  const edge=(x0:number,z0:number,x1:number,z1:number)=>{
    const L=Math.hypot(x1-x0,z1-z0),N=Math.ceil(L/.68);
    for(let i=0;i<N;i++) {
      const t=(i+.5)/N,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;
      // Leave every forest-path and driveway mouth open; no decorative line across a route.
      if(distToPolyline(x,z,DRIVEWAY)<2.55||FOREST_PATHS.some(p=>distToPolyline(x,z,p)<1.7))continue;
      dressedBlock(c,x,.034,z,x0===x1?.20:L/N-.014,.065,z0===z1?.20:L/N-.014,stone[i%stone.length],.014,'paths');
    }
  };
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++) {
    const x0=xs[i],x1=xs[i+1],z0=zs[j],z1=zs[j+1],x=(x0+x1)/2,z=(z0+z1)/2;
    if(!inside(x,z))continue;
    if(!inside(x0-.01,z))edge(x0,z0,x0,z1);
    if(!inside(x1+.01,z))edge(x1,z0,x1,z1);
    if(!inside(x,z0-.01))edge(x0,z0,x1,z0);
    if(!inside(x,z1+.01))edge(x0,z1,x1,z1);
  }
}

/** Driveway wheel wear and darker grassy shoulders; draped on the existing route geometry. */
export function driveGravel(g: THREE.BufferGeometry) {
  gravelUV(g);
  const p=g.attributes.position, color=[];
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),z=-p.getZ(i),center=z<26?90:z<48?90+(z-26)/22*.6:90.6-(z-48)/14*.6;
    const d=Math.abs(x-center),v=1-.075*Math.exp(-Math.pow((d-1)/.32,2))-.10*THREE.MathUtils.smoothstep(d,1.8,2.4);
    color.push(v,v,v*.995);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));g.userData.keepColor=true;
  return g;
}
