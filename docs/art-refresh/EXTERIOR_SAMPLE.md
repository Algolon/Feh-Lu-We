# Art refresh, step 3 — exterior sample: the approach to BOSLUST

**Status: proposed, not owner-approved.** This sample is reachable only through the review entry below (or the
`?ext=sample` flag). The normal game still builds the original woodland, cut and entrance. Nothing outside the
sample zone has new assets except the backdrop row directly behind its stretch of fence (§2). Nothing has been
propagated to the rest of the estate. Passing automated checks is not owner approval.

**Consolidation pass (revision 2, this version).** No new species, rooms or quests; the existing woodland was
refined, made to render reliably without `WEBGL_multi_draw`, and brought within the phone guide:
- **Rendering paths** (§4): multi-draw (two batched draw calls for all vegetation) or, where the extension is
  missing, an instanced fallback (one call per visible geometry, culled per instance). Forced with `?multidraw=0`.
- **Budget** (§7): all five measured views are now within 150 calls and 250 k triangles on the multi-draw path
  (busiest 248.7 k, was 350 k). The fallback draws the same triangles but 160–175 calls — over the call guide;
  the cause and the next remedy are in §7.
- **Shapes** (§3): broadleaves grown from a branch skeleton (limbs visible, clusters at the branch ends, gaps),
  roots formed by the trunk's own buttress flare, a looser Scots pine, multi-stem hazel, a readable holly.
- **Transitions** (§3): a soft path verge, a headwall that steps down into the hill, and the backdrop row beyond
  the fence in the sample style.
- Evidence: [`exterior-sample/consolidation/`](exterior-sample/consolidation/). Phone check: §1.1.

**Revision 1 (owner feedback: "3–4 variations of each tree, grass, bush and plant, and several species").**
Four tree species (oak, beech, silver birch, Scots pine) with three variants each, hazel and holly with three
variants each, six plant kinds with three or four variants each, placed by simple ecology; batched rendering.
Its captures are in [`exterior-sample/rev1/`](exterior-sample/rev1/); the first version's in
[`exterior-sample/`](exterior-sample/).

Companion documents:
- [`STYLE_TARGET.md`](STYLE_TARGET.md), including the step-2 revisions and the step-3 notes at the top.
- [`REVIEW_CHECKLIST.md`](REVIEW_CHECKLIST.md).
- [`INTERIOR_SAMPLE.md`](INTERIOR_SAMPLE.md) (step 2; its review mode `?review=living` is unchanged).
- Evidence for this step: [`exterior-sample/`](exterior-sample/).

## 1. How to review it on a phone

1. Open **`https://algolon.github.io/Feh-Lu-We/?review=boslust`**. The build id is shown on the review start card
   and in Pauze; check it against §10.
2. Tap **Start review**. You start a step south-west of the fork signpost on the southern loop, looking past the
   signpost up the side path towards the hill, with the ordinary touch controls.
3. Walk the side path into the cut and up to the door. Then turn round and look back, and step off the path to the
   sides.
4. The **Review** pill at the top opens three toggles and one line of information:
   - **Toon oud / Toon nieuw:** rebuilds the approach with the original or the new assets, at the same spot (about
     a second).
   - **Licht:** the lighting treatment, new or original (in the zone: the exterior woodland treatment).
   - **Tonemap:** ACES (current) or Neutral. Exposure stays 1.15.
   - **tekenen: multi-draw / instanced fallback (forced)** — which vegetation rendering path this device is
     using, and the build id.
5. **Temporary progress, review only.** So that you can try the entrance, this sandbox starts with the route
   restored and the letter strip in the bag (what the normal game requires before the cipher cover opens). The
   cipher answer is unchanged. The normal game's gates are unchanged.
6. **Isolation.** The review runs on a temporary in-memory save. Your own save, backup save and settings are never
   read, written, reset or migrated (tested; §8). The living-room review `?review=living` still works as before.

| Purpose | URL |
|---|---|
| Review (normal path on this device) | `https://algolon.github.io/Feh-Lu-We/?review=boslust` |
| Review with FPS overlay | `https://algolon.github.io/Feh-Lu-We/?review=boslust&debug=1` |
| **Forced fallback** with FPS overlay | `https://algolon.github.io/Feh-Lu-We/?review=boslust&multidraw=0&debug=1` |
| Forced fallback, no overlay | `https://algolon.github.io/Feh-Lu-We/?review=boslust&multidraw=0` |

`?multidraw=0` hides `WEBGL_multi_draw` from the WebGL context before the renderer is created, so the device
genuinely takes the fallback path (§4). The `?debug=1` overlay shows FPS, calls, triangles and `veg multi-draw`
or `veg instanced fallback (forced)`.

