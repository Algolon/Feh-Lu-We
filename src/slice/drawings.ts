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
const PENCIL = '#5b5046', BRASS = '#c9a44c', BRASS_D = '#7a5a1a';

/** Clip / slot outline centred at (cx, cy), radius r. The pointed shape is a pointed arch (not a star or leaf). */
export function shapePath(shape: SlotId, cx: number, cy: number, r: number): string {
  if (shape === 'rond') return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  if (shape === 'vierkant') return `<rect x="${cx - r * 0.88}" y="${cy - r * 0.88}" width="${r * 1.76}" height="${r * 1.76}" rx="${r * 0.08}"/>`;
  return `<path d="M${cx} ${cy - r * 1.05} Q${cx + r * 0.95} ${cy - r * 0.1} ${cx + r * 0.8} ${cy + r * 0.85} L${cx - r * 0.8} ${cy + r * 0.85} Q${cx - r * 0.95} ${cy - r * 0.1} ${cx} ${cy - r * 1.05} Z"/>`;
}
export const SHAPE_NAME: Record<SlotId, string> = { rond: 'rond', punt: 'puntig', vierkant: 'vierkant' };

// ------------------------------------------------------------------------------------------------ B01 objects
// DEV-01R canon (Puzzle Design v0.2 as quoted in the DEV-01R brief):
//   EB.folio.stars   telescope on a fork mount with two round screw heads + a notebook with three holes
//   EB.folio.plants  fern with a broad diagonal repair strip + scissors with one angular and one round grip
//   EB.folio.travel  suitcase with two parallel straps and a square middle patch + a label with its top-right corner cut off
// Each object is drawn once and reused by the sheet sketch (pencil), the room view (colour) and the world texture.
const st = (pencil: boolean, col: string) => (pencil ? PENCIL : col);
/** Small telescope on a fork mount; the two round screw heads sit on the fork pivots. */
function telescopeFork(x: number, y: number, s: number, pencil: boolean) {
  const fill = (c: string) => (pencil ? 'none' : c);
  return `<g transform="translate(${x},${y}) scale(${s})" stroke-linejoin="round">
    <ellipse cx="0" cy="62" rx="40" ry="9" fill="${fill('#5a3a22')}" stroke="${st(pencil, '#3a2412')}" stroke-width="3"/>
    <rect x="-6" y="30" width="12" height="30" fill="${fill('#6b4426')}" stroke="${st(pencil, '#3a2412')}" stroke-width="3"/>
    <path d="M-30 32 L-30 -2 M30 32 L30 -2 M-30 32 L30 32" fill="none" stroke="${st(pencil, '#3a2412')}" stroke-width="6" stroke-linecap="round"/>
    <g transform="rotate(-24)"><rect x="-62" y="-14" width="124" height="26" rx="5" fill="${fill('#b8892f')}" stroke="${st(pencil, '#6b4a1a')}" stroke-width="3"/>
      <rect x="54" y="-18" width="16" height="34" rx="3" fill="${fill('#8a6a2a')}" stroke="${st(pencil, '#6b4a1a')}" stroke-width="3"/></g>
    <circle cx="-30" cy="-2" r="8" fill="${fill('#d9b860')}" stroke="${st(pencil, '#3a2412')}" stroke-width="3"/>
    <circle cx="30" cy="-2" r="8" fill="${fill('#d9b860')}" stroke="${st(pencil, '#3a2412')}" stroke-width="3"/>
    <path d="M-34 -2 h8 M26 -2 h8" stroke="${st(pencil, '#3a2412')}" stroke-width="2"/>
  </g>`;
}
/** Notebook (schrift) with exactly three punched holes along its spine edge. */
function notebook3(x: number, y: number, s: number, pencil: boolean) {
  let lines = '';
  for (let i = 0; i < 6; i++) lines += `<line x1="-22" y1="${-34 + i * 13}" x2="40" y2="${-34 + i * 13}" stroke="${pencil ? '#b8ad98' : '#9fb4c8'}" stroke-width="1.5"/>`;
  return `<g transform="translate(${x},${y}) scale(${s})">
    <rect x="-46" y="-56" width="96" height="116" rx="3" fill="${pencil ? 'none' : '#e9e2cc'}" stroke="${st(pencil, '#3f5a6a')}" stroke-width="3"/>
    <rect x="-46" y="-56" width="12" height="116" fill="${pencil ? 'none' : '#3f5a6a'}" stroke="${st(pencil, '#3f5a6a')}" stroke-width="2"/>
    ${lines}${[-32, 2, 36].map((cy) => `<circle cx="-28" cy="${cy}" r="6" fill="${pencil ? '#fff' : '#2b2118'}" stroke="${st(pencil, '#2b2118')}" stroke-width="2"/>`).join('')}
  </g>`;
}
/** Pressed fern frond, crossed by one broad diagonal repair strip. */
function fernRepair(x: number, y: number, s: number, pencil: boolean) {
  const leaf = pencil ? 'none' : '#4f7a3a', stc = st(pencil, '#2f4a1a');
  let pinnae = '';
  for (let i = 0; i < 9; i++) {
    const yy = 54 - i * 12, len = 32 - i * 2.4;
    pinnae += `<path d="M0 ${yy} q${-len * 0.6} -8 ${-len} -2 q${len * 0.5} 6 ${len} 8 Z" fill="${leaf}" stroke="${stc}" stroke-width="1.5"/>`;
    pinnae += `<path d="M0 ${yy} q${len * 0.6} -8 ${len} -2 q${-len * 0.5} 6 ${-len} 8 Z" fill="${leaf}" stroke="${stc}" stroke-width="1.5"/>`;
  }
  return `<g transform="translate(${x},${y}) scale(${s})">
    ${pencil ? '' : '<rect x="-60" y="-74" width="120" height="152" fill="#f2e8d2" stroke="#8a6a3a" stroke-width="4"/>'}
    <line x1="0" y1="70" x2="0" y2="-58" stroke="${stc}" stroke-width="2.5"/>${pinnae}
    <rect x="-70" y="-13" width="140" height="26" transform="rotate(-38)" fill="${pencil ? 'none' : 'rgba(236,220,170,.85)'}" stroke="${st(pencil, '#a8905a')}" stroke-width="2.5" ${pencil ? 'stroke-dasharray="6 4"' : ''}/>
  </g>`;
}
/** Scissors: one angular (squared) grip and one round grip. */
function scissors(x: number, y: number, s: number, pencil: boolean) {
  const metal = pencil ? 'none' : '#b8c0c8', stc = st(pencil, '#4a4f55');
  return `<g transform="translate(${x},${y}) scale(${s}) rotate(-90)">
    <path d="M-6 0 L60 -10 L64 -6 L2 6 Z" fill="${metal}" stroke="${stc}" stroke-width="2.5"/>
    <path d="M-6 0 L60 10 L64 6 L2 -6 Z" fill="${metal}" stroke="${stc}" stroke-width="2.5"/>
    <circle cx="0" cy="0" r="4" fill="${pencil ? '#fff' : '#4a4f55'}" stroke="${stc}" stroke-width="2"/>
    <path d="M-6 -2 L-24 -10" stroke="${stc}" stroke-width="5"/><path d="M-6 2 L-24 10" stroke="${stc}" stroke-width="5"/>
    <rect x="-58" y="-34" width="34" height="26" fill="none" stroke="${st(pencil, '#7a3a2a')}" stroke-width="7" stroke-linejoin="miter"/>
    <circle cx="-41" cy="22" r="15" fill="none" stroke="${st(pencil, '#7a3a2a')}" stroke-width="7"/>
  </g>`;
}
/** Suitcase with two parallel straps and a square patch in the middle (between the straps). */
function suitcase2(x: number, y: number, s: number, pencil: boolean) {
  const fill = (c: string) => (pencil ? 'none' : c), stc = st(pencil, '#4a2f1a');
  return `<g transform="translate(${x},${y}) scale(${s})">
    <path d="M-16 -44 v-12 h32 v12" fill="none" stroke="${stc}" stroke-width="5"/>
    <rect x="-66" y="-44" width="132" height="92" rx="8" fill="${fill('#8a5a33')}" stroke="${stc}" stroke-width="3"/>
    <rect x="-42" y="-44" width="12" height="92" fill="${fill('#4a2f1a')}" stroke="${stc}" stroke-width="2"/>
    <rect x="30" y="-44" width="12" height="92" fill="${fill('#4a2f1a')}" stroke="${stc}" stroke-width="2"/>
    <rect x="-14" y="-12" width="28" height="28" fill="${fill('#c9a46a')}" stroke="${stc}" stroke-width="2.5"/>
  </g>`;
}
/** Luggage label whose top-right corner is cut off, with an eyelet and a string. */
function labelCut(x: number, y: number, s: number, pencil: boolean) {
  const stc = st(pencil, '#7a5a3a');
  return `<g transform="translate(${x},${y}) scale(${s})">
    <path d="M-50 -34 L24 -34 L50 -8 L50 34 L-50 34 Z" fill="${pencil ? 'none' : '#efe2b8'}" stroke="${stc}" stroke-width="3"/>
    <circle cx="-36" cy="-20" r="6" fill="${pencil ? '#fff' : '#8a6a3a'}" stroke="${stc}" stroke-width="2"/>
    <path d="M-36 -20 C-60 -40 -70 -10 -84 -24" fill="none" stroke="${stc}" stroke-width="2"/>
    <line x1="-26" y1="2" x2="30" y2="2" stroke="${stc}" stroke-width="2.5"/><line x1="-26" y1="16" x2="18" y2="16" stroke="${stc}" stroke-width="2.5"/>
  </g>`;
}

