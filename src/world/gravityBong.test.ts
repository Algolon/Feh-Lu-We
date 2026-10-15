import { describe, expect, it } from 'vitest';
import { GRAVITY_BONG_SCALE, SMOKE_PUFF_COUNT, smokePuffs } from './gravityBong';

describe('gravity bong R03', () => {
  it('uniformly scales the complete prop to two thirds', () => {
    expect(GRAVITY_BONG_SCALE).toBeCloseTo(2 / 3, 8);
  });
  it('creates staggered rise phases for each outlet and offsets the streams', () => {
    const left = smokePuffs('gb3_test_mouth', 0);
    const right = smokePuffs('gb3_test_bowl', 0.27);
    const phases = (g: typeof left) => {
      const uv = g.getAttribute('uv');
      return [...new Set(Array.from({ length: uv.count }, (_, i) => uv.getX(i).toFixed(4)))];
    };
    expect(phases(left)).toHaveLength(SMOKE_PUFF_COUNT);
    expect(phases(right)).toHaveLength(SMOKE_PUFF_COUNT);
    expect(phases(left)).not.toEqual(phases(right));
    expect(left.getAttribute('position').count).toBeGreaterThan(100);
  });
});
