// Pure puzzle and progression rules. World objects call these; unit tests call them too.
// Every function mutates the given GameState and returns a player-facing outcome.
import { type GameState, has, flag, give, consume, addClue } from '../core/state';
import { ESSENTIALS, ITEMS, SEALS } from '../content/items';
import {
  MANTEL_ANSWER, DRAWER_DIAL, MANTEL_HINTS, SERVICE, SERVICE_ANSWER, CATALOG, CATALOG_ANSWER, CONSOLE_SOCKETS, CONSOLE_ANSWER,
  CIPHER_CODE, PLATES,
} from '../content/canon';
import type { ThreadId } from '../content/clues';

export type Sfx = 'click' | 'pickup' | 'success' | 'fail' | 'locked' | 'unlock' | 'fire' | 'chime' | 'crank' | 'none';

export interface Outcome {
  ok: boolean;
  msg: string;
  sfx: Sfx;
}
const ok = (msg: string, sfx: Sfx = 'success'): Outcome => ({ ok: true, msg, sfx });
const no = (msg: string, sfx: Sfx = 'fail'): Outcome => ({ ok: false, msg, sfx });

// Fixed, deterministic solutions (derived from src/content/canon.ts). Documented in docs/PUZZLE_SOLUTIONS.md.
export const SOLUTIONS = {
  drawerLock: MANTEL_ANSWER,
  studyLock: ['put', 'schuur', 'vuur'],
  gardenLanterns: ['maan', 'blad', 'zon'],
  cabinetPanel: ['ruit', 'golf', 'driehoek', 'cirkel'],
  service: SERVICE_ANSWER,
  catalog: CATALOG_ANSWER,
  console: CONSOLE_ANSWER,
  boslust: CIPHER_CODE,
  plates: PLATES.map((p) => p.target),
  billiard: [0, 5, 8], // optional: cell indexes (row*3+col) of coloured balls
};

export const LOCK_OPTIONS = {
  drawerLock: DRAWER_DIAL,
  studyLock: ['put', 'schuur', 'vuur'],
};

export const seqEquals = (a: readonly (string | number)[], b: readonly (string | number)[]) => a.length === b.length && a.every((v, i) => v === b[i]);

/** Owned in any form: carried, used/installed, or placed in a slot. */
export const owns = (s: GameState, i: string) => has(s, i) || s.used.includes(i) || Object.values(s.slots).includes(i);
const seen = (s: GameState, ...c: string[]) => c.some((x) => s.clues.includes(x));

// ---------------------------------------------------------------------------------------------
// Puzzle graph: thread, discovery, solution state, objective and three-stage hints.
export interface PuzzleDef {
  id: string;
  thread: ThreadId;
  title: string;
  solved: (s: GameState) => boolean;
  /** The player has run into this puzzle (seen its lock/evidence or holds its entry item). */
  discovered: (s: GameState) => boolean;
  /** Prerequisites to work on it are met (gates the "next suggested investigation"). */
  available: (s: GameState) => boolean;
  objective: string;
  hints: [string, string, string];
  evidence?: string[];
}

const leftHome = (s: GameState) => s.scene === 'estate' || flag(s, 'leftHome');
const drawerDone = (s: GameState) => flag(s, 'drawerLockSolved');
const allSeals = (s: GameState) => SEALS.every((x) => owns(s, x));

