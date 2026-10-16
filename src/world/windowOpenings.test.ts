import { describe, expect, it } from 'vitest';
import { opaqueWallRects } from './windowOpenings';
import { PORTALS } from './roomdefs';
import { RoomGraph } from './rooms';

describe('WINDOW-R01 aperture construction', () => {
  const aperture = [{ at: 88, w: 1.1, y0: 1.05, y1: 2.65 }];
  const solidAt = (rects: ReturnType<typeof opaqueWallRects>, x: number, y: number) =>
    rects.some(([x0, x1, y0, y1]) => x > x0 && x < x1 && y > y0 && y < y1);

  it('carves the aperture while preserving side wall, sill and lintel', () => {
    const rects = opaqueWallRects(86, 90, 0, 3.2, aperture);
    expect(solidAt(rects, 88, 1.85)).toBe(false);
    expect(solidAt(rects, 88, 0.8)).toBe(true);
    expect(solidAt(rects, 88, 2.9)).toBe(true);
    expect(solidAt(rects, 86.8, 1.85)).toBe(true);
    expect(solidAt(rects, 89.2, 1.85)).toBe(true);
  });
  it('preserves all legacy opaque walls and nonintersecting floors', () => {
    expect(opaqueWallRects(86, 90, 0, 3.2, [])).toEqual([[86, 90, 0, 3.2]]);
    const upper = opaqueWallRects(87, 89, 2.7, 3.2, aperture);
    expect(upper.length).toBe(3);
    expect(solidAt(upper, 88, 3)).toBe(true);
  });
});
describe('WINDOW-R01 visibility', () => {
  const pilot = PORTALS.find(p => p.a === 'billiard' && p.b === 'out' && p.kind === 'window')!;
  const graph = new RoomGraph([
    { id: 'billiard', name: 'Biljartkamer', floor: 'g', x0: 85, x1: 95, z0: 104, z1: 109.6, y0: 0, y1: 3.2 },
  ], [pilot, { a: 'other', b: 'out', kind: 'window' }]);

  it('keeps clear windows closed unless the sightline predicate explicitly passes', () => {
    expect(graph.visible('out', () => false)).toEqual(new Set(['out']));
    expect(graph.visible('out', () => false, 2, () => true, () => false)).toEqual(new Set(['out']));
    const seen = graph.visible('out', () => false, 2, () => true, () => true);
    expect(seen.has('billiard')).toBe(true);
    expect(seen.has('other')).toBe(false);
    expect(graph.visible('billiard', () => false, 2, () => true, () => true).has('out')).toBe(true);
  });
  it('keeps both glass garden-door portals see-through when closed', () => {
    for (const door of ['door.kitchenBack', 'door.billiardOut'])
      expect(PORTALS.find(p => p.door === door)?.seeThrough).toBe(true);
    expect(pilot).toMatchObject({ seeThrough: true, aperture: {
      x: 88, z: 109.8, width: 1.1, height: 1.6, axis: 'x',
    } });
  });
});
