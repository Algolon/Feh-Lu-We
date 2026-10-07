// DEV-01 drawings as SVG strings. One source for both surfaces: the inspect overlays show them as SVG (crisp on
// a phone), and world.ts rasterises the same SVG into the textures of the props, so what the player reads on the
// table upstairs and what the overlay shows can never drift apart.
//
// Design rules (DEV-01 §4/§5/§10):
// - folios carry no subject word, emblem or room name: a Roman numeral and two pencil sketches only;
// - archive clips and table slots share one shape language (round / pointed / square), nothing else;
// - DS01 uses paper/photo language only (album, letter, photo): no brass, no clip shapes, no numerals.
import type { FolioId, SlotId, Subject } from './ids';

const svg = (w: number, h: number, body: string, label: string) =>
  `<svg class="diagram slice-art" viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const PAPER = '#f4ead2', INK = '#3a2c1e', PENCIL = '#5b5046', BRASS = '#c9a44c', BRASS_D = '#7a5a1a';

/** Clip / slot outline centred at (cx, cy), radius r. The pointed shape is a pointed arch (not a star or leaf). */
export function shapePath(shape: SlotId, cx: number, cy: number, r: number): string {
  if (shape === 'rond') return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  if (shape === 'vierkant') return `<rect x="${cx - r * 0.88}" y="${cy - r * 0.88}" width="${r * 1.76}" height="${r * 1.76}" rx="${r * 0.08}"/>`;
  return `<path d="M${cx} ${cy - r * 1.05} Q${cx + r * 0.95} ${cy - r * 0.1} ${cx + r * 0.8} ${cy + r * 0.85} L${cx - r * 0.8} ${cy + r * 0.85} Q${cx - r * 0.95} ${cy - r * 0.1} ${cx} ${cy - r * 1.05} Z"/>`;
}
export const SHAPE_NAME: Record<SlotId, string> = { rond: 'rond', punt: 'puntig', vierkant: 'vierkant' };

// ------------------------------------------------------------------------------------------------ B01 objects
// Each object is drawn once and reused by the folio sketch (pencil), the room view (colour) and the world texture.
function lensCap(x: number, y: number, s: number, pencil: boolean) {
  const st = pencil ? PENCIL : '#2b2b2b', cord = pencil ? PENCIL : '#3f8a3a';
  return `<g transform="translate(${x},${y}) scale(${s})" stroke-linecap="round">
    <ellipse cx="0" cy="0" rx="34" ry="34" fill="${pencil ? 'none' : '#2f2f2f'}" stroke="${st}" stroke-width="3"/>
    <ellipse cx="0" cy="0" rx="24" ry="24" fill="none" stroke="${pencil ? PENCIL : '#555'}" stroke-width="2"/>
    <path d="M30 14 C60 30 52 62 86 66 C110 69 118 52 132 60" fill="none" stroke="${cord}" stroke-width="${pencil ? 2.5 : 4}"/>
    ${pencil ? `<text x="70" y="96" font-size="15" font-family="Georgia" fill="${PENCIL}" font-style="italic">groen</text>` : ''}
  </g>`;
}
/** Small star chart: the W-shaped group is circled in red ink. `circled=false` is the plain wall chart. */
function starChart(x: number, y: number, s: number, pencil: boolean, circled = true) {
  const W = [[-48, -10], [-24, 14], [0, -6], [24, 16], [48, -12]];
  const other = [[-70, -40], [60, 34], [-58, 40], [10, 40], [70, -36], [-20, -40], [36, -38]];
  const dot = (p: number[], r: number) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${pencil ? PENCIL : '#f4ecd8'}"/>`;
  return `<g transform="translate(${x},${y}) scale(${s})">
    <rect x="-90" y="-58" width="180" height="116" rx="4" fill="${pencil ? 'none' : '#1c2a44'}" stroke="${pencil ? PENCIL : '#c9a44c'}" stroke-width="3"/>
    ${other.map((p) => dot(p, 2.4)).join('')}${W.map((p) => dot(p, 4)).join('')}
    <polyline points="${W.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${pencil ? PENCIL : 'rgba(244,236,216,.55)'}" stroke-width="1.5"/>
    ${circled ? `<ellipse cx="0" cy="2" rx="62" ry="30" fill="none" stroke="#c0392b" stroke-width="${pencil ? 2.5 : 3.5}" transform="rotate(-4)"/>` : ''}
    ${pencil && circled ? `<text x="54" y="-26" font-size="15" font-family="Georgia" fill="#c0392b" font-style="italic">rood</text>` : ''}
  </g>`;
}
/** Pressed fern frond whose tip is torn off (ragged end, missing pinnae). */
function fern(x: number, y: number, s: number, pencil: boolean) {
  const leaf = pencil ? 'none' : '#4f7a3a', st = pencil ? PENCIL : '#2f4a1a';
  let pinnae = '';
  for (let i = 0; i < 8; i++) {
    const yy = 50 - i * 12, len = 30 - i * 2.2;
    pinnae += `<path d="M0 ${yy} q${-len * 0.6} -8 ${-len} -2 q${len * 0.5} 6 ${len} 8 Z" fill="${leaf}" stroke="${st}" stroke-width="1.5"/>`;
    pinnae += `<path d="M0 ${yy} q${len * 0.6} -8 ${len} -2 q${-len * 0.5} 6 ${-len} 8 Z" fill="${leaf}" stroke="${st}" stroke-width="1.5"/>`;
  }
  return `<g transform="translate(${x},${y}) scale(${s})">
    ${pencil ? '' : '<rect x="-56" y="-66" width="112" height="140" fill="#f2e8d2" stroke="#8a6a3a" stroke-width="4"/>'}
    <line x1="0" y1="66" x2="0" y2="-44" stroke="${st}" stroke-width="2.5"/>${pinnae}
    <path d="M-6 -44 l4 -7 l3 5 l4 -8 l2 9" fill="none" stroke="${st}" stroke-width="2"/>
    ${pencil ? `<path d="M10 -52 q18 -10 26 4" fill="none" stroke="${PENCIL}" stroke-width="1.5" stroke-dasharray="3 3"/><text x="30" y="-58" font-size="14" font-family="Georgia" fill="${PENCIL}" font-style="italic">afgescheurd</text>` : ''}
  </g>`;
}
/** Terracotta pot with exactly one blue band. */
function pot(x: number, y: number, s: number, pencil: boolean) {
  const body = pencil ? 'none' : '#c9774a', st = pencil ? PENCIL : '#7a4a2a';
  return `<g transform="translate(${x},${y}) scale(${s})">
    <path d="M-34 -30 L34 -30 L26 40 L-26 40 Z" fill="${body}" stroke="${st}" stroke-width="3"/>
    <rect x="-38" y="-40" width="76" height="12" fill="${body}" stroke="${st}" stroke-width="3"/>
    <path d="M-31.5 -6 L31.5 -6 L30.2 6 L-30.2 6 Z" fill="${pencil ? 'none' : '#2f5fa8'}" stroke="${pencil ? PENCIL : '#1f3f78'}" stroke-width="${pencil ? 2 : 1.5}" ${pencil ? 'stroke-dasharray="2 0"' : ''}/>
    ${pencil ? `<text x="40" y="6" font-size="15" font-family="Georgia" fill="${PENCIL}" font-style="italic">blauw</text>` : ''}
  </g>`;
}
/** Pocket compass with a cracked glass. */
function compass(x: number, y: number, s: number, pencil: boolean) {
  const st = pencil ? PENCIL : '#6b4a1a';
  return `<g transform="translate(${x},${y}) scale(${s})">
    <circle r="46" fill="${pencil ? 'none' : '#c9a44c'}" stroke="${st}" stroke-width="3"/>
    <circle r="38" fill="${pencil ? 'none' : '#f4ecd8'}" stroke="${st}" stroke-width="2"/>
    <rect x="-7" y="-58" width="14" height="12" rx="3" fill="${pencil ? 'none' : '#c9a44c'}" stroke="${st}" stroke-width="2"/>
    <path d="M0 -30 L7 0 L0 30 L-7 0 Z" fill="${pencil ? 'none' : '#c0392b'}" stroke="${st}" stroke-width="1.5"/>
    <path d="M-30 -18 L-8 -4 L-14 10 L12 22 L28 30" fill="none" stroke="${pencil ? PENCIL : '#222'}" stroke-width="2"/>
  </g>`;
}
/** Train ticket with one round punched hole. */
function ticket(x: number, y: number, s: number, pencil: boolean) {
  const st = pencil ? PENCIL : '#7a5a3a';
  return `<g transform="translate(${x},${y}) scale(${s})">
    <rect x="-62" y="-32" width="124" height="64" rx="4" fill="${pencil ? 'none' : '#e8d9a8'}" stroke="${st}" stroke-width="3"/>
    <line x1="-48" y1="-14" x2="20" y2="-14" stroke="${st}" stroke-width="3"/><line x1="-48" y1="0" x2="8" y2="0" stroke="${st}" stroke-width="3"/>
    <line x1="-48" y1="14" x2="26" y2="14" stroke="${st}" stroke-width="3"/>
    <circle cx="42" cy="0" r="9" fill="${pencil ? '#fff' : '#3a2c1e'}" stroke="${st}" stroke-width="2"/>
  </g>`;
}

