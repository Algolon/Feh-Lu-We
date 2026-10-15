// Audio R04: isolated grass footfalls from the same user-supplied CC0 recording.
// Three distinct single contacts (each 290 ms), not the older 440 ms shuffled walking snippets.
// Edited to remove rumble and trim away secondary scuffles; fades are baked into the MP3.
// 32 kbps mono, bundled in two shards for reliable static delivery; no fetch at runtime.
import { GRASS_R04_A } from './grassR04DataA';
import { GRASS_R04_B } from './grassR04DataB';

export const GRASS_R04_MP3 = GRASS_R04_A + GRASS_R04_B;
export const GRASS_R04_CLIPS: readonly (readonly [number, number])[] = [
  [0.065, 0.290], [0.470, 0.290], [0.875, 0.290],
] as const;

// Exactly 30% quieter than the previous field-recorded dirt footsteps (0.31 => 0.217).
export const DIRT_PATH_GAIN = 0.31 * 0.70;
