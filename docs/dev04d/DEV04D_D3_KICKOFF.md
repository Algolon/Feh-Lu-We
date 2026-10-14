> **FLW-PB01 budget authority (14 October 2026):** [PERFORMANCE_BUDGET.md](../PERFORMANCE_BUDGET.md) supersedes every historical 250k camera-triangle limit and “previously under 250k must remain under” rule in this document. Current ceiling: **750,000 submitted camera triangles per view**, provisional; device validation pending. Historical measurements/results remain unchanged. Draw-call limits, functional assertions and local batch delta limits remain in force; explained geometry growth requires an explicit regression review, not automatic rejection at 250k.

# DEV-04D D3 kick-off: status, carry-forward, D3-a plan
Date: 11 Oct 2026. This document is phase 1 of the owner's D3 brief and was written before any D3-a code.

## 1. Verified status
Read from GitHub and git, not from older status headers.

| Item | Verified value |
|---|---|
| Production (default) branch | `ccr-75ef4113-kfkimm` |
| Production HEAD | `31c80bf` "Merge DEV-04D D3-0 audit + D2-R craftsmanship corrections (#10)" (merged 11 Oct 13:34 UTC) |
| Pages | run 117 on `31c80bf`: build ✓, deploy ✓ |
| D branch | `ccr-f4845963-3qt9ft`, fast-forwarded to `31c80bf` before D3-a: it contains nothing that is not in production |
| Open PRs | only **#9 VCP-01** (draft, `vcp01-library-codex`, head `e043993`), based on the old production `3e09c98`: **not merged, not touched** |

**DEV-04D merged to production**

| Step | PR | Merge |
|---|---|---|
| D0 (audit and design docs) | #8 | `f26e563` |
| D1, D1-R (FLW wall art, gallery curation) | #8 | `f26e563` |
| D2 (key family, S3 reference pieces, salon wall) | #8 | `f26e563` |
| D3-0 (craftsmanship audit and execution plan; docs and tooling) | #10 | `31c80bf` |
| D2-R (craftsmanship corrections) | #10 | `31c80bf` |

- **Not started:** D3-a…f, D4.
- **Contracts at production:**
  - 130 interactables / doors, 21 checkpoints, save schema 4;
  - FLW-RSV-019…022 PENDING;
  - no decor is interactable.

## 2. D2-R is closed as a milestone
D2-R is owner-reviewed and stays merged as it is. There is **no separate D2-R loop** and no D2-R-2. Its open points move into
the D3 / D4 batches where the room or feature work happens anyway (§3). Until then, the current D2-R models stay in
production as **interim**, not as final acceptance.

## 3. Carry-forward (binding, from the owner's D2-R review)

### 3.1 Finished and kept

| Item | Status |
|---|---|
| Key presentation (×1.7, liners, dish, card / blotter) | accepted, keep |
| S3-031 azulejo panel, S3-037 heron | kept, no open owner remark |
| **Portugal cottage placements:** D2-046 on the axis, D2-045 on the room's east wall, the mask over the sideboard | composition accepted, keep the slots |
| Medallion model direction (turned disc, rim, plant from the field) | accepted direction, never back to the old model |
| D1 / D1-R wall art, D2 keys and S3 pieces not named below | kept |

### 3.2 → D3

