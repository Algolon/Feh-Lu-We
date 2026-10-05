// Canonical puzzle data: the single source for answers, evidence order and the wording built from them.
// World builders place props from these lists, clue texts and hints are generated from them, and the
// unit tests check that every surface (props, notebook, dials, hints) tells the same story.
import { SYMBOLS } from './symbols';

/** Mantelpiece objects as seen when STANDING IN FRONT OF THE FIREPLACE, listed left → right. */
export const MANTEL = [
  { sym: 'kaars', base: 'tin', baseName: 'een tinnen schoteltje', stand: false },
  { sym: 'veer', base: 'brass', baseName: 'een messing voetje', stand: true },
  { sym: 'klok', base: 'plinth', baseName: 'een houten sokkel', stand: false },
  { sym: 'dennenappel', base: 'brass', baseName: 'een messing voetje', stand: true },
  { sym: 'vaas', base: 'lace', baseName: 'een kanten kleedje', stand: false },
  { sym: 'kopje', base: 'brass', baseName: 'een messing voetje', stand: true },
] as const;

/** The hall drawer answer: the brass-stand objects, read left → right. */
export const MANTEL_ANSWER: string[] = MANTEL.filter((o) => o.stand).map((o) => o.sym);
/** Every mantel object appears on each dial wheel (no unrelated distractors). */
export const DRAWER_DIAL: string[] = MANTEL.map((o) => o.sym);

