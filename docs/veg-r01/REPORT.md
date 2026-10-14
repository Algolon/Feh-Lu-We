# VEG-R01 — recovery, comparison and implementation decision

**Activation update:** the owner subsequently authorized merge/deploy and Hybrid was selected as the ordinary-game default for live testing. See `ACTIVATION.md`. The conservative decision and limitations below describe the preceding comparison checkpoint.

14 October 2026. **Decision: retain baseline as the ordinary-game default. Hybrid is the preferred experimental candidate, not approved for activation or merge.** No production merge or deployment occurred.

## Recovery and isolation

Git is authoritative. The remote branch `veg-r01-vegetation-lod` started at `5a6df26`, based on GEO-R01 `142bd7c`. The old local `b484ebc` has exactly the same Git tree, with different commit history. Uncommitted harness/test improvements and all eight moving capture sets were recovered from the original worktree. Their patch and capture archive were copied before any work; the original VEG/GEO/PB/TUT/SKY worktrees were not edited. This recovery uses an independent clone of the same featurebranch. Checkpoint `95a7216` is published remotely (same tree as local `82c3483`).

Production inspected: `5af9779`, default branch `ccr-75ef4113-kfkimm`; it includes PB01 (`5ca306d`), TUT-R01 (`69f4011`) and SKY-C01 (`5af9779`). During final verification production advanced to `3a12a69`, merging TUT-R02 `ab8541a`. Its runtime delta is limited to `home.ts` and `homeDressing.ts`, disjoint from VEG. The final text-conflict check and a second unpublished integration typecheck/build/289-unit run pass against `3a12a69`. The recorded browser/moving evidence remains explicitly against `5af9779`; it was not relabeled as a browser test of the newer home scene. A temporary, unpublished compatibility tree combines production and VEG without text conflicts; it does not update either branch. Shared `estateWoods.ts` changes are additive diagnostics and PB01's budget comment. No runtime from PB/TUT/SKY is imported into the VEG featurebranch. GEO remains an inherited dependency, not new VEG work.

## What is implemented

All candidates and diagnostic selectors remain available: `?veglod=baseline|a|b|hybrid`, optionally `&multidraw=0`. Only tree LOD geometry/bands change; tree placements, bushes, vegetation cutoffs, lighting phases and near tree models stay as before. Corrected instanced packing preserves region-owned scene roots across capacity growth, region-hidden visibility, transforms and colours. The explicit baseline tree/plant path preserves the legacy fallback behavior for paired comparisons. Other callers of `makeVegBatch` use the region-preserving default; consequently this is a prototype branch, not a claim of an entirely byte-identical production runtime.

| Variant | Nominal tree bands (m) | Geometry |
|---|---|---|
| Baseline | 16 / 26 / 48 | Legacy cluster reduction and topology |
| A | 24 / 42 / 70 | Baseline geometry; higher detail held farther out |
| B | 28 / 50 / 80 | Near topology at mid; outline/primary-branch retention farther out |
| Hybrid | 22 / 36 / 62 | Cheaper mid, retained far outline; far and xfar alias the same geometry |

All retain 3 m symmetric hysteresis: approaching upgrades happen 3 m before the nominal boundary, retreat downgrades 3 m after it. Selection still uses tree-origin distance, not projected screen size. No alpha crossfade or temporal blend is added. Legacy non-batched trees retain their existing rules.

## Measured results

The recovered comparison contains **24 static views and 400 moving samples per variant per path**: 192 views and 3,200 moving samples overall. Four collision-aware routes (BOSLUST, dense woodland, garden edge, treeline) each approach for 4 s, retreat for 4 s and turn for 2 s. Simulation is 30 Hz; render capture is 10 Hz. All eight camera trajectories match exactly; fallback and multi-draw submit identical moving triangle counts. This establishes parity for these samples, not all possible cameras.

Low quality, 768×432 CSS and drawing buffer, renderer DPR 1, FOV 68, shadows off. Counts include complete submitted intersecting instances/batches. **Freshly rerun first ten static views exactly reproduce all inherited calls/triangles for all eight combinations**, with no page errors. Raw measurements: `comparison/*/results.json`, `comparison/*/moving-summary.json`, `recovery/fresh-static/`. Reproducible aggregation/assertions: `scripts/veg-r01-assess.py`; compact assessment: `assessment.json`.

