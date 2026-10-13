// ENV-L01 review palettes. Linear-space THREE.Color interpolation; no exposure grade.
import * as THREE from 'three';
const c = (hex: string) => new THREE.Color(hex);
export const LIGHTING_PHASES = [
  { name: 'Daylight', zenith: c('#809fba'), horizon: c('#d0d9d2'), fog: c('#bdcdc6'),
    sky: c('#d2deea'), earth: c('#8b8067'), sun: c('#fff0d6'), hemi: 1.7, direct: 2.1, elevation: 47, glow: 0.7, fixtures: 1,
    cloudLight: c('#eef0e8'), cloudShade: c('#829eb8'), cloudOpacity: 0.86 },
  { name: 'Golden afternoon', zenith: c('#809ab7'), horizon: c('#dfccb5'), fog: c('#d3c9b7'),
    sky: c('#c9d9ea'), earth: c('#80705b'), sun: c('#ffe2b4'), hemi: 1.55, direct: 2.4, elevation: 24, glow: 0.65, fixtures: 1,
    cloudLight: c('#efddc6'), cloudShade: c('#8b9fb5'), cloudOpacity: 0.84 },
  { name: 'Blue hour', zenith: c('#53677f'), horizon: c('#a098a4'), fog: c('#85959f'),
    sky: c('#bdcee0'), earth: c('#8191a2'), sun: c('#bacddd'), hemi: 2.0, direct: 0, elevation: -4, glow: 0, fixtures: 1.06,
    cloudLight: c('#b3adb9'), cloudShade: c('#64788f'), cloudOpacity: 0.56 },
  { name: 'Late dusk', zenith: c('#26354c'), horizon: c('#656a7d'), fog: c('#697f91'),
    sky: c('#adc3db'), earth: c('#778aa2'), sun: c('#a9bfd7'), hemi: 1.85, direct: 0, elevation: -11, glow: 0, fixtures: 1.12,
    cloudLight: c('#69788d'), cloudShade: c('#35465f'), cloudOpacity: 0.34 },
] as const;
export type PhaseSample = { a: typeof LIGHTING_PHASES[number]; b: typeof LIGHTING_PHASES[number]; blend: number };
/** C1-continuous stops, including finite handling for debug input. Progress semantics remain in game.ts. */
export function sampleLighting(t: number, out: PhaseSample): PhaseSample {
  const x = (Number.isFinite(t) ? THREE.MathUtils.clamp(t, 0, 1) : 0) * 3;
  const i = Math.min(2, Math.floor(x)), f = x - i;
  out.a = LIGHTING_PHASES[i]; out.b = LIGHTING_PHASES[i + 1]; out.blend = f * f * (3 - 2 * f);
  return out;
}
