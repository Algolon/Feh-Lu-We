# PERF-R03-A: Exterior Greenery Visibility & Region Ownership

| Item | SHA / build |
|---|---|
| Branch | `perf-r03-exterior-greenery-visibility` |
| P — production | **`2e2bab1`** (LIB-STAIR-R06) · `main-MAbDny00.js` |
| C — P + PERF-R02 | **`417f4ec`** (`perf-r02-frame-accurate-culling` `2f12128` merged with `2e2bab1`) · `main-C4vW_v2v.js` |
| R — C + PERF-R03-A | **`4abdedd`** source · `main-DyvcGhyD.js` (later commits: tests, tooling, evidence, docs only) |
| Final PERF-R03-A SHA | **`edec508`** (evidence and report; product source unchanged since `4abdedd`) |
| Merge / deploy | **not done**; owner review. PERF-R02 and PERF-R03-A are to be released together later |

**Settings and method.**
- **Renderer:** SwiftShader in headless Chromium, mobile low quality, 915 × 412, DPR 1, no shadows, opaque batching on.
  The fixture save and quality settings are forced by the harness (`scripts/perf/visibility-harness.mjs`).
- **Frame order:** camera → culling → world update → render, inside `Game.tick`. `World.updateCulling` is never called
  out of order.
- **Matching:** P, C and R are built from their own commits and measured with the same harness, paths and door sets.
  The served bundle is recorded in every result file.

## 1. The problem (PERF-R02 §12.3, contributors 2 and 3)

| Group | Source | Old ownership | Cost per indoor view (current production) |
|---|---|---|---|
| Wall climbers (EXT-R04, six sites on the west and north facades) | `exteriorGreenery.ts` `climbers()`, built by `manor.ts` | The local batcher inherited the caller's chunk, **`manor`**. The `manor` region (rooms: every manor room, `out` and `cons`; 130 m) is drawn in every manor view | **236,020 triangles** (1 mesh; 708,060 vertices; larger than the ≈ 205 k measured on `2404d85` because VEG-R10B/C added midribs and veins) |
| Front hedges (VEG-R09, leaf shells `frontHedge.left` / `.right`) | `estate.ts` | `roomRegion([chunk], ['out', ...every room], 25)`: drawn from any room within 25 m | **59,296 + 59,296 triangles**, 1 call each |

None of it is visible from inside behind the manor walls (PERF-R02 §12.3: 0 px with the diagnostic visibility test).

## 2. Design

### 2.1 Ownership (`src/world/exteriorGreenery.ts`)

- **Climbers:** built with `chunk: 'extGreen.climbers'` (`CLIMBERS_CHUNK`). They use the same batcher, materials and
  build order as before, so the geometry and colours are identical (§4).
- **Visibility boxes:** while the climbers are built, each site records its world bounds (leaves, stems, planting
  pocket) and the mesh carries them as `userData.visibilityBoxes`. Visibility is tested per site, between the
  windows. It is still **one mesh and one draw call**.
- **Entrance pots:** they keep the caller's (`manor`) chunk and its visibility, unchanged.
- **Hedges:** their geometry and chunks are unchanged; only their registration changed.

### 2.2 Visibility: `World.exteriorRegion(chunks, far)` (`src/interactions/world.ts`)

A small reusable helper next to `roomRegion`:

- **Outside** (`hereRoom === 'out'`) and in the glass Copacabana room: the region is drawn within `far`, as before.
  That is 25 m for the hedges and 130 m for the climbers, the manor shell's distance.
- **Inside**, the region is drawn only while an **exterior aperture that can show it** is in view. An aperture is:
  - **an exterior door:** open or glass, in view with line of sight (the existing `outdoorInView` test);
  - **a clear window:** in view with line of sight (the existing PORTAL-R02 `clearWindowInView` test, unchanged).
- **"Can show it":** at least one of the region's boxes must:
  - lie in front of the opening (on its outside);
  - be inside the **wedge the eye sees through the opening's width, at both faces of the wall** (a window is a tunnel
    through the wall, taken here as only ±0.15 m of the 0.4 m stone wall; widened by 0.5 m either side);
  - be inside the **rays through its sill and head**, ±0.1 m.
- **Conservative fallbacks:** a door whose orientation cannot be resolved shows everything, and an eye in the opening
  sees everything.
- **Cost and stability:** the test depends only on the eye position, not the view direction, so turning cannot make a
  region pop. It adds no per-frame work; it runs at the existing 0.12 s culling cadence, and only when an exterior
  region exists and the player is inside.

