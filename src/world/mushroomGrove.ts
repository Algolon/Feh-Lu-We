import * as T from 'three';
import type { World, GameApi } from '../interactions/world';
import { MUSHROOM } from './layout';
import { terrainHeight } from './terrain';
import { pointAt, polylineLength } from './geom2d';
import { mushroomModel, MUSHROOM_SPECIES } from './mushroomModels';
import { mulberry32 } from '../core/rng';
export interface MushroomPlacement { x:number; z:number; scale:number; species:number; yaw:number; zone:'approach'|'grove'|'young' }
export function mushroomPlacements(): MushroomPlacement[] {
  const r=mulberry32(8193), out:MushroomPlacement[]=[];
  const L=polylineLength(MUSHROOM.approach);
  for(let i=0;i<10;i++) {
    const d=1+i*(L-3)/10,p=pointAt(MUSHROOM.approach,d),q=pointAt(MUSHROOM.approach,Math.min(L,d+0.2));
    const dx=q[0]-p[0],dz=q[1]-p[1],n=Math.hypot(dx,dz)||1;
    for(const side of [-1,1]) {
      const off=2.2+r()*0.7, s=0.22+i*0.11+r()*0.13;
      out.push({x:p[0]-dz/n*side*off,z:p[1]+dx/n*side*off,scale:s,species:(i+(side===1?1:0))%4,yaw:r()*6.28,zone:'approach'});
    }
  }
  // Broken horseshoe, open to the southwest; giants stay out of the central walking space.
  for(let i=0;i<9;i++) {
    const a=-0.3+i/8*3.65, d=6.4+r()*1.6;
    out.push({x:MUSHROOM.x+Math.cos(a)*d,z:MUSHROOM.z+Math.sin(a)*d,scale:1.65+r()*0.9,species:i%4,yaw:r()*6.28,zone:'grove'});
  }
  const adults=[...out];
  adults.forEach((p,i)=>{if(i%2===0)for(let j=0;j<2;j++) {
    const a=r()*6.28,d=0.5+r()*0.65;
    out.push({x:p.x+Math.cos(a)*d,z:p.z+Math.sin(a)*d,scale:0.13+r()*0.2,species:p.species,yaw:r()*6.28,zone:'young'});
  }});
  return out;
}
export function buildMushroomGrove(w:World,g:GameApi) {
  const root=new T.Group();root.name='Mushroom Grove';root.scale.z=-1;root.userData.region='outdoor';w.scene.add(root);
  const pulse={value:1};
  const mat=w.material(new T.MeshStandardMaterial({vertexColors:true,roughness:0.92,metalness:0,side:T.DoubleSide}));
  mat.onBeforeCompile=(s)=>{
    s.uniforms.grovePulse=pulse;
    s.vertexShader='attribute float glow; varying float vGroveGlow;\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGroveGlow=glow;');
    s.fragmentShader='uniform float grovePulse; varying float vGroveGlow;\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','outgoingLight += vColor.rgb * vGroveGlow * grovePulse;\n#include <opaque_fragment>');
  };
  const list=mushroomPlacements(), dummy=new T.Object3D();
  for(let k=0;k<4;k++) for(const detailed of [false,true]) {
    const ps=list.filter(p=>p.species===k && (p.scale>.8)===detailed),geo=mushroomModel(k,detailed), mesh=new T.InstancedMesh(geo,mat,ps.length);
    mesh.name=MUSHROOM_SPECIES[k]+(detailed?'-hero':'-young');mesh.castShadow=false;mesh.receiveShadow=true;
    ps.forEach((p,i)=>{dummy.position.set(p.x,terrainHeight(p.x,p.z)-0.03,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
    mesh.computeBoundingSphere();root.add(mesh);
  }
  for(const p of list.filter(p=>p.scale>.8)) {
    const y=terrainHeight(p.x,p.z);
    w.col.addCircle(p.x,p.z,p.scale*.26,y,y+p.scale*1.5,{tag:'mushroom'});
  }
  // Actual light spill, only two lights for the entire grove; no shadow maps.
  const lights=[new T.PointLight('#68ebd5',0,11,2),new T.PointLight('#b98ce8',0,10,2)];
  lights.forEach((l,i)=>{l.position.set(MUSHROOM.x+(i?4:-4),terrainHeight(MUSHROOM.x+(i?4:-4),MUSHROOM.z+2)+2.6,MUSHROOM.z+2);root.add(l);});
  // Radial pools are projected onto the existing terrain (no hovering flat disks).
  const v:number[]=[],c:number[]=[],indices:number[]=[];
  for(const p of list.filter(p=>p.zone!=='young')) {
    const n=v.length/3,R=p.scale*1.5;
    v.push(p.x,terrainHeight(p.x,p.z)+0.045,p.z);c.push(0.14,0.7,0.54);
    for(let i=0;i<=24;i++) {const a=i/24*6.28,x=p.x+Math.cos(a)*R,z=p.z+Math.sin(a)*R;v.push(x,terrainHeight(x,z)+0.045,z);c.push(0,0.025,0.03);if(i<24)indices.push(n,n+i+2,n+i+1);}
  }
  const poolGeo=new T.BufferGeometry();poolGeo.setAttribute('position',new T.Float32BufferAttribute(v,3));poolGeo.setAttribute('color',new T.Float32BufferAttribute(c,3));poolGeo.setIndex(indices);
  const poolMat=w.material(new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:0.32,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));root.add(new T.Mesh(poolGeo,poolMat));
  // Authored mint undergrowth: folded, tapered leaves with dark roots and emissive tips.
  // A single merged draw; each tuft follows the original terrain rather than a flat diorama plinth.
  const lv:number[]=[],lc:number[]=[],le:number[]=[];
  const seed=mulberry32(191),addLeaf=(p:number[],q:number[],r:number[],glow:number)=>{
    lv.push(...p,...q,...r);for(let n=0;n<3;n++){lc.push(.035,.38+glow*.2,.27+glow*.2);le.push(glow);}
  };
  for(const p of list.filter((p,i)=>p.zone==='grove'||i%4===0)) for(let tuft=0;tuft<3;tuft++){
    const angle=seed()*Math.PI*2,d=.6+seed()*.65,x=p.x+Math.cos(angle)*d,z=p.z+Math.sin(angle)*d;
    const y=terrainHeight(x,z)+.02;
    for(let j=0;j<5;j++){
      const a=j*2.4+angle,h=.18+seed()*.38,dx=Math.cos(a),dz=Math.sin(a),width=.026+seed()*.025;
      const base=[x,y,z],left=[x+dx*h*.28-dz*width,y+h*.58,z+dz*h*.28+dx*width],mid=[x+dx*h*.24,y+h*.65,z+dz*h*.24],right=[x+dx*h*.28+dz*width,y+h*.58,z+dz*h*.28-dx*width],tip=[x+dx*h*.6,y+h,z+dz*h*.6];
      addLeaf(base,left,mid,.15);addLeaf(base,mid,right,.12);addLeaf(left,tip,mid,.65);addLeaf(mid,tip,right,.5);
    }
  }
  const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(lv,3));lg.setAttribute('color',new T.Float32BufferAttribute(lc,3));lg.setAttribute('glow',new T.Float32BufferAttribute(le,1));lg.computeVertexNormals();root.add(new T.Mesh(lg,mat));
  // One point draw for drifting spores, soft circular fragments, limited overdraw.
  const r=mulberry32(812),positions:number[]=[],phase:number[]=[];
  for(let i=0;i<64;i++){const a=r()*6.28,d=Math.sqrt(r())*11,x=MUSHROOM.x+Math.cos(a)*d,z=MUSHROOM.z+Math.sin(a)*d;positions.push(x,terrainHeight(x,z)+0.4+r()*4,z);phase.push(r()*6.28);}
  const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(positions,3));pg.setAttribute('phase',new T.Float32BufferAttribute(phase,1));
  const uniforms={t:{value:0},motion:{value:1},strength:{value:1}};
  const pm=w.material(new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`attribute float phase; uniform float t,motion; varying float v; void main(){vec3 p=position;p.x+=sin(t*.14+phase)*.35*motion;p.y+=sin(t*.25+phase)*.3*motion;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(28./-mv.z,1.,7.);v=.5+.5*sin(phase+t*.4*motion);}`,
    fragmentShader:`uniform float strength;varying float v;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.35,.9,.82,(1.-smoothstep(.05,.5,d))*(.25+v*.45)*strength);}` }));
  root.add(new T.Points(pg,pm));
  w.scene.userData.mushrooms={placements:list,species:MUSHROOM_SPECIES,centre:MUSHROOM};
  w.onUpdate((_dt,t)=>{
    const p=g.playerXZ(),distance=Math.hypot(p.x-MUSHROOM.x,p.z-MUSHROOM.z),active=distance<65;
    root.visible=active;
    if(!active){lights.forEach(l=>l.intensity=0);return;}
    const reduced=w.reducedMotion,pulsing=reduced?1:1+Math.sin(t*.7)*.09;
    pulse.value=pulsing;uniforms.t.value=t;uniforms.motion.value=reduced?0:1;
    lights.forEach((l,i)=>l.intensity=(i?12:18)*pulsing*Math.max(0,1-(distance-10)/35));
  });
}
