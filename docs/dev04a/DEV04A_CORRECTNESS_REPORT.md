# DEV-04A — Visual correctness & spatial cohesion

Core rule of the pass: **every visible object has an understandable support, a valid functional clearance zone and a
stable visible surface.** DEV-04A corrects the cases in scope, adds the rules that make the same errors detectable
(and mostly impossible) again, and stages four owner-directed changes. It is not an art pass: no estate remodel, no
furniture redo, no reference rollout (that is DEV-04B).

## 0. Start point

| | |
|---|---|
| Start branch / SHA | `ccr-f194a21e-4vikj0` @ `2b46ae030ffbd7f8b6ea8f914312202ba46e39e5` (DEV-04 reference pack) — verified 0 commits behind the default branch `ccr-75ef4113-kfkimm`; its only diff to it is `docs/reference/dev04/` with the six generated sheets |
| Work branch | `claude/trusting-cray-e31s8e` (reset to `2b46ae0`). The brief suggested `dev04a-visual-correctness`; this session's tooling only allows pushing to its assigned branch, so the work lives there. The draft PR targets `ccr-75ef4113-kfkimm` and therefore contains the reference pack + DEV-04A |
| Read first | DEV-04 reference pack (`docs/reference/dev04/`: handoff, personalized boards, the six sheets — copacabana room, attic observatory, wickerman clearing, …), DEV-03 rollout + audit, DEV-02 blockout, design v0.2 `LEVEL_PLAN` / `LEVEL_LAYOUT.json` |
| Not done | no merge, no deploy, no DEV-04B work |

## 1. Before-edit audit (first person, eye height)

Captured on `2b46ae0` before any code change with `scripts/dev04a-views.mjs` (1280 × 720, eye 1.65 m over the support
surface under the pose, low quality; frames + draw counts in [`before/`](before/)). Each target was then traced to its
cause in code, and the same error class was searched estate-wide (marked **+**: further instances the brief did not
name).

