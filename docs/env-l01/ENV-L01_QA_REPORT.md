# ENV-L01 — QA and limits

> Current status — 14 October 2026: owner-approved cumulus and four-phase lighting are enabled in normal estate gameplay on this isolated branch. Earlier opt-in/baseline statements below describe historical prototype stages. See [release and recovery assessment](ENV-L01_RELEASE_ASSESSMENT.md). Nothing merged or deployed by ENV-L01.

Reviewable prototype, **not a green production integration gate**. Severe owner Android black-out remains unreproduced; physical device validation and final integration review remain required; the four-phase direction is approved.

## Automated results

| Check | Result |
|---|---|
| Production baseline typecheck / units / build | pass / 267 passed / pass |
| Prototype typecheck / units / build | pass / 272 passed / pass; existing chunk-size warning |
| Review controls and save isolation | pass: phase/location/quality/system changes; owner's save, backup and settings untouched; no puzzle flags solved; 3 low lights; sunset sun zero; shader/GL clean |
| Main existing E2E | **102/103**; full 70-step tutorial → finale route passes, 31 clues. F05 left-side touch timing fails; see below |
| DEV-04C existing E2E | **22/22 passed** |
| DEV-04D existing E2E | **18/18 passed** |
| Actual capture matrix | 63 original production + 71 prototype frames; no page/console, shader diagnostic or GL failures |
| Same-world path control | 8 frames, baseline/pilot and multi-draw/fallback; no shader/GL failures |
| Desktop aspect | 8 frames at 1280×720 low; no page/console, shader or GL failures |
| Physical Android FPS / thermal / overdraw | **not measured** |

Final regression uses a rebuilt source at local `de1ef37` (same Git tree as remote `6d4df361…`), no dist rebuild during the run. Before/after JS SHA256 guard: [QA summary](evidence/qa-summary.json); [main E2E](evidence/e2e-results.json), [DEV-04C](evidence/dev04c-results.json), [DEV-04D](evidence/dev04d-results.json). The tested JS hash remained `63619f678af3a4426a6f53a94d5b3834f64d9942867aa6644ea32983ef1ff4db`. Capture-build fingerprint is separate and explicitly records its pre-commit build label; same runtime sources.

## F05 — confirmed software event-timing failure, not a claimed gameplay fix

The unmodified main suite dispatches touchStart, waits 80 ms, then touchEnd. The input accepts a tap only when pointerdown → pointerup is <350 ms (`src/player/input.ts`). A clean archive/build of production `ae2a036` also fails the same focused test. Instrumented production events were **825.8 ms** apart: the software renderer delays browser event processing far beyond the test's requested wait. A prototype normal-game repeat passed at **116.8 ms**. Initial projection/matrix hypothesis was rejected: pre/post matrix-update target coordinates were identical.

See [focused initial comparison](evidence/touch-check.json) and [event timing](evidence/touch-timing.json). No input thresholds, gameplay code or existing test assertions were changed to make the gate green. The full main suite remains 102/103 as actually run. A hardware-backed browser or a dedicated harness scheduling fix is the next test step; this is not evidence that all mobile touch performance is acceptable.

## Performance and budget caveats

No new scene geometry, material family, texture, postprocess pass or light slot. Bundle gzip about **417.69 → 420.16 kB** (+2.47 kB).

| Representative low view | Original production calls / triangles | Pilot late dusk calls / triangles |
|---|---|---|
| BOSLUST door | 91 / 227,606 | 91 / 226,908 |
| BOSLUST approach | 90 / **251,632** | 90 / **251,632** |
| Open garden | 58 / 155,894 | 58 / 155,894 |
| Manor approach | 128 / 214,482 | 128 / 214,482 |
| Deep woodland | 35 / 203,432 | 35 / 203,432 |
| Entrance hall | 110 / 213,506 | 110 / 213,506 |
| Living | 53 / 175,528 | 53 / 175,528 |
| Darker room | 28 / 80,424 | 28 / 80,424 |

Stationary camera alone does not fix vegetation LOD: `TreeBatches` keeps a 3 m hysteresis band. Startup/travel history changed the first BOSLUST counts slightly. A paired **same-world** control removes that confound: multi-draw **91 / 226,908** in baseline and pilot at both endpoints; forced fallback **147 / 252,696** in both. Therefore no light-prototype geometry/call increase was demonstrated, and the fallback budget exception is pre-existing under that LOD history. Keep it visible rather than claiming every view meets 150/250k. Existing estate exceptions outside this sample are not repaired by ENV-L01.

