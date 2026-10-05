// Authoritative, versioned game state. Everything that must survive a reload lives here.
// World visuals are derived from this state (see World.syncAll), never the other way round.
import { ITEMS, LEGACY_ITEMS, SEALS } from '../content/items';
import { REVIEW } from './artflags';
import { CLUES } from '../content/clues';
import { SYMBOLS } from '../content/symbols';
import { SERVICE, CATALOG, CONSOLE_SOCKETS } from '../content/canon';

export const SAVE_KEY = 'fehluwe.save';
export const SETTINGS_KEY = 'fehluwe.settings';
export const STATE_VERSION = 4;
export const BACKUP_KEY = 'fehluwe.save.prev';

export type SceneId = 'home' | 'estate';

export interface PlayerPose {
  x: number; // plan X (east)
  y: number; // feet height
  z: number; // plan Z (north)
  yaw: number; // radians, 0 = facing north, +PI/2 = facing east
  pitch: number;
}

export interface GameState {
  version: number;
  scene: SceneId;
  finished: boolean;
  inventory: string[]; // item ids currently carried
  used: string[]; // items consumed or installed in the world
  taken: string[]; // pickup entity ids removed from the world
  open: Record<string, boolean>; // doors / drawers / lids
  unlocked: string[]; // lock ids opened with a key or puzzle
  lit: Record<string, boolean>; // lamps, fires, heater, torch
  flags: Record<string, boolean>; // puzzle / story flags
  clues: string[]; // notebook entries recorded
  seq: Record<string, string[]>; // partial sequence attempts (e.g. garden lanterns)
  slots: Record<string, string | null>; // item placed in a slot
  hints: Record<string, number>; // highest hint level viewed per puzzle
  wrong: Record<string, number>; // wrong attempts per puzzle (playtest metric)
  player: Record<string, PlayerPose | null>; // last safe pose per scene
  stats: Stats;
  events: PlayEvent[]; // local-only playtest log (never sent anywhere)
  dials: Record<string, number>; // numeric wheel/plate positions
  track: string; // story thread followed in the objective line ('auto' = automatic)
  /** Completion record of the previous chapter (iteration 2 ending), kept when an old save is migrated. */
  archive: { chapter1Finished: boolean; finishedAt: number | null; minutes: number | null } | null;
  notice: string | null; // one-time message shown after loading (e.g. migration summary)
}

/**
 * Playtest timing. activeMs: visible tab, game running, INCLUDING reading/puzzle panels/notebook/hints.
 * moveMs: subset of active time spent moving. pausedMs: pause menu open or tab hidden while a session runs.
 * finishedActiveMs is frozen at the ending so later wandering does not change the reported duration.
 */
export interface Stats {
  activeMs: number;
  moveMs: number;
  pausedMs: number;
  startedAt: number;
  finishedAt: number | null;
  finishedActiveMs: number | null;
}
export interface PlayEvent { t: number; e: string; id?: string }
export const MAX_EVENTS = 400;

export interface Settings {
  lookSensitivity: number; // 0.3 .. 2.5
  moveSensitivity: number; // 0.5 .. 1.5 joystick response
  quality: 'low' | 'high';
  reducedMotion: boolean;
  muted: boolean;
  invertY: boolean;
}

export function defaultState(now = Date.now()): GameState {
  return {
    version: STATE_VERSION,
    scene: 'home',
    finished: false,
    inventory: [],
    used: [],
    taken: [],
    open: {},
    unlocked: [],
    lit: {},
    flags: {},
    clues: [],
    seq: {},
    slots: {},
    hints: {},
    wrong: {},
    player: { home: null, estate: null },
    stats: { activeMs: 0, moveMs: 0, pausedMs: 0, startedAt: now, finishedAt: null, finishedActiveMs: null },
    events: [],
    dials: {},
    track: 'auto',
    archive: null,
    notice: null,
  };
}

