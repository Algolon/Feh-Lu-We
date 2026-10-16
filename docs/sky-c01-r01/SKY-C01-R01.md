# SKY-C01-R01 — geometrische artefacten in de lucht: diagnose en herstel

**Status:** fix geïmplementeerd en gevalideerd op featurebranch `sky-c01-r01-artifact-fix` (basis: productie `436e106`, default branch `ccr-75ef4113-kfkimm`). **Niet gemerged, niet gedeployed.** Live productie = `436e106` (Pages-run 463, default branch). Open PR's #49, #31 en #9 raken geen sky/cloud-bestanden; andere branches zijn niet aangeraakt. De Pages-workflow bouwt/test elke push, maar deployt alleen de default branch; op deze branch draaide alleen CI (groen).

## 1. Defect

Na SKY-C01 (procedurele variant A) toonden Android en (sterker) desktop dunne, gedeeltelijk onderbroken diagonale lijnen en driehoekige patronen in de lucht, rond én buiten de wolken.

## 2. Oorzaak (bevestigd)

`candidateGroup()` heeft twee niet-uniforme vroege `return`s (richtings-cull `facing < 0.55` en de lokale rechthoek `|p.x|>1.13 || p.y<-0.63 || p.y>0.78`). Daarna riep `candidateShape()` **`fwidth(distance)`** aan. Schermafgeleiden worden per 2×2-fragmentquad berekend; in quads die een cull-grens overspannen hebben sommige fragmenten de branch overgeslagen. Volgens GLSL ES 3.00 zijn afgeleiden in niet-uniforme control flow **ongedefinieerd**. Op echte GPU's levert de buur die de code niet uitvoerde een oude/willekeurige registerwaarde → `aa` wordt groot → `smoothstep(-aa, aa, distance)` geeft een halfdoorzichtige wolkenkleur op precies die quads.

Waarom dit exact het gerapporteerde beeld geeft:

- De cull-grenzen zijn rechte lijnen in het raakvlak (gnomonische projectie) → in perspectief **rechte, diagonale lijnen**.
- Alleen quads die de grens precies overspannen zijn getroffen → **1–2 px brede, onderbroken** lijnen.
- Acht overlappende cull-rechthoeken snijden elkaar → **driehoekige patronen**.
- De rechthoeken liggen 0,13–0,5 eenheden buiten het silhouet → lijnen **rond en buiten de wolken**, ook in open lucht.
- Gedrag verschilt per GPU/driver (ongedefinieerd) → **desktop vs Android verschilt**.

Variant B (review-only maskers) had dezelfde klasse fout: `texture2D()` met impliciete mip-LOD in dezelfde branch.

**Bewijs**

| Bewijs | Resultaat |
|---|---|
| UB-kaart (quads met verschillende cull-beslissing) | Valt exact samen met de beschreven lijngeometrie; staat los van de dome-triangulatie ([ubmap-vs-dome](ubmap-vs-dome.jpg), [mechanisme](mechanism-sky.jpg)) |
| Emulatie: buurfragment levert een nul-register aan `fwidth` | Reproduceert dunne, onderbroken diagonale lijnen buiten de wolken (sky: 487 px, max Δ 18/255; alleen langs cull-grenzen) |
| Native render in SwiftShader | **Reproduceert níet**: SwiftShader rekent alle vier lanes uit, dus pre-fix A is daar bit-identiek aan een branch-vrije referentie |
| Statische guard op de pre-fix productieshader | Markeert `candidateShape` in A én B |

**Beperking:** het defect zelf is niet op een fysieke GPU gereproduceerd (geen Android/desktop-GPU in deze omgeving; software-rasterizers zijn per constructie "well-defined"). De oorzaak is vastgesteld via specificatie, exacte geometrische overeenkomst met de melding en emulatie, niet via een apparaatcapture. **Bevestiging op het eigen apparaat van de eigenaar is de resterende acceptatiestap.**

## 3. Onderzochte hypothesen

