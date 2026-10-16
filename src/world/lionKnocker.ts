// FRONT-R02: one continuous, carved relief surface for the entrance lion.
// No assembled spheres, cones or "petal" mane. The nose, lids, eyes, cheek planes,
// muzzle and flowing fur all deform the SAME topological surface.
import * as THREE from 'three';
import { geo, type Batcher } from './kit';

const radial=26, segments=88;
const G=(x:number,y:number,cx:number,cy:number,sx:number,sy:number)=>
  Math.exp(-2*((x-cx)**2/(sx*sx)+(y-cy)**2/(sy*sy)));
const smooth=(a:number,b:number,x:number)=>{
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
};

/** Closed, indexed bas-relief: 1 connected component, organic outline and sculpted front. */
export function lionHeadReliefGeometry():THREE.BufferGeometry {
  const positions:number[]=[], colors:number[]=[],uvs:number[]=[],indices:number[]=[];
  const patina=new THREE.Color('#7f694f');
  const put=(x:number,y:number,z:number,light=1,shade=0)=>{
    positions.push(x,y,z);
    const l=Math.max(.30,Math.min(1.53,light));
    colors.push(patina.r*l*(1-shade*.66),patina.g*l*(1-shade*.75),patina.b*l*(1-shade*.81));
    uvs.push(.5+x/.30,.5+y/.41);
  };
  const radius=(a:number)=>{
    // Natural, slightly asymmetric mane edge: rounded irregular undulations,
    // deliberately avoiding long pointed rays and repetitive leaf-shapes.
    const waves=.019*Math.sin(9*a+.35)+.015*Math.sin(15*a-.85)+.010*Math.sin(5*a+1.1);
    const ear=.06*Math.exp(-((a-0.76)**2)/.018)+.06*Math.exp(-((a-2.38)**2)/.018);
    return 1+waves+ear;
  };
  const sculpt=(x:number,y:number,r:number,a:number)=>{
    const mane=smooth(.45,.81,r);
    const face=G(x,y,0,.003,.081,.128);
    const brow=G(x,y,-.032,.037,.034,.020)+G(x,y,.032,.037,.034,.020);
    const sockets=G(x,y,-.031,.017,.023,.014)+G(x,y,.031,.017,.023,.014);
    const cheek=G(x,y,-.047,-.039,.044,.047)+G(x,y,.047,-.039,.044,.047);
    const pads=G(x,y,-.023,-.095,.027,.028)+G(x,y,.023,-.095,.027,.028);
    const bridge=G(x,y,0,-.033,.023,.067);

    // Almond-shaped eye slits under one sharp, sculpted lid (not eyeball blobs).
    let eyes=0,nostrils=0,earShadow=0,ears=0;
    for(const sign of [-1,1]) {
      const xx=Math.abs(x), eyeY=.017-.14*(xx-.030);
      const ex=(xx-.032)/.021,ey=(y-eyeY)/.0075;
      eyes+=Math.exp(-2.3*(ex**4+ey**4));
      nostrils+=G(x,y,sign*.014,-.084,.009,.007);
      ears+=G(x,y,sign*.080,.083,.032,.031);
      earShadow+=G(x,y,sign*.082,.090,.016,.017);
    }

    // Carved nose shield tapers towards the philtrum, recognisably feline.
    const noseT=Math.max(0,Math.min(1,(y+.097)/.040));
    const noseW=.005+.023*noseT;
    const noseShield=smooth(0,.004,noseW-Math.abs(x))*
      smooth(-.098,-.091,y)*(1-smooth(-.063,-.059,y));
    const mouthY=-.121+.12*Math.abs(x);
    const lip=G(x,y,0,-.122,.047,.011);
    const mouthCurve=Math.exp(-2*((y-mouthY)/.0045)**2)*
      (1-smooth(.029,.044,Math.abs(x)));
    const philtrum=G(x,y,0,-.108,.006,.027);

    // Coherent organic locks: flowing ridges carved directly into the mane.
    const flow=12*a+5.8*r+.65*Math.sin(3*a+.7);
    const ridges=Math.sin(flow);
    const grooves=Math.pow(Math.max(0,Math.cos(flow+.2)),16);

    let z=.012+.026*(1-r*r)+.064*face+
      .017*G(x,y,0,.078,.051,.042)+
      .026*brow-.028*sockets+
      .025*bridge+.022*cheek+.030*pads+
      .022*G(x,y,0,-.077,.030,.029)+
      .015*noseShield-.017*lip-
      .010*mouthCurve-.012*philtrum+
      .017*ears-.013*earShadow;
    z+=mane*(.009*ridges-.015*grooves);

    // The dark nostrils, almond eyes and inverted Y mouth are depressions
    // and inlaid patina on ONE connected face.
    z-=.012*eyes+.013*nostrils;

    const wear=.25*brow+.12*cheek+.17*pads+.18*noseShield+
      .13*Math.max(0,ridges)*mane;
    const shadow=Math.min(1,.83*eyes+.75*noseShield+.90*nostrils+
      .78*mouthCurve+.55*philtrum+.66*grooves*mane+.45*earShadow);
    const light=.67+Math.max(0,z)*2.3+wear+
      .11*G(x,y,0,.056,.055,.048);
    return {z,light,shadow};
  };
  const centre=sculpt(0,0,0,0);
  put(0,0,centre.z,centre.light,centre.shadow);
  for(let i=1;i<=radial;i++){
    const r=i/radial;
    for(let j=0;j<segments;j++){
      const a=2*Math.PI*j/segments;
      const rr=r*radius(a);
      const x=.120*rr*Math.cos(a),y=.154*rr*Math.sin(a);
      const {z,light,shadow}=sculpt(x,y,r,a);
      put(x,y,z,light,shadow);
    }
  }
  const id=(i:number,j:number)=>i===0?0:1+(i-1)*segments+((j+segments)%segments);
  for(let j=0;j<segments;j++)indices.push(0,id(1,j),id(1,j+1));
  for(let i=1;i<radial;i++)for(let j=0;j<segments;j++){
    indices.push(id(i,j),id(i+1,j),id(i+1,j+1));
    indices.push(id(i,j),id(i+1,j+1),id(i,j+1));
  }

  // The reverse is closed by a flat back and a real continuous sidewall.
  const backCenter=positions.length/3;
  put(0,0,-.009,.50);
  const backFirst=positions.length/3;
  for(let j=0;j<segments;j++){
    const a=2*Math.PI*j/segments;
    put(.120*radius(a)*Math.cos(a),.154*radius(a)*Math.sin(a),-.009,.48);
  }
  for(let j=0;j<segments;j++){
    const next=(j+1)%segments;
    indices.push(backCenter,backFirst+next,backFirst+j);
    indices.push(id(radial,j),backFirst+j,backFirst+next);
    indices.push(id(radial,j),backFirst+next,id(radial,j+1));
  }

  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(indices);
  g.computeVertexNormals();
  g.userData.keepColor=true; // Batcher preserves authored patina & shadows
  return g;
}

/** The single sculpted metal lion is fixed; only its hanging ring is independent. */
export function addLionKnocker(b:Batcher,metal:THREE.Material,cx:number,cy:number,th:number) {
  const front=-th/2;
  const relief=lionHeadReliefGeometry();
  // The relief's flat back meets the timber. Its sculpted +Z rises toward visitor.
  geo(b,metal,'#e3d0ad',relief,cx,cy,front-.014,{jitter:0});
  relief.dispose();

  const ring=new THREE.TorusGeometry(.063,.010,8,28);
  geo(b,metal,'#796144',ring,cx,cy-.175,front-.106,{jitter:0});
  ring.dispose();
  // Bronze rest plate is almost hidden under the bottom arc.
  const stop=new THREE.SphereGeometry(.014,10,8);
  geo(b,metal,'#473c31',stop,cx,cy-.246,front-.026,{jitter:0});
  stop.dispose();
}
