# DEV-04D — Estate-wide room & zone audit (D0)

> **D0 PAUSED, PROVISIONAL (owner instruction, 10 Oct 2026).** The owner confirmed that the later FLW-D2, FLW-S3,
> FLW-K3 and partial FLW-RSV reference images exist: they were generated and approved in separate project chats and
> were never committed. Every "not available" / `WAITING_FOR_SOURCE` statement below describes **the repository at
> `6c5e5c6` only**, meaning *not yet imported*, not *does not exist*. The asset manifest, the D1 / D2 plan, the phase
> order (O1), the priorities and the owner decisions are **not final**. They will be reconciled against the imported
> FLW reference library. The room audit, captures and Wickerman design are preserved as working notes.

Production `6c5e5c6`, audited 10 Oct 2026 at normal first-person eye height (1.65 m above the support surface).

**Evidence**: `docs/dev04d/audit/*.jpg` (124 captures, `views.json` with room / draw calls / triangles per view),
made with `scripts/dev04d-audit-views.mjs`:
- `r-<room>-a|b`: every authored room from two inner corners, generated from the live room graph, every door open;
- `x01–x34`: exterior and destination views;
- `h01–h06`: hero details.

Low quality (the phone default), 1280 × 720, SwiftShader. The same script re-run on a D commit gives matched before /
after frames.

Priority: **P0** broken / actively undermines quality · **P1** highly visible / major identity opportunity ·
**P2** worthwhile refinement · **P3** acceptable / optional, or intentionally restrained. Equal prop density
everywhere is **not** the goal: several areas below are deliberately rated P3 *because* their restraint is right.

Storytelling intent per room is already canon in `docs/design/v0.2/ENVIRONMENT_STORY.md` §5–6 (who uses the room,
focal point, puzzle-evidence limits, PF / GW / SI / FI provenance). D3 implements against that table. This audit says
where the build falls short of it.

---

## 0. Cross-cutting findings

