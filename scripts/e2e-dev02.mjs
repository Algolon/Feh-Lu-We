// DEV-02 estate structural blockout: browser checks against the production build (npm run build && npm run preview).
// Usage: node scripts/e2e-dev02.mjs [baseUrl]   (E2E_OUT=dir for screenshots/results; DEV02_ONLY=routes,gates,... to select)
// Movement goes through the real collision (autopilot = joystick-equivalent, fixed 30 Hz steps), interaction through
// the reticle and the action button. The only setup shortcut is the injected start save (scene, essentials, unlocked
// locks, start pose) — every route below is WALKED, no teleports.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/dev02';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const timings = {};
const log = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const ONLY = process.env.DEV02_ONLY ? new Set(process.env.DEV02_ONLY.split(',')) : null;

/** In-page helpers (after T): walk with sampling of the feet height, push against an obstacle, visibility probes. */
const W_HELPERS = `window.W = {
  walk(points, run = false) {
    const g = T.G(); let maxDy = 0, minY = Infinity, maxY = -Infinity, ticks = 0, prevY = g.player.y, dist = 0;
    for (const [x, z] of points) {
      g.autopilot = { x, z, run };
      let still = 0, last = { x: g.player.x, z: g.player.z }, ok = false;
      for (let i = 0; i < 120 * 30; i++) {
        g.tick(1 / 30); ticks++; window.__simTicks = (window.__simTicks ?? 0) + 1;
        const y = g.player.y; maxDy = Math.max(maxDy, Math.abs(y - prevY)); prevY = y; minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        const m = Math.hypot(g.player.x - last.x, g.player.z - last.z); dist += m;
        if (Math.hypot(g.player.x - x, g.player.z - z) < 0.3) { ok = true; break; }
        still = m < 0.002 ? still + 1 / 30 : 0; last = { x: g.player.x, z: g.player.z };
        if (still > 1.5) { g.autopilot = null; throw new Error('stuck walking to (' + x + ',' + z + ') at ' + JSON.stringify(T.pos())); }
      }
      g.autopilot = null;
      if (!ok) throw new Error('timeout walking to (' + x + ',' + z + ') at ' + JSON.stringify(T.pos()));
    }
    T.tick(2);
    return { maxDy: +maxDy.toFixed(3), minY: +minY.toFixed(2), maxY: +maxY.toFixed(2), sec: +(ticks / 30).toFixed(1), dist: +dist.toFixed(1), pos: T.pos(), room: T.G().world.hereRoom };
  },
  /** Try to walk dx, dz (an obstacle is expected): feet height before/after and the final position. */
  push(dx, dz, sec = 1.6) {
    const g = T.G(); const y0 = g.player.y; let minY = y0;
    g.autopilot = { x: g.player.x + dx, z: g.player.z + dz };
    for (let i = 0; i < sec * 30; i++) { g.tick(1 / 30); minY = Math.min(minY, g.player.y); }
    g.autopilot = null; T.tick(2);
    return { ...T.pos(), y0: +y0.toFixed(2), minY: +minY.toFixed(2) };
  },
  room() { return T.G().world.hereRoom; },
  /** Are the meshes of a chunk/region (or with userData.rooms containing a room) currently drawn? */
  shown(pred) { let n = 0, on = 0; T.G().world.scene.traverse((o) => { if (o.isMesh && pred(o)) { n++; if (o.visible && (!o.parent || o.parent.visible)) on++; } }); return { n, on }; },
  doorColliders(id) { return T.G().world.col.colliders.filter((c) => c.tag === id).map((c) => c.enabled); },
};`;

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...opts });
  const page = await ctx.newPage();
  page.problems = [];
  page.on('pageerror', (e) => page.problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') page.problems.push(`console: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400) page.problems.push(`HTTP ${r.status()} ${r.url()}`); });
  return { ctx, page };
}
const ESSENTIALS = ['invitation', 'torch', 'matches', 'notebook', 'frontKey'];
async function startEstate(page, extra = {}) {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate((save) => { localStorage.clear(); localStorage.setItem('fehluwe.save', JSON.stringify(save)); }, {
    version: 4, scene: 'estate', inventory: ESSENTIALS, flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true }, ...extra,
  });
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 120000 });
  await page.evaluate(helpers);
  await page.addScriptTag({ content: W_HELPERS });
  await page.evaluate(() => { if (window.__game.ui.modalOpen) window.__game.ui.closeModal(); });
}
const shot = async (page, name) => { await page.waitForTimeout(250); await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 70 }); };
async function step(page, label, fn, arg) {
  try { return await page.evaluate(fn, arg); } catch (e) { await shot(page, 'FAIL-' + label.replace(/\W+/g, '_')); throw new Error(`${label}: ${e.message.split('\n')[0]}`); }
}
const run = async (name, fn) => {
  if (ONLY && !ONLY.has(name)) return;
  const { ctx, page } = await newPage();
  try { await fn(page); } catch (e) { log(`${name}: completed without error`, false, e.message.split('\n')[0]); }
  log(`${name}: no console errors / 404s`, !page.problems.length, page.problems.slice(0, 4).join(' | '));
  await ctx.close();
};

