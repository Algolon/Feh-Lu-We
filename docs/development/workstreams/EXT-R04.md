# EXT-R04 — entreebakken, gevelgroen en aansluitingsverfijning

16 oktober 2026. Implementatie en lokale reviewcontroles afgerond; niet live.
Branch `feat/exterior-greenery-r04`, gebouwd op R03 `438a503` (PR #56). De R04-PR richt zich op die branch; de dak-/steencorrectie blijft een aparte dependency.

## Resultaat

- Twee geprofileerde, bewerkte stenen bakken flankeren de entree op X86,7 / X93,3, Z78,15. Voet, terugliggende wand, rand en zichtbare aarde vormen één doorlopend profiel. Kleine verschillen in blad-/takgroei voorkomen identieke exemplaren. De fysieke bakranden hebben eigen collision; de looplijn en trappen blijven vrij.
- Zes vaste groeigroepen op westelijke zijgevel en noordelijke tuingevel. Tuinzijde heeft bredere groepen, de zijgevel smallere opgaande groei. De noordwesthoek krijgt aan beide kanten groen, terwijl de hoekstenen zichtbaar blijven.
- Houtige hoofdranken, onregelmatige zijtakken, bladstelen en gevouwen, gelobde bladeren. Groei begint in kleine plantvakken aan de muurvoet; ranken volgen de uitstekende plint en verdiepingband. Gehele bladcontouren houden afstand tot kozijnen, raamomlijstingen en buitendeuren. De voorgevel blijft formeel.
- De bestaande dakkapelwangen krijgen een afgeschuinde lijst met een terugliggende schaduwvoeg onder de dakrand. De dak-/zoldervorm en R03-dakpunten zijn behouden.
- Gerichtere verwering: minder brede toevallige kleurvlekken, afwatering onder een selectie vensters, een zachte aansluiting onder de hoofdkroonlijst en lokale verkleuring onderaan de entreebay. Geen algemene laag scheuren/vuil.

De bladvorm en rustige groene paletten zijn nieuw opgebouwd uit de eigenaarsreferenties, met de doorgaande VEG-R02-werksessie als stijlrichting. Geen bestanden of random streams van het parallelle vegetatiewerk zijn gewijzigd; de nog niet geïntegreerde VEG-reviewbranch is niet in productiecode gemerged.

## Visuele curatie en rendergedrag

De eerste render had te gelijkmatig uitwaaierende ranken. Deze zijn vervangen door onregelmatige zijtakken en afzonderlijke bladgroepen. De bladvouwen zijn verzacht en bladeren hangen van hun stelen. Dunne rechte bladstelen gebruiken minder segmenten.

Het toevoegen van groen aan de bestaande architectuurmesh veroorzaakte bij omschakelen van opaque batching 3.217 afwijkende pixels rond het entreebeeld, tegen nul in de controle. De nieuwe geometrie vergrootte de architectuurbounds en veranderde de tekenvolgorde. Groen en nieuwe bakken hebben nu eigen statische meshes/materialen binnen dezelfde `manor`-zichtbaarheidsregio. De entreevergelijking is weer nul pixels; ook aankomst en bakclose-up zijn pixelgelijk met batching aan/uit. Er is geen globale batchingregel of tolerantiedrempel aangepast.

Geen alpha-kaarten of nieuwe bitmapassets voor bladeren. Twee extra materiaalgroepen gebruiken bestaande materiaalconventies; de steen deelt zijn bestaande textuur. Toegevoegde geometrie kost circa 61.660 driehoeken in de gekoppelde buitenbeelden (de hele groenmesh blijft in veel buitenbeelden ingediend).

## Validatie eerste reviewversie (rev1)

- Typecheck, **394 tests** en productiebuild geslaagd; bestaande bundle-size advisory blijft.
- Nieuwe tests: deterministisch groeiplan, basale groei op beide gevels, vrije raam-/deurcontouren, begrensde bladgeometrie en planterposities buiten de trappen/looplijn.
- `scripts/ext-r04-validate.mjs`: elf gekoppelde landscapebeelden met groen uit/aan, portretbeeld, 27 bewegende cameramonsters, 304 steunhoogtes, gameplay-/openingregistraties, aanloop door de voordeur, picking en low/high/low quality. Alle tien verificatievelden slagen.
- Geen pagina-, console-, WebGL- of shaderfouten. Batching aan/uit houdt driehoekaantallen, picking en bronzichtbaarheid gelijk; maximale rasterafwijking blijft onder de bestaande 0,1%-grens. De kleine bestaande afwijkingen in tuin/hoek zijn in beide groenvarianten gelijk.
- Nieuwe collision betreft uitsluitend de twee fysieke bakken. Gameplayregistraties en bemonsterde steunhoogtes zijn gelijk aan de controle; de aanloop rond de centrale bak en door de voordeur slaagt.

| Beeld | Controle calls | Nieuw calls | Nieuwe driehoeken |
| --- | ---: | ---: | ---: |
| Entree | 90 | 92 | 375.276 |
| Bak dichtbij | 95 | 97 | 392.468 |
| Zijgevel | 80 | 82 | 362.754 |
| Tuingevel | 101 | 103 | 513.840 |
| Serre | 139 | 140 | 521.412 |

Alle elf vaste beelden passen binnen 150 calls / 750.000 camera-driehoeken. Bewegende monsters pieken op 133 calls / 531.096 driehoeken. Dit zijn software-rendercijfers, geen gemeten telefoon-FPS.

Bewijs: `ext-r04/qa/results.json`, `ext-r04/comparison.json`, screenshots `base-*` / `finish-*`. Beide varianten gebruiken de huidige R02-afwerking en batching; `greenery=base` schakelt nieuwe begroeiing/bakken en dakkapelwanglijsten uit. De nieuwe gevelwash wordt in beide varianten gebruikt. Voorbereiding/ontwerp: `EXT-R04-ANALYSIS.md`; vier originele eigenaarsreferenties: `docs/reference/exterior-greenery/`.

## Open reviewpunten

- Eigenaar beoordeelt bladvorm, dichtheid en het bakprofiel in beweging. De tuingevel is bewust plaatselijk begroeid; de rest blijft onderhouden steen.
- De gezamenlijke integratie met de lopende VEG-uitwerking en eventueel later performancewerk vraagt een nieuwe gecombineerde budgetcontrole.
- Fysieke Android-test voor FPS, geheugen, warmte en eventuele bladflikkering blijft open. Geen publicatie uitgevoerd.


## Revisie 2 — feedback op steenstructuur en bladgrootte

De eigenaar vond het bakprofiel geslaagd en vroeg om zichtbaarder lichte steenstructuur op bakken, kolommen en grond voor de voordeur, plus kleinere en vollere klimop.

- Bewerkte steen heeft nu rustige kalksteenwolking en fijne poriën. Op kolommen en ronde bakken zijn de UV's metrisch gemaakt: dezelfde korrelschaal over de echte hoogte, zonder uitrekking langs de lathe-profielpunten.
- Bordes, treden en de voorliggende afgeschuinde bestratingsplaten delen deze steenfamilie. De bestrating gebruikte daarvoor daadwerkelijk een egaal paint-materiaal; de bestaande voeg-/randgeometrie is behouden. Ook de concentische bestratingsringen gebruiken dezelfde textuurfamilie.
- Klimopbladeren hebben circa 44% kleinere lineaire afmetingen. Meer zijtakstations en meer kleine bladeren per groep geven dichtere massa's. De open plekken, zichtbare ranken en vrije raam-/deurcontouren blijven behouden. De beplanting in de entreebakken behoudt haar goed ontvangen schaal en vorm.
- Bestaande fysieke bakbegrenzingen, loophoogtes, deuren, gameplayregistraties en vegetatiewerk buiten deze module zijn behouden.

Actuele verificatie: typecheck, **395 tests**, productiebuild en alle tien browser-verificatievelden slagen. Elf gekoppelde beelden, portret, 27 bewegende cameramonsters, 304 steunhoogtes, aanloop door de voordeur, picking, batchinggelijkheid en quality-switches zijn opnieuw gecontroleerd. Rasterverschillen bij batching aan/uit zijn gelijk aan de gekoppelde controle en binnen de bestaande 0,1%-grens. Geen pagina-, console-, WebGL- of shaderfouten.

Maximale vaste meting: **140 calls / 661.284 driehoeken**. Bewegende monsters: **133 calls / 674.496 driehoeken**. Dit blijft binnen 150 / 750.000; de dichtere klimop verhoogt de geometriekosten wel duidelijk ten opzichte van rev1. De fysieke telefoontest blijft open, met aandacht voor geheugen en fijn blad op afstand. Geen shader- of samplerlaag toegevoegd; steen blijft één kleurtextuur per gedeeld materiaal.

Nieuwe bewijsset: `ext-r04/rev2/`. De eerste beelden en resultaten in `ext-r04/qa/` zijn bewaard. Dezelfde review-PR is bijgewerkt; nog niet live.

Voorgestelde volgende exteriorronde: resterende bouwkundige aansluitingen en lokale verwering beoordelen in een doorlopende rondgang om het huis; daarna het entree-ensemble van deur, lantaarns en beslag verfijnen, eventueel met een bescheiden huisnaamplaat. Deze ronde kan direct op de nu gecorrigeerde basis voortbouwen. Gezamenlijke integratie met het lopende VEG-werk blijft een afzonderlijke verificatiestap.
