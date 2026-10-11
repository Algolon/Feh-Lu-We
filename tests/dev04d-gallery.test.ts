// DEV-04D2: the asymmetrical salon gallery wall (src/content/gallery.ts) against the owner's composition brief.
// Pure layout checks; the world checks (registered footprints, no conflicts, budgets) run in scripts/e2e-dev04d.mjs.
import { describe, it, expect } from 'vitest';
import { SALON_LAYOUT, SALON_SITES, frameBox } from '../src/content/gallery';
import { ART } from '../src/content/art';

const boxes = SALON_LAYOUT.map(frameBox);
const gapBetween = (a: ReturnType<typeof frameBox>, b: ReturnType<typeof frameBox>) => {
  const du = Math.max(a.u0 - b.u1, b.u0 - a.u1, 0), dv = Math.max(a.v0 - b.v1, b.v0 - a.v1, 0);
  return Math.hypot(du, dv);
};
const overlap = (a: ReturnType<typeof frameBox>, b: ReturnType<typeof frameBox>) => Math.min(a.u1, b.u1) - Math.max(a.u0, b.u0) > 1e-6 && Math.min(a.v1, b.v1) - Math.max(a.v0, b.v0) > 1e-6;

describe('DEV-04D2 salon gallery wall', () => {
  it('uses 14–16 existing, shippable FLW-D2 pieces (duplicates allowed), each at its source aspect ratio', () => {
    expect(SALON_LAYOUT.length).toBeGreaterThanOrEqual(14);
    expect(SALON_LAYOUT.length).toBeLessThanOrEqual(16);
    for (const b of boxes) {
      expect(ART[b.f.id], b.f.id).toBeTruthy();
      expect(b.f.cw / b.ch).toBeCloseTo(ART[b.f.id].w / ART[b.f.id].h, 6);
    }
  });
  it('no two frames overlap; nearest-neighbour gaps 3–12 cm, averaging 4–8 cm', () => {
    const nn: number[] = [];
    boxes.forEach((a, i) => {
      let best = Infinity;
      boxes.forEach((b, j) => { if (i === j) return; expect(overlap(a, b), `${i}~${j}`).toBe(false); best = Math.min(best, gapBetween(a, b)); });
      nn.push(best);
    });
    for (const [i, g] of nn.entries()) { expect(g, `frame ${i}`).toBeGreaterThanOrEqual(0.03); expect(g, `frame ${i}`).toBeLessThanOrEqual(0.12); }
    const mean = nn.reduce((s, g) => s + g, 0) / nn.length;
    expect(mean).toBeGreaterThanOrEqual(0.04);
    expect(mean).toBeLessThanOrEqual(0.08);
  });
  it('has two large anchors, one central and one to the right, larger than every other frame', () => {
    const area = boxes.map((b) => b.w * b.h), order = [...area.keys()].sort((p, q) => area[q] - area[p]);
    const [a1, a2] = [boxes[order[0]], boxes[order[1]]];
    const uMin = Math.min(...boxes.map((b) => b.u0)), uMax = Math.max(...boxes.map((b) => b.u1)), mid = (uMin + uMax) / 2;
    const centre = [a1, a2].find((b) => Math.abs(b.uc - mid) < 0.4), right = [a1, a2].find((b) => b.uc > mid + 0.6);
    expect(centre, 'central anchor').toBeTruthy();
    expect(right, 'right anchor').toBeTruthy();
    expect(area[order[1]] / area[order[2]]).toBeGreaterThan(1.4); // clearly bigger than the medium pieces
  });
  it('mixes portrait, landscape and square formats and black, light-wood and off-white frames; not a grid', () => {
    const fmt = new Set(boxes.map((b) => (Math.abs(b.f.cw - b.ch) < 0.01 ? 'square' : b.f.cw > b.ch ? 'landscape' : 'portrait')));
    expect([...fmt].sort()).toEqual(['landscape', 'portrait', 'square']);
    expect(new Set(SALON_LAYOUT.map((f) => f.finish)).size).toBe(3);
    // irregular contour: frame tops and bottoms do not line up in a few rows
    expect(new Set(boxes.map((b) => b.v1.toFixed(2))).size).toBeGreaterThanOrEqual(10);
    expect(new Set(boxes.map((b) => b.v0.toFixed(2))).size).toBeGreaterThanOrEqual(10);
  });
  it('fits its site: under the study ceiling (2.85 m) with ≥ 15 cm to spare, bottom above the reading-chair back', () => {
    const top = Math.max(...boxes.map((b) => b.v1)), bottom = Math.min(...boxes.map((b) => b.v0));
    for (const s of SALON_SITES) {
      expect(s.y + top).toBeLessThanOrEqual(3.35 + 2.85 - 0.15);
      expect(s.y + bottom - 3.35).toBeGreaterThanOrEqual(0.95);
    }
  });
});
