# DEV-02 — Estate Structural Blockout (as built)

Status: **blockout on branch `claude/wizardly-curie-y9xumd`; not merged, not deployed.** This is the new working base:
the DEV-02 world replaces the old 180 × 150 estate in the **normal game** (no flag). The DEV-01 B01/DS01 slice still runs
on top of it with `?review=dev01`.

How to run: `npm ci && npm run typecheck && npm test && npm run build && npm run preview`, then
`http://localhost:4173/Feh-Lu-We/` (add `?debug=1` for position/room/draw-call overlay). Browser checks:
`npm run e2e:dev02`, `npm run e2e`, `npm run e2e:dev01`. Screenshot set + render cost: `npm run views:dev02`.

---

## 1. Inputs and authority

| Input | Used |
|---|---|
| Repository HEAD `0254e58` (home screen) | ✅ base. **DEV-01R final `858a06f` was merged in first** (`a55b87a`, conflict-free except additive CSS) — without it the v0.2 design package, the DEV-01 slice and docs/dev01 were not on this branch. The two temporary Pages-deploy commits of that branch were left out. |
| `docs/design/v0.2/*` (LEVEL_PLAN, LEVEL_LAYOUT.json, ADJACENCY_GRAPH, PUZZLE_DESIGN, UX_GAME_FEEL, ENVIRONMENT_STORY, ART_BIBLE, ART_TOKENS, DELTA, INTEGRATION_OPEN) | ✅ LEVEL_PLAN/LEVEL_LAYOUT are the spatial authority; LEVEL_LAYOUT.json is read **directly by the unit tests** (footprints, zones, parking, rooms, doors). |
| `docs/dev01/{DEV01_SLICE, DEV01R_AUDIT, REVIEW_SCRIPT}.md` | ✅ lessons applied (§5). |
| `Feh-Lu-We_AS_IS_AUDIT.md` | ❌ **not in the repository** (no ref contains it). The as-is reading comes from the code, DEV01R_AUDIT and LEVEL_PLAN §10 (which quotes the audit). |

Integration decisions applied as given: 200 × 180 fixed; variant A; central hall, two living loops, real attic; **main
building not enlarged** (MANOR/WING/CONS footprints identical, unit-tested against LEVEL_LAYOUT); notebook untouched;
blockout-first (no art pass).

## 2. As-built summary

### 2.1 Estate composition (200 × 180, LEVEL_PLAN §2)

| Part | As built |
|---|---|
| Arrival wood + drive | Existing south woodland (Z 0–72) widened to 200 m with the same recipe; drive unchanged; **one** gravel arrival court (non-overlapping rectangles — the old disc/plane overlap is gone) with five 2.8 × 5.5 bays, **four parked cars** (stable ids `car.1`–`car.4`, colliders) and the fifth bay free; manoeuvring strip; the centre planter and the house axis kept free. |
| House + social garden | Terrace kept; new platforms at +0.15 with real edges: **BBQ** (grill, prep table, gas bottle), **outdoor dining** (long table + benches), **gravity bong + handpan** (low table, bucket/bottle, handpan on its own stand, cushions), **tank/balloon nook** (own chairs, away from the BBQ). Centre path X≈90 to the lanterns free. |
| Lantern lawn | Unchanged puzzle anchor (thread C), open lawn; path to the lake viewpoint. |
| Lake + Portugal plateau | **Lake** ellipse 44 × 24 at (54, 146): real terrain basin (bed −1.8), water plane −0.35, **elliptic water collider** (never walkable, never occludes), reeds/stones on the shore, dry **viewpoint** with the bench (`mem.pond.bench`) and the old nest-box oak on the east shore (`mem.garden.nestbox`; the herbarium still says "oostkant van de vijver"). **Cottage** (same 10 × 8 house, X 20–30 / Z 157–165) on a level **+4 plateau**, floor +4.15, **covered terrace** 10 × 5 (canopy underside ≥ +6.85 on two posts with footings, outside the walking strips), ramp X 18–20, terrace table with two MTG places facing each other, game stack, 30 Seconds, books, pizza, bottles. Adaptive **retaining wall** with footing + parapet where the bank to the lake is steeper than 1 : 2. |
| East glade + ridge | East ridge field + **east garden loop** (lantern side → glade → ridge path ≤ +2.5 → wellness deck, 145 m, rest bench at (176.4, 124)); sparse glade trees vs dense east forest. |
| South forest pockets | **Golf** north of the BOSLUST hill: tee mat, bag + clubs, a **cardboard return chute** on timber beams climbing the hill's north slope (solid, not walkable, colliders above ground only — never into the hall below). **Wickerman** clearing at (167, 54), level +1.2, 2.8 m straw figure on a log base, candle ring, log bench, its own 96 m loop from the well path back to the east path. |
| Enclosure | Woodland masses (layout.ts `WOODS`): west bank, north ridge, north-west strip, east forest, east glade/meadow, lake north — uneven density (gap 5 m masses vs 8–11 m glades), mixed crown heights; the ground grid extends **24 m beyond the fence** so ridges and the outer tree ring continue outside (no ledge at the boundary). |

