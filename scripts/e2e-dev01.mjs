// DEV-01 slice: browser checks against the production build (npm run build && npm run preview).
// Usage: node scripts/e2e-dev01.mjs [baseUrl]   (E2E_OUT=dir for screenshots/results; DEV01_ONLY=a,b to select)
// Movement goes through the real collision (autopilot = joystick-equivalent), interaction through the reticle and
// the action button, panels through DOM clicks. No teleports, no state edits (except the injected old saves).
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/dev01';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };
const MOBILE = { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true };
const PORTRAIT = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true };

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, ...opts });
  const page = await ctx.newPage();
  page.problems = [];
  page.on('pageerror', (e) => page.problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') page.problems.push(`console: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400) page.problems.push(`HTTP ${r.status()} ${r.url()}`); });
  return { ctx, page };
}
/** Start the review build. mode: 'new' | 'cont' | 'copy'. `seed` sets localStorage before loading (old saves). */
async function startSlice(page, mode = 'new', seed = null, query = '') {
  await page.goto(BASE + '?review=dev01&autotest=1' + query);
  if (seed) { await page.evaluate((s) => { localStorage.clear(); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, seed); await page.reload(); }
  else if (mode === 'new') { await page.evaluate(() => localStorage.clear()); await page.reload(); }
  const sel = { new: '[data-new]', cont: '[data-cont]', copy: '[data-copy]' }[mode];
  await page.waitForSelector(sel);
  await page.click(sel);
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 90000 });
  await page.evaluate(helpers);
  await page.waitForFunction(() => window.__game.world.scene.userData.sliceAtlasReady === true, null, { timeout: 30000 }).catch(() => {});
  return page.evaluate(() => { const g = window.__game; const t = document.querySelector('#overlay h2')?.textContent ?? null; if (g.ui.modalOpen) g.ui.closeModal(); return t; });
}
const shot = async (page, name) => { await page.waitForTimeout(350); await page.screenshot({ path: `${OUT}/${name}.png` }); };
async function step(page, label, fn, arg) {
  try { return await page.evaluate(fn, arg); } catch (e) { await shot(page, 'FAIL-' + label.replace(/\W+/g, '_')); throw new Error(`${label}: ${e.message.split('\n')[0]}`); }
}
/** In-page helpers specific to the slice (installed after T). */
const SLICE_HELPERS = `window.S = {
  R: null,
  route(leg) { return window.__dev01Route[leg]; },
  walkLeg(leg) { return T.walk(window.__dev01Route[leg]); },
  sl() { return T.G().state.slice; },
  world() { const { slice, ...rest } = JSON.parse(JSON.stringify(T.G().state)); delete rest.stats; delete rest.events; delete rest.player; return rest; },
  click(sel) { const el = document.querySelector(sel); if (!el) throw new Error('no ' + sel); el.click(); T.tick(1); },
  text(sel) { return document.querySelector(sel)?.textContent ?? null; },
  modalTitle() { return document.querySelector('#overlay h2')?.textContent ?? null; },
};`;
async function installRoute(page) {
  // the route waypoints come from the same placement records the world is built from
  await page.addScriptTag({ content: SLICE_HELPERS });
}
/** window.__dev01Route is set by the build itself (src/slice/placement.ts ROUTE): the same records the props use. */
async function inject(page) { await installRoute(page); }

