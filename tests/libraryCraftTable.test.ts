import { it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { Batcher } from '../src/world/kit';
import { craftTable, craftGlobe } from '../src/world/libraryCraft';
import { assetWarnings } from '../src/world/artkit';
import type { Ctx } from '../src/world/arch';

// Geometry test uses untextured materials; Canvas generation is exercised by the browser captures.
vi.mock('../src/world/artkit', async (original) => {
  const actual = await original<typeof import('../src/world/artkit')>();
  const T = await import('three');
  const timber = new T.MeshLambertMaterial();
  return { ...actual, artMats: () => ({ timber, brass: timber }) };
});
it('table keeps the tabletop datum, footprint, collider and unobstructed drawer opening', () => {
  const b = new Batcher(),
    addBoxC = vi.fn();
  const ctx = { b, chunk: 'mLib', col: { addBoxC } } as unknown as Ctx;
  const before = assetWarnings.length;
  craftTable(ctx, 0, 0, 0);
  const meshes = b.build(new THREE.Group());
  expect(addBoxC).toHaveBeenCalledWith(0, 0, 1.1, 2.2, 0, 0.81);
  expect(assetWarnings.slice(before)).toEqual([]);
  const bounds = new THREE.Box3();
  for (const m of meshes) {
    m.geometry.computeBoundingBox();
    bounds.union(m.geometry.boundingBox!);
  }
  expect(bounds.min.y).toBeCloseTo(0, 5);
  expect(bounds.max.y).toBeCloseTo(0.81, 5);
  expect(bounds.max.x - bounds.min.x).toBeCloseTo(1.1, 5);
  expect(bounds.max.z - bounds.min.z).toBeCloseTo(2.2, 5);
  // East drawer spans local z ±0.45, y .62–.74; no added frame vertices may occupy its face/travel.
  for (const m of meshes) {
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const inOpening = p.getX(i) > 0.4 && Math.abs(p.getZ(i)) < 0.45 && p.getY(i) > 0.62 && p.getY(i) < 0.74;
      expect(inOpening).toBe(false);
    }
  }
});

it('owner-selected globe has a connected four-leg stand and unchanged collision envelope', () => {
  const b = new Batcher(),
    addCircle = vi.fn();
  const ctx = { b, chunk: 'mLib', col: { addCircle } } as unknown as Ctx;
  const before = assetWarnings.length;
  craftGlobe(ctx, 0, 0, 0, 0, new THREE.MeshLambertMaterial());
  expect(assetWarnings.slice(before)).toEqual([]);
  expect(addCircle).toHaveBeenCalledWith(0, 0, 0.3, 0, 1.25);
  const meshes = b.build(new THREE.Group());
  const bounds = new THREE.Box3();
  let triangles = 0;
  for (const m of meshes) {
    m.geometry.computeBoundingBox();
    bounds.union(m.geometry.boundingBox!);
    triangles += m.geometry.attributes.position.count / 3;
  }
  expect(bounds.min.y).toBeCloseTo(0, 5);
  expect(bounds.max.x).toBeLessThanOrEqual(0.317);
  expect(bounds.max.y).toBeLessThan(1.25);
  expect(triangles).toBeLessThan(10000);
});
