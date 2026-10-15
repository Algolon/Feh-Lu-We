// DEV-04D D3-b2: the upstairs identity rooms (src/world/d3b2.ts, the Track 01 moon / sloop placement, the night table,
// the culled regions). Pure geometry and source checks under node: the moon and the sloop are the Track 01 builds under
// their FLW ids (one implementation per id) and stand on the real bedside / desk tops inside their footprints; every
// new piece passes the construction audit; the rebuilt night table and the observing table keep the datums things
// stand on; the protected gameplay lines are untouched; the culled regions are registered. Placement, routes, region
// visibility and budgets in the running world are the browser suites' (e2e:dev04d / dev04a / b / c, dev01–03).
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
function ctx() {
  const parts: Part[] = [], circles: number[][] = [], boxes: number[][] = [];
  const b = { add: (_mat: unknown, geo: THREE.BufferGeometry, m: THREE.Matrix4) => parts.push({ geo, m: m.clone() }) };
  const c = { b, chunk: 't', col: { addCircle: (...a: number[]) => circles.push(a), addBox: () => {}, addBoxC: (...a: number[]) => boxes.push(a) } };
  return { c: c as never, parts, circles, boxes };
}
/** World bounds in PLAN coordinates (the batcher works in three.js space: plan z = −three z). */
const bounds = (parts: Part[]) => {
  const box = new THREE.Box3();
  for (const p of parts) { p.geo.computeBoundingBox(); box.union(p.geo.boundingBox!.clone().applyMatrix4(p.m)); }
  return { x0: box.min.x, x1: box.max.x, y0: box.min.y, y1: box.max.y, z0: -box.max.z, z1: -box.min.z };
};
const tris = (parts: Part[]) => parts.reduce((n, p) => n + (p.geo.index ? p.geo.index.count : p.geo.attributes.position.count) / 3, 0);
const UF = 3.35;

describe('DEV-04D D3-b2: Track 01 moon and sloop in production', () => {
  it('S3-015 / S3-016 build the Track 01 geometry under their FLW ids, at the anchor scale, within maxTris', async () => {
    const { S3_BUILDERS } = await import('../src/world/d2props');
    const { PROPS3D } = await import('../src/content/props3d');
    const { buildMoon, buildSloop } = await import('../src/world/d3bAssets');
    const { assetTris } = await import('../src/world/artkit');
    for (const [id, build, scale] of [['FLW-S3-016', buildMoon, 1.4], ['FLW-S3-015', buildSloop, 1.15]] as const) {
      const p = PROPS3D.find((q) => q.id === id)!;
      expect(p.scale, id).toBe(scale);
      const prod = ctx(), ref = ctx();
      const before = assetTris[id] ?? 0;
      S3_BUILDERS[id](prod.c);
      build((ref.c as unknown as { b: never }).b, 't', p.x, p.y, p.z, p.yaw, scale);
      expect(tris(prod.parts), id).toBe(tris(ref.parts)); // the same build, not a second model
      expect(tris(prod.parts), id).toBeLessThanOrEqual(p.maxTris);
      expect(assetTris[id] - before, id).toBe(tris(prod.parts)); // audited under the production FLW id
    }
  });
  it('one production implementation per stable id: the D2 moon / sloop builders are retired', () => {
    const d2 = readFileSync('src/world/d2props.ts', 'utf8');
    expect(d2).not.toMatch(/function (modelSloop|ceramicMoon|crescentPts)\b/);
    expect(d2).toMatch(/'FLW-S3-015': t01Sloop, 'FLW-S3-016': t01Moon/);
  });
  it('the sloop stands on the Reiskamer desk top, inside its footprint; the moon on the window bedside top, inside it', async () => {
    const { S3_BUILDERS } = await import('../src/world/d2props');
    const sl = ctx();
    S3_BUILDERS['FLW-S3-015'](sl.c);
    const s = bounds(sl.parts);
    expect(s.y0).toBeCloseTo(UF + 0.76, 3); // desk top (writingDesk at R0, top 0.76)
    expect(s.x0).toBeGreaterThan(79.0 - 0.55); expect(s.x1).toBeLessThan(79.0 + 0.55); // desk 1.1 × 0.55 at (79.0, 80.95)
    expect(s.z0).toBeGreaterThan(80.95 - 0.275); expect(s.z1).toBeLessThan(80.95 + 0.275);
    expect(s.x0).toBeGreaterThan(79.0); // the east half: the map and guidebook keep the west half
    const mo = ctx();
    S3_BUILDERS['FLW-S3-016'](mo.c);
    const m = bounds(mo.parts);
    expect(m.y0).toBeCloseTo(UF + 0.5775, 3); // night-table top
    expect(m.x0).toBeGreaterThan(72.65 - 0.22); expect(m.x1).toBeLessThan(72.65 + 0.22); // bedside at (72.65, 91.05), yaw π/2
    expect(m.z0).toBeGreaterThan(91.05 - 0.25); expect(m.z1).toBeLessThan(91.05 + 0.25);
    expect(m.y1 - m.y0).toBeGreaterThan(0.4); // ×1.4: ≈ 0.46 m, readable from the bed approach
  });
});