// =================================================================================================== 1. route A→B→C
async function mainRoute() {
  const { ctx, page } = await newPage();
  const perf = [];
  const measure = async (name) => { await page.waitForTimeout(500); perf.push({ view: name, ...(await page.evaluate(() => { const g = window.__game; g.renderer.info.reset?.(); g.renderer.render(g.world.scene, g.camera); const i = g.renderer.info.render; return { calls: i.calls, tris: i.triangles, pos: g.player.pose() }; })) }); };
  try {
    await startSlice(page, 'new');
    await inject(page);
    await shot(page, '01-arrival');
    const a0 = await step(page, 'arrival state', () => ({ obs: Object.keys(S.sl().obs), enc: S.sl().encountered, reg: S.sl().registerObserved, objective: S.text('#objective'), plaques: !!T.G().world.byId.get('library.catalog') }));
    log('arrival: only the invitation (read at home) is observed; nothing encountered; no objective walkthrough', JSON.stringify(a0.obs) === '["c.invitation"]' && !a0.enc.length && !a0.reg && !a0.objective && !a0.plaques, JSON.stringify(a0));
    // notebook before the register
    await step(page, 'notebook before register', () => { T.G().openNotebook(); S.click('[data-t="o"]'); });
    const nb0 = await page.evaluate(() => ({ html: document.getElementById('nb').innerText, tabs: [...document.querySelectorAll('#overlay [data-t]')].map((b) => b.textContent) }));
    await shot(page, '02-notebook-before-register');
    log('notebook before register: three entries Waarnemingen · Mijn onderzoek · Archief; no topics, no threads, no next steps', nb0.tabs.length === 3 && !/register|Aan tafel|kantlijn|Buiten de paden|Volg/i.test(nb0.html), JSON.stringify(nb0));
    await step(page, 'close notebook', () => T.closeModal());
    // --- G01/G02 arrival, front door, G03 mantel, G02 console
    await step(page, 'walk to the front door and unlock it', () => { S.walkLeg('arrive'); T.act('door.front', 'Ontgrendelen: deur'); T.wait(1.2); });
    await measure('forecourt-door');
    await step(page, 'walk through hall into the living room: mantel', () => { S.walkLeg('toMantel'); T.act('inspect.mantel'); if (!T.modalOpen()) throw new Error('no overlay'); T.closeModal(); });
    await measure('living-mantel');
    await step(page, 'console: open the dial lock (Encountered)', () => { S.walkLeg('toConsole'); T.act('hall.drawer', 'Slot bekijken: lade'); if (!document.querySelector('.dials')) throw new Error('no dials'); });
    // return-context: draft dials survive a trip to the notebook
    const rc = await step(page, 'drawer: set dials, open notes, come back', async () => {
      const down = (i, n) => { for (let k = 0; k < n; k++) document.querySelector(`[data-down="${i}"]`).click(); };
      down(0, 1); down(1, 3);
      document.querySelector('[data-down="1"]').focus();
      S.click('[data-notes]');
      const inNb = S.modalTitle();
      const back = document.querySelector('[data-return]')?.textContent;
      S.click('[data-return]');
      await new Promise((r) => setTimeout(r, 30));
      return { inNb, back, faces: [...document.querySelectorAll('.dial .face span')].map((x) => x.textContent), focus: document.activeElement?.dataset?.fk };
    });
    log('return-context: dial draft and focus survive notebook → back (parent panel restored)', rc.inNb === 'Notitieboek' && /het slot/.test(rc.back) && rc.faces.join() === 'Veer,Dennenappel,Kaars' && rc.focus === 'down-1', JSON.stringify(rc));
    await step(page, 'enter the mantel order (Veer – Dennenappel – Kopje)', () => { for (let k = 0; k < 5; k++) document.querySelector('[data-down="2"]').click(); S.click('[data-try]'); T.wait(1.2); if (!T.G().state.flags.drawerLockSolved) throw new Error('not solved'); });
    await step(page, 'take the register (pickup only, not read)', () => { T.act('pk.ledger', 'Landgoedregister'); if (T.modalOpen()) throw new Error('register opened on pickup'); });
    const r1 = await step(page, 'owned-not-read', () => { T.G().openNotebook(); S.click('[data-t="o"]'); const t = document.getElementById('nb').innerText; T.closeModal(); return { reg: S.sl().registerObserved, t, results: S.sl().results }; });
    log('register owned but not read: no topics in the notebook (RewardClaimed recorded, RegisterObserved not)', !r1.reg && !/Aan tafel|kantlijn/i.test(r1.t) && r1.results.includes('drawer.register'), JSON.stringify(r1));
    await step(page, 'read the register from the bag', () => { T.G().openBag(); S.click('.inv [data-id="ledger"]'); [...document.querySelectorAll('#inv-actions .btn')].find((b) => b.textContent === 'Lezen').click(); T.tick(1); T.closeModal(); });
    const r2 = await step(page, 'register read', () => { T.G().openNotebook(); S.click('[data-t="o"]'); return { topics: [...document.querySelectorAll('.reg-topic b')].map((b) => b.textContent), actions: document.getElementById('nb').innerText }; });
    await shot(page, '03-notebook-after-register');
    log('register read: exactly the three topics it names, no actions (no "plaats boeken", "ga naar kamer")', r2.topics.join('|') === 'Aan tafel|In de kantlijn|Buiten de paden' && !/ga naar|plaats|leg de|volgende stap/i.test(r2.actions), JSON.stringify(r2.topics));
    const att = await step(page, 'attention switch', () => { const before = JSON.stringify(S.world()); S.click('[data-att="kantlijn"]'); const mid = JSON.stringify(S.world()); S.click('[data-att=""]'); S.click('[data-att="paden"]'); const after = JSON.stringify(S.world()); T.closeModal(); return { same: before === mid && mid === after, att: S.sl().attention, obj: S.text('#objective') }; });
    log('attention switch changes no world state; objective shows only the chosen focus', att.same && att.att === 'paden' && att.obj === 'Mijn aandacht: Buiten de paden', JSON.stringify(att));
    // --- DS01 A (maquette)
    await step(page, 'DS01 A: maquette note', () => { S.walkLeg('toMaquette'); T.act('ds01.note', 'Lezen: notitie'); if (!/Weekendhuizen/.test(document.querySelector('#overlay .body').innerText)) throw new Error('note text'); });
    await shot(page, '04-ds01-A-maquette-note');
    await step(page, 'close', () => T.closeModal());
    await measure('hall-maquette');
    await page.evaluate(() => T.lookAt(85.5, 0.9, 95.9)); await shot(page, '04b-hall-maquette-view');
    // --- G04 library: B01 table
    await step(page, 'to the library', () => { S.walkLeg('toLibrary'); T.act('door.library', 'Openen: deur'); T.wait(1.2); S.walkLeg('intoLibrary'); });
    await step(page, 'B01 table panel', () => { T.act('b01.table', 'Bekijken: mappen en vakken'); if (!document.querySelector('.b01-slots')) throw new Error('no panel'); });
    await measure('library-table');
    await shot(page, '05-b01-library-panel');
    const b1 = await step(page, 'B01: open folio I, select II, place it, notes and back', async () => {
      S.click('[data-view="I"]'); const folio = S.modalTitle(); const recorded = !!S.sl().obs['s.b01.folio.I'];
      S.click('[data-back]');
      S.click('[data-pick="II"]'); S.click('[data-slot="vierkant"]');
      const wrong0 = S.sl().b01.wrong;
      S.click('[data-pick="III"]');
      document.querySelector('#overlay .body').scrollTop = 40;
      S.click('[data-notes]');
      S.click('[data-return]');
      await new Promise((r) => setTimeout(r, 30));
      return { folio, recorded, wrong0, sel: document.querySelector('.folio-card.sel [data-pick]')?.dataset.pick, slots: S.sl().b01.slots, scroll: document.querySelector('#overlay .body').scrollTop };
    });
    log('B01 panel: folio inspect records an observation; incomplete set is no attempt; draft selection survives notebook round-trip', b1.recorded && b1.wrong0 === 0 && b1.sel === 'III' && b1.slots.vierkant === 'II', JSON.stringify(b1));
    await step(page, 'close B01', () => T.closeModal());
    await page.evaluate(() => T.lookAt(80.6, 0.9, 101.2)); await shot(page, '05b-b01-table-world');
    // --- DS01 B (album + letter)
    await step(page, 'DS01 B: album and drying letter', () => { S.walkLeg('toAlbum'); T.act('ds01.album', 'Bekijken: album'); T.closeModal(); T.act('ds01.letter', 'Lezen: briefje'); });
    await shot(page, '06-ds01-B-letter');
    await step(page, 'close', () => T.closeModal());
    await page.evaluate(() => T.lookAt(74.55, 0.75, 106.6)); await shot(page, '06b-ds01-B-album-world');
    await measure('library-album');
    // --- up the grand stair (no teleport)
    const up = await step(page, 'upstairs', () => { S.walkLeg('albumBack'); S.walkLeg('libraryOut'); const p = S.walkLeg('upstairs'); return p; });
    log('grand stair: route reaches the upper floor by walking', Math.abs(up.y - 3.35) < 0.03, JSON.stringify(up));
    // --- U05 sterren
    await step(page, 'U05: open the door, read the pair and the clip', () => { S.walkLeg('toSterren'); T.act('door.sterren', 'Openen: deur'); T.wait(1.2); S.walkLeg('intoSterren'); T.act('b01.pair.sterren', 'Bekijken: voorwerpen'); T.closeModal(); T.act('b01.clip.sterren', 'Bekijken: archiefclip'); });
    await shot(page, '07-U05-clip-overlay');
    await step(page, 'close', () => T.closeModal());
    await page.evaluate(() => T.lookAt(79.0, 4.2, 93.45)); await shot(page, '07b-U05-cluster');
    await measure('U05-sterren');
    // --- U04 reis (B01 travel cluster, then DS01 C on the rack)
    await step(page, 'U04: pair, clip, then the photo (front, turned over)', () => {
      S.walkLeg('sterrenOut'); S.walkLeg('toReis'); T.act('door.reis', 'Openen: deur'); T.wait(1.2); S.walkLeg('intoReis');
      T.act('b01.pair.reizen', 'Bekijken: voorwerpen'); T.closeModal(); T.act('b01.clip.reizen', 'Bekijken: archiefclip'); T.closeModal();
    });
    await page.evaluate(() => T.lookAt(78.6, 4.2, 86.4)); await shot(page, '08-U04-cluster');
    await measure('U04-desk');
    const ph = await step(page, 'DS01 C: photo front then back', () => {
      S.walkLeg('toRack'); T.act('ds01.photo', 'Bekijken: foto');
      const front = { found: S.sl().ds01.photoFound, back: S.sl().ds01.photoBackSeen, faces: S.sl().obs['s.ds01.photo'].faces.join() };
      return front;
    });
    await shot(page, '09-ds01-C-photo-front');
    const ph2 = await step(page, 'turn over', () => { S.click('[data-flip]'); return { back: S.sl().ds01.photoBackSeen, faces: S.sl().obs['s.ds01.photo'].faces.join(), inv: T.G().state.inventory.includes('photo') }; });
    await shot(page, '09b-ds01-C-photo-back');
    log('DS01 C: front sets photoFound (back not yet); back recorded only after turning; photo never enters the bag', ph.found && !ph.back && ph.faces === 'front' && ph2.back && ph2.faces === 'front,back' && !ph2.inv, JSON.stringify({ ph, ph2 }));
    await step(page, 'close', () => T.closeModal());
    await page.evaluate(() => T.lookAt(82.2, 4.0, 81.2)); await shot(page, '09c-U04-rack-world');
    await measure('U04-rack');
    // --- U10 botanic
    await step(page, 'U10: door, pair, clip', () => { S.walkLeg('reisOut'); S.walkLeg('toBotanic'); T.act('door.botanic', 'Openen: deur'); T.wait(1.2); S.walkLeg('intoBotanic'); T.act('b01.pair.planten', 'Bekijken: voorwerpen'); T.closeModal(); T.act('b01.clip.planten', 'Bekijken: archiefclip'); T.closeModal(); });
    await page.evaluate(() => T.lookAt(101.75, 4.2, 84.0)); await shot(page, '10-U10-cluster');
    await measure('U10-botanic');
    // --- back to the library, solve B01
    const down = await step(page, 'downstairs and back to the table', () => { S.walkLeg('botanicOut'); const p = S.walkLeg('downstairs'); S.walkLeg('backToTable'); return p; });
    log('grand stair: back down by walking', Math.abs(down.y - 0.15) < 0.03, JSON.stringify(down));
    const sv = await step(page, 'B01: a wrong full set, then the right one', () => {
      T.act('b01.table');
      // current: vierkant=II. wrong: punt=I, rond=III
      S.click('[data-pick="I"]'); S.click('[data-slot="punt"]'); S.click('[data-pick="III"]'); S.click('[data-slot="rond"]');
      const wrongMsg = S.text('.feedback'), wrong = S.sl().b01.wrong, open1 = !!T.G().state.open['library.desk'];
      S.click('[data-take="punt"]'); S.click('[data-take="rond"]');
      S.click('[data-pick="III"]'); S.click('[data-slot="punt"]'); S.click('[data-pick="I"]'); S.click('[data-slot="rond"]');
      T.wait(1.2);
      return { wrongMsg, wrong, open1, solved: S.sl().b01.solved, open2: !!T.G().state.open['library.desk'], modal: T.modalOpen(), rewardBefore: S.sl().results.includes('b01.studyKey') };
    });
    log('B01: complete wrong set → neutral local feedback (one attempt); correct set opens the drawer; solved ≠ reward claimed', sv.wrong === 1 && /lade blijft dicht/.test(sv.wrongMsg) && !sv.open1 && sv.solved && sv.open2 && !sv.rewardBefore, JSON.stringify(sv));
    await page.evaluate(() => { T.lookAt(81.0, 0.7, 101.2); }); await shot(page, '11-b01-drawer-open');
    const kc = await step(page, 'claim the key', () => { T.act('pk.studyKey', 'Pakken: messing sleutel'); return { inv: T.G().state.inventory.includes('studyKey'), res: S.sl().results }; });
    log('B01 reward: the studiesleutel is claimed only by taking it', kc.inv && kc.res.includes('b01.studyKey'), JSON.stringify(kc.res));
    // --- hints after solving: B01 gone, drawer gone
    const hn = await step(page, 'hint menu', () => { T.G().openHint(); const t = document.querySelector('#overlay .body').innerText; T.closeModal(); return t; });
    log('hints: solved riddles leave the hint menu', !/leestafel|lade in de hal/i.test(hn), hn.slice(0, 120));
    // --- notebook: provenance, results, archive memory
    const nbf = await step(page, 'final notebook', () => { T.G().openNotebook(); S.click('[data-t="w"]'); const w = document.getElementById('nb').innerText; S.click('[data-t="o"]'); const o = document.getElementById('nb').innerText; S.click('[data-t="a"]'); const a = document.getElementById('nb').innerText; return { w, o, a }; });
    await shot(page, '12-notebook-archive');
    log('notebook: observations carry provenance; results and memories are typed separately; no solution summary', /waarneming \d+/.test(nbf.w) && /Resultaat/i.test(nbf.o) && /Herinnering/i.test(nbf.a) && /huisje aan het water/.test(nbf.a) && !/→/.test(nbf.w), '');
    await step(page, 'close', () => T.closeModal());
    // --- save + reload (continue)
    const before = await page.evaluate(() => { T.G().saveNow(); return { s: JSON.stringify(T.G().state.slice), main: localStorage.getItem('fehluwe.save'), keys: Object.keys(localStorage).sort() }; });
    await page.reload();
    await page.waitForSelector('[data-cont]'); await page.click('[data-cont]');
    await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 90000 });
    await page.evaluate(helpers); await inject(page);
    const after = await page.evaluate(() => ({ s: JSON.stringify(window.__game.state.slice), open: window.__game.state.open['library.desk'], pose: window.__game.player.pose() }));
    log('save/reload: mechanical and observation state restored exactly; only the dev01 keys were written', before.s === after.s && after.open && before.main === null && before.keys.every((k) => k.startsWith('fehluwe.dev01.')), JSON.stringify({ keys: before.keys, pose: after.pose }));
    if (page.problems.length) log('main route: no console errors', false, page.problems.slice(0, 3).join(' | ')); else log('main route: no console errors or failed requests', true);
  } catch (e) {
    log('main route', false, e.message);
  }
  writeFileSync(`${OUT}/perf.json`, JSON.stringify(perf, null, 2));
  await ctx.close();
  return perf;
}

