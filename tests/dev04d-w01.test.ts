// DEV-04D W01: the repeatable Wickerman ritual — pure lifecycle rules, save normalisation, the hay carry, the timelines
// and the audio mix (DEV04D_WICKERMAN_DESIGN §2, §3, §10 cases 1–10).
import { describe, it, expect } from 'vitest';
import { defaultState, parseSave, STATE_VERSION, type GameState } from '../src/core/state';
import { solvedCount, PUZZLES } from '../src/puzzles/rules';
import {
  WICKER_KEYS, WICKER_IDS, newSession, wickerStage, normaliseWicker, lightCandles, blowCandles, igniteFigure, settleBurn, cleanFigure, takeHay,
  putHayBack, refillFigure, figurePrompt, ringPrompt, balePrompt, burnLook, afterglow, candlesOutReveal, candlesShown, cleanLook, fillFront,
  ritualMix, ritualGain, WICKER_BURN, CANDLES_OUT, CLEAN_TIME, REFILL_TIME, type WickerSession, type WickerStage,
} from '../src/world/wickerRitual';

const fresh = () => { const s = defaultState(); s.inventory.push('matches'); return s; };
const lit = (s: GameState) => Object.fromEntries(Object.entries(s.lit).filter(([k]) => k.startsWith('wicker.')));
/** One full ritual through the rules, as the setpiece drives them; returns the stages passed. */
function cycle(s: GameState, sess: WickerSession) {
  const seen: WickerStage[] = [wickerStage(s, sess)];
  const step = (r: { ok: boolean }) => { expect(r.ok).toBe(true); seen.push(wickerStage(s, sess)); };
  step(lightCandles(s, 'matches', sess));
  step(igniteFigure(s, 'matches', sess));
  expect(settleBurn(s, sess)).toBe(true); seen.push(wickerStage(s, sess));
  step(cleanFigure(s, sess));
  step(takeHay(s, sess));
  step(refillFigure(s, sess));
  return seen;
}

describe('W01 stage derivation (every key combination)', () => {
  const S = (lit: Record<string, boolean>, sess: Partial<WickerSession> = {}) => { const s = defaultState(); Object.assign(s.lit, lit); return wickerStage(s, { ...newSession(), ...sess }); };
  it('derives each stage', () => {
    expect(S({})).toBe('READY');
    expect(S({ 'wicker.candles': true })).toBe('RING_LIT');
    expect(S({ 'wicker.figure': true }, { burning: true })).toBe('BURNING');
    expect(S({ 'wicker.figure': true })).toBe('CHARRED');
    expect(S({ 'wicker.figure': true, 'wicker.candles': true })).toBe('CHARRED');
    expect(S({ 'wicker.empty': true })).toBe('EMPTY_FRAME');
    expect(S({ 'wicker.empty': true, 'wicker.candles': true })).toBe('EMPTY_FRAME');
    expect(S({ 'wicker.empty': true }, { carrying: true })).toBe('CARRYING_HAY');
    expect(S({ 'wicker.figure': true, 'wicker.empty': true })).toBe('EMPTY_FRAME'); // only in an edited save
    expect(S({ 'wicker.figure': false, 'wicker.candles': false, 'wicker.empty': false })).toBe('READY');
  });
});

