# Feh Lu We — art refresh, step 1: style target

**Status:** planning document plus baseline evidence. Nothing in the game has been changed by this step.
**Supersedes as the visual target:** [`../ART_DIRECTION.md`](../ART_DIRECTION.md), which stays as the historical
record of what iteration 3 *intended*. Its "storybook woodland" claim is treated here as a hypothesis, and the
baseline does not support it (§3).
**Companion documents:** [`REVIEW_CHECKLIST.md`](REVIEW_CHECKLIST.md) (the gate every sample must pass),
[`baseline/README.md`](baseline/README.md) (captures, poses, metrics), [`palette.svg`](palette.svg) (swatches).

## Step-2 revisions (owner feedback on step 1) — these override the text below where they conflict

1. **Palette:** keep it earthy, but keep warmth, lively highlights and selected colour accents. Not everything should
   be brown, grey and olive.
2. **The palette is a starting vocabulary.** Colours are validated together in the rendered scene, not swatch by
   swatch.
3. **Three colour layers.** Separate base material colour (albedo), authored shading (baked occlusion in vertex
   colour) and expected lit appearance.
   - The "lit / mid / shade" swatches are not to be applied as shading.
   - Doing so would duplicate the shading that light and baked occlusion already provide.
4. **Texture × tint is not "colour squared".** The step-1 shorthand was wrong. The actual chain is:
   1. Texture (sRGB, decoded to linear).
   2. × vertex/part tint (linear).
   3. × (hemisphere + sun + point light).
   4. → ACES at exposure 1.15 → sRGB.

   Two coloured multipliers do compound saturation when both are saturated in the same hue, as the grass texture
   and green tint are. The bigger factors are the strong fill and ACES on saturated inputs.
5. **Value-only textures are an option** for reusable materials, not a mandatory rule. The step-2 sample uses
   near-neutral weave/grain/ashlar textures plus coloured parts, and a fully coloured rug texture.
6. **R3's production method is unknown.** Only its visible forms and craftsmanship are borrowed.
7. **Halving the daylight fill is not predetermined.** Test balance and direction; do not merely darken. See
   [`INTERIOR_SAMPLE.md`](INTERIOR_SAMPLE.md) §5: the recommended treatment changes the vertical gradient and
   fixture share, with fill reduced by about a quarter.
8. **Procedural-first is a starting approach, not an obligation.** If a representative asset stays weak after
   focused revision, revise its construction or use an authored asset route.
9. **Draw-call and triangle targets are engineering guides,** not substitutes for performance evidence (real-device
   frame time).
10. **Two diagnostics, not one.**
    - **Clay (shape):** removes textures, vertex and instance colours, emissive glows, flames, coloured light pools,
      contact decals and point lights.
    - **Neutral lighting (material behaviour):** keeps materials and fixtures, but no fog, white sky/sun and
      exposure 1.

**What the interior sample changed in the recommendation** (evidence: [`INTERIOR_SAMPLE.md`](INTERIOR_SAMPLE.md)):
- **Tone mapping.** Keep ACES. Neutral at the same exposure made the warm interior more orange and darker in the
  mid-tones.
- **Interior light.**
  - Shape the vertical gradient: a cool window sky above and a warm, dim floor bounce below.
  - Reduce fill by about a quarter.
  - Raise fixture light by about a third.
  - Do not merely darken. The effect is modest; assets, trims and grounding carry most of the improvement.
- **Contact shadows.** They must be dense out to the footprint edge with a 15–20 cm falloff. A centred blob is
  hidden under the furniture.
- **Rounded boxes that will be deformed** (cushions) need interior face vertices (`softBox(..., mid)`).
- **Ceilings** that are the underside of floor slabs read as dark wood. Rooms meant to feel bright need a plaster
  ceiling between the beams.

Evidence labels used below:
- **[V]** is visible in the baseline captures (phone quality, 844 × 390).
- **[S]** is inferred from source code (file named).
- **[P]** is a proposal or expectation that has not been tested yet.

---

## Step-3 notes (learned building the BOSLUST exterior sample; see [`EXTERIOR_SAMPLE.md`](EXTERIOR_SAMPLE.md))

1. **Terrain colour is texture × vertex colour.** The grass texture is strongly green, so any forest-floor tint must
   be authored as *target albedo ÷ texture mean*, or it disappears. That is why the baseline floor reads as lawn.
2. **No DoubleSide for thin foliage.** three.js flips the normal on back faces, so half of each grass clump or fern
   shades as if it faced the ground (black blades). Duplicate the triangles with shared up-biased normals instead.
3. **Canopy undersides need upward-biased normals.** Vertex-colour occlusion alone cannot lift a face that receives
   no light; undersides otherwise go near-black from below.
4. **Silhouette over tessellation for trees.** Several major masses, each with smaller clumps on its outer side,
   read as broadleaf; one mass per crown reads as a ball or a pillow. Keep both LODs on the same layout so the
   switch does not pop.
5. **Instancing must cull per instance.** An InstancedMesh is drawn whole if any part is in view; the sample culls
   tree and understory instances against the camera every frame.

## 0. Recommendation in brief

1. **Direction: a crafted European woodland manor.** A Veluwe country house and its woods, built like a
   well-made scale model:
   - Substantial timber and stone construction you can read.
   - Softened edges and firm planes.
   - An earthy, restrained palette.
   - The warm lights as the brightest and most saturated things in view.
   - Inviting up close, mysterious at the edges of the light.
2. **Largest gaps:**
   1. Objects are assembled from unbevelled boxes, cylinders and blobs. They have no construction logic: chairs are
      notched cubes, trunks are straight pipes, the facade is a flat box.
   2. Nothing is grounded. There are no contact shadows or plinths, and the path has no edge.
   3. Lighting at phone quality is almost pure uniform fill, so light does not model form.
   4. Colour runs through several transforms (coloured texture × coloured tint × strong fill × ACES); see §3.5 for
      the corrected diagnosis. The result is acid greens and
      muddy shades.
   5. Surfaces are covered in procedural blotch noise instead of material character such as grain direction,
      coursework or weave.
3. **Pipeline: hybrid, starting procedural** (a starting approach, not an obligation; see §6.3).
   - Extend the existing code kit with profiled and bevelled module functions: rounded boxes, lathes, profile sweeps
     and convex rock hulls.
   - Where a material is reused widely, prefer near-neutral (value) textures with colour from the part; elsewhere
     a coloured texture is fine (see the step-2 revisions).
   - Add one instanced contact-shadow decal layer.
   - Make the Batcher able to keep authored vertex colours and indices.
   - GLB is used only where code cannot reach the shape (organic hero trees), and only after the owner decides who
     authors them.
   - No engine change and no Blender requirement for step 2.
4. **Samples (12 asset designs):**
   - **Interior:** the hearth/mantel corner. Six designs: surround, brass stand + pinecone, upholstered armchair →
     sofa, occasional table, room trims (skirting, cornice, window reveal, beams), and a lamp with soft light pool.
   - **Exterior:** the fork → cut → BOSLUST door, about 15 m. Six designs: broadleaf oak, Scots pine, rock set,
     dry-stone wall + headwall/portal, understory set + path verge, and the fork signpost.