// =================================================================================================== 1. house: arrival → attic → loops
await run('house', async (page) => {
  await startEstate(page, { unlocked: ['lock.door.front', 'lock.door.consWest'], player: { estate: { x: 90, y: 0, z: 3, yaw: 0, pitch: 0 } } });
  const arr = await step(page, 'gate → driveway → court (between the cars) → hall', () => W.walk([[90, 30], [90.5, 48], [90, 62], [87, 70], [89.6, 77.6], [90, 79], [90, 82], [90, 86]], true));
  timings.arrival = arr;
  log('arrival: gate → front door → hall walked through the court between the parked cars', arr.room === 'hall' && arr.minY > -0.05, JSON.stringify(arr));
  const maq = await step(page, 'maquette', () => {
    const r = W.walk([[87.8, 91.5], [__dev02.MAQUETTE.pose.x, __dev02.MAQUETTE.z]]);
    T.act('mem.hall.maquette', 'maquette');
    const title = document.querySelector('#overlay h2')?.textContent ?? null, body = document.querySelector('#overlay .body')?.innerText ?? '';
    T.closeModal();
    return { r, title, body: body.slice(0, 120), clue: T.G().state.clues.includes('mem.hall.maquette') };
  });
  await page.evaluate(() => T.lookAt(85.5, 1.05, 94.6)); await shot(page, 'house-01-maquette');
  log('hall maquette: against the west wall, inspectable as an object (memory recorded), a miniature of this house', maq.clue && /Maquette/.test(maq.title ?? '') && /huis/.test(maq.body), JSON.stringify(maq));
  // S01 grand stair: up to mid-flight, then try to step off the open (west) side
  const s01 = await step(page, 'S01 railing', () => {
    const up = W.walk([[90, 92], [94, 85.6], [94, 90.5]]);
    const off = W.push(-3, 0);
    const top = W.walk([[94, 96.3], [93, 97.3]]);
    return { up, off, top };
  });
  log('S01 grand stair: a full-height railing on the open side — no stepping off mid-flight into the hall', s01.off.x > 93.35 && Math.abs(s01.off.y - s01.off.y0) < 0.25 && s01.off.minY > s01.off.y0 - 0.3, JSON.stringify(s01.off));
  log('S01 grand stair: continuous feet height up to the upper floor (+3.35), no jump > 0.45 m per step', Math.abs(s01.top.pos.y - 3.35) < 0.03 && s01.up.maxDy < 0.45 && s01.top.maxDy < 0.45, JSON.stringify({ up: s01.up.maxDy, top: s01.top.pos }));
  // S03 attic stair: door from the upper corridor, flight 1, middle landing, flight 2, attic
  const s03 = await step(page, 'S03 up', () => {
    W.walk([[96.4, 97.3], [97.0, 97.5]]);
    T.act('door.atticStair', 'Openen'); T.wait(1.2);
    const a = W.walk([[97.2, 99.2], [97.2, 99.6], [97.2, 101.0]]);
    const railLane = W.push(3, 0);
    const b = W.walk([[97.2, 102.9]]);
    const railMidN = W.push(0, 3);
    const c = W.walk([[95.8, 102.9], [95.8, 101.0]]);
    const railMid = W.push(3, 0);
    const d = W.walk([[95.8, 99.2], [97.6, 99.2]]); // onto the upper landing, beside (not in front of) flight 2
    const railTop = W.push(0, 3);
    const e = W.walk([[95.6, 99.2], [94.0, 99.2], [90.0, 99.2]]);
    return { a, railLane, b, railMidN, c, railMid, d, railTop, e, maxDy: Math.max(a.maxDy, b.maxDy, c.maxDy, d.maxDy, e.maxDy) };
  });
  await shot(page, 'house-02-attic-common');
  log('S03 attic stair: walked from the upper corridor to the attic (+3.35 → +5.00 → +6.65), no jump > 0.45 m', Math.abs(s03.b.pos.y - 5.0) < 0.05 && Math.abs(s03.e.pos.y - 6.65) < 0.05 && s03.e.room === 'atticCommon' && s03.maxDy < 0.45, JSON.stringify({ mid: s03.b.pos, attic: s03.e.pos, room: s03.e.room, maxDy: s03.maxDy }));
  log('S03 railings: flight 1 | lane, middle landing edge, between the flights, upper landing over the well — all hold', s03.railLane.x < 97.7 && s03.railLane.y > 3.5 && s03.railMidN.z < 103.45 && Math.abs(s03.railMidN.y - 5.0) < 0.05 && s03.railMid.x < 96.2 && s03.railMid.y > 5.1 && s03.railTop.z < 99.6 && Math.abs(s03.railTop.y - 6.65) < 0.05,
    JSON.stringify({ lane: s03.railLane, midN: s03.railMidN, mid: s03.railMid, top: s03.railTop }));
  const att = await step(page, 'attic rooms', () => {
    W.walk([[86, 93.2]]); T.act('door.atticStore', 'Openen'); T.wait(1.2);
    const store = W.walk([[86, 90.5], [84.6, 88.4]]); T.act('mem.storage.box'); T.closeModal();
    const look = W.walk([[86, 90.5], [86, 93.2], [93.5, 95], [97.5, 95.4]]);
    return { store: store.room, mem: T.G().state.clues.includes('mem.storage.box'), look: look.room, y: look.pos.y };
  });
  await page.evaluate(() => T.lookAt(97.4, 7.4, 93.2)); await shot(page, 'house-03-attic-lookout');
  log('attic: weekend attic, seasonal store (the old games box memory, same id) and the lookout are walkable rooms', att.store === 'atticStore' && att.mem && att.look === 'atticLookout' && Math.abs(att.y - 6.65) < 0.05, JSON.stringify(att));
  const loop = await step(page, 'down S03, rear door, rear nooks, linen, landing', () => {
    const down = W.walk([[96.6, 97.0], [96.9, 99.2], [95.8, 99.3], [95.8, 101.0], [95.8, 102.9], [97.2, 102.9], [97.2, 101.0], [97.2, 99.2]]);
    W.walk([[98.4, 99.3], [98.4, 104.5]]);
    T.act('door.atticRear', 'Openen'); T.wait(1.2);
    const nookE = W.walk([[97.0, 104.6], [97.0, 106.6]]);
    T.act('door.linen', 'Openen'); T.wait(1.0);
    const nook = W.walk([[96.0, 107.6], [93.0, 107.6]]);
    const landing = W.walk([[92.0, 105.0], [92.0, 102.6]]);
    return { down: down.pos, downDy: down.maxDy, nookE: nookE.room, linen: T.G().state.open['door.linen'], nook: nook.room, landing: landing.room };
  });
  log('upper side loop: attic stair rear door → rear nook east (linen reached centrally) → rear nook → landing', Math.abs(loop.down.y - 3.35) < 0.05 && loop.downDy < 0.45 && loop.nookE === 'rearNookEast' && loop.linen && loop.nook === 'rearNook' && loop.landing === 'landing', JSON.stringify(loop));
  const gf = await step(page, 'down S01 to the guest WC, kitchen, utility', () => {
    const down = W.walk([[93.0, 97.3], [94.0, 96.3], [94.0, 85.6], [90, 85.5]]);
    W.walk([[90, 96], [88.5, 100], [86.5, 102.6]]); T.act('door.guestWC', 'Openen'); T.wait(1.2);
    const wc = W.walk([[86.5, 104.8], [86.6, 105.3]]);
    W.walk([[86.5, 103.2], [88.5, 100], [90, 96], [90, 85.2], [97, 85.2], [97, 90.4], [101, 93.5], [98.6, 102.9], [104, 102.9], [107.0, 102.5]]);
    T.act('door.service', 'Openen'); T.wait(1.2);
    W.walk([[109.5, 102.5], [114.45, 102.7]]); T.act('door.utility', 'Openen'); T.wait(1.2);
    const ut = W.walk([[114.45, 105.6]]);
    return { down: down.pos, wc: wc.room, ut: ut.room };
  });
  await shot(page, 'house-04-utility');
  log('ground floor: guest WC off the back lobby and the utility off the service corridor are real rooms with doors', Math.abs(gf.down.y - 0.15) < 0.03 && gf.wc === 'guestWC' && gf.ut === 'utility', JSON.stringify(gf));
  // Copacabana double door: closed (unlocked) both leaves solid; one action opens both; the sauna by its ramp
  const cop = await step(page, 'Copacabana double door + sauna', () => {
    W.walk([[114.45, 102.6], [114.6, 102.5]]); T.act('door.consWest', 'Openen'); T.wait(1.2);
    W.walk([[117.4, 102.5], [117.4, 95.6], [127.7, 95.6], [127.7, 101.5], [128.6, 105.4]]); // round the pool
    const shutA = W.push(3, 0); W.walk([[128.6, 106.6]]); const shutB = W.push(3, 0);
    const before = W.doorColliders('door.consEast');
    T.act('door.consEast', 'Openen'); T.wait(1.4);
    const open = { state: T.G().state.open['door.consEast'], colliders: W.doorColliders('door.consEast') };
    const out = W.walk([[132.4, 106.0]]);
    T.act('door.consEast', 'Sluiten'); T.wait(1.4);
    const closed = W.doorColliders('door.consEast');
    const back = W.push(-3, 0);
    T.act('door.consEast', 'Openen'); T.wait(1.4);
    // DEV-04A: a landing and three steps replace the ramp; the landing cannot be climbed from the side (0.5 m)
    const ramp = W.walk([[131.6, 106.0], [131.6, 106.4], [134, 106.4]]);
    W.walk([[132.6, 106.4], [132.6, 104.4]]);
    const side = W.push(2.5, 0);
    W.walk([[132.6, 106.4], [134, 106.4]]);
    const top = W.walk([[134, 104.45]]); // the landing in front of the door
    T.act('door.sauna', 'Openen'); T.wait(1.2);
    const inside = W.walk([[134, 104.6], [134, 101.8]]);
    return { shutA, shutB, before, open, out: out.room, closed, back, ramp: ramp.maxDy, side, top: top.pos, inside: inside.pos, room: inside.room };
  });
  await page.evaluate(() => T.lookAt(134, 1.5, 104)); await shot(page, 'house-05-sauna-from-inside');
  log('Copacabana double door: both leaves solid while closed, ONE saved state opens both (both colliders follow)', cop.shutA.x < 130 && cop.shutB.x < 130 && cop.before.length === 2 && cop.before.every(Boolean) && cop.open.state === true && cop.open.colliders.every((e) => !e) && cop.closed.every(Boolean) && cop.back.x > 130, JSON.stringify({ a: cop.shutA.x, b: cop.shutB.x, before: cop.before, open: cop.open, closed: cop.closed, back: cop.back.x }));
  log('sauna (DEV-04A): up three steps onto the landing (+0.65) and in on its real floor; the landing is not climbed from the side', cop.ramp < 0.45 && Math.abs(cop.top.y - 0.65) < 0.04 && cop.inside.y > 0.63 && cop.room === 'sauna' && cop.side.x < 133.3 && cop.side.y < 0.3, JSON.stringify({ ramp: cop.ramp, top: cop.top, inside: cop.inside, side: cop.side }));
});

