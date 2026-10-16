// FRONT-R02: one continuous, carved relief surface for the entrance lion.
// No assembled spheres, cones or "petal" mane. The nose, lids, eyes, cheek planes,
// muzzle and flowing fur all deform the SAME topological surface.
import * as THREE from 'three';
import { geo, type Batcher } from './kit';

const radial=22, segments=88;
const G=(x:number,y:number,cx:number,cy:number,sx:number,sy:number)=>
  Math.exp(-2*((x-cx)**2/(sx*sx)+(y-cy)**2/(sy*sy)));
const smooth=(a:number,b:number,x:number)=>{
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
};

/** Closed, indexed bas-relief: 1 connected component, organic outline and sculpted front. */
export function lionHeadReliefGeometry():THREE.BufferGeometry {
  const positions:number[]=[], colors:number[]=[],uvs:number[]=[],indices:number[]=[];
  const patina=new THREE.Color('#78634c');
  const put=(x:number,y:number,z:number,light=1,shade=0)=>{
    positions.push(x,y,z);
    const l=Math.max(.30,Math.min(1.47,light));
    colors.push(patina.r*l*(1-shade*.35),patina.g*l*(1-shade*.45),patina.b*l*(1-shade*.56));
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
    const mane=smooth(.47,.78,r);
    const face=G(x,y,0,.006,.081,.125);
    const brow=G(x,y,-.031,.031,.037,.016)+G(x,y,.031,.031,.037,.016);
    const sockets=G(x,y,-.031,.016,.019,.011)+G(x,y,.031,.016,.019,.011);
    const nose=G(x,y,0,-.073,.030,.030);
    const cheeks=G(x,y,-.048,-.040,.039,.043)+G(x,y,.048,-.040,.039,.043);
    const whiskers=G(x,y,-.022,-.088,.028,.028)+G(x,y,.022,-.088,.028,.028);
    const furFlow=Math.sin(13*a+5.6*r+.58*Math.sin(3*a+.7));
    const furGroove=Math.pow(Math.max(0,Math.cos(13*a+5.6*r+.58*Math.sin(3*a+.7))),12);
    const mouth=G(x,y,0,-.117,.043,.011);
    // All volumes flow into one another. Eyes are sunk BELOW brows, not separate eyeballs.
    let z=.008+.026*(1-r*r)+.065*face+
      .016*G(x,y,0,.074,.056,.040)+
      .018*brow-.023*sockets+
      .014*G(x,y,0,-.029,.021,.065)+
      .020*cheeks+.018*whiskers+
      .027*nose-.021*mouth;
    z+=mane*(.006*furFlow-.010*furGroove);
    // Paired ears: curved cartilage and inset recesses integrated into the mane.
    for(const sign of [-1,1]) {
      z+=.020*G(x,y,sign*.084,.086,.033,.035);
      z-=.018*G(x,y,sign*.084,.090,.017,.021);
      z-=.016*G(x,y,sign*.013,-.081,.009,.007); // nostrils
    }
    // Deep mouth seam and nose bridge terminate at the actual ring attachment.
    z-=.016*G(x,y,0,-.098,.007,.024);
    // Subtle cast-bronze wear on high brows and mane ridges; deep eyes/nostrils nearly black.
    const wear=.16*brow+.11*cheeks+.09*nose+.10*(Math.max(0,furFlow)*mane);
    const shadow=Math.min(1,1.7*sockets+2*mouth+
      1.6*(G(x,y,-.013,-.081,.009,.007)+G(x,y,.013,-.081,.009,.007))+
      .54*furGroove*mane);
    const light=.73+Math.max(0,z)*2.0+wear+.10*G(x,y,0,.045,.055,.055);
    return { z,light,shadow };
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