Height fields (LEVEL_PLAN §2): BOSLUST hill retained; north ridge (124, 163) 65/22 peak 4.5; east ridge (176, 116)
20/60 peak 5; plus a **west shoulder** (8, 156) 32/40 peak 4.5 that carries the plateau (DEV-02 addition, see §7).
**One explicit override order** in `terrain.ts rawHeight`: fields → flat pads → lake basin → route profiles → hill cut;
render and collision use the same 2 m triangulated grid.

### 2.2 Main building (variant A, footprint unchanged)

| Area | As built |
|---|---|
| Central hall | Unchanged plan; **maquette** moved to the west wall (§5); 4 red shopping crates stacked against the west wall (ES.hallCrates), off console, mantel arch and stair. |
| S01 grand stair | **Railing collider on the open (west) side over the full flight height** (`railing.S01`, outside the flight's width): DEV-01 review lesson. |
| West living loop | hall → living → library → lobby → hall: unchanged (B01/DS01 rooms untouched). |
| East living loop | hall → dining (now the **eat/game room**: home-made duo board game, cards, dice, beer; separate marshmallow/shots table; A01 sideboard untouched) → kitchen (**8 red crates** + beer crates apart) → service corridor → Copacabana → garden → kitchen/billiard doors. |
| Guest WC | `guestWC` X 85–88 / Z 104–107 off the back lobby (`door.guestWC`), toilet + basin. The billiard door moved to X 90 (same id/state); `lamp.billiard` moved out of the WC (same id). |
| Utility | `utility` X 113.3–115.6 / Z 104–109.6 in the service wing (`door.utility` from the corridor): two machines, sink, towel rails. `pantry` keeps its id and door (X 108.4–113.3). |
| Upstairs | `storage` keeps its id as the **north guest room** (bed, bedside, wardrobe); **linen** reached centrally from `rearNookEast` (`door.linen`); **rear nook** loop landing ↔ `rearNook` ↔ `rearNookEast` ↔ attic stair rear door (`door.atticRear`) ↔ lane ↔ upper corridor. New north window for the rear nook. |
| **Attic** (new floor `a`) | **S03** U-stair exactly per LEVEL_LAYOUT: door from the upper corridor (`door.atticStair`), flight 1 (10 risers, +3.35 → +5.00), middle landing, flight 2 (+5.00 → +6.65), upper landing; 1.2 m return lane to the rear door; solid under the middle landing and flight 2; **railings**: flight 1 ↔ lane (full height), between the flights (full height), middle landing east + north edges, upper landing over the well. The upper ceiling and the attic floor have a **real stairwell hole** (no floor box over it). Rooms `atticLanding`, `atticCommon` (weekend attic: boxes, instrument cases, drying line, old sofa, games table), `atticStore` (seasonal store behind `door.atticStore`; **`mem.storage.box` moved here, same id**), `atticLookout` (bench, stars-hobby telescope; observatory **reservation only**, I03). Partitions/knee walls follow the roof; an inner roof skin makes the (single-sided) roof visible from inside; headroom ≥ 2.1 m over the whole play zone (unit-tested). |
| Copacabana Room | **Double door** `door.consEast`: 2 × 1.2 m leaves opening outward, **one saved state**, shared `lock.door.consWest`/consKey; both leaves solid while closed (no half-door bypass). Name boards "Francois' Copacabana Room" inside (corridor) and outside (own post beside the doors, outside the leaf sweep). NE **bar**. The inner lounger moved to the deck so the door lane is free. |
| Wellness | Timber **deck** X 130–148 / Z 96–115 (+0.15); **sauna** keeps footprint and +0.80 floor, now reached by a **1.2 m ramp** (Z 113.4 → 105.2, 7.9 %) onto a **flat 1.2 m landing**, handrails both sides (no stepping on/off sideways); **jacuzzi** tub X 139–142.6 / Z 101–104.6 (round, distinct from the pool; solid; step-out; pump box); loungers, lantern posts. The sauna board (A02) is untouched. |

### 2.3 Room/portal model

All **39 source room ids kept**; **49 rooms** = LEVEL_LAYOUT `proposal.rooms` with identical bounds (unit-tested).
Classification order most-specific first (attic → attic stair → split north rooms → broad upper rooms; guest WC before
billiard; utility/pantry disjoint). New Floor type `a` (map tab **Zolder**). All 68 source portals kept + 15 additive
(new doors, arches, the S03 stair portal, three windows).

## 3. Spatial source of truth and technical contracts

- **`src/world/layout.ts`** — every v0.2 descriptor (canonical footprints, zones, parking, routes + profiles, ridges, pads,
  lake, wellness/ramp/door metrics, S03, roof function, maquette, woods, legacy positions). Builders, terrain, map, room
  classification, keepouts and tests read these records; nothing is repeated as a literal.
- **`src/world/footprints.ts`** — one footprint list (building / platform / parking / reserve) + `vegetationClear()`:
  every scatter (south forest trees, undergrowth, stumps, toadstools, path grass, woodland masses, garden trees, flowers,
  meadow grass) passes it. This also fixes, for the normal game, the DEV-01 finding "garden scatter inside the sauna".
- **`src/world/terrain.ts`** — fields → pads → lake → route profiles → cut. Profiles are re-sampled along the walked
  (smoothed) line with an upper-envelope grade limit of 7 % (design limit 8 %); the nearest route wins where two meet;
  raised pads keep their level; routes never touch the lake bed.
- **Collision** — new elliptic collider (lake); `stairRail()` (full-height side rail outside a flight); `makeDoor` `pair`
  option (double door: one id, one state, two leaves/colliders/sweeps).
- **Culling** — exterior skins may carry `userData.rooms` (sauna shell + bands = `['out','sauna']`, VD-03); new regions
  `mAttic`, `grounds`; `cottage` landmark distance 75 m.
- **Saves** — `STATE_VERSION` stays 4, no key changes, no migration. Pose bounds derive from the estate extent
  (−5…205 / −5…185) instead of the old literal 180 × 150 box. **Named relocation** (`src/core/relocate.ts`, logged as a
  `relocated` event): old cottage/terrace → `cottage`, old pond → `lake`, old storage-room spot now inside the attic
  stair → `ucorr`; inventory/flags/slots/hints untouched (unit + browser tested).
- **New ids (all additive):** doors `door.guestWC`, `door.utility`, `door.atticStair`, `door.atticRear`,
  `door.linen`, `door.atticStore`; rooms `guestWC`, `utility`, `linen`, `rearNook`, `rearNookEast`, `atticStair`,
  `atticLanding`, `atticCommon`, `atticStore`, `atticLookout`; memory `mem.hall.maquette`; checkpoints `ucorr`, `attic`,
  `lake`, `wellness`; map sites `lake`, `wellness`, `golf`, `wickerman`; staging ids `car.1`–`car.4`. **Moved, same id:**
  `door.billiard`, `lamp.billiard`, `door.consEast` (now two leaves), `door.cottage`, `mem.storage.box`,
  `mem.pond.bench`, `mem.garden.nestbox`, `mem.cottage.table`, `inspect.cottageNote`, `lamp.cottage*`.

## 4. Puzzles / systems

No puzzle rule, answer, gate or save key changed. The normal game's threads A/B/C/D run unchanged on the new estate
(the full tutorial → finale walkthrough passes, §8). B01/DS01 (`?review=dev01`) run on the DEV-02 world: only the
maquette table and the note pose moved (placement records, unit-tested `validatePlacement() = []`). Structural carriers
for later work are present: reis/sterren/botanic B01 rooms, library, study (B02), shed/fire/lantern lawn (C), basement
and BOSLUST (D), the lookout reservation (I03), golf (I05) and wickerman (I04) scenes.

## 5. Halmaquette follow-up (DEV-01 review)

- No longer free-standing in the hall: a presentation table **against the west wall** (X 85.14–85.86, Z 93.4–95.4),
  north of the living-room arch, south of the lobby arch, clear of console and stair.
- **Inspectable as an object** ("Bekijken: maquette" → memory `mem.hall.maquette`, both modes).
- **A miniature of the game's house** at 1 : 50: main block with hip roof and pedimented entrance bay, service wing,
  the glass Copacabana Room, drive and terrace on a board.
- **Gingerbread as a wink only**: thin white "icing" piping along the eaves, and one descriptive sentence in the memory
  text. The DS01 photo shows the first little house (a one-storey gingerbread cottage), so photo and maquette are no
  longer the same object. DS01 texts are unchanged (content softening is a later, separate step).

## 6. What is still placeholder / blockout

Everything visual: primitive props, flat colours, no final materials; cars, BBQ, handpan, gravity bong, balloons,
wickerman, golf chute, reeds are silhouettes. No personal-prop catalogue (Nerfs, darts, art), no Copacabana art pass, no
real window apertures (window portals stay light/culling only), no observatory roof opening (lookout is a reservation),
no ball physics, no burn/aftermath state, no new clues/hints/copy, no LOD/streaming rework beyond chunking.

## 7. Known deviations from the design documents

| # | Design | As built | Why |
|---|---|---|---|
| 1 | `lakeView` X 73–79 / Z 137–142 | X 76–82 (3 m east) | the design box overlaps the water ellipse by up to 1.7 m at Z 142 (cannot be "droog"); the test proves the overlap and the shift |
| 2 | Height fields: hill, north ridge, east ridge | + a **west shoulder** field | without it the plateau and the cottage-out climb stand on a 4 m embankment |
| 3 | Route grade ≤ 8 % | authored ≤ 7 %; walked on the 2 m grid ≤ 10.5 % in two 2 m windows where a route hugs the plateau edge | grid interpolation next to a level pad; deviation from profile ≤ 0.2 m everywhere (unit-tested) |
| 4 | East garden loop on the east ridge | the ridge path sits in a cutting up to ~2 m deep near X 174 | the authored ridge peak (5) and the route profile (2.5) meet at almost the same X; resolved by the route corridor |
| 5 | S03: 9 treads × 0.28 per flight | 10 equal steps of 0.252 over the same 2.52 m flight (10 risers × 0.165 as designed) | LEVEL_LAYOUT gives both the flight length and "9 × 0.28"; the flight bounds were kept |
| 6 | Golf loop shed → (48,48) → (59,53) → tee → (70,62) | tee beside the existing forecourt → shed path + a short spur | the designed loop runs within ~1.5 m of the existing path |
| 7 | Wickerman loop starts at (144, 39) | starts at the well path end (146.5, 43.5) | the well clearing itself |
| 8 | B01 evidence poses (reis/sterren/botanic) | still the DEV-01 as-built clusters | unchanged deviation from DEV-01R (rooms not restaged in DEV-02) |
| 9 | Door leaves (all houses) | panels/bands/handles tinted on the wood material | one draw call per leaf instead of two (performance budget) |

## 8. Tests and results

All on the final build (SwiftShader, Chromium 1194). Result files: [`e2e-dev02-results.json`](e2e-dev02-results.json),
[`e2e-regression-results.json`](e2e-regression-results.json), [`e2e-dev01-results.json`](e2e-dev01-results.json),
[`shots/views.json`](shots/views.json).

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ |
| `npm test` | ✅ **163/163** (142 existing + 21 in `tests/dev02.test.ts`) |
| `npm run build` | ✅ |
| `npm run e2e:dev02` (new) | ✅ **34/34** |
| `npm run e2e` (existing regression, incl. the full tutorial → finale walkthrough) | ✅ **102/103** in the full run; the one failure was `art sample: no console errors — failed …/favicon-32.png` (an aborted favicon request during a page navigation; the favicon is a home-screen asset, not DEV-02). Re-running the section twice: **12/12, 12/12** — intermittent, not reproduced. |
| `npm run e2e:dev01` (B01/DS01 slice on the DEV-02 world) | ✅ **34/34** |

### 8.1 What the new browser suite proves (walked through real collision, no teleports)

- Arrival gate → court between the parked cars → hall; maquette inspectable from its pose (memory recorded).
- **S01**: stepping off the open side mid-flight is impossible (x stays ≥ 93.4, feet height unchanged); continuous
  feet height to +3.35 (max Δy per 1/30 s step 0.04 m).
- **S03**: corridor → door → flight 1 → middle landing (+5.00) → flight 2 → attic (+6.65), max Δy 0.07; every railing
  holds (flight 1 ↔ lane, middle landing north edge, between the flights, upper landing over the well); down again and
  out through the rear door → rear nook east (linen) → rear nook → landing (the upper side loop).
- Attic rooms (store behind its door with the moved games-box memory, lookout) are walkable rooms.
- Guest WC and utility are real rooms with doors.
- **Copacabana double door**: closed + unlocked, neither leaf lets you through; one action opens both (both colliders
  off), closing re-enables both; **locked** (no consKey) it says *Op slot* and holds at both leaves.
- **Sauna**: ramp (max Δy 0.008) → flat landing at +0.80 → in on the real floor; no stepping onto the ramp sideways.
- Garden → lantern lawn → dry lake viewpoint (bench memory); walking into the lake stops at a dry shore.
- **Cottage** out (+0 → +4, onto the terrace at +4.15, inside `cottageRoom`), the steep lake side is walled; return by
  the other route; **east garden loop** (max +2.47); **golf** tee reached, chute not walkable; **wickerman** clearing at
  +1.2 and its loop back.
- **Culling**: the sauna shell drawn from all four sides with the door closed and from inside (VD-03); manor shell and
  cottage drawn from the garden, attic contents not.
- **Placement**: 8 904 vegetation instances, **0** in a building, platform, parking bay, reservation or the lake
  (authored exceptions: the cut-wall ferns and the planter flowers).
- **Saves**: attic pose + open new door survive a reload; a cottage-terrace pose is valid; three legacy poses (old
  cottage, old pond, old storage room) relocate to their named checkpoints with inventory and flags intact.

### 8.2 Simulated walking times (3.2 m/s walk, fixed 30 Hz, no reading; arrival at run speed)

| Route | Walked | Sim time | Design polyline (LEVEL_PLAN §9) |
|---|---|---|---|
| Gate → hall (run) | 84 m | 17 s | 85.7 m |
| Portugal out (terrace → cottage terrace) | 84 m | 27 s | 84.9 m / 27 s |
| Portugal return (→ lantern lawn) | 128 m | 41 s | 119.7 m / 37 s (+ the skirt round the lantern ring) |
| East garden loop | 147 m | 46 s | 145.2 m / 45 s |
| Wickerman loop (well path → clearing → east path) | 102 m | 33 s | 99.8 m / 31 s |

These are controls-only machine walks, not playtest timings (LEVEL_PLAN §9: practical 2.0–2.4 m/s on a phone).

### 8.3 Performance baseline (draw calls / triangles, 1280 × 720, SwiftShader; phone guide ≤ 150 calls / 250 k tris at "low")

Standard regression views (same poses as `npm run e2e` → metrics; default door states):

| View | before (DEV-01R, low) | DEV-02 low | DEV-02 high (+shadows) |
|---|---|---|---|
| gate (driveway) | 135 / 195 k | 136 / 228 k | 158 / 312 k |
| forecourt → manor | 130 / 159 k | 126 / 204 k | 169 / 324 k |
| entrance hall | 149 / 158 k | 149 / 209 k | 204 / 348 k |
| library | 43 / 53 k | 43 / 55 k | 51 / 92 k |
| garden → manor + Copacabana | 150 / 160 k | 148 / 196 k | 182 / 265 k |
| forest (shed) | 66 / 152 k | 58 / 184 k | 95 / 298 k |
| BOSLUST cut | 134 / 209 k | 132 / 246 k | 157 / 352 k |
| Copacabana pool | 75 / 86 k | 100 / 147 k | 147 / 237 k |
| gathering room | 29 / 15 k | 28 / 15 k | 34 / 20 k |

All within the guide (the regression thresholds pass), but with **little headroom**: the hall and garden sit at the call
limit and the cut close to the triangle limit. The 32-view DEV-02 set ([`shots/views.json`](shots/views.json)) is taken
with seven extra doors open; there the hall towards the stair reaches 187 calls (the same pattern as DEV-01's
"hall-wide 181 in the base build"). What paid for the larger estate: trunks and pine cones batched on a coarse 100 × 90 m
grid, one chunk for the outer tree ring, 40 m grass tiles, single-material door leaves, a merged sauna shell, and room
culling of the attic and of the distant cottage. FPS is not measured (software renderer); phone frame rate belongs to the
human review.

### 8.4 Screenshots (`shots/`)

32 location views `01-gate-drive` … `32-estate-north-edge` (arrival court, parking, hall maquette, stair railing, upper
corridor, attic stair, attic common, lookout, north guest room, guest WC, utility, dining game room, Copacabana inside and
double door, wellness deck, social garden, terrace → lake, lake view, cottage approach/terrace/view back, cottage return,
east glade, ridge path, golf, wickerman, shed forest, BOSLUST cut, garden → manor, north edge) + `e2e-*` frames from the
walked suite (maquette, attic common, lookout, utility, sauna from inside, golf, wickerman loop, back at the lawn).

## 9. Findings outside the scope (fixed, minimal)

1. **Start overlay never hid** on this branch: the home-screen rule `#start:has(.start-home){display:block}` has the
   same specificity as `#start[hidden]` and came later, so after "Verder/Nieuw spel" the title screen stayed over the
   game. One-line CSS fix (`src/ui/style.css`).
2. DEV-01's "garden scatter inside the sauna" (review-only fix) is now fixed for the normal game by the shared keepouts.

## 10. Recommended next steps

**Environment / art:** apply the stylized ART_BIBLE to the new spaces in priority order — arrival court + cars (first
impression), social garden platforms, cottage + terrace, Copacabana bar/deck; replace the vegetation recipe in the north
masses with the woodland kit (the BOSLUST sample planner) and measure; real window apertures where a sightline is
designed (terrace, double door, cottage canopy); personal props (Nerfs, darts, art) with placement validation.
**Level:** restage U04/U05/U10 to the LEVEL_LAYOUT B01 poses; decide I03 (lookout opening) with a real roof cut and
sightline test; human walk tests of the cottage/east loops on phones (timings above are simulated walking).
**Puzzle:** decide I01 (B01 grammar) before removing plaques in the normal game; I02/I04/I05 scenes now have real
places to attach to; keep optional finds off the mandatory routes.
**Tech:** estate-wide vegetation LOD/streaming before the art pass (the phone draw-call guide is met with little
headroom); a CI job for `e2e:dev02`.

## 11. Files

New: `src/world/{layout additions, footprints, geom2d, grounds, wellness, maquette}.ts`, `src/core/relocate.ts`,
`tests/dev02.test.ts`, `scripts/{e2e-dev02, dev02-views}.mjs`, `docs/dev02/*`.
Changed: `src/world/{terrain, estate, manor, conservatory, cottage, forest, roomdefs, rooms, arch, furniture, nature}.ts`,
`src/player/collision.ts`, `src/interactions/{props, world}.ts`, `src/core/{state, game}.ts`, `src/ui/{map.ts, style.css}`,
`src/content/memories.ts`, `src/slice/{placement, world, drawings, ids}.ts`, `src/main.ts`, `scripts/{e2e, e2e-dev01}.mjs`,
`package.json`.
