import { describe, expect, it } from 'vitest';
import { inExteriorSightCone } from '../src/world/vegetationLod';

// ENT-R02-P1: one transparent upper window must not reveal every outdoor
// plant/rock/deadwood batch in an indoor frame. Preserve a conservative
// silhouette beyond the real, LOS-tested aperture.
describe('ENT-R02-P1 conservative exterior sight cones', () => {
  const south = [{ x: 90, z: 76.8, dx: 0, dz: -1, cos: Math.cos(0.18) }];
  it('keeps all ground detail directly behind the glass', () => {
    for (const [x,z] of [[90,72],[89.6,64],[90.4,70]]) {
      expect(inExteriorSightCone(x,z,0.8,south)).toBe(true);
    }
  });
  it('culls plants outside the actual outdoor cone, even when within their distance range', () => {
    expect(inExteriorSightCone(96,71,0.8,south)).toBe(false);
    expect(inExteriorSightCone(82,72,0.8,south)).toBe(false);
    expect(inExteriorSightCone(90,85,0.8,south)).toBe(false);
  });
  it('tolerates geometry touching the edge of a window view and multiple openings', () => {
    const east = { x: 106, z: 88, dx: 1, dz: 0, cos: Math.cos(0.2) };
    expect(inExteriorSightCone(109,88,0.8,[...south,east])).toBe(true);
    expect(inExteriorSightCone(90,76.8,0.8,south)).toBe(true);
    expect(inExteriorSightCone(110,102,0.8,[...south,east])).toBe(false);
  });
  it('accepts no vegetation when no actual aperture is confirmed', () => {
    expect(inExteriorSightCone(90,72,0.8,[])).toBe(false);
  });
});