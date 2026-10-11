import { describe, it, expect, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { globeParts, standGlobeParts, GLOBE } from '../src/world/libraryCraft';

function geometryIssues(g: THREE.BufferGeometry) {
  const p = g.attributes.position,
    n = g.attributes.normal,
    uv = g.attributes.uv;
  let nonfinite = 0,
    badNormals = 0,
    degenerate = 0;
  for (const attr of [p, n, uv]) for (const v of attr.array) if (!Number.isFinite(v)) nonfinite++;
  for (let i = 0; i < n.count; i++) if (Math.abs(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) - 1) > 0.01) badNormals++;
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3();
  for (let i = 0; i < (g.index?.count ?? p.count); i += 3) {
    const at = (j: number) => (g.index ? g.index.getX(j) : j);
    a.fromBufferAttribute(p, at(i));
    b.fromBufferAttribute(p, at(i + 1));
    c.fromBufferAttribute(p, at(i + 2));
    if (b.sub(a).cross(c.sub(a)).lengthSq() < 1e-18) degenerate++;
  }
  return { nonfinite, badNormals, degenerate };
}
describe('VCP globe geometry', () => {
  it('has finite positions/UVs, unit normals and no zero-area faces', () => {
    for (const [name, g] of Object.entries({
      ...globeParts(),
      ...Object.fromEntries(Object.entries(standGlobeParts()).map(([k, v]) => ['stand.' + k, v])),
    }))
      expect(geometryIssues(g), name).toEqual({ nonfinite: 0, badNormals: 0, degenerate: 0 });
  });
  it('keeps native spherical UVs, a clear band gap, connected saddle and a floor-contact base', () => {
    const p = globeParts();
    p.sphere.computeBoundingBox();
    p.pedestal.computeBoundingBox();
    expect(p.pedestal.boundingBox!.min.y).toBe(0);
    expect(p.pedestal.boundingBox!.max.x).toBeLessThan(0.3);
    expect(GLOBE.ringInner - GLOBE.radius).toBeGreaterThan(0.015);
    expect(GLOBE.centre - GLOBE.ringOuter).toBeGreaterThan(0.505);
    expect(GLOBE.centre - GLOBE.ringOuter).toBeLessThan(0.505 + 0.083);
    const uv = p.sphere.attributes.uv;
    expect(Math.min(...Array.from({ length: uv.count }, (_, i) => uv.getY(i)))).toBe(0);
    expect(Math.max(...Array.from({ length: uv.count }, (_, i) => uv.getY(i)))).toBe(1);
    expect(p.sphere.boundingBox!.max.x).toBeCloseTo(GLOBE.radius, 5);
  });
  it('caches immutable source geometry and stays below 7,000 globe triangles', () => {
    const a = globeParts(),
      b = globeParts();
    let tris = 0;
    for (const k of Object.keys(a) as (keyof typeof a)[]) {
      expect(a[k]).toBe(b[k]);
      tris += (a[k].index?.count ?? a[k].attributes.position.count) / 3;
    }
    expect(tris).toBeLessThan(7000);
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
describe('review isolation flags', () => {
  for (const [query, expected] of [
    ['?craft=pilot', false],
    ['?review=living&craft=pilot', false],
    ['?review=dev01&craft=pilot', false],
    ['?review=library-craft', false],
    ['?review=library-craft&craft=pilot', true],
  ] as const) {
    it(query, async () => {
      vi.resetModules();
      vi.stubGlobal('location', { search: query });
      const f = await import('../src/core/artflags');
      expect(f.libraryCraft()).toBe(expected);
    });
  }
  it('uses in-memory storage without even reading normal localStorage', async () => {
    vi.resetModules();
    vi.stubGlobal('location', { search: '?review=library-craft&craft=pilot' });
    const raw = {
      getItem: vi.fn(() => {
        throw Error('read normal save');
      }),
      setItem: vi.fn(() => {
        throw Error('write normal save');
      }),
      removeItem: vi.fn(() => {
        throw Error('remove normal save');
      }),
    };
    vi.stubGlobal('localStorage', raw);
    const { storage } = await import('../src/core/state');
    expect(storage.get('fehluwe.settings')).toBeNull();
    storage.set('fehluwe.save', 'sandbox');
    expect(storage.get('fehluwe.save')).toBe('sandbox');
    storage.remove('fehluwe.save');
    expect(storage.get('fehluwe.save')).toBeNull();
    for (const fn of Object.values(raw)) expect(fn).not.toHaveBeenCalled();
  });
});
