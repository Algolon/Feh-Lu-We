# DEV-01 — Structural & Systems Slice (as built)

Status: **review build, not merged, not deployed.** Opt-in with `?review=dev01`. The normal game is unchanged.
Branch `ccr-928d1d45-tudz6y`. Base commit **`ef6b7c3`**. DEV-01: `6894a89`. DEV-01R (canon reconciliation):
audit `cfb183b`, reconciliation `b250b11`. Design package `docs/design/v0.2/`: `e8217a6`. DEV-01R final (verification
against the real package): audit table `260ae10`, then the final reconciliation commit (see `git log`).

> **DEV-01R final.** The ten design files are now in the repository (`docs/design/v0.2/`, byte-identical to the
> supplied package) and were read in full. Every item the earlier rounds left NIET TOETSBAAR, provisional or derived
> was compared against them — [`DEV01R_AUDIT.md`](DEV01R_AUDIT.md) §7 (table written before any edit) and §8
> (outcome). **All B01 and DS01 player texts are now canon** (§5). One deliberate deviation remains: the three B01
> inspection poses reserved in LEVEL_LAYOUT are not adopted, because as-built furniture occupies them (§9).

Human review script: [`REVIEW_SCRIPT.md`](REVIEW_SCRIPT.md). Screenshots: [`shots/`](shots/). Normal-vs-base and
cost comparison: [`compare/`](compare/).

---

## 1. Inputs and authority — what was actually available

| Input named in the brief | DEV-01 / DEV-01R | DEV-01R final |
|---|---|---|
| Repository HEAD, branch, working tree | ✅ `ef6b7c3`, clean | ✅ |
| `AGENTS.md` | ❌ not in repo | ❌ (repo conventions followed) |
| `Feh-Lu-We_AS_IS_AUDIT.md` | ❌ | ❌ (own as-is reading of the code) |
| LEVEL_PLAN · LEVEL_LAYOUT.json · ADJACENCY_GRAPH · DELTA · INTEGRATION_OPEN (v0.2) | ❌ | ✅ `docs/design/v0.2/` — room aliases verified, maquette reservation adopted, B01 pose reservations compared (§6, §9) |
| PUZZLE_DESIGN v0.2 | ❌ (canon only as quoted in the DEV-01R brief) | ✅ — literal B01 instruction, hints, practice card, Controleer; DS01 ids, texts, hints (§5) |
| UX_GAME_FEEL v0.2 | ❌ | ✅ — labels, hint level 0, HUD opt-in, uncensored invitation (§3) |
| ENVIRONMENT_STORY · ART_BIBLE · ART_TOKENS (internally v0.1) | ❌ | ✅ read; aliases and staging rules used; art direction = future production, not reconciled (no art pass) |

Everything player-facing still lives in one file (`src/slice/content.ts`, ids in `ids.ts`), so later canon
changes stay content edits.

## 2. What was built

Route: forecourt (arrival) → front door → hall (G02) → living room/mantel (G03) → hall console (start drawer,
register) → library (G04) → grand stair → U05 → U04 → U10 → stair → library. All reachable by walking, no teleports
(e2e walks it through real collision).

