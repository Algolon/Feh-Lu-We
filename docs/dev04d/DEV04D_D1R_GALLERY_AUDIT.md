# DEV-04D D1-R — Gallery hanging & interior art composition (audit)

Status: **audit only, for owner review. Nothing has been rehung.** Branch `ccr-f4845963-3qt9ft` on top of D1
(`bb738b9`, production base `3e09c98`). No new paintings, no group-B promotion, no S3 work, no evidence wall touched.

**Evidence**:
- the D1 matched set in `docs/dev04d/d1/{before,after,compare}/`;
- new room-composition captures in `docs/dev04d/d1r/context/` (`scripts/dev04d-audit-views.mjs`, `SET=d1r`): every art wall seen whole from across its room and every room from its main approach, at eye height, low quality, doors open;
- positions and openings come from the live wall-art registry (`scene.userData.openings`).

Heights below are absolute world y. **Floor levels**: ground 0.15 · upper 3.35 · cottage 4.15 · BOSLUST −3.2.
Ceilings ≈ 3.0 m above the floor (2.85 m upstairs). "Canvas" = image size; frames add 2 × rail (antique 0.095 ·
simple 0.065 · print 0.032 m).

---

## 1. Estate-level gallery rules

**Scale hierarchy** (judged against the wall, the furniture under it and the room depth, not a fixed number):

