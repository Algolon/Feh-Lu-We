# PERF-R03-B: Window-Constrained Outdoor Visibility

| Item | SHA / build |
|---|---|
| Branch | `perf-r03-b-window-outdoor-visibility` |
| P: production | **`1f9563b`** (LIGHT-R08 review route) · `main-BtgxDK-Y.js` |
| A: P + PERF-R02 + PERF-R03-A | **`7a1e18c`** (R03-A head `8c4928c` merged with `1f9563b`) · `main-CFH1mF9-.js` |
| B: A + PERF-R03-B | **`6655a26`** source · `main-CjcLVS9j.js` (earlier candidates `1922eba`, `7c11caa`: §3) |
| Final PERF-R03-B SHA | branch head (product source = `6655a26`; later commits are evidence and docs only) |
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
- it lies in the view cone and within 40 m. The cone is half FOV + 77°: PORTAL-R02's 32° plus a 45° turn allowance;
- **no** line-of-sight sampling is applied. PORTAL-R02's five sampled rays can miss a visible sliver of glass (§3.2).

A window whose opening runs along a reachable room's wall also counts, even when its own room is behind a closed door
(`World.besideReachable`, §3.3). Every open or glass exterior doorway in line of sight within 60 m is also a wedge,
whatever the view direction. These are the same doorways production's tree cones (`outdoorWindows`) take. Together
with the turn allowance, this covers turns between culls (§3.4).

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
- **Turning.** The window **set** depends on the view. Its cone is half FOV + 77°, and a turn of 6.3 rad/s sweeps 43°
  between two culls. Exterior doorways count in every direction. A window or doorway turned into view before the next
  cull is therefore already in the set (§3.4).
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
| 3.4 | Fast turns (60 FPS, 6.28 rad/s), on `7c11caa`: library k759 lost **640 px** of trees and ground-front k207 lost 205 px, at the screen edge | Production's tree cones take every open doorway in line of sight in **any** direction, and production draws the outdoor regions whole. A doorway or window turned into view before the next cull therefore showed scenery in production. The wedge set took only PORTAL-R02's cone (half FOV + 32° covers 4.6 rad/s) and doorways in view | The wedge set's window cone gets a 45° turn allowance, and it takes every open or glass doorway in line of sight within 60 m in any direction. On rerun: library max 37 px (seams, unattributed), ground-front 11 px, upper-rooms 20 px; nothing attributable over 3 px |

Each revision (3.2, 3.3, 3.4) only **adds** windows or doorways to the wedge set; nothing else in the rule changed. The
final rule therefore draws a **superset** of every earlier candidate's outdoor set in every frame, against the same
reference. A run proven on an earlier candidate (`1922eba`, `7c11caa`) bounds the final rule's loss on that run. The
runs that found a loss were repeated on the final build (§4).

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
| Fast turns | 60 FPS at 6.28 rad/s, doors closed: hall, library, ground-front, upper-rooms |
| Dusk | dusk 0.85, Mode B, doors closed: hall, library, ground-front, upper-rooms |
| Final-build repeats | Mode B, doors closed and partial: hall, library, upper-rooms |

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

`build` names the candidate a run was proven on. Every later revision only grows the drawn set (§3), so an earlier
run bounds the final rule's loss. Runs that found a loss were repeated on the final build `6655a26`. The data is in
`docs/perf-r03/b/proof/window-lossless*.json`.

