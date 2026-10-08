// The BOSLUST exterior sample area (art-refresh step 3), shared by the world build and the lighting treatment.
// DEV-03: plus the estate-wide woodland weight (the sample's forest floor, path treatment and woodland light now
// apply to the whole south forest and the dense masses, not only to this zone).
import * as THREE from 'three';
import { ESTATE, WOODS, CLEARINGS, PADS } from './layout';

/** The sample area: everything the approach shows up close (beyond it the original forest continues). */
export const ZONE = { x0: 38, x1: 88, z0: 0.6, z1: 48 };
export const inZone = (x: number, z: number) => x > ZONE.x0 && x < ZONE.x1 && z > ZONE.z0 && z < ZONE.z1;
/** 0 at the zone edge → 1 a few metres inside (soft transitions for terrain colour, path edges and lighting). */
export const zoneWeight = (x: number, z: number) => {
  const d = Math.min(x - ZONE.x0, ZONE.x1 - x, z - ZONE.z0 + 6, ZONE.z1 - z);
  return THREE.MathUtils.smoothstep(d, 0, 6);
};

/** Dense woodland masses (gap < 8 m) of the north half; glades and the meadow stay open ground. */
export const DENSE_WOODS = WOODS.filter((w) => w.gap < 8);
/**
 * DEV-03 woodland weight: 1 under the south forest and inside the dense masses, 0 on the lawns, with soft edges; the
 * forest clearings (shed, fire, well, side gate, forecourt) are lighter, grassier pockets. Drives the forest-floor
 * colour, the soft path verge and the cooler woodland light.
 */
export function woodWeight(x: number, z: number) {
  let w = 1 - THREE.MathUtils.smoothstep(z, ESTATE.forestEdge - 7, ESTATE.forestEdge + 1);
  for (const m of DENSE_WOODS) w = Math.max(w, THREE.MathUtils.smoothstep(Math.min(x - m.x0, m.x1 - x, z - m.z0, m.z1 - z), -3, 6));
  for (const c of CLEARINGS) w *= 0.35 + 0.65 * THREE.MathUtils.smoothstep(Math.hypot(x - c.x, z - c.z) - c.r, -3, 3);
  const a = PADS[0]; // the arrival / manor pad stays lawn and gravel
  w *= THREE.MathUtils.smoothstep(Math.max(a.x0 - x, x - a.x1, a.z0 - z, z - a.z1), -1, 5);
  return Math.max(w, zoneWeight(x, z));
}
