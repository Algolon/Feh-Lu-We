# EXT-R06 — plaatselijke verwering en huisnaamplaat

Deze ronde volgt EXT-R05 (PR #67); de review-PR vergelijkt uitsluitend de nieuwe R06-wijzigingen met die branch. Nog niet live.

## Uitwerking

- Onregelmatige lage vocht-/mosaanslag aan de beschutte noord- en westplint, met onderbrekingen bij de tuindeuren.
- Enkele taps toelopende afwateringssporen vanaf vensterbankhoeken en kleine verkleuringen bij geselecteerde regenpijpbeugels.
- Plaatselijke vochtverkleuring op het gehouwen steen van lage kolomvoeten en beschutte plinten. Lichte warmere gebruikspolijsting op de centrale looplijn van de entreebordesvloer.
- Bescheiden donkergroene huisnaamplaat met lichte serifletters ‘Feh Lu We’, dunne rand, twee schroefdetails en kleine afstandhouders onder de rechterlantaarn. Geen verzonnen jaartal of wapenschild.

De verwering volgt wereldposities zodat UV-naden geen vuilgrenzen maken. De gevelwash blijft één texture; de nieuwe plaat gebruikt één 512×192 canvastexture en de eigen materiaal-/texturelevenscyclus van de wereld. Vergelijking: `?weather=base` versus `?weather=study`, beide met R05-details ingeschakeld.

De ronde vrijstaande Toscaanse kolommen zijn ongewijzigd. De vierkante onderdelen zijn de bestaande voet-/dekplaten en de muurpilasters erachter. Geen nieuwe botsingen, spelinteracties of verlichting. Groen en dakvormen zijn ongewijzigd.

## Controle

Typecheck, productiebuild en alle 412 tests (47 bestanden) geslaagd. Zeventien gepaarde browserbeelden omvatten een extra schuine entreeblik en naamplaatclose-up. De browsercontrole vergelijkt interactieregistraties, openingen, 304 steunhoogtes, lampregistraties, picking, zichtbaarheid, native/packed pixels en driehoeken; daarnaast de entreelooproute, 27 bewegende camerastanden, kwaliteitswissels en portretweergave.

Alle browsercontroles geslaagd, zonder WebGL- of shaderfouten. Statisch maximaal 141 draw calls / 664,336 driehoeken; bewegend 137 / 679,294. Binnen de bestaande limieten van 150 / 750.000.

Definitieve meetwaarden staan in [results.json](ext-r06/qa/results.json). Browsermetingen gebruiken software-WebGL en zijn geen fysieke telefoon-FPS-/geheugenmeting.

## Beelden

- [Schuine entree met ronde kolommen](ext-r06/qa/finish-entrance-oblique.jpg)
- [Huisnaamplaat](ext-r06/qa/finish-nameplate.jpg)
- [Tuinplint en regenpijp](ext-r06/qa/finish-drain-garden.jpg)
- [Tuingevel](ext-r06/qa/finish-garden-near.jpg)
- [Controlevariant zonder R06](ext-r06/qa/base-entrance-oblique.jpg)