const PAIR: Record<Subject, (pencil: boolean) => string> = {
  sterren: (p) => lensCap(86, 118, p ? 0.9 : 1, p) + starChart(236, 112, p ? 0.78 : 0.85, p),
  planten: (p) => fern(92, 118, p ? 0.95 : 0.9, p) + pot(232, 124, p ? 1.05 : 1.1, p),
  reizen: (p) => compass(92, 120, p ? 1 : 1.05, p) + ticket(232, 120, p ? 0.95 : 1, p),
};
const FOLIO_SUBJECT: Record<FolioId, Subject> = { I: 'sterren', II: 'reizen', III: 'planten' };
export const FOLIO_COLOR: Record<FolioId, string> = { I: '#7a2f2a', II: '#a8803a', III: '#6b6f72' };

/** Inside of a folio: two pencil sketches on ruled paper and the numeral; no words naming a subject or room. */
export function folioPage(f: FolioId): string {
  let rules = '';
  for (let y = 40; y < 230; y += 18) rules += `<line x1="14" y1="${y}" x2="306" y2="${y}" stroke="#d8cba8" stroke-width="1"/>`;
  return svg(320, 240, `<rect width="320" height="240" fill="${PAPER}"/>${rules}
    <rect x="3" y="3" width="314" height="234" fill="none" stroke="${FOLIO_COLOR[f]}" stroke-width="6"/>
    <text x="300" y="30" font-size="22" font-family="Georgia" text-anchor="end" fill="${INK}">${f}</text>
    ${PAIR[FOLIO_SUBJECT[f]](true)}`, `Map ${f}: twee schetsjes`);
}
/** Closed folio cover (world + panel thumbnails). */
export function folioCover(f: FolioId): string {
  return svg(200, 260, `<rect width="200" height="260" rx="6" fill="${FOLIO_COLOR[f]}"/>
    <rect x="12" y="12" width="176" height="236" rx="4" fill="none" stroke="rgba(255,240,210,.55)" stroke-width="3"/>
    <rect x="60" y="70" width="80" height="54" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>
    <text x="100" y="108" font-size="30" font-family="Georgia" text-anchor="middle" fill="${INK}">${f}</text>
    <line x1="100" y1="150" x2="100" y2="250" stroke="#e8dcc0" stroke-width="3"/>`, `Map ${f}`);
}
/** The two objects as they actually lie upstairs (colour), for the room inspect overlay. */
export function pairView(sub: Subject): string {
  return svg(320, 240, `<rect width="320" height="240" fill="#8a6440"/><rect width="320" height="24" fill="#9a7450"/>
    ${PAIR[sub](false)}`, 'Twee voorwerpen op een tafeltje');
}
/** Index card held by a brass archive clip of one shape. */
export function clipCard(shape: SlotId): string {
  let rules = '';
  for (let y = 132; y < 196; y += 16) rules += `<line x1="22" y1="${y}" x2="218" y2="${y}" stroke="#c8d4e0" stroke-width="1.2"/>`;
  return svg(240, 210, `<rect x="10" y="40" width="220" height="160" rx="3" fill="#fbf7ec" stroke="#b8a888" stroke-width="2"/>${rules}
    <line x1="22" y1="116" x2="218" y2="116" stroke="#d98080" stroke-width="1.5"/>
    <g fill="${BRASS}" stroke="${BRASS_D}" stroke-width="5">${shapePath(shape, 120, 58, 48)}</g>
    <g fill="none" stroke="#fff3c8" stroke-width="3" opacity=".7">${shapePath(shape, 120, 58, 34)}</g>`, `Archiefclip: ${SHAPE_NAME[shape]}`);
}
/** Engraved slot mark on the library table. */
export function slotMark(shape: SlotId): string {
  return svg(160, 160, `<rect width="160" height="160" rx="8" fill="#5a3a22"/><rect x="8" y="8" width="144" height="144" rx="6" fill="#6b4a2c" stroke="#3a2412" stroke-width="3"/>
    <g fill="#3a2412" stroke="${BRASS}" stroke-width="5">${shapePath(shape, 80, 82, 46)}</g>`, `Vak: ${SHAPE_NAME[shape]}`);
}
/** Plain wall star chart (no circle) — the decorative chart that was already in the star room. */
export const wallStarChart = () => svg(200, 140, starChart(100, 70, 1.05, false, false), 'Sterrenkaart aan de muur');
/** The table-top pieces as world textures (colour versions of the folio sketches). */
export const objectArt = {
  chart: () => svg(200, 140, starChart(100, 70, 1.05, false, true), 'Sterrenkaart'),
  fern: () => svg(120, 150, fern(60, 76, 1, false), 'Geperst varenblad'),
  compass: () => svg(120, 130, compass(60, 68, 1.15, false), 'Kompas'),
  ticket: () => svg(140, 80, ticket(70, 40, 1.05, false), 'Treinkaartje'),
};