| variant | mode | doors | path | frames | glass-only frames | avg saved tris | max saved tris | diff frames | max px | build |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| day | A@30 | closed | gallery | 576 | 420 | 104,426 | 204,010 | 13 | 4 | 7c11caa |
| day | A@30 | closed | ground-front | 603 | 456 | 56,444 | 160,862 | 13 | 8 | 7c11caa |
| day | A@30 | closed | hall | 289 | 96 | 124,820 | 163,070 | 8 | 2 | 7c11caa |
| day | A@30 | closed | kitchen | 330 | 106 | 59,052 | 88,844 | 1 | 1 | 7c11caa |
| day | A@30 | closed | library | 534 | 496 | 99,574 | 189,846 | 18 | 37 | 7c11caa |
| day | A@30 | closed | stair | 459 | 224 | 70,723 | 141,872 | 11 | 10 | 7c11caa |
| day | A@30 | closed | up-west | 1350 | 602 | 109,558 | 183,774 | 24 | 12 | 7c11caa |
| day | A@30 | closed | upper-rooms | 948 | 564 | 83,511 | 203,014 | 19 | 25 | 7c11caa |
| day | A@30 | closed | well | 425 | 240 | 91,632 | 156,158 | 12 | 2 | 7c11caa |
| day | A@30 | partial | ground-front | 603 | 472 | 44,124 | 99,170 | 11 | 6 | 7c11caa |
| day | A@30 | partial | hall | 289 | 173 | 82,550 | 123,930 | 8 | 2 | 7c11caa |
| day | A@30 | partial | library | 534 | 514 | 32,409 | 105,988 | 5 | 9 | 7c11caa |
| day | A@30 | partial | well | 425 | 284 | 58,393 | 126,434 | 12 | 2 | 7c11caa |
| day | B | closed | attic | 209 | 9 | 93,554 | 136,886 | 1 | 1 | 1922eba |
| day | B | closed | entrance | 67 | 44 | 84,656 | 154,788 | 1 | 1 | 1922eba |
| day | B | closed | front-approach | 226 | 0 | 0 | 0 | 0 | 0 | 1922eba |
| day | B | closed | gallery | 175 | 128 | 101,398 | 209,336 | 7 | 3 | 1922eba |
| day | B | closed | ground-front | 167 | 132 | 54,916 | 154,354 | 2 | 1 | 1922eba |
| day | B | closed | hall | 109 | 54 | 58,954 | 93,302 | 1 | 1 | 6655a26 |
| day | B | closed | kitchen | 85 | 24 | 53,492 | 68,324 | 2 | 3 | 1922eba |
| day | B | closed | library | 149 | 136 | 82,486 | 203,410 | 9 | 15 | 6655a26 |
| day | B | closed | stair | 164 | 79 | 73,069 | 148,880 | 3 | 1 | 1922eba |
| day | B | closed | up-east | 320 | 40 | 128,038 | 186,588 | 2 | 1 | 1922eba |
| day | B | closed | up-west | 419 | 197 | 111,388 | 230,530 | 7 | 2 | 1922eba |
| day | B | closed | upper-rooms | 255 | 154 | 77,002 | 184,356 | 4 | 16 | 6655a26 |
| day | B | closed | well | 96 | 66 | 69,406 | 156,124 | 3 | 1 | 1922eba |
| day | B | closed | win-north | 165 | 0 | 0 | 0 | 0 | 0 | 1922eba |
| day | B | closed | win-south | 178 | 10 | 64,783 | 104,242 | 0 | 0 | 1922eba |
| day | B | closed | win-west | 84 | 0 | 0 | 0 | 0 | 0 | 1922eba |
| day | B | partial | attic | 209 | 12 | 53,797 | 91,166 | 0 | 0 | 7c11caa |
| day | B | partial | entrance | 67 | 50 | 58,804 | 123,166 | 1 | 1 | 7c11caa |
| day | B | partial | front-approach | 226 | 0 | 0 | 0 | 0 | 0 | 7c11caa |
| day | B | partial | gallery | 175 | 168 | 36,357 | 98,212 | 5 | 2 | 7c11caa |
| day | B | partial | ground-front | 167 | 134 | 42,337 | 116,014 | 2 | 1 | 7c11caa |
| day | B | partial | hall | 109 | 80 | 33,295 | 62,066 | 2 | 1 | 6655a26 |
| day | B | partial | kitchen | 85 | 24 | 37,674 | 68,324 | 1 | 3 | 7c11caa |
| day | B | partial | library | 149 | 143 | 27,480 | 62,622 | 2 | 1 | 6655a26 |
| day | B | partial | stair | 164 | 117 | 51,483 | 116,640 | 1 | 1 | 7c11caa |
| day | B | partial | up-east | 320 | 81 | 46,286 | 101,380 | 2 | 1 | 7c11caa |
| day | B | partial | up-west | 419 | 285 | 49,877 | 142,686 | 3 | 1 | 7c11caa |
| day | B | partial | upper-rooms | 255 | 167 | 46,224 | 141,454 | 1 | 1 | 6655a26 |
| day | B | partial | well | 96 | 77 | 44,425 | 120,962 | 2 | 1 | 7c11caa |
| day | B | partial | win-north | 165 | 0 | 0 | 0 | 0 | 0 | 7c11caa |
| day | B | partial | win-south | 178 | 10 | 64,783 | 104,242 | 0 | 0 | 7c11caa |
| day | B | partial | win-west | 84 | 0 | 0 | 0 | 0 | 0 | 7c11caa |
| day | B | open | attic | 209 | 40 | 92,711 | 170,834 | 2 | 1 | 7c11caa |
| day | B | open | entrance | 67 | 21 | 9,663 | 80,948 | 0 | 0 | 7c11caa |
| day | B | open | front-approach | 226 | 0 | 0 | 0 | 0 | 0 | 7c11caa |
| day | B | open | gallery | 175 | 141 | 33,007 | 91,846 | 5 | 2 | 7c11caa |
| day | B | open | ground-front | 167 | 100 | 34,972 | 103,896 | 0 | 0 | 7c11caa |
| day | B | open | hall | 109 | 51 | 18,343 | 67,460 | 0 | 0 | 7c11caa |
| day | B | open | kitchen | 85 | 24 | 28,858 | 58,386 | 0 | 0 | 7c11caa |
| day | B | open | library | 149 | 143 | 31,273 | 99,986 | 2 | 1 | 7c11caa |
| day | B | open | stair | 164 | 84 | 18,708 | 92,840 | 0 | 0 | 7c11caa |
| day | B | open | up-east | 320 | 76 | 46,308 | 101,590 | 2 | 1 | 7c11caa |
| day | B | open | up-west | 419 | 254 | 52,075 | 142,686 | 2 | 1 | 7c11caa |
| day | B | open | upper-rooms | 255 | 161 | 41,499 | 146,790 | 0 | 0 | 7c11caa |
| day | B | open | well | 96 | 31 | 15,295 | 65,642 | 0 | 0 | 7c11caa |
| day | B | open | win-north | 165 | 0 | 0 | 0 | 0 | 0 | 7c11caa |
| day | B | open | win-south | 178 | 4 | 87,910 | 92,860 | 0 | 0 | 7c11caa |
| day | B | open | win-west | 84 | 0 | 0 | 0 | 0 | 0 | 7c11caa |
| 60fps-turn6.3 | A@60 | closed | ground-front | 938 | 728 | 50,527 | 92,184 | 22 | 11 | 6655a26 |
| 60fps-turn6.3 | A@60 | closed | hall | 459 | 184 | 74,202 | 93,302 | 12 | 1 | 6655a26 |
| 60fps-turn6.3 | A@60 | closed | library | 801 | 744 | 81,125 | 193,258 | 26 | 37 | 6655a26 |
| 60fps-turn6.3 | A@60 | closed | upper-rooms | 1617 | 921 | 75,541 | 173,344 | 29 | 20 | 6655a26 |
| dusk | B | closed | ground-front | 167 | 132 | 48,318 | 92,184 | 1 | 1 | 6655a26 |
| dusk | B | closed | hall | 109 | 54 | 58,954 | 93,302 | 1 | 1 | 6655a26 |
| dusk | B | closed | library | 149 | 136 | 82,486 | 203,410 | 9 | 15 | 6655a26 |
| dusk | B | closed | upper-rooms | 255 | 154 | 77,004 | 184,356 | 5 | 16 | 6655a26 |

