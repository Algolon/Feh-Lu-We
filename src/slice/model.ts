// DEV-01 slice rules: pure functions over GameState (+ its optional `slice` block). World objects and the UI call
// these; unit tests call them directly. Nothing here touches the DOM or three.js.
//
// Semantic separation (DEV-01 §7) — each is its own record, none is derived from another:
//   ObservationRecorded  a source was actually shown to the player (inspect overlay / face turned over).
//                        Focus or raycast never records; picking an item up never records.
//   Encountered          the player met a riddle device (lock panel / table panel) → hint eligibility.
//   RegisterObserved     the register was deliberately read (owning it is not enough).
//   ItemAcquired         an item entered the bag.
//   PuzzleSolved         the mechanism accepted the input (world opens). Not a reward, not archived.
//   RewardClaimed        the player took what the solve released (or DS01's one-time memory).
import { type GameState, defaultState } from '../core/state';
import { parseSave } from '../core/state';
import { PUZZLES, type Outcome } from '../puzzles/rules';
import { CLUES } from '../content/clues';
import { ITEMS, ESSENTIALS } from '../content/items';
import { ROOMS } from '../world/roomdefs';
import { terrainHeight } from '../world/terrain';
import { defaultSlice, MAX_SLICE_LOG, type SliceState, type SliceEventType, type Face, type Question } from './schema';
import {
  B01_SLOTS, B01_FOLIOS, B01_ANSWER, B01_LOCK, B01_DRAWER, B01_KEY_PICKUP, SRC, REMOVED_SOURCES, TRACK_TO_TOPIC,
  type SlotId, type FolioId, type TopicId,
} from './ids';
import { SOURCES, REGISTER_TOPICS, SLICE_HINTS, RESULT_TEXT, DS01_MEMORY, type SourceDef } from './content';

const ok = (msg: string, sfx: Outcome['sfx'] = 'success'): Outcome => ({ ok: true, msg, sfx });
const no = (msg: string, sfx: Outcome['sfx'] = 'fail'): Outcome => ({ ok: false, msg, sfx });

/** The slice block of a state, created on first use. */
export function sl(s: GameState): SliceState {
  if (!s.slice) s.slice = defaultSlice();
  return s.slice;
}
function emit(s: GameState, type: SliceEventType, id: string) {
  const x = sl(s);
  x.seq++;
  x.log.push({ type, id, seq: x.seq });
  if (x.log.length > MAX_SLICE_LOG) x.log.splice(0, x.log.length - MAX_SLICE_LOG);
}
const pushOnce = (arr: string[], id: string) => (arr.includes(id) ? false : (arr.push(id), true));
const ownsItem = (s: GameState, i: string) => s.inventory.includes(i) || s.used.includes(i);

// ------------------------------------------------------------------------------------------------ sources
/**
 * Source text as the slice shows it (slice sources, else the game's clue verbatim). The invitation is quoted in full,
 * including its sentence about the three parts of the route: UX v0.2 §3 "niet censureren: wel citeren, nog geen
 * queststructuur ervan maken" — topics as structure appear only after the register was read.
 */
export function sourceDef(id: string): SourceDef | null {
  if (SOURCES[id]) return SOURCES[id];
  const c = CLUES[id];
  if (!c) return null;
  return { id, title: c.title, text: c.text, status: 'canon' };
}
/** Memory notes are kept in the Archief (herinneringen), not among the observations. */
export const isMemory = (id: string) => CLUES[id]?.memory === true;

/**
 * Record that a source was actually SHOWN (DEV-01: focus/raycast ≠ observation). Returns true when this is new
 * information (a new source or a new face). Unknown ids and memories are ignored here.
 */
