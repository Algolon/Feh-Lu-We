// DEV-04D W01 evidence harness: matched before / after views of the Wickerman ritual at fixed poses, plus the render
// cost of every view (low quality = the phone default, DPR 1, no shadow maps) and a few frame sequences.
// Usage: node scripts/w01-views.mjs [baseUrl] [outDir]   (VIEWS=a,b selects views; SEQ=0 skips the sequences)
//
// The same script captures the production baseline and the W01 candidate: every stage is reached through the
// setpiece's own interactables (the same handlers the reticle / action button call), never by writing lit keys,
// except where a step does not exist on a build (the baseline has no bale, no cleaning): the row is then marked
// `n/a` and the frame shows what that build does at that point.
// Poses are SET (camera placement for evidence only); y = feet, the support surface is resolved below.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'docs/dev04d/w01/after';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const D = Math.PI / 180;
const BLUE = 0.67; // ENV-L01: dusk 0.67 = the "Blue hour" lighting phase (lightingPhases.ts, 3 segments)

// stages: ready · ring · burn:<s> · charred · empty · carry · refill:<s> · refilled · cycle2:<stage>
const P = {
  entrance: { x: 176.4, y: 1.2, z: 59.9, yaw: 145 * D, pitch: 0.12 },
  approach: { x: 172.0, y: 1.2, z: 60.4, yaw: 105 * D, pitch: 0.06 },
  figure: { x: 180.0, y: 1.2, z: 59.6, yaw: 180 * D, pitch: 0.16 },
  candles: { x: 178.6, y: 1.2, z: 58.6, yaw: 135 * D, pitch: -0.35 },
  bale: { x: 177.9, y: 1.2, z: 53.1, yaw: -139 * D, pitch: -0.36 },
  plan: { x: 184.2, y: 1.2, z: 60.0, yaw: -140 * D, pitch: -0.18 },
  plinth: { x: 181.9, y: 1.2, z: 56.9, yaw: -135 * D, pitch: -0.42 },
};
export const VIEWS = [
  ['v01-entrance-ready', P.entrance, 'ready'],
  ['v02-approach-ready', P.approach, 'ready'],
  ['v03-figure-ready', P.figure, 'ready'],
  ['v04-candle-ring-lit', P.candles, 'ring'],
  ['v05-entrance-ring-lit', P.entrance, 'ring'],
  ['v06-burn-catch-4s', P.entrance, 'burn:4'],
  ['v07-burn-build-14s', P.entrance, 'burn:14'],
  ['v08-burn-peak-32s', P.entrance, 'burn:32'],
  ['v09-burn-peak-figure-32s', P.figure, 'burn:32'],
  ['v10-burn-decline-58s', P.entrance, 'burn:58'],
  ['v11-burn-settle-72s', P.entrance, 'burn:72'],
  ['v12-charred', P.entrance, 'charred'],
  ['v13-charred-figure', P.figure, 'charred'],
  ['v13b-charred-cold-60s', P.figure, 'cold'],
  ['v14-empty-frame', P.entrance, 'empty'],
  ['v15-empty-frame-figure', P.figure, 'empty'],
  ['v16-bale', P.bale, 'empty'],
  ['v17-carrying-hay', P.figure, 'carry'],
  ['v18-refill-mid', P.figure, 'refill:0.8'],
  ['v19-refilled-ready', P.entrance, 'refilled'],
  ['v20-clearing-plan', P.plan, 'ready'],
  ['v21-plinth-close', P.plinth, 'ready'],
  ['v22-burn-peak-bluehour', P.entrance, 'burn:32', BLUE],
  ['v23-charred-bluehour', P.entrance, 'charred', BLUE],
  ['v24-ring-lit-bluehour', P.entrance, 'ring', BLUE],
  ['v25-cycle2-ready', P.entrance, 'cycle2:refilled'],
];
// frame sequences (landscape, one pose): [name, pose, stage to start from, action, sample times (s)]
const SEQS = [
  ['s1-candle-sweep', P.entrance, 'ready', 'ring', [0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.6]],
  ['s2-burn', P.entrance, 'ring', 'ignite', [2, 6, 12, 20, 32, 50, 60, 68, 74, 82]],
  ['s3-clean', P.figure, 'charred', 'clean', [0.3, 0.6, 0.9, 1.2, 1.5, 2.0]],
  ['s4-refill', P.figure, 'carry', 'refill', [0.25, 0.5, 0.75, 1.0, 1.3, 1.8]],
];

const sel = process.env.VIEWS ? new Set(process.env.VIEWS.split(',')) : null;
const FMTS = [['land', { width: 915, height: 412 }], ['port', { width: 412, height: 915 }]];
const rows = [], problems = [];

