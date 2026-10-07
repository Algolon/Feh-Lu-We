// DEV-01 player-facing content.
//
// CONTENT STATUS (DEV-01R final): every B01/DS01 text that PUZZLE_DESIGN v0.2 gives literally (table instruction,
// hint levels, DS01 A text, B page title and letter, C raw inspection, C back, DS01 hints) is copied verbatim from
// docs/design/v0.2/PUZZLE_DESIGN.md and marked `canon`. Source titles and the practice-card / cluster transcripts are
// our wording of canonical details (PD §4.2 / §6.2 give the details, not the sentences). Texts of the running game
// (register, mantel, drawer, study card) are reused verbatim.
import { CLUES } from '../content/clues';
import { MANTEL_HINTS } from '../content/canon';
import { SRC, type FolioId, type Subject, type TopicId, type SlotId } from './ids';
import * as D from './drawings';

export const CONTENT_STATUS = 'B01 + DS01: canon from docs/design/v0.2/PUZZLE_DESIGN.md (DEV-01R final) — see docs/dev01/DEV01_SLICE.md §5';

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
/** The two physical details each folio (a loose drawing sheet) sketches — literal from PUZZLE_DESIGN v0.2 §4.2. */
export const FOLIO_DETAILS: Record<FolioId, string> = {
  stars: 'telescoop op vorkvoet met twee ronde schroefkoppen; gesloten schrift met drie gaten naast elkaar',
  plants: 'geperste varen onder glas met één brede diagonale reparatiestrook; schaar met één hoekige en één ronde greep',
  travel: 'koffer met twee parallelle riemen en vierkante middenpatch; label met afgesneden rechterbovenhoek',
};
/** Short neutral titles (what is drawn), used in the panel and the notebook. Not subject or room words. */
export const FOLIO_TITLE: Record<FolioId, string> = { stars: 'telescoop en schrift', plants: 'varen en schaar', travel: 'koffer en label' };
const CLIP_SHAPE_TEXT: Record<SlotId, string> = { rond: 'rond', punt: 'puntig, als een spitsboog', vierkant: 'vierkant' };
const SUBJECT_CLIP: Record<Subject, SlotId> = { sterren: 'rond', planten: 'punt', reizen: 'vierkant' };
const SUBJECT_FOLIO: Record<Subject, FolioId> = { sterren: 'stars', reizen: 'travel', planten: 'plants' };
/**
 * One inspection cluster per pair (PD §4.2 UX-contract, UX U01): both originals plus the archive clip that is
 * physically attached to them — round clip on the notebook, pointed clip on the glass plate, square clip through
 * the label's hole. Raw transcript only: never "so this sheet goes in that slot".
 */
const CLUSTER: Record<Subject, { title: string; text: string }> = {
  sterren: {
    title: 'Tafeltje met telescoop en schrift',
    text: `Op een tafeltje tegen de muur: een telescoop op vorkvoet met twee ronde schroefkoppen, en een gesloten schrift met drie gaten naast elkaar. Aan het schrift zit een koperen archiefclip. De clip is ${CLIP_SHAPE_TEXT.rond}.`,
  },
  planten: {
    title: 'Tafeltje met varen en schaar',
    text: `Op een tafeltje tegen de muur: een geperste varen onder glas met één brede diagonale reparatiestrook, en een schaar met één hoekige en één ronde greep. Aan de glasplaat zit een koperen archiefclip. De clip is ${CLIP_SHAPE_TEXT.punt}.`,
  },
  reizen: {
    title: 'Schrijftafeltje met koffer en label',
    text: `Op het schrijftafeltje: een koffer met twee parallelle riemen en een vierkante middenpatch, en een label met afgesneden rechterbovenhoek. Door het gat van het label zit een koperen archiefclip. De clip is ${CLIP_SHAPE_TEXT.vierkant}.`,
  },
};

/** PD §4.2 "Letterlijke instructie" (canon), on a card in the table top. The description before it is ours. */
export const B01_INSTRUCTION =
  'Deze losse tekenbladen horen bij drie objectgroepen boven. Vergelijk beide getekende details met hun originelen. ' +
  'De archiefclip aan de passende groep heeft de vorm van het juiste vak. Een losse overeenkomst is niet genoeg.';
export const TABLE_TEXT =
  'Een lange leestafel. In het blad zitten drie lege vakken met een koperen rand: een puntig vak, een rond vak en een vierkant vak. ' +
  'Ernaast liggen drie losse tekenbladen, elk met twee schetsjes in potlood, en een oefenkaart. Onder het blad zit een lade zonder sleutelgat.\n\n' +
  `Op een kaartje in het blad: “${B01_INSTRUCTION}”`;
/** PD §4.2 "Lokale oefenkaart" (canon elements; transcript wording ours). Teaches the relation; not a fourth slot. */
export const PRACTICE_TEXT =
  'Op de kaart staan in potlood een sleutel met drie tanden en een gestreepte koordlus, en daarnaast een getekend vak in de vorm van een golf. ' +
  'Naast de kaart liggen de echte sleutel met drie tanden en de gestreepte koordlus, samen aan een koperen clip in de vorm van een golf.';