runs 69, frames 20,464, glass-only frames 11,251, frames with any changed pixel 337 (864 px in total, max 37 px in one frame)

Crops of the findings are in `docs/perf-r03/b/crops/`. Each image shows the reference on top and the candidate below:
- `study-loss-1922eba.jpg`: §3.3, trees through the botanic window, lost before the fix;
- `library-seam-bleed.jpg`: a bleed-through frame, zoomed, with the changed pixels;
- `upper-rooms-ordering.jpg`: an ordering frame, zoomed, with the changed pixels.

### 4.3 Classification of every changed pixel

After the §3 revisions, **no frame loses visible outdoor content**:

- **Size:** every remaining changed frame is 1–37 px, nearly all 1–3 px.
- **Attribution:** on the final build, 93 of 124 changed frames are unattributed: forcing either culled part back on
  alone reproduces the candidate exactly. The other 31 are attributed to the trees, at most 3 px each.

The ray-cast classifier (`scripts/perf/classify-window-diffs.mjs`) and visual inspection of the crops sort them into
two kinds:

| Kind | Where | What it is |
|---|---|---|
| **bleed-through** | library plaster wall (15–37 px, thin lines at the screen's left edge), library mezzanine, gallery, frontGallery, bath | Culled outdoor geometry, often a tree 78 m away, showing through seams in opaque walls. The reference shows grey and green specks on the plaster; the candidate shows a clean wall. The candidate is the better image. This is the class PERF-R03-A accepted |
| **edge / ordering** | screen edges (x 0–2 or 909–914), single pixels; the frames with no attribution | No culled object lies along the pixel, or the difference appears only when both culled parts are drawn together: the batched instances and transparent glass are drawn in a different order. It is not culled content |

The ray-cast found one "VISIBLE" pixel (library k45, the boundary wall 99 m away) on a corner ray. That frame's
attribution shows that forcing the culled meshes back on does not change the pixel, so it is a sub-pixel ray / raster
disagreement.

**Delayed appearance and dwell time.** Mode A runs on continuous trajectories at the game's cadence (30 FPS, plus
60 FPS fast turns). It compares every frame against the production rule in that same frame, so a late pop-in would
show up as a changed frame. Apart from §3.4, which is fixed, none is attributable.

