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
// 1. Full walkthrough (desktop), tutorial → finale, normal controls only (walk, look, act, panels).
//    Thread order A (aan tafel) → B (in de kantlijn) → C (buiten de paden); walkthroughAlt checks another order.
const UI = {
  place: (pairs) => { for (const [piece, slot] of pairs) { document.querySelector(`[data-piece="${piece}"]`).click(); document.querySelector(`[data-slot="${slot}"]`).click(); } },
  keys: (ks) => { for (const k of ks) document.querySelector(`[data-k="${k}"]`).click(); },
  digits: (ds) => { ds.forEach((d, i) => { for (let k = 0; k < d; k++) document.querySelector(`[data-up="${i}"]`).click(); }); document.querySelector('[data-try]').click(); },
};
async function walkthrough() {
  const { ctx, page } = await newPage();
  const steps = [];
  const step = async (label, fn, arg) => {
    try {
      const r = await page.evaluate(fn, arg);
      steps.push(`${label} @ ${(await page.evaluate(() => (window.__simTicks ?? 0) / 30)).toFixed(0)} s`);
      return r;
    } catch (e) {
      await shot(page, 'FAIL-' + label.replace(/\W+/g, '_'));
      throw new Error(`${label}: ${e.message.split('\n')[0]}`);
    }
  };
  try {
    await startGame(page);
    await page.evaluate(`window.UI = { place: ${UI.place}, keys: ${UI.keys}, digits: ${UI.digits} }`);
    await shot(page, '01-home');
    // --- home tutorial
    await step('walk to table', () => T.walk([[3.2, 2.5]]));
    await step('take invitation (opens it)', () => { T.act('pk.invitation', 'Uitnodiging'); if (!T.modalOpen()) throw new Error('invitation not shown'); T.closeModal(); });
    await step('take torch', () => T.act('pk.torch', 'Zaklamp'));
    await step('take matches', () => T.act('pk.matches', 'Lucifers'));
    await step('take notebook', () => T.act('pk.notebook', 'Notitieboek'));
    await step('use matches on candle', () => { T.select('matches'); T.act('home.candle', 'Aansteken'); T.select(null); if (!T.G().state.lit['home.candle']) throw new Error('candle not lit'); });
    await step('door refuses while key missing', () => { T.walk([[6.6, 3.0]]); T.act('home.door'); if (T.G().state.scene !== 'home') throw new Error('left without key'); });
    await step('open dressoir drawer', () => { T.walk([[5.2, 4.9], [2.6, 4.6], [1.3, 3.2]]); T.act('home.drawer', 'Openen'); T.wait(1); });
    await step('take estate key from drawer', () => T.act('pk.frontKey', 'Sleutel'));
    await step('leave home', () => { T.walk([[2.6, 4.6], [5.2, 4.9], [6.6, 3.0]]); T.act('home.door', 'Vertrekken'); });
    await page.waitForFunction(() => window.__game.world.id === 'estate' && document.getElementById('fade').className === '', null, { timeout: 60000 });
    await page.evaluate(helpers);
    await page.evaluate(`window.UI = { place: ${UI.place}, keys: ${UI.keys}, digits: ${UI.digits} }`);
    await page.evaluate(() => { window.__simTicks = 0; });
    await shot(page, '03-estate-gate');
    // --- arrival: the drive to the manor and the hall drawer
    await step('walk the driveway to the manor', () => T.walk([[90, 30], [90.5, 48], [90, 62], [87, 70], [89.6, 77.6], [90, 79.0]], true));
    await shot(page, '04-manor-front');
    await step('unlock front door', () => { T.act('door.front', 'Ontgrendelen'); T.wait(1.2); });
    await step('enter hall', () => T.walk([[90, 82], [90, 86]]));
    await shot(page, '05-hall');
    await step('read mantelpiece', () => { T.walk([[86.5, 88.5], [83, 89.2], [77.5, 89.2], [75.2, 88.6], [74.6, 86.7]]); T.act('inspect.mantel'); T.closeModal(); });
    await shot(page, '06-living');
    await step('drawer lock panel', () => { T.walk([[75.2, 88.6], [77.5, 89.2], [83, 89.2], [86.5, 88.5], [86.5, 85.5]]); T.act('hall.drawer', 'Slot bekijken'); if (!document.querySelector('.dials')) throw new Error('no dial panel'); });
    await step('enter Veer–Dennenappel–Kopje', () => {
      const down = (i, n) => { for (let k = 0; k < n; k++) document.querySelector(`[data-down="${i}"]`).click(); };
      down(0, 1); down(1, 3); down(2, 5);
      document.querySelector('[data-try]').click();
      T.wait(1.2);
      if (!T.G().state.flags.drawerLockSolved) throw new Error('drawer lock not solved');
    });
    await step('take ledger (reads it) + shed key', () => { T.act('pk.ledger', 'Landgoedregister'); if (!T.modalOpen()) throw new Error('ledger not shown'); T.closeModal(); T.act('pk.shedKey', 'Schuursleutel'); });
    await step('notebook shows three threads', () => { T.G().openNotebook(); const n = document.querySelectorAll('.thread').length; T.closeModal(); if (n < 3) throw new Error('threads: ' + n); });
    // --- thread A: aan tafel
    await step('A: read the torn hosting plan', () => { T.walk([[90, 85.2], [97, 85.2], [97, 90.4], [103.5, 90.4], [105.6, 88.6], [105.9, 86.3]]); T.act('inspect.hostingPlan', 'tafelplan'); T.closeModal(); });
    await step('A: service chart — a wrong full plan is refused', () => {
      T.walk([[105.6, 88.6], [103.5, 90.4], [101, 93.5], [96.7, 96]]);
      T.act('kitchen.chart', 'Labels');
      UI.place([['warm', 'provisie'], ['koud', 'serre'], ['bloem', 'tafel']]);
      if (T.G().state.flags.servicePlanSolved) throw new Error('wrong plan accepted');
      if (!T.modalOpen()) throw new Error('panel closed');
    });
    await step('A: take tags back and hang them by the rule', () => {
      for (const sl of ['provisie', 'serre', 'tafel']) document.querySelector(`[data-take="${sl}"]`).click();
      UI.place([['koud', 'provisie'], ['bloem', 'serre'], ['warm', 'tafel']]);
      T.wait(1.2);
      if (!T.G().state.flags.servicePlanSolved) throw new Error('service plan not solved');
    });
    await step('A: conservatory key from the hatch', () => { T.walk([[96.6, 98.6]]); T.act('pk.consKey', 'Serresleutel'); T.closeModal(); });
    await step('A: through the service corridor', () => { T.walk([[98.6, 102.9], [104, 102.9], [107.0, 102.5]]); T.act('door.service', 'Openen'); T.wait(1.2); T.walk([[109.5, 102.5], [114.6, 102.5]]); T.act('door.consWest', 'Ontgrendelen'); T.wait(1.2); T.walk([[117.4, 102.5]]); });
    await shot(page, '12-conservatory');
    await step('A: pool mosaic + forgotten trolley', () => {
      T.walk([[117.4, 95.6], [123, 95.6]]);
      T.lookAt(123, 0, 97.6);
      if (T.G().metrics().target !== 'inspect.pool') throw new Error('pool not targeted: ' + T.G().metrics().target);
      T.G().doAction(); T.tick(2); T.closeModal();
      T.walk([[127.7, 95.6], [127.7, 97.9]]); T.act('inspect.trolley', 'serveerwagen'); T.closeModal();
    });
    await step('A: out to the sauna', () => { T.walk([[127.7, 101.5], [129.0, 101.5]]); T.act('door.consEast', 'Openen'); T.wait(1.2); T.walk([[131.6, 101.5], [131.6, 106.0], [134, 106.2]]); T.act('door.sauna', 'Openen'); T.wait(1.2); T.walk([[134, 104.6], [134, 101.8]]); const p = T.pos(); if (p.y < 0.75) throw new Error('not on sauna floor ' + JSON.stringify(p)); });
    await step('A: sauna heater + board', () => { T.act('sauna.heater', 'Kachel'); T.act('inspect.saunaBoard', 'bord'); T.closeModal(); });
    await shot(page, '13-sauna');
    await step('A: cabinet wheels 1 Ruit 2 Golf 3 Driehoek 4 Cirkel', () => {
      T.walk([[134, 104.6], [134, 106.2], [131.6, 106.0], [131.6, 101.5], [127.7, 101.5], [127.7, 95.6], [118.0, 95.6], [117.6, 96.4]]);
      T.act('cab.upper', 'Glazen deur');
      const order = ['driehoek', 'cirkel', 'ruit', 'golf'], target = ['ruit', 'golf', 'driehoek', 'cirkel'];
      const cur = ['cirkel', 'driehoek', 'golf', 'ruit'];
      for (let i = 0; i < 4; i++) while (cur[i] !== target[i]) { T.act(`cab.wheel.${i + 1}`, `Tegel ${i + 1}`); cur[i] = order[(order.indexOf(cur[i]) + 1) % 4]; }
      if (!T.G().state.flags.cabinetPanelSolved) throw new Error('wheels did not open the cabinet');
    });
    await step('A: take the table seal', () => { T.wait(1.5); T.act('pk.tableSeal', 'Tafelzegel'); });
    // --- thread B: in de kantlijn
    await step('B: back through the wing to the library', () => {
      T.walk([[117.6, 99.0], [117.4, 102.5], [114.6, 102.5], [109.5, 102.5], [107.0, 102.5], [104, 102.9], [98.6, 102.9], [98.0, 94.0], [101, 92.4], [97, 90.4], [97, 85.2], [90, 85.2], [88.5, 99.5], [86.2, 101.0]]);
      T.act('door.library', 'Openen'); T.wait(1.2); T.walk([[84.0, 101.0], [83.0, 98.4], [83.0, 96.6]]);
    });
    await shot(page, '07-library');
    await step('B: floor plan, guestbook, desk', () => {
      T.act('inspect.libraryPlan', 'plattegrond'); T.closeModal();
      T.walk([[83.6, 103.5], [83.8, 105.0]]); T.act('inspect.guestbookTabs', 'gastenboek'); T.closeModal();
      T.walk([[82.6, 103.0], [82.5, 101.2]]); T.act('library.catalog', 'Boeken');
      UI.place([['ster', 'rond'], ['varen', 'punt'], ['koffer', 'vierkant']]);
      T.wait(1.2);
      if (!T.G().state.flags.catalogSolved) throw new Error('catalogue not solved');
    });
    await step('B: brass key and archive card', () => { T.act('pk.studyKey', 'messing'); T.closeModal(); });
    await step('B: read the note on secret writing', () => { T.walk([[82.5, 99.2], [79.5, 99.4], [75.0, 99.4], [74.6, 101.1]]); T.act('inspect.cipherExample', 'notitie'); T.closeModal(); });
    await step('B: up the grand stair', () => { const p = T.walk([[75.0, 99.4], [79.5, 99.4], [82.5, 99.2], [84.0, 101.0], [86.2, 101.0], [88.5, 99.5], [90, 92], [94.0, 85.6], [94.0, 96.3], [93.0, 97.3]]); if (p.y < 3.3) throw new Error('not upstairs: ' + JSON.stringify(p)); });
    await shot(page, '08-landing');
    await step('B: unlock the study', () => { T.walk([[96.5, 97.3], [98.2, 97.3]]); T.act('door.study', 'Ontgrendelen'); T.wait(1.2); T.walk([[98.2, 94.6]]); });
    await step('B: note + framed map', () => { T.walk([[97.0, 84.2], [97.0, 83.0]]); T.act('inspect.studyNote', 'briefje'); T.closeModal(); T.walk([[99.6, 87.5]]); T.act('inspect.forestMap', 'kaart'); T.closeModal(); });
    await shot(page, '09-study');
    await step('B: desk lock Put–Schuur–Vuur', () => { T.walk([[98.2, 83.6]]); T.act('study.compartment', 'Slot bekijken'); UI.keys(['put', 'schuur', 'vuur']); T.wait(1.5); if (!T.G().state.flags.studyLockSolved) throw new Error('study lock'); });
    await step('B: take the archive seal', () => T.act('pk.archiveSeal', 'Archiefzegel'));
    // --- thread C: buiten de paden
    await step('C: downstairs and out of the front door', () => { const p = T.walk([[98.2, 94.6], [98.2, 97.3], [93.0, 97.3], [94.0, 96.3], [94.0, 85.6], [90, 85], [90, 82], [90, 79.0], [87, 72.5], [84, 68]]); if (p.y > 0.2) throw new Error('still elevated ' + JSON.stringify(p)); });
    await step('C: forest path to the shed', () => T.walk([[82, 67.5], [71, 62], [58, 51], [48.5, 42.5], [46.4, 39.0]], true));
    await shot(page, '10-shed');
    await step('C: unlock shed', () => { T.act('door.shed', 'Ontgrendelen'); T.wait(1.2); T.walk([[43.6, 38.95]]); });
    await step('C: tool board needs light', () => { T.walk([[41.4, 38.95]]); T.act('inspect.toolboard'); if (T.modalOpen()) throw new Error('readable in the dark'); T.G().toggleTorch(); T.act('inspect.toolboard'); if (!T.modalOpen()) throw new Error('not readable with torch'); T.closeModal(); });
    await step('C: kindling', () => { T.walk([[41.4, 38.2]]); T.act('pk.kindling', 'Aanmaakhout'); });
    await step('C: workbench drawer + journal', () => { T.walk([[41.4, 39.2]]); T.act('shed.drawer', 'Openen'); T.wait(1); T.act('pk.journal', 'journaal'); T.closeModal(); T.G().toggleTorch(); });
    await step('C: walk to the fire clearing', () => T.walk([[43.6, 38.95], [46.4, 39.0], [47.3, 38.6], [47.3, 35.6], [40, 35.4], [38, 35.5], [31, 27], [25.6, 22.6], [22.6, 20.8]], true));
    await step('C: matches before kindling fail', () => { T.select('matches'); T.act('firepit', 'Gebruik'); if (T.G().state.lit['fire.clearing']) throw new Error('lit without wood'); });
    await step('C: lantern refuses without fire', () => { T.select(null); T.act('lantern.firepost.act'); if (T.G().state.lit['lantern.firepost']) throw new Error('lantern lit early'); });
    await step('C: kindling + matches → fire', () => { T.select('kindling'); T.act('firepit', 'Aanmaakhout'); T.select('matches'); T.act('firepit', 'Aansteken'); T.select(null); if (!T.G().state.lit['fire.clearing']) throw new Error('no fire'); });
    await step('C: light post lantern, read plate', () => { T.act('lantern.firepost.act', 'Lantaarn'); T.act('plate.fire', 'plaat'); if (!T.modalOpen()) throw new Error('plate not shown'); T.closeModal(); });
    await shot(page, '11-fire');
    await step('C: back to the manor and round to the lawn', () => T.walk([[25.6, 22.6], [31, 27], [38, 35.5], [40, 35.4], [47.3, 35.6], [48.5, 42.5], [58, 51], [71, 62], [82, 67.5], [70, 76], [68, 96], [68, 112], [80, 121.5], [86.4, 125.4]], true));
    await shot(page, '14-garden');
    await step('C: a complete wrong lantern order resets the attempt (no prefix feedback)', () => {
      T.act('garden.lantern.zon', 'zon');
      T.walk([[88.4, 131.2]]); T.act('garden.lantern.maan', 'maan');
      const two = (T.G().state.seq.gardenLanterns ?? []).length;
      T.walk([[93.4, 129.6]]); T.act('garden.lantern.blad', 'blad');
      if (two !== 2) throw new Error('second lantern gave different feedback/state: ' + two);
      if ((T.G().state.seq.gardenLanterns ?? []).length) throw new Error('wrong order kept');
      T.wait(1.5);
    });
    await step('C: lanterns Maan → Blad → Zon open the stone', () => {
      T.walk([[88.4, 131.2]]); T.act('garden.lantern.maan', 'maan');
      T.walk([[93.4, 129.6]]); T.act('garden.lantern.blad', 'blad');
      T.walk([[93.0, 125.4], [86.4, 125.4]]); T.act('garden.lantern.zon', 'zon');
      if (!T.G().state.flags.lanternsSolved) throw new Error('lanterns not solved');
      T.wait(2);
    });
    await step('C: take the trail seal', () => { T.walk([[88.6, 126.4]]); T.act('pk.trailSeal', 'Spoorzegel'); });
    // --- convergence
    await step('D: in by the billiard garden door to the basement door', () => {
      T.walk([[90, 121], [91.5, 111.0]]); T.act('door.billiardOut', 'Openen'); T.wait(1.2);
      T.walk([[91.5, 108.6], [92.4, 106.5], [91.6, 104.6], [88.5, 104.6]]); T.act('door.billiard', 'Openen'); T.wait(1.2);
      T.walk([[88.5, 102.5], [90.6, 98.9]]);
    });
    await step('D: three seals open the basement door', () => { T.act('door.basement', 'Kelderdeur'); T.wait(1.5); if (!T.G().state.flags.basementOpen) throw new Error('basement closed'); });
    await step('D: down the basement stair', () => { const p = T.walk([[93.5, 98.9], [93.5, 104.3], [93.5, 106.6]]); if (p.y > -3) throw new Error('not in the basement ' + JSON.stringify(p)); });
    await shot(page, '15-basement');
    await step('D: service drawing in the archive', () => { T.walk([[90.6, 107.2], [87, 107.2], [82.5, 108.3]]); T.act('inspect.serviceDrawing', 'leidingtekening'); T.closeModal(); });
    await step('D: route console', () => {
      T.walk([[82.4, 104.5], [82.4, 101.2], [83, 99.2], [83, 92.2]]);
      T.act('route.console', 'Zegels');
      UI.place([['archiveSeal', 'muren'], ['tableSeal', 'water'], ['trailSeal', 'paden']]);
      T.wait(1.2);
      if (!T.G().state.flags.routeRestored) throw new Error('route not restored');
    });
    await shot(page, '16-route');
    await step('D: take the letter strip', () => { T.walk([[84.1, 92.2]]); T.act('pk.cipherStrip', 'Letterstrook'); T.closeModal(); });
    await step('D: up and out to the forest', () => { const p = T.walk([[83, 92.2], [83, 99.2], [82.4, 101.2], [82.4, 104.5], [87, 107.2], [90.6, 107.2], [93.5, 106.6], [93.5, 104.3], [93.5, 98.9], [90.6, 98.9], [88.5, 95], [90, 86], [90, 82], [90, 79.0], [87, 72.5], [90, 62], [90.5, 48], [90, 26], [88, 11.2]], true); if (p.y < -0.1) throw new Error('still below ' + JSON.stringify(p)); });
    await step('D: west along the southern loop to the fork signpost', () => { T.walk([[76, 9.4], [57.5, 8.0]], true); T.act('inspect.fork', 'wegwijzer'); T.closeModal(); });
    await step('D: up the side path into the cut', () => T.walk([[59.5, 10.4], [63, 12.4], [63, 16.4]]));
    await shot(page, '17-boslust');
    await step('D: inscription, then the cover with the strip', () => { T.act('inspect.boslust', 'gravure'); T.closeModal(); T.walk([[64.4, 16.6]]); T.act('boslust.lock', 'Klepje'); if (!T.G().state.flags.boslustCover) throw new Error('cover still closed'); if (!document.querySelector('.digits')) throw new Error('no digit panel'); });
    await step('D: a wrong code gives neutral feedback', () => { UI.digits([2, 4, 1, 4]); if (T.G().state.flags.boslustOpen) throw new Error('wrong code opened'); for (let i = 0; i < 4; i++) for (let k = 0; k < 10 - [2, 4, 1, 4][i]; k++) document.querySelector(`[data-up="${i}"]`).click(); });
    await step('D: TWEE VIER EEN DRIE → 2413 opens BOSLUST', () => { UI.digits([2, 4, 1, 3]); T.wait(1.5); if (!T.G().state.flags.boslustOpen) throw new Error('door closed'); });
    await step('D: down the stair under the hill (no teleport)', () => { const p = T.walk([[63, 17.4], [63, 19.4], [63, 25.6], [63, 30]]); if (p.y > -3.2) throw new Error('not under the hill ' + JSON.stringify(p)); });
    await shot(page, '18-under-hill');
    await step('D: plate diagram', () => { T.walk([[63.4, 35.2]]); T.act('inspect.plateDiagram', 'tekening'); T.closeModal(); });
    await step('D: turn the three plates, pull the lever', () => {
      const turns = { tafel: [41.6, 2], boek: [39.8, 1], boom: [38.0, 1] };
      for (const [id, [z, n]] of Object.entries(turns)) { T.walk([[63.7, z]]); for (let k = 0; k < n; k++) T.act(`plate.${id}`, 'Draaien'); }
      T.walk([[63.7, 36.6]]); T.act('plates.lever', 'Hendel'); T.wait(1.5);
      if (!T.G().state.flags.platesSolved) throw new Error('plates not solved');
    });
    await step('D: into the gathering room', () => T.walk([[63, 43.6], [63, 46.6], [63.1, 48.9]]));
    await shot(page, '19-gathering');
    await step('D: the letter on the table → finale', () => { T.act('finale.letter', 'brief'); T.wait(0.5); if (!T.G().state.finished) throw new Error('no ending'); if (!document.querySelector('#fb')) throw new Error('no feedback prompt'); });
    await shot(page, '20-ending');
    await step('the old tunnel is a late shortcut to the manor basement', () => {
      T.closeModal();
      T.walk([[59.6, 49.0], [59.6, 53.4], [63, 55.6]]); T.act('door.tunnelGathering', 'Openen'); T.wait(1.2);
      T.walk([[63, 58.5], [63, 70], [63, 97], [75.6, 97]], true);
      T.act('door.tunnelManor', 'Grendel'); T.wait(1.2);
      const p = T.walk([[78.6, 97], [83, 97]]);
      if (T.G().world.hereRoom !== 'route') throw new Error('not in the route chamber: ' + JSON.stringify(p));
    });
    const st = await E(page, () => ({ clues: T.G().state.clues.length, simMin: (window.__simTicks ?? 0) / 30 / 60 }));
    log('walkthrough tutorial → finale (A → B → C)', true, `${steps.length} steps, ${st.clues} clues, ${st.simMin.toFixed(1)} min of simulated walking/acting in the estate (no reading time)`);
    writeFileSync(`${OUT}/walkthrough-steps.txt`, steps.join('\n'));
  } catch (e) {
    log('walkthrough tutorial → finale (A → B → C)', false, e.message);
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
    version: 4, scene: 'estate', inventory: ESSENTIALS, flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true }, ...extra,
  });
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate');
  await page.evaluate(helpers);
}

