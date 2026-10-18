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
