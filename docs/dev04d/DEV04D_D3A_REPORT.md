# DEV-04D D3-a: dining / game room and kitchen
- **Branch:** `ccr-f4845963-3qt9ft`, on production `31c80bf`.
- **Plan and status check:** `DEV04D_D3_KICKOFF.md` (phase 1).
- **Scope:** only the eet-/spelkamer and the keuken. D3-b…f and D4 are not started.

## 1. Evidence
- **Matched captures:** `SET=d3a`, 17 fixed poses, phone viewport 915 × 412, low quality, doors open (evidence state).
  - `d3a/before/`: production `31c80bf`, served from an immutable copy of its build.
  - `d3a/after/`: the D3-a build.
- **Clay** (form and construction only) of the hero pieces and the room views: `d3a/after-clay/`.
- **Budgets:** doors closed, low quality, the same poses plus every room view (`ROOMS=1`), on both builds:
  - `d3a/budget-base-31c80bf-{poses,rooms}.json`
  - `d3a/budget-d3a-{poses,rooms}.json`
- **Phone review:** `d3a/compare/`, one image per pose with before on the left and after on the right.

## 2. What changed, and what reads better at phone distance

### Dining / game room
| # | Change | Before | After | Reads at player eye? |
|---|---|---|---|---|
| A1 | **Panelled wainscot** round all four walls: skirting, frame-and-panel rhythm, dado rail at 0.95 m; it stops at the hall opening and the kitchen arch; on the exterior walls it sits on the plaster skin | bare plaster to the floor on three walls | one continuous dark-oak base ties the walls, the windows and the furniture together | **yes**: the largest single gain (`din-north`, `din-south`, `din-west`, `din-sideboard`) |
| A2 | **Refectory table:** six turned baluster legs with square blocks, a 12 cm apron, breadboard ends, floor stretchers; same top (1.3 × 4.6 at 0.76) and collider | 3.4 cm tapered legs under a 4.6 m top | legs with mass and a turned silhouette | **yes** from the table / entry poses (`din-table`); partly hidden by the chairs from the room ends |
| A3 | **Games corner (NW):** glazed-top games cabinet (board games, card boxes); dartboard cabinet with open doors carrying chalk tallies; brass throw line on the floor; the party table (marshmallows / shots) stays in the corner | one small table against a blank 6 m wall | the room's game identity reads from the hall door and the table | **yes**: the dartboard from 8–10 m (`din-entry`, `din-north`); the cabinet contents only within ≈ 3 m |
| A4 | **Serving console** under D2-010 by the kitchen arch: plate stack, covered tureen, wine, glasses; pot board below | painting alone on the wall | a service point where food comes in from the kitchen | modest: reads as furniture under the painting; its contents close up only |
| A5 | **China cabinet** between the first two south windows: panelled base, a glazed upper with plates and glasses, a cornice and crest | bare pier between the windows | height and depth on the window wall, hosting identity | **yes** from the north end (`din-south`) |

