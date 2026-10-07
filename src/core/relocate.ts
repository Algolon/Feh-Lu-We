// DEV-02 save compatibility (LEVEL_PLAN v0.2 §10 "Saves en IDs", INTEGRATION_OPEN I08): STATE_VERSION stays 4 and no
// key changes; only a saved POSE can point at a place the v0.2 layout rebuilt. Such poses get a NAMED safe relocation
// (a world checkpoint) instead of silently falling back to the nearest checkpoint. Inventory, flags, slots, hints and
// `finished` are untouched (the pose is the only field read here). Pure (unit-tested).
import type { PlayerPose, SceneId } from './state';
import { LEGACY, UF } from '../world/layout';

export interface Relocation { checkpoint: string; reason: string }

const inBox = (p: PlayerPose, b: { x0: number; x1: number; z0: number; z1: number }) => p.x >= b.x0 && p.x <= b.x1 && p.z >= b.z0 && p.z <= b.z1;

/** Where an old pose must go instead (or null when the pose needs no relocation by rule). */
export function legacyRelocation(scene: SceneId, p: PlayerPose | null | undefined): Relocation | null {
  if (!p || scene !== 'estate') return null;
  // the iteration-3 cottage (X 32–42 / Z 128–136, floor +0.3) and its terrace: the house moved to the plateau
  if (inBox(p, LEGACY.cottage) && p.y < 1.5) return { checkpoint: 'cottage', reason: 'old cottage position' };
  // the old pond became the lake
  if (Math.hypot(p.x - LEGACY.pond.x, p.z - LEGACY.pond.z) < LEGACY.pond.r && p.y < 1.5) return { checkpoint: 'lake', reason: 'old pond position' };
  // the old upstairs storage box (X 95–107.6 / Z 98.6–109.6) is now the attic stair, the guest room and the linen;
  // only the stair part changed its floor (flights, landing), so poses there go to the upper corridor
  if (Math.abs(p.y - UF) < 0.3 && p.x >= 95 && p.x <= 99 && p.z >= 99.8 && p.z <= 105.6) return { checkpoint: 'ucorr', reason: 'old storage room, now the attic stair' };
  return null;
}