| Hypothese | Test | Uitkomst |
|---|---|---|
| A. `fwidth`/`smoothstep` in niet-uniforme branches, vroege `return`s | UB-kaart, lane-emulatie, statische analyse | **Bevestigd — oorzaak** |
| A. `sqrt`-envelop / niet-differentieerbare `min` | AA-kaart (`fwidth`-magnitude) | Continu; geeft zachtere puntjes, geen lijnen. Weerlegd als oorzaak |
| A. Deling door `facing` | `facing ≥ 0.55` binnen de branch | Stabiel. Weerlegd |
| B. Lage dome-dichtheid 24×12 / `vDir`-interpolatie | 24×12 vs 48×24 vs 64×32; wireframe-overlay | Δ ≤ 3/255 (1 pixel 8/255), alleen afrondingsruis op wolkranden, geen driehoekstructuur. Weerlegd. Camera staat elk frame in het dome-centrum, dus `normalize(vDir)` is exact |
| B. Per-fragment camerastraal i.p.v. `vDir` | `normalize(vWorld - cameraPosition)` | Δ ≤ 1/255. Geen wijziging nodig |
| B. Pool (recht omhoog) | camera exact verticaal, 3 yaws | Geen artefact; pre/post identiek |
| C. Acht profielen / bijdragen buiten silhouet | numeriek: afstand op alle cull-grenzen ≤ −0,118; overlap-scan 600k richtingen | Geen bijdrage buiten masker; geen twee wolken overlappen |
| D. Tone mapping / color space | `?clouds=0` en "geen vorm" | Achtergrond identiek, geen lijnen. Weerlegd |
| D. MSAA, DPR, Low/High, precisie | Low (geen MSAA, DPR≤1) en High (MSAA, DPR≤1,5); highp | Beïnvloeden alleen de zichtbaarheid (lijnbreedte = één quad), niet de oorzaak |
| ENV-L01-wolken (historisch) | broncode | `cloudGroup` heeft geen branches → afgeleiden waren daar wel gedefinieerd; verklaart waarom het defect pas met SKY-C01 verscheen |

## 4. Oplossing

`src/world/cloudPrototypes.ts` (enige runtimebestand dat wijzigt):

1. `candidateShape()` geeft een **signed distance** terug, geclampt op `CLOUD_OUTSIDE = -0.1`; gecullde fragmenten geven dezelfde constante. Elke cull-grens ligt op ≤ −0,118, dus het signaal is continu over de grens en de afgeleide daar is exact 0.
2. `cloudShape()` neemt per wolk het maximum (union) en anti-aliast **één keer** via `candidateCoverage()` — `fwidth` nu in uniforme control flow (na herconvergentie).
3. B gebruikt `textureGrad()` met kettingregel-gradiënten uit `dFdx/dFdy(d)`, genomen in uniforme flow.
4. Culling blijft volledig behouden (geen extra vorm-evaluaties).

Ongewijzigd: acht vormen, posities, schaal, silhouetten, vier lichtfasen/paletten, zon, horizon, tone mapping, dome-geometrie (24×12), draw calls, gameplay, UI, saves, vegetatie.

## 5. Voor/na onder identieke omstandigheden

Elke rij rendert hetzelfde frame tweemaal in één sessie: huidige shader vs pre-fix productieshader (`436e106`) in het live materiaal.

Matrix: desktop 1600×900 (DPR 1), portrait 412×915 en landscape 915×412 (device-DPR 2,625; Low cap 1 zonder MSAA, High cap 1,5 met MSAA) → 6 sessies × (7 views × 4 lichtfasen + 12 headings over 360° + 3× camera exact verticaal) = **258 gematchte frames**. Views: open lucht, brede lucht, noord, bijna-zenit (1,35 rad), wolken op schermrand, zonsrichting met horizon, aankomst met manor.

| Check | Resultaat |
|---|---|
| A na vs A voor, sky-only (230 frames) | **Pixel-identiek** (max Δ 0) |
| A na vs A voor, volledige scène (28 frames) | Δ ≤ 1/255 alleen in manor-ramen, gelijk aan de ruis van een tweede render met dezelfde shader → lucht identiek |
| `?clouds=0` voor/na | Identiek |
| B (review) `textureGrad` vs `texture2D` (30 frames) | max Δ 1/255 |
| Draw calls / triangles | Sky 1 / 528 voor en na; scène-tellingen identiek in elk frame |
| Shadercompilatie, GL- en pagina-fouten | 0 |

Visueel geïnspecteerd: [mechanisme sky](mechanism-sky.jpg) en [wide](mechanism-wide.jpg) (UB-kaart, emulatie voor, fix na; 3× zoom, contrast ×3), [native voor/na + diff](before-after-native.jpg), [4 fasen desktop](phases-desktop-high.jpg) en [portrait](phases-portrait-high.jpg), [360° + pool, Low/High, portrait/landscape](turns-pole.jpg), [dome-dichtheid/camerastraal](dome-ray-diffs.jpg), [B](masks-b.jpg). Geen lijnen, driehoeken, naden of fragmenten buiten de contouren; wolkenstijl, fasen, zon en horizon ongewijzigd. Ruwe resultaten: [r01-qa.json](r01-qa.json), [diag-desktop.json](diag-desktop.json), [diag-mobile.json](diag-mobile.json).

Kanttekening: omdat SwiftShader pre-fix A al "correct" rendert, kunnen de native voor/na-beelden het defect niet tonen. Het voor-beeld van het defect is de gelabelde **emulatie**.

### Performance

Statisch: geen extra draw calls, triangles, passes of textures; dome blijft 24×12. Per luchtfragment komt er één `fwidth` + `smoothstep` + `max` bij (eerder alleen binnen actieve wolken). Vormevaluaties en culling zijn ongewijzigd.

Software-rendertijd (SwiftShader, GPU-gesynchroniseerd, mediaan van 3 rondes × 9 renders, view "wide", **geen fysieke GPU-tijd**):

