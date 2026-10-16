# WINDOW-R02-R03 — mahoniehout & raamkrukjes

## Scope
Een kleine materiaal- en detailiteratie op de **44 reguliere gevelramen** in draft PR #72.
Geen wijzigingen aan speciale dakkapellen, dakramen, entree-oculus, losstaande gebouwen,
muurconstructie, portal-culling, ramen met afwijkende geometrie, of gameplay-interacties.

### Mahonie vensterbank
- Het ene gedeelde `windowSillWood`-materiaal in `src/world/textures.ts` is veranderd
  van gelig/donker eiken naar **rijk donker mahonieachtig roodbruin** (centrale sRGB-waarden
  ongeveer 107/51/39 vóór houtnerfvariaties; daadwerkelijke render is lichtafhankelijk).
- De bestaande generatieve houtnerven blijven in de lengte, met sterkere donkere aders;
  planknaden worden niet teruggebracht.
- De vensterbanken houden hun bestaande afmetingen, dunne doorsnede, 9 cm binnenoverstek,
  batched Lambert-materiaal en UV-oriëntatie op alle gevelassen.
- De vloer gebruikt nog steeds het andere `wood`-materiaal en wordt nergens gewijzigd.

### Visuele raamkruk / beslag
- Alle 44 standaardramen krijgen een kleine statische, verouderd-messing kleurige
  raamkruk aan de **rechterstijl van het enige bestaande raamkozijn**.
- Onderdeel van gedeelde `buildManorWindowLatch()` in `manorWindowAssembly.ts`:
  achterplaat, highlight/inleg, twee pinnen, korte pen, verticale hefboom,
  afronding/knop. Vorm en kleur zijn bewust klein/sober; geen glimmend chroom.
- Koppeling aan de werkelijke buitenwaarts geplaatste raamstijl:
  achterkant beslag snijdt 4 mm in het originele binnenvlak van de stijl, de greep steekt
  kort naar de **kamerzijde** uit, en staat niet midden in de diepe dagkant.
- Aan de buitenzijde behoudt het raam dezelfde vorm en hoogte. Beweging en picking worden
  alleen door de bestaande glass collider tegengehouden. **Het is geen nieuwe bedienbare
  interactie** of animatie. Nieuwe kleine onderdelen delen het al bestaande paint-materiaal
  en worden door de statische batcher samengevoegd.

## Verificatie
- Typecheck, unit-tests, release-build; regressiepositie van kruk bij alle 44 ramen,
  inclusief assen `x/z` en buitenrichtingen `±1`.
- Bestaande WINDOW-R02 visuele doorkijktest: 44 fysieke glazen barrières /
  44 vrijgegeven visuele stralen; 20 camera-posities.
- Nieuwe daadwerkelijke game-screenshot closeups voor mahoniehout en rechter kruk:
  `docs/development/workstreams/window-r02/review/mahogany-latch-north-ground.jpg`
  en `mahogany-latch-west-ground.jpg`.
- Canvas RGB/nerfcontrole doorlopend in browser, geen gegenereerde conceptillustratie.
- SW renderer is géén smartphone-FPS-bewijs. Inspecteer op je Samsung vóór definitieve
  uitrol/merge; bevestig dat de beslagen herkenbaar maar niet te dominant zijn.

## Gate
PR #72 blijft draft, afhankelijk van PR #70 en de huidige productie-integratie.
Geen merge of GitHub Pages-productiedeploy op deze branch.
