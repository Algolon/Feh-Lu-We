# VEG-R01 — Vegetation LOD Quality & Continuity

- Branch: `veg-r01-vegetation-lod` (isolated worktree).
- Immutable parent: GEO-R01 `142bd7c7c30f258ccc239c844edee6d3a9f4d81b`; compare VEG-only changes against that commit.
- State: IN PROGRESS — baseline/A/B probes complete; hybrid and moving evidence next.
- FLW-PDI-01 v0.1 applied from the owner's project source read in this session. No repository AGENTS.md was found.
- Source video `82158.mp4` was not delivered and has not been inspected; independent normal-game routes are used.
- Production remains `fe74db0`; GEO/VFC/PB01 worktrees and branches are not modified.

## Confirmed mechanisms

- Tree-origin distance bands 16/26/48 m plus symmetric 3 m hysteresis mean approach upgrades near 13/23/45 m; initial state is xfar. This is not screen-size selection.
- Mid foliage changes sphere topology and drops fillers/secondary branches; far/xfar drop clusters. Broadleaf xfar retains about six outline clusters, enlarges some survivors, and removes all branches. Same procedural seed does not imply same rendered crown outline.
- Legacy trees use separate 26/42/105 m rules; current woodland uses TreeBatches, bushes retain existing ranges, ground plants already shrink near their cutoff.
- Fallback packing replaced growing scene roots, losing World.roomRegion references, and could set region-hidden meshes visible. Candidate paths preserve roots and regionOff; explicit baseline selector retains old behavior for comparison.

## Checkpoint validation

- Typecheck, build and 285 unit tests passed (including selection/hysteresis, near-model identity, finite geometry and fallback region/growth regression).
- First static comparison: `docs/veg-r01/probe/` (A 24/42/70, B 28/50/80 with mid/far continuity geometry). Normal screenshots, counters, geometry/instance estimates, separate high-shadow control.
- Hybrid under evaluation: 22/36/62, cheaper mid, identical far/xfar geometry (one fewer transition and fewer fallback geometry groups).
- Default remains baseline until selection. Prototypes selectable with `?veglod=baseline|a|b|hybrid`; fallback via `&multidraw=0`.

## Policy and next action

- Read PB01 at `faf5c5d0cb24a5338a4591afbd16ef63b4d3bb8c`: provisional 750k mobile-low camera triangles, unchanged 150 calls, device validation pending; relative guards remain independent. No policy or test limits changed.
- GEO conservatory costs are inherited, not charged to VEG. Record paired increments and new overshoots separately.
- Finish matched moving captures, camera/instance consistency, relative budget assessment and recommendation; if no candidate clears the acceptance gates, retain baseline and report the blocker.
- Commit/push only this branch; no merge or deployment authorized.

## Recovery checkpoint — 14 October 2026

Remote `5a6df26` and old local `b484ebc` have identical trees. Recovered additional uncommitted moving captures for all four profiles on both renderer paths, tests and packaging scripts without changing the original worktree. Independent working copy resumes the existing remote branch. Production inspected at `5af9779` (PB01/TUT-R01/SKY-C01 integrated). Fresh typecheck, 286 units and build pass. Default remains baseline; evidence assessment and current-production compatibility verification continue. See `docs/veg-r01/recovery/checkpoint.json`. No merge/deploy.

## Evidence milestone — recovery session

All four variants × both renderer paths are verified: 192 inherited static views, 3,200 matching moving samples; fresh first-ten-view counters reproduce exactly. Software rAF samples and regenerated geometric silhouette masks completed. Hybrid is preferred experimentally; baseline remains default because all candidates exceed independent relative budget guards and physical-device validation is pending. Matched video exports, measurements and assessment are saved with this checkpoint. Temporary current-production integration passes typecheck/build/289 units; DEV-04A browser run has 17 passes, one budget failure and one final navigation timeout. Additional integrated movement and the broader browser run remain in progress. No merge/deploy.