## 5. Measurements: P, A, B

Mobile Low, 915 × 412, DPR 1, no shadows. Mode B uses culling synchronized per pose; Mode A runs continuously at 30
FPS, with 60 FPS where noted. The full table, including median and p99, is `docs/perf-r03/b/matched-table.md`; the raw
data is `docs/perf-r03/b/measure-{P,A,B}.json`.

| doors | path | mode | p95 P → A → B | max P → A → B | frames > 750 k P / A / B | max calls P / A / B | frames > 150 calls P / A / B |
|---|---|---|---|---|---|---|---|
| closed | entrance | B@30 | 909k → 664k → **581k** | 926k → 673k → **630k** | 28 / 0 / **0** (of 43) | 158 / 157 / **138** | 10 / 8 / **0** |
| closed | gallery | B@30 | 1042k → 926k → **877k** | 1077k → 1018k → **948k** | 88 / 44 / **41** (of 127) | 178 / 178 / **149** | 23 / 17 / **0** |
| closed | ground-front | B@30 | 1088k → 855k → **855k** | 1145k → 869k → **869k** | 122 / 28 / **23** (of 127) | 193 / 192 / **192** | 39 / 29 / **19** |
| closed | hall | A@30 | 875k → 614k → **588k** | 909k → 625k → **611k** | 108 / 0 / **0** (of 289) | 154 / 152 / **142** | 6 / 5 / **0** |
| closed | hall | A@60 | 875k → 613k → **589k** | 909k → 627k → **610k** | 216 / 0 / **0** (of 575) | 155 / 153 / **142** | 12 / 9 / **0** |
| closed | hall | B@30 | 922k → 623k → **598k** | 1130k → 776k → **736k** | 39 / 1 / **0** (of 77) | 158 / 156 / **142** | 1 / 1 / **0** |
| closed | kitchen | B@30 | 1001k → 846k → **846k** | 1035k → 907k → **907k** | 57 / 50 / **46** (of 61) | 171 / 169 / **164** | 7 / 7 / **3** |
| closed | library | B@30 | 1051k → 956k → **903k** | 1109k → 1030k → **967k** | 100 / 81 / **75** (of 109) | 200 / 199 / **172** | 31 / 30 / **2** |
| closed | stair | B@30 | 909k → 606k → **582k** | 960k → 850k → **827k** | 50 / 2 / **2** (of 108) | 159 / 157 / **139** | 11 / 7 / **0** |
| closed | up-east | B@30 | 778k → 754k → **643k** | 840k → 799k → **678k** | 19 / 12 / **0** (of 216) | 152 / 150 / **131** | 1 / 0 / **0** |
| closed | up-west | A@30 | 1047k → 711k → **632k** | 1162k → 807k → **747k** | 507 / 46 / **0** (of 1350) | 179 / 176 / **146** | 99 / 92 / **0** |
| closed | up-west | B@30 | 1067k → 712k → **651k** | 1151k → 797k → **723k** | 129 / 12 / **0** (of 291) | 173 / 170 / **147** | 21 / 21 / **0** |
| closed | upper-rooms | B@30 | 1003k → 911k → **855k** | 1115k → 1035k → **973k** | 119 / 41 / **37** (of 215) | 189 / 187 / **166** | 9 / 8 / **3** |
| closed | well | A@30 | 983k → 681k → **657k** | 1116k → 761k → **744k** | 234 / 1 / **0** (of 425) | 163 / 160 / **142** | 12 / 8 / **0** |
| closed | well | A@60 | 986k → 681k → **657k** | 1116k → 761k → **744k** | 468 / 3 / **0** (of 848) | 163 / 160 / **142** | 25 / 18 / **0** |
| closed | well | B@30 | 977k → 670k → **648k** | 1110k → 755k → **732k** | 41 / 1 / **0** (of 64) | 158 / 156 / **142** | 4 / 2 / **0** |
| partial | gallery | B@30 | 1178k → 976k → **970k** | 1283k → 1118k → **1080k** | 124 / 88 / **80** (of 127) | 193 / 193 / **184** | 62 / 54 / **31** |
| partial | ground-front | B@30 | 1141k → 979k → **955k** | 1223k → 1022k → **1006k** | 125 / 55 / **50** (of 127) | 211 / 200 / **199** | 66 / 58 / **47** |
| partial | hall | A@30 | 1143k → 993k → **975k** | 1178k → 1008k → **995k** | 190 / 103 / **85** (of 289) | 204 / 194 / **189** | 126 / 115 / **109** |
| partial | hall | A@60 | 1142k → 993k → **973k** | 1177k → 1009k → **996k** | 388 / 211 / **177** (of 575) | 205 / 195 / **189** | 248 / 230 / **218** |
| partial | hall | B@30 | 1151k → 987k → **971k** | 1320k → 1013k → **993k** | 59 / 30 / **24** (of 77) | 204 / 194 / **189** | 38 / 33 / **29** |
| partial | kitchen | B@30 | 1117k → 888k → **888k** | 1134k → 954k → **929k** | 58 / 51 / **51** (of 61) | 195 / 184 / **179** | 12 / 11 / **9** |
| partial | library | B@30 | 1149k → 987k → **970k** | 1174k → 1079k → **1069k** | 107 / 97 / **93** (of 109) | 216 / 216 / **208** | 44 / 43 / **36** |
| partial | stair | B@30 | 1188k → 925k → **892k** | 1293k → 1094k → **1065k** | 87 / 25 / **20** (of 108) | 212 / 202 / **185** | 45 / 39 / **24** |
| partial | up-west | A@30 | 1110k → 778k → **747k** | 1219k → 1053k → **1029k** | 992 / 110 / **64** (of 1350) | 197 / 197 / **183** | 260 / 212 / **144** |
| partial | up-west | B@30 | 1116k → 781k → **746k** | 1176k → 1048k → **1032k** | 216 / 25 / **14** (of 291) | 190 / 190 / **178** | 52 / 44 / **33** |
| partial | upper-rooms | B@30 | 1093k → 956k → **930k** | 1182k → 1123k → **1096k** | 169 / 59 / **47** (of 215) | 194 / 194 / **184** | 32 / 25 / **18** |
| partial | well | A@30 | 1189k → 896k → **857k** | 1325k → 1124k → **1108k** | 292 / 131 / **108** (of 425) | 209 / 199 / **189** | 226 / 190 / **158** |
| partial | well | A@60 | 1185k → 889k → **857k** | 1325k → 1124k → **1108k** | 585 / 261 / **217** (of 848) | 209 / 199 / **189** | 452 / 385 / **318** |
| partial | well | B@30 | 1177k → 920k → **882k** | 1266k → 1103k → **1088k** | 52 / 21 / **16** (of 64) | 204 / 194 / **189** | 40 / 32 / **26** |
| open | gallery | B@30 | 1221k → 1035k → **1021k** | 1357k → 1159k → **1117k** | 126 / 103 / **99** (of 127) | 204 / 203 / **194** | 75 / 74 / **67** |
| open | ground-front | B@30 | 1209k → 1060k → **1038k** | 1296k → 1074k → **1059k** | 125 / 80 / **72** (of 127) | 230 / 219 / **219** | 92 / 79 / **69** |
| open | hall | A@30 | 1237k → 1138k → **1138k** | 1271k → 1159k → **1159k** | 289 / 205 / **202** (of 289) | 228 / 227 / **227** | 218 / 217 / **208** |
| open | hall | B@30 | 1245k → 1138k → **1138k** | 1386k → 1159k → **1159k** | 77 / 59 / **59** (of 77) | 228 / 220 / **220** | 64 / 63 / **62** |
| open | kitchen | B@30 | 1157k → 894k → **894k** | 1172k → 996k → **970k** | 58 / 53 / **52** (of 61) | 218 / 207 / **207** | 20 / 17 / **17** |
| open | library | B@30 | 1193k → 1016k → **1007k** | 1216k → 1128k → **1119k** | 107 / 101 / **100** (of 109) | 233 / 233 / **225** | 47 / 47 / **44** |
| open | stair | B@30 | 1268k → 1037k → **1037k** | 1355k → 1172k → **1172k** | 107 / 75 / **74** (of 108) | 237 / 229 / **229** | 93 / 84 / **79** |
| open | up-west | A@30 | 1178k → 830k → **805k** | 1333k → 1115k → **1096k** | 1054 / 154 / **126** (of 1350) | 217 / 217 / **204** | 343 / 306 / **264** |
| open | up-west | B@30 | 1177k → 830k → **805k** | 1289k → 1110k → **1088k** | 225 / 32 / **26** (of 291) | 209 / 209 / **198** | 67 / 59 / **54** |
| open | upper-rooms | B@30 | 1171k → 1000k → **979k** | 1323k → 1160k → **1133k** | 181 / 78 / **69** (of 215) | 231 / 223 / **206** | 56 / 48 / **42** |
| open | well | A@30 | 1271k → 1159k → **1159k** | 1417k → 1180k → **1180k** | 425 / 243 / **243** (of 425) | 235 / 227 / **227** | 386 / 291 / **291** |
| open | well | B@30 | 1271k → 1128k → **1128k** | 1361k → 1189k → **1189k** | 64 / 40 / **40** (of 64) | 228 / 220 / **220** | 55 / 48 / **48** |

