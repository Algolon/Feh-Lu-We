# Art refresh, step 3 — exterior sample: the approach to BOSLUST

**Status: proposed, not owner-approved.** This sample is reachable only through the review entry below (or the
`?ext=sample` flag). The normal game still builds the original woodland, cut and entrance. Nothing outside the
sample zone has new assets. Nothing has been propagated to the rest of the estate.

**Revision 1 (owner feedback: "3–4 variations of each tree, grass, bush and plant, and several species").**
The zone now has four tree species (oak, beech, silver birch, Scots pine) with three variants each, two bush
species (hazel, holly) with three variants each, and six plant kinds with three or four variants each, placed by
simple ecology. They render through three batched meshes, so the draw calls went *down*. Details in §2–§4; numbers
in §7. The original step-3 captures stay in [`exterior-sample/`](exterior-sample/), and the revision's are in
[`exterior-sample/rev1/`](exterior-sample/rev1/).

Companion documents:
- [`STYLE_TARGET.md`](STYLE_TARGET.md), including the step-2 revisions and the step-3 notes at the top.
- [`REVIEW_CHECKLIST.md`](REVIEW_CHECKLIST.md).
- [`INTERIOR_SAMPLE.md`](INTERIOR_SAMPLE.md) (step 2; its review mode `?review=living` is unchanged).
- Evidence for this step: [`exterior-sample/`](exterior-sample/).

## 1. How to review it on a phone

1. Open **`https://algolon.github.io/Feh-Lu-We/?review=boslust`**. The build id is shown on the review start card
   and in Pauze; check it against the commit in §10.
2. Tap **Start review**. You start a step south-west of the fork signpost on the southern loop, looking past the
   signpost up the side path towards the hill, with the ordinary touch controls.
3. Walk the side path into the cut and up to the door. Then turn round and look back, and step off the path to the
   sides.
4. The **Review** pill at the top opens three toggles:
   - **Toon oud / Toon nieuw:** rebuilds the approach with the original or the new assets, at the same spot (about
     a second).
   - **Licht:** the lighting treatment, new or original (in the zone: the exterior woodland treatment).
   - **Tonemap:** ACES (current) or Neutral. Exposure stays 1.15.
5. **Temporary progress, review only.** So that you can try the entrance, this sandbox starts with the route
   restored and the letter strip in the bag (what the normal game requires before the cipher cover opens). The
   cipher answer is unchanged. The normal game's gates are unchanged.
6. **Isolation.** The review runs on a temporary in-memory save. Your own save, backup save and settings are never
   read, written, reset or migrated (tested; §8). The living-room review `?review=living` still works as before.

Developer flags, all opt-in: `?ext=sample` (build the new approach), `&light=sample` (lighting treatment),
`&tm=neutral`. They work with `?autotest=1` for the capture and test scripts.

## 2. Scope

The zone is plan X 38–88, Z 0.6–48 (`src/world/boslustZone.ts`): the fork, the side path, the cut, the entrance and
enough woodland around them that the boundary is 16 m west, 25 m east and 30 m north of the route (south is the estate wall). Inside it:

| Area | Original | Sample |
|---|---|---|
| Trees | 69 cone/blob trees (oak, birch, pine kinds) | the same 69 positions and colliders; oak, beech, silver birch and Scots pine, three variants each (rev. 1) |
| Bushes | blob shrubs | hazel and holly, three variants each, set back from the path, no collision (rev. 1) |
| Undergrowth | blob ferns, shrubs, flowers, toadstools, grass tufts | fern ×3, grass ×4, bilberry ×3, foxglove ×3, lily of the valley ×3, wood anemone ×3 (rev. 1); leaf litter, verge stones |
| Stumps | cylinders | the same positions and colliders; flared stumps with a sawn top |
| Cut | dry-stone block walls with moss blobs | courses of large rock, stacked into the hill; the same collision boxes |
| Entrance | flat ashlar wall with a parapet ("battlements") | rubble headwall between rock masses, turf over the top, oak door frame, lanterns; the same collision |
| Signpost | box arms | jointed oak post, arrow arm, forked arm; the same position, hitbox and collision |
| Ground | lawn-green terrain colour | forest floor: litter under crowns, worn soil by the path, rock dust at the cut |
| Path | 1.9 m strip, orange | wandering edges (1.4–2.9 m) inside the zone, earthier soil colour; unchanged outside |

Not changed: puzzles, the cipher and its clues, the inscription text, the BOSLUST sign text and position, the
tablet and lock positions, the door, the stair, the underground, every collider, every interaction id, every
original light. The forest outside the zone is byte-for-byte the same instance data (tested).

## 3. What was built

All code-built (`src/world/woodkit.ts`, `src/world/boslustSample.ts`), deterministic, no downloaded assets.

