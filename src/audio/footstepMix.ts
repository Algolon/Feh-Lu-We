// Small mix-only calibration for movement Foley (no change to source audio,
// gait, the master bus or other SFX). Values are relative gain corrections in dB,
// NOT measured final LUFS: synthetic filtered-noise and recorded field samples
// have very different RMS/peak envelopes. Tune these after device listening.
//
// Stone covers tiled interiors AND the outdoor terrace; wood covers the other
// interior floors and the wellness deck. The grass and dirt recordings are hot
// versus the procedural indoor steps, so lift indoor and attenuate outdoor.
import type { FootstepSurface } from './footsteps';

export const FOOTSTEP_MIX_DB: Readonly<Record<FootstepSurface, number>> = {
  grass: -5,
  dirt: -5,
  wood: 7,
  stone: 9,
};

/** Linear gain: e.g. -6.02 dB = half amplitude, +6.02 dB = double. */
export function footstepMixGain(surface: FootstepSurface): number {
  return 10 ** (FOOTSTEP_MIX_DB[surface] / 20);
}
