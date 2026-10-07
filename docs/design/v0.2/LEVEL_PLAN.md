# Feh Lu We — LEVEL_PLAN v 0.2

Datum: 6 oktober 2026. Status: geïntegreerd ruimtelijk ontwerp, **geen implementatieopdracht**. Speler/context: Thunder Muffin / Veluwe Weekends (VW/TM).

## 1. Beslisbasis en brongezag

**Vast voor deze revisie:** terrein 200 × 180 m; variant A als uitgangspunt; centrale hal, twee woonlussen, echte zolder; geen horizontale vergroting van het hoofdgebouw zonder aangetoonde functionele blocker. Dit zijn de actuele instructies van Omar en ze vervangen eerdere voorstelstatussen. De terreinmaat is geen open alternatief meer.

Geïntegreerd: `ENVIRONMENT_STORY(1).md` v 0.1, `Feh_Lu_We_Puzzle_Design_v0.1(1).md`, LEVEL_PLAN/layout/adjacency v 0.1 en de AS-IS audit op `ef6b7c3bd9b1bfe56c600b2e76044cf42d919a3a`. Voor footprints, roomtypes, saves en wellness zijn aanvullend `layout.ts`, `roomdefs.ts`, `rooms.ts`, `state.ts`, `conservatory.ts` en `cottage.ts` bij die ref gelezen. Layout- en roomdefs-blobs zijn gelijk aan de eerder geïnspecteerde blobs. Geen live walkthrough, performance- of nieuwe speltest uitgevoerd.

Er is geen afzonderlijk ondertekend CORE_BRIEF/DECISIONS-bestand gevonden. Concrete afspraken uit de centrale chat zijn aanvullend opgehaald; ze maken een disciplinevoorstel niet automatisch goedgekeurd. Prioriteit: deze gebruikersopdracht → expliciete gebruikersbesluiten → actuele broncode voor AS-IS → gezamenlijke ontwerpcontracten → disciplinevoorstellen. Afwijkende mechanieken blijven open. B01-objectparen+clips zijn voorkeurskandidaat, geen reeds ingevoerd regelsysteem.

Labels in dit pakket: **vast** = expliciet gebruikersbesluit; **behouden AS-IS** = gerapporteerd/gecontroleerd broncontract; **ontwerp** = metrisch uitgewerkt voorstel; **reservering** = ruimte gegarandeerd, gedrag/final artwork niet bepaald; **open** = centraal integratiebesluit nodig. Canonical footprints zijn ontwerpgezag voor toekomstige geometrie; ze zijn nog niet in spelcode geconsolideerd.

De bijgewerkte kaarten staan in `LEVEL_MAPS_v0.2.html` (terrein, BG, verdieping, zolder, kelder en hoogteprofielen). Schaal via metergrid/balk; oriëntatie +X oost/+Z noord, zonder claim van geografische bearing.

De bestanden `LEVEL_LAYOUT.json`, `ADJACENCY_GRAPH.md`, `DELTA_V0_1_TO_V0_2.md` en `INTEGRATION_OPEN.md` horen bij deze versie. De atlas en blockoutprompt van v 0.1 blijven historische referenties: gebruik hun gewijzigde buiten-/deur-/was-/B01-inhoud niet als actuele uitvoeropdracht.

## 2. Landgoedcompositie: schaal door gebruik en opeenvolgende uitzichten

De 200 × 180 m wordt één samengesteld landgoed, geen ring lege grond. Zes ruimtelijke delen dragen verschillende schaalervaringen:

1. **Aankomstbos en oprijlaan:** stammen in voor-/midden-/achtergrond, wegcurve en korte huisonthulling; geparkeerde auto's tonen gezamenlijk verblijf. Geen vijf autopuzzels.
2. **Huis en sociale tuin:** centrale hal en korte eet-/dienstlus sluiten aan op BBQ, buitentafel, instrumenthoek, Copacabana, sauna/jacuzzi. Veel gebruik binnen 15–35 m van tuindeuren.
3. **Open lantaarnweide:** bewust lucht/afstand achter het huis; de lantaarncompositie blijft een zelfstandig leesbaar puzzelanker. Geen golf, stroman of tuinrommel tussen de drie controles.
4. **Meer en Portugal-hoogteplek:** breed wateroppervlak, lage droge oever en hoger overkapt terras leveren verticale diepte. Een korte heenroute en andere terugroute; geen verplicht waterbezoek.
5. **Oostelijke bosweide en rug:** zicht wisselt tussen laag open gras en een bredere beboste helling. Een wandelverbinding koppelt tuin aan wellness; de massa reikt door tot de oostgrens.
6. **Zuidelijke boskamers:** schuur/vuur/put behouden hun hoofdroutefunctie. Golf ligt aan de noordzijde van de BOSLUST-heuvel; wickerman in een afzonderlijke oostelijke clearing. Beide verrijken herkenning/ontdekking zonder een nieuwe hoofdgate.

Bosmassa is gebiedsontwerp: ongelijke kroonlagen, onderbroken lage rand, bermen en eenvoudig verre silhouetten. Geen uniforme 10 m bomenstrook die vanaf elk standpunt hetzelfde is. Buiten de speelgrens doorlopende visuele grond/kronen; binnen de grens duidelijke paden en zones. Schaal wordt voelbaar door een 60–90 m vergezicht over water/weide naast beschutte 5–20 m kamers, niet door elke bestemming verder weg te zetten.

**Hoogtevelden (ontwerp):** behoud de BOSLUST-heuvel (63,31), R16/H7,5; noordelijke bosrug rond (124,163), ellipsstralen 65/22, max +4,5; oostelijke rug rond (176,116), stralen 20/60, max +5. Huis, clueweide en aankomst blijven vlak; Portugal-pad wordt +4; wickerman-clearing +1,2. Dit zijn authoringvelden, geen berekende contourmesh. Gebouwpads, waterbassin en padprofielen overschrijven deze velden volgens één expliciete prioriteit. Render en collision gebruiken dezelfde getrianguleerde hoogtebron.

## 3. Architectuur A en wat werkelijk verandert

Hoofdgebouw behoudt X72–108/Z80–110, 36 × 30 m. Dienstvleugel X108–116/Z92–110, 8 × 18; Copacabana X116–130/Z94–112, 14 × 18; zwembad X119–127/Z97–109, 8 × 12. Entree zuid, publieke tuin noord. Geen horizontale uitbreiding: de nieuwe wasfunctie past in de bestaande dienstvleugel en de observatoriumvraag blijft een functie-/dakvraag.

**Publiek:** vestibule→hal; west woonlus hal→woonkamer→bibliotheek→achterhal→hal; oost woonlus hal→eet-/spelkamer→keuken→dienstgang→Copacabana→tuin→keuken/biljart→achterhal. **Privé:** gastenkamers, bad, studie, botanische kamer, overloop. **Dienst:** provisie, workshop, was-/bijkeuken, WC, ketelkamer en gedeeld linnengoed. Diensttoegang loopt niet door een slaapkamer.