High quality is not governed by the low phone guide. At blue hour/late dusk the directional light/glow are off; its shadow pass is off too. High retains DPR ceiling and four point-light slots, but its counts approach low. For BOSLUST late dusk: low 91 / 226,908; high 92 / 229,773. Daytime high has canopy shadows and substantially more shadow geometry. Automated high captures use a desktop pointer and 2048 map; physical mobile high uses 1024.

Timings use gl.readPixels synchronization after warm-up, **software** WebGL. Host workload varies widely (single-run BOSLUST medians roughly 382–906 ms across recordings), so paired sample order and concurrent test load confound a shader-cost estimate. These data do not establish phone FPS or a statistically reliable cost delta. Added sky uniform branch/tonemapping is the only new fragment work; vegetation/overdraw topology is unchanged. Real GPU profiling and a 5–10 minute device session remain required; do not infer thermal safety from counters.

## Readability evidence

Bottom-55%-of-frame encoded JPEG luma is a diagnostic, not physical luminance or a universal acceptance threshold. Production → pilot late dusk medians: BOSLUST **30.0 → 38.6**, garden **36.1 → 51.7**, woodland **23.6 → 31.2** (0–255). Woodland near-black samples (<=8) **4.80% → 0.66%**; excludes no semantic masks and does not prove every clue is readable. View the actual sheets and test the device.

No shader/NaN evidence, surface or batching failure found in these views. Unit sweep checks finite values and ordered fog at 301 phase values × indoor blends × regions, and value continuity at phase stops. Normal-game pipeline isolation is tested. Existing main suite verifies closed doors/through-wall blocking, saves, collision, culling, pool continuity, lantern/fire state and vegetation path parity. Pilot stationary captures verify forms and current fixtures; they do not certify every moving-camera pool exchange or newly revealed secret.

## Remaining gates and integration

- Original black Android view received and analysed; obtain matched baseline/pilot/hemisphere-only device frames and a render report. Driver/precision/context-specific defect remains possible.
- Validate day/blue/dusk on the physical Samsung, landscape and portrait, normal and reduced motion, actual DPR; record FPS/frame pacing and thermal changes.
- Review clues at intended distance and hidden areas visible through existing foliage gaps; no render occlusion/geometry rule was changed, but brighter fill can reveal what darkness alone concealed.
- Do not promise basement-specific tuning: the representative darker room is Sterrenkamer; underground still uses the existing indoor classification.
- Reconcile overlapping `artflags.ts` with VCP-01 PR #9; main/game/env/review additions with active DEV-04D/UI-R01. No older work copied over current production.
- Owner approval before final calibration, expansion, merge or deploy. Nothing merged or deployed.

## Owner follow-up

Four-phase visual direction approved; severe-black screenshot now inspected. [Follow-up](ENV-L01_OWNER_SCREENSHOT_FOLLOWUP.md) distinguishes the visually confirmed symptom from an unconfirmed cause, documents nine new controlled tests and verified local JSON diagnostics. Latest diagnostic-only extension: 273 units, typecheck/build and targeted browser smoke pass. Earlier E2E provenance stays unchanged.

Owner High/Normal comparison now demonstrates readable rendering on both settings at a visually similar BOSLUST view; this is a static device readability check, not FPS/thermal validation or reproduction of the old defect. No source changes in this evidence-only update.

## Sky continuation — latest-build validation, 13 October 2026

- Typecheck/build pass; **274 unit tests pass**. Cloud toggle isolation, sun-vector alignment, ordinary-game exclusion and phase-stop cloud continuity included.
- **25 real game frames**: four-phase BOSLUST/garden/upward-sky Low; garden portrait day/dusk; BOSLUST mobile High day/dusk; day/golden solar views; cloud on/off garden, hall and baseline. No page/console error, shader diagnostic failure or GL error. Review save/backup/settings sentinels untouched, no puzzle solved. [Measurements and immutable build fingerprint](evidence/sky-detail-measurements.json).
- All five paired on/off tests retain identical light values and geometry counters. Garden Low **58 / 155,894**; BOSLUST Low **91 / 226,908**. Mobile High BOSLUST day **110 / 365,323**, dusk **91 / 226,908**; sun shadow pass switches off at dusk. High is a secondary check, not a low-budget pass claim. No additional sky draw or geometry; six cloud lobes execute only in pilot review.
- Latest JS gzip **422.55 kB**, versus previous diagnostic build **421.58 kB** (about +0.97 kB). Existing large-chunk warning remains. Normal-game sky detail is compiled out; pilot sky has additional fragment work over the existing full-screen dome. Counters alone cannot establish fragment/overdraw cost or thermal safety.
- The first strict on/off assertion failed before the room blend was controlled; successive interior stills had history-dependent doorway smoothing as a confound. Initial per-frame values were not retained, so its specific delta cannot be retrospectively attributed. Harness now pins the classification blend for still comparisons; all final paired lighting/counter checks pass. No production smoothing or lighting changed to address the harness comparison.
- Physical Android FPS, frame pacing and thermal validation remain unmeasured. Owner's readable High/Normal screenshots are historical production evidence, not these new cloud renders. Reload recovery narrows hypotheses but confirms no native root cause.
- UI-R02 PR #16 currently has no direct file overlap with this continuation. Initial ENV-L01/VCP-01 PR #9 artflags overlap still needs integration; unpublished parallel work remains unknown. No merge/deployment.

