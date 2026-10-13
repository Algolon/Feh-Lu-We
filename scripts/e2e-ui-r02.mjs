// UI-R02: real browser inputs, bounded evidence captures and observation/state contracts.
// Camera placement and dusk forcing below are evidence fixtures, not a claimed gameplay walkthrough.
// npm run build && npm run e2e:ui-r02 (or node scripts/with-preview.mjs e2e-ui-r02.mjs)
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/ui-r02';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
// The headless-shell GPU compositor repeats some 2D layers in this sandbox. Software
// composition avoids that capture artifact; the actual Three.js scene still uses WebGL/SwiftShader.
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? chromium.executablePath(), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'] });
const results = [], captures = [];
const log = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${JSON.stringify(detail)}` : ''}`); };
const profiles = [
  ['phone', { width: 852, height: 393 }, true],
  ['small', { width: 640, height: 360 }, true],
  ['desktop', { width: 1440, height: 900 }, false],
  ['portrait', { width: 393, height: 852 }, true],
];
async function pose(page, x = 63, z = 11.5, yaw = 0, pitch = .05) {
  await page.evaluate(({ x, z, yaw, pitch }) => {
    const g = T.G(); g.player.x = x; g.player.z = z; g.player.y = g.world.col.ground(x, z);
    g.player.yaw = yaw; g.player.pitch = pitch; T.tick(5);
  }, { x, z, yaw, pitch });
}
async function shot(page, name, note = '') {
  await page.waitForTimeout(200);
  const path = `${OUT}/${name}.jpg`;
  await page.screenshot({ path, type: 'jpeg', quality: 90 });
  captures.push({ name, note, viewport: page.viewportSize(), sha256: createHash('sha256').update(readFileSync(path)).digest('hex'), ...(await page.evaluate(() => ({ pose: T.G().player.pose(), dusk: T.G().dusk, modal: T.G().ui.modalKind, target: T.G().metrics().target, clues: [...T.G().state.clues] }))) });
}
async function layout(page, modal = false) {
  return page.evaluate((modal) => {
    const root = document.querySelector(modal ? '#overlay .modal' : '#hud');
    const visible = el => !!el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
    const rect = root.getBoundingClientRect();
    const small = [...root.querySelectorAll('button, summary')].filter(el => visible(el) && !el.disabled).map(el => ({ text: el.textContent.trim(), rect: el.getBoundingClientRect() })).filter(o => o.rect.width < 47.5 || o.rect.height < 47.5).map(o => o.text);
    const overflow = [...root.querySelectorAll(modal ? '.body, .wa-index, .wa-page, #nb, #mapv' : '#objective, #action, #held')].filter(visible).filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.id || el.className);
    const outside = [...root.querySelectorAll(modal ? 'header button, .wa-index button' : '.hud-btn, #objective')].filter(el => visible(el) && !el.hidden).filter(el => { const r = el.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth + 1 || r.top < 0 || r.bottom > innerHeight + 1; }).map(el => el.id || el.textContent.trim());
    return { small, overflow, outside, fits: rect.top >= -1 && rect.left >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1, documentOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
  }, modal);
}
const good = r => !r.small.length && !r.overflow.length && !r.outside.length && r.fits && !r.documentOverflow;