BG +0,15; verdieping +3,35; zolder +6,65; kelder −3,20; BOSLUST −3,40. Dakvoet +6,40/nok +14,60 behouden als geometrieanker. Binnenwanden uit audit 0,16 m, buitenschil 0,40 m; nieuwe openingen/collision uit dezelfde descriptor. Geen verdubbelde muren op gedeelde grens. Vrije hoofdloopstrook 1,5 m, bij grote groepen/meubels liefst 1,8; nieuwe gewone deuren 1,1 m; bestaande smallere bronopeningen blijven expliciet gemarkeerde uitzonderingen tot blockoutcheck. Kamerboxen zijn classificatievolumes, geen automatisch volledige vloeren.

### Aankomst en 4–5 auto's

Aankomstplein X80–100/Z61–78 op maaiveld 0. Oprit heeft vrije X88–92; laatste voordeurbenadering X87,5–92,5/Z72–80,2. West drie vakken X69,5–77,9/Z72–77,5; oost twee vakken X101–106,6/Z72–77,5. Elk vak 2,8 × 5,5 m; vijfde mag leeg blijven. De oorspronkelijke bospadtakken lopen zuidelijk van de geparkeerde auto's.

Manoeuvreerstrook X69,5–108/Z66–72 (6 m diepte) deelt oppervlak met de wandelvertakking: stilstaand wagenpark, geen verkeerssimulatie. Conceptuele vrije draairuimte 12 m diameter in het plein; niet als bewezen swept-path voor alle voertuigen claimen. Vrije bagage-/voetstrook Z77,5–79 achter beide rijen (1,5 m); modelafhankelijke deurzijdige uitstapruimte blijft te toetsen. Auto's worden per stabiele positie geplaatst, niet random. Eén samengesteld gravelvlak voorkomt de audit-overlap van plein/disc/aanvoervlak; eventuele materiaalovergangen krijgen echte gescheiden meshes.

### Binnengebruik en persoonlijke scènes

G05/dining wordt eet-/spelkamer met zelfgemaakt duo-bordspel, kaarten/dobbelstenen, gerichte stoelen, bier en een aparte marshmallow/“chubby-bunny challenge”/shotsgroep. Spelopstelling X98–103/Z84–88,5; A01 blijft aan een apart dressoir, niet onder spelkaarten. G08/billiard blijft biljartkamer: geen biljartverplaatsing naar G05.

Minstens 12 rode boodschappenkratten:4 in hall,8 in kitchen; bierkratten tellen apart. Geen krat op console, trapaanloop, deurzwaai of bewijspositie. Gingerbread-maquette is een secundaire halvondst, geen mantelcode. Twee Nerfs en circa 10 verspreide darts zijn persoonlijke props zonder automatisch collectathon. Kunst op echt vrij muurvlak. Deze scènes worden F/P/S; alleen aan de gekozen puzzelspec gekoppelde objecten zijn B.

### Centrale was-/bijkeuken — nu logisch ingepast

`utility`: X113,3–115,6/Z104–109,6, 2,3 × 5,6 m (12,88 m²), vloer +0,15. Directe nieuwe deur `door.utility` vanuit corridor op (114,45,104), vrij 1,1 m. Twee machines naast elkaar of gestapeld aan de oost/noordzijde, wasbak/werkblad en handdoekenrekken; vrije route minstens 1,2 m. Dagelijks: badtextiel, was en schoonmaak; geen hoofdclue.

`pantry` blijft dezelfde room-ID maar wordt X108,4–113,3/Z104–109,6, 4,9 × 5,6 m. De bestaande provisiedeur/opening blijft vrij west van de nieuwe scheidingswand. Koele voorraad, A01-bestemming en herkenbare voorraadwand blijven behouden. Wasruimte krijgt technische afzuiging/afvoer via dienstwand; wasbak of elektrische props leveren geen nieuwe puzzelbediening.

`linen` boven houdt de v 0.1 footprint X99–107,6/Z106,6–109,6 maar wordt centraal bereikbaar vanuit rearNookEast via opening X99/Z108. De oude voorstelverbinding door northGuest vervalt. Het is geen tweede machinekamer. Nattekern WC/bad en dienstwas worden functioneel op ketel-/serviceleidingen aangesloten; de abstracte D-leidingtekening blijft een afzonderlijk canoniek bewijsobject.

### Copacabana-dubbeldeur en wellness

Exacte naam: **Francois' Copacabana Room**, één bord bij de binnennadering vanuit corridor en één naast de dubbele buitendeur. Dit is een persoonlijke herinneringsnaam, expliciete uitzondering op verklarende kamerbordjes; geen embleem/tabbewijs.

Buitendeur behoudt logische ID `door.consEast` en gedeeld slot `lock.door.consWest`/consKey. Oostgevel X130, opening Z104,8–107,2:2,4 m vrij, twee bladeren 1,2 m, hoogte 2,35, vloer +0,15. Bladeren naar buiten/oost; vrije volledige zwaaizone X130–131,4/Z104,5–107,5. Eén logische opgeslagen openstand, beide zichtbare deurbladen/colliders samen; geen nieuw saved leaf-ID of halfopen gate-bypass. Binnenste serredeur blijft bestaande opening; geen dubbele binnendeur noodzakelijk uit deze vraag.

Bar-reservering noordoost X127,5–129,5/Z109,2–111,4, buiten de pooltekenreeks en droge hoofdroute. Een beperkt hout/stro/cocktailaccent, geen hele tropische kas. Ligstoelen/handdoeken ondersteunen badgebruik maar laten bewijs en loopstrook vrij.

Wellness droogdek X130–148/Z96–115 op +0,15. Sauna footprint 132–136/100–104 blijft; **vloer +0,80** volgens audit. Toegang via noorddeur:1,2 m brede ramp X133,4–134,6/Z104–113,4. Helling Z113,4→105,2 van +0,15 naar +0,80 over 8,2 m (<8%); vlak bovenbordes Z104–105,2 op +0,80. Deurzwaai vrijhouden vóór staging. Geen vlak GF-pad suggereren dat vanzelf op de saunavloer aansluit.

Jacuzzi-kuip X139–142,6/Z101–104,6, 3,6 × 3,6; uitstap/onderhoudszone X137,5–145,5/Z99,5–108. Een duidelijk andere kuipvorm, geen tweede poolindex. Techniek via service/wellness; A02-saunabord blijft vindbaar en leesbaar. Sauna-buitenschil expliciet zichtbaar van buiten, ook bij gesloten deur; auditdefect VD-03 wordt niet opgelost door meer stoom/ligstoelen.

## 4. Sociale tuin, water en Portugal-huisje

Hoofdterras 78–102/110–117 blijft als huisanker. Aansluitende plateau's hebben echte vloer-/maaiveldranden; geen losse zwevende meubels. BBQ-werkplek 104–111/115–119; buiteneettafel 94–102/117–123; gravity bong + handpan 79–85/118–123. Losse tank/ballonnennis 84–87/118–122 staat weg van het BBQ-werkvlak. Centraal pad terras→lantaarns rond X90 blijft vrij. De instrumenthoek heeft een eigen laag tafeltje/standaard, geen puzzelgeluid of veronderstelde gebruikshandeling.

