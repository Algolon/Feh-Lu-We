# PERF-R02: Frame-accurate visibility and culling

| Item | State |
|---|---|
| Branch | `perf-r02-frame-accurate-culling` |
| Production baseline | **`436e106d40443b8e105dce5d4d3722b46fc4be11`** (D3-b2 + D3-b2R closeout; build `index-B2a-hSQD.js`) |
| Checkpoint A (measurement) | harness `0bcc75d` … `9de478b`, `055dfca`; baseline evidence and §1–§5 of this report |
| Checkpoint B (culling) | see §6 |
| Final feature SHA | see §9 |
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
5. Culling corrections (§6): the doorway rule extended to **`mUpE`** and **`mLib`**. **`mAttic` was rejected**: its
   geometry includes the ceilings seen from the floor below, and the rule removed them (up to 87,016 px).

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

*(filled in from the PERF-R02-B evidence)*

## 7. Visual safety

*(filled in from the PERF-R02-B evidence)*

## 8. Limits

Software rendering only: no Samsung or GPU timing. The ~30 FPS target remains device validation pending (PB01).
Render wall times in the evidence include SwiftShader rasterization and are only relative.

## 9. Regression and handover

*(PERF-R02-C)*

## 10. Interface constraints and recommendations

*(PERF-R02-C)*
