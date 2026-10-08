# DEV-03 — Estate art direction rollout & world cohesion

"Warm vakwerk, helder bewijs" rolled out over the DEV-02 estate: the living-room and BOSLUST samples are no longer
review-only islands but the grammar of the whole game. Macro layout, the 200 × 180 m estate, the manor's size, every
interactable / door / save id and every puzzle are unchanged.

## 0. Development base

| | |
|---|---|
| Base commit | `e87e56b` — DEV-02 as built = the content of the live DEV-02 review |
| Deployment-only commits | the Pages commit `8e720a1` (on `claude/wizardly-curie-y9xumd`) is deploy infrastructure and was reverted in `2efd7f0`; game code identical to `e87e56b`. Not used as a source. |
| Work branch | `ccr-6996e148-7sk3i0` (no deploy, no merge) |
| Read | design v0.2 (ART_BIBLE, ART_TOKENS, ENVIRONMENT_STORY, LEVEL_PLAN), DEV02_BLOCKOUT, DEV-01/DEV-01R docs, art-refresh STYLE_TARGET / INTERIOR_SAMPLE / EXTERIOR_SAMPLE, `livingSample.ts`, `boslustSample.ts`, `artkit.ts`, `woodkit.ts`; branding (logo / favicon / concept art) was looked at but not used as a substitute for the world art bible |

## 1. Audit → what was resolved

The full first-person audit (KEEP / FIX / TRANSFORM per zone, six systemic categories, 52 poses at eye height) is in
[`DEV03_AUDIT.md`](DEV03_AUDIT.md) with the frames in [`before/`](before/). No playthrough video was available; the
owner's written playtest findings were the hypothesis list. Status per systemic category:

| # | Finding | Resolution |
|---|---|---|
| S1 | material grammar (neon lawn, orange clay gravel, confetti rugs, blotchy plaster, black slate) | one calmer earthy family in `textures.ts` (dirt, plaster, boards, slate, mortar, a designed calm rug) + estate tints (lawn `#8eac58`, neutral gravel); samples' material set (`artMats`: upholstery / timber / stone / paint / brass / ceramic / rug) is now the default |
| S2 | furniture = boxes | `furniture.ts` rebuilt on a **joinery kit** (softened tops, aprons, tapered legs, rails, panelled doors, plinths/cornices, upholstery volumes) with unchanged signatures and colliders → every room upgraded at once |
| S3 | architecture = thin planes | **architectural kit** in `arch.ts`: manor / cottage window grammar (reveal, lining, sash + bars, sill, lintel, keystone, two-tone glass with ~¼ warm-lit rooms), door frames with architraves and plinth blocks, skirting + cornice, stairs with treads/nosings/risers/strings/spandrel, turned balusters + newels, eaves with fascia, soffit, gutters, downpipes, ridge/hip caps, bargeboards; manor facade: plinth, string course, cornice, quoins, chimneys, dormers, porch with Tuscan columns and entablature |
| S4 | lollipop woodland | **estate-wide woodland** on the BOSLUST woodland kit (`EstateWoods`): branch-structured species, saplings in thickets, clearing screens, understory (ferns, bilberry, foxglove, anemone), leaf litter, dead wood (logs with colliders), boulders; one multi-draw batch per family with 4 LODs (new `xfar`) and range culling |
| S5 | light (black upstairs ceilings, every window glowing, uniform forest) | black ceilings were the old solid fascia slab z-fighting with the ceiling → fascia/soffit ring; daylight glass with a few warm-lit rooms; interior sample lighting is the default (`?light=sample`); the woodland weight drives a cooler forest fill and forest-floor colour estate-wide |
| S6 | block props | prop kit pieces: real crates, beer crates with caps, kettle BBQ + prep table + gas bottle, festoon lights, music corner, tethered balloons on a helium trolley, car kit (estate / hatch / van), bar + back bar, loungers, range cooker + hood, kitchen dresser/island, globe on a stand, chandeliers, telescope, workbench, game boxes, instrument cases, blanket chest |