Meertje behoudt centrum(54,146), 44 × 24 m, ellipsstralen 22/12, water −0,35, bodemvoorstel −1,8. Droge kijkplek 73–79/137–142. Oever 2,5–4 m waar ruimte, riet/struiken zonder verplicht bewijs; geen zwem/boot/brugmechaniek. Water is niet beloopbaar; geen onzichtbare muur op een droog pad.

**Portugal-huisje:** verplaats naar X20–30/Z157–165 (10 × 8 m behouden), vloer +4,15. Dit is 6 m west van v 0.1, zonder hoogte- of hoofdgebouwvergroting. Canonieke geometrie wordt verplaatst, niet als los cullinghok opnieuw verzonnen. Overkapt terras X20–30/Z152–157 (10 × 5), vloer +4,15, vrije onderkant dak +6,85:2,70 m. Dak ondersteund met palen buiten de 1,5 m loopstrook en eigen fundamenten; totale padreservering X18–32/Z150–167 op maaiveld +4. Droge funderingsruimte ligt buiten de waterellips. Een korte westelijke dekramp X18–20/Z151,4–152,6 verbindt maaiveld 4 naar vloer 4,15. Eventuele ophogings-/keermuur heeft een echte voet; geen kunstmatige verticale afgrond langs het wandelpad.

Terrestafel toont twee tegenoverliggende MTG-posities, spellenstapel, 30 Seconds, boeken/eten/flesjes en lokale dunne bongrook. Details blijven optioneel; geen verplichte code onder pizza of verborgen hoofdkey. Terras opent zuid/oost richting water; huis ligt achter/noord van het tafelbeeld. Bestaande `door.cottage`, `cottageEntry`, `cottageRoom` blijven stabiele IDs; bestaande cottage-porch wordt hier als groter overkapt terras ontworpen, niet als ontbrekende bouwfunctie geclaimd.

Heen: (80,113,5)→(62,122)→(40,130)→(18,143)→(18,152)→(25,152), 84,87 m. Plateauhoogte wordt al bij de padgrens bereikt (routeafstand 75,87 m), niet pas aan de tafel. Een 2 m lange terrasovergang aan het begin daalt van +0,15 naar 0; daarna start de landschappelijke stijging. Daarna vlak op het plateau. Terug: (25,152)→(18,152)→(18,168)→(48,168)→(79,160)→(90,139)→(90,128),119,72 m. Eerste 22 m hoogplateau, daarna 4 m dalen over 50 m (8%); resterend vlak. Terugpad blijft noord van water en west van het huis, snijdt dus geen gebouw/terras. Heen/terug samen circa 205 m, plus korte deurbenadering; geen verplichte loop.

## 5. Golf, wickerman en het oostelijke landgoed

**Golf:** afslag 60–66/Z49–55 opmaaiveld 0; kartonnen retourkoker 62–64/Z38–49 volgt de bestaande noordhelling van de BOSLUST-heuvel omhoog. Tas/1–2 clubs aan afslag; houten zijbalken. Dit is aan de andere kant dan de ingangZ18,2, geen bewegwijzering naar cipher. Baan zelf niet beloopbaar; ballenfysica/bediening nog open. Looplus schuur→(48,48)→(59,53)→afslag→(70,62)→bestaande voorpleintak,51,50 m. Onderliggende ontvangst/zaal/tunnel blijven ongewijzigd: collider-/paalfundamenten van de golfplek niet doorsteken tot ondergrondse Y-banden.

**Wickerman:** afzonderlijke clearing centrum(167,54), R7,5, maaiveld +1,2; strofiguurvoorstel 2,8 m (referentie-silhouet, geen boss-schaal). Kaarsen zijn lokale compositie, geen route-index. Ruimtelijk gescheiden van vuurplaats, lantaarnweide en BOSLUST-ingang; geen nieuwe cultus-/vriendenbiografie. Aansluiting via put/oostbos en een teruglus,99,79 m polyline. Laten staan blijft geldig. Branden/aftermath/secret-objective/persistente state zijn **open**, niet door deze reservering toegekend. Geen benodigde clue aan brandbaar object koppelen.

**Oostbosweide:** pad lantaarnzijde→(124,132)→(149,145)→(174,139)→(174,109)→(150,104)→wellness,145,22 m. Een langgerekte bosweide met hoogte 0,4–2,5 tussen lage routekaders en de hogere oostelijke kroonmassa. Geen nieuw verplicht bezoek; lokaal uitzicht, bosrand en een rustpunt kunnen een optionele kleine vondst dragen na puzzelspecificatie. Elke 30–40 m bocht/kijkwisseling, geen recht leeg lint langs een hek. Dit pad verbindt bestaande buitenfuncties, geen uitbreiding van de drie hoofdsporen.

De oostelijke/noordelijke massa's zijn vrijgegeven landschapsontwerpreserveringen, geen opdracht alles met individuele colliders te vullen. Dichtheidsvariatie en eenvoudig verre kroonvolumes leveren schaal; eerst budget en culling in blockout meten.

## 6. Observatorium, zolder en verticale verbindingen

U05/sterren blijft voor de huidige evidenceketen gastensuite met telescoop/schrift. Niet als technisch volwaardig observatorium presenteren. De audit bevestigt dat bestaande raamglas emissief vóór een dichte wand zit: een telescoop naast zo'n raam levert geen werkelijke hemel-/terreinzichtlijn.

**Reservering/advies voor I03:** gebruik A04/atticLookout (X95–101/Z92–98,6, vloer 6,65) als zelfstandige sterrenhobby-/observatiekamer met ontworpen fysieke dakopening. EB.stars blijft voorlopig U05 om B01 en bereikbaarheid niet mee te verplaatsen. Dit vraagt dakbinnenhuid, transparantie/opening, culling en echte zichttest; geen nieuwe toren, koepel, telescoopcontrols of verplichte sterrenpuzzel. Als een werkelijk astronomisch observatorium bedoeld wordt, zijn open hemel, mechaniek en thermiek een apart functioneel ontwerpvraagstuk. Tot keuze blijft A04 een kijkhoekreservering; geen claim dat v 0.2 al zo'n observatorium realiseert.

Grote opslagzolder A02/A03 behouden. Vloer +6,65, dakvoet 6,40, nok 14,60; conservatieve speelzone 80–101/86–105,6. Randknieschotten blokkeren laag dakvolume, hoofdruimte≥2,1 m over hele cameracapsule. A02 weekendspullen/dozen/instrumentkoffers; A03 seizoenopslag; geen verplichte seal boven. `storage` als bestaande code-ID wordt niet verwijderd: het nieuwe derde gastenverblijf behoudt die ID. Oude `mem.storageBox` kan als optionele inhoud naar A03 verhuizen met dezelfde memory-ID; nooit impliciet als nieuwe clue herschrijven.

