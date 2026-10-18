# BIL-R01 — bestaande biljarttafel naar de vide

**Scope:** alleen de bestaande biljarttafel, drie gekleurde ballen, één witte bal en de losse keu gaan van de oude biljartkamer naar de doorlopende bovengalerij. Geen aanpassingen aan puzzel, meubels of kamerindeling.

**Geometrie:** gecentraliseerde plaatsing uit `BILLIARD_GALLERY_R02` (X90.35, Z80.55, Y=UF3.35), tafel 1.9 × 3.5 m met de lange zijde in de Z-richting. Een 1.4m keu-clearance past binnen de oude/nieuwe galerij (X87.99–92.70, Z77.40–83.70), met de westelijke galerijdoorloop vrij. De echte tafelkollider is op de bovenverdieping gezet; de oude vloerkollider is verwijderd.

**Correcte rendergroep:** de tafel en bijbehorende speelstukken worden gebouwd in `mHall` in plaats van `mBil`. Dat voorkomt dat ze boven verdwijnen wanneer de oude kamer uit beeld wordt geculled.

**Bewust achtergebleven beneden:** wandkeuenhouder, optioneel puzzelpaneel, voorbeelden, lamp, stoel en eventuele verhaalnotities. Puzzel- en save-IDs blijven intact. Verhuizing van de complete biljartopstelling is een afzonderlijke volgende iteratie.

## QA
[Mobiele high-quality WebGL- en regressierun](https://github.com/Algolon/Feh-Lu-We/actions/runs/39160519407) geslaagd (typecheck, volledige tests, build, zes mobiele camera-aanzichten).

- Exact één solide tafelkollider boven, geen tafelkollider meer op de oude plek; de tafel blokkeert beweging.
- Vier loopposities rondom de tafel zijn op hoogte 3.35m en niet geblokkeerd.
- `billiard.panel`, `inspect.billiardExamples`, `lamp.billiard`, `door.front` en `door.entranceHall` behouden.
- Geen console- of WebGL-fouten in de beeldcontrole.
- Galerij renderkosten blijven boven de oude voorlopige guidance, die eerder voor live-iteratie is geaccepteerd; BIL-R01 claimt geen performanceoptimalisatie.

[Bekijk de echte gamebeelden](bil-r01/screenshots/) van vóór de tafel, zijkant, vanaf de hal en de lege oude kamer. Na eigenaarstest kunnen de wandkeuen, lampen en het optionele paneel als tweede pakket volgen.

## Release
De ruimtelijke eerste stap is samengevoegd via [PR #136](https://github.com/Algolon/Feh-Lu-We/pull/136) (commit `199a13da`). De normale productie-releaseworkflow valideert de hoofdgame en familieversie; een merge geldt niet als live totdat de Pages-deployment is geslaagd.
