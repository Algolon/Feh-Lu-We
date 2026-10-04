// Pure puzzle and progression rules. World objects call these; unit tests call them too.
// Every function mutates the given GameState and returns a player-facing outcome.
import { type GameState, has, flag, give, consume, addClue } from '../core/state';
import { ESSENTIALS, ITEMS } from '../content/items';

export type Sfx = 'click' | 'pickup' | 'success' | 'fail' | 'locked' | 'unlock' | 'fire' | 'chime' | 'crank' | 'none';

export interface Outcome {
  ok: boolean;
  msg: string;
  sfx: Sfx;
}
const ok = (msg: string, sfx: Sfx = 'success'): Outcome => ({ ok: true, msg, sfx });
const no = (msg: string, sfx: Sfx = 'fail'): Outcome => ({ ok: false, msg, sfx });

// Fixed, deterministic solutions. Documented in docs/PUZZLE_SOLUTIONS.md.
export const SOLUTIONS = {
  drawerLock: ['veer', 'dennenappel', 'kopje'],
  studyLock: ['put', 'schuur', 'vuur'],
  gardenLanterns: ['maan', 'blad', 'zon'],
  cabinetPanel: ['ruit', 'golf', 'driehoek', 'cirkel'],
  cottageSlots: { left: 'token', right: 'crest' } as Record<string, string>,
  billiard: [0, 5, 8], // optional: cell indexes (row*3+col) of coloured balls
};

export const LOCK_OPTIONS = {
  drawerLock: ['kaars', 'veer', 'klok', 'dennenappel', 'ster', 'kopje'],
  studyLock: ['put', 'schuur', 'vuur'],
  cabinetPanel: ['driehoek', 'cirkel', 'ruit', 'golf'],
};

export const seqEquals = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

// ---------------------------------------------------------------------------------------------
// Required puzzle chain (for hints, objectives and the progression test)
export interface PuzzleDef {
  id: string;
  title: string;
  solved: (s: GameState) => boolean;
  objective: string;
  hints: [string, string, string];
}

export const PUZZLES: PuzzleDef[] = [
  {
    id: 'p0.home', title: 'Inpakken', solved: (s) => s.scene === 'estate' || flag(s, 'leftHome'),
    objective: 'Pak je spullen en vertrek via de voordeur.',
    hints: [
      'Kijk op de ronde tafel en in de lade van het dressoir.',
      'Je hebt de uitnodiging, zaklamp, lucifers, het notitieboek en de sleutel van het landhuis nodig.',
      'Pak alles van de tafel, open de lade van het dressoir voor de sleutel en loop dan naar de voordeur.',
    ],
  },
  {
    id: 'p1.drawer', title: 'De lade in de hal', solved: (s) => flag(s, 'drawerLockSolved'),
    objective: 'Vind uit wat er in de hal voor je klaarstaat.',
    hints: [
      'Lees de uitnodiging nog eens, en bekijk de schoorsteenmantel in de woonkamer links van de hal.',
      'De drie tekeningetjes op de uitnodiging staan ook op de mantel. Hun volgorde van links naar rechts is de code voor het slot op de lade in de hal.',
      'Zet de wieltjes op: Veer – Dennenappel – Kopje.',
    ],
  },
  {
    id: 'p2.study', title: 'De studeerkamer', solved: (s) => flag(s, 'studyLockSolved'),
    objective: 'Ga met de messing sleutel naar boven.',
    hints: [
      'De studeerkamer is boven, links op de overloop. Lees het briefje op het bureau en bekijk de ingelijste kaart.',
      'Op de kaart staan put, schuur en vuurplaats. De zon komt op in het oosten: begin bij de plek die het verst naar het oosten ligt.',
      'Druk op het bureauslot: Put – Schuur – Vuur.',
    ],
  },
  {
    id: 'p3.shed', title: 'De schuur', solved: (s) => has(s, 'kindling') || flag(s, 'firewood') || s.used.includes('kindling'),
    objective: 'Zoek de schuur in het westelijke bos.',
    hints: [
      'De schuur staat in het bos ten westen van de oprijlaan. Volg het pad vanaf het voorplein naar links.',
      'Open de schuur met de schuursleutel. Het is er donker: zet je zaklamp aan via je tas en bekijk alles goed.',
      'Pak het aanmaakhout, open de lade van de werkbank voor de houten penning en lees het gereedschapsbord.',
    ],
  },
  {
    id: 'p4.fire', title: 'De vuurplaats', solved: (s) => flag(s, 'firePlateRead'),
    objective: 'Maak vuur bij de vuurplaats in het bos.',
    hints: [
      'De vuurplaats ligt in het zuidwesten van het bos, voorbij de schuur.',
      'Kies het aanmaakhout in je tas en leg het in de vuurkuil. Kies daarna de lucifers. Steek dan de lantaarn op de paal aan bij het vuur.',
      'Lees in het lantaarnlicht de koperen plaat: Maan – Blad – Zon.',
    ],
  },
  {
    id: 'p5.lanterns', title: 'De tuinlantaarns', solved: (s) => flag(s, 'lanternsSolved'),
    objective: 'Ontsteek de lantaarns in de tuin.',
    hints: [
      'De drie lantaarns staan op het grasveld achter het landhuis.',
      'De koperen plaat bij de vuurplaats geeft de volgorde waarin je ze aansteekt.',
      'Steek ze aan in de volgorde Maan, Blad, Zon.',
    ],
  },
  {
    id: 'p6.cabinet', title: 'De kast in de serre', solved: (s) => flag(s, 'cabinetPanelSolved'),
    objective: 'Open de bovenkast in de serre.',
    hints: [
      'Bekijk de mozaïektekens op de bodem van het zwembad, en het houten bord in de barrelsauna naast de serre.',
      'Het bord zegt dat je van diep naar ondiep leest. Het trapje zit aan het ondiepe eind; lees de tekens dus in omgekeerde volgorde.',
      'Druk op het paneel: Ruit – Golf – Driehoek – Cirkel.',
    ],
  },
  {
    id: 'p7.well', title: 'De put', solved: (s) => has(s, 'cottageKey') || s.used.includes('cottageKey'),
    objective: 'Haal op wat er in de put ligt.',
    hints: [
      'De put staat in het oostelijke bos. Je hebt de zwengel uit de onderkast in de serre nodig.',
      'Kies de zwengel in je tas, gebruik hem op de put en draai. Zorg dat je het wapenschild uit de bovenkast bij je hebt.',
      'Zwengel plaatsen, draaien, kistje openen met het wapenschild: daarin liggen de sleutel van het huisje en de snipper.',
    ],
  },
  {
    id: 'p8.cottage', title: 'Het huisje', solved: (s) => flag(s, 'cottageSolved'),
    objective: 'Ga naar het huisje bij de vijver.',
    hints: [
      'Het witte huisje met het oranje dak staat in de noordwesthoek van de tuin, bij de vijver.',
      'Lees de snipper: links wat uit het bos komt, rechts wat uit het huis komt.',
      'Leg de houten penning in de linkernis en het wapenschild in de rechternis.',
    ],
  },
];

