import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ENTRANCE_R02 as E, BILLIARD_GALLERY_R02 as B, UF } from '../src/world/layout';
import { ROOMS, PORTALS, estateRooms } from '../src/world/roomdefs';

describe('ENT-R02 unified foyer and billiard-ready gallery blockout', () => {
  it('reserves a REAL, level two-storey extension while preserving the old rooms', () => {
    expect(E.faceZ).toBeLessThan(E.formerFaceZ);
    expect(E.formerFaceZ - E.faceZ).toBeCloseTo(3.0, 6);
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
    expect(p('vestibule', 'hall')?.kind).toBe('door');
    expect(p('vestibule', 'hall')?.door).toBe('door.entranceHall');
    expect(p('frontGalleryExt', 'frontGallery')?.kind).toBe('arch');
    // Visibility and lighting must no longer bleed through the hall wall while shut.
    const Rclosed = estateRooms();
    const closed = Rclosed.visible('vestibule', door => door === 'door.front');
    expect(closed.has('entryExtension')).toBe(true);
    expect(closed.has('hall')).toBe(false);
    const open = Rclosed.visible('vestibule', door => ['door.front', 'door.entranceHall'].includes(door));
    expect(open.has('hall')).toBe(true);
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
    // Corrected orientation: long axis along Z, giving a usable uninterrupted western circulation strip.
    const playX = B.width + 2 * B.cueClearance;
    const playZ = B.length + 2 * B.cueClearance;
    const x0 = B.tableX - playX / 2, x1 = B.tableX + playX / 2;
    const z0 = B.tableZ - playZ / 2, z1 = B.tableZ + playZ / 2;
    expect(playX).toBeCloseTo(4.7, 6);
    expect(playZ).toBeCloseTo(6.3, 6);
    // 40 cm side walls and 47 cm front facade count as solid, not playable air.
    expect(x0 - B.westWalkwayMaxX).toBeGreaterThanOrEqual(1.1);
    expect(x0).toBeGreaterThan(E.x0 + .4 + .15);
    expect(x1).toBeLessThan(E.x1 - .4 - .1);
    expect(z0).toBeGreaterThan(E.frontWallBackZ + .25);
    expect(z1).toBeLessThan(84 - .25);
  });
  it('opens the old facade on BOTH levels and models the new glass as a physical wall aperture', () => {
    const w = readFileSync('src/world/manorWindowLayout.ts', 'utf8');
    const m = readFileSync('src/world/manor.ts', 'utf8');
    expect(w).toContain("[{ at: 90, w: 7.2, h: 3.2 }]");
    expect(w).toContain("id === 'south' ? [{ at: 90, w: 7.2, h: 3.2 }]");
    expect(m).toContain("slab(ENTRANCE_R02.x0, ENTRANCE_R02.x1, ENTRANCE_R02.faceZ, 84)");
    expect(m).toContain("[ENTRANCE_R02.x0, ENTRANCE_R02.x1, ENTRANCE_R02.faceZ, 99.8]");
    expect(m).toContain("const sideWallJoinZ = 80.54");
    expect(m).toContain("wall(c, 'x', E.zWindow, E.x0, E.x1, 0, TOP");
    expect(m).toContain("openings: [{ at: 90, w: 1.7, h: 2.62 }]");
    expect(m).toContain("sill: E.windowY0, h: E.windowH, transparent: true");
    expect(m).toContain("w: 1.5, h: 2.35");
    expect(m).toContain("id: 'door.entranceHall'");
    expect(m).not.toContain("windowAt(c, 'x', 79.55, -1, 90");
  });
});
function UPPER_FLOOR() { return ROOMS.find(r => r.id === 'frontGalleryExt')!.y0 + .15; }
