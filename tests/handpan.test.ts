import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  HANDPAN as P, HANDPAN_HEIGHT, bottomDrop, bottomShellGeometry, legGeometry, legPath, padContact, rimGeometry, toneFields, topRise, topShellGeometry,
} from '../src/world/handpan';

const tris = (g: THREE.BufferGeometry) => (g.index ? g.index.count : g.attributes.position.count) / 3;
const legs = Array.from({ length: P.legs }, (_, i) => legGeometry(Math.PI / 4 + (i * Math.PI) / 2, 35 + i * 7));
/** Height of the bottom shell's outer surface above the floor at plan radius r (null outside the instrument). */
const shellUnder = (r: number) => (r < P.R ? P.rimY + bottomDrop(r) : null);

describe('handpan asset 01 — instrument', () => {
  it('has a lenticular top shell that meets the seam and keeps every face pointing up', () => {
    expect(topRise(0)).toBeCloseTo(P.top, 6);
    expect(topRise(P.R)).toBe(0);
    const g = topShellGeometry().toNonIndexed();
    const p = g.attributes.position, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    let down = 0, maxY = -1, minY = 1;
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      if (b.clone().sub(a).cross(c.clone().sub(a)).y <= 0) down++;
      maxY = Math.max(maxY, a.y, b.y, c.y); minY = Math.min(minY, a.y, b.y, c.y);
    }
    expect(down).toBe(0); // no flipped or folded faces (the tone-field displacement stays well-formed)
    expect(minY).toBeGreaterThan(-0.002); // never dips below the seam bead
    expect(maxY).toBeCloseTo(P.top + P.dingH, 2); // the ding crowns the dome
    expect(P.rimY + maxY).toBeCloseTo(HANDPAN_HEIGHT, 2);
  });

  it('lays out eight distinct tone fields around the ding, clear of the ding and the rim, without overlaps', () => {
    const f = toneFields();
    expect(f).toHaveLength(8);
    expect(new Set(f.map((n) => n.rank)).size).toBe(8);
    for (const n of f) {
      expect(n.rho - n.a).toBeGreaterThan(P.dingR + 0.03); // outside the ding and its moat
      expect(n.rho + n.a * 1.3).toBeLessThan(0.255); // inside the seam bead
    }
    // neighbours: the angular gap between ellipses (tangential half-axes along the note ring) stays positive
    const byAz = [...f].sort((x, y) => x.az - y.az);
    for (let i = 0; i < byAz.length; i++) {
      const n = byAz[i], m = byAz[(i + 1) % byAz.length];
      const gap = (Math.PI * 2) / 8 * P.noteRing - n.b - m.b;
      expect(gap).toBeGreaterThan(0.01);
    }
    // the lowest note is the largest; sizes descend with rank
    const bySize = [...f].sort((x, y) => x.rank - y.rank).map((n) => n.a);
    for (let i = 1; i < bySize.length; i++) expect(bySize[i]).toBeLessThan(bySize[i - 1]);
  });

  it('closes the bottom (Gu collar and cap) and hides both shell edges inside the seam bead', () => {
    const b = bottomShellGeometry();
    b.computeBoundingBox();
    expect(b.boundingBox!.max.x).toBeLessThan(0.2625); // the bottom shell ends inside the bead (inner edge 0.256)
    expect(b.boundingBox!.min.y).toBeCloseTo(bottomDrop(P.gu), 3);
    const pts = b.attributes.position;
    let cap = false;
    for (let i = 0; i < pts.count; i++) if (Math.hypot(pts.getX(i), pts.getZ(i)) < 0.01) cap = true;
    expect(cap).toBe(true);
    const rim = rimGeometry();
    rim.computeBoundingBox();
    expect(rim.boundingBox!.min.x).toBeLessThan(-P.R);
    expect(rim.boundingBox!.max.x).toBeGreaterThan(P.R);
  });
});

describe('handpan asset 01 — stand (FLW-S3-035)', () => {
  it('puts the felt pads on the bottom shell, on its tangent plane', () => {
    const k = padContact();
    expect(k.y).toBeCloseTo(P.rimY + bottomDrop(P.padR), 6);
    expect(k.n[1]).toBeLessThan(0); // pointing away from the instrument (down / out)
    expect(k.n[0]).toBeGreaterThan(0);
    expect(Math.hypot(...k.n)).toBeCloseTo(1, 6);
  });

  it('stands on the floor with a 70 cm class height and a footprint inside the 0.3 m collider', () => {
    for (const g of legs) {
      g.computeBoundingBox();
      expect(g.boundingBox!.min.y).toBe(0);
      const p = g.attributes.position;
      let reach = 0;
      for (let i = 0; i < p.count; i++) reach = Math.max(reach, Math.hypot(p.getX(i), p.getZ(i)));
      expect(reach).toBeLessThan(0.3);
    }
    const tip = legPath().at(-1)!;
    expect(tip[1]).toBeGreaterThan(0.62);
    expect(tip[1]).toBeLessThan(0.72);
  });

  it('keeps every leg and the rail clear of the instrument (only the felt touches it)', () => {
    let min = Infinity;
    for (const g of legs) {
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const s = shellUnder(Math.hypot(p.getX(i), p.getZ(i)));
        if (s != null) min = Math.min(min, s - p.getY(i));
      }
    }
    expect(min).toBeGreaterThan(0.006); // ≥ 6 mm under the shell everywhere: the felt bridges the rest
    expect(P.rimY + bottomDrop(P.railR + 0.013) - (P.railY + 0.015)).toBeGreaterThan(0.03);
  });

  it('keeps the legs apart (no crossing members) and inside a mobile triangle budget', () => {
    // the four legs never share space: at every height their centrelines are ≥ 5 cm apart (diagonal neighbours)
    for (const [r] of legPath()) expect(r * Math.SQRT2).toBeGreaterThan(0.05);
    const total = tris(topShellGeometry()) + tris(bottomShellGeometry()) + tris(rimGeometry()) + legs.reduce((s, g) => s + tris(g), 0);
    expect(total).toBeLessThan(10000); // instrument + legs; rail, hub, pegs and pads add ≈ 1.2k
  });
});