- **B01 v0.2**: `folio → two physical details → upstairs object pair → physical archive clip → slot shape`.
  Library table: three slots (puntig / rond / vierkant, left → right for a reader facing west), three folios —
  **loose drawing sheets** (*los tekenblad*), each only two pencil sketches: no numeral, no word, no emblem, no room
  name — the literal PD v0.2 instruction on a card, and the **local practice card** (drawn key with three teeth +
  striped cord loop + a drawn wave box; the originals beside it on a wave clip; read from the table panel, never a
  slot or input). Upstairs each room has one small table with **one inspection cluster** (`EB.stars`, `EB.plants`,
  `EB.travel`): both originals and the brass clip **attached** to them — round clip on the closed notebook, pointed
  clip on the glass plate, square clip through the label hole. Canon chain (PD v0.2 §4.2): `EB.folio.stars`
  telescope on vorkvoet with two round screw heads; closed notebook with three holes side by side → round (U05) ·
  `EB.folio.plants` pressed fern under glass with one broad diagonal repair strip; scissors with one angular and one
  round grip → pointed (U10) · `EB.folio.travel` suitcase with two parallel straps and a square middle patch; label
  with the top-right corner cut off → square (U04). Sheets swap and come back freely; placing never judges;
  **Controleer** judges the full set: incomplete = no attempt; complete wrong = one neutral line ("…de lade blijft
  dicht"), counted; correct = the table drawer opens (PuzzleSolved). The studiesleutel is a separate pickup
  (RewardClaimed). Correctness reads the slots only — never observation flags.
- **Removed in the review build** (B01 contract): door plaques with emblems, the library floor plan with emblems
  (emblem dictionary), the guestbook room→tab relation, the old catalogue books/sockets, the botanical room's
  emblem prints, room names on the map's floor plans, and (DEV-01R) the captions "onderweg" / "sterrenkaart" on the
  paintings in U04 / U05.
- **DS01 "De foto die moest drogen"** (PD v0.2 §6, texts literal): A `OA.ds01` — a folded note by the
  **gingerbread maquette**, which now stands at the LEVEL_LAYOUT reservation `ES.gingerbread` (88, 96) in the hall
  (G02); B `OB.ds01` — album *Weekendhuizen* open on the page "Gingerbread house — het eerste huisje" (empty photo
  corners, faded rectangle) with the loose G.M. letter in it: **one reading cluster** on the quiet reading plank in
  the library (G04, ~7 m from the B01 table); C `OC.ds01.front/back` — the image hangs with two wooden pegs on a
  small drying rack by U04's window, **next to two plain suitcases** (~5 m from the B01 desk). The front is a
  stylised picture of the game's gingerbread maquette with its caption (an illustrative proof, never presented as
  an authentic photo). Not pickable, no put-back, no quest state, no checklist, no main-route reward; `photoFound`
  is set (monotone) on the front with the one notice "Afbeelding bewaard in notities", the back only after
  *Omkeren*. Archief: "De foto die moest drogen" with the image, labelled *Bekeken*. Three optional hints (PD §6.6)
  once a DS01 source was seen, titled by what was seen ("Waar hoort deze afbeelding bij?" after C first). DS01 uses
  paper/photo language only (no brass, no clips, no numerals).
- **Start drawer / register**: the iteration-3 mantel drawer is kept. Picking the register up no longer opens it;
  it is read from the bag (*Lezen*). Only then do the three topics appear.
- **Notebook v0.2**: *Waarnemingen · Mijn onderzoek · Archief* (§3).
- **Hints**: only encountered riddles; level 0 names the riddle ("Hulp bij …") and explains the three levels;
  1 Aandacht, 2 Relatie, 3 Oplossing; shown as "Hint n · …", never stored in the notebook.
- **Interaction**: every action label names verb + object ("Openen: deur", "Slot bekijken: lade",
  "Bekijken: objectgroep"); one overlay at a time; return context between panels and the notebook; no
  click-through after closing an overlay.
- **Debug**: `?review=dev01&debug=1` adds room id + v0.2 alias, target id and the slice state to the overlay.

## 3. Notebook / information architecture

| Section | Before the register | After reading the register |
|---|---|---|
| Waarnemingen | only sources actually shown (invitation, read at home) — raw text, picture, provenance ("Boven · waarneming 7 · voor- en achterkant bekeken"), *Vastzetten*, *Opbergen*; empty state "Hier blijven de dingen die je bekijkt." | same |
| Mijn onderzoek | own ideas/questions (*Mijn idee*, dashed card, player-written, with sources *door jou vastgezet*) · Resultaten (*✓ Resultaat bevestigd*) | + **Uit het register**: exactly the three topics with the register's own line, *Mijn aandacht* (one topic, *Aandacht loslaten*) and the opt-in *Mijn aandacht in beeld tonen* |
| Archief | herinneringen (*Herinnering · Bekeken*, DS01 with its image) · what the player put away (*Opgeborgen · door jou*, *Heropenen*) | same |

