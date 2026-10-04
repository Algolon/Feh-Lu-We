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
    await step('use matches on candle', () => { T.select('matches'); T.act('home.candle', 'Gebruik: Lucifers'); T.select(null); if (!T.G().state.lit['home.candle']) throw new Error('candle not lit'); });
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
    await step('kindling + matches → fire', () => { T.select('kindling'); T.act('firepit', 'Aanmaakhout'); T.select('matches'); T.act('firepit', 'Lucifers'); T.select(null); if (!T.G().state.lit['fire.clearing']) throw new Error('no fire'); });
    await step('light post lantern, read plate', () => { T.act('lantern.firepost.act', 'Lantaarn'); T.act('plate.fire', 'plaat'); if (!T.modalOpen()) throw new Error('plate not shown'); T.closeModal(); });
    await shot(page, '10-fire');
    // --- beat 5: garden lanterns
    await step('back through the forest to the garden', () => T.walk([[17.2, 15.6], [21, 17.5], [26.5, 23.4], [32.8, 23.0], [32.8, 27.8], [38, 34], [47, 42], [55, 46.5], [53, 50.0], [51.5, 51.35], [46, 51.35], [45.3, 60], [45.3, 84], [52, 92.6], [57.5, 92.6]], true));
    await shot(page, '11-garden');
    await step('wrong lantern order resets only the attempt', () => {
      T.act('garden.lantern.maan', 'maan');
      T.walk([[50, 91.5], [44.4, 90.2]]); T.act('garden.lantern.zon', 'zon');
      if ((T.G().state.seq.gardenLanterns ?? []).length) throw new Error('wrong order kept');
      T.walk([[50, 91.5], [57.5, 92.6]]);
    });
    await step('lanterns Maan → Blad → Zon', () => {
      T.act('garden.lantern.maan', 'maan');
      T.walk([[64, 91.5], [71.2, 90.2]]); T.act('garden.lantern.blad', 'blad');
      T.walk([[58, 89.5], [44.4, 90.2]]); T.act('garden.lantern.zon', 'zon');
      if (!T.G().state.flags.lanternsSolved) throw new Error('lanterns not solved');
    });
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
    await step('cabinet panel Ruit–Golf–Driehoek–Cirkel', () => {
      T.walk([[87, 73.6], [87, 75.2], [85.6, 75.5], [83, 75.5], [82.0, 74], [82.0, 66.2], [78, 65.4], [74.2, 66.4]]);
      T.act('cab.upper', 'Paneel');
      for (const k of ['ruit', 'golf', 'driehoek', 'cirkel']) document.querySelector(`[data-k="${k}"]`).click();
    });
    await page.waitForTimeout(500);
    await step('take crest + read well note', () => { T.wait(1.5); if (!T.G().state.flags.cabinetPanelSolved) throw new Error('panel'); T.act('pk.crest', 'Wapenschild'); T.act('inspect.wellNote', 'aanwijzing'); T.closeModal(); });
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
    const st = await E(page, () => ({ clues: T.G().state.clues.length, minutes: T.G().state.stats.playMs / 60000, flags: T.G().state.flags }));
    log('walkthrough tutorial → ending', true, `${steps.length} steps, ${st.clues} clues, simulated play ${st.minutes.toFixed(1)} min`);
    writeFileSync(`${OUT}/walkthrough-steps.txt`, steps.join('\n'));
  } catch (e) {
    log('walkthrough tutorial → ending', false, e.message);
  }
  if (page.problems.length) log('walkthrough: no console errors / 404s', false, page.problems.slice(0, 5).join(' | '));
  else log('walkthrough: no console errors / 404s', true);
  await ctx.close();
}

await walkthrough();

const failed = results.filter((r) => !r.ok);
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
await browser.close();
process.exit(failed.length ? 1 : 0);
