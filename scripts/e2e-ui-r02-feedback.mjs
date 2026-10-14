// Focused HUD feedback QA. The real world loads normally; only the render loop is then
// stopped in this test context to avoid redundant software-GPU frames during DOM checks.
// This is UI validation, not a gameplay walkthrough or movement-speed benchmark.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.env.E2E_OUT ?? 'scripts/out/ui-r02-feedback-focused';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? chromium.executablePath(), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'] });
const results = [], captures = [], diagnostics = [];
const check = (name, ok, detail) => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) throw Error(name); };
async function shot(page, name) {
  const path = `${OUT}/${name}.jpg`;
  await page.screenshot({ path, type: 'jpeg', quality: 90 });
  captures.push({ name, path, viewport: page.viewportSize(), fixture: 'Actual WebGL world rendered at the camera pose; animation loop stopped for focused UI checks.' });
}
async function fit(page) {
  return page.evaluate(() => {
    const modal = document.querySelector('#overlay .modal');
    const r = modal?.getBoundingClientRect();
    return { fits: !r || r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1, overflow: document.documentElement.scrollWidth > innerWidth + 1, small: [...document.querySelectorAll('#hud button, #overlay button')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').some(e => { const r = e.getBoundingClientRect(); return r.width < 47.5 || r.height < 47.5; }) };
  });
}
for (const touch of [true, false]) {
  const context = await browser.newContext({ viewport: touch ? { width: 852, height: 393 } : { width: 1440, height: 900 }, hasTouch: touch, isMobile: touch });
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
  const click = s => touch ? page.locator(s).tap() : page.locator(s).click();
  try {
    await page.goto(BASE + '?review=boslust&autotest=1');
    await click('[data-review-start]');
    await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 60000 });
    await page.evaluate(() => {
      const g = window.__game; g.running = false; g.input.clear();
      document.querySelector('#review-bar')?.remove();
      g.player.x = 63; g.player.z = 11.5; g.player.y = g.world.col.ground(63, 11.5); g.player.yaw = 0; g.player.pitch = .05;
      g.tick(1 / 30); g.renderer.render(g.world.scene, g.camera);
    });
    for (const [name, width, height] of touch ? [['phone',852,393],['small',640,360],['portrait',393,852]] : [['desktop',1440,900]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => { const g = window.__game; g.renderer.render(g.world.scene, g.camera); });
      await page.waitForTimeout(100);
      const state = await page.evaluate(() => JSON.stringify({ flags: window.__game.state.flags, clues: window.__game.state.clues, inventory: window.__game.state.inventory }));
      const row = await page.evaluate(() => {
        const q = s => document.querySelector(s).getBoundingClientRect();
        const marker=q('#b-objective'), hint=q('#b-hint'), right=q('#topbar-r');
        return { background:getComputedStyle(document.querySelector('#objective-row')).backgroundImage, font:getComputedStyle(document.querySelector('#objective')).fontSize, visible:!!document.querySelector('#objective').getClientRects().length, beside:marker.left>=hint.right && Math.abs(marker.top-hint.top)<2, clear:marker.right<right.left };
      });
      check(`${name}: unbacked smaller objective / portrait marker`, row.background==='none' && row.font==='13px' && row.visible===(name!=='portrait') && row.beside && row.clear, row);
      check(`${name}: empty hand shortcut hidden`, !await page.locator('#held').isVisible());
      const bounds = await fit(page); check(`${name}: HUD targets and overflow`, bounds.fits && !bounds.overflow && !bounds.small, bounds);
      await shot(page, `${name}-exploration`);
      const objective = await page.locator('#objective').textContent();
      await click('#b-objective');
      await page.waitForSelector('.wa-objective-detail');
      const panel = await fit(page);
      check(`${name}: focused readable objective`, panel.fits && !panel.overflow && !panel.small && await page.locator('.wa-objective-detail').textContent()===objective && await page.evaluate(() => !window.__game.input.enabled && window.__game.ui.modalKind==='objective'), panel);
      if (name==='portrait') await shot(page, 'portrait-objective');
      await page.locator('[data-close]').focus(); await page.keyboard.press('Tab');
      check(`${name}: keyboard focus stays in the one-control dialog`, await page.locator('[data-close]').evaluate(e => e===document.activeElement));
      await page.keyboard.press('Escape');
      check(`${name}: dismissal restores focus / input / unchanged records`, await page.evaluate(s => window.__game.input.enabled && document.activeElement.id==='b-objective' && JSON.stringify({ flags:window.__game.state.flags, clues:window.__game.state.clues, inventory:window.__game.state.inventory })===s, state));
      await click('#b-bag'); check(`${name}: single bag entry still opens inventory`, await page.locator('.inv').count()===1); await page.keyboard.press('Escape');
      await click('#b-notes'); await click('[data-t="b"]');
      check(`${name}: native memory-tab activation works independently of background rendering`, await page.evaluate(() => document.querySelector('[data-t="b"]').classList.contains('on') && !!document.querySelector('#nb-panel').getClientRects().length));
      await page.keyboard.press('Escape');
      check(`${name}: notebook reading returns input without changing records`, await page.evaluate(s => window.__game.input.enabled && JSON.stringify({ flags:window.__game.state.flags, clues:window.__game.state.clues, inventory:window.__game.state.inventory })===s, state));
    }
    await page.evaluate(() => window.__game.select('matches'));
    check(`${touch?'touch':'desktop'}: meaningful selected item remains visible`, await page.locator('#held').isVisible());
    await click('#held'); check(`${touch?'touch':'desktop'}: deselect remains available`, await page.evaluate(() => window.__game.selected===null) && !await page.locator('#held').isVisible());
    if (touch) {
      diagnostics.push(await page.evaluate(() => { const i=window.__game.input; i.clear(); try { i.stickId=999;i.stickVec.x=0;i.stickVec.y=-1;i.sample();const off=i.runAmt;i.toggleRun();i.sample();return { name:'Full-stick auto-jog masks the shortcut',withoutButton:off,withButton:i.runAmt }; } finally { i.clear(); } }));
      await page.evaluate(() => window.__game.ui.setChecklist([{name:'Uitnodiging',done:true},{name:'Zaklamp',done:true},{name:'Lucifers',done:true},{name:'Notitieboek',done:true},{name:'Sleutel van het landhuis',done:false}]));
      check('portrait: packing checklist is absent from HUD', !await page.locator('#checklist').isVisible());
      await click('#b-objective');
      check('portrait: all packing requirements remain accessible', await page.locator('.wa-preparation li').count()===5);
      await shot(page,'portrait-packing'); await page.keyboard.press('Escape');
    }
    check(`${touch?'touch':'desktop'}: no page or asset errors`, errors.length===0, errors);
  } catch(e) { results.push({name:`${touch?'touch':'desktop'} suite completion`,ok:false,detail:e.message}); }
  await context.close();
}
await browser.close();
writeFileSync(`${OUT}/results.json`,JSON.stringify(results,null,2));writeFileSync(`${OUT}/captures.json`,JSON.stringify(captures,null,2));writeFileSync(`${OUT}/diagnostics.json`,JSON.stringify(diagnostics,null,2));
console.log(`${results.filter(x=>x.ok).length}/${results.length} focused UI checks passed`);
process.exitCode=results.some(x=>!x.ok)?1:0;