// =================================================================================================== 2. the locked double door holds
await run('gate', async (page) => {
  await startEstate(page, { player: { estate: { x: 127.6, y: 0.15, z: 104.0, yaw: Math.PI / 2, pitch: 0 } } });
  const r = await step(page, 'locked consEast', () => {
    W.walk([[128.6, 105.4]]);
    const label = (T.lookAtId('door.consEast'), T.G().metrics().label);
    const a = W.push(3, 0); W.walk([[128.6, 106.6]]); const b = W.push(3, 0);
    return { label, a: a.x, b: b.x, open: !!T.G().state.open['door.consEast'] };
  });
  log('Copacabana double door keeps the consKey gate: locked, neither leaf lets you through (no half-door bypass)', /Op slot/.test(r.label ?? '') && r.a < 130 && r.b < 130 && !r.open, JSON.stringify(r));
});

// =================================================================================================== 3. outdoors: garden, lake, cottage, golf, wickerman, east glade
await run('outdoors', async (page) => {
  await startEstate(page, { player: { estate: { x: 131.6, y: 0.15, z: 113.6, yaw: -Math.PI / 2, pitch: 0 } } });
  const garden = await step(page, 'deck → terrace → social garden → lantern lawn → lake view', () => {
    const a = W.walk([[126, 113.6], [114, 113.5], [103, 113.5], [93, 113.5], [90, 117.5], [90, 124.6]]);
    const b = W.walk([[85, 134], [79.2, 139]]);
    T.act('mem.pond.bench'); T.closeModal();
    const water = W.push(-9, 3, 3);
    return { a, b, bench: T.G().state.clues.includes('mem.pond.bench'), water };
  });
  log('garden: wellness deck → terrace → lantern lawn → dry lake viewpoint (bench memory, same id)', garden.bench && garden.b.minY > -0.1, JSON.stringify({ a: garden.a.pos, b: garden.b.pos }));
  log('lake: the water stops the player at a dry shore (no wading, no fall)', garden.water.minY > -0.3 && ((garden.water.x - 54) / 22.3) ** 2 + ((garden.water.z - 146) / 12.3) ** 2 >= 0.99, JSON.stringify(garden.water));
  const cot = await step(page, 'cottage out and back', () => {
    W.walk([[85, 134], [90, 124.6], [90, 117.5], [87.5, 117.4], [79.4, 117.3], [80, 113.5]]); // round the terrace table
    const out = W.walk([[62, 122], [40, 130], [18, 143], [18, 152], [25, 152]]);
    const terrace = W.walk([[25, 154.0], [25, 156.0]]);
    T.act('door.cottage', 'Openen'); T.wait(1.2);
    const inside = W.walk([[25, 158.6], [25, 161.5]]);
    W.walk([[25, 158.6], [25, 154.0]]);
    const edge = W.walk([[31.0, 152.6]]);
    const east = W.push(4, -0.5, 2);
    const back = W.walk([[25, 152], [18, 152], [18, 168], [48, 168], [79, 160], [90, 139], [91.8, 133.5], [92.0, 126.0]]); // skirt the lantern ring at the end
    return { out, terrace: terrace.pos, inside: inside.room, insideY: inside.pos.y, edge: edge.pos, east, back };
  });
  timings.cottageOut = cot.out; timings.cottageReturn = cot.back;
  await page.evaluate(() => { const p = T.G().player; p.yaw = Math.PI * 1.25; T.tick(2); }); await shot(page, 'outdoors-01-back-at-lawn');
  log('Portugal cottage: walked out from the terrace (+0 → +4) onto the covered terrace (+4.15) and inside (cottageRoom), grade-smooth', Math.abs(cot.terrace.y - 4.15) < 0.04 && cot.inside === 'cottageRoom' && Math.abs(cot.insideY - 4.15) < 0.04 && cot.out.maxDy < 0.3, JSON.stringify({ out: { sec: cot.out.sec, dist: cot.out.dist, maxDy: cot.out.maxDy }, terrace: cot.terrace }));
  log('cottage plateau: dry, the steep lake side is walled (no fall towards the water)', cot.east.minY > 3.9 && cot.east.x < 31.9, JSON.stringify(cot.east));
  log('cottage return: a different route back to the lantern lawn, no jump', Math.abs(cot.back.pos.y) < 0.05 && cot.back.maxDy < 0.3, JSON.stringify({ sec: cot.back.sec, dist: cot.back.dist, maxDy: cot.back.maxDy }));
  const glade = await step(page, 'east glade loop', () => W.walk([[94, 127], [124, 132], [149, 145], [174, 139], [174, 109], [150, 104], [145, 108]]));
  timings.eastGardenLoop = glade;
  log('east garden loop: lantern side → east glade → ridge path (≤ +2.5) → wellness deck, walkable end to end', glade.maxY < 2.7 && glade.maxY > 2.0 && glade.maxDy < 0.3 && Math.abs(glade.pos.y - 0.15) < 0.05, JSON.stringify({ sec: glade.sec, dist: glade.dist, maxY: glade.maxY, maxDy: glade.maxDy }));
});