Closed + partial: frames over 750 k: P 5769 / A 1589 / B 1270 of 9591

### 5.1 Outdoor contribution saved

The window proof measures, in the same frame, the triangles the rule removes, over all glass-only frames:

| Run (final build `6655a26`) | Average triangles saved per glass-only frame | Best single frame |
|---|---:|---:|
| doors closed, Mode B: hall / library / upper-rooms | 59 k / 82 k / 77 k | 93 k / 203 k / 184 k |
| doors partial, Mode B: hall / library / upper-rooms | 33 k / 27 k / 46 k | 62 k / 63 k / 141 k |
| fast turns, 60 FPS: hall / library / ground-front / upper-rooms | 74 k / 81 k / 51 k / 76 k | 93 k / 193 k / 92 k / 173 k |

The candidates without the turn allowance (`7c11caa`, §3.4) saved more: hall closed 92 k on average, 125 k in Mode A.
That margin is the price of not losing scenery on fast turns. B equals A whenever an exterior door is in view; that is the rule (hall
open, well open, stair open).

### 5.2 Draw calls and batches

- **Fewer draw calls.** B removes whole outdoor meshes and therefore whole draw calls. The maximum calls per run drop
  by 10–30 with doors closed:
  - hall 156 → 142;
  - library 199 → 172;
  - up-west 170 → 147.
