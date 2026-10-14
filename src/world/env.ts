// Sky dome, sun, hemisphere fill and fog. A single `dusk` value (0 = daylight, 1 = late dusk)
// is driven by puzzle progress so the mood slowly shifts from warm familiarity to gentle unease.
import * as THREE from 'three';
import type { World } from '../interactions/world';
import { ART, REVIEW } from '../core/artflags';
import { woodWeight } from './boslustZone';
import { LIGHTING_PHASES, sampleLighting, type PhaseSample } from './lightingPhases';
import { SKY_FRAGMENT } from './skyShader';

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
  /** Sandbox review controls only. The normal game ignores them. */
  mode: 'baseline' | 'pilot';
  preview: number | null;
  /** Cosmetic cloud switch; never changes world lighting or saved progress. */
  clouds: boolean;
  diagnostic: 'normal' | 'hemi' | 'sun' | 'practicals' | 'no-surfaces' | 'no-fog' | 'no-shadows';
  fixtureGain: number;
  /** `indoor` 0..1 (smoothed by the game) is used only by the art-refresh interior lighting treatment. */
  update(dusk: number, focus: THREE.Vector3, indoor?: number): void;
  setShadows(on: boolean, mapSize: number): void;
}

export function addEnvironment(w: World, lightingReview = REVIEW === 'lighting'): Env {
  const uni = {
    uZenith: { value: A.zenith.clone() },
    uHorizon: { value: A.horizon.clone() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunCol: { value: A.sun.clone() },
    uGlow: { value: 1 },
    uPilot: { value: 0 },
    uCloudLight: { value: new THREE.Color() },
    uCloudShade: { value: new THREE.Color() },
    uCloudOpacity: { value: 0 },
  };
  const skyMat = w.material(new THREE.ShaderMaterial({
    uniforms: uni,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    defines: { ENV_SKY_DETAIL: 1 },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: SKY_FRAGMENT,
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
  const phase: PhaseSample = { a: LIGHTING_PHASES[0], b: LIGHTING_PHASES[1], blend: 0 };
  const skyFill = new THREE.Color(), earthFill = new THREE.Color(), woodFog = new THREE.Color();
  let shadows = false;
  const env: Env = {
    sun, hemi,
    mode: 'pilot', preview: null,
    clouds: typeof location === 'undefined' || new URLSearchParams(location.search).get('clouds') !== '0',
    diagnostic: 'normal', fixtureGain: 1,
    update(dusk, focus, indoor = 0) {
      // Approved four-phase presentation is the ordinary game. Baseline remains review-only.
      const pilot = !lightingReview || env.mode === 'pilot';
      const value = lightingReview && env.preview !== null ? env.preview : dusk;
      const t = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
      const k = ART.light === 'sample' && Number.isFinite(indoor) ? Math.min(1, Math.max(0, indoor)) : 0;
      const fog = w.scene.fog as THREE.Fog;
      if (!pilot) {
        const kw = ART.light === 'sample' && ART.ext === 'sample' ? woodWeight(focus.x, -focus.z) * (1 - k) * (1 - t * 0.5) : 0;
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
      }
      let elevation = 34 - 22 * t;
      uni.uPilot.value = pilot ? 1 : 0; uni.uGlow.value = 1; uni.uCloudOpacity.value = 0; env.fixtureGain = 1;
      if (pilot) {
        const { a, b, blend: f } = sampleLighting(t, phase);
        const mix = (x: number, y: number) => THREE.MathUtils.lerp(x, y, f);
        elevation = mix(a.elevation, b.elevation);
        const visibleSun = THREE.MathUtils.smoothstep(elevation, -0.5, 2);
        // Forest fill stays continuous but is no longer weakened away towards dusk.
        const woodland = ART.light === 'sample' && ART.ext === 'sample' ? woodWeight(focus.x, -focus.z) * (1 - k) : 0;
        const evening = THREE.MathUtils.smoothstep(t, 1 / 3, 2 / 3);
        uni.uZenith.value.lerpColors(a.zenith, b.zenith, f);
        fog.color.lerpColors(a.fog, b.fog, f);
        woodFog.copy(WOOD.fog).lerp(fog.color, evening); // cool sage in daylight, phase haze in evening
        // The old sage anchor was warmer than the new daylight haze. Preserve cooler woodland in every phase.
        woodFog.b = Math.min(1, Math.max(woodFog.b, woodFog.r + fog.color.b - fog.color.r + 0.04));
        fog.color.lerp(woodFog, 0.35 * woodland);
        uni.uHorizon.value.lerpColors(a.horizon, b.horizon, f).lerp(fog.color, 0.7);
        uni.uSunCol.value.lerpColors(a.sun, b.sun, f);
        uni.uGlow.value = mix(a.glow, b.glow) * visibleSun;
        uni.uCloudLight.value.lerpColors(a.cloudLight, b.cloudLight, f);
        uni.uCloudShade.value.lerpColors(a.cloudShade, b.cloudShade, f);
        uni.uCloudOpacity.value = env.clouds ? mix(a.cloudOpacity, b.cloudOpacity) : 0;
        sun.color.lerpColors(a.sun, b.sun, f);
        sun.intensity = mix(a.direct, b.direct) * visibleSun * (1 - 0.5 * k) * (1 - 0.14 * woodland);
        hemi.color.lerpColors(a.sky, b.sky, f);
        hemi.groundColor.lerpColors(a.earth, b.earth, f);
        skyFill.copy(IN.sky).lerp(hemi.color, evening * 0.8);
        earthFill.copy(IN.bounce).lerp(hemi.groundColor, evening * 0.75);
        hemi.color.lerp(WOOD.sky, 0.15 * woodland * (1 - evening)).lerp(skyFill, 0.7 * k);
        hemi.groundColor.lerp(earthFill, 0.7 * k);
        hemi.intensity = mix(a.hemi, b.hemi) * (1 - 0.38 * k) * (1 - 0.04 * woodland);
        const n = HAZE.open[0] + (HAZE.wood[0] - HAZE.open[0]) * woodland;
        const far = HAZE.open[1] + (HAZE.wood[1] - HAZE.open[1]) * woodland;
        fog.near = THREE.MathUtils.lerp(n, HAZE.inside[0], k); fog.far = THREE.MathUtils.lerp(far, HAZE.inside[1], k);
        // Increase practical contrast outdoors only; interior fixture treatment remains the existing ×1.7.
        env.fixtureGain = THREE.MathUtils.lerp(mix(a.fixtures, b.fixtures), 1, k);
      }
      if (lightingReview) {
        if (env.diagnostic === 'hemi') sun.intensity = 0;
        if (env.diagnostic === 'sun') hemi.intensity = 0;
        if (env.diagnostic === 'practicals') { sun.intensity = 0; hemi.intensity = 0; }
        if (env.diagnostic === 'no-fog') { fog.near = 10000; fog.far = 20000; }
      }
      sun.castShadow = shadows && !(lightingReview && env.diagnostic === 'no-shadows') && (!pilot || sun.intensity > 0.001);
      // sun sinks in the west-south-west
      const elev = THREE.MathUtils.degToRad(elevation);
      const az = THREE.MathUtils.degToRad(245); // plan azimuth clockwise from north
      tmp.set(Math.sin(az) * Math.cos(elev), Math.sin(elev), -Math.cos(az) * Math.cos(elev));
      uni.uSunDir.value.copy(tmp);
      sun.position.copy(focus).addScaledVector(tmp, 70);
      sun.target.position.copy(focus);
      sky.position.copy(focus);
    },
    setShadows(on, mapSize) {
      shadows = on;
      sun.castShadow = on;
      if (on && sun.shadow.mapSize.x !== mapSize) {
        sun.shadow.mapSize.set(mapSize, mapSize);
        sun.shadow.map?.dispose();
        (sun.shadow as unknown as { map: null }).map = null;
      }
    },
  };
  return env;
}