Concrete placement / function bugs found and fixed (first-person, not top-down):

- **Footsteps** — 5.2 steps/s at walking speed (fixed 0.62 m per step) → cadence from real speed (§2).
- **Black "dado rail" in the north guest room** — the service wing's hip-roof eave, fascia and gutter ran 0.5 m through the manor wall at seat height.
- **Beds off the wall** — guest room headboard 1.1 m off the wall; Reis / Sterren beds 1.5 m off the wall with the bedside and its interactive lamp *behind* the headboard (pulled off to clear the windows) → slid along the wall past the window, headboard flush, bedsides both sides, lamps keep their ids.
- **Workshop door unusable** — the workbench stood 0.25 m in front of `door.workshop` (found by the spatial suite) → under the tool board on the east wall.
- **Kitchen back door** — a terrace pot inside its clearance (spatial suite) → moved 1 m.
- **Kitchen** — a large empty tiled field with three loose units and a floating second table → working kitchen: range + hood focal point, sink run under the window, dresser on the west wall, island with stools, open shelves, pot rack, crates as stacked real crates.
- **Attic** — drying line across the walking line, sofa alone against the far gable → one weekend room (sofa group under its lantern, game boxes on a low table, instrument cases at the gable, drying line along the south partition).
- **Copacabana bar** — box with two cylinders facing the glass, bottle shelf floating on a glazing bar → bar facing the pool, back bar on its own frame with its own collider.
- **Social garden** — indoor chairs on outdoor platforms, purple crystal "flowers" read as gems, floating balloons → garden furniture set, low real flowers, tethered balloons.
- **Library** — a lone globe "mushroom" on the floor → globe on a stand by the reading table.
- **Round tables** — top 4 cm too low (tutorial items appeared to float) → top raised to 0.715 m.
- **Fire clearing** — stumps in a ring of pegs → fire stones, two stump seats, two log benches, a woodpile.
- **Lake** — sticks for reeds, grass straight into water → reed clumps from the plant kit, shore stones; the nest box is mounted on the hero oak's trunk surface (`trunkAt`).

## 2. Footsteps (confirmed playtest bug)

`src/player/gait.ts`: a walking phase integrated over the real horizontal speed (frame-rate independent),
cadence `clamp(0.9 + 0.33·v, 1.35, 2.8)` steps/s — walk 3.2 m/s → 1.95 Hz (stride 1.6 m), sprint 4.9 m/s → 2.5 Hz;
no steps below 0.45 m/s (turning on the spot, nudging a wall); the first footfall a quarter cycle after starting; a
soft settle step when stopping mid-stride; alternating feet with slight level / filter variation and no immediate
repeat of the same variant (`audio.step`). Unit tests (`tests/gait.test.ts`, 20–144 fps + jittered frames) and the
real build (`e2e:dev03`, through the actual movement and audio path):

| | before | after (measured in the build) |
|---|---|---|
| walk | 5.2 steps/s | **1.95 Hz**, stride 1.57 m, min gap 0.50 s |
| sprint | 7.9 steps/s | **2.53 Hz**, min gap 0.38 s |
| grand stair | 3.6 steps/s (2.2 m/s ÷ 0.62 m) | **1.95 Hz** |
| turning on the spot | — | 0 steps |

## 3. Systems and kits