export function defaultSettings(coarsePointer = false): Settings {
  return {
    lookSensitivity: 1,
    moveSensitivity: 1,
    quality: coarsePointer ? 'low' : 'high',
    reducedMotion: false,
    muted: false,
    invertY: false,
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []);
const boolRec = (v: unknown): Record<string, boolean> => {
  const out: Record<string, boolean> = {};
  if (isObj(v)) for (const [k, b] of Object.entries(v)) if (typeof b === 'boolean') out[k] = b;
  return out;
};
const numRec = (v: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  if (isObj(v)) for (const [k, n] of Object.entries(v)) if (typeof n === 'number' && Number.isFinite(n)) out[k] = n;
  return out;
};
const finite = (n: unknown, d: number) => (typeof n === 'number' && Number.isFinite(n) ? n : d);

function pose(v: unknown): PlayerPose | null {
  if (!isObj(v)) return null;
  const p = {
    x: finite(v.x, NaN),
    y: finite(v.y, 0),
    z: finite(v.z, NaN),
    yaw: finite(v.yaw, 0),
    pitch: Math.max(-1.4, Math.min(1.4, finite(v.pitch, 0))),
  };
  // outside any scene's bounds → no pose (the game then uses spawn/checkpoints)
  if (!(p.x > -5 && p.x < 185 && p.z > -5 && p.z < 155 && p.y > -5 && p.y < 12)) return null;
  return p;
}
const known = (reg: Record<string, unknown>) => (ids: string[]) => ids.filter((id) => Object.prototype.hasOwnProperty.call(reg, id));
/** Valid placement slots and the pieces each accepts (service tags, catalogue books, seals). */
const SLOT_RULES: Record<string, string[]> = {
  ...Object.fromEntries(SERVICE.slots.map((x) => [`svc.${x.id}`, SERVICE.tags.map((t) => t.id)])),
  ...Object.fromEntries(CATALOG.sockets.map((x) => [`cat.${x.id}`, CATALOG.books.map((b) => b.id)])),
  ...Object.fromEntries(CONSOLE_SOCKETS.map((x) => [`con.${x}`, SEALS])),
};
const THREAD_IDS = ['auto', 'start', 'A', 'B', 'C', 'D'];
const knownItems = known(ITEMS), knownClues = known(CLUES), knownSymbols = known(SYMBOLS);
const count = (n: unknown, max: number) => Math.min(max, Math.max(0, Math.floor(finite(n, 0))));

/** Migrate older save shapes forward. Unknown/garbage input yields null (caller falls back to a new game). */
export function migrate(raw: unknown): GameState | null {
  if (!isObj(raw)) return null;
  let v = finite(raw.version, 0);
  if (v < 1 || v > STATE_VERSION) return null;
  const data: Record<string, unknown> = { ...raw };
  if (v === 1) {
    // v1 stored a single player pose; v2 keeps one per scene.
    const scene = data.scene === 'estate' ? 'estate' : 'home';
    data.player = { [scene]: data.player ?? null };
    v = 2;
  }
  if (v === 2) {
    // v3 splits playtime into active/move/paused and adds a local event log.
    const st = isObj(data.stats) ? data.stats : {};
    data.stats = { ...st, activeMs: st.playMs, moveMs: 0, pausedMs: 0, finishedActiveMs: typeof st.finishedAt === 'number' ? st.playMs : null };
    data.events = [];
    v = 3;
  }
  if (v === 3) migrateV3toV4(data);
  const d = defaultState();
  // Registry validation: unknown item/clue/symbol ids are dropped instead of crashing UI later.
  const slots: Record<string, string | null> = {};
  if (isObj(data.slots)) for (const [k, acc] of Object.entries(SLOT_RULES)) { if (!(k in data.slots)) continue; const v2 = data.slots[k]; slots[k] = typeof v2 === 'string' && acc.includes(v2) ? v2 : null; }
  const dials: Record<string, number> = {};
  for (const [k, n] of Object.entries(numRec(data.dials))) if (/^plate\.(tafel|boek|boom)$/.test(k)) dials[k] = count(n, 3);
  const seq: Record<string, string[]> = {};
  if (isObj(data.seq)) for (const [k, s] of Object.entries(data.seq)) seq[k] = knownSymbols(strArr(s)).slice(0, 8);
  const hints: Record<string, number> = {};
  for (const [k, n] of Object.entries(numRec(data.hints))) hints[k] = count(n, 3);
  const wrong: Record<string, number> = {};
  for (const [k, n] of Object.entries(numRec(data.wrong))) wrong[k] = count(n, 100000);
  const events: PlayEvent[] = Array.isArray(data.events)
    ? data.events.filter((e): e is PlayEvent => isObj(e) && typeof e.e === 'string' && Number.isFinite(e.t)).slice(-MAX_EVENTS).map((e) => ({ t: e.t, e: e.e, ...(typeof e.id === 'string' ? { id: e.id } : {}) }))
    : [];
  const players: Record<string, PlayerPose | null> = { home: null, estate: null };
  if (isObj(data.player)) for (const k of ['home', 'estate']) players[k] = pose(data.player[k]);
  const arc = isObj(data.archive) ? data.archive : null;
  const stats = isObj(data.stats) ? data.stats : {};
  return {
    version: STATE_VERSION,
    scene: data.scene === 'estate' ? 'estate' : 'home',
    finished: data.finished === true,
    inventory: knownItems([...new Set(strArr(data.inventory))]),
    used: knownItems([...new Set(strArr(data.used))]),
    taken: [...new Set(strArr(data.taken))],
    open: boolRec(data.open),
    unlocked: [...new Set(strArr(data.unlocked))],
    lit: boolRec(data.lit),
    flags: boolRec(data.flags),
    clues: knownClues([...new Set(strArr(data.clues))]),
    seq,
    slots,
    hints,
    wrong,
    player: players,
    stats: {
      activeMs: count(stats.activeMs, 1e10),
      moveMs: count(stats.moveMs, 1e10),
      pausedMs: count(stats.pausedMs, 1e10),
      startedAt: finite(stats.startedAt, d.stats.startedAt),
      finishedAt: typeof stats.finishedAt === 'number' && Number.isFinite(stats.finishedAt) ? stats.finishedAt : null,
      finishedActiveMs: typeof stats.finishedActiveMs === 'number' && Number.isFinite(stats.finishedActiveMs) ? Math.max(0, stats.finishedActiveMs) : null,
    },
    events,
    dials,
    track: typeof data.track === 'string' && THREAD_IDS.includes(data.track) ? data.track : 'auto',
    archive: arc ? {
      chapter1Finished: arc.chapter1Finished === true,
      finishedAt: typeof arc.finishedAt === 'number' && Number.isFinite(arc.finishedAt) ? arc.finishedAt : null,
      minutes: typeof arc.minutes === 'number' && Number.isFinite(arc.minutes) ? Math.max(0, arc.minutes) : null,
    } : null,
    notice: typeof data.notice === 'string' ? data.notice.slice(0, 600) : null,
  };
}

/**
 * v3 → v4 (iteration 3: expanded estate, new story). Keeps tools and the solved retained puzzles (their rewards
 * wait in the opened containers), drops items of the old cottage route, resets positions (the estate was rebuilt;
 * the game then uses a named safe spawn) and archives an old completion instead of silently resetting it.
 */
function migrateV3toV4(data: Record<string, unknown>) {
  const flags = isObj(data.flags) ? { ...data.flags } as Record<string, unknown> : {};
  const inv = strArr(data.inventory).filter((i) => !LEGACY_ITEMS.includes(i));
  const unlocked = strArr(data.unlocked);
  const open: Record<string, unknown> = {};
  const kept: string[] = [];
  if (flags.drawerLockSolved === true) { open['hall.drawer'] = true; kept.push('de lade in de hal'); }
  if (flags.studyLockSolved === true) { open['study.compartment'] = true; kept.push('het bureau in de studeerkamer'); }
  if (flags.cabinetPanelSolved === true) {
    open['cab.upper'] = true;
    // the conservatory is now locked behind the service plan; a solved cabinet keeps its doors open
    unlocked.push('lock.door.consWest', 'lock.door.consEast');
    kept.push('de tegels van de kast in de serre');
  }
  if (flags.lanternsSolved === true) { open['lantern.stone'] = true; unlocked.push('lock.lanternStone'); kept.push('de tuinlantaarns'); }
  if (flags.firePlateRead === true) kept.push('de vuurplaats');
  for (const f of ['cottageSolved', 'endingShown', 'crankInstalled', 'wellRaised', 'wellOpened']) delete flags[f];
  const stats = isObj(data.stats) ? data.stats : {};
  const finished = data.finished === true;
  data.archive = finished ? { chapter1Finished: true, finishedAt: typeof stats.finishedAt === 'number' ? stats.finishedAt : null, minutes: typeof stats.finishedActiveMs === 'number' ? Math.round(stats.finishedActiveMs / 60000) : null } : null;
  data.finished = false;
  if (isObj(data.stats)) data.stats = { ...stats, finishedAt: null, finishedActiveMs: null };
  data.flags = flags;
  data.inventory = inv;
  data.used = strArr(data.used).filter((i) => !LEGACY_ITEMS.includes(i));
  data.unlocked = [...new Set(unlocked)];
  data.open = { ...(isObj(data.open) ? data.open : {}), ...open };
  data.slots = {};
  data.lit = isObj(data.lit) ? Object.fromEntries(Object.entries(data.lit).filter(([k]) => ['torch', 'fire.clearing', 'lantern.firepost', 'home.candle'].includes(k))) : {};
  data.player = { home: null, estate: null }; // the estate was rebuilt: start at the forecourt
  data.track = 'auto';
  data.notice = (finished ? 'Je had het vorige hoofdstuk al uitgespeeld; die afsluiting is bewaard. ' : '') +
    'Het landgoed is gegroeid: een groter landhuis met een kelder, en diep in het bos een heuvel. ' +
    (kept.length ? `Wat je al had opgelost, blijft opgelost: ${kept.join(', ')}. ` : '') +
    'Nieuw: drie zegels, drie draden in je notitieboek, en een route die verder gaat dan het huisje.';
}

export function parseSave(text: string | null): GameState | null {
  if (!text) return null;
  try {
    return migrate(JSON.parse(text));
  } catch {
    return null;
  }
}

export function parseSettings(text: string | null, coarse: boolean): Settings {
  const d = defaultSettings(coarse);
  if (!text) return d;
  try {
    const r = JSON.parse(text);
    if (!isObj(r)) return d;
    const clamp = (n: unknown, lo: number, hi: number, def: number) => Math.min(hi, Math.max(lo, finite(n, def)));
    return {
      lookSensitivity: clamp(r.lookSensitivity, 0.3, 2.5, d.lookSensitivity),
      moveSensitivity: clamp(r.moveSensitivity, 0.5, 1.5, d.moveSensitivity),
      quality: r.quality === 'low' || r.quality === 'high' ? r.quality : d.quality,
      reducedMotion: r.reducedMotion === true,
      muted: r.muted === true,
      invertY: r.invertY === true,
    };
  } catch {
    return d;
  }
}

/** In art-review mode (?review=…) nothing is written to or read from the real save slots: the review runs on an
 * in-memory sandbox, so opening a review link can never overwrite, reset or migrate the player's own game.
 * Settings are the one key read through from localStorage (read-only) so quality/sensitivity match the device. */
const sandbox: Map<string, string> | null = REVIEW ? new Map() : null;

/** localStorage wrapper that never throws (private mode, quota, disabled storage). */
export const storage = {
  get(key: string): string | null {
    if (sandbox) {
      if (sandbox.has(key)) return sandbox.get(key)!;
      if (key !== SETTINGS_KEY) return null;
    }
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): boolean {
    if (sandbox) { sandbox.set(key, value); return true; }
    try {
      globalThis.localStorage?.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string) {
    if (sandbox) { sandbox.delete(key); return; }
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

// Small helpers used by rules and world code.
export const has = (s: GameState, item: string) => s.inventory.includes(item);
export const flag = (s: GameState, f: string) => s.flags[f] === true;
export function give(s: GameState, item: string) {
  if (!s.inventory.includes(item) && !s.used.includes(item)) s.inventory.push(item);
}
export function consume(s: GameState, item: string) {
  s.inventory = s.inventory.filter((i) => i !== item);
  if (!s.used.includes(item)) s.used.push(item);
}
export function addClue(s: GameState, id: string): boolean {
  if (s.clues.includes(id)) return false;
  s.clues.push(id);
  return true;
}

/** Append a local playtest event (bounded). */
export function logEvent(s: GameState, e: string, id?: string) {
  s.events.push(id ? { t: Math.round(s.stats.activeMs), e, id } : { t: Math.round(s.stats.activeMs), e });
  if (s.events.length > MAX_EVENTS) s.events.splice(0, s.events.length - MAX_EVENTS);
}
