// DEV-01 player-facing content.
//
// CONTENT STATUS: PROVISIONAL. Puzzle Design v0.2 (exact B01 detail pairs, DS01 texts) and UX_GAME_FEEL v0.2 were
// not available in this repository or its connected workspace when the slice was built. Every string below that
// the brief says must come from those documents is written to the DEV-01 contract and marked `provisional`;
// replace the text here (ids stay stable) once the canon is in hand. Texts taken from the integrated canon of the
// running game (register, mantel, drawer) are reused verbatim and marked `canon`.
import { CLUES } from '../content/clues';
import { MANTEL_HINTS } from '../content/canon';
import { SRC, type FolioId, type Subject, type TopicId, type SlotId } from './ids';
import * as D from './drawings';

export const CONTENT_STATUS = 'provisional: Puzzle Design v0.2 / UX_GAME_FEEL v0.2 not in repo — see docs/dev01/DEV01_SLICE.md §5';

export interface SourceDef {
  id: string;
  title: string;
  text: string;
  art?: () => string;
  /** Second face (DS01 photo): only shown and recorded after the player actually turns it over. */
  back?: { title: string; text: string; art?: () => string };
  status: 'provisional' | 'canon';
}

// ------------------------------------------------------------------------------------------------ B01 (provisional)
/** The two physical details each folio sketches (pencil, no words naming a subject or room). */
export const FOLIO_DETAILS: Record<FolioId, string> = {
  I: 'een rond dopje aan een touwtje, met “groen” erbij geschreven, en een kaartje met sterren waarvan er vijf in een W staan, omcirkeld, met “rood” erbij',
  II: 'een kompasje met een barst dwars over het glas, en een treinkaartje met één rond gaatje erin',
  III: 'een varenblad waarvan de punt is afgescheurd, en een bloempot met één band, met “blauw” erbij',
};
const PAIR_TEXT: Record<Subject, string> = {
  sterren: 'Op een tafeltje tegen de muur liggen de lensdop van een telescoop, aan een groen koordje, en een kleine sterrenkaart. Op die kaart is met rode inkt een groepje van vijf sterren omcirkeld, in de vorm van een W.',
  reizen: 'Op het schrijftafeltje liggen een zakkompas, met een barst dwars over het glas, en een oud treinkaartje met één rond geknipt gaatje.',
  planten: 'Op een tafeltje tegen de muur staat een terracotta potje met één blauwe band. Ernaast ligt onder glas een geperst varenblad; de punt is eraf gescheurd.',
};
const CLIP_SHAPE_TEXT: Record<SlotId, string> = { rond: 'rond', punt: 'puntig, als een spitsboog', vierkant: 'vierkant' };
const SUBJECT_CLIP: Record<Subject, SlotId> = { sterren: 'rond', planten: 'punt', reizen: 'vierkant' };
const SUBJECT_FOLIO: Record<Subject, FolioId> = { sterren: 'I', reizen: 'II', planten: 'III' };

export const TABLE_TEXT =
  'Een lange leestafel. In het blad zitten drie lege vakken met een koperen rand: een puntig vak, een rond vak en een vierkant vak. ' +
  'Ernaast liggen drie dichte mappen, genummerd I, II en III. Onder het blad zit een lade zonder sleutelgat.\n\n' +
  'Op een kaartje in het blad: “Iedere map is ooit met een clip uit het archief gehaald. Leg hem terug in het vak van die clip.”';

// ------------------------------------------------------------------------------------------------ sources
const S = (d: SourceDef) => d;
export const SOURCES: Record<string, SourceDef> = {
  [SRC.table]: S({ id: SRC.table, title: 'Leestafel met drie vakken', text: TABLE_TEXT, status: 'provisional' }),
  ...Object.fromEntries((['I', 'II', 'III'] as FolioId[]).map((f) => [SRC.folio(f), S({
    id: SRC.folio(f), title: `Map ${f}`, text: `In de map zitten alleen twee schetsjes in potlood, zonder uitleg: ${FOLIO_DETAILS[f]}.`,
    art: () => D.folioPage(f), status: 'provisional',
  })])),
  ...Object.fromEntries((['sterren', 'planten', 'reizen'] as Subject[]).map((s) => [SRC.pair(s), S({
    id: SRC.pair(s), title: s === 'reizen' ? 'Schrijftafeltje' : 'Tafeltje tegen de muur', text: PAIR_TEXT[s], art: () => D.pairView(s), status: 'provisional',
  })])),
  ...Object.fromEntries((['sterren', 'planten', 'reizen'] as Subject[]).map((s) => [SRC.clip(s), S({
    id: SRC.clip(s), title: 'Archiefclip', text: `Naast de voorwerpen ligt een leeg archiefkaartje, vastgezet met een koperen clip. De clip is ${CLIP_SHAPE_TEXT[SUBJECT_CLIP[s]]}.`,
    art: () => D.clipCard(SUBJECT_CLIP[s]), status: 'provisional',
  })])),
  [SRC.archiveCard]: S({ id: SRC.archiveCard, title: 'Kaartje in de lade', text: '“De studeerkamer bewaart wat werd opgeschreven. Het bureau gaat open voor wie de ochtendwandeling kent.”', status: 'canon' }),
  // ---------------------------------------------------------------------------------------------- DS01 (provisional)
  [SRC.dsNote]: S({
    id: SRC.dsNote, title: 'Notitie bij de maquette',
    text: '“Wie de oude weekendhuizen wil zien: ze zitten in het album Weekendhuizen, in de bibliotheek, op het lage tafeltje bij de leunstoel. Graag terugleggen na het kijken.”',
    art: D.noteCard, status: 'provisional',
  }),
  [SRC.dsAlbum]: S({
    id: SRC.dsAlbum, title: 'Album “Weekendhuizen”',
    text: 'Een album met foto’s van huisjes en huizen, elk met een jaartal in potlood. Op de laatste beschreven bladzijde is één plek leeg: vier zwarte fotohoekjes zonder foto. Eronder in potlood: “Het huisje aan het water — het eerste weekend.”',
    art: D.albumSpread, status: 'provisional',
  }),
  [SRC.dsLetter]: S({
    id: SRC.dsLetter, title: 'Briefje in het album',
    text: '“Sorry! Er ging thee over de foto van het huisje aan het water. Ik heb hem boven laten drogen, op het rekje bij het raam in de kamer met de koffers. Niet terugplakken voor hij weer helemaal plat is. — J.”',
    art: D.letterSheet, status: 'provisional',
  }),
  [SRC.dsPhoto]: S({
    id: SRC.dsPhoto, title: 'Foto op het droogrekje',
    text: 'Een kleine zwart-witfoto, nog licht gegolfd: een laag huisje aan het water, met vier fietsen tegen de gevel. In een hoek een vage bruine kring.',
    art: D.photoFront,
    back: { title: 'Achterkant van de foto', text: 'Op de achterkant, in potlood: “Het eerste weekend. Iedereen te laat, niemand erg.” De bruine kring loopt door tot op de achterkant.', art: D.photoBack },
    status: 'provisional',
  }),
};

