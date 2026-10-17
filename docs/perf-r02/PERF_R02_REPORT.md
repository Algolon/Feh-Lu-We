# PERF-R02: Frame-accurate visibility and culling

| Item | State |
|---|---|
| Branch | `perf-r02-frame-accurate-culling` |
| Production baseline | **`436e106d40443b8e105dce5d4d3722b46fc4be11`** (D3-b2 + D3-b2R closeout; build `index-B2a-hSQD.js`) |
| Checkpoint A (measurement) | harness `0bcc75d` … `9de478b`, `055dfca`; baseline evidence and §1–§5 of this report |
| Checkpoint B (culling) | `7f51e0f` (`mUpE`), `f7ee08a` (`mLib`); `mAttic` `e4684ca` reverted in `31c2971` (§6) |
| Final feature SHA | **`92bf875fac12de30faa71c3b9e56756b91ec8d20`** (source identical to the measured candidate `88382b3`: only tests, tooling and docs changed after it) |
| Merge / deploy | **not done**; owner review required. Current production integration: **diagnostic hold** (§12) |

All numbers are SwiftShader (software WebGL) in headless Chromium at mobile low quality: 915 × 412 CSS = drawing
buffer, DPR 1, no shadows, opaque batching on (`meta` in every evidence file). Triangle and draw-call counts are
exact renderer submissions; times are not device times (§8).

## 1. Summary

1. **The reported 920–929 k "spikes" are a measurement artefact, not gameplay.** The D3-b2 release diagnostic
   called `World.updateCulling()` *after* `Game.tick()`. Whenever that out-of-order call was the one that switched
   the `outdoor` region on, region culling made the Mushroom Grove root visible again after the grove's own updater
   (in `World.update`, inside the tick) had hidden it for distance (107 m from the manor). The grove then submitted
   **364,210 triangles** from inside the house. The game never calls culling outside `tick()`, where the order is
   camera → culling → world updaters → render, so it cannot draw that frame. Reproduced deterministically: 785,206
   triangles out of order, 420,996 in order, the same pose (§2.3, `scripts/perf/reproduce-r02-artefact.mjs`).
2. **Measured correctly, production stays within the 750 k PB01 ceiling on every path, door state and mode.** The
   real hotspots are all-doors-open stress views of the central hall, the open well and the main stair, at
   **734–738 k** (12–16 k margin). The legacy walk script was *not* materially wrong: Mode C ≈ Mode B everywhere
   (§4).
3. **The 0.12 s culling cadence adds small transients**, not large ones: at most +3.3 k triangles and +2 calls over a
   frame culled for its own pose (Mode A vs A*, §4.2).
4. **One hotspot crosses the draw-call guide:** climbing the main stair with every door open reaches **158 calls**
   (27 of 459 frames above 150) at baseline.
5. **Culling corrections (§6):** the D3-b2 doorway rule is extended to **`mUpE`** (study, botanic room, linen) and
   **`mLib`** (library and its gallery). Their topology qualifies and the pixel proof shows no lost content. All doors
   open:

   | Hotspot | Before | After |
   |---|---|---|
   | hall | 734,590 | **679,152** |
   | stair | 736,268 | **683,388** |
   | well | 737,860 | **679,152** |

   That is a 66–71 k margin to the ceiling. With the realistic partial door set, medians fall 10–48 %. With every
   door closed nothing changes.
6. **`mAttic` was rejected.** Its pixel differences come from the attic floor overlapping the hall and guest-room
   ceilings. With every door open, production draws attic floorboards in place of the hall's plaster ceiling. That is
   a pre-existing geometry defect, reported for a geometry fix (§6.3); culling should not be used to mask it.
7. **Remaining:**
   - climbing the main stair with every door open still exceeds the 150-call guide in 9 of 459 runtime frames at
     30 FPS and 20 of 914 at 60 FPS (max 153; was 27 / 52 frames, max 158);
   - production's other inherited failures are unchanged (§9).

## 2. How visibility is updated, and what each measurement saw

### 2.1 The runtime order (`src/core/game.ts`)

`frame()` → `tick(dt)` (dt capped at 0.1 s) → `mushroomVision.render()` (one `renderer.render`, or scene + fullscreen
pass with `info.autoReset` off so the counters cover both). Inside `tick`:

1. input → `player.update` → `player.applyCamera(camera)`: the camera is authoritative for this frame;
2. `cullTimer -= dt`; when ≤ 0: `cullTimer = 0.12`, `World.updateCulling(camera.position, camera)`: room graph,
   regions, cullables, vegetation windows;
3. `World.update(dt, t)`: the world's updaters (doors, fires, the Mushroom Grove's distance rule, …);
4. lights, audio, picking.

Then the render: `scene.onBeforeRender` frame hooks (vegetation LOD and per-instance culling, opaque batching) run
against the visibility of that frame. **Region state, camera transform and counters are therefore synchronized
within a frame.** Between culling updates, regions keep the visibility of the last update: at 30 FPS culling runs
every 4th frame, at 60 FPS every 8th (≈ 133 ms). A visibility update does not itself add geometry: the transition
and the render happen in the same tick, and the frame hooks read the new state.

### 2.2 What the three earlier methods did

| Method | Sequence per sample | Culling for that pose |
|---|---|---|
| `dev04d-walk-budget.mjs` (legacy) | set pose, tick, tick, set pose, tick (3 × 1/30 s), render | in 3 of 4 samples (a cull tick falls in the 3 ticks); otherwise the previous sample's |
| D3-b2 release "frame-exact" diagnostic | the legacy ticks, then `World.updateCulling()` called directly, then `renderer.render` | always, but **after** the world's updaters: out of order |
| PERF-R02 Mode B | set pose, force `cullTimer = 0`, one real `tick`, render | always, in the game's own order |

### 2.3 The 929 k artefact

At the landing (90, 99.5) turning east with every door open (`scripts/perf/reproduce-r02-artefact.mjs`):

| Sequence | Triangles | Calls | Mushroom Grove |
|---|---:|---:|---|
| `updateCulling` after `tick`, no cull tick in between | **785,206** | 138 | visible, **364,210** triangles |
| culling forced inside `tick` | 420,996 | 122 | hidden |
| legacy | 420,996 | 122 | hidden |

The grove root (`src/world/mushroomGrove.ts`) has two writers to `visible`:
- its updater sets it from the player's distance (< 65 m);
- region culling sets it when the `outdoor` region changes state.

The release diagnostic's two spikes on the up-west path (785,206 at the landing, 827,405 on the walkway) are exactly
this grove contribution, at the samples where the explicit call flipped `outdoor` on. Whether a given sample flips
depends on the cadence phase, which is why the spikes appeared only in full-path runs. It is the only top-level
object with two writers: the condenser sparks and the Wickerman parts are children of culled roots. No interior lies
within 65 m of the grove (nearest is the sauna, ≈ 74 m), so the reverse case (the updater showing the grove while its
region is off) is not reachable today. This is recorded as an interface constraint (§10).

