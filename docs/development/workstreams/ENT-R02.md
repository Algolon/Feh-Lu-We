# ENT-R02 — Open ontvangstzone + aaneengesloten biljartgalerij

Status: **owner-approved LIVE ITERATION; architectuur gemerged naar de hoofdbranch op 18 oktober 2026. Afwerking, performance en biljartinrichting volgen.**
Branch: `feature/ent-r02-open-entrance-billiard-gallery`.
Owner brief 18 oktober 2026: trek entreevolume naar voren, breek de vestibule open en maak van beide bovenste galerijdelen **één open speelruimte**. De biljarttafel moet daar uiteindelijk naartoe kunnen. Laat de huidige biljartkamer en voortgang voorlopig intact.

## Ontwerprecept, brondata
- Huidige front bay: X86.4–93.6, facade Z79.55, voorgevel main Z80.2, bovenverdieping Y3.35.
- Nieuwe front bay: X86.4–93.6, front Z76.55, diepte +3.0 m, blijvende verbinding naar vestibule/galerij op Z80.4.
- Nieuwe entree: brede opening naar de bestaande vestibule; oorspronkelijke vestibule/hal-wand Z84 krijgt een 7.6 m open doorgang onder de lintel. Bestaande grote halvide en hoofdtrap blijven.
- Nieuwe galerij: platte, beloopbare houtvloer op Y3.35, sluit naadloos op frontGallery aan. Geen andere verdieping of gesloten kamer. Room-IDs `frontGallery`/`vestibule` en `door.front` behouden; voor fysieke regio/culling komen `frontGalleryExt` en `entryExtension` erbij.
- Dak: fronton/oculus/klassieke portico doorgetrokken, met gable roof die de hoofdhip aansluit. Let op bestaande zuidelijke fascia/goten in de dakovergang.
- Gevelwindow: upper window wordt **echt vrijgemaakt** in de muur, met transparant glas en een echte exterior portal. Oculus kan decoratief blijven.
- Staging: entree-urns naar Z75.75; zwaluwen naar de oostelijke binnenwand; bestaande bank voorlopig achterin de galerie verplaatst. Geen nieuwe puzzels.

## Biljartstudie
Huidige getekende tafel: 3.5 × 1.9 m, `billiardTable()`. Met vrije keuruimte 1.4 m rondom = 6.3 × 4.7 m. Na de eerste QA is de lange zijde **richting Z (entree–hal)** gedraaid en het front 0.6 m verder naar voren gebracht: tafelcentrum (X90.35,Z80.55), yaw 0.
- Nieuwe binnenmaat tussen zijwanden: circa 6.4 m. Play envelope X88.0–92.7 (4.7 m); 1.2 m scheiding tot de westelijke galerijloopstrook eindigend bij X86.8.
- Aaneengesloten galerij loopt Z76.55–84.0; de **echte voorkant van de binnenmuur ligt op Z77.02**. Play envelope Z77.4–83.7 (6.3 m), met circa 0.38 m marge tot de voorwand en 0.3 m tot de noordrand.
- Het gewijzigde vlak past wiskundig. De **spelerspositie/keu-interactie is nog niet fysiek getest**; dit blijft een stopcriterium vóór tafelverplaatsing.
- Biljarttafel, ballen, cues, scorebord en eventuele interacties zijn **niet verplaatst**. Duplicatie zou de bestaande biljartkamer/puzzels onbedoeld wijzigen.

## Impact per systeem
1. `manor.ts`, `entrance.ts`, `manorWindowLayout.ts`: façade, dragend zijvolume, plinten/banden in de doorgang verwijderen, portico, 2 vloeren, window, dak.
2. `roomdefs.ts`, `estate.ts`: deur/raamportals, kamerzone, zicht/culling en retained save IDs.
3. `exteriorWeather.ts`, `exteriorGreenery.ts`, `props3d.ts`: nameplate, laurel urns en zwaluwen.
4. `interiorGreenery.ts`: planten in de nieuwe kamers met collision fitting.

