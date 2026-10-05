// The BOSLUST exterior sample area (art-refresh step 3), shared by the world build and the lighting treatment.
import * as THREE from 'three';

/** The sample area: everything the approach shows up close (beyond it the original forest continues). */
export const ZONE = { x0: 38, x1: 88, z0: 0.6, z1: 48 };
export const inZone = (x: number, z: number) => x > ZONE.x0 && x < ZONE.x1 && z > ZONE.z0 && z < ZONE.z1;
/** 0 at the zone edge → 1 a few metres inside (soft transitions for terrain colour, path edges and lighting). */
export const zoneWeight = (x: number, z: number) => {
  const d = Math.min(x - ZONE.x0, ZONE.x1 - x, z - ZONE.z0 + 6, ZONE.z1 - z);
  return THREE.MathUtils.smoothstep(d, 0, 6);
};
