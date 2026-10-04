// Inventory items. `symbol` refers to src/content/symbols.ts when an item carries a pictogram.

export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  icon: string; // emoji fallback icon for the inventory grid
  readClue?: string; // reading this item opens / records this clue
  essential?: boolean; // required before leaving home
}

export const ITEMS: Record<string, ItemDef> = {
  invitation: { id: 'invitation', name: 'Uitnodiging', icon: '✉️', desc: 'Een handgeschreven uitnodiging met drie tekeningetjes.', readClue: 'c.invitation', essential: true },
  torch: { id: 'torch', name: 'Zaklamp', icon: '🔦', desc: 'Een stevige zaklamp. Tik op “Zaklamp” in je tas om hem aan of uit te zetten.', essential: true },
  matches: { id: 'matches', name: 'Lucifers', icon: '🔥', desc: 'Een doosje lucifers. Kies ze in je tas en gebruik ze op iets wat aan moet.', essential: true },
  notebook: { id: 'notebook', name: 'Notitieboek', icon: '📓', desc: 'Je notitieboek. Aanwijzingen die je bekijkt, worden er vanzelf in bewaard.', essential: true },
  frontKey: { id: 'frontKey', name: 'Sleutel van het landhuis', icon: '🗝️', desc: 'Een zware sleutel met een label: “voordeur landhuis”.', essential: true },
  studyKey: { id: 'studyKey', name: 'Messing sleutel', icon: '🔑', desc: 'Een kleine messing sleutel. Op het label staat “studeerkamer”.' },
  shedKey: { id: 'shedKey', name: 'Schuursleutel', icon: '🗝️', desc: 'Een roestige sleutel aan een houten hanger in de vorm van een huisje.' },
  kindling: { id: 'kindling', name: 'Aanmaakhout', icon: '🪵', desc: 'Een bundel droog aanmaakhout met aanmaakblokjes. Genoeg voor een flink vuur.' },
  token: { id: 'token', name: 'Houten penning', icon: '🪙', desc: 'Een gladde houten penning met een boompje erin gekerfd. Hij komt uit het bos.' },
  crank: { id: 'crank', name: 'Zwengel', icon: '⚙️', desc: 'Een ijzeren zwengel met een houten handvat. Hij lijkt op een as te passen.' },
  crest: { id: 'crest', name: 'Wapenschild', icon: '🛡️', desc: 'Een geglazuurd tegeltje in de vorm van een schild. Het hoort bij het huis.' },
  cottageKey: { id: 'cottageKey', name: 'Sleutel van het huisje', icon: '🗝️', desc: 'Een sleutel met een terracotta labeltje: “huisje bij de vijver”.' },
  fragment: { id: 'fragment', name: 'Snipper van de uitnodiging', icon: '📜', desc: 'Het ontbrekende stuk van de uitnodiging.', readClue: 'c.fragment' },
};

export const ESSENTIALS = Object.values(ITEMS).filter((i) => i.essential).map((i) => i.id);