No relevance score, no "opgelost" badge on sources, no grouping by hidden clue relations, no next steps, no "Volg
deze draad". The HUD shows the chosen attention only after the player switches it on (UX v0.2 §3, default off).
Type labels (UX v0.2 §2.1): **Waargenomen**, **Mijn idee** (dashed), **✓ Resultaat bevestigd**, **Herinnering ·
Bekeken**, **Hint** (only in the hint dialog). The invitation is quoted **in full**, including its sentence about
the three parts of the route — UX v0.2 §3: "niet censureren: wel citeren, nog geen queststructuur ervan maken"
(DEV-01 had dropped that sentence); topics as structure still appear only after the register is read.

## 4. Save / schema contract (chosen)

- `GameState` stays **version 4**. The slice adds one **optional** block `slice` (schema **3** since DEV-01R final,
  `src/slice/schema.ts`), parsed with a sanitiser (garbage → fresh slice; future schema → fresh slice; duplicate
  folios dropped; "back seen" without "front seen" dropped). Older builds simply drop the block.
- **Schema ≤ 2 → 3 (DEV-01R final)**: source ids → canon ids in observations, pins, question pins and the archive:
  `s.b01.pair.*` and `s.b01.clip.*` → `EB.stars` / `EB.plants` / `EB.travel` (the clip is part of its cluster now);
  `s.ds01.note` → `OA.ds01`; `s.ds01.album` and `s.ds01.letter` → `OB.ds01` (one reading cluster); `s.ds01.photo` →
  `OC.ds01` (faces kept; the two faces are logged as `OC.ds01.front` / `OC.ds01.back`). Merged records keep the
  earliest sequence number and all faces. New field `hudAttention` (default false). Unit-tested.
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

## 5. Canon status of the content (after DEV-01R final)

All in `src/slice/content.ts` (+ pictures in `src/slice/drawings.ts`). Source: `docs/design/v0.2/PUZZLE_DESIGN.md`
(PD) and `UX_GAME_FEEL.html` (UX). **Nothing is provisional any more** (`CONTENT_STATUS`, unit-tested: every source
has status `canon`).

| Item | Status | Source |
|---|---|---|
| Folio ids, concept (loose drawing sheets), detail pairs, mapping rond=stars / punt=plants / vierkant=travel | canon, literal transcripts | PD §4.2 |
| Table instruction "Deze losse tekenbladen horen bij drie objectgroepen boven. …" | canon, literal | PD §4.2 |
| Practice card (key with three teeth + striped cord loop, wave tab, drawn wave box) | canon elements; transcript wording ours | PD §4.2 |
| Cluster = both originals + attached clip; ids `EB.stars/plants/travel` | canon | PD §4.2, UX U01, LEVEL_LAYOUT evidence ids |
| Input: select, place, take back/swap, **Controleer** | canon | PD §4.2 |
| B01 hints 1–3 | canon, literal | PD §4.2 |
| Study card in the drawer (refers to the study, no B02 answer) | canon (running game) | PD §4.2 |
| DS01 ids `OA.ds01`, `OB.ds01`, `OC.ds01.front/back` | canon | PD §6.2 |
| DS01 A text, B page title + letter, C raw inspection, C back | canon, literal | PD §6.2 |
| DS01 first-front notice "Afbeelding bewaard in notities"; archive title "De foto die moest drogen" | canon | PD §6.1, §6.4 |
| DS01 hints 1–3 | canon, literal | PD §6.6 |
| Register text and its three topic lines; mantel/drawer rule and hints; invitation | canon (running game), verbatim | UX §3 (invitation not censored) |
| Source titles ("Tafeltje met telescoop en schrift", "Afbeelding aan het droogrek", …), hint context titles | our wording, literal descriptions of what is seen | PD gives no titles; UX §5 "titel die de speler kent" |

DEV-01 → DEV-01R → final, for the record: folders "Map I/II/III" → loose sheets (DEV-01R); provisional detail
pairs → canon pairs (DEV-01R); provisional instruction/hints/DS01 texts (tea, "J.", "huisje aan het water") →
literal PD v0.2 texts (final); separate clip cards → clips attached to the clusters (final).