// =================================================================================================== 2. DS01 C first
async function cFirst() {
  const { ctx, page } = await newPage();
  try {
    await startSlice(page, 'new');
    await inject(page);
    const r = await step(page, 'straight upstairs to U04, photo first', () => {
      S.walkLeg('arrive'); T.act('door.front'); T.wait(1.2);
      T.walk([[90, 82], [90, 86], [90, 92], [94.0, 85.6], [94.0, 96.3]]);
      S.walkLeg('toSterren'); S.walkLeg('toReis'); T.act('door.reis'); T.wait(1.2); S.walkLeg('intoReis'); S.walkLeg('toRack');
      T.act('ds01.photo', 'Bekijken: foto'); T.closeModal();
      const c = { found: S.sl().ds01.photoFound, q: S.sl().questions.length, results: [...S.sl().results] };
      T.act('ds01.photo'); T.closeModal(); // look again: no second reward
      return { c, mem: S.sl().results.filter((x) => x === 'ds01.memory').length, reg: S.sl().registerObserved };
    });
    log('DS01 C-first: works before A/B and before the register; memory granted once; no question or quest created', r.c.found && r.c.q === 0 && r.mem === 1 && !r.reg, JSON.stringify(r));
    const ab = await step(page, 'then A and B still read normally', () => {
      S.walkLeg('reisOut'); T.walk([[85.95, 90.2], [85.95, 96.6], [94.0, 96.3], [94.0, 85.6], [90, 85.5], [90, 92]]);
      S.walkLeg('toMaquette'); T.act('ds01.note'); const a = document.querySelector('#overlay .body').innerText; T.closeModal();
      return { a: /Weekendhuizen/.test(a), mem: S.sl().results.filter((x) => x === 'ds01.memory').length };
    });
    log('DS01: A stays meaningful after C (ordinary note, no change in reward)', ab.a && ab.mem === 1, JSON.stringify(ab));
    // own question with a pinned source (voluntary)
    const q = await step(page, 'own question', () => {
      T.G().openNotebook(); S.click('[data-t="w"]');
      S.click('[data-pin="s.ds01.photo"]');
      S.click('[data-t="o"]');
      const ta = document.querySelector('[data-qtext]'); ta.value = 'Waarom hangt de foto boven?'; ta.dispatchEvent(new Event('input'));
      document.querySelector('[data-qpin="s.ds01.photo"]').click();
      S.click('[data-qsave]');
      const own = document.querySelector('.own')?.innerText ?? '';
      S.click('[data-qarch]');
      const solvedAfter = S.sl().b01.solved;
      T.closeModal();
      return { own, n: S.sl().questions.length, archived: S.sl().questions[0]?.archived, solvedAfter };
    });
    log('notebook: player-made question with a pinned photo; archiving it solves nothing', /Waarom hangt/.test(q.own) && q.n === 1 && q.archived && !q.solvedAfter, JSON.stringify(q));
    if (page.problems.length) log('C-first: no console errors', false, page.problems.slice(0, 3).join(' | '));
  } catch (e) { log('DS01 C-first', false, e.message); }
  await ctx.close();
}

