// DEV-04D D3 Asset Track 01 (src/world/d3bAssets.ts): pure geometry checks under node for the D3-b prebuild candidates.
// They are isolated: no room calls them (placement is D3-b's). Checked here: each piece passes the construction audit,
// stays inside its cost class, sits on the wall / its support the way its construction note says, the swallows are
// three different birds (not clones), the medallion keeps the D2-R disc dimensions and scales uniformly (relief depth
// with it), and the moon reads as a volume (a lens in section), not a cut-out.
import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
import { readFileSync } from 'node:fs';

beforeAll(() => {
  const ctx: unknown = new Proxy({}, {
    get: (_t, k) => (k === 'measureText' ? () => ({ width: 0 }) : () => new Proxy({}, { get: () => () => undefined })),
    set: () => true,
  });
  (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) };
});

interface Part { geo: THREE.BufferGeometry; m: THREE.Matrix4 }
function batcher() {
  const parts: Part[] = [];
  const b = { add: (_mat: unknown, geo: THREE.BufferGeometry, m: THREE.Matrix4) => parts.push({ geo: geo.clone(), m: m.clone() }) };
  return { b: b as never, parts };
}
const bounds = (parts: Part[]) => {
  const box = new THREE.Box3();
  for (const p of parts) { p.geo.computeBoundingBox(); box.union(p.geo.boundingBox!.clone().applyMatrix4(p.m)); }
  return box;
};
const tris = (parts: Part[]) => parts.reduce((n, p) => n + (p.geo.index ? p.geo.index.count : p.geo.attributes.position.count) / 3, 0);

describe('DEV-04D Track 01: construction and cost', () => {
  it('every candidate passes the construction audit and stays inside its cost class', async () => {
    const { buildSwallows, buildMedallion, buildMoon } = await import('../src/world/d3bAssets');
    const { assetWarnings } = await import('../src/world/artkit');
    const before = assetWarnings.length;
    const caps: [string, (b: never) => unknown, number][] = [
      ['swallows', (b) => buildSwallows(b, 't', 0, 2, 0, 0), 3200], // hero prop (gallery identity piece)
      ['medallion', (b) => buildMedallion(b, 't', 0, 1.65, 0, 0), 2400], // medium identity prop
      ['medallion ×3', (b) => buildMedallion(b, 't', 0, 1.65, 0, 0, 3), 3200], // more lathe segments above s = 1.6
      ['moon', (b) => buildMoon(b, 't', 0, 0.6, 0, 0), 1400], // medium identity prop
    ];
    for (const [name, build, cap] of caps) {
      const { b, parts } = batcher();
      build(b);
      expect(tris(parts), name).toBeGreaterThan(200);
      expect(tris(parts), name).toBeLessThanOrEqual(cap);
    }
    expect(assetWarnings.slice(before)).toEqual([]);
  });
  it('the candidates report under T01 names, never the production FLW names', async () => {
    const { buildSwallows } = await import('../src/world/d3bAssets');
    const { assetTris } = await import('../src/world/artkit');
    const prod = assetTris['FLW-S3-014'];
    buildSwallows(batcher().b, 't', 0, 2, 0, 0);
    expect(assetTris['T01:FLW-S3-014']).toBeGreaterThan(0);
    expect(assetTris['FLW-S3-014']).toBe(prod);
  });
});

