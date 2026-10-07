# Feh Lu We — ART_BIBLE v0.1

Datum: 6 oktober 2026. Status: **ontwerpvoorstel voor één sample; geen stijlgate en geen opdracht voor brede uitrol**.

## 1. Werkbasis en bewijslimiet

Doel: circa één uur warm mysterie en speelse escape room rond WBW/Veluwe-weekenden. Persoonlijke herkenning verrijkt; verplichte antwoorden blijven uit spelbewijs afleidbaar. First-personafstand en een echte telefoon bepalen de kwaliteit, niet een decoratieve overzichtsrender.

Gelezen: aangeleverd `Feh_Lu_We_Design_Startpakket.md` (basiscommit `62bfd0e7cb37534bc2031f60f7ac155272467a35`), plus onderstaande repositorybestanden op de huidige standaardbranch `ccr-75ef4113-kfkimm`, HEAD `338e65617e51385bae557f573ba092af5a10f89d`:

- `docs/art-refresh/STYLE_TARGET.md`, inclusief de correcties bovenaan.
- `docs/art-refresh/INTERIOR_SAMPLE.md` en `EXTERIOR_SAMPLE.md`, inclusief exterior consolidation revision 2.
- `docs/ART_DIRECTION.md` als historische context; STYLE_TARGET vervangt dit als visueel doel.
- `src/world/artkit.ts`, `livingSample.ts`, `env.ts`, `src/content/symbols.ts` en `src/ui/style.css`.

De actuele voorgestelde bestanden `docs/design/CORE_BRIEF.md`, `LEVEL_PLAN.md`, `ENVIRONMENT_STORY.md`, `PUZZLE_GRAPH.md` en `UX_GAME_FEEL.md` staan niet in de opgehaalde repositoryboom. De zichtbare specialistische prompts zijn geen discipline-uitkomsten. Dit document gebruikt daarom de kern uit het startpakket, zonder een definitieve nieuwe plattegrond of puzzelstructuur te claimen.

De aanwezige screenshotbestanden konden niet als pixels worden opgehaald. Er is geen nieuwe live-walkthrough gedaan. Uitspraken over vorm en kleur van de huidige samples hieronder zijn broncodebevindingen of gerapporteerde samplebevindingen, geen onafhankelijke visuele audit. De twee gegenereerde boards zijn voorstellen, geen captures van de build en geen performancebewijs.

