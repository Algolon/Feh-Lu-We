# DEV-04D D3-b1: study, botanic room and front gallery
- **Branch:** `ccr-f4845963-3qt9ft`, reset to production `dd0c5dd` before any change. That production already contains
  PR #12 (Asset Track 01) and PR #13 (D3-A2).
- **Scope:** the study, the botanic room, and the front gallery's swallow wall.
- **Not started:** D3-b2 (Reiskamer, Sterrenkamer, north guest room, bathroom) and D3-c.
- **Not done:** merge and deploy.

## 1. Baseline and budget audit (production `dd0c5dd`, measured before any change)
Doors closed, low quality, 124 views (every room view plus the hero views), with the new `CHUNKS=` option of the audit
harness. It records, per view, the draw calls and triangles each batch chunk actually draws (render-time hook, not an
estimate).

| Chunk | Contents | Views that draw it | Its own cost there | Tightest view (total) | Headroom there |
|---|---|---|---|---|---|
| `mUpE` | study, botanic room, north guest room, linen | **8 of 124**: only its own rooms | 6–12 calls / 45–58 k tris | botanic-a 55 / 140,094 | 95 calls / 110 k |
| `mUp` | front gallery, landing, Reis- / Sterrenkamer, rear nook | **51 of 124**: half the house, including the library and the living room | 8–11 calls / 28–30 k tris | **library-b 85 / 244,034** | 65 calls / **only 5,966 tris** |

The audit refines the D3 plan's estimate:
- The study and the botanic room are as cheap to dress as the plan assumed: the chunk stays in its own rooms.
- The gallery is **not**: anything added to the swallow wall is paid in the library at 244 k.
- So the swallows were the only `mUp` addition (the Track 01 build, +2.2 k). The bench was moved, not added.

## 2. Room-composition decisions

### Study: a centre and a working identity
- **Before:** a 6.3 × 15.6 m room whose furniture stood against its walls: desk (south), bookcases and sideboard (west),
  map and salon wall (east), reading corner (north-east). The middle 8 m were bare floor.
- **After:** a **plan chest** is the centre of the room: 0.95 × 1.7 m, top at 0.86.
  - It stands on the long axis, east of the door → desk line (x 98.2). That line is the full e2e's walk route to the
    note, the map and the desk lock: it stays free, with the player's 0.3 m radius plus 0.22 m.
  - Its four wide map drawers face that line, so they are what you see as you walk in.
  - Maps lie spread on its top under brass weights, beside a rolled map and a reading glass: something you can handle
    maps on.
- **Relationships:**
  - desk (work), bookcases (reference) and the forest map (east wall) now face a shared centre;
  - the reading corner (armchair, side table, salon wall) stays the north-east zone;
  - the floor between keeps its negative space.
- **Construction:**
  - a recessed plinth (toe-kick shadow) carries the carcass;
  - a drawer bank with shadow gaps, brass cup pulls and label frames;
  - frame-and-panel ends and back (the D3-a door language);
  - a top with a 3 cm overhang and a moulding under it;
  - 1,244 tris.
