# DEV-01 — Structural & Systems Slice (as built)

Status: **review build, not merged, not deployed.** Opt-in with `?review=dev01`. The normal game is unchanged.
Branch `ccr-928d1d45-tudz6y`. Base commit **`ef6b7c3`**. DEV-01: `6894a89`. DEV-01R (canon reconciliation):
audit `cfb183b`, then the reconciliation commit (see `git log`).

> **DEV-01R update.** The reconciliation was done against the canon written into the DEV-01R brief. The seven v0.2
> documents it names were again **not present in the session** (repo, mounts, disk, Notion all checked) — see
> [`DEV01R_AUDIT.md`](DEV01R_AUDIT.md) for the item-by-item MATCH / MINOR / CONFLICT audit written before any edit,
> and §5 below for what is now canon and what is still provisional.

Human review script: [`REVIEW_SCRIPT.md`](REVIEW_SCRIPT.md). Screenshots: [`shots/`](shots/). Normal-vs-base and
cost comparison: [`compare/`](compare/).

---

## 1. Inputs and authority — what was actually available

| Input named in the brief | Found? | Consequence |
|---|---|---|
| Repository HEAD, branch, working tree | ✅ `ef6b7c3`, clean | Basis for everything below |
| `AGENTS.md` | ❌ not in repo (any branch/commit) | Followed the repo's own conventions (README, HANDOFF, code comments) |
| `Feh-Lu-We_AS_IS_AUDIT.md` | ❌ | Did my own as-is reading of state/save, interaction, collision, culling, puzzle and UI code |
| LEVEL_PLAN v0.2 · LEVEL_LAYOUT.json v0.2 · ADJACENCY_GRAPH v0.2 | ❌ | Geometry reconciled against the **current builders**; v0.2 room ids mapped as aliases (§6) |
| Puzzle Design v0.2 | ❌ | B01/DS01 built to the DEV-01 contract; **exact detail pairs and DS01 texts are provisional** (§5) |
| UX_GAME_FEEL v0.2 | ❌ | Notebook/hints/interaction built to DEV-01 §6/§9 |
| ENVIRONMENT_STORY v0.1 · ART_BIBLE v0.1 | ❌ | Neutral blockout + existing kit only |

Searched: all git refs and history, the working tree, and the connected Notion workspace (no results).
`docs/HANDOFF.md` confirms the settled level design "is being developed separately". **This is the main risk of
this delivery**: every place where the brief says "exact … from v0.2" is isolated in one file
(`src/slice/content.ts`, ids stable) so the canon can be dropped in without touching logic, tests or world code.

## 2. What was built

Route: forecourt (arrival) → front door → hall (G02) → living room/mantel (G03) → hall console (start drawer,
register) → library (G04) → grand stair → U05 → U04 → U10 → stair → library. All reachable by walking, no teleports
(e2e walks it through real collision).

- **B01 v0.2**: `folio → two physical details → upstairs object pair → physical archive clip → slot shape`.
  Library table: three slots (puntig / rond / vierkant, left → right for a reader facing west) and three folios —
  **loose drawing sheets** (*los tekenblad*), each only two pencil sketches: no numeral, no word, no emblem, no room
  name (DEV-01R; DEV-01 had folders "Map I/II/III", which read as the excluded *werkmap*). Upstairs each room has one
  small table with the object pair and an index card held by a brass clip of one shape. Canon chain (DEV-01R):
  `EB.folio.stars` telescope on a fork mount + two round screw heads; notebook with three holes → round clip → round
  slot (U05) · `EB.folio.plants` fern with a broad diagonal repair strip; scissors with an angular + a round grip →
  pointed clip → pointed slot (U10) · `EB.folio.travel` suitcase with two parallel straps + square middle patch;
  label with the top-right corner cut off → square clip → square slot (U04). Folios swap and come back freely; incomplete = no attempt; complete wrong = one neutral line
  ("…de lade blijft dicht"), counted; correct = the table drawer opens (PuzzleSolved). The studiesleutel is a
  separate pickup (RewardClaimed). Correctness reads the slots only — never observation flags.
- **Removed in the review build** (B01 contract): door plaques with emblems, the library floor plan with emblems
  (emblem dictionary), the guestbook room→tab relation, the old catalogue books/sockets, the botanical room's
  emblem prints, room names on the map's floor plans, and (DEV-01R) the captions "onderweg" / "sterrenkaart" on the
  paintings in U04 / U05.