describe('W01 lifecycle', () => {
  it('READY → RING_LIT → BURNING → (settle) CHARRED with the ring out → EMPTY_FRAME → CARRYING_HAY → READY', () => {
    const s = fresh(), sess = newSession();
    expect(cycle(s, sess)).toEqual(['READY', 'RING_LIT', 'BURNING', 'CHARRED', 'EMPTY_FRAME', 'CARRYING_HAY', 'READY']);
  });
  it('the burn settles into CHARRED with candles === false (automatic extinguish), the remnant kept', () => {
    const s = fresh(), sess = newSession();
    lightCandles(s, 'matches', sess); igniteFigure(s, 'matches', sess);
    settleBurn(s, sess);
    expect(s.lit[WICKER_KEYS.candles]).toBeUndefined();
    expect(s.lit[WICKER_KEYS.figure]).toBe(true);
    expect(settleBurn(s, sess)).toBe(false); // only once
  });
  it('igniteFigure is refused in READY (ring out), EMPTY_FRAME / CARRYING (no hay), CHARRED and BURNING', () => {
    const s = fresh(), sess = newSession();
    expect(igniteFigure(s, 'matches', sess).ok).toBe(false); // READY
    expect(wickerStage(s, sess)).toBe('READY');
    lightCandles(s, 'matches', sess);
    expect(igniteFigure(s, 'torch', sess).ok).toBe(false);
    expect(igniteFigure(s, 'matches', sess).ok).toBe(true);
    expect(igniteFigure(s, 'matches', sess).ok).toBe(false); // BURNING
    settleBurn(s, sess);
    expect(igniteFigure(s, 'matches', sess).ok).toBe(false); // CHARRED
    cleanFigure(s, sess);
    lightCandles(s, 'matches', sess); // a lit ring round an empty frame is decor
    expect(igniteFigure(s, 'matches', sess).ok).toBe(false); // EMPTY_FRAME
    takeHay(s, sess);
    expect(igniteFigure(s, 'matches', sess).ok).toBe(false); // CARRYING_HAY
    expect(s.lit[WICKER_KEYS.figure]).toBeUndefined();
  });
  it('without matches nothing lights', () => {
    const s = defaultState();
    expect(lightCandles(s, 'matches').ok).toBe(false);
    s.lit[WICKER_KEYS.candles] = true;
    expect(igniteFigure(s, 'matches').ok).toBe(false);
  });
  it('cleanFigure only from CHARRED: sets empty, clears figure; refused everywhere else', () => {
    const s = fresh(), sess = newSession();
    expect(cleanFigure(s, sess).ok).toBe(false); // READY
    lightCandles(s, 'matches', sess);
    expect(cleanFigure(s, sess).ok).toBe(false); // RING_LIT
    igniteFigure(s, 'matches', sess);
    expect(cleanFigure(s, sess).ok).toBe(false); // BURNING
    settleBurn(s, sess);
    expect(cleanFigure(s, sess).ok).toBe(true);
    expect(lit(s)).toEqual({ [WICKER_KEYS.empty]: true });
    expect(cleanFigure(s, sess).ok).toBe(false); // EMPTY_FRAME
  });
  it('refillFigure only from EMPTY_FRAME while carrying; clears empty; refused without hay', () => {
    const s = fresh(), sess = newSession();
    expect(refillFigure(s, sess).ok).toBe(false); // READY: already full
    s.lit[WICKER_KEYS.empty] = true;
    expect(refillFigure(s, sess).ok).toBe(false); // no hay carried
    expect(wickerStage(s, sess)).toBe('EMPTY_FRAME');
    takeHay(s, sess);
    expect(refillFigure(s, sess).ok).toBe(true);
    expect(sess.carrying).toBe(false);
    expect(wickerStage(s, sess)).toBe('READY');
  });
  it('refilling a frame whose ring was lit by hand returns to READY with the candles OUT (the next ritual keeps its candle phase)', () => {
    const s = fresh(), sess = newSession();
    s.lit[WICKER_KEYS.empty] = true;
    expect(lightCandles(s, 'matches', sess).ok).toBe(true);
    takeHay(s, sess);
    refillFigure(s, sess);
    expect(wickerStage(s, sess)).toBe('READY');
    expect(igniteFigure(s, 'matches', sess).ok).toBe(false); // the gate holds
  });
  it('bale: take only in EMPTY_FRAME (one bundle); put back; carrying never touches inventory, used, flags or the save', () => {
    const s = fresh(), sess = newSession();
    expect(takeHay(s, sess).ok).toBe(false); // READY
    s.lit[WICKER_KEYS.empty] = true;
    const before = JSON.stringify({ ...s, lit: {} });
    expect(takeHay(s, sess).ok).toBe(true);
    expect(takeHay(s, sess).ok).toBe(false); // one bundle
    expect(sess.carrying).toBe(true);
    expect(JSON.stringify({ ...s, lit: {} })).toBe(before);
    expect(JSON.stringify(s)).not.toMatch(/hay|carry/i);
    expect(putHayBack(sess)).toBe(true);
    expect(putHayBack(sess)).toBe(false);
    expect(wickerStage(s, sess)).toBe('EMPTY_FRAME');
  });
  it('ring: no light / blow during BURNING; allowed in READY, RING_LIT, CHARRED, EMPTY_FRAME', () => {
    const s = fresh(), sess = newSession();
    expect(lightCandles(s, 'matches', sess).ok).toBe(true); // READY
    expect(blowCandles(s, sess).ok).toBe(true); // RING_LIT
    lightCandles(s, 'matches', sess); igniteFigure(s, 'matches', sess);
    expect(blowCandles(s, sess).ok).toBe(false);
    expect(lightCandles(s, 'matches', sess).ok).toBe(false);
    expect(s.lit[WICKER_KEYS.candles]).toBe(true);
    settleBurn(s, sess);
    expect(lightCandles(s, 'matches', sess).ok).toBe(true); // CHARRED: harmless decor
    expect(blowCandles(s, sess).ok).toBe(true);
    cleanFigure(s, sess);
    expect(lightCandles(s, 'matches', sess).ok).toBe(true); // EMPTY_FRAME
    expect(blowCandles(s, sess).ok).toBe(true);
  });
  it('two (and five) full cycles in a row end in exactly the state of a new game: no drift', () => {
    const s = fresh(), sess = newSession(), ref = JSON.stringify(fresh().lit);
    for (let i = 0; i < 5; i++) {
      expect(cycle(s, sess)).toEqual(['READY', 'RING_LIT', 'BURNING', 'CHARRED', 'EMPTY_FRAME', 'CARRYING_HAY', 'READY']);
      expect(JSON.stringify(s.lit)).toBe(ref);
      expect(sess).toEqual(newSession());
    }
  });
  it('optional: no step ever solves, unlocks or changes a puzzle, item, flag or memory', () => {
    const s = fresh(), sess = newSession(), before = JSON.stringify({ ...s, lit: {} }), solved0 = solvedCount(s);
    lightCandles(s, 'matches', sess); igniteFigure(s, 'matches', sess); settleBurn(s, sess);
    expect(JSON.stringify({ ...s, lit: {} })).toBe(before);
    cleanFigure(s, sess); takeHay(s, sess);
    expect(JSON.stringify({ ...s, lit: {} })).toBe(before);
    refillFigure(s, sess);
    expect(solvedCount(s)).toBe(solved0);
    expect(PUZZLES.every((p) => !p.solved(s) || p.solved(defaultState()))).toBe(true);
    expect(JSON.stringify({ ...s, lit: {} })).toBe(before);
  });
  it('prompts follow the stage (no prompt while it burns; the bale only speaks while the frame is empty)', () => {
    const s = fresh(), sess = newSession();
    const P = () => [figurePrompt(s, sess), ringPrompt(s, sess), balePrompt(s, sess)];
    expect(P()).toEqual(['Stroman — eerst de kaarsen', 'Kaarsen aansteken', null]);
    lightCandles(s, 'matches', sess);
    expect(P()).toEqual(['Stroman aansteken', 'Kaarsen uitblazen', null]);
    igniteFigure(s, 'matches', sess);
    expect(P()).toEqual([null, null, null]);
    settleBurn(s, sess);
    expect(P()).toEqual(['Stroman schoonmaken', 'Kaarsen aansteken', null]);
    cleanFigure(s, sess);
    expect(P()).toEqual(['Lege stroman — haal hooi', 'Kaarsen aansteken', 'Hooi pakken']);
    takeHay(s, sess);
    expect(P()).toEqual(['Hooi in de stroman stoppen', 'Kaarsen aansteken', 'Hooi terugleggen']);
    expect(WICKER_IDS.bale).toBe('wicker.bale');
  });
});

