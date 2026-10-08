# DEV-04B — Visual grammar & asset convergence

Core rule of the pass: **one construction grammar for the props the player looks at most** — books, beds, chairs,
tables, storage, rugs, crates, timber — built once as shared families, composed into the rooms and hero places, and
checked by rules that make floating, sunk, hollow or disconnected pieces fail a build. It is not an interaction pass:
no candle states, no ignition, no fire VFX, no new puzzles, no estate or manor resize (those are DEV-04C or later).

## 0. Start point

| | |
|---|---|
| Start | production `ccr-75ef4113-kfkimm` @ `c97a06f0c7e9a0594a020d8d2f5ae45deb0f27a2` (DEV-04A merged, `docs/reference/dev04/` present). The work branch `ccr-6f6fb018-yr1gfm` was verified identical to it and clean before the first edit |
| Work branch | `ccr-6f6fb018-yr1gfm`; draft PR against `ccr-75ef4113-kfkimm` |
| Read first | DEV-03 rollout / audit and DEV-04A correctness reports, the DEV-04 reference pack (handoff, personalized boards, checklist, index, the `00`–`07` and `99_avoid` folders, generated collage) |
| Not done | no merge, no deploy, no DEV-04C work |

Commits (each builds and passes its own checks):

| Commit | Scope |
|---|---|
| `3997377` | baseline evidence script `scripts/dev04b-views.mjs` + 49 before captures on `c97a06f` |
| `91fc29e` | timber family: closed logs, split firewood |
| `1d2f947` | prop kit: books, rugs, game boxes, bottles / crates / groceries, bedding drape; construction audit |
| `22a8d5f` | furniture families: bookshelf, beds, chairs, sofas, tables, loungers, rugs, curtains, lectern, bath, telescope, bar sign |
| `a724846` | room composition with the families; service / upstairs-east culling regions |
| `528e35c` | hero locations: campfire, well, golf, Wickerman, Copacabana sign mounting |
| `6a59745` | unit tests for the family construction rules, dev probes |
| `310da50` | B4 estate-wide primitive audit fixes |
| `5b8ef58` | performance pass (arrival views back under the low guide) |
| `03d3812` | `e2e:dev04b` browser suite + two culling fixes it found |
| (this) | report, after / compare evidence |

## 1. Asset inventory and decisions (B1)

Decision key — **KEEP** as is · **TUNE** same model, parameters / proportions / segments · **REMODEL** same role and
footprint, rebuilt construction · **REPLACE** new family takes over every call site · **REMOVE** deleted.

