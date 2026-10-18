# ENT-R02 — Open ontvangstzone + aaneengesloten biljartgalerij

Status: **geïsoleerde architectonische blockout; nog niet goedgekeurd, gemerged of gedeployed**.
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