describe('W01 persistence (save version 4, no schema change) and load normalisation (§3.1)', () => {
  const load = (lit: Record<string, boolean>) => { const s = parseSave(JSON.stringify({ version: 4, scene: 'estate', inventory: ['matches'], lit }))!; normaliseWicker(s); return s; };
  it('every row of the normalisation table', () => {
    expect(wickerStage(load({}))).toBe('READY'); // new game / pre-DEV-04C save
    expect(wickerStage(load({ 'fire.clearing': true }))).toBe('READY');
    expect(wickerStage(load({ 'wicker.candles': true }))).toBe('RING_LIT');
    const c = load({ 'wicker.candles': true, 'wicker.figure': true }); // C / C-R aftermath, or a save taken mid-burn
    expect(wickerStage(c)).toBe('CHARRED'); expect(lit(c)).toEqual({ 'wicker.figure': true });
    const f = load({ 'wicker.figure': true });
    expect(wickerStage(f)).toBe('CHARRED'); expect(lit(f)).toEqual({ 'wicker.figure': true });
    expect(wickerStage(load({ 'wicker.empty': true }))).toBe('EMPTY_FRAME');
    expect(lit(load({ 'wicker.empty': true, 'wicker.candles': true }))).toEqual({ 'wicker.empty': true, 'wicker.candles': true }); // candles as saved
    const fe = load({ 'wicker.figure': true, 'wicker.empty': true });
    expect(wickerStage(fe)).toBe('EMPTY_FRAME'); expect(lit(fe)).toEqual({ 'wicker.empty': true });
    expect(lit(load({ 'wicker.candles': false, 'wicker.figure': false }))).toEqual({}); // false keys tidied
  });
  it('normalisation is idempotent and reports whether it changed anything', () => {
    const s = defaultState(); s.lit['wicker.candles'] = true; s.lit['wicker.figure'] = true;
    expect(normaliseWicker(s)).toBe(true);
    expect(normaliseWicker(s)).toBe(false);
    expect(normaliseWicker(defaultState())).toBe(false);
  });
  it('a save never carries the hay or a running burn; parse → serialise keeps version 4 and only the three keys', () => {
    const s = fresh(), sess = newSession();
    lightCandles(s, 'matches', sess); igniteFigure(s, 'matches', sess); // saved mid-burn
    const mid = parseSave(JSON.stringify(s))!; normaliseWicker(mid);
    expect(wickerStage(mid)).toBe('CHARRED');
    settleBurn(s, sess); cleanFigure(s, sess); takeHay(s, sess); // saved while carrying
    const back = parseSave(JSON.stringify(s))!; normaliseWicker(back);
    expect(back.version).toBe(STATE_VERSION);
    expect(STATE_VERSION).toBe(4);
    expect(wickerStage(back)).toBe('EMPTY_FRAME'); // the bundle is not restored
    expect(Object.keys(back).sort()).toEqual(Object.keys(defaultState()).sort());
    expect(Object.keys(lit(back)).every((k) => Object.values(WICKER_KEYS).includes(k as never))).toBe(true);
  });
});