// =================================================================================================== 3. old saves
async function oldSaves() {
  const { ctx, page } = await newPage();
  try {
    const main = JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'ledger', 'shedKey', 'studyKey'], used: [], taken: ['pk.ledger', 'pk.shedKey', 'pk.studyKey'], open: { 'door.front': true, 'hall.drawer': true, 'library.desk': true }, unlocked: ['lock.door.front', 'lock.hallDrawer', 'lock.libraryDesk'], flags: { leftHome: true, drawerLockSolved: true, catalogSolved: true }, clues: ['c.invitation', 'c.mantel', 'c.ledger', 'c.libraryPlan', 'c.catalogDesk'], slots: { 'cat.punt': 'varen', 'cat.rond': 'ster', 'cat.vierkant': 'koffer' }, track: 'B', player: { home: null, estate: { x: 82.4, y: 0.15, z: 97.5, yaw: 0, pitch: 0 } } });
    const notice = await startSlice(page, 'copy', { 'fehluwe.save': main, 'fehluwe.settings': '{"quality":"low"}' });
    await inject(page);
    const r = await step(page, 'imported', (notice) => {
      const g = T.G();
      // walk upstairs and unlock the study with the imported key: study access kept, no replay
      T.walk([[83.0, 98.4], [84.0, 101.0]]); T.act('door.library', 'Openen: deur'); T.wait(1.2);
      T.walk([[86.4, 101.0], [88.5, 99.5], [90, 92], [94.0, 85.6], [94.0, 96.3], [93.0, 97.3], [96.5, 97.3], [98.2, 97.3]]);
      T.act('door.study', 'Ontgrendelen: deur'); T.wait(1.2);
      g.saveNow();
      return { notice, b01: g.state.slice.b01, open: g.state.unlocked.includes('lock.door.study'), main: localStorage.getItem('fehluwe.save') };
    }, notice);
    log('old save (catalogue solved): imported as B01 alias, study key still opens the study, no replay', r.b01.solved && r.b01.legacy === 'catalogSolved' && r.open && r.notice === 'Testversie (DEV-01)', JSON.stringify({ b01: r.b01, open: r.open, notice: r.notice }));
    log('old save: the player\'s own save is byte-identical after playing the copy', r.main === main);
    if (page.problems.length) log('old saves: no console errors', false, page.problems.slice(0, 3).join(' | '));
  } catch (e) { log('old saves', false, e.message); }
  await ctx.close();
  // the normal game: no slice, untouched catalogue, no slice keys written
  const { ctx: c2, page: p2 } = await newPage();
  try {
    await p2.goto(BASE + '?autotest=1');
    await p2.evaluate(() => { localStorage.clear(); localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'], flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true } })); });
    await p2.reload(); await p2.click('[data-cont]');
    await p2.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 90000 });
    const n = await p2.evaluate(() => { const g = window.__game; g.saveNow(); return { slice: g.slice, ids: [...g.world.byId.keys()].filter((k) => /^b01\.|^ds01\./.test(k)), cat: !!g.world.byId.get('library.catalog'), plan: !!g.world.byId.get('inspect.libraryPlan'), saved: 'slice' in JSON.parse(localStorage.getItem('fehluwe.save')), keys: Object.keys(localStorage).filter((k) => k.includes('dev01')) }; });
    log('normal game unchanged: no slice objects, the iteration-3 catalogue and plan exist, save has no slice block, no dev01 keys', n.slice === null && !n.ids.length && n.cat && n.plan && !n.saved && !n.keys.length, JSON.stringify(n));
  } catch (e) { log('normal game check', false, e.message); }
  await c2.close();
}

