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
| `67fc0d5` | report draft |
| `e19e257` | Wickerman packed with hay (owner request during the pass) |
| `7ae10f3` | regressions found by the full / dev02 suites (walkthrough route, living-room colliders, golf chute) + living-room batch |
| (last) | report, after / compare evidence |

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
| Wickerman | willow figure (`wickerman.ts`): armature of bundled legs, elliptical torso staves, shoulder yoke, bent arms, neck; irregular woven bands, twine bindings, splayed fingers, woven head cage; feet lashed into timber shoes on the sleepers. **Packed with hay** (owner request): lumpy closed hay volumes just inside the staves and bands, straw wisps through the gaps, cuffs and crown, textured from a straw sheet on the prop atlas so it reads as straw, not a smooth body. Candles unlit in glass jars | DEV-04A plinth, staging, collider; **no interaction / fire state**: candle positions are published as `scene.userData.wickerCandles = { centre, candles[9] }` for DEV-04C |
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

- **Unit** `tests/dev04b.test.ts` (13): logs / split logs / book covers closed and outward-facing; covers overhang and
  the block is recessed in every size class; size / thickness / cover type give different constructions (not
  recolours); the shelf variant is cheaper and carries only visible faces; open books finite; duvets keep thickness
  and hang; rugs map inside their atlas sheet; `toAtlas` clamps; the audit's floating / sinking / disconnected rules; the Wickerman is finite, on its shoes and its hay is closed and inside the willow cage.
- **Construction audit** (`Asm.begin/end`, `artkit.ts`): runs on every build; 123 audited pieces, 0 warnings.
- **Browser** `npm run e2e:dev04b` (9 checks): audit clean and every converged family (26) built through it;
  DEV-04A contracts still hold; no NaN / infinite vertex; **every room-culled batch is drawn in the rooms its geometry
  stands in** (catches a piece batched with the wrong area — verified by mutation: the guest WC back in the
  service-wing batch fails it); Wickerman candle hook; ids / checkpoints / save schema; hero-view budgets.
- **Dev probes**: `dev04b-probe` (warnings + NaN), `dev04b-chunks` (triangles per chunk), `dev04b-pick` (what surface
  is under a pixel), `dev04b-drawlist` (render list of one view by batch and material), `dev04b-tris` (triangles per
  audited asset), `dev04b-budget` (calls / triangles of the full-suite and hero poses on any build).

## 8. Test results

