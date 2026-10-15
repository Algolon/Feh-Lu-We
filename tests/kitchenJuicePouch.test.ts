import { describe, expect, it } from 'vitest';
import { pouchPanelGeometry, POUCH_HEIGHT, KITCHEN_SIPPY_JUIZ, KITCHEN_ISLAND_SURFACE_Y, SIPPY_JUIZ_SCALE, SIPPY_JUIZ_LOCAL_FOOT_Y, SIPPY_JUIZ_ACTION, SIPPY_JUIZ_TEXT } from '../src/world/kitchenJuicePouch';
import { GF } from '../src/world/layout';

describe('SippyJuiz flexible foil silhouette', () => {
  it('is a tall, slim, sculpted pouch rather than a box with planar faces', () => {
    const g = pouchPanelGeometry(true);
    const p = g.getAttribute('position');
    g.computeBoundingBox();
    const b = g.boundingBox!;
    expect(b.max.x - b.min.x).toBeGreaterThan(0.18);
    expect(b.max.x - b.min.x).toBeLessThan(0.20);
    expect(b.max.y - b.min.y).toBeGreaterThan(0.33);
    expect((b.max.y - b.min.y) / (b.max.x - b.min.x)).toBeGreaterThan(1.75);
    expect((b.max.y - b.min.y) / (b.max.x - b.min.x)).toBeLessThan(2.0);
    expect(b.max.z - b.min.z).toBeGreaterThan(0.02);
    expect(b.max.z - b.min.z).toBeLessThan(0.05);
    expect(p.count).toBeGreaterThan(200); // multiple curved strips, not two rectangular planes
    g.dispose();
  });
  it('rounds the shoulders, bellies the centre and tucks the lower gusset', () => {
    const g = pouchPanelGeometry(true);
    const p = g.getAttribute('position');
    const cols = 17;
    const at = (row: number, col: number) => [
      p.getX(row * cols + col), p.getY(row * cols + col), p.getZ(row * cols + col),
    ] as const;
    expect(at(6, 8)[2] - at(6, 0)[2]).toBeGreaterThan(0.018);
    expect(at(13, 0)[1]).toBeLessThan(at(13, 8)[1]); // softened upper corners
    expect(at(3, 16)[0]).toBeGreaterThan(at(13, 16)[0]); // broad body, narrow shoulder
    expect(at(0, 16)[0]).toBeLessThan(at(2, 16)[0]); // tucked under a flared base
    expect(at(13, 8)[1]).toBeCloseTo(POUCH_HEIGHT, 4);
    g.dispose();
  });
  it('stands entirely on the stone worktop at two-thirds scale (including the straw)', () => {
    // Regression: forgetting GF = 0.15 sunk much of the previous model into the island.
    expect(KITCHEN_ISLAND_SURFACE_Y).toBeCloseTo(GF + 0.885 + 0.025, 7);
    expect(SIPPY_JUIZ_SCALE).toBeCloseTo(2 / 3, 7);
    expect(KITCHEN_SIPPY_JUIZ.y + SIPPY_JUIZ_SCALE * SIPPY_JUIZ_LOCAL_FOOT_Y)
      .toBeCloseTo(KITCHEN_ISLAND_SURFACE_Y, 7);
    const panel = pouchPanelGeometry(true);
    panel.computeBoundingBox();
    expect(panel.boundingBox!.min.y).toBeCloseTo(SIPPY_JUIZ_LOCAL_FOOT_Y, 5);
    const scaledPouchHeight = (panel.boundingBox!.max.y - panel.boundingBox!.min.y) * SIPPY_JUIZ_SCALE;
    expect(scaledPouchHeight).toBeGreaterThan(0.22);
    expect(scaledPouchHeight).toBeLessThan(0.24);
    panel.dispose();
  });

  it('has a correctly oriented matching back and a right-side kitchen placement', () => {
    const front = pouchPanelGeometry(true), back = pouchPanelGeometry(false);
    const a = front.getAttribute('position'), b = back.getAttribute('position');
    expect(a.count).toBe(b.count);
    for (const i of [0, 8, 16, 6 * 17 + 8, a.count - 1]) {
      expect(a.getX(i)).toBeCloseTo(b.getX(i), 6);
      expect(a.getZ(i)).toBeCloseTo(-b.getZ(i), 6);
    }
    expect(KITCHEN_SIPPY_JUIZ.x).toBeGreaterThan(101.5);
    expect(KITCHEN_SIPPY_JUIZ.x).toBeLessThan(102.2);
    expect(SIPPY_JUIZ_ACTION).toBe('Bekijk drinkpakje');
    expect(SIPPY_JUIZ_TEXT).toBe('Is dit echt de laatste CapriSun?');
    front.dispose(); back.dispose();
  });
});