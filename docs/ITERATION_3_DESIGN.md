# Iteration 3 — "Het huis dat zich herinnert": design record

What was built for iteration 3, why, and where it lives in the code. Spoilers are in
[`PUZZLE_SOLUTIONS.md`](PUZZLE_SOLUTIONS.md); test evidence is in [`ITERATION_3_VALIDATION.md`](ITERATION_3_VALIDATION.md).

## 1. Story frame (fiction)
The organiser is the fictional **Kwartiermaker**. This year the group does not meet in the old cottage: the
house itself has "kept three parts of the route" — what was shared at the table, what was written down, and what
was discovered off the paths. Each part ends in a seal; together they open the basement, which leads (via a
restored route and a taught cipher) to **BOSLUST**, a door in a wooded hill, and a gathering room underneath it.
Final letter: *"Een plek onthoudt weinig uit zichzelf. Wij geven haar iets om te bewaren."*

No real quotes, incidents or biographies of the friends are invented. Memory notes stay generic placeholders in
`src/content/memories.ts` (stable ids, replaceable text). No development identifiers appear in player text.

## 2. World layout (`src/world/layout.ts`, `src/world/roomdefs.ts`)
| Area | Footprint (plan m) | Notes |
|---|---|---|
| Estate | 180 × 150 (was 120 × 100, ≈2.25× area) | front gate (90, 0); woodland Z 0–72 (≈48 % of the estate) |
| Manor main block | X 72–108, Z 80–110, two storeys + basement under the north half | central entrance bay, porch, hip roof, dormers kept |
| Service wing | X 108–116, Z 92–110 | corridor, pantry, workshop |
| Conservatory | X 116–130, Z 94–112 | indoor pool only; sauna outside to its right (east) |
| BOSLUST | hut at (63, 18.2), stair Z 20–26, chambers Z 26–57 at Y −3.4 | door in the hill's south face, stone-walled cut |
| Tunnel | X 62–64 from Z 57 to 98, east to the route chamber | bolted on the tunnel side |

**Named spaces (manor + estate):** vestibule, hall (double height), living room, library (with gallery), dining
room, kitchen, service corridor, pantry, workshop, back hall, billiard room, basement stair; upstairs gallery,
landing, Reiskamer, Sterrenkamer, library gallery, bathroom, upstairs corridor, study, botanical room, attic
storage; Kelderportaal, archive, boiler room, route chamber; conservatory, sauna, shed, cottage; BOSLUST hut,
stair under the hill, entry cellar, rooted passage, gathering room, old tunnel. The manor alone has 26 named
rooms (target was 18–22; the extra ones are small connecting spaces).

**Terrain** (`src/world/terrain.ts`): one 2 m heightfield drives both the rendered ground and collision (same
triangle split), so feet always match the drawn ground. Rolling woodland, a rounded hill (r 16 m, 7.5 m high),
flattened paths/clearings/driveway, holes under buildings (they provide their own floors; this also keeps the
basement stairwell from being "bridged" by terrain), and a finer earth mound over the BOSLUST hut.

## 3. Threads, puzzles and gating (`src/puzzles/rules.ts`, `src/content/canon.ts`)
- Start: hall drawer (fair mantel rule, iteration-3 checkpoint 1) → ledger + shed key.
- **A Aan tafel** — service plan (relational rule, three wordless tags) → conservatory key → cabinet wheels using
  the pool mosaic + sauna board (deep → shallow) → table seal.
- **B In de kantlijn** — catalogue (emblem → room → tab, three sources: floor plan, door plaques, guestbook) →
  study key → desk buttons from the morning-walk map → archive seal.
- **C Buiten de paden** — shed (torch for the board; journal sketching BOSLUST) → fire, post lantern, plate →
  garden lanterns → trail seal in the centre stone.
- **Convergence** — basement door (all three seals) → pipe drawing + route console (line styles ↔ origins) →
  letter strip → BOSLUST cover + taught Caesar shift (2413) → stair into the hill → three route plates + lever →
  gathering room → letter.

Branch orders: A, B and C are independent after the drawer; unit tests solve A→B→C, C→B→A and B→C→A; the e2e
walkthrough plays A→B→C through the real controls.

Fairness rules kept from iteration 2: every placement puzzle judges only the full arrangement (no correct-prefix
oracle), pieces are always recoverable, wrong cipher codes share one neutral message, the lanterns evaluate the
whole attempt, keys are reusable, and missing prerequisites are named by the lock.

## 4. Guidance (`src/core/game.ts`, `src/ui/ui.ts`, `src/content/clues.ts`)
- Notebook tab **Draden**: start, A, B, C (and D once seals appear) with done state, the next step, and a
  "Volg deze draad" button (`state.track`). Clues are grouped by thread.
- Objective line: the followed thread (or the first started one) and its next step.
- Hints: three levels per puzzle; the dialog shows the thread, the **last observation** (most recent clue of
  that thread) and, separately, the **next step** including missing prerequisites (e.g. which seals are missing).
- Map: estate overview plus floor plans per level (ground, upstairs; basement and "onder de heuvel" appear once
  discovered), generated from the room definitions; unvisited landmarks show as "?".

## 5. Saves (`src/core/state.ts`)
Version 4 adds `dials`, `track`, `archive`, `notice` and validated slot keys (`svc.*`, `cat.*`, `con.*`).
Migration v3 → v4 keeps tools and solved retained puzzles (their rewards wait in the opened containers), drops
items of the removed cottage route, resets positions to named safe spawns (the estate was rebuilt), archives an
old ending (`archive.chapter1Finished`) instead of discarding it, and shows a one-time notice offering the new
chapter. **Nothing clears localStorage wholesale:** "Nieuw spel" and "Opnieuw beginnen" set the current save
aside under `fehluwe.save.prev`; the start screen offers *Vorige voortgang terugzetten*, which swaps the two.

**Starting fresh without losing an old save:** start screen → *Nieuw spel* (or Pauze → *Opnieuw beginnen*). The
old progress is set aside, not deleted; *Vorige voortgang terugzetten* on the start screen brings it back (and sets
the newer one aside in turn). Only one set-aside save is kept.

## 6. Rendering and performance (`src/interactions/world.ts`, `src/world/nature.ts`)
- Room/portal graph decides lighting relevance (checkpoint 1) and now also **which areas are drawn**: furnishings
  are batched per area (hall, library, wing, upstairs, basement, under the hill) and shown only when one of their
  rooms is visible through open doors/arches; distant buildings have a distance limit.
- Wall-mounted panels belong to the room they face; underground/upstairs objects never count as "outdoors".
- Vegetation: instanced per tile, culled beyond ~105 m (fog 30–125 m), crown LOD beyond ~26 m, undergrowth
  (ferns, grass, mushrooms) only within ~42 m.
- Budgets measured in phone mode: ≤ 150 draw calls and ≤ 250 k triangles in every measured view (see validation).
  Transfer: ~0.9 MB JS (≈260 KB gzip) + 11 KB CSS; all textures are generated in the browser.

## 7. Known limits
- Real-device frame rates are not measured from this environment (software renderer only).
- The garden and hall views sit at the draw-call budget (149–150); adding content there needs the same care.
- The tunnel is long and plain by design (a late shortcut), with lanterns every 12 m.
