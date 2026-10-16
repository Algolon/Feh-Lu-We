# VEG-R09 — botanical character and interior greenery

Local opt-in review on the recovered VEG-R08 base: `?vegstyle=woodland-r02&treeart=trees-r03&vegdetail=r05&groundart=r07&gardenart=r09`. R08 stays available through `gardenart=r08`. No deployment or production integration.

## Plant library

The preceding indoor library had three seeded models but only two distinct growth habits. This stage supplies **seven indoor families, each with three geometrically different variants (21 models)**: ficus, snake plant, alocasia, pothos, cactus, succulent and zamioculcas. The outdoor ground library remains six families and nineteen models. These are authored stylized families, rather than botanically exact cultivar scans.

Variation changes branch count, height, density, leaf size and growth direction. Broad leaves carry a midrib and paired side veins following the petiole-to-tip direction. Snake blades and cacti have longitudinal ribs, with banding on snake plants; succulent leaves retain a soft fleshy surface. Alocasia and pothos gain basal lobes and drooping tips. A shared 1024×512 atlas supplies seven leaf surfaces plus a white tile for stems and flower parts (~2.67 MiB including mipmaps). Curved opaque geometry preserves the established rendering paths without alpha-cutout overdraw.

Terracotta, rounded glazed ceramic, cylindrical woven baskets and raised three-legged stands have distinct construction, recessed soil and open rims. Stands have a support ring. Hanging pots have three ropes and a hook; pothos vines climb over the vessel rim before descending outside it. A small shared 128×128 weave texture supplements existing material maps. The supplied group reference and close leaf references guided these shapes, material relationships and venation.

## Composition and placement

Thirty-eight room briefs cover the manor's ground, upper and attic rooms, four basement rooms and both Portugal cottage rooms. Actual stair flights remain clear. Each brief has an authored preferred anchor, growth habit, scale, container and design rationale. Larger rooms receive contrasting-height companions where space permits. Fitting first tries nearby positions, then perimeter positions, and only reduces scale when necessary. It checks floor support, room bounds, furniture/water colliders, complete door sweeps and interactable focus areas. Group companions receive the same support/clearance checks. This is deterministic placement, not runtime random spawning.

The resulting audit records 49 additional plants, with at least one in each of the 38 rooms. This includes three hanging pots: one by the bathroom window and two under the Portugal cottage canopy. Larger groups use warm/neutral materials with different silhouettes and heights. Existing shared furniture, conservatory, botanical-room, potting-bench and home plants also use the new family models; those replacements are not counted in the 49 additions. Basement pots use existing work-lit corners; no new grow lighting is simulated.

Each new indoor group has its own room-aware culling chunk, keeping outdoor views from drawing every new room's greenery. Existing gameplay interaction IDs remain intact. New floor pots have compact collision footprints.

## Evidence and limits

The gallery uses actual game geometry and materials, with all three variants of each family, a mixed reference-inspired composition and a leaf close-up. Matched R08/R09 frames cover established outdoor cameras, the hall, botanical room, conservatory and cottage. Additional R09 cameras inspect every room from inside its bounds, and both starting-home plants. The review runs both multi-draw and instanced fallback paths at low quality. `audit-*.json` records the actual room fit; `results.json` stores render counts and errors. The script fails on missing rooms, page/shader/WebGL errors or the unchanged central development camera budget.

This checks visual construction, room coverage and sampled render cost. It does not establish physical-phone FPS, heat, portrait shimmer or a complete puzzle-route acceptance. The existing build chunk-size warning remains. Concurrent unrelated rug work in this checkout is preserved separately and is not part of this vegetation change.

## Reproduce

`CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/veg-r09-review.mjs` uses temporary port 5202. `npm test -- --maxWorkers=1 --testTimeout=30000`, `npm run typecheck`, `npm run test:budget`, `npm run build`, and `git diff --check` provide the source checks.

Final checks: 318 unit tests and four budget-policy tests pass, as do typecheck, build and whitespace checks. 117 render records (108 gameplay views plus nine gallery studies) report no page, shader or WebGL errors. All sampled low views stay within the central budget; maxima are 142 calls and 619,768 triangles. Both rendering paths fit all 38 room briefs and produce the same 49-placement audit. Source hashes are in `validation.json`.
