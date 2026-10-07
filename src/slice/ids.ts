// DEV-01 slice identifiers. Stable ids: saves, world objects, tests and the review script refer to them.
//
// Room aliases: LEVEL_PLAN / LEVEL_LAYOUT v0.2 name the slice spaces G01–G04 and U04/U05/U10. Those documents
// are not in this repository, so the mapping below onto the EXISTING room ids (src/world/roomdefs.ts) is an
// as-built assumption, reconciled from the DEV-01 brief (U04 = reiskamer, route hal → woonkamer → bibliotheek)
// and the three B01 subjects. Existing room ids are kept; the v0.2 ids are aliases only (debug overlay, docs).
export const ROOM_ALIAS: Record<string, string> = {
  G01: 'vestibule', // arrival / start context behind the front door
  G02: 'hall', // hall: start drawer (console), maquette (DS01 A), grand stair
  G03: 'living', // living room: mantel (start drawer evidence)
  G04: 'library', // library: B01 table, DS01 album + drying letter (B)
  U04: 'reis', // travel room: B01 travel cluster, DS01 drying rack (C)
  U05: 'sterren', // star room: B01 star cluster
  U10: 'botanic', // botanical room: B01 plant cluster
};
export const ALIAS_OF: Record<string, string> = Object.fromEntries(Object.entries(ROOM_ALIAS).map(([a, r]) => [r, a]));
/** Connecting spaces the route crosses (not separately named in the brief). */
export const SLICE_LINK_ROOMS = ['lobby', 'frontGallery', 'walkway', 'landing', 'ucorr'];

// ------------------------------------------------------------------------------------------------ B01
export type SlotId = 'rond' | 'punt' | 'vierkant';
/** Puzzle Design v0.2 canon ids (EB.folio.<id>). A folio is a LOOSE DRAWING SHEET (los tekenblad), not a folder. */
export type FolioId = 'stars' | 'plants' | 'travel';
export type Subject = 'sterren' | 'planten' | 'reizen';
/** Slots on the library table, left → right for a reader standing east of the table facing west. */
export const B01_SLOTS: SlotId[] = ['punt', 'rond', 'vierkant'];
export const B01_FOLIOS: FolioId[] = ['stars', 'plants', 'travel'];
/**
 * The contract chain: folio → two physical details → upstairs object pair → physical archive clip → slot shape.
 * EB.folio.stars → round clip → round slot; EB.folio.plants → pointed clip → pointed slot;
 * EB.folio.travel → square clip → square slot (DEV-01R canon). The sheet carries no subject word, emblem or room
 * name; only its two drawn details lead upstairs.
 */
export const B01_CHAIN: { folio: FolioId; subject: Subject; room: string; clip: SlotId }[] = [
  { folio: 'stars', subject: 'sterren', room: 'sterren', clip: 'rond' },
  { folio: 'travel', subject: 'reizen', room: 'reis', clip: 'vierkant' },
  { folio: 'plants', subject: 'planten', room: 'botanic', clip: 'punt' },
];
/** slot → folio, derived from the chain (never typed in separately). */
export const B01_ANSWER: Record<SlotId, FolioId> = Object.fromEntries(B01_CHAIN.map((c) => [c.clip, c.folio])) as Record<SlotId, FolioId>;
export const B01_LOCK = 'lock.libraryDesk';
export const B01_DRAWER = 'library.desk';
export const B01_KEY_PICKUP = 'pk.studyKey';

// ------------------------------------------------------------------------------------------------ sources
/** Slice-only observable sources (legacy sources keep their clue ids, e.g. c.invitation, c.mantel, c.ledger). */
export const SRC = {
  table: 's.b01.table',
  folio: (f: FolioId) => `EB.folio.${f}`, // canon source ids (Puzzle v0.2)
  pair: (s: Subject) => `s.b01.pair.${s}`,
  clip: (s: Subject) => `s.b01.clip.${s}`,
  dsNote: 's.ds01.note', // A — hall, by the maquette
  dsAlbum: 's.ds01.album', // B — library, album "Weekendhuizen" with the empty photo corner
  dsLetter: 's.ds01.letter', // B — library, the drying letter
  dsPhoto: 's.ds01.photo', // C — U04, photo on the drying rack (faces: front, back)
  archiveCard: 's.b01.card',
} as const;

// ------------------------------------------------------------------------------------------------ register topics
export type TopicId = 'tafel' | 'kantlijn' | 'paden';
export const TOPICS: TopicId[] = ['tafel', 'kantlijn', 'paden'];
/** Legacy notebook "track" (iteration 3) → register topic, used once when importing an old save. */
export const TRACK_TO_TOPIC: Record<string, TopicId> = { A: 'tafel', B: 'kantlijn', C: 'paden' };

/** Interactable ids the slice adds (world.ts); listed so tests and the review script share them. */
export const SLICE_IDS = {
  table: 'b01.table',
  pair: (s: Subject) => `b01.pair.${s}`,
  clip: (s: Subject) => `b01.clip.${s}`,
  card: 'b01.card',
  dsNote: 'ds01.note',
  dsAlbum: 'ds01.album',
  dsLetter: 'ds01.letter',
  dsPhoto: 'ds01.photo',
} as const;

/** DEV-01 (schema 1) folio ids → canon ids; used once to migrate review saves made before DEV-01R. */
export const LEGACY_FOLIO: Record<string, FolioId> = { I: 'stars', II: 'travel', III: 'plants' };

/** Clue sources of the iteration-3 catalogue that DEV-01 removes from the world (old-save import keeps them aside). */
export const REMOVED_SOURCES = ['c.libraryPlan', 'c.guestbookTabs', 'c.catalogDesk', 'c.archiveCard'];