/** DS01 memory in the Archief (given once, on the first look at the photo's front). Neutral: never "understood". */
export const DS01_MEMORY = { id: 'ds01.memory', title: 'Het huisje aan het water', text: 'Bekeken: de foto van het huisje aan het water, op het droogrekje boven.' };

// ------------------------------------------------------------------------------------------------ invitation (slice variant)
/**
 * Iteration-3 invitation minus the paragraph that names the three parts of the route: before the register is read,
 * nothing in the notebook may show the three main topics (DEV-01 §6). provisional.
 */
export const INVITATION_SLICE =
  '“We hebben alles klaargezet. Zoek uit waar we samenkomen.”\n\nDit jaar niet op de gewone plek.\n\n' +
  'Begin in de hal: daar staat een ladekast met een slot. Op de schoorsteenmantel staan drie voorwerpen op kleine messing voetjes. ' +
  'Alleen die drie horen bij de lade. Lees ze van links naar rechts, terwijl je voor de haard staat.\n\n— de Kwartiermaker';

// ------------------------------------------------------------------------------------------------ register topics (canon)
/** The three topics the register names, with the register's own line for each (verbatim from c.ledger). */
export const REGISTER_TOPICS: { id: TopicId; title: string; line: string }[] = [
  { id: 'tafel', title: 'Aan tafel', line: 'Een rond zegel bij AAN TAFEL (eetkamer, keuken, serre).' },
  { id: 'kantlijn', title: 'In de kantlijn', line: 'Een vierkant zegel bij IN DE KANTLIJN (bibliotheek, studeerkamer).' },
  { id: 'paden', title: 'Buiten de paden', line: 'Een zegel in de vorm van een blad bij BUITEN DE PADEN (de schuur in het bos, het vuur, de tuin).' },
];
export const REGISTER_TEXT = CLUES['c.ledger'].text;

// ------------------------------------------------------------------------------------------------ hints
export interface HintSet { context: string; levels: [string, string, string] }
/** Level 0 names the riddle only; 1 = attention, 2 = relation, 3 = explicit solution. */
export const SLICE_HINTS: Record<'drawer' | 'b01', HintSet> = {
  drawer: { context: 'Het slot op de ladekast in de hal.', levels: MANTEL_HINTS },
  b01: {
    context: 'De leestafel met drie vakken en drie mappen.',
    levels: [
      'Kijk goed naar wat er in elke map getekend staat. Het zijn geen versieringen: het zijn twee echte voorwerpen.',
      'Elke map tekent twee voorwerpen die samen op één tafeltje in een kamer boven liggen. Daar ligt ook een archiefclip; de vorm van die clip is het vak voor die map.',
      `Map I (lensdop + omcirkelde sterren) → rond vak · Map II (kompas + treinkaartje) → vierkant vak · Map III (varenblad + pot met blauwe band) → puntig vak.`,
    ],
  },
};
export const HINT_LEVEL_NAMES = ['Aandacht', 'Verband', 'Oplossing'] as const;

// ------------------------------------------------------------------------------------------------ results (outcome log)
export const RESULT_TEXT: Record<string, string> = {
  'drawer.solved': 'De lade van de ladekast in de hal ging open.',
  'drawer.register': 'Je nam het landgoedregister uit de lade in de hal.',
  'b01.solved': 'De lade van de leestafel in de bibliotheek schoof open.',
  'b01.studyKey': 'Je nam de messing sleutel uit de lade van de leestafel.',
  'ds01.memory': 'Een herinnering bewaard in je archief.',
};

export const SUBJECT_OF_FOLIO: Record<FolioId, Subject> = { I: 'sterren', II: 'reizen', III: 'planten' };
export { SUBJECT_CLIP, SUBJECT_FOLIO };