export const PUZZLES: PuzzleDef[] = [
  {
    id: 'p0.home', thread: 'start', title: 'Inpakken', solved: leftHome, discovered: () => true, available: () => true,
    objective: 'Pak je spullen en vertrek via de voordeur.',
    hints: [
      'Kijk op de ronde tafel en in de lade van het dressoir.',
      'Je hebt de uitnodiging, zaklamp, lucifers, het notitieboek en de sleutel van het landhuis nodig.',
      'Pak alles van de tafel, open de lade van het dressoir voor de sleutel en loop dan naar de voordeur.',
    ],
  },
  {
    id: 'p1.drawer', thread: 'start', title: 'De lade in de hal', solved: drawerDone, discovered: leftHome, available: leftHome,
    objective: 'Open de lade van de ladekast in de hal.',
    hints: MANTEL_HINTS,
    evidence: ['c.invitation', 'c.mantel', 'c.drawerLock'],
  },
  // ---------------------------------------------------------------- thread A: aan tafel
  {
    id: 'a.service', thread: 'A', title: 'Het dienstrooster', solved: (s) => flag(s, 'servicePlanSolved') || owns(s, 'consKey') || s.unlocked.includes('lock.door.consWest'),
    discovered: (s) => seen(s, 'c.hostingPlan', 'c.serviceChart'), available: drawerDone,
    objective: 'Hang de drie wagenlabels op het dienstrooster in de keuken.',
    hints: [
      'Lees het gescheurde tafelplan in de eetkamer en het dienstrooster aan de keukenmuur.',
      'Elk label is een plaatje: wat is koud, wat zijn bloemen, en wat blijft er over? Koud begint in de provisiekamer, bloemen gaan naar de serre.',
      'Melkbus en kaas → provisiekamer, gieter met tulp → serre, dampende terrine → eettafel.',
    ],
    evidence: ['c.hostingPlan', 'c.serviceChart'],
  },
  {
    id: 'a.cabinet', thread: 'A', title: 'De kast in de serre', solved: (s) => flag(s, 'cabinetPanelSolved'),
    discovered: (s) => seen(s, 'c.cabinet', 'c.poolTiles', 'c.saunaDiagram', 'c.trolley'), available: (s) => owns(s, 'consKey') || s.unlocked.includes('lock.door.consWest'),
    objective: 'Open de glazen bovenkast in de serre.',
    hints: [
      'Boven de glazen deur van de kast zitten vier draaibare tegels, genummerd 1 tot 4. Bekijk het mozaïek op de bodem van het zwembad en het houten bord in de sauna, buiten rechts van de serre.',
      'Het bord nummert de vakjes 1 tot 4 vanaf het diepe eind. Het trapje zit aan het ondiepe eind: tegel 1 is dus het teken dat het diepst ligt.',
      'Draai de tegels naar: 1 Ruit – 2 Golf – 3 Driehoek – 4 Cirkel. Pak daarna het tafelzegel.',
    ],
    evidence: ['c.poolTiles', 'c.saunaDiagram', 'c.cabinet'],
  },
  // ---------------------------------------------------------------- thread B: in de kantlijn
  {
    id: 'b.catalog', thread: 'B', title: 'De catalogus', solved: (s) => flag(s, 'catalogSolved') || owns(s, 'studyKey'),
    discovered: (s) => seen(s, 'c.catalogDesk', 'c.libraryPlan', 'c.guestbookTabs'), available: drawerDone,
    objective: 'Leg de drie boeken in de juiste vakken van de leestafel in de bibliotheek.',
    hints: [
      'In de bibliotheek hangt een plattegrond met emblemen en ligt een gastenboek met tabbladen. Bekijk ook de bordjes naast de deuren boven.',
      'Elk embleem hoort bij een kamer (plattegrond). Elke kamer heeft een eigen tabvorm (gastenboek). Het vak met die tabvorm is het vak van het boek.',
      'Ster-boek → ronde tab, varen-boek → puntige tab, koffer-boek → vierkante tab.',
    ],
    evidence: ['c.libraryPlan', 'c.guestbookTabs', 'c.catalogDesk'],
  },
  {
    id: 'b.study', thread: 'B', title: 'Het bureau in de studeerkamer', solved: (s) => flag(s, 'studyLockSolved'),
    discovered: (s) => owns(s, 'studyKey') || seen(s, 'c.studyNote', 'c.forestMap', 'c.archiveCard'), available: (s) => owns(s, 'studyKey'),
    objective: 'Open het bureau in de studeerkamer boven.',
    hints: [
      'De studeerkamer is boven: neem de trap in de hal en de gang naar het oosten. Lees het briefje op het bureau en bekijk de ingelijste kaart.',
      'Op de kaart loopt een gestippelde ochtendwandeling met pijltjes langs drie plekken. Het briefje zegt: druk ze in die volgorde.',
      'Druk op het bureauslot: Put – Schuur – Vuur. Pak daarna het archiefzegel.',
    ],
    evidence: ['c.studyNote', 'c.forestMap'],
  },
  // ---------------------------------------------------------------- thread C: buiten de paden
  {
    id: 'c.shed', thread: 'C', title: 'De schuur', solved: (s) => owns(s, 'kindling') && owns(s, 'journal'),
    discovered: (s) => owns(s, 'shedKey') || owns(s, 'kindling') || owns(s, 'journal'), available: (s) => owns(s, 'shedKey'),
    objective: 'Zoek de schuur in het westelijke bos en neem mee wat er voor je ligt.',
    hints: [
      'De schuur staat in het bos ten westen van de oprijlaan. Volg het pad dat bij het voorplein naar links het bos in gaat.',
      'Open de schuur met de schuursleutel. Het is er donker: zet je zaklamp aan en kijk ook in de lade van de werkbank.',
      'Pak het aanmaakhout, open de lade van de werkbank voor het boswandeljournaal en lees het gereedschapsbord.',
    ],
  },
  {
    id: 'c.fire', thread: 'C', title: 'De vuurplaats', solved: (s) => flag(s, 'firePlateRead'),
    discovered: (s) => owns(s, 'kindling') || seen(s, 'c.toolboard') || flag(s, 'firewood'), available: (s) => owns(s, 'kindling') || flag(s, 'firewood'),
    objective: 'Maak vuur bij de vuurplaats in het bos.',
    hints: [
      'De vuurplaats ligt in het zuidwesten van het bos, voorbij de schuur.',
      'Kies het aanmaakhout in je tas en leg het in de vuurkuil. Kies daarna de lucifers. Steek dan de lantaarn op de paal aan bij het vuur.',
      'Lees in het lantaarnlicht de koperen plaat: Maan – Blad – Zon.',
    ],
  },
  {
    id: 'c.lanterns', thread: 'C', title: 'De tuinlantaarns', solved: (s) => flag(s, 'lanternsSolved'),
    discovered: (s) => seen(s, 'c.lanterns', 'c.firePlate'), available: () => true,
    objective: 'Ontsteek de lantaarns op het grasveld achter het landhuis.',
    hints: [
      'De drie lantaarns staan in een kring op het grasveld achter het landhuis, rond een platte steen.',
      'Steek alle drie aan. Pas als de derde brandt, zie je of de volgorde klopt. De koperen plaat bij de vuurplaats geeft de volgorde.',
      'Steek ze aan in de volgorde Maan, Blad, Zon. Pak daarna het spoorzegel uit de steen.',
    ],
    evidence: ['c.firePlate', 'c.lanterns'],
  },
  // ---------------------------------------------------------------- convergence
  {
    id: 'd.basement', thread: 'D', title: 'De kelderdeur', solved: (s) => flag(s, 'basementOpen'),
    discovered: (s) => seen(s, 'c.basementDoor', 'c.ledger'), available: allSeals,
    objective: 'Breng de drie zegels naar de kelderdeur in de achterhal.',
    hints: [
      'Het landgoedregister noemt drie zegels: aan tafel, in de kantlijn en buiten de paden. De kelderdeur is in de achterhal.',
      'Elk zegel ligt aan het eind van een draad: de kast in de serre, het bureau in de studeerkamer, de steen bij de tuinlantaarns.',
      'Heb je alle drie bij je, gebruik dan de kelderdeur: de zegels passen in de afdrukken.',
    ],
  },
  {
    id: 'd.console', thread: 'D', title: 'De routekamer', solved: (s) => flag(s, 'routeRestored'),
    discovered: (s) => flag(s, 'basementOpen') || seen(s, 'c.routeConsole', 'c.serviceDrawing'), available: (s) => flag(s, 'basementOpen'),
    objective: 'Herstel de route in de kelder.',
    hints: [
      'In de archiefkelder hangt een leidingtekening; in de routekamer staat een kast met drie zegelvakken.',
      'Elk vak heeft een lijnsoort. Op de tekening begint de doorgetrokken lijn bij de bibliotheek, de gestreepte bij het zwembad en de gestippelde bij de vuurplaats. Welk zegel hoort bij welke plek?',
      'Archiefzegel in het vak met de doorgetrokken lijn, tafelzegel bij de gestreepte lijn, spoorzegel bij de gestippelde lijn.',
    ],
    evidence: ['c.serviceDrawing', 'c.routeConsole'],
  },
  {
    id: 'd.cipher', thread: 'D', title: 'BOSLUST', solved: (s) => flag(s, 'boslustOpen'),
    discovered: (s) => seen(s, 'c.boslust', 'c.routeRestored', 'c.letterstrook'), available: (s) => flag(s, 'routeRestored'),
    objective: 'Open de deur van BOSLUST in de heuvel.',
    hints: [
      'Zoek in de bibliotheek het voorbeeld over geheimschrift. Het klepje van het slot gaat open met de letterstrook uit de routekamer.',
      'Elke letter in de deurpost is drie plaatsen verschoven. Ga met de letterstrook drie letters terug: W wordt T. De vier woorden zijn getallen.',
      'TWEE VIER EEN DRIE: zet de wieltjes op 2 – 4 – 1 – 3.',
    ],
    evidence: ['c.cipherExample', 'c.boslust', 'c.letterstrook'],
  },
  {
    id: 'd.plates', thread: 'D', title: 'De wortelgang', solved: (s) => flag(s, 'platesSolved'),
    discovered: (s) => flag(s, 'boslustOpen') || seen(s, 'c.plateDiagram'), available: (s) => flag(s, 'boslustOpen'),
    objective: 'Draai de drie platen in de wortelgang tot de gang doorloopt.',
    hints: [
      'Op de muur van de wortelgang staat een tekening van de drie platen. Kijk waar bij elke plaat het koperen nokje zit.',
      'Draai elke plaat tot zijn nokje dezelfde kant op wijst als op de tekening, en trek dan aan de hendel.',
      'Tafelplaat: nokje boven. Boekplaat: nokje rechts. Boomplaat: nokje onder. Dan de hendel.',
    ],
    evidence: ['c.plateDiagram'],
  },
  {
    id: 'd.finale', thread: 'D', title: 'De verzamelzaal', solved: (s) => s.finished,
    discovered: (s) => flag(s, 'platesSolved'), available: (s) => flag(s, 'platesSolved'),
    objective: 'Lees de brief op de tafel in de verzamelzaal.',
    hints: ['De verzamelzaal ligt achter de wortelgang.', 'Op de gedekte tafel ligt een brief.', 'Lees de brief op de tafel.'],
  },
];

