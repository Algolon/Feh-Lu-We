// Notebook entries. Inspecting the matching object in the world records the entry.
// Story: “Het huis dat zich herinnert” — explicitly fictional; the organiser is the fictional Kwartiermaker.
// Answers must always be derivable from these texts + the 3D world (see docs/PUZZLE_SOLUTIONS.md).
import { MEMORIES } from './memories';
import { MANTEL_TEXT, DRAWER_DIAL, SERVICE, CIPHER, EMBLEMS, GUESTBOOK_TABS, CATALOG, PLATES } from './canon';
import { SYMBOLS } from './symbols';

export type DiagramId =
  | 'forestMap' | 'saunaPool' | 'billiardExamples' | 'poolTiles' | 'mantel' | 'brassStands' | 'serviceChart' | 'libraryPlan'
  | 'guestbookTabs' | 'catalogDesk' | 'alphabetStrips' | 'serviceDrawing' | 'plates' | 'journalHill' | 'ledgerSeals' | 'basementDoor';

export interface ClueDef {
  id: string;
  title: string;
  text: string;
  symbols?: string[];
  symbolsLayout?: 'row' | 'arrow';
  diagram?: DiagramId;
  memory?: boolean;
}

const K = '— de Kwartiermaker';
const nm = (id: string) => SYMBOLS[id].name.toLowerCase();

