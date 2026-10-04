import { describe, it, expect } from 'vitest';
import { CollisionWorld } from '../src/player/collision';

const R = 0.3, H = 1.7, STEP = 0.4;

describe('collision world', () => {
  it('blocks a wall and slides along it', () => {
    const w = new CollisionWorld();
    w.addBox(10, 10.2, 0, 20, 0, 3);
    const p = { x: 9, y: 0, z: 5 };
    w.move(p, 2, 1, R, H, STEP);
    expect(p.x).toBeLessThanOrEqual(10 - R + 1e-6);
    expect(p.z).toBeCloseTo(6, 5); // slid along
  });
  it('does not tunnel through thin walls at high speed', () => {
    const w = new CollisionWorld();
    w.addBox(10, 10.1, 0, 20, 0, 3);
    const p = { x: 9.5, y: 0, z: 5 };
    w.move(p, 5, 0, R, H, STEP);
    expect(p.x).toBeLessThan(10);
  });
  it('disabled colliders (open doors) let the player through', () => {
    const w = new CollisionWorld();
    const door = w.addBox(10, 10.1, 4, 6, 0, 2.2);
    door.enabled = false;
    const p = { x: 9, y: 0, z: 5 };
    w.move(p, 2, 0, R, H, STEP);
    expect(p.x).toBeCloseTo(11, 5);
  });
  it('colliders on another storey do not block', () => {
    const w = new CollisionWorld();
    w.addBox(10, 10.2, 0, 20, 3.4, 6.4); // upstairs wall
    const p = { x: 9, y: 0, z: 5 };
    w.move(p, 2, 0, R, H, STEP);
    expect(p.x).toBeCloseTo(11, 5);
  });
  it('climbs a ramp to the upper floor and comes back down', () => {
    const w = new CollisionWorld();
    w.addRamp({ minX: 10, maxX: 12, minZ: 10, maxZ: 17, axis: 'z', a: 10, ya: 0.15, b: 17, yb: 3.35 });
    w.addFloor(10, 12, 17, 20, 3.35);
    w.addFloor(5, 15, 5, 10, 0.15);
    const p = { x: 11, y: 0.15, z: 9 };
    for (let i = 0; i < 100; i++) w.move(p, 0, 0.1, R, H, STEP);
    expect(p.y).toBeCloseTo(3.35, 2);
    expect(p.z).toBeGreaterThan(17);
    // walk down: support drops gradually, simulate gravity by snapping to support
    for (let i = 0; i < 100; i++) {
      w.move(p, 0, -0.1, R, H, STEP);
      const s = w.supportHeight(p.x, p.z, p.y, STEP);
      p.y = Math.max(s, p.y - 0.2);
    }
    expect(p.y).toBeCloseTo(0.15, 2);
  });
  it('a raised floor above step height is not used as support from below', () => {
    const w = new CollisionWorld();
    w.addFloor(0, 10, 0, 10, 3.35);
    expect(w.supportHeight(5, 5, 0.15, STEP)).toBe(0);
    expect(w.supportHeight(5, 5, 3.35, STEP)).toBe(3.35);
  });
  it('line of sight is blocked by occluding walls but not by furniture', () => {
    const w = new CollisionWorld();
    w.addBox(5, 5.2, -10, 10, 0, 3, { occludes: true });
    w.addBox(2, 3, -1, 1, 0, 0.8); // table
    expect(w.segmentBlocked(0, 1.6, 0, 8, 1, 0)).toBe(true);
    expect(w.segmentBlocked(0, 1.6, 0, 4, 0.9, 0)).toBe(false);
  });
  it('circle trunks push the player around', () => {
    const w = new CollisionWorld();
    w.addCircle(5, 5, 0.5);
    const p = { x: 5, y: 0, z: 3 };
    w.move(p, 0, 4, R, H, STEP);
    expect(Math.hypot(p.x - 5, p.z - 5)).toBeGreaterThanOrEqual(0.8 - 1e-6);
  });
  it('clamps to estate bounds', () => {
    const w = new CollisionWorld();
    const p = { x: 1, y: 0, z: 1 };
    w.move(p, -5, -5, R, H, STEP);
    expect(p.x).toBeGreaterThanOrEqual(0.6);
    expect(p.z).toBeGreaterThanOrEqual(0.6);
  });
});
