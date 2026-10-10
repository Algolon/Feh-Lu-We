// DEV-04D D1: the FLW-D2 wall art in the game. One row per hung piece: the stable FLW id (never a gameplay / save
// id), why it may ship, its frame family and where it hangs. Pixels come from the atlas built by
// scripts/build-flw-atlas.mjs out of the canonical originals in docs/reference/flw/2d (left untouched).
//
// Ship rule (tests/dev04d-art.test.ts): an id ships only if docs/reference/flw/MANIFEST.json marks it APPROVED_2D,
// or it is REVIEW_READY and listed in OWNER_GROUP_A (owner decision on the D0 review, 10 Oct 2026). Group B is
// deferred and group C parked: neither may appear here.

/** REVIEW_READY D2 sources the owner approved as group A on the D0 review (DEV04D_ASSET_MANIFEST.md §9). */
export const OWNER_GROUP_A_D2 = ['FLW-D2-005', 'FLW-D2-010', 'FLW-D2-022', 'FLW-D2-029', 'FLW-D2-035', 'FLW-D2-042', 'FLW-D2-044', 'FLW-D2-045'] as const;

/**
 * Frame families after the owner-approved S3-043 / 044 / 045 direction:
 * - `antique` (S3-044, deeper antique frame): wide dark rail, a gilt bead inside, a linen slip; the hero pieces;
 * - `simple` (S3-043, plain moulded frame): a flat rail with a raised outer lip; landscapes and still lifes;
 * - `print` (S3-045, slim print / clip frame): a narrow square rail; prints and small pieces.
 */
export type FrameFamily = 'antique' | 'simple' | 'print';
export interface FrameStyle { family: FrameFamily; rail: string; bead?: string }

export interface ArtPiece {
  id: string;
  title: string;
  basis: 'APPROVED_2D' | 'OWNER_GROUP_A';
  room: string;
  /** canvas size in metres (the source aspect, ±1 %); the frame adds its rails around it */
  w: number;
  h: number;
  frame: FrameStyle;
}

const OAK = '#8a6038', DARK = '#5c3b22', GILT = '#b8924c';

export const ART: Record<string, ArtPiece> = {
  'FLW-D2-002': { id: 'FLW-D2-002', title: 'Het laatste zonlicht', basis: 'APPROVED_2D', room: 'hall', w: 1.35, h: 0.81, frame: { family: 'antique', rail: DARK, bead: GILT } },
  'FLW-D2-007': { id: 'FLW-D2-007', title: 'De stille eik', basis: 'APPROVED_2D', room: 'hall', w: 0.66, h: 0.88, frame: { family: 'simple', rail: '#6e4b2e' } },
  'FLW-D2-026': { id: 'FLW-D2-026', title: 'De kust na de regen', basis: 'APPROVED_2D', room: 'living', w: 1.4, h: 0.7875, frame: { family: 'antique', rail: DARK, bead: GILT } },
  'FLW-D2-028': { id: 'FLW-D2-028', title: 'Het huis in de nacht', basis: 'APPROVED_2D', room: 'landing', w: 1.3, h: 0.78, frame: { family: 'antique', rail: '#5c3b22', bead: GILT } },
  'FLW-D2-046': { id: 'FLW-D2-046', title: 'Een middag in Portugal', basis: 'APPROVED_2D', room: 'cottageRoom', w: 0.9, h: 0.506, frame: { family: 'simple', rail: '#5e7f86' } },
  'FLW-D2-005': { id: 'FLW-D2-005', title: 'Kleikom, appels, ruwe tafel en linnen', basis: 'OWNER_GROUP_A', room: 'kitchen', w: 0.8, h: 1.0, frame: { family: 'simple', rail: OAK } },
  'FLW-D2-010': { id: 'FLW-D2-010', title: 'Na het feest', basis: 'OWNER_GROUP_A', room: 'dining', w: 1.4, h: 1.05, frame: { family: 'antique', rail: DARK, bead: GILT } },
  'FLW-D2-022': { id: 'FLW-D2-022', title: 'De onbekende reiziger', basis: 'OWNER_GROUP_A', room: 'reis', w: 0.75, h: 1.0, frame: { family: 'simple', rail: '#6e4b2e' } },
  'FLW-D2-029': { id: 'FLW-D2-029', title: 'Maanlicht op water', basis: 'OWNER_GROUP_A', room: 'sterren', w: 0.8, h: 0.8, frame: { family: 'print', rail: '#2f2a28' } },
  'FLW-D2-035': { id: 'FLW-D2-035', title: 'Zomerregen op een landweg', basis: 'OWNER_GROUP_A', room: 'storage', w: 1.0, h: 0.75, frame: { family: 'simple', rail: OAK } },
  'FLW-D2-042': { id: 'FLW-D2-042', title: 'Onder hetzelfde bladerdak', basis: 'OWNER_GROUP_A', room: 'gathering', w: 1.4, h: 0.7875, frame: { family: 'simple', rail: '#5a3a22' } },
  'FLW-D2-044': { id: 'FLW-D2-044', title: 'Houtdruk: hout, zaagsel en gereedschap', basis: 'OWNER_GROUP_A', room: 'workshop', w: 0.8, h: 0.6, frame: { family: 'print', rail: '#c8a77a' } },
  'FLW-D2-045': { id: 'FLW-D2-045', title: 'De weg naar de kust', basis: 'OWNER_GROUP_A', room: 'cottageEntry', w: 0.8, h: 0.6, frame: { family: 'simple', rail: '#5e7f86' } },
};

/** Outer frame margin per family (rail width): footprints for the wall-art contract. */
export const FRAME_RAIL: Record<FrameFamily, number> = { antique: 0.095, simple: 0.065, print: 0.032 };