| Variant | Max camera triangles, static + moving | Max calls multi / fallback | Geometry changes within 90 m | Paired moving triangles, median / max growth |
|---|---:|---:|---:|---:|
| Baseline | 371,959 | 186 / 203 | 234 | — |
| A | 375,338 | 186 / 208 | 385 | +24.0% / +31.3% |
| B | 418,514 | 186 / 216 | 394 | +66.1% / +90.8% |
| Hybrid | 414,577 | 186 / 199 | 146 | +29.7% / +38.5% |

Geometry-change events count diagnostic trees within range, including offscreen trees; they are **not a count of perceived pops**. Wider bands can intersect more trees on a short route, so A/B's higher event counts alone do not prove worse visual continuity. Hybrid reduces this diagnostic count by 37.6% and removes the far→xfar geometry transition by construction. Render triangles are not a frame-time prediction.

A fresh reproducible geometric outline diagnostic projects four bearings for four species × three variants into 256 px binary triangle masks. Mean near/mid, mid/far, far/xfar overlap (IoU): baseline **0.867 / 0.823 / 0.525**; B **0.969 / 0.759 / 0.953**; Hybrid **0.867 / 0.831 / 1.000**. A uses baseline geometry. These masks do not measure normals, colour, occlusion in the game, or human perception. Sources: `scripts/veg-r01-models.mjs`, optional geometry argument to `scripts/veg-r01-assess.py`, `model-continuity.json`.

### PB01 assessment

The currently integrated policy is **750,000 camera triangles at mobile low**, **150 calls unchanged**, no validated device ceiling. All sampled variants fit the absolute triangle ceiling. All retain inherited call failures at manor/conservatory views; none passes the whole call guide. A and B also introduce a new static BOSLUST >150-call view on fallback (baseline 142, both 152); Hybrid introduces no new static call-guide crossing in this set. Existing `cons-deck` is 170 multi calls for every variant. Those GEO/scene costs are not credited to VEG as improvements or newly approved exceptions.

Every candidate exceeds both independent 8% and 2% relative triangle-review guards throughout these paired moving samples. The ceiling does not waive these guards. Deliberate visual improvement could justify an allowance only through separate review of these measured deltas and device evidence; **no allowance, threshold, baseline or budget test was changed**. Thus even Hybrid is not activation-ready.

### Costs beyond camera triangles

Estimated unique geometry attribute/index storage: baseline/A **83.37 MiB**, B **83.72 MiB**, Hybrid **83.31 MiB** in the recovered whole-scene inventory. Multi-draw adds about 0.20 MiB instance attributes and 1.13 MiB batch textures; fallback instance attributes vary with packing capacity. These are CPU-side byte estimates, not total GPU memory. Textures, render targets, driver duplication and allocator overhead are excluded; object counts depend on renderer visitation and are not VRAM.

High-quality 1024² sun shadows were tested separately. Fresh actual shadow-pass hooks, not subtraction of two differently culled views, report multi-draw camera/caster triangles respectively: baseline **232,688 / 141,704**, A **273,125 / 206,742**, B **350,281 / 312,591**, Hybrid **297,276 / 183,237**. Each has 89 camera + 19 shadow calls in this control. Fallback may pack a conservative camera/caster superset; its explicit combined-minus-shadow counts are retained in `assessment.json`. These controls are not mobile-low acceptance results.

### Mobile and software pacing

Chromium/WebGL2 uses ANGLE SwiftShader, not a physical phone GPU (`recovery/environment.json`). Fallback means **WebGL2 without WEBGL_multi_draw**, not WebGL1 support. Both paths were exercised for all profiles, plus growth/region/culling regression tests.

Forty actual rAF intervals per combination were collected after eight warm-up callbacks in a fixed BOSLUST view. Multi/fallback median and p95 milliseconds respectively: baseline **166.6/216.7 and 158.3/349.9**; A **183.3/383.3 and 200.1/449.9**; B **233.3/283.3 and 233.3/300.1**; Hybrid **199.9/366.7 and 208.3/450.0**. Raw intervals, p99, maxima and >50/>100 ms counts are retained. Short software runs include large scheduling/queue stalls and are not sufficient for a reliable speed ranking. CPU submission timings are likewise not GPU completion time. **No Samsung FPS, sustained thermal behavior, mobile throughput, or near-750k capacity has been measured.** PB01's physical-device validation remains pending.

## Visual judgment, separate from measurements

Inspected matched real-render stills and moving-sequence contact sheets (`static-review.jpg`, `moving-review.jpg`). Review videos contain the same four 10 s routes; 384×216 exports preserve simulation-time playback from the original 768×432 captures, not real device pacing. Original full-resolution capture hashes are in `recovery/checkpoint.json`.

