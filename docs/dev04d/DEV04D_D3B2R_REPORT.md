# DEV-04D D3-b2R: visual refinement and final review

A focused follow-up to [D3-b2](DEV04D_D3B2_REPORT.md) on the same branch. It does not rebuild the four rooms.

| Item | State |
|---|---|
| Branch | `dev04-d3-b2` |
| Starting commit | **`b2c4ae7e49b38390bff56211645eca1b69514888`** (D3-b2, verified: remote branch identical, no other session's changes) |
| Original production baseline | `752cb024a349ec0045d4f1873e5b191b154191f0` |
| Final build | `index-ZswEroEN.js`, from the source committed with this report; every gate in §6 ran on it |
| Merge / deploy | not done (owner review) |
| Out of scope | D3-c and the Wickerman W01 workstream |

## 1. Integration status against the current production branch

| Item | State |
|---|---|
| Production HEAD at the start | `6c57ced`: five commits after `752cb02` (serre condenser with an inspectable beetle; gravity bong prop, R01 / R02) |
| Overlap with D3-b2 | none. Those commits touch `serreAirco.ts`, `gravityBong.ts`, `conservatory.ts`, `grounds.ts` and their docs / tests, not one file D3-b2 changes. |
| Trial merge | `git merge-tree` is clean; **not** merged, as instructed |
| Interactable count | The condenser "inspection" adds interactables in production. At the final integration, the ID baseline used by e2e:dev04a / dev04d (130 interactables) must be reconciled with that production change. D3-b2 / b2R add none. |

## 2. Visual issues and the interventions chosen

Baseline for this iteration: the D3-b2 build. Every comparison is three-way, from the same cameras:
production | D3-b2 | D3-b2R.

| Room | Issue at player eye | Intervention (kept) | Why it works at 915 × 412 |
|---|---|---|---|
| **Reiskamer** | From the door the room read as a long corridor. A small desk floated on a long, plain window wall; the travel pieces were scattered along it. | **A planning zone on the window wall:** <br>– a heavier **planning desk** (1.4 × 0.62 m, a drawer pedestal, a gallery rail along the back; **same 0.76 top datum**) under the middle window; <br>– a **bookcase** of guides and atlases on the pier west of it; <br>– a **rug** under the desk and chair. <br>The wall now runs window · bookcase · desk · holdall · window · coat stand. | Mid-ground layering: from the door the eye stops at the bookcase / desk / rug group halfway down the room instead of running to the bed (`compare/re-enter.jpg`, `re-wide.jpg`, `re-travel.jpg`). |
| | The jacket over the chair read as a rectangular block, especially from behind, which is how the room sees it | **Draped jacket** (rebuilt): <br>– the shoulders straddle the rail and slope into the back; <br>– the back is A-line with a fold, a vent and an uneven hem; <br>– open fronts with lapels; <br>– one sleeve hangs straight outside the post (with a cuff), the other is caught forward over the seat corner; <br>– a lighter olive that separates from the dark chair. | Shoulder line and two sleeves read from 2–4 m, including in clay (`re-jacket-clay.jpg`) |
| **Sterrenkamer** | The telescope, stool and logbook table read as three loose objects | A **station rug** under the telescope, the stool and the table | One working station, the telescope its tallest silhouette (`sk-scope.jpg`, `sk-table.jpg`; at dusk `sk-scope-dusk.jpg`) |
| | A large empty centre between the resting corner and the station | A **daybed under the star map** (north wall): <br>– scrolled ends, a spindled back; <br>– a light slate cover against the dark floor; <br>– a bolster, a folded throw, a star atlas left open. <br>The armchair stays in the window corner. | The room now reads along its length: sleep · look out (armchair, window, moon) · rest under the chart · observe. The middle has a purpose, and the floor is not filled (`sk-centre.jpg`, `sk-back.jpg`, `sk-wide.jpg`). |
| **Guest room** | The rucksack read as a rigid box | **Soft rucksack** (rebuilt): <br>– the body bellies forward under its load and gathers at the top; <br>– the lid flap falls over the front; <br>– a full front pocket, flap straps with buckles, a grab loop. <br>Same place, footprint and lean. | It reads as a loaded canvas pack (`gu-ruck.jpg`, `gu-ruck-far.jpg`) |
| **Bathroom** | — | unchanged, as instructed (no new texture, no art) | — |

## 3. Alternatives tried and rejected

All alternatives were evaluated with the same cameras; the evidence is in `d3b2r/rejected/` and `d3b2r/scale/`.

| Variant | Result | Decision |
|---|---|---|
| R3: a **runner** along the telescope's sightline plus the armchair moved onto the bed-foot rug, facing the window | The dark patterned runner drew a straight line down the room and **reinforced the corridor read** from the door. The moved armchair turned its back to the room and hid the bed. | rejected |
| R4: the **daybed replacing** the armchair | The centre improved, but the window corner went bare. The first daybed (low, dark cover) had too weak a silhouette. | rejected; it became R5: a spindled back, a light cover, the armchair kept |
| **Bookcase in the shared `mUp`** (to avoid two batches it opens in `mUpR`) | −1 call in three desk views. But the hall's high-quality view went to **451,854 triangles, over its 450 k check**; D3-b2 passes it at 448,630. | rejected (§5) |
| Larger planning rug, a wall map over the desk | Not built: floor fill, and a second map would compete with the travel-sketch identity panel | not pursued |

## 4. Moon and sloop scales (evidence: `d3b2r/scale/sloop.jpg`, `moon.jpg`)

The comparison builds were identical except for the scale.

| Piece | Compared | Chosen | Why |
|---|---|---|---|
| FLW-S3-015 sloop | ×1.15 vs **×1.3** | **×1.3** | ×1.15 was set for the 1.1 m desk. On the 1.4 m planning desk it looked undersized. At ×1.3 it stays in proportion with the desk and the window, keeps the map clear, and reads better from the desk approach and the room. It stays inside the desk's east half (unit test). |
| FLW-S3-016 moon | **×1.4** vs ×1.6 | **×1.4** (kept) | At ×1.6 the block covers more than half the night-table top, the crescent dominates the bed corner and crowds the binoculars. At ×1.4 it reads as a bedside ornament without competing with the room's identity pieces. |

## 5. Performance

Doors closed, low quality (camera-only), 915 × 412; immutable builds and identical poses.

| Set | D3-b2R vs D3-b2 |
|---|---|
| D3-b2 poses (Reis / Sterren / guest) | Reis / Sterren: **+2.7…+4.1 k triangles, +1…+3 calls** (31–41 calls). Guest room: +264 triangles (the rucksack), 0 calls. All other poses: 0. |
| All 124 room and exterior views | Δ calls 0…+3, Δ triangles 0…+4.3 k. Only `r-reis-*`, `r-sterren-*`, `r-storage-*` and the overhead `x30-wickerman-plan` change. **No view newly crosses 150.** The six views over 150 were over in production and are unchanged by D3-b2R. |
| Movement (`walk-d3b2r.json` vs D3-b2's) | Doors closed: hall, library and upstairs east are unchanged. Upstairs west median 96 k → 100 k (the samples inside the two rooms). |
| Movement, **all doors open** | up-west max calls 241 → 241, triangles 599 k → 603 k. Up-east 268 → 270 calls, 618 k → 622 k. **Hall 305 → 306 calls, 715 k → 719 k triangles** (production 293 / 701 k). All are under the 750 k PB01 ceiling. These hotspots are over 150 calls in production already. |

**What makes the +3 calls:** the bookcase.
- In `mUpR` it opens two batches of its own: its books, and a 12-triangle no-shadow part.
- That puts the three desk views at +3 calls, one over the local +2 guide.
- The only cheap fix, building it in the shared `mUp`, failed the hall's high-quality budget (§3).
- So the +3 stays, documented: 31 calls absolute, far under 150.

**Culling:** `mUpR` and `mUpG` are preserved unchanged. The D3-b2 savings (hall, library, attic, guest room, bathroom) are intact: the doors-closed walks and the 124-view set do not move outside the two rooms.

**No physical-device claim:** SwiftShader counters only; Samsung validation is pending (PB01).

## 6. Regression (final build `index-ZswEroEN.js`)

| Gate | D3-b2R | Classification |
|---|---|---|
| typecheck | clean | |
| unit | **305 / 305** (D3-b2 304 + planning-desk datum / footprint / collider; daybed and planning desk in the construction audit; jacket / rucksack cost classes; sloop ×1.3 placement) | |
| test:budget | 4 / 4 | |
| e2e:dev04d | **20 / 20** (D3-b2 region culling; door → suitcase memory / logbook / beds / wardrobe / bath routes walkable; both memories targeted; 130 ids, 21 checkpoints, save 4) | |
| e2e:dev04b | 9 / 9 (construction audits) | |
| e2e:dev03 / dev02 / dev01 | 11 / 11, 34 / 34, 34 / 34 | |
| e2e:dev04a | 18 / 19 | **existing production failure**: the stale `dev04a-baseline.json` render check, identical on `752cb02` and D3-b2 (not re-baselined, as instructed) |
| e2e:dev04c | 21 / 22 | **existing production failure**: the stale `docs/dev04c/before/budget.json` render check, identical on `752cb02` and D3-b2 |
| full e2e | 91 / 100 | Failures are listed below |

**Full e2e failures:**

| Failure | Classification |
|---|---|
| High-quality desktop budgets: driveway, forecourt, forest, BOSLUST, conservatory | **existing production failures**, identical numbers on `752cb02` |
| Three touch checks | **infrastructure / timing**: tap timeouts under SwiftShader load. Production failed them in one run (84 / 94) and passed them in another (96 / 103); D3-b2 passed them. |
| BOSLUST sample, "LOD transitions by walking" | **existing production failure** (§6.1) |

The entrance-hall high-quality check **passes** (448,630; production fails it at 475 k).

### 6.1 The BOSLUST LOD-walk check

**Existing production failure.** In earlier full runs, production and D3-b2 both crashed on a page-load timeout before
reaching this check. Re-run on production `752cb02` with fewer browsers in parallel, it fails **identically**:
- the same LOD sequence, `lod 1 @ 33.9 m → lod 0 @ 19.5 m`;
- production scored 96 / 103 in that run.

The check is in the BOSLUST vegetation sample, far from these rooms, and D3-b2 / D3-b2R change no vegetation or LOD
code.

In the same production run the three touch checks **passed** (they failed in production's earlier run). That confirms
they are timing-sensitive under SwiftShader load: an infrastructure failure, not a code failure.

Contracts preserved (checked by tests):
- the suitcase memory and its inspect target;
- the telescope position and aim;
- the logbook and its 0.70 datum;
- the star map and the travel sketch;
- the lamps, the doors and their swings;
- the furniture datums things stand on (desk 0.76, night tables 0.5775);
- all interactable ids and save schema 4;
- no new interactable.

Navigation: the dev01–03 routes and the D3-b2 door routes pass.

## 7. Exact source changes (`b2c4ae7` → final)

| File | Change |
|---|---|
| `src/world/d3b2.ts` | + `planningDesk`, + `daybed`; `jacketOverChair` and `rucksack` rebuilt |
| `src/world/manor.ts` | Reiskamer: `writingDesk` → `planningDesk`, + bookcase, + planning rug. Sterrenkamer: + station rug, + daybed (the armchair kept). |
| `src/content/props3d.ts` | FLW-S3-015 `scale` 1.15 → 1.3 |
| `tests/dev04d-d3b2.test.ts` | sloop ×1.3 placement inside the planning desk; planning-desk datum test; audit and cost coverage for the new / rebuilt pieces |
| `scripts/dev04d-audit-views.mjs` | `SET=d3b2r` (the refinement's 24 poses, incl. `re-jacket`, `sk-rest`, `sk-centre`, `gu-ruck`, `gu-ruck-far`) |
| `scripts/dev04d-d3b2r-sheets.py` | three-way comparison and scale sheets |

## 8. Evidence (`docs/dev04d/d3b2r/`)

| Path | Content |
|---|---|
| `prod*`, `d3b2*`, `d3b2r*` | the 24 `SET=d3b2r` poses from the three immutable builds, at 915 × 412, 1280 × 720, portrait 412 × 915, late dusk (`-dusk`, mood 1.0) and clay (`-clay`) |
| `compare/<pose>.jpg`, `-dusk`, `-clay` | production \| D3-b2 \| D3-b2R |
| `sheets/<room>-{915,1280,portrait,dusk,clay}.jpg` | per room |
| `scale/sloop.jpg`, `scale/moon.jpg` | the scale A / B |
| `rejected/` | R3 and R4 |
| `budget-d3b2r-poses.json`, `budget-d3b2-poses-rerun.json`, `budget-d3b2r-all.json`, `walk-d3b2r.json` | §5. The D3-b2 and production counterparts are in `../d3b2/`. |

The `d3b2r` capture sets were taken from the D3-b2R build before the §3 bookcase experiment; the final source is the
same. A recapture from the experimental build differed by ≤ 0.28 mean luminance (JPEG noise only): the batching
change does not alter the image.

## 9. For owner judgement

| | |
|---|---|
| **Ready for approval** | The Reiskamer planning zone. The Sterrenkamer station and daybed. The draped jacket, the soft rucksack. Sloop ×1.3, moon ×1.4. |
| **Trade-offs to accept** | Up to +3 calls in three Reiskamer desk views (31 calls; local guide +2; the alternative failed the hall's high-quality budget). The all-doors-open hotspots, which are pre-existing (hall 306 calls / 719 k). |
| **Visually questionable** | The planning rug's medallion pattern is bold (it was toned down once); a plainer rug is a one-line change. The Reiskamer remains a long room by architecture: the refinement layers it but does not change its proportions. |
| **Outstanding** | All of these are production issues, outside D3-b2R; none is a D3-b2R defect: <br>– the stale dev04a / dev04c budget baselines; <br>– the five exterior high-quality budgets; <br>– the BOSLUST LOD-walk check (§6.1); <br>– the interactable-baseline reconciliation at integration (§1). |
| **Deferred** | D2-017 / 027 / 030 (atlas capacity kept). A real bathroom tile texture. The estate-wide open-door call hotspots. D3-c, D4. |

**Recommendation:**
1. Accept D3-b2 + D3-b2R together for integration.
2. At merge time, merge current production into the branch.
3. Re-run e2e:dev04a / dev04d against the new production interactable count before deploying.
