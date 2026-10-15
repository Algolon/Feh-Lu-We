// DEV-04D W01 — the repeatable Wickerman ritual: pure rules (no renderer, no DOM; unit-tested in tests/dev04d-w01.test.ts).
//
//   READY ──light ring──► RING_LIT ──ignite──► BURNING ──settles (≈ 80 s)──► CHARRED ──clean──► EMPTY_FRAME
//     ▲   ◄──blow out────                       (candles go out one by one                          │ take hay at the bale
//     │                                          at the end of the burn)                            ▼
//     └──────────────────────────── refill (≈ 1.6 s) ◄──────────────────────────────────── CARRYING_HAY (session only)
//
// Persistent state: three booleans in the open `state.lit` record (save version 4, no schema change, no top-level key):
//   wicker.candles  the ring burns          wicker.figure  burned, not yet cleaned          wicker.empty  cleaned, no hay
// A key that is false is deleted, so a completed ritual leaves `lit` exactly as a new game has it (no drift over cycles).
// Session state (never saved): whether a burn runs in this session, and whether a hay bundle is being carried.
// Optional environmental content: these rules only ever touch `state.lit['wicker.*']` (never flags, items or puzzles).
import type { GameState } from '../core/state';
import type { Outcome } from '../puzzles/rules';
import { has } from '../core/state';

export const WICKER_KEYS = { candles: 'wicker.candles', figure: 'wicker.figure', empty: 'wicker.empty' } as const;
export const WICKER_IDS = { candles: 'wicker.candles', figure: 'wicker.figure', bale: 'wicker.bale' } as const;

export type WickerStage = 'READY' | 'RING_LIT' | 'BURNING' | 'CHARRED' | 'EMPTY_FRAME' | 'CARRYING_HAY';
/** Session-only ritual state (owned by the setpiece; a reload starts from `{ burning: false, carrying: false }`). */
export interface WickerSession { burning: boolean; carrying: boolean }
export const newSession = (): WickerSession => ({ burning: false, carrying: false });

export const candlesLit = (s: GameState) => s.lit[WICKER_KEYS.candles] === true;
/** Burned and not yet cleaned (burning in this session, or the charred remnant). */
export const figureLit = (s: GameState) => s.lit[WICKER_KEYS.figure] === true && !frameEmpty(s);
export const frameEmpty = (s: GameState) => s.lit[WICKER_KEYS.empty] === true;
const set = (s: GameState, k: string, v: boolean) => { if (v) s.lit[k] = true; else delete s.lit[k]; };

/** The stage for a state + session. `figure && empty` (only reachable by editing a save) reads as EMPTY_FRAME. */
export function wickerStage(s: GameState, sess: WickerSession = newSession()): WickerStage {
  if (frameEmpty(s)) return sess.carrying ? 'CARRYING_HAY' : 'EMPTY_FRAME';
  if (s.lit[WICKER_KEYS.figure] === true) return sess.burning ? 'BURNING' : 'CHARRED';
  return candlesLit(s) ? 'RING_LIT' : 'READY';
}

/**
 * Load normalisation (DEV04D_WICKERMAN_DESIGN §3.1), applied once when a world first sees the state:
 * `figure && empty` → EMPTY_FRAME (figure cleared); a burned figure loads charred with the ring OUT (a burn completed
 * off-screen has extinguished its candles; this also reinterprets C / C-R saves that kept the ring lit forever).
 * A carried bundle and a running burn are never restored. Returns true when the state changed.
 */
export function normaliseWicker(s: GameState): boolean {
  const before = JSON.stringify([s.lit[WICKER_KEYS.candles], s.lit[WICKER_KEYS.figure], s.lit[WICKER_KEYS.empty]]);
  for (const k of Object.values(WICKER_KEYS)) if (k in s.lit && s.lit[k] !== true) delete s.lit[k];
  if (frameEmpty(s)) set(s, WICKER_KEYS.figure, false);
  else if (s.lit[WICKER_KEYS.figure] === true) set(s, WICKER_KEYS.candles, false);
  return before !== JSON.stringify([s.lit[WICKER_KEYS.candles], s.lit[WICKER_KEYS.figure], s.lit[WICKER_KEYS.empty]]);
}

const ok = (msg: string, sfx: Outcome['sfx'] = 'fire'): Outcome => ({ ok: true, msg, sfx });
const no = (msg: string, sfx: Outcome['sfx'] = 'fail'): Outcome => ({ ok: false, msg, sfx });

