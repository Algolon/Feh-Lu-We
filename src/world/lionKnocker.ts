// FRONT-R03: organically carved cast-bronze lion's-head door knocker.
// Single continuous closed relief (not spheres/cones), with all anatomy carved
// from one surface. Tiny metal hardware stays in the same batched material family.
import * as THREE from 'three';
import { geo, type Batcher } from './kit';

export const LION_BRONZE = {
  recess: '#242322',
  body: '#393631',
  middle: '#605442',
  polished: '#a38a62',
} as const;

const RADIAL = 30, AROUND = 96;
const g = (x:number,y:number,cx:number,cy:number,sx:number,sy:number) =>
  Math.exp(-2 * ((x-cx)**2/sx**2 + (y-cy)**2/sy**2));
const clamp = (x:number) => Math.max(0,Math.min(1,x));
const smooth = (a:number,b:number,x:number) => {const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const near = (a:number,b:number) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
const BASE = new THREE.Color(LION_BRONZE.body);
const MID = new THREE.Color(LION_BRONZE.middle);
const HILITE = new THREE.Color(LION_BRONZE.polished);
const RECESS = new THREE.Color(LION_BRONZE.recess);

/** Smoothly patinated blackened bronze, with gold wear only on raised cast edges. */
function bronzeColor(wear:number,shadow:number):THREE.Color {
  const c=BASE.clone().lerp(MID,clamp(.25+wear*.55));
  c.lerp(HILITE,clamp(wear*.40));
  c.lerp(RECESS,clamp(shadow*.91));
  return c;
}

/** A closed, indexed continuous cast-metal relief (one connected surface). */
export function lionHeadReliefGeometry():THREE.BufferGeometry {
  const position:number[]=[],colors:number[]=[],uv:number[]=[],indices:number[]=[];
  const vertex=(x:number,y:number,z:number,wear:number,shade:number)=>{
    position.push(x,y,z);
    const col=bronzeColor(wear,shade);
    colors.push(col.r,col.g,col.b);
    uv.push(.5+x/.29,.5+y/.40);
  };

  // Rounded crown, ears, cheek ruffs, elongated lower mane; deliberately
  // irregular instead of a symmetrical scalloped disk.
  const outline=(a:number)=>{
    const cr=.022*Math.sin(5*a+.22)+.019*Math.sin(9*a-.65)+.008*Math.sin(14*a+.4);
    const ears=.095*Math.exp(-near(a,.77)**2/.016)+.085*Math.exp(-near(a,2.39)**2/.019);
    const crown=.042*Math.exp(-near(a,Math.PI/2)**2/.22);
    const chin=.078*Math.exp(-near(a,3*Math.PI/2)**2/.22);
    return 1+cr+ears+crown+chin;
  };

  function sculpt(x:number,y:number,r:number,a:number) {
    const ax=Math.abs(x);
    const mane=smooth(.49,.74,r);
    const face=g(x,y,0,.012,.075,.122);
    const temples=g(x,y,-.072,.027,.040,.083)+g(x,y,.072,.027,.040,.083);
    const skull=g(x,y,0,.070,.070,.065);
    const bridge=g(x,y,0,-.030,.028,.076);
    const brows=g(x,y,-.036,.050,.032,.019)+g(x,y,.036,.050,.032,.019);
    const eyesockets=g(x,y,-.033,.022,.022,.017)+g(x,y,.033,.022,.022,.017);
    const cheeks=g(x,y,-.053,-.042,.031,.045)+g(x,y,.053,-.042,.031,.045);
    const muzzle=g(x,y,-.024,-.092,.030,.027)+g(x,y,.024,-.092,.030,.027);
    const jaw=g(x,y,0,-.135,.043,.026);

    // The eyes are curved almond slots under heavy prominent brows, not round holes.
    let eyeCuts=0,irises=0,nostrils=0,earRise=0,earHollows=0,whiskers=0;
    for (const sign of [-1,1]) {
      const ex=(x-sign*.034)/.018;
      const ey=(y-(.025-sign*.12*(x-sign*.034)))/.0068;
      eyeCuts+=Math.exp(-2.3*(ex**4+ey**4));
      irises+=g(x,y,sign*.034,.022,.006,.006);
      nostrils+=g(x,y,sign*.018,-.093,.008,.005);
      earRise+=g(x,y,sign*.087,.094,.027,.028);
      earHollows+=g(x,y,sign*.086,.102,.014,.014);
      // Three shallow tapering whisker grooves engraved into cast muzzle.
      for(let k=0;k<3;k++){
        const d=ax-(.035+k*.004);
        const yy=-.086-k*.008+(ax-.035)*(.33+k*.18);
        whiskers+=Math.exp(-2*(d/.024)**4-2*((y-yy)/.0028)**2);
      }
    }

    // Strong feline nose: broad dark triangular base, tapering below into the Y lip.
    const nt=clamp((y+.105)/.034);
    const nw=.004+.022*nt;
    const nose=smooth(-.103,-.094,y)*(1-smooth(-.071,-.064,y))*
      smooth(0,.003,nw-ax);
    const snoutTip=g(x,y,0,-.073,.030,.037);
    const mouthY=-.128+.17*ax;
    const mouth=smooth(.047,.039,ax) * Math.exp(-2*((y-mouthY)/.006)**2);
    const philtrum=g(x,y,0,-.112,.004,.026);
    const bottomLip=g(x,y,0,-.141,.039,.012);

    // Hand-carved fur sweeps down and out from the crown. Each lock has its own
    // phase, scale and curvature: broad major ridges plus a few delicate cuts.
    const flow=8.4*a+5.6*r+.55*Math.sin(3*a+.35)+.32*Math.sin(5*a-.68);
    const bigFur=Math.sin(flow);
    const furCut=Math.pow(Math.max(0,Math.cos(flow+.15)),10);
    const fineFur=Math.sin(18*a+9*r+.8*Math.sin(4*a));
    const earMask=earRise-earHollows;

    // Main sculpted anatomy is actual displacement, not colour-only decoration.
    let height=.016+.032*(1-r*r)
      +.076*face+.023*skull+.020*temples
      +.042*bridge+.044*brows-.034*eyesockets
      +.038*cheeks+.052*muzzle+.048*snoutTip
      +.028*nose+.028*jaw+.022*earRise-.023*earHollows
      -.020*mouth-.017*philtrum-.010*bottomLip
      -.013*eyeCuts-.016*nostrils;
    height+=mane*(.019*bigFur-.023*furCut+.003*fineFur);
    height-=.004*whiskers;

    // Strong recess contrast yields legibility from normal gameplay distance.
    const shadow=clamp(
      .74*eyesockets+.94*eyeCuts+.87*irises+
      .95*nostrils+.88*mouth+.70*philtrum+
      .81*furCut*mane+.72*earHollows+.34*whiskers);
    const wear=clamp(
      .34*brows+.22*bridge+.19*cheeks+.29*muzzle+
      .18*snoutTip+.29*nose+.21*jaw+
      .19*Math.max(0,bigFur)*mane+.08*earMask);
    return {height,wear,shadow};
  }

  const centre=sculpt(0,0,0,0);
  vertex(0,0,centre.height,centre.wear,centre.shadow);
  for(let row=1;row<=RADIAL;row++){
    const r=row/RADIAL;
    for(let j=0;j<AROUND;j++){
      const a=j*2*Math.PI/AROUND,rr=r*outline(a);
      const x=.119*rr*Math.cos(a),y=.151*rr*Math.sin(a);
      const v=sculpt(x,y,r,a);
      vertex(x,y,v.height,v.wear,v.shadow);
    }
  }
  const idx=(row:number,j:number)=>row===0?0:1+(row-1)*AROUND+(j+AROUND)%AROUND;
  for(let j=0;j<AROUND;j++)indices.push(0,idx(1,j),idx(1,j+1));
  for(let row=1;row<RADIAL;row++)for(let j=0;j<AROUND;j++){
    indices.push(idx(row,j),idx(row+1,j),idx(row+1,j+1));
    indices.push(idx(row,j),idx(row+1,j+1),idx(row,j+1));
  }
  // Closed, flat rear + side, fully part of the same connected surface.
  const rearCenter=position.length/3;
  vertex(0,0,-.006,0,.7);
  const rearStart=position.length/3;
  for(let j=0;j<AROUND;j++){
    const a=j*2*Math.PI/AROUND;
    vertex(.119*outline(a)*Math.cos(a),.151*outline(a)*Math.sin(a),-.006,0,.7);
  }
  for(let j=0;j<AROUND;j++){
    const next=(j+1)%AROUND;
    indices.push(rearCenter,rearStart+next,rearStart+j);
    indices.push(idx(RADIAL,j),rearStart+j,rearStart+next);
    indices.push(idx(RADIAL,j),rearStart+next,idx(RADIAL,j+1));
  }
  const geo3d=new THREE.BufferGeometry();
  geo3d.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
  geo3d.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geo3d.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo3d.setIndex(indices);geo3d.computeVertexNormals();
  geo3d.userData.keepColor=true;
  return geo3d;
}

/** Matching aged-bronze patina on 3D cylindrical pulls or the knocker ring. */
export function castBronzeMetal(g:THREE.BufferGeometry):THREE.BufferGeometry {
  const pos=g.attributes.position as THREE.BufferAttribute;
  const norm=g.attributes.normal as THREE.BufferAttribute;
  const colors:number[]=[];
  for(let i=0;i<pos.count;i++){
    const n=norm.getX(i),m=norm.getZ(i);
    const ridge=Math.pow(Math.abs(n),9); // rubbed gold along two narrow shaft edges
    const front=Math.max(0,m);
    const col=bronzeColor(.12+.77*ridge+.07*front,.08+(1-front)*.32);
    colors.push(col.r,col.g,col.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.userData.keepColor=true;
  return g;
}

export function addLionKnocker(b:Batcher,metal:THREE.Material,cx:number,cy:number,th:number){
  const front=-th/2;
  const relief=lionHeadReliefGeometry();
  // Keep the back against timber, face raised into outdoor space.
  geo(b,metal,'#ffffff',relief,cx,cy,front-.012,{jitter:0});
  relief.dispose();

  // The ring is caught by the dark open jaw; its top passes under the muzzle.
  const ring=castBronzeMetal(new THREE.TorusGeometry(.062,.009,9,32));
  geo(b,metal,'#ffffff',ring,cx,cy-.178,front-.127,{jitter:0});
  ring.dispose();
  const stop=castBronzeMetal(new THREE.SphereGeometry(.013,12,8));
  geo(b,metal,'#ffffff',stop,cx,cy-.248,front-.035,{jitter:0});
  stop.dispose();
}
