# Asset 01 — Handpan op standaard (FLW-S3-035)

## Scope
Vervang de placeholder-handpan (platte lathe-schijf met losse toonveld-schijfjes op drie staafjes) in de gravity-bong/handpanhoek (`MUSIC_BONG`, LEVEL_PLAN `musicBong` 79–85 / 118–123) door een gestileerd, gedetailleerd instrument op een walnoten standaard. Daarna (op verzoek van de eigenaar) bespeelbaar gemaakt: zie **Bespelen**. Geen puzzel-, progressie- of save-logica. Er bestond geen interactie op de handpan; er is niets verwijderd.

## Referenties
- **FLW-S3-035 Handpanstandaard** (`docs/reference/flw/MANIFEST.json`): status `AMBIGUOUS`, `canonical: false`, geen geselecteerde winnaar. Beide alternatieven zijn bekeken (archief, sha256 gecontroleerd tegen het manifest):
  - `59d452a7…` "Handgemaakte walnoten handpanstandaard" — vier gebogen poten, horizontale draagring, gepende naaf, viltpads op opgekrulde armen, ≈ 70 cm.
  - `6447801…` "Houten handpanstand: ontwerp en details" — X-vormige poten met vierkant penblok, gebogen draagarmen, zwarte viltpads, ≈ 70 cm.
- Omdat er geen selectie is, volgt het model **alleen de gedeelde kenmerken** (≈ 70 cm, geoliede walnoot, vier gespreide poten die in een gepende middennaaf samenkomen, een rail onder het instrument, donkere viltpads op opgekrulde armtoppen). Er is geen alternatief gekozen, geen nieuwe asset-ID gemaakt en de manifeststatus is niet gewijzigd.
- Handpan zelf: geen eigen FLW-referentie; vorm volgt het demonstratie-instrument op beide sheets (convexe toonvelden rond een verhoogde ding, uitstekende naadrand) binnen `ART_DIRECTION.md`. Kleur: grijs staal op verzoek van de eigenaar (de sheets tonen bruin-brons).
- Plaatsing: `ENVIRONMENT_STORY.md` §Gravity bong ("handpan op standaard ernaast"), `LEVEL_PLAN.md` `musicBong`, DEV-02 blockout.

## Model (`src/world/handpan.ts`)
- **Bovenschaal**: één geauthorde polaire mesh (84 × 32 ringen). Lenticulair profiel (Ø 53 cm, 11,2 cm bol), verhoogde ding met ingedrukte rand, acht elliptische toonvelden in zigzag-volgorde (grootste vooraan), elk met afgeplat veld, gehamerde ril, opgedrukte schouder en convexe dimple; fijne hamerstructuur. Kleur in vertexkleur (keepColor): middengrijs staal met vage koel-blauwe ontlaatvlekken, lichter afgespeelde dimples, donkere rillen.
- **Onderschaal**: gedraaid profiel met Gu-opening; ingekeerde kraag en donkere verzonken kap (niet doorzichtig). **Naadrand**: gerolde bies die beide schaalranden afdekt.
- **Standaard**: vier gesweepte poten (afgeronde vierkante doorsnede, uitlopende voet, smallere taille, verdikking bij de rail), per poot een kleine geseede onregelmatigheid; achtkantige gedraaide naaf met kap en vier pennen; draagrail onder het instrument; viltpads exact op het raakvlak van de onderschaal (het instrument rust zichtbaar op de pads).
- Materialen: uitsluitend gedeelde art-kit-materialen (`ceramic` metaalhighlight voor de schalen, `timber`, `upholstery` voor vilt). Gebatched in de bestaande garden-chunk: **0 extra draw calls**, geen nieuwe textures, shaders of transparantie.
- Constructie-audit (`Asm.begin/end`, DEV-04B): geen waarschuwingen (geen zwevende of losse delen, voeten op de ondergrond).

## Integratie (`src/world/grounds.ts`)
- Zelfde plek en richting als de placeholder: (83.4, 121.6), yaw 0.4, nu op het kleed (`GF + 0.012`) in plaats van 1 cm erin.
- Collider ongewijzigd in plaats en straal (cirkel 0,3 m; alle poten binnen die straal, getest); alleen de hoogte volgt het nieuwe instrument (bovenkant ≈ 1,01 m). Looproutes en de rest van de hoek zijn niet aangepast.

## Bespelen
- **Hoe**: richt op een toonveld of de ding en gebruik de actieknop (desktop: E/klik met pointer lock; label **"Bespelen: handpan"**), of tik direct op een toonveld (mobiel, of klik zonder pointer lock). Het geraakte punt bepaalt de noot; de ding in het midden, anders het dichtstbijzijnde toonveld (vergevingsgezind op een telefoon). Buiten het hart van een veld klinkt de slag iets zachter.
- **Stemming**: D Kurd. Ding D3 (146,83 Hz); toonvelden van groot naar klein in zigzag: A3, B♭3, C4, D4, E4, F4, G4, A4.
- **Klank** (`Audio.handpan`, `src/audio/audio.ts`): WebAudio-synthese zoals alle geluid in de game (geen audiobestanden). Grondtoon, octaaf en kwint daarboven (3×) met eigen uitklinktijden (grondtoon ≈ 3,4 s, ding langer), een licht ontstemde tweeling voor de zweving, een korte metalen ping en een zachte handtransient; lowpass per stem. Maximaal 10 gelijktijdige stemmen. Volgt de bestaande mute/master-gain.
- **Geluid uit**: één melding ("Het geluid staat uit. Zet het aan in de instellingen …"), maximaal eens per 8 s.
- **Techniek**: `Interactable.run` krijgt optioneel het geraakte wereldpunt (`run(at?)`); `game.ts` geeft het door bij reticle en tik (achterwaarts compatibel: bestaande `run()` negeren het). `GameApi.playNote(hz, vel)`. Raakdoel: een onzichtbare, lage-poly koepel in de vorm van de pan (het raakpunt ligt dus op het instrument, niet op een doos). Nieuwe interactie-ID `play.handpan`, opgenomen in het id-contract `scripts/dev04c-additions.json`. Niets wordt opgeslagen.

