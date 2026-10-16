import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { gableTrimGeo } from '../src/world/roofDetail';

describe('continuous gable trim', () => {
  for (const [width, rise, thickness, depth] of [[7.9, 2.7, .26, .12], [2.14, .87, .2, .06]]) {
    it(`closes the apex of the ${width} m gable without a square-end notch`, () => {
      const g = gableTrimGeo(width, rise, thickness, depth);
      const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(g, mat);
      mesh.updateMatrixWorld();
      const slope = rise / (width / 2);
      const tip = thickness / (2 * Math.cos(Math.atan(slope)));
      for (const x of [-.04, -.01, 0, .01, .04]) {
        const ray = new THREE.Raycaster(new THREE.Vector3(x, rise + tip - Math.abs(x)*slope - .005, 1), new THREE.Vector3(0,0,-1));
        expect(ray.intersectObject(mesh).length).toBeGreaterThan(0);
      }
      // The central opening remains open; closing the apex must not fill the whole pediment.
      expect(new THREE.Raycaster(new THREE.Vector3(0, rise/2, 1), new THREE.Vector3(0,0,-1)).intersectObject(mesh)).toHaveLength(0);
      g.computeBoundingBox();
      expect(g.boundingBox!.max.y).toBeCloseTo(rise + tip, 5);
      expect(g.boundingBox!.max.z-g.boundingBox!.min.z).toBeCloseTo(depth, 5);
      g.dispose(); mat.dispose();
    });
  }
});