| Item | Batch | Binding owner intent | Notes |
|---|---|---|---|
| **S3-017 terracotta medallion** | **D3-b** (botanic room) | clearly improved but **much bigger**: identity-piece presence, not a small wall accent | Keep the D2-R model; scale and re-proportion it (rim / relief depth scale with it). Final position over the botanic work zone. Target: reads from the botanic door at phone scale (G1 ≥ 60 px is far too low for an identity piece; aim for a quarter of the frame height from the door). |
| **S3-014 swallows** | **D3-b** (front gallery is on the D3-b floor) | not yet the reference intent: form, presence, elegance | Remodel, not rescale: wing plan form (long, scythe-like primaries), tail streamers, body taper. Group size and wall relation are judged from the walk path and the landing. |
| **S3-030 mask** | **D3-f** (Portugal cottage) | not at reference quality: not sculptural, crafted or convincing enough. **The current model is not final acceptance.** | Construction-first remodel: a carved / paper-maché shell with real depth and thickness at the edge, and a crown built as layered pieces. Keep the slot over the sideboard. |
| **Portugal cottage paintings** (D2-045, D2-046) | **D3-f** | placements are right; the paintings and their room presence do not feel finished | Keep the slots; improve the presentation: frame depth and profile, scale against the wall, picture light / wall grazing, mount and hanging. Content stays the FLW sources: no invented art. |

### 3.3 → D4 (Wickerman: explicitly not hidden in D3)
The full ritual cycle is **not** in production yet. D4 implements it, using `DEV04D_WICKERMAN_DESIGN.md` as the base with
these owner intents as binding:

1. The candles light **one by one**.
2. Only then can the Wickerman be lit.
3. It burns down to a **charred** state.
4. The candles **go out automatically**.
5. The player can **clean** the Wickerman.
6. The player can **take hay** from a hay bale.
7. The player can **refill** the Wickerman.
8. The cycle **resets to the candle phase**.

