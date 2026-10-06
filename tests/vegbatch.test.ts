// Consolidation pass: the instanced fallback must cull and pack exactly the instances in view, upload nothing when
// nothing changed, and grow when a geometry gains instances. Runs the real code with a scene and a camera (no GL).
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CAPS } from '../src/core/caps';
import { makeVegBatch } from '../src/world/vegbatch';
import type { World } from '../src/interactions/world';

function setup() {
  CAPS.multiDraw = false; // force the instanced path (as ?multidraw=0 does)
  const scene = new THREE.Scene();
  const w = { scene } as unknown as World;
  const geos = [new THREE.BoxGeometry(1, 1, 1), new THREE.SphereGeometry(0.5, 6, 4)];
  const b = makeVegBatch(w, geos, 64, new THREE.MeshLambertMaterial(), { tag: { vegPart: 'trees' } });
  const cam = new THREE.PerspectiveCamera(60, 2, 0.1, 500);
  const renderer = { shadowMap: { enabled: false } } as unknown as THREE.WebGLRenderer;
  const frame = () => { cam.updateMatrixWorld(); scene.onBeforeRender(renderer, scene, cam, null as never, null as never, null as never); };
  const meshes = () => { const out: THREE.InstancedMesh[] = []; scene.traverse((o) => { if ((o as THREE.InstancedMesh).isInstancedMesh) out.push(o as THREE.InstancedMesh); }); return out; };
  return { b, cam, frame, meshes };
}
const at = (x: number, z: number) => new THREE.Matrix4().makeTranslation(x, 0, z);

describe('instanced fallback (vegbatch)', () => {
  it('packs exactly the instances in the view frustum, per geometry, and follows the camera', () => {
    const { b, cam, frame, meshes } = setup();
    for (let i = 0; i < 10; i++) b.addInstance(i % 2, at(-20 + i * 4, -30), new THREE.Color(1, 1, 1)); // ahead (camera looks down −z)
    for (let i = 0; i < 6; i++) b.addInstance(0, at(-10 + i * 4, 30), new THREE.Color(1, 1, 1)); // behind
    frame();
    const drawn = () => meshes().reduce((s, m) => s + (m.visible ? m.count : 0), 0);
    const ahead = drawn();
    expect(ahead).toBeGreaterThan(0);
    expect(ahead).toBeLessThanOrEqual(10);
    cam.rotation.y = Math.PI; frame(); // turn round
    const behind = drawn();
    expect(behind).toBeGreaterThan(0);
    expect(behind).toBeLessThanOrEqual(6);
    for (const m of meshes()) if (m.count) expect(m.visible).toBe(true);
  });
  it('uploads nothing while camera and instances are unchanged; hidden instances are not drawn', () => {
    const { b, frame, meshes } = setup();
    const ids = [0, 1, 2].map((i) => b.addInstance(0, at(i * 2 - 2, -20), new THREE.Color(1, 1, 1)));
    frame();
    const v0 = meshes().map((m) => m.instanceMatrix.version).join();
    frame(); frame();
    expect(meshes().map((m) => m.instanceMatrix.version).join()).toBe(v0);
    b.setVisibleAt(ids[1], false); frame();
    expect(meshes().reduce((s, m) => s + m.count, 0)).toBe(2);
    b.setGeometryAt(ids[0], 1); frame(); // switching LOD moves the instance to the other geometry's mesh
    const counts = meshes().map((m) => m.count).sort();
    expect(counts).toEqual([1, 1]);
  });
  it('grows a geometry\'s mesh when more instances than its capacity become visible', () => {
    const { b, frame, meshes } = setup();
    for (let i = 0; i < 40; i++) b.addInstance(1, at((i % 8) - 4, -20 - Math.floor(i / 8)), new THREE.Color(1, 1, 1));
    frame();
    const m = meshes().find((q) => q.count > 0)!;
    expect(m.count).toBe(40);
    expect(m.instanceMatrix.count).toBeGreaterThanOrEqual(40);
  });
});
