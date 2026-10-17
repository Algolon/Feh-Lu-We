# LIGHT-R06 — State-bound base lighting (architectural pilot)

**Status: REVIEW-ONLY. No merge, no production rollout.**  
**Branch:** `lighting/r06-state-bound-living-pilot` (based on production `e0cddfa`)  
**Predecessor:** LIGHT-R05 PR #101 / issue #98. The earlier candidate is not required by, or merged into, this pilot.

## Owner contract

> A light source that is logically on illuminates its authored surroundings even if the player is elsewhere, looking away, or walking through a doorway. Viewer-based selection and light-pool availability must never determine whether an on-source contributes.

The implementation is a limited prototype, NOT yet a finished baked lightmap pipeline.

## Root cause and choice

Existing gameplay lights retain their visual on/off state and source-bound `LightPatches`, but only 3 mobile or 4 high-quality dynamic `THREE.PointLight` slots genuinely illuminate surfaces. Position/direction prewarming in LIGHT-R05 reduces but cannot remove light-slot scarcity. Independently, global indoor/ambient parameters and room geometry culling can create brightness changes.

This pilot tests architecture **B: fixed spatial surface contribution bound ONLY to light state**, with room/zone masking. It does not use `chooseLamps`, camera gaze or velocity for the fireplace and floor lamp. The pilot leaves the global LightPool untouched for every other fixture.

## How it works

- New `src/world/stableLighting.ts` implements a bounded world-space illumination mask in the **existing shared material shader**, with two authored source records. No added surface geometry or new `THREE.Light` instances.
- The pilot is explicitly opt-in via `?stableLiving=1` (best combined with the existing isolated `?review=living`). Normal production URLs do not enable any of its shader/material/pool changes.
- The sources `fire.living` and `lamp.livingFloor` are removed from `LightPool` allocation **only when pilot enabled**, so the shader is the sole base illumination from these two sources. Their flame/shade visuals, existing floor patches, sound and interactions still work.
- `World.onSync` sets each uniform's strength based on the source's actual `on()` callback (save-state `lit` or default state). Changing the camera or player pose changes neither uniform.
- `?stableLiving=1&noPoint=1` is a strict ablation: **zero pool-provided point-light illumination anywhere**, so one can verify that a logically lit fireplace/floor lamp still illuminates the local room via materials. The rest of the mansion will be underlit: intentionally not a release mode.
- Material spatial mask is scoped to the lower-floor living-room rectangle and height. The current shader computes an analytic falloff once per fragment; this is *not* a generated UV2 atlas or mathematically baked GI. It is a proof of the correct runtime dependency (state → surface brightness) without geometry/draw-call cost. It cannot yet simulate all indirect occlusion or lights propagating through archways.

## Architectural trade-offs

| Design | Positive | Risk / effort |
|---|---|---|
| Existing dynamic LightPool (A) | Very few shaders/sources | 3 slots cannot represent every lit room; apparent on/off transitions |
| State-bound world-space source mask (pilot B) | Camera/velocity-independent, shared materials, no geometry/call increase | Per-pixel shader cost on opt-in materials; authored room boundaries; not true occlusion or pre-baking |
| Per-source baked surface lightmaps (target B2) | Fully artist-authorable occlusion and steady on/off contributions | UV2 generation, extra atlas/texture bandwidth, multi-source storage/blending, proper batching compatibility |
| Hybrid state-bound base + small real-time accents (C) | Stable interiors plus living fire flicker/flashlight realism | Budget extra realtime effects, avoid double lighting and source slot contention |

## Rollout architecture after pilot approval

1. Define a `RoomLightProfile` inventory: source ID, default/on callback, room ownership, radius, color, affected surfaces, occluders and door policy. Never key relevance on camera position.
2. Bake or author **static spatial light contribution masks** for walls/floors/furniture using existing geometry; support separately togglable sources. Prioritize a small texture atlas per room or per-vertex baked contribution if UV2 cost proves prohibitive.
3. Scope material shaders per interior room/chunk rather than patching every estate material. Leave unlit exterior and unrelated rooms on their current programs, to avoid per-fragment cost across an entire outdoor world.
4. For portals, use geometry visibility and authored transfer samples. If an open arch connects hall/living, fixed light contributions should be consistent on shared visible surfaces. Closed opaque doors must not show light leakage.
5. Keep truly changing effects (torch, fire flicker, special events) as limited realtime lighting over the always-present base contribution. No slot-based activation for fundamental room illumination.
6. Decouple the environment's current **viewer-driven indoor factor** from world-space room materials, if test evidence shows environment transitions cause lighting changes while fixed sources are stable.
7. Add regression probes at named **fixed world surfaces** plus movement/switch/save/reload, prevent transitions/camera gaze from changing the contributions of active sources.
8. Benchmark on Android Low and High: real FPS, thermal, shader GPU cost, calls/triangles and shader variants. Surface emission can saturate existing painted materials; tune carefully with approved art anchors.

## Quality requirements before adoption

- Fireplace on/floor lamp off; off/on; both on; both off: **each independently changes only its authored contribution**.
- With all 3/4 pool lights disabled, a logically lit living fixture still lights walls/floor/furniture.
- Same world surface, same save/light phase and source state: luminance invariant under camera rotation/translation (apart from perspective, exposure/tone mapping and occlusion).
- Transition hall ↔ living must not change source uniforms; no cross-wall leakage into library, upper floors or outdoors.
- Image comparison checks ambience, directionality and saturation; do not accept a flat orange wash simply because ROI luminance increased.
- Identical baseline/pilot calls/triangles expected. Distinct material shader work requires actual GPU benchmarking before any widespread rollout.
- The pilot is **not** ready to deploy or merge from a green CI alone. Owner approval of visual art treatment comes first.

## Reviewer controls

- `?review=living&stableLiving=1`: isolated living-room preview with state-bound fireplace/floorlamp and all other light slots unchanged.
- `?review=living&stableLiving=1&noPoint=1`: light-pool-off proof; the two stable contributions remain.
- Without `stableLiving=1`, everything is identical to production.

**No release authorization is implied by this prototype.**