| Kit / system | File | Reused by |
|---|---|---|
| Architectural kit (windows `manor` / `cottage` / `plain`, door frames, skirting/cornice, stairs, balustrade/newel, eaves, gable bargeboards) | `arch.ts` | manor, wing, cottage, conservatory, sauna, shed, BOSLUST hut, attic |
| Joinery & upholstery kit (`sb`, `bx`, `taperLeg`, cached geometry, one draw call per material per area) | `furniture.ts` | every interior + garden + cottage + wellness |
| New pieces | `furniture.ts`, `manor.ts`, `grounds.ts`, `conservatory.ts` | chandelier, lounger, bottle, slat bench, blanket chest, game boxes, instrument case, workbench, telescope, range cooker, kitchen island / dresser, cars, BBQ, festoon, balloons, folding chair |
| Estate woodland (`EstateWoods`): plans per site (BOSLUST, south forest, each dense mass, glades), saplings, clearing screens, understory, litter, logs, boulders, hero trees | `estateWoods.ts`, `woodlandPlan.ts`, `woodkit.ts` | the whole estate; old instanced path kept for `?ext=base` |
| Vegetation performance: multi-draw batches (instanced fallback), 4 LODs incl. far `xfar` (6–8 clusters, no branches), trees to 115 m / plants 11–24 m fades, chunked, one tree-atlas material | `vegbatch.ts`, `boslustSample.ts`, `woodkit.ts` | |
| View-aware culling: interiors only drawn through an open door in view; outdoors only drawn from inside when a doorway is in the view cone with line of sight; doorway plan-angle windows for the tree batch | `world.ts`, `estate.ts`, `game.ts` (cull every 0.12 s) | |
| Woodland weight (`woodWeight`): forest floor, path verge and cooler woodland light estate-wide | `boslustZone.ts`, `env.ts` | |
| Art flags default to the production grammar (`art` / `ext` / `light` = `sample`); `base` stays available for comparison | `artflags.ts` | e2e comparison suites |
| Spatial validation (`npm run e2e:dev03`) | `scripts/e2e-dev03.mjs` | §5 |
| Evidence capture (52 poses, cost per view) | `scripts/dev03-views.mjs` | `before/`, `after/` |

## 4. Zones

Order as briefed (A → G); every intermediate state was captured and reviewed from eye height.

- **A — Manor exterior.** Facade kit (above), roof tint, eaves without the black slab, dressed porch; the forecourt gets
  clipped box hedges on their old colliders, a box ball and a flower ring; cars become a car kit off the axis.
- **B — Hall / living / library (interior quality bar).** The living-room sample is the normal game; hall: turned stair
  balustrade + newel, forged chandelier, tapestry on an oak rod, calm runner; library: bookcases with plinth/cornice,
  globe on a stand; dining / kitchen as above.
- **C — Arrival + social garden.** Platforms keep their separation (BBQ / dining / music / balloon nook) but read as
  used: kettle BBQ with prep table and gas bottle, slatted tables and benches, folding chairs, festoon lights, music
  corner (rug, poufs, handpan on a stand, bong bucket), tethered balloons on a helium trolley; border planting.
- **D — Copacabana / wellness.** Real bar (straw front, canopy, foot rail, stools) facing the pool, back bar on its own
  frame, loungers with frame and cushion, teak side tables with glasses / towels on the deck.
- **E — Portugal cottage + lake.** Cottage window grammar with louvred shutters and a cobalt barra, terracotta terrace
  tiles with a stone edge, rafters and wall plate under the canopy, dressed terrace table (cards, bottles, pizza box);
  lake: reed clumps, shore stones, nest box on the hero oak.
- **F — Dense woodland + BOSLUST + discoveries.** The south forest and the dense masses become layered woodland
  (canopy, young trees in thickets, screens of hazel / holly / saplings round the clearings, ferns, bilberry, foxglove,
  anemone, leaf litter, logs, boulders); clearings are lighter pockets; the fire clearing, well, shed, fork, wickerman
  and golf sit behind screens of understory and young trees instead of in open view across the lawn. BOSLUST's approved zone keeps identical collision, interactables
  and lights (checked by the comparison suite).
- **G — Remaining rooms.** Bedrooms and guest room re-furnished (beds against walls, bedsides both sides), attic as one
  weekend room, lookout bench + telescope, workshop bench moved off the door.

## 5. Spatial QA

`npm run e2e:dev03` (production build, whole estate, generic rules):