### 2.3 Registration (`src/world/estate.ts`)

```ts
for(const chunk of ['frontHedge.left','frontHedge.right'])w.exteriorRegion([chunk],25);
w.exteriorRegion([CLIMBERS_CHUNK], 130);
```

### 2.4 Iteration during this step

1. **One box per region (`d509fad`).** A single box spanning both facades made every west or north window "show" the
   climbers: they were drawn in 23 of 77 doors-closed hall poses, all invisible.
2. **Per-site boxes and wall depth (`4abdedd`).** That dropped to 0 of 77. The height test (`19f56a2`) removed the
   hedges from the hall: they lie below the dining-window sills seen from there.

## 3. Results: matched P / C / R

Source: `docs/perf-r03/a/matched-table.md` (generated by `scripts/perf/consolidate.mjs`); raw data
`a/measure-{P,C,R}.json`.

| path | doors | mode | build | frames | median | p95 | p99 | max | calls max | > 750 k | > 150 calls |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| hall | closed | A@30 | P | 289 | 559,248 | 865,134 | 890,442 | 896,580 | 152 | 108 (37 %) | 5 (2 %) |
| hall | closed | A@30 | C | 289 | 559,248 | 865,134 | 890,442 | 896,580 | 152 | 108 (37 %) | 5 (2 %) |
| hall | closed | A@30 | R | 289 | 267,194 | 609,310 | 618,902 | 619,358 | 151 | 0 (0 %) | 3 (1 %) |
| hall | closed | B@30 | P | 77 | 776,976 | 910,664 | 975,774 | 1,117,502 | 158 | 40 (52 %) | 1 (1 %) |
| hall | closed | B@30 | C | 77 | 776,976 | 910,664 | 975,774 | 1,117,502 | 158 | 40 (52 %) | 1 (1 %) |
| hall | closed | B@30 | R | 77 | 505,268 | 619,260 | 680,458 | 762,890 | 157 | 1 (1 %) | 1 (1 %) |
| hall | partial | A@30 | P | 289 | 944,912 | 1,147,720 | 1,181,236 | 1,181,692 | 203 | 190 (66 %) | 122 (42 %) |
| hall | partial | A@30 | C | 289 | 926,266 | 1,041,768 | 1,071,040 | 1,076,072 | 195 | 185 (64 %) | 119 (41 %) |
| hall | partial | A@30 | R | 289 | 693,484 | 987,631 | 995,924 | 996,784 | 194 | 95 (33 %) | 115 (40 %) |
| hall | partial | B@30 | P | 77 | 974,888 | 1,155,774 | 1,181,934 | 1,307,506 | 203 | 59 (77 %) | 37 (48 %) |
| hall | partial | B@30 | C | 77 | 951,380 | 1,047,858 | 1,087,524 | 1,198,074 | 195 | 58 (75 %) | 36 (47 %) |
| hall | partial | B@30 | R | 77 | 712,822 | 990,592 | 996,284 | 1,009,836 | 194 | 28 (36 %) | 33 (43 %) |
| hall | open | A@30 | P | 289 | 1,102,934 | 1,241,074 | 1,274,590 | 1,275,046 | 227 | 289 (100 %) | 217 (75 %) |
| hall | open | A@30 | C | 289 | 1,058,598 | 1,157,192 | 1,176,500 | 1,184,060 | 224 | 289 (100 %) | 217 (75 %) |
| hall | open | A@30 | R | 289 | 825,824 | 1,129,894 | 1,154,834 | 1,155,290 | 225 | 201 (70 %) | 215 (74 %) |
| hall | open | B@30 | P | 77 | 1,119,058 | 1,244,772 | 1,275,488 | 1,372,816 | 227 | 77 (100 %) | 63 (82 %) |
| hall | open | B@30 | C | 77 | 1,074,116 | 1,145,022 | 1,165,292 | 1,263,384 | 219 | 77 (100 %) | 63 (82 %) |
| hall | open | B@30 | R | 77 | 834,990 | 1,144,318 | 1,154,830 | 1,155,732 | 219 | 57 (74 %) | 63 (82 %) |
| stair | closed | B@30 | P | 108 | 747,094 | 911,716 | 948,950 | 950,004 | 158 | 53 (49 %) | 10 (9 %) |
| stair | closed | B@30 | C | 108 | 747,094 | 911,716 | 948,950 | 950,004 | 158 | 53 (49 %) | 10 (9 %) |
| stair | closed | B@30 | R | 108 | 458,258 | 601,128 | 840,862 | 850,454 | 157 | 2 (2 %) | 7 (6 %) |
| stair | partial | B@30 | P | 108 | 1,003,298 | 1,185,932 | 1,263,886 | 1,280,296 | 211 | 87 (81 %) | 43 (40 %) |
| stair | partial | B@30 | C | 108 | 928,234 | 1,111,476 | 1,199,706 | 1,216,392 | 203 | 87 (81 %) | 39 (36 %) |
| stair | partial | B@30 | R | 108 | 679,654 | 921,076 | 1,080,152 | 1,081,114 | 202 | 25 (23 %) | 39 (36 %) |
| stair | open | B@30 | P | 108 | 1,116,612 | 1,264,772 | 1,338,752 | 1,342,246 | 236 | 107 (99 %) | 88 (81 %) |
| stair | open | B@30 | C | 108 | 1,041,236 | 1,207,464 | 1,278,066 | 1,281,142 | 228 | 107 (99 %) | 84 (78 %) |
| stair | open | B@30 | R | 108 | 802,956 | 1,037,316 | 1,138,608 | 1,159,474 | 228 | 74 (69 %) | 84 (78 %) |
| well | closed | B@30 | P | 64 | 803,310 | 964,398 | 1,012,412 | 1,096,984 | 158 | 42 (66 %) | 3 (5 %) |
| well | closed | B@30 | C | 64 | 803,310 | 964,398 | 1,012,412 | 1,096,984 | 158 | 42 (66 %) | 3 (5 %) |
| well | closed | B@30 | R | 64 | 532,416 | 657,800 | 684,624 | 742,372 | 157 | 0 (0 %) | 2 (3 %) |
| well | partial | B@30 | P | 64 | 1,018,724 | 1,181,934 | 1,202,348 | 1,253,488 | 203 | 52 (81 %) | 40 (63 %) |
| well | partial | B@30 | C | 64 | 958,494 | 1,092,916 | 1,144,056 | 1,149,954 | 195 | 52 (81 %) | 33 (52 %) |
| well | partial | B@30 | R | 64 | 706,098 | 920,068 | 1,069,266 | 1,090,658 | 194 | 20 (31 %) | 32 (50 %) |
| well | open | B@30 | P | 64 | 1,106,226 | 1,275,488 | 1,298,902 | 1,348,762 | 227 | 64 (100 %) | 55 (86 %) |
| well | open | B@30 | C | 64 | 1,032,239 | 1,189,470 | 1,235,926 | 1,239,330 | 219 | 64 (100 %) | 49 (77 %) |
| well | open | B@30 | R | 64 | 786,659 | 1,123,042 | 1,155,732 | 1,176,630 | 219 | 39 (61 %) | 48 (75 %) |
| up-west | closed | B@30 | P | 291 | 668,800 | 1,055,632 | 1,131,532 | 1,138,648 | 171 | 127 (44 %) | 21 (7 %) |
| up-west | closed | B@30 | C | 291 | 668,800 | 1,055,632 | 1,131,532 | 1,138,648 | 171 | 127 (44 %) | 21 (7 %) |
| up-west | closed | B@30 | R | 291 | 319,576 | 701,020 | 776,920 | 784,036 | 169 | 9 (3 %) | 20 (7 %) |
| up-west | partial | B@30 | P | 291 | 863,724 | 1,104,040 | 1,159,876 | 1,163,256 | 189 | 211 (73 %) | 50 (17 %) |
| up-west | partial | B@30 | C | 291 | 806,112 | 1,104,040 | 1,156,140 | 1,163,256 | 189 | 183 (63 %) | 45 (15 %) |
| up-west | partial | B@30 | R | 291 | 509,788 | 767,882 | 895,106 | 1,042,646 | 189 | 22 (8 %) | 42 (14 %) |
| up-west | open | B@30 | P | 291 | 924,358 | 1,164,452 | 1,253,570 | 1,276,362 | 208 | 224 (77 %) | 64 (22 %) |
| up-west | open | B@30 | C | 291 | 865,994 | 1,133,134 | 1,171,464 | 1,276,362 | 208 | 214 (74 %) | 59 (20 %) |
| up-west | open | B@30 | R | 291 | 560,700 | 816,852 | 944,526 | 1,106,304 | 208 | 31 (11 %) | 59 (20 %) |

