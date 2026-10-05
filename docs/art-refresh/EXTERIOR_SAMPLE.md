# Art refresh, step 3 — exterior sample: the approach to BOSLUST

**Status: proposed, not owner-approved.** This sample is reachable only through the review entry below (or the
`?ext=sample` flag). The normal game still builds the original woodland, cut and entrance. Nothing outside the
sample zone has new assets. Nothing has been propagated to the rest of the estate.

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
enough woodland on all sides that the boundary falls 15–35 m from the route. Inside it:

| Area | Original | Sample |
|---|---|---|
| Trees | 69 cone/blob trees (oak, birch, pine kinds) | the same 69 positions and colliders; broadleaf oak (two variants) and Scots pine |
| Undergrowth | blob ferns, shrubs, flowers, toadstools, grass tufts | fern, broadleaf ground plant, grass clumps, white wood anemones, leaf litter, verge stones |
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

- **A. Broadleaf oak** (hero variant + one restrained variation).
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
- **E. Understory and verge.** Fern (nine arching fronds with alternating pinnae), a hosta-like ground plant, grass
  clumps, white wood anemones, fallen leaves under the oaks, small verge stones. Clustered with negative space;
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

- **Instancing with per-frame culling** (`LodInstances`, `NearInstances`). One InstancedMesh per variant and LOD.
  Every frame, from `scene.onBeforeRender` (after the camera update, before three.js projects the scene), the
  instances inside the camera frustum are written into the near or far mesh by distance (near < 18 m, with 3 m
  hysteresis; far up to 115 m). Nothing outside the view is drawn, and nothing lags a quick turn. Nothing is
  rewritten while the camera is still.
- **Far LOD in one draw call:** wood and foliage merged on the foliage material, the wood's vertex colours
  pre-multiplied by bark ÷ leaf colour. Both LODs keep the same masses, clumps, limbs and roots (coarser far away),
  so the switch does not change the silhouette and roots never disappear.
- **Understory** is shown within 24–28 m and shrinks to nothing over the last 6 m instead of popping.
- **Shadows (high quality only):** trees cast from separate far-LOD proxies on layer 1, which only the sun's shadow
  camera renders. Trees behind the viewer still cast into view.
- **Thin leaves:** two-sided by duplicated triangles with shared up-biased normals and a front-side material.
  `DoubleSide` flips back-face normals, which made half of every clump black.
- **Old visuals in the zone are generated, then discarded** (`Vegetation.drop`), so the random sequence, and with
  it every tree and plant outside the zone, stays exactly as before. The cut and headwall are built by the
  original code on a discarded batcher so their colliders are created by the same calls.
- **Static parts** (rocks, stones, wall, frame, stumps, litter, flowers) are batched into the forest chunk and share
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
    models, so repetition is visible in a row (31).
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

## 10. Build and URLs

<!--BUILD-->
