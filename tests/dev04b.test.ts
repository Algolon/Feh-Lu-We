// DEV-04B visual convergence: construction rules of the shared asset families — solids are closed and face outward
// (no hollow / open-ended logs, books, bedding), sheets keep their thickness, books have real cover overhang and a
// recessed paper block, the construction audit catches floating / sinking / disconnected parts.
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { logModel, splitLogModel } from '../src/world/woodkit';
import { meshAudit, bookCoverGeo, bookBlockGeo, shelfBookGeo, bookDims, drapeGeo, openBookGeo, openCoverGeo, rugGeo, BOOK_H, BOOK_T, toAtlas, SHEETS, type BookSpec } from '../src/world/propkit';
import { auditParts } from '../src/world/artkit';
import { wickermanGeo, wickerHay, WICKER } from '../src/world/wickerman';

/** Signed volume (positive when the closed mesh's triangles face outward). */
function volume(g: THREE.BufferGeometry) {
  const p = g.attributes.position, idx = g.index ? Array.from(g.index.array) : [...Array(p.count).keys()];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let v = 0;
  for (let t = 0; t < idx.length; t += 3) { a.fromBufferAttribute(p, idx[t]); b.fromBufferAttribute(p, idx[t + 1]); c.fromBufferAttribute(p, idx[t + 2]); v += a.dot(b.clone().cross(c)) / 6; }
  return v;
}
const finite = (g: THREE.BufferGeometry) => Array.from(g.attributes.position.array as Float32Array).every(Number.isFinite);
const box = (g: THREE.BufferGeometry) => { g.computeBoundingBox(); return g.boundingBox!; };

describe('DEV-04B timber family', () => {
  it('logs are closed solids facing outward (no open tube ends, no hollow branch stub)', () => {
    for (const [seed, len, rad] of [[91, 3, 0.22], [131, 2.2, 0.21], [201, 0.36, 0.05], [171, 2.2, 0.22]] as const) {
      const g = logModel(seed, len, rad);
      const m = meshAudit(g);
      expect(m.open, `log ${seed} open edges`).toBe(0);
      expect(m.flipped, `log ${seed} inconsistent winding`).toBe(0);
      expect(volume(g), `log ${seed} faces outward`).toBeGreaterThan(0);
      expect(finite(g)).toBe(true);
    }
  });
  it('split firewood is a closed wedge lying on its split face', () => {
    const g = splitLogModel(137, 0.42, 0.11);
    expect(meshAudit(g).open).toBe(0);
    expect(volume(g)).toBeGreaterThan(0);
    expect(box(g).min.y).toBeCloseTo(0, 5);
  });
});

describe('DEV-04B book family', () => {
  const specs: BookSpec[] = [];
  for (const size of Object.keys(BOOK_H) as (keyof typeof BOOK_H)[]) for (const thick of Object.keys(BOOK_T) as (keyof typeof BOOK_T)[]) for (const hard of [true, false]) specs.push({ size, thick, hard, design: 2 });
  it('every cover is a closed shell facing outward; the paper block is recessed inside it', () => {
    for (const s of specs) {
      const cover = bookCoverGeo(s), block = bookBlockGeo(s), { h, d, t } = bookDims(s);
      const m = meshAudit(cover);
      expect(m.open, `${JSON.stringify(s)} cover open`).toBe(0);
      expect(volume(cover), `${JSON.stringify(s)} cover outward`).toBeGreaterThan(0);
      const cb = box(cover), bb = box(block);
      expect(cb.max.y).toBeCloseTo(h, 5);
      expect(cb.max.x - cb.min.x).toBeCloseTo(t, 4);
      // the block sits inside the boards and below the cover's top edge (hard covers overhang by 3 mm)
      expect(bb.max.y).toBeLessThan(cb.max.y - (s.hard ? 0.0025 : 0.0003));
      expect(bb.min.y).toBeGreaterThan(cb.min.y);
      expect(bb.max.x).toBeLessThan(cb.max.x);
      expect(bb.max.z).toBeLessThan(d / 2 + 1e-6);
      expect(finite(cover) && finite(block)).toBe(true);
    }
  });
  it('size, thickness and cover type produce genuinely different constructions (not recolours)', () => {
    const keys = new Set(specs.map((s) => { const b = box(bookCoverGeo(s)); return `${b.max.x.toFixed(3)},${b.max.y.toFixed(3)},${b.max.z.toFixed(3)},${meshAudit(bookCoverGeo(s)).tris}`; }));
    expect(keys.size).toBeGreaterThanOrEqual(specs.length * 0.75);
  });
  it('the shelf variant is cheap and keeps the visible read: sides, spine, top rim, paper top', () => {
    for (const s of specs) {
      const { cover, block } = shelfBookGeo(s), full = meshAudit(bookCoverGeo(s)).tris + meshAudit(bookBlockGeo(s)).tris;
      const tris = cover.attributes.position.count / 3 + block.attributes.position.count / 3;
      expect(tris).toBeLessThan(full * 0.6);
      // every triangle faces up or away from the book's axis (nothing faces into the shelf or the case back)
      cover.computeVertexNormals();
      const n = cover.attributes.normal, p = cover.attributes.position;
      for (let i = 0; i < n.count; i += 3) expect(n.getY(i) > 0.5 || n.getX(i) * p.getX(i) + n.getZ(i) * p.getZ(i) > -1e-6).toBe(true);
    }
  });
  it('open books are finite, the pages rise into the gutter, the covers lie flat', () => {
    for (const size of ['medium', 'tall', 'folio'] as const) {
      const pg = openBookGeo(size), cv = openCoverGeo(size);
      expect(finite(pg) && finite(cv)).toBe(true);
      expect(box(cv).max.y).toBeLessThan(0.005);
      expect(box(pg).max.y).toBeGreaterThan(BOOK_T.medium / 2);
    }
  });
});

