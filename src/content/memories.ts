// EDITABLE MEMORY CONTENT
// -----------------------
// Placeholder notes that will later be replaced by the friends group's authentic Veluwe Weekend memories.
// Keep the IDs stable: save files and world objects refer to them. Only change `title` and `text`.
// None of these placeholders make claims about real people; they are written by a fictional organiser,
// "de Kwartiermaker". See docs/HANDOFF.md → "Memory content" for the list and where each one appears.

export interface Memory {
  id: string;
  where: string; // developer note: where the note sits in the world
  title: string;
  text: string;
}

export const MEMORIES: Record<string, Memory> = {
  'mem.home.calendar': {
    id: 'mem.home.calendar',
    where: 'Home tutorial, wall calendar',
    title: 'Kalender',
    text: 'Het hele weekend is met dikke stift omcirkeld. In de kantlijn: “Op tijd vertrekken dit jaar. Echt.”',
  },
  'mem.hall.guestbook': {
    id: 'mem.hall.guestbook',
    where: 'Manor entrance hall, guestbook on the console',
    title: 'Gastenboek',
    text: 'De laatste bladzijde is nog leeg, op één zin na: “Wie dit leest, is de eerste. Dat is nog nooit gebeurd.”',
  },
  'mem.kitchen.list': {
    id: 'mem.kitchen.list',
    where: 'Manor kitchen, note on the counter',
    title: 'Boodschappenlijst',
    text: 'Stokbrood (veel). Kaas (meer). Iets groens, voor de vorm. Koffie voor een weeshuis. Onderaan, in een ander handschrift: “en marshmallows voor bij het vuur”.',
  },
  'mem.living.photo': {
    id: 'mem.living.photo',
    where: 'Manor living room, framed photo on the side table',
    title: 'Ingelijste foto',
    text: 'Een wazige groepsfoto bij een kampvuur. Iedereen lacht om iets wat net buiten beeld gebeurt.',
  },
  'mem.billiard.scoreboard': {
    id: 'mem.billiard.scoreboard',
    where: 'Manor billiard room, chalk scoreboard (reward of the optional panel)',
    title: 'Krijtbord',
    text: 'Een eindeloze reeks streepjes onder twee teamnamen die steeds zijn uitgeveegd en herschreven. Niemand weet meer wie er won.',
  },
  'mem.storage.box': {
    id: 'mem.storage.box',
    where: 'Manor upstairs storage room, cardboard box',
    title: 'Doos met spellen',
    text: 'Een stapel bordspellen. In elk doosje ontbreekt precies één onderdeel, en in elk doosje zit een onderdeel van een ander spel.',
  },
  'mem.pond.bench': {
    id: 'mem.pond.bench',
    where: 'Garden pond bench near the cottage',
    title: 'Briefje op het bankje',
    text: 'Hier zat altijd iemand met koffie te wachten tot de rest wakker werd. “Ochtenden zijn het mooiste deel,” staat er. “Zeg het niet tegen de rest.”',
  },
  'mem.sidegate.postbox': {
    id: 'mem.sidegate.postbox',
    where: 'Forest side gate, old postbox',
    title: 'Oude ansichtkaart',
    text: 'Een verbleekte kaart van de Veluwe. Op de achterkant: “Volgend jaar weer. Zelfde plek, zelfde mensen, nieuwe verhalen.”',
  },
  'mem.cottage.ending': {
    id: 'mem.cottage.ending',
    where: 'Cottage gathering room, card on the table (ending)',
    title: 'Kaart op de tafel',
    text: 'Fijn dat je er bent. Alles staat klaar, de rest komt zo binnen. Op naar nog een Veluwe Weekend samen!',
  },
};
