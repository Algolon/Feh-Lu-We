# DEV-04C-R — Mobile acceptance corrections

Targeted corrections after the owner's real-phone acceptance of DEV-04C (PR #5, merged as `8a4be93`). Scope: the
lake, light sources switching off across room boundaries, the Wickerman candle sequence and its message card. Plus one
recorded (not implemented) DEV-04D backlog item. Nothing else changed: no new interactable ids (still 130), save
version 4 and its keys unchanged, no new UI, pool size unchanged (3 low / 4 high).

**Corrected commit (gated):** `5e99602`. Code: `ef79d33` + `f4a774f`; `5e99602` is test-harness only (F07, §7). Commits after it are documentation / evidence only.

## 1. Lake / water

| Before (`8a4be93`) | After |
|---|---|
| saturated cyan sheet, hard depth step to the shore | muted green-grey: deep `#1d3236` → mid `#304749` → shallow `#566a5f` → rim `#6c6c55`, per-vertex colour over 5 radial rings |
| large high-contrast white ripple ellipses, same shape repeated (decals) | no ripple rings: sparse small glints (hash cells ~31 cm, ~3 % lit, twinkle, stronger only at grazing angles) and a ±3 % low-frequency shimmer |
| opaque to the edge | alpha 0.94 deep → 0.42 at the rim (smoothstep 0.62–1.0 of the radius): the shore reads through the water edge |
| — | fresnel sky tint (pow 5, 38 %) for a cheap, stylised reflection — no realtime reflection, no render target |

Lake-centred coordinates (`vLakeP` relative to the mesh origin), so no world-space precision noise on mobile GPUs.
One mesh, 480 triangles (unchanged order of magnitude), one material (`flw-lake-r`).

Evidence: `review-r/before/l0{1,2,3}-*.jpg` vs `review-r/after/l0{1,2,3}-*.jpg` (landscape 1280×720 and phone portrait
412×915); side-by-side sheets in `review-r/compare/`.

## 2. Light sources across room boundaries

**Audit.**
- *Emissive / flame meshes*: already coherent since DEV-04C. Every flame is owned by its fixture or its host room
  batch and is drawn exactly when that batch is (e2e:dev04c "fire continuity", 75 flame × pose samples). The fixture
  glow follows the logical state, not the light slot (iteration-3 L5). No change needed.
- *Real light contribution*: this was the defect. `LightPool` (3/4 real point lights) only considered lamps of the
  current room and its direct neighbours, with a flat other-room penalty. Step from the living room into the hall while
  looking back at the hearth: the hearth stays on screen through the arch, but its light went 0.88 → 0 at the
  threshold, the abstract room boundary (measured on production, below).

**Smallest shared fix** (`src/interactions/world.ts` `LightPool.update`, `src/world/rooms.ts` `chooseLamps`):
1. Candidates are the lamps of the rooms the renderer can actually show (`RoomGraph.visible`, 2 portal steps, doors
   respected) plus the existing one-step / window set. Closed doors still cut a room off; beyond the visible set lamps
   are never candidates. Genuinely far or hidden lights still cull.
