// DEV-04D D1: builds the FLW-D2 painting atlas (one texture, one material) from the canonical reference originals.
//
//   node scripts/build-flw-atlas.mjs
//
// Sources: docs/reference/flw/2d/<canonical file> (never modified). Each source is checked against the sha256 in
// docs/reference/flw/MANIFEST.json, then only resized (aspect kept, Chromium high-quality resampling) and placed on a
// skyline-packed atlas with a 4 px edge-extruded gutter (mip bleed). No crop, no colour change, no sharpening.
// Output: src/assets/art/flw-d2-atlas.webp + src/world/artAtlas.json (uv rects, sizes, provenance).
// Texel density: see ITEMS.
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

// id → long side in px: ≈ 340 px per metre of the hung canvas's long side (src/content/art.ts), clamped 320…512
// (a phone sees a 1.4 m canvas from 2 m at ≈ 300 px; D1-R normalised the density so the page stays 2048 × 1024)
const ITEMS = {
  'FLW-D2-002': 460, 'FLW-D2-026': 476, 'FLW-D2-028': 512, 'FLW-D2-010': 476, 'FLW-D2-042': 476,
  'FLW-D2-007': 320, 'FLW-D2-046': 408, 'FLW-D2-005': 425, 'FLW-D2-022': 340, 'FLW-D2-029': 408,
  'FLW-D2-035': 340, 'FLW-D2-044': 320, 'FLW-D2-045': 320,
};
const W = 2048, GUT = 4;
const manifest = JSON.parse(readFileSync('docs/reference/flw/MANIFEST.json', 'utf8'));
const byId = Object.fromEntries(manifest.assets.map((a) => [a.id, a]));

const items = Object.entries(ITEMS).map(([id, long]) => {
  const a = byId[id];
  if (!a?.path) throw new Error(`${id}: no canonical source`);
  const buf = readFileSync(a.path);
  const sha = createHash('sha256').update(buf).digest('hex');
  if (sha !== a.sha256) throw new Error(`${id}: source checksum differs from MANIFEST.json`);
  const [sw, sh] = a.dimensions;
  const s = long / Math.max(sw, sh);
  return { id, path: a.path, sha256: sha, status: a.status, src: [sw, sh], w: Math.round(sw * s), h: Math.round(sh * s), buf };
});

// skyline bottom-left packing (tallest first): each cell goes where its top edge ends lowest; ties → leftmost
items.sort((p, q) => q.h - p.h || q.w - p.w);
const sky = [{ x: 0, y: 0, w: W }];
for (const it of items) {
  const cw = it.w + 2 * GUT, ch = it.h + 2 * GUT;
  let best = null;
  for (let i = 0; i < sky.length; i++) {
    if (sky[i].x + cw > W) break;
    let y = 0, rem = cw;
    for (let j = i; j < sky.length && rem > 0; j++) { y = Math.max(y, sky[j].y); rem -= sky[j].w; }
    if (rem > 0) continue;
    if (!best || y + ch < best.y + ch || (y === best.y && sky[i].x < best.x)) best = { x: sky[i].x, y };
  }
  if (!best) throw new Error(`${it.id}: no room on the skyline`);
  it.x = best.x + GUT; it.y = best.y + GUT;
  // raise the skyline under the placed cell
  const x0 = best.x, x1 = best.x + cw, top = best.y + ch, next = [];
  for (const s2 of sky) {
    const a0 = s2.x, a1 = s2.x + s2.w;
    if (a1 <= x0 || a0 >= x1) { next.push(s2); continue; }
    if (a0 < x0) next.push({ x: a0, y: s2.y, w: x0 - a0 });
    if (a1 > x1) next.push({ x: x1, y: s2.y, w: a1 - x1 });
  }
  next.push({ x: x0, y: top, w: cw });
  next.sort((p, q) => p.x - q.x);
  sky.length = 0;
  for (const s2 of next) { const l = sky[sky.length - 1]; if (l && l.y === s2.y && l.x + l.w === s2.x) l.w += s2.w; else sky.push({ ...s2 }); }
}
const H = Math.ceil(Math.max(...items.map((it) => it.y + it.h + GUT)) / 64) * 64;

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
await page.evaluate(([W, H]) => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.id = 'atlas'; document.body.append(c); }, [W, H]);
for (const it of items) {
  await page.evaluate(async ({ url, x, y, w, h, g }) => {
    const img = new Image(); img.src = url; await img.decode();
    const t = document.createElement('canvas'); t.width = w; t.height = h;
    const tc = t.getContext('2d'); tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = 'high';
    tc.drawImage(img, 0, 0, w, h);
    const a = document.getElementById('atlas').getContext('2d');
    a.imageSmoothingEnabled = false;
    a.drawImage(t, x, y);
    // gutter: extrude the outermost row / column of pixels (outside the artwork, against mip bleed)
    a.drawImage(t, 0, 0, w, 1, x, y - g, w, g); a.drawImage(t, 0, h - 1, w, 1, x, y + h, w, g);
    a.drawImage(t, 0, 0, 1, h, x - g, y, g, h); a.drawImage(t, w - 1, 0, 1, h, x + w, y, g, h);
    for (const [sx, sy, dx, dy] of [[0, 0, x - g, y - g], [w - 1, 0, x + w, y - g], [0, h - 1, x - g, y + h], [w - 1, h - 1, x + w, y + h]]) a.drawImage(t, sx, sy, 1, 1, dx, dy, g, g);
  }, { url: `data:image/png;base64,${it.buf.toString('base64')}`, x: it.x, y: it.y, w: it.w, h: it.h, g: GUT });
}
const dataUrl = await page.evaluate(() => document.getElementById('atlas').toDataURL('image/webp', 0.9));
await browser.close();
mkdirSync('src/assets/art', { recursive: true });
const webp = Buffer.from(dataUrl.split(',')[1], 'base64');
writeFileSync('src/assets/art/flw-d2-atlas.webp', webp);

const rects = {};
for (const it of [...items].sort((p, q) => p.id.localeCompare(q.id))) {
  rects[it.id] = {
    source: it.path, sha256: it.sha256, status: it.status, sourcePx: it.src, px: [it.w, it.h],
    // uv rect (three.js convention: v = 0 at the bottom), inset half a texel
    uv: [(it.x + 0.5) / W, 1 - (it.y + it.h - 0.5) / H, (it.x + it.w - 0.5) / W, 1 - (it.y + 0.5) / H],
  };
}
writeFileSync('src/world/artAtlas.json', JSON.stringify({ size: [W, H], gutter: GUT, file: 'src/assets/art/flw-d2-atlas.webp', bytes: webp.length, items: rects }, null, 1) + '\n');
console.log(`atlas ${W}×${H}, ${items.length} items, ${(webp.length / 1024).toFixed(0)} KiB webp, GPU ≈ ${((W * H * 4 * 4) / 3 / 1048576).toFixed(1)} MiB with mips`);