Developer flags, all opt-in: `?ext=sample` (build the new approach), `&light=sample` (lighting treatment),
`&tm=neutral`, `&multidraw=0`. They work with `?autotest=1` for the capture and test scripts.

### 1.1 Phone-check guide (to be filled in by the owner; no device results exist yet)

Use the FPS overlay URLs above. Hold each view still for ~10 s before reading the FPS, then move.

| Item | Normal path | Forced fallback |
|---|---|---|
| Phone model, OS version, browser and version | | |
| Path shown in the overlay (`veg …`) | | |
| Fork (start pose): median FPS / p95 frame ms | | |
| Doorway (stand on the threshold, face the door): FPS / p95 | | |
| Busy woodland (step off the path west of the fork, face north-east): FPS / p95 | | |
| Turning on the spot at the fork (full circle, slow then fast): stutter? | | |
| Walking the side path into the cut: do trees visibly change shape (LOD) at ~13–19 m or ~23–29 m? | | |
| Small plants appearing/disappearing near the path edge: noticeable? | | |
| Entering BOSLUST (cover → code → door → stair) and coming back out: hitches? | | |
| Sustained: walk fork → door → back for 2 minutes: does the frame rate fall (heat)? | | |
| Anything that looks wrong (floating, flicker, black foliage, missing trees) | | |

Compare with the same views in the original assets (Review → Toon oud) on the same phone.

## 2. Scope

The zone is plan X 38–88, Z 0.6–48 (`src/world/boslustZone.ts`): the fork, the side path, the cut, the entrance and
enough woodland around them that the boundary is 16 m west, 25 m east and 30 m north of the route (south is the estate wall). Inside it:

| Area | Original | Sample |
|---|---|---|
| Trees | 69 cone/blob trees (oak, birch, pine kinds) | the same 69 positions and colliders; oak, beech, silver birch and Scots pine, three variants each, grown from branch skeletons (rev. 2) |
| Bushes | blob shrubs | hazel (multi-stem) and holly, three variants each, set back from the path, no collision |
| Undergrowth | blob ferns, shrubs, flowers, toadstools, grass tufts | fern ×3, grass ×4, bilberry ×3, foxglove ×3, lily of the valley ×3, wood anemone ×3; leaf litter, verge stones |
| Stumps | cylinders | the same positions and colliders; flared stumps with a sawn top |
| Cut | dry-stone block walls with moss blobs | courses of large rock, stacked into the hill; the same collision boxes |
| Entrance | flat ashlar wall with a parapet ("battlements") | rubble headwall whose top steps down into the hill at both ends, turf and earth over it, rock masses stepping up the slope, oak door frame, lanterns; the same collision (rev. 2) |
| Signpost | box arms | jointed oak post, arrow arm, forked arm; the same position, hitbox and collision |
| Ground | lawn-green terrain colour | forest floor: litter under crowns, worn soil grading out from the path, rock dust at the cut |
| Path | 1.9 m strip, orange, hard edge | slowly wandering width, earthier soil colour, and a soft verge band that fades the edge into the floor, with earth patches (rev. 2); unchanged outside the zone |
| Backdrop beyond the south fence | visual-only cone/blob trees | the nearest row behind the zone's stretch of fence (x 38–88, z −9…−1.5) uses the sample's trees, same positions (rev. 2); the rest of the outer ring is unchanged (tested) |

Not changed: puzzles, the cipher and its clues, the inscription text, the BOSLUST sign text and position, the
tablet and lock positions, the door, the stair, the underground, every collider, every interaction id, every
original light. The forest outside the zone and the outer ring beyond the backdrop row are byte-for-byte the same
instance data (tested).

## 3. What was built

All code-built (`src/world/woodkit.ts`, `src/world/boslustSample.ts`, `src/world/vegbatch.ts`), deterministic,
no downloaded assets. Current state after the consolidation pass; what changed from revision 1 is marked.

- **Species mapping (rev. 1):** the original tree kinds keep their positions and colliders. "birch" positions
  become silver birches and pines stay pines. About a third of the oaks become beech (by a position hash). Each
  tree gets one of three variants by a second hash, so neighbours rarely match. Height varies ±6 % per tree.
