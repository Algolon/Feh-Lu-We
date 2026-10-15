// Original, deterministic, sample-based Foley built at runtime from filtered noise.
// Warm pressure and small irregular rustles/crunches replace the old high-pass "hiss".
// No third-party recordings or network loading; buffers are generated once on audio unlock.
export type FootstepSurface = 'grass' | 'dirt' | 'wood' | 'stone';
export type OutdoorFootstepSurface = 'grass' | 'dirt';

const randomFrom = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

/** One close, dry footfall (~240 ms), in mono; inexpensive to reuse as an AudioBuffer. */
export function renderOutdoorFootstep(surface: OutdoorFootstepSurface, variant: number, sampleRate: number): Float32Array {
  const grass = surface === 'grass';
  const seconds = grass ? 0.29 : 0.255;
  const n = Math.ceil(seconds * sampleRate);
  const out = new Float32Array(n);
  const rand = randomFrom(0x45e613 + variant * 7919 + (grass ? 0 : 73531));
  const alpha = (hz: number) => 1 - Math.exp(-2 * Math.PI * hz / sampleRate);
  const aLo = alpha(grass ? 200 : 260);
  const aMid = alpha(grass ? 1100 : 1500);
  const aHi = alpha(4300);
  let low = 0, mid = 0, high = 0;

  // Individual blades under a shoe vs sparse, irregular grains of dirt/gravel.
  const count = grass ? 5 : 9;
  const grains = Array.from({ length: count }, () => ({
    at: 0.025 + rand() * (grass ? 0.185 : 0.145),
    width: 0.005 + rand() * (grass ? 0.013 : 0.009),
    level: 0.35 + rand() * 0.65,
  }));
  const heel = 0.015 + rand() * 0.008;
  const tail = 0.07 + rand() * 0.027;
  const level = 0.91 + rand() * 0.17;

  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const white = rand() * 2 - 1;
    low += (white - low) * aLo;
    mid += (white - mid) * aMid;
    high += (white - high) * aHi;
    const body = Math.min(1, t / heel) * Math.exp(-t / (grass ? 0.082 : 0.072));
    const brush = Math.min(1, t / 0.024) * Math.exp(-Math.max(0, t - 0.034) / tail);
    let texture = 0;
    for (const grain of grains) {
      const u = Math.abs(t - grain.at) / grain.width;
      if (u < 1) texture += (1 - u) * (1 - u) * grain.level;
    }
    // Avoid piercing highs and regular clicks; grass moves softly, paths compress and crunch.
    const sample = grass
      ? low * body * 0.80 + (mid - low) * brush * 0.19 + (high - mid) * texture * 0.045
      : low * body * 0.93 + (mid - low) * (brush * 0.14 + texture * 0.29) + (high - mid) * texture * 0.12;
    out[i] = Math.max(-0.95, Math.min(0.95, sample * level));
  }
  return out;
}

/**
 * Grass intentionally reuses the FIRST approved recorded impact on every footfall.
 * Dirt retains varied clips without immediate repeats. Never alters gait timing.
 */
export function selectOutdoorFootstepVariant(
  surface: OutdoorFootstepSurface, count: number, previous: number, random: number,
): number {
  if (count < 1) return -1;
  if (surface === 'grass') return 0;
  let variant = Math.min(count - 1, Math.max(0, Math.floor(random * count)));
  if (count > 1 && variant === previous) variant = (variant + 1) % count;
  return variant;
}

/**
 * Equal-tempered semitone shifts of the FIRST approved grass take. These only
 * change AudioBufferSource.playbackRate, never the underlying clip or walk cadence.
 * A tiny three-option palette is subtler than adding unrelated, duller samples.
 */
export const GRASS_PITCH_RATIOS = [
  2 ** (-1 / 12),
  1,
  2 ** (1 / 12),
] as const;

/** Select the next of three grass pitches uniformly, without immediate repetition. */
export function selectGrassPitchVariant(previous: number, random: number): number {
  const r = Number.isFinite(random) ? Math.min(1 - Number.EPSILON, Math.max(0, random)) : 0;
  if (!Number.isInteger(previous) || previous < 0 || previous > 2) {
    return Math.floor(r * GRASS_PITCH_RATIOS.length);
  }
  // Choose 0 or 1, then skip the previous index: each *other* pitch has 50% probability.
  const candidate = Math.floor(r * 2);
  return candidate >= previous ? candidate + 1 : candidate;
}