S01 hoofdtrap behouden 93,05–94,92/86,5→95,5, +0,15→+3,35; S02 keldertrap 92,08–94,92/Z99,6→104,8, +0,15→−3,20; S04 BOSLUST61,7–64,3/Z20→26,0→−3,40. Zichtbare treden met gladde ramps; geen teleport of ongecontroleerde jump.

S03 zoldertrap reservering 95–99/98,6–105,6: twee 1,20 m brede vluchten naast elkaar,20 optreden× 0,165; per vlucht 9 aantreden× 0,28; middenbordes +5,00, boven +6,65. VluchtenX95,2–96,4 en 96,6–97,8, Z99,8–102,32; middenbordesZ102,32–103,52; boven/onderbordesZ98,6–99,8. Bovenuitgang naar A02 opX95/Z99,2, niet midden opZ101 boven het gat. Slabgat uit echte vluchtpolygonen; geen globale vloerbox erover. Vrije inspectie- en deurzones aan trapkop. Floor-type `a` is nog niet ondersteund in broncode en moet later expliciet aan maps/roomtypes worden toegevoegd.

## 7. Puzzel- en environment-integratie

De ruimtelijke hoofdroutes blijven die van drie parallelle hoofdonderzoeken en gezamenlijke kelder/BOSLUST-finale. Dat betekent niet dat alle huidige antwoorden of voorgestelde herontwerpen al gezamenlijk goedgekeurd zijn.

| Ruimtecontract | v0.2 vast te reserveren | Nog te beslissen |
|---|---|---|
| Start | Halconsole, westelijke haard, brassbases/leesrichting/standplaats vrij | Verhaalstem G.M. en disclosure; geen decorcode |
| A | Eetkamerdressoir/keukenpanel; pool zuid→noord; sauna-index, trolley | A-herzieningen alleen via gekozen specs; jacuzzi heeft geen bewijs |
| B01 | library + EB.travel in reis, EB.stars in sterren, EB.plants in botanic; alle vóór studiesleutel bereikbaar | Objectpaar→clip→folio-vak is voorkeurskandidaat; geen dubbele embleemketen |
| B02 | Studiekaart/bureau; put/schuur/vuur en overige vijf-landmarkkandidaat ruimtelijk bereikbaar | Oude buttonroute versus nieuwe routevoorwaarden |
| C | Schuur/vuur en lantaarnweide; kort vuur→terras-terugpad | Oude volgorde versus lichtpad; vuur optioneel in kandidaat |
| D | Kelderarchief/console/strip, BOSLUST-cut/trap/passage/zaal | Fragmentbundels/decoder/fysieke payoff en grotere onthulling |
| Kleine vondsten | Tafels/boeken/briefdragers in bestaande en nieuwe optionele zones | Exacte verwijsketen/secret-objectives; geen collectathon afgeleid uit props |

B01-reservering is **geen** parallelle uitvoering van v 0.1-embleemwerkmappen én objectpaarclips. Reserveer rustige 1,2 m inspectieposes: reis(81,5,83), sterren(76,5,90), botaniek(104,5,88), allemaal verdieping 3,35. Kandidaten uit puzzel/environment: koffer met twee riemen/vierkante patch + label met afgesneden rechterbovenhoek/vierkante clip; telescoopvork/twee ronde schroefkoppen + schrift/drie gaten/ronde clip; herbarium met diagonale reparatiestrook + schaar met hoekige/ronde greep/puntclip. Exacte details zijn bewijs, kamerfunctie alleen zoekrichting. Geen folio-oplossing op kamernamenkaart.

Auditcorrectie: de huidige bibliotheekplattegrond draagt ook de embleem→kamerkoppeling; deurplaquettes zijn niet de enige bron. Alleen bordjes verwijderen hoeft daardoor oplosbaarheid niet direct te breken, maar kan hints/oriëntatie inconsistent maken. Brede verwijdering pas na volledige één-modelrevisie en blindtest. Copacabana-naamborden blijven als P-uitzondering en krijgen geen tab/embleemfunctie.

Auditcorrectie gates: startlade/schuur/vuur zijn in de huidige regels deels kennisroute, niet allemaal harde vereisten. Dit plan voegt geen clueflag-gate toe. De tunnelgrendel wordt fysiek bereikbaar zodra de platen toegang tot de zaal geven; de eindbrief/finished-flag is niet noodzakelijk. Dus 'late shortcut na plate-gate' is correcter dan 'pas na finale lezen'. Handhaaf bestaande IDs en codegedrag totdat integratie een expliciete regelswijziging kiest.

## 8. Zichtlijnen, ramen en bereikbaarheid

Behoud primaire as (90,70)→voordeur(90,80,2)→hal en trap; woonkamerdeur→haard. Vanaf terras: lantaarnkring dichtbij en meer/huisje als tweede verre laag. Vanaf huisjeterras: meer onder je en één huis-/padlandmark terug. Oostbosroute onthult wellness/dek pas na boom-/hellingkader. Golf wordt pas zichtbaar aan noordzijde van heuvel; wickerman niet vanuit kernweide als volgende verplichte opdracht uitlichten.

**Zichtintentie is nog geen bewezen raamzicht.** Bestaande window-portals regelen licht, ze maken de raamvlakken niet transparant. Nieuwe echte doorzichten alleen met fysiek muur-/dakgat, juiste collision/occlusion en afzonderlijke zichtportal. B01-inspectie moet ook zonder doorschijnend raam eerlijk leesbaar blijven. Vanuit de open dubbele deur en onder het huisjedak zijn wel toetsbare externe zichtposes te reserveren. Survey met oog 1,65, gewone telefoon-FOV, huidige fog/LOD/culling; noteer elk blokkerend terrein-/kroonvolume vóór art.

Elke verplichte route behoudt korte terugkeer: westelijke woonlus, keuken/biljart-tuindeur, westelijke vuur→terrasverbinding, bovenoverloop-zijlus en late tunnel. Elk nieuw optioneel gebied heeft een retour of een lokale eindplek met duidelijke terugroute. De maat van de kaart wordt niet de maat van de verplicht te lopen route.

## 9. Looptijden en tijdsbudget

Audit: gewone snelheid 3,2 m/s, rennen 5,0, oog 1,65, radius 0,30, stepUp 0,42. De v 0.1-snelheden waren aannames en vervallen als bronclaim. Gebruik 3,2 als theoretisch lopen; voor werkelijk padgebruik 2,0–2,4 effectief incl. turns/inspectie/deuren. Bij trappen/hellingen afzonderlijke meting; sprint niet nodig om de tijdsdoelen te halen.

| Nieuw/gewijzigd traject | Polyline-afstand | Zuiver @3,2 | Praktisch @2,2, vóór inspectie |
|---|---:|---:|---:|
| Portugal heen | 84,87 m | 27 s | 39 s |
| Portugal terug naar lantaarns |119,72 m|37 s|54 s|
| Portugal deurbenadering |5,15 m|2 s|3 s|
| Golf korte zijlus |51,50 m|16 s|23 s|
| Wickerman zijlus |99,79 m|31 s|45 s|
| Oostelijke tuin-/wellnesslus |145,22 m|45 s|66 s|
| Copacabana→sauna via juiste ramp |19,05 m|6 s|9 s + deur/helling|

