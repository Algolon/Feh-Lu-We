# LIGHT-R07 — World-space Environment Independence: findings and implementation decision

**Status:** diagnosis and architecture design, not a production fix.  
**Source branches:** current production `ccr-75ef4113-kfkimm` and review-only LIGHT-R06B PR #110.  
**Tracked incident:** #98.  
**Comparison workflow:** [39049847951](https://github.com/Algolon/Feh-Lu-We/actions/runs/39049847951).

## Why LIGHT-R06B alone cannot solve every lighting transition

LIGHT-R06B proves that `fire.living` and `lamp.livingFloor` can light their authored surfaces **solely according to their logical on/off state**, without sharing 3/4 pool-provided dynamic point lights. But the ordinary game still uses **one** scene-wide `THREE.DirectionalLight`, `THREE.HemisphereLight`, and `THREE.Fog`. Their globally shared settings depend on **where the player currently stands**:

- `src/core/game.ts`: every tick `indoor += ((hereRoom !== 'out' ? 1 : 0) - indoor) * min(1, dt * 2.5)`, then calls `extras.env.update(dusk, camera.position, indoor)`.
- `src/world/env.ts`: the player-derived `indoor` parameter affects sun intensity, hemisphere intensity/colours, fog near/far, woodland blend and some fixture gains.

**This is global state, not surface/room lighting.** The same wall can therefore be shaded differently because the player crossed an **outdoor** doorway, even if the camera, geometry and all real light-source states are unchanged. LIGHT-R06B never modified this global environment logic.

### Confirmed causal isolation

The actual game was rendered 12 times at six *identical fixed camera positions* and two time phases, with each camera and world view held fixed. All pooled point-light contributions were suppressed, and only the `indoor` argument of `env.update()` changed between 0 (outdoor treatment) and 1 (interior treatment). The same test passed on the production snapshot and the R06B review branch (with its prototype disabled on ordinary URLs), with zero browser/WebGL errors.

| Camera view | Mean absolute ROI change at daylight (8-bit) | At dusk phase 0.65 |
|---|---:|---:|
| Hall facing living | 25.23 | 20.62 |
| Living middle | 24.73 | 21.87 |
| Hall facing dining | 21.33 | 14.65 |
| Kitchen | 24.91 | 19.99 |
| Library | 28.24 | 26.50 |
| Outside front | 24.99 | 19.84 |

These are **artificial endpoint A/B differences**, not measured one-frame gameplay threshold jumps. The actual `indoor` scalar is smoothed over time. It is incorrect to describe these numbers as changes on a single step or to attribute every hall↔living pop to indoor/outdoor logic.

Daylight `sun.intensity` switches from 2.1 → 1.05 and `hemi.intensity` from 1.7 → 1.054 when the indoor factor changes from 0 → 1; fog also switches from near/far [16,165] to [40,220]. At phase 0.65 the sun is already zero, but hemisphere changes from approximately 1.997 to 1.238, proving the issue survives in dusk/night ambient.

**New hypothesis to verify:** if a path between two indoor rooms has momentary `RoomGraph.roomAt()` = `out` due doorway gaps, the global light factor might change even on an interior-only route. The diagnostic now records room classifications at ~0.1 m increments along hall→living, dining→kitchen, two hall→library legs, living→library and outdoor→hall; do not infer this without these measurements.

## Architecture decision for subsequent implementation

**Adopt a world-space lighting model, rather than changing scene lights based on the player.**

1. **World environment** (`sun, sky, haze, phase`) is derived from game time/phase and authored world/biome settings. Its state is not a function of `hereRoom`, camera look direction, player movement or a LightPool slot.
2. **Static architecture light response** is authored separately on the world surfaces. Indoor surfaces must have their own **low-frequency sky bounce, sun exclusion/occlusion and per-source local illumination**, independent of viewer position.
3. **Lamp/fires** use logical on/off only for steady base light (R06B approach). Fire flicker, held flashlight and optional effects can use limited dynamic lights **on top**, never as the sole contribution from an on-source.
4. **Room boundaries and portals** determine which *surface receives light*, not whether a source starts existing. A shut opaque door blocks transmitted light; an open arch allows a view of already-lit adjacent walls. Glass is governed by its actual physical openings.
5. **No fake universal indoor parameter.** Removing the `indoor` parameter or setting it globally to 0 today would restore full outdoor sun to unshadowed interior surfaces on Low, making the entire mansion incorrectly bright. Setting it globally to 1 would darken the outdoor estate. Neither is a valid fix.
6. **No broad material shader patch.** R06B reduced its affected geometry to 11 meshes and 7 cloned materials; it still costs ~5 extra Low draw calls and ~8 extra program variants. A production-grade per-room technique must benchmark this cost and avoid scaling linearly with number of rooms.
7. **Prefer authored/baked shading data** for low-frequency static room fill and shadowing (lightmaps where UV2 and aggregation support them; otherwise bounded per-region world-space masks). The present `OpaqueBatches` aggregator accepts only position/normal/UV/color, so a UV2 lightmap rollout requires an explicit batching/attribute plan and texture bandwidth measurement.

## Next bounded implementation package: LIGHT-R07B

**Do not combine this with vegetation, stairs, windows or unrelated art.**

A. Prepare matched fixed-surface test anchors at the living west fireplace wall, floor near hearth, the arch seen from hall, wall on kitchen side of dining arch, closed library wall, and outdoor facade. Each anchor has a real world coordinate and surface material; record screen-space projections only when actually visible.

B. In a review-only mode on a fresh current-production branch, freeze `sun/hemi/fog` from world time (not player) and supply a **surface-local interior response** for two prototype connected spaces, hall + living. Do not use globally unattenuated sun on indoor walls. Test day and dusk, within and through the open arch, front door open/closed, and window views.

C. Preserve fixture interactions and game saves, use source-bound base masks for fire and floor lamp, and never require a camera-based slot allocation for a steady light source.

D. Require on/off and passage A/B, one-way/reverse/stationary 360, renderer calls/tris/program variants, matched fixed-surface brightness, and independent pixel screenshots on Low/High; record all WebGL compilation errors. Comparisons must be against **the latest** production HEAD at review time.

E. Require a real Android GPU-frame/FPS/thermal pass. SwiftShader gives correctness and geometry/draw-call counts, not actual mobile shader cost.

**Release gate:** no merge/deploy until visual treatment, perf and closed-door/no-leak invariants are accepted. PR #110 remains the reference, not an approved production release.
