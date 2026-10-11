// DEV-04D D3 Asset Track 01: isolated asset review captures (asset-review.html). Nothing here touches the game world.
// Usage: npx vite --port 5173 &   then   node scripts/d3b-asset-views.mjs [baseUrl] [outDir]   (ONLY=swallows,medallion,…)
//
// Per 3D asset: model views (front / three-quarter / side) in standard, neutral and clay; a close detail; player-eye
// views at the phone viewport (915 × 412, FOV 68, eye 1.65 m) from the SAME poses the D2 / D2-R audit used in the real
// rooms (transformed into the review frame, so distances and angles are the in-room ones); the current production piece
// from the same cameras; the source-reference crop; and one contact sheet REFERENCE | STANDARD | CLAY | PLAYER-EYE.
// The medallion also gets its scale ladder (×1 / ×2 / ×2.5 / ×3) from the botanic door, the room and close.
// 2D: framed previews of the group-B candidates at the planned atlas texel density (isolated wall, not in a room).
// Writes <outDir>/stats.json (triangles, materials, mesh count per shot).
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5173/Feh-Lu-We/';
const OUT = process.argv[3] ?? 'docs/dev04d/d3b-assets';
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const exe = process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const D = Math.PI / 180, EYE = 1.65;
const PHONE = { width: 915, height: 412 }, MODEL = { width: 1000, height: 640 };

/** A game pose (plan x / z, heading yaw°, pitch) seen relative to a piece (plan x / z / facing yaw rad) → review camera. */
function rel(piece, cam) {
  const p = piece.yaw, dx = cam.x - piece.x, dz = cam.z - piece.z;
  const x1 = dx * Math.cos(p) - dz * Math.sin(p), z1 = dx * Math.sin(p) + dz * Math.cos(p), yw = cam.yaw * D - p;
  const pos = [-x1, EYE, z1], dir = [-Math.sin(yw), Math.tan(cam.pitch), Math.cos(yw)];
  return { cam: pos, look: pos.map((v, i) => v + dir[i]), fov: 68 };
}
/** Model views around a wall piece centred at (0, h, 0) of width w (review frame). */
function wallViews(h, w) {
  const d = Math.max(1.0, 1.75 * w);
  return {
    front: { cam: [0, h, d], look: [0, h, 0], fov: 30 },
    tq: { cam: [d * 0.62, h + d * 0.12, d * 0.78], look: [0, h, 0.03], fov: 30 },
    side: { cam: [d * 0.95, h + d * 0.02, 0.06 * w + 0.02], look: [0, h, 0.06 * w + 0.02], fov: 30 },
  };
}
function standViews(h, size) {
  const d = Math.max(0.9, 3.0 * size), c = h + size * 0.5;
  return {
    front: { cam: [0, c, d], look: [0, c, 0], fov: 30 },
    tq: { cam: [d * 0.62, c + d * 0.3, d * 0.78], look: [0, c, 0], fov: 30 },
    side: { cam: [d, c, 0.0], look: [0, c, 0], fov: 30 },
  };
}

// ---------------------------------------------------------------------------------------------- the pieces
// game anchors and poses (props3d.ts PROPS3D; dev04d-audit-views.mjs SET=d2r / d2)
const SWALLOW = { x: 90.0, z: 80.422, yaw: 0, h: 2.0 };
const MEDAL = { x: 101.38, z: 88.5, yaw: Math.PI / 2, h: 1.65 };
const MOON = { x: 72.66, z: 91.0, yaw: Math.PI / 2 - 0.35, h: 0.5775 };
const SLOOP = { x: 79.25, z: 80.92, yaw: Math.PI / 2, h: 0.76 };
const objPoses = (piece, objH, yawDeg, dists, names) => dists.map((d, i) => {
  const r = yawDeg * D;
  return [names[i], { x: piece.x - Math.sin(r) * d, z: piece.z - Math.cos(r) * d, yaw: yawDeg, pitch: Math.atan2(objH - EYE, d) }];
});
const POSES = {
  swallows: [['eye-walk', { x: 90.3, z: 83.5, yaw: 180, pitch: 0.3 }], ['eye-close', { x: 90.0, z: 81.9, yaw: 180, pitch: 0.28 }], ['eye-void', { x: 86.0, z: 94.0, yaw: 164, pitch: 0.12 }]],
  medallion: [['eye-door', { x: 104.0, z: 95.3, yaw: -159, pitch: 0.03 }], ['eye-room', { x: 105.4, z: 91.2, yaw: -112, pitch: 0.05 }], ['eye-close', { x: 102.7, z: 88.5, yaw: -90, pitch: 0.12 }]],
  moon: objPoses(MOON, 0.7, -100, [0.9, 2.2, 4.4], ['eye-close', 'eye-room', 'eye-approach']),
  sloop: objPoses(SLOOP, 0.9, 200, [0.85, 2.2, 4.6], ['eye-close', 'eye-room', 'eye-approach']),
};