// =================================================================================================== 4. culling / shell / LOS through floors
async function culling() {
  const { ctx, page } = await newPage();
  try {
    await startSlice(page, 'new');
    await inject(page);
    const r = await step(page, 'culling probes', () => {
      const g = T.G(), w = g.world;
      const vis = (chunk) => w.scene.children.filter((o) => o.userData.chunk === chunk).some((o) => o.visible);
      const out = {};
      out.forecourt = { shell: vis('manor'), up: vis('mUp'), lib: vis('mLib') };
      S.walkLeg('arrive'); T.act('door.front'); T.wait(1.2); T.walk([[90, 82], [90, 86]]);
      T.tick(10); out.hall = { shell: vis('manor'), hallChunk: vis('mHall'), up: vis('mUp') };
      // from the hall, upstairs slice evidence must not be pickable through the slab
      T.lookAt(79.0, 4.2, 93.45); out.hallTargetUp = g.metrics().target;
      S.walkLeg('toLibrary'); T.act('door.library'); T.wait(1.2); S.walkLeg('intoLibrary'); T.tick(10);
      out.library = { shell: vis('manor'), lib: vis('mLib'), up: vis('mUp') };
      // from the library, aim at the U05 table (above, behind the slab/wall): not targetable
      T.lookAt(79.0, 4.2, 93.45); out.libTargetUp = g.metrics().target;
      return out;
    });
    log('culling: shell drawn from outside and inside; hall/library chunks shown in their rooms', r.forecourt.shell && r.hall.shell && r.hall.hallChunk && r.library.shell && r.library.lib, JSON.stringify(r));
    const veg = await page.evaluate(() => {
      // every vegetation instance (trees, bushes, plants) against the building footprints (plan metres)
      const FP = { manor: [72, 108, 80, 110], wing: [108, 116, 92, 110], cons: [116, 130, 94, 112], cottage: [32, 42, 128, 136], shed: [39.5, 44.5, 37.2, 40.8], sauna: [132, 136, 100, 104], hut: [60.4, 65.6, 18.2, 20] };
      const g = window.__game, m4 = new (g.camera.matrix.constructor)(), bad = [];
      let n = 0;
      g.world.scene.traverse((o) => {
        if (!o.isInstancedMesh || o.userData.lightPatches) return;
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, m4); const x = m4.elements[12], z = -m4.elements[14]; n++;
          for (const [k, [x0, x1, z0, z1]] of Object.entries(FP)) if (x > x0 + 0.3 && x < x1 - 0.3 && z > z0 + 0.3 && z < z1 - 0.3) bad.push(`${k}@${x.toFixed(1)},${z.toFixed(1)}`);
        }
      });
      return { n, bad: bad.slice(0, 8), count: bad.length };
    });
    log('placement: no vegetation instance inside a building footprint', veg.n > 0 && veg.count === 0, JSON.stringify(veg));
    log('LOS: upstairs evidence cannot be targeted through floors/walls from the ground floor', !/b01\.|ds01\./.test(r.hallTargetUp ?? '') && !/b01\.|ds01\./.test(r.libTargetUp ?? ''), JSON.stringify({ hall: r.hallTargetUp, lib: r.libTargetUp }));
  } catch (e) { log('culling', false, e.message); }
  await ctx.close();
}

