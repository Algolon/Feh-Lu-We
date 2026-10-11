// DEV-04D D3-A2: the manor entrance (src/world/entrance.ts) is visual only. It adds no collider or floor, leaves the
// front doorway clear (the 1.7 m wall opening up to the door head, through the bay recess), keeps the beam datum on
// the column tops, and stays inside a triangle budget for the 'manor' chunk (drawn from every exterior view).
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';

beforeAll(() => {
  const ctx: unknown = new Proxy({}, { get: (_t, k) => (k === 'measureText' ? () => ({ width: 0 }) : () => new Proxy({}, { get: () => () => undefined })), set: () => true });
  (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
});

interface Part { geo: THREE.BufferGeometry; m: THREE.Matrix4 }
async function build() {
  const { buildEntrance, entranceBay } = await import('../src/world/entrance');
  const parts: Part[] = [], col: string[] = [];
  const b = { add: (_mat: unknown, geo: THREE.BufferGeometry, m: THREE.Matrix4) => parts.push({ geo: geo.clone(), m: m.clone() }) };
  const mat = new THREE.MeshLambertMaterial();
  const c = { b, chunk: 'manor', k: { M: { stone: mat, paint: mat, slate: mat } }, col: new Proxy({}, { get: (_t, k) => () => col.push(String(k)) }) };
  buildEntrance(c as never, { x: 90, bayZ: 79.55, colZ: 78.85, colX: [88.1, 91.9], gf: 0.15 });
  entranceBay(c as never, 86.4, 93.6, 79.55, 80.0, [87.375, 92.625], 3.35);
  return { parts, col };
}
const worldBox = (p: Part) => { p.geo.computeBoundingBox(); return p.geo.boundingBox!.clone().applyMatrix4(p.m); };

describe('DEV-04D D3-A2 entrance', () => {
  it('adds no collider or walk surface (the shell keeps the landing floor, the step and the column circles)', async () => {
    const { col } = await build();
    expect(col).toEqual([]);
  });
  it('keeps the doorway clear: nothing inside the 1.7 m opening below the door head, from the bay face to the wall', async () => {
    const { parts } = await build();
    // mesh space has plan z negated: the doorway prism in mesh coordinates
    const door = new THREE.Box3(new THREE.Vector3(89.16, 0.16, -80.0), new THREE.Vector3(90.84, 2.84, -79.6));
    const hits = parts.map(worldBox).filter((bb) => bb.intersectsBox(door) && !(bb.max.y <= 0.151));
    expect(hits.length).toBe(0);
  });
  it('columns carry the beam: the abacus top is at the old beam datum (GF + 2.76)', async () => {
    const { parts } = await build();
    const abaci = parts.map(worldBox).filter((bb) => Math.abs(bb.max.y - (0.15 + 2.76)) < 1e-6 && bb.max.x - bb.min.x < 0.6);
    expect(abaci.length).toBeGreaterThanOrEqual(2);
  });
  it('nothing floats above the canopy: every part is below the bay flashing top', async () => {
    const { parts } = await build();
    const top = Math.max(...parts.map(worldBox).filter((bb) => bb.max.z > -79.6 && bb.min.z < -78.0).map((bb) => bb.max.y)); // portico zone (mesh z = −plan z)
    expect(top).toBeLessThan(0.15 + 2.76 + 0.63 + 0.25);
  });
  it('stays inside its triangle budget (≤ 3 k for the whole entrance)', async () => {
    const { parts } = await build();
    const tris = parts.reduce((n, p) => n + (p.geo.index ? p.geo.index.count : p.geo.attributes.position.count) / 3, 0);
    expect(tris).toBeLessThanOrEqual(3000);
  });
});