describe('DEV-04D Track 01: FLW-S3-014 swallows', () => {
  it('three birds, three different poses (not one bird cloned)', async () => {
    const { swallowGroupGeometry, SWALLOW_POSES } = await import('../src/world/d3bAssets');
    expect(SWALLOW_POSES.length).toBe(3);
    const sig = SWALLOW_POSES.map((p) => p.wings.map((w) => Math.round(w.a)).join(',') + `|${p.tail}|${p.pitch}`);
    expect(new Set(sig).size).toBe(3);
    const sizes = swallowGroupGeometry().map((g) => { g.computeBoundingBox(); const s = g.boundingBox!.getSize(new THREE.Vector3()); return `${s.x.toFixed(2)}x${s.y.toFixed(2)}`; });
    expect(new Set(sizes).size).toBe(3);
  });
  it('each bird is carried off the wall: nothing behind the wall plane, bodies stand ≈ 7 cm proud, the group ≈ 1.7 m', async () => {
    const { buildSwallows } = await import('../src/world/d3bAssets');
    const { b, parts } = batcher();
    buildSwallows(b, 't', 0, 2, 0, 0); // facing plan +z: off the wall = plan +z = three −z
    const box = bounds(parts);
    expect(box.max.z).toBeLessThanOrEqual(1e-3); // the wall plane (three z = 0); nothing sinks into the wall
    expect(-box.min.z).toBeGreaterThan(0.07);
    expect(-box.min.z).toBeLessThan(0.16); // a relief, not free-standing birds
    expect(box.max.x - box.min.x).toBeGreaterThan(1.5);
    expect(box.max.x - box.min.x).toBeLessThan(1.95);
  });
  it('the swallows scale uniformly (D3-b may set the group size)', async () => {
    const { buildSwallows } = await import('../src/world/d3bAssets');
    const a = batcher(), c = batcher();
    buildSwallows(a.b, 't', 0, 2, 0, 0, 1);
    buildSwallows(c.b, 't', 0, 2, 0, 0, 1.25);
    const A = bounds(a.parts).getSize(new THREE.Vector3()), C = bounds(c.parts).getSize(new THREE.Vector3());
    expect(C.x / A.x).toBeCloseTo(1.25, 2);
    expect(C.z / A.z).toBeCloseTo(1.25, 2);
  });
});

describe('DEV-04D Track 01: FLW-S3-017 medallion', () => {
  it('keeps the D2-R disc (Ø 0.58 m, rim 6.6 cm proud) and the relief stays attached to the field', async () => {
    const { medallionGeometry } = await import('../src/world/d3bAssets');
    const g = medallionGeometry(1);
    g.computeBoundingBox();
    const s = g.boundingBox!.getSize(new THREE.Vector3());
    expect(s.x).toBeGreaterThan(0.57); expect(s.x).toBeLessThan(0.6);
    expect(g.boundingBox!.min.z).toBeCloseTo(0, 3); // back on the wall
    expect(g.boundingBox!.max.z).toBeGreaterThan(0.066); // the bud now stands proud of the rim (identity mass)
    expect(g.boundingBox!.max.z).toBeLessThan(0.1);
  });
  it('scales uniformly: ×2 / ×2.5 / ×3 keep the proportions, relief depth included', async () => {
    const { medallionGeometry } = await import('../src/world/d3bAssets');
    const base = medallionGeometry(1);
    base.computeBoundingBox();
    const b0 = base.boundingBox!.getSize(new THREE.Vector3());
    for (const k of [2, 2.5, 3]) {
      const g = medallionGeometry(k);
      g.computeBoundingBox();
      const b = g.boundingBox!.getSize(new THREE.Vector3());
      expect(b.x / b0.x).toBeCloseTo(k, 1);
      expect(b.z / b0.z).toBeCloseTo(k, 1);
    }
  });
});

describe('DEV-04D Track 01: FLW-S3-016 moon', () => {
  it('stands on its support, the crescent clear of the block on its pin; ≈ 0.3 m overall', async () => {
    const { buildMoon } = await import('../src/world/d3bAssets');
    const { b, parts } = batcher();
    buildMoon(b, 't', 0, 0.6, 0, 0);
    const box = bounds(parts);
    expect(box.min.y).toBeCloseTo(0.6, 2);
    expect(box.max.y - box.min.y).toBeGreaterThan(0.26);
    expect(box.max.y - box.min.y).toBeLessThan(0.36);
  });
  it('the crescent is a volume (a lens in section), not an extruded cut-out', async () => {
    const { moonCrescentGeometry } = await import('../src/world/d3bAssets');
    const g = moonCrescentGeometry();
    g.computeBoundingBox();
    const s = g.boundingBox!.getSize(new THREE.Vector3());
    expect(s.z / s.x).toBeGreaterThan(0.18); // D2 moon: 22 mm slab on a 0.17 m crescent (0.13)
    expect(s.y / s.x).toBeGreaterThan(1.1); // taller than wide: the sheet's crescent
  });
});

