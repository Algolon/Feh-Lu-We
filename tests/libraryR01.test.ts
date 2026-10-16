// LIB-R01 static layout contracts. Runtime traversal and screenshots remain separate acceptance gates.
import { describe, expect, it } from 'vitest';
import { LIB_R01, LIB_R01_BAYS } from '../src/world/libraryR01';
import { prop, POSES, validatePlacement } from '../src/slice/placement';
import { GF, UF } from '../src/world/layout';

describe('LIB-R01: fitted shelves, puzzle and spiral access', () => {
  it('leaves the ground-floor glazing bays unobstructed', () => {
    const clear = (a: number, aw: number, w: number) => Math.abs(a - w) >= (aw + 1.1) / 2 + 0.10;
    for (const b of LIB_R01_BAYS.west) for (const z of [97, 101, 105])
      expect(clear(b.z, b.w, z)).toBe(true);
    for (const b of LIB_R01_BAYS.north) for (const x of [75, 78.5, 82])
      expect(clear(b.x, b.w, x)).toBe(true);
  });
  it('LIB-R03: wall desk is 4-6 cm from plaster, not in either western window opening', () => {
    const d=LIB_R01.desk;
    const back=d.x-(d.w+0.14)/2; // R02 decorative top is the widest part
    expect(back-72.4).toBeGreaterThanOrEqual(0.035);
    expect(back-72.4).toBeLessThanOrEqual(0.065);
    expect(d.z-d.d/2).toBeGreaterThan(97+1.1/2+0.30);
    expect(d.z+d.d/2).toBeLessThan(101-1.1/2-0.30);
    expect(LIB_R01_BAYS.west.some(b=>Math.abs(b.z-d.z)<(b.w+d.d)/2)).toBe(false);
  });
  it('LIB-R03: the desk chair nests under the east lip but leaves the inspection pose walkable', () => {
    const d=LIB_R01.desk, chairX=d.x+.76;
    expect(chairX-.26).toBeLessThan(d.x+d.w/2);
    expect(prop('b01.tableTop').x).toBe(d.x);
    const pose=POSES.find(p=>p.id==='pose.table')!;
    expect(pose.x-chairX).toBeGreaterThan(.3+.245);
    expect(Math.abs(pose.z-d.z)).toBeLessThan(.05);
  });
  it('keeps the B01 IDs and standing pose aligned on the new bureau, clear of slice keepouts', () => {
    const p = prop('b01.tableTop'), pose = POSES.find(v => v.id === 'pose.table')!;
    expect([p.x, p.z, p.w, p.d, p.h]).toEqual([LIB_R01.desk.x, LIB_R01.desk.z, LIB_R01.desk.w, LIB_R01.desk.d, LIB_R01.desk.h]);
    expect(pose.target).toBe('b01.table');
    expect(pose.x).toBeGreaterThan(p.x + p.w / 2 + 0.3);
    expect(Math.abs(pose.z - p.z)).toBeLessThan(0.1);
    expect(validatePlacement()).toEqual([]);
  });
  it('keeps DS01 album apart from the B01 work surface', () => {
    const d = prop('b01.tableTop'), a = prop('ds01.sideTable');
    expect(Math.hypot(d.x - a.x, d.z - a.z)).toBeGreaterThan(5);
  });
  it('ends the spiral on the upstairs east-gallery line with climbable rises', () => {
    const { x, z, radius, steps } = LIB_R01.stair;
    expect(steps).toBeGreaterThanOrEqual(20);
    expect((UF - GF) / steps).toBeLessThan(0.2);
    expect(x - radius).toBeGreaterThan(80);
    expect(z + radius).toBeLessThan(107.8);
    expect(LIB_R01.landing.x0).toBeLessThan(83.2);
    expect(LIB_R01.landing.x1).toBeGreaterThan(83.2);
    expect(LIB_R01.landing.z0).toBeGreaterThan(104.6);
    expect(LIB_R01.landing.z1).toBeLessThan(105.9);
  });
});