export function recordObservation(s: GameState, id: string, room: string, face: Face = 'front'): boolean {
  if (!sourceDef(id) || isMemory(id)) return false;
  const x = sl(s);
  const o = x.obs[id];
  if (o) {
    if (o.faces.includes(face)) return false;
    o.faces.push(face);
  } else {
    x.obs[id] = { id, seq: x.seq + 1, room, faces: [face] };
  }
  // a two-faced source logs each face under its canon id (DS01: OC.ds01.front / OC.ds01.back)
  emit(s, 'ObservationRecorded', sourceDef(id)!.back ? `${id}.${face}` : face === 'front' ? id : `${id}#${face}`);
  if (CLUES[id] && !s.clues.includes(id)) s.clues.push(id); // keeps the shared (non-slice) puzzles' discovery working
  return true;
}
export const observed = (s: GameState, id: string, face: Face = 'front') => !!s.slice?.obs[id]?.faces.includes(face);

/** The player met a riddle device; only encountered riddles are offered in the hint menu. */
export function encounter(s: GameState, ctx: string): boolean {
  if (!pushOnce(sl(s).encountered, ctx)) return false;
  emit(s, 'Encountered', ctx);
  return true;
}

// ------------------------------------------------------------------------------------------------ register
/** Deliberate reading of the register (from the bag). Owning it is required; owning it alone reveals nothing. */
export function observeRegister(s: GameState, room: string): boolean {
  if (!ownsItem(s, 'ledger')) return false;
  recordObservation(s, 'c.ledger', room);
  const x = sl(s);
  if (x.registerObserved) return false;
  x.registerObserved = true;
  emit(s, 'RegisterObserved', 'ledger');
  return true;
}
/** Topics shown in "Mijn onderzoek": exactly the three the register names, and only after it was read. */
export const registerTopics = (s: GameState) => (s.slice?.registerObserved ? REGISTER_TOPICS : null);

/** Show "Mijn aandacht" in the HUD: the player's own opt-in, off by default (UX v0.2 §3). Changes nothing else. */
export function setHudAttention(s: GameState, on: boolean): boolean {
  const x = sl(s);
  if (x.hudAttention === on) return false;
  x.hudAttention = on;
  emit(s, 'AttentionChanged', on ? 'hud:on' : 'hud:off');
  return true;
}

/** "Mijn aandacht": a personal focus. Changes nothing in the world, in eligibility or in hints. */
export function setAttention(s: GameState, topic: TopicId | null): boolean {
  const x = sl(s);
  if (!x.registerObserved) return false;
  if (topic !== null && !REGISTER_TOPICS.some((t) => t.id === topic)) return false;
  if (x.attention === topic) return false;
  x.attention = topic;
  emit(s, 'AttentionChanged', topic ?? 'none');
  return true;
}

// ------------------------------------------------------------------------------------------------ derived events
const REWARD_PICKUPS: Record<string, string> = { 'pk.ledger': 'drawer.register', [B01_KEY_PICKUP]: 'b01.studyKey' };
const SLICE_PUZZLES = new Set(['p0.home', 'p1.drawer', 'b.catalog']);
/**
 * Emit the item / reward / solve events that follow from the shared game state (pickups and locks of the normal
 * game). Idempotent: call after every change.
 */
export function syncDerived(s: GameState) {
  const x = sl(s);
  for (const i of [...s.inventory, ...s.used]) if (ITEMS[i] && pushOnce(x.acquired, i)) emit(s, 'ItemAcquired', i);
  if (s.flags.drawerLockSolved && pushOnce(x.results, 'drawer.solved')) emit(s, 'PuzzleSolved', 'drawer');
  for (const [pk, reward] of Object.entries(REWARD_PICKUPS)) if (s.taken.includes(pk) && pushOnce(x.results, reward)) emit(s, 'RewardClaimed', reward);
  for (const p of PUZZLES) if (!SLICE_PUZZLES.has(p.id) && p.solved(s) && pushOnce(x.results, `legacy.${p.id}`)) emit(s, 'PuzzleSolved', p.id);
}

