# VEG-R01 — recovery and completion

- State: **COMPLETE comparison; owner-authorized Hybrid activation for live testing. Device/full-browser limitations remain documented.**
- Branch: `veg-r01-vegetation-lod`; no existing PR found.
- Baseline: GEO-R01 `142bd7c`. Remote recovery: `5a6df26`; recovery checkpoint `95a7216`; durable evidence checkpoint `f3f60f6`.
- Default: **Hybrid**, activated following the owner's explicit merge/deploy instruction. Baseline remains selectable. See `docs/veg-r01/ACTIVATION.md`.
- Motion/browser evidence uses production `5af9779` (PB01, TUT-R01, SKY-C01). Final production tip `3a12a69` adds TUT-R02 `ab8541a`; its home-scene files are disjoint. Latest temporary integration also passes typecheck/build and 289/289 units.

## Confirmed complete

Recovered original work without editing the original worktrees. Old local `b484ebc` and remote `5a6df26` have identical trees. Retained A/B/Hybrid prototypes and the baseline selector; preserved eight moving review videos, measurements, source hashes and reproducible assessment scripts. Corrected a misleading shared-skeleton/silhouette comment. No new visual variant or budget relaxation was introduced during recovery.

192 inherited static views / 3,200 matched moving samples verified across all variants and both paths. Fresh 80 static samples reproduce counts exactly. Geometric outline diagnostics regenerated. Eight software rAF probes completed, with explicit non-device limitations. Additional temporary production+VEG replay completes 40 static views / 1,600 moving samples; paired renderer paths agree and camera trajectories match. Different pre-route view history is documented.

## Decision

Hybrid removes far/xfar geometry changes and has 146 diagnostic changes versus baseline 234, but moving triangle growth is median +29.7%, maximum +38.5%. All candidates exceed independent relative review guards. All sampled candidates fit PB01 750k, but inherited draw-call overshoots remain; A/B add a new static fallback crossing at BOSLUST. Retain baseline because no candidate clears all acceptance requirements. Measured counts, visual judgments and assumptions are separated in `docs/veg-r01/REPORT.md`.

## Validation

- Branch typecheck/build and 286/286 units pass; temporary production integration typecheck/build and 289/289 units pass. Existing bundle warning retained.
- DEV-04A browser: 17/19; inherited budget failure and final navigation timeout.
- BOSLUST browser: 13/14; navigation timeout leaves later sample subchecks unverified.
- Optional broad browser run stopped after 18 completed passing checks; no complete-suite or walkthrough pass claimed.
- Actual normal-game replay/static matrix: no page errors; WebGL2 fallback without multi-draw exercised; current paired moving triangle parity holds.
- Physical Samsung FPS, sustained pacing, heat and near-ceiling capacity: **NOT TESTED**. SwiftShader timings are not mobile performance claims.
- Detailed evidence and limitations: `docs/veg-r01/recovery/CLOSEOUT.json`.

## Dependencies and next safe action

No text conflicts with final production `3a12a69`; PB01's shared comment and VEG diagnostics coexist. Temporary compatibility worktree only; no production changes. GEO-R01 remains an inherited integration dependency requiring its own review. Other work packages were not modified. No force-push, production merge or deployment.

The owner subsequently authorized **merge and deployment for live testing** after receiving the comparison, costs and limitations. Hybrid default passes latest-production typecheck/build/289 units and six bounded normal-render checks across both renderer paths. Physical Samsung and wider browser validation are still pending; this activation does not relax budget assertions.

## Publication

Owner-authorized Hybrid activation merged through PR #22 as `7d17d97`. GitHub Pages build and deploy completed successfully (run 38622704698); the live JavaScript build label and fingerprint were verified. Publication evidence is under `docs/veg-r01/activation/`. Physical-device validation remains pending.
