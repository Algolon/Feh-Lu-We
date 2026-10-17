# LIGHT-R06B — Scoped, state-bound lighting architecture review

**Status: CANDIDATE / draft PR #110 / NO PRODUCTION MERGE.**  
**Branch:** `lighting/r06b-room-scoped-pilot`, forked from production `deb20ec`.  
**Predecessor:** LIGHT-R06 PR #107 (global-material shader pilot), not merged.  
**Original issue:** #98 (LIGHT-R05).

## Behavioural contract

For the living fireplace `fire.living` and standing lamp `lamp.livingFloor`, their authored **base** light contribution is always attached to the source's logical on/off state. Player location, gaze, walking velocity, room entry and the shared 3/4 `THREE.PointLight` slots do **not** determine whether these two sources illuminate their authored surfaces.

All unrelated fixtures retain the existing production behaviour until their own source-bound masks exist. Normal URLs leave production rendering unchanged; pilot needs `?stableLiving=1`.

### What changed since LIGHT-R06A

1. **Scoped instead of global shader extension.** The original pilot installed its lighting formula in `surface()`, causing even vegetation/exterior/ground materials to carry it. R06B clones only eligible *interior* existing MeshLambert/Phong/Standard materials touching the living region: authored `mLiv`, intersecting `mIn`, and the shell's inner plaster (`manor`). Unrelated meshes continue using their unchanged shared shaders.
2. **Architecturally aligned mask.** The old mask faded over approximately a metre near both ends of the living room, making the fireplace's own west wall artificially dark. The new soft but narrow boundaries follow the living-side faces of x=85 / z=94 partition walls, exterior sides, floor and ceiling. No illumination on the other side of the hall partition, library wall, outdoors, upper floor or basement.
3. **Shader correctness QA.** Three.js material clones did not preserve the nonstandard `FLW_SURFACE` shader define. The first browser run caught this via actual WebGL compilation errors (`vFlwP` undeclared). `cloneSurfaceWithDefines()` now explicitly preserves profile defines, with a regression unit test; recent full browser QA compiles cleanly.
4. **Calibrated artistically.** Reduced fireplace/floor strengths from `0.19/0.13` to `0.14/0.10` to preserve fireplace stone detail and room contrast.
5. **Less fragment work.** Scoped lighting now applies to substantial `plaster, timber, stone, fabric` geometry only, not little painted/metallic ornaments.

## Evidence — final calibrated scope (full Actions browser run)

Actual estate screenshots, zero pooled dynamic PointLights for BOTH baseline and R06B, fixed time and source states, via `scripts/light-r06-stable-qa.mjs`.

| Parameter | Baseline | LIGHT-R06B | Delta |
|---|---:|---:|---:|
| Meshes running new material shader | 0 | 11 | +11 |
| Custom material clones | 0 | 7 | +7 |
| Other mesh materials unchanged | All | 1,012 | no broad shader patch |
| Additional shader variants, Low (sample view) | 114 | 122 | +8 |
| Draw calls, Low hallway-looking-into-living initial sample | 88 | 93 | **+5** |
| Draw calls, Low living close | 80 | 85 | **+5** |
| Draw calls, High portrait living close | 221 | 221 | 0 |
| Tris across corresponding poses | identical | identical | 0 |
| All 3/4 pooled point light contributions in A/B | forced zero | forced zero | compare source-bound base only |

**Known cost:** +5 Low draw calls around living and 8 new GPU program variants remain. They are not hidden by a green build. A proper per-region atlas or geometry merge-compatible shader strategy could reduce costs further. High-quality render already exceeds the provisional 150-call and 750k-triangle budget in baseline; do not treat those inherited overruns as introduced by R06B.

### No-spill matched-camera validation

On/off differences (8-bit middle-ROI units, identical camera and disabled pooled PointLights):

| Place | LIGHT-R06B on-minus-off |
|---|---:|
| Hall looking away from fireplace | 0.000 |
| Library behind closed door | 0.000 |
| Library looking away | 0.000 |
| Upstairs guest room | 0.000 |
| Outside front | -0.073 (baseline also changes slightly due independent simulation effects) |
| Kitchen looking away | 0.185 (baseline has comparable variation) |

These measurements indicate no visible lighting spill *at these tested poses*; they do NOT replace occlusion-aware lightmaps and cannot prove zero spill from every corner or doorway.

### Separately toggled light state

- Fire off / floor off: [0, 0]
- Fire on / floor off: [0.14, 0]
- Fire off / floor on: [0, 0.10]
- Both on: [0.14, 0.10]

Saved status survives reload; stationary camera rotation changes neither source's base light strength. Screenshot and unit tests assert these properties. The point-light budget stays at 3 Low / 4 High, but these two sources never request a pool slot while pilot is enabled.

## Technical debts / do NOT roll out estate-wide yet

1. **Not a full baked-GI lightmap.** The mask is an analytic world-space emissive contribution, without true baked furniture shadows and indirect occlusion. Light is clamped to the room rectangle. Source-to-surface shading is stylized rather than physically correct.
2. **Room-level fragment work.** `mIn` remains a coarse merged structural chunk. Even with clipped material selection, some distant indoor fragments execute a cheap room-mask early-out. A per-room static mask atlas or UV2 authoring would eliminate this.
3. **The player's global interior ambient blend still exists.** The environment uses an `indoor` scalar based on the **player's** current room, so appearance can still shift at thresholds independently of these two stable fixtures. Treat that as a distinct world-space environment architecture workstream.
4. **No hardware GPU timings.** SwiftShader-based CI can confirm correctness, calls and triangles, but it does not confirm acceptable Samsung/Android frame time, thermals or shader bandwidth.
5. **Artwork approval outstanding.** The warmer west wall and hearth surround require owner review against agreed woodland-manor treatment. No automatic approval merely because source state is now correct.
6. **Other lamps still use LightPool.** This pilot is not a fix to every room, nor should it be represented as one.

## Reviewer commands

- Normal game (identical to production): `/Feh-Lu-We/`
- Review-only scoped light layer: `?review=living&stableLiving=1`
- Crucial independent proof without any pooled pointlights: `?review=living&stableLiving=1&noPoint=1`

The draft PR is **not published** as a separate GitHub Pages environment; the links above describe parameters for a local preview build of the review branch, not deployment to the public Pages URL.

## Release gate

Before any merge: owner approves original vs R06B before/after screenshots, the remaining +5 Low draw calls and GPU material variant cost are benchmarked on actual Android, and a broader lightmap/occlusion model and the independent player-driven ambient transition issue are planned.

**Recommended next engineering phase:** R07 plan/experiment for room-local authored per-source lightmap masks plus decoupling global sky/fill from the player's current room — neither should revive gaze/position-based lamp activation.

No production merge or deploy authorized.