5. **Owner decisions before step 2:** see §9. In short:
   - Is the direction right?
   - Should the tone mapping change?
   - How far should fill light drop?
   - Is a GLB/Blender authoring route acceptable for trees?
   - Can the exterior sample spend calls it has to win back first?
   - Will the owner run the phone FPS check?

---

## 1. Baseline (what the game looks like now)

The captures are in [`baseline/`](baseline/README.md) and cover 15 poses × 3 passes:
- **Game:** as shipped.
- **Neutral light:** no fog, white light.
- **Clay:** one grey material, shape only.

They were taken at the phone default quality: no shadow maps, pixel ratio 1, no MSAA, 3 pooled point lights. Poses
are in `baseline/poses.json` and the script is `scripts/art-baseline.mjs`.

Headline observations [V]:
- Neutral-light frames look almost the same as the game frames. Atmosphere hides nothing, but the light also does
  nothing to model form.
- In clay:
  - The armchair is a notched cube.
  - Trunks are pipes.
  - Ferns are discs.
  - The cut walls are crenellations with moss "lily pads".
  - The path vanishes because it is colour only.
- The BOSLUST door pose already uses **154 draw calls**, over the 150 phone budget.

Rendering is software (SwiftShader). Image content is representative of a GPU render; frame rate is not.

---

## 2. References: what each one teaches

All six attachments were readable. They contain third-party logos and watermarks (Mahasona/RAM Studios, Unity "DEVDIARIES",
RetroStyleGames, Sunday Sundae), so they are **not committed** to the repository. Only these written notes are.

The analysis below is of what is visible. Shaders, polygon counts and production methods are not inferred.

| Ref | What is visible | Camera |
|---|---|---|
| **R1** Mahasona settlement | Rocky promontory beside blue water:<br>• cliffs of large, chunky stone blocks with softened edges<br>• tall dark trunks under teal canopies<br>• lanterns on timber posts throwing warm pools onto a pale path<br>• split-rail fences, flagstone stepping stones<br>• broad-leaf plant clumps along the edges<br>• a plank boardwalk with posts<br>• warm-windowed cottages<br>• cool blue haze between layers | Elevated, ¾ |
| **R2** DEVDIARIES pier | A timber shack on a pier:<br>• every plank, post, beam, stair stringer, railing and net frame is a separate, believable member<br>• simple shapes with almost no surface detail<br>• warm orange-brown wood against saturated blue water<br>• soft shading in the corners | High, near top-down |
| **R3** furnished room | An illustration-like image (production method unknown):<br>• puffy upholstered sofa with tufted cushions, beanbag<br>• skirting, cornice and pilasters with bases<br>• plank floor<br>• rounded edges on every object<br>• a soft contact shadow under everything<br>• saturated toy palette and branded game props | Exaggerated wide perspective, from above |
| **R4** broad-canopy forest | Near eye level:<br>• huge trunks flaring into roots, twisting branches<br>• umbrella canopies with flat undersides and scalloped leaf-clump rims<br>• strong atmospheric perspective toward blue<br>• cracked flagstone path, flower clumps<br>• magenta/orange fantasy trees, a snow peak | Eye level |
| **R5** Sunday Sundae | Pale faceted cliffs made of a few large deliberate planes:<br>• a rope bridge with wooden planks and posts<br>• a red-brown path cut into the rock<br>• soft haze | Mid-elevation |
| **R6** forest path to a lit house | Near eye level:<br>• an earth path climbing between bushes, grass tufts and edging stones<br>• stylised conifers with drooping layered branches<br>• dappled sun and shadow<br>• a warm, lit cabin as the destination | Eye level, closest to first person |

### Hierarchy and borrow / adapt / reject

| Role | Reference | Borrow | Adapt | Reject |
|---|---|---|---|---|
| **Construction benchmark** | R2 | Every structural member is its own believable piece: posts carry beams, stairs have stringers, railings have rails and balusters. Few details, all purposeful. | Apply the same "how was it built" logic to manor doors, porch, beams, furniture frames, fences, the BOSLUST portal and the signpost. | Waterfront/pier theme. Saturated blue. The top-down camera's reliance on silhouette from above. |
| **Exterior composition + atmosphere** | R1, R6 | Layered vegetation that frames the route. Substantial trunks. Warm destinations (lanterns, windows) against cooler surroundings. Edges between path and ground made of stones, plants and level changes. | Apply this at eye height: frame the path with near trunks and understory, keep the destination readable mid-frame, and let haze separate layers. R6 is the main eye-level guide. | Pirate/fishing-village props, graveyard crosses, deep-blue night grade, and R6's hard dappled shadows as a *requirement* (phone quality has no shadow maps; see §5.5). |
| **Interior construction** | R3 | Shaped upholstery (seat cushions, rolled arms, shaped backs). Consistent softened edges. Skirting/cornice/pilaster framing. Separation between wood, cloth, plaster and metal. Every object grounded by a soft contact shadow. | Translate it to a Dutch manor: oak, linen, oxblood and bottle-green cloth, brass and ceramic. Edge softness should be a little crisper than R3. | The gaming theme, branded props, toy saturation, neon lighting, and R3's exaggerated wide perspective (a first-person camera cannot reproduce it). |
| **Selective shape** | R4 | Trunk taper, root flare and visible branching. Canopies with a distinctive silhouette and a flatter underside. Depth through value steps. | Use European species: oak and beech for broad canopies; Scots pine (characteristic of the Veluwe) for the high umbrella crown on a tall bare trunk. | Magenta/orange fantasy foliage, giant fantasy scale, the snow peak, and saturation levels. |
| **Selective shape** | R5 | Rock as a few large deliberate planes with restrained detail. Plank-and-rope rhythm. Haze. | Rock outcrops in the hill and cut. Planes are bevelled, not razor-faceted, and sit in vegetation. | Making *everything* faceted (trees, terrain, buildings), and the monochrome scheme. |

**Conflicts between references, and how they are resolved:**
- **Saturation.** R3 and R4 are far more saturated than R1 and R6. The palette follows R1/R6 earthiness, and R3/R4
  contribute shape only.
- **Facets vs softness.** R5's facets and R3's softness conflict. Facets are allowed only for stone and roof
  slate; everything made by hand (furniture, joinery) gets soft bevels; organic forms get smooth shading.
- **Camera height.** R1, R2 and R5 are elevated views. Their read relies on seeing tops and layouts, which a
  first-person player rarely sees. What transfers is construction logic and material separation, not their
  composition.

---

## 3. Gap diagnosis

Each category lists:
- **Weakness:** what is wrong now, with an evidence tag.
- **Effect:** how the player perceives it.
- **Change:** what to do about it.
- **Benefit:** what that change should achieve.
- **Cost:** production and performance implications.

### 3.1 Shape and silhouette

