/** Standalone ROCK-R01 R04 Vite preview; production remains untouched. */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { rockR04Geometry,rockR04Material } from '../world/rockSculptR04';
const params=new URLSearchParams(location.search);
const lighting=params.get('light')==='outdoor'?'outdoor':'studio';
const view=params.get('view')??'front';
const detail=params.get('detail')==='primary'?'primary':'refined';
const seed=Number(params.get('seed')??'37');
const canvas=document.querySelector<HTMLCanvasElement>('#scene')!;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=lighting==='studio'?1.30:1.35;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(lighting==='studio'?'#434b57':'#a8c6d5');
scene.add(new THREE.HemisphereLight('#e3ebff','#36414c',lighting==='studio'?2.1:1.6));
const key=new THREE.DirectionalLight(lighting==='studio'?'#fff1dd':'#ffe5b0',3.2);
key.position.set(-5,9,7);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;
key.shadow.bias=-0.0006;scene.add(key);
const fill=new THREE.DirectionalLight('#abc4e6',lighting==='studio'?1:0.5);
fill.position.set(5,3,-5);scene.add(fill);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),
 new THREE.MeshStandardMaterial({color:lighting==='studio'?'#555f6b':'#778e67',roughness:1}));
floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const start=performance.now();
const geometry=rockR04Geometry({seed:Number.isFinite(seed)?seed:37,detail});
const generationMs=performance.now()-start;
const material=rockR04Material();material.wireframe=params.has('wire');
const mesh=new THREE.Mesh(geometry,material);mesh.position.y=0.16;
mesh.name='HeroBoulder_A01_R04';mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
const camera=new THREE.PerspectiveCamera(38,1,0.1,100);
const poses:Record<string,[number,number,number]>={
front:[4.8,3.5,7.6],opposite:[-5.7,3.2,7.4],
side:[8.3,3.1,0.4],rear:[-4.8,3.3,-7.4],top:[3.3,9,5.2]};
camera.position.set(...(poses[view]??poses.front));camera.lookAt(0,1.18,0);
const orbit=new OrbitControls(camera,canvas);orbit.target.set(0,1.18,0);orbit.enableDamping=true;
orbit.minDistance=2.5;orbit.maxDistance=22;orbit.update();
const info=geometry.userData.rockR04 as {triangles:number;pieces:unknown[]};
document.querySelector<HTMLElement>('#stats')!.textContent=
  String(info.triangles)+' triangles | '+String(info.pieces.length)+' parts | '+generationMs.toFixed(2)+' ms generation | '+detail;
(window as Window & {rockR04?:unknown}).rockR04={...info,generationMs,lighting,view};
function frame(){
 const w=canvas.clientWidth||1000,h=canvas.clientHeight||720;
 const pw=Math.round(w*renderer.getPixelRatio()),ph=Math.round(h*renderer.getPixelRatio());
 if(canvas.width!==pw||canvas.height!==ph){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 orbit.update();renderer.render(scene,camera);requestAnimationFrame(frame);
}frame();
