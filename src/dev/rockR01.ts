/** ROCK-R01 A01: isolated Vite calibration scene. No production integration. */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { heroBoulderGeometry, heroBoulderMaterial } from '../world/rockSculpt';

const qs=new URLSearchParams(location.search);
const light=qs.get('light')==='outdoor'?'outdoor':'studio';
const view=qs.get('view')??'front';
const seed=Number(qs.get('seed')??'37');
const step=Number(qs.get('step')??'0.12');
const canvas=document.querySelector<HTMLCanvasElement>('#scene')!;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=light==='studio'?1.25:1.42;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(light==='studio'?'#343941':'#a9c7da');
const camera=new THREE.PerspectiveCamera(40,1,0.1,120);
const pivot=new THREE.Vector3(0,1.18,0);
const poses:Record<string,[number,number,number]>={
  front:[4.4,2.4,7.1],opposite:[-5.8,2.6,5.2],
  rear:[-3.4,2,-7.8],side:[8.2,2.5,0],top:[4,7.3,4.1],
};
camera.position.set(...(poses[view]??poses.front));
camera.lookAt(pivot);
const controls=new OrbitControls(camera,canvas);
controls.target.copy(pivot);controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=18;controls.update();
scene.add(new THREE.HemisphereLight(light==='studio'?'#e1e9ff':'#bfe0ff','#343638',light==='studio'?2.1:1.4));
const key=new THREE.DirectionalLight(light==='studio'?'#fff2e4':'#ffe8ba',light==='studio'?3.0:3.4);
key.position.set(-4,8,light==='studio'?6:3);
key.castShadow=true;key.shadow.mapSize.set(2048,2048);
key.shadow.camera.left=-8;key.shadow.camera.right=8;
key.shadow.camera.top=8;key.shadow.camera.bottom=-8;key.shadow.bias=-0.0006;
scene.add(key);
const rim=new THREE.DirectionalLight('#9ab9ff',light==='studio'?1.4:0.4);
rim.position.set(4,3,-6);scene.add(rim);
const ground=new THREE.Mesh(
  new THREE.PlaneGeometry(30,30),
  new THREE.MeshStandardMaterial({color:light==='studio'?'#777e88':'#647750',roughness:1})
);
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
const geometry=heroBoulderGeometry({seed:Number.isFinite(seed)?seed:37,step:Number.isFinite(step)?step:0.12});
const material=heroBoulderMaterial();
material.wireframe=qs.has('wire');
const rock=new THREE.Mesh(geometry,material);
rock.name='HeroBoulder_A01';rock.castShadow=true;rock.receiveShadow=true;
rock.position.y=0.12;scene.add(rock);
const triangles=geometry.getAttribute('position').count/3;
document.querySelector<HTMLElement>('#status')!.textContent=
  'HeroBoulder_A01 • '+triangles.toLocaleString()+' triangles • seed '+seed+' • '+light+' / '+view;
(window as Window & {rockR01?:unknown}).rockR01={
 triangles,bounds:geometry.boundingBox?.min.toArray().concat(geometry.boundingBox.max.toArray()),light,view,seed
};
function frame(){
 const w=canvas.clientWidth||1200,h=canvas.clientHeight||750;
 const pw=Math.round(w*renderer.getPixelRatio()),ph=Math.round(h*renderer.getPixelRatio());
 if(canvas.width!==pw||canvas.height!==ph){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 controls.update();renderer.render(scene,camera);requestAnimationFrame(frame);
}
frame();