const shots = []; // [dir, name, viewport, shot]
const S = (dir, name, vp, shot) => shots.push([dir, name, vp, shot]);
const MODES = ['standard', 'neutral', 'clay'];

if (!ONLY || ONLY.has('swallows')) {
  const base = { asset: 'FLW-S3-014', h: SWALLOW.h, stage: 'wall' }, v = wallViews(SWALLOW.h, 1.75);
  for (const [k, cam] of Object.entries(v)) for (const mode of MODES) S('swallows', `t01-${k}-${mode}`, MODEL, { ...base, variant: 't01', mode, ...cam });
  for (const mode of ['standard', 'clay']) {
    S('swallows', `t01-detail-${mode}`, MODEL, { ...base, variant: 't01', mode, cam: [0.05, SWALLOW.h + 0.12, 0.85], look: [0.0, SWALLOW.h + 0.1, 0], fov: 40 });
    S('swallows', `prod-front-${mode}`, MODEL, { ...base, variant: 'prod', mode, ...v.front });
  }
  S('swallows', 'prod-tq-standard', MODEL, { ...base, variant: 'prod', mode: 'standard', ...v.tq });
  for (const [n, pose] of POSES.swallows) for (const variant of ['t01', 'prod']) S('swallows', `${variant}-${n}`, PHONE, { ...base, variant, mode: 'standard', ...rel(SWALLOW, pose) });
  S('swallows', 't01-eye-walk-clay', PHONE, { ...base, variant: 't01', mode: 'clay', ...rel(SWALLOW, POSES.swallows[0][1]) });
}

if (!ONLY || ONLY.has('medallion')) {
  const base = { asset: 'FLW-S3-017', h: MEDAL.h, stage: 'wall' }, v = wallViews(MEDAL.h, 0.6);
  for (const [k, cam] of Object.entries(v)) for (const mode of MODES) S('medallion', `t01-${k}-${mode}`, MODEL, { ...base, variant: 't01', mode, ...cam });
  for (const mode of ['standard', 'clay']) S('medallion', `prod-front-${mode}`, MODEL, { ...base, variant: 'prod', mode, ...v.front });
  S('medallion', 'prod-tq-standard', MODEL, { ...base, variant: 'prod', mode: 'standard', ...v.tq });
  // scale ladder: the same in-room poses; the centre rises only as far as a 0.9 m clearance under the disc needs
  for (const s of [1, 2, 2.5, 3]) {
    const h = Math.max(MEDAL.h, 0.9 + 0.29 * s), piece = { ...MEDAL, h }, tag = `x${s}`;
    for (const [n, pose] of POSES.medallion) S('medallion', `ladder-${tag}-${n}`, PHONE, { ...base, h, scale: s, variant: 't01', mode: 'standard', ...rel(piece, pose) });
    S('medallion', `ladder-${tag}-eye-close-clay`, PHONE, { ...base, h, scale: s, variant: 't01', mode: 'clay', ...rel(piece, POSES.medallion[2][1]) });
    const wv = wallViews(h, 0.6 * s);
    S('medallion', `ladder-${tag}-front-standard`, MODEL, { ...base, h, scale: s, variant: 't01', mode: 'standard', ...wv.front });
  }
  for (const [n, pose] of POSES.medallion) S('medallion', `prod-${n}`, PHONE, { ...base, variant: 'prod', mode: 'standard', ...rel(MEDAL, pose) });
}

