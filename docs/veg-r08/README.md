# VEG-R08 — soil, pots, hedges and close-view plants

Revision from the user's gameplay screenshots and supplied plant references. The previous R07 ground textures and tree studies remain the accepted base. This stage fills gaps the close gameplay inspection exposed in formal garden and indoor assets.

## Changes

- **Earth:** the forecourt planter, shared furniture pots throughout the manor and conservatory, botanical-room pots, potting-bench pots/seed tray, and both home pots now use the approved dirt map with a darker earth tint. The map is shared, without another bitmap allocation. Pot/planter UV scale keeps its visible detail appropriate to smaller surfaces.
- **Pot construction:** shared 28-sided revolved sections have an inner wall, rounded rim and real recessed opening. The old top caps that concealed the soil are removed in the new models. Pot bodies have restrained baked tonal variation; larger decorative pots use the existing glazed-ceramic material. The shared furniture builders propagate the change to their call sites.
- **Indoor plants:** old hazel/holly crown lumps and small botanical-room leaf balls are replaced by individual curved leaves on visible stems. There are seeded broad-leaf and upright lance-leaf habits, with terminal leaves and continuous leaf normals. Existing home plants already had separate shaped leaves; those shapes are retained while their pot and earth are updated.
- **Clipped hedges:** opaque curved leaves cover both long faces, top and ends. A smaller dark core fills the interior; it is inset from the outer leafy mantle. Leaves use UV marker 30 to bypass the trunk/legacy leaf atlas on the shared tree material. Matching program cache keys isolate that branch. Existing custom-depth rendering sees their actual solid leaf geometry.
- **Ground plants:** all 19 existing variants remain. Leaf and petal outlines now have finer rounded sampling and smooth curved normals; foxglove/lily bell profiles gain circumferential detail and averaged authored normals. Grass blades retain their accepted shape; seed-head blades use the new leaf surface. Geometry remains non-indexed with position/normal/color for the existing plant batch.

Scene positions, collider definitions, routes and puzzle code are retained. Mesh envelopes change slightly with rounded rims/leaves. The forecourt stone planter and central topiary keep their existing design. This is not a new set of every example species in the reference images; the references inform the shape, colour and construction of existing plants.

## Evidence and preview

`references/` retains the five supplied plant-reference sheets and five gameplay screenshots. `pots-compare.jpg` uses the actual shared furniture builder: old left/new right. `hedge-compare.jpg`: old in front/new behind. Plant `*-compare.jpg`: accepted R05 geometry in front/new R08 behind; `*-variants.jpg` and `*-closeup.jpg` show the refined models.

Matched game `previous-*` frames use the complete accepted R07 state; `r08-*` adds this stage. Captures include the forecourt, planter close-up, hedge, hall pot, botanical room, conservatory, six established outdoor views and both home pots. The same poses/settings are used before/after.

Opt-in: `?vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r05&groundart=r07&gardenart=r08`. Omit `gardenart` for the previous version. Append `&multidraw=0` for instanced fallback. This remains a local review branch on the historical recovery base, without production-branch integration or deployment.

## Fresh checks

Typecheck, all 314 unit tests, four unchanged budget-policy tests, production build and whitespace checks pass. The existing build chunk-size warning remains. New tests raycast through pot openings to the inner floor, verify the soil/rim separation, check leaf coverage on every hedge face, and exercise all 19 refined ground models for finite unit normals, batch-compatible attributes, grounding and bounded additional cost.

Sixty game records: twelve estate views plus a high-quality sun-shadow control, and two home views, each before/after on both rendering paths. No recorded page exceptions, console errors, shader failures or WebGL errors. Low-quality triangle counts match between multi-draw and instanced paths. Placement inventories match across all four estate runs.

| View | R07 triangles | R08 triangles | Change | Calls multi / fallback |
| --- | ---: | ---: | ---: | ---: |
| dense | 455,580 | 475,476 | +4.37% | 59 / 119 |
| garden | 273,908 | 281,916 | +2.92% | 25 / 52 |
| boslust | 474,202 | 615,110 | +29.71% | 93 / 140 |
| woodland-east | 415,196 | 442,956 | +6.69% | 38 / 102 |
| ground-dense | 335,648 | 354,968 | +5.76% | 51 / 100 |
| ground-garden | 192,400 | 199,148 | +3.51% | 23 / 34 |
| forecourt | 323,906 | 468,118 | +44.52% | 101 / 114 |
| planter | 255,886 | 400,098 | +56.36% | 82 / 85 |
| hedge | 360,790 | 489,658 | +35.72% | 70 / 83 |
| hall-pot | 170,494 | 175,592 | +2.99% | 49 / 49 |
| botanic | 149,012 | 187,448 | +25.79% | 42 / 42 |
| conservatory | 409,758 | 429,030 | +4.70% | 89 / 102 |
| home-east | 22,434 | 22,802 | +1.64% | 15 / 15 |
| home-west | 20,052 | 20,420 | +1.84% | 12 / 12 |

Every sampled low-quality view stays within the unchanged 150-call / 750k-triangle ceilings. Detailed hedge leaves materially increase geometry even in some longer views because static garden parts share coarse batch bounds. This is a visual-quality/cost tradeoff; the checks do not establish physical-phone FPS, heat or shimmer performance. High-quality counts include shadow passes. No fresh portrait, complete puzzle-route run or historical conservatory stress-matrix acceptance is claimed.

## Reproduce

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/veg-r08-review.mjs` uses port 5201; `GALLERY_ONLY=1` runs the model gallery only. `validation.json` records current source hashes.