| Check | Result |
|---|---|
| no tree / bush / stump in a building footprint (trees with a 0.6 m crown margin) | 1 775 planned plants, 0 violations |
| woodland seated on the terrain (no floating / buried trunks) | 0 violations |
| dense rollout present | 1 713 trees, 358 saplings, 93 screen bushes, 11 623 plants + litter, 35 logs, 50 boulders |
| every doorway has a free standing spot on both sides (0.55 m, body r 0.22) | 34 doors, 0 blocked (**found 2**, fixed) |
| every interactable has a free standing spot within reach with line of sight | 128 interactables, 0 unreachable |
| no two indoor furniture pieces interpenetrate (> 12 cm in x, z and y) | 221 pieces, 0 overlaps |
| footstep cadence (walk / sprint / stairs / turning) | §2 |

Also: DEV-01's "no vegetation instance inside a building footprint" and the BOSLUST zone contract (identical
colliders, interactables, lights) still hold; the e2e comparison suites now compare against an explicit `base` (the bare
URL loads the production grammar).

## 6. Performance (low quality = mobile budget ≈ 150 calls / 250 k triangles)

Captured with `scripts/dev03-views.mjs` on the production build (SwiftShader, 1280 × 720, same 52 poses before and
after; calls / triangles; data in [`before/views.json`](before/views.json) and [`after/views.json`](after/views.json)).

| | before (DEV-02) | after (DEV-03) |
|---|---|---|
| views over the low guide (150 calls / 250 k) | 6 over in calls (vestibule 164, hall from vestibule 159, hall stair 187, living reverse 183, sauna 157, double door 151); none over in triangles (max 247 k) | **1**: b13 billiard lobby 138 / 289 k |
| max draw calls at low | 187 | **143** |
| median triangles at low | 176 k | 170 k |
| e2e render budget suite (9 poses × low/high) | — | **18 / 18** on the final build |

Draw calls went down everywhere the old interiors leaked (view-aware culling: living reverse 183 → 116, hall stair
187 → 132, vestibule 164 → 109) while the woodland, joinery and architecture added geometry. Triangles rose where a
room used to be nearly empty (library 58 → 127 k, kitchen 38 → 135 k, upstairs 25–74 → 96–199 k) — all still well
under the guide. The woodland adds no draw calls per tree: the whole forest is 1 batch + 1 plant batch + 1 rock +
1 dead-wood batch.

Over budget after DEV-03 (left as is, see §9):
- **b13 billiard lobby** 138 / 289 k (low): from the lobby the hall, the gallery void to the upper floor and — through
  the open front door 20 m away — the drive are all legitimately in view. Cutting it means hiding geometry that is
  visible through the doorway; not done blind.
- at **high** (desktop, + shadows; guide 450 k): b13 477 k, f07 well 453 k.

The regression budget suite flagged *forecourt → manor* at 258 k / 476 k during validation; fixed in `8313192`
(interiors seen from outside cast no sun shadow, single-piece hedges, thinner lawn tufts) → 249 k / 409 k.

<details><summary>All 52 views, before → after (calls / triangles)</summary>