export function currentPuzzle(s: GameState): PuzzleDef | null {
  return PUZZLES.find((p) => !p.solved(s) && p.available(s)) ?? PUZZLES.find((p) => !p.solved(s)) ?? null;
}

/** Puzzles discovered (or available) but not solved: the hint menu offers these. */
export function openPuzzles(s: GameState): PuzzleDef[] {
  return PUZZLES.filter((p) => !p.solved(s) && (p.discovered(s) || (p.available(s) && p.thread !== 'D')));
}

export function threadDone(s: GameState, t: ThreadId): boolean {
  if (t === 'A') return owns(s, 'tableSeal');
  if (t === 'B') return owns(s, 'archiveSeal');
  if (t === 'C') return owns(s, 'trailSeal');
  if (t === 'start') return drawerDone(s);
  return s.finished;
}

/** Next step for a thread: its first unsolved puzzle (or a collect-the-seal step when the lock is solved). */
export function threadNext(s: GameState, t: ThreadId): { puzzle: PuzzleDef | null; text: string } {
  const list = PUZZLES.filter((p) => p.thread === t);
  const p = list.find((q) => !q.solved(s)) ?? null;
  if (t === 'A' && !p && !owns(s, 'tableSeal')) return { puzzle: null, text: 'Pak het tafelzegel uit de glazen bovenkast in de serre.' };
  if (t === 'B' && !p && !owns(s, 'archiveSeal')) return { puzzle: null, text: 'Pak het archiefzegel uit het bureau in de studeerkamer.' };
  if (t === 'C' && !p && !owns(s, 'trailSeal')) return { puzzle: null, text: 'Pak het spoorzegel uit de steen bij de tuinlantaarns.' };
  if (t === 'start' && !p && !owns(s, 'ledger')) return { puzzle: null, text: 'Pak het landgoedregister en de schuursleutel uit de lade in de hal.' };
  if (!p) return { puzzle: null, text: threadDone(s, t) ? 'Afgerond.' : '' };
  return { puzzle: p, text: p.objective };
}