| Area | OBSERVED | Cause in code | Correction | Validation |
|---|---|---|---|---|
| Sterrenkamer door (01) | the gallery landscape hung **in** the Sterren doorway; with the door open it floated in the opening | paintings placed by hand-typed coordinates, no knowledge of openings | wall-decor contract (`openings.ts`) + painting moved to the free wall between the Reis and Sterren doors | `wallArtConflicts()` = [] estate-wide (unit + browser) |
| Dining window (02) | the landscape covered the north window's glass and curtain | same | painting on the free north wall | same |
| **+** upstairs botanic prints | first print overlapped the window at z 83 | same | the four prints use the wall between the windows | same |
| **+** landing sconce | the wall sconce hung in the rear-nook arch | same (sconces were outside the contract) | sconces registered as wall decor; sconce moved to x 93.7 | same |
| Raised thresholds (05, 05b–e) | a knee-high stone band ran across the front door, both garden doors, the service door, the yard door and the door into the Copacabana Room; inside the wing it ran through the rooms | the facade **plinth course** (stone to +0.62 m + a +0.70 top band) was built as four unbroken boxes round the footprints | plinth runs stop at every door opening and only exist on exterior faces; a dressed stone `threshold()` (top +12 mm, walkable) fills the wall depth. Classified: these were **door** thresholds (wrong) — window sills are correct and untouched | walks through every door both ways (max step ≤ 0.2 m), every registered door opening clear from its threshold up |
| **+** Portugal cottage door | 27 cm sill in the doorway; the room's floor (+4.15) was buried under a blue surface | the **barra** was one solid box over the whole footprint (top +4.42) | barra = a band on the four outer wall faces, stopping at the door; threshold | walk path → landing → terrace → door → room |
| Conservatory double door (04, 04b–d) | open, the passage still had the glazing's sill / knee / transom rails across it and a mullion in its middle; the head beam cut through the top of the leaves | the glazed wall `gw()` was built as continuous rails and posts every 2 m, ignoring the opening | `gw()` takes door gaps: no posts or rails inside, jamb posts at the gap, head beam on top of the leaves, glass fanlight above; opening registered | exact triangle–box clearance of the opening (all doors open); three walked lanes across its width, both directions; closed / half / open captures |
| Kitchen sink (03, 03b) | the basin flickered into shifting triangles with every small camera move; worktop and carcass ran through the sink | a dark "basin" quad drawn **in** the solid sink box's top face (coplanar, both +0.905) | worktop cut-out in `counter()`; `farmhouseSink()` = apron, back, sides, bowl floor 22 cm down, drain, bridge tap — every face on its own plane, rim 5 mm proud | coplanar-surface check in the sink region = 0 |
| Woodland hut logs (14) | the log pile hung ~0.5 m in the air beside the hut | `cyl()` takes the **base** height of an upright cylinder; tipped onto its side its centre lands at y0 + h/2 — every lying log built through it floats by half its length | new centre-based `rod()`; tipped long `cyl()` calls are reported (`supportWarnings`); a stacked log store against the hut's east wall (rows in the grooves of the row below, end stakes) | `supportWarnings` = [] (browser), guard unit-tested |
| **+** same class | fire-pit firewood (+0.57 m), the shed's kindling (+0.3 m), the hall tapestry rod (1 m over its hanging), the basement pipe runs (~15 m up, above the ridge), the well's winch axle (inside its roof), the base-path hearth logs | same | all centred with `rod()` on their supports. BOSLUST's tunnel battens were already centred (calibration zone unchanged) | same |
| **+** golf chute | side beams rode 10 cm above the slope on nothing | no supports authored | stakes at every joint, catch tray at its foot | capture 13b |
| Forest path → forecourt (15, 15b) | two brown slabs lying on the gravel court, square ends | `drape()` drew every path ribbon on top of everything it crossed | path ownership network (`junctions.ts`): forest paths stop at the arrival gravel with a flared mouth cut flush to its edge and blend to the gravel's tint | coplanar check at both mouths = 0; routes walked |
| Portugal path → terrace (12, 12b) | the path ran under a loose 8 cm tile slab; two routes overlapped at the terrace corner | separate builders each drew their own ground | one tiled landing (`COTTAGE_LANDING`) owns the ground where both routes arrive and rises over its last 1.1 m to the terrace; routes clipped at its edge | walked (no lip > 0.2 m), coplanar = 0 |
| Golf spur → tee (13) | the spur ended as a square slab across the tee mat; the mat lay in the path's plane | same | spur clipped at the mat with a mouth; mat 1 cm above the path layer | walked onto the mat, coplanar = 0 |
| **+** other junctions | lake-view route over the gravel bay, lantern-lawn three-way, wickerman loop → east forest path, BBQ approach → terrace / wellness path all overlapped | same | resolved by the same network (one owner per patch of ground, rank lifts 5 mm apart, free ends taper) | unit: no ribbon row inside a hard surface; captures 16, 17 |
| Copacabana Room (06, 06b) | a personal name board in the service corridor and one on a post outside the glazing; nothing at the bar | — (owner direction) | one carved "Copacabana Room" sign on the bar canopy (uprights + cap rail) | capture 06 |
| Sauna access (07, 07b) | an 8 m ramp with rails dominated the small barrel sauna | v0.2 `SAUNA_RAMP` | landing + three steps (owner direction, §4) | walked up to the sauna floor; dev02 metrics test updated |
| Attic (08, 08b, 09, 09b) | partitions stopped flat at the lowest roof point → metre-high gaps under the slopes; the lookout was a box with a telescope pointing into the room, no window; the outside showed no observation window | `wall()` could only build a flat top; nook bounds stopped short of the usable roof volume | §5 | walk up S03 → common → nook → operator spot; unit sightline test |
| Wickerman (10, 10b, 11) | the figure stood **on** the loop, an obstacle in the through-route | the v0.2 clearing centre was a loop vertex | §6 | loop walked over the old spot; side path walked into the clearing; no tree in clearing |
| **+** doors loaded open | a door that a save had left open vanished (and could not be targeted) from one side once closed — found on the cottage door by the new suite | culling rooms were sampled round the leaf's pose at load | rooms sampled round the closed leaf | reticle check on the cottage door from its terrace |
| **+** coplanar faces found by the suite | door linings vs reveals, architrave edges vs skirting / wainscot ends, plinth blocks vs skirting, stair risers vs the step mass (every stair), glass-door rails vs stiles, conservatory rails vs jamb posts, sauna landing vs barrel cap, cottage landing cheek vs ramp | pieces authored to the same plane | 4–10 mm offsets / shortened pieces so each visible face has one owner | coplanar check per region = 0 |

## 2. Systemic vs local fixes

**Systemic (rules + shared code — new instances are caught or impossible):**

- **Opening & wall-decor contract** — `src/world/openings.ts`. `wall()` registers every door/passage opening and window,
  `makeDoor()` registers each leaf's swept zone, `painting()` / `canvasPanel()` / sconces register their wall footprint.
  `wallArtConflicts()` rejects art over a door (+ architrave margin), a window (+ frame / surround / sill margin) or in
  a sweep. The estate build publishes the registry; the browser suite fails on any conflict.
