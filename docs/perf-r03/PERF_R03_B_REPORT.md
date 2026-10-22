# PERF-R03-B: Window-Constrained Outdoor Visibility

| Item | SHA / build |
|---|---|
| Branch | `perf-r03-b-window-outdoor-visibility` |
| P: production | **`1f9563b`** (LIGHT-R08 review route) · `main-BtgxDK-Y.js` |
| A: P + PERF-R02 + PERF-R03-A | **`7a1e18c`** (R03-A head `8c4928c` merged with `1f9563b`) · `main-CFH1mF9-.js` |
| B: A + PERF-R03-B | **`7c11caa`** source · `main-ClDpAs6w.js` |
| Final PERF-R03-B SHA | branch head (product source = `7c11caa`; later commits are evidence and docs only) |
| Merge / deploy | **not done**; awaiting owner review |

**Settings and method** (as for PERF-R02 and PERF-R03-A):
- **Renderer:** SwiftShader in headless Chromium, Mobile Low, 915 × 412, DPR 1, no shadows, opaque batching on.
- **Frame order:** camera → culling (0.12 s cadence) → world updaters → render, inside `Game.tick`.
  `World.updateCulling` is never called out of order.
- **Matching:** P, A and B are built from their own commits and measured with the same harness
  (`scripts/perf/visibility-harness.mjs`), paths, door sets and fixture save. The served bundle is recorded in every
  result file.
- **Modes:** Mode A is continuous movement at the game's cadence (30 FPS, plus 60 FPS); Mode B synchronizes culling
  per pose.

## 1. The problem

On A (PERF-R02 + PERF-R03-A), the remaining over-budget indoor views draw the outdoors **whole** as soon as PORTAL-R02
admits one clear window. In that case `'out'` joins the visible rooms, and every outdoor region is drawn regardless of
what the window can actually show:

- ground, paths, the estate wall and fence, garden, grounds, forest, `region:outdoor`, hills;
- the wicker man, the camp fire, the well and the cottage;
- the glass room and its glazing.

The woodland tree batch was already culled per instance, but by the window's **plan cone**: no height test, and a
generous width.

The diagnosis on A's worst poses (`docs/perf-r03/b/diag/A.json`) is shown below. "Glass only" means that no exterior
door was in view.

| Pose | Total | Outdoor submitted | Outdoor pixels |
|---|---:|---:|---:|
| hall, closed, max | 773,820 | ≈ 300 k | ≤ 36 k |
| hall, partial, max | 1,013,376 | ≈ 400 k | ≤ 36 k |
| up-west, partial, max | 1,047,626 | ≈ 475 k | ≤ 30 k |
| well, partial, max | 1,101,266 | ≈ 240 k | small |

The largest outdoor contributors were drawn whole even when not one of their pixels was visible:

| Contributor | Triangles drawn |
|---|---:|
| forest | 50–63 k |
| grounds | 43–63 k |
| `region:outdoor` | 31 k |
| glass room | 14–19 k |
| garden | 7–16 k |
| paths | 10–13 k |
| fence | 8 k |
| trees (by plan cone) | 20–245 k |

## 2. Design

### 2.1 The rule (`src/interactions/world.ts`, `src/world/estate.ts`, `src/world/boslustSample.ts`)

**Glass-only state.** This is the only state the rule changes. All of the following must hold:
- the eye is inside the house, and not in the glass room (`cons`);
- `'out'` is visible;
- at least one clear window qualifies (PORTAL-R02, unchanged);
- **no** exterior door or glass door is in view (`outdoorInView(eye, cam, 26)`, the existing door test).

In every other state, nothing changes. That covers outside, the Copacabana room, any open or partly open exterior door
in view, and no qualifying window at all. Doors therefore keep their established behaviour, including the open front
door.

**Wedge set.** In the glass-only state, the wedges are taken from every clear window that meets three conditions:
- it belongs to a room reachable through open portals (the PORTAL-R02 reachability, unchanged);
- it lies in the PORTAL-R02 view cone (half FOV + 32°) and within 40 m;
- **no** line-of-sight sampling is applied. PORTAL-R02's five sampled rays can miss a visible sliver of glass (§3.2).

A window whose opening runs along a reachable room's wall also counts, even when its own room is behind a closed door
(`World.besideReachable`, §3.3).