## 3. The measurement harness

| File | Role |
|---|---|
| `scripts/perf/visibility-probe.js` | page side: pose through `Game.tick`; renderer counters; exact per-draw attribution (`renderBufferDirect` deltas of `renderer.info`, so categories sum to the counters; the attribution frame turns opaque batching off for that frame only, because batching merges calls across chunks but leaves triangles unchanged); region state; `updateCulling` CPU time |
| `scripts/perf/visibility-paths.mjs` | paths: the legacy four (identical to the walk script) plus stair, attic, gallery and well; door sets (closed, a realistic partial set, open); legacy samples; deterministic continuous trajectories |
| `scripts/perf/visibility-harness.mjs` | **Mode A**: runtime-faithful continuous movement (walk 3.2 m/s, turn π rad/s, look-arounds at corners, look up / down in the well) at a fixed 30 or 60 FPS, the game's cadence. **A\***: the same frames culled every frame. **Mode B**: pose-synchronized (culling forced inside `tick`). **Mode C**: the legacy method with the cadence phase pinned, so it is reproducible. Per frame: pose, room, heading, pitch, door set, calls, triangles, active regions, cull time, render wall time; attribution for frames > 550 k and the top 5. Percentiles and top frames per run. `RESUME=1` |
| `scripts/perf/visibility-lossless.mjs` | visual proof for doorway-rule regions (§7) |
| `scripts/perf/reproduce-r02-artefact.mjs` | §2.3 |
| `scripts/perf-visibility.mjs` | **smoke** (`npm run build && npm run perf:visibility:smoke`): Mode B determinism, the PB01 ceiling in Mode B on the walkway and well slices, idempotent synchronization, no grove leak, no page errors. A few minutes |

Extended sweep (hours on SwiftShader):

```
npm run build && npx vite preview --port 4173 &
node scripts/perf/visibility-harness.mjs http://localhost:4173/Feh-Lu-We/ out.json
# env: MODES=A,Astar,B,C  DOORS=closed,partial,open  PATHS=...  FPS=30,60  COMMIT=<sha>  RESUME=1
```

## 4. Baseline (`436e106`)

### 4.1 Per path, mode and door state (camera triangles; calls)

Full table, generated from the evidence: [`evidence/baseline-table.md`](evidence/baseline-table.md). Maxima:

| Doors | Path | A@30 max | B max | C max | calls max (A / B) |
|---|---|---:|---:|---:|---:|
| closed | every path | — | ≤ 254,084 | ≤ 254,084 | ≤ 67 |
| partial | every path | ≤ 446,698 | ≤ 444,970 | ≤ 444,970 | ≤ 99 / 90 |
| open | up-west | 637,773 | 636,855 | 636,855 | 138 / 138 |
| open | up-east | 646,831 | 642,598 | 642,598 | 147 / 147 |
| open | hall | 734,379 | 734,590 | 734,379 | 147 / 147 |
| open | library | 357,340 | 357,020 | 357,020 | 82 / 81 |
| open | stair | **735,955** | **736,268** | 736,268 | **158** / 157 |
| open | attic | 644,652 | 643,537 | 643,537 | 121 / 119 |
| open | gallery | 644,708 | 639,617 | 639,617 | 137 / 134 |
| open | well | **737,860** | 734,590 | 734,590 | 154 / 147 |

No frame in any mode exceeds 750,000. Frames over the 150-call guide occur only with every door open: stair (A: 27
frames; B: 6 poses) and well (A only, during look-arounds).

### 4.2 Cadence: A versus A* (same frames)

| Path (open) | A max | A* max | A calls max | A* calls max |
|---|---:|---:|---:|---:|
| hall | 734,379 | 734,379 | 147 | 147 |
| well | 737,860 | 734,590 | 154 | 152 |

The cadence lets a frame draw the previous update's regions for at most 133 ms. In the well that is +3.3 k triangles
and +2 calls at worst. Large or sustained cadence spikes do not exist.

### 4.3 Where the hotspot triangles go

Worst Mode B frame per hotspot (all doors open), attribution in camera triangles:

| Hotspot | Total | `mLib` | `mUpE` | `mAttic` | three together |
|---|---:|---:|---:|---:|---:|
| hall (90, 84.5) facing north | 734,590 | 107,638 | 55,438 | 25,488 | 188,564 |
| stair (94, 88) facing west | 736,268 | 107,318 | 52,880 | 24,196 | 184,394 |
| landing (92.5, 98.6) facing south-west | 642,598 | 107,318 | 53,156 | 24,196 | 184,670 |

The rest is the hall and wing interiors, the grounds and woodland seen through the open front door, and the
manor shell. All three regions are drawn because the room graph reaches their rooms at depth ≤ 3 with every door
open: the hall is double height, and the galleries, landing and corridor are one portal away.

### 4.4 CPU cost of visibility

`World.updateCulling` over all baseline runs (9,378 updates): median 0.1 ms, p95 0.7 ms, p99 1.5 ms. The headless
timer resolution is 0.1 ms. The single maximum of 23.4 ms occurred under two-browser CPU contention.

## 5. Classification of the hotspot geometry (baseline)

- **Correctly visible:**
  - the hall, galleries and landing;
  - the outdoors through the open front door (grounds and woodland);
  - the library through its doors when one faces them;
  - the attic structure that forms the ceilings.
- **Hidden but drawn:**
  - `mLib` and `mUpE` furnishings in hall, stair and landing views where no doorway of theirs is seen through;
  - Reis / Sterren / guest-room content already handled by the D3-b2 rule.
- **Drawn only because of the cadence:** ≤ 3.3 k triangles, ≤ 133 ms (§4.2).
- **Potentially visible, unsafe to cull:** `mAttic` (ceilings, §6.3) and the double-height library's gallery views.

## 6. Culling corrections (checkpoint B)

The rule is the one shipped with D3-b2 (`World.roomRegion(chunks, rooms, far, outFar, doors)`, `src/interactions/world.ts`).
From another room, a region with a door list is drawn only while one of its doors is:
- open;
- in the generous view cone (half the horizontal FOV + 32°, as the exterior-door rule);
- seen through: sight lines from the eye through 9 points of the opening, carried 0.35 m into the room, clear of
  walls, closed doors and walkable floor plates.

Standing in the doorway, or in one of the region's rooms, always draws it. Balustrades are not blockers (rejected at
D3-b2: the Sterrenkamer is seen through the gallery spindles). No change to the rule itself; PERF-R02 only applies it
to more regions.

### 6.1 `mUpE` (study, botanic room, linen): `7f51e0f`

- **Problem:** from the hall, stair, landing and galleries with every door open, the room graph reaches these rooms at
  depth ≤ 3, so 52–55 k triangles and 7–9 calls of furnishings were drawn behind the hall's east wall and the upper
  corridor.
