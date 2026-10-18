import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BILLIARD_GALLERY_R02 as table, ENTRANCE_R02, UF } from '../src/world/layout';

describe('BIL-R01 — existing billiard table relocated to upper gallery only', () => {
  const src = readFileSync('src/world/manor.ts', 'utf8');
  it('places exactly one table and its pieces in the gallery-visible batch', () => {
    const matches = src.match(/billiardTable\(c,/g) ?? [];
    expect(matches).toHaveLength(1);
    expect(src).toContain("c.chunk = 'mHall';\n  billiardGalleryTable(c)");
    expect(src).toContain('billiardTable(c, x, z, UF, 0, w, L)');
    expect(src).toContain('UF + 0.88');
    expect(src).toContain('UF + 0.85');
    expect(src).not.toContain('billiardTable(c, (bx0 + bx1) / 2');
    expect(src).not.toContain('c.col.addBox(bx0 - 0.15');
    expect(src).toContain('c.col.addBox(x - w / 2, x + w / 2, z - L / 2, z + L / 2, UF, UF + 0.95)');
  });
  it('fits the table AND 1.4m cue swing clearance within connected new+old gallery', () => {
    expect(UF).toBeCloseTo(3.35);
    expect(table.width).toBe(1.9);
    expect(table.length).toBe(3.5);
    const x0=table.tableX-table.width/2-table.cueClearance;
    const x1=table.tableX+table.width/2+table.cueClearance;
    const z0=table.tableZ-table.length/2-table.cueClearance;
    const z1=table.tableZ+table.length/2+table.cueClearance;
    expect(x0).toBeGreaterThan(ENTRANCE_R02.x0);
    expect(x1).toBeLessThan(ENTRANCE_R02.x1);
    expect(z0).toBeGreaterThan(ENTRANCE_R02.faceZ);
    expect(z1).toBeLessThan(84);
    expect(x0).toBeGreaterThan(table.westWalkwayMaxX);
    expect(table.tableZ-table.length/2).toBeLessThan(ENTRANCE_R02.joinZ);
    expect(table.tableZ+table.length/2).toBeGreaterThan(ENTRANCE_R02.joinZ);
  });
  it('does not move optional billiard puzzle, equipment rack or room furnishings yet', () => {
    expect(src).toContain("cueRack(c, 93.6, 104.08, GF, 0)");
    expect(src).toContain("id: 'billiard.panel'");
    expect(src).toContain("id: 'inspect.billiardExamples'");
    expect(src).toContain("id: 'lamp.billiard'");
    expect(src).toContain("billiard(w, g, c);");
    expect(src).toContain("armchair(c, 86.0, 108.6, GF");
  });
});