## 6. As-built slice layout and ids

Room ids are the **existing** ones; the G/U labels are aliases (`src/slice/ids.ts`): G01 `vestibule`, G02 `hall`,
G03 `living`, G04 `library`, U04 `reis`, U05 `sterren`, U10 `botanic` — **verified** against ENVIRONMENT_STORY §5
(discipline aliases), LEVEL_PLAN §12 and LEVEL_LAYOUT `rooms`/`source.rooms` (same ids, same bounds). No geometry was
moved: the current manor already contains every slice room, the grand stair and the upper loop; the slice adds
furniture and evidence only.

One record set (`src/slice/placement.ts`) drives both the props and the validator:

| Prop (plan m, X east / Z north) | Room | Footprint | Interactables (reading pose) |
|---|---|---|---|
| `ds01.maquetteTable` (88.0, 96.0) = LEVEL_LAYOUT `ES.gingerbread` | hall (G02), west flank in front of the lobby arch | 0.62 × 1.1 | `ds01.note` (88.0, 94.6) |
| `b01.tableTop` (80.6, 101.2) — the iteration-3 reading table, chairs moved to its west side; practice card at its south end | library (G04) | 1.1 × 2.2 | `b01.table` (81.85, 101.2); drawer `library.desk` → `pk.studyKey`, `b01.card` |
| `ds01.sideTable` (74.55, 106.6) — reading plank | library reading corner | 0.7 × 0.9 | `ds01.album` (album page + letter) (75.75, 106.6) |
| `b01.sterrenTable` (79.0, 93.45) under the wall star chart | U05 | 1.0 × 0.5 | `b01.pair.sterren` → `EB.stars` (79.0, 92.35) |
| `b01.reisDesk` (78.6, 86.4) north wall | U04 | 1.1 × 0.5 | `b01.pair.reizen` → `EB.travel` (78.6, 85.3) |
| `ds01.rack` (82.2, 81.2) in front of the SE window | U04 | 0.55 × 0.3 × 1.0 h (collider) | `ds01.photo` → `OC.ds01` (82.2, 82.45) |
| `ds01.cases` (81.35, 81.05) two plain suitcases beside the rack | U04 | 0.7 × 0.4 × 0.55 h (collider) | — |
| `b01.botanicTable` (101.75, 84.0) west wall (no windows) | U10 | 0.5 × 1.0 | `b01.pair.planten` → `EB.plants` (102.9, 84.0) |

Keepouts checked by `validatePlacement()` (unit-tested, incl. negative cases): inside the room clear of wall slabs
(so never through a door or window), clear of every route opening (± 0.6–0.9 m) and door-leaf swing, window slabs,
the grand stair (flight, foot, head), a 0.8 m corridor along every route leg, and every reading pose (player radius).
Openings are mirrored from the `wall()` calls, which build the rendered gap and the collider gap from the same
list. Vegetation: e2e checks every instance against building footprints (§8 finding).

New ids: interactables above; sources `s.b01.table`, `s.b01.practice`, `EB.folio.{stars,plants,travel}`,
`EB.{stars,plants,travel}`, `s.b01.card`, `OA.ds01`, `OB.ds01`, `OC.ds01` (faces `OC.ds01.front/back`); flags
`b01Solved`; results `drawer.solved`, `drawer.register`, `b01.solved`, `b01.studyKey`, `ds01.memory`,
`legacy.<puzzleId>`; hint contexts `drawer`, `b01`, `ds01`. Retired (migrated): `s.b01.pair.*`, `s.b01.clip.*`,
`s.ds01.{note,album,letter,photo}`, interactables `b01.clip.*`, `ds01.letter`.
Changed ids: none (reused `library.desk`, `lock.libraryDesk`, `pk.studyKey`, `pk.ledger`, `hall.drawer`).

## 7. Tests and results