Bronlocaties: [repository](https://github.com/Algolon/Feh-Lu-We/tree/338e65617e51385bae557f573ba092af5a10f89d), [STYLE_TARGET](https://github.com/Algolon/Feh-Lu-We/blob/338e65617e51385bae557f573ba092af5a10f89d/docs/art-refresh/STYLE_TARGET.md), [INTERIOR_SAMPLE](https://github.com/Algolon/Feh-Lu-We/blob/338e65617e51385bae557f573ba092af5a10f89d/docs/art-refresh/INTERIOR_SAMPLE.md), [EXTERIOR_SAMPLE](https://github.com/Algolon/Feh-Lu-We/blob/338e65617e51385bae557f573ba092af5a10f89d/docs/art-refresh/EXTERIOR_SAMPLE.md).

## 2. Drie coherente verfijningen

| Richting | Vorm, kleur en sfeer | Sterkte | Afweging en kosten |
|---|---|---|---|
| **A — Zacht geïllustreerd landhuis** | Bredere rondingen, milde contrasten, grote kleurvlakken, compacte boomkronen; papier als geïllustreerd dagboek | Direct gastvrij en speels; makkelijk leesbare grote vormen | Risico op speelgoed, kussenbomen en vervagende materiaalverschillen. Sculpted meubels en organische hero-assets vragen extra revisie. Mysterie moet vooral uit staging komen |
| **B — Warm vakwerk, helder bewijs — advies** | Dragende constructie zichtbaar; stevige vlakken; zachte randen waar materiaal of aanraking dat verklaart; krijt, eiken, mos, oker en kleine levendige accenten | Verbindt geloofwaardige weekendplek, tastbaarheid en puzzelhelderheid. Sluit aan op aanwezige artkit en samples | Minder spectaculair op een hero-render, maar beter schaalbaar. Kosten zitten in goede assetprofielen, compositie en bewijscontrole; niet in veel shaders of veel verschillende materialen |
| **C — Landhuis als grafisch prentenboek** | Strakkere silhouetten, minder textuur, duidelijkere waardevelden, ingetogen kleurblokken; drukwerk met sterke inktvormen | Sterk op kleine schermen; compact materiaalpakket; karaktervolle documenten | Grote kans op te vlakke wereld. Omgeving vereist zorgvuldig gericht licht en contactgronding. Een aparte vlakke shaderstijl zou een grotere technische wijziging zijn; die is niet nodig voor de eerste proef |

**Kies B**, met A uitsluitend voor stoffering en C voor functionele graphics. Dat is één grammatica met materiaalvariatie, geen collage van stijlen.

De onderscheidende belofte: **een echt gebruikt Veluws weekendhuis, alsof het zorgvuldig met de hand is gebouwd, waarin je helder kunt kijken en zelf verbanden leggen**. Een generiek fantasylandgoed met runen, magische gloed en kasteelornament haalt de stijl weg van jullie herkenning.

### Vier expliciete spanningen

- **Zachtheid versus leesbaarheid:** zachte aanraking, scherpe betekenis. Kussens mogen buigen; deurkaders, handgrepen en onderscheidende symbooldelen behouden duidelijke contouren. Niet iedere rand bevelen en niet ieder materiaal gladstrijken.
- **Knusheid versus mysterie:** het huis blijft bewoonbaar. Mysterie ontstaat uit een ongewoon geplaatste voorbereiding, gedeeltelijk zicht en een warm doel achter een koeler tussengebied. Donkerte is geen vervanging voor een interessante vraag.
- **Variatie versus eenheid:** vaste constructie-, materiaal- en grafische regels; lokale accenten per functie. Een bibliotheek wordt geen ander kleuruniversum. Persoonlijke objecten mogen afwijken omdat ze juist herkenningspunten zijn.
- **Resultaat versus kosten:** investeer eerst in wat op de benaderingsafstand zichtbaar is. Een duidelijk kopjesoor kan meer waarde hebben dan zestig extra dennenappelschubben. Optimaliseer scènekosten én authoringtijd; geen dogma dat alles procedureel of alles in Blender moet.

## 3. Wat behouden, toetsen en uitstellen

| Onderdeel | Vastgestelde werkbasis | Besluit voor deze bible |
|---|---|---|
| Meubels/architectuur | Artkit heeft softBox, lathe, profielen, UV-projectie en contactschaduw; sample heeft zichtbare constructiedelen | Behouden als uitgangspunt; toetsen in clay en op gewone afstand |
| Materialen | Lambert voor stof/hout/steen/verf; Phong voor messing/keramiek | Behouden. Geen PBR-conversie nodig |
| Kleuren | Sample heeft mosbank, okerstoel, donkerrode gordijnen, lichte steen en kleine messing/keramiekaccenten | Behouden als ankers; gezamenlijk beoordelen in render |
| Licht | ACES/exposure 1.15 aanbevolen in sample; lokaal veranderd fill/fixture-aandeel | Voorlopige baseline. Geen globale tonemapperwissel op basis van één kamer |
| Symbolen | Eén `SYMBOLS`-bron voor wereld, panelen, notities en hints | Essentieel behouden; geen nieuw concurrerend pictogramsysteem |
| UI | CSS bevat papier/inkttokens, algemene serif, grote touchknoppen en amberfocus | Visuele verfijning voorstellen; gedrag blijft eigendom van UX |
| Bomen | Revision 2 gebruikt takstructuur, behoud van outlineclusters tussen LODs, instanced fallback | Behouden als productieroute; verder detail alleen bij aantoonbare visuele winst |
| Ruimte/terrein | Groter huis, zolder, meertje en huisje op heuvel zijn wensen | Vormtaal toepasbaar, maar geen nieuwe bouwmaten of routes vastleggen |
| Kamerbordjes | Huidig bibliotheekbewijs hangt ermee samen | Niet verwijderen in een artopdracht. Eerst goedgekeurde vervangende bewijsroute |

## 4. Operationele vormregels

### Silhouet en proporties

**Architectuur:** entree, hoofdvolume en diensttoevoeging lezen als een familie. Dragende delen komen uit op een steunpunt; ramen hebben negge/dorpel; dakmassa volgt bewoonbare ruimte. Geen extra torens of dakkapellen zonder ruimtelijke reden. Details mogen een bereikbaarheidsbelofte niet veinzen. De maatvoering komt uit LEVEL_PLAN, niet uit conceptart.

**Meubels:** herkenbaar dagelijks type vóór ornament. Tafel heeft blad, regelwerk en dragende poten; stoel heeft zitting, rug en frame. De bestaande samplematen (bank 2.3 m, stoel circa 0.88 × 0.86 m) zijn huidige werkbasis, geen nieuwe schaalnorm. Handgreep, voet en oor kunnen bij onduidelijke projectie circa 10–15% worden vergroot, zolang de herinnering en interactiekloppen; altijd vergelijken met oorspronkelijke contour.

**Natuur:** kroon uit takstructuur, niet uit één centrale bol. Eik: zijwaarts dragende takken, brede ongelijke kroon; grove den: hoger geplaatste losse kroon en meer zichtbare stam. Berk en beuk kunnen variatie leveren, maar eerst bestaande soorten leesbaar houden. Wortelaanzet uit stamvolume; geen losse vinnen. Rotsen zijn deels begraven, met enkele dragende vlakken; geen steenconfetti.

**Persoonlijke props:** behoud minimaal twee onderscheidende kenmerken uit Omars referentie: silhouet plus kleurverdeling, verhouding, opschrift of kenmerkende beschadiging. Een algemeen blauw kopje is geen herkenbare persoonlijke mok. Zonder referentie mag het een fictieve prop zijn, nooit een beweerd authentiek groepsobject.

### Edge treatment — startwaarden, meters

| Familie | Richtwaarde zichtbare afronding | Regel |
|---|---:|---|
| Grote hout/verfonderdelen | 0.004–0.012 m | Vlak oppervlak behouden; kleine chamfer aan zichtbare hoeken |
| Handvat, stoelarm, vaak aangeraakte rand | 0.008–0.020 m | Iets zachter waar gebruik dat verklaart; geen kromtrekken van rechte constructie |
| Bekleding | 0.025–0.060 m | Afronding plus geringe kroon; naden selectief, geen opgeblazen marshmallowvorm |
| Steenprofiel/haard | 0.010–0.030 m | Bevel op contactranden; enkele brede vlakwissels |
| Klein bewijsobject | Afhankelijk van projectie | Eerst kenmerkende negatieve ruimte en contour; detail niet wegbevelen |

Dit zijn authoringbanden voor een proef, geen eis om elk onderdeel tessellatie te geven. Bevel uitsluitend als hij in de render contour of lichtvangst verbetert. Vermijd glinsterende éénpixelranden bij bewegen. Smooth normals voor hout/stof/organisch; deliberate flat of split normals voor steen en dakvlakken; geen automatische harde facets over alles.

### Detail op afstand

| Tier | Spelafstand (voorstel) | Zichtbare informatie | Productieregel |
|---|---|---|---|
| Landmark | Circa 15–50 m | Groot silhouet, helder toegangsvolume, warm/koud laagverschil | Geen fijne textuur als redding; geen verplicht symbool lezen |
| Ruimte/zone | Circa 3–15 m | Functie via objectgroep; boomsoort en meubeltype | Grote constructiedelen en materiaalverdeling |
| Interactie | Circa 0.7–3 m | Handgreep, relevant oppervlak, herkenbare prop, inspecteerbaarheid | Detailbudget naar onderscheidende vorm |
| Inspectie/UI | Schermvullend | Exact bewijs, labels, relevante binnenvormen | Schone vector/tekstbron; toegankelijke transcriptie waar bestaand |

Afstanden variëren met FOV, resolutie en hoogte. Geen universeel tri-budget per asset. Als bewijs op 2 m slechts enkele pixels inneemt: eerst staging/afmeting/inspectie controleren, pas dan meshdetail toevoegen. Voor symbolen is circa 24–32 CSS-px in een inspectievoorvertoning een startpunt; het volledige bewijsbeeld moet groter te openen zijn.

## 5. Kleur, materiaal en licht als drie aparte lagen

### Kleurenhiërarchie

1. Grote rustige dragers: krijt/plaster, eiken, zandsteen en natuurlijke groenen.
2. Ruimtekarakter: mosbank, okerstoel, donkerrood gordijn of één andere beperkte accentfamilie.
3. Kleine levendige accenten: keramiekblauw, messinghighlight, bloemen en persoonlijke kleuraccenten.
4. Functionele graphics: inkt op licht papier; amber voor focus/selectie; status krijgt ook een vorm/label.

Als compositiestart: circa 70% drager, 25% secundair, 5% accent in een gekozen frame. Geen oppervlaktemandaat: de beeldhiërarchie telt. 'Alleen licht mag verzadigd zijn' is te streng voor levendige persoonlijke objecten. Licht is doorgaans het helderste gebied; het bewijs krijgt plaatselijk voldoende contrast, niet automatisch de felste kleur.

### Tokens — base colour, niet het verwachte eindpixel

| Token | Hex | Gebruik / herkomst |
|---|---|---|
| `world.plaster` | `#E4D6BA` | Sample chimney breast; grote rustige drager |
| `world.joinery` | `#E2D6BC` | Sample geverfde omlijstingen |
| `world.sandstone` | `#D2C3A2` | Sample haard |
| `world.oak` | `#7E5636` | Sample tafel |
| `world.walnut` | `#4E3320` | Sample frame/voeten |
| `world.moss` | `#62704A` | Sample bank |
| `world.ochre` | `#B3813F` | Sample stoel |
| `world.oxblood` | `#7A2E2A` | Sample gordijn |
| `world.brass` | `#C9A14E` | Sample messing basiskleur |
| `world.ceramicBlue` | `#6F91A6` | Nieuw voorstel; geen functioneel symbool-ID |
| `world.water` | `#668F89` | Nieuw voorstel voor kalm water; in scène valideren |
| `ui.paper` | `#F5EAD2` | Bestaande UI |
| `ui.paperRaised` | `#FFF8E8` | Bestaande UI kaartvlak |
| `ui.ink` | `#2B2118` | Bestaande UI en symbolen |
| `ui.focus` | `#D9A441` | Bestaande amber; donkere tekst erop |
| `ui.hudSurface` | `#241F1A` | Nieuw donker vlak, circa 90% dekking als start |
| `ui.error` | `#8F3F36` | Nieuw voorstel, naast kruis/tekst |
| `ui.success` | `#456548` | Nieuw voorstel, naast vink/tekst |

Het JSON-bestand bevat deze tokens, provenance en materiaalregels. Het is een ontwerpconfiguratie, geen direct te importeren API voor het spel. SymbolDef-kleuren blijven canoniek; vervang ze niet door deze algemene palette.

### Basiskleur

Kleurtextuur in sRGB; renderer decodeert naar linear. Part/vertextint is een multiplier in de shader. Licht en shading beïnvloeden vervolgens het resultaat, waarna tone mapping en sRGB-output volgen. Tint en texture moeten samen beoordeeld worden. De oude shorthand 'kleur kwadrateren' uit STYLE_TARGET is expliciet gecorrigeerd.

Voor breed hergebruik: rustig near-neutral houtnerf/weefsel met partkleur. Een gekleurd kleed of herkenbare persoonlijke print mag volledig gekleurd zijn, met neutrale tint. Niet onbedoeld nog een verzadigde hue erbovenop vermenigvuldigen. Terrain: inspecteer werkelijk texture-mean × vertexkleur voordat je mossig bos toevoegt bovenop groene lawntexture.

### Authored shading

Verticaal gradientje, contactocclusie en naden uitsluitend waar structuur ze verklaart. Voor nieuwe algemene assets: begin met lineaire vertexmultiplier 0.80–1.00; uitsparingen eventueel tot circa 0.65 na controle. Bestaande vuurhaard/roet mag functioneel donkerder zijn. Dit zijn startwaarden, geen schatting van de huidige scene.

Niet drie 'lit/mid/shade'-kleuren als materiaal aanbrengen bovenop gericht licht. Geen ingebakken warm lamplicht dat zichtbaar blijft wanneer de lamp uitgaat. Contactdecal voor gronding blijft neutraal, volgt voetafdruk met circa 0.15–0.20 m zachte falloff (samplewerkbasis), blijft onder het object en kruist geen deur of vloerhoogte. Zet alle authored shading uit in clay om vormproblemen niet te maskeren.

### Werkelijk licht en atmosfeer

Behoud ACES en exposure 1.15 als eerste vergelijking; dat is de huidige sample-aanbeveling, geen definitieve globale stijlgoedkeuring. Bestaande interior treatment meldt fixture gain 1.35 en fill 0.72; begin daar, verander niet tegelijk de tonemapper.

Een koelere window-sky boven en warmer vloerbounce onder modelleren vorm. Warm lokaal licht verklaart lamp/haard; emissive en lightpool volgen hun logische aan/uit-status. Een oranje geverfde vloer is geen lichtbron. Houd lichttoewijzing kamerbewust; art belooft geen nieuw systeem voor shadows of realtime GI.

Buiten: voorgrond heeft materiaalidentiteit, middenlaag een duidelijk doel, verte minder contrast en een koelere tint. Mist scheidt lagen en begint niet zo vroeg dat dichtbij bewijs of pad verdwijnt. Geen extra mist als oplossing voor zwakke terreinbegrenzing. Een meertje is een rustig kleurvlak met minimale beweging, geen dure SSR/refraction-belofte. Reduced motion behoudt een stil water-/blad-/vuurbeeld zonder noodzakelijke informatie te verliezen.

### Material rules

| Materiaal | Huidige route / voorstel | Toegelaten karakter | Afwijzen |
|---|---|---|---|
| Plaster/verf | Lambert; rustige partkleur | Brede vlakken, lichte lokale variatie | Wolkenruis of dirt overlay op elke muur |
| Hout | Lambert, gedeelde grain map | Nerf langs dragende richting, herkenbare kopse kant | Ieder onderdeel eigen material/texture; korrel op schermschaal |
| Stof | Lambert, near-neutral weave | Kroon, vouw, piping op hero-rand | Geometrisch weefsel en overal tufting |
| Steen | Lambert, restrained map | Coursing op bouwwerk; brede facekeuzes op rots | Ook natuurlijke rotsen als gemetselde blokken behandelen |
| Messing | Bestaand Phong: specular `#D8B26A`, shininess 38 | Kleine accenthighlight, genoeg basiskleur om zonder glans herkenbaar te zijn | Goudglanzende grote UI/wereldoppervlakken |
| Keramiek | Bestaand Phong: specular `#6A6A66`, shininess 70 | Schone vorm, band/patroon als identiteit | Spiegelreflexen, miniatuurornament als enige herkenning |
| Bladwerk | Bestaande woodkit/atlasroute | Takvorm, rustige clustervariatie, leesbare onderzijde | Black undersides, uniforme bollen, iedere blade DoubleSide |
| Papier | CSS/SVG/Canvas afhankelijk van context | Rustig ivory veld, inkt, rand op decoratielaag | Vlekken en scheuren achter codes; fysiek font op vervormde texture |

Geen roughness/metalnesswaarden als opdracht voor Lambert/Phong. Alleen bij een expliciete latere PBR-migratie vertalen; materiaalmodellen zijn niet één-op-één equivalent.

## 6. Eén grafische grammatica van wereld tot UI

### Symbolen en vormen

`src/content/symbols.ts` blijft single source: dezelfde ID, Nederlandse naam, contour, oriëntatie en betekenis in wereld, inspectie, notities en panelen. Geen emojis als vervanging van puzzelsymbolen. Functionele iconen (tas, sluiten, notities) mogen een eenvoudiger lijnfamilie vormen, maar mogen niet op puzzelsymbolen lijken.

Canvas/SVG-export blijft bij de huidige viewBox 0–100. Bij 32 CSS-px circa 2 px contourdikte als start voor hoofdlijnen; vereenvoudig alleen via een expliciet goedgekeurde kleine variant met dezelfde onderscheidende kenmerken. Een kleine veer moet geen blad worden; kopjesoor moet open blijven; dennenappel moet geen algemene ovaal worden. Noodzakelijke binnenvormen mogen niet in anti-aliasing verdwijnen. Geen automatische nieuwe iconen uit een imagegen-board overnemen.

Een afgeronde rechthoek is een interfacehouder; een cirkel is een neutraal bekeken/registratiebadge; een gestippeld kader is een hypothesevoorstel. Geen globale mapping 'messing = puzzelrelevant': de specifieke messingstaanders in de mantelketen dragen lokaal bewijs. De stijl mag die relatie niet veralgemenen of wegpoetsen.

### Typografie en papier

Voorstel: **serif voor documenttitels en sfeer, sans-serif voor bediening en lange functionele informatie**. Start zonder extra download: `Georgia, Iowan Old Style, Palatino, serif` voor titels; `system-ui, -apple-system, Segoe UI, sans-serif` voor UI/body. Volgorde wordt op Android en iOS gecontroleerd; dit zijn families, geen identieke metrics op elk toestel.

- Body 16 CSS-px, line-height 1.45–1.55; belangrijke clue-transcriptie 18 px waar ruimte bestaat.
- UI-label 14–16 px; 13 px uitsluitend secundaire metadata; geen essentiële code in een decoratief klein label.
- Titel 22–28 px; alleen korte koppen in capitals, geen lange regels in tracking.
- Codes/nummerinvoer: onderscheid 0/O, 1/I/l; waar nodig tabular numerals of monospace. Geen nieuwe cijfersymboliek toevoegen.
- Kaartlabels liggen op een rustig vlak en draaien niet mee met een decoratieve papierhoek. Kaartgeometrie blijft afkomstig van leveldata.
- Papergrain maximaal circa 3% opacity als decoratieve boven-/onderlaag; achter essentieel bewijs 0%. Schaduwrand en omslag suggereren een notebook; geen 3D-pageflip nodig.

### Statussen en visuele feedback — voorstel afstemmen met UX

| Status | Vorm en label | Kleur | Betekenisgrens |
|---|---|---|---|
| Focus | Duidelijke rand/reticle plus actie-werkwoord | Amber op donker | Binnen de huidige focuslogica, geen nieuw wallhack/outline |
| Geselecteerd item | Binnenrand plus zichtbaar label 'Geselecteerd' | Ambervlak met inkt | Geen alleen-kleurverschil |
| Bekeken | Kleine cirkelbadge + 'Bekeken' | Inkt | Registratie, nooit bewijs dat het verband begrepen is |
| Hypothese | Gestippeld kader + 'Hypothese' | Inkt | Alleen echte spelersnotitie of expliciet gelabeld ontwerpvoorstel; niet automatisch een inferentie genereren |
| Geblokkeerd | Dicht slot + korte oorzaak | Inkt | Betrouwbare toestand, geen verzonnen puzzelhint |
| Verkeerde invoer | Kruis + 'Nog niet juist' | Rood accent | Alleen de poging markeren; feedback toont geen juist deel tenzij puzzelregels dat al doen |
| Opgelost | Vink + label, zichtbare wereldverandering | Groen accent | Alleen authoritative gamestate; niet gelijk aan bekeken |

Huidige UI ondersteunt niet per definitie al deze onderscheidingen. Een hypothesefunctie is een UX/productbesluit; de art sample mag die niet heimelijk toevoegen. Bestaande state kan alleen met een juiste bestaande betekenis worden hertekend.

Tuningvoorstel: focusovergang 100–150 ms, knoprespons 80–120 ms, resultaataccent 200–350 ms; reduced motion gebruikt directe statewissel. Geen knipperende bewijsgloed, generiek gouden spoor of constante oplossingmarkering. Essentieel geluid krijgt zichtbare equivalent via het UX-contract.

### Mobiele leesbaarheid

Bewijs krijgt schoon contrast en grotere inspectie; sfeer wordt lokaal rustiger. Voor UI acceptatie: bodytekst minstens 4.5:1 en grote tekst/functionele contouren minstens 3:1 tegen hun werkelijk samengestelde achtergrond. Dit zijn gekozen projectchecks, geen claim dat de gehele huidige UI conform is. Controleer semitransparante HUD op licht raam én donkere haard; gebruik een steviger vlak als contrast faalt.

Voorstel tokens: control ≥48 × 48 CSS-px; primary action circa 64 px hoog; panelradius 12 px, controlradius 8 px; gap 8/12/16/24 px. Bestaande HUD heeft al 52 px controls en een 72 px action: niet verkleinen om de mockup passend te maken. Safe-area blijft technisch leidend. Portrait, browserzoom, virtual keyboard en tekstwrapping worden met UX gecontroleerd.

## 7. Reference board en representatieve mockups

De twee boards in deze oplevering zijn **zelf gegenereerde ontwerpstudies**. Ze vervangen de oorspronkelijke R1–R6 niet en worden niet voorgesteld als visuele inspectie ervan. STYLE_TARGET bevat wel hun schriftelijke lenen/afwijzenanalyse. Uit die tekst nemen we constructielogica, eye-level routeframing en Europese soortidentiteit als principes; geen asset-, shader- of licentieclaims.

Board 1 is een contrastreferentie: fraai, maar te realistisch voor het doel. Board 2 is de voorkeursrichting, nog steeds te toetsen in de echte renderer. Letterpanelen corresponderen tussen beide, maar zijn geen gecontroleerde A/B-renders: de generator veranderde ook compositie en licht.

| Paneel | Wat lenen we uit board 2 | Wat wijzen we af / corrigeren | Toepassing |
|---|---|---|---|
| **A — Kamer** | Brede plastervelden, stevig haardprofiel, mos/oker/oxblood, beperkte meubels en duidelijke constructie | Geen nieuwe kamerindeling uit dit beeld. Speelse facetten op stof verminderen; mantelgroep en staanders moeten het echte canonbewijs behouden. Boeket mag aandacht niet van bewijs trekken | Bestaande woonkamer als eerste sample; vanaf hal, bank en mantel toetsen |
| **B — Buiten** | Zichtbare takken en kroonopeningen, warm klein doel in koele/groene lagen, rustige pathverge | Nog vrij dicht en bloemrijk; minder ondergroei in hoofdzichtlijn. Geen nieuwe architectuur/poortvorm of andere clueplaats uit het board afleiden | Bestaande BOSLUST-sample dient als samenhangstest, niet als tweede bouwopdracht |
| **C — Puzzel/document** | Ivory/inkt, grote enkelvoudige pictogrammen, duidelijke leegte en rustige messingrand | Dit is geen werkende UI; leegtevakken en badges zijn illustratief. Geen nieuwe volgorde, automatische hypothese of andere inputregel uit het beeld afleiden | Bestaande mantelinspectie/notitie/panel grafisch verfijnen met canonieke SVGs |
| **D — Materiaal** | Dragend houten frame, materiaalafhankelijke bevels, scheiding stof/hout/steen/keramiek | Nog te veel realistische nerf en dicht weefsel; geen geometrische vezels. Messing geen algemeen bewijslabel | Eén stoel/tafel/hero-prop, front én achterzijde beoordelen |
| **E — Tuin/water** | Brede open grond, asymmetrische oever, rustige watermassa, klein warm gebouw als secundair landmark | Reflectie/rimpels verder versimpelen. Heuvel, grootte, steiger en huispositie zijn niet goedgekeurd; geen landscapeplan overnemen | Later toepassen na levelblockout, nu alleen palette/silhouettest |
| **F — Kaart/graphics** | Vereenvoudigde families, rustige paperdrager, donkere icoonvormen | De afgebeelde kaart is fictief en mag niet in spel. Geen zichtbare onbekende routes/locaties vóór ontdekking. Controls meer contrast geven indien nodig | Data-gedreven kaarten, UI-familie en notebookdrager |

### Samenhang tussen kamer, buitenwereld en puzzel/UI

| Relatie | Kamer | Buiten | Puzzel/UI | Check |
|---|---|---|---|---|
| Constructie | Eiken frame draagt blad | Post/frame draagt lantern/arm | Rechthoekig kader draagt bewijs | Ornament pas na begrijpelijke constructie |
| Rand | Klein bevel, zachte stof | Rotsvlak met zachte rand, organische contour | Rustige radius, stevige inktcontour | Geen universeel puffy of universeel faceted |
| Kleur | Krijt + moss/oker + klein accent | Aard/mos + koele verte + warm doel | Ivory + inkt + klein focusaccent | Niet één oranje waas over alle drie |
| Detail | Groot meubeltype vóór nerf | Tak/kroon vóór blad | Exact pictogram vóór papergrain | Reductie blijft betekenisvol |
| Mysterie | Voorbereidingsspoor/partieel zicht | Gedeeltelijk onthulde bestemming | Niet ingevuld verband | Geen antwoord uit sfeergraphics |

Board 2 is geen opdracht om het bestaande sample naar het plaatje te forceren. Als de in-game stoel, boom of documenten beter lezen, wint die uitvoering. Voor productie gebruiken we gemeten identieke camera's.

## 8. Geprioriteerde assets en hergebruik

| Prioriteit | Asset/familie | Waarom eerst | Scope / contract |
|---|---|---|---|
| **P0** | Canonieke clue-symbolen + inspectierender | Eén verkeerde contour kan puzzelfairness breken | Bestaande IDs, oriëntatie, bijschriften en bewijsrelaties behouden |
| **P0** | Mantelstaanders, veer, dennenappel, kopje, decoys | Eerste bewijs en herkenning; toont relatie fysieke/grafische vorm | Niet dezelfde onderscheidende voet/glans aan decoys geven |
| **P0** | UI-paper/ink/focus + type | Alle noodzakelijke informatie op telefoon | Eerst bestaande inspectieflow; geen nieuwe functies |
| **P0** | Baseline captures/poses + review entry | Maakt artbesluit eerlijk vergelijkbaar | Isolatie/saves controleren; bestaande scripts hergebruiken |
| **P1** | Haardprofiel, negge, plaster ceiling | Kamerbouw en materiaalidentiteit | Bestaande collision, mantel en light-state |
| **P1** | Stoel→bankfamilie en één tafel | Reuse van constructiegrammatica | Nabijdetail gericht; niet alle meubels vervangen |
| **P1** | Contactgronding en fixture-on/off | Tastbaarheid met beperkt renderwerk | Voetafdruk klopt; uit betekent werkelijk uit |
| **P1** | Eik/grove-den, outline-LOD, padverge | Binnen-buitenstijl toetsbaar maken | Bestaande exterior sample als referentie; fallbackmarge open |
| **P2** | Persoonlijke mok/boek/speldoos/foto | Authenticiteit zodra referenties beschikbaar zijn | Omar levert herkenningsdetails en gebruikscontext; geen generieke fantasyvervanging |
| **P2** | Kaarten/documenttemplates | Zelfde grammatica op meer bewijsdragers | Actueel level/puzzelontwerp, geen antwoordlekkage |
| **P3** | Nieuwe zolder-, meer-, huisje-assets | Afhankelijk van ruimtelijke beslissingen | Wachten op blockout en hoofdroutetest |
| **P3** | Extra soorten/ornament/shadereffecten | Alleen voor geconstateerde hiaten | Niet toevoegen om lege ruimte te vullen |

Persoonlijke input met hoogste effect: één hero-object van dichtbij en in zijn oorspronkelijke gebruikscontext; aangeven welke twee kenmerken vrienden direct herkennen. Geen uitgebreide referentiebibliotheek nodig om het eerste sample te bouwen.

## 9. Productieroute beoordelen op resultaat

**Start met de bestaande codekit.** Die heeft al representatieve meubels, haard en boomstructuur. Voor architectuur, profielen, frames en variabele meubels is dit een redelijke werkbasis. Parametrisch bouwen is pas hergebruik als varianten dezelfde kwaliteit behouden.

**Gebruik authored GLB waar de codekit een specifiek herkenbaar silhouet blijft missen.** Kandidaten: een persoonlijke hero-prop met asymmetrische vorm, of een boom waarvan het skelet na gerichte revisie nog generiek oogt. Doe eerst één afgebakende revisie met duidelijke tekortkoming. Vergelijk daarna code en authored uitvoering onder dezelfde omstandigheden. Geen verplichte Blenderstap, geen weigering van Blender om principe-redenen.

| Route | Geschikt voor | Risico/kosten | Objectieve proef |
|---|---|---|---|
| Bestaande codekit | Bouwprofielen, meubelfamilies, gedeelde materiaalregels | Generieke vormen als parametrisering het ontwerp vervangt | Clay, twee benaderingshoeken en interaction-distance |
| Authored GLB | Unieke persoonlijke prop, complex asymmetrisch hero-silhouet | Assetauthoring, UVs/LOD/licentie/import/collision alignment | Zelfde plaats, schaal, licht, material response en visuele taak |
| Canvas/SVG/CSS | Exacte symbolen, bewijsdocumenten en UI | World-texture kan te klein worden; inconsistenties als dubbele bron | Dezelfde canonical paths, phone preview en inspectie |
| Imagegen | Concepten en sfeeronderzoek | Schijnbare productierijpheid, foutieve graphics/geometrie | Alleen ontwerpkeuze; nooit code, puzzelbron of benchmark |

Een winnaar voldoet eerst aan leesbaarheid/fairness en technische contracten. Vergelijk vervolgens silhouet, constructie, herkenning, scene-coherentie, renderkosten, laadkosten en authoringtijd. Geen gemiddelde score die onleesbaar bewijs compenseert met mooie sfeer. Noteer beperkingen per route en bron/licentie van echte assets.

## 10. Gelijke vergelijking en samplegate

Eerste bouwsample: **bestaande hal → woonkamer → mantelinspectie → bestaande notitie/halpaneel**. Woonkamer krijgt vorm-/materiaalverfijning; grafische wijzigingen alleen in de bijbehorende reviewflow. Geen nieuwe zone, verdieping, puzzel, item of hint. Buitenboard en bestaande BOSLUST-sample zijn alleen coherence-referentie in deze opdracht.

Maak twee versies: huidige normale assets en nieuwe sample; tevens huidige voorgestelde interior sample als vergelijking indien haalbaar zonder grote refactor. Leg basiscommit en flags exact vast. De normale game en de bestaande reviews blijven bereikbaar. Sampledata blijft tijdelijk en mag geen echte saves/settings wijzigen.

### Capturematrix

1. **Clay:** gelijke neutral mesh/material; geen kleur, textures, emissive, contactdecals, mist of lampdecorlicht. Alleen vorm. Hergebruik bestaande diagnostic conventions.
2. **Neutral light:** echte materialen en authored shading, witte sky/sun, geen mist, exposure 1; identiek voor beide uitvoeringen.
3. **Game:** identieke camera, tijd/dusk, lichtpreset, ACES/exposure 1.15, quality, DPR/resolutie, status lamp/haard en settled animation/LOD.
4. **UI:** gelijke clue/game-state; geen inhoudsverschil dat een betere layout lijkt.

Gebruik bestaande poses: 01 hearth-wide, 03 mantel-near, 17 doorway-from-hall, 18/19 chair front/rear, 27 table-near en 28 sofa-front. Voeg geen nieuwe camera toe die alleen de nieuwe assets mooier toont. Desktop en telefoonverhouding apart. Minimaal één capture lamp/haard uit; twee oblique hoeken bij bewijs.

Voor buitencoherentie: leg bestaande consolidation poses 13 fork, 15 doorway en 41 species-mix naast de kamer; geen nieuw before/after-effect claimen op basis van andere camera of nieuw licht.

### Budget en reële limieten

Gerapporteerd, niet hier opnieuw gemeten: interior max circa 228k triangles; meerdere doorzichten zitten boven 150 calls, oplopend tot 203. Exterior revision 2 meldt ≤142 calls/≤248.7k triangles op multi-draw; fallback 160–175 calls bij meerdere views. Dat is weinig marge. Software-rendering en geslaagde regression checks bewijzen geen echte telefoon-FPS.

De eerste verfijning is bij voorkeur kostenneutraal ten opzichte van de bestaande interior sample: geen extra light slots of shadowmaps, geen algemene nieuwe materiaaltypen, geen stijging in drukste view zonder beschreven trade-off. Guide blijft 150 calls/250k triangles; reeds bestaande overschrijdingen afzonderlijk rapporteren, niet wegmiddelen of verzwijgen.

Meet calls, triangles, geometry/texturebuffers, compressed payload, starttijd en frametimes. Beide vegetationpaden blijven relevant, zelfs als deze sample vooral binnen ligt en buiten door deuren zichtbaar is. Rapporteer median/p95/p99 waar beschikbaar en hitches bij draaien; vergelijk in dezelfde sessie, zelfde quality en apparaat. Een bestaand profileringsscript heeft voorkeur boven nieuwe testinfra.

### Menselijke acceptatie — kleine formatieve test, geen statistisch bewijs

- Nieuwe speler herkent woonkamerfunctie zonder naamlabel; bevraag concrete objectgroep, niet alleen 'gezellig?'.
- Kan vanaf normale nadering zien waar mantelbewijs zit, zonder een antwoordmarker.
- Kan elk vereist bewijsobject en relevant onderscheid in inspectie benoemen, zonder hue als enige hulp.
- Toets op echte telefoon in licht en donker frame, met gewone helderheid, landscape en de gekozen portraitfallback.
- De speler kan een nieuw artdetail niet redelijk aanzien voor een verplichte code die ontbreekt. Bespreek extra interactiebeloften.
- Code/antwoord en itemrelaties identiek; nieuwe art lekt geen extra volgorde. Test de eerste puzzel via echte interactie.
- Geen vreemd zweven, black foliage, flikkering, LOD-contourpop of highlight dat bij draaien verdwijnt als enige cue.
- Twee minuten bewegen/draaien op telefoon, met baselinevergelijking. Projectdoel: circa 30 FPS (framebudget 33.3 ms) of beter; stotteren apart rapporteren. Geen status 'phone-approved' zonder toestelgegevens en resultaat.

Besluitmogelijkheden: **behouden**, **één gerichte revisie**, **andere assetroute vergelijken**. Omar kiest na concrete beelden en echte sample; een technisch groene build is geen artgoedkeuring. Stop vóór estate-wide replacement, commit/push/publicatie alleen volgens afzonderlijke uitvoeringsautorisatie.

## 11. Afstemming en open besluiten

| Besluit | Status | Afhankelijkheid |
|---|---|---|
| B als voorkeursrichting | Proposed | Omar / integratie |
| Sample beperkt tot woonkamer + bestaande bewijsflow | Proposed | UX/puzzeldesign leveren actuele contracten |
| Canonieke symbolen behouden | Bestaande werkbasis | Puzzels; wijziging alleen gecoördineerd |
| Sans voor functionele UI/body, serif voor titels | Proposed | UX leesbaarheid en Android/iOS fonts |
| Hypothese-badge/function | Alleen grafisch voorstel | UX beslist of en hoe hypotheses bestaan |
| Kamerbordjes vervangen | Open | Expliciete vervanging bibliotheekbewijs |
| Meer/heuvelhuisje/zolder | Open | LEVEL_PLAN en getest blockout |
| Persoonlijke objecten | Open | Omar levert echte referentie; environment legt betekenis vast |
| ACES 1.15 | Voorlopige samplebaseline | Cross-scene review vóór globale change |
| Echte telefoonbudgetten | Onbevestigd | Apparaten/metingen ontbreken in sampledocs |

De afzonderlijke `ART_SAMPLE_IMPLEMENTATION_PROMPT.md` is een complete begrensde werkopdracht. Hij blijft bruikbaar na een nieuwe HEAD: uitvoerder stelt eerst verschillen vast en houdt bewezen gameplaycontracten leidend.
