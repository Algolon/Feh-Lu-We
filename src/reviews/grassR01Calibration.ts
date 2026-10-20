// GRASS-R01: stand-alone Vite development calibration. Not imported from src/main.ts.
// Open /grass-r01.html?palette=meadow&family=prototype&view=mid and compare with family=baseline.
// Uses the project's EXISTING multi-draw / instanced vegetation batch (never one Mesh per tuft).
import * as THREE from 'three';
import type { World } from '../interactions/world';
import { mulberry32 } from '../core/rng';
import { hideMultiDraw, FORCE_NO_MULTIDRAW, detectCaps, vegPathLabel } from '../core/caps';
import { makeVegBatch } from '../world/vegbatch';
import { referencePlantModel, woodMats } from '../world/woodkit';
import { GRASS_R01_NAMES, grassR01Model, type GrassR01Profile } from './grassR01Model';

if (FORCE_NO_MULTIDRAW) hideMultiDraw();
const params = new URLSearchParams(location.search);
const palette: GrassR01Profile = params.get('palette') === 'woodland' ? 'woodland' : 'meadow';
const family = params.get('family') === 'baseline' ? 'baseline' : 'prototype';
const view = params.get('view') === 'close' || params.get('view') === 'wide' ? params.get('view')! : 'mid';
const shadows = params.get('shadows') === '1';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(params.get('dpr') === '1.5' ? 1.5 : 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = palette === 'meadow' ? 1.4 : 1.5;
renderer.shadowMap.enabled = shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('viewport')!.appendChild(renderer.domElement);
detectCaps(renderer);

const scene = new THREE.Scene();
scene.background = new THREE.Color(palette === 'meadow' ? '#c4dce5' : '#b9c1bb');
scene.fog = new THREE.Fog(scene.background, 19, 54);
const camera = new THREE.PerspectiveCamera(57, innerWidth / innerHeight, 0.07, 75);
const cameraPos: Record<string, [number, number, number, number, number, number]> = {
  close: [0, 1.38, 6.6, 0, 0.32, 2.4],
  mid: [0, 1.68, 10.4, 0, 0.45, -4.4],
  wide: [0, 4.6, 16, 0, 0.2, -8],
};
const [cx, cy, cz, tx, ty, tz] = cameraPos[view];
camera.position.set(cx, cy, cz);
camera.lookAt(tx, ty, tz);

scene.add(new THREE.HemisphereLight(
  palette === 'meadow' ? '#f1f8ff' : '#fff0cf',
  palette === 'meadow' ? '#4c6750' : '#56513c',
  palette === 'meadow' ? 1.9 : 1.4,
));
const sun = new THREE.DirectionalLight(palette === 'meadow' ? '#fffbe4' : '#ffe7ac', palette === 'meadow' ? 2.7 : 3.0);
sun.position.set(-9, palette === 'meadow' ? 15 : 8, 10);
sun.castShadow = shadows;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -18; sun.shadow.camera.right = 18;
sun.shadow.camera.top = 19; sun.shadow.camera.bottom = -19;
sun.shadow.normalBias = 0.035;
scene.add(sun, sun.target);

const terrainY = (x: number, z: number) =>
  0.11 * Math.sin(x * 0.37) * Math.cos(z * 0.31) +
  0.06 * Math.sin(x * 0.63 + z * 0.21);
const pathX = (z: number) => Math.sin(z * 0.22) * 0.75;
const smooth = (a: number, b: number, t: number) => THREE.MathUtils.smoothstep(t, a, b);
const grassTone = new THREE.Color(palette === 'meadow' ? '#619755' : '#8b8248');
const pathTone = new THREE.Color(palette === 'meadow' ? '#a59979' : '#a99a72');
const ground = new THREE.PlaneGeometry(25, 46, 60, 88).rotateX(-Math.PI / 2);
const gPos = ground.getAttribute('position') as THREE.BufferAttribute;
const gColor: number[] = [];
for (let i = 0; i < gPos.count; i++) {
  const x = gPos.getX(i), z = gPos.getZ(i);
  gPos.setY(i, terrainY(x, z));
  const pathEdge = smooth(0.6, 1.45, Math.abs(x - pathX(z)));
  const c = pathTone.clone().lerp(grassTone, pathEdge);
  const mottling = 0.94 + 0.045 * Math.sin(x * 0.54 + Math.cos(z * 0.39)) * Math.sin(z * 0.42);
  c.multiplyScalar(mottling);
  gColor.push(c.r, c.g, c.b);
}
ground.setAttribute('color', new THREE.Float32BufferAttribute(gColor, 3));
ground.computeVertexNormals();
const field = new THREE.Mesh(ground, new THREE.MeshLambertMaterial({ vertexColors: true }));
field.receiveShadow = true;
scene.add(field);

const rockMat = new THREE.MeshLambertMaterial({ color: palette === 'meadow' ? '#7d8581' : '#777c7c', flatShading: true });
for (const [x, z, r] of [[-3.4, -7.4, .68], [3.7, -10.3, .85], [-5.2, -14, .56], [5.0, -4.1, .48]] as const) {
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), rockMat);
  rock.scale.set(r * 1.3, r * 0.75, r);
  rock.position.set(x, terrainY(x, z) + r * 0.25, z);
  rock.rotation.y = x * .37;
  rock.castShadow = shadows; rock.receiveShadow = true;
  scene.add(rock);
}
// Two simplified woodland shadow proxies; not production trees or part of the grass metrics.
if (palette === 'woodland') {
  for (const [x, z, h] of [[-7.0, -9.0, 6.2], [7.2, -14.0, 7.0]] as const) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.17, .23, h, 6), new THREE.MeshLambertMaterial({ color: '#50483b' }));
    trunk.position.set(x, terrainY(x, z) + h / 2, z);
    trunk.castShadow = shadows;
    scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 1), new THREE.MeshLambertMaterial({ color: '#b79d4e', flatShading: true }));
    crown.position.set(x + .25, h * .92, z);
    crown.scale.set(1.18, .61, 1.08);
    crown.castShadow = shadows;
    scene.add(crown);
  }
}

