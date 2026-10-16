# VEG-R02 — vegetation style renewal

Status: **Full vegetation implementation recovered from original session on 15 October 2026. Local review branch; not merged or deployed.**

Source: production branch `ccr-75ef4113-kfkimm` at `752cb02` (includes car R02). Original branch: `veg-r02-reference-style`. Recovery branch: `recovery/veg-r02-session-replay`; other sessions' worktrees were not edited. The owner requested investigation and renewal of all outside nature, explicitly allowing one tree species first to establish the style.

## Verified model inventory

The main woodland kit (`src/world/woodkit.ts`) contains four species × three seeded structural variants = **12 tree models**, each with near/mid/far/xfar representations. These are model variants, not twelve individual planted trees. Production Hybrid uses near/mid/far with the far geometry reused for xfar, preserving the earlier VEG-R01 choice. Placement adds stable heading, scale and tint variation; saplings reuse the same tree models.

Runtime `vegList()` snapshot from the estate at this baseline:

| Family | Model variants | Placed instances in tree batch |
| --- | ---: | ---: |
| Oak | 3 | 456 |
| Beech | 3 | 427 |
| Silver birch | 3 | 177 |
| Scots pine | 3 | 198 |
| Hazel | 3 | 350 |
| Holly | 3 | 127 |

The diagnostic `woodCounts.trees = 1735` includes **1258 trees and 477 bushes**. It must not be described as 1735 actual trees. This includes the backdrop and 353 saplings; it excludes the separately rendered clipped cypresses. The same snapshot reports 11693 plant/litter instances, 36 scattered fallen logs, 232 rock instances (including 49 boulders). Counts describe this deterministic baseline, not an authoring target.

| Other nature | Existing implementation | Renewal direction |
| --- | --- | --- |
| Fern, bilberry, foxglove, lily of the valley, anemone | 3 variants each; explicit leaf/flower geometry | Broad frond shapes, flower silhouettes, readable colour patches; keep species distinct |
| Grass | 4 tuft variants; reused as tall shore grass | Curved, tapered blades; grouped heights and occasional seed heads; separate close lawn, wild verge and reed treatments |
| Hazel and holly | 3 variants each; branch skeleton + mostly closed crown masses | Share the leaf-spray shading language; different outline, leaf shape and density |
| Stumps | Shared flared body and sawn top; plain, absorbed and nurse treatments | Irregular break/saw profiles, readable rings, bark rim and integrated moss; retain collision fit |
| Fallen/cut trunks | 4 scattered log size/seed variants plus bespoke placed timber | Bark/end-grain consistency with trees, capped branch stubs, broken tips and moss patches |
| Branches, root flares, split timber and log seats | Tree skeletons and separately authored props | One bark vocabulary, coherent taper, connected branch junctions and grounded placement |
| Leaf litter | Separate instanced fallen-leaf model | Species-shaped leaves and calm patches; avoid fine noise everywhere |
| Mushrooms | Legacy caps/stems and local authored decorations | Intentional cap silhouettes and clustered arrangements; audit garden remnants too |
| Garden cypresses | Legacy `nature.ts` cone construction, not woodland variants | Dedicated clipped evergreen model; do not confuse with Scots pine |
| Box hedges / legacy garden flowers | Separate `estate.ts` geometry and some `nature.ts` instances | Controlled clipped outline with fine edge leaves; replace remaining flower blobs |
| Rocks, boulders, exposed earth and shore | Seeded rocks, authored terrain/verge/contact layers | Broad planes, restrained material breakup and embedded contact; coordinate moss with dead wood |

Inventory is intentionally broader than `woodkit.ts`: changing that file alone would miss outdoor nature. Water/sky are neighbouring systems, not vegetation replacements in this workstream.

## Reference analysis and direction

The four user references rely on three scales working together: a legible whole-tree silhouette; overlapping, asymmetrical foliage groups; and small leaf tips/gaps at the edge. Bark and branching remain readable between groups. Warm outer/top leaves and cooler, darker interiors make crowns volumetric. The meadow works through patches and quiet space, not uniformly scattered decoration.

Adopt those relationships while retaining the project's European woodland species and earthy green palette. The blue/purple/yellow trees in the references demonstrate form/material variation; they are not an instruction to recolour the estate as a fantasy biome.

## Recovery of the approved full implementation

The original session records owner approval of the birch direction and a request to extend it to all vegetation. Historical commits `fef8046` and `e208629` are currently unavailable through GitHub. Recovery replays the original untruncated patches and three reviewed source-edit scripts onto the exact historical base `752cb024a349ec0045d4f1873e5b191b154191f0`. This restores source changes, not the original Git object identities or binary screenshots.

Coverage: twelve oak/beech/birch/pine tree variants, six hazel/holly bush variants, nineteen understory variants, formal garden greenery, dead wood, stumps, branches, mushrooms and litter. `foliageStyle.ts` provides the shared species atlas and foliage geometry. The local feature branch defaults to `woodland-r02`; `?vegstyle=baseline` and `?vegstyle=birch-r02` remain available for comparison.

Fresh validation passes: typecheck, 301 unit tests, four budget-policy tests and production build. The existing large-bundle warning remains. New visual evidence is regenerated from the recovered models by `scripts/veg-r02-all-review.mjs`; results are documented in `docs/veg-r02/all/README.md`. Both review scripts now accept `CHROMIUM_EXECUTABLE_PATH` for local execution.

The recovery manifest records source hashes and distinguishes fresh checks from historical claims. This checkout is based on the original October 15 development state; later main-branch changes have not been integrated. Integration must preserve intervening work.

Remaining: physical-device performance and distant shimmer checks, full puzzle-route visibility review, visual acceptance and integration with current main. No push, merge or deployment has occurred during recovery.