if (!ONLY || ONLY.has('moon')) {
  const base = { asset: 'FLW-S3-016', h: MOON.h, stage: 'bedside' }, v = standViews(MOON.h, 0.32);
  for (const [k, cam] of Object.entries(v)) for (const mode of MODES) S('moon', `t01-${k}-${mode}`, MODEL, { ...base, variant: 't01', mode, ...cam });
  for (const mode of ['standard', 'clay']) S('moon', `prod-front-${mode}`, MODEL, { ...base, variant: 'prod', mode, ...v.front });
  S('moon', 'prod-tq-standard', MODEL, { ...base, variant: 'prod', mode: 'standard', ...v.tq });
  for (const [n, pose] of POSES.moon) for (const variant of ['t01', 'prod']) S('moon', `${variant}-${n}`, PHONE, { ...base, variant, mode: 'standard', ...rel(MOON, pose) });
  for (const sc of [1.4, 1.8]) S('moon', `t01-x${sc}-eye-room`, PHONE, { ...base, variant: 't01', scale: sc, mode: 'standard', ...rel(MOON, POSES.moon[1][1]) }); // presentation-scale evidence for D3-b
  S('moon', 't01-eye-room-clay', PHONE, { ...base, variant: 't01', mode: 'clay', ...rel(MOON, POSES.moon[1][1]) });
}

if (!ONLY || ONLY.has('sloop')) { // Track 01 rebuild (owner, closeout) against the production model, from the same cameras
  const base = { asset: 'FLW-S3-015', h: SLOOP.h, stage: 'bedside' }, v = standViews(SLOOP.h, 0.5);
  for (const k of ['front', 'side', 'tq']) for (const mode of MODES) S('sloop', `t01-${k}-${mode}`, MODEL, { ...base, variant: 't01', mode, ...v[k] });
  for (const k of ['side', 'tq']) for (const mode of ['standard', 'clay']) S('sloop', `prod-${k}-${mode}`, MODEL, { ...base, variant: 'prod', mode, ...v[k] });
  S('sloop', 't01-detail-standard', MODEL, { ...base, variant: 't01', mode: 'standard', cam: [0.55, SLOOP.h + 0.16, 0.12], look: [0, SLOOP.h + 0.1, 0.0], fov: 32 });
  for (const [n, pose] of POSES.sloop) for (const variant of ['t01', 'prod']) S('sloop', `${variant}-${n}`, PHONE, { ...base, variant, mode: 'standard', ...rel(SLOOP, pose) });
  S('sloop', 't01-eye-room-clay', PHONE, { ...base, variant: 't01', mode: 'clay', ...rel(SLOOP, POSES.sloop[1][1]) });
}

// 2D group-B candidates for the D3-b rooms: proposed canvas size (m), frame rail (S3-043 simple / S3-045 print), atlas px
// (≈ 340 px per metre of the long side, 320…512: the build-flw-atlas.mjs rule)
const ART2D = [
  ['FLW-D2-008', 'study', '2d/FLW-D2-008_schaduwvlakken.png', 0.6, 0.6, 0.032, '#c8a77a'],
  ['FLW-D2-023', 'study', '2d/FLW-D2-023_twee-elkaar-rakende-horizonvlakken.png', 0.7, 0.7, 0.065, '#5c3b22'],
  ['FLW-D2-009', 'botanic', '2d/FLW-D2-009_mot-boven-wilde-bloemen.png', 0.48, 0.6, 0.032, '#c8a77a'],
  ['FLW-D2-027', 'reis / guest', '2d/FLW-D2-027_bergreisprint.png', 0.6, 0.8, 0.065, '#6e4b2e'],
  ['FLW-D2-017', 'bath', '2d/FLW-D2-017_botanische-cyanotypie-siergras.png', 0.35, 0.7, 0.032, '#ece6da'],
  ['FLW-D2-030', 'bath', '2d/FLW-D2-030_gestileerde-varens-en-waterpoel.png', 0.6, 0.8, 0.065, '#8a6038'],
];
const atlasPx = (w, h) => Math.min(512, Math.max(320, Math.round(340 * Math.max(w, h))));
if (!ONLY || ONLY.has('art2d')) for (const [id, , src, w, h, rail, railCol] of ART2D) {
  const art = { src: `${BASE}docs/reference/flw/${src}`, w, h, rail, railCol, px: atlasPx(w, h) };
  S('art2d', `${id}-room`, PHONE, { art, h: 1.6, mode: 'standard', stage: 'wall', cam: [0.2, EYE, 3.0], look: [0, 1.6, 0], fov: 68 });
  S('art2d', `${id}-close`, PHONE, { art, h: 1.6, mode: 'standard', stage: 'wall', cam: [0.0, EYE, 1.5], look: [0, 1.6, 0], fov: 68 });
}