**Weakness**
- [V] Clay 04: the armchair is a notched cube.
- [V] Clay 10/11: trunks are straight cylinders cut off under the crown, and crowns are repeated faceted blobs.
- [V] Clay 14: the cut wall reads as crenellations.
- [S] `nature.ts` builds every broadleaf from one 7-sided cylinder plus 3–5 copies of one icosahedron.

**Effect**
- Objects are recognised by colour, not shape.
- The woods read as "many of the same thing".
- In the dark or in fog the forms disappear.

**Change**
- Give each asset family one or two signature silhouette features:
  - Chairs: shaped back and arms.
  - Oak: flared base, forked limbs, broad crown.
  - Pine: bare trunk, high flat crown.
  - Wall: irregular capstones.
- Vary crowns by species, not by jitter.

**Benefit**
- Recognition at a glance, even in clay.
- Distinct species make the woods navigable.

**Cost**
- Moderate authoring work.
- Small triangle growth per asset.
- Draw calls are unaffected if geometry is batched or instanced the same way.

### 3.2 Proportions and structural detail

**Weakness**
- [V] Clay 01/04: the sofa back and arms are slabs; cushions intersect the back; the coffee table is a plank on four
  sticks (no apron).
- [V] 08/09: windows are flush with the wall; the porch is two columns under a thin slab; no plinth or string course.
- [V] 15: the door frame is three planks.

**Effect**
- Buildings and furniture look schematic, "like a blockout".
- Nothing suggests craft or age.

**Change**
- Follow the R2 rule: every load-bearing member exists and meets another member believably.
- Furniture:
  - Aprons under table tops.
  - Legs set in from the corners.
  - Cushions that sit *on* frames.
- Windows:
  - Reveals at least 15 cm deep.
  - Sills that project 4–6 cm.
  - Frames with mullion depth.
- Porch:
  - Entablature.
  - Column bases and capitals.
  - A visible roof thickness.

**Benefit**
- The manor and furniture read as made objects.
- Stronger sense of place.

**Cost**
- More parts per asset (+10–40 triangles per member).
- Merged per area, so draw calls stay flat.

### 3.3 Edge treatment and shading

**Weakness**
- [S] `kit.ts`: `box()` produces razor edges with flat normals.
- [S] Crowns use detail-1 icosahedra (smooth normals but visibly faceted outlines).
- [S] Flat and smooth shading are chosen by which primitive was used, not by material.
- [V] In clay every edge is either razor-sharp or lumpy.

**Effect**
- Hard CG edges catch no light, so forms look cut from paper.
- The faceted blobs look unintentionally low-poly.

**Change**
- Adopt the shading rules in §5.1:
  - Bevelled edges with smooth bevel normals and flat faces for made objects (`RoundedBoxGeometry` is in the
    installed three).
  - Smooth shading for organic shapes.
  - Flat facets only for stone and slate.

**Benefit**
- Edges catch light even without shadows, which is the cheapest form cue available.

**Cost**
- Rounded boxes cost about 6–20× the triangles of a box, so use them on hero and supporting tiers only.
- Background stays plain boxes.

### 3.4 Materials and surface variation

**Weakness**
- [S] `textures.ts`: every surface texture is random blotches and strokes. It has no grain direction, coursework at
  real scale, or weave.
- [S] `kit.ts`: coloured textures are multiplied by coloured vertex tints.
- [S] Every material is Lambert, so brass, glaze, glass, varnish and water have no sheen.
- [V] 01/05: rug patterns are loud and saturated; plaster has stains but no character.

**Effect**
- Surfaces read as "procedural noise".
- Materials blur together: wood, cloth and plaster differ only in hue.
- Metal and ceramic don't read as such.

**Change**
- Authored motif textures (procedural canvas is fine, but authored):
  - Wood grain along the long axis.
  - Plank seams.
  - Stone courses and mortar.
  - Plaster with very low-contrast broad mottling.
  - Textile weave/pile.
- For widely reused materials, consider near-neutral (value) textures with colour from the part; this is an option,
  not a rule (step-2 revision).
- Add a low-shininess "sheen" material only for small hero surfaces: brass, glaze, glass, water, varnished tops.

**Benefit**
- Material separation at 1–3 m.
- Palette becomes controllable.

**Cost**
- Texture work: about one day per material family.
- The sheen material adds one draw call per area where it appears.
- Per-fragment cost is limited by keeping it to small screen areas.

### 3.5 Palette and value hierarchy

**Weakness**
- [V] Sampled pixels: lawn ≈ `#508d10`, crowns/hill ≈ `#222207`–`#285901`.
- [S] Texture × tint squares saturation; ACES tone mapping at exposure 1.15 then pushes greens to acid and shades
  to black-olive.
- [V] 01: the brightest, most saturated areas are the rug and the floor-glow disc, not the fire.

**Effect**
- "Uniformly vivid green" outdoors.
- Inside, the eye goes to the rug instead of the hearth.
- Warm lights don't feel special.

**Change**
- Adopt the palette in §5.3:
  - Earth first, light second, accent last.
  - Foliage saturation capped.
  - Warm lights the most saturated, highest-value elements.
- Test the tone mapper on the samples: ACES vs `NeutralToneMapping` (three r186 has both), owner decision.

**Benefit**
- A coherent grade.
- Warm destinations pop without bloom.

**Cost**
- Small: constants and textures.
- The tone mapper is a global switch and needs a check across all areas.

### 3.6 Lighting and contact grounding

**Weakness**
- [V] Neutral ≈ game.
- [S] `env.ts`: hemisphere ×1.6 + sun ×2.4 with no shadow maps at phone quality, and the hemisphere fill also
  reaches interiors.
- [V] Clay 01/05: light pools are hard-edged additive discs.
- [V] No contact shadows anywhere.

**Effect**
- Flat, shadowless light: objects float, rooms feel lit by an overcast sky indoors.
- Floor discs look like spotlights, not lamplight.

**Change**
- Lower the global fill and raise the sun's share so faces separate by orientation.
- Indoors, reduce fill through a camera-indoor factor, which the per-frame env update already makes possible.
- Ground every object with:
  - An instanced multiply-blend contact-shadow decal: one shared texture and one draw call, using the same
    pattern as the existing `LightPatches`.
  - Baked vertex darkening near part bases and in corners.
  - Skirting and plinth geometry.
- Make light patches softer, dimmer and shaped by the fixture.

**Benefit**
- Grounding and form at near-zero cost.
- Interiors get a warm/cool contrast.

**Cost**
- Decals: 1–2 draw calls per area plus some overdraw.
- Vertex darkening has no runtime cost.
- Fill changes need re-checking the lighting regression tests L1–L6, though their logic is unaffected.

### 3.7 Vegetation and terrain transitions

**Weakness**
- [V] Clay 12: the path has no edge, verge or level change.
- [V] 10/13: ferns are flat discs; grass is sparse spikes; mushrooms are scattered evenly.
- [S] Terrain colour is a random per-vertex lerp on a 2 m grid, with no darkening under canopies or at wall feet.
- [V] 14: the hill is a smooth dome with no rock, so the cut looks pasted on.