Final gate on a clean production build (`rm -rf dist && npm run build`, served with `vite preview`), last code commit
`7ae10f3`:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npx vitest run` | **195 / 195** (14 files; 13 in `tests/dev04b.test.ts`) |
| `npm run build` | pass (the chunk-size warning is pre-existing) |
| `npm run e2e:dev04b` (new) | **9 / 9** |
| `npm run e2e:dev04a` | **19 / 19** |
| `npm run e2e:dev03` | **11 / 11** |
| `npm run e2e` (full) | **103 / 103** |
| `npm run e2e:dev02` | **34 / 34** |
| `npm run e2e:dev01` | **34 / 34** |

The suites caught real regressions on the way, all fixed rather than worked round: the guest WC, the rear-nook sconce
and the billiard south strip disappearing after the batch splits (`e2e:dev04b`), the kitchen prep table on the
walkthrough route and the log basket's collider existing in one living-room set only (`e2e`), the golf catch tray
walkable (`e2e:dev02`), and the forecourt → manor view at 252.0k triangles (`e2e`).

## 9. Performance (low quality — mobile guide ≈ 150 calls / 250 k triangles)

Counts are `renderer.info` after one low-quality frame (the phone default: no shadow maps), 1280 × 720.

**DEV-04A budget views** (`e2e:dev04a` check 8; standard door state: front door + Copacabana double door open). Rule:
calls ≤ max(150, before) + 6, triangles ≤ max(250k, before) × 1.08, and a view under the guide must stay under it.

| View | Before (c97a06f) calls / tris | After | Δ |
|---|---|---|---|
| atticNook | 35 / 95,802 | 41 / 99,132 | +6 / +3.5% |
| atticCommon | 36 / 105,710 | 39 / 101,408 | +3 / -4.1% |
| conservatoryInside | 77 / 132,984 | 74 / 128,198 | -3 / -3.6% |
| conservatoryDoorDeck | 142 / 207,920 | 142 / 205,264 | +0 / -1.3% |
| wellnessDeck | 69 / 151,767 | 65 / 155,249 | -4 / +2.3% |
| saunaAccess | 148 / 225,826 | 148 / 225,558 | +0 / -0.1% |
| wickermanClearing | 26 / 162,702 | 31 / 160,577 | +5 / -1.3% |
| wickermanPath | 30 / 181,464 | 35 / 211,041 | +5 / +16.3% |
| frontForecourt | 146 / 251,342 | 138 / 205,474 | -8 / -18.2% |
| arrivalCourt | 140 / 247,884 | 132 / 202,016 | -8 / -18.5% |
| portugalTerrace | 31 / 91,537 | 31 / 91,407 | +0 / -0.1% |
| portugalApproach | 32 / 119,009 | 33 / 119,023 | +1 / +0.0% |
| golfVicinity | 48 / 183,281 | 56 / 197,645 | +8 / +7.8% |
| golfSpur | 92 / 257,332 | 93 / 262,430 | +1 / +2.0% |

**Full-suite render poses and DEV-04B hero views** (`scripts/dev04b-budget.mjs`, front door open, both builds measured
the same way):

| View | Before (c97a06f) calls / tris | After | Δ |
|---|---|---|---|
| gate (driveway) | 99 / 234,707 | 99 / 234,905 | +0 / +0.1% |
| forecourt → manor | 137 / 248,837 | 129 / 204,419 | -8 / -17.9% |
| entrance hall | 97 / 169,994 | 104 / 192,890 | +7 / +13.5% |
| library | 54 / 127,984 | 54 / 185,684 | +0 / +45.1% |
| garden → manor + conservatory | 137 / 207,792 | 138 / 205,026 | +1 / -1.3% |
| forest (shed area) | 33 / 158,537 | 36 / 148,647 | +3 / -6.2% |
| BOSLUST cut | 87 / 225,857 | 87 / 223,019 | +0 / -1.3% |
| conservatory pool | 102 / 175,446 | 101 / 174,466 | -1 / -0.6% |
| campfire | 25 / 118,513 | 27 / 108,527 | +2 / -8.4% |
| well | 42 / 168,763 | 52 / 177,995 | +10 / +5.5% |
| wickerman figure | 36 / 181,556 | 36 / 196,152 | +0 / +8.0% |
| golf chute | 47 / 152,385 | 55 / 164,413 | +8 / +7.9% |
| dining | 68 / 129,870 | 60 / 132,070 | -8 / +1.7% |
| kitchen | 58 / 148,222 | 55 / 135,888 | -3 / -8.3% |
| attic observatory | 36 / 95,976 | 37 / 93,704 | +1 / -2.4% |
| Copacabana bar | 51 / 124,045 | 52 / 125,503 | +1 / +1.2% |
| Portugal cottage | 36 / 101,301 | 39 / 103,083 | +3 / +1.8% |

Every view stays inside the mobile guide (≤ 150 calls, ≤ 250k triangles) except **golfSpur**, which was already over it
before DEV-04B (257.3k) and is now 262.4k (+2.0%, inside the +8% regression allowance). Increases and why they are
accepted:

- **Library +45% triangles (128k → 186k, same 54 calls)**: real books. Each shelf book carries only the faces a shelf
  shows (14–26 triangles) and the library is still 64k under the guide; the books are the point of the room.
- **Wickerman path +16% (181k → 211k), figure +8%**: the willow figure (rods, bands, bindings) and its hay. Still 39k
  under the guide; the figure is the clearing's landmark.
- **Entrance hall +7 calls / +13.5% (97 → 104 calls)**: the hall's dressing (commode, crates with loads, coat rail,
  bench, runner, hanging) and the living room's own batch, drawn when you can actually see into it.
- **Well +10 calls, golf chute / golf vicinity +8 calls**: the fire clearing and the well are their own distance-culled
  batches (drawn within 55 m) so their detail is not paid for elsewhere; seen from the golf area that is the price of
  the culling. Golf itself stays in the shared grounds batch (as its own batch it cost +7 more calls).
- **Attic nook +6 calls**: the observatory dressing on the atlas and art-kit materials; at 41 calls it is still among
  the cheapest interior views.

Where the arrival views went the other way (−18%): the living room cannot be seen from outside (windows are opaque to
the room-visibility culling), yet its whole batch was drawn through the open front door. It is now its own batch
(`mLiv`) that is never drawn from outside. The same split pattern (billiard `mBil`, service wing `mServ`, upstairs
east `mUpE`) keeps each area's new detail paid only where the area can be seen, and the `e2e:dev04b` coverage check
makes sure no piece lands in a batch that is hidden in its own room.

Biggest families by total triangles (all instances, `scene.userData.assetTris`): shelving units 60.8k (pantry, linen,
workshop, archive: four separate batches), ladder chairs 13.5k, beds 9.0k, upholstered chairs 5.6k, tables 4.8k,
Windsor chairs 4.7k. Every prop-kit texture is on one atlas material, so families add no per-object draw calls.

## 10. Save / ID status

Unchanged. `e2e:dev04a` check 7, `e2e:dev04b` check 6 and `e2e:dev01` compare against the pre-DEV-04A baseline:
**128 interactables, 21 checkpoints, save version 4**, the same state keys, none added or removed. Every interactable
the pass touched kept its id, collider and behaviour (`hall.drawer` with its dials, ledger and shed key; `lamp.*`;
`mem.*` inspects; the billiard panel; the bar sign's wall-art id; the fire / well / golf ids). Legacy save poses on
changed surfaces still load onto valid support (`e2e:dev04a` check 9).

## 11. Before / after evidence

Captured with `scripts/dev04b-views.mjs` (1280 × 720, eye height over the support surface, low quality) on `c97a06f`
before any code change ([`before/`](before/): 49 poses, plus the B4 poses `a01`–`a08` and `h07b` captured on the same
baseline build afterwards) and on the final build ([`after/`](after/): 58 poses). Side-by-side sheets in
[`compare/`](compare/) (before on top):

| Required | Sheets |
|---|---|
| Books | `b01-library-books-close`, `b02-library-room` |
| Bed / bedding | `b04-reis-bed`, `b05-guest-bed`, `b06-sterren-bed` |
| Chair / table | `b07-dining-table-chairs`, `b08-kitchen-table` |
| Rugs | `b10-hall-rugs`, `r03-dining` |
| Crates | `b11-kitchen-crates`, `b12-hall-grocery-crates` |
| Campfire | `h01-campfire`, `h02-campfire-wide` |
| Wickerman | `h03-wickerman-figure`, `h04-wickerman-clearing`, `h05-wickerman-close` |
| Well | `h06-well`, `h07-well-shaft`, `h07b-well-down` |
| Golf | `h08-golf-chute`, `h09-golf-bag` |
| Copacabana sign | `h11-copa-sign`, `h12-copa-bar-close` |
| Attic observatory | `h13-attic-observatory`, `h14-attic-nook`, `r11-attic-common` |
| Rooms | `r01-living`, `r02-hall`, `r03-dining`, `r04-kitchen`, `r05-billiard`, `r08-reis`, `r10-guest`, `r12-cottage-room` |
| B4 audit | `a01-hall-commode` … `a08-forecourt-planter` |
| Calibration (unchanged) | `h15-boslust-calibration` |

`after/views.json` and `before/views.json` (+ `before/views-b4-extra.json`) hold the room, support height and render
cost per pose (all doors open, so these are worst cases, not the budget views of §9).

## 12. Known issues

- **Kitchen** still reads large: the south half now has the prep table, larder and crates, but the room's scale
  (12.6 × 17.6 m) is architecture, not dressing (no estate / manor resize in scope).
- **Copacabana sign**: the small ROOM line is legible at the bar and from the pool edge, not from across the deck at
  phone size; the main word reads everywhere.
- **Living room**: kept as the owner-approved calibration set; only the log basket and the shelf mix changed.
- **Route chamber**: the six pipes stand in front of the route map (pre-existing composition); they now reach the
  ceiling but still cross the map.
- **Shelving units** are the biggest family by triangles (60.8k across four batches); the loads could share a cheaper
  jar / tin model if a later pass needs the budget.
- **golfSpur** was over the low guide before DEV-04B (257k) and still is (262k).
- **Build**: the 16 `toNonIndexed()` warnings are pre-existing (the baseline has them too).

## 13. Deferred to DEV-04C

Explicitly not done here (hooks left in place):

- **Candle interaction and states**: the Wickerman candles are unlit jars; their positions are published as
  `scene.userData.wickerCandles = { centre, candles[9] }` (checked by `e2e:dev04b`).
- **Wickerman ignition and fire VFX**: the figure (willow + hay) is one static geometry pair; burning, charring and
  collapse are DEV-04C.
- Campfire fire states beyond the existing ones (the split-log teepee is the laid-fire look only).
- New puzzles, finale, notebook, puzzle copy, the painting system, estate resize, manor expansion, new required routes.
