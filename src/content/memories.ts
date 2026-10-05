// EDITABLE MEMORY CONTENT
// -----------------------
// Fictional placeholder notes, kept separate from the story so they can later be replaced by the friends
// group's real Veluwe Weekend memories. Keep the IDs stable (saves and world objects refer to them); only
// change `title` and `text`. None of these make claims about real people; they are written by the
// fictional organiser "de Kwartiermaker" or describe fictional objects. The story itself (the house,
// the seals, BOSLUST) is explicitly fiction and does not depend on any of these slots.

export interface Memory {
  id: string;
  where: string; // developer note: where the note sits in the world
  title: string;
  text: string;
}

export const MEMORIES: Record<string, Memory> = {
  'mem.home.calendar': {
    id: 'mem.home.calendar', where: 'Home tutorial, wall calendar', title: 'Kalender',
    text: 'Het hele weekend is met dikke stift omcirkeld. In de kantlijn: “Op tijd vertrekken dit jaar. Echt.”',
  },
  'mem.hall.guestbook': {
    id: 'mem.hall.guestbook', where: 'Manor hall, guestbook on the console', title: 'Gastenboek in de hal',
    text: 'De laatste bladzijde is nog leeg, op één zin na: “Wie dit leest, is de eerste. Dat is nog nooit gebeurd.”',
  },
  'mem.kitchen.list': {
    id: 'mem.kitchen.list', where: 'Manor kitchen, note on the counter', title: 'Boodschappenlijst',
    text: 'Stokbrood (veel). Kaas (meer). Iets groens, voor de vorm. Koffie voor een weeshuis. Onderaan, in een ander handschrift: “en marshmallows voor bij het vuur”.',
  },
  'mem.living.photo': {
    id: 'mem.living.photo', where: 'Manor living room, framed photo on the side table', title: 'Ingelijste foto',
    text: 'Een wazige groepsfoto bij een kampvuur. Iedereen lacht om iets wat net buiten beeld gebeurt.',
  },
  'mem.billiard.scoreboard': {
    id: 'mem.billiard.scoreboard', where: 'Manor billiard room, chalk scoreboard (reward of the optional panel)', title: 'Krijtbord',
    text: 'Een eindeloze reeks streepjes onder twee teamnamen die steeds zijn uitgeveegd en herschreven. Niemand weet meer wie er won.',
  },
  'mem.storage.box': {
    id: 'mem.storage.box', where: 'Manor attic storage, cardboard box', title: 'Doos met spellen',
    text: 'Een stapel bordspellen. In elk doosje ontbreekt precies één onderdeel, en in elk doosje zit een onderdeel van een ander spel.',
  },
  'mem.reis.suitcase': {
    id: 'mem.reis.suitcase', where: 'Reiskamer, open suitcase on the luggage rack (optional bedroom memento)', title: 'Koffer vol labels',
    text: 'De koffer zit vol oude bagagelabels, allemaal van dezelfde bestemming: dit huis. Op één label staat alleen: “volgend jaar weer”.',
  },
  'mem.sterren.telescope': {
    id: 'mem.sterren.telescope', where: 'Sterrenkamer, logbook next to the telescope', title: 'Sterrenlogboek',
    text: 'Een logboek met waarnemingen. Bij bijna elke avond staat: “bewolkt”. Bij één avond: “helder — niemand keek, iedereen zat buiten bij het vuur”.',
  },
  'mem.garden.nestbox': {
    id: 'mem.garden.nestbox', where: 'Old oak by the pond, nest box (optional botanical observation)', title: 'Briefje in het nestkastje',
    text: 'Geen vogels, wel een opgerold briefje: “Gevonden! Wie dit leest, heeft het herbarium echt gelezen.”',
  },
  'mem.pond.bench': {
    id: 'mem.pond.bench', where: 'Garden pond bench near the cottage', title: 'Briefje op het bankje',
    text: 'Hier zat altijd iemand met koffie te wachten tot de rest wakker werd. “Ochtenden zijn het mooiste deel,” staat er. “Zeg het niet tegen de rest.”',
  },
  'mem.sidegate.postbox': {
    id: 'mem.sidegate.postbox', where: 'Forest side gate, old postbox', title: 'Oude ansichtkaart',
    text: 'Een verbleekte kaart van de Veluwe. Op de achterkant: “Volgend jaar weer. Zelfde plek, zelfde mensen, nieuwe verhalen.”',
  },
  'mem.cottage.table': {
    id: 'mem.cottage.table', where: 'Old cottage, card on the table', title: 'Kaart in het huisje',
    text: 'Fijn dat je er bent. Alles stond hier vroeger klaar. Dit jaar is de tafel ergens anders gedekt.',
  },
  'mem.gathering.keepsakes': {
    id: 'mem.gathering.keepsakes', where: 'Gathering room, shelf of keepsakes (fictional objects)', title: 'Plank met aandenkens',
    text: 'Een plank met dingen die iemand heeft bewaard: een kapotte lantaarn, een kaartspel met één kaart te veel, een steen in de vorm van een hart. Bij elk een leeg kaartje, nog niet ingevuld.',
  },
};