await run('forest', async (page) => {
  await startEstate(page, { player: { estate: { x: 89, y: 0, z: 63, yaw: -Math.PI / 2, pitch: 0 } } });
  const golf = await step(page, 'golf tee + chute', () => {
    const r = W.walk([[82, 67.5], [71, 62], [64.5, 55.6], [63.0, 51.3]]);
    const chute = W.push(0, -4);
    return { r, chute };
  });
  await page.evaluate(() => T.lookAt(63, 3, 42)); await shot(page, 'forest-01-golf');
  log('golf: the tee behind (north of) the BOSLUST hill on the forecourt → shed path; the cardboard chute is not walkable', golf.r.pos.y < 0.1 && golf.chute.z > 49.2, JSON.stringify({ tee: golf.r.pos, chute: golf.chute }));
  const wick = await step(page, 'wickerman clearing and loop', () => {
    W.walk([[90, 64], [98.5, 68], [113, 62.5], [131, 52.5], [141.5, 43.5]]);
    const a = W.walk([[146.5, 43.5], [154, 45], [163, 49], [164.6, 52.2]]);
    const b = W.walk([[169.6, 57.0], [169, 62], [162, 72], [151, 75], [131, 69], [113, 62.5]]);
    return { a, b };
  });
  timings.wickermanLoop = wick;
  await shot(page, 'forest-02-wickerman-loop-end');
  log('wickerman: a separate clearing at +1.2 reached by its own loop from the well path, and back to the east path', Math.abs(wick.a.pos.y - 1.2) < 0.08 && wick.a.maxDy < 0.3 && wick.b.maxDy < 0.3 && wick.b.pos.y < 0.1, JSON.stringify({ clearing: wick.a.pos, loop: { sec: wick.a.sec + wick.b.sec, dist: wick.a.dist + wick.b.dist } }));
});

