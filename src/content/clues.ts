// Notebook entries. Inspecting the matching object in the world records the entry.
// Answers must always be derivable from these texts + the 3D world (see docs/PUZZLE_SOLUTIONS.md).
import { MEMORIES } from './memories';
import { MANTEL_TEXT, DRAWER_DIAL } from './canon';
import { SYMBOLS } from './symbols';

export interface ClueDef {
  id: string;
  title: string;
  text: string;
  symbols?: string[];
  symbolsLayout?: 'ring' | 'row' | 'arrow';
  diagram?: 'forestMap' | 'saunaPool' | 'billiardExamples' | 'poolTiles' | 'mantel' | 'brassStands';
  memory?: boolean;
}

const K = '— de Kwartiermaker';

export const CLUES: Record<string, ClueDef> = {
  'c.invitation': {
    id: 'c.invitation',
    title: 'Uitnodiging',
    text: `“We hebben alles klaargezet. Zoek uit waar we samenkomen.”\n\nDe voordeur van het landhuis gaat open met de sleutel die je meeneemt. In de hal staat een ladekast met een slot.\n\nOp de schoorsteenmantel staan drie voorwerpen op kleine messing voetjes. Alleen die drie horen bij de lade. Lees ze van links naar rechts, terwijl je voor de haard staat.\n\n${K}`,
    diagram: 'brassStands',
  },
  'c.mantel': {
    id: 'c.mantel',
    title: 'Schoorsteenmantel',
    text: MANTEL_TEXT,
    diagram: 'mantel',
  },
  'c.drawerLock': {
    id: 'c.drawerLock',
    title: 'Slot op de ladekast in de hal',
    text: `De lade van de ladekast in de hal zit vast met een slot van drie draaiwieltjes. Op elk wieltje staan dezelfde zes tekeningetjes: ${DRAWER_DIAL.map((d) => SYMBOLS[d].name.toLowerCase()).join(', ')}.`,
  },
  'c.studyNote': {
    id: 'c.studyNote',
    title: 'Briefje op het bureau',
    text: `Voor de schuursleutel: druk de drie plekken van mijn ochtendwandeling in, in de volgorde van de gestippelde route op de kaart aan de muur.\n\n${K}`,
  },
  'c.forestMap': {
    id: 'c.forestMap',
    title: 'Ingelijste kaart van het bos',
    text: 'Een kaart van het bos voor het landhuis. Een gestippelde lijn met pijltjes, „ochtendwandeling”, begint bij de put (oost), loopt naar de schuur (west) en eindigt bij de vuurplaats (zuidwest).',
    diagram: 'forestMap',
  },
  'c.toolboard': {
    id: 'c.toolboard',
    title: 'Gereedschapsbord in de schuur',
    text: 'Bij de omtrek van een ontbrekend bijltje staat met krijt: “Eerst het vuur. Steek dan de lantaarn aan bij het vuur. Pas in dat licht lees je de plaat.”',
  },
  'c.firePlate': {
    id: 'c.firePlate',
    title: 'Koperen plaat bij de vuurplaats',
    text: 'In het lantaarnlicht is de gravure goed te lezen: drie tekens met pijlen ertussen — Maan, dan Blad, dan Zon. Daaronder: “Zo ontsteek je de tuin.”',
    symbols: ['maan', 'blad', 'zon'],
    symbolsLayout: 'arrow',
  },
  'c.lanterns': {
    id: 'c.lanterns',
    title: 'Drie lantaarns in de tuin',
    text: 'Op het grasveld staan drie lantaarns in een kring, elk met een uitgesneden teken: een zon, een maan en een blad. Wie ze aansteekt, ziet pas bij de derde of de volgorde goed was.',
    symbols: ['zon', 'maan', 'blad'],
    symbolsLayout: 'row',
  },
  'c.poolTiles': {
    id: 'c.poolTiles',
    title: 'Mozaïek in het zwembad',
    text: 'Op de bodem van het zwembad liggen vier mozaïektekens op een rij. Vanaf het ondiepe eind bij het trapje (zuid) naar het diepe eind (noord): cirkel, driehoek, golf, ruit.',
    symbols: ['cirkel', 'driehoek', 'golf', 'ruit'],
    symbolsLayout: 'row',
    diagram: 'poolTiles',
  },
  'c.saunaDiagram': {
    id: 'c.saunaDiagram',
    title: 'Houten bord in de sauna',
    text: 'Een ingebrande tekening van het zwembad van bovenaf, met „diep” en „ondiep” aan de uiteinden. Langs een pijl van het diepe naar het ondiepe eind staan vier vakjes, genummerd 1 (bij diep) tot 4 (bij ondiep). Erbij staat: „Zoals de stoom opstijgt: van diep naar ondiep.”',
    diagram: 'saunaPool',
  },
  'c.cabinet': {
    id: 'c.cabinet',
    title: 'Kast in de serre',
    text: 'Een hoge kast met een glazen bovenkast. Boven de glazen deur zitten vier draaibare tegels, genummerd 1 tot 4; elke tegel toont een driehoek, cirkel, ruit of golf. De onderkast heeft geen sleutelgat: een dun draadje loopt van de kast door de vloer naar buiten, richting de lantaarns in de tuin.',
  },
  'c.wellNote': {
    id: 'c.wellNote',
    title: 'Aanwijzing voor de put',
    text: `Zet de zwengel op de put in het oostelijke bos en draai. Wat bovenkomt, gaat alleen open voor wie het wapenschild bij zich heeft.\n\n${K}`,
  },
  'c.fragment': {
    id: 'c.fragment',
    title: 'Snipper van de uitnodiging',
    text: `…in het huisje bij de vijver. Binnen zijn twee nissen naast de deur. Links hoort wat uit het bos komt, rechts wat uit het huis komt. Dan zijn we compleet.\n\n${K}`,
  },
  'c.billiardExamples': {
    id: 'c.billiardExamples',
    title: 'Twee ingelijste schetsjes bij het biljartpaneel',
    text: 'Elk schetsje toont een biljarttafel van bovenaf, met het raam bovenaan, en daarnaast het paneel van negen lampjes. Een lampje brandt waar een gekleurde bal ligt. De witte bal telt niet mee.',
    diagram: 'billiardExamples',
  },
};