Geen wetenschappelijke timingclaim: smoothed paths, capsulecirkels, uitgestapte stoelen en echt touchgebruik moeten worden gemeten. Hoofdonderzoekbudget 40–50 min plus 10–20 min optionele verkenning als **werkbudget**; totaalcirca 1 uur. Alle genoemde nieuwe buitenplekken bezoeken kan de sessie verlengen. Geen verplichte puzzels toevoegen om deze meters te vullen.

Pas na controls-only route de core-loopcomponent vastleggen; richtlijn circa 8–12 min bewegen inclusief aankomst. Eén aankomstritueel kan langer duren; herhaalde verplichte passages>35 s zonder keuze, informatie of betekenisvol uitzicht inkorten. Optioneel wandelen mag rust zijn, maar niet de voortgang verstoppen. Op telefoon time-to-return ≤90 s vanuit huisje is een hypothese met inspecties uitgeschakeld; echte test blijft nodig.

## 10. AS-IS reconcile: technische contracten voor latere uitvoering

### Canonical footprints

Het voorstel gebruikt één geometry descriptor per structuur: MANOR/WING/CONS/POOL/TERRACE/COTTAGE/SHED plus expliciet SAUNA/BOSLUST_HUT/CUT en nieuwe Jacuzzi/CottageTerrace/Pad. Roomdefs, holes, padhoogtes, collision, map en placement keepouts moeten later hiervan afleiden. De audit vindt nu nog literals op meerdere plekken; dit document doet niet alsof dat opgelost is.

`hut`-room eindigtZ20, fysieke HUT-footprint loopt totZ22,6; die zijn verschillende contracten en worden niet gelijkgetrokken. Culling-Y-banden zijn voetclassificatie, niet vloer- of dakhoogten. Kelder/trapopeningen hebben eigen vloerpolygonen. Meertje heeft een ellips, geen rechthoekige watercollision.

### Room/culling

Broncontrole telt 49 expliciete portalregels +19 gegenereerde window-portals =68; audit §3.2 noemt 51 expliciet. Die telafwijking wordt hier gecorrigeerd op basis van de gepinde bron, zonder het auditbestand te wijzigen. Alle 68 relaties blijven behouden, inclusief storage→out-raamrelatie; alleen loop/zichtranden worden onderscheiden.

Alle 39 source-room-IDs behouden; v 0.1-voorstelalias northGuest wordt `storage`. `utility` en zolderkamers zijn additief. Bronroomvolgorde upper-before-ground behouden. Overlappende classificaties krijgen expliciet most-specific-first; geen ongewijzigde brede oude storage-box over nieuwe trap/linnen laten liggen. Gast-WC before billiard; utility/pantry zijn niet overlappende kamers; atticLanding vóór overlap met atticStair.

Drie vide-portals hall↔frontGallery, hall↔walkway, library↔libGallery blijven zicht/cullingrelaties zonder looprand. Physical adjacency apart van visibility. Zolder a is nieuw Floor-type, niet door x/out laten vallen. Maps voor buitengebouwen moeten padhoogte/landmark consistent tonen, niet op een verkeerde house-layer classificeren.

Buitenhuid/overkapping expliciet `out` plus gebouwregion; gated binneninhoud eigen room. Niet vertrouwen op 5-punts bounding-sphere sampling voor sauna/huisje/nieuwe luifel. Vanuit vier zijden met deur dicht/open meten of de shell blijft; geen open-deur-gate als zichtvoorwaarde voor een buitenmuur. Grote transparante bong/stoomgroep mag focus/raycast niet overschrijven.

### Saves en IDs

STATE_VERSION4 en echte keys behouden in AS-IS. Geometry-only ontwerp maakt geen migratie of versienummer. Voor latere integratie: source item/clue/mem/door/container/lock/lit/seq/pk/slot/dial-IDs blijven stabiel. `door.storage` blijft toegang tot het verbouwde noordverblijf; `door.consEast` blijft één state voor twee bladen; `door.cottage` beweegt met het huis; `mem.storageBox` beweegt eventueel naar echte zolder. Nieuwe utility-door en eventuele wickermanstate alleen additief na specificatie.

Pose-validator heeft vaste legacygrenzen en moet bij toekomstige uitvoering per scene worden afgeleid uit het gekozen extent, bijvoorbeeld estate marge 5 → X−5…205/Z−5…185. Y-validatie op echte lagen/ruimte, geen onnodige globale verruiming. Anders kan een legitieme save bij het nieuwe huisje/oostbos stil naar checkpoint terugvallen. Controleer ook collision bounds, griddivisies, kaartdimensies, cullingafstanden, vegetation exclusion en tests.

Oude cottagepose of pose in nieuwe partition/trap krijgt een benoemde veilige relocate; inventory, finished, slots en hints blijven behouden. Trial gebruikt bestaande in-memory review sandbox, geen nieuwe echte-save namespace/migratie door deze ontwerpopdracht. Herplaatsing en aliasing leggen ontwikkelaars later in een concrete migrate-test vast. Room-IDs worden niet rechtstreeks als savesleutel verondersteld: runtime content/chunks hangen eraan, save-relevantie zit vooral in interactie/lock/content-ID en pose.

### Placement validation

Verplicht ontwerprecept voor alle nieuwe/reserveerde volumes: (1) fysieke footprint+overstek; (2) deur/raamopening+zwaai; (3) pad/ramp/bordes incl.capsule; (4) bewijspose/zichtkegel; (5) water/oever; (6) zichtbare vegetatiekroon/wortel én collider; (7) gepaste room/region. Een prop-punt buiten een box is onvoldoende als zijn mesh erdoorheen steekt. Decoratie niet op windowAt-frame of tegen dichte raamwand onder een vermeende aperture plaatsen.

Voertuigen, golf, stroman, terraspalen en handmatig staging hebben stabiele IDs. Footprint-/openingkeepouts precederen scatter. Hele-estate deterministische streamconsolidatie is technisch voorstel/open: auditrefactor werkt uitsluitend in samplepad. Geen estate-wide goedkeuring of pixel-identiek normal game claimen. Eventuele per-object streammigratie apart van layout/renderdelta rapporteren.

Audits VD-01 (wanddecor in openingen), VD-02 (begroeiing in footprints), VD-03 (saunahuid verdwijnt) en VD-04 (coplanaire oppervlaktes) zijn rechtstreeks relevant. De blockout moet zulke klassen testen vóór nieuwe props. Auditbaseline bevat eerdere draw-call/triangleoverschrijdingen; deze revisie is niet doorgemeten. Geen automatische uitbreiding van budgets op basis van meer oppervlak.

## 11. Volgende review — zonder implementatie in deze opdracht

Controleer ontwerpsamenhang met puzzels/environment, bepaal open besluiten uit INTEGRATION_OPEN. Daarna pas een apart geautoriseerde blockout: aankomst/hal/start, vier echte trappen, was/toegang, serredubbeldeur/saunaramp, huisjeplateau/terras, golf- en wickermanreservering. Eerst vloer/collision/sightline/culling, daarna representatieve staging. Geen uitgebreide aankleding, merge of deploy.