**Effect**
- The ground reads as carpet.
- Undergrowth reads as decals.
- The BOSLUST cut doesn't feel carved.

**Change**
- Path verges: a strip of edging stones and taller understory clumps where path meets ground.
- Terrain vertex colour driven by canopy cover, wetness and wall proximity.
- Fern fronds (crossed arched cards or bent strips), not discs.
- Rock outcrops wherever the terrain is cut.
- Mushrooms only in clusters at roots and stumps.

**Benefit**
- Believable transitions.
- The route reads at a glance.

**Cost**
- Verge stones as instances (+1–2 calls per chunk).
- Terrain colour has no runtime cost.
- Fronds add about 2× fern triangles.

### 3.8 Composition and focal arrangements

**Weakness**
- [V] 01: the hearth sits small in a large plain wall with nothing framing it; the sofa back blocks the lower
  frame.
- [V] 13: the cut entrance is lost among identical trunks.
- [V] 08: the facade is symmetric but unlayered, framed by two cones.

**Effect**
- The eye isn't guided.
- Key places don't feel like destinations.

**Change**
- Interior: build a focal group around the hearth (§5.6), in which the frame, anchor, supporting pieces and light
  all point at the mantel.
- Exterior: frame the route with near trunks and understory, mark the turn with the signpost plus the first rock
  outcrop, and light the door with a lantern as a warm destination.

**Benefit**
- Players find the puzzle evidence without signage.
- Places have a mood.

**Cost**
- Placement work only.
- Keep the garden open (§5.6).

**Not the fix:**
- More geometry for its own sake.
- More clutter or more mushrooms.
- Bloom, fog density or depth of field.

The first two increase cost without adding construction or grounding. The last three hide the gaps the clay pass
exposes.

---

## 4. Direction statement

> **A crafted European woodland manor.** The house and woods of a Veluwe estate, rendered as if built by a careful
> model-maker:
> - Real construction you can read.
> - Firm planes with softened edges.
> - Materials you can tell apart at arm's length.
> - An earthy palette in which warm lamplight is the most precious colour.
>
> Inviting near the lights, mysterious where they fade, tactile everywhere the player can reach.

Pillars, used as review language:
1. **Built, not placed.** Members carry, rest on and join one another.
2. **Firm planes, soft edges.** Flat faces with bevelled edges for made things, smooth forms for living things, facets
   only for stone.
3. **Big shapes first.** About 70 % primary mass, 20 % secondary features, 10 % tertiary detail. Detail clusters at
   points of interest.
4. **Earth, then light, then accent.**
   - Most of the frame is earthy mid-values.
   - Warm light is the brightest and most saturated element.
   - A few accents mark interaction.
5. **Grounded.** Every object visibly touches something: a contact shadow, a plinth, roots, a verge.
6. **Frames and destinations.** Each view has a near frame, a readable subject and a soft background.

**Not:**
- A pirate or fantasy village.
- A toy-room diorama.
- A photorealistic estate.
- A uniformly faceted low-poly collection.

---

## 5. Style guide

### 5.1 Shape language

Sizes are real-world metres. The game is 1 unit = 1 m.

**Architecture**
- **Walls**
  - Must show thickness at every opening: reveals ≥ 0.15 m outside and ≥ 0.10 m inside.
  - Exterior walls get a plinth course (0.4–0.6 m high, 3–5 cm proud) and a string course or cornice with a
    visible underside.
- **Windows**
  - Frame 6–8 cm.
  - Mullions/transoms 4–5 cm, set back from the frame.
  - Sill projecting 4–6 cm with a 2 cm chamfer.
  - Glass recessed.
  - Lit windows glow behind the frame, never flush with the wall.
- **Doors and thresholds**
  - Architrave 8–12 cm wide.
  - A threshold step or sill.
  - Doors with stiles and rails or ledges and braces, not a plain plank.
- **Beams**
  - Chamfered edges (2–3 cm).
  - Bearing on a wall plate or corbel, never vanishing into a flat ceiling.
- **Bevels**
  - Selective, on edges at or below eye height and on edges that catch the sun or a lamp: architraves, sills,
    mantel shelf, coping stones.
  - Ceilings, roof undersides and wall-to-wall corners stay sharp.

**Furniture**
- **Construction:** frame + infill. Legs carry an apron or rail; tops overhang 2–4 cm; carcases have a plinth or
  feet.
- **Upholstery**
  - Seat cushions 12–18 cm thick with edges rounded at 3–5 cm.
  - Backs shaped: a slight rake of 8–15° and a rounded top.
  - Arms rolled or tapered.
  - Cushions sit on the frame with a visible seam gap, never intersecting it.
- **Edge softness:** consistent by material.
  - Wood: 0.5–1.5 cm radius.
  - Upholstery: 3–5 cm.
  - Stone: 1–3 cm.
- **Proportions**
  - Seat height 0.42–0.46 m.
  - Table height 0.74–0.78 m; coffee table 0.42–0.48 m.
  - Arm height 0.60–0.66 m.
  - Small furniture is drawn 5–10 % chunkier than real so it reads on a phone.

**Stone**
- **Built stone** (walls, hearth): courses of varying height (2–3 sizes), mortar recess on hero walls only,
  capstones irregular in length.
- **Natural stone** (outcrops, cut faces): 5–12 large planes per rock with 2–6 cm bevels. One dominant face
  direction, plus bedding planes on a consistent tilt within an outcrop.
- Never a uniform crenellation rhythm. Never moss as flat discs; moss drapes over edges and gathers on top faces.

**Trees**
- **Trunk**
  - Taper: top radius 55–70 % of base.
  - Root flare: 1.4–1.8× base radius, with 3–5 buttress roots that dive into the ground.
  - Trunks lean 0–6°.
- **Branching:** at least one visible fork into 2–3 limbs below the crown on broadleaves. Limbs enter the crown
  mass; the trunk never just stops.
- **Canopies by species**
  - **Oak:** broad, irregular, lumpy dome; flatter underside; 2–3 lobes.
  - **Beech:** layered tiers.
  - **Birch:** narrow, light and pendulous.
  - **Scots pine:** bare trunk to 60–70 % of height, high flat-topped umbrella clumps.
  - **Spruce:** cone of drooping layered skirts, not stacked cones with gaps.
- **Canopy shading:** lighter top, darker underside (baked), plus a few darker gaps inside the mass to suggest
  depth.

**Small puzzle props**
- At normal interaction distance (0.8–2.5 m) each prop must be recognisable *in clay* by silhouette alone.
- Shown at 1.2–1.5× real size where needed (the mantel already uses 1.45×).
- One signature feature each:
  - Feather: vane and quill.
  - Pinecone: overlapping scales in rows.
  - Cup: handle and saucer.
  - Clock: arched case with a dial bezel.
  - Candle: drip and wick.
  - Vase: lathe profile with a lip.
- Brass stands (the puzzle discriminator) keep a distinctive three-part profile and a sheen no other base has.

