// Notebook entries. Inspecting the matching object in the world records the entry.
// Answers must always be derivable from these texts + the 3D world (see docs/PUZZLE_SOLUTIONS.md).
import { MEMORIES } from './memories';

export interface ClueDef {
  id: string;
  title: string;
  text: string;
  symbols?: string[];
  symbolsLayout?: 'ring' | 'row' | 'arrow';
  diagram?: 'forestMap' | 'saunaPool' | 'billiardExamples' | 'poolTiles';
  memory?: boolean;
}

const K = '— de Kwartiermaker';

export const CLUES: Record<string, ClueDef> = {
  'c.invitation': {
    id: 'c.invitation',
    title: 'Uitnodiging',
    text: `“We hebben alles klaargezet. Zoek uit waar we samenkomen.”\n\nDe voordeur van het landhuis gaat open met de sleutel die je meeneemt. Drie dingen staan daar al voor je klaar — ze staan op de schoorsteenmantel in de woonkamer. Lees ze van links naar rechts.\n\n${K}`,
    symbols: ['kopje', 'veer', 'dennenappel'],
    symbolsLayout: 'ring',
  },
  'c.mantel': {
    id: 'c.mantel',
    title: 'Schoorsteenmantel',
    text: 'Op de mantel boven de open haard staan, van links naar rechts: een kaars, een veer, een klokje, een dennenappel, een vaasje en een kopje.',
    symbols: ['kaars', 'veer', 'klok', 'dennenappel', 'kopje'],
    symbolsLayout: 'row',
  },
  'c.drawerLock': {
    id: 'c.drawerLock',
    title: 'Slot op de ladekast in de hal',
    text: 'De lade van de ladekast in de hal zit vast met een slot van drie draaiwieltjes. Op elk wieltje staan dezelfde zes tekeningetjes: kaars, veer, klok, dennenappel, ster en kopje.',
  },
  'c.studyNote': {
    id: 'c.studyNote',
    title: 'Briefje op het bureau',
    text: `Voor de schuursleutel: druk de drie plekken uit het bos in de volgorde waarin de ochtendzon ze raakt. Ze komt op in het oosten en gaat onder in het westen.\n\n${K}`,
  },
  'c.forestMap': {
    id: 'c.forestMap',
    title: 'Ingelijste kaart van het bos',
    text: 'Een kaart van het bos voor het landhuis, met een windroos. Ingetekend: de put (ver naar het oosten), de schuur (in het westen) en de vuurplaats (nog verder naar het westen). Het landhuis ligt erboven, in het noorden.',
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
    text: 'Op het grasveld staan drie lantaarns op stenen zuiltjes, elk met een uitgesneden teken: een zon, een maan en een blad. Ze lijken bij elkaar te horen.',
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
    text: 'Een ingebrande tekening van het zwembad van bovenaf, met “diep” en “ondiep” aan de uiteinden. Een pijl loopt van het diepe naar het ondiepe eind, met vier lege vakjes langs de pijl. Erbij staat: “Zoals de stoom opstijgt: van diep naar ondiep.”',
    diagram: 'saunaPool',
  },
  'c.cabinet': {
    id: 'c.cabinet',
    title: 'Kast in de serre',
    text: 'Een hoge kast met een glazen bovenkast. Op de bovenkast zit een paneel met vier knoppen: driehoek, cirkel, ruit en golf. De onderkast heeft geen sleutelgat; er loopt een dun draadje vanaf, naar buiten, de tuin in.',
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