/** Use an item on the candle ring. Matches light it (any stage but a running burn); anything else does nothing. */
export function lightCandles(s: GameState, item: string, sess: WickerSession = newSession()): Outcome {
  if (wickerStage(s, sess) === 'BURNING') return no('Het vuur brandt al; de kring doet nu niets.', 'none');
  if (item !== 'matches') return no('Daarmee krijg je de kaarsen niet aan.');
  if (!has(s, 'matches')) return no('Je hebt geen lucifers.');
  if (candlesLit(s)) return no('De kaarsen branden al.', 'none');
  set(s, WICKER_KEYS.candles, true);
  return ok('Je loopt de kring rond en steekt de kaarsen een voor een aan. Het licht trekt naar de stroman in het midden.');
}
/** The default action on a lit ring blows it out again (the figure is unaffected). Not during a burn. */
export function blowCandles(s: GameState, sess: WickerSession = newSession()): Outcome {
  if (wickerStage(s, sess) === 'BURNING') return no('Laat het vuur zijn gang gaan.', 'none');
  if (!candlesLit(s)) return no('De kaarsen zijn al uit.', 'none');
  set(s, WICKER_KEYS.candles, false);
  return ok('Je blaast de kaarsen een voor een uit.', 'click');
}
/** Use an item on the figure: only matches, only a filled figure, only once the ring burns (the C gate). */
export function igniteFigure(s: GameState, item: string, sess: WickerSession = newSession()): Outcome {
  const st = wickerStage(s, sess);
  if (st === 'BURNING' || st === 'CHARRED') return no('Er valt niets meer aan te steken.', 'none');
  if (st === 'EMPTY_FRAME' || st === 'CARRYING_HAY') return no('Er zit geen hooi in; er valt niets aan te steken.', 'none');
  if (item !== 'matches') return no('Daarmee krijg je het hooi niet aan.');
  if (!has(s, 'matches')) return no('Je hebt geen lucifers.');
  if (st !== 'RING_LIT') return no('Het voelt niet goed om hem zomaar aan te steken. Eerst de kaarsen in de kring.', 'none');
  set(s, WICKER_KEYS.figure, true);
  sess.burning = true;
  return ok('Het droge hooi vat vlam aan de voeten. Het vuur kruipt omhoog door het wilgentenen lijf.');
}
/** The burn has run its course (automatic): the remnant stays, the ring is out. */
export function settleBurn(s: GameState, sess: WickerSession): boolean {
  if (!sess.burning) return false;
  sess.burning = false;
  set(s, WICKER_KEYS.candles, false);
  return true;
}
/** Clean the charred figure: ash and remnant go, the willow frame stays (CHARRED → EMPTY_FRAME). */
export function cleanFigure(s: GameState, sess: WickerSession = newSession()): Outcome {
  if (wickerStage(s, sess) !== 'CHARRED') return no('Er valt hier niets schoon te maken.', 'none');
  set(s, WICKER_KEYS.figure, false);
  set(s, WICKER_KEYS.empty, true);
  return ok('Je veegt de as en de verkoolde resten uit het wilgen-geraamte.', 'none');
}
/** Take one bundle from the bale (EMPTY_FRAME only; session state, never an inventory item). */
export function takeHay(s: GameState, sess: WickerSession): Outcome {
  if (wickerStage(s, sess) !== 'EMPTY_FRAME') return no('Je hebt nu geen hooi nodig.', 'none');
  sess.carrying = true;
  return ok('Je trekt een bundel hooi uit de baal.', 'none');
}
/** Put the bundle back (on the bale, or released by selecting an item / leaving the clearing). */
export function putHayBack(sess: WickerSession): boolean {
  const was = sess.carrying;
  sess.carrying = false;
  return was;
}
/**
 * Refill the empty frame with the carried bundle (one bundle, one trip): back to READY. The ring is always out
 * afterwards, so candles lit around an empty frame never let the next ritual skip its candle phase.
 */
export function refillFigure(s: GameState, sess: WickerSession): Outcome {
  const st = wickerStage(s, sess);
  if (st === 'EMPTY_FRAME') return no('Je hebt geen hooi bij je. Er staat een baal aan de rand van de open plek.', 'none');
  if (st !== 'CARRYING_HAY') return no('De stroman zit al vol.', 'none');
  sess.carrying = false;
  set(s, WICKER_KEYS.empty, false);
  set(s, WICKER_KEYS.candles, false);
  return ok('Je propt het hooi in het wilgen-geraamte, van de voeten tot de kruin.', 'none');
}

