// WINDOW-R02 — authoritative layout for the manor's normal rectangular facade windows.
// A single array owns geometry placement and exterior-to-room visibility portals.
// Special oculus, entrance bay, dormers and roof windows are intentionally NOT wall cut-outs.
export type Axis = 'x' | 'z';
export interface WindowWall {
  id: string; axis: Axis; f: number; exterior: 1 | -1;
  a0: number; a1: number; y0: number; y1: number;
  openings: { at: number; w: number; h?: number }[];
  windows: { at: number; w: number; sill: number; h: number }[];
  facade?: 'manor';
}

const main = (
  id: string, axis: Axis, f: number, a0: number, a1: number, exterior: 1 | -1,
  openings: WindowWall['openings'], ground: number[], upper: number[],
): WindowWall[] => [
  { id: id + '-g', axis, f, a0, a1, exterior, y0: 0, y1: 3.2, openings,
    windows: ground.map(at => ({ at, w: 1.1, sill: 1.05, h: 1.6 })), facade: 'manor' },
  { id: id + '-u', axis, f, a0, a1, exterior, y0: 3.2, y1: 6.4, openings: [],
    windows: upper.map(at => ({ at, w: 1.0, sill: 0.8, h: 1.5 })), facade: 'manor' },
];

export const MANOR_WINDOW_WALLS: readonly WindowWall[] = [
  ...main('south', 'x', 80.2, 72, 108, -1,
    [{ at: 90, w: 1.7, h: 2.7 }], [75.5,79,82.5,98,101.5,105],
    [75.5,79,82.5,87.5,92.5,98,101.5,105]),
  ...main('north', 'x', 109.8, 72, 108, 1,
    [{ at: 91.5, w: 1.2, h: 2.45 }, { at: 101, w: 1.0, h: 2.35 }],
    [75,78.5,82,88,97.5,105], [75,78.5,82,87.5,92.5,98,104]),
  ...main('west', 'z', 72.2, 80.4, 109.6, -1, [],
    [83,90.5,97,101,105], [82.5,90,97,101,105]),
  ...main('east', 'z', 107.8, 80.4, 109.6, 1,
    [{ at: 102.5, w: 1.0, h: 2.3 }], [83,86.8,90.4], [83,87,91]),
  {
    id: 'wing-south', axis: 'x', f: 92.2, a0: 107.6, a1: 116, exterior: -1,
    y0: 0, y1: 3.9, openings: [{ at: 112, w: 1.1, h: 2.3 }],
    windows: [{ at: 110, w: 1.0, sill: 1.1, h: 1.3 }, { at: 114.4, w: 0.8, sill: 1.1, h: 1.3 }],
    facade: 'manor',
  },
  {
    id: 'wing-north', axis: 'x', f: 109.8, a0: 107.6, a1: 116, exterior: 1,
    y0: 0, y1: 3.9, openings: [], windows: [{ at: 112, w: 1.0, sill: 1.2, h: 1.1 }],
    facade: 'manor',
  },
];

export interface ManorWindow {
  id: string; axis: Axis; f: number; at: number; exterior: 1 | -1;
  y0: number; sill: number; w: number; h: number; wallThickness: number;
}
export const MANOR_WINDOWS: readonly ManorWindow[] = MANOR_WINDOW_WALLS.flatMap(w =>
  w.windows.map((p, i) => ({
    id: w.id + '-' + i, axis: w.axis, f: w.f, at: p.at, exterior: w.exterior,
    y0: w.y0, sill: p.sill, w: p.w, h: p.h, wallThickness: 0.4,
  })),
);
export function windowAperture(s: ManorWindow) {
  const middle = s.y0 + s.sill + s.h / 2;
  return { x: s.axis === 'x' ? s.at : s.f, y: middle,
    z: s.axis === 'x' ? s.f : s.at, width: s.w, height: s.h, axis: s.axis };
}
export function windowDepths(s: ManorWindow) {
  const face = s.f + s.exterior * s.wallThickness / 2;
  return { exteriorFace: face, glazingF: face - s.exterior * 0.085,
    interiorF: s.f - s.exterior * (s.wallThickness / 2 + 0.025) };
}
