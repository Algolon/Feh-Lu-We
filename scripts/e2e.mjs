// End-to-end checks against the production build served under /Feh-Lu-We/.
// Usage: npm run build && npm run preview (in another shell) && node scripts/e2e.mjs [baseUrl]
// Uses the locally installed Chromium (software WebGL via SwiftShader); FPS numbers here are NOT device numbers.
import { chromium, devices } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...opts });
  const page = await ctx.newPage();
  page.problems = [];
  page.on('pageerror', (e) => page.problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') page.problems.push(`console: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400) page.problems.push(`HTTP ${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => page.problems.push(`failed ${r.url()}`));
  return { ctx, page };
}
async function startGame(page, query = '?autotest=1', fresh = true) {
  await page.goto(BASE + query);
  if (fresh) { await page.evaluate(() => localStorage.clear()); await page.reload(); }
  await page.waitForSelector(fresh ? '[data-new]' : '[data-cont]');
  await page.click(fresh ? '[data-new]' : '[data-cont]');
  await page.waitForFunction(() => window.__game?.world);
  await page.evaluate(helpers);
}
const E = (page, fn, ...args) => page.evaluate(fn, ...args);
async function shot(page, name) { await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}/${name}.png` }); }

// ------------------------------------------------------------------------------------------------
// 1. Full walkthrough (desktop), tutorial → ending, recording the solution sequence.
async function walkthrough() {
  const { ctx, page } = await newPage();
  const steps = [];
  const step = async (label, fn, arg) => {
    try {
      const r = await page.evaluate(fn, arg);
      steps.push(label);
      return r;
    } catch (e) {
      await shot(page, 'FAIL-' + label.replace(/\W+/g, '_'));
      throw new Error(`${label}: ${e.message.split('\n')[0]}`);
    }
  };
  try {
    await startGame(page);
    await shot(page, '01-home');
    // --- home tutorial
    await step('walk to table', () => T.walk([[3.2, 2.5]]));
    await step('take invitation (opens it)', () => { T.act('pk.invitation', 'Uitnodiging'); if (!T.modalOpen()) throw new Error('invitation not shown'); T.closeModal(); });
    await step('take torch', () => T.act('pk.torch', 'Zaklamp'));
    await step('take matches', () => T.act('pk.matches', 'Lucifers'));
    await step('take notebook', () => T.act('pk.notebook', 'Notitieboek'));
    await step('use matches on candle', () => { T.select('matches'); T.act('home.candle', 'Aansteken'); T.select(null); if (!T.G().state.lit['home.candle']) throw new Error('candle not lit'); });
    await step('door refuses while key missing', () => { T.walk([[6.6, 3.0]]); T.act('home.door'); if (T.G().state.scene !== 'home') throw new Error('left without key'); });
    await step('table lamp on', () => { T.walk([[5.2, 4.9], [2.6, 4.6], [1.3, 3.8]]); T.act('home.tablelamp', 'Aandoen'); if (!T.G().state.lit['home.tablelamp']) throw new Error('lamp'); });
    await step('open dressoir drawer', () => { T.walk([[1.3, 3.2]]); T.act('home.drawer', 'Openen'); T.wait(1); });
    await step('take estate key from drawer', () => T.act('pk.frontKey', 'Sleutel'));
    await shot(page, '02-home-packed');
    await step('leave home', () => { T.walk([[2.6, 4.6], [5.2, 4.9], [6.6, 3.0]]); T.act('home.door', 'Vertrekken'); });
    await page.waitForFunction(() => window.__game.world.id === 'estate' && document.getElementById('fade').className === '', null, { timeout: 30000 });
    await page.evaluate(helpers);
    await shot(page, '03-estate-gate');
    // --- beat 1: invitation pictograms + mantel order → hall drawer
    await step('walk the driveway to the manor', () => T.walk([[60, 30], [57.2, 45.5], [57.4, 49.5], [60, 50.2]], true));
    await shot(page, '04-manor-front');
    await step('unlock front door', () => { T.act('door.front', 'Ontgrendelen'); T.wait(1.2); });
    await step('enter hall', () => T.walk([[60, 54], [60, 58]]));
    await shot(page, '05-hall');
    await step('read mantelpiece', () => { T.walk([[57, 61.5], [54, 60.2], [49.8, 60.1]]); T.act('inspect.mantel', 'schoorsteenmantel'); T.closeModal(); });
    await shot(page, '06-living');
    await step('drawer lock panel', () => { T.walk([[54, 60.2], [57.3, 61.5], [57.4, 57.6]]); T.act('hall.drawer', 'Slot bekijken'); if (!document.querySelector('.dials')) throw new Error('no dial panel'); });
    await step('enter Veer–Dennenappel–Kopje', () => {
      const down = (i, n) => { for (let k = 0; k < n; k++) document.querySelector(`[data-down="${i}"]`).click(); };
      down(0, 1); down(1, 3); down(2, 5);
      document.querySelector('[data-try]').click();
      T.wait(1.2);
      if (!T.G().state.flags.drawerLockSolved) throw new Error('drawer lock not solved');
    });
    await step('take brass study key', () => T.act('pk.studyKey', 'Messing'));
    // --- beat 2: upstairs study
    await step('climb the stairs', () => { const p = T.walk([[60, 61], [63, 62.2], [63, 70.6], [59.5, 71.5]]); if (p.y < 3.3) throw new Error('not upstairs: ' + JSON.stringify(p)); });
    await shot(page, '07-landing');
    await step('unlock study door', () => { T.walk([[57.6, 67.8]]); T.act('door.study', 'Ontgrendelen'); T.wait(1.2); });
    await step('read study note + map', () => { T.walk([[55, 66.5], [51.2, 66.0]]); T.act('inspect.studyNote', 'briefje'); T.closeModal(); T.walk([[52.2, 64.6]]); T.act('inspect.forestMap', 'kaart'); T.closeModal(); });
    await shot(page, '08-study');
    await step('desk lock Put–Schuur–Vuur', () => {
      T.walk([[50.6, 66.0]]);
      T.act('study.compartment', 'Slot bekijken');
      for (const k of ['put', 'schuur', 'vuur']) document.querySelector(`[data-k="${k}"]`).click();
    });
    await page.waitForTimeout(500);
    await step('take shed key', () => { T.wait(1.5); if (!T.G().state.flags.studyLockSolved) throw new Error('study lock'); T.act('pk.shedKey', 'Schuursleutel'); });
    // --- beat 3: shed
    await step('down the stairs and out', () => { const p = T.walk([[55, 66.5], [57.6, 66.6], [59.5, 70.8], [63, 70.8], [63, 62.4], [60, 58], [60, 53.5], [60, 50.4], [57.5, 49.5], [55, 46.5]]); if (p.y > 0.2) throw new Error('still elevated'); });
    await step('forest path to the shed', () => T.walk([[47, 42], [38, 34], [32.8, 27.8], [31.4, 26.2]], true));
    await shot(page, '09-shed');
    await step('unlock shed', () => { T.act('door.shed', 'Ontgrendelen'); T.wait(1.2); T.walk([[29.6, 26.2]]); });
    await step('tool board needs light', () => { T.walk([[26.9, 26.3]]); T.act('inspect.toolboard'); if (T.modalOpen()) throw new Error('readable in the dark'); T.G().toggleTorch(); T.act('inspect.toolboard'); if (!T.modalOpen()) throw new Error('not readable with torch'); T.closeModal(); });
    await step('take kindling', () => { T.walk([[27.2, 25.6]]); T.act('pk.kindling', 'Aanmaakhout'); });
    await step('open workbench drawer + token', () => { T.walk([[27.2, 26.4]]); T.act('shed.drawer', 'Openen'); T.wait(1); T.act('pk.token', 'penning'); T.G().toggleTorch(); });
    // --- beat 4: fire clearing
    await step('walk to the fire clearing', () => T.walk([[29.6, 26.2], [31.4, 26.2], [32.8, 25.6], [32.8, 23.0], [26.5, 23.4], [21, 17.5], [17.2, 15.6], [15.6, 14.0]], true));
    await step('matches before kindling fail', () => { T.select('matches'); T.act('firepit', 'Gebruik'); if (T.G().state.lit['fire.clearing']) throw new Error('lit without wood'); });
    await step('lantern refuses without fire', () => { T.select(null); T.act('lantern.firepost.act'); if (T.G().state.lit['lantern.firepost']) throw new Error('lantern lit early'); });
    await step('kindling + matches → fire', () => { T.select('kindling'); T.act('firepit', 'Aanmaakhout'); T.select('matches'); T.act('firepit', 'Aansteken'); T.select(null); if (!T.G().state.lit['fire.clearing']) throw new Error('no fire'); });
    await step('light post lantern, read plate', () => { T.act('lantern.firepost.act', 'Lantaarn'); T.act('plate.fire', 'plaat'); if (!T.modalOpen()) throw new Error('plate not shown'); T.closeModal(); });
    await shot(page, '10-fire');
    // --- beat 5: garden lanterns
    await step('back through the forest to the garden', () => T.walk([[17.2, 15.6], [21, 17.5], [26.5, 23.4], [32.8, 23.0], [32.8, 27.8], [38, 34], [47, 42], [55, 46.5], [53, 50.0], [51.5, 51.35], [46, 51.35], [45.3, 60], [45.3, 84], [52, 89.5], [55.6, 90.8]], true));
    await shot(page, '11-garden');
    await step('a complete wrong lantern order resets the attempt (no prefix feedback)', () => {
      T.act('garden.lantern.zon', 'zon');
      T.walk([[59.6, 94.6]]); T.act('garden.lantern.maan', 'maan');
      const two = (T.G().state.seq.gardenLanterns ?? []).length;
      T.walk([[60.6, 90.9]]); T.act('garden.lantern.blad', 'blad');
      if (two !== 2) throw new Error('second lantern gave different feedback/state: ' + two);
      if ((T.G().state.seq.gardenLanterns ?? []).length) throw new Error('wrong order kept');
      T.wait(1.5);
    });
    await step('lanterns Maan → Blad → Zon', () => {
      T.walk([[59.6, 94.6]]); T.act('garden.lantern.maan', 'maan');
      T.walk([[60.6, 90.9]]); T.act('garden.lantern.blad', 'blad');
      T.walk([[55.6, 90.8]]); T.act('garden.lantern.zon', 'zon');
      if (!T.G().state.flags.lanternsSolved) throw new Error('lanterns not solved');
      T.wait(3);
    });
    await shot(page, '11b-garden-link-lights');
    // --- beat 6: conservatory + sauna
    await step('walk to the conservatory', () => T.walk([[58, 88], [76, 86.5], [87.6, 84.5], [87.6, 76.6], [85.6, 75.5]], true));
    await step('open conservatory door', () => { T.act('door.conservatoryEast', 'Openen'); T.wait(1.2); T.walk([[83, 75.5], [82.0, 74], [82.0, 66.2], [78, 65.4], [74.2, 65.9]]); });
    await shot(page, '12-conservatory');
    await step('take crank from opened lower cabinet', () => { T.wait(1); T.act('pk.crank', 'Zwengel'); });
    await step('look at pool tiles', () => { T.walk([[74.2, 68.5]]); T.lookAt(75.6, 0, 69.5); T.act(null); const m = T.G().metrics(); void m; if (!T.G().state.clues.includes('c.poolTiles')) { T.act('inspect.pool'); } T.closeModal(); if (!T.G().state.clues.includes('c.poolTiles')) throw new Error('pool clue'); });
    await step('to the sauna', () => T.walk([[74.2, 65.9], [78, 65.4], [82.0, 66.2], [82.0, 74], [83, 75.5], [85.6, 75.5], [87, 75.2]]));
    await step('open sauna, enter, heater, board', () => {
      T.act('door.sauna', 'Openen'); T.wait(1.2);
      T.walk([[87, 73.6], [87, 71.6]]);
      const p = T.pos(); if (p.y < 0.75) throw new Error('not on sauna floor ' + JSON.stringify(p));
      T.act('sauna.heater', 'Kachel aanzetten');
      T.act('inspect.saunaBoard', 'bord'); T.closeModal();
    });
    await shot(page, '13-sauna');
    await step('turn cabinet wheels to 1 Ruit 2 Golf 3 Driehoek 4 Cirkel', () => {
      T.walk([[87, 73.6], [87, 75.2], [85.6, 75.5], [83, 75.5], [82.0, 74], [82.0, 66.2], [78, 65.4], [74.2, 66.4]]);
      T.act('cab.upper', 'Glazen deur'); // locked glass door explains the wheels
      const order = ['driehoek', 'cirkel', 'ruit', 'golf'], target = ['ruit', 'golf', 'driehoek', 'cirkel'];
      const cur = ['cirkel', 'driehoek', 'golf', 'ruit'];
      for (let i = 0; i < 4; i++) {
        while (cur[i] !== target[i]) { T.act(`cab.wheel.${i + 1}`, `Tegel ${i + 1}`); cur[i] = order[(order.indexOf(cur[i]) + 1) % 4]; }
      }
      if (!T.G().state.flags.cabinetPanelSolved) throw new Error('wheels did not open the cabinet');
    });
    await step('take crest + read well note', () => { T.wait(1.5); T.act('pk.crest', 'Wapenschild'); T.act('inspect.wellNote', 'aanwijzing'); T.closeModal(); });
    // --- beat 7: well
    await step('walk to the well', () => T.walk([[78, 65.4], [82.0, 66.2], [82.0, 74], [83, 75.5], [85.6, 75.5], [90, 74], [90, 62], [75, 52], [66, 49.8], [65.5, 46.6], [70.8, 44.3], [76, 42], [82, 38.5], [88, 35], [91.3, 32], [94.6, 29], [96, 28.3]], true));
    await shot(page, '14-well');
    await step('install crank and wind up', () => { T.select('crank'); T.act('well', 'Zwengel'); T.select(null); T.act('well', 'Zwengelen'); T.wait(3); if (!T.G().state.inventory.includes('cottageKey')) throw new Error('no cottage key'); });
    // --- beat 8: cottage
    await step('walk to the cottage', () => T.walk([[94.6, 29], [91.3, 32], [88, 35], [82, 38.5], [76, 42], [70.8, 44.3], [65.5, 46.6], [55, 46.5], [53, 50.0], [51.5, 51.35], [46, 51.35], [45.3, 60], [45.3, 82], [38, 85.6], [31.5, 86.5], [25, 86.6]], true));
    await shot(page, '15-cottage');
    await step('unlock cottage', () => { T.act('door.cottage', 'Ontgrendelen'); T.wait(1.2); T.walk([[25, 89.6]]); });
    await step('gathering door is gated', () => { T.act('door.gathering', 'Op slot'); if (T.G().state.open['door.gathering']) throw new Error('opened'); });
    await step('niches: token left, crest right', () => {
      T.act('cottage.niche.left');
      document.querySelector('[data-place="left"][data-item="token"]').click();
      document.querySelector('[data-place="right"][data-item="crest"]').click();
      if (!T.G().state.flags.cottageSolved) throw new Error('slots');
      T.closeModal(); T.wait(1.5);
    });
    await step('enter gathering room → ending', () => { try { T.walk([[25, 91.9]]); } catch (e) { if (!T.modalOpen()) throw e; } T.wait(0.5); if (!T.G().state.finished) throw new Error('no ending'); if (!document.querySelector('#fb')) throw new Error('no feedback prompt'); });
    await shot(page, '16-ending');
    await step('close ending, look at the room', () => { T.closeModal(); T.lookAt(25, 1.0, 93.4); });
    await shot(page, '17-gathering-room');
    const st = await E(page, () => ({ clues: T.G().state.clues.length, minutes: T.G().state.stats.activeMs / 60000, flags: T.G().state.flags }));
    log('walkthrough tutorial → ending', true, `${steps.length} steps, ${st.clues} clues, real-time frames ${st.minutes.toFixed(1)} min (route uses fixed-step simulation)`);
    writeFileSync(`${OUT}/walkthrough-steps.txt`, steps.join('\n'));
  } catch (e) {
    log('walkthrough tutorial → ending', false, e.message);
  }
  if (page.problems.length) log('walkthrough: no console errors / 404s', false, page.problems.slice(0, 5).join(' | '));
  else log('walkthrough: no console errors / 404s', true);
  await ctx.close();
}

// ------------------------------------------------------------------------------------------------
// Helper: start directly in the estate from an injected save (test setup only — not used by the walkthrough).
const ESSENTIALS = ['invitation', 'torch', 'matches', 'notebook', 'frontKey'];
async function startEstate(page, extra = {}) {
  await page.goto(BASE + '?autotest=1');
  await page.evaluate((save) => localStorage.setItem('fehluwe.save', JSON.stringify(save)), {
    version: 2, scene: 'estate', inventory: ESSENTIALS, flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true }, ...extra,
  });
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate');
  await page.evaluate(helpers);
}

async function collisionChecks() {
  const { ctx, page } = await newPage();
  try {
    await startEstate(page, { player: { estate: { x: 60, y: 0.15, z: 58.8, yaw: 0, pitch: 0 } } });
    const r = await E(page, () => {
      const out = {};
      const P = () => T.G().player;
      // wall blocks (hall west wall W1, between console and arch)
      try { T.walkTo(53.5, 58.8, false, 4); } catch { /* expected to stop */ }
      out.wall = P().x >= 56.3;
      // closed door blocks; open door lets through
      T.walk([[60, 66], [57.6, 68.6]]);
      try { T.walkTo(57.6, 71.2, false, 4); } catch { /* blocked */ }
      out.closedDoor = P().z < 69.8;
      T.act('door.corridor', 'Openen'); T.wait(1.2);
      T.walkTo(57.6, 71.0);
      out.openDoor = P().z > 70.6;
      // door refuses to close on the player standing in the doorway
      T.walkTo(57.6, 70.0);
      T.act('door.corridor', 'Sluiten');
      out.noCrush = T.G().state.open['door.corridor'] === true;
      T.walkTo(57.6, 68.6);
      // stairs up and down
      T.walk([[60, 66], [63, 62.2], [63, 70.6]]);
      out.upY = +P().y.toFixed(2);
      T.walk([[63, 62.3]]);
      out.downY = +P().y.toFixed(2);
      // the upstairs gallery railing stops a fall into the hall
      T.walk([[63, 70.6], [59, 71.5], [59, 64.2]]);
      try { T.walkTo(59, 61.0, false, 4); } catch { /* railing */ }
      out.railing = P().z > 63.2 && P().y > 3.3;
      return out;
    });
    log('collision: wall blocks movement', r.wall);
    log('collision: closed door blocks, open door passes', r.closedDoor && r.openDoor);
    log('collision: door will not close onto the player', r.noCrush);
    log('collision: stairs reach upper floor and back', Math.abs(r.upY - 3.35) < 0.02 && Math.abs(r.downY - 0.15) < 0.02, `up ${r.upY}, down ${r.downY}`);
    log('collision: gallery railing prevents falling', r.railing);
    // pool + glass + pickup through wall
    await startEstate(page, { player: { estate: { x: 78, y: 0.15, z: 65.2, yaw: 0, pitch: 0 } } });
    const r2 = await E(page, () => {
      const P = () => T.G().player;
      try { T.walkTo(78, 74, false, 5); } catch { /* pool edge */ }
      const pool = P().z < 66.8 && P().y > 0.1;
      try { T.walkTo(78, 60, false, 5); } catch { /* glass */ }
      const glass = P().z > 64.05;
      return { pool, glass };
    });
    log('collision: pool edge is solid, no fall-through', r2.pool);
    log('collision: conservatory glass is solid', r2.glass);
    await startEstate(page, { inventory: [...ESSENTIALS, 'shedKey'], player: { estate: { x: 26.4, y: 0, z: 23.85, yaw: 0, pitch: 0 } } });
    const r3 = await E(page, () => {
      T.lookAtId('pk.kindling');
      const blocked = T.G().metrics().target !== 'pk.kindling';
      return { blocked, target: T.G().metrics().target };
    });
    log('interaction: no pickup through a wall', r3.blocked, `reticle target: ${r3.target}`);
  } catch (e) {
    log('collision checks', false, e.message.split('\n')[0]);
  }
  if (page.problems.length) log('collision: no console errors', false, page.problems.slice(0, 3).join(' | '));
  await ctx.close();
}

async function saveChecks() {
  const { ctx, page } = await newPage();
  try {
    await startGame(page);
    await E(page, () => { T.walk([[3.2, 2.5]]); T.act('pk.invitation'); T.closeModal(); T.act('pk.torch'); T.walk([[2.2, 2.4], [1.3, 3.2]]); T.act('home.drawer'); T.wait(1); T.G().saveNow(); });
    await page.reload();
    await page.click('[data-cont]');
    await page.waitForFunction(() => window.__game?.world);
    await page.evaluate(helpers);
    const r = await E(page, () => {
      const g = T.G();
      return {
        inv: g.state.inventory, taken: g.state.taken, drawer: g.state.open['home.drawer'],
        invHidden: !g.world.byId.get('pk.invitation').obj.visible,
        pos: T.pos(), notebook: g.state.clues.includes('c.invitation'),
      };
    });
    log('save: pickups survive reload and stay removed from the world', r.inv.includes('invitation') && r.inv.includes('torch') && r.invHidden, JSON.stringify(r.inv));
    log('save: drawer state survives reload', r.drawer === true);
    log('save: position restored', Math.hypot(r.pos.x - 1.3, r.pos.z - 3.2) < 0.6, JSON.stringify(r.pos));
    // upstairs + puzzle flags
    await startEstate(page, { flags: { leftHome: true, drawerLockSolved: true }, unlocked: ['lock.door.front', 'lock.hallDrawer'], open: { 'hall.drawer': true }, player: { estate: { x: 59, y: 3.35, z: 72, yaw: 0, pitch: 0 } } });
    const r2 = await E(page, () => ({ y: T.G().player.y, flag: T.G().state.flags.drawerLockSolved, obj: T.G().ui.hud.querySelector('#objective').textContent }));
    log('save: upstairs pose + puzzle flags restored', Math.abs(r2.y - 3.35) < 0.01 && r2.flag, `y=${r2.y}, objective="${r2.obj}"`);
    // pose inside closed geometry → moved to a valid checkpoint
    await startEstate(page, { player: { estate: { x: 56.0, y: 0.15, z: 58.0, yaw: 0, pitch: 0 } } });
    const r3 = await E(page, () => T.pos());
    log('save: invalid saved pose falls back to a checkpoint', !(Math.abs(r3.x - 56) < 0.3 && Math.abs(r3.z - 58) < 0.3), JSON.stringify(r3));
    // corrupted save → new game, no crash
    await page.goto(BASE + '?autotest=1'); // fresh, not-started instance
    await page.evaluate(() => localStorage.setItem('fehluwe.save', '{"version":2,"scene":"estate","inventory":"oops"'));
    await page.reload();
    const hasNewOnly = await page.evaluate(() => !!document.querySelector('[data-new]') && !document.querySelector('[data-cont]'));
    log('save: corrupted save is ignored safely', hasNewOnly);
    // reset via pause menu
    await startEstate(page);
    await page.click('#b-menu');
    await page.click('[data-restart]');
    await Promise.all([page.waitForNavigation(), page.click('[data-yes]')]);
    const afterReset = await page.evaluate(() => ({ save: localStorage.getItem('fehluwe.save'), cont: !!document.querySelector('[data-cont]') }));
    log('save: reset with confirmation clears progress', !afterReset.save && !afterReset.cont);
  } catch (e) {
    log('save checks', false, e.message.split('\n')[0]);
  }
  await ctx.close();
}

async function touchChecks() {
  const { ctx, page } = await newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  try {
    await startGame(page);
    const cdp = await ctx.newCDPSession(page);
    const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y, id]) => ({ x, y, id, radiusX: 4, radiusY: 4, force: 1 })) });
    const st = () => page.evaluate(() => ({ x: __game.player.x, z: __game.player.z, yaw: __game.player.yaw, pitch: __game.player.pitch }));
    // a) simultaneous move (left thumb) + look (right thumb)
    const s0 = await st();
    await touch('touchStart', [[120, 300, 1]]);
    await touch('touchStart', [[120, 300, 1], [650, 200, 2]]);
    for (let i = 1; i <= 10; i++) {
      await touch('touchMove', [[120, 300 - i * 5, 1], [650 + i * 8, 200, 2]]);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(900);
    const s1 = await st();
    await touch('touchEnd', []);
    const moved = Math.hypot(s1.x - s0.x, s1.z - s0.z), turned = Math.abs(s1.yaw - s0.yaw);
    log('touch: simultaneous joystick move + look drag', moved > 0.2 && turned > 0.1, `moved ${moved.toFixed(2)} m, turned ${(turned * 57.3).toFixed(0)}°`);
    // b) movement stops after release; pointercancel also clears
    await page.waitForTimeout(400);
    const s2 = await st();
    await page.waitForTimeout(600);
    const s3 = await st();
    log('touch: release stops movement', Math.hypot(s3.x - s2.x, s3.z - s2.z) < 0.02);
    await touch('touchStart', [[120, 300, 3]]);
    await touch('touchMove', [[120, 240, 3]]);
    await page.waitForTimeout(300);
    await touch('touchCancel', []);
    await page.waitForTimeout(300);
    const c0 = await st();
    await page.waitForTimeout(600);
    const c1 = await st();
    log('touch: touchcancel clears joystick (no stuck movement)', Math.hypot(c1.x - c0.x, c1.z - c0.z) < 0.02);
    // c) a drag that starts on an object looks around; a short tap on it interacts (screen-space raycast)
    const project = () => page.evaluate(() => {
      T.lookAt(4.3, 0.8, 3.05);
      const c = T.hitCenter('pk.torch');
      const v = new (window.__game.camera.position.constructor)(c.x, c.y, -c.z).project(window.__game.camera);
      return { x: (v.x + 1) / 2 * innerWidth + 40, y: (1 - v.y) / 2 * innerHeight, target: __game.metrics().target };
    });
    await page.evaluate(() => T.walk([[3.2, 2.5]]));
    const p1 = await project();
    const y0 = (await st()).yaw;
    await touch('touchStart', [[p1.x, p1.y, 5]]);
    for (let i = 1; i <= 6; i++) { await touch('touchMove', [[p1.x + i * 20, p1.y, 5]]); await page.waitForTimeout(16); }
    await touch('touchEnd', []);
    await page.waitForTimeout(300);
    const afterDrag = await page.evaluate(() => ({ taken: __game.state.taken.slice(), yaw: __game.player.yaw }));
    log('touch: drag starting on an object looks around instead of picking it', !afterDrag.taken.includes('pk.torch') && Math.abs(afterDrag.yaw - y0) > 0.05, `yaw Δ ${((afterDrag.yaw - y0) * 57.3).toFixed(0)}°`);
    // aim so the torch sits off-centre (reticle elsewhere), then tap directly on it
    const p2 = await page.evaluate(() => {
      T.lookAt(4.3, 0.8, 3.05);
      const pl = __game.player; pl.yaw -= 0.25; T.tick(2);
      const c = T.hitCenter('pk.torch');
      const v = new (window.__game.camera.position.constructor)(c.x, c.y, -c.z).project(window.__game.camera);
      return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, centre: __game.metrics().target };
    });
    await touch('touchStart', [[p2.x, p2.y, 6]]);
    await page.waitForTimeout(60);
    await touch('touchEnd', []);
    await page.waitForTimeout(300);
    const tapped = await page.evaluate(() => __game.state.taken.includes('pk.torch'));
    log('touch: direct tap on a visible nearby object picks it up', tapped, `tap at ${p2.x.toFixed(0)},${p2.y.toFixed(0)}; reticle target was ${p2.centre}`);
    // d) overlay blocks world input
    await page.tap('#b-bag');
    await page.waitForSelector('.modal');
    const o0 = await st();
    await touch('touchStart', [[120, 300, 7]]);
    await touch('touchMove', [[120, 230, 7]]);
    await page.waitForTimeout(600);
    await touch('touchEnd', []);
    const o1 = await st();
    log('touch: open overlay blocks movement and look', Math.hypot(o1.x - o0.x, o1.z - o0.z) < 0.01 && Math.abs(o1.yaw - o0.yaw) < 1e-6);
    // inventory: select an item via touch
    await page.tap('.inv button[data-id="torch"]');
    await page.tap('#inv-actions .btn.primary');
    const torchOn = await page.evaluate(() => !!__game.state.lit.torch);
    log('touch: inventory interaction (torch on via bag)', torchOn);
    // e) touch targets ≥ 48 px
    const small = await page.evaluate(() => [...document.querySelectorAll('#hud button:not([hidden])')].filter((b) => { const r = b.getBoundingClientRect(); return r.width && (r.width < 48 || r.height < 48); }).map((b) => b.id));
    log('touch: HUD buttons are at least 48 px', small.length === 0, small.join(','));
    // f) pause / resume
    await page.tap('#b-menu');
    await page.waitForSelector('[data-resume]');
    await page.tap('[data-resume]');
    const resumed = await page.evaluate(() => document.getElementById('overlay').hidden && __game.input.enabled);
    log('touch: pause and resume', resumed);
    // g) orientation change / resize
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const port = await page.evaluate(() => ({ w: __game.renderer.domElement.width, h: __game.renderer.domElement.height, aspect: __game.camera.aspect, btn: document.getElementById('action').getBoundingClientRect().bottom <= innerHeight }));
    await page.screenshot({ path: `${OUT}/touch-portrait.png` });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/touch-landscape.png` });
    log('touch: portrait resize keeps canvas + controls usable', port.h > port.w && port.aspect < 1 && port.btn, JSON.stringify(port));
  } catch (e) {
    log('touch checks', false, e.message.split('\n')[0]);
  }
  if (page.problems.length) log('touch: no console errors', false, page.problems.slice(0, 3).join(' | '));
  await ctx.close();
}