// Memory notes are recorded in the notebook too, under their own section.
for (const m of Object.values(MEMORIES)) {
  CLUES[m.id] = { id: m.id, title: m.title, text: m.text, memory: true };
}

/** Notebook grouping by area, and the puzzle each clue serves (for the "solved" mark). */
export const CLUE_GROUP: Record<string, { area: string; puzzle?: string }> = {
  'c.invitation': { area: 'Landhuis · hal en woonkamer', puzzle: 'p1.drawer' },
  'c.mantel': { area: 'Landhuis · hal en woonkamer', puzzle: 'p1.drawer' },
  'c.drawerLock': { area: 'Landhuis · hal en woonkamer', puzzle: 'p1.drawer' },
  'c.billiardExamples': { area: 'Landhuis · hal en woonkamer' },
  'c.studyNote': { area: 'Landhuis · boven', puzzle: 'p2.study' },
  'c.forestMap': { area: 'Landhuis · boven', puzzle: 'p2.study' },
  'c.toolboard': { area: 'Bos', puzzle: 'p4.fire' },
  'c.firePlate': { area: 'Bos', puzzle: 'p5.lanterns' },
  'c.lanterns': { area: 'Tuin', puzzle: 'p5.lanterns' },
  'c.poolTiles': { area: 'Serre en sauna', puzzle: 'p6.cabinet' },
  'c.saunaDiagram': { area: 'Serre en sauna', puzzle: 'p6.cabinet' },
  'c.cabinet': { area: 'Serre en sauna', puzzle: 'p6.cabinet' },
  'c.wellNote': { area: 'Bos', puzzle: 'p7.well' },
  'c.fragment': { area: 'Huisje', puzzle: 'p8.cottage' },
};
