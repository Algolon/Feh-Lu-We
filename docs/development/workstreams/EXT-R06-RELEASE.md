# EXT-R05/R06 — gezamenlijke publicatie

Geïntegreerd met productie `7df0e05`, inclusief recente vegetatie- en kleedupdates. PR #69 omvat #67 en richt rechtstreeks op productie.

Typecheck, build en 436 tests in 55 bestanden geslaagd. Functionele browsercontroles slagen: interacties, openingen, lampen, 304 steunhoogtes, entreelooproute, picking, native/packed rendering en kwaliteitswissels. Geen shader-/WebGL-/consolefouten.

## Renderbudget bij integratie

De huidige productie-inhoud verhoogt kosten tegenover de oorspronkelijke R06-review. De 1280×720 rondgang overschrijdt op enkele beelden 750.000 driehoeken, ook zonder R06 (tuin: 822.609; serre: 796.267 / 155 calls). R06 voegt 324–326 driehoeken per beeld toe. Budgetgrenzen zijn niet gewijzigd; de absolute budgetcontroles in integration/results.json zijn expliciet false.

De release beperkt zich tot de goedgekeurde exteriorafwerking. Optimalisatie van brede vegetatie-/interieurbeelden is een afzonderlijk vervolg; fysieke telefoon-FPS is nog niet gemeten.

[Integratiebewijs](ext-r06/integration/results.json). Na deployment volgt publieke buildverificatie en controle van de naamplaat-/verweringsmaterialen.
