// Authored rooms and portals: one source of truth for lighting relevance, the floor-aware map and
// the "where am I" checks. Pure data + pure functions (unit-tested without a renderer).

export type Floor = 'g' | 'u' | 'b' | 'x'; // ground, upstairs, basement/underground, outdoors/other building

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
export interface PortalDef { a: string; b: string; kind: 'door' | 'arch' | 'window' | 'stair'; door?: string }

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

  /** The viewer's room plus every room visible through an OPEN portal (one step). */
  relevant(here: string, isOpen: (door: string) => boolean): Set<string> {
    const out = new Set<string>([here]);
    for (const p of this.portals) {
      if (p.door && !isOpen(p.door)) continue;
      if (p.a === here) {
        // window: room a → outdoors b; from a we see b. Doors/arches/stairs: both ways.
        out.add(p.b);
      } else if (p.b === here && p.kind !== 'window') {
        out.add(p.a);
      }
    }
    return out;
  }
}

export interface LampCandidate { id: string; room: string; d: number; w?: number /* brighter sources are slightly preferred */ }

/**
 * Choose which lamps get the few real point lights. Pure and view-direction independent (turning the
 * camera never reorders sources). Lamps in the viewer's own room are preferred; an already assigned
 * lamp keeps its light while it stays relevant and is not clearly worse than the best alternative
 * (hysteresis), so walking across a threshold does not swap lights back and forth.
 */
export function chooseLamps(cands: LampCandidate[], here: string, current: (string | null)[], slots: number, keepMargin = 2.0, otherRoomPenalty = 2.5): (string | null)[] {
  const score = (c: LampCandidate) => c.d + (c.room === here ? 0 : otherRoomPenalty) - (c.w ?? 0);
  const sorted = [...cands].sort((a, b) => score(a) - score(b) || (a.id < b.id ? -1 : 1));
  const want = sorted.slice(0, slots);
  const cutoff = want.length ? score(want[want.length - 1]) : Infinity;
  const byId = new Map(cands.map((c) => [c.id, c]));
  // keep current lamps that are still candidates and within the margin of the cut-off
  const keep = new Set(current.filter((id): id is string => !!id && byId.has(id) && (want.some((w) => w.id === id) || score(byId.get(id)!) <= cutoff + keepMargin)));
  const chosen: string[] = [...keep];
  for (const c of want) if (chosen.length < slots && !chosen.includes(c.id)) chosen.push(c.id);
  while (chosen.length > slots) {
    // drop the worst-scoring kept lamp
    chosen.sort((a, b) => score(byId.get(a)!) - score(byId.get(b)!));
    chosen.pop();
  }
  // stable slots: a lamp that stays keeps its slot index
  const result: (string | null)[] = current.map((id) => (id && chosen.includes(id) ? id : null));
  while (result.length < slots) result.push(null);
  for (const id of chosen) if (!result.includes(id)) { const i = result.indexOf(null); if (i >= 0) result[i] = id; }
  return result.slice(0, slots);
}