/** The thread shown in the objective line: the tracked one, else the first open thread the player has started. */
export function activeThread(s: GameState): ThreadId {
  if (s.track && s.track !== 'auto' && !threadDone(s, s.track as ThreadId)) return s.track as ThreadId;
  if (!drawerDone(s) || !owns(s, 'ledger')) return 'start';
  if (allSeals(s) || flag(s, 'basementOpen')) return 'D';
  const order: ThreadId[] = ['A', 'B', 'C'];
  const started = order.filter((t) => !threadDone(s, t) && PUZZLES.some((p) => p.thread === t && p.discovered(s)));
  return started[0] ?? order.find((t) => !threadDone(s, t)) ?? 'D';
}

export function viewHint(s: GameState, puzzleId: string): number {
  const lvl = Math.min(3, (s.hints[puzzleId] ?? 0) + 1);
  s.hints[puzzleId] = lvl;
  return lvl;
}

export const solvedCount = (s: GameState) => PUZZLES.filter((p) => p.id !== 'p0.home' && p.id !== 'd.finale' && p.solved(s)).length;
export const REQUIRED_COUNT = PUZZLES.length - 2;

// ---------------------------------------------------------------------------------------------
// Tutorial

export function tutorialMissing(s: GameState): string[] {
  return ESSENTIALS.filter((i) => !has(s, i));
}

