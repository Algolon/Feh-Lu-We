import * as T from 'three';
import type { World, GameApi } from '../interactions/world';
import { MUSHROOM } from './layout';
import { terrainHeight } from './terrain';
import { pointAt, polylineLength, project } from './geom2d';
import { mushroomModel, mushroomYoungModel, MUSHROOM_SPECIES } from './mushroomModels';
import { mulberry32 } from '../core/rng';
import { mushroomAreaDistance } from './mushroomField';
export interface MushroomPlacement { x:number; z:number; scale:number; species:number; yaw:number; zone:'approach'|'grove'|'young'; colony?:number; glow?:number; lean?:number; expansion?:boolean; lightGeometry?:boolean }
export function mushroomPlacements(trees:readonly {x:number;z:number}[]=MUSHROOM.landmarks): MushroomPlacement[] {
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
  for(let i=0;i<13;i++) {
    const a=-0.3+i/12*3.65, d=9.4+r()*1.9;
    out.push({x:MUSHROOM.x+Math.cos(a)*d,z:MUSHROOM.z+Math.sin(a)*d,scale:1.65+r()*0.9,species:i%4,yaw:r()*6.28,zone:'grove'});
  }
  for(let i=0;i<4;i++) {
    const a=.15+i*.92,d=5.4+r()*.7;
    out.push({x:MUSHROOM.x+Math.cos(a)*d,z:MUSHROOM.z+Math.sin(a)*d,scale:.65+r()*.3,species:i,yaw:r()*6.28,zone:'grove'});
  }
  // Independent stream preserves every successful R02 adult position and yaw.
  const adults=[...out],sprout=mulberry32(30119);
  let colony=0;
  const group=(x:number,z:number,count:number,spread:number,base:number,species:number)=>{
    const id=colony++,angle=sprout()*Math.PI*2;
    for(let j=0;j<count;j++) {
      // Pairs at a shared root, then an off-centre fan with deliberately uneven gaps.
      const a=angle+j*2.399+sprout()*.45,d=j<2?.12+j*.6:spread*(.45+sprout()*.55);
      const px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;
      const scale=base*(j===0?.62:j===1?1.25:.8+sprout()*.6);
      // Understory never intrudes on the continuous return lane or estate boundary.
      if(px<1||px>198||pz<1||pz>178||project(px,pz,MUSHROOM.approach).d<1.5)continue;
      out.push({x:px,z:pz,scale,species:j%3===0?(species+1)%4:species,yaw:angle+sprout()*1.3,
        zone:'young',colony:id,glow:j===1?1.35:.55+sprout()*.5,lean:(sprout()-.5)*.22});
    }
  };
  adults.forEach((p,i)=>{
    if(p.zone==='approach'&&i<6&&i%2===1)return;
    // Hero families: two close siblings and a larger companion fan, visibly knee/waist high.
    const a=Math.atan2(MUSHROOM.z-p.z,MUSHROOM.x-p.x)+.45;
    const d=p.zone==='grove'?.32*p.scale:.55;
    const x=p.x+Math.cos(a)*d,z=p.z+Math.sin(a)*d;
    const progress=p.zone==='grove'?1:Math.floor(i/2)/9;
    group(x,z,p.scale>1.5?6:progress>.5?4:2,.45+p.scale*.35,.23+progress*.18,p.species);
  });
  // Separate colonies along the irregular clearing edge and between the larger islands.
  for(let i=0;i<9;i++) {
    const a=-.08+i*.4,d=i%3===0?6.8:11.6+sprout()*.8;
    group(MUSHROOM.x+Math.cos(a)*d,MUSHROOM.z+Math.sin(a)*d,3+i%3,.75,.30+sprout()*.12,(i+2)%4);
  }
  // Seeded irregular scatter across the whole new footprint, not a new concentric ring.
  // Real surveyed woodland trunks are supplied by the built estate. Nothing is felled.
  const scatter=mulberry32(44017),added:MushroomPlacement[]=[];
  const allowed=(x:number,z:number,scale:number)=>mushroomAreaDistance(x,z)>.6+scale*.65
    &&(scale<1.5||Math.hypot(x-MUSHROOM.x,z-MUSHROOM.z)>12)
    &&Math.hypot(x-181,z-162)>2.5+scale*1.15
    &&project(x,z,MUSHROOM.approach).d>1.65+scale*1.1
    &&trees.every(t=>Math.hypot(x-t.x,z-t.z)>1.05+scale*.55)
    &&out.filter(p=>p.zone!=='young').every(p=>Math.hypot(x-p.x,z-p.z)>1.2+(scale+p.scale)*.65);
  for(let attempt=0;attempt<2400&&added.length<24;attempt++) {
    const x=161+scatter()*37.5,z=149+scatter()*29.5;
    const scale=added.length%4===0?1.5+scatter()*.65:.55+scatter()*.65;
    // Slow density field produces concentrated pockets and uneven negative space.
    if(scatter()>.66+.2*Math.sin(x*.31+z*.17)||!allowed(x,z,scale))continue;
    const p:MushroomPlacement={x,z,scale,species:Math.floor(scatter()*4),yaw:scatter()*6.28,zone:'grove',expansion:true,lightGeometry:scale<1.5};
    out.push(p);added.push(p);
  }
  for(const p of added) {
    const id=colony++,count=p.scale>=1.5?4:2;
    for(let j=0;j<count;j++) {
      const a=scatter()*6.28,d=.55+scatter()*1.1,x=p.x+Math.cos(a)*d,z=p.z+Math.sin(a)*d;
      if(mushroomAreaDistance(x,z)<.5||project(x,z,MUSHROOM.approach).d<1.5||trees.some(t=>Math.hypot(x-t.x,z-t.z)<.75))continue;
      out.push({x,z,scale:.22+scatter()*.3,species:(p.species+j%2)%4,yaw:scatter()*6.28,zone:'young',colony:id,glow:.6+scatter()*.75,lean:(scatter()-.5)*.22,expansion:true});
    }
  }
  return out;
}
export function buildMushroomGrove(w:World,g:GameApi) {
  const root=new T.Group();root.name='Mushroom Grove';root.scale.z=-1;root.userData.region='outdoor';w.scene.add(root);
  const pulse={value:1},clock={value:0},motion={value:1};
  const mat=w.material(new T.MeshStandardMaterial({vertexColors:true,roughness:0.92,metalness:0,side:T.DoubleSide}));
  mat.onBeforeCompile=(s)=>{
    s.uniforms.grovePulse=pulse;s.uniforms.groveTime=clock;s.uniforms.groveMotion=motion;
    s.vertexShader='attribute float glow; varying float vGroveGlow; uniform float groveTime,groveMotion;\n#ifdef USE_INSTANCING\nattribute vec2 colonyGlow;\n#endif\n'+s.vertexShader;
    s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGroveGlow=glow;\n#ifdef USE_INSTANCING\nvGroveGlow *= colonyGlow.x * (1. + sin(groveTime*.63+colonyGlow.y)*.07*groveMotion*step(0.,colonyGlow.y));\n#endif');
    s.fragmentShader='uniform float grovePulse; varying float vGroveGlow;\n'+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','outgoingLight += vColor.rgb * vGroveGlow * grovePulse;\n#include <opaque_fragment>');
  };
  const trees=(w.scene.userData.vegPlan?.trees??[]) as {x:number;z:number}[];
  const list=mushroomPlacements(trees), dummy=new T.Object3D();
  for(let k=0;k<4;k++) for(const layer of ['young','small','hero'] as const) {
    const ps=list.filter(p=>p.species===k&&(layer==='young'?p.zone==='young':p.zone!=='young'&&((p.scale>.8&&!p.lightGeometry)===(layer==='hero'))));
    const geo=layer==='young'?mushroomYoungModel(k):mushroomModel(k,layer==='hero');
    const mesh=new T.InstancedMesh(geo,mat,ps.length),emission:number[]=[];
    mesh.name=MUSHROOM_SPECIES[k]+'-'+layer;mesh.castShadow=false;mesh.receiveShadow=true;
    ps.forEach((p,i)=>{
      dummy.position.set(p.x,terrainHeight(p.x,p.z)-0.015,p.z);
      dummy.rotation.set(p.lean??0,p.yaw,(p.lean??0)*.6);
      dummy.scale.set(p.scale*(p.zone==='young'?1+Math.sin(i*2.4)*.06:1),p.scale,p.scale);
      dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      emission.push(p.glow??1,p.zone==='young'?(p.colony??0)*1.73+k:-1);
    });
    geo.setAttribute('colonyGlow',new T.InstancedBufferAttribute(new Float32Array(emission),2));
    mesh.computeBoundingSphere();root.add(mesh);
  }
  for(const p of list.filter(p=>p.zone!=='young'&&p.scale>.8)) {
    const y=terrainHeight(p.x,p.z);
    w.col.addCircle(p.x,p.z,p.scale*.26,y,y+p.scale*1.5,{tag:'mushroom'});
  }
  // Actual light spill, only two lights for the entire grove; no shadow maps.
  const lights=[new T.PointLight('#68ebd5',0,15,2),new T.PointLight('#b98ce8',0,14,2)];
  lights.forEach((l,i)=>{l.position.set(MUSHROOM.x+(i?5.5:-5.5),terrainHeight(MUSHROOM.x+(i?5.5:-5.5),MUSHROOM.z+2)+2.6,MUSHROOM.z+2);root.add(l);});
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
  for(const p of list.filter((p,i)=>p.zone==='grove'||(p.zone==='approach'&&i%4===0))) for(let tuft=0;tuft<3;tuft++){
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
  for(let i=0;i<64;i++){let x:number,z:number;do{x=162+r()*35;z=150+r()*27;}while(mushroomAreaDistance(x,z)<.5);positions.push(x,terrainHeight(x,z)+0.25+r()*(i%2===0?.65:3.5),z);phase.push(r()*6.28);}
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
    pulse.value=pulsing;clock.value=t;motion.value=reduced?0:1;uniforms.t.value=t;uniforms.motion.value=reduced?0:1;
    lights.forEach((l,i)=>l.intensity=(i?12:18)*pulsing*Math.max(0,1-(distance-10)/35));
  });
}
