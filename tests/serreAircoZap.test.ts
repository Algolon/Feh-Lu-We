import { describe, expect, it, vi } from 'vitest';
import { Audio } from '../src/audio/audio';
import {
  SERRE_AIRCO_ZAP_CYCLE,
  serreAircoZapPulse,
  serreAircoZapGain,
} from '../src/world/serreAirco';

describe('serre beetle shock AV sync', () => {
  it('uses the original two brief lightning windows for sound triggers', () => {
    expect(SERRE_AIRCO_ZAP_CYCLE).toBe(2.5);
    expect(serreAircoZapPulse(0.1)).toBe(1);
    expect(serreAircoZapPulse(0.22)).toBe(0);
    expect(serreAircoZapPulse(0.3)).toBe(0);
    expect(serreAircoZapPulse(0.36)).toBe(2);
    expect(serreAircoZapPulse(0.48)).toBe(0);
    expect(serreAircoZapPulse(1.9)).toBe(0);
    expect(serreAircoZapPulse(2.6)).toBe(1);
    expect(serreAircoZapPulse(0.1, true)).toBe(0); // static lightning, no looping audio
  });

  it('fades to silence before the player reaches the long-distance culling range', () => {
    expect(serreAircoZapGain(0)).toBe(1);
    expect(serreAircoZapGain(1.5)).toBe(1);
    expect(serreAircoZapGain(5)).toBeCloseTo(0.5);
    expect(serreAircoZapGain(8.5)).toBe(0);
    expect(serreAircoZapGain(15)).toBe(0);
  });

  it('synthesizes a short layered zap only when sound is enabled', () => {
    const audio = new Audio();
    const noise = vi.fn(), tone = vi.fn();
    Object.defineProperty(audio, 'ready', { get: () => true });
    const stub = audio as unknown as { noise: typeof noise; tone: typeof tone };
    stub.noise = noise;
    stub.tone = tone;
    audio.sfx('electric-zap', 'grass', 0.5);
    expect(noise).toHaveBeenCalledTimes(2);
    expect(tone).toHaveBeenCalledTimes(2);
    expect(noise.mock.calls[0][4]).toBeCloseTo(0.09);
    expect(noise.mock.calls[0][0]).toBeLessThan(0.22);
    noise.mockClear(); tone.mockClear();
    audio.setMuted(true);
    audio.sfx('electric-zap', 'grass', 1);
    expect(noise).not.toHaveBeenCalled();
    expect(tone).not.toHaveBeenCalled();
  });
});
