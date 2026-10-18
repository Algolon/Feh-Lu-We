# ENT-R02 — Open ontvangstzone + aaneengesloten biljartgalerij

Status: **geïsoleerde architectonische blockout; nog niet goedgekeurd, gemerged of gedeployed**.
Branch: `feature/ent-r02-open-entrance-billiard-gallery`.
Owner brief 18 oktober 2026: trek entreevolume naar voren, breek de vestibule open en maak van beide bovenste galerijdelen **één open speelruimte**. De biljarttafel moet daar uiteindelijk naartoe kunnen. Laat de huidige biljartkamer en voortgang voorlopig intact.

## Ontwerprecept, brondata
- Huidige front bay: X86.4–93.6, facade Z79.55, voorgevel main Z80.2, bovenverdieping Y3.35.
- Nieuwe front bay: X86.4–93.6, front Z77.15, diepte +2.4 m, blijvende verbinding naar vestibule/galerij op Z80.4.
- Nieuwe entree: brede opening naar de bestaande vestibule; oorspronkelijke vestibule/hal-wand Z84 krijgt een 7.6 m open doorgang onder de lintel. Bestaande grote halvide en hoofdtrap blijven.
- Nieuwe galerij: platte, beloopbare houtvloer op Y3.35, sluit naadloos op frontGallery aan. Geen andere verdieping of gesloten kamer. Room-IDs `frontGallery`/`vestibule` en `door.front` behouden; voor fysieke regio/culling komen `frontGalleryExt` en `entryExtension` erbij.
- Dak: fronton/oculus/klassieke portico doorgetrokken, met gable roof die de hoofdhip aansluit. Let op bestaande zuidelijke fascia/goten in de dakovergang.
- Gevelwindow: upper window wordt **echt vrijgemaakt** in de muur, met transparant glas en een echte exterior portal. Oculus kan decoratief blijven.
- Staging: entree-urns naar Z75.75; zwaluwen naar de oostelijke binnenwand; bestaande bank voorlopig achterin de galerie verplaatst. Geen nieuwe puzzels.

## Biljartstudie
Huidige getekende tafel: 3.5 × 1.9 m, `billiardTable()`. Met vrije keuruimte 1.4 m rondom = 6.3 × 4.7 m. Plan draait lange zijde over X, centrum (X90,Z80.4).
- Aan de buitenmuur binnen X86.6–93.4, dus 6.8 m binnenmaat: ruimteclaim X86.85–93.15.
- Beschikbare aaneengesloten galerijdiepte Z77.15–84 = 6.85 m: ruimteclaim Z78.05–82.75.
- Westelijke loopstrook X85–86.8 vrij houden; resterende marge naar de biljartspelerszone **slechts circa 5 cm**. Dat is functioneel kwetsbaar en moet met echte beweging worden bewezen.
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