// ------------------------------------------------------------------------------------------------ DS01 (paper only)
const scribble = (x: number, y: number, w: number, n: number, gap = 14) => {
  let o = '';
  for (let i = 0; i < n; i++) o += `<path d="M${x} ${y + i * gap} q${w * 0.25} -3 ${w * 0.5} 0 t${w * (0.38 + ((i * 37) % 10) / 80)} 0" fill="none" stroke="#3a3a5a" stroke-width="1.6"/>`;
  return o;
};
export function noteCard(): string {
  return svg(220, 150, `<rect x="6" y="6" width="208" height="138" fill="#fbf3dc" stroke="#c9b48a" stroke-width="2" transform="rotate(-2 110 75)"/>${scribble(24, 38, 168, 6, 16)}`, 'Notitie');
}
export function albumSpread(): string {
  const photo = (x: number, y: number, fill: string) => `<rect x="${x}" y="${y}" width="74" height="54" fill="${fill}" stroke="#6b5a48" stroke-width="1.5"/>`;
  const corners = (x: number, y: number) => [[x, y, 0], [x + 74, y, 90], [x + 74, y + 54, 180], [x, y + 54, 270]].map(([cx, cy, r]) => `<path d="M${cx} ${cy} l12 0 l-12 12 Z" fill="#1d1a16" transform="rotate(${r} ${cx} ${cy})"/>`).join('');
  return svg(320, 200, `<rect width="320" height="200" rx="6" fill="#4a3426"/><rect x="10" y="10" width="146" height="180" fill="#2f2b26"/><rect x="164" y="10" width="146" height="180" fill="#2f2b26"/>
    ${photo(22, 24, '#a89a82')}${photo(22, 104, '#9a8c72')}${photo(176, 24, '#b0a088')}
    <rect x="176" y="104" width="74" height="54" fill="none" stroke="#8a8070" stroke-width="1" stroke-dasharray="3 3"/>${corners(176, 104)}
    <path d="M178 172 q20 -4 40 0 t36 0" fill="none" stroke="#d8d0c0" stroke-width="1.5"/>`, 'Album Weekendhuizen, opengeslagen');
}
export function letterSheet(): string {
  return svg(200, 240, `<rect x="8" y="8" width="184" height="224" fill="#f8f2e2" stroke="#c9b48a" stroke-width="2"/><line x1="8" y1="88" x2="192" y2="88" stroke="#e0d6c0" stroke-width="1.5"/>${scribble(22, 30, 150, 9, 20)}`, 'Brief');
}
export function photoFront(): string {
  return svg(240, 180, `<rect width="240" height="180" fill="#f2ede0"/><rect x="12" y="12" width="216" height="156" fill="#8f8a7c"/>
    <rect x="12" y="104" width="216" height="64" fill="#6f7f86"/><path d="M12 104 q60 -10 120 -2 t96 0 L228 104 Z" fill="#7a8a6a"/>
    <rect x="70" y="72" width="70" height="34" fill="#c8c0ae"/><path d="M64 74 L105 52 L146 74 Z" fill="#5a5048"/>
    <g stroke="#2f2a26" stroke-width="2" fill="none"><circle cx="152" cy="98" r="7"/><circle cx="168" cy="98" r="7"/><circle cx="182" cy="99" r="7"/><circle cx="198" cy="99" r="7"/></g>
    <path d="M12 12 q80 14 216 4" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="10"/>`, 'Foto: een huisje aan het water');
}
export function photoBack(): string {
  return svg(240, 180, `<rect width="240" height="180" fill="#ece4d0"/><circle cx="198" cy="140" r="30" fill="none" stroke="rgba(150,110,60,.35)" stroke-width="7"/>${scribble(24, 50, 170, 3, 22)}`, 'Achterkant van de foto');
}
export function maquetteView(): string {
  return svg(260, 170, `<rect width="260" height="170" fill="#7f9a5a"/><rect x="20" y="20" width="220" height="130" fill="#93ad6a" stroke="#5a4630" stroke-width="3"/>
    <rect x="90" y="56" width="80" height="52" fill="#efe2c4" stroke="#3a2a1a" stroke-width="2"/><rect x="170" y="70" width="18" height="38" fill="#e6d6b4" stroke="#3a2a1a" stroke-width="2"/>
    <ellipse cx="54" cy="58" rx="16" ry="12" fill="#2f6f78"/><rect x="38" y="76" width="22" height="16" fill="#fbf6ec" stroke="#3a2a1a" stroke-width="1.5"/>
    <path d="M130 108 L130 150" stroke="#e2d2b0" stroke-width="6"/>`, 'Maquette van het landgoed');
}
