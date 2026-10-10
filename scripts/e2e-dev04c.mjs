// DEV-04C atmosphere, authored surfaces & interactive setpieces: browser suite against the production build
// (npm run build && npm run preview). Usage: node scripts/e2e-dev04c.mjs [baseUrl]   (E2E_OUT=dir for results)
// Behaviour checks, no pixel snapshots:
//   1. the environment and the surface layer initialise (finite light / fog values over dusk × indoor × woodland, every
//      shared material family carries its surface profile, no NaN vertex);
//   2. the light hierarchy holds (woodland haze nearer than open ground, interiors clear, less fill indoors, fixtures up);
//   3. fire continuity: every flame has a visibility owner (its fixture or its host's room region), and is drawn exactly
//      when that owner is — sampled at the distances where flames used to vanish first;
//   4. existing routes stay walkable (front door → hall, lake viewpoint, loop → side path → clearing → inside the ring);
//   5. the Wickerman candle state through the real input (matches in hand, reticle, action button);
//   6. ignition gating (refused before the ring burns) and the burn (flames, char, light) through to the aftermath;
//   7. persistence across a real page reload (save version unchanged, figure loads as the settled aftermath);
//   8. ids: every baseline interactable / checkpoint / save key unchanged, the only additions are the documented ones;
//   9. no unfinished RESERVED / FLW-RSV content is integrated;
//  10. render budgets of the DEV-04C views and the established views vs the pre-DEV-04C build.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { LIGHT_CASES, walkLightCases } from './dev04cr-lightcases.js';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/dev04c';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const baseline = JSON.parse(readFileSync(new URL('./dev04a-baseline.json', import.meta.url), 'utf8'));
const additions = JSON.parse(readFileSync(new URL('./dev04c-additions.json', import.meta.url), 'utf8')).interactables;
const beforeBudgetFile = new URL('../docs/dev04c/before/budget.json', import.meta.url);
const before = existsSync(beforeBudgetFile) ? JSON.parse(readFileSync(beforeBudgetFile, 'utf8')) : null;
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const E = (page, fn, arg) => page.evaluate(fn, arg);
const D = Math.PI / 180;

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /^DEV-04/.test(m.text()))) problems.push(`console: ${m.text().slice(0, 300)}`); });

const SAVE = { version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'consKey'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open: { 'door.front': true }, lit: { 'fire.clearing': true } };
const boot = async (save) => {
  await page.goto(BASE + '?autotest=1');
  if (save) await page.evaluate((s) => localStorage.setItem('fehluwe.save', JSON.stringify(s)), save);
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);
};
const step = async (name, fn, arg) => { try { return await E(page, fn, arg); } catch (e) { log(`${name} (crashed)`, false, String(e?.message ?? e).slice(0, 400)); return null; } };

