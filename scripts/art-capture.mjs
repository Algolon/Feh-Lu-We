// Art-refresh comparison captures (step 2+). Same settings as scripts/art-baseline.mjs — landscape phone viewport
// 844×390, quality "low" (phone default), HUD hidden, fresh estate state — plus URL flags for the variant.
//
// Usage: node scripts/art-capture.mjs <outDir> "<query>" [set] [baseUrl]
//   query  extra URL parameters, e.g. "art=sample&light=sample&tm=aces"  ("" = baseline)
//   set    living (default) | quick | boslust
// Passes per pose: <name>.jpg (game), -neutral.jpg (material behaviour: no fog, white sky/sun, exposure 1,
// fixtures unchanged), -clay.jpg (shape only: one matte grey material, NO textures, vertex/instance colours,
// emissive glows, flames, light pools, contact decals or point lights — white sky/sun only).
// Variants: shots with `off: true` are taken with the living-room fire and floor lamp switched off.
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const OUT = process.argv[2] ?? 'scripts/out/art';
const QUERY = process.argv[3] ?? '';
const SET = process.argv[4] ?? 'living';
const BASE = process.argv[5] ?? 'http://localhost:4173/Feh-Lu-We/';
mkdirSync(OUT, { recursive: true });
const helpers = readFileSync(new URL('./e2e-helpers.js', import.meta.url), 'utf8');
const ESS = ['invitation', 'torch', 'matches', 'notebook', 'frontKey'];
const VIEW = { width: 844, height: 390 };

// [name, stand {x,z}, look-at [x,y,z], options]  — 01–04 are the step-1 baseline poses, unchanged
const SETS = {
  living: [
    ['01-hearth-wide', { x: 80.6, z: 84.4 }, [72.6, 1.2, 86.9]],
    ['02-mantel-front', { x: 75.4, z: 86.7 }, [72.6, 1.35, 86.7]],
    ['03-mantel-near', { x: 73.9, z: 87.0 }, [72.8, 1.3, 86.6]],
    ['04-armchair-near', { x: 78.2, z: 81.9 }, [76.4, 0.45, 83.0]],
    ['16-oblique-furniture', { x: 74.2, z: 82.0 }, [78.6, 0.5, 87.6]],
    ['17-doorway-from-hall', { x: 86.6, z: 88.5 }, [72.6, 1.2, 86.7]],
    ['18-armchair-front', { x: 77.2, z: 84.9 }, [76.4, 0.55, 83.0]],
    ['19-armchair-rear', { x: 75.6, z: 81.3 }, [76.5, 0.55, 83.2]],
    ['20-sofa-seated', { x: 77.9, z: 88.2 }, [72.6, 1.0, 86.7], { seated: true }],
    ['21-hearth-oblique', { x: 75.6, z: 89.6 }, [72.6, 0.7, 86.4]],
    ['22-hearth-wide-off', { x: 80.6, z: 84.4 }, [72.6, 1.2, 86.9], { off: true }],
    ['23-mantel-front-off', { x: 75.4, z: 86.7 }, [72.6, 1.35, 86.7], { off: true }],
    ['24-floor-lamp', { x: 82.4, z: 85.0 }, [84.2, 1.1, 83.6]],
    ['25-floor-lamp-off', { x: 82.4, z: 85.0 }, [84.2, 1.1, 83.6], { off: true }],
    ['26-window-near', { x: 74.4, z: 91.6 }, [72.4, 1.6, 90.5]],
    ['27-table-near', { x: 78.0, z: 84.5 }, [77.3, 0.3, 86.7]],
    ['28-sofa-front', { x: 75.2, z: 86.2 }, [79.0, 0.5, 86.7]],
  ],
  // BOSLUST approach (step 3). 11/13/14/15 are the step-1 baseline poses, unchanged.
  boslust: [
    ['11-southern-loop', { x: 40, z: 9.3 }, [55.5, 1.4, 8.6]],
    ['13-boslust-fork', { x: 51.0, z: 7.2 }, [63.0, 2.0, 16.0]],
    ['14-boslust-cut', { x: 63, z: 10.2 }, [63, 1.8, 18.2]],
    ['15-boslust-door-near', { x: 63, z: 15.4 }, [63, 1.4, 18.2]],
    ['30-approach-mid', { x: 58.6, z: 9.6 }, [63.2, 1.8, 18.0]],
    ['31-reverse-from-door', { x: 63, z: 16.4 }, [55.0, 1.4, 6.0]],
    ['32-side-busy', { x: 70.5, z: 8.6 }, [61.5, 1.6, 16.5]],
    ['33-oak-roots-near', { x: 57.0, z: 10.0 }, [55.83, 0.5, 11.65]],
    ['34-oak-canopy-below', { x: 56.4, z: 11.0 }, [55.8, 7.0, 12.2]],
    ['35-oak-side', { x: 50.5, z: 7.6 }, [55.8, 3.2, 11.65]],
    ['36-pine-silhouette', { x: 60.5, z: 9.0 }, [69.2, 5.5, 16.1]],
    ['37-rocks-near', { x: 61.6, z: 12.0 }, [59.7, 0.7, 13.8]],
    ['38-fern-verge-near', { x: 57.4, z: 8.8 }, [56.4, 0.15, 10.6]],
    ['39-door-oblique', { x: 61.0, z: 15.6 }, [63.6, 1.6, 18.2]],
    ['40-signpost-near', { x: 52.6, z: 6.4 }, [54.3, 1.7, 7.8]],
    ['41-species-mix', { x: 47.5, z: 5.2 }, [60.0, 3.5, 22.0]],
    ['42-understory-near', { x: 59.0, z: 13.2 }, [56.8, 0.2, 15.6]],
  ],
  quick: [
    ['01-hearth-wide', { x: 80.6, z: 84.4 }, [72.6, 1.2, 86.9]],
    ['02-mantel-front', { x: 75.4, z: 86.7 }, [72.6, 1.35, 86.7]],
    ['03-mantel-near', { x: 73.9, z: 87.0 }, [72.8, 1.3, 86.6]],
    ['04-armchair-near', { x: 78.2, z: 81.9 }, [76.4, 0.45, 83.0]],
    ['16-oblique-furniture', { x: 74.2, z: 82.0 }, [78.6, 0.5, 87.6]],
  ],
};

