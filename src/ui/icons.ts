// Pictorial, full-colour SVG icons for the HUD, bag, held-item chip and action button. They restore the
// recognisable picture vocabulary of the first prototype (envelope, torch, matches, notebook, keys, bag, bulb)
// but are drawn as SVG so they look identical on Android and iOS (emoji differ per platform).
// Keys are told apart by their bow and tag, never by colour alone.

const INK = '#2b2118';
type P = [d: string, fill?: string, stroke?: string, w?: number];
const circ = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

/** A key with a given bow shape, metal colour and tag; shared so all keys read as keys. */
function key(metal: string, bow: 'ring' | 'trefoil' | 'square', tag: P[], big = false): P[] {
  const s = big ? 1 : 0.85;
  const bowD = bow === 'ring' ? circ(17, 30, 9 * s)
    : bow === 'square' ? `M${17 - 8 * s} ${30 - 8 * s} h${16 * s} v${16 * s} h${-16 * s} Z`
      : `${circ(17, 23, 6)}${circ(11, 34, 6)}${circ(23, 34, 6)}`;
  return [
    ...tag,
    [bowD, 'none', INK, 7],
    [bowD, 'none', metal, 3.5],
    ['M26 30 H56', 'none', INK, 8],
    ['M26 30 H56', 'none', metal, 4],
    ['M47 30 V41 H51 V36 H55 V41 H58 V30', metal, INK, 2],
  ];
}

