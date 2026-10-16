// EXT-R02: constructed roof junctions and restrained facade ageing. No gameplay/collision changes.
import * as THREE from 'three';
import type { Ctx } from './arch';
import { box, cyl, planMatrix } from './kit';
import { EXTERIOR_DETAILS, drainGrate } from './exteriorDetail';
import { roofUnderside } from './layout';
import { EXTERIOR_WEATHER } from './exteriorWeather';
import { mulberry32 } from '../core/rng';
export const EXTERIOR_FINISH = typeof location==='undefined'||new URLSearchParams(location.search).get('finish')!=='base';
const UP=new THREE.Vector3(0,1,0);
function add(c:Ctx,g:THREE.BufferGeometry,x:number,y:number,z:number,color:string,shadow=true) {
  c.b.add(c.k.M.paint,g,planMatrix(x,y,z),color,c.chunk,shadow,0);g.dispose();
}
function pipe(c:Ctx,a:number[],b:number[],r:number,col:string) {
  const A=new THREE.Vector3(a[0],a[1],-a[2]),B=new THREE.Vector3(b[0],b[1],-b[2]),d=B.clone().sub(A);
  const g=new THREE.CylinderGeometry(r,r,d.length(),8),m=new THREE.Matrix4().compose(A.add(B).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(UP,d.normalize()),new THREE.Vector3(1,1,1));
  c.b.add(c.k.M.paint,g,m,col,c.chunk,true,0);g.dispose();
}
function gutterGeo(length:number) {
  const pts:THREE.Vector2[]=[],r=.105,t=.013;
  for(let i=0;i<=8;i++){const a=Math.PI+i*Math.PI/8;pts.push(new THREE.Vector2(Math.cos(a)*r,Math.sin(a)*r));}
  for(let i=8;i>=0;i--){const a=Math.PI+i*Math.PI/8;pts.push(new THREE.Vector2(Math.cos(a)*(r-t),Math.sin(a)*(r-t)));}
  const g=new THREE.ExtrudeGeometry(new THREE.Shape(pts),{depth:length,bevelEnabled:false,curveSegments:1});g.translate(0,0,-length/2);g.rotateY(Math.PI/2);return g;
}
export function rainwater(c:Ctx,cx:number,cz:number,ax:number,az:number,y:number,sites:readonly [number,number][],col='#76817e',overhang=.7) {
  for(const sign of [-1,1]) {
    add(c,gutterGeo(2*ax+.16),cx,y-.035,cz+sign*(az+.06),col);
    const side=gutterGeo(2*az+.16);side.rotateY(Math.PI/2);add(c,side,cx+sign*(ax+.06),y-.035,cz,col);
  }
  for(const [x,z] of sites) {
    // Route to the nearest gutter edge, rather than always to the left/right side of the roof.
    const edges=[[cx-ax-.06,z],[cx+ax+.06,z],[x,cz-az-.06],[x,cz+az+.06]];
    const [gx,gz]=edges.sort((a,b)=>Math.hypot(a[0]-x,a[1]-z)-Math.hypot(b[0]-x,b[1]-z))[0];
    pipe(c,[x,.18,z],[x,y-.38,z],.047,col);
    pipe(c,[x,y-.38,z],[gx,y-.13,gz],.047,col);
    pipe(c,[gx,y-.13,gz],[gx,y-.075,gz],.052,col);
    const dx=gx-x,dz=gz-z,L=Math.hypot(dx,dz)||1;
    pipe(c,[x,.20,z],[x+dx/L*.13,.08,z+dz/L*.13],.052,col);
    const wallEdges=[[cx-ax+overhang,z],[cx+ax-overhang,z],[x,cz-az+overhang],[x,cz+az-overhang]];
    const [wx,wz]=wallEdges.sort((a,b)=>Math.hypot(a[0]-x,a[1]-z)-Math.hypot(b[0]-x,b[1]-z))[0];
    if(EXTERIOR_DETAILS)drainGrate(c,x+dx/L*.13,z+dz/L*.13);
    for(let h=.7;h<y-.4;h+=1.7){
      cyl(c.b,c.k.M.paint,'#56635e',x,h,z,.057,.057,.036,8,{chunk:c.chunk,jitter:0});
      if(EXTERIOR_DETAILS) {
        pipe(c,[x,h+.018,z],[wx+(x-wx)*.02,h+.018,wz+(z-wz)*.02],.012,'#63716a');
        const normalX=Math.abs(wx-x)>Math.abs(wz-z);
        box(c.b,c.k.M.paint,'#63716a',wx+(x-wx)*.05,h-.025,wz+(z-wz)*.05,normalX?.018:.09,.09,normalX?.09:.018,{chunk:c.chunk,jitter:0});
      } else box(c.b,c.k.M.paint,'#63716a',x-dx/L*.035,h,z-dz/L*.035,.10,.035,.10,{chunk:c.chunk,jitter:0});
    }
  }
}
export function ridgeFinish(c:Ctx,a:[number,number,number],b:[number,number,number],width=.20) {
  const A=new THREE.Vector3(a[0],a[1],-a[2]),B=new THREE.Vector3(b[0],b[1],-b[2]),length=A.distanceTo(B);
  const shape=new THREE.Shape([[-.5,0],[-.45,.20],[-.23,.40],[.23,.40],[.45,.20],[.5,0]].map(([x,y])=>new THREE.Vector2(x*width,y*width)));
  const frame=new THREE.Matrix4().lookAt(A,B,UP);frame.setPosition(A.clone().add(B).multiplyScalar(.5));
  const g=new THREE.ExtrudeGeometry(shape,{depth:length,bevelEnabled:false});g.translate(0,0,-length/2);
  c.b.add(c.k.M.paint,g,frame,'#68736f',c.chunk,true,0);g.dispose();
  // Small raised collars make the lead sections read at near distance without modelling every slate.
  for(let d=.65;d<length-.2;d+=.65){
    const collar=new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false});collar.scale(1.07,1.07,1);collar.translate(0,0,d-length/2);
    c.b.add(c.k.M.paint,collar,frame,'#858e87',c.chunk,true,0);collar.dispose();
  }
}
const roofY=(x:number,z:number)=>roofUnderside(x,z)+.25;
function quad(c:Ctx,points:number[][],col:string) {
  const p=[...points[0],...points[1],...points[2],...points[0],...points[2],...points[3]];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.map((v,i)=>i%3===2?-v:v),3));g.computeVertexNormals();
  // Flashings are thin sheet metal: visible from both directions via explicit reversed triangles.
  const a=g.attributes.position.array;const both=Array.from(a);for(let i=0;i<a.length;i+=9)both.push(...Array.from(a.slice(i,i+3)),...Array.from(a.slice(i+6,i+9)),...Array.from(a.slice(i+3,i+6)));
  g.setAttribute('position',new THREE.Float32BufferAttribute(both,3));g.computeVertexNormals();
  c.b.add(c.k.M.paint,g,new THREE.Matrix4(),col,c.chunk,true,0);g.dispose();
}
export function roofFlashing(c:Ctx,x0:number,x1:number,z0:number,z1:number,width=.18,upstand=.22) {
  const corners=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
  for(let i=0;i<4;i++){
    const a=corners[i],b=corners[(i+1)%4],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz),nx=dz/L,nz=-dx/L;
    const at=(p:number[],out:number,up:number)=>[p[0]+nx*out,roofY(p[0]+nx*out,p[1]+nz*out)+up,p[1]+nz*out];
    quad(c,[at(a,0,.035),at(b,0,.035),at(b,width,.035),at(a,width,.035)],'#74817b');
    quad(c,[at(a,0,.035),at(a,0,upstand),at(b,0,upstand),at(b,0,.035)],'#889089');
  }
}
export function finishedChimney(c:Ctx,x:number,z:number,mat:THREE.Material) {
  const heights=[roofY(x-.6,z-.6),roofY(x+.6,z-.6),roofY(x+.6,z+.6),roofY(x-.6,z+.6)];
  const base=Math.min(...heights)-.15,top=Math.max(...heights)+(x<75?2.7:2.1);
  box(c.b,mat,'#e2dbc5',x,base,z,1.2,top-base,1.2,{chunk:c.chunk,uv:2.4});
  for(const [h,w,t,col] of [[top-.36,1.29,.09,'#b9bba9'],[top-.10,1.38,.10,'#d1ceba']] as const)box(c.b,c.k.M.paint,col,x,h,z,w,t,w,{chunk:c.chunk,jitter:0});
  for(const d of [-.28,.28]){
    const profile=[[.11,0],[.14,.04],[.12,.42],[.15,.45],[.15,.51],[.105,.51],[.095,.43],[.085,.12]];
    const g=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),10);add(c,g,x+d,top,z,'#9d6349');
    cyl(c.b,c.k.M.paint,'#353d35',x+d,top+.10,z,.085,.085,.005,10,{chunk:c.chunk,jitter:0});
  }
  roofFlashing(c,x-.615,x+.615,z-.615,z+.615,.20);
}

