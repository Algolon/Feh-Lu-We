# VEG-R05 — ground plants and grass

Local review stage following the accepted R04 shrubs/timber and R03 trees. All six ground-cover families and all 19 existing variants are included. These are screenshots of the actual generated Three.js models and materials, without generated replacement artwork.

## Art changes

| Family | Variants | Changes |
| --- | ---: | --- |
| Fern | 3 | Eight pairs of folded pinnae around a narrower central frond, broader feathered outline and coherent greens. |
| Grass | 4 | Three curved sections folded along each blade's midrib; green, deep green, muted straw/ochre seed grass and broad-leaved green clumps. |
| Bilberry | 3 | Broader six-point leaves with raised midribs; closed faceted blue berries replace pointed fruit cones. |
| Foxglove | 3 | Fuller basal leaves and hanging flowers with curved bell profiles and narrower lips. Natural purple flowers retained. |
| Lily-of-the-valley | 3 | Wider curved leaves with additional longitudinal sampling and rounded hanging white bells. |
| Wood anemone | 3 | Folded six-point leaves and cream-white petals with warm yellow centres; no pink leaf palette. |

Foliage stays predominantly green. Warm straw tones belong to seed grass; purple is confined to the existing foxglove flowers, and blue to bilberries. Colour is vertex-authored and still receives the existing scene-instance tint and lighting. Models retain intentionally faceted silhouettes. Placement, random streams for scene generation, count, batch/range-fade integration and collision code are unchanged. Grass mesh cost doubles; detailed flowers have more sides along their length. No texture samplers, alpha layers or draw calls were added.

`*-compare.jpg`: old models in the front row, new in the back row, all variants under identical lighting. `*-variants.jpg`: all new variants. `*-closeup.jpg`: first variant alone, for detail inspection. Studio views use the shared game material. In-game `previous-*` uses R04; `r05-*` adds this stage. `ground-*` cameras look down at plants alongside the existing routes.

## Runtime selection

Opt-in: `?vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r05`. R05 includes the accepted R04 shrubs/timber. Use `vegdetail=r04` for the previous stage. Append `&multidraw=0` for instanced fallback. Default recovered style remains unchanged. This local branch still sits on the historical recovery base; later production-branch changes have not been integrated or deployed.

## Fresh validation

Typecheck, 309 unit tests, four unchanged budget-policy tests, production build and whitespace checks pass. The existing build chunk-size warning remains. The ground-cover regression covers all 19 models, deterministic positions, finite unit normals, non-indexed batch attributes, grounded bounded geometry and bounded model cost (grass at most 2×, all families below 4× their R02 geometry).

Twenty-eight render records: six low-quality outdoor poses and one sun-shadow control × previous/new × multi-draw/instanced. No recorded page exceptions, console errors, shader failures or WebGL errors. Placement inventories match exactly across all four runs. Low-quality triangle counts match across render paths; draw calls remain the same as R04.

| View | R04 triangles | R05 triangles | Change | Calls multi / fallback |
| --- | ---: | ---: | ---: | ---: |
| dense | 433,692 | 455,580 | +5.05% | 59 / 119 |
| garden | 241,436 | 273,908 | +13.45% | 25 / 52 |
| boslust | 453,690 | 474,202 | +4.52% | 91 / 138 |
| woodland-east | 391,168 | 415,196 | +6.14% | 38 / 102 |
| ground-dense | 315,800 | 335,648 | +6.28% | 51 / 100 |
| ground-garden | 160,288 | 192,400 | +20.03% | 23 / 34 |

All sampled low-quality views fit the unchanged 150-call / 750k-triangle ceiling. High-quality counts include shadow passes and do not use the low-quality budget. Software Chromium renders do not establish physical-phone frame pacing, heat or shimmer performance. No fresh portrait or full puzzle-route walkthrough is claimed.

## Reproduce

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/veg-r05-review.mjs` uses local port 5197. `GALLERY_ONLY=1` limits the run to model views. `validation.json` records source hashes for this checkpoint.