| Sessie | Sky-only voor → na (ms) | Scène voor → na (ms) |
|---|---|---|
| desktop Low | 299 → 291 | 1470 → 1508 |
| desktop High | 302 → 292 | 2612 → 2603 |
| portrait Low | 79 → 80 | 452 → 411 |
| portrait High | 208 → 189 | 1396 → 1252 |
| landscape Low | 91 → 79 | 611 → 596 |
| landscape High | 188 → 202 | 2095 → 1993 |

Verschillen van −13 % tot +8 % in beide richtingen zijn meetruis van de gedeelde host; geen systematische regressie. PB01-budgetchecks: 4/4. Samsung/Android-GPU-tijd, FPS en thermiek zijn **niet** gemeten.

### Testresultaten

- Typecheck en build: OK. Unit: **395/395** (42 bestanden, incl. 6 nieuwe R01-tests). `npm run test:budget`: 4/4. CI op de branch (Pages-workflow, build-only): groen.
- R01-browsermatrix: 4/4 checks, 258/258 frames.
- Bestaande SKY-C01-browser-QA en walkthrough/save-suites: bestaande `scripts/sky-c01-qa.mjs` **18/18** (o.a. normale A = review-A framebuffer, clouds-off-pariteit, deterministische reload, B laadt en rendert, save-isolatie); `E2E_ONLY=walkthrough,saveChecks` **12/12** (tutorial → finale, 70 stappen / 31 clues; save/migratie/restore; geen console-errors/404's). Gameplay, UI, puzzels, saves en vegetatie zijn niet gewijzigd.

## 6. Regressietests

- `tests/sky-c01-r01.test.ts` (unit, in CI):
  - **Statische GLSL-guard**: in geen enkele cloudvariant mogen `fwidth/dFdx/dFdy/texture2D/texture` voorkomen in functies met een conditionele `return` of hun aangeroepen functies. Faalt aantoonbaar op de pre-fix productieshader (A en B) en op een gesimuleerde terugval.
  - **Grenscontract**: JS-spiegel van de contourfunctie (vastgepind op de shadertekst) bewijst dat alle cull-grenzen van alle acht profielen onder `CLOUD_OUTSIDE − 0,01` liggen en dat de richtings-cull volledig buiten de lokale rechthoek valt.
- `scripts/sky-c01-r01-qa.mjs`: browsermatrix voor/na (pixelgelijkheid, clouds-off, draw calls, fouten, timing).
- `scripts/sky-c01-r01-diag.mjs`: isolatiematrix (UB-kaart, emulatie, dome-dichtheid, camerastraal, ENV-L01, clouds-off).

## 7. Reproduceren

```sh
npm ci && npm run typecheck && npm test && npm run test:budget && npm run build
node --experimental-strip-types scripts/sky-c01-r01-qa.mjs /abs/qa-out      # BASE=436e106 default, QUICK=1 voor snelle run
# diag-transforms richten zich op de pre-fix bron: tijdelijk die bron bouwen, daarna terugzetten
git checkout 436e106 -- src/world/cloudPrototypes.ts && npm run build && node scripts/sky-c01-r01-diag.mjs /abs/diag desktop && git checkout HEAD -- src/world/cloudPrototypes.ts && npm run build
python3 scripts/sky-c01-r01-sheets.py /abs/qa-out /abs/diag docs/sky-c01-r01
```

Visueel in de game: `/Feh-Lu-We/` (normaal, A), `?clouds=0`, `?review=lighting&sky=procedural|masks|production`. Kijk naar de lucht rondom en tussen de wolken, vooral bij langzaam draaien.

## 8. Resterende risico's

- Niet gevalideerd op een fysieke GPU (Samsung/Android of desktop-GPU van de eigenaar). Graag dezelfde camerapositie als de oorspronkelijke screenshot controleren.
- Softwaretijden zijn geen GPU-tijden; geen FPS/thermiek-claim.
- `CLOUD_OUTSIDE` is gekoppeld aan de cull-marges; wie profielen of grenzen wijzigt, krijgt bij overschrijding een falende unit-test (bedoeld).
- De SwiftShader-pixelgelijkheid bewijst stijlbehoud; het bewijst niet dat elke GPU identiek rendert.

## 9. Oplevering

- Branch: **`sky-c01-r01-artifact-fix`** (vanaf productie `436e106`).
- Runtime-fix: commit **`c446f56`** (`src/world/cloudPrototypes.ts` + `tests/sky-c01-r01.test.ts`).
- Harnas/bewijs: `5a4c0af` (diagnose-checkpoint), `e56dfdd` (snelle QA), `ac969a4` (sheets/resultaten). De branch-HEAD bevat dit rapport.
- Niet gemerged, niet gedeployed. Volgende stap na visuele goedkeuring: controle op het eigen Android- en desktopapparaat (zelfde plek als de screenshot), daarna merge via het normale releaseproces.
