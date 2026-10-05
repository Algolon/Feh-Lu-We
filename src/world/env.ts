// Sky dome, sun, hemisphere fill and fog. A single `dusk` value (0 = golden afternoon, 1 = evening)
// is driven by puzzle progress so the mood slowly shifts from warm familiarity to gentle unease.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import { ART } from '../core/artflags';

const A = {
  zenith: new THREE.Color('#79a9d8'), horizon: new THREE.Color('#f7dcae'), sun: new THREE.Color('#fff0cf'),
  hemiSky: new THREE.Color('#dbe8f2'), hemiGround: new THREE.Color('#7a6440'), fog: new THREE.Color('#e9d9b6'),
};
/** Art-refresh interior treatment (opt-in: ART.light === 'sample'): a cooler, brighter "window sky" above and a warm
 * floor bounce below (instead of the outdoor earth colour) — a vertical gradient that models cushions and mouldings
 * without shadow maps — plus somewhat less flat fill and stronger fixture light (LightPool.gain, see Game.tick). */
const IN = { sky: new THREE.Color('#e4ebf2'), bounce: new THREE.Color('#857160') };
const D = {
  zenith: new THREE.Color('#4a5a92'), horizon: new THREE.Color('#f29a6a'), sun: new THREE.Color('#ffa868'),
  hemiSky: new THREE.Color('#b8b4cc'), hemiGround: new THREE.Color('#5a4a36'), fog: new THREE.Color('#c09a86'),
};

export interface Env {
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  /** `indoor` 0..1 (smoothed by the game) is used only by the art-refresh interior lighting treatment. */
  update(dusk: number, focus: THREE.Vector3, indoor?: number): void;
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
  w.scene.fog = new THREE.Fog(A.fog.clone(), 30, 125); // vegetation chunks are culled beyond ~105 m (World.VEG_FAR)

  const tmp = new THREE.Vector3();
  return {
    sun, hemi,
    update(dusk, focus, indoor = 0) {
      const t = Math.min(1, Math.max(0, dusk));
      const k = ART.light === 'sample' ? Math.min(1, Math.max(0, indoor)) : 0;
      uni.uZenith.value.lerpColors(A.zenith, D.zenith, t);
      uni.uHorizon.value.lerpColors(A.horizon, D.horizon, t);
      uni.uSunCol.value.lerpColors(A.sun, D.sun, t);
      sun.color.lerpColors(A.sun, D.sun, t);
      sun.intensity = (2.4 - 1.0 * t) * (1 - 0.05 * k); // daylight through the windows keeps its share: direction
      hemi.color.lerpColors(A.hemiSky, D.hemiSky, t).lerp(IN.sky, 0.6 * k);
      hemi.groundColor.lerpColors(A.hemiGround, D.hemiGround, t).lerp(IN.bounce, 0.6 * k);
      hemi.intensity = (1.6 - 0.4 * t) * (1 - 0.28 * k); // less flat fill indoors; top-lit vs warm bounce gradient models form
      (w.scene.fog as THREE.Fog).color.lerpColors(A.fog, D.fog, t);
      // sun sinks in the west-south-west
      const elev = THREE.MathUtils.degToRad(34 - 22 * t);
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