// ------------------------------------------------------------------------------------------------ B01
export const b01Solved = (s: GameState) => s.slice?.b01.solved === true;
export function b01Slots(s: GameState): Record<SlotId, FolioId | null> { return { ...sl(s).b01.slots }; }
/** Folios still lying beside the slots (always recoverable). */
export function b01Loose(s: GameState): FolioId[] {
  const placed = new Set(Object.values(sl(s).b01.slots));
  return B01_FOLIOS.filter((f) => !placed.has(f));
}
/**
 * Lay a folio in a slot. A folio leaves any other slot; whatever lay in the target slot goes back beside the table.
 * Placing never judges: the player judges the full set with "Controleer" (b01Check, PD v0.2 §4.2).
 */
export function b01Place(s: GameState, slot: SlotId, folio: FolioId): Outcome {
  const b = sl(s).b01;
  if (b.solved) return no('De tekenbladen liggen nu vast.', 'none');
  if (!B01_SLOTS.includes(slot) || !B01_FOLIOS.includes(folio)) return no('Dat past hier niet.', 'fail');
  for (const k of B01_SLOTS) if (b.slots[k] === folio) b.slots[k] = null;
  b.slots[slot] = folio;
  return ok('Het tekenblad ligt in het vak.', 'click');
}
export function b01Take(s: GameState, slot: SlotId): Outcome {
  const b = sl(s).b01;
  if (b.solved) return no('De tekenbladen liggen nu vast.', 'none');
  if (!b.slots[slot]) return no('Dit vak is leeg.', 'none');
  b.slots[slot] = null;
  return ok('Je pakt het tekenblad terug.', 'pickup');
}
/**
 * "Controleer": judge the full set. Incomplete = no attempt (nothing counted); complete & wrong = neutral local
 * feedback (one attempt counted); correct = the drawer opens. Correctness depends on the slots only, never on
 * observations, pins, attention or hints.
 */
export function b01Check(s: GameState): Outcome {
  const b = sl(s).b01;
  if (b.solved) return no('De tekenbladen liggen nu vast.', 'none');
  if (B01_SLOTS.some((k) => !b.slots[k])) return no('Leg eerst in elk vak een tekenblad.', 'none');
  if (!B01_SLOTS.every((k) => b.slots[k] === B01_ANSWER[k])) {
    b.wrong++;
    s.wrong.b01 = (s.wrong.b01 ?? 0) + 1;
    return no('Alle drie de vakken zijn gevuld, maar de lade blijft dicht.', 'fail');
  }
  solveB01(s, null);
  return ok('Met een zacht klikje schuift de lade van de leestafel open.', 'chime');
}
function solveB01(s: GameState, legacy: 'catalogSolved' | null) {
  const b = sl(s).b01;
  b.solved = true;
  b.legacy = legacy;
  s.flags.b01Solved = true;
  if (!s.unlocked.includes(B01_LOCK)) s.unlocked.push(B01_LOCK);
  s.open[B01_DRAWER] = true;
  if (pushOnce(sl(s).results, 'b01.solved')) emit(s, 'PuzzleSolved', legacy ? 'b01 (alias catalogSolved)' : 'b01');
}

// ------------------------------------------------------------------------------------------------ DS01
/**
 * Looking at the photo's front. photoFound is monotone (never reset) and works from any visiting order; the one-time
 * DS01 memory is granted here. The photo is not an item and cannot be taken or put back.
 */
export function ds01Front(s: GameState, room: string): { first: boolean } {
  recordObservation(s, SRC.dsPhoto, room, 'front');
  const d = sl(s).ds01;
  if (d.photoFound) return { first: false };
  d.photoFound = true;
  if (pushOnce(sl(s).results, DS01_MEMORY.id)) emit(s, 'RewardClaimed', DS01_MEMORY.id);
  return { first: true };
}
/** Turning the photo over. Stored only when it really happened (and only after the front was seen). */
export function ds01Back(s: GameState, room: string): boolean {
  const d = sl(s).ds01;
  if (!d.photoFound) return false;
  recordObservation(s, SRC.dsPhoto, room, 'back');
  d.photoBackSeen = true;
  return true;
}

