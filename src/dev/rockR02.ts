/** Standalone A01-R02 Vite review, not imported by production. */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { rockR02Geometry, rockR02Material } from '../world/rockSculptR02';

const params=new URLSearchParams(location.search);
const light=params.get('light')==='outdoor'?'outdoor':'studio';
const view=params.get('view')??'front';
const seed=Number(params.get('seed')??'37'),step=Number(params.get('step')??'0.16');
const canvas=document.querySelector<HTMLCanvasElement>('#scene')!;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(light==='studio'?'#444952':'#a8c7d9');
scene.add(new THREE.HemisphereLight('#e7eeff','#283541',light==='studio'?1.8:1.25));
const key=new THREE.DirectionalLight(light==='studio'?'#fff1de':'#fff1c7',3.2);
key.position.set(-4,9,7);key.castShadow=true;
key.shadow.mapSize.set(2048,2048);
key.shadow.camera.left=-8;key.shadow.camera.right=8;
key.shadow.camera.top=8;key.shadow.camera.bottom=-8;key.shadow.bias=-0.0007;
scene.add(key);
const fill=new THREE.DirectionalLight('#9eb7e7',light==='studio'?1.05:0.45);fill.position.set(5,3,-5);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(30,30),
  new THREE.MeshStandardMaterial({color:light==='studio'?'#6e747f':'#566d46',roughness:1}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const geo=rockR02Geometry({seed,step});
const mat=rockR02Material();mat.wireframe=params.has('wire');
const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;
mesh.name='HeroBoulder_A01_R02';scene.add(mesh);
const camera=new THREE.PerspectiveCamera(39,1,0.1,100);
const poses:Record<string,[number,number,number]>={front:[4.5,3.1,7.4],opposite:[-5.8,2.8,6.4],rear:[-4.6,3.1,-7.7],side:[7.7,2.8,0],top:[3.5,8.5,4.4]};
camera.position.set(...(poses[view]??poses.front));camera.lookAt(0,1.15,0);
const orbit=new OrbitControls(camera,canvas);orbit.target.set(0,1.15,0);
orbit.enableDamping=true;orbit.update();
document.querySelector<HTMLElement>('#stats')!.textContent=
  `R02 experimental • ${geo.userData.rockR02.triangles} triangles • ${geo.userData.rockR02.vertices} vertices`;
(window as Window & {rockR02?:unknown}).rockR02=geo.userData.rockR02;
function frame(){const w=canvas.clientWidth||1000,h=canvas.clientHeight||720;
  const pw=Math.round(w*renderer.getPixelRatio()),ph=Math.round(h*renderer.getPixelRatio());
  if(canvas.width!==pw||canvas.height!==ph){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  orbit.update();renderer.render(scene,camera);requestAnimationFrame(frame);}
frame();
