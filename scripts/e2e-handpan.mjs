// Asset 01 handpan: browser checks for playing the instrument, against the production build (npm run build && npm run
// preview). Walks to the music corner from the lawn, then:
//   - reticle: aim at the ding and at each of the eight tone fields, press the action → that field's D Kurd note sounds
//   - touch (phone context): tap directly on a tone field while the reticle points elsewhere → that note sounds
//   - muted audio: playing shows the one-line hint instead of failing silently
//   - nothing is saved: inventory, flags, taken items and solved puzzles are unchanged; no page / console errors
// Usage: node scripts/e2e-handpan.mjs [baseUrl]
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173/Feh-Lu-We/';
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };

// The layout and tuning as src/world/handpan.ts defines them (re-derived here on purpose: a drift fails the checks).
const ORDER = [0, 1, 7, 2, 6, 3, 5, 4], NOTES = [220.0, 233.08, 261.63, 293.66, 329.63, 349.23, 392.0, 440.0];
const FIELDS = ORDER.map((slot, rank) => {
  const s = 1 - 0.26 * (rank / 7);
  return { rank, az: (slot / 8) * Math.PI * 2 - Math.PI / 2, rho: 0.168 + 0.008 * (1 - s), hz: NOTES[rank] };
});
const TARGETS = [{ name: 'ding D3', az: 0, rho: 0, hz: 146.83, h: 0.128 }, ...FIELDS.map((f) => ({ ...f, name: `field ${f.rank}`, h: 0.08 }))];

async function start(opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  page.problems = [];
  page.on('pageerror', (e) => page.problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') page.problems.push(`console: ${m.text()}`); });
  await page.goto(BASE + '?autotest=1');
  await page.evaluate(() => localStorage.setItem('fehluwe.save', JSON.stringify({ version: 4, scene: 'estate', inventory: ['invitation', 'torch', 'matches', 'notebook', 'frontKey', 'consKey'], flags: { leftHome: true, basementOpen: true, boslustOpen: true } })));
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 180000 });
  await page.evaluate(helpers);
  // record every stroke that reaches the synth (the real one still plays)
  await page.evaluate(() => {
    const a = window.__game.audio, orig = a.handpan.bind(a);
    window.__notes = [];
    a.handpan = (hz, vel) => { const sounded = orig(hz, vel); window.__notes.push({ hz, vel, sounded }); return sounded; };
  });
  // walk in from the lawn (the corner must be reachable on foot), stop beside the pan
  await page.evaluate(() => { __game.player.setPose({ x: 85.6, y: 0, z: 126.4, yaw: 3.6, pitch: 0 }); T.tick(10); return T.walk([[84.6, 124.2], [83.05, 122.55]]); });
  return { ctx, page };
}
/** Plan-space point (x east, y up, z north) on the instrument at stand-local (az, rho), height h above the seam. */
const fieldPoint = (page, t) => page.evaluate(({ az, rho, h }) => {
  const root = __game.world.byId.get('play.handpan').obj;
  const v = new (root.position.constructor)(Math.cos(az) * rho, 0.725 + h, Math.sin(az) * rho);
  root.localToWorld(v);
  return { x: v.x, y: v.y, z: -v.z };
}, t);
const stateKey = (page) => page.evaluate(() => { const s = __game.state; return JSON.stringify([s.inventory, s.flags, s.taken, s.solved, s.open]); });

