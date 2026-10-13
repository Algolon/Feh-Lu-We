# ENV-L01 — QA and limits

Reviewable prototype, **not a green production integration gate**. Severe owner Android black-out remains unreproduced; physical device validation and owner visual approval remain required.

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