/** A single low-resolution perimeter wash, sampled in world space. Texture factors encode
 * sheltered stone, local rain streaks and a damp plinth; they do not encode sun direction. */
export function ageFacade(mat:THREE.MeshLambertMaterial) {
  const W=1024,H=256,L=184,canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const x=canvas.getContext('2d')!;x.fillStyle='#ffffff';x.fillRect(0,0,W,H);
  const py=(y:number)=>H*(1-y/6.4),px=(s:number)=>W*s/L;
  const shelter=EXTERIOR_DETAILS?[[0,36,.45],[36,66,.65],[66,102,1],[102,132,.9],[132,140,.5],[140,157.6,.65],[157.6,184,.9]]:[[0,184,1]];
  for(const [lo,hi,weight] of shelter) {
    const base=x.createLinearGradient(0,H,0,py(1.3));base.addColorStop(0,`rgba(96,111,94,${.19*weight})`);base.addColorStop(.5,`rgba(117,126,106,${.08*weight})`);base.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=base;x.fillRect(px(lo),py(1.3),px(hi-lo),H-py(1.3));
  }
  if(EXTERIOR_DETAILS)for(const at of [13.85,22.15,36.5,65.5,102.5,131.5,140.4]) {
    const damp=x.createRadialGradient(px(at),py(.32),0,px(at),py(.32),px(.4));
    damp.addColorStop(0,'rgba(103,124,103,.12)');damp.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=damp;x.fillRect(px(at-.4),py(.78),px(.8),H-py(.78));
  }
  // Broad variation is sparse; local runoff and shelter carry the ageing.
  for(let i=0;i<8;i++){
    const s=(Math.sin(i*12.91)*43758.5%1+1)%1*L,y=1.4+((i*17)%31)/7,r=1.3+(i%4)*.55;
    const g=x.createRadialGradient(px(s),py(y),0,px(s),py(y),px(r));g.addColorStop(0,i%2?'rgba(167,157,127,.055)':'rgba(130,151,139,.045)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(px(s-r),py(y)-px(r),px(r)*2,px(r)*2);
  }
  const windows:[number,number][]=[];
  for(const a of [75.5,79,82.5,98,101.5,105])windows.push([a-72,1.05]);
  for(const a of [75.5,79,82.5,87.5,92.5,98,101.5,105])windows.push([a-72,4.15]);
  for(const a of [75,78.5,82,88,97.5,105])windows.push([66+108-a,1.05]);
  for(const a of [75,78.5,82,87.5,92.5,98,104])windows.push([66+108-a,4.15]);
  for(const a of [83,90.5,97,101,105])windows.push([102+110-a,1.05]);
  for(const a of [82.5,90,97,101,105])windows.push([102+110-a,4.15]);
  for(const a of [83,86.8,90.4])windows.push([36+a-80,1.05]);
  for(const a of [83,87,91])windows.push([36+a-80,4.15]);
  for(const [index,[s,y]] of windows.entries()){
    if(index%3!==1)continue; // selected runoff sites, not an identical stain below every window
    const g=x.createLinearGradient(0,py(y-.75),0,py(y));g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.65,'rgba(120,131,112,.08)');g.addColorStop(1,'rgba(114,124,108,.15)');x.fillStyle=g;
    x.beginPath();x.moveTo(px(s-.43),py(y));x.lineTo(px(s+.43),py(y));x.lineTo(px(s+.23),py(y-.75));x.lineTo(px(s-.19),py(y-.75));x.fill();
  }
  if(EXTERIOR_WEATHER) {
    const r=mulberry32(606);
    // Broken low moss/damp patches, rooted at the sheltered north/west plinth.
    for(const [lo,hi] of [[66,89.5],[90.5,94],[96,102],[102,132]] as const)for(let s=lo;s<hi;s+=.14+r()*.3) {
      const h=.09+r()*.29,w=.12+r()*.38;
      const g=x.createLinearGradient(0,py(0),0,py(h));g.addColorStop(0,'rgba(78,103,65,.25)');g.addColorStop(.45,'rgba(103,120,83,.14)');g.addColorStop(1,'rgba(255,255,255,0)');
      x.fillStyle=g;x.fillRect(px(s),py(h),px(w),H-py(h));
    }
    // Thin irregular trails from a few sill corners, tapering independently.
    for(const [i,[s,y]] of windows.entries())if(i%4===2)for(const side of [-1,1]) {
      const at=s+side*.43,len=.25+r()*.6,w=.025+r()*.045;
      const g=x.createLinearGradient(0,py(y),0,py(y-len));g.addColorStop(0,'rgba(110,116,96,.22)');g.addColorStop(.35,'rgba(127,130,107,.10)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;
      x.beginPath();x.moveTo(px(at-w),py(y));x.lineTo(px(at+w),py(y));x.lineTo(px(at+w*.15),py(y-len));x.lineTo(px(at-w*.12),py(y-len*.9));x.fill();
    }
    // Small washes at selected pipe collars, quieter on the arrival facade.
    for(const at of [13.85,22.15,66.5,102.5,131.5])for(const h of [.7,2.4,4.1]) {
      const g=x.createRadialGradient(px(at),py(h),0,px(at),py(h),px(.2));g.addColorStop(0,`rgba(99,116,94,${at<36?.10:.19})`);g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(px(at-.2),py(h)-px(.2),px(.4),px(.4));
    }
  }
  // Soft contact under the projecting cornice, strongest at the joint and fading into the wall.
  const joint=x.createLinearGradient(0,py(6.36),0,py(5.98));
  joint.addColorStop(0,'rgba(72,80,66,.13)');joint.addColorStop(.32,'rgba(85,94,77,.055)');joint.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=joint;x.fillRect(0,py(6.36),px(132),py(5.98)-py(6.36));
  // Entrance contact wear is confined to the lower projecting bay; no cracks or wall-wide grime.
  const wear=x.createRadialGradient(px(18),py(.25),0,px(18),py(.25),px(1.7));
  wear.addColorStop(0,'rgba(128,118,94,.07)');wear.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=wear;x.fillRect(px(16.3),py(.65),px(3.4),py(0)-py(.65));
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.NoColorSpace;texture.wrapS=THREE.RepeatWrapping;
  const previous=mat.onBeforeCompile;
  mat.onBeforeCompile=(shader,renderer)=>{
    previous.call(mat,shader,renderer);shader.uniforms.flwFacadeWash={value:texture};
    shader.fragmentShader='uniform sampler2D flwFacadeWash;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec3 wp=vFlwP; float pz=-wp.z; float along=0.0;
      float ds=abs(pz-80.0),dn=abs(pz-110.0),dw=abs(wp.x-72.0),de=abs(wp.x-108.0);
      float d=min(min(ds,dn),min(dw,de));
      if(d==ds)along=wp.x-72.0;else if(d==de)along=36.0+pz-80.0;else if(d==dn)along=66.0+108.0-wp.x;else along=102.0+110.0-pz;
      if(wp.x>108.3){
        ds=abs(pz-92.2);dn=abs(pz-109.8);de=abs(wp.x-116.0);d=min(ds,min(dn,de));
        if(d==ds)along=132.0+wp.x-108.0;else if(d==de)along=140.0+pz-92.2;else along=157.6+116.0-wp.x;
      }
      float washMask=(1.0-smoothstep(6.25,6.7,wp.y))*step(-0.3,wp.y);
      diffuseColor.rgb*=mix(vec3(1.0),texture2D(flwFacadeWash,vec2(along/184.0,clamp(wp.y/6.4,0.0,1.0))).rgb,washMask);
    `);
  };
  mat.customProgramCacheKey=()=> EXTERIOR_WEATHER?'ext-r06-local-weather':EXTERIOR_DETAILS?'ext-r05-sheltered-wash':'ext-r02-facade-wash';mat.needsUpdate=true;
}