- **Broadleaves grown from a skeleton (rev. 2).** Each oak, beech and birch is grown once as a skeleton — trunk,
  limbs at varied heights, bearings, thicknesses and attachment angles, side branches — and foliage clusters are
  placed at the branch ends and part-way along some branches. The same skeleton is emitted at three LODs.
  - Clusters are displaced, gently flattened spheres of different sizes; overlapping ones form irregular crown
    masses with sky gaps between branch ends, through which limbs show. Triangles buried inside a neighbouring
    cluster are removed. Normals lean toward the crown centre and up (undersides shade green, not black); vertex
    colour bakes occlusion and a small per-cluster value step so clusters separate.
  - **Oak ×3:** a stout trunk dividing low into five or six heavy limbs that spread wide and nearly level; broad,
    irregular crown. Variant 2 is an old oak with long low limbs.
  - **Beech ×3:** a straight smooth grey trunk with a leader high into the crown; limbs leave it at several heights,
    steeper and shorter toward the top, ending in flatter sprays: a tall, layered, domed crown.
  - **Silver birch ×3:** a slender white trunk, dark at the foot, with a leader; many thin branches rising then
    drooping, small clumps hanging from them: narrow and airy.
  - **Roots (rev. 2):** formed by the trunk itself. Toward the ground the trunk's rings swell into five or six
    buttress ridges at irregular bearings and strengths; they are widest at ground level, run up into the trunk,
    and narrow again below the ground, so on a slope the downhill side shows them diving into the soil. No
    separate root tubes, no junctions, no visible tips (the first version's tube roots read as fins).
- **Scots pine ×3 (rev. 2):** a tall trunk with a gentle bend, bare for more than half its height, grey-brown low and
  warm orange above, a few dead stubs; branches in irregular whorls with gaps, longer on the light side, nearly
  level and slightly upturned, each ending in two to four ragged, tilted clumps at different heights; a rounded
  top rather than a spire. Its crown starts 6–8 m up.
- **Hazel ×3 (rev. 2):** seven to nine thin stems of different lengths rising from one stool in a loose vase and
  arching over, some with side shoots; small rounded leaf clumps alternate along each stem from knee height, with
  gaps between the stems.
- **Holly ×3 (rev. 2):** a short stem and side branches under an upward-tapering mass of spiky clumps with lighter,
  warmer tops (glossy leaves catching light) and a few red berry clusters; its leaf tint was lifted from `#3d5a33`
  to `#46663a` so it no longer reads as a dark blob (the one material correction of this pass).
- **Plants (rev. 1):** fern ×3, grass ×4, bilberry ×3, foxglove ×3, lily of the valley ×3, wood anemone ×3,
  placed by simple ecology (bilberry under pines, lily and anemone under broadleaves, foxgloves in light openings
  near the path, wispy grass on the verge, sedge at tree feet, ferns in hollows; patches mostly one variant).
- **One tree material (rev. 2):** a 512 × 256 atlas holds the three barks (fissured, smooth, birch) and the leaf
  dabs side by side. Bark UVs map into their column; foliage UVs carry a marker and repeat inside the leaf column
  (the shader wraps them, with gradients that keep mip selection seamless). So a whole tree — bark and leaves — is
  one geometry per LOD, and one instance colour tints both (bark colours are pre-multiplied by bark ÷ leaf tint).
- **Rocks.** Convex hulls of a few points on a squashed ellipsoid: broad deliberate planes, creased normals, each
  plane its own value, moss on upward faces near the top. In the cut they are placed by measured bounding box so
  the face toward the walkway is 3 cm proud of the original collision box, stacked until they cover the hill.
- **Hill, cut and entrance.**
  - Cut sides: rock courses with a slight batter; gatepost boulders at the mouth; outcrops around the door.
  - **Headwall (rev. 2):** rough-coursed rubble on a recessed dark mortar backing. Its top is at full height only
    over the door, sign and tablet (x 61.05–64.95); it steps down 0.42–0.45 m and then 0.95–1.0 m toward both
    ends, where earth-and-turf mounds come over the lower steps and run back into the slope (the hill is
    3.0–3.4 m high just behind the wall). Rock masses hold the ends and a second, smaller rock above and behind
    each steps up into the slope; a corner rock on each side sits on the cut-wall courses, flush with the cut's
    collision faces, so no vertical wall edge shows. The stones' never-visible back faces are not built.
  - Portal (unchanged): oak posts on stone pads, a heavy lintel with pegs, a stone threshold, an oak board framing
    the original BOSLUST sign, a stone surround behind the tablet, roots over the top clear of the sign, tablet
    and lock, two wrought-iron lanterns with a soft warm pool on the threshold.
- **Path verge (rev. 2).** On both sides of the path inside the zone, a band continues the path's own surface
  (same dirt texture, same tint, UVs continuing across the edge) and fades out over an irregular 0.55–1.25 m; soft
  earth patches lie beside the path here and there; the path's width wanders slowly (no zigzag at its 1 m
  sampling); the terrain's worn-soil band was lightened (`#665238` → `#7a6040`) so it grades from the path into
  the forest floor instead of outlining it. Verge grass is spaced irregularly (0.4–0.95 m) and leaf litter may
  drift to 0.4 m from the centreline. Nothing added here has collision. The opaque path itself is unchanged, so the
  route reads as before.
- **Signpost.** Chamfered oak post, arrow arm, forked arm with a carved leaf; no words; same position, hitbox and
  collision.