| Family | Before (c97a06f) | Decision | After |
|---|---|---|---|
| Books (shelves) | one coloured box per book or a slab of "spines" on the shelf face | **REPLACE** | `propkit` book family: hard / soft covers built as closed U-shells (boards + rounded or flat spine) with a 3 mm overhang over a recessed paper block with page lines; 4 sizes × 4 thicknesses × 8 spine designs (bands, labels, gilt); a shelf variant that only carries the faces visible on a shelf (14–26 triangles); composed shelves: sets of one binding, singles, leaners resting on a neighbour, flat stacks, objects, gaps. Library shelves are packed, the living-room shelf uses a *living* mix |
| Books (tables, lecterns) | flat boxes | **REPLACE** | open books (pages rising into the gutter, covers flat), stacks, the open guestbook / ledger read as books |
| Beds | `bed()` = boxes; `bed2()` = box mattress + box duvet, pillows leaning into the headboard | `bed()` **REMOVE**, `bed2()` **REMODEL** | closed frame (posts, rails, slatted deck), crowned mattress, a duvet that rolls over the mattress edge and foot keeping its thickness (`drapeGeo`), a turned-down band, pillows lying on the mattress against the headboard, optional throw and cushion; panel / spindle / upholstered headboards |
| Chairs | one box-built chair | **REMODEL** | one family, four builds: ladder-back, spindle (Windsor bow back), upholstered dining, carver (arms); tapered legs, stretchers, seat pads |
| Sofas / armchairs | DEV-03 box sofa / armchair | **REPLACE** by the owner-approved living-room upholstery | `livingSample.upholstered` everywhere (turned feet, crowned seat cushions, raked back, rolled arms), `lite` segment count away from the living room, a wing-back option (library / study) |
| Loungers | wheels hanging 12 cm under the rail on nothing, flat back | **REMODEL** | wheels on an axle through the head legs, the back hinged at the seat end and propped on stays, cushions on the slats, folded towel |
| Tables | centre stretcher hanging in the air on long tables | **TUNE** | H-stretcher on long tables, an open apron side where chairs tuck under (`openSide`) |
| Cabinets / shelving / wardrobes | pantry / linen / workshop shelves were solid blocks with cylinders or slabs stuck on their faces; the hall console a solid box | **REPLACE** (shelving, sideboard, larder, commode), **KEEP** (DEV-03 wardrobe, kitchen counter) | `shelvingUnit` with loads (jars, tins, crates, archive boxes, tools, linen, books, empty), `sideboard`, `larder`, the hall commode round the unchanged `hall.drawer` |
| Rugs | the floor-rug texture tinted per room, also used as a wall hanging | **REPLACE** | one atlas of 8 designs with their own borders (medallion, kilim, lattice, field, runner + runner ends, braided oval, woven hanging), optional fringe; a coir mat in the vestibule instead of a second carpet |
| Game boxes | plain coloured boxes | **REPLACE** | printed lids (abstract lid art) over a tray, an open variant with pieces; board-game set on the dining table |
| Beer / grocery crates | red boxes | **REMODEL** | slatted shopping crates (rims, bands, posts, handles) with loads (produce piles, leeks / cabbage / carrots, bread, pantry, drinks); beer crates with dividers and capped bottles |
| Logs / timber | logs were open tubes (no end grain, hollow branch stub) | **REMODEL** | `logModel` one closed solid: caps on the body's own end rings, capped stub, end grain baked (pale, dark heart, bark rim); `splitLogModel` closed wedge for woodpiles and laid fires |
| Curtains | flat slabs | **REMODEL** | pleated drapes on rings and a rod with finials and brackets |
| Lectern, bath, telescope | boxes / DEV-03 telescope | **REMODEL** | lectern with a sloped book rest; roll-top bath on feet; telescope with tube, finder, focuser, fork, tripod and tray |
| Copacabana sign | DEV-04A carved board | **REMODEL** | shaped board, fitted bouncing display lettering, a ROOM line; same wall-art id and canopy mounting |
| Coat pegs + green slab, room name boards, carpets in passages / under the billiard table | placeholders | **REMOVE** | coat rail with coats, no carpet where it only filled floor |
| Dressing pieces (new) | — | new | billiard table, cue rack, tool wall, floor globe, log basket, coat rail, pedestal basin, towel rail, luggage rack, writing desk, tabletop sets, toilet, utility sink |

Every family is built through the art kit's `Asm` and merged by the `Batcher` into the area's existing per-material
batches; all prop-kit textures (spines, paper, rugs, prints) live on **one 1024² atlas material**, so the families add
no per-object draw calls.

## 2. Reference mapping

| Reference folder (`docs/reference/dev04/`) | Used for |
|---|---|
| `03_assets/books_closeup`, `07_materials/paper_book_surfaces` | cover overhang, rounded spines, page-block colour bands, sets of one binding, leaners and stacks |
| `03_assets/bed_textiles`, `07_materials/fabric_leather` | duvet thickness over the edge, turned-down band, pillows on the mattress, throws |
| `03_assets/tables_chairs`, `03_assets/living_dining_furniture`, `03_assets/sofas_armchairs`, `00_calibration/living_room_candidate` | chair family (ladder / Windsor / upholstered / carver), H-stretchers, the living-room upholstery as the house standard |
| `03_assets/crates_bottles_clutter`, `03_assets/kitchen_cabinetry_sink` | slatted shopping crates, beer crates with dividers, pantry shelving loads, utility sink |
| `03_assets/workshop_workbench_tools`, `03_assets/travel_case` | tool wall, shelving with tools, luggage rack and open case in the Reiskamer |
| `05_landmarks_hero_props/firepit_firewood` | hearth-stone ring, ash bed, seat-log circle with gaps at the paths, split-log teepee |
| `05_landmarks_hero_props/water_well` | open shaft with depth and water, coping, posts on pads, roof, windlass, rope, bucket |
| `05_landmarks_hero_props/wickerman_clearing` | willow armature + irregular woven bands, bindings, head cage, lashed shoes (DEV-04A staging kept) |
| `05_landmarks_hero_props/telescope`, `04_special_locations/attic_observatory` | observatory desk, chart, telescope build; identity without clutter |
| `05_landmarks_hero_props/boardgame_scene` | game boxes with printed lids, an open game on the dining / attic tables |
| `04_special_locations/copacabana_bar_sign`, `copacabana_room` | sign proportions, playful lettering fitted to the board, canopy integration |
| `04_special_locations/billiard_room` | table construction (turned legs, apron, cushion rails, pockets), cue rack |
| `04_special_locations/portugal_interior`, `00_calibration/portugal_exterior` | cottage dressing (kilim, sideboard + plates, candlestick, folded cloths) |
| `00_calibration/boslust` | protected: unchanged, used as the calibration view (`h15`, `h16`) |
| `99_avoid/too_boxy_geometric`, `unsupported_floating` | the B4 audit list and the construction-audit rules |

