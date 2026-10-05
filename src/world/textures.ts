// Seeded, hand-painted-looking canvas textures. Generated at runtime: no image downloads needed.
import * as THREE from 'three';
import { mulberry32, type Rng } from '../core/rng';
import { drawSymbol } from '../content/symbols';

function canvas(w: number, h = w): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function tex(c: HTMLCanvasElement, repeat = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

/** Soft blotches of colour, wrapping at edges so the texture tiles. */
function blotches(ctx: CanvasRenderingContext2D, r: Rng, w: number, h: number, n: number, colors: string[], rMin: number, rMax: number, alpha: number) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = rMin + r() * (rMax - rMin);
    ctx.globalAlpha = alpha * (0.4 + r() * 0.6);
    ctx.fillStyle = colors[Math.floor(r() * colors.length)];
    for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
      if (x + ox + rad < 0 || x + ox - rad > w || y + oy + rad < 0 || y + oy - rad > h) continue;
      ctx.beginPath();
      ctx.ellipse(x + ox, y + oy, rad, rad * (0.6 + r() * 0.4), r() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function strokes(ctx: CanvasRenderingContext2D, r: Rng, w: number, h: number, n: number, colors: string[], len: number, width: number, alpha: number, angle?: number) {
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h;
    const a = angle ?? r() * Math.PI;
    ctx.globalAlpha = alpha * (0.5 + r() * 0.5);
    ctx.strokeStyle = colors[Math.floor(r() * colors.length)];
    ctx.lineWidth = width * (0.6 + r() * 0.8);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function makeTextures() {
  const T: Record<string, THREE.Texture> = {};

  { // grass: warm mossy greens, painterly
    const [c, x] = canvas(512);
    const r = mulberry32(11);
    x.fillStyle = '#8fb35a';
    x.fillRect(0, 0, 512, 512);
    blotches(x, r, 512, 512, 220, ['#7ea24c', '#9cc163', '#86ab4f', '#a7c46c', '#6f9443'], 10, 46, 0.35);
    strokes(x, r, 512, 512, 2600, ['#6c9140', '#a9cc6e', '#7fa94a', '#b8d27d'], 7, 2, 0.5, -Math.PI / 2.2);
    blotches(x, r, 512, 512, 40, ['#c9d98a', '#e8e0a0'], 2, 4, 0.5);
    T.grass = tex(c);
  }
  { // dirt path
    const [c, x] = canvas(256);
    const r = mulberry32(12);
    x.fillStyle = '#c7a476';
    x.fillRect(0, 0, 256, 256);
    blotches(x, r, 256, 256, 160, ['#b8925f', '#d4b285', '#a98656', '#dcc095'], 4, 18, 0.45);
    blotches(x, r, 256, 256, 120, ['#8c7350', '#e9d6b0'], 1, 3, 0.6);
    T.dirt = tex(c);
  }
  { // cream stone blocks (exterior walls)
    const [c, x] = canvas(512);
    const r = mulberry32(13);
    x.fillStyle = '#e3d3b2';
    x.fillRect(0, 0, 512, 512);
    const rows = 8, rh = 512 / rows;
    for (let i = 0; i < rows; i++) {
      let px = i % 2 ? -40 : 0;
      while (px < 512) {
        const bw = 70 + r() * 60;
        const l = 200 + Math.floor(r() * 30);
        x.fillStyle = `rgb(${l + 22},${l + 8},${l - 22})`;
        x.fillRect(px + 2, i * rh + 2, bw - 4, rh - 4);
        px += bw;
      }
    }
    blotches(x, r, 512, 512, 160, ['#cbb994', '#efe4c9', '#d6c29c'], 4, 20, 0.25);
    x.strokeStyle = 'rgba(120,100,70,0.35)';
    x.lineWidth = 3;
    for (let i = 0; i <= rows; i++) { x.beginPath(); x.moveTo(0, i * rh); x.lineTo(512, i * rh); x.stroke(); }
    T.stone = tex(c);
  }
  { // plaster
    const [c, x] = canvas(256);
    const r = mulberry32(14);
    x.fillStyle = '#efe6d2';
    x.fillRect(0, 0, 256, 256);
    blotches(x, r, 256, 256, 140, ['#e6dbc3', '#f6efdf', '#e9dcc0'], 8, 30, 0.35);
    T.plaster = tex(c);
  }
  { // wood planks
    const [c, x] = canvas(512);
    const r = mulberry32(15);
    const n = 8, pw = 512 / n;
    for (let i = 0; i < n; i++) {
      const l = 0.88 + r() * 0.12;
      x.fillStyle = `rgb(${Math.floor(255 * l)},${Math.floor(240 * l)},${Math.floor(222 * l)})`;
      x.fillRect(i * pw, 0, pw, 512);
      x.save(); x.translate(i * pw, 0);
      strokes(x, r, pw, 512, 34, ['#c8b49a', '#e8dccb', '#b8a288'], 110, 1.4, 0.4, Math.PI / 2);
      x.restore();
      x.fillStyle = 'rgba(70,50,30,0.45)';
      x.fillRect(i * pw, 0, 2, 512);
      x.fillRect(i * pw, Math.floor(r() * 512), pw, 2);
    }
    T.wood = tex(c);
  }
  { // floor tiles (warm stone flags)
    const [c, x] = canvas(256);
    const r = mulberry32(16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const l = 205 + Math.floor(r() * 30);
      x.fillStyle = `rgb(${l},${l - 12},${l - 34})`;
      x.fillRect(i * 64, j * 64, 64, 64);
    }
    blotches(x, r, 256, 256, 80, ['#c8b48e', '#e8dcc0'], 3, 14, 0.3);
    x.strokeStyle = 'rgba(110,90,60,0.5)';
    x.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, 256); x.stroke();
      x.beginPath(); x.moveTo(0, i * 64); x.lineTo(256, i * 64); x.stroke();
    }
    T.tile = tex(c);
  }
  { // pool tiles (small blue mosaic)
    const [c, x] = canvas(256);
    const r = mulberry32(17);
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
      const v = r();
      x.fillStyle = v < 0.33 ? '#3fb0c9' : v < 0.66 ? '#58c4d8' : '#2f9cb8';
      x.fillRect(i * 16 + 1, j * 16 + 1, 14, 14);
    }
    T.poolTile = tex(c);
  }
  { // roof slate
    const [c, x] = canvas(256);
    const r = mulberry32(18);
    x.fillStyle = '#5d6577';
    x.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
      const l = 80 + Math.floor(r() * 25);
      x.fillStyle = `rgb(${l},${l + 6},${l + 22})`;
      x.fillRect(col * 32 + (row % 2) * 16 + 1, row * 32 + 1, 30, 30);
    }
    x.fillStyle = 'rgba(30,30,40,0.5)';
    for (let row = 0; row < 8; row++) x.fillRect(0, row * 32 + 28, 256, 4);
    T.slate = tex(c);
  }
  { // terracotta roof tiles
    const [c, x] = canvas(256);
    const r = mulberry32(19);
    x.fillStyle = '#b4583a';
    x.fillRect(0, 0, 256, 256);
    for (let col = 0; col < 8; col++) {
      const g = x.createLinearGradient(col * 32, 0, col * 32 + 32, 0);
      g.addColorStop(0, '#8e3f27'); g.addColorStop(0.5, '#d27a52'); g.addColorStop(1, '#8e3f27');
      x.fillStyle = g;
      x.fillRect(col * 32, 0, 32, 256);
    }
    x.fillStyle = 'rgba(70,30,20,0.45)';
    for (let row = 0; row < 8; row++) x.fillRect(0, row * 32 + 29, 256, 3);
    blotches(x, r, 256, 256, 60, ['#e09a6a', '#7b3522'], 3, 10, 0.25);
    T.terracotta = tex(c);
  }
  { // foliage: clustered leaf dabs
    const [c, x] = canvas(256);
    const r = mulberry32(20);
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, 256, 256);
    blotches(x, r, 256, 256, 260, ['#d9e8c8', '#ffffff', '#b8cfa0', '#eef5e0', '#9fb98a'], 5, 16, 0.6);
    T.foliage = tex(c);
  }
  { // bark
    const [c, x] = canvas(128);
    const r = mulberry32(21);
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, 128, 128);
    strokes(x, r, 128, 128, 180, ['#b9a690', '#e8ddd0', '#8f7a64'], 30, 3, 0.6, Math.PI / 2);
    T.bark = tex(c);
  }
  { // rug: patterned carpet (concept-art hall rugs)
    const [c, x] = canvas(512, 256);
    const r = mulberry32(22);
    x.fillStyle = '#7a2730';
    x.fillRect(0, 0, 512, 256);
    x.strokeStyle = '#d9a441'; x.lineWidth = 10; x.strokeRect(14, 14, 484, 228);
    x.strokeStyle = '#2e3d6b'; x.lineWidth = 8; x.strokeRect(32, 32, 448, 192);
    for (let i = 0; i < 70; i++) {
      const px = 50 + r() * 412, py = 50 + r() * 156;
      x.fillStyle = ['#d9a441', '#2e3d6b', '#c4553d', '#e8d6a8'][i % 4];
      x.save(); x.translate(px, py); x.rotate(Math.PI / 4);
      x.fillRect(-6, -6, 12, 12); x.restore();
    }
    x.fillStyle = '#d9a441';
    x.beginPath(); x.ellipse(256, 128, 70, 46, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#2e3d6b';
    x.beginPath(); x.ellipse(256, 128, 46, 28, 0, 0, Math.PI * 2); x.fill();
    T.rug = tex(c, false);
  }
  { // water ripples (greyscale, tinted by material colour)
    const [c, x] = canvas(256);
    const r = mulberry32(23);
    x.fillStyle = '#c8c8c8';
    x.fillRect(0, 0, 256, 256);
    strokes(x, r, 256, 256, 300, ['#ffffff', '#e8e8e8', '#a8a8a8'], 22, 2.5, 0.5, 0.1);
    T.water = tex(c);
  }
  return T;
}