**Doors closed (ordinary play):**

| Path / mode | P = C over 750 k | R over 750 k | Median P → R | Max P → R |
|---|---|---|---|---|
| hall, Mode A 30 FPS | 108 / 289 (37 %) | **0** | 559 k → 267 k | 897 k → **619 k** |
| hall, Mode B | 40 / 77 | **1** | 777 k → 505 k | 1,118 k → 763 k |
| stair, B | 53 / 108 | **2** | 747 k → 458 k | 950 k → 850 k |
| well, B | 42 / 64 | **0** | 803 k → 532 k | 1,097 k → **742 k** |
| upper-west walkway, B | 127 / 291 | **9** | 669 k → 320 k | 1,139 k → 784 k |

**Partial set** (nine doors open):
- R exceeds 750 k on 8–36 % of the poses, against 63–81 % on C;
- medians drop by 233–296 k from C.

**All open (stress):**
- R exceeds 750 k on 11–74 % of the poses / frames, against 74–100 % on C;
- maxima are 1.11–1.18 M.

**Remaining over-budget frames:** these are the views where the outdoors is switched on through windows (PORTAL-R02),
deferred to PERF-R03-B. In R, climbers and hedges are off in almost all of them (§3.2).

### 3.1 Savings by group

| | Triangles | Draw calls |
|---|---|---|
| Wall climbers | 236,020 when culled | 1 (they shared a `manor` batch; the split adds a mesh only where they are drawn) |
| Each front hedge | 59,296 when culled | 1 each |
| Saving per indoor view (P → R) | 236 k–354 k (pixel proof: average 102–302 k per culled frame on the indoor paths, maximum 354,612) | equal or −1 at every maximum (§3 table) |

