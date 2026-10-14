import { describe, expect, it } from 'vitest';
import { COMPASS_DIRECTIONS, normalizeHeading } from './compass';

describe('minimal compass heading', () => {
  it('uses the estate plan orientation: north=0, east=90, south=180, west=270', () => {
    expect(normalizeHeading(0)).toBe(0);
    expect(normalizeHeading(Math.PI / 2)).toBeCloseTo(90);
    expect(normalizeHeading(Math.PI)).toBeCloseTo(180);
    expect(normalizeHeading(-Math.PI / 2)).toBeCloseTo(270);
  });
  it('wraps negative rotations and multiple turns without losing direction', () => {
    expect(normalizeHeading(-2 * Math.PI)).toBe(0);
    expect(normalizeHeading(5 * Math.PI / 2)).toBeCloseTo(90);
    expect(normalizeHeading(Number.NaN)).toBe(0);
    expect(COMPASS_DIRECTIONS).toEqual(['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW']);
  });
});