Acceptatie voor die proef: nieuwe speler vindt hal/woonkamer/eetkamer en hoofdtrap; eerste mantelbewijs vindbaar zonder nepmaquettecode; alle drie B01-clusters vóór studiesleutel bereikbaar; terugkeer vanuit vuur/huisje/zolder; sauna bereikt op echtevloer; beide serredeurbladen houden gate; plateau/oever fysiek droog; echte trappen met hoofdruimte; geen shell-cullingfout of extra blokkade door kratten/auto's; saves houden voortgang en geldige nieuwe-regionpose. Kleine blinde tests moeten het redeneringsmodel aantonen; graphchecks alleen bewijzen verbindingen in ontwerpdata.

## 12. Volledig ruimteprogramma en metrische reserveringen

Onderstaande gegenereerde tabellen horen bij deze versie. Bron-ID is uitvoer-/afstemmings-ID; G/U/A-labels uit Environment Story zijn disciplinealiassen. Maten zijn registratie-/ontwerpboxen tenzij een expliciete footprint/surface is genoemd. Vides/slabgaten zijn afzonderlijk.

### Begane grond

| Runtime/design-ID | Ruimte | X / Z in m | Boxmaat | Vloer Y | Dagelijks | Speler |
|---|---|---|---|---|---|---|
| `vestibule` | Vestibule | 85–95 / 80.4–84 | 10 × 3.6 | 0.15 | Jassen en natte schoenen | Aankomst/oriëntatie; vrije doorzichtas |
| `bstair` | Keldertrap | 92–95 / 98–104.8 | 3 × 6.8 | variabel; profiel | Keldertoegang | 3 seals; fysieke afdaling |
| `hall` | Hal | 85–95 / 84–98 | 10 × 14 | 0.15 | Ontvangst en verdelen boodschappen | Startconsole; trap en westelijke haardroute |
| `lobby` | Achterhal | 85–92 / 98–104 | 7 × 6 | 0.15 | Distributie | Driezegelkeldergate en terugkeer |
| `billiard` | Biljartkamer | 85–95 / 104–109.6 | 10 × 5.6 | 0.15 | Biljart en tuinzitkamer | Optioneel biljart; tuindeur vrij |
| `living` | Woonkamer | 72.4–85 / 80.4–94 | 12.6 × 13.6 | 0.15 | Samen zitten | Mantelbewijs; Nerf/kunst buiten evidencezone |
| `library` | Bibliotheek | 72.4–85 / 94–109.6 | 12.6 × 15.6 | 0.15 | Lezen/documenteren | B01-leestafel en cipherles; proof model pending |
| `dining` | Eetkamer | 95–107.6 / 80.4–92 | 12.6 × 11.6 | 0.15 | Eten en zelfgemaakt bordspel | Bordspel/P-scène; A01-dressoir apart |
| `kitchen` | Keuken | 95–107.6 / 92–109.6 | 12.6 × 17.6 | 0.15 | Groepskoken en afwas | A01; 8 rode kratten en bierkratten apart |
| `corridor` | Dienstgang | 108.4–115.6 / 101–104 | 7.2 × 3 | 0.15 | Serveren/huishouden | Copacabana-naam binnen; pantry/was bereikbaar |
| `workshop` | Werkplaats | 108.4–115.6 / 92.4–101 | 7.2 × 8.6 | 0.15 | Repareren en materialen | Optionele bouwsporen; schuuritems blijven buiten |
| `pantry` | Provisiekamer | 108.4–113.3 / 104–109.6 | 4.9 × 5.6 | 0.15 | Koele voorraad | A01-bestemming; pantrydeur blijft |
| `cons` | Serre | 116–130 / 94–112 | 14 × 18 | 0.15 | Binnenbad / Francois' Copacabana Room | A02 pool/trolley; bar en twee persoonlijke naamborden |
| `guestWC` | WC / wasbak | 85–88 / 104–107 | 3 × 3 | 0.15 | Toilet en handen wassen | Dagelijkse geloofwaardigheid, geen hoofdclue |
| `utility` | Was-/bijkeuken | 113.3–115.6 / 104–109.6 | 2.3 × 5.6 | 0.15 | Wassen/drogen, poetsen, handdoeken | Centrale dienstfunctie; geen puzzelgate |

### Verdieping

| Runtime/design-ID | Ruimte | X / Z in m | Boxmaat | Vloer Y | Dagelijks | Speler |
|---|---|---|---|---|---|---|
| `frontGallery` | Galerij | 85–95 / 80.4–84 | 10 × 3.6 | 3.35 | Voorste circulatie | Aankomstzicht; toegang reis |
| `walkway` | Galerij | 85–86.8 / 84–95.5 | 1.8 × 11.5 | 3.35 | Galerij langs halvide | Zicht op hal; bereik sterren |
| `landing` | Overloop | 85–95 / 95.5–104 | 10 × 8.5 | 3.35 | Bovenverdieping verdelen | Hoofdtrap terug; west/east/zolder keuze |
| `libGallery` | Bibliotheekgalerij | 72.4–85 / 94–109.6 | 12.6 × 15.6 | 3.35 | Langs boeken en hoge leeszaal | Optioneel lezen; vide niet dichtleggen |
| `reis` | Reiskamer | 72.4–85 / 80.4–86.8 | 12.6 × 6.4 | 3.35 | Gastensuite met pakhoek | B01 travel cluster before studyKey |
| `sterren` | Sterrenkamer | 72.4–85 / 86.8–94 | 12.6 × 7.2 | 3.35 | Gastensuite met sterrenhobby | B01 stars; geen volwaardig observatorium claimen |
| `bath` | Badkamer | 85–90 / 104–109.6 | 5 × 5.6 | 3.35 | Gedeeld bad | Herkenbaar sanitair; natte stack boven WC |
| `ucorr` | Gang boven | 95–107.6 / 96–98.6 | 12.6 × 2.6 | 3.35 | Privé-/dienstcirculatie | B01 planten en studiegate; toegang zolder |
| `study` | Studeerkamer | 95–101.3 / 80.4–96 | 6.3 × 15.6 | 3.35 | Werk en administratie | B02-kaart; bestaande gate |
| `botanic` | Botanische kamer | 101.3–107.6 / 80.4–96 | 6.3 × 15.6 | 3.35 | Planten verzorgen/persen | B01 exact plants cluster, bewijsversie open |
| `storage` | Noordgastenkamer | 99–107.6 / 98.6–106.6 | 8.6 × 8 | 3.35 | Derde gastenkamer | Gewone slaapkamer; bron-ID storage behouden |
| `linen` | Linnenkast | 99–107.6 / 106.6–109.6 | 8.6 × 3 | 3.35 | Gedeeld linnengoed | Centraal via achteroverloop, niet alleen gastenkamer |
| `atticStair` | Zoldertrap | 95–99 / 98.6–105.6 | 4 × 7 | variabel; profiel | Dakverdieping bereiken | Echte U-trap; geen teleport |
| `rearNook` | Achteroverloop | 90–95 / 104–109.6 | 5 × 5.6 | 3.35 | Overloop en rust | Boven-zijlus/tuinlicht |
| `rearNookEast` | Zitnis | 95–99 / 105.6–109.6 | 4 × 4 | 3.35 | Achteroverloop | Centrale toegang linnen/zoldertrap |

