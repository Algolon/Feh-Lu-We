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
export const DEFAULT_TREE_LOD = 'hybrid'; // Owner-authorized live test, 14 October 2026; baseline remains selectable.
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

// ------------------------------------------------------------------------------------------------ VIS-R01 bands
/**
 * Distance bands for one kind of instanced vegetation that is not a tree (first user: the Mushroom Grove).
 * `levels`: geometry switch distances (near→mid, mid→far…), chosen by `selectTreeLod` with `hysteresis`.
 * `exit`: distance at which the instance has shrunk to nothing; it shrinks over the last `fade` metres (as PlantBatch),
 * so nothing appears or vanishes at full size. A starting point for the shared vegetation LOD (VIS-R01C).
 */
export interface VegLodBands { levels: readonly number[]; hysteresis: number; exit: number; fade: number }
/** Fade scale (0 hidden … 1 full) at `distance`, quantised to twelfths: a matrix is rewritten only when its step changes. */
export function rangeFade(distance: number, b: Pick<VegLodBands, 'exit' | 'fade'>) {
  if (distance >= b.exit) return 0;
  return Math.ceil(Math.min(1, (b.exit - distance) / Math.max(1e-6, b.fade)) * 12) / 12;
}
export type GroveCategory = 'hero' | 'medium' | 'nursery';
export interface GroveLodProfile {
  id: string;
  /** Per category, the geometry of each level ('detailed' | 'small' | 'far'; nursery: 'young' | 'youngFar'). */
  geometry: Record<GroveCategory, readonly string[]>;
  bands: Record<GroveCategory, VegLodBands>;
  /** Pools of light and drifting spores (opacity fade), glowing undergrowth (shown within `undergrowth`, ±3 m),
   * all measured from the grove's outline, not its centre. */
  ambient: { full: number; exit: number; undergrowth: number };
}
/**
 * VIS-R01AB experiments. Production (before VIS-R01) drew the whole grove within 65 m of its centre and nothing beyond.
 * a: per-category ranges on the approved geometry, with fades. b: a, plus silhouette-preserving distant geometry.
 */
export const GROVE_LOD_PROFILES: Record<string, GroveLodProfile> = {
  a: {
    id: 'a',
    geometry: { hero: ['detailed'], medium: ['small'], nursery: ['young'] },
    bands: { hero: { levels: [], hysteresis: 3, exit: 125, fade: 20 }, medium: { levels: [], hysteresis: 3, exit: 105, fade: 15 }, nursery: { levels: [], hysteresis: 2, exit: 32, fade: 8 } },
    ambient: { full: 35, exit: 55, undergrowth: 50 },
  },
  b: {
    id: 'b',
    geometry: { hero: ['detailed', 'small', 'far'], medium: ['small', 'far'], nursery: ['young', 'youngFar'] },
    bands: { hero: { levels: [25, 55], hysteresis: 3, exit: 125, fade: 20 }, medium: { levels: [50], hysteresis: 3, exit: 105, fade: 15 }, nursery: { levels: [12], hysteresis: 2, exit: 32, fade: 8 } },
    ambient: { full: 35, exit: 55, undergrowth: 50 },
  },
};
export const DEFAULT_GROVE_LOD = 'b';
export function groveLodProfile(name: string | null = null): GroveLodProfile {
  return GROVE_LOD_PROFILES[name ?? DEFAULT_GROVE_LOD] ?? GROVE_LOD_PROFILES[DEFAULT_GROVE_LOD];
}
const gq = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('grovelod');
export const GROVE_LOD_PROFILE = groveLodProfile(gq);
