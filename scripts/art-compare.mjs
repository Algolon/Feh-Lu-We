// Builds labelled comparison sheets from capture folders (same pose names, same viewport).
// Usage: node scripts/art-compare.mjs <outDir> <pose,pose,…|all> <label=dir[:suffix]> …
//   e.g. node scripts/art-compare.mjs out/compare 01,02 "Baseline=A" "Sample=C" "Sample clay=C:-clay"
// Each sheet stacks the variants vertically (2 columns when there are 4 variants), each with a caption bar.
import { chromium } from 'playwright-core';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';

const [OUT, POSES, ...specs] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const cols = specs.map((s) => { const [label, rest] = s.split('='); const [dir, suffix = ''] = rest.split(':'); return { label, dir, suffix }; });
const names = POSES === 'all'
  ? readdirSync(cols[0].dir).filter((f) => /^\d\d-[a-z0-9-]+\.jpg$/.test(f) && !/-(clay|neutral)\.jpg$/.test(f)).map((f) => f.replace('.jpg', ''))
  : POSES.split(',').map((p) => readdirSync(cols[0].dir).find((f) => f.startsWith(p) && !/-(clay|neutral)\.jpg$/.test(f))?.replace('.jpg', '')).filter(Boolean);
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
for (const name of names) {
  const imgs = cols.map((c) => { try { return { ...c, data: 'data:image/jpeg;base64,' + readFileSync(`${c.dir}/${name}${c.suffix}.jpg`).toString('base64') }; } catch { return null; } }).filter(Boolean);
  const b64 = await page.evaluate(async ([imgs, name]) => {
    const els = await Promise.all(imgs.map(async (i) => { const im = new Image(); im.src = i.data; await im.decode(); return im; }));
    const W = els[0].width, H = els[0].height, bar = 26, ncol = imgs.length === 4 ? 2 : 1, nrow = Math.ceil(imgs.length / ncol);
    const c = document.createElement('canvas'); c.width = W * ncol; c.height = (H + bar) * nrow;
    const x = c.getContext('2d'); x.fillStyle = '#1e1610'; x.fillRect(0, 0, c.width, c.height);
    els.forEach((im, k) => {
      const cx = (k % ncol) * W, cy = Math.floor(k / ncol) * (H + bar);
      x.fillStyle = '#1e1610'; x.fillRect(cx, cy, W, bar);
      x.fillStyle = '#f5ead2'; x.font = '600 15px Georgia, serif'; x.fillText(`${imgs[k].label}  ·  ${name}`, cx + 10, cy + 18);
      x.drawImage(im, cx, cy + bar);
    });
    return c.toDataURL('image/jpeg', 0.8).split(',')[1];
  }, [imgs.map(({ label, data }) => ({ label, data })), name]);
  writeFileSync(`${OUT}/${name}.jpg`, Buffer.from(b64, 'base64'));
  console.log('sheet', name);
}
await browser.close();