- **DS01 "De foto die moest drogen"**: A — note by the **gingerbread maquette** in the hall (G02); B — album
  *Weekendhuizen* with an empty photo corner + drying letter on a **quiet reading plank** in the library's reading
  corner (G04, ~7 m from the B01 table; DEV-01R: was a side table, same footprint); C — photo
  on a small drying rack in front of U04's window, near the suitcase bench (~5 m from the B01 desk). Photo is not
  pickable, no put-back, no quest state, no checklist, no main-route reward; `photoFound` is set (monotone) when
  the front is looked at, the back only when the player presses *Omdraaien*. One-time reward: a neutral memory in
  the Archief. DS01 uses paper/photo language only (no brass, no clips, no numerals).
- **Start drawer / register**: the iteration-3 mantel drawer is kept. Picking the register up no longer opens it;
  it is read from the bag (*Lezen*). Only then do the three topics appear.
- **Notebook v0.2**: *Waarnemingen · Mijn onderzoek · Archief* (§3).
- **Hints**: only encountered riddles; level 0 names the riddle, 1 attention, 2 relation, 3 solution; shown as
  "Hint n · …", never stored in the notebook.
- **Interaction**: every action label names verb + object ("Openen: deur", "Slot bekijken: lade",
  "Bekijken: archiefclip"); one overlay at a time; return context between panels and the notebook; no
  click-through after closing an overlay.
- **Debug**: `?review=dev01&debug=1` adds room id + v0.2 alias, target id and the slice state to the overlay.

## 3. Notebook / information architecture

