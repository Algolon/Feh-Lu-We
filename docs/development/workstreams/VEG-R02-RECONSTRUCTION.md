# VEG-R02 — proposed reconstruction, not implementation authorization

2026-10-15. No new models implemented. Historical code is a technical reference, not recovered approved R02 art.

## Historical source findings

Both full commit objects resolve and their source was inspected:

| Commit | Useful existing content | Limits |
| --- | --- | --- |
| `015900747ef5e404cdf9861c84e67f25cca759fa` | `woodkit.ts`: oak, beech, birch, Scots pine, three variants each; hazel/holly; fern, grass, bilberry, foxglove, lily of the valley and anemone. Branch skeletons, tapered tubes, irregular foliage masses, crown-oriented normals/interior shading and shared bark atlas. `boslustSample.ts` batches the sample. | Older woodland sample. No equivalence to the missing approved R02 birches; do not copy its old rendering path over VEG-R01. No fresh visual approval or performance run. |
| `b4bce67ba7848b00cf6052b801a43f56fd89aa78` | `estateWoods.ts` and `woodlandPlan.ts`: estate-wide collection of existing trees/stumps, site-specific recipes, young trees, clearing screens, logs and boulders; route clearances and existing trunk colliders retained. Multi-draw/instanced fallback and distance/culling organization. | Older estate integration. Commit-message counters are historical claims, not current measurements. Reuse principles through current code, not a broad merge/cherry-pick. |

Current `woodkit.ts` still has deterministic three-layout birches with trunk lean, tiered limbs, drooping small clusters and birch bark treatment. These are an available starting point, not the recovered Work-style models. Current source has substantial changes since the first historical commit; wholesale restoration would discard later work.

## Proposed milestones

1. **Freeze and capture baseline.** Start an isolated future art branch from a newly verified current base. Record exact source hashes, workstream ownership, PB01 policy, fixed camera positions/FOV/quality/light settings and renderer path. Capture representative birch and forest/garden views and counters before edits. Retain default Hybrid: thresholds 22/36/62, hysteresis 3, outline mode and shared far/xfar behavior. Audit existing policy failures separately; never relax budgets.

2. **Three-birch art gate only.** Rework only birch geometry and, if required, narrowly scoped shared helpers. Aim for three clearly distinct silhouettes: slender/upright, broader/leaning and mature/open. Use intentional branch flow, separated layered foliage volumes, readable negative space, asymmetric drooping tips and white bark with restrained dark markings. Preserve existing instance transforms, IDs, trunk colliders and placement. Keep crowns readable at phone scale; avoid spherical stacks, noisy micro-detail and uniform leaf density. This is a proposed interpretation of the textual direction, not an exact recreation claim. If original screenshots become available, inspect them before choosing forms.

3. **Owner visual approval before expansion.** Provide actual in-game matched before/after captures: all three birches individually and in context; desktop landscape, mobile landscape/portrait; daylight, dusk and the other supported light phases. Include slow approach/retreat and lateral motion through Hybrid transitions; test normal and forced fallback rendering. Compare geometry cost and scene counters to identical baseline poses. Deliver a reviewable source checkpoint and preview. Stop for explicit artistic approval before changing any other species. No merge/live action implied.

4. **Species-by-species rollout after approval.** Oak first, then beech/pine, young variants, shrubs, ground plants and dead wood. Retain successful existing models. Review each family against the approved new birches; do not use `veg-art-r02-oak-sculpt` or its pilot helpers. Keep spatial composition changes separate from geometry improvements so their effects remain attributable.

5. **Estate validation and closeout.** Inspect forest edges, garden, driveway, BOSLUST, clearings and transitions. Validate route access, interaction visibility, colliders, stable identity, instancing/fallback parity, culling and LOD motion. Run typecheck, production build, relevant unit/regression and browser gameplay tests. Compare counters and foliage overlap under matched conditions with unchanged PB01 criteria. Record physical Android as pending unless tested on a real device; emulation/software rendering is visual QA only. Save screenshots, raw measurements, source hashes and limitations with exact commit references.

## Isolation rules

- No Mushroom Grove, shader, EXT-R02, setpiece, puzzle or progression edits.
- Avoid broad branch integrations. Identify file ownership before edits to `woodkit.ts`, `boslustSample.ts`, `estateWoods.ts` or materials; coordinate any necessary overlap explicitly.
- Geometry reconstruction should retain the current `vegetationLod.ts`, `vegbatch.ts` and planner contracts; historical code is read-only reference.
- Stage only reviewed owned files. Verify diff and clean checkpoint, persist remotely only when authorized; no force push, merge or publication.
- First deliverable is three birches for approval, not an estate-wide replacement.

Recommendation: accept this staged plan only after the recovery investigation is closed; then authorize milestone 1–3 as one limited session. The remainder depends on artistic approval.