- **Topology:**
  - entered only through `door.study`, `door.botanic` and `door.linen`;
  - its other openings are windows, which are opaque to culling;
  - `tests/perf-r02.test.ts` asserts this from the room graph.
- **Expected:** −52 to −55 k triangles and −7 to −9 calls wherever none of its doorways is seen through.
  **Measured:** the hall's worst frame drops by 55,438 triangles (734,590 → 679,152) and 4 calls.

### 6.2 `mLib` (library, library gallery): `f7ee08a`

- **Problem:** with every door open, 103–108 k triangles of library furnishings were drawn from the hall, stair,
  landing and gallery whenever the library's rooms were in the graph, mostly unseen.
- **Topology:** entered only through `door.library`, `door.livLib` and `door.libGallery`; its arch to its gallery is
  internal.
- **Measured:** removed from frames where no library doorway is seen through. The library path itself (inside the
  region) is unchanged, to the triangle.

### 6.3 `mAttic`: rejected (`e4684ca` reverted in `31c2971`)

- **Topology:** qualifies (only `door.atticStair` and `door.atticRear`).
- **Pixel proof:** fails the "no visible change" bar, with up to 87,016 px in the guest room and 58,273 px in the hall
  (`evidence/sheets/rejected-mattic-*.jpg`).
- **What the frames show:**
  - the reference (production's rooms-only rule, every door open) draws attic floorboards **instead of** the hall's
    plaster ceiling, and a dark attic wedge through the guest room's ceiling;
  - the candidate shows the normal ceilings, which are also what production shows with the doors closed.
- **Conclusion:**
  - the attic floor geometry overlaps the ceilings below and wins the depth test whenever `mAttic` is drawn: a
    **pre-existing production defect, visible with every door open** (and wherever the attic is legitimately drawn);
  - culling would mask it in most views but not fix it, and would make attic visibility depend on a rule rather than
    on geometry;
  - **recommendation:** lift the attic floor or lower the ceilings in a geometry fix, then re-evaluate `mAttic` with
    the same proof. Expected saving: 24–25 k triangles and 10–14 calls in the hotspots.

### 6.4 Effect, matched against the baseline (Modes A / B / C)

Full table: [`evidence/compare-table.md`](evidence/compare-table.md).

- **Doors closed:** identical on every path and mode.
- **Doors open**, triangles max and median:

  | Path | Max | Median (A) | Calls max | Frames > 150 calls |
  |---|---|---|---|---|
  | hall | 734,590 → 679,152 | 626 k → 595 k | 147 → 143 | — |
  | stair | 736,268 → 683,388 | 563 k → 516 k | 158 → 153 | A: 27 → 9 |
  | well | 737,860 → 679,152 | 608 k → 500 k | 154 → 147 | A: 13 → 0 |
  | up-east | 646,831 → 646,831 | 309 k → 197 k | | |
  | attic | 644,652 → 644,652 | 234 k → 177 k | | |
  | up-west | 637,773 → 637,773 | 287 k → 222 k | | |

  Where the maximum is unchanged, the worst frame's content is genuinely visible.
- **60 FPS** (culling every 8th frame) behaves like 30 FPS:

  | Path, all doors open | Max | Calls max | Frames > 150 calls |
  |---|---|---|---|
  | stair | 735,744 → 687,070 | 158 → 153 | 52 → 20 of 914 |
  | well | 737,860 → 682,422 | 156 → 151 | 26 → 1 of 848 |

- **A\* (culling every frame) vs A**, after the change: well 679,152 / 147 for both, hall 678,941 / 142 vs 143. The
  cadence still adds at most a few thousand triangles and 1–4 calls.
- **Over all 65 matched runs, no triangle median, p95, p99 or maximum increased.** The only increase of any kind is
  library / partial / Mode B max calls, 76 → 77. The rule never fires on that path and its triangles are identical, so
  this is the opaque batching's ±1 (§8).

### 6.5 CPU cost

`World.updateCulling` median 0.1 ms before and after, p95 0.7 ms. The headless timer resolution is 0.1 ms, so the
added sight-line tests are below what it can resolve. The rule runs only for doorway regions, only when their rooms
are already in the graph, and at most 9 segment tests per door.

## 7. Visual safety

Tool: `scripts/perf/visibility-lossless.mjs`. Evidence: `evidence/lossless/` (JSON, run log, crops),
`evidence/sheets/`. Method:
- every frame where the rule hides a region is rendered twice in the **same frame and state**: the candidate, and a
  reference with the PERF-R02 regions switched back to production's rooms-only rule (frustum culling untouched);
- any differing pixel (> 6/255) is attributed per region and cropped.

| Coverage | Frames where the rule culled | Frames with any difference | Max px |
|---|---:|---:|---:|
| Mode B (synchronized; pitch 0 and look-up), 8 paths, doors open (1,641 poses) | 1,133 | 112 | 69 |
| Mode B, 8 paths, partial doors (1,641 poses) | 1,133 | 114 | 69 |
| Mode A (cadence, continuous, 30 FPS), 6 paths, doors open (4,240 frames) | 3,315 | 252 | 137 |

- **Every difference was inspected by region and location.** All are bleed-through: dashed lines and speckles on plain
  walls where furnishings behind the wall (library behind the walkway and Sterrenkamer walls, study behind the hall's
  east wall) pierce the wall's seams. The candidate shows the clean wall. No furniture, clue, lamp or interactable
  disappears.
- **Mode A frames include:**
  - doorway approaches and crossings (gallery → Reis / Sterren, corridor → study / guest room, landing → library
    gallery);
  - look-arounds at π rad/s, look up / down in the well, and the stair climb;
  - the cone margin (32° ≥ 24° turned per 133 ms update) covers turning, and no late pop-in appeared.
- **Interactables:** none lives in a doorway-rule region (checked over every interactable's hit geometry), so
  targeting is unchanged. The only region-owned interactables are the Wickerman's, in the unchanged `wick` region.
- **Tests:** `tests/perf-r02.test.ts` covers the region set, topology eligibility, the rule (corridor facing / away,
  shut door, inside, in the doorway, floor plate, cone turn) and harness determinism. `e2e:dev04d` checks the D3
  regions with doors open.

## 8. Limits

- **Software only:** SwiftShader in headless Chromium, so no Samsung or GPU timing. The ~30 FPS target remains device
  validation pending (PB01). Render wall times in the evidence include SwiftShader rasterization and are relative only.
- **No GPU timer** (`EXT_disjoint_timer_query` is unavailable on SwiftShader), so no GPU / CPU split per frame. The
  measured CPU cost is that of `updateCulling`.
- **Determinism:**
  - vegetation LOD keeps 3 m hysteresis, so a pose's tree levels depend on the camera's previous path; runs are
    reproducible for an identical history (the smoke compares same-history runs);
  - the low-quality opaque batching can merge or split one draw (±1 call, same geometry) depending on its previous
    frame.
- **Coverage:** representative scripted paths, not every reachable pose. Pixel proof Mode A ran on 6 of the 8 paths
  (library: the rule never fires; attic: covered by Mode B).

## 9. Regression and handover

### 9.1 Gates on the candidate

Production's failure sets are those recorded for the identical production source at the D3-b2 release
(`DEV04D_D3B2R_REPORT.md` §10.3).

| Gate | Candidate | Class |
|---|---|---|
| typecheck / `npm test` / `test:budget` / build | clean / **398 of 398** / 4 of 4 / ok | — |
| e2e:dev04d | **21/21** | — |
| e2e:dev04d-w01 | **27/27** | — |
| e2e:dev04d-w01-release | 7/8 | inherited (kitchen pouch label; identical) |
| e2e:dev04a / dev04c | 18/19 / 21/22 | inherited (stale low baselines; identical) |
| e2e:dev04b / dev03 / dev02 | 9/9 / 11/11 / 34/34 | — |
| e2e:dev01 | **34/34** on a rerun alone | first run 31/32 under sweep load ("mobile landscape" read a null element before the page settled): infrastructure |
| e2e:handpan | 10/10 | — |
| full e2e | 83/94 | inherited and infrastructure, identical set: seven desktop high-quality budgets with unchanged numbers (entrance hall 494,662), the BOSLUST sample goto timeout, and the touch-timing trio (F05 / direct tap / `page.tap` timeout) that fails then passes on both builds |
| e2e:ui-r02 | 106/112 | inherited (identical six) |
| **perf:visibility:smoke** | see §9.3 | new |

Gameplay contracts:
- IDs, save schema 4, routes, puzzles and audio: unchanged (dev01–04 suites, W01 suites);
- no gameplay file is touched: the diff is `src/world/estate.ts` (two region registrations), tests and tooling.

### 9.2 Reproducibility

- **Modes B and C:** reproducible pose for pose for an identical history (§8).
- **Repeated sweeps:** baseline runs measured twice across container restarts (up-west doors open and partial, Mode A)
  gave identical triangle summaries (median, p95, p99, max) and max calls within ±1 (137 / 138: opaque batching).
- **Mode A:** deterministic for a fixed trajectory and cadence phase (pinned at the path start).

### 9.3 Smoke

`npm run build && npm run perf:visibility:smoke` (about 10 minutes on SwiftShader under load):
- Mode B determinism (same-history runs);
- PB01 in Mode B on the walkway and well slices;
- idempotent synchronization;
- no Mushroom Grove leak;
- no page errors.

On the candidate: **7/7 passed** (walkway max 636,855 / 130 calls; well max 679,152 / 142 calls; max call difference between same-history runs 1).

### 9.4 Production moved during this iteration

At handover, production is **`5cedaee`**, 220 commits after the measured baseline `436e106`: window rollout,
exterior and interior greenery, the lion knocker, the BOSLUST lock, foliage and ground textures, and more.

- **Merge:** `git merge-tree` of this branch with `5cedaee` is clean, and production's `world.ts` / `estate.ts`
  changes do not touch region or doorway logic.
- **Measurements:** the numbers in this report describe `436e106` and the candidate built on it. Production's new
  geometry adds to every view.
- **Before merging:**
  - merge production in;
  - rerun `npm run perf:visibility:smoke` and the hotspot sweep
    (`DOORS=open MODES=A,B PATHS=hall,well,stair node scripts/perf/visibility-harness.mjs …`) on both the merged
    tree and `5cedaee`;
  - rerun the pixel proof for `mUpE` / `mLib` (`scripts/perf/visibility-lossless.mjs`);
  - rerun the gates.

## 10. Interface constraints and recommendations

- **Measure with the harness, never with an out-of-order `World.updateCulling`.** For a fully updated frame, force the
  cadence (`cullTimer = 0`) and run a real `Game.tick`. Release gates should use Mode B for worst cases and Mode A for
  runtime behaviour. The legacy walk script remains valid (≈ Mode B) but reports one maximum, not frames.
- **Two writers to one `visible` flag:** a top-level scene object that a world updater shows or hides
  (the Mushroom Grove) is also governed by region culling, and only the tick's order keeps them consistent. New
  features should hide children of a region-owned root, or AND their rule with `userData.regionOff`.
- **Doorway regions:** a region may use the doorway rule only if every opening to the rest of the house is a listed
  door (`tests/perf-r02.test.ts`) *and* its geometry stays inside its rooms. New rooms should be built as their own
  region, with that list, from the start.
- **Attic floor / ceiling overlap** (§6.3): a production visual defect with every door open. Recommended as a small
  separate geometry fix; then re-run the `mAttic` proof.
- **Remaining over-guide frames:** the main stair with every door open (30 FPS: 9 of 459 frames, 60 FPS: 20 of 914,
  max 153 calls) and one 60 FPS well frame (151). Candidates
  for a later bounded pass:
  - the hall and wing furnishings (`mWing` 62 k / 11 calls, `mServ` 35 k / 8 calls in the hotspots);
  - the woodland seen through the front door.
- **Headroom:** the worst all-doors-open stress view now leaves ≈ 66 k triangles; the realistic partial door set
  leaves ≥ 311 k; doors closed ≥ 496 k.
  - **Vegetation / draw distance:** woodland and grounds seen through open exterior doors are a large share of the
    hall hotspot (trees 45–71 k, grounds 50–67 k). Changes there should be measured with Mode A / B on the hall,
    well and stair paths with every door open.
  - **New interior detail:** new interior detail in the hall, landing or wing lands directly in the remaining
    stress-view headroom.
- **Device validation** (PB01) is still required before any of these numbers are read as frame rates.

## 11. Commits

- **Checkpoint A (tooling):** `0bcc75d` harness, `f4087a9` pixel-proof tool, `3dda0c5` resume, `9de478b` artefact
  reproduction, `055dfca` incremental proof, `9fabde4` report and baseline evidence.
- **Checkpoint B:** `7f51e0f` `mUpE`, `f7ee08a` `mLib`, `e4684ca` `mAttic` → reverted `31c2971`, `88382b3` test,
  `79be2d0` evidence.
- **Checkpoint C:** `ea17064` smoke fix; this report and evidence (final SHA in the handover).

## 12. Current Production Regression — Budget Attribution and Release Decision

**Status: diagnostic hold. Nothing merged or deployed.** The conditional release authorization was suspended by the
owner pending this investigation.

| Item | SHA / build |
|---|---|
| Historical PERF-R02 baseline (H) | `436e106` · `index-B2a-hSQD.js` (the build §4 measured) |
| Current production measured (P) | **`2404d85`** · `index-Ch5jjV5W.js` (LIB-R01-R04; Pages run 951 succeeded) |
| Combined candidate (C) | **`b359a71`** · `index-CMkVQDx_.js` = P + PERF-R02 + the window exemption (§12.6); later commits change only tooling and docs |
| Production at the end of this step | `d7b304d` (LIB-STAIR-R01/R02: `libraryR01.ts`, `libraryStairR01.ts`, 8 lines of `manor.ts`; library-only, not measured) |
| Feature branch head | the commit that carries this section (handover) |

Method: the PERF-R02 harness on all three builds, unchanged: same fixture save, viewport 915 × 412, DPR 1, low quality,
no shadows, batching on, the same paths and door sets. Mode B for every door state; Mode A at 30 FPS where collected.
H rows come from the §4 evidence files, measured by the same harness on the same paths. They are a matched
comparison, not an approximation. Evidence: `docs/perf-r02/evidence/release/` (smoke and targeted runs) and
`docs/perf-r02/evidence/current-production/` (attribution).

### 12.1 Severity: the violation is not limited to the all-doors-open stress state

Production now exceeds 750 k camera triangles **with every door closed**, on every hotspot path. In `436e106` the
same paths and poses stayed under 255 k with every door closed and under 446 k with the partial set.

Matched runs: H = `436e106` (§4 evidence), P = `2404d85`, C = `b359a71`. Mode A is the 30 FPS runtime simulation, Mode B the pose-synchronized one.

| path | doors | mode | build | frames | median | p95 | p99 | max | calls max | > 750 k | > 150 calls |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| hall | closed | A@30 | P | 289 | 516,392 | 822,278 | 847,586 | 853,724 | 151 | 96 (33 %) | 2 (1 %) |
| hall | closed | A@30 | C | 289 | 516,392 | 822,278 | 847,586 | 853,724 | 151 | 96 (33 %) | 2 (1 %) |
| hall | closed | B@30 | H | 77 | 188,768 | 221,568 | 221,916 | 222,902 | 59 | 0 (0 %) | 0 (0 %) |
| hall | closed | B@30 | P | 77 | 734,120 | 867,808 | 932,918 | 1,074,646 | 156 | 34 (44 %) | 1 (1 %) |
| hall | closed | B@30 | C | 77 | 734,120 | 867,808 | 932,918 | 1,074,646 | 156 | 34 (44 %) | 1 (1 %) |
| hall | partial | A@30 | H | 289 | 337,350 | 410,150 | 426,118 | 426,118 | 82 | 0 (0 %) | 0 (0 %) |
| hall | partial | A@30 | P | 289 | 903,368 | 1,104,132 | 1,137,648 | 1,138,104 | 202 | 190 (66 %) | 121 (42 %) |
| hall | partial | A@30 | C | 289 | 882,678 | 998,180 | 1,027,452 | 1,034,528 | 194 | 185 (64 %) | 117 (40 %) |
| hall | partial | B@30 | H | 77 | 343,496 | 410,150 | 426,118 | 426,118 | 82 | 0 (0 %) | 0 (0 %) |
| hall | partial | B@30 | P | 77 | 931,300 | 1,112,186 | 1,138,346 | 1,264,650 | 202 | 59 (77 %) | 37 (48 %) |
| hall | partial | B@30 | C | 77 | 909,836 | 1,005,002 | 1,043,936 | 1,155,218 | 194 | 58 (75 %) | 35 (45 %) |
| hall | open | A@30 | H | 289 | 626,386 | 719,415 | 734,379 | 734,379 | 147 | 0 (0 %) | 0 (0 %) |
| hall | open | A@30 | P | 289 | 1,059,346 | 1,197,486 | 1,231,002 | 1,231,458 | 226 | 289 (100 %) | 215 (74 %) |
| hall | open | A@30 | C | 289 | 1,015,010 | 1,113,604 | 1,132,912 | 1,140,998 | 221 | 289 (100 %) | 215 (74 %) |
| hall | open | B@30 | H | 77 | 630,364 | 719,247 | 734,232 | 734,590 | 147 | 0 (0 %) | 0 (0 %) |
| hall | open | B@30 | P | 77 | 1,075,470 | 1,201,184 | 1,231,900 | 1,329,960 | 226 | 77 (100 %) | 63 (82 %) |
| hall | open | B@30 | C | 77 | 1,030,528 | 1,101,434 | 1,121,704 | 1,220,528 | 218 | 77 (100 %) | 63 (82 %) |
| stair | closed | B@30 | H | 108 | 175,412 | 219,846 | 226,254 | 226,728 | 60 | 0 (0 %) | 0 (0 %) |
| stair | closed | B@30 | P | 108 | 704,238 | 868,860 | 906,094 | 907,148 | 157 | 31 (29 %) | 8 (7 %) |
| stair | closed | B@30 | C | 108 | 704,238 | 868,860 | 906,094 | 907,148 | 157 | 31 (29 %) | 8 (7 %) |
| stair | partial | A@30 | H | 459 | 356,478 | 430,608 | 443,836 | 446,698 | 99 | 0 (0 %) | 0 (0 %) |
| stair | partial | B@30 | H | 108 | 356,698 | 434,180 | 441,658 | 444,970 | 90 | 0 (0 %) | 0 (0 %) |
| stair | partial | B@30 | P | 108 | 960,442 | 1,142,344 | 1,222,342 | 1,236,708 | 210 | 87 (81 %) | 43 (40 %) |
| stair | partial | B@30 | C | 108 | 884,646 | 1,069,932 | 1,158,162 | 1,172,804 | 202 | 83 (77 %) | 39 (36 %) |
| stair | open | A@30 | H | 459 | 562,513 | 707,611 | 729,211 | 735,955 | 158 | 0 (0 %) | 27 (6 %) |
| stair | open | A@30 | P | 459 | 1,060,336 | 1,193,320 | 1,259,494 | 1,274,005 | 235 | 444 (97 %) | 349 (76 %) |
| stair | open | A@30 | C | 459 | 983,076 | 1,136,706 | 1,236,054 | 1,272,536 | 227 | 443 (97 %) | 331 (72 %) |
| stair | open | B@30 | H | 108 | 557,260 | 707,451 | 724,402 | 736,268 | 157 | 0 (0 %) | 6 (6 %) |
| stair | open | B@30 | P | 108 | 1,073,024 | 1,221,184 | 1,295,164 | 1,300,702 | 235 | 107 (99 %) | 88 (81 %) |
| stair | open | B@30 | C | 108 | 997,648 | 1,163,876 | 1,236,522 | 1,239,598 | 227 | 107 (99 %) | 83 (77 %) |
| well | closed | B@30 | H | 64 | 200,520 | 220,462 | 220,462 | 221,624 | 58 | 0 (0 %) | 0 (0 %) |
| well | closed | B@30 | P | 64 | 760,454 | 921,542 | 969,556 | 1,054,128 | 157 | 33 (52 %) | 2 (3 %) |
| well | closed | B@30 | C | 64 | 760,454 | 921,542 | 969,556 | 1,054,128 | 156 | 33 (52 %) | 2 (3 %) |
| well | partial | A@30 | H | 425 | 365,966 | 426,118 | 426,134 | 428,434 | 89 | 0 (0 %) | 0 (0 %) |
| well | partial | B@30 | H | 64 | 365,046 | 413,406 | 426,118 | 426,118 | 82 | 0 (0 %) | 0 (0 %) |
| well | partial | B@30 | P | 64 | 975,136 | 1,138,346 | 1,159,492 | 1,210,632 | 202 | 52 (81 %) | 39 (61 %) |
| well | partial | B@30 | C | 64 | 915,708 | 1,050,060 | 1,101,200 | 1,108,410 | 194 | 46 (72 %) | 33 (52 %) |
| well | open | A@30 | H | 425 | 607,825 | 734,099 | 734,590 | 737,860 | 154 | 0 (0 %) | 13 (3 %) |
| well | open | A@30 | P | 425 | 1,059,224 | 1,231,898 | 1,312,374 | 1,362,296 | 233 | 425 (100 %) | 376 (88 %) |
| well | open | A@30 | C | 425 | 966,826 | 1,132,696 | 1,179,776 | 1,202,942 | 225 | 425 (100 %) | 307 (72 %) |
| well | open | B@30 | H | 64 | 625,142 | 719,415 | 734,590 | 734,590 | 147 | 0 (0 %) | 0 (0 %) |
| well | open | B@30 | P | 64 | 1,064,682 | 1,231,900 | 1,256,046 | 1,305,906 | 226 | 64 (100 %) | 55 (86 %) |
| well | open | B@30 | C | 64 | 989,932 | 1,146,614 | 1,194,382 | 1,196,474 | 218 | 64 (100 %) | 49 (77 %) |
| up-west | closed | B@30 | H | 291 | 106,686 | 211,124 | 220,306 | 221,248 | 60 | 0 (0 %) | 0 (0 %) |
| up-west | closed | B@30 | P | 291 | 625,944 | 1,012,776 | 1,088,676 | 1,095,792 | 169 | 108 (37 %) | 21 (7 %) |
| up-west | closed | B@30 | C | 291 | 625,944 | 1,012,776 | 1,088,676 | 1,095,792 | 169 | 108 (37 %) | 21 (7 %) |
| up-west | partial | A@30 | H | 1350 | 265,622 | 393,834 | 420,380 | 434,578 | 83 | 0 (0 %) | 0 (0 %) |
| up-west | partial | B@30 | H | 291 | 240,610 | 394,490 | 419,674 | 433,402 | 78 | 0 (0 %) | 0 (0 %) |
| up-west | partial | B@30 | P | 291 | 820,868 | 1,061,374 | 1,117,020 | 1,120,644 | 188 | 198 (68 %) | 50 (17 %) |
| up-west | partial | B@30 | C | 291 | 763,256 | 1,061,184 | 1,113,284 | 1,120,400 | 188 | 164 (56 %) | 44 (15 %) |
| up-west | open | A@30 | H | 1350 | 287,062 | 580,743 | 621,799 | 637,773 | 138 | 0 (0 %) | 0 (0 %) |
| up-west | open | B@30 | H | 291 | 240,622 | 574,577 | 620,310 | 636,855 | 138 | 0 (0 %) | 0 (0 %) |
| up-west | open | B@30 | P | 291 | 881,502 | 1,121,620 | 1,211,362 | 1,234,154 | 207 | 214 (74 %) | 64 (22 %) |
| up-west | open | B@30 | C | 291 | 823,138 | 1,091,590 | 1,128,608 | 1,234,154 | 207 | 197 (68 %) | 59 (20 %) |

H has no doors-closed Mode A run (§4 measured doors closed in Modes B / C only). The 60 FPS stress sweeps and the remaining all-open paths
(`up-east`, `library`, `gallery`, garden windows) were not run on P / C. The all-open state already exceeds 750 k on 97–100 % of frames, so they
would add hours and no decision value. Generator: `node scripts/perf/consolidate.mjs H=… P=… C=…`.

Reading the table:

- **Doors closed** (the state of a fresh game, and of most play):
  - production exceeds 750 k on 29–52 % of the Mode B poses of the hall, stair, well and upper-west paths, and on 33 % of
    the 30 FPS frames of the hall walk (Mode A);
  - medians are 626 k–760 k; maxima 0.91 M–1.10 M;
  - 1–7 % of poses exceed 150 calls.
- **Partial set** (nine doors a player opens upstairs):
  - production exceeds 750 k on 68–81 % of the Mode B poses and on 66 % of the hall walk's Mode A frames;
  - the combined candidate does on 56–77 % and 64 %, with 15–45 % of poses over 150 calls;
  - combined medians are 763 k–916 k.
- **All open:** 97–100 % of frames exceed 750 k; 72–88 % exceed 150 calls.

PERF-R02 changes nothing with doors closed, by design: the doorway rule can only hide a region whose door is open.
The 750 k ceiling is therefore exceeded in ordinary play **by production itself**, independently of PERF-R02.

### 12.2 What changed: attribution at fixed poses

Every pose below was rendered on H, P and C, with culling synchronized inside `Game.tick`
(`scripts/perf/pose-breakdown.mjs`). Each pose is attributed per drawn object; the categories sum exactly to the
renderer's counters in every frame (`reconciled: true`). "Visible px" comes from a diagnostic visibility test: the
category's drawn objects are hidden for one render, and the changed pixels are counted (frame: 376,980 px).

| Pose (Mode B) | H | P | C |
|---|---:|---:|---:|
| hall (89.5, 95), facing south, doors closed | 209,910 | 1,074,646 | 1,074,646 |
| hall (90, 84.6), facing north, doors closed | 220,462 | 818,052 | 818,052 |
| landing (90, 99.5), facing south, doors closed | 219,786 | 654,768 | 654,768 |
| well (90, 84.5), doors closed | 220,462 | 821,984 | 821,984 |
| hall (89.5, 95), facing south, partial | 319,848 | 1,264,650 | 1,155,218 |
| well (90, 84.5), partial | 426,118 | 1,138,346 | 1,028,150 |
| stair maximum (89, 100), all open | 641,084 | 1,274,005 | 1,189,729 |
| hall (89.5, 95), facing south, all open | 552,858 | 1,322,254 | 1,212,822 |

Tables per pose: `current-production/attribution/hall-table.md` and `upper-table.md`.

**Which merge added what.** The two doors-closed hall poses were measured at nine production checkpoints between H
and P. Each checkpoint was built from its own commit, and the served bundle was checked against that commit's build
before measuring. Source: `current-production/attribution/steps-hall-closed.md`.

| Checkpoint (first-parent merge) | Hall (89.5, 95) closed | Hall (90, 84.6) closed | What grew |
|---|---:|---:|---|
| `436e106` PERF-R02 baseline | 209,910 | 220,462 | |
| `ba56ad1` hall–kitchen portal | +264 | +276 | — |
| `be9a9e2` exterior greenery R04 (#58) | **+205,408** | **+204,704** | the `manor` shell batch |
| `73a3cb6` VEG-R09 (#68) | **+155,482** | +54,048 | front hedges 118,592; indoor plants 24–37 k; rooms 11–12 k |
| `55f6da6` exterior weather R06 (#69) | +27,410 | +20,320 | spread over the room chunks |
| `6830ddd` WINDOW-R02 | +7,428 | +8,428 | window sashes / sills |
| `b548361` WINDOW-FIX-R02 | +30,308 | −4,164 | the unowned `main` batch (+33 k) |
| `e61520d` PORTAL-R02 | **+431,482** | **+314,730** | the whole outdoors: grounds / woodland 201–223 k, tree batches 67–230 k, conservatory 21 k |
| `2e6b8f9` VEG-R10 | −792 | −792 | — |
| `2404d85` LIB-R01-R04 | +7,746 | +40 | — |
| **Total** | **+864,736** | **+597,590** | |

Three merges explain 82–97 % of the increase at these poses: PORTAL-R02, exterior greenery R04 and VEG-R09.

### 12.3 Ranked contributors

| # | Contributor (region / chunk) | Submitted now (tris / calls) | In H | Δ | Visible in the rendered frame? | Safe to cull? | Workstream / module |
|---|---|---|---:|---:|---|---|---|
| 1 | **Outdoors through windows**: `forest`, `grounds`, `garden`, `paths`, `fence`, `outdoor` regions, `veg:trees`, `veg:plants`, `cons` | 240–457 k / ≈ 60–70 | 0 (closed doors) | +240–457 k | **0–1,598 px** (≤ 0.4 % of the frame; 0–5 px at 7 of 9 poses) | Partly: a few hundred pixels are genuinely visible through a living/dining window, so the content cannot simply be hidden | PORTAL-R02, `World.clearWindowInView` / `updateCulling` (`src/interactions/world.ts`) |
| 2 | **Wall climbers** merged into the `manor` shell batch | ≈ 204–205 k / 0 extra | 0 | +205 k | **0 px of foliage** from the hall (with vs without `?greenery=base`; the 3,241 px that changed are lamp flicker, not foliage) | Yes, from inside the house: they are on the house's own west / north facades | Exterior greenery R04 (#58), `exteriorGreenery.ts` (built into the `manor` chunk by `manor.ts`) |
| 3 | **Front hedges** `frontHedge.left` / `.right` | 118,592 / 2 | 0 | +119 k | **0 px** at every pose tested (hall, landing, stair) | Yes, from inside except through the front door: the region lists *every* room, so it is drawn from anywhere within 25 m | VEG-R09 (#68), `estate.ts` line 137 |
| 4 | Indoor plants `green.<room>` | 24–88 k / 18–60 | 0 | +24–88 k | mostly in other rooms (0 px where tested) | Already room-based; follows the room graph | VEG-R09, `interiorGreenery.ts` |
| 5 | `main` (the batch builder's default chunk: geometry without region ownership, never culled) | 46–58 k / 20–45 | 2.8–15 k | +33–43 k | 2–5 k px (some window sashes are in view) | Needs region ownership, not hiding | WINDOW-FIX-R02 (`kit.ts` default `chunk = 'main'`) |
| 6 | `mUpE` study wing (heavier since D3) | 64–110 k / 7–12 | 53–56 k | +11–55 k | 0–7 px from the hall / landing | **PERF-R02 removes it** when no doorway or window of it is in view | D3-b2, D1 art |
| 7 | Room chunks `mHall`, `mLiv`, `mWing`, `mUp*` | +7 k to +35 k each | | | visible | No | weather R06, windows |
| 8 | `mLib` (library) | 84–112 k | 103–108 k | −18 k to +4 k | 0 px from the hall and landing | **PERF-R02 removes it** (same rule) | LIB-R01-R04 (no material growth) |

Not material at these poses: lighting (no geometry), the library redesign (−18 k to +8 k), the Mushroom Grove
(0–200 triangles).

### 12.4 The visibility relationship behind contributor 1

Before PORTAL-R02, a clear window could reveal the outdoors only from inside its own room. PORTAL-R02 (12 added
lines) accepts any window in a room reachable through up to three open interior portals, if it passes:

- the generous view cone (half the field of view + 32°);
- five line-of-sight rays.

**One** such window anywhere puts `out` into the visible set, and with it every outdoor region of the estate: the
woodland, grounds, garden, paths and the conservatory. The tree batches are then limited to the window's plan cone, but
the region chunks are drawn whole.

The hall has no windows of its own. Through its arches it reaches the living, dining and kitchen windows, so from the
hall the outdoors is on in almost every heading, even with every door closed. At the hall pose facing north, 290,842
outdoor triangles are drawn for 3 visible pixels; the qualifying window lies inside the +32° margin but outside the
frame.

This is the largest single contributor. It is a legitimate sightline at some poses (1,598 px through the dining arch),
so a correct fix is a rule change, not a removal: for example, limit content seen only through windows to the
window's frustum and a distance, or drop the +32° margin for windows (it exists for doorways at the 0.12 s cadence).

### 12.5 PERF-R02 on current production

- **Benefit with doors open:**
  - hall −45 k to −110 k (max 1,329,960 → 1,220,528 in Mode B);
  - well −75 k to −160 k;
  - stair median −77 k;
  - every metric lower or equal in every matched run (§12.1 table).
- **Doors closed:** identical.
- **Draw calls:** −2 to −8 at the maxima.
- **Smoke** (`npm run perf:visibility:smoke` on P and C):
  - determinism and synchronization pass on both;
  - PB01 fails on both: the walkway slice is 1,234,154 on both (the peak pose shows no doorway region); the hall-well
    slice is 1,231,900 on P and 1,121,704 on C.
  - The grove check was updated for VIS-R01 (§12.7) and now passes on both.
- **Integration fix (window exemption, `d9a8503`):** WINDOW-R02 made 44 windows transparent. Without the fix, the
  doorway rule would have hidden the library, botanic room and study when seen through their own windows from the
  garden (no doorway in view). `World.updateCulling` now keeps a doorway region drawn while one of its rooms' clear
  windows is in view.
  - Unit tests: 485 / 485, including a new window-exemption test that fails without the fix.
  - The exemption reuses PORTAL-R02's generous window test, so it also re-enables `mUpE` / `mLib` at some poses where
    they are invisible: at the partial-door landing pose, 195 k at 0 px. That is the conservative direction (more drawn,
    never less), and it shrinks PERF-R02's saving there.
- **Pixel proof on current production** (`scripts/perf/visibility-lossless.mjs` on C, Mode B). Each frame is compared
  with a reference in which the ruled regions are switched back to the rooms-only rule; evidence:
  `current-production/lossless/`.

  | Paths (regions tested) | Doors | Culled frames | Diff frames | Max diff |
  |---|---|---|---|---|
  | `up-east`, `gallery` (`mUpE`, `mLib`) | open, partial | 363 per door state | 34–37 | **20 px**, all seam bleed-through (sheet `sheet-up-east-269-seam.jpg`: dashed specks of the library through the guest-room wall seam, removed by the rule) |
  | Garden window paths `win-north` / `win-west` / `win-south` (`mUpE`, `mLib`, `mUpR`, `mUpS`) | open | 0 of 427 | 0 | 0 px: the window exemption keeps every doorway region drawn while seen through its windows from the garden |

  - **Rule savings in those frames:** 35–80 k on average, up to 226 k.
  - **Not repeated on P / C:** the Mode A runs, the hall / stair / well paths and dusk lighting. The §7 proof on
    `436e106` covers them, and production did not change the rule's inputs: doors, walls and floors in these areas.
    The library staircase (`d7b304d`, after P) sits inside `mLib`.

### 12.6 Risks

- **Visual:** none found from PERF-R02 in the attributed frames. The H/P/C screenshots at the doors-closed hall poses
  are identical apart from production's own content changes (`sheet-*.jpg`).
- **Interaction:** unchanged. Region culling still removes pick eligibility only for culled roots, and no interactable
  in `mUpE` / `mLib` is reachable from a pose where the rule hides it. The library's B01 puzzle anchors sit inside
  `library`, where the region is always drawn.
- **Lighting:** LIGHT-R03/R04 select point lights from room connectivity and distance only (`LightPool.update`), not
  from region state or gaze, so PERF-R02 cannot change illumination. No lighting code was touched.
- **Fixing contributors 2 and 3** would hide geometry that is visible from outside. Both need a pixel proof along the
  garden window paths (`win-north`, `win-west`, `win-south`, added to `visibility-paths.mjs`) and through the front door.

### 12.7 Tooling corrections made in this step

- `perf-visibility.mjs` (smoke): the grove check read the grove root's `visible` flag. Since VIS-R01 the root stays
  visible and the grove hides each instance, so on production the old check failed on both P and C.
  - It now reads `groveSnapshot()`: an out-of-order `World.updateCulling` must not change what the grove draws in the
    next frame, and the grove must draw < 5 k triangles there.
  - Production draws 0–2 instances (≤ 200 triangles) at those poses.
- `visibility-probe.js`: `hideTest()` (the diagnostic visibility test) and fine attribution per object and material.
- `pose-breakdown.mjs`, `attribution-table.mjs`, `attribution-steps.mjs`, `consolidate.mjs`: attributed poses, H/P/C
  tables, checkpoint steps, matched run tables.
- `visibility-harness.mjs`: `QUERY` env for diagnostic URL flags (e.g. `greenery=base`).
- `visibility-paths.mjs`: the garden window paths.
- A preview server left running by the first checkpoint script served the wrong build to four checkpoints. Those
  results were discarded, and the script now checks the served bundle against the checkpoint's own build before it
  measures.

### 12.8 Release recommendation

**Recommended outcome: C — a separate, bounded PERF-R03 remediation. PERF-R02 is kept ready and released with it
(or before it, if the owner explicitly names an exception).**

Why not A:
- The exceedance is not limited to an exceptional stress state.
- With every door closed, 29–52 % of the hotspot poses exceed 750 k (maximum 1.07 M); with the partial set, 56–77 %
  (combined candidate).
- PERF-R02 is non-regressive and saves 45–160 k with doors open, but it cannot touch the closed-door state.
- Merging it now would still be safe: it never draws more, and nothing visual or interactive changed. But it would be
  under a named exception, and the owner asked not to treat the production violation as an automatic waiver.

Why not B:
- Two contributors are clearly invisible from inside the house and small to fix:
  - the wall climbers (≈ 205 k, in every manor view);
  - the front hedges (118.6 k within 25 m).
- Together they remove ≈ 205–324 k from the interior views measured: the doors-closed hall worst case goes from
  1,074,646 to ≈ 750 k, other closed-door poses to ≈ 410–615 k.
- That is real headroom, but it does not restore compliance:
  - the largest contributor, the outdoors switched on through windows (240–457 k), remains;
  - the partial-door hall would remain ≈ 830 k.
- The window rule is the core of PORTAL-R02's intent (keep windows transparent across thresholds) and is partly
  legitimately visible. Changing it needs its own design and a pixel proof, not a quick cull.

Why C:
- Realistic gameplay substantially exceeds PB01.
- The excess comes from three separate workstreams (PORTAL-R02, exterior greenery R04, VEG-R09) plus smaller ownership
  issues.
- Each fix is small, but each has its own visual risk and needs its own proof.

**Proposed PERF-R03 scope** (bounded; no vegetation LOD, quality, DPR or budget changes):

1. **Ownership of exterior geometry that is invisible from inside** (expected −205 k to −324 k in interior views):
   - **Wall climbers:** move them out of the `manor` shell batch into their own exterior region (`exteriorGreenery.ts`
     builds them; `manor.ts` calls it). The region is drawn from outside, and from inside only while a window or
     doorway that can show that facade is in view.
   - **Front hedges:** replace "every room within 25 m" with the doorway rule on `door.front`, plus the front-facade
     windows that look at them.
   - Proof: pixel comparison along `win-north` / `win-west` / `win-south`, through the front door, and at the H/P/C
     poses above.
2. **Outdoors seen only through windows** (PORTAL-R02, expected the largest share of the remaining 240–457 k):
   - when the outdoors is visible only through windows, not through an open exterior door, draw the outdoor regions
     only within the windows' frusta, without the +32° doorway margin, and within a distance;
   - the tree batches already follow the window cones.
   - Proof: PORTAL-R02's own sightline tests plus a pixel comparison on the hall / dining / living / kitchen paths.
3. **Region ownership for the `main` batch** (≈ 46–58 k never culled; window sashes since WINDOW-FIX-R02) and a check
   of the `green.*` indoor plants (24–88 k).
4. **Release** together with PERF-R02 (already integrated with `2404d85`), with the matched P-vs-C harness tables of
   §12.1 as the acceptance gate: doors closed and partial within 750 k.

What would falsify this: a device measurement showing the Samsung sustains these counts at ≥ 30 FPS. PB01's ceiling
is provisional (device validation pending). The owner may then prefer to accept the current workload and merge
PERF-R02 as-is under a named, time-bounded exception.

### 12.9 Smallest safe next step

Approve **PERF-R03 step 1**:

- Give the EXT-R04 wall climbers and the VEG-R09 front hedges their own exterior regions, drawn from inside only
  through a doorway or window that can show them.
- Prove it pixel-identical from inside, along the garden window paths and through the front door.
- Re-run the §12.1 tables on P and C.

It is two region registrations and one chunk tag, and should remove ≈ 205–324 k from interior views. Step 2 (the
window rule) follows as a separate, measured decision.