/** Feedback text for the figure (kept for the C voice; the setpiece itself shows no toast). */
export function figureMessage(s: GameState, sess: WickerSession = newSession()): string {
  switch (wickerStage(s, sess)) {
    case 'BURNING': return 'Het vuur raast door het wilgentenen lijf.';
    case 'CHARRED': return 'Alleen het zwartgeblakerde wilgen-geraamte staat nog overeind, vol as en verkoold hooi.';
    case 'EMPTY_FRAME': return 'Een leeg wilgen-geraamte. Bij de baal aan de rand ligt hooi.';
    case 'CARRYING_HAY': return 'Het lege geraamte wacht op het hooi in je armen.';
    case 'READY': return 'Een stroman van wilgentenen, volgepakt met droog hooi. De kaarsen in de kring eromheen zijn niet aan.';
    default: return has(s, 'matches') ? 'De kaarsen branden. Neem de lucifers in de hand om de stroman aan te steken.' : 'De kaarsen branden. Je hebt niets om de stroman mee aan te steken.';
  }
}

// ------------------------------------------------------------------------------------------------ prompts
/** Prompt for the figure's default action (null = no prompt: nothing to do while it burns). */
export function figurePrompt(s: GameState, sess: WickerSession): string | null {
  switch (wickerStage(s, sess)) {
    case 'READY': return 'Stroman — eerst de kaarsen';
    case 'RING_LIT': return has(s, 'matches') ? 'Stroman aansteken' : 'Stroman (geen lucifers)';
    case 'BURNING': return null;
    case 'CHARRED': return 'Stroman schoonmaken';
    case 'EMPTY_FRAME': return 'Lege stroman — haal hooi';
    case 'CARRYING_HAY': return 'Hooi in de stroman stoppen';
  }
}
/** Prompt for the ring's default action (null during a burn: the ritual runs its course). */
export function ringPrompt(s: GameState, sess: WickerSession): string | null {
  if (wickerStage(s, sess) === 'BURNING') return null;
  return candlesLit(s) ? 'Kaarsen uitblazen' : has(s, 'matches') ? 'Kaarsen aansteken' : 'Kaarsen (geen lucifers)';
}
/** Prompt for the bale: only while the frame is empty (World = where to go, Focus = what is usable). */
export function balePrompt(s: GameState, sess: WickerSession): string | null {
  const st = wickerStage(s, sess);
  return st === 'EMPTY_FRAME' ? 'Hooi pakken' : st === 'CARRYING_HAY' ? 'Hooi terugleggen' : null;
}

// ------------------------------------------------------------------------------------------------ timelines
/** DEV-04C-R: the candle sweep round the ring (s): ~0.4 s per candle — readable, not tedious. */
export const CANDLE_SWEEP = 3.6;
/** How many of `n` candles burn at sweep progress `reveal` (0..1): candle i lights once its rank (i + 0.5) / n is reached. */
export const candlesShown = (reveal: number, n: number) => Math.max(0, Math.min(n, Math.floor(reveal * n + 0.5)));

/** Burn timeline (seconds since ignition in this session): catch 0–5, build 5–20, peak 20–50, decline 50–66, settle 66–80. */
export const WICKER_BURN = { catch: 5, build: 20, peak: 50, charEnd: 62, fadeStart: 66, settled: 80 } as const;
/** W01: the candles go out one by one (reverse sweep order) inside the settle phase. */
export const CANDLES_OUT = { start: 68, end: 78 } as const;
/** W01 transitions (s). */
export const CLEAN_TIME = 1.8;
export const REFILL_TIME = 1.6;
/** W01: residual ember spots fade over this long after the burn settles (a loaded remnant is cold). */
export const AFTERGLOW = 60;
/** W01: a carried bundle goes back to the bale beyond this distance (m) from the figure. */
export const CARRY_RADIUS = 12;