export const CLUES: Record<string, ClueDef> = {
  // ---------------------------------------------------------------- arrival + hall drawer
  'c.invitation': {
    id: 'c.invitation', title: 'Uitnodiging',
    text: `“We hebben alles klaargezet. Zoek uit waar we samenkomen.”\n\nDit jaar niet op de gewone plek. Het huis heeft drie delen van de route bewaard: wat aan tafel werd gedeeld, wat werd opgeschreven, en wat buiten de paden werd ontdekt.\n\nBegin in de hal: daar staat een ladekast met een slot. Op de schoorsteenmantel staan drie voorwerpen op kleine messing voetjes. Alleen die drie horen bij de lade. Lees ze van links naar rechts, terwijl je voor de haard staat.\n\n${K}`,
    diagram: 'brassStands',
  },
  'c.mantel': { id: 'c.mantel', title: 'Schoorsteenmantel', text: MANTEL_TEXT, diagram: 'mantel' },
  'c.drawerLock': {
    id: 'c.drawerLock', title: 'Slot op de ladekast in de hal',
    text: `De lade van de ladekast in de hal zit vast met een slot van drie draaiwieltjes. Op elk wieltje staan dezelfde zes tekeningetjes: ${DRAWER_DIAL.map(nm).join(', ')}.`,
  },
  'c.ledger': {
    id: 'c.ledger', title: 'Landgoedregister',
    text: `Op de eerste bladzijde: “Dit huis bewaart drie delen van de route.”\n\nAchterin drie lege afdrukken. Een rond zegel bij AAN TAFEL (eetkamer, keuken, serre). Een vierkant zegel bij IN DE KANTLIJN (bibliotheek, studeerkamer). Een zegel in de vorm van een blad bij BUITEN DE PADEN (de schuur in het bos, het vuur, de tuin).\n\nOnderaan: “Wie de drie zegels samenbrengt, mag naar beneden. De kelderdeur is in de achterhal.”`,
    diagram: 'ledgerSeals',
  },
  // ---------------------------------------------------------------- thread A: aan tafel
  'c.hostingPlan': {
    id: 'c.hostingPlan', title: 'Gescheurd tafelplan',
    text: 'Een tafelplan voor het weekend, half gescheurd. Leesbaar is nog: “…drie serveerwagens, elk met een eigen label. Hoe ze moeten rijden, staat op het dienstrooster in de keuken. De derde wagen is na het zwemmen in de serre blijven staan…”',
  },
  'c.serviceChart': {
    id: 'c.serviceChart', title: 'Dienstrooster in de keuken',
    text: `Een bord met drie grote vakken: ${SERVICE.slots.map((s) => s.name).join(', ')}. Erboven staat: “${SERVICE.rule}”\n\nAan de haakjes ernaast hangen drie wagenlabels zonder woorden: een dampende terrine, een gieter met een tulp, en een melkbus met een stuk kaas.`,
    diagram: 'serviceChart',
  },
  'c.consNote': {
    id: 'c.consNote', title: 'Kaartje bij de serresleutel',
    text: '“De serre ging op slot toen iedereen naar binnen ging. De kast bij het zwembad bewaart wat aan tafel werd gedeeld.”',
  },
  'c.trolley': {
    id: 'c.trolley', title: 'De vergeten serveerwagen',
    text: 'Daar staat hij: de derde serveerwagen, met een stapel handdoeken en twee lege kopjes. Iemand heeft er een kaartje op gelegd: “Na het zwemmen naar de sauna. Het bord daar telt van diep naar ondiep.”',
  },
  'c.poolTiles': {
    id: 'c.poolTiles', title: 'Mozaïek in het zwembad',
    text: 'Op de bodem van het zwembad liggen vier mozaïektekens op een rij. Vanaf het ondiepe eind bij het trapje (zuid) naar het diepe eind (noord): cirkel, driehoek, golf, ruit.',
    symbols: ['cirkel', 'driehoek', 'golf', 'ruit'], symbolsLayout: 'row', diagram: 'poolTiles',
  },
  'c.saunaDiagram': {
    id: 'c.saunaDiagram', title: 'Houten bord in de sauna',
    text: 'Een ingebrande tekening van het zwembad van bovenaf, met „diep” en „ondiep” aan de uiteinden. Langs een pijl van het diepe naar het ondiepe eind staan vier vakjes, genummerd 1 (bij diep) tot 4 (bij ondiep). Erbij staat: „Zoals de stoom opstijgt: van diep naar ondiep.”',
    diagram: 'saunaPool',
  },
  'c.cabinet': {
    id: 'c.cabinet', title: 'Kast in de serre',
    text: 'Een hoge kast met een glazen bovenkast. Boven de glazen deur zitten vier draaibare tegels, genummerd 1 tot 4; elke tegel toont een driehoek, cirkel, ruit of golf. Achter het glas ligt een rond terracotta zegel.',
  },
  // ---------------------------------------------------------------- thread B: in de kantlijn
  'c.libraryPlan': {
    id: 'c.libraryPlan', title: 'Plattegrond met emblemen',
    text: `Een ingelijste plattegrond van het huis. In elke kamer staat een klein embleem — hetzelfde als op het bordje naast de deur: ${EMBLEMS.map((e) => `${e.room}: ${nm(e.sym)}`).join('; ')}.`,
    diagram: 'libraryPlan',
  },
  'c.guestbookTabs': {
    id: 'c.guestbookTabs', title: 'Gastenboek met tabbladen',
    text: `Het grote gastenboek op de lessenaar. De bladzijden van elke kamer hebben aan de rand een eigen tabblad: ${GUESTBOOK_TABS.map((t) => `${nm(t.tab)} — ${t.room}`).join('; ')}.`,
    diagram: 'guestbookTabs',
  },
  'c.catalogDesk': {
    id: 'c.catalogDesk', title: 'Leestafel met drie vakken',
    text: `Op de leestafel liggen drie boeken met een ingeslagen embleem: ${CATALOG.books.map((b) => b.cover).join(', ')}. In het tafelblad zitten drie vakken, elk gemarkeerd met de vorm van een tabblad: ${CATALOG.sockets.map((s) => nm(s.tab)).join(', ')}. Op een kaartje: “Elk boek terug in het vak van zijn kamer.”`,
    diagram: 'catalogDesk',
  },
  'c.archiveCard': {
    id: 'c.archiveCard', title: 'Kaart uit de catalogus',
    text: '“De studeerkamer bewaart wat werd opgeschreven. Het bureau gaat open voor wie de ochtendwandeling kent.” Met een paperclip zat de messing sleutel van de studeerkamer eraan vast.',
  },
  'c.studyNote': {
    id: 'c.studyNote', title: 'Briefje op het bureau',
    text: `Voor het archiefzegel: druk de drie plekken van mijn ochtendwandeling in, in de volgorde van de gestippelde route op de kaart aan de muur.\n\n${K}`,
  },
  'c.forestMap': {
    id: 'c.forestMap', title: 'Ingelijste kaart van het bos',
    text: 'Een kaart van het bos voor het landhuis. Een gestippelde lijn met pijltjes, „ochtendwandeling”, begint bij de put (oost), loopt naar de schuur (west) en eindigt bij de vuurplaats (zuidwest).',
    diagram: 'forestMap',
  },
  'c.cipherExample': {
    id: 'c.cipherExample', title: 'Notitie over geheimschrift',
    text: `Een vel uit een oud schrift: “Om een bericht verborgen te houden, schoof ik elke letter ${CIPHER.shift} plaatsen op in het alfabet. ${CIPHER.example.plain} wordt ${CIPHER.example.cipher}. Om een geschreven bericht terug te lezen, ga je drie letters terug.” Eronder twee alfabetstroken; de onderste is drie letters opgeschoven.`,
    diagram: 'alphabetStrips',
  },
  // ---------------------------------------------------------------- thread C: buiten de paden
  'c.toolboard': {
    id: 'c.toolboard', title: 'Gereedschapsbord in de schuur',
    text: 'Bij de omtrek van een ontbrekend bijltje staat met krijt: “Eerst het vuur. Steek dan de lantaarn aan bij het vuur. Pas in dat licht lees je de plaat.”',
  },
  'c.journal': {
    id: 'c.journal', title: 'Boswandeljournaal',
    text: 'Een dun schrift vol schetsen van het bos. Op een van de laatste bladzijden: een ronde heuvel waar boomwortels als een dak overheen groeien, met een deurtje erin. Erbij: “Volg het zuidelijke pad. Bij de wegwijzer met de gevorkte arm ga je naar het noorden, de heuvel in.”\n\nOp de binnenkant van de kaft: “Eerst vuur, dan de lantaarn, dan de tuin.”',
    diagram: 'journalHill',
  },
  'c.firePlate': {
    id: 'c.firePlate', title: 'Koperen plaat bij de vuurplaats',
    text: 'In het lantaarnlicht is de gravure goed te lezen: drie tekens met pijlen ertussen — Maan, dan Blad, dan Zon. Daaronder: “Zo ontsteek je de tuin.”',
    symbols: ['maan', 'blad', 'zon'], symbolsLayout: 'arrow',
  },
  'c.lanterns': {
    id: 'c.lanterns', title: 'Drie lantaarns in de tuin',
    text: 'Op het grasveld staan drie lantaarns in een kring rond een platte steen, elk met een uitgesneden teken: een zon, een maan en een blad. Wie ze aansteekt, ziet pas bij de derde of de volgorde goed was.',
    symbols: ['zon', 'maan', 'blad'], symbolsLayout: 'row',
  },
  'c.fork': {
    id: 'c.fork', title: 'Wegwijzer met een gevorkte arm',
    text: 'Een oude wegwijzer. De ene arm wijst langs het pad. De andere is gevorkt als een tak en wijst het bos in, naar het noorden. Er staat geen woord op, alleen een ingekerfd blaadje.',
  },
  'c.boslust': {
    id: 'c.boslust', title: 'BOSLUST',
    text: `Een deur in de heuvel, onder een dak van aarde, mos en wortels. Op het verweerde bord erboven: BOSLUST.\n\nIn de stenen deurpost is een regel gegraveerd:\n${CIPHER.cipher}\n\nNaast de deur zit een slot met vier cijferwieltjes onder een vergrendeld klepje. In het klepje zit een smalle gleuf.`,
  },
  // ---------------------------------------------------------------- convergence
  'c.basementDoor': {
    id: 'c.basementDoor', title: 'Kelderdeur in de achterhal',
    text: 'Een zware eiken deur met drie lege afdrukken in het slot: een rond zegel, een vierkant zegel en een zegel in de vorm van een blad. Eronder: “Wie de drie zegels samenbrengt, mag naar beneden.”',
    diagram: 'basementDoor',
  },
  'c.serviceDrawing': {
    id: 'c.serviceDrawing', title: 'Leidingtekening',
    text: 'Een vergeelde tekening van alles wat onder het landgoed loopt. Drie lijnen komen samen in de routekamer: een doorgetrokken lijn vanaf de bibliotheek (de muren), een gestreepte lijn vanaf het zwembad in de serre (het water) en een gestippelde lijn vanaf de vuurplaats in het bos (de paden). Waar ze samenkomen, loopt één lijn verder naar een heuvel in het bos.',
    diagram: 'serviceDrawing',
  },
  'c.routeConsole': {
    id: 'c.routeConsole', title: 'Routekast',
    text: 'Een kast vol koperen buizen onder een geschilderde kaart van het landgoed. Drie zegelvakken, van links naar rechts gemarkeerd met een doorgetrokken lijn, een gestreepte lijn en een gestippelde lijn.',
  },
  'c.routeRestored': {
    id: 'c.routeRestored', title: 'De route licht op',
    text: 'De lijnen op de kaart gloeien op en lopen samen naar een heuvel in het zuidwestelijke bos. Bij de heuvel staat in kleine letters: BOSLUST. Uit een gleuf in de kast schoof een letterstrook.',
  },
  'c.letterstrook': {
    id: 'c.letterstrook', title: 'Letterstrook',
    text: 'Een strook karton met twee alfabetten boven elkaar; het onderste is drie letters opgeschoven. Een pijltje wijst naar boven: “terug”. De strook is precies zo breed als een gleuf.',
    diagram: 'alphabetStrips',
  },
  'c.plateDiagram': {
    id: 'c.plateDiagram', title: 'Tekening in de wortelgang',
    text: `Een tekening van de lagen onder het landgoed: bovenaan gras en wortels, daaronder de stenen gang. Drie platen liggen naast elkaar en vormen samen één doorlopende gang. Bij elke plaat is het koperen nokje getekend: ${PLATES.map((p) => `${p.name} — nokje ${p.notch}`).join(', ')}.`,
    diagram: 'plates',
  },
  'c.finalLetter': {
    id: 'c.finalLetter', title: 'Brief op de tafel',
    text: `“Een plek onthoudt weinig uit zichzelf. Wij geven haar iets om te bewaren.”\n\nWelkom. Je hebt de route van het huis gevolgd: wat aan tafel werd gedeeld, wat werd opgeschreven en wat buiten de paden werd ontdekt. De tafel is gedekt; de rest komt zo binnen.\n\n${K}`,
  },
  'c.cottageNote': {
    id: 'c.cottageNote', title: 'Briefje in het oude huisje',
    text: `“Hier kwamen we vroeger samen. Dit jaar niet. Het huis weet waar.”\n\n${K}`,
  },
  'c.herbarium': {
    id: 'c.herbarium', title: 'Herbarium',
    text: 'Een herbarium met geperste bladeren en aantekeningen over het landgoed. Bij een eikenblad: “De oude eik aan de oostkant van de vijver heeft een nestkastje. Er woont niemand in. Kijk toch maar eens.”',
  },
  'c.billiardExamples': {
    id: 'c.billiardExamples', title: 'Twee ingelijste schetsjes bij het biljartpaneel',
    text: 'Elk schetsje toont een biljarttafel van bovenaf, met het raam bovenaan, en daarnaast het paneel van negen lampjes. Een lampje brandt waar een gekleurde bal ligt. De witte bal telt niet mee.',
    diagram: 'billiardExamples',
  },
};