// =================================================================================================== 4. culling, vegetation, sightlines
await run('culling', async (page) => {
  await startEstate(page, { player: { estate: { x: 134, y: 0.15, z: 97.5, yaw: 0, pitch: 0 } } });
  const sauna = await step(page, 'sauna shell from four sides (door closed) and inside', () => {
    const shell = (o) => Array.isArray(o.userData.rooms) && o.userData.rooms.includes('sauna');
    const out = {};
    for (const [name, pts] of [['south', [[134, 97.5]]], ['west', [[131.0, 98.0], [131.0, 102]]], ['east', [[137.5, 98.0], [137.5, 102]]], ['north', [[137.5, 106.5], [137.0, 107.0]]]]) { W.walk(pts); T.tick(10); out[name] = W.shown(shell); }
    W.walk([[137.5, 113.8], [134, 113.8], [134, 105.6]]); T.act('door.sauna', 'Openen'); T.wait(1.2); W.walk([[134, 102.0]]); T.act('door.sauna', 'Sluiten'); T.wait(1.2); T.tick(10);
    out.inside = W.shown(shell); out.room = W.room();
    return out;
  });
  log('culling: the sauna shell stays drawn from all four sides with its door closed, and from inside (VD-03)', ['south', 'west', 'east', 'north', 'inside'].every((k) => sauna[k].n > 0 && sauna[k].on === sauna[k].n) && sauna.room === 'sauna', JSON.stringify(sauna));
  const far = await step(page, 'landmarks across the estate', () => {
    T.act('door.sauna', 'Openen'); T.wait(1.2);
    W.walk([[134, 104.6], [134, 113.8]]);
    const reg = (chunk) => (o) => o.userData.chunk === chunk;
    T.G().player.yaw = 0; T.tick(10);
    const atDeck = { cottage: W.shown(reg('cottage')), manor: W.shown(reg('manor')) };
    W.walk([[126, 113.6], [100, 113.6], [90, 117.5]]); T.tick(10);
    const atTerrace = { cottage: W.shown(reg('cottage')), attic: W.shown(reg('mAttic')) };
    return { atDeck, atTerrace };
  });
  log('culling: the manor shell and the cottage (landmark across the lake) are drawn from the garden; the attic contents are not', far.atDeck.manor.on > 0 && far.atTerrace.cottage.on > 0 && far.atTerrace.attic.on === 0, JSON.stringify(far));
  const veg = await step(page, 'vegetation vs footprints', () => {
    const { FOOTPRINTS, LAKE } = window.__dev02;
    const g = window.__game, m4 = new (g.camera.matrix.constructor)(), bad = [];
    let n = 0;
    g.world.scene.traverse((o) => {
      if (!o.isInstancedMesh || o.userData.lightPatches || !o.userData.veg) return;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m4); const x = m4.elements[12], z = -m4.elements[14]; n++;
        // authored staging, not scatter: the ferns at the foot of the BOSLUST cut walls and the flowers IN the forecourt planter
        const authored = (f) => (f.id === 'BOSLUST_CUT' && o.name.startsWith('fern|')) || ((f.id === 'ARRIVAL' || f.id === 'ARRIVAL_SERVICE') && Math.hypot(x - 90, z - 70) < 1.9);
        for (const f of FOOTPRINTS) if (x > f.x0 + 0.3 && x < f.x1 - 0.3 && z > f.z0 + 0.3 && z < f.z1 - 0.3 && !authored(f)) bad.push(`${f.id}@${x.toFixed(1)},${z.toFixed(1)}:${o.name}`);
        if (((x - LAKE.x) / LAKE.rx) ** 2 + ((z - LAKE.z) / LAKE.rz) ** 2 < 0.95) bad.push(`lake@${x.toFixed(1)},${z.toFixed(1)}`);
      }
    });
    return { n, count: bad.length, bad: bad.slice(0, 10) };
  });
  log('placement: no vegetation instance in a building, on a platform/parking bay/reservation, or in the lake', veg.n > 1000 && veg.count === 0, JSON.stringify(veg));
});

