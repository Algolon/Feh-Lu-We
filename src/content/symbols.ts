// Symbol vocabulary shared by 3D props (drawn to canvas) and HTML UI (inline SVG).
// Every symbol pairs a distinct SHAPE with a colour, so colour is never the only cue.

export interface SymbolDef {
  id: string;
  name: string; // Dutch, player-facing
  color: string;
  fill: string; // SVG path (viewBox 0 0 100 100), filled
  line?: string; // optional SVG path drawn as stroke only
}

export const SYMBOLS: Record<string, SymbolDef> = {
  // Beat 1: objects on the mantelpiece
  veer: {
    id: 'veer', name: 'Veer', color: '#d9cfb8',
    fill: 'M80 10 C56 16 30 40 24 78 L30 80 C46 62 66 40 80 10 Z',
    line: 'M16 92 L58 44',
  },
  dennenappel: {
    id: 'dennenappel', name: 'Dennenappel', color: '#9a6a3a',
    fill: 'M50 10 C70 26 76 56 64 80 C58 92 42 92 36 80 C24 56 30 26 50 10 Z',
    line: 'M36 38 L64 38 M33 54 L67 54 M36 70 L64 70 M44 26 L56 26',
  },
  kopje: {
    id: 'kopje', name: 'Kopje', color: '#7fa7c9',
    fill: 'M18 36 H72 V58 C72 76 60 84 45 84 C30 84 18 76 18 58 Z',
    line: 'M72 44 C88 44 88 66 70 64 M10 92 H82',
  },
  kaars: {
    id: 'kaars', name: 'Kaars', color: '#efe6c8',
    fill: 'M40 42 H60 V92 H40 Z M50 10 C59 22 59 32 50 36 C41 32 41 22 50 10 Z',
  },
  klok: {
    id: 'klok', name: 'Klok', color: '#c9a35a',
    fill: 'M50 14 A36 36 0 1 0 50.1 14 Z',
    line: 'M50 50 L50 26 M50 50 L66 58',
  },
  ster: {
    id: 'ster', name: 'Ster', color: '#e8c547',
    fill: 'M50 8 L61 38 L93 38 L67 57 L77 89 L50 70 L23 89 L33 57 L7 38 L39 38 Z',
  },
  // Beat 2: forest landmarks
  put: {
    id: 'put', name: 'Put', color: '#8f97a3',
    fill: 'M20 54 H80 V90 H20 Z M12 34 L50 12 L88 34 Z',
    line: 'M28 34 V54 M72 34 V54 M50 34 V46',
  },
  schuur: {
    id: 'schuur', name: 'Schuur', color: '#a8743f',
    fill: 'M14 50 L50 16 L86 50 V90 H14 Z',
    line: 'M42 90 V64 H58 V90',
  },
  vuur: {
    id: 'vuur', name: 'Vuur', color: '#e3742f',
    fill: 'M50 8 C66 30 78 46 72 66 C68 82 58 92 50 92 C38 92 28 82 28 66 C28 52 38 44 42 30 C46 40 50 44 54 46 C56 34 54 20 50 8 Z',
  },
  // Beat 4/5: lantern symbols
  maan: {
    id: 'maan', name: 'Maan', color: '#b9c3e6',
    fill: 'M60 10 A40 40 0 1 0 90 68 A32 32 0 1 1 60 10 Z',
  },
  zon: {
    id: 'zon', name: 'Zon', color: '#f2b233',
    fill: 'M50 30 A20 20 0 1 0 50.1 30 Z',
    line: 'M50 6 V20 M50 80 V94 M6 50 H20 M80 50 H94 M19 19 L29 29 M71 71 L81 81 M19 81 L29 71 M71 29 L81 19',
  },
  blad: {
    id: 'blad', name: 'Blad', color: '#6fae4f',
    fill: 'M50 92 C18 70 16 30 50 8 C84 30 82 70 50 92 Z',
    line: 'M50 92 V22 M50 50 L34 38 M50 66 L66 54',
  },
  // Beat 6: pool tile shapes
  driehoek: { id: 'driehoek', name: 'Driehoek', color: '#e07a3a', fill: 'M50 10 L92 86 H8 Z' },
  cirkel: { id: 'cirkel', name: 'Cirkel', color: '#3f7fd0', fill: 'M50 12 A38 38 0 1 0 50.1 12 Z' },
  ruit: { id: 'ruit', name: 'Ruit', color: '#4fa35a', fill: 'M50 6 L90 50 L50 94 L10 50 Z' },
  golf: {
    id: 'golf', name: 'Golf', color: '#9a64c4',
    fill: 'M6 46 C22 28 36 28 50 44 C64 60 78 60 94 42 V62 C78 80 64 80 50 64 C36 48 22 48 6 66 Z',
  },
  // Story objects
  wapen: {
    id: 'wapen', name: 'Wapen', color: '#c0504d',
    fill: 'M20 12 H80 V48 C80 72 64 86 50 94 C36 86 20 72 20 48 Z',
    line: 'M50 22 V78 M30 42 H70',
  },
  penning: {
    id: 'penning', name: 'Penning', color: '#b98a4e',
    fill: 'M50 8 A42 42 0 1 0 50.1 8 Z',
    line: 'M50 80 V44 M50 44 L34 30 M50 44 L66 30 M50 58 L36 50 M50 58 L64 50',
  },
};

export function symbolSvg(id: string, size = 40, extraClass = ''): string {
  const s = SYMBOLS[id];
  if (!s) return '';
  return `<svg class="sym ${extraClass}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">` +
    `<path d="${s.fill}" fill="${s.color}" stroke="#2b2118" stroke-width="4" stroke-linejoin="round"/>` +
    (s.line ? `<path d="${s.line}" fill="none" stroke="#2b2118" stroke-width="5" stroke-linecap="round"/>` : '') +
    `</svg>`;
}

/** Draw a symbol on a 2D canvas context into the square (x, y, size). Works with Path2D(SVG string). */
export function drawSymbol(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, size: number, opts?: { color?: string; ink?: string }) {
  const s = SYMBOLS[id];
  if (!s || typeof Path2D === 'undefined') return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const f = new Path2D(s.fill);
  ctx.fillStyle = opts?.color ?? s.color;
  ctx.fill(f);
  ctx.strokeStyle = opts?.ink ?? '#2b2118';
  ctx.lineWidth = 4;
  ctx.stroke(f);
  if (s.line) {
    ctx.lineWidth = 5;
    ctx.stroke(new Path2D(s.line));
  }
  ctx.restore();
}
