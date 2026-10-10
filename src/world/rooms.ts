// Authored rooms and portals: one source of truth for lighting relevance, the floor-aware map and
// the "where am I" checks. Pure data + pure functions (unit-tested without a renderer).

export type Floor = 'g' | 'u' | 'a' | 'b' | 'x'; // ground, upstairs, attic (v0.2), basement/underground, outdoors/other building

export interface RoomDef {
  id: string;
  name: string; // Dutch, player-facing (map labels)
  floor: Floor;
  x0: number; x1: number; z0: number; z1: number; // plan rectangle
  y0: number; y1: number; // feet-height range that counts as "in this room"
  map?: boolean; // draw on the floor plan (default true for manor rooms)
}

/**
 * A connection light can travel through. door: open only while state.open[door] is true.
 * 'window' portals are one-way for lighting: from inside you see outdoor lamps; from outside, lit
 * windows read warm through their emissive glass instead of real lights (no lamp leaks outward).
 */
export interface PortalDef { a: string; b: string; kind: 'door' | 'arch' | 'window' | 'stair' | 'glass'; door?: string }

export class RoomGraph {
  private byId = new Map<string, RoomDef>();
  constructor(readonly rooms: RoomDef[], readonly portals: PortalDef[]) {
    for (const r of rooms) this.byId.set(r.id, r);
  }
  get(id: string) { return this.byId.get(id); }

  /** First room containing the point (rooms listed most-specific first), else 'out'. */
  roomAt(x: number, y: number, z: number): string {
    for (const r of this.rooms) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1 && y >= r.y0 && y <= r.y1) return r.id;
    return 'out';
  }

  /** The viewer's room plus every room whose LIGHT reaches it through an OPEN portal (one step). */
  relevant(here: string, isOpen: (door: string) => boolean): Set<string> {
    const out = new Set<string>([here]);
    for (const p of this.portals) {
      if (p.door && !isOpen(p.door)) continue;
      if (p.a === here) {
        // window/glass: room a → outdoors b; from a we see b's lamps. Doors/arches/stairs: both ways.
        out.add(p.b);
      } else if (p.b === here && p.kind !== 'window' && p.kind !== 'glass') {
        out.add(p.a);
      }
    }
    return out;
  }

  /**
   * Rooms whose CONTENTS can be seen from `here`, up to `depth` portal steps. Windows are glowing panes
   * (opaque); glass walls, open doors, arches and stairs are see-through. Used to hide whole rooms.
   */
  visible(here: string, isOpen: (door: string) => boolean, depth = 2): Set<string> {
    const seen = new Set<string>([here]);
    let frontier = [here];
    for (let d = 0; d < depth; d++) {
      const next: string[] = [];
      for (const r of frontier) for (const p of this.portals) {
        if (p.kind === 'window' || (p.door && !isOpen(p.door))) continue;
        const o = p.a === r ? p.b : p.b === r ? p.a : null;
        if (o && !seen.has(o)) { seen.add(o); next.push(o); }
      }
      frontier = next;
    }
    return seen;
  }
}

export interface LampCandidate { id: string; room: string; d: number; w?: number /* brighter sources are slightly preferred */ }

/**
 * Choose which lamps get the few real point lights. Pure (the caller decides which lamps are candidates and folds any
 * extra preference into `w`). Lamps in the viewer's own room are preferred. Hysteresis: a lamp that already holds a light
 * ranks `keepMargin` better than its score, so walking across a threshold does not swap lights back and forth, while a
 * clearly better newcomer (by more than the margin) still takes the slot (DEV-04C-R: previously every held lamp within
 * the margin of the cut-off was kept outright, so no newcomer could ever displace a near-tie incumbent).
 */
export function chooseLamps(cands: LampCandidate[], here: string, current: (string | null)[], slots: number, keepMargin = 2.0, otherRoomPenalty = 2.5): (string | null)[] {
  const score = (c: LampCandidate) => c.d + (c.room === here ? 0 : otherRoomPenalty) - (c.w ?? 0);
  const held = new Set(current.filter((id): id is string => !!id));
  const rank = (c: LampCandidate) => score(c) - (held.has(c.id) ? keepMargin : 0);
  const chosen = [...cands].sort((a, b) => rank(a) - rank(b) || (a.id < b.id ? -1 : 1)).slice(0, slots).map((c) => c.id);
  // stable slots: a lamp that stays keeps its slot index
  const result: (string | null)[] = current.map((id) => (id && chosen.includes(id) ? id : null));
  while (result.length < slots) result.push(null);
  for (const id of chosen) if (!result.includes(id)) { const i = result.indexOf(null); if (i >= 0) result[i] = id; }
  return result.slice(0, slots);
}
