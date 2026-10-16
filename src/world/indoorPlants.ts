// Authored botanical families, leaf venation and containers for close interior views.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32 } from '../core/rng';
import { gardenLeaf, gardenPot, gardenSoil, gardenSoilMaterial, SOIL_TINT } from './gardenkit';
import { Asm, artMats } from './artkit';
import { surface } from './surfaces';
import type { Ctx } from './arch';

export const INDOOR_FAMILIES=['ficus','snake','alocasia','pothos','cactus','succulent','zz'] as const;
export type IndoorFamily=typeof INDOOR_FAMILIES[number];
export const INDOOR_VARIANTS=3;
export type ContainerStyle='clay'|'ceramic'|'wicker'|'stand';
const Y=new THREE.Vector3(0,1,0),V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export const WHITE_LEAF_UV=[.875,.25] as const;
export function whitePlantUV(g:THREE.BufferGeometry) {
  const uv=new Float32Array(g.attributes.position.count*2);for(let i=0;i<uv.length;i+=2){uv[i]=WHITE_LEAF_UV[0];uv[i+1]=WHITE_LEAF_UV[1];}g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g;
}
let leafMat:THREE.MeshLambertMaterial|null=null;
/** Midrib follows the petiole-to-tip axis; paired side veins arc outward and toward the tip. */
export function indoorLeafMaterial() {
  if(leafMat)return leafMat;
  const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d')!;x.fillStyle='#ffffff';x.fillRect(0,0,1024,512);
  INDOOR_FAMILIES.forEach((family,tile)=>{
    const ox=tile%4*256,oy=Math.floor(tile/4)*256;x.save();x.beginPath();x.rect(ox+2,oy+2,252,252);x.clip();
    const gr=x.createLinearGradient(ox,0,ox+256,0);gr.addColorStop(0,'#a7b29b');gr.addColorStop(.42,'#e0e5d9');gr.addColorStop(.5,'#f8f9ed');gr.addColorStop(.58,'#d5decc');gr.addColorStop(1,'#a9b89e');x.fillStyle=gr;x.fillRect(ox,oy,256,256);
    // Fine brush grain stays subordinate to coherent growth lines.
    const r=mulberry32(9900+tile*71);for(let i=0;i<850;i++){x.globalAlpha=.055;x.fillStyle=r()<.5?'#3d5137':'#ffffff';x.fillRect(ox+r()*256,oy+r()*256,.7,2+r()*3);}x.globalAlpha=1;
    const rib=(colour:string,width:number,offset=0)=>{x.strokeStyle=colour;x.lineWidth=width;x.beginPath();x.moveTo(ox+128+offset,oy+252);x.bezierCurveTo(ox+125+offset,oy+170,ox+132+offset,oy+65,ox+128+offset,oy+4);x.stroke();};
    if(family==='snake'||family==='cactus'){
      for(let k=0;k<9;k++){x.strokeStyle=k%2?'#b9c3ac':'#e6ebd9';x.lineWidth=family==='cactus'?5:3;x.beginPath();x.moveTo(ox+24+k*26,oy+256);x.lineTo(ox+24+k*26,oy);x.stroke();}
      if(family==='snake')for(let k=0;k<14;k++){x.fillStyle='rgba(96,112,80,.16)';x.fillRect(ox,oy+k*19,256,4);}
    }else if(family!=='succulent'){
      const pairs=family==='alocasia'?6:9;
      for(let k=0;k<pairs;k++)for(const sign of [-1,1]){
        const v=.12+k/(pairs+1)*.8,cy=oy+256*(1-v),reach=104*Math.pow(Math.sin(Math.PI*v),.7);
        x.lineCap='round';x.strokeStyle=family==='alocasia'?'#6d8559':'#7e966b';x.lineWidth=family==='alocasia'?4.5:2.8;
        x.beginPath();x.moveTo(ox+128,cy);x.bezierCurveTo(ox+128+sign*reach*.35,cy-8,ox+128+sign*reach*.72,cy-22,ox+128+sign*reach,cy-28);x.stroke();
        x.strokeStyle=family==='alocasia'?'#edf0c2':'#dde8bd';x.lineWidth=family==='alocasia'?2:1.25;x.stroke();
      }
      rib('#718b5d',family==='alocasia'?6:4);rib('#edf2c8',family==='alocasia'?2.5:1.8,1);
    }x.restore();
  });
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  return leafMat=surface(new THREE.MeshLambertMaterial({map,vertexColors:true}), 'foliage');
}
const modelCache=new Map<string,THREE.BufferGeometry>();
export function indoorPlantModel(family:IndoorFamily,variant=0) {
  const v=((variant%3)+3)%3,key=`${family}.${v}`;const cached=modelCache.get(key);if(cached)return cached;
  const r=mulberry32(19001+INDOOR_FAMILIES.indexOf(family)*211+v*71),parts:THREE.BufferGeometry[]=[],tile=INDOOR_FAMILIES.indexOf(family);
  const c0=new THREE.Color(v===2?'#386a36':'#285835'),c1=new THREE.Color(v===1?'#8aa65a':'#7cae59');
  const rod=(a:THREE.Vector3,b:THREE.Vector3,rad=.008,colour=c0)=>{
    const d=b.clone().sub(a),g=new THREE.CylinderGeometry(rad*.65,rad,d.length(),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y,d.clone().normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());
    const col=new Float32Array(g.attributes.position.count*3);for(let i=0;i<col.length;i+=3)col.set([colour.r,colour.g,colour.b],i);g.setAttribute('color',new THREE.BufferAttribute(col,3));whitePlantUV(g);parts.push(g.toNonIndexed());g.dispose();
  };
  const leaf=(p:THREE.Vector3,d:THREE.Vector3,L:number,W:number,h:number,up=0)=>{
    const g=gardenLeaf(p,d,L,W,h,c0,c1,up,10,4,tile);
    // Shield and heart leaves widen in the basal third, keeping the petiole attachment narrow.
    if(family==='alocasia'||family==='pothos'){
      const pos=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<pos.count;i++){
        const q=V(pos.getX(i),pos.getY(i),pos.getZ(i)).sub(p),u=uv.getY(i)*2-(1-Math.floor(tile/4)),side=V(-d.z,0,d.x),s=q.dot(side);
        const basal=Math.exp(-(((u-.20)/.18)**2));
        q.addScaledVector(side,s*.65*basal);q.addScaledVector(d,-L*.23*(Math.abs(s)/W)*basal);q.y-=L*.12*u**4; q.add(p);pos.setXYZ(i,q.x,q.y,q.z);
      }
      // Preserve the smoothly authored normal field after the small silhouette expansion.
    }parts.push(g);
  };
  if(family==='ficus'){
    const branches=[1,3,2][v];for(let j=0;j<branches;j++){
      const a=j*2.4+v*.45,end=V(Math.cos(a)*.13,.72+j*.15+v*.06,Math.sin(a)*.13);rod(V(),end,.012);
      for(let k=0;k<[9,6,7][v];k++){const u=.18+k/([9,6,7][v]+1)*.8,p=end.clone().multiplyScalar(u),an=a+k*2.399,d=V(Math.cos(an),0,Math.sin(an)),joint=p.clone().addScaledVector(d,.035);rod(p,joint,.003);leaf(joint,d,.23+r()*.13,.075+r()*.018,.04+r()*.04,.02+r()*.27);}
      leaf(end,V(Math.cos(a),0,Math.sin(a)),.17,.055,.08,.45);
    }
  }else if(family==='snake'){
    const n=[7,12,9][v];for(let i=0;i<n;i++){const a=i*2.399+v*.4,d=V(Math.cos(a),0,Math.sin(a));leaf(d.clone().multiplyScalar(.02+r()*.065),d,[.95,.64,.78][v]*(.7+r()*.4),.035+r()*.023,.12,[.93,.78,.7][v]);}
  }else if(family==='alocasia'){
    const n=[3,5,6][v];for(let i=0;i<n;i++){const a=i*2.399+v,d=V(Math.cos(a),0,Math.sin(a)),p=d.clone().multiplyScalar(.16).add(V(0,.24+r()*.35,0));rod(V(),p,.009);leaf(p,d,[.44,.31,.35][v]*(.85+r()*.25),[.17,.13,.14][v],.10,-.12);}
  }else if(family==='pothos'){
    for(let j=0;j<[3,5,2][v];j++){
      const a=j*2.399,d=V(Math.cos(a),0,Math.sin(a)),len=[.8,.58,1.15][v]*(.85+r()*.25);let prev=V();
      // Climb over the rim before trailing down outside the vessel.
      for(const p of [d.clone().multiplyScalar(.20).add(V(0,.13,0)),d.clone().multiplyScalar(.29).add(V(0,.10,0))]){rod(prev,p,.004);prev=p;}
      for(let k=0;k<7;k++){const u=(k+1)/7,p=d.clone().multiplyScalar(.29+Math.sin(u*2)*.08).add(V(Math.sin(u*5+j)*.04,.10-len*u,0));rod(prev,p,.004);const ld=d.clone().applyAxisAngle(Y,(k%2?1:-1)*.8);leaf(p,ld,.16+r()*.05,.065,.035,-.18);prev=p;}
    }
    for(let i=0;i<4;i++){const a=i*1.57;leaf(V(),V(Math.cos(a),0,Math.sin(a)),.20,.07,.13,.25);}
  }else if(family==='zz'){
    for(let j=0;j<[4,6,3][v];j++){const a=j*2.399,d=V(Math.cos(a),0,Math.sin(a)),end=d.clone().multiplyScalar(.15).add(V(0,[.68,.48,.85][v]*(.8+r()*.3),0));rod(V(),end,.012);
      for(let k=0;k<5;k++)for(const sign of [-1,1]){const p=end.clone().multiplyScalar(.25+k*.14),ld=d.clone().applyAxisAngle(Y,sign*1.1);leaf(p,ld,.13+r()*.05,.041,.04,.22);}
    }
  }else if(family==='succulent'){
    const clumps=v===1?3:1;for(let j=0;j<clumps;j++)for(let ring=0;ring<3;ring++)for(let i=0;i<6;i++){
      const a=i*Math.PI/3+ring*.45+j,base=V(clumps===3?Math.cos(j*2.1)*.12:0,ring*.025,clumps===3?Math.sin(j*2.1)*.12:0),d=V(Math.cos(a),0,Math.sin(a));leaf(base,d,(v===2?.32:.25)*(1-ring*.21),.055*(1-ring*.18),.10+ring*.02,.12+ring*.18);
    }
  }else{
    const cactus=(pos:THREE.Vector3,rad:number,h:number,ball=false)=>{
      const g=ball?new THREE.SphereGeometry(rad,20,12):new THREE.CapsuleGeometry(rad,h-rad*2,5,20),p=g.attributes.position,uv=g.attributes.uv,col:number[]=[];
      for(let i=0;i<p.count;i++){const a=Math.atan2(p.getZ(i),p.getX(i)),k=1+.075*Math.cos(a*10);p.setXYZ(i,p.getX(i)*k,p.getY(i)+(ball?rad:h/2),p.getZ(i)*k);uv.setXY(i,(tile%4+THREE.MathUtils.clamp(uv.getX(i),.01,.99))/4,(1-Math.floor(tile/4)+THREE.MathUtils.clamp(uv.getY(i),.01,.99))/2);col.push(c0.r*.9,c0.g*1.1,c0.b*1.1);}
      g.computeVertexNormals();g.translate(pos.x,pos.y,pos.z);g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));parts.push(g.toNonIndexed());g.dispose();
      for(let row=0;row<5;row++)for(let k=0;k<8;k++){const a=k*Math.PI/4+row*.3,p=pos.clone().add(V(Math.cos(a)*rad,.08+row*(ball?rad*.25:h*.17),Math.sin(a)*rad));rod(p,p.clone().add(V(Math.cos(a)*.017,.012,Math.sin(a)*.017)),.0015,new THREE.Color('#cabd88'));}
    };
    if(v===0)cactus(V(),.10,.78);else if(v===1){cactus(V(),.085,.9);cactus(V(.14,0,.025),.06,.48);cactus(V(-.13,0,-.04),.05,.35);}else{cactus(V(),.16,.3,true);cactus(V(.18,0,.08),.095,.2,true);}
  }
  const g=mergeGeometries(parts)!;parts.forEach(p=>p.dispose());g.userData.keepColor=true;g.computeBoundingSphere();modelCache.set(key,g);return g;
}
let basketMat:THREE.MeshLambertMaterial|null=null;
function wickerMaterial(){
  if(basketMat)return basketMat;const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d')!;x.fillStyle='#b6a17d';x.fillRect(0,0,128,128);
  for(let y=-8;y<136;y+=8)for(let xx=-16;xx<144;xx+=16){const off=y%16?8:0;x.lineCap='round';x.strokeStyle='#786044';x.lineWidth=6;x.beginPath();x.moveTo(xx+off,y+4);x.quadraticCurveTo(xx+off+7,y-1,xx+off+13,y+3);x.stroke();x.strokeStyle='#dcc497';x.lineWidth=3;x.stroke();}
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;return basketMat=surface(new THREE.MeshLambertMaterial({map,vertexColors:true}),'fabric');
}
export function chooseIndoorFamily(x:number,z:number):IndoorFamily {
  // Coordinate cells vary the family as well as the seed; floor pots never get trailing vines.
  const list:IndoorFamily[]=['ficus','snake','alocasia','zz','succulent','cactus'];return list[((Math.floor(x*2)+Math.floor(z*3))%list.length+list.length)%list.length];
}

