// DEV-04D2 additional reference: an asymmetrical salon-style gallery wall (owner photo, 10 Oct 2026,
// docs/reference/dev04/06_art_decor/frames_wall_display/). A reusable layout of existing canonical FLW-D2 paintings;
// duplicates of hung pieces are allowed for this composition (owner, 11 Oct 2026). No new artwork; every canvas keeps its
// source aspect ratio and its FLW id (a reference id, never a gameplay id).
//
// Layout space: u = along the wall to the viewer's right, v = up, metres, origin = the cluster anchor. Each frame is given
// by its outer box's lower-left corner (u0, v0) and its canvas width; the canvas height follows from the source aspect,
// the outer box adds mat + rail on every side.
import { ART } from './art';

export type FrameFinish = 'black' | 'wood' | 'white';
export interface SalonFrame {
  /** FLW-D2 id (canvas source) */
  id: string;
  /** canvas width (m) */
  cw: number;
  /** frame rail width (m) */
  rail: number;
  /** mat (passe-partout) width (m), 0 = none */
  mat: number;
  finish: FrameFinish;
  u0: number;
  v0: number;
}

export const FINISH: Record<FrameFinish, string> = { black: '#24201d', wood: '#c49a6c', white: '#ece6da' };

/**
 * The salon composition after the reference photo: 15 frames, a large square anchor in the centre and a large portrait
 * anchor to the right; medium and small pieces around them; a compact core with 6–7 cm gaps and airier edges; an
 * irregular top and bottom outline; black, light-wood and off-white frames mixed; portrait, landscape and square formats.
 */
export const SALON_LAYOUT: SalonFrame[] = [
  { id: 'FLW-D2-029', cw: 0.62, rail: 0.022, mat: 0.043, finish: 'black', u0: -0.375, v0: -0.395 }, // centre anchor (square)
  { id: 'FLW-D2-007', cw: 0.46, rail: 0.022, mat: 0.043, finish: 'black', u0: 0.915, v0: -0.42 }, // right anchor (portrait)
  { id: 'FLW-D2-035', cw: 0.36, rail: 0.03, mat: 0, finish: 'white', u0: 0.435, v0: 0.07 },
  { id: 'FLW-D2-022', cw: 0.27, rail: 0.025, mat: 0.035, finish: 'wood', u0: 0.435, v0: -0.49 },
  { id: 'FLW-D2-044', cw: 0.26, rail: 0.025, mat: 0, finish: 'white', u0: 1.05, v0: 0.4 },
  { id: 'FLW-D2-046', cw: 0.4, rail: 0.03, mat: 0, finish: 'wood', u0: -0.3, v0: 0.415 },
  { id: 'FLW-D2-010', cw: 0.2, rail: 0.025, mat: 0, finish: 'black', u0: 0.22, v0: 0.46 },
  { id: 'FLW-D2-005', cw: 0.36, rail: 0.035, mat: 0, finish: 'wood', u0: -0.8, v0: 0.4 },
  { id: 'FLW-D2-045', cw: 0.36, rail: 0.03, mat: 0, finish: 'white', u0: -0.855, v0: 0.0 },
  { id: 'FLW-D2-042', cw: 0.4, rail: 0.03, mat: 0, finish: 'wood', u0: -0.895, v0: -0.36 },
  { id: 'FLW-D2-002', cw: 0.4, rail: 0.03, mat: 0, finish: 'white', u0: -1.38, v0: -0.05 },
  { id: 'FLW-D2-010', cw: 0.2, rail: 0.03, mat: 0, finish: 'black', u0: -1.3, v0: -0.33 },
  { id: 'FLW-D2-028', cw: 0.36, rail: 0.03, mat: 0, finish: 'white', u0: -0.36, v0: -0.735 },
  { id: 'FLW-D2-026', cw: 0.2, rail: 0.025, mat: 0, finish: 'wood', u0: 0.12, v0: -0.62 },
  { id: 'FLW-D2-044', cw: 0.2, rail: 0.025, mat: 0, finish: 'wood', u0: 1.0, v0: -0.68 },
];

export interface FrameBox { f: SalonFrame; ch: number; w: number; h: number; u0: number; v0: number; u1: number; v1: number; uc: number; vc: number }
/** Outer box of a frame (canvas height from the source aspect, plus mat and rail on each side). */
export function frameBox(f: SalonFrame): FrameBox {
  const p = ART[f.id];
  if (!p) throw new Error(`salon: ${f.id} is not a shippable FLW-D2 piece`);
  const ch = (f.cw * p.h) / p.w, m = f.mat + f.rail, w = f.cw + 2 * m, h = ch + 2 * m;
  return { f, ch, w, h, u0: f.u0, v0: f.v0, u1: f.u0 + w, v1: f.v0 + h, uc: f.u0 + w / 2, vc: f.v0 + h / 2 };
}

/** Where the salon wall hangs: the study's long east wall above the reading corner (wall face x 101.20, facing west). */
export const SALON_SITES = [{ room: 'study', x: 101.2, y: 3.35 + 1.72, z: 92.4, yaw: -Math.PI / 2 }] as const;
