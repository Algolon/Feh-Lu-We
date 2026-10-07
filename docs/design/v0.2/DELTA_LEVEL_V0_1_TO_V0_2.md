# Feh Lu We — delta LEVEL_PLAN v0.1 → v0.2

Datum 6 oktober 2026. Ontwerprevisie, geen spelimplementatie. De actuele expliciete gebruikersbesluiten gelden boven voorstelstatussen uit v0.1. Het terrein is definitief 200 × 180 m; een alternatieve terreinmaat wordt niet opnieuw beoordeeld.

| Onderdeel | v0.1 | v0.2 | Contract/gevolg |
|---|---|---|---|
| Baseline | A als advies binnen variantenonderzoek | A is vastgesteld uitgangspunt | Centrale hal, twee woonlussen, echte zolder; geen horizontale vergroting zonder aantoonbare blocker |
| Landgoed | Globale buitenstructuur met meer/huisje en bosrand | Gecomponeerde aankomst, sociale tuin, weide, water/hoogteplek, oostrug en afzonderlijke zuidboskamers | Reliëf, pads en sightlines dragen de schaal; geen extra verplichte puzzels |
| Bronreconcile | Eerdere layout/roomdefs-inspectie | AS-IS audit en aanvullende broninspectie op ef6b7c3bd9b1bfe56c600b2e76044cf42d919a3a | AS-IS footprints/classificatie/savecontract apart van ontwerp; geen claims van live test |
| Aankomst | Geen vijf uitgewerkte parkeervakken | Drie westelijke en twee oostelijke vakken van 2,8 × 5,5; 6 m manoeuvreerstrook; centrale entree-as vrij | Vier auto's plus vijfde reservering; swept-path/uitstappen nog ruimtelijk testen |
| Hoofdgebouw | 36 × 30 met dienstvleugel en serre | Zelfde footprints | Geen functionele blocker gevonden die horizontale uitbreiding vereist |
| Was-/bijkeuken | Wasfunctie onvoldoende centraal uitgewerkt; linnen via gastenkamer | utility 2,3 × 5,6 binnen bestaande dienstvleugel; pantry smaller; linnen via rearNookEast | Nieuwe room utility en door.utility additief; door.pantry/bron-ID behouden |
| Noordverblijf | Ontwerpalias northGuest vervangt oude opslagbox | Noordgastenkamer gebruikt bron-ID storage, box expliciet opgesplitst t.o.v. trap/linnen | door.storage behouden; geen oude brede room-box laten overlappen |
| Copacabana | Serre met enkele buitendeur en algemeen badgebruik | Francois' Copacabana Room; dubbele buitendeur 2,4 m; twee persoonlijke naamborden; kleine NE-bar | Eén door.consEast-state, twee bladen; lock.door.consWest/consKey behouden; bord is persoonlijke uitzondering |
| Sauna | Vlakke aansluiting als voorstel | Bronvloer +0,80; 8,2 m ramp + vlak 1,2 m bovenbordes | Deur op bron-noordzijde; buitenhuid expliciet out/region |
| Jacuzzi | Niet metrisch gereserveerd | Kuip 3,6 × 3,6 naast sauna; eigen uitstap-/techniekzone | Geen A02-bewijs, geen poolindexduplicatie |
| Sociale buitenfuncties | Hoofdterras en weide | BBQ, buiteneettafel, gravity bong + handpan, aparte tank/ballonnennis | Herkenbaar weekendgebruik; geen impliciete nieuwe gebruiksmechanieken |
| Portugal-huisje | 10 × 8 footprint op plateau, west-oeverrisico | Footprint 6 m west verschoven t.o.v. v0.1, naar X20–30/Z157–165; 10 × 5 overkapt terras | Bronhuisje had al een ondiepe porch; uitbreiding daarvan, geen nieuw hoofdgebouwvolume; door.cottage en beide room-IDs behouden |
| Huisjehoogte | Hoogplateau globaal | Maaiveld +4, vloer +4,15, dakonderkant +6,85; droge pad 18–32/150–167; dekramp | Route stijgt vóór padgrens; eigen palen/fundamenten buiten water en vrije loopstrook |
| Portugal-route | Aanloop/retour nog grof | 84,87 m heen, 119,72 m andere terugroute; alle profielcontroles | Optionele verkenning; geen hoofdkey daar plaatsen om wandeling af te dwingen |
| Golf | Nog geen afzonderlijke reservering | Afslag achter/noord van BOSLUST-heuvel; kartonnen retourbaan langs noordhelling | 51,50 m zijlus; geen ballenfysica aangenomen; ondergrond/cipher niet beïnvloeden |
| Wickerman | Nog geen zelfstandige clearing | Centrum 167/54, R7,5, maaiveld +1,2; strofiguur 2,8 m voorstel | Eigen 99,79 m lus naar bestaand oostpad; burn/aftermath open; geen hoofdclue |
| Oostbos | Bos rond terrein, minder functionele articulatie | Langgerekte bosweide en beboste rug; 145,22 m tuin–wellnessroute | Hoogteprofiel 0–2,5; optional, schaal door zichtwissels |
| Observatorium | Sterrenkamer/kijkhoek onvoldoende gescheiden | U05 gastensuite+telescoop; A04 afzonderlijke observatiekamer-reservering | Geen toren/dome; echte dakopening nodig, niet emissief glas voor dichte wand |
| B01 | Embleem-/kamerproofvoorstel | Voorkeurskandidaat objectpaar → clip → folio; inspectieruimte voor drie clusters | Nog niet approved; geen dubbele bewijsgrammatica, bordjes alleen samen met gekozen model/hints vervangen |
| Kamerbordjes | Verwijdering met ontworpen embleemvervanging | Reconcile: bronplattegrond heeft ook emblem→room; Copacabana P-borden expliciet behouden | Blindtest van complete keten vereist; persoonlijke labels nooit automatisch B |
| Environment | Beperkter stagingprogramma | G05 spel/eetkamer, A01 apart dressoir, 12 rode kratten, bierkratten apart, maquette/Nerf/kunst secundair | F/B/S/P gehanteerd; persoonlijke props geen nieuwe lore/clues |
| Zolder | Nieuwe ontwerpverdieping | Behouden, echte U-trap expliciet gedimensioneerd; a nog ontbrekend in bron-Floor | Slabgaten/vide/culling geen volle room-boxvloeren; mem.storageBox alleen met ID behouden verplaatsen |
| Looptijden | Aangenomen snelheden | Audit 3,2 lopen/5 rennen; 2,2 effectief als ontwerpraming | Exacte polylines; geen gemeten playtestclaim; uurdoel blijft werkbudget |
| Late terugkeer | Tunnel gekoppeld aan na-finale | Bolt is bereikbaar na passageplaatgate, vóór finished | Bronhardgate en verhaalmoment gescheiden |
| Saves | Algemene ID-waarschuwing | STATE_VERSION4, bestaande keys/interactie-IDs; per-scene extentpose-validation en relocationcontract | Geen migratie nu; review gebruikt bestaande in-memory sandbox |
| Placement/culling | Algemene blockoutchecks | Footprint/overstek, openingen/sweep, bewijsposes, water, vegetation envelopes, shell out+region | VD-01 t/m VD-04 expliciet; sample-refactor geen estate-wide determinismgoedkeuring |
| Deliverables | v0.1 plan/JSON/graph/atlas/prompt | v0.2 plan/JSON/graph/delta/openlijst + actuele vectoratlas | v0.1 atlas/prompt historisch; nieuwe prompt in plan begrensd voor later |

## Wat onveranderd blijft

De bron-room-IDs (alle 39), dagelijkse hoofdgebouwfootprints, drie hoofdonderzoeken en kelder/BOSLUST-eindstructuur. Geen nieuwe verplichte puzzle in jacuzzi/golf/wickerman/huisje/bong/handpan. Geen code-, asset-, save-, PR-, merge- of deploywijziging in deze revisie.

Aanvullende reconcile: broncode bevat 49 expliciete + 19 window-portals (68 totaal); audit §3.2 vermeldt 51 expliciet. Alle 68 bronrelaties zijn nu behouden, inclusief de storage→out-raamrelatie die door de v0.1-aliasing ontbrak.

## Controle en beperkingen

Ontwerpdata: ID-/graph-/profiel-/droogtecontroles uitgevoerd; uitslagen opgenomen in JSON. Fysieke collision, deurbladen, zicht door nieuwe openingen, traphoofdruimte, culling, performance en echte speeltijd moeten in een later geautoriseerde blockout worden gemeten. Deze delta maakt een disciplinekandidaat niet definitief.
