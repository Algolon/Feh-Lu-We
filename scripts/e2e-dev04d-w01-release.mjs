// DEV-04D W01 release check: the newer optional production features keep working beside the Wickerman ritual on the
// integrated build. Usage: node scripts/e2e-dev04d-w01-release.mjs [baseUrl]   (E2E_OUT=dir)
//   1. the four optional interactables (bong hit, serre beetle, Bosfruit pouch, W01 bale) are registered once, targeted by
//      the reticle from a standing pose and act through the action button; none changes the save state;
//   2. the bong hit plays its sound once per 5.6 s cooldown; the airco zap plays near the serre, gated by distance;
//   3. field-recorded footsteps: grass and dirt surfaces resolve and play while walking with the real controller;
//   4. audio coexistence: the ritual layer runs while footsteps, the zap and the bong hit play; it is released at range;
//   5. hay then an inventory item: taking hay, then selecting the matches in the bag releases the hay and the matches
//      work on the candle ring (the normal held-item path).
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/dev04d-w01-release';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text().slice(0, 300)}`); });
page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`); });
const E = (fn, arg) => page.evaluate(fn, arg);
const step = async (name, fn, arg) => { try { return await E(fn, arg); } catch (e) { log(`${name} (crashed)`, false, String(e?.message ?? e).slice(0, 400)); return null; } };

try {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'consKey'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open: { 'door.front': true, 'door.consEast': true, 'door.consWest': true, 'door.kitchen': true } })));
  await page.reload();
  await page.click('[data-cont]'); // the user gesture that unlocks audio
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);
  await page.evaluate(() => {
    const g = window.__game, a = g.audio;
    window.REC = { sfx: [], steps: [], ritualMax: 0 };
    const sfx = a.sfx.bind(a), stp = a.step.bind(a);
    a.sfx = (name, surface, gain) => { window.REC.sfx.push({ name, gain: gain ?? 1, t: +g.time.toFixed(2) }); return sfx(name, surface, gain); };
    a.step = (surface, gain, foot) => { window.REC.steps.push(surface); return stp(surface, gain, foot); };
    // a standing pose next to an interactable from which the reticle targets it (probe 12 bearings × 3 distances)
    window.standAt = (id) => {
      const c = T.hitCenter(id), w = g.world;
      for (const d of [1.5, 2.0, 1.1]) for (let k = 0; k < 12; k++) {
        const a2 = (k / 12) * Math.PI * 2, x = c.x + Math.cos(a2) * d, z = c.z + Math.sin(a2) * d;
        const y = w.col.supportHeight(x, z, c.y + 0.5, 0.42);
        if (!Number.isFinite(y) || Math.abs(y - (c.y - 0.6)) > 1.6) continue;
        g.player.setPose({ x, y, z, yaw: 0, pitch: 0 }); g.player.y = y; T.tick(4); T.lookAtId(id);
        const m = g.metrics();
        if (m.target === id) return { ok: true, x: +x.toFixed(2), z: +z.toFixed(2), label: m.label };
      }
      return { ok: false };
    };
    window.stateSig = () => { const s = g.state; return JSON.stringify({ inv: s.inventory, used: s.used, flags: s.flags, clues: s.clues, lit: s.lit, open: s.open, unlocked: s.unlocked, taken: s.taken }); };
  });

  // ---------------------------------------------------------------- 1–2. the optional interactables
  const ids = await E(() => { const keys = [...window.__game.world.byId.keys()]; const n = (id) => keys.filter((k) => k === id).length; return { total: keys.length, bong: n('garden.gravityBong.hit'), beetle: n('inspect.serreAircoBeetle'), pouch: n('inspect.kitchenBosfruit'), bale: n('wicker.bale'), handpan: n('play.handpan') }; });
  log(`registry: the optional ids are each registered once (${ids.total} interactables)`, ids.bong === 1 && ids.beetle === 1 && ids.pouch === 1 && ids.bale === 1 && ids.handpan === 1 && ids.total === 135, JSON.stringify(ids));

  const bong = await step('bong', () => {
    const g = window.__game, out = { pose: window.standAt('garden.gravityBong.hit') }, sig = window.stateSig();
    const n0 = window.REC.sfx.filter((s) => s.name === 'bongHit').length;
    document.getElementById('toast')?.classList.remove('show');
    g.doAction(); T.tick(2);
    out.toast = document.getElementById('toast')?.textContent ?? '';
    g.doAction(); T.tick(2); // inside the cooldown
    out.hits = window.REC.sfx.filter((s) => s.name === 'bongHit').length - n0;
    out.stateSame = window.stateSig() === sig;
    return out;
  });
  if (bong) log('gravity bong: "Neem een hit" targeted, one hit sound per cooldown, toast, no state change', bong.pose.ok && /Neem een hit/.test(bong.pose.label ?? '') && bong.hits === 1 && /hit/.test(bong.toast) && bong.stateSame, JSON.stringify(bong));

  const beetle = await step('beetle', () => {
    const g = window.__game, out = { pose: window.standAt('inspect.serreAircoBeetle') }, sig = window.stateSig();
    const z0 = window.REC.sfx.filter((s) => s.name === 'electric-zap').length;
    T.wait(5.2); // two zap cycles (2.5 s)
    out.zaps = window.REC.sfx.filter((s) => s.name === 'electric-zap').slice(z0).map((s) => +s.gain.toFixed(2));
    g.doAction(); T.tick(2);
    out.toast = document.getElementById('toast')?.textContent ?? '';
    out.stateSame = window.stateSig() === sig;
    // far away: no zap
    g.player.setPose({ x: 180, y: 1.2, z: 55, yaw: 0, pitch: 0 }); const z1 = window.REC.sfx.filter((s) => s.name === 'electric-zap').length; T.wait(5.2);
    out.farZaps = window.REC.sfx.filter((s) => s.name === 'electric-zap').length - z1;
    return out;
  });
  if (beetle) log('serre airco: beetle inspect targeted and shows its text; the zap plays near it (distance gain), never far away; no state change', beetle.pose.ok && /airco en kever/.test(beetle.pose.label ?? '') && beetle.zaps.length >= 2 && beetle.zaps.every((g0) => g0 > 0) && beetle.farZaps === 0 && /kever/i.test(beetle.toast) && beetle.stateSame, JSON.stringify(beetle));

  const pouch = await step('pouch', () => {
    const g = window.__game, out = { pose: window.standAt('inspect.kitchenBosfruit') }, sig = window.stateSig();
    g.doAction(); T.tick(2);
    out.toast = document.getElementById('toast')?.textContent ?? '';
    out.stateSame = window.stateSig() === sig;
    return out;
  });
  if (pouch) log('kitchen Bosfruit pouch: inspect targeted, shows its line, no state change', pouch.pose.ok && /drinkzakje/.test(pouch.pose.label ?? '') && /capri sun/i.test(pouch.toast) && pouch.stateSame, JSON.stringify(pouch));

  // ---------------------------------------------------------------- 3. footsteps (real controller walk)
  const steps = await step('footsteps', () => {
    const g = window.__game, ex = g.extras, out = {};
    out.surfaceLawn = ex.surfaceAt(60, 100, 0); out.surfacePath = ex.surfaceAt(167.6, 55.0, 1.2); out.surfaceHall = ex.surfaceAt(90, 84, 0.15);
    window.REC.steps.length = 0;
    g.player.setPose({ x: 174.0, y: 1.2, z: 60.6, yaw: 0, pitch: 0 }); g.player.y = g.world.col.supportHeight(174, 60.6, 1.3, 0.42); T.tick(3);
    T.walk([[177.0, 60.0], [179.0, 58.6]]); // side path (dirt) → clearing grass
    out.steps = [...new Set(window.REC.steps)]; out.n = window.REC.steps.length;
    return out;
  });
  if (steps) log('field-recorded footsteps: grass and dirt resolve outdoors (wood / stone indoors) and play while walking', steps.n >= 4 && steps.steps.includes('grass') && ['grass', 'dirt'].includes(steps.surfaceLawn) && ['grass', 'dirt'].includes(steps.surfacePath) && !['grass', 'dirt'].includes(steps.surfaceHall), JSON.stringify(steps));

  // ---------------------------------------------------------------- 4. coexistence with the ritual layer
  const co = await step('coexistence', () => {
    const g = window.__game, a = g.audio, w = g.world, out = { ready: a.ready };
    const at = (x, z) => { g.player.setPose({ x, y: 1.2, z, yaw: 0, pitch: 0 }); g.player.y = w.col.supportHeight(x, z, 1.3, 0.42); T.tick(3); };
    at(177.2, 57.6); w.byId.get('wicker.candles').useItem('matches'); T.wait(4);
    at(177.6, 55.6); w.byId.get('wicker.figure').useItem('matches'); T.wait(6);
    out.ritualOn = a.ritualActive;
    const s0 = window.REC.steps.length; T.walk([[178.6, 57.8], [177.0, 56.4]]); out.stepsDuring = window.REC.steps.length - s0;
    g.sfx('bongHit'); g.sfx('electric-zap', 0.5); T.tick(10); // the other effects fire while the ritual plays
    out.ritualStill = a.ritualActive; out.ctx = a.ctx?.state;
    at(110, 70); T.wait(5); out.farReleased = !a.ritualActive; // > 35 m: the layer is released, the rest unaffected
    at(177.6, 55.6); T.wait(80); // let the burn settle (state: CHARRED, ring out)
    out.stage = w.scene.userData.wickerSet.stage();
    return out;
  });
  if (co) log(`audio coexistence: the ritual layer runs with footsteps, the bong hit and the zap; released at range (context ${co.ctx})`, co.ready && co.ritualOn && co.stepsDuring > 0 && co.ritualStill && co.farReleased && co.stage === 'CHARRED', JSON.stringify(co));

  // ---------------------------------------------------------------- 5. hay, then an inventory item through the bag
  await E(() => { const g = window.__game; T.tick(1); window.standAt('wicker.figure'); g.doAction(); T.wait(2.2); window.standAt('wicker.bale'); g.doAction(); T.tick(2); });
  const carry = await E(() => ({ stage: window.__game.world.scene.userData.wickerSet.stage(), chip: document.getElementById('held')?.getAttribute('aria-label') ?? '' }));
  await page.tap('#b-bag'); await page.waitForTimeout(150);
  await page.tap('.inv button[data-id="matches"]'); await page.waitForTimeout(100);
  await page.getByText('In de hand nemen').tap(); await page.waitForTimeout(150);
  const after = await E(() => {
    const g = window.__game, wc = g.world.scene.userData.wickerCandles, cd = wc.candles[3], dx = cd.x - wc.centre.x, dz = cd.z - wc.centre.z, d = Math.hypot(dx, dz);
    const out = { stage: g.world.scene.userData.wickerSet.stage(), selected: g.selected, chip: document.getElementById('held')?.getAttribute('aria-label') ?? '' };
    g.player.setPose({ x: wc.centre.x + dx / d * (d + 1.0), y: 1.2, z: wc.centre.z + dz / d * (d + 1.0), yaw: 0, pitch: 0 }); T.tick(3); T.lookAt(cd.x, cd.y, cd.z);
    const m = g.metrics(); out.target = m.target; out.label = m.label;
    g.doAction(); T.wait(4); out.lit = g.world.scene.userData.wickerSet.litCount();
    return out;
  });
  log('hay then an inventory item: the bag selection releases the hay, the matches are held and light the ring through the item path', carry.stage === 'CARRYING_HAY' && /Bundel hooi/.test(carry.chip) && after.stage === 'EMPTY_FRAME' && after.selected === 'matches' && /Lucifers/.test(after.chip) && after.target === 'wicker.candles' && /Kaarsen aansteken/.test(after.label ?? '') && after.lit === 9, JSON.stringify({ carry, after }));
} catch (e) {
  log('suite crashed', false, String(e?.stack ?? e).slice(0, 600));
}
log('no page errors / failed requests', problems.length === 0, problems.slice(0, 6).join(' | '));
writeFileSync(`${OUT}/results.json`, JSON.stringify({ base: BASE, results }, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close();
process.exitCode = failed ? 1 : 0;
