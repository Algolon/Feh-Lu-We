// Sky dome, sun, hemisphere fill and fog. A single `dusk` value (0 = golden afternoon, 1 = evening)
// is driven by puzzle progress so the mood slowly shifts from warm familiarity to gentle unease.
import * as THREE from 'three';
import type { World } from '../interactions/world';

const A = {
  zenith: new THREE.Color('#79a9d8'), horizon: new THREE.Color('#f7dcae'), sun: new THREE.Color('#fff0cf'),
  hemiSky: new THREE.Color('#dbe8f2'), hemiGround: new THREE.Color('#7a6440'), fog: new THREE.Color('#e9d9b6'),
};
const D = {
  zenith: new THREE.Color('#2f3c70'), horizon: new THREE.Color('#ee8e62'), sun: new THREE.Color('#ff9a5c'),
  hemiSky: new THREE.Color('#8a90b8'), hemiGround: new THREE.Color('#4a3a2a'), fog: new THREE.Color('#9a7e78'),
};

export interface Env {
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  update(dusk: number, focus: THREE.Vector3): void;
  setShadows(on: boolean, mapSize: number): void;
}

export function addEnvironment(w: World): Env {
  const uni = {
    uZenith: { value: A.zenith.clone() },
    uHorizon: { value: A.horizon.clone() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunCol: { value: A.sun.clone() },
  };
  const skyMat = w.material(new THREE.ShaderMaterial({
    uniforms: uni,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSunCol; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); float h = clamp(d.y*1.6+0.08,0.0,1.0);
        vec3 c = mix(uHorizon, uZenith, pow(h,0.7));
        float s = max(dot(d, normalize(uSunDir)),0.0);
        c += uSunCol * (pow(s,600.0)*1.5 + pow(s,12.0)*0.35);
        gl_FragColor = vec4(c,1.0);
        #include <colorspace_fragment>
      }`,
  }));
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  w.scene.add(sky);

  const hemi = new THREE.HemisphereLight(A.hemiSky, A.hemiGround, 1.6);
  w.scene.add(hemi);
  const sun = new THREE.DirectionalLight(A.sun, 2.4);
  sun.shadow.camera.left = -28; sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 28; sun.shadow.camera.bottom = -28;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 160;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  w.scene.add(sun);
  w.scene.add(sun.target);
  w.scene.fog = new THREE.Fog(A.fog.clone(), 35, 170);

  const tmp = new THREE.Vector3();
  return {
    sun, hemi,
    update(dusk, focus) {
      const t = Math.min(1, Math.max(0, dusk));
      uni.uZenith.value.lerpColors(A.zenith, D.zenith, t);
      uni.uHorizon.value.lerpColors(A.horizon, D.horizon, t);
      uni.uSunCol.value.lerpColors(A.sun, D.sun, t);
      sun.color.lerpColors(A.sun, D.sun, t);
      sun.intensity = 2.4 - 1.5 * t;
      hemi.color.lerpColors(A.hemiSky, D.hemiSky, t);
      hemi.groundColor.lerpColors(A.hemiGround, D.hemiGround, t);
      hemi.intensity = 1.6 - 0.75 * t;
      (w.scene.fog as THREE.Fog).color.lerpColors(A.fog, D.fog, t);
      // sun sinks in the west-south-west
      const elev = THREE.MathUtils.degToRad(34 - 27 * t);
      const az = THREE.MathUtils.degToRad(245); // plan azimuth clockwise from north
      tmp.set(Math.sin(az) * Math.cos(elev), Math.sin(elev), -Math.cos(az) * Math.cos(elev));
      uni.uSunDir.value.copy(tmp);
      sun.position.copy(focus).addScaledVector(tmp, 70);
      sun.target.position.copy(focus);
      sky.position.copy(focus);
    },
    setShadows(on, mapSize) {
      sun.castShadow = on;
      if (on && sun.shadow.mapSize.x !== mapSize) {
        sun.shadow.mapSize.set(mapSize, mapSize);
        sun.shadow.map?.dispose();
        (sun.shadow as unknown as { map: null }).map = null;
      }
    },
  };
}
