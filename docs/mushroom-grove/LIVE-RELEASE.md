# R04 production integration / live release

Authorization: the user explicitly requested publication to the public game after the required tests.

Production base: `c1bbdfec368674d4361c23a04e42bb98716c23e3`, branch `ccr-75ef4113-kfkimm`.
Approved Mushroom Grove: `3f9bde64b9c63d90b811166eb9d6f871b4225278` (R04).
A separate integration worktree/branch was created from the production base. The three shared files (`audio.ts`, `game.ts`, `estate.ts`) merged cleanly and were inspected; the current recorded footsteps, -30% dirt gain, bong interaction/sample, airco and kitchen juice pouch implementations were retained. No production files were reset to the older feature baseline.

## Existing production build blocker

The production base's own typecheck fails in `tests/grassR04.test.ts`: the test uses the global `Buffer`, but the project intentionally has no Node global typings (`types: [vite/client]`, minimal local Node shims). The most recent production Actions run 38781777192 also failed; preceding production run 38774168928 succeeded.

Only the test decoder was changed: `Uint8Array.from(atob(...))` and `TextDecoder` replace global Buffer. The same byte length, ID3 header and exact SHA-256 assertion remain. No footstep sample, timing, volume or audio implementation was changed by this repair.

## Validation in progress

- Unmodified production source: 308 unit tests pass; typecheck fails as described above. Its production build was generated separately for paired browser comparisons.
- Integrated source with test repair: typecheck, 315 unit tests across 32 files, four performance-policy tests and production build pass. Existing bundle-size warning remains.
- The standard full browser harness is running on the integrated build. A paired production run covers metrics and BOSLUST, where historical test failures were already documented.
- Assertions are unchanged. The local harness only increases navigation/default wait timeouts to 120 seconds for the software WebGL host. This temporary runner is not shipped.

Release gates and final deployment identifiers are recorded below when complete. The default production ref is updated only against the exact tested base SHA, so concurrent production updates cannot be overwritten.

## Resume after workspace maintenance (2026-10-15)

The transient worktrees, running browser processes and unpushed live-evidence files were removed by workspace maintenance. They were not reset or deleted by this implementation. Remote checkpoint `2a8e12dcc2f3de8c55cab0ae32363fab5e6677e3` and approved R04 remain reachable and have been freshly cloned. The interrupted complete browser run has no recoverable final results and is not claimed as a final pass. Earlier observed partial results in the conversation (including the successful tutorial-to-finale route) are historical observations only.

Production advanced to `87f4db5322b9c857034d74186d32bb43de35ffe4` (playable handpan plus repeatable Wickerman and first-clip-only grass footfalls). It was merged into the recovery branch. Two conflicts were combined deliberately: scene replacement clears both MushroomVision and the handpan target point; vegetation footprints retain both Mushroom Grove and the new hay bale exclusion. Original feature and production histories are preserved. New validation below supersedes the incomplete old run for release.

### Recovered integration validation

- Typecheck and production build pass. 354 unit tests / 35 files pass; four budget-policy tests pass. Existing bundle-size warning remains. Remote checkpoint `5920d54bf439726e2dc0ecb4711481143e44f63c` passes CI run 38811110819.
- Handpan desktop/mobile suite: 10/10 pass, including correct aimed/tapped notes, mute hint and no saved-state mutation.
- Repeated focused zone checks pass: 302 placements, 49 surveyed trees retained, zero trunk overlaps, progression unchanged, effect/audio zero on exit, mute RMS zero, pause fade, both production MP3 banks decoded, shader clock 12 at time 10, reduced motion clock/distortion/motion zero, distortion toggle and context recovery with GL error zero.
- Recovered integrated low mobile landscape sweep peaks at 130 calls / 659,557 triangles. This remains within the current 150 / 750k low-quality policy. Software SwiftShader timing is retained in raw evidence but is not a physical Android frame-rate result.
- Full regression, optional vignette/Wickerman and paired production checks are still running at this checkpoint.

The optional production/Wickerman release browser suite also passes 8/8: the bong cooldown, airco inspect/zap range, drink pouch, recorded grass/dirt surface resolution, ritual/audio coexistence, hay-to-matches handoff and absence of page/request errors are preserved. Raw handpan and optional-vignette logs are retained as text. The fresh full run's initial regression and lighting sections all pass, including F05 touch (no retry or input changes).

Current untouched production `87f4db5` paired metrics/BOSLUST run is complete: 31/38 pass. Exactly seven failures: six fixed high-quality 450k triangle assertions (gate, forecourt, hall, shed/forest, BOSLUST and pool) and the historical BOSLUST LOD-distance assertion. Every low-quality camera-budget check passes. No test thresholds were changed. `live-evidence/baseline/results.json` and `metrics.json` retain the exact failures/counters.

### Matched render comparison

All nine integrated low-quality camera checks pass. Maximum low calls in this representative set are 140 (zone landscape maximum: 130). Hall, library and gathering-room triangles are identical to production. Gate, forecourt, garden, shed and BOSLUST each submit 72 additional triangles; call differences are between -1 and +1. Pool counters vary with dynamic/culling state (-8,347 triangles in this sample), so this is not represented as a performance gain. The same six legacy high-quality assertions fail. Exact paired counters: `live-evidence/render-comparison.json`.

The merged JS bundle is 1,505.12 kB / 483.38 kB gzip versus production 1,484.79 kB / 475.79 kB gzip (about +7.6 kB gzip). Both builds already have the bundle-size warning. There are no new downloaded mushroom geometry/music assets: geometry and music are procedural. Physical Android GPU/FPS validation remains unavailable on this software-rendered host; no hardware FPS claim is made.

## Final release validation

The recovered complete integrated browser run finishes **96/103 passed**. Its exact seven failing test names match the current production baseline's seven failures; there are **zero new browser failures**. All functional checks (full tutorial-to-finale route, collision, lighting, saves/migration, touch/resize, WebGL recovery/failure, living-room and BOSLUST interaction/review checks) pass. F05 touch passes in this fresh full run without retry. Assertions were unchanged; only navigation/default waits were lengthened to 120 seconds for software rendering. The complete raw results and metrics are in `live-evidence/full/`, with the matched baseline in `live-evidence/baseline/`.

Release decision: publish the approved R04 source combined with current production, given passing build/typecheck/354 unit tests, four policy tests, focused zone lifecycle, handpan 10/10, optional Wickerman/vignette 8/8 and no new full-suite failures. The full browser suite is explicitly not described as wholly green. No LOD, quality threshold, puzzle or progression workaround was introduced.

The default branch is advanced only with an expected-head lease against `87f4db5`; the existing Pages workflow builds/tests/deploys the resulting commit. The public URL and built asset identifier must be verified after successful deployment. Actual deployment evidence is appended on the integration branch after release.

Remaining limitations: physical Android GPU/FPS/thermal measurements are still pending; high-quality legacy render assertions and the stale LOD test remain inherited issues. One useful subsequent polish iteration is a matched hardware pass on the target Android phone (normal forest, approach, core, return), followed by distance-culling/post-target tuning only if pacing requires it. The approved R04 art and shader strength are retained.