### Kitchen
| # | Change | Before | After | Reads at player eye? |
|---|---|---|---|---|
| K1 | **Fitted work wall:** the north run continues to the back door; three wall cupboard runs (frame-and-panel doors, a cornice) kept clear of the windows and the door (wall-art contract margins); a tiled splashback (cream field, joints, blue border course) along every worktop | the run stopped 2.3 m short of the door; nothing above the counters except the hood | the north wall reads as one designed kitchen wall | **yes** from every kitchen pose (`kit-enter`, `kit-island`, `kit-range`) |
| K2 | **Casework:** frame-and-panel doors on every base unit and the island (stiles and rails 6 mm proud of a recessed field), plain drawer fronts | flat slab doors | panelled joinery | **yes** within ≈ 4 m; flatter from across the room |
| K3 | **Eating zone:** a farmhouse table (turned legs, same top and collider), a braided oval rug, two green enamel pendants (static, the gameplay lamp is unchanged) | a small table in the middle of the tile field | the table is a place; the eating zone separates from the work zone | **yes**: the rug and the pendants are the zone markers from the arch (`kit-through-arch`, `kit-enter`) |
| K4 | **Work-aisle runner** in front of the range and the sink (tinted toward the kitchen's blue-green) | — | the work aisle reads as a zone | yes, at mid distance |
| K5 | **Glazed tile dado** (1.0 m, blue border course) round the free kitchen walls: west (skipping the hatch recess), the arch wall, east either side of the service door | 17.6 m of bare plaster on the west wall | the kitchen's architecture carries its use: the second largest gain | **yes** (`kit-west`, `kit-sw`, `kit-north-end`) |
| K6 | **Peg rail and clock** between the hatch and the dresser: tea towels, a ladle, a sieve | bare wall between the two anchors | a lived-in kitchen wall | close / mid distance |

### Honest limits (not overclaimed)
- Both rooms are still very large (12.6 × 11.6 m and 12.6 × 17.6 m). D3-a gives the walls and the zones structure. It
  does not change the floor-plan scale, which belongs to the blockout.
- Games cabinet and serving console contents, the peg-rail objects and the island door panels are close-up detail. The
  room read comes from the wainscot, the tile dado, the fitted wall, the rugs, the pendants, the dartboard and the
  cabinets' silhouettes.
- The kitchen's west wall above the dado is still plain between the chart, the hatch, the peg rail and the dresser.
  That is acceptable for a working kitchen, and no clutter was added to fill it.

## 3. Construction notes (as built)
- **Refectory / farmhouse table** (`refectoryTable`):
  - The top rests on aprons tenoned into square leg blocks; the turned baluster legs are lathed with 6 sides.
  - Floor stretchers join each end pair, with a centre rail between them.
  - The top datum is exactly 0.76 (unit test), so the game set, beer, candles and the bread board stay seated.
- **Games / china cabinets:**
  - The plinth carries the carcass.
  - Panelled doors are made of real frame members.
  - The upper case has sides, shelves and a back board, with glazing bars on the front and no glass material.
  - A cornice caps it.
  - Both pass the construction audit (unit test plus the browser audit).
- **Wall cupboards:**
  - The carcass is hung on the wall, with the same door language as the base run and a cornice line at 2.4 m.
  - The underside is 0.53 m above the worktop.
  - They are registered with the wall-art contract, which checks the window and door margins.
- **Dartboard:**
  - A wall case carries a board built from stacked rings (double / treble / bull) and 10 cream sectors.
  - Its doors stand open flat against the wall, with chalk tallies.
  - It is registered with the wall-art contract.

## 4. Performance
Doors closed, low quality, against `31c80bf`.

| Set | Δ calls | Δ triangles | Notes |
|---|---|---|---|
| D3-a poses, dining (8) | **0** | **+9.35 k** | cap ≤ +2 / ≤ +12 k ✓ |
| D3-a poses, kitchen (9) | **0 … +1** | **+9.35 … 9.37 k** | cap ≤ +1 / ≤ +10 k ✓. The +1 call: the two new kitchen rugs share the dining rug's batch, which is now in view from the kitchen. |
| room views: dining-a / b | 0 / 0 | +9.35 k / +9.35 k | 76 / 155 k and 98 / 211 k |
| room views: kitchen-a / b | +1 / 0 | +9.37 k / +9.35 k | 63 / 156 k and 128 / 220 k |
| all 84 room views | 0 … +2 | 0 … +22.9 k | maxima **147 calls** and **242,970 tris** (library-b, unchanged); no view over the guide. The +2 calls / +22.9 k are vestibule-b and frontGallery-b (77 / 198 k and 76 / 198 k): the wing's batches are counted twice there. The cause is not isolated (probably a second render pass); both views stay far inside the guide. |

- No new material or texture.
- One draw-call regression was found and fixed on the way: the games-cabinet boxes opened a new prop-atlas batch. Their
  print parts now join the existing no-shadow batch.

### 4.1 Estate-wide effect (important for later batches)
The `mWing` chunk (dining + kitchen) is drawn from many other rooms: the hall, the lobby, the upstairs rooms. Every
triangle added to these two rooms therefore shows in most ground- and first-floor views, not only in the room itself.
D3-a was trimmed from +17 k to about +9.4 k for this reason:
- plain boxes instead of softened boxes where the bevel never reads;
- 6-sided turned legs;
- one plate stack instead of six plates;
- the counters' drawer fronts as plain boxes (≈ −2 k).

**Recommendation for D3-b…f:** before adding geometry to a room, measure which views draw its chunk. A future engine
step could split `mWing` into dining and kitchen regions; that is outside D3-a.

## 5. Validation
Contracts confirmed:
- 130 interactables, 21 checkpoints, save schema 4, all unchanged;
- no decor is interactable;
- untouched:
  - `kitchen.chart`, `kitchen.hatch` + `pk.consKey`, `kitchen.drawer` + `pk.kitchenMatches`, `mem.kitchen.list`,
    `lamp.kitchen`;
  - `inspect.hostingPlan`, `lamp.dining`, the dining candles, D2-005, D2-010;
- the wall-art contract (door / window margins, door sweeps) is clean for the 5 new wall pieces;
- the construction audit is clean.

## 6. Regression results (final build)
One immutable build was used for every check (bundle hash recorded before and after the run: unchanged). The evidence
and budgets were captured from the same build after the tests, never concurrently with them.

| Gate | Result |
|---|---|
| typecheck | clean |
| unit (vitest) | **249 / 249**, including the new `dev04d-d3a.test.ts` (5): table datum and footprint, the leg count, the construction audit, the panel-door facing, the triangle cap |
| e2e:dev04d | 18 / 18 |
| e2e:dev04a | 19 / 19 (wall-art contract incl. the new wall pieces; surface ownership at the sink) |
| e2e:dev04b | 9 / 9 (construction audits) |
| e2e:dev04c | 22 / 22 |
| e2e:dev03 / dev02 / dev01 | 11 / 11, 34 / 34, 34 / 34 |
| full e2e | **103 / 103** |

Two real findings from the suites, both fixed before the final run:
1. **Wall-art contract:** the wall cupboards overlapped the window / back-door margins by 2.5 cm. The runs were shortened
   by 4 cm at the opening sides.
2. **Surface ownership** (z-fighting check at the sink): the new door panel field shared its top and back planes with
   its rails. The field now sits 1 cm inside the frame and 6 mm off the rails' back plane.

## 7. Carry-forward (unchanged by D3-a)
| Item | To |
|---|---|
| S3-017 medallion: much bigger, identity-piece presence; keep the model direction | D3-b |
| S3-014 swallows: not yet the reference intent (form, presence, elegance) | D3-b |
| S3-030 mask: not at reference quality; the current model is not final acceptance | D3-f |
| Portugal cottage paintings: keep the placements, finish the presentation / room presence | D3-f |
| Wickerman full ritual cycle (candles one by one → light → charred → candles out → clean → hay from the bale → refill → reset); subtle feedback, no blocking popup; audio hooks | D4 |
| New from D3-a: chunk-aware triangle budgeting (§4.1); optionally split `mWing` | D3-b planning |