// ------------------------------------------------------------------------------------------------ notebook: pins, questions, archive
export function togglePin(s: GameState, obsId: string): boolean {
  const x = sl(s);
  if (!x.obs[obsId]) return false;
  const i = x.pins.indexOf(obsId);
  if (i >= 0) { x.pins.splice(i, 1); emit(s, 'Unpinned', obsId); } else { x.pins.push(obsId); emit(s, 'Pinned', obsId); }
  return true;
}
/** A player-authored question or idea (optionally linked to pinned observations). Never created automatically. */
export function saveQuestion(s: GameState, text: string, pins: string[]): Question | null {
  const x = sl(s);
  const t = text.trim().slice(0, 600);
  const p = pins.filter((id) => x.obs[id]).slice(0, 30);
  if (!t && !p.length) return null;
  x.seq++;
  const q: Question = { id: `q${x.seq}`, text: t, pins: p, seq: x.seq, archived: false };
  x.questions.push(q);
  emit(s, 'QuestionSaved', q.id);
  return q;
}
/** Archiving is bookkeeping only: it never solves, unlocks or "understands" anything. */
export function setArchived(s: GameState, id: string, archived: boolean): boolean {
  const x = sl(s);
  const q = x.questions.find((qq) => qq.id === id);
  if (q) {
    if (q.archived === archived) return false;
    q.archived = archived;
  } else if (x.obs[id]) {
    const has = x.archivedObs.includes(id);
    if (has === archived) return false;
    if (archived) x.archivedObs.push(id); else x.archivedObs.splice(x.archivedObs.indexOf(id), 1);
  } else return false;
  emit(s, archived ? 'Archived' : 'Unarchived', id);
  return true;
}

// ------------------------------------------------------------------------------------------------ hints
export interface HintContext { id: string; title: string; context: string; levels: [string, string, string]; shown: number }
/**
 * DS01's hint topic, titled only with what the player has actually seen (UX v0.2 §5: no authored title before its
 * meaning is revealed; PD §6.6: C first → "Waar hoort deze afbeelding bij?"). null while no DS01 source was seen.
 */
function ds01HintTitle(s: GameState): string | null {
  if (s.slice?.ds01.photoFound) return 'Waar hoort deze afbeelding bij?';
  if (observed(s, SRC.dsAlbum)) return 'De lege fotohoek in het album';
  if (observed(s, SRC.dsNote)) return 'De afbeelding van het eerste huisje';
  return null;
}
/** Riddles the player has met (and not solved). Level 0 (opening the hint) names the riddle only. */
export function hintContexts(s: GameState): HintContext[] {
  const x = sl(s);
  const out: HintContext[] = [];
  if (x.encountered.includes('drawer') && !s.flags.drawerLockSolved) out.push({ id: 'drawer', title: 'De lade in de hal', ...SLICE_HINTS.drawer, shown: x.hints.drawer ?? 0 });
  if (x.encountered.includes('b01') && !x.b01.solved) out.push({ id: 'b01', title: 'De leestafel', ...SLICE_HINTS.b01, shown: x.hints.b01 ?? 0 });
  // DS01 has no validator: its optional hints stay available once one of its sources was seen
  const ds = ds01HintTitle(s);
  if (ds) out.push({ id: 'ds01', title: ds, context: `${ds}`, levels: SLICE_HINTS.ds01.levels, shown: x.hints.ds01 ?? 0 });
  for (const p of PUZZLES) {
    if (SLICE_PUZZLES.has(p.id) || p.solved(s) || !p.discovered(s)) continue;
    out.push({ id: p.id, title: p.title, context: `${p.title}.`, levels: p.hints, shown: x.hints[p.id] ?? 0 });
  }
  return out;
}
/** Reveal the next level (1 → 3) for an eligible context; returns the level now shown (0 if not eligible). */
export function revealHint(s: GameState, ctx: string): number {
  if (!hintContexts(s).some((h) => h.id === ctx)) return 0;
  const x = sl(s);
  const lvl = Math.min(3, (x.hints[ctx] ?? 0) + 1);
  x.hints[ctx] = lvl;
  emit(s, 'HintViewed', `${ctx}#${lvl}`);
  return lvl;
}

