# DEV-03 — First-person visual / spatial audit of the DEV-02 estate (before edits)

Base: `e87e56b` (DEV-02 as built, the content of the live DEV-02 review; the Pages commit `8e720a1` on
`claude/wizardly-curie-y9xumd` is deployment-only and was reverted in `2efd7f0`; game code identical). Captured with
`npm run build` + `node scripts/dev03-views.mjs … docs/dev03/before` (53 poses at eye height 1.65 m, 1280 × 720,
SwiftShader, HUD hidden, seven doors open as in the DEV-02 view set). No playthrough video was available; the owner's
written playtest findings were used as the hypothesis list and checked against these frames.

Legend: **KEEP** works spatially, keep it. **FIX** concrete placement / furnishing / architecture / composition defect.
**TRANSFORM** blockout that the art rollout replaces with the production grammar ("warm vakwerk, helder bewijs").

## 1. Systemic categories (fix once, not object by object)

| # | Category | Where it shows | Systemic fix |
|---|---|---|---|
| S1 | **Material grammar**: neon lawn green, orange clay "gravel" and paths, confetti rugs (hall, living, guest room, library all the same loud rug), pink-orange planks, a beige blotch plaster, flat black-slate roofs, glossy unlit black ceilings upstairs | everywhere | one calmer, earthier material family in `textures.ts` + estate colour tokens (ART_TOKENS), rugs as a small set of designed rugs, ceilings plaster |
| S2 | **Furniture = boxes**: chairs are slabs on sticks, sofas/armchairs/beds/wardrobes/tables are untreated boxes; the living-room sample's grammar exists but is used only behind `?art=sample` | all interiors, garden platforms | rebuild the shared `furniture.ts` pieces on the art kit (softBox, profiled tops, tapered legs, rails, baked contact AO), same signatures → every room upgrades; living-room sample becomes the normal game |
| S3 | **Architecture = thin planes**: windows are flat glowing amber cards on the wall (all lit at daytime), no reveal, surround or lintel; porch is a thin black slab on two posts; plinth 0.15 m; dormers are boxes; eaves a flat fascia; stair is a stepped block | manor, wing, cottage, sauna, shed, BOSLUST | `arch.ts` kit: profiled window surround (sill with drip, lintel/keystone, reveal, glazing bars, cool daylight glass with a few warm-lit rooms), door architraves with plinth blocks, eaves with soffit + gutter + downpipes, deeper plinth and quoins, porch entablature and roof, stair stringer + nosings, turned balusters |
| S4 | **Woodland = lollipops on a lawn**: blob crowns on cylinder trunks, evenly spaced on bright grass, shrubs as flattened green pebbles, stumps as pegs, nothing below 1 m except blobs; the forest is a park. The woodland kit (branch-structured species, understory, litter, LOD, one draw call) exists only inside the BOSLUST sample zone | whole south forest, north/east masses, garden trees | woodland kit estate-wide on one multi-draw batch with LOD + range culling, layered understory (hazel/holly/young trees/ferns/bilberry/dead wood), forest-floor colouring, density by zone (dense masses vs glades vs garden) |
| S5 | **Light**: upstairs ceilings render near black; every exterior window glows; the forest floor is uniformly bright; no warm/cool separation | upstairs, exterior | plaster ceilings with fill, warm fixtures, interior sample lighting on by default, cooler woodland fog/fill |
| S6 | **Props = coloured blocks**: red crates are solid red cubes, BBQ a black box, gravity bong a grey pipe, balloons floating spheres, cars toy boxes with half-disc wheels, bar a box with two cylinders | hall, kitchen, garden, arrival, Copacabana | prop kit pieces with recognisable silhouette and two identifying features (ART_BIBLE §4) |

## 2. Per zone

### Arrival / manor approach (a01–a05, f01)
- **KEEP** the drive on the house axis, the long reveal through the trees, one court with the centre planter, cars off the axis, the fifth bay free.
- **FIX** court reads as orange clay (gravel); hedges are a row of identical blobs; cars have floating black half-disc wheels and no glass; porch roof is a 10 cm black slab; facade windows all glow amber in daylight.
- **TRANSFORM** facade into the architectural kit (plinth, quoins, string course, cornice, window surrounds, porch with entablature + roof, gutters); cars into a small car kit (body, glasshouse, wheel arches, tyres).

### Vestibule / hall (b01–b04, b13)
- **KEEP** the axis vestibule → hall → lobby arch, gallery round the void, stair along the east wall, maquette table against the west wall (DEV-02 decision), console with drawer.
- **FIX** confetti rug dominates the floor; tapestry above the stair is a rug texture glued to the wall; chandelier is flat black spokes; red crates are solid red cubes; stair reads as a stepped wooden block; bare brown ceiling.
- **TRANSFORM** stair (stringer, nosings, turned newel and balusters), chandelier (ring + arms), calm hall runner rug.