**Region meshes.** `World.windowConstrained(chunks)` is called once at build time for the 15 outdoor chunks listed
above. It records each mesh's world bounds. In the glass-only state, each mesh of those regions is drawn only while its
bounds lie inside one window's wedge (`World.apertureShows`, the PERF-R03-A test), with three margins:
- **Width:** the wedge through the opening's width at both faces of the wall (±0.15 m), widened by **1.0 m** on each
  side, measured in the window plane.
- **Height:** the rays through the sill and head, widened by **0.6 m**.
- **Distance:** **none**. A wood 105 m away straight out of the window is drawn (unit test).

A mesh hidden this way also sets `userData.regionOff`, which the vegetation batches already read, so their own
updaters stay consistent.

**Tree batch.** `TreeBatches.update` keeps its plan-cone test. In the glass-only state it additionally requires
`World.glassShows`: the same wedge test with the same margins, applied to the instance's bounds:
- in plan, a box of ±r around the trunk;
- in height, from r below the base to 2r above it.

The batch re-culls whenever the wedge set changes: `outdoorWindowsVersion` is bumped when the set of window keys
changes.

### 2.2 Why the margins cover the culling cadence and movement (no dwell-time dependence)

- **Eye-only wedges.** A wedge depends only on the eye position and the window, never on the view direction.
  **Turning** therefore cannot uncover a mesh the wedge excludes. The window set itself does depend on the view, and
  that dependence is the PORTAL-R02 cone (§6.3).
- **Walking.** A box is accepted when its projection onto the window plane reaches the opening widened by 1.0 m. When
  the eye moves by δ, a point beyond the window moves in that plane by **less than δ**, at any distance. Between two
  culls (0.12 s) the eye moves at most 0.38 m (3.2 m/s). The tree batch re-culls every 0.3 m. Both are well inside the
  1.0 m margin; the 0.6 m height margin covers crouching and the stair.
- **No dwell dependence.** The decision is recomputed on every cull from the current state alone; nothing accumulates
  over time. Mode A's same-frame proof (§4) checks this on continuous trajectories at 30 and 60 FPS.

### 2.3 What is deliberately not done

- **No distance cutoff through glass.**
- **No change** to doors, PERF-R02 doorway rules, PORTAL-R02 `'out'` admission, WINDOW-R02 glazing, the lighting, the
  Copacabana room, vegetation geometry, LOD, materials or gameplay.
- **R03-A ownership is untouched.** The climbers and the hedges are not window-constrained regions; their own R03-A
  aperture test is unchanged (§7).

## 3. Candidate revisions forced by the visual proof

Every failure found by the same-frame proof was fixed at its cause. None was hidden by a threshold.

| # | Finding (tool, pose) | Cause | Fix |
|---|---|---|---|
| 3.1 | All trees culled from glass-only views where the batch box straddles the window plane (unit diagnosis) | `apertureShows` took a box's nearest depth from the corners **in front of** the opening only. A box reaching behind the wall plane was given a too-distant depth, so the height rays missed it | A box straddling the plane is tested from the glass outward (`u0 = 0.02`). PERF-R03-A test added; it fails without the fix |
| 3.2 | Hall, closed, Mode B, k22–24: 7 px of trees lost through the rear-nook upper north window, seen through a gap in the gallery balustrade | That window failed PORTAL-R02's five-ray line-of-sight sampling, so it was not in the wedge set, although a sliver of it is visible | The wedge set skips line-of-sight sampling (`clearWindowInView(…, los = false)`). It keeps reachability and the cone |
| 3.3 | Upper rooms, closed, Mode B, k100–116: **up to 1,068 px** of trees lost in the study | The botanic room's west window (x 101.0–102.0) reaches 0.3 m past the study / botanic partition (x 101.3). The study sees it through the corner, but the botanic room is behind a closed door, so it is unreachable | `World.besideReachable`: a window whose opening runs along a reachable room's wall counts for the wedges. The estate has one such window; the library mezzanine windows also qualify, harmlessly. Unit test; it fails without the fix |

After 3.3 the wedge set can only grow. The candidate therefore draws a **superset** of the earlier candidate's
(`1922eba`) outdoor set. That earlier candidate's closed-door Mode B proof bounds the final rule's loss on the runs not
repeated (§4).

## 4. Visual proof (same frame, matched pixels)

### 4.1 Tool

