# PERF-R02: Frame-accurate visibility and culling

| Item | State |
|---|---|
| Branch | `perf-r02-frame-accurate-culling` |
| Production baseline | **`436e106d40443b8e105dce5d4d3722b46fc4be11`** (D3-b2 + D3-b2R closeout; build `index-B2a-hSQD.js`) |
| Checkpoint A (measurement) | harness `0bcc75d` … `9de478b`, `055dfca`; baseline evidence and §1–§5 of this report |
| Checkpoint B (culling) | `7f51e0f` (`mUpE`), `f7ee08a` (`mLib`); `mAttic` `e4684ca` reverted in `31c2971` (§6) |
| Final feature SHA | **`92bf875fac12de30faa71c3b9e56756b91ec8d20`** (source identical to the measured candidate `88382b3`: only tests, tooling and docs changed after it) |
| Merge / deploy | **not done**; owner review required |

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