- **Door thresholds** — `threshold()` in `arch.ts`; the plinth course / barra are built from runs with door gaps.
- **Glazed walls with doors** — `gw()` gap model (no posts / rails in a gap, jambs, head on the leaves, fanlight).
- **Support** — `rod()` (centre-based) for everything lying; `cyl()` reports tipped long cylinders.
- **Ground ownership** — `src/world/junctions.ts`: one owner per patch of ground (hard surfaces > driveway > forest
  paths > routes by rank); ribbons are clipped at owners, flare into mouths cut flush to the owner's edge, taper at free
  ends, and sit on distinct lifts. Replaces the old draw-everything-on-top drape.
- **Joinery offsets** — door linings 4 mm proud of the reveal, architrave legs 5 mm back (quirk), plinth blocks 1 cm
  proud, stair risers 4 mm proud of the mass: one change in `arch.ts` fixes every door and stair.
- **Sloped wall tops** — `wall({ top, kinks })` builds partitions that follow a roof profile (slanted slabs + colliders).
- **Door culling by closed pose** — `World.setupCulling` samples rooms round `userData.cullCentre` for doors.

**Local (authored placement):** the moved paintings / prints / sconce, the kitchen sink module, the hut log store,
the golf chute stakes, the cottage landing, the Copacabana sign, the sauna steps, the attic plan, the wickerman
clearing.

## 3. Owner-directed changes

- **Copacabana Room sign** (reference `copacabana_room_sheet_v01`, sign-mounting detail): the corridor board and the
  outdoor post board are removed; one carved timber sign (warm wood, teal border, cream lettering) stands on the bar's
  canopy on two uprights with a cap rail, facing the pool and the room. Bar position, construction and colliders
  unchanged.
- **Sauna access**: the barrel sits 0.15 m lower on its cradles (`SAUNA_FLOOR` 0.80 → 0.65; the interior moves with it
  rigidly — benches, heater, board and door unchanged relative to the floor), so the door is 0.5 m above the deck.
  `SAUNA_STEPS`: a 1.4 × 0.9 m landing at the door and 3 risers of 0.167 m (0.21 m going) — 1.5 m of access instead of
  8 m of ramp; stair kit (treads, risers, strings), open-sided, handrail on the east side, the landing cannot be
  climbed from the side. Deviation from v0.2 documented in `tests/dev02.test.ts`.

## 4. Attic decisions

Reference: `attic_observatory_sheet_v01` and the attic partition / observatory-window refs.

1. **Partitions meet the roof.** Every attic partition encloses a room (or the void beside the stairwell), so every
   one now runs up to the roof's underside along its whole length (sloped tops between the hip / ridge break lines,
   tucked 4 cm past the inner skin). The only openings are the existing arches (common ↔ nook, nook ↔ landing) and the
   stair exit.
2. **Use the roof volume.** The lookout becomes the **observation nook**, extended east to x 103.6 (a 2.16 m knee
   wall); headroom ≥ 2.1 m everywhere (DEV-02 contract). Room id `atticLookout` kept, bounds x 95–103.6.
3. **A real window.** `ATTIC_ROOF_WINDOW` in the east slope over the nook: the inner roof skin is rebuilt face by face
   with the opening cut out, a lined reveal through the roof depth, a sash with clear glass in the roof plane; outside
   a timber frame, dark glazing and a lead apron on the slates — the same opening seen from both sides.
4. **Telescope with a sightline.** The telescope stands at the operator spot under the window, aimed east and raised
   0.95 rad; its line of sight leaves through the window (unit test against `roofUnderside`). Model fix: the tube used
   to face away from its yaw with the eyepiece under the dew shield; it now points along yaw with the eyepiece at the
   low back end. An observer's stool. The Sterrenkamer telescope is aimed at its west window.
