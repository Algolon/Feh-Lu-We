// Inventory items. Pictures live in src/ui/icons.ts (one distinct picture per item id).

export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  readClue?: string; // reading this item opens / records this clue
  essential?: boolean; // required before leaving home
}

export const ITEMS: Record<string, ItemDef> = {
  invitation: { id: 'invitation', name: 'Uitnodiging', desc: 'Een handgeschreven uitnodiging met drie tekeningetjes.', readClue: 'c.invitation', essential: true },
  torch: { id: 'torch', name: 'Zaklamp', desc: 'Een stevige zaklamp. Tik op “Zaklamp” in je tas om hem aan of uit te zetten.', essential: true },
  matches: { id: 'matches', name: 'Lucifers', desc: 'Een doosje lucifers. Kies ze in je tas en gebruik ze op iets wat aan moet.', essential: true },
  notebook: { id: 'notebook', name: 'Notitieboek', desc: 'Je notitieboek. Aanwijzingen die je bekijkt, worden er vanzelf in bewaard.', essential: true },
  frontKey: { id: 'frontKey', name: 'Sleutel van het landhuis', desc: 'Een zware sleutel met een label: “voordeur landhuis”.', essential: true },
  studyKey: { id: 'studyKey', name: 'Messing sleutel', desc: 'Een kleine messing sleutel. Op het label staat “studeerkamer”.' },
  shedKey: { id: 'shedKey', name: 'Schuursleutel', desc: 'Een roestige sleutel aan een houten hanger in de vorm van een huisje.' },
  kindling: { id: 'kindling', name: 'Aanmaakhout', desc: 'Een bundel droog aanmaakhout met aanmaakblokjes. Genoeg voor een flink vuur.' },
  token: { id: 'token', name: 'Houten penning', desc: 'Een gladde houten penning met een boompje erin gekerfd. Hij komt uit het bos.' },
  crank: { id: 'crank', name: 'Zwengel', desc: 'Een ijzeren zwengel met een houten handvat. Hij lijkt op een as te passen.' },
  crest: { id: 'crest', name: 'Wapenschild', desc: 'Een geglazuurd tegeltje in de vorm van een schild. Het hoort bij het huis.' },
  cottageKey: { id: 'cottageKey', name: 'Sleutel van het huisje', desc: 'Een sleutel met een terracotta labeltje: “huisje bij de vijver”.' },
  fragment: { id: 'fragment', name: 'Snipper van de uitnodiging', desc: 'Het ontbrekende stuk van de uitnodiging.', readClue: 'c.fragment' },
};

export const ESSENTIALS = Object.values(ITEMS).filter((i) => i.essential).map((i) => i.id);