describe('W01 timelines', () => {
  it('the burn follows the ≈ 80 s arc; the candles go out one by one inside the settle phase, in reverse sweep order', () => {
    expect(WICKER_BURN).toMatchObject({ catch: 5, build: 20, peak: 50, fadeStart: 66, settled: 80 });
    expect(CANDLES_OUT.start).toBeGreaterThanOrEqual(WICKER_BURN.fadeStart);
    expect(CANDLES_OUT.end).toBeLessThanOrEqual(WICKER_BURN.settled);
    const counts = Array.from({ length: 61 }, (_, i) => candlesShown(candlesOutReveal(60 + i / 3), 9));
    expect(counts[0]).toBe(9);
    expect(counts[counts.length - 1]).toBe(0);
    expect(counts.every((c, i) => i === 0 || c <= counts[i - 1])).toBe(true);
    expect(new Set(counts).size).toBe(10); // one candle at a time
  });
  it('the embers fade after the settle; a loaded remnant is cold', () => {
    expect(afterglow(40)).toBe(1);
    expect(afterglow(WICKER_BURN.settled)).toBe(1);
    expect(afterglow(WICKER_BURN.settled + 30)).toBeGreaterThan(0.2);
    expect(afterglow(WICKER_BURN.settled + 61)).toBe(0);
    expect(afterglow(Infinity)).toBe(0);
    expect(afterglow(null)).toBe(0);
    expect(burnLook(Infinity)).toMatchObject({ char: 1, settled: true, flameLow: 0, flameHigh: 0 });
  });
  it('clean (≈ 1.8 s) and refill (≈ 1.6 s) transitions are monotone and end in the target look', () => {
    expect(CLEAN_TIME).toBeCloseTo(1.8); expect(REFILL_TIME).toBeCloseTo(1.6);
    let prev = cleanLook(0);
    expect(prev).toMatchObject({ char: 1, remnant: 1, ash: 1 });
    for (let p = 0.05; p <= 1.0001; p += 0.05) {
      const c = cleanLook(p);
      expect(c.char).toBeLessThanOrEqual(prev.char); expect(c.remnant).toBeLessThanOrEqual(prev.remnant); expect(c.ash).toBeLessThanOrEqual(prev.ash);
      prev = c;
    }
    expect(cleanLook(1)).toMatchObject({ char: 0, remnant: 0, ash: 0, puff: 0 });
    let f0 = -1;
    for (let p = 0; p <= 1.0001; p += 0.05) { const f = fillFront(p); expect(f).toBeGreaterThanOrEqual(f0); f0 = f; }
    expect(fillFront(0)).toBe(0); expect(fillFront(1)).toBeGreaterThan(1); // the last tufts (aFill ≤ 1) are in
  });
});

