# VEG-R04 — shrubs and sculpted dead wood

Continuation after approval of the beech relief (`7fa286d`). This review step focuses on the two shrub families, fallen logs, small broken branches and cut stumps. Ground plants and grass are the next art pass.

## Art changes

- **Hazel:** all three variants retain their loose multi-stem habit, with smoother stems, rounder/wider foliage groups and coherent fresh, deep and muted warm-green palettes.
- **Holly:** all three variants have fuller compact foliage groups with their own pointed leaf silhouettes. Evergreen green palettes stay distinct from hazel; the existing red berries remain near details.
- **Logs:** denser longitudinal/radial geometry with stronger broad bark ridges, averaged UV seam normals and finer growth-aligned bump relief. Original lengths, seed streams, placement and collision definitions are retained. The outline becomes slightly more irregular, so this is not a claim of identical silhouettes.
- **Cut stumps:** more irregular closed cut rims, broad bark flutes, subtly recessed growth-ring grooves and lighter cut wood. The lower ground footprint is retained; upper surface detail changes. Existing axe/puzzle placement code is not edited.
- **Small branches:** the same closed log construction at proportionate scale, with all three existing variants retained.

The wood relief uses its own UV marker (28), so it does not change the approved oak/pine/birch/beech relief. The material remains one shared tree batch material. The existing oak bark sampler is reused for timber colour; fine bump relief follows the timber axis. Unresolved fine patterns are filtered. Cut surfaces are generated from the body's exact end rings and retain closure; groove recesses are limited to inner rings.

`hazel-compare.jpg`, `holly-compare.jpg`: previous left/new right. `*-palettes.jpg`: all three current variants. `stumps-compare.jpg`, `logs-compare.jpg` and `branches-compare.jpg` compare actual generated geometry. These studio examples are representative assets, not additional scene placements.

## Runtime selection

Opt-in: `?vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r04`. Omit `vegdetail` to review the previous shrub/timber stage with all accepted trees. Append `&multidraw=0` for instanced fallback. The default recovered style is unchanged. This remains a local review branch on the historical recovery base; later production-branch changes have not been integrated or deployed.

## Fresh validation

Typecheck, 308 unit tests, four unchanged budget-policy tests and production build pass. Existing bundle-size warning remains. The new tests cover all shrub variants, finite bounded crowns, stable mid/far foliage, and closed/outward-wound positive-volume logs, stubs, branches and stumps including the recessed cuts.

Twenty game records: four low-quality outdoor poses plus a sun-shadow control × previous/new × multi-draw/instanced. No recorded page exceptions, console errors, shader failures or WebGL errors. Placement inventories match exactly. Low-quality camera triangle counts match between render paths.

| View | Previous triangles | New triangles | Change | Calls multi / fallback |
| --- | ---: | ---: | ---: | ---: |
| dense | 398,430 | 433,692 | +8.85% | 59 / 119 |
| garden | 213,554 | 241,436 | +13.06% | 25 / 52 |
| boslust | 424,298 | 453,690 | +6.93% | 91 / 138 |
| woodland-east | 348,032 | 391,168 | +12.39% | 38 / 102 |

All four sampled low-quality views fit the existing 150-call / 750k ceiling. No thresholds were changed. High-quality totals include shadow passes and are not low-quality camera-budget counts. Wider alpha foliage and relief add work; physical-phone frame pacing, heat and shimmer have not been measured. No new portrait or full puzzle-route walkthrough is claimed. The sampled BOSLUST sign remains readable.

## Reproduce

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/veg-r04-review.mjs` uses local port 5196. `GALLERY_ONLY=1` limits the run to model views. `validation.json` records current source hashes and checks.