async function open(viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text().slice(0, 200)}`); });
  await page.goto(BASE + '?autotest=1');
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey'], flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true } })));
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);
  await page.addStyleTag({ content: '#hud, .hud, #joy, #topbar, #objective, #toast, .toast, .wa-hud, [class*="hud"] { opacity: 0 !important; }' }).catch(() => {});
  // the stage driver: real interactable handlers only (run / useItem), the simulated clock for time
  await page.evaluate(() => {
    const g = window.__game, w = g.world, DT = 1 / 30;
    const tick = (s) => { for (let i = 0; i < Math.round(s / DT); i++) g.tick(DT); };
    const it = (id) => w.byId.get(id);
    const near = (x, z) => { g.player.setPose({ x, y: 1.2, z, yaw: 0, pitch: 0 }); g.player.y = w.col.supportHeight(x, z, 1.3, 0.42); g.tick(DT); };
    const W = {
      na: [],
      reset() {
        g.select?.(null); g.carry?.(null);
        for (const k of Object.keys(g.state.lit)) if (k.startsWith('wicker.')) delete g.state.lit[k];
        w.scene.userData.wickerSet?.reset?.();
        w.syncAll(); tick(0.2);
      },
      ring() { near(177.2, 57.6); it('wicker.candles').useItem('matches'); },
      ignite() { near(177.6, 55.6); it('wicker.figure').useItem('matches'); },
      clean() { near(177.6, 55.6); const f = it('wicker.figure'); if (/schoon/i.test(f.label() ?? '')) f.run(); else W.na.push('clean'); },
      take() { const b = it('wicker.bale'); if (!b) { W.na.push('bale'); return; } near(177.4, 52.6); b.run(); },
      refill() { near(177.6, 55.6); const f = it('wicker.figure'); if (/hooi/i.test(f.label() ?? '') && f.label() !== null) f.run(); else W.na.push('refill'); },
      stage(st) {
        W.na = [];
        W.reset();
        const [name, arg] = st.split(':');
        const run = (n, a) => {
          if (n === 'ready') return;
          if (n === 'ring') { W.ring(); tick(4.2); return; }
          if (n === 'burn') { W.ring(); tick(4.2); W.ignite(); tick(+a); return; }
          if (n === 'charred') { run('burn', 84); return; }
          if (n === 'cold') { run('burn', 146); return; } // the embers have faded (afterglow)
          if (n === 'empty') { run('charred'); W.clean(); tick(2.4); return; }
          if (n === 'carry') { run('empty'); W.take(); tick(0.3); return; }
          if (n === 'refill') { run('carry'); W.refill(); tick(+a); return; }
          if (n === 'refilled') { run('carry'); W.refill(); tick(2.4); return; }
          if (n === 'cycle2') { run('refilled'); run(a); }
        };
        run(name, arg);
        return W.na;
      },
      start(st, action) { W.stage(st); ({ ring: W.ring, ignite: W.ignite, clean: W.clean, refill: W.refill })[action](); },
      tick,
    };
    window.W = W;
  });
  return { ctx, page };
}

async function shoot(page, file, pose, dusk) {
  return page.evaluate(async ({ p, dusk }) => {
    const g = window.__game;
    g.player.setPose(p); g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42);
    g.dusk = dusk ?? 0;
    g.settings.quality = 'low'; g.applyQuality(true);
    // hold the pose for 0.2 s of game time: the culling / light pool cadence (0.12 s) must have run at this pose
    for (let i = 0; i < 6; i++) { g.player.setPose(p); g.player.y = g.world.col.supportHeight(p.x, p.z, p.y + 0.05, 0.42); g.dusk = dusk ?? 0; g.tick(1 / 30); }
    await new Promise((r) => setTimeout(r, 120));
    g.renderer.render(g.world.scene, g.camera);
    const i = g.renderer.info.render, m = g.renderer.info.memory;
    const set = g.world.scene.userData.wickerSet, lk = set?.look?.();
    return { calls: i.calls, triangles: i.triangles, geometries: m.geometries, textures: m.textures, programs: g.renderer.info.programs?.length ?? null,
      stage: set?.stage?.() ?? null, lit: Object.fromEntries(Object.entries(g.state.lit).filter(([k]) => k.startsWith('wicker.'))), litCount: set?.litCount?.() ?? null,
      look: lk ? { char: +lk.char.toFixed(2), flameLow: +lk.flameLow.toFixed(2), flameHigh: +lk.flameHigh.toFixed(2), light: +lk.light.toFixed(2), settled: lk.settled } : null };
  }, { p: pose, dusk });
}

for (const [fmt, vp] of FMTS) {
  const { ctx, page } = await open(vp);
  for (const [name, pose, stage, dusk] of VIEWS) {
    if (sel && !sel.has(name)) continue;
    if (fmt === 'port' && !/v01|v03|v08|v12|v14|v16|v19/.test(name)) continue; // portrait: the key subset
    const na = await page.evaluate((st) => window.W.stage(st), stage);
    const m = await shoot(page, null, pose, dusk);
    await page.waitForTimeout(100);
    await page.screenshot({ path: `${OUT}/${name}-${fmt}.jpg`, quality: 82, type: 'jpeg' });
    rows.push({ name, fmt, stage, dusk: dusk ?? 0, na, ...m });
    console.log(`${fmt} ${name.padEnd(28)} ${stage.padEnd(16)} ${String(m.stage).padEnd(12)} low ${m.calls}/${m.triangles}${na.length ? '  n/a:' + na.join(',') : ''}`);
  }
  if (fmt === 'land' && process.env.SEQ !== '0') {
    for (const [name, pose, from, action, times] of SEQS) {
      if (sel && !sel.has(name)) continue;
      await page.evaluate(({ from, action }) => window.W.start(from, action), { from, action });
      let t = 0;
      for (const ts of times) {
        await page.evaluate((d) => window.W.tick(d), ts - t); t = ts;
        const m = await shoot(page, null, pose, 0);
        const f = `${name}-${String(ts).replace('.', 'p')}s`;
        await page.screenshot({ path: `${OUT}/${f}.jpg`, quality: 72, type: 'jpeg' });
        rows.push({ name: f, fmt, stage: `${from}+${action}@${ts}`, dusk: 0, ...m });
        console.log(`seq ${f.padEnd(30)} ${String(m.stage).padEnd(12)} low ${m.calls}/${m.triangles} lit ${m.litCount}`);
      }
    }
  }
  await ctx.close();
}
writeFileSync(`${OUT}/views.json`, JSON.stringify({ base: BASE, rows, problems }, null, 2));
if (problems.length) console.log('PROBLEMS:\n' + problems.slice(0, 10).join('\n'));
await browser.close();
