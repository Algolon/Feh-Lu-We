import { describe, expect, it } from 'vitest';
import { MANOR_WINDOWS, MANOR_WINDOW_WALLS, windowDepths, windowAperture } from './manorWindowLayout';
import { sillBoardGeometry } from './manorWindowAssembly';
import { PORTALS, manorWindowRoom } from './roomdefs';

describe('WINDOW-R02 manor-wide physical windows', () => {
  it('uses one authored layout for 46 windows on main manor and service wing', () => {
    expect(MANOR_WINDOW_WALLS).toHaveLength(10);
    expect(MANOR_WINDOWS).toHaveLength(46);
    expect(new Set(MANOR_WINDOWS.map(w => w.id)).size).toBe(MANOR_WINDOWS.length);
    expect(MANOR_WINDOWS.filter(w => w.id === 'north-g-3').map(w => [w.at, w.f]))
      .toEqual([[88, 109.8]]);
  });
  it('never cuts a door and retains all apertures in the host wall', () => {
    for (const face of MANOR_WINDOW_WALLS) for (const w of face.windows) {
      expect(w.at - w.w / 2).toBeGreaterThan(face.a0);
      expect(w.at + w.w / 2).toBeLessThan(face.a1);
      expect(face.y0 + w.sill + w.h).toBeLessThan(face.y1);
      for (const door of face.openings) {
        const overlapsInPlan = w.at - w.w / 2 < door.at + door.w / 2 && w.at + w.w / 2 > door.at - door.w / 2;
        const overlapsVertically = w.sill < (door.h ?? 2.3);
        expect(overlapsInPlan && overlapsVertically, face.id).toBe(false);
      }
    }
  });
  it('places one pane inside each wall regardless of exterior normal and room floor', () => {
    for (const w of MANOR_WINDOWS) {
      const d = windowDepths(w), p = windowAperture(w);
      expect(Math.abs(d.exteriorFace - d.glazingF)).toBeCloseTo(0.085, 4);
      expect((d.exteriorFace - d.glazingF) * w.exterior).toBeGreaterThan(0);
      expect(Math.abs(d.interiorF - d.glazingF)).toBeGreaterThan(0.30);
      expect(p.y).toBeCloseTo(w.y0 + w.sill + w.h / 2);
      expect(manorWindowRoom(w)).not.toBe('out');
    }
  });
  it('assigns exactly one clear, physical portal to every facade window on both floors', () => {
    const portals = PORTALS.filter(p => p.kind === 'window' && p.seeThrough && p.aperture);
    expect(portals).toHaveLength(MANOR_WINDOWS.length);
    for (const w of MANOR_WINDOWS) {
      const aperture = windowAperture(w);
      const matching = portals.filter(p => p.a === manorWindowRoom(w) && p.b === 'out'
        && p.aperture?.x === aperture.x && p.aperture?.y === aperture.y && p.aperture?.z === aperture.z);
      expect(matching, w.id).toHaveLength(1);
    }
  });
  it('aligns oak grain with each long window-board direction', () => {
    for (const axis of ['x', 'z'] as const) {
      const w = MANOR_WINDOWS.find(s => s.axis === axis)!;
      const d = windowDepths(w);
      const board = sillBoardGeometry(w, d.interiorF - w.exterior * 0.09, d.glazingF - w.exterior * 0.012);
      const uv = board.getAttribute('uv'), normal = board.getAttribute('normal');
      const top = Array.from({length:uv.count},(_,i)=>i).filter(i=>normal.getY(i)>0.9);
      expect(top).toHaveLength(4);
      const spreadU = Math.max(...top.map(i=>uv.getX(i))) - Math.min(...top.map(i=>uv.getX(i)));
      const spreadV = Math.max(...top.map(i=>uv.getY(i))) - Math.min(...top.map(i=>uv.getY(i)));
      expect(spreadU).toBeGreaterThan(spreadV * 2);
      board.dispose();
    }
  });
});