// ---------------------------------------------------------------------------------------------- capture
const has0 = (k) => !ONLY || ONLY.has(k);
const REF = { // reference crops (source px) from the canonical sheets: the art panels
  swallows: ['3d/FLW-S3-014_gesneden-zwaluwen.png', [216, 185, 1684, 455]],
  medallion: ['3d/FLW-S3-017_terracotta-bloemmedaillon.png', [432, 190, 490, 530]],
  moon: ['3d/FLW-S3-016_keramische-maanvorm.png', [437, 200, 1448, 600]],
  sloop: ['3d/FLW-S3-015_miniatuurzeilboot.png', [0, 0, 1448, 630]],
};
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: MODEL });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
await page.goto(BASE + 'asset-review.html');
await page.waitForFunction(() => window.__ar?.ready, null, { timeout: 120000 });
const stats = {};
for (const [dir, name, vp, shot] of shots) {
  mkdirSync(`${OUT}/${dir}`, { recursive: true });
  await page.setViewportSize(vp);
  const st = await page.evaluate((s) => window.__ar.show(s), shot);
  await page.screenshot({ path: `${OUT}/${dir}/${name}.jpg`, type: 'jpeg', quality: 82 });
  stats[`${dir}/${name}`] = st;
  console.log(`${dir}/${name}`.padEnd(46), `${st.tris} tris`, st.materials.join('+'));
}
mkdirSync(`${OUT}/ref`, { recursive: true });
for (const [k, [src, [x, y, w, h]]] of Object.entries(REF)) {
  if (ONLY && !ONLY.has(k)) continue;
  const url = await page.evaluate(async ({ src, x, y, w, h }) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.85);
  }, { src: `${BASE}docs/reference/flw/${src}`, x, y, w, h });
  writeFileSync(`${OUT}/ref/${k}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
}

if (has0('art2d')) for (const [id, , src] of ART2D) { // source thumbnails (whole image, untouched pixels, downscaled for the sheet)
  const url = await page.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const s = 360 / Math.max(img.width, img.height), c = document.createElement('canvas');
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85);
  }, `${BASE}docs/reference/flw/${src}`);
  writeFileSync(`${OUT}/ref/${id}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
}