async function webglFailure() {
  const { ctx, page } = await newPage();
  await page.goto(BASE + '?nowebgl=1');
  const txt = await page.textContent('#start');
  log('WebGL failure path (forced) shows an understandable message', /kan Feh Lu We niet tonen/.test(txt ?? ''));
  await ctx.close();
  const b2 = await chromium.launch({ executablePath: exe, args: ['--disable-gpu', '--disable-webgl', '--disable-3d-apis'] });
  const p2 = await b2.newPage();
  await p2.goto(BASE);
  const t2 = await p2.textContent('#start');
  log('WebGL failure path (browser with WebGL disabled)', /kan Feh Lu We niet tonen/.test(t2 ?? ''));
  await b2.close();
}

async function metrics() {
  const { ctx, page } = await newPage();
  const views = [
    ['gate (driveway)', { x: 60, y: 0, z: 3, yaw: 0, pitch: 0.02 }],
    ['forecourt → manor', { x: 60, y: 0, z: 40, yaw: 0, pitch: 0.05 }],
    ['entrance hall', { x: 60, y: 0.15, z: 56.5, yaw: 0, pitch: 0.1 }],
    ['garden → manor + conservatory', { x: 62, y: 0, z: 96, yaw: Math.PI * 0.95, pitch: 0 }],
    ['forest (shed area)', { x: 40, y: 0, z: 36, yaw: -2.2, pitch: 0 }],
    ['conservatory pool', { x: 76, y: 0.15, z: 65.4, yaw: 0.3, pitch: -0.2 }],
  ];
  const rows = [];
  for (const [name, pose] of views) {
    await startEstate(page, { player: { estate: pose } });
    await page.waitForTimeout(1500);
    // measure one frame per quality mode; "high" includes the shadow-map pass
    const m = await page.evaluate(() => {
      const g = __game, out = {};
      for (const q of ['low', 'high']) {
        g.settings.quality = q; g.applyQuality(true);
        g.tick(1 / 30); g.renderer.render(g.world.scene, g.camera);
        const i = g.renderer.info.render; out[q] = { calls: i.calls, triangles: i.triangles };
      }
      return out;
    });
    rows.push({ name, ...m });
    await page.screenshot({ path: `${OUT}/view-${name.replace(/\W+/g, '_')}.png` });
  }
  for (const r of rows) {
    log(`render low (mobile default): ${r.name}`, r.low.calls < 150 && r.low.triangles < 200000, `${r.low.calls} calls, ${r.low.triangles} tris`);
    log(`render high (desktop, +shadows): ${r.name}`, r.high.calls < 150 * 1.6 && r.high.triangles < 300000, `${r.high.calls} calls, ${r.high.triangles} tris`);
  }
  writeFileSync(`${OUT}/metrics.json`, JSON.stringify(rows, null, 2));
  await ctx.close();
}

