import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { LightPool, type LampSource, type LightView } from '../src/interactions/world';
import { RoomGraph } from '../src/world/rooms';

// Regression for the real-phone footage: in a stationary room, rotating towards
// an already-lit sconce made the walls substantially brighter after ~2 seconds.
// LIGHT-R03's 2-point dwell bonus could defeat its 2.3-point incumbent margin.
const graph = new RoomGraph([
  { id: 'hall', name: 'Hall', floor: 'g', x0: -1, x1: 7, z0: 0, z1: 4, y0: 0, y1: 4 },
], []);
const lamp = (id: string, x: number): LampSource => ({
  id, room: 'hall', pos: new THREE.Vector3(x, 1.8, -2),
  color: 0xffb780, intensity: 8, distance: 9, on: () => true,
});
const lamps = [lamp('existing-hall-light', 0.2), lamp('watched-sconce', 4.2)];
const eye = (x: number) => new THREE.Vector3(x, 1.8, -2);
const view = (direction: 1 | -1, blocked: LightView['blocked'] = () => false): LightView => ({
  dir: new THREE.Vector3(direction, 0, 0), cosHalf: 0.95, blocked,
});
const run = (pool: LightPool, x: number, frames: number, v?: LightView) => {
  for (let frame = 0; frame < frames; frame++) {
    pool.update(0.05, frame * 0.05, lamps, eye(x), graph, () => true, v);
  }
};

describe('LIGHT-R04: gaze-invariant physical illumination', () => {
  it('does not make a stationary room brighter after staring at a near-tie fixture', () => {
    const pool = new LightPool(new THREE.Scene(), 1);
    run(pool, 0.8, 40, view(-1)); // establishes a real incumbent
    expect(pool.assigned()).toEqual(['existing-hall-light']);

    // B is ~1m closer here, but still inside the 2.3m swap hysteresis.
    // In R03 it displaced A solely due to 2s of attention, despite no movement.
    run(pool, 2.7, 60, view(1));
    const before = pool.lights[0].intensity;
    run(pool, 2.7, 80, view(1));
    expect(pool.assigned()).toEqual(['existing-hall-light']);
    expect(Math.abs(pool.lights[0].intensity - before)).toBeLessThan(0.05);
    run(pool, 2.7, 50, view(-1));
    expect(pool.assigned()).toEqual(['existing-hall-light']);
  });

  it('never queries the camera cone or look-dependent line-of-sight for ranking', () => {
    const pool = new LightPool(new THREE.Scene(), 1);
    const blocked = () => { throw Error('Camera LOS must not govern illumination'); };
    run(pool, 0.8, 15, view(1, blocked));
    expect(pool.assigned()).toEqual(['existing-hall-light']);
  });

  it('still transfers a limited light slot when the player walks several meters', () => {
    const pool = new LightPool(new THREE.Scene(), 1);
    run(pool, 0.8, 40, view(-1));
    expect(pool.assigned()).toEqual(['existing-hall-light']);
    const before = pool.lights[0].intensity;
    run(pool, 3.9, 1, view(-1));
    expect(before - pool.lights[0].intensity).toBeLessThan(1.0);
    run(pool, 3.9, 90, view(-1));
    expect(pool.assigned()).toEqual(['watched-sconce']);
    expect(pool.lights[0].intensity).toBeGreaterThan(7);
    expect(pool.lights).toHaveLength(1); // same low/mobile light budget
  });
});