`scripts/perf/window-lossless.mjs` runs as follows:
- **Every frame** of a run is checked: Mode B poses with culling synchronized, and Mode A continuous trajectories at
  the game's cadence.
- **Frames in the glass-only state** are rendered twice in the same frame, using zero-length ticks so that time does
  not advance:
  - the **reference**, which is the current production rule (every mesh drawn while its region is, trees by plan cone
    only);
  - the **candidate**.
- **Rendering order:** the reference is rendered first, then the candidate after restoring the rule's state. Both
  images go through the same hide/show cycle of the batched instances.
- **Comparison:** any channel differing by more than 6 counts as a changed pixel.
- **Attribution:** each changed frame is attributed to two parts by two partial references, "meshes" and "trees".
- **Crops:** the largest crops are saved.

`scripts/perf/classify-window-diffs.mjs` re-runs a changed frame and ray-casts every changed pixel (five rays per
pixel) against the objects the rule culled:
- **VISIBLE:** a culled object is the first surface, with only glass in front of it.
- **bleed-through:** every ray reaching a culled object first passes opaque geometry, so a seam in the house shows the
  outdoors.
- **edge / ordering:** no culled object lies along the pixel at all.

### 4.2 Coverage

| Category | What was covered |
|---|---|
| Mode B | every indoor and outdoor path (hall, stair, well, up-west, up-east, library, gallery, attic, ground-front, kitchen, upper-rooms, entrance; win-north, win-west, win-south, front-approach), doors **closed, partial and open** |
| Mode A, 30 FPS | hall, stair, well, up-west, library, ground-front, kitchen, gallery and upper-rooms with doors closed; hall, well, library and ground-front with doors partial |
| Fast turns | 60 FPS at 6.28 rad/s |
| Dusk | dusk 0.85 |

These paths cover the window views the brief lists:
- living, dining and kitchen windows (ground-front, kitchen, entrance);
- study and botanic, Reis and Sterren (upper-rooms, up-west, up-east);
- library and gallery;
- the hall seen through other rooms;
- the open front door (doors open, hall, entrance and front-approach), including partial doors;
- the conservatory approach and long garden sightlines (win-south, front-approach);
- outdoor-to-indoor views (win-north, win-west, win-south, front-approach: never in the glass-only state, so nothing
  is constrained);