2. *Attention*: a lamp in the view cone with a clear line of sight (`col.segmentBlocked`) accumulates dwell time.
   From 1.2 s to 2 s of continuous viewing it earns a ranking bonus that also lifts the two-step penalty. Dwell decays
   at half speed when out of view. Because a glance or a turn never re-ranks the pool, iteration-3 L2 ("turning never
   reorders the lights") still holds.
3. `chooseLamps` hysteresis is now an incumbent advantage: a lamp already holding a light ranks `keepMargin` (2 m)
   better. Before, every incumbent within the margin of the cut-off was kept outright, so no newcomer could displace a
   near-tie holder, even a source the player was staring at.
4. Hand-over fade-out 30/s → 20/s (a slot changes hands over ~0.1 s instead of a blink).

Pool size, light distance and intensity are unchanged, and no interior light is kept on by default.

**Regression check** (`scripts/dev04cr-lightcases.js`, run by `e2e:dev04c` and the `dev04cr-lightwalk.mjs` probe).
The check walks with the real controller across four room boundaries while facing a lit source, then holds for 3 s.
Two rules:
- *continuity*: once a visible source holds ≥ 50 % of its light, it never drops below 50 % while it stays visible;
- *reach*: a source in continuous clear view for 2.5 s holds ≥ 50 %.

| Walk | Production `8a4be93` | This build |
|---|---|---|
| living→hall, looking back at the hearth | **fails** (drops 105, late 64/64)<br>`living:0.83 living:0.88 hall:0 hall:0 hall:0 hall:0` | passes (drops 0, late 0/64)<br>`living:0.79 living:0.88 hall:0.88 hall:0.85 hall:0.8 hall:0.87` |
| dining→hall, looking back at the table candles | passes (drops 0, late 0/59)<br>`dining:0.9 dining:0.94 hall:0.87 hall:0.88 hall:0.92 hall:0.92` | passes (drops 0, late 0/59)<br>`dining:0.89 dining:0.92 hall:0.93 hall:0.86 hall:0.89 hall:0.94` |
| BOSLUST passage→entry, looking at the descent sconce | passes (drops 0, late 0/81)<br>`passage:0 passage:0 entry:0 entry:0.96 entry:1 entry:1 entry:1` | passes (drops 0, late 0/81)<br>`passage:1 passage:1 entry:1 entry:1 entry:1 entry:1 entry:1` |
| upper corridor→landing, looking at the hall chandelier | passes (drops 0, late 0/69)<br>`ucorr:0(hidden) ucorr:0 landing:0.72 landing:1 landing:1 landing:1 landing:1` | passes (drops 0, late 0/69)<br>`ucorr:0(hidden) ucorr:0 landing:0 landing:0.84 landing:1 landing:1 landing:1` |

Trace: room and the source's light share (0–1), sampled every 0.8 s. Production fails exactly the reported symptom:
the hearth goes dark at the arch while it is still in view. BOSLUST: the sconce two rooms down the tunnel now has its
light from the passage onwards, where before it lit only after entering the entry. Corridor: see §7.

Iteration-3 lighting contract still green (`E2E_ONLY=lighting`, 6/6): L2 "looking away and back does not toggle or
reorder lights" (0 changes) and L4 "closed door blocks / open door lets through" both pass. These two rejected the
first version of this fix (`ef79d33`), whose view bonus was instant and whose incumbents could not be displaced; that
is why `f4a774f` exists.

Frame evidence: `review-r/{before,after}/r-hall-looking-back-at-hearth.jpg`, standing in the hall looking back at the
living-room hearth. The hearth holds a light: before 0 (`fire.living` not assigned), after 10.39 (assigned).

## 3. Wickerman candles

- **Sequential ignition**: one action ("Kaarsen aansteken", carrying matches is enough; no need to select them)
  starts a 3.6 s sweep round the ring from the candle nearest the player. Each candle's flame and floor glow appear in
  turn (`aOrder` attribute vs `uReveal`), and the clearing light ramps with the sweep.
  e2e: lit count per 0.2 s `1 1 2 2 3 3 4 4 5 5 6 6 7 7 8 8 9 9 9 …`, full at 3.4 s.
- **No message card**: every Wickerman toast removed. The prompt carries the state ("Stroman — eerst de kaarsen" while
  the ring is unlit, "Stroman aansteken" once it burns, "Verkoolde stroman" after); the change itself is the feedback.
  e2e asserts no toast on gating, lighting and ignition.
- **Flow unchanged**: unlit → sequential ignition → ring lit → figure ignitable → burn → permanent aftermath. Save keys
  `wicker.candles` / `wicker.figure` (version 4) unchanged; a reload restores the ring fully lit (no replay of the
  sweep) and the aftermath. A pre-DEV-04C save loads unlit.

Evidence: `review-r/compare/w-candles-{0_3,1,1_8,2_6,3_8}s.jpg` (production above, this build below), captured
with the toast layer visible and the same plain action (matches carried, not selected). On production that action
lit nothing and raised a message card (`toast: true` at 0.3 s in `before/views.json`). With matches selected, the
whole ring switched on in one frame. On this build the ring lights candle by candle (1 → 4 → 7 → 9) and no card
appears.

## 4. Performance delta

Low quality (the phone default), SwiftShader software rendering, 1280×720 unless stated.

**Draw calls / triangles: unchanged.** The lake is still one mesh and one material (480 triangles); no geometry was
added anywhere. Same counts before and after in every evidence view:

| View | Production | This build |
|---|---|---|
| l01 lake approach | 38 / 133,581 | 38 / 133,581 |
| l02 lake shore | 38 / 127,056 | 38 / 127,056 |
| l03 lake close | 50 / 145,541 | 50 / 145,541 |
| l01 / l02 / l03 phone 412×915 | 32 / 98,351 · 33 / 86,939 · 21 / 82,394 | identical |

`e2e:dev04c` render-budget check: all 28 budget views inside the mobile guide (golfSpur ⚠ 90 / 261 k, unchanged and
pre-existing).

**Fragment cost** (`scripts/dev04c-frametime.mjs`, median ms per `render()`, two alternating rounds per build):

| View | Production (round 1 / 2) | This build (round 1 / 2) | Δ mean |
|---|---|---|---|
| gate (driveway) | 906 / 922 | 954 / 878 | ±0 % |
| living room | 428 / 454 | 456 / 443 | +2 % |
| lake approach | 368 / 423 | 374 / 360 | −7 % |
| woodland route | 1010 / 946 | 1014 / 974 | +2 % |
| arrival | 638 / 563 | 620 / 665 | +7 % |

Every difference is inside the run-to-run spread of the same build (up to 15 %), so there is no measurable regression.
This container is several times slower than the one DEV-04C was measured in, so compare within a column pair only.

**CPU**: the light ranking still runs 4× per second. Per candidate lamp it adds one dot product and, for lamps in the
view cone within 24 m, one collision segment test. Not measurable in the frame times above.

**Shader compile** (first frame after a quality switch, 3 alternating runs): production 5.39 / 5.22 / 5.23 s, this
build 5.34 / 5.53 / 5.75 s, about +5 % (98 programs either way). This is the one-off recompile, not a per-frame cost.

## 5. Tests

Final gate on **`5e99602`** (exact commit, clean tree before and after, `scratchpad` script `gate-r.sh`):

| Step | Result |
|---|---|
| typecheck | pass |
| unit (vitest) | 218 / 218 |
| clean production build | pass |
| `e2e:dev04c` | 22 / 22 (incl. candle sequence, no message card, one action, lake material, room-boundary light continuity, 130 ids) |
| `e2e:dev04b` | 9 / 9 |
| `e2e:dev04a` | 19 / 19 |
| `e2e:dev03` | 11 / 11 |
| `e2e` (full, iteration 1–3 incl. lighting L1–L6) | **98 / 100**: two touch checks fail on tap timing in this container (§7); all lighting L1–L6 and F07 pass. Failed the same way in a full re-run; passes 10 / 10 when the touch suite runs alone (2 runs) |
| `e2e:dev02` | 34 / 34 |
| `e2e:dev01` | 34 / 34 |

Focused checks added in this pass:
- unit (`tests/dev04c.test.ts`):
  - the candle sweep length and every intermediate count;
  - LightPool: a source you keep looking at takes a light; a glance does not; no view → no change; a closed door
    or blocked line of sight → no light;
  - `chooseLamps` (`tests/rooms.test.ts`, unchanged expectations) still holds with the incumbent-advantage rule;
- `e2e:dev04c`:
  - the candle sequence (monotone, ≥ 5 distinct counts, full at 2.5–4.5 s);
  - no message card on gating / lighting / ignition;
  - one-action lighting from an old save;
  - the lake material compiled with ≤ 480 triangles and per-vertex alpha;
  - four room-boundary light walks (continuity + reach).

Earlier gate on `f4a774f` (the code commit): identical results except full `e2e` 102 / 103. The failure was F07, the
harness timing issue in §7, fixed test-only in `5e99602`.

## 6. DEV-04D backlog (recorded only — not implemented)

**D-BL-01 — The social board-game table: a played evening, not a set table** *(owner, DEV-04C-R acceptance; not
started)*

- **Where** (confirmed by the owner): the long table in the eat / game room, the room immediately to the right when
  you enter the manor and look in from the hall. In code: `ES.gameTable`, `src/world/manor.ts` around the
  `boardGameSet(c, 101.3, 84.35, …)` call, ground floor.
- **Today**: the home-made duo game (board, pawns, two dice, card piles), a score pad and 3 beer bottles at the table's
  south end. Marshmallows (one bowl) and 4 shot glasses stand on a separate small side table (96.2, 90.6).
- **Wanted**:
  - **≥ ~15 beer bottles**, naturally varied: mostly empties with a few still in use, some standing, one or two
    tipped over, a few labels turned away, slight height / tint variation. Clustered where people sat (by the seats,
    near the players' hands, a knot of empties at the table end), not spread evenly.
  - **Shot glasses** (several, some empty, one or two upturned) next to **one bottle of strong liquor**.
  - **Marshmallows / a marshmallow bag** on the table: an opened bag with a few loose ones.
  - Keep the **board game / cards / dice identity** readable: the board stays the focal point and nothing covers it.
- **Constraints**:
  - Hand-placed or seeded-jitter clusters only; no grid, ring or evenly spaced procedural placement.
  - Reuse the existing bottle / cap / glass geometry (`bottleGeoOf('beer')`, `capGeo`, `shotGlass`) through the
    chunk batch (`Asm`). No new interactables, no new save keys.
  - The dining views stay inside the mobile guide (today `dining` 59 calls / 133 k triangles).
  - Decide whether the side table's marshmallow / shots group moves to the big table or stays as a second spot.

Also recorded in `DEV04C_ATMOSPHERE_REPORT.md` §12 (Deferred to DEV-04D).

## 7. Known limits

- The attention bonus is deliberately not instant: a source two rooms away that has just come into view gets its light
  after ~1.5–2 s of looking (fading in, not popping). Example: the hall chandelier from the upper corridor. This is the
  price of L2 (no reordering on a turn); it is within the 2.5 s reach rule. In that one walk it arrives ~0.8 s later
  than on production, which lit it only on entering the landing.
- **Lake at a grazing angle**: from the far approach (l01, phone) the water reflects the pale horizon and reads as a
  light grey-green band. That is physically plausible, but it is the likeliest owner remark ("still flat"). The lever
  is one constant: the fresnel sky mix in `lakeMaterial()` (`fr*0.38`, e.g. → 0.25 with a deeper horizon tint). Not
  changed here, to keep the correction targeted; the closer views (l02 / l03) show the depth gradient and shoreline.
- **Test harness, F07** (`scripts/e2e.mjs`, `5e99602`): this container renders at ~1–1.6 s per software frame, and
  the recompile after a quality switch takes 5–12 s. F07 credits playtime per frame to the modal open when the frame
  ends, and its fixed 4 s / 3 s windows caught the wrong frames: it failed on **production** in 3 of 4 runs and on this
  branch in every run. The windows are now frame-aware (two frames after each state change, then ≥ 3 s and ≥ 3
  frames); same assertion and thresholds. Passes on both builds. One production run also dropped F05 (a tap timing
  check) for the same reason; not seen on this branch.
- **Touch tap timing in the full `e2e`** (open item for the merge decision): the game counts a tap only if
  pointer-down and pointer-up are < 350 ms apart, measured with `performance.now()` in the handlers
  (`src/player/input.ts:133`, `:169`). Here one software frame takes 1–1.6 s, so when a frame lands between the two
  events the tap reads as a press. Results on this branch:
  - full `e2e` on `5e99602`: "direct tap on a visible nearby object" and the follow-up `page.tap` fail, in both runs;
  - touch suite alone: passes 10 / 10, in both runs;
  - `regressions` then touch: fails the same way.

  On production in the same order, the touch suite passes but F05 ("stationary tap … interacts") fails, the same
  mechanism hitting a different check. It is order- and timing-dependent; this pass changed no input code, and the
  `f4a774f` full run passed the touch suite. On a phone a frame takes 16–33 ms. Not changed here: the robust fix would
  be in the input code (measuring with the event's own `timeStamp`), which is outside this correction's scope.
- SwiftShader is a fill-rate proxy only; the owner's phone check decides the final look and cost.
- RSV-019–022 untouched (PENDING); no FLW-D2 / S3 / K3 content fabricated.
