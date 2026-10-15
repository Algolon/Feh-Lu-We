import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
vi.mock('../src/world/artkit', async (original) => {
  const actual = await original<typeof import('../src/world/artkit')>();
  const paint = new THREE.MeshLambertMaterial(), brass = new THREE.MeshPhongMaterial();
  return { ...actual, artMats: () => ({ paint, brass }) };
});
import { parkedCar } from '../src/world/cars';
import type { Ctx } from '../src/world/arch';
describe('parked car geometry', () => {
  for (const id of ['car.1', 'car.2', 'car.3', 'car.4']) it(`${id}: open wheel wells and bounded geometry`, () => {
    let tris = 0, shell: THREE.BufferGeometry | undefined;
    const b = { add(_m: unknown, g: THREE.BufferGeometry) {
      shell ??= g.clone();
      tris += (g.index?.count ?? g.attributes.position.count) / 3;
      expect(Array.from(g.attributes.position.array).every(Number.isFinite)).toBe(true);
    } };
    parkedCar({ b } as unknown as Ctx, id, 0, 0, '#5a6f8a');
    const mesh = new THREE.Mesh(shell!, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    mesh.updateMatrixWorld();
    const axle = (id === 'car.3' ? 3.95 : 4.3) / 2 - 0.78;
    for (const z of [-axle, axle]) {
      const ray = new THREE.Raycaster(new THREE.Vector3(2, 0.51, z), new THREE.Vector3(-1, 0, 0));
      expect(ray.intersectObject(mesh)).toHaveLength(0);
    }
    expect(tris).toBeLessThan(10000);
    console.log(id, tris, 'triangles');
  });
});
