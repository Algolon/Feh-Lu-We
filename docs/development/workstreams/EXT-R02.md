# EXT-R02 — Roof/facade finish and draw-call repair

Status: IMPLEMENTED CHECKPOINT; final browser/visual/movement validation in progress. Not merged or deployed.
Branch: ext-r02-finish-performance.
Recovered baseline: remote EXT-R01 d31314fe9841ebf2280b6deab6d2c8f1401dccb0.

## Recovery

Workspace maintenance removed the previous local checkout. No remote R02 branch existed. EXT-R01 was re-cloned and its complete tree verified reachable. The interrupted R02 session had only produced a local profile; that file was not recovered and was explicitly regenerated.

Current production 6b8aa3d (released AC/beetle and dual-glass gravity-bong changes) was merged into this featurebranch. A single import conflict in grounds.ts was resolved by retaining both imports/implementations. No parallel work was overwritten or reset.

## Implementation checkpoint

- Roof junctions: open profiled gutters, nearest-edge downpipe connectors, collars and brackets; profiled ridge/hip caps; sheet-metal dormer/chimney flashing.
- Chimneys are seated on the actual local roof surface and their exposed heights are proportioned to that roof plane. Existing main roof/attic envelope and observation window remain unchanged.
- Stone material: unequal block lengths, controlled warm/cool variation, a world-space perimeter wash with restrained window runoff and damp plinth.
- Low-quality opaque aggregation: shared-material meshes are packed into bounded vertex/index buffers. Each frame retains the normal source room/parent/layer/frustum decisions and moving transforms. Source objects are suppressed only during rendering and restored afterwards for gameplay/picking. High-quality shadow rendering, transparent materials, instanced vegetation and custom render callbacks keep their original rendering path.
- Aggregation has a 350,000-vertex allocation cap, skips sources above 24,000 vertices and falls back to normal rendering for replaced geometry/materials.
- Comparison controls: `?finish=base` disables R02 architectural finish/wash; `?batch=base` disables opaque aggregation.

## Verified so far

- Typecheck passed; 304 unit tests passed, including render-only visibility restoration, nested visibility, moving transforms, replaced geometry, vertex-colour changes and quality switching.
- Production build passed, retaining the existing bundle-size advisory.
- Regenerated current baseline: garden 169 calls / 434,024 triangles; conservatory 208 / 441,640.
- First candidate profile (before the final material refinement): garden 108 calls / 441,472 triangles; conservatory 144 / 449,088. These are provisional measurements, not the final acceptance result.

## Remaining exact next steps

1. Render final finish and visually inspect roof junctions, chimney silhouette and facade ageing.
2. Compare aggregation on/off at identical frozen frames to prove pixel, triangle and picking equivalence.
3. Sweep camera/movement around garden and conservatory, exercise doors and low/high switching; check 150 calls / 750k camera triangles.
4. Re-run appropriate checks after any corrections. Record final screenshots, resource cost and results; update this document and save a verified remote checkpoint.

Physical-phone FPS, heat and GPU-memory capacity remain unmeasured; software WebGL counters are not device validation.
