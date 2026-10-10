// Sky dome, sun, hemisphere fill and fog. A single `dusk` value (0 = golden afternoon, 1 = evening)
// is driven by puzzle progress so the mood slowly shifts from warm familiarity to gentle unease.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import { ART } from '../core/artflags';
import { woodWeight } from './boslustZone';

// DEV-04C ART-01.1 light hierarchy (warm shelter, cool woodland, atmospheric depth):
//   - outdoors the sun stays warm while the sky fill is cooler and a little weaker, so shadow-facing planes go cool;
//   - a real aerial perspective: the haze starts nearer and is denser, and the sky's horizon is the haze colour, so
//     distant woodland dissolves into the sky as large value shapes instead of staying a saturated cut-out;
//   - the woodland is cooler, greener and hazier still (woodWeight, as before);
//   - indoors the un-shadowed sun and the flat fill are pulled back (on low quality there are no shadow maps, so the
//     sun used to light every room as if it had no walls) and the fixtures / fires carry more of the light.
const A = {
  zenith: new THREE.Color('#7fa3c6'), horizon: new THREE.Color('#e6d8c0'), sun: new THREE.Color('#ffe9c4'),
  hemiSky: new THREE.Color('#cbd9ea'), hemiGround: new THREE.Color('#6c5b40'), fog: new THREE.Color('#dfd6c0'),
};
/** Interior treatment (ART.light === 'sample', the production default): a soft window sky above and a warm floor
 * bounce below (a vertical gradient that models cushions and mouldings without shadow maps), much less flat fill and
 * sun, and stronger fixture light (LightPool.gain, see Game.tick). DEV-04C: warmer and more contained than DEV-03. */
const IN = { sky: new THREE.Color('#ece3d4'), bounce: new THREE.Color('#8c6a48') };
/** Woodland treatment (woodWeight, estate-wide since DEV-03): a cooler, greener haze that starts nearer (layered depth:
 * warm foreground, cool distance), a cooler sky fill and a warmer earth bounce. DEV-04C: denser and cooler. */
const WOOD = { fog: new THREE.Color('#a9b8ae'), sky: new THREE.Color('#bccfdc'), earth: new THREE.Color('#665438'), sun: new THREE.Color('#ffe6bc') };
const D = {
  zenith: new THREE.Color('#4a5a92'), horizon: new THREE.Color('#e8a07a'), sun: new THREE.Color('#ffa868'),
  hemiSky: new THREE.Color('#aeb0cc'), hemiGround: new THREE.Color('#544634'), fog: new THREE.Color('#b8988a'),
};
/** Haze ranges (m): open estate, woodland, interiors (interiors keep their far wall clear). */
export const HAZE = { open: [16, 165], wood: [7, 102], inside: [40, 220] } as const;

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
  w.scene.fog = new THREE.Fog(A.fog.clone(), HAZE.open[0], HAZE.open[1]); // vegetation chunks are culled beyond ~105 m (World.VEG_FAR): the haze hides the edge

  const tmp = new THREE.Vector3();
  return {
    sun, hemi,
    update(dusk, focus, indoor = 0) {
      const t = Math.min(1, Math.max(0, dusk));
      const k = ART.light === 'sample' ? Math.min(1, Math.max(0, indoor)) : 0;
      const kw = ART.light === 'sample' && ART.ext === 'sample' ? woodWeight(focus.x, -focus.z) * (1 - k) * (1 - t * 0.5) : 0;
      const fog = w.scene.fog as THREE.Fog;
      fog.color.lerpColors(A.fog, D.fog, t).lerp(WOOD.fog, 0.7 * kw);
      uni.uZenith.value.lerpColors(A.zenith, D.zenith, t);
      // the horizon IS the haze (distance dissolves into the sky), a touch lighter so the sky still glows
      uni.uHorizon.value.lerpColors(A.horizon, D.horizon, t).lerp(fog.color, 0.55 + 0.25 * kw);
      uni.uSunCol.value.lerpColors(A.sun, D.sun, t);
      sun.color.lerpColors(A.sun, D.sun, t).lerp(WOOD.sun, 0.5 * kw);
      sun.intensity = (2.55 - 1.05 * t) * (1 - 0.5 * k) * (1 - 0.14 * kw); // under the canopy the sun is broken up (no shadow maps on low)
      hemi.color.lerpColors(A.hemiSky, D.hemiSky, t).lerp(IN.sky, 0.7 * k).lerp(WOOD.sky, 0.5 * kw);
      hemi.groundColor.lerpColors(A.hemiGround, D.hemiGround, t).lerp(IN.bounce, 0.7 * k).lerp(WOOD.earth, 0.5 * kw);
      hemi.intensity = (1.5 - 0.4 * t) * (1 - 0.38 * k) * (1 - 0.08 * kw);
      const near = HAZE.open[0] + (HAZE.wood[0] - HAZE.open[0]) * kw, far = HAZE.open[1] + (HAZE.wood[1] - HAZE.open[1]) * kw;
      fog.near = near + (HAZE.inside[0] - near) * k; fog.far = far + (HAZE.inside[1] - far) * k;
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
