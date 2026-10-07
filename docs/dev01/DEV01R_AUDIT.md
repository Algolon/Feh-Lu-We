# DEV-01R — canon reconciliation audit (written before any edit)

Audited: branch `ccr-928d1d45-tudz6y` at `6894a89` (DEV-01), review build `?review=dev01`.

## 0. Source availability

The DEV-01R brief says the v0.2 inputs "worden nu aangeleverd". At audit time they were **not present** in this
session: not in the repository (fetched; both remote branches unchanged — `ef6b7c3`, `6894a89`), not in the working
tree, not in the attachment/upload mounts (`/mnt/attach`, `/mnt/user-data/uploads` empty), not elsewhere on disk,
and not in the connected Notion workspace (searched by file name and by canon id `EB.folio.stars`).

| Document | Available? |
|---|---|
| Feh_Lu_We_Puzzle_Design_v0.2.md | ❌ |
| UX_GAME_FEEL v0.2 | ❌ |
| LEVEL_PLAN v0.2 | ❌ |
| LEVEL_LAYOUT.json v0.2 | ❌ |
| ADJACENCY_GRAPH v0.2 | ❌ |
| DELTA_V0_1_TO_V0_2.md | ❌ |
| INTEGRATION_OPEN.md | ❌ |
| Environment Story / Art Bible | ❌ (never available in this repository) |

The audit therefore uses the **canon stated in the DEV-01R brief itself** (B01 chain with ids and details, the
folio = loose drawing sheet concept, DS01 locations and state rules, UX rules). Items that can only be checked
against the missing files are marked **NIET TOETSBAAR** and are not changed on guesswork.

## 1. B01

| # | Item | Implemented (DEV-01) | Canon (DEV-01R brief) | Status |
|---|---|---|---|---|
| B1 | Folio concept | three **folders** ("Map I/II/III", coloured covers, opened with *Openen*) | folio = **los tekenblad** (loose drawing sheet); no competing *werkmap* evidence | **CONFLICT** — changes the fiction (folder vs sheet) and the clue grammar (a "map" reads as a work folder, explicitly excluded) |
| B2 | Folio ids | `I`, `II`, `III`; sources `s.b01.folio.I…` | `EB.folio.stars`, `EB.folio.plants`, `EB.folio.travel` | **CONFLICT** |
| B3 | stars details | lens cap on green cord + star chart with circled W | telescope on a **fork mount** + **two round screw heads**; **notebook with three holes** | **CONFLICT** |
| B4 | plants details | fern with torn tip + pot with one blue band | fern with a **broad diagonal repair strip**; **scissors with one angular + one round grip** | **CONFLICT** |
| B5 | travel details | compass with cracked glass + ticket with one punched hole | suitcase with **two parallel straps + square middle patch**; **label with cut-off top-right corner** | **CONFLICT** |
| B6 | Chain subject → clip → slot | stars→round→round, plants→pointed→pointed, travel→square→square | same | MATCH |
| B7 | Subject → room | stars U05 `sterren`, plants U10 `botanic`, travel U04 `reis` | same subjects; U-ids per LEVEL_LAYOUT | MATCH (room ids **NIET TOETSBAAR**, see L1) |
| B8 | Table instruction text | provisional, uses "map … clip" | "letterlijke instructie uit Puzzle v0.2" | **NIET TOETSBAAR**; wording "map" CONFLICT via B1 |
| B9 | Hint levels 1–3 | provisional, names the old details | "hintniveaus uit Puzzle v0.2" | **NIET TOETSBAAR**; old detail words CONFLICT via B3–B5 |
| B10 | Judging: swap/take back, incomplete = no attempt, complete wrong = neutral, correct = study key; no hasSeen | as specified, unit + e2e tested | same | MATCH |
| B11 | Door plaques, emblem floor plan, guestbook tabs, old catalogue books/sockets | removed in review build | none allowed | MATCH |
| B12 | Botanical emblem prints (old `e.varen` drawings) | removed in review build | no second emblem system | MATCH |
| B13 | Room names on map floor plans | hidden in review build | no room-name evidence | MATCH |
| B14 | Captioned paintings in U04 ("onderweg") and U05 ("sterrenkaart") | still visible | no room-name / label evidence | **MINOR** — thematic words on the walls of two clue rooms; not room names, but label-like |
| B15 | Hall guestbook (`mem.hall.guestbook`) | visible, memory only, no tabs or room relation | no guestbook room→tab relation | MATCH |
| B16 | U04 open suitcase with luggage labels (`mem.reis.suitcase`) | visible near the drying rack | travel pair = suitcase + label | **MINOR** — a near-miss next to the canonical travel pair (no straps/patch, no cut corner); keep, flag for human review |
| B17 | U05 tripod telescope (existing) | visible | stars pair = telescope on a fork mount | MINOR (useful near-miss: tripod, no fork, no screw heads) |
| B18 | DS01 visually/interactively separate from B01 | paper/photo language, no clips/numerals | same | MATCH |