- **Ground.** Terrain vertex colours in the zone are authored as target albedo ÷ the grass texture's mean, faded in
  over 16 m at the zone edge.
- **Contact grounding.** Soft multiply decals on the terrain slope under tree feet, stumps, rocks, the signpost and
  the headwall foot (one draw call); phone quality has no shadow maps.

## 4. Pipeline and renderer changes (all reversible, all behind the flags)

- **Two rendering paths behind one interface** (`src/world/vegbatch.ts`; rev. 2). The tree and plant code only
  sets, per instance, a geometry (LOD), visibility and matrix.
  - **Multi-draw** (when the context has `WEBGL_multi_draw`): one three.js `BatchedMesh` for all trees and bushes
    (36 geometries: 12 tree and 6 bush variants × LODs) and one for all 19 plant geometries — **two draw calls**
    for the whole woodland. three.js culls each instance against the view, and separately against the shadow
    camera.
  - **Instanced fallback** (no `WEBGL_multi_draw`, or `?multidraw=0`): one `InstancedMesh` per geometry. In a frame
    where the camera, the sun or an instance changed, the instances are culled against the view and the visible
    ones are packed into the front of their mesh's instance buffer; a buffer is uploaded only when its visible set
    changed (tested: an idle camera uploads nothing). One call per geometry with something in view. With shadow
    maps on, an instance is also kept if its shadow can reach the view (its bounding sphere swept down the sun
    direction), so it draws a superset of the multi-draw path's set (tested: still culls).
  - Without this fallback, three.js's own `BatchedMesh` path issues one draw call per visible instance:
    measured 141–280 calls at the five views on the final build (§7).
  - **Capability detection** (`src/core/caps.ts`): `renderer.extensions.has('WEBGL_multi_draw')` on the live
    context, never the browser name. `?multidraw=0` wraps `HTMLCanvasElement.getContext` before the renderer is
    created so the context reports the extension as missing; the whole renderer then really runs without it.
  - The paths produce the same instances, geometry, colours and triangles at the same pose (tested at five poses at
    phone quality; pixel comparison in §8).
- **Three LODs from one skeleton** (rev. 2): near < 16 m, mid 16–26 m, far beyond (3 m hysteresis each way, so a
  tree switching at 13 m on the way in switches back only at 19 m). Trees are drawn to 115 m, bushes to 50 m.
  - Near: full skeleton, icosphere clusters (80 triangles; small ones 32), trunk flare in dense rings.
  - Mid: limbs only (no side branches), clusters as octaspheres (32) or icosahedra (20), filler clumps dropped.
  - Far: the outline clusters plus the largest others (14 for trees, 10 hazel, 8 holly), slightly enlarged; trunk
    and limbs in a few sides. Bushes share one geometry for mid and far.
  - At every LOD the clusters that define the outline (top-, bottom- and outermost) are kept, so the crown's
    extent stays within 15 % (tested for every species × variant; a birch failed this at first and was fixed).
- **Per-frame work:** LOD and range selection run only after the camera has moved ≥ 0.3 m (trees) or 0.25 m
  (plants). Culling runs after the LOD choice in the same frame (as three.js does in the multi-draw path).
- **Plants** fade by shrinking over the last 4 m of a per-kind range (`PLANT_SHOW`: grass 13 m, bilberry 13,
  lily 11, anemone 12, fern 16, foxglove 24).
- **Shadows (high quality only):** trees and bushes cast; see the fallback note above.
- **Thin leaves:** two-sided by duplicated triangles with shared up-biased normals and a front-side material.
- **Old visuals are generated, then discarded** (`Vegetation.drop`) in the zone and the backdrop strip, so the
  random sequence, and with it every tree and plant elsewhere, stays exactly as before. The cut and headwall are
  built by the original code on a discarded batcher so their colliders are created by the same calls.
- **Static parts** (rocks, stones, wall, frame, stumps, litter, turf) are batched into the forest chunk on three
  materials; the path verge is one transparent mesh (one call).
- **Lighting treatment** (`env.ts`, under `light=sample`, only in the zone): unchanged in this pass — a cooler,
  greener haze starting nearer, slightly cooler sky fill, warmer earth bounce, 8 % more sun; ACES and exposure
  unchanged. No fog or darkening was added to hide geometry.
- **Diagnostics** (no effect on rendering): `scene.userData.vegPath`, `vegStats()`, `vegLodAt(x, z)`, `vegList()`;
  the debug overlay and the review bar show the path.

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

**Consolidation pass (revision 2):** [`exterior-sample/consolidation/`](exterior-sample/consolidation/), all
captured from the final tested source with the same script, poses and settings as revision 1:

| Folder | Content |
|---|---|
| `compare/` | revision 1 over revision 2 (game): fork 13, approach 30, door 15, reverse 31, busy woodland 41, and the close-ups oak roots 33, pine 36, hazel/holly 43 (new pose; revision 1 captured from a build of `6bb5275`), path verge 38, plus cut 14, door oblique 39, southern loop 11, side 32 |
| `compare-clay/` | the same pairs in clay for the shape changes (13, 14, 33, 35, 36, 41, 43) |
| `fallback/` | multi-draw over forced fallback (`?multidraw=0`) at fork 13, door 15 and busy 41, with pixel differences (§8) |
| `proposal/` | every pass of the revision-2 poses (`<pose>.jpg`, `-neutral.jpg`, `-clay.jpg`) |
| `metrics/` | the raw measurement output (`ext-measure.mjs`) behind §7, for baseline, revision 1, revision 2 and both paths |
| `walkthrough.webm` | fork → side path → turning round in the cut → door → cover opened with the game's action, code entered on the panel → through the door and down the stair (software rendering, scripted steering) |

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

### Consolidation pass (revision 2), judged from the captures, clay first

**Stronger:**
- **Trees read as grown, not assembled.** In clay (13, 35, 41) limbs leave the trunk at different heights and
  angles and carry the foliage; there is sky between clusters and limbs show through the gaps. Species separate
  by structure in clay: oak low and spreading on heavy limbs, beech tall and layered on a leader, birch narrow
  and drooping, pine bare-trunked with a high, ragged, rounded crown.
- **Roots** are part of the trunk (33): irregular buttress ridges that run into the soil. No fins, no seams.
- **Hazel** reads as a multi-stemmed shrub with gaps (43); **holly** as a dense evergreen cone with lighter tops
  and berries instead of a dark blob.
- **The path edge** dissolves into worn soil and floor (38, 13) while the route stays obvious.
- **The entrance** no longer ends in vertical wall edges: the top steps down, turf and earth come over it and rocks
  climb the slope (14, 30, 39).
- **Reverse views** (31) show the sample's trees behind the fence instead of the old cone pines.

**Still generated-looking:**
- **Clusters are polyhedra.** Near clusters are 80-triangle spheres; within ~5 m (overhead in 13, 41) their facets
  and smooth leaf texture read as low-poly blobs, not leaves. The style accepts this, but it is the weakest close
  view. The next step would be cards of leaf texture with alpha on near clusters (more fill cost) or an authored
  hero oak (STYLE_TARGET step-2 revision 8: an authored asset route when a generated one stays weak); neither was done.
- **Bark texture** on the hero oak at 1 m (41, right edge) shows a diamond lattice from the fissure texture's
  crossing strokes.
- **The nearest hazel** in 43 still reads layered (clusters alternate along arching stems, but from above they
  stack).
- **The headwall's centre top** stays a straight line over the door, sign and tablet (it has to carry the sign);
  only its ends are integrated. In clay (14) the wall still reads as a built rectangle in the middle.
- **One original stump** (73.0, 6.0) now sits inside a beech's root flare (43): stumps and trees were scattered
  independently and both keep their colliders, so it was not moved.
- **Boundary:** west and north of the zone the original faceted crowns resume beyond ~30 m (11, 32). The backdrop
  row fixes only the view south over the fence.
- **Popping:** LOD bands are 16 m and 26 m with 3 m hysteresis and the outline clusters are kept, but mid/far
  crowns are coarser polyhedra; a change of surface at ~13–19 m and ~23–29 m may be visible on a phone. The
  software-rendered walkthrough samples a few frames per second and cannot rule this out (§8).


### First version (kept for the record; several points are addressed above)

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

### Consolidation pass (revision 2) — the current state

Method: `node scripts/ext-measure.mjs "<query>" <label>` — phone viewport 844 × 390, DPR 1, quality "low" (the
phone default, no shadow maps), fresh state per pose (reload), 1.5 s settle (LOD state settled), then the maximum
over 30 real frames. Calls and triangles are read from the renderer (`renderer.info`), as are the drawn instances
per batch (after culling). Everything here is software rendering (SwiftShader) on a desktop CPU: these are
workload measures, **not frame rates or phone performance**.

Detected capabilities in this environment: WebGL2, `WEBGL_multi_draw` present (renderer "ANGLE (Google, Vulkan
1.3.0 (SwiftShader Device (Subzero)))"); with `?multidraw=0` the extension is reported missing and the fallback runs.

**Calls / triangles at the five measured views:**

| View (pose) | Baseline: current game | Revision 1 | **Revision 2, multi-draw** | **Revision 2, forced fallback** | three.js's own per-instance fallback* (calls) |
|---|---|---|---|---|---|
| fork (13) | 133 / 210 412 | 120 / 333 146 | **120 / 238 465** | **161** / 238 465 | 280 |
| approach (30) | 136 / 201 842 | 126 / 294 724 | **126 / 221 468** | **160** / 221 468 | 250 |
| doorway (15) | 154 / 222 462 | 142 / 314 146 | **142 / 247 901** | **175** / 247 901 | 246 |
| reverse (31) | 51 / 97 452 | 47 / 159 446 | **47 / 121 996** | **76** / 121 996 | 141 |
| busy woodland (41) | 137 / 213 562 | 124 / 350 174 | **124 / 248 673** | **166** / 248 673 | 279 |