const ICONS: Record<string, P[]> = {
  // ---------------------------------------------------------------- HUD
  menu: [['M14 20 H50 M14 32 H50 M14 44 H50', 'none', '#f5ead2', 6]],
  hint: [
    [circ(32, 26, 21), '#ffe9a0', 'none'],
    ['M32 8 C42 8 49 15 49 25 C49 32 45 36 42 40 C40 43 40 46 40 48 H24 C24 46 24 43 22 40 C19 36 15 32 15 25 C15 15 22 8 32 8 Z', '#f6d24a', INK, 2.5],
    ['M27 34 C27 28 37 28 37 34 M32 34 V47', 'none', '#b8862a', 2.5],
    ['M24 50 H40 V54 H24 Z M26 56 H38 V59 H26 Z', '#9aa0a8', INK, 2],
  ],
  notes: [
    ['M14 6 H50 C53 6 54 8 54 10 V56 C54 58 53 60 50 60 H14 Z', '#5a7a3a', INK, 2.5],
    ['M50 10 V56', 'none', '#efe6d0', 3],
    ['M14 6 V60', 'none', INK, 4],
    ['M22 15 H44 V27 H22 Z', '#efe6d0', INK, 1.5],
    ['M25 20 H41 M25 24 H36', 'none', '#7a6a50', 1.5],
    ['M44 6 V60', 'none', '#2b2118', 2],
  ],
  bag: [
    ['M20 18 C20 8 44 8 44 18', 'none', INK, 4],
    ['M12 22 C12 18 15 16 18 16 H46 C49 16 52 18 52 22 V54 C52 58 49 60 46 60 H18 C15 60 12 58 12 54 Z', '#b5603a', INK, 2.5],
    ['M12 22 C12 18 15 16 18 16 H46 C49 16 52 18 52 22 V34 C44 38 20 38 12 34 Z', '#8e4628', INK, 2.5],
    ['M30 34 H34 V40 H30 Z', '#e8c547', INK, 1.5],
    ['M20 44 H44 V56 H20 Z', '#a24f30', INK, 2],
  ],
  map: [
    ['M6 14 L22 8 L42 14 L58 8 V50 L42 56 L22 50 L6 56 Z', '#efe2c2', INK, 2.5],
    ['M22 8 V50 M42 14 V56', 'none', '#b8a07a', 2],
    ['M12 40 C20 30 30 44 38 30 C44 22 50 26 52 20', 'none', '#b8322a', 2.5],
    [circ(52, 20, 3), '#b8322a'],
  ],
  close: [['M18 18 L46 46 M46 18 L18 46', 'none', '#f5ead2', 6]],
  // ---------------------------------------------------------------- items
  invitation: [
    ['M6 16 H58 V50 H6 Z', '#f6eed8', INK, 2.5],
    ['M6 50 L26 32 M58 50 L38 32', 'none', '#cbb894', 2],
    ['M6 16 L32 36 L58 16', '#ece0c0', INK, 2.5],
    [circ(32, 36, 7), '#b8322a', INK, 2],
    ['M28 36 H36 M32 32 V40', 'none', '#f0b0a0', 2],
  ],
  torch: [
    ['M46 22 L63 10 V54 L46 42 Z', '#ffe680'],
    ['M10 25 H34 L40 22 V42 L34 39 H10 C7 39 5 37 5 35 V29 C5 27 7 25 10 25 Z', '#3d4048', INK, 2.5],
    ['M40 19 H47 V45 H40 Z', '#c9ccd2', INK, 2.5],
    ['M47 22 V42', 'none', '#fff6c0', 3],
    ['M17 25 V21 H25 V25', '#d9a441', INK, 2],
    ['M12 29 H30', 'none', '#6a6e78', 2],
  ],
  matches: [
    ['M20 32 L35 10 M28 32 L43 12 M36 32 L51 15', 'none', INK, 5.5],
    ['M20 32 L35 10 M28 32 L43 12 M36 32 L51 15', 'none', '#ecd09a', 3],
    [circ(35, 10, 3.6) + circ(43, 12, 3.6), '#d8322a', INK, 1.5],
    [circ(51, 15, 3.6), '#d8322a', INK, 1.5],
    ['M53 1 C59 6 59 10 54 12 C50 11 49 6 53 1 Z', '#f2a23a', INK, 1.2],
    ['M14 28 H54 V36 H14 Z', '#e9d9b0', INK, 2.5],
    ['M6 36 H48 V56 H6 Z', '#c4553d', INK, 2.5],
    ['M6 36 H48 V40 H6 Z', '#5a3a22'],
    ['M18 44 H36 V52 H18 Z', '#f2e6c8', INK, 1.5],
    ['M23 48 H31', 'none', '#c4553d', 2],
  ],
  notebook: [
    ['M14 6 H50 C53 6 54 8 54 10 V56 C54 58 53 60 50 60 H14 Z', '#5a7a3a', INK, 2.5],
    ['M50 10 V56', 'none', '#efe6d0', 3],
    ['M14 6 V60', 'none', INK, 4],
    ['M22 15 H44 V27 H22 Z', '#efe6d0', INK, 1.5],
    ['M25 20 H41 M25 24 H36', 'none', '#7a6a50', 1.5],
    ['M44 6 V60', 'none', '#2b2118', 2],
  ],
  // big gold front-door key with a red label (matches the key in the home drawer)
  frontKey: key('#d9b14a', 'trefoil', [['M58 44 L60 52', 'none', INK, 1.5], ['M54 50 H64 V60 H54 Z', '#c4553d', INK, 2]], true),
  // small brass key with a white paper tag (studeerkamer)
  studyKey: key('#c9a44c', 'ring', [['M10 38 L6 48', 'none', INK, 1.5], ['M1 46 H13 V58 H1 Z', '#f6eed8', INK, 2], ['M4 51 H10 M4 54 H9', 'none', '#7a6a50', 1.5]]),
  // rusty key on a wooden house-shaped tag (schuur)
  shedKey: key('#a0603a', 'square', [['M10 38 L8 46', 'none', INK, 1.5], ['M2 52 L8 45 L14 52 V60 H2 Z', '#b8834e', INK, 2]]),
  cottageKey: key('#c9a44c', 'ring', [['M10 38 L8 46', 'none', INK, 1.5], ['M2 46 H14 V58 H2 Z', '#d0643a', INK, 2]]),
  kindling: [
    ['M6 24 L56 34 M6 32 L58 30 M8 40 L56 24 M6 36 L58 38', 'none', INK, 7],
    ['M6 24 L56 34 M6 32 L58 30 M8 40 L56 24 M6 36 L58 38', 'none', '#c89a62', 4],
    ['M28 22 V44 M33 22 V44', 'none', '#c4282a', 3],
  ],
  token: [
    [circ(32, 32, 24), '#b98a4e', INK, 2.5],
    [circ(32, 32, 18), 'none', '#8a5a2a', 1.5],
    ['M32 48 V26 M32 26 L23 18 M32 26 L41 18 M32 36 L24 30 M32 36 L40 30', 'none', '#5a3a1a', 3],
  ],
  crank: [
    ['M14 50 V18 H42', 'none', INK, 8],
    ['M14 50 V18 H42', 'none', '#6a6e78', 4],
    ['M42 12 V24 H58 V12 Z', '#a8743f', INK, 2.5],
    [circ(14, 52, 5), '#6a6e78', INK, 2],
  ],
  crest: [
    ['M14 8 H50 V30 C50 46 40 54 32 58 C24 54 14 46 14 30 Z', '#c0504d', INK, 2.5],
    ['M32 14 V50 M20 28 H44', 'none', '#f2e6c8', 4],
  ],
  // estate register: dark red ledger with three blind seal impressions on the cover
  ledger: [
    ['M12 6 H52 V58 H12 Z', '#6a2a22', INK, 2.5],
    ['M16 6 V58', 'none', '#3a160f', 3],
    [circ(32, 20, 6), '#8a4a3a', INK, 1.5],
    ['M26 30 H38 V42 H26 Z', '#8a4a3a', INK, 1.5],
    ['M32 46 C38 49 37 54 32 56 C27 54 26 49 32 46 Z', '#8a4a3a', INK, 1.5],
  ],
  // forest-walk journal: thin green notebook with a little hill sketched on it
  journal: [
    ['M12 8 H50 C52 8 53 9 53 11 V56 H12 Z', '#4f6a3a', INK, 2.5],
    ['M18 14 H47 V50 H18 Z', '#efe6d0', INK, 1.5],
    ['M20 44 C26 26 40 26 45 44 Z', '#a9c47a', INK, 1.5],
    ['M30 44 V37 C30 34 35 34 35 37 V44', '#5a3a22', INK, 1.2],
  ],
  // conservatory key with a green glass drop
  consKey: key('#d9b14a', 'ring', [['M10 38 L8 46', 'none', INK, 1.5], ['M8 46 C14 50 14 58 8 60 C2 58 2 50 8 46 Z', '#5fbf8f', INK, 2]]),
  // the three seals: round terracotta (table), square blue (book), green leaf (tree)
  tableSeal: [
    [circ(32, 32, 24), '#c4553d', INK, 2.5],
    [circ(32, 32, 18), 'none', '#f2e6c8', 1.5],
    ['M20 38 H44 M24 38 V44 M40 38 V44', 'none', '#f2e6c8', 3],
    ['M32 20 C36 25 35 30 32 32 C29 30 28 25 32 20 Z', '#ffd27a', INK, 1.2],
  ],
  archiveSeal: [
    ['M10 10 H54 V54 H10 Z', '#3f6fa8', INK, 2.5],
    ['M16 16 H48 V48 H16 Z', 'none', '#e8eef8', 1.5],
    ['M32 24 C26 21 21 21 18 23 V42 C21 40 26 40 32 43 C38 40 43 40 46 42 V23 C43 21 38 21 32 24 Z', '#e8eef8', INK, 1.8],
    ['M32 24 V43', 'none', INK, 1.5],
  ],
  trailSeal: [
    ['M32 4 C54 16 54 44 32 60 C10 44 10 16 32 4 Z', '#4f8a3a', INK, 2.5],
    ['M32 18 L22 40 H42 Z', '#2f5a2a', INK, 1.5],
    ['M32 40 V48', 'none', '#6b4a32', 3],
  ],
  // cardboard strip with two alphabets
  cipherStrip: [
    ['M4 20 H60 V44 H4 Z', '#efe2c2', INK, 2.5],
    ['M4 32 H60', 'none', INK, 1.5],
    ['M9 27 H13 M17 27 H21 M25 27 H29 M33 27 H37 M41 27 H45 M49 27 H53', 'none', '#3a2a1a', 2.5],
    ['M13 39 H17 M21 39 H25 M29 39 H33 M37 39 H41 M45 39 H49 M53 39 H57', 'none', '#8a2f1a', 2.5],
  ],
  fragment: [
    ['M10 8 H44 L52 18 L46 26 L54 34 L46 42 L52 52 L46 58 H10 Z', '#f6eed8', INK, 2.5],
    ['M16 18 H40 M16 26 H38 M16 34 H42 M16 42 H34', 'none', '#7a6a50', 2],
  ],
};

function render(parts: P[], size: number, label: string, viewBox = '0 0 64 64') {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="${viewBox}" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>` +
    parts.map(([d, fill, stroke, w]) => `<path d="${d}" fill="${fill ?? 'none'}"${stroke && stroke !== 'none' ? ` stroke="${stroke}" stroke-width="${w ?? 2}"` : ''}/>`).join('') + `</svg>`;
}

export function icon(name: string, size = 26, label = ''): string {
  return render(ICONS[name] ?? ICONS.close, size, label);
}

/** Each item has its own picture; unknown ids fall back to a neutral parcel (never another item's icon). */
export function itemIcon(id: string, size = 40): string {
  const parts = ICONS[id] ?? [['M10 18 H54 V54 H10 Z', '#d8c8a0', INK, 2.5], ['M10 30 H54 M32 18 V54', 'none', '#8a6a3a', 2]];
  return render(parts, size, '');
}

export const HAS_ITEM_ICON = (id: string) => !!ICONS[id];