// ---------------------------------------------------------------------------------------------- contact sheets
const img = (p) => `data:image/jpeg;base64,${readFileSync(p).toString('base64')}`;
async function sheet(file, title, rows, colW = 440) {
  const html = `<html><body style="margin:0;background:#1d1712;color:#efe6d2;font:13px system-ui,sans-serif;padding:12px">
    <div style="font-size:17px;margin-bottom:8px">${title}</div>
    <table style="border-collapse:collapse">${rows.map((r) => `<tr>${r.map(([lab, p]) => `<td style="padding:4px;vertical-align:top">
      <div style="margin-bottom:3px;opacity:.85">${lab}</div>${p ? `<img src="${img(p)}" style="width:${colW}px;max-height:300px;object-fit:contain;object-position:left top;display:block">` : ''}</td>`).join('')}</tr>`).join('')}</table></body></html>`;
  await page.setViewportSize({ width: 1900, height: 900 });
  await page.setContent(html);
  await page.screenshot({ path: file, fullPage: true, type: 'jpeg', quality: 80 });
}
const P = (d, n) => `${OUT}/${d}/${n}.jpg`;
const has = has0;
if (has('swallows')) await sheet(`${OUT}/sheet-swallows.jpg`, 'FLW-S3-014 swallows · Track 01 rebuild vs production · REFERENCE | STANDARD | CLAY | PLAYER-EYE (phone, walk path)', [
  [['reference (sheet art panel)', `${OUT}/ref/swallows.jpg`], ['T01 standard (ART-01)', P('swallows', 't01-front-standard')], ['T01 clay', P('swallows', 't01-front-clay')], ['T01 player-eye · walk path 3.1 m', P('swallows', 't01-eye-walk')]],
  [['', null], ['production (D2-R) standard', P('swallows', 'prod-front-standard')], ['production clay', P('swallows', 'prod-front-clay')], ['production player-eye · walk path', P('swallows', 'prod-eye-walk')]],
  [['T01 three-quarter', P('swallows', 't01-tq-standard')], ['T01 side', P('swallows', 't01-side-standard')], ['T01 across the void (14 m)', P('swallows', 't01-eye-void')], ['production across the void', P('swallows', 'prod-eye-void')]],
]);
if (has('medallion')) {
  await sheet(`${OUT}/sheet-medallion.jpg`, 'FLW-S3-017 medallion · Track 01 refinement vs production (×1) · REFERENCE | STANDARD | CLAY | PLAYER-EYE (phone, botanic door)', [
    [['reference (sheet art panel)', `${OUT}/ref/medallion.jpg`], ['T01 standard', P('medallion', 't01-front-standard')], ['T01 clay', P('medallion', 't01-front-clay')], ['T01 player-eye · room', P('medallion', 'ladder-x1-eye-room')]],
    [['', null], ['production (D2-R) standard', P('medallion', 'prod-front-standard')], ['production clay', P('medallion', 'prod-front-clay')], ['production player-eye · room', P('medallion', 'prod-eye-room')]],
    [['T01 three-quarter', P('medallion', 't01-tq-standard')], ['T01 side', P('medallion', 't01-side-standard')], ['T01 neutral', P('medallion', 't01-front-neutral')], ['', null]],
  ]);
  await sheet(`${OUT}/sheet-medallion-scale.jpg`, 'FLW-S3-017 scale ladder (evaluation only: final size and wall are D3-b) · ×1 = Ø 0.58 m', [
    ...['eye-door', 'eye-room', 'eye-close', 'eye-close-clay'].map((n) => [1, 2, 2.5, 3].map((s) => [`×${s} · ${n.replace('eye-', '')}`, P('medallion', `ladder-x${s}-${n}`)])),
  ], 440);
}
if (has('moon')) await sheet(`${OUT}/sheet-moon.jpg`, 'FLW-S3-016 moon · Track 01 rebuild vs production · REFERENCE | STANDARD | CLAY | PLAYER-EYE (phone, 2.2 m)', [
  [['reference (sheet art panel)', `${OUT}/ref/moon.jpg`], ['T01 standard', P('moon', 't01-front-standard')], ['T01 clay', P('moon', 't01-front-clay')], ['T01 player-eye · 2.2 m', P('moon', 't01-eye-room')]],
  [['', null], ['production standard', P('moon', 'prod-front-standard')], ['production clay', P('moon', 'prod-front-clay')], ['production player-eye · 2.2 m', P('moon', 'prod-eye-room')]],
  [['T01 three-quarter', P('moon', 't01-tq-standard')], ['T01 side', P('moon', 't01-side-standard')], ['T01 player-eye · 4.4 m', P('moon', 't01-eye-approach')], ['production player-eye · 4.4 m', P('moon', 'prod-eye-approach')]],
]);
if (has('sloop')) await sheet(`${OUT}/sheet-sloop.jpg`, 'FLW-S3-015 sloop · Track 01 hull rebuild vs production · REFERENCE | STANDARD | CLAY | PLAYER-EYE (phone, desk 2.2 m)', [
  [['reference (sheet)', `${OUT}/ref/sloop.jpg`], ['T01 side, standard', P('sloop', 't01-side-standard')], ['T01 side, clay', P('sloop', 't01-side-clay')], ['T01 player-eye · 2.2 m', P('sloop', 't01-eye-room')]],
  [['', null], ['production side, standard', P('sloop', 'prod-side-standard')], ['production side, clay', P('sloop', 'prod-side-clay')], ['production player-eye · 2.2 m', P('sloop', 'prod-eye-room')]],
  [['T01 three-quarter', P('sloop', 't01-tq-standard')], ['T01 hull / supports detail', P('sloop', 't01-detail-standard')], ['T01 player-eye · 0.85 m', P('sloop', 't01-eye-close')], ['production player-eye · 0.85 m', P('sloop', 'prod-eye-close')]],
  [['T01 front', P('sloop', 't01-front-standard')], ['production three-quarter', P('sloop', 'prod-tq-standard')], ['T01 player-eye · 4.6 m', P('sloop', 't01-eye-approach')], ['production player-eye · 4.6 m', P('sloop', 'prod-eye-approach')]],
]);
if (has('art2d')) await sheet(`${OUT}/sheet-2d.jpg`, '2D group-B candidates for the D3-b rooms · framed previews at the planned atlas density, production art material (isolated wall; NOT placed: owner review)', ART2D.map(([id, room, , w, h]) => [
  [`${id} · ${room} · source`, `${OUT}/ref/${id}.jpg`], [`room read 3 m · ${w} × ${h} m · ${atlasPx(w, h)} px`, P('art2d', `${id}-room`)], ['close 1.5 m', P('art2d', `${id}-close`)],
]), 520);

writeFileSync(`${OUT}/stats.json`, JSON.stringify({ commit: process.env.COMMIT ?? null, stats, problems }, null, 2));
if (problems.length) console.log('PROBLEMS:\n' + problems.slice(0, 10).join('\n'));
await browser.close();