- **Frames over 150 calls (closed doors):** they fall to **0** on hall, stair, well, up-west, up-east, gallery and
  entrance, to 2–3 on library, kitchen and upper-rooms, and from 29 to 19 on ground-front.
- **No batches or materials changed.** The tree batch draws fewer instances within the same multi-draw call.

### 5.3 CPU

`scripts/perf/cull-cpu.mjs` ran on the final build on a quiet machine (load 0.1): 114 poses on 5 paths (hall, well,
up-west, library, ground-front), doors closed, 5 rounds and 40 repetitions per pose. Builds alternated in each round
(`docs/perf-r03/b/cull-cpu.txt`):

| Build | `updateCulling` median / p95 / max (ms) | Cull + updaters, tree re-cull forced, median / p95 (ms) |
|---|---|---|
| A | 0.345 / 1.055 / 2.98 | 0.435 / 1.208 |
| B | 0.560 / 1.475 / 3.99 | 0.670 / 1.665 |

That is **+0.22 ms median and +0.42 ms p95 per cull**. A cull runs every 0.12 s, which is about 0.03 ms per frame at
60 FPS. The cost comes from the per-mesh wedge tests, the extra window and doorway candidates, and re-culling the tree
batch when the wedge set changes.

The harness's `cullMs` columns in the matched table were recorded while 3–5 headless browsers shared 4 cores, so their
maxima reflect contention.