Immersion:
- no large blocking popup in the middle of the screen: prompt-level, subtle feedback (the design's §5 "no toasts, no
  modal" rule is confirmed);
- audio / sound-design hooks where they fit: candle strike, ignition, burn loop, crackle tail, brushing, hay rustle.

Design deltas to settle at D4 start:
- the design has one "Kaarsen aansteken" action with a reveal: confirm that a one-by-one sequenced reveal satisfies "1
  voor 1", or make it one interaction per candle;
- save schema 4 holds (the `lit` record).

### 3.4 Not doing / not reopening
- No D2-R reopening, no re-review of accepted D2-R items.
- **PR #9 / VCP-01:**
  - not merged, cherry-picked or copied;
  - used read-only as a craftsmanship reference (§4);
  - its library globe / table / chair remain a separate owner track.
- No D3-b…f work inside D3-a.
- No change to:
  - puzzles, the evidence placement, interactable ids, the save schema, inventory or interactions;
  - touch / input timing.
- No new interactables from decor.
- RSV-019…022 stay PENDING.

## 4. VCP-01 as quality frame (read-only)
Read: PR #9's `VISUAL_QUALITY_REPORT.md` and `IMPLEMENTATION_NOTES.md`, and its diff stat. Taken over as **practice**, not
code:

| Lesson | Applied in D3-a as |
|---|---|
| Construction first: an explicit support chain and immutable interaction datums | every hero piece gets a construction note (§5.4); the table tops, drawer, hatch and chart datums stay exact |
| Small, well-joined beats extra ornament; fine bevels add little at 3 m | effort goes to silhouette and joinery that read at phone distance (legs, aprons, cornices, door frames); no micro-bevels |
| Turned profiles give distinctive silhouettes at low cost | turned table legs (lathe) for the dining and kitchen tables |
| Subdivide only what deforms | none needed here |
| Grain orientation and local contact; don't over-darken contacts | grain via the existing timber material; no new contact decals in D3-a |
| Fair review harness: immutable build, same poses / settings, clay, render before counters | baseline served from an immutable copy of the `31c80bf` build; `SET=d3a` fixed poses; `MODE=clay`; budgets doors-closed at low quality |
| Honest scoring: player-eye gains vs close-up gains; owner judges | the report separates "reads at phone distance" from "close-up only" |

**Not taken over:**
- `libraryCraft.ts`;
- the review switch / flags;
- the private lathe cleanup;
- the globe map texture.

## 5. D3-a execution plan: dining / game room and kitchen

### 5.1 Diagnosis (production `31c80bf`, `docs/dev04d/d3a/before/`, phone 915 × 412)
**Dining (12.6 × 11.6 m)**
- The room is one object island: the table, chairs and rug in the middle of a large wood floor.
- Three of four walls are bare plaster down to the floor:
  - west (`din-games-corner`): a 0.6 m side table against a 6 m blank wall;
  - south (between the windows);
  - north (one painting beside the kitchen arch).
- There is no game identity beyond the pieces on the table.
- No zone serves the kitchen arch, though food comes from there.
- The 4.6 m table stands on 3.4 cm tapered legs: spindly for its length and mass.

**Kitchen (12.6 × 17.6 m)**
- Reads as a tiled hall with furniture islands:
  - the north run stops short west of the back door (2.6 m gap);
  - nothing hangs above any counter except the hood;
  - the dresser floats alone on the 17.6 m west wall;
  - the kitchen table is a small object in the middle of the floor.
- The casework has flat slab doors.
- The work zone, eating zone and supply zone are not legible as zones: there is one uniform tile field from wall to wall.

### 5.2 Objective
Two rooms that read as **designed** at player eye:
- **dining / game room**: a hosting room with a service side and a games side;
- **kitchen**: a working kitchen with a fitted work wall, an eating zone and a supply end.

Achieved with composition, casework and architectural dressing, not with more small props.

### 5.3 Interventions (ordered by value at phone distance)

**Dining / game room**

| # | Intervention | Craft level | Why |
|---|---|---|---|
| A1 | **Panelled wainscot** round the room (≈ 0.85 m): a skirting board, frame-and-panel rhythm, and a dado rail; it stops at the hall opening and the kitchen arch | architecture | ties every bare wall to the room, gives scale under the windows; one move for all four walls |
| A2 | **Refectory table remodel:** same top (1.3 × 4.6, top at 0.76), turned baluster legs (three pairs), a deeper apron, breadboard ends, a floor stretcher | silhouette, construction | the room's spine reads as a heavy hosting table; pieces on it stay seated (same top datum) |
| A3 | **Games corner (NW):** a glazed-top games cabinet on the west wall (board-game boxes and cards on its shelves); a dartboard with its cabinet doors and a chalk score board on the north wall, west of the arch; the existing party table (marshmallows / shots) stays in the corner | composition, use-identity | the eet-/spelkamer identity, readable from the hall entrance and the table |
| A4 | **Serving console** under D2-010 on the north wall, east of the kitchen arch: a narrow side table with stacked plates, a tureen, bottles and glasses | composition, use logic | service side next to where food enters from the kitchen |
| A5 | **China cabinet** in the SW corner (west of the first south window): a cupboard base with a glazed upper (glazing bars, plates and glasses inside) | composition, wall depth | the entrance corner gets height and depth; hosting identity |

**Kitchen**

| # | Intervention | Craft level | Why |
|---|---|---|---|
| K1 | **Continuous work wall (north):** the run continues from the west wall to the back door (fills the 2.6 m gap); **wall cupboards** with a cornice where wall is free (never over a window or the door); a tiled splashback band along every counter between the openings | composition, architecture | the fitted kitchen wall reads from every kitchen view; architecture and casework become one |
| K2 | **Casework quality:** the counter builder gets frame-and-panel doors (stiles / rails proud of a recessed panel), a toe-kick shadow and the worktop overhang kept; the island and wall cupboards share the same door language | construction, detail that reads | the kitchen no longer reads as flat painted boxes |
| K3 | **Eating zone:** the kitchen table becomes a farmhouse table (turned legs, same top datum) on a woven runner rug, with two enamel pendant shades over it (static, no new light) | zones, hierarchy | the table becomes a place; it separates the eating zone from the work zone |
| K4 | **Work aisle runner** in front of the north run, between the island and the range / sink | zones | floor zoning without retiling |
| K5 | **West wall between the hatch and the dresser:** a plate shelf / peg rail with utensils and tea towels and a kitchen clock, clear of the hatch and the chart | wall usage | the 17.6 m wall stops being bare between its anchors |

### 5.4 Construction notes (hero pieces)
- **Refectory table:**
  - The top (45 mm, breadboard ends with cross grain) rests on a 12 cm apron frame.
  - The apron is tenoned into six square-topped turned legs (a block at apron height, then a baluster and a foot).
  - A floor stretcher joins each end pair, plus a centre rail.
  - Silhouette = the leg baluster against the rug.
  - Target: the legs ≥ 8 px wide at 4 m on the phone viewport (they are ≈ 3 px today).
- **Games cabinet:**
  - A plinth carries the carcass; the upper half is open shelving behind a glazing-bar frame (no glass material).
  - A cornice caps it.
  - 1.1 × 0.4 × 2.0 m.
- **Dartboard:**
  - A wall cabinet (back board and two open doors with chalk panels) carries the board.
  - The board is a disc with sector rings: no text.
  - Bull at 1.73 m.
- **Wall cupboards:**
  - Hung on the wall: a carcass 0.35 m deep, with the same frame-and-panel doors as the base run.
  - A shared cornice line at 2.3 m; the bottom line at 1.45 m (0.53 m above the worktop).
- **Pendants:**
  - The cord hangs from a ceiling rose.
  - Enamel cone shades, the inside cream; bottom at 1.9 m.
  - No light source (the room's lamp stays the gameplay lamp).

### 5.5 Protected (must not move or change)
- **Kitchen:**
  - the service chart and the trolley-tag panel (`kitchen.chart`);
  - `kitchen.hatch`, its recess, dish and `pk.consKey`;
  - `kitchen.drawer` + `pk.kitchenMatches`;
  - `mem.kitchen.list`;
  - `lamp.kitchen`;
  - the island footprint and collider;
  - `door.kitchenBack` and `door.service` with their sweeps;
  - D2-005;
  - the sink cut-out.
- **Dining:**
  - `inspect.hostingPlan` and the sideboard it lies on;
  - the game set, beer and score pad at the table's south end;
  - the candlesticks and `makeFire` wicks;
  - `lamp.dining` (chandelier + switch);
  - D2-010.
- **Routes:**
  - the walk lines hall → dining → kitchen arch → back door / service door / hatch;
  - the e2e reach poses (`kitchen.drawer` from (101, 103.6), `inspect.hostingPlan` from (105.8, 86.6)).

### 5.6 Budget (doors closed, low quality)
- **Baseline at `31c80bf`:**
  - dining-a 76 / 146 k, dining-b 98 / 202 k;
  - kitchen-a 62 / 147 k, kitchen-b 128 / 211 k;
  - worst view in the set 130 / 243 k.
- **Caps for D3-a:**
  - kitchen ≤ +1 call and ≤ +10 k tris;
  - dining ≤ +2 calls and ≤ +12 k tris;
  - no view over 150 calls / 750,000 camera triangles (PB01, provisional).
- Materials: the existing timber / paint / brass / ceramic / stone / wood families already batched in the `mWing` chunk.
  - No new material or texture; the rugs use the existing rug atlas.

### 5.7 Evidence and gates
- **Captures:** matched before / after at 915 × 412, `SET=d3a`, 17 fixed poses:
  - dining: arrival from the hall, both ends, the west wall, the table, the sideboard, the games corner;
  - kitchen: through the arch, enter, the north end, the west and east walls, the range, the SW corner, the island, the
    dresser.
- **Clay** set for construction.
- **Budget:** `ROOMS=1 DOORS=closed` and `SET=d3a DOORS=closed`, on both builds.
- **Gates:**
  - typecheck, unit;
  - `e2e:dev04a/b/c/d`;
  - dev01–03 and the full e2e: the kitchen and dining hold pickups, a puzzle and doors, so all suites run.
