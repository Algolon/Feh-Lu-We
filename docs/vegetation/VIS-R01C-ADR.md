# VIS-R01C — gedeeld vegetatie-LOD-framework (C0 ontwerp / ADR)

**Status:** ontwerp en implementatievoorbereiding, **geen runtime-implementatie**. [Tracking issue #64](https://github.com/Algolon/Feh-Lu-We/issues/64). Gebaseerd op Mushroom Grove VIS-R01AB [release #62](https://github.com/Algolon/Feh-Lu-We/pull/62), default branch op merge `ac8cf1c`. Geen productiepublicatie via deze branch.

## 1. Probleem, doel, grens

VIS-R01AB loste een harde 65 m-gate voor de Mushroom Grove op: per-instance afstand, LOD, hysteresis, gekwantiseerde schaal-fade, frustum culling en dezelfde `VegBatch`-renderer voor multi-draw en fallback.

Dat gedrag is niet overal herbruikbaar. De huidige bron bevat vier eigen regelaars:
- `mushroomGrove.ts`: Mushroom Grove (302 instanties), categorieën hero/medium/nursery, B-profiel standaard, A opt-in.
- `boslustSample.ts::TreeBatches`: boom- en struik-LOD met harde zichtafstand, bestaande `TREE_LOD_PROFILE` en `outdoorWindows`-logica.
- `boslustSample.ts::PlantBatch`: kleine planten met `PLANT_SHOW`, per-instance `show`, oorspronkelijke `round(k*12)/12` schaal-fade. **Dezelfde klasse** bouwt ook leaf litter, stenen en dood hout.
- `vegbatch.ts`: renderer, niet de eigenaar van LOD: multi-draw `BatchedVeg` of `InstancedVeg` fallback met (waar van toepassing) schaduw-conservatieve culling.

**Doel C:** ontkoppel een compacte `VegLodController` (selectie en state) van `VegBatch` (tekenwerk), zodat nieuwe vegetatie er zonder eigen culling-gate aan kan koppelen. De Mushroom Grove fungeert als golden visual reference; VEG-R02 blijft een afzonderlijk opt-in kunst-/modelproject.

**Niet het doel:** tegelijk alle vegetation art, afstanden of geometrie optimaliseren, of generieke LOD als reden gebruiken voor méér GPU-werk.

## 2. Nu relevante parity-invarianten

| Gebied | Vandaag | Contract voor C |
| --- | --- | --- |
| Mushroom hero | detailed tot ca. 25 m, small tot 55 m, far tot 125 m, hysteresis 3 m, fade laatste 20 m | Eerste migratie exact gelijk aan R01B, inclusief `?grovelod=a` |
| Mushroom medium | small tot 50 m, far tot 105 m, hysteresis 3 m, fade laatste 15 m | Exact gelijke silhouetten/instance kleuren/posities |
| Mushroom nursery | young tot 12 m, youngFar tot 32 m, hysteresis 2 m, fade laatste 8 m | Zelfde 241 exemplaren; geen nieuwe visual pop |
| Trees | hybride treeprofiel en hard cut op farDist 115 m; 0.3 m camera movement cache, 3 m hysteresis | **Geen automatische fade** en geen verandering in `?veglod` |
| Bushes | near/far, hard cut bushFar 50 m; gedeelde TreeBatches update | Behoud bestaande shrub-specifieke range/geometrie |
| PlantBatch | inlined `round(k*12)/12` + cache 0.25 m, `PLANT_SHOW` / custom `show` | Identiek afrondingseffect; `rangeFade` in R01B gebruikt juist **ceil** en is dus niet blind uitwisselbaar |
| Inside/outside | `outdoorWindows` met gespiegelde plan-z `(-it.p.z)`, per instance radius tolerance | Eén helper met dezelfde kijkkegelsemantiek en room gating; pariteit rond deuren |
| Multi-draw | per-instantie frustum culling door `BatchedMesh`; één call per batch waar zichtbaar | Behoud batching; geen introductie van extra geometriegroepen zonder gemeten noodzaak |
| Fallback | `InstancedVeg.sync` CPU frustum + conservatieve schaduwbereikcorrectie voor schaduw-casters | Geen onterecht verdwenen bomen/schaduwen, geen per-frame volledige re-upload |
| Shaderinstancedata | kleurkanaal biedt momenteel mushrooms glow/fase; trees gebruiken leaf tint | Maak eventueel apart datakanaal **opt-in**; voorkom stil veranderen van tint of renderpad |

De baseline vóór C1/C2 moet exact worden vastgelegd (geometrie, camera matrices, renderpaden, scene/build hashes, visibility ranges en GPU-counters), ook als er intussen wijzigingen aan productie zijn gedaan.

## 3. Minimale voorgestelde interface (nog te toetsen met contracttests)

```ts
type FadeQuantizer = 'round12' | 'ceil12' | 'none';
type RangePolicy = { exit: number; fade: number; quantizer: FadeQuantizer };
type LODPolicy = { thresholds: readonly number[]; hysteresis: number };
interface VegLodSpec {
  geometryIds: readonly number[];    // één id per LOD level
  lod: LODPolicy;
  range: RangePolicy;                 // fade: 0 = hard cut, voor legacy trees
  boundsRadius: number;
  region: 'outdoor' | 'unrestricted';
}
interface VegLodItem {
  batchId: number;
  modelMatrix: THREE.Matrix4;        // world transform, positieve determinant
  position: THREE.Vector3;          // shared model origin
  spec: VegLodSpec;
  level: number;
  quantizedScale: number;           // previous result
}
```

**Ontwerpprincipes:**
1. Alleen `selectLevel`, `fadeScale`, `inOutdoorWindow` en `updateVisibleItem` zijn generiek. Behoud TreeBatches/PlantBatch voorlopig als adapters, niet als ineens te vervangen ervarings-/artistieke systemen.
2. Controller genereert minimale `setGeometryAt/setVisibleAt/setMatrixAt`-updates via de bestaande `VegBatch`-interface, rekening houdend met `onFrame`-ordering (early LOD, late fallback frustum-pack). Geen individuele THREE mesh per plant.
3. Schrijf alleen een matrix als nieuwe quantizedScale afwijkt. Verander geen LOD-geometrie op ongewijzigd level. Na room/window-version-update moet de controller refreshen zelfs bij stilstaande camera.
4. `rangeFade` uit R01B gebruikt `ceil`, `PlantBatch` gebruikt `round`. Optie: uitdrukkelijke compatibiliteitsstrategie per gebruiker totdat een visuele migratie apart wordt goedgekeurd. `fade: 0` betekent visibiliteitspas, zonder deling door nul.
5. Groottegebaseerde / screen-space LOD blijft een hypothese; alleen invoeren als directe A/B-bewijzen tonen dat hij beter presteert dan de huidige per-instance distance.
6. Per-instance user data moet geen globale kosten opleggen. Inspecteer `getIndirectIndex(gl_DrawID)` en fallback attribute/bufferpad vóór besluiten over een additionele instance-DataTexture. Definieer eigenaarschap/lifetime, maximale bufferbezetting en GPU compatibility.
7. Gespiegelde content: alleen positieve instance-determinant, indien nodig `mirrorGeometry` plus S·M·S. Bewaar alle plaatsingen/colliders/source hashes.

## 4. Implementatiestrategie: kleine checkpoints

### C0 — baseline, API en besluit (deze branch)
- Leg code-overlap en baseline vast met exact gesynchroniseerde poses, testconfiguraties en een visual-parity-criterium.
- Contracttests voor pure `selectLod`/fade (`round12` versus `ceil12`, fade=0, hysteresis, zichtkegel incl. spiegel-z, no-op updates).
- **Geen productie-source-file edits in de C0 release.** De testplanning wordt pas geïmplementeerd nadat deze ADR is gereviewd.

### C1 — pure gedeelde controller (achter `?veglodshared=1`)
- Nieuwe module `src/world/vegLodController.ts` en interface-contracttests; bestaande renderinginterface niet aanpassen tenzij bewezen noodzakelijk.
- Integratie uitsluitend met mushrooms; R01B als golden comparator: alle 302 plaatsingen/40 colliders/zelfzelfde shader/audio, LOD/walk/fade/room tests, exact dezelfde random seeds.
- Verifieer `?multidraw=0`, reduced motion, context loss, window views en gl.errors; default route gebruikt zolang legacy code.

### C2 — adapters
- PlantBatch: standaard en custom `show`, alle materiaalgebruikers: veldplanten, leaf litter, garden foliage, stenen en hout; parity van `round12`.
- TreeBatches: bushes gevolgd door trees, `TREE_LOD_PROFILE=hybrid`, `?veglod`-overrides, shadow cam culling, geen nieuwe VFC-/VEG-art.
- Wissel nooit alle soorten in één commit om. VEG-R02's `woodkit.ts` en huidige model-prototype worden niet gewijzigd zonder afstemming.

### C3 — QA, hardware, releasebesluit
- Exact matched screenshotdiffs (day/dusk, landscape/portrait, low/high, fallback), live approach route 120→0 m en return, gewone forests, BOSLUST, forecourt, conservatory, room doorways, clip planes, 360° turns en oscillatie rond LOD-grenzen.
- CI: `typecheck`, unit, PB01 budget 4/4, production build; volledige E2E vergeleken met dezelfde productiebranch als baseline, **geen nieuwe fouten**. Eerdere R01-regressie 89/97 (acht bestaande fouten) is historisch en geen universele huidige waarheid.
- PB01 mobiele **ontwikkel**richtlijnen: maximaal 150 calls / 750.000 camera-triangle per relevante low-mode view, zonder meer rendering op andere poses; gemeten fysiek op Samsung incl. 10 min warm run, frame pacing/spike analyse en thermals.
- Start release pas na eigenaarsreview en verklarende evidence. Opt-in flag terug kunnen uitzetten zonder geometry/art/progressiedelta.

## 5. Stop/go en risico's

- **No-go:** nieuwe silent renderregressie, ander gameplay-hash, veranderde boom-/mushroomvormgeving, meer calls door fragmenteerde batching, hogere idle GPU overhead, onverklaarde first-approach spike, onbetrouwbare fallback/shadows, onverwachte impact op VEG-R02.
- **Go met motivatie:** kleine verklaarde triangle-verandering door bewezen betere zichtcontinuïteit bij voldoende PB01-marge; geen nieuwe full-suite fouten en aantoonbare device-profilering.
- **Aparte besluiten:** Mushroom PointLights naar LightPool (VIS-R01B bekend aandachtspunt); crossfade/dithering (potentiële fragmentkosten); automatische screen-space LOD.
- **Risicobeheersing:** eigen worktrees/branches, geen rebase/reset van VEG-R02; elke productieverandering opnieuw vergelijken vóór merge.

## 6. Overdracht aan uitvoerende sessie

1. Synchroniseer met huidige remote production zonder parallel werk te raken en meet baseline in exact dezelfde render- en hardwareprofielen.
2. Voer eerst C0-tests + inspectie uit en herbevestig de interface. Een globale refactor vóór bewijs is expliciet onwenselijk.
3. Implementeer vervolgens C1 in een eigen branch/draft PR. Laat C2 pas starten bij bewezen Mushroom parity.
4. Houd visuele, regressie- en performance-evidence versieerbaar. Hanteer de expliciete owner-review vóór merge/deploy.

**Koppelingen:** [R01B technische evidence](../vis-r01/REPORT.md) · [werkpakket #64](https://github.com/Algolon/Feh-Lu-We/issues/64) · [R01B PR #62](https://github.com/Algolon/Feh-Lu-We/pull/62).