try {
  await boot(SAVE);

  // ---------------------------------------------------------------- 1. environment + surfaces initialise
  const env = await step('environment', () => {
    const g = T.G(), env = g.extras.env, fog = g.world.scene.fog, bad = [];
    const fin = (c) => [c.r, c.g, c.b].every(Number.isFinite);
    const focus = g.camera.position.clone();
    for (const dusk of [0, 0.5, 1]) for (const indoor of [0, 1]) for (const [x, z] of [[90, 120], [120, 13.6]]) {
      focus.set(x, 1.6, -z);
      env.update(dusk, focus, indoor);
      if (!fin(fog.color) || !fin(env.hemi.color) || !fin(env.hemi.groundColor) || !fin(env.sun.color) || ![fog.near, fog.far, env.hemi.intensity, env.sun.intensity].every(Number.isFinite) || fog.near >= fog.far) bad.push({ dusk, indoor, x, z });
    }
    const profiles = new Set();
    g.world.scene.traverse((o) => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; for (const m of ms) if (m.defines?.FLW_SURFACE) profiles.add(m.userData.surface); });
    const nan = [];
    g.world.scene.traverse((o) => { const a = o.geometry?.attributes?.position?.array; if (a) for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) { nan.push(o.userData.chunk ?? o.type); break; } });
    return { bad, profiles: [...profiles].sort(), nan };
  });
  if (env) {
    log('environment updates to finite light / haze values over dusk × indoor × open / woodland', env.bad.length === 0, JSON.stringify(env.bad).slice(0, 300));
    const need = ['fabric', 'foliage', 'ground', 'metal', 'paint', 'plaster', 'stone', 'timber', 'tree'];
    log(`authored-surface profiles initialised on the shared materials (${env.profiles.join(', ')})`, need.every((p) => env.profiles.includes(p)), `missing: ${need.filter((p) => !env.profiles.includes(p)).join(', ')}`);
    log('no NaN / infinite vertex in the scene', env.nan.length === 0, env.nan.slice(0, 6).join(', '));
  }

  // ---------------------------------------------------------------- 2. light hierarchy (measured on the live environment)
  const hier = await step('hierarchy', async () => {
    const g = T.G(), fog = g.world.scene.fog, env = g.extras.env, out = {};
    for (const [k, [x, y, z]] of Object.entries({ lawn: [90, 0, 122], wood: [120, 0, 13.6], hall: [90, 0.15, 84.6] })) {
      g.player.setPose({ x, y, z, yaw: 0, pitch: 0 }); g.player.y = g.world.col.supportHeight(x, z, y + 0.05, 0.42);
      for (let i = 0; i < 90; i++) g.tick(1 / 30); // the indoor factor is smoothed
      out[k] = { near: fog.near, far: fog.far, hemi: env.hemi.intensity, sun: env.sun.intensity, gain: g.pool.gain, room: g.world.hereRoom, fogB: fog.color.b - fog.color.r };
    }
    return out;
  });
  if (hier) {
    const { lawn, wood, hall } = hier;
    log('light hierarchy: woodland haze nearer + cooler than open ground; interiors clear of haze, less sun / fill, stronger fixtures',
      wood.near < lawn.near && wood.far < lawn.far && wood.fogB > lawn.fogB && hall.room === 'hall' && hall.near > lawn.near && hall.hemi < lawn.hemi && hall.sun < lawn.sun && hall.gain > lawn.gain, JSON.stringify(hier));
  }

  // ---------------------------------------------------------------- 3. fire continuity: flames drawn exactly with their owner
  const fires = await step('fire ownership', () => {
    const w = T.G().world, rows = [];
    w.scene.traverse((o) => {
      if (!o.userData.fire || o.userData.flwEmbers) return;
      let top = o; while (top.parent && top.parent !== w.scene) top = top.parent;
      const region = w.regions.find((r) => r.meshes.includes(top));
      const selfCulled = w.cullables.some((c) => c.root === o);
      const inFixture = o.parent !== w.scene && !top.userData.region && w.cullables.some((c) => c.root === top);
      rows.push({ owned: !!region || inFixture, selfCulled, region: top.userData.region ?? null });
    });
    return rows;
  });
  if (fires) log(`every flame has a visibility owner — its fixture or its host room region (${fires.length} flame objects)`, fires.length >= 9 && fires.every((r) => r.owned && !r.selfCulled), JSON.stringify(fires.filter((r) => !r.owned || r.selfCulled)).slice(0, 300));
  const cont = await step('fire continuity', () => {
    const g = T.G(), w = g.world, cam = g.camera, bad = [];
    const vis = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
    const flames = []; w.scene.traverse((o) => { if (o.userData.fire) flames.push(o); });
    // the host of each flame: a mesh of the same region holder / fixture
    const hostOf = (f) => { let top = f; while (top.parent && top.parent !== w.scene) top = top.parent; if (top.userData.region) return w.regions.find((r) => r.meshes.includes(top))?.meshes.find((m) => m !== top && m.userData.chunk === top.userData.region) ?? null; return top; };
    // poses where flames used to vanish first: 40–55 m from the campfire, the hall from the forecourt, the dining enfilade
    const poses = [[21, 1.7, 18 + 48], [21 + 46, 1.7, 18], [90, 1.7, 52], [90, 1.7, 68], [112, 1.8, 94], [86, 1.8, 86.4], [96, 1.8, 83]];
    let tested = 0;
    for (const [x, y, z] of poses) for (const f of flames) {
      if (!vis(f.parent) && !f.parent.userData.region) continue;
      const host = hostOf(f);
      if (!host) continue;
      const fp = f.getWorldPosition(f.position.clone());
      cam.position.set(x, y, -z); cam.lookAt(fp); cam.updateMatrixWorld();
      w.updateCulling(cam.position, cam);
      // compare the owner's drawn state with the flame's (the flame's own .visible = game state is left out)
      const own = (o) => { for (let p = o.parent; p && p !== w.scene; p = p.parent) if (!p.visible) return false; return true; };
      const flameDrawn = own(f) && f.children.every((m) => m.visible);
      let hostDrawn = false;
      if (host.isMesh) hostDrawn = vis(host);
      else host.traverse((m) => { if (m.isMesh && !m.userData.hit && !m.parent?.userData?.fire && m.visible && vis(m.parent)) hostDrawn = true; }); // a fixture: any of its own meshes drawn
      tested++;
      if (flameDrawn !== hostDrawn) bad.push({ at: [x, z], flame: [+fp.x.toFixed(1), +(-fp.z).toFixed(1)], flameDrawn, hostDrawn });
    }
    return { tested, bad };
  });
  if (cont) log(`fire continuity: a flame is drawn exactly when its fixture / room batch is (${cont.tested} flame × pose samples incl. 40–55 m from the campfire)`, cont.tested > 20 && cont.bad.length === 0, JSON.stringify(cont.bad).slice(0, 400));

  // ---------------------------------------------------------------- 4. routes still walkable (real controller)
  const walks = await step('walks', () => {
    const g = T.G(), res = {};
    const at = (x, y, z, yaw = 0) => { g.player.setPose({ x, y, z, yaw, pitch: 0 }); g.player.y = g.world.col.supportHeight(x, z, y + 0.05, 0.42); T.tick(3); };
    const tryWalk = (k, fn) => { try { fn(); res[k] = true; } catch (e) { res[k] = String(e.message).slice(0, 160); } };
    tryWalk('forecourt → front door → hall', () => { at(90, 0, 72); T.walk([[89.9, 78.5], [89.9, 81.5], [90, 85]]); if (T.G().world.hereRoom !== 'hall') throw new Error('not in hall: ' + T.G().world.hereRoom); });
    tryWalk('lake viewpoint (route → bench bay)', () => { at(80, 0, 128); T.walk([[80, 132], [79.6, 136.4]]); });
    tryWalk('wickerman loop → side path → clearing → inside the candle ring', () => {
      at(163, 1.2, 49); T.walk([[167, 54], [167.9, 57.6], [170.9, 59.7], [174.2, 60.6], [177, 60.1], [178.6, 56.9]]);
      const p = T.pos(); if (Math.hypot(p.x - 180, p.z - 55) > 2.9) throw new Error('not inside the ring ' + JSON.stringify(p));
    });
    return res;
  });
  if (walks) log('existing routes walkable with the real controller (front door → hall, lake viewpoint, loop → side path → clearing)', Object.values(walks).every((v) => v === true), JSON.stringify(walks));

  // ---------------------------------------------------------------- 5–6. Wickerman: candles, gating, burn (real input)
  const wick = await step('wickerman', () => {
    const g = T.G(), w = g.world, set = w.scene.userData.wickerSet, wc = w.scene.userData.wickerCandles, out = {};
    const at = (x, z, yaw = 0) => { g.player.setPose({ x, y: 1.2, z, yaw, pitch: 0 }); g.player.y = w.col.supportHeight(x, z, 1.3, 0.42); T.tick(3); };
    out.initial = { candles: !!g.state.lit['wicker.candles'], figure: !!g.state.lit['wicker.figure'], flames: set.flames.visible, fire: set.fLow.visible };
    // gating: matches in hand, aim at the figure before the ring burns → refused, nothing changes
    T.select('matches');
    at(180 - 2.3, 55 + 0.6, 90 * Math.PI / 180);
    const c0 = T.lookAtId('wicker.figure');
    const m0 = g.metrics();
    out.gateTarget = m0.target; out.gateLabel = m0.label;
    // the toast from selecting the matches ("Lucifers in de hand …") is cleared first: only what the action shows counts
    const clearToast = () => document.getElementById('toast')?.classList.remove('show');
    const toast = () => document.getElementById('toast')?.classList.contains('show') ?? false;
    clearToast();
    g.doAction(); T.tick(5);
    out.gated = { figure: !!g.state.lit['wicker.figure'], fire: set.fLow.visible, toast: toast() };
    // candles: stand outside one candle, aim at it, the action button lights the ring (one after another)
    const cd = wc.candles[2], dx = cd.x - wc.centre.x, dz = cd.z - wc.centre.z, d = Math.hypot(dx, dz);
    at(wc.centre.x + dx / d * (d + 1.0), wc.centre.z + dz / d * (d + 1.0));
    T.lookAt(cd.x, cd.y, cd.z);
    const m1 = g.metrics();
    out.candleTarget = m1.target; out.candleLabel = m1.label;
    clearToast();
    g.doAction();
    // DEV-04C-R: the ring lights progressively — sample the number of burning candles every 0.2 s
    out.seq = []; out.full = null;
    for (let k = 0; k < 26; k++) { T.tick(6); const nLit = set.litCount(); out.seq.push(nLit); if (nLit === 9 && out.full === null) out.full = +((k + 1) * 0.2).toFixed(1); }
    out.candleToast = toast();
    T.wait(0.5);
    out.lit = { state: !!g.state.lit['wicker.candles'], flames: set.flames.visible, reveal: set.reveal.uReveal.value, lamp: g.pool.assigned().includes('wicker.candles') || w.lamps.some((l) => l.id === 'wicker.candles' && l.on()) };
    // ignite: back inside the ring, aim at the figure
    at(180 - 2.3, 55 + 0.6, 90 * Math.PI / 180);
    T.lookAtId('wicker.figure');
    const m2 = g.metrics();
    out.igniteLabel = m2.label;
    clearToast();
    g.doAction(); T.tick(3);
    out.igniteToast = toast();
    T.wait(12);
    const lk = set.look();
    out.burning = { state: !!g.state.lit['wicker.figure'], low: set.fLow.visible, high: set.fHigh.visible, char: +lk.char.toFixed(2), light: +lk.light.toFixed(2), hay: set.hay.visible, smoke: set.smoke.visible, embers: set.embers.visible, uChar: +set.burnUniforms.uChar.value.toFixed(2) };
    T.wait(75);
    const la = set.look();
    out.after = { settled: la.settled, low: set.fLow.visible, high: set.fHigh.visible, hay: set.hay.visible, smoulder: set.smoulder.visible, char: la.char, label: (T.lookAtId('wicker.figure'), g.metrics().label) };
    g.select(null);
    // puzzles untouched
    out.solvedFlags = Object.keys(g.state.flags).filter((k) => /Solved$/.test(k));
    g.saveNow();
    out.saved = JSON.parse(localStorage.getItem('fehluwe.save')).lit;
    void c0;
    return out;
  });
  if (wick) {
    const w0 = wick;
    log('Wickerman starts unlit (no flames, no fire state)', !w0.initial.candles && !w0.initial.figure && !w0.initial.flames && !w0.initial.fire, JSON.stringify(w0.initial));
    log('ignition gating: with matches in hand the figure is targeted, the prompt says "eerst de kaarsen", the action changes nothing and shows no message card', w0.gateTarget === 'wicker.figure' && /eerst de kaarsen/.test(w0.gateLabel ?? '') && !w0.gated.figure && !w0.gated.fire && !w0.gated.toast, JSON.stringify({ t: w0.gateTarget, l: w0.gateLabel, g: w0.gated }));
    const seq = w0.seq ?? [], mono = seq.every((v, i) => i === 0 || v >= seq[i - 1]), distinct = new Set(seq).size;
    log(`candle sequence (DEV-04C-R): one action → candles light one after another round the ring, no message card (lit per 0.2 s: ${seq.join(' ')})`, w0.candleTarget === 'wicker.candles' && /Kaarsen aansteken/.test(w0.candleLabel ?? '') && seq[0] <= 2 && mono && distinct >= 5 && seq[seq.length - 1] === 9 && w0.full >= 2.5 && w0.full <= 4.5 && !w0.candleToast && w0.lit.state && w0.lit.flames && w0.lit.reveal === 1 && w0.lit.lamp, JSON.stringify({ t: w0.candleTarget, l: w0.candleLabel, full: w0.full, toast: w0.candleToast, lit: w0.lit }));
    log('burn state: with the ring lit the figure ignites ("Stroman aansteken", no message card): flames on body, char rising, hay burning, smoke / embers, strong light', /Stroman aansteken/.test(w0.igniteLabel ?? '') && !w0.igniteToast && w0.burning.state && w0.burning.low && w0.burning.high && w0.burning.char > 0.1 && w0.burning.uChar === w0.burning.char && w0.burning.light > 0.8 && w0.burning.hay && w0.burning.smoke && w0.burning.embers, JSON.stringify({ l: w0.igniteLabel, b: w0.burning }));
    log('burn settles into the charred aftermath (flames out, hay gone, smouldering remains, fully charred)', w0.after.settled && !w0.after.low && !w0.after.high && !w0.after.hay && w0.after.smoulder && w0.after.char === 1, JSON.stringify(w0.after));
    log('optional: no puzzle flag set by the setpiece; only the two lit keys saved', w0.solvedFlags.length === 0 && w0.saved['wicker.candles'] === true && w0.saved['wicker.figure'] === true, JSON.stringify({ f: w0.solvedFlags, lit: w0.saved }));
  }

  // ---------------------------------------------------------------- 7. persistence across a real reload
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);
  const re = await step('reload', () => {
    const g = T.G(), set = g.world.scene.userData.wickerSet;
    g.player.setPose({ x: 176.4, y: 1.2, z: 59.9, yaw: 145 * Math.PI / 180, pitch: 0.1 }); T.tick(10);
    const lk = set.look();
    return { version: g.state.version, candles: !!g.state.lit['wicker.candles'], figure: !!g.state.lit['wicker.figure'], flames: set.flames.visible, reveal: set.reveal.uReveal.value, settled: lk.settled, low: set.fLow.visible, hay: set.hay.visible, smoulder: set.smoulder.visible, fireClearing: !!g.state.lit['fire.clearing'] };
  });
  if (re) log('save / load: the lit ring and the burned figure persist (save version 4, aftermath on load, other lit state kept)', re.version === 4 && re.candles && re.figure && re.flames && re.reveal === 1 && re.settled && !re.low && !re.hay && re.smoulder && re.fireClearing, JSON.stringify(re));
  // an older save without the keys loads unlit
  await boot({ version: 4, scene: 'estate', inventory: ['matches'], flags: { leftHome: true }, open: {} });
  const old = await step('old save', () => {
    const g = T.G(), w = g.world, set = w.scene.userData.wickerSet, wc = w.scene.userData.wickerCandles;
    const out = { candles: !!g.state.lit['wicker.candles'], figure: !!g.state.lit['wicker.figure'], flames: set.flames.visible, settled: set.look().settled };
    // DEV-04C-R: matches only carried (nothing in hand) — the plain action button lights the ring
    const cd = wc.candles[5], dx = cd.x - wc.centre.x, dz = cd.z - wc.centre.z, d = Math.hypot(dx, dz);
    g.player.setPose({ x: wc.centre.x + dx / d * (d + 1.0), y: 1.2, z: wc.centre.z + dz / d * (d + 1.0), yaw: 0, pitch: 0 }); g.player.y = w.col.supportHeight(g.player.x, g.player.z, 1.3, 0.42); T.tick(3);
    T.lookAt(cd.x, cd.y, cd.z);
    out.selected = g.selected; out.label = g.metrics().label; out.target = g.metrics().target;
    g.doAction(); T.wait(4.5);
    out.litAfter = !!g.state.lit['wicker.candles']; out.count = set.litCount();
    return out;
  });
  if (old) {
    log('a save from before DEV-04C loads with the clearing unlit', !old.candles && !old.figure && !old.flames && !old.settled, JSON.stringify(old));
    log('one action: with matches only carried, the action button on a candle ("Kaarsen aansteken") lights the whole ring', old.selected === null && old.target === 'wicker.candles' && /Kaarsen aansteken/.test(old.label ?? '') && old.litAfter && old.count === 9, JSON.stringify(old));
  }

  // ---------------------------------------------------------------- DEV-04C-R lake material + room-boundary light continuity
  const lake = await step('lake', () => {
    const g = T.G(); let m = null, finite = true;
    g.world.scene.traverse((o) => { if (o.material?.customProgramCacheKey?.() === 'flw-lake-r') { m = o; const a = o.geometry.attributes.position.array; for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) finite = false; } });
    if (!m) return { found: false };
    g.player.setPose({ x: 80, y: 0, z: 136.4, yaw: -70 * Math.PI / 180, pitch: -0.04 }); T.tick(10); g.renderer.render(g.world.scene, g.camera);
    const prog = g.renderer.properties.get(m.material).currentProgram;
    return { found: true, finite, compiled: !!prog, tris: m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3, alpha: m.geometry.attributes.color.itemSize };
  });
  if (lake) log('lake (DEV-04C-R): the reworked water material initialises and compiles; one mesh, ≤ 480 triangles, per-vertex depth / alpha', lake.found && lake.finite && lake.compiled && lake.tris <= 480 && lake.alpha === 4, JSON.stringify(lake));
  const lightRes = await step('light continuity', walkLightCases, LIGHT_CASES);
  if (lightRes) log(`room-boundary light continuity (DEV-04C-R): a source in view keeps its light across the threshold (${lightRes.length} walks; rule: ≥ 50 % once visible for 1 s)`, lightRes.length >= 4 && lightRes.every((r) => !r.error && r.bad === 0) && lightRes.filter((r) => r.seenSamples > 0).length >= 3, lightRes.map((r) => `${r.name}: ${r.error ?? `${r.bad}/${r.seenSamples}`}`).join(' | '));

  // ---------------------------------------------------------------- 8. ids, checkpoints, save schema
  const ids = await E(page, () => { const g = T.G(); return { interactables: [...g.world.byId.keys()].sort(), checkpoints: g.world.checkpoints.map((c) => c.name).sort(), stateKeys: Object.keys(g.state).sort(), version: g.state.version }; });
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const expected = [...baseline.interactables, ...additions].sort();
  log(`ids: all ${baseline.interactables.length} baseline interactables unchanged + only the documented additions (${additions.join(', ')}); ${ids.checkpoints.length} checkpoints; save keys + version ${ids.version} unchanged`,
    same(ids.interactables, expected) && same(ids.checkpoints, baseline.checkpoints) && ids.checkpoints.length === 21 && same(ids.stateKeys, baseline.stateKeys) && ids.version === 4,
    JSON.stringify({ n: ids.interactables.length, missing: baseline.interactables.filter((i) => !ids.interactables.includes(i)), undocumented: ids.interactables.filter((i) => !expected.includes(i)) }));

  // ---------------------------------------------------------------- 9. no RESERVED integration
  const rsv = await E(page, () => {
    const g = T.G(), hits = [], re = /rsv|reserved|FLW-/i;
    for (const id of g.world.byId.keys()) if (re.test(id)) hits.push(`id:${id}`);
    g.world.scene.traverse((o) => { if (re.test(o.name ?? '')) hits.push(`name:${o.name}`); for (const [k, v] of Object.entries(o.userData)) if (re.test(k) || (typeof v === 'string' && re.test(v))) hits.push(`userData:${k}`); });
    for (const k of Object.keys(g.state.flags)) if (re.test(k)) hits.push(`flag:${k}`);
    return hits;
  });
  log('no unfinished RESERVED / FLW-RSV content integrated (ids, scene, flags)', rsv.length === 0, rsv.slice(0, 6).join(', '));

  // ---------------------------------------------------------------- 10. render budgets
  const measure = async (P, open) => {
    await boot({ version: 4, scene: 'estate', inventory: ['frontKey', 'consKey', 'matches'], flags: { leftHome: true }, unlocked: ['lock.door.front', 'lock.door.consWest'], open });
    return E(page, async (P) => {
      const g = window.__game, res = {};
      for (const [k, [x, y, z, yaw, pitch = 0.05, st]] of Object.entries(P)) {
        if (st) { for (const [kk, v] of Object.entries(st)) g.state.lit[kk] = v; g.world.syncAll(); }
        g.player.setPose({ x, y, z, yaw, pitch }); g.player.y = g.world.col.supportHeight(x, z, y + 0.05, 0.42);
        for (let i = 0; i < 20; i++) g.tick(1 / 30);
        if (st?.burning) { for (const id of ['wicker.candles', 'wicker.figure']) g.world.byId.get(id).useItem('matches'); for (let i = 0; i < 300; i++) g.tick(1 / 30); }
        await new Promise((r) => setTimeout(r, 100));
        g.settings.quality = 'low'; g.applyQuality(true); g.tick(1 / 30); g.renderer.render(g.world.scene, g.camera);
        res[k] = { calls: g.renderer.info.render.calls, triangles: g.renderer.info.render.triangles };
        if (st) { for (const kk of ['wicker.candles', 'wicker.figure']) delete g.state.lit[kk]; g.world.syncAll(); }
      }
      return res;
    }, P);
  };
  const A = await measure({ atticNook: [96.4, 6.65, 94.2, 1.08], atticCommon: [86, 6.65, 97.5, 0], conservatoryInside: [126.3, 0.15, 106, 1.57], conservatoryDoorDeck: [137, 0.15, 106, -1.57], wellnessDeck: [132, 0.15, 114, 2.27], saunaAccess: [137.6, 0.15, 112.4, -2.44], wickermanClearing: [176.4, 1.2, 59.9, 2.53], wickermanPath: [158, 1.0, 47, 1.08], frontForecourt: [90, 0, 66, 0], arrivalCourt: [88, 0, 62, 0.07], portugalTerrace: [25, 4.15, 152.8, 0.35], portugalApproach: [16.6, 4.0, 146.8, 0.44], golfVicinity: [66, 0, 57, -2.62], golfSpur: [56, 0, 47.6, 1.22] }, { 'door.front': true, 'door.consEast': true, 'door.atticStair': true });
  const C = await measure({
    livingRoom: [83.4, 0.15, 87.2, -90 * D, -0.06], 'entrance hall': [90, 0.15, 83, 0, 0.1], copaRoom: [118, 0.15, 99, 30 * D, -0.05], 'Copacabana bar': [127, 0.15, 107, 25 * D, 0.1], 'Portugal cottage': [25, 4.15, 158.6, 0, -0.12], lakeApproach: [64, 0, 121.5, -22 * D, 0], lakeShore: [80, 0, 136.4, -70 * D, -0.04], woodlandRoute: [120, 0, 13.6, 85 * D, 0.02], boslustCalibration: [51.5, 0, 7.6, 55 * D, 0.04], campfire: [26, 0, 21.5, -125 * D, -0.25],
    wickerUnlit: [176.4, 1.2, 59.9, 145 * D, 0.12, { 'wicker.candles': false }], wickerLit: [176.4, 1.2, 59.9, 145 * D, 0.12, { 'wicker.candles': true }], wickerBurning: [176.4, 1.2, 59.9, 145 * D, 0.12, { burning: true }], wickerPathBurning: [158, 1.0, 47, 1.08, 0, { burning: true }],
  }, { 'door.front': true });
  const guide = (b) => b.calls <= 150 && b.triangles <= 250000;
  const rows = [], over = [];
  for (const [set, M, ref] of [['A', A, before?.A ?? {}], ['C', C, { ...(before?.B ?? {}), ...(before?.C ?? {}) }]]) for (const [k, b] of Object.entries(M)) {
    const b0 = ref[k] ?? ref[{ wickerUnlit: 'wickerUnlit', wickerLit: 'wickerUnlit', wickerBurning: 'wickerUnlit', wickerPathBurning: 'wickerPathBurning' }[k]] ?? null;
    rows.push({ set, k, ...b, before: b0 });
    // rule: a view inside the guide stays inside; a view already over it (golfSpur) may not grow by more than 2 % / +2 calls
    const ok = b0 && !guide(b0) ? b.triangles <= b0.triangles * 1.02 && b.calls <= b0.calls + 2 : guide(b);
    if (!ok) over.push(`${k} ${b.calls}/${b.triangles} (before ${b0 ? `${b0.calls}/${b0.triangles}` : 'n/a'})`);
  }
  writeFileSync(`${OUT}/budget.json`, JSON.stringify(rows, null, 2));
  log(`render budgets (low): every view inside the mobile guide stays inside; golfSpur not materially worse (${rows.length} views)`, over.length === 0, over.join(' | ') || rows.filter((r) => /wicker|golfSpur|lake|living|hall/.test(r.k)).map((r) => `${r.k} ${r.calls}/${r.triangles}`).join(', '));
} catch (e) {
  log('suite crashed', false, String(e?.stack ?? e).slice(0, 500));
}
log('no page errors / contract warnings', problems.length === 0, problems.slice(0, 6).join(' | '));
writeFileSync(`${OUT}/e2e-dev04c-results.json`, JSON.stringify({ base: BASE, results }, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
await browser.close();
process.exit(failed ? 1 : 0);
