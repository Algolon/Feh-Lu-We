// DEV-04A opening & wall-decor contract. Every wall opening (door / passage / window) built by `wall()`, every door
// leaf's swept zone (`makeDoor`) and every piece of wall art (`painting`, `canvasPanel`) is registered here while a
// world is built. Pure geometry, no three.js: the rules are unit-tested and the estate build exposes the registry to
// the browser suites (scene.userData.openings) so recurrences are caught generically instead of instance by instance.
//
// Rules:
//   1. wall art never overlaps a door/passage opening (incl. its architrave) or a window (glass + frame + surround);
//   2. wall art never stands in a door leaf's swept zone (the leaf would pass through it or leave it floating);
//   3. a door opening is clear from its threshold up (validated in the browser by casting rays through every
//      registered door opening against the drawn geometry: scripts/e2e-dev04a.mjs).

export type OpeningKind = 'door' | 'window';
/** An opening in an axis-aligned wall: axis 'x' = the wall runs along x at z = f; 'z' = along z at x = f. */
export interface WallOpening { kind: OpeningKind; axis: 'x' | 'z'; f: number; t: number; a0: number; a1: number; y0: number; y1: number; id?: string }
/** Plan box swept by a door leaf (closed → open), between y0 and y1. */
export interface DoorSweep { id: string; x0: number; x1: number; z0: number; z1: number; y0: number; y1: number }
/** A framed piece hung on a wall: the plane it hangs on and its outer extent (frame included). */
export interface WallArt { id: string; axis: 'x' | 'z'; f: number; a0: number; a1: number; y0: number; y1: number }
export interface Registry { openings: WallOpening[]; sweeps: DoorSweep[]; art: WallArt[] }

let REG: Registry = { openings: [], sweeps: [], art: [] };
/** Start a fresh registry (one per world build) and return it. */
export function beginOpenings(): Registry { REG = { openings: [], sweeps: [], art: [] }; return REG; }
export const openingRegistry = () => REG;
export function registerOpening(o: WallOpening) { REG.openings.push(o); }
export function registerSweep(s: DoorSweep) { REG.sweeps.push(s); }
export function registerArt(a: WallArt) { REG.art.push(a); }

/** Window footprint on its wall: glass + sash frame (0.065) + dressed surround (≤ 0.15) + sill/lintel bands. */
export const WINDOW_MARGIN = { side: 0.22, below: 0.16, above: 0.3 };
/** Door architrave + plinth blocks either side of a door opening, and the head + cap above it. */
export const DOOR_MARGIN = { side: 0.15, above: 0.18 };

/**
 * Wall-plane footprint of a piece of art centred at (x, y, z) facing `yaw` (plan heading of its face), w × h with the
 * frame included. Art faces ±x (yaw ≈ ±90°) → it hangs on a 'z' wall at x; faces ±z → an 'x' wall at z.
 */
export function artFootprint(id: string, x: number, y: number, z: number, yaw: number, w: number, h: number): WallArt {
  const onZWall = Math.abs(Math.sin(yaw)) > 0.7;
  const a = onZWall ? z : x;
  return { id, axis: onZWall ? 'z' : 'x', f: onZWall ? x : z, a0: a - w / 2, a1: a + w / 2, y0: y - h / 2, y1: y + h / 2 };
}

const overlap = (a0: number, a1: number, b0: number, b1: number, eps = 0.005) => Math.min(a1, b1) - Math.max(a0, b0) > eps;

export interface ArtConflict { art: string; with: string; kind: 'door' | 'window' | 'sweep' }
/** Every wall-art placement that breaks rule 1 or 2. */
export function wallArtConflicts(reg: Registry = REG): ArtConflict[] {
  const out: ArtConflict[] = [];
  for (const art of reg.art) {
    for (const op of reg.openings) {
      if (op.axis !== art.axis || Math.abs(art.f - op.f) > op.t / 2 + 0.14) continue;
      const m = op.kind === 'window' ? { s: WINDOW_MARGIN.side, b: WINDOW_MARGIN.below, t: WINDOW_MARGIN.above } : { s: DOOR_MARGIN.side, b: 0, t: DOOR_MARGIN.above };
      if (overlap(art.a0, art.a1, op.a0 - m.s, op.a1 + m.s) && overlap(art.y0, art.y1, op.y0 - m.b, op.y1 + m.t)) {
        out.push({ art: art.id, with: op.id ?? `${op.kind}@${op.axis}${op.f.toFixed(2)}:${((op.a0 + op.a1) / 2).toFixed(2)}`, kind: op.kind });
      }
    }
    // the art's plan footprint: its span along the wall, 0.12 m deep off the wall face (both faces: either side counts)
    const [x0, x1, z0, z1] = art.axis === 'z' ? [art.f - 0.12, art.f + 0.12, art.a0, art.a1] : [art.a0, art.a1, art.f - 0.12, art.f + 0.12];
    for (const s of reg.sweeps) {
      if (overlap(x0, x1, s.x0 + 0.05, s.x1 - 0.05) && overlap(z0, z1, s.z0 + 0.05, s.z1 - 0.05) && overlap(art.y0, art.y1, s.y0, s.y1)) out.push({ art: art.id, with: s.id, kind: 'sweep' });
    }
  }
  return out;
}
