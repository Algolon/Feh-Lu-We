# WINDOW-R01-R04 — vensterbank houtmateriaal (pilot)

**Reviewbranch:** `window-r01-r03-production-integration`, draft PR #70. Geen productie-merge of uitrol naar overige ramen.

## Owner intent (16 oktober 2026)
De bestaande kleine, lichte vensterbank oogde door herhalende plank-/tegelnaden onvoldoende als hout.
Reference: warme houten vensterbank met natuurlijke doorlopende nerf, donkerder dan de aangeleverde foto,
passend bij de gestileerde Europees-landhuisstijl.

## Implementatie
- De bestaande 40 mm hoge vensterbank, 9 cm binnenoverstek en kozijn-/raamgeometrie zijn niet veranderd.
- `src/world/textures.ts`: deterministische 512×512 `windowSillWood`-canvas met gekromde
  lengte-nerven, natuurlijke poriën/ringen, medium-donker warm eiken, zonder planknaden.
- `src/world/kit.ts`: eigen `M.windowSillWood` Lambert-materiaal, timber-world-surface, naam `WINDOW-R01-OakSill`.
- `src/world/manor.ts`: alleen pilotvensterbank gebruikt dit materiaal, tint `#ffffff`
  en UV-schaal 1.45 (voorkomt herhalende plank-/texturetegels op de 1,31 m brede plank).
- Geen realtime reflectie, gedownloade afbeeldingen of extra geometrie. Gewoon 1 gebatcht materiaal;
  mogelijk één extra draw call zolang dit de enige gebruiker van dit materiaal is.

## QA en bewijs
- Typecheck, unit-tests, release-build en WINDOW-R01 screenshotworkflow geslaagd.
- De test identificeert het materiaal in de echte 3D-scene en controleert kleur, nerfcontrast,
  nerfrichting en het `timber`-surfaceprofiel.
- Automatische low-quality close-ups:
  `docs/development/workstreams/window-r01/review/low-sill-front.jpg` en
  `docs/development/workstreams/window-r01/review/low-sill-oblique.jpg`.
- In software WebGL geen rendererrors; doorkijk/collision blijft geslaagd.
- Eén pilot, nog niet beoordeeld op fysieke Samsung GPU.

## Volgende beslissing: huisbrede ramen
Eerst owner-review op deze twee screenshots. Daarna een apart WINDOW-R02-prototype voor de
overige raamtypes met gedeelde geometrie, gevel-openingen en per-raam visibility, niet simpelweg
alle bestaande decoratieve ramen 'transparent=true' zetten. Ook binnen-afwerking,
zichtrichtingen, nachtbeelden, culling en mobiel-low-performance per geveltype valideren.