function indoorPot(style:ContainerStyle){
  if(style==='clay'||style==='stand')return gardenPot(.245,.40);
  const profile=style==='wicker'?[[0,0],[.87,0],[.92,.06],[.98,.85],[1.04,.91],[1.04,1],[.89,1],[.87,.90],[.78,.14],[0,.14]]:[[0,0],[.65,0],[.76,.08],[1.0,.40],[1.01,.76],[1.04,.91],[1.02,1],[.89,1],[.88,.89],[.85,.40],[.60,.14],[0,.14]];
  const g=new THREE.LatheGeometry(profile.map(([r,h])=>new THREE.Vector2(r*.245,h*.40)),28);return g;
}
export function addIndoorPlant(c:Ctx,x:number,z:number,y:number,family:IndoorFamily,variant=0,scale=1,style:ContainerStyle='clay',hangAnchor?:number) {
  const M=artMats(),a=new Asm(c.b,c.chunk,x,y,z,((x*1.3+z*.7)%6.28)),pot=indoorPot(style);
  if(style==='wicker'){const uv=pot.attributes.uv,pos=pot.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2,pos.getY(i)/.40*2);}
  const tint=style==='ceramic'?['#e9e2ce','#486b62','#c7d4d0'][variant%3]:style==='wicker'?'#ffffff':['#b76b43','#a9593d','#cc885b'][variant%3];
  a.add(style==='wicker'?wickerMaterial():style==='ceramic'?M.ceramic:M.paint,tint,pot,0,0,0,{s:[scale,scale,scale]});pot.dispose();
  const soil=gardenSoil(.218);a.add(gardenSoilMaterial(),SOIL_TINT,soil,0,.328*scale,0,{s:[scale,1,scale]});soil.dispose();
  a.add(indoorLeafMaterial(),'#ffffff',indoorPlantModel(family,variant),0,.328*scale,0,{s:[scale,scale,scale]});
  const rod=(p:THREE.Vector3,q:THREE.Vector3,r:number,material:THREE.Material,colour:string)=>{
    const d=q.clone().sub(p),g=new THREE.CylinderGeometry(r,r,d.length(),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y,d.clone().normalize()));g.translate(...p.clone().add(q).multiplyScalar(.5).toArray());a.add(material,colour,g,0,0,0);g.dispose();
  };
  if(hangAnchor!==undefined){
    for(let k=0;k<3;k++){const an=k*Math.PI*2/3;rod(V(Math.cos(an)*.235*scale,.36*scale,Math.sin(an)*.235*scale),V(0,hangAnchor-y,0),.008*scale,M.upholstery,'#cbb58b');}
    const hook=new THREE.TorusGeometry(.025,.005,5,12);a.add(M.brass,'#cbb58b',hook,0,hangAnchor-y,0);hook.dispose();
  }else if(style==='stand'){
    // A support ring connects the pot and three legs to the floor.
    const ring=new THREE.TorusGeometry(.205*scale,.02*scale,6,24).rotateX(Math.PI/2);a.add(M.timber,'#6c4b2d',ring,0,-.012*scale,0);ring.dispose();
    for(let k=0;k<3;k++){const an=k*2.094;rod(V(Math.cos(an)*.21*scale,0,Math.sin(an)*.21*scale),V(Math.cos(an)*.30*scale,-.38*scale,Math.sin(an)*.30*scale),.018*scale,M.timber,'#6c4b2d');}
  }
}