describe('DEV-04D Track 01: FLW-S3-015 sloop', () => {
  it('stands on its base; deep hull with a keel seated in the brass cradle cups; within its cost class', async () => {
    const { buildSloop } = await import('../src/world/d3bAssets');
    const { assetWarnings } = await import('../src/world/artkit');
    const before = assetWarnings.length;
    const { b, parts } = batcher();
    buildSloop(b, 't', 0, 0.76, 0, 0);
    expect(assetWarnings.slice(before)).toEqual([]);
    const box = bounds(parts);
    expect(box.min.y).toBeCloseTo(0.76, 3);
    expect(box.max.y - box.min.y).toBeGreaterThan(0.5); // masthead ≈ 0.56 above the desk
    expect(tris(parts)).toBeLessThanOrEqual(1600);
    // facing plan +z = three −z: the bowsprit reaches forward of the hull
    expect(-box.min.z).toBeGreaterThan(0.2);
  });
  it('the hull is deeper than the production one, and the keel bottom rests in the cups (posts reach the boat)', async () => {
    const { buildSloop } = await import('../src/world/d3bAssets');
    const { b, parts } = batcher();
    buildSloop(b, 't', 0, 0, 0, 0);
    const sized = parts.map((p) => { p.geo.computeBoundingBox(); return { p, bb: p.geo.boundingBox!.clone().applyMatrix4(p.m) }; });
    const hull = sized.reduce((m, q) => (q.bb.getSize(new THREE.Vector3()).z > m.bb.getSize(new THREE.Vector3()).z && q.bb.max.y < 0.2 && q.bb.min.y > 0.05 ? q : m));
    const hs = hull.bb.getSize(new THREE.Vector3());
    expect(hs.y).toBeGreaterThan(0.065); // production hull: 0.05 deep
    expect(hs.z).toBeGreaterThan(0.34);
    const cups = sized.filter((q) => { const s3 = q.bb.getSize(new THREE.Vector3()); return Math.abs(s3.x - 0.018) < 0.002 && Math.abs(s3.y - 0.012) < 0.001; });
    expect(cups.length).toBe(2);
    const keelBottom = Math.min(...sized.filter((q) => q.bb.getSize(new THREE.Vector3()).x < 0.01 && q.bb.getSize(new THREE.Vector3()).z > 0.25).map((q) => q.bb.min.y));
    for (const c of cups) { expect(keelBottom).toBeGreaterThan(c.bb.min.y); expect(keelBottom).toBeLessThan(c.bb.max.y); }
  });
});

describe('DEV-04D Track 01: loft winding (regression)', () => {
  it('the swallow body faces outwards (an inverted loft is culled from the front and shows the wing roots through it)', async () => {
    const { swallowGroupGeometry } = await import('../src/world/d3bAssets');
    const g = swallowGroupGeometry()[1];
    const p = g.attributes.position as THREE.BufferAttribute;
    // the body's most forward triangle (largest D) must face the viewer (+D)
    let best = 0, bestD = -Infinity;
    for (let t = 0; t < p.count; t += 3) { const d = (p.getZ(t) + p.getZ(t + 1) + p.getZ(t + 2)) / 3; if (d > bestD) { bestD = d; best = t; } }
    const a = new THREE.Vector3().fromBufferAttribute(p, best), b = new THREE.Vector3().fromBufferAttribute(p, best + 1), c = new THREE.Vector3().fromBufferAttribute(p, best + 2);
    expect(b.sub(a).cross(c.sub(a)).z).toBeGreaterThan(0);
  });
});

describe('DEV-04D Track 01: isolation (no world placement in this branch)', () => {
  it('no room or world module imports the Track 01 builders', () => {
    const roots = ['src/world/manor.ts', 'src/world/estate.ts', 'src/world/rooms.ts', 'src/world/d2props.ts', 'src/world/d3a.ts', 'src/main.ts', 'src/core/game.ts'];
    for (const f of roots) expect(readFileSync(f, 'utf8'), f).not.toMatch(/d3bAssets/);
  });
});