### Zolder

| Runtime/design-ID | Ruimte | X / Z in m | Boxmaat | Vloer Y | Dagelijks | Speler |
|---|---|---|---|---|---|---|
| `atticLanding` | Zolderoverloop | 95–99 / 98.6–105.6 | 4 × 7 | 6.65 | Trapkop | Veilige terugkeer bij bordes |
| `atticCommon` | Droog-/weekendzolder | 80–95 / 92–104 | 15 × 12 | 6.65 | Grote opslag-/droogzolder | Weekendspullen, optionele ontdekking |
| `atticStore` | Seizoensopslag | 80–95 / 86–92 | 15 × 6 | 6.65 | Seizoensopslag | Optioneel; oude storageBox-memory kan hierheen met ID behouden |
| `atticLookout` | Kijkhoek | 95–101 / 92–98.6 | 6 × 6.6 | 6.65 | Rust/kijkhoek; observatiekamer-reservering | Open I03: echte dakopening vóór claim van observatorium |

### Kelder en BOSLUST

| Runtime/design-ID | Ruimte | X / Z in m | Boxmaat | Vloer Y | Dagelijks | Speler |
|---|---|---|---|---|---|---|
| `bLobby` | Kelderportaal | 89–97 / 104.8–109.6 | 8 × 4.8 | -3.2 | Kelderdistributie | Trap terug en D-toegang |
| `archive` | Archiefkelder | 76–89 / 100–109.6 | 13 × 9.6 | -3.2 | Droog archief | D-bewijs, niet nieuwe lore verzinnen |
| `boiler` | Ketelkamer | 97–107.6 / 100–109.6 | 10.6 × 9.6 | -3.2 | Verwarming/badtechniek | Dagelijkse infrastructuur; geen extra lijncode |
| `route` | Routekamer | 77–89 / 90–100 | 12 × 10 | -3.2 | Oude beheer-/routekamer | D-synthese/strip |
| `tunnel2` | Oude gang | 62–77 / 95.9–98.1 | 15 × 2.2 | -3.2 | Dienstverbinding | Late shortcut |
| `tunnel` | Oude gang | 61.9–64.1 / 57–98 | 2.2 × 41 | variabel; profiel | Dienstverbinding | Late shortcut; geen beloningenpad |
| `descent` | Trap onder de heuvel | 61.7–64.3 / 20–26 | 2.6 × 6 | variabel; profiel | Ondergrond bereiken | Fysieke BOSLUST-trap |
| `entry` | Ontvangstkelder | 58–68 / 26–33 | 10 × 7 | -3.4 | Ontvangst onder heuvel | Oriënteren |
| `passage` | Wortelgang | 61–65 / 33–45 | 4 × 12 | -3.4 | Ondergrondse verbinding | Routeplaten; kandidaat finale anders nog open |
| `gathering` | Verzamelzaal | 55–71 / 45–57 | 16 × 12 | -3.4 | Samenkomstruimte | Brief en terugkeer; grotere onthulling open |

### Buitengebouwen

| Runtime/design-ID | Ruimte | X / Z in m | Boxmaat | Vloer Y | Dagelijks | Speler |
|---|---|---|---|---|---|---|
| `hut` | BOSLUST | 60.4–65.6 / 18.2–20 | 5.2 × 1.8 | 0 | BOSLUST portaal | Cipher gate; blijft andere plek dan cottage |
| `sauna` | Sauna | 132–136 / 100–104 | 4 × 4 | 0.8 | Wellness | A02 bord; cullinghuid en hogere vloer |
| `shed` | Schuur | 39.5–44.5 / 37.2–40.8 | 5 × 3.6 | 0.1 | Buitenonderhoud | C-items/bewijs volgens gekozen regels |
| `cottageEntry` | Huisje | 20.3–29.7 / 157.3–160 | 9.4 × 2.7 | 4.15 | Portugal-huisje entree | Optioneel; aansluiten overkapte terras |
| `cottageRoom` | Huisje / zaal | 20.3–29.7 / 160–164.7 | 9.4 × 4.7 | 4.15 | Spelen en lezen | Persoonlijke spellen/boeken/eten, geen hoofdgate |

### Buitenruimtes

| ID / naam | X / Z | Oppervlak Y | Dagelijks | Speler |
|---|---|---|---|---|
| `arrivalCourt` / Aankomstplein | 80–100 / 61–78 | 0 | Aankomen/lossen | Entree-as; één gravelvlak, geen coplanar disk |
| `parkingWest` / Parkeren drie autos | 69.5–77.9 / 72–77.5 | 0 | 3 stilstaande voertuigen | Context; oorspronkelijke bospadtak blijft vrij |
| `parkingEast` / Parkeren twee autos | 101–106.6 / 72–77.5 | 0 | 2 voertuigen; vijfde optioneel | Geen auto in entree-as of oostbospad |
| `arrivalService` / Manoeuvreer-/bagagestrook | 69.5–108 / 66–72 | 0 | Parkeren en uitladen | Gedeeld voetpad; geen verkeerssimulatie |
| `mainTerrace` / Huis-/tuinverbinding | 78–102 / 110–117 | 0.15 | Zitten en tuin bereiken | Vrije routes keuken/biljart/meer |
| `bbq` / BBQ werkplek | 104–111 / 115–119 | 0.15 | Buiten koken | Bereikbaar vanuit keuken; geen hoofdclue |
| `outdoorDining` / Buiteneettafel | 94–102 / 117–123 | 0.15 | Groepseten | Persoonlijke rustige activiteit; central lawn path remains free |
| `musicBong` / Gravity bong en handpan | 79–85 / 118–123 | 0.15 | Buitenzitten/muziek | Apart laag tafeltje/instrument; geen mechaniek of puzzelcode |
| `balloonNook` / Tank/ballonnen-zitnis | 84–87 / 118–122 | 0.15 | Persoonlijke propgroep | Niet BBQ-werkvlak; geen nieuwe interactie |
| `wellness` / Wellness droogdek | 130–148 / 96–115 | 0.15 | Sauna/jacuzzi/liggen | 2,4m serredubbeldeur, sauna-bord blijft vrij |
| `jacuzziPad` / Jacuzzi uitstap-/onderhoudszone | 137.5–145.5 / 99.5–108 | 0.15 | Bad en onderhoud | Vrije uitstap 1,2m rondom waar bereikbaar; geen indexclue |
| `saunaRamp` / Saunatoegang | 133.4–134.6 / 104–113.4 | profiel/terreinveld | Droge wellnessroute | Ramp .15->.8, vrije breedte1.2 |
| `lanternLawn` / Lantaarn-/samenkomstweide | 84–96 / 122–134 | 0 | Buiten samen zitten | Huidig C2 of kandidaat lichtpad, mechaniek open |
| `lake` / Meertje | 32–76 / 134–158 | -0.35 | Waterlandschap/rust | 44x24 ellips; geen watershortcut |
| `lakeView` / Droge kijkplek | 73–79 / 137–142 | 0 | Bank/oeverbezoek | Water-/huisjezicht; optionele vondst |
| `cottageTerrace` / Portugal overkapte terras | 20–30 / 152–157 | 4.15 | MTG1v1, 30 Seconds, boeken/eten | Optioneel persoonlijk tafelbeeld; canopy supported |
| `golfTee` / Golfafslag achter BOSLUST | 60–66 / 49–55 | 0 | Geimproviseerde golfretour | Optioneel; nooit toegang tot cipher |
| `golfChute` / Kartonnen retourkoker | 62–64 / 38–49 | profiel/terreinveld | Kartonnen baan heuvelop | Niet-beloopbaar; geen ballenfysica |
| `wickerman` / Afzonderlijke stroman-clearing | 159.5–174.5 / 46.5–61.5 | 1.2 | FI geplaatste strofiguur/kaarsen | Optionele ontdekking; burn/leave open, no clue |
| `eastGlade` / Bosweide/oostelijke route | 149–179 / 106–145 | profiel/terreinveld | Landschappelijke boswandeling | Korte zichtwisselingen, geen nieuwe verplichte puzzle |
| `eastForest` / Oostelijke bosmassa | 170–200 / 60–180 | profiel/terreinveld | Beboste helling/grens | Omhulling en afstand; geen lege marge |
| `northForest` / Noordelijke bosrug | 70–170 / 150–180 | profiel/terreinveld | Gelaagde bosrand | Kroonmassa achter water/weide, gerichte huisjezichtlijn |
| `westForest` / Westelijke beboste oever/helling | 0–20 / 72–180 | profiel/terreinveld | Bosrand/onderhoud | Plateau uitsluiten van scatter; geen droge padblokkade |
| `southForest` / Aankomstbos | 0–200 / 0–72 | profiel/terreinveld | Oprit, wandelen, schuur/vuur | Behoud kernlandmarks; golf/wicker aparte pockets |

