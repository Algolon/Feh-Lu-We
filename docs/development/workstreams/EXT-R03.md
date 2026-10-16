# EXT-R03 — steenconsistentie en gesloten dakpunten

16 oktober 2026. Correctie op productie `436e106`, branch `fix/exterior-stone-roof-r03`.
Implementatie voor review; deze iteratie is niet live gezet.

## Correctie en aanvullende audit

De screenshots van de eigenaar tonen achtergebleven geel/bruin steenmateriaal op de ronde bloembak en entree, en V-vormige inkepingen waar twee schuin geplaatste balken bij een dakpunt eindigen.

- Bloembak: het bestaande geprofileerde model gebruikt nu fijnkorrelige bewerkte kalksteen in de gevelpaletfamilie. Geen oude grote vlekken of kunstmatige metselvoegen over het doorlopende profiel.
- Entreehoekstenen: dezelfde afgeschuinde steenblokken en kleurvariatie als de overige gevelhoeken; de oude metseltextuur over afzonderlijke blokken vervalt.
- Aanvullend gevonden en behandeld: entreeplinten, kolommen en kolomvoeten, pilastervoeten, deurpostvoeten, treden, bordes, frontonbasis en de zes buitendeurdrempels van hoofdgebouw en dienstvleugel.
- Dakpunten: één gesloten geëxtrudeerd profiel met een echte verticale verstekaansluiting vervangt de twee los eindigende balken. Toegepast op het centrale fronton en via de gedeelde gevelkapbouwer op de dakkapellen en overige bestaande puntdaklijsten.
- De bestaande hoofdgevels, overige hoekstenen, banden, dienstvleugel, dakkapelwanden en schoorstenen waren al naar EXT-R01/02 overgezet. De audit heeft deze bestaande routes gecontroleerd; binnensteen en de afzonderlijke terrein-/bijgebouwmaterialen zijn geen achterblijvers van de landhuisgevel.

De dakvlakken, zolderruimte, ramen, deuren en alle collision-/loophoogtes blijven behouden. De buitenrand van een lijst eindigt nu bewust in één punt; er is geen extra los blok over de defecte aansluiting gezet.

## Verificatie

- Typecheck, 391 tests en productiebuild geslaagd. Twee nieuwe geometriecontroles raken met raycasts de buitenrand aan beide zijden van de dakpunt en controleren dat de opening eronder open blijft.
- `scripts/ext-r03-validate.mjs`: productiebuilds vóór/na, 16 vaste beelden inclusief fronton recht/schuin en dakkapellen aan S/E/N/W, portretbeeld, 27 bewegende cameramonsters, aanloop door de voordeur, gameplayregistraties, 304 steunhoogtes, picking en low/high/low quality.
- De gekoppelde `base`/`finish` varianten binnen iedere run schakelen de bestaande R02-afwerking en batching om. De R03-vergelijking is **tussen** de mappen `before` en `after`, niet tussen die variantnamen.
- Handmatige visuele controle van de actuele renderbeelden: gesloten fronton- en dakkapeltoppen, bijpassende entreehoekstenen/kolommen en bloembak.
- Alle gemeten nieuwe buitenbeelden en bewegende cameramonsters blijven binnen 150 draw calls / 750.000 driehoeken. Geen pagina-, console-, WebGL- of shaderfouten.
- Strikte rasterequivalentie van batching slaagt niet voor drie extra inspectiebeelden, ook vóór deze wijziging: fronton recht 2.554 pixels, fronton schuin 1.102, noorddakkapel 6.400 (drempel: >4 kleurwaarden). De verschillen zijn vóór/na exact gelijk. De oorspronkelijke acht R02-beelden blijven binnen de bestaande 0,1%-grens. De volledige uitgebreide validator eindigt daarom bewust met exitcode 1; de grens is niet verruimd. Dit is een bestaande batching-afwijking, geen volledig groene rasterclaim.
- Een fysieke telefoontest voor FPS, warmte en geheugen blijft open.

Bewijs: `ext-r03/before/`, `ext-r03/after/`, `ext-r03/comparison.json`.

## Teruggevonden vervolg uit de oorspronkelijke exteriorchat

Bron: **Gevel detaillering analyseren**, gekoppelde Codex-sessie `01a13e45-fdb3-7672-93ad-722edc6eb05a`. De beurt met “Wat is je advies voor vervolg?” is daadwerkelijk teruggelezen.

De geadviseerde volgorde was:

1. Bouwkundige aansluitingen: dak/schoorsteen/dakkapel, nokken, goten, regenpijpen en schoorsteenverhoudingen.
2. Materialen verfijnen: minder uniforme steen, gerichte verwering onder vensterbanken, bij afwatering en langs de plint; onderscheid tussen gevelvlak, bewerkte steen en metaal.
3. Renderkosten van tuin en serre terugbrengen.
4. Bewegend beoordelen, inclusief deuren, zolder en observatievenster, daarna telefoontest en release.

Dit werd EXT-R02 en is inmiddels geïntegreerd. Extra decoratie — genoemd werden extra plantenbakken of klimgroen — werd **pas daarna geadviseerd**, niet als al goedgekeurde uitgewerkte volgende opdracht vastgelegd. De huidige R03-correctie rondt eerst de zichtbare inconsistenties af.

Voor deze correctie zijn de screenshots, bestaande goedgekeurde gevelrichting en bewaarde stijl-/implementatieverslagen voldoende. `docs/art-refresh/STYLE_TARGET.md`, `docs/development/workstreams/EXT-R01.md` en `EXT-R02.md` zijn aanwezig; ook de conceptbeelden en eerdere renders zijn bewaard. Beschikbaarheid van alle oorspronkelijke losse chatbijlagen is niet bevestigd. Voor een nieuwe decoratie-/landschapsronde zijn specifieke nieuwe doelbeelden nuttig als de oorspronkelijke beelden daarin leidend moeten blijven.