// =================================================================================================== 5. saves: new places survive a reload; legacy poses relocate by name
await run('saves', async (page) => {
  await startEstate(page, { open: { 'door.front': true, 'door.atticStair': true }, player: { estate: { x: 90.0, y: 6.65, z: 99.2, yaw: 0, pitch: 0 } } });
  const a = await step(page, 'attic pose', () => { const p = T.pos(); T.G().saveNow(); return { p, room: W.room() }; });
  await page.reload(); await page.click('[data-cont]'); await page.waitForFunction(() => window.__game?.world?.id === 'estate'); await page.evaluate(helpers); await page.addScriptTag({ content: W_HELPERS });
  const b = await page.evaluate(() => ({ p: T.pos(), room: W.room(), open: T.G().state.open['door.atticStair'], inv: T.G().state.inventory.length }));
  log('save/load: an attic pose and an open new door survive a reload (STATE_VERSION 4, no migration)', Math.abs(a.p.y - 6.65) < 0.05 && a.room === 'atticCommon' && Math.abs(b.p.x - a.p.x) < 0.05 && Math.abs(b.p.y - 6.65) < 0.05 && b.room === 'atticCommon' && b.open === true && b.inv === 5, JSON.stringify({ a, b }));
  await startEstate(page, { player: { estate: { x: 25, y: 4.15, z: 154.5, yaw: 0, pitch: 0 } } });
  const c = await page.evaluate(() => ({ p: T.pos(), room: W.room() }));
  log('save/load: a pose on the new cottage terrace (+4.15, Z 154) is valid on load', Math.abs(c.p.x - 25) < 0.05 && Math.abs(c.p.y - 4.15) < 0.05, JSON.stringify(c));
  for (const [name, pose, want] of [['old cottage room', { x: 37, y: 0.3, z: 132 }, 'cottage'], ['old pond bench', { x: 48, y: 0, z: 128.5 }, 'lake'], ['old storage room (now the attic stair)', { x: 97, y: 3.35, z: 102.5 }, 'ucorr']]) {
    await startEstate(page, { player: { estate: { ...pose, yaw: 0, pitch: 0 } }, inventory: [...ESSENTIALS, 'shedKey'], flags: { leftHome: true, drawerLockSolved: true } });
    const r = await page.evaluate((w) => { const g = T.G(); const cp = g.world.checkpoints.find((k) => k.name === w).pose; const p = T.pos(); return { p, cp, ev: g.state.events.filter((e) => e.e === 'relocated').map((e) => e.id), inv: g.state.inventory.length, flag: !!g.state.flags.drawerLockSolved }; }, want);
    log(`save/load: legacy pose (${name}) → named safe relocation "${want}", progress kept`, Math.hypot(r.p.x - r.cp.x, r.p.z - r.cp.z) < 0.05 && r.ev.length === 1 && r.inv === 6 && r.flag, JSON.stringify(r));
  }
});

const pass = results.filter((r) => r.ok).length;
console.log(`\n${pass}/${results.length} checks passed`);
writeFileSync(`${OUT}/results.json`, JSON.stringify({ results, timings }, null, 2));
await browser.close();
process.exit(pass === results.length ? 0 : 1);