export function currentPuzzle(s: GameState): PuzzleDef | null {
  return PUZZLES.find((p) => !p.solved(s)) ?? null;
}

export function viewHint(s: GameState, puzzleId: string): number {
  const lvl = Math.min(3, (s.hints[puzzleId] ?? 0) + 1);
  s.hints[puzzleId] = lvl;
  return lvl;
}

export const solvedCount = (s: GameState) => PUZZLES.filter((p) => p.id !== 'p0.home' && p.solved(s)).length;

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

/** Submit a whole-sequence code (drawer dial lock, study buttons, cabinet panel). Wrong input only counts an attempt. */
export function submitCode(s: GameState, puzzle: 'drawerLock' | 'studyLock' | 'cabinetPanel', input: string[]): Outcome {
  const flagName = `${puzzle}Solved`;
  if (flag(s, flagName)) return ok('Dit slot is al open.', 'none');
  if (seqEquals(input, SOLUTIONS[puzzle])) {
    s.flags[flagName] = true;
    if (puzzle === 'drawerLock') s.unlocked.push('lock.hallDrawer');
    if (puzzle === 'studyLock') s.unlocked.push('lock.studyCompartment');
    if (puzzle === 'cabinetPanel') s.unlocked.push('lock.cabinetUpper');
    return ok('Klik! Het slot springt open.', 'unlock');
  }
  s.wrong[puzzle] = (s.wrong[puzzle] ?? 0) + 1;
  return no('Er gebeurt niets. Dat is niet de juiste volgorde.', 'fail');
}

// ---------------------------------------------------------------------------------------------
// Beat 4: fire clearing

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
// Beat 5: garden lanterns (incremental sequence; a wrong lantern resets only the attempt)

export type LanternResult = 'progress' | 'solved' | 'wrong' | 'already';