### Canonical footprints voor toekomstige authoring

| Descriptor | X / Z | Maat | Gezag |
|---|---|---|---|
| `MANOR` | 72–108 / 80–110 | 36 × 30 | retained audit canonical |
| `WING` | 108–116 / 92–110 | 8 × 18 | retained audit canonical |
| `CONS` | 116–130 / 94–112 | 14 × 18 | retained audit canonical |
| `POOL` | 119–127 / 97–109 | 8 × 12 | retained audit; shallow south, deep north |
| `TERRACE` | 78–102 / 110–117 | 24 × 7 | retained anchor, social extensions separate |
| `COTTAGE` | 20–30 / 157–165 | 10 × 8 | V v0.2 same 10 x 8 canonical geometry; moved X-6 vs v0.1 |
| `COTTAGE_TERRACE` | 20–30 / 152–157 | 10 × 5 | V; 10 x 5 roof, supported plateau |
| `COTTAGE_PAD` | 18–32 / 150–167 | 14 × 17 | V; dry plateau, path-exit profiles not instant edge drop |
| `SHED` | 39.5–44.5 / 37.2–40.8 | 5 × 3.6 | retained audit canonical |
| `SAUNA` | 132–136 / 100–104 | 4 × 4 | retained audit literal; proposal lifts into single footprint descriptor |
| `BOSLUST_HUT` | 60.4–65.6 / 18.2–22.6 | 5.2 × 4.4 | retained HUT physical box, distinct from hut culling box ending z20 |
| `BOSLUST_CUT` | 60–66 / 8–18 | 6 × 10 | retained terrain cut |
| `JACUZZI` | 139–142.6 / 101–104.6 | 3.6 × 3.6 | V reservation only |
| `COTTAGE_TERRACE_RAMP` | 18–20 / 151.4–152.6 | 2 × 1.2 | V entry ramp over2m, terrain+4 to deck+4.15 |

## 13. Documentcontrole en resterende besluiten

De ontwerpdata zijn gecontroleerd op unieke IDs, behoud van alle 39 bron-room-IDs, graph-eindpunten, pre-studyKey-bereikbaarheid van B01, vrije diensttoegangen, onveranderde hoofdgebouwfootprints, route-afstanden, padhellingen en droogte van het huisjeplateau. Dit bewijst de samenhang van het ontwerp, niet de speelbaarheid of collision/culling van ongebouwde geometrie. De controle-uitkomsten staan ook in `LEVEL_LAYOUT.json`.

Open besluiten I01–I10 staan met advies, eigenaar en reviewvoorwaarden in `INTEGRATION_OPEN.md`. De terreinmaat, variant A en het verbod op ongefundeerde horizontale huisvergroting zijn daar geen open vragen.

## 14. Begrensde prompt voor een later geautoriseerde blockout

Deze prompt is alleen overdrachtsmateriaal; niets hiervan is nu uitgevoerd.

```text
Werk vanaf een aparte review-branch op de gecontroleerde ef6b7c3… baseline. Lees
LEVEL_PLAN v0.2, LEVEL_LAYOUT, ADJACENCY_GRAPH, DELTA en INTEGRATION_OPEN.
Maak alleen een speelbare neutrale blockout van variant A op 200×180 m.
Behoud MANOR/WING/CONS/POOL en alle bestaande save-relevante IDs/regels.
Gebruik één canonical descriptor voor geometry, openings, collision, map,
room classification en placement keepouts; room-box is geen floor polygon.
Bouw eerst aankomst→hal→woonkamer/haard→eerste bewijs en beide woonlussen.
Daarna vier fysieke trappen, echte a-laag, dienstwas/linnenaccess, dubbele
consEast met één state, saunaramp+bordes, droge Portugal-pad+overkapping en
optionele zijlussen/golf/wickerman als neutrale functiereserves. Geen nieuwe
puzzelregels, antwoorden, brandstate, balfysica of observatoriumcontrols.
B01: bestaande bewijsbronnen behouden zolang I01 niet definitief is; reserveer
alle drie pre-studyKey-inspectieplekken. Pas geen dubbele bewijsgrammatica toe.
Raamportals bewijzen geen fysiek raamzicht. Toets echte gaten waar ontworpen.
Houd exterior shells zichtbaar vanuit out; inhoud gated per room/region.
Gebruik bestaande in-memory review sandbox. Geen echte-save migratie, brede
RNG-refactor, uitgebreide props, merge of deploy. Pose/extentcompatibiliteit
eerst in review testen; inventaris/voortgang behouden.
Rapporteer vóór art: oriënteren, bereikbaar eerste bewijs, B01 pre-key, korte
retour, continue trap-Y en vrije hoofdruimte, deur/capsule/gate, droogte,
shell-culling, placement-envelope overlap en performance. Geen pass claim
zonder werkelijk uitgevoerd checkbewijs. Stop bij een concrete blocker met
locatie/oorzaak en minimale oplossing; hoofdgebouw niet op gevoel vergroten.
```