| # | Finding | Where | Prio |
|---|---|---|---|
| X1 | **Big rooms, small islands.** The v0.2 manor rooms are large (dining 12.6 × 11.6 m, kitchen 12.6 × 17.6 m, study / botanic room 6.3 × 15.6 m, Sterrenkamer 12.6 × 7.2 m). The furniture is one island or one end-cluster, so most of the floor is dead space with no story. D3's main lever is **zoning** (a second use cluster, rugs that define zones, furniture that faces something), not scatter | dining, kitchen, study, botanic room, bedrooms, attic | P1 |
| X2 | **Generic placeholder paintings.** 8 wall paintings share one 4 × 2 procedural atlas (sky gradient, hill line, dark blobs, 128 × 96 px), and two images repeat (living = north guest room). They are the clearest placeholder read in the manor. Waiting for FLW-D2 (manifest §5) | hall, living, dining, landing, walkway, guest room | P1 (blocked) |
| X3 | **Unframed "mirrors"**: bathroom and guest WC carry a frameless emissive light-blue box that reads as a blank white panel (`manor.ts:603`, `manor.ts:1119`) | bath, guest WC | P1 |
| X4 | **Everything stands on its marks.** Chairs in perfect rows, beds made, tables "set": almost no use traces (pushed-back chairs, a mug, an open bag, a coat over a chair). Matches the brief's "people actually used it" gap | manor-wide | P1 |
| X5 | Exterior hard surfaces (forecourt gravel, terrace slabs, sauna deck) are large single-value planes with no edge wear, path wear or seams at player scale | forecourt, terraces | P2 |
| X6 | Restraint that works: library, living-room hearth corner, hall, conservatory pool, archive, BOSLUST, Portugal exterior, the woodland routes. Touch lightly or not at all | — | P3 |
| X7 | **Budgets**: with *every* door open (this audit's evidence state) several views exceed the guide (kitchen-b 220 / 361 k, living-a 189 / 331 k, hall / maquette 157 / 484 k). Re-measured with all doors **closed**, the same poses are inside it: kitchen-b 128 / 203 k, living-a 131 / 205 k, maquette 58 / 178 k, dining 76 / 139 k, study 47 / 130 k, north guest room 43 / 132 k. **Living and kitchen have little headroom** (≈ 20 calls / ≈ 45 k triangles), dining has a lot. D3 must batch into existing chunks | manor | info |
| X8 | Checked and **not** a defect: the black triangle in `r-utility-a` is the camera inside the open utility door leaf (evidence pose only; the player cannot stand there). With doors closed the ceiling renders correctly | utility | — |
| X9 | Observation outside D scope: at *high* quality, interior walls show diagonal light / dark bands (shadow-map acne look) in the utility probe frame. Lighting baseline, not D. Reported for awareness | utility (high) | — |

---

## 1. Top-10 priorities

| # | Area | Biggest opportunity | Planned intervention | Prio | Subpass |
|---|---|---|---|---|---|
| 1 | Dining / game room | the owner's required **played-evening memory scene**; today a "set table" (h01, h02) | §4 composition plan: bottles, shots + liquor, marshmallow bag + chubby-bunny card, cards / dice in play, used chairs | P1 | D3-a |
| 2 | Wickerman clearing | repeatable ritual, hay bale, burn audio | `DEV04D_WICKERMAN_DESIGN.md` | P1 | D4 |
| 3 | Kitchen | group cooking is not legible: perimeter counters, empty 12 × 17 m floor, one small table | a working island (board, knife, produce, pans), a "big shop" unpacking cluster tied to the 8 red crates, a bread / cheese remnant on the table | P1 | D3-a |
| 4 | Study + botanic room | 15.6 m long rooms with everything at one end (`r-study-*`, `r-botanic-*`) | study: a map-chest + reading-chair cluster mid-room; botanic room: the design's potting bench / sink + drying rack + plant trays. Evidence (B2 map, fern prints) untouched | P1 | D3-b |
| 5 | Wall art | 8 placeholder paintings + 2 unframed mirrors | framed mirrors now; FLW-D2 into the manifest slots when delivered | P1 | D1 |
| 6 | Attic seasonal store + common | "seasonal storage" holds one crate (`r-atticStore-a`); common is a big empty floor | dust-sheeted furniture, game / instrument cases, labelled crates in a clear lane; common: a used games corner near the bunting | P1 | D3-c |
| 7 | Gingerbread maquette | plain cream / slate-grey model (h06) | material re-skin per the approved sheet | P1 | D2 |
| 8 | Upstairs bedrooms | big empty floors, blank walls, no guests' traces | luggage, clothes on a chair, a book on the bedside; keep star / travel identity | P2 | D3-b |
| 9 | Forecourt + garden terrace | large flat gravel / slab planes, a "staged" outdoor table | arrival traces at the door (bags, instrument case), gravel wear, a used outdoor table (glasses, a board game box, a blanket) | P2 | D3-e |
| 10 | Wickerman / fire polish | petal-like flame stack, faceted smoke, "cake-board" plinth, candle stones invisible | sheet fire, soft smoke, dry-stone plinth, darker stones, worn ritual ring in the grass | P2 | D4 |

---

## 2. Manor interiors

Columns: **Observed** (what the captures show) · **Opportunity** · **Intervention** (D3 unless stated) · **Prio** ·
**Dependencies / no-go** (evidence that must not move, ids, budgets).

### Ground floor

| Area | Observed | Biggest opportunity | Planned intervention | Prio | Dependencies / no-go |
|---|---|---|---|---|---|
| Vestibule (`r-vestibule-*`) | tiled, door mat, small bench, sconce; doorway to the hall | the design's "coming in with wet things" (coat rail, umbrella, boots) is only a mat and a bench | coat rail with two jackets, boots / umbrella by the bench, one bag dropped | P2 | keep the front-door swing and the view to the hall clear |
| Hall (`r-hall-*`, h03) | strong: stair, runner, stair landscape painting, maquette table, red crates, guestbook console | maquette material; two generic paintings | D2 maquette re-skin; D1 paintings | P2 | **start console / drawer evidence, maquette inspect `mem.hall.maquette`** stay; crates not on the console |
| Living (`r-living-*`) | calibration room; hearth corner works; east half of the room is open floor with a floor lamp and a plant | one small secondary use in the east half (reading / games corner), without competing with the hearth | a card table with two chairs and a half-finished puzzle / game; a throw on the sofa; Nerf only if the owner provides the reference (G3) | P2 | **mantel / brass selection evidence (E01) exact**; tight budget (X7) |
| Dining / game room (`r-dining-*`, h01, h02) | 1.3 × 4.6 m table, 10 upholstered chairs in exact rows + 2 carvers, board / 2 dice / 2 card decks / 3 bottles at the south end; marshmallow bowl + 4 shots on a lone side table at (96.2, 90.6); one small generic painting | the required memory scene; break the set-table read | **§4** | **P1** | **A01 hosting-plan inspect on the sideboard (107.05, 86.0)** stays separate from the game; no new interactable unless G2; route hall ↔ kitchen clear |
| Kitchen (`r-kitchen-*`) | perimeter counters, island, table + chairs, 8 red crates (2 stacks), pans on a rail, plate rack; huge empty tiled centre | legible group cooking | island as the prep zone (board, knife, onions / bread, an open crate being unpacked), a pan on the stove, a fridge corner with the beer crates, a dish towel; leave the centre aisle free | **P1** | **service chart + hatch (A1 evidence, `kitchen.hatch`, `pk.consKey`)** untouched; tight budget from the NE view (X7) |
| Back lobby (`r-lobby-*`) | three doors, emblem plaque, sconce, bench | — | none (design: "geen extra verzamelobject") | P3 | **three-seal gate**; plaques |
| Billiard (`r-billiard-*`) | table, cue rack, chalk scoreboard, open garden door | a game in progress (balls mid-game, a cue on the table edge, chalk) | small: ball spread + a cue across two chairs, a glass on the rail shelf | P2 | **optional billiard evidence: "ball layout not decoratively changed"** (ENVIRONMENT_STORY G08), so only off-table props |
| Guest WC (`r-guestWC-*`) | basin + unframed glowing panel | X3 | framed mirror, towel, soap | P1 (mirror) | — |
| Library (`r-library-*`, `r-libGallery-*`) | strong: shelves, gallery, lectern, rug, catalogue table | — | none beyond one reading trace (open book face down, glasses) if it does not touch the catalogue table | P3 | **B1 catalogue table, floor plan panel, guestbook lectern** untouched |
| Service corridor (`r-corridor-*`) | doors, sconce, towel / trolley nook | — | none | P3 | trolley evidence (A) |
| Workshop (`r-workshop-*`) | sawhorses + plank, tool wall, shelf, bench; open floor | design SI: "the board game was built here" | a half-made game board on the sawhorses (cut-out cardboard, paint pots, brushes): ties the workshop to the dining memory | P2 | shed items not migrated (C contract) |
| Pantry (`r-pantry-*`) | shelves of jars / bottles, three sacks | — | none or a crate of drinks | P3 | A-destination per service plan |
| Utility (`r-utility-*`) | machines, sink, drying rack | — | a laundry basket | P3 | — |
| Conservatory / Copacabana (`r-cons-*`, h04) | pool with mosaic symbols, bar with canopy sign, loungers, plants | the approved sheet: hanging glassware on real racks, cocktail traces, towels; currently a bit bare at the bar | REFINE per `copacabana_room_sheet_v01`; towels on two loungers; restraint (no tiki overload) | P2 | **pool symbols (A2) must stay fully visible**; sign text exactly "Copacabana Room" |

### Upper floor

| Area | Observed | Biggest opportunity | Planned intervention | Prio | Dependencies / no-go |
|---|---|---|---|---|---|
| Front gallery / walkway / landing (`r-frontGallery-*`, `r-landing-*`) | balustrade, runner rug, generic paintings, sconces; landing rug floats in a large empty floor | art (D1); the landing is a crossing, negative space is fine | D1 only; maybe a bench with a folded blanket | P3 | — |
| Reiskamer (`r-reis-*`) | bed + chest, wardrobe, desk, chair, travel sketch, luggage rack with open suitcase (memory), very large empty floor | guests' travel traces | a second bag on the floor, clothes over the chair, a map / guidebook on the desk; keep the suitcase memory the focal point | P2 | **koffer emblem identity (B1)**, `mem.reis.suitcase`; travel sketch stays |
| Sterrenkamer (`r-sterren-*`) | bed, rug, star map, telescope at the west window, empty middle | observing traces | a blanket on a chair by the telescope, a red torch, star wheel on the side table; no new emblem-like objects | P2 | **ster emblem identity (B1), EB.stars contract**, `mem.sterren.telescope` |
| North guest room (`storage`, `r-storage-*`) | bed, chest, rug, wardrobe, armchair, generic painting (duplicate) | "beds, bags, game shelf" (design U11) | bags, a games shelf, clothes; painting via D1 | P2 | source id `storage` / `door.storage` stay |
| Study (`r-study-*`) | 6.3 × 15.6 m; desk + globe + chair at the north end, two bookcases, map chest; the rest is empty floor | a working centre mid-room | reading chair + side table + lamp + stacked folders on a rug mid-room; papers on the desk | **P1** | **B2 framed route map, study desk / compartment lock** untouched |
| Botanic room (`r-botanic-*`) | 6.3 × 15.6 m; one table with lamp + plants at the far end, fern / leaf prints | the design's potting bench / sink (U10) | a potting bench with trays, a sink, a drying rack of pressed plants mid-room; plants grouped | **P1** | **varen emblem identity, EB.plants contract, herbarium inspect** untouched; prints stay |
| Bathroom (`r-bath-*`) | tub, basin, towel rail, unframed glowing panel | X3 | framed mirror, bath mat, a toiletry shelf | P1 (mirror) | — |
| Linen (`r-linen-*`) | shelves of linen (the corner capture is inside a shelf) | — | none | P3 | — |
| Upstairs corridor (`r-ucorr-*`) | runner, sconces, doors | — | none | P3 | door plaques |
| Rear nooks (`r-rearNook*`) | armchair, side table, plant, bench; calm | — | none | P3 | — |

### Attic

| Area | Observed | Biggest opportunity | Planned intervention | Prio | Dependencies / no-go |
|---|---|---|---|---|---|
| Attic landing (`r-atticLanding-*`) | stair head, timber walls | — | none | P3 | — |
| Weekend attic / common (`r-atticCommon-*`) | big timber room; one seating group on a rug at the far end, bunting line, a few crates | a used hangout: games out of their boxes, a blanket, cups | a games cluster at the seating group, one crate stack by the wall | P1 | `mem.storage.box` (game boxes memory) |
| Seasonal store (`r-atticStore-*`) | one crate, one box, a door | "large storage groups with a clear walking lane" (A02/A03) | dust-sheeted chairs / a mirror, labelled crates, Christmas / garden boxes, instrument cases, old sleds; one clear lane | **P1** | no mandatory seal / clue here |
| Lookout / observatory (`r-atticLookout-*`, h05) | desk, chair, star chart, telescope under the roof window, rug, chest, bench | the approved sheet: observing traces | a logbook, red torch, blanket, mug; telescope aimed through the roof window (verify) | P2 | stars evidence stays in the Sterrenkamer |

### Basement and BOSLUST underground

| Area | Observed | Biggest opportunity | Planned intervention | Prio | Dependencies / no-go |
|---|---|---|---|---|---|
| Basement lobby (`r-bLobby-*`) | pipes, lantern, plain walls | — | none | P3 | gate feedback |
| Archive (`r-archive-*`) | back-to-back shelving with archive boxes; strong | — | none | P3 | **service drawing, D evidence** |
| Boiler room (`r-boiler-*`) | boiler drum with bands and gauge, flue; an unexplained black 1.6 × 0.8 × 1.2 m box (`manor.ts:1267`) | give the box an identity (water tank / pump with pipes) | REFINE the box only | P2 | — |
| Route room (`r-route-*`) | console / frame on a sideboard, pipes, big empty floor | finale-adjacent: restraint | none | P3 | **D evidence / console**, finale untouched |
| BOSLUST entry / passage (`r-entry-*`, `r-passage-*`) | roots, timber, panels, lanterns: strong, the calibration benchmark | — | none | P3 | **cipher / plate evidence** |
| Gathering hall (`r-gathering-*`) | long candlelit table in a big room | emotional landing: restraint | none in D (finale is not redesigned) | P3 | **finale / end letter** |

### Other buildings

| Area | Observed | Biggest opportunity | Planned intervention | Prio | Dependencies / no-go |
|---|---|---|---|---|---|
| Sauna (`r-sauna-*`, x12) | barrel interior, benches; a thin light-leak seam along the barrel curve | — | close the seam (geometry gap); towels on the deck | P2 | sauna index evidence (A) kept clear |
| Shed (`r-shed-*`, x19, x20) | dark by design (C1: torch), bench, crate; exterior a plain plank box | exterior reads boxy next to BOSLUST (`99_avoid/too_boxy_geometric`) | exterior: plank breakup, roof overhang / fascia, a lean-to woodpile; interior untouched | P2 | **C1 shed evidence and darkness** |
| Portugal cottage interior (`r-cottageRoom-*`) | long table set with chairs, papers, a candle: "the table is set elsewhere this year" (`mem.cottage.table`) | restraint is the story | none | P3 | memory card |

---

## 3. Exteriors and destinations

| Area | Observed | Biggest opportunity | Planned intervention | Prio | Dependencies / no-go |
|---|---|---|---|---|---|
| Gate / driveway (x01, x02) | woodland avenue, manor revealed down the drive: works | — | none | P3 | — |
| Arrival forecourt / parking (x03, x04) | facade strong; a big flat gravel plane, roundel planter, 4 cars | arrival traces (PB01: "luggage / instrument hint", the group came with lots of stuff) | a car boot open with bags, a crate on the step, gravel wear along the drive line and car bays | P2 | keep the final approach to the front door clear (design); no car in the approach |
| Social garden / terrace (x05) | long rear facade, terrace platforms, string lights, balloons; plain slab planes | the terrace as a lived-in outdoor room | cushions / blankets on chairs, a game box, glasses on the long table; slab seam / edge wear | P2 | central path X 87–94 stays free |
| Outdoor dining (x06) | table + two benches with plates on a large bare slab | used, not staged | glasses, a bottle, a folded blanket; shade umbrella optional | P2 | — |
| BBQ (x07) | kettle grill, prep table, gas bottle on a bare slab | cooking traces | tongs, a covered tray, charcoal bag, an apron on the table | P2 | — |
| Music / bong / balloons (x08) | rug, cushions, low table, gas tank + balloons, chairs | recognisable cluster already present | handpan on its stand reads? (verify at close range); none otherwise | P3 | PB04: no use mechanic, no attribution |
| Lantern lawn (x09) | three lanterns round the stone: C2 puzzle space | evidence clarity | none | P3 | **C2 lanterns / stone** |
| Lake + viewpoint (x10, x11) | C-R lake; bench viewpoint | — | none (C-R accepted) | P3 | `mem.pond.bench` |
| Wellness deck (x12, x13) | sauna barrel, jacuzzi, loungers on a deck; barrel end face reads as one flat plank disc | towels, a robe hook; barrel end detail (staves, door) | small | P2 | sauna index evidence |
| Portugal exterior + terrace (x14, x15) | calibration target #2: strong | — | none | P3 | `mem.cottage.table` |
| East glade (x16) | open grassy slope under oaks | negative space between destinations: acceptable | none (optionally one log seat) | P3 | — |
| Woodland routes (x17, x18) | layered woodland, paths: strong | — | none | P3 | map landmarks |
| Campfire (x21) | stone ring, logs, stumps, post lantern, kindling | — | none | P3 | **C1 fire / plate / post lantern** |
| Well (x22) | well with roof, path: fine | — | a bucket / rope coil detail | P3 | B2 POI shape |
| Side gate (x23) | wall, gate, postbox sign: fine | — | none | P3 | `mem.sidegate.postbox` |
| Golf tee / chute / spur (x24, x25) | cardboard chute, mat, bag: reads as improvisation | — | none; **golfSpur is the known budget exception: nothing added there** | P3 | PB05: no ball physics |
| Wickerman side path / clearing (x26–x30) | reveal works; the plinth reads as a smooth light disc, candle jars as white cups on invisible stones, bare uniform grass floor | lifecycle + bale (design doc); worn ritual ring; plinth / stones | D4 per design §4–§9 | P1 / P2 | optional setpiece only |
| BOSLUST exterior / door (x31, x32) | calibration target #1 | — | none | P3 | **sign "BOSLUST", cipher tablet** |

---

## 4. Required authored-memory scene: the social / game table (composition plan)

Location: dining / game room table, centre (101.3, 86.2), top at GF + 0.76, 1.3 m wide (x 100.65–101.95) × 4.6 m long
(z 83.9–88.5). Today: board (0.68 m square) centred at z 84.35 (south end), pawns, 2 dice and 2 card decks beside it,
a score pad at (101.75, 87.95), 3 beer bottles, 3 brass candlesticks on the centre line (z 85.2 / 86.2 / 87.2), 10
upholstered side chairs in exact rows (x 100.25 / 102.35, z 84.2…88.2) and 2 carvers at the heads.

**Story** (ENVIRONMENT_STORY G05 / PB02; PF: the duo's home-made game, beer, chubby-bunny): late in the evening a
two-player duel on the home-made board drew a crowd; the far end of the table turned into the drinks-and-dares end.
Everyone left at once (to the fire?), mid-game.

**Focal point**: the board, mid-game, nothing on it but pieces and two cards. A 0.15 m clear margin around it.

| Zone | Where | Content (hand-placed or seeded jitter, never a grid) |
|---|---|---|
| A · the duel | south end, both sides of the board | the two player chairs (x 100.25 / 102.35, z 84.2) pulled in tight and turned ~15° toward the board; a fan of 5 cards face-down by the east player's hand, 3 played cards face-up beside the board, one card fallen on the seat; the 2 dice on the board edge, a third die rolled off against a bottle |
| B · players' drinks | at each player's hand | west: 1 bottle in use (no cap) + 1 empty; east: 1 in use + 2 empties, one with its label turned away |
| C · the crowd | z 85.2–86.2, both sides | 4 chairs turned 25–40° toward the board, one pushed back 0.4 m (someone stood up laughing), the south carver turned 30°; bottles where they sat: 2 + 2 (one pair touching), one tipped on its side, lying flat, against the candlestick base (resting, not floating) |
| D · drinks-and-dares end | north end, z 87.4–88.4 | one bottle of strong liquor (taller, square-shouldered, plain label, unbranded) with 6 shot glasses: 3 standing (2 with a thin amber fill disc), 2 upturned rim-down, 1 on its side; the opened **marshmallow bag** (pillow shape, torn top, plain pink / white print, no brand) on its side with 5 loose marshmallows spilling toward the edge; the **chubby-bunny card**: a folded tent card propped against the bag, hand-lettered "chubby bunny" with tally marks under two (unnamed) columns |
| E · the knot of empties | north-east corner of the table | 5 empties grouped tight (staggered heights, two touching, one leaning on another at a stable angle), the score pad and a pencil beside them |
| F · floor | by the north carver | 1 empty standing by the chair leg; the north carver pushed back and turned toward the room |

Totals: **≈ 17 beer bottles** (≥ 15), 6 shot glasses, 1 liquor bottle, 1 marshmallow bag + 5 loose, 1 card.

Variation: bottle scale 0.96–1.04 in height; 3 glass tints (two browns + one green); caps on 2 unopened bottles only;
label rotation random per bottle; no two neighbours share tint and height.

Constraints:
- **The board stays fully readable**; nothing on it but pieces and cards; the candlesticks keep the centre line.
- Nothing clips the table top: every prop seated at top + its own base (bottles 0 offset with the lathe base, tipped
  bottle at its radius, cards ≥ 2 mm over the top to avoid z-fighting, glasses rim-down at rim height 0).
- The hall → kitchen walk line and the A01 sideboard (107.15, 86.2) stay clear; pushed-back chairs stay inside the
  rug. Chair colliders move with the chairs.
- Geometry reuse: `bottleGeoOf('beer')`, `capGeo`, `shotGlass`, card / die geometry of `boardGameSet`, one new
  liquor-bottle lathe and one bag mesh (prop atlas cell). All through the `mWing` batch (`Asm`): **0 new draw calls,
  ≈ +6–9 k triangles** (dining today 76 calls / 139 k with doors closed).
- No new interactable unless the owner chooses the inspectable card (G2). No brand, no copied boardgame art.

Side table (96.2, 90.6) (decision G1): recommended to **move** the marshmallow bowl and the 4 shots to the big table
(above) and turn the side table into the drinks-supply point: a beer crate with a few empties back in its slots and
two full ones. This keeps one memory scene instead of two half-scenes and gives the side table a reason.

---

## 5. What is intentionally left restrained

Hall circulation, back lobby, corridors, landings, linen, basement lobby, route room, gathering hall, the lantern lawn,
the lake, the east glade, the woodland routes, the campfire, the golf spur, BOSLUST, the Portugal cottage. Each either
carries puzzle evidence that must read cleanly, is a calibration target, is a finale-adjacent space, or works as
negative space between destinations. D3 leaves them alone or adds at most one small trace.