export function pressLantern(s: GameState, sym: string): { result: LanternResult; outcome: Outcome } {
  if (flag(s, 'lanternsSolved')) return { result: 'already', outcome: ok('De lantaarns branden al.', 'none') };
  const cur = s.seq.gardenLanterns ?? [];
  if (cur.includes(sym)) return { result: 'progress', outcome: no('Deze lantaarn brandt al.', 'none') };
  const next = [...cur, sym];
  const sol = SOLUTIONS.gardenLanterns;
  if (next[next.length - 1] !== sol[next.length - 1]) {
    s.seq.gardenLanterns = [];
    s.wrong.gardenLanterns = (s.wrong.gardenLanterns ?? 0) + 1;
    return { result: 'wrong', outcome: no('Sssst… alle lantaarns doven. Die volgorde klopt niet.', 'fail') };
  }
  if (next.length === sol.length) {
    s.seq.gardenLanterns = next;
    s.flags.lanternsSolved = true;
    s.unlocked.push('lock.cabinetLower');
    return { result: 'solved', outcome: ok('De drie lantaarns branden. In de verte, uit de serre, klinkt een klik.', 'chime') };
  }
  s.seq.gardenLanterns = next;
  return { result: 'progress', outcome: ok('De lantaarn gaat zacht branden.', 'fire') };
}

// ---------------------------------------------------------------------------------------------
// Beat 7: well

export function useOnWell(s: GameState, item: string | null): Outcome {
  if (item === 'crank') {
    if (flag(s, 'crankInstalled')) return no('De zwengel zit er al op.', 'none');
    consume(s, 'crank');
    s.flags.crankInstalled = true;
    return ok('De zwengel past precies op de as van de put.', 'click');
  }
  if (item) return no('Dat past niet op de put.', 'fail');
  if (!flag(s, 'crankInstalled')) return no('Aan de as van de put ontbreekt een zwengel. Zonder zwengel krijg je de emmer niet omhoog.', 'locked');
  if (!flag(s, 'wellRaised')) {
    s.flags.wellRaised = true;
    if (!has(s, 'crest')) {
      return no('Krakend komt de emmer boven. Erin staat een ijzeren kistje met een slot in de vorm van een schild. Zonder het wapenschild gaat het niet open.', 'crank');
    }
  }
  return openWellBox(s);
}

export function openWellBox(s: GameState): Outcome {
  if (!flag(s, 'wellRaised')) return no('De emmer hangt nog diep in de put.', 'none');
  if (flag(s, 'wellOpened')) return no('Het kistje is leeg.', 'none');
  if (!has(s, 'crest')) return no('Het kistje heeft een slot in de vorm van een schild. Je hebt het wapenschild nodig — dat zit in de bovenkast in de serre.', 'locked');
  s.flags.wellOpened = true;
  give(s, 'cottageKey');
  give(s, 'fragment');
  addClue(s, 'c.fragment');
  return ok('Het wapenschild past in het slot. In het kistje: de sleutel van het huisje en een snipper van de uitnodiging.', 'unlock');
}

// ---------------------------------------------------------------------------------------------
// Beat 8: cottage slots (items can always be taken back out until solved)

export function placeInSlot(s: GameState, slot: 'left' | 'right', item: string): Outcome {
  if (flag(s, 'cottageSolved')) return no('De deur staat al open.', 'none');
  if (!has(s, item)) return no('Dat heb je niet bij je.', 'fail');
  const prev = s.slots[slot];
  if (prev) give(s, prev);
  s.inventory = s.inventory.filter((i) => i !== item);
  s.slots[slot] = item;
  return evaluateSlots(s);
}

export function takeFromSlot(s: GameState, slot: 'left' | 'right'): Outcome {
  if (flag(s, 'cottageSolved')) return no('Dat zit nu vast.', 'none');
  const prev = s.slots[slot];
  if (!prev) return no('De nis is leeg.', 'none');
  s.slots[slot] = null;
  give(s, prev);
  return ok(`${ITEMS[prev].name} teruggepakt.`, 'pickup');
}

function evaluateSlots(s: GameState): Outcome {
  const sol = SOLUTIONS.cottageSlots;
  const l = s.slots.left, r = s.slots.right;
  if (l && r) {
    if (l === sol.left && r === sol.right) {
      s.flags.cottageSolved = true;
      s.unlocked.push('lock.gathering');
      // Placed items stay in the niches as part of the ending scene.
      for (const i of [l, r]) if (!s.used.includes(i)) s.used.push(i);
      return ok('Beide nissen klikken. Langzaam zwaait de deur naar de zaal open.', 'chime');
    }
    s.wrong.cottageSlots = (s.wrong.cottageSlots ?? 0) + 1;
    return no('Beide nissen zijn gevuld, maar de deur blijft dicht. Klopt de volgorde wel?', 'fail');
  }
  return ok('Het past in de nis.', 'click');
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