- **Baseline:** recognizable nearby authored trees, but distant crowns lose substantial mass and gain it abruptly on approach; the far/xfar outline change is the clearest structural weakness.
- **A:** fuller at mid distance because higher LOD lasts longer, but preserves the same underlying outline discontinuities. It moves the problem rather than resolving its cause and costs more geometry.
- **B:** best near/mid surface continuity and rich middle-distance crowns. Its mid/far simplification remains visible, and its much larger geometry/caster cost is not justified as the default solution by current evidence.
- **Hybrid:** best compromise for this scoped work. It retains distant crown identity, removes a whole model change, and reduces fallback groups versus the other candidates. Near/mid transitions remain visible; it does not solve every pop or improve the underlying close-up sculpting. The crowns still have stylized lobes; this task does not create new artistic tree assets.

This is an engineering visual assessment at the documented views, not owner approval, a blind perceptual study or a full estate/mobile camera survey.

## Validation and merge readiness

Fresh branch typecheck/build pass; **286/286 unit tests** pass (the earlier checkpoint's 285 is superseded by one recovered fallback transform/colour test). Existing large-bundle build warning remains. The unpublished production+VEG compatibility tree passes typecheck/build and **289/289 unit tests**. No text merge conflicts against `5af9779`; Final compatibility checks against `3a12a69` also pass typecheck/build and 289 units; TUT-R02's edits are in disjoint home-scene files.

Additional unpublished current-production replay completed **40 static views and 1,600 moving samples** for baseline/Hybrid × both paths, with no page errors, matched camera trajectories and exact fallback/multi-draw moving triangle parity. Its first-ten static counters match the recovered ones. It starts after ten rather than 24 reference views: early BOSLUST/dense counts differ from the inherited replay by at most 3,724 triangles for baseline and 2,441 for Hybrid. This is consistent with changed LOD history, not an isolated measurement of integration cost. Details and per-route counts: `recovery/integrated-moving/summary.json`.

Current-production DEV-04A browser regression: **17/19 passed**, with the inherited budget failure and a final legacy-save navigation timeout (cause unestablished). Targeted BOSLUST suite: **13/14 passed**; a navigation timeout prevented later sample subchecks. The optional broader suite was stopped after 18 completed passing checks to release concurrent software-render load; all remaining checks are unverified. No complete walkthrough or all-green browser regression is claimed. Normal-game moving fallback, static parity, region/growth/transform unit regressions and near-model tests provide the scoped vegetation evidence. Results/logs and build provenance are preserved under `recovery/`; no thresholds or assertions were relaxed. These failures and omissions are additional merge-readiness limitations. See `recovery/CLOSEOUT.json`.

**Merge readiness: NO for candidate activation.** Keep baseline. Preserve the selectable prototypes and evidence for owner review. A later activation decision should first validate Hybrid on the actual Samsung (including sustained pacing and fallback), explicitly review the +29.7% typical/+38.5% worst sampled moving geometry increment, and resolve or explicitly address inherited draw-call/relative-budget failures. A production merge, even with baseline default, also inherits GEO-R01 and needs review of that dependency and the baseline fallback qualifier above. No production action is authorized by this closeout.

## Reproduction

From the featurebranch, use installed project dependencies and a Chromium executable via `CHROME` when its path differs:

```sh
npm run typecheck
npm test
npm run build
PROFILES=baseline,a,b,hybrid REFERENCE=1 MOVING=1 VIDEO=1 node scripts/veg-r01-compare.mjs docs/veg-r01/comparison
python scripts/veg-r01-package.py
PROFILES=baseline,a,b,hybrid SHOTS=0 node scripts/veg-r01-compare.mjs docs/veg-r01/recovery/fresh-static
PROFILES=baseline,a,b,hybrid PACEONLY=1 SHOTS=0 node scripts/veg-r01-compare.mjs docs/veg-r01/recovery/pacing
node scripts/veg-r01-models.mjs /tmp/veg-r01-models.json
python scripts/veg-r01-assess.py /tmp/veg-r01-models.json
```

Repackaging processes new complete raw frame sets and otherwise preserves existing summaries. The packaging script moves bulky raw frames into `VEG_INTERMEDIATES` (default: a temp directory). Run pacing alone; do not infer device performance from concurrent tests or software timings. The documented current-production checks use an unpublished temporary combined tree, not a merge into production.
