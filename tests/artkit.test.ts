// Art-refresh kit: the Batcher must keep authored vertex colours and normals only when a geometry opts in,
// so every existing builder renders exactly as before; shaped helpers must produce sane, closed geometry.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Batcher } from '../src/world/kit';
import { softBox, cushion, lathe, moulding, projectUV, bake } from '../src/world/artkit';

const mat = new THREE.MeshLambertMaterial();
const build = (b: Batcher) => { const g = new THREE.Group(); const meshes = b.build(g); return meshes[0].geometry as THREE.BufferGeometry; };

describe('Batcher colour handling', () => {
  it('without keepColor, a part keeps the original behaviour: uniform tint (± jitter), incoming colours ignored', () => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(0.1), 3));
    const b = new Batcher();
    b.add(mat, g, new THREE.Matrix4(), '#ffffff', 'c', true, 0);
    const col = build(b).attributes.color.array as Float32Array;
    expect(Math.min(...col)).toBeCloseTo(1, 5);
  });
  it('with keepColor, authored colours are multiplied by the tint and survive merging', () => {
    const g = bake(new THREE.BoxGeometry(1, 1, 1), (p) => (p.y < 0 ? 0.5 : 1));
    const b = new Batcher();
    b.add(mat, g, new THREE.Matrix4().makeTranslation(3, 0, 0), '#808080', 'c', true, 0);
    const out = build(b);
    const col = out.attributes.color.array as Float32Array, pos = out.attributes.position.array as Float32Array;
    const tint = new THREE.Color('#808080').r;
    for (let i = 0; i < pos.length / 3; i++) expect(col[i * 3]).toBeCloseTo(tint * (pos[i * 3 + 1] < 0 ? 0.5 : 1), 5);
  });
  it('normals are transformed with the part (rotation), not recomputed', () => {
    const g = new THREE.PlaneGeometry(1, 1); // normal +z
    const b = new Batcher();
    b.add(mat, g, new THREE.Matrix4().makeRotationY(Math.PI / 2), '#ffffff', 'c', true, 0);
    const n = build(b).attributes.normal;
    for (let i = 0; i < n.count; i++) { expect(n.getX(i)).toBeCloseTo(1, 5); expect(n.getZ(i)).toBeCloseTo(0, 5); }
  });
});

describe('shaped geometry helpers', () => {
  it('softBox keeps its bounds, has smooth unit normals and no NaNs', () => {
    const g = softBox(0.8, 0.3, 0.6, 0.05);
    g.computeBoundingBox();
    const s = g.boundingBox!.getSize(new THREE.Vector3());
    expect(s.x).toBeCloseTo(0.8, 3); expect(s.y).toBeCloseTo(0.3, 3); expect(s.z).toBeCloseTo(0.6, 3);
    const n = g.attributes.normal;
    for (let i = 0; i < n.count; i++) expect(Math.hypot(n.getX(i), n.getY(i), n.getZ(i))).toBeCloseTo(1, 3);
  });
  it('cushion crowns its top by the requested amount and stays within its footprint', () => {
    const g = cushion(0.5, 0.12, 0.6, 0.04, 0.03);
    g.computeBoundingBox();
    expect(g.boundingBox!.max.y).toBeCloseTo(0.06 + 0.03, 2);
    expect(g.boundingBox!.max.x).toBeLessThanOrEqual(0.25 + 1e-6);
  });
  it('moulding extrudes the profile along x, centred, depth forward (-z)', () => {
    const g = moulding([[0, 0], [0.02, 0], [0.02, 0.15], [0, 0.15]], 2);
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    expect(bb.min.x).toBeCloseTo(-1, 4); expect(bb.max.x).toBeCloseTo(1, 4);
    expect(bb.min.z).toBeCloseTo(-0.02, 4); expect(bb.max.z).toBeCloseTo(0, 4);
    expect(bb.max.y).toBeCloseTo(0.15, 4);
  });
  it('projectUV maps the grain axis to U on the faces that contain it', () => {
    const g = projectUV(new THREE.BoxGeometry(2, 0.1, 0.1).toNonIndexed(), 1, 'x');
    const uv = g.attributes.uv, p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) if (Math.abs(n.getY(i)) > 0.9) expect(uv.getX(i)).toBeCloseTo(p.getX(i), 5);
  });
  it('lathe profiles produce closed turned forms', () => {
    const g = lathe([[0, 0], [0.05, 0], [0.03, 0.1], [0, 0.1]], 12);
    expect(g.attributes.position.count).toBeGreaterThan(40);
  });
});