| view | before low | after low | before high | after high |
|---|---|---|---|---|
| a01-drive-approach | 120 / 206 k | 100 / 179 k | 156 / 321 k | 130 / 362 k |
| a02-arrival-court | 129 / 206 k | 140 / 248 k | 173 / 326 k | 176 / 417 k |
| a03-parking-west | 83 / 178 k | 51 / 162 k | 128 / 284 k | 90 / 323 k |
| a04-front-door | 120 / 175 k | 130 / 249 k | 168 / 275 k | 171 / 385 k |
| a05-manor-oblique | 135 / 208 k | 105 / 171 k | 182 / 334 k | 143 / 321 k |
| b01-vestibule | 164 / 209 k | 109 / 170 k | 220 / 347 k | 140 / 296 k |
| b02-hall-from-vestibule | 159 / 209 k | 126 / 204 k | 217 / 349 k | 173 / 359 k |
| b03-hall-maquette | 100 / 215 k | 63 / 165 k | 157 / 353 k | 110 / 320 k |
| b04-hall-stair | 187 / 217 k | 132 / 201 k | 245 / 357 k | 179 / 356 k |
| b05-living-from-hall | 98 / 218 k | 57 / 155 k | 156 / 357 k | 104 / 310 k |
| b06-living-hearth | 89 / 210 k | 49 / 143 k | 146 / 347 k | 80 / 269 k |
| b07-living-reverse | 183 / 245 k | 116 / 176 k | 237 / 382 k | 147 / 302 k |
| b08-library | 49 / 58 k | 54 / 127 k | 57 / 95 k | 71 / 210 k |
| b09-library-reverse | 50 / 55 k | 63 / 128 k | 58 / 92 k | 80 / 211 k |
| b10-dining-game | 132 / 200 k | 88 / 138 k | 190 / 344 k | 129 / 275 k |
| b11-kitchen | 64 / 38 k | 82 / 135 k | 84 / 87 k | 123 / 273 k |
| b12-kitchen-reverse | 100 / 72 k | 119 / 178 k | 120 / 122 k | 160 / 315 k |
| b13-billiard-lobby | 138 / 239 k | 138 / 289 k ⚠ | 195 / 370 k | 209 / 477 k |
| d01-copacabana-inside | 83 / 131 k | 89 / 154 k | 130 / 220 k | 143 / 289 k |
| d02-copacabana-bar | 63 / 135 k | 67 / 129 k | 109 / 226 k | 120 / 262 k |
| d03-copacabana-double-door | 151 / 190 k | 142 / 208 k | 195 / 272 k | 182 / 298 k |
| d04-wellness-deck | 81 / 164 k | 69 / 152 k | 123 / 242 k | 110 / 239 k |
| d05-sauna-jacuzzi | 157 / 196 k | 143 / 228 k | 201 / 283 k | 183 / 331 k |
| g01-upper-corridor | 85 / 74 k | 108 / 199 k | 101 / 122 k | 145 / 342 k |
| g02-north-guest-room | 28 / 28 k | 37 / 98 k | 39 / 41 k | 65 / 213 k |
| g03-attic-stair | 33 / 29 k | 42 / 130 k | 44 / 42 k | 70 / 245 k |
| g04-attic-common | 35 / 28 k | 40 / 106 k | 43 / 37 k | 56 / 167 k |
| g05-attic-lookout | 26 / 25 k | 35 / 96 k | 34 / 34 k | 51 / 157 k |
| c01-social-garden | 72 / 138 k | 65 / 169 k | 117 / 217 k | 108 / 248 k |
| c02-bbq-dining | 68 / 146 k | 69 / 168 k | 113 / 225 k | 112 / 246 k |
| c03-music-balloon | 67 / 146 k | 69 / 184 k | 111 / 224 k | 111 / 264 k |
| c04-garden-to-manor | 142 / 193 k | 128 / 215 k | 176 / 261 k | 156 / 305 k |
| c05-lantern-lawn | 59 / 129 k | 58 / 169 k | 101 / 200 k | 99 / 254 k |
| e01-terrace-to-lake | 59 / 135 k | 62 / 185 k | 101 / 203 k | 103 / 268 k |
| e02-lake-view | 39 / 123 k | 33 / 112 k | 69 / 183 k | 58 / 197 k |
| e03-cottage-approach | 37 / 118 k | 32 / 118 k | 59 / 162 k | 49 / 194 k |
| e04-cottage-terrace | 38 / 119 k | 31 / 92 k | 57 / 162 k | 45 / 171 k |
| e05-from-cottage-terrace | 101 / 179 k | 90 / 200 k | 120 / 222 k | 104 / 278 k |
| e06-cottage-return | 96 / 176 k | 91 / 210 k | 117 / 223 k | 105 / 291 k |
| f01-gate-drive | 135 / 226 k | 99 / 237 k | 157 / 310 k | 110 / 381 k |
| f02-forest-path-east | 67 / 197 k | 34 / 197 k | 90 / 301 k | 45 / 383 k |
| f03-shed-forest | 58 / 183 k | 33 / 160 k | 95 / 298 k | 60 / 392 k |
| f04-fire-clearing | 41 / 143 k | 25 / 138 k | 66 / 232 k | 44 / 344 k |
| f05-boslust-fork | 124 / 202 k | 90 / 231 k | 150 / 291 k | 105 / 382 k |
| f06-boslust-cut | 133 / 247 k | 88 / 223 k | 158 / 352 k | 102 / 371 k |
| f07-well | 126 / 227 k | 96 / 211 k | 154 / 338 k | 109 / 453 k |
| f08-wickerman | 50 / 160 k | 29 / 157 k | 79 / 287 k | 43 / 407 k |
| f09-golf-tee | 74 / 178 k | 47 / 184 k | 117 / 297 k | 80 / 415 k |
| f10-east-glade | 24 / 118 k | 14 / 98 k | 61 / 198 k | 52 / 213 k |
| f11-east-ridge-path | 79 / 177 k | 71 / 220 k | 112 / 250 k | 103 / 353 k |
| f12-north-edge | 116 / 190 k | 101 / 228 k | 139 / 244 k | 123 / 414 k |
| f13-west-forest-walk | 30 / 127 k | 15 / 103 k | 53 / 172 k | 39 / 184 k |

