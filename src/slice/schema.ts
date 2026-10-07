// DEV-01 persisted slice state (schema `dev01/1`) and its sanitising parser. Dependency-free on purpose: core/state.ts
// imports this module, so it must not import game rules (no import cycle).
//
// Save contract (DEV01_SLICE.md §4):
// - The slice state rides in the ordinary GameState v4 as an OPTIONAL `slice` block. STATE_VERSION stays 4: the
//   block is additive, an older build simply drops it, and the normal game never writes it.
// - The review build (?review=dev01) saves under its own keys (fehluwe.dev01.save / .prev / .settings). The
//   player's own save (fehluwe.save) is only ever READ, to offer "start from a copy of my save".
import { LEGACY_FOLIO, type FolioId, type SlotId, type TopicId } from './ids';

/** 2 (DEV-01R): canon folio ids (stars/plants/travel, sources EB.folio.*). 1 (DEV-01): folio ids I/II/III. */
export const SLICE_SCHEMA = 2;

/** The six semantic events of DEV-01 §7, plus notebook bookkeeping (kept apart from them). */
export type SliceEventType =
  | 'ObservationRecorded' | 'Encountered' | 'RegisterObserved' | 'ItemAcquired' | 'PuzzleSolved' | 'RewardClaimed'
  | 'AttentionChanged' | 'Pinned' | 'Unpinned' | 'QuestionSaved' | 'Archived' | 'Unarchived' | 'HintViewed' | 'Imported';
export const SEMANTIC_EVENTS: SliceEventType[] = ['ObservationRecorded', 'Encountered', 'RegisterObserved', 'ItemAcquired', 'PuzzleSolved', 'RewardClaimed'];
export interface SliceEvent { type: SliceEventType; id: string; seq: number }

export type Face = 'front' | 'back';
/** One looked-at source: when (sequence number), where (room id under the player) and which faces were seen. */
export interface Observation { id: string; seq: number; room: string; faces: Face[] }
export interface Question { id: string; text: string; pins: string[]; seq: number; archived: boolean }

export interface SliceState {
  schema: number;
  seq: number; // monotone counter for observations / events / questions
  obs: Record<string, Observation>;
  encountered: string[]; // riddle contexts met (hint eligibility)
  registerObserved: boolean;
  attention: TopicId | null; // "Mijn aandacht" — never changes eligibility or world state
  pins: string[]; // pinned observation ids
  questions: Question[];
  archivedObs: string[];
  acquired: string[]; // items for which ItemAcquired was emitted
  results: string[]; // PuzzleSolved / RewardClaimed outcome ids, in order (see content RESULT_TEXT)
  b01: { slots: Record<SlotId, FolioId | null>; solved: boolean; legacy: 'catalogSolved' | null; wrong: number };
  ds01: { photoFound: boolean; photoBackSeen: boolean };
  hints: Record<string, number>; // highest hint level shown per context (0..3)
  legacyClues: string[]; // imported clue ids whose objects DEV-01 removed (kept for audit, never shown)
  log: SliceEvent[];
}
export const MAX_SLICE_LOG = 300;

export function defaultSlice(): SliceState {
  return {
    schema: SLICE_SCHEMA, seq: 0, obs: {}, encountered: [], registerObserved: false, attention: null, pins: [], questions: [],
    archivedObs: [], acquired: [], results: [],
    b01: { slots: { punt: null, rond: null, vierkant: null }, solved: false, legacy: null, wrong: 0 },
    ds01: { photoFound: false, photoBackSeen: false },
    hints: {}, legacyClues: [], log: [],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const strs = (v: unknown, max = 500) => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string'))].slice(0, max) : []);
const int = (v: unknown, lo: number, hi: number, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.floor(v))) : d);
const TOPIC_IDS = ['tafel', 'kantlijn', 'paden'];
const FOLIOS = ['stars', 'plants', 'travel'];
/** Schema 1 → 2: folio ids in slots and the folio source ids in observations, pins, questions and archive. */
const srcV1 = (id: string) => { const m = /^s\.b01\.folio\.(I{1,3})$/.exec(id); return m && LEGACY_FOLIO[m[1]] ? `EB.folio.${LEGACY_FOLIO[m[1]]}` : id; };
const EVENT_TYPES: string[] = ['ObservationRecorded', 'Encountered', 'RegisterObserved', 'ItemAcquired', 'PuzzleSolved', 'RewardClaimed', 'AttentionChanged', 'Pinned', 'Unpinned', 'QuestionSaved', 'Archived', 'Unarchived', 'HintViewed', 'Imported'];

