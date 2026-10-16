// Close-view garden and room plants. Shared pot/soil/leaf construction, opt-in for review.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32 } from '../core/rng';
import { getKit } from './kit';
import { surface } from './surfaces';

export const GARDEN_DETAIL = typeof location !== 'undefined' && new URLSearchParams(location.search).get('gardenart') === 'r08';
const Y=new THREE.Vector3(0,1,0);

/** Curved blade with shared end vertices, rounded outline and continuous normals; both windings share lighting. */
export function gardenLeaf(base:THREE.Vector3,dir:THREE.Vector3,length:number,width:number,lift:number,c0:THREE.Color,c1:THREE.Color,upright=0,segments=8,across=2) {
  const side=new THREE.Vector3(-dir.z,0,dir.x).normalize(),p:number[]=[],col:number[]=[],ix:number[]=[];
  const add=(u:number,s:number)=>{
    const w=width*Math.pow(Math.sin(Math.PI*u),.72)*(1-u*.15);
    const v=base.clone().addScaledVector(dir,length*u*(1-upright*.6)).addScaledVector(side,w*s)
      .addScaledVector(Y,Math.sin(u*Math.PI*.85)*lift+u*upright*length-w*s*s*.25);
    p.push(v.x,v.y,v.z);
    const colour=c0.clone().lerp(c1,.2+u*.65).multiplyScalar(1+.075*Math.cos(u*Math.PI*8-Math.abs(s)*3)+.10*Math.exp(-Math.abs(s)*8)-.025*Math.abs(s));
    col.push(colour.r,colour.g,colour.b);
  };
  add(0,0);
  for(let k=1;k<segments;k++)for(let j=0;j<=across;j++)add(k/segments,j/across*2-1);
  add(1,0);const tip=p.length/3-1,row=across+1;
  for(let j=0;j<across;j++)ix.push(0,1+j,2+j);
  for(let k=0;k<segments-2;k++)for(let j=0;j<across;j++){
    const a=1+k*row+j,b=a+row;ix.push(a,b,a+1,a+1,b,b+1);
  }
  const end=1+(segments-2)*row;
  for(let j=0;j<across;j++)ix.push(end+j,tip,end+j+1);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(ix);g.computeVertexNormals();
  const n=g.attributes.normal;
  for(let i=0;i<n.count;i++){
    const v=new THREE.Vector3().fromBufferAttribute(n,i);if(v.y<0)v.negate();v.lerp(Y,.35).normalize();n.setXYZ(i,v.x,v.y,v.z);
  }
  const front=[...ix];for(let i=0;i<front.length;i+=3)ix.push(front[i],front[i+2],front[i+1]);g.setIndex(ix);
  const result=g.toNonIndexed();g.dispose();result.userData.keepColor=true;return result;
}

/** Closed ceramic section with an actual hollow interior, instead of a cap across the opening. */
export function gardenPot(radius:number,height:number) {
  const profile=[[0,0],[.68,0],[.73,.05],[.96,.82],[1.05,.86],[1.07,.94],[1.04,1],[.91,1],[.88,.94],[.89,.84],[.70,.13],[0,.13]];
  const g=new THREE.LatheGeometry(profile.map(([r,h])=>new THREE.Vector2(r*radius,h*height)),28);
  const p=g.attributes.position,col:number[]=[];
  for(let i=0;i<p.count;i++){
    const h=p.getY(i)/height,a=Math.atan2(p.getZ(i),p.getX(i)),v=.90+.08*h+.025*Math.sin(h*27+a*.5);
    col.push(v,v,v);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.userData.keepColor=true;return g;
}
export function gardenSoil(radius:number) {
  const g=new THREE.CircleGeometry(radius,48).rotateX(-Math.PI/2),p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/.65,p.getZ(i)/.65);
  return g;
}
let soil:THREE.MeshLambertMaterial|null=null;
/** Reuses the approved dirt albedo with a darker earth tint, at a smaller scale for pots. */
export function gardenSoilMaterial() {
  return soil??=surface(new THREE.MeshLambertMaterial({map:getKit().T.dirt,vertexColors:true}), 'ground');
}
export const SOIL_TINT='#92775d';