| Section | Before the register | After reading the register |
|---|---|---|
| Waarnemingen | only sources actually shown (invitation, read at home) — raw text, picture, provenance ("Boven · waarneming 7 · voor- en achterkant bekeken"), pin, archive | same |
| Mijn onderzoek | own questions/ideas (player-written, with optional pinned sources) · Resultaten (factual outcomes) | + **Uit het register**: exactly the three topics with the register's own line, and *Mijn aandacht* (Geen / one topic) |
| Archief | herinneringen (memories, incl. DS01's) · what the player archived | same |

No relevance score, no "✓ opgelost" badge, no grouping by hidden clue relations, no next steps, no "Volg deze
draad". The HUD objective line shows only the player's chosen attention ("Mijn aandacht: …") or nothing.
Type labels keep the four kinds apart: **Waarneming** (blue), **Eigen vraag** (ochre), **Resultaat** (green),
**Hint** (only in the hint dialog, dashed). The invitation's slice variant drops the sentence that named the three
parts of the route, so nothing shows the topics before the register is read (provisional text, §5).

## 4. Save / schema contract (chosen)

- `GameState` stays **version 4**. The slice adds one **optional** block `slice` (schema **`dev01/2`** since
  DEV-01R, `src/slice/schema.ts`), parsed with a sanitiser (garbage → fresh slice; future schema → fresh slice;
  duplicate folios dropped; "back seen" without "front seen" dropped). Older builds simply drop the block.
- **Schema 1 → 2 (DEV-01R)**: review saves made with DEV-01 are migrated on load — folio ids `I/II/III` →
  `stars/travel/plants` in the slots, and source ids `s.b01.folio.I…` → `EB.folio.stars…` in observations, pins,
  question pins and the archive (unit-tested). Only the review namespace is affected; the player's save never held
  slice data.
- The normal game never creates or writes the block (`'slice' in save === false`, e2e-checked).
- The review build saves under its **own keys**: `fehluwe.dev01.save`, `fehluwe.dev01.save.prev`,
  `fehluwe.dev01.settings` (settings fall back read-only to the device's normal settings). The player's own
  `fehluwe.save` is **only read** (start card → "Start met een kopie van mijn eigen spel"); e2e checks it is
  byte-identical after playing the copy.
- Semantic events (DEV-01 §7) are separate records in `slice.log` and separate state: `ObservationRecorded`
  (`slice.obs`, per face), `Encountered` (`slice.encountered`), `RegisterObserved` (`slice.registerObserved`),
  `ItemAcquired` (`slice.acquired`), `PuzzleSolved` and `RewardClaimed` (`slice.results`, distinct ids, e.g.
  `b01.solved` vs `b01.studyKey`). Archive is `slice.archivedObs` / `question.archived` and never touches solve
  state; nothing derives "understood".
- **Old-save migration (explicit alias)** — `importMainSave` in `src/slice/model.ts`:
  - `catalogSolved`, or `studyKey` owned, or `lock.libraryDesk` open → B01 solved with `legacy: 'catalogSolved'`;
    drawer open; study access kept; no replay. A key already taken counts as claimed; a key still in the drawer can
    be taken.
  - Unsolved `cat.*` placements are dropped without penalty (the books no longer exist).
  - Read clues become observations (provenance "Eerder spel"); clues of the removed catalogue
    (`c.libraryPlan`, `c.guestbookTabs`, `c.catalogDesk`, `c.archiveCard`) go to `legacyClues`, never shown.
  - `c.ledger` read in iteration 3 (it opened on pickup) → `RegisterObserved`; followed thread A/B/C → attention
    `tafel/kantlijn/paden` only if the register was read; drawer hints carried over.

## 5. Canon vs provisional content (after DEV-01R)

All in `src/slice/content.ts` (+ pictures in `src/slice/drawings.ts`).

**Replaced by canon in DEV-01R** (source: the DEV-01R brief):

| Item | DEV-01 (provisional) | Now (canon) |
|---|---|---|
| Folio concept | folders "Map I/II/III" with coloured covers | loose drawing sheets (*los tekenblad*), two pencil sketches, no words |
| Folio ids | `I`, `II`, `III` / `s.b01.folio.*` | `stars`, `plants`, `travel` / `EB.folio.stars`, `EB.folio.plants`, `EB.folio.travel` |
| stars pair (U05) | lens cap on green cord + circled star chart | telescope on a fork mount with two round screw heads (3D) + notebook with three holes |
| plants pair (U10) | fern with torn tip + pot with blue band | pressed fern with a broad diagonal repair strip + scissors with an angular and a round grip |
| travel pair (U04) | compass with cracked glass + punched ticket | suitcase with two parallel straps and a square middle patch (3D) + label with the top-right corner cut off |
| DS01 A staging | green board maquette | gingerbread maquette (brown, white icing) |
| DS01 B staging | low side table | quiet reading plank (ledge on two trestles), same footprint, apart from B01 |

**Still provisional** (needs Puzzle Design v0.2 / UX v0.2 text, not available in this session):

| Item | Current text |
|---|---|
| B01 table instruction | "Ieder tekenblad hoorde ooit met een clip in het archief. Leg het terug in het vak van die clip." (wording re-pointed to sheets) |
| B01 hint levels 1–3 | re-pointed to the canonical details; level semantics per UX canon (0 riddle only, 1 attention, 2 relation, 3 solution) |
| Player-facing phrasing of the canon details | our Dutch sentences (`FOLIO_DETAILS`, `PAIR_TEXT`); the details themselves are canon |
| DS01 A/B/C texts, back text, memory text | fictional placeholder texts (no real people, quotes or events) |
| Invitation (slice variant) | iteration-3 text minus the "drie delen van de route" paragraph |

Canon reused verbatim: register text and its three topic lines, mantel/drawer rule and hints.

## 6. As-built slice layout and ids

Room ids are the **existing** ones; v0.2 ids are aliases (`src/slice/ids.ts`): G01 `vestibule`, G02 `hall`,
G03 `living`, G04 `library`, U04 `reis`, U05 `sterren`, U10 `botanic`. Assumed from the brief (U04 = reiskamer)
and the B01 subjects — **verify against LEVEL_LAYOUT v0.2**. No geometry was moved: the current manor already
contains every slice room, the grand stair and the upper loop; the slice adds furniture and evidence only.

One record set (`src/slice/placement.ts`) drives both the props and the validator:

| Prop (plan m, X east / Z north) | Room | Footprint | Interactables (reading pose) |
|---|---|---|---|
| `ds01.maquetteTable` (85.5, 95.9) | hall (G02), west wall north of the living arch | 0.62 × 1.1 | `ds01.note` (86.75, 95.9) |
| `b01.tableTop` (80.6, 101.2) — the iteration-3 reading table, chairs moved to its west side | library (G04) | 1.1 × 2.2 | `b01.table` (81.85, 101.2); drawer `library.desk` → `pk.studyKey`, `b01.card` |
| `ds01.sideTable` (74.55, 106.6) | library reading corner | 0.7 × 0.9 | `ds01.album`, `ds01.letter` (75.75, 106.6) |
| `b01.sterrenTable` (79.0, 93.45) under the wall star chart | U05 | 1.0 × 0.5 | `b01.pair.sterren`, `b01.clip.sterren` (79.0, 92.35) |
| `b01.reisDesk` (78.6, 86.4) north wall | U04 | 1.1 × 0.5 | `b01.pair.reizen`, `b01.clip.reizen` (78.6, 85.3) |
| `ds01.rack` (82.2, 81.2) in front of the SE window | U04 | 0.55 × 0.3 × 1.0 h (collider) | `ds01.photo` (82.2, 82.45) |
| `b01.botanicTable` (101.75, 84.0) west wall (no windows) | U10 | 0.5 × 1.0 | `b01.pair.planten`, `b01.clip.planten` (102.9, 84.0) |

Keepouts checked by `validatePlacement()` (unit-tested, incl. negative cases): inside the room clear of wall slabs
(so never through a door or window), clear of every route opening (± 0.6–0.9 m) and door-leaf swing, window slabs,
the grand stair (flight, foot, head), a 0.8 m corridor along every route leg, and every reading pose (player radius).
Openings are mirrored from the `wall()` calls, which build the rendered gap and the collider gap from the same
list. Vegetation: e2e checks every instance against building footprints (§8 finding).

New ids: interactables above; sources `s.b01.table`, `EB.folio.{stars,plants,travel}` (canon; were `s.b01.folio.{I,II,III}`), `s.b01.pair.{sterren,reizen,planten}`,
`s.b01.clip.*`, `s.b01.card`, `s.ds01.{note,album,letter,photo}`; flags `b01Solved`; results `drawer.solved`,
`drawer.register`, `b01.solved`, `b01.studyKey`, `ds01.memory`, `legacy.<puzzleId>`; hint contexts `drawer`, `b01`.
Changed ids: none (reused `library.desk`, `lock.libraryDesk`, `pk.studyKey`, `pk.ledger`, `hall.drawer`).

## 7. Tests and results

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 137/137 after DEV-01R (102 existing + 35 in `tests/slice.test.ts`; DEV-01: 133/133) |
| `npm run build` | ✅ |
| `npm run e2e` (existing regression, new build) | ✅ 103/103 after DEV-01R (DEV-01: 103/103; baseline before any change: 103/103) — `e2e-regression-results.json` |
| `npm run e2e:dev01` (new) | ✅ 32/32 after DEV-01R (incl. a check that no catalogue / emblem-plan / guestbook-tab interactable exists in the review build) — `e2e-dev01-results.json` |
| `scripts/dev01-compare.mjs` normal game vs base commit | ✅ draw calls and triangles identical at 13 views; pixel deltas within the run-to-run noise floor (§7.2) |

New unit tests cover: B01 all 6 permutations (exactly 1 correct); solve without any observation; remove / swap /
incomplete / neutral wrong set; save/reload before solve, after solve, before reward, after reward; DS01 all 6
visiting orders; C-first; photoFound reward exactly once; back only after turning; no optional state needed by
B01/study lock and DS01 never touches B01; register owned-not-read → no topics; read → exactly the three verbatim;
attention switch → no world-state change; archive → no solve; hints 0–3 + not stored as observations; old-save
migration (solved+key, solved+key in drawer, unsolved with old placements, v3 chain); schema sanitising; placement
keepouts (+ negative cases); normal game has no slice block.
DEV-01R adds: canon ids `EB.folio.*` → round/pointed/square; sheet and room texts carry the canonical detail pairs;
no folder/"map"/werkmap wording anywhere the player reads B01; sheet art has no words; schema 1 → 2 migration of
review saves (slots, observations, pins, question pins, archive).

New browser checks (`scripts/e2e-dev01.mjs`): full route by walking, reticle-verified at all 13 reading poses
(collision + line of sight), stair up/down, return context (dial draft + focus; B01 draft + scroll), register
owned-vs-read, attention, DS01 C front/back, B01 wrong/right/reward, hint menu after solving, save/reload (only
dev01 keys written), C-first + own question + archive, old-save import (study door opens with the imported key; own
save byte-identical), normal game unchanged, culling (shell from outside and inside, area chunks), no targeting of
upstairs evidence through floors, no vegetation inside building footprints, mobile landscape + portrait (tap to
open, ≥ 44 px buttons, no horizontal overflow, panel fits, no click-through), hints 0–3.

### 7.1 Existing regression suite

`node scripts/e2e.mjs` against the new build: **103/103** (full home → finale walkthrough, collision, saves,
touch, WebGL failure, metrics, lighting, art samples). Baseline at `ef6b7c3` before any change: 103/103.

### 7.2 Normal game = base commit, and the cost of the slice (phone quality "low", 844 × 390, SwiftShader)

| View | calls base / normal / dev01 | triangles base / normal / dev01 | normal vs base pixels |
|---|---|---|---|
| forecourt | 139 / 139 / 139 | 141 039 / 141 039 / 141 143 | max Δ 10 |
| hall-wide | 181 / 181 / 178 | 161 554 / 161 554 / 162 228 | identical |
| hall-console | 109 / 109 / 109 | 175 998 / 175 998 / 176 846 | identical |
| hall-maquette | 114 / 114 / 111 | 147 972 / 147 972 / 148 706 | max Δ 2 |
| living-mantel | 95 / 95 / 95 | 156 906 / 156 906 / 157 706 | max Δ 3 |
| library-wide | 47 / 47 / 45 | 56 614 / 56 614 / 57 358 | max Δ 1 |
| library-table | 42 / 42 / 39 | 53 794 / 53 794 / 54 522 | max Δ 1 |
| library-album | 22 / 22 / 23 | 51 874 / 51 874 / 52 732 | max Δ 1 |
| U05-sterren | 35 / 35 / 36 | 54 870 / 54 870 / 55 728 | identical |
| U04-desk | 46 / 46 / 47 | 60 114 / 60 114 / 60 972 | max Δ 1 |
| U04-rack | 29 / 29 / 29 | 25 628 / 25 628 / 26 428 | max Δ 1 |
| U10-botanic | 49 / 49 / 51 | 31 796 / 31 796 / 32 620 | max Δ 1 |
| sauna-lawn | 73 / 73 / 73 | 90 333 / 90 333 / 90 273 | identical |

(Measured after DEV-01R on an idle machine. A run made while the regression suite was running in parallel showed
count swings in the *base* build too, e.g. hall-console 109 → 176 calls: measure these numbers without load.)

Noise floor: the base build compared with itself at the same poses differs by the same order (max Δ 8 at the
forecourt, up to ~200 k pixels at Δ 1–3 in the hall: light-pool convergence and animation timing), so "identical
counts + sub-noise pixel deltas" is the evidence that the normal game did not change. The slice costs −3 … +2 draw
calls and ≈ +0.7–0.9 k triangles per view (one atlas-textured batch per area + three movable folios; the removed
catalogue/plaques/prints pay for most of it). `hall-wide` is over the 150-call phone guide **in the base build
already** (181); unchanged by this slice.

FPS is not measured here (software renderer). Phone frame rate is part of the human review (§ REVIEW_SCRIPT).
Desktop "high" quality (shadows, 1280 × 720) along the walked route: `perf-desktop-high.json` (e.g. library table
52 calls / 99 k tris, U05 61 / 107 k, hall by the maquette 162 / 291 k — the hall exceeds the guide in high mode in
the base game too).

### 7.3 Screenshots (`shots/`, SwiftShader)

| Required view | File |
|---|---|
| start / notebook before register | `01-arrival`, `02-notebook-before-register` |
| notebook after register | `03-notebook-after-register` |
| B01 library panel | `05-b01-library-panel`, `05b-b01-table-world`, `11-b01-drawer-open` |
| each upper cluster | `07b-U05-cluster` (+ `07-U05-clip-overlay`), `08-U04-cluster`, `10-U10-cluster` |
| DS01 A / B / C | `04-ds01-A-maquette-note`, `04b-hall-maquette-view` · `06-ds01-B-letter`, `06b-ds01-B-album-world` · `09-ds01-C-photo-front`, `09b-ds01-C-photo-back`, `09c-U04-rack-world` |
| mobile evidence comparison | `20-…-b01-panel`, `21/22-…-folio-stars(-zoomed)` (landscape + portrait), `23-landscape-clip-rond`, `24-landscape-pair-sterren`, `25/26-landscape-photo-front/back`, `27-landscape-notebook` |
| hints / archive | `13-hints`, `12-notebook-archive` |
| normal game vs base, dev01 views | `compare/<view>-base.jpg`, `compare/<view>-dev01.jpg`, `compare/compare.json` |

No video: the walkthrough is reproducible with `npm run e2e:dev01` (the previous art samples' `.webm` recorder,
`scripts/art-walk.mjs`, was not extended to this route).

## 8. Findings outside the slice

- **Garden scatter inside the sauna** (normal game, existing): the garden exclusion rectangle ends at x 132; the
  barrel sauna spans x 132–136, so two grass/flower instances stand inside it. The review build drops them without
  changing the random sequence (`estate.ts`, gated by `SLICE`); **proposed** for the normal game as the same
  one-line change (all other positions stay identical). Not applied there without approval.
  **DEV-01R decision: stays review-only.** Logged as a separate, proven normal-game bug / follow-up (fix ready,
  RNG-neutral, needs its own approval).
- The hall's wide view exceeds the 150-call phone guide in the base build (181 calls at low quality).

## 9. Deviations from LEVEL_PLAN / Puzzle / UX (known)

**After DEV-01R, remaining:** (1) room aliases G01–U10 and the evidence poses are still the as-built assumption —
LEVEL_LAYOUT.json v0.2 was not available to check them; (2) the literal B01 instruction, hint wording, DS01 texts and
the v0.2 register wording are still provisional; (3) two near-misses stay for the human review: the U04 open suitcase
with luggage labels (`mem.reis.suitcase`, near the drying rack — no straps, no patch, no cut corner) and the U05
tripod telescope (no fork, no screw heads). Everything else from the audit is resolved (`DEV01R_AUDIT.md`).


Because the v0.2 documents were not available, everything that depends on them is a **reconciliation risk**:
room aliases (§6), exact B01 detail pairs and DS01 texts (§5), the upper-loop metrics (the slice uses the current
manor as-built: grand stair, gallery walkway, landing → corridor), and any v0.2 IA details beyond DEV-01 §6
(e.g. how provenance is phrased — the slice uses floor + sequence number and deliberately no room names).
Other deliberate choices to confirm:
- The hint menu also lists *non-slice* riddles of the running game once discovered (e.g. the study desk after the
  key is owned, the basement door after the register is read) with their existing three hints behind level 0.
- Room names are hidden on the floor plans in the review build only (no room labels anywhere).
- U05's lamp defaults to on in the review build (evidence readable on arrival).

## 10. Not implemented (by design)

Full 200 × 180 estate, pond/cottage roll-out, attic, Copacabana Room art pass, B02, C01 light path, route-fragment
finale, BOSLUST rebuild, golf, Wickerman interaction, personal prop catalogue, general art-style roll-out,
deployment or merge. The rest of the iteration-3 game (threads A, C, D) still runs in the review build unchanged,
outside the slice's scope. No phone measurements, no human playtest yet (see REVIEW_SCRIPT.md).

## 11. Files

New: `src/slice/{ids,schema,content,drawings,model,placement,world,ui,start}.ts`, `tests/slice.test.ts`,
`scripts/e2e-dev01.mjs`, `scripts/dev01-compare.mjs`, `docs/dev01/*`.
Changed (each change gated on `SLICE`/`REVIEW === 'dev01'` or additive): `src/core/artflags.ts` (flag),
`src/core/state.ts` (optional `slice` block, dev01 key namespace, read-only main save), `src/core/game.ts`
(one-line hooks), `src/main.ts` (start card, test hook for the route), `src/world/manor.ts` (slice builders, DEV-01R painting captions gated,
plaques/catalogue/prints/register auto-read gated; catalogue split into a function, same build order),
`src/world/estate.ts` (RNG-neutral sauna scatter fix, gated), `src/ui/ui.ts` (modal close callback receives
`silent`), `src/ui/map.ts` (optional `labels`), `src/ui/style.css` (new classes only), `package.json`
(`e2e:dev01`).

## 12. How to run

```bash
npm ci && npm run typecheck && npm test && npm run build
npm run preview &                              # http://localhost:4173/Feh-Lu-We/?review=dev01
npm run e2e:dev01                              # DEV01_ONLY=mainRoute,cFirst,oldSaves,culling,mobile,hints
npm run e2e                                    # existing regression suite
node scripts/dev01-compare.mjs <new> <base>    # needs a build of the base commit served elsewhere
```
Review link (after a deploy, which this task does not do): `…/Feh-Lu-We/?review=dev01` (add `&debug=1` for ids).