Latest immutable-build suites completed: **main 102/103**, **DEV-04C 22/22**, **DEV-04D 18/18**. The only main failure is F05 again; its earlier clean-production touch-timing diagnosis is documented above, but this run did not instrument event timing anew. Full tutorial→finale route (70 steps/31 clues), lamp/fire toggles and persistence, wall blocking, context recovery, low/high rendering and batching/fallback checks pass. The ordinary game still selects legacy lighting; full route success is not a completed playthrough under all pilot phases. Review controls/save isolation also pass. [Latest summary](evidence/sky-detail-qa-summary.json), [main](evidence/sky-detail-e2e-results.json), [DEV-04C](evidence/sky-detail-dev04c-results.json), [DEV-04D](evidence/sky-detail-dev04d-results.json). JS SHA256 stayed `194019147279a524fd3061f70a358e0a4bd64908e776671492a76e802e1aa770` throughout captures and suites.

The DEV-04C run also records an existing **golfSpur 90 calls / 263,048 triangles** budget exception (the suite permits its known baseline exception). Keep this visible alongside the earlier approach/fallback exceptions; this sky pass changes no landscape geometry. Do not interpret a passing suite as every estate location meeting the 250k guide.

## Cumulus revision — targeted validation

Owner requested stronger billowing cloud forms. Latest typecheck/build and **274 units** pass. Cloud shader/form and cloud colours/opacity changed; the review checkbox label was made generic. Approved world light/fog/exposure values, ordinary legacy sky, gameplay/UI/save logic are unchanged. Targeted browser matrix rerun on this revision: 25 final indexed captures, cloud on/off and persistent-state isolation; exact evidence in [cumulus measurements](evidence/cumulus-measurements.json).

The preceding full E2E results (102/103, 22/22, 18/18) remain explicitly those of the preceding sky implementation; they were not rerun for this cloud-only GLSL/palette revision. No new complete-route or native-device pass claimed. Shader cost increases from six simple lobes to 21 polynomial lobes with analytic gradients/three surface normals. Geometry/call budgets alone cannot validate that cost; optional clouds remain a device review gate. Gzip **422.92 kB**, about +0.37 kB over preceding sky build. Physical Android FPS/thermal/overdraw remain unmeasured. No merge/deployment; native blackout root cause remains unconfirmed.

Final cumulus matrix: **25/25 captures without page/console, shader diagnostic or GL errors**; all five cloud on/off pairs retain identical world-light values and geometry counters. Save/backup/settings sentinels untouched; no solved puzzle flags. Day/dusk garden before/after bottom-30%-ROI JPEG pixels are identical (unsegmented diagnostic, not a photometric claim). Baseline cloud toggles also retain equal counters/light. Low garden **58 / 155,894**, BOSLUST **91 / 226,908**; High daytime **110 / 365,323**, dusk **91 / 226,908**. Final JS hash stayed `f63e2edadb6729a330a102383e853ba08178f2ef97bf75457446cf4bf0537fad` through the targeted matrix. Ordinary full-suite results remain at their preceding build, as stated above.

## Activation/recovery checkpoint — 14 October 2026

Normal-game activation is reconstructed and checked with typecheck/build/275 units. Supplementary activation E2E/capture files were lost in automatic workspace maintenance. Earlier DEV-04D timeout and successful targeted repeat are session observations, not newly preserved pass evidence. Assertions/timeouts remain unchanged. See [release assessment](ENV-L01_RELEASE_ASSESSMENT.md) for exact provenance, unresolved validation and production/UI-R02 integration requirements.
