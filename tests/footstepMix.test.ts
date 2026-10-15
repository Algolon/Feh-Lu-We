import { describe, expect, it } from 'vitest';
import { FOOTSTEP_MIX_DB, footstepMixGain } from '../src/audio/footstepMix';
import { DIRT_PATH_GAIN } from '../src/audio/grassR04';
import { GRASS_PITCH_RATIOS, selectOutdoorFootstepVariant } from '../src/audio/footsteps';

describe('footstep mix calibration R06', () => {
  it('attenuates recorded grass and dirt by 5 dB without changing their audio assets', () => {
    for (const surface of ['grass', 'dirt'] as const) {
      expect(FOOTSTEP_MIX_DB[surface]).toBe(-5);
      expect(20 * Math.log10(footstepMixGain(surface))).toBeCloseTo(-5, 10);
      expect(footstepMixGain(surface)).toBeCloseTo(0.562341325, 8);
    }
    // R04 dirt reduction stays in place (70% of its preceding version).
    expect(DIRT_PATH_GAIN).toBeCloseTo(0.31 * 0.70, 8);
    expect(DIRT_PATH_GAIN * footstepMixGain('dirt')).toBeCloseTo(0.12202, 4);
    expect(selectOutdoorFootstepVariant('grass', 3, 1, 0.92)).toBe(0);
    expect(GRASS_PITCH_RATIOS).toHaveLength(3);
  });

  it('brings wood interiors up 7 dB and stone interiors/terraces up 9 dB', () => {
    expect(FOOTSTEP_MIX_DB.wood).toBe(7);
    expect(FOOTSTEP_MIX_DB.stone).toBe(9);
    expect(20 * Math.log10(footstepMixGain('wood'))).toBeCloseTo(7, 10);
    expect(20 * Math.log10(footstepMixGain('stone'))).toBeCloseTo(9, 10);
    // Existing procedural oscillator/noise envelopes remain below unity for normal walking steps.
    expect(0.16 * footstepMixGain('wood')).toBeLessThan(0.5);
    expect(0.075 * footstepMixGain('stone')).toBeLessThan(0.3);
  });

  it('narrows indoor-vs-outdoor perceived disparity without touching global sound effects', () => {
    expect(FOOTSTEP_MIX_DB.wood - FOOTSTEP_MIX_DB.dirt).toBe(12);
    expect(FOOTSTEP_MIX_DB.stone - FOOTSTEP_MIX_DB.grass).toBe(14);
    expect(Object.keys(FOOTSTEP_MIX_DB).sort()).toEqual(['dirt', 'grass', 'stone', 'wood']);
    for (const material of ['dirt', 'grass', 'stone', 'wood'] as const) {
      expect(Number.isFinite(footstepMixGain(material))).toBe(true);
      expect(footstepMixGain(material)).toBeGreaterThan(0);
    }
  });
});