describe('W01 ritual audio mix (computed levels, not sound output)', () => {
  it('silent without a burn; the layers follow the arc (drone / pulse in build + peak only; hiss in the settle)', () => {
    expect(Object.values(ritualMix(null)).every((v) => v === 0)).toBe(true);
    const at = (t: number) => ritualMix(t);
    for (let t = 0; t <= 120; t += 0.5) for (const v of Object.values(at(t))) { expect(Number.isFinite(v)).toBe(true); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
    expect(at(2).body).toBeGreaterThan(0.2); expect(at(2).drone).toBe(0); expect(at(2).pulse).toBe(0); // catch
    expect(at(30).drone).toBe(1); expect(at(30).pulse).toBe(1); expect(at(30).body).toBe(1); // peak
    expect(at(58).pulse).toBe(0); expect(at(58).drone).toBeLessThan(at(30).drone); // decline
    expect(at(74).hiss).toBeGreaterThan(0.5); expect(at(74).body).toBeLessThan(at(30).body * 0.5); // settle
    expect(Object.values(at(110)).every((v) => v === 0)).toBe(true); // then silence
  });
  it('localised: full within 8 m, nothing beyond 35 m or indoors; drone / pulse fade by 22 m', () => {
    expect(ritualGain(5, false)).toEqual({ fire: 1, close: 1 });
    expect(ritualGain(35, false).fire).toBe(0);
    expect(ritualGain(22, false).close).toBe(0);
    expect(ritualGain(18, false).fire).toBeGreaterThan(0.3);
    expect(ritualGain(3, true)).toEqual({ fire: 0, close: 0 });
  });
});