// ------------------------------------------------------------------------------------------------ notebook view model
const FLOOR_NAME: Record<string, string> = { g: 'Begane grond', u: 'Boven', b: 'Kelder', x: 'Buiten' };
export function placeName(room: string): string {
  if (room === 'home') return 'Thuis';
  if (room === 'import') return 'Eerder spel';
  if (room === 'out') return 'Buiten';
  const r = ROOMS.find((q) => q.id === room);
  return r ? FLOOR_NAME[r.floor] ?? 'Buiten' : 'Buiten';
}
export interface NbSource {
  id: string; title: string; text: string; art?: () => string; diagram?: string;
  back?: { title: string; text: string; art?: () => string };
  provenance: string; seq: number; pinned: boolean; archived: boolean;
}
export interface NotebookView {
  observations: NbSource[]; // newest first, not archived
  research: {
    topics: { id: TopicId; title: string; line: string }[] | null; // null until the register was READ
    attention: TopicId | null;
    hud: boolean; // the player's own opt-in to show the attention in the HUD
    questions: Question[]; // own questions/ideas, not archived
    pinned: NbSource[];
    results: { id: string; text: string }[];
  };
  archive: { memories: { id: string; title: string; text: string; art?: () => string }[]; questions: Question[]; observations: NbSource[] };
}
export function notebookView(s: GameState): NotebookView {
  const x = sl(s);
  const order = Object.values(x.obs).sort((a, b) => a.seq - b.seq);
  const nb = (id: string): NbSource | null => {
    const o = x.obs[id], d = sourceDef(id);
    if (!o || !d) return null;
    const n = order.indexOf(o) + 1;
    const both = o.faces.includes('back');
    return {
      id, title: d.title, text: d.text, art: d.art, diagram: CLUES[id]?.diagram,
      back: both && d.back ? d.back : undefined,
      provenance: `${placeName(o.room)} · waarneming ${n}${both ? ' · voor- en achterkant bekeken' : ''}`,
      seq: o.seq, pinned: x.pins.includes(id), archived: x.archivedObs.includes(id),
    };
  };
  const all = order.map((o) => nb(o.id)).filter((v): v is NbSource => !!v);
  const memories: NotebookView['archive']['memories'] = s.clues.filter(isMemory).map((id) => ({ id, title: CLUES[id].title, text: CLUES[id].text }));
  if (x.results.includes(DS01_MEMORY.id)) memories.push({ ...DS01_MEMORY });
  const title = (id: string) => PUZZLES.find((p) => p.id === id.slice(7))?.title ?? id;
  return {
    observations: all.filter((o) => !o.archived).reverse(),
    research: {
      topics: registerTopics(s),
      attention: x.registerObserved ? x.attention : null,
      hud: x.hudAttention,
      questions: x.questions.filter((q) => !q.archived),
      pinned: all.filter((o) => o.pinned),
      results: x.results.filter((r) => r !== DS01_MEMORY.id).map((r) => ({ id: r, text: RESULT_TEXT[r] ?? (r.startsWith('legacy.') ? `Opgelost: ${title(r)}.` : r) })),
    },
    archive: { memories, questions: x.questions.filter((q) => q.archived), observations: all.filter((o) => o.archived) },
  };
}

