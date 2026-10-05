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
