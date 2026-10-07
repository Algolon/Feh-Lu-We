// DEV-01 slice identifiers. Stable ids: saves, world objects, tests and the review script refer to them.
//
// Room aliases: the G/U labels are the discipline aliases of ENVIRONMENT_STORY §5; LEVEL_PLAN v0.2 §12 and
// LEVEL_LAYOUT.json map them onto the runtime room ids below (verified against docs/design/v0.2 in DEV-01R final:
// G01 vestibule, G02 hal, G03 zitkamer, G04 bibliotheek, U04 gastensuite met pakhoek = `reis`, U05 sterren,
// U10 botanische kamer). Runtime room ids are kept; the aliases are for the debug overlay and docs only.
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
/** Evidence ids of the three upstairs clusters (LEVEL_LAYOUT v0.2 evidence_reservations). */
export const CLUSTER_ID: Record<Subject, string> = { sterren: 'EB.stars', planten: 'EB.plants', reizen: 'EB.travel' };
/** Slice-only observable sources (legacy sources keep their clue ids, e.g. c.invitation, c.mantel, c.ledger). */
export const SRC = {
  table: 's.b01.table',
  practice: 's.b01.practice', // the local practice card on the table (Puzzle v0.2 §4.2), not a slot
  folio: (f: FolioId) => `EB.folio.${f}`, // canon source ids (Puzzle v0.2)
  /** One inspection cluster per pair: both objects + the clip attached to them (Puzzle v0.2 §4.2, UX U01). */
  pair: (s: Subject) => CLUSTER_ID[s],
  dsNote: 'OA.ds01', // A — hall, folded note by the gingerbread maquette
  dsAlbum: 'OB.ds01', // B — library reading plank: album page + loose letter, one reading cluster
  dsPhoto: 'OC.ds01', // C — U04 drying rack; faces front/back are recorded as OC.ds01.front / OC.ds01.back
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
  practice: 'b01.practice',
  pair: (s: Subject) => `b01.pair.${s}`,
  card: 'b01.card',
  dsNote: 'ds01.note',
  dsAlbum: 'ds01.album',
  dsPhoto: 'ds01.photo',
} as const;

/** DEV-01 (schema 1) folio ids → canon ids; used once to migrate review saves made before DEV-01R. */
export const LEGACY_FOLIO: Record<string, FolioId> = { I: 'stars', II: 'travel', III: 'plants' };
/**
 * Schema ≤ 2 source ids → schema 3 canon ids (DEV-01R final). The clip had its own source before; it is now part
 * of its cluster. Album and letter were two sources; they are now one reading cluster.
 */
export const LEGACY_SOURCE: Record<string, string> = {
  's.b01.pair.sterren': 'EB.stars', 's.b01.clip.sterren': 'EB.stars',
  's.b01.pair.planten': 'EB.plants', 's.b01.clip.planten': 'EB.plants',
  's.b01.pair.reizen': 'EB.travel', 's.b01.clip.reizen': 'EB.travel',
  's.ds01.note': 'OA.ds01', 's.ds01.album': 'OB.ds01', 's.ds01.letter': 'OB.ds01', 's.ds01.photo': 'OC.ds01',
};

/** Clue sources of the iteration-3 catalogue that DEV-01 removes from the world (old-save import keeps them aside). */
export const REMOVED_SOURCES = ['c.libraryPlan', 'c.guestbookTabs', 'c.catalogDesk', 'c.archiveCard'];