## 3. Shared visual grammar

1. **Closed solids.** Anything that can be seen from more than one side is closed and faces outward (logs, book
   covers, split firewood, drapes) — unit-tested with an open-edge / winding audit and signed volume.
2. **Carried, not placed.** Every part rests on, hangs from or is joined to another: legs to the floor, wheels on an
   axle, a back on stays, coats on hooks, pillows on the mattress. `Asm.begin/end` checks the lowest point against the
   support height and the parts' bounds for one connected group; any failure is published in
   `scene.userData.assetWarnings` and fails `e2e:dev04b`. Wall-mounted pieces skip the ground rule explicitly.
3. **Thickness reads.** Sheets keep their thickness round edges (duvets, throws), boards have edges (shelf lipping,
   cover overhang), recesses are real (book block inside the boards, the utility-sink bowl, the well shaft).
4. **Construction over decoration.** A piece reads by how it is made (stretchers, rails, stiles, slats, bindings);
   colour variation comes after, from sets and palettes, never as the only difference between variants.
5. **One family per role.** One chair family, one upholstery, one book family, one rug atlas: rooms differ by
   composition (what is used where, density, zones), not by a new private model per room.
6. **Pay only for what is seen.** Shelf books carry only shelf-visible faces; produce piles build only the top layer
   on a filler bed; soft parts use the lowest segment count that still reads at play distance.

## 4. Rooms (B2)

| Room | Composition change |
|---|---|
| Vestibule / hall | coir mat (not a second carpet), slatted bench, coat rail with coats, runner and a woven hanging of its own design, loaded shopping crates, the commode (B4) |
| Living | kept (owner-approved calibration); log basket at the hearth, the shelf now a living mix of books and objects |
| Library | packed shelves from the book family, reading table with open guestbook, wing chair + side table, floor globe, lectern |
| Dining | one set: upholstered dining chairs down the sides, carvers at the heads, lattice rug marking the zone, turned brass candlesticks, board game, bottles, sideboard |
| Kitchen | Windsor chairs, larder, prep table, loaded crates, beer crates, range dressing |
| Pantry / utility / workshop | open shelving with loads, sacks, utility sink + towel rail (B4), tool wall, workbench zone |
| Billiard | built billiard table (no carpet under it), cue rack, the armchair faces the table |
| Reiskamer (travel) | panel bed with throw and cushion on a fringed kilim, a folding luggage rack with an open travel case (lined shell, lid propped on its hinges, straps, labels, folded clothes — was a box and a tilted slab), blanket chest, writing desk with open book + stack and a carver |
| Sterrenkamer (stars) | upholstered-headboard bed with cushion and throw on an oval rug; the logbook is a book from the family |
| Guest / north guest room | spindle bed with throw, bedsides, blanket chest, oval rug, reading chair |
| Study / botanic | the forest map faces the room (it faced the wall), floor globe, desk zone with a chart; the herbarium is an open folio with pressed leaves |
| Bathroom / guest WC | roll-top bath, pedestal basin (was a white box), towel rail, bath mat; toilet and pedestal basin in the guest WC (B4) |
| Attic common / observatory | armchairs turned to the group, an open game; observatory desk, chart, chest, telescope — identity without clutter |
| Portugal cottage | kilim, sideboard with plates, candlestick, folded cloths, game boxes, book stack, bottles |
| Copacabana / wellness | loungers rebuilt, the sign (B3) |
| Basement archive | archive shelving with boxes |

Pre-existing problem found by the audit and fixed: the dormer bodies z-fought with the upstairs ceilings.

## 5. Hero locations (B3)