const browser = await chromium.launch({
  executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1 });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
const record = [];
const passes = (process.env.PASSES ?? 'game,neutral,clay').split(',');
const ONLY = process.env.ONLY?.split(',');
for (const [name, stand, target, opt = {}] of SETS[SET].filter(([n]) => !ONLY || ONLY.some((o) => n.startsWith(o)))) {
  await page.goto(BASE + '?autotest=1' + (QUERY ? '&' + QUERY : ''));
  const lit = opt.off ? { 'fire.living': false, 'lamp.livingFloor': false } : {};
  await page.evaluate(([save]) => {
    localStorage.setItem('fehluwe.save', JSON.stringify(save));
    localStorage.setItem('fehluwe.settings', JSON.stringify({ quality: 'low' }));
  }, [{ version: 4, scene: 'estate', inventory: ESS, flags: { leftHome: true }, unlocked: ['lock.door.front'], open: { 'door.front': true }, lit, player: { home: null, estate: { x: stand.x, y: 0.15, z: stand.z, yaw: 0, pitch: 0 } } }]);
  await page.reload();
  await page.click('[data-cont]');
  await page.waitForFunction(() => window.__game?.world?.id === 'estate', null, { timeout: 60000 });
  await page.evaluate(helpers);
  const pose = await page.evaluate(([t, seated]) => {
    if (window.T.modalOpen()) window.T.closeModal();
    const g = window.__game;
    if (seated) { const orig = g.player.applyCamera.bind(g.player); g.player.applyCamera = (cam) => { orig(cam); cam.position.y -= 0.55; }; }
    window.T.tick(15);
    if (t) {
      window.T.lookAt(t[0], t[1], t[2]);
      if (seated) { const p = g.player; p.pitch = Math.atan2(t[1] - (p.y + 1.1), Math.hypot(t[0] - p.x, t[2] - p.z)); }
    }
    window.T.tick(10);
    for (const id of ['toast', 'hud', 'stick']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    const p = g.player;
    return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), yaw: +p.yaw.toFixed(3), pitch: +p.pitch.toFixed(3), eye: seated ? 1.1 : 1.65 };
  }, [target, !!opt.seated]);
  await page.waitForTimeout(1500); // settle: culling timer, light-pool fades, shader compiles
  // settled metrics: 30 consecutive real frames (min/max reported; they are normally identical)
  const m = await page.evaluate(() => new Promise((res) => {
    const g = window.__game, c = [], t = [];
    const f = () => { c.push(g.renderer.info.render.calls); t.push(g.renderer.info.render.triangles); if (c.length < 30) requestAnimationFrame(f); else res({ calls: Math.max(...c), callsMin: Math.min(...c), triangles: Math.max(...t), room: g.world.hereRoom }); };
    requestAnimationFrame(f);
  }));
  if (passes.includes('game')) await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 82 });
  if (passes.includes('neutral') || passes.includes('clay')) {
    await page.evaluate(() => {
      const g = window.__game, env = g.extras.env;
      env.update = () => {};
      env.hemi.color.set('#ffffff'); env.hemi.groundColor.set('#8a8a8a'); env.hemi.intensity = 2.0;
      env.sun.color.set('#ffffff'); env.sun.intensity = 1.6;
      const f = g.world.scene.fog; if (f) { f.near = 1e4; f.far = 2e4; }
      g.renderer.toneMappingExposure = 1.0;
      window.__artNeutral = true; // tells the game's art-lighting hook (if any) to stand down
      window.T.tick(2);
    });
    await page.waitForTimeout(500);
    if (passes.includes('neutral')) await page.screenshot({ path: `${OUT}/${name}-neutral.jpg`, type: 'jpeg', quality: 82 });
  }
  if (passes.includes('clay')) {
    await page.evaluate(() => {
      const g = window.__game;
      let Lam = null;
      g.world.scene.traverse((o) => { if (!Lam && o.isMesh && o.material?.type === 'MeshLambertMaterial') Lam = o.material.constructor; });
      const solid = new Lam({ color: '#c9c3b8' });
      const glass = new Lam({ color: '#c9c3b8', transparent: true, opacity: 0.15, depthWrite: false });
      g.world.scene.traverse((o) => {
        if (o.isLight && !o.isHemisphereLight && !o.isDirectionalLight) o.visible = false; // no coloured point lights
        if (!o.isMesh) return;
        if (o.userData.lightPatches || o.userData.contactShadows) { o.visible = false; return; }
        for (let q = o; q; q = q.parent) if (q.userData.fire) { o.visible = false; return; } // flames + embers
        const swap = (mm) => {
          if (!mm) return mm;
          if (mm.type === 'ShaderMaterial' && !mm.side) return mm; // sky dome (BackSide) handled below
          if (mm.type === 'ShaderMaterial' || mm.blending === 2) return null; // flames / additive effects → hidden
          return mm.transparent && mm.opacity < 0.5 ? glass : solid;
        };
        if (o.material?.type === 'ShaderMaterial' && o.material.side === 1) return; // keep the sky
        const nm = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
        if (nm === null || (Array.isArray(nm) && nm.includes(null))) { o.visible = false; return; }
        o.material = nm;
        if (o.isInstancedMesh) o.instanceColor = null;
        if (o.isBatchedMesh && o._colorsTexture) { o._colorsTexture.image.data.fill(1); o._colorsTexture.needsUpdate = true; } // batch colours apply whatever the material
      });
      // the pooled lights live outside the scene graph traversal order sometimes: switch every one off
      for (const l of g.pool?.lights ?? []) l.visible = false;
      window.T.tick(2);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${name}-clay.jpg`, type: 'jpeg', quality: 82 });
  }
  record.push({ name, pose, lookAt: target, ...opt, ...m });
  console.log(name.padEnd(24), JSON.stringify(pose), m.room, m.calls, m.triangles);
}
writeFileSync(`${OUT}/poses.json`, JSON.stringify({
  query: QUERY || '(baseline)', viewport: VIEW, deviceScaleFactor: 1, quality: 'low', fovDeg: 68, exposure: 1.15,
  renderer: 'Chromium 141 + SwiftShader (software WebGL2)', hud: 'hidden',
  neutral: 'fog off, hemisphere #ffffff/#8a8a8a ×2.0, sun #ffffff ×1.6, exposure 1.0; fixtures unchanged',
  clay: 'white sky/sun only; all lit surfaces matte #c9c3b8; no textures, vertex/instance colours, glows, flames, light pools, contact decals or point lights',
  shots: record,
}, null, 2));
console.log(problems.length ? problems.join('\n') : 'no page errors');
await browser.close();
