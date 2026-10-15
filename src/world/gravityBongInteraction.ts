// Optional garden bong vignette. No clue, save or puzzle changes.
import * as THREE from 'three';
import type { World, GameApi } from '../interactions/world';
import { makeAction, place } from '../interactions/props';

export const BONG_ACTION_ID = 'garden.gravityBong.hit';
export const BONG_ACTION_COOLDOWN_MS = 3400;

/** Invisible hitbox covering the actual bong, not the entire table. */
export function registerGravityBongAction(w: World, g: GameApi, x: number, tableY: number, z: number) {
  const anchor = new THREE.Group();
  anchor.name = 'gravity-bong-interaction';
  place(anchor, x, tableY, z);
  w.scene.add(anchor);
  let lastHitAt = -Infinity;
  makeAction(w, {
    id: BONG_ACTION_ID, obj: anchor,
    hit: [0.67, 0.61, 0.46], hitOffset: [0, 0.31, 0],
    reach: 2.45,
    label: () => 'Neem een hit',
    run: () => {
      const now = Date.now();
      if (now - lastHitAt < BONG_ACTION_COOLDOWN_MS) return;
      lastHitAt = now;
      g.sfx('bongHit');
      g.toast('Je neemt een hit. Het water borrelt flink.');
    },
  });
}