for (const [name, viewport, touch] of profiles.filter(([name]) => !process.env.UI_R02_ONLY || process.env.UI_R02_ONLY.split(',').includes(name))) {
  const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const click = async selector => touch ? page.locator(selector).tap() : page.locator(selector).click();
  const category = async t => {
    if (!await page.locator(`[data-t="${t}"]`).isVisible()) await click('[data-nb-index]');
    await click(`[data-t="${t}"]`);
  };
  const problems = [];
  page.on('pageerror', e => problems.push(e.message));
  page.on('console', m => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`); });
  try {
    await page.goto(BASE + '?review=boslust&autotest=1');
    await click('[data-review-start]');
    await page.waitForFunction(() => window.__game?.world?.id === 'estate');
    await page.evaluate(helpers);
    // The developer comparison toolbar is not gameplay UI and must not pollute evidence.
    await page.evaluate(() => document.querySelector('#review-bar').remove());
    await pose(page);
    await shot(page, `${name}-boslust-exploration`);
    const hud = await layout(page);
    log(`${name}: HUD bounds and hit areas`, good(hud), hud);
    const idle = await page.evaluate(() => ({ disabled: document.querySelector('#action').disabled, hidden: getComputedStyle(document.querySelector('#action')).visibility === 'hidden', objective: document.querySelector('#objective').textContent }));
    log(`${name}: idle action quiet; progression still present`, idle.disabled && idle.hidden && !!idle.objective, idle);
    const chrome = await page.evaluate(() => [...document.querySelectorAll('.hud-btn .wa-icon')].map(el => getComputedStyle(el).color));
    const warm = color => { const rgb = color.match(/[\d.]+/g)?.map(Number); return rgb?.length >= 3 && rgb[0] > rgb[1] && rgb[1] > rgb[2]; };
    log(`${name}: chrome icons use a warm metal color`, chrome.length >= 4 && chrome.every(warm), chrome);
    const goal = await page.evaluate(() => {
      const hint = document.querySelector('#b-hint').getBoundingClientRect(), objective = document.querySelector('#objective-row').getBoundingClientRect(), right = document.querySelector('#topbar-r').getBoundingClientRect();
      return { beside: objective.left >= hint.right && Math.abs(objective.top - hint.top) < 2, clear: objective.right < right.left, marker: !!document.querySelector('#objective-row .wa-icon'), text: document.querySelector('#objective').textContent };
    });
    log(`${name}: marked objective sits beside hint without overlapping right controls`, goal.beside && goal.clear && goal.marker && !!goal.text, goal);
    await click('#held');
    log(`${name}: empty equipped-item button opens original inventory`, await page.locator('.inv').count() === 1);
    await page.keyboard.press('Escape');
    if (touch) {
      const cdp = await context.newCDPSession(page);
      const run = await page.locator('#b-run').boundingBox();
      const left = { x: 70, y: viewport.height - 140, id: 71 }, thumb = { x: run.x + run.width / 2, y: run.y + run.height / 2, id: 72 };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left] });
      left.y -= 30;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [left] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left, thumb] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [thumb] });
      await page.waitForFunction(() => document.querySelector('#b-run').getAttribute('aria-pressed') === 'true');
      const moving = await page.evaluate(() => { T.G().input.sample(); return { run: T.G().input.runAmt, forward: T.G().input.moveY, modal: T.modalOpen() }; });
      log(`${name}: sprint shortcut works while another thumb holds movement`, moving.run === 1 && moving.forward > 0 && !moving.modal, moving);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const released = await page.evaluate(() => { T.G().input.sample(); return { run: T.G().input.runAmt, x: T.G().input.moveX, y: T.G().input.moveY }; });
      log(`${name}: sprint never moves player without movement input`, released.run === 1 && released.x === 0 && released.y === 0, released);
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      log(`${name}: blur clears sprint and its pressed state`, await page.evaluate(() => T.G().input.runAmt === 0 && document.querySelector('#b-run').getAttribute('aria-pressed') === 'false'));
      await click('#b-run');
      await pose(page);
      if (name === 'phone') await shot(page, 'phone-sprint-equipped-controls', 'Real run shortcut enabled; no movement input. Opening a modal resets the toggle.');
    }
    await click('#b-notes');
    if (name === 'portrait') {
      await shot(page, 'portrait-notebook-categories');
      log('portrait: notebook opens category index before reading', await page.evaluate(() => !document.querySelector('.wa-index').hidden && document.querySelector('.wa-page').hidden));
      await category('d');
      log('portrait: choosing category opens page and hides index', await page.evaluate(() => document.querySelector('.wa-index').hidden && !document.querySelector('.wa-page').hidden && document.querySelector('[data-nb-index]').getClientRects().length > 0));
      await click('[data-nb-index]');
      log('portrait: category back restores index without closing overlay', await page.evaluate(() => T.G().ui.modalKind === 'notebook' && !document.querySelector('.wa-index').hidden && document.querySelector('.wa-page').hidden));
      await category('d');
    } else if (touch) {
      const side = await page.evaluate(() => { const i = document.querySelector('.wa-index').getBoundingClientRect(), p = document.querySelector('.wa-page').getBoundingClientRect(); return { left: i.right <= p.left + 1, top: Math.abs(i.top - p.top) < 2, contentHeight: p.height }; });
      log(`${name}: mobile categories remain left of the reading page`, side.left && side.top && side.contentHeight > 190, side);
    }
    await shot(page, `${name}-boslust-notebook-threads`);
    const notebook = await layout(page, true);
    log(`${name}: notebook bounds and hit areas`, good(notebook), notebook);
    const book = await page.evaluate(() => {
      const el = document.querySelector('.wa-notebook'), r = el.getBoundingClientRect();
      return { width: r.width, height: r.height, marginX: Math.min(r.left, innerWidth - r.right), marginY: Math.min(r.top, innerHeight - r.bottom), clipped: getComputedStyle(el).overflow === 'hidden', icons: [...el.querySelectorAll('.wa-icon')].map(icon => getComputedStyle(icon).color) };
    });
    log(`${name}: bounded notebook leaves world margins and contains scrolling pages`, book.marginX >= 24 && book.marginY >= 24 && book.width <= viewport.width * .96 && book.height <= viewport.height * .84 && book.clipped && book.icons.length > 4 && book.icons.every(warm), book);
    const paused = await page.evaluate(() => ({ enabled: T.G().input.enabled, overlays: document.querySelectorAll('#overlay [role="dialog"]').length, inert: document.querySelector('#topbar-l').inert }));
    log(`${name}: one focused overlay disables world and background controls`, !paused.enabled && paused.overlays === 1 && paused.inert, paused);
    if (touch) log(`${name}: opening overlay resets sprint`, await page.evaluate(() => T.G().input.runAmt === 0 && document.querySelector('#b-run').getAttribute('aria-pressed') === 'false'));
    const before = await page.evaluate(() => JSON.stringify({ ...T.G().state, stats: undefined, player: undefined }));
    await category('a');
    await shot(page, `${name}-boslust-notebook-evidence`);
    const obs = await page.evaluate(() => ({ recorded: [...T.G().state.clues], rendered: [...new Set([...document.querySelectorAll('#nb [data-clue]')].map(el => el.dataset.clue))], changed: JSON.stringify({ ...T.G().state, stats: undefined, player: undefined }) }));
    log(`${name}: evidence shows recorded clues only; reading changes no progression`, obs.rendered.length > 0 && obs.rendered.every(id => obs.recorded.includes(id)) && obs.changed === before, { recorded: obs.recorded, rendered: obs.rendered });
    const scroll = await page.evaluate(() => {
      const el = document.querySelector('.wa-page'); el.scrollTop = el.scrollHeight;
      return { top: el.scrollTop, overflow: el.scrollHeight > el.clientHeight, last: el.querySelector('.clue:last-child')?.textContent.slice(0, 40) };
    });
    log(`${name}: evidence content has a working independent scroll`, !scroll.overflow || scroll.top > 0, scroll);
    if (name === 'portrait') {
      const back = await page.locator('[data-nb-index]').boundingBox(), close = await page.locator('[data-close]').boundingBox(), readingPage = await page.locator('.wa-page').boundingBox();
      log('portrait: category back stays visible while evidence scrolls', !!back && back.y >= close.y + close.height && back.y >= readingPage.y && back.y + back.height <= readingPage.y + readingPage.height, { back, close, readingPage });
      await page.setViewportSize({ width: 852, height: 393 });
      await page.waitForFunction(() => !document.querySelector('.wa-index').hidden && !document.querySelector('.wa-page').hidden);
      const landscape = await layout(page, true);
      log('portrait: rotation reveals side categories and preserves selected evidence', good(landscape) && await page.evaluate(() => document.querySelector('[data-t="a"]').getAttribute('aria-selected') === 'true'), landscape);
      await shot(page, 'portrait-rotated-evidence', 'Same portrait session rotated to landscape while reading recorded evidence.');
      await page.setViewportSize(viewport);
      await page.waitForFunction(() => document.querySelector('.wa-index').hidden && !document.querySelector('.wa-page').hidden);
      const restored = await page.evaluate(() => ({ heading: document.querySelector('#nb-heading').textContent, backVisible: document.querySelector('[data-nb-index]').getClientRects().length > 0, focusInside: document.querySelector('#overlay').contains(document.activeElement), focus: document.activeElement?.outerHTML.slice(0, 80) }));
      log('portrait: rotation back restores reading pane and reachable back button', restored.heading === 'Aanwijzingen' && restored.backVisible && restored.focusInside, restored);
    }
    await category('b');
    log(`${name}: empty memories expose no undiscovered entries`, await page.locator('#nb .clue').count() === 0 && (await page.locator('#nb').innerText()).includes('Nog geen herinneringen'));
    await category('m');
    const map = await page.evaluate(() => ({ modal: T.G().ui.modalKind, basement: !!document.querySelector('[data-v="b"]'), underground: !!document.querySelector('[data-v="ug"]'), unknown: document.querySelector('#mapv').textContent.includes('?') }));
    await shot(page, `${name}-notebook-map`, 'Existing map route and discovery filters; map content unchanged.');
    log(`${name}: map route keeps undiscovered levels hidden`, map.modal === 'notebook-map' && !map.basement && !map.underground && map.unknown, map);
    const mapLayout = await layout(page, true); log(`${name}: map wraps without overflow`, good(mapLayout), mapLayout);
    await click('[data-back]');
    log(`${name}: map back returns to notebook`, await page.locator('.wa-archive-layout').count() === 1);
    await page.keyboard.press('Escape');
    log(`${name}: Escape resumes input and restores HUD`, await page.evaluate(() => !T.modalOpen() && T.G().input.enabled && !document.querySelector('#topbar-l').inert));

    // An actual nearby world action, followed by the recorded evidence in the notebook.
    await pose(page, 61.4, 16.4);
    await page.evaluate(() => T.lookAt(60.75, 1.6, 17.97));
    const target = await page.evaluate(() => ({ ...T.G().metrics(), action: document.querySelector('#action').textContent.trim(), label: document.querySelector('#action').getAttribute('aria-label') }));
    await shot(page, `${name}-context-action`);
    log(`${name}: explicit contextual action uses real reticle target`, target.target === 'inspect.boslust' && /gravure/.test(target.action) && /Bekijken/.test(target.label), { target: target.target, action: target.action });
    await click('#action');
    log(`${name}: action button opens clue and records observation`, await page.evaluate(() => T.modalOpen() && T.G().state.clues.includes('c.boslust')));
    await click('[data-close]');
    await page.waitForTimeout(400);
    log(`${name}: close does not click through`, await page.evaluate(() => !T.modalOpen()));
    await click('#b-bag');
    await click('[data-id="matches"]');
    const selectButton = page.getByRole('button', { name: 'In de hand nemen' });
    if (touch) await selectButton.tap(); else await selectButton.click();
    const toastShown = await page.evaluate(() => document.querySelector('#toast').classList.contains('show'));
    log(`${name}: selection triggers visible feedback`, toastShown);
    // Extend this already-triggered message only for software-renderer screenshot capture. Normal duration remains 3600 ms.
    await page.evaluate(() => T.G().ui.toast(document.querySelector('#toast').textContent, 12000));
    await shot(page, `${name}-held-feedback`, 'Real inventory selection and its existing toast; capture hold extended to 12 s, normal game 3.6 s; inventory skin unchanged.');
    const held = await page.evaluate(() => ({ selected: T.G().selected, chips: [...document.querySelectorAll('#held')].filter(el => !el.hidden).length, feedback: document.querySelector('#toast').textContent, ariaStatus: document.querySelector('#toast').closest('[inert], [aria-hidden="true"]') === null }));
    log(`${name}: one selected item; real short feedback remains accessible`, held.selected === 'matches' && held.chips === 1 && /Lucifers in de hand/.test(held.feedback) && held.ariaStatus, held);
    const active = await layout(page); log(`${name}: contextual/selected layout fits`, good(active), active);
    await click('#held');
    log(`${name}: selected item deselects through same persistent item button`, await page.evaluate(() => T.G().selected === null && document.querySelector('#held').dataset.equipped === 'false' && !document.querySelector('#held').hidden));

    // Existing scene lighting only, forced phase for a reproducible dark-background contrast fixture.
    await pose(page);
    await page.evaluate(() => { T.G().dusk = .95; T.tick(2); });
    await shot(page, `${name}-boslust-dark`, 'Dusk set to .95 in capture fixture; production lighting code unchanged.');
    await pose(page, 90, 122);
    await page.evaluate(() => { T.G().dusk = 0; T.tick(2); });
    await shot(page, `${name}-garden-bright`, 'Actual production garden at start phase.');

    if (name === 'phone') {
      // Nearby environmental memento is really inspected (pose placement is an evidence fixture).
      await pose(page, 79, 136.4);
      await page.evaluate(() => {
        const p = T.hitCenter('mem.pond.bench'), g = T.G();
        g.player.x = p.x; g.player.z = p.z - 1.4; g.player.y = g.world.col.ground(g.player.x, g.player.z); T.tick(3);
        T.act('mem.pond.bench'); T.closeModal();
      });
      await click('#b-notes'); await click('[data-t="b"]');
      await shot(page, 'phone-notebook-memory', 'The lake-bench memento was recorded via its real inspect action.');
      log('phone: inspected memory remains accessible, without solved badge', await page.evaluate(() => document.querySelector('[data-clue="mem.pond.bench"]') !== null && document.querySelector('#nb .badge') === null));
      await page.keyboard.press('Escape');
      // Safe-area values exercise the same layout tokens consumed on devices; browser emulation has no physical notch.
      await page.evaluate(() => { document.documentElement.style.setProperty('--safe-l', '32px'); document.documentElement.style.setProperty('--safe-r', '24px'); document.documentElement.style.setProperty('--safe-t', '8px'); document.documentElement.style.setProperty('--safe-b', '12px'); });
      await click('#b-notes'); const safe = await layout(page, true); await shot(page, 'phone-safe-area-notebook');
      log('phone: simulated asymmetric safe-area layout', good(safe), safe);
      await page.keyboard.press('Escape');
      await page.evaluate(() => ['--safe-l', '--safe-r', '--safe-t', '--safe-b'].forEach(k => document.documentElement.style.removeProperty(k)));
    }
    if (name === 'desktop') {
      await page.keyboard.press('n');
      await page.locator('[data-t="d"]').focus();
      await page.keyboard.press('ArrowRight');
      log('desktop: notebook keyboard tabs update selection/focus', await page.evaluate(() => document.activeElement.dataset.t === 'a' && document.activeElement.getAttribute('aria-selected') === 'true'));
      await page.keyboard.press('End');
      await page.keyboard.press('Home');
      await page.keyboard.press('Space');
      log('desktop: Home/End/Space remain usable in notebook', await page.evaluate(() => document.activeElement.dataset.t === 'd' && document.activeElement.getAttribute('aria-selected') === 'true'));
      await page.locator('[data-close]').focus(); await page.keyboard.press('Shift+Tab');
      log('desktop: focus wraps inside overlay', await page.evaluate(() => document.querySelector('#overlay').contains(document.activeElement) && document.activeElement !== document.querySelector('[data-close]')));
      await page.keyboard.press('Escape');
      await page.keyboard.press('i'); log('desktop: I opens original inventory', await page.locator('.inv').count() === 1); await page.keyboard.press('Escape');
      await page.keyboard.press('h'); log('desktop: H keeps original hint feature', await page.locator('#overlay [role="dialog"]').count() === 1); await page.keyboard.press('Escape');
      await page.keyboard.press('Escape'); log('desktop: pause still uses its original panel', await page.evaluate(() => T.G().ui.modalKind === 'pause' && !document.querySelector('.wa-notebook'))); await page.keyboard.press('Escape');
    }
    if (name === 'small') {
      await page.goto(BASE + '?autotest=1'); await click('[data-new]');
      await page.waitForFunction(() => window.__game?.world?.id === 'home');
      await page.evaluate(helpers);
      // Exercise the real invitation coaching line after movement/look have been learned.
      // These two flags are a layout fixture, not a claimed input walkthrough.
      await page.evaluate(() => { const g = T.G(); g.state.flags.tLooked = true; g.state.flags.tWalked = true; g.updateHud(); });
      const home = await layout(page);
      const flow = await page.evaluate(() => {
        const a = document.querySelector('#objective').getBoundingClientRect(), b = document.querySelector('#checklist').getBoundingClientRect();
        return { objectiveBottom: a.bottom, checklistTop: b.top, items: document.querySelectorAll('#checklist li').length, notebookAvailable: getComputedStyle(document.querySelector('#b-notes')).display !== 'none' };
      });
      await shot(page, 'small-home-tutorial', 'Real invitation coaching text/checklist; learned-look/movement flags supplied as layout fixture.');
      log('small: home tutorial wraps without overlapping packing checklist; notebook remains discovery-gated', good(home) && flow.checklistTop >= flow.objectiveBottom + 7 && flow.items === 5 && !flow.notebookAvailable, { ...home, ...flow });
    }
    log(`${name}: no browser/asset errors`, problems.length === 0, problems);
  } catch (e) { log(`${name}: suite completion`, false, e.message); }
  await context.close();
}
writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
writeFileSync(`${OUT}/captures.json`, JSON.stringify(captures, null, 2));
await browser.close();
console.log(`${results.filter(r => r.ok).length}/${results.length} UI-R02 checks passed; ${captures.length} actual screenshots.`);
process.exitCode = results.some(r => !r.ok) ? 1 : 0;
