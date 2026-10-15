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

  it('plays a tonal bzzz rather than noise and respects the mute setting', () => {
    const audio = new Audio();
    const noise = vi.fn(), tone = vi.fn(), electricBuzz = vi.fn();
    Object.defineProperty(audio, 'ready', { get: () => true });
    const stub = audio as unknown as {
      noise: typeof noise; tone: typeof tone; electricBuzz: typeof electricBuzz;
    };
    stub.noise = noise;
    stub.tone = tone;
    stub.electricBuzz = electricBuzz;
    audio.sfx('electric-zap', 'grass', 0.5);
    expect(electricBuzz).toHaveBeenCalledExactlyOnceWith(0.5);
    expect(noise).not.toHaveBeenCalled();
    expect(tone).not.toHaveBeenCalled();
    electricBuzz.mockClear();
    audio.setMuted(true);
    audio.sfx('electric-zap', 'grass', 1);
    expect(electricBuzz).not.toHaveBeenCalled();
  });

  it('constructs a harmonically rich WebAudio buzz with a 42Hz flutter, no noise source', () => {
    const audio = new Audio();
    const oscillators: Array<{
      type: OscillatorType;
      frequency: { setValueAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> };
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
    }> = [];
    const filters: { type: string }[] = [];
    const parameter = () => ({
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
    });
    const ctx = {
      state: 'running',
      currentTime: 1.0,
      createGain: () => ({ gain: parameter(), connect: (destination: unknown) => destination }),
      createBiquadFilter: () => {
        const f = { type: 'lowpass', frequency: parameter(), Q: parameter(),
          connect: (destination: unknown) => destination };
        filters.push(f);
        return f;
      },
      createOscillator: () => {
        const o = { type: 'sine' as OscillatorType, frequency: parameter(),
          connect: (destination: unknown) => destination, start: vi.fn(), stop: vi.fn() };
        oscillators.push(o);
        return o;
      },
    };
    const internals = audio as unknown as { ctx: AudioContext; master: GainNode };
    internals.ctx = ctx as unknown as AudioContext;
    internals.master = { gain: parameter() } as unknown as GainNode;
    audio.sfx('electric-zap', 'grass', 1);
    expect(filters).toHaveLength(1);
    expect(filters[0].type).toBe('lowpass');
    expect(oscillators.map((o) => o.type)).toEqual(['square', 'sawtooth', 'square', 'triangle']);
    expect(oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(42, 1);
    for (const o of oscillators) {
      expect(o.start).toHaveBeenCalledWith(1);
      expect(o.stop).toHaveBeenCalledWith(1.15);
    }
  });
});
