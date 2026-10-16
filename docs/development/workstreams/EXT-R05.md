# EXT-R05 — entree en aansluitdetails

Deze reviewronde bouwt voort op de gepubliceerde exterior-versie `be9a9e2`. Branch: `feat/exterior-details-r05`.

## Resultaat

- De voordeur heeft vier verdiepte velden, geprofileerde randen, rustige doorlopende houtnerf en bronzen beslag. Alle onderdelen bewegen mee met de bestaande deur.
- De twee entreelantaarns hebben een muurplaat, gebogen draagarm en ophangring. Lichtposities, intensiteiten en bereik blijven gelijk.
- Regenpijpbeugels sluiten aan op de werkelijke gevelafstand. Kleine roosters werken de afvoerpunten af.
- Plaatselijke verwering volgt beschutting en afwatering: rustiger aan de formele voorzijde, iets vochtiger aan noord- en westzijde.

De bestaande plantenbakken en klimop blijven behouden. Deze ronde bouwt geen dakgeometrie opnieuw. `?details=base` schakelt de nieuwe details uit voor vergelijking.

## Verificatie

- Typecheck en productiebuild geslaagd; 412 tests in 47 bestanden geslaagd.
- Vijftien gepaarde browserbeelden, met controle van batching, zichtbaarheid, picking en WebGL.
- Interactie- en openingsregistraties, lampregistraties en 304 steunhoogtes blijven gelijk. De looproute naar de entree blijft bereikbaar.
- Zes hoeken van de bewegende deur: nul afwijkende pixels tussen native en packed rendering, gelijke driehoekaantallen en picking.
- Vier routepunten rond serre en zwembad bereikbaar.
- Maximaal statisch 141 draw calls / 664.012 driehoeken; bewegend 135 draw calls / 678.968 driehoeken. Bestaande limieten van 150 / 750.000 blijven gelijk.
- Kwaliteitswissels low → high → low geslaagd, zonder shaderfouten. Geen browserfouten.

Bewijs: [browserresultaten](ext-r05/qa/results.json), [deurbeweging en route](ext-r05/qa/motion.json), [voordeur](ext-r05/qa/finish-door-closed.jpg), [entree](ext-r05/qa/finish-entrance.jpg), [afvoer voorzijde](ext-r05/qa/finish-drain-front.jpg), [afvoer tuinzijde](ext-r05/qa/finish-drain-garden.jpg).

De browsermetingen zijn software-WebGL-controles; fysieke telefoon-FPS en geheugen zijn nog niet gemeten. Deze ronde is klaar voor visuele review en is nog niet gepubliceerd.