/** Sanitise a stored slice block. Garbage → null (the caller starts a fresh slice); a future schema → null. */
export function parseSlice(raw: unknown): SliceState | null {
  if (!isObj(raw)) return null;
  const schema = int(raw.schema, 0, 1e6);
  if (schema < 1 || schema > SLICE_SCHEMA) return null;
  const d = defaultSlice();
  const v1 = schema === 1;
  const mapId = (id: string) => (v1 ? srcV1(id) : id);
  const strsM = (v: unknown, max = 500) => [...new Set(strs(v, max).map(mapId))];
  const obs: Record<string, Observation> = {};
  if (isObj(raw.obs)) for (const [k0, o] of Object.entries(raw.obs)) {
    if (!isObj(o)) continue;
    const k = mapId(k0);
    const faces = strs(o.faces).filter((f): f is Face => f === 'front' || f === 'back');
    obs[k] = { id: k, seq: int(o.seq, 0, 1e9), room: typeof o.room === 'string' ? o.room.slice(0, 40) : 'out', faces: faces.length ? faces : ['front'] };
  }
  const b = isObj(raw.b01) ? raw.b01 : {};
  const slots = { ...d.b01.slots };
  if (isObj(b.slots)) for (const k of Object.keys(slots) as SlotId[]) { let v = b.slots[k]; if (v1 && typeof v === 'string') v = LEGACY_FOLIO[v] ?? v; slots[k] = typeof v === 'string' && FOLIOS.includes(v) ? (v as FolioId) : null; }
  // a folio can lie in one slot only: later duplicates are dropped
  const seen = new Set<string>();
  for (const k of Object.keys(slots) as SlotId[]) { const f = slots[k]; if (f && seen.has(f)) slots[k] = null; else if (f) seen.add(f); }
  const ds = isObj(raw.ds01) ? raw.ds01 : {};
  const hints: Record<string, number> = {};
  if (isObj(raw.hints)) for (const [k, n] of Object.entries(raw.hints)) hints[k] = int(n, 0, 3);
  const questions: Question[] = Array.isArray(raw.questions)
    ? raw.questions.filter(isObj).slice(0, 100).map((q, i) => ({ id: typeof q.id === 'string' ? q.id : `q${i}`, text: typeof q.text === 'string' ? q.text.slice(0, 600) : '', pins: strsM(q.pins, 30), seq: int(q.seq, 0, 1e9), archived: q.archived === true }))
    : [];
  const log: SliceEvent[] = Array.isArray(raw.log)
    ? raw.log.filter(isObj).filter((e) => typeof e.type === 'string' && EVENT_TYPES.includes(e.type) && typeof e.id === 'string').slice(-MAX_SLICE_LOG).map((e) => ({ type: e.type as SliceEventType, id: e.id as string, seq: int(e.seq, 0, 1e9) }))
    : [];
  const photoFound = ds.photoFound === true;
  return {
    schema: SLICE_SCHEMA,
    seq: int(raw.seq, 0, 1e9),
    obs,
    encountered: strs(raw.encountered),
    registerObserved: raw.registerObserved === true,
    attention: typeof raw.attention === 'string' && TOPIC_IDS.includes(raw.attention) ? (raw.attention as TopicId) : null,
    pins: strsM(raw.pins),
    questions,
    archivedObs: strsM(raw.archivedObs),
    acquired: strs(raw.acquired),
    results: strs(raw.results),
    b01: { slots, solved: b.solved === true, legacy: b.legacy === 'catalogSolved' ? 'catalogSolved' : null, wrong: int(b.wrong, 0, 1e5) },
    // the back can only have been seen after the front: never keep back-without-front
    ds01: { photoFound, photoBackSeen: photoFound && ds.photoBackSeen === true },
    hints,
    legacyClues: strs(raw.legacyClues),
    log,
  };
}