describe('DEV-04B bedding', () => {
  it('a duvet keeps its thickness over the roll and hangs down the sides and the foot', () => {
    const hx = 0.77, t = 0.065, drop = 0.17, foot = 0.98, g = drapeGeo(hx, -0.5, foot, t, drop, foot, 0.15);
    expect(finite(g)).toBe(true);
    const b = box(g);
    expect(b.max.y).toBeCloseTo(t, 3); // flat top at the sheet thickness
    expect(b.min.y).toBeLessThan(-drop + t); // the sides hang down
    expect(b.max.x).toBeGreaterThan(hx + t / 2); // and stand off the mattress side (no intersection with it)
    expect(-b.min.z).toBeGreaterThan(foot); // the foot rolls over (art-kit frame: forward = −z)
    expect(meshAudit(g).open).toBe(0);
  });
});

describe('DEV-04B rugs and atlas', () => {
  it('every rug design maps inside its own atlas sheet', () => {
    const [X, Y, W, H] = SHEETS.rug;
    for (const pat of ['medallion', 'kilim', 'lattice', 'field', 'runner', 'oval', 'hanging'] as const) {
      const g = rugGeo(pat, 2.2, 3.4, true), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        expect(uv.getX(i) * 1024).toBeGreaterThanOrEqual(X - 1e-3); expect(uv.getX(i) * 1024).toBeLessThanOrEqual(X + W + 1e-3);
        expect((1 - uv.getY(i)) * 1024).toBeGreaterThanOrEqual(Y - 1e-3); expect((1 - uv.getY(i)) * 1024).toBeLessThanOrEqual(Y + H + 1e-3);
      }
    }
  });
  it('toAtlas clamps into the sheet', () => {
    const g = new THREE.PlaneGeometry(1, 1);
    const uv = g.attributes.uv as THREE.BufferAttribute; uv.setXY(0, -2, 3);
    toAtlas(g, 'print');
    const [X, , W] = SHEETS.print;
    expect(uv.getX(0) * 1024).toBeGreaterThanOrEqual(X); expect(uv.getX(0) * 1024).toBeLessThanOrEqual(X + W);
  });
});

describe('DEV-04B construction audit', () => {
  const B = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));
  it('passes a grounded, connected piece', () => {
    expect(auditParts([B(0, 0, 0, 0.05, 0.7, 0.05), B(0, 0.7, 0, 1, 0.75, 1)], 0)).toEqual([]);
  });
  it('reports floating feet, sunk legs and disconnected parts', () => {
    expect(auditParts([B(0, 0.05, 0, 1, 0.1, 1)], 0)[0]).toMatch(/floats/);
    expect(auditParts([B(0, -0.05, 0, 1, 0.1, 1)], 0)[0]).toMatch(/sinks/);
    expect(auditParts([B(0, 0, 0, 1, 0.1, 1), B(0, 0.5, 0, 1, 0.6, 1)], 0).join()).toMatch(/not touching/);
  });
  it('wall-mounted pieces skip the ground rule', () => {
    expect(auditParts([B(0, 1.5, 0, 1, 1.6, 0.02)], null)).toEqual([]);
  });
});

describe('DEV-04B Wickerman', () => {
  it('the willow figure is packed with hay: closed lumps inside the cage, the whole figure finite and on its shoes', () => {
    const g = wickermanGeo();
    expect(finite(g)).toBe(true);
    expect(box(g).min.y).toBeGreaterThan(0); // stands on the shoes / sleepers (y 0 = their top)
    expect(wickerHay.length).toBeGreaterThanOrEqual(10); // torso, 4 leg + 4 arm lumps, neck, head
    const cage = box(g);
    for (const h of wickerHay) {
      const m = meshAudit(h);
      expect(m.open, 'hay lump open').toBe(0);
      const b = box(h);
      expect(cage.containsBox(b)).toBe(true);
    }
    // the torso fill sits inside the stave ellipse (it is packed in, not bulging through the weave)
    const torso = wickerHay[0], p = torso.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = THREE.MathUtils.clamp(p.getY(i), WICKER.hip, WICKER.shoulder), t = (y - WICKER.hip) / (WICKER.shoulder - WICKER.hip);
      const ex = 0.27 + 0.08 * Math.sin(t * Math.PI * 0.85), ez = 0.16 + 0.05 * Math.sin(t * Math.PI);
      expect((p.getX(i) / ex) ** 2 + (p.getZ(i) / ez) ** 2).toBeLessThan(1.0);
    }
  });
});