describe('DEV-04D D3-b2: construction', () => {
  it('every new piece passes the construction audit (standing pieces on their support, no disconnected parts)', async () => {
    const D = await import('../src/world/d3b2');
    const { bedside } = await import('../src/world/furniture');
    const { assetWarnings, assetAudits } = await import('../src/world/artkit');
    const before = assetWarnings.length, n0 = assetAudits.length;
    const { c } = ctx();
    D.coatStand(c, 0, 0, 0, 0.4); D.holdall(c, 2, 0, 0, 0.2); D.rucksack(c, 4, 0, 0, 0); D.deskTravelSet(c, 6, 0.76, 0, 0);
    D.jacketOverChair(c, 8, 0, 0, Math.PI, 0.88, -0.214); D.observingTable(c, 10, 0, 0, Math.PI); D.binoculars(c, 12, 0.5775, 0, 1.1);
    D.stoolThrow(c, 14, 0, 0, 0.6, 0.535, 0.18); D.sweaterOverChest(c, 16, 0, 0, 0, 0.58, 0.235); D.washShelf(c, 18, 1.12, 0, 0);
    D.towelRing(c, 20, 0.95, 0, 0); D.bathCaddy(c, 22, 0.57, 0, 0); bedside(c, 24, 0, 0, 0);
    expect(assetWarnings.slice(before)).toEqual([]);
    expect(assetAudits.length - n0).toBe(13);
  });
  it('the rebuilt night table keeps its top datum (0.5775), footprint and collider; corner posts reach the floor', async () => {
    const { bedside } = await import('../src/world/furniture');
    const { c, parts, boxes } = ctx();
    bedside(c, 0, 0, 0, 0);
    const b = bounds(parts);
    expect(b.y1).toBeCloseTo(0.5775, 4);
    expect(b.y0).toBeCloseTo(0, 4);
    expect(b.x1 - b.x0).toBeLessThanOrEqual(0.5 + 1e-6);
    expect(b.z1 - b.z0).toBeLessThanOrEqual(0.45 + 1e-6);
    expect(boxes).toEqual([[0, 0, 0.5, 0.45, 0, 0.6]]);
    const posts = parts.filter((p) => { p.geo.computeBoundingBox(); const s = p.geo.boundingBox!.getSize(new THREE.Vector3()); return s.y > 0.5 && s.x < 0.05; });
    expect(posts.length).toBe(4);
  });
  it('the observing table keeps the logbook datum (top 0.70) and the old table footprint / collider', async () => {
    const { observingTable } = await import('../src/world/d3b2');
    const { c, parts, boxes } = ctx();
    observingTable(c, 0, 0, 0, Math.PI);
    const top = parts.filter((p) => { p.geo.computeBoundingBox(); const s = p.geo.boundingBox!.getSize(new THREE.Vector3()); return s.x > 0.55 && s.z > 0.45; });
    expect(top.length).toBe(1);
    const tb = bounds(top);
    expect(tb.y1).toBeCloseTo(0.7, 4);
    expect(boxes).toEqual([[0, 0, 0.6, 0.5, 0, 0.7]]);
  });
  it('triangle costs stay in their class (soft goods ≤ 1.5 k each, small use traces ≤ 0.5 k)', async () => {
    const D = await import('../src/world/d3b2');
    const cost = (f: (c: never) => void) => { const { c, parts } = ctx(); f(c); return tris(parts); };
    expect(cost((c) => D.coatStand(c, 0, 0, 0, 0))).toBeLessThanOrEqual(1500);
    expect(cost((c) => D.holdall(c, 0, 0, 0, 0))).toBeLessThanOrEqual(1000);
    expect(cost((c) => D.rucksack(c, 0, 0, 0, 0))).toBeLessThanOrEqual(1000);
    expect(cost((c) => D.observingTable(c, 0, 0, 0, 0))).toBeLessThanOrEqual(1000);
    for (const f of [(c: never) => D.deskTravelSet(c, 0, 0, 0, 0), (c: never) => D.jacketOverChair(c, 0, 0, 0, 0, 0.88, -0.2), (c: never) => D.binoculars(c, 0, 0, 0, 0), (c: never) => D.stoolThrow(c, 0, 0, 0, 0, 0.535, 0.18),
      (c: never) => D.sweaterOverChest(c, 0, 0, 0, 0, 0.58, 0.2), (c: never) => D.washShelf(c, 0, 0, 0, 0), (c: never) => D.towelRing(c, 0, 0, 0, 0), (c: never) => D.bathCaddy(c, 0, 0, 0, 0)])
      expect(cost(f)).toBeLessThanOrEqual(500);
  });
});

