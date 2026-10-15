# DEV-04D D3-b2: upstairs identity rooms and craftsmanship

- **Branch:** `dev04-d3-b2` (isolated), cut from production `ccr-75ef4113-kfkimm` at
  **`752cb024a349ec0045d4f1873e5b191b154191f0`** (15 October 2026).
- **Scope:** the Reiskamer, the Sterrenkamer, the north guest room (source id `storage`) and the bathroom; the Track 01
  moon (FLW-S3-016) and sloop (FLW-S3-015) placed in production.
- **Not done:** merge and deploy (owner review first). D3-c…f and D4 are not started.
- **Evidence:** `docs/dev04d/d3b2/` (§7). **Gates:** §8.

## 1. Verified baseline (before editing)

| Item | Verified state |
|---|---|
| Production HEAD | `752cb02` (Merge PR #30, cars R02). The brief's 14 October `cbc3e13` was no longer current: PRs #26–#30 (serre roof, kitchen glass, interior R01 recovery, cars R01 / R02) had landed since. |
| D3-b1 | merged as **`ae2a036`** (PR #14), an ancestor of production |
| Open PRs | only #9 (VCP-01, draft): not touched |
| Existing D3-b2 work | none on any branch, PR or worktree; `git log --all` has no D3-b2 commit |
| Parallel branches | `vfc01-visual-fidelity-calibration` (44 commits ahead; research tooling under `src/vfc01`, no `src/world` / `src/content` change), `veg-r01-vegetation-lod` (+1 docs commit), `vcp01-library-codex` (PR #9). None overlaps these rooms. |
| Working tree | clean; no running preview or test processes before the work started |

The environment work integrated since D3-b1 is preserved and used as-is:
- ENV-L01 four-phase lighting with SKY-C01 clouds, VEG-R01 Hybrid LOD and GEO-R01 repairs;
- PB01 (750 k camera triangles, 150 calls) and TUT-R01 / R02;
- UI-R02 / UI-COMPASS.

D3-b2 changes no lighting, sky, vegetation, LOD, shader, renderer, HUD or tutorial code. The four rooms' lamps
(`lamp.reis`, `lamp.sterren`), the static sconces and the guest-room lantern are unchanged, and no light source was
added.

### 1.1 What the source actually says (corrections to the brief's assumptions)

| Assumption | Verified |
|---|---|
| The bathroom is in `mUpE` | **No.** The bathroom, the Reiskamer and the Sterrenkamer were in `mUp`; `mUpE` held the study, the botanic room, the north guest room and the linen. |
| The north guest room has a window | **No.** It is a windowless 8.6 × 8 m room (x 99–107.6, z 98.6–106.6), lit by the lantern; door on the south wall. |
| Doors | The Reis and Sterren doors swing **out** onto the gallery; the guest-room and bathroom doors swing **in** (their sweep quadrants were kept clear). |
| Shared builders | `bed2`, `bedside` and `wardrobe` are used only in these three bedrooms, so their joinery is in scope. `pedestalBasin` and `towelRail` are shared with the ground-floor WC and were **not** changed. |

## 2. Current-state audit and intervention plan

Baseline captures: `d3b2/before*` (immutable copy of the `752cb02` build, bundle `index-xMKKuRbU.js`).

| Room | What worked | What was weak | Interventions, by player-visible gain | Left untouched |
|---|---|---|---|---|
| **Reiskamer** (travel) | The suitcase memory on its rack, the travel sketch, D2-022 over the bed | A 12.6 m room read as a corridor: bed at the far end, a lone desk, a tiny sloop; nothing said "someone is travelling" from the door | 1. Track 01 sloop ×1.15 on the desk. 2. The desk becomes the planning place (map, guidebook). 3. A coat stand by the door (coat, scarf, hat). 4. A jacket over the desk chair and a soft holdall by the desk. | Suitcase (rack, case, emblem, inspect), travel sketch, D2-022, bed, wardrobe, lamp, door, routes; D2-027 not hung (optional) |
| **Sterrenkamer** (rest and observation) | Telescope (aimed at the west window), logbook, star map, D2-029 | An empty middle; the moon was a 25 px sliver; the telescope stood alone; the west end was just a bed | 1. Track 01 moon ×1.4 on the window bedside. 2. The logbook table rebuilt as an observing table (drawer, atlases, red torch, mug). 3. The observer's stool with a throw. 4. Binoculars beside the moon. 5. An armchair in the window corner: the west end becomes "rest and look out". 6. Night-table joinery. | Telescope position and aim, logbook and its datum, star-map panel, D2-029, `lamp.sterren` logic, door |
| **North guest room** (`storage`) | Bed on the east wall, D2-035, the bed-foot chest | A big empty floor; no belongings; the armchair alone in a corner | Three zones round a clear walk line: sleeping (a sweater on the chest), bags by the wardrobe (holdall, rucksack), games / reading corner (low bookcase with games, side table with a card game beside the armchair) | Bed, wardrobe, armchair, D2-035, lantern, door and its sweep, all ids |
| **Bathroom** | Roll-top tub, pedestal basin, framed mirror (F1), towel rail | Board floor and bare plaster: no bathroom material; the basin and mirror floated on a big wall; the mat lay at the tub's tap end | 1. Tiled floor in a slate border. 2. A 1.1 m glazed tile dado with a sea-green cap course. 3. A wash zone (shelf with tumbler / soap under the mirror, a towel ring). 4. A bath zone (caddy across the tub, the mat alongside it). | Tub, basin, mirror, towel rail (shared with the WC), sconce, door |

## 3. Construction notes (hero pieces and furniture)

Every new piece is an `Asm` assembly with a construction audit (`begin` / `end`). It uses only the art-kit materials
(timber, upholstery, paint, brass, ceramic) and the existing `k.M.tile`: **no new texture or material**. No piece is
interactable. All new code is in `src/world/d3b2.ts`, except the night table (`furniture.ts`, `bedside`) and the bathroom
surfaces (`manor.ts`, in place).

| Piece | Support chain | Silhouette / material | Relation to the focal point | Player-eye read |
|---|---|---|---|---|
| Coat stand (Reis, by the door) | Three flat feet halved into a turned boss, a pole and a finial; four pegs raking up at 1.62 m. The coat hangs from the front peg by its collar, the scarf over a side peg, the hat on the finial. | A navy coat (sleeves, placket, buttons), a rust scarf, a dark felt hat; dark timber | The first thing on the left as you enter: arrival, travel | Yes from the door and across the room (`re-wide`, `re-enter`, `re-coat`) |
| Desk travel set (Reis) | Lies on the desk top: a map folded in three, the guidebook on it with its band and ribbon, a pencil | Pale map with a route marked; a blue guidebook | The desk under the middle window; the sloop takes the east half | Within ≈ 2–3 m (`re-desk`, `re-sloop`) |
| Jacket over the chair (Reis) | Folds over the carver's cresting rail; the front and back panels hang from it, one sleeve loose | Olive cloth | Ties the chair to the desk: someone sat here | Mid distance |
| Holdall (Reis olive / guest navy) | Stands on its flat bottom; two leather bands, two handles over the zip, a strap fallen over one end | Soft canvas with a slumped top. **Soft on purpose** (§3.1). | Reis: by the desk. Guest: by the wardrobe. | Yes |
| Rucksack (guest) | Tips about its bottom back edge against the wall | Flap, pocket, straps | The bag zone by the wardrobe | Yes |
| Observing table (Sterren) | Four tapered legs tenoned into aprons; a lower shelf on stretchers; drawer on the room side. **Same footprint, collider and 0.70 m top** as the old table (the logbook datum). | Dark oak; two star atlases on the shelf; a red-lens torch and a mug on top | One station with the telescope and the observer's stool | Yes (`sk-scope`, `sk-table`) |
| Stool and throw (Sterren) | The existing DEV-04A observer's stool behind the eyepiece; a wool throw rolled over its seat | Slate-blue wool | The eyepiece end of the telescope | Yes |
| Binoculars (Sterren) | On the window bedside beside the moon | Dark barrels on a hinge bridge, strap | Links bed, window and moon | Close (`sk-bedside`) |
| Armchair (Sterren) | The house's upholstery family (owner-approved build) | Slate blue | The window corner: the west end's resting seat | Yes from the door (`sk-enter`, `sk-door`) |
| Night table (all three bedrooms) | **Four square corner posts from the floor** carry a drawer case under the top and a bottom board (an open shelf) with a back board. The old one was a box on 12 cm stubs that read as a crate. | Same wood colours. **Top datum (0.5775), footprint and collider unchanged:** the lamps, the moon and the binoculars stand on it. | Bedside pairs | Mid distance (`sk-moon`, `re-bed`) |
| Bathroom floor | A 6 mm visual layer on the boards: a pale tiled field (existing `tile` material) inside a 14 cm slate border. The walking floor and colliders are unchanged. | Pale stone tiles, slate border | The whole room | Yes, the largest single gain |
| Tile dado | D3-a's `splashback` (field, joints, cap course) at 1.1 m on every free wall run, with a tiled base course over the skirting. Stopped at the door casing and under the 0.8 m window sill. | Cream glaze, sea-green cap | Ties tub, basin and towels together | Yes |
| Wash shelf and towel ring | A timber shelf on two brass brackets under the mirror; a brass ring on a rose with a hand towel through it | Tumbler and toothbrushes, soap bottle, jar | Basin, mirror and shelf as one wash zone | Close / mid |
| Bath caddy | Bridges the tub rim (0.86 m over the 0.80 m rim), end lips, a soap bar and a brush | Timber | The tub | Yes |

### 3.1 The luggage rule (puzzle safety)

The koffer is the Reiskamer's emblem identity and its memory (`mem.reis.suitcase`). To avoid creating a second candidate:
- **no other hard-shell suitcase, trunk or second luggage rack** appears on the estate;
- every D3-b2 bag is soft (a holdall or a rucksack);
- no new emblem-like round objects or star symbols are added in the Sterrenkamer: a planisphere / star wheel was
  considered and rejected for the same reason (EB.stars belongs to the logbook).

Both points are unit-tested (`tests/dev04d-d3b2.test.ts`).

### 3.2 Considered and not done

- **FLW-D2-017** (bathroom, beside the mirror) is not hung. With it, the FLW atlas page grows from 2048 × 960 to
  2048 × 1152 even at 256 px. That is +2 MiB GPU, exactly the 12 MiB cap of the art test, for one 0.35 × 0.7 m print. It
  would leave no texture room for D3-c…f. The wash zone reads without it. Hanging it is a one-line change after an
  atlas repack, if the owner wants it.
- FLW-D2-030 and FLW-D2-027 are not hung: they are optional and there is no composition need.
- **Wardrobe:** a door ajar with clothes was considered. It needs an interior (the carcass is solid), so it was not done.
- The bed frames were not changed: posts, rails, the deck and the headboard already read as constructed. The night
  tables were the weak joinery.

## 4. Track 01 integration (FLW-S3-015 / 016)

| | Before | After |
|---|---|---|
| Builder | D2 `modelSloop` / `ceramicMoon` in `d2props.ts` | `t01Sloop` / `t01Moon` wrappers → `buildSloop` / `buildMoon` (`d3bAssets.ts`); the D2 builders and `crescentPts` are **deleted** (one production implementation per stable id) |
| Anchor | unchanged: desk (79.25, UF+0.76, 80.92, yaw π/2) and window bedside (72.66, UF+0.5775, 91.0) | unchanged; `scale` 1.15 (sloop), 1.4 (moon) in `props3d.ts` |
| Audit name | FLW id | FLW id (the builders take an optional `name`, default `T01:` for the review harness) |
| Triangles | 526 / 352 | **1,334 / 1,208** (`maxTris` 1,500 / 1,400) |
| Support | — | sloop base on the desk top, inside the desk; moon block on the bedside top, inside it (unit test; e2e:dev04d support gap 0 mm) |

The asset-review harness keeps working: its `prod` variant builds through `S3_BUILDERS` and now shows the Track 01 build.

## 5. Performance and batching

PB01 is the absolute ceiling (750 k / 150 calls). The D3 local guide is ≤ +2 calls and ≤ +12 k triangles per room
batch, and the relative guards still apply. All counts are low quality (DPR 1, no shadows: camera-only), measured from
the two immutable builds with identical poses.

### 5.1 The batching decision (measured, not assumed)

`mUp` was drawn in **100 %** of the samples on every movement path, including the hall and the library. Its region
listed 16 rooms. D3-b2's first pass put its upstairs pieces in the existing chunks; four configurations were then
measured:

| Configuration | Result | Decision |
|---|---|---|
| C1: no split (pieces in `mUp` / `mUpE`) | Inside the rooms +6–8 k, calls +0–1. **But:** the guest room's books and games joined `mUpE`'s prop-atlas batch and stretched its culling sphere into the guest room: +10.8 k drawn there (+14.6 k in total, +2 calls), over the guide. The `e2e:dev04c` guard views grew: attic nook +8.3 %, attic common +9.6 %, living room +5.0 %, entrance hall +4.0 %, against a 2 % guard, for geometry those rooms can never see. | rejected |
| C2: four new regions (Reis/Sterren, bath, guest) | Large triangle savings everywhere, but each region carries 8–11 material batches: in-room +5–7 calls (doors closed) and +11–16 (all doors open), with a new > 150 view (`sk-back` 154) | rejected (calls) |
| C3: guest-room region only | Guest room −28…−39 k; the `mUp` rooms +9.6–12.3 k drawn from everywhere (the guard views still grew) | superseded |
| **C5 (kept): `mUpR` = Reis + Sterren, `mUpG` = guest room; bath stays in `mUp`; pieces that would open a tiny batch of their own (the FLW canvases, the desk set, the observing table) stay in the shared `mUp`** | `mUpR` has 5 batches, `mUpG` 7. The guard views **drop** (attic nook −17.7 %, attic common −12.4 %, living room −10.9 %, entrance hall −5.1 %). The guest room is −48…−67 k (doors closed). In-room calls are +1…+7 (max 40), no new > 150 view. | **kept** |

`mUpE` no longer lists the guest room (its content moved to `mUpG`).

**Correctness:**
- A region is drawn while one of its rooms is visible: open portals, two steps.
- The suitcase memory, the logbook and the lamps are separate interactable objects, not batches, so culling never hides
  them.
- `e2e:dev04d` checks the culling: hall and library with the doors shut draw neither region, and each room draws its own.
- dev01's culling probes still pass.

**Trade-off (needs owner acceptance):**
- Inside Reis / Sterren the call count rises by up to +7 (doors closed, max 40) because these rooms now have their own
  batches. That is above the local ≤ +2 guide, and far under 150.
- With every door in the house open, the pre-existing > 150-call hotspots on the landing and walkway rise by +7…+11.
- In exchange, every room that cannot see Reis / Sterren / the guest room no longer draws them.

### 5.2 D3-b2 poses (doors closed, 915 × 412, low)

Files: `budget-base-752cb02-poses.json` and `budget-d3b2-poses.json`.

| Pose | Before calls / tris | After calls / tris | Δ calls | Δ tris |
|---|---|---|---|---|
| re-door | 56 / 176,518 | 53 / 157,498 | -3 | -19,020 |
| re-enter | 32 / 80,824 | 34 / 85,690 | +2 | +4,866 |
| re-wide | 36 / 82,288 | 38 / 87,154 | +2 | +4,866 |
| re-travel | 27 / 80,682 | 28 / 85,448 | +1 | +4,766 |
| re-desk | 27 / 80,682 | 28 / 85,448 | +1 | +4,766 |
| re-sloop | 27 / 80,682 | 28 / 85,448 | +1 | +4,766 |
| re-bed | 27 / 80,396 | 29 / 85,262 | +2 | +4,866 |
| re-case | 33 / 85,268 | 40 / 95,846 | +7 | +10,578 |
| sk-door | 60 / 197,260 | 59 / 182,188 | -1 | -15,072 |
| sk-enter | 33 / 80,840 | 35 / 85,706 | +2 | +4,866 |
| sk-wide | 33 / 80,840 | 37 / 89,654 | +4 | +8,814 |
| sk-bed | 25 / 80,382 | 27 / 85,248 | +2 | +4,866 |
| sk-moon | 25 / 75,510 | 27 / 80,376 | +2 | +4,866 |
| sk-scope | 31 / 83,884 | 37 / 94,362 | +6 | +10,478 |
| sk-back | 33 / 83,898 | 40 / 94,476 | +7 | +10,578 |
| gu-door | 52 / 155,466 | 54 / 142,158 | +2 | -13,308 |
| gu-enter | 31 / 112,988 | 32 / 60,762 | +1 | -52,226 |
| gu-wide | 38 / 136,890 | 39 / 83,646 | +1 | -53,244 |
| gu-bed | 29 / 106,986 | 28 / 59,184 | -1 | -47,802 |
| gu-corner | 36 / 136,790 | 38 / 83,558 | +2 | -53,232 |
| gu-back | 43 / 146,646 | 39 / 79,340 | -4 | -67,306 |
| ba-door | 45 / 150,826 | 46 / 137,430 | +1 | -13,396 |
| ba-enter | 28 / 83,798 | 29 / 70,402 | +1 | -13,396 |
| ba-basin | 29 / 83,814 | 31 / 70,506 | +2 | -13,308 |
| ba-tub | 29 / 83,814 | 30 / 70,418 | +1 | -13,396 |
| ba-back | 33 / 84,140 | 34 / 70,744 | +1 | -13,396 |
| re-coat | 26 / 80,438 | 27 / 85,204 | +1 | +4,766 |
| sk-table | 30 / 83,824 | 36 / 94,302 | +6 | +10,478 |
| sk-bedside | 25 / 75,510 | 27 / 80,376 | +2 | +4,866 |
| gu-games | 35 / 136,730 | 36 / 83,414 | +1 | -53,316 |
| gu-bags | 26 / 104,360 | 26 / 59,012 | +0 | -45,348 |
| ba-wash | 29 / 83,760 | 31 / 70,452 | +2 | -13,308 |
| ba-caddy | 25 / 83,418 | 26 / 70,010 | +1 | -13,408 |

- **Inside the Reis / Sterrenkamer:** +4.8…+10.6 k triangles. That stays inside the +12 k guide for the room batch.
- **The guest room and the bathroom** are cheaper than production: they no longer draw the study / botanic batches
  (guest room) or the Reis / Sterren furnishings (bathroom).

### 5.3 Every room and exterior hero view (124 views, doors closed)

Files: `budget-base-752cb02-all.json` and `budget-d3b2-all.json`.

| | Result |
|---|---|
| Δ triangles | −65.7 k … +10.6 k |
| Δ calls | −3 … +7 |
| Ground floor and attic | 12–29 k lower in most views, e.g. library-b 246,248 → 231,336, kitchen-b 406,622 → 393,314, attic common −13 k |
| Highest after | 204 calls / 428 k triangles (see below) |
| Views over 150 calls | the six already over in production. Two of them, the kitchen views, gain +2 calls: 183 → 185, 202 → 204. **No view newly crosses 150.** |
| PB01 750 k | no view reaches it |
| Wickerman x28 / x29 | unchanged (outside this batch) |

The highest view after D3-b2:
- **Most calls:** 204, r-kitchen-b, at 393,314 triangles.
- **Most triangles:** 428,156, x28-wickerman-from-bench, unchanged by D3-b2.

### 5.4 Movement (doors closed and all doors open)

`scripts/dev04d-walk-budget.mjs`: the paths are sampled every 0.4 m with the camera along the direction of travel, plus
an eight-way turn at every waypoint.

| Path | Route |
|---|---|
| up-west | landing → walkway → Sterrenkamer → Reiskamer → gallery |
| up-east | landing → bathroom → corridor → guest room |
| hall | the hall |
| library | the library |

Files: `walk-base-752cb02.json` and `walk-d3b2.json`.

| Path / doors | Samples | Calls min / median / max (before → after) | Triangles min / median / max (before → after) |
|---|---|---|---|
| up-west/closed | 291 | 24 / 33 / 112 → 26 / 40 / 114 | 75 k / 84 k / 214 k → 80 k / 96 k / 201 k |
| up-east/closed | 216 | 24 / 42 / 115 → 25 / 39 / 116 | 83 k / 147 k / 221 k → 58 k / 84 k / 208 k |
| hall/closed | 77 | 36 / 84 / 121 → 34 / 85 / 123 | 130 k / 181 k / 216 k → 111 k / 167 k / 203 k |
| library/closed | 109 | 25 / 50 / 87 → 23 / 49 / 89 | 182 k / 192 k / 247 k → 163 k / 179 k / 234 k |
| up-west/open | 291 | 31 / 81 / 234 → 32 / 85 / 241 | 115 k / 233 k / 601 k → 114 k / 237 k / 599 k |
| up-east/open | 216 | 28 / 103 / 257 → 32 / 105 / 268 | 107 k / 316 k / 617 k → 109 k / 311 k / 618 k |
| hall/open | 77 | 102 / 217 / 293 → 100 / 222 / 305 | 374 k / 623 k / 701 k → 338 k / 611 k / 715 k |
| library/open | 109 | 29 / 88 / 176 → 27 / 88 / 178 | 184 k / 287 k / 350 k → 165 k / 274 k / 337 k |

- **Doors closed:** the median falls on three of four paths (library −13 k, hall −14 k, upstairs east −63 k). Upstairs
  west rises (+12 k median) because those samples stand inside the Reis / Sterrenkamer.
- **All doors open** (every door in the house, an extreme state): the pre-existing hotspots stay the hotspots.
  - Hall max: 293 → 305 calls, 701 k → 715 k triangles. That is still under 750 k, and over 150 calls in production
    already.
  - Landing max: 257 → 268 calls.
  - These +7…+12 calls are the cost of the regions when several of them are visible at once. They are recorded here
    and not hidden. The open-door hotspots on the landing, walkway and hall are a pre-existing D4-scale budget topic,
    not a D3-b2 one.

### 5.5 Relative guards

| Suite | D3-b2 vs production | Status of the suite's own check |
|---|---|---|
| `e2e:dev04c` (2 % guard) | Its manor views **fall**: attic nook −17.7 %, attic common −12.4 %, living room −10.9 %, entrance hall −5.1 % triangles. Calls: hall 134 → 136, others ±1. | The check itself **fails identically on production `752cb02`** (21 / 22). Its recorded `docs/dev04c/before/budget.json` predates ENV-L01 / VEG-R01 / GEO-R01; exterior views such as Wickerman (+27 %) and the conservatory deck exceed it. |
| `e2e:dev04a` (8 % / +6 calls) | Manor views fall | The same: **18 / 19 on production and on D3-b2**, against the stale `dev04a-baseline.json` (conservatory, golf, Wickerman views). |

Re-baselining those two files is an owner decision (it changes what "material regression" means). D3-b2 does not
touch them.

## 6. Player-eye assessment (phone, 915 × 412)

Matched poses: `d3b2/compare/<pose>.jpg` (before | after). Room sheets: `d3b2/sheets/<room>-{915,1280,portrait,dusk}.jpg`.

| Room | Reads at normal play distance? | What reads |
|---|---|---|
| Reiskamer | **Yes** from the door (`re-enter`, `re-wide`) | The coat stand (navy coat, rust scarf, hat) on entry. The desk at the window as a planning place: the sloop silhouette against the glass, the blue guidebook on the map, the jacket on the chair, the holdall. The suitcase rack stays the most distinct object at the east end. |
| Sterrenkamer | **Yes** (`sk-enter`, `sk-door`, `sk-scope`) | The room now has two ends: rest (bed, window, armchair, the moon on the bedside) and observation (telescope, stool with its throw, the observing table). The moon reads as a crescent volume from the bed approach. |
| North guest room | **Yes** (`gu-wide`, `gu-corner`, `gu-back`) | Zones you can name: sleeping, bags by the wardrobe, games / reading corner. The walk line door → bed / wardrobe stays clear. |
| Bathroom | **Yes, the strongest gain** (`ba-enter`, `ba-back`, `ba-tub`) | Tiled floor and dado make it a bathroom from the doorway. The wash zone (mirror, shelf, towel ring) and the bath zone (caddy, mat) read at 2–4 m. |

Clay (`after-clay`): the gain is construction, not colour. You can see:
- the coat stand's legs and pegs;
- the night tables' posts and shelf;
- the observing table's aprons and shelf;
- the holdall's bands and handles;
- the dado's joints.

**Darker lighting (late dusk, mood 1.0, `*-dusk`).** Every room keeps its identity under the cooler, darker production
dusk.
- Regular play peaks at 0.85; the 1.0 state follows the finish.
- At dusk 0.75 the interiors change little (−0…5 % mean luminance), because ENV-L01 pulls sun and fill back indoors and
  the fixtures dominate. No lamp, light or exposure was changed for D3-b2.

**Viewports.** The 1280 × 720 and portrait (412 × 915) captures use the same cameras. In portrait, several close-ups
composed for landscape lose their target at the edges (e.g. `sk-moon`). That is a limit of the fixed poses: the room
reads are kept (`*-enter`, `*-wide`).

## 7. Evidence (reproducible)

| Path | Content |
|---|---|
| `d3b2/before`, `before-dusk`, `before-clay`, `before-neutral`, `before-1280`, `before-portrait` | production `752cb02`, served from an immutable copy of its build (bundle `index-xMKKuRbU.js`) |
| `d3b2/after*` | the same sets from the final D3-b2 build (`index-DfMkJuUo.js`, frozen before the gates) |
| `d3b2/compare/` | before \| after per pose (standard), plus `-dusk` (room-whole poses) and `-clay` |
| `d3b2/sheets/` | per room × viewport (915, 1280, portrait, dusk) |
| `d3b2/budget-*.json`, `d3b2/walk-*.json` | §5 |

Poses: `SET=d3b2` in `scripts/dev04d-audit-views.mjs`, 33 fixed poses:
- door approach, entry, room whole, zones and hero close-ups;
- `DUSK=v` sets the production mood value.

Sheets: `python3 scripts/dev04d-d3b2-sheets.py`. Movement: `scripts/dev04d-walk-budget.mjs`.

## 8. Regression (one immutable build; its bundle hash was recorded before the run and is unchanged after it)

| Gate | D3-b2 | Production `752cb02` (same suite) |
|---|---|---|
| typecheck | clean | — |
| unit (vitest) | **304 / 304**, including the new `dev04d-d3b2.test.ts` (10) | — |
| test:budget | 4 / 4 | — |
| e2e:dev04d | **20 / 20** (new: D3-b2 regions culled from hall / library and drawn in their rooms; the door → suitcase / logbook / beds / wardrobe / bath routes walkable, both memories targeted) | — |
| e2e:dev04b | 9 / 9 | — |
| e2e:dev04a | 18 / 19 | **18 / 19: the same stale-baseline render check** |
| e2e:dev04c | 21 / 22 | **21 / 22: the same stale-baseline render check** |
| e2e:dev03 / dev02 / dev01 | 11 / 11, 34 / 34, 34 / 34 | — |
| full e2e | 91 / 97 | **84 / 94** |

**Full e2e failures, D3-b2 vs production:**
- **Common to both builds:**
  - high-quality desktop budgets for five exterior views: driveway, forecourt, forest, BOSLUST, conservatory;
  - a BOSLUST sample page-load timeout.
- **Production only:**
  - the entrance hall's high-quality budget: 475 k on production, **448 k and passing on D3-b2**;
  - three touch checks, failing on a tap timeout. They passed in the D3-b2 run, so they are load-sensitive.
- **No failure is new in D3-b2.**

Run conditions:
- A first gate attempt ran three SwiftShader browsers on 4 cores and crashed two suites on 30 s page timeouts.
- It was rerun with at most two browsers; the results above are from that rerun.

**Contracts:**
- 130 interactables, 21 checkpoints and save schema 4 are unchanged (e2e:dev04d / dev04a).
- No decor is interactable.
- The wall-art contract and the construction audits are clean.
- Puzzles, clue positions, evidence, ids, HUD, controls, lighting, sky, vegetation, LOD and the tutorial are untouched.
- RSV-019…022 are not referenced.

## 9. Owner review

| | Items |
|---|---|
| **Ready for approval** | Track 01 moon (×1.4) and sloop (×1.15) in production. Bathroom (tile floor, dado, wash and bath zones). Guest-room zoning. Reiskamer travel identity (desk set, coat stand, jacket, holdall). Sterrenkamer two-ended composition (observing station, armchair rest corner). Night-table joinery. The `mUpR` / `mUpG` regions with their measured savings. |
| **Visually questionable (owner's eye)** | The jacket over the Reis chair reads as a block of cloth from the door (it is a garment within 2 m). The rucksack is plain. The bathroom floor uses the existing warm stone-flag tile texture, tinted cool: a true bathroom tile (checker / encaustic) would need a new texture. Moon and sloop scale: ×1.4 / ×1.15 as approved; ×1.6 / ×1.3 would read further from the door (one-line change). |
| **Trade-off needing acceptance** | Inside the Reis / Sterrenkamer up to +7 draw calls (max 40; local guide +2) in exchange for the culling savings elsewhere (§5.1). With every door open, the existing > 150-call hotspots grow by +7…+12. |
| **Outstanding defects** | none found in D3-b2. Unrelated, recorded only: the e2e:dev04a / dev04c budget baselines are stale (production fails them); five exterior desktop budgets fail on production; window panes stay daylight-bright at late dusk (inherited from the window material); the BOSLUST / touch page-load timeouts under load. |
| **Deferred** | D2-017 (atlas repack first, §3.2), D2-027, D2-030. A real bathroom tile texture. The open-door call hotspots (landing / walkway / hall). D3-c…f (attic stores, cottage…), D4 (Wickerman ritual; x28 / x29). |

**Recommendation:**
1. Accept D3-b2 as built, including the region trade-off.
2. If the owner wants the sloop and moon readable from further away, test ×1.3 / ×1.6 in this same branch before merge.
3. Decide separately whether to re-baseline the e2e:dev04a / dev04c budget files to the current production.
