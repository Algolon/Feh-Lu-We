import { afterEach, describe, expect, it, vi } from 'vitest';
import { World, type GameApi } from '../interactions/world';
import { BONG_HIT_BUBBLES, BONG_HIT_WATER_LEVEL, BONG_HIT_BREATH_LEVEL } from '../audio/audio';
import { BONG_ACTION_ID, BONG_ACTION_COOLDOWN_MS, registerGravityBongAction } from './gravityBongInteraction';

afterEach(() => vi.restoreAllMocks());

describe('gravity bong: Neem een hit', () => {
  it('registers one reachable mobile action at the exact garden prop', () => {
    const w = new World('estate');
    registerGravityBongAction(w, { sfx: vi.fn(), toast: vi.fn() } as unknown as GameApi, 81.58, 0.4, 120.56);
    const action = w.byId.get(BONG_ACTION_ID);
    expect(action?.label()).toBe('Neem een hit');
    expect(action?.reach).toBeCloseTo(2.45);
    expect(action?.focus.x).toBeCloseTo(81.58);
    expect(action?.focus.z).toBeCloseTo(-120.56);
    expect(action?.hit).toHaveLength(1);
  });

  it('plays once per hit without saving; throttles rapid taps', () => {
    const w = new World('estate');
    const api = { sfx: vi.fn(), toast: vi.fn(), changed: vi.fn() } as unknown as GameApi;
    const clock = vi.spyOn(Date, 'now').mockReturnValue(12000);
    registerGravityBongAction(w, api, 81.58, 0.4, 120.56);
    const run = w.byId.get(BONG_ACTION_ID)!.run;
    run(); run();
    expect(api.sfx).toHaveBeenCalledTimes(1);
    expect(api.sfx).toHaveBeenCalledWith('bongHit');
    expect(api.toast).toHaveBeenCalledTimes(1);
    expect(api.changed).not.toHaveBeenCalled();
    clock.mockReturnValue(12000 + BONG_ACTION_COOLDOWN_MS + 1);
    run();
    expect(api.sfx).toHaveBeenCalledTimes(2);
  });

  it('uses a brief irregular bubbling pattern without an audio asset', () => {
    expect(BONG_HIT_BUBBLES.length).toBeGreaterThanOrEqual(16);
    expect(BONG_HIT_WATER_LEVEL).toBeGreaterThan(0.12);
    expect(BONG_HIT_WATER_LEVEL).toBeGreaterThan(BONG_HIT_BREATH_LEVEL * 2.5);
    expect(BONG_HIT_BUBBLES.at(-1)).toBeLessThan(2.2);
    const gaps = BONG_HIT_BUBBLES.slice(1).map((t, i) => Math.round((t - BONG_HIT_BUBBLES[i]) * 100));
    expect(new Set(gaps).size).toBeGreaterThan(2);
  });
});