The doors-closed medians drop by 271–349 k.

### 3.2 What remains drawn in R, and why

Indoor frames in which a group is still drawn (`a/ext-on.txt`):

| Path | Doors | Climbers drawn | Left / right hedge drawn |
|---|---|---|---|
| hall, stair, well, upper-west | closed | 0–2 of 64–291 | 0 / 0–10 |
| same | partial | 4–12 of 64–291 (Mode A hall 52 / 289) | 0 / 0–10 |
| same | open | 5–17 of 64–291 (Mode A hall 60 / 289) | 3–8 / 3–10 |

These are frames with an open exterior door, or a west / north / south window in a reachable room, whose opening can
show a site. The pixel proof (§5) shows whether each is actually visible. Where it is not, it is conservative (at most
236 k drawn), never a loss.

### 3.3 CPU cost of visibility

`World.updateCulling` medians (SwiftShader, loaded machine) are 0.5–2.7 ms on R against 0.5–3.1 ms on P / C, with no
systematic increase. The aperture list is built once per update (≤ ~60 windows and doors already tested by the existing
rules), plus ≤ 4 corner projections per box per aperture.

### 3.4 Shader programs and draw calls

- **Materials:** no new materials. The climbers' mesh uses the same foliage material clone as before.
- **Meshes:** one extra mesh exists (the climbers are separate from the pots' foliage mesh). It costs a draw call only
  where both are drawn, outdoors near the house.
- **Indoor views:** the maximum calls are equal or −1 at every path (§3 table).

## 4. The artwork is unchanged

`scripts/perf/greenery-fingerprint.mjs` fingerprints every mesh of the `manor`, `extGreen.climbers`, `frontHedge.left`
and `frontHedge.right` chunks in P, C and R. It records the vertex count, the sums of positions, normals and colours,
and an order-independent hash of every vertex (position, normal and colour, rounded to 1e-4). Source:
`a/fingerprint.json`.

| Build | Meshes | Vertices | Vertex hash (all four chunks) |
|---|---:|---:|---:|
| P `main-MAbDny00.js` | 16 | 1,242,876 | 1948924300 |
| C `main-C4vW_v2v.js` | 16 | 1,242,876 | 1948924300 |
| R `main-DyvcGhyD.js` | 17 | 1,242,876 | **1948924300** |

- **Climbers:** in R, the climbers' hash (655503521) plus the remaining `manor` hash (3563591351) equals P's `manor`
  hash (4219094872) exactly.
- **Hedges:** each hedge is identical in all three builds.
- **Conclusion:** the leaf silhouettes, midribs and veins, colours, stems, placement, coverage and the entrance pots are
  bit-for-bit the same. They are only partitioned differently.
- **Unit tests:** the leaf outline, veins and placement are also covered by `tests/exterior-greenery.test.ts`,
  unchanged and passing.

## 5. Visual proof

`scripts/perf/visibility-lossless.mjs` with `EXT=1`, on R. Every frame is compared with a reference rendered in the
**same frame** (same world state, time, lighting and camera) with the previous rule restored: climbers and hedges drawn
whenever within their distance. Any changed pixel (any channel > 6) is attributed to the group responsible and its crop
saved.

**Daylight, Mode B** (camera synchronised to each pose; legacy samples with an eight-way turn and two pitches at each waypoint):

| Paths | Doors | Frames | Culled by the rule | Diff frames | Max px |
|---|---|---:|---:|---:|---:|
| up-west, up-east, hall, library, stair, gallery, well | closed | 1,432 | 1,432 | 140 | 9 |
| ground-front (living, hall, dining), kitchen, upper-rooms (Reis, Sterren, study, botanic, gallery) | closed | 507 | 507 | 41 | 5 |
| win-north, win-west, front-approach (outdoors) | closed | 475 | 0 | 0 | 0 |
| win-south (outdoors; its last waypoints are inside the workshop) | closed | 178 | 17 | 1 | 5 |
| up-west, hall, ground-front, kitchen, upper-rooms, entrance (vestibule, front doorway, hall) | open | 1,102 | 1,053 | 94 | 7 |
| front-approach, win-south | open | 404 | 8 | 0 | 0 |
| hall, upper-rooms | partial | 364 | 364 | 25 | 5 |

**Movement, Mode A** (30 FPS walks with turns and look-arounds, at the game's 0.12 s culling cadence; pop-in would
show as a lost pixel):

| Path | Doors | Frames | Culled | Diff frames | Max px |
|---|---|---:|---:|---:|---:|
| front-approach | open | 923 | 0 | 0 | 0 |
| ground-front | open | 603 | 419 | 45 | 5 |
| entrance (through the open front door) | open | 284 | 272 | 11 | 6 |

**Dusk** (phase 0.85, Mode B): front-approach open, 226 frames, 0 culled, 0 diff; ground-front open, 167 frames, 124
culled, 15 diff frames, max 4 px.

**Every changed pixel was classified** (`scripts/perf/classify-diffs.mjs`; logs `a/classify-{A,A-edges,B,B-edges}.log`). Each
changed pixel is re-rendered at its pose and ray-cast through its centre and four corners against all geometry,
including the culled group:

| Class | Mode B pixels | Mode A pixels |
|---|---:|---:|
| **Bleed-through:** the first surface along every ray that reaches the group is opaque geometry in front of it (for example the living room's south wall 0.75 m above the floor, with the hedge 1.1 m behind it) | 520 | 93 |
| **Rasterisation edge:** no ray through the pixel reaches the group | 3 | 0 |
| **Visible foliage lost** | **0** | **0** |

- **Coverage:** the stair path was not classified, because its rows carry no floor height. Its 23 diff frames
  (≤ 6 px) were inspected visually and match the same pattern: dark stem specks on plaster at the screen edge.
- **Images:** the reference images show these artefacts as dotted brown / green specks on plaster, the climbers' stems
  and the hedges' leaves showing through wall seams. PERF-R03-A removes them (`a/sheet-*.jpg`).

**Representative frames** (`a/sheet-greenery-poses.jpg`, `.json`; left PERF-R03-A, right the previous rule):

| Pose | Doors | Groups drawn by the rule | Triangles (rule / previous) | Changed px |
|---|---|---|---|---:|
| Living room, south window over the left hedge | closed | left hedge | 692,136 / 928,156 | 0 |
| Dining room, south window over the right hedge | closed | right hedge | 693,132 / 693,132 | 0 |
| 1.2 m inside the open front door, facing out | open | none (the hedges start beside the jambs) | 628,328 / 982,940 | 0 |
| West garden, facing the west facade | closed | climbers, left hedge | 1,040,514 / 1,099,810 | 0 |
| North garden at dusk (0.85), facing the north facade | closed | climbers | 1,204,021 / 1,322,613 | 0 |
| Hall | closed | none | 755,184 / 1,109,796 | 0 |
| Reiskamer, west window | closed | none | 529,476 / 765,496 | 4 (bleed-through, ray-cast) |

The dining frame's equal counts show that the right hedge is drawn there, as the window shows it.

## 6. Tests and gates

| Gate | P (production) | R (PERF-R03-A) | Classification |
|---|---|---|---|
| `npm run typecheck` | — | clean | |
| `npm test` (vitest) | — | **511 / 511** (67 files; 9 new in `tests/perf-r03-a.test.ts`) | |
| `npm run test:budget` | — | 4 / 4 | |
| `npm run build` | `main-MAbDny00.js` | `main-DyvcGhyD.js` | |
| `perf:visibility:smoke` (`scripts/perf-visibility.mjs`) | 5 / 7 | 5 / 7 | Same assertions on both. Determinism, synchronization, no updater leak and no page errors pass. **The known PB01 budget failures** (all-doors-open slices) are reported separately: walkway Mode B max P 1,276,362 → R 1,048,528; hall-well P 1,275,488 → R 1,155,732. C (P + PERF-R02): walkway 1,276,362, hall-well 1,165,292 |
| `e2e:dev04d` | 16 / 21 (+ suite crash on a page-reload timeout, load) | **18 / 21** | 3 inherited (fail identically on P): evidence-panel count 9 / 11; ID list 140 (BOSLUST-R05's five lock ids are undocumented); D2 study key not targeted from its standing pose. P also fails "render budgets (doors closed): all 13 D1 views inside PB01" (hall 780–840 k, living 904 k), **which R passes** |
| `e2e:dev04d-w01` | — | **27 / 27** | |
| `e2e:dev03` | 9 / 11 | 9 / 11 | Both inherited (identical on P): `boslust.lock` standing spot; one library furniture overlap at (73.2, 99.0) (LIB-R01) |
| `e2e:dev04b` | 7 / 9 | 7 / 9 | Both inherited: canonical ids (BOSLUST); the library room view over PB01 (P 880,120, R 870,560: its outdoors through six windows is PERF-R03-B scope) |

No dedicated vegetation or window e2e scripts exist in `package.json`. The vegetation and window unit tests
(`exterior-greenery`, `cross-room-window-visibility` and others) are part of the 511.

- **Run order:** suites ran on R first; failures were then reproduced on P with the same scripts (logs `a/gates/`).
- **C smoke:** the first run timed out while loading the estate on a saturated machine (infrastructure); it was rerun.

New unit tests (`tests/perf-r03-a.test.ts`, 9):

- **Ownership:**
  - the climbers' chunk and its exterior-region registration (130 m);
  - the manor shell region does not include the climbers' chunk;
  - the entrance pots keep the manor chunk;
  - the hedges are exterior regions (25 m), no longer registered for every room.
- **Rule (bare World):**
  - outside within and beyond the distance;
  - the open front door shows a planting straight ahead, but not when shut or turned away;
  - the right hedge is not visible through the front door from inside the vestibule (it starts 6 m beside the jamb),
    but is from the doorway;
  - through a dining window near the glass: drawn; over the sills from the hall: culled;
  - per-part boxes plus wall depth: a climber site between two windows of its own wall stays hidden from the hall and
    from obliquely inside the room, and is drawn from the garden;
  - never through an opening the region lies behind.
- **Existing tests:** the PERF-R02 tests (study doorway rule, window exemption) are unchanged and pass.
- **Untouched:** save, puzzle and interaction state. No state, save, ID or interaction code changed (the diff is
  `world.ts`, `estate.ts`, `exteriorGreenery.ts`, tests and tooling).

## 7. Limitations

- **Device:** SwiftShader only; device (Samsung) timing is still pending.
- **Budget:** PB01 is still exceeded with the partial set and with every door open. The remaining excess is the
  outdoors drawn through windows (PERF-R03-B).
- **Conservatism:** the wedge test is conservative in plan and height. Groups are sometimes drawn invisible (§3.2), never
  the reverse in the frames tested.
- **Not covered:** the pixel proof covers the listed paths, door states and the dusk phase, not every possible pose.
  Mode A covers walking and turning at 30 FPS on six paths.

## 8. Recommendation for PERF-R03-B

The remaining doors-closed and partial-set excess is the PORTAL-R02 window rule (PERF-R02 §12.4): one clear window in a
reachable room puts the whole outdoors (grounds, woodland, garden, tree batches; ≈ 240–457 k) into an indoor view, for
0–1,600 visible pixels.

**Bounded scope:** for outdoor regions seen only through windows (no open exterior door in view), draw only what the
windows can show. Use `World.exteriorRegion`'s aperture wedge, extended to the outdoor regions' own boxes (grounds,
forest, garden per chunk), with a distance limit through glass. Keep doors on the current rule. The tree batches
already follow the window cones.

**Acceptance:** the same matched P / C / R(+B) tables, with doors closed and the partial set within 750 k; and the same
pixel proof on the window paths, the hall / dining / living / kitchen and the garden.