### Living (b05–b07)
- **KEEP** room function and hearth focal point, sofa group facing the fire, reading corner by the floor lamp.
- **FIX** furniture boxes (S2), armchairs with "striped cushion" texture, a bookcase alone in a corner.
- **TRANSFORM** make the approved living-room sample (hearth V2, sofa/armchair/table family, rug, curtains, beams) the normal game; this room is the interior quality bar.

### Library (b08, b09)
- **KEEP** double-height volume, gallery, centre reading table under the chandelier, freestanding stacks in a symmetric aisle.
- **FIX** a blue "mushroom" (globe on a stick) stands alone on the floor; rug identical to the living room; bookcase ends are bare boxes.
- **TRANSFORM** bookcases with cornice/plinth and side panels; globe on a real stand next to the reading table.

### Dining / kitchen (b10–b12)
- **KEEP** dining as the eat/game room (table, game, beer) and the kitchen → service corridor route.
- **FIX** dining chairs are slabs; **kitchen is a large empty tiled field**: units are three loose mint boxes, a second dining table floats in the middle, no cooker/hood/sink reading, the 8 red crates are solid red cubes in a row against a unit, beer crates as dark cubes.
- **TRANSFORM** kitchen composed as a working kitchen: range + hood as focal point on the east wall, worktop run with sink under the window, open shelves, island with stools, crates as stacked real crates; the table stays as the kitchen table but dressed.

### Copacabana / serre (d01–d03)
- **KEEP** pool, glass box, double door to the deck, name boards.
- **FIX** bar is a box with two cylinder stools facing the glass, its bottle shelf floats on a glazing bar; plant pot alone at the pool edge.
- **TRANSFORM** a real bar (front panel, counter, foot rail, back-bar shelf on its own frame, stools with seats), loungers, warm string lights.

### Sauna / jacuzzi / deck (d04, d05)
- **KEEP** barrel sauna on its ramp and landing, round jacuzzi, deck footprint, handrails (DEV-02 accessibility fix).
- **FIX** loungers are flat boxes with white slabs; the deck ends abruptly on lawn with a raw edge; lantern posts thin sticks.
- **TRANSFORM** deck edge board + skirt, loungers with frame and cushion, towel rack, sauna bench + bucket at the door.

### Upstairs / attic (g01–g05)
- **KEEP** corridor plan, attic stair, rear loop, attic rooms and structure posts.
- **FIX** ceilings near black (S5); guest-room dado rail at seat height reads as a black stripe; attic clothesline crosses the main walking line; attic sofa pushed far against the gable.
- **TRANSFORM** furniture via S2; attic composed as one weekend room (sofa + table group under the lantern, drying line along the knee wall).

### Social garden (c01–c03, c05)
- **KEEP** the platforms and their separation (BBQ / dining / music / balloon nook), the free centre path to the lanterns, the lantern lawn.
- **FIX** indoor dining chairs stand on outdoor platforms; BBQ a black box; gravity bong a grey pipe; balloons float; **purple crystal "flowers"** scattered on the lawn read as gems; platforms are raw pavers with no edge or planting; terrace pot plants are lollipops.
- **TRANSFORM** garden furniture set (slatted table + benches, folding chairs), kettle BBQ with prep table, music corner with poufs and low table, tethered balloons, border planting along platform edges, lawn with real low flowers.

### Lake / Portugal cottage (e01–e06)
- **KEEP** the lake basin and dry viewpoint, the cottage on its plateau with the covered terrace, the out/return routes.
- **FIX** terrace floor uses the roof-tile texture (loud orange), terrace table props are flat coloured slabs; reeds are sticks; shore has no transition (grass straight into water).
- **TRANSFORM** terracotta floor tiles, the table dressed (cards, bottles, pizza box readable), reed clumps from the plant kit, shore stones and a small jetty-free edge.

### Woodland routes / discoveries (f02–f13)
- **KEEP** the path network and every discovery location (shed, fire clearing, well, fork, BOSLUST, wickerman, golf), their colliders and ids.
- **FIX** stumps as rows of pegs around the fire clearing; shrubs as flattened pebbles; the well stands on open lawn; wickerman bench is a flat plank box, candles are white sticks; golf bag a blue box; the forest is visible across from one clearing to the next.
- **TRANSFORM** woodland kit estate-wide (S4) with density and sightline control so discoveries are found, not seen from the lawn; dead wood, rocks, ferns at clearings; the forest edge as a layered wall (understory + young trees).

## 3. Not a game bug

- DEV-02 view 32 (north edge) was taken with the camera below the ridge surface (pose y = 2 on terrain at 4.1); the pose is
  corrected in the DEV-03 set (f12).

## 4. Render cost before (low / high, calls / triangles; guide ≤ 150 / 250 k at low)

See [`before/views.json`](before/views.json). Over-guide views already in DEV-02: hall from the vestibule 159–164, hall stair
187, living reverse 183 (looking into the hall), sauna/jacuzzi 157, double door 151. Highest triangles: living reverse
245 k, lobby 239 k, BOSLUST cut 247 k.