**Where each shading mode belongs**
| Shading | Where | How (current pipeline) |
|---|---|---|
| Flat facets | Natural rock, roof slates, cut stone faces, path flags | Convex hull / low-detail polyhedra, non-indexed |
| Flat faces + smooth bevels | Furniture frames, joinery, beams, architraves, sills, mantel shelf, plinths, crates | `RoundedBoxGeometry` / extruded profiles with bevel |
| Smooth | Upholstery, cushions, ceramics, turned wood, brass, trunks, roots, canopy masses, terrain, fabrics | Lathe / subdivided shapes, smooth normals |

### 5.2 Detail hierarchy

Detail is spent by **visibility × distance × importance**. There is no universal polygon count; the tier budgets are
guides for review.

| Tier | What | Seen at | Needs | Can omit | Guide |
|---|---|---|---|---|---|
| **1 Hero / interaction** | Puzzle objects, the mantel row, locks, the BOSLUST door + sign + tablet, the signpost, lamps the player toggles, furniture the player stands next to in key rooms | 0.5–3 m, often looked at directly | Readable silhouette in clay; bevels on all visible edges; material separation (sheen where metal/glaze); contact shadow; one tactile detail (drip, scale, rivet, grain) | Back faces never seen; inner detail hidden by placement | 300–3 000 triangles each; may own a material |
| **2 Supporting / reusable** | Furniture in general rooms, bookshelves, beams, trims, fences, walls, common trees, rocks | 2–15 m | Correct construction (members exist), bevels on primary edges, palette-conforming colour, grounding | Secondary bevels, small hardware, texture detail beyond the material motif | 100–800 triangles; batched into area meshes; **no own materials** |
| **3 Distant / background** | Outer-ring trees, far hill, roofscape from the woods, distant fences | > 25–40 m, behind fog | Silhouette and value only | Bevels, branching, construction details, texture | Instanced low LOD (≤ 100 triangles), fog-tinted, no shadow |

Tier 1 assets keep their interaction hitbox and collision primitives in code, as now. Visual geometry never
changes a hitbox without a test.

### 5.3 Palette

The swatches are in [`palette.svg`](palette.svg). The values are **albedo targets as authored in vertex/instance
colour on value-only textures**. They must be checked on screen under the game's lighting and tone mapping (a
swatch board is part of the interior sample).

| Role | Swatches |
|---|---|
| Plaster | base `#E6DAC2`; darker variants `#D3C4A6`, `#ADA391` are alternative bases, **not** shading steps<br>Room tints (max one per room): sage `#C7C9AC`, ochre `#DCC38F`, dove `#B9C0BE` |
| Timber | oak light `#A87A4E`, oak `#7E5636`, walnut `#4E3320`, soot beam `#3A2A1E`, weathered exterior `#8C7C68`, painted green `#4F6650` |
| Stone | sandstone lit `#CDBE9E`, sandstone `#A89A7E`, shade `#7C766B`, moss stone `#7D8160`, slate `#5E6670`, slate dark `#434951` |
| Foliage | sunlit leaf `#8EA058`, canopy `#61763F`, canopy shade `#3D5031`, conifer `#36503F`, fern `#6C8744`, meadow `#9AAD69` |
| Ground | forest floor `#5D6A3D`, leaf litter `#7A6446`, path earth `#B0976F`, gravel `#BDB19A`<br>Seasonal accents: autumn `#B5733A`, birch yellow `#C6B65A` |
| Textiles | oxblood `#7A2E2A`, bottle green `#3F5B45`, ink blue `#2F3E58`, ochre `#C08A3E`, linen `#E4D9C2`, faded rose `#B57B6C` |
| Metal + ceramic | brass `#C29A48` (high `#E6C77B`, low `#7A5C26`), iron `#2F2C2A`, copper `#B0643A`, glaze white `#ECE6D8` |
| Warm light | flame core `#FFE7A8`, lamp `#FFC77A`, window glow `#F4C06A`, candle `#FFD89A`, ember `#E0662A` |
| Cool shade + air | sky zenith `#7FA3C8`, day haze `#D8D1BC`, wood haze `#A3B3A6`, deep shade `#2E3A3A`, dusk blue `#3D4E66`, pond `#3F6B6A` |

**Saturation and value rules**
1. **Warm light leads.** Flames, lamp shades and lit windows are the highest-value, most saturated warm elements in
   any frame.
   - Nothing else may be brighter in the same hue range.
   - The baseline rug and floor disc in shot 01 violate this.
2. **Foliage is mid-value and moderate.**
   - Foliage albedo saturation stays at or below about 45 % (HSL), and value 25–60 %.
   - Variation comes from value (sunlit vs shade) and from the species hue family (olive oak, blue-green pine,
     yellow-green birch), not from random hue jitter.
   - A fully saturated green appears nowhere.
3. **Plaster is never pure white.** Lit plaster sits around 80–85 % value so lamps and windows can exceed it.
4. **Timber is the dark anchor indoors.** Beams and walnut sit at 15–30 % value; floors and oak at 35–50 %.
5. **Accents are budgeted.**
   - At most one saturated textile accent per room. It carries the room identity together with the wall tint.
   - Puzzle-critical objects get the accent treatment first (brass sheen, a coloured book spine), so they outrank
     décor.
6. **Cool shade, warm light.** Shade and haze lean blue-green and grey; light leans amber. This contrast replaces
   saturation as the source of mood.

**Room identity without separate styles.** Every room uses the same shape kit, materials and trims. Identity comes
only from:
- One wall tint.
- One textile accent.
- A signature prop cluster.

For example:
- Living room: oxblood + sage, the hearth group.
- Library: ink blue + oak, the stacks.
- Reiskamer: ochre + linen, the suitcase.

### 5.4 Material language

| Material | Intended appearance | Method | Sheen |
|---|---|---|---|
| **Wood** | Readable grain running along each member's length. Plank seams on floors. End grain darker. Worn lighter on edges and tops (vertex colour). | Value-only grain texture; UVs oriented along the long axis (needs a `boxGeo` option); colour from the palette | Hero tops only (varnished table, mantel): low sheen |
| **Plaster** | Calm, warm, very low-contrast broad mottling. Darker band toward the floor and in corners (vertex AO). No stains. | Value-only texture at low contrast; vertex gradient | None |
| **Stone** | Built: coursework at real scale with mortar lines. Natural: big planes with subtle strata. Moss on top faces. | Coursework texture (built), flat colour + facets (natural); vertex colour for moss and soot | None |
| **Brass** | Warm yellow with a bright highlight and dark low side. Must read as metal at 1–2 m because it is the mantel discriminator. | Sheen material, or a baked vertex gradient (top bright, side dark) if the sheen material is rejected | **Yes** |
| **Ceramics** | Glazed, smooth, with one clean highlight. Delft blue or glaze white. | Smooth lathe shapes; sheen material | Yes |
| **Cloth** | Soft. Weave or pile suggested by a very subtle texture. Folds through geometry (curtain pleats, cushion seams), not texture. | Value-only weave; vertex colour darker in folds and seams | None |
| **Foliage** | Clumped masses: lighter tops, darker undersides and interior gaps, soft edges. Leaf-dab texture only as subtle breakup. | Baked vertical gradient (keep), instance colour by species; optional alpha-tested rim cards on hero trees only | None |
| **Water** | Darker than the sky, with a cool-tinted reflection-like gradient and a soft edge to the bank. Clear only where shallow. | Vertex-gradient surface + a slow normal-free UV scroll; sheen material | Yes |
| **Glass** | Mostly invisible indoors. Exterior windows read as a dark-to-sky gradient by day and as warm glow by night. Never pure white. | Existing transparent material with a gradient tint; emissive when lit | Optional |

