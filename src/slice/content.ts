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

export const CONTENT_STATUS = 'B01 folio ids + detail pairs: canon (DEV-01R). Instruction, hints, DS01 texts: provisional (v0.2 files not available) — see docs/dev01/DEV01_SLICE.md §5';

export interface SourceDef {
  id: string;
  title: string;
  text: string;
  art?: () => string;
  /** Second face (DS01 photo): only shown and recorded after the player actually turns it over. */
  back?: { title: string; text: string; art?: () => string };
  status: 'provisional' | 'canon';
}

// ------------------------------------------------------------------------------------------------ B01
/**
 * The two physical details each folio (a loose drawing sheet) sketches. CANON (DEV-01R brief, Puzzle Design v0.2):
 * stars = telescope on a fork mount + two round screw heads; notebook with three holes.
 * plants = fern with a broad diagonal repair strip; scissors with an angular and a round grip.
 * travel = suitcase with two parallel straps + square middle patch; label with the top-right corner cut off.
 * The player-facing wording below is ours (the literal v0.2 wording was not available): provisional phrasing,
 * canonical details.
 */
export const FOLIO_DETAILS: Record<FolioId, string> = {
  stars: 'een kleine telescoop op een vorkvoet, met twee ronde schroefkoppen waar de kijker in de vork draait, en een schrift met drie gaten langs de rug',
  plants: 'een varenblad met een brede reparatiestrook schuin eroverheen, en een schaar met één hoekige en één ronde greep',
  travel: 'een koffer met twee evenwijdige riemen en een vierkante lap in het midden, en een label waarvan de rechterbovenhoek is afgeknipt',
};
/** Short neutral titles (what is drawn), used in the panel and the notebook. Not subject or room words. */
export const FOLIO_TITLE: Record<FolioId, string> = { stars: 'telescoop en schrift', plants: 'varen en schaar', travel: 'koffer en label' };
const PAIR_TEXT: Record<Subject, string> = {
  sterren: 'Op een tafeltje tegen de muur staat een kleine telescoop op een vorkvoet; waar de kijker in de vork draait, zitten twee ronde schroefkoppen. Ernaast ligt een schrift met drie gaten langs de rug.',
  reizen: 'Op het schrijftafeltje staat een kleine koffer met twee evenwijdige riemen en een vierkante lap in het midden. Ernaast ligt een bagagelabel; de rechterbovenhoek is eraf geknipt.',
  planten: 'Op een tafeltje tegen de muur ligt onder glas een geperst varenblad, met een brede reparatiestrook schuin eroverheen. Ernaast ligt een schaar met één hoekige en één ronde greep.',
};
const CLIP_SHAPE_TEXT: Record<SlotId, string> = { rond: 'rond', punt: 'puntig, als een spitsboog', vierkant: 'vierkant' };
const SUBJECT_CLIP: Record<Subject, SlotId> = { sterren: 'rond', planten: 'punt', reizen: 'vierkant' };
const SUBJECT_FOLIO: Record<Subject, FolioId> = { sterren: 'stars', reizen: 'travel', planten: 'plants' };

/** provisional wording (Puzzle v0.2's literal instruction was not available); concept per canon: loose sheets. */
export const TABLE_TEXT =
  'Een lange leestafel. In het blad zitten drie lege vakken met een koperen rand: een puntig vak, een rond vak en een vierkant vak. ' +
  'Ernaast liggen drie losse tekenbladen, elk met twee schetsjes in potlood. Onder het blad zit een lade zonder sleutelgat.\n\n' +
  'Op een kaartje in het blad: “Ieder tekenblad hoorde ooit met een clip in het archief. Leg het terug in het vak van die clip.”';

// ------------------------------------------------------------------------------------------------ sources
const S = (d: SourceDef) => d;
export const SOURCES: Record<string, SourceDef> = {
  [SRC.table]: S({ id: SRC.table, title: 'Leestafel met drie vakken', text: TABLE_TEXT, status: 'provisional' }),
  ...Object.fromEntries((['stars', 'plants', 'travel'] as FolioId[]).map((f) => [SRC.folio(f), S({
    id: SRC.folio(f), title: `Tekenblad: ${FOLIO_TITLE[f]}`, text: `Een los tekenblad met alleen twee schetsjes in potlood, zonder uitleg: ${FOLIO_DETAILS[f]}.`,
    art: () => D.folioPage(f), status: 'canon',
  })])),
  ...Object.fromEntries((['sterren', 'planten', 'reizen'] as Subject[]).map((s) => [SRC.pair(s), S({
    id: SRC.pair(s), title: s === 'reizen' ? 'Schrijftafeltje' : 'Tafeltje tegen de muur', text: PAIR_TEXT[s], art: () => D.pairView(s), status: 'canon',
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
    context: 'De leestafel met drie vakken en drie tekenbladen.',
    // provisional wording: the literal Puzzle v0.2 hint levels were not available; level semantics per UX canon
    levels: [
      'Kijk goed naar wat er op elk tekenblad getekend staat. Het zijn geen versieringen: het zijn twee echte voorwerpen, met elk een eigen detail.',
      'Elk tekenblad tekent twee voorwerpen die samen op één tafeltje in een kamer boven liggen. Daar ligt ook een archiefclip; de vorm van die clip is het vak voor dat tekenblad.',
      'Telescoop op vorkvoet + schrift met drie gaten → rond vak · varen met reparatiestrook + schaar → puntig vak · koffer met twee riemen + label met afgeknipte hoek → vierkant vak.',
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

export const SUBJECT_OF_FOLIO: Record<FolioId, Subject> = { stars: 'sterren', travel: 'reizen', plants: 'planten' };
export { SUBJECT_CLIP, SUBJECT_FOLIO };
