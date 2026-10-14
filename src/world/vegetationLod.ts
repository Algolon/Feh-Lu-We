// VEG-R01: explicit, reproducible tree-only experiments; bushes/placement/ranges stay unchanged.
export interface TreeLodProfile {
  id: string;
  distances: readonly [number, number, number];
  hysteresis: number;
  continuous: boolean | 'outline';
}
export const TREE_LOD_PROFILES: Record<string, TreeLodProfile> = {
  baseline: { id: 'baseline', distances: [16, 26, 48], hysteresis: 3, continuous: false },
  a: { id: 'a', distances: [24, 42, 70], hysteresis: 3, continuous: false },
  b: { id: 'b', distances: [28, 50, 80], hysteresis: 3, continuous: true },
  hybrid: { id: 'hybrid', distances: [22, 36, 62], hysteresis: 3, continuous: 'outline' },
};
export const DEFAULT_TREE_LOD = 'baseline'; // retained until the measured comparison selects a winner
export function treeLodProfile(name: string | null = null): TreeLodProfile {
  return TREE_LOD_PROFILES[name ?? DEFAULT_TREE_LOD] ?? TREE_LOD_PROFILES[DEFAULT_TREE_LOD];
}
const q = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('veglod');
export const TREE_LOD_PROFILE = treeLodProfile(q);

/** Existing symmetric hysteresis. `previous` is the level actually drawn on the preceding update. */
export function selectTreeLod(distance: number, previous: number, thresholds: readonly number[], hysteresis: number) {
  let level = 0;
  while (level < thresholds.length && distance >= thresholds[level] + (previous <= level ? hysteresis : -hysteresis)) level++;
  return level;
}