// ------------------------------------------------------------------------------------------------ desktop: reticle
{
  const { ctx, page } = await start({ viewport: { width: 1280, height: 720 } });
  const before = await stateKey(page);
  const ready = await page.evaluate(() => __game.audio.ready);
  log('audio context running after the start gesture', ready);
  const played = [];
  for (const t of TARGETS) {
    const p = await fieldPoint(page, t);
    const r = await page.evaluate(({ p }) => {
      T.lookAt(p.x, p.y, p.z);
      const m = __game.metrics();
      const n0 = __notes.length;
      __game.doAction(); T.tick(1);
      return { target: m.target, label: m.label, note: __notes.length > n0 ? __notes.at(-1) : null };
    }, { p });
    played.push({ ...t, ...r });
  }
  const aimed = played.every((r) => r.target === 'play.handpan' && r.label === 'Bespelen: handpan');
  log('reticle targets the handpan with the label "Bespelen: handpan" on every field and the ding', aimed, JSON.stringify(played.filter((r) => r.target !== 'play.handpan').map((r) => r.name)));
  const right = played.every((r) => r.note && Math.abs(r.note.hz - r.hz) < 0.01);
  log('each aimed field plays its own note (ding D3, fields A3 … A4)', right, played.map((r) => `${r.name}:${r.note ? r.note.hz : '—'}`).join(' '));
  log('the strokes actually sound (synth returned true)', played.every((r) => r.note?.sounded === true));
  // pan from field to field quickly: ten strokes in a row never throw and stay capped
  const burst = await page.evaluate(() => { for (let i = 0; i < 14; i++) __game.doAction(); T.tick(1); return __notes.length; });
  log('a fast burst of strokes is handled (voice cap, no errors)', burst >= played.length + 14 && page.problems.length === 0, `${burst} strokes`);
  // muted: a hint, not silence
  const muted = await page.evaluate(() => {
    __game.audio.setMuted(true);
    const n0 = __notes.length;
    __game.doAction(); T.tick(2);
    const toast = [...document.querySelectorAll('#toast, .toast')].map((e) => e.textContent).join(' ');
    __game.audio.setMuted(false);
    return { sounded: __notes.at(-1)?.sounded, recorded: __notes.length > n0, toast };
  });
  log('with sound muted, playing shows the hint to turn sound on', muted.recorded && muted.sounded === false && muted.toast.includes('Het geluid staat uit'), JSON.stringify(muted));
  log('playing saves nothing (inventory, flags, taken, solved, open unchanged)', (await stateKey(page)) === before);
  log('desktop: no page / console errors', page.problems.length === 0, page.problems.slice(0, 3).join(' | '));
  await ctx.close();
}

// ------------------------------------------------------------------------------------------------ phone: direct tap
// A touch pointerdown + pointerup on the look zone, dispatched in one task: the real input path (Input.lookDown / lookUp →
// onTap → screen-space pick → run(at)). Real CDP touches are not used here because SwiftShader needs up to ~1.5 s per
// estate frame, so press → release would exceed the 350 ms tap window and read as a look drag (a test-rig artefact).
{
  const { ctx, page } = await start({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const taps = [];
  for (const t of [TARGETS[0], TARGETS[1 + 3], TARGETS[1 + 6]]) {
    const p = await fieldPoint(page, t);
    // aim above the pan (the reticle is not on the field), then tap the field itself: the tap point decides the note
    const r = await page.evaluate(({ p }) => {
      const c = T.hitCenter('play.handpan');
      T.lookAt(c.x, c.y + 0.1, c.z);
      const v = new (__game.camera.position.constructor)(p.x, p.y, -p.z).project(__game.camera);
      const x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight, n0 = __notes.length;
      const el = document.elementFromPoint(x, y);
      const ev = (type) => el.dispatchEvent(new PointerEvent(type, { pointerId: 21, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
      ev('pointerdown'); ev('pointerup');
      return { x: Math.round(x), y: Math.round(y), zone: el.id, note: __notes.length > n0 ? __notes.at(-1).hz : null };
    }, { p });
    taps.push({ name: t.name, want: t.hz, got: r.note, at: [r.x, r.y], zone: r.zone });
  }
  log('phone: tapping a field plays that field (ding, D4, G4)', taps.every((r) => r.got !== null && Math.abs(r.got - r.want) < 0.01), JSON.stringify(taps));
  log('phone: no page / console errors', page.problems.length === 0, page.problems.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close();
const ok = results.filter((r) => r.ok).length;
console.log(`\n${ok}/${results.length} checks passed`);
process.exit(ok === results.length ? 0 : 1);