## Validatie
Zie `handpan-01/views.json` (telefoonviewport 915 × 412, quality low) en de screenshots in `handpan-01/`.

### Screenshots (echte in-game captures van de build)
- Close-up modellering/materiaal: `handpan-01/desktop/hp-close-side.jpg` (speler staand, 1,15 m), `handpan-01/desktop/hp-detail.jpg`
- Overzicht in de omgeving: `handpan-01/desktop/hp-room.jpg`, `handpan-01/desktop/x08-music-bong-balloon.jpg` (DEV-04D-auditpose)
- Telefoon (915 × 412): alle views in `handpan-01/`. Opnieuw maken: `npm run build && npm run preview`, dan `node scripts/handpan-review.mjs`.

### Prestaties (telefoonviewport, quality low, dezelfde poses vóór `6c57ced` / na)
| View | Draw calls | Driehoeken |
|---|---|---|
| hp-close | 84 → 84 | 258 075 → 268 371 (+3,99 %) |
| hp-close-side | 90 → 90 | 188 306 → 198 602 (+5,47 %) |
| hp-room | 110 → 110 | 378 305 → 388 601 (+2,72 %) |
| hp-overview | 92 → 92 | 294 585 → 304 881 (+3,50 %) |
| hp-approach | 94 → 94 | 292 735 → 303 031 (+3,52 %) |
| hp-from-terrace | 72 → 72 | 248 887 → 259 183 (+4,14 %) |
| x08 audit-pose | 93 → 93 | 296 192 → 306 488 (+3,48 %) |

Asset: 10 700 driehoeken (placeholder ≈ 400; netto +10,3k). Alle views ruim onder het voorlopige plafond van 750k, nul extra draw calls. Geen van de DEV-04A/C-budgetviews kijkt naar deze hoek.

Kanttekening: door chunk-batching tekent de garden-chunk het instrument mee (en werpt het schaduw in high) zodra de chunk in beeld is. In de desktop-high-check van `e2e.mjs` levert dat +6k tot +21k op in views ver weg. Die views falen al op de baseline (zie hieronder). "garden → manor + conservatory" slaagt met 433 047 van 450 000.

### Tests
- `npm run typecheck`: ok. `npx vitest run`: 28 bestanden, 301 tests geslaagd (baseline 294 + 7 nieuw in `tests/handpan.test.ts`: oriëntatie van de schaal, toonvelden zonder overlap, gesloten Gu, padcontact, voetafdruk binnen de collider, ≥ 6 mm vrije ruimte tussen poten/rail en instrument, driehoekbudget). `npm run test:budget`: 4/4. `npm run build`: ok.
- `e2e.mjs`: 96/103. De 7 fails (6× `render high (desktop, +shadows)` > 450k, 1× BOSLUST LOD-hysterese) falen identiek op de baseline-build `6c57ced` (zelfde views, zelfde aantal calls).
- `e2e-dev02.mjs`: 34/34 (inclusief tuinroutes en lus).
- `e2e-dev04b.mjs`: 8/9; constructie-audit schoon (148 stukken). `e2e-dev04d.mjs`: 17/18. In beide zit de enige fail in de canonical-id-check, die over `inspect.serreAircoBeetle` gaat. Die komt uit de eerdere serre-commit `0381e61`, staat los van deze asset en is niet aangepast.
- Console: alleen de bestaande waarschuwing `toNonIndexed(): already non-indexed` (80×, identiek aan de baseline). Geen nieuwe errors of warnings, geen audit-waarschuwingen.

## Beperkingen
- FLW-S3-035 blijft `AMBIGUOUS`. Kiest de eigenaar later één sheet, dan kunnen de verbindingsdetails (ring tegenover gebogen draagarmen, rond tegenover vierkant penblok) worden aangescherpt in `legPath`/`railGeometry`/`hubGeometry`.
- De close-ups zijn gerenderd met SwiftShader (software-GPU); er zijn geen fps- of apparaatmetingen gedaan.
- Geen LOD voor het instrument: op afstand blijft het 10,7k driehoeken kosten zolang de garden-chunk getekend wordt.
- Geen visuele reactie op een slag (geen trilling/gloed); alleen geluid. Bewust klein gehouden voor mobiele prestaties.
- Echte touch-latency is niet in CI te meten: SwiftShader heeft tot ~1,5 s per estate-frame, waardoor een echte CDP-tik als sleepbeweging telt. De tik-check stuurt daarom touch-pointer-events in één taak door hetzelfde inputpad.
- Geluid is niet op een echt toestel beluisterd; de klank is offline gerenderd en spectraal gecontroleerd (grondtoon, octaaf, kwint; piek 0,37 bij overlappende noten).
