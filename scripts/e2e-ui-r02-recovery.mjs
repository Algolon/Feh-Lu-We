// Bounded combined HUD/ENV review. Real WebGL loop stays active throughout.
// Camera/phase placement is a capture fixture, not a gameplay walkthrough.
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/ui-r02-recovery/normal';
mkdirSync(OUT, { recursive: true });
const results = [], captures = [], errors = [];
const save = () => {
  writeFileSync(`${OUT}/results.json`, JSON.stringify({ results, errors }, null, 2));
  writeFileSync(`${OUT}/captures.json`, JSON.stringify(captures, null, 2));
};
const check = (name, ok, detail) => {
  results.push({ name, ok: !!ok, detail }); save();
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) throw Error(name);
};
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? chromium.executablePath(), timeout: 30000,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'] });
async function shot(page, name, note = '') {
  const path = `${OUT}/${name}.jpg`;
  const state = await page.evaluate(() => {
    const g = window.__game, sky = g.world.scene.children.find(o => o.material?.uniforms?.uCloudOpacity);
    return { running: g.running, frame: g.renderer.info.render.frame, pose: g.player.pose(), dusk: g.dusk,
      phaseInput: window.__capturePhase ?? g.dusk, pilot: sky?.material.uniforms.uPilot.value,
      modal: g.ui.modalKind, selected: g.selected, quality: g.settings.quality, clues: [...g.state.clues] };
  });
  await page.screenshot({ path, type: 'jpeg', quality: 90, timeout: 30000 });
  captures.push({ name, note, viewport: page.viewportSize(), ...state,
    sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }); save();
  console.log(`CAPTURE ${name}`);
}
async function pose(page, x = 63, z = 11.5, phase = 0) {
  await page.evaluate(({ x, z, phase }) => {
    const g = window.__game;
    g.player.x = x; g.player.z = z; g.player.y = g.world.col.ground(x, z); g.player.yaw = 0; g.player.pitch = .05;
    window.__capturePhase = phase;
  }, { x, z, phase });
  await page.waitForTimeout(200);
}
try {
  for (const touch of [true, false]) {
    const context = await browser.newContext({ viewport: touch ? { width: 852, height: 393 } : { width: 1440, height: 900 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
    const page = await context.newPage(); page.setDefaultTimeout(30000); page.setDefaultNavigationTimeout(30000);
    const click = s => touch ? page.locator(s).tap() : page.locator(s).click();
    const category = async t => { if (!await page.locator(`[data-t="${t}"]`).isVisible()) await click('[data-nb-index]'); await click(`[data-t="${t}"]`); };
    page.on('pageerror', e => { errors.push(e.message); save(); });
    page.on('response', r => { if (r.status() >= 400) { errors.push(`HTTP ${r.status()} ${r.url()}`); save(); } });
    console.log(`START ${touch ? 'touch' : 'desktop'}`);
    try {
      await page.goto(BASE + '?review=boslust&autotest=1'); await click('[data-review-start]');
      await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 60000 });
      await page.evaluate(() => {
        document.querySelector('#review-bar')?.remove();
        // Fixture supplies only the cosmetic phase input. No puzzle flags or item state change.
        const env = window.__game.extras.env, update = env.update.bind(env);
        env.update = (dusk, focus, indoor) => update(window.__capturePhase ?? dusk, focus, indoor);
      });
      await pose(page);
      const startFrame = await page.evaluate(() => window.__game.renderer.info.render.frame);
      await page.waitForFunction(n => window.__game.renderer.info.render.frame > n + 2, startFrame);
      check(`${touch ? 'touch' : 'desktop'}: normal animation advances with ENV-L01`, await page.evaluate(() => window.__game.running && window.__game.world.scene.children.some(o => o.material?.uniforms?.uPilot?.value === 1)));
      if (touch) {
        await shot(page, 'phone-landscape');
        await page.setViewportSize({ width: 640, height: 360 }); await shot(page, 'small-landscape');
        await page.setViewportSize({ width: 852, height: 393 });
        await click('#b-bag'); await click('[data-id="matches"]');
        await page.locator('#inv-actions').scrollIntoViewIfNeeded();
        await shot(page, 'phone-inventory', 'Existing inventory and action layout; redesign is not implemented. Six owned items from the established BOSLUST fixture.');
        await page.getByRole('button', { name: 'In de hand nemen' }).tap();
        check('touch: inventory selection retains meaningful equipped control', await page.locator('#held').isVisible() && await page.evaluate(() => window.__game.selected === 'matches'));
        await shot(page, 'phone-selected-item');
        await click('#b-objective');
        check('touch: feedback cannot cover focused objective', await page.locator('#toast').evaluate(e => getComputedStyle(e).visibility === 'hidden'));
        await page.keyboard.press('Escape'); await click('#held');
        check('touch: deselect hides duplicate hand control', !await page.locator('#held').isVisible());
        await pose(page, 63, 11.5, 1); await shot(page, 'phone-boslust-dark', 'Phase input held at 1 in this capture fixture; active game loop, no future progress granted.');
        await pose(page, 90, 122, 0); await shot(page, 'phone-garden-bright', 'Phase input 0; actual ENV-L01 sky and world.');
        await pose(page); await page.setViewportSize({ width: 393, height: 852 });
        await shot(page, 'portrait-marker'); await click('#b-objective'); await shot(page, 'portrait-objective');
        await page.locator('#overlay').tap({ position: { x: 5, y: 5 } });
        check('portrait: outside dismissal restores input and marker focus', await page.evaluate(() => window.__game.input.enabled && document.activeElement.id === 'b-objective' && !window.__game.ui.modalKind));
      } else await shot(page, 'desktop-landscape');
      const name = touch ? 'portrait' : 'desktop';
      await click('#b-notes'); await category('a');
      const before = await page.evaluate(() => JSON.stringify({ flags: window.__game.state.flags, clues: window.__game.state.clues, inventory: window.__game.state.inventory }));
      await page.evaluate(() => { const el = document.querySelector('.wa-page'); el.scrollTop = el.scrollHeight; });
      if (touch) {
        await page.setViewportSize({ width: 852, height: 393 });
        await page.waitForFunction(() => !document.querySelector('.wa-index').hidden && !document.querySelector('.wa-page').hidden);
        await page.setViewportSize({ width: 393, height: 852 });
        await page.waitForFunction(() => document.querySelector('.wa-index').hidden && !document.querySelector('.wa-page').hidden);
        check('portrait: rotation preserves evidence selection', await page.locator('#nb-heading').textContent() === 'Aanwijzingen');
      }
      // Same native category route as the two historical timeout points, with rendering active.
      await category('b');
      check(`${name}: normal-render memory tab after evidence/rotation`, await page.locator('#nb .clue').count() === 0 && (await page.locator('#nb').innerText()).includes('Nog geen herinneringen'));
      await shot(page, `${name}-memory-tab`);
      await category('m'); check(`${name}: existing map opens`, await page.evaluate(() => window.__game.ui.modalKind === 'notebook-map'));
      await click('[data-back]'); await page.keyboard.press('Escape');
      check(`${name}: notebook returns world input without changing records`, await page.evaluate(before => window.__game.input.enabled && JSON.stringify({ flags: window.__game.state.flags, clues: window.__game.state.clues, inventory: window.__game.state.inventory }) === before, before));
      check(`${name}: no WebGL program errors`, await page.evaluate(() => window.__game.renderer.info.programs.every(p => p.diagnostics?.runnable !== false) && window.__game.renderer.getContext().getError() === 0));
    } catch (e) {
      results.push({ name: `${touch ? 'touch' : 'desktop'} completion`, ok: false, detail: e.stack }); save();
      console.error(e.message);
    } finally { await context.close(); }
  }
  check('no page or asset errors', errors.length === 0, errors);
} finally { save(); await browser.close(); }
console.log(`${results.filter(r => r.ok).length}/${results.length} recovery checks passed`);
process.exitCode = results.some(r => !r.ok) ? 1 : 0;
