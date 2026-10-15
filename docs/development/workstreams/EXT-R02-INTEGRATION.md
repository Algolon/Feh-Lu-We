# EXT-R02 production integration — 2026-10-15

Prepared now on owner instruction, ahead of Mushroom Grove production release. No production branch or deployment changed.

- Exterior source: `205fddffd3196b8992e7a5bf371bffa6eae13ba0`, verified tree `92653db410946c37914e7f026e8378e3d79707a6`.
- Production source: `6c57cedf70bae846401f987b7029e3b04ccc7c9c`. Clean merge preserves gravity-bong scale and smoke changes.
- Integration branch: `ext-r02-production-integration`.
- Separate compatibility branch: `ext-r02-mushroom-compat`, combining this integration with Mushroom test branch `933502fb3369c19cf7bebded83ad01f472a2aa9f`. Clean automatic merge, no conflict resolutions or source changes required. This is a test combination, not a release of Mushroom Grove.

## Verified on current production + exterior

Typecheck, 304 tests and build passed. All checks in `scripts/ext-r02-validate.mjs` passed: eight paired exterior views, portrait, 27 motion samples, entrance walking, support heights, registries, picking, visibility and quality switches. Garden 108 draw calls / 441,472 triangles; conservatory 144 / 449,740. Pixel mismatch within 0.1% acceptance threshold. Six actual moving-door samples have identical pixels, picking and triangle counts; four conservatory waypoints reached. No WebGL errors.

Evidence: `ext-r02/integration-qa/`, including paired exterior screenshots, `results.json`, `motion.json`.

## Verified on separate Mushroom test combination

Typecheck, 308 tests and build passed. Walk into/out of the grove reaches intensity 0.999997 and restores to 0, with progression unchanged. Audio runs and mutes, reduced-motion controls work, WebGL context recovery works. Four same-frame post-processing comparisons with batching on/off have zero changed pixels, equal triangle counts and identical picking. Return view drops from 127 to 99 draw calls; other grove views 22–26. No WebGL errors.

Evidence copied here as `mushroom-lifecycle.json` and `mushroom-batch-equivalence.json`. Reproduction uses `CHECKS=1 node scripts/mushroom-qa.mjs` and `node scripts/ext-r02-mushroom-compat.mjs` on the compatibility branch. Mushroom instanced geometry, custom glow attributes, transparent pools and spores retain their original rendering path.

## Release checkpoint

Integration is prepared and validated. Production remains untouched while Mushroom Grove is still on its test branch. The previously authorized conditional release may proceed once its production integration and deployment are confirmed; fetch again, integrate any newer production changes and repeat affected checks before releasing. The separate compatibility check covers only the Mushroom SHA above; later area/intensity iterations need a new comparison. Physical-phone FPS/memory remains unmeasured. Existing bundle-size advisory remains.