## 2. DS01

| # | Item | Implemented | Canon | Status |
|---|---|---|---|---|
| D1 | A location | G02 hall, note by a maquette | G02 by the **gingerbread** maquette | MATCH (location) · **MINOR** (maquette is a green board model, not gingerbread) |
| D2 | B location | G04 low **side table** by the reading chair, ~7 m from B01 | G04 **rustige leesplank**, apart from B01 | **MINOR** (furniture type) |
| D3 | C location | U04 small drying rack in front of the window, near the suitcases | U04 by window / suitcases / small drying rack | MATCH |
| D4 | A/B/C texts, back text | provisional | "exact door Puzzle v0.2 gespecificeerde teksten" | **NIET TOETSBAAR** |
| D5 | No pickup, no put-back, no quest gate, no storyUnderstood | as specified | same | MATCH |
| D6 | photoFound on C-front inspection; back only after explicit turn | as specified, unit + e2e | same | MATCH |

## 3. UX / notebook

| # | Item | Implemented | Canon | Status |
|---|---|---|---|---|
| U1 | Sections | Waarnemingen · Mijn onderzoek · Archief | same | MATCH |
| U2 | Register owned ≠ read | pickup does not open it; read from the bag | same | MATCH |
| U3 | Only the three register topics, only after deliberate inspection | yes (lines verbatim from the integrated register text) | same; register wording per v0.2 | MATCH (v0.2 register wording **NIET TOETSBAAR**) |
| U4 | Mijn aandacht has no mechanical effect | world state, eligibility and hints unchanged (tested) | same | MATCH |
| U5 | No next step, no automatic clue grouping, no secret total, no hidden placeholders | none (tab shows the count of looked-at sources only) | same | MATCH |
| U6 | Hints separate from world evidence | dialog only, labelled "Hint n", never stored | same | MATCH |
| U7 | Notebook titles of the folios | "Map I/II/III" | sheet, not folder | **CONFLICT** via B1 |

## 4. Level

| # | Item | Implemented | Canon | Status |
|---|---|---|---|---|
| L1 | Room aliases G01 vestibule, G02 hall, G03 living, G04 library, U04 reis, U05 sterren, U10 botanic | derived from the DEV-01 brief | "exact per v0.2 layout data" | **NIET TOETSBAAR** (LEVEL_LAYOUT.json missing); the brief's own DS01 canon (G02 maquette, G04 library, U04 travel room) is consistent with them |
| L2 | Evidence poses | as-built, validated keepouts, e2e reticle-checked | per LEVEL_PLAN metrics | **NIET TOETSBAAR** |
| L3 | Save-relevant room ids | unchanged | unchanged | MATCH |
| L4 | No 200 × 180 roll-out | none | none | MATCH |

## 5. Plan (only what DEV-01 needs to conform)

Correct now: B1–B5, U7 (sheets with the canonical ids and details; save migration for review saves of schema 1),
B8/B9 wording (still provisional, re-labelled to the new details), B14 (captions off in the review build),
D1 (gingerbread maquette), D2 (reading plank on the same footprint).
Keep and document: B16, B17 (near-misses for human review).
Not changed: L1, L2, D4, B8/B9 literal texts, U3 wording — waiting for the documents.
The review-only sauna vegetation fix stays review-only.

## 6. Outcome (after the reconciliation commit)

| # | Resolution |
|---|---|
| B1, U7 | Folios are loose drawing sheets everywhere (world: thin paper with the two sketches; panel: the sheet itself as thumbnail; texts: *tekenblad*). No "map"/folder wording in any B01 text (unit-tested). |
| B2 | Ids `stars` / `plants` / `travel`, source ids `EB.folio.*`; slice schema 2 migrates DEV-01 review saves (unit-tested). |
| B3–B5 | Canonical detail pairs in sheet sketches, room objects (3D telescope on fork mount with two round screw heads; 3D suitcase with two straps + square patch) and texts (unit-tested). |
| B8, B9 | Re-worded to sheets and the canonical details; still provisional pending the literal v0.2 text. |
| B14 | Painting captions off in the review build. |
| D1 | Gingerbread maquette (brown body and roof, white icing). |
| D2 | Reading plank (ledge on trestles), same validated footprint. |
| B16, B17 | Kept as near-misses; listed for the human review. |
| L1, L2, D4, U3 | Unchanged — not verifiable without the v0.2 files. |

Checks after the reconciliation: typecheck ✅ · unit 137/137 ✅ · existing e2e 103/103 ✅ · e2e:dev01 32/32 ✅ ·
normal game vs `ef6b7c3`: draw calls and triangles identical at 13 views, pixel deltas within run-to-run noise ✅.
The review-only sauna vegetation fix stays review-only (separate follow-up).
