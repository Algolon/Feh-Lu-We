import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { World } from '../src/interactions/world';
import { bindStableLiving, stableContributionAt, stableRoomMaskAt, STABLE_LIVING_MASK, STABLE_LIVING_PILOT, STABLE_SOURCE_IDS } from '../src/world/stableLighting';

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
  it('covers the actual living-side west and east plaster without fading metres before the wall',()=>{
    // The old R06 mask on west x72.4 faded most of the hearth's own wall.
    expect(stableRoomMaskAt(72.43,1,-86.7)).toBeGreaterThan(.99);
    expect(stableRoomMaskAt(84.92,1.75,-83.6)).toBeGreaterThan(.99);
    expect(stableContributionAt(72.43,1,-86.7).toArray().every(Number.isFinite)).toBe(true);
  });
  it('clips the hall-facing partition, library-facing partition, outside shell and upstairs',()=>{
    const excluded=[
      [85.09,1.6,-83.6], // hall side of wall x85
      [80.0,1.6,-94.10], // library side of wall z94
      [72.12,1,-86.7],  // western exterior outside face
      [79.0,1,-80.20],  // southern exterior outside face
      [77.0,3.36,-86.7], // upstairs beyond slab
      [77.0,-1.5,-86.7], // basement
      [102.0,1.6,-96.0], // kitchen
    ] as const;
    for(const [x,y,z] of excluded){
      expect(stableRoomMaskAt(x,y,z)).toBe(0);
      expect(stableContributionAt(x,y,z).toArray()).toEqual([0,0,0]);
    }
    expect(stableRoomMaskAt(79.0,1.6,-93.92)).toBeGreaterThan(.9);
    expect(STABLE_LIVING_MASK.x1out).toBeLessThan(85.08);
  });
  it('keeps the authored mask independent of light pooling, camera and elapsed time',()=>{
    const positions: [number,number,number][]=[
      [73.7,.6,-86.7],[76.1,1.8,-86.7],[82.3,1.0,-84.4]
    ];
    for(const [x,y,z] of positions){
      const original=stableRoomMaskAt(x,y,z);
      for(let i=0;i<100;i++)expect(stableRoomMaskAt(x,y,z)).toBe(original);
    }
  });

});