- near-edge, diagonal and grazing views (the paths' turn samples and the study corner of §3.3).

PROOF_TABLE

### 4.3 Classification of every changed pixel

PROOF_CLASSIFICATION

## 5. Measurements: P, A, B

Mobile Low, 915 × 412, DPR 1, no shadows. Mode B uses culling synchronized per pose; Mode A runs continuously at 30
FPS, with 60 FPS where noted. The full table, including median and p99, is `docs/perf-r03/b/matched-table.md`; the raw
data is `docs/perf-r03/b/measure-{P,A,B}.json`.

HEADLINE_TABLE

### 5.1 Outdoor contribution saved

The window proof measures, in the same frame, the triangles the rule removes, over all glass-only frames:

| Doors | Average triangles saved per glass-only frame |
|---|---:|
| closed | 54–125 k |
| partial | 33–65 k |
| open (glass-only frames only) | 9–93 k |

The best single frames save **184–230 k**. B equals A whenever an exterior door is in view; that is the rule (hall
open, well open, stair open).

### 5.2 Draw calls and batches

- **Fewer draw calls.** B removes whole outdoor meshes and therefore whole draw calls. The maximum calls per run drop
  by 10–30 with doors closed:
  - hall 156 → 142;
  - library 199 → 173;
  - up-west 170 → 146.
- **Frames over 150 calls (closed doors):** they fall to **0** on hall, stair, well, up-west, up-east, gallery and
  entrance, and to 2–3 on library, kitchen and upper-rooms.
- **No batches or materials changed.** The tree batch draws fewer instances within the same multi-draw call.

### 5.3 CPU

`scripts/perf/cull-cpu.mjs` ran 114 poses on 5 paths (hall, well, up-west, library, ground-front), with doors closed,
5 rounds and 40 repetitions per pose. Builds alternated in each round:

| Build | `updateCulling` median / p95 (ms) | Cull + updaters, tree re-cull forced, median / p95 (ms) |
|---|---|---|
| A | 0.543 / 2.635 | 0.647 / 2.790 |
| B | 0.588 / 1.845 | 0.690 / 1.822 |

That is **+0.045 ms median**, inside the noise at p95, and it runs only at the 0.12 s culling cadence. The harness's
`cullMs` columns in the matched table were recorded while 4–5 headless browsers shared 4 cores, so their maxima are
contention, not the rule.

## 6. Remaining over-budget frames (B)

Under 750 k is **reached** with doors closed on hall, well, up-west and up-east (Mode A and Mode B, including 60 FPS),
and on entrance. Stair keeps 2 of 108 frames over. In closed and partial gameplay across all measured runs, frames over
750 k fall from **5,769** (P) to **1,589** (A) to **1,022** (B), out of 9,591 frames.

The remaining outliers are attributed per pose (`docs/perf-r03/b/diag/B-final.json`; the visible pixels come from the
diagnostic hide test):

| Pose (B, worst frame) | Total | Leading contributors (triangles / visible px) |
|---|---:|---|
| library, closed | 954 k | **climbers 236 k / 2 px**, library room 104 k / 98 k px, wing 72 k / 0 px, manor 68 k, forest 63 k / 0 px |
| kitchen, closed | 907 k | **climbers 236 k / 0 px**, trees 116 k / 221 px, wing 72 k, manor 68 k, forest 54 k / 0 px, grounds 49 k / 0 px |
| gallery, closed | 941 k | **climbers 236 k / 0 px**, library room 102 k, trees 97 k / 5.9 k px, wing 68 k / 0 px, manor 68 k |
| ground-front, closed | 869 k | **climbers 236 k / 0 px**, trees 93 k / 178 px, wing 72 k, grounds 60 k / 25 px, forest 52 k / 0 px |
| upper-rooms, closed | 965 k | **climbers 236 k / 0 px**, trees 115 k / 2.3 k px, library room 102 k, wing 68 k / 0 px, forest 55 k / 0 px |
| stair, closed | 827 k | **climbers 236 k / 0 px**, trees 163 k / 737 px, wing 72 k, forest 52 k / 0 px |
| hall, partial | 967 k | **climbers 236 k / 0 px**, library room 113 k / 0 px, manor 68 k, wing 65 k / 1 px, grounds 62 k / 0 px |
| up-west, partial | 1,031 k | **climbers 236 k / 2 px**, library room 113 k / 0 px, trees 81 k / 1.7 k px, wing 65 k / 0 px, grounds 62 k / 0 px |

Three causes remain, none of which PERF-R03-B can address within its scope:

1. **The R03-A wall-climber mesh (236 k triangles, 1 draw call).** It is drawn whole whenever any one of its six sites
   lies in the wedge of a window or door in view, and in these frames it shows 0–2 px. It is the single largest item
   in every remaining outlier. Splitting it per facade (west and north; or per site), with the same art, would remove
   most of it. This changes R03-A ownership, which this brief protects, so it is left for an owner decision
   (recommended as **PERF-R03-C**).
2. **Coarse outdoor meshes.** Forest and grounds are a few large merged meshes. Their bounds reach the wedge even when
   none of their triangles are seen, as in the forest at 52–63 k / 0 px. Splitting them into tiles would let the
   wedge cull them.
3. **Interior content and open interior doors** (library room ≈ 100–113 k, the service wing, and partial doors that
   open more rooms). This belongs to PERF-R02's doorway rules and the room art, not to the outdoors.

### 6.1 Partial and open doors

With doors partial or open, any exterior door in view leaves the frame in the previous rule by design. The savings
come from the frames where only glass shows the outdoors (§5.1). The hall and well with doors open are unchanged
(B = A).

### 6.2 PB01

**No PB01 change.** The budget constants and checks are untouched; this work only changes what is drawn.

### 6.3 Inherited limitation (not introduced here)

The window **set** comes from PORTAL-R02's cone: half FOV + 32°, re-evaluated every 0.12 s. A turn faster than about
4.6 rad/s (for example the 6.28 rad/s fast-turn test) can bring a window into view between two culls. Until the next
cull, production then draws **no** outdoors behind that window at all: it is not yet in `'out'`. B inherits exactly
that behaviour and adds nothing to it. The proof compares against the production rule in the same frame, so it does
not count this.

## 7. Protections

GATES_SECTION

## 8. Tests

TESTS_SECTION

## 9. Recommendation

RECOMMENDATION
