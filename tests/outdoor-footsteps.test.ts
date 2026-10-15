import { describe, expect, it } from 'vitest';
import { renderOutdoorFootstep, selectOutdoorFootstepVariant, selectGrassPitchVariant, GRASS_PITCH_RATIOS } from '../src/audio/footsteps';
import { onOutdoorPath } from '../src/world/pathFootsteps';
import { pathNetwork } from '../src/world/junctions';

describe('outdoor footstep Foley', () => {
  for (const surface of ['grass', 'dirt'] as const) {
    it(`${surface}: short, non-clipping and not silent at mobile sample rates`, () => {
      for (const rate of [24000, 44100, 48000]) {
        const audio = renderOutdoorFootstep(surface, 2, rate);
        expect(audio.length / rate).toBeGreaterThan(0.2);
        expect(audio.length / rate).toBeLessThan(0.32);
        let peak = 0, energy = 0;
        for (const v of audio) { expect(Number.isFinite(v)).toBe(true); peak = Math.max(peak, Math.abs(v)); energy += v * v; }
        expect(peak).toBeLessThan(0.98);
        expect(energy / audio.length).toBeGreaterThan(0.000001);
      }
    });
    it(`${surface}: produces repeatable but distinguishable variants`, () => {
      const a = renderOutdoorFootstep(surface, 0, 44100);
      const b = renderOutdoorFootstep(surface, 1, 44100);
      const c = renderOutdoorFootstep(surface, 0, 44100);
      expect(Array.from(a.slice(0, 32))).toEqual(Array.from(c.slice(0, 32)));
      expect(Array.from(a.slice(0, 32))).not.toEqual(Array.from(b.slice(0, 32)));
    });
  }
});

describe('outdoor path audio classification', () => {
  it('uses the actual drawable path network, not only the driveway', () => {
    const lines = pathNetwork();
    const forest = lines.find((line) => line.kind === 'forest' && line.runs.some((r) => r.rows.length > 4));
    expect(forest).toBeDefined();
    const r = forest!.runs.find((run) => run.rows.length > 4)!;
    const p = r.rows[Math.floor(r.rows.length / 2)];
    expect(onOutdoorPath(p.x, p.z, lines)).toBe(true);
    expect(onOutdoorPath(-200, -200, lines)).toBe(false);
  });
});


describe('recorded footstep clip selection', () => {
  it('plays the first grass recording on every step, even as feet and random draws alternate', () => {
    let previous = -1;
    for (let i = 0; i < 30; i++) {
      const selected = selectOutdoorFootstepVariant('grass', 3, previous, (i % 3) / 3);
      expect(selected).toBe(0);
      previous = selected;
    }
    expect(selectOutdoorFootstepVariant('grass', 1, 0, 0.99)).toBe(0);
  });

  it('preserves dirt clip variation and guards empty banks', () => {
    expect(selectOutdoorFootstepVariant('grass', 0, 0, 0.5)).toBe(-1);
    expect(selectOutdoorFootstepVariant('dirt', 0, 0, 0.5)).toBe(-1);
    expect(selectOutdoorFootstepVariant('dirt', 2, 0, 0.1)).toBe(1);
    expect(selectOutdoorFootstepVariant('dirt', 2, 1, 0.1)).toBe(0);
    expect(selectOutdoorFootstepVariant('dirt', 2, -1, 0.99)).toBe(1);
  });
});

describe('R05 grass pitch-only variety', () => {
  it('offers a one-semitone-down, original, and one-semitone-up palette', () => {
    // Equal temperament: one semitone = 2^(1/12); no new field recordings.
    expect(GRASS_PITCH_RATIOS).toHaveLength(3);
    expect(GRASS_PITCH_RATIOS[0]).toBeCloseTo(2 ** (-1 / 12), 12);
    expect(GRASS_PITCH_RATIOS[1]).toBe(1);
    expect(GRASS_PITCH_RATIOS[2]).toBeCloseTo(2 ** (1 / 12), 12);
  });

  it('selects all three variants randomly on the first step', () => {
    expect(selectGrassPitchVariant(-1, 0.01)).toBe(0);
    expect(selectGrassPitchVariant(-1, 0.4)).toBe(1);
    expect(selectGrassPitchVariant(-1, 0.99)).toBe(2);
  });

  it('never plays the same pitch twice in a row, but can still visit all three', () => {
    for (const previous of [0, 1, 2]) {
      const left = selectGrassPitchVariant(previous, 0);
      const right = selectGrassPitchVariant(previous, 0.999);
      expect(left).not.toBe(previous);
      expect(right).not.toBe(previous);
      expect(left).not.toBe(right);
      expect([0, 1, 2]).toContain(left);
      expect([0, 1, 2]).toContain(right);
    }
    let previous = -1;
    for (let i = 0; i < 120; i++) {
      const next = selectGrassPitchVariant(previous, (i * 0.3677) % 1);
      expect(next).not.toBe(previous);
      previous = next;
    }
  });

  it('still uses only clip 0 for grass and retains the dirt no-repeat selector', () => {
    expect(selectOutdoorFootstepVariant('grass', 3, 2, 0.99)).toBe(0);
    expect(selectOutdoorFootstepVariant('dirt', 2, 0, 0.1)).toBe(1);
    expect(selectOutdoorFootstepVariant('dirt', 2, 1, 0.1)).toBe(0);
    expect(selectGrassPitchVariant(-1, Number.NaN)).toBe(0);
    expect(selectGrassPitchVariant(-1, 1)).toBe(2);
  });
});
