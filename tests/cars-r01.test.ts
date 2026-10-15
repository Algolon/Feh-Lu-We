import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
vi.mock('../src/world/artkit', async (original) => {
  const actual = await original<typeof import('../src/world/artkit')>();
  const paint = new THREE.MeshLambertMaterial(), brass = new THREE.MeshPhongMaterial();
  return { ...actual, artMats: () => ({ paint, brass }) };
});
import { parkedCar, CAR_PROFILES } from '../src/world/cars';
import type { Ctx } from '../src/world/arch';
describe('parked car geometry', () => {
  for (const id of ['car.1', 'car.2', 'car.3', 'car.4']) it(`${id}: open wheel wells and bounded geometry`, () => {
    let tris = 0, shell: THREE.BufferGeometry | undefined;
    const parts: THREE.Mesh[] = [];
    const b = { add(mat: THREE.Material, g: THREE.BufferGeometry, matrix: THREE.Matrix4) {
      const part = new THREE.Mesh(g.clone().applyMatrix4(matrix), mat); part.updateMatrixWorld(); parts.push(part);
      shell ??= g.clone();
      tris += (g.index?.count ?? g.attributes.position.count) / 3;
      expect(Array.from(g.attributes.position.array).every(Number.isFinite)).toBe(true);
    } };
    parkedCar({ b } as unknown as Ctx, id, 0, 0, '#5a6f8a');
    const mesh = new THREE.Mesh(shell!, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    mesh.updateMatrixWorld();
    const profile = CAR_PROFILES[id as keyof typeof CAR_PROFILES];
    const axle = profile.axle;
    for (const z of [-axle, axle]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(2, profile.wheel + 0.15, z), new THREE.Vector3(-1, 0, 0));
      expect(ray.intersectObject(mesh)).toHaveLength(0);
    }
    // A short ray through a window must hit glazing, never an opaque wall backing it.
    const u = 0.15, v = 0.5;
    const half = profile.kind === 'bus' || profile.kind === 'suv' ? 0.81 : 0.77;
    const px = half + (profile.rh - half) * v;
    const pz = (profile.rear + (profile.front - profile.rear) * u) * (1 - v) + (profile.rr + (profile.rf - profile.rr) * u) * v;
    for (const side of [-1, 1]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(side * (px + 0.03), profile.belt + (profile.top - profile.belt) * v, -pz), new THREE.Vector3(-side, 0, 0), 0, 0.06);
      const hits = ray.intersectObjects(parts);
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.every(h => (h.object as THREE.Mesh).material === parts.find(q => (q.material as THREE.Material).transparent)?.material)).toBe(true);
    }
    expect(tris).toBeLessThan(10000);
    for (const part of parts) part.geometry.dispose();
    shell?.dispose();
    console.log(id, tris, 'triangles');
  });
});