export function leaveHome(s: GameState): Outcome {
  const missing = tutorialMissing(s);
  if (missing.length) {
    return no(`Je bent nog niet klaar om te gaan. Je mist: ${missing.map((m) => ITEMS[m].name.toLowerCase()).join(', ')}.`, 'locked');
  }
  s.flags.leftHome = true;
  s.scene = 'estate';
  return ok('Op naar het landgoed!', 'success');
}

// ---------------------------------------------------------------------------------------------
// Generic pickup / lock helpers

export function pickup(s: GameState, entityId: string, item: string): Outcome {
  if (s.taken.includes(entityId)) return no('Hier ligt niets meer.', 'none');
  s.taken.push(entityId);
  give(s, item);
  const def = ITEMS[item];
  return ok(`${def?.name ?? item} opgepakt.`, 'pickup');
}

/** Key-based lock. Keys are reusable and never consumed, so a lock can never strand the player. */
export function unlockWithKey(s: GameState, lockId: string, key: string, selected: string | null): Outcome {
  if (s.unlocked.includes(lockId)) return ok('Al open.', 'none');
  if (selected && selected !== key) return no('Die past hier niet.', 'locked');
  if (!has(s, key)) return no('Op slot. Er hoort een sleutel bij.', 'locked');
  s.unlocked.push(lockId);
  return ok(`Ontgrendeld met: ${ITEMS[key].name.toLowerCase()}.`, 'unlock');
}

const unlock = (s: GameState, id: string) => { if (!s.unlocked.includes(id)) s.unlocked.push(id); };

/** Submit a whole-sequence code (hall drawer dials, study buttons). Wrong input only counts an attempt. */
export function submitCode(s: GameState, puzzle: 'drawerLock' | 'studyLock', input: string[]): Outcome {
  const flagName = `${puzzle}Solved`;
  if (flag(s, flagName)) return ok('Dit slot is al open.', 'none');
  if (seqEquals(input, SOLUTIONS[puzzle])) {
    s.flags[flagName] = true;
    if (puzzle === 'drawerLock') { unlock(s, 'lock.hallDrawer'); s.open['hall.drawer'] = true; }
    if (puzzle === 'studyLock') { unlock(s, 'lock.studyCompartment'); s.open['study.compartment'] = true; }
    return ok('Klik! Het slot springt open.', 'unlock');
  }
  s.wrong[puzzle] = (s.wrong[puzzle] ?? 0) + 1;
  return no('Er gebeurt niets. Dat is niet de juiste volgorde.', 'fail');
}

// ---------------------------------------------------------------------------------------------
// Placement puzzles (service plan, library catalogue, route console): pieces are always recoverable;
// the arrangement is judged only when every slot is filled (no correct-prefix oracle).

export type PlaceKind = 'svc' | 'cat' | 'con';
const SLOT_IDS: Record<PlaceKind, string[]> = {
  svc: SERVICE.slots.map((x) => x.id),
  cat: CATALOG.sockets.map((x) => x.id),
  con: CONSOLE_SOCKETS,
};
const PIECES: Record<PlaceKind, string[]> = {
  svc: SERVICE.tags.map((x) => x.id),
  cat: CATALOG.books.map((x) => x.id),
  con: SEALS,
};
const ANSWER: Record<PlaceKind, Record<string, string>> = { svc: SERVICE_ANSWER, cat: CATALOG_ANSWER, con: CONSOLE_ANSWER };
const SOLVED_FLAG: Record<PlaceKind, string> = { svc: 'servicePlanSolved', cat: 'catalogSolved', con: 'routeRestored' };
export const SLOT_KEYS = (Object.keys(SLOT_IDS) as PlaceKind[]).flatMap((k) => SLOT_IDS[k].map((id) => `${k}.${id}`));
export const SLOT_PIECES = PIECES;

export function slotContents(s: GameState, kind: PlaceKind): Record<string, string | null> {
  return Object.fromEntries(SLOT_IDS[kind].map((id) => [id, s.slots[`${kind}.${id}`] ?? null]));
}
/** Pieces not placed yet (service tags and books live at their station; seals must be carried). */
export function loosePieces(s: GameState, kind: PlaceKind): string[] {
  if (kind === 'con') return SEALS.filter((x) => has(s, x));
  const placed = new Set(Object.values(slotContents(s, kind)));
  return PIECES[kind].filter((p) => !placed.has(p));
}
export const placeSolved = (s: GameState, kind: PlaceKind) => flag(s, SOLVED_FLAG[kind]);