// =================================================================================================== 5. mobile: legibility, tap targets, overflow, click-through
async function mobile() {
  for (const [name, opts] of [['landscape', MOBILE], ['portrait', PORTRAIT]]) {
    const { ctx, page } = await newPage(opts);
    try {
      await startSlice(page, 'new');
      await inject(page);
      await step(page, 'walk to the table', () => { S.walkLeg('arrive'); T.act('door.front'); T.wait(1.2); T.walk([[90, 82], [90, 86]]); S.walkLeg('toLibrary'); T.act('door.library'); T.wait(1.2); S.walkLeg('intoLibrary'); T.lookAtId('b01.table'); });
      // open via a real tap on the table in the world (touch path)
      const box = await page.evaluate(() => { const c = T.hitCenter('b01.table'); const g = T.G(); const v = new (g.camera.position.constructor)(c.x, c.y, -c.z).project(g.camera); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; });
      await page.touchscreen.tap(box.x, box.y);
      await page.waitForTimeout(300);
      const opened = await page.evaluate(() => S.modalTitle());
      await shot(page, `20-${name}-b01-panel`);
      const m = await page.evaluate(() => {
        const ov = document.querySelector('#overlay .modal'), body = document.querySelector('#overlay .body');
        const small = [...document.querySelectorAll('#overlay button')].filter((b) => !b.disabled && b.offsetParent).map((b) => b.getBoundingClientRect()).filter((r) => r.width < 44 || r.height < 44).length;
        return { small, hOverflow: body.scrollWidth > body.clientWidth + 1, fits: ov.getBoundingClientRect().bottom <= innerHeight + 1 };
      });
      log(`mobile ${name}: B01 panel opens from a tap, every button ≥ 44 px, no horizontal overflow, panel fits the screen`, opened === 'Leestafel' && m.small === 0 && !m.hOverflow && m.fits, JSON.stringify({ opened, ...m }));
      await page.evaluate(() => S.click('[data-view="I"]'));
      await shot(page, `21-${name}-folio-I`);
      await page.evaluate(() => S.click('[data-zoombtn]'));
      await shot(page, `22-${name}-folio-I-zoomed`);
      // click-through: close with a tap on ✕ while the table is under it; the panel must not re-open
      const close = await page.evaluate(() => { const r = document.querySelector('[data-close]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      await page.touchscreen.tap(close.x, close.y);
      await page.waitForTimeout(500);
      const ct = await page.evaluate(() => ({ open: T.modalOpen() }));
      log(`mobile ${name}: closing an overlay never clicks through to the world`, !ct.open, JSON.stringify(ct));
      if (name === 'landscape') {
        await step(page, 'photo on the phone', () => { S.walkLeg('libraryOut'); S.walkLeg('upstairs'); S.walkLeg('toSterren'); T.act('door.sterren'); T.wait(1.2); S.walkLeg('intoSterren'); T.act('b01.clip.sterren'); });
        await shot(page, '23-landscape-clip-rond');
        await step(page, 'pair', () => { T.closeModal(); T.act('b01.pair.sterren'); });
        await shot(page, '24-landscape-pair-sterren');
        await step(page, 'rack', () => { T.closeModal(); S.walkLeg('sterrenOut'); S.walkLeg('toReis'); T.act('door.reis'); T.wait(1.2); S.walkLeg('intoReis'); S.walkLeg('toRack'); T.act('ds01.photo'); });
        await shot(page, '25-landscape-photo-front');
        await page.evaluate(() => S.click('[data-flip]'));
        await shot(page, '26-landscape-photo-back');
        const nbm = await step(page, 'notebook on the phone', () => { T.closeModal(); T.G().openNotebook(); const b = document.querySelector('#overlay .body'); return { hOverflow: b.scrollWidth > b.clientWidth + 1 }; });
        await shot(page, '27-landscape-notebook');
        log('mobile landscape: notebook has no horizontal overflow', !nbm.hOverflow, JSON.stringify(nbm));
      }
      if (page.problems.length) log(`mobile ${name}: no console errors`, false, page.problems.slice(0, 3).join(' | '));
    } catch (e) { log(`mobile ${name}`, false, e.message); }
    await ctx.close();
  }
}

// =================================================================================================== 6. hints 0–3 in the browser
async function hints() {
  const { ctx, page } = await newPage();
  try {
    await startSlice(page, 'new');
    await inject(page);
    const r = await step(page, 'hints', () => {
      T.G().openHint(); const none = document.querySelector('#overlay .body').innerText; T.closeModal();
      S.walkLeg('arrive'); T.act('door.front'); T.wait(1.2); T.walk([[90, 82], [90, 86]]); S.walkLeg('toLibrary'); T.act('door.library'); T.wait(1.2); S.walkLeg('intoLibrary');
      T.act('b01.table'); T.closeModal();
      T.G().openHint();
      const l0 = document.querySelector('#overlay .body').innerText;
      const lv = [];
      for (let i = 0; i < 3; i++) { S.click('[data-more]'); lv.push([...document.querySelectorAll('.slice-hint .kind')].map((x) => x.textContent).join('|')); }
      const more = !!document.querySelector('[data-more]');
      const obs = Object.keys(S.sl().obs);
      T.closeModal();
      return { none, l0, lv, more, obs };
    });
    await shot(page, '13-hints');
    log('hints: none before a riddle is met; level 0 names the riddle without a next step', /nog geen raadsel/.test(r.none) && /raadsel/i.test(r.l0) && !/Hint 1 ·/i.test(r.l0) && !/rond vak|clip/.test(r.l0), r.l0.slice(0, 160));
    log('hints: levels 1 attention · 2 relation · 3 solution, labelled as Hint, never stored as observations', r.lv[2] === 'Hint 1 · Aandacht|Hint 2 · Verband|Hint 3 · Oplossing' && !r.more && !r.obs.some((o) => /hint/i.test(o)), JSON.stringify(r.lv));
  } catch (e) { log('hints', false, e.message); }
  await ctx.close();
}

const only = process.env.DEV01_ONLY?.split(',');
const suites = { mainRoute, cFirst, oldSaves, culling, mobile, hints };
for (const [name, fn] of Object.entries(suites)) if (!only || only.includes(name)) await fn();
const failed = results.filter((r) => !r.ok);
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} DEV-01 checks passed`);
await browser.close();
process.exit(failed.length ? 1 : 0);
