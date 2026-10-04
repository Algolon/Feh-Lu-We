// Authoritative, versioned game state. Everything that must survive a reload lives here.
// World visuals are derived from this state (see World.syncAll), never the other way round.

export const SAVE_KEY = 'fehluwe.save';
export const SETTINGS_KEY = 'fehluwe.settings';
export const STATE_VERSION = 2;

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
  stats: { playMs: number; startedAt: number; finishedAt: number | null };
}

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
    stats: { playMs: 0, startedAt: now, finishedAt: null },
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
    pitch: finite(v.pitch, 0),
  };
  return Number.isFinite(p.x) && Number.isFinite(p.z) ? p : null;
}

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
  const d = defaultState();
  const slots: Record<string, string | null> = {};
  if (isObj(data.slots)) for (const [k, s] of Object.entries(data.slots)) slots[k] = typeof s === 'string' ? s : null;
  const seq: Record<string, string[]> = {};
  if (isObj(data.seq)) for (const [k, s] of Object.entries(data.seq)) seq[k] = strArr(s);
  const players: Record<string, PlayerPose | null> = { home: null, estate: null };
  if (isObj(data.player)) for (const [k, p] of Object.entries(data.player)) players[k] = pose(p);
  const stats = isObj(data.stats) ? data.stats : {};
  return {
    version: STATE_VERSION,
    scene: data.scene === 'estate' ? 'estate' : 'home',
    finished: data.finished === true,
    inventory: [...new Set(strArr(data.inventory))],
    used: [...new Set(strArr(data.used))],
    taken: [...new Set(strArr(data.taken))],
    open: boolRec(data.open),
    unlocked: [...new Set(strArr(data.unlocked))],
    lit: boolRec(data.lit),
    flags: boolRec(data.flags),
    clues: [...new Set(strArr(data.clues))],
    seq,
    slots,
    hints: numRec(data.hints),
    wrong: numRec(data.wrong),
    player: players,
    stats: {
      playMs: finite(stats.playMs, 0),
      startedAt: finite(stats.startedAt, d.stats.startedAt),
      finishedAt: typeof stats.finishedAt === 'number' ? stats.finishedAt : null,
    },
  };
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

/** localStorage wrapper that never throws (private mode, quota, disabled storage). */
export const storage = {
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): boolean {
    try {
      globalThis.localStorage?.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string) {
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
