# VEG-R02 — regenerated recovery evidence

Source recovered from original session edits on historical base `752cb02`. These images and measurements were regenerated locally on macOS; the original binary evidence and Git objects were not recovered. Platform/render visibility differences mean historical pixel identity is not claimed.

Fresh checks: typecheck, all 301 unit tests, four budget-policy tests and production build pass. The existing bundle-size warning remains.

## Fresh visual and runtime checks

The studio renders all 74 baseline/reference model records (12 trees + 6 bushes + 19 plants per style), plus formal garden greenery and timber. The game matrix contains 40 records: seven outdoor poses, four lighting phases, high-quality shadow control, baseline/full style and both rendering paths. No page exceptions, console errors, shader failures or WebGL errors were recorded.

Low-quality paired views/phases have identical camera-triangle counts across rendering paths. Baseline/full placement inventories and counts match exactly. Four 15-position approach/retreat sweeps have matching triangle counts between paths.

| View | Recovered triangles | Change from baseline | Calls multi / fallback |
| --- | ---: | ---: | ---: |
| birch | 146,728 | -3.89% | 14 / 67 |
| garden | 185,506 | +35.39% | 25 / 54 |
| dense | 309,354 | +13.09% | 59 / 119 |
| boslust | 352,054 | +12.83% | 91 / 139 |
| forecourt | 256,614 | +18.98% | 96 / 109 |
| lake | 126,490 | +14.72% | 23 / 60 |
| woodland-east | 262,650 | +11.61% | 38 / 102 |

All seven sampled low-quality outdoor views fit the 150-call / 750k limits. The garden increase of 35.39% still warrants relative-growth and physical-device review; passing the absolute ceiling does not waive those concerns. No budget thresholds were changed. This fresh run does not include the historical conservatory stress matrix, so it does not establish that the inherited failures are resolved.

Images retain readable forest paths and the BOSLUST sign in sampled views. No full puzzle-route walkthrough or physical-device FPS/heat/shimmer validation is claimed. Current default-branch updates have not been integrated into the historical recovery base.

## Reproduce

Set `CHROMIUM_EXECUTABLE_PATH` to a local Chromium executable, then run `node scripts/veg-r02-all-review.mjs`. Optional modes: `GALLERY_ONLY=1`, `NO_GALLERY=1`, `PORTRAIT_ONLY=1`, `STRESS_ONLY=1`; run sequentially because they share port 5193.

## Fresh portrait checks

412×915 forest, BOSLUST and forecourt views plus a shadow control: eight records across both rendering paths, no registered page/shader/WebGL errors and matching low-quality camera triangles. Two additional 15-position sweeps also match across paths. Screenshots and measurements are in `portrait/`.