// ------------------------------------------------------------------------------------------------
// Iteration-2 regression checks for the independent review findings (F01–F05). Written to FAIL on the
// reviewed commit and pass after the fixes. Uses real UI input (CDP touch/mouse, DOM clicks) where it matters.
async function regressions() {
  const { ctx, page } = await newPage();
  const r = {};
  try {
    // F01 — a saved-open door must LOOK open after reload (hinge angle), not only be passable.
    await startEstate(page, { open: { 'door.front': true, 'door.corridor': true }, player: { estate: { x: 60, y: 0.15, z: 66, yaw: 0, pitch: 0 } } });
    r.f01 = await E(page, () => {
      T.tick(2);
      const it = T.G().world.byId.get('door.corridor');
      const front = T.G().world.byId.get('door.front');
      return { corridor: +it.obj.rotation.y.toFixed(2), front: +front.obj.rotation.y.toFixed(2) };
    });
    log('F01 saved-open doors are visually open after reload', Math.abs(r.f01.corridor - 1.6) < 0.05 && Math.abs(r.f01.front - 1.6) < 0.05, JSON.stringify(r.f01));
    // F02 — upstairs study compartment must not be targetable from the living room below.
    await startEstate(page, { player: { estate: { x: 49.75, y: 0.15, z: 67.2, yaw: -Math.PI / 2, pitch: 1.2 } } });
    r.f02 = await E(page, () => {
      const hits = [];
      for (const id of ['study.compartment', 'inspect.studyNote', 'pk.shedKey']) { T.lookAtId(id); hits.push(T.G().metrics().target); }
      return hits;
    });
    log('F02 upstairs desk/note not reachable through the ceiling', r.f02.every((t) => t === null || !/study|shedKey/.test(t)), JSON.stringify(r.f02));
    // F03 — with the matching key selected, an already-unlocked door opens/closes normally.
    await startEstate(page, { inventory: [...ESSENTIALS, 'studyKey'], unlocked: ['lock.door.front', 'lock.door.study'], player: { estate: { x: 57.6, y: 3.35, z: 67.6, yaw: 0, pitch: 0 } } });
    r.f03 = await E(page, () => {
      T.select('studyKey');
      const before = !!T.G().state.open['door.study'];
      const label = T.act('door.study');
      return { before, after: !!T.G().state.open['door.study'], label };
    });
    log('F03 selected key does not block opening an unlocked door', r.f03.after !== r.f03.before && !/Gebruik/.test(r.f03.label ?? ''), JSON.stringify(r.f03));
    // F04 — a completed button-lock entry must not act after the panel was replaced by another modal.
    await startEstate(page, { player: { estate: { x: 60, y: 0.15, z: 58, yaw: 0, pitch: 0 } } });
    await E(page, () => T.G().openPanel('studyLock'));
    for (const k of ['put', 'schuur', 'vuur']) await page.click(`[data-k="${k}"]`);
    await page.click('#b-bag', { force: true }).catch(() => {});
    await E(page, () => T.G().openBag());
    await page.waitForTimeout(500);
    r.f04 = await E(page, () => ({ wrong: T.G().state.wrong.studyLock ?? 0, modal: document.querySelector('.modal h2')?.textContent }));
    log('F04 no stale delayed submission closes a newer modal', r.f04.modal === 'Tas', JSON.stringify(r.f04));
    // B1 — door closing never sweeps through the player; a closing door waits while the player stands in its path
    await startEstate(page, { open: { 'door.corridor': true }, player: { estate: { x: 58.0, y: 0.15, z: 70.5, yaw: Math.PI, pitch: 0 } } });
    r.sweep = await E(page, () => {
      T.act('door.corridor', 'Sluiten');
      const refused = T.G().state.open['door.corridor'] === true;
      return { refused };
    });
    log('B1 closing a door with the player in its swing path is refused', r.sweep.refused);
    // B2 — the crest in the closed glass display is visible but not takeable; becomes takeable once open
    await startEstate(page, { player: { estate: { x: 73.6, y: 0.15, z: 66.0, yaw: -Math.PI / 2, pitch: 0 } } });
    r.glass = await E(page, () => {
      T.lookAtId('pk.crest');
      const closed = T.G().metrics().target;
      return { closed };
    });
    log('B2 no taking through closed glass/cabinet', r.glass.closed !== 'pk.crest', JSON.stringify(r.glass));
    // F10 — reduced motion holds every flame steady (shader flutter off) but keeps it visible
    await startEstate(page, { lit: { 'fire.living': true }, player: { estate: { x: 50.2, y: 0.15, z: 62, yaw: -Math.PI / 2, pitch: 0 } } });
    r.rm = await E(page, () => {
      const g = T.G();
      g.settings.reducedMotion = true; g.applyQuality();
      g.tick(1 / 30);
      const fires = []; g.world.scene.traverse((o) => { if (o.userData.fire) fires.push(o); });
      const living = fires.filter((f) => f.visible).length;
      return { n: fires.length, motion: g.fireMotion(), visibleLit: living, cls: document.body.classList.contains('reduced-motion') };
    });
    log('F10 reduced motion holds flames steady but visible + UI transitions off', r.rm.n > 0 && r.rm.motion === 0 && r.rm.visibleLit > 0 && r.rm.cls, JSON.stringify(r.rm));
    // F12 — unknown ids in a save are dropped at load; the bag still opens
    await startEstate(page, { inventory: [...ESSENTIALS, 'ghostItem'], slots: { left: 'nope' } });
    r.ids = await E(page, () => { T.G().openBag(); const n = document.querySelectorAll('.inv button').length; T.closeModal(); return { inv: T.G().state.inventory, n, slots: T.G().state.slots }; });
    log('F12 unknown saved ids are dropped; inventory UI works', !r.ids.inv.includes('ghostItem') && r.ids.n === ESSENTIALS.length && r.ids.slots.left === null, JSON.stringify(r.ids));
    // F07/G — time reading a panel counts as active; the pause menu counts as paused
    r.time = await E(page, async () => {
      T.G().settings.quality = 'low'; T.G().applyQuality(true); // software rendering: keep frames short
      await new Promise((res) => setTimeout(res, 4000)); // let shader recompilation settle
      const st = T.G().state.stats;
      const a0 = st.activeMs, p0 = st.pausedMs;
      T.G().openPanel('studyLock');
      await new Promise((res) => setTimeout(res, 3000));
      const a1 = st.activeMs;
      T.closeModal(); T.G().openPause();
      await new Promise((res) => setTimeout(res, 3000));
      const p1 = st.pausedMs, a2 = st.activeMs;
      T.closeModal();
      return { activeDuringPanel: Math.round(a1 - a0), pausedDuringPause: Math.round(p1 - p0), activeDuringPause: Math.round(a2 - a1) };
    });
    log('F07 playtime counts panel reading as active and pause as paused', r.time.activeDuringPanel > 1500 && r.time.pausedDuringPause > 1500 && r.time.activeDuringPause < 800, JSON.stringify(r.time));
    // B4 — WebGL context loss shows recovery and resumes on restore
    r.ctx = await E(page, async () => {
      const gl = T.G().renderer.getContext();
      const ext = gl.getExtension('WEBGL_lose_context');
      if (!ext) return { skipped: true };
      ext.loseContext();
      await new Promise((res) => setTimeout(res, 300));
      const shown = document.querySelector('.modal h2')?.textContent;
      ext.restoreContext();
      await new Promise((res) => setTimeout(res, 800));
      return { shown, after: document.getElementById('overlay').hidden, lost: T.G().contextLost };
    });
    log('B4 context loss pauses with a recovery dialog and resumes on restore', r.ctx.skipped || (r.ctx.shown === 'Beeld onderbroken' && r.ctx.after && !r.ctx.lost), JSON.stringify(r.ctx));
  } catch (e) {
    log('regressions', false, e.message.split('\n')[0]);
  }
  if (page.problems.filter((p) => !/context/i.test(p)).length) log('regressions: no console errors', false, page.problems.slice(0, 3).join(' | '));
  await ctx.close();
  // B4 — Start/Continue are idempotent (double click → one game loop, no errors)
  {
    const d = await newPage();
    await d.page.goto(BASE + '?autotest=1');
    await d.page.evaluate(() => localStorage.clear());
    await d.page.reload();
    await d.page.evaluate(() => { const b = document.querySelector('[data-new]'); b.click(); b.click(); b.click(); });
    await d.page.waitForFunction(() => window.__game?.world);
    await d.page.waitForTimeout(800);
    const r2 = await d.page.evaluate(() => {
      let n = 0; const orig = window.requestAnimationFrame;
      window.requestAnimationFrame = (cb) => { n++; return orig(cb); };
      return new Promise((res) => setTimeout(() => { window.requestAnimationFrame = orig; res({ perSecond: n }); }, 1000));
    });
    log('B4 repeated Start presses create one game loop', d.page.problems.length === 0 && r2.perSecond < 90, `rAF/s ${r2.perSecond} (software-rendered)`);
    await d.ctx.close();
  }
  // F05 — a stationary tap on an object in the LEFT part of the screen interacts (touch).
  const t = await newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  try {
    await startGame(t.page);
    const cdp = await t.ctx.newCDPSession(t.page);
    const pt = await t.page.evaluate(() => {
      T.walk([[3.2, 2.5]]);
      T.lookAt(4.3, 0.8, 3.05);
      const p = __game.player; p.yaw += 0.55; T.tick(2);
      const c = T.hitCenter('pk.torch');
      const v = new (__game.camera.position.constructor)(c.x, c.y, -c.z).project(__game.camera);
      return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight };
    });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pt.x, y: pt.y, id: 9 }] });
    await t.page.waitForTimeout(80);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await t.page.waitForTimeout(300);
    const taken = await t.page.evaluate(() => __game.state.taken.includes('pk.torch'));
    log('F05 stationary tap on the left side of the screen interacts', taken && pt.x < 844 * 0.42, `tap at ${pt.x.toFixed(0)},${pt.y.toFixed(0)}`);
  } catch (e) {
    log('F05', false, e.message.split('\n')[0]);
  }
  await t.ctx.close();
}

