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

<!-- PERF -->

## 7. Tests

<!-- TESTS -->

## 8. Evidence

<!-- EVIDENCE -->

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
8. **Billiard lobby view (b13)** stays over the triangle guide at low quality (the legitimate line through the open
   front door down the drive) — see §6.
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