## 6. Remaining over-budget frames (B)

Under 750 k is **reached** with doors closed on hall, well, up-west and up-east (Mode A and Mode B, including 60 FPS),
and on entrance. Stair keeps 2 of 108 frames over. In closed and partial gameplay across all measured runs, frames over
750 k fall from **5,769** (P) to **1,589** (A) to **1,270** (B), out of 9,591 frames. The candidate without the turn
allowance reached 1,022 (§5.1).

The remaining outliers are attributed per pose on the final build (`docs/perf-r03/b/diag/B-final.json`; the visible
pixels come from the diagnostic hide test):

| Pose (B, worst frame) | Total | Leading contributors (triangles / visible px) |
|---|---:|---|
| library, closed | 967 k | **climbers 236 k / 0 px**, library room 104 k / 150 k px, wing 72 k / 0 px, manor 68 k / 49 k px, grounds 56 k / 18 px |
| kitchen, closed | 907 k | **climbers 236 k / 0 px**, trees 116 k / 221 px, wing 72 k / 72 k px, manor 68 k / 138 k px, forest 54 k / 0 px |
| gallery, closed | 948 k | **climbers 236 k / 0 px**, library room 102 k / 89 k px, trees 97 k / 5.9 k px, wing 68 k / 0 px, manor 68 k |
| ground-front, closed | 869 k | **climbers 236 k / 0 px**, trees 93 k / 178 px, wing 72 k / 97 k px, grounds 60 k / 25 px, forest 52 k / 0 px |
| upper-rooms, closed | 973 k | **climbers 236 k / 0 px**, trees 115 k / 2.3 k px, library room 102 k / 112 k px, wing 68 k / 0 px, manor 68 k |
| stair, closed | 827 k | **climbers 236 k / 0 px**, trees 163 k / 737 px, wing 72 k / 17 k px, forest 52 k / 0 px, manor 50 k |
| hall, partial | 993 k | **climbers 236 k / 0 px**, library room 113 k / 2 px, trees 73 k / 27 px, wing 72 k / 0 px, grounds 62 k / 0 px |
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

**Production's admission of the outdoors** (`'out'`) uses PORTAL-R02's cone: half FOV + 32°, re-evaluated every
0.12 s. When **no** window qualified at the last cull, a turn faster than about 4.6 rad/s can bring the first window
into view before the next cull. Production then draws no outdoors behind it for at most 0.12 s.

B does not change that admission. Once the outdoors is admitted, B's wedge set covers turns up to 6.3 rad/s (§3.4).

## 7. Protections

| Protection | Result |
|---|---|
| R03-A vegetation (climbers, front hedges, manor shell) | Geometry fingerprint **identical** on A and B (`docs/perf-r03/b/gates/fingerprint-A-B.txt`; only the build name differs). The R03-A rule is untouched; the climbers and hedges are not window-constrained |
| R03-A tests | `tests/perf-r03-a.test.ts` passes, plus the new straddling-box test (§3.1) |
| Planters, entrance pots | Unchanged: still in the `manor` chunk, which is not window-constrained |
| Windows (WINDOW-R02 glazing), PORTAL-R02 | Unchanged. PORTAL-R02's `clearWindowInView` behaves as before with its default `los = true`. The wedge set uses its own wider variant |
| PERF-R02 doorway rules and tools | Unchanged. The smoke runs (`scripts/perf-visibility.mjs`) on P, A and B show the same pass / fail pattern, 5/7 each. The two failures are the inherited PB01 open-door checks (walkway, well), and B's values equal A's: B does not change doors |
| Lighting (LIGHT-R03/R04, R08) | Independent by construction: the rule only sets `visible` / `regionOff` on outdoor meshes and tree instances, and does not touch lights or materials. The dev04d and W01 suites give the same results as on A |
| Mushroom Grove | Its updater reads `outdoorWindows` and its version. `outdoorWindows` is unchanged; the rule's extra version bumps only make it recompute the same result. It is not window-constrained. It has no dedicated test here |
| Interactables, gameplay | No gameplay code changed. dev03 and dev04b/d interaction checks match A (§8) |
| Doors (closed, partial, open; front door) | Unchanged by design: an exterior door in view leaves the frame in the previous rule (B = A on hall, well and stair with doors open). Proven in §4 for every door state |
| Copacabana room | Unchanged: in `cons` the rule is never active |