- **Species and variants (revision 1).**
  - **Species mapping:** the original tree kinds keep their positions and colliders. "birch" positions become
    silver birches and pines stay pines. About a third of the oaks become beech (by a position hash). Each tree
    gets one of three variants by a second hash, so neighbours rarely match. Height varies ±6 % per tree.
  - **Oak ×3:** the two layouts below plus an old, spreading oak with a long low limb.
  - **Beech ×3:** a straighter, slimmer, smooth grey trunk under a taller, domed crown built in layers, with
    upward-sweeping limbs. Seeded layouts run from narrow-tall to broad.
  - **Silver birch ×3:** a slender, slightly wavering white trunk, dark and rugged at the foot. Five or six thin
    branches rise and droop at the tips, with light clumps hanging along them; an airy crown you can see through.
  - **Scots pine ×3:** the authored hero plus a shorter, fuller tree and a tall, sparse, leaning one.
  - **Hazel ×3:** six to eight smooth stems fanning from one stool, leafy from knee height to the arching tips.
  - **Holly ×3:** compact and dark, an irregular cone of spiky (strongly displaced) clumps.
  - **Plants:**
    - Fern: three variants — 9 mid, 13 long fresh or 7 short dark fronds.
    - Grass: four variants — short tuft, tall wispy, tuft with oat-like seed heads, broad arching sedge.
    - Bilberry: a low twiggy mound of small bluish leaves; two variants carry dark berries.
    - Foxglove: a rosette and one or two spikes of pink-purple bells, the colour accent of the approach.
    - Lily of the valley: two or three upright leaves and an arching stem of white bells.
    - Wood anemone: one, three or five stars over a leaf whorl.
  - **Placement ecology:**
    - Bilberry carpets under the pines and on the hill; lily patches under oaks and beeches.
    - Foxglove groups in light openings 2–6 m from the path; anemone drifts under the broadleaves.
    - Wispy and seed-head grass on the sunny verge, sedge at tree feet; ferns in hollows.
    - Hazel groups at the edge of broadleaf crowns, with the odd holly in their shade.
    - Each patch mostly keeps one variant, as plants spread in patches.
  - **One bark atlas** (fissured, smooth, birch side by side) lets every species share one bark material.
- **A. Broadleaf oak** (the hero variant and the two other oak variants; revision 1 adds beech and birch alongside).
  - Leaning, tapering trunk; five buttress roots grow out of the trunk axis, flare and dive into the soil (they
    end 0.75 m below the trunk base, so they stay buried on slopes).
  - Four main limbs plus a leader, two of them forked, each entering a foliage mass.
  - Crown: five or six major masses arranged broad and lopsided with sky between them. Each mass has five smaller
    clumps on its outer side, so the outline is scalloped rather than a pillow.
  - Foliage normals blend toward the crown centre (one soft volume) and are biased up, so undersides are shaded
    green, not black. Occlusion is baked in vertex colour (warmer on top, cooler below; no sun direction).
  - Bark: a fissure texture running along the trunk.