// ------------------------------------------------------------------------------------------------ start states
/** The forecourt in front of the manor, facing the front door: the arrival context of the slice. */
export const SLICE_START_POSE = { x: 89.6, y: terrainHeight(89.6, 75.5), z: 75.5, yaw: 0, pitch: 0.02 }; // (90, 72) is inside the forecourt's centre piece
/** Fresh slice start: packed bag (as after the home tutorial), front door still locked, invitation read at home. */
export function freshSliceState(now = Date.now()): GameState {
  const s = defaultState(now);
  s.scene = 'estate';
  s.inventory = [...ESSENTIALS];
  s.flags = { leftHome: true };
  s.player.estate = { ...SLICE_START_POSE };
  sl(s);
  // the home tutorial opens the invitation when it is picked up: it really was read, at home
  recordObservation(s, 'c.invitation', 'home');
  syncDerived(s);
  return s;
}

/**
 * Old-save compatibility (explicit alias/migration, DEV-01 §7). Input: the player's own save text (read-only).
 * Output: a NEW GameState for the review namespace; the original is never modified or written back.
 *  - catalogue already solved (flag catalogSolved), studyKey owned, or lock.libraryDesk open → B01 counts as solved
 *    (alias `catalogSolved`): study access is kept, the drawer stays open, no replay; a key still in the drawer can
 *    be taken (RewardClaimed then), a key already taken counts as claimed.
 *  - unsolved catalogue placements (cat.* slots) are dropped: those books no longer exist (no penalty).
 *  - read clues become observations with provenance "Eerder spel"; clues of the removed catalogue
 *    (plan, guestbook, desk, card) are kept aside in legacyClues and never shown.
 *  - c.ledger already read (iteration 3 opened it on pickup) → RegisterObserved.
 *  - the followed thread (A/B/C) becomes "Mijn aandacht" only if the register was read.
 */
export function importMainSave(text: string | null): GameState | null {
  const s = parseSave(text);
  if (!s) return null;
  delete s.slice;
  const x = sl(s);
  for (const k of Object.keys(s.slots)) if (k.startsWith('cat.')) delete s.slots[k];
  const kept: string[] = [];
  const legacySolved = s.flags.catalogSolved === true || ownsItem(s, 'studyKey') || s.unlocked.includes(B01_LOCK);
  for (const id of s.clues) {
    if (REMOVED_SOURCES.includes(id)) { pushOnce(x.legacyClues, id); continue; }
    if (isMemory(id) || !sourceDef(id)) continue;
    x.obs[id] = { id, seq: ++x.seq, room: 'import', faces: ['front'] };
  }
  if (s.clues.includes('c.ledger') && ownsItem(s, 'ledger')) x.registerObserved = true;
  if (s.hints['p1.drawer']) x.hints.drawer = s.hints['p1.drawer'];
  if (x.registerObserved && TRACK_TO_TOPIC[s.track]) x.attention = TRACK_TO_TOPIC[s.track];
  if (s.flags.drawerLockSolved) x.encountered.push('drawer');
  if (legacySolved) {
    solveB01(s, 'catalogSolved');
    if (ownsItem(s, 'studyKey') && !s.taken.includes(B01_KEY_PICKUP)) s.taken.push(B01_KEY_PICKUP);
    kept.push('de leestafel in de bibliotheek (de studeerkamer blijft bereikbaar)');
  }
  if (s.flags.drawerLockSolved) kept.push('de lade in de hal');
  emit(s, 'Imported', legacySolved ? 'catalogSolved→b01' : 'plain');
  syncDerived(s);
  s.notice = 'Dit is een kopie van je eigen spel; je eigen opgeslagen spel wordt niet veranderd. ' +
    (kept.length ? `Wat al opgelost was, blijft opgelost: ${kept.join(' en ')}. ` : '') +
    'In deze testversie is de bibliotheekpuzzel vernieuwd en is je notitieboek anders ingedeeld.';
  return s;
}