\* Diagnostic only, not a shipping path: the final build with the `BatchedMesh` path forced while the extension is
hidden (a temporary local patch, reverted), i.e. what a device without `WEBGL_multi_draw` would have done without
a fallback of our own. Same triangles. (At an earlier step of this pass, before the far-LOD caps, it was 195–373.)
Raw output of every column: [`consolidation/metrics/`](exterior-sample/consolidation/metrics/).

- **Multi-draw path: within both guides at all five views** (≤ 142 calls, ≤ 248.7 k triangles). The busiest view
  fell from 350 k to 249 k; the doorway from 314 k to 248 k. Margins at the doorway and busy views are small
  (~2 k triangles).
- **Fallback: identical triangles, 160–175 calls at four views — 10 to 25 over the 150-call guide** (reverse 76).
  - Cause: one draw call per geometry with something in view — trees and bushes 25–30 (12 tree variants × 3 LODs
    and 6 bush variants × 2 in play), plants 10–17 (19 plant geometries). The other ~120–140 calls of each frame
    are the original estate's per-chunk instancing and static batches outside the sample.
  - Next practical remedy (not done): in the fallback only, merge far-LOD trees into a few static per-sector
    meshes (estimated −10 to −15 calls, at the cost of drawing whole sectors); or, smaller, let the far LOD share
    one geometry per species instead of per variant (≈ −8 calls; variants are hard to tell apart beyond 26 m).
    Reducing the original forest's chunk calls is the larger lever but lies outside this sample.
- **Where the triangles go** (busy view, multi-draw): trees and bushes 51.1 k (93 drawn: 8 near trees, 3 near
  bushes, 13 mid, 70 far), plants 12.1 k (64 drawn), the rest ~185 k is the original scene outside the vegetation
  batches (terrain, outer forest chunks, manor and fences in view, the cut and headwall batches).
- **Per model** (triangles per variant 0/1/2; near | mid | far): oak 2 231/1 814/2 737 | 599/487/741 |
  317/268/317; beech 2 235/2 495/2 423 | 610/707/695 | 296/310/311; birch 1 914/1 715/1 828 | 664/586/644 |
  362/357/372; Scots pine 2 221/2 385/1 947 | 642/648/536 | 534/519/428; hazel 1 044/1 168/731 | 231/247/187
  (mid = far); holly 760/842/760 | 167/181/136 (mid = far). Revision 1: near 1.9–5.1 k, far 0.95–1.6 k. Budgets
  enforced by unit tests: near < 3.2 k, mid < 0.9 k, far < 0.6 k.
- **What was cut, and what was not:** cheaper mid/far crowns that keep each species' outline; buried cluster
  triangles; the wall stones' back faces; small-plant ranges of 11–16 m (foxgloves 24 m, ferns 16 m); far bushes
  capped to their largest clusters. Near trees (< 16 m, where they are inspected) keep full skeletons and
  icosphere clusters. No tree near the path is hidden or removed.
- **Memory** (renderer counters at these views, multi-draw): geometry buffers in the scene 21.0 → 20.5 MB
  (vegetation 2.69 → 2.21 MB); uploaded textures 32–33 → 28–29 (fallback 22–23: no batch data textures); scene
  texture area 4.417 → 4.434 MPx (the 512 × 256 tree atlas replaces the 384 × 256 bark and 128 × 128 leaf
  textures; the verge reuses the path texture).
- **Transfer:** JS bundle 295.4 → 301.3 kB gzip (+5.9 kB), baseline 271.6 kB — all three rebuilt with the same
  toolchain in this pass. (Revision 1's document listed 268.5 / 292.2 kB: the same deltas from an earlier build
  environment; the absolute figures here supersede them.) No assets are downloaded.
- **CPU per frame:** LOD/range loops over 115 trees and bushes (incl. the backdrop row) and ~710 plants, only after
  the camera has moved; the fallback's culling loop runs when the view changes (per instance: one sphere test) and
  re-uploads only changed buffers. Not measured on a device.

### Revision 1 (species and variants, batched) — superseded

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
  camera at high quality). Distance/LOD updates run only after the camera has moved ≥ 0.3 m (trees) or 0.25 m
  (plants).
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

### Consolidation pass (revision 2)

Code under test: commit `c853918` (game code identical to `3b6de0d`; the later commits change documents,
evidence and the walkthrough script only). Each kind of evidence is labelled for what it is.

