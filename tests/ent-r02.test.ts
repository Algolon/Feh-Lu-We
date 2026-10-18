import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ENTRANCE_R02 as E, BILLIARD_GALLERY_R02 as B, UF } from '../src/world/layout';
import { ROOMS, PORTALS, estateRooms } from '../src/world/roomdefs';

describe('ENT-R02 unified foyer and billiard-ready gallery blockout', () => {
  it('reserves a REAL, level two-storey extension while preserving the old rooms', () => {
    expect(E.faceZ).toBeLessThan(E.formerFaceZ);
    expect(E.formerFaceZ - E.faceZ).toBeCloseTo(2.4, 6);
    const eg = ROOMS.find(r => r.id === 'entryExtension')!;
    const up = ROOMS.find(r => r.id === 'frontGalleryExt')!;
    const old = ROOMS.find(r => r.id === 'frontGallery')!;
    const vestibule = ROOMS.find(r => r.id === 'vestibule')!;
    expect([eg.x0, eg.x1, eg.z0, eg.z1]).toEqual([E.x0, E.x1, E.faceZ, E.joinZ]);
    expect([up.x0, up.x1, up.z0, up.z1]).toEqual([E.x0, E.x1, E.faceZ, E.joinZ]);
    expect([up.y0, up.y1]).toEqual([old.y0, old.y1]);
    expect(eg.z1).toBe(vestibule.z0);
    expect(up.z1).toBe(old.z0);
    expect(UPPER_FLOOR()).toBe(UF);
  });
  it('keeps the same front-door id while adding explicit traversable portals', () => {
    const p = (a: string, b: string) => PORTALS.find(e =>
      (e.a === a && e.b === b) || (e.a === b && e.b === a));
    expect(p('out', 'entryExtension')?.door).toBe('door.front');
    expect(p('entryExtension', 'vestibule')?.kind).toBe('arch');
    expect(p('vestibule', 'hall')?.kind).toBe('arch');
    expect(p('frontGalleryExt', 'frontGallery')?.kind).toBe('arch');
    expect(PORTALS.filter(p => p.door === 'door.front')).toHaveLength(1);
    const frontGlass = p('frontGalleryExt', 'out');
    expect(frontGlass?.kind).toBe('window');
    expect(frontGlass?.seeThrough).toBe(true);
    expect(frontGlass?.aperture?.z).toBe(E.zWindow);
    const R = estateRooms();
    expect(R.roomAt(90, 4.2, 78.2)).toBe('frontGalleryExt');
    expect(R.roomAt(90, 1.0, 78.2)).toBe('entryExtension');
  });
  it('fits the existing 3.5 x 1.9 table plus 1.4m cue envelope without taking the west walkway', () => {
    const tableLongX = B.length + 2 * B.cueClearance; // rotated across the front bay
    const tableShortZ = B.width + 2 * B.cueClearance;
    const x0 = B.tableX - tableLongX / 2, x1 = B.tableX + tableLongX / 2;
    const z0 = B.tableZ - tableShortZ / 2, z1 = B.tableZ + tableShortZ / 2;
    expect(tableLongX).toBeCloseTo(6.3, 6);
    expect(tableShortZ).toBeCloseTo(4.7, 6);
    expect(x0).toBeGreaterThan(B.westWalkwayMaxX);
    expect(x0).toBeGreaterThan(E.x0 + .20);
    expect(x1).toBeLessThan(E.x1 - .20);
    expect(z0).toBeGreaterThan(E.faceZ + .20);
    expect(z1).toBeLessThan(84 - .20);
  });
  it('opens the old facade on BOTH levels and models the new glass as a physical wall aperture', () => {
    const w = readFileSync('src/world/manorWindowLayout.ts', 'utf8');
    const m = readFileSync('src/world/manor.ts', 'utf8');
    expect(w).toContain("[{ at: 90, w: 7.2, h: 3.2 }]");
    expect(w).toContain("id === 'south' ? [{ at: 90, w: 7.2, h: 3.2 }]");
    expect(m).toContain("slab(ENTRANCE_R02.x0, ENTRANCE_R02.x1, ENTRANCE_R02.faceZ, ENTRANCE_R02.joinZ)");
    expect(m).toContain("wall(c, 'x', E.zWindow");
    expect(m).toContain("h: E.windowH, transparent: true");
    expect(m).toContain("w: 7.6, h: 2.94");
    expect(m).not.toContain("windowAt(c, 'x', 79.55, -1, 90");
  });
});
function UPPER_FLOOR() { return ROOMS.find(r => r.id === 'frontGalleryExt')!.y0 + .15; }