// ------------------------------------------------------------------------------------------------
// Iteration 3: persistent lights + visible flames (room/portal relevance, no view-dependent toggling)
async function lighting() {
  const { ctx, page } = await newPage();
  try {
    // L1 — from the hall, the lit living-room hearth (through the open arch) keeps a real light and a visible flame
    await startEstate(page, { player: { estate: { x: 58.5, y: 0.15, z: 61.5, yaw: -Math.PI / 2, pitch: 0 } } });
    const l1 = await E(page, () => {
      T.tick(20);
      const g = T.G(); const fire = []; g.world.scene.traverse((o) => { if (o.userData.fire) fire.push(o); });
      const hearth = fire.find((f) => Math.abs(f.position.x - 48.72) < 0.3 && Math.abs(-f.position.z - 62) < 0.3);
      const livingLamps = g.world.lamps.filter((l) => g.extras.rooms.roomAt(l.pos.x, l.pos.y, -l.pos.z) === 'living').map((l) => l.id);
      return { room: g.pool.here, assigned: g.pool.assigned(), livingLit: g.pool.assigned().some((a) => livingLamps.includes(a)), flameVisible: !!hearth && hearth.visible && !g.world.isCulled(hearth), defaultLit: g.state.lit['fire.living'] === undefined };
    });
    log('L1 seen from the hall, the living room keeps real light and its hearth flame stays visible (open arch)', l1.room === 'hall' && l1.livingLit && l1.flameVisible && l1.defaultLit, JSON.stringify(l1));
    // L2 — looking around never reorders the pooled lights
    const l2 = await E(page, () => {
      const g = T.G(); const before = g.pool.assigned().join(',');
      let changes = 0;
      for (let i = 0; i < 24; i++) { g.player.yaw += Math.PI / 12; T.tick(3); if (g.pool.assigned().join(',') !== before) changes++; }
      return { before, changes };
    });
    log('L2 looking away and back does not toggle or reorder lights', l2.changes === 0, JSON.stringify(l2));
    // L3 — walking across the threshold: no abrupt light jumps, flames stay visible throughout
    const l3 = await E(page, () => {
      const g = T.G(); let maxJump = 0, slotChanges = 0, hidden = 0;
      let prev = g.pool.lights.map((l) => l.intensity), prevA = g.pool.assigned().join(',');
      g.autopilot = { x: 52.5, z: 61.0, run: false };
      for (let i = 0; i < 120; i++) {
        g.tick(1 / 30);
        const cur = g.pool.lights.map((l) => l.intensity);
        cur.forEach((v, j) => { maxJump = Math.max(maxJump, Math.abs(v - prev[j])); });
        prev = cur;
        const a = g.pool.assigned().join(','); if (a !== prevA) { slotChanges++; prevA = a; }
        const fire = []; g.world.scene.traverse((o) => { if (o.userData.fire && Math.abs(-o.position.z - 62) < 0.3 && o.position.x < 49) fire.push(o); });
        if (!fire[0]?.visible) hidden++;
      }
      g.autopilot = null;
      return { room: g.pool.here, maxJump: +maxJump.toFixed(2), slotChanges, hiddenFrames: hidden };
    });
    log('L3 crossing the threshold changes nothing abruptly (smooth light, flame always visible)', l3.room === 'living' && l3.maxJump < 2.5 && l3.slotChanges <= 3 && l3.hiddenFrames === 0, JSON.stringify(l3));
    // L4 — a closed door blocks the other room's light; opening it lets it through
    await startEstate(page, { lit: { 'lamp.billiard': true }, player: { estate: { x: 57.6, y: 0.15, z: 71.0, yaw: Math.PI / 2, pitch: 0 } } });
    const l4 = await E(page, () => {
      const g = T.G(); T.tick(15);
      const closed = g.pool.assigned().includes('lamp.billiard');
      g.state.open['door.billiard'] = true; g.changed(); T.tick(30);
      const open = g.pool.assigned().includes('lamp.billiard');
      return { room: g.pool.here, closed, open };
    });
    log('L4 closed door blocks the neighbouring room light; open door lets it through', l4.room === 'corridor' && !l4.closed && l4.open, JSON.stringify(l4));
    // L5 — the lamp's emissive fixture is independent of the pool: still lit when it holds no real light
    const l5 = await E(page, () => {
      const g = T.G(); g.state.open['door.billiard'] = false; g.changed(); T.tick(30);
      const it = g.world.byId.get('lamp.billiard');
      let glow = null; it.obj.traverse((o) => { if (o.isMesh && !o.userData.hit && o.material?.type === 'MeshBasicMaterial') glow = o.material.color.getHexString(); });
      return { assigned: g.pool.assigned().includes('lamp.billiard'), lit: g.state.lit['lamp.billiard'], glow };
    });
    log('L5 fixture glow follows logical state, not light-slot ownership', !l5.assigned && l5.lit && l5.glow === 'ffd27a', JSON.stringify(l5));
    // L6 — candles: decorative dining candles show real flames from the start; reload keeps a doused hearth doused
    await startEstate(page, { lit: { 'fire.living': false }, player: { estate: { x: 66, y: 0.15, z: 56, yaw: 0.6, pitch: -0.2 } } });
    const l6 = await E(page, () => {
      const g = T.G(); T.tick(5); const fires = []; g.world.scene.traverse((o) => { if (o.userData.fire) fires.push(o); });
      const dining = fires.find((f) => Math.abs(f.position.x - 68) < 0.1 && Math.abs(-f.position.z - 57.3) < 0.1);
      const living = fires.find((f) => Math.abs(-f.position.z - 62) < 0.3 && f.position.x < 49);
      return { diningCandles: !!dining?.visible, livingAfterReload: !!living?.visible };
    });
    log('L6 decorative candles burn; a doused fireplace stays doused after reload', l6.diningCandles && !l6.livingAfterReload, JSON.stringify(l6));
  } catch (e) {
    log('lighting checks', false, e.message.split('\n')[0]);
  }
  if (page.problems.length) log('lighting: no console errors', false, page.problems.slice(0, 3).join(' | '));
  await ctx.close();
}

const only = process.env.E2E_ONLY?.split(',');
const suites = { regressions, lighting, walkthrough, collisionChecks, saveChecks, touchChecks, webglFailure, metrics };
for (const [name, fn] of Object.entries(suites)) if (!only || only.includes(name)) await fn();

const failed = results.filter((r) => !r.ok);
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
await browser.close();
process.exit(failed.length ? 1 : 0);
