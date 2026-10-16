// LIB-R01-R03 — library banker's lamp, derived from the owner's October reference.
// Compact canopy silhouette, ivory reflecting underside, polished brass pedestal,
// arched tubular support, visible warm bulb and beaded pull chain.
// The existing lamp.library object/save/lamp-sync contract remains unchanged.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import { v3 } from './kit';

export function libraryR03BankersLamp(w:World,x:number,y:number,z:number) {
  const g=new THREE.Group();
  const brass=w.material(new THREE.MeshPhongMaterial({
    color:'#c6a24e', specular:'#f8dd91', shininess:100
  }));
  const darkBrass=w.material(new THREE.MeshPhongMaterial({
    color:'#896330', specular:'#d6b36b', shininess:80
  }));
  const green=w.material(new THREE.MeshPhongMaterial({
    color:'#0f6c31', specular:'#c5f3ce', shininess:110, side:THREE.DoubleSide
  }));
  const ivory=w.material(new THREE.MeshLambertMaterial({
    color:'#f8e8bc', side:THREE.DoubleSide
  }));
  const glassLight=w.material(new THREE.MeshBasicMaterial({color:'#fff0b8',side:THREE.DoubleSide}));
  const sphere=(r:number,mat:THREE.Material,at:[number,number,number],scale?:[number,number,number])=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),mat);
    m.position.set(...at);if(scale)m.scale.set(...scale);g.add(m);return m;
  };
  const tube=(points:[number,number,number][],r:number,mat:THREE.Material,seg=16)=>{
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,seg,r,7,false),mat);
    g.add(mesh);return mesh;
  };
  // Brass foot: a circular, heavy stepped base with a fluted small plinth.
  const profile:[[number,number], ...[number,number][]]=[
    [.005,0],[.154,0],[.166,.012],[.168,.023],[.144,.038],
    [.13,.055],[.082,.069],[.071,.083],[.062,.132],
    [.077,.158],[.084,.188],[.066,.209],[.035,.229]
  ];
  const base=new THREE.Mesh(
    new THREE.LatheGeometry(profile.map(([r,h])=>new THREE.Vector2(r,h)),20),brass);
  g.add(base);
  sphere(.061,darkBrass,[0,.18,0],[1,.34,1]);
  // S-curved pipe bends towards the side of the glass shade.
  tube([[0,.222,0],[.012,.31,0],[.065,.35,0],[.104,.405,0],[.10,.455,0]],.018,brass,20);
  sphere(.042,brass,[.10,.455,0]);
  // Rectangular lateral brass axle & turned end caps as on the photographed fixture.
  const axis=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.69,10),darkBrass);
  axis.rotation.z=Math.PI/2;axis.position.set(-.04,.46,0);g.add(axis);
  for(const sx of [-.365,.30]) {
    sphere(.032,brass,[sx,.46,0],[.45,1,1]);
    sphere(.021,darkBrass,[sx+(sx<0?-.02:.02),.46,0],[.48,1,1]);
  }
  // Dome profile is elongated in X, curved over Z, flat open along its bottom edge.
  // The arch drops at the glass canopy ends and reads as a classic banker's lamp at game DPR.
  const nx=16,nz=10,verts:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let i=0;i<=nx;i++){
    const u=i/nx,xx=(u-.5)*.73,tip=Math.pow(Math.abs(2*u-1),8);
    const f=1-.45*tip;
    for(let j=0;j<=nz;j++){
      const v=j/nz;
      const zz=(v-.5)*.36*f;
      const dome=.095*(1-Math.pow(2*v-1,2))*Math.sqrt(f);
      const round=.042*Math.pow(1-Math.pow(2*u-1,2),.6);
      verts.push(xx,.465+dome+round,zz);
      uv.push(u,v);
    }
  }
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
    const a=i*(nz+1)+j,b=a+nz+1;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const shell=new THREE.BufferGeometry();
  shell.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  shell.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  shell.setIndex(indices);shell.computeVertexNormals();
  const shade=new THREE.Mesh(shell,green);g.add(shade);
  // Deep, curved lip along the long edges and the semicircular glass endcaps.
  const rim=(front:number)=>{
    const pts:[number,number,number][]=[];
    for(let i=0;i<=20;i++){
      const u=i/20,tip=Math.pow(Math.abs(2*u-1),8);
      const f=1-.45*tip,xx=(u-.5)*.73;
      const round=.042*Math.pow(1-Math.pow(2*u-1,2),.6);
      pts.push([xx,.463+round,front*.18*f]);
    }
    tube(pts,.010,brass,32);
  };
  rim(1);rim(-1);
  // Ivory reflecting underside (within the open-ended curved shade).
  const underside=new THREE.Mesh(new THREE.PlaneGeometry(.675,.295),ivory);
  underside.rotation.x=Math.PI/2;
  underside.position.set(0,.462,0);g.add(underside);
  // Warm bulb just below the shade, lit via the existing GameApi lamp.
  sphere(.078,glassLight,[0,.421,0],[1,.62,1]);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.044,.052,.032,10),brass);
  cup.position.set(0,.453,0);g.add(cup);
  // Small pull-chain right of the shade: low-count beads, no separate physics.
  for(let i=0;i<8;i++)sphere(.006,i%2?darkBrass:brass,[.23,.435-i*.027,.11]);
  sphere(.014,brass,[.23,.226,.11],[1,1.7,1]);
  g.position.copy(v3(x,y,z));
  g.userData.room='library';
  w.scene.add(g);
  return { obj:g,glow:[glassLight],light:v3(x,y+.43,z)};
}