- **B. Scots pine.** Tall, slightly leaning trunk, grey-brown low and warm orange above ~5 m, four dead stubs; nine
  near-horizontal branches at uneven heights and bearings, each ending in a loose cluster of four flattened,
  drooping clumps; a top cluster. Its crown starts 6 m up (the oak's at ~3 m). Distinct from the oak in clay (§5).
- **C. Rocks.** Convex hulls of a few points on a squashed ellipsoid: broad deliberate planes, creased normals
  (soft at shallow angles, crisp at real edges), each plane its own value, moss on upward faces near the top,
  darker toward the ground. In the cut they are placed by measured bounding box so the face toward the walkway is
  3 cm proud of the original collision box, stacked in courses until they cover the hill surface behind.
- **D. Hill, cut and entrance.**
  - Cut sides: rock courses with a slight batter; gatepost boulders at the mouth; outcrops breaking through the
    hill around the door.
  - Headwall: rough-coursed rubble, stone sizes varying (some tall stones spanning two courses), darker and
    earthier low, on a recessed dark mortar backing; irregular capping stones; turf rolling over the top; two rock
    masses out of the hill hold its ends.
  - Portal: oak posts on stone pads right around the opening, a heavy lintel with projecting ends and pegs, a
    stone threshold step, an oak board framing the original BOSLUST sign, a stone surround behind the inscription
    tablet. Roots come over the top, clear of the sign, tablet and lock. No foliage covers the entrance.
  - Two wrought-iron lanterns on wall brackets: fixed light sources, always lit, a soft warm pool on the threshold
    (no hard-edged disc).
- **E. Understory and verge.** In the first version: fern, a hosta-like ground plant (replaced in revision 1 by
  native species, see above), grass clumps, white wood anemones, fallen leaves under the broadleaves, small verge
  stones. Clustered with negative space;
  kept out of the walking corridor, the cut and the signpost. None has collision (the zone's collider list is
  identical to the original).
- **F. Signpost.** Chamfered oak post with a capped top on a footing stone; an arrow arm along the path, pegged
  through the post; the forked arm towards the hill (a board that splits into two tines) with a carved leaf on
  both faces. No words (as the clue says). Same position, same inspect hitbox, same collision circle.
- **Ground and path.** Terrain vertex colours in the zone are authored as target albedo ÷ the grass texture's mean
  (the texture is strongly green; any other tint is swallowed), faded in over 16 m at the zone edge. The path
  drape gets per-side wandering widths and a per-vertex earth tint inside the zone; outside it is the original.
- **Contact grounding.** Soft multiply decals lying on the terrain slope under tree feet, stumps, rocks, the
  signpost and the headwall foot (one draw call). Phone quality has no shadow maps; this is what grounds the
  woodland there.

## 4. Pipeline and renderer changes (all reversible, all behind the flags)

- **Batched meshes (revision 1)** (`TreeBatches`, `PlantBatch`), three in total:
  - *wood* holds every species × variant's near bark; *foliage* holds near foliage and the merged far LOD of
    every tree and bush; *plants* holds all 19 plant geometries.
  - Each is one three.js `BatchedMesh`: many different geometries drawn in one call through `WEBGL_multi_draw`.
    That extension is reported on ≈99.98 % of iOS and ≈96.6 % of Android devices (web3dsurvey); Firefox lacks it.
    Without it three.js falls back to one call per visible instance: correct, but many more calls.
  - three.js culls every instance against the view and against the shadow camera itself. Per frame, but only after
    the camera has moved, the sample swaps near/far geometry by distance (near < 18 m, 3 m hysteresis; trees to
    115 m) and shrinks plants out over their last 5 m (plants shown within 20–22 m, foxgloves 28 m).
  - The first version's `LodInstances`/`NearInstances` (one InstancedMesh per variant, LOD and material) would
    have cost ~40 more draw calls with this many variants; they are removed.
- **Far LOD in one draw call:** wood and foliage merged on the foliage material, the wood's vertex colours
  pre-multiplied by bark ÷ leaf colour. Both LODs keep the same masses, clumps, limbs and roots (coarser far away),
  so the switch does not change the silhouette and roots never disappear.
- **Shadows (high quality only):** the wood and foliage batches cast; three.js culls their instances for the shadow
  camera separately, so trees behind the viewer still cast into view. (The first version's layer-1 shadow proxies
  are removed.)
- **Thin leaves:** two-sided by duplicated triangles with shared up-biased normals and a front-side material.
  `DoubleSide` flips back-face normals, which made half of every clump black.
- **Old visuals in the zone are generated, then discarded** (`Vegetation.drop`), so the random sequence, and with
  it every tree and plant outside the zone, stays exactly as before. The cut and headwall are built by the
  original code on a discarded batcher so their colliders are created by the same calls.
- **Static parts** (rocks, stones, wall, frame, stumps, litter) are batched into the forest chunk and share
  three materials (rock, timber, flat), so they add three draw calls in total.
- **Lighting treatment** (`env.ts`, under `light=sample`, only in the zone, faded by distance to its edge): a cooler,
  greener haze that starts nearer (warm foreground, cool distance), slightly cooler sky fill, warmer earth bounce,
  8 % more sun. ACES and exposure unchanged.
- `artkit.ContactShadows.add` takes an optional ground normal (default unchanged, so the living sample is
  unaffected).

## 5. Comparisons

Captures: phone viewport 844×390, quality "low" (the phone default, no shadow maps), HUD hidden, settled 1.5 s,
made with `scripts/art-capture.mjs <dir> "<query>" boslust`. Baseline = the current game (no flags), captured before
any step-3 change (poses 33–36 and 40 were re-aimed at the hero trees and captured in base mode, which renders
pixel-identically to the pre-change build; §8). Proposal = `ext=sample&light=sample`. Each pose has three passes:
`<pose>.jpg` (game), `-neutral.jpg` (no fog, white sky/sun, exposure 1) and `-clay.jpg` (the neutral shape
diagnostic: one matte grey material; no textures, vertex/instance colours, emissives, flames, light pools, contact
decals or point lights).

| Folder | Content |
|---|---|
| [`exterior-sample/compare/`](exterior-sample/compare/) | baseline over proposal, all 15 poses |
| [`exterior-sample/compare-clay/`](exterior-sample/compare-clay/) | the same in clay: fork, cut, door, approach, reverse, oak roots, oak side, pine |
| [`exterior-sample/baseline/`](exterior-sample/baseline/), [`proposal/`](exterior-sample/proposal/) | all passes |
| [`exterior-sample/walkthrough.webm`](exterior-sample/walkthrough.webm) | 80 s moving walkthrough (software rendering: a few fps; evidence of composition and popping, not frame rate) |

Revision 1: [`exterior-sample/rev1/compare/`](exterior-sample/rev1/compare/) (baseline over revision 1, 17 poses),
[`rev1/compare-3/`](exterior-sample/rev1/compare-3/) (baseline / first version / revision 1 for fork, cut, approach,
reverse, side, oak side, pines), [`rev1/compare-clay/`](exterior-sample/rev1/compare-clay/), all passes in
[`rev1/proposal/`](exterior-sample/rev1/proposal/), and a new walkthrough. Two poses were added:
`41-species-mix` (oak, beech, birch, holly and hazel in one view) and `42-understory-near`.

Poses:

| Pose | What it checks |
|---|---|
| 11-southern-loop | arriving from the west; the zone boundary behind you |
| 13-boslust-fork (step-1 pose) | fork → framed approach; the sign readable down the path |
| 14-boslust-cut (step-1 pose) | the cut and the embedded entrance |
| 15-boslust-door-near (step-1 pose) | sign, tablet, lock, door construction |
| 30-approach-mid | the composition from the side path |
| 31-reverse-from-door | the view back out of the cut |
| 32-side-busy | off-path, many trees, the cut from the side |
| 33-oak-roots-near | hero oak trunk and roots at ~1.5 m |
| 34-oak-canopy-below | hero oak from below |
| 35-oak-side | hero oak from the side, with the fork |
| 36-pine-silhouette | pines on the hill against the sky |
| 37-rocks-near | rock close-up at the cut wall |
| 38-fern-verge-near | path verge close-up |
| 39-door-oblique | portal and wall from an angle |
| 40-signpost-near | the signpost |

## 6. Self-critique

Asked as the brief asks, answered from the captures, not from intent.

- **Does the oak still look generated?** Partly, yes.
  - At 5–30 m it reads as a stylized broadleaf: lean, taper, limbs entering separate masses, a scalloped and
    lopsided crown with sky between the masses (35, 13, 30).
  - Up close the construction shows. The roots are uniform tapered tubes that meet the trunk with visible creases
    (33). From below, the limbs end as points inside smooth, displaced-sphere masses (34). Every oak is one of two
    models, so repetition was visible in a row (31). **Revision 1** addresses this with three oak variants plus
    beech and birch, and per-tree height variation (§3).
  - It is better than the baseline's cone-on-cylinder by a wide margin, but it is not hand-sculpted. If the owner
    wants a hero oak at 1–2 m to hold up, the next step is an authored GLB for the two oaks (the instancing,
    LOD and culling here take any geometry).
- **Are oak and pine distinct without colour?** Yes (clay 36, 14). The oak has a broad low crown on a thick
  trunk; the pine has a tall bare trunk with a narrow, uneven crown of clumps high up. The pine's clumps are
  somewhat "bonsai pad"-like. A Scots pine's crown is looser and more ragged.
- **Is the hill continuous?** Mostly. The cut walls are now rock running back into the hill, with no bare slope and
  no floating stones (14, 30). The hill dome itself is still the smooth original terrain; rock outcrops break it a
  little.
- **Is the path integrated?** Better, not finished. The edges wander, the colour is earth not orange, and verge
  grass, stones and litter cross the edge with gaps. It is still a draped strip with a hard edge (38). A soft edge
  needs a blend in the terrain material, not in scope here.
- **Is the entrance embedded?** More than before, not fully.
  - The battlements are gone. The headwall is rubble between rock masses with turf over the top, a heavy oak frame
    and warm lanterns (14, 30, 39).
  - In clay it is still a rectangle set into the hill: the top edge is straight and the wall face flat (clay 14).
    Stepping the wall down into the rocks at both ends, and letting the mound overhang, is the next fix.
- **Do the references actually inform the result?**
  - *DEVDIARIES (construction):* jointed frame, pegs, stone pads, a sign on a board, wall brackets. Yes.
  - *Mahasona (layering, chunky stone, warm focal points):* rubble wall and big rocks, lanterns as the warm focus
    at the end of a cool approach. Yes, though the stone is less sculpted than the reference.
  - *Forest path (framing, vegetation hierarchy, depth):* trees frame the path, there is an understory layer,
    and the haze cools the distance. Partly: the understory is sparse, and the hierarchy is trees → grass more than
    a full shrub layer.
  - *Broad-canopy forest (roots, taper, canopy outlines):* roots, taper and scalloped outlines. Yes, at mid distance.
  - *Sunday Sundae (rock planes):* broad deliberate planes, each its own value, moss on top. Yes; the most
    convincing asset of the set.
- **Is it the same game as the interior?** Yes. It uses the same kit (rounded boxes, the timber material, baked
  occlusion, contact decals), the same warm fixtures and the same earthy palette with warm accents. The approach
  now leads to a door that matches the manor's craftsmanship instead of a castle wall.

Other weak points:
- Canopy undersides are still dark from directly below (34), although no longer black.
- Beyond ~30 m to the west and north the original style resumes behind the haze: white birches and faceted crowns
  (11, 32). It reads as a change of forest, not as a seam, but it is noticeable once you know.
- The plank door is the original. It reads (planks, two iron straps, a brass handle) but is the least crafted part
  of the portal.
- No wind or motion on foliage (none in the original either).

## 7. Cost

### Revision 1 (species and variants, batched) — the current state

Same method as below (phone quality, settled, max over 30 frames). Calls / triangles.

| Pose | Baseline (current game) | First version | **Revision 1 calls** (Δ vs baseline) | Revision 1 triangles (Δ vs baseline) |
|---|---|---|---|---|
| 11-southern-loop | 109 / 178 040 | 105 / 271 506 | **98** (−11) | 290 718 (+112 678) |
| 13-boslust-fork | 133 / 210 412 | 129 / 307 964 | **120** (−13) | 333 146 (+122 734) |
| 14-boslust-cut | 139 / 215 536 | 139 / 300 450 | **130** (−9) | 316 250 (+100 714) |
| 15-boslust-door-near | 154 / 222 462 | 151 / 306 974 | **142** (−12) | 314 146 (+91 684) |
| 30-approach-mid | 136 / 201 842 | 135 / 275 722 | **126** (−10) | 294 724 (+92 882) |
| 31-reverse-from-door | 51 / 97 452 | 55 / 156 270 | **47** (−4) | 159 446 (+61 994) |
| 32-side-busy | 116 / 173 144 | 118 / 256 646 | **109** (−7) | 258 104 (+84 960) |
| 33-oak-roots-near | 110 / 173 286 | 113 / 235 104 | **104** (−6) | 224 896 (+51 610) |
| 34-oak-canopy-below | 63 / 139 942 | 57 / 171 978 | **51** (−12) | 159 244 (+19 302) |
| 35-oak-side | 134 / 213 452 | 128 / 305 404 | **119** (−15) | 325 936 (+112 484) |
| 36-pine-silhouette | 124 / 176 142 | 122 / 265 674 | **115** (−9) | 279 182 (+103 040) |
| 37-rocks-near | 102 / 166 566 | 105 / 235 024 | **96** (−6) | 231 430 (+64 864) |
| 38-fern-verge-near | 108 / 176 204 | 111 / 233 598 | **102** (−6) | 219 246 (+43 042) |
| 39-door-oblique | 142 / 201 012 | 144 / 285 380 | **135** (−7) | 298 438 (+97 426) |
| 40-signpost-near | 134 / 200 908 | 128 / 288 200 | **121** (−13) | 317 784 (+116 876) |
| 41-species-mix (new) | 137 / 213 562 | — | **124** (−13) | 350 174 (+136 612) |
| 42-understory-near (new) | 105 / 185 840 | — | **100** (−5) | 237 954 (+52 114) |

- **Draw calls: below baseline at every pose.** The door view is 142, under the ~150 guide for the first time.
  - All trees and bushes cost 2 calls; all 712 plants cost 1.
  - The first version spent 12 calls on 3 tree variants and 3 plant kinds.
- **Triangles: +20 k to +137 k vs baseline.** The busiest views are 315–350 k, **above the 250 k guide**, and
  10–40 k above the first version.
  - Where it goes at the fork (one frame, after per-instance culling): foliage 110 k (88 trees and bushes, of
    which 14 near), plants 33 k (146 drawn), near bark 14 k.
  - Levers: plant range 22 → 16 m (−~12 k); near distance 18 → 12 m (−~25 k); fewer hazels (−~10 k).
- **Instances:** 69 trees + 31 bushes over 18 tree/bush geometries; 712 plants over 19 plant geometries.
- **Transfer:** JS bundle 292.2 kB gzip (baseline 268.5, first version 284.4). No downloaded assets.
- **CPU:** per frame three.js tests ~100 tree/bush and ~710 plant instances against the view (and the shadow
  camera at high quality). Distance/LOD updates run only after the camera has moved ≥ 0.25 m.
- **Fallback:** on browsers without `WEBGL_multi_draw` (Firefox; ~3 % of Android per web3dsurvey) three.js draws
  each visible instance separately, roughly 150–250 extra small calls in these views. Correct but slower; not measured on such a
  device.

### First version (before revision 1)

Phone quality, settled (1.5 s), max over 30 frames, same script and settings for both columns. Draw calls include
every pass three.js renders in a frame; at phone quality there is no shadow pass.

| Pose | Baseline calls | Baseline triangles | Proposal calls (Δ) | Proposal triangles (Δ) |
|---|---|---|---|---|
| 11-southern-loop | 109 | 178 040 | 105 (−4) | 271 506 (+93 466) |
| **13-boslust-fork** | 133 | 210 412 | 129 (−4) | 307 964 (+97 552) |
| 14-boslust-cut | 139 | 215 536 | 139 (0) | 300 450 (+84 914) |
| **15-boslust-door-near** | **154** | 222 462 | **151 (−3)** | 306 974 (+84 512) |
| **30-approach-mid** | 136 | 201 842 | 135 (−1) | 275 722 (+73 880) |
| **31-reverse-from-door** | 51 | 97 452 | 55 (+4) | 156 270 (+58 818) |
| **32-side-busy** | 116 | 173 144 | 118 (+2) | 256 646 (+83 502) |
| 33-oak-roots-near | 110 | 173 286 | 113 (+3) | 235 104 (+61 818) |
| 34-oak-canopy-below | 63 | 139 942 | 57 (−6) | 171 978 (+32 036) |
| 35-oak-side | 134 | 213 452 | 128 (−6) | 305 404 (+91 952) |
| 36-pine-silhouette | 124 | 176 142 | 122 (−2) | 265 674 (+89 532) |
| 37-rocks-near | 102 | 166 566 | 105 (+3) | 235 024 (+68 458) |
| 38-fern-verge-near | 108 | 176 204 | 111 (+3) | 233 598 (+57 394) |
| 39-door-oblique | 142 | 201 012 | 144 (+2) | 285 380 (+84 368) |
| 40-signpost-near | 134 | 200 908 | 128 (−6) | 288 200 (+87 292) |

- **Draw calls:** at or below baseline at the fork, cut, door and approach. The door view goes from 154 to 151,
  just above the ~150 guide. The reverse view adds 4 and stays far below the guide.
  - Where the calls go in the sample (door view, one frame): trees 9 (3 variants × near wood + near leaves +
    merged far); understory 3; new static materials 3; soft light pool 1.
  - The savings: the zone's old vegetation chunks shrink or vanish, the canvas frames are replaced by batched
    ones, and zone stumps move into the batch.
  - Most of the remaining door-view calls are the original forest's per-chunk instancing outside the zone,
    which is out of scope here.
- **Triangles:** +58 k to +98 k per view; the busiest views reach ~308 k, **above the 250 k guide.**
  - Per tree: oak 4.8 k / 4.1 k triangles near, 1.4 k / 1.2 k far; pine 3.9 k near, 0.95 k far.
  - At the door about 87 k of the frame is sample trees (8 near, 37 far, after frustum culling) and 11 k
    understory. The forest-chunk batch, which holds the new rock, wall and frame plus the original forest
    features, is 13 k.
  - Before per-instance culling the door view was 530 k.
  - Levers if a phone struggles: near distance 18 → 12 m (−~30 k); oak majors at detail 1 near (−~25 k);
    fewer understory clumps.
- **Transfer:** JS bundle 268.5 → 284.4 kB gzip (+15.9 kB, +5.9 %), from the code-built kit. No new files are
  downloaded: no GLB, no images.
- **Textures:** five more uploaded, only when the sample is built: bark 128×256, leaf dabs 128×128 and rock
  strata 128×128 (new canvases), plus two of the step-2 art kit's shared canvases. ≈0.1 MPx more in the scene (≈0.5 MB GPU with mipmaps).
- **Memory:** scene geometry buffers 16.8 → 19.7 MB (+2.9 MB: tree models, instance buffers, batched rock and
  wall). Uploaded geometries 74 → 88 and textures 15 → 21 at the door view.
- **Build time** (SwiftShader, one run each, noisy): estate load 1.19 → 1.47 s.
- **CPU per frame:** the instance culling loops over 69 trees and ~390 understory items. It is skipped entirely
  while the camera is still.
- **No phone-performance claim is made.** All numbers come from software rendering on a desktop CPU. Frame time
  on a real phone is unmeasured.

## 8. Verification

### Revision 1

Code under test: commit `0159007`.

| Kind | Result |
|---|---|
| Typecheck, production build | clean / OK |
| Unit tests | **89 / 89**, including 6 new species checks. They check: every species × variant within budget with roots below ground; the three variants of each species are different silhouettes; species told apart by shape (birch narrow, beech taller than oak, pine crown highest); bark mapped into its atlas column; bushes small and grounded; every plant kind has ≥ 3 variants, all batch-compatible. |
| Browser: `boslustSample` suite | **13 / 13**. Unchanged contract: the same 155 colliders, 15 interactables and original lights in the zone, and the 6 495 vegetation instances outside it. The entrance sequence works by walking, save/restore, lighting, reduced motion and review isolation are covered. The culling check now reads how many batched instances three.js actually drew per pose (fork: 85 trees/bushes, 136 plants). |
| Browser: full regression suite | **96 / 96** on this build. |
| Normal game | unchanged: no game code outside the `ext=sample` path was touched in this revision. |
| Clay diagnostic | fixed for batched meshes (see §9, item 14); revision captures recaptured. |
| Walkthrough | [`rev1/walkthrough.webm`](exterior-sample/rev1/walkthrough.webm), same route. Sampled frames show the species mix along the path and lit lanterns throughout. |
| Real device | **not done.** |

### First version

Code under test: commit `eea6ab8` (later commits on this branch change documents and evidence only).

| Kind | Result |
|---|---|
| Typecheck | clean |
| Unit tests | **83 / 83**, including 10 new `tests/woodkit.test.ts`. They check: tree triangle budgets per LOD; both LODs share the crown bounds and keep roots below ground; oak and pine differ in shape (crown width/height, crown height on the trunk); complete attributes with no NaNs; rocks partly buried with few planes; `twoSided` reverses winding and keeps normals; foliage normals face up; taper; the vegetation drop filter leaves every kept entry identical to the unfiltered build; zone fade. |
| Production build | OK |
| Normal game unchanged | Base mode at the step-1 poses 13, 14 and 15 gives identical draw calls and triangles to the pre-change capture (154 / 222 462 at the door). The pixel difference is **0** (mean absolute difference 0, no pixel over 24). |
| Browser: `boslustSample` suite (new, `scripts/e2e.mjs`), internal-helper walkthrough | **13 / 13.** Details below the table. |
| Browser: full regression suite on the final build | **96 / 96** (`node scripts/e2e.mjs`). The 83 earlier checks (full normal-control route home → finale, lighting L1–L6, collision, saves and migration, touch, WebGL-failure paths, render budgets, living-room sample and `?review=living`) plus the 13 new ones. |
| Moving walkthrough | [`walkthrough.webm`](exterior-sample/walkthrough.webm): autopilot steering (the joystick's move vector) past the signpost, up the path, into the cut, turning round. Reviewed as frames every 5 s: the composition reads fork → sign → door, lanterns are lit throughout, and no tree, root or rock is missing in any sampled frame. At a software frame rate of a few fps it cannot rule out a single-frame pop; the per-frame culling is covered by the culling checks instead. |
| Real device | **not done.** Pending owner review on a phone. |

What the 13 `boslustSample` checks cover:
- **Gameplay contract against the original:**
  - Zone collision identical: 155 colliders (trees, stumps, cut walls, headwall, signpost, stair).
  - The same 15 interactables.
  - Every original light kept; only the two fixed lanterns added.
  - Every vegetation instance outside the zone identical (6 495 instances, positions and colours).
  - The reticle targets the same objects from the same poses (signpost, inscription, lock, door).
- **Entrance by walking:** fork clue → inscription → cover → 2413 → door → down the stair
  under the hill. This uses the test helpers' walking and acting (the ordinary movement and action code, driven
  by script), not touch input.
- **Save and restore:** underground and on the approach; the sample world is rebuilt on reload.
- **Lighting and culling:** at the fork, cut mouth, door and reverse view, the entrance lanterns hold light slots
  where expected, and trees and understory are drawn.
- **Reduced motion:** the lanterns stay steady and lit.
- **No console errors.**
- **Review mode** (phone context: touch, 844×390):
  - Starts at the fork with the sample.
  - The bar toggles old/new at the same pose.
  - The temporary progress opens the cipher cover.
  - The player's own save, backup and settings are byte-identical afterwards.
  - The normal entry is unchanged afterwards.
  - Inputs here were taps on the start card and bar (visible input); walking used the helpers.

What is **not** verified: real-device rendering, colours on a phone screen, frame time, touch walking of the whole
approach by a person, and the high-quality (shadow-map) path beyond the absence of errors.

## 9. Iteration log (what was inspected and corrected)

1. **Ground tint invisible.** The first build's forest-floor colours did not show: the grass texture multiplies a
   strong green. Fixed by authoring vertex colour as target ÷ texture mean.
2. **Canopies too dark and pillow-like.** Eleven big lumps per oak read as stacked cushions with black undersides.
   Rebuilt as major masses with clumps on their outer side; foliage normals biased up; lighter values.
3. **Roots like spider legs.** First roots splayed 3 m across the path. Then short roots tore against the trunk's
   buttress lobes. Now the roots grow from the trunk axis (no lobes) and dive steeply.
4. **Black grass blades.** DoubleSide back faces got flipped normals. Fixed with duplicated triangles.
5. **The cut showed bare hill slopes** between floating boulders, with invisible walls. Rocks are now placed from
   their bounding boxes flush with the colliders and stacked until they clear the hill surface behind.
6. **The BOSLUST sign was hidden** by a shingled canopy over the door. Canopy removed, frame moved right round the
   opening; the sign now sits on the wall above the lintel, on an oak board.
7. **Headwall read as a brick bunker:** first pale ashlar, then cream blocks with dark joints, then stones sinking
   behind the backing. Now irregular rubble on a recessed backing, darker low, rock masses and turf around it.
8. **530 k triangles at the door.** Instances behind the camera were drawn. Per-frame frustum culling, a cheaper
   far LOD with the same layout and an 18 m near distance brought it to ~300 k.
9. **Draw calls above baseline** (+6). Far LOD merged into one call per variant, entrance materials consolidated,
   batcher shadow flags aligned, zone stumps rebuilt into the batch, redundant canvas frames dropped.
10. **The review start pose was rejected by the game** (the "fork" checkpoint stands inside the signpost's
    collider), so it fell back to the BOSLUST checkpoint. The review now starts a step south-west of the signpost.
    The checkpoint itself is unchanged (normal game untouched).

### Revision 1

11. **Hazel read as a pom-pom on bare sticks** (a small tree, a ball crown). It is now leafy from knee height,
    with clumps pushed out from the stems and more spread.
12. **Foxglove bells too small** to register at walking distance. They are now 60 % larger.
13. **Triangles rose with the plants** (fork 352 k). Plant range was trimmed 26 → 22 m (grass and anemone 20 m;
    foxglove kept at 28 m as the accent) and fern segments 9 → 7: fork 333 k.
14. **The clay diagnostic still showed colour** on the batched meshes: three.js applies batch colours whatever the
    material. The capture script now whitens them for the clay pass; the revision's clay images were recaptured.
15. **Unit-test thresholds** were set before the beech existed. One beech variant's far LOD is 1 612 triangles, so
    the far budget is now 1.8 k (stated, not hidden), and the hazel's lowest foliage threshold is 0.9 m.

## 10. Build and URLs

Sample code: commit `eea6ab8`; the documents and evidence were added in `4fee5ec`, the commit CI built and
deployed. The build id on the review start card and in Pauze is the short commit hash of the deployed build, so
it shows `4fee5ec` or a later docs-only commit on this branch.

### CI and deployment

**CI:** GitHub Actions "Build and deploy to GitHub Pages", run #14
([37379068072](https://github.com/Algolon/Feh-Lu-We/actions/runs/37379068072)), for commit `4fee5ec`.
- **Build job:** typecheck, unit tests, production build and artifact upload all succeeded.
- **Deploy job:** succeeded.

The commit that records this result is docs-only. It redeploys the same game code under its own build id.

**Live delivery is not verified from here.** The authoring environment's proxy refuses `algolon.github.io`
(`CONNECT tunnel failed, response 403`), so the live page was not loaded. To confirm on your phone:
1. Open the review URL.
2. Check that the build id on the review start card starts with `4fee5ec` or a later commit of this branch.

| | |
|---|---|
| Review (exterior) | `https://algolon.github.io/Feh-Lu-We/?review=boslust` |
| Review with FPS overlay | `https://algolon.github.io/Feh-Lu-We/?review=boslust&debug=1` |
| Review (interior, unchanged) | `https://algolon.github.io/Feh-Lu-We/?review=living` |
| Normal game (unchanged) | `https://algolon.github.io/Feh-Lu-We/` |

### Limitations

- Real-device performance and colour are unmeasured, and so is touch walking of the whole route by a person.
- Triangles are above the 250 k guide in the busiest views (~300 k); levers are listed in §7.
- Weak spots, carried from §6:
  - Close-up root junctions.
  - Canopy undersides from directly below.
  - The headwall's rectangular silhouette in clay.
  - The path's hard edge.
  - The original plank door.
  - Visible style change beyond ~30 m west and north.
- Repetition is reduced (four species, three variants each, ±6 % height), but variants are still recognisable
  when two of the same stand side by side; three per species is a floor, not a ceiling.
- High quality (shadow maps): the batched meshes cast without errors, but no capture set was reviewed at that
  quality.
- Batched rendering relies on `WEBGL_multi_draw` for its low call count; without it (Firefox, some Android) it is
  correct but issues one call per visible instance.
- Hazel at mid distance can still read as a stacked cluster ("pom-pom"); holly is a dark blob from afar.
- **Nothing here is propagated beyond the zone, and nothing is approved.** Estate-wide rollout waits for the
  owner's review.
