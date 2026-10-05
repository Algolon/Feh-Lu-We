// Pictorial symbol vocabulary shared by 3D props (drawn to canvas), dials, notebook, hints and panels.
// One definition per symbol: the same silhouette, interior detail, orientation and Dutch name everywhere.
// Colour is supplementary; every symbol is recognisable by shape and inner detail alone (viewBox 0 0 100 100).

export interface Layer {
  d: string;
  fill?: string; // omitted → no fill
  stroke?: string; // omitted → no stroke
  w?: number; // stroke width
}
export interface SymbolDef {
  id: string;
  name: string; // Dutch, player-facing
  color: string; // dominant colour (supplementary cue)
  layers: Layer[];
}

const INK = '#2b2118';
const circ = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

export const SYMBOLS: Record<string, SymbolDef> = {
  // ---------------------------------------------------------------- mantelpiece objects (hall drawer)
  veer: {
    id: 'veer', name: 'Veer', color: '#efe8d6',
    layers: [
      { d: 'M30 79 C46 72 62 58 70 44 C76 32 80 20 82 8 C70 14 58 24 48 34 C38 46 30 60 26 74 Z', fill: '#efe8d6', stroke: INK, w: 3 },
      { d: 'M38 68 L50 71 M44 59 L58 61 M51 50 L65 50 M58 41 L71 39 M65 32 L76 28 M38 64 L31 57 M45 55 L38 46 M52 46 L46 37 M60 37 L56 27 M67 28 L65 19', stroke: '#a89a80', w: 2 },
      { d: 'M14 95 C26 80 40 60 52 44 C62 31 72 20 82 8', stroke: '#6b5a44', w: 3.5 },
      { d: 'M14 95 L24 82', stroke: INK, w: 4.5 },
    ],
  },
  dennenappel: {
    id: 'dennenappel', name: 'Dennenappel', color: '#9a6a3a',
    layers: [
      { d: 'M50 16 C68 20 78 40 76 60 C74 80 62 92 50 92 C38 92 26 80 24 60 C22 40 32 20 50 16 Z', fill: '#9a6a3a', stroke: INK, w: 3 },
      { d: 'M34 30 Q42 40 50 30 Q58 40 66 30 M27 44 Q35 54 43 44 Q51 54 59 44 Q67 54 74 44 M25 58 Q33 68 41 58 Q49 68 57 58 Q65 68 75 58 M29 72 Q37 82 45 72 Q53 82 61 72 Q67 80 72 72', stroke: '#4e3018', w: 3 },
      { d: 'M38 36 L42 34 M54 36 L58 34 M31 50 L35 48 M47 50 L51 48 M63 50 L67 48 M37 64 L41 62 M53 64 L57 62', stroke: '#c8955a', w: 2.5 },
      { d: 'M46 17 C45 11 47 6 52 3 C55 8 55 12 54 17 Z', fill: '#6b4a2a', stroke: INK, w: 2.5 },
    ],
  },
  kopje: {
    id: 'kopje', name: 'Kopje', color: '#8fb4d8',
    layers: [
      { d: 'M38 26 C34 20 42 16 38 9 M55 26 C51 20 59 16 55 9', stroke: '#9aa6b2', w: 3 },
      { d: 'M8 82 C8 76 92 76 92 82 C92 89 8 89 8 82 Z', fill: '#f2efe6', stroke: INK, w: 3 },
      { d: 'M72 46 C90 44 92 66 70 66', stroke: INK, w: 8 },
      { d: 'M72 46 C90 44 92 66 70 66', stroke: '#8fb4d8', w: 3.5 },
      { d: 'M18 36 H76 C76 61 66 77 47 77 C28 77 18 61 18 36 Z', fill: '#8fb4d8', stroke: INK, w: 3 },
      { d: 'M22 52 C34 57 60 57 73 52', stroke: '#f2efe6', w: 3 },
      { d: 'M18 36 C18 30 76 30 76 36 C76 42 18 42 18 36 Z', fill: '#e3edf6', stroke: INK, w: 3 },
      { d: 'M25 36 C25 33.5 69 33.5 69 36 C69 38.5 25 38.5 25 36 Z', fill: '#a8723c' },
    ],
  },
  kaars: {
    id: 'kaars', name: 'Kaars', color: '#f3ead0',
    layers: [
      { d: 'M18 84 C18 78 82 78 82 84 C82 90 18 90 18 84 Z', fill: '#c9a44c', stroke: INK, w: 3 },
      { d: 'M38 40 H62 V82 H38 Z', fill: '#f3ead0', stroke: INK, w: 3 },
      { d: 'M52 40 V55 C52 59 57 59 57 55 V40', fill: '#fbf7ea', stroke: INK, w: 2 },
      { d: 'M50 40 V31', stroke: INK, w: 3 },
      { d: 'M50 6 C61 19 61 29 50 33 C39 29 39 19 50 6 Z', fill: '#f2a23a', stroke: INK, w: 2.5 },
      { d: 'M50 16 C55 22 55 28 50 30 C45 28 45 22 50 16 Z', fill: '#fff3b0' },
    ],
  },
  klok: {
    id: 'klok', name: 'Klok', color: '#a8743f',
    layers: [
      { d: 'M24 88 H34 V94 H24 Z M66 88 H76 V94 H66 Z', fill: '#6b4426', stroke: INK, w: 2 },
      { d: 'M20 88 V46 C20 20 80 20 80 46 V88 Z', fill: '#a8743f', stroke: INK, w: 3 },
      { d: circ(50, 52, 21), fill: '#f6efdc', stroke: INK, w: 3 },
      { d: 'M50 33 V37 M69 52 H65 M50 71 V67 M31 52 H35', stroke: INK, w: 2.5 },
      { d: 'M50 52 L50 38 M50 52 L61 58', stroke: INK, w: 3.5 },
      { d: 'M26 82 H74', stroke: '#6b4426', w: 3 },
    ],
  },
  vaas: {
    id: 'vaas', name: 'Vaas', color: '#4f7fa8',
    layers: [
      { d: 'M50 42 C50 32 52 22 55 15', stroke: '#4f8a3a', w: 4 },
      { d: 'M52 31 C60 24 67 26 70 28 C63 33 57 33 52 31 Z', fill: '#5f9a44', stroke: INK, w: 2 },
      { d: 'M55 3 C61 3 63 9 59 12 C65 11 67 19 61 19 C63 25 55 26 55 21 C53 26 46 24 48 19 C42 19 42 11 49 12 C46 8 49 3 55 3 Z', fill: '#e8c547', stroke: INK, w: 2 },
      { d: circ(55, 12, 3.5), fill: '#c9774a' },
      { d: 'M37 50 C30 59 28 71 32 82 C34 88 66 88 68 82 C72 71 70 59 63 50 C61 47 61 44 63 41 H37 C39 44 39 47 37 50 Z', fill: '#4f7fa8', stroke: INK, w: 3 },
      { d: 'M34 41 H66', stroke: INK, w: 4 },
      { d: 'M33 66 C44 70 56 70 67 66', stroke: '#c9dbe9', w: 3 },
    ],
  },
  ster: {
    id: 'ster', name: 'Ster', color: '#e8c547',
    layers: [{ d: 'M50 8 L61 38 L93 38 L67 57 L77 89 L50 70 L23 89 L33 57 L7 38 L39 38 Z', fill: '#e8c547', stroke: INK, w: 3.5 }],
  },
  // ---------------------------------------------------------------- forest landmarks (study route)
  put: {
    id: 'put', name: 'Put', color: '#b8b0a0',
    layers: [
      { d: 'M12 34 L50 10 L88 34 Z', fill: '#7a8070', stroke: INK, w: 3 },
      { d: 'M26 34 V58 M74 34 V58', stroke: '#6b4a2a', w: 5 },
      { d: 'M26 42 H74', stroke: '#6b4a2a', w: 3 },
      { d: 'M50 42 V50', stroke: INK, w: 2 },
      { d: 'M43 50 H57 L55 58 H45 Z', fill: '#8a6a4a', stroke: INK, w: 2 },
      { d: 'M16 58 H84 V90 H16 Z', fill: '#b8b0a0', stroke: INK, w: 3 },
      { d: 'M16 69 H84 M16 80 H84 M32 58 V69 M56 58 V69 M74 58 V69 M24 69 V80 M46 69 V80 M68 69 V80 M36 80 V90 M60 80 V90', stroke: '#6a6458', w: 2 },
    ],
  },
  schuur: {
    id: 'schuur', name: 'Schuur', color: '#a8743f',
    layers: [
      { d: 'M18 50 L50 22 L82 50 V90 H18 Z', fill: '#a8743f', stroke: INK, w: 3 },
      { d: 'M30 56 V90 M70 56 V90', stroke: '#7a4f2c', w: 2.5 },
      { d: 'M40 90 V62 H60 V90 Z', fill: '#6b4426', stroke: INK, w: 3 },
      { d: 'M41 64 L59 88', stroke: '#3f2814', w: 2.5 },
      { d: 'M8 52 L50 14 L92 52 L86 57 L50 25 L14 57 Z', fill: '#6a6a5a', stroke: INK, w: 3 },
    ],
  },
  vuur: {
    id: 'vuur', name: 'Vuur', color: '#e3742f',
    layers: [
      { d: 'M16 88 L84 72 M16 72 L84 88', stroke: INK, w: 13 },
      { d: 'M16 88 L84 72 M16 72 L84 88', stroke: '#8a5a33', w: 8 },
      { d: 'M50 6 C64 24 78 40 72 60 C68 74 58 80 50 80 C38 80 28 74 28 60 C28 48 38 40 42 28 C46 38 50 42 54 44 C56 32 54 20 50 6 Z', fill: '#e3742f', stroke: INK, w: 3 },
      { d: 'M50 40 C58 50 62 58 58 68 C56 74 52 76 50 76 C44 76 40 72 40 66 C40 58 46 54 48 46 C50 52 52 54 54 56 C54 50 52 46 50 40 Z', fill: '#f6c544' },
    ],
  },
  // ---------------------------------------------------------------- garden lanterns
  maan: {
    id: 'maan', name: 'Maan', color: '#b9c3e6',
    layers: [
      { d: 'M60 8 A42 42 0 1 0 92 70 A33 33 0 1 1 60 8 Z', fill: '#b9c3e6', stroke: INK, w: 3.5 },
      { d: circ(34, 46, 4) + circ(38, 68, 3) + circ(28, 60, 2.5), fill: '#8f9bc4' },
    ],
  },
  zon: {
    id: 'zon', name: 'Zon', color: '#f2b233',
    layers: [
      { d: 'M50 4 V18 M50 82 V96 M4 50 H18 M82 50 H96 M17 17 L27 27 M73 73 L83 83 M17 83 L27 73 M73 27 L83 17', stroke: INK, w: 10 },
      { d: 'M50 4 V18 M50 82 V96 M4 50 H18 M82 50 H96 M17 17 L27 27 M73 73 L83 83 M17 83 L27 73 M73 27 L83 17', stroke: '#f2b233', w: 5 },
      { d: circ(50, 50, 24), fill: '#f2b233', stroke: INK, w: 3.5 },
    ],
  },
  blad: {
    id: 'blad', name: 'Blad', color: '#6fae4f',
    layers: [
      { d: 'M50 92 V80', stroke: '#3f6a2a', w: 5 },
      { d: 'M50 82 C18 66 16 30 50 6 C84 30 82 66 50 82 Z', fill: '#6fae4f', stroke: INK, w: 3.5 },
      { d: 'M50 80 V18 M50 44 L35 32 M50 58 L34 47 M50 44 L65 32 M50 58 L66 47', stroke: '#3f6a2a', w: 3 },
    ],
  },
  // ---------------------------------------------------------------- pool mosaic (geometric on purpose)
  driehoek: { id: 'driehoek', name: 'Driehoek', color: '#e07a3a', layers: [{ d: 'M50 10 L92 86 H8 Z', fill: '#e07a3a', stroke: INK, w: 4 }] },
  cirkel: { id: 'cirkel', name: 'Cirkel', color: '#3f7fd0', layers: [{ d: circ(50, 50, 38), fill: '#3f7fd0', stroke: INK, w: 4 }] },
  ruit: { id: 'ruit', name: 'Ruit', color: '#4fa35a', layers: [{ d: 'M50 6 L90 50 L50 94 L10 50 Z', fill: '#4fa35a', stroke: INK, w: 4 }] },
  golf: {
    id: 'golf', name: 'Golf', color: '#9a64c4',
    layers: [{ d: 'M6 46 C22 28 36 28 50 44 C64 60 78 60 94 42 V62 C78 80 64 80 50 64 C36 48 22 48 6 66 Z', fill: '#9a64c4', stroke: INK, w: 4 }],
  },
  // ---------------------------------------------------------------- room emblems (door plaques, library plan, books)
  'e.haard': {
    id: 'e.haard', name: 'Haard', color: '#c9774a',
    layers: [
      { d: 'M10 30 H90 V40 H10 Z', fill: '#d8c6a4', stroke: INK, w: 3 },
      { d: 'M18 40 H82 V90 H18 Z', fill: '#d8c6a4', stroke: INK, w: 3 },
      { d: 'M32 90 V56 C32 46 68 46 68 56 V90 Z', fill: '#2b2118' },
      { d: 'M50 58 C57 66 60 72 57 80 C55 85 52 86 50 86 C46 86 43 84 43 79 C43 74 47 71 48 66 C49 70 51 72 52 73 C53 68 52 63 50 58 Z', fill: '#f2a23a' },
      { d: 'M36 88 H64', stroke: '#8a5a33', w: 4 },
      { d: 'M40 12 H60 V30 H40 Z', fill: '#d8c6a4', stroke: INK, w: 3 },
    ],
  },
  'e.kandelaar': {
    id: 'e.kandelaar', name: 'Kandelaar', color: '#c9a44c',
    layers: [
      { d: 'M20 50 C20 66 80 66 80 50 M50 62 V86 M32 90 H68', stroke: INK, w: 8 },
      { d: 'M20 50 C20 66 80 66 80 50 M50 62 V86 M32 90 H68', stroke: '#c9a44c', w: 4 },
      { d: 'M15 30 H25 V50 H15 Z M45 26 H55 V60 H45 Z M75 30 H85 V50 H75 Z', fill: '#f3ead0', stroke: INK, w: 2.5 },
      { d: 'M20 14 C25 20 25 25 20 28 C15 25 15 20 20 14 Z M50 8 C55 14 55 20 50 23 C45 20 45 14 50 8 Z M80 14 C85 20 85 25 80 28 C75 25 75 20 80 14 Z', fill: '#f2a23a', stroke: INK, w: 2 },
    ],
  },
  'e.ketel': {
    id: 'e.ketel', name: 'Ketel', color: '#b8682f',
    layers: [
      { d: 'M28 34 C28 18 72 18 72 34', stroke: INK, w: 5 },
      { d: 'M70 52 L90 36 L92 42 L76 60', fill: '#b8682f', stroke: INK, w: 3 },
      { d: 'M18 86 C14 66 22 44 50 42 C78 44 86 66 82 86 Z', fill: '#b8682f', stroke: INK, w: 3 },
      { d: 'M40 42 H60 V36 H40 Z', fill: '#8a4a22', stroke: INK, w: 2.5 },
      { d: 'M26 64 C40 70 60 70 74 64', stroke: '#e0a070', w: 3 },
    ],
  },
  'e.boek': {
    id: 'e.boek', name: 'Boek', color: '#8a2f2f',
    layers: [
      { d: 'M50 24 C38 16 20 16 8 22 V82 C20 76 38 76 50 84 C62 76 80 76 92 82 V22 C80 16 62 16 50 24 Z', fill: '#f6eed8', stroke: INK, w: 3 },
      { d: 'M50 24 V84', stroke: INK, w: 3 },
      { d: 'M16 34 C26 30 36 30 44 34 M16 46 C26 42 36 42 44 46 M16 58 C26 54 36 54 44 58 M56 34 C64 30 74 30 84 34 M56 46 C64 42 74 42 84 46 M56 58 C64 54 74 54 84 58', stroke: '#9a8a6a', w: 2.5 },
    ],
  },
  'e.inktpot': {
    id: 'e.inktpot', name: 'Inktpot', color: '#2f3a5a',
    layers: [
      { d: 'M62 50 L88 8 L92 10 L68 54', fill: '#efe8d6', stroke: INK, w: 2.5 },
      { d: 'M24 54 H76 L82 88 H18 Z', fill: '#2f3a5a', stroke: INK, w: 3 },
      { d: 'M34 42 H66 V54 H34 Z', fill: '#4a5a7a', stroke: INK, w: 3 },
      { d: 'M28 70 H72', stroke: '#8a9ac0', w: 3 },
    ],
  },
  'e.koffer': {
    id: 'e.koffer', name: 'Koffer', color: '#a8743f',
    layers: [
      { d: 'M36 30 V20 C36 16 64 16 64 20 V30', stroke: INK, w: 5 },
      { d: 'M10 30 H90 V84 H10 Z', fill: '#a8743f', stroke: INK, w: 3 },
      { d: 'M30 30 V84 M70 30 V84', stroke: '#6b4426', w: 5 },
      { d: 'M10 54 H90', stroke: '#6b4426', w: 3 },
      { d: 'M44 50 H56 V60 H44 Z', fill: '#d9b14a', stroke: INK, w: 2 },
      { d: 'M74 38 H86 V46 H74 Z', fill: '#f6eed8', stroke: INK, w: 1.5 },
    ],
  },
  'e.varen': {
    id: 'e.varen', name: 'Varen', color: '#5f9a44',
    layers: [
      { d: 'M50 94 C52 70 50 40 46 8', stroke: '#3f6a2a', w: 4 },
      { d: 'M50 84 C36 82 24 76 18 68 C30 66 42 72 50 78 Z M50 84 C64 82 76 76 82 68 C70 66 58 72 50 78 Z M50 66 C38 64 28 58 24 50 C34 50 44 56 50 60 Z M50 66 C62 64 72 58 76 50 C66 50 56 56 50 60 Z M49 48 C40 46 32 40 30 32 C38 32 45 38 49 42 Z M49 48 C58 46 66 40 68 32 C60 32 53 38 49 42 Z M47 30 C42 28 38 22 38 16 C43 18 46 22 47 26 Z M47 30 C53 28 56 22 56 16 C51 18 48 22 47 26 Z', fill: '#6fae4f', stroke: INK, w: 2 },
    ],
  },
  // ---------------------------------------------------------------- guestbook page tabs (shape of the tab on a page edge)
  'tab.rond': { id: 'tab.rond', name: 'Ronde tab', color: '#d0643a', layers: [{ d: 'M14 92 V40 H34 C34 14 66 14 66 40 H86 V92 Z', fill: '#f6eed8', stroke: INK, w: 3 }, { d: 'M34 40 C34 14 66 14 66 40 Z', fill: '#d0643a', stroke: INK, w: 3 }] },
  'tab.punt': { id: 'tab.punt', name: 'Puntige tab', color: '#4f8a3a', layers: [{ d: 'M14 92 V40 H34 L50 12 L66 40 H86 V92 Z', fill: '#f6eed8', stroke: INK, w: 3 }, { d: 'M34 40 L50 12 L66 40 Z', fill: '#4f8a3a', stroke: INK, w: 3 }] },
  'tab.vierkant': { id: 'tab.vierkant', name: 'Vierkante tab', color: '#3f6fa8', layers: [{ d: 'M14 92 V40 H34 V16 H66 V40 H86 V92 Z', fill: '#f6eed8', stroke: INK, w: 3 }, { d: 'M34 40 V16 H66 V40 Z', fill: '#3f6fa8', stroke: INK, w: 3 }] },
  'tab.golf': { id: 'tab.golf', name: 'Golvende tab', color: '#9a64c4', layers: [{ d: 'M14 92 V40 H26 C32 22 40 22 44 32 C48 42 56 42 60 30 C64 20 72 22 76 40 H86 V92 Z', fill: '#f6eed8', stroke: INK, w: 3 }, { d: 'M26 40 C32 22 40 22 44 32 C48 42 56 42 60 30 C64 20 72 22 76 40 Z', fill: '#9a64c4', stroke: INK, w: 3 }] },
  'tab.dubbel': { id: 'tab.dubbel', name: 'Dubbele tab', color: '#c9a44c', layers: [{ d: 'M14 92 V40 H24 V20 H44 V40 H56 V20 H76 V40 H86 V92 Z', fill: '#f6eed8', stroke: INK, w: 3 }, { d: 'M24 40 V20 H44 V40 Z M56 40 V20 H76 V40 Z', fill: '#c9a44c', stroke: INK, w: 3 }] },
  // ---------------------------------------------------------------- the three seals (thread emblems)
  'zegel.tafel': {
    id: 'zegel.tafel', name: 'Tafelzegel', color: '#c4553d',
    layers: [
      { d: circ(50, 50, 42), fill: '#c4553d', stroke: INK, w: 3.5 },
      { d: circ(50, 50, 34), stroke: '#8e3524', w: 2.5 },
      { d: 'M24 58 H76 M30 58 V74 M70 58 V74', stroke: '#f6e2c8', w: 5 },
      { d: 'M38 52 C38 40 62 40 62 52 Z', fill: '#f6e2c8' },
      { d: 'M50 28 C54 33 54 37 50 39 C46 37 46 33 50 28 Z', fill: '#f6e2c8' },
    ],
  },
  'zegel.boek': {
    id: 'zegel.boek', name: 'Archiefzegel', color: '#3f6fa8',
    layers: [
      { d: 'M10 10 H90 V90 H10 Z', fill: '#3f6fa8', stroke: INK, w: 3.5 },
      { d: 'M18 18 H82 V82 H18 Z', stroke: '#2a4a74', w: 2.5 },
      { d: 'M50 34 C42 28 30 28 24 32 V70 C30 66 42 66 50 72 C58 66 70 66 76 70 V32 C70 28 58 28 50 34 Z', fill: '#e8eef8', stroke: '#1c2f4a', w: 2.5 },
      { d: 'M50 34 V72', stroke: '#1c2f4a', w: 2.5 },
    ],
  },
  'zegel.boom': {
    id: 'zegel.boom', name: 'Spoorzegel', color: '#4f8a3a',
    layers: [
      { d: 'M50 94 C18 72 14 32 50 6 C86 32 82 72 50 94 Z', fill: '#4f8a3a', stroke: INK, w: 3.5 },
      { d: 'M50 80 V54', stroke: '#f0e6c8', w: 5 },
      { d: 'M50 22 C66 26 68 46 56 52 C52 56 48 56 44 52 C32 46 34 26 50 22 Z', fill: '#f0e6c8' },
    ],
  },
  // ---------------------------------------------------------------- service plan: trolley tags and destinations
  'wagen.koud': {
    id: 'wagen.koud', name: 'Melkbus en kaas', color: '#9fc4dc',
    layers: [
      { d: 'M18 30 H42 V26 H22 V30 M20 30 C14 40 14 76 20 88 H40 C46 76 46 40 40 30 Z', fill: '#c9d4dc', stroke: INK, w: 3 },
      { d: 'M18 48 H42', stroke: '#7a8a96', w: 3 },
      { d: 'M52 86 L92 86 L92 64 L52 74 Z', fill: '#f0d070', stroke: INK, w: 3 },
      { d: 'M52 74 L92 64 L80 58 Z', fill: '#f6dc8a', stroke: INK, w: 2.5 },
      { d: circ(64, 80, 3) + circ(80, 76, 2.5), fill: '#d0a840' },
    ],
  },
  'wagen.bloem': {
    id: 'wagen.bloem', name: 'Gieter en tulp', color: '#6fae4f',
    layers: [
      { d: 'M14 50 H58 V88 H14 Z', fill: '#7aa4b8', stroke: INK, w: 3 },
      { d: 'M58 58 L90 40 L92 46 L58 70', fill: '#7aa4b8', stroke: INK, w: 3 },
      { d: 'M22 50 C22 36 50 36 50 50', stroke: INK, w: 4 },
      { d: 'M74 42 C74 30 76 20 78 14', stroke: '#4f8a3a', w: 3 },
      { d: 'M70 16 C70 6 78 4 78 10 C78 4 86 6 86 16 C86 22 70 22 70 16 Z', fill: '#d84a6a', stroke: INK, w: 2 },
    ],
  },
  'wagen.warm': {
    id: 'wagen.warm', name: 'Dampende terrine', color: '#d9774a',
    layers: [
      { d: 'M34 26 C30 20 38 16 34 10 M50 26 C46 20 54 16 50 10 M66 26 C62 20 70 16 66 10', stroke: '#9aa6b2', w: 3 },
      { d: 'M10 86 C10 80 90 80 90 86 C90 92 10 92 10 86 Z', fill: '#f2efe6', stroke: INK, w: 3 },
      { d: 'M16 46 H84 C84 70 70 82 50 82 C30 82 16 70 16 46 Z', fill: '#f2efe6', stroke: INK, w: 3 },
      { d: 'M20 46 C20 34 80 34 80 46 Z', fill: '#e8e2d2', stroke: INK, w: 3 },
      { d: 'M46 34 H54 V28 H46 Z', fill: '#d9774a', stroke: INK, w: 2 },
      { d: 'M24 58 C38 64 62 64 76 58', stroke: '#d9774a', w: 3 },
    ],
  },
  'kamer.eetkamer': {
    id: 'kamer.eetkamer', name: 'Eettafel', color: '#8a5a33',
    layers: [
      { d: 'M8 52 H92 V60 H8 Z', fill: '#8a5a33', stroke: INK, w: 3 },
      { d: 'M16 60 V88 M84 60 V88', stroke: INK, w: 5 },
      { d: 'M28 50 C28 44 44 44 44 50 Z M56 50 C56 44 72 44 72 50 Z', fill: '#f2efe6', stroke: INK, w: 2 },
      { d: 'M50 20 V48', stroke: '#f3ead0', w: 6 },
      { d: 'M50 8 C55 14 55 18 50 20 C45 18 45 14 50 8 Z', fill: '#f2a23a' },
    ],
  },
  'kamer.provisie': {
    id: 'kamer.provisie', name: 'Voorraadplank', color: '#a8743f',
    layers: [
      { d: 'M8 40 H92 M8 74 H92', stroke: '#6b4426', w: 6 },
      { d: 'M14 16 H32 V37 H14 Z M38 22 H54 V37 H38 Z M62 12 H84 V37 H62 Z', fill: '#c9d4dc', stroke: INK, w: 2.5 },
      { d: 'M14 16 H32 V22 H14 Z M62 12 H84 V18 H62 Z', fill: '#c4553d' },
      { d: 'M16 50 C16 44 40 44 40 50 V71 H16 Z M50 48 H86 V71 H50 Z', fill: '#d9b878', stroke: INK, w: 2.5 },
    ],
  },
  'kamer.serre': {
    id: 'kamer.serre', name: 'Serre', color: '#7ab8b0',
    layers: [
      { d: 'M10 46 L50 14 L90 46 V88 H10 Z', fill: '#cfe8e4', stroke: INK, w: 3 },
      { d: 'M10 46 H90 M30 46 V88 M50 30 V88 M70 46 V88 M30 30 L30 46', stroke: '#2f4a3c', w: 3 },
      { d: 'M18 88 C18 76 26 72 26 64 C30 72 36 76 36 88 Z', fill: '#5f9a44' },
      { d: 'M56 74 H84 V80 H56 Z', fill: '#5fb8d0' },
    ],
  },
  // ---------------------------------------------------------------- story objects (iteration 2 route)
  wapen: {
    id: 'wapen', name: 'Wapen', color: '#c0504d',
    layers: [
      { d: 'M20 12 H80 V48 C80 72 64 86 50 94 C36 86 20 72 20 48 Z', fill: '#c0504d', stroke: INK, w: 4 },
      { d: 'M50 22 V78 M30 42 H70', stroke: '#f2e6c8', w: 6 },
    ],
  },
  penning: {
    id: 'penning', name: 'Penning', color: '#b98a4e',
    layers: [
      { d: circ(50, 50, 42), fill: '#b98a4e', stroke: INK, w: 4 },
      { d: 'M50 80 V44 M50 44 L34 30 M50 44 L66 30 M50 58 L36 50 M50 58 L64 50', stroke: '#5a3a1a', w: 5 },
    ],
  },
};