const geos = Array.from({ length: 4 }, (_, v) => family === 'prototype'
  ? grassR01Model(v, palette)
  : referencePlantModel('grass', v, true, false));
const worldStub = { scene } as World; // makeVegBatch uses only World.scene in this fixture
const batch = makeVegBatch(worldStub, geos, 1500, woodMats().flat, {
  castShadow: false, sortObjects: false, preserveRegions: false,
  tag: { review: 'GRASS-R01', profile: palette, family },
});
const RNG = mulberry32(55101);
const M = new THREE.Matrix4(), Q = new THREE.Quaternion();
const axis = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3(), scale = new THREE.Vector3();
let clumpCount = 0;
function place(v: number, x: number, z: number, size: number, heading: number, value = 1) {
  Q.setFromAxisAngle(axis, heading);
  const tint = new THREE.Color(1, 1, 1).multiplyScalar(value);
  M.compose(pos.set(x, terrainY(x, z) - 0.018, z), Q, scale.setScalar(size));
  batch.addInstance(v, M, tint);
  clumpCount++;
}
// Four separate clumps in the near field. Camera-height views inspect actual blade silhouettes.
for (let i = 0; i < 4; i++) place(i, -5.1 + i * 3.4, 3.0, 1.35, 0.3 + i * .71);
// Coherent low-frequency patches, jittered samples, an excluded walking path, and bare rock contacts.
for (let z = -19; z < -2.0; z += 0.47) for (let x = -6.5; x < 6.5; x += 0.47) {
  const X = x + (RNG() - .5) * .40, Z = z + (RNG() - .5) * .40;
  const distanceToPath = Math.abs(X - pathX(Z));
  if (distanceToPath < 0.77 + RNG() * .4) continue;
  const nearRock = [[-3.4, -7.4, .68], [3.7, -10.3, .85], [-5.2, -14, .56], [5, -4.1, .48]]
    .some(([rx, rz, rr]) => Math.hypot(X - rx, Z - rz) < rr + .22);
  if (nearRock) continue;
  const patch = 0.5 + 0.24 * Math.sin(X * .55 + Math.sin(Z * .18)) +
    0.2 * Math.cos(Z * .42 - X * .21);
  const chance = (palette === 'meadow' ? .72 : .57) * THREE.MathUtils.clamp(patch + .4, 0.15, 1.0);
  if (RNG() > chance) continue;
  const v = Math.min(3, Math.floor(RNG() * 4));
  place(v, X, Z, 0.70 + RNG() * .54, RNG() * Math.PI * 2, .95 + RNG() * .1);
}

const overlay = document.getElementById('overlay')!;
const nextUrl = (key: string, val: string) => {
  const next = new URL(location.href);
  next.searchParams.set(key, val);
  location.assign(next.toString());
};
overlay.innerHTML = `<h1>GRASS-R01 · ISOLATED CALIBRATION</h1>
  <p>Family: <strong>${family}</strong> · Palette: <strong>${palette}</strong> · View: ${view}</p>
  <div class="switches">
    <label>Family <select id="family"><option>prototype</option><option>baseline</option></select></label>
    <label>Palette <select id="palette"><option>meadow</option><option>woodland</option></select></label>
    <label>Camera <select id="view"><option>close</option><option>mid</option><option>wide</option></select></label>
  </div>
  <p id="metrics">Awaiting first frame...</p>
  <small>Clumps at near camera: ${family === 'prototype' ? GRASS_R01_NAMES.join(' / ') : 'Original variants 0–3 (short / tall / seed-head / sedge)'}.<br>
  Fixed seed 55101 · path/rocks as temporary test props · no wind · no production changes.<br>
  Compare matched family URLs; use ?multidraw=0 for fallback or ?shadows=1 for shadow stress.</small>`;
for (const k of ['family', 'palette', 'view'] as const) {
  const el = document.getElementById(k) as HTMLSelectElement;
  el.value = k === 'family' ? family : k === 'palette' ? palette : view;
  el.addEventListener('change', () => nextUrl(k, el.value));
}
const metrics = document.getElementById('metrics')!;
let last = performance.now(), interval = 0, elapsed = 0, frames = 0;
function animate(now: number) {
  interval += now - last;
  last = now;
  frames++; elapsed++;
  renderer.render(scene, camera);
  if (interval > 600) {
    const fps = Math.round(1000 * frames / interval);
    const inf = renderer.info.render;
    metrics.textContent = `Path: ${vegPathLabel()} | Clumps: ${clumpCount} | Camera triangles: ${inf.triangles.toLocaleString()} | Draw calls: ${inf.calls} | Approx. browser FPS: ${fps} | DPR: ${renderer.getPixelRatio()} | Shadows: ${shadows}`;
    frames = 0; interval = 0;
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