const lower = (id: string) => SYMBOLS[id].name.toLowerCase();
const article = (id: string) => (id === 'klok' ? 'een klokje' : id === 'vaas' ? 'een vaasje' : `een ${lower(id)}`);
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} en ${xs[xs.length - 1]}`);

export const MANTEL_TEXT =
  `Als je recht voor de haard staat, zie je van links naar rechts: ${list(MANTEL.map((o) => `${article(o.sym)} op ${o.baseName}`))}. ` +
  `Drie voorwerpen staan op precies dezelfde kleine messing voetjes.`;

export const MANTEL_HINTS: [string, string, string] = [
  'Lees de uitnodiging nog eens en zoek de schoorsteenmantel in de woonkamer, links van de hal.',
  'Drie voorwerpen staan op dezelfde kleine messing voetjes. Ga recht voor de haard staan en lees alleen die drie van links naar rechts.',
  `Zet de wieltjes op: ${MANTEL_ANSWER.map((s) => SYMBOLS[s].name).join(' – ')}.`,
];

/** Plan-space left→right order for a viewer standing in front of a fireplace that faces `facingYaw`. */
export function mantelSlots(cx: number, cz: number, facingYaw: number, spacing: number): { x: number; z: number }[] {
  // the viewer looks at the fireplace: viewer yaw = facing + PI; right vector of yaw a = (cos a, -sin a)
  const vy = facingYaw + Math.PI;
  const rx = Math.cos(vy), rz = -Math.sin(vy);
  const n = MANTEL.length;
  return MANTEL.map((_, i) => {
    const off = (i - (n - 1) / 2) * spacing;
    return { x: cx + rx * off, z: cz + rz * off };
  });
}

// =====================================================================================================
// Thread A — "Aan tafel": the service plan in the kitchen (three trolley tags → three destinations)
export const SERVICE = {
  // destinations on the chart, left → right
  slots: [
    { id: 'tafel', sym: 'kamer.eetkamer', name: 'de eettafel' },
    { id: 'provisie', sym: 'kamer.provisie', name: 'de provisiekamer' },
    { id: 'serre', sym: 'kamer.serre', name: 'de serre' },
  ],
  // the three reusable trolley tags hanging on the hook board (pictures only, no words)
  tags: [
    { id: 'warm', sym: 'wagen.warm' },
    { id: 'bloem', sym: 'wagen.bloem' },
    { id: 'koud', sym: 'wagen.koud' },
  ],
  rule: 'Wat koud moet blijven, vertrekt uit de provisiekamer. Bloemen gaan naar de serre. De wagen die overblijft, bedient de tafel.',
};
/** Relational rule resolved: cold supplies → pantry, flowers → conservatory, the remaining trolley → table. */
export const SERVICE_ANSWER: Record<string, string> = { provisie: 'koud', serre: 'bloem', tafel: 'warm' };

// =====================================================================================================
// Thread B — "In de kantlijn": the library catalogue
/** Room emblems: on the door plaques and on the framed floor plan in the library. */
export const EMBLEMS: { room: string; sym: string }[] = [
  { room: 'Woonkamer', sym: 'e.haard' },
  { room: 'Eetkamer', sym: 'e.kandelaar' },
  { room: 'Keuken', sym: 'e.ketel' },
  { room: 'Bibliotheek', sym: 'e.boek' },
  { room: 'Studeerkamer', sym: 'e.inktpot' },
  { room: 'Sterrenkamer', sym: 'ster' },
  { room: 'Reiskamer', sym: 'e.koffer' },
  { room: 'Botanische kamer', sym: 'e.varen' },
];
/** Guestbook page tabs: each room's pages carry a tab of one shape. */
export const GUESTBOOK_TABS: { tab: string; room: string }[] = [
  { tab: 'tab.rond', room: 'Sterrenkamer' },
  { tab: 'tab.punt', room: 'Botanische kamer' },
  { tab: 'tab.vierkant', room: 'Reiskamer' },
  { tab: 'tab.golf', room: 'Woonkamer' },
  { tab: 'tab.dubbel', room: 'Keuken' },
];
export const CATALOG = {
  books: [
    { id: 'ster', sym: 'ster', cover: 'een donkerblauw boek met een ingeslagen ster' },
    { id: 'varen', sym: 'e.varen', cover: 'een groen boek met een ingeslagen varenblad' },
    { id: 'koffer', sym: 'e.koffer', cover: 'een bruin boek met een ingeslagen koffer' },
  ],
  // sockets on the reading desk, left → right, each labelled with a page-tab shape
  sockets: [
    { id: 'punt', tab: 'tab.punt' },
    { id: 'rond', tab: 'tab.rond' },
    { id: 'vierkant', tab: 'tab.vierkant' },
  ],
};
/** socket id → book id, derived (emblem → room via the plan; room → tab via the guestbook; tab → socket). */
export const CATALOG_ANSWER: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const b of CATALOG.books) {
    const room = EMBLEMS.find((e) => e.sym === b.sym)!.room;
    const tab = GUESTBOOK_TABS.find((t) => t.room === room)!.tab;
    out[CATALOG.sockets.find((s) => s.tab === tab)!.id] = b.id;
  }
  return out;
})();

// =====================================================================================================
// Convergence — the route console in the basement: three channels drawn as line styles
export const ROUTE_LINES = [
  { id: 'water', style: 'gestreept', from: 'het zwembad in de serre', seal: 'tableSeal' },
  { id: 'muren', style: 'doorgetrokken', from: 'de bibliotheek', seal: 'archiveSeal' },
  { id: 'paden', style: 'gestippeld', from: 'de vuurplaats in het bos', seal: 'trailSeal' },
];
/** Console sockets left → right (labelled only with the line style). */
export const CONSOLE_SOCKETS = ['muren', 'water', 'paden'];
export const CONSOLE_ANSWER: Record<string, string> = Object.fromEntries(ROUTE_LINES.map((l) => [l.id, l.seal]));

// =====================================================================================================
// BOSLUST — a taught Caesar shift (three letters) on number words
export const CIPHER = {
  shift: 3,
  example: { plain: 'ABC', cipher: 'DEF' },
  cipher: 'WZHH YLHU HHQ GULH',
  words: ['EEN', 'TWEE', 'DRIE', 'VIER', 'VIJF', 'ZES', 'ZEVEN', 'ACHT', 'NEGEN'],
};
const A = 'A'.charCodeAt(0);
export const caesar = (text: string, shift: number) =>
  text.replace(/[A-Z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - A + shift + 26 * 4) % 26) + A));
/** Decoded inscription and the four digits it spells (computed, never typed in by hand). */
export const CIPHER_PLAIN = caesar(CIPHER.cipher, -CIPHER.shift);
export const CIPHER_CODE: number[] = CIPHER_PLAIN.split(' ').map((w) => CIPHER.words.indexOf(w) + 1);

// =====================================================================================================
// Finale — three route plates in the rooted passage. Rotation r = quarter turns clockwise (0..3).
// The wall drawing shows each plate with the brass notch where it must point.
export const PLATES = [
  { id: 'tafel', motif: 'zegel.tafel', name: 'tafelplaat', start: 2, target: 0, notch: 'boven' },
  { id: 'boek', motif: 'zegel.boek', name: 'boekplaat', start: 0, target: 1, notch: 'rechts' },
  { id: 'boom', motif: 'zegel.boom', name: 'boomplaat', start: 1, target: 2, notch: 'onder' },
];
export const NOTCH_DIRS = ['boven', 'rechts', 'onder', 'links'];