export function placePiece(s: GameState, kind: PlaceKind, slot: string, piece: string): Outcome {
  if (flag(s, SOLVED_FLAG[kind])) return no('Alles zit al op zijn plek.', 'none');
  if (!SLOT_IDS[kind].includes(slot) || !PIECES[kind].includes(piece)) return no('Dat past hier niet.', 'fail');
  const inSlot = SLOT_IDS[kind].some((id) => s.slots[`${kind}.${id}`] === piece);
  if (kind === 'con' && !has(s, piece) && !inSlot) return no('Dat heb je niet bij je.', 'fail');
  const key = `${kind}.${slot}`;
  // the piece leaves any other slot; whatever was in this slot goes back (to the station or the bag)
  for (const id of SLOT_IDS[kind]) if (s.slots[`${kind}.${id}`] === piece) s.slots[`${kind}.${id}`] = null;
  const prev = s.slots[key];
  if (kind === 'con') {
    if (prev) give(s, prev);
    s.inventory = s.inventory.filter((i) => i !== piece);
  }
  s.slots[key] = piece;
  return evaluate(s, kind);
}

export function takePiece(s: GameState, kind: PlaceKind, slot: string): Outcome {
  if (flag(s, SOLVED_FLAG[kind])) return no('Dat zit nu vast.', 'none');
  const key = `${kind}.${slot}`;
  const prev = s.slots[key];
  if (!prev) return no('Dit vak is leeg.', 'none');
  s.slots[key] = null;
  if (kind === 'con') give(s, prev);
  return ok('Teruggepakt.', 'pickup');
}

function evaluate(s: GameState, kind: PlaceKind): Outcome {
  const cur = slotContents(s, kind);
  if (Object.values(cur).some((v) => !v)) return ok('Het past in het vak.', 'click');
  const right = Object.entries(ANSWER[kind]).every(([slot, piece]) => cur[slot] === piece);
  if (!right) {
    s.wrong[kind] = (s.wrong[kind] ?? 0) + 1;
    const msg = kind === 'svc' ? 'Alle drie de labels hangen, maar er gebeurt niets. Het rooster klopt nog niet.'
      : kind === 'cat' ? 'Alle vakken zijn gevuld, maar de lade blijft dicht. De catalogus klopt nog niet.'
        : 'De buizen tikken even… en worden weer stil. Niet alle zegels liggen in het goede vak.';
    return no(msg, 'fail');
  }
  s.flags[SOLVED_FLAG[kind]] = true;
  if (kind === 'svc') {
    unlock(s, 'lock.serviceHatch');
    s.open['kitchen.hatch'] = true;
    return ok('Bij de keukenmuur klikt het serveerluik open.', 'chime');
  }
  if (kind === 'cat') {
    unlock(s, 'lock.libraryDesk');
    s.open['library.desk'] = true;
    return ok('Met een zacht klikje schuift de lade van de leestafel open.', 'chime');
  }
  for (const seal of SEALS) if (!s.used.includes(seal)) s.used.push(seal);
  addClue(s, 'c.routeRestored');
  return ok('De buizen zoemen. Op de kaart lichten de lijnen op en lopen samen naar het bos. Uit een gleuf schuift een strook.', 'chime');
}

// ---------------------------------------------------------------------------------------------
// Thread C: fire clearing

export function useOnFirePit(s: GameState, item: string | null): Outcome {
  if (item === 'kindling') {
    if (flag(s, 'firewood')) return no('Er ligt al aanmaakhout in de vuurkuil.', 'none');
    consume(s, 'kindling');
    s.flags.firewood = true;
    return ok('Je legt het aanmaakhout in de vuurkuil. Nu nog een vlam.', 'click');
  }
  if (item === 'matches') {
    if (!flag(s, 'firewood')) return no('Alleen as en natte bladeren. Hier brandt niets van zonder droog aanmaakhout.', 'fail');
    if (s.lit['fire.clearing']) return no('Het vuur brandt al.', 'none');
    s.lit['fire.clearing'] = true;
    s.flags.fireLit = true;
    return ok('Het aanmaakhout vat vlam. Het vuur knettert.', 'fire');
  }
  if (item) return no('Dat helpt niet om vuur te maken.', 'fail');
  if (s.lit['fire.clearing']) {
    s.lit['fire.clearing'] = false;
    return ok('Je dooft het vuur met wat zand.', 'click');
  }
  if (flag(s, 'firewood')) return no('Het aanmaakhout ligt klaar. Kies de lucifers in je tas.', 'none');
  return no('Een kuil met as. Met droog aanmaakhout en een vlam maak je hier vuur.', 'none');
}