| Tier | Canvas width | Role | Pieces (after this audit) |
|---|---|---|---|
| Hero / room anchor | 1.4–2.0 m | defines the room or the axis it ends | hall stair landscape (DEV-04B-R, 2.0 × 1.4, kept as the hall's principal piece) · dining D2-010 1.40 · landing D2-028 **1.60** · living D2-026 1.40 |
| Supporting | 0.9–1.4 m | strong but subordinate to furniture / architecture | walkway D2-002 1.35 · gathering D2-042 1.40 (a big room) · cottage room D2-046 **1.20** · kitchen D2-005 **1.00** · guest room D2-035 1.00 · Sterrenkamer D2-029 **1.20** |
| Small / vignette | 0.6–0.9 m | belongs to one object or corner | hall D2-007 0.66 (over the maquette) · Reiskamer D2-022 0.75 (over the bed) · cottage entry D2-045 0.80 · workshop D2-044 0.80 |

**Hanging heights**:
- **Free wall:** the centre sits 1.55–1.70 m above the floor.
- **Over furniture:** the frame's bottom sits 0.15–0.30 m above the object (headboard, presentation table). Mirrors' bottoms sit 0.25–0.35 m above the basin.
- **Walls with openings:** align the frame tops with the door or window head line (living south wall, landing, gathering hall). Never hang "floating centred" on a wall broken by windows.
- **One continuous run** (the upper walkway): one hanging line, upper floor + 1.60 = **y 4.95**.

**Symmetry vs asymmetry**:
- **Symmetry only where the architecture already declares an axis:**
  - landing: between two doors on the hall's centre line;
  - north guest room: bed + bedsides on the door axis;
  - cottage room: the arch axis seen from the front door;
  - Sterrenkamer: across the room from the star map.
- **Asymmetry everywhere else:**
  - dining: art in the east bay, balanced by the drinks-supply cluster in the west bay (G1);
  - walkway: one piece on one side of the Sterrenkamer door;
  - workshop: the print beside the tool board;
  - living room: one window pier filled, the others left to the windows.

**Grouping**:
- With 13 approved pieces spread over 12 rooms, this house has **no salon walls**.
- Clustering unrelated works only to fill wall would read as placement, not taste.
- Relationships are made along sightlines instead: entry → room in the cottage, landing ↔ front gallery across the hall void, star map ↔ moonlight across the Sterrenkamer.
- The only true wall group worth planning is the walkway duo flanking the Sterrenkamer door. It waits for a group-B choice (D2-038 / D2-021) or stays a single piece; see decision D-1.

**Frames as a system**:
- `antique` (deep walnut + gilt bead) only for anchors in the formal and public spaces: dining, living, landing.
- `simple` for domestic and bedroom pieces.
- `print` for works on paper and the workshop.
- Hall vista: the DEV-04B-R stair landscape keeps the only plain gilt frame in the hall. The walkway piece moves to `simple`, so the walnut-and-gilt frames don't stack up in the hall.
- Frame weight vs size: the antique rail is ≈ 7 % of a 1.4 m canvas; the simple rail ≈ 10 % of the smallest piece (0.66 m), the upper limit of what still reads as light.

**Intentional negative space** (do not fill):
- the living room's east half, plus the window piers left and right of D2-026;
- the dining room's west bay of the north wall (above the future drinks supply);
- the hall's ground-floor west wall between the living arch and the maquette;
- the Reiskamer south wall, once D2-022 moves (the window and desk rhythm is enough);
- the cottage room's back wall (the old D2-046 slot);
- the gathering hall's north wall east of the tunnel door, and its east and west walls (hearth and keepsake shelf hold them);
- the kitchen's evidence wall (west: service chart + hatch);
- every evidence or identity wall (library plan, star map, travel sketch, botanic prints, archive, BOSLUST cipher / plate).

---

## 2. Per-piece decisions

| # | Piece | Room | Now: canvas · centre · frame | Decision | Proposed | Group / relation | Reasoning | Expected room effect |
|---|---|---|---|---|---|---|---|---|
| 1 | **D2-002** *Het laatste zonlicht* | hall, upper walkway (west wall) | 1.35 × 0.81 · z 86.20, **y 4.60** (upper floor + 1.25) · antique | **REHANG** (+ frame → simple) | same size · z **86.90** (centre of the bay between the gallery corner 84.0 and the Sterrenkamer door 89.7) · y **4.95** (walkway line) · `simple` walnut | walkway run; with D-1 the left half of a duo around the Sterrenkamer door | It is an **upper-gallery picture**, and that is the right reading: from the hall floor (7 m away) everything below y ≈ 5.0 is seen through the balusters wherever it hangs (`d1r-hall-west-elevation`), so a higher hang does not "fix" the hall-floor view and would not suit the walkway. The real faults are the height (25 cm under the other walkway picture: its top sits at rail level, `d1r-walkway-across-void`) and an off-centre slot. Antique gilt next to the gilt stair hero across the void competes | one clean hanging line on the walkway; reads fully from the walkway, the front gallery and the landing; the hall's hero keeps its rank |
| 2 | **D2-007** *De stille eik* | hall, ground floor west wall | 0.66 × 0.88 · z 92.50, y 2.00 (1.85 above floor) · simple | **REHANG** | same size · z **94.40** (centred over the maquette presentation table, z 93.4–95.4) · y **1.95** (bottom ≈ 0.45 m above the table top, clear of the model) · simple walnut | vignette: oak painting + model of the house + the existing sconce at z 95.6 | Today it floats alone on a large wall next to the table, hung high: the "token" read (`d1r-hall-west-elevation`). Over the table it becomes one deliberate composition, lit by the sconce beside it. Thematically right (an old oak over the house's maquette). The maquette inspect is untouched | the hall's west side gets a small, intentional focal point under the hero's level; the wall between the living arch and the table becomes breathing space |
| 3 | **D2-026** *De kust na de regen* | living, south wall | 1.40 × 0.79 · x 77.25, y 2.10 (top 2.59 ≈ window heads 2.65) · antique | **KEEP** | — | single piece in the pier between two windows; the hearth (west wall) stays the room's focal point | Centred in its pier, top on the window-head line, subordinate to the fireplace axis (`d1r-living-south`, `d1r-living-approach`). A larger size would not fit the 2.4 m pier with air, and moving it to the blank east wall would put it behind the seating, facing nobody. The mantel evidence is not involved | calm supporting wall; the hearth keeps the room |
| 4 | **D2-010** *Na het feest* | dining / game room, north wall east bay | 1.40 × 1.05 · x 104.80, y 2.00 · antique | **KEEP** (+ NEGATIVE_SPACE west bay) | — | east bay of the north wall; the kitchen arch is on the table axis; the west bay is left for the drinks supply (G1) | Centred in its bay, deliberately **off** the table axis (the axis ends in the kitchen arch), so the future played-evening table stays the hero and the painting is its backdrop (`d1r-dining-north`, `d1r-dining-approach`). Scale is right for a 3 m room | the memory scene can grow in front of it without competition |
| 5 | **D2-005** *Kleikom, appels…* | kitchen, east wall | 0.80 × 1.00 · z 99.90, y 1.85 · simple oak | **RESCALE + REHANG** | **1.00 × 1.25** · z **99.65** (centred between the end of the shelves 97.3 and the door 102.0) · y 1.90 (bottom 1.2 m above the floor, top 2.6) · simple oak | single piece on the working wall's free bay | At 0.8 m on a 17.6 m kitchen it reads as a token next to the door (`d1r-kitchen-east`, `d1r-kitchen-approach`). 1.25 m tall answers the 1.2 m shelf band beside it without becoming a dining-room picture | the east wall reads as "shelves + a painting" rather than "shelves + a sticker" |
| 6 | **D2-028** *Het huis in de nacht* | landing, north wall | 1.30 × 0.78 · x 90.00 (hall centre line, between two doors) · y 5.05 · antique | **RESCALE** | **1.60 × 0.96** · same axis x 90.00 · y **5.00** (top ≈ 5.58 = door-head line 5.45–5.55; bottom ≈ 4.43) · antique (its gilt bead gives the dark image an edge) | the upstairs anchor, end of the axis seen from the front gallery across the void | The composition is already the best upstairs (`d1r-landing-north`): symmetric between two doors on the hall's centre line. At 1.3 m the dark image is a small dark rectangle in a 3.5 m bay; at 1.6 m the lit house and the water read as image, and it holds the axis | the upper floor gets one clear anchor; readability improves through size, not light |
| 7 | **D2-022** *De onbekende reiziger* | Reiskamer, south wall pier | 0.75 × 1.00 · x 80.80, y 5.00 · simple | **REASSIGN** (same room, other wall) | same size · **west wall above the bed**: x 72.42, z **84.90** (bed centre), y ≈ **5.25** (bottom ≥ 0.15 m above the panel headboard; verify at implementation) · simple walnut | over the bed; the room's view from its door (east, z 81.7) ends on this wall | Today it is squeezed between two curtained windows (`d1r-reis-south`), in the dimmest pier. The bed wall is the one the player faces on entering, is lit by the bedside lamp (on by default), and a traveller at a window over a guest's bed fits the travel room. The south wall then keeps its window and desk rhythm. Travel sketch (identity) and suitcase memory unchanged | the Reiskamer gets an anchor on its entry sightline; the dark painting is lit by the room's own lamp |
| 8 | **D2-029** *Maanlicht op water* | Sterrenkamer, south wall | 0.80 × 0.80 · x 82.00, y 5.00 · print, near-black rail | **REHANG + RESCALE** (+ frame colour) | **1.20 × 1.20** · x **78.60** (centre of the 12.6 m wall, facing the star map on the same axis) · y **4.95** (the star map's centre line) · `print`, **light oak rail** (#c8a77a) instead of near-black | across the room from the star map (identity panel, N wall): a dialogue across the room, not a cluster | The clearest failure in D1: a 0.8 m dark square near the end of a 12.6 m blank wall (`d1r-sterren-south`, `d1r-sterren-wide`). Size + centring + a light rail (value separation from a dim olive wall) solve most of it without light. Moonlight is not a star motif, so the ster-emblem identity is not diluted. Above the bed was considered and rejected: dark image over the navy headboard has no contrast | a deliberate pair of night pictures facing each other; the room reads designed. If the room is still too dim with its lamp off: **OPTIONAL_D3_LIGHTING** (not proposed now) |
| 9 | **D2-035** *Zomerregen op een landweg* | north guest room, east wall | 1.00 × 0.75 · z 102.60, y 5.20 (over the bed) · simple oak | **KEEP** | — | centred over the bed, between the bedsides, on the door axis | Already a classic, convincing bedroom composition (`d1r-guest-east`): ≈ 2/3 of the bed width, bottom clear of the headboard | — |
| 10 | **D2-044** *Houtdruk…* | workshop, east wall | 0.80 × 0.60 · z 99.70, y 1.90 · print light oak | **REHANG** | same size · z **98.55** (0.3 m clear of the tool board's end at 97.9) · y **2.00** (the tool board's centre line) | belongs to the tool wall (board 2.8 × 1.2 m over the workbench) | Today it floats 1.4 m away from the tool wall, slightly lower (`d1r-workshop-east`): a gallery insertion. Pinned up beside the board, on its line, it reads as something the people who work here put up | workshop-plausible; one working wall instead of two separate things |
| 11 | **D2-046** *Een middag in Portugal* | Portugal cottage room, back (arch) wall | 0.90 × 0.51 · x 27.90, z 160.12, y 5.80 · simple blue-grey | **REASSIGN + RESCALE** | **1.20 × 0.675** · **north wall on the arch axis**: x **25.00**, z 164.68, facing south · y **5.90** (above the chair backs, centred between the two windows; free span 23.2–26.8) · simple blue-grey | enfilade: front door → entry → arch → this painting over the long table; the entry's D2-045 sits on the cross axis | Today it hangs on the wall **behind** you when you enter the room (`d1r-cottage-room-south`); from the front door the arch frames an empty north wall (`d1r-cottage-door`). On the axis it becomes the endpoint of the cottage's main view and the room anchor over the table. The set-table memory is on the table, not on that wall | the cottage gets one clear interior anchor; the two Portugal pieces never share a view and form an entry → interior hierarchy (0.8 m → 1.2 m) |
| 12 | **D2-045** *De weg naar de kust* | cottage entry, west wall | 0.80 × 0.60 · z 158.60, y 5.75 · simple blue-grey | **KEEP** | — | ends the entry's long (east–west) axis, above the plant | It already terminates the entry corridor (`d1r-cottage-entry-west`) at the right size for a 2.7 m deep entry; with D2-046 moved it no longer competes | — |
| 13 | **D2-042** *Onder hetzelfde bladerdak* | BOSLUST gathering hall, north wall west of the tunnel door | 1.40 × 0.79 · x 58.60, y −1.55 (top on the door-head line) · simple | **KEEP** (+ NEGATIVE_SPACE east bay) | — | west bay of the north wall; the table, the hearth (west) and the keepsake shelf (east) carry the room | Quiet, centred in its bay, top aligned to the door head, story-neutral (`d1r-gathering-north`). Larger would start to compete with the finale table; a frieze or second piece would flatten BOSLUST's restraint | BOSLUST identity preserved |
| M1 | **Bathroom mirror** | bathroom, east wall | 0.50 × 0.70 · z 105.00 (over the basin), y 4.90 · painted rails | **KEEP** | — | centred over the pedestal basin; sconce to its right | Basin ≈ 0.55 m wide → mirror 0.5 m; bottom ≈ 0.3 m above the basin rim (`d1/compare/d1-bath-mirror-close`) | — |
| M2 | **Guest-WC mirror** | guest WC, east wall | 0.45 × 0.60 · z 105.30 (over the basin), y 1.70 · painted rails | **KEEP** | — | centred over the basin; sconce beside it | Proportioned to the small basin and the narrow room (`d1/compare/d1-wc-mirror-close`) | — |
| P | **Walkway procedural painting** `painting@85.12,93.00` (atlas placeholder, gilt) | hall, upper walkway | 0.90 × 0.70 · z 93.00, y 4.95 · old gilt frame | **owner decision D-1** | recommended: **retire it now** (walkway = D2-002 + negative space) until a group-B piece is chosen for the duo | — | It is now the only procedural placeholder among real works, in a bright gilt frame, visible in every cross-void view (`d1r-walkway-along`, `d1r-landing-across-void`): it reads as a placeholder | the hall vista shows only real works; the walkway duo is a later, deliberate addition |

**Codes in summary**:

| Code | Pieces |
|---|---|
| KEEP | D2-026, D2-010, D2-035, D2-045, D2-042, both mirrors |
| RESCALE | D2-028 (1.30 → 1.60 m) |
| REHANG | D2-002 (+ frame → simple), D2-007, D2-044 |
| RESCALE + REHANG | D2-005 (0.80 → 1.00 m), D2-029 (0.80 → 1.20 m, + frame colour) |
| REASSIGN | D2-022 (Reiskamer: south pier → over the bed), D2-046 (cottage: back wall → north wall on the arch axis, 0.90 → 1.20 m) |
| REGROUP | none now: the walkway duo depends on D-1 / group B |
| NEGATIVE_SPACE | see §1 (living east half + spare piers, dining west bay, hall ground wall between arch and maquette, Reiskamer south wall, cottage back wall, gathering east bay, kitchen evidence wall) |

---

## 3. Dark paintings

| Piece | How the composition solves it | Light still needed? |
|---|---|---|
| D2-028 landing | 1.6 m on the axis: the lit house and its reflection become legible shapes; the gilt bead separates the image from the wall | no |
| D2-022 Reiskamer | moves onto the wall lit by the bedside lamp (on by default) | no |
| D2-029 Sterrenkamer | 1.2 m, centred, light-oak rail against a mid-tone wall | **OPTIONAL_D3_LIGHTING** only if the owner wants it to read with the room lamp off (`lamp.sterren` defaults off outside the slice) |

No lights are added in D1-R.

## 4. Technical notes for the rehang (when approved)

- **Atlas texel density** (D1 test: 300–420 px/m). Two cells must be rebuilt larger when the atlas is re-run (the atlas has ≈ 26 % free space):
  - D2-029 at 1.2 m needs a ≈ 480 px cell (today 320 px);
  - D2-046 at 1.2 m needs ≈ 448 px (today 360 px).
  - D2-028 at 1.6 m (512 px → 320 px/m) and D2-005 at 1.25 m tall (400 px → 320 px/m) stay inside the range.
  - Total GPU memory unchanged (same 2048 × 1024 page).
- **Ids**:
  - REHANG / REASSIGN changes the wall-art id (`painting@x,z`) of D2-002, 007, 005, 022, 029, 044 and 046. These are registry ids for the wall-art contract, not gameplay ids.
  - `e2e:dev04a` asserts `painting@85.12,86.20` (the walkway slot, from DEV-04A). That assertion will be updated with D2-002's new position, and documented.
  - `e2e:dev04d` slot table updated.
- **Re-checks:**
  - every new slot gets the wall-face probe (`scripts/dev04d-wallprobe.mjs AT=…`), `wallArtConflicts()` and the evidence-clearance check;
  - D2-022 over the bed needs the headboard height read from the model before fixing y;
  - the walkway must stay clear of the Sterrenkamer door sweep.
- **Budgets:** no new material or draw call. The frames on the moved pieces change chunk only where the room changes (none do). The mirror rule from D1 applies: frames that land in a far corner of a shared chunk must use the paint material.

## 5. Owner review shortlist

Only decisions that change room identity, location, grouping, hero scale or the procedural painting:

| # | Decision | Recommendation |
|---|---|---|
| **D-1** | Walkway procedural painting: retire it now, or keep it until a group-B piece is chosen for a duo around the Sterrenkamer door | **retire now**; walkway = D2-002 alone (rehung, simple frame); a duo only later, through a deliberate group-B choice |
| **D-2** | Cottage: move D2-046 to the room's north wall on the arch axis and enlarge it to 1.20 m (the cottage is a calibration target) | **yes**: entry → interior hierarchy, endpoint of the cottage's main view |
| **D-3** | Reiskamer: move D2-022 from the south window pier to above the bed | **yes**: the entry sightline ends on it, lit by the bedside lamp |
| **D-4** | Sterrenkamer: D2-029 to the centre of the south wall opposite the star map, 1.20 m, light-oak print rail; picture light only as later OPTIONAL_D3_LIGHTING | **yes** |
| **D-5** | Landing hero scale: D2-028 to 1.60 × 0.96 m on the hall axis | **yes** |

Not owner-level (implemented with the rehang unless the owner objects):
- D2-002 rehang + frame;
- D2-007 over the maquette;
- D2-005 1.0 × 1.25;
- D2-044 beside the tool board.