/** Symbol as an SVG <g> placed at (x, y) with size s (for composite diagrams). */
export function symbolG(id: string, x: number, y: number, s: number): string {
  const d = SYMBOLS[id];
  if (!d) return '';
  return `<g transform="translate(${x},${y}) scale(${s / 100})" stroke-linejoin="round" stroke-linecap="round">` +
    d.layers.map((l) => `<path d="${l.d}" fill="${l.fill ?? 'none'}"${l.stroke ? ` stroke="${l.stroke}" stroke-width="${l.w ?? 4}"` : ''}/>`).join('') + '</g>';
}

/** Render a symbol as inline SVG (UI). */
export function symbolSvg(id: string, size = 40, extraClass = ''): string {
  const s = SYMBOLS[id];
  if (!s) return '';
  return `<svg class="sym ${extraClass}" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${s.name}" stroke-linejoin="round" stroke-linecap="round">` +
    s.layers.map((l) => `<path d="${l.d}" fill="${l.fill ?? 'none'}"${l.stroke ? ` stroke="${l.stroke}" stroke-width="${l.w ?? 4}"` : ''}/>`).join('') +
    `</svg>`;
}

/**
 * Draw a symbol on a 2D canvas into the square (x, y, size). `color` replaces every fill and `ink` every stroke
 * (used for monochrome cut-outs and engraved plates); otherwise the full-colour artwork is drawn.
 */
export function drawSymbol(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, size: number, opts?: { color?: string; ink?: string }) {
  const s = SYMBOLS[id];
  if (!s || typeof Path2D === 'undefined') return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const l of s.layers) {
    const p = new Path2D(l.d);
    if (l.fill) { ctx.fillStyle = opts?.color ?? l.fill; ctx.fill(p); }
    if (l.stroke) { ctx.strokeStyle = opts?.ink ?? l.stroke; ctx.lineWidth = l.w ?? 4; ctx.stroke(p); }
  }
  ctx.restore();
}