/** Distinct rubber-plant and upright lance-leaf habits; metres relative to the pot's soil surface. */
export function gardenHouseplant(variant=0) {
  const r=mulberry32(8801+variant*117),parts:THREE.BufferGeometry[]=[],dark=new THREE.Color('#315b32'),light=new THREE.Color('#87b85a');
  const stem=(a:THREE.Vector3,b:THREE.Vector3,rad:number)=>{
    const d=b.clone().sub(a),g=new THREE.CylinderGeometry(rad*.65,rad,d.length(),7);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y,d.clone().normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());
    g.deleteAttribute('uv');const cc=new Float32Array(g.attributes.position.count*3);for(let i=0;i<cc.length;i+=3)cc.set([dark.r,dark.g,dark.b],i);g.setAttribute('color',new THREE.BufferAttribute(cc,3));parts.push(g.toNonIndexed());g.dispose();
  };
  if(variant%3===1){
    for(let i=0;i<11;i++){
      const a=i*2.39996,d=new THREE.Vector3(Math.cos(a),0,Math.sin(a));
      parts.push(gardenLeaf(new THREE.Vector3(d.x*.025,0,d.z*.025),d,.62+r()*.32,.035+r()*.018,.14,dark,light,.78,10,4));
    }
  }else{
    for(let branch=0;branch<3;branch++){
      const a=branch*2.1,root=new THREE.Vector3(),end=new THREE.Vector3(Math.cos(a)*.11,.58+branch*.11,Math.sin(a)*.11);stem(root,end,.009);
      for(let k=0;k<5;k++){
        const u=.20+k*.16,base=end.clone().multiplyScalar(u),an=a+k*2.4,d=new THREE.Vector3(Math.cos(an),0,Math.sin(an)),length=.20+r()*.10;
        const joint=base.clone().addScaledVector(d,.035).addScaledVector(Y,.02);stem(base,joint,.003);
        parts.push(gardenLeaf(joint,d,length,.065+r()*.025,.045,dark,light,.12,8,4));
      }
      parts.push(gardenLeaf(end,new THREE.Vector3(Math.cos(a+.5),0,Math.sin(a+.5)),.16,.052,.05,dark,light,.45,8,4));
    }
  }
  const g=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());g.userData.keepColor=true;g.computeBoundingSphere();return g;
}

/** Leaves cover top, both long sides and ends of the clipped hedge. The dark inset core never forms the outer face. */
export function gardenHedge(length:number) {
  const r=mulberry32(8813+Math.round(length*100)),parts:THREE.BufferGeometry[]=[];
  const leaf=(center:THREE.Vector3,normal:THREE.Vector3,a:number)=>{
    const g=gardenLeaf(new THREE.Vector3(-.066,0,0),new THREE.Vector3(1,0,0),.132,.044,.012,new THREE.Color('#c5d6b8'),new THREE.Color('#eff4cf'),0,3,2);
    g.rotateY(a);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y,normal));g.translate(center.x,center.y,center.z);
    g.setAttribute('uv',new THREE.Float32BufferAttribute(Array.from({length:g.attributes.position.count*2},(_,i)=>i%2?0:30),2));parts.push(g);
  };
  const nx=Math.ceil(length/.09);
  for(let i=0;i<nx;i++){
    const x=-length/2+(i+.5)*length/nx;
    for(const sign of [-1,1])for(let j=0;j<9;j++)leaf(new THREE.Vector3(x+(r()-.5)*.035,.045+j*.073+(r()-.5)*.02,sign*(.32+(r()-.5)*.012)),new THREE.Vector3(0,.15,sign).normalize(),r()*Math.PI*2);
    for(let j=0;j<8;j++)leaf(new THREE.Vector3(x+(r()-.5)*.03,.69+(r()-.5)*.014,(j-3.5)*.078),Y,r()*Math.PI*2);
  }
  for(const sign of [-1,1])for(let j=0;j<9;j++)for(let k=0;k<8;k++)leaf(new THREE.Vector3(sign*length/2,.045+j*.073,(k-3.5)*.078),new THREE.Vector3(sign,.12,0).normalize(),r()*Math.PI*2);
  const g=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());g.userData.keepColor=true;return g;
}

/** Average authored normals across coincident flower/stem vertices without reversing back faces. */
export function gardenSmoothNormals(g:THREE.BufferGeometry) {
  const p=g.attributes.position,n=g.attributes.normal,groups=new Map<string,{sum:THREE.Vector3;ids:number[]}>();
  for(let i=0;i<p.count;i++){
    const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(',');
    let group=groups.get(key);if(!group){group={sum:new THREE.Vector3(),ids:[]};groups.set(key,group);}
    group.sum.add(new THREE.Vector3(n.getX(i),n.getY(i),n.getZ(i)));group.ids.push(i);
  }
  for(const {sum,ids} of groups.values()){sum.normalize();if(sum.lengthSq()<.1)sum.copy(Y);for(const i of ids)n.setXYZ(i,sum.x,sum.y,sum.z);}
}