</details>

Not measured here: frame time on a real phone (SwiftShader counts are a proxy; the DEV-01 perf capture in
`e2e-dev01-results.json` is also SwiftShader).

## 7. Tests

| Suite | Result | Build |
|---|---|---|
| typecheck (`tsc --noEmit`) | clean | final `8313192` |
| unit tests (`vitest`) | **171 / 171** (incl. 8 new gait tests) | final |
| production build (`vite build`) | ok; CI on the branch green | final |
| DEV-03 spatial + footsteps (`e2e:dev03`, new) | **11 / 11** — [`e2e-dev03-results.json`](e2e-dev03-results.json) | final |
| regression (`e2e`) | **101 / 103** — the two failures were the forecourt render budget, fixed in `8313192`; the budget suite re-run on the final build: **18 / 18** — [`e2e-regression-results.json`](e2e-regression-results.json), [`e2e-metrics-final-results.json`](e2e-metrics-final-results.json) | `a1ad3fb` / final |
| DEV-02 browser suite (`e2e:dev02`, routes, gates, collisions, saves incl. legacy-pose relocation) | **34 / 34** — [`e2e-dev02-results.json`](e2e-dev02-results.json) | `a1ad3fb` |
| DEV-01 compatibility (`e2e:dev01`) | **34 / 34** — [`e2e-dev01-results.json`](e2e-dev01-results.json) | `a1ad3fb` |

`8313192` changes rendering only (shadow casting of interiors seen from outside, hedge geometry, tuft density, tyre
segments): no collider, interactable, save or route changed after the DEV-02 / DEV-01 runs.

Save / load sanity: the DEV-02 suite's save checks (fresh save, continue, legacy poses → named safe relocation,
progress kept) and the regression suite's save checks pass; no id was renamed.

Test changes (reasoned, not loosened): the two comparison suites (`art`, `BOSLUST`) now start their baseline with
explicit `art=base` / `ext=base` because the bare URL is now the production grammar; the BOSLUST "forest outside the
zone unchanged" check became "what the old instanced path still draws outside the zone is a subset of base" (the
woodland kit replaces trees estate-wide by design); favicon fetches cancelled by a navigation are not missing assets;
the DEV-01 footprint check skips contact-shadow decals (not vegetation); F05 waits for the tap to be processed instead
of a fixed 300 ms.

## 8. Evidence

Before / after at eye height (same pose, same build settings) in [`compare/`](compare/); full sets in
[`before/`](before/) and [`after/`](after/).