## Verplichte validatie vóór merge
- `npm run typecheck`, `npm test`, `npm run build` via de push-workflow.
- `scripts/ent-r02-review.mjs` in een echte software-WebGL-browser: frontaanzicht, hoekaanzicht, portico, binnenkomst, hal->entree, 2x galerij, galerij->hal, fysieke wandeling, bovenste vloer-support.
- Screenshot inspectie op overlap, dak-aansluiting, blinde gevel, balkon, steriele muren, z-fighting, verdwenen ramen en zwaluwen.
- Reticle/door interaction, saves, hoog/laag kwaliteit, dag/nacht, gezichtsveld van buiten en de transparante upper window controleren.
- Draw calls <= 150 en triangles <= 750k in representatieve poses; Android-telefoon FPS/thermals volgt na vrijgave van de blockout.

## Stopcriteria en keuzes
- Als de westelijke loopstrook tegelijk nodig blijkt voor de biljartkeuslag: verleng/breedte aanpassen of kies andere tafeloriëntatie. Niet heimelijk de tafel verkleinen.
- Als het nieuwe fronton/hoofdak een zichtbaar conflict vormt: dakconstructie herstellen vóór samenvoeging.
- Als voor het bovenraam nieuwe pop-in/lighting-gates ontstaan: zichtbaarheid en lichtcontroles oplossen zonder dynamisch licht aan spelerafstand te binden.
- Oud biljartvertrek pas herbestemmen na spelontwerpbesluit; behoud `door.billiard` en v0.2 puzzelrelaties.

## Fasebesluit
**A: blockout + structurele checks → B: zicht/collision/performance/visuele review → C: owner-goedgekeurde afgewerkte architectuur → D: afzonderlijke biljartverplaatsing + bestaande kamerherbestemming.**
Geen merge of productie-/familiedeploy vóór fase B slaagt en de eigenaar de presentatie beoordeelt.

## Eerste in-game validatie / baseline vergelijker (18 oktober 2026)