| Check | Result |
|---|---|
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 142/142 after DEV-01R final (102 existing + 40 in `tests/slice.test.ts`; DEV-01R: 137/137) |
| `npm run build` | ✅ |
| `npm run e2e` (existing regression, new build) | ✅ 103/103 after DEV-01R final (DEV-01R and DEV-01: 103/103; baseline: 103/103) — `e2e-regression-results.json` |
| `npm run e2e:dev01` (new) | ✅ 34/34 after DEV-01R final (DEV-01R: 32/32) — `e2e-dev01-results.json` |
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
DEV-01R final adds/changes: the 6 permutations go through *Controleer*; placing never judges, incomplete
*Controleer* = no attempt; literal PD instruction, hints and detail transcripts; clusters carry their attached clip
(`EB.stars/plants/travel`); practice card neither gates nor counts; literal DS01 texts (nothing left of the
provisional ones) and face event ids `OC.ds01.front/back`; DS01 hints (none before a source, encounter titles, C
first, no reward); full invitation before the register without topics; HUD attention opt-in (default off, no world
change); schema ≤ 2 → 3 migration (merge rules); every source `canon`.

DEV-01R final browser checks add: literal instruction + practice card + *Controleer* on an incomplete set; cluster
overlay text with the attached clip and no separate clip target; album page + letter as one cluster; the one
"Afbeelding bewaard in notities" notice and the literal back after *Omkeren*; DS01 hint after C first; HUD label
off until opt-in; *Waargenomen* / *Mijn idee* / *Door jou vastgezet* / *✓ Resultaat bevestigd* / *Herinnering ·
Bekeken*; hint level 0 explains *Aandacht · Relatie · Oplossing*.
New browser checks (`scripts/e2e-dev01.mjs`): full route by walking, reticle-verified at all reading poses
(collision + line of sight), stair up/down, return context (dial draft + focus; B01 draft + scroll), register
owned-vs-read, attention, DS01 C front/back, B01 wrong/right/reward, hint menu after solving, save/reload (only
dev01 keys written), C-first + own question + archive, old-save import (study door opens with the imported key; own
save byte-identical), normal game unchanged, culling (shell from outside and inside, area chunks), no targeting of
upstairs evidence through floors, no vegetation inside building footprints, mobile landscape + portrait (tap to
open, ≥ 44 px buttons, no horizontal overflow, panel fits, no click-through), hints 0–3.

### 7.1 Existing regression suite

`node scripts/e2e.mjs` against the DEV-01R final build: **103/103** (full home → finale walkthrough, collision,
saves, touch, WebGL failure, metrics, lighting, art samples). Baseline at `ef6b7c3` before any change: 103/103.

### 7.2 Normal game = base commit, and the cost of the slice (phone quality "low", 844 × 390, SwiftShader)

| View | calls base / normal / dev01 | triangles base / normal / dev01 | normal vs base pixels |
|---|---|---|---|
| forecourt | 139 / 139 / 139 | 141 039 / 141 039 / 141 143 | max Δ 11 |
| hall-wide | 181 / 181 / 178 | 161 554 / 161 554 / 162 272 | max Δ 1 |
| hall-console | 109 / 109 / 109 | 175 998 / 175 998 / 176 888 | max Δ 1 |
| hall-maquette (pose moved to the new maquette spot) | 130 / 130 / 127 | 153 968 / 153 968 / 154 686 | max Δ 1 |
| living-mantel | 95 / 95 / 95 | 156 906 / 156 906 / 157 754 | identical |
| library-wide | 47 / 47 / 45 | 56 614 / 56 614 / 57 402 | max Δ 1 |
| library-table | 42 / 42 / 39 | 53 794 / 53 794 / 54 572 | max Δ 1 |
| library-album | 22 / 22 / 23 | 51 874 / 51 874 / 52 782 | max Δ 1 |
| U05-sterren | 35 / 35 / 36 | 54 870 / 54 870 / 55 772 | identical |
| U04-desk | 46 / 46 / 47 | 60 114 / 60 114 / 61 016 | identical |
| U04-rack | 29 / 29 / 29 | 25 628 / 25 628 / 26 470 | max Δ 1 |
| U10-botanic | 49 / 49 / 51 | 31 796 / 31 796 / 32 662 | max Δ 1 |
| sauna-lawn | 73 / 73 / 73 | 90 333 / 90 333 / 90 273 | identical |