// Memory notes are recorded in the notebook too, under their own section.
for (const m of Object.values(MEMORIES)) {
  CLUES[m.id] = { id: m.id, title: m.title, text: m.text, memory: true };
}

export type ThreadId = 'start' | 'A' | 'B' | 'C' | 'D';
export const THREADS: { id: ThreadId; title: string; sub: string }[] = [
  { id: 'start', title: 'Aankomst', sub: 'de uitnodiging en de lade in de hal' },
  { id: 'A', title: 'Aan tafel', sub: 'eetkamer, keuken, serre en sauna' },
  { id: 'B', title: 'In de kantlijn', sub: 'bibliotheek en studeerkamer' },
  { id: 'C', title: 'Buiten de paden', sub: 'schuur, vuurplaats, tuin en heuvel' },
  { id: 'D', title: 'Samenkomst', sub: 'kelder, BOSLUST en de wortelgang' },
];

/** Notebook grouping by story thread, and the puzzle each clue serves (for the "solved" mark). */
export const CLUE_GROUP: Record<string, { thread: ThreadId; puzzle?: string }> = {
  'c.invitation': { thread: 'start', puzzle: 'p1.drawer' },
  'c.mantel': { thread: 'start', puzzle: 'p1.drawer' },
  'c.drawerLock': { thread: 'start', puzzle: 'p1.drawer' },
  'c.ledger': { thread: 'start' },
  'c.hostingPlan': { thread: 'A', puzzle: 'a.service' },
  'c.serviceChart': { thread: 'A', puzzle: 'a.service' },
  'c.consNote': { thread: 'A' },
  'c.trolley': { thread: 'A', puzzle: 'a.cabinet' },
  'c.poolTiles': { thread: 'A', puzzle: 'a.cabinet' },
  'c.saunaDiagram': { thread: 'A', puzzle: 'a.cabinet' },
  'c.cabinet': { thread: 'A', puzzle: 'a.cabinet' },
  'c.libraryPlan': { thread: 'B', puzzle: 'b.catalog' },
  'c.guestbookTabs': { thread: 'B', puzzle: 'b.catalog' },
  'c.catalogDesk': { thread: 'B', puzzle: 'b.catalog' },
  'c.archiveCard': { thread: 'B' },
  'c.studyNote': { thread: 'B', puzzle: 'b.study' },
  'c.forestMap': { thread: 'B', puzzle: 'b.study' },
  'c.cipherExample': { thread: 'D', puzzle: 'd.cipher' },
  'c.toolboard': { thread: 'C', puzzle: 'c.fire' },
  'c.journal': { thread: 'C' },
  'c.firePlate': { thread: 'C', puzzle: 'c.lanterns' },
  'c.lanterns': { thread: 'C', puzzle: 'c.lanterns' },
  'c.fork': { thread: 'C' },
  'c.boslust': { thread: 'D', puzzle: 'd.cipher' },
  'c.basementDoor': { thread: 'D', puzzle: 'd.basement' },
  'c.serviceDrawing': { thread: 'D', puzzle: 'd.console' },
  'c.routeConsole': { thread: 'D', puzzle: 'd.console' },
  'c.routeRestored': { thread: 'D' },
  'c.letterstrook': { thread: 'D', puzzle: 'd.cipher' },
  'c.plateDiagram': { thread: 'D', puzzle: 'd.plates' },
  'c.finalLetter': { thread: 'D' },
  'c.cottageNote': { thread: 'C' },
  'c.herbarium': { thread: 'B' },
  'c.billiardExamples': { thread: 'start' },
};