Flat colour is enough for:
- Tier 3 assets.
- Small hardware.
- Natural rock.
- Painted surfaces.

Subtle texture helps for:
- Wood.
- Plaster.
- Built stone.
- Cloth.
- Ground.

Specular/roughness variation matters for:
- Brass.
- Glaze.
- Glass.
- Water.
- Varnished hero wood.

No asset gets full PBR maps (normal, roughness, metalness, AO) by default.

### 5.5 Lighting and grounding

**Sun and sky [P]**
- Lower the hemisphere fill and give the sun a larger share. Faces toward the sun should be clearly lighter than
  faces away, even without shadow maps.
- Sky colour: cool. Ground colour: earth. Sun: warm.
- Exact intensities are tuned on the samples and approved visually. (Step-2 revision: halving the fill is not a
  predetermined answer — test balance and direction, do not merely darken; the original note read: roughly halving the
  current fill-to-sun ratio. The atmosphere/dusk progression stays.

**Interiors [P]**
- Daylight fill is reduced when the camera is indoors (smoothly, using the existing per-frame environment update and
  the room graph).
- Rooms are lit mainly by windows and fixtures.
- Warm fixtures make warm pools; window walls stay cooler.

**Warm fixtures**
- An emissive part shows that the fixture is on. It does **not** light its surroundings.
- Surroundings get light only from the pooled point lights (and the optional floor patch).
- Keep both reads consistent:
  - A lamp that is on shows a glowing shade **and** warms nearby surfaces when it holds a light slot.
  - When no slot is free, it keeps its glow and its soft floor patch. This is the existing persistent-light
    behaviour; regression tests L1–L6 must still pass.
- Lamps stay visibly lit through open doorways.
- Floor patches become softer (wider falloff, lower strength) and are shaped by the fixture: elongated in front of a
  hearth, a ring under a shade.

**Contact grounding (cheap, required)**
1. **Contact-shadow decals.** An instanced, multiply-blended soft blob under furniture, props, trunks, rocks and
   posts. It uses one texture and one draw call per area, mirroring `LightPatches`.
2. **Baked vertex darkening.**
   - Each part darkens toward its base.
   - Walls darken toward the floor.
   - Terrain darkens under canopies and at wall feet.
3. **Designed contact lines.** Skirting, plinths, feet, root flares, edging stones.

**Depth separation (cheap, required)**
- Fog colour per region: cool green-grey in the woods, warm haze over the garden.
- A deliberate value step between near, middle and far layers.

**Optional, expensive, never a prerequisite**
- Shadow maps (already in high quality; not available at phone default).
- SSAO.
- Bloom.
- Depth of field.
- Volumetric light.
- Baked lightmaps (needs a second UV set; see §6).

The style must hold up with all of these off, which is exactly what the clay and neutral passes check.

### 5.6 Composition

**Interior focal arrangement** (applies to every key room)
- **Anchor:** one dominant feature (hearth, stacks, table) on the main sightline from the entrance.
- **Frame:** architecture that brackets the anchor: chimney breast with pilasters, window pair with curtains,
  beams that lead toward it.
- **Support:** a seating group facing the anchor at a conversational distance (2–3 m), leaving a clear standing
  spot in front of the puzzle evidence.
- **Light:** the warmest light in the room sits at the anchor.
- **Quiet zones:** at least one calm wall per room. Not every surface is decorated.

**Exterior layers**
- **Foreground (0–5 m):** a frame of trunks, understory and verge stones at the frame edges, never in the centre of
  the route.
- **Midground (5–25 m):** the subject, such as a signpost, outcrop, door or lit window. It stands out from the
  background by a value step and warmth.
- **Background (25 m +):** soft silhouettes in haze, with no detail.

**Constraints**
- **The garden stays open.** The lawn, lantern circle and sightlines to the manor's back facade keep their current
  clearances.
- **Clues are never hidden.** Required clue objects and puzzle surfaces keep:
  - A clear radius of about 1.2 m.
  - An unobstructed line of sight from the approach.
  - Their current hitboxes.
- **Foliage frames; it doesn't fill.** Empty ground is allowed and is part of the rhythm.

---

## 6. Production pipeline

### 6.1 What the current pipeline does [S]

- All world geometry is generated in TypeScript. `Batcher.add` (`src/world/kit.ts`) merges parts per *material ×
  area chunk* into one mesh, so one area costs about one draw call per material.
- **Normals:** authored normals are preserved, because `applyMatrix4` transforms them correctly.
- **First UV set:** preserved.
- **Vertex colours: lost.** All attributes except `position`, `normal` and `uv` are deleted, then a uniform part
  colour (× small brightness jitter) is written. A second UV set (`uv1`, needed for lightmaps or AO maps) and tangents
  are also dropped.
- **Indices: dropped.** Geometry becomes non-indexed, so smooth meshes cost about 3–6× the vertices.
- **Materials:** each group uses one shared kit material. An asset's own material and texture maps would be lost
  unless the material is registered and passed explicitly.
- Vegetation uses one `InstancedMesh` per primitive kind × chunk, with per-instance colour × baked vertical shade, and
  distance culling and LOD.
- All materials are `MeshLambertMaterial` with vertex colours; textures are canvas-generated at runtime; tone mapping
  is ACES ×1.15.
- `GLTFLoader`, `GLTFExporter`, `RoundedBoxGeometry` and `ConvexGeometry` ship inside the installed `three` package, so
  no new dependency is needed. The project currently loads no external models.

### 6.2 Changes needed before richer assets

These are small, contained changes for step 2:
1. **Batcher:**
   - Keep an incoming `color` attribute, multiplied by the part tint.
   - Optionally keep the index when all parts are indexed.
   - Optionally keep `uv1`.
   - A unit test should check that colours and normals survive merging.
2. **`boxGeo`/rounded box with grain orientation:** a UV option that aligns wood grain to the longest axis.
3. **Contact-shadow decals:** an instanced decal class next to `LightPatches`.
4. **Value-only textures + palette constants:** one `palette.ts` holding the swatches in §5.3. Textures are
   re-authored to greyscale motif.
5. **Sheen material** (one, shared): `MeshPhongMaterial` with low shininess, or `MeshStandardMaterial` if the owner
   wants it and phone tests pass.
6. **(Only if GLB is approved) a model library loader:**
   - Load a small `.glb` once before the world builds.
   - Look up named meshes.
   - Feed them to the Batcher or `InstancedMesh`.
   - Collision and hitboxes stay in code.
   - A validation script checks triangle count, bounds, pivot at base, metre scale and names.

### 6.3 Options

| | Visual control | Iteration speed | Reuse | Interaction / collision compatibility | Mobile cost | Maintainability |
|---|---|---|---|---|---|---|
| **A. Procedural modules in code**: extend the kit with rounded boxes, lathes, profile sweeps, convex rock hulls, parametric trees | Good for made things and rock; weaker for organic hero shapes, which risk looking "generated" | Fast (hot reload, no tools) | High (parametric) | Native: geometry and colliders share the same numbers | Excellent (batched/instanced) | Good if functions stay small; risk of bloated builder files |
| **B. Authored GLB** (Blender, by a person) | Highest, especially organic forms and cushions | Slower: export → import loop; needs an artist and Blender | Medium–high (an asset library) | Needs care: pivots/scale conventions; colliders authored separately in code | Good if budgets are enforced; adds download size | Medium: binary assets plus source `.blend` files to manage |
| **C. Code-generated GLB** (generator scripts export assets) | Same as A | Slower than A for no visual gain | Same as A | Same as B | Same as B | Worse than A: two representations |
| **D. Hybrid: A by default, B for organic hero assets only** | Good everywhere it matters | Fast for most; slower only where the payoff is real | High | Native for most; GLB only for passive scenery | Excellent | Good |

**Recommendation: D, starting procedural** (step-2 revision: a practical starting point, not an obligation).
- Step 2 is built entirely with option A plus the pipeline changes in §6.2 (1–5). That proves the style rules in the
  existing pipeline, with no new tooling.
- GLB (option B) is held in reserve for the one asset family where code is most likely to fall short: the broadleaf
  hero tree with roots and limbs.
- **Trade-off accepted:** if the procedural oak fails review, the plan switches that one asset to GLB rather than
  adding generator complexity.

**Blender**
- **Available?** Not installed in this container, and installing it is out of scope. This is unavailable tooling,
  not a proven blocker.
- **Useful?** Yes, for organic hero assets and for anyone authoring by hand.
- **Necessary for step 2?** No.
- Blender *automation* (headless scripts generating assets) is not recommended. It would duplicate what code
  generation already does here, with a heavier toolchain.

---

## 7. The two visual proofs (step 2 — specified, not built)

The two samples total **12 asset designs**. Each design becomes a reusable, parametric kit function with its rules
written down. Mass replacement across the estate only begins after both samples pass the review gate.

### 7.1 Interior proof — living-room hearth / mantel corner

**Area**
- Living room, plan X 72.4–85, Z 80.4–94.
- In scope: the west wall with the hearth, the sofa group, one window bay and the floor lamp.

**Asset designs (6)**
| # | Asset | Rules it establishes |
|---|---|---|
| I1 | **Hearth surround v2:** chimney breast with plinth and side pilasters; mantel shelf with moulded front edge and two corbels; firebox with real depth, an arched or splayed opening and a soot gradient; bevelled hearth slab; hearth fire shaped to the opening | Built stone coursework, mouldings, bevel rules, soot vertex colour, fixture-shaped light patch |
| I2 | **Brass stand + pinecone:** the shared three-part stand profile with sheen, and a pinecone with rows of overlapping scales | Hero prop silhouette in clay, brass sheen, prop scale (1.45×) |
| I3 | **Upholstered armchair → sofa:** frame with plinth/feet, seat cushion with seam gap, raked shaped back, rolled arms; the sofa is the same generator, wider, with 3 seat cushions | Upholstery rules, edge-softness by material, textile palette, contact decal |
| I4 | **Occasional table:** coffee table + side table from one generator; bevelled top with overhang, apron, turned or tapered legs set in | Joinery and furniture proportions, wood grain orientation |
| I5 | **Room trims:** skirting, cornice, window reveal with sill/frame/mullions, curtain with pleats on a rod with finials, chamfered beams on wall plates | Architecture rules (reveals, bevels, contact lines), plaster tint + vertex AO |
| I6 | **Floor lamp + light pool:** turned stem, weighted base, fabric shade with a lit interior gradient; a soft, shade-shaped floor patch | Fixture presentation (emissive vs illumination), soft patch rules |

**Existing assets that stay**
- Rug (recoloured to the palette; pattern calmer).
- Bookshelf.
- Painting frames.
- The other mantel objects: candle, clock, vase, cup, feather. They are re-checked in clay and only re-made if they
  fail.
- Ceiling.
- Floor geometry, retextured with value-only planks.

**Problems it tests**
- §3.1–3.6 indoors: boxes → built furniture, bevels, material separation, palette and value hierarchy, grounding.
- Interior fill reduction.
- Focal composition.

**Cameras**
- Baseline poses 01 (wide), 02 (mantel front), 03 (mantel near) and 04 (armchair near).
- Plus:
  - The hall → living doorway (lighting regression L1).
  - Sofa-seat height looking at the fire.
- **Near checks at 0.8 m:**
  - Mantel shelf edge.
  - Brass stand.
  - Armchair arm.
  - Table corner.
  - Skirting meets floor.

**Gameplay constraints (must not change)**
- Mantel slot positions and their left→right order facing the hearth (`mantelSlots`, canon tests).
- Fire on/off interaction and its hitbox.
- `fire.living` light id and persistence.
- Collision footprint of the hearth (≤ the current box) and of seating.
- The photo memory and floor lamp interactions.
- Walkable route from the hall arch to the mantel.

**Performance**
Measure at phone quality for poses 01–04, two runs each:
- Draw calls ≤ baseline + 8.
- Triangles ≤ baseline + 60 k, with ≤ 250 k absolute.
- JS gzip growth ≤ 25 KB.
- No new textures larger than 512².
- An owner phone check with `?debug=1` for FPS.

**Acceptance criteria**
- Passes [`REVIEW_CHECKLIST.md`](REVIEW_CHECKLIST.md). Specifically:
  - Every furniture piece is recognisable in clay at 2 m.
  - The fire is the brightest warm element in 01.
  - The brass stands are distinguishable from the other bases at 2.8 m in both game and clay passes.
  - No object floats (contact line visible).
  - The owner approves the look.

### 7.2 Exterior proof — woodland approach to BOSLUST

**Area**
- From the southern loop at the fork (55.5, 8.6) through the cut (60–66 × 8–18) to the door at (63, 18.2), plus
  about 8 m of woodland either side.

**Asset designs (6)**
| # | Asset | Rules it establishes |
|---|---|---|
| E1 | **Broadleaf oak** (hero + supporting + far LOD from one generator): flared roots, tapered trunk, visible fork into limbs, lobed crown with flat-ish underside | Tree rules, species silhouette, canopy shading, LOD chain |
| E2 | **Scots pine:** tall bare trunk with warm upper bark, high umbrella clumps, a few dead stub branches | Second species family, Veluwe identity, replacement for stacked cones |
| E3 | **Rock set:** 3 shapes from one convex-hull generator, deliberate bevelled planes with consistent bedding tilt; used as outcrops on the hill and at the cut mouth | Stone rules, facet use, moss on top faces |
| E4 | **Dry-stone wall + headwall/portal:** courses with irregular capstones and a draped moss mass; a portal of timber posts, lintel and braces with roots that bend over the parapet | Built-stone rules, R2 construction logic, grounding |
| E5 | **Understory + verge set:** fern with fronds, bush clump, grass tuft, edging stones along the path, leaf-litter terrain tint | Terrain transitions, framing rules, density limits |
| E6 | **Fork signpost:** post with bevelled cap, the forked arm with readable carved boards, a stone at its foot | Hero-prop rules outdoors, puzzle readability |

**Existing assets that stay**
- Terrain heightfield and collision.
- Path routing.
- Hill shape (outcrops are added, not reshaped).
- Door, BOSLUST sign, tablet and lock panels: content unchanged; frames rebuilt in E4.
- The hut behind the door.
- Mushrooms, re-placed as root clusters only.
- Distant forest outside the sample area. It is left as is and *becomes the visual comparison*.

**Problems it tests**
- §3.1, 3.3, 3.5–3.8 outdoors: tree silhouettes, rock planes, terrain transition, foliage palette, depth layering.
- Warm destination.
- The draw-call budget under pressure.

**Cameras**
- Baseline poses 13 (fork), 14 (cut) and 15 (door).
- Plus:
  - 11 (southern loop).
  - A view back from the door toward the fork.
- **Near checks at 1 m:**
  - Oak root flare.
  - Rock face.
  - Fern.
  - Wall capstone.
  - Signpost arm.
  - Door frame joint.

**Gameplay constraints (must not change)**
- Path walkability and the cut floor.
- Wall colliders (≤ current footprint).
- The BOSLUST door, sign text, tablet inscription, lock and all their hitboxes.
- The signpost's forked arm still matches the journal clue ("signpost with the forked arm").
- The e2e walkthrough route steps through the fork and cut.
- No foliage within 1.2 m of the path centreline or in front of the door, tablet or lock.

**Performance**
- Pose 15 must come **down** to ≤ 150 calls, from 154. Poses 13, 14 and 11 must stay ≤ 150 calls and ≤ 250 k
  triangles.
- To make room, merge the per-block cut walls and moss into the area batch, and instance the verge stones.
- Two runs each.
- An owner phone check with `?debug=1`.

**Acceptance criteria**
- Passes the review checklist. Specifically:
  - Oak and pine are distinguishable in clay at 15 m.
  - The cut reads as carved into rock (outcrops visible from pose 13).
  - The path edge is visible in clay.
  - Foliage greens sit within the §5.3 saturation rules on sampled pixels.
  - The door is the warmest point of interest in poses 14–15.
  - Every puzzle element remains readable.

### 7.3 How the samples become estate rules

After the gate is passed, each of the 12 designs is kept as a documented kit function (parameters, defaults, the
rule it embodies, tier). Rollout then proceeds area by area. It reuses the kit rather than inventing new assets:
- Trims and furniture → all manor rooms.
- Oak/pine/rocks/verge → all woodland.
- Wall/portal → shed, cottage, sauna.

Every area passes the same checklist with before/after poses.

---

## 8. Critique of this plan (and the revisions it caused)

| Question | Assessment | Revision made |
|---|---|---|
| **Do the references conflict?** | Yes:<br>• R3/R4 are saturated; R1/R6 earthy.<br>• R5 faceted; R3 soft.<br>• R3 looks illustrated (method unknown). | Explicit hierarchy (§2). R3/R4/R5 contribute shape rules only. Facets restricted to stone/slate. |
| **Do elevated/diorama images transfer to first person?** | Partly:<br>• Construction logic, materials and grounding transfer.<br>• Elevated composition, rooftop reads and layout-as-silhouette do not.<br>• R6 and R4 are the only eye-level references. | Composition rules come from R6/R4. Each sample is judged at eye height (1.65 m) and at near distance, not from above. |
| **Is the asset quality feasible in the current pipeline?** | For made things and rock, yes:<br>• Rounded boxes, lathes, extrusions and convex hulls are available.<br>• The Batcher keeps normals.<br>For organic hero trees, uncertain: procedural trees often look "generated". | The Batcher changes are listed (§6.2). An explicit fallback for the oak only (GLB), decided by the owner. |
| **Is the sample scope too broad?** | 12 designs plus lighting, tone mapping, decals and textures is a lot for one step. | Pipeline changes 1–5 are prerequisites, not separate deliverables. The tone-mapping switch is an owner decision tested by A/B, not assumed. Each species is 1 generator, not a family. If time runs short, the interior sample is finished first. |
| **Are the performance claims supported by measurements?** | Only the baseline numbers are measured, and only on SwiftShader (calls and triangles valid, FPS not). Cost estimates in §3 are expectations [P]. | Budgets are stated as *relative to measured baseline*. Pose 15 is already over budget, so the exterior sample must reduce calls first. Real-device FPS is an owner check, not a claim. |
| **Which assumptions could invalidate the plan?** | 1. Lowering fill light without shadow maps may make interiors murky rather than modelled.<br>2. `NeutralToneMapping` may flatten the warm-light contrast the direction relies on.<br>3. Contact decals may z-fight or show on stairs/slopes.<br>4. Rounded geometry triangle growth may exceed budgets in dense rooms (library).<br>5. The owner's taste may prefer the current brighter, more cheerful grade. | Each is tested inside the samples with before/after captures. Items 1–2 ship behind constants that can be reverted. Item 5 is decided by the owner before step 2. |
| **What requires human visual judgement?** | Whether the result feels inviting/mysterious/tactile; whether greens are "right"; whether the oak looks generated; whether the manor still feels like *this* house. | The checklist's numeric scores are discussion aids. **The owner's review decides** (REVIEW_CHECKLIST §0). |

The critique changed four things:
1. GLB-first was demoted to a fallback.
2. The tone-mapping change was demoted to an A/B decision.
3. The exterior performance budget became "reduce first".
4. A priority order was added (interior before exterior).

---

## 9. Decisions for the owner before step 2

1. **Direction.** Is "crafted European woodland manor" (§4) the right target, including the restrained palette in
   [`palette.svg`](palette.svg)? This is noticeably less bright and green than now.
2. **Tone mapping.** May step 2 A/B test `NeutralToneMapping` against the current ACES ×1.15 on both samples, and
   adopt it if the owner prefers it? It is a global change.
3. **Light balance.** May daylight fill drop by roughly half, with interiors dimmer and lit mainly by fixtures? This
   changes the mood of the whole game toward warmer pools and cooler shade.
4. **Organic assets.** If the procedural oak fails review, is a hand-authored GLB tree acceptable, and who would
   author it? Blender is not available in this environment.
5. **Budget trade.** The BOSLUST approach is already at 154 calls. May the exterior sample restructure how the cut
   walls and moss are batched to win calls back before adding assets?
6. **Real-device check.** Will the owner run both samples on their phone with `?debug=1` and report FPS? This is
   the only valid frame-rate evidence available.
7. **Order.** Interior first (recommended: smaller, fully controllable, tests most rules), or both in parallel?