const PAIR: Record<Subject, (pencil: boolean) => string> = {
  sterren: (p) => telescopeFork(94, 112, p ? 1 : 1.05, p) + notebook3(240, 118, p ? 0.95 : 1, p),
  planten: (p) => fernRepair(90, 118, p ? 0.9 : 0.85, p) + scissors(236, 116, p ? 1.15 : 1.2, p),
  reizen: (p) => suitcase2(98, 120, p ? 0.95 : 1, p) + labelCut(242, 120, p ? 0.95 : 1, p),
};
const FOLIO_SUBJECT: Record<FolioId, Subject> = { stars: 'sterren', plants: 'planten', travel: 'reizen' };

/** A loose drawing sheet (los tekenblad): two pencil sketches on plain drawing paper; no numeral, no words. */
export function folioPage(f: FolioId): string {
  return svg(320, 240, `<path d="M4 6 L314 2 L316 236 L6 234 Z" fill="#f7f1e2" stroke="#cbbf9f" stroke-width="2"/>
    <path d="M300 2 L316 2 L316 18 Z" fill="#e6dcc4"/>
    ${PAIR[FOLIO_SUBJECT[f]](true)}`, 'Los tekenblad met twee schetsjes');
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
/** Table-top pieces as world textures (colour versions of the sketches; the telescope and suitcase are 3D). */
export const objectArt = {
  notebook: () => svg(120, 140, notebook3(62, 70, 1.05, false), 'Schrift met drie gaten'),
  fern: () => svg(140, 170, fernRepair(70, 86, 1, false), 'Geperst varenblad met reparatiestrook'),
  scissors: () => svg(120, 160, scissors(60, 84, 1.05, false), 'Schaar'),
  label: () => svg(200, 100, labelCut(112, 50, 1.1, false), 'Bagagelabel'),
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