(Measured after DEV-01R final on an idle machine; DEV-01R final changes no normal-game code — only `src/slice/*`
and one CSS rule on a slice-only class. The forecourt's max Δ 11 is foliage/flame animation timing (base vs base:
max Δ 8 there). A run made while the regression suite was running in parallel showed
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
| each upper cluster | `07b-U05-cluster` (+ `07-U05-clip-overlay`: the cluster overlay with its attached clip), `08-U04-cluster`, `10-U10-cluster` |
| DS01 A / B / C | `04-ds01-A-maquette-note`, `04b-hall-maquette-view` · `06-ds01-B-letter`, `06b-ds01-B-album-world` · `09-ds01-C-photo-front`, `09b-ds01-C-photo-back`, `09c-U04-rack-world` |
| mobile evidence comparison | `20-…-b01-panel`, `21/22-…-folio-stars(-zoomed)` (landscape + portrait), `24-landscape-pair-sterren`, `23-landscape-cluster-zoomed`, `25/26-landscape-photo-front/back`, `27-landscape-notebook` |
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

## 9. Deviations from LEVEL_PLAN / Puzzle / UX (known, after DEV-01R final)

1. **B01 inspection poses (MINOR, deliberately not moved).** LEVEL_LAYOUT `evidence_reservations` reserve reis
   (81.5, 83) facing W/N, sterren (76.5, 90) facing W, botanic (104.5, 88) facing E, 1.2 m clear. In the as-built
   rooms those spots are occupied (sterren: the bed spans x 73.9–76.1 directly west of the pose; botanic: the
   existing 1.2 × 2.4 m table covers (104.5, 88)). Adopting them means restaging three rooms, which LEVEL_PLAN §11/§14
   assigns to the later, separately authorised blockout ("design only; not implemented"). The slice keeps the parts
   of the contract that apply to as-built rooms: right room, reachable before the study key, approached by real
   controls, ≥ 1.2 m clear around each pose except the target surface (nearest other furniture ≥ 2.3 m), and the
   reservation status "preferred candidate" is respected. Follow-up: restage U04/U05/U10 to the reserved poses with
   the blockout.
2. **Maquette size/art (not reconciled).** ENVIRONMENT_STORY PB01 proposes a 0.7–0.9 m wide gingerbread maquette with
   sugar seams; the blockout model is ≈ 0.46 × 0.66 m with icing strips. Art direction is out of DEV-01R scope.
3. **Near-misses kept on purpose** (PD §4.2 allows decorative stars/plants/suitcases that never duplicate the full
   pair): U04 open suitcase with luggage labels (`mem.reis.suitcase`), U05 tripod telescope, U10 herbarium.
4. **Not built (not in the slice contract):** UX's optional "Laatst bekeken" resume view; a maquette inspection
   (PD OV01 / ES §7: optional).

Other deliberate choices to confirm:
- The hint menu also lists *non-slice* riddles of the running game once discovered (e.g. the study desk after the
  key is owned, the basement door after the register is read) with their existing three hints behind level 0.
- Room names are hidden on the floor plans in the review build only (no room labels anywhere).
- U05's lamp defaults to on in the review build (evidence readable on arrival).
- Provenance uses floor + sequence number ("Boven · waarneming 7"), never a room name the player may not know.

## 10. Not implemented (by design)

Full 200 × 180 estate, pond/cottage roll-out, attic, Copacabana Room art pass, B02, C01 light path, route-fragment
finale, BOSLUST rebuild, golf, Wickerman interaction, personal prop catalogue, general art-style roll-out,
deployment or merge. The rest of the iteration-3 game (threads A, C, D) still runs in the review build unchanged,
outside the slice's scope. No phone measurements, no human playtest yet (see REVIEW_SCRIPT.md).

## 11. Files

New: `src/slice/{ids,schema,content,drawings,model,placement,world,ui,start}.ts`, `tests/slice.test.ts`,
`scripts/e2e-dev01.mjs`, `scripts/dev01-compare.mjs`, `docs/dev01/*`; design sources `docs/design/v0.2/*` (unchanged
copies, `e8217a6`).
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