| Kind | Result |
|---|---|
| Typecheck, production build | clean / OK |
| Unit tests (source) | **94 / 94.** New: the instanced fallback packs exactly the in-view instances, uploads nothing when idle, moves an instance between geometries on a LOD change and grows its buffers (`tests/vegbatch.test.ts`, real code with a scene and camera, no GL); every species × variant within near < 3.2 k / mid < 0.9 k / far < 0.6 k triangles with the crown extent within 15 % across LODs; buttress roots reach out at ground level and narrow below it; every plant kind has a show range; bark and foliage map into their atlas columns. |
| Browser regression suite (`node scripts/e2e.mjs`, headless Chromium + SwiftShader) | **102 / 102** on this build: 101 in the full run; the 102nd (shadow-map culling) failed there on a stale constant in the test (it compared against 100 trees; the backdrop row raised the total), was corrected to compare with the live count and passes in a rerun of the BOSLUST suite (19 / 19). |
| — BOSLUST suite (19 checks) | Unchanged contract: 155 colliders, 15 interactables, original lights + 2 lanterns, the forest outside the zone **and the outer ring beyond the backdrop row** identical (6 528 instances), same reticle targets. Entrance by walking (fork clue → inscription → cover → 2413 → door → stair), save/restore above ground and underground, lanterns and culling at four poses, reduced motion, no console errors. New: multi-draw draws all vegetation in 2 calls; `?multidraw=0` really runs the instanced path (extension hidden, 73 InstancedMeshes, no BatchedMesh); **both paths draw the same trees, bushes, plants and triangles at 5 poses**; with shadow maps the fallback draws a superset and still culls (fork 105 of 109 — it culls little there); LOD walk by the movement code: far → mid → near at 24.9 m and 12.9 m, near held to 17.2 m and released at 19.2 m on the way back, identical in both paths; culling follows turning (83 → 4 trees drawn) and an idle camera uploads no instance buffers (both paths). |
| — Review mode | `?review=boslust` starts at the fork with the sample, toggles old/new at the same pose, temporary progress opens the cover; the player's own save, backup and settings are byte-identical afterwards; normal entry unchanged. Inputs: taps on the start card and bar; walking by the test helpers. `?review=living` checks pass (art-sample suite). |
| Normal game unchanged | Base mode (no flags) at poses 13, 14, 15, 31, 41: identical calls and triangles to the stored baseline and **pixel difference 0** (mean absolute 0, no pixel over 24) against the stored baseline captures. |
| Multi-draw vs forced fallback, pixels | Poses 13, 15, 41: **pixel difference 0** (same captures, same settings; `consolidation/fallback/`). |
| Measurements | §7, five views, both paths, raw output in `consolidation/metrics/`. |
| Clay passes | Checked by eye in every clay capture: textures, vertex colours, batch instance colours, glows, light pools, contact decals and point lights are gone (the verge band renders as plain grey ground). |
| Walkthrough | [`consolidation/walkthrough.webm`](exterior-sample/consolidation/walkthrough.webm), 113 s at 844 × 390: scripted steering through the real movement code (the joystick's move vector), the cover opened with the game's action while the reticle was on the lock, the code entered by clicking the panel's buttons, then the stair. Reviewed as a contact sheet every 8 s: signpost, path, turning round, door, lock, panel, open door, stair passage; no tree missing in a sampled frame. It is **not** touch input and **not** a human playtest, and at a few software-rendered frames per second it **cannot establish the absence of LOD popping**; the LOD and culling behaviour is covered by the e2e checks instead. |
| Real device | **Not done.** No phone was available. Pending the owner's check (§1.1). |

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

### Consolidation pass (revision 2)

16. **The fallback was unmeasured.** Measured first: three.js's own per-instance fallback would cost 195–373 calls
    at the five views (141–280 on the final geometry). Replaced by an instanced fallback of our own (§4); forced by `?multidraw=0`.
17. **One tree = two geometries** (bark and foliage on two materials) would have doubled the fallback's calls. A
    single atlas material makes each tree LOD one geometry; the multi-draw path dropped from 3 calls to 2.
18. **Roots read as blades.** Root tubes lying on the ground showed as thin wedges, and a later smooth flare read as
    a skirt. The roots are now buttress ridges of the trunk itself: sharper near the ground, broader up the
    trunk, widest at ground level and narrowing below it (so a slope does not expose a skirt). Ring spacing is
    dense through the flare (a coarse ring showed as a ledge).
19. **Crowns read as stacked pads.** Rebuilt from branch skeletons with clusters at the branch ends; flatter
    clusters (beech, pine) were rounded off; birch clusters were made smaller and more numerous (they read as
    lollipops); hazel was rebuilt as an open vase of stems (it read as a table of plates).
20. **A LOD switch would have popped a birch.** A new unit test found birch variant 1's crown 18 % lower at
    mid/far (its lowest clump was a dropped filler). Every LOD now keeps the outline clusters.
21. **Fallback culling disagreed with multi-draw.** (a) With shadow maps on, the first fallback version stopped
    culling trees altogether; now it keeps only trees whose shadow can reach the view. (b) The fallback culled
    before the LOD choice of the same frame, drawing one stale frame after a jump; culling now runs last. Both
    were caught by the new e2e checks.
22. **The path still had a hard edge.** A soft verge band and earth patches were added, but the edge still read
    because the path's width zigzagged at its 1 m sampling and the terrain's worn-soil band was darker than the
    path (a dark outline). Width wander slowed, the soil band lightened, the verge widened.
23. **Budget, step by step** (busy view, multi-draw, triangles): revision 1: 350.2 k → skeleton shapes 307.9 k →
    plant ranges, near LOD at 16 m, fern segments, far fillers dropped 275.2 k → a third LOD 259.8 k → mid → far
    at 28 m 256.7 k → pine and birch economies 253.3 k → verge, backdrop row, headwall rocks, irregular verge grass
    256.0 k → wall back faces, small-plant ranges −1–2 m, mid → far at 26 m 252.5 k → far trees and bushes capped
    to their largest clusters 248.1 k → bushes share mid/far 247.8 k → outline-preserving LODs (item 20) 248.7 k.
24. **Measurement tooling:** a test step that ran 126 full software renders in one call stalled page unloads; the
    LOD walk now runs the per-frame hooks directly. The documented revision-1 bundle size could not be reproduced
    (292.2 vs 295.4 kB); all transfer figures were rebuilt with one toolchain (§7).

## 10. Build and URLs

**This version:** game code `3b6de0d` (consolidation), pushed and deployed with `c853918`; the evidence and these
documents follow in a docs-only commit, which redeploys the same game code under its own build id. The build id on
the review start card, in Pauze and (new) in the expanded review bar is the deployed commit's short hash: it should
read `c853918` or a later commit of this branch.

History: first version `eea6ab8` / docs `4fee5ec` (run #14); revision 1 `0159007` / docs `6bb5275` (run #16:
build and deploy succeeded).

### CI and deployment

**CI (GitHub Actions "Build and deploy to GitHub Pages"):**
- Run #17 ([37393383463](https://github.com/Algolon/Feh-Lu-We/actions/runs/37393383463)) for `c853918` (game code):
  build job (npm ci, typecheck, unit tests, build, artifact) and deploy job succeeded.
- Run #18 ([37394625224](https://github.com/Algolon/Feh-Lu-We/actions/runs/37394625224)) for `214db1e`
  (evidence and documents, same game code): build and deploy jobs succeeded.
- The commit recording this is docs-only and redeploys the same game code under its own build id.

**Live delivery is not verified from here:** the authoring environment cannot reach `algolon.github.io` (the
connection fails at its proxy). On your phone, open the review URL and check that the build id on the start card
starts with `214db1e` or a later commit of this branch.

| | |
|---|---|
| Review (exterior) | `https://algolon.github.io/Feh-Lu-We/?review=boslust` |
| Review with FPS overlay | `https://algolon.github.io/Feh-Lu-We/?review=boslust&debug=1` |
| Review, forced fallback, FPS overlay | `https://algolon.github.io/Feh-Lu-We/?review=boslust&multidraw=0&debug=1` |
| Review (interior, unchanged) | `https://algolon.github.io/Feh-Lu-We/?review=living` |
| Normal game (unchanged) | `https://algolon.github.io/Feh-Lu-We/` |

### Limitations

- **Device behaviour is unverified:** frame rate, thermal throttling, colour on a phone screen, touch walking of the
  route by a person, and whether LOD changes are visible in motion. All numbers here are software-rendered
  workload counts.
- **Fallback calls are over the guide:** 160–175 at four of five views (guide 150; reverse 76). Cause and remedy
  in §7.
- **Thin budget margins** on the multi-draw path (doorway and busy views ~2 k triangles under 250 k): anything
  added to the zone needs a matching saving.
- **Shadow maps (high quality):** the fallback culls only modestly there (it keeps trees whose shadow may reach
  the view); no capture set was reviewed at high quality.
- **Re-rolled placement:** the backdrop trees joined the placement loop's random sequence, so bushes, plants,
  litter and verge stones are placed differently from revision 1 (same rules; tree positions unchanged).
- Weak spots (§6): polyhedral near clusters, bark lattice at 1 m, the nearest hazel still layered, the
  headwall's straight centre top, one stump inside a root flare, the original style west and north beyond ~30 m.
- **Nothing here is propagated beyond the zone and its backdrop row, and nothing is approved.** Estate-wide
  rollout waits for the owner's review.