- **Unchanged and unobstructed:**
  - the desk, `study.compartment` (the lock drawer) and its panel;
  - `pk.archiveSeal`, `inspect.studyNote`, `lamp.study`, `inspect.forestMap`, the globe;
  - the salon wall (the study's one deliberate art wall: no second one).
- **Not rebuilt:** the chairs, desk and bookcases already read; the gain is the composition.

### Botanic room: a two-ended room (the priority room)
- **Before:**
  - 6.3 × 15.6 m, activity only in the middle third: the herbarium table;
  - both ends empty;
  - the D2-R medallion was a 0.58 m disc on the long west wall.
- **Work end (south)**, facing the door down the room's length, with daylight from both south windows:
  - **Potting bench** on the 2.06 m pier between the windows:
    - legs 7 cm square;
    - rails tenoned in under a top of three planks (the middle one worn lighter);
    - a slatted pot board on stretchers;
    - a back board;
    - the back legs run up to carry a shelf of small pots.
  - **Use:** potted seedlings, a seed tray with soil and labels, a trowel, a plant press (two boards, straps, paper),
    and a sack of soil on the pot board. Not coded, nothing to read. 1,848 tris.
  - **The medallion** (Track 01) hangs centred over it at **×2.5 (Ø 1.45 m)**. It is the terminus of the view from the
    door: the room's identity piece, related to the bench, the pier and the sightline.
- **Display end (north-west, by the door):**
  - a stepped étagère (three shelves, each set back, on ladder sides with raking stays) against the west wall;
  - a tall turned stand (0.95 m) and a low one (0.55 m);
  - a large floor plant in the corner;
  - seven pots of four greens and three heights;
  - overlapping silhouettes with a gap at the walk line, not a row.
- **D2-009** *Mot boven wilde bloemen* (0.72 × 0.9 m, print frame) hangs over the étagère on the secondary west wall.
- **Unchanged and kept clear:**
  - the herbarium table (`inspect.herbarium`) and `lamp.botanic`;
  - the evidence prints wall (east, four emblem prints): nothing new stands in front of it, and the decorative art
    (D2-009 on the west wall, the medallion on the south wall) is on other walls;
  - the dev01 slice route (x ≈ 102.7) and its evidence table position.
- **Removed:**
  - the south-west corner pot (the bench needs the pier);
  - the old west-wall medallion (superseded).

### Front gallery: the swallow wall
- The Track 01 swallows at **×1.15** (≈ 2.0 × 0.69 m), centred on the pier between the two south windows, at the
  windows' mid-height (UF + 1.72).
- **The gallery bench moved under them.** It stood alone by the east window. Now the seat and the sculpture make one
  composition on the walking line.
- Nothing else in the gallery changed: no painting and no new motif.

## 3. Track 01 integration
- **What was promoted:**
  - `buildSwallows` and `buildMedallion` (d3bAssets.ts) are now the production builds of FLW-S3-014 / 017, called
    from their PROPS3D placement wrappers in `d2props.ts` with the new anchors and a `scale` field;
  - an optional audit-name argument was added, so the world audits them under their stable ids (`T01:…` stays in the
    review harness).
- **Removed:** the D2-R interim geometry for both, plus three helpers that only they used, so there is one approved
  build per piece.
- **Not placed yet (D3-b2):** the moon and the sloop. The isolation test now asserts exactly that (only d2props imports
  the builders; moon / sloop are not imported).
- **Scale study** (`d3b1/scale-study/cmp-*.jpg`, matched poses):

  | Piece | Compared | Chosen | Why |
  |---|---|---|---|
  | Swallows | ×1.0 / ×1.15 / ×1.25 | **×1.15** | It fills the pier and reads from the walk path. ×1.25 adds little; the largest is not the default. |
  | Medallion | ×2.0 / ×2.5 / ×3 | **×2.5** | ×2.0 reads as a plaque over the bench. ×3 (Ø 1.74 m) cannot fit: its bottom must clear the bench shelf (1.2 m) and its top would reach the ceiling cornice (2.94 m against a 2.85 m room). |

## 4. 2D art
| Work | Status | Decision |
|---|---|---|
| **FLW-D2-009** *Mot boven wilde bloemen* | READY_2D (group B, owner) | **used**: botanic display end, west wall, 0.72 × 0.9 m |
| FLW-D2-008 *Schaduwvlakken* | READY_2D | **not used**: the study already has its art wall (the salon wall). A strong graphic on the north wall would compete with it and with the new centre. |
| FLW-D2-023 *Twee elkaar rakende horizonvlakken* | READY_2D | **not used**: it needs a lit wall the study does not offer, and the owner rule keeps it off D2-008's wall |

D2-009 registration (only because it is hung):
- one `ITEMS` row in `build-flw-atlas.mjs` (320 px);
- one `ART` row;
- `OWNER_GROUP_B_D2 = ['FLW-D2-009']` with basis `OWNER_GROUP_B`;
- the atlas rebuilt: sha256 re-verified, source pixels unchanged.

The atlas page stays **2048 × 960** (14 items, GPU ≈ 10.0 MiB with mips).

## 5. Performance (doors closed, low; `budget-base-dd0c5dd-*.json` vs `budget-d3b1-*.json`)
| Scope | Δ calls | Δ triangles | Notes |
|---|---|---|---|
| `mUpE` chunk (study / botanic) | **0** | +7.8 … +8.1 k | below the ≤ +12 k guide; drawn only in its own 8 views |
| `mUp` chunk (gallery) | **0** | +2.2 … +3.0 k | the swallows (Track 01: 3,042 tris vs 864) |
| D3-b1 poses (16) | −1 … 0 | +2.2 … +10.8 k | maxima 90 calls / 207,846 tris |
| All 124 views | **0** | 0 … +10.8 k | **library-b 244,034 → 246,212** (the tightest `mUp` view, still under 250 k) |

- Over the guide, already in the baseline: x28 (309 k) and x29 (277 k), the Wickerman views carried to D4.
- No new material, texture or batch.

Per-piece triangles:

| Piece | Triangles |
|---|---|
| plan chest | 1,244 |
| potting bench | 1,848 |
| étagère | 396 |
| two stands | 456 |
| seven pots | 2,100 |
| medallion (×2.5) | 2,468 |
| swallows | 3,042 |

## 6. Evidence
`docs/dev04d/d3b1/`: 16 fixed poses (`SET=d3b1`, 915 × 412, low), the same cameras before and after.

| Set | Poses |
|---|---|
| Study | `st-door` (doorway approach), `st-centre`, `st-north`, `st-centrepiece`, `st-desk` (the lock drawer side: gameplay readability), `st-corner` |
| Botanic | `bo-door`, `bo-room`, `bo-work`, `bo-plants`, `bo-medallion`, `bo-prints` (the protected evidence wall) |
| Gallery | `ga-walk-w`, `ga-walk-e` (the walking path), `ga-close`, `ga-void` (across the void) |

- `before/`, `before-neutral/`, `before-clay/` (production `dd0c5dd`, an immutable copy of its build) and `after/`,
  `after-neutral/`, `after-clay/` (the final build).
- `compare/<pose>.jpg` (before | after) and `compare/<pose>-clay.jpg`.
- `scale-study/`.

## 7. Regression (one fixed final build, bundle hash checked before and after the run)
| Gate | Result |
|---|---|
| typecheck | clean |
| unit (vitest) | **267 / 267** (the Track 01 suite now asserts the deliberate placement; the ship-rule, budget and placement tests updated for the Track 01 builds, D2-009 and the new medallion position) |
| e2e:dev04d | 18 / 18 |
| e2e:dev04a | 19 / 19 (wall-art contract incl. the medallion, swallows, D2-009) |
| e2e:dev04b | 9 / 9 (construction audits incl. the plan chest, bench, étagère, stands) |
| e2e:dev04c | 22 / 22 |
| e2e:dev03 / dev02 / dev01 | 11 / 11, 34 / 34, 34 / 34 (dev01 walks the botanic slice route) |
| full e2e | **103 / 103** (walks the study: note, forest map, desk lock, archive seal) |

One real finding, fixed before this run:
- **Problem:** the dev03 spatial check found the corner floor plant interpenetrating the étagère by 17 cm.
- **Fix:** the plant moved 35 cm.
- **Re-capture:** all after-evidence and budgets were re-captured on the fixed build.

Contracts:
- 130 interactables, 21 checkpoints and save schema 4 are unchanged.
- No decor became interactable (the new pieces add no id).
- The study lock drawer, the archive seal, the note, the forest map, the herbarium and the prints are untouched; the
  full e2e walks them.

## 8. Still visually questionable (for the owner's phone review)
1. **The plan chest reads dark** in the study's warm, dim light: from the door it is a dark mass with pale maps on top.
   - This is the same wood as the desk and bookcases (a family).
   - A lighter oak would separate it more but break that family.
2. **The medallion at ×2.5 from the doorway (15 m):** it is the clear terminus of the room, but still a modest disc at
   that distance. A larger identity read would need the room's height (×3 does not fit under the 2.85 m ceiling above a
   working bench).
3. **D2-009 is small from the room's middle**, by design: it is secondary art and must not compete.
4. **The swallows across the void (14 m)** stay small. The owner said this view is secondary; the walk path is the
   target.

## 9. Carried into D3-b2
- **Moon (×1.4) and sloop (×1.15):** Track 01 builders ready, not placed.
- **D2-027** (Reiskamer or north guest), **D2-017 / D2-030** (bathroom): READY_2D, not registered until hung.
- **Budget rule:** Reiskamer and Sterrenkamer are in the `mUp` chunk (library-b at 246 k after D3-b1). Their dressing
  must be near triangle-neutral, or the chunk must be split first. The north guest room and the bathroom are in `mUpE`
  or other chunks: measure at batch start.