De eerste ENT-R02 blockout op run [39116264114](https://github.com/Algolon/Feh-Lu-We/actions/runs/39116264114) compileerde, renderde zonder console-/GL-/shaderfouten en doorliep fysiek de punten Z78.6, Z82.1 en Z86.2 vanaf het voorterrein. De vijf bovenste vloerpunten lagen alle op Y3.35. De eerste screenshots tonen een sterkere brede entree en speelvloer, maar onafgewerkte gevel-interieurs en te toetsen dakovergangen.

De high-quality 412x915 software-WebGL vergelijker gebruikte dezelfde cameraposes op ongewijzigde productie (commit `1f9563b31cb`) en ENT-R02. Sommige productieviews waren al duurder dan de voorlopige absolute bovengrenzen. **De grootste incrementele regressie betreft het bovenraam**:
| Pose | Baseline calls/tris | R02 calls/tris | Toename |
|---|---:|---:|---:|
| gallery-to-window | 136 / 1,075,680 | 232 / 1,553,830 | +96 calls / +478,150 triangles |
| gallery-wide | 142 / 1,152,566 | 248 / 1,646,138 | +106 calls / +493,572 triangles |
| hall-to-entry | 243 / 1,586,044 | 255 / 1,601,006 | +12 calls / +14,962 triangles |
| front-approach | 210 / 1,527,652 | 208 / 1,528,386 | −2 calls / +734 triangles |

**Geen merge of deploy.** Het nieuwe transparante bovenraam activeert buiten-rendering vanuit de galerij en laat nog te veel buitenwereld door het renderpad. Volgende taak: zichtkegelgebonden buitenwereld-/vegetatieculling gericht optimaliseren, zonder het raam weer dicht te zetten; high/low/mobile meten en de buitenaanzicht-assets/documentatie op een tweede QA reviewen. De +3.0m en geroteerde biljartreservering zijn een vervolgrevisie en krijgen een nieuwe browsermeting.

Publieke productie, familieversie en eerdere licht-reviewroutes blijven onaangeroerd.

## ENT-R02-R1 verificatie (aangepaste uitbouw, +3.0 m)

Vervolgrun: [39116977523](https://github.com/Algolon/Feh-Lu-We/actions/runs/39116977523), screenshots/JSON via CI-artifact. Deze herziening is gecontroleerd op acht echte high-quality 412×915-browserbeelden.

**Functionele checks**
- `typecheck`, de gerichte kamertests, bouw en JavaScript/WebGL-rendering slagen.
- Alle drie fysieke beneden-loopdoelen bereikt (Z78.6, 82.1, 86.2).
- Alle vijf vloerhoogtemetingen op de vergrote galerij = Y3.35.
- Het frame toont de verruimde ontvangsthal, de galerijvloer en het buitenraam. Afwerking van ruwe metselwerk-aansluitingen, dakvoet, plint en portico-plaatsing niet definitief geaccepteerd.
- De nieuwe tafeloriëntatie is als maatcontract getest, niet als daadwerkelijke keuslag/looptour rond de tafel.

**Performanceblokker blijft**
| Pose | Baseline calls/tris | R1 calls/tris | Delta |
|---|---:|---:|---:|
| gallery-to-window | 136 / 1,075,680 | 232 / 1,550,540 | +96 / +474,860 |
| gallery-wide | 142 / 1,152,566 | 248 / 1,635,240 | +106 / +482,674 |
| hall-to-entry | 243 / 1,587,118 | 255 / 1,600,844 | +12 / +13,726 |
| front-approach | 209 / 1,526,008 | 207 / 1,526,742 | −2 / +734 |

Deze vergelijking gebruikt software-WebGL *high* op identieke locaties. Absolute bovengrenzen worden in de bestaande productiebaseline soms al overschreden; de **extra galerijkosten** zijn echter specifiek een ENT-R02 regressie. Nog niet geoptimaliseerd.

**Eindstatus R1:** DRAFT / BLOCKED. Niet mergen, niet deployen. Architecturale blockout is echt gerealiseerd en de basale navigatie bewezen; performance-optimalisatie, visuele afwerking, bovenverdiepinglooptest inclusief keu, en high/low mobiele continuïteit volgen. 

## R02-P2 voortgang — directe screenshots en terminale raamzichtlijnen

**Direct bekijkbare in-game screenshots:** [bekijk alle screenshots](images/), op de featurebranch gepubliceerd uit de echte mobiele software-WebGL run. De afbeeldingen zijn geen ontwerp-renders; ze tonen de feitelijke onafgewerkte blockout.

De P1-experimentfix (kort maaiveldgroen op buitenraam-kegels filteren) leverde op de kritieke galerijcamera's geen meetbaar rendement op en is **volledig teruggedraaid**. Geen onnodige wijziging in `boslustSample.ts` / `vegetationLod.ts` behouden.

Met `scripts/ent-r02-profiler.mjs` is per groep werkelijk in WebGL gemeten. In `gallery-wide` zijn o.a. `manor` ca. 593k tris, `mWing` ca. 122k, `forest` ca. 114k en `grounds` ca. 109k; deze maskermetingen zijn een *kostensplitsing* en geen geaccepteerd alternatief (we mogen die geometrie niet zomaar verbergen). De actieve set van zichtbare kamers bevatte via één transparant raam o.a. `out`, `cons`, `dining`, `kitchen` en `billiard`.

P2 heeft een functionele fout verholpen: voor een speler **binnen** wordt een werkelijke transparante raamportal alleen gebruikt om `out` toe te voegen aan de gewone arch/deur-zichtverzameling; `out` is geen doorlooproute naar andere kamers. In `src/interactions/world.ts` wordt de reguliere 3-staps deur/arch-visibiliteit berekend zonder window transit, gevolgd door `visibleRooms.add('out')` wanneer echt vrij glas in beeld en LOS-vrij is. `tests/ent-r02-portal-terminal.test.ts` controleert dit, samen met de bestaande WINDOW-R02-reeks.

**Gemeten impact P2** in identieke software-WebGL high-quality views, run [39124079348](https://github.com/Algolon/Feh-Lu-We/actions/runs/39124079348):
| Standpunt | R1 (calls / tris) | P2 (calls / tris) | Delta |
|---|---:|---:|---:|
| Gallery-to-window | 232 / 1,550,540 | 225 / 1,541,004 | −7 calls / −9,536 tris |
| Gallery-wide | 248 / 1,635,240 | 241 / 1,625,704 | −7 calls / −9,536 tris |

**P2 verbetert de logica, maar voldoet nog niet aan het performancebudget.** Nog **geen merge of deploy**. Volgende performanceproef moet expliciet de batch- en scene-culling van werkelijk zichtbare buitenwereld en zijvleugel onderzoeken, met beeld/pixelbewijs dat de ramen nog correct functioneren. Daarna architectonische afwerking en echte bovenverdiepingslooprondgang incl. biljarttafel en keu.

## ENT-R02-R3 — Afgesloten entree + dichte gevel naast voordeur (owner review 18 oktober 2026)

Owner correction: entree en voormalige vestibule vormen **één vergrote ontvangstzone**, maar de grote hal moet daarvan **door een volledige scheidingswand gescheiden** blijven. De galerij boven blijft één doorlopende biljartgeschikte ruimte. Aan weerszijden van de voordeur mogen geen buitengevelgaten zitten.

**Implementatie**:
- `manor.ts`: de gevelopbouw met links/rechts losse stenen vlakken die pas op Y0.5 begonnen is vervangen door **één doorlopende voorgevel** vanaf Y0.0 tot `TOP`, met precies één deurdoorgang (1.7×2.62 m, gelijk aan `door.front`) en één werkelijk transparante raamuitsparing op de verdieping. Beide zijretouren sluiten aan op de volledige muurdikte. Plint, portico en bovenraam blijven behouden.
- `manor.ts`: de 7.6 m brede open hal-/vestibuleboog op Z84 is weer een **volledige binnenwand** met doorgang 1.5×2.35 m en een normaal werkende, aan beide zijden te bedienen binnendeur `door.entranceHall`, standaard dicht maar zonder puzzelslot.
- `roomdefs.ts`: `vestibule ↔ hall` is nu een deurportal, en verbreekt in gesloten toestand de directe licht-/zichtdoorloop. `entryExtension ↔ vestibule` blijft een open archportal. `frontGalleryExt ↔ frontGallery` blijft ongehinderd.
- Tests: `tests/ent-r02.test.ts` controleert de nieuwe wand/portal, de standaard gesloten zichtrelatie en een open route.

**Werkelijke high-quality browserreview** [run 39126650154](https://github.com/Algolon/Feh-Lu-We/actions/runs/39126650154):
- Binnenaanzicht van de **gesloten haldeur**, buitenaanzicht en beide zijstijlen zijn vastgelegd en [direct bekijkbaar](images/).
- **9/9 collider- en raytests geslaagd**: beide zijvlakken naast de voordeur zijn vanaf 35 cm boven maaiveld dicht; ook op 1.45 m hoogte dicht; front door kan wél open; gesloten haldeur blokkeert, open haldeur laat door; beide flankerende binnenmuren zijn dicht.
- De looproute voor de deur in open toestand bereikt alle drie bestemmingen; vijf vloerhoogtepunten van de bovengalerij zijn Y3.35; geen nieuwe WebGL-/shaderfouten.
- De gesloten deur cullt de grote hal vanaf de vestibule: vanuit `foyer-to-hall-closed` zijn 144 draw calls gemeten. De **oude, nog niet opgeloste galerij-performanceblokker** blijft bestaan (gallery-window 225 calls/~1.54M tris, gallery-wide 241 calls/~1.63M tris). Daarom heeft de ENT-R02-reviewworkflow nog een rode budgetgate; deze run is **niet mislukt wegens de nieuwe scheidingswand of gevelgaten**, maar wegens het bekende absolute budget.

**Releasebesluit: nog niet mergen of deployen.** Owner corrections R3 zijn functioneel en visueel bewezen; architecturale afwerking, opening-width/frame-overlap controle, high/low mobiel performance en bovenverdieping-biljart loop/keutests blijven vóór vrijgave vereist.

## Productiebesluit — eigenaar accepteert live iteratie (18 oktober 2026)

De eigenaar heeft de geïsoleerde `/ent-r02/`-preview zelf op een telefoon getest en bevestigd dat de **ruimtelijke verbouwing nu live mag**, ook al moet inrichting/afwerking via live iteraties nog gebeuren. Nieuwe entree met dichte gevelzijden; afgesloten vestibule plus afsluitbare binnendeur naar hal; één lange, doorlopende bovengalerij. De **biljarttafel en bijbehorende interacties verhuizen nog niet**: eerst de nieuwe galerij inrichten, vrije keuslag/proximity en puzzelrelaties afzonderlijk testen.

**Bewust geaccepteerde afwijkingen voor deze specifieke release:**
- Galerij-window en gallery-wide blijven op ~225–241 draw calls en 1,54–1,63 miljoen triangles in high-quality software-WebGL (boven voorlopige 150 / 750k guidance; zelfs eerdere productiestandpunten overschrijden soms de absolute budgetten).
- Buitenwereld-culling/batching vanaf de galerij, dak-/metselwerkdetails, afwerkingsniveau en nauwkeurige biljart-clearance zijn backlog. Niet presenteren als afgerond.
- De gebruiker rapporteert zelf dat de proefversie op zijn toestel prettig werkt; dit vervangt geen formele prestatietest op alle telefoons.

**Release-checks**: feature laatste codecommit `646d0f65433f8c40cfa8cf01a5cb86ecfc33ac65` heeft volledige unit tests/typecheck/Pages-build groen in run [39127784070](https://github.com/Algolon/Feh-Lu-We/actions/runs/39127784070). De gescheiden browserreview met gesloten entree, dicht front en doorloop/vloer heeft de geometrische checks gehaald, maar de absolute performance-budgetgate blijft bewust rood. Vóór publiek als reguliere game zetten controleren of de huidige default branch conflictvrij integreert en alle Pages checks slagen.

**Nieuw besluit:** eigenaarautoriseerde **LIVE ITERATION** (niet langer `DO NOT MERGE` voor de *bestaande architectuur*). Prioriteit na de merge: visuele afwerking en optimalisatie, daarna biljartopstelling en herbestemming oude kamer.

## ENT-R02-R4 — Live polish: corners, ceilings, outside paving and urns (18 October 2026)

**Owner intent:** retain the existing hand-dressed exterior flagstone material and visual composition, but relocate the section left under the expanded house. The blue circle marks the NEW RIGHT PLANTER POSITION, not a stone to remove. Make the remaining paving match the larger front entrance.

**Implemented:**
- `arrivalStudy.ts`: previous apron X86–94/Z75.15–78.16 was partly under the new front wall (Z76.55). Re-laid as a central path X85.9–94.1/Z73.14–75.14, two lateral shoulder areas up to Z76.44. Old stone material, irregular/bevelled shapes and planter ring preserved; the staircase clear.
- `exteriorGreenery.ts`: outdoor planter coordinates mirror the blue-circled spot (X93.3,Z75.75) and left (X86.7,Z75.75), both moved 0.60m nearer the house. Each 0.39m-radius pot fits fully on its stone wing.
- `manor.ts`: side walls meet the old facade's inner finish; continuous single upper oak slab across the front and old gallery, and continuous upper plaster ceiling. Local plaster-covered return piers hide the former exterior stone cuts at ground and upper levels; keep all corridor space and furniture use unchanged.
- `arch.ts`: all ordinary doors still get frames, but floor-to-ceiling unframed architectural cut-throughs now receive correctly finished plaster endcaps and a split cornice, **never a floating decorative trim across the opening**. This removed the pale line through the entrance timber ceiling without removing normal internal trim.

**Validation:** [ENT-R02-R4 review CI](https://github.com/Algolon/Feh-Lu-We/actions/runs/39134712313) **passed**: full npm test, typecheck, build, 9 real in-game mobile-portrait camera views, no WebGL/console errors, closed front facade at both side jambs and upper-gallery support at old/new locations. Final visual inspection of rendered screenshot thumbnails confirms no visible external masonry or black gap in the tested new interior corners and no pale strip across entrance ceiling. [Actual in-game screenshots](ent-r02/r4-images/), available directly as GitHub image files; not synthetic renders.

**Accepted non-goals:** do not reintroduce old paving under the house, remove the circular planter courses, alter doors or save state, move the billiard table, or solve the already owner-waived 150-draw/750k-triangle render limits in this small polish package.

**Release plan:** owner requested implementation in chat and earlier authorized incremental live refinements. Merge after PR review and deploy to both full and family routes; verify GitHub Pages green. No gaming/puzzle migration.