export function lightPostLantern(s: GameState): Outcome {
  if (s.lit['lantern.firepost']) return no('De lantaarn brandt al.', 'none');
  if (!s.lit['fire.clearing']) {
    return no('De lantaarnkap is diep en de lucifers zijn te kort. Een brandend takje uit een vuur zou lukken.', 'fail');
  }
  s.lit['lantern.firepost'] = true;
  s.flags.postLanternLit = true;
  return ok('Je steekt een brandend takje in de lantaarn. Warm licht valt op de koperen plaat.', 'fire');
}

export function readFirePlate(s: GameState): Outcome {
  if (!s.lit['lantern.firepost']) return no('In het donker zie je alleen krassen in het koper. Je hebt hier meer licht nodig.', 'none');
  s.flags.firePlateRead = true;
  addClue(s, 'c.firePlate');
  return ok('De gravure is nu goed te lezen.', 'chime');
}

// ---------------------------------------------------------------------------------------------
// Thread C: garden lanterns (complete-attempt evaluation; a wrong order resets only the attempt)

export type LanternResult = 'progress' | 'solved' | 'wrong' | 'already';

export function pressLantern(s: GameState, sym: string): { result: LanternResult; outcome: Outcome } {
  if (flag(s, 'lanternsSolved')) return { result: 'already', outcome: ok('De lantaarns branden al.', 'none') };
  const cur = s.seq.gardenLanterns ?? [];
  if (cur.includes(sym)) return { result: 'progress', outcome: no('Deze lantaarn brandt al.', 'none') };
  const next = [...cur, sym];
  const sol = SOLUTIONS.gardenLanterns;
  if (next.length < sol.length) {
    s.seq.gardenLanterns = next;
    return { result: 'progress', outcome: ok('De lantaarn gaat zacht branden.', 'fire') };
  }
  if (seqEquals(next, sol)) {
    s.seq.gardenLanterns = next;
    s.flags.lanternsSolved = true;
    unlock(s, 'lock.lanternStone');
    s.open['lantern.stone'] = true;
    return { result: 'solved', outcome: ok('De drie lantaarns gloeien op. Met een schurend geluid schuift de platte steen in het midden open.', 'chime') };
  }
  s.seq.gardenLanterns = [];
  s.wrong.gardenLanterns = (s.wrong.gardenLanterns ?? 0) + 1;
  return { result: 'wrong', outcome: no('De derde lantaarn brandt… dan flakkeren ze en doven alle drie. Deze volgorde is het niet.', 'fail') };
}

// ---------------------------------------------------------------------------------------------
// Thread A: four numbered symbol wheels on the conservatory cabinet

export const WHEEL_SYMBOLS = ['driehoek', 'cirkel', 'ruit', 'golf'];
/** Initial wheel faces: the pool's mosaic order read from the steps — the tempting, untransformed reading. */
export const WHEEL_START = ['cirkel', 'driehoek', 'golf', 'ruit'];

export function wheels(s: GameState): string[] {
  if (flag(s, 'cabinetPanelSolved')) return [...SOLUTIONS.cabinetPanel];
  const w = s.seq.cabinetWheels;
  return w && w.length === 4 ? w : [...WHEEL_START];
}

export function turnWheel(s: GameState, i: number): Outcome {
  if (flag(s, 'cabinetPanelSolved')) return ok('De tegels zitten nu vast.', 'none');
  if (!(i >= 0 && i < 4)) return no('', 'none');
  const w = [...wheels(s)];
  w[i] = WHEEL_SYMBOLS[(WHEEL_SYMBOLS.indexOf(w[i]) + 1) % WHEEL_SYMBOLS.length];
  s.seq.cabinetWheels = w;
  if (seqEquals(w, SOLUTIONS.cabinetPanel)) {
    s.flags.cabinetPanelSolved = true;
    unlock(s, 'lock.cabinetUpper');
    s.open['cab.upper'] = true;
    return ok('Klik — de vier tegels vallen op hun plek en de glazen deur zwaait open.', 'unlock');
  }
  return ok('', 'click');
}

// ---------------------------------------------------------------------------------------------
// Convergence: the basement door accepts the three seals (they stay with the player)

