# WINDOW-R02-R04 — volledige verwijdering hendel, rustige mahoniehoutnerf

## Ontwerpbeslissing (16 oktober 2026)
Eigenaar heeft het messing raamhendeltje afgekeurd: volledig verwijderen.
Kleur van vensterbank is goedgekeurd: warme donkere mahonietoon behouden.
Houtnerf in R03 was te dicht en repetitief; materiaal moet visueel rustiger ogen,
zoals het subtiele hout van de live voordeur in `src/world/exteriorDetail.ts`.

## Technische uitvoering
- `src/world/manorWindowAssembly.ts`: volledig verwijderd:
  `manorLatchPose`, `buildManorWindowLatch`, hun montageplaat, schroeven,
  greep, knop, imports `rod`/`blob` en aanroep op alle 44 ramen.
  Alle raamdorpels, fysieke glazen panelen, culling en dagkanten blijven intact.
- `src/world/textures.ts`: exact dezelfde donkere basis mahonie (107/51/39),
  maar vervangen regelmatige sinusfrequenties/piekporiën + 75 donkere aders
  door zacht geïnterpoleerde *niet-periodieke* groeivariatie op verschillende
  schalen en achttien zeer zwakke, onderbroken fibres. Geen planknaden.
  Textuur blijft één gedeelde 512×512 CanvasTexture; overige houtmaterialen
  en de live voordeur worden niet aangepast.
- `src/world/manorWindowRollout.test.ts`: geen plaatsingstest voor afgekeurd
  beslag; regressie dat er geen handle/latch-assemblage wordt geëxporteerd.
- `scripts/window-r02-review.mjs`: verwijdert de oude messing-detailtest
  en legt nu echte close-up beelden van de donkere vensterbank vast op twee
  gevelassen. De canvas-gebaseerde kleur-/nerftest eist minder dan vier
  gemiddelde kleurstappen over de nerfrichting bij een zespixelafstand.

## Acceptatie (op geïsoleerde draft-branch, niet productie)
1. Typecheck, volledige unit-suite, build en Chromium/software-WebGL.
2. De standaard 44 doorzichtige raamopeningen, collision en room portals blijven
   correct; de 20 locatiebeelden op mobile-low blijven binnen PB01.
3. Beelden `window-r02/review/sill-north-ground.jpg` en
   `sill-west-ground.jpg` laten één donkere mahonievensterbank zien zonder
   hendeltje, met zacht voelbare maar nauwelijks streperige houtnerf.
4. De eerdere `mahogany-latch-*.jpg` en `latch-detail-*.jpg`
   horen niet bij deze kandidaat en worden uit het actieve reviewpakket verwijderd.
5. Geen merge/deploy zonder afzonderlijke integratie- en toestelcontrole.

Status: implementatiekandidaat WINDOW-R02-R04 op `window-r02-manor-glazing-rollout`,
draft PR #72, bovenop de eerdere pilot PR #70.
