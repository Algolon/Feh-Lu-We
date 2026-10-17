import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { World } from '../src/interactions/world';
import { bindStableLiving, stableContributionAt, STABLE_LIVING_PILOT, STABLE_SOURCE_IDS } from '../src/world/stableLighting';

describe('LIGHT-R06 source-bound living-room base light', () => {
  it('does not alter ordinary game rendering without explicit opt-in', () => {
    // Under Vitest there is no browser query parameter.
    expect(STABLE_LIVING_PILOT).toBe(false);
    expect(STABLE_SOURCE_IDS).toEqual(['fire.living','lamp.livingFloor']);
  });
  it('stores logical source status, never camera or LightPool state', () => {
    const scene = new World('estate');
    let hearth = true, floor = false;
    scene.lamps.push(
      { id: 'fire.living', pos: new THREE.Vector3(73.35,.75,-86.7), color: 0xff9a4a, intensity: 7, distance: 8, on: () => hearth },
      { id: 'lamp.livingFloor', pos: new THREE.Vector3(84.2,1.75,-83.6), color: 0xffd49a, intensity: 5, distance: 8, on: () => floor },
    );
    // The test site is opt-in only; production should ignore this registration.
    bindStableLiving(scene);
    expect(scene.scene.userData.stableLiving).toBeUndefined();
    hearth = false; floor = true; scene.syncAll();
    expect(scene.scene.userData.stableLiving).toBeUndefined();
  });
  it('has finite, bounded, room-local contribution independent of player motion', () => {
    const inside = stableContributionAt(75,1,-86.7).toArray();
    const outside = stableContributionAt(94,1,-86.7).toArray();
    expect(inside.every(Number.isFinite)).toBe(true);
    expect(outside.every(x=>x===0)).toBe(true);
    expect(stableContributionAt(75,1,-86.7).toArray()).toEqual(inside);
  });
});
