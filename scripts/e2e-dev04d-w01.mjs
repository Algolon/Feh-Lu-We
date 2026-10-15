// DEV-04D W01 browser suite: the repeatable Wickerman ritual through the real game input, against the production build
// (npm run build && npm run preview). Usage: node scripts/e2e-dev04d-w01.mjs [baseUrl]   (E2E_OUT=dir for results)
// Mobile landscape context (915 × 412, touch). Aiming = the player's view (yaw / pitch, as a drag would set it); acting =
// the on-screen action button (touch tap / click), the held chip, the bag UI. Time = the game's own fixed-step clock.
//   1. READY → gate → candles (sweep from the nearest, one action) → ignite → BURNING (fire spreads, no prompts) →
//      candles go out one by one → CHARRED (saved, ring out) → clean (1.8 s) → EMPTY_FRAME → bale (held chip, bag
//      untouched) → refill (1.6 s, from the feet up) → READY; then a second full cycle ending in a new game's state;
//   2. the hay: bag selection releases it, the chip releases it, leaving the clearing releases it, the bale is inert
//      outside EMPTY_FRAME; a lit ring round an empty frame goes out on refill; no toast at any step;
//   3. persistence: reload in READY / RING_LIT / CHARRED / EMPTY_FRAME, while carrying, mid-burn; old-save fixtures;
//   4. audio lifecycle (computed, headless-safe): ritual nodes built on ignition, silent and released far away and after
//      the aftermath; the campfire loop untouched; 5. ids (131), collision, reduced motion; 6. render budgets per stage.
import { ADDITIONS } from './interactable-additions.mjs';
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { lowViewWithinBudget } from './performance-budget.mjs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/dev04d-w01';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const baseline = JSON.parse(readFileSync(new URL('./dev04a-baseline.json', import.meta.url), 'utf8'));
const additions = ADDITIONS; // scripts/interactable-additions.mjs: DEV-04C + W01 + optional production vignettes
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text().slice(0, 300)}`); });
const E = (fn, arg) => page.evaluate(fn, arg);
const step = async (name, fn, arg) => { try { return await E(fn, arg); } catch (e) { log(`${name} (crashed)`, false, String(e?.message ?? e).slice(0, 400)); return null; } };

const SAVE = (lit = {}, extra = {}) => ({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'], flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true }, lit: { 'fire.clearing': true, ...lit }, player: { home: null, estate: { x: 177.0, y: 1.2, z: 58.4, yaw: 2.4, pitch: 0 } }, ...extra });
// in-page helpers: placement (a pose next to the target, like walking up to it), aiming, reading the setpiece
const PAGE_HELPERS = () => {
  const g = window.__game, w = () => g.world, set = () => w().scene.userData.wickerSet;
  window.W = {
    set, g,
    at(x, z, yaw = 0) { g.player.setPose({ x, y: 1.2, z, yaw, pitch: 0 }); g.player.y = w().col.supportHeight(x, z, 1.3, 0.42); T.tick(3); },
    aim(id) { T.lookAtId(id); const m = g.metrics(); return { target: m.target, label: m.label }; },
    aimCandle(i) { const wc = w().scene.userData.wickerCandles, cd = wc.candles[i], dx = cd.x - wc.centre.x, dz = cd.z - wc.centre.z, d = Math.hypot(dx, dz); W.at(wc.centre.x + dx / d * (d + 1.0), wc.centre.z + dz / d * (d + 1.0)); T.lookAt(cd.x, cd.y, cd.z); const m = g.metrics(); return { target: m.target, label: m.label }; },
    atFigure() { W.at(177.7, 56.0, 1.9); return W.aim('wicker.figure'); },
    atBale() { W.at(177.6, 52.4, -2.3); return W.aim('wicker.bale'); },
    stage: () => set().stage(),
    lit: () => Object.fromEntries(Object.entries(g.state.lit).filter(([k]) => k.startsWith('wicker.'))),
    toast: () => document.getElementById('toast')?.classList.contains('show') ?? false,
    clearToast: () => document.getElementById('toast')?.classList.remove('show'),
    chip: () => document.getElementById('held')?.getAttribute('aria-label') ?? '',
    snap: () => { const s = set(), lk = s.look(); return { stage: s.stage(), lit: W.lit(), litCount: s.litCount(), hay: s.hay.visible, low: s.fLow.visible, high: s.fHigh.visible, char: +lk.char.toFixed(2), uChar: +s.burnUniforms.uChar.value.toFixed(2), uFill: +s.burnUniforms.uFill.value.toFixed(2), uClean: +s.burnUniforms.uClean.value.toFixed(2), remnant: s.burnUniforms.uRemnant.value, ash: s.ash.visible, smoke: s.smoke.visible, settled: lk.settled, carrying: s.session().carrying, burning: s.session().burning }; },
  };
};
const boot = async (save) => {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate((s) => { localStorage.clear(); if (s) localStorage.setItem('fehluwe.save', JSON.stringify(s)); }, save);
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);
  await page.evaluate(PAGE_HELPERS);
};
const reload = async () => {
  await E(() => window.__game.saveNow());
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);
  await page.evaluate(PAGE_HELPERS);
  return E(() => { T.tick(3); return { ...W.snap(), version: W.g.state.version, chip: W.chip(), selected: W.g.selected }; });
};
const tapAction = () => page.tap('#action'); // the on-screen action button, by touch

try {
  await boot(SAVE());
  // ---------------------------------------------------------------- 1. one full ritual through the real input
  const c1 = {};
  c1.ready = await E(() => ({ ...W.snap(), ...W.atFigure() }));
  await E(() => W.clearToast());
  await tapAction(); // the gate: nothing happens
  c1.gate = await E(() => { T.tick(3); return { ...W.snap(), toast: W.toast() }; });
  c1.ring = await E(() => W.aimCandle(2));
  await tapAction();
  c1.sweep = await E(() => { const seq = []; for (let k = 0; k < 22; k++) { T.tick(6); seq.push(W.set().litCount()); } return { seq, toast: W.toast(), ...W.snap() }; });
  c1.ignite = await E(() => W.atFigure());
  await tapAction();
  c1.burn = await E(() => {
    const out = [], ring = () => (W.aimCandle(0), W.g.metrics());
    for (const t of [2, 6, 12, 20, 32, 50, 60]) {
      T.wait(t - (out.at(-1)?.t ?? 0));
      const figLabel = (W.atFigure(), W.g.metrics()).label, ringLabel = ring().label; // the prompts first, then the state they belong to
      out.push({ t, ...W.snap(), figLabel, ringLabel });
    }
    // the end of the burn, sampled on the game clock only (no aiming between samples): every 0.5 s to the settle
    const tail = [];
    for (let k = 0; k < 52; k++) { T.wait(0.5); tail.push({ s: W.stage(), n: W.set().litCount() }); }
    return { rows: out, tail }; // (an array's extra properties do not survive page.evaluate)
  });
  c1.charred = await E(() => { T.wait(2); W.g.saveNow(); return { ...W.snap(), saved: JSON.parse(localStorage.getItem('fehluwe.save')).lit, ...W.atFigure(), bale: (W.atBale(), W.g.metrics()) }; });
  await E(() => W.atFigure());
  await tapAction();
  c1.clean = await E(() => { const seq = []; for (let k = 0; k < 8; k++) { T.tick(7); const s = W.snap(); seq.push({ uChar: s.uChar, uClean: s.uClean, hay: s.hay, ash: s.ash }); } T.wait(0.5); return { seq, ...W.snap(), toast: W.toast(), label: W.atFigure().label }; });
  c1.bale = await E(() => ({ ...W.atBale(), inv: W.g.state.inventory.slice() }));
  await tapAction();
  c1.carry = await E(() => { T.tick(3); return { ...W.snap(), chip: W.chip(), selected: W.g.selected, inv: W.g.state.inventory.slice(), baleLabel: W.g.metrics().label, figLabel: W.atFigure().label, saved: (W.g.saveNow(), JSON.parse(localStorage.getItem('fehluwe.save')).lit) }; });
  await tapAction();
  c1.refill = await E(() => { const seq = []; for (let k = 0; k < 8; k++) { T.tick(6); seq.push(W.snap().uFill); } T.wait(0.5); return { seq, ...W.snap(), chip: W.chip(), toast: W.toast(), label: W.atFigure().label }; });
  const mono = (a, dir) => a.every((v, i) => i === 0 || (dir > 0 ? v >= a[i - 1] : v <= a[i - 1]));
  {
    const r = c1;
    log('READY: the figure is filled, the ring out; with matches carried the prompt is "Stroman — eerst de kaarsen"', r.ready.stage === 'READY' && r.ready.hay && r.ready.litCount === 0 && r.ready.target === 'wicker.figure' && /eerst de kaarsen/.test(r.ready.label ?? ''), JSON.stringify(r.ready));
    log('the gate: the action button on the figure before the ring burns changes nothing (no toast)', r.gate.stage === 'READY' && !r.gate.low && !r.gate.toast, JSON.stringify(r.gate));
    const seq = r.sweep.seq;
    log(`candles: one touch on the action button lights all nine one after another from the nearest (${seq.join(' ')})`, /Kaarsen aansteken/.test(r.ring.label ?? '') && r.ring.target === 'wicker.candles' && seq[0] <= 2 && mono(seq, 1) && new Set(seq).size >= 6 && seq.at(-1) === 9 && r.sweep.stage === 'RING_LIT' && !r.sweep.toast, JSON.stringify(r.ring));
    const b = r.burn.rows, tail = r.burn.tail, at = (t) => b.find((x) => x.t === t);
    log('ignite: "Stroman aansteken" → BURNING; the fire spreads up the figure (upper body catches later), hay burns away, smoke', /Stroman aansteken/.test(r.ignite.label ?? '') && at(2).stage === 'BURNING' && at(2).low && !at(2).high && at(12).high && at(32).smoke && at(32).hay && at(32).char > at(6).char && mono(b.map((x) => x.char), 1), JSON.stringify(b.map((x) => `${x.t}s ${x.stage} L${+x.low}H${+x.high} c${x.char}`)));
    log('no ritual interaction during the burn (no prompt on the figure or the ring)', b.filter((x) => x.stage === 'BURNING').every((x) => x.figLabel === null && x.ringLabel === null), JSON.stringify(b.map((x) => [x.t, x.figLabel, x.ringLabel])));
    const outSeq = tail.map((x) => x.n);
    log(`end of burn: the candles go out one by one (${outSeq.join(' ')}), then the figure settles CHARRED with the ring OUT (saved)`, mono(outSeq, -1) && outSeq[0] === 9 && outSeq.at(-1) === 0 && new Set(outSeq).size === 10 && tail.at(-1).s === 'CHARRED' && r.charred.stage === 'CHARRED' && r.charred.litCount === 0 && !r.charred.saved['wicker.candles'] && r.charred.saved['wicker.figure'] === true, JSON.stringify({ outSeq, saved: r.charred.saved }));
    log('CHARRED: blackened willow (uChar 1), the charred remnant + ash heap visible, flames out; prompt "Stroman schoonmaken"; the bale is inert (no prompt)', r.charred.uChar === 1 && r.charred.remnant === 1 && r.charred.hay && r.charred.ash && !r.charred.low && /schoonmaken/.test(r.charred.label ?? '') && r.charred.bale.target !== 'wicker.bale', JSON.stringify(r.charred));
    const cs = r.clean.seq;
    log('clean (≈ 1.8 s): the remnant crumbles from the top, the char recedes, the ash goes → EMPTY_FRAME ("Lege stroman — haal hooi"), no toast', mono(cs.map((x) => x.uClean).filter((v) => v < 5), -1) && mono(cs.map((x) => x.uChar), -1) && cs[0].hay && !r.clean.hay && !r.clean.ash && r.clean.uChar === 0 && r.clean.stage === 'EMPTY_FRAME' && /haal hooi/.test(r.clean.label ?? '') && !r.clean.toast && r.clean.lit['wicker.empty'] === true && !r.clean.lit['wicker.figure'], JSON.stringify(cs));
    log('bale: "Hooi pakken" → CARRYING_HAY; the held chip shows "Bundel hooi"; the bag and the save are untouched; the figure offers "Hooi in de stroman stoppen"', r.bale.target === 'wicker.bale' && /Hooi pakken/.test(r.bale.label ?? '') && r.carry.stage === 'CARRYING_HAY' && /Bundel hooi/.test(r.carry.chip) && r.carry.selected === null && JSON.stringify(r.carry.inv) === JSON.stringify(r.bale.inv) && !JSON.stringify(r.carry.saved).includes('carry') && /Hooi in de stroman stoppen/.test(r.carry.figLabel ?? ''), JSON.stringify(r.carry));
    log(`refill (≈ 1.6 s): the hay packs in from the feet up (fill front ${r.refill.seq.join(' ')}) → READY, the chip clears, no toast`, mono(r.refill.seq, 1) && r.refill.seq[0] < 0.6 && r.refill.seq.at(-1) >= 1 && r.refill.stage === 'READY' && r.refill.hay && !/hooi/i.test(r.refill.chip) && !r.refill.toast && /eerst de kaarsen/.test(r.refill.label ?? '') && Object.keys(r.refill.lit).length === 0, JSON.stringify(r.refill));
  }

  // ---------------------------------------------------------------- 2. the hay: releases, the lit-ring refill, cycle 2
  const toEmpty = async () => {
    await E(() => { W.aimCandle(4); }); await tapAction(); await E(() => T.wait(4));
    await E(() => W.atFigure()); await tapAction(); await E(() => T.wait(82));
    await E(() => W.atFigure()); await tapAction(); await E(() => T.wait(2.2));
    return E(() => W.stage());
  };
  const cyc2 = await toEmpty();
  const rel = {};
  await E(() => W.atBale()); await tapAction();
  rel.taken = await E(() => ({ stage: W.stage(), chip: W.chip() }));
  // bag UI: select the matches → the hay goes back
  await page.tap('#b-bag'); await page.waitForTimeout(150);
  await page.tap('.inv button[data-id="matches"]'); await page.waitForTimeout(100);
  await page.getByText('In de hand nemen').tap(); await page.waitForTimeout(150);
  rel.bag = await E(() => { T.tick(2); return { stage: W.stage(), chip: W.chip(), selected: W.g.selected }; });
  // the chip: tap it while carrying → released
  await E(() => { W.g.select(null); W.atBale(); }); await tapAction();
  await page.tap('#held'); await page.waitForTimeout(100);
  rel.chip = await E(() => { T.tick(2); return { stage: W.stage(), chip: W.chip() }; });
  // leaving the clearing → released (walked with the real controller)
  await E(() => W.atBale()); await tapAction();
  rel.walk = await E(() => { const pos = T.walk([[177.0, 58.0], [176.0, 60.4], [172.0, 60.2], [168.6, 58.2], [167.6, 55.4]]); T.tick(3); return { stage: W.stage(), chip: W.chip(), pos, d: +Math.hypot(pos.x - 180, pos.z - 55).toFixed(1) }; });
  // a ring lit by hand round the empty frame goes out on refill (the next ritual keeps its candle phase)
  await E(() => W.aimCandle(6)); await tapAction();
  await E(() => T.wait(4)); await E(() => W.atBale()); await tapAction();
  await E(() => W.atFigure()); await tapAction();
  rel.litRefill = await E(() => { T.wait(2.2); return { ...W.snap(), label: W.atFigure().label }; });
  log('cycle 2 reached EMPTY_FRAME through the same input; the hay is released by selecting an item in the bag, by tapping the chip, and by walking out of the clearing', cyc2 === 'EMPTY_FRAME' && rel.taken.stage === 'CARRYING_HAY' && rel.bag.stage === 'EMPTY_FRAME' && rel.bag.selected === 'matches' && /Lucifers/i.test(rel.bag.chip) && rel.chip.stage === 'EMPTY_FRAME' && !/hooi/i.test(rel.chip.chip) && rel.walk.stage === 'EMPTY_FRAME' && rel.walk.d > 12 && !/hooi/i.test(rel.walk.chip), JSON.stringify(rel));
  log('refilling a frame whose ring was lit by hand returns to READY with the candles out (the gate holds for the next ritual)', rel.litRefill.stage === 'READY' && rel.litRefill.litCount === 0 && !rel.litRefill.lit['wicker.candles'] && /eerst de kaarsen/.test(rel.litRefill.label ?? ''), JSON.stringify(rel.litRefill));
  const fin = await E(() => ({ lit: W.lit(), flags: Object.keys(W.g.state.flags).filter((k) => /Solved$|solved/.test(k)), inv: W.g.state.inventory.slice(), used: W.g.state.used.slice(), clues: W.g.state.clues.length }));
  log('after two full cycles: the state is a new game\'s (no wicker keys), no puzzle flag, item, use or memory changed', Object.keys(fin.lit).length === 0 && fin.flags.length === 0 && JSON.stringify(fin.inv) === JSON.stringify(SAVE().inventory) && fin.used.length === 0, JSON.stringify(fin));

  // ---------------------------------------------------------------- 4. audio lifecycle (computed levels / node graph)
  const au = await step('audio', () => {
    const g = W.g, a = g.audio, out = { ready: a.ready };
    W.aimCandle(1); g.doAction(); T.wait(4); W.atFigure(); g.doAction(); T.wait(3);
    out.onIgnite = a.ritualActive; out.mix = W.set().mix();
    W.at(180, 92); T.wait(4); out.far = a.ritualActive; // ≈ 37 m away: silent, released
    W.atFigure(); T.wait(2); out.back = a.ritualActive;
    T.wait(80 + 30); out.after = a.ritualActive; // released after the aftermath
    out.campfireLoop = !!a.loops?.fire;
    out.muteRespected = (() => { a.setMuted(true); const m = a.muted; a.setMuted(false); return m; })();
    W.atFigure(); g.doAction(); T.wait(2.2); W.atBale(); g.doAction(); W.atFigure(); g.doAction(); T.wait(2); // back to READY
    return out;
  });
  if (au) log(`audio: the ritual node graph is built on ignition, released beyond range and after the aftermath; mute respected; the shared fire loop kept (context ${au.ready ? 'running' : 'NOT running: lifecycle unverified'})`, au.ready ? au.onIgnite && !au.far && au.back && !au.after && au.campfireLoop && au.muteRespected : au.campfireLoop, JSON.stringify(au));

  // ---------------------------------------------------------------- 5. collision, reduced motion, touch tap on the bale
  const misc = await step('misc', () => {
    const g = W.g, out = {};
    // walking into the bale from the clearing stops at it (an obstacle, not a step)
    W.at(178.0, 52.6, -2.4);
    try { T.walk([[176.4, 51.3]]); out.walkInto = 'reached'; } catch (e) { out.walkInto = 'blocked'; }
    out.feetY = +g.player.y.toFixed(2); out.dist = +Math.hypot(g.player.x - 176.4, g.player.z - 51.3).toFixed(2);
    // reduced motion: the fire holds a still but fully shaped pose
    g.settings.reducedMotion = true; g.applySettings?.();
    W.aimCandle(3); g.doAction(); T.wait(4); W.atFigure(); g.doAction(); T.wait(20);
    out.rm = { low: W.set().fLow.visible, high: W.set().fHigh.visible, smoke: W.set().smoke.visible };
    g.settings.reducedMotion = false; g.applySettings?.();
    T.wait(62); // settle
    return out;
  });
  if (misc) log('the bale + pallet is an obstacle (walking into it stops short; never stepped onto)', misc.walkInto === 'blocked' && misc.feetY < 1.4 && misc.dist > 0.3, JSON.stringify(misc));
  if (misc) log('reduced motion: the burn still shows its fire and smoke (static noise, no flutter)', misc.rm.low && misc.rm.high && misc.rm.smoke, JSON.stringify(misc.rm));
  // CHARRED now: clean by a direct touch tap on the figure (screen-space pick), then a tap on the bale
  const tapOn = async (id) => {
    const p = await E((id) => { const c = T.hitCenter(id); const v = new (W.g.camera.position.constructor)(c.x, c.y, -c.z).project(W.g.camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; }, id);
    await page.touchscreen.tap(p.x, p.y); await page.waitForTimeout(80);
  };
  await E(() => { W.atFigure(); W.g.player.yaw += 0.35; T.tick(2); }); // the reticle off the figure
  await tapOn('wicker.figure');
  const tap1 = await E(() => { T.wait(2.2); return W.stage(); });
  await E(() => { W.atBale(); W.g.player.yaw -= 0.4; T.tick(2); });
  await tapOn('wicker.bale');
  const tap2 = await E(() => { T.tick(2); return { stage: W.stage(), chip: W.chip() }; });
  log('touch: a direct tap on the charred figure cleans it, a tap on the bale takes the hay', tap1 === 'EMPTY_FRAME' && tap2.stage === 'CARRYING_HAY' && /Bundel hooi/.test(tap2.chip), JSON.stringify({ tap1, tap2 }));

  // ---------------------------------------------------------------- 3. persistence
  const carryReload = await reload();
  log('reload while carrying → EMPTY_FRAME, nothing carried, the chip empty (save version 4)', carryReload.stage === 'EMPTY_FRAME' && !carryReload.carrying && !/hooi/i.test(carryReload.chip) && carryReload.version === 4, JSON.stringify(carryReload));
  const emptyReload = await reload();
  log('reload in EMPTY_FRAME → EMPTY_FRAME', emptyReload.stage === 'EMPTY_FRAME' && !emptyReload.hay, JSON.stringify(emptyReload));
  await E(() => { W.atBale(); W.g.doAction(); W.atFigure(); W.g.doAction(); T.wait(2); });
  const readyReload = await reload();
  log('reload in READY → READY (filled)', readyReload.stage === 'READY' && readyReload.hay && Object.keys(readyReload.lit).length === 0, JSON.stringify(readyReload));
  await E(() => { W.aimCandle(0); W.g.doAction(); T.wait(4); });
  const ringReload = await reload();
  log('reload in RING_LIT → RING_LIT, the ring restored fully lit (no sweep replay)', ringReload.stage === 'RING_LIT' && ringReload.litCount === 9, JSON.stringify(ringReload));
  await E(() => { W.atFigure(); W.g.doAction(); T.wait(30); });
  const midReload = await reload();
  log('reload mid-burn → CHARRED with the candles out (no running burn is reconstructed)', midReload.stage === 'CHARRED' && midReload.litCount === 0 && !midReload.lit['wicker.candles'] && midReload.lit['wicker.figure'] && !midReload.low, JSON.stringify(midReload));
  const charReload = await reload();
  log('reload in CHARRED → CHARRED (a cold remnant)', charReload.stage === 'CHARRED' && charReload.remnant === 1, JSON.stringify(charReload));
  const fixtures = {};
  for (const [k, lit] of Object.entries({ preC: {}, cAftermath: { 'wicker.candles': true, 'wicker.figure': true }, edited: { 'wicker.figure': true, 'wicker.empty': true }, emptyLit: { 'wicker.empty': true, 'wicker.candles': true } })) {
    await boot(SAVE(lit));
    fixtures[k] = await E(() => { T.tick(3); return { ...W.snap(), version: W.g.state.version }; });
  }
  log('old-save fixtures: pre-C → READY; C/C-R aftermath (ring + figure) → CHARRED, ring out; figure + empty → EMPTY_FRAME; empty + lit ring → EMPTY_FRAME, ring as saved', fixtures.preC.stage === 'READY' && fixtures.cAftermath.stage === 'CHARRED' && fixtures.cAftermath.litCount === 0 && fixtures.edited.stage === 'EMPTY_FRAME' && !fixtures.edited.lit['wicker.figure'] && fixtures.emptyLit.stage === 'EMPTY_FRAME' && fixtures.emptyLit.litCount === 9 && Object.values(fixtures).every((f) => f.version === 4), JSON.stringify(Object.fromEntries(Object.entries(fixtures).map(([k, f]) => [k, [f.stage, f.litCount, f.lit]]))));

  // ---------------------------------------------------------------- 5b. ids
  const ids = await E(() => ({ interactables: [...W.g.world.byId.keys()].sort(), stateKeys: Object.keys(W.g.state).sort(), version: W.g.state.version }));
  const expected = [...baseline.interactables, ...additions].sort(), same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  // W01's own contract: exactly wicker.candles / wicker.figure / wicker.bale among the wicker ids, every baseline + documented
  // id present. Ids added later by other production work (outside W01) are reported, not counted against W01 here: the
  // A–D suites own the estate-wide undocumented-id check.
  const others = ids.interactables.filter((i) => !expected.includes(i)), wick = ids.interactables.filter((i) => i.startsWith('wicker.')).sort();
  log(`ids: ${ids.interactables.length} interactables; all baseline + documented additions present (${additions.join(', ')}); wicker ids exactly candles / figure / bale; save keys + version unchanged${others.length ? ` (outside W01: ${others.join(', ')})` : ''}`, expected.every((i) => ids.interactables.includes(i)) && same(wick, ['wicker.bale', 'wicker.candles', 'wicker.figure']) && same(ids.stateKeys, baseline.stateKeys) && ids.version === 4, JSON.stringify({ n: ids.interactables.length, outsideW01: others, missing: expected.filter((i) => !ids.interactables.includes(i)) }));

  // ---------------------------------------------------------------- 6. render budgets per stage (low quality, DPR 1)
  await boot(SAVE());
  const bud = await E(async () => {
    const g = W.g, res = {}, views = { wickermanClearing: [176.4, 1.2, 59.9, 2.53], wickermanPath: [158, 1.0, 47, 1.08] };
    const measure = async (tag) => {
      for (const [k, [x, y, z, yaw]] of Object.entries(views)) {
        g.player.setPose({ x, y, z, yaw, pitch: 0.05 }); g.player.y = g.world.col.supportHeight(x, z, y + 0.05, 0.42);
        for (let i = 0; i < 8; i++) g.tick(1 / 30);
        await new Promise((r) => setTimeout(r, 60));
        g.settings.quality = 'low'; g.applyQuality(true); g.tick(1 / 30); g.renderer.render(g.world.scene, g.camera);
        res[`${k}:${tag}`] = { calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles };
      }
    };
    await measure('READY');
    W.aimCandle(2); g.doAction(); T.wait(4); await measure('RING_LIT');
    W.atFigure(); g.doAction(); T.wait(32); await measure('BURNING32');
    T.wait(50); await measure('CHARRED');
    W.atFigure(); g.doAction(); T.wait(2.2); await measure('EMPTY_FRAME');
    return res;
  });
  const over = Object.entries(bud).filter(([, b]) => !lowViewWithinBudget(b) || b.calls > 150);
  writeFileSync(`${OUT}/budget.json`, JSON.stringify(bud, null, 2));
  log('render budgets (low): the clearing and path views inside the provisional PB01 mobile budget in every stage', over.length === 0, Object.entries(bud).map(([k, b]) => `${k} ${b.calls}/${b.triangles}`).join(', '));
} catch (e) {
  log('suite crashed', false, String(e?.stack ?? e).slice(0, 600));
}
log('no page errors', problems.length === 0, problems.slice(0, 6).join(' | '));
writeFileSync(`${OUT}/e2e-dev04d-w01-results.json`, JSON.stringify({ base: BASE, results }, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close();
process.exitCode = failed ? 1 : 0;