export function openBasement(s: GameState): Outcome {
  if (flag(s, 'basementOpen')) return ok('De kelderdeur is open.', 'none');
  addClue(s, 'c.basementDoor');
  const missing = SEALS.filter((x) => !owns(s, x));
  if (missing.length) {
    const where: Record<string, string> = {
      tableSeal: 'het ronde zegel (aan tafel)', archiveSeal: 'het vierkante zegel (in de kantlijn)', trailSeal: 'het zegel in de vorm van een blad (buiten de paden)',
    };
    return no(`De deur heeft drie afdrukken. Je mist nog ${missing.map((m) => where[m]).join(' en ')}.`, 'locked');
  }
  s.flags.basementOpen = true;
  unlock(s, 'lock.basement');
  s.open['door.basement'] = true;
  return ok('Je drukt de drie zegels in hun afdrukken. Iets draait in het slot; de zware deur zwaait open. Een trap gaat naar beneden.', 'unlock');
}

// ---------------------------------------------------------------------------------------------
// BOSLUST: the strip unlatches the cover; then a four-digit wheel lock (neutral feedback)

export function openCipherCover(s: GameState): Outcome {
  if (flag(s, 'boslustCover')) return ok('Het klepje is al open.', 'none');
  addClue(s, 'c.boslust');
  if (!flag(s, 'routeRestored') || !owns(s, 'cipherStrip')) {
    return no('Het klepje over de cijferwieltjes zit vergrendeld. Er zit een smalle gleuf in, zo breed als een strook papier.', 'locked');
  }
  s.flags.boslustCover = true;
  return ok('Je schuift de letterstrook in de gleuf. Het klepje springt open: vier cijferwieltjes.', 'unlock');
}

export function submitDigits(s: GameState, digits: number[]): Outcome {
  if (flag(s, 'boslustOpen')) return ok('De deur is al open.', 'none');
  if (!flag(s, 'boslustCover')) return no('Het klepje zit nog dicht.', 'locked');
  if (seqEquals(digits, SOLUTIONS.boslust)) {
    s.flags.boslustOpen = true;
    unlock(s, 'lock.boslust');
    s.open['door.boslust'] = true;
    return ok('Het slot klikt. De deur van BOSLUST gaat naar binnen open; een koele trap loopt de heuvel in.', 'unlock');
  }
  s.wrong.boslust = (s.wrong.boslust ?? 0) + 1;
  return no('De wieltjes draaien terug. Er gebeurt niets.', 'fail');
}

// ---------------------------------------------------------------------------------------------
// Finale: three route plates, rotate each, then pull the lever (full-attempt feedback)

export function plateRotations(s: GameState): number[] {
  return PLATES.map((p) => (flag(s, 'platesSolved') ? p.target : (s.dials[`plate.${p.id}`] ?? p.start)));
}
export function turnPlate(s: GameState, i: number): Outcome {
  if (flag(s, 'platesSolved')) return ok('De platen zitten vast.', 'none');
  const p = PLATES[i];
  if (!p) return no('', 'none');
  s.dials[`plate.${p.id}`] = ((s.dials[`plate.${p.id}`] ?? p.start) + 1) % 4;
  return ok('', 'click');
}
export function pullPlateLever(s: GameState): Outcome {
  if (flag(s, 'platesSolved')) return ok('De gang is open.', 'none');
  addClue(s, 'c.plateDiagram');
  if (seqEquals(plateRotations(s), SOLUTIONS.plates)) {
    s.flags.platesSolved = true;
    unlock(s, 'lock.gathering');
    s.open['door.gathering'] = true;
    return ok('De platen zakken een stukje en sluiten op elkaar aan. Achter de deur gloeit warm licht.', 'chime');
  }
  s.wrong.plates = (s.wrong.plates ?? 0) + 1;
  return no('De hendel veert terug. De gang loopt nog niet door.', 'fail');
}

// ---------------------------------------------------------------------------------------------
// Optional billiard pattern panel

export function submitBilliard(s: GameState, cells: number[]): Outcome {
  if (flag(s, 'billiardSolved')) return ok('Het paneel brandt al.', 'none');
  const a = [...cells].sort((x, y) => x - y);
  const b = [...SOLUTIONS.billiard].sort((x, y) => x - y);
  if (a.length === b.length && a.every((v, i) => v === b[i])) {
    s.flags.billiardSolved = true;
    addClue(s, 'mem.billiard.scoreboard');
    return ok('Het paneel zoemt. Achter het krijtbord klikt een luikje open.', 'chime');
  }
  s.wrong.billiard = (s.wrong.billiard ?? 0) + 1;
  return no('De lampjes knipperen en doven. Kijk nog eens naar de tafel.', 'fail');
}
