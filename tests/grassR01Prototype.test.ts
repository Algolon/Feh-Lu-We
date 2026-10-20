import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { grassR01Model } from '../src/reviews/grassR01Model';

describe('GRASS-R01 isolated procedural family', () => {
  it('builds four distinct, lightweight, non-indexed, two-sided clumps', () => {
    const counts = new Set<number>();
    const heights = new Set<number>();
    for (let v = 0; v < 4; v++) {
      const geo = grassR01Model(v);
      const pos = geo.getAttribute('position') as THREE.BufferAttribute;
      const color = geo.getAttribute('color') as THREE.BufferAttribute;
      const normal = geo.getAttribute('normal') as THREE.BufferAttribute;
      geo.computeBoundingBox();
      expect(geo.index).toBeNull();
      expect(color.count).toBe(pos.count);
      expect(normal.count).toBe(pos.count);
      expect(pos.count % 3).toBe(0);
      expect(pos.count / 3).toBeLessThan(600);
      expect(geo.boundingBox!.min.y).toBeGreaterThanOrEqual(-0.001);
      expect(geo.boundingBox!.max.y).toBeGreaterThan(0.18);
      for (const n of [pos, normal, color]) for (const x of n.array) expect(Number.isFinite(x)).toBe(true);
      counts.add(pos.count);
      heights.add(Math.round(geo.boundingBox!.max.y * 100));
      geo.dispose();
    }
    expect(counts.size).toBeGreaterThan(1);
    expect(heights.size).toBeGreaterThan(2);
  });

  it('is deterministic and changes palette without altering geometry', () => {
    const a = grassR01Model(1, 'meadow');
    const b = grassR01Model(1, 'meadow');
    const c = grassR01Model(1, 'woodland');
    expect(Array.from(a.getAttribute('position').array)).toEqual(Array.from(b.getAttribute('position').array));
    expect(Array.from(a.getAttribute('position').array)).toEqual(Array.from(c.getAttribute('position').array));
    expect(Array.from(a.getAttribute('color').array)).not.toEqual(Array.from(c.getAttribute('color').array));
    a.dispose(); b.dispose(); c.dispose();
  });
});