export interface BurnLook {
  /** flame size, 0..1 (lower body / upper body) */ flameLow: number; flameHigh: number;
  /** char front, 0 (feet) .. 1 (above the head) */ char: number;
  /** ember band at the char front, 0..1 */ glow: number;
  /** smouldering remains at the feet, 0..1 */ smoulder: number;
  /** light intensity factor, 0..1 */ light: number;
  /** settled aftermath (static) */ settled: boolean;
}
export const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** The look at `t` seconds after ignition; `t === null` = not ignited; `Infinity` = loaded burned (aftermath). */
export function burnLook(t: number | null): BurnLook {
  if (t === null) return { flameLow: 0, flameHigh: 0, char: 0, glow: 0, smoulder: 0, light: 0, settled: false };
  const B = WICKER_BURN;
  const fade = 1 - ss(B.fadeStart, B.settled, t);
  const char = Math.min(1, 0.12 * ss(0, B.catch, t) + 0.88 * ss(B.catch * 0.6, B.charEnd, t));
  return {
    flameLow: ss(0, B.catch, t) * fade,
    flameHigh: ss(B.catch * 0.8, B.catch * 3, t) * fade,
    char,
    glow: Math.min(1, ss(0, 2, t)) * (1 - ss(B.charEnd - 4, B.settled, t)),
    smoulder: ss(B.fadeStart - 6, B.settled, t),
    light: Math.max(0.12 * ss(B.fadeStart - 6, B.settled, t), ss(0, B.catch, t) * fade),
    settled: t >= B.settled,
  };
}
/** Residual ember strength after the burn (1 at the settle, 0 after AFTERGLOW s; a loaded remnant = 0). */
export const afterglow = (t: number | null) => (t === null || !Number.isFinite(t) ? 0 : t < WICKER_BURN.settled ? 1 : 1 - ss(WICKER_BURN.settled, WICKER_BURN.settled + AFTERGLOW, t));
/** Sweep reveal of the ring while the candles go out at the end of the burn (1 = all lit → 0 = all out). */
export const candlesOutReveal = (t: number) => 1 - Math.min(1, Math.max(0, (t - CANDLES_OUT.start) / (CANDLES_OUT.end - CANDLES_OUT.start)));
/** Refill front for transition progress p (0..1): the hay fills from the feet up, the tufts last. */
export const fillFront = (p: number) => ss(0, 1, p) * 1.04;
/** Clean transition: willow char (1 → 0, receding downward), remnant height kept (1 → 0, crumbling top-down), ash. */
export function cleanLook(p: number) {
  const q = Math.min(1, Math.max(0, p));
  return { char: 1 - ss(0.15, 1, q), remnant: 1 - ss(0, 0.8, q), ash: 1 - ss(0.35, 1, q), puff: q < 1 ? Math.sin(Math.PI * Math.min(1, q * 1.4)) : 0 };
}

// ------------------------------------------------------------------------------------------------ audio mix
/**
 * The ritual soundscape for `t` seconds after ignition (null = no burn this session), each layer 0..1. Follows the
 * burn arc: catch 0–5 (fire body, first cracks) → build 5–20 (drone fades in, pulse starts) → peak 20–50 (all layers,
 * densest crackle) → decline 50–66 (pulse stops, drone thins) → settle 66–80 (ember hiss) → silence.
 */
export interface RitualMix { body: number; crackle: number; snap: number; drone: number; pulse: number; air: number; hiss: number }
export const SILENT: RitualMix = { body: 0, crackle: 0, snap: 0, drone: 0, pulse: 0, air: 0, hiss: 0 };
export function ritualMix(t: number | null): RitualMix {
  if (t === null || !Number.isFinite(t) || t < 0) return { ...SILENT };
  const l = burnLook(t), B = WICKER_BURN, flame = Math.max(l.flameLow, l.flameHigh);
  return {
    body: flame,
    crackle: Math.min(1, flame * (0.55 + 0.45 * l.glow)),
    snap: ss(2, 10, t) * (1 - ss(B.peak, B.fadeStart, t)),
    drone: ss(B.catch, B.build, t) * (1 - ss(B.peak, B.fadeStart, t)),
    pulse: ss(B.catch + 2, B.build, t) * (1 - ss(B.peak - 2, B.peak + 4, t)),
    air: flame * 0.8 + 0.2 * l.smoulder * (1 - ss(B.settled - 4, B.settled + 6, t)),
    hiss: ss(B.peak, B.fadeStart, t) * (1 - ss(B.settled + 4, B.settled + 24, t)),
  };
}
/** Distance gain of the ritual: `fire` full within 8 m → 0 at 35 m; `close` (drone, pulse) → 0 at 22 m; 0 indoors. */
export function ritualGain(dist: number, indoor: boolean) {
  if (indoor || !Number.isFinite(dist)) return { fire: 0, close: 0 };
  const fall = (d0: number, d1: number) => 1 - ss(d0, d1, dist);
  return { fire: fall(8, 35), close: fall(6, 22) };
}
