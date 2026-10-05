// Inventory items. Pictures live in src/ui/icons.ts (one distinct picture per item id).

export interface ItemDef {
  id: string;
  name: string;
  desc: string;
  readClue?: string; // reading this item opens / records this clue
  essential?: boolean; // required before leaving home
}

export const ITEMS: Record<string, ItemDef> = {
  invitation: { id: 'invitation', name: 'Uitnodiging', desc: 'Een handgeschreven uitnodiging van de Kwartiermaker.', readClue: 'c.invitation', essential: true },
  torch: { id: 'torch', name: 'Zaklamp', desc: 'Een stevige zaklamp. Tik op “Zaklamp” in je tas om hem aan of uit te zetten.', essential: true },
  matches: { id: 'matches', name: 'Lucifers', desc: 'Een doosje lucifers. Kies ze in je tas en gebruik ze op iets wat aan moet. Ze raken niet op.', essential: true },
  notebook: { id: 'notebook', name: 'Notitieboek', desc: 'Je notitieboek. Aanwijzingen die je bekijkt, worden er vanzelf in bewaard.', essential: true },
  frontKey: { id: 'frontKey', name: 'Sleutel van het landhuis', desc: 'Een zware sleutel met een rood label: “voordeur landhuis”.', essential: true },
  ledger: { id: 'ledger', name: 'Landgoedregister', desc: 'Het register van het huis, met achterin drie lege zegelafdrukken.', readClue: 'c.ledger' },
  shedKey: { id: 'shedKey', name: 'Schuursleutel', desc: 'Een roestige sleutel aan een houten hanger in de vorm van een huisje.' },
  studyKey: { id: 'studyKey', name: 'Messing sleutel', desc: 'Een kleine messing sleutel. Op het witte label staat “studeerkamer”.' },
  consKey: { id: 'consKey', name: 'Serresleutel', desc: 'Een sleutel met een groen glazen hangertje: “serre”.' },
  kindling: { id: 'kindling', name: 'Aanmaakhout', desc: 'Een bundel droog aanmaakhout met aanmaakblokjes. Genoeg voor een flink vuur.' },
  journal: { id: 'journal', name: 'Boswandeljournaal', desc: 'Een dun schrift vol schetsen van het bos.', readClue: 'c.journal' },
  tableSeal: { id: 'tableSeal', name: 'Tafelzegel', desc: 'Een rond terracotta zegel met een gedekte tafel en een kaarsvlam.' },
  archiveSeal: { id: 'archiveSeal', name: 'Archiefzegel', desc: 'Een vierkant blauw zegel met een opengeslagen boek.' },
  trailSeal: { id: 'trailSeal', name: 'Spoorzegel', desc: 'Een groen zegel in de vorm van een blad, met een boompje erin.' },
  cipherStrip: { id: 'cipherStrip', name: 'Letterstrook', desc: 'Een strook karton met twee alfabetten, de onderste drie letters verschoven.', readClue: 'c.letterstrook' },
};

export const ESSENTIALS = Object.values(ITEMS).filter((i) => i.essential).map((i) => i.id);
export const SEALS = ['tableSeal', 'archiveSeal', 'trailSeal'];
/** Items of the previous chapter that no longer exist; dropped from migrated saves. */
export const LEGACY_ITEMS = ['token', 'crank', 'crest', 'cottageKey', 'fragment'];