| Place | Change | Kept |
|---|---|---|
| BOSLUST | **protected** — no edit; used as the calibration view | everything |
| Campfire | 12 sooted hearth stones round an ash bed with charred ends; three closed seat logs on chock stones in a rough circle with two stumps, gaps at the paths; split-log teepee for the firewood state | fire ids, states, firewood logic |
| Wickerman | willow figure (`wickerman.ts`): armature of bundled legs, elliptical torso staves, shoulder yoke, bent arms, neck; irregular woven bands, twine bindings, splayed fingers, woven head cage; feet lashed into timber shoes on the sleepers; candles unlit in glass jars | DEV-04A plinth, staging, collider; **no interaction / fire state**: candle positions are published as `scene.userData.wickerCandles = { centre, candles[9] }` for DEV-04C |
| Well | open shaft (lathe wall, coping stones, water 1.7 m down, darkening with depth); a depth-only disc drawn after the shaft interior stops the terrain from capping the hole; posts on pads, tie beam, roof, windlass with rope and crank, a wound-up bucket and one on the rim | well ids / interactions |
| Golf | 1.5 m wide ramp on trestles with side boards and a centre guide, a flaring catch tray with returned balls, a target board with the cup; the stand bag rebuilt (body, collar, open throat with dividers and clubs, pocket, strap, legs) | tee mat, spur, collider |
| Copacabana sign | shaped board, display lettering fitted to it with a playful bounce, ROOM line; taller uprights and cap rail so it sits in the canopy; readable at phone size (see `h11`) | DEV-04A doors, wall-art id |
| Attic observatory | desk, star chart, chest, telescope; the nook kept clear for the operator spot | DEV-04A attic geometry, walk route |

## 6. Estate-wide primitive / garbage audit (B4)

Every remaining placeholder that read as a primitive at eye height was traced and rebuilt or removed; canonical
interactables and puzzle evidence were left in place (only their surroundings changed):

| Where | Before | After |
|---|---|---|
| Hall console (`hall.drawer`) | a solid box whose front face lay in the drawer front's plane (z-fight) | commode: sides, back, dust board, rail + stiles round the drawer, panelled doors, moulded top; the drawer and its dials unchanged |
| Guest WC | white boxes | toilet (pedestal, seat, cistern) + pedestal basin |
| Utility room | two boxes | sink cabinet with doors, ceramic rim round a 12 cm bowl, pillar tap |
| Boiler room | flue stopping short of the ceiling | flue and bands reach the ceiling |
| Route chamber | pipes ending 45 cm under the ceiling | pipes run up into it |
| Side gate | green blobs balanced on the piers | dressed pier caps + ball finials |
| Shed | bare cylinder as chopping block | sawn stump with the axe sunk into it |
| Forecourt | plain drum planter | dressed planter (plinth course, moulded rim) |
| Hall coat pegs | three pegs + a green slab standing off the wall | coat rail with coats on its hooks |
| Pantry / linen / workshop | shelves as solid blocks with things stuck on their faces | open shelving with loads |

Not changed (deliberately): the maquette, the BOSLUST zone, puzzle panels and their evidence, door / window
architecture (DEV-04A), the living-room calibration set.

## 7. Validation added

- **Unit** `tests/dev04b.test.ts` (12): logs / split logs / book covers closed and outward-facing; covers overhang and
  the block is recessed in every size class; size / thickness / cover type give different constructions (not
  recolours); the shelf variant is cheaper and carries only visible faces; open books finite; duvets keep thickness
  and hang; rugs map inside their atlas sheet; `toAtlas` clamps; the audit's floating / sinking / disconnected rules.
- **Construction audit** (`Asm.begin/end`, `artkit.ts`): runs on every build; 123 audited pieces, 0 warnings.
- **Browser** `npm run e2e:dev04b` (9 checks): audit clean and every converged family (26) built through it;
  DEV-04A contracts still hold; no NaN / infinite vertex; **every room-culled batch is drawn in the rooms its geometry
  stands in** (catches a piece batched with the wrong area — verified by mutation: the guest WC back in the
  service-wing batch fails it); Wickerman candle hook; ids / checkpoints / save schema; hero-view budgets.
- **Dev probes**: `dev04b-probe` (warnings + NaN), `dev04b-chunks` (triangles per chunk), `dev04b-pick` (what surface
  is under a pixel), `dev04b-drawlist` (render list of one view by batch and material), `dev04b-tris` (triangles per
  audited asset).

## 8. Test results

PLACEHOLDER_TESTS

## 9. Performance (low quality — mobile guide ≈ 150 calls / 250 k triangles)

PLACEHOLDER_PERF

## 10. Save / ID status

PLACEHOLDER_SAVE

## 11. Before / after evidence

PLACEHOLDER_EVIDENCE

## 12. Known issues

PLACEHOLDER_ISSUES

## 13. Deferred to DEV-04C

PLACEHOLDER_DEFER
