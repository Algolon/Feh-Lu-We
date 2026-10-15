# EXT-R02 — Roof/facade finish and draw-call repair

Status: COMPLETE — implementation and recorded validation passed. Ready for owner review; not merged or deployed.
Branch: ext-r02-finish-performance.
Recovered baseline: remote EXT-R01 d31314fe9841ebf2280b6deab6d2c8f1401dccb0.

## Recovery

Workspace maintenance removed the previous local checkout. No remote R02 branch existed. EXT-R01 was re-cloned and its complete tree verified reachable. The interrupted R02 session had only produced a local profile; that file was not recovered and was explicitly regenerated.

Current production 6b8aa3d (released AC/beetle and dual-glass gravity-bong changes) was merged into this featurebranch. A single import conflict in grounds.ts was resolved by retaining both imports/implementations. No parallel work was overwritten or reset.

## Implementation

- Roof junctions: open profiled gutters, nearest-edge downpipe connectors, collars and brackets; profiled ridge/hip caps; sheet-metal dormer/chimney flashing.
- Chimneys are seated on the actual local roof surface and their exposed heights are proportioned to that roof plane. Existing main roof/attic envelope and observation window remain unchanged.
- Stone material: unequal block lengths, controlled warm/cool variation, a world-space perimeter wash with restrained window runoff and damp plinth.
- Low-quality opaque aggregation: shared-material meshes are packed into bounded vertex/index buffers. Each frame retains the normal source room/parent/layer/frustum decisions and moving transforms. Source objects are suppressed only during rendering and restored afterwards for gameplay/picking. High-quality shadow rendering, transparent materials, instanced vegetation and custom render callbacks keep their original rendering path.
- Aggregation has a 350,000-vertex allocation cap, skips sources above 24,000 vertices and falls back to normal rendering for replaced geometry/materials.
- Comparison controls: `?finish=base` disables R02 architectural finish/wash; `?batch=base` disables opaque aggregation.

## Final validation

- `npm run typecheck`, all 304 unit tests and `npm run build` passed. The existing bundle-size advisory remains.
- Eight paired 1280x720 views, portrait render, 27 moving camera/loop samples, approach route through the front entrance, 304 support-height samples and interaction registries passed.
- Same-frame aggregation on/off preserved triangle counts, picking and source visibility. Maximum changed-pixel fraction above RGB difference 4 was 0.089%; acceptance threshold 0.1%. This is approximate raster equivalence, not universal pixel identity.
- Six actual animated-door angles had zero changed pixels, identical triangles and picking. The normal collision-driven dry route around the conservatory passed all four waypoints. No WebGL errors.
- Low/high/low quality switches passed; high-quality shadow rendering uses the original unaggregated path.

| Low-quality view | Baseline calls | Final calls | Final camera triangles |
| --- | ---: | ---: | ---: |
| Garden | 169 | 108 | 441,472 |
| Conservatory | 208 | 144 | 449,088 |
| Arrival | 110 | 83 | 251,253 |
| Roof overview | 103 | 80 | 257,858 |
| East | 146 | 98 | 408,291 |

All eight static samples met 150 draw calls / 750,000 camera triangles. Moving samples peaked at 136 calls and 458,076 triangles. Roof finish adds 7,448 triangles in the paired views; aggregation itself adds no rendered triangles. These are measured camera samples, not a guarantee for every world position.

## Resources and limits

Seven aggregates pack 272 sources / 349,977 vertices. Additional aggregate attribute/index buffers total 16,798,896 bytes, with CPU and GPU copies; the facade wash texture is approximately 0.5 MiB plus mipmaps. This trades memory for fewer draw calls. Physical-phone FPS, heat and memory capacity remain unmeasured; software WebGL counters are not device validation.

Build: `dist/assets/index-BjpaT72I.js`, SHA-256 `b95b8cededed9a75cd76b3cfc318f68abfabfb009082986257b47a3258f578a0`.

## Evidence and checkpoint

- Reproducible scripts: `scripts/ext-r02-profile.mjs`, `scripts/ext-r02-validate.mjs`, `scripts/ext-r02-motion.mjs`.
- Final evidence: `ext-r02/qa/results.json`, `motion.json`, incremental `checkpoint.json`, paired `base-*` / `finish-*` screenshots and `finish-portrait.jpg`.
- The earlier `before/` and `after-profile/` directories are retained as recovery/provisional evidence; final acceptance uses `qa/`.
- Initial durable R02 commit: `a37a1528f65ac5a134fbd9bd48235136da98d8eb`, tree `2820dcf33efa7f8512921a4e14bd70197820d650`, on `ext-r02-finish-performance`. Final commit follows it on that same remote branch and contains this report and final QA. Local and API-created commit hashes may differ; tree equality is verified after fetching.
- Production advanced independently to `6c57ced` (gravity-bong scale/smoke) during validation. That parallel change is preserved on the default branch and is not included in these measurements. No production ref was changed.

Exact next step: owner visual review of the feature branch and final screenshots. Before an authorized merge/release, integrate any later production changes and repeat affected checks; then perform a real-phone FPS/memory check. No merge or deployment has been performed.