// ------------------------------------------------------------------------------------------------ sources
const S = (d: SourceDef) => d;
export const SOURCES: Record<string, SourceDef> = {
  [SRC.table]: S({ id: SRC.table, title: 'Leestafel met drie vakken', text: TABLE_TEXT, status: 'canon' }),
  [SRC.practice]: S({ id: SRC.practice, title: 'Oefenkaart op de leestafel', text: PRACTICE_TEXT, art: D.practiceCard, status: 'canon' }),
  ...Object.fromEntries((['stars', 'plants', 'travel'] as FolioId[]).map((f) => [SRC.folio(f), S({
    id: SRC.folio(f), title: `Tekenblad: ${FOLIO_TITLE[f]}`, text: `Een los tekenblad met alleen twee schetsjes in potlood, zonder uitleg. Getekend: ${FOLIO_DETAILS[f]}.`,
    art: () => D.folioPage(f), status: 'canon',
  })])),
  ...Object.fromEntries((['sterren', 'planten', 'reizen'] as Subject[]).map((s) => [SRC.pair(s), S({
    id: SRC.pair(s), title: CLUSTER[s].title, text: CLUSTER[s].text, art: () => D.pairView(s), status: 'canon',
  })])),
  [SRC.archiveCard]: S({ id: SRC.archiveCard, title: 'Kaartje in de lade', text: '“De studeerkamer bewaart wat werd opgeschreven. Het bureau gaat open voor wie de ochtendwandeling kent.”', status: 'canon' }),
  // ---------------------------------------------------------------------------------------------- DS01 (PD §6.2, literal)
  [SRC.dsNote]: S({
    id: SRC.dsNote, title: 'Gevouwen notitie bij de maquette',
    text: '“De afbeelding van het eerste huisje zit in het album Weekendhuizen, op de leesplank beneden. De maquette staat alvast hier. — G.M.”',
    art: D.noteCard, status: 'canon',
  }),
  [SRC.dsAlbum]: S({
    id: SRC.dsAlbum, title: 'Album “Weekendhuizen”',
    text: 'Het album ligt open op de bladzijde “Gingerbread house — het eerste huisje”. Op die bladzijde: lege fotohoekjes en een rechthoekig verbleekt vlak. ' +
      'In het album ligt een los briefje:\n\n“Er kwam water op de foto. Om hem te laten drogen hangt hij nu boven bij het raam, naast de koffers en het kleine droogrek. Het album laat ik hier. — G.M.”',
    art: D.albumSpread, status: 'canon',
  }),
  [SRC.dsPhoto]: S({
    id: SRC.dsPhoto, title: 'Afbeelding aan het droogrek',
    text: 'Een licht gegolfde afbeelding hangt met twee houten wasknijpers aan een klein rek bij het raam. Onderaan staat: Gingerbread house — het eerste huisje.',
    art: D.photoFront,
    back: { title: 'Achterzijde van de afbeelding', text: 'Weekendhuizen · blad: het eerste huisje. Album op de leesplank in de bibliotheek. De afbeelding hoort bij de maquette in de hal.', art: D.photoBack },
    status: 'canon',
  }),
};

/** PD §6.4: the one-time notice on the first look at the front. */
export const DS01_FOUND_NOTICE = 'Afbeelding bewaard in notities';
/**
 * DS01 entry in the Archief, given once on the first look at the front (PD §6.4). The player title appears only now
 * (PD §6.1); label "Bekeken", never "Opgelost" (UX §4.1). Image + caption, no claim of understanding.
 */
export const DS01_MEMORY = { id: 'ds01.memory', title: 'De foto die moest drogen', text: 'Gingerbread house — het eerste huisje.', art: D.photoFront };

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
/** Level 0 names the riddle and explains the levels; 1 = attention, 2 = relation, 3 = explicit solution (UX §5). */
export const SLICE_HINTS: Record<'drawer' | 'b01' | 'ds01', HintSet> = {
  drawer: { context: 'Het slot op de ladekast in de hal.', levels: MANTEL_HINTS },
  b01: {
    context: 'De leestafel met drie vakken en drie tekenbladen.',
    // PD §4.2, literal
    levels: [
      'Zoek boven de objectgroepen uit de tekeningen.',
      'Vergelijk beide details; de clip aan de juiste groep bepaalt het vak.',
      'Telescoopfolio rond, varenfolio puntig, kofferfolio vierkant.',
    ],
  },
  ds01: {
    // context line is chosen from what the player has seen (model.hintContexts); PD §6.6 levels, literal
    context: 'Waar is de foto uit het album gebleven?',
    levels: [
      'Kijk naar de titel en herkomst van de afbeelding. Het album en de maquette vertellen iets over hetzelfde huisje.',
      'De lege fotohoek laat zien waar de afbeelding hoorde. Het losse briefje vertelt waarom hij naar een droogplek boven verhuisde.',
      'De afbeelding hangt aan het droogrek bij het raam in de kamer met koffers. Het album ligt op de leesplank in de bibliotheek; de maquette staat in de hal.',
    ],
  },
};
export const HINT_LEVEL_NAMES = ['Aandacht', 'Relatie', 'Oplossing'] as const;

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