## 8. Tests

| Suite | P / A | B | Classification |
|---|---|---|---|
| Typecheck (`tsc --noEmit`) | pass | **pass** | — |
| Unit tests (vitest, 68 files) | — | **524 / 524** (`tests/perf-r03-b.test.ts`: 8 tests; 1 new PERF-R03-A test. The fix tests for §3.1 and §3.3 fail without their fixes) | Two runs under heavy machine load timed out in heavy geometry tests; both pass alone or quiet. **Infrastructure** |
| Build (`vite build`) | pass | **pass** | — |
| PERF-R02 visibility smoke | 5/7 (P), 5/7 (A) | **5/7** | The two failures (PB01, Mode B, doors open, walkway and well) are **inherited / budget mismatch**: open doors are outside R03-B, and B = A there |
| e2e-dev04d-w01 (W01) | 27/27 on R03-A | **27/27** (the first run hit a 30 s tap timeout under load; rerun clean) | **Infrastructure** (the first run) |
| e2e-dev04d (D1/D2/D3) | 18/21 on R03-A | **18/21**, identical failures | **Inherited**: evidence panels (9 present), BOSLUST ids (`boslust.knob`, `boslust.wheel.*`), study key pickup |
| e2e-dev03 | 9/11 on R03-A | **9/11**, identical failures | **Inherited**: `boslust.lock` standing spot, library furniture overlap (73.2, 99.0) |
| e2e-dev04b | 7/9 on R03-A | **7/9**, identical failures | **Inherited**: BOSLUST ids; hero views over PB01 (library hero view improves: 870 k → 756 k triangles) |
| Same-frame window proof | — | 69 runs, 20,464 frames, 11,251 glass-only | No visible loss after §3 (§4.3) |

**New regressions: none.**

## 9. Recommendation

**Recommendation: accept PERF-R03-B as a lossless improvement on A.**

**Why:**
- **Visual proof.** The same-frame proof covers every door state, Mode A and Mode B, 30 and 60 FPS fast turns, and
  dusk. It finds no visible outdoor loss after the four revisions in §3, each found by the proof and fixed at its
  cause.
- **Budget.** Closed-door gameplay in the hall, well, up-west, up-east and entrance now stays under 750 k (0 frames
  over, Mode A and Mode B). Frames over 750 k in closed and partial gameplay fall by a further 20 % against A
  (1,589 → 1,270), and the frames over 150 calls with doors closed fall to 0–3 per path.
- **Cost.** +0.22 ms median per cull (every 0.12 s). No art, LOD, lighting, door, portal or gameplay change.

**What it does not do.** It does not reach < 750 k everywhere in closed and partial gameplay. The rest is not
outdoor-through-glass content (§6):

1. **PERF-R03-C (recommended next):** split the R03-A climber mesh per facade or per site, with the same art and the
   same R03-A rule per part. It is 236 k triangles, drawn at 0–2 visible px in every remaining outlier. Because it
   changes R03-A ownership, it needs the owner's approval.
2. **Tile the forest and grounds meshes** so that the wedges can cull them. They draw 52–63 k at 0 px.
3. Interior rooms (library ≈ 104–113 k, the service wing) and partial doors belong to PERF-R02's doorway rules and to
   the room art.

**Merge and deploy:** not done. PERF-R02, PERF-R03-A and PERF-R03-B are stacked: B is built on A, which is PERF-R02 +
PERF-R03-A merged with production `1f9563b`. They should be released together after owner review.