| Required view | Compare |
|---|---|
| manor approach | [a01-drive-approach](compare/a01-drive-approach.jpg) |
| hall | [b02-hall-from-vestibule](compare/b02-hall-from-vestibule.jpg) |
| living | [b06-living-hearth](compare/b06-living-hearth.jpg) |
| library | [b08-library](compare/b08-library.jpg) |
| Copacabana | [d02-copacabana-bar](compare/d02-copacabana-bar.jpg) |
| sauna / jacuzzi | [d05-sauna-jacuzzi](compare/d05-sauna-jacuzzi.jpg) |
| garden | [c01-social-garden](compare/c01-social-garden.jpg) |
| lake | [e02-lake-view](compare/e02-lake-view.jpg) |
| Portugal cottage | [e04-cottage-terrace](compare/e04-cottage-terrace.jpg) |
| dense forest | [f02-forest-path-east](compare/f02-forest-path-east.jpg) |
| BOSLUST | [f06-boslust-cut](compare/f06-boslust-cut.jpg) |
| wickerman clearing | [f08-wickerman](compare/f08-wickerman.jpg) |
| also: kitchen, attic | [b11-kitchen](compare/b11-kitchen.jpg), [g04-attic-common](compare/g04-attic-common.jpg) |

Against the approved samples:
- [living vs interior sample](compare/sample-living.jpg): the game's living room *is* the sample now (same hearth,
  furniture family, rug, curtains, beams, light); every other interior uses the same joinery / upholstery kit and
  material set.
- [BOSLUST fork vs exterior sample](compare/sample-boslust.jpg): the zone is the sample; the forest floor, path verge,
  understory and cool woodland light continue beyond it across the whole forest (compare f02 / f13 / f08 with it).

## 9. Known remaining blockout / art issues

Honest list, roughly by visibility in a normal walk:

1. **Cypresses and grass tufts** still come from the old instanced vegetation path (not rebuilt on the woodland kit);
   next to the new trees the cypresses read as cones.
2. **Pines** at mid distance still read stylised-lollipop next to the broadleaf species; their `xfar` cards are fine.
3. **Upstairs ceilings** are plaster now (the black was a geometry bug, fixed) but read warm-brown and dim away from a
   lamp; a light-fill / ceiling-bounce pass for the upper floor is still open. A lighter rectangle on the Reiskamer
   ceiling was noticed and not yet traced.
4. **Kitchen** is a working kitchen now, but the room is still large for its furniture; a second worktop run or a
   larder unit on the north wall would close the field.
5. **Wellness deck**: loungers and side tables are done; the deck edge board / skirt where the deck meets the lawn, a
   towel rack and a bench + bucket at the sauna door (audit FIX items) are not.
6. **Attic** structure: king posts and plank walls are plain; no rafters / purlins visible in the roof skin.
7. **Lake**: reeds and shore stones help, but the water is a flat colour and the shore still meets it in one line.
8. **Billiard lobby view (b13)** is over the triangle guide (289 k at low, 477 k at high) and the **well** view is just
   over at high (453 k) — see §6. A doorway-distance LOD for what is seen *through* a far doorway would fix b13.
9. Measurements are SwiftShader draw calls / triangles, not frame times on a phone; a real-device capture is still
   needed (§6).
10. Load time in SwiftShader is ~5 s for the estate (woodland plan + kit geometry built at load); a worker or cached
    plan could halve it if it matters on device.

## 10. Deliberately deferred (puzzle / content polish)

Not touched in this pass on purpose (brief §9):

- puzzle copy, hints and understandability (the dienstrooster, plates, BOSLUST code, kitchen hatch, conservatory key);
- notebook / journal redesign;
- new puzzles or new mandatory props; environment-story props were dressed only where ENVIRONMENT_STORY already
  places them (board-game table, Copacabana bar, kitchen crates, hearth, cottage table, BBQ, sauna, arrival clutter,
  forest discoveries);
- main storyline, final redesign, estate size or manor size, save / interactable / door ids;
- a full sound-design pass (only the footstep cadence + light variation);
- deployment: nothing was deployed; the branch's CI only builds and tests (Pages deploys from the default branch).
