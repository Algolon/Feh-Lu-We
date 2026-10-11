// DEV-04D D1: FLW-D2 wall art. Pure data checks (no renderer): what may ship, provenance of the atlas pixels, aspect
// ratios, atlas layout. The world placement checks (wall-art contract, budgets, evidence walls) run in the browser
// suite (scripts/e2e-dev04d.mjs).
import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ART, OWNER_GROUP_A_D2, FRAME_RAIL } from '../src/content/art';
import { ITEMS } from '../src/content/items';
import ATLAS from '../src/world/artAtlas.json';

const MANIFEST = JSON.parse(readFileSync('docs/reference/flw/MANIFEST.json', 'utf8')) as { assets: { id: string; status: string; path: string | null; sha256?: string; dimensions?: [number, number] }[] };
const byId = Object.fromEntries(MANIFEST.assets.map((a) => [a.id, a]));
const items = ATLAS.items as Record<string, { source: string; sha256: string; status: string; sourcePx: number[]; px: number[]; uv: number[] }>;
// owner D0 review: group B deferred, group C parked / rejected (DEV04D_ASSET_MANIFEST.md §9)
const GROUP_B_D2 = ['FLW-D2-008', 'FLW-D2-009', 'FLW-D2-013', 'FLW-D2-016', 'FLW-D2-017', 'FLW-D2-021', 'FLW-D2-023', 'FLW-D2-025', 'FLW-D2-027', 'FLW-D2-030', 'FLW-D2-038', 'FLW-D2-039', 'FLW-D2-041', 'FLW-D2-047'];
const GROUP_C_D2 = ['FLW-D2-004', 'FLW-D2-006', 'FLW-D2-015', 'FLW-D2-036', 'FLW-D2-037'];

describe('DEV-04D D1 ship rule', () => {
  it('every hung piece is APPROVED_2D, or REVIEW_READY and owner-approved in group A', () => {
    for (const p of Object.values(ART)) {
      const m = byId[p.id];
      expect(m, p.id).toBeTruthy();
      if (m.status === 'APPROVED_2D') expect(p.basis, p.id).toBe('APPROVED_2D');
      else {
        expect(m.status, p.id).toBe('REVIEW_READY');
        expect(OWNER_GROUP_A_D2 as readonly string[], p.id).toContain(p.id);
        expect(p.basis, p.id).toBe('OWNER_GROUP_A');
      }
    }
  });
  it('the D1 set is exactly the five approved + the eight group-A paintings; nothing from group B / C', () => {
    expect(Object.keys(ART).sort()).toEqual(['FLW-D2-002', 'FLW-D2-005', 'FLW-D2-007', 'FLW-D2-010', 'FLW-D2-022', 'FLW-D2-026', 'FLW-D2-028', 'FLW-D2-029', 'FLW-D2-035', 'FLW-D2-042', 'FLW-D2-044', 'FLW-D2-045', 'FLW-D2-046']);
    for (const id of [...GROUP_B_D2, ...GROUP_C_D2]) expect(ART[id], id).toBeUndefined();
  });
  it('art ids never collide with gameplay ids', () => {
    for (const id of Object.keys(ART)) expect(ITEMS[id], id).toBeUndefined();
  });
});

describe('DEV-04D D1 atlas provenance and layout', () => {
  it('each atlas cell comes from the canonical original, byte-identical to MANIFEST.json', () => {
    expect(Object.keys(items).sort()).toEqual(Object.keys(ART).sort());
    for (const [id, it] of Object.entries(items)) {
      const m = byId[id];
      expect(it.source, id).toBe(m.path);
      expect(it.sha256, id).toBe(m.sha256);
      const disk = createHash('sha256').update(readFileSync(it.source)).digest('hex');
      expect(disk, `${id}: the reference original changed`).toBe(m.sha256);
      expect(it.sourcePx, id).toEqual(m.dimensions);
    }
  });
  it('the atlas file is the one the layout describes, within the texture budget', () => {
    expect(statSync(ATLAS.file).size).toBe(ATLAS.bytes);
    const [W, H] = ATLAS.size;
    expect(W * H * 4 * (4 / 3) / 2 ** 20).toBeLessThanOrEqual(12); // ≤ 12 MiB GPU with mips (D0 §7)
  });
  it('aspect ratios are kept: source → atlas cell → hung canvas (±1 %)', () => {
    for (const [id, it] of Object.entries(items)) {
      const src = it.sourcePx[0] / it.sourcePx[1];
      expect(Math.abs(it.px[0] / it.px[1] - src) / src, `${id} atlas`).toBeLessThan(0.01);
      expect(Math.abs(ART[id].w / ART[id].h - src) / src, `${id} canvas`).toBeLessThan(0.01);
    }
  });
  it('cells lie inside the atlas, do not overlap, and keep ≥ 2 px of gutter between them', () => {
    const [W, H] = ATLAS.size;
    const px = Object.entries(items).map(([id, it]) => ({ id, x0: it.uv[0] * W, x1: it.uv[2] * W, y0: (1 - it.uv[3]) * H, y1: (1 - it.uv[1]) * H }));
    for (const r of px) { expect(r.x0, r.id).toBeGreaterThan(0); expect(r.y0, r.id).toBeGreaterThan(0); expect(r.x1, r.id).toBeLessThan(W); expect(r.y1, r.id).toBeLessThan(H); }
    for (let i = 0; i < px.length; i++) for (let j = i + 1; j < px.length; j++) {
      const a = px[i], b = px[j];
      const sep = Math.max(b.x0 - a.x1, a.x0 - b.x1, b.y0 - a.y1, a.y0 - b.y1);
      expect(sep, `${a.id} / ${b.id}`).toBeGreaterThanOrEqual(2);
    }
  });
  it('texel density stays between ≈ 300 and 420 px per metre of canvas', () => {
    for (const [id, it] of Object.entries(items)) {
      const d = it.px[0] / ART[id].w;
      expect(d, id).toBeGreaterThan(300);
      expect(d, id).toBeLessThan(420);
    }
  });
  it('frame families follow the approved S3-043 / 044 / 045 direction', () => {
    expect(FRAME_RAIL.antique).toBeGreaterThan(FRAME_RAIL.simple);
    expect(FRAME_RAIL.simple).toBeGreaterThan(FRAME_RAIL.print);
    for (const p of Object.values(ART)) expect(['antique', 'simple', 'print']).toContain(p.frame.family);
  });
});