/** A small framed landscape painting (procedural; no reproduction of existing works). */
export function paintingTexture(seed: number): THREE.CanvasTexture {
  const [c, x] = canvas(128, 96);
  const r = mulberry32(seed);
  const g = x.createLinearGradient(0, 0, 0, 96);
  g.addColorStop(0, ['#9cc4e4', '#f2c48a', '#c9b6e0'][seed % 3]);
  g.addColorStop(1, '#f6e8c8');
  x.fillStyle = g; x.fillRect(0, 0, 128, 96);
  x.fillStyle = '#7f9c5a';
  x.beginPath(); x.moveTo(0, 60);
  for (let i = 0; i <= 128; i += 16) x.lineTo(i, 52 + r() * 16);
  x.lineTo(128, 96); x.lineTo(0, 96); x.fill();
  x.fillStyle = '#5c7d3e';
  for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(10 + r() * 108, 50 + r() * 14, 7 + r() * 9, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = '#6a4a2c';
  for (let i = 0; i < 2; i++) x.fillRect(20 + r() * 90, 60, 3, 14);
  return tex(c, false);
}

/** Text/symbol plaque texture: parchment, brass or wood background with symbols and short text. */
export function plaqueTexture(opts: { w?: number; h?: number; bg?: string; ink?: string; symbols?: string[]; arrows?: boolean; lines?: string[]; title?: string; symbolColor?: string }): THREE.CanvasTexture {
  const w = opts.w ?? 256, h = opts.h ?? 128;
  const [c, x] = canvas(w, h);
  x.fillStyle = opts.bg ?? '#efe2c2';
  x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(60,40,20,0.5)';
  x.lineWidth = 4;
  x.strokeRect(4, 4, w - 8, h - 8);
  const ink = opts.ink ?? '#3a2a1a';
  x.fillStyle = ink;
  x.textAlign = 'center';
  let y = 10;
  if (opts.title) {
    x.font = `bold ${Math.round(h / 7)}px Georgia, serif`;
    x.fillText(opts.title, w / 2, (y += h / 6));
  }
  if (opts.symbols?.length) {
    const n = opts.symbols.length;
    const size = Math.min((w - 20) / (n * (opts.arrows ? 1.6 : 1.15)), h * 0.5);
    const total = n * size + (n - 1) * size * (opts.arrows ? 0.6 : 0.15);
    let sx = (w - total) / 2;
    const sy = opts.title ? h * 0.32 : h * 0.18;
    opts.symbols.forEach((s, i) => {
      drawSymbol(x, s, sx, sy, size, opts.symbolColor ? { color: opts.symbolColor, ink } : { ink });
      sx += size;
      if (opts.arrows && i < n - 1) {
        x.strokeStyle = ink; x.lineWidth = 4;
        const ay = sy + size / 2, a0 = sx + size * 0.1, a1 = sx + size * 0.5;
        x.beginPath(); x.moveTo(a0, ay); x.lineTo(a1, ay); x.lineTo(a1 - 8, ay - 7); x.moveTo(a1, ay); x.lineTo(a1 - 8, ay + 7); x.stroke();
        sx += size * 0.6;
      } else sx += size * 0.15;
    });
    y = sy + size + 8;
  }
  if (opts.lines) {
    x.font = `${Math.round(h / 9)}px Georgia, serif`;
    for (const l of opts.lines) x.fillText(l, w / 2, (y += h / 8));
  }
  return tex(c, false);
}

/** Forest map with compass, used for the framed diagram and the notebook. Plan coords → canvas. */
export function forestMapTexture(): THREE.CanvasTexture {
  const [c, x] = canvas(256, 200);
  x.fillStyle = '#efe2c2'; x.fillRect(0, 0, 256, 200);
  x.strokeStyle = '#5a4630'; x.lineWidth = 3; x.strokeRect(6, 6, 244, 188);
  const mx = (px: number) => 14 + (px / 120) * 228;
  const mz = (pz: number) => 186 - (pz / 50) * 150;
  x.fillStyle = '#9db57e';
  const r = mulberry32(9);
  for (let i = 0; i < 90; i++) { x.beginPath(); x.arc(mx(r() * 120), mz(r() * 48), 3 + r() * 3, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = '#c9b48a'; x.fillRect(mx(58), mz(50), 8, 150);
  x.fillStyle = '#b8a07a'; x.fillRect(mx(54), 14, mx(66) - mx(54), 18);
  x.fillStyle = '#3a2a1a'; x.font = '11px Georgia'; x.textAlign = 'center';
  x.fillText('landhuis', mx(60), 27);
  // the organiser's dashed "ochtendwandeling" route with arrowheads: put → schuur → vuur
  const route: [number, number][] = [[96, 26], [78, 33], [52, 30], [28, 26], [20, 18], [14, 12]];
  x.save();
  x.strokeStyle = '#8a2f1a'; x.lineWidth = 2.5; x.setLineDash([6, 5]);
  x.beginPath(); route.forEach(([px, pz], i) => (i ? x.lineTo(mx(px), mz(pz)) : x.moveTo(mx(px), mz(pz)))); x.stroke();
  x.setLineDash([]); x.fillStyle = '#8a2f1a';
  for (const [i, t] of [[1, 0.5], [2, 0.5], [4, 0.6]] as const) {
    const [ax, az] = route[i], [bx, bz] = route[i + 1];
    const px = mx(ax + (bx - ax) * t), pz = mz(az + (bz - az) * t);
    const ang = Math.atan2(mz(bz) - mz(az), mx(bx) - mx(ax));
    x.save(); x.translate(px, pz); x.rotate(ang);
    x.beginPath(); x.moveTo(7, 0); x.lineTo(-5, -5); x.lineTo(-5, 5); x.closePath(); x.fill(); x.restore();
  }
  x.font = 'italic 11px Georgia'; x.textAlign = 'center';
  x.fillText('ochtendwandeling', mx(64), mz(38));
  x.fillText('start', mx(96), mz(26) + 26);
  x.restore();
  drawSymbol(x, 'put', mx(96) - 13, mz(26) - 13, 26);
  drawSymbol(x, 'schuur', mx(28) - 13, mz(26) - 13, 26);
  drawSymbol(x, 'vuur', mx(14) - 13, mz(12) - 13, 26);
  // compass
  x.save(); x.translate(222, 46);
  x.strokeStyle = '#3a2a1a'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(0, -18); x.lineTo(0, 18); x.moveTo(-18, 0); x.lineTo(18, 0); x.stroke();
  x.font = 'bold 11px Georgia';
  x.fillText('N', 0, -21); x.fillText('Z', 0, 30); x.fillText('O', 26, 4); x.fillText('W', -26, 4);
  x.restore();
  return tex(c, false);
}