5. **Structure organises the volume.** Ridge beam, crown and hip rafters, four king posts under the ridge (the old
   posts stood in the nook arch and in the operator's space).
6. **Inside ↔ outside.** The window is the only new exterior element; dormers are unchanged.

## 5. Wickerman clearing decision

The figure stood on the loop. The loop is now a clear through-route and the figure has its **own enclosed clearing**
(r 6 m, +1.2 m like the loop there) east of it at (180, 55), reached by a short profiled side path (`WICKERMAN_SIDE`)
that leaves the loop, passes the hedge and enters at the clearing's north-west rim. The line of sight from the loop
crosses hedge (a second dense hazel / holly ring and an unbroken hedge arc on the loop side; the path mouth stays
open), so the figure is revealed on the side path. Staging per `wickerman_clearing_sheet_v01`: dry-stone plinth,
sleepers under the feet, straw-bundle limbs joint to joint from a shoulder yoke, the candle ring on flat stones 1.9 m
clear of the plinth, a log bench east, a stake lantern at the path mouth. **No** fire states, ignition or puzzle logic
(those stay where they were); the final figure remodel is DEV-04B. Trees, saplings and small woodland keep out of the
clearing and its path.

## 6. Validation added / changed

- **`npm run e2e:dev04a`** (`scripts/e2e-dev04a.mjs`, 19 checks, results in `scripts/out/dev04a/`):
  1. wall-art contract estate-wide; the moved paintings / removed boards / bar sign present;
  2. support contract (`supportWarnings` empty);
  3. **openings**: every registered door / passage opening is clear from its threshold up to its head with all doors
     open — exact triangle–box test against the drawn geometry (45 openings; two whose floor is not level across the opening — the BOSLUST
     hut door and the tunnel passage, both untouched by DEV-04A — are left out of the box test and reported);
  4. **surface ownership**: no same-facing coplanar overlapping faces of a different look (material + colour) in the
     sink, front threshold, double door, cottage door, cottage landing, golf mat, both forecourt mouths and sauna steps
     regions; faces that look into solid geometry or a closed pocket are excluded (ray test), decals (the path verge)
     are drawn over by design;
  5. **walks** with the real player controller: front door both ways, garden doors, service door → wing →
     Copacabana door → double door in three lanes → sauna steps → sauna floor, workshop yard door, Portugal path →
     landing → terrace → door → room, S03 → attic common → nook → operator spot (knee wall stops you), wickerman loop
     over the old figure spot + side path into the clearing (figure solid), golf spur → tee mat;
  6. reticle reach of the interactables in the touched areas (sauna door / heater / board, double door from both
     sides, attic store, cottage door, Sterren door, kitchen drawer, dining plan);
  7. wickerman relocation: no tree / bush / stump in the clearing or on its path, hedge screen present;
  8. **no id regression** against `scripts/dev04a-baseline.json` (taken from the pre-DEV-04A build: 128 interactables,
     21 checkpoints, save keys, save version 4);
  9. render budgets per DEV-04A view vs the pre-DEV-04A build (§8); 10. legacy save poses on changed surfaces load
     onto valid support; 11. no page errors or contract warnings.
- **`tests/dev04a.test.ts`** (11 tests): wall-art rules (door, architrave margin, window, other axis, sweep), path
  network (clip at owners, no ribbon on a hard surface, no route clipped away), sauna step metrics, telescope sightline
  through the roof window, wickerman clearing / side path, cylinder support guard.
- Changed for owner-directed deviations from v0.2: `tests/dev02.test.ts` (sauna floor 0.65, steps metrics instead of
  ramp, wickerman record, atticLookout bounds), `scripts/e2e-dev02.mjs` (steps / landing / side check),
  `scripts/e2e.mjs` (sauna floor threshold).

## 7. Test results

{{GATE}}

## 8. Performance / render counts (low quality = mobile guide ≈ 150 calls / 250 k triangles)

Measured by `npm run e2e:dev04a` (check 9) on both builds in the **same** state: low quality, front door, Copacabana
double door and attic stair door open, all other doors closed, identical poses (the pre-DEV-04A numbers are in
`scripts/dev04a-baseline.json`). The brief's representative views: attic, conservatory / wellness, Wickerman clearing,
front forecourt, Portugal terrace / golf.

| View | before calls / tris | after calls / tris | Δ calls | Δ tris |
|---|---|---|---|---|
| Attic observation nook | 35 / 95,802 | 38 / 96,178 | +3 | +376 |
| Attic common room | 36 / 105,710 | 36 / 105,926 | +0 | +216 |
| Copacabana Room → double door | 77 / 132,984 | 73 / 126,740 | -4 | -6,244 |
| Deck → double door | 142 / 207,920 | 142 / 207,986 | +0 | +66 |
| Wellness deck | 69 / 151,767 | 64 / 147,311 | -5 | -4,456 |
| Sauna access | 148 / 225,826 | 147 / 225,864 | -1 | +38 |
| Wickerman clearing | 26 / 162,702 | 30 / 145,281 | +4 | -17,421 |
| Wickerman path (loop) | 30 / 181,464 | 33 / 196,693 | +3 | +15,229 |
| Front forecourt | 146 / 251,342 | 146 / 249,892 | +0 | -1,450 |
| Arrival court | 140 / 247,884 | 140 / 246,434 | +0 | -1,450 |
| Portugal terrace | 31 / 91,537 | 31 / 90,809 | +0 | -728 |
| Portugal approach | 32 / 119,009 | 32 / 118,281 | +0 | -728 |
| Golf vicinity | 48 / 183,281 | 48 / 185,725 | +0 | +2,444 |
| Golf spur | 92 / 257,332 | 94 / 262,162 | +2 | +4,830 |

- Every view that was within the guide stays within it; the only view over it (golf spur, 257 k triangles before) grows
  by 1.9 % (chute stakes, catch tray, path mouths).
- Draw calls went **down** in the Copacabana Room (77 → 73) and on the wellness deck (69 → 64): the wickerman clearing's
  meshes are their own chunk drawn within 40 m (merged into `grounds` before, their bounds spanned the estate).
- +3 calls in the attic nook (the roof window's lining, sash and stool), +4 in the clearing and +3 on the loop near it
  (the clearing's own chunk and the second hedge ring).
- Three batching regressions found during the pass were fixed before measuring: the roof window's exterior parts were in
  the attic batch (+ calls in every attic view), the wickerman pieces stretched the `grounds` mesh, and the new path
  ribbons were twice as dense as the old drape (now ~1 m rows, 0.5 m near ends).

The full per-view capture set (47 poses, door state of the evidence script — every relevant door open) is in
[`before/views.json`](before/views.json) and [`after/views.json`](after/views.json). Comparing those two files is only
valid for views whose state is not order-dependent: e.g. the Portugal terrace pose reads 31 → 47 calls there, but
measured fresh in the same state both builds draw 47 (the cottage interior through its open door); the before capture
run had the interior culled.

## 9. Save / ID status

- Save schema unchanged (version 4), no migration. Every interactable / door id (128), checkpoint (21) and save key of
  the pre-DEV-04A build is present, none added or removed (suite check 8). No puzzle logic, story or canonical
  room / item / puzzle id changed; room `atticLookout` keeps its id with wider bounds.
- Legacy poses on changed surfaces (old sauna ramp, old sauna floor height, old wickerman spot, old lookout, old cottage
  ramp) load onto valid support (suite check 10).
- Estate 200 × 180 m and the manor footprint unchanged.

## 10. Before / after evidence

{{EVIDENCE}}

## 11. Known remaining visual issues

- **Attic dormers**: the exterior dormers are unchanged; with the partitions now meeting the roof they light the void
  behind the knee walls (eaves storage), which is not reachable or visible from the rooms. No dormer interiors yet.
- **Wickerman from the loop**: from the old figure spot (capture 11) the head of the figure can be glimpsed through
  foliage at the edge of the view; it is revealed properly only on the side path (11c). Denser screening would be a
  DEV-04B staging decision.
- **Mid-swing evidence**: the capture script's "half open" pose (04c) does not hold the leaves mid-swing on either build
  (identical to fully open); the double door is evidenced closed (04d) and open (04, 04b) and walked in three lanes.
- **Coplanar check scope**: the surface-ownership check runs on the corrected regions (sink, thresholds, double door,
  cottage door / landing, golf mat, forecourt mouths, sauna steps), not as an estate-wide z-fighting sweep. Coplanar
  overlaps of the same material and colour are not counted (they shade identically). The pre-existing deck cut-out
  under the sauna barrel is out of sight and left as is.
- **Views over the low triangle guide** (250 k) before DEV-04A stay over it, unchanged within ±3 %: Sterren gallery
  (01/01b), front porch (05), billiard garden door (05e), forecourt (15/15b, p2), sauna deck (07). None of them went
  over the call guide because of DEV-04A.
- **Wickerman path views** carry +13–14 k triangles (+8 %) and +3 calls: the second hedge ring, the hedge arc and the
  clearing itself, all still far under the guide (≤ 36 calls, ≤ 212 k).
- BOSLUST's tunnel battens were left exactly as they were (calibration zone).

## 12. Deferred to DEV-04B (explicitly not done here)

- Reference rollout of the six DEV-04 sheets beyond the owner-directed pieces (Copacabana Room as a whole, living /
  dining furniture families, attic observatory dressing, …).
- Final Wickerman remodel, candle / ignition visual states and fire; any puzzle hook there.
- Furniture redo, book family, painting replacement (paintings were only moved), gingerbread maquette, clutter.
- Notebook redesign; any story / puzzle change.
- Dormer interiors / eaves storage behind the attic knee walls (the dormers still light the void behind them).
- Estate-wide triangle trimming for views that were already over the guide before DEV-04A (golf spur).