async function collisionChecks() {
  const { ctx, page } = await newPage();
  try {
    await startEstate(page, { player: { estate: { x: 88, y: 0.15, z: 92.5, yaw: 0, pitch: 0 } } });
    const r = await E(page, () => {
      const out = {};
      const P = () => T.G().player;
      // wall blocks (hall | living wall north of the arch)
      try { T.walkTo(80, 92.5, false, 4); } catch { /* expected to stop */ }
      out.wall = P().x >= 85.25;
      // closed door blocks; open door lets through (lobby → library)
      T.walk([[88, 96], [88.5, 101], [86.6, 101]]);
      try { T.walkTo(82.5, 101, false, 4); } catch { /* blocked */ }
      out.closedDoor = P().x > 85.2;
      T.act('door.library', 'Openen'); T.wait(1.2);
      T.walkTo(84.2, 101);
      out.openDoor = P().x < 84.6;
      // door refuses to close on the player standing in the doorway
      T.walkTo(85.0, 101);
      T.act('door.library', 'Sluiten');
      out.noCrush = T.G().state.open['door.library'] === true;
      T.walkTo(86.6, 101);
      // grand stair up and down
      T.walk([[88.5, 97], [90, 90], [94.0, 85.6], [94.0, 96.3]]);
      out.upY = +P().y.toFixed(2);
      T.walk([[94.0, 85.6]]);
      out.downY = +P().y.toFixed(2);
      // the upstairs gallery railing stops a fall into the hall
      T.walk([[94.0, 96.3], [90, 100], [85.9, 96], [85.9, 92]]);
      try { T.walkTo(90, 92, false, 4); } catch { /* railing */ }
      out.railing = P().x < 86.7 && P().y > 3.3;
      // basement stair: the sealed door blocks it; the stairwell floor is not walkable "air"
      T.walk([[85.9, 96], [90, 100], [94.0, 96.3], [94.0, 85.6], [90, 90], [88.5, 99], [90.6, 98.9]]);
      try { T.walkTo(93.5, 98.9, false, 4); } catch { /* closed */ }
      out.basementShut = P().x < 91.8 && P().y > 0;
      return out;
    });
    log('collision: wall blocks movement', r.wall);
    log('collision: closed door blocks, open door passes', r.closedDoor && r.openDoor);
    log('collision: door will not close onto the player', r.noCrush);
    log('collision: grand stair reaches the upper floor and back', Math.abs(r.upY - 3.35) < 0.02 && Math.abs(r.downY - 0.15) < 0.02, `up ${r.upY}, down ${r.downY}`);
    log('collision: gallery railing prevents falling', r.railing);
    log('collision: the sealed basement door blocks the stair', r.basementShut);
    // pool + glass
    await startEstate(page, { unlocked: ['lock.door.front', 'lock.door.consWest'], player: { estate: { x: 123, y: 0.15, z: 95.5, yaw: 0, pitch: 0 } } });
    const r2 = await E(page, () => {
      const P = () => T.G().player;
      try { T.walkTo(123, 103, false, 5); } catch { /* pool edge */ }
      const pool = P().z < 96.8 && P().y > 0.1;
      try { T.walkTo(123, 90, false, 5); } catch { /* glass */ }
      const glass = P().z > 94.05;
      return { pool, glass };
    });
    log('collision: pool edge is solid, no fall-through', r2.pool);
    log('collision: conservatory glass is solid', r2.glass);
    // the hill is walkable terrain; the BOSLUST door blocks until opened
    await startEstate(page, { player: { estate: { x: 63, y: 0, z: 14, yaw: 0, pitch: 0 } } });
    const r4 = await E(page, () => {
      const P = () => T.G().player;
      try { T.walkTo(63, 21, false, 4); } catch { /* door */ }
      const door = P().z < 18.0 && P().y > -0.1;
      let maxY = 0;
      for (const [x, z] of [[63, 10], [56, 10], [52, 22], [56, 31]]) { try { T.walkTo(x, z, false, 12); } catch { /* trees on the slope */ } maxY = Math.max(maxY, P().y); }
      return { door, hillY: +maxY.toFixed(2), z: +P().z.toFixed(1) };
    });
    log('collision: BOSLUST door blocks while locked', r4.door);
    log('terrain: the hill flank is walkable (feet follow the ground)', r4.hillY > 0.8, `y ${r4.hillY} at z ${r4.z}`);
    await startEstate(page, { inventory: [...ESSENTIALS, 'shedKey'], player: { estate: { x: 40.4, y: 0, z: 36.3, yaw: 0, pitch: 0 } } });
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
    await startEstate(page, { flags: { leftHome: true, drawerLockSolved: true }, unlocked: ['lock.door.front', 'lock.hallDrawer'], open: { 'hall.drawer': true }, player: { estate: { x: 89, y: 3.35, z: 100, yaw: 0, pitch: 0 } } });
    const r2 = await E(page, () => ({ y: T.G().player.y, flag: T.G().state.flags.drawerLockSolved, obj: T.G().ui.hud.querySelector('#objective').textContent }));
    log('save: upstairs pose + puzzle flags restored', Math.abs(r2.y - 3.35) < 0.01 && r2.flag, `y=${r2.y}, objective="${r2.obj}"`);
    // pose inside closed geometry → moved to a valid checkpoint
    await startEstate(page, { player: { estate: { x: 85.0, y: 0.15, z: 92.5, yaw: 0, pitch: 0 } } });
    const r3 = await E(page, () => T.pos());
    log('save: invalid saved pose falls back to a checkpoint', !(Math.abs(r3.x - 85) < 0.3 && Math.abs(r3.z - 92.5) < 0.3), JSON.stringify(r3));
    // underground pose survives a reload
    await startEstate(page, { flags: { leftHome: true, boslustOpen: true }, player: { estate: { x: 63, y: -3.4, z: 30, yaw: 0, pitch: 0 } } });
    const r4 = await E(page, () => ({ ...T.pos(), room: T.G().world.hereRoom }));
    log('save: underground pose restored', Math.abs(r4.y + 3.4) < 0.02 && r4.room === 'entry', JSON.stringify(r4));
    // an iteration-2 save migrates: tools kept, safe spawn, notice offered once
    await page.goto(BASE + '?autotest=1');
    await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 3, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'crank'], flags: { leftHome: true, drawerLockSolved: true, lanternsSolved: true }, unlocked: ['lock.door.front', 'lock.hallDrawer'], open: { 'door.front': true }, finished: true, stats: { activeMs: 3e6, finishedAt: 5, finishedActiveMs: 2.4e6 }, player: { home: null, estate: { x: 25, y: 0.3, z: 93, yaw: 0, pitch: 0 } } })));
    await page.reload();
    await page.click('[data-cont]');
    await page.waitForFunction(() => window.__game?.world?.id === 'estate');
    await page.evaluate(helpers);
    const mg = await E(page, () => ({ title: document.querySelector('.modal h2')?.textContent, inv: T.G().state.inventory, pos: T.pos(), stone: T.G().state.open['lantern.stone'], archived: T.G().state.archive?.chapter1Finished, finished: T.G().state.finished }));
    log('save: v3 → v4 migration keeps tools, opens retained rewards, archives the old ending, offers the new chapter', mg.title === 'Het landgoed is veranderd' && mg.inv.includes('torch') && !mg.inv.includes('crank') && mg.stone && mg.archived && !mg.finished, JSON.stringify(mg));
    // corrupted save → new game, no crash
    await page.goto(BASE + '?autotest=1'); // fresh, not-started instance
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('fehluwe.save', '{"version":2,"scene":"estate","inventory":"oops"'); });
    await page.reload();
    const hasNewOnly = await page.evaluate(() => !!document.querySelector('[data-new]') && !document.querySelector('[data-cont]'));
    log('save: corrupted save is ignored safely', hasNewOnly);
    // reset via pause menu
    await startEstate(page);
    await page.click('#b-menu');
    await page.click('[data-restart]');
    await Promise.all([page.waitForNavigation(), page.click('[data-yes]')]);
    const afterReset = await page.evaluate(() => ({ save: localStorage.getItem('fehluwe.save'), backup: !!localStorage.getItem('fehluwe.save.prev'), cont: !!document.querySelector('[data-cont]'), restore: !!document.querySelector('[data-restore]') }));
    log('save: restart sets progress aside (no blanket wipe) and offers to restore it', !afterReset.save && !afterReset.cont && afterReset.backup && afterReset.restore, JSON.stringify(afterReset));
    await page.click('[data-restore]');
    await page.click('[data-yes]');
    await page.waitForFunction(() => window.__game?.world?.id === 'estate');
    log('save: restoring the set-aside progress continues the old game', await page.evaluate(() => window.__game.state.scene === 'estate'));
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
    ['gate (driveway)', { x: 90, y: 0, z: 3, yaw: 0, pitch: 0.02 }],
    ['forecourt → manor', { x: 90, y: 0, z: 60, yaw: 0, pitch: 0.05 }],
    ['entrance hall', { x: 90, y: 0.15, z: 83, yaw: 0, pitch: 0.1 }],
    ['library', { x: 82.4, y: 0.15, z: 97.5, yaw: -0.8, pitch: 0.05 }],
    ['garden → manor + conservatory', { x: 92, y: 0, z: 136, yaw: Math.PI * 0.9, pitch: 0 }],
    ['forest (shed area)', { x: 50, y: 0, z: 44, yaw: -2.2, pitch: 0 }],
    ['BOSLUST cut', { x: 63, y: 0, z: 9, yaw: 0, pitch: 0.08 }],
    ['conservatory pool', { x: 118, y: 0.15, z: 95.5, yaw: 0.5, pitch: -0.2 }],
    ['gathering room', { x: 63, y: -3.4, z: 46.5, yaw: 0, pitch: 0 }],
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
    log(`render low (phone default): ${r.name}`, r.low.calls <= 150 && r.low.triangles <= 250000, `${r.low.calls} calls, ${r.low.triangles} tris`);
    log(`render high (desktop, +shadows): ${r.name}`, r.high.calls <= 150 * 1.8 && r.high.triangles <= 450000, `${r.high.calls} calls, ${r.high.triangles} tris`);
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
    await startEstate(page, { open: { 'door.front': true, 'door.library': true }, player: { estate: { x: 90, y: 0.15, z: 90, yaw: 0, pitch: 0 } } });
    r.f01 = await E(page, () => {
      T.tick(2);
      const it = T.G().world.byId.get('door.library');
      const front = T.G().world.byId.get('door.front');
      // door.library hinges along z+ (base π/2... rotation includes the base angle): compare against its closed base
      return { library: +(it.obj.rotation.y - Math.atan2(1, 0)).toFixed(2), front: +front.obj.rotation.y.toFixed(2) };
    });
    log('F01 saved-open doors are visually open after reload', Math.abs(Math.abs(r.f01.library) - 1.6) < 0.05 && Math.abs(r.f01.front - 1.6) < 0.05, JSON.stringify(r.f01));
    // F02 — upstairs study compartment must not be targetable from the living room below.
    await startEstate(page, { player: { estate: { x: 80, y: 0.15, z: 86.7, yaw: -Math.PI / 2, pitch: 1.2 } } });
    r.f02 = await E(page, () => {
      const hits = [];
      for (const id of ['mem.reis.suitcase', 'mem.sterren.telescope', 'lamp.sterren']) { T.lookAtId(id); hits.push(T.G().metrics().target); }
      return hits;
    });
    log('F02 upstairs bedroom objects not reachable through the ceiling', r.f02.every((t) => t === null || !/reis|sterren/.test(t)), JSON.stringify(r.f02));
    // F03 — with the matching key selected, an already-unlocked door opens/closes normally.
    await startEstate(page, { inventory: [...ESSENTIALS, 'studyKey'], unlocked: ['lock.door.front', 'lock.door.study'], player: { estate: { x: 98.2, y: 3.35, z: 97.6, yaw: Math.PI, pitch: 0 } } });
    r.f03 = await E(page, () => {
      T.select('studyKey');
      const before = !!T.G().state.open['door.study'];
      const label = T.act('door.study');
      return { before, after: !!T.G().state.open['door.study'], label };
    });
    log('F03 selected key does not block opening an unlocked door', r.f03.after !== r.f03.before && !/Gebruik/.test(r.f03.label ?? ''), JSON.stringify(r.f03));
    // F04 — a completed button-lock entry must not act after the panel was replaced by another modal.
    await startEstate(page, { player: { estate: { x: 90, y: 0.15, z: 86, yaw: 0, pitch: 0 } } });
    await E(page, () => T.G().openPanel('studyLock'));
    for (const k of ['put', 'schuur', 'vuur']) await page.click(`[data-k="${k}"]`);
    await page.click('#b-bag', { force: true }).catch(() => {});
    await E(page, () => T.G().openBag());
    await page.waitForTimeout(500);
    r.f04 = await E(page, () => ({ wrong: T.G().state.wrong.studyLock ?? 0, modal: document.querySelector('.modal h2')?.textContent }));
    log('F04 no stale delayed submission closes a newer modal', r.f04.modal === 'Tas', JSON.stringify(r.f04));
    // B1 — door closing never sweeps through the player; a closing door waits while the player stands in its path
    await startEstate(page, { open: { 'door.library': true }, player: { estate: { x: 85.6, y: 0.15, z: 101.0, yaw: -Math.PI / 2, pitch: 0 } } });
    r.sweep = await E(page, () => {
      T.act('door.library', 'Sluiten');
      const refused = T.G().state.open['door.library'] === true;
      return { refused };
    });
    log('B1 closing a door with the player in its swing path is refused', r.sweep.refused);
    // B2 — the table seal behind the closed glass is visible but not takeable
    await startEstate(page, { player: { estate: { x: 117.6, y: 0.15, z: 96.4, yaw: -Math.PI / 2, pitch: 0 } } });
    r.glass = await E(page, () => {
      T.lookAtId('pk.tableSeal');
      const closed = T.G().metrics().target;
      return { closed };
    });
    log('B2 no taking through closed glass/cabinet', r.glass.closed !== 'pk.tableSeal', JSON.stringify(r.glass));
    // F10 — reduced motion holds every flame steady (shader flutter off) but keeps it visible
    await startEstate(page, { lit: { 'fire.living': true }, player: { estate: { x: 77, y: 0.15, z: 89.2, yaw: -Math.PI / 2, pitch: 0 } } });
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
    await startEstate(page, { inventory: [...ESSENTIALS, 'ghostItem'], slots: { 'svc.tafel': 'nope', left: 'token' } });
    r.ids = await E(page, () => { T.G().openBag(); const n = document.querySelectorAll('.inv button').length; T.closeModal(); return { inv: T.G().state.inventory, n, slots: T.G().state.slots }; });
    log('F12 unknown saved ids are dropped; inventory UI works', !r.ids.inv.includes('ghostItem') && r.ids.n === ESSENTIALS.length && r.ids.slots['svc.tafel'] === null && !('left' in r.ids.slots), JSON.stringify(r.ids));
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
    await startEstate(page, { player: { estate: { x: 89, y: 0.15, z: 88.5, yaw: -Math.PI / 2, pitch: 0 } } });
    const l1 = await E(page, () => {
      T.tick(20);
      const g = T.G(); const fire = []; g.world.scene.traverse((o) => { if (o.userData.fire) fire.push(o); });
      const hearth = fire.find((f) => Math.abs(f.position.x - 72.72) < 0.3 && Math.abs(-f.position.z - 86.7) < 0.3);
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
      g.autopilot = { x: 80.5, z: 88.5, run: false };
      for (let i = 0; i < 120; i++) {
        g.tick(1 / 30);
        const cur = g.pool.lights.map((l) => l.intensity);
        cur.forEach((v, j) => { maxJump = Math.max(maxJump, Math.abs(v - prev[j])); });
        prev = cur;
        const a = g.pool.assigned().join(','); if (a !== prevA) { slotChanges++; prevA = a; }
        const fire = []; g.world.scene.traverse((o) => { if (o.userData.fire && Math.abs(-o.position.z - 86.7) < 0.3 && o.position.x < 73) fire.push(o); });
        if (!fire[0]?.visible) hidden++;
      }
      g.autopilot = null;
      return { room: g.pool.here, maxJump: +maxJump.toFixed(2), slotChanges, hiddenFrames: hidden };
    });
    log('L3 crossing the threshold changes nothing abruptly (smooth light, flame always visible)', l3.room === 'living' && l3.maxJump < 2.5 && l3.slotChanges <= 3 && l3.hiddenFrames === 0, JSON.stringify(l3));
    // L4 — a closed door blocks the other room's light; opening it lets it through
    await startEstate(page, { lit: { 'lamp.billiard': true }, player: { estate: { x: 88.5, y: 0.15, z: 101.5, yaw: Math.PI, pitch: 0 } } });
    const l4 = await E(page, () => {
      const g = T.G(); T.tick(15);
      const closed = g.pool.assigned().includes('lamp.billiard');
      g.state.open['door.billiard'] = true; g.changed(); T.tick(30);
      const open = g.pool.assigned().includes('lamp.billiard');
      return { room: g.pool.here, closed, open };
    });
    log('L4 closed door blocks the neighbouring room light; open door lets it through', l4.room === 'lobby' && !l4.closed && l4.open, JSON.stringify(l4));
    // L5 — the lamp's emissive fixture is independent of the pool: still lit when it holds no real light
    const l5 = await E(page, () => {
      const g = T.G(); g.state.open['door.billiard'] = false; g.changed(); T.tick(30);
      const it = g.world.byId.get('lamp.billiard');
      let glow = null; it.obj.traverse((o) => { if (o.isMesh && !o.userData.hit && o.material?.type === 'MeshBasicMaterial') glow = o.material.color.getHexString(); });
      return { assigned: g.pool.assigned().includes('lamp.billiard'), lit: g.state.lit['lamp.billiard'], glow };
    });
    log('L5 fixture glow follows logical state, not light-slot ownership', !l5.assigned && l5.lit && l5.glow === 'ffd27a', JSON.stringify(l5));
    // L6 — candles: decorative dining candles show real flames from the start; reload keeps a doused hearth doused
    await startEstate(page, { lit: { 'fire.living': false }, player: { estate: { x: 98, y: 0.15, z: 90.6, yaw: 2.4, pitch: -0.2 } } });
    const l6 = await E(page, () => {
      const g = T.G(); T.tick(5); const fires = []; g.world.scene.traverse((o) => { if (o.userData.fire) fires.push(o); });
      const dining = fires.find((f) => Math.abs(f.position.x - 101.3) < 0.1 && Math.abs(-f.position.z - 85.2) < 0.1);
      const living = fires.find((f) => Math.abs(-f.position.z - 86.7) < 0.3 && f.position.x < 73);
      return { diningCandles: !!dining?.visible, livingAfterReload: !!living?.visible };
    });
    log('L6 decorative candles burn; a doused fireplace stays doused after reload', l6.diningCandles && !l6.livingAfterReload, JSON.stringify(l6));
  } catch (e) {
    log('lighting checks', false, e.message.split('\n')[0]);
  }
  if (page.problems.length) log('lighting: no console errors', false, page.problems.slice(0, 3).join(' | '));
  await ctx.close();
}