describe('DEV-04D D3-b2: protected gameplay and the luggage rule', () => {
  const manor = readFileSync('src/world/manor.ts', 'utf8');
  it('the suitcase memory, the telescope / logbook evidence, both lamps and the four doors are unchanged', () => {
    for (const line of [
      "place(suitcase, 83.8, R0 + 0.5, 84.4, -Math.PI / 2);",
      "makeInspect(w, g, { id: 'mem.reis.suitcase', obj: suitcase, clue: 'mem.reis.suitcase', hit: [0.9, 0.5, 0.6], label: 'Bekijken: koffer' });",
      "luggageRack(c, 83.8, 84.4, R0, -Math.PI / 2);",
      "telescope(c, 82.6, 91.4, R0, -1.71);",
      "place(logbook, 83.9, R0 + 0.7, 93.0, 0.4);",
      "makeInspect(w, g, { id: 'mem.sterren.telescope', obj: logbook, clue: 'mem.sterren.telescope', hit: [0.4, 0.2, 0.4], label: 'Lezen: logboek' });",
      "makeLamp(w, g, { id: 'lamp.reis', ...rl, name: 'lamp', defaultOn: true, hit: [0.4, 0.7, 0.4], intensity: 4, distance: 6, patch: { y: R0 + 0.03, r: 1.0 } });",
      "makeLamp(w, g, { id: 'lamp.sterren', ...sl, name: 'lamp', defaultOn: SLICE, hit: [0.4, 0.7, 0.4], intensity: 4, distance: 6, patch: { y: R0 + 0.03, r: 1.0 } });",
      "makeDoor(w, g, { id: 'door.reis', x: 85, z: 81.72, dir: 'z+', width: 0.95, height: 2.2, y0: UF, swing: -1 });",
      "makeDoor(w, g, { id: 'door.sterren', x: 85, z: 89.72, dir: 'z+', width: 0.95, height: 2.2, y0: UF, swing: -1 });",
      "makeDoor(w, g, { id: 'door.bath', x: 87.05, z: 104, dir: 'x+', width: 0.9, height: 2.2, y0: UF, swing: 1, color: '#efe6d6' });",
      "makeDoor(w, g, { id: 'door.storage', x: 100.52, z: 98.6, dir: 'x+', width: 0.95, height: 2.2, y0: UF, swing: 1, color: '#7a5a3a' });",
    ]) expect(manor, line).toContain(line);
    expect(manor).toMatch(/fillText\('sterrenkaart'/); // the star-map panel
    expect(manor).toMatch(/fillText\('onderweg'/); // the travel-sketch identity panel
  });
  it('no second hard case: one luggage rack and one koffer on the estate; D3-b2 luggage is soft (holdall, rucksack)', () => {
    expect(manor.match(/luggageRack\(/g)?.length).toBe(1);
    expect(manor.match(/Bekijken: koffer/g)?.length).toBe(1);
    const d3b2 = readFileSync('src/world/d3b2.ts', 'utf8');
    expect(d3b2).not.toMatch(/function \w*(suitcase|case|trunk)\w*\(|luggageRack\(/i); // no hard-case builder, no second rack
  });
});

describe('DEV-04D D3-b2: culled regions', () => {
  it('Reis + Sterren (mUpR) and the guest room (mUpG) are registered regions; mUpE no longer lists the guest room', () => {
    const est = readFileSync('src/world/estate.ts', 'utf8');
    expect(est).toMatch(/roomRegion\(\['mUpR'\], \['reis', 'sterren'\]/);
    expect(est).toMatch(/roomRegion\(\['mUpG'\], \['storage'\]/);
    expect(est).toMatch(/roomRegion\(\['mUpE'\], \['study', 'botanic', 'linen'\]/);
    const manor = readFileSync('src/world/manor.ts', 'utf8');
    for (const ch of ['mUpR', 'mUpG']) expect(manor).toContain(`c.chunk = '${ch}';`);
  });
});
