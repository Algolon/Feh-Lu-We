// DEV-04D D3-a: dining / game room and kitchen pieces (src/world/d3a.ts). Pure geometry checks under node: the new
// tables keep the old top datum and footprint (everything standing on them stays seated), the free-standing pieces pass
// the construction audit, frame-and-panel doors face the way they are told, and the batch stays inside its triangle
// cap. Placement, wall-art rules and budgets in the real world run in the browser suites (e2e:dev04a / b / d).
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';

beforeAll(() => {
  const ctx: unknown = new Proxy({}, {
    get: (_t, k) => (k === 'measureText' ? () => ({ width: 0 }) : () => new Proxy({}, { get: () => () => undefined })),
    set: () => true,
  });
  (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
});

interface Part { geo: THREE.BufferGeometry; m: THREE.Matrix4 }
function ctx() {
  const parts: Part[] = [];
  const b = { add: (_mat: unknown, geo: THREE.BufferGeometry, m: THREE.Matrix4) => parts.push({ geo, m: m.clone() }) };
  const c = { b, chunk: 't', col: { addCircle: () => {}, addBox: () => {}, addBoxC: () => {} } };
  return { c: c as never, parts };
}
const bounds = (parts: Part[]) => {
  const box = new THREE.Box3();
  for (const p of parts) { p.geo.computeBoundingBox(); box.union(p.geo.boundingBox!.clone().applyMatrix4(p.m)); }
  return box;
};
const tris = (parts: Part[]) => parts.reduce((n, p) => n + (p.geo.index ? p.geo.index.count : p.geo.attributes.position.count) / 3, 0);

describe('DEV-04D D3-a tables', () => {
  it('the refectory and farmhouse tables keep the old top datum (0.76) and footprint, and stand on the floor', async () => {
    const { refectoryTable } = await import('../src/world/d3a');
    for (const [w, d] of [[1.3, 4.6], [1.2, 3.0]] as const) {
      const { c, parts } = ctx();
      refectoryTable(c, 0, 0, 0.15, w, d);
      const b = bounds(parts);
      expect(b.max.y).toBeCloseTo(0.15 + 0.76, 3);
      expect(b.min.y).toBeCloseTo(0.15, 3);
      expect(b.max.x - b.min.x).toBeLessThanOrEqual(w + 1e-6);
      expect(b.max.z - b.min.z).toBeLessThanOrEqual(d + 1e-6);
    }
  });
  it('the dining table gets six turned legs (three pairs), the kitchen table four', async () => {
    const { refectoryTable } = await import('../src/world/d3a');
    for (const [d, n] of [[4.6, 6], [3.0, 4]] as const) {
      const { c, parts } = ctx();
      refectoryTable(c, 0, 0, 0, 1.2, d);
      const legs = parts.filter((p) => { p.geo.computeBoundingBox(); const s = p.geo.boundingBox!.getSize(new THREE.Vector3()); return s.y > 0.5 && s.x < 0.13 && s.x > 0.08; });
      expect(legs.length).toBe(n);
    }
  });
});

describe('DEV-04D D3-a construction', () => {
  it('free-standing pieces pass the construction audit (on the floor, no disconnected parts)', async () => {
    const { refectoryTable, gamesCabinet, servingConsole, chinaCabinet } = await import('../src/world/d3a');
    const { assetWarnings } = await import('../src/world/artkit');
    const before = assetWarnings.length;
    const { c } = ctx();
    refectoryTable(c, 0, 0, 0, 1.3, 4.6);
    gamesCabinet(c, 0, 0, 0, Math.PI / 2);
    servingConsole(c, 0, 0, 0, Math.PI);
    chinaCabinet(c, 0, 0, 0, 0);
    expect(assetWarnings.slice(before)).toEqual([]);
  });
  it('a frame-and-panel door stands proud on the side it faces', async () => {
    const { panelDoor } = await import('../src/world/d3a');
    const { Asm, artMats } = await import('../src/world/artkit');
    for (const dir of [1, -1] as const) {
      const { c, parts } = ctx();
      const a = new Asm((c as unknown as { b: never }).b, 't', 0, 0, 0, 0);
      panelDoor(a, artMats(), artMats().paint, '#7f9a8a', 0, 0.4, 0.5, 0.4, 0.6, 0.055, dir);
      a.add(artMats().paint, '#fff', new THREE.BoxGeometry(0.01, 0.01, 0.01), 0, 0, 1); // marker one metre along local +lz
      const bb = parts.map((p) => { p.geo.computeBoundingBox(); return p.geo.boundingBox!.clone().applyMatrix4(p.m); });
      const fwd = Math.sign(bb[bb.length - 1].getCenter(new THREE.Vector3()).z); // world z sign of local forward
      const field = bb[0], rail = bb[1];
      // the rails' outer face lies 6 mm beyond the field's, on the side the door faces (`dir` along local lz)
      const proud = fwd * dir > 0 ? rail.max.z - field.max.z : field.min.z - rail.min.z;
      expect(proud).toBeCloseTo(0.006, 4);
    }
  });
});

describe('DEV-04D D3-a budget', () => {
  it('the D3-a pieces as placed stay inside the triangle cap (≤ 12.5 k gross; the counters give back ≈ 3 k net)', async () => {
    const d = await import('../src/world/d3a');
    const { c, parts } = ctx();
    d.wainscot(c, 0.15, [{ axis: 'x', f: 80.422, dir: 1, a0: 95.08, a1: 107.58 }, { axis: 'z', f: 107.578, dir: -1, a0: 80.42, a1: 91.92 }, { axis: 'x', f: 91.92, dir: -1, a0: 95.08, a1: 99.85 }, { axis: 'x', f: 91.92, dir: -1, a0: 102.15, a1: 107.6 }, { axis: 'z', f: 95.08, dir: 1, a0: 80.4, a1: 84.1 }, { axis: 'z', f: 95.08, dir: 1, a0: 86.3, a1: 91.92 }]);
    d.refectoryTable(c, 0, 0, 0, 1.3, 4.6); d.refectoryTable(c, 0, 0, 0, 1.2, 3.0);
    d.chinaCabinet(c, 0, 0, 0, 0); d.servingConsole(c, 0, 0, 0, 0); d.gamesCabinet(c, 0, 0, 0, 0); d.dartboard(c, 0, 0, 0, 0);
    for (const w of [1.54, 2.0, 1.74]) d.wallCupboards(c, 0, 0, 0, 0, w);
    for (const w of [1.54, 2.0, 0.57, 0.65, 1.39]) d.splashback(c, 0, 0, 0, 0, w, 0.47);
    for (const w of [6.02, 10.5, 4.77, 5.43, 9.77, 6.45]) d.splashback(c, 0, 0, 0, 0, w, 1.0, 0.3);
    d.enamelPendant(c, 0, 0, 0, 3.15, 1.95); d.enamelPendant(c, 0, 0, 0, 3.15, 1.95);
    d.pegRailClock(c, 0, 0, 0, 0, 3.0);
    expect(tris(parts)).toBeLessThanOrEqual(12500);
  });
});