// ------------------------------------------------------------------------------------------------
// Art-refresh interior sample (?art=sample&light=sample, and ?review=living). The sample must keep the room's
// gameplay contract: identical collision, identical interaction targets from the same poses, the mantel → drawer
// progression, persistent fire/lamp state, reduced motion, visibility from the hall, and save isolation in review.
async function artSample() {
  const { ctx, page } = await newPage();
  const SAMPLE = 'art=sample&light=sample';
  const start = async (q, extra = {}) => {
    await page.goto(BASE + '?autotest=1' + (q ? '&' + q : ''));
    await page.evaluate((save) => localStorage.setItem('fehluwe.save', JSON.stringify(save)), {
      version: 4, scene: 'estate', inventory: ESSENTIALS, flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true }, ...extra,
    });
    await page.reload();
    await page.click('[data-cont]');
    await page.waitForFunction(() => window.__game?.world?.id === 'estate');
    await page.evaluate(helpers);
  };
  // the colliders and interaction targets of the living room, as plain data
  const roomContract = () => {
    const g = T.G(), w = g.world;
    const inRoom = (x, z) => x > 72 && x < 85.2 && z > 80 && z < 94.3;
    const r = (v) => Math.round(v * 100) / 100;
    const cols = w.col.colliders.filter((c) => c.kind === 'circle' ? inRoom(c.x, c.z) : inRoom((c.minX + c.maxX) / 2, (c.minZ + c.maxZ) / 2))
      .map((c) => c.kind === 'circle' ? `c ${r(c.x)} ${r(c.z)} ${r(c.r)} ${r(c.minY)} ${r(c.maxY)}` : `b ${r(c.minX)} ${r(c.maxX)} ${r(c.minZ)} ${r(c.maxZ)} ${r(c.minY)} ${r(c.maxY)} ${c.occludes ? 'o' : ''}`).sort();
    const items = w.items.filter((it) => { const p = it.focus ?? it.obj.getWorldPosition(new it.obj.position.constructor()); return inRoom(p.x, -p.z); }).map((it) => it.id).sort();
    const lamps = w.lamps.filter((l) => inRoom(l.pos.x, -l.pos.z)).map((l) => `${l.id} ${r(l.pos.x)} ${r(l.pos.y)} ${r(-l.pos.z)} ${l.intensity} ${l.distance}`).sort();
    return { cols, items, lamps };
  };
  // what the reticle targets from fixed poses (the same physical aiming as a player)
  const aims = [[[75.4, 86.7], [72.9, 1.55, 86.7]], [[75.2, 86.0], [72.75, 0.5, 86.7]], [[82.6, 85.0], [84.2, 1.2, 83.6]], [[82.6, 91.2], [83.9, 0.7, 92.4]], [[77.2, 86.7], [72.9, 1.45, 85.0]]];
  const aimAll = (list) => list.map(([[x, z], [tx, ty, tz]]) => { const g = T.G(); g.player.x = x; g.player.z = z; g.player.y = 0.15; T.lookAt(tx, ty, tz); return g.metrics().target; });
  try {
    await start('');
    const base = await E(page, roomContract);
    const baseAims = await E(page, aimAll, aims);
    await start(SAMPLE);
    const smp = await E(page, roomContract);
    const smpAims = await E(page, aimAll, aims);
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    log('art sample: living-room collision identical to the original room', same(base.cols, smp.cols), `${smp.cols.length} colliders${same(base.cols, smp.cols) ? '' : ' DIFF ' + JSON.stringify({ base: base.cols.filter((c) => !smp.cols.includes(c)), sample: smp.cols.filter((c) => !base.cols.includes(c)) })}`);
    log('art sample: same interactables and light sources (ids, positions, intensities)', same(base.items, smp.items) && same(base.lamps, smp.lamps), same(base.items, smp.items) && same(base.lamps, smp.lamps) ? `${smp.items.length} interactables, ${smp.lamps.length} lights` : JSON.stringify({ items: [base.items.filter((i) => !smp.items.includes(i)), smp.items.filter((i) => !base.items.includes(i))], lamps: [base.lamps.filter((i) => !smp.lamps.includes(i)), smp.lamps.filter((i) => !base.lamps.includes(i))] }));
    log('art sample: reticle targets the same objects from the same poses', same(baseAims, smpAims) && smpAims.slice(0, 4).every(Boolean), JSON.stringify({ base: baseAims, sample: smpAims })); // the last pose aims at bare wall in both
    // mantel evidence → hall drawer with the canonical answer, through real movement and the dial panel
    await start(SAMPLE, { player: { estate: { x: 86.5, y: 0.15, z: 88.5, yaw: -Math.PI / 2, pitch: 0 } } });
    const prog = await E(page, () => {
      T.walk([[83, 89.2], [77.5, 89.2], [75.2, 88.6], [74.6, 86.7]]);
      T.act('inspect.mantel'); const clue = T.G().state.clues.includes('c.mantel'); T.closeModal();
      T.walk([[75.2, 88.6], [77.5, 89.2], [83, 89.2], [86.5, 88.5], [86.5, 85.5]]);
      T.act('hall.drawer', 'Slot bekijken');
      const down = (i, n) => { for (let k = 0; k < n; k++) document.querySelector(`[data-down="${i}"]`).click(); };
      down(0, 1); down(1, 3); down(2, 5); document.querySelector('[data-try]').click(); T.wait(1.2);
      return { clue, solved: !!T.G().state.flags.drawerLockSolved };
    });
    log('art sample: mantel clue readable via the inspect target, drawer opens with Veer–Dennenappel–Kopje', prog.clue && prog.solved, JSON.stringify(prog));
    // mantel objects: three identical brass stands under feather, pinecone, cup (geometry present at the slots)
    // fire + floor lamp: toggle with the real action, state survives reload, visuals follow the state
    await start(SAMPLE, { player: { estate: { x: 75.4, y: 0.15, z: 86.0, yaw: -Math.PI / 2, pitch: 0 } } });
    const t1 = await E(page, () => {
      T.act('fire.living', 'Vuur doven'); const firstOff = T.G().state.lit['fire.living'] === false;
      T.G().player.x = 82.6; T.G().player.z = 85.0; T.act('lamp.livingFloor', 'Uitdoen');
      T.G().saveNow(); return { firstOff, lamp: T.G().state.lit['lamp.livingFloor'] };
    });
    await page.reload(); await page.click('[data-cont]'); await page.waitForFunction(() => window.__game?.world?.id === 'estate'); await page.evaluate(helpers);
    const t2 = await E(page, () => {
      const g = T.G(); T.tick(5);
      const fires = []; g.world.scene.traverse((o) => { if (o.userData.fire) fires.push(o); });
      const hearth = fires.find((f) => Math.abs(-f.position.z - 86.7) < 0.3 && f.position.x < 73);
      const lamp = g.world.byId.get('lamp.livingFloor');
      let shadeEm = null; lamp.obj.traverse((o) => { if (o.isMesh && o.material?.emissive) shadeEm = o.material.emissive.getHexString(); });
      const before = { fire: !!hearth?.visible, shadeEm };
      g.select('matches'); T.lookAtId('fire.living'); g.doAction(); T.tick(3); g.select(null);
      g.player.x = 82.6; g.player.z = 85.0; T.act('lamp.livingFloor', 'Aandoen'); T.tick(3);
      let shadeOn = null; lamp.obj.traverse((o) => { if (o.isMesh && o.material?.emissive) shadeOn = o.material.emissive.getHexString(); });
      return { before, fireLitAgain: !!g.state.lit['fire.living'] && hearth.visible, shadeOn };
    });
    log('art sample: doused fire and switched-off lamp persist through reload; relighting restores flame and shade glow', t1.firstOff && t1.lamp === false && !t2.before.fire && t2.before.shadeEm === '000000' && t2.fireLitAgain && t2.shadeOn !== '000000', JSON.stringify({ t1, t2 }));
    // reduced motion keeps the hearth flame (and its embers) visible
    await start(SAMPLE, { player: { estate: { x: 76, y: 0.15, z: 86.7, yaw: -Math.PI / 2, pitch: 0 } } });
    const rm = await E(page, () => { const g = T.G(); g.settings.reducedMotion = true; g.applyQuality(); T.tick(5); const f = []; g.world.scene.traverse((o) => { if (o.userData.fire && o.position.x < 73 && Math.abs(-o.position.z - 86.7) < 0.3) f.push(o); }); return { visible: !!f[0]?.visible, embers: f[0]?.children.length }; });
    log('art sample: reduced motion holds the hearth flame and embers visible', rm.visible && rm.embers >= 3, JSON.stringify(rm));
    // seen from the hall through the open arch (as L1): real light assigned and flame not culled
    await start(SAMPLE, { player: { estate: { x: 89, y: 0.15, z: 88.5, yaw: -Math.PI / 2, pitch: 0 } } });
    const vis = await E(page, () => {
      T.tick(20); const g = T.G(); const fire = []; g.world.scene.traverse((o) => { if (o.userData.fire && o.position.x < 73 && Math.abs(-o.position.z - 86.7) < 0.3) fire.push(o); });
      const liv = g.world.lamps.filter((l) => g.extras.rooms.roomAt(l.pos.x, l.pos.y, -l.pos.z) === 'living').map((l) => l.id);
      let roomMeshes = 0; g.world.scene.traverse((o) => { if (o.userData.chunk === 'mHall' && o.visible) roomMeshes++; });
      return { room: g.pool.here, livingLit: g.pool.assigned().some((a) => liv.includes(a)), flame: !!fire[0]?.visible && !g.world.isCulled(fire[0]), roomMeshes };
    });
    log('art sample: from the hall the sample room is drawn, lit, and its flame visible', vis.room === 'hall' && vis.livingLit && vis.flame && vis.roomMeshes > 0, JSON.stringify(vis));
    // collision around the new props: walking into the sofa, armchair and hearth is blocked exactly as before
    const walkBlock = await E(page, () => {
      const g = T.G(); const out = {};
      for (const [name, from, to] of [['sofa', [80.4, 86.7], [78.6, 86.7]], ['armchair', [78.2, 81.9], [76.4, 83.0]], ['hearth', [75.4, 86.7], [72.6, 86.7]], ['table', [77.3, 84.4], [77.3, 86.7]]]) {
        g.player.x = from[0]; g.player.z = from[1]; g.player.y = 0.15; T.tick(2);
        try { T.walkTo(to[0], to[1], false, 4); out[name] = 'reached'; } catch { out[name] = { x: +g.player.x.toFixed(2), z: +g.player.z.toFixed(2) }; }
      }
      return out;
    });
    log('art sample: sofa, armchair, hearth and table block movement', Object.values(walkBlock).every((v) => v !== 'reached'), JSON.stringify(walkBlock));
    if (page.problems.length) log('art sample: no console errors', false, page.problems.slice(0, 3).join(' | '));
    else log('art sample: no console errors', true);
  } catch (e) {
    log('art sample checks', false, e.message.split('\n')[0]);
  }
  await ctx.close();
  // review mode: phone context, sandboxed state (the player's save is never read or written)
  const { ctx: c2, page: p2 } = await newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  try {
    await p2.goto(BASE);
    const mine = JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'shedKey'], flags: { leftHome: true }, player: { home: null, estate: { x: 90, y: 0, z: 3, yaw: 0, pitch: 0 } } });
    await p2.evaluate((m) => { localStorage.clear(); localStorage.setItem('fehluwe.save', m); localStorage.setItem('fehluwe.save.prev', '{"version":3}'); localStorage.setItem('fehluwe.settings', '{"quality":"low"}'); }, mine);
    const before = await p2.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
    await p2.goto(BASE + '?review=living&autotest=1');
    await p2.tap('[data-review-start]');
    await p2.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 60000 });
    const r1 = await p2.evaluate(() => ({ room: window.__game.world.hereRoom, inv: window.__game.state.inventory.length, bar: !!document.getElementById('review-bar') }));
    await p2.tap('#review-bar button'); await p2.tap('#review-bar [data-k="art"]');
    await p2.waitForFunction(() => !document.getElementById('review-bar').classList.contains('busy'), null, { timeout: 60000 });
    await p2.tap('#review-bar [data-k="tm"]'); await p2.tap('#review-bar [data-k="light"]');
    const r2 = await p2.evaluate(() => { window.__game.saveNow(); return { pose: window.__game.player.pose(), tm: window.__game.renderer.toneMapping }; });
    const after = await p2.evaluate(() => JSON.stringify(Object.entries(localStorage).sort()));
    log('review mode: starts in the living-room doorway with a comparison bar; toggles work', r1.room === 'hall' && r1.inv === 5 && r1.bar && Math.abs(r2.pose.x - 85.6) < 0.01 && r2.tm === 7, JSON.stringify({ r1, r2 }));
    log('review mode: the player\'s own save, backup and settings are untouched (sandboxed state)', before === after, before === after ? '' : after);
    // the ordinary game is unaffected: without parameters there is no review bar and the original room is built
    await p2.goto(BASE + '?autotest=1');
    await p2.waitForSelector('[data-cont]');
    const plain = await p2.evaluate(() => ({ bar: !!document.getElementById('review-bar'), cont: !!document.querySelector('[data-cont]') }));
    log('review mode: normal entry still offers "Verder spelen" for the untouched save, no review bar', !plain.bar && plain.cont, JSON.stringify(plain));
    if (p2.problems.length) log('review mode: no console errors', false, p2.problems.slice(0, 3).join(' | '));
  } catch (e) {
    log('review mode checks', false, e.message.split('\n')[0]);
  }
  await c2.close();
}

const only = process.env.E2E_ONLY?.split(',');
const suites = { regressions, lighting, walkthrough, collisionChecks, saveChecks, touchChecks, webglFailure, metrics, artSample };
for (const [name, fn] of Object.entries(suites)) if (!only || only.includes(name)) await fn();

const failed = results.filter((r) => !r.ok);
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
await browser.close();
process.exit(failed.length ? 1 : 0);
