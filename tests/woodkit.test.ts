// Art-refresh step 3 (BOSLUST exterior sample): the woodland kit must stay within its triangle budgets, keep
// both LODs on the same layout, shade thin leaves from both sides without flipped normals, and the vegetation
// drop filter must leave every other tree and plant of the original forest exactly as it was.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { oakModel, pineModel, rockModel, fernModel, grassModel, twoSided, taperTube } from '../src/world/woodkit';
import { Vegetation } from '../src/world/nature';
import { zoneWeight, inZone } from '../src/world/boslustZone';

const tris = (g: THREE.BufferGeometry) => (g.index ? g.index.count : g.attributes.position.count) / 3;
const box = (g: THREE.BufferGeometry) => { g.computeBoundingBox(); return g.boundingBox!; };

describe('oak and pine', () => {
  it('stay within their per-instance triangle budgets (near ≤ 6k / far ≤ 1.6k)', () => {
    for (const v of [0, 1] as const) {
      const n = oakModel(v, 'near'), f = oakModel(v, 'far');
      expect(tris(n.wood) + tris(n.leaves)).toBeLessThan(6000);
      expect(tris(f.wood) + tris(f.leaves)).toBeLessThan(1600);
    }
    const pn = pineModel('near'), pf = pineModel('far');
    expect(tris(pn.wood) + tris(pn.leaves)).toBeLessThan(5000);
    expect(tris(pf.wood) + tris(pf.leaves)).toBeLessThan(1600);
  });
  it('near and far LOD share the silhouette (crown bounds within 15 %), so the switch does not pop', () => {
    for (const m of [[oakModel(0, 'near'), oakModel(0, 'far')], [pineModel('near'), pineModel('far')]] as const) {
      const a = box(m[0].leaves), b = box(m[1].leaves);
      const sa = a.getSize(new THREE.Vector3()), sb = b.getSize(new THREE.Vector3());
      for (const k of ['x', 'y', 'z'] as const) expect(Math.abs(sa[k] - sb[k]) / sa[k]).toBeLessThan(0.15);
      // the far LOD keeps its roots: the wood reaches below the ground plane in both
      expect(box(m[0].wood).min.y).toBeLessThan(-0.2);
      expect(box(m[1].wood).min.y).toBeLessThan(-0.2);
    }
  });
  it('oak and pine differ in shape, not just colour: broad low crown vs tall narrow one high up', () => {
    const o = box(oakModel(0, 'near').leaves), p = box(pineModel('near').leaves);
    const os = o.getSize(new THREE.Vector3()), ps = p.getSize(new THREE.Vector3());
    expect(os.x / os.y).toBeGreaterThan(1.5); // the oak crown is much wider than tall
    expect(p.min.y).toBeGreaterThan(o.min.y + 2); // the pine crown starts far higher up the trunk
    expect(ps.x).toBeLessThan(os.x);
  });
  it('geometry is complete: positions, normals, uvs and colours, no NaNs', () => {
    for (const g of [oakModel(0, 'near').wood, oakModel(1, 'far').leaves, pineModel('near').leaves, rockModel(11)]) {
      for (const a of ['position', 'normal', 'uv', 'color']) expect(g.attributes[a], a).toBeTruthy();
      expect([...(g.attributes.position.array as Float32Array)].every(Number.isFinite)).toBe(true);
      expect([...(g.attributes.normal.array as Float32Array)].every(Number.isFinite)).toBe(true);
    }
  });
});

describe('rocks and understory', () => {
  it('rocks sit partly buried (base below the origin) and have broad planes (few triangles)', () => {
    for (const s of [11, 23, 37, 53]) {
      const g = rockModel(s);
      expect(box(g).min.y).toBeLessThan(-0.3);
      expect(tris(g)).toBeLessThan(60);
    }
  });
  it('twoSided duplicates every triangle with reversed winding and identical normals (no DoubleSide flip)', () => {
    const one = new THREE.BufferGeometry();
    one.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 0, 1], 3));
    one.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
    const g = twoSided(one);
    expect(g.attributes.position.count).toBe(6);
    const p = g.attributes.position.array as Float32Array, n = g.attributes.normal.array as Float32Array;
    expect([...p.slice(9, 12)]).toEqual([0, 0, 0]);
    expect([...p.slice(12, 15)]).toEqual([0, 0, 1]); // second and third vertex swapped
    expect([...n.slice(9)].filter((_, i) => i % 3 === 1).every((v) => v === 1)).toBe(true);
  });
  it('ferns and grass clumps face up (sky-lit) on every vertex', () => {
    for (const g of [fernModel(), grassModel()]) {
      const n = g.attributes.normal as THREE.BufferAttribute;
      for (let i = 0; i < n.count; i++) expect(n.getY(i)).toBeGreaterThan(0.2);
    }
  });
  it('taperTube tapers along its length', () => {
    const g = taperTube([[0, 0, 0], [0, 1, 0], [0, 2, 0]], [0.5, 0.1]);
    const p = g.attributes.position as THREE.BufferAttribute;
    let low = 0, high = 0;
    for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getZ(i)); if (p.getY(i) < 0.1) low = Math.max(low, r); if (p.getY(i) > 1.9) high = Math.max(high, r); }
    expect(low).toBeGreaterThan(high * 3);
  });
});

describe('zone and the original forest', () => {
  it('the vegetation drop filter keeps the random sequence: every kept entry is identical to the unfiltered build', () => {
    type Entry = { m: THREE.Matrix4; c: THREE.Color };
    const fill = (v: Vegetation) => {
      for (let i = 0; i < 40; i++) v.tree({ x: i * 3, z: 10, h: 4, r: 2, kind: i % 3 ? 'oak' : 'pine', hue: 0.1, y: 0 }, 'c');
      for (let i = 0; i < 40; i++) v.smallThing('fern', i * 3, 20, 0.4, '#6a9a3e', 'c');
      const raw = v as unknown as Record<'trunks' | 'crowns' | 'cones' | 'small', Entry[]>; // the build input (build() needs a DOM)
      return [...raw.trunks, ...raw.crowns, ...raw.cones, ...raw.small];
    };
    const all = fill(new Vegetation(7));
    const dropped = new Vegetation(7);
    dropped.drop = (x) => x > 30 && x < 60;
    const kept = fill(dropped);
    const key = (e: Entry) => `${e.m.elements.map((n) => n.toFixed(3)).join(' ')} ${e.c.getHexString()}`;
    const outside = (e: Entry) => { const x = e.m.elements[12]; return !(x > 27 && x < 63); }; // crowns spread ±3 m
    const a = all.filter(outside).map(key), b = kept.filter(outside).map(key);
    expect(b.length).toBeGreaterThan(0);
    expect(b).toEqual(a);
  });
  it('zone weight fades in from the edge and is 1 well inside', () => {
    expect(zoneWeight(38, 20)).toBe(0);
    expect(zoneWeight(63, 15)).toBe(1);
    expect(zoneWeight(41, 20)).toBeGreaterThan(0);
    expect(zoneWeight(41, 20)).toBeLessThan(1);
    expect(inZone(63, 15) && !inZone(30, 15) && !inZone(63, 60)).toBe(true);
  });
});
